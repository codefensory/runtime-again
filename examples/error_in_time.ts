import debug from "debug";

const logger = debug("examples:erro_in_time");

console.log("starting");

logger("starting error");

setTimeout(() => {
  logger("play error");
  throw new Error("Ocurrio un problema");
}, 2000);
