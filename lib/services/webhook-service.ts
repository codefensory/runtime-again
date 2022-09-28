import { Stat } from "../runtime-again";

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
    body: JSON.stringify({
      type: "app_crash",
      title: "Application Crash",
      error: params.error,
      stats: params.stats,
      attempt: params.attempt,
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
  } catch (err) {
    if (err) {
      console.error(err.toString());
    }
  }
}
