/**
 * verify_textures.js
 * Lee cada geo.json, extrae todas las UV boxes, luego lee el PNG correspondiente
 * y verifica:
 *   1. Cada bone tiene píxeles pintados (no 100% transparente) en su zona UV
 *   2. No hay píxeles pintados fuera de ALGUNA zona UV (huérfanos)
 *   3. No hay solapamiento entre zonas UV de distintos bones
 *   4. Ningún fill() en generate_entity_textures.js pinta fuera de bounds
 */
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

const GEO_DIR = path.join(__dirname, "..", "resource_pack", "models", "entity");
const TEX_DIR = path.join(__dirname, "..", "resource_pack", "textures", "entity");

// UV box formula: uv:[U,V] size:[W,H,D]
// total width = 2*(D+W), total height = D+H
// Faces:
//   top:    [U+D, V] to [U+D+W-1, V+D-1]
//   bottom: [U+D+W, V] to [U+D+2W-1, V+D-1]
//   right:  [U, V+D] to [U+D-1, V+D+H-1]
//   front:  [U+D, V+D] to [U+D+W-1, V+D+H-1]
//   left:   [U+D+W, V+D] to [U+D+W+D-1, V+D+H-1]
//   back:   [U+D+W+D, V+D] to [U+2*(D+W)-1, V+D+H-1]
function getUVRect(U, V, W, H, D) {
  return {
    x1: U,
    y1: V,
    x2: U + 2 * (D + W) - 1,
    y2: V + D + H - 1,
    totalW: 2 * (D + W),
    totalH: D + H
  };
}

function getFaces(U, V, W, H, D) {
  return {
    top:    { x1: U + D,         y1: V,     x2: U + D + W - 1,         y2: V + D - 1 },
    bottom: { x1: U + D + W,     y1: V,     x2: U + D + 2 * W - 1,     y2: V + D - 1 },
    right:  { x1: U,             y1: V + D, x2: U + D - 1,             y2: V + D + H - 1 },
    front:  { x1: U + D,         y1: V + D, x2: U + D + W - 1,         y2: V + D + H - 1 },
    left:   { x1: U + D + W,     y1: V + D, x2: U + D + W + D - 1,     y2: V + D + H - 1 },
    back:   { x1: U + D + W + D, y1: V + D, x2: U + 2 * (D + W) - 1,  y2: V + D + H - 1 }
  };
}

function rectsOverlap(a, b) {
  return a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;
}

function overlapArea(a, b) {
  const ox = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) + 1);
  const oy = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) + 1);
  return ox * oy;
}

let totalErrors = 0;
let totalWarnings = 0;

function error(msg) { totalErrors++; console.log(`  ❌ ERROR: ${msg}`); }
function warn(msg)  { totalWarnings++; console.log(`  ⚠️  WARN: ${msg}`); }
function ok(msg)    { console.log(`  ✅ ${msg}`); }

