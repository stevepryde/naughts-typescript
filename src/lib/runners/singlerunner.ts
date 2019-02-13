import GameRunnerBase from "./gamerunnerbase";

export default class SingleRunner extends GameRunnerBase {
  public run(): void {
    let bots = this.botFactory.createBots();

    let gameObj = this.gameFactory.getGameObj(this.config.game);
    gameObj.setInitialState();
    gameObj.start(bots);
    let result = gameObj.run();
    this.log.info(result.toString());
    return;
  }
}
