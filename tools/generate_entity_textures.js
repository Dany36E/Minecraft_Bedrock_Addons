// generate_entity_textures.js — UV-matched pixel-art textures
// UV box rule: for cube at uv:[U,V] with size:[W,H,D]:
//   Top:    (U+D,   V)       W×D
//   Bottom: (U+D+W, V)       W×D
//   Front:  (U+D,   V+D)     W×H
//   Back:   (U+D+W+D, V+D)   W×H
//   Left:   (U,     V+D)     D×H
//   Right:  (U+D+W, V+D)     D×H

const Jimp = require("jimp");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "..", "resource_pack", "textures", "entity");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ── Helpers ──
function hex(c) { return Jimp.cssColorToHex(c); }
function rect(img, x1, y1, x2, y2, c) {
  const cc = hex(c);
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      img.setPixelColor(cc, x, y);
}
function px(img, x, y, c) { img.setPixelColor(hex(c), x, y); }
function row(img, y, x1, cols) {
  for (let i = 0; i < cols.length; i++)
    img.setPixelColor(hex(cols[i]), x1 + i, y);
}
function chainmail(img, x1, y1, x2, y2, c1, c2) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      img.setPixelColor(hex((x + y) % 2 === 0 ? c1 : c2), x, y);
}
function paintFn(img, x1, y1, x2, y2, fn) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      img.setPixelColor(hex(fn(x, y)), x, y);
}
function clear(img, x1, y1, x2, y2) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      img.setPixelColor(0x00000000, x, y);
}

