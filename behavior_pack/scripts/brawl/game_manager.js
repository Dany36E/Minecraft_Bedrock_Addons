// game_manager.js — Sistema central de partidas Brawl Stars
// Estado, jugadores, equipos, timer, ciclo de vida completo
//
import { world, system } from "@minecraft/server";
import { getPlayerCubes, handlePlayerDeathDrop } from "./box_mechanic.js";

// ═══════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════
export const GameState = {
  IDLE: 0,
  LOBBY: 1,
  COUNTDOWN: 2,
  PLAYING: 3,
  FINISHED: 4,
};

export const GameMode = {
  SHOWDOWN: "showdown",
  BRAWL_BALL: "brawl_ball",
};

// ═══════════════════════════════════════════
// ESTADO DE LA PARTIDA
// ═══════════════════════════════════════════
let state = GameState.IDLE;
let mode = null;
let arenaOrigin = null;    // {x, y, z}
let arenaDim = null;       // Dimension object
let arenaSize = null;      // {w, h, l}
let arenaId = null;        // "showdown_arena" | "brawl_ball_arena"
let masterName = null;     // Nombre del jugador que creó la partida
let spawnPositions = null; // Posiciones de spawn del arena

// Jugadores
const lobbyPlayers = new Set();            // Nombres en el lobby
const alivePlayers = new Set();            // Vivos en la partida
const deadPlayers = new Set();             // Muertos (espectadores) en Showdown
const deathOrder = [];                      // Orden de muertes para placement
const processedDeaths = new Set();         // Control anti-doble procesamiento
const teams = { blue: new Set(), red: new Set() };
const scores = { blue: 0, red: 0 };
let currentRound = 1;

// Timer
let matchTicksElapsed = 0;
let matchDurationTicks = 0;
let countdownTicksLeft = 0;

// Callbacks
const listeners = new Map();  // event -> [callbacks]

// ═══════════════════════════════════════════
// CONFIG (modificable vía UI)
// ═══════════════════════════════════════════
const config = {
  showdownDuration: 6000,     // 5 min
  brawlBallDuration: 4800,    // 4 min
  countdownSeconds: 5,
  brawlBallRounds: 3,         // Best of 3
  respawnDelaySec: 5,
  gasStartDelay: 600,         // 30s antes de que empiece el gas
  gasShrinkInterval: 400,     // 20s entre fases de gas
};

export function getConfig() { return config; }
export function setConfig(key, value) { if (key in config) config[key] = value; }

// ═══════════════════════════════════════════
// GETTERS
// ═══════════════════════════════════════════
export function getState() { return state; }
export function getMode() { return mode; }
export function getArenaOrigin() { return arenaOrigin; }
export function getArenaDim() { return arenaDim; }
export function getArenaSize() { return arenaSize; }
export function getArenaId() { return arenaId; }
export function getMasterName() { return masterName; }
export function getLobbyPlayers() { return lobbyPlayers; }
export function getAlivePlayers() { return alivePlayers; }
export function getTeams() { return teams; }
export function getScores() { return scores; }
export function getCurrentRound() { return currentRound; }
export function getMatchTicksElapsed() { return matchTicksElapsed; }
export function getMatchDurationTicks() { return matchDurationTicks; }
export function getCountdownTicksLeft() { return countdownTicksLeft; }
export function getDeadPlayers() { return deadPlayers; }
export function setSpawnPositions(positions) { spawnPositions = positions; }

export function getTimeRemainingSeconds() {
  const remaining = matchDurationTicks - matchTicksElapsed;
  return Math.max(0, Math.ceil(remaining / 20));
}

export function getTimeRemainingFormatted() {
  const s = getTimeRemainingSeconds();
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ═══════════════════════════════════════════
// EVENTOS INTERNOS
// ═══════════════════════════════════════════
function emit(event, data) {
  const cbs = listeners.get(event);
  if (cbs) for (const cb of cbs) { try { cb(data); } catch {} }
}

export function on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(callback);
}

