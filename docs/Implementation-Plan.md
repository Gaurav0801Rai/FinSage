# FinSage — Master Implementation Plan

This document serves as the master implementation plan and blueprint for **FinSage**, tracing the implementation of the platform from its foundations to its fully realized state as an AI-powered portfolio intelligence platform.

---

## 1. Goal & Architecture Overview

The goal of **FinSage** is to resolve information overload for retail investors holding diversified assets (Indian equities + global cryptocurrencies) by filtering news signals, analyzing relevance via Gemini AI, and presenting a unified premium dashboard alongside a 24/7 interactive chatbot and daily email digests.

### Key Architectural Guidelines
- **Server/Client Split**: Server operations utilize the `firebase-admin` SDK (`src/lib/firebase/admin.ts`), and client-side actions leverage the standard `firebase` client SDK (`src/lib/firebase/client.ts`).
- **No Firebase Storage**: Portfolio screenshots are parsed in-memory as base64 strings by Gemini Vision to eliminate storage costs and maintain user privacy.
- **Two-Stage AI Filter**: Stage 1 uses a local ticker dictionary string-match filter (zero cost) to drop 95% of irrelevant news. Stage 2 uses Gemini 2.5 Flash on the surviving articles and caches base analyses.
- **Always Confirm OCR**: Extracted holdings from Gemini Vision are presented on an editable review screen prior to writing to the database.
- **Soft Deletes**: Deletions of user holdings and watchlist entries set a `deletedAt: Timestamp` field rather than hard-deleting records.

---

## 2. Design System Tokens

All design tokens are configured in [tailwind.config.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/tailwind.config.ts):
- **Core Background**: `#090D12` (deep space navy-black)
- **Primary Accent (Brand Gold)**: `#E2B659` (glow transition `#D4AF37`)
- **Secondary Accent (Trust Blue)**: `#1F4E79` (hover/deep navy `#1A365D`)
- **Visual Performance Signals**: Gain = `#10B981` (emerald green), Loss = `#F43F5E` (rose red)
- **Surfaces**: Workspace panels `#121820` with subtle border `border-white/[0.06]` (lifts to `white/[0.12]` on hover)
- **Corner Radius**: Standard `12px` (`rounded-[12px]`)
- **Fonts**: `Geist Sans` (UI text) + `Geist Mono` (tabular-nums for tabular performance/monetary metrics)

---

## 3. Implementation Phases Checklist

### Phase 1A — Foundation and Design System ✅
Setup initial scaffolding, configure styling configurations, establish baseline types, and integrate branding assets.
- **Files Created/Modified**:
  - `[NEW]` [tailwind.config.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/tailwind.config.ts) (Configured brand tokens)
  - `[NEW]` [globals.css](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/globals.css) (Wired glassmorphic, panel card, and btn glow utility styles)
  - `[NEW]` [constants.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/constants.ts) (Defined page paths `ROUTES`)
  - `[NEW]` [types/index.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/types/index.ts) (Baseline TS interfaces for holdings, news, prices, and settings)
  - `[NEW]` [ambient-background.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/brand/ambient-background.tsx) (Premium atmospheric glowing mesh gradient background)
  - `[NEW]` [noise-overlay.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/brand/noise-overlay.tsx) (Subtle SVG grain overlay for texture)

### Phase 1B — Auth, Session, Dashboard Shell ✅
Secure cookie-based authentication using Firebase client-side SDK for credential inputs, and Server Actions to manage `pp_session` httpOnly session cookies.
- **Files Created/Modified**:
  - `[NEW]` [middleware.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/middleware.ts) (Guards dashboard routes via Edge-compatible session cookie checks)
  - `[NEW]` [actions/auth.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/actions/auth.ts) (Server actions for signing in, registering, resetting passwords, and setting session cookies)
  - `[NEW]` [login/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/login/page.tsx) / [signup/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/signup/page.tsx) / [reset/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/reset/page.tsx) (Beautiful auth screens)
  - `[NEW]` [layout/sidebar.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/layout/sidebar.tsx) / [layout/topbar.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/layout/topbar.tsx) (Main workspace sidebar & top control bars)

### Phase 2 — Portfolio Ingestion ✅
Implement drag-and-drop file upload capabilities, routing parsed screenshots directly to Gemini Vision via REST endpoint for OCR extraction.
- **Files Created/Modified**:
  - `[NEW]` [actions/portfolio.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/actions/portfolio.ts) (Handles screenshot parsing Server Action and saving confirmed items)
  - `[NEW]` [portfolio/upload/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/portfolio/upload/page.tsx) (Ingestion interface with file dropzone, visual loaders, and confirmation states)
  - `[NEW]` [portfolio/review-table.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/portfolio/review-table.tsx) (Editable holdings preview grid for user modifications prior to committing to DB)

