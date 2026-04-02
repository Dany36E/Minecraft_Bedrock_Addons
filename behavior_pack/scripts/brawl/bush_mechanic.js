// bush_mechanic.js — Mecánica de Arbustos (Brawl Stars)
// @minecraft/server 1.12.0
//
// ══════════════════════════════════════════
// MECÁNICA DE ARBUSTOS (INVISIBILIDAD) — UNIVERSAL
// ══════════════════════════════════════════
// • Funciona en CUALQUIER mapa — detecta bloques short_grass en el mundo
// • Cuando un jugador está parado en/sobre un bloque short_grass → INVISIBLE
// • Si el jugador ATACA → se hace VISIBLE inmediatamente
// • 2 segundos (40 ticks) sin atacar → vuelve a ser invisible si sigue en arbusto
// • Al salir del arbusto → pierde invisibilidad
//
// NO requiere registro de posiciones. Detecta dinámicamente.
//
import { world, system } from "@minecraft/server";

// ═══════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════
const REVEAL_DURATION = 40;    // 2 segundos = 40 ticks
const CHECK_INTERVAL = 5;      // verificar cada 5 ticks
const BUSH_BLOCK = "minecraft:short_grass";

// Estado por jugador
const playerBushState = new Map();

function getState(playerName) {
  if (!playerBushState.has(playerName)) {
    playerBushState.set(playerName, {
      inBush: false,
      lastAttackTick: 0,
      wasInvisible: false,
    });
  }
  return playerBushState.get(playerName);
}

/**
 * Verifica si el jugador está tocando un bloque de arbusto.
 * Revisa el bloque en los pies, encima y debajo del jugador.
 */
function isInBush(player) {
  const loc = player.location;
  const dim = player.dimension;
  const px = Math.floor(loc.x);
  const py = Math.floor(loc.y);
  const pz = Math.floor(loc.z);

  // Verificar bloque en los pies, 1 arriba, y 1 abajo
  const offsets = [
    { x: px, y: py, z: pz },
    { x: px, y: py - 1, z: pz },
    { x: px, y: py + 1, z: pz },
  ];

  for (const pos of offsets) {
    try {
      const block = dim.getBlock(pos);
      if (block && block.typeId === BUSH_BLOCK) return true;
    } catch {}
  }
  return false;
}

// ═══════════════════════════════════════════
// DETECCIÓN DE ATAQUES — Revelar al jugador
// ═══════════════════════════════════════════

world.afterEvents.entityHitEntity.subscribe((ev) => {
  const attacker = ev.damagingEntity;
  if (attacker.typeId !== "minecraft:player") return;

  const state = getState(attacker.name);
  state.lastAttackTick = system.currentTick;

  if (state.wasInvisible) {
    try {
      attacker.removeEffect("invisibility");
      attacker.sendMessage("§c§o¡Te han visto! Atacaste desde el arbusto.");
    } catch {}
    state.wasInvisible = false;
  }
});

world.afterEvents.entityHitBlock.subscribe((ev) => {
  const attacker = ev.damagingEntity;
  if (attacker.typeId !== "minecraft:player") return;

  const state = getState(attacker.name);
  state.lastAttackTick = system.currentTick;

  if (state.wasInvisible) {
    try { attacker.removeEffect("invisibility"); } catch {}
    state.wasInvisible = false;
  }
});

// ═══════════════════════════════════════════
// LOOP PRINCIPAL — Verificar posiciones de jugadores
// Funciona en CUALQUIER mapa, sin registro previo
// ═══════════════════════════════════════════

system.runInterval(() => {
  const currentTick = system.currentTick;

  for (const player of world.getAllPlayers()) {
    const state = getState(player.name);
    const inBush = isInBush(player);
    const ticksSinceAttack = currentTick - state.lastAttackTick;
    const canBeInvisible = ticksSinceAttack >= REVEAL_DURATION;

    if (inBush) {
      if (!state.inBush) {
        // Acaba de entrar al arbusto
        state.inBush = true;
        if (canBeInvisible) {
          try {
            player.addEffect("invisibility", 20, { amplifier: 0, showParticles: false });
          } catch {}
          state.wasInvisible = true;
          player.sendMessage("§a§o¡Estás oculto en el arbusto!");
        }
      } else {
        // Ya estaba en arbusto
        if (canBeInvisible && !state.wasInvisible) {
          try {
            player.addEffect("invisibility", 20, { amplifier: 0, showParticles: false });
          } catch {}
          state.wasInvisible = true;
          player.sendMessage("§a§o¡Oculto de nuevo en el arbusto!");
        } else if (state.wasInvisible && canBeInvisible) {
          // Refrescar invisibilidad
          try {
            player.addEffect("invisibility", 20, { amplifier: 0, showParticles: false });
          } catch {}
        }
      }
    } else {
      if (state.inBush) {
        // Acaba de salir del arbusto
        state.inBush = false;
        if (state.wasInvisible) {
          try { player.removeEffect("invisibility"); } catch {}
          state.wasInvisible = false;
          player.sendMessage("§7§oSaliste del arbusto — eres visible.");
        }
      }
    }
  }
}, CHECK_INTERVAL);
