import GamePlayer from "../../lib/gameplayer";

export default class RandomBot extends GamePlayer {
  public process(inputs: number[], availableMoves: number[]): number {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }
}
