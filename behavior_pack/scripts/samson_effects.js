// samson_effects.js — Script API principal del Add-on de Sansón
// @minecraft/server 1.12.0 — Compatible con Xbox Bedrock 1.21.x
import { world, system, EquipmentSlot } from "@minecraft/server";

// ══════════════════════════════════════════
// Estado global
// ══════════════════════════════════════════
const cursedPlayers = new Map();   // playerName -> tick cuando fue maldecido
const wearingHair = new Set();     // players que llevan el casco puesto

// ══════════════════════════════════════════
// Aplicar efectos positivos de Sansón
// ══════════════════════════════════════════
function applyBuffs(player) {
  try {
    // Duración 120 ticks (6 seg) > intervalo 80 ticks (4 seg) → sin cortes
    player.addEffect("strength", 120, { amplifier: 4, showParticles: false });
    player.addEffect("haste", 120, { amplifier: 2, showParticles: false });
    player.addEffect("speed", 120, { amplifier: 1, showParticles: false });
    player.addEffect("resistance", 120, { amplifier: 1, showParticles: false });
    player.addEffect("jump_boost", 120, { amplifier: 0, showParticles: false });
    player.addEffect("regeneration", 120, { amplifier: 0, showParticles: false });
  } catch (e) {
    // Silenciar errores si el jugador no es válido
  }
}

// ══════════════════════════════════════════
// Remover efectos positivos
// ══════════════════════════════════════════
function removeBuffs(player) {
  const effects = ["strength", "haste", "speed", "resistance", "jump_boost", "regeneration"];
  for (const effect of effects) {
    try { player.removeEffect(effect); } catch (e) { /* no tenía el efecto */ }
  }
}

// ══════════════════════════════════════════
// Detector de equipo + recuperación (cada 20 ticks = 1 segundo)
// ══════════════════════════════════════════
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const equippable = player.getComponent("equippable");
    if (!equippable) continue;

    const head = equippable.getEquipment(EquipmentSlot.Head);
    const hasHair = head?.typeId === "miaddon:samson_hair";
    const wasWearing = wearingHair.has(player.name);

    // Mensaje al equipar
    if (hasHair && !wasWearing) {
      wearingHair.add(player.name);
      if (!cursedPlayers.has(player.name)) {
        player.sendMessage("§6✦ ¡El poder de Sansón desciende sobre ti! ¡Eres invencible! ✦");
      }
    }

    // Mensaje al desequipar
    if (!hasHair && wasWearing) {
      wearingHair.delete(player.name);
      player.sendMessage("§7El poder de Sansón se desvanece...");
    }

    // Verificar recuperación de la maldición
    if (hasHair && cursedPlayers.has(player.name)) {
      const curseTick = cursedPlayers.get(player.name);
      if (system.currentTick - curseTick >= 1200) { // 60 segundos = 1200 ticks
        cursedPlayers.delete(player.name);
        player.sendMessage('§a§l✦ ¡El poder de Sansón regresa! §r§a"...y su cabello comenzó a crecer de nuevo."');
        player.sendMessage("§a§o— Jueces 16:22");
        applyBuffs(player);
      }
    }
  }
}, 20);

// ══════════════════════════════════════════
// Loop de buffs positivos (cada 80 ticks = 4 segundos)
// ══════════════════════════════════════════
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const equippable = player.getComponent("equippable");
    if (!equippable) continue;

    const head = equippable.getEquipment(EquipmentSlot.Head);
    const hasHair = head?.typeId === "miaddon:samson_hair";

    if (hasHair && !cursedPlayers.has(player.name)) {
      applyBuffs(player);
    }
  }
}, 80);

// ══════════════════════════════════════════
// Detector de uso de items (Tijeras y Pergamino)
// Se usa itemCompleteUse porque los items son tipo "food"
// para habilitar el right-click en Bedrock
// ══════════════════════════════════════════
world.afterEvents.itemCompleteUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;

  if (item.typeId === "miaddon:scissors") {
    handleScissorsUse(player);
  } else if (item.typeId === "miaddon:samson_scroll") {
    handleScrollUse(player);
  }
});

// ══════════════════════════════════════════
// Tijeras de Dalila — La traición
// ══════════════════════════════════════════
function handleScissorsUse(player) {
  // PASO 1 — Mensaje dramático
  player.sendMessage("§4§l☠ DALILA HA TRAICIONADO A SANSÓN ☠");
  player.sendMessage('§c§o"Y ella hizo rapar los siete cabellos de su cabeza..."');
  player.sendMessage("§4§l— Jueces 16:19");

  // PASO 2 — Remover buffs positivos
  removeBuffs(player);

  // PASO 3 — Aplicar efectos negativos
  try {
    player.addEffect("weakness", 1200, { amplifier: 4, showParticles: true });
    player.addEffect("slowness", 1200, { amplifier: 2, showParticles: true });
    player.addEffect("mining_fatigue", 1200, { amplifier: 2, showParticles: true });
    player.addEffect("blindness", 100, { amplifier: 0, showParticles: true });
    player.addEffect("nausea", 60, { amplifier: 0, showParticles: true });
  } catch (e) {
    // Fallback por si algún efecto no existe
  }

  // PASO 4 — Marcar como maldecido
  cursedPlayers.set(player.name, system.currentTick);

  // El item ya fue consumido automáticamente por ser tipo food (un solo uso)
}

// ══════════════════════════════════════════
// Pergamino de Jueces — Instrucciones
// ══════════════════════════════════════════
function handleScrollUse(player) {
  player.sendMessage("§e=== INSTRUCCIONES: ADD-ON DE SANSÓN ===");
  player.sendMessage("§f▸ Equipa el §6Cabello de Sansón§f en tu cabeza para obtener superfuerza.");
  player.sendMessage("§f▸ Con el casco puesto tendrás: §afuerza, velocidad, resistencia y más.");
  player.sendMessage("§f▸ Las §cTijeras de Dalila§f te quitan el poder por 60 segundos.");
  player.sendMessage("§f▸ Después de 60 segundos, §atu poder regresa§f si sigues con el casco.");
  player.sendMessage("§e=====================================");

  // Devolver el pergamino (fue consumido como food, pero no debe desaparecer)
  system.run(() => {
    try {
      player.runCommand("give @s miaddon:samson_scroll 1");
    } catch (e) {
      // Silenciar si el jugador no está disponible
    }
  });
}
