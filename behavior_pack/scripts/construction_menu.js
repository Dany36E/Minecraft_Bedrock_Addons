// construction_menu.js — Menú interactivo de construcciones bíblicas
// @minecraft/server 1.12.0 + @minecraft/server-ui 1.3.0
import { world, system, EquipmentSlot } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { STRUCTURES } from "./structures/all_structures.js";

// ══════════════════════════════════════════
// Lore bíblico de cada estructura
// ══════════════════════════════════════════
const STRUCTURE_LORE = {
  ark: {
    name: "Arca de Noé", ref: "Génesis 6:14-16",
    story: "Dios mandó a Noé construir un arca de madera de gofer, de 300 codos de largo, 50 de ancho y 30 de alto, para salvar a su familia y a los animales del diluvio universal.",
    verse: '"Hazte un arca de madera de gofer; harás aposentos en el arca, y la calafatearás con brea por dentro y por fuera."',
    dims: "60×15×20", blocks: "~18,000", time: "~3 min", materials: "Madera y brea",
  },
  tabernacle: {
    name: "Tabernáculo", ref: "Éxodo 26",
    story: "El Tabernáculo era la morada portátil de Dios entre su pueblo durante el éxodo. Contenía el Arca del Pacto, el candelabro de oro y la mesa de los panes de la proposición.",
    verse: '"Y harán un santuario para mí, y habitaré en medio de ellos."',
    dims: "20×12×30", blocks: "~7,200", time: "~1.5 min", materials: "Lino y madera de acacia",
  },
  altar: {
    name: "Altar del Holocausto", ref: "Éxodo 27:1-8",
    story: "El altar de bronce era donde se ofrecían los sacrificios a Dios. Medía 5 codos de largo y ancho, y 3 de alto, con cuernos en sus cuatro esquinas.",
    verse: '"Harás también un altar de madera de acacia... y le harás cuernos en sus cuatro esquinas."',
    dims: "8×4×8", blocks: "~256", time: "~10 seg", materials: "Piedra y fuego",
  },
  tower_babel: {
    name: "Torre de Babel", ref: "Génesis 11:1-9",
    story: "Los hombres quisieron construir una torre que llegara al cielo para hacerse un nombre. Dios confundió sus lenguas y los dispersó por toda la tierra.",
    verse: '"Edifiquemos una ciudad y una torre, cuya cúspide llegue al cielo; y hagámonos un nombre."',
    dims: "20×40×20", blocks: "~16,000", time: "~3 min", materials: "Ladrillo de barro",
  },
  church: {
    name: "Iglesia con Campanario", ref: "Tradición cristiana",
    story: "La iglesia es el lugar de reunión de los creyentes. Este diseño medieval incluye campanario, vitrales, nave central, y altar con cruz.",
    verse: '"Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos." — Mateo 18:20',
    dims: "18×24×12", blocks: "~5,200", time: "~1 min", materials: "Piedra y madera",
  },
  medieval_house: {
    name: "Casa Medieval", ref: "Proverbios 24:3-4",
    story: "Inspirada en las viviendas bíblicas cercanas a Jerusalén, con techo plano para descansar, patio interior y ventanas angostas.",
    verse: '"Con sabiduría se edificará la casa, y con prudencia se afirmará."',
    dims: "12×8×10", blocks: "~960", time: "~15 seg", materials: "Madera roble y piedra",
  },
  well: {
    name: "Pozo Bíblico", ref: "Juan 4:6-14",
    story: "Los pozos eran centro de la vida comunitaria. Junto al pozo de Jacob, Jesús ofreció a la samaritana agua viva que salta para vida eterna.",
    verse: '"El que bebiere del agua que yo le daré, no tendrá sed jamás."',
    dims: "6×6×6", blocks: "~216", time: "~5 seg", materials: "Piedra musgo y madera",
  },
  cross: {
    name: "Cruz del Gólgota", ref: "Juan 19:17-18",
    story: "En el monte Calvario, Cristo fue crucificado como sacrificio por los pecados del mundo. La cruz es el símbolo central de la fe cristiana.",
    verse: '"Y llevándose su cruz, salió al lugar llamado de la Calavera... donde le crucificaron."',
    dims: "4×10×2", blocks: "~40", time: "~3 seg", materials: "Madera oscura",
  },
  pyramid: {
    name: "Pirámide de Arena", ref: "Éxodo 1:11",
    story: "Los israelitas fueron forzados a construir las ciudades de almacenamiento del faraón. Estas pirámides escalonadas representan su cautiverio en Egipto.",
    verse: '"Y pusieron sobre ellos comisarios de tributos que los molestasen con sus cargas."',
    dims: "30×20×30", blocks: "~18,000", time: "~3 min", materials: "Arenisca",
  },
  samson_prison: {
    name: "Prisión de Gaza", ref: "Jueces 16:21",
    story: "Después de que Dalila lo traicionara, los filisteos le sacaron los ojos a Sansón y lo llevaron a Gaza. Allí lo ataron con cadenas de bronce y lo pusieron a moler en la cárcel.",
    verse: '"Y le sacaron los ojos, y le llevaron a Gaza, y le ataron con cadenas de bronce, y estuvo moliendo en la cárcel."',
    dims: "18×6×14", blocks: "~1,500", time: "~25 seg", materials: "Piedra y hierro",
  },
  dagon_temple: {
    name: "Templo de Dagón", ref: "Jueces 16:25-30",
    story: "Los filisteos celebraban en el templo de Dagón cuando trajeron a Sansón para burlarse de él. Sansón pidió fuerzas a Dios una última vez, asió las dos columnas centrales y derrumbó el templo sobre 3,000 filisteos.",
    verse: '"Entonces Sansón asió las dos columnas del medio, sobre las cuales descansaba la casa... y dijo: ¡Muera yo con los filisteos!"',
    dims: "40×20×25", blocks: "~20,000", time: "~4 min", materials: "Piedra pulida y ladrillos",
  },
};

