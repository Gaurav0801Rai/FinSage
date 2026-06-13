# FinSage — Project Context

> This file is the single source of truth for the project.
> Read this before making any changes to the codebase.
> Update this file whenever a major decision is made.

---

## What Is This App?

**FinSage** is an AI-powered portfolio intelligence platform.

It monitors news, market events, and social signals across a user's stock and
crypto holdings, then uses AI to surface only the events that actually matter
to them.

### What this app IS
- A monitoring and signal-filtering tool
- A personalized news relevance engine
- A portfolio tracking dashboard with AI-powered alerts

### What this app is NOT (these lines must never be crossed)
- NOT a trading platform
- NOT financial advice
- NOT a stock prediction system
- NOT a broker integration

The user makes all decisions. The app only provides: monitoring, filtering,
relevance analysis, impact alerts, and summaries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| UI Components | shadcn/ui |
| Auth | Firebase Auth |
| Database | Firestore |
| File Storage | NOT USED (see decision below) |
| AI | Google Gemini API |
| OCR | Gemini Vision (not Tesseract) |
| Email | Resend (Phase 6) |
| Hosting | Vercel |
| Workers | GitHub Actions cron (Phase 4+) |

---

## Market Focus

**Primary: Indian markets (NSE/BSE) + Crypto**

- Indian stocks: Yahoo Finance via `yahoo-finance2` package (.NS suffix for NSE,
  .BO suffix for BSE)
- Crypto: CoinGecko free tier API
- Currency: INR primary, USD secondary
- Number formatting: Indian system (lakhs, crores) using `en-IN` locale

---

## Design System

| Property | Value |
|---|---|
| Background | `#090D12` (core interface background) |
| Accent color | Gold/Blue dual accent — `#E2B659` (brand gold), `#1F4E79` (trust blue) |
| Gain color | `#10B981` (emerald green) |
| Loss color | `#F43F5E` (rose red) |
| Card style | Workspace Panel — `#121820` border and fill |
| Card border | `border-white/[0.06]`, lifts to `white/[0.12]` on hover |
| Font — UI | Geist Sans (via `geist` npm package) |
| Font — numbers | Geist Mono (tabular-nums everywhere for financial data) |
| Corner radius | `rounded-[12px]` (12px standard) |
| Motion | Framer Motion, 300ms page transitions, 60ms card stagger |

All design tokens live in `tailwind.config.ts`.
Reusable utility classes in `globals.css`:
- `.glass-card` — workspace panel surface card styling
- `.glass-card-hover` — adds hover background highlight
- `.btn-glow` — solid gold CTA button
- `.text-gradient` — white gradient headline text
- `.text-gradient-amber` — gold gradient text
- `.skeleton` — shimmer loading state

---

## Architecture Rules (follow these always)

### Rule 1 — Server vs Client split
- Firebase Admin SDK → server only (`src/lib/firebase/admin.ts` has
  `import "server-only"` at the top)
- Firebase Client SDK → browser only (`src/lib/firebase/client.ts`)
- Auth tokens stored in httpOnly cookies, never localStorage
- Server Actions for data mutations
- API routes for cron jobs and external service callbacks

### Rule 2 — No Firebase Storage
Firebase Storage is NOT used in this project.

Reason: Firestore was created in `asia-south2` (Delhi). Google Cloud's no-cost
Storage tier only covers US regions. Rather than pay for Storage or split
infrastructure across regions, we send portfolio screenshots directly to Gemini
Vision as base64-encoded inline images. The image is never saved anywhere.

