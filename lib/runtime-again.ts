import { spawn } from "child_process";
import { HistoryLimit } from "./utils/historyLimit";

class RuntimeAgain {
  startNode(command: string, isRestart: boolean = false) {
    console.log(isRestart ? "App restarted" : "App started");

    const commandSplit = command.split(" ");

    if (commandSplit.length > 1 && commandSplit[0] === "node") {
      commandSplit.splice(0, 1);
    }

    const child = spawn("node", commandSplit, {
      env: Object.assign(
        {},
        {
          DEBUG_COLORS: 1,
        },
        process.env
      ),
    });

    const history = new HistoryLimit<string>(5);

    child.stdout.pipe(process.stdout, { end: false });

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        let log = data.toString();

        log = log.replace(/\n$/, "");

        history.push(log);

        console.error(log);
      });
    }

    child.on("close", (code) => {
      console.error(`Exit process with code ${code}`);

      console.error("--- errors ---");
      console.error(history.get().join("\n"));
      console.error("--------------");

      this.startNode(command, true);
    });
  }
}

export const runtimeAgain = new RuntimeAgain();
