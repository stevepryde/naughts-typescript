import LogHandler from "./log";

export default class GameContext {
  _log: null | LogHandler;
  constructor() {
    this._log = null;
  }

  /**
   * Get LogHandler object. This will be instantiated on first use.
   */
  get log(): LogHandler {
    if (!this._log) {
      this._log = new LogHandler();
    }
    return this._log;
  }
}
