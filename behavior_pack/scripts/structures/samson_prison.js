// samson_prison.js — Prisión Filistea de Gaza (Jueces 16:21-22)
// ══════════════════════════════════════════════════════════════
// REDISEÑO COMPLETO — Basado en investigación bíblica y arqueológica
//
// TEXTO BÍBLICO (Jueces 16:21):
//   "Mas los filisteos le echaron mano, y le sacaron los ojos,
//    y le llevaron a Gaza; y le ataron con cadenas de bronce,
//    y estuvo moliendo en la cárcel."
//
// Jueces 16:22:
//   "Y el cabello de su cabeza comenzó a crecer,
//    después que fue rapado."
//
// CONTEXTO HISTÓRICO:
//   Gaza era una de las 5 ciudades de la Pentápolis filistea
//   (Gaza, Ascalón, Asdod, Ecrón, Gat).
//   Los filisteos (Peleset) eran pueblos del mar de origen egeo,
//   cuya arquitectura mezclaba influencias micénicas y cananeas.
//   Las prisiones antiguas servían como centros de trabajo
//   forzado — moler grano era trabajo de esclavos y animales.
//
// ARQUEOLOGÍA:
//   - Los molinos de la Edad del Hierro usaban un pivote central
//     (piedra inferior fija) y una piedra superior giratoria
//     empujada por un brazo que el prisionero hacía girar
//   - Las cárceles filisteas usaban grilletes de bronce (cobre)
//   - Muros de piedra gruesos con mampostería ciclópea en la base
//
// DISEÑO: 30×11×24 (largo×alto×ancho)
//   Zona A (x=0-14):  Sala de molienda (donde Sansón trabajaba)
//   Zona B (x=15-19): Patio de guardia (custodia y acceso)
//   Zona C (x=20-29): Celdas de prisioneros (mazmorra)
// ══════════════════════════════════════════════════════════════

