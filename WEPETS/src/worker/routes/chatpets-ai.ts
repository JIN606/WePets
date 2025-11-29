

/**
 * @description ChatPets AI Route Handler
 * This file implements the backend proxy endpoint for ChatPets AI Assistant.
 * It receives chat messages from the frontend, adds system prompt from config,
 * forwards to HeyBoss's OpenAI API proxy, and returns the assistant's response.
 * All OpenAI API calls MUST go through this backend endpoint for security.
 */

import { Hono } from "hono";

const app = new Hono<{
  Bindings: {
    API_KEY: string;
  };
}>();

app.post("/api/chatpets-ai", async (c) => {
  try {
    const body = await c.req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "Messages array is required" }, 400);
    }

    // Import config dynamically
    const config = await import("../../../Features/AI.OpenAI GPT.1.json");
    const { system_prompt, model, temperature } = config.default;

    // Build messages array with system prompt
    const apiMessages = [
      {
        role: "system",
        content: system_prompt,
      },
      ...messages,
    ];

    // Call HeyBoss API proxy
    const response = await fetch("https://api.heybossai.com/v1/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${c.env.API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        inputs: {
          messages: apiMessages,
          temperature: temperature,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("HeyBoss API error:", errorData);
      return c.json(
        { error: "Failed to get response from AI service" },
        response.status
      );
    }

    const data = await response.json();

    // Extract assistant's reply
    const assistantReply =
      data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return c.json({ reply: assistantReply }, 200);
  } catch (error) {
    console.error("ChatPets AI error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
  
