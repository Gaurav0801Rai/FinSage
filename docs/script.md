# 💼 FinSage — Product Manager (PM) Interview Presentation Script

This document serves as a study guide and speaking script for a PM interview. It structures the creation of **FinSage** as a product design case study. It is written to answer the common interview question: **"Walk me through a product you designed or built from scratch."**

---

## 1. The 3-Minute Interview Pitch (Speaking Script)

*Use this script when the interviewer says: "Tell me about a product you've built."*

> "I'd like to talk about **FinSage**, an AI-powered portfolio intelligence dashboard I designed for self-directed retail investors in India who hold national stocks and cryptocurrencies.
>
> **The Problem:** 
> Retail investors suffer from extreme 'information overload.' They hold assets across multiple apps (like Zerodha and Binance) and spend 30 to 50 minutes a day checking news portals to see if any market events affect their money. 95% of generic financial news is noise, which creates anxiety and cognitive fatigue.
>
> **The Solution:** 
> FinSage is a smart monitoring dashboard. It does three things:
> 1. **Frictionless Setup:** Users upload a screenshot of their broker terminal. An AI reader (OCR) extracts their holdings instantly without requiring manual typing.
> 2. **AI News Filter:** The system screens daily articles. It drops 95% of irrelevant noise through keyword matching and uses AI to summarize only the high-impact events for their specific holdings, explaining in plain English 'Why it matters.'
> 3. **Context-Aware Assistant:** A floating AI chatbot that reads their live holdings value to answer questions about their performance in real-time.
>
> Let's walk through the key design decisions, trade-offs, and metrics behind this product."

---

## 2. Deep Dive: Target User & Core Pain Points

*Be ready to discuss the customer segments and why they were chosen.*

### Target Persona: The Self-Directed Retail Investor
* **Profile**: Age 20-40, digitally native, holds 5-15 stocks on NSE/BSE plus some cryptocurrency assets.
* **Broker tools**: Uses modern trading apps like Zerodha, Groww, Upstox, or Angel One as their primary broker.
* **Information Sources**: Reads financial portals like ET Markets, MoneyControl, or CoinDesk but finds the sheer amount of daily articles overwhelming.
* **Resource Gap**: Does not have access to institutional research or premium financial terminals; relies heavily on YouTube, Twitter, and community forums for investment ideas.
* **Primary Pain Point**: Spends 30-50 minutes every day manually checking websites and search engines to see if any news affects their specific holdings.

---

## 3. Key Product Design Choices (UX Rationale)

*Explain the "Why" behind the user experience decisions.*

### Decision 1: Collapsible Holdings-Wise Alerts Layout
* **Old Way**: A chronological feed of alerts (like a standard notification center).
* **FinSage Design**: Grouping alerts under collapsible cards for each asset (e.g., "Ethereum (ETH) - 2 new alerts").
* **PM Rationale**: A chronological feed causes anxiety. Grouping alerts by asset allows users to focus on one holding at a time. By automatically expanding groups with *unread* alerts and collapsing the rest, we respect the user's attention and reduce screen clutter.

### Decision 2: In-Memory Screenshot Ingestion
* **Old Way**: Asking users to connect their brokers via APIs or uploading screenshots to a server database.
* **FinSage Design**: Users drag and drop a screenshot. The system extracts holdings text in-memory and immediately discards the image.
* **PM Rationale**: Direct broker integrations create high user friction due to security concerns. Staging screenshots on a database costs money and risks privacy leaks. In-memory extraction delivers a magic onboarding experience in under 30 seconds while building high user trust because we store **zero** user images.

---

## 4. Technical Architecture: What We Used & How

*Use this section to explain how the product actually works under the hood in simple PM-friendly terms.*

```
[User Browser] (Next.js / Tailwind CSS / Framer Motion / Recharts)
      │
      ├─► (Secure Session Cookie) ──► [Firebase Auth]
      ├─► (Portfolio Screenshot) ───► [Gemini 2.5 Flash] (In-memory OCR - no files saved)
      ├─► (Conversational Chat) ────► [Groq API / Llama 3.3] (Real-time Portfolio RAG)
      │
      └─► (Read/Write Data) ────────► [Cloud Firestore] (Holdings, Alerts, Watchlist)
                                            ▲
                                            │
[Background Timers] (GitHub Actions) ───────┴─► [News Scrapers / RSS] ──► [Gmail alerts]
```

### 1. The Frontend (The User Interface)
* **What we used**: **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.
* **How it works**: Next.js is a React framework that lets us run code on the server and on the user's browser. TypeScript acts as a strict grammar check to prevent bugs. Tailwind CSS manages the premium styling.
* **Why**: Server Components load initial pages instantly (improving speed), and Client Components manage interactive pieces like expandable accordions.

### 2. Animations & Visual Data (Premium UI Feel)
* **What we used**: **Framer Motion** and **Recharts**.
* **How it works**: Framer Motion powers the smooth slide-down/slide-up animations when expanding holdings groups. Recharts converts holdings data into visual charts (area graphs for performance and donut charts for asset allocations).

### 3. Database & Security (The Storage & Login Room)
* **What we used**: **Firebase Auth** and **Cloud Firestore**.
* **How it works**: Firebase Auth handles secure user logins (via Email/Password and Google). The user's logged-in session is saved in an encrypted browser cookie (called `pp_session`). Firestore is a secure, cloud-based database that stores user data (holdings, watchlists, alerts, and chat history) in structured folders.

