/**
 * generate_entity_textures.js — Biblical Characters Add-on
 *
 * High-contrast, detailed textures for 4 biblical characters.
 * David's hat and curlyHair use per-face UV in geometry (north face omitted)
 * so paint data for those "front" regions is unused but kept for reference.
 *
 * Face direction note (Bedrock):
 *   Box UV "front" = north (-Z) = where the entity's face/eyes are.
 *   Box UV "back"  = south (+Z) = back of the entity.
 */
const Jimp = require("jimp");
const path = require("path");
const OUT = path.join(__dirname, "..", "resource_pack", "textures", "entity");

// ── Helpers ────────────────────────────────────────────
function hex(c) { return Jimp.cssColorToHex(c.length === 7 ? c + "FF" : c); }

function fill(img, x1, y1, x2, y2, c) {
  const h = hex(c);
  for (let x = x1; x <= x2; x++)
    for (let y = y1; y <= y2; y++) img.setPixelColor(h, x, y);
}

function px(img, x, y, c) { img.setPixelColor(hex(c), x, y); }

function clr(img, x1, y1, x2, y2) {
  for (let x = x1; x <= x2; x++)
    for (let y = y1; y <= y2; y++) img.setPixelColor(0x00000000, x, y);
}

function dither(img, x1, y1, x2, y2, c1, c2) {
  const h1 = hex(c1), h2 = hex(c2);
  for (let x = x1; x <= x2; x++)
    for (let y = y1; y <= y2; y++)
      img.setPixelColor((x + y) % 2 === 0 ? h1 : h2, x, y);
}

function paintBox(img, U, V, W, H, D, colors) {
  const f = {
    top:    [U + D,         V,       U + D + W - 1,         V + D - 1],
    bottom: [U + D + W,     V,       U + D + 2 * W - 1,     V + D - 1],
    right:  [U,             V + D,   U + D - 1,             V + D + H - 1],
    front:  [U + D,         V + D,   U + D + W - 1,         V + D + H - 1],
    left:   [U + D + W,     V + D,   U + D + W + D - 1,     V + D + H - 1],
    back:   [U + D + W + D, V + D,   U + 2 * (D + W) - 1,  V + D + H - 1]
  };
  for (const [name, [x1, y1, x2, y2]] of Object.entries(f)) {
    const c = colors[name] ?? colors.all;
    if (c) fill(img, x1, y1, x2, y2, c);
  }
  return f;
}

// Gradient fill — smoothly transitions from c1 (top) to c2 (bottom)
function vGrad(img, x1, y1, x2, y2, c1, c2) {
  const r1 = parseInt(c1.slice(1,3),16), g1 = parseInt(c1.slice(3,5),16), b1 = parseInt(c1.slice(5,7),16);
  const r2 = parseInt(c2.slice(1,3),16), g2 = parseInt(c2.slice(3,5),16), b2 = parseInt(c2.slice(5,7),16);
  const rows = y2 - y1;
  for (let y = y1; y <= y2; y++) {
    const t = rows === 0 ? 0 : (y - y1) / rows;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    const h = ((r << 24) | (g << 16) | (b << 8) | 0xFF) >>> 0;
    for (let x = x1; x <= x2; x++) img.setPixelColor(h, x, y);
  }
}

