// server.js
import express from "express";
import fetch from "node-fetch";
import helmet from "helmet";
import cors from "cors";

const app = express();
app.use(helmet());
app.use(cors({
  origin: ["*"] // You can restrict to your domains later for security
}));

// Read key from Vercel env var
const MODIO_KEY = process.env.MODIO_KEY;
const GAME_ID = 11342;

// Proxy endpoint that your Godot client will call
app.get("/api/mods", async (req, res) => {
  try {
    // Build the full URL using the modapi.io domain from your dashboard
    const apiUrl = `https://g-${GAME_ID}.modapi.io/v1/games/${GAME_ID}/mods?api_key=${MODIO_KEY}`;
    console.log("🔗 Fetching:", apiUrl);

    // Forward the request to mod.io
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "BeQuail-ModBrowser/1.0"
      }
    });

    const data = await response.text();
    res.status(response.status).set("Content-Type", "application/json").send(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

// Required for Vercel’s serverless function export
export default app;
