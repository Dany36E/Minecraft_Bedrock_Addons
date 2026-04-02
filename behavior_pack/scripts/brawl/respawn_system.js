// respawn_system.js — Respawn con delay para modos 3v3
// Al morir en Brawl Ball, el jugador espera N segundos antes de reaparecer
//
import { world, system } from "@minecraft/server";
import {
  GameState, GameMode,
  getState, getMode, getArenaOrigin, getConfig,
  getLobbyPlayers, getTeams, on, applyTeamArmor,
} from "./game_manager.js";

const respawning = new Map();  // playerName -> ticksLeft

// Spawn points relativos al arena origin
const BLUE_SPAWN = { rx: 13, ry: 2, rz: 8 };   // z=8 (lado azul)
const RED_SPAWN  = { rx: 13, ry: 2, rz: 36 };   // z=36 (lado rojo)

// ═══════════════════════════════════════════
// DETECCIÓN DE MUERTE
// ═══════════════════════════════════════════

world.afterEvents.playerSpawn.subscribe((ev) => {
  if (ev.initialSpawn) return;
  if (getState() !== GameState.PLAYING) return;
  if (getMode() !== GameMode.BRAWL_BALL) return;

  const player = ev.player;
  if (!getLobbyPlayers().has(player.name)) return;

  const cfg = getConfig();
  const delayTicks = cfg.respawnDelaySec * 20;

  respawning.set(player.name, delayTicks);

  // Hacer invisible y resistente mientras espera
  try {
    player.addEffect("invisibility", delayTicks + 10, { amplifier: 0, showParticles: false });
    player.addEffect("resistance", delayTicks + 10, { amplifier: 255, showParticles: false });
    player.addEffect("blindness", delayTicks, { amplifier: 0, showParticles: false });
  } catch {}

  player.sendMessage(`§7⏳ Reapareciendo en ${cfg.respawnDelaySec} segundos...`);
});

// ═══════════════════════════════════════════
// LOOP: Countdown de respawn
// ═══════════════════════════════════════════

system.runInterval(() => {
  if (getState() !== GameState.PLAYING) return;
  if (getMode() !== GameMode.BRAWL_BALL) return;

  for (const [name, ticks] of respawning) {
    const newTicks = ticks - 1;
    respawning.set(name, newTicks);

    // Countdown visual cada segundo
    if (newTicks > 0 && newTicks % 20 === 0) {
      const sec = Math.ceil(newTicks / 20);
      const p = world.getAllPlayers().find(pl => pl.name === name);
      if (p) {
        try {
          p.onScreenDisplay.setTitle(`§e${sec}`, {
            fadeInDuration: 0, stayDuration: 15, fadeOutDuration: 5,
            subtitle: "§7Reapareciendo...",
          });
        } catch {}
      }
    }

    // ¡Respawn!
    if (newTicks <= 0) {
      respawning.delete(name);
      const p = world.getAllPlayers().find(pl => pl.name === name);
      if (p) {
        teleportToSpawn(p);
        try {
          p.removeEffect("invisibility");
          p.removeEffect("resistance");
          p.removeEffect("blindness");
          // Spawn protection (3 seg)
          p.addEffect("resistance", 60, { amplifier: 3, showParticles: false });
          // Restaurar armadura de equipo tras respawn (#11)
          applyTeamArmor(p);
          p.playSound("random.levelup");
          p.sendMessage("§a✦ ¡Has reaparecido! §7(3s protección)");
        } catch {}
      }
    }
  }
}, 1);

// ═══════════════════════════════════════════
// TELEPORT AL SPAWN DEL EQUIPO
// ═══════════════════════════════════════════

function teleportToSpawn(player) {
  const origin = getArenaOrigin();
  if (!origin) return;

  const t = getTeams();
  const isBlue = t.blue.has(player.name);
  const spawn = isBlue ? BLUE_SPAWN : RED_SPAWN;

  // Variación aleatoria en X y Z para no stackearse (#2)
  const offsetX = (Math.random() - 0.5) * 4;
  const offsetZ = (Math.random() - 0.5) * 4;

  try {
    player.teleport({
      x: origin.x + spawn.rx + offsetX,
      y: origin.y + spawn.ry,
      z: origin.z + spawn.rz + offsetZ,
    });
  } catch {}
}

// Limpiar al terminar partida
on("stateChange", ({ newState }) => {
  if (newState === GameState.FINISHED || newState === GameState.IDLE) {
    respawning.clear();
  }
});

export function isPlayerRespawning(name) { return respawning.has(name); }
