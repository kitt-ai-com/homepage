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
];

export function detectAiBot(userAgent) {
  if (!userAgent) return null;
  for (const { name, pattern } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) return name;
  }
  return null;
}
