import GameContext from "../../gamecontext";
import { GamePlayer, PlayerState } from "../../gameplayer";
import { BatchConfig } from "../../gameconfig";
import Batch from "../../batch";

export interface ProcessedBatchInput {
  generation: number;
  sample: number;
  index: number;
  geneticScore: number;
}

export interface ProcessedBatchOutput {
  botData: PlayerState;
  geneticScore: number;
  sample: number;
}

export class Processor {
  constructor(
    public context: GameContext,
    public otherBot: GamePlayer,
    public geneticIndex: number,
    public batchConfig: BatchConfig
  ) {}

  public *run(
    samples: GamePlayer[],
    generationIndex: number,
    scoreThreshold: number
  ): IterableIterator<ProcessedBatchOutput> {
    let index = 0;
    for (let sample of samples) {
      let botList: GamePlayer[];
      if (this.geneticIndex == 0) {
        botList = [sample, this.otherBot];
      } else {
        botList = [this.otherBot, sample];
      }

      let batch = new Batch(botList, this.batchConfig);
      // batch.label = `Gen ${generationIndex} - Sample ${index}`;
      batch.info = {
        generation: generationIndex,
        sample: index,
        index: this.geneticIndex,
        geneticScore: 0.0
      };

      let batchResult = batch.runBatch();
      let geneticIdentity = batch.identities[this.geneticIndex];
      let geneticScore = batchResult.getScore(geneticIdentity);
      batch.info.geneticScore = geneticScore;

      yield {
        botData: batch.bots[this.geneticIndex].toDict(),
        geneticScore: geneticScore,
        sample: index
      };

      index++;
    }
  }
}
