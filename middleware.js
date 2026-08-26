import { next, waitUntil } from "@vercel/functions";
import { detectAiBot } from "./lib/detect-ai-bot.js";
import { reportBotVisit } from "./lib/report-bot-visit.js";

export default function middleware(request) {
  try {
    const userAgent = request.headers.get("user-agent") ?? "";
    const bot = detectAiBot(userAgent);
    if (bot) {
      const path = new URL(request.url).pathname;
      const timestamp = new Date().toISOString();
      console.log(JSON.stringify({ bot, path, timestamp }));
      waitUntil(reportBotVisit({ bot, path, timestamp }));
    }
  } catch (error) {
    console.error("bot-detect middleware error", error);
  }
  return next();
}

export const config = {
  matcher: ["/((?!assets/|archive/).*)"],
};
