// Serves the markdown twin of a page to clients that would rather read markdown
// than HTML: anything that asks for text/markdown via Accept, and the answer-engine
// crawlers, which ask for HTML but only ever want the text out of it.
//
// Training-only crawlers (CCBot, Bytespider) are deliberately absent — robots.txt
// disallows them, and handing them a cheaper representation would only invite the
// crawl we just turned away. detect-ai-bot.js keeps a wider list because it measures
// who visits; this list decides who gets served differently.
const MARKDOWN_BOT_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /OAI-SearchBot/i,
  /ClaudeBot/i,
  /Claude-User/i,
  /Claude-SearchBot/i,
  /PerplexityBot/i,
  /Perplexity-User/i,
  /Google-Extended/i,
  /Google-Agent/i,
  /Applebot-Extended/i,
  /meta-externalagent/i,
  /MistralAI-User/i,
  /DuckAssistBot/i,
  /DeepSeekBot/i,
  /ora-agent/i,
];

export function isMarkdownBot(userAgent) {
  if (!userAgent) return false;
  return MARKDOWN_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function parseAcceptEntry(entry) {
  const [rawType, ...params] = entry.split(";");
  const type = rawType.trim().toLowerCase();
  if (!type) return null;
  let q = 1;
  for (const param of params) {
    const [key, value] = param.split("=");
    if (key?.trim().toLowerCase() !== "q") continue;
    const parsed = Number.parseFloat(value);
    q = Number.isFinite(parsed) ? parsed : 1;
  }
  return { type, q };
}

// True only when the client named text/markdown explicitly and ranked it at least
// as high as HTML. A browser's `text/html,...,*/*;q=0.8` must not qualify, and a
// bare `*/*` (curl, most scripts) is not a request for markdown either — wildcards
// never stand in for the explicit type here.
export function prefersMarkdown(accept) {
  if (!accept) return false;
  let markdownQ = 0;
  let htmlQ = 0;
  for (const entry of accept.split(",")) {
    const parsed = parseAcceptEntry(entry);
    if (!parsed) continue;
    if (parsed.type === "text/markdown") markdownQ = Math.max(markdownQ, parsed.q);
    if (parsed.type === "text/html" || parsed.type === "*/*") {
      htmlQ = Math.max(htmlQ, parsed.q);
    }
  }
  return markdownQ > 0 && markdownQ >= htmlQ;
}

// Only pages with a hand-written markdown twin are listed. A page without one
// keeps serving HTML rather than being rewritten to something that does not
// represent it — add the .md file and the entry together.
const MARKDOWN_TWINS = new Map([
  ["/", "/index.md"],
  ["/index.html", "/index.md"],
]);

export function markdownTwinFor(pathname) {
  if (!pathname) return null;
  return MARKDOWN_TWINS.get(pathname) ?? null;
}
