import winston from "winston";
import uuidv4 from "uuid/v4";

const TRACE = false;

export default class LogHandler {
  name: string;
  filename: string;
  fileLogging: boolean;
  consoleLogging: boolean;
  _logger: winston.Logger | null;

  constructor() {
    this.name = uuidv4();
    this.filename = "";
    this.fileLogging = false;
    this.consoleLogging = false;
    this._logger = null;
  }

  get isEnabled(): boolean {
    return this.fileLogging || this.consoleLogging;
  }

  get logger(): winston.Logger {
    if (!this._logger) {
      this._logger = winston.createLogger({
        levels: winston.config.syslog.levels,
        format: winston.format.combine(winston.format.colorize(), winston.format.simple())
      });
    }

    return this._logger;
  }

  /**
   * Set up file logging.
   *
   * @param filename Log filename including path.
   */
  logToFile(filename: string): void {
    this.fileLogging = true;
    this.filename = filename;
    this.logger.add(new winston.transports.File({ filename: filename, level: "debug" }));
  }

  /**
   * Set up console logging.
   */
  logToConsole(): void {
    this.consoleLogging = true;
    this.logger.add(new winston.transports.Console({ level: "debug" }));
  }

  /**
   * Convert the string (or array of strings) into an array of lines.
   */
  getLines(text: string | string[]): string[] {
    if (!(text instanceof Array)) {
      text = [text];
    }

    let lines: string[] = [];
    for (let line of text) {
      line = (line as any).trim();
      let sublines = line.split("\n");
      for (let subline of sublines) {
        lines.push(subline);
      }
    }

    return lines;
  }

  logIt(text: string | string[], loglevel: string): void {
    if (!this.isEnabled) {
      return;
    }

    for (let line of this.getLines(text)) {
      //this.logger.log(loglevel, line);
      // TODO: Need a new logger. Winston hangs under heavy load :(
      console.log(`${loglevel} :: ${line}`);
    }
  }

  trace(text: string): void {
    if (TRACE) {
      this.logIt(text, "silly");
    }
  }

  debug(text: string): void {
    this.logIt(text, "debug");
  }

  info(text: string): void {
    this.logIt(text, "info");
  }

  warning(text: string): void {
    this.logIt(text, "warning");
  }

  error(text: string): void {
    this.logIt(text, "error");
  }

  critical(text: string): void {
    this.logIt(text, "error");
  }
}
