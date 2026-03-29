// generate_entity_textures.js — Production-quality pixel-art textures
// Paints every pixel individually following Minecraft's UV box layout.
// UV box rule: for cube at uv:[U,V] with size:[W,H,D]:
//   Front:  (U+D, V+D)     W×H
//   Back:   (U+D+W+D, V+D) W×H
//   Left:   (U, V+D)       D×H
//   Right:  (U+D+W, V+D)   D×H
//   Top:    (U+D, V)       W×D
//   Bottom: (U+D+W, V)     W×D

const Jimp = require("jimp");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "..", "resource_pack", "textures", "entity");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ── Helpers ──
function hex(str) { return Jimp.cssColorToHex(str); }
function px(img, x, y, c) { img.setPixelColor(hex(c), x, y); }
function fill(img, x1, y1, x2, y2, c) {
  const cc = hex(c);
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      img.setPixelColor(cc, x, y);
}
function row(img, y, x1, cols) {
  // cols = array of hex strings, one per pixel starting at x1
  for (let i = 0; i < cols.length; i++)
    img.setPixelColor(hex(cols[i]), x1 + i, y);
}

// Paint a rectangular region with a function (x,y) => hexColor
function paintFn(img, x1, y1, x2, y2, fn) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      img.setPixelColor(hex(fn(x, y)), x, y);
}