// ══════════════════════════════════════════════════════════
// SANSÓN — 64×64
// Hat overlay moved to uv[0,32], hairBack to uv[40,32]
// ══════════════════════════════════════════════════════════
async function generateSamson() {
  const img = new Jimp(64, 64, 0x00000000);
  const SKIN = "#6B3A2AFF", SKIN_LT = "#7A4530FF", SKIN_DK = "#5A2E1AFF";
  const HAIR = "#2C1505FF", HAIR_MED = "#4A2C0AFF", HAIR_ROOT = "#1A0800FF", HAIR_TIP = "#3A1F08FF";
  const TUNIC = "#D4B483FF", TUNIC_DK = "#C0A070FF", TUNIC_BORDER = "#B89050FF";
  const BELT = "#8B6914FF", BELT_DK = "#7A5A10FF", BUCKLE = "#C8A020FF";
  const SANDAL = "#8B4513FF", SANDAL_DK = "#7A3A0AFF";
  const WRIST = "#8B6914FF";

  // ─── HEAD (uv[0,0], size[8,8,8]) ───
  // Top: x=8..15,y=0..7 | Front: x=8..15,y=8..15 | Left: x=0..7,y=8..15
  // Right: x=16..23,y=8..15 | Back: x=24..31,y=8..15 | Bottom: x=16..23,y=0..7

  // HEAD TOP (x=8..15, y=0..7) — braided hair from above
  paintFn(img, 8, 0, 15, 7, (x) => x % 2 === 0 ? HAIR : HAIR_MED);

  // HEAD FRONT (x=8..15, y=8..15) — FACE
  row(img, 8,  8, [HAIR, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR]);
  row(img, 9,  8, [HAIR_MED, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR_MED]);
  row(img, 10, 8, [SKIN, SKIN, SKIN_DK, SKIN, SKIN, SKIN_DK, SKIN, SKIN]);
  row(img, 11, 8, [SKIN_LT, SKIN_LT, SKIN, SKIN_LT, SKIN_LT, SKIN, SKIN_LT, SKIN_LT]);
  row(img, 12, 8, [SKIN, "#FFFFFFFF", "#3A1A0AFF", SKIN, SKIN, "#3A1A0AFF", "#FFFFFFFF", SKIN]);
  row(img, 13, 8, [SKIN, SKIN_LT, SKIN, SKIN_DK, SKIN_DK, SKIN, SKIN_LT, SKIN]);
  row(img, 14, 8, [SKIN, SKIN, "#4A1A14FF", "#3A0E0AFF", "#3A0E0AFF", "#4A1A14FF", SKIN, SKIN]);
  row(img, 15, 8, [SKIN_DK, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN_DK]);

  // HEAD LEFT (x=0..7, y=8..15)
  rect(img, 0, 8, 2, 15, HAIR);
  rect(img, 3, 8, 7, 15, SKIN);
  rect(img, 3, 8, 7, 9, HAIR);

  // HEAD RIGHT (x=16..23, y=8..15)
  rect(img, 16, 8, 20, 15, SKIN);
  rect(img, 21, 8, 23, 15, HAIR);
  rect(img, 16, 8, 20, 9, HAIR);

  // HEAD BACK (x=24..31, y=8..15)
  rect(img, 24, 8, 31, 15, HAIR);
  for (let yy = 8; yy <= 15; yy++) {
    px(img, 25, yy, HAIR_MED); px(img, 27, yy, HAIR_MED);
    px(img, 29, yy, HAIR_MED); px(img, 31, yy, HAIR_MED);
  }

  // HEAD BOTTOM (x=16..23, y=0..7)
  rect(img, 16, 0, 23, 7, SKIN);

  // ─── HAT OVERLAY (uv[0,32], size[9,9,9]) ───
  // Width consumed: 2*(9+9)=36, from x=0..35
  // Height consumed: 9+9=18, from y=32..49
  // Top: x=9..17,y=32..40 | Front: x=9..17,y=41..49 | Left: x=0..8,y=41..49
  // Right: x=18..26,y=41..49 | Back: x=27..35,y=41..49
  for (let yy = 32; yy <= 49; yy++) {
    for (let xx = 0; xx <= 35; xx++) {
      const col = xx % 4;
      let c;
      if (yy <= 34) c = HAIR_ROOT;
      else if (yy >= 47) c = HAIR_TIP;
      else c = col < 2 ? HAIR : HAIR_MED;
      px(img, xx, yy, c);
    }
  }
  // Clear hat overlay front face so actual face shows through
  clear(img, 9, 41, 17, 49);

  // ─── BODY (uv[16,16], size[8,12,4]) ───
  // Top: x=20..27,y=16..19 | Front: x=20..27,y=20..31
  rect(img, 20, 16, 27, 19, TUNIC);
  rect(img, 28, 16, 35, 19, TUNIC);

  // Body front
  rect(img, 20, 20, 27, 31, TUNIC);
  row(img, 20, 20, [TUNIC, TUNIC, TUNIC, "#C8A96EFF", "#C8A96EFF", TUNIC, TUNIC, TUNIC]);
  row(img, 22, 20, [TUNIC_DK, TUNIC, TUNIC, TUNIC, TUNIC, TUNIC, TUNIC, TUNIC_DK]);
  rect(img, 20, 25, 27, 25, BELT);
  px(img, 23, 25, BUCKLE); px(img, 24, 25, BUCKLE);
  px(img, 20, 25, BELT_DK); px(img, 27, 25, BELT_DK);
  rect(img, 20, 31, 27, 31, TUNIC_BORDER);

  // Body sides
  rect(img, 16, 20, 19, 31, TUNIC); rect(img, 16, 25, 19, 25, BELT);
  rect(img, 28, 20, 31, 31, TUNIC); rect(img, 28, 25, 31, 25, BELT);
  // Body back
  rect(img, 32, 20, 39, 31, TUNIC); rect(img, 32, 25, 39, 25, BELT);
  rect(img, 32, 31, 39, 31, TUNIC_BORDER);

  // ─── RIGHT ARM (uv[40,16], size[4,12,4]) ───
  rect(img, 44, 16, 47, 19, TUNIC);
  rect(img, 40, 16, 43, 19, TUNIC);
  rect(img, 48, 16, 51, 19, TUNIC);
  rect(img, 52, 16, 55, 19, TUNIC);

  row(img, 20, 44, [TUNIC, TUNIC, TUNIC, TUNIC]);
  row(img, 21, 44, [TUNIC_DK, TUNIC_DK, TUNIC_DK, TUNIC_DK]);
  for (let yy = 22; yy <= 27; yy++) {
    const c = yy % 2 === 0 ? SKIN : SKIN_LT;
    row(img, yy, 44, [c, c, c, c]);
  }
  row(img, 28, 44, [WRIST, WRIST, WRIST, WRIST]);
  row(img, 29, 44, [SKIN, SKIN, SKIN, SKIN]);
  row(img, 30, 44, [SKIN_LT, SKIN_LT, SKIN_LT, SKIN_LT]);
  row(img, 31, 44, [SKIN_DK, SKIN_DK, SKIN_DK, SKIN_DK]);

  for (let yy = 20; yy <= 31; yy++) {
    const c = yy <= 21 ? TUNIC : (yy === 28 ? WRIST : SKIN);
    rect(img, 40, yy, 43, yy, c);
    rect(img, 48, yy, 51, yy, c);
    rect(img, 52, yy, 55, yy, c);
  }

  // ─── RIGHT LEG (uv[0,16], size[4,12,4]) ───
  rect(img, 4, 16, 7, 19, TUNIC);
  rect(img, 0, 16, 3, 19, TUNIC);
  rect(img, 8, 16, 11, 19, TUNIC);
  rect(img, 12, 16, 15, 19, TUNIC);

  for (let yy = 20; yy <= 31; yy++) {
    let c;
    if (yy <= 24) c = TUNIC_DK;
    else if (yy <= 29) c = SKIN;
    else c = SANDAL;
    rect(img, 4, yy, 7, yy, c);
    rect(img, 0, yy, 3, yy, c);
    rect(img, 8, yy, 11, yy, c);
    rect(img, 12, yy, 15, yy, c);
  }
  rect(img, 4, 30, 7, 30, SANDAL); rect(img, 4, 31, 7, 31, SANDAL_DK);
  rect(img, 0, 30, 3, 30, SANDAL); rect(img, 0, 31, 3, 31, SANDAL_DK);
  rect(img, 4, 25, 7, 25, SKIN_LT);

  // ─── LEFT LEG (uv[16,48], size[4,12,4]) ───
  rect(img, 20, 48, 23, 51, TUNIC);
  rect(img, 16, 48, 19, 51, TUNIC);
  rect(img, 24, 48, 27, 51, TUNIC);
  rect(img, 28, 48, 31, 51, TUNIC);
  for (let yy = 52; yy <= 63; yy++) {
    let c;
    if (yy <= 56) c = TUNIC_DK;
    else if (yy <= 61) c = SKIN;
    else c = SANDAL;
    rect(img, 20, yy, 23, yy, c);
    rect(img, 16, yy, 19, yy, c);
    rect(img, 24, yy, 27, yy, c);
    rect(img, 28, yy, 31, yy, c);
  }
  rect(img, 20, 62, 23, 62, SANDAL); rect(img, 20, 63, 23, 63, SANDAL_DK);
  rect(img, 20, 57, 23, 57, SKIN_LT);

  // ─── HAIR BONES ───
  // hairLeft uv[56,0], size[2,16,2]
  paintFn(img, 56, 0, 63, 19, (x, y) => (y % 3 < 2) ? HAIR : HAIR_MED);
  // hairRight uv[56,20], size[2,16,2]
  paintFn(img, 56, 20, 63, 39, (x, y) => (y % 3 < 2) ? HAIR : HAIR_MED);
  // hairBack uv[40,32], size[6,14,2] — moved from uv[40,48]
  // Width: 2*(2+6)=16 → x=40..55, Height: 2+14=16 → y=32..47
  paintFn(img, 40, 32, 55, 47, (x, y) => (x % 2 === 0) ? HAIR : HAIR_MED);

  await img.writeAsync(path.join(OUT, "samson.png"));
  console.log("  ✅ samson.png (64×64)");
}

