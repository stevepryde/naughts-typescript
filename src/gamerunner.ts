import path = require("path");

import { BotCreateError, CancelledError, GameCreateError } from "./lib/errors";
import { GameConfig, quitGame } from "./lib/gameconfig";
import GameRunnerBase from "./lib/runners/gamerunnerbase";
import BatchRunner from "./lib/runners/batchrunner";
import GeneticRunner from "./lib/runners/geneticrunner";
import SingleRunner from "./lib/runners/singlerunner";

let basePath = __dirname;
let config = new GameConfig(basePath);
console.log("Started");

process.on("SIGINT", () => {
  // TODO: this is not called because almost nothing is async so the event
  // never gets processed. For this to work the whole chain needs to be
  // converted to async.
  quitGame("Cancelled.");
});

try {
  let runner: GameRunnerBase | null = null;
  if (config.geneticMode) {
    console.log("Using GENETIC game runner");
    runner = new GeneticRunner(config);
  } else if (config.batchMode) {
    console.log("Using BATCH game runner");
    runner = new BatchRunner(config);
  } else {
    console.log("Using SINGLE game runner");
    runner = new SingleRunner(config);
  }
  if (runner == null) {
    console.log("Invalid game runner");
  } else {
    let startTime = new Date().getTime();
    runner.run();
    let endTime = new Date().getTime();
    let elapsed = (endTime - startTime) / 1000.0;
    runner.log.info(`Completed in ${elapsed.toFixed(3)} seconds.`);
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
