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

  // Right side [0,8]-[7,15]: hair temple, skin front
  fill(img, 0,8, 2,15, SK);  fill(img, 3,8, 7,15, HR);
  fill(img, 0,14, 2,15, SKS); // jaw shadow
  // Left side [16,8]-[23,15]
  fill(img, 21,8, 23,15, SK); fill(img, 16,8, 20,15, HR);
  fill(img, 21,14, 23,15, SKS);

  // Front face [8,8]-[15,15] — detailed face
  // y8: hair line
  fill(img, 8,8, 15,8, HR);
  // y9: forehead
  px(img,8,9,HR); fill(img,9,9,14,9,SK); px(img,15,9,HR);
  // y10: eyebrows — thick, dark
  px(img,8,10,SKS); px(img,9,10,SK);
  fill(img,10,10,11,10,BROW); px(img,12,10,SK); fill(img,13,10,14,10,BROW);
  px(img,15,10,SKS);
  // y11: eyes — WHITE sclera, dark brown iris
  px(img,8,11,SK); px(img,9,11,SKS);
  px(img,10,11,EYE_W); px(img,11,11,EYE_I);
  px(img,12,11,SK);
  px(img,13,11,EYE_I); px(img,14,11,EYE_W);
  px(img,15,11,SKS);
  // y12: under eyes
  px(img,8,12,SK); px(img,9,12,SK);
  px(img,10,12,EYE_W); px(img,11,12,EYE_I);
  px(img,12,12,SK);
  px(img,13,12,EYE_I); px(img,14,12,EYE_W);
  px(img,15,12,SK);
  // y13: nose bridge shadow
  fill(img,8,13,10,13,SK); fill(img,11,13,12,13,SKS); fill(img,13,13,15,13,SK);
  // y14: beard + mouth
  px(img,8,14,BRD); fill(img,9,14,10,14,BRD);
  fill(img,11,14,12,14,MOUTH);
  fill(img,13,14,14,14,BRD); px(img,15,14,BRD);
  // y15: thick beard
  fill(img,8,15,15,15,BRD);

  // ── HAT [32,0] [8,8,8] — braids overlay ──
  paintBox(img, 32, 0, 8, 8, 8, { all: HR });
  // Top: braids pattern
  for (let x = 40; x <= 47; x++)
    for (let y = 0; y <= 7; y++)
      px(img, x, y, ((x + y * 2) % 5 === 0) ? HRL : HR);
  // Back: full braids
  for (let x = 56; x <= 63; x++)
    for (let y = 8; y <= 15; y++)
      px(img, x, y, ((x * 3 + y) % 4 === 0) ? HRL : ((x + y) % 3 === 0) ? HRH : HR);
  // Front [40,8]-[47,15]: hair top 2 rows, rest transparent for face
  dither(img, 40,8, 47,9, HR, HRL);
  fill(img, 40,10, 40,11, HR); fill(img, 47,10, 47,11, HR);
  clr(img, 41,10, 46,11);
  clr(img, 40,12, 47,15);
  // Sides: upper half hair, lower half transparent
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
  paintBox(img, 0, 16, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  fill(img,4,25,7,25,TUND);
  fill(img,4,26,7,29,SK); fill(img,0,26,3,29,SKS);
  fill(img,8,26,11,29,SKS);
  fill(img,4,30,7,31,SAND); fill(img,0,30,3,31,SAND);
  fill(img,8,30,11,31,SAND);

  // ── LEFT LEG [16,48] [4,12,4] ──
  paintBox(img, 16, 48, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  fill(img,20,57,23,57,TUND);
  fill(img,20,58,23,61,SK); fill(img,16,58,19,61,SKS);
  fill(img,24,58,27,61,SKS);
  fill(img,20,62,23,63,SAND); fill(img,16,62,19,63,SAND);
  fill(img,24,62,27,63,SAND);

  // ── HAIR LEFT [56,16] [2,16,2] ──
  paintBox(img, 56, 16, 2, 16, 2, { all: HR });
  for (let y = 20; y <= 33; y += 3) fill(img,58,y,59,y,HRL);

  // ── HAIR BACK [0,34] [6,12,2] ──
  paintBox(img, 0, 34, 6, 12, 2, { all: HR });
  for (let x = 3; x <= 7; x += 2) for (let y = 38; y <= 47; y += 3) px(img,x,y,HRL);

  // ── HAIR RIGHT [48,34] [2,14,2] ──
  paintBox(img, 48, 34, 2, 14, 2, { all: HR });
  for (let y = 38; y <= 49; y += 3) fill(img,50,y,51,y,HRL);

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
  // Right side: hair on back half
  fill(img, 0,8, 3,15, SK);  fill(img, 4,8, 7,15, HR);
  fill(img, 0,14, 3,15, SKS);
  // Left side
  fill(img, 20,8, 23,15, SK); fill(img, 16,8, 19,15, HR);
  fill(img, 20,14, 23,15, SKS);

  // Front face [8,8]-[15,15]
  fill(img, 8,8, 15,8, HR);                                          // y8: hairline
  px(img,8,9,HR); fill(img,9,9,14,9, SK); px(img,15,9,HR);          // y9: forehead
  // y10: kohl eyebrows
  px(img,8,10,SK); px(img,9,10,SK);
  fill(img,10,10,11,10,BROW); px(img,12,10,SK); fill(img,13,10,14,10,BROW);
  px(img,15,10,SK);
  // y11: eyes — kohl-rimmed, WHITE sclera, green iris
  px(img,8,11,SK); px(img,9,11,KOHL);
  px(img,10,11,EYE_W); px(img,11,11,EYE_I);
  px(img,12,11,SK);
  px(img,13,11,EYE_I); px(img,14,11,EYE_W);
  px(img,15,11,KOHL);
  // y12: lower eyes
  px(img,8,12,SK); px(img,9,12,KOHL);
  px(img,10,12,EYE_W); px(img,11,12,EYE_I);
  px(img,12,12,SK);
  px(img,13,12,EYE_I); px(img,14,12,EYE_W);
  px(img,15,12,KOHL);
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

  // ── HAT [32,0] [8,8,8] — purple veil ──
  paintBox(img, 32, 0, 8, 8, 8, { all: VEIL });
  // Top: gold diadem
  fill(img, 40,0, 47,0, GOLD);
  dither(img, 40,1, 47,7, VEIL, VEILD);
  // Front: gold diadem + transparent below for face
  fill(img, 40,8, 47,8, GOLD); fill(img, 40,9, 47,9, VEILD);
  clr(img, 41,10, 46,15);
  fill(img,40,10,40,11,VEIL); fill(img,47,10,47,11,VEIL);
  clr(img, 40,12, 40,15); clr(img, 47,12, 47,15);
  // Sides: gold diadem + veil, lower transparent
  fill(img, 32,8, 39,9, GOLD); fill(img, 32,10, 39,11, VEIL); clr(img, 32,12, 39,15);
  fill(img, 48,8, 55,9, GOLD); fill(img, 48,10, 55,11, VEIL); clr(img, 48,12, 55,15);
  // Back: full dark hair under veil
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

  // Right side [0,8]-[7,15]: hair on back half, skin on front
  fill(img, 0,8, 2,15, SK); fill(img, 3,8, 7,15, HRD);
  px(img,3,8,HR); px(img,4,8,HR);
  fill(img, 0,14, 2,15, SKS); // jaw shadow
  // Left side [16,8]-[23,15]
  fill(img, 21,8, 23,15, SK); fill(img, 16,8, 20,15, HRD);
  px(img,20,8,HR); px(img,19,8,HR);
  fill(img, 21,14, 23,15, SKS);

  // ═══ FRONT FACE [8,8]-[15,15] — THE VISIBLE FACE ═══
  // y8: thick copper hair fringe
  fill(img, 8,8, 15,8, HR);
  // y9: curly fringe with uneven edge + forehead visible
  px(img,8,9,HRD); px(img,9,9,HR); px(img,10,9,HRL);
  fill(img,11,9,12,9,SK);
  px(img,13,9,HRL); px(img,14,9,HR); px(img,15,9,HRD);
  // y10: eyebrows — clearly darker than skin
  px(img,8,10,SKS); px(img,9,10,SK);
  fill(img,10,10,11,10,BROW); px(img,12,10,SK); fill(img,13,10,14,10,BROW);
  px(img,15,10,SKS);
  // y11: eyes — PURE WHITE sclera + dark green iris (MAX CONTRAST)
  px(img,8,11,SK); px(img,9,11,SK);
  px(img,10,11,EYE_W); px(img,11,11,EYE_I);
  px(img,12,11,SK);
  px(img,13,11,EYE_I); px(img,14,11,EYE_W);
  px(img,15,11,SK);
  // y12: lower eyes — same pattern for 2-pixel tall eyes
  px(img,8,12,SK); px(img,9,12,SK);
  px(img,10,12,EYE_W); px(img,11,12,EYE_I);
  px(img,12,12,SK);
  px(img,13,12,EYE_I); px(img,14,12,EYE_W);
  px(img,15,12,SK);
  // y13: cheeks with blush + nose
  px(img,8,13,SK); px(img,9,13,ROSY);
  px(img,10,13,SK); fill(img,11,13,12,13,SKS); px(img,13,13,SK);
  px(img,14,13,ROSY); px(img,15,13,SK);
  // y14: lower nose + upper lip shadow
  fill(img,8,14,9,14,SK); px(img,10,14,SK);
  fill(img,11,14,12,14,SKS);
  px(img,13,14,SK); fill(img,14,14,15,14,SK);
  // y15: mouth — distinct red/pink
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
  paintBox(img, 0, 16, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  fill(img,4,25,7,25,TUND);
  fill(img,4,26,7,29,SK); fill(img,0,26,3,29,SKS);
  fill(img,8,26,11,29,SKS);
  fill(img,4,30,7,31,SAND); fill(img,0,30,3,31,SAND);
  fill(img,8,30,11,31,SAND);

  // ── LEFT LEG [16,48] [4,12,4] ──
  paintBox(img, 16, 48, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  fill(img,20,57,23,57,TUND);
  fill(img,20,58,23,61,SK); fill(img,16,58,19,61,SKS);
  fill(img,24,58,27,61,SKS);
  fill(img,20,62,23,62,SAND); fill(img,16,62,19,62,SAND);
  fill(img,24,62,27,62,SAND);
  fill(img,20,63,23,63,SANDD); fill(img,16,63,19,63,SANDD);

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

  // Palette
  const BRZ  = "#CD8B3A", BRZD = "#A07030", BRZL = "#E0A050", BRZDD = "#805820";
  const GOLD = "#D4A820", GOLDB = "#FFD700";
  const VISOR = "#080808", EYE_R = "#CC3300";
  const CHAIN = "#909090", CHAINL = "#B0B0B0", CHAIND = "#707070";
  const LEATH = "#6B3A1A", LEATHD = "#4A2A10";
  const WOOD = "#3A2010", WOODL = "#5A3820";

  // ── HEAD [0,0] [10,10,10] — bronze helmet ──
  paintBox(img, 0, 0, 10, 10, 10, {
    top: GOLD, bottom: BRZD, front: BRZ, back: BRZD,
    right: BRZD, left: BRZD
  });
  // Sides: reinforcement lines
  for (let y = 12; y <= 19; y += 3) fill(img,0,y,9,y,BRZDD);
  for (let y = 12; y <= 19; y += 3) fill(img,20,y,29,y,BRZDD);
  // Back: dark with lines
  fill(img,30,10,39,19,BRZD);
  for (let y = 13; y <= 19; y += 3) fill(img,30,y,39,y,BRZDD);

  // Front face [10,10]-[19,19]
  fill(img, 10,10, 19,10, BRZ);
  px(img,11,11,GOLD); fill(img,12,11,17,11,BRZ); px(img,18,11,GOLD);
  fill(img, 10,12, 19,12, BRZD);
  fill(img, 10,13, 19,13, VISOR);
  // Eyes in visor
  px(img,10,14,VISOR); px(img,11,14,EYE_R); px(img,12,14,EYE_R);
  fill(img,13,14,16,14,VISOR);
  px(img,17,14,EYE_R); px(img,18,14,EYE_R); px(img,19,14,VISOR);
  // Nasal guard
  fill(img,10,15,13,15,BRZ); fill(img,14,15,15,15,BRZD); fill(img,16,15,19,15,BRZ);
  fill(img,10,16,13,16,BRZ); fill(img,14,16,15,16,BRZD); fill(img,16,16,19,16,BRZ);
  px(img,11,17,GOLD); fill(img,12,17,17,17,BRZ); px(img,18,17,GOLD);
  fill(img, 10,18, 19,18, BRZ);
  fill(img, 10,19, 19,19, LEATH);

  // ── HAT [44,0] [11,11,11] — helmet overlay ──
  paintBox(img, 44, 0, 11, 11, 11, { all: BRZ });
  fill(img, 55,0, 65,0, GOLD);
  // Front visor cut-out
  fill(img, 55,11, 65,12, BRZ);
  fill(img, 55,13, 55,14, BRZ);
  clr(img, 56,13, 64,14);
  fill(img, 65,13, 65,14, BRZ);
  fill(img, 55,15, 65,21, BRZ);
  for (let y = 16; y <= 21; y += 3) fill(img,55,y,65,y,BRZD);
  // Sides & back reinforcement
  for (let y = 14; y <= 21; y += 3) {
    fill(img,44,y,54,y,BRZD);
    fill(img,66,y,76,y,BRZD);
  }
  fill(img, 66,0, 76,10, BRZD);

  // ── BODY [0,22] [10,14,5] — chainmail ──
  paintBox(img, 0, 22, 10, 14, 5, {
    front: CHAIN, back: CHAIND, top: BRZ, bottom: CHAIND,
    right: CHAIND, left: CHAIND
  });
  dither(img, 5,29, 14,40, CHAIN, CHAINL);
  fill(img, 5,27, 14,28, GOLD);
  fill(img, 5,33, 14,34, LEATH); px(img,9,33,GOLD); px(img,10,33,GOLD);
  fill(img, 0,33, 4,34, LEATH); fill(img, 15,33, 19,34, LEATH);
  fill(img, 20,33, 29,34, LEATH);

  // ── RIGHT ARM [40,22] [5,14,5] ──
  paintBox(img, 40, 22, 5, 14, 5, {
    front: CHAIN, back: CHAIND, top: BRZ,
    right: CHAIND, left: CHAIND, bottom: CHAIND
  });
  fill(img, 45,27, 49,28, GOLD);
  dither(img, 45,29, 49,38, CHAIN, CHAINL);
  fill(img, 45,39, 49,40, LEATH);

  // ── RIGHT LEG [60,22] [5,12,5] ──
  paintBox(img, 60, 22, 5, 12, 5, {
    front: BRZ, back: BRZD, top: CHAIN,
    right: BRZD, left: BRZD, bottom: LEATHD
  });
  dither(img, 65,27, 69,30, CHAIN, CHAINL);
  fill(img, 65,31, 69,32, LEATH);
  for (let y = 33; y <= 38; y += 2) fill(img,65,y,69,y,BRZD);

  // ── LEFT LEG [60,42] [5,12,5] ──
  paintBox(img, 60, 42, 5, 12, 5, {
    front: BRZ, back: BRZD, top: CHAIN,
    right: BRZD, left: BRZD, bottom: LEATHD
  });
  dither(img, 65,47, 69,50, CHAIN, CHAINL);
  fill(img, 65,51, 69,52, LEATH);
  for (let y = 53; y <= 58; y += 2) fill(img,65,y,69,y,BRZD);

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

Promise.all([genSamson(), genDalila(), genDavid(), genGoliath()])
  .then(() => console.log("\n✅ TODAS LAS TEXTURAS GENERADAS"))
  .catch(console.error);
