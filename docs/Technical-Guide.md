# FinSage — Technical Architecture & Operations Guide

This document is the comprehensive guide to the architecture, Firestore database structures, operational workflows, and security rules for **FinSage**.

---

## 1. Environment Configurations

Ensure the following variables are defined in your `.env.local` file for development and configured in Vercel for production:

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client & Server | Firebase Client Authentication initialization |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client & Server | Firebase Auth routing |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client & Server | Firebase App Target |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | Firebase cloud messaging (reserved) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Firebase Client Identifier |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | — | Defined but unused (Storage not configured) |
| `FIREBASE_ADMIN_PROJECT_ID` | Server Only | Firestore Admin SDK Credentials |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Server Only | Firestore Admin SDK service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server Only | Firestore Admin SDK private key |
| `GEMINI_API_KEY` | Server Only | Google Gemini AI & Vision endpoints access (used as fallback for chatbot) |
| `GROQ_API_KEY` | Server Only | Primary API key for chatbot completions (Groq API) |
| `GROQ_MODEL` | Server Only | Optional. Model ID for chatbot on Groq (defaults to `llama-3.3-70b-versatile`) |
| `NEWS_API_KEY` | Server Only | Target keyword queries for news ingestion pipeline |
| `REDDIT_CLIENT_ID` | Server Only | Reddit API ingestion access (Phase 4) |
| `REDDIT_CLIENT_SECRET` | Server Only | Reddit API ingestion secret key |
| `CRON_SECRET` | Server Only | Authentication token for Vercel Cron routes |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Root URL of the deployed app for auth redirects |

---

## 2. Firestore Collections & Schema

All documents leverage automatic ID generation unless noted. Timestamps are written as Firestore `Timestamp` objects but serialized to ISO strings (`toDate().toISOString()`) before crossing the server-to-client boundary in Next.js.

### `users/{uid}` (Root collection)
*   **Purpose**: Account meta and display preferences.
*   **Schema**:
    ```typescript
    interface UserDoc {
      email: string;             // Lowercased
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
        digestTime: string;      // Format "HH:mm"
        timezone: string;        // IANA timezone, e.g., "Asia/Kolkata"
      };
      onboarding: {
        portfolioUploaded: boolean;
        completedAt: Timestamp | null;
      };
    }
    ```

### `users/{uid}/holdings/{holdingId}` (Subcollection)
*   **Purpose**: Assets held in the user's active portfolio.
*   **Schema**:
    ```typescript
    interface HoldingDoc {
      symbol: string;            // UPPERCASE, e.g., "RELIANCE", "BTC"
      name: string;              // Company/Asset Name
      type: "stock" | "crypto" | "mutual_fund" | "etf";
      exchange: "NSE" | "BSE" | null;
      quantity: number;          // Decimals supported
      avgBuyPrice: number;       // Currency denominated in `currency` field
      currency: "INR" | "USD";
      addedAt: Timestamp;
      updatedAt: Timestamp;
      deletedAt: Timestamp | null; // Soft deletes
      source: "ocr" | "manual" | "import";
    }
    ```

### `users/{uid}/watchlist/{itemId}` (Subcollection)
*   **Purpose**: Assets the user is currently monitoring.
*   **Schema**: Identical structure to `HoldingDoc`, except `quantity` and `avgBuyPrice` default to `0`.

### `users/{uid}/alerts/{alertId}` (Subcollection)
*   **Purpose**: AI relevance alerts matching the user's active portfolio.
*   **Schema**:
    ```typescript
    interface AlertDoc {
      newsId: string;            // Reference to global news collection
      severity: "high" | "medium" | "low";
      affectedHoldings: string[]; // List of holding IDs
      affectedSymbols: string[];  // Denormalized for display speeds
      whyItMatters: string;       // AI short explanation
      impactSummary: string;      // AI detailed impact summary
      confidence: number;         // Decimal 0 to 1
      createdAt: Timestamp;
      readAt: Timestamp | null;
      dismissed: boolean;
    }
    ```

### `users/{uid}/chats/{messageId}` (Subcollection)
*   **Purpose**: Stores RAG chatbot message history for the user (rolling limit of 25 messages is enforced).
*   **Schema**:
    ```typescript
    interface ChatMessageDoc {
      role: "user" | "model";
      text: string;
      createdAt: Timestamp; // Server timestamp on write, mapped to ms timestamp on read
    }
    ```

### `news/{newsId}` (Global collection)
*   **Purpose**: Feed articles processed by the ingestion engine.
*   **Schema**:
    ```typescript
    interface NewsDoc {
      source: string;            // "MoneyControl", "Reuters", etc.
      sourceUrl: string;
      sourceType: "rss" | "api" | "reddit" | "scrape";
      title: string;
      summary: string;
      publishedAt: Timestamp;
      fetchedAt: Timestamp;
      category: "stock" | "crypto" | "macro" | "geopolitical" | "reddit";
      tickers: string[];         // Extracted by Stage 1 Filter
      processed: boolean;        // Ingestion/Processing status
      dedupKey: string;          // MD5 Hash of title + source
      processingError?: string;  // Detailed log on AI parse failure
    }
    ```