// ══════════════════════════════════════════
// Filtros por historia bíblica
// ══════════════════════════════════════════
const STORY_FILTERS = {
  all:       { label: "§l§f✦ Todas las estructuras",   sub: "§e11 construcciones",                 ids: Object.keys(STRUCTURE_LORE) },
  samson:    { label: "§l§c⚔ Historia de Sansón",       sub: "§ePrisión de Gaza, Templo de Dagón",  ids: ["samson_prison", "dagon_temple"] },
  noah:      { label: "§l§9🌊 Historia de Noé",         sub: "§eEl Arca del diluvio",                ids: ["ark"] },
  moses:     { label: "§l§6☁ Historia de Moisés",       sub: "§eTabernáculo, Altar, Pirámide",       ids: ["tabernacle", "altar", "pyramid"] },
  genesis:   { label: "§l§d🏗 Génesis y orígenes",      sub: "§eTorre de Babel, Cruz",                ids: ["tower_babel", "cross"] },
  buildings: { label: "§l§b🏠 Edificios",               sub: "§eIglesia, Casa, Pozo",                 ids: ["church", "medieval_house", "well"] },
};

// ══════════════════════════════════════════
// Mensajes de progreso temáticos por estructura
// ══════════════════════════════════════════
const PROGRESS_MESSAGES = {
  ark:            ["§9Se reúne la madera de gofer...", "§9Las cuadernas toman forma...", "§9Se calafatea con brea...", "§9¡El arca está lista para el diluvio!"],
  tabernacle:     ["§6Se teje el lino fino...", "§6Los postes de acacia se levantan...", "§6El velo del Lugar Santísimo se cuelga...", "§6¡La gloria de Dios desciende!"],
  altar:          ["§4Se apilan las piedras...", "§4Se labran los cuernos del altar...", "§4Se prepara la leña...", "§4¡El fuego consume el holocausto!"],
  tower_babel:    ["§5Se moldean los ladrillos de barro...", "§5La torre asciende al cielo...", "§5Las lenguas comienzan a confundirse...", "§5¡La torre de la soberbia se alza!"],
  church:         ["§f Se cimentan los fundamentos...", "§fLas paredes de piedra se elevan...", "§fEl campanario corona la iglesia...", "§f¡Las campanas repican por primera vez!"],
  medieval_house: ["§eSe cavan los cimientos...", "§eLas paredes de roble se ensamblan...", "§eEl techo se sella con piedra...", "§e¡Un hogar para el peregrino!"],
  well:           ["§bSe excava el suelo...", "§bLas piedras circulares se apilan...", "§bEl balde se ata a la soga...", "§b¡El agua viva brota del pozo!"],
  cross:          ["§8Se talla el madero vertical...", "§8Se fija el travesaño...", "§8Se clava sobre el Gólgota...", "§8¡Consumado es!"],
  pyramid:        ["§eLos esclavos arrastran los bloques...", "§eCapa tras capa asciende la pirámide...", "§eLos capataces gritan órdenes...", "§e¡La pirámide del faraón se completa!"],
  samson_prison:  ["§7Los filisteos preparan los grilletes...", "§7Se levantan los muros de la prisión...", "§7La rueda de moler se ancla al suelo...", "§7¡La cárcel de Sansón está lista!"],
  dagon_temple:   ["§5Se tallan las columnas del templo...", "§5Las gradas se erigen en ambos lados...", "§5El altar de Dagón se enciende...", "§5¡El templo se alza... pero no por mucho!"],
};

