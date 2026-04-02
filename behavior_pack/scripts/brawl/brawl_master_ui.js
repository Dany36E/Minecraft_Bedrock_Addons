// brawl_master_ui.js — Item Brawl Master + menús UI
// Controla toda la experiencia Brawl Stars (crear, lobby, ajustes, terminar)
//
import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import {
  GameState, GameMode,
  getState, getMode, getConfig, setConfig,
  createMatch, joinLobby, leaveLobby, joinTeam,
  startCountdown, forceEnd, resetMatch, leaveMatch,
  getLobbyPlayers, getTeams, getScores, getMasterName,
  on, getAlivePlayers, getCurrentRound, setSpawnPositions,
} from "./game_manager.js";
import { buildArena } from "./arena_builder.js";
import { activateArena, spawnPowerBoxes, deactivateArena } from "./box_mechanic.js";
import { showdownArena } from "../structures/showdown_arena.js";
import { brawlBallArena } from "../structures/brawl_ball_arena.js";

const ARENAS = {
  showdown_arena: showdownArena,
  brawl_ball_arena: brawlBallArena,
};

// Limpiar arena cuando termine la partida
on("stateChange", ({ newState }) => {
  if (newState === GameState.FINISHED || newState === GameState.IDLE) {
    deactivateArena();
  }
});

// ═══════════════════════════════════════════
// ITEM HANDLER — Brawl Master
// ═══════════════════════════════════════════

world.beforeEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack?.typeId !== "miaddon:brawl_master") return;
  ev.cancel = true;
  const player = ev.source;
  system.run(() => openMainMenu(player));
});

// ═══════════════════════════════════════════
// MENÚ PRINCIPAL
// ═══════════════════════════════════════════

async function openMainMenu(player) {
  const st = getState();
  const form = new ActionFormData()
    .title("§l§6★ BRAWL MASTER ★")
    .body(getStatusText());

  const actions = [];

  if (st === GameState.IDLE) {
    form.button("§l🏟 Crear Partida\n§r§8Elige modo y mapa");
    actions.push(() => openModeSelect(player));
    form.button("§l⚙ Configuración\n§r§8Timer, gas, rondas");
    actions.push(() => openSettings(player));
  } else if (st === GameState.LOBBY) {
    form.button("§l👥 Ver Lobby\n§r§8Jugadores y equipos");
    actions.push(() => openLobbyView(player));
    form.button("§l➕ Unir Jugadores\n§r§8Agregar al lobby");
    actions.push(() => openJoinMenu(player));
    if (player.name === getMasterName()) {
      form.button("§l▶ Iniciar Partida\n§r§8Empezar countdown");
      actions.push(() => tryStartCountdown(player));
      form.button("§l❌ Cancelar\n§r§8Cancelar partida");
      actions.push(() => { forceEnd(); player.sendMessage("§c✦ Partida cancelada."); });
    }
    if (getLobbyPlayers().has(player.name) && player.name !== getMasterName()) {
      form.button("§l🚪 Salir del Lobby\n§r§8Abandonar la partida");
      actions.push(() => { leaveMatch(player.name); });
    }
    form.button("§l⚙ Configuración\n§r§8Timer, gas, rondas");
    actions.push(() => openSettings(player));
  } else if (st === GameState.PLAYING || st === GameState.COUNTDOWN) {
    form.button("§l📊 Estado\n§r§8Ver info de la partida");
    actions.push(() => showMatchStatus(player));
    if (player.name === getMasterName()) {
      form.button("§l⏹ Terminar Partida\n§r§8Forzar final");
      actions.push(() => { forceEnd(); player.sendMessage("§c✦ Partida terminada."); });
    }
    if (getLobbyPlayers().has(player.name) && player.name !== getMasterName()) {
      form.button("§l🚪 Abandonar\n§r§8Salir de la partida");
      actions.push(() => { leaveMatch(player.name); });
    }
  } else if (st === GameState.FINISHED) {
    form.button("§l📊 Resultados\n§r§8Ver resultados");
    actions.push(() => showMatchStatus(player));
  }

  const res = await form.show(player);
  if (res.canceled || res.selection >= actions.length) return;
  actions[res.selection]();
}

// ═══════════════════════════════════════════
// SELECCIONAR MODO
// ═══════════════════════════════════════════

