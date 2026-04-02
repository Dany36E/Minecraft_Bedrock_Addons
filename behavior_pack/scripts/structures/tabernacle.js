// tabernacle.js — Tabernáculo del Desierto — Éxodo 25-31, 35-40
// Tienda sagrada con atrio, Lugar Santo y Lugar Santísimo
// Referencias clave: Éx 25 (mobiliario), Éx 26 (estructura), Éx 27 (atrio),
// Éx 30 (altar incienso, fuente bronce)

function generateTabernacle() {
  const blocks = [];
  // ── Materiales bíblicos ──
  const ACACIA_LOG = "minecraft:acacia_log";   // Madera de acacia (Éx 26:15)
  const ACACIA = "minecraft:acacia_planks";     // Tablas de acacia
  const BIRCH_LOG = "minecraft:birch_log";      // Postes del atrio
  const BIRCH_FENCE = "minecraft:birch_fence";
  const WHITE_WOOL = "minecraft:white_wool";    // Lino fino torcido (Éx 26:1)
  const BLUE_WOOL = "minecraft:blue_wool";      // Azul (Éx 26:1)
  const PURPLE_WOOL = "minecraft:purple_wool";  // Púrpura (Éx 26:1)
  const RED_WOOL = "minecraft:red_wool";        // Carmesí / pieles teñidas rojo (Éx 26:14)
  const BROWN_WOOL = "minecraft:brown_wool";    // Pieles de tejón / pelo cabra (Éx 26:7,14)
  const GOLD = "minecraft:gold_block";          // Oro (Éx 25:11)
  const COPPER = "minecraft:copper_block";      // Bronce = cobre (Éx 27:2)
  const IRON = "minecraft:iron_bars";           // Querubines
  const SAND = "minecraft:sand";                // Desierto
  const SILVER = "minecraft:iron_block";        // Plata = basas (Éx 26:19)

  // ── Dimensiones (proporcionales a los codos bíblicos) ──
  // Atrio: 100×50 codos → 50×25 bloques (1 bloque = 2 codos)
  const AL = 50; // largo atrio (x) — Éx 27:18
  const AW = 25; // ancho atrio (z) — Éx 27:12
  // Tabernáculo: 30×10×10 codos → 15×5×5 bloques
  const TL = 15; // largo tienda (x)
  const TW = 5;  // ancho tienda (z)
  const TH = 5;  // altura tienda
  // Tienda centrada al fondo oeste del atrio (entrada al este)
  const TX = 2;  // offset x tienda (fondo oeste)
  const TZ = Math.floor((AW - TW) / 2); // offset z centrado

  // ── Piso de arena del atrio (desierto) ──
  for (let x = 0; x < AL; x++)
    for (let z = 0; z < AW; z++)
      blocks.push([x, 0, z, SAND]);

  // ── Cerca del atrio — Éx 27:9-19 ──
  // Cortinas de lino blanco, 5 codos alto (≈3 bloques), postes c/5 con basas de bronce
  for (let y = 1; y <= 3; y++) {
    for (let x = 0; x < AL; x++) {
      // Norte y Sur (lados largos)
      blocks.push([x, y, 0, x % 5 === 0 ? (y === 1 ? COPPER : BIRCH_LOG) : WHITE_WOOL]);
      blocks.push([x, y, AW - 1, x % 5 === 0 ? (y === 1 ? COPPER : BIRCH_LOG) : WHITE_WOOL]);
    }
    for (let z = 1; z < AW - 1; z++) {
      // Oeste (fondo, cerrado)
      blocks.push([0, y, z, z % 5 === 0 ? (y === 1 ? COPPER : BIRCH_LOG) : WHITE_WOOL]);
      // Este (entrada) — puerta en el centro z=10..14
      if (z < 10 || z > 14)
        blocks.push([AL - 1, y, z, z % 5 === 0 ? (y === 1 ? COPPER : BIRCH_LOG) : WHITE_WOOL]);
    }
  }
  // ── Puerta del atrio — Éx 27:16: cortina de azul, púrpura, carmesí y lino ──
  for (let z = 10; z <= 14; z++) {
    blocks.push([AL - 1, 1, z, BLUE_WOOL]);
    blocks.push([AL - 1, 2, z, PURPLE_WOOL]);
    blocks.push([AL - 1, 3, z, RED_WOOL]);
  }
  // Postes de la puerta con basas de bronce
  for (let y = 1; y <= 3; y++) {
    blocks.push([AL - 1, y, 9, y === 1 ? COPPER : BIRCH_LOG]);
    blocks.push([AL - 1, y, 15, y === 1 ? COPPER : BIRCH_LOG]);
  }

  // ── Estructura del Tabernáculo — Éx 26:15-30 ──
  // Tablas de acacia revestidas de oro con basas de plata
  for (let x = TX; x <= TX + TL; x++) {
    for (let y = 1; y <= TH; y++) {
      // Paredes laterales (norte y sur)
      if (x > TX && x < TX + TL) {
        blocks.push([x, y, TZ, ACACIA_LOG]);      // pared sur
        blocks.push([x, y, TZ + TW, ACACIA_LOG]); // pared norte
      }
    }
    // Basas de plata (y=0 bajo las tablas) — Éx 26:19
    blocks.push([x, 0, TZ, SILVER]);
    blocks.push([x, 0, TZ + TW, SILVER]);
  }
  // Pared trasera (oeste, x=TX) — Éx 26:22-25
  for (let z = TZ; z <= TZ + TW; z++) {
    for (let y = 1; y <= TH; y++)
      blocks.push([TX, y, z, ACACIA_LOG]);
    blocks.push([TX, 0, z, SILVER]); // basas de plata
  }
  // Postes esquina reforzados — Éx 26:23-24
  for (let y = 1; y <= TH; y++) {
    blocks.push([TX + TL, y, TZ, ACACIA_LOG]);
    blocks.push([TX + TL, y, TZ + TW, ACACIA_LOG]);
  }

  // ── Cubierta: 4 capas — Éx 26:1-14 ──
  // Capa 1 (interior): Lino fino con azul, púrpura y carmesí
  for (let x = TX; x <= TX + TL; x++)
    for (let z = TZ; z <= TZ + TW; z++)
      blocks.push([x, TH, z, WHITE_WOOL]);
  // Capa 2: Pelo de cabra (cortinas de cilicio) — Éx 26:7
  for (let x = TX; x <= TX + TL; x++)
    for (let z = TZ; z <= TZ + TW; z++)
      blocks.push([x, TH + 1, z, BROWN_WOOL]);
  // Capa 3: Pieles de carnero teñidas de rojo — Éx 26:14a
  for (let x = TX + 1; x < TX + TL; x++)
    for (let z = TZ + 1; z < TZ + TW; z++)
      blocks.push([x, TH + 2, z, RED_WOOL]);

  // ── Piso interior de acacia ──
  for (let x = TX + 1; x < TX + TL; x++)
    for (let z = TZ + 1; z < TZ + TW; z++)
      blocks.push([x, 0, z, ACACIA]);

  // ── Pantalla de entrada del tabernáculo — Éx 26:36-37 ──
  // Azul, púrpura, carmesí y lino, con 5 columnas de acacia revestidas de oro
  const screenColors = [BLUE_WOOL, PURPLE_WOOL, RED_WOOL, WHITE_WOOL, BLUE_WOOL];
  for (let z = TZ + 1; z < TZ + TW; z++) {
    for (let y = 1; y < TH; y++) {
      const ci = (z - TZ - 1) % screenColors.length;
      blocks.push([TX + TL, y, z, screenColors[ci]]);
    }
  }
  // 5 columnas con basas de bronce — Éx 26:37
  for (let z = TZ; z <= TZ + TW; z++) {
    blocks.push([TX + TL, 0, z, COPPER]); // basas de bronce (no plata)
  }

  // ── Velo del Lugar Santísimo — Éx 26:31-33 ──
  // Azul, púrpura, carmesí y lino con querubines bordados
  // El Lugar Santísimo ocupa 10 codos = 5 bloques (1/3 del tabernáculo)
  const veilX = TX + 5; // 10 codos desde el fondo = 5 bloques
  for (let z = TZ + 1; z < TZ + TW; z++) {
    for (let y = 1; y < TH; y++) {
      const veilColor = y % 2 === 0 ? PURPLE_WOOL : BLUE_WOOL;
      blocks.push([veilX, y, z, veilColor]);
    }
  }
  // 4 columnas del velo con basas de plata — Éx 26:32
  for (let y = 1; y <= TH; y++) {
    blocks.push([veilX, y, TZ, ACACIA_LOG]);
    blocks.push([veilX, y, TZ + TW, ACACIA_LOG]);
  }
  blocks.push([veilX, 0, TZ, SILVER]);
  blocks.push([veilX, 0, TZ + TW, SILVER]);

  // ═══════════════════════════════════════════
  // ── LUGAR SANTÍSIMO (Éx 26:33-34) ──
  // ═══════════════════════════════════════════

  // ── Arca del Pacto — Éx 25:10-22 ──
  // 2.5 × 1.5 × 1.5 codos, acacia revestida de oro
  const arkX = TX + 2;
  const arkZ = TZ + Math.floor(TW / 2);
  // Cuerpo del arca (oro)
  blocks.push([arkX, 1, arkZ, GOLD]);
  blocks.push([arkX + 1, 1, arkZ, GOLD]);
  // Propiciatorio (kapporet) — tapa de oro puro
  blocks.push([arkX, 2, arkZ, GOLD]);
  blocks.push([arkX + 1, 2, arkZ, GOLD]);
  // Querubines de oro mirándose — Éx 25:18-20
  blocks.push([arkX, 3, arkZ, GOLD]);       // querubín izquierdo
  blocks.push([arkX + 1, 3, arkZ, GOLD]);   // querubín derecho
  blocks.push([arkX, 3, arkZ - 1, GOLD]);   // ala izq extendida
  blocks.push([arkX + 1, 3, arkZ + 1, GOLD]); // ala der extendida
  // Luz de la Shekinah (presencia de Dios) — Éx 25:22
  blocks.push([arkX, 4, arkZ, "minecraft:sea_lantern"]);

  // ═══════════════════════════════════════════
  // ── LUGAR SANTO (Éx 26:35) ──
  // ═══════════════════════════════════════════

  // ── Menorá / Candelabro de 7 brazos — Éx 25:31-40 ──
  // Lado sur del Lugar Santo, oro puro batido, 7 lámparas
  const menoraX = veilX + Math.floor((TX + TL - veilX) / 2);
  const menoraZ = TZ + 1; // lado sur
  // Tronco central (caña principal)
  blocks.push([menoraX, 1, menoraZ, GOLD]);
  blocks.push([menoraX, 2, menoraZ, GOLD]);
  blocks.push([menoraX, 3, menoraZ, GOLD]);
  blocks.push([menoraX, 4, menoraZ, "minecraft:torch"]); // lámpara central (1/7)
  // 6 brazos: 3 a cada lado, subiendo — Éx 25:32
  for (let i = 1; i <= 3; i++) {
    blocks.push([menoraX - i, 1 + i, menoraZ, GOLD]);  // brazo izq
    blocks.push([menoraX + i, 1 + i, menoraZ, GOLD]);  // brazo der
    // Cada brazo termina en lámpara — Éx 25:37 "7 lámparas"
    blocks.push([menoraX - i, 2 + i, menoraZ, "minecraft:torch"]); // lámparas 2,3,4
    blocks.push([menoraX + i, 2 + i, menoraZ, "minecraft:torch"]); // lámparas 5,6,7
  }

  // ── Mesa de los Panes de la Proposición — Éx 25:23-30 ──
  // Lado norte del Lugar Santo, acacia revestida de oro, 12 panes en 2 filas
  const tableX = menoraX;
  const tableZ = TZ + TW - 1; // lado norte
  // Patas de la mesa (acacia dorada)
  blocks.push([tableX, 1, tableZ, GOLD]);
  blocks.push([tableX + 1, 1, tableZ, GOLD]);
  // Superficie de la mesa
  blocks.push([tableX, 2, tableZ, "minecraft:birch_pressure_plate"]);
  blocks.push([tableX + 1, 2, tableZ, "minecraft:birch_pressure_plate"]);

  // ── Altar del Incienso — Éx 30:1-10 ──
  // 1×1×2 codos, acacia revestida de oro, 4 cuernos, frente al velo
  const incenseX = veilX + 1;
  const incenseZ = TZ + Math.floor(TW / 2);
  blocks.push([incenseX, 1, incenseZ, GOLD]);  // cuerpo
  blocks.push([incenseX, 2, incenseZ, GOLD]);  // cuerpo superior
  blocks.push([incenseX, 3, incenseZ, "minecraft:soul_torch"]); // incienso ardiendo

  // ═══════════════════════════════════════════
  // ── ATRIO (Éx 27) ──
  // ═══════════════════════════════════════════

  // ── Altar del Holocausto — Éx 27:1-8 ──
  // 5×5×3 codos, acacia revestida de BRONCE, 4 cuernos, rejilla de bronce
  const altarCX = Math.floor(AL * 0.7);
  const altarCZ = Math.floor(AW / 2);
  // Base de bronce (y=1)
  for (let ax = -1; ax <= 1; ax++)
    for (let az = -1; az <= 1; az++)
      blocks.push([altarCX + ax, 1, altarCZ + az, COPPER]);
  // Rejilla de bronce en el medio — Éx 27:4-5
  for (let ax = -1; ax <= 1; ax++)
    for (let az = -1; az <= 1; az++)
      blocks.push([altarCX + ax, 2, altarCZ + az, IRON]); // rejilla = iron_bars
  // Superficie superior de bronce
  blocks.push([altarCX, 3, altarCZ, COPPER]);
  // 4 cuernos de bronce en las esquinas — Éx 27:2
  blocks.push([altarCX - 1, 3, altarCZ - 1, COPPER]);
  blocks.push([altarCX + 1, 3, altarCZ - 1, COPPER]);
  blocks.push([altarCX - 1, 3, altarCZ + 1, COPPER]);
  blocks.push([altarCX + 1, 3, altarCZ + 1, COPPER]);
  // Fuego perpetuo — Levítico 6:13
  blocks.push([altarCX, 3, altarCZ, "minecraft:campfire"]);
  // Rampa de acceso — Éx 20:26 (sin escalones, rampa)
  blocks.push([altarCX, 0, altarCZ + 2, COPPER]);
  blocks.push([altarCX, 0, altarCZ + 3, COPPER]);

  // ── Fuente de Bronce / Lavacro — Éx 30:17-21 ──
  // BRONCE, entre el altar y el tabernáculo, para lavarse manos y pies
  const lavX = Math.floor(AL * 0.5);
  const lavZ = Math.floor(AW / 2);
  // Pedestal de bronce
  blocks.push([lavX, 1, lavZ, COPPER]);
  // Tazón (bordes de bronce, agua en centro)
  for (let lx = -1; lx <= 1; lx++)
    for (let lz = -1; lz <= 1; lz++) {
      if (lx === 0 && lz === 0)
        blocks.push([lavX + lx, 2, lavZ + lz, "minecraft:water"]);
      else
        blocks.push([lavX + lx, 2, lavZ + lz, COPPER]);
    }

  return blocks;
}

export const tabernacle = {
  id: "tabernacle",
  name: "Tabernáculo",
  category: "biblicas",
  description: "La tienda sagrada del desierto — Éxodo 25-27",
  blocks: generateTabernacle()
};
