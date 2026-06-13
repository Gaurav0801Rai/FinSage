# FinSage — Engineering Chat History & Project Milestones

This document summarizes the chat logs, design discussions, and implementation milestones during the development of the **FinSage** platform. Use this as a reference to understand past decisions and system mechanics when reopening the codebase.

---

## Conversation Metadata
*   **Conversation ID:** `7e90d179-86d4-4d20-9c8b-c48c99ba70ea`
*   **Platform Name:** FinSage (formerly *Portfolio Pulse*)
*   **Project Goal:** AI-powered stock and cryptocurrency portfolio intelligence dashboard.

---

## Project Milestones & Technical Achievements

### 1. Foundation & Rebranding
*   **Action:** OVERHAULED design aesthetic to a premium fintech dark theme.
*   **Tokens:** Defined Dual-Accent Gold (`#E2B659` / `#D4AF37`) and Trust Blue (`#1F4E79` / `#1A365D`) on deep workspace card surfaces (`#121820`, `rounded-[12px]`).
*   **Outcome:** Linked layout navigation, renamed all codebase components, and deployed Firestore index structures.

### 2. Contextual 24/7 AI Chatbot (Phase 9)
*   **Discussion:** How to let the user ask questions about their holdings and market events dynamically.
*   **Solution:** Created a floating chatbot assistant with RAG context:
    *   Queries user’s Firestore holdings, live Yahoo/CoinGecko prices, and recent AI alerts.
    *   Passes real-time exchange rates (USD/INR) to prevent chatbot currency hallucinations.
    *   Implements a rolling limit of **25 messages** stored in `users/{uid}/chats` to control database storage.
*   **AI Routing:** Primary completions call Groq (`Llama-3.3-70b-versatile`) with a fast local fallback to `Gemini 2.5 Flash` if the Groq key is missing or exhausted.

### 3. Decoupled Email Alert System (Phase 10)
*   **Discussion:** Sending emails every 5 minutes during news ingestion would spam users.
*   **Decoupled Logic:**
    1.  **Immediate Real-Time Alerts:** Sent strictly for **high-severity events** that match the user's minimum preference threshold.
    2.  **Consolidated Digests:** Sent **3 times a day** (9:00 AM, 3:00 PM, and 11:00 PM IST / 03:30, 09:30, and 17:30 UTC) grouping all alerts holding-wise.
*   **Implementation:** 
    *   Cron routes: `/api/cron/process-news` and `/api/cron/send-digests`.
    *   Digests utilize Gemini/Groq to generate consolidated 2-sentence summaries for holdings with multiple events.
    *   Triggered automatically via GitHub Actions workflows.

### 4. API Key Rotation Pools (Groq & Gemini)
*   **Discussion:** Prevent the statement statement OCR uploader (which requires visual capabilities and cannot use Groq) and background cron jobs from failing due to free-tier rate limits.
*   **Solution:** Built central rotating clients:
    *   [groq.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/groq.ts) handles `GROQ_API_KEYS` rotation.
    *   [gemini.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/lib/gemini.ts) handles `GEMINI_API_KEYS` rotation.
    *   Checks for and retries on both rate limits (429) and invalid/expired keys (401 Unauthorized for Groq, and 400 `API_KEY_INVALID` for Gemini).
    *   Used successfully during Next.js local integration and production build checks.

---

## How to Access Live Chat Transcripts
Your IDE automatically archives and recovers the complete chat transcript, tool execution outcomes, and intermediate logs locally on your system. 

*   **IDE Workspace App Data Directory:** `C:\Users\Gaurav Kumar\.gemini\antigravity-ide\brain\7e90d179-86d4-4d20-9c8b-c48c99ba70ea`
*   **Detailed Step Logs:** `C:\Users\Gaurav Kumar\.gemini\antigravity-ide\brain\7e90d179-86d4-4d20-9c8b-c48c99ba70ea\.system_generated\logs\transcript.jsonl` (contains the raw chronological execution lines).
