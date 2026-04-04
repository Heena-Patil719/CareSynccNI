import { Router } from "express";
import { createGroqChatCompletion, extractGroqText, getGroqApiKey } from "../lib/groq";

const router = Router();

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.json({ answer: "Please provide a question." });
    }

    if (!getGroqApiKey()) {
      return res.json({ answer: "Groq API key is missing. Set GROQ_API_KEY." });
    }

    const data = await createGroqChatCompletion(question, 0.7);
    console.log("GROQ RAW:", data);

    const text = extractGroqText(data) || "I could not generate a response.";
    return res.json({ answer: text });
  } catch (error) {
    console.error("Groq backend error:", error);
    const message = error instanceof Error ? error.message : "Unknown Groq backend error.";
    return res.json({ answer: "Groq backend error: " + message });
  }
});

export default router;
