import GameContext from "./gamecontext";
import { BotConfig } from "./gameconfig";
import { GamePlayer } from "./gameplayer";
import { BotCreateError } from "./errors";
import GameFactory from "./gamefactory";

import RandomBot from "../bots/randombot/randombot";
import GenBot3 from "../bots/genbot3/genbot3";

const GenericBots = {
  randombot: RandomBot,
  genbot3: GenBot3
};

import Human from "../games/naughts/bots/human/human";

const GameSpecificBots = {
  naughts: {
    human: Human
  },
  connect4: {}
};

export default class BotFactory {
  constructor(public context: GameContext, public botConfig: BotConfig) {}

  /**
   * Get the class for the specified bot.
   * NOTE: ES6 uses static imports, meaning it cannot load a module dynamically
   * based on filename. Module imports must be imported above at compile time.
   */
  private getBotClass(moduleName: string) {
    let parts = moduleName.split(".");
    let game = "";
    let moduleBasename = moduleName;
    if (parts.length > 1) {
      // Game-specific bot.
      game = parts[0];
      moduleBasename = parts[1];
      return GameSpecificBots[game][moduleBasename];
    } else {
      // Generic bot.
      return GenericBots[moduleName];
    }
  }

  public createBot(moduleName: string) {
    let class_ = this.getBotClass(moduleName);
    if (class_ == null) {
      throw new BotCreateError(`Error creating bot '${moduleName}'`);
    }
    let bot = new class_();
    bot.name = moduleName;
    return bot;
  }

  public createBots(): GamePlayer[] {
    let gameObj = new GameFactory(this.context).getGameObj(this.botConfig.game);

    let bots: GamePlayer[] = [];
    for (let botName of this.botConfig.botNames) {
      let botObj = this.createBot(botName);
      if (botObj == null) {
        throw new BotCreateError(`Error instantiating bot '${botName}'`);
      }

      let loaded = false;
      // TODO: Uncomment when BotDB implemented.

      // if (botObj.genetic && this.botConfig.botId && this.botConfig.botdb) {
      //   try {
      //     let botData = new BotDB().loadBot(this.botConfig.botId);
      //     if (botData != null) {
      //       botObj.fromDict(botData.bot);
      //       this.context.log.info(`Loaded bot: ${botName} :: ${this.botConfig.botId}`);
      //       loaded = true;
      //     }
      //   } catch (err) {
      //     throw new BotCreateError(`Error connecting to MongoDB: ${err}`);
      //   }
      // }

      if (!loaded) {
        botObj.create(gameObj.getGameInfo());
      }

      bots.push(botObj);
    }

    return bots;
  }

  public cloneBots(existingBots: GamePlayer[]): GamePlayer[] {
    let bots: GamePlayer[] = [];
    this.botConfig.botNames.forEach((botName, i) => {
      let botObj = this.createBot(botName);
      if (botObj == null) {
        throw new BotCreateError(`Error instantiating bot '${botName}'`);
      }

      botObj.fromDict(existingBots[i].toDict());
      bots.push(botObj);
    });
    return bots;
  }
}
