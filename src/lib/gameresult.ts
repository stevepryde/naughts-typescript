import assert from "assert";

interface GameScores {
  [index: string]: number;
}

enum GameStatus {
  STATUS_NONE,
  STATUS_WIN,
  STATUS_TIE,
  STATUS_BATCH
}

export default class GameResult {
  scores: GameScores;
  status: GameStatus;
  winner: string;

  constructor() {
    this.scores = {};
    this.status = GameStatus.STATUS_NONE;
    this.winner = "";
  }

  /**
   * Get string representation.
   */
  public toString(): string {
    switch (this.status) {
      case GameStatus.STATUS_NONE:
        return "Game in progress";
      case GameStatus.STATUS_TIE:
        return "RESULT: Tie";
      case GameStatus.STATUS_WIN:
        return `RESULT: ${this.getWinner()} wins!`;
      case GameStatus.STATUS_BATCH:
        return `BATCH RESULT: ${this.scores}`;
      default:
        assert.fail("Invalid result!");
    }
    return "Invalid Result";
  }

  /**
   * Set the score for the specified identity.
   * @param identity Player identity.
   * @param score    Player score.
   */
  public setScore(identity: string, score: number): void {
    this.scores[identity] = score;
  }

  /**
   * Get the score for the specified identity.
   * @param identity Player identity
   */
  public getScore(identity: string): number {
    assert.ok(this.scores.hasOwnProperty(identity), "Score accessed before it was set!");
    return this.scores[identity];
  }

  /**
   * Get the game winner's identity.
   */
  public getWinner(): string {
    if (this.winner) {
      return this.winner;
    }

    // Otherwise infer it from score.
    assert.ok(Object.keys(this.scores).length > 0, "BUG: No winner - no scores set yet!");

    // Return the identity (key) corresponding to the highest score (value).
    return Object.keys(this.scores).reduce((a, b) => (this.scores[a] > this.scores[b] ? a : b));
  }

  /**
   * Set game status to win.
   */
  public setWin(): void {
    this.status = GameStatus.STATUS_WIN;
  }

  /**
   * Set game status to tie.
   */
  public setTie(): void {
    this.status = GameStatus.STATUS_TIE;
  }

  /**
   * Set game status to batch.
   */
  public setBatch(): void {
    this.status = GameStatus.STATUS_BATCH;
  }

  /**
   * Return true if game has a winner.
   */
  public isWin(): boolean {
    return this.status === GameStatus.STATUS_WIN;
  }

  /**
   * Return true if game is a draw.
   */
  public isTie(): boolean {
    return this.status === GameStatus.STATUS_TIE;
  }

  /**
   * Return true if game result is from a batch.
   */
  public isBatch(): boolean {
    return this.status === GameStatus.STATUS_BATCH;
  }
}
