// hub_structure.js — Hub central del Brawl Master
// Plataforma compacta con pedestales direccionales hacia las arenas
//
// Layout (21×4×13):
//
//     [Showdown 45×45]  ←6 bloques→  [HUB 21×13]  ←6 bloques→  [BB 27×45]
//           (oeste)                    (centro)                   (este)
//
//   ┌───────────────────────────────┐
//   │ P P P P P P P P P P P P P P P P P P P P P │  P = polished_blackstone
//   │ P . . . . L . . . T . . . L . . . . . . P │  . = polished_deepslate
//   │ P . G . . . . . . T . . . . . . . G . . P │  T = deepslate_tiles
//   │ P . . . . . . . . T . . . . . . . . . . P │  L = sea_lantern
//   │ P O O . . . . . T T T . . . . . . E E . P │  G = gold_block
//   │ P O💀O . . L . .[♦]. . L . . . O⚽O . . P │  O = pedestal blocks
//   │ P O O . . . . . T T T . . . . . . E E . P │  E = emerald pedestal
//   │ P . . . . . . . . T . . . . . . . . . . P │  ♦ = diamond_block
//   │ P . G . . . . . . T . . . . . . . G . . P │
//   │ P . . . . L . . . T . . . L . . . . . . P │
//   │ P P P P P P P P P P P P P P P P P P P P P │
//   └───────────────────────────────┘

