// altar.js — Altar del Holocausto — Levítico 1
// Altar escalonado de piedra con fuego perpetuo

function generateAltar() {
  const blocks = [];
  const STONE = "minecraft:stone_bricks";
  const BLACK = "minecraft:blackstone";
  const NETHER = "minecraft:netherrack";
  const FIRE = "minecraft:fire";
  const STAIRS = "minecraft:stone_brick_stairs";

  // Capa 1 (y=0): 8×8 base
  for (let x = 0; x < 8; x++)
    for (let z = 0; z < 8; z++)
      blocks.push([x, 0, z, STONE]);

  // Capa 2 (y=1): 6×6 centrada
  for (let x = 1; x < 7; x++)
    for (let z = 1; z < 7; z++)
      blocks.push([x, 1, z, STONE]);

  // Capa 3 (y=2): 4×4 centrada
  for (let x = 2; x < 6; x++)
    for (let z = 2; z < 6; z++)
      blocks.push([x, 2, z, STONE]);

  // Superficie superior (y=3): 4×4 blackstone
  for (let x = 2; x < 6; x++)
    for (let z = 2; z < 6; z++)
      blocks.push([x, 3, z, BLACK]);

  // Centro: netherrack + fuego perpetuo
  blocks.push([3, 3, 3, NETHER]);
  blocks.push([4, 3, 3, NETHER]);
  blocks.push([3, 3, 4, NETHER]);
  blocks.push([4, 3, 4, NETHER]);
  blocks.push([3, 4, 3, FIRE]);
  blocks.push([4, 4, 3, FIRE]);
  blocks.push([3, 4, 4, FIRE]);
  blocks.push([4, 4, 4, FIRE]);

  // Cuernos del altar (4 esquinas superiores) — escaleras hacia afuera
  blocks.push([2, 4, 2, STAIRS, { "weirdo_direction": 3 }]);
  blocks.push([5, 4, 2, STAIRS, { "weirdo_direction": 3 }]);
  blocks.push([2, 4, 5, STAIRS, { "weirdo_direction": 2 }]);
  blocks.push([5, 4, 5, STAIRS, { "weirdo_direction": 2 }]);

  // Escalera de acceso (lado sur, z=8)
  blocks.push([3, 0, 8, STAIRS, { "weirdo_direction": 3 }]);
  blocks.push([4, 0, 8, STAIRS, { "weirdo_direction": 3 }]);
  blocks.push([3, 0, 9, STONE]);
  blocks.push([4, 0, 9, STONE]);
  blocks.push([3, 1, 7, STAIRS, { "weirdo_direction": 3 }]);
  blocks.push([4, 1, 7, STAIRS, { "weirdo_direction": 3 }]);

  return blocks;
}

export const altar = {
  id: "altar",
  name: "Altar del Holocausto",
  category: "biblicas",
  description: "El altar de sacrificio — Levítico 1",
  blocks: generateAltar()
};
