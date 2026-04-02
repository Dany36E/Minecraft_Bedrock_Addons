// showdown_arena.js — Mapa de Supervivencia (Showdown)
// Arena Battle Royale inspirada en Brawl Stars (Supercell)
//
// ══════════════════════════════════════════
// ANÁLISIS DEL MAPA DE SUPERVIVENCIA
// ══════════════════════════════════════════
// • Modo: Solo Showdown — 10 jugadores, último en pie gana
// • Cada mapa tiene Power Cube Boxes (cajas) repartidas
//   → Las cajas tienen vida, al destruirlas sueltan un Power Cube
//   → Cada cubo: +400 HP, +10% daño (acumulable)
//   → El gas venenoso cierra el mapa progresivamente
// • Elementos del mapa (análisis de imagen):
//   - Tema desértico: arena y arenisca como base
//   - Paredes de ladrillo (indestructibles) formando corredores
//   - Paredes de heno (destructibles, doradas)
//   - Agua: canales N-S, lagos al oeste, piscina central diamante
//   - Arbustos: plantas verdes con punta roja (NE y SW del mapa)
//   - Cajas: ~24 posiciones marcadas con círculos grises
//   - Feature central: diamante/piscina turquesa con estructura
//   - Simetría rotacional ~180° alrededor del centro
//
// Dimensiones: 45×6×45 (Ancho × Alto × Largo)
// Bloques estimados: ~11,000

