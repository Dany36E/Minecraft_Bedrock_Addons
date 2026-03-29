const Jimp = require("jimp");
const path = require("path");
const OUT = path.join(__dirname, "..", "resource_pack", "textures", "entity");

// ── Helpers ────────────────────────────────────────────
function hex(c) { return Jimp.cssColorToHex(c.length === 7 ? c + "FF" : c); }

function fill(img, x1, y1, x2, y2, c) {
  const h = hex(c);
  for (let x = x1; x <= x2; x++)
    for (let y = y1; y <= y2; y++)
      img.setPixelColor(h, x, y);
}

// Paint all 6 faces of a box UV region.
// UV [U,V], size [W,H,D].
// colors: { top, bottom, right, front, left, back, all }
// Returns face rects for further detailing.
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

// ════════════════════════════════════════════════════════
// SANSÓN — 64×64
// UV layout (verified non-overlapping):
//   head      [0,0]   8,8,8  → [0,0]-[31,15]
//   hat       [32,0]  8,8,8  → [32,0]-[63,15]
//   rightLeg  [0,16]  4,12,4 → [0,16]-[15,31]
//   body      [16,16] 8,12,4 → [16,16]-[39,31]
//   rightArm  [40,16] 4,12,4 → [40,16]-[55,31]
//   hairLeft  [56,16] 2,16,2 → [56,16]-[63,33]
//   hairBack  [0,34]  6,12,2 → [0,34]-[15,47]
//   hairRight [48,34] 2,14,2 → [48,34]-[55,49]
//   leftLeg   [16,48] 4,12,4 → [16,48]-[31,63]
//   leftArm   [32,48] 4,12,4 → [32,48]-[47,63]
// ════════════════════════════════════════════════════════
async function genSamson() {
  const img = new Jimp(64, 64, 0x00000000);
  const SKIN    = "#7A4530";
  const SKIN_S  = "#5A3020";
  const HAIR    = "#1A0A00";
  const HAIR_L  = "#3A2A10";
  const TUNIC   = "#D4B483";
  const TUNIC_S = "#B09060";
  const BELT    = "#8B6914";
  const GOLD    = "#C8A020";
  const SANDAL  = "#6B3A1A";

  // ── HEAD [0,0] [8,8,8] ──
  paintBox(img, 0, 0, 8, 8, 8, {
    all: SKIN, top: HAIR, bottom: SKIN_S, back: HAIR
  });
  // Forehead hair (top 2 rows of front face)
  fill(img, 8, 8, 15, 9, HAIR);
  // Temple hair on right side face (back edge 2px)
  fill(img, 6, 8, 7, 15, HAIR);
  // Temple hair on left side face (back edge 2px)
  fill(img, 16, 8, 17, 15, HAIR);
  // Eyes 2×2
  fill(img, 10, 10, 11, 11, "#1A0800");
  fill(img, 12, 10, 13, 11, "#1A0800");
  // Nose shadow
  fill(img, 11, 12, 12, 12, SKIN_S);
  // Mouth
  fill(img, 10, 13, 13, 13, "#4A1A14");
  // Beard (lower face)
  fill(img, 9, 14, 14, 15, "#2A1A04");

  // ── HAT [32,0] [8,8,8] — braids overlay ──
  paintBox(img, 32, 0, 8, 8, 8, { all: HAIR });
  for (let x = 34; x <= 62; x += 4) fill(img, x, 0, x + 1, 15, HAIR_L);
  fill(img, 32, 13, 63, 15, "#4A3A20");

  // ── BODY [16,16] [8,12,4] ──
  paintBox(img, 16, 16, 8, 12, 4, {
    all: TUNIC, top: TUNIC_S, bottom: TUNIC_S, right: TUNIC_S, left: TUNIC_S
  });
  // Belt across front + sides + back
  fill(img, 20, 24, 27, 25, BELT);
  fill(img, 23, 24, 24, 24, GOLD);
  fill(img, 16, 24, 19, 25, BELT);
  fill(img, 28, 24, 31, 25, BELT);
  fill(img, 32, 24, 39, 25, BELT);
  // Neckline
  fill(img, 20, 20, 27, 21, TUNIC_S);
  // Hem
  fill(img, 20, 30, 27, 31, TUNIC_S);

  // ── RIGHT ARM [40,16] [4,12,4] ──
  paintBox(img, 40, 16, 4, 12, 4, { all: SKIN });
  fill(img, 44, 20, 47, 21, TUNIC); // shoulder
  fill(img, 40, 20, 43, 21, TUNIC); // side shoulder
  fill(img, 48, 20, 51, 21, TUNIC);
  fill(img, 44, 28, 47, 29, BELT);  // wristband

  // ── LEFT ARM [32,48] [4,12,4] ──
  paintBox(img, 32, 48, 4, 12, 4, { all: SKIN });
  fill(img, 36, 52, 39, 53, TUNIC);
  fill(img, 32, 52, 35, 53, TUNIC);
  fill(img, 40, 52, 43, 53, TUNIC);
  fill(img, 36, 60, 39, 61, BELT);

  // ── RIGHT LEG [0,16] [4,12,4] ──
  paintBox(img, 0, 16, 4, 12, 4, { all: TUNIC });
  fill(img, 4, 26, 7, 29, SKIN);   // exposed leg
  fill(img, 0, 26, 3, 29, SKIN_S); // side
  fill(img, 4, 30, 7, 31, SANDAL);
  fill(img, 0, 30, 3, 31, SANDAL);

  // ── LEFT LEG [16,48] [4,12,4] ──
  paintBox(img, 16, 48, 4, 12, 4, { all: TUNIC });
  fill(img, 20, 58, 23, 61, SKIN);
  fill(img, 16, 58, 19, 61, SKIN_S);
  fill(img, 20, 62, 23, 63, SANDAL);
  fill(img, 16, 62, 19, 63, SANDAL);

  // ── HAIR LEFT [56,16] [2,16,2] ──
  paintBox(img, 56, 16, 2, 16, 2, { all: HAIR });
  for (let y = 20; y <= 33; y += 4) fill(img, 58, y, 59, y + 1, HAIR_L);

  // ── HAIR BACK [0,34] [6,12,2] ──
  paintBox(img, 0, 34, 6, 12, 2, { all: HAIR });
  for (let x = 4; x <= 7; x += 4) fill(img, x, 36, x + 1, 47, HAIR_L);

  // ── HAIR RIGHT [48,34] [2,14,2] ──
  paintBox(img, 48, 34, 2, 14, 2, { all: HAIR });
  for (let y = 38; y <= 49; y += 4) fill(img, 50, y, 51, y + 1, HAIR_L);

  await img.writeAsync(path.join(OUT, "samson.png"));
  console.log("✅ samson.png (64×64)");
}

