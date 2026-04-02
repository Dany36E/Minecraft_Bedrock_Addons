// poison_gas.js — Gas venenoso de Supervivencia (Showdown)
// Cierra el mapa progresivamente, haciendo daño fuera de la zona segura
//
import { world, system } from "@minecraft/server";
import {
  GameState, GameMode,
  getState, getMode, getArenaOrigin, getArenaSize,
  getConfig, getMatchTicksElapsed, getLobbyPlayers, on,
} from "./game_manager.js";

let gasPhase = 0;
let gasActive = false;
let safeCenterX = 0;
let safeCenterZ = 0;
let safeRadiusMax = 0;
let currentSafeRadius = 0;

// Reset al empezar partida
on("stateChange", ({ newState }) => {
  if (newState === GameState.PLAYING && getMode() === GameMode.SHOWDOWN) {
    const origin = getArenaOrigin();
    const size = getArenaSize();
    safeCenterX = origin.x + Math.floor(size.w / 2);
    safeCenterZ = origin.z + Math.floor(size.l / 2);
    safeRadiusMax = Math.floor(Math.min(size.w, size.l) / 2);
    currentSafeRadius = safeRadiusMax;
    gasPhase = 0;
    gasActive = true;
  }
  if (newState === GameState.FINISHED || newState === GameState.IDLE) {
    gasActive = false;
    gasPhase = 0;
  }
});

// ═══════════════════════════════════════════
// LOOP: Verificar fases del gas + daño
// ═══════════════════════════════════════════

system.runInterval(() => {
  if (!gasActive) return;
  if (getState() !== GameState.PLAYING) return;
  if (getMode() !== GameMode.SHOWDOWN) return;

  const elapsed = getMatchTicksElapsed();
  const cfg = getConfig();

  // ¿Ya pasó el delay inicial?
  if (elapsed < cfg.gasStartDelay) return;

  // Calcular fase actual del gas
  const ticksSinceGasStart = elapsed - cfg.gasStartDelay;
  const newPhase = Math.floor(ticksSinceGasStart / cfg.gasShrinkInterval) + 1;

  if (newPhase > gasPhase) {
    gasPhase = newPhase;
    // Reducir radio seguro (mínimo 3 bloques)
    currentSafeRadius = Math.max(3, safeRadiusMax - gasPhase * 3);

    // Avisar a los jugadores
    for (const name of getLobbyPlayers()) {
      const p = world.getAllPlayers().find(pl => pl.name === name);
      if (p) {
        try {
          p.sendMessage(`§5☠ ¡El gas se cierra! §7Zona segura: §e${currentSafeRadius} bloques`);
          p.playSound("mob.wither.break_block");
        } catch {}
      }
    }
  }

  // Daño a jugadores fuera de la zona segura (cada 20 ticks = 1 segundo)
  if (elapsed % 20 !== 0) return;

  for (const name of getLobbyPlayers()) {
    const p = world.getAllPlayers().find(pl => pl.name === name);
    if (!p) continue;

    try {
      const loc = p.location;
      const dx = loc.x - safeCenterX;
      const dz = loc.z - safeCenterZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > currentSafeRadius) {
        // Daño que escala con la distancia fuera de la zona
        const damageBase = 2 + gasPhase;  // 2-N corazones por segundo
        p.applyDamage(damageBase, { cause: "magic" });

        // Partículas de veneno
        try {
          p.dimension.runCommand(
            `particle minecraft:dragon_breath_trail ${loc.x} ${loc.y + 1} ${loc.z}`
          );
        } catch {}
      }
    } catch {}
  }
}, 1);

// ═══════════════════════════════════════════
// PARTÍCULAS EN EL BORDE (cada 40 ticks)
// ═══════════════════════════════════════════

system.runInterval(() => {
  if (!gasActive || getState() !== GameState.PLAYING) return;
  if (getMode() !== GameMode.SHOWDOWN) return;
  if (currentSafeRadius >= safeRadiusMax) return;

  const origin = getArenaOrigin();
  if (!origin) return;

  try {
    const dim = world.getDimension("overworld");
    const y = origin.y + 2;

    // Dibujar círculo de partículas en el borde
    const numParticles = Math.min(32, Math.floor(currentSafeRadius * 4));
    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles;
      const px = safeCenterX + Math.cos(angle) * currentSafeRadius;
      const pz = safeCenterZ + Math.sin(angle) * currentSafeRadius;
      try {
        dim.runCommand(`particle minecraft:dragon_breath_trail ${px} ${y} ${pz}`);
      } catch {}
    }
  } catch {}
}, 40);

export function getGasPhase() { return gasPhase; }
export function getSafeRadius() { return currentSafeRadius; }
