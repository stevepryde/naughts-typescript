/* Misc exception classes. */

export class CancelledError extends Error {}

export class GameError extends Error {}

export class GameCreateError extends GameError {}

export class BotError extends Error {}

export class BotCreateError extends BotError {}
