// goal_system.js — Sistema de goles Brawl Ball
// Pelota = entidad (miaddon:brawl_ball), jugador la recoge y patea
//
import { world, system } from "@minecraft/server";
import {
  GameState, GameMode,
  getState, getMode, getArenaOrigin, getLobbyPlayers,
  getTeams, reportGoal, on,
} from "./game_manager.js";

// ═══════════════════════════════════════════
// CONSTANTES DEL CAMPO (relativas al arena origin)
// ═══════════════════════════════════════════
const BALL_SPAWN = { rx: 13, ry: 2, rz: 22 };  // Centro del campo
const BLUE_GOAL = { x1: 9, x2: 17, z1: 0, z2: 2 };     // z=0..2
const RED_GOAL  = { x1: 9, x2: 17, z1: 42, z2: 44 };    // z=42..44
const PICKUP_RADIUS = 1.8;
const KICK_SPEED = 1.2;
const BALL_CHECK_INTERVAL = 3;

// ═══════════════════════════════════════════
// ESTADO DE LA PELOTA
// ═══════════════════════════════════════════
let ballEntity = null;     // La entidad pelota en el mundo
let ballCarrier = null;    // Nombre del jugador que la lleva
let ballActive = false;
let roundResetting = false;

// ═══════════════════════════════════════════
// INICIO / FIN
// ═══════════════════════════════════════════

on("stateChange", ({ newState }) => {
  if (newState === GameState.PLAYING && getMode() === GameMode.BRAWL_BALL) {
    ballActive = true;
    spawnBall();
  }
  if (newState === GameState.FINISHED || newState === GameState.IDLE) {
    ballActive = false;
    ballCarrier = null;
    removeBallEntity();
  }
});

on("roundEnd", () => {
  if (getMode() !== GameMode.BRAWL_BALL) return;
  // Reset de ronda: ball vuelve al centro
  roundResetting = true;
  ballCarrier = null;
  removeBallEntity();

  system.runTimeout(() => {
    if (getState() === GameState.PLAYING) {
      spawnBall();
      roundResetting = false;
      for (const name of getLobbyPlayers()) {
        const p = world.getAllPlayers().find(pl => pl.name === name);
        if (p) {
          try {
            p.onScreenDisplay.setTitle("§a⚽ ¡Nueva ronda!", {
              fadeInDuration: 0, stayDuration: 30, fadeOutDuration: 10,
            });
          } catch {}
        }
      }
    }
  }, 60);  // 3 segundos de pausa
});

function spawnBall() {
  removeBallEntity();
  const origin = getArenaOrigin();
  if (!origin) return;

  const pos = {
    x: origin.x + BALL_SPAWN.rx + 0.5,
    y: origin.y + BALL_SPAWN.ry + 0.5,
    z: origin.z + BALL_SPAWN.rz + 0.5,
  };

  try {
    const dim = world.getDimension("overworld");
    ballEntity = dim.spawnEntity("miaddon:brawl_ball", pos);
    ballCarrier = null;
  } catch {}
}

function removeBallEntity() {
  try { if (ballEntity) ballEntity.remove(); } catch {}
  ballEntity = null;
}

// ═══════════════════════════════════════════
// LOOP: Pickup, carry, goal detection
// ═══════════════════════════════════════════

system.runInterval(() => {
  if (!ballActive || roundResetting) return;
  if (getState() !== GameState.PLAYING || getMode() !== GameMode.BRAWL_BALL) return;

  const origin = getArenaOrigin();
  if (!origin) return;

  // Si un jugador lleva la pelota
  if (ballCarrier) {
    const carrier = world.getAllPlayers().find(p => p.name === ballCarrier);
    if (!carrier) {
      // Carrier desconectado → soltar pelota
      dropBall(null);
      return;
    }

    // Mover la pelota con el jugador (un poco adelante)
    if (ballEntity) {
      try {
        const loc = carrier.location;
        const rot = carrier.getRotation();
        const yaw = rot.y * Math.PI / 180;
        ballEntity.teleport({
          x: loc.x - Math.sin(yaw) * 1.2,
          y: loc.y + 0.2,
          z: loc.z + Math.cos(yaw) * 1.2,
        });
      } catch {
        // Entidad perdida, re-spawnear
        spawnBallAtPlayer(carrier);
      }
    }

    // Verificar si el carrier entró en zona de gol
    try {
      const loc = carrier.location;
      const rx = loc.x - origin.x;
      const rz = loc.z - origin.z;

      const carrierTeam = getPlayerTeam(ballCarrier);

      // Equipo azul mete gol en portería roja (z=42..44)
      if (carrierTeam === "blue" &&
          rx >= RED_GOAL.x1 && rx <= RED_GOAL.x2 &&
          rz >= RED_GOAL.z1 && rz <= RED_GOAL.z2) {
        scoreGoal("blue", carrier);
        return;
      }

      // Equipo rojo mete gol en portería azul (z=0..2)
      if (carrierTeam === "red" &&
          rx >= BLUE_GOAL.x1 && rx <= BLUE_GOAL.x2 &&
          rz >= BLUE_GOAL.z1 && rz <= BLUE_GOAL.z2) {
        scoreGoal("red", carrier);
        return;
      }
    } catch {}

    return;
  }

  // Nadie lleva la pelota → verificar pickup
  if (!ballEntity) return;

  try {
    const ballLoc = ballEntity.location;

    for (const name of getLobbyPlayers()) {
      const p = world.getAllPlayers().find(pl => pl.name === name);
      if (!p) continue;

      const loc = p.location;
      const dx = loc.x - ballLoc.x;
      const dy = loc.y - ballLoc.y;
      const dz = loc.z - ballLoc.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= PICKUP_RADIUS) {
        ballCarrier = name;
        try {
          p.playSound("random.pop");
          p.sendMessage("§e⚽ ¡Tienes la pelota! §7Ataca para patear.");
        } catch {}

        // Avisar a todos
        for (const n of getLobbyPlayers()) {
          if (n === name) continue;
          const o = world.getAllPlayers().find(pl => pl.name === n);
          if (o) try { o.sendMessage(`§7⚽ ${name} tiene la pelota.`); } catch {}
        }
        break;
      }
    }
  } catch {}
}, BALL_CHECK_INTERVAL);

