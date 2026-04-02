// box_mechanic.js — Mecánica de Cajas de Power Cubes (Brawl Stars)
// @minecraft/server 1.12.0
//
// ══════════════════════════════════════════
// MECÁNICA DE CAJAS (POWER CUBE BOXES)
// ══════════════════════════════════════════
// • Las cajas (minecraft:barrel) tienen vida (HP)
// • Al golpearlas, pierden HP y muestran partículas de daño
// • Al llegar a 0 HP, se destruyen y otorgan un Power Cube al jugador
// • Power Cubes son acumulables:
//   - Cada cubo: +10% daño (efecto strength) + ~2 corazones extra (health_boost)
//   - Los efectos duran mientras el jugador esté vivo
//   - Al morir, se pierden TODOS los cubos y efectos
// • Basado en Brawl Stars: cada caja tiene entre 4500-8500 HP
//   → En Minecraft: 8 golpes para destruir una caja
//
import { world, system } from "@minecraft/server";

// ═══════════════════════════════════════════
// REGISTRO DE CAJAS
// ═══════════════════════════════════════════
const BOX_MAX_HP = 8;           // golpes para destruir una caja
const registeredBoxes = new Map();  // "x,y,z" -> { hp, maxHp, dimension }
const playerCubes = new Map();      // playerName -> cubeCount
const CUBE_HEALTH_PER = 2;         // niveles de health_boost por cubo (×2 corazones)
const CUBE_STRENGTH_RATIO = 3;     // cada N cubos = +1 nivel de strength

/**
 * Registra una caja de Power Cube en una posición.
 * Se llama después de construir una arena.
 */
export function registerBox(dimension, pos) {
  const key = `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}`;
  registeredBoxes.set(key, {
    hp: BOX_MAX_HP,
    maxHp: BOX_MAX_HP,
    dimension: dimension.id,
  });
}

/**
 * Limpia todas las cajas registradas (al construir nueva arena).
 */
export function clearBoxes() {
  registeredBoxes.clear();
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

  // Health Boost: +2 corazones por cubo (duración larga, se reaplica)
  const healthLevel = Math.min(cubes * CUBE_HEALTH_PER - 1, 255);
  try {
    player.addEffect("health_boost", 999999, { amplifier: healthLevel, showParticles: false });
  } catch { /* efecto ya activo */ }

  // Strength: +1 nivel cada CUBE_STRENGTH_RATIO cubos
  const strengthLevel = Math.max(Math.floor(cubes / CUBE_STRENGTH_RATIO) - 1, 0);
  if (strengthLevel >= 0) {
    try {
      player.addEffect("strength", 999999, { amplifier: strengthLevel, showParticles: false });
    } catch { /* efecto ya activo */ }
  }

  // Notificar al jugador
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
  const key = `${Math.floor(blockLocation.x)},${Math.floor(blockLocation.y)},${Math.floor(blockLocation.z)}`;
  const box = registeredBoxes.get(key);
  if (!box) return false;

  box.hp--;

  // Partículas y sonido de daño
  const dim = player.dimension;
  const pos = blockLocation;
  try {
    dim.runCommand(`particle minecraft:villager_angry ${pos.x + 0.5} ${pos.y + 1} ${pos.z + 0.5}`);
    dim.runCommand(`playsound random.wood ${player.name} ${pos.x} ${pos.y} ${pos.z} 0.5 1.2`);
  } catch {}

  // Barra de vida visual
  const bars = "§a" + "█".repeat(box.hp) + "§c" + "░".repeat(box.maxHp - box.hp);
  player.sendMessage(`§7Caja: ${bars} §7(${box.hp}/${box.maxHp})`);

  if (box.hp <= 0) {
    // ¡Caja destruida! → dar Power Cube
    registeredBoxes.delete(key);

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

  return true;
}

// ═══════════════════════════════════════════
// EVENTO: Interceptar rotura de barrels registrados
// ═══════════════════════════════════════════

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
  if (registeredBoxes.size === 0) return;

  const block = ev.block;
  if (block.typeId !== "minecraft:barrel") return;

  const key = `${block.location.x},${block.location.y},${block.location.z}`;
  if (!registeredBoxes.has(key)) return;

  // Cancelar la rotura normal — usamos nuestro sistema de HP
  ev.cancel = true;

  // Golpear la caja (en el siguiente tick para evitar problemas con beforeEvents)
  const player = ev.player;
  const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
  system.run(() => hitBox(player, loc));
});

// ═══════════════════════════════════════════
// EVENTO: Perder cubos al morir
// ═══════════════════════════════════════════

world.afterEvents.entityDie.subscribe((ev) => {
  const entity = ev.deadEntity;
  if (entity.typeId !== "minecraft:player") return;

  const name = entity.name;
  const cubes = playerCubes.get(name) || 0;

  if (cubes > 0) {
    // Soltar cubos como mensaje (en BS se sueltan al suelo)
    playerCubes.delete(name);

    // Los efectos se van solos al morir y revivir, pero por seguridad:
    system.runTimeout(() => {
      try {
        const players = world.getAllPlayers();
        const p = players.find(pl => pl.name === name);
        if (p) {
          removeAllCubeEffects(p);
          p.sendMessage(`§c✦ Has perdido ${cubes} Power Cube(s) al morir.`);
        }
      } catch {}
    }, 20); // 1 segundo después del respawn
  }
});

// ═══════════════════════════════════════════
// HUD: Mostrar cubos actuales periódicamente
// ═══════════════════════════════════════════

system.runInterval(() => {
  if (registeredBoxes.size === 0 && playerCubes.size === 0) return;

  for (const player of world.getAllPlayers()) {
    const cubes = playerCubes.get(player.name);
    if (cubes && cubes > 0) {
      try {
        player.onScreenDisplay.setActionBar(`§6⚡ Power Cubes: §e${cubes}`);
      } catch {}
    }
  }
}, 40); // cada 2 segundos