### Phase 3 — Dashboard ✅
Render high-level metrics, charts, and holdings grid in tabular format with live market coordinates.
- **Files Created/Modified**:
  - `[NEW]` [lib/price-service.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/price-service.ts) (In-memory cached wrapper query engine fetching from Yahoo Finance and CoinGecko)
  - `[NEW]` [dashboard/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/dashboard/page.tsx) (Unified dashboard display rendering charts, totals, and stats rows)
  - `[NEW]` [components/dashboard/performance-chart.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/dashboard/performance-chart.tsx) (Area charts with custom visual gradients)
  - `[NEW]` [components/dashboard/allocation-chart.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/dashboard/allocation-chart.tsx) (Donut metrics chart displaying category groupings)

### Phase 4 — News Ingestion Pipeline ✅
A background job fetching articles from major RSS feeds and NewsAPI, running ticker-dictionary matches for filtering.
- **Files Created/Modified**:
  - `[NEW]` [lib/news-ingestion.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/news-ingestion.ts) (Aggregates articles, checks MD5 dedupKeys, and filters based on active ticker lists)
  - `[NEW]` [api/cron/ingest-news/route.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/api/cron/ingest-news/route.ts) (Automated ingestion endpoint triggered periodically by scheduler)
  - `[NEW]` [lib/ticker-dictionary.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/ticker-dictionary.ts) (Dictionary mapping company/project names to ticker symbols for Stage 1 filter)

### Phase 5 — Alerts System ✅
Generates alerts mapped to user holdings, utilizing a wrapper pattern to prevent infinite render loops when updating unread counts.
- **Files Created/Modified**:
  - `[NEW]` [actions/alerts.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/actions/alerts.ts) (Server Actions to read, dismiss, and archive user alerts)
  - `[NEW]` [alerts/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/alerts/page.tsx) (Lists personalized alerts categorized by severity thresholds)
  - `[NEW]` [components/layout/sidebar-wrapper.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/layout/sidebar-wrapper.tsx) (Server component wrapper passing active alert counts to client navigators)

### Phase 6 — Settings ✅
Enables managing account profile metadata, primary display currencies (INR or USD), and customizable alerts thresholds.
- **Files Created/Modified**:
  - `[NEW]` [actions/settings.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/actions/settings.ts) (Server actions managing profile names, preferred settings, and data wipes)
  - `[NEW]` [settings/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/settings/page.tsx) (Configures settings widgets, currencies, and the verification-guarded "Danger Zone")

### Phase 7 — Watchlist ✅
Adds watchlist sections separating tracked items from capital-allocated holdings.
- **Files Created/Modified**:
  - `[NEW]` [actions/watchlist.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/actions/watchlist.ts) (Server actions for adding, removing, or transitioning watchlist assets to holdings)
  - `[NEW]` [watchlist/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/watchlist/page.tsx) (Renders tracked watchlist assets with real-time price queries)
  - `[NEW]` [api/prices/route.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/api/prices/route.ts) (Safe API route for client-side queries wrapper around price service details)

### Phase 8 — Polish & Rebrand ✅
Perform rebrand overhaul of all dashboards to the premium **FinSage** gold/blue workspace theme, ensuring styling consistency.
- **Files Created/Modified**:
  - `[MODIFY]` [tailwind.config.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/tailwind.config.ts) (Overhauled branding color scheme to primary Brand Gold `#E2B659` and Trust Blue `#1F4E79`)
  - `[MODIFY]` [globals.css](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/globals.css) (Upgraded cards styling to deep workspace surfaces `#121820` with gold/blue border glows)
  - `[MODIFY]` [layout/topbar.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/layout/topbar.tsx) (Linked bell alert icons directly to `/alerts`)
  - `[MODIFY]` [dashboard/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/dashboard/page.tsx) (Enhanced holdings tables typography to bold weights for scan speeds)

### Phase 9 — 24/7 AI Chatbot Assistant ✅
Floating chatbot interface using Groq (Llama-3.3-70b-versatile) with automatic fallback to Gemini 2.5 Flash, feeding RAG context of holdings, P&L calculations, and exchange rates.
- **Files Created/Modified**:
  - `[NEW]` [actions/chatbot.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/actions/chatbot.ts) (Processes RAG inputs, runs LLM fetch, and enforces 25-message rolling history cleanup in Firestore)
  - `[NEW]` [components/chatbot/chat-interface.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/chatbot/chat-interface.tsx) (Client drawer component rendering the interactive chatbot and customizable mascot)
  - `[NEW]` [lib/exchange-rate.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/exchange-rate.ts) (Fetches and caches live USD/INR exchange rate queries to prevent conversion hallucinations)