### `news_analyses/{newsId}` (Global collection)
*   **Purpose**: Cached Gemini-derived analysis of news items. Document ID matches `news/{newsId}`.
*   **Schema**:
    ```typescript
    interface NewsAnalysisDoc {
      newsId: string;
      baseImpact: string;
      affectedSectors: string[];
      affectedSymbols: string[];
      severity: "high" | "medium" | "low";
      confidence: number;
      model: string;              // "gemini-2.5-flash"
      generatedAt: Timestamp;
      tokensUsed: number;
    }
    ```

### `prices/{symbol}` (Global collection)
*   **Purpose**: Live pricing snapshot of tracked equities and coins. Document ID is the symbol (e.g. `RELIANCE`).
*   **Schema**:
    ```typescript
    interface PriceDoc {
      symbol: string;
      name: string;
      type: "stock" | "crypto" | "mutual_fund" | "etf";
      exchange: "NSE" | "BSE" | null;
      currency: "INR" | "USD";
      price: number;
      previousClose: number;
      change: number;
      changePercent: number;
      fetchedAt: Timestamp;
      source: "yahoo" | "coingecko" | "nse";
    }
    ```

---

## 3. Database Indexes

To support active queries and ordering, ensure the following Firestore composite indexes are built:

| Collection ID | Scope | Fields & Sort Order | Purpose |
|---|---|---|---|
| `news` | Collection | `processed` (ASC) + `fetchedAt` (ASC) | Cron ingestion queue matching |
| `news` | Collection | `publishedAt` (ASC) + `__name__` | Time-based News filters |
| `holdings` | Collection Group | `deletedAt` (ASC) + `symbol` (ASC) | Scan across user portfolios on ticker events |
| `alerts` | Collection | `dismissed` (ASC) + `createdAt` (DESC) | Rendering user alerts board |

---

## 4. Operational Run & Test Guides

### 4.1 Running the local environment
1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch dev server:
   ```bash
   npm run dev
   ```
   The site will load at `http://localhost:3000`.

### 4.2 Manually testing Crons during development
Because local Next.js servers do not run vercel cron schedules automatically, you must invoke them using REST clients or your browser:

*   **Ingest raw articles**:
    Make a `GET` request to `http://localhost:3000/api/cron/ingest-news`. This will run the scraper and feed items into the raw `news` collection with `processed: false`.
*   **Run Stage 1 & Stage 2 processing**:
    Make a `GET` request to `http://localhost:3000/api/cron/process-news`. This will fetch unprocessed items, string match them against holdings dictionaries (Stage 1), invoke Gemini for matched items (Stage 2), cache analyses, and create targeted user alerts.

### 4.3 Firebase Security Rules Deployment
The project configures rules locally in `firestore.rules`.
Deploy them to the Firebase console via CLI:
```bash
firebase deploy --only firestore:rules
```
Ensure that the rule defines:
1. `users/{uid}` - Read/write access strictly authorized to matching authenticated `uid`.
2. `news`, `news_analyses`, `prices` - Global read permission, server write-only rules.

---

## 5. Troubleshooting & Operational Gotchas

### 5.1 Carriage Returns and Newlines in `.env.local` (Windows)
* **Problem**: Firebase Google Sign-In fails with `Illegal url for new iframe` containing `%0A`, or Groq calls fail with `404 Model Not Found` containing `\n`.
* **Cause**: On Windows systems, `.env.local` uses CRLF (`\r\n`) line endings. Next.js sometimes bundles the variables with a trailing `\r` or `\n` character, resulting in illegal strings.
* **Resolution**:
  * For client-side Firebase configurations, [client.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/firebase/client.ts) sanitizes all credentials with `cleanEnvValue()` to strip line endings.
  * For server-side LLM models, calls to `process.env.GROQ_MODEL` must be formatted as `.trim()` (e.g. in [chatbot.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/actions/chatbot.ts)).

### 5.2 Stickiness of Left Sidebar on Desktop
* **Behavior**: When scrolling long pages, the left sidebar scrolls out of view.
* **Resolution**: Constrain the parent element in [layout.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/layout.tsx) using `md:h-screen md:overflow-hidden` and let the child page container handle its own independent scroll: `flex-1 overflow-y-auto min-h-0`. Set the sidebar component height class to `h-full` rather than `min-h-screen`.

### 5.3 Calculating Daily returns
* **Gotcha**: Querying Yahoo Finance chart API with `range=5d` shifts `chartPreviousClose` in the metadata response to 5 trading days ago, showing 5-day performance instead of daily performance.
* **Resolution**: In [price-service.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/price-service.ts), use `range=1d` to ensure `chartPreviousClose` always represents the previous trading day's close.
