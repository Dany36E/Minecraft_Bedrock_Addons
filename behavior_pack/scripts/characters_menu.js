// characters_menu.js — Sistema de transformación en personajes bíblicos
// @minecraft/server 1.12.0 + @minecraft/server-ui 1.3.0
import { world, system, EquipmentSlot, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// ══════════════════════════════════════════
// Datos de personajes
// ══════════════════════════════════════════
const CHARACTERS = {
  sanson: {
    name: "Sansón",
    ref: "Jueces 13-16",
    color: "§e",
    desc: "Nazareo desde el vientre de su madre, consagrado a Dios. Su fuerza sobrenatural provenía del Espíritu del Señor, y su señal externa era su cabello largo que nunca fue cortado.",
    verse: '"...y el Espíritu del Señor comenzó a manifestarse en él." — Jueces 13:25',
    abilities: "§aFuerza V §7| §aVelocidad II §7| §aResistencia II §7| §aRegeneración I §7| §aSalto I §7| §aRapidez III",
    uniqueDesc: "Cabello de Sansón §7(casco existente con poderes del nazareo)",
    costumeId: "miaddon:sanson_costume",
    uniqueItems: ["miaddon:samson_hair", "miaddon:samson_scroll"],
    equipMsg: [
      "§6✦ EL ESPÍRITU DEL SEÑOR VINO SOBRE SANSÓN ✦",
      '§e§o"...y el Espíritu del Señor comenzó a manifestarse en él" — Jueces 13:25',
    ],
    effects: [
      { id: "strength", amp: 4, dur: 7 },
      { id: "haste", amp: 2, dur: 7 },
      { id: "speed", amp: 1, dur: 7 },
      { id: "resistance", amp: 1, dur: 7 },
      { id: "jump_boost", amp: 0, dur: 7 },
      { id: "regeneration", amp: 0, dur: 7 },
    ],
  },
  dalila: {
    name: "Dalila",
    ref: "Jueces 16:4-22",
    color: "§d",
    desc: 'Mujer del valle de Sorec. Los señores filisteos le ofrecieron 1,100 siclos de plata cada uno para descubrir el secreto de la fuerza de Sansón. Con insistencia lo sedujo hasta que él le reveló su voto nazareo.',
    verse: '"Después de esto aconteció que se enamoró de una mujer en el valle de Sorec, la cual se llamaba Dalila." — Jueces 16:4',
    abilities: "§dVelocidad II §7| §dSalto I §7| §dVisión nocturna §7| §dSuerte II",
    uniqueDesc: "Tijeras de Dalila §7(cortan el cabello de Sansón, quitando su fuerza)",
    costumeId: "miaddon:dalila_costume",
    uniqueItems: ["miaddon:scissors", "miaddon:samson_scroll"],
    equipMsg: [
      "§d✦ Entras al valle de Sorec como Dalila.",
      '§7§o"Después aconteció que se enamoró de una mujer..." — Jueces 16:4',
    ],
    effects: [
      { id: "speed", amp: 1, dur: 7 },
      { id: "jump_boost", amp: 0, dur: 7 },
      { id: "night_vision", amp: 0, dur: 7 },
    ],
  },
  david: {
    name: "David",
    ref: "I Samuel 16-17",
    color: "§b",
    desc: 'El menor de los hijos de Isaí, pastor de ovejas en Belén. Rubio, de hermosos ojos y buen parecer. Ungido por Samuel como futuro rey de Israel. Derrotó al gigante Goliát con una honda y cinco piedras lisas del arroyo.',
    verse: '"Era rubio, de hermosos ojos, y de buen parecer. Entonces el Señor dijo: Levántate y úngelo, porque éste es." — I Samuel 16:12',
    abilities: "§bVelocidad III §7| §bSalto II §7| §bResistencia I §7| §bSuerte II",
    uniqueDesc: "Honda de David §7(daño x10 contra Goliát — I Samuel 17:49)",
    costumeId: "miaddon:david_costume",
    uniqueItems: ["miaddon:david_sling"],
    equipMsg: [
      "§b✦ El Espíritu del Señor está contigo, David.",
      '§7§o"Era rubio, de hermosos ojos, y de buen parecer" — I Samuel 16:12',
    ],
    effects: [
      { id: "speed", amp: 2, dur: 7 },
      { id: "jump_boost", amp: 1, dur: 7 },
      { id: "resistance", amp: 0, dur: 7 },
    ],
  },
  goliat: {
    name: "Goliát",
    ref: "I Samuel 17",
    color: "§c",
    desc: 'Campeón de los filisteos de la ciudad de Gat. Medía seis codos y un palmo (2.9 metros). Vestía cota de malla de 5,000 siclos de bronce (~57 kg), grebas de bronce, y jabalina de bronce. Desafió a Israel por 40 días.',
    verse: '"¿Por qué habéis salido a presentar batalla? ¡Escoged de entre vosotros un hombre que venga contra mí!" — I Samuel 17:8',
    abilities: "§cFuerza V §7| §cResistencia IV §7| §cVida extra IV §7| §8Lentitud II §7(peso de la armadura)",
    uniqueDesc: "Lanza de Goliát §7(15 daño, la más poderosa — I Samuel 17:7)",
    costumeId: "miaddon:goliat_costume",
    uniqueItems: ["miaddon:bronze_spear"],
    equipMsg: [
      "§c✦ ERES GOLIÁT, CAMPEÓN DE LOS FILISTEOS.",
      '§c§o"Un hombre de guerra desde su juventud" — I Samuel 17:33',
    ],
    effects: [
      { id: "strength", amp: 4, dur: 7 },
      { id: "resistance", amp: 3, dur: 7 },
      { id: "health_boost", amp: 3, dur: 7 },
      { id: "slowness", amp: 1, dur: 7 },
    ],
  },
};

// ══════════════════════════════════════════
// Listener: uso del Libro de Personajes
// ══════════════════════════════════════════
world.beforeEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;
  if (item?.typeId !== "miaddon:characters_book") return;
  event.cancel = true;
  system.run(() => openCharactersMenu(player));
});

