// pyramid.js — Pirámide de Arena
// Pirámide escalonada de arenisca

function generatePyramid() {
  const blocks = [];
  const SAND = "minecraft:sandstone";
  const SMOOTH = "minecraft:smooth_sandstone";

  const BASE = 30;
  const H = 20;
  const shrinkPerLevel = BASE / (2 * H); // cuánto se reduce por nivel

  for (let y = 0; y < H; y++) {
    const inset = Math.floor(y * shrinkPerLevel * 2);
    const size = BASE - inset * 2;
    if (size <= 0) break;
    const mat = y % 4 === 0 ? SMOOTH : SAND;

    // Solo las paredes exteriores (cáscara) + piso base
    if (y === 0) {
      // Piso sólido base
      for (let x = inset; x < inset + size; x++)
        for (let z = inset; z < inset + size; z++)
          blocks.push([x, y, z, mat]);
    } else {
      // Solo bordes
      for (let x = inset; x < inset + size; x++) {
        blocks.push([x, y, inset, mat]);
        blocks.push([x, y, inset + size - 1, mat]);
      }
      for (let z = inset + 1; z < inset + size - 1; z++) {
        blocks.push([inset, y, z, mat]);
        blocks.push([inset + size - 1, y, z, mat]);
      }
    }
  }

  // Cima (bloque dorado)
  const topInset = Math.floor(H * shrinkPerLevel * 2);
  blocks.push([Math.floor(BASE / 2), H, Math.floor(BASE / 2), "minecraft:gold_block"]);

  // Entrada (lado norte, base)
  const mid = Math.floor(BASE / 2);
  for (let y = 1; y <= 3; y++) {
    blocks.push([mid, y, 0, "minecraft:air"]);
    blocks.push([mid - 1, y, 0, "minecraft:air"]);
  }

  // Pasillo interior hacia el centro
  for (let z = 1; z <= mid; z++) {
    blocks.push([mid, 1, z, SMOOTH]);
    blocks.push([mid - 1, 1, z, SMOOTH]);
    for (let y = 2; y <= 3; y++) {
      blocks.push([mid, y, z, "minecraft:air"]);
      blocks.push([mid - 1, y, z, "minecraft:air"]);
    }
  }

  // Cámara interior central (5x5x4)
  const cx = mid - 2;
  const cz = mid - 2;
  for (let x = cx; x < cx + 5; x++)
    for (let z = cz; z < cz + 5; z++) {
      blocks.push([x, 1, z, SMOOTH]);
      for (let y = 2; y <= 4; y++)
        blocks.push([x, y, z, "minecraft:air"]);
    }

  // Cofre en la cámara
  blocks.push([mid, 1, mid, "minecraft:chest"]);

  return blocks;
}

export const pyramid = {
  id: "pyramid",
  name: "Pirámide de Arena",
  category: "monumentos",
  description: "Pirámide monumental de arenisca",
  blocks: generatePyramid()
};
