// well.js — Pozo Bíblico — Génesis 24
// Pozo con brocal, estructura de madera, cadena y agua

function generateWell() {
  const blocks = [];
  const STONE = "minecraft:cobblestone";
  const MOSS = "minecraft:mossy_cobblestone";
  const WALL = "minecraft:cobblestone_wall";
  const FENCE = "minecraft:spruce_fence";
  const LOG = "minecraft:oak_log";
  const CHAIN = "minecraft:chain";
  const WATER = "minecraft:water";
  const LADDER = "minecraft:ladder";

  // Pozo interior (y=-6 a y=0) — paredes del hueco
  for (let y = -6; y <= 0; y++) {
    const mat = y < -3 ? MOSS : STONE;
    for (let x = -2; x <= 2; x++) {
      blocks.push([x, y, -2, mat]);
      blocks.push([x, y, 2, mat]);
    }
    for (let z = -1; z <= 1; z++) {
      blocks.push([-2, y, z, mat]);
      blocks.push([2, y, z, mat]);
    }
  }

  // Agua en el fondo
  for (let x = -1; x <= 1; x++)
    for (let z = -1; z <= 1; z++)
      blocks.push([x, -6, z, WATER]);

  // Brocal (y=1) — muro bajo de piedra
  for (let x = -2; x <= 2; x++) {
    blocks.push([x, 1, -2, WALL]);
    blocks.push([x, 1, 2, WALL]);
  }
  for (let z = -1; z <= 1; z++) {
    blocks.push([-2, 1, z, WALL]);
    blocks.push([2, 1, z, WALL]);
  }

  // Postes de soporte (y=2 a y=4)
  for (let y = 2; y <= 4; y++) {
    blocks.push([-2, y, 0, FENCE]);
    blocks.push([2, y, 0, FENCE]);
  }

  // Travesaño horizontal (y=5)
  for (let x = -2; x <= 2; x++)
    blocks.push([x, 5, 0, LOG]);

  // Cadena colgando del centro (y=1 a y=4)
  for (let y = 1; y <= 4; y++)
    blocks.push([0, y, 0, CHAIN]);

  // Escalera interior (lado norte)
  for (let y = -5; y <= 0; y++)
    blocks.push([-1, y, -2, LADDER]);

  // Piso alrededor del pozo (decorativo)
  for (let x = -3; x <= 3; x++)
    for (let z = -3; z <= 3; z++) {
      if (Math.abs(x) <= 2 && Math.abs(z) <= 2) continue; // ya cubierto
      blocks.push([x, 0, z, STONE]);
    }

  // ── Abrevadero para camellos — Gn 24:20 ──
  // "Y se dio prisa, y vació su cántaro en la pila,
  //  y corrió otra vez al pozo para sacar agua, y sacó para todos sus camellos."
  for (let x = 4; x <= 7; x++) {
    blocks.push([x, 0, -1, STONE]);
    blocks.push([x, 0, 1, STONE]);
    blocks.push([x, 0, 0, STONE]);
    blocks.push([x, 1, -1, WALL]);
    blocks.push([x, 1, 1, WALL]);
  }
  blocks.push([4, 1, 0, WALL]);
  // Agua en el abrevadero
  blocks.push([5, 1, 0, WATER]);
  blocks.push([6, 1, 0, WATER]);
  blocks.push([7, 1, 0, WALL]);

  return blocks;
}

export const well = {
  id: "well",
  name: "Pozo Bíblico",
  category: "edificios",
  description: "El pozo de Rebeca con abrevadero — Génesis 24",
  blocks: generateWell()
};
