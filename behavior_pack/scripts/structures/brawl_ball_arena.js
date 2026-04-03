// brawl_ball_arena.js — Mapa de Balón Brawl (Brawl Ball)
// Arena 3v3 inspirada en módulos reales de Brawl Stars
//
// ══════════════════════════════════════════
// DISEÑO DEL CAMPO
// ══════════════════════════════════════════
// • Dimensiones: 27×6×45 (W × H × L), idénticas al original
// • Porterías: x=9..17, z=0..2 (azul) y z=42..44 (roja)
//   → ¡NO cambiar! goal_system.js depende de estas coordenadas
// • Balón spawn: rx=13, rz=22 (centro)
//
// Basado en mapas reales de Brawl Ball:
// ┌──────────────────────────────┐
// │ PORTERÍA ROJA (9 bloques)    │ z=44
// │  ■■■  ████████████  ■■■     │ z=42  muros parciales en portería
// │ 🌿   HAY    HAY    🌿      │
// │ 🌿  ●  HAY  HAY  ●  🌿    │ ● = pilares indestructibles
// │      HAY        HAY         │
// │  HAY    ●    ●    HAY       │ formaciones en L y T
// │                              │
// │  ··· LÍNEA CENTRAL ···      │ z=22
// │                              │
// │  HAY    ●    ●    HAY       │
// │      HAY        HAY         │
// │ 🌿  ●  HAY  HAY  ●  🌿    │
// │ 🌿   HAY    HAY    🌿      │
// │  ■■■  ████████████  ■■■     │ z=2  muros parciales en portería
// │ PORTERÍA AZUL (9 bloques)    │ z=0
// └──────────────────────────────┘
//
// Elementos clave vs mapa anterior:
// • Campo COMPLETAMENTE verde (césped a cuadros claro/oscuro)
// • Muros diagonales/escalonados parcialmente bloqueando porterías
// • Más formaciones de hay_block esparcidas (L-shapes, T-shapes)
// • Pilares indestructibles más estratégicos (3 pares simétricos)
// • Arbustos más densos en esquinas (clusters de 6) y laterales
// • Porterías con vallas de madera realistas + postes coloreados