// ══════════════════════════════════════════════════════════
// SANSÓN — 64×64
// Israelita del Néguev, guerrero nazareo, 7 trenzas
// ══════════════════════════════════════════════════════════
async function generateSamson() {
  const img = new Jimp(64, 64, 0x00000000);
  const SKIN = "#6B3A2A", SKIN_LT = "#7A4530", SKIN_DK = "#5A2E1A";
  const HAIR = "#2C1505", HAIR_MED = "#4A2C0A", HAIR_ROOT = "#1A0800", HAIR_TIP = "#3A1F08";
  const TUNIC = "#D4B483", TUNIC_DK = "#C0A070", TUNIC_BORDER = "#B89050";
  const BELT = "#8B6914", BELT_DK = "#7A5A10", BUCKLE = "#C8A020";
  const SANDAL = "#8B4513", SANDAL_DK = "#7A3A0A";
  const WRIST = "#8B6914";

  // ─── HEAD (uv[0,0], size[8,8,8]) ───
  // Head UV layout: Top x=8..15,y=0..7 | Front x=8..15,y=8..15 | Left x=0..7,y=8..15
  //                 Right x=16..23,y=8..15 | Back x=24..31,y=8..15 | Bottom x=16..23,y=0..7

  // HEAD TOP (x=8..15, y=0..7) — braided hair from above
  paintFn(img, 8, 0, 15, 7, (x) => x % 2 === 0 ? HAIR : HAIR_MED);

  // HEAD FRONT (x=8..15, y=8..15) — FACE pixel by pixel
  row(img, 8,  8, [HAIR, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR]);
  row(img, 9,  8, [HAIR_MED, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR_MED]);
  row(img, 10, 8, [SKIN, SKIN, SKIN_DK, SKIN, SKIN, SKIN_DK, SKIN, SKIN]);
  row(img, 11, 8, [SKIN_LT, SKIN_LT, SKIN, SKIN_LT, SKIN_LT, SKIN, SKIN_LT, SKIN_LT]);
  // y=12 EYES
  row(img, 12, 8, [SKIN, "#3A2010", "#0A0800", "#4A2C14", "#4A2C14", "#0A0800", "#3A2010", SKIN]);
  // y=13 NOSE
  row(img, 13, 8, [SKIN, SKIN_LT, SKIN, SKIN_DK, SKIN_DK, SKIN, SKIN_LT, SKIN]);
  // y=14 MOUTH
  row(img, 14, 8, [SKIN, SKIN, "#4A1A14", "#3A0E0A", "#3A0E0A", "#4A1A14", SKIN, SKIN]);
  // y=15 CHIN
  row(img, 15, 8, [SKIN_DK, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN_DK]);

  // HEAD LEFT SIDE (x=0..7, y=8..15)
  fill(img, 0, 8, 2, 15, HAIR); // temple hair
  fill(img, 3, 8, 7, 15, SKIN);
  fill(img, 3, 8, 7, 9, HAIR); // hair covers top of side

  // HEAD RIGHT SIDE (x=16..23, y=8..15)
  fill(img, 16, 8, 20, 15, SKIN);
  fill(img, 21, 8, 23, 15, HAIR);
  fill(img, 16, 8, 20, 9, HAIR);

  // HEAD BACK (x=24..31, y=8..15) — braided back
  fill(img, 24, 8, 31, 15, HAIR);
  for (let yy = 8; yy <= 15; yy++) {
    px(img, 25, yy, HAIR_MED); px(img, 27, yy, HAIR_MED);
    px(img, 29, yy, HAIR_MED); px(img, 31, yy, HAIR_MED);
  }

  // HEAD BOTTOM (x=16..23, y=0..7) — chin underside
  fill(img, 16, 0, 23, 7, SKIN);

  // ─── HAT OVERLAY (uv[32,0], size[9,9,9]) — 7 braids falling ───
  // Consumes x=32..63, y=0..18
  for (let yy = 0; yy <= 18; yy++) {
    for (let xx = 32; xx <= 63; xx++) {
      const col = (xx - 32) % 4;
      let c;
      if (yy <= 2) c = HAIR_ROOT;
      else if (yy >= 16) c = HAIR_TIP;
      else c = col < 2 ? HAIR : HAIR_MED;
      px(img, xx, yy, c);
    }
  }

  // ─── BODY (uv[16,16], size[8,12,4]) ───
  // Front: x=20..27, y=20..31 | Left: x=16..19,y=20..31 | Right: x=28..31,y=20..31
  // Back: x=32..39,y=20..31 | Top: x=20..27,y=16..19 | Bottom: x=28..35,y=16..19

  // Body top
  fill(img, 20, 16, 27, 19, TUNIC);
  fill(img, 28, 16, 35, 19, TUNIC);

  // Body front (x=20..27, y=20..31)
  fill(img, 20, 20, 27, 31, TUNIC);
  row(img, 20, 20, [TUNIC, TUNIC, TUNIC, "#C8A96E", "#C8A96E", TUNIC, TUNIC, TUNIC]); // collar
  row(img, 21, 20, [TUNIC, TUNIC, TUNIC, TUNIC, TUNIC, TUNIC, TUNIC, TUNIC]);
  row(img, 22, 20, [TUNIC_DK, TUNIC, TUNIC, TUNIC, TUNIC, TUNIC, TUNIC, TUNIC_DK]);
  fill(img, 20, 25, 27, 25, BELT); // belt row
  px(img, 23, 25, BUCKLE); px(img, 24, 25, BUCKLE); // gold buckle
  px(img, 20, 25, BELT_DK); px(img, 27, 25, BELT_DK);
  fill(img, 20, 31, 27, 31, TUNIC_BORDER);

  // Body sides
  fill(img, 16, 20, 19, 31, TUNIC); fill(img, 16, 25, 19, 25, BELT);
  fill(img, 28, 20, 31, 31, TUNIC); fill(img, 28, 25, 31, 25, BELT);
  // Body back
  fill(img, 32, 20, 39, 31, TUNIC); fill(img, 32, 25, 39, 25, BELT);
  fill(img, 32, 31, 39, 31, TUNIC_BORDER);

  // ─── RIGHT ARM (uv[40,16], size[4,12,4]) ───
  // Front: x=44..47, y=20..31
  fill(img, 44, 16, 47, 19, TUNIC); // arm top
  fill(img, 40, 16, 43, 19, TUNIC); // side top
  fill(img, 48, 16, 51, 19, TUNIC); // side top
  fill(img, 52, 16, 55, 19, TUNIC); // back top

  // Arm front
  row(img, 20, 44, [TUNIC, TUNIC, TUNIC, TUNIC]); // shoulder
  row(img, 21, 44, [TUNIC_DK, TUNIC_DK, TUNIC_DK, TUNIC_DK]);
  for (let yy = 22; yy <= 27; yy++) {
    const c = yy % 2 === 0 ? SKIN : SKIN_LT;
    row(img, yy, 44, [c, c, c, c]);
  }
  row(img, 28, 44, [WRIST, WRIST, WRIST, WRIST]); // leather wristband
  row(img, 29, 44, [SKIN, SKIN, SKIN, SKIN]);
  row(img, 30, 44, [SKIN_LT, SKIN_LT, SKIN_LT, SKIN_LT]); // knuckles
  row(img, 31, 44, [SKIN_DK, SKIN_DK, SKIN_DK, SKIN_DK]);

  // Arm sides/back — bare skin
  for (let yy = 20; yy <= 31; yy++) {
    const c = yy <= 21 ? TUNIC : (yy === 28 ? WRIST : SKIN);
    fill(img, 40, yy, 43, yy, c);
    fill(img, 48, yy, 51, yy, c);
    fill(img, 52, yy, 55, yy, c);
  }

  // ─── RIGHT LEG (uv[0,16], size[4,12,4]) ───
  // Top: x=4..7,y=16..19 | Front: x=4..7,y=20..31
  fill(img, 4, 16, 7, 19, TUNIC);
  fill(img, 0, 16, 3, 19, TUNIC);
  fill(img, 8, 16, 11, 19, TUNIC);
  fill(img, 12, 16, 15, 19, TUNIC);

  // Leg front
  for (let yy = 20; yy <= 31; yy++) {
    let c;
    if (yy <= 24) c = TUNIC_DK; // tunic covers thigh
    else if (yy <= 29) c = SKIN; // bare calf
    else c = SANDAL; // sandals
    fill(img, 4, yy, 7, yy, c);
    fill(img, 0, yy, 3, yy, c); // left side
    fill(img, 8, yy, 11, yy, c); // right side
    fill(img, 12, yy, 15, yy, c); // back
  }
  fill(img, 4, 30, 7, 30, SANDAL); fill(img, 4, 31, 7, 31, SANDAL_DK);
  fill(img, 0, 30, 3, 30, SANDAL); fill(img, 0, 31, 3, 31, SANDAL_DK);
  fill(img, 8, 30, 11, 30, SANDAL); fill(img, 8, 31, 11, 31, SANDAL_DK);
  fill(img, 12, 30, 15, 30, SANDAL); fill(img, 12, 31, 15, 31, SANDAL_DK);
  // Exposed knee
  fill(img, 4, 25, 7, 25, SKIN_LT);
  fill(img, 0, 25, 3, 25, SKIN_LT);
  fill(img, 8, 25, 11, 25, SKIN_LT);

  // ─── LEFT LEG (uv[16,48], size[4,12,4]) ───
  // Top: x=20..23,y=48..51 | Front: x=20..23,y=52..63
  fill(img, 20, 48, 23, 51, TUNIC);
  fill(img, 16, 48, 19, 51, TUNIC);
  fill(img, 24, 48, 27, 51, TUNIC);
  fill(img, 28, 48, 31, 51, TUNIC);
  for (let yy = 52; yy <= 63; yy++) {
    let c;
    if (yy <= 56) c = TUNIC_DK;
    else if (yy <= 61) c = SKIN;
    else c = SANDAL;
    fill(img, 20, yy, 23, yy, c);
    fill(img, 16, yy, 19, yy, c);
    fill(img, 24, yy, 27, yy, c);
    fill(img, 28, yy, 31, yy, c);
  }
  fill(img, 20, 62, 23, 62, SANDAL); fill(img, 20, 63, 23, 63, SANDAL_DK);
  fill(img, 20, 57, 23, 57, SKIN_LT); // knee

  // ─── HAIR BONES ───
  // hairLeft uv[56,0], size[2,16,2] → consumes x=58..61,y=2..17 front, etc.
  // Fill entire hair region with braid pattern
  paintFn(img, 56, 0, 63, 19, (x, y) =>
    (y % 3 < 2) ? HAIR : HAIR_MED
  );
  // hairRight uv[56,20], size[2,16,2]
  paintFn(img, 56, 20, 63, 39, (x, y) =>
    (y % 3 < 2) ? HAIR : HAIR_MED
  );
  // hairBack uv[40,48], size[6,14,2]
  paintFn(img, 40, 48, 55, 63, (x, y) =>
    (x % 2 === 0) ? HAIR : HAIR_MED
  );

  await img.writeAsync(path.join(OUT, "samson.png"));
  console.log("  ✅ samson.png (64×64)");
}

