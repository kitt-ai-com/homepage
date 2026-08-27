const BOT_PATTERNS = [
  { name: "GPTBot", pattern: /GPTBot/i },
  { name: "ChatGPT-User", pattern: /ChatGPT-User/i },
  { name: "OAI-SearchBot", pattern: /OAI-SearchBot/i },
  { name: "ClaudeBot", pattern: /ClaudeBot/i },
  { name: "Claude-User", pattern: /Claude-User/i },
  { name: "Claude-SearchBot", pattern: /Claude-SearchBot/i },
  { name: "PerplexityBot", pattern: /PerplexityBot/i },
  { name: "Perplexity-User", pattern: /Perplexity-User/i },
  { name: "meta-externalagent", pattern: /meta-externalagent/i },
  { name: "Google-Extended", pattern: /Google-Extended/i },
  { name: "Google-Agent", pattern: /Google-Agent/i },
  { name: "Applebot-Extended", pattern: /Applebot-Extended/i },
  { name: "Amazonbot", pattern: /Amazonbot/i },
  { name: "CCBot", pattern: /CCBot/i },
  { name: "Bytespider", pattern: /Bytespider/i },
  { name: "MistralAI-User", pattern: /MistralAI-User/i },
  { name: "DuckAssistBot", pattern: /DuckAssistBot/i },
  // xAI documents these but real Grok traffic has been observed NOT sending them
  // (it spoofs plain browser/Go-http-client UAs instead) — kept for the rare
  // case it does, not because it's reliable. See tests for the caveat.
  { name: "GrokBot", pattern: /GrokBot/i },
  { name: "xAI-Grok", pattern: /xAI-Grok/i },
  { name: "Grok-DeepSearch", pattern: /Grok-DeepSearch/i },
];

export function detectAiBot(userAgent) {
  if (!userAgent) return null;
  for (const { name, pattern } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) return name;
  }
  return null;
}

// diagkitt's own diagnosis crawler (lib/crawler.ts, DIAGKITT_CRAWLER_USER_AGENT). Its
// requests are self-testing traffic, not a real visitor or an AI bot being measured.
const OWN_CRAWLER_PATTERN = /DiagkittBot/i;

export function isOwnCrawler(userAgent) {
  if (!userAgent) return false;
  return OWN_CRAWLER_PATTERN.test(userAgent);
}
