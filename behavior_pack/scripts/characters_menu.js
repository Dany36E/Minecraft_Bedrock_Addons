// characters_menu.js — Sistema de transformación con entidades montables (riding system)
// @minecraft/server 1.12.0 + @minecraft/server-ui 1.3.0
import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

// ══════════════════════════════════════════
// Datos de personajes
// ══════════════════════════════════════════
const CHARACTERS = {
  samson: {
    name: "Sansón",
    ref: "Jueces 13-16",
    color: "§e",
    entityId: "miaddon:samson_entity",
    desc: "Nazareo desde el vientre de su madre, consagrado a Dios. Su fuerza sobrenatural provenía del Espíritu del Señor, y su señal externa era su cabello largo que nunca fue cortado.",
    verse: '"...y el Espíritu del Señor comenzó a manifestarse en él." — Jueces 13:25',
    abilities: "§aFuerza V §7| §aRapidez III §7| §aVelocidad II §7| §aResistencia II §7| §aRegeneración I §7| §aSalto I",
    transformMsg: [
      "§6✦ EL ESPÍRITU DEL SEÑOR VINO SOBRE SANSÓN ✦",
      '§e§o"...y el Espíritu del Señor comenzó a manifestarse en él" — Jueces 13:25',
    ],
    effects: [
      { id: "strength", amp: 4, dur: 999999 },
      { id: "haste", amp: 2, dur: 999999 },
      { id: "speed", amp: 1, dur: 999999 },
      { id: "resistance", amp: 1, dur: 999999 },
      { id: "jump_boost", amp: 0, dur: 999999 },
      { id: "regeneration", amp: 0, dur: 999999 },
    ],
  },
  dalila: {
    name: "Dalila",
    ref: "Jueces 16:4-22",
    color: "§d",
    entityId: "miaddon:dalila_entity",
    desc: 'Mujer del valle de Sorec. Los señores filisteos le ofrecieron 1,100 siclos de plata cada uno para descubrir el secreto de la fuerza de Sansón.',
    verse: '"Después de esto aconteció que se enamoró de una mujer en el valle de Sorec, la cual se llamaba Dalila." — Jueces 16:4',
    abilities: "§dVelocidad II §7| §dVisión nocturna §7| §dSuerte II",
    transformMsg: [
      "§d✦ Entras al valle de Sorec como Dalila.",
      '§7§o"Después aconteció que se enamoró de una mujer..." — Jueces 16:4',
    ],
    effects: [
      { id: "speed", amp: 1, dur: 999999 },
      { id: "night_vision", amp: 0, dur: 999999 },
      { id: "luck", amp: 1, dur: 999999 },
    ],
  },
  david: {
    name: "David",
    ref: "I Samuel 16-17",
    color: "§b",
    entityId: "miaddon:david_entity",
    desc: 'El menor de los hijos de Isaí, pastor de ovejas en Belén. Rubio, de hermosos ojos y buen parecer. Ungido por Samuel como futuro rey de Israel.',
    verse: '"Era rubio, de hermosos ojos, y de buen parecer. Entonces el Señor dijo: Levántate y úngelo, porque éste es." — I Samuel 16:12',
    abilities: "§bVelocidad III §7| §bSuerte II §7| §bResistencia I §7| §bSalto II",
    transformMsg: [
      "§b✦ El Espíritu del Señor está contigo, David.",
      '§7§o"Era rubio, de hermosos ojos, y de buen parecer" — I Samuel 16:12',
    ],
    effects: [
      { id: "speed", amp: 2, dur: 999999 },
      { id: "luck", amp: 1, dur: 999999 },
      { id: "resistance", amp: 0, dur: 999999 },
      { id: "jump_boost", amp: 1, dur: 999999 },
    ],
  },
  goliath: {
    name: "Goliát",
    ref: "I Samuel 17",
    color: "§c",
    entityId: "miaddon:goliath_entity",
    desc: 'Campeón de los filisteos de la ciudad de Gat. Medía seis codos y un palmo (2.9 metros). Vestía cota de malla de 5,000 siclos de bronce, grebas de bronce, y jabalina de bronce.',
    verse: '"¿Por qué habéis salido a presentar batalla? ¡Escoged de entre vosotros un hombre que venga contra mí!" — I Samuel 17:8',
    abilities: "§cFuerza V §7| §cResistencia IV §7| §cVida extra IV §7| §8Lentitud II",
    transformMsg: [
      "§c✦ ERES GOLIÁT, CAMPEÓN DE LOS FILISTEOS.",
      '§c§o"Un hombre de guerra desde su juventud" — I Samuel 17:33',
    ],
    effects: [
      { id: "strength", amp: 4, dur: 999999 },
      { id: "resistance", amp: 3, dur: 999999 },
      { id: "slowness", amp: 1, dur: 999999 },
      { id: "health_boost", amp: 3, dur: 999999 },
    ],
  },
};

