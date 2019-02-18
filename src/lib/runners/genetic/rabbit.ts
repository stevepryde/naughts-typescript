import amqp = require("amqplib");

const QUEUE_START = "qstart";
const QUEUE_STOP = "qstop";

export class RabbitDisabledError extends Error {}

export class RabbitManager {
  private conn;
  private channel;
  private enabled: boolean;
  private error: string;

  constructor(public host: string, public username: string, public password: string) {
    this.conn = null;
    this.channel = null;
    this.enabled = true;
    this.error = "";

    this.initQueues().catch((err: string) => {
      this.enabled = false;
      this.error = err;
    });
  }

  private async getConnection(): Promise<amqp.Connection> {
    if (!this.enabled) {
      throw new RabbitDisabledError("Rabbit is not enabled");
    }

    if (this.conn == null) {
      this.conn = amqp.connect(`amqp://${this.username}:${this.password}@${this.host}:5672`);
    }

    return this.conn;
  }

  private async getChannel(): Promise<amqp.Channel> {
    if (!this.enabled) {
      throw new RabbitDisabledError("Rabbit is not enabled");
    }

    if (this.channel == null) {
      let conn = await this.getConnection();
      this.channel = await conn.createChannel();
    }

    return this.channel;
  }

  private async initQueues(): Promise<void> {
    let channel = await this.getChannel();
    await channel.assertQueue(QUEUE_START);

    // Output uses an exchange.
    await channel.assertExchange(QUEUE_STOP, "direct");

    /* To receive messages from this exchange, the processor must create a custom queue and
       bind it to the exchange with the specific routing key corresponding to the qid of
       messages it wants to receive.
    */

    // Only fetch 1 job at a time.
    await channel.prefetch(1);
  }

  public async consumeBatchQueue(
    func: (msg: amqp.ConsumeMessage | null) => void
  ): Promise<amqp.Replies.Consume> {
    let channel = await this.getChannel();
    return channel.consume(QUEUE_START, func);
  }
}
