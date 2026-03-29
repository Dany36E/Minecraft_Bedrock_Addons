// tabernacle.js — Tabernáculo del Desierto — Éxodo 26
// Tienda sagrada con atrio, Lugar Santo y Lugar Santísimo

function generateTabernacle() {
  const blocks = [];
  const BIRCH_LOG = "minecraft:birch_log";
  const BIRCH_FENCE = "minecraft:birch_fence";
  const WHITE_WOOL = "minecraft:white_wool";
  const PURPLE_WOOL = "minecraft:purple_wool";
  const GOLD = "minecraft:gold_block";
  const IRON = "minecraft:iron_bars";
  const SAND = "minecraft:sand";
  const ACACIA = "minecraft:acacia_planks";

  const AL = 30; // largo atrio (x)
  const AW = 20; // ancho atrio (z)
  const TL = 20; // largo tienda (x)
  const TW = 10; // ancho tienda (z)
  const TH = 8;  // altura tienda
  // Tienda se ubica en la mitad posterior del atrio
  const TX = AL - TL - 2; // offset x de la tienda
  const TZ = Math.floor((AW - TW) / 2); // offset z centrado

  // ── Piso de arena del atrio ──
  for (let x = 0; x < AL; x++)
    for (let z = 0; z < AW; z++)
      blocks.push([x, 0, z, SAND]);

  // ── Cerca del atrio (birch fence en y=1, postes de birch log cada 5) ──
  for (let x = 0; x < AL; x++) {
    blocks.push([x, 1, 0, x % 5 === 0 ? BIRCH_LOG : BIRCH_FENCE]);
    blocks.push([x, 1, AW - 1, x % 5 === 0 ? BIRCH_LOG : BIRCH_FENCE]);
  }
  for (let z = 0; z < AW; z++) {
    blocks.push([0, 1, z, z % 5 === 0 ? BIRCH_LOG : BIRCH_FENCE]);
    // Puerta del atrio: hueco en x=AL-1 z=8..11
    if (z < 8 || z > 11)
      blocks.push([AL - 1, 1, z, z % 5 === 0 ? BIRCH_LOG : BIRCH_FENCE]);
  }
  // Postes altos en esquinas
  for (const [px, pz] of [[0, 0], [AL - 1, 0], [0, AW - 1], [AL - 1, AW - 1]]) {
    for (let y = 1; y <= 3; y++)
      blocks.push([px, y, pz, BIRCH_LOG]);
  }

  // ── Estructura de la tienda: postes y paredes ──
  // Postes en esquinas y cada 5 bloques
  for (let x = TX; x <= TX + TL; x += 5) {
    for (let y = 1; y <= TH; y++) {
      blocks.push([x, y, TZ, BIRCH_LOG]);
      blocks.push([x, y, TZ + TW, BIRCH_LOG]);
    }
  }

  // Paredes de lana blanca (laterales)
  for (let x = TX; x <= TX + TL; x++) {
    for (let y = 1; y <= TH - 1; y++) {
      blocks.push([x, y, TZ, WHITE_WOOL]);
      blocks.push([x, y, TZ + TW, WHITE_WOOL]);
    }
  }
  // Paredes frontal y trasera
  for (let z = TZ; z <= TZ + TW; z++) {
    for (let y = 1; y <= TH - 1; y++) {
      blocks.push([TX, y, z, WHITE_WOOL]);
      // Frontal con entrada (hueco en centro)
      if (Math.abs(z - (TZ + TW / 2)) > 1)
        blocks.push([TX + TL, y, z, WHITE_WOOL]);
    }
  }

  // ── Techo de lana (inclinado hacia el centro) ──
  for (let x = TX; x <= TX + TL; x++) {
    for (let z = TZ; z <= TZ + TW; z++) {
      const distFromCenter = Math.abs(z - (TZ + TW / 2));
      const roofY = TH + Math.floor(distFromCenter > TW / 4 ? 0 : 1);
      blocks.push([x, roofY, z, WHITE_WOOL]);
    }
  }

  // ── Piso interior de acacia ──
  for (let x = TX + 1; x < TX + TL; x++)
    for (let z = TZ + 1; z < TZ + TW; z++)
      blocks.push([x, 0, z, ACACIA]);

  // ── Velo del Lugar Santísimo (purple_wool, 1/3 desde el fondo) ──
  const veilX = TX + Math.floor(TL / 3);
  for (let z = TZ + 1; z < TZ + TW; z++)
    for (let y = 1; y <= TH - 1; y++)
      blocks.push([veilX, y, z, PURPLE_WOOL]);

  // ── Lugar Santo: piso de oro (del velo hacia la entrada) ──
  for (let x = veilX + 1; x < TX + TL; x++)
    for (let z = TZ + 1; z < TZ + TW; z++)
      blocks.push([x, 0, z, GOLD]);

  // ── Arca del Pacto (centro del Lugar Santísimo) ──
  const arkX = TX + Math.floor(TL / 6);
  const arkZ = TZ + Math.floor(TW / 2);
  blocks.push([arkX, 1, arkZ, GOLD]);
  blocks.push([arkX + 1, 1, arkZ, GOLD]);
  // Querubines
  blocks.push([arkX, 2, arkZ, IRON]);
  blocks.push([arkX + 1, 2, arkZ, IRON]);

  return blocks;
}

export const tabernacle = {
  id: "tabernacle",
  name: "Tabernáculo",
  category: "biblicas",
  description: "La tienda sagrada del desierto — Éxodo 26",
  blocks: generateTabernacle()
};
