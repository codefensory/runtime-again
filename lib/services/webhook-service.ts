import { Stat } from "../runtime-again";

export async function appCrashWebhook(error: string, stats: Stat[]) {
  const serversUrl = process.env.APP_CRASH_ENDPOINTS;

  if (!!!serversUrl) {
    return;
  }

  const options = {
    method: "POST",
    body: JSON.stringify({
      type: "app_crash",
      title: "Application Crash",
      error,
      stats,
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