// Eventos:
// "stateChange"    → { oldState, newState }
// "playerJoin"     → { name }
// "playerLeave"    → { name }
// "playerDeath"    → { name, killerName }
// "roundEnd"       → { round, blueScore, redScore }
// "matchEnd"       → { winner, mode }
// "countdownTick"  → { secondsLeft }
// "gasPhase"       → { phase }

// ═══════════════════════════════════════════
// CICLO DE VIDA
// ═══════════════════════════════════════════

/**
 * Crea una partida nueva. 
 * @param {object} opts - { mode, arenaId, origin:{x,y,z}, dimension, size:{w,h,l}, master:string }
 */
export function createMatch(opts) {
  if (state !== GameState.IDLE) return false;
  mode = opts.mode;
  arenaId = opts.arenaId;
  arenaOrigin = opts.origin;
  arenaDim = opts.dimension;
  arenaSize = opts.size;
  masterName = opts.master;

  lobbyPlayers.clear();
  alivePlayers.clear();
  teams.blue.clear();
  teams.red.clear();
  scores.blue = 0;
  scores.red = 0;
  currentRound = 1;
  matchTicksElapsed = 0;

  matchDurationTicks = mode === GameMode.SHOWDOWN
    ? config.showdownDuration
    : config.brawlBallDuration;

  setState(GameState.LOBBY);
  return true;
}

export function joinLobby(playerName) {
  if (state !== GameState.LOBBY) return false;
  lobbyPlayers.add(playerName);
  emit("playerJoin", { name: playerName });
  return true;
}

export function leaveLobby(playerName) {
  lobbyPlayers.delete(playerName);
  teams.blue.delete(playerName);
  teams.red.delete(playerName);
  emit("playerLeave", { name: playerName });
}

export function joinTeam(playerName, team) {
  if (team !== "blue" && team !== "red") return false;
  teams.blue.delete(playerName);
  teams.red.delete(playerName);
  teams[team].add(playerName);
  return true;
}

/**
 * Inicia la cuenta regresiva.
 */
export function startCountdown() {
  if (state !== GameState.LOBBY) return false;
  if (lobbyPlayers.size < 2) return false;

  // Auto-assign: en Brawl Ball, asignar jugadores sin equipo
  if (mode === GameMode.BRAWL_BALL) {
    for (const name of lobbyPlayers) {
      if (!teams.blue.has(name) && !teams.red.has(name)) {
        if (teams.blue.size <= teams.red.size) {
          teams.blue.add(name);
        } else {
          teams.red.add(name);
        }
      }
    }
  }

  countdownTicksLeft = config.countdownSeconds * 20;

  // Inicializar jugadores vivos
  alivePlayers.clear();
  deadPlayers.clear();
  deathOrder.length = 0;
  processedDeaths.clear();
  for (const name of lobbyPlayers) {
    alivePlayers.add(name);
  }

  setState(GameState.COUNTDOWN);

  // Teleportar a spawns y congelar durante countdown
  teleportPlayersToSpawns();
  for (const name of lobbyPlayers) {
    const p = world.getAllPlayers().find(pl => pl.name === name);
    if (!p) continue;
    try {
      const dur = config.countdownSeconds * 20 + 20;
      p.addEffect("slowness", dur, { amplifier: 255, showParticles: false });
      p.addEffect("mining_fatigue", dur, { amplifier: 255, showParticles: false });
      p.addEffect("resistance", dur, { amplifier: 255, showParticles: false });
      p.addEffect("weakness", dur, { amplifier: 255, showParticles: false });
    } catch {}
  }

  return true;
}

/**
 * Inicia la partida (llamado internamente al terminar countdown).
 */
function startMatch() {
  matchTicksElapsed = 0;

  // Descongelar + setup de todos los jugadores
  for (const name of lobbyPlayers) {
    const p = world.getAllPlayers().find(pl => pl.name === name);
    if (!p) continue;
    try {
      p.removeEffect("slowness");
      p.removeEffect("mining_fatigue");
      p.removeEffect("resistance");
      p.removeEffect("weakness");
    } catch {}
    setupPlayer(p);
  }

  setState(GameState.PLAYING);
}

