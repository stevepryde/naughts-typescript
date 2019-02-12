import fs = require("fs");
import path = require("path");
import uuidv4 = require("uuid/v4");
import argparse = require("argparse");

const LOGBASEPATH = "logs";
const DATABASEPATH = "data";
const SUPPORTED_GAMES = ["naughts", "connect4"];

function quitGame(message: string = "Exiting..."): void {
  console.log(message);
  process.exit(1);
}

function checkInt1Plus(value: string): number {
  let ivalue = parseInt(value) || 1;
  if (ivalue <= 0) {
    throw argparse.ArgumentTypeError("Expected an int > 0, but got " + ivalue);
  }
  return ivalue;
}

function checkInt0Plus(value: string): number {
  let ivalue = parseInt(value) || 0;
  if (ivalue < 0) {
    throw argparse.ArgumentTypeError(
      "Expected an int >= zero, but got " + ivalue
    );
  }
  return ivalue;
}

interface BotConfig {
  botNames: string[];
  botId: string;
  game: string;
  botdb: boolean;
}

interface BatchConfig {
  batchSize: number;
  botConfig: BotConfig;
  game: string;
  gameId: string;
  magic: boolean;
}

export class GameConfig {
  gameId: string;
  game: string;
  silent: boolean;
  consoleLogging: boolean;
  batchMode: boolean;
  geneticMode: boolean;
  useRabbit: boolean;
  magic: boolean;
  noBatchSummary: boolean;
  batchSize: number;
  numGenerations: number;
  numSamples: number;
  keepSamples: number;
  wildSamples: number;
  botdb: boolean;
  botId: string;
  bot1: string;
  bot2: string;
  logBaseDir: string;
  dataPath: string;

  constructor(public basePath: string) {
    this.gameId = uuidv4();
    this.game = "";
    this.silent = false;
    this.consoleLogging = false;
    this.batchMode = false;
    this.geneticMode = false;
    this.useRabbit = false;
    this.magic = false;
    this.noBatchSummary = false;
    this.batchSize = 1;
    this.numGenerations = 1;
    this.numSamples = 1;
    this.keepSamples = 1;
    this.wildSamples = 1;
    this.botdb = false;
    this.botId = "";
    this.bot1 = "";
    this.bot2 = "";

    this.logBaseDir = "";
    this.dataPath = "";

    let args = this.defineArgs();
    this.parseArgs(args);

    this.initLogging();
  }

  private defineArgs() {
    let parser = new argparse.ArgumentParser({
      version: "0.0.1",
      addHelp: true,
      description: "Naughts"
    });
    parser.addArgument("bot1", { help: "First bot, e.g. 'human'" });
    parser.addArgument("bot2", { help: "Second bot" });
    parser.addArgument("--game", {
      type: String,
      metavar: "GAME",
      choices: SUPPORTED_GAMES,
      required: true,
      help: "The game to run"
    });
    parser.addArgument("--batch", {
      type: checkInt1Plus,
      default: 1,
      help: "Batch mode. Specify the number of games to run per batch."
    });
    parser.addArgument("--magic", {
      action: "storeTrue",
      help: "Magic batch mode. Run all possible games against this bot."
    });
    parser.addArgument("--genetic", {
      type: checkInt1Plus,
      help:
        "Genetic mode. Specify number of generations to run (Requires --batch or --magic)"
    });
    parser.addArgument("--samples", {
      type: checkInt1Plus,
      help: "Number of samples per generation. (Requires --genetic)"
    });
    parser.addArgument("--keep", {
      type: checkInt1Plus,
      help: "Number of winning samples to 'keep' (Requires --genetic)"
    });
    parser.addArgument("--wild", {
      type: checkInt1Plus,
      help:
        "Number of 'wild' (fresh, randomly generated) samples to include in each generation"
    });
    parser.addArgument("--botdb", {
      action: "storeTrue",
      help: "Enable storing and loading bots with BotDB"
    });
    parser.addArgument("--botid", {
      action: "store",
      help: "Play against this bot id (genetic)"
    });
    parser.addArgument("--rabbit", {
      action: "storeTrue",
      help: "Use the RabbitMQ processor"
    });

    let args = parser.parseArgs();

    if (args.magic) {
      this.magic = true;
      if (args.batch) {
        parser.error("Cannot specify --batch with --magic");
      }
    }

    if (!args.bot1 || !args.bot2) {
      parser.error("You need to specify two bots");
    }

    let requiresBatch = ["genetic", "samples", "keep", "wild"];
    let requiresGenetic = ["samples", "keep", "wild"];

    if (!args.batch && !this.magic) {
      for (let req of requiresBatch) {
        if (args.hasOwnProperty(req)) {
          parser.error(`Option --${req} requires --batch`);
        }
      }
    }

    if (!args.genetic) {
      for (let req of requiresGenetic) {
        if (args.hasOwnProperty(req)) {
          parser.error(`Option --${req} requires --genetic`);
        }
      }
    }

    return args;
  }

  private parseArgs(args: argparse.Namespace): void {
    this.game = args.game;
    this.bot1 = args.bot1;
    this.bot2 = args.bot2;

    if (args.rabbit) {
      this.useRabbit = true;
    }

    if (args.botdb) {
      this.botdb = true;
    }

    if (args.botid) {
      this.botId = args.botid;
      this.botdb = true;
    }

    if (this.magic || args.batch > 0) {
      this.batchSize = parseInt(args.batch) || 0;
      this.batchMode = true;
      this.silent = true;

      if (args.genetic) {
        this.geneticMode = true;
        this.noBatchSummary = true;
        this.numGenerations = parseInt(args.genetic);

        if (args.samples) {
          this.numSamples = parseInt(args.samples);
        }

        if (args.keep) {
          this.keepSamples = parseInt(args.keep);
        }

        if (args.wild) {
          this.wildSamples = parseInt(args.wild);
        }
      }
    }
  }

  public get botNames(): string[] {
    return [this.bot1, this.bot2];
  }

  private initLogging() {
    this.logBaseDir = path.join(this.basePath, LOGBASEPATH, this.game);

    if (!fs.existsSync(this.logBaseDir)) {
      try {
        fs.mkdirSync(this.logBaseDir, { recursive: true });
      } catch (err) {
        quitGame(`Error creating game log dir ${this.logBaseDir}: ${err}`);
      }
    }

    this.dataPath = path.join(this.basePath, DATABASEPATH);
    if (!fs.existsSync(this.logBaseDir)) {
      try {
        fs.mkdirSync(this.dataPath, { recursive: true });
      } catch (err) {
        quitGame(`Error creating data dir ${this.dataPath}: ${err}`);
      }
    }
  }

  public getBatchConfig(): BatchConfig {
    return {
      batchSize: this.batchSize,
      botConfig: this.getBotConfig(),
      game: this.game,
      gameId: this.gameId,
      magic: this.magic
    };
  }

  public getBotConfig(): BotConfig {
    return {
      botNames: this.botNames,
      botId: this.botId,
      game: this.game,
      botdb: this.botdb
    };
  }
}
