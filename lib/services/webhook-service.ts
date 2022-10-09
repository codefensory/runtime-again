import { Stat } from "../runtime-again";
import debug from "debug";

const logger = debug("runtime-again:services:webhooks-service");

export async function appCrashWebhook(params: {
  error: string;
  stats: Stat[];
  attempt: number;
}) {
  const serversUrl = process.env.APP_CRASH_ENDPOINTS;

  if (!!!serversUrl) {
    return;
  }

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "app_crash",
      title: "Application Crash",
      error: params.error,
      stats: params.stats,
      attempt: params.attempt,
      monitorId: Number(process.env.MONITOR_ID) ?? -1,
    }),
  };

  try {
    const fetchs = [];

    const urlsArr = serversUrl.split(";");

    for (let url of urlsArr) {
      if (!!!url) {
        continue;
      }

      fetchs.push(fetch(url, options));
    }

    await Promise.all(fetchs);
  } catch (err: any) {
    if (err) {
      logger(err.toString());
    }
  }
}
