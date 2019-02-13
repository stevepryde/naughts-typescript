import path = require("path");
import fs = require("fs");

function formatTimestamp(date: Date): string {
  let datestamp = `${date.getFullYear()}${date.getMonth()}${date.getDay()}`;
  let timeStamp = `${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
  return `${datestamp}_${timeStamp}`;
}

export function getUniqueDir(basePath: string, prefix: string): string {
  let fullPrefix = `${prefix}_${formatTimestamp(new Date())}`;
  return fs.mkdtempSync(path.join(basePath, fullPrefix));
}
