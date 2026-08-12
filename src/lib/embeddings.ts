export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY; // Fallback for dev
  
  if (!apiKey) {
    console.warn("No API key for embeddings, using mock vector");
    return Array(1536).fill(0.01);
  }

  try {
    const isOpenRouter = !process.env.OPENAI_API_KEY && !!process.env.OPENROUTER_API_KEY;
    const endpoint = isOpenRouter ? "https://openrouter.ai/api/v1/embeddings" : "https://api.openai.com/v1/embeddings";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://lorebiter.vercel.app",
        "X-Title": "Lorebiter",
      },
      body: JSON.stringify({
        input: text,
        model: isOpenRouter ? "openai/text-embedding-3-small" : "text-embedding-3-small",
      }),
    });

    if (!response.ok) {
      console.warn(`Embeddings API failed: ${response.status}. Using mock vector.`);
      return Array(1536).fill(0.01);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (err) {
    console.error("Embedding generation failed:", err);
    return Array(1536).fill(0.01);
  }
}
