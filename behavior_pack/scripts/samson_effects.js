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
// Detector de uso de items (Pergamino)
// ══════════════════════════════════════════
world.afterEvents.itemCompleteUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;

  if (item.typeId === "miaddon:samson_scroll") {
    handleScrollUse(player);
  }
});

// ══════════════════════════════════════════
// Tijeras de Dalila — Click en otro jugador
// Left-click (ataque) o Right-click (interacción)
// ══════════════════════════════════════════
function handleScissorsOnTarget(attacker, target) {
  // Ambos deben ser jugadores
  if (attacker.typeId !== "minecraft:player") return;
  if (target.typeId !== "minecraft:player") return;

  // Verificar que el atacante sostiene las tijeras
  const attackerEquip = attacker.getComponent("equippable");
  if (!attackerEquip) return;
  const mainhand = attackerEquip.getEquipment(EquipmentSlot.Mainhand);
  if (!mainhand || mainhand.typeId !== "miaddon:scissors") return;

  // Verificar que la víctima lleva el Cabello de Sansón
  const targetEquip = target.getComponent("equippable");
  if (!targetEquip) return;
  const targetHead = targetEquip.getEquipment(EquipmentSlot.Head);
  if (!targetHead || targetHead.typeId !== "miaddon:samson_hair") return;

  // Ejecutar en el siguiente tick para evitar problemas de sincronización
  system.run(() => {
    try {
      // Quitar el casco de la víctima
      targetEquip.setEquipment(EquipmentSlot.Head, undefined);
      // Consumir las tijeras del atacante
      attackerEquip.setEquipment(EquipmentSlot.Mainhand, undefined);
    } catch (e) {}
  });

  // Evitar que el detector de equipo envíe mensaje duplicado
  wearingHair.delete(target.name);

  // Mensajes dramáticos
  attacker.sendMessage("§4§l☠ Has cortado el cabello de Sansón... §r§4La traición está hecha.");
  target.sendMessage("§4§l☠ DALILA HA TRAICIONADO A SANSÓN ☠");
  target.sendMessage('§c§o"Y ella hizo rapar los siete cabellos de su cabeza..."');
  target.sendMessage("§4§l— Jueces 16:19");

  // Remover buffs positivos de la víctima
  removeBuffs(target);

  // Aplicar maldición a la víctima
  try {
    target.addEffect("weakness", 1200, { amplifier: 4, showParticles: true });
    target.addEffect("slowness", 1200, { amplifier: 2, showParticles: true });
    target.addEffect("mining_fatigue", 1200, { amplifier: 2, showParticles: true });
    target.addEffect("blindness", 100, { amplifier: 0, showParticles: true });
    target.addEffect("nausea", 60, { amplifier: 0, showParticles: true });
  } catch (e) {}

  // Marcar víctima como maldecida
  cursedPlayers.set(target.name, system.currentTick);
}

// Left-click: atacar a otro jugador con las tijeras
world.afterEvents.entityHitEntity.subscribe((event) => {
  handleScissorsOnTarget(event.damagingEntity, event.hitEntity);
});

// Right-click: interactuar con otro jugador con las tijeras
world.afterEvents.playerInteractWithEntity.subscribe((event) => {
  handleScissorsOnTarget(event.player, event.target);
});

// ══════════════════════════════════════════
// Pergamino de Jueces — Instrucciones
// ══════════════════════════════════════════
function handleScrollUse(player) {
  player.sendMessage("§e=== INSTRUCCIONES: ADD-ON DE SANSÓN ===");
  player.sendMessage("§f▸ Equipa el §6Cabello de Sansón§f en tu cabeza para obtener superfuerza.");
  player.sendMessage("§f▸ Con el casco puesto tendrás: §afuerza, velocidad, resistencia y más.");
  player.sendMessage("§f▸ Usa las §cTijeras de Dalila§f en otro jugador para cortarle el cabello y quitarle el poder.");
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
