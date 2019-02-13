import GameContext from "./gamecontext";
import { GameBase } from "./gamebase";

const GameClasses = {
  naughts: require("../games/naughts/singlegame")
  // connect4: require("../games/connect4/singlegame")
};

export default class GameFactory {
  constructor(public context: GameContext) {}

  private getGameClass(game: string) {
    return GameClasses[game];
  }

  public getGameObj(game: string): GameBase {
    let class_ = this.getGameClass(game);
    let obj = Object.create(class_) as GameBase;
    obj.constructor.apply(obj);
    return obj;
  }
}
