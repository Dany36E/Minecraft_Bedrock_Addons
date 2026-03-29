// construction_menu.js — Menú interactivo de construcciones bíblicas
// @minecraft/server 1.12.0 + @minecraft/server-ui 1.3.0
import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { STRUCTURES } from "./structures/all_structures.js";

// ══════════════════════════════════════════
// Categorías del menú
// ══════════════════════════════════════════
const CATEGORIES = {
  biblicas: {
    structures: ["ark", "tabernacle", "altar", "tower_babel"],
    items: [
      "§l§eArca de Noé\n§r§760x15x20 bloques | Madera y brea",
      "§l§eTabernáculo\n§r§720x12x30 bloques | Lino y madera de acacia",
      "§l§eAltar del Holocausto\n§r§78x4x8 bloques | Piedra y fuego",
      "§l§eTorre de Babel\n§r§720x40x20 bloques | Ladrillo de barro",
    ],
  },
  edificios: {
    structures: ["church", "medieval_house", "well"],
    items: [
      "§l§bIglesia con Campanario\n§r§718x24x12 bloques | Piedra y madera",
      "§l§bCasa Medieval\n§r§712x8x10 bloques | Madera roble y piedra",
      "§l§bPozo Bíblico\n§r§76x6x6 bloques | Piedra musgo y madera",
    ],
  },
  monumentos: {
    structures: ["cross", "pyramid"],
    items: [
      "§l§aCruz del Gólgota\n§r§74x10x2 bloques | Madera oscura",
      "§l§aPirámide de Arena\n§r§730x20x30 bloques | Arenisca",
    ],
  },
};

// ══════════════════════════════════════════
// Listener: uso de la vara de construcción
// ══════════════════════════════════════════
world.beforeEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;
  if (item?.typeId !== "miaddon:construction_wand") return;
  event.cancel = true;
  // Abrir menú en el siguiente tick (requerido para UI en Bedrock)
  system.run(() => openMainMenu(player));
});

// ══════════════════════════════════════════
// Menú principal
// ══════════════════════════════════════════
function openMainMenu(player) {
  const form = new ActionFormData();
  form.title("§6Construcciones Bíblicas");
  form.body("§fSelecciona una categoría:");
  form.button("§l§e⛪ Historias Bíblicas\n§r§7Arca, Altar, Torre, Tabernáculo");
  form.button("§l§b🏠 Edificios\n§r§7Iglesia, Casa Medieval, Pozo");
  form.button("§l§a✝ Monumentos\n§r§7Cruz del Gólgota, Pirámide");
  form.button("§cCancelar");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === 3) return;
    const cats = ["biblicas", "edificios", "monumentos"];
    openCategoryMenu(player, cats[response.selection]);
  });
}

// ══════════════════════════════════════════
// Menú de categoría
// ══════════════════════════════════════════
function openCategoryMenu(player, category) {
  const cat = CATEGORIES[category];
  if (!cat) return;

  const form = new ActionFormData();
  form.title("§6Selecciona estructura");
  for (const label of cat.items) {
    form.button(label);
  }
  form.button("§c↩ Volver");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === cat.items.length) {
      system.run(() => openMainMenu(player));
      return;
    }
    const structureId = cat.structures[response.selection];
    system.run(() => confirmBuild(player, structureId));
  });
}

// ══════════════════════════════════════════
// Confirmación de construcción
// ══════════════════════════════════════════
function confirmBuild(player, structureId) {
  const structure = STRUCTURES[structureId];
  if (!structure) {
    player.sendMessage("§cEstructura no encontrada.");
    return;
  }

  const form = new ModalFormData();
  form.title(`§6Construir: ${structure.name}`);
  form.toggle("Construir en mi posición actual", true);
  form.slider("Desplazamiento adelante (bloques)", 0, 20, 1, 5);
  form.dropdown("Rotación", ["Norte (0°)", "Este (90°)", "Sur (180°)", "Oeste (270°)"], 0);

  form.show(player).then((response) => {
    if (response.canceled) return;

    const [buildHere, offset, rotIdx] = response.formValues;
    const rotations = [0, 90, 180, 270];
    const rotation = rotations[rotIdx];

    // Calcular posición base
    const pos = player.location;
    const basePos = { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) };

    if (buildHere && offset > 0) {
      // Desplazar en la dirección que mira el jugador
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
  const BATCH = 80; // bloques por tick (seguro para Xbox)
  let index = 0;
  let placed = 0;
  let failed = 0;

  player.sendMessage(`§e⚙ Construyendo ${structure.name}... §7(${total} bloques, puede tardar unos segundos)`);

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
      } catch (e) {
        failed++;
      }
    }

    index = end;

    // Progreso cada 25%
    const pct = Math.floor((index / total) * 100);
    if (pct % 25 === 0 && index < total) {
      player.sendMessage(`§7  ${pct}% completado...`);
    }

    if (index >= total) {
      system.clearRun(intervalId);
      player.sendMessage(`§a✦ ${structure.name} construida exitosamente!`);
      if (failed > 0) {
        player.sendMessage(`§7  (${placed} bloques colocados, ${failed} fallaron)`);
      }
    }
  }, 1);
}
