// bush_mechanic.js — Mecánica de Arbustos (Brawl Stars)
// @minecraft/server 1.12.0
//
// ══════════════════════════════════════════
// MECÁNICA DE ARBUSTOS (INVISIBILIDAD)
// ══════════════════════════════════════════
// • Cuando un jugador está dentro de un arbusto, se vuelve INVISIBLE
//   para los demás jugadores (efecto minecraft:invisibility)
// • Si el jugador ATACA (golpea entidad o bloque), se hace VISIBLE
// • Después de 2 segundos (40 ticks) sin atacar, se vuelve invisible
//   otra vez SI sigue dentro del arbusto
// • Al salir del arbusto, pierde la invisibilidad inmediatamente
//
// Implementación:
// - Registrar posiciones de arbustos al construir arena
// - runInterval cada 5 ticks: verificar posición de jugadores
// - Escuchar eventos de ataque para marcar "última vez que atacó"
// - Aplicar/remover invisibility según condiciones
//
import { world, system } from "@minecraft/server";

// ═══════════════════════════════════════════
// REGISTRO DE ARBUSTOS
// ═══════════════════════════════════════════
const registeredBushes = new Set();  // "x,y,z" strings
const REVEAL_DURATION = 40;          // 2 segundos = 40 ticks
const CHECK_INTERVAL = 5;            // verificar cada 5 ticks

// Estado por jugador
const playerBushState = new Map();   // playerName -> { inBush, lastAttackTick, wasInvisible }

/**
 * Registra una posición de arbusto.
 */
export function registerBush(pos) {
  const key = `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}`;
  registeredBushes.add(key);
}

/**
 * Limpia todos los arbustos registrados.
 */
export function clearBushes() {
  registeredBushes.clear();
  playerBushState.clear();
  // Remover invisibilidad de todos
  for (const player of world.getAllPlayers()) {
    try { player.removeEffect("invisibility"); } catch {}
  }
}

/**
 * Verifica si una posición del mundo contiene un arbusto registrado.
 * Busca la posición exacta del jugador y las adyacentes (pies y bloque en el que está).
 */
function isInBush(playerLocation) {
  const px = Math.floor(playerLocation.x);
  const py = Math.floor(playerLocation.y);
  const pz = Math.floor(playerLocation.z);

  // Verificar bloque a los pies y bloque debajo
  const positions = [
    `${px},${py},${pz}`,
    `${px},${py - 1},${pz}`,
    `${px},${py + 1},${pz}`,
  ];

  for (const key of positions) {
    if (registeredBushes.has(key)) return true;
  }
  return false;
}

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

// ═══════════════════════════════════════════
// DETECCIÓN DE ATAQUES — Revelar al jugador
// ═══════════════════════════════════════════

// Ataque a entidades
world.afterEvents.entityHitEntity.subscribe((ev) => {
  if (registeredBushes.size === 0) return;
  const attacker = ev.damagingEntity;
  if (attacker.typeId !== "minecraft:player") return;

  const state = getState(attacker.name);
  state.lastAttackTick = system.currentTick;

  // Si estaba invisible en arbusto, revelarlo
  if (state.wasInvisible) {
    try {
      attacker.removeEffect("invisibility");
      attacker.sendMessage("§c§o¡Te han visto! Atacaste desde el arbusto.");
    } catch {}
    state.wasInvisible = false;
  }
});

// Ataque a bloques (romper/golpear)
world.afterEvents.entityHitBlock.subscribe((ev) => {
  if (registeredBushes.size === 0) return;
  const attacker = ev.damagingEntity;
  if (attacker.typeId !== "minecraft:player") return;

  const state = getState(attacker.name);
  state.lastAttackTick = system.currentTick;

  if (state.wasInvisible) {
    try {
      attacker.removeEffect("invisibility");
    } catch {}
    state.wasInvisible = false;
  }
});

// ═══════════════════════════════════════════
// LOOP PRINCIPAL — Verificar posiciones de jugadores
// ═══════════════════════════════════════════

system.runInterval(() => {
  if (registeredBushes.size === 0) return;

  const currentTick = system.currentTick;

  for (const player of world.getAllPlayers()) {
    const state = getState(player.name);
    const inBush = isInBush(player.location);
    const ticksSinceAttack = currentTick - state.lastAttackTick;
    const canBeInvisible = ticksSinceAttack >= REVEAL_DURATION;

    if (inBush) {
      if (!state.inBush) {
        // Acaba de entrar al arbusto
        state.inBush = true;
        if (canBeInvisible) {
          // Hacer invisible inmediatamente (sin ataque reciente)
          try {
            player.addEffect("invisibility", 20, { amplifier: 0, showParticles: false });
          } catch {}
          state.wasInvisible = true;
          player.sendMessage("§a§o¡Estás oculto en el arbusto!");
        }
      } else {
        // Ya estaba en arbusto
        if (canBeInvisible && !state.wasInvisible) {
          // Han pasado 2 segundos sin atacar → volver a esconderse
          try {
            player.addEffect("invisibility", 20, { amplifier: 0, showParticles: false });
          } catch {}
          state.wasInvisible = true;
          player.sendMessage("§a§o¡Oculto de nuevo en el arbusto!");
        } else if (state.wasInvisible && canBeInvisible) {
          // Mantener invisibilidad (refrescar efecto)
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
