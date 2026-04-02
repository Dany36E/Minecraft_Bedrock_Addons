// davids_tower.js — Torre de David — 2 Samuel 5:9
// Fortaleza de piedra con almenas, escalera interior, y estandarte

function generateDavidsTower() {
  const blocks = [];
  const BRICK = "minecraft:stone_bricks";
  const MBRICK = "minecraft:mossy_stone_bricks";
  const CBRICK = "minecraft:cracked_stone_bricks";
  const STONE = "minecraft:stone";
  const SLAB = "minecraft:stone_brick_slab";
  const STAIR = "minecraft:stone_brick_stairs";
  const FENCE = "minecraft:spruce_fence";
  const PLANK = "minecraft:spruce_planks";
  const TORCH = "minecraft:torch";
  const WALL_BLK = "minecraft:stone_brick_wall";
  const BANNER = "minecraft:white_wool";

  const BASE = 5; // half-width
  const HEIGHT = 22;

  // Foundation (thick base, y=0-1)
  for (let x = -BASE; x <= BASE; x++)
    for (let z = -BASE; z <= BASE; z++) {
      blocks.push([x, 0, z, STONE]);
      blocks.push([x, 1, z, MBRICK]);
    }

  // Tower walls (y=2 to HEIGHT-2)
  for (let y = 2; y < HEIGHT - 2; y++) {
    for (let x = -BASE; x <= BASE; x++) {
      for (let z = -BASE; z <= BASE; z++) {
        const isWall = Math.abs(x) >= BASE - 1 || Math.abs(z) >= BASE - 1;
        const isOuter = Math.abs(x) === BASE || Math.abs(z) === BASE;
        if (isOuter) {
          // Weathered stone mix
          const mat = y < 6 ? MBRICK : (x + y + z) % 7 === 0 ? CBRICK : BRICK;
          blocks.push([x, y, z, mat]);
        } else if (isWall) {
          const mat = y < 4 ? BRICK : BRICK;
          blocks.push([x, y, z, mat]);
        }
      }
    }
    // Floors every 5 levels
    if (y % 5 === 0 && y > 2) {
      for (let x = -(BASE - 2); x <= BASE - 2; x++)
        for (let z = -(BASE - 2); z <= BASE - 2; z++)
          blocks.push([x, y, z, PLANK]);
    }
  }

  // Interior spiral staircase (simplified helical)
  for (let y = 2; y < HEIGHT - 2; y++) {
    const angle = y * 45;
    const rad = (angle * Math.PI) / 180;
    const sx = Math.round(Math.cos(rad) * 2);
    const sz = Math.round(Math.sin(rad) * 2);
    blocks.push([sx, y, sz, STAIR]);
  }

  // Torches on interior walls
  for (let y = 3; y < HEIGHT - 3; y += 4) {
    blocks.push([-(BASE - 1), y, 0, TORCH]);
    blocks.push([BASE - 1, y, 0, TORCH]);
    blocks.push([0, y, -(BASE - 1), TORCH]);
    blocks.push([0, y, BASE - 1, TORCH]);
  }

  // Top platform
  const topY = HEIGHT - 2;
  for (let x = -BASE; x <= BASE; x++)
    for (let z = -BASE; z <= BASE; z++)
      blocks.push([x, topY, z, BRICK]);

  // Battlements (crenellations)
  for (let x = -BASE; x <= BASE; x++) {
    for (let z = -BASE; z <= BASE; z++) {
      const isEdge = Math.abs(x) === BASE || Math.abs(z) === BASE;
      if (isEdge) {
        blocks.push([x, topY + 1, z, BRICK]);
        if ((x + z) % 2 === 0) {
          blocks.push([x, topY + 2, z, WALL_BLK]);
        }
      }
    }
  }

  // Corner turrets (taller pillars at corners)
  const corners = [
    [-BASE, -BASE], [-BASE, BASE], [BASE, -BASE], [BASE, BASE],
  ];
  for (const [cx, cz] of corners) {
    for (let y = topY + 1; y <= topY + 4; y++) {
      blocks.push([cx, y, cz, BRICK]);
    }
    blocks.push([cx, topY + 5, cz, SLAB]);
    // Fence on top
    blocks.push([cx, topY + 5, cz, FENCE]);
  }

  // Banner / flag on top center — Estandarte de David
  blocks.push([0, topY + 1, 0, FENCE]);
  blocks.push([0, topY + 2, 0, FENCE]);
  blocks.push([0, topY + 3, 0, FENCE]);
  blocks.push([0, topY + 3, 1, BANNER]);
  blocks.push([0, topY + 2, 1, BANNER]);

  // ── Escudos colgados — Cantares 4:4 ──
  // "Mil escudos están colgados en ella, todos escudos de valientes"
  for (let y = topY - 2; y <= topY; y += 2) {
    blocks.push([BASE, y, 0, "minecraft:shield"]);
    blocks.push([-BASE, y, 0, "minecraft:shield"]);
    blocks.push([0, y, BASE, "minecraft:shield"]);
    blocks.push([0, y, -BASE, "minecraft:shield"]);
  }

  // Estandartes en las 4 caras exteriores
  blocks.push([BASE, topY - 3, 0, BANNER]);
  blocks.push([-BASE, topY - 3, 0, BANNER]);
  blocks.push([0, topY - 3, BASE, BANNER]);
  blocks.push([0, topY - 3, -BASE, BANNER]);

  // Entrance (south side)
  for (let gx = -1; gx <= 1; gx++) {
    for (let gy = 2; gy <= 4; gy++) {
      blocks.push([gx, gy, BASE, "minecraft:air"]);
      blocks.push([gx, gy, BASE - 1, "minecraft:air"]);
    }
  }
  // Entrance arch
  for (let gx = -1; gx <= 1; gx++) {
    blocks.push([gx, 5, BASE, CBRICK]);
  }

  return blocks;
}

export const davidsTower = {
  id: "davids_tower",
  name: "Torre de David",
  category: "fortalezas",
  description: "La fortaleza de Sión, mil escudos — 2 Samuel 5:9, Cantares 4:4",
  blocks: generateDavidsTower(),
};
