// dagon_temple.js — Templo de Dagón en Gaza (Jueces 16:23-30)
// ══════════════════════════════════════════════════════════════
// REDISEÑO COMPLETO — Investigación bíblica y arqueológica
//
// TEXTO BÍBLICO (Jueces 16:25-30):
//   "Entonces los filisteos se juntaron para ofrecer un gran
//    sacrificio a Dagón su dios, y para alegrarse... Y llamaron
//    a Sansón de la cárcel... y le pusieron entre las columnas."
//
//   v.26: "Acércame, y hazme palpar las columnas sobre las cuales
//          descansa la casa, para que me apoye sobre ellas."
//
//   v.27: "Y la casa estaba llena de hombres y mujeres... y en el
//          piso alto había como tres mil hombres y mujeres."
//
//   v.29: "Asió Sansón las dos columnas de en medio... su mano
//          derecha sobre una, y su izquierda sobre la otra."
//
//   v.30: "Y dijo: ¡Muera yo con los filisteos!
//          Y SE INCLINÓ CON TODA SU FUERZA, y cayó la casa."
//
// 1 SAMUEL 5:2-4 (otro templo de Dagón, en Asdod):
//   "Tomaron los filisteos el arca de Dios y la metieron en la
//    casa de Dagón... Y la cabeza de Dagón y las dos palmas
//    de sus manos estaban cortadas sobre el umbral."
//
// ARQUEOLOGÍA (Tell Qasile, Tel Aviv — templo filisteo excavado):
//   - Muros de ladrillos de barro con enlucido blanco
//   - Bancos bajos a lo largo de las paredes
//   - Bamah (plataforma elevada) con vasijas de ofrenda
//   - Alcovas de almacenamiento laterales
//   - DOS COLUMNAS centrales soportando el techo
//     (confirmado arqueológicamente — coincide con la Biblia)
//
// DAGÓN — NO era un "dios pez" (interpretación medieval errónea
//   basada en dag=pez; David Kimhi, siglo XIII).
//   Era el dios sirio de la prosperidad y la fertilidad,
//   "padre de los dioses" (similar a Enlil mesopotámico).
//   Su nombre viene de la raíz dgn = grano.
//   Sin embargo, la tradición del ídolo mitad hombre/mitad pez
//   está tan arraigada que es icónica — la usamos artísticamente.
//
// DISEÑO: 46×22×30 (largo×alto×ancho)
//   [x=0-5]   Escalinata y Pórtico de entrada
//   [x=6-15]  Vestíbulo / Antecámara con bancos
//   [x=16-34] Gran Sala (naos) con las DOS COLUMNAS CENTRALES
//   [x=35-45] Sanctasanctórum: Bamah + Ídolo de Dagón
//   Gradas laterales para los "3,000 hombres y mujeres"
//   Terraza en el techo (Jue 16:27)
// ══════════════════════════════════════════════════════════════