// ════════════════════════════════════════════════════════
// SANSÓN — 64×64 | Jueces 13-16
// Dark olive skin, 7 braids (black + brown highlights),
// thick beard, linen tunic, gold belt. Strong build.
// ════════════════════════════════════════════════════════
async function genSamson() {
  const img = new Jimp(64, 64, 0x00000000);

  // Palette
  const SK  = "#8B5E3C", SKH = "#A07050", SKS = "#6B4028", SKD = "#4A2A14";
  const HR  = "#0E0800", HRL = "#2A1A08", HRH = "#1A1004";
  const EYE_W = "#FFFFFF", EYE_I = "#3A1A00";
  const BRD = "#1A0E04", BRDD = "#0E0800", MOUTH = "#7A3828";
  const BROW = "#0E0800";
  const TUN = "#D4B883", TUNS = "#B09868", TUND = "#8A7A48", TUNDD = "#6A5A30";
  const BELT = "#B08A18", GOLD = "#D4A820";
  const SAND = "#7A4A20", SANDD = "#5A3410";

  // ── HEAD [0,0] [8,8,8] ──
  paintBox(img, 0, 0, 8, 8, 8, {
    top: HR, bottom: SKD, front: SK, back: HR, right: SK, left: SK
  });

  // Right side (west) [0,8]-[7,15]: x=7 is front edge (adj. to front), x=0 is back
  fill(img, 0,8, 4,15, HR);  fill(img, 5,8, 7,15, SK);
  fill(img, 5,14, 7,15, SKS); // jaw shadow
  // Left side (east) [16,8]-[23,15]: x=16 is front edge, x=23 is back
  fill(img, 16,8, 18,15, SK); fill(img, 19,8, 23,15, HR);
  fill(img, 16,14, 18,15, SKS);

  // Front face [8,8]-[15,15] — detailed face
  // y8: hair line
  fill(img, 8,8, 15,8, HR);
  // y9: forehead
  px(img,8,9,HR); fill(img,9,9,14,9,SK); px(img,15,9,HR);
  // y10: eyebrows — thick, dark, SYMMETRIC (center at x=11.5)
  px(img,8,10,SKS); fill(img,9,10,10,10,BROW); fill(img,11,10,12,10,SK); fill(img,13,10,14,10,BROW); px(img,15,10,SKS);
  // y11: eyes — WHITE sclera, dark brown iris, SYMMETRIC
  px(img,8,11,SK); px(img,9,11,EYE_W); px(img,10,11,EYE_I);
  fill(img,11,11,12,11,SK);
  px(img,13,11,EYE_I); px(img,14,11,EYE_W); px(img,15,11,SK);
  // y12: under eyes — SYMMETRIC
  px(img,8,12,SK); px(img,9,12,EYE_W); px(img,10,12,EYE_I);
  fill(img,11,12,12,12,SK);
  px(img,13,12,EYE_I); px(img,14,12,EYE_W); px(img,15,12,SK);
  // y13: nose bridge shadow
  fill(img,8,13,10,13,SK); fill(img,11,13,12,13,SKS); fill(img,13,13,15,13,SK);
  // y14: beard + mouth
  px(img,8,14,BRD); fill(img,9,14,10,14,BRD);
  fill(img,11,14,12,14,MOUTH);
  fill(img,13,14,14,14,BRD); px(img,15,14,BRD);
  // y15: thick beard
  fill(img,8,15,15,15,BRD);

  // ── HAT [32,0] [8,8,8] — thick hair mass + braid roots ──
  paintBox(img, 32, 0, 8, 8, 8, { all: HR });
  // Top: braid root pattern — 7 thick lines radiating from center
  for (let x = 40; x <= 47; x++)
    for (let y = 0; y <= 7; y++) {
      const cx = x - 43.5, cy = y - 3.5;
      const angle = Math.atan2(cy, cx);
      const sector = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 7);
      px(img, x, y, (sector % 2 === 0) ? HRL : HR);
    }
  // Back: full thick hair roots
  for (let x = 56; x <= 63; x++)
    for (let y = 8; y <= 15; y++)
      px(img, x, y, ((x * 3 + y) % 4 === 0) ? HRL : ((x + y) % 3 === 0) ? HRH : HR);
  // Front [40,8]-[47,15]: hair top 2 rows, rest transparent for face
  dither(img, 40,8, 47,9, HR, HRL);
  fill(img, 40,10, 40,11, HR); fill(img, 47,10, 47,11, HR);
  clr(img, 41,10, 46,11);
  clr(img, 40,12, 47,15);
  // Sides: upper half hair (braid roots), lower half transparent
  for (let x = 32; x <= 39; x++)
    for (let y = 8; y <= 11; y++)
      px(img, x, y, ((x + y) % 2 === 0) ? HR : HRL);
  clr(img, 32,12, 39,15);
  for (let x = 48; x <= 55; x++)
    for (let y = 8; y <= 11; y++)
      px(img, x, y, ((x + y) % 2 === 0) ? HR : HRL);
  clr(img, 48,12, 55,15);
  // Bottom: transparent
  clr(img, 48,0, 55,7);

  // ── BODY [16,16] [8,12,4] — linen tunic ──
  paintBox(img, 16, 16, 8, 12, 4, {
    front: TUN, back: TUND, top: TUNS, bottom: TUNS,
    right: TUNS, left: TUNS
  });
  // Front [20,20]-[27,31]
  fill(img, 23,20, 24,20, SK);  px(img,22,20,TUNS); px(img,25,20,TUNS); // V-neck
  fill(img, 23,21, 24,21, SKS);
  // Gold belt
  fill(img, 20,25, 27,25, BELT); fill(img, 20,26, 27,26, GOLD);
  fill(img, 16,25, 19,26, BELT); fill(img, 28,25, 31,26, BELT);
  fill(img, 32,25, 39,26, BELT);
  // Fold shadows
  px(img,22,28,TUNS); px(img,25,28,TUNS);
  px(img,21,29,TUNS); px(img,26,29,TUNS);
  fill(img, 20,31, 27,31, TUND);

  // ── RIGHT ARM [40,16] [4,12,4] ──
  paintBox(img, 40, 16, 4, 12, 4, {
    front: SK, back: SKS, top: TUN, right: SKS, left: SKS, bottom: SKD
  });
  fill(img,44,20,47,23,TUN); fill(img,40,20,43,23,TUN);
  fill(img,48,20,51,23,TUN); fill(img,52,20,55,23,TUN);
  fill(img,44,24,47,24,TUNS);
  fill(img,44,30,47,31,BELT); fill(img,40,30,43,31,BELT);

  // ── LEFT ARM [32,48] [4,12,4] ──
  paintBox(img, 32, 48, 4, 12, 4, {
    front: SK, back: SKS, top: TUN, right: SKS, left: SKS, bottom: SKD
  });
  fill(img,36,52,39,55,TUN); fill(img,32,52,35,55,TUN);
  fill(img,40,52,43,55,TUN); fill(img,44,52,47,55,TUN);
  fill(img,36,56,39,56,TUNS);
  fill(img,36,62,39,63,BELT); fill(img,32,62,35,63,BELT);

  // ── RIGHT LEG [0,16] [4,12,4] ──
  // UV: right[0,20] front[4,20] left[8,20] back[12,20]
  paintBox(img, 0, 16, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  fill(img,4,25,7,25,TUND);
  fill(img,4,26,7,29,SK); fill(img,0,26,3,29,SKS);
  fill(img,8,26,11,29,SKS);
  fill(img,4,30,7,31,SAND); fill(img,0,30,3,31,SAND);
  fill(img,8,30,11,31,SAND);
  // Back [12,20]-[15,31]: matching tunic→skin→sandals
  fill(img,12,25,15,25,TUND);
  fill(img,12,26,15,29,SKS);
  fill(img,12,30,15,31,SANDD);

  // ── LEFT LEG [16,48] [4,12,4] ──
  // UV: right[16,52] front[20,52] left[24,52] back[28,52]
  paintBox(img, 16, 48, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  fill(img,20,57,23,57,TUND);
  fill(img,20,58,23,61,SK); fill(img,16,58,19,61,SKS);
  fill(img,24,58,27,61,SKS);
  fill(img,20,62,23,63,SAND); fill(img,16,62,19,63,SAND);
  fill(img,24,62,27,63,SAND);
  // Back [28,52]-[31,63]: matching tunic→skin→sandals
  fill(img,28,57,31,57,TUND);
  fill(img,28,58,31,61,SKS);
  fill(img,28,62,31,63,SANDD);

  // ── 7 BRAIDS (Judges 16:13) — rope-weave pattern with gold tips ──
  // Helper: paint a braid at UV [U,V] size [2, H, 2]
  function paintBraid(U, V, H) {
    paintBox(img, U, V, 2, H, 2, { all: HR });
    // Rope weave on front [U+2, V+2] and back [U+6, V+2] faces
    for (let y = V + 2; y <= V + 1 + H; y++) {
      const odd = (y - V) % 2;
      px(img, U + 2 + odd, y, HRL);       // front weave
      px(img, U + 6 + (1 - odd), y, HRL); // back weave
      // Side highlights every 3 rows
      if ((y - V) % 3 === 0) {
        px(img, U, y, HRL);     // right side
        px(img, U + 4, y, HRL); // left side
      }
    }
    // Gold bead/tie at bottom (last row of each face)
    const bot = V + 1 + H;
    fill(img, U + 2, bot, U + 3, bot, GOLD); // front
    fill(img, U + 6, bot, U + 7, bot, GOLD); // back
    fill(img, U, bot, U + 1, bot, GOLD);     // right
    fill(img, U + 4, bot, U + 5, bot, GOLD); // left
    // Bottom face: gold
    fill(img, U + 4, V, U + 5, V + 1, GOLD);
  }

  // braidFL [56,16] 2×8×2 — front-left
  paintBraid(56, 16, 8);
  // braidFR [56,26] 2×8×2 — front-right
  paintBraid(56, 26, 8);
  // braidL  [56,36] 2×10×2 — left side
  paintBraid(56, 36, 10);
  // braidR  [56,48] 2×10×2 — right side
  paintBraid(56, 48, 10);
  // braidBL [0,34]  2×12×2 — back-left
  paintBraid(0, 34, 12);
  // braidBR [8,34]  2×12×2 — back-right
  paintBraid(8, 34, 12);
  // braidBC [16,32] 2×14×2 — back-center (longest)
  paintBraid(16, 32, 14);

  await img.writeAsync(path.join(OUT, "samson.png"));
  console.log("✅ samson.png (64×64)");
}

// ════════════════════════════════════════════════════════
// DALILA — 64×64 | Jueces 16
// Olive warm skin, kohl-rimmed eyes, purple dress, gold
// accents, dark hair veil. Slim arms.
// ════════════════════════════════════════════════════════
async function genDalila() {
  const img = new Jimp(64, 64, 0x00000000);

  // Palette
  const SK  = "#C49070", SKH = "#D8A888", SKS = "#A07050", SKD = "#886040";
  const HR  = "#140A08", HRL = "#2A1A14", HRH = "#1E0E0A";
  const KOHL = "#000000", EYE_W = "#FFFFFF", EYE_I = "#1B8050";
  const BLUSH = "#D48870", LIPS = "#9B2020";
  const BROW = "#140A08";
  const DRESS = "#5A1A90", DRESSD = "#481478", DRESSDD = "#30104A", DRESSB = "#7A30B0";
  const GOLD = "#D4A820", GOLDD = "#A88818";
  const VEIL = "#7040A0", VEILD = "#5A2A80", VEILB = "#9050C0";

  // ── HEAD [0,0] [8,8,8] ──
  paintBox(img, 0, 0, 8, 8, 8, {
    top: HR, bottom: SKD, front: SK, back: HR, right: SK, left: SK
  });
  // Right side (west) [0,8]-[7,15]: x=7 is front edge (adj. to front), x=0 is back
  fill(img, 0,8, 3,15, HR);  fill(img, 4,8, 7,15, SK);
  fill(img, 4,14, 7,15, SKS);
  // Left side (east) [16,8]-[23,15]: x=16 is front edge, x=23 is back
  fill(img, 16,8, 19,15, SK); fill(img, 20,8, 23,15, HR);
  fill(img, 16,14, 19,15, SKS);

  // Front face [8,8]-[15,15]
  fill(img, 8,8, 15,8, HR);                                          // y8: hairline
  px(img,8,9,HR); fill(img,9,9,14,9, SK); px(img,15,9,HR);          // y9: forehead
  // y10: kohl eyebrows — SYMMETRIC (center at x=11.5)
  px(img,8,10,SK); fill(img,9,10,10,10,BROW); fill(img,11,10,12,10,SK); fill(img,13,10,14,10,BROW); px(img,15,10,SK);
  // y11: eyes — kohl-rimmed, SYMMETRIC
  px(img,8,11,KOHL); px(img,9,11,EYE_W); px(img,10,11,EYE_I);
  fill(img,11,11,12,11,SK);
  px(img,13,11,EYE_I); px(img,14,11,EYE_W); px(img,15,11,KOHL);
  // y12: lower eyes — SYMMETRIC
  px(img,8,12,KOHL); px(img,9,12,EYE_W); px(img,10,12,EYE_I);
  fill(img,11,12,12,12,SK);
  px(img,13,12,EYE_I); px(img,14,12,EYE_W); px(img,15,12,KOHL);
  // y13: cheeks with blush
  px(img,8,13,SK); px(img,9,13,BLUSH);
  fill(img,10,13,13,13,SK);
  px(img,14,13,BLUSH); px(img,15,13,SK);
  // y14: nose
  fill(img,8,14,10,14,SK); fill(img,11,14,12,14,SKS); fill(img,13,14,15,14,SK);
  // y15: red lips
  px(img,8,15,SKD); px(img,9,15,SK);
  fill(img,10,15,13,15,LIPS);
  px(img,14,15,SK); px(img,15,15,SKD);

  // ── HAT [32,0] [8,8,8] — purple veil overlay ──
  // Hat overlay is inflate 0.5 over head. Front must be mostly transparent to show face.
  paintBox(img, 32, 0, 8, 8, 8, { all: VEIL });
  // Top [40,0]-[47,7]: gold diadem border + veil
  fill(img, 40,0, 47,0, GOLD);
  dither(img, 40,1, 47,7, VEIL, VEILD);
  // Front [40,8]-[47,15]: gold diadem on top row, rest transparent for face
  fill(img, 40,8, 47,8, GOLD);
  clr(img, 40,9, 47,15);
  // Right/west side [32,8]-[39,15]: veil top 2 rows, lower transparent
  fill(img, 32,8, 39,9, VEIL);
  clr(img, 32,10, 39,15);
  // Left/east side [48,8]-[55,15]: veil top 2 rows, lower transparent
  fill(img, 48,8, 55,9, VEIL);
  clr(img, 48,10, 55,15);
  // Back [56,8]-[63,15]: full dark hair under veil
  for (let x = 56; x <= 63; x++)
    for (let y = 8; y <= 15; y++)
      px(img, x, y, ((x + y) % 3 === 0) ? HRL : HR);
  // Bottom: transparent
  clr(img, 48,0, 55,7);

  // ── BODY [16,16] [8,12,4] — purple dress ──
  paintBox(img, 16, 16, 8, 12, 4, {
    front: DRESS, back: DRESSDD, top: DRESSD, bottom: DRESSDD,
    right: DRESSD, left: DRESSD
  });
  // Front detail [20,20]-[27,31]:
  fill(img, 22,20, 25,20, SKS); // neckline skin
  fill(img, 22,21, 25,21, GOLD); // gold neckpiece
  fill(img, 20,24, 27,24, GOLD); fill(img, 20,25, 27,25, GOLDD); // belt
  fill(img, 16,24, 19,25, GOLD); fill(img, 28,24, 31,25, GOLD);
  fill(img, 32,24, 39,25, GOLD);
  // Pleat shadows
  px(img,22,28,DRESSDD); px(img,25,28,DRESSDD);
  px(img,21,30,DRESSDD); px(img,26,30,DRESSDD);
  fill(img, 20,31, 27,31, DRESSDD);
  // Side gradient
  vGrad(img, 16,20, 19,31, DRESSD, DRESSDD);
  vGrad(img, 28,20, 31,31, DRESSD, DRESSDD);

  // ── RIGHT ARM [40,16] [3,12,4] slim ──
  paintBox(img, 40, 16, 3, 12, 4, {
    front: SK, back: SKS, top: DRESS, right: SKS, left: SKS, bottom: SKD
  });
  fill(img,44,20,46,23,DRESS); fill(img,40,20,43,23,DRESS);
  fill(img,47,20,50,23,DRESS); fill(img,51,20,53,23,DRESS);
  fill(img,44,24,46,24,DRESSD);
  fill(img,44,26,46,27,GOLD); // bracelet

  // ── LEFT ARM [32,48] [3,12,4] slim ──
  paintBox(img, 32, 48, 3, 12, 4, {
    front: SK, back: SKS, top: DRESS, right: SKS, left: SKS, bottom: SKD
  });
  fill(img,36,52,38,55,DRESS); fill(img,32,52,35,55,DRESS);
  fill(img,39,52,42,55,DRESS); fill(img,43,52,45,55,DRESS);
  fill(img,36,56,38,56,DRESSD);
  fill(img,36,58,38,59,GOLD); // bracelet

  // ── RIGHT LEG [0,16] [4,12,4] ──
  paintBox(img, 0, 16, 4, 12, 4, {
    front: DRESS, back: DRESSD, top: DRESS, right: DRESSD, left: DRESSD, bottom: DRESSDD
  });
  fill(img, 4,30, 7,31, GOLD); fill(img, 0,31, 3,31, GOLD);

  // ── LEFT LEG [16,48] [4,12,4] ──
  paintBox(img, 16, 48, 4, 12, 4, {
    front: DRESS, back: DRESSD, top: DRESS, right: DRESSD, left: DRESSD, bottom: DRESSDD
  });
  fill(img, 20,62, 23,63, GOLD); fill(img, 16,63, 19,63, GOLD);

  // ── VEIL BONE [0,32] [8,4,8] (inflate 0.6) ──
  paintBox(img, 0, 32, 8, 4, 8, { all: VEIL });
  fill(img, 8,32, 15,32, GOLD); fill(img, 8,33, 15,33, VEILD); // top: gold + veil
  // Front [8,40]-[15,43]: upper row veil, lower transparent
  fill(img, 8,40, 15,40, VEIL); fill(img, 8,41, 15,41, VEILD);
  clr(img, 8,42, 15,43);
  // Sides: top opaque, bottom transparent
  clr(img, 0,42, 7,43);
  clr(img, 16,42, 23,43);
  // Bottom: transparent
  clr(img, 16,32, 23,39);

  // ── SKIRT BONE [32,32] [8,12,3] (inflate 0.3) ──
  paintBox(img, 32, 32, 8, 12, 3, {
    front: DRESSD, back: DRESSDD, top: DRESSD,
    right: DRESSDD, left: DRESSDD, bottom: GOLD
  });
  for (let y = 37; y <= 45; y += 4) fill(img, 35,y, 42,y, DRESSDD);
  fill(img, 35,45, 42,46, GOLD);

  await img.writeAsync(path.join(OUT, "dalila.png"));
  console.log("✅ dalila.png (64×64)");
}

// ════════════════════════════════════════════════════════
// DAVID — 64×64 | I Samuel 16-17
// Young shepherd boy: ruddy/fair skin, copper curly hair,
// bright green eyes, rosy cheeks, shepherd tunic, sling.
// Geometry uses per-face UV — north face omitted on hat
// and curlyHair so face always shows through.
// ════════════════════════════════════════════════════════
async function genDavid() {
  const img = new Jimp(64, 64, 0x00000000);

  // Palette — high contrast for visible face
  const SK  = "#DBA070", SKH = "#EABC90", SKS = "#C08050", SKD = "#A06838";
  const HR  = "#CC5E18", HRD = "#A04410", HRL = "#E87A30", HRB = "#FF9040";
  const EYE_W = "#FFFFFF", EYE_I = "#145028", EYE_P = "#0A2010";
  const ROSY = "#E8907A", MOUTH = "#C06050", LIPS = "#B85050";
  const BROW = "#6A3010";
  const TUN = "#C8A058", TUNS = "#AA8840", TUND = "#8A7030", TUNDD = "#6A5820";
  const ROPE = "#5A3A0A", ROPEL = "#7A5A1A";
  const SLING = "#8B6030";
  const SAND = "#8B4518", SANDD = "#6B3A1A";

  // ── HEAD [0,0] [8,8,8] ──
  paintBox(img, 0, 0, 8, 8, 8, {
    top: HR, bottom: SKD, front: SK, back: HRD, right: SK, left: SK
  });

  // Right side (west) [0,8]-[7,15]: x=7 is front edge (adj. to front), x=0 is back
  fill(img, 0,8, 4,15, HRD); fill(img, 5,8, 7,15, SK);
  px(img,4,8,HR); px(img,3,8,HR);
  fill(img, 5,14, 7,15, SKS); // jaw shadow
  // Left side (east) [16,8]-[23,15]: x=16 is front edge, x=23 is back
  fill(img, 16,8, 18,15, SK); fill(img, 19,8, 23,15, HRD);
  px(img,19,8,HR); px(img,20,8,HR);
  fill(img, 16,14, 18,15, SKS);

  // ═══ FRONT FACE [8,8]-[15,15] — THE VISIBLE FACE ═══
  // "ruddy and handsome" (1 Samuel 16:12) — symmetric, bright, youthful
  // y8: thick copper hair fringe
  fill(img, 8,8, 15,8, HR);
  // y9: curly fringe — symmetric
  px(img,8,9,HRD); px(img,9,9,HR); px(img,10,9,HRL);
  fill(img,11,9,12,9,SK);
  px(img,13,9,HRL); px(img,14,9,HR); px(img,15,9,HRD);
  // y10: forehead + brows — soft arched, SYMMETRIC (center at x=11.5)
  px(img,8,10,SK); fill(img,9,10,10,10,BROW); fill(img,11,10,12,10,SKH); fill(img,13,10,14,10,BROW); px(img,15,10,SK);
  // y11: eyes — bright green iris + white sclera, SYMMETRIC
  px(img,8,11,SK); px(img,9,11,EYE_W); px(img,10,11,EYE_I);
  fill(img,11,11,12,11,SK);
  px(img,13,11,EYE_I); px(img,14,11,EYE_W); px(img,15,11,SK);
  // y12: lower eyes — SYMMETRIC
  px(img,8,12,SK); px(img,9,12,EYE_W); px(img,10,12,EYE_P);
  fill(img,11,12,12,12,SK);
  px(img,13,12,EYE_P); px(img,14,12,EYE_W); px(img,15,12,SK);
  // y13: cheeks with rosy blush + small nose — symmetric
  px(img,8,13,SK); px(img,9,13,ROSY);
  px(img,10,13,SK); fill(img,11,13,12,13,SKS); px(img,13,13,SK);
  px(img,14,13,ROSY); px(img,15,13,SK);
  // y14: nose tip — subtle
  px(img,8,14,SK); px(img,9,14,SK); px(img,10,14,SK);
  fill(img,11,14,12,14,SKS);
  px(img,13,14,SK); px(img,14,14,SK); px(img,15,14,SK);
  // y15: mouth — soft pink lips
  px(img,8,15,SKD); px(img,9,15,SK);
  fill(img,10,15,13,15,LIPS);
  px(img,14,15,SK); px(img,15,15,SKD);

  // ── HAT [32,0] [8,8,8] — copper curls overlay ──
  // Per-face UV in geometry: north (front) omitted. Only south/east/west/up rendered.
  paintBox(img, 32, 0, 8, 8, 8, { all: "#00000000" });

  // Top face [40,0]-[47,7]: rich curl pattern
  for (let x = 40; x <= 47; x++)
    for (let y = 0; y <= 7; y++) {
      const v = ((x * 2 + y) % 5);
      px(img, x, y, v === 0 ? HRB : v < 3 ? HR : HRD);
    }

  // Back face [56,8]-[63,15]: full dark curls (→ south face via per-face UV)
  for (let x = 56; x <= 63; x++)
    for (let y = 8; y <= 15; y++) {
      const v = ((x * 3 + y * 2) % 7);
      px(img, x, y, v < 2 ? HRL : v < 4 ? HR : HRD);
    }

  // Front face [40,8]-[47,15]: transparent (north face omitted in geometry anyway)
  clr(img, 40, 8, 47, 15);

  // Right side [32,8]-[39,15]: full curls for sides (→ west face)
  for (let x = 32; x <= 39; x++)
    for (let y = 8; y <= 15; y++) {
      if (y >= 13) { clr(img, x, y, x, y); continue; } // lower half transparent
      px(img, x, y, ((x + y) % 3 === 0) ? HRL : ((x + y) % 2 === 0) ? HR : HRD);
    }

  // Left side [48,8]-[55,15]: full curls (→ east face)
  for (let x = 48; x <= 55; x++)
    for (let y = 8; y <= 15; y++) {
      if (y >= 13) { clr(img, x, y, x, y); continue; }
      px(img, x, y, ((x + y) % 3 === 0) ? HRL : ((x + y) % 2 === 0) ? HR : HRD);
    }

  // Bottom: transparent
  clr(img, 48, 0, 55, 7);

  // ── CURLY HAIR [0,32] [8,4,8] (inflate 0.5 in geometry) ──
  // Per-face UV: north omitted. Only south/east/west/up rendered.
  paintBox(img, 0, 32, 8, 4, 8, { all: "#00000000" });

  // Top face [8,32]-[15,39]: rich copper curls
  for (let x = 8; x <= 15; x++)
    for (let y = 32; y <= 39; y++) {
      const v = ((x * 3 + y * 2) % 6);
      px(img, x, y, v < 2 ? HRB : v < 4 ? HR : HRD);
    }

  // Back face [24,40]-[31,43]: curls hanging down (→ south)
  for (let x = 24; x <= 31; x++)
    for (let y = 40; y <= 43; y++) {
      px(img, x, y, ((x + y) % 3 === 0) ? HRL : ((x + y * 2) % 4 === 0) ? HRD : HR);
    }

  // Front face [8,40]-[15,43]: transparent (north omitted in geometry)
  clr(img, 8, 40, 15, 43);

  // Right side [0,40]-[7,43]: curls (→ west)
  for (let x = 0; x <= 7; x++)
    for (let y = 40; y <= 43; y++)
      px(img, x, y, ((x + y) % 2 === 0) ? HR : HRD);

  // Left side [16,40]-[23,43]: curls (→ east)
  for (let x = 16; x <= 23; x++)
    for (let y = 40; y <= 43; y++)
      px(img, x, y, ((x + y) % 2 === 0) ? HR : HRD);

  // Bottom: transparent
  clr(img, 16, 32, 23, 39);

  // ── BODY [16,16] [8,12,4] — shepherd tunic ──
  paintBox(img, 16, 16, 8, 12, 4, {
    front: TUN, back: TUND, top: TUNS, bottom: TUNS,
    right: TUNS, left: TUNS
  });
  // Front [20,20]-[27,31]:
  fill(img, 23,20, 24,20, SK); px(img,22,20,TUNS); px(img,25,20,TUNS); // V-neck
  fill(img, 23,21, 24,21, SKS);
  // Sling strap diagonal
  px(img,26,22,SLING); px(img,25,23,SLING); px(img,24,24,SLING); px(img,23,25,SLING);
  // Rope belt
  fill(img, 20,26, 27,26, ROPE); dither(img, 20,27, 27,27, ROPE, ROPEL);
  fill(img, 16,26, 19,27, ROPE); fill(img, 28,26, 31,27, ROPE);
  fill(img, 32,26, 39,27, ROPE);
  // Fold shadows
  px(img,22,29,TUNS); px(img,25,29,TUNS);
  px(img,21,30,TUNS); px(img,26,30,TUNS);
  fill(img, 20,31, 27,31, TUND);
  // Shade gradients on sides
  vGrad(img, 16,20, 19,31, TUNS, TUND);
  vGrad(img, 28,20, 31,31, TUNS, TUND);

  // ── RIGHT ARM [40,16] [3,12,4] slim ──
  paintBox(img, 40, 16, 3, 12, 4, {
    front: SK, back: SKS, top: TUN, right: SKS, left: SKS, bottom: SKD
  });
  fill(img,44,20,46,22,TUN); fill(img,40,20,43,22,TUN);
  fill(img,47,20,50,22,TUN); fill(img,51,20,53,22,TUN);
  fill(img,44,23,46,23,TUNS);
  fill(img,44,29,46,30,SLING); fill(img,40,29,43,30,SLING);

  // ── LEFT ARM [32,48] [3,12,4] slim ──
  paintBox(img, 32, 48, 3, 12, 4, {
    front: SK, back: SKS, top: TUN, right: SKS, left: SKS, bottom: SKD
  });
  fill(img,36,52,38,54,TUN); fill(img,32,52,35,54,TUN);
  fill(img,39,52,42,54,TUN); fill(img,43,52,45,54,TUN);
  fill(img,36,55,38,55,TUNS);

  // ── RIGHT LEG [0,16] [4,12,4] ──
  // UV regions: right[0,20] front[4,20] left[8,20] back[12,20]
  paintBox(img, 0, 16, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  // Front: tunic→skin→sandals
  fill(img,4,25,7,25,TUND);
  fill(img,4,26,7,29,SK); fill(img,0,26,3,29,SKS);
  fill(img,8,26,11,29,SKS);
  fill(img,4,30,7,31,SAND); fill(img,0,30,3,31,SAND);
  fill(img,8,30,11,31,SAND);
  // Back [12,20]-[15,31]: matching tunic→skin→sandals
  fill(img,12,25,15,25,TUND);
  fill(img,12,26,15,29,SKS);
  fill(img,12,30,15,31,SANDD);

  // ── LEFT LEG [16,48] [4,12,4] ──
  // UV regions: right[16,52] front[20,52] left[24,52] back[28,52]
  paintBox(img, 16, 48, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  // Front: tunic→skin→sandals
  fill(img,20,57,23,57,TUND);
  fill(img,20,58,23,61,SK); fill(img,16,58,19,61,SKS);
  fill(img,24,58,27,61,SKS);
  fill(img,20,62,23,63,SAND); fill(img,16,62,19,63,SAND);
  fill(img,24,62,27,63,SAND);
  // Back [28,52]-[31,63]: matching tunic→skin→sandals
  fill(img,28,57,31,57,TUND);
  fill(img,28,58,31,61,SKS);
  fill(img,28,62,31,63,SANDD);

  await img.writeAsync(path.join(OUT, "david.png"));
  console.log("✅ david.png (64×64)");
}

// ════════════════════════════════════════════════════════
// GOLIÁT — 128×64 | I Samuel 17
// Giant Philistine warrior. Bronze helmet, visor slit,
// glowing eyes, chainmail body, gold accents, spear.
// Scale 1.85 in entity definition.
// ════════════════════════════════════════════════════════
async function genGoliath() {
  const img = new Jimp(128, 64, 0x00000000);

  // Palette — armor
  const BRZ  = "#CD8B3A", BRZD = "#A07030", BRZL = "#E0A050", BRZDD = "#805820";
  const GOLD = "#D4A820", GOLDB = "#FFD700";
  const CHAIN = "#909090", CHAINL = "#B0B0B0", CHAIND = "#707070";
  const LEATH = "#6B3A1A", LEATHD = "#4A2A10";
  const WOOD = "#3A2010", WOODL = "#5A3820";
  // Palette — face
  const SK  = "#7A5A38", SKS = "#5A4028", SKD = "#3A2818";
  const BROW = "#2A1A0A", EYE_W = "#D0C8C0", EYE_I = "#1A0A00";
  const BRD = "#1A0E04", BRDD = "#0E0800", MOUTH = "#4A2818";

  // ── HEAD [0,0] [10,10,10] — visible Philistine warrior face ──
  paintBox(img, 0, 0, 10, 10, 10, {
    top: BRZD, bottom: BRDD, front: SK, back: SKD,
    right: SK, left: SK
  });

  // Right side (west) [0,10]-[9,19]: x=9 is front edge, x=0 is back
  // Front half (near face): skin upper, beard lower; back half: dark hair/shadow
  fill(img, 0,10, 4,10, SKD);   fill(img, 5,10, 9,10, BRZD);   // helmet shadow
  fill(img, 0,11, 4,11, SKD);   fill(img, 5,11, 9,11, BROW);   // brow
  fill(img, 0,12, 4,13, SKD);   fill(img, 5,12, 9,13, SK);     // face
  fill(img, 0,14, 4,15, SKD);   fill(img, 5,14, 9,15, SK);     // cheeks
  fill(img, 0,16, 4,16, SKD);   fill(img, 5,16, 9,16, SKS);    // jaw
  fill(img, 0,17, 4,19, BRDD);  fill(img, 5,17, 9,19, BRD);    // beard

  // Left side (east) [20,10]-[29,19]: x=20 is front edge, x=29 is back
  fill(img, 20,10, 24,10, BRZD); fill(img, 25,10, 29,10, SKD);
  fill(img, 20,11, 24,11, BROW); fill(img, 25,11, 29,11, SKD);
  fill(img, 20,12, 24,13, SK);   fill(img, 25,12, 29,13, SKD);
  fill(img, 20,14, 24,15, SK);   fill(img, 25,14, 29,15, SKD);
  fill(img, 20,16, 24,16, SKS);  fill(img, 25,16, 29,16, SKD);
  fill(img, 20,17, 24,19, BRD);  fill(img, 25,17, 29,19, BRDD);

  // Back [30,10]-[39,19]: back of head (dark, under helmet)
  vGrad(img, 30,10, 39,19, SKD, BRDD);

  // Front face [10,10]-[19,19] — fierce Philistine warrior
  // y10: helmet shadow / brow overhang
  fill(img, 10,10, 19,10, BRZD);
  // y11: heavy brow ridge — thick, dark, imposing
  px(img,10,11,SKD); fill(img,11,11,12,11,BROW); fill(img,13,11,14,11,BROW);
  fill(img,15,11,16,11,SKD); fill(img,17,11,18,11,BROW); px(img,19,11,SKD);
  // y12: eyes — deep-set, fierce, dark
  px(img,10,12,SK); px(img,11,12,SKS);
  px(img,12,12,EYE_W); px(img,13,12,EYE_I);
  fill(img,14,12,15,12,SKS);
  px(img,16,12,EYE_I); px(img,17,12,EYE_W);
  px(img,18,12,SKS); px(img,19,12,SK);
  // y13: under eyes
  px(img,10,13,SK); px(img,11,13,SK);
  px(img,12,13,EYE_W); px(img,13,13,EYE_I);
  fill(img,14,13,15,13,SK);
  px(img,16,13,EYE_I); px(img,17,13,EYE_W);
  px(img,18,13,SK); px(img,19,13,SK);
  // y14: nose — broad, prominent
  fill(img,10,14,12,14,SK); fill(img,13,14,16,14,SKD); fill(img,17,14,19,14,SK);
  // y15: cheeks / nose tip
  fill(img,10,15,12,15,SK); fill(img,13,15,16,15,SKS); fill(img,17,15,19,15,SK);
  // y16: mouth / upper beard
  px(img,10,16,BRD); fill(img,11,16,12,16,SK);
  fill(img,13,16,14,16,MOUTH); fill(img,15,16,16,16,MOUTH);
  fill(img,17,16,18,16,SK); px(img,19,16,BRD);
  // y17: thick beard
  fill(img,10,17,19,17,BRD);
  // y18: beard — darker center
  px(img,10,18,BRD); fill(img,11,18,18,18,BRDD); px(img,19,18,BRD);
  // y19: chin beard
  fill(img,10,19,19,19,BRDD);

  // ── HAT [44,0] [11,11,11] — open-face bronze helmet ──
  // UV: top[55,0] bottom[66,0] right[44,11] front[55,11] left[66,11] back[77,11]
  paintBox(img, 44, 0, 11, 11, 11, { all: "#00000000" });
  // Top [55,0]-[65,10]: helmet crown — imposing bronze with gold ridge
  fill(img, 55,0, 65,0, GOLDB); fill(img, 55,1, 65,1, GOLD);
  for (let x = 55; x <= 65; x++)
    for (let y = 2; y <= 10; y++)
      px(img, x, y, ((x + y) % 3 === 0) ? BRZL : BRZ);
  // Front [55,11]-[65,21]: helmet brow on top 3 rows, rest TRANSPARENT for face
  fill(img, 55,11, 65,11, BRZL); // highlight edge
  fill(img, 55,12, 65,12, BRZ);  // helmet plate
  fill(img, 55,13, 65,13, BRZD); // dark brow edge (shadows the eyes)
  clr(img, 55,14, 65,21);        // face opening — transparent to show head beneath
  // Right/west side [44,11]-[54,21]: helmet covers upper 5 rows, lower transparent
  vGrad(img, 44,11, 54,15, BRZL, BRZD);
  px(img,47,13,GOLD); px(img,51,13,GOLD); // rivets
  clr(img, 44,16, 54,21);
  // Left/east side [66,11]-[76,21]: matching
  vGrad(img, 66,11, 76,15, BRZL, BRZD);
  px(img,69,13,GOLD); px(img,73,13,GOLD);
  clr(img, 66,16, 76,21);
  // Back [77,11]-[87,21]: full neck guard
  vGrad(img, 77,11, 87,21, BRZ, BRZDD);
  fill(img,77,11,87,11,BRZL); // top highlight
  fill(img,80,15,84,15,GOLD); // decorative band
  fill(img,77,21,87,21,LEATH); // leather bottom edge
  // Bottom [66,0]-[76,10]: transparent (open bottom)
  clr(img, 66,0, 76,10);

  // ── BODY [0,22] [10,14,5] — chainmail ──
  // UV: right[0,27] front[5,27] left[15,27] back[20,27]
  paintBox(img, 0, 22, 10, 14, 5, {
    front: CHAIN, back: CHAIND, top: BRZ, bottom: CHAIND,
    right: CHAIND, left: CHAIND
  });
  // Front: chainmail dither + gold belt + leather
  dither(img, 5,29, 14,40, CHAIN, CHAINL);
  fill(img, 5,27, 14,28, GOLD);
  fill(img, 5,33, 14,34, LEATH); px(img,9,33,GOLD); px(img,10,33,GOLD);
  fill(img, 0,33, 4,34, LEATH); fill(img, 15,33, 19,34, LEATH);
  // Back [20,27]-[29,40]: chainmail matching front (not flat!)
  dither(img, 20,29, 29,40, CHAIND, CHAIN);
  fill(img, 20,27, 29,28, BRZD); // bronze shoulder line
  fill(img, 20,33, 29,34, LEATHD); px(img,24,33,GOLD); // belt + buckle
  // Sides: also add belt detail
  fill(img, 0,33, 4,34, LEATH);
  fill(img, 15,33, 19,34, LEATH);

  // ── RIGHT ARM [40,22] [5,14,5] ──
  // UV: right[40,27] front[45,27] left[50,27] back[55,27]
  paintBox(img, 40, 22, 5, 14, 5, {
    front: CHAIN, back: CHAIND, top: BRZ,
    right: CHAIND, left: CHAIND, bottom: CHAIND
  });
  fill(img, 45,27, 49,28, GOLD); // shoulder gold
  dither(img, 45,29, 49,38, CHAIN, CHAINL);
  fill(img, 45,39, 49,40, LEATH);
  // Back: chainmail + leather cuff
  dither(img, 55,29, 59,38, CHAIND, CHAIN);
  fill(img, 55,27, 59,28, BRZD);
  fill(img, 55,39, 59,40, LEATHD);

  // ── RIGHT LEG [60,22] [5,12,5] ──
  // UV: right[60,27] front[65,27] left[70,27] back[75,27]
  paintBox(img, 60, 22, 5, 12, 5, {
    front: BRZ, back: BRZD, top: CHAIN,
    right: BRZD, left: BRZD, bottom: LEATHD
  });
  dither(img, 65,27, 69,30, CHAIN, CHAINL);
  fill(img, 65,31, 69,32, LEATH);
  for (let y = 33; y <= 38; y += 2) fill(img,65,y,69,y,BRZD);
  // Back: matching armor plates
  dither(img, 75,27, 79,30, CHAIND, CHAIN);
  fill(img, 75,31, 79,32, LEATHD);
  vGrad(img, 75,33, 79,38, BRZD, BRZDD);

  // ── LEFT LEG [60,42] [5,12,5] ──
  // UV: right[60,47] front[65,47] left[70,47] back[75,47]
  paintBox(img, 60, 42, 5, 12, 5, {
    front: BRZ, back: BRZD, top: CHAIN,
    right: BRZD, left: BRZD, bottom: LEATHD
  });
  dither(img, 65,47, 69,50, CHAIN, CHAINL);
  fill(img, 65,51, 69,52, LEATH);
  for (let y = 53; y <= 58; y += 2) fill(img,65,y,69,y,BRZD);
  // Back: matching armor plates
  dither(img, 75,47, 79,50, CHAIND, CHAIN);
  fill(img, 75,51, 79,52, LEATHD);
  vGrad(img, 75,53, 79,58, BRZD, BRZDD);

  // ── CREST [88,0] [2,8,1] ──
  paintBox(img, 88, 0, 2, 8, 1, { all: GOLD });
  fill(img, 89,1, 90,2, GOLDB);

  // ── SPEAR [94,0] [1,28,1] ──
  paintBox(img, 94, 0, 1, 28, 1, { all: WOOD });
  fill(img, 94,0, 97,1, BRZ);
  fill(img, 94,2, 97,4, BRZD);
  fill(img, 94,5, 97,6, BRZL);
  for (let y = 10; y <= 28; y += 4) fill(img,95,y,95,y,WOODL);

  await img.writeAsync(path.join(OUT, "goliath.png"));
  console.log("✅ goliath.png (128×64)");
}

// ════════════════════════════════════════════════════════
// FILISTEO — 64×64 | Soldado enemigo
// Bronze/leather armor, hostile warrior look,
// olive skin, dark beard, bronze helmet, scale armor.
// ════════════════════════════════════════════════════════
async function genPhilistine() {
  const img = new Jimp(64, 64, 0x00000000);

  // Palette
  const SK  = "#9B7653", SKH = "#B08860", SKS = "#7A5A3A", SKD = "#5C3E25";
  const HR  = "#1A1008", HRL = "#2C1C10";
  const BRZ = "#8B6914", BRZL = "#A88020", BRZD = "#6B5010", BRZDD = "#4A3808";
  const CHAIN = "#6A6A6A", CHAINL = "#888888", CHAIND = "#4A4A4A";
  const LEATH = "#5A3A1A", LEATHD = "#3E2810", LEATHL = "#6E4E28";
  const RED  = "#8B1A1A", REDD = "#6B1010";
  const EYE = "#FFFFFF", PUPIL = "#1A1A1A";

  // ── HEAD [0,0] [8,8,8] ──
  // UV: top[8,0-15,7] bottom[16,0-23,7] right[0,8-7,15] front[8,8-15,15] left[16,8-23,15] back[24,8-31,15]
  paintBox(img, 0, 0, 8, 8, 8, { all: SK });

  // Face (front x=8..15, y=8..15) — symmetric
  // Forehead highlight
  fill(img, 10,8, 13,9, SKH);
  // Eyes: 2×2 each, symmetric around center (x=11.5)
  fill(img, 9,10, 10,11, EYE);     // left eye
  fill(img, 13,10, 14,11, EYE);    // right eye
  px(img, 10,10, PUPIL);           // left pupil (inner corner)
  px(img, 13,10, PUPIL);           // right pupil (inner corner)
  // Nose: center
  px(img, 11,12, SKH); px(img, 12,12, SKH);
  // Beard: symmetric
  fill(img, 9,13, 14,14, HR);      // main beard
  fill(img, 10,15, 13,15, HR);     // chin beard
  dither(img, 9,13, 14,14, HR, HRL); // beard texture
  px(img, 9,15, SKD); px(img, 14,15, SKD);       // jawline shadow

  // Right side (x=0..7, y=8..15) — hair + ear
  fill(img, 0,8, 7,11, HR);        // hair on right side (upper half)
  dither(img, 0,12, 7,12, HR, SK); // hair-to-skin transition
  px(img, 7,11, SKH);              // ear
  px(img, 7,12, SKH);
  fill(img, 0,13, 7,14, SK);       // lower cheek skin
  fill(img, 0,15, 7,15, SKD);      // jaw shadow

  // Left side (x=16..23, y=8..15) — mirror of right
  fill(img, 16,8, 23,11, HR);      // hair on left side
  dither(img, 16,12, 23,12, HR, SK); // transition
  px(img, 16,11, SKH);             // ear
  px(img, 16,12, SKH);
  fill(img, 16,13, 23,14, SK);     // lower cheek
  fill(img, 16,15, 23,15, SKD);    // jaw shadow

  // Top of head (x=8..15, y=0..7) — hair under helmet
  fill(img, 8,0, 15,7, HR);
  dither(img, 8,0, 15,7, HR, HRL); // hair texture

  // Back (x=24..31, y=8..15) — full hair
  fill(img, 24,8, 31,13, HR);      // hair covering back
  dither(img, 24,8, 31,13, HR, HRL);
  fill(img, 24,14, 31,15, SKD);    // neck area

  // ── HELMET OVERLAY [32,0] [8,8,8] ── (2nd layer head)
  paintBox(img, 32, 0, 8, 8, 8, { all: "#00000000" });
  // Bronze helmet
  fill(img, 40,0, 47,7, BRZ);       // helmet top
  fill(img, 40,8, 47,10, BRZL);     // helmet front top
  fill(img, 32,8, 39,10, BRZD);     // helmet right
  fill(img, 48,8, 55,10, BRZD);     // helmet left
  fill(img, 56,8, 63,10, BRZ);      // helmet back
  // Nose guard
  px(img, 44,11, BRZL); px(img, 44,12, BRZD);
  // Helmet crest ridge on top
  fill(img, 43,0, 44,7, BRZL);

  // ── BODY [16,16] [8,12,4] ──
  paintBox(img, 16, 16, 8, 12, 4, { all: CHAIN });
  // Front: scale armor pattern
  for (let y = 20; y <= 31; y += 2) {
    for (let x = 20; x <= 27; x += 2) {
      px(img, x, y, CHAINL);
    }
  }
  // Belt area
  fill(img, 20,28, 27,29, LEATH);
  px(img, 23,28, BRZL); px(img, 24,28, BRZL);   // belt buckle
  // Red sash across chest
  fill(img, 20,20, 21,24, RED);
  px(img, 22,21, REDD);
  // Back
  dither(img, 32,20, 39,31, CHAIN, CHAIND);
  fill(img, 32,28, 39,29, LEATHD);
  // Sides
  fill(img, 16,20, 19,29, CHAIND);
  fill(img, 28,20, 31,29, CHAIND);

  // ── RIGHT ARM [40,16] [4,12,4] ──
  paintBox(img, 40, 16, 4, 12, 4, { all: SK });
  // Shoulder armor
  fill(img, 44,20, 47,22, BRZD);
  fill(img, 44,23, 47,23, LEATH);
  // Forearm: exposed skin
  fill(img, 44,26, 47,31, SKH);
  // Hand
  fill(img, 44,30, 47,31, SKS);

  // ── LEFT ARM [32,48] [4,12,4] ──
  paintBox(img, 32, 48, 4, 12, 4, { all: SK });
  // Shoulder guard (shield arm)
  fill(img, 36,52, 39,55, BRZD);
  fill(img, 36,52, 39,52, BRZL);
  fill(img, 36,56, 39,56, LEATH);
  // Hand
  fill(img, 36,62, 39,63, SKS);

  // ── RIGHT LEG [0,16] [4,12,4] ──
  paintBox(img, 0, 16, 4, 12, 4, { all: LEATH });
  // Sandal
  fill(img, 4,28, 7,31, LEATHD);
  // Shin guard
  fill(img, 4,22, 7,25, BRZD);
  fill(img, 4,22, 7,22, BRZL);
  // Knee
  px(img, 5,25, BRZL); px(img, 6,25, BRZL);

  // ── LEFT LEG [16,48] [4,12,4] ──
  paintBox(img, 16, 48, 4, 12, 4, { all: LEATH });
  // Sandal
  fill(img, 20,60, 23,63, LEATHD);
  // Shin guard
  fill(img, 20,54, 23,57, BRZD);
  fill(img, 20,54, 23,54, BRZL);
  px(img, 21,57, BRZL); px(img, 22,57, BRZL);

  await img.writeAsync(path.join(OUT, "philistine.png"));
  console.log("✅ philistine.png (64×64)");
}

Promise.all([genSamson(), genDalila(), genDavid(), genGoliath(), genPhilistine()])
  .then(() => console.log("\n✅ TODAS LAS TEXTURAS GENERADAS"))
  .catch(console.error);
