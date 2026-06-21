import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gemini Client (with User-Agent telemetry headers)
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ----------------------------------------------------
// SECURE SERVER-SIDE GEMINI API ENDPOINTS
// ----------------------------------------------------

// 1. Note Auto-summarization endpoint
app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required for summarization" });
    }

    if (!ai) {
      return res.status(500).json({ 
        error: "Gemini API Client is not initialized. Please ensure GEMINI_API_KEY is configured in your Settings > Secrets." 
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Please summarize the following note content neatly and precisely. Highlight key terms or create convenient bullet points if appropriate. Maintain the language of the original text (if written in Arabic, summarize in Arabic. If English, summarize in English). Keep it concise.
Title: ${title || 'No Title'}
Content:
${content}`,
    });

    res.json({ result: response.text });
  } catch (err: any) {
    console.error("AI Summarize error details:", err);
    res.status(500).json({ error: err.message || "Failed to make Gemini API summarization call" });
  }
});

// 2. Continuous ideation & brainstorm expansion endpoint
app.post("/api/ai/expand", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ error: "Either title or content is required to prompt ideas" });
    }

    if (!ai) {
      return res.status(500).json({ 
        error: "Gemini API Client is not initialized. Please ensure GEMINI_API_KEY is configured in your Settings > Secrets." 
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a creative brainstorming assistant. Based on this note's title and contents, generate complementary ideas, next plans, or follow-up insights. Maintain the language of the original text (if Arabic, write in elegant Arabic, if English, write in English). Output a beautifully formatted list starting directly with high-quality ideas.
Title: ${title || 'Untitled'}
Content:
${content || ''}`,
    });

    res.json({ result: response.text });
  } catch (err: any) {
    console.error("AI Ideas generation error details:", err);
    res.status(500).json({ error: err.message || "Failed to generate dynamic ideas from Gemini API" });
  }
});

// 3. AI-Powered Proofreading & Writing Style Enhancer
app.post("/api/ai/fix", async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required for fixing" });
    }

    if (!ai) {
      return res.status(500).json({ 
        error: "Gemini API Client is not initialized. Please configure it in Settings > Secrets." 
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert writing editor. Please refine, proofread, correct any typos, and enhance the phrasing of the following text while keeping its core style, tone, and original language (if written in Arabic, improve in elegant Arabic; if English, improve in English). Do not explain or talk; only return the corrected, improved text in its final form.
Title: ${title || 'No Title'}
Content:
${content}`,
    });

    res.json({ result: response.text });
  } catch (err: any) {
    console.error("AI Proofread error:", err);
    res.status(500).json({ error: err.message || "Failed to make Gemini API call" });
  }
});

// 4. AI-Powered Smart Task Extraction
app.post("/api/ai/extract-tasks", async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required for task extraction" });
    }

    if (!ai) {
      return res.status(500).json({ 
        error: "Gemini API Client is not initialized. Please configure it in Settings > Secrets." 
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a productivity task assistant. Please extract a list of direct, actionable checklist items (tasks) from the text below. Represent the tasks concisely in the exact language of the text. Format the output as a simple list with one task per line without numbers or prefix symbols.
Title: ${title || 'No Title'}
Content:
${content}`,
    });

    // Parse tasks by splitting on newline
    const tasks = (response.text || "").split("\n")
      .map(item => item.trim())
      .filter(item => item.length > 0 && !item.startsWith('-') && !item.startsWith('*') && !/^\d+\./.test(item));

    // If parsing was strict and got zero items, let's try a simpler split
    const finalTasks = tasks.length > 0 ? tasks : (response.text || "").split("\n").map(i => i.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean);

    res.json({ result: finalTasks });
  } catch (err: any) {
    console.error("AI Tasks extraction error:", err);
    res.status(500).json({ error: err.message || "Failed to extract tasks" });
  }
});

// ----------------------------------------------------
// WORKSPACE INGREGRES ROUTING (VITE / STATIC SERVING)
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static files serving...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BACKEND SERVER] Active at http://localhost:${PORT}`);
  });
}

startServer();