function setupPlayer(player) {
  try { player.runCommand("clear @s"); } catch {}
  try { player.runCommand("effect @s clear"); } catch {}
  try {
    player.addEffect("instant_health", 1, { amplifier: 20, showParticles: false });
    player.addEffect("saturation", 200, { amplifier: 20, showParticles: false });
  } catch {}
  // Spawn protection (3 segundos)
  try {
    player.addEffect("resistance", 60, { amplifier: 3, showParticles: false });
  } catch {}
  // Equipamiento básico
  try { player.runCommand("give @s stone_sword 1"); } catch {}
  // Devolver Brawl Master al jugador (se pierde con clear)
  try { player.runCommand("give @s miaddon:brawl_master 1"); } catch {}
}

function teleportPlayersToSpawns() {
  const origin = arenaOrigin;
  if (!origin || !spawnPositions) return;

  if (mode === GameMode.SHOWDOWN) {
    // Shuffle posiciones para que sean aleatorias
    const positions = Array.isArray(spawnPositions) ? [...spawnPositions] : [];
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    let idx = 0;
    for (const name of lobbyPlayers) {
      const p = world.getAllPlayers().find(pl => pl.name === name);
      if (!p || idx >= positions.length) continue;
      const [rx, ry, rz] = positions[idx];
      try {
        p.teleport({
          x: origin.x + rx + 0.5,
          y: origin.y + ry,
          z: origin.z + rz + 0.5,
        });
      } catch {}
      idx++;
    }
  } else if (mode === GameMode.BRAWL_BALL) {
    teleportTeamsToSpawns();
  }
}

function teleportTeamsToSpawns() {
  const origin = arenaOrigin;
  if (!origin || !spawnPositions || !spawnPositions.blue) return;

  const blueSpawns = spawnPositions.blue;
  const redSpawns = spawnPositions.red;

  let idxB = 0;
  for (const name of teams.blue) {
    const p = world.getAllPlayers().find(pl => pl.name === name);
    if (!p) continue;
    const sp = blueSpawns[idxB % blueSpawns.length];
    try {
      p.teleport({
        x: origin.x + sp[0] + 0.5,
        y: origin.y + sp[1],
        z: origin.z + sp[2] + 0.5,
      });
    } catch {}
    idxB++;
  }

  let idxR = 0;
  for (const name of teams.red) {
    const p = world.getAllPlayers().find(pl => pl.name === name);
    if (!p) continue;
    const sp = redSpawns[idxR % redSpawns.length];
    try {
      p.teleport({
        x: origin.x + sp[0] + 0.5,
        y: origin.y + sp[1],
        z: origin.z + sp[2] + 0.5,
      });
    } catch {}
    idxR++;
  }
}

/**
 * Reportar muerte de un jugador.
 */
export function reportDeath(playerName, killerName) {
  if (state !== GameState.PLAYING) return;
  emit("playerDeath", { name: playerName, killerName });

  if (mode === GameMode.SHOWDOWN) {
    alivePlayers.delete(playerName);
    deadPlayers.add(playerName);
    deathOrder.push(playerName);

    // Placement: el primero en morir = último lugar
    const placement = lobbyPlayers.size - (deathOrder.length - 1);
    const total = lobbyPlayers.size;
    const p = world.getAllPlayers().find(pl => pl.name === playerName);
    if (p) {
      try {
        p.onScreenDisplay.setTitle(`§c☠ Eliminado`, {
          fadeInDuration: 0, stayDuration: 40, fadeOutDuration: 15,
          subtitle: `§7Quedaste §e#${placement} §7de §e${total}`,
        });
      } catch {}
    }

    // Kill feed + sonido de muerte para todos (#12, #13)
    for (const name of lobbyPlayers) {
      if (name === playerName) continue;
      const o = world.getAllPlayers().find(pl => pl.name === name);
      if (!o) continue;
      try {
        if (killerName) {
          o.sendMessage(`§c☠ §e${killerName} §7eliminó a §e${playerName} §8[#${placement}]`);
        } else {
          o.sendMessage(`§c☠ §e${playerName} §7fue eliminado §8[#${placement}]`);
        }
        o.playSound("mob.wither.death");
      } catch {}
    }

    if (alivePlayers.size <= 1) {
      const winner = alivePlayers.size === 1
        ? [...alivePlayers][0]
        : null;
      endMatch(winner);
    }
  }
  // Brawl Ball deaths son manejados por respawn_system
}

