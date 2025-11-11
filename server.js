// server.js — Optimized BeQuail Mod.io Proxy

import express from "express";
import fetch from "node-fetch";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();

// --- Security middleware ---
app.use(helmet());
app.use(cors({ origin: ["*"] }));
app.use(express.json());

// --- Basic rate limiter ---
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // 60 requests per minute per IP
});
app.use(limiter);

// --- Config ---
const MODIO_KEY = process.env.MODIO_KEY; // stored securely on Vercel
const GAME_ID = 11342;
const BASE = `https://g-${GAME_ID}.modapi.io/v1/games/${GAME_ID}`;

// --- Simple in-memory cache ---
let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 30 * 1000; // 30 s

// --- Root status route ---
app.get("/", (req, res) => {
  res.send("<h1>✅ BeQuail Mod.io Proxy is Live</h1><p>Use <a href='/api/mods'>/api/mods</a></p>");
});

// --- Main mods endpoint ---
app.get("/api/mods", async (req, res) => {
  const now = Date.now();

  // Serve cached data if still valid
  if (cache.data && now - cache.timestamp < CACHE_TTL) {
    console.log("🟢 Using cached mod list");
    return res.status(200).json(cache.data);
  }

  try {
    const fields = "id,name,summary,date_added,logo";
    const url = `${BASE}/mods?api_key=${MODIO_KEY}&fields=${fields}`;
    console.log("🌐 Fetching fresh:", url);

    const resp = await fetch(url, {
      headers: { "User-Agent": "BeQuail-ModBrowser/1.0" },
    });

    const json = await resp.json();
    cache = { data: json, timestamp: now };
    res.status(resp.status).json(json);
    console.log("🟩 Cached new mod list for 30 s");
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

export default app;
