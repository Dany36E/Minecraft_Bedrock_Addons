const Jimp = require("jimp");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "..", "resource_pack", "textures", "entity");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function fill(img, x1, y1, x2, y2, hex) {
  const c = Jimp.cssColorToHex(hex);
  for (let x = x1; x <= x2; x++)
    for (let y = y1; y <= y2; y++)
      img.setPixelColor(c, x, y);
}

function px(img, x, y, hex) {
  img.setPixelColor(Jimp.cssColorToHex(hex), x, y);
}

function checkerFill(img, x1, y1, x2, y2, hex1, hex2) {
  const c1 = Jimp.cssColorToHex(hex1);
  const c2 = Jimp.cssColorToHex(hex2);
  for (let x = x1; x <= x2; x++)
    for (let y = y1; y <= y2; y++)
      img.setPixelColor((x + y) % 2 === 0 ? c1 : c2, x, y);
}

function stripeFill(img, x1, y1, x2, y2, hex1, hex2) {
  const c1 = Jimp.cssColorToHex(hex1);
  const c2 = Jimp.cssColorToHex(hex2);
  for (let x = x1; x <= x2; x++)
    for (let y = y1; y <= y2; y++)
      img.setPixelColor(x % 2 === 0 ? c1 : c2, x, y);
}

