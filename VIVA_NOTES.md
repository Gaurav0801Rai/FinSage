# FinSage — Viva Defense & Technical Master Guide

> **Examiner-Ready Quick Reference:** Keep this document open during your project viva. It covers the core concept in plain English, novelties, tech stack, CSS comparisons, and the background scheduler logic.

---

## 1. Project Explanation in Simple Words (Say This First)

> *"Imagine you are an investor holding shares in 10 different companies like Reliance, TCS, or Bitcoin.*  
> *Every single day, financial portals publish over 2,000 news articles. Reading all of them is impossible, and 99% of them are completely irrelevant to your personal investments.*  
>  
> * **FinSage acts as your personal AI financial analyst.**  
> 1. You can simply upload a screenshot of your portfolio from Zerodha, Groww, or AngelOne. FinSage's AI vision instantly reads your holdings without you having to type anything manually.  
> 2. FinSage continuously monitors high-frequency financial news from major sources.  
> 3. It filters out all the noise and flags **only the news that directly impacts your specific holdings**.  
> 4. Instead of complicated jargon, it gives you a clean 2-sentence summary: **'What happened'** and **'Why it matters to your portfolio'**, with an impact score (High, Medium, Low).  
> 5. It includes a 24/7 AI chatbot that already knows your live portfolio P&L to answer your financial queries, and sends scheduled email digests so you never miss critical market moves."*

---

## 2. What is the Novelty? (Why is FinSage Unique?)

When the examiner asks: **"What is new or novel about your project compared to existing apps like Moneycontrol or Groww?"**

1. **Contextual Personal Impact (Not Generic News Feeds):**  
   Existing financial apps just dump a generic list of headlines. FinSage correlates live news against the user's specific assets, evaluating how an event directly affects their personal holdings and categorizing severity.
2. **Zero-Storage Privacy-First OCR:**  
   Users don't need to manually enter 50 stocks or link sensitive brokerage trading APIs. They simply drop a screenshot. Gemini Vision extracts the data in-memory directly as structured JSON. The user's financial screenshot is **never stored on disk or cloud storage**, protecting user privacy.
3. **Two-Stage Cost-Optimized AI Filter:**  
   Running LLMs on thousands of news articles daily would bankrupt a developer with API bills. FinSage uses a novel 2-stage pipeline: a lightning-fast regex/keyword matcher drops 95% of irrelevant noise at **zero cost**, and only the surviving 5% of relevant articles are passed to the AI.
4. **Live RAG (Retrieval-Augmented Generation) Chatbot:**  
   Unlike ChatGPT which gives generic answers, FinSage's chatbot dynamically pulls the user's live holdings, today's P&L, real-time Yahoo Finance / CoinGecko prices, and current USD/INR exchange rates directly into its prompt context.
5. **Agentic Email Dispatch via MCP (Model Context Protocol):**  
   Utilizes an autonomous MCP server to dispatch real-time Gmail alerts and digests directly from the news analysis cron, without relying on paid third-party marketing email SaaS (like SendGrid or Mailchimp).

---

## 3. Technical Languages Used in This Project

* **TypeScript (Primary Language):** Used across the entire Next.js full-stack application (frontend components, backend Server Actions, database queries, and API routes). Provides static typing, preventing runtime bugs.
* **JavaScript (Node.js runtime):** Powers the Next.js server runtime and client-side execution.
* **Python:** Used for the Google MCP Server (FastAPI), managing Google Docs and Gmail API OAuth automation.
* **HTML5 / TSX:** Component markup and structural semantics.
* **CSS / Tailwind CSS:** Utility styling tokens and visual layout rules.

---

## 4. CSS Architecture: Tailwind CSS vs Framer Motion & CSS Types

### What is the difference between Tailwind CSS and Framer Motion?
* **Tailwind CSS** is a **styling utility framework** — it controls **how things LOOK statically**:  
  Colors, padding, margins, flexbox, grid, font sizes, borders, and responsive breakpoints (e.g., `flex items-center p-4 bg-[#090D12] text-amber-400`).
* **Framer Motion** is an **animation library for React** — it controls **how things MOVE dynamically**:  
  Page entry transitions, spring physics, staggered card loads, smooth layout changes, and hover/click animations.

### What are the different types of CSS, and why did we choose Tailwind?

| CSS Approach | How It Works | Pros & Cons |
|---|---|---|
| **Vanilla / Plain CSS** | Written in separate `.css` files with standard selectors (`.card { ... }`). | Simple to start, but CSS files grow huge, classes conflict globally, and unused CSS accumulates. |
| **CSS Preprocessors (SASS/SCSS)** | Adds nesting, variables, and mixins to plain CSS. | Better code organization, but still outputs large global stylesheets. |
| **CSS Modules** | Local `.module.css` files scoped to single components. | Avoids naming collisions, but requires constant switching between `.tsx` and `.css` files. |
| **CSS-in-JS (Styled Components)** | CSS written inside JavaScript templates. | Dynamic styles, but introduces performance overhead and doesn't work well with React Server Components. |
| **Utility-First CSS (Tailwind CSS)** *(Chosen)* | Pre-built utility classes composed directly in HTML/JSX. | **Why used:** Zero dead CSS (purges unused classes at build time), ultra-small production bundle, zero class-name collisions, and easy customization of design tokens (`#090D12` workspace dark mode, `#E2B659` gold accents). |

