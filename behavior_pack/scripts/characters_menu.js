// characters_menu.js — Sistema de transformación con entidades montables + control completo
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
    attackDamage: 12,
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
    attackDamage: 4,
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
    ],
  },
  david: {
    name: "David",
    ref: "I Samuel 16-17",
    color: "§b",
    entityId: "miaddon:david_entity",
    attackDamage: 6,
    desc: 'El menor de los hijos de Isaí, pastor de ovejas en Belén. Rubio, de hermosos ojos y buen parecer. Ungido por Samuel como futuro rey de Israel.',
    verse: '"Era rubio, de hermosos ojos, y de buen parecer. Entonces el Señor dijo: Levántate y úngelo, porque éste es." — I Samuel 16:12',
    abilities: "§bVelocidad III §7| §bSuerte II §7| §bResistencia I §7| §bSalto II",
    transformMsg: [
      "§b✦ El Espíritu del Señor está contigo, David.",
      '§7§o"Era rubio, de hermosos ojos, y de buen parecer" — I Samuel 16:12',
    ],
    effects: [
      { id: "speed", amp: 2, dur: 999999 },
      { id: "resistance", amp: 0, dur: 999999 },
      { id: "jump_boost", amp: 1, dur: 999999 },
    ],
  },
  goliath: {
    name: "Goliát",
    ref: "I Samuel 17",
    color: "§c",
    entityId: "miaddon:goliath_entity",
    attackDamage: 20,
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
/** @type {Map<string, {entity: import("@minecraft/server").Entity, charId: string, invisTick: number}>} */
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
  form.body("§fElige a quién quieres encarnar:\n§eCada personaje te transforma visualmente y otorga habilidades bíblicas.\n§7WASD/joystick para mover, botón de ataque para golpear.");
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
    `§fHabilidades:\n${ch.abilities}\n` +
    `§fDaño de ataque: §c${ch.attackDamage}`,
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
// Transformar jugador — montar entidad con control
// ══════════════════════════════════════════
function transformPlayer(player, characterId) {
  const ch = CHARACTERS[characterId];
  if (!ch) return;

  if (activeTransformations.has(player.name)) {
    revertTransformation(player, true);
  }

  try {
    const loc = player.location;
    const dim = player.dimension;

    const entity = dim.spawnEntity(ch.entityId, loc);
    entity.addTag(`owner:${player.name}`);

    // Mount the player onto the entity
    player.runCommand(`ride @s start_riding @e[type=${ch.entityId},c=1,r=3]`);

    // Apply invisibility to hide player model
    player.addEffect("invisibility", 999999, { amplifier: 0, showParticles: false });

    // Apply character effects
    for (const eff of ch.effects) {
      player.addEffect(eff.id, eff.dur, { amplifier: eff.amp, showParticles: false });
    }

    activeTransformations.set(player.name, { entity, charId: characterId, invisTick: 0 });

    for (const msg of ch.transformMsg) {
      player.sendMessage(msg);
    }
    player.sendMessage("§7Usa el §eLibro de Personajes §7de nuevo para revertir.");
    player.sendMessage("§7Controles: §fWASD/joystick §7= mover, §fBotón ataque §7= golpear");

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

  try { player.runCommand("ride @s stop_riding"); } catch (_) {}
  try { player.removeEffect("invisibility"); } catch (_) {}

  const ch = CHARACTERS[data.charId];
  if (ch) {
    for (const eff of ch.effects) {
      try { player.removeEffect(eff.id); } catch (_) {}
    }
  }

  try {
    if (data.entity?.isValid()) data.entity.remove();
  } catch (_) {}

  activeTransformations.delete(player.name);

  if (!silent) {
    player.sendMessage("§a✦ Has vuelto a tu forma normal.");
  }
}

// ══════════════════════════════════════════
// Main tick loop — invisibility renewal + cleanup
// ══════════════════════════════════════════
system.runInterval(() => {
  for (const [playerName, data] of activeTransformations) {
    // Entity dead/removed → clean up
    if (!data.entity?.isValid()) {
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

    // Player offline → remove entity
    let player = null;
    for (const p of world.getAllPlayers()) {
      if (p.name === playerName) { player = p; break; }
    }
    if (!player) {
      try { data.entity.remove(); } catch (_) {}
      activeTransformations.delete(playerName);
      continue;
    }

    // Renew invisibility every ~800 ticks to prevent flickering
    data.invisTick = (data.invisTick || 0) + 1;
    if (data.invisTick >= 40) {
      data.invisTick = 0;
      try {
        player.addEffect("invisibility", 999999, { amplifier: 0, showParticles: false });
      } catch (_) {}
    }
  }
}, 20);

// Clean up on player leave
world.afterEvents.playerLeave.subscribe((event) => {
  const data = activeTransformations.get(event.playerName);
  if (data) {
    try { data.entity.remove(); } catch (_) {}
    activeTransformations.delete(event.playerName);
  }
});

// ══════════════════════════════════════════
// Combat — character-specific attack damage + specials
// ══════════════════════════════════════════
world.afterEvents.entityHitEntity.subscribe((event) => {
  const attacker = event.damagingEntity;
  const target = event.hitEntity;
  if (!attacker || !target) return;

  // Find if the attacker is riding a character entity
  let attackerData = null;
  if (attacker.typeId === "minecraft:player") {
    attackerData = activeTransformations.get(attacker.name);
  }

  // Find if the target is a character entity (someone else's mount)
  let targetPlayerName = null;
  let targetData = null;
  for (const [pName, d] of activeTransformations) {
    if (d.entity?.isValid() && d.entity.id === target.id) {
      targetPlayerName = pName;
      targetData = d;
      break;
    }
  }

  // Player-as-character attacks another character entity
  if (attackerData && targetData) {
    const attackerCh = CHARACTERS[attackerData.charId];
    const targetCh = CHARACTERS[targetData.charId];

    // Apply character-specific damage to the entity
    try {
      target.applyDamage(attackerCh.attackDamage);
    } catch (_) {}

    // SPECIAL: David vs Goliath — massive bonus damage + levitation
    if (attackerData.charId === "david" && targetData.charId === "goliath") {
      try {
        target.applyDamage(50);
        const targetPlayer = findPlayerByName(targetPlayerName);
        if (targetPlayer) {
          targetPlayer.addEffect("levitation", 40, { amplifier: 2, showParticles: true });
          targetPlayer.sendMessage("§4✦ ¡Una piedra te golpea en la frente!");
          targetPlayer.sendMessage('§c§o"...y cayó sobre su rostro en tierra" — I Samuel 17:49');
        }
        attacker.sendMessage("§b✦ ¡La piedra hirió al filisteo en la frente!");
        attacker.sendMessage('§b§o"...no con espada ni con lanza salva el Señor" — I Samuel 17:47');
      } catch (_) {}
    }

    // SPECIAL: Dalila vs Samson — weakness + weaken samson
    if (attackerData.charId === "dalila" && targetData.charId === "samson") {
      try {
        const samsonPlayer = findPlayerByName(targetPlayerName);
        if (samsonPlayer) {
          samsonPlayer.addEffect("weakness", 600, { amplifier: 4, showParticles: true });
          samsonPlayer.addEffect("slowness", 600, { amplifier: 2, showParticles: true });
          samsonPlayer.sendMessage("§4☠ DALILA TE HA TRAICIONADO — Jueces 16:19");
          samsonPlayer.sendMessage('§4§o"...ella llamó a un hombre, quien le rapó las siete trenzas"');
        }
        attacker.sendMessage("§d✦ Los 1,100 siclos de plata son tuyos.");
        attacker.sendMessage('§d§o"Ella dijo: ¡Sansón, los filisteos sobre ti!" — Jueces 16:20');
      } catch (_) {}
    }
  }

  // Player-as-character attacks a regular mob/entity
  if (attackerData && !targetData && target.typeId !== "minecraft:player") {
    const attackerCh = CHARACTERS[attackerData.charId];
    try {
      target.applyDamage(attackerCh.attackDamage);
    } catch (_) {}
  }
});

function findPlayerByName(name) {
  for (const p of world.getAllPlayers()) {
    if (p.name === name) return p;
  }
  return null;
}

// ══════════════════════════════════════════
// Goliath intimidation shout (every ~30 seconds)
// ══════════════════════════════════════════
let goliatShoutCounter = 0;
system.runInterval(() => {
  goliatShoutCounter++;
  if (goliatShoutCounter < 6) return;
  goliatShoutCounter = 0;

  for (const [playerName, data] of activeTransformations) {
    if (data.charId !== "goliath" || !data.entity?.isValid()) continue;
    const player = findPlayerByName(playerName);
    if (!player) continue;

    const pos = player.location;
    for (const other of world.getAllPlayers()) {
      if (other.name === playerName) continue;
      const dx = other.location.x - pos.x;
      const dz = other.location.z - pos.z;
      if (Math.sqrt(dx * dx + dz * dz) > 30) continue;

      const otherData = activeTransformations.get(other.name);
      if (otherData?.charId === "david") {
        other.sendMessage("§b✦ El filisteo te desafía. ¡Derrota al gigante!");
        player.sendMessage("§4⚠ David se acerca... cuidado con su honda.");
      } else {
        other.sendMessage('§4[GOLIÁT]: §c"¿Por qué habéis salido a presentar batalla?"');
        other.sendMessage("§c§o— I Samuel 17:8");
      }
    }
  }
}, 100);
