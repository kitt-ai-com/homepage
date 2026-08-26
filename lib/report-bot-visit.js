export async function reportBotVisit(event, env = process.env, fetchImpl = fetch) {
  const url = env.BOT_VISIT_INGEST_URL;
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
    // best-effort; a lost bot-visit log is not worth retrying or surfacing
  }
}