function generateBlocks() {
  const blocks = [];
  const S = 45; // mapa cuadrado 45×45
  const CS = 22; // centro

  function add(x, y, z, type) { blocks.push([x, y, z, type]); }

  // Helpers: colocar pared 2-3 bloques de alto
  function addBrickWall(x, z, h) {
    const height = h || 3;
    for (let y = 2; y <= Math.min(2 + height - 1, 4); y++) {
      add(x, y, z, "minecraft:brick_block");
    }
  }

  function addHayWall(x, z) {
    add(x, 2, z, "minecraft:hay_block");
    add(x, 3, z, "minecraft:hay_block");
  }

  // Helper: rectángulo de paredes de ladrillo
  function brickRect(x1, z1, x2, z2, h) {
    for (let x = x1; x <= x2; x++) {
      for (let z = z1; z <= z2; z++) {
        addBrickWall(x, z, h);
      }
    }
  }

  // Helper: rectángulo de heno
  function hayRect(x1, z1, x2, z2) {
    for (let x = x1; x <= x2; x++) {
      for (let z = z1; z <= z2; z++) {
        addHayWall(x, z);
      }
    }
  }

  // Helper: rectángulo de agua
  function waterRect(x1, z1, x2, z2) {
    for (let x = x1; x <= x2; x++) {
      for (let z = z1; z <= z2; z++) {
        add(x, 1, z, "minecraft:water");
      }
    }
  }

  // ═══════════════════════════════════════════
  // CAPA 0: CIMIENTOS (stone)
  // ═══════════════════════════════════════════
  for (let x = 0; x < S; x++) {
    for (let z = 0; z < S; z++) {
      add(x, 0, z, "minecraft:stone");
    }
  }

  // ═══════════════════════════════════════════
  // CAPA 1: TERRENO BASE (sandstone)
  // ═══════════════════════════════════════════
  for (let x = 0; x < S; x++) {
    for (let z = 0; z < S; z++) {
      add(x, 1, z, "minecraft:sandstone");
    }
  }

  // Variación de terreno: arena suelta en bordes
  for (let x = 0; x < S; x++) {
    for (let z = 0; z < S; z++) {
      if (x < 3 || x > S - 4 || z < 3 || z > S - 4) {
        add(x, 1, z, "minecraft:sand");
      }
    }
  }

  // ═══════════════════════════════════════════
  // MURO PERIMETRAL (brick_block, 3 alto)
  // ═══════════════════════════════════════════
  for (let i = 0; i < S; i++) {
    addBrickWall(0, i, 3);
    addBrickWall(S - 1, i, 3);
    addBrickWall(i, 0, 3);
    addBrickWall(i, S - 1, 3);
  }

  // ═══════════════════════════════════════════
  // AGUA — Canales y lagos
  // ═══════════════════════════════════════════

  // Canal central N-S (x=21-23, desde norte al centro y de centro al sur)
  waterRect(21, 1, 23, 8);     // canal norte
  waterRect(21, 36, 23, 43);   // canal sur

  // Piscina central diamante (rombo de agua alrededor del centro)
  waterRect(19, 20, 25, 24);   // base rectangular
  // Bordes del diamante
  waterRect(20, 19, 24, 19);   // borde norte
  waterRect(20, 25, 24, 25);   // borde sur
  add(22, 1, 18, "minecraft:water");
  add(22, 1, 26, "minecraft:water");

  // Centro de la piscina: prismarine (isla central)
  add(22, 1, 22, "minecraft:prismarine");
  add(21, 1, 22, "minecraft:prismarine");
  add(23, 1, 22, "minecraft:prismarine");
  add(22, 1, 21, "minecraft:prismarine");
  add(22, 1, 23, "minecraft:prismarine");
  // Decoración central elevada
  add(22, 2, 22, "minecraft:warped_planks");

  // Lago noroeste (grande)
  waterRect(4, 13, 9, 17);
  waterRect(3, 14, 3, 16);     // extensión oeste

  // Lago suroeste
  waterRect(4, 27, 9, 31);
  waterRect(3, 28, 3, 30);

  // Lago noreste (pequeño)
  waterRect(35, 6, 39, 9);

  // Lago sureste
  waterRect(35, 35, 39, 38);

  // Charco central-oeste
  waterRect(5, 20, 8, 24);

  // Charco central-este
  waterRect(36, 20, 39, 24);

  // ═══════════════════════════════════════════
  // PAREDES DE LADRILLO — Corredores principales
  // (Indestructibles, forman la estructura del mapa)
  // ═══════════════════════════════════════════

  // ─── Corredores horizontales norte ───
  brickRect(4, 4, 10, 4, 2);    // muro horizontal norte-oeste
  brickRect(34, 4, 40, 4, 2);   // muro horizontal norte-este
  brickRect(15, 3, 17, 3, 2);   // segmento corto norte-centro-izq
  brickRect(27, 3, 29, 3, 2);   // segmento corto norte-centro-der

  // ─── Corredores horizontales sur (espejo) ───
  brickRect(4, 40, 10, 40, 2);
  brickRect(34, 40, 40, 40, 2);
  brickRect(15, 41, 17, 41, 2);
  brickRect(27, 41, 29, 41, 2);

  // ─── Corredores verticales oeste ───
  brickRect(4, 5, 4, 12, 2);    // muro vertical NO
  brickRect(4, 32, 4, 39, 2);   // muro vertical SO
  brickRect(10, 8, 10, 12, 2);  // muro interior NO
  brickRect(10, 32, 10, 36, 2); // muro interior SO

  // ─── Corredores verticales este (espejo) ───
  brickRect(40, 5, 40, 12, 2);
  brickRect(40, 32, 40, 39, 2);
  brickRect(34, 8, 34, 12, 2);
  brickRect(34, 32, 34, 36, 2);

  // ─── Estructura central — paredes alrededor del diamante ───
  brickRect(16, 17, 18, 17, 2);  // muro norte-izq del centro
  brickRect(26, 17, 28, 17, 2);  // muro norte-der del centro
  brickRect(16, 27, 18, 27, 2);  // muro sur-izq del centro
  brickRect(26, 27, 28, 27, 2);  // muro sur-der del centro

  brickRect(16, 18, 16, 20, 2);  // vertical izq-norte
  brickRect(28, 18, 28, 20, 2);  // vertical der-norte
  brickRect(16, 24, 16, 26, 2);  // vertical izq-sur
  brickRect(28, 24, 28, 26, 2);  // vertical der-sur

  // ─── Corredores diagonales / intermedios ───
  brickRect(12, 10, 14, 10, 2);  // segmento NW interior
  brickRect(30, 10, 32, 10, 2);  // segmento NE interior
  brickRect(12, 34, 14, 34, 2);  // segmento SW interior
  brickRect(30, 34, 32, 34, 2);  // segmento SE interior

  // ─── Corredores medios horizontales ───
  brickRect(6, 22, 10, 22, 2);   // corredor W-centro
  brickRect(34, 22, 38, 22, 2);  // corredor E-centro

  // ─── Habitaciones/salas en las esquinas ───
  // NW room
  brickRect(7, 6, 9, 6, 2);
  brickRect(7, 11, 7, 11, 2);
  // NE room
  brickRect(35, 6, 37, 6, 2);
  brickRect(37, 11, 37, 11, 2);
  // SW room
  brickRect(7, 38, 9, 38, 2);
  brickRect(7, 33, 7, 33, 2);
  // SE room
  brickRect(35, 38, 37, 38, 2);
  brickRect(37, 33, 37, 33, 2);

  // ─── Paredes interiores adicionales ───
  brickRect(13, 14, 13, 16, 2);  // vertical interior NW
  brickRect(31, 14, 31, 16, 2);  // vertical interior NE
  brickRect(13, 28, 13, 30, 2);  // vertical interior SW
  brickRect(31, 28, 31, 30, 2);  // vertical interior SE

  brickRect(18, 12, 18, 14, 2);
  brickRect(26, 12, 26, 14, 2);
  brickRect(18, 30, 18, 32, 2);
  brickRect(26, 30, 26, 32, 2);

  // ═══════════════════════════════════════════
  // PAREDES DE HENO (destructibles)
  // ═══════════════════════════════════════════

  // Clusters de heno repartidos por el mapa
  // NW area
  hayRect(6, 8, 7, 9);
  hayRect(11, 6, 12, 7);

  // NE area
  hayRect(37, 8, 38, 9);
  hayRect(32, 6, 33, 7);

  // SW area (espejo de NE)
  hayRect(6, 35, 7, 36);
  hayRect(11, 37, 12, 38);

  // SE area (espejo de NW)
  hayRect(37, 35, 38, 36);
  hayRect(32, 37, 33, 38);

  // Centro-norte
  hayRect(14, 15, 15, 15);
  hayRect(20, 14, 20, 15);

  // Centro-sur (espejo)
  hayRect(29, 29, 30, 29);
  hayRect(24, 29, 24, 30);

  // Lateral oeste medio
  hayRect(8, 19, 8, 20);
  hayRect(8, 24, 8, 25);

  // Lateral este medio (espejo)
  hayRect(36, 19, 36, 20);
  hayRect(36, 24, 36, 25);

  // Clusters cerca de spawns
  hayRect(2, 10, 2, 11);
  hayRect(42, 10, 42, 11);
  hayRect(2, 33, 2, 34);
  hayRect(42, 33, 42, 34);

  // Centro — heno flanqueando la piscina
  hayRect(18, 21, 18, 23);
  hayRect(26, 21, 26, 23);

  // ═══════════════════════════════════════════
  // ARBUSTOS (tall_grass sobre grass_block)
  // Clusters de 2-4 bloques, principalmente NE y SW
  // ═══════════════════════════════════════════

  const bushClusters = [
    // NE area (grupo grande)
    [36, 2], [37, 2], [38, 3], [39, 3],
    [37, 4], [38, 4],
    [40, 6], [41, 7],
    [39, 5], [40, 5],  // extensión NE

    // SW area (espejo rotacional)
    [6, 41], [7, 41], [5, 42], [6, 42],
    [7, 40], [6, 40],
    [3, 38], [4, 37],
    [4, 39], [5, 39],  // extensión SW

    // NW area (nuevo cluster grande)
    [3, 5], [4, 5], [3, 6], [4, 6],
    [5, 3], [6, 3],
    [2, 8], [3, 8],

    // SE area (espejo de NW)
    [40, 39], [41, 39], [40, 38], [41, 38],
    [38, 41], [39, 41],
    [42, 36], [41, 36],

    // Interior NE (ampliado)
    [33, 14], [33, 15], [34, 14],
    [35, 11], [36, 11],
    [32, 18], [33, 18],

    // Interior SW (ampliado)
    [11, 29], [11, 30], [10, 30],
    [8, 33], [9, 33],
    [11, 26], [12, 26],

    // Interior NW (nuevo)
    [10, 14], [11, 14],
    [8, 11], [9, 11],

    // Interior SE (nuevo)
    [33, 30], [34, 30],
    [35, 33], [36, 33],

    // Borde oeste (ampliado)
    [2, 22], [2, 23], [2, 20], [2, 24],
    [3, 18], [3, 26],

    // Borde este (ampliado)
    [42, 21], [42, 22], [42, 20], [42, 24],
    [41, 18], [41, 26],

    // Centro-norte (ampliado)
    [20, 9], [21, 9], [19, 10], [20, 10],

    // Centro-sur (ampliado)
    [23, 35], [24, 35], [24, 34], [25, 34],

    // Cerca de la piscina central (nuevos)
    [17, 18], [17, 19],
    [27, 25], [27, 26],

    // Corredores laterales (nuevos)
    [6, 18], [6, 19],
    [38, 25], [38, 26],

    // Spawns intermedios (nuevos)
    [14, 8], [15, 8],
    [29, 36], [30, 36],

    // Esquinas interiores del centro
    [19, 15], [20, 16],
    [24, 28], [25, 29],
  ];

  for (const [x, z] of bushClusters) {
    add(x, 1, z, "minecraft:grass_block");  // soporte para hierba
    add(x, 2, z, "minecraft:tall_grass");
  }

  // ═══════════════════════════════════════════
  // CAJAS DE POWER CUBES — ya NO se colocan como bloques.
  // Se spawnean como entidades (miaddon:power_box) después
  // de construir la arena. Ver meta.boxPositions.
  // ═══════════════════════════════════════════

  // ═══════════════════════════════════════════
  // ILUMINACIÓN
  // ═══════════════════════════════════════════

  // Antorchas en las esquinas de los corredores
  const torchPositions = [
    [5, 5], [39, 5], [5, 39], [39, 39],
    [12, 12], [32, 12], [12, 32], [32, 32],
    [17, 19], [27, 19], [17, 25], [27, 25],
    [22, 12], [22, 32],
    [12, 22], [32, 22],
  ];
  for (const [x, z] of torchPositions) {
    add(x, 2, z, "minecraft:torch");
  }

  // Linternas en la estructura central
  add(20, 2, 20, "minecraft:lantern");
  add(24, 2, 20, "minecraft:lantern");
  add(20, 2, 24, "minecraft:lantern");
  add(24, 2, 24, "minecraft:lantern");

  // Soul torches en el borde (ambientación desértica)
  for (let i = 6; i < S - 6; i += 8) {
    add(1, 2, i, "minecraft:soul_torch");
    add(S - 2, 2, i, "minecraft:soul_torch");
    add(i, 2, 1, "minecraft:soul_torch");
    add(i, 2, S - 2, "minecraft:soul_torch");
  }

  return blocks;
}

