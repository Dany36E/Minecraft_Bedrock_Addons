// medieval_house.js — Casa Medieval Bíblica
// Casa modesta de aldea con techo de barro

function generateMedievalHouse() {
  const blocks = [];
  const COBBLE = "minecraft:cobblestone";
  const OAK = "minecraft:oak_planks";
  const DOAK_STAIRS = "minecraft:dark_oak_stairs";
  const GLASS = "minecraft:glass_pane";
  const SMOOTH = "minecraft:smooth_stone";
  const CRAFTING = "minecraft:crafting_table";
  const FURNACE = "minecraft:furnace";
  const CHEST = "minecraft:chest";
  const CAMPFIRE = "minecraft:campfire";
  const DIRT = "minecraft:dirt";

  const W = 12; // ancho (x)
  const D = 10; // profundidad (z)
  const WH = 5; // altura paredes

  // ── Cimientos (y=0) ──
  for (let x = 0; x < W; x++)
    for (let z = 0; z < D; z++)
      blocks.push([x, 0, z, COBBLE]);

  // ── Piso interior (y=1) ──
  for (let x = 1; x < W - 1; x++)
    for (let z = 1; z < D - 1; z++)
      blocks.push([x, 1, z, SMOOTH]);

  // ── Paredes (y=1 a WH) ──
  for (let y = 1; y <= WH; y++) {
    // Pared frontal (z=0) — hueco para puerta en x=5,6 y=1..2
    for (let x = 0; x < W; x++) {
      const isDoor = (x === 5 || x === 6) && y <= 2;
      if (!isDoor) {
        const isCorner = x === 0 || x === W - 1;
        blocks.push([x, y, 0, isCorner ? COBBLE : OAK]);
      }
    }
    // Pared trasera (z=D-1)
    for (let x = 0; x < W; x++) {
      const isCorner = x === 0 || x === W - 1;
      blocks.push([x, y, D - 1, isCorner ? COBBLE : OAK]);
    }
    // Paredes laterales (x=0 y x=W-1)
    for (let z = 1; z < D - 1; z++) {
      blocks.push([0, y, z, COBBLE]);
      blocks.push([W - 1, y, z, COBBLE]);
    }
  }

  // ── Ventanas (glass_pane a y=3) ──
  // Frontal
  blocks.push([3, 3, 0, GLASS]);
  blocks.push([8, 3, 0, GLASS]);
  // Trasera
  blocks.push([3, 3, D - 1, GLASS]);
  blocks.push([8, 3, D - 1, GLASS]);
  // Laterales
  blocks.push([0, 3, 4, GLASS]);
  blocks.push([0, 3, 7, GLASS]);
  blocks.push([W - 1, 3, 4, GLASS]);
  blocks.push([W - 1, 3, 7, GLASS]);

  // ── Techo A-frame (escaleras de dark oak) ──
  // El techo sube desde los bordes hacia el centro (ridge en x=5,6)
  const halfW = Math.floor(W / 2); // 6
  for (let z = -1; z <= D; z++) {
    for (let i = 0; i < halfW; i++) {
      const ry = WH + 1 + i;
      // Pendiente izquierda (ascendente hacia el este)
      blocks.push([i - 1, ry, z, DOAK_STAIRS, { "weirdo_direction": 0 }]);
      // Pendiente derecha (ascendente hacia el oeste)
      blocks.push([W - i, ry, z, DOAK_STAIRS, { "weirdo_direction": 1 }]);
    }
    // Cresta central
    blocks.push([halfW - 1, WH + halfW, z, OAK]);
    blocks.push([halfW, WH + halfW, z, OAK]);
  }

  // ── Capa de "barro" sobre el techo ──
  for (let z = 0; z < D; z++) {
    blocks.push([halfW - 1, WH + halfW + 1, z, DIRT]);
    blocks.push([halfW, WH + halfW + 1, z, DIRT]);
  }

  // ── Paredes del frontón (triángulos en z=0 y z=D-1) ──
  for (let i = 0; i < halfW; i++) {
    const ry = WH + 1 + i;
    for (let x = i; x < W - i; x++) {
      blocks.push([x, ry, 0, OAK]);
      blocks.push([x, ry, D - 1, OAK]);
    }
  }

  // ── Interior: mobiliario ──
  blocks.push([1, 1, 1, CRAFTING]);
  blocks.push([2, 1, 1, FURNACE]);
  blocks.push([W - 2, 1, 1, CHEST]);

  // ── Fogata exterior ──
  blocks.push([5, 1, -2, CAMPFIRE]);
  blocks.push([6, 1, -2, CAMPFIRE]);

  return blocks;
}

export const medieval_house = {
  id: "medieval_house",
  name: "Casa Medieval",
  category: "edificios",
  description: "Casa modesta de aldea bíblica",
  blocks: generateMedievalHouse()
};
