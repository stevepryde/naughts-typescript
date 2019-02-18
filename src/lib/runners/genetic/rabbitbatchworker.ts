import { BatchConfig } from "../../gameconfig";
import { PlayerState, GamePlayer } from "../../gameplayer";
import GameContext from "../../gamecontext";
import BotFactory from "../../botfactory";
import Batch from "../../batch";

export interface BatchInputData {
  batchConfig: BatchConfig;
  botData: PlayerState[];
  geneticIndex: number;
  sample: number;
  scoreThreshold: number;
  qid: string;
}

export interface BatchOutputData {
  qid: string;
  botData: PlayerState;
  geneticScore: number;
  sample: number;
}

export function runOneBatch(batchData: BatchInputData): BatchOutputData {
  let context = new GameContext();
  let bots: GamePlayer[] = [];

  for (let botData of batchData.botData) {
    let bot = new BotFactory(context, batchData.batchConfig.botConfig).createBot(botData.name);
    bot.fromDict(botData);
    bots.push(bot);
  }

  let batch = new Batch(bots, batchData.batchConfig);
  let batchResult = batch.runBatch();
  let geneticIdentity = batch.identities[batchData.geneticIndex];
  let geneticScore = batchResult.getScore(geneticIdentity);

  let win = geneticScore > batchData.scoreThreshold ? "*" : "";
  console.log(
    `Completed batch for sample ${batchData.sample.toFixed(5)} :: score = ${geneticScore.toFixed(
      3
    )} ${win}`
  );

  return {
    qid: batchData.qid,
    botData: batch.bots[batchData.geneticIndex].toDict(),
    geneticScore: geneticScore,
    sample: batchData.sample
  };
}
