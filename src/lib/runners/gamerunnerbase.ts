import path = require("path");
import GameContext from "../gamecontext";
import { GameConfig } from "../gameconfig";
import { getUniqueDir } from "../support/pathmaker";
import BotFactory from "../botfactory";
import GameFactory from "../gamefactory";

export default class GameRunnerBase extends GameContext {
  path: string;
  _botFactory: BotFactory | null = null;
  _gameFactory: GameFactory | null = null;
  constructor(public config: GameConfig) {
    super();
    let className = this.constructor.name;
    let prefix = `${className}_${this.config.bot1}_${this.config.bot2}`;
    this.path = getUniqueDir(config.logBaseDir, prefix);
    this.log.logToConsole();
    this.log.logToFile(path.join(this.path, "game.log"));
  }

  protected get botFactory(): BotFactory {
    if (this._botFactory == null) {
      this._botFactory = new BotFactory(this, this.config.getBotConfig());
    }
    return this._botFactory;
  }

  protected get gameFactory(): GameFactory {
    if (this._gameFactory == null) {
      this._gameFactory = new GameFactory(this);
    }
    return this._gameFactory;
  }

  public run(): void {}
}