function generateDagonTemple() {
  const blocks = [];

  // ══════════════════════════════════════════
  // PALETA DE MATERIALES
  // ══════════════════════════════════════════

  // Estructura principal — piedra pulida (enlucido filisteo)
  const WALL     = "minecraft:polished_deepslate";
  const WALL_B   = "minecraft:deepslate_bricks";
  const WALL_T   = "minecraft:deepslate_tiles";
  const STONE_B  = "minecraft:stone_bricks";
  const CRACKED  = "minecraft:cracked_stone_bricks";
  const PILLAR   = "minecraft:quartz_pillar";    // las DOS columnas centrales
  const PILLAR_B = "minecraft:quartz_block";      // base/capitel de columnas
  const COL_DEC  = "minecraft:chiseled_quartz_block"; // columnas decorativas
  const SMOOTH_S = "minecraft:smooth_stone";
  const SLAB_S   = "minecraft:smooth_stone_slab";

  // Piso — piedra oscura pulida (efecto suntuoso)
  const FLOOR    = "minecraft:polished_blackstone";
  const FLOOR_B  = "minecraft:polished_blackstone_bricks";

  // Techo
  const ROOF     = "minecraft:deepslate_tiles";
  const ROOF_S   = "minecraft:stone_brick_slab";

  // Elementos decorativos filisteos
  const COPPER   = "minecraft:copper_block";       // bronce/cobre (Edad del Bronce)
  const SAND_C   = "minecraft:chiseled_sandstone";  // relieves
  const CUT_SAND = "minecraft:cut_sandstone";

  // Altar y zona sagrada
  const NETHER   = "minecraft:nether_bricks";
  const RED_NB   = "minecraft:red_nether_bricks";
  const FIRE     = "minecraft:soul_fire";
  const SOUL_L   = "minecraft:soul_lantern";
  const SOUL_T   = "minecraft:soul_torch";
  const LANTERN  = "minecraft:lantern";

  // Ídolo de Dagón
  const PRISM    = "minecraft:prismarine";          // cola de pez
  const D_PRISM  = "minecraft:dark_prismarine";     // torso
  const PRISM_B  = "minecraft:prismarine_bricks";   // pecho
  const PUMPKIN  = "minecraft:carved_pumpkin";       // cabeza

  // Decoración interior
  const PURPLE_W = "minecraft:purple_wool";
  const RED_CARP = "minecraft:red_carpet";
  const PURP_C   = "minecraft:purple_carpet";
  const BANNER   = "minecraft:purple_wool";          // estandartes (columna de lana)
  const OAK_F    = "minecraft:oak_fence";
  const BARREL   = "minecraft:barrel";
  const ANVIL    = "minecraft:anvil";
  const CAULDRON = "minecraft:cauldron";
  const CHAIN    = "minecraft:chain";
  const IRON_BAR = "minecraft:iron_bars";
  const AIR      = "minecraft:air";

  const b = (x, y, z, t) => { blocks.push([x, y, z, t]); };

  // Dimensiones
  const L = 46;   // largo (eje X)
  const W = 30;   // ancho (eje Z)
  const H = 16;   // altura de las paredes internas
  const PY = 3;   // altura de la plataforma base

  // ══════════════════════════════════════════════════════════════
  // 1. PLATAFORMA BASE (y=0-2)
  //    Templos filisteos estaban sobre plataformas elevadas
  // ══════════════════════════════════════════════════════════════
  for (let x = 3; x < L; x++) {
    for (let z = 0; z < W; z++) {
      b(x, 0, z, WALL_B);
      b(x, 1, z, WALL_B);
      b(x, 2, z, STONE_B);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 2. ESCALINATA DE ENTRADA (x=0-5, z=10-19)
  //    Gran escalera al pórtico — 3 escalones amplios
  // ══════════════════════════════════════════════════════════════
  for (let step = 0; step < 3; step++) {
    for (let z = 10; z <= 19; z++) {
      b(step, step, z, SMOOTH_S);
    }
    // Barandas decorativas
    if (step === 0) {
      b(step, 1, 9, CUT_SAND);
      b(step, 1, 20, CUT_SAND);
    }
  }
  // Muros de escalinata (ornamentales)
  for (let y = 0; y <= PY; y++) {
    b(0, y, 9, SAND_C);   b(0, y, 20, SAND_C);
    b(1, y, 9, CUT_SAND); b(1, y, 20, CUT_SAND);
    b(2, y, 9, CUT_SAND); b(2, y, 20, CUT_SAND);
  }

  // ══════════════════════════════════════════════════════════════
  // 3. PISO INTERIOR (y=PY)
  // ══════════════════════════════════════════════════════════════
  for (let x = 3; x < L; x++) {
    for (let z = 1; z < W - 1; z++) {
      // Alfombra central púrpura (pasillo ceremonial)
      if (z >= 12 && z <= 17) {
        b(x, PY, z, FLOOR);
      } else {
        b(x, PY, z, FLOOR_B);
      }
    }
  }

  // Alfombra púrpura (camino procesional al altar)
  for (let x = 4; x <= 40; x++) {
    for (let z = 13; z <= 16; z++) {
      b(x, PY + 1, z, PURP_C);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 4. PAREDES EXTERIORES (y=PY+1 a PY+H)
  //    Gruesas, de piedra pulida — aspecto monumental
  // ══════════════════════════════════════════════════════════════
  for (let y = PY + 1; y <= PY + H; y++) {
    // Pared frontal (x=3) — con apertura central z=10..19 hasta y=PY+6
    for (let z = 0; z < W; z++) {
      const isEntrance = z >= 10 && z <= 19 && y <= PY + 6;
      if (!isEntrance) {
        b(3, y, z, y <= PY + 3 ? WALL_B : WALL);
      }
    }
    // Pared trasera (x=45) — sólida, más imponente
    for (let z = 0; z < W; z++) {
      b(L - 1, y, z, y <= PY + 3 ? WALL_B : WALL);
    }
    // Paredes laterales
    for (let x = 4; x < L - 1; x++) {
      b(x, y, 0, y <= PY + 3 ? WALL_B : WALL);
      b(x, y, W - 1, y <= PY + 3 ? WALL_B : WALL);
    }
  }

  // Dintel de la entrada principal
  for (let z = 10; z <= 19; z++) {
    b(3, PY + 7, z, WALL_T);
  }

  // ══════════════════════════════════════════════════════════════
  // 5. PÓRTICO DE ENTRADA (x=3-5)
  //    4 columnas decorativas flanqueando la entrada
  // ══════════════════════════════════════════════════════════════
  const porchCols = [[4, 10], [4, 19], [4, 12], [4, 17]];
  for (const [cx, cz] of porchCols) {
    b(cx, PY + 1, cz, COL_DEC);
    for (let y = PY + 2; y <= PY + 5; y++) b(cx, y, cz, PILLAR);
    b(cx, PY + 6, cz, COL_DEC);
  }

  // ══════════════════════════════════════════════════════════════
  // 6. VESTÍBULO (x=6-14)
  //    Antecámara con bancos a lo largo de las paredes
  //    (Tell Qasile: "low benches along the walls")
  // ══════════════════════════════════════════════════════════════

  // Bancos bajos a lo largo de las paredes laterales
  for (let x = 6; x <= 14; x++) {
    b(x, PY + 1, 2, STONE_B);
    b(x, PY + 1, W - 3, STONE_B);
  }

  // Columnas decorativas del vestíbulo
  const vestCols = [[8, 5], [8, W - 6], [12, 5], [12, W - 6]];
  for (const [cx, cz] of vestCols) {
    b(cx, PY + 1, cz, COL_DEC);
    for (let y = PY + 2; y <= PY + H - 2; y++) b(cx, y, cz, PILLAR);
    b(cx, PY + H - 1, cz, COL_DEC);
  }

  // Vasijas de ofrenda y almacenamiento (Tell Qasile: alcovas)
  b(7, PY + 1, 3, BARREL);  b(7, PY + 1, 4, BARREL);
  b(13, PY + 1, 3, CAULDRON);
  b(7, PY + 1, W - 4, BARREL);  b(7, PY + 1, W - 5, BARREL);
  b(13, PY + 1, W - 4, CAULDRON);

  // Linternas del vestíbulo
  b(10, PY + H - 1, 8, SOUL_L);
  b(10, PY + H - 1, W - 9, SOUL_L);

  // ══════════════════════════════════════════════════════════════
  // 7. MURO DIVISOR VESTÍBULO ↔ GRAN SALA (x=15)
  //    Con apertura ceremonial ancha
  // ══════════════════════════════════════════════════════════════
  for (let y = PY + 1; y <= PY + H; y++) {
    for (let z = 1; z < W - 1; z++) {
      // Apertura central: z=10..19, y=PY+1..PY+8
      const isDoor = z >= 10 && z <= 19 && y <= PY + 8;
      if (!isDoor) {
        b(15, y, z, WALL_T);
      }
    }
  }
  // Dintel del arco
  for (let z = 10; z <= 19; z++) b(15, PY + 9, z, WALL_B);

  // ══════════════════════════════════════════════════════════════
  // 8. LAS DOS COLUMNAS CENTRALES — JUECES 16:29
  //    "Asió Sansón las dos columnas de en medio, sobre las
  //     cuales descansaba la casa, y se apoyó en ellas"
  //
  //    Columna izquierda: x=25, z=10
  //    Columna derecha:   x=25, z=19
  //    Separación: 9 bloques (lo justo para agarrar ambas)
  //
  //    Material: cuarzo — blancas, imponentes, CENTRALES
  //    Estas son las columnas que Sansón DERRUMBA
  // ══════════════════════════════════════════════════════════════

  // ── Columna izquierda ──
  // Base ornamental 3×3
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      b(25 + dx, PY + 1, 10 + dz, PILLAR_B);
    }
  }
  // Fuste
  for (let y = PY + 2; y <= PY + H - 2; y++) {
    b(25, y, 10, PILLAR);
  }
  // Capitel ornamental 3×3
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      b(25 + dx, PY + H - 1, 10 + dz, PILLAR_B);
    }
  }

  // ── Columna derecha ──
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      b(25 + dx, PY + 1, 19 + dz, PILLAR_B);
    }
  }
  for (let y = PY + 2; y <= PY + H - 2; y++) {
    b(25, y, 19, PILLAR);
  }
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      b(25 + dx, PY + H - 1, 19 + dz, PILLAR_B);
    }
  }

  // Placa entre las columnas (donde Sansón se paró)
  for (let z = 11; z <= 18; z++) {
    b(25, PY + 1, z, COPPER);
  }

  // ══════════════════════════════════════════════════════════════
  // 9. GRADAS LATERALES — JUECES 16:27
  //    "Y en el piso alto había como tres mil
  //     hombres y mujeres, que estaban mirando"
  //
  //    Gradas escalonadas a cada lado de la Gran Sala
  //    4 filas de asientos ascendentes
  // ══════════════════════════════════════════════════════════════

  // Gradas lado sur (z=2..7)
  for (let row = 0; row < 5; row++) {
    const z = 2 + row;
    const y = PY + 1 + row;
    for (let x = 16; x <= 34; x++) {
      b(x, y, z, STONE_B);
      // Respaldo de la última fila
      if (row === 4) b(x, y + 1, z, STONE_B);
    }
  }

  // Gradas lado norte (z=27..22, espejado)
  for (let row = 0; row < 5; row++) {
    const z = W - 3 - row;
    const y = PY + 1 + row;
    for (let x = 16; x <= 34; x++) {
      b(x, y, z, STONE_B);
      if (row === 4) b(x, y + 1, z, STONE_B);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 10. COLUMNAS PERIMETRALES DECORATIVAS
  //     Filas de columnas a lo largo de la Gran Sala
  // ══════════════════════════════════════════════════════════════
  const decColPos = [
    [18, 8], [22, 8], [28, 8], [32, 8],
    [18, W - 9], [22, W - 9], [28, W - 9], [32, W - 9],
  ];
  for (const [cx, cz] of decColPos) {
    b(cx, PY + 1, cz, SAND_C);
    for (let y = PY + 2; y <= PY + H - 2; y++) b(cx, y, cz, PILLAR);
    b(cx, PY + H - 1, cz, SAND_C);
    // Antorcha en la columna
    b(cx, PY + 6, cz + (cz < W / 2 ? 1 : -1), SOUL_T);
  }

  // ══════════════════════════════════════════════════════════════
  // 11. MURO DIVISOR GRAN SALA ↔ SANCTASANCTÓRUM (x=35)
  //     Acceso más restringido al área sagrada
  // ══════════════════════════════════════════════════════════════
  for (let y = PY + 1; y <= PY + H; y++) {
    for (let z = 1; z < W - 1; z++) {
      // Apertura central: z=12..17, y=PY+1..PY+6
      const isDoor = z >= 12 && z <= 17 && y <= PY + 6;
      if (!isDoor) {
        b(35, y, z, WALL_T);
      }
    }
  }
  // Dintel
  for (let z = 12; z <= 17; z++) b(35, PY + 7, z, COPPER);

  // ══════════════════════════════════════════════════════════════
  // 12. SANCTASANCTÓRUM: BAMAH + ÍDOLO DE DAGÓN (x=36-44)
  //     "Bamah" = plataforma elevada para el ídolo
  //     (Tell Qasile: vasijas de ofrenda alrededor de la bamah)
  // ══════════════════════════════════════════════════════════════

  // ── Bamah (plataforma elevada) ──
  for (let x = 39; x <= 44; x++) {
    for (let z = 10; z <= 19; z++) {
      b(x, PY + 1, z, NETHER);
      b(x, PY + 2, z, RED_NB);
    }
  }
  // Escalón de acceso a la bamah
  for (let z = 12; z <= 17; z++) {
    b(38, PY + 1, z, NETHER);
  }

  // ── ÍDOLO DE DAGÓN ──
  // "Mitad hombre, mitad pez" (tradición de David Kimhi)
  // Ubicado en el centro de la bamah: x=42, z=14-15
  const IX = 42, IZ = 15;

  b(IX, PY + 3, IZ, PRISM);        // cola de pez (base)
  b(IX, PY + 4, IZ, PRISM);        // cola de pez 2
  b(IX, PY + 5, IZ, D_PRISM);      // cintura (transición)
  b(IX, PY + 6, IZ, PRISM_B);      // torso
  b(IX, PY + 7, IZ, PRISM_B);      // pecho
  b(IX, PY + 8, IZ, PUMPKIN);      // cabeza
  // Brazos extendidos
  b(IX, PY + 7, IZ - 1, PRISM);    // brazo izquierdo
  b(IX, PY + 7, IZ + 1, PRISM);    // brazo derecho
  // Aleta caudal
  b(IX, PY + 3, IZ - 1, PRISM);
  b(IX, PY + 3, IZ + 1, PRISM);

  // ── Fuego sacrificial ──
  // "Ofrecer un gran sacrificio a Dagón" — Jue 16:23
  b(40, PY + 3, 12, FIRE); b(40, PY + 3, 13, FIRE);
  b(40, PY + 3, 16, FIRE); b(40, PY + 3, 17, FIRE);

  // Recipientes de ofrenda alrededor
  b(37, PY + 1, 10, CAULDRON); b(37, PY + 1, 19, CAULDRON);
  b(37, PY + 1, 12, BARREL);  b(37, PY + 1, 17, BARREL);
  b(36, PY + 1, 8, BARREL);   b(36, PY + 2, 8, BARREL);
  b(36, PY + 1, W - 9, BARREL); b(36, PY + 2, W - 9, BARREL);

  // Antorchas del sanctasanctórum
  b(38, PY + 8, 10, SOUL_T); b(38, PY + 8, 19, SOUL_T);
  b(44, PY + 8, 10, SOUL_T); b(44, PY + 8, 19, SOUL_T);

  // Estandartes/cortinas laterales
  for (let y = PY + 1; y <= PY + 4; y++) {
    b(36, y, 3, BANNER); b(36, y, W - 4, BANNER);
    b(36, y, 5, BANNER); b(36, y, W - 6, BANNER);
  }

  // ══════════════════════════════════════════════════════════════
  // 13. TECHO PRINCIPAL (y=PY+H+1)
  //     "La casa estaba llena... y en el piso alto 3,000"
  // ══════════════════════════════════════════════════════════════
  for (let x = 4; x < L - 1; x++) {
    for (let z = 1; z < W - 1; z++) {
      b(x, PY + H + 1, z, ROOF);
    }
  }

  // Vigas de techo transversales (visibles desde abajo)
  for (let x = 8; x < L - 4; x += 5) {
    for (let z = 1; z < W - 1; z++) {
      b(x, PY + H, z, WALL_B);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 14. TERRAZA DEL TECHO — JUECES 16:27
  //     "Y en el techo/piso alto había como tres mil
  //      hombres y mujeres, que estaban mirando
  //      el entretenimiento de Sansón"
  // ══════════════════════════════════════════════════════════════

  // Parapeto de seguridad alrededor del techo
  for (let x = 4; x < L - 1; x++) {
    b(x, PY + H + 2, 0, WALL_T);
    b(x, PY + H + 2, W - 1, WALL_T);
  }
  for (let z = 0; z < W; z++) {
    b(3, PY + H + 2, z, WALL_T);
    b(L - 1, PY + H + 2, z, WALL_T);
  }

  // Almenas decorativas cada 3 bloques
  for (let x = 5; x < L - 1; x += 3) {
    b(x, PY + H + 3, 0, WALL_T);
    b(x, PY + H + 3, W - 1, WALL_T);
  }
  for (let z = 2; z < W - 2; z += 3) {
    b(3, PY + H + 3, z, WALL_T);
    b(L - 1, PY + H + 3, z, WALL_T);
  }

  // Hueco en el techo sobre las columnas centrales
  // (los espectadores del techo miraban abajo, Jue 16:27)
  for (let x = 22; x <= 28; x++) {
    for (let z = 9; z <= 20; z++) {
      b(x, PY + H + 1, z, AIR);
    }
  }
  // Barandilla alrededor del hueco
  for (let x = 22; x <= 28; x++) {
    b(x, PY + H + 2, 9, OAK_F);
    b(x, PY + H + 2, 20, OAK_F);
  }
  for (let z = 9; z <= 20; z++) {
    b(22, PY + H + 2, z, OAK_F);
    b(28, PY + H + 2, z, OAK_F);
  }

  // Escalera a la terraza (interior, lado trasero)
  for (let step = 0; step <= H; step++) {
    b(43, PY + 1 + step, 3 + Math.floor(step / 2), STONE_B);
    // Antorchas en la escalera cada 4 escalones
    if (step % 4 === 0 && step > 0) b(44, PY + 1 + step, 3 + Math.floor(step / 2), SOUL_T);
  }

  // ══════════════════════════════════════════════════════════════
  // 15. ILUMINACIÓN GENERAL
  //     Soul torches = atmósfera ominosa, pagana
  // ══════════════════════════════════════════════════════════════

  // Antorchas en paredes
  for (let x = 8; x <= 42; x += 6) {
    b(x, PY + 8, 1, SOUL_T);
    b(x, PY + 8, W - 2, SOUL_T);
  }

  // Linternas colgantes en la Gran Sala
  const lanternPos = [[20, 14], [20, 15], [30, 14], [30, 15]];
  for (const [lx, lz] of lanternPos) {
    b(lx, PY + H - 1, lz, CHAIN);
    b(lx, PY + H - 2, lz, SOUL_L);
  }

  // Braseros en el suelo de la Gran Sala
  b(18, PY + 1, 9, CAULDRON); b(32, PY + 1, 9, CAULDRON);
  b(18, PY + 1, W - 10, CAULDRON); b(32, PY + 1, W - 10, CAULDRON);

  // ══════════════════════════════════════════════════════════════
  // 16. DETALLES FINALES
  //     Cadenas, rejas, estandartes de cobre filisteos
  // ══════════════════════════════════════════════════════════════

  // Cadenas colgantes del techo (decorativas)
  const chainHang = [[17, 14], [17, 15], [33, 14], [33, 15]];
  for (const [cx, cz] of chainHang) {
    for (let dy = 0; dy < 3; dy++) b(cx, PY + H - dy, cz, CHAIN);
  }

  // Rejas de ventanas altas en las paredes
  for (let x = 10; x <= 40; x += 10) {
    b(x, PY + H - 2, 0, AIR); b(x, PY + H - 3, 0, AIR);
    b(x, PY + H - 2, 0, IRON_BAR); b(x, PY + H - 3, 0, IRON_BAR);
    b(x, PY + H - 2, W - 1, AIR); b(x, PY + H - 3, W - 1, AIR);
    b(x, PY + H - 2, W - 1, IRON_BAR); b(x, PY + H - 3, W - 1, IRON_BAR);
  }

  // Bloques de cobre decorativos en la fachada (frisos filisteos)
  for (let z = 3; z <= W - 4; z += 4) {
    b(3, PY + H, z, COPPER);
  }

  // Umbral del templo — 1 Samuel 5:4-5
  // "Solo Dagón quedó" — el umbral/miptán era sagrado
  for (let z = 10; z <= 19; z++) {
    b(3, PY, z, COPPER);
  }

  return blocks;
}

export const dagonTemple = {
  id: "dagon_temple",
  name: "Templo de Dagón",
  category: "samson",
  description: "Donde Sansón derribó las columnas sobre 3,000 filisteos — Jueces 16:25-30",
  blocks: generateDagonTemple(),
};
