# Lorebiter

> **⚠️ WARNING:** This software is currently untested.

Lorebiter is a private, browser-based roleplaying engine for personal use. Built with Next.js App Router, Drizzle ORM, PostgreSQL (local-first, with pgvector), and OpenRouter for LLM integration.


## Features
- **World Management**: Create, export, and import complete self-contained worlds as JSON backups. Paste raw JSON directly for rapid generation from external AIs. Safely cascade-delete entire worlds.
- **Dynamic Model Selection**: Connects live to OpenRouter to let you seamlessly swap between hundreds of LLMs per-session using a searchable dropdown.
- **Rich Lore Entries**: Define diverse lore entries (characters, events, facts, locations, relationships) using dynamic templates and layered visibility (public, personal, observable).
- **Multi-NPC Orchestration**: Engage in dynamic chat sessions supporting multiple NPCs. The Game Engine accurately parses conversational intents and prevents the narrator from bypassing characters.
- **Consistency Enforcement**: An Arbiter tracks observed facts to detect contradictions, gracefully handling lies and misremembered statements without breaking immersion.
- **Semantic RAG & Triggers**: Uses vector embeddings to semantically query and dynamically inject the most relevant lore entries into context.
- **Session Search**: Search past chat logs by semantic meaning to retrieve distant memories.
- **Long-term Memory**: Automatically summarize completed chat sessions into new permanent lore entries.
- **Inner Thoughts**: Characters generate hidden internal reasoning that guides their actions, viewable via an Insight toggle.
- **Visual Lore Graph**: Visualize relationships between lore entries and detect orphaned nodes.
- **AI Polish & Quick Entry**: Use NLP to convert raw text dumps into structured lore entries and polish existing drafts.
- **Narrator & Anti-Hijack**: A World Narrator manages the environment and transitions, while strict prompts ensure agents never hijack your actions or repeat setting descriptions unnecessarily.

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
   - A local PostgreSQL database URL (`DATABASE_URL`) with `pgvector` enabled, e.g., `postgres://user:password@localhost:5432/lorebiter`. (Alternatively, you can use a cloud database like [Neon](https://neon.tech)).
   - An [OpenRouter](https://openrouter.ai) API key (`OPENROUTER_API_KEY`).

3. **Database Push**
   Push the schema to your database:
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
