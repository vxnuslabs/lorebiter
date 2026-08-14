export async function generateResponse(params: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
}) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.SITE_URL || "https://lorebiter.vercel.app",
      "X-Title": "Lorebiter",
    },
    body: JSON.stringify({
      model: params.model || "x-ai/grok-4.5",
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userMessage },
      ],
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  if (!data.choices || data.choices.length === 0) {
    throw new Error("OpenRouter returned no choices. Response: " + JSON.stringify(data));
  }
  return data.choices[0].message.content;
}
