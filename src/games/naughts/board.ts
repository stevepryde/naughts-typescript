interface BoardState {
  data: string;
}

export default class Board {
  public data: string;
  constructor() {
    this.data = "---------";
  }

  public toDict(): BoardState {
    return { data: this.data };
  }

  public fromDict(d: BoardState): void {
    this.data = d.data;
  }

  public copy(): Board {
    let b = new Board();
    b.data = this.data;
    return b;
  }

  public getAt(pos: number): string {
    let c = this.data.substr(pos, 1);
    if (c == "-") {
      c = " ";
    }
    return c;
  }

  public setAt(pos: number, turn: string): void {
    this.data = this.data.substr(0, pos) + turn + this.data.substr(pos + 1);
  }

  public show(indent: number = 0): void {
    let prefix = "  ";
    if (indent > 0) {
      prefix += " ".repeat(indent);
    }

    let i = 0;
    for (let r = 0; r < 3; r++) {
      console.log(prefix + ` ${this.getAt(i)} | ${this.getAt(i + 1)} | ${this.getAt(i + 2)}`);

      if (r < 2) {
        console.log(prefix + "-----------");
      }

      i += 3;
    }
    console.log("");
  }

  public getGameState(): number {
    let sequences = ["012", "345", "678", "036", "147", "258", "048", "246"];
    for (let seq of sequences) {
      let val = "";
      for (let c of seq.split("")) {
        val += this.getAt(parseInt(c));
      }

      if (val === "XXX") {
        return 1;
      } else if (val === "OOO") {
        return 2;
      }

      let isDraw = true;
      for (let pos = 0; pos < 9; pos++) {
        let val = this.getAt(pos);
        if (val !== "X" && val !== "O") {
          isDraw = false;
          break;
        }
      }

      if (isDraw) {
        return 3;
      }
    }

    return 0;
  }

  public isEnded(): boolean {
    return this.getGameState() != 0;
  }

  public getWinner(): string {
    switch (this.getGameState()) {
      case 1:
        return "X";
      case 2:
        return "O";
      default:
        return "";
    }
  }

  public getAtMulti(posStr: string): string {
    let contents = "";
    for (let n = 0; n < posStr.length; n++) {
      contents += this.getAt(parseInt(posStr.substr(n)));
    }
    return contents;
  }

  public getRotatedBoard(rotations: number): Board {
    rotations = rotations % 4;
    let boardCopy = this.copy();
    let transformMap = [6, 3, 0, 7, 4, 1, 8, 5, 2];

    if (rotations == 0) {
      return boardCopy;
    }

    for (let r = 0; r < rotations; r++) {
      let origData = boardCopy.data;

      let newData = origData.split("");
      transformMap.forEach((pos, index) => {
        newData[index] = origData[pos];
      });

      boardCopy.data = newData.join("");
    }
    return boardCopy;
  }

  public getFirstEmptySpace(positions: string): number {
    let posList = positions.split("");

    for (let pos of posList) {
      if (this.getAt(parseInt(pos)) == " ") {
        return parseInt(pos);
      }
    }
    return -1;
  }

  public getPossibleMoves(): number[] {
    let moves: number[] = [];
    for (let pos = 0; pos < 9; pos++) {
      if (this.getAt(pos) === " ") {
        moves.push(pos);
      }
    }
    return moves;
  }
}
