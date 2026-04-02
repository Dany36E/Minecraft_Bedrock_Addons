// box_mechanic.js — Mecánica de Cajas de Power Cubes (Brawl Stars)
// @minecraft/server 1.12.0
//
// ══════════════════════════════════════════
// MECÁNICA DE CAJAS (ENTIDADES) + POWER CUBES
// ══════════════════════════════════════════
// • La caja es una ENTIDAD (miaddon:power_box) con HP real
//   → Los jugadores la atacan con armas → al morir suelta Power Cube
//   → Sin knockback, estática, no se mueve
// • Power Cube es una ENTIDAD coleccionable (miaddon:power_cube_drop)
//   → Flota/gira en el mundo, se recoge al acercarse (1.5 bloques)
//   → Al recogerlo: +10% daño (strength) + 2 corazones (health_boost)
// • Al morir un jugador:
//   → Suelta la MITAD de sus Power Cubes como entidades coleccionables
//   → Otros jugadores pueden recogerlos
//
import { world, system } from "@minecraft/server";

// ═══════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════
const PICKUP_RADIUS = 1.5;          // bloques para recoger un cubo
const PICKUP_CHECK_INTERVAL = 4;    // cada 4 ticks
const CUBE_HEALTH_PER = 2;          // niveles de health_boost por cubo
const CUBE_STRENGTH_RATIO = 3;      // cada N cubos = +1 nivel de strength

// ═══════════════════════════════════════════
// ESTADO DEL SISTEMA
// ═══════════════════════════════════════════
let arenaActive = false;
const playerCubes = new Map();       // playerName -> cubeCount
const lastPositions = new Map();     // playerName -> { x, y, z, dimId }

/**
 * Activa el modo arena.
 */
export function activateArena() {
  arenaActive = true;
  playerCubes.clear();
  for (const player of world.getAllPlayers()) {
    removeAllCubeEffects(player);
  }
}

/**
 * Desactiva el modo arena.
 */
export function deactivateArena() {
  arenaActive = false;
  clearAllCubes();
}

/**
 * Limpia los Power Cubes de todos los jugadores.
 */
export function clearAllCubes() {
  playerCubes.clear();
  for (const player of world.getAllPlayers()) {
    removeAllCubeEffects(player);
  }
}

export function isArenaActive() { return arenaActive; }
export function getPlayerCubes(playerName) { return playerCubes.get(playerName) || 0; }

/**
 * Spawnea cajas de Power Cube (entidades) en las posiciones dadas.
 * @param {Dimension} dimension
 * @param {Array<{x:number,y:number,z:number}>} positions — coordenadas MUNDIALES
 */
export function spawnPowerBoxes(dimension, positions) {
  for (const pos of positions) {
    try {
      dimension.spawnEntity("miaddon:power_box", {
        x: pos.x + 0.5,
        y: pos.y + 0.5,
        z: pos.z + 0.5,
      });
    } catch (e) {
      // El chunk podría no estar cargado
    }
  }
}

// ═══════════════════════════════════════════
// APLICAR / REMOVER EFECTOS DE CUBOS
// ═══════════════════════════════════════════

function applyCubeEffects(player) {
  const cubes = playerCubes.get(player.name) || 0;
  if (cubes <= 0) return;

  const healthLevel = Math.min(cubes * CUBE_HEALTH_PER - 1, 255);
  try {
    player.addEffect("health_boost", 999999, { amplifier: healthLevel, showParticles: false });
  } catch {}

  const strengthLevel = Math.max(Math.floor(cubes / CUBE_STRENGTH_RATIO) - 1, 0);
  if (strengthLevel >= 0) {
    try {
      player.addEffect("strength", 999999, { amplifier: strengthLevel, showParticles: false });
    } catch {}
  }

  player.sendMessage(`§6⚡ Power Cubes: §e${cubes} §7(+${cubes * 10}% daño, +${cubes * 4} HP)`);
}

function removeAllCubeEffects(player) {
  try { player.removeEffect("health_boost"); } catch {}
  try { player.removeEffect("strength"); } catch {}
}

// ═══════════════════════════════════════════
// Otorgar cubos a un jugador
// ═══════════════════════════════════════════

function givePlayerCubes(player, amount) {
  const current = (playerCubes.get(player.name) || 0) + amount;
  playerCubes.set(player.name, current);
  applyCubeEffects(player);
}

// ═══════════════════════════════════════════
// Spawnear Power Cube drops (entidades coleccionables)
// ═══════════════════════════════════════════

function spawnCubeDrops(dimension, location, count) {
  for (let i = 0; i < count; i++) {
    try {
      // Dispersar ligeramente los cubos
      const angle = (Math.PI * 2 * i) / Math.max(count, 1);
      const spread = Math.min(count, 4) * 0.3;
      const spawnPos = {
        x: location.x + Math.cos(angle) * spread,
        y: location.y + 1,
        z: location.z + Math.sin(angle) * spread,
      };
      dimension.spawnEntity("miaddon:power_cube_drop", spawnPos);
    } catch {}
  }
}