// ══════════════════════════════════════════
// Menú principal
// ══════════════════════════════════════════
function openCharactersMenu(player) {
  const form = new ActionFormData();
  form.title("§6§l✦ Personajes Bíblicos ✦");
  form.body("§fElige a quién quieres encarnar:\n§eAda personaje tiene habilidades únicas según la Biblia.");
  form.button("§l§eSansón§r\n§eJueces 13-16 · Nazareo · Superfuerza");
  form.button("§l§dDalila§r\n§eJueces 16 · Filistea de Sorec · Seducción");
  form.button("§l§bDavid§r\n§eI Samuel 16-17 · Pastor de Belén · Honda");
  form.button("§l§cGoliát§r\n§eI Samuel 17 · Gigante de Gat · Armadura");
  form.button("§e📖 Instrucciones de skin");
  form.button("§cCerrar");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === 5) return;
    if (response.selection === 4) {
      system.run(() => showSkinInstructions(player));
      return;
    }
    const ids = ["sanson", "dalila", "david", "goliat"];
    system.run(() => showCharacterScreen(player, ids[response.selection]));
  });
}

// ══════════════════════════════════════════
// Pantalla de personaje con lore bíblico
// ══════════════════════════════════════════
function showCharacterScreen(player, characterId) {
  const ch = CHARACTERS[characterId];
  if (!ch) return;

  const body =
    `§e${ch.ref}\n\n` +
    `§f${ch.desc}\n\n` +
    `§o§b${ch.verse}\n\n` +
    `§r§e━━━━━━━━━━━━━━━━━━━━\n` +
    `§fHabilidades al equipar el traje:\n` +
    `${ch.abilities}\n\n` +
    `§fItem único: ${ch.uniqueDesc}\n\n` +
    `§e⚠ Recuerda equipar la skin del personaje para la experiencia completa.`;

  const form = new ActionFormData();
  form.title(`${ch.color}${ch.name}`);
  form.body(body);
  form.button("§l§a✦ Recibir traje y poderes");
  form.button("§c↩ Volver");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === 1) {
      system.run(() => openCharactersMenu(player));
      return;
    }
    system.run(() => giveCostume(player, characterId));
  });
}

// ══════════════════════════════════════════
// Instrucciones de skin
// ══════════════════════════════════════════
function showSkinInstructions(player) {
  player.sendMessage("§e=== CÓMO EQUIPAR UNA SKIN ===");
  player.sendMessage("§f1. Sal de este mundo al menú principal.");
  player.sendMessage("§f2. Ve a Configuración → Perfil.");
  player.sendMessage('§f3. Busca el skin pack "Personajes Bíblicos".');
  player.sendMessage("§f4. Selecciona el personaje y vuelve al juego.");
  player.sendMessage("§f5. ¡Ahora usa el Libro de Personajes para activar sus poderes!");
  player.sendMessage("§e================================");
}

// ══════════════════════════════════════════
// Dar traje y items únicos
// ══════════════════════════════════════════
function giveCostume(player, characterId) {
  const ch = CHARACTERS[characterId];
  if (!ch) return;

  try {
    const inv = player.getComponent("inventory").container;
    // Dar traje
    inv.addItem(new ItemStack(ch.costumeId, 1));
    // Dar items únicos
    for (const itemId of ch.uniqueItems) {
      inv.addItem(new ItemStack(itemId, 1));
    }
    player.sendMessage(`§a✦ Traje de ${ch.name} recibido. §7Equípalo como casco para activar los poderes.`);
    if (ch.uniqueItems.length > 0) {
      player.sendMessage(`§7Items únicos añadidos al inventario.`);
    }
  } catch (e) {
    player.sendMessage(`§cError al dar el traje. ¿Inventario lleno?`);
  }
}

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
