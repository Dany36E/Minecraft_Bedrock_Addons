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
  getArenaOrigin, getArenaSize, getArenaId, getArenaDim,
  resetForRematch,
  getHubOrigin, getHubDimension, setHubData, clearHubData,
} from "./game_manager.js";
import { buildArena, clearArena } from "./arena_builder.js";
import { activateArena, spawnPowerBoxes, deactivateArena } from "./box_mechanic.js";
import { showdownArena } from "../structures/showdown_arena.js";
import { brawlBallArena } from "../structures/brawl_ball_arena.js";
import { hubStructure } from "../structures/hub_structure.js";

const ARENAS = {
  showdown_arena: showdownArena,
  brawl_ball_arena: brawlBallArena,
};

// Guardar datos de la última arena para reutilizar (#10)
let lastArenaData = null;  // { arenaKey, origin, dimension, size }
let pendingClearTimer = null;

// Limpiar arena cuando termine la partida (#9)
on("stateChange", ({ newState }) => {
  if (newState === GameState.FINISHED) {
    deactivateArena();
    const origin = getArenaOrigin();
    const size = getArenaSize();
    const dim = getArenaDim();
    if (origin && size && dim) {
      // Guardar para "Jugar de nuevo"
      lastArenaData = {
        arenaKey: getArenaId(),
        origin: { ...origin },
        dimension: dim,
        size: { ...size },
      };
      // Solo auto-limpiar arena si NO hay hub
      // (con hub, la arena se reconstruye al iniciar la próxima partida)
      if (!getHubOrigin()) {
        pendingClearTimer = system.runTimeout(() => {
          clearArena(dim, origin, size);
          pendingClearTimer = null;
        }, 220);
      }
    }
  }
  if (newState === GameState.LOBBY) {
    // Cancelar limpieza pendiente de arena (Reiniciar Mapa)
    if (pendingClearTimer !== null) {
      system.clearRun(pendingClearTimer);
      pendingClearTimer = null;
    }
  }
  if (newState === GameState.IDLE) {
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
    const hub = getHubOrigin();
    if (hub) {
      // ─── Hub existe: selección directa de modo ───
      form.button("§l💀 Supervivencia\n§r§8Último en pie gana");
      actions.push(() => startArenaFromHub(player, "showdown_arena"));
      form.button("§l⚽ Balón Brawl\n§r§83v3 · Mete goles para ganar");
      actions.push(() => startArenaFromHub(player, "brawl_ball_arena"));
      form.button("§l⚙ Configuración\n§r§8Timer, gas, rondas");
      actions.push(() => openSettings(player));
      form.button("§l🗑 Destruir Hub\n§r§8Eliminar hub y arenas");
      actions.push(() => destroyHub(player));
    } else {
      // ─── Sin hub: ofrecer construir ───
      form.button("§l🏗 Construir Hub\n§r§8Crear plataforma central");
      actions.push(() => buildHub(player));
      form.button("§l🏟 Crear Partida\n§r§8Sin hub (temporal)");
      actions.push(() => openModeSelect(player));
      if (lastArenaData) {
        form.button("§l🔁 Jugar de Nuevo\n§r§8Reconstruir última arena");
        actions.push(() => rebuildLastArena(player));
      }
      form.button("§l⚙ Configuración\n§r§8Timer, gas, rondas");
      actions.push(() => openSettings(player));
    }
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
      form.button("§l🔄 Reiniciar Mapa\n§r§8Reconstruir y volver al lobby");
      actions.push(() => handleRematch(player));
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
    if (player.name === getMasterName()) {
      form.button("§l🔄 Reiniciar Mapa\n§r§8Reconstruir y jugar de nuevo");
      actions.push(() => handleRematch(player));
    }
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

/**
 * Construir el Hub central en la posición del jugador.
 */
async function buildHub(player) {
  const confirm = new ActionFormData()
    .title("§l🏗 Construir Hub")
    .body(
      "§7Se construirá el §eBrawl Hub§7 en tu posición.\n\n" +
      "§7Incluye:\n" +
      "§e• §7Plataforma central de lobby\n" +
      "§e• §7Pedestales indicadores hacia cada arena\n" +
      "§e• §7Punto de regreso automático tras cada partida\n\n" +
      `§7Bloques: §e~${hubStructure.blocks.length}\n` +
      "§7Las arenas se construirán a los lados del hub."
    )
    .button("§a✔ Construir aquí")
    .button("§c✖ Cancelar");

  const cRes = await confirm.show(player);
  if (cRes.canceled || cRes.selection === 1) return;

  const loc = player.location;
  const origin = {
    x: Math.floor(loc.x) - 10,  // centrar hub sobre el jugador
    y: Math.floor(loc.y),
    z: Math.floor(loc.z) - 6,
  };
  const sp = hubStructure.meta.spawnPoint;
  const spawnPos = {
    x: origin.x + sp.rx,
    y: origin.y + sp.ry,
    z: origin.z + sp.rz,
  };

  player.sendMessage("§6★ Construyendo Hub...");

  buildArena({
    dimension: player.dimension,
    origin,
    blocks: hubStructure.blocks,
    onComplete: () => {
      setHubData(origin, player.dimension.id, spawnPos);
      player.sendMessage("§a✔ Hub construido. ¡Usa el §eBrawl Master §apara elegir modo!");

      try {
        player.teleport(spawnPos);
        player.playSound("random.levelup");
      } catch {}
    },
  });
}

/**
 * Iniciar partida desde el Hub: construye arena en posición fija.
 */
async function startArenaFromHub(player, arenaKey) {
  const hub = getHubOrigin();
  const hubDim = getHubDimension();
  if (!hub || !hubDim) {
    player.sendMessage("§c✦ Hub no encontrado.");
    return;
  }

  const arena = ARENAS[arenaKey];
  if (!arena) return;

  const offset = hubStructure.meta.arenaOffsets[arenaKey];
  const origin = {
    x: hub.x + offset.rx,
    y: hub.y + offset.ry,
    z: hub.z + offset.rz,
  };

  const selectedMode = arenaKey === "showdown_arena" ? GameMode.SHOWDOWN : GameMode.BRAWL_BALL;
  const modeName = selectedMode === GameMode.SHOWDOWN ? "Supervivencia" : "Balón Brawl";
  const icon = selectedMode === GameMode.SHOWDOWN ? "💀" : "⚽";

  const confirm = new ActionFormData()
    .title(`§l${icon} ${modeName}`)
    .body(
      `§7Construir §e${arena.name}§7 en posición fija.\n\n` +
      `§7Bloques: §e~${arena.blocks.length}\n` +
      `§7Dirección: §e${arenaKey === "showdown_arena" ? "Oeste del Hub" : "Este del Hub"}`
    )
    .button("§a✔ Construir y crear partida")
    .button("§c✖ Cancelar");

  const cRes = await confirm.show(player);
  if (cRes.canceled || cRes.selection === 1) return;

  const arenaSize = arena.size || {
    w: arenaKey === "showdown_arena" ? 45 : 27,
    h: 6,
    l: 45,
  };

  player.sendMessage("§6★ Construyendo arena...");

  buildArena({
    dimension: hubDim,
    origin,
    blocks: arena.blocks,
    onProgress: (placed, total) => {
      if (placed % 2000 === 0) {
        player.sendMessage(`§7  Colocando bloques: ${placed}/${total}`);
      }
    },
    onComplete: () => {
      player.sendMessage("§a✔ Arena construida.");

      const created = createMatch({
        mode: selectedMode,
        arenaId: arenaKey,
        origin,
        dimension: hubDim,
        size: arenaSize,
        master: player.name,
      });

      if (!created) {
        player.sendMessage("§cError al crear la partida.");
        return;
      }

      if (arena.meta?.spawnPositions) {
        setSpawnPositions(arena.meta.spawnPositions);
      }

      joinLobby(player.name);
      activateArena();

      if (arenaKey === "showdown_arena" && arena.meta?.boxPositions) {
        const worldPositions = arena.meta.boxPositions.map(([rx, ry, rz]) => ({
          x: origin.x + rx,
          y: origin.y + ry,
          z: origin.z + rz,
        }));
        system.runTimeout(() => {
          spawnPowerBoxes(hubDim, worldPositions);
        }, 10);
      }

      player.sendMessage("§6★ Partida creada. Usa el §eBrawl Master §6para abrir el lobby.");
    },
  });
}

/**
 * Destruir el Hub y limpiar todas las arenas.
 */
async function destroyHub(player) {
  if (getState() !== GameState.IDLE) {
    player.sendMessage("§c✦ No se puede destruir el hub durante una partida.");
    return;
  }

  const confirm = new ActionFormData()
    .title("§l🗑 Destruir Hub")
    .body("§c¿Estás seguro?\n\n§7Se eliminará:\n§c• §7El Hub central\n§c• §7Ambas arenas (si existen)\n\n§cEsta acción no se puede deshacer.")
    .button("§c✔ Destruir todo")
    .button("§a✖ Cancelar");

  const cRes = await confirm.show(player);
  if (cRes.canceled || cRes.selection === 1) return;

  const hub = getHubOrigin();
  const dim = getHubDimension();

  if (hub && dim) {
    player.sendMessage("§c✦ Destruyendo hub y arenas...");

    // Limpiar hub
    clearArena(dim, hub, hubStructure.size);

    // Limpiar ambas posiciones de arena
    for (const [key, arena] of Object.entries(ARENAS)) {
      const offset = hubStructure.meta.arenaOffsets[key];
      if (offset) {
        const aSize = arena.size || {
          w: key === "showdown_arena" ? 45 : 27, h: 6, l: 45,
        };
        clearArena(dim, {
          x: hub.x + offset.rx,
          y: hub.y + offset.ry,
          z: hub.z + offset.rz,
        }, aSize);
      }
    }
  }

  clearHubData();
  player.sendMessage("§c✦ Hub y arenas destruidos.");
}

/**
 * Reiniciar Mapa: resetea partida, reconstruye arena, vuelve al lobby.
 */
async function handleRematch(player) {
  const arenaKey = getArenaId();
  const origin = getArenaOrigin();
  const dim = getArenaDim();
  const size = getArenaSize();

  if (!arenaKey || !origin || !dim) {
    player.sendMessage("§c✦ No hay arena activa para reiniciar.");
    return;
  }

  const arena = ARENAS[arenaKey];
  if (!arena) {
    player.sendMessage("§c✦ Definición de arena no encontrada.");
    return;
  }

  const modeName = getMode() === GameMode.SHOWDOWN ? "Supervivencia" : "Balón Brawl";

  const confirm = new ActionFormData()
    .title("§l🔄 Reiniciar Mapa")
    .body(`§7Reconstruir §e${arena.name}§7 (${modeName}).\n\n§7Se reiniciarán:\n§e• §7Bloques del mapa\n§e• §7Power Cubes\n§e• §7Puntuaciones\n§e• §7Todos vuelven al lobby`)
    .button("§a✔ Reiniciar")
    .button("§c✖ Cancelar");

  const cRes = await confirm.show(player);
  if (cRes.canceled || cRes.selection === 1) return;

  // Resetear partida conservando arena + lobby
  resetForRematch();

  player.sendMessage("§6★ Reconstruyendo mapa...");

  // Reconstruir arena
  buildArena({
    dimension: dim,
    origin,
    blocks: arena.blocks,
    onProgress: (placed, total) => {
      if (placed % 2000 === 0) {
        player.sendMessage(`§7  Colocando bloques: ${placed}/${total}`);
      }
    },
    onComplete: () => {
      player.sendMessage("§a✔ Mapa reiniciado. ¡Listo para jugar!");

      activateArena();

      // Respawnear power boxes si es Showdown
      if (arenaKey === "showdown_arena" && arena.meta?.boxPositions) {
        const worldPositions = arena.meta.boxPositions.map(([rx, ry, rz]) => ({
          x: origin.x + rx,
          y: origin.y + ry,
          z: origin.z + rz,
        }));
        system.runTimeout(() => {
          spawnPowerBoxes(dim, worldPositions);
        }, 10);
      }

      // Avisar a todos los del lobby
      for (const name of getLobbyPlayers()) {
        const p = world.getAllPlayers().find(pl => pl.name === name);
        if (p && p.name !== player.name) {
          try { p.sendMessage("§6★ El mapa ha sido reiniciado. ¡Preparados!"); } catch {}
        }
      }
    },
  });
}

/**
 * Reconstruir la última arena y crear partida rápida (#10).
 */
async function rebuildLastArena(player) {
  if (!lastArenaData) {
    player.sendMessage("§c✦ No hay arena previa para reconstruir.");
    return;
  }

  const { arenaKey, origin, dimension, size } = lastArenaData;
  const arena = ARENAS[arenaKey];
  if (!arena) {
    player.sendMessage("§c✦ Arena no encontrada.");
    return;
  }

  const selectedMode = arenaKey === "showdown_arena" ? GameMode.SHOWDOWN : GameMode.BRAWL_BALL;
  const modeName = selectedMode === GameMode.SHOWDOWN ? "Supervivencia" : "Balón Brawl";

  const confirm = new ActionFormData()
    .title(`§l🔁 Jugar de Nuevo`)
    .body(`§7Reconstruir §e${arena.name}§7 (${modeName}) en la misma ubicación.\n\n§7Bloques: §e~${arena.blocks.length}`)
    .button("§a✔ Construir y crear partida")
    .button("§c✖ Cancelar");

  const cRes = await confirm.show(player);
  if (cRes.canceled || cRes.selection === 1) return;

  player.sendMessage("§6★ Reconstruyendo arena...");

  buildArena({
    dimension,
    origin,
    blocks: arena.blocks,
    onProgress: (placed, total) => {
      if (placed % 2000 === 0) {
        player.sendMessage(`§7  Colocando bloques: ${placed}/${total}`);
      }
    },
    onComplete: () => {
      player.sendMessage("§a✔ Arena reconstruida.");

      const created = createMatch({
        mode: selectedMode,
        arenaId: arenaKey,
        origin,
        dimension,
        size,
        master: player.name,
      });

      if (!created) {
        player.sendMessage("§cError al crear la partida.");
        return;
      }

      if (arena.meta?.spawnPositions) {
        setSpawnPositions(arena.meta.spawnPositions);
      }

      joinLobby(player.name);
      activateArena();

      if (arenaKey === "showdown_arena" && arena.meta?.boxPositions) {
        const worldPositions = arena.meta.boxPositions.map(([rx, ry, rz]) => ({
          x: origin.x + rx,
          y: origin.y + ry,
          z: origin.z + rz,
        }));
        system.runTimeout(() => {
          spawnPowerBoxes(dimension, worldPositions);
        }, 10);
      }

      player.sendMessage("§6★ Partida creada. Usa el §eBrawl Master §6para abrir el lobby.");
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
    const modeName = getMode() === GameMode.SHOWDOWN ? "Supervivencia" : "Balón Brawl";
    for (const p of available) {
      joinLobby(p.name);
      p.sendMessage(`§6★ Has sido invitado a §e${modeName} §6por §e${player.name}§6.`);
    }
    player.sendMessage(`§a✔ ${available.length} jugadores añadidos al lobby.`);
  } else if (res.selection < available.length) {
    const target = available[res.selection];
    const modeName = getMode() === GameMode.SHOWDOWN ? "Supervivencia" : "Balón Brawl";
    joinLobby(target.name);
    target.sendMessage(`§6★ Has sido invitado a §e${modeName} §6por §e${player.name}§6.`);
    player.sendMessage(`§a✔ ${target.name} añadido al lobby.`);
  }
}

function tryStartCountdown(player) {
  const lobby = getLobbyPlayers();
  const m = getMode();

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
    .slider("Goles para ganar BB", 2, 5, 1, cfg.brawlBallRounds)
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
