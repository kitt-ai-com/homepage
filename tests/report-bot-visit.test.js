import assert from "node:assert/strict";
import test from "node:test";
import { reportBotVisit } from "../lib/report-bot-visit.js";

const EVENT = { site: "kitt-ai-kr", bot: "GPTBot", path: "/", timestamp: "2026-08-26T00:00:00.000Z" };

test("reportBotVisit does nothing when the ingest URL or secret is missing", async () => {
  let called = false;
  const fetchImpl = async () => {
    called = true;
    return new Response(null, { status: 200 });
  };
  await reportBotVisit(EVENT, {}, fetchImpl);
  assert.equal(called, false);
});

test("reportBotVisit posts the event to the configured ingest URL with the shared secret", async () => {
  let capturedUrl = "";
  let capturedInit = null;
  const fetchImpl = async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response(null, { status: 200 });
  };
  const env = {
    BOT_VISIT_INGEST_URL: "https://diagkitt.example.com/api/ingest/bot-visit",
    BOT_VISIT_INGEST_SECRET: "shh",
  };
  await reportBotVisit(EVENT, env, fetchImpl);
  assert.equal(capturedUrl, env.BOT_VISIT_INGEST_URL);
  assert.equal(capturedInit.method, "POST");
  assert.equal(capturedInit.headers.authorization, "Bearer shh");
  assert.deepEqual(JSON.parse(capturedInit.body), EVENT);
});

test("reportBotVisit swallows fetch failures instead of throwing", async () => {
  const fetchImpl = async () => {
    throw new Error("network down");
  };
  const env = {
    BOT_VISIT_INGEST_URL: "https://diagkitt.example.com/api/ingest/bot-visit",
    BOT_VISIT_INGEST_SECRET: "shh",
  };
  await assert.doesNotReject(() => reportBotVisit(EVENT, env, fetchImpl));
});
