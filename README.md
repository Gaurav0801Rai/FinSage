# Portfolio Pulse

AI-powered portfolio intelligence platform. Monitors stocks, crypto, and market events. Alerts you when news actually matters to your holdings.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Firebase (Auth, Firestore, Storage, FCM)
- **AI:** Google Gemini API
- **Hosting:** Vercel

## Local Setup

1. Clone and install:
   \`\`\`bash
   npm install
   \`\`\`

2. Copy environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

3. Fill in `.env.local`:
   - Firebase: create project at https://console.firebase.google.com
   - Gemini API key: https://aistudio.google.com/apikey
   - News API key: https://newsapi.org (Phase 4)

4. Run dev server:
   \`\`\`bash
   npm run dev
   \`\`\`

   Open http://localhost:3000

## Architecture

See `/docs/architecture.md` for the full system design including the two-stage filter and tiered ingestion strategy.

## Important

This is NOT a trading platform. NOT financial advice. NOT a prediction system. It is a monitoring and signal-filtering tool only. Users make their own decisions.