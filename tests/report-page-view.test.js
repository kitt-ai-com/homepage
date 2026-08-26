import assert from "node:assert/strict";
import test from "node:test";
import { reportPageView } from "../lib/report-page-view.js";

const EVENT = { path: "/", timestamp: "2026-08-26T00:00:00.000Z" };

test("reportPageView does nothing when the ingest URL or secret is missing", async () => {
  let called = false;
  const fetchImpl = async () => {
    called = true;
    return new Response(null, { status: 200 });
  };
  await reportPageView(EVENT, {}, fetchImpl);
  assert.equal(called, false);
});

test("reportPageView posts the event to the configured ingest URL with the shared secret", async () => {
  let capturedUrl = "";
  let capturedInit = null;
  const fetchImpl = async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response(null, { status: 200 });
  };
  const env = {
    PAGE_VIEW_INGEST_URL: "https://diagkitt.example.com/api/ingest/page-view",
    BOT_VISIT_INGEST_SECRET: "shh",
  };
  await reportPageView(EVENT, env, fetchImpl);
  assert.equal(capturedUrl, env.PAGE_VIEW_INGEST_URL);
  assert.equal(capturedInit.method, "POST");
  assert.equal(capturedInit.headers.authorization, "Bearer shh");
  assert.deepEqual(JSON.parse(capturedInit.body), EVENT);
});

test("reportPageView swallows fetch failures instead of throwing", async () => {
  const fetchImpl = async () => {
    throw new Error("network down");
  };
  const env = {
    PAGE_VIEW_INGEST_URL: "https://diagkitt.example.com/api/ingest/page-view",
    BOT_VISIT_INGEST_SECRET: "shh",
  };
  await assert.doesNotReject(() => reportPageView(EVENT, env, fetchImpl));
});
