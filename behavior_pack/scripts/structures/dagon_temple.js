// dagon_temple.js — Templo de Dagón (Jueces 16:25-30)
// "Entonces Sansón asió las dos columnas del medio...
//  y se inclinó con toda su fuerza. Y cayó el edificio
//  sobre los señores y sobre todo el pueblo."

function generateDagonTemple() {
  const blocks = [];
  const L = 40, W = 25, H = 20;

  // ── Escalones de acceso (3 peldaños en la entrada) ──
  for (let step = 0; step < 3; step++) {
    for (let z = 10; z <= 14; z++) {
      blocks.push([step, step, z, "minecraft:stone_brick_stairs"]);
    }
  }

  // ── Plataforma base (y=0) ──
  for (let x = 3; x < L; x++) {
    for (let z = 0; z < W; z++) {
      blocks.push([x, 0, z, "minecraft:smooth_stone"]);
    }
  }

  // ── Paredes exteriores (y=1..16, grosor 1) ──
  for (let y = 1; y <= 16; y++) {
    // Pared frontal (x=3) — con apertura central z=10..14, y=1..8
    for (let z = 0; z < W; z++) {
      const isEntrance = z >= 10 && z <= 14 && y <= 8;
      if (!isEntrance) {
        blocks.push([3, y, z, "minecraft:stone_bricks"]);
      }
    }
    // Pared trasera (x=39) — sólida
    for (let z = 0; z < W; z++) {
      blocks.push([L - 1, y, z, "minecraft:stone_bricks"]);
    }
    // Paredes laterales
    for (let x = 4; x < L - 1; x++) {
      blocks.push([x, y, 0, "minecraft:stone_bricks"]);
      blocks.push([x, y, W - 1, "minecraft:stone_bricks"]);
    }
  }

  // ── Refuerzo superior de las paredes (y=17..19) ──
  for (let y = 17; y <= 19; y++) {
    for (let z = 0; z < W; z++) {
      blocks.push([3, y, z, "minecraft:stone_bricks"]);
      blocks.push([L - 1, y, z, "minecraft:stone_bricks"]);
    }
    for (let x = 4; x < L - 1; x++) {
      blocks.push([x, y, 0, "minecraft:stone_bricks"]);
      blocks.push([x, y, W - 1, "minecraft:stone_bricks"]);
    }
  }

  // ── LAS DOS COLUMNAS CENTRALES (las que Sansón derrumbó) ──
  // Columna izquierda: x=20, z=8
  for (let y = 1; y <= 18; y++) {
    blocks.push([20, y, 8, "minecraft:stone_bricks"]);
  }
  // Base de columna izquierda (3x3 slab)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      blocks.push([20 + dx, 1, 8 + dz, "minecraft:stone_brick_slab"]);
    }
  }
  // Capitel superior columna izquierda
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      blocks.push([20 + dx, 18, 8 + dz, "minecraft:stone_brick_slab"]);
    }
  }

  // Columna derecha: x=20, z=16
  for (let y = 1; y <= 18; y++) {
    blocks.push([20, y, 16, "minecraft:stone_bricks"]);
  }
  // Base de columna derecha
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      blocks.push([20 + dx, 1, 16 + dz, "minecraft:stone_brick_slab"]);
    }
  }
  // Capitel superior columna derecha
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      blocks.push([20 + dx, 18, 16 + dz, "minecraft:stone_brick_slab"]);
    }
  }

  // ── Columnas decorativas perimetrales ──
  const decorCols = [
    [8, 2], [8, 22], [14, 2], [14, 22],
    [26, 2], [26, 22], [32, 2], [32, 22],
  ];
  for (const [cx, cz] of decorCols) {
    for (let y = 1; y <= 14; y++) {
      blocks.push([cx, y, cz, "minecraft:stone_bricks"]);
    }
    // Antorcha en la columna
    blocks.push([cx, 12, cz + 1, "minecraft:soul_torch"]);
  }

  // ── Techo (y=19) con hueco sobre columnas centrales ──
  for (let x = 4; x < L - 1; x++) {
    for (let z = 1; z < W - 1; z++) {
      // Hueco sobre las columnas centrales (x=18..22, z=6..18)
      const isHole = x >= 18 && x <= 22 && z >= 6 && z <= 18;
      if (!isHole) {
        blocks.push([x, 19, z, "minecraft:stone_brick_slab"]);
      }
    }
  }

  // ── Altar de Dagón (fondo del templo) ──
  // Base del altar
  for (let x = 35; x <= 38; x++) {
    for (let z = 9; z <= 15; z++) {
      for (let y = 1; y <= 4; y++) {
        blocks.push([x, y, z, "minecraft:nether_bricks"]);
      }
      blocks.push([x, 5, z, "minecraft:blackstone"]);
    }
  }
  // Fuego del altar
  for (let x = 36; x <= 37; x++) {
    for (let z = 11; z <= 13; z++) {
      blocks.push([x, 6, z, "minecraft:fire"]);
    }
  }

  // ── Ídolo de Dagón (mitad hombre, mitad pez) — 1 Samuel 5:4 ──
  // "Y la cabeza de Dagón y las dos palmas de sus manos estaban cortadas
  //  sobre el umbral" (caído ante el Arca)
  const idolX = 37, idolZ = 12;
  // Cuerpo del ídolo (sobre el altar)
  blocks.push([idolX, 6, idolZ, "minecraft:prismarine"]); // cola de pez (base)
  blocks.push([idolX, 7, idolZ, "minecraft:dark_prismarine"]); // torso
  blocks.push([idolX, 8, idolZ, "minecraft:prismarine_bricks"]); // pecho
  blocks.push([idolX, 9, idolZ, "minecraft:carved_pumpkin"]); // cabeza
  // Brazos extendidos
  blocks.push([idolX - 1, 8, idolZ, "minecraft:prismarine"]);
  blocks.push([idolX + 1, 8, idolZ, "minecraft:prismarine"]);

  // ── Gradas laterales (donde estaban los 3,000 filisteos) ──
  // Lado izquierdo: z=2..5
  for (let row = 0; row < 4; row++) {
    const z = 2 + row;
    const y = 1 + row;
    for (let x = 5; x <= 35; x++) {
      blocks.push([x, y, z, "minecraft:oak_stairs"]);
    }
  }
  // Lado derecho: z=22..19 (espejado)
  for (let row = 0; row < 4; row++) {
    const z = 22 - row;
    const y = 1 + row;
    for (let x = 5; x <= 35; x++) {
      blocks.push([x, y, z, "minecraft:oak_stairs"]);
    }
  }

  // ── Pasillo central (alfombra) ──
  for (let x = 5; x <= 33; x++) {
    for (let z = 10; z <= 14; z++) {
      blocks.push([x, 1, z, "minecraft:purple_wool"]);
    }
  }

  // ── Antorchas adicionales en las paredes ──
  for (let x = 8; x <= 34; x += 6) {
    blocks.push([x, 10, 1, "minecraft:soul_torch"]);
    blocks.push([x, 10, W - 2, "minecraft:soul_torch"]);
  }

  return blocks;
}

export const dagonTemple = {
  id: "dagon_temple",
  name: "Templo de Dagón",
  category: "samson",
  description: "Donde Sansón derrumbó las columnas — Jueces 16:29-30",
  blocks: generateDagonTemple(),
};
