import assert from "node:assert/strict";
import test from "node:test";
import { isMarkdownBot, markdownTwinFor, prefersMarkdown } from "../lib/markdown-negotiation.js";

const MARKDOWN_BOTS = [
  "Mozilla/5.0 AppleWebKit (compatible; GPTBot/1.1; +https://openai.com/gptbot)",
  "Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)",
  "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
  "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)",
  "Mozilla/5.0 (compatible; Google-Extended/1.0)",
  "Mozilla/5.0 (Macintosh) (Applebot-Extended/0.1; +http://www.apple.com/go/applebot)",
  "Mozilla/5.0 (compatible; DeepSeekBot/1.0)",
  "ora-agent/1.0 (+https://ora.ai)",
];

test("answer-engine crawlers are served markdown", () => {
  for (const userAgent of MARKDOWN_BOTS) {
    assert.equal(isMarkdownBot(userAgent), true, userAgent);
  }
});

test("training-only crawlers are not served markdown", () => {
  // robots.txt disallows both; serving them a cheaper representation would
  // only invite the crawl we turned away.
  assert.equal(isMarkdownBot("CCBot/2.0 (https://commoncrawl.org/faq/)"), false);
  assert.equal(
    isMarkdownBot("Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)"),
    false,
  );
});

test("browsers and unknown agents are not served markdown", () => {
  assert.equal(
    isMarkdownBot(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
    ),
    false,
  );
  assert.equal(isMarkdownBot("curl/8.7.1"), false);
  assert.equal(isMarkdownBot(""), false);
  assert.equal(isMarkdownBot(undefined), false);
});

test("Accept: text/markdown asks for markdown", () => {
  assert.equal(prefersMarkdown("text/markdown"), true);
  assert.equal(prefersMarkdown("text/markdown, text/html;q=0.5"), true);
  assert.equal(prefersMarkdown("text/html;q=0.5, text/markdown"), true);
  assert.equal(prefersMarkdown("TEXT/MARKDOWN"), true);
  assert.equal(prefersMarkdown("text/markdown;q=1.0, */*;q=0.1"), true);
});

test("markdown ranked below HTML does not ask for markdown", () => {
  assert.equal(prefersMarkdown("text/markdown;q=0.2, text/html"), false);
  assert.equal(prefersMarkdown("text/markdown;q=0"), false);
});

test("a browser's Accept header does not ask for markdown", () => {
  assert.equal(
    prefersMarkdown(
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    ),
    false,
  );
});

test("a wildcard never stands in for an explicit text/markdown", () => {
  // curl and most scripts send */* and expect the normal representation.
  assert.equal(prefersMarkdown("*/*"), false);
  assert.equal(prefersMarkdown("text/*"), false);
  assert.equal(prefersMarkdown(""), false);
  assert.equal(prefersMarkdown(null), false);
});

test("the homepage has a markdown twin", () => {
  assert.equal(markdownTwinFor("/"), "/index.md");
  assert.equal(markdownTwinFor("/index.html"), "/index.md");
});

test("pages without a hand-written twin are left on HTML", () => {
  // Rewriting these to a document that does not represent them would be worse
  // than serving the HTML they actually have.
  for (const path of ["/services/", "/faq/", "/about/", "/products/sellkitt/"]) {
    assert.equal(markdownTwinFor(path), null, path);
  }
});

test("markdown files and unknown paths are not rewritten", () => {
  assert.equal(markdownTwinFor("/index.md"), null);
  assert.equal(markdownTwinFor("/pricing.md"), null);
  assert.equal(markdownTwinFor("/no-such-path"), null);
  assert.equal(markdownTwinFor(""), null);
  assert.equal(markdownTwinFor(undefined), null);
});