async function openModeSelect(player) {
  const form = new ActionFormData()
    .title("§l Seleccionar Modo")
    .body("§7Elige el modo de juego:")
    .button("§l💀 Supervivencia\n§r§7FFA · Último en pie gana")
    .button("§l⚽ Balón Brawl\n§r§73v3 · Mete goles para ganar")
    .button("§7← Volver");

  const res = await form.show(player);
  if (res.canceled || res.selection === 2) return;

  const selectedMode = res.selection === 0 ? GameMode.SHOWDOWN : GameMode.BRAWL_BALL;
  const arenaKey = res.selection === 0 ? "showdown_arena" : "brawl_ball_arena";
  const arena = ARENAS[arenaKey];

  // Confirmar construcción
  const confirm = new ActionFormData()
    .title(`§l Construir ${arena.name}`)
    .body(`§7Se construirá §e${arena.name}§7 en tu posición actual.\n\n§7Bloques: §e~${arena.blocks.length}\n§7Esto tomará unos segundos.`)
    .button("§a✔ Construir y crear partida")
    .button("§c✖ Cancelar");

  const cRes = await confirm.show(player);
  if (cRes.canceled || cRes.selection === 1) return;

  // Obtener posición base
  const loc = player.location;
  const origin = {
    x: Math.floor(loc.x),
    y: Math.floor(loc.y),
    z: Math.floor(loc.z),
  };

  // Determinar tamaño de arena
  let arenaW, arenaH, arenaL;
  if (arenaKey === "showdown_arena") {
    arenaW = 45; arenaH = 6; arenaL = 45;
  } else {
    arenaW = 27; arenaH = 6; arenaL = 45;
  }

  player.sendMessage("§6★ Construyendo arena...");

  // Construir arena
  buildArena({
    dimension: player.dimension,
    origin: origin,
    blocks: arena.blocks,
    onProgress: (placed, total) => {
      if (placed % 2000 === 0) {
        player.sendMessage(`§7  Colocando bloques: ${placed}/${total}`);
      }
    },
    onComplete: () => {
      player.sendMessage("§a✔ Arena construida.");

      // Crear la partida
      const created = createMatch({
        mode: selectedMode,
        arenaId: arenaKey,
        origin: origin,
        dimension: player.dimension,
        size: { w: arenaW, h: arenaH, l: arenaL },
        master: player.name,
      });

      if (!created) {
        player.sendMessage("§cError al crear la partida.");
        return;
      }

      // Configurar posiciones de spawn
      if (arena.meta?.spawnPositions) {
        setSpawnPositions(arena.meta.spawnPositions);
      }

      // Auto-unir al master
      joinLobby(player.name);

      // Activar mecánicas de arena (box_mechanic)
      activateArena();

      // Spawnear power boxes si es Showdown
      if (arenaKey === "showdown_arena" && arena.meta?.boxPositions) {
        const worldPositions = arena.meta.boxPositions.map(([rx, ry, rz]) => ({
          x: origin.x + rx,
          y: origin.y + ry,
          z: origin.z + rz,
        }));
        system.runTimeout(() => {
          spawnPowerBoxes(player.dimension, worldPositions);
        }, 10);
      }

      player.sendMessage("§6★ Partida creada. Usa el §eBrawl Master §6para abrir el lobby.");
      player.sendMessage("§7Los demás jugadores pueden unirse usando el Brawl Master.");
    },
  });
}

// ═══════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════

async function openLobbyView(player) {
  const lobby = getLobbyPlayers();
  const t = getTeams();
  const m = getMode();

  let body = `§6Modo: §e${m === GameMode.SHOWDOWN ? "Supervivencia" : "Balón Brawl"}\n`;
  body += `§6Jugadores: §e${lobby.size}\n\n`;

  if (m === GameMode.BRAWL_BALL) {
    body += `§9🔵 Equipo Azul (${t.blue.size}):\n`;
    for (const n of t.blue) body += `  §b• ${n}\n`;
    if (t.blue.size === 0) body += `  §8(vacío)\n`;

    body += `\n§c🔴 Equipo Rojo (${t.red.size}):\n`;
    for (const n of t.red) body += `  §c• ${n}\n`;
    if (t.red.size === 0) body += `  §8(vacío)\n`;

    body += `\n§7Sin equipo:\n`;
    for (const n of lobby) {
      if (!t.blue.has(n) && !t.red.has(n)) body += `  §7• ${n}\n`;
    }
  } else {
    body += `§7Jugadores:\n`;
    for (const n of lobby) body += `  §e• ${n}\n`;
  }

  const form = new ActionFormData()
    .title("§l👥 Lobby")
    .body(body);

  if (m === GameMode.BRAWL_BALL) {
    form.button("§9 Unirme a Azul");
    form.button("§c Unirme a Rojo");
  }
  form.button("§7← Volver");

  const res = await form.show(player);
  if (res.canceled) return;

  if (m === GameMode.BRAWL_BALL) {
    if (res.selection === 0) {
      joinTeam(player.name, "blue");
      player.sendMessage("§9✦ Te uniste al Equipo Azul.");
    } else if (res.selection === 1) {
      joinTeam(player.name, "red");
      player.sendMessage("§c✦ Te uniste al Equipo Rojo.");
    }
  }
}