// ══════════════════════════════════════════════════════════
// DALILA — 64×64
// Filistea del valle de Sorec, vestido púrpura, kohl
// ══════════════════════════════════════════════════════════
async function generateDalila() {
  const img = new Jimp(64, 64, 0x00000000);
  const SKIN = "#8B6347", SKIN_LT = "#9A7050", SKIN_DK = "#7A5030";
  const VEIL = "#7B3FA0", VEIL_DK = "#4A1A6B", VEIL_DKST = "#3D1A5C", VEIL_BOTTOM = "#2D1040";
  const GOLD = "#C8A020", GOLD_DK = "#A06020", GOLD_BUCKLE = "#A08010";
  const DRESS = "#4A1A6B", DRESS_DK = "#3D1A5C";
  const BLACK_HAIR = "#1A0A14";
  const COLLAR = "#8B0000";
  const LIPS = "#8B2A2A", LIPS_DK = "#6B1A1A";
  const KOHL = "#1A0A14";
  const IRIS = "#1A6B3A", IRIS_DK = "#2A1A3A";

  // ─── HEAD (uv[0,0], size[8,8,8]) ───
  // Top (x=8..15, y=0..7) — dark hair under veil
  fill(img, 8, 0, 15, 7, BLACK_HAIR);

  // Front face (x=8..15, y=8..15)
  row(img, 8,  8, [VEIL, VEIL, VEIL, VEIL, VEIL, VEIL, VEIL, VEIL]);
  row(img, 9,  8, [VEIL, VEIL, VEIL, VEIL, VEIL, VEIL, VEIL, VEIL]);
  row(img, 10, 8, [GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD]); // diadem
  row(img, 11, 8, [SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN]); // forehead
  // y=12 EYES with kohl
  row(img, 12, 8, [SKIN, KOHL, IRIS_DK, IRIS, IRIS, IRIS_DK, KOHL, SKIN]);
  // y=13 NOSE
  row(img, 13, 8, [SKIN, SKIN_LT, SKIN, SKIN_DK, SKIN_DK, SKIN, SKIN_LT, SKIN]);
  // y=14 PAINTED LIPS
  row(img, 14, 8, [SKIN, SKIN, LIPS, LIPS_DK, LIPS_DK, LIPS, SKIN, SKIN]);
  // y=15 CHIN
  row(img, 15, 8, [SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN]);

  // Sides (x=0..7 left, x=16..23 right)
  fill(img, 0, 8, 7, 15, BLACK_HAIR);
  fill(img, 3, 10, 7, 15, SKIN); // skin visible on sides
  fill(img, 16, 8, 23, 15, BLACK_HAIR);
  fill(img, 16, 10, 20, 15, SKIN);
  // Apply shadow at edges
  fill(img, 0, 8, 1, 15, SKIN_DK); fill(img, 2, 8, 2, 15, BLACK_HAIR);
  fill(img, 22, 8, 23, 15, SKIN_DK); fill(img, 21, 8, 21, 15, BLACK_HAIR);

  // Back (x=24..31, y=8..15) — black hair
  fill(img, 24, 8, 31, 15, BLACK_HAIR);

  // Bottom (x=16..23, y=0..7)
  fill(img, 16, 0, 23, 7, SKIN);

  // ─── VEIL (uv[0,48], size[9,5,9]) — dedicated bone ───
  // Consumes (0..27, 48..62) approx — fill decoratively
  fill(img, 0, 48, 35, 62, VEIL);
  fill(img, 0, 48, 35, 48, GOLD); // gold border top
  fill(img, 0, 49, 35, 49, GOLD_DK);
  // Stripe pattern on veil
  paintFn(img, 0, 50, 35, 60, (x) => x % 2 === 0 ? VEIL : VEIL_DK);
  fill(img, 0, 61, 35, 62, VEIL_DKST); // darker bottom

  // ─── BODY (uv[16,16], size[8,12,4]) ───
  fill(img, 20, 16, 27, 19, DRESS); fill(img, 28, 16, 35, 19, DRESS);

  // Body front (x=20..27, y=20..31)
  row(img, 20, 20, [COLLAR, COLLAR, COLLAR, COLLAR, COLLAR, COLLAR, COLLAR, COLLAR]);
  row(img, 21, 20, [GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD]);
  // Dress with fold pattern
  paintFn(img, 20, 22, 27, 24, (x) => x % 2 === 0 ? DRESS : DRESS_DK);
  // Gold belt
  row(img, 25, 20, [GOLD, GOLD, GOLD, GOLD_BUCKLE, GOLD_BUCKLE, GOLD, GOLD, GOLD]);
  // Lower dress with folds
  paintFn(img, 20, 26, 27, 30, (x) => x % 2 === 0 ? DRESS : DRESS_DK);
  fill(img, 20, 31, 27, 31, VEIL_BOTTOM); // hem

  // Body sides
  fill(img, 16, 20, 19, 31, DRESS); fill(img, 16, 25, 19, 25, GOLD);
  fill(img, 28, 20, 31, 31, DRESS); fill(img, 28, 25, 31, 25, GOLD);
  // Body back
  fill(img, 32, 20, 39, 31, DRESS); fill(img, 32, 25, 39, 25, GOLD);
  fill(img, 32, 31, 39, 31, VEIL_BOTTOM);

  // ─── ARMS SLIM (uv[40,16], size[3,12,4]) ───
  // Front: x=44..46, y=20..31 (3 wide)
  fill(img, 44, 16, 46, 19, DRESS);
  fill(img, 40, 16, 43, 19, DRESS);
  fill(img, 47, 16, 50, 19, DRESS);
  fill(img, 51, 16, 53, 19, DRESS);

  for (let yy = 20; yy <= 31; yy++) {
    let c;
    if (yy <= 23) c = DRESS; // sleeve to elbow
    else if (yy === 24) c = GOLD; // gold bracelet
    else if (yy === 29) c = GOLD; // ring
    else if (yy >= 25) c = SKIN; // bare forearm
    fill(img, 44, yy, 46, yy, c); // front
    fill(img, 40, yy, 43, yy, c); // left side
    fill(img, 47, yy, 50, yy, c); // right side
    fill(img, 51, yy, 53, yy, c); // back
  }

  // ─── RIGHT LEG (uv[0,16], size[4,12,4]) ───
  fill(img, 4, 16, 7, 19, DRESS);
  fill(img, 0, 16, 3, 19, DRESS);
  fill(img, 8, 16, 11, 19, DRESS);
  fill(img, 12, 16, 15, 19, DRESS);
  for (let yy = 20; yy <= 31; yy++) {
    const c = yy <= 30 ? DRESS_DK : VEIL_BOTTOM;
    fill(img, 4, yy, 7, yy, c);
    fill(img, 0, yy, 3, yy, c);
    fill(img, 8, yy, 11, yy, c);
    fill(img, 12, yy, 15, yy, c);
  }

  // ─── LEFT LEG (uv[16,48], size[4,12,4]) ───
  fill(img, 20, 48, 23, 51, DRESS);
  fill(img, 16, 48, 19, 51, DRESS);
  fill(img, 24, 48, 27, 51, DRESS);
  fill(img, 28, 48, 31, 51, DRESS);
  for (let yy = 52; yy <= 63; yy++) {
    const c = yy <= 62 ? DRESS_DK : VEIL_BOTTOM;
    fill(img, 20, yy, 23, yy, c);
    fill(img, 16, yy, 19, yy, c);
    fill(img, 24, yy, 27, yy, c);
    fill(img, 28, yy, 31, yy, c);
  }

  // ─── SKIRT bone (uv[36,32], size[9,12,5]) ───
  // Consumes (36..64, 32..49) approx
  paintFn(img, 36, 32, 63, 49, (x) => x % 2 === 0 ? DRESS_DK : VEIL_BOTTOM);
  fill(img, 36, 48, 63, 49, GOLD); // gold hem

  await img.writeAsync(path.join(OUT, "dalila.png"));
  console.log("  ✅ dalila.png (64×64)");
}

