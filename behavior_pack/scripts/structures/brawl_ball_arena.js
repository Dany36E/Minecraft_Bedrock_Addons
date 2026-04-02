// brawl_ball_arena.js — Mapa de Balón Brawl (Brawl Ball)
// Arena 3v3 inspirada en Brawl Stars (Supercell)
//
// ══════════════════════════════════════════
// ANÁLISIS DEL MAPA DE BRAWL BALL
// ══════════════════════════════════════════
// • Modo: 3v3, dos equipos compiten por meter gol
// • Victoria: primer equipo en anotar 2 goles (o ventaja al tiempo)
// • Elementos del campo:
//   - Césped verde a cuadros (alternando claro/oscuro)
//   - Porterías roja (norte) y azul (sur) con red metálica
//   - Paredes destructibles (naranjas/heno) en formaciones L y clusters
//   - Pilares indestructibles (azules) como cobertura
//   - Arbustos verdes (ocultan jugadores) en esquinas y laterales
//   - Zonas de spawn marcadas para cada equipo
//   - Muros laterales y traseros delimitando el campo
//   - Simetría vertical: mitad norte ≈ espejo de mitad sur
//
// Dimensiones: 27×6×45 (Ancho × Alto × Largo)
// Bloques estimados: ~4,500
// Escala: 1 tile de Brawl Stars ≈ 1 bloque de Minecraft