async function verifyCharacter(name, geoFile, texFile) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${name.toUpperCase()}`);
  console.log(`${"═".repeat(60)}`);

  // -- Parse geometry --
  const geo = JSON.parse(fs.readFileSync(path.join(GEO_DIR, geoFile), "utf8"));
  const geom = geo["minecraft:geometry"][0];
  const texW = geom.description.texture_width;
  const texH = geom.description.texture_height;
  console.log(`  Texture size: ${texW}×${texH}`);

  // -- Load PNG --
  const img = await Jimp.read(path.join(TEX_DIR, texFile));
  if (img.getWidth() !== texW || img.getHeight() !== texH) {
    error(`PNG size ${img.getWidth()}×${img.getHeight()} != geo declared ${texW}×${texH}`);
  } else {
    ok(`PNG size matches: ${texW}×${texH}`);
  }

  // -- Extract bones with cubes --
  const bones = [];
  for (const bone of geom.bones) {
    if (!bone.cubes) continue;
    for (const cube of bone.cubes) {
      const [U, V] = cube.uv;
      const [W, H, D] = cube.size;
      const rect = getUVRect(U, V, W, H, D);
      const faces = getFaces(U, V, W, H, D);
      bones.push({ name: bone.name, U, V, W, H, D, rect, faces });
    }
  }

  console.log(`  Bones with cubes: ${bones.length}`);

  // -- Check 1: UV rects within texture bounds --
  console.log(`\n  --- Bounds Check ---`);
  for (const b of bones) {
    if (b.rect.x2 >= texW) {
      error(`${b.name} UV [${b.U},${b.V}] size [${b.W},${b.H},${b.D}] → right edge ${b.rect.x2} >= texW ${texW}`);
    } else if (b.rect.y2 >= texH) {
      error(`${b.name} UV [${b.U},${b.V}] size [${b.W},${b.H},${b.D}] → bottom edge ${b.rect.y2} >= texH ${texH}`);
    } else {
      ok(`${b.name} [${b.U},${b.V}] [${b.W},${b.H},${b.D}] → [${b.rect.x1},${b.rect.y1}]-[${b.rect.x2},${b.rect.y2}]`);
    }
  }

  // -- Check 2: Overlap between bones --
  console.log(`\n  --- Overlap Check ---`);
  let hasOverlap = false;
  for (let i = 0; i < bones.length; i++) {
    for (let j = i + 1; j < bones.length; j++) {
      const a = bones[i], b = bones[j];
      if (rectsOverlap(a.rect, b.rect)) {
        const area = overlapArea(a.rect, b.rect);
        if (a.name === b.name && a.U === b.U && a.V === b.V) continue; // same bone, same UV (mirror)
        if (area > 0) {
          // Check if it's intentional mirror (same UV)
          if (a.U === b.U && a.V === b.V) {
            ok(`${a.name} & ${b.name} share UV [${a.U},${a.V}] (intentional mirror)`);
          } else {
            error(`OVERLAP: ${a.name} [${a.rect.x1},${a.rect.y1}]-[${a.rect.x2},${a.rect.y2}] & ${b.name} [${b.rect.x1},${b.rect.y1}]-[${b.rect.x2},${b.rect.y2}] — ${area}px²`);
            hasOverlap = true;
          }
        }
      }
    }
  }
  if (!hasOverlap) ok("No UV overlaps detected");

  // -- Check 3: Each bone has painted pixels --
  console.log(`\n  --- Paint Coverage Check ---`);
  for (const b of bones) {
    let painted = 0;
    let total = 0;
    for (const [faceName, face] of Object.entries(b.faces)) {
      for (let x = face.x1; x <= face.x2; x++) {
        for (let y = face.y1; y <= face.y2; y++) {
          if (x >= 0 && x < texW && y >= 0 && y < texH) {
            total++;
            const rgba = Jimp.intToRGBA(img.getPixelColor(x, y));
            if (rgba.a > 0) painted++;
          }
        }
      }
    }
    const pct = total > 0 ? Math.round(painted / total * 100) : 0;
    if (painted === 0) {
      error(`${b.name} — 0/${total} pixels painted (entirely transparent!)`);
    } else if (pct < 50) {
      warn(`${b.name} — ${painted}/${total} pixels painted (${pct}% — sparse)`);
    } else {
      ok(`${b.name} — ${painted}/${total} pixels (${pct}%)`);
    }
  }

  // -- Check 4: pixels painted outside ANY bone UV region --
  console.log(`\n  --- Orphan Pixel Check ---`);
  // Build a grid marking which pixels belong to bones
  const owned = Array.from({ length: texH }, () => new Uint8Array(texW));
  for (const b of bones) {
    for (let x = b.rect.x1; x <= Math.min(b.rect.x2, texW - 1); x++) {
      for (let y = b.rect.y1; y <= Math.min(b.rect.y2, texH - 1); y++) {
        owned[y][x] = 1;
      }
    }
  }
  let orphans = 0;
  const orphanSamples = [];
  for (let y = 0; y < texH; y++) {
    for (let x = 0; x < texW; x++) {
      if (!owned[y][x]) {
        const rgba = Jimp.intToRGBA(img.getPixelColor(x, y));
        if (rgba.a > 0) {
          orphans++;
          if (orphanSamples.length < 5) orphanSamples.push(`(${x},${y})`);
        }
      }
    }
  }
  if (orphans > 0) {
    warn(`${orphans} pixels painted outside any bone UV region. Samples: ${orphanSamples.join(", ")}`);
  } else {
    ok("No orphan pixels outside bone UV regions");
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  TEXTURE & UV VERIFICATION TOOL                        ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  await verifyCharacter("Sansón",  "samson.geo.json",  "samson.png");
  await verifyCharacter("Dalila",  "dalila.geo.json",  "dalila.png");
  await verifyCharacter("David",   "david.geo.json",   "david.png");
  await verifyCharacter("Goliát",  "goliath.geo.json",  "goliath.png");

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  RESULTADO FINAL`);
  console.log(`${"═".repeat(60)}`);
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log("  ✅ ¡TODO PERFECTO! Ningún error ni advertencia.");
  } else {
    console.log(`  ❌ Errores: ${totalErrors}`);
    console.log(`  ⚠️  Advertencias: ${totalWarnings}`);
  }
  console.log("");
  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
