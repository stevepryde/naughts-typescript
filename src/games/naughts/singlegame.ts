import assert from "assert";

import Board from "./board";
import { GameBase, GameState } from "../../lib/gamebase";
import GameResult from "../../lib/gameresult";

export default class SingleGame extends GameBase {
  public identities: string[] = ["X", "O"];
  protected readonly inputCount: number = 18;
  protected readonly outputCount: number = 9;

  private gameBoard: Board = new Board();

  public setInitialState(): void {
    this.gameBoard = new Board();
  }

  protected setState(state: GameState): void {
    this.gameBoard = new Board();
    this.gameBoard.fromDict(state.board);
  }

  protected getState(): GameState {
    return { board: this.gameBoard.toDict() };
  }

  protected getInputs(identity: string): [number[], number[]] {
    let inputs: number[] = [];
    for (let pos = 0; pos < 9; pos++) {
      let c = this.gameBoard.getAt(pos);
      inputs.push(c == identity ? 1.0 : 0.0);
    }

    for (let pos = 0; pos < 9; pos++) {
      let c = this.gameBoard.getAt(pos);
      inputs.push(c == identity || c == " " ? 0.0 : 1.0);
    }
    return [inputs, this.gameBoard.getPossibleMoves()];
  }

  protected update(identity: string, output: number): void {
    let moves = this.gameBoard.getPossibleMoves();
    assert.ok(moves.length > 0, "No valid move available!");

    let targetMove: number | null = null;
    if (moves.length == 1) {
      targetMove = moves[0];
    } else {
      let lowestDiff: number | null = null;
      for (let move of moves) {
        let diff = Math.abs(output - move);
        if (lowestDiff == null || diff < lowestDiff) {
          lowestDiff = diff;
          targetMove = move;
        }
      }
    }

    assert.ok(targetMove != null, "BUG: update() failed to select target move!");
    if (targetMove != null) {
      this.gameBoard.setAt(targetMove, identity);
    }
  }

  public isEnded(): boolean {
    return this.gameBoard.isEnded();
  }

  protected getResult(): GameResult {
    for (let bot of this.bots) {
      bot.showResult(this.gameBoard);
    }

    let result = new GameResult();
    assert.ok(this.bots.length == 2, "BUG: bots have not been set up - was this game started?");

    let outcome = this.gameBoard.getGameState();
    assert.ok(outcome > 0, "BUG: Game ended with invalid state of 0 - was this game finished?");

    let outcomes = [0, 0];
    result.setTie();
    switch (outcome) {
      case 1:
        result.setWin();
        outcomes = [1, -1];
        break;
      case 2:
        result.setWin();
        outcomes = [-1, 1];
        break;
      case 3:
        break;
      default:
        assert.fail("BUG: Invalid game outcome returned from board.getGameState(): " + outcome);
    }

    this.identities.forEach((x, i) => {
      result.setScore(x, this.calculateScore(this.numTurns[x], outcomes[i]));
    });
    return result;
  }

  private calculateScore(numTurns: number, outcome: number): number {
    let score = 10 - numTurns;
    let multiplier = 0;
    if (outcome > 0) {
      multiplier = 1;
    } else if (outcome < 0) {
      multiplier = -10;
    }

    return score * multiplier;
  }
}
