import { GamePlayer } from "../../lib/gameplayer";

export default class OmniBot extends GamePlayer {
  constructor() {
    super();

    this.magic = true;
  }

  public processMagic(inputs: number[], availableMoves: number[]): number[] {
    return availableMoves;
  }
}