// ═══════════════════════════════════════════
// PATEAR LA PELOTA — Al atacar
// ═══════════════════════════════════════════

world.afterEvents.entityHitEntity.subscribe((ev) => {
  if (!ballActive || !ballCarrier) return;
  if (ev.damagingEntity?.typeId !== "minecraft:player") return;
  if (ev.damagingEntity.name !== ballCarrier) return;

  kickBall(ev.damagingEntity);
});

world.afterEvents.entityHitBlock.subscribe((ev) => {
  if (!ballActive || !ballCarrier) return;
  if (ev.damagingEntity?.typeId !== "minecraft:player") return;
  if (ev.damagingEntity.name !== ballCarrier) return;

  kickBall(ev.damagingEntity);
});

function kickBall(player) {
  const carrier = ballCarrier;
  ballCarrier = null;

  if (!ballEntity) {
    spawnBallAtPlayer(player);
    return;
  }

  try {
    const loc = player.location;
    const rot = player.getRotation();
    const yaw = rot.y * Math.PI / 180;
    const pitch = rot.x * Math.PI / 180;

    // Dirección de la patada
    const dx = -Math.sin(yaw) * Math.cos(pitch);
    const dy = 0.3;  // Pequeño arco
    const dz = Math.cos(yaw) * Math.cos(pitch);

    // Mover la pelota 8 bloques en la dirección
    const kickDist = 8;
    const targetX = loc.x + dx * kickDist;
    const targetY = loc.y + 0.5;
    const targetZ = loc.z + dz * kickDist;

    // Animación: mover en pasos
    let step = 0;
    const totalSteps = 10;

    const kickInterval = system.runInterval(() => {
      step++;
      const t = step / totalSteps;
      const cx = loc.x + dx * kickDist * t;
      const cy = loc.y + 0.5 + Math.sin(t * Math.PI) * 2;  // Arco
      const cz = loc.z + dz * kickDist * t;

      try {
        if (ballEntity) {
          ballEntity.teleport({ x: cx, y: cy, z: cz });
        }
      } catch {}

      if (step >= totalSteps) {
        system.clearRun(kickInterval);
      }
    }, 1);

    try {
      player.playSound("mob.zombie.woodbreak");
    } catch {}

    for (const n of getLobbyPlayers()) {
      if (n === carrier) continue;
      const o = world.getAllPlayers().find(pl => pl.name === n);
      if (o) try { o.sendMessage(`§7⚽ ${carrier} pateó la pelota.`); } catch {}
    }
  } catch {
    spawnBallAtPlayer(player);
  }
}

function dropBall(loc) {
  ballCarrier = null;
  if (!ballEntity && loc) {
    try {
      const dim = world.getDimension("overworld");
      ballEntity = dim.spawnEntity("miaddon:brawl_ball", loc);
    } catch {}
  }
}

function spawnBallAtPlayer(player) {
  removeBallEntity();
  try {
    const loc = player.location;
    ballEntity = player.dimension.spawnEntity("miaddon:brawl_ball", {
      x: loc.x, y: loc.y + 0.5, z: loc.z,
    });
  } catch {}
}

// ═══════════════════════════════════════════
// MUERTE DEL CARRIER → soltar pelota
// ═══════════════════════════════════════════

world.afterEvents.entityDie.subscribe((ev) => {
  if (!ballActive) return;
  if (ev.deadEntity?.typeId !== "minecraft:player") return;
  if (ev.deadEntity.name !== ballCarrier) return;

  try {
    const loc = ev.deadEntity.location;
    dropBall({ x: loc.x, y: loc.y + 0.5, z: loc.z });
  } catch {
    // Fallback: respawnear en centro
    const origin = getArenaOrigin();
    if (origin) {
      dropBall({
        x: origin.x + BALL_SPAWN.rx + 0.5,
        y: origin.y + BALL_SPAWN.ry + 0.5,
        z: origin.z + BALL_SPAWN.rz + 0.5,
      });
    }
  }
});

// ═══════════════════════════════════════════
// GOL
// ═══════════════════════════════════════════

function scoreGoal(team, scorer) {
  ballCarrier = null;
  removeBallEntity();

  const teamName = team === "blue" ? "§9Azul" : "§cRojo";

  for (const name of getLobbyPlayers()) {
    const p = world.getAllPlayers().find(pl => pl.name === name);
    if (p) {
      try {
        p.onScreenDisplay.setTitle(`${teamName} §6¡GOOOL!`, {
          fadeInDuration: 0, stayDuration: 40, fadeOutDuration: 15,
          subtitle: `§7Gol de §e${scorer.name}`,
        });
        p.playSound("random.totem");
      } catch {}
    }
  }

  // Reportar al game_manager (esto dispara roundEnd)
  reportGoal(team);
}

// ═══════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════

function getPlayerTeam(playerName) {
  const t = getTeams();
  if (t.blue.has(playerName)) return "blue";
  if (t.red.has(playerName)) return "red";
  return null;
}

export function getBallCarrier() { return ballCarrier; }
export function isBallActive() { return ballActive; }
