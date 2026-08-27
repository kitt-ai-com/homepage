import assert from "node:assert/strict";
import test from "node:test";
import { detectAiBot, isOwnCrawler } from "../lib/detect-ai-bot.js";

const KNOWN_BOTS = [
  ["GPTBot", "Mozilla/5.0 AppleWebKit (compatible; GPTBot/1.1; +https://openai.com/gptbot)"],
  ["ChatGPT-User", "Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)"],
  ["OAI-SearchBot", "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)"],
  ["ClaudeBot", "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"],
  ["Claude-User", "Mozilla/5.0 (compatible; Claude-User/1.0; +https://www.anthropic.com/claude-user)"],
  ["Claude-SearchBot", "Mozilla/5.0 (compatible; Claude-SearchBot/1.0; +https://www.anthropic.com/claude-searchbot)"],
  ["PerplexityBot", "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)"],
  ["Perplexity-User", "Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai)"],
  ["meta-externalagent", "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)"],
  [
    "Google-Extended",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Google-Extended/1.0; +https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers)",
  ],
  [
    "Google-Agent",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Google-Agent/1.0; +https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers)",
  ],
  [
    "Applebot-Extended",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot-Extended/0.1; +http://www.apple.com/go/applebot)",
  ],
  ["Amazonbot", "Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)"],
  ["CCBot", "CCBot/2.0 (https://commoncrawl.org/faq/)"],
  [
    "Bytespider",
    "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)",
  ],
  ["MistralAI-User", "Mozilla/5.0 (compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)"],
  ["DuckAssistBot", "Mozilla/5.0 (compatible; DuckAssistBot/1.0; +https://duckduckgo.com/duckassistbot)"],
  ["GrokBot", "GrokBot/1.0 (+https://x.ai)"],
  ["xAI-Grok", "xAI-Grok/1.0 (+https://grok.com)"],
  ["Grok-DeepSearch", "Grok-DeepSearch/1.0 (+https://x.ai)"],
];

for (const [name, userAgent] of KNOWN_BOTS) {
  test(`detects ${name} from its real user-agent string`, () => {
    assert.equal(detectAiBot(userAgent), name);
  });
}

test("returns null for a regular browser user-agent", () => {
  assert.equal(
    detectAiBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"),
    null,
  );
});

test("returns null for a regular search engine crawler (Googlebot) — AI-specific Google crawling is not distinguishable this way", () => {
  assert.equal(detectAiBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), null);
});

test("returns null for Grok/xAI traffic spoofing a plain browser UA — real Grok traffic has been observed doing exactly this, so it is not reliably detectable even with GrokBot/xAI-Grok patterns registered", () => {
  assert.equal(
    detectAiBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1"),
    null,
  );
});

test("returns null for an empty or missing user-agent", () => {
  assert.equal(detectAiBot(""), null);
  assert.equal(detectAiBot(undefined), null);
  assert.equal(detectAiBot(null), null);
});

test("isOwnCrawler recognizes diagkitt's diagnosis crawler user-agent", () => {
  assert.equal(isOwnCrawler("DiagkittBot/1.0 (+https://diagkitt.vercel.app)"), true);
});

test("isOwnCrawler returns false for a regular browser or a real AI bot", () => {
  assert.equal(
    isOwnCrawler("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"),
    false,
  );
  assert.equal(isOwnCrawler("Mozilla/5.0 AppleWebKit (compatible; GPTBot/1.1; +https://openai.com/gptbot)"), false);
});

test("isOwnCrawler returns false for an empty or missing user-agent", () => {
  assert.equal(isOwnCrawler(""), false);
  assert.equal(isOwnCrawler(undefined), false);
  assert.equal(isOwnCrawler(null), false);
});