/**
 * Reportar gol en Brawl Ball.
 */
export function reportGoal(scoringTeam) {
  if (state !== GameState.PLAYING || mode !== GameMode.BRAWL_BALL) return;

  scores[scoringTeam]++;
  const needed = Math.ceil(config.brawlBallRounds / 2);

  emit("roundEnd", {
    round: currentRound,
    blueScore: scores.blue,
    redScore: scores.red,
  });

  if (scores[scoringTeam] >= needed) {
    endMatch(scoringTeam);
  } else {
    currentRound++;
    // Teleportar jugadores a spawns durante la pausa de ronda
    system.runTimeout(() => {
      teleportTeamsToSpawns();
      for (const name of lobbyPlayers) {
        const p = world.getAllPlayers().find(pl => pl.name === name);
        if (p) {
          try { p.addEffect("resistance", 60, { amplifier: 3, showParticles: false }); } catch {}
        }
      }
    }, 40);
  }
}

/**
 * Terminar la partida.
 */
export function endMatch(winner) {
  if (state === GameState.IDLE) return;

  // Limpiar efectos de todos los jugadores
  for (const name of lobbyPlayers) {
    const p = world.getAllPlayers().find(pl => pl.name === name);
    if (p) {
      try { p.runCommand("effect @s clear"); } catch {}
    }
  }

  emit("matchEnd", { winner, mode });
  setState(GameState.FINISHED);

  // Auto-reset después de 10 segundos
  system.runTimeout(() => { resetMatch(); }, 200);
}

/**
 * Un jugador abandona la partida.
 */
export function leaveMatch(playerName) {
  if (state === GameState.IDLE) return false;

  lobbyPlayers.delete(playerName);
  alivePlayers.delete(playerName);
  teams.blue.delete(playerName);
  teams.red.delete(playerName);
  deadPlayers.delete(playerName);

  const p = world.getAllPlayers().find(pl => pl.name === playerName);
  if (p) {
    try { p.runCommand("effect @s clear"); } catch {}
    try { p.sendMessage("§c✦ Has abandonado la partida."); } catch {}
  }

  emit("playerLeave", { name: playerName });

  // Verificar si la partida debe terminar
  if (state === GameState.PLAYING) {
    if (mode === GameMode.SHOWDOWN && alivePlayers.size <= 1) {
      const winner = alivePlayers.size === 1 ? [...alivePlayers][0] : null;
      endMatch(winner);
    } else if (mode === GameMode.BRAWL_BALL) {
      if (teams.blue.size === 0 || teams.red.size === 0) {
        const winner = teams.blue.size > 0 ? "blue" : teams.red.size > 0 ? "red" : null;
        endMatch(winner);
      }
    }
  }

  return true;
}

/**
 * Reset completo.
 */
export function resetMatch() {
  lobbyPlayers.clear();
  alivePlayers.clear();
  teams.blue.clear();
  teams.red.clear();
  scores.blue = 0;
  scores.red = 0;
  currentRound = 1;
  matchTicksElapsed = 0;
  countdownTicksLeft = 0;
  mode = null;
  arenaId = null;
  arenaOrigin = null;
  arenaDim = null;
  arenaSize = null;
  masterName = null;
  spawnPositions = null;
  deadPlayers.clear();
  deathOrder.length = 0;
  processedDeaths.clear();
  setState(GameState.IDLE);
}

/**
 * Forzar final (master cancela).
 */
export function forceEnd() {
  endMatch(null);
}

