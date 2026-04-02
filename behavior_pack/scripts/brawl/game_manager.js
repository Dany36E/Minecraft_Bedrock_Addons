// game_manager.js — Sistema central de partidas Brawl Stars
// Estado, jugadores, equipos, timer, ciclo de vida completo
//
import { world, system } from "@minecraft/server";
import { getPlayerCubes } from "./box_mechanic.js";

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

// Jugadores
const lobbyPlayers = new Set();            // Nombres en el lobby
const alivePlayers = new Set();            // Vivos en la partida
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

  countdownTicksLeft = config.countdownSeconds * 20;

  // Inicializar jugadores vivos
  alivePlayers.clear();
  for (const name of lobbyPlayers) {
    alivePlayers.add(name);
  }

  setState(GameState.COUNTDOWN);
  return true;
}

/**
 * Inicia la partida (llamado internamente al terminar countdown).
 */
function startMatch() {
  matchTicksElapsed = 0;
  setState(GameState.PLAYING);
}

/**
 * Reportar muerte de un jugador.
 */
export function reportDeath(playerName, killerName) {
  if (state !== GameState.PLAYING) return;
  emit("playerDeath", { name: playerName, killerName });

  if (mode === GameMode.SHOWDOWN) {
    alivePlayers.delete(playerName);
    // Verificar si queda un solo jugador
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
    // El goal_system manejará el reset de ronda
  }
}

/**
 * Terminar la partida.
 */
export function endMatch(winner) {
  if (state === GameState.IDLE) return;
  emit("matchEnd", { winner, mode });
  setState(GameState.FINISHED);

  // Auto-reset después de 10 segundos
  system.runTimeout(() => { resetMatch(); }, 200);
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
            } else if (mode === GameMode.SHOWDOWN) {
              const cubes = getPlayerCubes(name);
              hudText += `  §6⚡${cubes}`;
              hudText += `  §7Vivos: §e${alivePlayers.size}`;
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

  const killerName = ev.damageSource?.damagingEntity?.name || null;
  reportDeath(entity.name, killerName);
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
            subtitle: "§eÚltimo en pie",
          });
          p.playSound("random.totem");
        } else {
          const pos = [...lobbyPlayers].indexOf(name) + 1;
          p.onScreenDisplay.setTitle("§c☠ Eliminado", {
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
