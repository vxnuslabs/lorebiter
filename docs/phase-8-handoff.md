# Lorebiter: Phase 8 Handoff Document

## Current State (Phase 7 Complete)
Lorebiter currently features a fully functional multi-agent dialogue loop, dynamic relationship tracking, inner thought UI, and semantic search. However, world-building still requires the user to manually create entries one by one, which can be time-consuming for large, rich worlds.

## Goal for Phase 8: Import/Export & External AI World Generation
The goal of Phase 8 is to implement robust **Import/Export functionality** for worlds. Crucially, the export format must be a clean, standardized structure (like JSON) that external AI platforms (e.g., ChatGPT, Claude, Gemini) can easily understand and generate. 

This will allow users to prompt an external AI to "generate an entire dark fantasy world with 20 characters and locations for Lorebiter," receive a JSON file, and instantly import a fully-fleshed out, playable world.

## Core Features to Implement

### 1. Standardized World Transfer Format (LorePack JSON)
- **Concept:** Define a standardized JSON structure that represents an entire world and its entries. It should strip out database-specific internals (like UUIDs, timestamps, or vector embeddings) and focus purely on creative content.
- **Example Structure:**
  ```json
  {
    "world": {
      "name": "The Ruined Kingdom",
      "themeHint": "Dark fantasy, grimdark",
      "narratorVoice": "Somber and highly descriptive"
    },
    "entries": [
      {
        "type": "character",
        "name": "Head Maid",
        "aliases": ["Old Servant"],
        "tags": ["maid", "mansion", "strict"],
        "layers": {
          "public": "A stern woman who manages the household.",
          "personal": "She knows the secret of the old master's death.",
          "observable": "Wears a faded uniform and walks with a limp."
        }
      }
    ]
  }
  ```

### 2. World Export
- **Implementation:**
  - Add an "Export World" button to the World Hub UI (`src/app/worlds/[id]/page.tsx`).
  - Create an API route (`/api/worlds/[id]/export`) that fetches the world and all its entries.
  - Format the data into the `LorePack` JSON schema and serve it as a downloadable `.json` file.

### 3. World Import & Auto-Embedding
- **Implementation:**
  - Add an "Import World" button/file dropzone to the main Worlds list page (`src/app/worlds/page.tsx`).
  - Create an API route (`/api/worlds/import`) that accepts an uploaded `LorePack` JSON file.
  - The API must:
    1. Create a new World record in the database.
    2. Iterate through the `entries` array, generate new UUIDs, and **crucially**, run the text through `generateEmbedding` (from `src/lib/embeddings.ts`) so the semantic engine can index them immediately.
    3. Bulk insert the entries into the database.
  - The frontend should display a loading/progress state, as generating embeddings for an entire world might take a few seconds.

### 4. AI Generation Prompt Helper
- **Implementation:**
  - Create a small modal or guide page in the UI (e.g., "Generate World with AI") that provides users with a copy-pasteable prompt template.
  - *Example Prompt Template:* "You are an expert world builder. Create a rich fantasy world and output it EXACTLY in the following JSON format so I can import it into my game engine: [Insert Schema Here]."

## Next Steps for the Next Agent
1. **API Development:** Create the `/api/worlds/[id]/export` and `/api/worlds/import` routes.
2. **UI Updates:** Add the Export button to the world detail page and the Import button to the worlds list page. Ensure proper file handling and loading states.
3. **Prompt Guide:** Add the "Generate World with AI" helper UI so users know exactly how to prompt external models.
