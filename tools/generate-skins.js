const fs = require("fs");
const { createCanvas } = require("canvas");

function createSkin(filename, c) {
  const cv = createCanvas(64, 64);
  const x = cv.getContext("2d");
  x.clearRect(0, 0, 64, 64);

  // HEAD (front x=8,y=8 | right x=0,y=8 | left x=16,y=8 | back x=24,y=8 | top x=8,y=0 | bot x=16,y=0)
  x.fillStyle = c.sk;
  x.fillRect(8, 8, 8, 8);
  x.fillRect(0, 8, 8, 8);
  x.fillRect(16, 8, 8, 8);
  x.fillRect(24, 8, 8, 8);
  x.fillRect(8, 0, 8, 8);
  x.fillRect(16, 0, 8, 8);

  // Eyes
  x.fillStyle = "#FFFFFF";
  x.fillRect(10, 12, 2, 1);
  x.fillRect(14, 12, 2, 1);
  x.fillStyle = c.ey || "#3B2507";
  x.fillRect(11, 12, 1, 1);
  x.fillRect(14, 12, 1, 1);

  // Mouth
  x.fillStyle = c.mo || "#8B4513";
  x.fillRect(11, 14, 3, 1);

  // Hair
  if (c.hr) {
    x.fillStyle = c.hr;
    x.fillRect(8, 0, 8, 8);
    x.fillRect(0, 8, 8, 8);
    x.fillRect(16, 8, 8, 8);
    x.fillRect(24, 8, 8, 8);
    x.fillRect(8, 8, 8, 2);
    // Re-draw face
    x.fillStyle = c.sk;
    x.fillRect(9, 9, 6, 7);
    x.fillStyle = "#FFFFFF";
    x.fillRect(10, 12, 2, 1);
    x.fillRect(14, 12, 2, 1);
    x.fillStyle = c.ey || "#3B2507";
    x.fillRect(11, 12, 1, 1);
    x.fillRect(14, 12, 1, 1);
    x.fillStyle = c.mo || "#8B4513";
    x.fillRect(11, 14, 3, 1);
  }

  // BODY (front x=20,y=20 w=8,h=12)
  x.fillStyle = c.bd;
  x.fillRect(20, 20, 8, 12);
  x.fillRect(28, 20, 4, 12);
  x.fillRect(16, 20, 4, 12);
  x.fillRect(32, 20, 8, 12);
  x.fillRect(20, 16, 8, 4);
  x.fillRect(28, 16, 8, 4);

  // RIGHT ARM (front x=44,y=20 w=4,h=12)
  x.fillStyle = c.ar || c.sk;
  x.fillRect(44, 20, 4, 12);
  x.fillRect(40, 20, 4, 12);
  x.fillRect(48, 20, 4, 12);
  x.fillRect(52, 20, 4, 12);
  x.fillRect(44, 16, 4, 4);
  x.fillRect(48, 16, 4, 4);

  // RIGHT LEG (front x=4,y=20 w=4,h=12)
  x.fillStyle = c.lg;
  x.fillRect(4, 20, 4, 12);
  x.fillRect(0, 20, 4, 12);
  x.fillRect(8, 20, 4, 12);
  x.fillRect(12, 20, 4, 12);
  x.fillRect(4, 16, 4, 4);
  x.fillRect(8, 16, 4, 4);

  // LEFT LEG (64x64: front x=20,y=52 w=4,h=12)
  x.fillStyle = c.lg;
  x.fillRect(20, 52, 4, 12);
  x.fillRect(16, 52, 4, 12);
  x.fillRect(24, 52, 4, 12);
  x.fillRect(28, 52, 4, 12);
  x.fillRect(20, 48, 4, 4);
  x.fillRect(24, 48, 4, 4);

  // LEFT ARM (64x64: front x=36,y=52 w=4,h=12)
  x.fillStyle = c.ar || c.sk;
  x.fillRect(36, 52, 4, 12);
  x.fillRect(32, 52, 4, 12);
  x.fillRect(40, 52, 4, 12);
  x.fillRect(44, 52, 4, 12);
  x.fillRect(36, 48, 4, 4);
  x.fillRect(40, 48, 4, 4);

  // Overlay
  if (c.ov) c.ov(x);

  fs.writeFileSync(filename, cv.toBuffer("image/png"));
  console.log("Created: " + filename);
}