// ══════════════════════════════════════════
// SANSÓN — 64×64
// ══════════════════════════════════════════
async function generateSamson() {
  const img = new Jimp(64, 64, 0x00000000);

  // --- HEAD FRONT (x=8..15, y=8..15) ---
  fill(img, 8, 8, 15, 15, "#6B3A2A");       // base skin
  fill(img, 8, 8, 15, 9, "#2C1505");        // forehead hair
  fill(img, 8, 10, 9, 15, "#2C1505");       // left temple hair
  fill(img, 14, 10, 15, 15, "#2C1505");     // right temple hair
  px(img, 10, 12, "#1A0500"); px(img, 11, 12, "#1A0500"); // left eye
  px(img, 13, 12, "#1A0500"); px(img, 14, 12, "#1A0500"); // right eye
  px(img, 11, 13, "#6B3A2A"); px(img, 12, 13, "#6B3A2A"); // nose
  fill(img, 10, 14, 13, 14, "#4A2020");     // mouth

  // --- HEAD TOP (x=8..15, y=0..7) ---
  stripeFill(img, 8, 0, 15, 7, "#2C1505", "#3A1F08"); // braided top

  // --- HEAD RIGHT (x=0..7, y=8..15) ---
  fill(img, 0, 8, 7, 15, "#2C1505");        // side hair

  // --- HEAD LEFT (x=16..23, y=8..15) ---
  fill(img, 16, 8, 23, 15, "#2C1505");

  // --- HEAD BACK (x=24..31, y=8..15) ---
  stripeFill(img, 24, 8, 31, 15, "#2C1505", "#4A2C0A"); // braided back

  // --- HEAD BOTTOM (x=16..23, y=0..7) ---
  fill(img, 16, 0, 23, 7, "#6B3A2A");       // chin area

  // --- HAT / OUTER HEAD (x=32..47, y=0..15) ---
  // Braid pattern: alternating columns
  for (let x = 32; x <= 47; x++)
    for (let y = 0; y <= 15; y++) {
      const col = (x - 32) % 4;
      const hex = col < 2 ? "#2C1505" : "#4A2C0A";
      px(img, x, y, hex);
    }
  fill(img, 32, 0, 47, 0, "#1A0A00");       // darker root line

  // --- BODY FRONT (x=20..27, y=20..31) ---
  fill(img, 20, 20, 27, 22, "#D4B483");     // tunic shoulders
  fill(img, 20, 23, 27, 24, "#C8A96E");     // chest
  fill(img, 20, 25, 27, 25, "#8B6914");     // leather belt
  fill(img, 20, 26, 27, 30, "#D4B483");     // lower tunic
  fill(img, 20, 31, 27, 31, "#C8A050");     // bottom border

  // --- BODY RIGHT (x=16..19, y=20..31) ---
  fill(img, 16, 20, 19, 31, "#D4B483");
  fill(img, 16, 25, 19, 25, "#8B6914");

  // --- BODY LEFT (x=28..31, y=20..31) ---
  fill(img, 28, 20, 31, 31, "#D4B483");
  fill(img, 28, 25, 31, 25, "#8B6914");

  // --- BODY BACK (x=32..39, y=20..31) ---
  fill(img, 32, 20, 39, 31, "#D4B483");
  fill(img, 32, 25, 39, 25, "#8B6914");

  // --- BODY TOP/BOTTOM (x=20..27, y=16..19) ---
  fill(img, 20, 16, 27, 19, "#D4B483");
  fill(img, 28, 16, 35, 19, "#D4B483");

  // --- RIGHT ARM (x=44..47, y=20..31) front ---
  fill(img, 44, 20, 47, 21, "#D4B483");     // shoulder with tunic
  fill(img, 44, 22, 47, 31, "#6B3A2A");     // bare forearm
  fill(img, 44, 30, 47, 30, "#8B6914");     // leather wristband
  // arm top (x=44..47, y=16..19)
  fill(img, 44, 16, 47, 19, "#D4B483");
  // arm sides (x=40..43 & x=48..51)
  fill(img, 40, 20, 43, 31, "#6B3A2A");
  fill(img, 40, 16, 43, 19, "#D4B483");
  fill(img, 48, 20, 51, 31, "#6B3A2A");
  fill(img, 48, 16, 51, 19, "#D4B483");
  fill(img, 52, 20, 55, 31, "#6B3A2A");     // arm back
  fill(img, 52, 16, 55, 19, "#D4B483");

  // --- RIGHT LEG (x=4..7, y=20..31) front ---
  fill(img, 4, 20, 7, 24, "#D4B483");       // tunic to knee
  fill(img, 4, 25, 7, 29, "#6B3A2A");       // bare leg
  fill(img, 4, 30, 7, 31, "#8B4513");       // sandal
  // leg top (x=4..7, y=16..19)
  fill(img, 4, 16, 7, 19, "#D4B483");
  // leg sides
  fill(img, 0, 20, 3, 31, "#6B3A2A");
  fill(img, 0, 20, 3, 24, "#D4B483");
  fill(img, 0, 30, 3, 31, "#8B4513");
  fill(img, 0, 16, 3, 19, "#D4B483");
  fill(img, 8, 20, 11, 31, "#6B3A2A");
  fill(img, 8, 20, 11, 24, "#D4B483");
  fill(img, 8, 30, 11, 31, "#8B4513");
  fill(img, 8, 16, 11, 19, "#D4B483");
  fill(img, 12, 20, 15, 31, "#6B3A2A");
  fill(img, 12, 20, 15, 24, "#D4B483");
  fill(img, 12, 30, 15, 31, "#8B4513");

  // --- HAIR BONES (x=56..63) ---
  // hair_left uv [56,0] size 2×14×2 → front 2px wide, 14 tall at x=58..59, y=0..13 (already in hat area)
  // Use remaining space: x=56..63, y=0..31
  stripeFill(img, 56, 0, 57, 15, "#2C1505", "#4A2C0A"); // hair_left
  stripeFill(img, 56, 16, 57, 31, "#2C1505", "#4A2C0A"); // hair_right
  // hair_back uv [48,32] size 6×12×2
  stripeFill(img, 48, 32, 61, 47, "#2C1505", "#4A2C0A");

  await img.writeAsync(path.join(OUT, "samson.png"));
  console.log("  ✅ samson.png (64×64)");
}

