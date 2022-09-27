import { program } from "commander";
import { runtimeAgain } from "./runtime-again";

program
  .name("runtime-again")
  .description("CLI to run runtime-again for a service")
  .version("0.0.1");

program
  .command("start")
  .description("Run a server")
  .argument("<node_or_script_command>", "Command to run server")
  .action((command) => {
    runtimeAgain.startNode(command);
  });

program.parse();