// ═══════════════════════════════════════════
// RASTREO DE POSICIONES (para saber dónde murió)
// ═══════════════════════════════════════════

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    try {
      const loc = player.location;
      lastPositions.set(player.name, {
        x: loc.x, y: loc.y, z: loc.z,
        dimId: player.dimension.id,
      });
    } catch {}
  }
}, 2);

// ═══════════════════════════════════════════
// EVENTO: Caja (entidad) muere → suelta Power Cube
// ═══════════════════════════════════════════

world.afterEvents.entityDie.subscribe((ev) => {
  const entity = ev.deadEntity;

  // Solo cajas — muerte de jugadores ahora la maneja game_manager
  if (entity.typeId !== "miaddon:power_box") return;

  try {
    const loc = entity.location;
    const dim = entity.dimension;
    try {
      dim.runCommand(`particle minecraft:totem_particle ${loc.x} ${loc.y + 0.5} ${loc.z}`);
      dim.runCommand(`playsound random.levelup @a[r=16] ${loc.x} ${loc.y} ${loc.z} 1 1.5`);
    } catch {}
    spawnCubeDrops(dim, loc, 1);
  } catch {}
});

// ═══════════════════════════════════════════
// Muerte de jugador → soltar cubos (llamado desde game_manager)
// ═══════════════════════════════════════════

export function handlePlayerDeathDrop(name) {
  if (!arenaActive) return;

  const cubes = playerCubes.get(name) || 0;
  playerCubes.delete(name);

  if (cubes <= 0) return;

  const toDrop = Math.ceil(cubes / 2);

  // Usar la última posición rastreada
  const saved = lastPositions.get(name);
  if (!saved) return;

  const dim = world.getDimension(saved.dimId);
  const deathLoc = { x: saved.x, y: saved.y, z: saved.z };

  system.runTimeout(() => {
    try {
      spawnCubeDrops(dim, deathLoc, toDrop);
    } catch {}
  }, 5);

  system.runTimeout(() => {
    try {
      const p = world.getAllPlayers().find(pl => pl.name === name);
      if (p) {
        removeAllCubeEffects(p);
        p.sendMessage(`§c✦ Soltaste ${toDrop} Power Cube(s) al morir.`);
      }
    } catch {}
  }, 40);
}

// ═══════════════════════════════════════════
// LOOP: Recolección de Power Cubes por proximidad
// ═══════════════════════════════════════════

system.runInterval(() => {
  const players = world.getAllPlayers();
  if (players.length === 0) return;

  for (const player of players) {
    try {
      const nearby = player.dimension.getEntities({
        type: "miaddon:power_cube_drop",
        location: player.location,
        maxDistance: PICKUP_RADIUS,
      });

      for (const cube of nearby) {
        try {
          // Recoger el cubo
          cube.remove();
          givePlayerCubes(player, 1);

          // Efecto de recolección
          const loc = player.location;
          try {
            player.dimension.runCommand(
              `playsound random.orb ${player.name} ${loc.x} ${loc.y} ${loc.z} 0.8 1.4`
            );
          } catch {}
        } catch {}
      }
    } catch {}
  }
}, PICKUP_CHECK_INTERVAL);

// ═══════════════════════════════════════════
// ITEM: Colocar Power Box manualmente
// ═══════════════════════════════════════════

world.beforeEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack?.typeId !== "miaddon:power_box_spawner") return;
  ev.cancel = true;
  const player = ev.source;
  system.run(() => {
    try {
      const hit = player.getBlockFromViewDirection({ maxDistance: 7 });
      if (!hit) {
        player.sendMessage("§c✦ Apunta a un bloque para colocar la Caja de Poder.");
        return;
      }
      const face = hit.faceLocation;
      const block = hit.block;
      const norm = { x: 0, y: 0, z: 0 };
      switch (hit.face) {
        case "Up":    norm.y = 1; break;
        case "Down":  norm.y = -1; break;
        case "North": norm.z = -1; break;
        case "South": norm.z = 1; break;
        case "East":  norm.x = 1; break;
        case "West":  norm.x = -1; break;
      }
      const spawnPos = {
        x: block.x + 0.5 + norm.x,
        y: block.y + 0.5 + norm.y,
        z: block.z + 0.5 + norm.z,
      };
      player.dimension.spawnEntity("miaddon:power_box", spawnPos);
      player.dimension.runCommand(
        `playsound random.pop ${player.name} ${spawnPos.x} ${spawnPos.y} ${spawnPos.z} 0.5 1.0`
      );
    } catch (e) {
      player.sendMessage("§c✦ No se pudo colocar la caja aquí.");
    }
  });
});