async function openJoinMenu(player) {
  const lobby = getLobbyPlayers();
  const allPlayers = world.getAllPlayers();
  const available = allPlayers.filter(p => !lobby.has(p.name));

  if (available.length === 0) {
    player.sendMessage("§7No hay jugadores nuevos disponibles.");
    return;
  }

  const form = new ActionFormData()
    .title("§l➕ Unir Jugadores")
    .body("§7Selecciona un jugador para agregar al lobby:");

  for (const p of available) {
    form.button(`§e${p.name}`);
  }
  form.button("§a Unir a TODOS");
  form.button("§7← Volver");

  const res = await form.show(player);
  if (res.canceled) return;

  if (res.selection === available.length) {
    // Unir a todos
    for (const p of available) {
      joinLobby(p.name);
      p.sendMessage(`§6★ Has sido invitado a una partida de Brawl Stars por §e${player.name}§6.`);
    }
    player.sendMessage(`§a✔ ${available.length} jugadores añadidos al lobby.`);
  } else if (res.selection < available.length) {
    const target = available[res.selection];
    joinLobby(target.name);
    target.sendMessage(`§6★ Has sido invitado a una partida de Brawl Stars por §e${player.name}§6.`);
    player.sendMessage(`§a✔ ${target.name} añadido al lobby.`);
  }
}

function tryStartCountdown(player) {
  const lobby = getLobbyPlayers();
  const m = getMode();

  if (m === GameMode.BRAWL_BALL) {
    const t = getTeams();
    if (t.blue.size === 0 || t.red.size === 0) {
      player.sendMessage("§c✦ Ambos equipos necesitan al menos 1 jugador.");
      return;
    }
  }

  if (lobby.size < 2) {
    player.sendMessage("§c✦ Se necesitan al menos 2 jugadores.");
    return;
  }

  const ok = startCountdown();
  if (!ok) {
    player.sendMessage("§c✦ No se pudo iniciar.");
    return;
  }

  for (const name of lobby) {
    const p = world.getAllPlayers().find(pl => pl.name === name);
    if (p) p.sendMessage("§6★ ¡La partida comenzará en unos segundos!");
  }
}

// ═══════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════

async function openSettings(player) {
  const cfg = getConfig();
  const form = new ModalFormData()
    .title("§l⚙ Configuración")
    .slider("Duración Showdown (segundos)", 60, 600, 30, cfg.showdownDuration / 20)
    .slider("Duración Brawl Ball (segundos)", 60, 600, 30, cfg.brawlBallDuration / 20)
    .slider("Countdown (segundos)", 3, 10, 1, cfg.countdownSeconds)
    .slider("Rondas Brawl Ball", 1, 5, 2, cfg.brawlBallRounds)
    .slider("Respawn delay (segundos)", 2, 10, 1, cfg.respawnDelaySec)
    .slider("Gas: inicio (segundos)", 10, 120, 10, cfg.gasStartDelay / 20)
    .slider("Gas: intervalo de cierre (seg)", 5, 60, 5, cfg.gasShrinkInterval / 20);

  const res = await form.show(player);
  if (res.canceled) return;

  setConfig("showdownDuration", res.formValues[0] * 20);
  setConfig("brawlBallDuration", res.formValues[1] * 20);
  setConfig("countdownSeconds", res.formValues[2]);
  setConfig("brawlBallRounds", res.formValues[3]);
  setConfig("respawnDelaySec", res.formValues[4]);
  setConfig("gasStartDelay", res.formValues[5] * 20);
  setConfig("gasShrinkInterval", res.formValues[6] * 20);

  player.sendMessage("§a✔ Configuración guardada.");
}

// ═══════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════

function getStatusText() {
  const st = getState();
  if (st === GameState.IDLE)
    return "§7No hay partida activa.\n§7Usa §eCrear Partida§7 para comenzar.";
  if (st === GameState.LOBBY)
    return `§6Lobby abierto\n§7Jugadores: §e${getLobbyPlayers().size}\n§7Master: §e${getMasterName()}`;
  if (st === GameState.COUNTDOWN)
    return "§eCountdown en progreso...";
  if (st === GameState.PLAYING) {
    const m = getMode();
    let text = `§a▶ En juego: §e${m === GameMode.SHOWDOWN ? "Supervivencia" : "Balón Brawl"}\n`;
    if (m === GameMode.SHOWDOWN) text += `§7Vivos: §e${getAlivePlayers().size}`;
    else text += `§9${getScores().blue} §f- §c${getScores().red}  §7Ronda ${getCurrentRound()}`;
    return text;
  }
  if (st === GameState.FINISHED)
    return "§6Partida finalizada.";
  return "";
}

function showMatchStatus(player) {
  player.sendMessage(getStatusText());
}
