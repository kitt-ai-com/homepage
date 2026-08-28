import { next, rewrite, waitUntil } from "@vercel/functions";
import { detectAiBot, isOwnCrawler } from "./lib/detect-ai-bot.js";
import { isKnownPath } from "./lib/is-known-path.js";
import { isMarkdownBot, markdownTwinFor, prefersMarkdown } from "./lib/markdown-negotiation.js";
import { reportBotVisit } from "./lib/report-bot-visit.js";
import { reportPageView } from "./lib/report-page-view.js";

// Both the Accept header and the User-Agent pick the representation, so caches
// must key on both. Only set on paths that actually have a markdown twin —
// Vary: User-Agent site-wide would gut the edge cache for every other page.
const NEGOTIATED_HEADERS = { Vary: "Accept, User-Agent" };
const MARKDOWN_HEADERS = {
  ...NEGOTIATED_HEADERS,
  "Content-Type": "text/markdown; charset=utf-8",
};

export default function middleware(request) {
  try {
    const userAgent = request.headers.get("user-agent") ?? "";
    if (isOwnCrawler(userAgent)) {
      return next();
    }
    const bot = detectAiBot(userAgent);
    const path = new URL(request.url).pathname;
    const timestamp = new Date().toISOString();
    const site = "kitt-ai-kr";
    if (bot) {
      console.log(JSON.stringify({ bot, path, timestamp }));
      waitUntil(reportBotVisit({ site, bot, path, timestamp }));
    } else if (isKnownPath(path)) {
      waitUntil(reportPageView({ site, path, timestamp }));
    }

    const twin = markdownTwinFor(path);
    if (twin) {
      const wantsMarkdown =
        prefersMarkdown(request.headers.get("accept")) || isMarkdownBot(userAgent);
      return wantsMarkdown
        ? rewrite(new URL(twin, request.url), { headers: MARKDOWN_HEADERS })
        : next({ headers: NEGOTIATED_HEADERS });
    }
  } catch (error) {
    console.error("bot-detect middleware error", error);
  }
  return next();
}

export const config = {
  matcher: ["/((?!assets/|archive/|proposals/|favicon\\.ico).*)"],
};