function generateBlocks() {
  const blocks = [];
  const W = 27, H = 6, L = 45;
  const CX = 13, CZ = 22;

  // Portería: 9 bloques ancho, centrada (DEBE coincidir con goal_system.js)
  const GW = 9;
  const GX1 = 9;   // CX - 4
  const GX2 = 17;  // CX + 4
  const GOAL_DEPTH = 3;

  function add(x, y, z, type) { blocks.push([x, y, z, type]); }
  function mirrorZ(z) { return L - 1 - z; }

  // ── Helpers ──
  function wall2(x, z, type) {
    add(x, 2, z, type);
    add(x, 3, z, type);
  }
  function hayWall(positions) {
    for (const [x, z] of positions) { wall2(x, z, "minecraft:hay_block"); }
  }
  function hayWallMirrored(positions) {
    for (const [x, z] of positions) {
      wall2(x, z, "minecraft:hay_block");
      wall2(x, mirrorZ(z), "minecraft:hay_block");
    }
  }
  function pillar(x, z) {
    wall2(x, z, "minecraft:dark_prismarine");
    add(x, 4, z, "minecraft:sea_lantern");
  }
  function pillarMirrored(x, z) {
    pillar(x, z);
    pillar(x, mirrorZ(z));
  }
  function bush(x, z) {
    add(x, 1, z, "minecraft:grass_block");
    add(x, 2, z, "minecraft:oak_leaves");
    add(x, 3, z, "minecraft:oak_leaves");
  }
  function bushCluster(positions) {
    for (const [x, z] of positions) bush(x, z);
  }
  function bushClusterMirrored(positions) {
    for (const [x, z] of positions) {
      bush(x, z);
      bush(x, mirrorZ(z));
    }
  }

  // ═══════════════════════════════════════════
  // Y=0: CIMIENTOS
  // ═══════════════════════════════════════════
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < L; z++) {
      add(x, 0, z, "minecraft:gray_concrete");
    }
  }

  // ═══════════════════════════════════════════
  // Y=1: SUPERFICIE DE JUEGO — 100% césped
  // ═══════════════════════════════════════════

  // Todo el interior es césped a cuadros (x=1..25, z=0..44)
  for (let x = 1; x < W - 1; x++) {
    for (let z = 0; z < L; z++) {
      const isLight = (x + z) % 2 === 0;
      add(x, 1, z, isLight ? "minecraft:green_concrete" : "minecraft:lime_concrete");
    }
  }

  // Laterales (x=0, x=26) — piso oscuro bajo muros
  for (let z = 0; z < L; z++) {
    add(0, 1, z, "minecraft:gray_concrete");
    add(W - 1, 1, z, "minecraft:gray_concrete");
  }

  // ── Piso de porterías (sobreescribe césped) ──
  for (let x = GX1; x <= GX2; x++) {
    for (let z = 0; z < GOAL_DEPTH; z++) {
      add(x, 1, z, "minecraft:light_blue_concrete");
    }
    for (let z = L - GOAL_DEPTH; z < L; z++) {
      add(x, 1, z, "minecraft:orange_concrete");
    }
  }

  // ── Línea central ──
  for (let x = 2; x < W - 2; x++) {
    add(x, 1, CZ, "minecraft:white_concrete");
  }
  // Círculo central (3×3 diamante)
  add(CX, 1, CZ, "minecraft:bone_block");     // Centro exacto del balón
  add(CX - 1, 1, CZ, "minecraft:quartz_block");
  add(CX + 1, 1, CZ, "minecraft:quartz_block");
  add(CX, 1, CZ - 1, "minecraft:quartz_block");
  add(CX, 1, CZ + 1, "minecraft:quartz_block");

  // ── Marcadores de spawn ──
  // Azul (z=8): 3 posiciones
  for (const sx of [CX - 4, CX, CX + 4]) {
    add(sx, 1, 8, "minecraft:light_blue_concrete");
  }
  // Rojo (z=36): 3 posiciones
  for (const sx of [CX - 4, CX, CX + 4]) {
    add(sx, 1, 36, "minecraft:orange_concrete");
  }

  // ═══════════════════════════════════════════
  // MUROS PERIMETRALES (spruce_planks, 2 alto)
  // ═══════════════════════════════════════════

  // Laterales completos
  for (let z = 0; z < L; z++) {
    wall2(0, z, "minecraft:spruce_planks");
    wall2(W - 1, z, "minecraft:spruce_planks");
  }

  // Muros traseros: PARCIALES — dejan espacio frente a portería
  // Azul (z=0): muros solo fuera del arco
  for (let x = 1; x < GX1; x++) wall2(x, 0, "minecraft:spruce_planks");
  for (let x = GX2 + 1; x < W - 1; x++) wall2(x, 0, "minecraft:spruce_planks");
  // Rojo (z=L-1): muros solo fuera del arco
  for (let x = 1; x < GX1; x++) wall2(x, L - 1, "minecraft:spruce_planks");
  for (let x = GX2 + 1; x < W - 1; x++) wall2(x, L - 1, "minecraft:spruce_planks");

  // ── Muros escalonados frente a portería (bloqueo parcial) ──
  // Referencia: la imagen muestra bloques en diagonal a los lados del arco
  // Azul: escalonado desde esquina hacia portería (z=2..4)
  wall2(3, 3, "minecraft:spruce_planks");
  wall2(4, 2, "minecraft:spruce_planks");
  wall2(5, 2, "minecraft:spruce_planks");
  wall2(W - 4, 3, "minecraft:spruce_planks");
  wall2(W - 5, 2, "minecraft:spruce_planks");
  wall2(W - 6, 2, "minecraft:spruce_planks");
  // Rojo: espejo
  wall2(3, mirrorZ(3), "minecraft:spruce_planks");
  wall2(4, mirrorZ(2), "minecraft:spruce_planks");
  wall2(5, mirrorZ(2), "minecraft:spruce_planks");
  wall2(W - 4, mirrorZ(3), "minecraft:spruce_planks");
  wall2(W - 5, mirrorZ(2), "minecraft:spruce_planks");
  wall2(W - 6, mirrorZ(2), "minecraft:spruce_planks");

  // ═══════════════════════════════════════════
  // PORTERÍAS — postes + travesaño + red + valla
  // ═══════════════════════════════════════════

  // ── PORTERÍA AZUL (z=0) ──
  // Postes (3 alto: y=2,3,4)
  for (let y = 2; y <= 4; y++) {
    add(GX1, y, 0, "minecraft:light_blue_concrete");
    add(GX2, y, 0, "minecraft:light_blue_concrete");
  }
  // Travesaño
  for (let x = GX1; x <= GX2; x++) add(x, 4, 0, "minecraft:light_blue_concrete");
  // Red (cadenas)
  for (let x = GX1 + 1; x < GX2; x++) {
    add(x, 2, 0, "minecraft:chain");
    add(x, 3, 0, "minecraft:chain");
  }
  // Paredes laterales del arco (profundidad)
  for (let z = 0; z < GOAL_DEPTH; z++) {
    for (let y = 2; y <= 3; y++) {
      add(GX1, y, z, "minecraft:light_blue_concrete");
      add(GX2, y, z, "minecraft:light_blue_concrete");
    }
  }
  // Valla en línea de gol (z=2, la "portería" funcional)
  for (let x = GX1 + 1; x < GX2; x++) {
    add(x, 2, 2, "minecraft:spruce_fence");
  }

  // ── PORTERÍA ROJA (z=L-1) ──
  for (let y = 2; y <= 4; y++) {
    add(GX1, y, L - 1, "minecraft:red_concrete");
    add(GX2, y, L - 1, "minecraft:red_concrete");
  }
  for (let x = GX1; x <= GX2; x++) add(x, 4, L - 1, "minecraft:red_concrete");
  for (let x = GX1 + 1; x < GX2; x++) {
    add(x, 2, L - 1, "minecraft:chain");
    add(x, 3, L - 1, "minecraft:chain");
  }
  for (let z = L - GOAL_DEPTH; z < L; z++) {
    for (let y = 2; y <= 3; y++) {
      add(GX1, y, z, "minecraft:red_concrete");
      add(GX2, y, z, "minecraft:red_concrete");
    }
  }
  for (let x = GX1 + 1; x < GX2; x++) {
    add(x, 2, L - 3, "minecraft:spruce_fence");
  }

  // ═══════════════════════════════════════════
  // PAREDES DESTRUCTIBLES (hay_block)
  // Formaciones L y T simétricas — mucho más densas que antes
  // ═══════════════════════════════════════════

  // ── Zona de portería: L-shapes a los lados del arco ──
  hayWallMirrored([
    // L-shape izquierda (junto a escalonado de portería)
    [6, 5], [7, 5], [7, 6],
    // L-shape derecha (espejo X)
    [20, 5], [19, 5], [19, 6],
  ]);

  // ── Zona media: barreras horizontales + clusters ──
  hayWallMirrored([
    // Barrera horizontal izquierda
    [3, 10], [4, 10], [5, 10],
    // Barrera horizontal derecha
    [21, 10], [22, 10], [23, 10],
    // Cluster interior-izq (T-shape)
    [7, 13], [8, 13], [9, 13], [8, 14],
    // Cluster interior-der (T-shape espejo)
    [17, 13], [18, 13], [19, 13], [18, 14],
  ]);

  // ── Zona central: flancos del centro ──
  hayWallMirrored([
    // Close to center — cuñas
    [4, 18], [5, 18], [5, 19],
    [21, 18], [22, 18], [21, 19],
    // Interior center — L-shapes pequeñas
    [10, 19], [10, 20],
    [16, 19], [16, 20],
  ]);

  // ── Línea central: bloques únicos (no se espejan) ──
  hayWall([
    [7, CZ - 1], [7, CZ + 1],     // flancos izq
    [19, CZ - 1], [19, CZ + 1],   // flancos der
  ]);

  // ═══════════════════════════════════════════
  // PILARES INDESTRUCTIBLES (dark_prismarine + sea_lantern top)
  // 3 pares simétricos: laterales, interiores, centrales
  // ═══════════════════════════════════════════

  // Par 1: laterales (control de pasillo lateral)
  pillarMirrored(3, 15);
  pillarMirrored(23, 15);

  // Par 2: interiores (defensa media)
  pillarMirrored(10, 10);
  pillarMirrored(16, 10);

  // Par 3: flancos centrales (junto a línea central)
  pillar(6, CZ);
  pillar(20, CZ);

  // ═══════════════════════════════════════════
  // ARBUSTOS (grass_block + oak_leaves ×2 — 2 bloques de alto)
  // Tiras largas a lo largo de ambos laterales + clusters interiores
  // Referencia: la imagen muestra tiras de hierba de ~4 bloques verticales
  //   repetidas cada ~7 bloques a ambos lados del campo
  // ═══════════════════════════════════════════

  // ── TIRAS LATERALES IZQUIERDAS (x=1,2) — espejadas norte/sur ──
  // Tira 1: cerca de portería (z=4..7)
  // Tira 2: zona baja-media (z=10..13)
  // Tira 3: zona media (z=17..20)
  // Sus espejos: z=37..40, z=31..34, z=24..27
  bushClusterMirrored([
    // Tira 1: z=4..7 (cerca de portería)
    [1, 4], [2, 4], [1, 5], [2, 5], [1, 6], [2, 6], [1, 7], [2, 7],
    // Tira 2: z=10..13 (zona baja-media)
    [1, 10], [2, 10], [1, 11], [2, 11], [1, 12], [2, 12], [1, 13], [2, 13],
    // Tira 3: z=17..20 (zona media)
    [1, 17], [2, 17], [1, 18], [2, 18], [1, 19], [2, 19], [1, 20], [2, 20],
  ]);

  // ── TIRAS LATERALES DERECHAS (x=24,25) — espejadas norte/sur ──
  bushClusterMirrored([
    // Tira 1: z=4..7
    [24, 4], [25, 4], [24, 5], [25, 5], [24, 6], [25, 6], [24, 7], [25, 7],
    // Tira 2: z=10..13
    [24, 10], [25, 10], [24, 11], [25, 11], [24, 12], [25, 12], [24, 13], [25, 13],
    // Tira 3: z=17..20
    [24, 17], [25, 17], [24, 18], [25, 18], [24, 19], [25, 19], [24, 20], [25, 20],
  ]);

  // ── CLUSTERS INTERIORES junto a formaciones hay (espejados N/S) ──
  bushClusterMirrored([
    // Flanqueando formaciones L de portería
    [3, 4], [3, 5],
    [23, 4], [23, 5],
    // Interior junto a T-shapes zona media
    [6, 11], [6, 12],
    [20, 11], [20, 12],
  ]);

  // ═══════════════════════════════════════════
  // ILUMINACIÓN
  // ═══════════════════════════════════════════

  // Antorchas laterales cada 8 bloques
  for (let z = 4; z < L - 4; z += 8) {
    add(1, 2, z, "minecraft:torch");
    add(W - 2, 2, z, "minecraft:torch");
  }

  // Linternas en porterías
  add(GX1 + 1, 2, 1, "minecraft:lantern");
  add(GX2 - 1, 2, 1, "minecraft:lantern");
  add(GX1 + 1, 2, L - 2, "minecraft:lantern");
  add(GX2 - 1, 2, L - 2, "minecraft:lantern");

  // Techo parcial sobre porterías (vigas decorativas)
  for (let x = GX1; x <= GX2; x++) {
    add(x, 5, 0, "minecraft:spruce_slab");
    add(x, 5, L - 1, "minecraft:spruce_slab");
  }

  return blocks;
}

