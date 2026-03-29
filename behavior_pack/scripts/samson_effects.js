// samson_effects.js — Script API principal del Add-on de Sansón
// @minecraft/server 1.12.0 — Compatible con Xbox Bedrock 1.21.x
import { world, system, EquipmentSlot, ItemStack } from "@minecraft/server";

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

// ══════════════════════════════════════════
// DIAGNÓSTICO IN-GAME
// Usa: /scriptevent miaddon:test
//      /scriptevent miaddon:test items    → prueba items
//      /scriptevent miaddon:test effects  → prueba efectos
//      /scriptevent miaddon:test equip    → prueba equipar/desequipar
//      /scriptevent miaddon:test all      → prueba todo
// ══════════════════════════════════════════
system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== "miaddon:test") return;
  const player = event.sourceEntity;
  if (!player || player.typeId !== "minecraft:player") {
    world.sendMessage("§c[DIAG] Usa este comando como jugador en el chat.");
    return;
  }

  const arg = (event.message || "").trim().toLowerCase();
  const results = { pass: 0, fail: 0, warn: 0, messages: [] };

  function pass(msg) { results.pass++; results.messages.push(`§a  ✅ ${msg}`); }
  function fail(msg) { results.fail++; results.messages.push(`§c  ❌ ${msg}`); }
  function warnMsg(msg) { results.warn++; results.messages.push(`§e  ⚠️ ${msg}`); }
  function info(msg) { results.messages.push(`§7  ℹ ${msg}`); }

  // ── TEST: Items existen y se pueden crear ──
  if (!arg || arg === "all" || arg === "items") {
    results.messages.push("§6§l── TEST: ITEMS ──");
    const testItems = [
      { id: "miaddon:samson_hair", name: "Cabello de Sansón" },
      { id: "miaddon:scissors", name: "Tijeras de Dalila" },
      { id: "miaddon:samson_scroll", name: "Pergamino de Jueces" },
    ];
    for (const item of testItems) {
      try {
        const stack = new ItemStack(item.id, 1);
        if (stack.typeId === item.id) {
          pass(`${item.name} (${item.id}) — se puede crear`);
          // Check display name
          if (stack.nameTag) {
            info(`  nameTag: "${stack.nameTag}"`);
          }
        } else {
          fail(`${item.name} — typeId incorrecto: ${stack.typeId}`);
        }
      } catch (e) {
        fail(`${item.name} (${item.id}) — ERROR: ${e.message}`);
      }
    }
  }

  // ── TEST: Efectos se pueden aplicar ──
  if (!arg || arg === "all" || arg === "effects") {
    results.messages.push("§6§l── TEST: EFECTOS ──");
    const testEffects = [
      { id: "strength", amp: 4 },
      { id: "haste", amp: 2 },
      { id: "speed", amp: 1 },
      { id: "resistance", amp: 1 },
      { id: "jump_boost", amp: 0 },
      { id: "regeneration", amp: 0 },
      { id: "weakness", amp: 4 },
      { id: "slowness", amp: 2 },
      { id: "mining_fatigue", amp: 2 },
      { id: "blindness", amp: 0 },
      { id: "nausea", amp: 0 },
    ];
    for (const eff of testEffects) {
      try {
        player.addEffect(eff.id, 2, { amplifier: eff.amp, showParticles: false });
        pass(`Efecto "${eff.id}" (amp ${eff.amp}) — aplicado OK`);
        try { player.removeEffect(eff.id); } catch (e2) {}
      } catch (e) {
        fail(`Efecto "${eff.id}" — ERROR: ${e.message}`);
      }
    }
  }

  // ── TEST: Equipment slots ──
  if (!arg || arg === "all" || arg === "equip") {
    results.messages.push("§6§l── TEST: EQUIPO ──");
    const equippable = player.getComponent("equippable");
    if (!equippable) {
      fail("El jugador no tiene componente 'equippable'");
    } else {
      pass("Componente equippable — presente");

      // Verificar slots accesibles
      try {
        const head = equippable.getEquipment(EquipmentSlot.Head);
        pass(`EquipmentSlot.Head accesible — actual: ${head ? head.typeId : "(vacío)"}`);
        if (head?.typeId === "miaddon:samson_hair") {
          pass("¡Cabello de Sansón detectado en la cabeza!");
          info(`  Estado cursed: ${cursedPlayers.has(player.name) ? "SÍ (maldecido)" : "NO (con poder)"}`);
          info(`  Estado wearingHair: ${wearingHair.has(player.name)}`);
        }
      } catch (e) {
        fail(`EquipmentSlot.Head — ERROR: ${e.message}`);
      }

      try {
        const mainhand = equippable.getEquipment(EquipmentSlot.Mainhand);
        pass(`EquipmentSlot.Mainhand accesible — actual: ${mainhand ? mainhand.typeId : "(vacío)"}`);
        if (mainhand?.typeId === "miaddon:scissors") {
          pass("¡Tijeras en mano detectadas!");
        }
      } catch (e) {
        fail(`EquipmentSlot.Mainhand — ERROR: ${e.message}`);
      }

      // Test equipar y desequipar el casco
      try {
        const originalHead = equippable.getEquipment(EquipmentSlot.Head);
        const testStack = new ItemStack("miaddon:samson_hair", 1);
        equippable.setEquipment(EquipmentSlot.Head, testStack);
        const check = equippable.getEquipment(EquipmentSlot.Head);
        if (check?.typeId === "miaddon:samson_hair") {
          pass("setEquipment(Head, samson_hair) — funciona OK");
        } else {
          fail("setEquipment(Head) no se aplicó correctamente");
        }
        // Restaurar original
        equippable.setEquipment(EquipmentSlot.Head, originalHead || undefined);
        pass("Restaurar equipo original — OK");
      } catch (e) {
        fail(`Test equipar/desequipar — ERROR: ${e.message}`);
      }
    }
  }

  // ── TEST: Eventos registrados ──
  if (!arg || arg === "all") {
    results.messages.push("§6§l── TEST: EVENTOS ──");
    // No podemos verificar suscripciones directamente, pero podemos confirmar
    // que el script cargó completamente
    pass("Script cargó completamente (este mensaje lo demuestra)");
    info("afterEvents.entityHitEntity — registrado (tijeras left-click)");
    info("afterEvents.playerInteractWithEntity — registrado (tijeras right-click)");
    info("afterEvents.itemCompleteUse — registrado (pergamino)");
    info("afterEvents.scriptEventReceive — registrado (este diagnóstico)");
    info(`system.currentTick: ${system.currentTick}`);
    info(`Jugadores online: ${world.getAllPlayers().length}`);
    info(`cursedPlayers: ${cursedPlayers.size} jugadores maldecidos`);
    info(`wearingHair: ${wearingHair.size} jugadores con pelo`);
  }

  // ── RESUMEN ──
  results.messages.push("");
  results.messages.push("§6§l════════════════════════════════");
  if (results.fail === 0) {
    results.messages.push(`§a§l🎉 TODO OK — ${results.pass} tests pasaron, ${results.warn} warnings`);
  } else {
    results.messages.push(`§c§l⚠ ${results.fail} FALLOS — ${results.pass} OK, ${results.warn} warnings`);
  }
  results.messages.push("§6§l════════════════════════════════");

  // Enviar resultados
  player.sendMessage("§6§l═══ DIAGNÓSTICO MI-ADDON ═══");
  for (const msg of results.messages) {
    player.sendMessage(msg);
  }
});
