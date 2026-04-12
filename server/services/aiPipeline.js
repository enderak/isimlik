import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { Potrace } from 'potrace';

// ============================================================
// 1. PROMPT BUILDER (dynamic + strict colors + hole preservation)
// ============================================================

export function buildPrompt(text, style = 'standard') {
  let base = `
clean bold 3D text "${text}",
thick solid letters,
uniform thickness,
no holes, no thin parts,
smooth edges,
front orthographic view,
centered,
pure black (#000000) object,
pure white (#FFFFFF) background,
no gradients, no grayscale,
high contrast,
vector friendly,
3D printable,
consistent typography,
uniform stroke width,
preserve inner holes in letters like O, A, B, D, P, Q, R,
no perspective, no shadows, no background elements,
single object only`.trim();

  // Dynamic style adjustment based on text length
  if (text.length < 5) {
    base += ', more stylized, subtle organic deformation, floating in zero gravity';
  } else {
    base += ', prioritize readability, minimal deformation';
  }

  // Style variants (future-ready)
  switch (style) {
    case 'fluid':
      base += ', fluid organic shapes, melting effect';
      break;
    case 'extreme':
      base += ', extreme deformation, abstract letterforms';
      break;
    case 'standard':
    default:
      base += ', very thick letters, solid block structure';
      break;
  }

  return base;
}

// ============================================================
// 2. POLLINATIONS.AI IMAGE GENERATION (free, no API key)
// ============================================================

async function generateImage(prompt, outputPath, abortSignal) {
  // Pollinations.ai — 100% free, no signup, no API key
  // Just encode the prompt in the URL
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;

  console.log(`[AI] Requesting image from Pollinations.ai...`);

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    signal: abortSignal,
    timeout: 90000, // Pollinations can be slower, give it 90s
    maxRedirects: 5,
  });

  if (!response.data || response.data.length < 1000) {
    throw new Error('Pollinations.ai returned empty or invalid image');
  }

  await fs.writeFile(outputPath, Buffer.from(response.data));

  console.log(`[AI] Image generated: ${outputPath} (${response.data.length} bytes)`);
  return outputPath;
}

// ============================================================
// 3. SHARP IMAGE CLEANUP (flatten + normalize + threshold + blur)
// ============================================================

async function cleanImage(inputPath, outputPath) {
  await sharp(inputPath)
    .flatten({ background: '#ffffff' })  // Kill alpha channel
    .grayscale()
    .normalize()                          // Fix contrast
    .threshold(180)                       // Hard black/white
    .blur(0.3)                            // Smooth jagged edges
    .toFile(outputPath);

  // Verify the file was created
  if (!await fs.pathExists(outputPath)) {
    throw new Error('Sharp cleanup failed: output file not created');
  }

  console.log(`[CLEAN] Image cleaned: ${outputPath}`);
  return outputPath;
}

// ============================================================
// 4. POTRACE VECTORIZATION (optimized settings)
// ============================================================

function vectorize(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const trace = new Potrace({
      threshold: 180,
      turdSize: 50,
      optCurve: true,
      alphamax: 1,
      turnPolicy: 'black',   // Fixes inner holes (O, A, B)
    });

    trace.loadImage(inputPath, (err) => {
      if (err) return reject(new Error(`Potrace load failed: ${err.message}`));

      let svg = trace.getSVG();

      // Validate SVG
      if (!svg || svg.length < 100) {
        return reject(new Error('SVG generation failed: output too small or empty'));
      }

      // Size limit (5MB max)
      if (svg.length > 5_000_000) {
        return reject(new Error('SVG too large (>5MB), prompt likely generated too much detail'));
      }

      // ---- SVG OPTIMIZATION ----
      // Remove <g> wrapper tags (force single path for OpenSCAD)
      svg = svg.replace(/<g.*?>/g, '').replace(/<\/g>/g, '');
      // Remove strokes
      svg = svg.replace(/stroke=".*?"/g, '');
      // Force black fill
      svg = svg.replace(/fill=".*?"/g, 'fill="black"');
      // Compress whitespace (faster OpenSCAD parsing)
      svg = svg.replace(/\s+/g, ' ');

      fs.writeFileSync(outputPath, svg, 'utf-8');
      console.log(`[SVG] Vectorized: ${outputPath} (${svg.length} bytes)`);
      resolve(outputPath);
    });
  });
}