---

## 5. Background Scheduler & Pipeline Logic

### What Scheduler is used?
* FinSage uses a **REST-driven Cron Architecture** (`/api/cron/process-news` and `/api/cron/send-digests`).
* In production, scheduled HTTP triggers (via Vercel Cron or any automated ping service) invoke these endpoints automatically.
* For testing or live demos, the entire pipeline can be triggered on-demand via a simple browser/Postman request.

### Step-by-Step Logic of the Scheduler Pipeline:

```
[RSS Feeds & NewsAPI] 
       │
       ▼
[1. Deduplication] ────► Computes MD5 hash (title + source); drops duplicates
       │
       ▼
[2. Stage 1 Filter] ───► String match against 150+ Ticker Dictionary (No AI, Zero Cost)
       │                 (Drops ~95% of irrelevant articles)
       ▼
[3. Stage 2 Filter] ───► Groq (openai/gpt-oss-120b) or Gemini 2.5 Flash
       │                 Extracts: Severity (High/Med/Low) + "Why it matters" JSON
       ▼
[4. Alert Fan-Out] ────► Matches affected tickers with user portfolios in Firestore
       │                 Writes personalized alert documents to users/{uid}/alerts
       ▼
[5. MCP Digest Trigger]► Runs at 9:00 AM, 3:00 PM, 11:00 PM IST
                         Batches unread alerts and sends clean emails via Gmail MCP
```

1. **Ingestion & Dedup:** The worker pulls news from Economic Times, Moneycontrol, Reuters, CoinDesk, and NDTV Profit. It generates a hash `dedupKey` to prevent reprocessing duplicate stories.
2. **Stage 1 (Keyword Filtering):** Fast regex searches the text for tickers (e.g. `RELIANCE`, `TCS`, `BTC`). If no held ticker or macro event is found, it is dropped immediately.
3. **Stage 2 (AI Impact Evaluation):** Articles mentioning held assets are sent to the LLM (`openai/gpt-oss-120b` via Groq, falling back to Gemini). The AI outputs JSON with an impact score and plain-English explanation.
4. **User Alert Mapping:** For each affected ticker, the worker queries Firestore to find users holding that stock and creates individualized alerts.
5. **Scheduled Email Digests:** A secondary cron aggregates high-priority alerts and dispatches formatted daily digests through the Google MCP Server on Vercel.

---

## 6. Complete Tech Stack Summary Table

| Layer | Technology | Role in Project |
|---|---|---|
| **Frontend Framework** | Next.js 14 App Router | React Server Components, client interactivity, routing |
| **Language** | TypeScript | Strict type safety across client and server boundaries |
| **Styling** | Tailwind CSS | Utility-first responsive design, dark theme tokens |
| **Motion** | Framer Motion | Smooth page transitions and staggered metric reveals |
| **Charts** | Recharts | Interactive SVG portfolio allocation and history charts |
| **Auth** | Firebase Auth | Secure httpOnly session cookie authentication |
| **Database** | Cloud Firestore (`asia-south2`) | User profiles, holdings, watchlist, and chat logs |
| **OCR Ingestion** | Google Gemini Vision | In-memory extraction of portfolio holdings from screenshots |
| **Primary LLM** | Groq API (`openai/gpt-oss-120b`) | Ultra-fast inference for news analysis and chatbot |
| **Fallback LLM** | Google Gemini 2.5 Flash | Automatic backup LLM on Groq rate-limits or downtime |
| **Live Market Feeds** | Yahoo Finance & CoinGecko | Real-time Indian equity and crypto price feeds |
| **Email Integration** | Google MCP Server (FastAPI) | Autonomous Gmail message dispatch for alerts/digests |
| **Scheduler** | Next.js Cron Endpoints | Automated ingestion, analysis, and digest execution |

---

## 7. Fast-Fire Viva Q&A

**Q: Why Next.js 14 instead of simple React (Vite)?**  
*A: Next.js allows React Server Components and Server Actions. Sensitive credentials (Firebase Admin private key, Groq/Gemini API keys) remain 100% hidden on the server, while the client gets fast, pre-rendered pages.*

**Q: Why didn't you use Tesseract for OCR?**  
*A: Tesseract is a traditional OCR engine that only extracts raw characters without understanding layout structure. Gemini Vision understands tabular financial layouts (columns of stock names, buy prices, quantities) and converts them into structured JSON.*

**Q: How does the chatbot avoid hallucinating exchange rates or prices?**  
*A: It uses RAG (Retrieval-Augmented Generation). We fetch live USD/INR exchange rates and live stock prices before the prompt is sent to the LLM, instructing it strictly to use those values.*

**Q: Is user data hard-deleted when they remove a stock?**  
*A: No, we use Soft Deletes (`deletedAt: Timestamp`). This maintains data integrity and audit history while filtering out deleted assets from UI queries.*