// ══════════════════════════════════════════════════════════
// DAVID — 64×64
// Joven pastor pelirrojo, hermosos ojos, túnica simple
// ══════════════════════════════════════════════════════════
async function generateDavid() {
  const img = new Jimp(64, 64, 0x00000000);
  const SKIN = "#C8734A", SKIN_LT = "#D4835A", SKIN_DK = "#B86A40";
  const HAIR = "#C85A14", HAIR_DK = "#A04010";
  const TUNIC = "#D4A060", TUNIC_DK = "#C09050";
  const STRAP = "#8B6030", STRAP_DK = "#5A3A0A";
  const SANDAL = "#8B7355", SANDAL_DK = "#6B5A3A";
  const EYE_WHITE = "#E8E0D0", IRIS = "#2A6B5A", PUPIL = "#1A4A3A";
  const BROW = "#5A3A10";
  const LIP = "#C87060", LIP_DK = "#A05040";

  // ─── HEAD (uv[0,0], size[7,7,7]) ───
  // For 7×7×7: Top x=7..13,y=0..6 | Front x=7..13,y=7..13 | Left x=0..6,y=7..13
  //            Right x=14..20,y=7..13 | Back x=21..27,y=7..13 | Bottom x=14..20,y=0..6

  // Top — curly hair
  paintFn(img, 7, 0, 13, 6, (x, y) => (x + y) % 3 < 2 ? HAIR : HAIR_DK);

  // Front face (x=7..13, y=7..13)
  row(img, 7,  7, [HAIR, HAIR, HAIR, HAIR, HAIR, HAIR, HAIR]);
  row(img, 8,  7, [HAIR_DK, HAIR, HAIR_DK, HAIR, HAIR_DK, HAIR, HAIR_DK]);
  row(img, 9,  7, [SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN]); // forehead
  row(img, 10, 7, [SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN]);
  // y=11 EYES — "hermosos ojos" green-blue
  row(img, 11, 7, [SKIN, BROW, EYE_WHITE, IRIS, PUPIL, EYE_WHITE, BROW]);
  // y=12 NOSE
  row(img, 12, 7, [SKIN, SKIN_LT, SKIN, SKIN_DK, SKIN, SKIN_LT, SKIN]);
  // y=13 MOUTH (young, no beard, rosy)
  row(img, 13, 7, [SKIN_LT, SKIN, LIP, LIP_DK, LIP, SKIN, SKIN_LT]);

  // Left side (x=0..6, y=7..13) — hair + skin
  fill(img, 0, 7, 6, 13, SKIN);
  fill(img, 0, 7, 6, 8, HAIR); // hair over top portion
  fill(img, 0, 7, 1, 13, HAIR); // hair sideburn

  // Right side (x=14..20, y=7..13)
  fill(img, 14, 7, 20, 13, SKIN);
  fill(img, 14, 7, 20, 8, HAIR);
  fill(img, 19, 7, 20, 13, HAIR);

  // Back (x=21..27, y=7..13)
  paintFn(img, 21, 7, 27, 13, (x, y) => (x + y) % 3 < 2 ? HAIR : HAIR_DK);

  // Bottom (x=14..20, y=0..6)
  fill(img, 14, 0, 20, 6, SKIN);

  // ─── HAT / HEAD OVERLAY (uv[32,0], size[8,8,8]) ───
  // Curly hair overlay
  paintFn(img, 32, 0, 63, 15, (x, y) => (x + y) % 4 < 2 ? HAIR : HAIR_DK);

  // ─── CURLY HAIR bone (uv[0,48], size[8,4,8]) ───
  // Consumes (0..24, 48..60) approx
  paintFn(img, 0, 48, 31, 59, (x, y) => (x + y) % 3 < 2 ? HAIR : HAIR_DK);

  // ─── BODY (uv[16,16], size[8,12,4]) ───
  fill(img, 20, 16, 27, 19, TUNIC); fill(img, 28, 16, 35, 19, TUNIC);

  // Body front (x=20..27, y=20..31)
  fill(img, 20, 20, 27, 31, TUNIC);
  // Neckline
  row(img, 20, 20, [TUNIC, TUNIC, TUNIC, SKIN, SKIN, TUNIC, TUNIC, TUNIC]);
  // Shepherd bag strap diagonal
  for (let i = 0; i < 8; i++) {
    const sx = 22 + Math.floor(i * 0.7);
    const sy = 21 + i;
    if (sx <= 27 && sy <= 31) px(img, sx, sy, STRAP);
  }
  // Bag
  px(img, 24, 26, STRAP); px(img, 25, 26, STRAP); px(img, 24, 27, STRAP);
  // Thin rope belt
  fill(img, 20, 27, 27, 27, STRAP_DK);
  // Lower tunic slightly darker
  fill(img, 20, 28, 27, 31, TUNIC_DK);

  // Body sides
  fill(img, 16, 20, 19, 31, TUNIC); fill(img, 28, 20, 31, 31, TUNIC);
  // Body back
  fill(img, 32, 20, 39, 31, TUNIC); fill(img, 32, 31, 39, 31, TUNIC_DK);

  // ─── ARMS SLIM (uv[40,16], size[3,12,4]) ───
  fill(img, 44, 16, 46, 19, TUNIC);
  fill(img, 40, 16, 43, 19, TUNIC);
  fill(img, 47, 16, 50, 19, TUNIC);
  fill(img, 51, 16, 53, 19, TUNIC);

  for (let yy = 20; yy <= 31; yy++) {
    let c;
    if (yy <= 22) c = TUNIC; // short sleeve
    else if (yy === 29) c = STRAP; // sling cord on wrist
    else c = SKIN; // young bare arm
    fill(img, 44, yy, 46, yy, c);
    fill(img, 40, yy, 43, yy, c);
    fill(img, 47, yy, 50, yy, c);
    fill(img, 51, yy, 53, yy, c);
  }

  // ─── RIGHT LEG (uv[0,16], size[4,12,4]) ───
  fill(img, 4, 16, 7, 19, TUNIC);
  fill(img, 0, 16, 3, 19, TUNIC);
  fill(img, 8, 16, 11, 19, TUNIC);
  fill(img, 12, 16, 15, 19, TUNIC);
  for (let yy = 20; yy <= 31; yy++) {
    let c;
    if (yy <= 25) c = TUNIC_DK; // tunic to knee
    else if (yy <= 29) c = SKIN; // bare leg
    else c = SANDAL;
    fill(img, 4, yy, 7, yy, c);
    fill(img, 0, yy, 3, yy, c);
    fill(img, 8, yy, 11, yy, c);
    fill(img, 12, yy, 15, yy, c);
  }
  fill(img, 4, 31, 7, 31, SANDAL_DK);
  fill(img, 0, 31, 3, 31, SANDAL_DK);

  // ─── LEFT LEG (uv[16,48], size[4,12,4]) ───
  fill(img, 20, 48, 23, 51, TUNIC);
  fill(img, 16, 48, 19, 51, TUNIC);
  fill(img, 24, 48, 27, 51, TUNIC);
  fill(img, 28, 48, 31, 51, TUNIC);
  for (let yy = 52; yy <= 63; yy++) {
    let c;
    if (yy <= 57) c = TUNIC_DK;
    else if (yy <= 61) c = SKIN;
    else c = SANDAL;
    fill(img, 20, yy, 23, yy, c);
    fill(img, 16, yy, 19, yy, c);
    fill(img, 24, yy, 27, yy, c);
    fill(img, 28, yy, 31, yy, c);
  }
  fill(img, 20, 63, 23, 63, SANDAL_DK);

  await img.writeAsync(path.join(OUT, "david.png"));
  console.log("  ✅ david.png (64×64)");
}

