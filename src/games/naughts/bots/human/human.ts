import readlineSync = require("readline-sync");

import Board from "../../board";
import NaughtsBot from "../naughtsbot";

export default class Human extends NaughtsBot {
  protected doTurn(board: Board): number {
    let moves = board.getPossibleMoves();
    board.show();

    let info = `possible moves are [${moves.map(x => x.toString()).join(",")}]`;

    // If there's only one choice, save ourselves some typing.
    if (moves.length === 1) {
      console.log(`${info} (Automatically choose ${moves[0]})`);
      return moves[0];
    }

    let move = -1;
    while (!moves.includes(move)) {
      let answer = readlineSync.question(info);
      if (answer == null || answer === "") {
        console.log("Quitting...");
        process.exit(1);
      }
      move = parseInt(answer);
      if (move == null) {
        move = -1;
      }
    }

    return move;
  }

  public showResult(data: any): void {
    if (data instanceof Board) {
      console.log("\nGame over:");
      data.show();
    }
  }
}
