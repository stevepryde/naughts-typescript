import { Pool } from "pg";
import assert from "assert";

import { PlayerState } from "../lib/gameplayer";
const connectionString = "postgresql://" + process.env.NAUGHTS_DB;

class DB {
  private _pool = new Pool({
    connectionString: connectionString
  });
  private ready = false;
  private initPromise: Promise<void>;
  constructor() {
    this.initPromise = this.initDB();
  }

  async initDB(): Promise<void> {
    try {
      await this._pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    } catch (err) {
      // Ignore errors on this.
      // PG is stupid - it will still fail if two processes call this concurrently,
      // which is exactly what happens on startup.
    }

    await this._pool.query(
      `CREATE TABLE IF NOT EXISTS recipe (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name CHAR(255),
        score DECIMAL(10,3),
        botdata TEXT
      );`
    );
    await this._pool.query(`CREATE INDEX IF NOT EXISTS botname ON recipe (name ASC)`);
    await this._pool.query(`CREATE INDEX IF NOT EXISTS botscore ON recipe (name ASC, score DESC)`);
    this.ready = true;
  }

  async getPool(): Pool {
    if (!this.ready) {
      await this.initPromise;
      assert.ok(this.ready, "DB is not ready!");
    }

    return this._pool;
  }

  async query(q: string, ...vars) {
    let pool = await this.getPool();
    return await pool.query(q, ...vars);
  }

  async insertBot(name: string, data: PlayerState, score: number): Promise<string> {
    let res = await this.query(
      `INSERT INTO recipe(name,score,botdata) VALUES ($1,$2,$3) RETURNING id`,
      [name, score, data]
    );
    return res.rows[0].id as string;
  }

  async loadBot(botId: string): Promise<PlayerState | null> {
    let res = await this.query(`SELECT * FROM recipe WHERE id = $1`, [botId]);
    if (res.rows.length === 0) {
      return null;
    }
    return JSON.parse(res.rows[0].data);
  }

  async getTop(name: string, count: number): Promise<PlayerState[]> {
    let res = await this.query(
      `SELECT (botdata) FROM recipe WHERE name = $1 ORDER BY score DESC LIMIT $2`,
      [name, count]
    );
    return res.rows.map(item => {
      return JSON.parse(item.botdata);
    });
  }

  async clearBots(name: string): Promise<void> {
    await this.query(`DELETE FROM recipe WHERE name = $1`, name);
  }
}

const db = new DB();
export default db;