// ══════════════════════════════════════════
// Listener: uso de la vara de construcción
// ══════════════════════════════════════════
world.beforeEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;
  if (item?.typeId !== "miaddon:construction_wand") return;
  event.cancel = true;
  system.run(() => openMainMenu(player));
});

// ══════════════════════════════════════════
// Menú principal — Filtros por historia
// ══════════════════════════════════════════
function openMainMenu(player) {
  const form = new ActionFormData();
  form.title("§6✦ Construcciones Bíblicas ✦");
  form.body("§fElige una historia para explorar sus construcciones:");

  const filterKeys = Object.keys(STORY_FILTERS);
  for (const key of filterKeys) {
    const f = STORY_FILTERS[key];
    form.button(`${f.label}\n${f.sub}`);
  }
  form.button("§cCerrar");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === filterKeys.length) return;
    const filterId = filterKeys[response.selection];
    system.run(() => openFilteredMenu(player, filterId));
  });
}

// ══════════════════════════════════════════
// Menú filtrado — Estructuras de una historia
// ══════════════════════════════════════════
function openFilteredMenu(player, filterId) {
  const filter = STORY_FILTERS[filterId];
  if (!filter) return;

  const form = new ActionFormData();
  form.title(`§6${filter.label}`);

  const validIds = filter.ids.filter((id) => STRUCTURES[id]);
  for (const id of validIds) {
    const lore = STRUCTURE_LORE[id];
    form.button(`§l§e${lore.name}\n§r§7${lore.dims} | ${lore.materials}`);
  }
  form.button("§c↩ Volver");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === validIds.length) {
      system.run(() => openMainMenu(player));
      return;
    }
    const structureId = validIds[response.selection];
    system.run(() => showLoreScreen(player, structureId, filterId));
  });
}

// ══════════════════════════════════════════
// Pantalla de lore bíblico antes de construir
// ══════════════════════════════════════════
function showLoreScreen(player, structureId, filterId) {
  const lore = STRUCTURE_LORE[structureId];
  const structure = STRUCTURES[structureId];
  if (!lore || !structure) return;

  const hasSamson = playerHasSamsonHelmet(player);
  const speedNote = hasSamson ? "\n\n§a⚡ Casco de Sansón detectado: velocidad ×2" : "";

  const body =
    `§e${lore.ref}\n\n` +
    `§f${lore.story}\n\n` +
    `§o§b${lore.verse}\n\n` +
    `§r§e━━━━━━━━━━━━━━━━━━━━\n` +
    `§fDimensiones: §e${lore.dims}\n` +
    `§fBloques: §e${lore.blocks}\n` +
    `§fTiempo est.: §e${lore.time}\n` +
    `§fMateriales: §e${lore.materials}` +
    speedNote;

  // Pantalla 1: Lore bíblico con botones de acción
  const form = new ActionFormData();
  form.title(`§6${lore.name}`);
  form.body(body);
  form.button("§l§a⚒ Construir aquí");
  form.button("§l§e⚒ Construir adelante (5 bloques)");
  form.button("§c↩ Volver");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === 2) {
      system.run(() => openFilteredMenu(player, filterId));
      return;
    }

    const offset = response.selection === 0 ? 0 : 5;

    // Pantalla 2: Solo rotación
    system.run(() => chooseRotation(player, structureId, filterId, offset));
  });
}

