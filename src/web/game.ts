import express = require("express");
import Joi = require("joi");

import { supportedBots, supportedGames, GameService } from "./gameService";

const router = express.Router();

router.post("/start", function(req, res) {
  const schema = Joi.object().keys({
    game: Joi.string()
      .valid(supportedGames)
      .required(),
    botname: Joi.string()
      .valid(supportedBots)
      .required()
  });

  const result = Joi.validate(req.body, schema);
  if (result.error !== null) {
    res.status(400).json({ code: "INVALID_PARAMS" });
    return;
  }

  try {
    let service = new GameService(req.body.game);
    service.loadBot(req.body.botname);
    service.startGame();
    let result = service.getGameResult();
    let state = service.getGameState();
    res.status(200).json({ result: result, state: JSON.stringify(state) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: "INTERNAL_SERVER_ERROR" });
  }
});

router.post("/process", function(req, res) {
  const schema = Joi.object().keys({
    game: Joi.string()
      .valid(supportedGames)
      .required(),
    botname: Joi.string()
      .valid(supportedBots)
      .required(),
    gamestate: Joi.string()
      .min(0)
      .max(16384)
      .required(),
    move: Joi.number().required()
  });

  const result = Joi.validate(req.body, schema);
  if (result.error !== null) {
    res.status(400).json({ code: "INVALID_PARAMS" });
    return;
  }

  try {
    let service = new GameService(req.body.game);
    service.loadBot(req.body.botname);
    service.doMoves(JSON.parse(req.body.gamestate), req.body.move);
    let result = service.getGameResult();
    let state = service.getGameState();
    res.status(200).json({ result: result, state: JSON.stringify(state) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;
