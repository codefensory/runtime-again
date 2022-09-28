const debug = require("debug");

const logger = debug("examples:erro_in_time");

logger("starting error");

setTimeout(() => {
  logger("play error");

  throw new Error("Ocurrio un problema");
}, 60000);
