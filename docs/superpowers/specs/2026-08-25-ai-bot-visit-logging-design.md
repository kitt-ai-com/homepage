# kitt.ai.kr AI 봇 방문 로깅 (Edge Middleware PoC) 설계

> 2026-08-25 브레인스토밍. diagkitt 프로젝트에서 "AI가 실제로 우리 사이트를 방문해서
> 뭘 가져가는지 알 수 있나?"는 질문에서 출발했다. 원래는 범용 리버스 프록시(업체
> DNS를 diagkitt 경유로 돌리는 큰 기능)로 논의를 시작했으나, kitt.ai.kr이 이미
> 우리가 소유한 Vercel 프로젝트(`project_homepage`)라는 걸 확인하면서 DNS 변경
> 없이 훨씬 작고 안전한 방식으로 방향을 바꿨다. 1차 목표는 "kitt.ai.kr을 AI가
> 인용하게 만드는 것"이고, 이 기능은 그 진행상황을 실제 데이터로 확인하기 위한
> 계측(PoC) 단계다.

## 배경

`project_homepage`의 `robots.txt`는 이미 GPTBot·ClaudeBot·PerplexityBot 등 AI
크롤러를 명시적으로 허용하고 있다(`# AI 검색·답변 엔진 (GEO)` 섹션). 하지만 실제로
이 크롤러들이 **왔는지, 어느 경로를 가져갔는지**는 지금 전혀 알 수 없다 — 정적
사이트라 서버 로그도, 방문 기록도 없다.

## 접근 방식

**범용 리버스 프록시는 채택하지 않는다.** 업체 DNS를 통째로 돌리는 방식은 프록시
장애 시 사이트 전체가 죽는 리스크를 안는 큰 인프라 작업이다. 대신:

**kitt.ai.kr(`project_homepage`)은 이미 우리가 소유한 Vercel 프로젝트이므로,
그 프로젝트에 [Vercel Routing Middleware](https://vercel.com/docs/routing-middleware)
파일 하나만 추가한다.** 이건 Next.js 전용이 아니라 Vercel 플랫폼 레벨 기능이라
프레임워크 없는(No Framework/"Other") 정적 사이트에도 적용된다. DNS 변경 없음,
별도 프록시 인프라 없음 — 기존 배포에 파일만 추가되는 수준.

다른 업체로 확장할 때: 그 업체가 Vercel에 있으면 동일한 패턴(그 프로젝트에
middleware 추가)을 적용할 수 있다. Vercel이 아니면 그때 가서 범용 프록시를
재검토한다 — 지금 미리 설계하지 않는다.

## 탐지 가능한 봇 목록과 한계

`robots.txt`에 나열된 토큰 중 일부는 **실제 HTTP 요청에 찍히는 User-Agent가
아니라 robots.txt 전용 옵트아웃 토큰**이다. 실제로 미들웨어에서 매칭 가능한 건:

| 매칭 가능 (실제 User-Agent) | 매칭 불가능 (robots.txt 전용 토큰) |
|---|---|
| `GPTBot`, `ChatGPT-User`, `OAI-SearchBot` | — |
| `ClaudeBot`, `Claude-User`, `Claude-SearchBot` | — |
| `PerplexityBot`, `Perplexity-User` | — |
| `meta-externalagent` | — |
| — | `Google-Extended` (실제 요청은 그냥 `Googlebot`이라 일반 검색과 구분 불가) |
| — | `Applebot-Extended` (실제 요청은 그냥 `Applebot`) |

구글·애플의 AI용 크롤링은 이 방식으로 구분할 수 없다는 걸 결과 화면/로그에 그대로
남겨서 나중에 헷갈리지 않게 한다.

## 아키텍처

```
요청 → Vercel Edge (middleware.js 실행)
         ├─ /assets/* 경로면 미들웨어 스킵(매처로 제외, 노이즈 방지)
         ├─ User-Agent가 위 9종 패턴 중 하나와 매치
         │    → console.log(JSON.stringify({bot, path, timestamp}))
         └─ 매치 여부와 무관하게 그대로 통과 → 기존 정적 콘텐츠 서빙
```

- **저장소: 새로 만들지 않는다.** `console.log`로 찍은 내용은 Vercel이 자동으로
  수집하는 자체 런타임 로그에 남는다. Vercel 대시보드/API로 조회한다.
- **로그 보존 기간이 짧을 수 있다** — Vercel 플랜에 따라 최근 로그만 보임. 장기
  데이터가 필요해지면 별도 저장소(diagkitt Postgres 등)로 확장하는 건 이번 스코프
  밖이다.
- 미들웨어 실행 자체가 실패해도(예외 발생) 정적 콘텐츠 서빙에 영향 없도록
  `try/catch`로 감싸 항상 통과시킨다 — 로깅 실패가 사이트 장애로 이어지면 안 됨.

## 신규 의존성

이 저장소는 지금까지 빌드 스텝이 없는 순수 정적 사이트(HTML만 서빙)였다.
Vercel Routing Middleware를 쓰려면 `@vercel/functions` 패키지가 필요해서
**이번에 처음으로 `package.json`이 생긴다.** 최소 구성(의존성 1개, devDependency
없음)으로 유지하고, 기존 정적 파일 서빙 방식은 그대로 둔다(빌드 커맨드 없음,
Vercel이 미들웨어만 별도로 번들링).

## 코드 구조

- `lib/detect-ai-bot.js` — `detectAiBot(userAgent): string | null` 순수 함수.
  User-Agent 문자열을 9종 패턴과 대조해 매치된 봇 이름(예: `"GPTBot"`)을
  반환하거나 `null`. Vercel 관련 의존성 없음 — 유닛테스트하기 쉽게 분리.
- `middleware.js` (프로젝트 루트) — `detectAiBot`을 호출해 매치되면 로그를 찍고,
  `@vercel/functions`의 `next()`로 항상 통과시킴. `config.matcher`로 `/assets/*`
  제외.
- `tests/detect-ai-bot.test.js` — Node 내장 `node:test`로 작성(diagkitt와 동일
  패턴, 프레임워크 추가 없음). 9종 패턴 각각 매치되는지, 매치 안 되는 일반
  User-Agent(예: 일반 브라우저)는 `null`을 반환하는지 확인.

## 테스트

- `detectAiBot`: 9종 봇 User-Agent 각각 올바른 이름 반환, 일반 브라우저
  User-Agent는 `null`, 빈 문자열/undefined 입력도 안전하게 `null` 처리
- 미들웨어 자체(Vercel Edge 런타임)는 로컬에서 유닛테스트하지 않는다 — 실제
  배포 후 `curl -A "GPTBot" https://kitt.ai.kr/` 같은 수동 스모크 테스트로
  Vercel 로그에 찍히는지 확인한다(이번 플랜의 마지막 단계)

## 스코프 제외

- 장기 로그 저장소(DB) 구축 — PoC 단계에서는 불필요, 나중에 diagkitt Postgres
  연동 검토
- 로그 조회 대시보드 UI — Vercel 대시보드로 충분
- 다른 업체로의 확장(멀티테넌트) — kitt.ai.kr 하나로 개념 검증 먼저
- Google/Apple의 AI 크롤링 구분 — 기술적으로 불가능함을 이미 확인함

## 관련

- diagkitt `docs/diagkitt-ai-citation-analysis-design.md` — 이 PoC를 촉발한
  diagkitt의 AI 인용 분석 기능
- `robots.txt` — 이미 존재하는 AI 크롤러 허용 목록, 이번 작업의 탐지 대상 목록도
  여기서 그대로 가져옴
