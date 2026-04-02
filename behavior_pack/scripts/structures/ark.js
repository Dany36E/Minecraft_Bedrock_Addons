// ark.js — Arca de Noé — Génesis 6:14-16
// ══════════════════════════════════════════════════════════════
// REDISEÑO COMPLETO — Basado en investigación bíblica y talmúdica
//
// ESPECIFICACIONES BÍBLICAS (Génesis 6:14-16):
//   Dimensiones: 300 × 50 × 30 codos (≈137 × 23 × 14 m)
//   Proporción: 6:1 largo:ancho (óptima para estabilidad marítima)
//   Material: madera de gofer (prob. ciprés), calafateada con
//             kopher (brea/betún) por dentro y por fuera
//   Interior: qinnim (aposentos/compartimentos) — Gn 6:14
//   Pisos: 3 niveles internos — Gn 6:16
//   Ventana: tsohar — franja continua a 1 codo del techo — Gn 6:16
//   Puerta: una sola, al costado — Gn 6:16
//
// DISTRIBUCIÓN (Talmud, Sanedrín 108b):
//   Piso 1 (inferior): animales salvajes y desechos
//   Piso 2 (medio): animales domésticos, aves, almacén de alimento
//   Piso 3 (superior): Noé y su familia (8 personas — Gn 7:13)
//
// TRADICIÓN CRISTIANA (Hipólito de Roma, siglo III):
//   Piso inferior: bestias salvajes
//   Piso medio: aves y animales domésticos
//   Piso superior: humanos
//   Machos separados de hembras por estacas
//
// Escala Minecraft: 1 bloque ≈ 4 codos → 75 × 15 × ~20 bloques
// ══════════════════════════════════════════════════════════════

