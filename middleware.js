import { next } from "@vercel/functions";
import { detectAiBot } from "./lib/detect-ai-bot.js";

export default function middleware(request) {
  try {
    const userAgent = request.headers.get("user-agent") ?? "";
    const bot = detectAiBot(userAgent);
    if (bot) {
      const path = new URL(request.url).pathname;
      console.log(JSON.stringify({ bot, path, timestamp: new Date().toISOString() }));
    }
  } catch (error) {
    console.error("bot-detect middleware error", error);
  }
  return next();
}

export const config = {
  matcher: ["/((?!assets/|archive/).*)"],
};
