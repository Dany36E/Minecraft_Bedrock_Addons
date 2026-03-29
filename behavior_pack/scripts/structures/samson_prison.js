// samson_prison.js — Prisión de Gaza (Jueces 16:21)
// "Y le sacaron los ojos, y le llevaron a Gaza,
//  y le ataron con cadenas de bronce, y estuvo moliendo en la cárcel."

function generateSamsonPrison() {
  const blocks = [];
  const L = 18, W = 14, H = 6;

  // ── Piso: cobblestone ──
  for (let x = 0; x < L; x++) {
    for (let z = 0; z < W; z++) {
      blocks.push([x, 0, z, "minecraft:cobblestone"]);
    }
  }

  // ── Paredes exteriores: stone_bricks (y=1..5) ──
  for (let y = 1; y <= 5; y++) {
    for (let x = 0; x < L; x++) {
      // Pared frontal (z=0) y trasera (z=W-1)
      blocks.push([x, y, 0, "minecraft:stone_bricks"]);
      blocks.push([x, y, W - 1, "minecraft:stone_bricks"]);
    }
    for (let z = 1; z < W - 1; z++) {
      // Pared izquierda (x=0) y derecha (x=L-1)
      blocks.push([0, y, z, "minecraft:stone_bricks"]);
      blocks.push([L - 1, y, z, "minecraft:stone_bricks"]);
    }
  }

  // ── Puerta de hierro (entrada) en x=9, z=0 ──
  // Reemplazar los bloques de pared con aire para el hueco de la puerta
  blocks.push([9, 1, 0, "minecraft:air"]);
  blocks.push([9, 2, 0, "minecraft:air"]);
  blocks.push([9, 3, 0, "minecraft:iron_bars"]); // reja encima de la puerta

  // ── Techo: stone_bricks (y=6) ──
  for (let x = 0; x < L; x++) {
    for (let z = 0; z < W; z++) {
      blocks.push([x, H, z, "minecraft:stone_bricks"]);
    }
  }

  // ── Rueda de moler (centro: x=9, z=6) ──
  // Anillo de stone_brick_wall 3x3 alrededor
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue; // centro libre para grindstone
      blocks.push([9 + dx, 1, 6 + dz, "minecraft:cobblestone_wall"]);
    }
  }
  // Grindstone en el centro (la rueda de moler de Sansón)
  blocks.push([9, 1, 6, "minecraft:grindstone"]);
  // Cadenas colgando del techo al centro
  for (let y = 2; y <= 5; y++) {
    blocks.push([9, y, 6, "minecraft:chain"]);
  }

  // ── Celda interior con rejas de hierro (x=13..16, z=2..11) ──
  // Reja separadora en x=12, z=2..11
  for (let z = 2; z <= 11; z++) {
    for (let y = 1; y <= 4; y++) {
      blocks.push([12, y, z, "minecraft:iron_bars"]);
    }
  }
  // Puerta de la celda (hueco en z=6,7)
  blocks.push([12, 1, 6, "minecraft:air"]);
  blocks.push([12, 2, 6, "minecraft:air"]);
  blocks.push([12, 1, 7, "minecraft:air"]);
  blocks.push([12, 2, 7, "minecraft:air"]);

  // Cepo en el suelo de la celda
  blocks.push([14, 1, 6, "minecraft:iron_trapdoor"]);

  // Cadenas en las paredes de la celda
  for (let z = 3; z <= 10; z += 2) {
    blocks.push([L - 2, 2, z, "minecraft:chain"]);
    blocks.push([L - 2, 3, z, "minecraft:chain"]);
  }

  // ── Antorchas tenues (sin ventanas = oscuridad) ──
  const torchPositions = [
    [5, 4, 1], [13, 4, 1],    // pared frontal interior
    [1, 4, 7], [L - 2, 4, 7], // paredes laterales interior
    [5, 4, W - 2], [13, 4, W - 2], // pared trasera interior
  ];
  for (const [tx, ty, tz] of torchPositions) {
    blocks.push([tx, ty, tz, "minecraft:torch"]);
  }

  // ── Detalles de prisión ──
  // Esqueletos de antorchas (soul torch = aspecto más lúgubre)
  blocks.push([3, 3, 1, "minecraft:soul_torch"]);
  blocks.push([15, 3, 1, "minecraft:soul_torch"]);

  return blocks;
}

export const samsonPrison = {
  id: "samson_prison",
  name: "Prisión de Gaza",
  category: "samson",
  description: "La cárcel donde Sansón fue encadenado — Jueces 16:21",
  blocks: generateSamsonPrison(),
};