// ══════════════════════════════════════════
// Estado activo de transformaciones
// ══════════════════════════════════════════
/** @type {Map<string, {entity: import("@minecraft/server").Entity, charId: string}>} */
const activeTransformations = new Map();

// ══════════════════════════════════════════
// Listener: uso del Libro de Personajes
// ══════════════════════════════════════════
world.beforeEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;
  if (item?.typeId !== "miaddon:characters_book") return;
  event.cancel = true;

  system.run(() => {
    if (activeTransformations.has(player.name)) {
      revertTransformation(player);
    } else {
      openCharactersMenu(player);
    }
  });
});

// ══════════════════════════════════════════
// Menú principal
// ══════════════════════════════════════════
function openCharactersMenu(player) {
  const form = new ActionFormData();
  form.title("§6§l✦ Personajes Bíblicos ✦");
  form.body("§fElige a quién quieres encarnar:\n§eCada personaje te transforma visualmente y otorga habilidades bíblicas.");
  form.button("§l§eSansón§r\n§eJueces 13-16 · Nazareo · Superfuerza");
  form.button("§l§dDalila§r\n§eJueces 16 · Filistea de Sorec");
  form.button("§l§bDavid§r\n§eI Samuel 16-17 · Pastor de Belén");
  form.button("§l§cGoliát§r\n§eI Samuel 17 · Gigante de Gat");
  form.button("§cCerrar");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === 4) return;
    const ids = ["samson", "dalila", "david", "goliath"];
    system.run(() => showCharacterConfirm(player, ids[response.selection]));
  });
}

// ══════════════════════════════════════════
// Pantalla de confirmación con lore bíblico
// ══════════════════════════════════════════
function showCharacterConfirm(player, characterId) {
  const ch = CHARACTERS[characterId];
  if (!ch) return;

  const form = new ModalFormData();
  form.title(`${ch.color}${ch.name}`);
  form.textField(
    `§e${ch.ref}\n\n` +
    `§f${ch.desc}\n\n` +
    `§o§b${ch.verse}\n\n` +
    `§r§e━━━━━━━━━━━━━━━━━━━━\n` +
    `§fHabilidades:\n${ch.abilities}`,
    "Escribe CONFIRMAR"
  );
  form.toggle("§a✦ Transformarme en este personaje", false);

  form.show(player).then((response) => {
    if (response.canceled) {
      system.run(() => openCharactersMenu(player));
      return;
    }
    const confirmed = response.formValues[1];
    if (!confirmed) {
      system.run(() => openCharactersMenu(player));
      return;
    }
    system.run(() => transformPlayer(player, characterId));
  });
}

// ══════════════════════════════════════════
// Transformar jugador — montar entidad
// ══════════════════════════════════════════
function transformPlayer(player, characterId) {
  const ch = CHARACTERS[characterId];
  if (!ch) return;

  // Revertir transformación previa si existe
  if (activeTransformations.has(player.name)) {
    revertTransformation(player, true);
  }

  try {
    const loc = player.location;
    const dim = player.dimension;

    // Spawn entity at player position
    const entity = dim.spawnEntity(ch.entityId, loc);

    // Tag entity with owner for cleanup
    entity.addTag(`owner:${player.name}`);

    // Attempt to mount player using ride command
    player.runCommand(`ride @s start_riding @e[type=${ch.entityId},c=1,r=3]`);

    // Apply invisibility to hide player model
    player.addEffect("invisibility", 999999, { amplifier: 0, showParticles: false });

    // Apply character effects
    for (const eff of ch.effects) {
      player.addEffect(eff.id, eff.dur, { amplifier: eff.amp, showParticles: false });
    }

    // Store active transformation
    activeTransformations.set(player.name, { entity, charId: characterId });

    // Send transform messages
    for (const msg of ch.transformMsg) {
      player.sendMessage(msg);
    }
    player.sendMessage("§7Usa el §eLibro de Personajes §7de nuevo para revertir la transformación.");

  } catch (e) {
    player.sendMessage(`§cError al transformarte: ${e.message || e}`);
  }
}

