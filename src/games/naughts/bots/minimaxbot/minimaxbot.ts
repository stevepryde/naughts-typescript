import { randomChoice } from "../../../../lib/support/misc";
import Board from "../../board";
import NaughtsBot from "../naughtsbot";

export default class MinimaxBot extends NaughtsBot {
  doTurn(currentBoard: Board): number {
    let moves = currentBoard.getPossibleMoves();

    // Perform some easy optimisations to avoid using the minimax A-B
    // algorithm more than necessary.

    // First, win if we can.
    let sequences = ["012", "345", "678", "036", "147", "258", "048", "246"];
    for (let seq of sequences) {
      let [ours, theirs, blanks] = this.getSequenceInfo(currentBoard, seq);
      if (ours.length === 2 && blanks.length === 1) {
        return blanks[0];
      }
    }

    // Second, if we cannot win, make sure the opponent cannot win either.
    for (let seq of sequences) {
      let [ours, theirs, blanks] = this.getSequenceInfo(currentBoard, seq);
      if (theirs.length === 2 && blanks.length === 1) {
        return blanks[0];
      }
    }

    // If this is the first move, choose a good default.
    let [ours, theirs, blanks] = this.getSequenceInfo(currentBoard, "012345678");
    if (ours.length === 0) {
      // Are we second?
      if (theirs.length > 0) {
        // Prefer the centre.
        if (moves.indexOf(4) >= 0) {
          return 4;
        }

        // Otherwise take the top left.
        return 0;
      }

      // We are first. Pick one of the corners or the centre.
      return randomChoice([0, 2, 4, 6, 8]);
    }

    // Get a move with the best score...
    let bestScore: number | null = null;
    let choices: number[] = [];
    for (let move of moves) {
      let tempBoard = currentBoard.copy();
      tempBoard.setAt(move, this.identity);
      let score = this.alphaBeta(tempBoard, this.getOpponent(), -999, 999);

      if (bestScore == null || score > bestScore) {
        bestScore = score;
        choices = [move];
      } else if (score === bestScore) {
        choices.push(move);
      }
    }

    // If there are multiple "top" moves we can select one at random.
    return randomChoice(choices);
  }

  getBoardScore(testBoard: Board): number {
    let winner = testBoard.getWinner();
    if (winner) {
      if (winner === this.identity) {
        return 1;
      }

      return -1;
    }

    return 0;
  }

  alphaBeta(
    nodeBoard: Board,
    turn: string,
    alpha: number,
    beta: number,
    depth: number = 0
  ): number {
    let moves = nodeBoard.getPossibleMoves();
    if (moves.length === 0 || nodeBoard.isEnded()) {
      return this.getBoardScore(nodeBoard);
    }

    if (turn === this.identity) {
      let v = -999;
      for (let move of moves) {
        let testBoard = nodeBoard.copy();
        testBoard.setAt(move, turn);
        v = Math.max(v, this.alphaBeta(testBoard, this.getOpponent(turn), alpha, beta, depth + 1));
        alpha = Math.max(alpha, v);
        if (beta <= alpha) {
          break;
        }
      }

      return v;
    }

    let v = 999;
    for (let move of moves) {
      let testBoard = nodeBoard.copy();
      testBoard.setAt(move, turn);
      v = Math.min(v, this.alphaBeta(testBoard, this.getOpponent(turn), alpha, beta, depth + 1));
      beta = Math.min(beta, v);
      if (beta <= alpha) {
        break;
      }
    }

    return v;
  }

  getOpponent(me: string = ""): string {
    if (me.length === 0) {
      me = this.identity;
    }

    if (me === "X") {
      return "O";
    } else {
      return "X";
    }
  }
}
