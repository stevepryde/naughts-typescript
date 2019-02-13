import path = require("path");
import SingleRunner from "./lib/runners/singlerunner";
import { GameConfig, quitGame } from "./lib/gameconfig";
import GameRunnerBase from "./lib/runners/gamerunnerbase";
import { BotCreateError, CancelledError, GameCreateError } from "./lib/errors";

let basePath = __dirname;
let config = new GameConfig(basePath);
console.log("Started");

try {
  process.on("SIGINT", () => {
    throw new CancelledError("Cancelled.");
  });

  let runner: GameRunnerBase | null = null;
  if (config.geneticMode) {
    console.log("Using GENETIC game runner");
    // runner = GeneticRunner(config);
  } else if (config.batchMode) {
    console.log("Using BATCH game runner");
    // runner = BatchRunner(config);
  } else {
    console.log("Using SINGLE game runner");
    runner = new SingleRunner(config);
  }
  if (runner == null) {
    console.log("Invalid game runner");
  } else {
    runner.run();
  }
} catch (err) {
  switch (err.constructor) {
    case BotCreateError:
      quitGame("ERROR: Could not create bot: " + err);
    case GameCreateError:
      quitGame("ERROR: Could not create game: " + err);
    case CancelledError:
      quitGame("Cancelled.");
    default:
      quitGame("ERROR: " + err);
  }
}

quitGame("Game completed.");
