// box_mechanic.js — Mecánica de Cajas de Power Cubes (Brawl Stars)
// @minecraft/server 1.12.0
//
// ══════════════════════════════════════════
// MECÁNICA DE CAJAS (POWER CUBE BOXES)
// ══════════════════════════════════════════
// • Cuando el modo arena está activo, TODOS los barrels se convierten en cajas con HP
// • Al golpearlas, pierden HP y muestran partículas de daño
// • Al llegar a 0 HP, se destruyen y otorgan un Power Cube al jugador
// • Power Cubes son acumulables:
//   - Cada cubo: +10% daño (efecto strength) + ~2 corazones extra (health_boost)
//   - Los efectos duran mientras el jugador esté vivo
//   - Al morir, se pierden TODOS los cubos y efectos
// • En Minecraft: 8 golpes para destruir una caja
//
import { world, system } from "@minecraft/server";

// ═══════════════════════════════════════════
// ESTADO DEL SISTEMA
// ═══════════════════════════════════════════
const BOX_MAX_HP = 8;               // golpes para destruir una caja
let arenaActive = false;             // modo arena activo
const boxHPMap = new Map();          // "x,y,z" -> hp (auto-registrado al primer golpe)
const playerCubes = new Map();       // playerName -> cubeCount
const CUBE_HEALTH_PER = 2;          // niveles de health_boost por cubo
const CUBE_STRENGTH_RATIO = 3;      // cada N cubos = +1 nivel de strength

/**
 * Activa el modo arena — todos los barrels tendrán HP.
 */
export function activateArena() {
  arenaActive = true;
  boxHPMap.clear();
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
  boxHPMap.clear();
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

/**
 * Obtiene si el modo arena está activo.
 */
export function isArenaActive() {
  return arenaActive;
}

/**
 * Obtiene el conteo de cubos de un jugador.
 */
export function getPlayerCubes(playerName) {
  return playerCubes.get(playerName) || 0;
}

// ═══════════════════════════════════════════
// APLICAR / REMOVER EFECTOS DE CUBOS
// ═══════════════════════════════════════════

function applyCubeEffects(player) {
  const cubes = playerCubes.get(player.name) || 0;
  if (cubes <= 0) return;

  // Health Boost: +2 corazones por cubo
  const healthLevel = Math.min(cubes * CUBE_HEALTH_PER - 1, 255);
  try {
    player.addEffect("health_boost", 999999, { amplifier: healthLevel, showParticles: false });
  } catch {}

  // Strength: +1 nivel cada CUBE_STRENGTH_RATIO cubos
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
// GOLPEAR UNA CAJA
// ═══════════════════════════════════════════

function hitBox(player, blockLocation) {
  const key = `${blockLocation.x},${blockLocation.y},${blockLocation.z}`;

  // Auto-registrar la caja al primer golpe
  if (!boxHPMap.has(key)) {
    boxHPMap.set(key, BOX_MAX_HP);
  }

  let hp = boxHPMap.get(key) - 1;
  boxHPMap.set(key, hp);

  // Partículas y sonido de daño
  const dim = player.dimension;
  const pos = blockLocation;
  try {
    dim.runCommand(`particle minecraft:villager_angry ${pos.x + 0.5} ${pos.y + 1} ${pos.z + 0.5}`);
    dim.runCommand(`playsound hit.wood ${player.name} ${pos.x} ${pos.y} ${pos.z} 0.5 1.2`);
  } catch {}

  // Barra de vida visual
  const bars = "§a" + "█".repeat(Math.max(hp, 0)) + "§c" + "░".repeat(BOX_MAX_HP - Math.max(hp, 0));
  player.sendMessage(`§7Caja: ${bars} §7(${Math.max(hp, 0)}/${BOX_MAX_HP})`);

  if (hp <= 0) {
    // ¡Caja destruida! → dar Power Cube
    boxHPMap.delete(key);

    // Remover el barrel
    try {
      const block = dim.getBlock(blockLocation);
      if (block) block.setType("minecraft:air");
    } catch {}

    // Efecto de destrucción
    try {
      dim.runCommand(`particle minecraft:totem_particle ${pos.x + 0.5} ${pos.y + 1} ${pos.z + 0.5}`);
      dim.runCommand(`playsound random.levelup ${player.name} ${pos.x} ${pos.y} ${pos.z} 1 1.5`);
    } catch {}

    // Otorgar Power Cube
    const currentCubes = (playerCubes.get(player.name) || 0) + 1;
    playerCubes.set(player.name, currentCubes);
    applyCubeEffects(player);
  }
}

// ═══════════════════════════════════════════
// EVENTO: Interceptar rotura de barrels cuando arena activa
// ═══════════════════════════════════════════

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
  if (!arenaActive) return;

  const block = ev.block;
  if (block.typeId !== "minecraft:barrel") return;

  // Cancelar la rotura normal — usamos nuestro sistema de HP
  ev.cancel = true;

  // Golpear la caja (en el siguiente tick para evitar problemas con beforeEvents)
  const playerName = ev.player.name;
  const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
  system.run(() => {
    const player = world.getAllPlayers().find(p => p.name === playerName);
    if (player) hitBox(player, loc);
  });
});

// ═══════════════════════════════════════════
// EVENTO: Perder cubos al morir
// ═══════════════════════════════════════════

world.afterEvents.entityDie.subscribe((ev) => {
  if (!arenaActive) return;
  const entity = ev.deadEntity;
  if (entity.typeId !== "minecraft:player") return;

  const name = entity.name;
  const cubes = playerCubes.get(name) || 0;

  if (cubes > 0) {
    playerCubes.delete(name);

    system.runTimeout(() => {
      try {
        const p = world.getAllPlayers().find(pl => pl.name === name);
        if (p) {
          removeAllCubeEffects(p);
          p.sendMessage(`§c✦ Has perdido ${cubes} Power Cube(s) al morir.`);
        }
      } catch {}
    }, 20);
  }
});

// ═══════════════════════════════════════════
// HUD: Mostrar cubos actuales periódicamente
// ═══════════════════════════════════════════

system.runInterval(() => {
  if (!arenaActive) return;

  for (const player of world.getAllPlayers()) {
    const cubes = playerCubes.get(player.name);
    if (cubes && cubes > 0) {
      try {
        player.onScreenDisplay.setActionBar(`§6⚡ Power Cubes: §e${cubes}`);
      } catch {}
    }
  }
}, 40);