### 4. AI Screenshot Reader (In-Memory OCR)
* **What we used**: **Gemini 2.5 Flash API**.
* **How it works**: When a user uploads a broker screenshot, the browser converts the image into a long text code (called a **base64 string**). Next, the server sends this text string directly to the Gemini Vision model. Gemini reads the image content, extracts the tickers, quantities, and prices, and returns it as a structured data list. 
* **The "How" of Privacy**: We process the image entirely in temporary server memory and **never save the image files to any database**, eliminating storage costs and ensuring user privacy.

### 5. News Processing & Alert Pipeline (The Background Engine)
* **What we used**: **GitHub Actions** (Timers), **RSS feeds / NewsAPI**, and **Gmail API**.
* **How it works**: A background timer (Cron job) runs automatically. Every 5 minutes, it pulls recent news articles from finance websites. First, a cheap filter matches article text against user stock tickers. If a ticker matches, the server calls the Gemini AI API to write a plain-English "Why it matters" summary and rates the severity (High, Medium, Low). High-severity alerts automatically trigger an email to the user.

### 6. Floating AI Assistant (Context-Aware Chat)
* **What we used**: **Groq API (Llama-3.3-70b model)** with **Gemini 2.5 Flash** as a fallback.
* **How it works**: When you chat with the mascot assistant, the server uses a technique called **RAG (Retrieval-Augmented Generation)**. Before sending your question to the AI, the server queries Firestore to fetch your active holdings and latest alert summaries. It passes this context along with your question to the AI, allowing the chatbot to answer questions like *"Why is my portfolio down today?"* with complete, personal accuracy.

---

## 5. Engineering & Resource Trade-Offs (Cost vs. Scalability)

*Demonstrate your ability to collaborate with engineers and manage costs.*

### Trade-Off 1: Two-Stage AI News Filter
* **The Challenge**: Sending thousands of scraped news articles directly to Gemini AI for analysis would cost thousands of dollars in API bills.
* **The Solution**: We implemented a two-stage filter:
  - **Stage 1 (Rule-Based)**: A simple code check matches article text against the user's stock tickers. This filters out 95% of articles at zero cost.
  - **Stage 2 (AI-Powered)**: Only the matching articles are sent to the AI for impact analysis. The resulting analysis is cached so if multiple users hold the same stock, the AI is only queried once.

### Trade-Off 2: Scoping Out Mutual Funds Live Prices
* **The Challenge**: Users wanted to track Indian Mutual Funds.
* **The Decision**: We scoped out live mutual fund price tracking as a **Non-Goal**.
* **PM Rationale**: Mutual fund prices (NAVs) are only updated by fund houses once a day after market hours (around 9 PM IST). Intraday tick-by-tick tracking is impossible. Rather than spending engineering time trying to build live fetches, we allowed users to manually add mutual fund quantities for allocation tracking but explicitly declared that live pricing updates are not supported.

---

## 6. Success Metrics Framework

*Structure your metrics using the standard North Star Framework.*

* **North Star Metric (NSM)**: 
  * *News Noise Reduction Rate*: Target is **> 95% reduction** in news volume (Ratio of raw articles scraped vs. alerts generated for the user).
* **Primary Metrics (Adoption & Engagement)**:
  * *Alert Relevance Rate*: Target is **> 90% user approval** (measured by thumbs up/down feedback on alerts).
  * *Chatbot Response Accuracy*: Target is **> 95% accurate answers** (evaluated by reviewing flagged chatbot conversations).
  * *Onboarding Time*: Target is **< 30 seconds** using screenshot upload.
* **Guardrail Metrics (Safety)**:
  * *Email Unsubscribe Rate*: Target is **< 2%** (ensuring high-severity email notifications are helpful, not spammy).
  * *API Response Latency*: Target is **< 1.5 seconds** p95 load time.

---

## 7. PM Interview Q&A Cheat Sheet (Common Follow-up Questions)

#### Q1: "Why not integrate directly with broker APIs (like Zerodha Connect) instead of using screenshots?"
> **A**: "While direct API integration provides live syncing, it introduces three major issues: high subscription costs, compliance hurdles with SEBI (Indian market regulator), and user trust issues. Users are highly protective of their broker credentials. By using screenshot uploads, we bypassed compliance delays, avoided subscription costs, and built immediate user trust through a secure, local, in-memory reader."

#### Q2: "How do you handle AI hallucinations where the chatbot might give wrong financial info?"
> **A**: "We implement strict guardrails. First, the chatbot has no access to make general web searches; its prompt restricts it exclusively to the user's live holdings data and verified news alerts. Second, we include a clear disclaimer that the bot provides information and analysis, not direct financial recommendations or buy/sell calls."

#### Q3: "What would you build next in Phase 11?"
> **A**: "I would focus on improving the news ingestion accuracy. Specifically, building an AI name-mapping dictionary. Sometimes a news article mentions 'Reliance Industries' but the user holds 'RELIANCE.NS'. Currently, Stage 1 relies on exact ticker matching. Building a smart entity-linking dictionary would ensure we capture articles that refer to holdings by their company names rather than just their trading symbols."
