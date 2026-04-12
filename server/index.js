import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from './services/aiPipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json());

// ============================================================
// STARTUP: Clean stale temp files from previous crashes
// ============================================================

const TEMP_DIR = path.resolve(process.env.TEMP_DIR || './tmp');
const CACHE_DIR = path.resolve(process.env.CACHE_DIR || './cache');

(async () => {
  await fs.ensureDir(TEMP_DIR);
  await fs.ensureDir(CACHE_DIR);
  await fs.emptyDir(TEMP_DIR); // Crash-safe cleanup
  console.log(`[INIT] Temp directory cleaned: ${TEMP_DIR}`);
  console.log(`[INIT] Cache directory ready: ${CACHE_DIR}`);
})();

// ============================================================
// CONCURRENCY LIMITER
// ============================================================

let activeJobs = 0;
const MAX_CONCURRENT_JOBS = 3;

// ============================================================
// INPUT SANITIZER
// ============================================================

function sanitizeText(raw) {
  if (typeof raw !== 'string') return null;
  // Only allow alphanumeric characters (ham radio callsigns etc.)
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeJobs,
    maxJobs: MAX_CONCURRENT_JOBS,
    cacheDir: CACHE_DIR,
    uptime: process.uptime(),
  });
});

// Main STL generation endpoint
app.post('/api/generate-stl', async (req, res) => {
  const { text: rawText, style, arcRadius: rawArcRadius, baseHeight: rawBaseHeight } = req.body;

  // ---- VALIDATE ----
  const text = sanitizeText(rawText);
  if (!text) {
    return res.status(400).json({ error: 'Text is required and must contain alphanumeric characters.' });
  }
  if (text.length < 2 || text.length > 15) {
    return res.status(400).json({ error: 'Text must be between 2 and 15 characters.' });
  }

  // ---- CONCURRENCY CHECK ----
  if (activeJobs >= MAX_CONCURRENT_JOBS) {
    return res.status(503).json({
      error: 'Server busy. Please try again in a moment.',
      activeJobs,
      maxJobs: MAX_CONCURRENT_JOBS,
    });
  }

  activeJobs++;
  console.log(`[SERVER] Job started. Active: ${activeJobs}/${MAX_CONCURRENT_JOBS}`);

  // Validate numeric params
  const arcRadius = Math.min(200, Math.max(10, parseFloat(rawArcRadius) || 50));
  const baseHeight = Math.min(15, Math.max(3, parseFloat(rawBaseHeight) || 5));

  try {
    const result = await runPipeline(text, style || 'standard', req, { arcRadius, baseHeight });

    // Check if the client already disconnected
    if (req.destroyed) {
      console.log('[SERVER] Client disconnected before response could be sent.');
      return;
    }

    // ---- STREAM RESPONSE (RAM friendly) ----
    const stlPath = path.resolve(result.stlPath);
    const stat = await fs.stat(stlPath);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${text}.stl"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('X-Cache-Hit', result.cached ? 'true' : 'false');
    res.setHeader('X-Job-Id', result.jobId);

    const stream = fs.createReadStream(stlPath);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error({ step: 'stream', error: err.message });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream STL file.' });
      }
    });

  } catch (err) {
    if (req.destroyed) {
      console.log('[SERVER] Job cancelled by client.');
      return;
    }

    console.error({
      step: 'endpoint',
      error: err.message,
      text,
      style,
      timestamp: new Date().toISOString(),
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Pipeline failed.',
        message: err.message,
      });
    }

  } finally {
    activeJobs--;
    console.log(`[SERVER] Job finished. Active: ${activeJobs}/${MAX_CONCURRENT_JOBS}`);
  }
});

// ============================================================
// CACHE MANAGEMENT (optional admin endpoints)
// ============================================================

app.get('/api/cache/stats', async (req, res) => {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const stlFiles = files.filter(f => f.endsWith('.stl'));
    let totalSize = 0;
    for (const f of stlFiles) {
      const stat = await fs.stat(path.join(CACHE_DIR, f));
      totalSize += stat.size;
    }
    res.json({
      cachedItems: stlFiles.length,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    });
  } catch {
    res.json({ cachedItems: 0, totalSizeMB: '0.00' });
  }
});

app.delete('/api/cache/clear', async (req, res) => {
  await fs.emptyDir(CACHE_DIR);
  res.json({ status: 'Cache cleared.' });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   🚀 İsimlik AI Pipeline Server                 ║
║   Port: ${PORT}                                    ║
║   AI: Pollinations.ai (FREE, no key needed) ✅   ║
║   OpenSCAD: ${process.env.OPENSCAD_PATH || 'default (PATH)'}  ║
║   Cache: ${CACHE_DIR}
╚══════════════════════════════════════════════════╝
  `);
});
