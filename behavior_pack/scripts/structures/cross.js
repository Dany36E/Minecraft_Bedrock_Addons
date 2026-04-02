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

  // ── Sepulcro de José de Arimatea — Mateo 27:57-60 ──
  // "lo puso en su sepulcro nuevo, que había labrado en la peña;
  //  y después de hacer rodar una gran piedra a la entrada del sepulcro, se fue."
  const tombX = 0;
  const tombZ = 8; // detrás del Gólgota
  // Colina de roca para el sepulcro
  for (let tx = -3; tx <= 3; tx++)
    for (let tz = tombZ - 1; tz <= tombZ + 4; tz++)
      for (let ty = 0; ty <= 2; ty++) {
        const dist = Math.abs(tx) + Math.abs(tz - tombZ - 1) + ty;
        if (dist <= 5)
          blocks.push([tx, ty, tz, "minecraft:stone"]);
      }
  // Cámara interior (hueca, 3×2×2)
  for (let tx = -1; tx <= 1; tx++)
    for (let tz = tombZ + 1; tz <= tombZ + 3; tz++)
      for (let ty = 1; ty <= 2; ty++)
        blocks.push([tx, ty, tz, "minecraft:air"]);
  // Banco de piedra donde reposó el cuerpo — Marcos 15:46
  blocks.push([1, 1, tombZ + 2, "minecraft:smooth_stone_slab"]);
  blocks.push([1, 1, tombZ + 3, "minecraft:smooth_stone_slab"]);
  // Entrada del sepulcro (abertura)
  blocks.push([0, 1, tombZ, "minecraft:air"]);
  blocks.push([0, 2, tombZ, "minecraft:air"]);
  // Gran piedra rodada a un lado — Mateo 28:2 "removió la piedra"
  blocks.push([2, 1, tombZ, "minecraft:cobblestone"]);
  // Lienzos dejados — Juan 20:6-7
  blocks.push([0, 1, tombZ + 2, "minecraft:white_carpet"]);

  return blocks;
}

export const cross = {
  id: "cross",
  name: "Cruz del Gólgota",
  category: "monumentos",
  description: "Las tres cruces y el sepulcro vacío — Juan 19, Mateo 27-28",
  blocks: generateCross()
};
