# FinSage

AI-powered portfolio intelligence platform. FinSage monitors news, market events, and social signals across your stock and crypto holdings, then uses AI to surface only the events that actually matter to you.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Firebase Auth, Firestore
- **AI:** Google Gemini API (fallback to Groq Llama-3.3-70b)
- **Hosting:** Vercel

## Local Setup

1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Configure your keys in `.env.local`:
   - Firebase Client Credentials
   - Gemini API key(s) (supports key rotation via `GEMINI_API_KEYS`)
   - Groq API key(s) (supports key rotation via `GROQ_API_KEYS`)
   - News API key: https://newsapi.org

4. Run development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Important

FinSage is NOT a trading platform, NOT financial advice, and NOT a stock prediction system. It is a monitoring and signal-filtering tool. All investment decisions are made solely by the user.