Benefits:
- Zero storage cost
- No image cleanup/lifecycle management needed
- More privacy-friendly (we never keep copies of users' portfolios)

The env var `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` stays defined but is unused.
Do not import `firebase/storage` anywhere in the codebase.

### Rule 3 — Two-stage AI filter (critical for cost control)
News analysis must always use two stages in sequence:

**Stage 1 — Cheap, no AI:** String match the news article against the user's
ticker symbols. Drop articles that don't mention any held ticker. This filters
out ~95% of articles before any AI is called.

**Stage 2 — AI, but only on survivors:** Send only the articles that passed
Stage 1 to Gemini for full relevance analysis. Cache the base analysis per
article so 100 users with the same holding only trigger one AI call.

Never call the AI on every article. This is what keeps costs near zero.

### Rule 4 — Always confirm OCR before saving
Portfolio screenshots extracted by Gemini Vision MUST be shown to the user for
review and correction before being written to Firestore. Never auto-commit
extracted data. Always show a review/edit screen first.

### Rule 5 — Soft deletes
Never hard-delete user-owned Firestore documents. Instead set
`deletedAt: Timestamp`. Filter deleted documents out in queries.

### Rule 6 — Indian number formatting
Always use `formatINR()` from `src/lib/utils.ts` for currency display.
Always use `tabular-nums` CSS for any number that changes (prices, P&L).
Parse Indian-format numbers correctly: 1,50,000 = 150000 (lakh notation).

### Rule 7 — Route constants
Never hardcode route strings. Always use the `ROUTES` object from
`src/lib/constants.ts`.

---

## File Naming Conventions

- Files: `kebab-case.tsx` (e.g., `ambient-background.tsx`)
- Components: `PascalCase` (e.g., `AmbientBackground`)
- Imports: always use `@/*` path aliases, never relative paths across folders
- Comments: only explain WHY something non-obvious is done, not WHAT

---

## Environment Variables

| Variable | Used for | Where |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client | Browser |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client | Browser |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client | Browser |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Defined but unused | — |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client | Browser |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client | Browser |
| `FIREBASE_ADMIN_PROJECT_ID` | Admin SDK | Server only |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Admin SDK | Server only |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Admin SDK | Server only |
| `GEMINI_API_KEY` | Primary Gemini API Key | Server only |
| `GEMINI_API_KEYS` | Gemini Backup Keys (comma-separated rotation pool) | Server only |
| `GROQ_API_KEY` | Primary Groq API Key | Server only |
| `GROQ_API_KEYS` | Groq Backup Keys (comma-separated rotation pool) | Server only |
| `NEWS_API_KEY` | News ingestion (Phase 4) | Server only |
| `REDDIT_CLIENT_ID` | Reddit API (Phase 4) | Server only |
| `REDDIT_CLIENT_SECRET` | Reddit API (Phase 4) | Server only |
| `NEXT_PUBLIC_APP_URL` | App URL | Browser |

---

## Firestore Schema

### Conventions
- IDs: auto-generated by Firestore unless noted
- Symbols: always UPPERCASE (`RELIANCE`, `BTC`, not `reliance`)
- Timestamps: stored as Firestore `Timestamp`, sent to client as ms numbers
- Monetary values: stored as plain numbers in their native currency
- Soft deletes: set `deletedAt` instead of deleting documents
- Never store computed values (current price, P&L) — compute at read time

---

### `users/{uid}`
Root document per authenticated user. `uid` = Firebase Auth UID.

| Field | Type | Notes |
|---|---|---|
| `email` | string | Lowercased on write |
| `displayName` | string or null | From OAuth or null |
| `photoURL` | string or null | OAuth profile pic URL |
| `createdAt` | Timestamp | Set once on signup |
| `lastActiveAt` | Timestamp | Updated on each sign-in |
| `preferences` | map | See below |
| `onboarding` | map | `{ portfolioUploaded: bool, completedAt: Timestamp or null }` |

`preferences` map:
| Field | Type | Default |
|---|---|---|
| `baseCurrency` | "INR" or "USD" | "INR" |
| `alertSeverityThreshold` | "high", "medium", or "low" | "medium" |
| `emailAlerts` | boolean | true |
| `pushAlerts` | boolean | false |
| `dailyDigest` | boolean | true |
| `digestTime` | string "HH:mm" | "09:00" |
| `timezone` | string IANA | "Asia/Kolkata" |

---

### `users/{uid}/holdings/{holdingId}`
One document per holding. Subcollection scoped to user.

| Field | Type | Notes |
|---|---|---|
| `symbol` | string | Uppercase. e.g. `RELIANCE`, `BTC` |
| `name` | string | Display name. e.g. "Reliance Industries Ltd" |
| `type` | "stock", "crypto", "mutual_fund", or "etf" | |
| `exchange` | "NSE", "BSE", or null | Required when type is "stock" |
| `quantity` | number | Supports decimals |
| `avgBuyPrice` | number | In `currency` units |
| `currency` | "INR" or "USD" | |
| `addedAt` | Timestamp | |
| `updatedAt` | Timestamp | |
| `deletedAt` | Timestamp or null | null = active holding |
| `source` | "ocr", "manual", or "import" | How it was added |

**Important:** currentPrice, P&L, marketValue are NOT stored here.
They are computed at read time from `prices/{symbol}`.

---

### `users/{uid}/watchlist/{itemId}`
Same shape as a holding but quantity and avgBuyPrice are 0.
Kept as a separate subcollection from holdings so queries don't need filters.

---

### `users/{uid}/alerts/{alertId}`
AI-generated alerts, personalized per user.

| Field | Type | Notes |
|---|---|---|
| `newsId` | string | Ref to `news/{newsId}` |
| `severity` | "high", "medium", or "low" | AI-determined |
| `affectedHoldings` | string[] | Holding IDs from this user |
| `affectedSymbols` | string[] | Denormalized for fast display |
| `whyItMatters` | string | 1-3 sentence AI explanation |
| `impactSummary` | string | Longer AI summary paragraph |
| `confidence` | number | 0 to 1 |
| `createdAt` | Timestamp | |
| `readAt` | Timestamp or null | null until user views it |
| `dismissed` | boolean | User-controlled |

---

### `news/{newsId}`
Shared across all users. One document per ingested news item.

| Field | Type | Notes |
|---|---|---|
| `source` | string | "MoneyControl", "Reuters", etc. |
| `sourceUrl` | string | Original article URL |
| `sourceType` | "rss", "api", "reddit", or "scrape" | |
| `title` | string | |
| `summary` | string | Short summary |
| `publishedAt` | Timestamp | |
| `fetchedAt` | Timestamp | When our worker got it |
| `category` | "stock", "crypto", "macro", "geopolitical", or "reddit" | |
| `tickers` | string[] | Detected by Stage 1 filter |
| `processed` | boolean | false = waiting for AI, true = done |
| `dedupKey` | string | Hash of title + source to prevent duplicates |

---

### `news_analyses/{newsId}`
Base AI analysis. One per news item. Shared across all users.
Document ID matches the `news/{newsId}` document.

| Field | Type | Notes |
|---|---|---|
| `newsId` | string | Same as doc ID |
| `baseImpact` | string | Generic impact summary |
| `affectedSectors` | string[] | e.g. ["banking", "auto"] |
| `affectedSymbols` | string[] | Tickers the AI thinks are affected |
| `severity` | "high", "medium", or "low" | |
| `confidence` | number | 0 to 1 |
| `model` | string | e.g. "gemini-1.5-flash" |
| `generatedAt` | Timestamp | |
| `tokensUsed` | number | For cost tracking |

---

### `prices/{symbol}`
Latest price snapshot. One per symbol. Document ID = symbol (e.g. `RELIANCE`).

| Field | Type | Notes |
|---|---|---|
| `symbol` | string | Same as doc ID |
| `name` | string | Display name |
| `type` | "stock", "crypto", etc. | |
| `exchange` | "NSE", "BSE", or null | |
| `currency` | "INR" or "USD" | |
| `price` | number | Current price |
| `previousClose` | number | Yesterday's close |
| `change` | number | Absolute change today |
| `changePercent` | number | Percentage change today |
| `fetchedAt` | Timestamp | When price was fetched |
| `source` | "yahoo", "coingecko", or "nse" | Data provider used |

---

### Firestore Indexes Needed

| Collection | Fields | Purpose |
|---|---|---|
| `news` | `processed` ASC + `fetchedAt` DESC | Worker picks unprocessed items |
| `news` | `tickers` ARRAY + `publishedAt` DESC | News feed filtered by ticker |
| `users/{uid}/alerts` | `dismissed` ASC + `createdAt` DESC | Active alerts list |
| `users/{uid}/holdings` | `deletedAt` ASC + `addedAt` DESC | Active holdings list |

---

### Who Writes What (Write Boundaries)

| Collection | Who writes |
|---|---|
| `users/{uid}` | Client via Server Actions |
| `users/{uid}/holdings` | Client via Server Actions |
| `users/{uid}/watchlist` | Client via Server Actions |
| `users/{uid}/alerts` | Server only (workers) |
| `news`, `news_analyses` | Server only (workers) |
| `prices` | Server only (workers) |

---

## Phase Progress

### Phase 1A — Foundation and Design System ✅ COMPLETE
- Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Design tokens in `tailwind.config.ts`, utility classes in `globals.css`
- Landing page at `src/app/page.tsx`
- Firebase Client SDK and Admin SDK configured
- Type definitions in `src/types/index.ts`
- Constants in `src/lib/constants.ts`
- Brand components: Logo, AmbientBackground, NoiseOverlay

### Phase 1B — Auth, Session, Dashboard Shell ✅ COMPLETE
- Auth pages: `/login`, `/signup`, `/reset` with glassmorphism design
- Firebase Auth: email/password working, Google OAuth wired up
- Session cookie pattern: client signs in → gets ID token → Server Action
  creates Firebase session cookie → stored as `pp_session` httpOnly cookie
- Middleware guards all dashboard routes on cookie existence
- Dashboard server layout does full `verifySessionCookie` with revocation check
- Authenticated dashboard shell with sidebar nav and topbar
- Firestore security rules deployed

### Phase 2 — Portfolio Ingestion ✅ COMPLETE
- Screenshot upload with drag-and-drop ✓
- Gemini 2.5 Flash OCR extracts holdings as structured JSON ✓
- Review and correction screen with editable table ✓
- Manual "Add holding" form as fallback ✓
- Server Action saves confirmed holdings to Firestore ✓
- Firestore rules deployed ✓

### Phase 3 — Dashboard ✅ COMPLETE
- Portfolio hero with animated number counter ✓
- Stats row: total invested, return %, best/worst performer ✓
- Asset allocation donut chart (Recharts) ✓
- Portfolio performance area chart with gradient fill ✓
- Holdings table with live prices, P&L, day change, sortable columns ✓
- Live prices: Yahoo Finance for NSE/BSE stocks, CoinGecko for crypto ✓
- Fallback prices shown with "est." label when API unavailable ✓
- Empty dashboard state with upload CTA ✓
- Price service with 60s in-memory cache ✓

### Phase 4 — News Ingestion Pipeline ✅ COMPLETE
- RSS feeds from MoneyControl, ET, Reuters, CoinDesk
- NewsAPI integration
- Reddit API for finance subreddits
- Stage 1 ticker-matching filter
- Raw storage with processed flag
- Cron job via Vercel Cron or GitHub Actions

### Phase 5 — Alerts System ✅ COMPLETE
- Alerts page at /alerts with unread/read sections ✓
- AlertCard with severity colors, affected symbols, AI explanation ✓
- Mark as read and dismiss Server Actions ✓
- SidebarWrapper pattern: server component passes unreadCount to client sidebar ✓
- Fixed infinite POST loop caused by Server Action in Client Component render ✓

### Phase 6 — Settings ✅ COMPLETE
- Settings page at /settings ✓
- Profile form: update display name ✓
- Preferences form: base currency, alert severity, email/push/digest toggles ✓
- Danger zone: delete all holdings with DELETE confirmation ✓
- getUserPreferences Server Action reads from Firestore ✓
- Currency preference respected on dashboard hero ✓

### Phase 7 — Watchlist ✅ COMPLETE
- Watchlist page at /watchlist ✓
- Add asset form: symbol, name, type, exchange, currency ✓
- Live prices via /api/prices route (client-safe wrapper around price-service) ✓
- Remove from watchlist (soft delete) ✓
- Move to portfolio modal: enter quantity and avg buy price ✓
- Empty state with helpful CTA ✓

### Phase 8 — Polish & Rebrand ✅ COMPLETE
- Rebrand the platform from "Portfolio Pulse" to "FinSage" ✓
- Styling overhaul with vibrant dual-accent gold (`#E2B659`) / trust blue (`#1F4E79`) and premium dark workspace panel surfaces (`#121820`, `rounded-[12px]`) ✓
- Enhanced sidebar layout with gold glow border shadows for active state ✓
- Updated key metrics inside tables to `font-semibold` for scan speed ✓
- Fixed trailing issues: linked the topbar bell icon, set up collectionGroup indexes, and updated RSS filters ✓

### Phase 9 — 24/7 AI Chatbot Assistant ✅ COMPLETE
- Created a contextual floating chatbot interface with a customizable mascot ✓
- Implemented RAG (Retrieval-Augmented Generation) context: reads user's holdings, current performance, and recent news/alerts ✓
- Configured the Groq API handler (supporting Llama-3.3-70b-versatile) with automatic fallback to Gemini 2.5 Flash ✓
- Enforced a rolling limit of 25 messages stored in Firestore subcollection `users/{uid}/chats` ✓

### Phase 10 — Daily Email Digest & Alerts ✅ COMPLETE
- Created settings toggle to activate/deactivate daily digests and email alerts ✓
- Integrated email delivery pipeline directly triggered during news processing cron run ✓
- Utilized Gmail MCP tool (`gmail_send_message`) to send automated, formatted alert emails if the severity threshold matches the user's preferences ✓

---

## Decisions Log

### Phase 1A
- Accent color: amber/gold (#FBBF24 primary, #F59E0B main)
- Fonts: Geist Sans + Geist Mono via `geist` npm package
- AmbientBackground and NoiseOverlay are fixed-position with pointer-events-none

### Phase 1B
- Firestore region: asia-south2 (Delhi) for low latency to Indian users
- Firebase Storage: abandoned (Delhi not eligible for no-cost Storage tier)
- Session cookie name: `pp_session` (httpOnly, secure in production)
- Middleware: cookie existence check only (Edge runtime can't run Admin SDK)
- Full token verification with revocation check: in dashboard server layout only
- clearSession Server Action: does not redirect (client controls navigation)
- Google OAuth: wired up but not actively promoted, deferred to polish phase

### Phase 2
- Gemini model: gemini-2.5-flash (confirmed working via API key check)
- Dropped @google/generative-ai SDK for direct REST fetch — SDK was
  forcing v1beta which had broken quota. Direct fetch uses /v1/ explicitly.
- Firebase Storage confirmed not needed — base64 inline to Gemini works perfectly.
- OCR prompt uses explicit JSON schema with Indian lakh format instruction.

### Phase 3
- Price service uses direct Yahoo Finance query2 API (no auth needed)
- CoinGecko simple price API for crypto (batch fetches all crypto in one call)
- Fallback price = avgBuyPrice with "est." label so UI never breaks
- Portfolio chart uses simulated 30-day data — real history in Phase 4
- All portfolio calculations happen server-side in price-service.ts
- Dashboard page uses force-dynamic to always fetch fresh data

### Phase 4
- RSS feeds used: Economic Times, MoneyControl, Reuters, CoinDesk, CoinTelegraph, NDTV Profit
- NewsAPI used for 3 targeted queries: Indian stocks, crypto, RBI/macro
- Dedup via URL hash stored as dedupKey field on news documents
- Stage 1 filter: string match against ticker-dictionary.ts before any AI call
- Stage 2 filter: Gemini 2.5 Flash analyses survivors, creates per-user alerts
- Cron auth check disabled for local dev — re-enable before production deploy
- Vercel Cron schedules defined in vercel.json (ingest every 15min, process every 5min)
- Cron only runs automatically on Vercel — must trigger manually in local dev

### Phase 5
- AlertsBadge cannot be a Server Component inside a Client Component sidebar
- Solution: SidebarWrapper (server) fetches count and passes as prop to Sidebar (client)
- This is the correct Next.js App Router pattern for this situation
- Watchlist page is a placeholder until Phase 7

### Phase 6
- Settings page uses getUserPreferences Server Action to read Firestore on load
- Currency preference changes display format only — no live exchange rate conversion yet
- USD display uses toLocaleString("en-US") formatting
- Live exchange rate (USD/INR) deferred to Phase 8 Polish
- Danger zone requires typing "DELETE" to confirm — prevents accidental data loss

### Phase 7
- fetchPrices has server-only import so cannot be called from client components
- Solution: /api/prices POST route acts as a thin server wrapper for client use
- Watchlist page is "use client" because it manages local state for add/remove/move
- moveToPortfolio writes to holdings collection and soft-deletes from watchlist atomically
- WatchlistItem type exported from actions/watchlist.ts not types/index.ts (co-located)

### Known issues deferred to Phase 8 Polish
- News feed showing articles from previous day (need publishedAt filter)
- Bell icon in topbar not linked to /alerts
- Alerts page empty (needs collectionGroup Firestore index on holdings)
- All three will be fixed together in Phase 8

### Phase 8 Polish (Rebrand)
- Rebranded the platform name from "Portfolio Pulse" to "FinSage".
- Visual styling overhaul: Replaced amber elements with premium gold (`#E2B659` / `#D4AF37`) and integrated the new FinTech Trust Blue (`#1F4E79` / `#1A365D`) color accents.
- Surface refinement: Migrated cards from standard glassmorphism to Workspace Panel Surfaces (`#121820`), restricted borders, and updated corner radius specifications to a standard `12px` (`rounded-[12px]`).
- Sidebar update: Updated navigation background to Deep Navy-Black (`#0E131A`), styled the active item with gold glow border shadows, and set inactive elements to `text-slate-500` (`#64748B`).
- Emphasized key numeric metrics inside holdings lists by updating table field weights to `font-semibold` for rapid visual scanning.
- Restyled alert boxes and system explanation indicators with dedicated gold frames and category badges.

### Phase 9 (24/7 AI Chatbot Assistant)
- Chatbot uses Groq API with Llama-3.3-70b-versatile for high quality, fast financial reasoning.
- Fallback path built to use Gemini 2.5 Flash API directly if GROQ_API_KEY is not defined, ensuring service resilience.
- Database footprint restricted by saving only the last 25 chat messages per user (rolling limit) to Firestore. Older logs are deleted via batch execution.
- To prevent hallucinated conversions, the current USD to INR exchange rate is fetched in real-time and passed to the chatbot context.

### Phase 10 (Daily Email Digest & Alerts)
- Leveraged custom Gmail MCP service (`gmail_send_message` via standard MCP client) to handle transaction/alert emails rather than setting up separate SMTP or third-party paid providers.
- Email triggers are integrated directly into the `process-news` cron pipeline, checking user preference filters (severity threshold and alert toggles) before firing a dispatch.
- Added support for 3x daily digests (9:00 AM, 3:00 PM, 11:00 PM IST) and restricted immediate real-time emails to high-severity events only to optimize user experience.
- Implemented robust API key rotation for both Groq (`callGroq`) and Gemini (`callGemini`) clients using multi-key environments (`GROQ_API_KEYS` and `GEMINI_API_KEYS`) to protect uploader OCR and background chronologies against 429 rate-limits and credential failures.