// ══════════════════════════════════════════════════════════
// DALILA — 64×64
// Veil moved to uv[0,50], skirt size [9,12,3]
// ══════════════════════════════════════════════════════════
async function generateDalila() {
  const img = new Jimp(64, 64, 0x00000000);
  const SKIN = "#8B6347FF", SKIN_LT = "#9A7050FF", SKIN_DK = "#7A5030FF";
  const VEIL = "#7B3FA0FF", VEIL_DK = "#4A1A6BFF", VEIL_DKST = "#3D1A5CFF", VEIL_BOTTOM = "#2D1040FF";
  const GOLD = "#C8A020FF", GOLD_DK = "#A06020FF", GOLD_BUCKLE = "#A08010FF";
  const DRESS = "#4A1A6BFF", DRESS_DK = "#3D1A5CFF";
  const BLACK_HAIR = "#1A0A14FF";
  const COLLAR = "#8B0000FF";
  const LIPS = "#8B2A2AFF", LIPS_DK = "#6B1A1AFF";
  const KOHL = "#1A0A14FF";
  const IRIS = "#1A6B3AFF";

  // ─── HEAD (uv[0,0], size[8,8,8]) ───
  // Top (x=8..15, y=0..7)
  rect(img, 8, 0, 15, 7, BLACK_HAIR);

  // Front face (x=8..15, y=8..15)
  row(img, 8,  8, [VEIL, VEIL, VEIL, VEIL, VEIL, VEIL, VEIL, VEIL]);
  row(img, 9,  8, [VEIL, VEIL, VEIL, VEIL, VEIL, VEIL, VEIL, VEIL]);
  row(img, 10, 8, [GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD]);
  row(img, 11, 8, [SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN]);
  row(img, 12, 8, [SKIN, KOHL, "#FFFFFFFF", IRIS, IRIS, "#FFFFFFFF", KOHL, SKIN]);
  row(img, 13, 8, [SKIN, SKIN_LT, SKIN, SKIN_DK, SKIN_DK, SKIN, SKIN_LT, SKIN]);
  row(img, 14, 8, [SKIN, SKIN, LIPS, LIPS_DK, LIPS_DK, LIPS, SKIN, SKIN]);
  row(img, 15, 8, [SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN]);

  // Sides
  rect(img, 0, 8, 7, 15, BLACK_HAIR);
  rect(img, 3, 10, 7, 15, SKIN);
  rect(img, 16, 8, 23, 15, BLACK_HAIR);
  rect(img, 16, 10, 20, 15, SKIN);

  // Back
  rect(img, 24, 8, 31, 15, BLACK_HAIR);

  // Bottom
  rect(img, 16, 0, 23, 7, SKIN);

  // ─── VEIL (uv[0,50], size[9,5,9]) ───
  // Width: 2*(9+9)=36 → x=0..35, Height: 9+5=14 → y=50..63
  // Top: x=9..17,y=50..58 | Front: x=9..17,y=59..63 | Left: x=0..8,y=59..63
  rect(img, 0, 50, 35, 63, VEIL);
  rect(img, 0, 50, 35, 50, GOLD);
  rect(img, 0, 51, 35, 51, GOLD_DK);
  paintFn(img, 0, 52, 35, 61, (x) => x % 2 === 0 ? VEIL : VEIL_DK);
  rect(img, 0, 62, 35, 63, VEIL_DKST);
  // Clear front face of veil so face shows through
  clear(img, 9, 59, 17, 63);

  // ─── BODY (uv[16,16], size[8,12,4]) ───
  rect(img, 20, 16, 27, 19, DRESS); rect(img, 28, 16, 35, 19, DRESS);

  // Body front
  row(img, 20, 20, [COLLAR, COLLAR, COLLAR, COLLAR, COLLAR, COLLAR, COLLAR, COLLAR]);
  row(img, 21, 20, [GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD]);
  paintFn(img, 20, 22, 27, 24, (x) => x % 2 === 0 ? DRESS : DRESS_DK);
  row(img, 25, 20, [GOLD, GOLD, GOLD, GOLD_BUCKLE, GOLD_BUCKLE, GOLD, GOLD, GOLD]);
  paintFn(img, 20, 26, 27, 30, (x) => x % 2 === 0 ? DRESS : DRESS_DK);
  rect(img, 20, 31, 27, 31, VEIL_BOTTOM);

  // Body sides
  rect(img, 16, 20, 19, 31, DRESS); rect(img, 16, 25, 19, 25, GOLD);
  rect(img, 28, 20, 31, 31, DRESS); rect(img, 28, 25, 31, 25, GOLD);
  // Body back
  rect(img, 32, 20, 39, 31, DRESS); rect(img, 32, 25, 39, 25, GOLD);
  rect(img, 32, 31, 39, 31, VEIL_BOTTOM);

  // ─── ARMS SLIM (uv[40,16], size[3,12,4]) ───
  rect(img, 44, 16, 46, 19, DRESS);
  rect(img, 40, 16, 43, 19, DRESS);
  rect(img, 47, 16, 50, 19, DRESS);
  rect(img, 51, 16, 53, 19, DRESS);

  for (let yy = 20; yy <= 31; yy++) {
    let c;
    if (yy <= 23) c = DRESS;
    else if (yy === 24) c = GOLD;
    else if (yy === 29) c = GOLD;
    else if (yy >= 25) c = SKIN;
    rect(img, 44, yy, 46, yy, c);
    rect(img, 40, yy, 43, yy, c);
    rect(img, 47, yy, 50, yy, c);
    rect(img, 51, yy, 53, yy, c);
  }

  // ─── RIGHT LEG (uv[0,16], size[4,12,4]) ───
  rect(img, 4, 16, 7, 19, DRESS);
  rect(img, 0, 16, 3, 19, DRESS);
  rect(img, 8, 16, 11, 19, DRESS);
  rect(img, 12, 16, 15, 19, DRESS);
  for (let yy = 20; yy <= 31; yy++) {
    const c = yy <= 30 ? DRESS_DK : VEIL_BOTTOM;
    rect(img, 4, yy, 7, yy, c);
    rect(img, 0, yy, 3, yy, c);
    rect(img, 8, yy, 11, yy, c);
    rect(img, 12, yy, 15, yy, c);
  }

  // ─── LEFT LEG (uv[16,48], size[4,12,4]) ───
  rect(img, 20, 48, 23, 51, DRESS);
  rect(img, 16, 48, 19, 51, DRESS);
  rect(img, 24, 48, 27, 51, DRESS);
  rect(img, 28, 48, 31, 51, DRESS);
  for (let yy = 52; yy <= 63; yy++) {
    const c = yy <= 62 ? DRESS_DK : VEIL_BOTTOM;
    rect(img, 20, yy, 23, yy, c);
    rect(img, 16, yy, 19, yy, c);
    rect(img, 24, yy, 27, yy, c);
    rect(img, 28, yy, 31, yy, c);
  }

  // ─── SKIRT bone (uv[36,32], size[9,12,3]) ───
  // Width: 2*(3+9)=24 → x=36..59, Height: 3+12=15 → y=32..46
  paintFn(img, 36, 32, 59, 46, (x) => x % 2 === 0 ? DRESS_DK : VEIL_BOTTOM);
  rect(img, 36, 45, 59, 46, GOLD);

  await img.writeAsync(path.join(OUT, "dalila.png"));
  console.log("  ✅ dalila.png (64×64)");
}