function generateBlocks() {
  const m = new Map();
  const W = 21, L = 13;

  function set(x, y, z, t) { m.set(`${x},${y},${z}`, [x, y, z, t]); }
  function fillXZ(y, x1, z1, x2, z2, t) {
    for (let x = x1; x <= x2; x++)
      for (let z = z1; z <= z2; z++) set(x, y, z, t);
  }

  // ════════════════════════════════════
  // Y=0: PISO
  // ════════════════════════════════════

  // Base completa
  fillXZ(0, 0, 0, W - 1, L - 1, "minecraft:polished_deepslate");

  // Borde perimetral
  for (let x = 0; x < W; x++) {
    set(x, 0, 0, "minecraft:polished_blackstone");
    set(x, 0, L - 1, "minecraft:polished_blackstone");
  }
  for (let z = 0; z < L; z++) {
    set(0, 0, z, "minecraft:polished_blackstone");
    set(W - 1, 0, z, "minecraft:polished_blackstone");
  }

  // Franja central decorativa (X=9..11, camino norte-sur)
  for (let z = 1; z < L - 1; z++) set(10, 0, z, "minecraft:deepslate_tiles");
  // Ensanche central (cruz)
  set(9, 0, 5, "minecraft:deepslate_tiles");
  set(11, 0, 5, "minecraft:deepslate_tiles");
  set(9, 0, 6, "minecraft:deepslate_tiles");
  set(11, 0, 6, "minecraft:deepslate_tiles");
  set(9, 0, 7, "minecraft:deepslate_tiles");
  set(11, 0, 7, "minecraft:deepslate_tiles");

  // ── Centro: diamante ──
  set(10, 0, 6, "minecraft:diamond_block");

  // ── Pedestal Supervivencia (izquierda, X=2..4) ──
  set(2, 0, 5, "minecraft:gilded_blackstone");
  set(3, 0, 5, "minecraft:crying_obsidian");
  set(4, 0, 5, "minecraft:gilded_blackstone");
  set(2, 0, 6, "minecraft:crying_obsidian");
  set(3, 0, 6, "minecraft:obsidian");         // Base central
  set(4, 0, 6, "minecraft:crying_obsidian");
  set(2, 0, 7, "minecraft:gilded_blackstone");
  set(3, 0, 7, "minecraft:crying_obsidian");
  set(4, 0, 7, "minecraft:gilded_blackstone");

  // ── Pedestal Balón Brawl (derecha, X=16..18) ──
  set(16, 0, 5, "minecraft:gilded_blackstone");
  set(17, 0, 5, "minecraft:emerald_block");
  set(18, 0, 5, "minecraft:gilded_blackstone");
  set(16, 0, 6, "minecraft:emerald_block");
  set(17, 0, 6, "minecraft:lime_concrete");    // Base central
  set(18, 0, 6, "minecraft:emerald_block");
  set(16, 0, 7, "minecraft:gilded_blackstone");
  set(17, 0, 7, "minecraft:emerald_block");
  set(18, 0, 7, "minecraft:gilded_blackstone");

  // ── Iluminación empotrada (simétrica) ──
  set(5, 0, 2, "minecraft:sea_lantern");
  set(5, 0, 10, "minecraft:sea_lantern");
  set(15, 0, 2, "minecraft:sea_lantern");
  set(15, 0, 10, "minecraft:sea_lantern");
  set(7, 0, 6, "minecraft:sea_lantern");
  set(13, 0, 6, "minecraft:sea_lantern");

  // ── Acentos dorados en esquinas interiores ──
  set(2, 0, 2, "minecraft:gold_block");
  set(18, 0, 2, "minecraft:gold_block");
  set(2, 0, 10, "minecraft:gold_block");
  set(18, 0, 10, "minecraft:gold_block");

  // ── Caminos de salida (color → arena) ──
  // Izquierdo → naranja/rojo (Supervivencia, peligro)
  set(0, 0, 5, "minecraft:orange_concrete");
  set(0, 0, 6, "minecraft:red_concrete");
  set(0, 0, 7, "minecraft:orange_concrete");
  // Derecho → verde lima (Balón Brawl, deportivo)
  set(W - 1, 0, 5, "minecraft:lime_concrete");
  set(W - 1, 0, 6, "minecraft:green_concrete");
  set(W - 1, 0, 7, "minecraft:lime_concrete");

  // ════════════════════════════════════
  // Y=1: MUROS, PEDESTALES, ILUMINACIÓN
  // ════════════════════════════════════

  // Pilares de esquina (3 bloques de alto: Y=1,2,3)
  const corners = [[0, 0], [W - 1, 0], [0, L - 1], [W - 1, L - 1]];
  for (const [cx, cz] of corners) {
    set(cx, 1, cz, "minecraft:polished_blackstone");
    set(cx, 2, cz, "minecraft:polished_blackstone");
  }

  // Muro norte (Z=0, completo)
  for (let x = 1; x < W - 1; x++) set(x, 1, 0, "minecraft:polished_blackstone_wall");
  // Muro sur (Z=L-1, completo)
  for (let x = 1; x < W - 1; x++) set(x, 1, L - 1, "minecraft:polished_blackstone_wall");

  // Muros laterales CON abertura central (Z=5,6,7 abiertos → hacia arenas)
  for (let z = 1; z <= 3; z++) {
    set(0, 1, z, "minecraft:polished_blackstone_wall");
    set(W - 1, 1, z, "minecraft:polished_blackstone_wall");
  }
  for (let z = 4; z <= 4; z++) {
    set(0, 1, z, "minecraft:polished_blackstone_slab");
    set(W - 1, 1, z, "minecraft:polished_blackstone_slab");
  }
  for (let z = 8; z <= 8; z++) {
    set(0, 1, z, "minecraft:polished_blackstone_slab");
    set(W - 1, 1, z, "minecraft:polished_blackstone_slab");
  }
  for (let z = 9; z <= L - 2; z++) {
    set(0, 1, z, "minecraft:polished_blackstone_wall");
    set(W - 1, 1, z, "minecraft:polished_blackstone_wall");
  }

  // ── Pedestales elevados ──
  set(3, 1, 6, "minecraft:gold_block");    // Supervivencia
  set(17, 1, 6, "minecraft:gold_block");   // Balón Brawl
  set(10, 1, 6, "minecraft:gold_block");   // Centro (Brawl Master stand)

  // ── Iluminación alta ──
  set(2, 1, 2, "minecraft:soul_lantern");
  set(18, 1, 2, "minecraft:soul_lantern");
  set(2, 1, 10, "minecraft:soul_lantern");
  set(18, 1, 10, "minecraft:soul_lantern");
  // Centro de muros norte/sur
  set(10, 1, 0, "minecraft:soul_lantern");
  set(10, 1, L - 1, "minecraft:soul_lantern");

  // ════════════════════════════════════
  // Y=2: ELEMENTOS SUPERIORES
  // ════════════════════════════════════

  // Luces sobre pedestales
  set(3, 2, 6, "minecraft:soul_lantern");
  set(17, 2, 6, "minecraft:soul_lantern");
  set(10, 2, 6, "minecraft:soul_lantern");

  // ════════════════════════════════════
  // Y=3: REMATES DE ESQUINA
  // ════════════════════════════════════

  set(0, 3, 0, "minecraft:soul_torch");
  set(W - 1, 3, 0, "minecraft:soul_torch");
  set(0, 3, L - 1, "minecraft:soul_torch");
  set(W - 1, 3, L - 1, "minecraft:soul_torch");

  return [...m.values()];
}

export const hubStructure = {
  name: "Brawl Hub",
  size: { w: 21, h: 4, l: 13 },
  blocks: generateBlocks(),
  meta: {
    // Punto de spawn: centro de la plataforma, encima del piso
    spawnPoint: { rx: 10, ry: 1, rz: 6 },
    // Offsets de arenas RELATIVOS al hub origin
    // Showdown (45×45) al OESTE, 6 bloques de separación
    // BB (27×45) al ESTE, 6 bloques de separación
    // Ambas centradas en Z con el hub
    arenaOffsets: {
      showdown_arena:   { rx: -51, ry: 0, rz: -16 },
      brawl_ball_arena: { rx: 27,  ry: 0, rz: -16 },
    },
  },
};