// ══════════════════════════════════════════
// DALILA — 64×64
// ══════════════════════════════════════════
async function generateDalila() {
  const img = new Jimp(64, 64, 0x00000000);

  // --- HEAD FRONT (x=8..15, y=8..15) ---
  fill(img, 8, 8, 15, 15, "#8B6347");       // skin base
  fill(img, 8, 8, 15, 9, "#7B3FA0");        // purple veil top
  fill(img, 8, 10, 15, 10, "#C8A020");      // gold diadem
  // eyes with kohl
  px(img, 10, 12, "#7030A0"); px(img, 11, 12, "#1A0A14"); // left eye
  px(img, 13, 12, "#1A0A14"); px(img, 14, 12, "#7030A0"); // right eye
  fill(img, 11, 14, 13, 14, "#9B3A4A");     // painted lips

  // --- HEAD TOP (x=8..15, y=0..7) ---
  fill(img, 8, 0, 15, 7, "#1C1C1C");        // dark hair under veil

  // --- HEAD SIDES & BACK ---
  fill(img, 0, 8, 7, 15, "#1C1C1C");
  fill(img, 16, 8, 23, 15, "#1C1C1C");
  fill(img, 24, 8, 31, 15, "#1C1C1C");
  fill(img, 16, 0, 23, 7, "#8B6347");

  // --- VEIL (hat overlay x=32..47, y=0..15) ---
  stripeFill(img, 32, 0, 47, 15, "#7B3FA0", "#4A1A6B");
  fill(img, 32, 0, 47, 0, "#C8A020");       // gold border top
  fill(img, 32, 14, 47, 15, "#3D1A5C");     // darker bottom

  // --- BODY FRONT (x=20..27, y=20..31) ---
  fill(img, 20, 20, 27, 20, "#8B0000");     // red collar
  fill(img, 20, 21, 27, 21, "#C8A020");     // gold border
  fill(img, 20, 22, 27, 24, "#4A1A6B");     // purple dress upper
  fill(img, 20, 25, 27, 25, "#C8A020");     // gold belt
  // Dress lower with fold pattern
  for (let y = 26; y <= 31; y++)
    for (let x = 20; x <= 27; x++)
      px(img, x, y, x % 2 === 0 ? "#4A1A6B" : "#3D1A5C");

  // body sides
  fill(img, 16, 20, 19, 31, "#4A1A6B");
  fill(img, 16, 25, 19, 25, "#C8A020");
  fill(img, 28, 20, 31, 31, "#4A1A6B");
  fill(img, 28, 25, 31, 25, "#C8A020");
  fill(img, 32, 20, 39, 31, "#4A1A6B");
  fill(img, 32, 25, 39, 25, "#C8A020");
  fill(img, 20, 16, 27, 19, "#4A1A6B");
  fill(img, 28, 16, 35, 19, "#4A1A6B");

  // --- ARMS SLIM (x=44..46, y=20..31) front, 3px wide ---
  fill(img, 44, 20, 46, 24, "#4A1A6B");     // sleeve to elbow
  px(img, 44, 25, "#C8A020"); px(img, 45, 25, "#C8A020"); px(img, 46, 25, "#C8A020"); // bracelet
  fill(img, 44, 26, 46, 31, "#8B6347");     // forearm skin
  fill(img, 44, 16, 46, 19, "#4A1A6B");
  fill(img, 40, 16, 43, 31, "#4A1A6B");
  fill(img, 40, 26, 43, 31, "#8B6347");
  fill(img, 47, 16, 50, 31, "#4A1A6B");
  fill(img, 47, 26, 50, 31, "#8B6347");
  fill(img, 51, 16, 54, 31, "#4A1A6B");
  fill(img, 51, 26, 54, 31, "#8B6347");

  // --- LEGS (x=4..7, y=20..31) ---
  fill(img, 4, 20, 7, 31, "#4B0082");       // dark purple legs
  fill(img, 4, 30, 7, 31, "#3D1A5C");       // shoes
  fill(img, 4, 16, 7, 19, "#4B0082");
  fill(img, 0, 16, 3, 31, "#4B0082");
  fill(img, 8, 16, 11, 31, "#4B0082");
  fill(img, 12, 16, 15, 31, "#4B0082");

  // --- DRESS EXTENSION bone (uv [16,32]) ---
  for (let y = 32; y <= 47; y++)
    for (let x = 16; x <= 31; x++)
      px(img, x, y, x % 2 === 0 ? "#4A1A6B" : "#3D1A5C");
  fill(img, 16, 47, 31, 47, "#C8A020");     // gold hem

  // --- VEIL bone (uv [0,48]) ---
  fill(img, 0, 48, 15, 63, "#7B3FA0");
  fill(img, 0, 48, 15, 48, "#C8A020");

  await img.writeAsync(path.join(OUT, "dalila.png"));
  console.log("  ✅ dalila.png (64×64)");
}