function setState(newState) {
  const old = state;
  state = newState;
  emit("stateChange", { oldState: old, newState: state });
}

// ═══════════════════════════════════════════
// TICK LOOP — contador, countdown, timer
// ═══════════════════════════════════════════

system.runInterval(() => {
  if (state === GameState.COUNTDOWN) {
    countdownTicksLeft--;
    const sec = Math.ceil(countdownTicksLeft / 20);
    if (countdownTicksLeft % 20 === 0 && sec > 0) {
      emit("countdownTick", { secondsLeft: sec });
      // Mostrar a todos los jugadores del lobby
      for (const name of lobbyPlayers) {
        const p = world.getAllPlayers().find(pl => pl.name === name);
        if (p) {
          try {
            const color = sec <= 3 ? "§c" : "§e";
            p.onScreenDisplay.setTitle(`${color}${sec}`, {
              fadeInDuration: 0, stayDuration: 20, fadeOutDuration: 5,
              subtitle: "§7Preparándose...",
            });
            p.playSound("note.hat");
          } catch {}
        }
      }
    }
    if (countdownTicksLeft <= 0) {
      // GO!
      for (const name of lobbyPlayers) {
        const p = world.getAllPlayers().find(pl => pl.name === name);
        if (p) {
          try {
            p.onScreenDisplay.setTitle("§a¡GO!", {
              fadeInDuration: 0, stayDuration: 20, fadeOutDuration: 10,
            });
            p.playSound("random.levelup");
          } catch {}
        }
      }
      startMatch();
    }
  }

  if (state === GameState.PLAYING) {
    matchTicksElapsed++;

    // HUD timer cada 20 ticks
    if (matchTicksElapsed % 20 === 0) {
      const timeStr = getTimeRemainingFormatted();
      for (const name of lobbyPlayers) {
        const p = world.getAllPlayers().find(pl => pl.name === name);
        if (p) {
          try {
            let hudText = `§f⏱ ${timeStr}`;
            if (mode === GameMode.BRAWL_BALL) {
              hudText += `  §9${scores.blue} §f- §c${scores.red}`;
              hudText += `  §7R${currentRound}/${config.brawlBallRounds}`;
            } else if (mode === GameMode.SHOWDOWN) {
              if (deadPlayers.has(name)) {
                // HUD para espectadores
                hudText = `§7☠ Espectando  §f⏱ ${timeStr}  §7Vivos: §e${alivePlayers.size}`;
              } else {
                const cubes = getPlayerCubes(name);
                hudText += `  §6⚡${cubes}`;
                hudText += `  §7Vivos: §e${alivePlayers.size}`;
                if (matchTicksElapsed < config.gasStartDelay) {
                  const gasIn = Math.ceil((config.gasStartDelay - matchTicksElapsed) / 20);
                  hudText += `  §5Gas: ${gasIn}s`;
                }
              }
            }
            p.onScreenDisplay.setActionBar(hudText);
          } catch {}
        }
      }
    }

    // Timeout de partida
    if (matchTicksElapsed >= matchDurationTicks) {
      if (mode === GameMode.SHOWDOWN) {
        // El que quede vivo gana, o empate
        const winner = alivePlayers.size === 1 ? [...alivePlayers][0] : null;
        endMatch(winner);
      } else if (mode === GameMode.BRAWL_BALL) {
        // Gana quien tenga más puntos, o empate
        const winner = scores.blue > scores.red ? "blue"
          : scores.red > scores.blue ? "red" : null;
        endMatch(winner);
      }
    }
  }
}, 1);

// ═══════════════════════════════════════════
// DETECCIÓN DE MUERTE DE JUGADORES
// ═══════════════════════════════════════════

world.afterEvents.entityDie.subscribe((ev) => {
  if (state !== GameState.PLAYING) return;
  const entity = ev.deadEntity;
  if (entity.typeId !== "minecraft:player") return;
  if (!lobbyPlayers.has(entity.name)) return;

  processedDeaths.add(entity.name);
  const killerName = ev.damageSource?.damagingEntity?.name || null;

  // Manejar drops de cubos (unificado desde box_mechanic)
  handlePlayerDeathDrop(entity.name);
  reportDeath(entity.name, killerName);
});

