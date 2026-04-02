// ark_covenant.js — Arca del Pacto — Éxodo 25:10-22
// Cofre dorado con querubines, varas de transporte, y plataforma

function generateArkCovenant() {
  const blocks = [];
  const GOLD = "minecraft:gold_block";
  const OGOLD = "minecraft:raw_gold_block";
  const ACACIA = "minecraft:acacia_log";
  const FENCE = "minecraft:acacia_fence";
  const BLUE = "minecraft:blue_wool";
  const PURPLE = "minecraft:purple_wool";
  const LAMP = "minecraft:sea_lantern";

  // Platform of blue/purple cloth (Éxodo 26)
  for (let x = -3; x <= 3; x++)
    for (let z = -2; z <= 2; z++) {
      const mat = (Math.abs(x) + Math.abs(z)) % 2 === 0 ? BLUE : PURPLE;
      blocks.push([x, 0, z, mat]);
    }

  // Ark body — 2.5 codos largo, 1.5 ancho, 1.5 alto scaled
  // Base layer (y=1)
  for (let x = -2; x <= 2; x++)
    for (let z = -1; z <= 1; z++)
      blocks.push([x, 1, z, GOLD]);

  // Walls (y=2)
  for (let x = -2; x <= 2; x++) {
    blocks.push([x, 2, -1, GOLD]);
    blocks.push([x, 2, 1, GOLD]);
  }
  for (let z = -1; z <= 1; z++) {
    blocks.push([-2, 2, z, GOLD]);
    blocks.push([2, 2, z, GOLD]);
  }

  // Lid — the Mercy Seat (kapporet)
  for (let x = -2; x <= 2; x++)
    for (let z = -1; z <= 1; z++)
      blocks.push([x, 3, z, OGOLD]);

  // Cherubim on the lid (facing each other)
  // Left cherub
  blocks.push([-1, 4, 0, GOLD]);
  blocks.push([-1, 5, 0, GOLD]);
  blocks.push([-2, 5, 0, GOLD]); // wing spread
  blocks.push([0, 5, 0, GOLD]);  // wing toward center

  // Right cherub
  blocks.push([1, 4, 0, GOLD]);
  blocks.push([1, 5, 0, GOLD]);
  blocks.push([2, 5, 0, GOLD]);  // wing spread
  blocks.push([0, 5, 0, GOLD]);  // wing toward center (overlap, deduped by game)

  // Carrying poles — Éx 25:13-15 acacia revestida de ORO (no madera sola)
  // "Nunca se quitarán las varas del arca"
  for (let x = -2; x <= 2; x++) {
    blocks.push([x, 1, -2, GOLD]);
    blocks.push([x, 1, 2, GOLD]);
  }
  // Pole extensions
  blocks.push([-3, 1, -2, GOLD]);
  blocks.push([3, 1, -2, GOLD]);
  blocks.push([-3, 1, 2, GOLD]);
  blocks.push([3, 1, 2, GOLD]);

  // Corner rings (gold)
  blocks.push([-2, 1, -2, GOLD]);
  blocks.push([2, 1, -2, GOLD]);
  blocks.push([-2, 1, 2, GOLD]);
  blocks.push([2, 1, 2, GOLD]);

  // Light above (Shekinah glory)
  blocks.push([0, 6, 0, LAMP]);

  return blocks;
}

export const arkCovenant = {
  id: "ark_covenant",
  name: "Arca del Pacto",
  category: "sagrado",
  description: "El Arca del Pacto con los querubines — Éxodo 25",
  blocks: generateArkCovenant(),
};
