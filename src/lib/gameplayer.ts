import assert from "assert";
import GameContext from "./gamecontext";
import GameInfo from "./gamebase";

export interface PlayerState {
  [x: string]: any;
}

export default class GamePlayer extends GameContext {
  identity: string;
  _score: number | null;
  genetic: boolean;
  magic: boolean;
  data: PlayerState;
  name: string;

  constructor() {
    super();

    this.identity = "";
    this.name = "";
    this._score = null;
    this.genetic = false;
    this.data = {};

    // The magic flag is true for bots that use the magic batch runner (e.g. omnibot).
    this.magic = false;
  }

  /**
   * Clone from another GamePlayer-derived object.
   * @param other GamePlayer object.
   */
  public clone_from(other: GamePlayer) {
    this.setState(other.getState());
  }

  /**
   * Get the player's score.
   */
  public get score(): number {
    assert.ok(this._score != null, "Bot score accessed before game end!");
    return this._score;
  }

  /**
   * Set the player's score.
   */
  public set score(value: number) {
    this._score = value;
  }

  /**
   * Clear the player's score.
   */
  public clearScore() {
    this._score = null;
  }

  /**
   * Get a label with which to identify the player.
   */
  public get label(): string {
    return `${this.constructor.name} (${this.identity})`;
  }

  /**
   * Store a key/value pair against the player state.
   * @param key    Key to store.
   * @param value  Value to store.
   */
  public setData(key: string, value: any): void {
    this.data[key] = value;
  }

  /**
   * Retrieve the value from the player state for the specified key.
   * @param key           Key to retrieve the value for.
   * @param defaultValue  Default value if the key is not set.
   */
  public getData(key: string, defaultValue?: any): any {
    return this.data.hasOwnProperty(key) ? this.data[key] : defaultValue;
  }

  /**
   * Get player state.
   */
  public toDict(): PlayerState {
    let state = Object.assign({ name: this.name }, this.data);
    return Object.assign(state, this.getState());
  }

  /**
   * Update the player's state from the specified object.
   * @param state PlayerState object.
   */
  public fromDict(state: PlayerState): void {
    this.data = Object.assign({}, state);
    this.setState(this.data);
  }

  /**
   * Get player state. Override as needed.
   */
  public getState(): PlayerState {
    return {};
  }

  /**
   * Set the player state. Override as needed.
   * @param state PlayerState object.
   */
  public setState(state: PlayerState): void {}

  /**
   * Create the bot. Called immediately following instantiation.
   * @param gameInfo GameInfo object.
   */
  public create(gameInfo: GameInfo): void {}

  /**
   * Mutate the bot's state (genetic bots only).
   */
  public mutate(): void {
    assert.ok(this.genetic, "Attempted to mutate non-genetic bot!");
  }

  /**
   * Set up this bot. Called before every game.
   */
  public setup(): void {}

  /**
   * Process one game turn
   * @param inputs          Array of inputs.
   * @param availableMoves  Array of available moves.
   */
  public process(inputs: number[], availableMoves: number[]): number {
    return 0.0;
  }

  /**
   * Process one game turn using the magic batch.
   * @param inputs          Array of inputs.
   * @param availableMoves  Array of available moves.
   */
  public processMagic(inputs: number[], availableMoves: number[]): number[] {
    return [0.0];
  }

  /**
   * Allow bot to see final result.
   * @param data Miscellaneous GameState data. Check the type before use.
   */
  public showResult(data: any): void {}
}
