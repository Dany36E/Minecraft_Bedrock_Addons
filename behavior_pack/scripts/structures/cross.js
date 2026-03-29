// cross.js — Cruz del Gólgota — Juan 19
// Tres cruces: la central (10 alto) y dos menores (7 alto) a los costados

function generateCross() {
  const blocks = [];
  const LOG = "minecraft:dark_oak_log";
  const COBBLE = "minecraft:cobblestone";

  // ── Cruz central ──
  // Monte Gólgota (base de piedra)
  for (let x = -2; x <= 2; x++)
    for (let z = -1; z <= 1; z++)
      blocks.push([x, 0, z, COBBLE]);
  for (let x = -1; x <= 1; x++)
    for (let z = -2; z <= 2; z++)
      blocks.push([x, 0, z, COBBLE]);
  for (let x = -1; x <= 1; x++)
    for (let z = -1; z <= 1; z++)
      blocks.push([x, 1, z, COBBLE]);
  blocks.push([0, 2, 0, COBBLE]);

  // Poste vertical (y=3 a y=12)
  for (let y = 3; y <= 12; y++)
    blocks.push([0, y, 0, LOG]);

  // Travesaño a y=9 (5 bloques: -2 a +2 en X)
  for (let x = -2; x <= 2; x++)
    blocks.push([x, 9, 0, LOG]);

  // Cartel INRI (bloque de madera en la cima)
  blocks.push([0, 13, 0, "minecraft:oak_planks"]);

  // ── Cruz izquierda (ladrón, offset x=-8) ──
  for (let x = -1; x <= 1; x++)
    for (let z = -1; z <= 1; z++)
      blocks.push([x - 8, 0, z, COBBLE]);
  blocks.push([-8, 1, 0, COBBLE]);
  for (let y = 2; y <= 9; y++)
    blocks.push([-8, y, 0, LOG]);
  for (let x = -1; x <= 1; x++)
    blocks.push([x - 8, 7, 0, LOG]);

  // ── Cruz derecha (ladrón, offset x=+8) ──
  for (let x = -1; x <= 1; x++)
    for (let z = -1; z <= 1; z++)
      blocks.push([x + 8, 0, z, COBBLE]);
  blocks.push([8, 1, 0, COBBLE]);
  for (let y = 2; y <= 9; y++)
    blocks.push([8, y, 0, LOG]);
  for (let x = -1; x <= 1; x++)
    blocks.push([x + 8, 7, 0, LOG]);

  return blocks;
}

export const cross = {
  id: "cross",
  name: "Cruz del Gólgota",
  category: "monumentos",
  description: "Las tres cruces del Calvario — Juan 19",
  blocks: generateCross()
};