// ============================================================
// 5. OPENSCAD STL EXPORT (offset + convexity + timeout + killable)
// ============================================================

function generateSTLFromSVG(svgPath, stlPath, reqForCancel) {
  return new Promise((resolve, reject) => {
    const openscadPath = process.env.OPENSCAD_PATH || 'openscad';
    const svgAbsolute = path.resolve(svgPath).replace(/\\/g, '/');

    // Build the OpenSCAD script with offset trick for wall thickness
    const scadContent = `
// Auto-generated by isimlik AI pipeline
scale([0.1, -0.1, 1])
  linear_extrude(height = 5, convexity = 10)
    offset(delta = 0.5)
      import("${svgAbsolute}");
`;

    const scadPath = svgPath.replace('.svg', '.scad');
    fs.writeFileSync(scadPath, scadContent, 'utf-8');

    const args = ['-o', stlPath, scadPath];
    const child = execFile(openscadPath, args, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        if (err.killed) {
          return reject(new Error('OpenSCAD timed out after 30 seconds'));
        }
        return reject(new Error(`OpenSCAD failed: ${err.message}\nStderr: ${stderr}`));
      }

      if (!fs.existsSync(stlPath)) {
        return reject(new Error('OpenSCAD completed but STL file not found'));
      }

      console.log(`[STL] Generated: ${stlPath}`);
      resolve(stlPath);
    });

    // Kill OpenSCAD if request is cancelled
    if (reqForCancel) {
      reqForCancel.on('close', () => {
        if (!child.killed) {
          child.kill('SIGTERM');
          console.log(`[CANCEL] OpenSCAD process killed for: ${svgPath}`);
        }
      });
    }
  });
}

// ============================================================
// 5b. CADQUERY STL EXPORT (Sweep-based, Python subprocess)
// ============================================================

function generateSTLFromCadQuery(text, stlPath, sweepParams = {}, reqForCancel) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.resolve('../generator_cq.py');
    
    const { arcRadius = 50, baseHeight = 5 } = sweepParams;

    const args = [
      scriptPath,
      '--text', text,
      '--arc_radius', String(arcRadius),
      '--base_height', String(baseHeight),
      '--chamfer', '3',
      '--output', path.resolve(stlPath),
    ];

    console.log(`[CADQUERY] Running: ${pythonPath} ${args.join(' ')}`);

    const child = execFile(pythonPath, args, { timeout: 60000 }, (err, stdout, stderr) => {
      if (stdout) console.log(`[CADQUERY stdout] ${stdout}`);
      if (stderr) console.log(`[CADQUERY stderr] ${stderr}`);
      
      if (err) {
        if (err.killed) {
          return reject(new Error('CadQuery timed out after 60 seconds'));
        }
        return reject(new Error(`CadQuery failed: ${err.message}\nStderr: ${stderr}`));
      }

      if (!fs.existsSync(path.resolve(stlPath))) {
        return reject(new Error('CadQuery completed but STL file not found'));
      }

      console.log(`[STL] CadQuery generated: ${stlPath}`);
      resolve(stlPath);
    });

    // Kill Python if request is cancelled
    if (reqForCancel) {
      reqForCancel.on('close', () => {
        if (!child.killed) {
          child.kill('SIGTERM');
          console.log(`[CANCEL] CadQuery process killed`);
        }
      });
    }
  });
}

// ============================================================
// 6. CACHE HELPERS
// ============================================================

function getCacheKey(prompt) {
  return crypto.createHash('md5').update(prompt).digest('hex');
}

function getCachePath(cacheKey) {
  const cacheDir = process.env.CACHE_DIR || './cache';
  return path.join(cacheDir, `${cacheKey}.stl`);
}

function getLockPath(cacheKey) {
  const cacheDir = process.env.CACHE_DIR || './cache';
  return path.join(cacheDir, `${cacheKey}.lock`);
}

