import { ChildProcessWithoutNullStreams, spawn } from "child_process";
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
  private maxAttempt = 5;
  private restartRetryInterval = 60000;

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

    child.stdout.pipe(process.stdout, { end: false });

    // Start watch stats
    const pidHistory = new HistoryLimit<Stat>(75);
    const statsInterval = this.startWatchStats(child, pidHistory);

    // Listen stderr and save history
    const history = new HistoryLimit<string>(
      parseInt(process.env.HISTORY_LENGTH ?? "5")
    );
    child.stderr.on("data", (data) => this.customStderr(data, history));

    // Start restart attempt
    const restartAttemptsTimeout = this.restartAttemptsTimeout();

    child.on("close", async (code) => {
      logger(`Exit child process with code ${code}`);

      const error = history.get().join("\n");

      // Print errors
      logger("--- errors ---");
      logger(error);
      logger("--------------");

      // Print stats
      logger("--- stats ---");
      logger(JSON.stringify(pidHistory.get(), null, "   "));
      logger("-------------");

      // send crash to webhooks
      appCrashWebhook(error, pidHistory.get());

      // Clear intervals
      clearInterval(statsInterval);
      clearInterval(restartAttemptsTimeout);

      if (this.attempt >= this.maxAttempt) {
        setTimeout(() => {
          this.attempt = 0;

          this.startNode(command, true);
        }, this.restartRetryInterval);

        return;
      }

      this.attempt += 1;

      this.startNode(command, true);
    });
  }

  private restartAttemptsTimeout() {
    return setTimeout(() => (this.attempt = 0), 20000);
  }

  private startWatchStats(
    child: ChildProcessWithoutNullStreams,
    history: HistoryLimit<Stat>
  ) {
    return setInterval(() => {
      if (child.pid) {
        pidusage(child.pid, (err, stats) => {
          if (err) {
            logger(err.toString());

            return;
          }

          history.push(stats);
        });
      }
    }, 2000);
  }

  private customStderr(data: any, history: HistoryLimit<string>) {
    let log = data.toString();

    log = log.replace(/\n$/, "");

    history.push(log);

    console.error(log);
  }
}

export const runtimeAgain = new RuntimeAgain();
