import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectFile = (path) => new URL(`../${path}`, import.meta.url);

test("the marketing archive can load every external script allowed by its CSP", async () => {
  const [vercelConfig, marketingPage] = await Promise.all([
    readFile(projectFile("vercel.json"), "utf8").then(JSON.parse),
    readFile(projectFile("archive/marketing/index.html"), "utf8"),
  ]);

  const globalHeaders = vercelConfig.headers.find(({ source }) => source === "/(.*)");
  const csp = globalHeaders.headers.find(
    ({ key }) => key.toLowerCase() === "content-security-policy",
  ).value;
  const allowedScriptSources = new Set(
    csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("script-src "))
      .split(/\s+/)
      .slice(1),
  );
  const externalScriptOrigins = [
    ...marketingPage.matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi),
  ].map(([, src]) => new URL(src).origin);
  const blockedOrigins = externalScriptOrigins.filter(
    (origin) => !allowedScriptSources.has(origin),
  );

  assert.deepEqual(blockedOrigins, []);
});
