/**
 * Generic game object. All games derive from this.
 */
import assert from "assert";

import GameContext from "./gamecontext";
import { GamePlayer } from "./gameplayer";
import GameResult from "./gameresult";
import { GameCreateError } from "./errors";

export interface GameInfo {
  inputCount: number;
  outputCount: number;
}

export interface GameState {
  [x: string]: any;
}

export class GameBase extends GameContext {
  public readonly identities: string[] = ["1", "2"];
  protected readonly inputCount: number = 0;
  protected readonly outputCount: number = 0;

  protected bots: GamePlayer[];
  protected currentBotIndex: number;
  protected numTurns: { [x: string]: number };

  constructor() {
    super();
    this.bots = [];
    this.currentBotIndex = 0;
    this.numTurns = {};
  }

  /**
   * Get the static GameInfo object for this game.
   */
  public getGameInfo(): GameInfo {
    return {
      inputCount: this.inputCount,
      outputCount: this.outputCount
    };
  }

  /**
   * Get the identity with the specified index.
   * @param index Index of identity to get.
   */
  protected getIdentity(index: number): string {
    return this.identities[index];
  }

  /**
   * Get current identity.
   */
  protected get currentIdentity(): string {
    return this.getIdentity(this.currentBotIndex);
  }

  /**
   * Get the number of identities.
   */
  protected get identityCount(): number {
    return this.identities.length;
  }

  /**
   * Set the bots for this game.
   * @param bots Array of GamePlayer objects.
   */
  public setBots(bots: GamePlayer[]): void {
    this.bots = bots.slice();
    assert.equal(
      this.identityCount,
      this.bots.length,
      `Unexpected number of bots provided. Expected ${this.identityCount}, got ${this.bots.length}`
    );
  }

  /**
   * Start a new game.
   * @param bots The list of bots to play the game against.
   */
  public start(bots: GamePlayer[]): void {
    if (!this.inputCount) {
      throw new GameCreateError("Game inputCount has not been set!");
    }

    this.setBots(bots);

    this.bots.forEach((bot, i) => {
      bot.identity = this.getIdentity(i);
      bot.setup();
    });

    this.identities.forEach(identity => {
      this.numTurns[identity] = 0;
    });
    this.currentBotIndex = 0;
  }

  /**
   * Run this game and return the result.
   */
  public run(): GameResult {
    while (!this.isEnded()) {
      this.doTurn();
    }
    return this.processResult();
  }

  /**
   * Load game from saved state.
   * @param bots List of bots.
   * @param state Saved game state.
   */
  public loadFromState(bots: GamePlayer[], state: GameState): void {
    this.start(bots);
    this.fromDict(state);
  }

  /**
   * Convert game state to dict. Subclasses should override getState() instead.
   */
  public toDict(): GameState {
    let state = {
      numTurns: this.numTurns,
      currentBotIndex: this.currentBotIndex
    };
    return Object.assign(state, this.getState());
  }

  /**
   * Set state from dict. Subclasses should override setState() instead.
   * @param state The game state to load from.
   */
  public fromDict(state: GameState): void {
    this.numTurns = Object.assign({}, state.numTurns);
    this.currentBotIndex = state.currentBotIndex;
    this.setState(Object.assign({}, state));
  }

  /**
   * Process one game turn.
   */
  public doTurn(): GameState[] {
    let bot = this.bots[this.currentBotIndex];
    this.numTurns[this.currentIdentity]++;
    let [inputs, availableMoves] = this.getInputs(this.currentIdentity);
    assert.equal(
      inputs.length,
      this.inputCount,
      `Incorrect number of inputs returned from getInputs(): Expected ${this.inputCount}, got ${
      inputs.length
      }`
    );

    const outputStates: GameState[] = [];
    if (bot.magic) {
      const outputs = bot.processMagic(inputs, availableMoves);

      // For each output, we apply the move, save the state, add it to the outputs,
      // then revert back to the current state.
      const curState = this.toDict();
      for (let output of outputs) {
        this.update(this.currentIdentity, output);
        this.currentBotIndex++;
        if (this.currentBotIndex >= this.bots.length) {
          this.currentBotIndex = 0;
        }

        outputStates.push(this.toDict());
        this.fromDict(curState);
      }
    } else {
      const output = bot.process(inputs, availableMoves);
      this.update(this.currentIdentity, output);

      this.currentBotIndex++;
      if (this.currentBotIndex >= this.bots.length) {
        this.currentBotIndex = 0;
      }
      outputStates.push(this.toDict());
    }

    return outputStates;
  }

  /**
   * Process and return the game result.
   */
  public processResult(): GameResult {
    const result = this.getResult();
    this.bots.forEach((bot, i) => {
      bot.score = result.getScore(this.identities[i]);
    });
    return result;
  }

  /****************************************************************************
   * GAME METHODS: Game is defined by the following overridden methods.
   ****************************************************************************/

  /**
   * Set the initial game state.
   */
  public setInitialState(): void { }

  /**
   * Apply state to this game object.
   * @param state GameState object
   */
  protected setState(state: GameState): void { }

  /**
   * Get the game state.
   */
  protected getState(): GameState {
    return {};
  }

  /**
   * Convert current game state into a list of player-specific inputs.
   * @param identity The current identity.
   */
  protected getInputs(identity: string): [number[], number[]] {
    return [[], []];
  }

  /**
   * Update the game state based on the specified output.
   * @param identity The current identity.
   * @param output   The move to apply.
   */
  protected update(identity: string, output: number): void { }

  /**
   * Return true if the game has ended, otherwise false.
   */
  public isEnded(): boolean {
    return true;
  }

  /**
   * Process and return the game result.
   */
  protected getResult(): GameResult {
    return new GameResult();
  }
}
