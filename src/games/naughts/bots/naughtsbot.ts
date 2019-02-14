import assert from "assert";
import { GamePlayer } from "../../../lib/gameplayer";
import Board from "../board";

/**
 * Base class for AI naughts and crosses bots.
 */

export default class NaughtsBot extends GamePlayer {
  private get otherIdentity(): string {
    if (this.identity === "X") {
      return "O";
    }
    return "X";
  }

  public process(inputs: number[], availableMoves: number[]): number {
    assert.equal(
      inputs.length,
      18,
      "BUG: Invalid number of inputs for naughts game: " + inputs.length
    );

    let board = new Board();
    for (let pos = 0; pos < 9; pos++) {
      if (inputs[pos] > 0.0) {
        board.setAt(pos, this.identity);
      } else if (inputs[pos + 9] > 0.0) {
        board.setAt(pos, this.otherIdentity);
      }
    }

    return this.doTurn(board);
  }

  protected doTurn(board: Board): number {
    return 0;
  }

  public showResult(data: any): void {}

  // HELPER METHODS.

  /**
   * Get info about the contents of the positions in the given sequence.
   * @param board The current board.
   * @param sequence The position sequence to get info for.
   * @returns Tuple of 3 lists, containing my positions, their positions, and blank positions.
   */
  protected getSequenceInfo(board: Board, sequence: string): [number[], number[], number[]] {
    let ours: number[] = [];
    let theirs: number[] = [];
    let blanks: number[] = [];

    let seqList: number[] = sequence.split("").map(v => parseInt(v));
    for (let c of seqList) {
      let val = board.getAt(c);
      switch (val) {
        case this.identity:
          ours.push(c);
          break;
        case " ":
          blanks.push(c);
          break;
        default:
          theirs.push(c);
      }
    }

    return [ours, theirs, blanks];
  }

  /**
   * The returned move corresponds to the move we would make on a board rotated
   * clockwise the specified number of times.
   *
   * @param move The move to unrotate.
   * @param rotations The number of 90-degree rotations in a clockwise direction.
   * @return THe move, rotated anti-clockwise by the number of rotations.
   */
  protected getUnrotatedMove(move: number, rotations: number): number {
    let r = rotations % 4;

    // Don't do anything if we don't have to.
    if (r === 0) {
      return move;
    }

    let transformMap = [6, 3, 0, 7, 4, 1, 8, 5, 2];
    for (let i = 0; i < r; i++) {
      move = transformMap[move];
    }

    return move;
  }
}
