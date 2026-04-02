// elah_battlefield.js — Campo de Batalla del Valle de Elá (1 Samuel 17)
// ══════════════════════════════════════════════════════════════
// DISEÑO COMPLETO — Investigación bíblica, geográfica y arqueológica
//
// TEXTO BÍBLICO (1 Samuel 17:1-3):
//   "Los filisteos juntaron sus ejércitos para la guerra...
//    y acamparon entre Soco y Azeca, en Efes-damim.
//    También Saúl y los hombres de Israel se juntaron,
//    y acamparon en el valle de Elá, y se pusieron en
//    orden de batalla contra los filisteos.
//    Y LOS FILISTEOS ESTABAN SOBRE UN MONTE A UN LADO,
//    E ISRAEL ESTABA SOBRE OTRO MONTE AL OTRO LADO,
//    Y EL VALLE ENTRE ELLOS."
//
// 1 Samuel 17:4-7 (Goliat):
//   "Salió entonces del campamento de los filisteos un
//    paladín, el cual se llamaba Goliat, de Gat,
//    y tenía de altura SEIS CODOS Y UN PALMO." (~2.9m ó ~2.06m LXX)
//   Armadura: Casco de bronce, cota de malla (5,000 siclos),
//   grebas de bronce, jabalina de bronce, lanza con punta
//   de hierro (600 siclos), y un escudero delante de él.
//
// 1 Samuel 17:16:
//   "Venía, pues, aquel filisteo por la mañana y por la
//    tarde, y así lo hizo DURANTE CUARENTA DÍAS."
//
// 1 Samuel 17:40 (David):
//   "Y tomó su cayado en su mano, y ESCOGIÓ CINCO PIEDRAS
//    LISAS DEL ARROYO, y las puso en el saco pastoril...
//    y tomó su honda en su mano, y se fue hacia el filisteo."
//
// 1 Samuel 17:46-47 (David a Goliat):
//   "Jehová te entregará hoy en mi mano... para que toda
//    la tierra sepa que hay Dios en Israel.
//    Y sabrá toda esta congregación que Jehová no salva con
//    espada y lanza; porque DE JEHOVÁ ES LA BATALLA."
//
// 1 Samuel 17:49-51:
//   "Y metiendo David su mano en la bolsa, tomó de allí
//    una piedra, y la tiró con la honda, e hirió al filisteo
//    EN LA FRENTE... y cayó sobre su rostro en tierra."
//
// GEOGRAFÍA (Valle de Elá / Emek HaElah):
//   - Valle largo y llano en la Sefela (tierras bajas de Judá)
//   - "Un valle abierto de ~800m de ancho, cubierto de grano;
//     una zanja estrecha por el centro llena de guijarros blancos
//     desgastados por el agua invernal. Aquí y allá crecen
//     grandes terebintos" (Conder & Kitchener, 1883)
//   - Entre las ciudades antiguas de Azeca (Tel Azekah) y
//     Soco (Tel Socho): 1 Samuel 17:1
//   - Coordenadas: 31°41'N, 34°57'E
//   - Terreno: Colinas de matorral y roca a ambos lados,
//     valle fértil con grano silvestre, arroyo estacional
//   - Flora: Terebintos (Pistacia), encinas, retama
//
// ARQUEOLOGÍA:
//   - Khirbet Qeiyafa (Shaaraim): fortaleza de la Edad del
//     Hierro IIA (1050-915 a.C.) en la ladera norte del valle,
//     posiblemente la posición israelita
//   - Tell es-Safi (Gat): ciudad natal de Goliat, a 23km al O.
//   - Armadura griega/micénica del s.X a.C. coincide con la
//     descripción bíblica de las armas de Goliat
//   - El "metaikhmion" (μεταίχμιον): espacio entre los dos
//     campamentos donde se realizaba el combate singular
//
// DISEÑO: 52×12×44 (largo×alto×ancho)
//   [x=0-14]  Colina de los filisteos (lado OESTE, más alta)
//   [x=15-36] Valle de Elá (terreno bajo, con arroyo)
//   [x=37-51] Colina de Israel (lado ESTE)
//   El arroyo cruza por x=25-27 de norte a sur
//
// ELEMENTOS NARRATIVOS:
//   • Campamento filisteo con tiendas, estandartes, y la
//     posición de Goliat con su armadura exhibida
//   • El arroyo con las 5 piedras lisas
//   • Terebintos (árboles de Elá, dan nombre al valle)
//   • Campamento israelita con tienda real de Saúl
//   • Zona de duelo en el centro (el "metaikhmion")
//   • Pan, queso y grano que Isaí envió con David (1 Sam 17:17)
// ══════════════════════════════════════════════════════════════