async function waitForLock(lockPath, timeoutMs = 60000) {
  const start = Date.now();
  while (await fs.pathExists(lockPath)) {
    if (Date.now() - start > timeoutMs) {
      // Lock is stale, remove it
      await fs.remove(lockPath);
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

// ============================================================
// 7. MAIN PIPELINE ORCHESTRATOR
// ============================================================

export async function runPipeline(text, style = 'standard', req = null, sweepParams = {}) {
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tempDir = process.env.TEMP_DIR || './tmp';
  const cacheDir = process.env.CACHE_DIR || './cache';

  // Ensure directories exist
  await fs.ensureDir(tempDir);
  await fs.ensureDir(cacheDir);

  // Job-specific temp file paths (no collision)
  const tempPng    = path.join(tempDir, `${jobId}.png`);
  const tempClean  = path.join(tempDir, `${jobId}_clean.png`);
  const tempSvg    = path.join(tempDir, `${jobId}.svg`);
  const tempScad   = path.join(tempDir, `${jobId}.scad`);
  const tempStl    = path.join(tempDir, `${jobId}.stl`);

  // All temp files for cleanup
  const tempFiles = [tempPng, tempClean, tempSvg, tempScad, tempStl];

  // Create AbortController for cancellation
  const controller = new AbortController();

  // If the client disconnects, abort everything
  if (req) {
    req.on('close', () => {
      controller.abort();
      console.log(`[CANCEL] Client disconnected, aborting job ${jobId}`);
    });
  }

  try {
    // ---- STEP 1: Build prompt ----
    const prompt = buildPrompt(text, style);
    console.log(`[JOB ${jobId}] Step 1: Prompt built (${prompt.length} chars)`);

    // ---- STEP 2: Check cache ----
    // Cache key includes sweep params for uniqueness
    const { arcRadius = 50, baseHeight = 5 } = sweepParams;
    const cacheKey = getCacheKey(`${prompt}|R${arcRadius}|H${baseHeight}`);
    const cachePath = getCachePath(cacheKey);
    const lockPath = getLockPath(cacheKey);

    if (await fs.pathExists(cachePath)) {
      console.log(`[JOB ${jobId}] CACHE HIT: ${cacheKey}`);
      return { stlPath: cachePath, cached: true, jobId };
    }

    // ---- STEP 3: Lock check (prevent race condition) ----
    await waitForLock(lockPath);
    // Double-check cache after lock wait
    if (await fs.pathExists(cachePath)) {
      console.log(`[JOB ${jobId}] CACHE HIT (after lock): ${cacheKey}`);
      return { stlPath: cachePath, cached: true, jobId };
    }
    // Acquire lock
    await fs.writeFile(lockPath, jobId, 'utf-8');

    // ---- STEP 4: Generate image via SDXL ----
    console.log(`[JOB ${jobId}] Step 4: Generating image via SDXL...`);
    await generateImage(prompt, tempPng, controller.signal);

    // ---- STEP 5: Clean image via Sharp ----
    console.log(`[JOB ${jobId}] Step 5: Cleaning image via Sharp...`);
    await cleanImage(tempPng, tempClean);

    // ---- STEP 6: Vectorize via Potrace ----
    console.log(`[JOB ${jobId}] Step 6: Vectorizing via Potrace...`);
    await vectorize(tempClean, tempSvg);

    // ---- STEP 7: Generate STL ----
    // Try CadQuery sweep first, fallback to OpenSCAD
    console.log(`[JOB ${jobId}] Step 7: Generating STL (CadQuery sweep → OpenSCAD fallback)...`);
    try {
      await generateSTLFromCadQuery(text, tempStl, sweepParams, req);
      console.log(`[JOB ${jobId}] CadQuery sweep succeeded ✓`);
    } catch (cqErr) {
      console.log(`[JOB ${jobId}] CadQuery failed: ${cqErr.message}. Falling back to OpenSCAD...`);
      await generateSTLFromSVG(tempSvg, tempStl, req);
    }

    // ---- STEP 8: Cache the result ----
    await fs.copy(tempStl, cachePath);
    console.log(`[JOB ${jobId}] CACHED: ${cacheKey}`);

    // Release lock
    await fs.remove(lockPath);

    return { stlPath: cachePath, cached: false, jobId };

  } catch (err) {
    // Release lock on error
    const cacheKey = getCacheKey(`${buildPrompt(text, style)}|R${sweepParams.arcRadius || 50}|H${sweepParams.baseHeight || 5}`);
    const lockPath = getLockPath(cacheKey);
    await fs.remove(lockPath).catch(() => {});

    // Structured error logging
    console.error({
      step: 'pipeline',
      error: err.message,
      jobId,
      text,
      style,
      timestamp: new Date().toISOString(),
    });

    throw err;

  } finally {
    // ALWAYS clean up temp files
    for (const f of tempFiles) {
      await fs.remove(f).catch(() => {});
    }
    console.log(`[JOB ${jobId}] Temp files cleaned.`);
  }
}
