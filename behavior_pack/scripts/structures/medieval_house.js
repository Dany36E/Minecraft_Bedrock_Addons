// medieval_house.js — Casa Bíblica de Aldea
// Techo PLANO (estilo bíblico) — Deuteronomio 22:8 "harás pretil a tu terrado"
// Hechos 10:9 — Pedro oraba en el techo plano
// 2 Reyes 4:10 — Aposento alto (aliyah) en el techo

function generateMedievalHouse() {
  const blocks = [];
  const COBBLE = "minecraft:cobblestone";
  const MUD = "minecraft:mud_bricks";         // Ladrillos de barro (típico bíblico)
  const OAK = "minecraft:oak_planks";
  const DOAK_STAIRS = "minecraft:dark_oak_stairs";
  const GLASS = "minecraft:glass_pane";
  const SMOOTH = "minecraft:smooth_stone";
  const CRAFTING = "minecraft:crafting_table";
  const FURNACE = "minecraft:furnace";
  const CHEST = "minecraft:chest";
  const CAMPFIRE = "minecraft:campfire";
  const SAND = "minecraft:sandstone";          // Arenisca (Medio Oriente)

  const W = 10; // ancho (x)
  const D = 8;  // profundidad (z)
  const WH = 4; // altura paredes

  // ── Cimientos (y=0) ──
  for (let x = 0; x < W; x++)
    for (let z = 0; z < D; z++)
      blocks.push([x, 0, z, COBBLE]);

  // ── Piso interior (y=1) ──
  for (let x = 1; x < W - 1; x++)
    for (let z = 1; z < D - 1; z++)
      blocks.push([x, 1, z, SMOOTH]);

  // ── Paredes de MUD_BRICKS (ladrillos de barro) con esquinas de piedra ──
  for (let y = 1; y <= WH; y++) {
    // Pared frontal (z=0) — puerta en x=4,5 y=1..2
    for (let x = 0; x < W; x++) {
      const isDoor = (x === 4 || x === 5) && y <= 2;
      if (!isDoor) {
        const isCorner = x === 0 || x === W - 1;
        blocks.push([x, y, 0, isCorner ? COBBLE : MUD]);
      }
    }
    // Pared trasera (z=D-1)
    for (let x = 0; x < W; x++) {
      const isCorner = x === 0 || x === W - 1;
      blocks.push([x, y, D - 1, isCorner ? COBBLE : MUD]);
    }
    // Paredes laterales
    for (let z = 1; z < D - 1; z++) {
      blocks.push([0, y, z, COBBLE]);
      blocks.push([W - 1, y, z, COBBLE]);
    }
  }

  // ── Ventanas pequeñas (típicas bíblicas, estrechas) ──
  blocks.push([3, 3, 0, GLASS]);
  blocks.push([7, 3, 0, GLASS]);
  blocks.push([3, 3, D - 1, GLASS]);
  blocks.push([0, 3, 3, GLASS]);
  blocks.push([W - 1, 3, 5, GLASS]);

  // ── TECHO PLANO — estilo bíblico (Dt 22:8) ──
  // Vigas de madera + relleno de barro
  for (let x = 0; x < W; x++)
    for (let z = 0; z < D; z++) {
      // Vigas cada 3 bloques
      const mat = x % 3 === 0 ? OAK : MUD;
      blocks.push([x, WH + 1, z, mat]);
    }

  // ── Pretil / barandilla — Dt 22:8 "harás pretil a tu terrado" ──
  for (let x = 0; x < W; x++) {
    blocks.push([x, WH + 2, 0, "minecraft:cobblestone_wall"]);
    blocks.push([x, WH + 2, D - 1, "minecraft:cobblestone_wall"]);
  }
  for (let z = 1; z < D - 1; z++) {
    blocks.push([0, WH + 2, z, "minecraft:cobblestone_wall"]);
    blocks.push([W - 1, WH + 2, z, "minecraft:cobblestone_wall"]);
  }

  // ── Escalera exterior al techo — típica de casas bíblicas ──
  for (let step = 0; step < WH + 1; step++) {
    blocks.push([W, step + 1, D - 2 - step, COBBLE]);
    blocks.push([W, step + 1, D - 1 - step, COBBLE]);
  }

  // ── Aposento alto en el techo (aliyah) — 2 Reyes 4:10 ──
  // Cuarto pequeño en una esquina del techo (para huéspedes/oración)
  for (let y = WH + 2; y <= WH + 4; y++) {
    for (let x = 0; x <= 3; x++) {
      blocks.push([x, y, 0, MUD]);
      blocks.push([x, y, 3, MUD]);
    }
    for (let z = 1; z < 3; z++) {
      blocks.push([0, y, z, MUD]);
      blocks.push([3, y, z, MUD]);
    }
  }
  // Puerta del aposento
  blocks.push([3, WH + 2, 1, "minecraft:air"]);
  blocks.push([3, WH + 3, 1, "minecraft:air"]);
  // Ventana del aposento
  blocks.push([1, WH + 3, 0, GLASS]);
  // Techo del aposento
  for (let x = 0; x <= 3; x++)
    for (let z = 0; z <= 3; z++)
      blocks.push([x, WH + 5, z, MUD]);
  // Cama y lámpara en el aposento
  blocks.push([1, WH + 2, 1, "minecraft:bed"]);
  blocks.push([1, WH + 2, 2, "minecraft:bed"]);
  blocks.push([2, WH + 2, 2, "minecraft:torch"]);

  // ── Interior: mobiliario ──
  blocks.push([1, 1, 1, CRAFTING]);
  blocks.push([2, 1, 1, FURNACE]);
  blocks.push([W - 2, 1, 1, CHEST]);

  // ── Interior: mesa (fence + pressure plate) ──
  blocks.push([5, 1, 3, "minecraft:oak_fence"]);
  blocks.push([5, 2, 3, "minecraft:oak_pressure_plate"]);
  blocks.push([6, 1, 3, "minecraft:oak_fence"]);
  blocks.push([6, 2, 3, "minecraft:oak_pressure_plate"]);

  // ── Interior: esteras / alfombra (típico bíblico) ──
  for (let x = 2; x <= 7; x++)
    for (let z = 2; z <= 5; z++)
      blocks.push([x, 1, z, "minecraft:brown_carpet"]);

  // ── Interior: antorchas / lámparas de aceite ──
  blocks.push([1, 3, 3, "minecraft:torch"]);
  blocks.push([W - 2, 3, 3, "minecraft:torch"]);
  blocks.push([1, 3, D - 3, "minecraft:torch"]);

  // ── Interior: tinajas de agua (calderos) ──
  blocks.push([W - 2, 1, D - 2, "minecraft:cauldron"]);

  // ── Fogata exterior / horno de pan ──
  blocks.push([4, 1, -2, CAMPFIRE]);

  return blocks;
}

export const medieval_house = {
  id: "medieval_house",
  name: "Casa Bíblica",
  category: "edificios",
  description: "Casa con techo plano y aposento alto — Dt 22:8, 2 Reyes 4:10",
  blocks: generateMedievalHouse()
};
