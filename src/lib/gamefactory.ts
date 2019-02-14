import GameContext from "./gamecontext";
import { GameBase } from "./gamebase";

import NaughtsGame from "../games/naughts/singlegame";

const GameClasses = {
  naughts: NaughtsGame
  // connect4: require("../games/connect4/singlegame")
};

export default class GameFactory {
  constructor(public context: GameContext) {}

  private getGameClass(game: string) {
    return GameClasses[game];
  }

  public getGameObj(game: string): GameBase {
    let class_ = this.getGameClass(game);
    let obj = new class_();
    return obj;
  }
}
