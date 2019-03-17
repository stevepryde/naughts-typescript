import BotFactory from "../lib/botfactory";
import GameFactory from "../lib/gamefactory";
import { GamePlayer } from "../lib/gameplayer";
import PseudoPlayer from "./pseudoplayer";
import { GameBase, GameState } from "../lib/gamebase";
import GameContext from "../lib/gamecontext";
import { BotConfig } from "../lib/gameconfig";
import { GameServiceError } from "./errors";
import GameResult from "../lib/gameresult";
import db from "./db";

export const supportedGames = ["naughts"];
export const supportedBots = ["randombot", "genbot3"];

export class GameService {
  private context: GameContext;
  private bot: GamePlayer | null;
  private bots: GamePlayer[];
  private gameObj: GameBase;
  private botConfig: BotConfig;

  constructor(public game: string) {
    this.bot = null;
    this.bots = [];
    this.botConfig = {
      botNames: [],
      botId: "",
      game: game,
      botdb: false
    };
    this.context = new GameContext();
    this.gameObj = new GameFactory(this.context).getGameObj(game);
  }

  startGame() {
    if (this.bot == null) {
      throw new GameServiceError("Error creating bot");
    }

    this.bots = [this.bot, new PseudoPlayer(0)];
    this.gameObj.start(this.bots);
    this.gameObj.doTurn(); // Bot gets first turn.
  }

  async loadBot(bot: string) {
    this.bot = new BotFactory(this.context, this.botConfig).createBot(bot);
    if (this.bot == null) {
      throw new GameServiceError("Error creating bot");
    }
    let data = await db.getTop(bot, 1);
    if (data.length > 0) {
      this.bot.fromDict(data[0]);
    } else {
      this.bot.create(this.gameObj.getGameInfo());
    }
  }

  doMoves(state: GameState, move: number) {
    if (this.bot == null) {
      throw new GameServiceError("Error creating bot");
    }

    this.bots = [this.bot, new PseudoPlayer(move)];
    this.gameObj.loadFromState(this.bots, state);
    this.gameObj.doTurn();
    if (!this.gameObj.isEnded()) {
      this.gameObj.doTurn();
    }
  }

  getGameState(): GameState {
    return this.gameObj.toDict();
  }

  getGameResult(): GameResult | null {
    if (!this.gameObj.isEnded()) {
      return null;
    }

    return this.gameObj.processResult();
  }
}
