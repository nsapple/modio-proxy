// server.js (Node.js + Express minimal proxy)
import express from "express";
import fetch from "node-fetch";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
app.use(helmet());
app.use(cors({
  origin: ["https://your-game-domain.com"] // restrict to your domains
}));

// Basic rate limiting (protect your API key from abuse)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max requests per IP per window
});
app.use(limiter);

// Read key from env var
const MODIO_KEY = process.env.MODIO_KEY; // set this in your hosting env
if (!MODIO_KEY) {
  console.error("MODIO_KEY not set in environment");
  process.exit(1);
}

// Simple proxy endpoint
app.get("/api/mods", async (req, res) => {
  try {
    const gameId = req.query.game_id || "11342";
    // Build the modapi domain shown in your dashboard
    const base = `https://g-${gameId}.modapi.io/v1/games/${gameId}/mods`;
    const url = `${base}?api_key=${MODIO_KEY}`;

    // Forward request to mod.io with a user-agent
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "BeQuail-ModBrowser/1.0"
      }
    });

    const text = await resp.text();
    res.status(resp.status).header("Content-Type", resp.headers.get("content-type") || "application/json").send(text);

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "proxy_error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy listening on ${port}`));