### Phase 10 — Daily Email Digest & Alerts ✅
Wires up background email dispatching triggered directly during the news processing cron jobs.
- **Files Created/Modified**:
  - `[MODIFY]` [api/cron/process-news/route.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/api/cron/process-news/route.ts) (Wired user alerts filters matching thresholds and sending digest details)
  - `[NEW]` [lib/mcp-client.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/mcp-client.ts) (Generic Client calling MCP server endpoints, specifically invoking `gmail_send_message` for alerts dispatching)

### Phase 11 — Post-Release Operational Fixes ✅
Resolve client-side environment variable sanitization, Windows carriage return parsing in LLM models, layout viewport locks, and daily return percentages.
- **Files Created/Modified**:
  - `[MODIFY]` [client.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/firebase/client.ts) (Added cleanEnvValue to sanitise env vars from hidden carriage return/line break symbols)
  - `[MODIFY]` [chatbot.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/actions/chatbot.ts) / [process-news/route.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/api/cron/process-news/route.ts) / [send-digests/route.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/api/cron/send-digests/route.ts) (Trimmed GROQ_MODEL variables to prevent model lookup 404 errors)
  - `[MODIFY]` [mobile-nav.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/layout/mobile-nav.tsx) (Wired AI Chatbot links and icons to fully match desktop sidebar navigators)
  - `[MODIFY]` [layout.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/layout.tsx) / [sidebar.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/layout/sidebar.tsx) (Locked desktop view height to h-screen and enabled main viewport overflow scrolling to fix left sidebar position)
  - `[MODIFY]` [price-service.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/price-service.ts) (Modified Yahoo Finance range query to 1d to retrieve exact previous-close prices for daily return metrics)

---

## 4. Database Schema Structure

The database leverages Firestore (`asia-south2` Delhi region). Document schemas are structured as:

```typescript
// users/{uid}
interface UserDoc {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  preferences: {
    baseCurrency: "INR" | "USD";
    alertSeverityThreshold: "high" | "medium" | "low";
    emailAlerts: boolean;
    pushAlerts: boolean;
    dailyDigest: boolean;
    digestTime: string; // "HH:mm"
    timezone: string; // e.g. "Asia/Kolkata"
  };
}

// users/{uid}/holdings/{holdingId}
interface HoldingDoc {
  symbol: string;
  name: string;
  type: "stock" | "crypto" | "mutual_fund" | "etf";
  exchange: "NSE" | "BSE" | null;
  quantity: number;
  avgBuyPrice: number;
  currency: "INR" | "USD";
  addedAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null; // Soft deletes
  source: "ocr" | "manual" | "import";
}

// users/{uid}/watchlist/{itemId}
// (Identical struct to HoldingDoc, quantity & avgBuyPrice = 0)

// users/{uid}/alerts/{alertId}
interface AlertDoc {
  newsId: string;
  severity: "high" | "medium" | "low";
  affectedHoldings: string[];
  affectedSymbols: string[];
  whyItMatters: string;
  impactSummary: string;
  confidence: number;
  createdAt: Timestamp;
  readAt: Timestamp | null;
  dismissed: boolean;
}

// users/{uid}/chats/{messageId}
interface ChatMessageDoc {
  role: "user" | "model";
  text: string;
  createdAt: Timestamp; // ServerTimestamp on write, mapped to ms number on read
}
```

---

## 5. Verification & Testing

### Automated Build Validation
Execute compilation validation checks:
```bash
npm run typecheck
npm run build
```

### Manual Verification
1. **Cron Tests**:
   - Make a `GET` request to `/api/cron/ingest-news` to check RSS scrapers.
   - Make a `GET` request to `/api/cron/process-news` to run relevance analysis and verify MCP Gmail alert triggers.
2. **Interactive Chatbot**:
   - Open chatbot drawer, send test query (e.g. "How is my portfolio doing today?"), check live RAG performance computation.
   - Send unrelated query (e.g. "What is the capital of France?"), check that the AI politely declines.
3. **Editable Review Ingestion**:
   - Upload screenshot, verify holdings are extracted accurately, test editing fields in the review table, and confirm database write.
