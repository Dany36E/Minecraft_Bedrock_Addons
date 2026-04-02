// church.js — Iglesia con Campanario
// Nave principal + campanario frontal + interior con bancas

function generateChurch() {
  const blocks = [];
  const STONE = "minecraft:stone_bricks";
  const SMOOTH = "minecraft:smooth_stone";
  const STONE_STAIRS = "minecraft:stone_brick_stairs";
  const STAINED = "minecraft:purple_stained_glass";
  const IRON = "minecraft:iron_bars";
  const OAK_STAIRS = "minecraft:oak_stairs";
  const OAK = "minecraft:oak_planks";
  const DOAK_FENCE = "minecraft:dark_oak_fence";
  const IRON_TRAP = "minecraft:iron_trapdoor";

  const NW = 12; // ancho nave (x)
  const NL = 18; // largo nave (z)
  const NH = 8;  // altura paredes nave
  const TW = 6;  // ancho campanario
  const TH = 20; // altura campanario

  // Offset del campanario (centrado frontalmente)
  const TX = Math.floor((NW - TW) / 2); // 3

  // ── Piso (y=0) ──
  for (let x = 0; x < NW; x++)
    for (let z = 0; z < NL; z++)
      blocks.push([x, 0, z, SMOOTH]);

  // ── Paredes de la nave (y=1 a NH) ──
  for (let y = 1; y <= NH; y++) {
    // Pared norte (z=0) y sur (z=NL-1)
    for (let x = 0; x < NW; x++) {
      blocks.push([x, y, 0, STONE]);
      blocks.push([x, y, NL - 1, STONE]);
    }
    // Paredes laterales (x=0 y x=NW-1)
    for (let z = 1; z < NL - 1; z++) {
      blocks.push([0, y, z, STONE]);
      blocks.push([NW - 1, y, z, STONE]);
    }
  }

  // ── Puerta frontal doble (z=0, x=5-6, y=1-3) ──
  for (let x = 5; x <= 6; x++)
    for (let y = 1; y <= 3; y++)
      blocks.push([x, y, 0, "minecraft:air"]);

  // ── Ventanas vitrales (cada 4 bloques en paredes laterales) ──
  for (let z = 3; z < NL - 1; z += 4) {
    // y=3 a y=5 — vitrales con barras
    for (let y = 3; y <= 5; y++) {
      blocks.push([0, y, z, STAINED]);
      blocks.push([NW - 1, y, z, STAINED]);
      if (y === 4) {
        blocks.push([0, y, z, IRON]);
        blocks.push([NW - 1, y, z, IRON]);
      }
    }
  }

  // ── Techo A-frame de la nave ──
  const halfNW = Math.floor(NW / 2); // 6
  for (let z = -1; z <= NL; z++) {
    for (let i = 0; i < halfNW; i++) {
      const ry = NH + 1 + i;
      blocks.push([i - 1, ry, z, STONE_STAIRS, { "weirdo_direction": 0 }]);
      blocks.push([NW - i, ry, z, STONE_STAIRS, { "weirdo_direction": 1 }]);
    }
    // Cresta
    blocks.push([halfNW - 1, NH + halfNW, z, STONE]);
    blocks.push([halfNW, NH + halfNW, z, STONE]);
  }

  // Frontones (triángulo en z=0 y z=NL-1)
  for (let i = 0; i < halfNW; i++) {
    const ry = NH + 1 + i;
    for (let x = i; x < NW - i; x++) {
      blocks.push([x, ry, 0, STONE]);
      blocks.push([x, ry, NL - 1, STONE]);
    }
  }

  // ── Campanario (sobre z=0, centrado en x) ──
  for (let y = 1; y <= TH; y++) {
    for (let x = TX; x < TX + TW; x++) {
      blocks.push([x, y, -1, STONE]);
      blocks.push([x, y, -TW, STONE]);
    }
    for (let z = -1; z >= -TW; z--) {
      blocks.push([TX, y, z, STONE]);
      blocks.push([TX + TW - 1, y, z, STONE]);
    }
  }

  // Arcos del campanario (aberturas en y=TH-3 a TH-1 en cada cara)
  for (let y = TH - 3; y <= TH - 1; y++) {
    for (let x = TX + 1; x < TX + TW - 1; x++) {
      blocks.push([x, y, -1, "minecraft:air"]);
      blocks.push([x, y, -TW, "minecraft:air"]);
    }
    for (let z = -2; z >= -TW + 1; z--) {
      blocks.push([TX, y, z, "minecraft:air"]);
      blocks.push([TX + TW - 1, y, z, "minecraft:air"]);
    }
  }

  // Campana (iron bars + iron trapdoor)
  blocks.push([TX + 2, TH - 2, -3, IRON]);
  blocks.push([TX + 3, TH - 2, -3, IRON]);
  blocks.push([TX + 2, TH - 1, -3, IRON_TRAP]);
  blocks.push([TX + 3, TH - 1, -3, IRON_TRAP]);

  // Piso del campanario
  for (let x = TX; x < TX + TW; x++)
    for (let z = -1; z >= -TW; z--)
      blocks.push([x, TH, z, STONE]);

  // ── Cruz en la cima del campanario ──
  const crossX = TX + Math.floor(TW / 2);
  const crossZ = Math.floor(-TW / 2);
  for (let y = TH + 1; y <= TH + 4; y++)
    blocks.push([crossX, y, crossZ, DOAK_FENCE]);
  blocks.push([crossX - 1, TH + 3, crossZ, DOAK_FENCE]);
  blocks.push([crossX + 1, TH + 3, crossZ, DOAK_FENCE]);

  // ── Interior: bancas (oak stairs) en 4 filas ──
  for (let row = 0; row < 4; row++) {
    const rz = 3 + row * 3;
    for (let x = 2; x <= 4; x++)
      blocks.push([x, 1, rz, OAK_STAIRS, { "weirdo_direction": 3 }]);
    for (let x = 7; x <= 9; x++)
      blocks.push([x, 1, rz, OAK_STAIRS, { "weirdo_direction": 3 }]);
  }

  // Altar al fondo de la nave
  for (let x = 4; x <= 7; x++) {
    blocks.push([x, 1, NL - 2, STONE]);
    blocks.push([x, 2, NL - 2, OAK]);
  }

  // ── Interior: alfombra roja por el pasillo central ──
  for (let z = 1; z < NL - 2; z++) {
    blocks.push([5, 1, z, "minecraft:red_carpet"]);
    blocks.push([6, 1, z, "minecraft:red_carpet"]);
  }

  // ── Interior: candelabros (fence + torch) cada 3 filas ──
  for (let z = 2; z < NL - 2; z += 3) {
    blocks.push([1, 1, z, DOAK_FENCE]);
    blocks.push([1, 2, z, "minecraft:torch"]);
    blocks.push([NW - 2, 1, z, DOAK_FENCE]);
    blocks.push([NW - 2, 2, z, "minecraft:torch"]);
  }

  // ── Interior: alfombra roja detrás del altar ──
  for (let x = 3; x <= 8; x++)
    blocks.push([x, 1, NL - 3, "minecraft:red_carpet"]);

  // ── Interior: atril del predicador ──
  blocks.push([5, 1, NL - 4, DOAK_FENCE]);
  blocks.push([5, 2, NL - 4, "minecraft:dark_oak_pressure_plate"]);

  return blocks;
}

export const church = {
  id: "church",
  name: "Iglesia con Campanario",
  category: "edificios",
  description: "Iglesia cristiana con nave, vitrales y campanario",
  blocks: generateChurch()
};
