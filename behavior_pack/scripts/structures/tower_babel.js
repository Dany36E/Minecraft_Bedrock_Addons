// tower_babel.js — Torre de Babel — Génesis 11:1-9
// "Vamos, hagamos ladrillo y cozámoslo con fuego.
//  Y les sirvió el ladrillo en lugar de piedra,
//  y el asfalto [betún] en lugar de mezcla." — Gn 11:3
// Zigurat escalonado de 4 niveles con rampa en espiral

function generateTowerBabel() {
  const blocks = [];
  const BRICK = "minecraft:brick_block";         // "Hagamos ladrillo" (Gn 11:3)
  const MUD = "minecraft:mud_bricks";             // Ladrillos de barro/adobe
  const ASPHALT = "minecraft:blackstone";          // "Asfalto/betún" como mezcla (Gn 11:3)
  const NETHER = "minecraft:nether_bricks";        // Ladrillos cocidos oscuros
  const SAND_SM = "minecraft:smooth_sandstone";
  const NBRICK_FENCE = "minecraft:nether_brick_fence";

  // 4 niveles escalonados + cima
  const tiers = [
    { size: 24, height: 10, y: 0 },
    { size: 18, height: 10, y: 10 },
    { size: 12, height: 10, y: 20 },
    { size: 6, height: 10, y: 30 },
  ];

  for (const tier of tiers) {
    const s = tier.size;
    const h = tier.height;
    const by = tier.y;
    const offset = Math.floor((24 - s) / 2);

    // Paredes exteriores: ladrillo cocido + betún en las juntas
    for (let y = by; y < by + h; y++) {
      // Alternar ladrillo y betún/asfalto según Gn 11:3
      const mat = y % 3 === 0 ? ASPHALT : (y % 3 === 1 ? BRICK : NETHER);
      for (let x = offset; x < offset + s; x++) {
        blocks.push([x, y, offset, mat]);
        blocks.push([x, y, offset + s - 1, mat]);
      }
      for (let z = offset + 1; z < offset + s - 1; z++) {
        blocks.push([offset, y, z, mat]);
        blocks.push([offset + s - 1, y, z, mat]);
      }
    }

    // Piso de cada nivel — ladrillo
    for (let x = offset; x < offset + s; x++)
      for (let z = offset; z < offset + s; z++)
        blocks.push([x, by, z, BRICK]);

    // Borde superior decorativo— asfalto
    for (let x = offset; x < offset + s; x++) {
      blocks.push([x, by + h, offset, ASPHALT]);
      blocks.push([x, by + h, offset + s - 1, ASPHALT]);
    }
    for (let z = offset + 1; z < offset + s - 1; z++) {
      blocks.push([offset, by + h, z, ASPHALT]);
      blocks.push([offset + s - 1, by + h, z, ASPHALT]);
    }
  }

  // ── Cima INACABADA (y=40-44) — Gn 11:8 "dejaron de edificar" ──
  for (let x = 10; x < 14; x++)
    for (let z = 10; z < 14; z++)
      blocks.push([x, 40, z, BRICK]);
  // Pilares abandonados a medio construir
  for (let y = 41; y <= 45; y++) {
    blocks.push([10, y, 10, NBRICK_FENCE]);
    blocks.push([13, y, 10, NBRICK_FENCE]);
    blocks.push([10, y, 13, NBRICK_FENCE]);
    blocks.push([13, y, 13, NBRICK_FENCE]);
  }
  // Ladrillos tirados (construcción abandonada)
  blocks.push([11, 41, 11, BRICK]);
  blocks.push([12, 41, 12, NETHER]);
  blocks.push([11, 41, 13, BRICK]);

  // ── Rampa en espiral exterior (2 bloques de ancho) ──
  // La rampa sube por los 4 lados en secuencia: sur→este→norte→oeste
  let rampY = 0;
  const rampW = 2;
  const totalRampH = 40; // sube hasta nivel 40
  const baseS = 24;

  // Genero la rampa como una serie de tramos rectos por los 4 lados
  while (rampY < totalRampH) {
    // Cada vuelta completa sube ~8 bloques en los 4 lados
    const sides = [
      { dx: 1, dz: 0, startX: 0, startZ: -1, len: baseS },  // lado sur → este
      { dx: 0, dz: 1, startX: baseS, startZ: 0, len: baseS }, // lado este → norte
      { dx: -1, dz: 0, startX: baseS, startZ: baseS, len: baseS }, // lado norte → oeste
      { dx: 0, dz: -1, startX: -1, startZ: baseS, len: baseS },    // lado oeste → sur
    ];

    for (const side of sides) {
      if (rampY >= totalRampH) break;
      const stepsPer = Math.ceil(side.len / 3); // sube 1 bloque cada 3 horizontales
      for (let i = 0; i < side.len && rampY < totalRampH; i++) {
        const rx = side.startX + side.dx * i;
        const rz = side.startZ + side.dz * i;
        if (rx >= -1 && rx <= baseS && rz >= -1 && rz <= baseS) {
          blocks.push([rx, rampY, rz, SAND_SM]);
          // Ancho de 2
          blocks.push([rx + (side.dz !== 0 ? 1 : 0), rampY, rz + (side.dx !== 0 ? 1 : 0), SAND_SM]);
        }
        if (i % 3 === 2) rampY++;
      }
    }
  }

  return blocks;
}

export const tower_babel = {
  id: "tower_babel",
  name: "Torre de Babel",
  category: "biblicas",
  description: "Zigurat de ladrillo cocido y betún — Génesis 11:3-4",
  blocks: generateTowerBabel()
};