// Sansón — Nazareo, pelo largo negro, túnica rústica
createSkin("skins_pack/sanson.png", {
  sk: "#C68642",
  ey: "#3B2507",
  mo: "#8B4513",
  hr: "#1a1a1a",
  bd: "#8B7355",
  ar: "#C68642",
  lg: "#6B4226",
  ov: (x) => {
    // Belt
    x.fillStyle = "#5C4033";
    x.fillRect(20, 28, 8, 1);
    // Hair overlay layer 2
    x.fillStyle = "#1a1a1a";
    x.fillRect(40, 8, 8, 8);
    x.fillRect(48, 8, 8, 8);
    x.fillRect(32, 8, 8, 8);
    x.fillRect(56, 8, 8, 8);
    x.fillRect(40, 0, 8, 8);
  },
});

// Dalila — Mujer filistea, vestido púrpura, diadema de oro
createSkin("skins_pack/dalila.png", {
  sk: "#DEB887",
  ey: "#2E8B57",
  mo: "#CC6666",
  hr: "#1C1C1C",
  bd: "#800080",
  ar: "#DEB887",
  lg: "#4B0082",
  ov: (x) => {
    // Gold necklace
    x.fillStyle = "#FFD700";
    x.fillRect(21, 20, 6, 1);
    x.fillRect(23, 21, 2, 1);
    // Robe accents
    x.fillStyle = "#9B30FF";
    x.fillRect(20, 22, 1, 6);
    x.fillRect(27, 22, 1, 6);
    // Veil overlay
    x.fillStyle = "#4B0082";
    x.fillRect(40, 0, 8, 8);
    x.fillRect(40, 8, 8, 3);
    x.fillRect(32, 8, 8, 8);
    x.fillRect(56, 8, 8, 8);
    // Gold diadem
    x.fillStyle = "#FFD700";
    x.fillRect(40, 8, 8, 1);
  },
});

// David — Joven pastor rubio/pelirrojo, túnica simple
createSkin("skins_pack/david.png", {
  sk: "#FFDAB9",
  ey: "#4169E1",
  mo: "#CC9999",
  hr: "#B8541A",
  bd: "#F5F5DC",
  ar: "#FFDAB9",
  lg: "#8B7355",
  ov: (x) => {
    // Belt / sling strap
    x.fillStyle = "#8B4513";
    x.fillRect(20, 26, 8, 1);
    x.fillRect(26, 22, 1, 4);
    // Tunic edges
    x.fillStyle = "#D2B48C";
    x.fillRect(20, 20, 8, 1);
    x.fillRect(20, 31, 8, 1);
  },
});

// Goliát — Gigante con armadura de bronce, piel oscura
createSkin("skins_pack/goliat.png", {
  sk: "#A0522D",
  ey: "#8B0000",
  mo: "#654321",
  hr: "#2F2F2F",
  bd: "#CD853F",
  ar: "#CD853F",
  lg: "#8B6914",
  ov: (x) => {
    // Chain mail pattern
    x.fillStyle = "#B8860B";
    for (let y = 21; y < 30; y += 2)
      for (let j = 20; j < 28; j += 2) x.fillRect(j, y, 1, 1);
    // Belt
    x.fillStyle = "#654321";
    x.fillRect(20, 27, 8, 1);
    // Bronze helmet overlay
    x.fillStyle = "#CD853F";
    x.fillRect(40, 0, 8, 8);
    x.fillRect(40, 8, 8, 4);
    x.fillRect(32, 8, 8, 8);
    x.fillRect(48, 8, 8, 8);
    x.fillRect(56, 8, 8, 8);
    // Helmet crest
    x.fillStyle = "#B8860B";
    x.fillRect(43, 0, 2, 8);
  },
});

console.log("All 4 skins generated!");