// ══════════════════════════════════════════
// Revertir transformación
// ══════════════════════════════════════════
function revertTransformation(player, silent = false) {
  const data = activeTransformations.get(player.name);
  if (!data) return;

  try {
    // Dismount player
    player.runCommand("ride @s stop_riding");
  } catch (_) { /* ignore if not riding */ }

  // Remove invisibility
  try { player.removeEffect("invisibility"); } catch (_) {}

  // Remove character effects
  const ch = CHARACTERS[data.charId];
  if (ch) {
    for (const eff of ch.effects) {
      try { player.removeEffect(eff.id); } catch (_) {}
    }
  }

  // Remove entity
  try {
    if (data.entity?.isValid()) {
      data.entity.remove();
    }
  } catch (_) {}

  activeTransformations.delete(player.name);

  if (!silent) {
    player.sendMessage("§a✦ Has vuelto a tu forma normal.");
  }
}

// ══════════════════════════════════════════
// Cleanup: jugadores desconectados / entidades muertas
// ══════════════════════════════════════════
system.runInterval(() => {
  for (const [playerName, data] of activeTransformations) {
    // Check if entity is dead/removed
    if (!data.entity?.isValid()) {
      // Try to find the player and clean up effects
      for (const p of world.getAllPlayers()) {
        if (p.name === playerName) {
          try { p.removeEffect("invisibility"); } catch (_) {}
          const ch = CHARACTERS[data.charId];
          if (ch) {
            for (const eff of ch.effects) {
              try { p.removeEffect(eff.id); } catch (_) {}
            }
          }
          break;
        }
      }
      activeTransformations.delete(playerName);
      continue;
    }

    // Check if player is still online
    let playerOnline = false;
    for (const p of world.getAllPlayers()) {
      if (p.name === playerName) {
        playerOnline = true;
        break;
      }
    }
    if (!playerOnline) {
      try { data.entity.remove(); } catch (_) {}
      activeTransformations.delete(playerName);
    }
  }
}, 20);

// Clean up all character entities when player leaves
world.afterEvents.playerLeave.subscribe((event) => {
  const name = event.playerName;
  const data = activeTransformations.get(name);
  if (data) {
    try { data.entity.remove(); } catch (_) {}
    activeTransformations.delete(name);
  }
});

// ══════════════════════════════════════════
// Sistema de efectos por traje equipado
// ══════════════════════════════════════════
const equippedState = new Map(); // playerId → characterId

function getEquippedCostume(player) {
  try {
    const equip = player.getComponent("equippable");
    if (!equip) return null;
    const head = equip.getEquipment(EquipmentSlot.Head);
    if (!head) return null;
    for (const [id, ch] of Object.entries(CHARACTERS)) {
      if (head.typeId === ch.costumeId) return id;
    }
    return null;
  } catch {
    return null;
  }
}

// Loop de efectos cada 100 ticks (~5 segundos)
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const costume = getEquippedCostume(player);
    const prev = equippedState.get(player.id);

    // Detectar cambio de traje
    if (costume !== prev) {
      if (costume) {
        const ch = CHARACTERS[costume];
        for (const msg of ch.equipMsg) player.sendMessage(msg);
      } else if (prev) {
        const prevCh = CHARACTERS[prev];
        player.sendMessage(`§7${prevCh.name} pierde su poder...`);
      }
      equippedState.set(player.id, costume);
    }

    // Aplicar efectos
    if (costume) {
      const ch = CHARACTERS[costume];
      for (const eff of ch.effects) {
        player.addEffect(eff.id, eff.dur * 20, { amplifier: eff.amp, showParticles: false });
      }
    }
  }
}, 100);