// ═══════════════════════════════════════════
// META: posiciones de arbustos para bush_mechanic.js
// ═══════════════════════════════════════════
function getBushPositions() {
  const positions = [];
  const L = 45;
  function mirrorZ(z) { return L - 1 - z; }

  // Tiras laterales izquierdas (x=1,2) — espejadas N/S
  const leftStrips = [
    [1, 4], [2, 4], [1, 5], [2, 5], [1, 6], [2, 6], [1, 7], [2, 7],
    [1, 10], [2, 10], [1, 11], [2, 11], [1, 12], [2, 12], [1, 13], [2, 13],
    [1, 17], [2, 17], [1, 18], [2, 18], [1, 19], [2, 19], [1, 20], [2, 20],
  ];
  for (const [x, z] of leftStrips) {
    positions.push([x, 2, z]);
    positions.push([x, 2, mirrorZ(z)]);
  }

  // Tiras laterales derechas (x=24,25) — espejadas N/S
  const rightStrips = [
    [24, 4], [25, 4], [24, 5], [25, 5], [24, 6], [25, 6], [24, 7], [25, 7],
    [24, 10], [25, 10], [24, 11], [25, 11], [24, 12], [25, 12], [24, 13], [25, 13],
    [24, 17], [25, 17], [24, 18], [25, 18], [24, 19], [25, 19], [24, 20], [25, 20],
  ];
  for (const [x, z] of rightStrips) {
    positions.push([x, 2, z]);
    positions.push([x, 2, mirrorZ(z)]);
  }

  // Clusters interiores (espejados N/S)
  const interiorBushes = [
    [3, 4], [3, 5], [23, 4], [23, 5],
    [6, 11], [6, 12], [20, 11], [20, 12],
  ];
  for (const [x, z] of interiorBushes) {
    positions.push([x, 2, z]);
    positions.push([x, 2, mirrorZ(z)]);
  }

  return positions;
}

function getSpawnPositions() {
  return {
    blue: [[9, 2, 8], [13, 2, 8], [17, 2, 8]],
    red:  [[9, 2, 36], [13, 2, 36], [17, 2, 36]],
  };
}

export const brawlBallArena = {
  id: "brawl_ball_arena",
  name: "Campo Brawl Ball",
  size: { w: 27, h: 6, l: 45 },
  category: "arenas",
  blocks: generateBlocks(),
  meta: {
    bushPositions: getBushPositions(),
    boxPositions: [],
    spawnPositions: getSpawnPositions(),
  },
};