// ══════════════════════════════════════════════════════════
// DAVID — 64×64
// No hat overlay, curlyHair at uv[0,32]
// ══════════════════════════════════════════════════════════
async function generateDavid() {
  const img = new Jimp(64, 64, 0x00000000);
  const SKIN = "#C8734AFF", SKIN_LT = "#D4835AFF", SKIN_DK = "#B86A40FF";
  const HAIR = "#C85A14FF", HAIR_DK = "#A04010FF";
  const TUNIC = "#D4A060FF", TUNIC_DK = "#C09050FF";
  const STRAP = "#8B6030FF", STRAP_DK = "#5A3A0AFF";
  const SANDAL = "#8B7355FF", SANDAL_DK = "#6B5A3AFF";
  const IRIS = "#2A6B5AFF";
  const LIP = "#C87060FF", LIP_DK = "#A05040FF";

  // ─── HEAD (uv[0,0], size[7,7,7]) ───
  // Top: x=7..13,y=0..6 | Front: x=7..13,y=7..13 | Left: x=0..6,y=7..13
  // Right: x=14..20,y=7..13 | Back: x=21..27,y=7..13 | Bottom: x=14..20,y=0..6

  // Top — curly hair
  paintFn(img, 7, 0, 13, 6, (x, y) => (x + y) % 3 < 2 ? HAIR : HAIR_DK);

  // Front face
  row(img, 7,  7, [HAIR, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR]);
  row(img, 8,  7, [HAIR_DK, HAIR, HAIR_DK, HAIR, HAIR_DK, HAIR, HAIR_DK]);
  row(img, 9,  7, [SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN]);
  row(img, 10, 7, [SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN]);
  row(img, 11, 7, [SKIN, "#FFFFFFFF", IRIS, SKIN, IRIS, "#FFFFFFFF", SKIN]);
  row(img, 12, 7, [SKIN, SKIN_LT, SKIN, SKIN_DK, SKIN, SKIN_LT, SKIN]);
  row(img, 13, 7, [SKIN_LT, SKIN, LIP, LIP_DK, LIP, SKIN, SKIN_LT]);

  // Left side
  rect(img, 0, 7, 6, 13, SKIN);
  rect(img, 0, 7, 6, 8, HAIR);
  rect(img, 0, 7, 1, 13, HAIR);

  // Right side
  rect(img, 14, 7, 20, 13, SKIN);
  rect(img, 14, 7, 20, 8, HAIR);
  rect(img, 19, 7, 20, 13, HAIR);

  // Back
  paintFn(img, 21, 7, 27, 13, (x, y) => (x + y) % 3 < 2 ? HAIR : HAIR_DK);

  // Bottom
  rect(img, 14, 0, 20, 6, SKIN);

  // ─── CURLY HAIR bone (uv[0,32], size[8,4,8]) ───
  // Width: 2*(8+8)=32 → x=0..31, Height: 8+4=12 → y=32..43
  paintFn(img, 0, 32, 31, 43, (x, y) => (x + y) % 3 < 2 ? HAIR : HAIR_DK);

  // ─── BODY (uv[16,16], size[8,12,4]) ───
  rect(img, 20, 16, 27, 19, TUNIC); rect(img, 28, 16, 35, 19, TUNIC);

  // Body front
  rect(img, 20, 20, 27, 31, TUNIC);
  row(img, 20, 20, [TUNIC, TUNIC, TUNIC, SKIN, SKIN, TUNIC, TUNIC, TUNIC]);
  for (let i = 0; i < 8; i++) {
    const sx = 22 + Math.floor(i * 0.7);
    const sy = 21 + i;
    if (sx <= 27 && sy <= 31) px(img, sx, sy, STRAP);
  }
  px(img, 24, 26, STRAP); px(img, 25, 26, STRAP); px(img, 24, 27, STRAP);
  rect(img, 20, 27, 27, 27, STRAP_DK);
  rect(img, 20, 28, 27, 31, TUNIC_DK);

  // Body sides
  rect(img, 16, 20, 19, 31, TUNIC); rect(img, 28, 20, 31, 31, TUNIC);
  // Body back
  rect(img, 32, 20, 39, 31, TUNIC); rect(img, 32, 31, 39, 31, TUNIC_DK);

  // ─── ARMS SLIM (uv[40,16], size[3,12,4]) ───
  rect(img, 44, 16, 46, 19, TUNIC);
  rect(img, 40, 16, 43, 19, TUNIC);
  rect(img, 47, 16, 50, 19, TUNIC);
  rect(img, 51, 16, 53, 19, TUNIC);

  for (let yy = 20; yy <= 31; yy++) {
    let c;
    if (yy <= 22) c = TUNIC;
    else if (yy === 29) c = STRAP;
    else c = SKIN;
    rect(img, 44, yy, 46, yy, c);
    rect(img, 40, yy, 43, yy, c);
    rect(img, 47, yy, 50, yy, c);
    rect(img, 51, yy, 53, yy, c);
  }

  // ─── RIGHT LEG (uv[0,16], size[4,12,4]) ───
  rect(img, 4, 16, 7, 19, TUNIC);
  rect(img, 0, 16, 3, 19, TUNIC);
  rect(img, 8, 16, 11, 19, TUNIC);
  rect(img, 12, 16, 15, 19, TUNIC);
  for (let yy = 20; yy <= 31; yy++) {
    let c;
    if (yy <= 25) c = TUNIC_DK;
    else if (yy <= 29) c = SKIN;
    else c = SANDAL;
    rect(img, 4, yy, 7, yy, c);
    rect(img, 0, yy, 3, yy, c);
    rect(img, 8, yy, 11, yy, c);
    rect(img, 12, yy, 15, yy, c);
  }
  rect(img, 4, 31, 7, 31, SANDAL_DK);
  rect(img, 0, 31, 3, 31, SANDAL_DK);

  // ─── LEFT LEG (uv[16,48], size[4,12,4]) ───
  rect(img, 20, 48, 23, 51, TUNIC);
  rect(img, 16, 48, 19, 51, TUNIC);
  rect(img, 24, 48, 27, 51, TUNIC);
  rect(img, 28, 48, 31, 51, TUNIC);
  for (let yy = 52; yy <= 63; yy++) {
    let c;
    if (yy <= 57) c = TUNIC_DK;
    else if (yy <= 61) c = SKIN;
    else c = SANDAL;
    rect(img, 20, yy, 23, yy, c);
    rect(img, 16, yy, 19, yy, c);
    rect(img, 24, yy, 27, yy, c);
    rect(img, 28, yy, 31, yy, c);
  }
  rect(img, 20, 63, 23, 63, SANDAL_DK);

  await img.writeAsync(path.join(OUT, "david.png"));
  console.log("  ✅ david.png (64×64)");
}