// ══════════════════════════════════════════════════════════
// GOLIÁT — 128×64
// Guerrero filisteo gigante, armadura de bronce completa
// ══════════════════════════════════════════════════════════
async function generateGoliath() {
  const img = new Jimp(128, 64, 0x00000000);
  const BRONZE = "#CD8B3A", BRONZE_DK = "#A07030", BRONZE_EDGE = "#8B5A14";
  const GOLD = "#C8A020", GOLD_DK = "#A08010";
  const LEATHER = "#6B3A1A", LEATHER_DK = "#4A2A10";
  const SLIT = "#1A1A1A";
  const EYE = "#4A2A10";
  const WOOD = "#2C1A0A", WOOD_LT = "#4A2C10";
  const CHIN = "#A0522D";

  // ─── HEAD (uv[0,0], size[10,10,10]) ───
  // Top: x=10..19,y=0..9 | Front: x=10..19,y=10..19 | Left: x=0..9,y=10..19
  // Right: x=20..29,y=10..19 | Back: x=30..39,y=10..19 | Bottom: x=20..29,y=0..9

  // Top — helmet with crest ridge
  fill(img, 10, 0, 19, 9, BRONZE);
  fill(img, 14, 0, 15, 9, GOLD); // crest ridge on top

  // Front — helmet face (x=10..19, y=10..19)
  row(img, 10, 10, [GOLD,   GOLD,   GOLD,   GOLD,   GOLD,   GOLD,   GOLD,   GOLD,   GOLD,   GOLD]);
  row(img, 11, 10, [BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE, BRONZE]);
  // y=12..13 visor slit
  row(img, 12, 10, [GOLD,  SLIT,   SLIT,   EYE,    SLIT,   SLIT,   SLIT,   EYE,    SLIT,   GOLD]);
  row(img, 13, 10, [BRONZE,SLIT,   SLIT,   SLIT,   SLIT,   SLIT,   SLIT,   SLIT,   SLIT,   BRONZE]);
  row(img, 14, 10, [BRONZE,BRONZE, BRONZE, BRONZE, BRONZE_DK,BRONZE_DK,BRONZE,BRONZE,BRONZE,BRONZE]);
  row(img, 15, 10, [BRONZE,BRONZE, BRONZE_EDGE, BRONZE_EDGE, BRONZE_EDGE, BRONZE_EDGE, BRONZE_EDGE, BRONZE_EDGE, BRONZE, BRONZE]);
  // Lower helmet
  fill(img, 10, 16, 19, 18, BRONZE);
  row(img, 16, 10, [BRONZE, BRONZE, BRONZE_DK, BRONZE_DK, BRONZE_DK, BRONZE_DK, BRONZE_DK, BRONZE_DK, BRONZE, BRONZE]);
  // Rivets
  px(img, 10, 17, GOLD); px(img, 19, 17, GOLD);
  row(img, 19, 10, [LEATHER,LEATHER,LEATHER,LEATHER,LEATHER,LEATHER,LEATHER,LEATHER,LEATHER,LEATHER]); // chin strap

  // Left side (x=0..9, y=10..19)
  fill(img, 0, 10, 9, 19, BRONZE);
  paintFn(img, 0, 10, 9, 19, (x, y) => y % 2 === 0 ? BRONZE : BRONZE_DK);
  px(img, 0, 12, GOLD); px(img, 0, 17, GOLD); // rivets

  // Right side (x=20..29, y=10..19)
  fill(img, 20, 10, 29, 19, BRONZE);
  paintFn(img, 20, 10, 29, 19, (x, y) => y % 2 === 0 ? BRONZE : BRONZE_DK);
  px(img, 29, 12, GOLD); px(img, 29, 17, GOLD);

  // Back (x=30..39, y=10..19)
  fill(img, 30, 10, 39, 19, BRONZE);
  fill(img, 34, 10, 35, 19, BRONZE_DK); // back ridge

  // Bottom (x=20..29, y=0..9) — skin under helmet
  fill(img, 20, 0, 29, 9, CHIN);

  // ─── HAT OVERLAY (uv[44,0], size[11,11,11]) ───
  // Consumes x=55..87, y=0..22 approx — fill with helmet overlay
  fill(img, 44, 0, 109, 21, BRONZE);
  fill(img, 55, 0, 65, 10, GOLD); // crest on overlay top
  paintFn(img, 44, 11, 109, 21, (x, y) => y % 2 === 0 ? BRONZE : BRONZE_DK);

  // ─── BODY (uv[32,16], size[10,12,5]) ───
  // Front: x=37..46, y=21..32

  // Top
  fill(img, 37, 16, 46, 20, BRONZE);
  fill(img, 47, 16, 56, 20, BRONZE);

  // Body front — scale mail pattern
  paintFn(img, 37, 21, 46, 32, (x, y) => {
    if (y === 27) return LEATHER; // belt
    const rx = (x - 37) % 2, ry = (y - 21) % 2;
    if (ry === 1) return BRONZE_DK; // scale border row
    return rx === 0 ? BRONZE : BRONZE_EDGE; // scale pattern
  });
  // Gold buckle
  px(img, 41, 27, GOLD); px(img, 42, 27, GOLD);
  // Golden shoulders
  fill(img, 37, 21, 46, 22, GOLD);

  // Body sides
  paintFn(img, 32, 21, 36, 32, (x, y) => y === 27 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_DK));
  paintFn(img, 47, 21, 51, 32, (x, y) => y === 27 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_DK));
  // Body back
  paintFn(img, 52, 21, 61, 32, (x, y) => y === 27 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_DK));

  // ─── RIGHT ARM (uv[80,16], size[5,13,5]) ───
  // Top: x=85..89,y=16..20 | Front: x=85..89,y=21..33
  fill(img, 85, 16, 89, 20, GOLD); // shoulder pad gold
  fill(img, 80, 16, 84, 20, GOLD);
  fill(img, 90, 16, 94, 20, GOLD);
  fill(img, 95, 16, 99, 20, GOLD);

  // Arm front — scale mail
  paintFn(img, 85, 21, 89, 33, (x, y) => {
    if (y === 21) return GOLD; // shoulder
    if (y === 32) return LEATHER; // wrist guard
    const ry = (y - 22) % 2;
    return ry === 0 ? BRONZE : BRONZE_EDGE;
  });
  // Arm sides
  paintFn(img, 80, 21, 84, 33, (x, y) => y === 21 ? GOLD : (y === 32 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_EDGE)));
  paintFn(img, 90, 21, 94, 33, (x, y) => y === 21 ? GOLD : (y === 32 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_EDGE)));
  paintFn(img, 95, 21, 99, 33, (x, y) => y === 21 ? GOLD : (y === 32 ? LEATHER : (y % 2 === 0 ? BRONZE : BRONZE_EDGE)));

  // ─── RIGHT LEG (uv[0,32], size[5,12,5]) ───
  // Top: x=5..9,y=32..36 | Front: x=5..9,y=37..48
  fill(img, 5, 32, 9, 36, BRONZE);
  fill(img, 0, 32, 4, 36, BRONZE);
  fill(img, 10, 32, 14, 36, BRONZE);
  fill(img, 15, 32, 19, 36, BRONZE);

  // Leg front
  paintFn(img, 5, 37, 9, 48, (x, y) => {
    if (y <= 40) { // scale mail thigh
      const ry = (y - 37) % 2;
      return ry === 0 ? BRONZE : BRONZE_EDGE;
    }
    if (y === 41) return LEATHER; // knee strap
    if (y <= 46) return y % 2 === 0 ? BRONZE : BRONZE_DK; // solid greave
    if (y === 47) return BRONZE_EDGE; // ankle
    return LEATHER_DK; // sandal
  });
  // Leg sides/back
  for (const [lx, rx] of [[0,4],[10,14],[15,19]]) {
    paintFn(img, lx, 37, rx, 48, (x, y) => {
      if (y <= 40) return y % 2 === 0 ? BRONZE : BRONZE_EDGE;
      if (y === 41) return LEATHER;
      if (y <= 46) return y % 2 === 0 ? BRONZE : BRONZE_DK;
      if (y === 47) return BRONZE_EDGE;
      return LEATHER_DK;
    });
  }

  // ─── LEFT LEG (uv[30,32], size[5,12,5]) ───
  fill(img, 35, 32, 39, 36, BRONZE);
  fill(img, 30, 32, 34, 36, BRONZE);
  fill(img, 40, 32, 44, 36, BRONZE);
  fill(img, 45, 32, 49, 36, BRONZE);

  paintFn(img, 35, 37, 39, 48, (x, y) => {
    if (y <= 40) return (y - 37) % 2 === 0 ? BRONZE : BRONZE_EDGE;
    if (y === 41) return LEATHER;
    if (y <= 46) return y % 2 === 0 ? BRONZE : BRONZE_DK;
    if (y === 47) return BRONZE_EDGE;
    return LEATHER_DK;
  });
  for (const [lx, rx] of [[30,34],[40,44],[45,49]]) {
    paintFn(img, lx, 37, rx, 48, (x, y) => {
      if (y <= 40) return (y - 37) % 2 === 0 ? BRONZE : BRONZE_EDGE;
      if (y === 41) return LEATHER;
      if (y <= 46) return y % 2 === 0 ? BRONZE : BRONZE_DK;
      if (y === 47) return BRONZE_EDGE;
      return LEATHER_DK;
    });
  }

  // ─── HELMET CREST (uv[110,0], size[2,8,1]) ───
  // Consumes (110..114, 0..9)
  fill(img, 110, 0, 115, 9, GOLD);
  fill(img, 110, 0, 115, 0, GOLD_DK); // tip shadow

  // ─── SPEAR (uv[116,0], size[1,30,1]) ───
  // Consumes (116..119, 0..31)
  fill(img, 116, 0, 119, 4, BRONZE); // bronze tip
  px(img, 117, 0, GOLD); // golden point
  fill(img, 116, 5, 119, 5, BRONZE_DK); // transition
  fill(img, 116, 6, 119, 31, WOOD); // wooden shaft
  // Wood grain
  for (let yy = 6; yy <= 31; yy++) {
    px(img, 117, yy, WOOD_LT);
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
