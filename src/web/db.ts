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
      `CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE,
        recipe TEXT
      );`
    );
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

  async insertBot(name: string, recipe: string): Promise<string> {
    let res = await this.query(`SELECT * FROM recipes WHERE name = $1`, [name.trim()]);
    if (res.rows.length === 0) {
      res = await this.query(
          `INSERT INTO recipes(name,recipe) VALUES ($1,$2) RETURNING id`,
          [name.trim(), recipe.trim()]
      );
      return res.rows[0].id as string;
    } else {
      await this.query(`UPDATE recipes SET(recipe=$1) WHERE id = $2`, [recipe.trim(), res.rows[0].id]);
      return res.rows[0].id as string;
    }
  }

  async loadBot(botId: string): Promise<string | null> {
    let res = await this.query(`SELECT * FROM recipes WHERE id = $1`, [botId.trim()]);
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0].recipe;
  }

  async getTop(name: string): Promise<PlayerState | null> {
    let res = await this.query(
      `SELECT * FROM recipes WHERE name = $1`,
      [name.trim()]
    );
    if (res.rows.length === 0) {
      return null;
    }

    let item = res.rows[0];
    return {
      name: item.name,
      recipe: item.recipe
    };
  }

  async clearBots(name: string): Promise<void> {
    await this.query(`DELETE FROM recipes WHERE name = $1`, name);
  }
}

const db = new DB();
export default db;