function generateSamsonPrison() {
  const blocks = [];
  const L = 30, W = 24, H = 10;

  // ══════════════════════════════════════════
  // PALETA DE MATERIALES
  // ══════════════════════════════════════════
  const STONE_B  = "minecraft:stone_bricks";
  const CRACKED  = "minecraft:cracked_stone_bricks";
  const DEEP_B   = "minecraft:deepslate_bricks";
  const COBBLE   = "minecraft:cobblestone";
  const MOSSY_C  = "minecraft:mossy_cobblestone";
  const SMOOTH_S = "minecraft:smooth_stone";
  const STONE    = "minecraft:stone";
  const PLANK    = "minecraft:spruce_planks";
  const IRON_BAR = "minecraft:iron_bars";
  const CHAIN    = "minecraft:chain";
  const COPPER   = "minecraft:copper_block";
  const GRIND    = "minecraft:grindstone";
  const COBBLE_W = "minecraft:cobblestone_wall";
  const ANVIL    = "minecraft:anvil";
  const S_TORCH  = "minecraft:soul_torch";
  const LANTERN  = "minecraft:lantern";
  const S_LANT   = "minecraft:soul_lantern";
  const BARREL   = "minecraft:barrel";
  const CAULDRON = "minecraft:cauldron";
  const AIR      = "minecraft:air";
  const WOOL     = "minecraft:brown_wool";
  const HAY      = "minecraft:hay_block";

  const b = (x, y, z, t) => { blocks.push([x, y, z, t]); };

  // ══════════════════════════════════════════
  // CIMIENTOS Y SUELO
  // ══════════════════════════════════════════
  for (let x = 0; x < L; x++) {
    for (let z = 0; z < W; z++) {
      b(x, 0, z, DEEP_B);
      b(x, 1, z, COBBLE);
    }
  }
  // Suelo Zona A: piedra desgastada
  for (let x = 1; x < 14; x++) {
    for (let z = 1; z < W - 1; z++) b(x, 1, z, SMOOTH_S);
  }
  // Suelo Zona C: piedra musgosa (humedad)
  for (let x = 21; x < L - 1; x++) {
    for (let z = 1; z < W - 1; z++) b(x, 1, z, MOSSY_C);
  }

  // ══════════════════════════════════════════
  // MUROS EXTERIORES
  // Mampostería mixta (stone_bricks + cracked)
  // ══════════════════════════════════════════
  for (let y = 2; y <= H; y++) {
    for (let x = 0; x < L; x++) {
      const isEdge = x % 7 === 0;
      const mat = isEdge ? DEEP_B : (y <= 3 ? STONE_B : ((x + y) % 5 === 0 ? CRACKED : STONE_B));
      b(x, y, 0, mat);
      b(x, y, W - 1, mat);
    }
    for (let z = 1; z < W - 1; z++) {
      const mat = (y <= 3) ? STONE_B : ((z + y) % 5 === 0 ? CRACKED : STONE_B);
      b(0, y, z, mat);
      b(L - 1, y, z, mat);
    }
  }

  // ══════════════════════════════════════════
  // TECHO
  // ══════════════════════════════════════════
  for (let x = 0; x < L; x++) {
    for (let z = 0; z < W; z++) b(x, H + 1, z, STONE_B);
  }
  for (let x = 4; x < L; x += 5) {
    for (let z = 1; z < W - 1; z++) b(x, H, z, DEEP_B);
  }

  // ══════════════════════════════════════════
  // MUROS DIVISORES INTERNOS
  // ══════════════════════════════════════════

  // Muro Zona A|B (x=14)
  for (let y = 2; y <= H; y++) {
    for (let z = 0; z < W; z++) b(14, y, z, STONE_B);
  }
  // Arco de paso (z=10..13, y=2..5)
  for (let z = 10; z <= 13; z++) {
    for (let y = 2; y <= 5; y++) b(14, y, z, AIR);
    b(14, 6, z, DEEP_B);
  }

  // Muro Zona B|C (x=20)
  for (let y = 2; y <= H; y++) {
    for (let z = 0; z < W; z++) b(20, y, z, STONE_B);
  }
  // Puerta con rejas (z=11..12, y=2..4)
  for (let z = 11; z <= 12; z++) {
    for (let y = 2; y <= 4; y++) b(20, y, z, IRON_BAR);
    b(20, 5, z, DEEP_B);
  }

  // ══════════════════════════════════════════
  // ENTRADA PRINCIPAL (z=0, x=16..17)
  // ══════════════════════════════════════════
  for (let dx = 16; dx <= 17; dx++) {
    for (let y = 2; y <= 4; y++) b(dx, y, 0, AIR);
  }
  b(15, 5, 0, DEEP_B); b(16, 5, 0, IRON_BAR);
  b(17, 5, 0, IRON_BAR); b(18, 5, 0, DEEP_B);

  // ══════════════════════════════════════════════════════════════
  // ZONA A: SALA DE MOLIENDA (x=1-13)
  // "...y estuvo moliendo en la cárcel" — Jueces 16:21
  // ══════════════════════════════════════════════════════════════

  // ── MOLINO GRANDE (centro: x=7, z=12) ──
  b(7, 2, 12, ANVIL);   // piedra inferior fija
  b(7, 3, 12, GRIND);   // piedra superior (grindstone)
  for (let y = 4; y <= H; y++) b(7, y, 12, CHAIN); // cadena al techo

  // Brazo del molino (palanca que Sansón empujaba)
  for (let dx = -3; dx <= 3; dx++) {
    if (dx === 0) continue;
    b(7 + dx, 3, 12, COBBLE_W);
  }

  // Pista circular desgastada
  const millPath = [
    [5,10],[5,11],[5,12],[5,13],[5,14],
    [6,9],[6,15], [7,9],[7,15], [8,9],[8,15],
    [9,10],[9,11],[9,12],[9,13],[9,14],
  ];
  for (const [mx, mz] of millPath) b(mx, 1, mz, STONE);

  // Grillos de bronce — "le ataron con cadenas de bronce"
  b(5, 2, 12, COPPER); b(9, 2, 12, COPPER);
  b(5, 3, 12, CHAIN);  b(9, 3, 12, CHAIN);
  b(6, 3, 12, CHAIN);  b(8, 3, 12, CHAIN);

  // ── Segundo molino menor (x=7, z=5) ──
  b(7, 2, 5, COBBLE_W);
  b(7, 3, 5, GRIND);
  for (let dx = -2; dx <= 2; dx++) {
    if (dx === 0) continue;
    b(7 + dx, 3, 5, COBBLE_W);
  }

  // Sacos de grano apilados
  const grainPos = [
    [2,2,2],[2,3,2],[3,2,2],
    [2,2,20],[3,2,20],[2,3,20],
    [11,2,2],[12,2,2],[11,3,2],
    [11,2,20],[12,2,20],
  ];
  for (const [gx, gy, gz] of grainPos) b(gx, gy, gz, HAY);

  // Barriles de agua
  b(1, 2, 10, BARREL); b(1, 2, 14, BARREL);
  b(13, 2, 10, BARREL); b(13, 2, 14, BARREL);
  b(1, 2, 12, CAULDRON);

  // Cadenas colgantes del techo
  const chainPos = [[3,8],[3,16],[11,8],[11,16]];
  for (const [cx, cz] of chainPos) {
    for (let y = H - 2; y <= H; y++) b(cx, y, cz, CHAIN);
  }

  // Iluminación tenue
  const torchA = [
    [1,6,1],[13,6,1],[1,6,W-2],[13,6,W-2],
    [1,6,12],[13,6,12],[7,6,1],[7,6,W-2],
  ];
  for (const [tx, ty, tz] of torchA) b(tx, ty, tz, S_TORCH);

  // Columnas de soporte (Zona A)
  const pillars = [[3,7],[3,17],[11,7],[11,17]];
  for (const [px, pz] of pillars) {
    for (let y = 2; y <= H; y++) b(px, y, pz, STONE_B);
    b(px, 2, pz, DEEP_B);
  }

  // ══════════════════════════════════════════════════════════════
  // ZONA B: PATIO DE GUARDIA (x=15-19)
  // ══════════════════════════════════════════════════════════════

  // Mesa del guardia
  b(17, 2, 6, PLANK); b(17, 2, 7, PLANK);
  b(16, 2, 6, COBBLE_W); b(18, 2, 7, COBBLE_W);

  // Provisiones
  b(15, 2, 2, BARREL); b(15, 3, 2, BARREL); b(15, 2, 3, BARREL);

  // Estante de armas
  b(19, 3, 4, IRON_BAR); b(19, 4, 4, IRON_BAR);
  b(19, 3, 5, IRON_BAR); b(19, 4, 5, IRON_BAR);

  // Linternas del guardia
  b(17, H, 6, LANTERN); b(17, H, 18, LANTERN);

  // Banco y llave
  b(16, 2, 2, PLANK); b(17, 2, 2, PLANK);
  b(18, 2, 2, ANVIL);

  b(15, 6, 12, S_TORCH); b(19, 6, 12, S_TORCH);

  // ══════════════════════════════════════════════════════════════
  // ZONA C: CELDAS (x=21-28)
  //   z=1-5:    Celda 1
  //   z=6:      Muro
  //   z=7-10:   Celda de Sansón (la más grande)
  //   z=11-12:  Corredor principal
  //   z=13-17:  Celda 3
  //   z=18:     Muro
  //   z=19-22:  Celda 4
  // ══════════════════════════════════════════════════════════════

  // Corredor principal
  for (let x = 21; x < L - 1; x++) {
    b(x, 1, 11, SMOOTH_S); b(x, 1, 12, SMOOTH_S);
  }

  // Muros de separación de celdas
  const cellWalls = [6, 8, 14, 18];
  for (const wz of cellWalls) {
    for (let y = 2; y <= H; y++) {
      for (let x = 21; x < L - 1; x++) b(x, y, wz, STONE_B);
    }
  }

  // Rejas de entrada a cada celda (x=24..25)
  for (const rz of [6, 8, 14, 18]) {
    for (let y = 4; y <= 5; y++) {
      b(24, y, rz, IRON_BAR); b(25, y, rz, IRON_BAR);
    }
    b(24, 6, rz, DEEP_B); b(25, 6, rz, DEEP_B);
    b(24, 2, rz, AIR); b(24, 3, rz, AIR);
    b(25, 2, rz, AIR); b(25, 3, rz, AIR);
  }

  // ── CELDA DE SANSÓN (z=9-10 interior) ──
  // Grilletes de bronce en la pared
  b(L-2, 3, 10, COPPER); b(L-2, 4, 10, COPPER);
  b(L-2, 3, 9, CHAIN);  b(L-2, 4, 9, CHAIN);
  b(L-2, 3, 11, CHAIN); b(L-2, 4, 11, CHAIN);
  // Jergón
  b(22, 2, 10, WOOL); b(23, 2, 10, WOOL);
  b(22, 2, 9, HAY);
  // Plato de comida
  b(22, 2, 11, CAULDRON);
  // Linterna en celda de Sansón
  b(25, H, 10, S_LANT);

  // ── Celda 1 (z=1-5) ──
  b(22, 2, 3, WOOL); b(23, 2, 3, WOOL);
  b(27, 3, 2, CHAIN); b(27, 4, 2, CHAIN);

  // ── Celda 3 (z=15-17) ──
  b(22, 2, 16, WOOL); b(23, 2, 16, WOOL);
  b(27, 3, 16, CHAIN); b(27, 4, 16, CHAIN);
  b(22, 2, 15, CAULDRON);

  // ── Celda 4 (z=19-22) ──
  b(22, 2, 20, WOOL); b(23, 2, 20, WOOL);
  b(27, 3, 21, CHAIN); b(27, 4, 21, CHAIN);

  // Iluminación de celdas
  b(21, 6, 3, S_TORCH); b(21, 6, 16, S_TORCH); b(21, 6, 20, S_TORCH);
  b(21, 6, 11, S_TORCH); b(28, 6, 11, S_TORCH);

  // ══════════════════════════════════════════
  // DETALLES AMBIENTALES
  // ══════════════════════════════════════════

  // Marcas de desgaste (bloques agrietados)
  const cracks = [
    [L-2,5,10],[L-2,6,11],[L-2,5,9],
    [21,4,10],[21,5,11],[1,4,6],[1,5,8],
  ];
  for (const [cx, cy, cz] of cracks) b(cx, cy, cz, CRACKED);

  return blocks;
}

export const samsonPrison = {
  id: "samson_prison",
  name: "Prisión de Gaza",
  category: "samson",
  description: "La cárcel filistea donde Sansón molía ciego y encadenado — Jueces 16:21",
  blocks: generateSamsonPrison(),
};