// ════════════════════════════════════════════════════════
// DALILA — 64×64
// UV layout (verified non-overlapping):
//   head      [0,0]   8,8,8  → [0,0]-[31,15]
//   hat       [32,0]  8,8,8  → [32,0]-[63,15]
//   rightLeg  [0,16]  4,12,4 → [0,16]-[15,31]
//   body      [16,16] 8,12,4 → [16,16]-[39,31]
//   rightArm  [40,16] 3,12,4 → [40,16]-[53,31]
//   veil      [0,32]  8,4,8  → [0,32]-[31,43]
//   skirt     [32,32] 8,12,3 → [32,32]-[53,46]
//   leftLeg   [16,48] 4,12,4 → [16,48]-[31,63]
//   leftArm   [32,48] 3,12,4 → [32,48]-[45,63]
// ════════════════════════════════════════════════════════
async function genDalila() {
  const img = new Jimp(64, 64, 0x00000000);
  const SKIN    = "#B8896A";
  const SKIN_S  = "#987050";
  const HAIR    = "#1A0A14";
  const DRESS   = "#4A1A6B";
  const DRESS_D = "#3D1A5C";
  const GOLD    = "#C8A020";
  const VEIL    = "#7B3FA0";
  const LIPS    = "#8B3030";

  // ── HEAD [0,0] [8,8,8] ──
  paintBox(img, 0, 0, 8, 8, 8, {
    all: SKIN, top: HAIR, bottom: SKIN_S, back: HAIR
  });
  // Hair sides
  fill(img, 0, 8, 1, 15, HAIR);
  fill(img, 22, 8, 23, 15, HAIR);
  // Veil line on forehead (2px)
  fill(img, 8, 8, 15, 9, VEIL);
  // Diadema gold
  fill(img, 8, 10, 15, 11, GOLD);
  // Kohl eyes 2×2
  fill(img, 9, 12, 10, 13, "#0A0A14");
  fill(img, 13, 12, 14, 13, "#0A0A14");
  // Green iris inside eyes
  fill(img, 10, 12, 10, 13, "#1A6B3A");
  fill(img, 13, 12, 13, 13, "#1A6B3A");
  // Lips
  fill(img, 10, 14, 13, 15, LIPS);

  // ── HAT [32,0] [8,8,8] — veil/headcovering ──
  paintBox(img, 32, 0, 8, 8, 8, { all: VEIL });
  fill(img, 32, 0, 63, 1, GOLD);     // gold upper border
  fill(img, 32, 14, 63, 15, DRESS_D); // dark lower border
  // Back portion shows black hair under veil
  fill(img, 56, 8, 63, 15, HAIR);

  // ── BODY [16,16] [8,12,4] — purple dress ──
  paintBox(img, 16, 16, 8, 12, 4, {
    all: DRESS, right: DRESS_D, left: DRESS_D
  });
  // Collar (red)
  fill(img, 20, 20, 27, 21, "#8B0000");
  // Gold accent
  fill(img, 20, 22, 27, 23, GOLD);
  // Gold belt
  fill(img, 20, 24, 27, 25, GOLD);
  // Pleat shadows
  for (let y = 26; y <= 30; y += 4) fill(img, 20, y, 27, y + 1, DRESS_D);
  // Hem
  fill(img, 20, 31, 27, 31, "#2D1040");
  // Side belts
  fill(img, 16, 24, 19, 25, GOLD);
  fill(img, 28, 24, 31, 25, GOLD);

  // ── RIGHT ARM [40,16] [3,12,4] — slim ──
  paintBox(img, 40, 16, 3, 12, 4, { all: SKIN });
  // Sleeve (top 4px of front)
  fill(img, 44, 20, 46, 23, DRESS);
  fill(img, 40, 20, 43, 23, DRESS);
  // Bracelet
  fill(img, 44, 24, 46, 25, GOLD);

  // ── LEFT ARM [32,48] [3,12,4] — slim ──
  paintBox(img, 32, 48, 3, 12, 4, { all: SKIN });
  fill(img, 36, 52, 38, 55, DRESS);
  fill(img, 32, 52, 35, 55, DRESS);
  fill(img, 36, 56, 38, 57, GOLD);

  // ── RIGHT LEG [0,16] [4,12,4] — covered by dress ──
  paintBox(img, 0, 16, 4, 12, 4, { all: DRESS });
  fill(img, 4, 31, 7, 31, GOLD);    // gold trim at bottom

  // ── LEFT LEG [16,48] [4,12,4] ──
  paintBox(img, 16, 48, 4, 12, 4, { all: DRESS });
  fill(img, 20, 63, 23, 63, GOLD);

  // ── VEIL BONE [0,32] [8,4,8] ──
  paintBox(img, 0, 32, 8, 4, 8, { all: VEIL });
  fill(img, 8, 32, 15, 33, GOLD);  // gold stripe on top face
  fill(img, 8, 40, 15, 43, DRESS_D); // darker front bottom

  // ── SKIRT BONE [32,32] [8,12,3] ──
  paintBox(img, 32, 32, 8, 12, 3, { all: DRESS_D });
  // Pleat bands across front (front: x=35..42, y=35..46)
  for (let y = 37; y <= 46; y += 4) fill(img, 35, y, 42, y + 1, "#2D1040");
  // Gold trim at bottom of front
  fill(img, 35, 45, 42, 46, GOLD);

  await img.writeAsync(path.join(OUT, "dalila.png"));
  console.log("✅ dalila.png (64×64)");
}