function generateArk() {
  const blocks = [];

  // ══════════════════════════════════════════
  // PALETA DE MATERIALES
  // ══════════════════════════════════════════

  // Exterior — oscuro por la brea/betún (Gn 6:14 "la calafatearás con brea")
  const HULL   = "minecraft:dark_oak_planks";
  const KEEL   = "minecraft:dark_oak_log";
  const RIB    = "minecraft:stripped_dark_oak_log";
  const BORDA  = "minecraft:dark_oak_fence";

  // Interior — madera de gofer/ciprés (spruce = conífera similar)
  const PLANK  = "minecraft:spruce_planks";
  const BEAM   = "minecraft:stripped_spruce_log";
  const SLOG   = "minecraft:spruce_log";
  const FENCE  = "minecraft:spruce_fence";
  const OAK_F  = "minecraft:oak_fence";

  // Ventana tsohar (Gn 6:16)
  const GLASS  = "minecraft:glass_pane";

  // Techo
  const ROOF   = "minecraft:dark_oak_planks";
  const RIDGE  = "minecraft:dark_oak_log";

  // Detalles interiores
  const HAY     = "minecraft:hay_block";
  const LANTERN = "minecraft:lantern";
  const BARREL  = "minecraft:barrel";
  const CAULDRON= "minecraft:cauldron";
  const CHEST   = "minecraft:chest";
  const CRAFTING= "minecraft:crafting_table";
  const FURNACE = "minecraft:furnace";
  const LADDER  = "minecraft:ladder";
  const WOOL    = "minecraft:brown_wool";
  const CARPET_R= "minecraft:red_carpet";
  const CARPET_B= "minecraft:brown_carpet";
  const TORCH   = "minecraft:torch";
  const AIR     = "minecraft:air";

  // ══════════════════════════════════════════
  // DIMENSIONES
  // ══════════════════════════════════════════
  const L     = 75;   // largo total (eje X)
  const maxHW = 7;    // mitad del ancho máximo (total = 15)
  const BOW   = 12;   // largo de proa (curva de entrada)
  const STERN = 10;   // largo de popa

  // Alturas de cubierta
  const D1 = 2;   // piso nivel 1
  const D2 = 6;   // piso nivel 2
  const D3 = 10;  // piso nivel 3
  const TD = 14;  // cubierta superior abierta

  const SP = 8;    // espaciado de costillas

  // ══════════════════════════════════════════
  // FORMA DEL CASCO
  // Curva suave: raíz cuadrada para proa/popa
  // ══════════════════════════════════════════
  function hw(x) {
    if (x < BOW) return Math.max(1, Math.round(maxHW * Math.sqrt(x / BOW)));
    if (x > L - STERN) return Math.max(2, Math.round(maxHW * Math.sqrt((L - x) / STERN)));
    return maxHW;
  }

  const b = (x, y, z, t) => { blocks.push([x, y, z, t]); };

  // ════════════════════════════════════════════════════════
  // 1. QUILLA — columna vertebral del arca (y=0)
  // ════════════════════════════════════════════════════════
  for (let x = 0; x < L; x++) b(x, 0, 0, KEEL);

  // Tajamar de proa (poste frontal elevado)
  for (let y = 1; y <= TD + 4; y++) b(0, y, 0, KEEL);
  for (let y = 1; y <= TD + 3; y++) b(1, y, 0, KEEL);

  // Codaste de popa (poste trasero)
  for (let y = 1; y <= TD + 3; y++) b(L - 1, y, 0, KEEL);
  for (let y = 1; y <= TD + 2; y++) b(L - 2, y, 0, KEEL);

  // ════════════════════════════════════════════════════════
  // 2. CARENA — fondo del casco (y=1), forma de V aplanada
  // ════════════════════════════════════════════════════════
  for (let x = 2; x < L - 2; x++) {
    const w = hw(x);
    const w1 = Math.max(1, w - 2);
    for (let z = -w1; z <= w1; z++) b(x, 1, z, HULL);
  }

  // ════════════════════════════════════════════════════════
  // 3. PISOS DE CUBIERTA (y=2, 6, 10, 14)
  //    Vigas de piso marcadas cada 8 bloques
  // ════════════════════════════════════════════════════════
  for (const fy of [D1, D2, D3, TD]) {
    for (let x = 2; x < L - 2; x++) {
      const inner = Math.max(0, hw(x) - 1);
      for (let z = -inner; z <= inner; z++) {
        b(x, fy, z, (x % SP === 0) ? BEAM : PLANK);
      }
    }
  }

  // ════════════════════════════════════════════════════════
  // 4. PAREDES EXTERIORES (y=3 a y=13)
  //    Calafateadas con brea = dark oak
  // ════════════════════════════════════════════════════════
  for (let x = 0; x < L; x++) {
    const w = hw(x);
    for (let y = 3; y <= 13; y++) {
      b(x, y, -w, HULL);
      b(x, y, w, HULL);
    }
    // Cerrar proa y popa (sólido)
    if (x <= 2 || x >= L - 2) {
      for (let z = -w; z <= w; z++) {
        for (let y = 1; y <= 13; y++) b(x, y, z, HULL);
      }
    }
  }

  // ════════════════════════════════════════════════════════
  // 5. COSTILLAS ESTRUCTURALES (cada 8 bloques)
  //    Cuadernas visibles como dark oak descortezado
  // ════════════════════════════════════════════════════════
  for (let x = SP; x < L - 3; x += SP) {
    const w = hw(x);
    // Costillas verticales en las paredes
    for (let y = 1; y <= 13; y++) {
      b(x, y, -w, RIB);
      b(x, y, w, RIB);
    }
    // Vigas transversales centrales en cada entrepiso
    for (const fy of [D2, D3, TD]) {
      for (let z = -(w - 1); z <= w - 1; z++) b(x, fy, z, BEAM);
    }
    // Viga de quilla interior
    for (const fy of [D2, D3]) b(x, fy, 0, SLOG);
  }

  // ════════════════════════════════════════════════════════
  // 6. VENTANA TSOHAR — Génesis 6:16
  //    "Una ventana harás al arca, y la acabarás
  //     a un codo de elevación por arriba"
  //    Franja continua en y=13 (tope de las paredes)
  // ════════════════════════════════════════════════════════
  for (let x = 5; x < L - 5; x++) {
    const w = hw(x);
    if (w >= 4 && x % SP !== 0) {
      b(x, 13, -w, GLASS);
      b(x, 13, w, GLASS);
    }
  }

  // ════════════════════════════════════════════════════════
  // 7. PUERTA LATERAL — Génesis 6:16
  //    "Pondrás la puerta del arca a su lado"
  //    Una sola puerta al costado sur, nivel 1
  // ════════════════════════════════════════════════════════
  const doorX = 20;
  const doorW = hw(doorX);

  // Hueco de puerta: 2 ancho × 3 alto
  for (let dx = 0; dx <= 1; dx++) {
    for (let dy = 3; dy <= 5; dy++) b(doorX + dx, dy, doorW, AIR);
  }
  // Marco con madera gruesa
  for (let dy = 3; dy <= 6; dy++) {
    b(doorX - 1, dy, doorW, KEEL);
    b(doorX + 2, dy, doorW, KEEL);
  }
  b(doorX, 6, doorW, KEEL);
  b(doorX + 1, 6, doorW, KEEL);

  // Rampa de acceso desde el suelo (3 bloques hacia afuera)
  for (let r = 1; r <= 3; r++) {
    b(doorX, 3 - r, doorW + r, HULL);
    b(doorX + 1, 3 - r, doorW + r, HULL);
    // Baranda de la rampa
    b(doorX - 1, 4 - r, doorW + r, OAK_F);
    b(doorX + 2, 4 - r, doorW + r, OAK_F);
  }

  // ════════════════════════════════════════════════════════
  // 8. BORDA DE CUBIERTA SUPERIOR (y=15)
  //    Barandilla de seguridad en la cubierta abierta
  // ════════════════════════════════════════════════════════
  for (let x = 3; x < L - 3; x++) {
    const w = hw(x);
    if (w >= 3) {
      b(x, TD + 1, -w, BORDA);
      b(x, TD + 1, w, BORDA);
    }
  }

  // ════════════════════════════════════════════════════════
  // 9. TECHO A DOS AGUAS (y=15 a y=18)
  //    Perfil escalonado piramidal
  // ════════════════════════════════════════════════════════
  for (let x = 4; x < L - 4; x++) {
    const w = Math.min(hw(x), maxHW);
    const rw = Math.max(2, w - 1);

    let cz = rw;
    let cy = TD + 1;
    while (cz > 0) {
      // Dos bloques anchos por escalón (cada lado)
      b(x, cy, -cz, ROOF);
      b(x, cy, cz, ROOF);
      if (cz > 1) {
        b(x, cy, -(cz - 1), ROOF);
        b(x, cy, (cz - 1), ROOF);
      }
      cz -= 2;
      cy++;
    }
    // Cresta / viga cumbrera
    b(x, cy, 0, RIDGE);
  }

  // ══════════════════════════════════════════════════════════════
  //
  //  I N T E R I O R E S
  //
  // ══════════════════════════════════════════════════════════════

  // ════════════════════════════════════════════════════════
  // PISO 1 (y=3-5): ANIMALES SALVAJES
  // (Talmud, Sanedrín 108b: piso inferior para bestias)
  //
  // Layout:
  //   Corredor central a z=0
  //   Establos a cada lado, divididos por vallas
  //   Heno y bebederos en cada corral
  // ════════════════════════════════════════════════════════

  // Divisores laterales del corredor (z=±3)
  for (let x = 5; x < L - 5; x++) {
    if (hw(x) < 5) continue;
    for (let y = 3; y <= 4; y++) {
      b(x, y, -3, FENCE);
      b(x, y, 3, FENCE);
    }
  }

  // Divisiones transversales de corrales (cada 5 bloques)
  for (let x = 8; x < L - 8; x += 5) {
    const w = hw(x);
    if (w < 5) continue;
    // Corrales norte
    for (let z = -(w - 1); z < -3; z++) {
      b(x, 3, z, FENCE);
      b(x, 4, z, FENCE);
    }
    // Corrales sur
    for (let z = 4; z < w; z++) {
      b(x, 3, z, FENCE);
      b(x, 4, z, FENCE);
    }
    // Puertas de corral (hueco)
    b(x, 3, -3, AIR); b(x, 4, -3, AIR);
    b(x, 3, 3, AIR);  b(x, 4, 3, AIR);
  }

  // Heno en los corrales (forraje)
  for (let x = 6; x < L - 6; x += 5) {
    const w = hw(x);
    if (w < 5) continue;
    b(x, 3, -(w - 1), HAY);
    b(x, 3, (w - 1), HAY);
    // Algunos henos apilados
    if (x % 10 === 6) {
      b(x, 4, -(w - 1), HAY);
      b(x, 4, (w - 1), HAY);
    }
  }

  // Bebederos (abrevaderos para animales)
  for (let x = 9; x < L - 9; x += 10) {
    const w = hw(x);
    if (w < 5) continue;
    b(x, 3, -4, CAULDRON);
    b(x, 3, 4, CAULDRON);
  }

  // Estacas separadoras (Hipólito: machos y hembras separados)
  for (let x = 10; x < L - 10; x += 10) {
    const w = hw(x);
    if (w < 6) continue;
    for (let y = 3; y <= 4; y++) {
      b(x + 2, y, -(w - 3), FENCE);
      b(x + 2, y, (w - 3), FENCE);
    }
  }

  // Linternas en el techo del corredor
  for (let x = 6; x < L - 6; x += 8) {
    b(x, 5, 0, LANTERN);
  }

  // ════════════════════════════════════════════════════════
  // PISO 2 (y=7-9): ANIMALES DOMÉSTICOS Y ALMACÉN
  // (Talmud: ganado, aves; Hipólito: aves y domésticos)
  //
  // Layout:
  //   Corredor central
  //   Norte: corrales para domésticos con heno
  //   Sur: almacén de provisiones (barriles, cofres)
  // ════════════════════════════════════════════════════════

  // Corredor central
  for (let x = 5; x < L - 5; x++) {
    if (hw(x) < 5) continue;
    for (let y = 7; y <= 8; y++) {
      b(x, y, -3, FENCE);
      b(x, y, 3, FENCE);
    }
  }

  // Divisiones transversales cada 6 bloques
  for (let x = 8; x < L - 8; x += 6) {
    const w = hw(x);
    if (w < 5) continue;
    for (let z = -(w - 1); z < -3; z++) b(x, 7, z, FENCE);
    for (let z = 4; z < w; z++) b(x, 7, z, FENCE);
    b(x, 7, -3, AIR); b(x, 7, 3, AIR);
  }

  // Barriles de provisiones (lado norte — grano, agua, frutos)
  for (let x = 5; x < L - 5; x += 3) {
    const w = hw(x);
    if (w < 5) continue;
    b(x, 7, -(w - 1), BARREL);
    if (w >= 6 && x % 6 === 5) b(x, 8, -(w - 1), BARREL);
  }

  // Cofres de suministros (lado sur)
  for (let x = 7; x < L - 7; x += 6) {
    const w = hw(x);
    if (w < 5) continue;
    b(x, 7, (w - 1), CHEST);
  }

  // Heno apilado para domésticos
  for (let x = 10; x < L - 10; x += 6) {
    const w = hw(x);
    if (w < 5) continue;
    b(x, 7, 4, HAY);
    b(x + 1, 7, 4, HAY);
    b(x, 8, 4, HAY);
  }

  // Perchas para aves (fences en alto)
  for (let x = 14; x < L - 14; x += 8) {
    const w = hw(x);
    if (w < 5) continue;
    b(x, 9, -5, OAK_F);
    b(x, 9, 5, OAK_F);
  }

  // Linternas
  for (let x = 6; x < L - 6; x += 8) {
    b(x, 9, 0, LANTERN);
  }

  // ════════════════════════════════════════════════════════
  // PISO 3 (y=11-13): FAMILIA DE NOÉ
  // 8 personas: Noé, su esposa, Sem, Cam, Jafet y sus 3 esposas
  // (Génesis 7:13)
  //
  // Distribución de habitaciones (de proa a popa):
  //   [x=4-14]  Cocina y taller
  //   [x=16-27] Almacén principal de la familia
  //   [x=29-39] Comedor / sala común
  //   [x=41-51] Dormitorios de Sem y Cam + esposas
  //   [x=53-63] Dormitorios de Jafet + Cámara de Noé
  //   [x=65-72] Aves especiales / enfermería animal
  // ════════════════════════════════════════════════════════

  // Muros divisorios entre habitaciones
  const walls = [15, 28, 40, 52, 64];
  for (const wx of walls) {
    const w = hw(wx);
    if (w < 4) continue;
    for (let z = -(w - 1); z <= w - 1; z++) {
      for (let y = 11; y <= 13; y++) b(wx, y, z, PLANK);
    }
    // Puerta central
    b(wx, 11, 0, AIR);
    b(wx, 12, 0, AIR);
  }

  // ── Sala 1: COCINA (x=4-14) ──────────────────────
  b(6, 11, -5, FURNACE);
  b(7, 11, -5, FURNACE);
  b(8, 11, -5, CRAFTING);
  b(10, 11, -5, BARREL);
  b(11, 11, -5, BARREL);
  b(6, 11, -4, CAULDRON);
  b(12, 11, -4, CHEST);
  // Mesa de preparación
  b(8, 11, -2, FENCE);
  b(9, 11, -2, FENCE);
  b(8, 12, -2, CARPET_B);
  b(9, 12, -2, CARPET_B);
  // Almacén de alimentos al otro lado
  b(6, 11, 4, BARREL); b(7, 11, 4, BARREL);
  b(8, 11, 4, BARREL); b(9, 11, 4, BARREL);
  b(6, 11, 5, CHEST);  b(7, 11, 5, CHEST);
  b(8, 13, 0, LANTERN);

  // ── Sala 2: ALMACÉN PRINCIPAL (x=16-27) ──────────
  for (let x = 17; x <= 26; x += 2) {
    const w = hw(x);
    if (w < 5) continue;
    b(x, 11, -(w - 1), BARREL);
    b(x, 11, (w - 1), BARREL);
    if (w >= 6) {
      b(x, 11, -(w - 2), BARREL);
      b(x, 11, (w - 2), BARREL);
      if (x % 4 === 1) {
        b(x, 12, -(w - 1), BARREL);
        b(x, 12, (w - 1), BARREL);
      }
    }
  }
  for (let x = 18; x <= 26; x += 4) {
    b(x, 11, 0, CHEST);
  }
  b(22, 13, 0, LANTERN);

  // ── Sala 3: COMEDOR / SALA COMÚN (x=29-39) ───────
  // Mesa grande (fences con tapete encima)
  for (let z = -2; z <= 2; z++) {
    b(32, 11, z, FENCE); b(33, 11, z, FENCE);
    b(32, 12, z, CARPET_B); b(33, 12, z, CARPET_B);
  }
  // Asientos
  b(31, 11, -2, FENCE); b(31, 11, 0, FENCE); b(31, 11, 2, FENCE);
  b(34, 11, -2, FENCE); b(34, 11, 0, FENCE); b(34, 11, 2, FENCE);
  // Alfombra decorativa
  for (let z = -1; z <= 1; z++) {
    b(30, 11, z, CARPET_R);
    b(35, 11, z, CARPET_R);
  }
  b(34, 13, 0, LANTERN);

  // ── Sala 4: DORMITORIOS SEM Y CAM (x=41-51) ─────
  // "Sem, Cam y Jafet, hijos de Noé" — Gn 7:13

  // Camas de Sem + esposa (lado norte)
  b(43, 11, -5, WOOL); b(44, 11, -5, WOOL);
  b(43, 12, -5, CARPET_R); b(44, 12, -5, CARPET_R);
  b(43, 11, -4, WOOL); b(44, 11, -4, WOOL);
  b(43, 12, -4, CARPET_R); b(44, 12, -4, CARPET_R);
  b(45, 11, -5, CHEST);

  // Separador central
  for (let y = 11; y <= 12; y++) b(48, y, 0, FENCE);

  // Camas de Cam + esposa (lado sur)
  b(43, 11, 5, WOOL); b(44, 11, 5, WOOL);
  b(43, 12, 5, CARPET_R); b(44, 12, 5, CARPET_R);
  b(43, 11, 4, WOOL); b(44, 11, 4, WOOL);
  b(43, 12, 4, CARPET_R); b(44, 12, 4, CARPET_R);
  b(45, 11, 5, CHEST);

  b(46, 13, 0, LANTERN);

  // ── Sala 5: JAFET + CÁMARA DE NOÉ (x=53-63) ─────

  // Camas de Jafet + esposa
  b(55, 11, -5, WOOL); b(56, 11, -5, WOOL);
  b(55, 12, -5, CARPET_R); b(56, 12, -5, CARPET_R);
  b(55, 11, -4, WOOL); b(56, 11, -4, WOOL);
  b(55, 12, -4, CARPET_R); b(56, 12, -4, CARPET_R);
  b(57, 11, -5, CHEST);

  // Separador
  for (let y = 11; y <= 12; y++) b(59, y, 0, FENCE);

  // Cámara de Noé y su esposa (la principal)
  b(61, 11, -5, WOOL); b(62, 11, -5, WOOL);
  b(61, 12, -5, CARPET_R); b(62, 12, -5, CARPET_R);
  b(61, 11, -4, WOOL); b(62, 11, -4, WOOL);
  b(61, 12, -4, CARPET_R); b(62, 12, -4, CARPET_R);
  b(60, 11, -5, CHEST); b(60, 11, -4, CHEST);
  // Escritorio de Noé
  b(61, 11, 3, FENCE);
  b(61, 12, 3, CARPET_B);
  b(62, 11, 4, CRAFTING);
  b(62, 11, 5, CHEST);
  b(58, 13, 0, LANTERN);

  // ── Sala 6: AVES / ENFERMERÍA (x=65-72) ──────────
  for (let x = 66; x <= 70; x += 2) {
    const w = hw(x);
    if (w < 4) continue;
    b(x, 12, -2, OAK_F);
    b(x, 12, 2, OAK_F);
    b(x, 11, -(w - 1), HAY);
    b(x, 11, (w - 1), HAY);
  }
  b(68, 11, 0, CAULDRON);
  b(68, 13, 0, LANTERN);

  // ════════════════════════════════════════════════════════
  // ESCALERAS ENTRE PISOS
  //   2 accesos: x=22 (zona de puerta) y x=55 (centro-popa)
  //   Escalas de mano adosadas a la pared
  // ════════════════════════════════════════════════════════
  for (const lx of [22, 55]) {
    // Hueco en cada piso para la escalera
    b(lx, D2, 1, AIR);
    b(lx, D3, 1, AIR);
    b(lx, TD, 1, AIR);
    // Escalas de mano
    for (let y = 3; y <= 5; y++) b(lx, y, 1, LADDER);
    for (let y = 7; y <= 9; y++) b(lx, y, 1, LADDER);
    for (let y = 11; y <= 13; y++) b(lx, y, 1, LADDER);
  }

  // ════════════════════════════════════════════════════════
  // CUBIERTA SUPERIOR (y=14)
  //   Espacio abierto para ventilación y observación
  // ════════════════════════════════════════════════════════

  // Antorchas
  for (let x = 10; x < L - 10; x += 12) {
    b(x, TD + 1, 0, TORCH);
  }

  // Barriles de agua en cubierta
  b(35, TD + 1, -3, BARREL);
  b(36, TD + 1, -3, BARREL);
  b(35, TD + 1, 3, BARREL);
  b(36, TD + 1, 3, BARREL);

  // Mástil central
  b(37, TD + 1, 0, SLOG);
  b(37, TD + 2, 0, SLOG);
  b(37, TD + 3, 0, TORCH);

  return blocks;
}

export const ark = {
  id: "ark",
  name: "Arca de Noé",
  category: "biblicas",
  description: "300 codos de largo, 3 pisos, calafateada con brea — Génesis 6:14-16",
  blocks: generateArk()
};