// ══════════════════════════════════════════
// DAVID — 64×64
// ══════════════════════════════════════════
async function generateDavid() {
  const img = new Jimp(64, 64, 0x00000000);

  // --- HEAD FRONT (x=8..15, y=8..15) ---
  fill(img, 8, 8, 15, 15, "#C8734A");       // light skin ("rubio")
  fill(img, 8, 8, 15, 9, "#C85A14");        // reddish hair top
  px(img, 9, 9, "#A04010"); px(img, 11, 9, "#A04010"); px(img, 13, 9, "#A04010"); // darker highlights
  // Eyes - "hermosos ojos"
  px(img, 10, 12, "#5A8B6A"); px(img, 11, 12, "#1A3A2A"); // left eye green
  px(img, 13, 12, "#1A3A2A"); px(img, 14, 12, "#5A8B6A"); // right eye green
  // Young face, no beard
  px(img, 11, 14, "#C08060"); px(img, 12, 14, "#C08060"); // rosy cheeks

  // --- HEAD TOP (x=8..15, y=0..7) ---
  checkerFill(img, 8, 0, 15, 7, "#C85A14", "#A04010"); // curly reddish hair

  // --- HEAD SIDES & BACK ---
  fill(img, 0, 8, 7, 15, "#C85A14");
  fill(img, 16, 8, 23, 15, "#C85A14");
  fill(img, 24, 8, 31, 15, "#C85A14");
  fill(img, 16, 0, 23, 7, "#C8734A");       // chin

  // --- CURLY HAIR bone (uv [0,48]) ---
  checkerFill(img, 0, 48, 15, 63, "#C85A14", "#A04010");

  // --- BODY FRONT (x=20..27, y=20..31) ---
  fill(img, 20, 20, 27, 31, "#D4A060");     // simple linen tunic
  // Shepherd bag strap diagonal
  for (let i = 0; i < 6; i++) px(img, 22 + Math.floor(i * 0.8), 20 + i, "#8B6030");
  fill(img, 23, 24, 25, 25, "#8B6030");     // bag
  fill(img, 20, 26, 27, 26, "#8B6030");     // belt
  fill(img, 20, 20, 27, 20, "#D4A060");     // neckline
  fill(img, 20, 31, 27, 31, "#D4A060");

  // body sides & back & top
  fill(img, 16, 20, 19, 31, "#D4A060");
  fill(img, 28, 20, 31, 31, "#D4A060");
  fill(img, 32, 20, 39, 31, "#D4A060");
  fill(img, 20, 16, 27, 19, "#D4A060");
  fill(img, 28, 16, 35, 19, "#D4A060");

  // --- ARMS SLIM (x=44..46, y=20..31) 3px front ---
  fill(img, 44, 20, 46, 22, "#D4A060");     // short sleeve
  fill(img, 44, 23, 46, 31, "#C8734A");     // bare skinny arm
  px(img, 44, 30, "#8B6030"); px(img, 45, 30, "#8B6030"); px(img, 46, 30, "#8B6030"); // sling cord
  fill(img, 44, 16, 46, 19, "#D4A060");
  fill(img, 40, 16, 43, 31, "#C8734A");
  fill(img, 40, 16, 43, 22, "#D4A060");
  fill(img, 47, 16, 50, 31, "#C8734A");
  fill(img, 47, 16, 50, 22, "#D4A060");
  fill(img, 51, 16, 54, 31, "#C8734A");
  fill(img, 51, 16, 54, 22, "#D4A060");

  // --- LEGS (x=4..7, y=20..31) ---
  fill(img, 4, 20, 7, 25, "#D4A060");       // tunic to knee
  fill(img, 4, 26, 7, 29, "#C8734A");       // bare legs
  fill(img, 4, 30, 7, 31, "#8B7355");       // sandals
  fill(img, 4, 16, 7, 19, "#D4A060");
  fill(img, 0, 16, 3, 31, "#C8734A");
  fill(img, 0, 16, 3, 25, "#D4A060");
  fill(img, 0, 30, 3, 31, "#8B7355");
  fill(img, 8, 16, 11, 31, "#C8734A");
  fill(img, 8, 16, 11, 25, "#D4A060");
  fill(img, 8, 30, 11, 31, "#8B7355");
  fill(img, 12, 16, 15, 31, "#C8734A");
  fill(img, 12, 16, 15, 25, "#D4A060");
  fill(img, 12, 30, 15, 31, "#8B7355");

  // --- SLING bone (uv [56,32]) size 1×4×1 ---
  fill(img, 56, 32, 59, 39, "#8B6030");     // sling leather

  await img.writeAsync(path.join(OUT, "david.png"));
  console.log("  ✅ david.png (64×64)");
}

