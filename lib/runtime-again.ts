import { spawn } from "child_process";
import { appCrashWebhook } from "./services";
import { HistoryLimit } from "./utils/historyLimit";
import debug from "debug";
import pidusage from "pidusage";

const logger = debug("runtime-again:RuntimeAgain");

export interface Stat {
  cpu: number;
  memory: number;
  ppid: number;
  pid: number;
  ctime: number;
  elapsed: number;
  timestamp: number;
}

class RuntimeAgain {
  private attempt = 0;
  private maxAttempt = 10;
  private restartRetryInterval = 5000;

  startNode(command: string, isRestart: boolean = false) {
    logger(isRestart ? "App restarted" : "App started");

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

    const pidHistory = new HistoryLimit<Stat>(60);

    const usageInterval = setInterval(() => {
      if (child.pid) {
        pidusage(child.pid, (err, stats) => {
          if (err) {
            logger(err.toString());

            return;
          }

          pidHistory.push(stats);
        });
      }
    }, 2000);

    const history = new HistoryLimit<string>(
      parseInt(process.env.HISTORY_LENGTH ?? "5")
    );

    child.stdout.pipe(process.stdout, { end: false });

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        let log = data.toString();

        log = log.replace(/\n$/, "");

        history.push(log);

        console.error(log);
      });
    }

    child.on("close", async (code) => {
      logger(`Exit process with code ${code}`);

      const error = history.get().join("\n");

      logger("--- errors ---");
      logger(error);
      logger("--------------");

      appCrashWebhook(error);

      clearInterval(usageInterval);

      this.attempt += 1;

      this.startNode(command, true);
    });
  }
}

export const runtimeAgain = new RuntimeAgain();
