import assert from "assert";

import BotFactory from "./botfactory";
import { GameState } from "./gamebase";
import { BatchConfig, BotConfig } from "./gameconfig";
import GameContext from "./gamecontext";
import GameFactory from "./gamefactory";
import { GamePlayer } from "./gameplayer";
import GameResult from "./gameresult";
import { ProcessedBatchInput } from "./runners/genetic/processor";

export default class Batch extends GameContext {
  totalScore: { [x: string]: number };
  wins: { [x: string]: number };
  numDraws: number;
  identities: string[];
  numGamesPlayed: number;
  info: ProcessedBatchInput;
  _gameFactory: GameFactory | null = null;
  _botFactory: BotFactory | null = null;

  constructor(public bots: GamePlayer[], public batchConfig: BatchConfig) {
    super();

    this.totalScore = {};
    this.wins = {};
    this.numDraws = 0;
    this.identities = [];
    this.numGamesPlayed = 0;
    this.info = { generation: 0, sample: 0, index: 0, geneticScore: 0.0 };
  }

  get gameFactory(): GameFactory {
    if (this._gameFactory == null) {
      this._gameFactory = new GameFactory(this);
    }
    return this._gameFactory;
  }

  get botFactory(): BotFactory {
    if (this._botFactory == null) {
      this._botFactory = new BotFactory(this, this.batchConfig.botConfig);
    }
    return this._botFactory;
  }

  public runBatch(): GameResult {
    this.startBatch();
    if (this.batchConfig.magic) {
      this.runMagicBatch();
    } else {
      this.runNormalBatch();
    }
    return this.processBatchResult();
  }

  private startBatch(): void {
    let gameObj = this.gameFactory.getGameObj(this.batchConfig.game);
    this.identities = gameObj.identities.slice();
    for (let identity of this.identities) {
      this.totalScore[identity] = 0;
      this.wins[identity] = 0;
    }

    this.numGamesPlayed = 0;
    this.numDraws = 0;
  }

  private processGameResult(result: GameResult): void {
    this.numGamesPlayed++;
    for (let identity of this.identities) {
      this.totalScore[identity] += result.getScore(identity);
    }

    if (result.isTie()) {
      this.numDraws++;
    } else {
      this.wins[result.getWinner()]++;
    }
  }

  private processBatchResult(): GameResult {
    this.log.info("\nRESULTS:");
    this.log.info(`Games Played: ${this.numGamesPlayed}`);
    this.log.info("");

    this.bots.forEach((bot, i) => {
      let identity = this.identities[i];
      this.log.info(`${bot.name} WINS: ${this.wins[identity]}`);
    });
    this.log.info(`DRAW/TIE: ${this.numDraws}`);
    this.log.info("");

    // Get average scores.
    assert.ok(this.numGamesPlayed > 0, "BUG: No games played!");

    let batchResult = new GameResult();
    batchResult.setBatch();
    this.log.info("\nAverage Scores:");
    this.identities.forEach((identity, i) => {
      this.bots[i].score = this.totalScore[identity] / this.numGamesPlayed;
      batchResult.setScore(identity, this.bots[i].score);
      this.log.info(`${this.bots[i].name}: ${this.bots[i].score}`);
    });

    return batchResult;
  }

  private runNormalBatch(): void {
    this.log.info("\n********** Running Batch **********\n");
    for (let i = 1; i < this.batchConfig.batchSize + 1; i++) {
      let gameObj = this.gameFactory.getGameObj(this.batchConfig.game);
      gameObj.setInitialState();

      let bots = this.botFactory.cloneBots(this.bots);
      gameObj.start(bots);
      let result = gameObj.run();
      this.processGameResult(result);
    }
  }

  private runMagicBatch(): void {
    let startGameObj = this.gameFactory.getGameObj(this.batchConfig.game);
    startGameObj.setInitialState();
    let bots = this.botFactory.cloneBots(this.bots);

    startGameObj.start(bots);
    let startGameState = startGameObj.toDict();
    let gameStack: GameState[] = [startGameState];

    let count = 1;
    this.log.info(`\n********** Running magic game ${count} **********\n`);
    while (gameStack.length > 0) {
      let state = gameStack.shift();
      if (state == null) {
        throw new Error("Invalid game state in game stack!");
      }
      let gameObj = this.gameFactory.getGameObj(this.batchConfig.game);
      gameObj.setBots(bots);
      gameObj.fromDict(state);
      if (gameObj.isEnded()) {
        let result = gameObj.processResult();
        this.processGameResult(result);
      } else {
        let outputStates = gameObj.doTurn();
        for (let outputState of outputStates) {
          count++;
          this.log.info(`\n********** Running game split ${count} **********\n`);
          gameStack.push(outputState);
        }
      }
    }
  }
}
