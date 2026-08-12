import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL found");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log("Checking if vector extension exists...");
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log("Vector extension enabled successfully!");
  } catch (err) {
    console.error("Failed to enable vector extension:", err);
  }
}

main();