function generateBlocks() {
  const blocks = [];
  const W = 27, H = 6, L = 45;
  const CX = 13, CZ = 22;

  // Portería: 9 bloques de ancho, centrada
  const GW = 9;
  const GX1 = CX - Math.floor(GW / 2); // 9
  const GX2 = CX + Math.floor(GW / 2); // 17
  const GOAL_DEPTH = 3;

  function add(x, y, z, type) { blocks.push([x, y, z, type]); }

  // Helper: colocar pared de 2 bloques de alto
  function addWall2(x, z, type) {
    add(x, 2, z, type);
    add(x, 3, z, type);
  }

  // Helper: cluster de paredes destructibles (hay_block, 2 alto)
  function addHayWall(positions) {
    for (const [x, z] of positions) {
      addWall2(x, z, "minecraft:hay_block");
    }
  }

  // Helper: pilar indestructible (blue_concrete, 2 alto)
  function addPillar(x, z) {
    addWall2(x, z, "minecraft:blue_concrete");
  }

  // Helper: arbusto (tall_grass sobre grass_block, 2 bloques alto)
  function addBush(positions) {
    for (const [x, z] of positions) {
      add(x, 1, z, "minecraft:grass_block");  // soporte para hierba
      add(x, 2, z, "minecraft:tall_grass");
    }
  }

  // Helper: simétrico respecto al centro Z (para z < CZ, genera el espejo en z > CZ)
  function mirrorZ(z) { return L - 1 - z; }

  // ═══════════════════════════════════════════
  // CAPA 0: CIMIENTOS (gray_concrete)
  // ═══════════════════════════════════════════
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < L; z++) {
      add(x, 0, z, "minecraft:gray_concrete");
    }
  }

  // ═══════════════════════════════════════════
  // CAPA 1: SUPERFICIE DE JUEGO
  // ═══════════════════════════════════════════

  // Campo de juego: césped a cuadros (z=3 a z=41, x=1 a x=25)
  for (let x = 1; x < W - 1; x++) {
    for (let z = GOAL_DEPTH; z < L - GOAL_DEPTH; z++) {
      const isLight = (x + z) % 2 === 0;
      add(x, 1, z, isLight ? "minecraft:green_concrete" : "minecraft:lime_concrete");
    }
  }

  // Piso portería azul (z=0 a z=2)
  for (let x = GX1; x <= GX2; x++) {
    for (let z = 0; z < GOAL_DEPTH; z++) {
      add(x, 1, z, "minecraft:blue_concrete");
    }
  }

  // Piso portería roja (z=42 a z=44)
  for (let x = GX1; x <= GX2; x++) {
    for (let z = L - GOAL_DEPTH; z < L; z++) {
      add(x, 1, z, "minecraft:red_concrete");
    }
  }

  // Línea central (z=22) — franja blanca
  for (let x = 1; x < W - 1; x++) {
    add(x, 1, CZ, "minecraft:white_concrete");
  }

  // Marcador de balón (centro exacto)
  add(CX, 1, CZ, "minecraft:bone_block");

  // Marcadores de spawn — equipo azul (z=18)
  for (const sx of [CX - 4, CX, CX + 4]) {
    add(sx, 1, 18, "minecraft:light_blue_concrete");
  }
  // Marcadores de spawn — equipo rojo (z=26)
  for (const sx of [CX - 4, CX, CX + 4]) {
    add(sx, 1, 26, "minecraft:red_concrete_powder");
  }

  // ═══════════════════════════════════════════
  // MUROS PERIMETRALES (dark_oak_planks, 2 alto)
  // ═══════════════════════════════════════════

  // Muros laterales (x=0 y x=26)
  for (let z = 0; z < L; z++) {
    addWall2(0, z, "minecraft:dark_oak_planks");
    addWall2(W - 1, z, "minecraft:dark_oak_planks");
  }

  // Muros traseros (excepto hueco de portería)
  for (let x = 1; x < W - 1; x++) {
    if (x < GX1 || x > GX2) {
      addWall2(x, 0, "minecraft:dark_oak_planks");
      addWall2(x, L - 1, "minecraft:dark_oak_planks");
    }
  }

  // Esquinas reforzadas (para las entradas oblicuas visibles en la imagen)
  // Esquina superior-izquierda del campo (junto a portería roja)
  addWall2(1, L - 1, "minecraft:dark_oak_planks");
  addWall2(2, L - 1, "minecraft:dark_oak_planks");
  // Esquina superior-derecha
  addWall2(W - 2, L - 1, "minecraft:dark_oak_planks");
  addWall2(W - 3, L - 1, "minecraft:dark_oak_planks");
  // Esquina inferior-izquierda (junto a portería azul)
  addWall2(1, 0, "minecraft:dark_oak_planks");
  addWall2(2, 0, "minecraft:dark_oak_planks");
  // Esquina inferior-derecha
  addWall2(W - 2, 0, "minecraft:dark_oak_planks");
  addWall2(W - 3, 0, "minecraft:dark_oak_planks");

  // ═══════════════════════════════════════════
  // PORTERÍAS
  // ═══════════════════════════════════════════

  // Portería AZUL (z=0, fondo sur)
  // Postes (3 bloques de alto: y=2,3,4)
  for (let y = 2; y <= 4; y++) {
    add(GX1, y, 0, "minecraft:blue_concrete");
    add(GX2, y, 0, "minecraft:blue_concrete");
  }
  // Travesaño superior
  for (let x = GX1; x <= GX2; x++) {
    add(x, 4, 0, "minecraft:blue_concrete");
  }
  // Red (cadenas simulando malla)
  for (let x = GX1 + 1; x < GX2; x++) {
    add(x, 2, 0, "minecraft:chain");
    add(x, 3, 0, "minecraft:chain");
  }
  // Fondo de la portería (pared trasera con red)
  for (let z = 0; z < GOAL_DEPTH; z++) {
    for (let y = 2; y <= 3; y++) {
      add(GX1, y, z, "minecraft:blue_concrete");
      add(GX2, y, z, "minecraft:blue_concrete");
    }
  }

  // Portería ROJA (z=L-1, fondo norte)
  for (let y = 2; y <= 4; y++) {
    add(GX1, y, L - 1, "minecraft:red_concrete");
    add(GX2, y, L - 1, "minecraft:red_concrete");
  }
  for (let x = GX1; x <= GX2; x++) {
    add(x, 4, L - 1, "minecraft:red_concrete");
  }
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

  // ═══════════════════════════════════════════
  // PAREDES DESTRUCTIBLES (hay_block)
  // Basadas en análisis de la imagen del mapa
  // Simetría vertical: se definen para mitad azul y se espejan
  // ═══════════════════════════════════════════

  // Formación L inferior-izquierda (cerca de portería azul)
  const hayPatternsBlueHalf = [
    // Cluster esquina inferior-izq (L-shape)
    [3, 8], [4, 8], [4, 9],
    // Cluster esquina inferior-der (L-shape espejo)
    [22, 8], [23, 8], [22, 9],
    // Barrera media-izq
    [6, 13], [7, 13],
    // Barrera media-der (espejo)
    [19, 13], [20, 13],
    // Cluster centro-izq (cerca de línea central)
    [8, 18], [9, 18], [9, 19],
    // Cluster centro-der (espejo)
    [17, 18], [18, 18], [17, 19],
  ];

  // Colocar mitad azul
  addHayWall(hayPatternsBlueHalf);

  // Espejo para mitad roja
  for (const [x, z] of hayPatternsBlueHalf) {
    addWall2(x, mirrorZ(z), "minecraft:hay_block");
  }

  // Paredes centrales decorativas (no se espejan, son únicas)
  addHayWall([
    [11, 20], [15, 20],  // flanqueando spawns rojos
    [11, 24], [15, 24],  // flanqueando spawns azules
  ]);

  // ═══════════════════════════════════════════
  // PILARES INDESTRUCTIBLES (blue_concrete)
  // ═══════════════════════════════════════════

  const pillarPositionsBlueHalf = [
    [5, 16], [21, 16],   // laterales medios
    [10, 11], [16, 11],  // interiores
  ];

  for (const [x, z] of pillarPositionsBlueHalf) {
    addPillar(x, z);
    addPillar(x, mirrorZ(z));   // espejo
  }

  // Pilares centrales (eje)
  addPillar(CX - 3, CZ);
  addPillar(CX + 3, CZ);

  // ═══════════════════════════════════════════
  // ARBUSTOS (short_grass) — escondites
  // Clusters de 2-4 bloques en esquinas y laterales
  // ═══════════════════════════════════════════

  const bushPatternsBlueHalf = [
    // Esquina inferior-izq (cluster de 4)
    [2, 5], [3, 5], [2, 6], [3, 6],
    // Esquina inferior-der (espejo)
    [23, 5], [24, 5], [23, 6], [24, 6],
    // Lateral izquierdo medio
    [1, 14], [1, 15], [2, 15],
    // Lateral derecho medio (espejo)
    [25, 14], [25, 15], [24, 15],
  ];

  addBush(bushPatternsBlueHalf);
  // Espejo para mitad roja
  for (const [x, z] of bushPatternsBlueHalf) {
    add(x, 1, mirrorZ(z), "minecraft:grass_block");
    add(x, 2, mirrorZ(z), "minecraft:tall_grass");
  }

  // Arbustos junto a las porterías
  addBush([
    [4, 4], [5, 4],          // junto a portería azul izq
    [21, 4], [22, 4],        // junto a portería azul der
    [4, 40], [5, 40],        // junto a portería roja izq
    [21, 40], [22, 40],      // junto a portería roja der
  ]);

  // ═══════════════════════════════════════════
  // ILUMINACIÓN (antorchas bajo los muros)
  // ═══════════════════════════════════════════
  for (let z = 5; z < L - 5; z += 6) {
    add(1, 2, z, "minecraft:torch");
    add(W - 2, 2, z, "minecraft:torch");
  }

  // Antorchas en porterías
  add(GX1 + 1, 2, 1, "minecraft:lantern");
  add(GX2 - 1, 2, 1, "minecraft:lantern");
  add(GX1 + 1, 2, L - 2, "minecraft:lantern");
  add(GX2 - 1, 2, L - 2, "minecraft:lantern");

  return blocks;
}

// ═══════════════════════════════════════════
// Posiciones de arbustos para mecánica de invisibilidad
// ═══════════════════════════════════════════
function getBushPositions() {
  const positions = [];
  const L = 45;
  function mirrorZ(z) { return L - 1 - z; }

  const blueHalf = [
    [2, 5], [3, 5], [2, 6], [3, 6],
    [23, 5], [24, 5], [23, 6], [24, 6],
    [1, 14], [1, 15], [2, 15],
    [25, 14], [25, 15], [24, 15],
  ];

  for (const [x, z] of blueHalf) {
    positions.push([x, 2, z]);
    positions.push([x, 2, mirrorZ(z)]);
  }

  // Arbustos junto a porterías
  for (const [x, z] of [[4, 4], [5, 4], [21, 4], [22, 4], [4, 40], [5, 40], [21, 40], [22, 40]]) {
    positions.push([x, 2, z]);
  }

  return positions;
}

export const brawlBallArena = {
  id: "brawl_ball_arena",
  name: "Arena Balón Brawl",
  category: "arenas",
  blocks: generateBlocks(),
  meta: {
    bushPositions: getBushPositions(),
    boxPositions: [],   // Brawl Ball no tiene cajas de power cubes
  },
};