// ══════════════════════════════════════════════════════════
// GOLIÁT — 128×64
// body uv[0,22], arms uv[40,22], legs uv[60,22]/[60,40]
// crest uv[88,0], spear uv[94,0]
// ══════════════════════════════════════════════════════════
async function generateGoliath() {
  const img = new Jimp(128, 64, 0x00000000);
  const BRONZE = "#CD8B3AFF", BRONZE_DK = "#A07030FF", BRONZE_EDGE = "#8B5A14FF";
  const GOLD = "#C8A020FF", GOLD_DK = "#A08010FF";
  const LEATHER = "#6B3A1AFF", LEATHER_DK = "#4A2A10FF";
  const SLIT = "#1A1A1AFF";
  const EYE = "#4A2A10FF";
  const WOOD = "#2C1A0AFF", WOOD_LT = "#4A2C10FF";
  const CHIN = "#A0522DFF";

  // ─── HEAD (uv[0,0], size[10,10,10]) ───
  // Top: x=10..19,y=0..9 | Front: x=10..19,y=10..19 | Left: x=0..9,y=10..19
  // Right: x=20..29,y=10..19 | Back: x=30..39,y=10..19 | Bottom: x=20..29,y=0..9

  rect(img, 10, 0, 19, 9, BRONZE);
  rect(img, 14, 0, 15, 9, GOLD);

  // Front — helmet face
  row(img, 10, 10, [GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD]);
  row(img, 11, 10, [BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE]);
  row(img, 12, 10, [GOLD, SLIT, SLIT, EYE, SLIT, SLIT, SLIT, EYE, SLIT, GOLD]);
  row(img, 13, 10, [BRONZE, SLIT, SLIT, SLIT, SLIT, SLIT, SLIT, SLIT, SLIT, BRONZE]);
  row(img, 14, 10, [BRONZE, BRONZE, BRONZE, BRONZE, BRONZE_DK, BRONZE_DK, BRONZE, BRONZE, BRONZE, BRONZE]);
  row(img, 15, 10, [BRONZE, BRONZE, BRONZE_EDGE, BRONZE_EDGE, BRONZE_EDGE, BRONZE_EDGE, BRONZE_EDGE, BRONZE_EDGE, BRONZE, BRONZE]);
  rect(img, 10, 16, 19, 18, BRONZE);
  row(img, 16, 10, [BRONZE, BRONZE, BRONZE_DK, BRONZE_DK, BRONZE_DK, BRONZE_DK, BRONZE_DK, BRONZE_DK, BRONZE, BRONZE]);
  px(img, 10, 17, GOLD); px(img, 19, 17, GOLD);
  row(img, 19, 10, [LEATHER, LEATHER, LEATHER, LEATHER, LEATHER, LEATHER, LEATHER, LEATHER, LEATHER, LEATHER]);

  // Left side
  paintFn(img, 0, 10, 9, 19, (x, y) => y % 2 === 0 ? BRONZE : BRONZE_DK);
  px(img, 0, 12, GOLD); px(img, 0, 17, GOLD);

  // Right side
  paintFn(img, 20, 10, 29, 19, (x, y) => y % 2 === 0 ? BRONZE : BRONZE_DK);
  px(img, 29, 12, GOLD); px(img, 29, 17, GOLD);

  // Back
  rect(img, 30, 10, 39, 19, BRONZE);
  rect(img, 34, 10, 35, 19, BRONZE_DK);

  // Bottom
  rect(img, 20, 0, 29, 9, CHIN);

  // ─── HAT OVERLAY (uv[44,0], size[11,11,11]) ───
  // Width: 2*(11+11)=44 → x=44..87, Height: 11+11=22 → y=0..21
  rect(img, 44, 0, 87, 21, BRONZE);
  rect(img, 55, 0, 65, 10, GOLD);
  paintFn(img, 44, 11, 87, 21, (x, y) => y % 2 === 0 ? BRONZE : BRONZE_DK);
  // Clear front face so visor shows through
  // Front face: x=(44+11)..(44+11+11-1), y=(0+11)..(0+11+11-1) = x=55..65, y=11..21
  clear(img, 55, 11, 65, 21);

  // ─── BODY (uv[0,22], size[10,14,5]) ───
  // Width: 2*(5+10)=30 → x=0..29, Height: 5+14=19 → y=22..40
  // Top: x=5..14,y=22..26 | Front: x=5..14,y=27..40 | Left: x=0..4,y=27..40
  // Right: x=15..19,y=27..40 | Back: x=20..29,y=27..40 | Bottom: x=15..24,y=22..26
  rect(img, 5, 22, 14, 26, BRONZE);
  rect(img, 15, 22, 24, 26, BRONZE);

  paintFn(img, 5, 27, 14, 40, (x, y) => {
    if (y === 34) return LEATHER;
    const rx = (x - 5) % 2, ry = (y - 27) % 2;
    if (ry === 1) return BRONZE_DK;
    return rx === 0 ? BRONZE : BRONZE_EDGE;
  });
  px(img, 9, 34, GOLD); px(img, 10, 34, GOLD);
  rect(img, 5, 27, 14, 28, GOLD);

  paintFn(img, 0, 27, 4, 40, (x, y) => y === 34 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_DK));
  paintFn(img, 15, 27, 19, 40, (x, y) => y === 34 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_DK));
  paintFn(img, 20, 27, 29, 40, (x, y) => y === 34 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_DK));

  // ─── RIGHT ARM (uv[40,22], size[5,14,5]) ───
  // Width: 2*(5+5)=20 → x=40..59, Height: 5+14=19 → y=22..40
  // Top: x=45..49,y=22..26 | Front: x=45..49,y=27..40
  rect(img, 45, 22, 49, 26, GOLD);
  rect(img, 40, 22, 44, 26, GOLD);
  rect(img, 50, 22, 54, 26, GOLD);
  rect(img, 55, 22, 59, 26, GOLD);

  paintFn(img, 45, 27, 49, 40, (x, y) => {
    if (y === 27) return GOLD;
    if (y === 39) return LEATHER;
    return (y - 28) % 2 === 0 ? BRONZE : BRONZE_EDGE;
  });
  paintFn(img, 40, 27, 44, 40, (x, y) => y === 27 ? GOLD : (y === 39 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_EDGE)));
  paintFn(img, 50, 27, 54, 40, (x, y) => y === 27 ? GOLD : (y === 39 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_EDGE)));
  paintFn(img, 55, 27, 59, 40, (x, y) => y === 27 ? GOLD : (y === 39 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_EDGE)));

  // ─── RIGHT LEG (uv[60,22], size[5,12,5]) ───
  // Width: 2*(5+5)=20 → x=60..79, Height: 5+12=17 → y=22..38
  // Top: x=65..69,y=22..26 | Front: x=65..69,y=27..38
  rect(img, 65, 22, 69, 26, BRONZE);
  rect(img, 60, 22, 64, 26, BRONZE);
  rect(img, 70, 22, 74, 26, BRONZE);
  rect(img, 75, 22, 79, 26, BRONZE);

  paintFn(img, 65, 27, 69, 38, (x, y) => {
    if (y <= 30) return (y - 27) % 2 === 0 ? BRONZE : BRONZE_EDGE;
    if (y === 31) return LEATHER;
    if (y <= 36) return y % 2 === 0 ? BRONZE : BRONZE_DK;
    if (y === 37) return BRONZE_EDGE;
    return LEATHER_DK;
  });
  for (const [lx, rx] of [[60,64],[70,74],[75,79]]) {
    paintFn(img, lx, 27, rx, 38, (x, y) => {
      if (y <= 30) return (y - 27) % 2 === 0 ? BRONZE : BRONZE_EDGE;
      if (y === 31) return LEATHER;
      if (y <= 36) return y % 2 === 0 ? BRONZE : BRONZE_DK;
      if (y === 37) return BRONZE_EDGE;
      return LEATHER_DK;
    });
  }

  // ─── LEFT LEG (uv[60,40], size[5,12,5]) ───
  // Width: 2*(5+5)=20 → x=60..79, Height: 5+12=17 → y=40..56
  // Top: x=65..69,y=40..44 | Front: x=65..69,y=45..56
  rect(img, 65, 40, 69, 44, BRONZE);
  rect(img, 60, 40, 64, 44, BRONZE);
  rect(img, 70, 40, 74, 44, BRONZE);
  rect(img, 75, 40, 79, 44, BRONZE);

  paintFn(img, 65, 45, 69, 56, (x, y) => {
    if (y <= 48) return (y - 45) % 2 === 0 ? BRONZE : BRONZE_EDGE;
    if (y === 49) return LEATHER;
    if (y <= 54) return y % 2 === 0 ? BRONZE : BRONZE_DK;
    if (y === 55) return BRONZE_EDGE;
    return LEATHER_DK;
  });
  for (const [lx, rx] of [[60,64],[70,74],[75,79]]) {
    paintFn(img, lx, 45, rx, 56, (x, y) => {
      if (y <= 48) return (y - 45) % 2 === 0 ? BRONZE : BRONZE_EDGE;
      if (y === 49) return LEATHER;
      if (y <= 54) return y % 2 === 0 ? BRONZE : BRONZE_DK;
      if (y === 55) return BRONZE_EDGE;
      return LEATHER_DK;
    });
  }

  // ─── HELMET CREST (uv[88,0], size[2,8,1]) ───
  // Width: 2*(1+2)=6 → x=88..93, Height: 1+8=9 → y=0..8
  rect(img, 88, 0, 93, 8, GOLD);
  rect(img, 88, 0, 93, 0, GOLD_DK);

  // ─── SPEAR (uv[94,0], size[1,30,1]) ───
  // Width: 2*(1+1)=4 → x=94..97, Height: 1+30=31 → y=0..30
  rect(img, 94, 0, 97, 4, BRONZE);
  px(img, 95, 0, GOLD);
  rect(img, 94, 5, 97, 5, BRONZE_DK);
  rect(img, 94, 6, 97, 30, WOOD);
  for (let yy = 6; yy <= 30; yy++) {
    px(img, 95, yy, WOOD_LT);
  }

  await img.writeAsync(path.join(OUT, "goliath.png"));
  console.log("  ✅ goliath.png (128×64)");
}

// ══════════════════════════════════════════════════════════
console.log("Generando texturas de entidades (producción)...");
Promise.all([
  generateSamson(),
  generateDalila(),
  generateDavid(),
  generateGoliath()
]).then(() => {
  console.log("✅ Todas las texturas generadas en resource_pack/textures/entity/");
}).catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
