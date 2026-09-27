# FinSage — Viva Quick Reference & Project Defense Cheat Sheet

> **Quick Tip for Viva:** Keep this file open in your editor! If the examiner asks any technical question, all answers are categorized below.

---

## 1. The 4-Line Project Pitch
*(When the examiner asks: "Introduce your project" or "What does FinSage do?")*

> **"FinSage is an AI-powered portfolio intelligence platform built for Indian stock (NSE/BSE) and Crypto investors.**  
> Rather than acting as a broker or trading platform, it monitors high-frequency financial news, detects macro and company-specific events affecting the user's personal holdings, and delivers personalized impact alerts and daily email digests.  
> It features automated portfolio ingestion via Gemini Vision OCR from broker screenshots, and provides a 24/7 financial assistant chatbot powered by RAG (Retrieval-Augmented Generation) with live portfolio context."

---

## 2. Tech Stack: "What Did We Use Where & Why?"

| Component | Technology | Why We Used It (Examiner Defense) |
|---|---|---|
| **Core Framework & Language** | **Next.js 14 (App Router) + TypeScript** | Full-stack type safety, React Server Components (RSC), Server Actions for clean mutations, and native API routes for cron triggers. |
| **UI & Styling** | **Tailwind CSS + Framer Motion + Recharts + shadcn/ui** | Custom dark workspace theme (`#090D12`), financial tabular numbers (`Geist Mono`), smooth page transitions, and interactive portfolio performance charts. |
| **Authentication** | **Firebase Auth** | Session-cookie pattern with httpOnly cookies (secure against XSS), middleware route guards. |
| **Database** | **Cloud Firestore** | Low-latency NoSQL database deployed in Delhi region (`asia-south2`) to minimize latency for Indian users. |
| **Portfolio Ingestion (OCR)** | **Google Gemini Vision API** | Zero storage costs (base64 inline image, never saved to disk). Directly parses complex broker screenshots into sanitized JSON. Users review/edit before saving. |
| **Live Market Prices** | **Yahoo Finance (`yahoo-finance2`) + CoinGecko Free API** | Real-time prices for Indian stocks (`.NS` / `.BO`) and Crypto with a 60-second in-memory server cache. |
| **News Ingestion** | **Multi-source RSS + NewsAPI + Reddit API** | Ingests from Economic Times, Moneycontrol, Reuters, CoinDesk, CoinTelegraph, and NDTV Profit. |
| **News Analysis & Filtering** | **2-Stage Filter (Regex + Groq / Gemini)** | **Cost Control Architecture**: Stage 1 drops ~95% of irrelevant articles using fast string matching without calling AI. Stage 2 runs LLM analysis only on surviving articles. |
| **24/7 AI Chatbot** | **Groq API (`openai/gpt-oss-120b`) with Gemini 2.5 Flash Fallback** | Sub-second inference via Groq. Uses RAG to feed user's live holdings, P&L, exchange rates, and alerts into system instructions. Rolling 25-message history. |
| **Automated Email Alerts & Digests** | **Google MCP Server (Python FastAPI on Vercel)** | Uses Model Context Protocol (MCP) tool (`gmail_send_message`) to send transactional Gmail alerts without paying for third-party email providers. |

---

## 3. Important: The GitHub Scheduler / Background Cron

### Will the GitHub Scheduler not working cause any issue in the viva?
**NO, absolutely not.**

* **Examiner Perspective:** No examiner sits for 15 minutes waiting for a background GitHub Actions scheduler or cron job to run. They want to see the application work on-demand right in front of them.
* **How to Answer if Asked:**
  > *"Our backend architecture exposes secure REST endpoints: `/api/cron/process-news` and `/api/cron/send-digests`. Schedulers like GitHub Actions or Vercel Cron simply hit these API endpoints on a cron schedule. For demonstration or maintenance, these pipelines can be triggered on-demand via HTTP."*
* **How to Demo it Live:**
  Simply open a browser tab or Postman and hit:
  - `http://localhost:3000/api/cron/process-news` (ingests latest news, runs the 2-stage filter, and creates alerts)
  - `http://localhost:3000/api/cron/send-digests` (compiles and triggers alert emails via MCP)

---

## 4. Top Viva Questions & One-Line Answers

### Q1: "Why did you use Gemini Vision instead of Tesseract OCR for portfolio upload?"
> *"Tesseract only extracts raw characters and gets confused by complex multi-column broker tables. Gemini Vision understands financial context, recognizes symbols, quantities, and buy prices, and directly formats them into structured JSON with zero local training required."*

### Q2: "How do you control AI API costs with hundreds of news articles every day?"
> *"We built a Two-Stage Filtering architecture. Stage 1 is a zero-cost, string-matching filter against our ticker dictionary. It eliminates ~95% of articles before any AI is called. Only the remaining 5% of articles that mention user-held assets are sent to the LLM in Stage 2."*

### Q3: "Is this a trading app or robo-advisor?"
> *"No. The app strictly maintains a non-broker boundary. It does not execute trades, place orders, or provide algorithmic buy/sell recommendations. It only monitors market signals, filters relevance, and presents intelligence for the user to make their own informed decisions."*

### Q4: "What happens if Groq API rate limits or goes down?"
> *"We implemented a multi-key rotation pool for both Groq and Gemini. If Groq encounters a 429 rate limit or HTTP error, the system cycles through the key pool, and automatically cascades down to Google Gemini 2.5 Flash as a fallback, ensuring zero downtime for the user."*

### Q5: "Why did you choose Cloud Firestore in Delhi (`asia-south2`)?"
> *"Since our primary user base is Indian equity investors, placing the database in the Delhi region provides single-digit millisecond latency for reads and writes."*

### Q6: "How does the chatbot know the user's portfolio without retraining the model?"
> *"We use RAG (Retrieval-Augmented Generation). Whenever the user sends a message, our server action fetches their active holdings, calculates real-time P&L from live price feeds, retrieves the latest USD/INR exchange rate, and dynamically injects this live snapshot into the system prompt before calling the LLM."*

---

## 5. Architectural Boundaries & Principles
- **Server vs Client Separation:** Firebase Admin SDK is strictly server-only (`import "server-only"`). Client components never hold admin privileges or database write keys.
- **Privacy-First Ingestion:** Screenshots processed by Gemini Vision are never saved to disk or cloud storage—they exist only in-memory during the OCR call.
- **Soft Deletes:** User-owned Firestore documents are never hard-deleted; `deletedAt: Timestamp` is used to preserve audit trails.