// ═══════════════════════════════════════════
// Posiciones de arbustos para mecánica de invisibilidad
// ═══════════════════════════════════════════
function getBushPositions() {
  const positions = [];
  const clusters = [
    [36, 2], [37, 2], [38, 3], [39, 3],
    [37, 4], [38, 4], [40, 6], [41, 7],
    [6, 41], [7, 41], [5, 42], [6, 42],
    [7, 40], [6, 40], [3, 38], [4, 37],
    [33, 14], [33, 15], [11, 29], [11, 30],
    [2, 22], [2, 23], [42, 21], [42, 22],
    [20, 9], [21, 9], [23, 35], [24, 35],
  ];
  for (const [x, z] of clusters) {
    positions.push([x, 2, z]);
  }
  return positions;
}

// ═══════════════════════════════════════════
// Posiciones de cajas para mecánica de Power Cubes
// ═══════════════════════════════════════════
function getBoxPositions() {
  const positions = [];
  const boxes = [
    [2, 2], [22, 1], [42, 2],
    [1, 22], [43, 22],
    [2, 42], [22, 43], [42, 42],
    [8, 7], [22, 6], [36, 7],
    [7, 15], [37, 15],
    [7, 29], [37, 29],
    [8, 37], [22, 38], [36, 37],
    [15, 19], [29, 19],
    [15, 25], [29, 25],
    [22, 17], [22, 27],
  ];
  for (const [x, z] of boxes) {
    positions.push([x, 2, z]);
  }
  return positions;
}

function getSpawnPositions() {
  // 10 posiciones alrededor del perímetro para FFA
  return [
    [5, 2, 5],     // NO
    [22, 2, 2],    // N centro
    [39, 2, 5],    // NE
    [42, 2, 22],   // E centro
    [39, 2, 39],   // SE
    [22, 2, 42],   // S centro
    [5, 2, 39],    // SO
    [2, 2, 22],    // O centro
    [12, 2, 12],   // Interior NO
    [32, 2, 32],   // Interior SE
  ];
}

export const showdownArena = {
  id: "showdown_arena",
  name: "Arena Supervivencia",
  category: "arenas",
  blocks: generateBlocks(),
  meta: {
    bushPositions: getBushPositions(),
    boxPositions: getBoxPositions(),
    spawnPositions: getSpawnPositions(),
  },
};
