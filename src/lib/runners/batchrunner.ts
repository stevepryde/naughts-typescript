import GameRunnerBase from "./gamerunnerbase";
import Batch from "../batch";

export default class BatchRunner extends GameRunnerBase {
  public run(): void {
    let bots = this.botFactory.createBots();

    let batch = new Batch(bots, this.config.getBatchConfig());
    batch.log.logToConsole();
    batch.runBatch();
  }
}