// ════════════════════════════════════════════════════════
// DAVID — 64×64
// UV layout (verified non-overlapping):
//   head      [0,0]   8,8,8  → [0,0]-[31,15]
//   hat       [32,0]  8,8,8  → [32,0]-[63,15]
//   rightLeg  [0,16]  4,12,4 → [0,16]-[15,31]
//   body      [16,16] 8,12,4 → [16,16]-[39,31]
//   rightArm  [40,16] 3,12,4 → [40,16]-[53,31]
//   curlyHair [0,32]  8,4,8  → [0,32]-[31,43]
//   leftLeg   [16,48] 4,12,4 → [16,48]-[31,63]
//   leftArm   [32,48] 3,12,4 → [32,48]-[45,63]
// ════════════════════════════════════════════════════════
async function genDavid() {
  const img = new Jimp(64, 64, 0x00000000);
  const SKIN    = "#D4845A";
  const SKIN_S  = "#B06A40";
  const HAIR    = "#C85A14";
  const HAIR_D  = "#A04010";
  const TUNIC   = "#C09050";
  const TUNIC_S = "#A07840";
  const ROPE    = "#5A3A0A";
  const SLING   = "#8B6030";
  const SANDAL  = "#8B4513";

  // ── HEAD [0,0] [8,8,8] ──
  paintBox(img, 0, 0, 8, 8, 8, {
    all: SKIN, top: HAIR, bottom: SKIN_S, back: HAIR_D
  });
  // Copper hair on forehead
  fill(img, 8, 8, 15, 9, HAIR);
  // Temple hair (sides)
  fill(img, 0, 8, 1, 15, HAIR);
  fill(img, 22, 8, 23, 15, HAIR);
  // Big green eyes 2×2 (young David)
  fill(img, 10, 10, 11, 11, "#E8E0D0"); // left eye white
  fill(img, 12, 10, 13, 11, "#E8E0D0"); // right eye white
  fill(img, 10, 11, 11, 11, "#2A6B5A");  // left iris
  fill(img, 13, 11, 13, 11, "#2A6B5A");  // right iris
  // Rosy cheeks
  fill(img, 8, 13, 9, 13, "#E0906A");
  fill(img, 14, 13, 15, 13, "#E0906A");
  // Youthful mouth
  fill(img, 10, 14, 13, 14, "#C87060");

  // ── HAT [32,0] [8,8,8] — copper curls overlay ──
  paintBox(img, 32, 0, 8, 8, 8, { all: HAIR });
  // 2×2 curl pattern (alternating for texture without moiré)
  for (let bx = 32; bx <= 62; bx += 4)
    for (let by = 0; by <= 14; by += 4)
      fill(img, bx, by, bx + 1, by + 1, HAIR_D);

  // ── BODY [16,16] [8,12,4] — simple shepherd tunic ──
  paintBox(img, 16, 16, 8, 12, 4, {
    all: TUNIC, right: TUNIC_S, left: TUNIC_S
  });
  // Sling strap diagonal
  fill(img, 20, 22, 21, 31, SLING);
  fill(img, 22, 25, 27, 26, SLING);
  // Rope belt
  fill(img, 20, 26, 27, 27, ROPE);
  // Hem
  fill(img, 20, 31, 27, 31, TUNIC_S);

  // ── RIGHT ARM [40,16] [3,12,4] — slim, young ──
  paintBox(img, 40, 16, 3, 12, 4, { all: SKIN });
  fill(img, 44, 20, 46, 21, TUNIC); // short sleeve
  fill(img, 40, 20, 43, 21, TUNIC);
  fill(img, 44, 28, 46, 29, SLING); // sling on wrist

  // ── LEFT ARM [32,48] [3,12,4] ──
  paintBox(img, 32, 48, 3, 12, 4, { all: SKIN });
  fill(img, 36, 52, 38, 53, TUNIC);
  fill(img, 32, 52, 35, 53, TUNIC);
  fill(img, 36, 60, 38, 61, SLING);

  // ── RIGHT LEG [0,16] [4,12,4] ──
  paintBox(img, 0, 16, 4, 12, 4, { all: TUNIC });
  fill(img, 4, 26, 7, 29, SKIN);   // exposed knee
  fill(img, 0, 26, 3, 29, SKIN_S);
  fill(img, 4, 30, 7, 31, SANDAL);
  fill(img, 0, 30, 3, 31, SANDAL);

  // ── LEFT LEG [16,48] [4,12,4] ──
  paintBox(img, 16, 48, 4, 12, 4, { all: TUNIC });
  fill(img, 20, 58, 23, 61, SKIN);
  fill(img, 16, 58, 19, 61, SKIN_S);
  fill(img, 20, 62, 23, 63, SANDAL);
  fill(img, 16, 62, 19, 63, SANDAL);

  // ── CURLY HAIR [0,32] [8,4,8] ──
  paintBox(img, 0, 32, 8, 4, 8, { all: HAIR });
  // Curl highlights (2×2 blocks)
  for (let bx = 8; bx <= 15; bx += 4)
    for (let by = 40; by <= 43; by += 4)
      fill(img, bx, by, bx + 1, by + 1, HAIR_D);

  await img.writeAsync(path.join(OUT, "david.png"));
  console.log("✅ david.png (64×64)");
}