// ══════════════════════════════════════════
// GOLIÁT — 128×64
// ══════════════════════════════════════════
async function generateGoliath() {
  const img = new Jimp(128, 64, 0x00000000);

  // --- HEAD/HELMET FRONT (x=10..19, y=10..19) for 10×10 head, uv [0,0] ---
  // Head UV layout for 10×10×10: top x=10,y=0 | front x=10,y=10 | right x=0,y=10 | left x=20,y=10 | back x=30,y=10

  // Head front (x=10..19, y=10..19)
  fill(img, 10, 10, 19, 19, "#CD8B3A");     // bronze helmet base
  fill(img, 10, 10, 19, 10, "#C8A020");     // golden crest line
  fill(img, 10, 11, 19, 11, "#A07020");     // second crest line
  fill(img, 10, 12, 19, 13, "#1A1A1A");     // eye slit shadow
  px(img, 13, 12, "#5A3A14"); px(img, 14, 12, "#5A3A14"); // left eye
  px(img, 17, 12, "#5A3A14"); px(img, 18, 12, "#5A3A14"); // right eye
  fill(img, 10, 19, 19, 19, "#8B5A14");     // chin guard

  // Head top (x=10..19, y=0..9)
  fill(img, 10, 0, 19, 9, "#CD8B3A");
  fill(img, 14, 0, 15, 9, "#C8A020");       // crest on top

  // Head right (x=0..9, y=10..19)
  fill(img, 0, 10, 9, 19, "#CD8B3A");

  // Head left (x=20..29, y=10..19)
  fill(img, 20, 10, 29, 19, "#CD8B3A");

  // Head back (x=30..39, y=10..19)
  fill(img, 30, 10, 39, 19, "#CD8B3A");
  fill(img, 34, 10, 35, 19, "#A07020");     // back ridge

  // Head bottom (x=20..29, y=0..9)
  fill(img, 20, 0, 29, 9, "#A0522D");       // skin underneath

  // --- HAT / HELMET OVERLAY (uv [32,0]) ---
  fill(img, 32, 0, 54, 21, "#CD8B3A");
  fill(img, 42, 0, 43, 10, "#C8A020");      // crest overlay

  // --- HELMET CREST bone (uv [56,0]) size 2×6×1 ---
  fill(img, 56, 0, 59, 13, "#C8A020");      // golden crest

  // --- BODY FRONT (uv [20,16]) size 10×14×5 ---
  // front at x=25, y=30, w=10, h=14
  checkerFill(img, 25, 30, 34, 43, "#CD8B3A", "#8B5A14"); // chain mail scales
  fill(img, 25, 41, 34, 41, "#6B3A1A");     // leather belt
  px(img, 29, 41, "#C8A020"); px(img, 30, 41, "#C8A020"); // gold buckle

  // body right side (x=20, y=30, w=5, h=14)
  checkerFill(img, 20, 30, 24, 43, "#CD8B3A", "#8B5A14");
  // body left side (x=35, y=30, w=5, h=14)
  checkerFill(img, 35, 30, 39, 43, "#CD8B3A", "#8B5A14");
  // body back (x=40, y=30, w=10, h=14)
  checkerFill(img, 40, 30, 49, 43, "#CD8B3A", "#8B5A14");
  // body top (x=25, y=25, w=10, h=5)
  fill(img, 25, 25, 34, 29, "#CD8B3A");
  // body bottom (x=35, y=25, w=10, h=5)
  fill(img, 35, 25, 44, 29, "#CD8B3A");

  // --- RIGHT ARM (uv [44,16]) size 5×14×5 ---
  // front at x=49, y=30, w=5, h=14
  checkerFill(img, 49, 30, 53, 43, "#CD8B3A", "#8B5A14");
  fill(img, 49, 30, 53, 30, "#C8A020");     // gold shoulder
  fill(img, 49, 41, 53, 41, "#6B3A1A");     // wrist strap
  // arm right (x=44, y=30)
  checkerFill(img, 44, 30, 48, 43, "#CD8B3A", "#8B5A14");
  // arm left (x=54, y=30)
  checkerFill(img, 54, 30, 58, 43, "#CD8B3A", "#8B5A14");
  // arm back (x=59, y=30)
  checkerFill(img, 59, 30, 63, 43, "#CD8B3A", "#8B5A14");
  // arm top (x=49, y=25, w=5, h=5)
  fill(img, 49, 25, 53, 29, "#C8A020");
  fill(img, 54, 25, 58, 29, "#C8A020");

  // --- RIGHT LEG (uv [0,16]) size 5×14×5 ---
  // front at x=5, y=30, w=5, h=14
  checkerFill(img, 5, 30, 9, 37, "#CD8B3A", "#8B5A14"); // scales
  fill(img, 5, 38, 9, 38, "#6B3A1A");       // knee strap
  fill(img, 5, 39, 9, 42, "#CD8B3A");       // solid bronze greave
  fill(img, 5, 43, 9, 43, "#6B3A1A");       // sandal
  // leg sides
  fill(img, 0, 30, 4, 43, "#CD8B3A");
  fill(img, 0, 38, 4, 38, "#6B3A1A");
  fill(img, 10, 30, 14, 43, "#CD8B3A");
  fill(img, 10, 38, 14, 38, "#6B3A1A");
  fill(img, 15, 30, 19, 43, "#CD8B3A");
  fill(img, 15, 38, 19, 38, "#6B3A1A");
  // leg top
  fill(img, 5, 25, 9, 29, "#CD8B3A");
  fill(img, 10, 25, 14, 29, "#CD8B3A");

  // --- SHOULDER PAD bone (uv [0,48]) size 6×3×6 ---
  fill(img, 0, 48, 17, 56, "#C8A020");      // gold shoulder pad
  fill(img, 0, 50, 17, 50, "#A07020");      // accent line

  // --- SPEAR bone (uv [60,0]) size 1×24×1 ---
  fill(img, 60, 0, 62, 5, "#CD8B3A");       // bronze spear tip
  fill(img, 60, 6, 62, 27, "#4A2C0A");      // dark wood shaft
  px(img, 60, 0, "#C8A020");                // golden tip point

  await img.writeAsync(path.join(OUT, "goliath.png"));
  console.log("  ✅ goliath.png (128×64)");
}

// ══════════════════════════════════════════
// EJECUTAR TODO
// ══════════════════════════════════════════
console.log("Generando texturas de entidades...");
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