// ═════════════════════════════════════════════
// RESPAWN — Spectator en Showdown + Backup de muerte
// ═════════════════════════════════════════════

world.afterEvents.playerSpawn.subscribe((ev) => {
  if (ev.initialSpawn) return;
  if (state !== GameState.PLAYING) return;
  const player = ev.player;
  if (!lobbyPlayers.has(player.name)) return;

  // Brawl Ball respawns son manejados por respawn_system, no interferir
  if (mode === GameMode.BRAWL_BALL) {
    // Solo backup de muerte si no se procesó
    if (!processedDeaths.has(player.name)) {
      handlePlayerDeathDrop(player.name);
      reportDeath(player.name, null);
    }
    processedDeaths.delete(player.name);
    return;
  }

  // Showdown: backup de muerte + spectator mode
  if (!processedDeaths.has(player.name)) {
    handlePlayerDeathDrop(player.name);
    reportDeath(player.name, null);
  }
  processedDeaths.delete(player.name);

  if (mode === GameMode.SHOWDOWN && deadPlayers.has(player.name)) {
    system.runTimeout(() => {
      try {
        player.addEffect("invisibility", 999999, { amplifier: 0, showParticles: false });
        player.addEffect("resistance", 999999, { amplifier: 255, showParticles: false });
        player.addEffect("weakness", 999999, { amplifier: 255, showParticles: false });
        player.addEffect("saturation", 999999, { amplifier: 255, showParticles: false });
        if (arenaOrigin && arenaSize) {
          player.teleport({
            x: arenaOrigin.x + arenaSize.w / 2,
            y: arenaOrigin.y + arenaSize.h + 8,
            z: arenaOrigin.z + arenaSize.l / 2,
          });
        }
        player.sendMessage("§7☠ Estás espectando. Usa el §eBrawl Master §7para salir.");
      } catch {}
    }, 5);
  }
});

// ═══════════════════════════════════════════
// MATCH END — Efectos visuales
// ═══════════════════════════════════════════

on("matchEnd", ({ winner, mode: m }) => {
  for (const name of lobbyPlayers) {
    const p = world.getAllPlayers().find(pl => pl.name === name);
    if (!p) continue;
    try {
      if (m === GameMode.SHOWDOWN) {
        if (winner === name) {
          p.onScreenDisplay.setTitle("§6★ ¡VICTORIA! ★", {
            fadeInDuration: 5, stayDuration: 60, fadeOutDuration: 20,
            subtitle: `§e#1 de ${lobbyPlayers.size} — Último en pie`,
          });
          p.playSound("random.totem");
        } else {
          const idx = deathOrder.indexOf(name);
          const placement = idx >= 0 ? lobbyPlayers.size - idx : "?";
          p.onScreenDisplay.setTitle(`§e#${placement} de ${lobbyPlayers.size}`, {
            fadeInDuration: 5, stayDuration: 60, fadeOutDuration: 20,
            subtitle: winner ? `§7Ganador: §e${winner}` : "§7Empate",
          });
        }
      } else if (m === GameMode.BRAWL_BALL) {
        const playerTeam = teams.blue.has(name) ? "blue" : teams.red.has(name) ? "red" : null;
        const wonTeam = winner === playerTeam;
        if (wonTeam) {
          p.onScreenDisplay.setTitle("§6★ ¡VICTORIA! ★", {
            fadeInDuration: 5, stayDuration: 60, fadeOutDuration: 20,
            subtitle: `§e${scores.blue} - ${scores.red}`,
          });
          p.playSound("random.totem");
        } else {
          p.onScreenDisplay.setTitle("§c✦ Derrota", {
            fadeInDuration: 5, stayDuration: 60, fadeOutDuration: 20,
            subtitle: `§e${scores.blue} - ${scores.red}`,
          });
        }
      }
    } catch {}
  }
});
