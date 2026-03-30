/**
 * generate_entity_textures.js — Biblical Characters Add-on
 *
 * Key design: hat/overlay layers use transparency to reveal the face painted
 * on the base head layer. Eyes use high-contrast white sclera. Every surface
 * has at least 2 shades (base + shadow) to avoid flat appearance.
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

// ════════════════════════════════════════════════════════
// SANSÓN — 64×64 | Jueces 13-16
// Dark skin, 7 braids (black + brown highlights),
// thick beard, linen tunic, gold belt.
// ════════════════════════════════════════════════════════
async function genSamson() {
  const img = new Jimp(64, 64, 0x00000000);
  const SK  = "#7A4530", SKH = "#8B5A40", SKS = "#5A3020", CHIN = "#4A2A18";
  const HR  = "#1A0A00", HRL = "#3A2A10";
  const EW  = "#D0C8B0", IR = "#4A2A0A";
  const BRD = "#2A1A04", BRDD = "#1A0A00", MOUTH = "#6B3030";
  const TUN = "#D4B483", TUNS = "#B09060", TUND = "#8A7040";
  const BELT = "#8B6914", GOLD = "#C8A020";
  const SAND = "#6B3A1A", SANDD = "#4A2A10";

  // ── HEAD [0,0] [8,8,8] ──
  paintBox(img, 0, 0, 8, 8, 8, {
    top: HR, bottom: CHIN, front: SK, back: HR, right: SK, left: SK
  });
  // Sides: hair on back half
  fill(img, 4, 8, 7, 15, HR);  fill(img, 0, 15, 3, 15, CHIN);
  fill(img, 16, 8, 19, 15, HR); fill(img, 20, 15, 23, 15, CHIN);

  // Front face [8,8]-[15,15]
  fill(img, 8, 8, 15, 8, HR);                                        // y=8:  hair fringe
  px(img, 8,9,HR); fill(img, 9,9,14,9, SK); px(img, 15,9,HR);       // y=9:  forehead
  // y=10: eyebrows
  px(img,8,10,SKS); px(img,9,10,SK);
  fill(img,10,10,11,10,HR); px(img,12,10,SK); fill(img,13,10,14,10,HR);
  px(img,15,10,SKS);
  // y=11: eyes top (2×2, white+iris, iris on inner side)
  px(img,8,11,SK); px(img,9,11,SK);
  px(img,10,11,EW); px(img,11,11,IR);
  px(img,12,11,SK);
  px(img,13,11,IR); px(img,14,11,EW);
  px(img,15,11,SK);
  // y=12: eyes bottom
  px(img,8,12,SK); px(img,9,12,SK);
  px(img,10,12,EW); px(img,11,12,IR);
  px(img,12,12,SK);
  px(img,13,12,IR); px(img,14,12,EW);
  px(img,15,12,SK);
  // y=13: nose
  fill(img,8,13,10,13,SK); fill(img,11,13,12,13,SKS); fill(img,13,13,15,13,SK);
  // y=14: beard + mouth
  px(img,8,14,SKS); fill(img,9,14,10,14,BRD);
  fill(img,11,14,12,14,MOUTH);
  fill(img,13,14,14,14,BRD); px(img,15,14,SKS);
  // y=15: full beard
  fill(img,8,15,15,15,BRD);

  // ── HAT [32,0] [8,8,8] — braids overlay ──
  paintBox(img, 32, 0, 8, 8, 8, { all: HR });
  // Braid highlight streaks on all opaque faces
  dither(img, 40,0, 47,7, HR, HRL);   // top
  dither(img, 56,8, 63,15, HR, HRL);  // back
  // Front: hair top 2 rows, side columns rows 2-3, rest transparent
  dither(img, 40,8, 47,9, HR, HRL);                 // top 2 rows opaque
  fill(img, 40,10, 40,11, HR); fill(img, 47,10, 47,11, HR); // side cols rows 2-3
  clr(img, 41,10, 46,11);                           // center transparent (eyes)
  clr(img, 40,12, 47,15);                           // lower rows transparent (beard)
  // Sides: upper half hair, lower half transparent
  dither(img, 32,8, 39,11, HR, HRL); clr(img, 32,12, 39,15);
  dither(img, 48,8, 55,11, HR, HRL); clr(img, 48,12, 55,15);
  // Bottom: transparent
  clr(img, 48,0, 55,7);

  // ── BODY [16,16] [8,12,4] ──
  paintBox(img, 16, 16, 8, 12, 4, {
    front: TUN, back: TUND, top: TUNS, bottom: TUNS,
    right: TUNS, left: TUNS
  });
  // Front [20,20]-[27,31]: V-neck, belt, fold shadows
  fill(img, 23,20, 24,20, SK);  px(img,22,20,TUNS); px(img,25,20,TUNS); // neckline
  fill(img, 23,21, 24,21, SKS);
  fill(img, 20,25, 27,25, BELT);  // gold belt
  fill(img, 20,26, 27,26, GOLD);
  fill(img, 16,25, 19,26, BELT);  fill(img, 28,25, 31,26, BELT); // side belts
  fill(img, 32,25, 39,26, BELT);
  px(img,22,28,TUNS); px(img,25,28,TUNS); // fold shadows
  px(img,21,29,TUNS); px(img,26,29,TUNS);
  fill(img, 20,31, 27,31, TUND); // hem

  // ── RIGHT ARM [40,16] [4,12,4] ──
  paintBox(img, 40, 16, 4, 12, 4, {
    front: SK, back: SKS, top: TUN, right: SKS, left: SKS, bottom: SKS
  });
  // Short sleeve top 4 rows on all faces
  fill(img,44,20,47,23,TUN); fill(img,40,20,43,23,TUN);
  fill(img,48,20,51,23,TUN); fill(img,52,20,55,23,TUN);
  fill(img,44,24,47,24,TUNS); // sleeve hem
  // Wristband
  fill(img,44,30,47,31,BELT); fill(img,40,30,43,31,BELT);

  // ── LEFT ARM [32,48] [4,12,4] ──
  paintBox(img, 32, 48, 4, 12, 4, {
    front: SK, back: SKS, top: TUN, right: SKS, left: SKS, bottom: SKS
  });
  fill(img,36,52,39,55,TUN); fill(img,32,52,35,55,TUN);
  fill(img,40,52,43,55,TUN); fill(img,44,52,47,55,TUN);
  fill(img,36,56,39,56,TUNS);
  fill(img,36,62,39,63,BELT); fill(img,32,62,35,63,BELT);

  // ── RIGHT LEG [0,16] [4,12,4] ──
  paintBox(img, 0, 16, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  fill(img,4,25,7,25,TUND);                 // hem
  fill(img,4,26,7,29,SK); fill(img,0,26,3,29,SKS); // exposed leg
  fill(img,8,26,11,29,SKS);
  fill(img,4,30,7,31,SAND); fill(img,0,30,3,31,SAND); // sandals
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
  for (let y = 20; y <= 33; y += 3) fill(img,58,y,59,y,HRL); // highlights

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
// Olive skin, kohl-rimmed eyes, purple dress, gold
// accents, veil. Slim arms.
// ════════════════════════════════════════════════════════
async function genDalila() {
  const img = new Jimp(64, 64, 0x00000000);
  const SK  = "#B8896A", SKH = "#D0A080", SKS = "#987050", CHIN = "#A07A5A";
  const HR  = "#1A0A14", HRL = "#3A2A30";
  const KOHL = "#0A0A14", EW = "#E8E0D0", IR = "#2A7B4A";
  const BLUSH = "#D0806A", LIPS = "#8B3030";
  const DRESS = "#4A1A6B", DRESSD = "#3D1A5C", DRESSDD = "#2D1040";
  const GOLD = "#C8A020", GOLDD = "#A08018";
  const VEIL = "#7B3FA0", VEILD = "#5A2A80";

  // ── HEAD [0,0] [8,8,8] ──
  paintBox(img, 0, 0, 8, 8, 8, {
    top: HR, bottom: CHIN, front: SK, back: HR, right: SK, left: SK
  });
  fill(img, 5,8, 7,15, HR); fill(img, 0,15, 4,15, CHIN);
  fill(img, 16,8, 18,15, HR); fill(img, 19,15, 23,15, CHIN);

  // Front face [8,8]-[15,15]
  fill(img, 8,8, 15,8, HR);                                          // y=8: hair
  px(img,8,9,HR); fill(img,9,9,14,9, SK); px(img,15,9,HR);          // y=9: forehead
  // y=10: kohl eyebrows (heavy)
  px(img,8,10,SK); px(img,9,10,SK);
  fill(img,10,10,11,10,KOHL); px(img,12,10,SK); fill(img,13,10,14,10,KOHL);
  px(img,15,10,SK);
  // y=11: eyes top (kohl-rimmed: kohl on outer edge)
  px(img,8,11,SK); px(img,9,11,KOHL);
  px(img,10,11,EW); px(img,11,11,IR);
  px(img,12,11,SK);
  px(img,13,11,IR); px(img,14,11,EW);
  px(img,15,11,KOHL);
  // y=12: eyes bottom
  px(img,8,12,SK); px(img,9,12,KOHL);
  px(img,10,12,EW); px(img,11,12,IR);
  px(img,12,12,SK);
  px(img,13,12,IR); px(img,14,12,EW);
  px(img,15,12,KOHL);
  // y=13: cheeks with blush
  px(img,8,13,SK); px(img,9,13,BLUSH);
  fill(img,10,13,13,13,SK);
  px(img,14,13,BLUSH); px(img,15,13,SK);
  // y=14: nose
  fill(img,8,14,10,14,SK); fill(img,11,14,12,14,SKS); fill(img,13,14,15,14,SK);
  // y=15: red lips
  px(img,8,15,CHIN); px(img,9,15,SK);
  fill(img,10,15,13,15,LIPS);
  px(img,14,15,SK); px(img,15,15,CHIN);

  // ── HAT [32,0] [8,8,8] — purple veil ──
  paintBox(img, 32, 0, 8, 8, 8, { all: VEIL });
  // Gold diadem band at top of front
  fill(img, 40,8, 47,8, GOLD);  fill(img, 40,9, 47,9, VEILD);
  // Front: transparent below diadem to show face
  clr(img, 41,10, 46,15); // center transparent
  fill(img,40,10,40,11,VEIL); fill(img,47,10,47,11,VEIL); // side draping
  clr(img, 40,12, 40,15); clr(img, 47,12, 47,15);
  // Sides: upper hair + veil, lower transparent
  fill(img, 32,8, 39,9, GOLD); clr(img, 32,12, 39,15);
  fill(img, 48,8, 55,9, GOLD); clr(img, 48,12, 55,15);
  // Back: full hair under veil
  dither(img, 56,8, 63,15, HR, HRL);
  // Bottom: transparent
  clr(img, 48,0, 55,7);

  // ── BODY [16,16] [8,12,4] — purple dress ──
  paintBox(img, 16, 16, 8, 12, 4, {
    front: DRESS, back: DRESSDD, top: DRESSD, bottom: DRESSD,
    right: DRESSD, left: DRESSD
  });
  // Front [20,20]-[27,31]:
  fill(img, 22,20, 25,20, "#8B0000"); // red collar
  fill(img, 22,21, 25,21, GOLD);      // gold neckline
  fill(img, 20,24, 27,24, GOLD);      // gold belt
  fill(img, 20,25, 27,25, GOLDD);
  fill(img, 16,24, 19,25, GOLD); fill(img, 28,24, 31,25, GOLD); // side belts
  fill(img, 32,24, 39,25, GOLD);
  // Pleat shadows
  px(img,22,28,DRESSDD); px(img,25,28,DRESSDD);
  px(img,21,30,DRESSDD); px(img,26,30,DRESSDD);
  fill(img, 20,31, 27,31, DRESSDD); // hem

  // ── RIGHT ARM [40,16] [3,12,4] slim ──
  paintBox(img, 40, 16, 3, 12, 4, {
    front: SK, back: SKS, top: DRESS, right: SKS, left: SKS, bottom: SKS
  });
  fill(img,44,20,46,23,DRESS); fill(img,40,20,43,23,DRESS);
  fill(img,47,20,50,23,DRESS); fill(img,51,20,53,23,DRESS);
  fill(img,44,24,46,24,DRESSD); // sleeve hem
  fill(img,44,26,46,27,GOLD);   // bracelet

  // ── LEFT ARM [32,48] [3,12,4] slim ──
  paintBox(img, 32, 48, 3, 12, 4, {
    front: SK, back: SKS, top: DRESS, right: SKS, left: SKS, bottom: SKS
  });
  fill(img,36,52,38,55,DRESS); fill(img,32,52,35,55,DRESS);
  fill(img,39,52,42,55,DRESS); fill(img,43,52,45,55,DRESS);
  fill(img,36,56,38,56,DRESSD);
  fill(img,36,58,38,59,GOLD);

  // ── RIGHT LEG [0,16] [4,12,4] — covered by dress ──
  paintBox(img, 0, 16, 4, 12, 4, {
    front: DRESS, back: DRESSD, top: DRESS, right: DRESSD, left: DRESSD, bottom: DRESSD
  });
  fill(img, 4,30, 7,31, GOLD); fill(img, 0,31, 3,31, GOLD); // gold trim bottom

  // ── LEFT LEG [16,48] [4,12,4] ──
  paintBox(img, 16, 48, 4, 12, 4, {
    front: DRESS, back: DRESSD, top: DRESS, right: DRESSD, left: DRESSD, bottom: DRESSD
  });
  fill(img, 20,62, 23,63, GOLD); fill(img, 16,63, 19,63, GOLD);

  // ── VEIL BONE [0,32] [8,4,8] (inflate 0.6) ──
  paintBox(img, 0, 32, 8, 4, 8, { all: VEIL });
  // Top: veil with gold edge
  fill(img, 8,32, 15,32, GOLD); fill(img, 8,33, 15,33, VEILD);
  // Front [8,40]-[15,43]: top 2 rows veil, bottom 2 transparent
  fill(img, 8,40, 15,40, VEIL); fill(img, 8,41, 15,41, VEILD);
  clr(img, 8,42, 15,43);
  // Sides: top opaque, bottom transparent
  clr(img, 0,42, 7,43);   // right side lower
  clr(img, 16,42, 23,43); // left side lower
  // Bottom: transparent
  clr(img, 16,32, 23,39);

  // ── SKIRT BONE [32,32] [8,12,3] (inflate 0.3) ──
  paintBox(img, 32, 32, 8, 12, 3, {
    front: DRESSD, back: DRESSDD, top: DRESSD,
    right: DRESSDD, left: DRESSDD, bottom: GOLD
  });
  // Pleat shadows on front [35,35]-[42,46]
  for (let y = 37; y <= 45; y += 4) fill(img, 35,y, 42,y, DRESSDD);
  // Gold trim at bottom
  fill(img, 35,45, 42,46, GOLD);

  await img.writeAsync(path.join(OUT, "dalila.png"));
  console.log("✅ dalila.png (64×64)");
}

// ════════════════════════════════════════════════════════
// DAVID — 64×64 | I Samuel 16-17
// Ruddy/fair skin, copper curly hair, green eyes, rosy
// cheeks, shepherd tunic, sling strap, rope belt.
// ════════════════════════════════════════════════════════
async function genDavid() {
  const img = new Jimp(64, 64, 0x00000000);
  const SK  = "#D4845A", SKH = "#E0A070", SKS = "#B06A40", CHIN = "#C07A50";
  const HR  = "#C85A14", HRD = "#A04010", HRL = "#E07030";
  const EW  = "#E8E0D0", IR = "#3A8B50";
  const ROSY = "#E8907A", MOUTH = "#D08070";
  const TUN = "#C09050", TUNS = "#A07840", TUND = "#8A6A30";
  const ROPE = "#5A3A0A", ROPEL = "#7A5A1A";
  const SLING = "#8B6030";
  const SAND = "#8B4513", SANDD = "#6B3A1A";

  // ── HEAD [0,0] [8,8,8] ──
  paintBox(img, 0, 0, 8, 8, 8, {
    top: HR, bottom: SKS, front: SK, back: HRD, right: SK, left: SK
  });
  // Right side [0,8]-[7,15]: thick hair on back 5 cols, skin on front 3
  fill(img, 0,8, 2,15, SK);  fill(img, 3,8, 7,15, HRD);
  px(img,3,8,HR); px(img,4,8,HR);  // lighter at top
  fill(img, 0,15, 2,15, CHIN);
  // Left side [16,8]-[23,15]: mirror
  fill(img, 21,8, 23,15, SK); fill(img, 16,8, 20,15, HRD);
  px(img,20,8,HR); px(img,19,8,HR);
  fill(img, 21,15, 23,15, CHIN);

  // Front face [8,8]-[15,15] — this IS the visible face now
  // y=8: thick copper fringe across forehead
  fill(img, 8,8, 15,8, HR);
  // y=9: fringe continues with volume (curly = uneven edge)
  px(img,8,9,HRD); px(img,9,9,HR); px(img,10,9,HRD); fill(img,11,9,12,9,SK);
  px(img,13,9,HRD); px(img,14,9,HR); px(img,15,9,HRD);
  // y=10: eyebrows
  px(img,8,10,SKS); px(img,9,10,SK);
  fill(img,10,10,11,10,"#5A3820"); px(img,12,10,SK); fill(img,13,10,14,10,"#5A3820");
  px(img,15,10,SKS);
  // y=11: eyes top (2×2, white sclera + green iris)
  px(img,8,11,SK); px(img,9,11,SK);
  px(img,10,11,EW); px(img,11,11,IR);
  px(img,12,11,SK);
  px(img,13,11,IR); px(img,14,11,EW);
  px(img,15,11,SK);
  // y=12: eyes bottom
  px(img,8,12,SK); px(img,9,12,SK);
  px(img,10,12,EW); px(img,11,12,IR);
  px(img,12,12,SK);
  px(img,13,12,IR); px(img,14,12,EW);
  px(img,15,12,SK);
  // y=13: cheeks with blush
  px(img,8,13,SK); px(img,9,13,ROSY);
  fill(img,10,13,13,13,SK);
  px(img,14,13,ROSY); px(img,15,13,SK);
  // y=14: nose
  fill(img,8,14,10,14,SK); fill(img,11,14,12,14,SKS); fill(img,13,14,15,14,SK);
  // y=15: mouth
  px(img,8,15,CHIN); px(img,9,15,SK);
  fill(img,10,15,13,15,MOUTH);
  px(img,14,15,SK); px(img,15,15,CHIN);

  // ── HAT [32,0] [8,8,8] — copper curls overlay ──
  // STRATEGY: front face 100% transparent so face is always visible.
  // Hair only on top, back, and upper sides.
  paintBox(img, 32, 0, 8, 8, 8, { all: "#00000000" }); // start fully transparent
  // Top face [40,0]-[47,7]: copper curls with dark curl pattern
  for (let x = 40; x <= 47; x++)
    for (let y = 0; y <= 7; y++) {
      const curl = ((x + y) % 3 === 0) ? HRL : ((x + y) % 3 === 1) ? HR : HRD;
      px(img, x, y, curl);
    }
  // Back face [56,8]-[63,15]: full dark curls
  for (let x = 56; x <= 63; x++)
    for (let y = 8; y <= 15; y++) {
      const curl = ((x * 3 + y) % 4 === 0) ? HRL : ((x + y) % 2 === 0) ? HR : HRD;
      px(img, x, y, curl);
    }
  // Front face [40,8]-[47,15]: 100% TRANSPARENT — face shows through
  clr(img, 40, 8, 47, 15);
  // Right side [32,8]-[39,15]: upper 3 rows curls, rest transparent
  for (let x = 32; x <= 39; x++)
    for (let y = 8; y <= 10; y++) {
      px(img, x, y, ((x + y) % 2 === 0) ? HR : HRD);
    }
  clr(img, 32, 11, 39, 15);
  // Left side [48,8]-[55,15]: upper 3 rows curls, rest transparent
  for (let x = 48; x <= 55; x++)
    for (let y = 8; y <= 10; y++) {
      px(img, x, y, ((x + y) % 2 === 0) ? HR : HRD);
    }
  clr(img, 48, 11, 55, 15);
  // Bottom face: transparent
  clr(img, 48, 0, 55, 7);

  // ── CURLY HAIR [0,32] [8,4,8] (inflate 1.2!) ──
  // STRATEGY: front face 100% transparent. This bone creates a thick
  // shell around the head. Only show curls on top, sides, and back.
  paintBox(img, 0, 32, 8, 4, 8, { all: "#00000000" }); // start transparent
  // Top face [8,32]-[15,39]: rich curl pattern
  for (let x = 8; x <= 15; x++)
    for (let y = 32; y <= 39; y++) {
      const curl = ((x * 2 + y) % 5 === 0) ? HRL
                 : ((x + y * 3) % 4 === 0) ? HRD : HR;
      px(img, x, y, curl);
    }
  // Back face [24,40]-[31,43]: full dark curls hanging down
  for (let x = 24; x <= 31; x++)
    for (let y = 40; y <= 43; y++) {
      px(img, x, y, ((x + y) % 3 === 0) ? HRL : ((x + y) % 2 === 0) ? HRD : HR);
    }
  // Front face [8,40]-[15,43]: 100% TRANSPARENT
  clr(img, 8, 40, 15, 43);
  // Right side [0,40]-[7,43]: curls on upper 2 rows, lower 2 transparent
  for (let x = 0; x <= 7; x++)
    for (let y = 40; y <= 41; y++)
      px(img, x, y, ((x + y) % 2 === 0) ? HR : HRD);
  clr(img, 0, 42, 7, 43);
  // Left side [16,40]-[23,43]: same
  for (let x = 16; x <= 23; x++)
    for (let y = 40; y <= 41; y++)
      px(img, x, y, ((x + y) % 2 === 0) ? HR : HRD);
  clr(img, 16, 42, 23, 43);
  // Bottom face [16,32]-[23,39]: transparent
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
  fill(img, 20,31, 27,31, TUND); // hem

  // ── RIGHT ARM [40,16] [3,12,4] slim ──
  paintBox(img, 40, 16, 3, 12, 4, {
    front: SK, back: SKS, top: TUN, right: SKS, left: SKS, bottom: SKS
  });
  fill(img,44,20,46,22,TUN); fill(img,40,20,43,22,TUN); // sleeve
  fill(img,47,20,50,22,TUN); fill(img,51,20,53,22,TUN);
  fill(img,44,23,46,23,TUNS); // hem
  fill(img,44,29,46,30,SLING); fill(img,40,29,43,30,SLING); // sling wrist

  // ── LEFT ARM [32,48] [3,12,4] slim ──
  paintBox(img, 32, 48, 3, 12, 4, {
    front: SK, back: SKS, top: TUN, right: SKS, left: SKS, bottom: SKS
  });
  fill(img,36,52,38,54,TUN); fill(img,32,52,35,54,TUN);
  fill(img,39,52,42,54,TUN); fill(img,43,52,45,54,TUN);
  fill(img,36,55,38,55,TUNS);

  // ── RIGHT LEG [0,16] [4,12,4] ──
  paintBox(img, 0, 16, 4, 12, 4, {
    front: TUN, back: TUNS, top: TUN, right: TUNS, left: TUNS, bottom: SANDD
  });
  fill(img,4,25,7,25,TUND);                 // hem
  fill(img,4,26,7,29,SK); fill(img,0,26,3,29,SKS); // exposed leg
  fill(img,8,26,11,29,SKS);
  fill(img,4,30,7,31,SAND); fill(img,0,30,3,31,SAND); // sandals
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
// Bronze helmet, visor slit with glowing eyes, chainmail
// body, gold accents, spear, crest. Giant scale 1.85.
// ════════════════════════════════════════════════════════
async function genGoliath() {
  const img = new Jimp(128, 64, 0x00000000);
  const BRZ  = "#CD8B3A", BRZD = "#A07030", BRZL = "#E0A050";
  const GOLD = "#C8A020", GOLDB = "#FFD700";
  const VISOR = "#0A0A0A", EYE_R = "#BB4410";
  const CHAIN = "#8B8B8B", CHAINL = "#A8A8A8", CHAIND = "#707070";
  const LEATH = "#6B3A1A", LEATHD = "#4A2A10";
  const WOOD = "#3A2010", WOODL = "#5A3820";

  // ── HEAD [0,0] [10,10,10] — bronze helmet ──
  paintBox(img, 0, 0, 10, 10, 10, {
    top: GOLD, bottom: BRZD, front: BRZ, back: BRZD,
    right: BRZD, left: BRZD
  });
  // Right side [0,10]-[9,19]: reinforcement lines
  for (let y = 12; y <= 19; y += 3) fill(img,0,y,9,y,BRZD);
  // Left side [20,10]-[29,19]
  for (let y = 12; y <= 19; y += 3) fill(img,20,y,29,y,BRZD);
  // Back [30,10]-[39,19]: darker with lines
  fill(img,30,10,39,19,BRZD);
  for (let y = 13; y <= 19; y += 3) fill(img,30,y,39,y,"#8A6028");

  // Front face [10,10]-[19,19] — helmet with visor
  fill(img, 10,10, 19,10, BRZ);                                    // y=10: top
  px(img,11,11,GOLD); fill(img,12,11,17,11,BRZ); px(img,18,11,GOLD); // y=11: rivets
  fill(img, 10,12, 19,12, BRZD);                                   // y=12: brow ridge
  fill(img, 10,13, 19,13, VISOR);                                  // y=13: visor top
  // y=14: eyes in visor
  px(img,10,14,VISOR); px(img,11,14,EYE_R); px(img,12,14,EYE_R);
  fill(img,13,14,16,14,VISOR);
  px(img,17,14,EYE_R); px(img,18,14,EYE_R); px(img,19,14,VISOR);
  // y=15-16: nasal guard
  fill(img,10,15,13,15,BRZ); fill(img,14,15,15,15,BRZD); fill(img,16,15,19,15,BRZ);
  fill(img,10,16,13,16,BRZ); fill(img,14,16,15,16,BRZD); fill(img,16,16,19,16,BRZ);
  // y=17: lower rivets
  px(img,11,17,GOLD); fill(img,12,17,17,17,BRZ); px(img,18,17,GOLD);
  // y=18: helmet bottom
  fill(img, 10,18, 19,18, BRZ);
  // y=19: chin strap
  fill(img, 10,19, 19,19, LEATH);

  // ── HAT [44,0] [11,11,11] — helmet overlay ──
  paintBox(img, 44, 0, 11, 11, 11, { all: BRZ });
  // Top: gold crest line
  fill(img, 55,0, 65,0, GOLD);
  // Front [55,11]-[65,21]: visor cut-out at rows 3-4
  fill(img, 55,11, 65,12, BRZ);     // top 2 rows opaque
  fill(img, 55,13, 55,14, BRZ);     // left edge
  clr(img, 56,13, 64,14);           // visor cut-out (transparent → eyes show)
  fill(img, 65,13, 65,14, BRZ);     // right edge
  fill(img, 55,15, 65,21, BRZ);     // bottom rows opaque
  // Reinforcement on overlay
  for (let y = 16; y <= 21; y += 3) fill(img,55,y,65,y,BRZD);
  // Sides & back: reinforcement
  for (let y = 14; y <= 21; y += 3) {
    fill(img,44,y,54,y,BRZD);   // right
    fill(img,66,y,76,y,BRZD);   // left
  }
  // Bottom: bronze
  fill(img, 66,0, 76,10, BRZD);

  // ── BODY [0,22] [10,14,5] — chainmail ──
  paintBox(img, 0, 22, 10, 14, 5, {
    front: CHAIN, back: CHAIND, top: BRZ, bottom: CHAIND,
    right: CHAIND, left: CHAIND
  });
  // Chainmail dither on front [5,27]-[14,40]
  dither(img, 5,29, 14,40, CHAIN, CHAINL);
  // Shoulder plates
  fill(img, 5,27, 14,28, GOLD);
  // Leather belt
  fill(img, 5,33, 14,34, LEATH); px(img,9,33,GOLD); px(img,10,33,GOLD);
  // Side belts
  fill(img, 0,33, 4,34, LEATH); fill(img, 15,33, 19,34, LEATH);
  fill(img, 20,33, 29,34, LEATH);

  // ── RIGHT ARM [40,22] [5,14,5] — chainmail sleeve ──
  paintBox(img, 40, 22, 5, 14, 5, {
    front: CHAIN, back: CHAIND, top: BRZ,
    right: CHAIND, left: CHAIND, bottom: CHAIND
  });
  fill(img, 45,27, 49,28, GOLD);  // shoulder plate
  dither(img, 45,29, 49,38, CHAIN, CHAINL); // chainmail
  fill(img, 45,39, 49,40, LEATH); // gauntlet

  // ── RIGHT LEG [60,22] [5,12,5] — greaves ──
  paintBox(img, 60, 22, 5, 12, 5, {
    front: BRZ, back: BRZD, top: CHAIN,
    right: BRZD, left: BRZD, bottom: LEATHD
  });
  // Thigh chainmail on front top
  dither(img, 65,27, 69,30, CHAIN, CHAINL);
  // Knee plate
  fill(img, 65,31, 69,32, LEATH);
  // Greave lines
  for (let y = 33; y <= 38; y += 2) fill(img,65,y,69,y,BRZD);

  // ── LEFT LEG [60,42] [5,12,5] ──
  paintBox(img, 60, 42, 5, 12, 5, {
    front: BRZ, back: BRZD, top: CHAIN,
    right: BRZD, left: BRZD, bottom: LEATHD
  });
  dither(img, 65,47, 69,50, CHAIN, CHAINL);
  fill(img, 65,51, 69,52, LEATH);
  for (let y = 53; y <= 58; y += 2) fill(img,65,y,69,y,BRZD);

  // ── CREST [88,0] [2,8,1] — gold crest ──
  paintBox(img, 88, 0, 2, 8, 1, { all: GOLD });
  fill(img, 89,1, 90,2, GOLDB); // bright tip

  // ── SPEAR [94,0] [1,28,1] ──
  paintBox(img, 94, 0, 1, 28, 1, { all: WOOD });
  // Bronze tip (top 5 rows)
  fill(img, 94,0, 97,1, BRZ);
  fill(img, 94,2, 97,4, BRZD);
  fill(img, 94,5, 97,6, BRZL); // transition
  // Wood grain
  for (let y = 10; y <= 28; y += 4) fill(img,95,y,95,y,WOODL);

  await img.writeAsync(path.join(OUT, "goliath.png"));
  console.log("✅ goliath.png (128×64)");
}

Promise.all([genSamson(), genDalila(), genDavid(), genGoliath()])
  .then(() => console.log("\n✅ TODAS LAS TEXTURAS GENERADAS"))
  .catch(console.error);
