import { Stat } from "../runtime-again";
import debug from "debug";
import { AppCrashType } from "../utils/constants";

const logger = debug("runtime-again:services:webhooks-service");

export async function sendAppCrashWebhooks(params: {
  type: string;
  error: string;
  stats: Stat[];
  attempt: number;
}) {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: params.type,
      title: "Application Crash",
      error: params.error,
      stats: params.stats,
      attempt: params.attempt,
      monitorId: Number(process.env.MONITOR_ID) ?? -1,
    }),
  };

  fetchToEndpoints(options);
}

export async function sendAppUP(attempt: number) {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Application up",
      attempt,
      monitorId: Number(process.env.MONITOR_ID) ?? -1,
    }),
  };

  fetchToEndpoints(options);
}

async function fetchToEndpoints(options: RequestInit) {
  const serversUrl = process.env.APP_CRASH_ENDPOINTS;

  if (!!!serversUrl) {
    return;
  }

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