function generateElahBattlefield() {
  const blocks = [];

  // ══════════════════════════════════════════
  // PALETA DE MATERIALES
  // ══════════════════════════════════════════

  // Terreno natural
  const GRASS    = "minecraft:grass_block";
  const DIRT     = "minecraft:dirt";
  const C_DIRT   = "minecraft:coarse_dirt";
  const GRAVEL   = "minecraft:gravel";
  const STONE    = "minecraft:stone";
  const COBBLE   = "minecraft:cobblestone";
  const M_COBBLE = "minecraft:mossy_cobblestone";
  const SAND     = "minecraft:sand";
  const CLAY     = "minecraft:clay";

  // Agua del arroyo
  const WATER    = "minecraft:water";

  // Vegetación
  const OAK_LOG  = "minecraft:oak_log";
  const OAK_LEAF = "minecraft:oak_leaves";
  const D_LEAF   = "minecraft:dark_oak_leaves";
  const FERN     = "minecraft:fern";
  const TALL_G   = "minecraft:tall_grass";

  // Carpas y campamento
  const WHITE_W  = "minecraft:white_wool";
  const BROWN_W  = "minecraft:brown_wool";
  const RED_W    = "minecraft:red_wool";
  const BLUE_W   = "minecraft:blue_wool";
  const YELLOW_W = "minecraft:yellow_wool";
  const OAK_F    = "minecraft:oak_fence";
  const SLOG     = "minecraft:stripped_oak_log";
  const CAMPFIRE = "minecraft:campfire";
  const HAY      = "minecraft:hay_block";

  // Armadura/armas filisteas (Goliat)
  const IRON_B   = "minecraft:iron_block";
  const COPPER   = "minecraft:copper_block";
  const ANVIL    = "minecraft:anvil";
  const CHAIN    = "minecraft:chain";

  // Equipamiento israelita
  const BARREL   = "minecraft:barrel";
  const CHEST    = "minecraft:chest";
  const CAULDRON = "minecraft:cauldron";

  // Iluminación
  const TORCH    = "minecraft:torch";
  const LANTERN  = "minecraft:lantern";
  const S_TORCH  = "minecraft:soul_torch";

  // Decoración de piedra
  const STONE_B  = "minecraft:stone_bricks";
  const SMOOTH_S = "minecraft:smooth_stone";

  // Lana para banderas
  const PURPLE_W = "minecraft:purple_wool";

  const b = (x, y, z, t) => { blocks.push([x, y, z, t]); };

  // Dimensiones
  const L = 52;  // largo (X) — filisteos(O) a Israel(E)
  const W = 44;  // ancho (Z) — norte a sur
  const BASE = 0;

  // ══════════════════════════════════════════════════════════════
  // FUNCIÓN AUXILIAR: Calcular altura del terreno
  // Colinas a ambos lados, valle bajo en el centro
  // ══════════════════════════════════════════════════════════════
  function terrainH(x) {
    // Colina filistea (x=0-14): altura máx 7, baja hacia el valle
    if (x <= 7) return 7;
    if (x <= 14) return 7 - Math.floor((x - 7) * 0.8);

    // Valle (x=15-36): terreno bajo, ligera depresión en el arroyo
    if (x <= 24) return Math.max(1, 2 - Math.floor((x - 20) * 0.3));
    if (x <= 27) return 0; // lecho del arroyo
    if (x <= 36) return Math.max(1, 2 - Math.floor((32 - x) * 0.3));

    // Colina israelita (x=37-51): sube gradualmente
    if (x <= 44) return Math.min(6, Math.floor((x - 37) * 0.8));
    return 6;
  }

  // ══════════════════════════════════════════════════════════════
  // 1. TERRENO NATURAL
  //    "Los filisteos estaban sobre un monte a un lado,
  //     e Israel estaba sobre otro monte al otro lado,
  //     y el valle entre ellos." — 1 Samuel 17:3
  // ══════════════════════════════════════════════════════════════
  for (let x = 0; x < L; x++) {
    for (let z = 0; z < W; z++) {
      const h = terrainH(x);

      // Capas subterráneas
      for (let y = 0; y <= h; y++) {
        if (y === h) {
          // Superficie
          if (x >= 24 && x <= 27) {
            // Lecho del arroyo: arena, arcilla y grava
            b(x, y, z, (z + x) % 3 === 0 ? CLAY : (z % 2 === 0 ? SAND : GRAVEL));
          } else if (h <= 1) {
            // Valle bajo: tierra gruesa con algo de hierba
            b(x, y, z, (x + z) % 4 === 0 ? C_DIRT : GRASS);
          } else {
            // Colinas: hierba con parches de tierra
            b(x, y, z, (x + z) % 7 === 0 ? C_DIRT : GRASS);
          }
        } else if (y >= h - 1) {
          b(x, y, z, DIRT);
        } else if (y >= h - 3) {
          b(x, y, z, (x + z) % 3 === 0 ? COBBLE : DIRT);
        } else {
          b(x, y, z, STONE);
        }
      }
    }
  }

  // Afloramientos rocosos en las colinas
  const rockSpots = [
    [3, 10], [5, 30], [8, 5], [10, 38],
    [42, 8], [45, 28], [47, 15], [49, 37],
  ];
  for (const [rx, rz] of rockSpots) {
    const h = terrainH(rx);
    b(rx, h + 1, rz, COBBLE);
    b(rx + 1, h + 1, rz, M_COBBLE);
    b(rx, h + 1, rz + 1, STONE);
  }

  // ══════════════════════════════════════════════════════════════
  // 2. EL ARROYO DE ELÁ (x=25-26, toda la Z)
  //    "Escogió cinco piedras lisas DEL ARROYO" — 1 Sam 17:40
  //    "Una zanja estrecha por el centro llena de guijarros
  //     blancos desgastados por el agua" (Conder, 1883)
  // ══════════════════════════════════════════════════════════════
  for (let z = 0; z < W; z++) {
    // Canal de agua de 2 bloques de ancho
    b(25, 0, z, WATER);
    b(26, 0, z, WATER);
    // Riberas de grava
    if (z % 3 !== 0) {
      b(24, 0, z, GRAVEL);
      b(27, 0, z, GRAVEL);
    }
  }

  // LAS CINCO PIEDRAS LISAS — 1 Samuel 17:40
  // "Escogió cinco piedras lisas del arroyo, y las puso
  //  en el saco pastoril, en el zurrón que traía"
  // Representadas con stone_button... pero no hay states.
  // Usamos smooth_stone como piedras alisadas por el agua
  const stonePositions = [
    [24, 1, 20], [24, 1, 22], [25, 1, 21],
    [26, 1, 20], [26, 1, 22],
  ];
  for (const [sx, sy, sz] of stonePositions) {
    b(sx, sy, sz, SMOOTH_S);
  }

  // ══════════════════════════════════════════════════════════════
  // 3. TEREBINTOS DEL VALLE — "Emek HaElah"
  //    (Valle de la Elá = Valle del Terebinto)
  //    "Aquí y allá grandes terebintos crecen a lo largo
  //     de su curso" — Conder & Kitchener 1883
  // ══════════════════════════════════════════════════════════════
  function placeTree(tx, tz, height) {
    const h = terrainH(tx);
    // Tronco
    for (let y = h + 1; y <= h + height; y++) {
      b(tx, y, tz, OAK_LOG);
    }
    // Copa amplia (terebintos son muy frondosos)
    const top = h + height;
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        if (dx * dx + dz * dz <= 10) {
          b(tx + dx, top, tz + dz, OAK_LEAF);
          b(tx + dx, top + 1, tz + dz, OAK_LEAF);
        }
        if (dx * dx + dz * dz <= 5) {
          b(tx + dx, top + 2, tz + dz, D_LEAF);
        }
      }
    }
    // Ramas laterales
    b(tx - 2, top - 1, tz, OAK_LOG);
    b(tx + 2, top - 1, tz, OAK_LOG);
  }

  // 3 terebintos en el valle
  placeTree(20, 10, 5);
  placeTree(30, 32, 6);
  placeTree(22, 38, 5);

  // ══════════════════════════════════════════════════════════════
  // 4. CAMPAMENTO FILISTEO (x=0-12, z=8-36)
  //    "Los filisteos juntaron sus ejércitos... y acamparon
  //     entre Soco y Azeca" — 1 Sam 17:1
  // ══════════════════════════════════════════════════════════════

  // ── Función: generar tienda militar ──
  function placeTent(tx, tz, w, d, woolColor, poleH) {
    const h = terrainH(tx);
    // Postes de la tienda (4 esquinas)
    for (let y = h + 1; y <= h + poleH; y++) {
      b(tx, y, tz, OAK_F);
      b(tx + w - 1, y, tz, OAK_F);
      b(tx, y, tz + d - 1, OAK_F);
      b(tx + w - 1, y, tz + d - 1, OAK_F);
    }
    // Techo de tela
    for (let dx = 0; dx < w; dx++) {
      for (let dz = 0; dz < d; dz++) {
        b(tx + dx, h + poleH + 1, tz + dz, woolColor);
      }
    }
    // Alfombra interior
    for (let dx = 1; dx < w - 1; dx++) {
      for (let dz = 1; dz < d - 1; dz++) {
        b(tx + dx, h + 1, tz + dz, woolColor === RED_W ? RED_W : BROWN_W);
      }
    }
  }

  // Tienda principal filistea (del general / señores de los filisteos)
  placeTent(3, 18, 6, 8, RED_W, 3);

  // Tiendas de soldados filisteos
  placeTent(2, 10, 4, 4, BROWN_W, 2);
  placeTent(2, 30, 4, 4, BROWN_W, 2);
  placeTent(7, 10, 4, 4, BROWN_W, 2);
  placeTent(7, 30, 4, 4, BROWN_W, 2);

  // ── Posición de Goliat y su armadura ──
  // "Salió del campamento de los filisteos un paladín...
  //  de Gat, y tenía de altura seis codos y un palmo"
  const GH = terrainH(10);

  // Exhibición de armadura de Goliat — 1 Samuel 17:5-7
  // "Casco de bronce... cota de malla... 5000 siclos de bronce"
  b(10, GH + 1, 21, IRON_B);   // Armadura (cota de malla)
  b(10, GH + 2, 21, IRON_B);   // Armadura superior
  b(10, GH + 3, 21, COPPER);   // Casco de bronce
  b(10, GH + 1, 22, CHAIN);    // Cadena/grebas
  b(10, GH + 1, 20, ANVIL);    // Yunque (representando las armas pesadas)

  // La lanza de Goliat — "el asta de su lanza era como
  // un rodillo de telar, y tenía la punta de hierro
  // de seiscientos siclos" — 1 Sam 17:7
  for (let y = GH + 1; y <= GH + 4; y++) {
    b(11, y, 22, OAK_F);       // Asta de la lanza (vertical)
  }
  b(11, GH + 5, 22, IRON_B);   // Punta de hierro

  // Estandarte filisteo (rojo/púrpura)
  b(5, GH + 1, 17, OAK_F);
  b(5, GH + 2, 17, OAK_F);
  b(5, GH + 3, 17, OAK_F);
  b(5, GH + 4, 17, OAK_F);
  b(5, GH + 4, 18, RED_W);
  b(5, GH + 3, 18, RED_W);
  b(5, GH + 2, 18, PURPLE_W);

  // Fogata filistea
  b(5, GH + 1, 22, CAMPFIRE);

  // Provisiones y armas en campamento filisteo
  b(4, GH + 1, 14, BARREL); b(4, GH + 1, 15, BARREL);
  b(8, GH + 1, 34, BARREL); b(8, GH + 1, 33, CAULDRON);

  // Escudo de Goliat (el escudero iba delante — 1 Sam 17:7,41)
  b(12, GH + 1, 21, IRON_B);
  b(12, GH + 2, 21, COPPER);

  // ══════════════════════════════════════════════════════════════
  // 5. EL METAIKHMION — ZONA DE DUELO
  //    (El espacio entre los dos campamentos)
  //    Goliat era "איש הביניים" = "el hombre del entre-medio"
  //    Aquí David y Goliat se enfrentaron
  // ══════════════════════════════════════════════════════════════

  // Terreno despejado más marcado (camino de tierra pisada)
  for (let z = 16; z <= 28; z++) {
    for (let x = 18; x <= 33; x++) {
      const h = terrainH(x);
      b(x, h, z, C_DIRT);
    }
  }

  // Marca del punto de confrontación (centro del campo)
  // Donde Goliat cayó "sobre su rostro en tierra" — 1 Sam 17:49
  const cx = 26, cz = 22;
  b(cx, 1, cz, GRAVEL);
  b(cx - 1, 1, cz, GRAVEL);
  b(cx + 1, 1, cz, GRAVEL);
  b(cx, 1, cz - 1, GRAVEL);
  b(cx, 1, cz + 1, GRAVEL);

  // ══════════════════════════════════════════════════════════════
  // 6. CAMPAMENTO ISRAELITA (x=40-51, z=8-36)
  //    "Saúl y los hombres de Israel se juntaron,
  //     y acamparon en el valle de Elá" — 1 Sam 17:2
  // ══════════════════════════════════════════════════════════════
  const IH = terrainH(45);

  // ── Tienda Real de Saúl ──
  // La más grande y prominente (era el rey)
  // Donde David fue a hablar con Saúl (1 Sam 17:31-39)
  // y donde Saúl le ofreció su armadura (1 Sam 17:38)
  placeTent(44, 18, 6, 8, BLUE_W, 3);

  // Estandarte de Israel (azul y blanco — Judá)
  b(45, IH + 1, 17, OAK_F);
  b(45, IH + 2, 17, OAK_F);
  b(45, IH + 3, 17, OAK_F);
  b(45, IH + 4, 17, OAK_F);
  b(45, IH + 4, 18, BLUE_W);
  b(45, IH + 3, 18, WHITE_W);
  b(45, IH + 2, 18, BLUE_W);

  // Tiendas de soldados israelitas
  placeTent(42, 10, 4, 4, WHITE_W, 2);
  placeTent(42, 30, 4, 4, WHITE_W, 2);
  placeTent(48, 10, 4, 4, WHITE_W, 2);
  placeTent(48, 30, 4, 4, WHITE_W, 2);

  // ── Armadura de Saúl (ofrecida a David) ──
  // "Y Saúl vistió a David con sus ropas, y puso sobre
  //  su cabeza un casco de bronce" — 1 Sam 17:38
  // "Y David... se las quitó" — 1 Sam 17:39
  b(46, IH + 1, 26, IRON_B);   // Armadura de Saúl (rechazada)
  b(46, IH + 2, 26, COPPER);   // Casco de bronce
  b(46, IH + 1, 27, CHAIN);    // Espada de Saúl

  // ── Las provisiones que Isaí envió con David ──
  // "Toma para tus hermanos un efa de este grano tostado,
  //  y estos diez panes... y estos diez quesos" — 1 Sam 17:17-18
  b(43, IH + 1, 14, HAY);       // Grano tostado (efa)
  b(43, IH + 2, 14, HAY);       // Más grano
  b(44, IH + 1, 14, BARREL);    // Panes
  b(44, IH + 1, 15, BARREL);    // Quesos para el capitán

  // Fogata israelita
  b(46, IH + 1, 22, CAMPFIRE);

  // Provisiones generales del campamento
  b(49, IH + 1, 14, BARREL);
  b(49, IH + 1, 15, CAULDRON);
  b(49, IH + 1, 33, BARREL);
  b(50, IH + 1, 33, BARREL);

  // ══════════════════════════════════════════════════════════════
  // 7. CAMINOS ENTRE CAMPAMENTO Y ZONA DE DUELO
  //    (Senderos de tierra apisonada)
  // ══════════════════════════════════════════════════════════════

  // Camino filisteo (de su campamento al campo de batalla)
  for (let x = 13; x <= 18; x++) {
    const h = terrainH(x);
    for (let z = 20; z <= 24; z++) {
      b(x, h, z, C_DIRT);
    }
  }

  // Camino israelita (de su campamento al campo de batalla)
  for (let x = 33; x <= 39; x++) {
    const h = terrainH(x);
    for (let z = 20; z <= 24; z++) {
      b(x, h, z, C_DIRT);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 8. ILUMINACIÓN (Antorchas en los campamentos)
  // ══════════════════════════════════════════════════════════════

  // Antorchas filisteas
  const torchFH = terrainH(3);
  b(3, torchFH + 1, 9, TORCH);  b(3, torchFH + 1, 35, TORCH);
  b(8, terrainH(8) + 1, 9, TORCH); b(8, terrainH(8) + 1, 35, TORCH);
  b(6, terrainH(6) + 1, 16, S_TORCH);
  b(6, terrainH(6) + 1, 27, S_TORCH);

  // Linternas en tienda principal filistea
  b(5, terrainH(5) + 4, 21, LANTERN);

  // Antorchas israelitas
  b(43, IH + 1, 9, TORCH);   b(43, IH + 1, 35, TORCH);
  b(49, IH + 1, 9, TORCH);   b(49, IH + 1, 35, TORCH);
  b(47, IH + 1, 16, TORCH);  b(47, IH + 1, 27, TORCH);

  // Linterna en tienda de Saúl
  b(46, IH + 4, 21, LANTERN);

  // ══════════════════════════════════════════════════════════════
  // 9. DETALLES AMBIENTALES
  //    Vegetación dispersa, muros de piedra baja
  // ══════════════════════════════════════════════════════════════

  // Muros bajos de piedra seca (típicos de la Sefela)
  // Muro frontal filisteo
  for (let z = 8; z <= 36; z += 2) {
    const mh = terrainH(13);
    b(13, mh + 1, z, COBBLE);
  }

  // Muro frontal israelita
  for (let z = 8; z <= 36; z += 2) {
    const mh = terrainH(38);
    b(38, mh + 1, z, COBBLE);
  }

  // Vegetación dispersa en el valle
  const vegSpots = [
    [18, 6], [19, 12], [21, 30], [28, 8],
    [29, 14], [31, 36], [32, 6], [33, 40],
    [20, 26], [30, 18], [22, 3], [29, 41],
  ];
  for (const [vx, vz] of vegSpots) {
    const h = terrainH(vx);
    b(vx, h + 1, vz, FERN);
  }

  return blocks;
}

export const elahBattlefield = {
  id: "elah_battlefield",
  name: "Campo de Batalla del Valle de Elá",
  category: "david",
  description: "Donde David venció a Goliat con una piedra y una honda — 1 Samuel 17",
  blocks: generateElahBattlefield(),
};