// ════════════════════════════════════════════════════════
// GOLIÁT — 128×64
// UV layout (verified non-overlapping):
//   head      [0,0]   10,10,10 → [0,0]-[39,19]
//   hat       [44,0]  11,11,11 → [44,0]-[87,21]
//   body      [0,22]  10,14,5  → [0,22]-[29,40]
//   rightArm  [40,22] 5,14,5   → [40,22]-[59,40]
//   leftArm   [40,22] mirror   → same UV
//   rightLeg  [60,22] 5,12,5   → [60,22]-[79,38]
//   leftLeg   [60,42] 5,12,5   → [60,42]-[79,58]
//   crest     [88,0]  2,8,1    → [88,0]-[93,8]
//   spear     [94,0]  1,28,1   → [94,0]-[97,28]
// ════════════════════════════════════════════════════════
async function genGoliath() {
  const img = new Jimp(128, 64, 0x00000000);
  const BRONZE   = "#CD8B3A";
  const BRONZE_D = "#A07030";
  const BRONZE_L = "#E0A050";
  const GOLD     = "#C8A020";
  const VISOR    = "#0A0A0A";
  const CHAIN    = "#8B8B8B";
  const CHAIN_L  = "#A0A0A0";
  const LEATHER  = "#6B3A1A";
  const WOOD     = "#3A2010";

  // ── HEAD [0,0] [10,10,10] — bronze helmet ──
  paintBox(img, 0, 0, 10, 10, 10, {
    all: BRONZE, top: GOLD, bottom: BRONZE_D
  });
  // Visor slit (black band across front: x=10..19, y=13..14)
  fill(img, 10, 13, 19, 14, VISOR);
  // Eyes glinting in visor
  fill(img, 11, 13, 12, 14, "#3A1A08");
  fill(img, 17, 13, 18, 14, "#3A1A08");
  // Nasal guard
  fill(img, 14, 15, 15, 17, BRONZE_D);
  // Chin strap
  fill(img, 10, 19, 19, 19, LEATHER);
  // Rivets 2×2
  fill(img, 10, 11, 11, 12, GOLD);
  fill(img, 18, 11, 19, 12, GOLD);
  fill(img, 10, 17, 11, 18, GOLD);
  fill(img, 18, 17, 19, 18, GOLD);
  // Side shadow bands
  for (let y = 10; y <= 19; y += 4) {
    fill(img, 0, y, 9, y + 1, BRONZE_D);
    fill(img, 20, y, 29, y + 1, BRONZE_D);
  }
  // Back of helmet (darker)
  fill(img, 30, 10, 39, 19, BRONZE_D);

  // ── HAT [44,0] [11,11,11] — helmet overlay ──
  paintBox(img, 44, 0, 11, 11, 11, { all: BRONZE });
  // Visor slit on overlay (front: x=55..65, y=11..21)
  fill(img, 55, 14, 65, 15, VISOR);
  // Gold crest stripe
  fill(img, 44, 0, 87, 1, GOLD);

  // ── BODY [0,22] [10,14,5] — chainmail ──
  paintBox(img, 0, 22, 10, 14, 5, {
    all: CHAIN, right: BRONZE_D, left: BRONZE_D
  });
  // Chainmail 2×2 pattern on front (x=5..14, y=27..40)
  for (let bx = 5; bx <= 13; bx += 4)
    for (let by = 27; by <= 39; by += 4) {
      fill(img, bx, by, bx + 1, by + 1, CHAIN_L);
      fill(img, bx + 2, by + 2, bx + 3, by + 3, CHAIN_L);
    }
  // Shoulder plates
  fill(img, 5, 27, 14, 28, GOLD);
  // Belt
  fill(img, 5, 33, 14, 34, LEATHER);
  fill(img, 9, 33, 10, 34, GOLD);

  // ── RIGHT ARM [40,22] [5,14,5] — chainmail sleeve ──
  paintBox(img, 40, 22, 5, 14, 5, {
    all: CHAIN, right: BRONZE_D, left: BRONZE_D
  });
  // Chainmail pattern on front (x=45..49, y=27..40)
  for (let bx = 45; bx <= 48; bx += 4)
    for (let by = 27; by <= 39; by += 4) {
      fill(img, bx, by, bx + 1, by + 1, CHAIN_L);
      fill(img, bx + 2, by + 2, bx + 3, by + 3, CHAIN_L);
    }
  // Shoulder plate
  fill(img, 45, 27, 49, 28, GOLD);
  // Gauntlet
  fill(img, 45, 38, 49, 39, LEATHER);

  // ── RIGHT LEG [60,22] [5,12,5] — greaves ──
  paintBox(img, 60, 22, 5, 12, 5, {
    all: BRONZE, right: BRONZE_D, left: BRONZE_D
  });
  // Thigh chainmail (top of front: x=65..69, y=27..31)
  for (let bx = 65; bx <= 68; bx += 4)
    for (let by = 27; by <= 31; by += 4) {
      fill(img, bx, by, bx + 1, by + 1, CHAIN_L);
    }
  // Knee plate
  fill(img, 65, 32, 69, 33, LEATHER);
  // Greave reinforcement lines
  for (let y = 34; y <= 38; y += 2) fill(img, 65, y, 69, y, BRONZE_D);

  // ── LEFT LEG [60,42] [5,12,5] ──
  paintBox(img, 60, 42, 5, 12, 5, {
    all: BRONZE, right: BRONZE_D, left: BRONZE_D
  });
  for (let bx = 65; bx <= 68; bx += 4)
    for (let by = 47; by <= 51; by += 4) {
      fill(img, bx, by, bx + 1, by + 1, CHAIN_L);
    }
  fill(img, 65, 52, 69, 53, LEATHER);
  for (let y = 54; y <= 58; y += 2) fill(img, 65, y, 69, y, BRONZE_D);

  // ── HELMET CREST [88,0] [2,8,1] — gold crest ──
  paintBox(img, 88, 0, 2, 8, 1, { all: GOLD });
  fill(img, 88, 0, 93, 1, "#FFD700"); // brighter tip

  // ── SPEAR [94,0] [1,28,1] ──
  paintBox(img, 94, 0, 1, 28, 1, { all: WOOD });
  // Bronze tip (top 4px of front: x=95, y=1..4)
  fill(img, 94, 0, 97, 4, BRONZE);
  // Transition
  fill(img, 94, 5, 97, 6, BRONZE_D);

  await img.writeAsync(path.join(OUT, "goliath.png"));
  console.log("✅ goliath.png (128×64)");
}

Promise.all([genSamson(), genDalila(), genDavid(), genGoliath()])
  .then(() => console.log("\n✅ TODAS LAS TEXTURAS GENERADAS"))
  .catch(console.error);
