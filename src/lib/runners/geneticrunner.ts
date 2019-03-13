import fs = require("fs");
import path = require("path");
import assert = require("assert");
import { GameConfig } from "../gameconfig";
import GameRunnerBase from "./gamerunnerbase";
import { GamePlayer } from "../gameplayer";
import { Processor } from "./genetic/processor";

export default class GeneticRunner extends GameRunnerBase {
  // private db: BotDB
  // private rabbit: RabbitManager;
  private bots: GamePlayer[];
  private geneticIndex: number;
  private geneticName: string;

  constructor(public config: GameConfig) {
    super(config);
    this.bots = [];
    this.geneticIndex = 0;
    this.geneticName = "";
  }

  private setup(): void {
    this.geneticIndex = 0;

    // Determine which bot is genetic.
    this.bots = this.botFactory.createBots();
    if (!this.bots[0].genetic) {
      this.geneticIndex = 1;
    } else if (this.bots[1].genetic) {
      this.log.warning(
        "GENETICRUNNER: Both bots are genetic. Only first bot will use the genetic algorithm"
      );
      this.geneticIndex = 0;
    }

    // Remember the name of the genetic bot. This is used to generate new ones.
    this.geneticName = this.bots[this.geneticIndex].name;
  }

  public run(): void {
    let startTime = Date.now();
    this.setup();
    let geneticBot = this.bots[this.geneticIndex];
    let otherBot = this.bots[this.geneticIndex == 1 ? 0 : 1];

    if (!geneticBot.genetic) {
      this.log.critical("GENETICRUNNER: Neither bot is a genetic bot!");
      return;
    }

    let selectedSamples: GamePlayer[] = [];
    let lastScores: [string, number][] = [];
    let scoreThreshold: number = -999.0; // This will be reset after first round.

    // TODO: Add rabbit support.

    let processor = new Processor(this, otherBot, this.geneticIndex, this.config.getBatchConfig());

    for (let gen = 0; gen < this.config.numGenerations; gen++) {
      this.log.info("--------------------------");
      this.log.info(`Generation '${gen}':`);

      let newSamples: GamePlayer[];
      if (selectedSamples.length > 0) {
        newSamples = this.generateSamples(selectedSamples, gen);
      } else {
        newSamples = this.generateOriginalSamples(gen, this.config.numSamples);
      }
      console.log;

      if (this.config.wildSamples > 0) {
        newSamples = newSamples.concat(this.generateOriginalSamples(gen, this.config.wildSamples));
      }

      let geneticPool: GamePlayer[] = [];
      for (let batchResult of processor.run(newSamples, gen, scoreThreshold)) {
        let sample = this.botFactory.createBot(this.geneticName);
        sample.fromDict(batchResult.botData);
        sample.score = batchResult.geneticScore;
        geneticPool.push(sample);

        let win = sample.score > scoreThreshold ? "*" : "";
        let sampleScore = sample.score.toFixed(3);
        this.log.debug(
          `Completed batch for sample ${batchResult.sample} :: score = ${sampleScore} ${win}`
        );
      }

      let filteredPool = geneticPool.filter(bot => {
        return bot.score > scoreThreshold;
      });
      if (filteredPool.length === 0) {
        this.log.info(`Generation ${gen} :: No improvement - will generate more samples`);
        this.log.info(`Current best score: ${scoreThreshold}`);
        // for (let [score] of lastScores) {
        //   this.log.info(`SCORE ${score}`);
        // }
        continue;
      }

      if (filteredPool.length < selectedSamples.length) {
        filteredPool = filteredPool.concat(
          selectedSamples.slice(0, selectedSamples.length - filteredPool.length)
        );
      }

      let sortedPool = filteredPool
        .sort((botA, botB) => {
          return botA.score - botB.score;
        })
        .reverse();
      selectedSamples = this.selectSamples(sortedPool);

      let selectedScores: string[] = [];
      lastScores = [];
      for (let sample of selectedSamples) {
        if (sample.score > scoreThreshold) {
          scoreThreshold = sample.score;
        }

        selectedScores.push(sample.score.toFixed(3));
      }

      this.log.info(`Generation ${gen} highest scores: [${selectedScores.join(", ")}]`);

      let content = `${gen},${selectedScores[0]}`;
      fs.appendFileSync(path.join(this.path, "scores.csv"), content);
    }

    let endTime = Date.now();
    let duration = (endTime - startTime) / 1000.0;
    this.log.info(`Completed in ${duration.toFixed(2)} seconds`);
  }

  private generateSamples(inputSamples: GamePlayer[], generation: number): GamePlayer[] {
    let samplesOut: GamePlayer[] = [];

    for (let sample of inputSamples) {
      samplesOut.push(sample);

      for (let i = 1; i < this.config.numSamples; i++) {
        let botObj = this.botFactory.createBot(this.geneticName);
        let sampleData = sample.toDict();
        botObj.fromDict(sampleData);
        assert.equal(
          JSON.stringify(botObj.toDict()),
          JSON.stringify(sampleData),
          "New sample not identical to old sample!"
        );
        botObj.mutate();
        if (botObj.toDict() === sampleData) {
          this.log.warning("Sample did not mutate");
        }
        samplesOut.push(botObj);
      }
    }
    return samplesOut;
  }

  private generateOriginalSamples(generation: number, count: number): GamePlayer[] {
    let samplesOut: GamePlayer[] = [];
    let gameObj = this.gameFactory.getGameObj(this.config.game);
    for (let i = 0; i < count; i++) {
      let botObj = this.botFactory.createBot(this.geneticName);
      botObj.create(gameObj.getGameInfo());
      samplesOut.push(botObj);
    }
    return samplesOut;
  }

  private selectSamples(sortedPool: GamePlayer[]): GamePlayer[] {
    let keep = this.config.keepSamples;
    if (keep > sortedPool.length) {
      keep = sortedPool.length;
    }

    return sortedPool.slice(0, keep);
  }
}