// ══════════════════════════════════════════
// Mecánica especial: Dalila vs Sansón
// ══════════════════════════════════════════
world.afterEvents.entityHitEntity.subscribe((event) => {
  const attacker = event.damagingEntity;
  const target = event.hitEntity;

  if (attacker?.typeId !== "minecraft:player" || target?.typeId !== "minecraft:player") return;

  const attackerCostume = getEquippedCostume(attacker);

  // Dalila golpea a alguien con samson_hair equipado
  if (attackerCostume === "dalila") {
    try {
      const targetEquip = target.getComponent("equippable");
      const targetHead = targetEquip?.getEquipment(EquipmentSlot.Head);
      if (targetHead?.typeId === "miaddon:samson_hair" || targetHead?.typeId === "miaddon:sanson_costume") {
        // Traición de Dalila
        target.addEffect("weakness", 1200, { amplifier: 4, showParticles: true });
        target.addEffect("slowness", 1200, { amplifier: 2, showParticles: true });
        target.addEffect("mining_fatigue", 1200, { amplifier: 2, showParticles: true });

        // Quitar el casco de Sansón
        targetEquip.setEquipment(EquipmentSlot.Head, undefined);

        target.sendMessage("§4☠ DALILA TE HA TRAICIONADO — Jueces 16:19");
        target.sendMessage('§4§o"...ella llamó a un hombre, quien le rapó las siete trenzas de su cabeza"');
        attacker.sendMessage("§d✦ Los 1,100 siclos de plata son tuyos.");
        attacker.sendMessage('§d§o"Ella dijo: ¡Sansón, los filisteos sobre ti!" — Jueces 16:20');
      }
    } catch { /* ignore */ }
  }

  // David golpea a Goliát — daño multiplicado
  if (attackerCostume === "david") {
    try {
      const attackerEquip = attacker.getComponent("equippable");
      const mainhand = attackerEquip?.getEquipment(EquipmentSlot.Mainhand);
      const targetCostume = getEquippedCostume(target);

      if (mainhand?.typeId === "miaddon:david_sling" && targetCostume === "goliat") {
        // La piedra de David hiere al gigante en la frente
        target.addEffect("instant_damage", 1, { amplifier: 4, showParticles: true });
        target.addEffect("levitation", 40, { amplifier: 2, showParticles: true });

        attacker.sendMessage("§b✦ ¡La piedra hirió al filisteo en la frente!");
        attacker.sendMessage('§b§o"...y cayó sobre su rostro en tierra" — I Samuel 17:49');
        target.sendMessage("§4✦ ¡Una piedra te golpea en la frente!");
        target.sendMessage('§c§o"Y satisfágase toda esta satisfacción de saber que no con espada ni con lanza salva el Señor"');
      }
    } catch { /* ignore */ }
  }
});

// ══════════════════════════════════════════
// Mecánica Goliát: Intimidación periódica
// ══════════════════════════════════════════
let goliatShoutTick = 0;
system.runInterval(() => {
  goliatShoutTick++;
  if (goliatShoutTick < 6) return; // cada 6 * 100 = 600 ticks (~30 seg)
  goliatShoutTick = 0;

  for (const player of world.getAllPlayers()) {
    if (getEquippedCostume(player) !== "goliat") continue;

    // Gritar a jugadores cercanos
    const pos = player.location;
    for (const other of world.getAllPlayers()) {
      if (other.id === player.id) continue;
      const dx = other.location.x - pos.x;
      const dz = other.location.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 30) continue;

      const otherCostume = getEquippedCostume(other);
      if (otherCostume === "david") {
        other.sendMessage("§b✦ El filisteo te desafía. Usa tu honda.");
        player.sendMessage("§4⚠ David se acerca... cuidado con su honda.");
      } else {
        other.sendMessage('§4[GOLIÁT]: §c"¿Por qué habéis salido a presentar batalla?"');
        other.sendMessage('§4"¡Escoged de entre vosotros un hombre que venga contra mí!"');
        other.sendMessage("§c§o— I Samuel 17:8");
      }
    }
  }
}, 100);

// ══════════════════════════════════════════
// Mecánica Lanza de Goliát: debuff al golpear
// ══════════════════════════════════════════
world.afterEvents.entityHitEntity.subscribe((event) => {
  const attacker = event.damagingEntity;
  const target = event.hitEntity;

  if (attacker?.typeId !== "minecraft:player" || target?.typeId !== "minecraft:player") return;

  try {
    const equip = attacker.getComponent("equippable");
    const mainhand = equip?.getEquipment(EquipmentSlot.Mainhand);
    if (mainhand?.typeId === "miaddon:bronze_spear") {
      target.addEffect("weakness", 100, { amplifier: 1, showParticles: true });
      target.sendMessage("§c¡La lanza de Goliát!");
    }
  } catch { /* ignore */ }
});
