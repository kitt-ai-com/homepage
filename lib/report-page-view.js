export async function reportPageView(event, env = process.env, fetchImpl = fetch) {
  const url = env.PAGE_VIEW_INGEST_URL;
  const secret = env.BOT_VISIT_INGEST_SECRET;
  if (!url || !secret) return;
  try {
    await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // best-effort; a lost page-view log is not worth retrying or surfacing
  }
}
