// altar.js — Altar del Holocausto — Éxodo 27:1-8, Levítico 1
// 5 codos largo × 5 codos ancho × 3 codos alto
// Madera de acacia revestida de BRONCE, 4 cuernos, rejilla de bronce

function generateAltar() {
  const blocks = [];
  const COPPER = "minecraft:copper_block";       // Bronce (Éx 27:2)
  const CUT_COPPER = "minecraft:cut_copper";     // Bronce labrado
  const ACACIA = "minecraft:acacia_planks";       // Madera de acacia interior (Éx 27:1)
  const IRON = "minecraft:iron_bars";             // Rejilla de bronce (Éx 27:4)
  const NETHER = "minecraft:netherrack";
  const FIRE = "minecraft:fire";
  const COPPER_STAIRS = "minecraft:cut_copper_stairs"; // Rampa

  // Escala: 5 codos ≈ 5 bloques, 3 codos alto ≈ 3 bloques

  // ── Base de bronce (y=0): 7×7 con borde ──
  for (let x = 0; x < 7; x++)
    for (let z = 0; z < 7; z++)
      blocks.push([x, 0, z, COPPER]);

  // ── Cuerpo del altar (y=1): acacia interna, bronce exterior ──
  for (let x = 0; x < 7; x++)
    for (let z = 0; z < 7; z++) {
      const isEdge = x === 0 || x === 6 || z === 0 || z === 6;
      blocks.push([x, 1, z, isEdge ? CUT_COPPER : ACACIA]);
    }

  // ── Rejilla de bronce a media altura — Éx 27:4-5 ──
  for (let x = 1; x < 6; x++)
    for (let z = 1; z < 6; z++)
      blocks.push([x, 2, z, IRON]);
  // Bordes de bronce
  for (let x = 0; x < 7; x++) {
    blocks.push([x, 2, 0, CUT_COPPER]);
    blocks.push([x, 2, 6, CUT_COPPER]);
  }
  for (let z = 1; z < 6; z++) {
    blocks.push([0, 2, z, CUT_COPPER]);
    blocks.push([6, 2, z, CUT_COPPER]);
  }

  // ── Superficie superior (y=3): bronce ──
  for (let x = 1; x < 6; x++)
    for (let z = 1; z < 6; z++)
      blocks.push([x, 3, z, CUT_COPPER]);

  // ── Fuego perpetuo en centro — Levítico 6:13 ──
  blocks.push([2, 3, 2, NETHER]);
  blocks.push([3, 3, 3, NETHER]);
  blocks.push([4, 3, 4, NETHER]);
  blocks.push([3, 3, 4, NETHER]);
  blocks.push([2, 4, 2, FIRE]);
  blocks.push([3, 4, 3, FIRE]);
  blocks.push([4, 4, 4, FIRE]);
  blocks.push([3, 4, 4, FIRE]);

  // ── 4 cuernos de bronce — Éx 27:2 ──
  blocks.push([0, 3, 0, COPPER]);
  blocks.push([6, 3, 0, COPPER]);
  blocks.push([0, 3, 6, COPPER]);
  blocks.push([6, 3, 6, COPPER]);
  blocks.push([0, 4, 0, COPPER]);
  blocks.push([6, 4, 0, COPPER]);
  blocks.push([0, 4, 6, COPPER]);
  blocks.push([6, 4, 6, COPPER]);

  // ── Rampa de acceso (no escalones) — Éx 20:26 ──
  // "No subirás por gradas a mi altar"
  blocks.push([3, 0, 7, CUT_COPPER]);
  blocks.push([3, 0, 8, CUT_COPPER]);
  blocks.push([3, 0, 9, CUT_COPPER]);
  blocks.push([3, 1, 7, COPPER_STAIRS]);
  blocks.push([3, 1, 8, COPPER_STAIRS]);

  // ── Utensilios alrededor — Éx 27:3 ──
  // Calderos, paletas, tazones (representados con caldero)
  blocks.push([7, 1, 3, "minecraft:cauldron"]);

  return blocks;
}

export const altar = {
  id: "altar",
  name: "Altar del Holocausto",
  category: "biblicas",
  description: "Altar de bronce del sacrificio — Éxodo 27:1-8",
  blocks: generateAltar()
};
