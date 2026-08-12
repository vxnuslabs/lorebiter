# Lorebiter

> **⚠️ WARNING:** This software is currently untested.

Lorebiter is a private, browser-based roleplaying engine for personal use. Built with Next.js App Router, Drizzle ORM, Neon PostgreSQL, and OpenRouter for LLM integration.


## Features (Phase 1)
- **World Management**: Create and manage distinct worlds.
- **Lore Entries**: Define characters with public, personal, and observable layers.
- **AI Polish**: Built-in grammar and style polish for lore entries.
- **Chat Sessions**: Engage in immersive roleplay sessions with specific characters.
- **Narrator & Anti-Hijack**: A World Narrator handles the environment, and strict prompts ensure characters do not hijack your actions.

## Getting Started

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env.local
   ```
   You will need:
   - A [Neon](https://neon.tech) database URL (`DATABASE_URL`).
   - An [OpenRouter](https://openrouter.ai) API key (`OPENROUTER_API_KEY`).

3. **Database Push**
   Push the schema to your Neon database:
   ```bash
   npx drizzle-kit push
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to start playing.

## Deployment

Lorebiter is designed to be easily deployed to Vercel on the free tier.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
