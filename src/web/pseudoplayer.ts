import { GamePlayer } from "../lib/gameplayer";

export default class PseudoPlayer extends GamePlayer {
  constructor(public move: number) {
    super();
  }

  /**
   * Process one game turn
   * @param inputs          Array of inputs.
   * @param availableMoves  Array of available moves.
   */
  public process(inputs: number[], availableMoves: number[]): number {
    return this.move;
  }
}
