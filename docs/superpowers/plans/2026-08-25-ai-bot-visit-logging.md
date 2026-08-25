# kitt.ai.kr AI 봇 방문 로깅 (Edge Middleware PoC) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** kitt.ai.kr(`project_homepage`)에 Vercel Routing Middleware를 추가해서, 실제 AI 크롤러(GPTBot·ClaudeBot·PerplexityBot 등)가 방문하면 Vercel 자체 로그에 남도록 한다.

**Architecture:** 프로젝트 루트에 `middleware.js` 1개 추가. 요청마다 User-Agent를 9종 알려진 AI-봇 패턴과 대조하는 순수 함수(`lib/detect-ai-bot.js`)를 호출해서, 매치되면 `console.log`로 찍고 항상 원래 콘텐츠로 통과시킨다. DNS·프록시·신규 저장소 없음 — 기존 정적 배포에 파일만 추가.

**Tech Stack:** Vercel Routing Middleware(`@vercel/functions`), plain ESM JS(빌드 도구 없음), Node 내장 `node:test`(diagkitt와 동일 패턴)

## Global Constraints

- 탐지 대상은 정확히 9종: `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `Claude-User`, `Claude-SearchBot`, `PerplexityBot`, `Perplexity-User`, `meta-externalagent`. `Google-Extended`/`Applebot-Extended`는 실제 User-Agent가 아니므로 탐지 목록에 넣지 않는다(설계문서에 이미 명시).
- 미들웨어는 `/assets/*` 경로는 건너뛴다(matcher로 제외).
- 미들웨어 내부 예외가 정적 콘텐츠 서빙을 막아선 안 된다 — 로깅 로직은 try/catch로 감싸고, 성공/실패 무관하게 항상 통과시킨다.
- 새 저장소(DB)는 만들지 않는다 — Vercel 자체 런타임 로그가 저장소다.
- 이 저장소는 지금까지 빌드 스텝이 없었다. `package.json`을 새로 만들되 최소 구성(의존성 `@vercel/functions` 1개, `test` 스크립트만)으로 유지하고 `build` 스크립트는 추가하지 않는다 — 기존 정적 파일 서빙 방식이 그대로 유지되어야 한다.
- `middleware.js` 자체(Vercel Edge 런타임 동작)는 로컬에서 유닛테스트하지 않는다 — `detectAiBot` 순수 함수만 테스트하고, 미들웨어 배선은 `node --check`로 문법만 확인한다. 실제 동작 확인은 배포 후 수동 스모크 테스트(이 플랜의 태스크 범위 밖, 문서 맨 아래 참고)로 한다.

## File Structure

- Create: `lib/detect-ai-bot.js` — `detectAiBot(userAgent): string | null` 순수 함수
- Create: `tests/detect-ai-bot.test.js` — 유닛 테스트
- Create: `middleware.js` (프로젝트 루트) — Vercel Routing Middleware 진입점
- Create: `package.json` — 의존성·테스트 스크립트

---

### Task 1: `detectAiBot` 순수 함수 + 유닛 테스트

**Files:**
- Create: `package.json`
- Create: `lib/detect-ai-bot.js`
- Create: `tests/detect-ai-bot.test.js`

**Interfaces:**
- Produces: `detectAiBot(userAgent: string | undefined | null): string | null` — 매치되는 봇 이름(예: `"GPTBot"`) 또는 `null`

- [ ] **Step 1: `package.json` 생성**

```json
{
  "name": "kitt-ai-homepage",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/"
  },
  "dependencies": {
    "@vercel/functions": "^3.9.5"
  }
}
```

- [ ] **Step 2: 의존성 설치**

Run: `npm install`
Expected: `package-lock.json` 생성, `node_modules/@vercel/functions` 존재

- [ ] **Step 3: 실패하는 테스트 작성 — `tests/detect-ai-bot.test.js`**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { detectAiBot } from "../lib/detect-ai-bot.js";

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

test("returns null for an empty or missing user-agent", () => {
  assert.equal(detectAiBot(""), null);
  assert.equal(detectAiBot(undefined), null);
  assert.equal(detectAiBot(null), null);
});
```

- [ ] **Step 4: 테스트 실행 — 실패 확인**

Run: `node --test tests/detect-ai-bot.test.js`
Expected: FAIL — `Cannot find module '../lib/detect-ai-bot.js'`

- [ ] **Step 5: `lib/detect-ai-bot.js` 구현**

```js
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
```

- [ ] **Step 6: 테스트 재실행 — 통과 확인**

Run: `node --test tests/detect-ai-bot.test.js`
Expected: PASS — 12개 테스트(9종 봇 + 브라우저 + Googlebot + 빈값) 모두 초록

- [ ] **Step 7: 커밋**

```bash
git add package.json package-lock.json lib/detect-ai-bot.js tests/detect-ai-bot.test.js
git commit -m "feat: add AI-crawler user-agent detection"
```

---

### Task 2: Vercel Routing Middleware 배선

**Files:**
- Create: `middleware.js` (프로젝트 루트)

**Interfaces:**
- Consumes: `detectAiBot(userAgent)` from `./lib/detect-ai-bot.js` (Task 1), `next` from `@vercel/functions`

- [ ] **Step 1: `middleware.js` 작성**

```js
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
  matcher: ["/((?!assets/).*)"],
};
```

- [ ] **Step 2: 문법 확인**

Run: `node --check middleware.js`
Expected: 출력 없음(exit code 0) — 문법 에러 없음. `@vercel/functions`는 실제 Vercel Edge 런타임에서만 완전히 동작하므로 이 커맨드는 import 자체를 실행하지 않고 문법만 확인한다.

- [ ] **Step 3: 전체 테스트 스위트 재확인**

Run: `npm test`
Expected: PASS — Task 1의 12개 테스트 그대로 통과(이 태스크는 새 테스트를 추가하지 않음, `middleware.js`는 설계상 로컬 유닛테스트 대상이 아님)

- [ ] **Step 4: 커밋**

```bash
git add middleware.js
git commit -m "feat: log AI-crawler visits via Vercel Routing Middleware"
```

---

## 배포 및 검증 (수동, 이 플랜의 태스크 범위 밖)

**이 두 태스크는 여기까지만 자동 실행한다.** kitt.ai.kr은 실제 운영 중인 회사
대표 사이트이므로, `main`에 머지하고 실제로 배포(`git push origin main` →
Vercel 자동 배포)하는 시점은 사용자에게 명시적으로 확인받은 뒤 진행한다.

배포 후 수동 확인 절차:

1. `curl -A "GPTBot/1.1" https://kitt.ai.kr/` — 정상적으로 페이지가 응답하는지
   (미들웨어가 사이트를 막지 않는지) 확인
2. Vercel 대시보드 → 해당 프로젝트 → Logs(또는
   `mcp__plugin_vercel_vercel__get_runtime_logs`)에서 방금 요청에 대한
   `{"bot":"GPTBot", ...}` 로그가 찍혔는지 확인
3. `curl -A "Mozilla/5.0 (Windows NT 10.0)" https://kitt.ai.kr/` (일반 브라우저
   User-Agent)로 한 번 더 확인 — 이번엔 봇 로그가 찍히지 않아야 함
4. 문제 없으면 `/robots.txt`, `/llms.txt`에 대해서도 봇 UA로 curl해서 실제
   AI 크롤러가 그 경로들을 가져가는지 나중에 대조할 수 있는지 확인