function chooseRotation(player, structureId, filterId, offset) {
  const form = new ActionFormData();
  form.title("§6Rotación");
  form.body("§fElige la orientación de la estructura:");
  form.button("§fNorte (0°)");
  form.button("§fEste (90°)");
  form.button("§fSur (180°)");
  form.button("§fOeste (270°)");
  form.button("§c↩ Volver");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === 4) {
      system.run(() => showLoreScreen(player, structureId, filterId));
      return;
    }

    const rotations = [0, 90, 180, 270];
    const rotation = rotations[response.selection];

    const pos = player.location;
    const basePos = { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) };

    if (offset > 0) {
      const dir = player.getViewDirection();
      const flatLen = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
      if (flatLen > 0.001) {
        basePos.x += Math.round((dir.x / flatLen) * offset);
        basePos.z += Math.round((dir.z / flatLen) * offset);
      }
    }

    system.run(() => buildStructure(player, structureId, basePos, rotation));
  });
}

// ══════════════════════════════════════════
// Detectar casco de Sansón
// ══════════════════════════════════════════
function playerHasSamsonHelmet(player) {
  try {
    const equip = player.getComponent("equippable");
    if (!equip) return false;
    const head = equip.getEquipment(EquipmentSlot.Head);
    return head?.typeId === "miaddon:samson_hair";
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════
// Rotación de vector 2D
// ══════════════════════════════════════════
function rotateVector(rx, rz, degrees) {
  switch (degrees) {
    case 90: return [rz, -rx];
    case 180: return [-rx, -rz];
    case 270: return [-rz, rx];
    default: return [rx, rz];
  }
}

// ══════════════════════════════════════════
// Constructor de estructuras (en lotes)
// ══════════════════════════════════════════
function buildStructure(player, structureId, basePos, rotation) {
  const structure = STRUCTURES[structureId];
  if (!structure) return;

  const blocks = structure.blocks;
  const total = blocks.length;
  const hasSamson = playerHasSamsonHelmet(player);
  const BATCH = hasSamson ? 150 : 80;
  let index = 0;
  let placed = 0;
  let failed = 0;

  const msgs = PROGRESS_MESSAGES[structureId] || ["§7Construyendo...", "§7Progresando...", "§7Casi listo...", "§7¡Completado!"];
  // Show first message
  player.sendMessage(msgs[0]);

  let lastMsgIdx = 0;

  const intervalId = system.runInterval(() => {
    const end = Math.min(index + BATCH, total);

    for (let i = index; i < end; i++) {
      const block = blocks[i];
      if (!block || block.length < 4) continue;

      const [rx, ry, rz, blockType] = block;
      const [rotX, rotZ] = rotateVector(rx, rz, rotation);
      const x = basePos.x + rotX;
      const y = basePos.y + ry;
      const z = basePos.z + rotZ;

      try {
        const blockObj = player.dimension.getBlock({ x, y, z });
        if (blockObj) {
          blockObj.setType(blockType);
          placed++;
        }
      } catch {
        failed++;
      }
    }

    index = end;

    // Mensajes temáticos en 25%, 50%, 75%
    const pct = (index / total) * 100;
    if (pct >= 25 && lastMsgIdx < 1) { lastMsgIdx = 1; player.sendMessage(msgs[1]); }
    if (pct >= 50 && lastMsgIdx < 2) { lastMsgIdx = 2; player.sendMessage(msgs[2]); }
    if (pct >= 75 && lastMsgIdx < 3) { lastMsgIdx = 3; player.sendMessage(msgs[3]); }

    if (index >= total) {
      system.clearRun(intervalId);
      const speedTxt = hasSamson ? " §a(×2 velocidad — fuerza de Sansón)" : "";
      player.sendMessage(`§a✦ ${structure.name} construida exitosamente!${speedTxt}`);
      if (failed > 0) {
        player.sendMessage(`§7  (${placed} bloques colocados, ${failed} fallaron)`);
      }
    }
  }, 1);
}
