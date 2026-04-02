// construction_wand.js — EasyBuild v3: UX Rewrite
// @minecraft/server 1.12.0 + @minecraft/server-ui 1.3.0

import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
import { openBiblicalMenu } from "./construction_menu.js";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const MAX_BLOCKS      = 80000;
const MAX_UNDO        = 10;
const BATCH_SIZE      = 120;
const HUD_TICKS       = 20;
const CONFIRM_THRESHOLD = 1000;

const MODE = {
  NONE: 0,    FILL: 1,    FLOOR: 2,    LINE: 3,
  CIRCLE: 4,  SPHERE: 5,  CYLINDER: 6, REPLACE: 7,
  COPY: 8,    PASTE: 9,   WALL: 10,    PYRAMID: 11,
  FRAME: 12,  DRAIN: 13,
};

const MODE_INFO = {
  [MODE.FILL]:     { icon: "§b📦", name: "Relleno",     need: 2, cat: "build",  steps: 3, hint: "Cuboid sólido, hueco o paredes" },
  [MODE.FLOOR]:    { icon: "§a⬛", name: "Piso/Techo",  need: 2, cat: "build",  steps: 3, hint: "Capa horizontal al nivel del P1" },
  [MODE.LINE]:     { icon: "§d📏", name: "Línea",       need: 2, cat: "build",  steps: 3, hint: "Línea recta 3D entre 2 puntos" },
  [MODE.WALL]:     { icon: "§f🧱", name: "Muro",        need: 2, cat: "build",  steps: 3, hint: "Pared vertical entre 2 puntos" },
  [MODE.FRAME]:    { icon: "§8🔲", name: "Marco",       need: 2, cat: "build",  steps: 3, hint: "Solo las aristas del cuboid" },
  [MODE.CIRCLE]:   { icon: "§6⭕", name: "Círculo",     need: 1, cat: "shape",  steps: 2, hint: "Disco en cualquier plano" },
  [MODE.SPHERE]:   { icon: "§c🔴", name: "Esfera",      need: 1, cat: "shape",  steps: 2, hint: "Esfera sólida o hueca" },
  [MODE.CYLINDER]: { icon: "§3🏛", name: "Cilindro",    need: 1, cat: "shape",  steps: 2, hint: "Torre circular con altura" },
  [MODE.PYRAMID]:  { icon: "§e🔺", name: "Pirámide",    need: 1, cat: "shape",  steps: 2, hint: "Pirámide escalonada" },
  [MODE.REPLACE]:  { icon: "§5🔄", name: "Reemplazar",  need: 2, cat: "tool",   steps: 3, hint: "Cambia un bloque por otro" },
  [MODE.DRAIN]:    { icon: "§b💧", name: "Drenar",      need: 2, cat: "tool",   steps: 2, hint: "Elimina agua y lava" },
  [MODE.COPY]:     { icon: "§9📋", name: "Copiar",      need: 2, cat: "tool",   steps: 2, hint: "Guarda región al portapapeles" },
  [MODE.PASTE]:    { icon: "§9📋", name: "Pegar",       need: 0, cat: "tool",   steps: 1, hint: "Pega portapapeles con rotación" },
};

// ═══════════════════════════════════════════════════════════
// PER-PLAYER STATE
// ═══════════════════════════════════════════════════════════
const states = new Map();

function getState(player) {
  if (!states.has(player.name)) {
    states.set(player.name, {
      mode: MODE.NONE,
      p1: null, p2: null,
      step: 0,
      blockType: "minecraft:stone",
      clipboard: null,
      undoStack: [],
      firstUse: true,
      lastMode: MODE.NONE,
      building: false,
      mirror:      { enabled: false, axis: "x", center: null },
      arrayRepeat: { enabled: false, count: 2, offset: { x: 10, y: 0, z: 0 } },
    });
  }
  return states.get(player.name);
}

function resetPoints(st) {
  st.p1 = null;
  st.p2 = null;
  st.step = 0;
}

function resetMode(player) {
  const st = getState(player);
  if (st.mode !== MODE.NONE) st.lastMode = st.mode;
  st.mode = MODE.NONE;
  resetPoints(st);
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function getTargetBlock(player) {
  try {
    const hit = player.getBlockFromViewDirection({ maxDistance: 128, includePassableBlocks: true });
    return hit?.block ?? null;
  } catch { return null; }
}

function pos(p) { return `§7(§e${p.x}§7, §e${p.y}§7, §e${p.z}§7)`; }

function playSound(player, sound, pitch = 1) {
  try {
    const loc = player.location;
    player.dimension.runCommand(
      `playsound ${sound} "${player.name}" ${loc.x} ${loc.y} ${loc.z} 0.7 ${pitch}`
    );
  } catch {}
}

function normalizeBlock(input) {
  let b = input.trim().toLowerCase();
  if (!b.includes(":")) b = "minecraft:" + b;
  return b;
}

function shortName(blockId) {
  return blockId.replace("minecraft:", "").replace(/_/g, " ");
}

function dimStr(p1, p2) {
  const dx = Math.abs(p2.x - p1.x) + 1;
  const dy = Math.abs(p2.y - p1.y) + 1;
  const dz = Math.abs(p2.z - p1.z) + 1;
  return { dx, dy, dz, total: dx * dy * dz, str: `${dx}×${dy}×${dz}` };
}

function progressBar(pct) {
  const filled = Math.round(pct / 5);
  return "§a" + "█".repeat(filled) + "§7" + "░".repeat(20 - filled);
}

function stepTag(current, total) {
  return `§8[§a${current}§8/§7${total}§8]`;
}

// ═══════════════════════════════════════════════════════════
// UNDO SYSTEM
// ═══════════════════════════════════════════════════════════
function pushUndo(player, entries) {
  const st = getState(player);
  if (entries.length === 0) return;
  st.undoStack.push(entries);
  if (st.undoStack.length > MAX_UNDO) st.undoStack.shift();
}

function performUndo(player) {
  const st = getState(player);
  if (st.undoStack.length === 0) {
    player.sendMessage("§c✗ Nada que deshacer.");
    playSound(player, "note.bass", 0.5);
    return;
  }
  const entries = st.undoStack.pop();
  const dim = player.dimension;
  let i = 0;
  const total = entries.length;
  st.building = true;

  player.sendMessage(`§e↩ Deshaciendo §f${total} §ebloques...`);

  const id = system.runInterval(() => {
    const end = Math.min(i + BATCH_SIZE, total);
    for (; i < end; i++) {
      try { dim.getBlock(entries[i])?.setType(entries[i].old); } catch {}
    }
    const pct = Math.floor((i / total) * 100);
    try { player.onScreenDisplay.setActionBar(`§e↩ Deshaciendo... ${progressBar(pct)} §f${pct}%`); } catch {}
    if (i >= total) {
      system.clearRun(id);
      st.building = false;
      player.sendMessage(`§a✓ Deshecho. §7(${st.undoStack.length} más en la pila)`);
      playSound(player, "mob.shulker.close");
    }
  }, 1);
}

// ═══════════════════════════════════════════════════════════
// POST-PROCESSORS — Mirror & Array (placement only)
// ═══════════════════════════════════════════════════════════
function applyMirror(positions, center, axis) {
  const seen = new Set();
  const result = [];

  function add(x, y, z) {
    const k = `${x},${y},${z}`;
    if (!seen.has(k)) { seen.add(k); result.push({ x, y, z }); }
  }

  for (const p of positions) {
    add(p.x, p.y, p.z);
    const mx = 2 * center.x - p.x;
    const mz = 2 * center.z - p.z;
    if (axis === "x")        add(mx, p.y, p.z);
    else if (axis === "z")   add(p.x, p.y, mz);
    else /* both */        { add(mx, p.y, p.z); add(p.x, p.y, mz); add(mx, p.y, mz); }
  }
  return result;
}

function applyArrayRepeat(positions, count, offset) {
  if (count <= 1) return positions;
  const seen = new Set();
  const result = [];
  for (let i = 0; i < count; i++) {
    const ox = offset.x * i, oy = offset.y * i, oz = offset.z * i;
    for (const p of positions) {
      const nx = p.x + ox, ny = p.y + oy, nz = p.z + oz;
      const k = `${nx},${ny},${nz}`;
      if (!seen.has(k)) { seen.add(k); result.push({ x: nx, y: ny, z: nz }); }
    }
  }
  return result;
}

// Only apply to actual placement modes (not replace/drain/copy)
function applyModifiers(player, positions) {
  const st = getState(player);
  const placementModes = [MODE.FILL, MODE.FLOOR, MODE.LINE, MODE.WALL, MODE.FRAME,
                          MODE.CIRCLE, MODE.SPHERE, MODE.CYLINDER, MODE.PYRAMID];
  if (!placementModes.includes(st.mode)) return positions;

  let result = positions;
  if (st.mirror.enabled && st.mirror.center) {
    result = applyMirror(result, st.mirror.center, st.mirror.axis);
  }
  if (st.arrayRepeat.enabled && st.arrayRepeat.count > 1) {
    result = applyArrayRepeat(result, st.arrayRepeat.count, st.arrayRepeat.offset);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════
// BLOCK PLACEMENT ENGINE — with progress bar + confirmation
// ═══════════════════════════════════════════════════════════
function placeBlocks(player, positions, blockType, callback) {
  if (positions.length === 0) {
    player.sendMessage("§c✗ No hay bloques para colocar.");
    return;
  }
  if (positions.length > MAX_BLOCKS) {
    player.sendMessage(`§c✗ Demasiados bloques (${positions.length}). Máximo: ${MAX_BLOCKS}.`);
    playSound(player, "note.bass", 0.5);
    return;
  }

  const st = getState(player);
  st.building = true;
  const dim = player.dimension;
  const undo = [];
  let placed = 0, i = 0;
  const total = positions.length;

  player.sendMessage(`§e⚡ Colocando §f${total} §ebloques de §f${shortName(blockType)}§e...`);
  playSound(player, "block.beehive.enter", 1.2);

  const id = system.runInterval(() => {
    const end = Math.min(i + BATCH_SIZE, total);
    for (; i < end; i++) {
      const p = positions[i];
      try {
        const block = dim.getBlock(p);
        if (block) {
          undo.push({ x: p.x, y: p.y, z: p.z, old: block.typeId });
          block.setType(blockType);
          placed++;
        }
      } catch {}
    }
    const pct = Math.floor((i / total) * 100);
    try { player.onScreenDisplay.setActionBar(`§e⚡ Construyendo... ${progressBar(pct)} §f${pct}%`); } catch {}
    if (i >= total) {
      system.clearRun(id);
      st.building = false;
      pushUndo(player, undo);
      player.sendMessage(`§a✓ ¡Listo! §f${placed} §abloques colocados.`);
      playSound(player, "random.levelup", 1);
      if (callback) callback();
    }
  }, 1);
}

// Confirmation gate — asks user if operation is large
function confirmAndPlace(player, positions, blockType, callback) {
  if (positions.length <= CONFIRM_THRESHOLD) {
    placeBlocks(player, positions, blockType, callback);
    return;
  }

  const form = new MessageFormData();
  form.title("§e⚠ Confirmar operación");
  form.body(
    `§fSe van a colocar §e${positions.length} §fbloques\n` +
    `§fde §e${shortName(blockType)}§f.\n\n` +
    `§7Operaciones grandes pueden tardar.\n` +
    `§7Podrás §adeshacer §7si algo sale mal.`
  );
  form.button1("§a✓ Construir");
  form.button2("§c✗ Cancelar");

  form.show(player).then(res => {
    system.run(() => {
      if (res.selection === 0) {
        placeBlocks(player, positions, blockType, callback);
      } else {
        resetMode(player);
        player.sendMessage("§7Operación cancelada.");
        playSound(player, "mob.shulker.close", 0.8);
      }
    });
  });
}

function replaceBulk(player, positions, fromType, toType) {
  const st = getState(player);
  st.building = true;
  const dim = player.dimension;
  const undo = [];
  let replaced = 0, i = 0;
  const total = positions.length;

  player.sendMessage(`§e⚡ Reemplazando §f${shortName(fromType)} §e→ §f${shortName(toType)}§e...`);
  playSound(player, "block.beehive.enter", 1.2);

  const id = system.runInterval(() => {
    const end = Math.min(i + BATCH_SIZE, total);
    for (; i < end; i++) {
      try {
        const block = dim.getBlock(positions[i]);
        if (block && block.typeId === fromType) {
          undo.push({ x: positions[i].x, y: positions[i].y, z: positions[i].z, old: fromType });
          block.setType(toType);
          replaced++;
        }
      } catch {}
    }
    const pct = Math.floor((i / total) * 100);
    try { player.onScreenDisplay.setActionBar(`§5🔄 Reemplazando... ${progressBar(pct)} §f${pct}%`); } catch {}
    if (i >= total) {
      system.clearRun(id);
      st.building = false;
      pushUndo(player, undo);
      player.sendMessage(`§a✓ ¡Listo! §f${replaced} §abloques reemplazados.`);
      playSound(player, "random.levelup", 1);
    }
  }, 1);
}

// ═══════════════════════════════════════════════════════════
// GEOMETRY GENERATORS
// ═══════════════════════════════════════════════════════════

function genCuboid(p1, p2, fillMode) {
  const out = [];
  const x1 = Math.min(p1.x, p2.x), x2 = Math.max(p1.x, p2.x);
  const y1 = Math.min(p1.y, p2.y), y2 = Math.max(p1.y, p2.y);
  const z1 = Math.min(p1.z, p2.z), z2 = Math.max(p1.z, p2.z);

  for (let x = x1; x <= x2; x++)
    for (let y = y1; y <= y2; y++)
      for (let z = z1; z <= z2; z++) {
        if (fillMode === 0) {
          out.push({ x, y, z });
        } else if (fillMode === 1) {
          if (x === x1 || x === x2 || y === y1 || y === y2 || z === z1 || z === z2)
            out.push({ x, y, z });
        } else {
          if (x === x1 || x === x2 || z === z1 || z === z2)
            out.push({ x, y, z });
        }
      }
  return out;
}

function genFloor(p1, p2) {
  const out = [];
  const x1 = Math.min(p1.x, p2.x), x2 = Math.max(p1.x, p2.x);
  const z1 = Math.min(p1.z, p2.z), z2 = Math.max(p1.z, p2.z);
  for (let x = x1; x <= x2; x++)
    for (let z = z1; z <= z2; z++)
      out.push({ x, y: p1.y, z });
  return out;
}

function genLine(p1, p2) {
  const out = [];
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const dz = Math.abs(p2.z - p1.z);
  const steps = Math.max(dx, dy, dz);
  if (steps === 0) { out.push({ x: p1.x, y: p1.y, z: p1.z }); return out; }
  const ix = (p2.x - p1.x) / steps;
  const iy = (p2.y - p1.y) / steps;
  const iz = (p2.z - p1.z) / steps;
  const seen = new Set();
  for (let t = 0; t <= steps; t++) {
    const px = Math.round(p1.x + ix * t);
    const py = Math.round(p1.y + iy * t);
    const pz = Math.round(p1.z + iz * t);
    const key = `${px},${py},${pz}`;
    if (!seen.has(key)) { seen.add(key); out.push({ x: px, y: py, z: pz }); }
  }
  return out;
}

function genWall(p1, p2) {
  const out = [];
  const dx = Math.abs(p2.x - p1.x);
  const dz = Math.abs(p2.z - p1.z);
  const steps = Math.max(dx, dz, 1);
  const y1 = Math.min(p1.y, p2.y), y2 = Math.max(p1.y, p2.y);
  const ix = (p2.x - p1.x) / steps;
  const iz = (p2.z - p1.z) / steps;
  const seen = new Set();
  for (let t = 0; t <= steps; t++) {
    const px = Math.round(p1.x + ix * t);
    const pz = Math.round(p1.z + iz * t);
    const key = `${px},${pz}`;
    if (!seen.has(key)) {
      seen.add(key);
      for (let y = y1; y <= y2; y++) out.push({ x: px, y, z: pz });
    }
  }
  return out;
}

function genFrame(p1, p2) {
  const out = [];
  const x1 = Math.min(p1.x, p2.x), x2 = Math.max(p1.x, p2.x);
  const y1 = Math.min(p1.y, p2.y), y2 = Math.max(p1.y, p2.y);
  const z1 = Math.min(p1.z, p2.z), z2 = Math.max(p1.z, p2.z);
  const seen = new Set();
  function add(x, y, z) {
    const k = `${x},${y},${z}`;
    if (!seen.has(k)) { seen.add(k); out.push({ x, y, z }); }
  }
  for (let x = x1; x <= x2; x++) { add(x,y1,z1); add(x,y1,z2); add(x,y2,z1); add(x,y2,z2); }
  for (let y = y1; y <= y2; y++) { add(x1,y,z1); add(x1,y,z2); add(x2,y,z1); add(x2,y,z2); }
  for (let z = z1; z <= z2; z++) { add(x1,y1,z); add(x1,y2,z); add(x2,y1,z); add(x2,y2,z); }
  return out;
}

function genCircle(center, radius, axis, hollow, height = 1) {
  const out = [];
  const r2 = radius * radius;
  const ri2 = hollow ? (radius - 1) * (radius - 1) : -1;
  for (let a = -radius; a <= radius; a++)
    for (let b = -radius; b <= radius; b++) {
      const d = a * a + b * b;
      if (d > r2) continue;
      if (hollow && d < ri2) continue;
      for (let h = 0; h < height; h++) {
        if (axis === "y") out.push({ x: center.x + a, y: center.y + h, z: center.z + b });
        else if (axis === "x") out.push({ x: center.x + h, y: center.y + a, z: center.z + b });
        else out.push({ x: center.x + a, y: center.y + b, z: center.z + h });
      }
    }
  return out;
}

function genSphere(center, radius, hollow) {
  const out = [];
  const r2 = radius * radius;
  const ri2 = hollow ? (radius - 1) * (radius - 1) : -1;
  for (let x = -radius; x <= radius; x++)
    for (let y = -radius; y <= radius; y++)
      for (let z = -radius; z <= radius; z++) {
        const d = x * x + y * y + z * z;
        if (d > r2) continue;
        if (hollow && d < ri2) continue;
        out.push({ x: center.x + x, y: center.y + y, z: center.z + z });
      }
  return out;
}

function genPyramid(center, size, hollow) {
  const out = [];
  for (let layer = 0; layer < size; layer++) {
    const r = size - layer - 1;
    const y = center.y + layer;
    for (let x = -r; x <= r; x++)
      for (let z = -r; z <= r; z++) {
        if (hollow && layer < size - 1 && Math.abs(x) < r && Math.abs(z) < r) continue;
        out.push({ x: center.x + x, y, z: center.z + z });
      }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════
// DRAIN
// ═══════════════════════════════════════════════════════════
const LIQUID_TYPES = new Set([
  "minecraft:water", "minecraft:lava",
  "minecraft:flowing_water", "minecraft:flowing_lava",
]);

function executeDrain(player) {
  const st = getState(player);
  if (!st.p1 || !st.p2) return;

  st.building = true;
  const positions = genCuboid(st.p1, st.p2, 0);
  const dim = player.dimension;
  const undo = [];
  let drained = 0, i = 0;
  const total = positions.length;

  player.sendMessage(`§b💧 Drenando líquidos...`);
  playSound(player, "block.beehive.enter", 1.2);

  const id = system.runInterval(() => {
    const end = Math.min(i + BATCH_SIZE, total);
    for (; i < end; i++) {
      try {
        const block = dim.getBlock(positions[i]);
        if (block && LIQUID_TYPES.has(block.typeId)) {
          undo.push({ x: positions[i].x, y: positions[i].y, z: positions[i].z, old: block.typeId });
          block.setType("minecraft:air");
          drained++;
        }
      } catch {}
    }
    const pct = Math.floor((i / total) * 100);
    try { player.onScreenDisplay.setActionBar(`§b💧 Drenando... ${progressBar(pct)} §f${pct}%`); } catch {}
    if (i >= total) {
      system.clearRun(id);
      st.building = false;
      pushUndo(player, undo);
      player.sendMessage(`§a✓ ¡Listo! §f${drained} §abloques de líquido eliminados.`);
      playSound(player, "random.levelup", 1);
      resetMode(player);
    }
  }, 1);
}

// ═══════════════════════════════════════════════════════════
// HUD — Shows next action clearly
// ═══════════════════════════════════════════════════════════
system.runInterval(() => {
  for (const [name, st] of states) {
    if (st.mode === MODE.NONE && !st.building) continue;
    try {
      const players = world.getAllPlayers();
      let player = null;
      for (const p of players) { if (p.name === name) { player = p; break; } }
      if (!player) continue;

      // Don't overwrite progress bar during building
      if (st.building) continue;

      const info = MODE_INFO[st.mode];
      if (!info) continue;

      // Build a HUD line that tells the user WHAT TO DO NEXT
      let nextAction;
      if (info.need === 0) {
        nextAction = "§e→ Usa la vara mirando al destino";
      } else if (info.need === 1) {
        nextAction = st.p1 ? "§e→ Usa vara para configurar" : "§e→ Marca el centro";
      } else {
        if (!st.p1) nextAction = "§e→ Marca el Punto 1";
        else if (!st.p2) nextAction = "§e→ Marca el Punto 2";
        else nextAction = "§e→ Usa vara para configurar";
      }

      let mods = "";
      if (st.mirror.enabled) mods += " §d🪞";
      if (st.arrayRepeat.enabled) mods += " §b🔁";

      const bar = `${info.icon} ${info.name} §7| §f${shortName(st.blockType)}${mods} §7| ${nextAction}`;
      player.onScreenDisplay.setActionBar(bar);

      // Selection particles
      if (st.p1) {
        try { player.dimension.runCommand(`particle minecraft:basic_crit_particle ${st.p1.x} ${st.p1.y + 1} ${st.p1.z}`); } catch {}
      }
      if (st.p2) {
        try { player.dimension.runCommand(`particle minecraft:basic_crit_particle ${st.p2.x} ${st.p2.y + 1} ${st.p2.z}`); } catch {}
      }
    } catch {}
  }
}, HUD_TICKS);

// ═══════════════════════════════════════════════════════════
// WAND EVENT HANDLER
// ═══════════════════════════════════════════════════════════
world.beforeEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack?.typeId !== "miaddon:construction_wand") return;
  ev.cancel = true;
  const player = ev.source;
  const sneaking = player.isSneaking;
  system.run(() => {
    if (sneaking) pickBlock(player);
    else handleUse(player);
  });
});

function handleUse(player) {
  const st = getState(player);

  // Reject during active building
  if (st.building) {
    player.sendMessage("§c⏳ Espera, hay una operación en curso...");
    return;
  }

  // First use → welcome
  if (st.firstUse) {
    st.firstUse = false;
    showWelcome(player);
    return;
  }

  // No mode → main menu
  if (st.mode === MODE.NONE) {
    openWandMenu(player);
    return;
  }

  const info = MODE_INFO[st.mode];
  if (!info) { resetMode(player); openWandMenu(player); return; }

  // Looking at air with no points yet → go back to menu (reset mode)
  const block = getTargetBlock(player);
  if (!block && st.step === 0) {
    resetMode(player);
    openWandMenu(player);
    return;
  }

  // Paste
  if (st.mode === MODE.PASTE) { executePaste(player); return; }

  // Drain — auto-execute after P2
  if (st.mode === MODE.DRAIN) {
    if (st.step === 0) selectPoint(player, 1);
    else if (st.step === 1) selectPoint(player, 2);
    return;
  }

  // Copy — auto-execute after P2
  if (st.mode === MODE.COPY) {
    if (st.step === 0) selectPoint(player, 1);
    else if (st.step === 1) selectPoint(player, 2);
    return;
  }

  // Shape modes (1 point)
  if (info.need === 1) {
    if (st.step === 0) selectPoint(player, 1);
    else showShapeForm(player);
    return;
  }

  // 2-point modes
  if (st.step === 0) selectPoint(player, 1);
  else if (st.step === 1) selectPoint(player, 2);
  else showOperationForm(player);
}

// ── Pick Block / Cancel ──
function pickBlock(player) {
  const block = getTargetBlock(player);
  const st = getState(player);

  if (!block || block.typeId === "minecraft:air") {
    // Sneak + air = cancel current
    if (st.mode !== MODE.NONE) {
      const info = MODE_INFO[st.mode];
      resetMode(player);
      playSound(player, "mob.shulker.close", 0.8);
      player.sendMessage(`§7✗ ${info?.name ?? "Modo"} cancelado.`);
    } else {
      player.sendMessage("§7Agáchate mirando un bloque para seleccionar material.");
    }
    return;
  }

  st.blockType = block.typeId;
  playSound(player, "random.orb", 1.8);
  player.sendMessage(`§d🎯 Material seleccionado: §f${shortName(block.typeId)}`);
}

// ── Select Point — with step-by-step feedback ──
function selectPoint(player, num) {
  const block = getTargetBlock(player);
  if (!block) {
    player.sendMessage("§c✗ Mira a un bloque para marcar el punto.");
    return;
  }

  const st = getState(player);
  const info = MODE_INFO[st.mode];
  const p = { x: block.x, y: block.y, z: block.z };

  if (num === 1) {
    st.p1 = p;
    st.step = 1;
    playSound(player, "random.orb", 1.2);
    try { player.dimension.runCommand(`particle minecraft:endrod ${p.x} ${p.y + 1} ${p.z}`); } catch {}

    if (info.need === 1) {
      player.sendMessage(`${stepTag(1, info.steps)} §aCentro marcado: ${pos(p)}`);
      player.sendMessage(`§7  Usa la vara de nuevo para configurar.`);
    } else {
      player.sendMessage(`${stepTag(1, info.steps)} §aPunto 1 marcado: ${pos(p)}`);
      player.sendMessage(`§7  Ahora mira al segundo punto y usa la vara.`);
    }
  } else {
    st.p2 = p;
    st.step = 2;
    playSound(player, "random.orb", 1.5);
    try { player.dimension.runCommand(`particle minecraft:endrod ${p.x} ${p.y + 1} ${p.z}`); } catch {}

    const d = dimStr(st.p1, st.p2);

    // Auto-execute modes
    if (st.mode === MODE.COPY) {
      player.sendMessage(`${stepTag(2, 2)} §aPunto 2 marcado. §7Copiando región §e${d.str}§7...`);
      executeCopy(player);
      return;
    }
    if (st.mode === MODE.DRAIN) {
      player.sendMessage(`${stepTag(2, 2)} §aPunto 2 marcado. §7Drenando región §e${d.str}§7...`);
      executeDrain(player);
      return;
    }

    player.sendMessage(`${stepTag(2, info.steps)} §aPunto 2 marcado: ${pos(p)} §7— §e${d.str} §7(${d.total} bloques)`);
    player.sendMessage(`§7  Usa la vara de nuevo para configurar la operación.`);
  }
}

// ═══════════════════════════════════════════════════════════
// OPERATION FORMS (2-point modes)
// ═══════════════════════════════════════════════════════════
function showOperationForm(player) {
  const st = getState(player);
  if (!st.p1 || !st.p2) return;

  if (st.mode === MODE.REPLACE) { showReplaceForm(player); return; }

  const d = dimStr(st.p1, st.p2);
  const info = MODE_INFO[st.mode];
  const form = new ModalFormData();
  form.title(`${info.icon} ${info.name}`);

  let mods = "";
  if (st.mirror.enabled) mods += "\n§d🪞 Espejo activo";
  if (st.arrayRepeat.enabled) mods += `\n§b🔁 Repetir ×${st.arrayRepeat.count}`;

  form.textField(
    `§fRegión: §e${d.str} §7(${d.total} bloques)\n` +
    `§fP1: ${pos(st.p1)} → P2: ${pos(st.p2)}` +
    mods +
    `\n\n§fBloque:`,
    "stone",
    st.blockType
  );

  if (st.mode === MODE.FILL) {
    form.dropdown("§fTipo de relleno:", [
      "Sólido — todo lleno",
      "Hueco — caja cerrada",
      "Paredes — sin techo ni piso",
    ], 0);
  }

  form.show(player).then(res => {
    if (res.canceled) { resetMode(player); return; }
    system.run(() => {
      const blockType = normalizeBlock(res.formValues[0] || st.blockType);
      st.blockType = blockType;

      let positions;
      switch (st.mode) {
        case MODE.FILL:  positions = genCuboid(st.p1, st.p2, res.formValues[1] ?? 0); break;
        case MODE.FLOOR: positions = genFloor(st.p1, st.p2); break;
        case MODE.LINE:  positions = genLine(st.p1, st.p2); break;
        case MODE.WALL:  positions = genWall(st.p1, st.p2); break;
        case MODE.FRAME: positions = genFrame(st.p1, st.p2); break;
        default: return;
      }

      positions = applyModifiers(player, positions);
      player.sendMessage(`${stepTag(info.steps, info.steps)} §fPreparando §e${positions.length} §fbloques...`);
      confirmAndPlace(player, positions, blockType, () => resetMode(player));
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SHAPE FORMS (circle, sphere, cylinder, pyramid)
// ═══════════════════════════════════════════════════════════
function showShapeForm(player) {
  const st = getState(player);
  if (!st.p1) return;

  const info = MODE_INFO[st.mode];
  const form = new ModalFormData();
  form.title(`${info.icon} ${info.name}`);

  let mods = "";
  if (st.mirror.enabled) mods += "\n§d🪞 Espejo activo";
  if (st.arrayRepeat.enabled) mods += `\n§b🔁 Repetir ×${st.arrayRepeat.count}`;

  form.textField(
    `§fCentro: ${pos(st.p1)}` +
    mods +
    `\n\n§fBloque:`,
    "stone",
    st.blockType
  );
  form.slider("§fRadio / Tamaño", 1, 30, 1, 5);
  form.toggle("§fHueco", false);

  if (st.mode === MODE.CIRCLE) {
    form.dropdown("§fPlano", ["Horizontal (Y)", "Vertical N-S (X)", "Vertical E-O (Z)"], 0);
  } else if (st.mode === MODE.CYLINDER) {
    form.dropdown("§fEje", ["Vertical (Y)", "Norte-Sur (X)", "Este-Oeste (Z)"], 0);
    form.slider("§fAltura", 1, 50, 1, 10);
  }

  form.show(player).then(res => {
    if (res.canceled) { resetMode(player); return; }
    system.run(() => {
      const blockType = normalizeBlock(res.formValues[0] || st.blockType);
      const radius = res.formValues[1];
      const hollow = res.formValues[2];
      const axes = ["y", "x", "z"];
      st.blockType = blockType;

      let positions;
      if (st.mode === MODE.SPHERE)        positions = genSphere(st.p1, radius, hollow);
      else if (st.mode === MODE.CIRCLE)   positions = genCircle(st.p1, radius, axes[res.formValues[3]], hollow);
      else if (st.mode === MODE.CYLINDER) positions = genCircle(st.p1, radius, axes[res.formValues[3]], hollow, res.formValues[4]);
      else if (st.mode === MODE.PYRAMID)  positions = genPyramid(st.p1, radius, hollow);

      positions = applyModifiers(player, positions);
      player.sendMessage(`${stepTag(info.steps, info.steps)} §fPreparando §e${positions.length} §fbloques...`);
      confirmAndPlace(player, positions, blockType, () => resetMode(player));
    });
  });
}

// ═══════════════════════════════════════════════════════════
// REPLACE FORM
// ═══════════════════════════════════════════════════════════
function showReplaceForm(player) {
  const st = getState(player);
  const d = dimStr(st.p1, st.p2);

  const form = new ModalFormData();
  form.title("§5🔄 Reemplazar");
  form.textField(
    `§fRegión: §e${d.str} §7(${d.total} bloques)\n\n` +
    `§7Truco: Agáchate+clic un bloque para elegir material,\n` +
    `§7luego ese nombre aparecerá aquí.\n\n` +
    `§fBloque a buscar:`,
    "stone",
    "minecraft:stone"
  );
  form.textField("§fReemplazar por:", "gold_block", st.blockType);

  form.show(player).then(res => {
    if (res.canceled) { resetMode(player); return; }
    system.run(() => {
      const fromType = normalizeBlock(res.formValues[0]);
      const toType = normalizeBlock(res.formValues[1]);
      const positions = genCuboid(st.p1, st.p2, 0);
      replaceBulk(player, positions, fromType, toType);
      resetMode(player);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// COPY / PASTE
// ═══════════════════════════════════════════════════════════
function executeCopy(player) {
  const st = getState(player);
  if (!st.p1 || !st.p2) return;

  const dim = player.dimension;
  const x1 = Math.min(st.p1.x, st.p2.x), x2 = Math.max(st.p1.x, st.p2.x);
  const y1 = Math.min(st.p1.y, st.p2.y), y2 = Math.max(st.p1.y, st.p2.y);
  const z1 = Math.min(st.p1.z, st.p2.z), z2 = Math.max(st.p1.z, st.p2.z);

  const total = (x2 - x1 + 1) * (y2 - y1 + 1) * (z2 - z1 + 1);
  if (total > MAX_BLOCKS) {
    player.sendMessage(`§c✗ Región demasiado grande (${total}). Máximo: ${MAX_BLOCKS}.`);
    resetMode(player);
    return;
  }

  st.building = true;
  const blocks = [];
  const allPositions = [];
  for (let x = x1; x <= x2; x++)
    for (let y = y1; y <= y2; y++)
      for (let z = z1; z <= z2; z++)
        allPositions.push({ x, y, z });

  let i = 0;

  const id = system.runInterval(() => {
    const end = Math.min(i + BATCH_SIZE * 2, allPositions.length);
    for (; i < end; i++) {
      const { x, y, z } = allPositions[i];
      try {
        const b = dim.getBlock({ x, y, z });
        if (b && b.typeId !== "minecraft:air")
          blocks.push({ rx: x - x1, ry: y - y1, rz: z - z1, type: b.typeId });
      } catch {}
    }
    const pct = Math.floor((i / allPositions.length) * 100);
    try { player.onScreenDisplay.setActionBar(`§9📋 Copiando... ${progressBar(pct)} §f${pct}%`); } catch {}
    if (i >= allPositions.length) {
      system.clearRun(id);
      st.building = false;
      st.clipboard = {
        blocks,
        size: { x: x2 - x1 + 1, y: y2 - y1 + 1, z: z2 - z1 + 1 },
      };
      playSound(player, "random.orb", 2);
      player.sendMessage(
        `§a✓ ¡Copiados §e${blocks.length} §abloques! ` +
        `§7(${st.clipboard.size.x}×${st.clipboard.size.y}×${st.clipboard.size.z})`
      );
      player.sendMessage(`§7  Ve al menú y selecciona §9Pegar §7para colocarlos.`);
      resetMode(player);
    }
  }, 1);
}

function executePaste(player) {
  const st = getState(player);
  if (!st.clipboard) {
    player.sendMessage("§c✗ No hay nada en el portapapeles. Primero usa §9Copiar§c.");
    playSound(player, "note.bass", 0.5);
    resetMode(player);
    return;
  }

  const block = getTargetBlock(player);
  if (!block) {
    player.sendMessage("§c✗ Mira a un bloque destino para pegar.");
    return;
  }

  const base = { x: block.x, y: block.y, z: block.z };
  const clip = st.clipboard;

  const form = new ModalFormData();
  form.title("§9📋 Pegar");
  form.dropdown(
    `§e${clip.blocks.length} §fbloques §7(${clip.size.x}×${clip.size.y}×${clip.size.z})\n` +
    `§fDestino: ${pos(base)}\n\n§fRotación:`,
    ["0° — Original", "90° — Girar derecha", "180° — Invertir", "270° — Girar izquierda"],
    0
  );

  form.show(player).then(res => {
    if (res.canceled) { resetMode(player); return; }
    system.run(() => {
      const rotations = [0, 90, 180, 270];
      const rot = rotations[res.formValues[0]];
      const dim = player.dimension;
      const undo = [];
      let ii = 0;
      st.building = true;
      const total = clip.blocks.length;

      player.sendMessage(`§e⚡ Pegando §f${total} §ebloques...`);
      playSound(player, "block.beehive.enter", 1.2);

      const id = system.runInterval(() => {
        const end = Math.min(ii + BATCH_SIZE, total);
        for (; ii < end; ii++) {
          const b = clip.blocks[ii];
          let rx = b.rx, rz = b.rz;
          if (rot === 90)  { const t = rx; rx = rz; rz = -t; }
          if (rot === 180) { rx = -rx; rz = -rz; }
          if (rot === 270) { const t = rx; rx = -rz; rz = t; }
          const p = { x: base.x + rx, y: base.y + b.ry, z: base.z + rz };
          try {
            const existing = dim.getBlock(p);
            if (existing) {
              undo.push({ x: p.x, y: p.y, z: p.z, old: existing.typeId });
              existing.setType(b.type);
            }
          } catch {}
        }
        const pct = Math.floor((ii / total) * 100);
        try { player.onScreenDisplay.setActionBar(`§9📋 Pegando... ${progressBar(pct)} §f${pct}%`); } catch {}
        if (ii >= total) {
          system.clearRun(id);
          st.building = false;
          pushUndo(player, undo);
          player.sendMessage(`§a✓ ¡Listo! §f${total} §abloques pegados.`);
          playSound(player, "random.levelup", 1);
          resetMode(player);
        }
      }, 1);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// MAIN MENU — Categorized hub (max 7 buttons)
// ═══════════════════════════════════════════════════════════
function openWandMenu(player) {
  const st = getState(player);
  const block = shortName(st.blockType);
  const clip = st.clipboard ? `§a${st.clipboard.blocks.length}` : "§8—";
  const undoN = st.undoStack.length;

  let modLine = "";
  if (st.mirror.enabled) modLine += `§d🪞 Espejo §aON `;
  if (st.arrayRepeat.enabled) modLine += `§b🔁 Repetir §a×${st.arrayRepeat.count} `;
  if (!modLine) modLine = "§8Ninguno";

  const form = new ActionFormData();
  form.title("§6§l✦ EasyBuild ✦");
  form.body(
    `§fMaterial: §e${block}\n` +
    `§fDeshacer: §e${undoN}§7/${MAX_UNDO}  §fPortapapeles: ${clip}\n` +
    `§fModificadores: ${modLine}\n`
  );

  // Clean categorized layout — 7 buttons max
  form.button("§l§e🔨 Construcciones\n§r§7Relleno, Piso, Línea, Muro, Marco");   // 0
  form.button("§l§6🎨 Formas 3D\n§r§7Círculo, Esfera, Cilindro, Pirámide");      // 1
  form.button("§l§5🔧 Herramientas\n§r§7Reemplazar, Drenar, Copiar, Pegar");      // 2
  form.button(`§l§a↩ Deshacer\n§r§7${undoN > 0 ? `${undoN} operación(es) guardada(s)` : "Pila vacía"}`);  // 3

  // Quick repeat last mode
  const lastInfo = MODE_INFO[st.lastMode];
  if (lastInfo) {
    form.button(`§l§e⚡ Repetir: ${lastInfo.name}\n§r§7Reactivar el último modo usado`);  // 4
  } else {
    form.button("§l§8⚡ Repetir último\n§r§7Aún no has usado ningún modo");               // 4
  }

  form.button("§l§d⚙ Ajustes\n§r§7Espejo, Repetir, Tutorial");                   // 5
  form.button("§l§cCerrar");                                                       // 6

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      switch (res.selection) {
        case 0: openBuildMenu(player); break;
        case 1: openShapesMenu(player); break;
        case 2: openToolsMenu(player); break;
        case 3: performUndo(player); break;
        case 4:
          if (lastInfo) activateMode(player, st.lastMode);
          else player.sendMessage("§7Aún no has usado ningún modo.");
          break;
        case 5: openSettingsMenu(player); break;
        // 6 = cerrar
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SUB-MENU: Construcciones (5 modes + back)
// ═══════════════════════════════════════════════════════════
function openBuildMenu(player) {
  const form = new ActionFormData();
  form.title("§e§l🔨 Construcciones");
  form.body(
    `§fSelecciona una herramienta de construcción.\n` +
    `§7Todas necesitan marcar §e2 puntos §7(esquinas).\n`
  );

  form.button("§l§b📦 Relleno\n§r§7Cuboid sólido, hueco o paredes");              // 0
  form.button("§l§a⬛ Piso / Techo\n§r§7Capa plana entre 2 esquinas");             // 1
  form.button("§l§d📏 Línea\n§r§7Línea recta 3D entre 2 puntos");                  // 2
  form.button("§l§f🧱 Muro\n§r§7Pared vertical (funciona en diagonal)");           // 3
  form.button("§l§8🔲 Marco\n§r§7Solo las aristas — ideal para previsualizar");     // 4
  form.button("§7← Volver al menú");                                                // 5

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      const modes = [MODE.FILL, MODE.FLOOR, MODE.LINE, MODE.WALL, MODE.FRAME];
      if (res.selection < 5) activateMode(player, modes[res.selection]);
      else openWandMenu(player);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SUB-MENU: Formas 3D (4 modes + back)
// ═══════════════════════════════════════════════════════════
function openShapesMenu(player) {
  const form = new ActionFormData();
  form.title("§6§l🎨 Formas 3D");
  form.body(
    `§fFormas geométricas desde un punto centro.\n` +
    `§7Solo necesitas marcar §e1 punto §7(el centro).\n`
  );

  form.button("§l§6⭕ Círculo\n§r§7Disco plano en cualquier orientación");         // 0
  form.button("§l§c🔴 Esfera\n§r§7Esfera sólida o hueca");                         // 1
  form.button("§l§3🏛 Cilindro\n§r§7Torre circular con altura");                   // 2
  form.button("§l§e🔺 Pirámide\n§r§7Pirámide escalonada, sólida o hueca");         // 3
  form.button("§7← Volver al menú");                                                // 4

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      const modes = [MODE.CIRCLE, MODE.SPHERE, MODE.CYLINDER, MODE.PYRAMID];
      if (res.selection < 4) activateMode(player, modes[res.selection]);
      else openWandMenu(player);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SUB-MENU: Herramientas (4 modes + back)
// ═══════════════════════════════════════════════════════════
function openToolsMenu(player) {
  const st = getState(player);
  const clip = st.clipboard
    ? `§a${st.clipboard.blocks.length} bloques`
    : "§8vacío";

  const form = new ActionFormData();
  form.title("§5§l🔧 Herramientas");
  form.body(
    `§fHerramientas de edición de terreno.\n` +
    `§fPortapapeles: ${clip}\n`
  );

  form.button("§l§5🔄 Reemplazar\n§r§7Cambia un tipo de bloque por otro");         // 0
  form.button("§l§b💧 Drenar\n§r§7Elimina agua y lava de una región");              // 1
  form.button("§l§9📋 Copiar\n§r§7Guarda una región en el portapapeles");           // 2
  form.button(`§l§9📋 Pegar\n§r§7${st.clipboard ? "Pega con rotación" : "No hay nada copiado"}`);  // 3
  form.button("§7← Volver al menú");                                                // 4

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      switch (res.selection) {
        case 0: activateMode(player, MODE.REPLACE); break;
        case 1: activateMode(player, MODE.DRAIN); break;
        case 2: activateMode(player, MODE.COPY); break;
        case 3: activatePaste(player); break;
        case 4: openWandMenu(player); break;
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SUB-MENU: Ajustes (modifiers, structures, tutorial)
// ═══════════════════════════════════════════════════════════
function openSettingsMenu(player) {
  const st = getState(player);
  const mirrorSt = st.mirror.enabled
    ? `§a ON §7(${st.mirror.axis === "both" ? "Ambos ejes" : "Eje " + st.mirror.axis.toUpperCase()})`
    : "§8 OFF";
  const arraySt = st.arrayRepeat.enabled
    ? `§a ON §7(×${st.arrayRepeat.count})`
    : "§8 OFF";

  const form = new ActionFormData();
  form.title("§d§l⚙ Ajustes");
  form.body(
    `§fConfigura modificadores y accede a extras.\n\n` +
    `§d🪞 Espejo: ${mirrorSt}\n` +
    `§b🔁 Repetir: ${arraySt}\n`
  );

  form.button("§l§d🪞 Espejo\n§r§7Simetría automática al construir");              // 0
  form.button("§l§b🔁 Repetir / Array\n§r§7Duplicar la construcción N veces");      // 1
  form.button("§l§6🏛 Estructuras Bíblicas\n§r§7Construcciones prefabricadas");      // 2
  form.button("§l§e📖 Tutorial\n§r§7Aprende a usar EasyBuild paso a paso");         // 3
  form.button("§7← Volver al menú");                                                // 4

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      switch (res.selection) {
        case 0: showMirrorForm(player); break;
        case 1: showArrayForm(player); break;
        case 2: openBiblicalMenu(player); break;
        case 3: showTutorial(player, 0); break;
        case 4: openWandMenu(player); break;
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// MODIFIER FORMS
// ═══════════════════════════════════════════════════════════
function showMirrorForm(player) {
  const st = getState(player);
  const axisIdx = st.mirror.axis === "x" ? 0 : st.mirror.axis === "z" ? 1 : 2;

  const form = new ModalFormData();
  form.title("§d🪞 Espejo");
  form.toggle("§fActivar espejo", st.mirror.enabled);
  form.dropdown("§fEje de simetría:", [
    "X — reflejo Este-Oeste",
    "Z — reflejo Norte-Sur",
    "Ambos — 4 copias simétricas",
  ], axisIdx);

  form.show(player).then(res => {
    if (res.canceled) { openSettingsMenu(player); return; }
    system.run(() => {
      const enabled = res.formValues[0];
      const axes = ["x", "z", "both"];
      st.mirror.enabled = enabled;
      st.mirror.axis = axes[res.formValues[1]];

      if (enabled) {
        const block = getTargetBlock(player);
        if (block) {
          st.mirror.center = { x: block.x, y: block.y, z: block.z };
        } else {
          const loc = player.location;
          st.mirror.center = { x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z) };
        }
        playSound(player, "random.orb", 1.5);
        player.sendMessage(`§d🪞 Espejo §aactivado§f. Centro: ${pos(st.mirror.center)}`);
      } else {
        player.sendMessage("§d🪞 Espejo §cdesactivado§f.");
      }
      openSettingsMenu(player);
    });
  });
}

function showArrayForm(player) {
  const st = getState(player);

  const form = new ModalFormData();
  form.title("§b🔁 Repetir / Array");
  form.toggle("§fActivar repetición", st.arrayRepeat.enabled);
  form.slider("§fNúmero de copias", 2, 10, 1, Math.max(2, st.arrayRepeat.count));
  form.dropdown("§fDirección:", [
    "Este (+X)",  "Oeste (−X)",
    "Arriba (+Y)", "Abajo (−Y)",
    "Sur (+Z)",   "Norte (−Z)",
  ], 0);
  form.slider("§fDistancia entre copias", 1, 50, 1, 10);

  form.show(player).then(res => {
    if (res.canceled) { openSettingsMenu(player); return; }
    system.run(() => {
      st.arrayRepeat.enabled = res.formValues[0];
      st.arrayRepeat.count = res.formValues[1];

      const dirs = [
        { x: 1, y: 0, z: 0 },  { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },  { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },  { x: 0, y: 0, z: -1 },
      ];
      const dir = dirs[res.formValues[2]];
      const dist = res.formValues[3];
      st.arrayRepeat.offset = { x: dir.x * dist, y: dir.y * dist, z: dir.z * dist };

      if (st.arrayRepeat.enabled) {
        const o = st.arrayRepeat.offset;
        playSound(player, "random.orb", 1.5);
        player.sendMessage(`§b🔁 Repetir §aactivado§f: §e${st.arrayRepeat.count} copias §7cada (${o.x}, ${o.y}, ${o.z})`);
      } else {
        player.sendMessage("§b🔁 Repetir §cdesactivado§f.");
      }
      openSettingsMenu(player);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// MODE ACTIVATION — step-by-step guidance
// ═══════════════════════════════════════════════════════════
function activateMode(player, mode) {
  const st = getState(player);
  st.mode = mode;
  resetPoints(st);
  const info = MODE_INFO[mode];

  playSound(player, "block.beehive.enter", 1.5);
  player.sendMessage(`§e⚡ ${info.icon} ${info.name} §factivado`);

  // Give contextual first-step instruction
  if (info.need === 0) {
    player.sendMessage(`${stepTag(1, info.steps)} §fMira al destino y usa la vara.`);
  } else if (info.need === 1) {
    player.sendMessage(`${stepTag(1, info.steps)} §fMira al bloque centro y usa la vara.`);
  } else {
    player.sendMessage(`${stepTag(1, info.steps)} §fMira a la primera esquina y usa la vara.`);
  }
  player.sendMessage(`§7  Cancelar: agáchate + clic al aire`);
}

function activatePaste(player) {
  const st = getState(player);
  if (!st.clipboard) {
    player.sendMessage("§c✗ No hay nada en el portapapeles. Usa §9Copiar §cprimero.");
    playSound(player, "note.bass", 0.5);
    return;
  }
  st.mode = MODE.PASTE;
  resetPoints(st);
  playSound(player, "block.beehive.enter", 1.5);
  player.sendMessage(`§e⚡ §9📋 Pegar §factivado`);
  player.sendMessage(`${stepTag(1, 1)} §fMira donde quieres pegar y usa la vara.`);
}

// ═══════════════════════════════════════════════════════════
// WELCOME SCREEN
// ═══════════════════════════════════════════════════════════
function showWelcome(player) {
  const form = new MessageFormData();
  form.title("§6§l✦ Bienvenido a EasyBuild ✦");
  form.body(
    `§fLa §eVara de Construcción §fes tu herramienta\n` +
    `§fpara construir lo que imagines.\n\n` +
    `§6§l¿Cómo funciona?\n\n` +
    `§e1. §fUsa la vara §7→ Se abre el menú\n` +
    `§e2. §fElige una herramienta §7→ Se activa\n` +
    `§e3. §fMarca los puntos §7→ Mira al bloque + usar vara\n` +
    `§e4. §fConfigura §7→ Se abre un formulario\n` +
    `§e5. §f¡Listo! §7→ Se construye con barra de progreso\n\n` +
    `§6§lControles rápidos:\n` +
    `§e▸ §fAgáchate + clic bloque §7= Elegir material\n` +
    `§e▸ §fAgáchate + clic al aire §7= Cancelar\n`
  );
  form.button1("§a¡Entendido!");
  form.button2("§e📖 Tutorial completo");

  form.show(player).then(res => {
    system.run(() => {
      if (res.selection === 0) openWandMenu(player);
      else showTutorial(player, 0);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// TUTORIAL (8 pages — updated for new UI)
// ═══════════════════════════════════════════════════════════
const TUTORIAL = [
  {
    title: "§e§l📖 1/8 — Controles Básicos",
    body:
      `§6§lTres acciones con la vara:\n\n` +
      `§e▸ Usar §f(sin modo activo)\n` +
      `§7  Abre el menú principal\n\n` +
      `§e▸ Agáchate + usar §fmirando a un bloque\n` +
      `§7  Selecciona ese bloque como material\n\n` +
      `§e▸ Agáchate + usar §fmirando al aire\n` +
      `§7  Cancela el modo actual\n\n` +
      `§6§lDurante un modo activo:\n\n` +
      `§e▸ Usar la vara §fmirando a un bloque\n` +
      `§7  Marca un punto (P1/P2/Centro)\n\n` +
      `§b§lTip: §r§fEl material se guarda entre operaciones.`,
  },
  {
    title: "§b§l📖 2/8 — Menú Principal",
    body:
      `§6§lEl menú tiene 4 secciones:\n\n` +
      `§e🔨 Construcciones\n` +
      `§7  Relleno, Piso, Línea, Muro, Marco\n` +
      `§7  → Necesitan 2 puntos (esquinas)\n\n` +
      `§6🎨 Formas 3D\n` +
      `§7  Círculo, Esfera, Cilindro, Pirámide\n` +
      `§7  → Necesitan 1 punto (centro)\n\n` +
      `§5🔧 Herramientas\n` +
      `§7  Reemplazar, Drenar, Copiar, Pegar\n\n` +
      `§d⚙ Ajustes\n` +
      `§7  Espejo, Repetir, Tutorial, Estructuras\n\n` +
      `§e⚡ Repetir último §7— reactivar modo anterior`,
  },
  {
    title: "§e§l📖 3/8 — Construcciones",
    body:
      `§b📦 §lRelleno §r— Cuboid entre 2 puntos\n` +
      `§7  Sólido, hueco o solo paredes\n\n` +
      `§a⬛ §lPiso/Techo §r— Capa horizontal\n` +
      `§7  La altura es siempre la del Punto 1\n\n` +
      `§d📏 §lLínea §r— Recta 3D entre 2 puntos\n` +
      `§7  Funciona en diagonal\n\n` +
      `§f🧱 §lMuro §r— Pared vertical\n` +
      `§7  Sigue la diagonal P1→P2, rellena en Y\n\n` +
      `§8🔲 §lMarco §r— 12 aristas del cuboid\n` +
      `§7  Ideal para ver el tamaño antes de rellenar\n\n` +
      `§b§lTip: §r§fMuro + Piso = habitación rápida`,
  },
  {
    title: "§6§l📖 4/8 — Formas 3D",
    body:
      `§6⭕ §lCírculo §r— Disco plano\n` +
      `§7  Elige plano: horizontal/vertical\n\n` +
      `§c🔴 §lEsfera §r— Bola 3D\n` +
      `§7  Sólida o hueca (cúpula/burbuja)\n\n` +
      `§3🏛 §lCilindro §r— Torre circular\n` +
      `§7  Elige eje y altura, sólido o hueco\n\n` +
      `§e🔺 §lPirámide §r— Escalonada\n` +
      `§7  Tamaño = capas. Sólida o hueca\n` +
      `§7  Tamaño 10 → base de 19×19\n\n` +
      `§b§lTip: §r§fTodas permiten elegir radio,\n` +
      `§7si es hueca, y el bloque a usar.`,
  },
  {
    title: "§5§l📖 5/8 — Herramientas",
    body:
      `§5🔄 §lReemplazar §r— Cambia bloques en masa\n` +
      `§7  Marca 2 esquinas, elige "de" y "a"\n` +
      `§7  Tip: "air" como destino = borrar\n\n` +
      `§b💧 §lDrenar §r— Elimina líquidos\n` +
      `§7  Marca 2 esquinas, se ejecuta solo\n` +
      `§7  Elimina agua y lava en la región\n\n` +
      `§9📋 §lCopiar §r— Guarda región\n` +
      `§7  Marca 2 esquinas → portapapeles\n\n` +
      `§9📋 §lPegar §r— Coloca la copia\n` +
      `§7  Mira al destino, elige rotación\n` +
      `§7  (0°, 90°, 180°, 270°)\n\n` +
      `§7Los líquidos y bloques se pueden §adeshacer§7.`,
  },
  {
    title: "§d§l📖 6/8 — Espejo y Repetir",
    body:
      `§d🪞 §lEspejo§r — Simetría al construir\n\n` +
      `§e1. §fVe a §d⚙ Ajustes §f→ §d🪞 Espejo\n` +
      `§e2. §fActiva y elige eje:\n` +
      `§7  • X = reflejo Este-Oeste\n` +
      `§7  • Z = reflejo Norte-Sur\n` +
      `§7  • Ambos = 4 copias\n` +
      `§e3. §fMira al bloque centro\n` +
      `§e4. §fConstruye — ¡se espeja solo!\n\n` +
      `§b🔁 §lRepetir / Array§r — Clonar en línea\n\n` +
      `§e1. §fVe a §d⚙ Ajustes §f→ §b🔁 Repetir\n` +
      `§e2. §fElige copias, dirección y distancia\n` +
      `§e3. §fConstruye — ¡se repite solo!\n\n` +
      `§b§lEjemplo: §r§f3 columnas cada 5 bloques\n` +
      `§7→ Copias: 3, Este, Distancia: 5`,
  },
  {
    title: "§a§l📖 7/8 — Flujo de Trabajo",
    body:
      `§6§lPasos para CUALQUIER operación:\n\n` +
      `§e1. §fElige tu material\n` +
      `§7   Agáchate + clic en el bloque deseado\n\n` +
      `§e2. §fAbre menú → elige herramienta\n` +
      `§7   Se activa y te dice qué hacer\n\n` +
      `§e3. §fSigue los pasos §8[1/3] [2/3] [3/3]\n` +
      `§7   Cada paso te guía en el chat y el HUD\n\n` +
      `§e4. §fConfigura en el formulario\n` +
      `§7   Si son >1000 bloques, pide confirmación\n\n` +
      `§e5. §fEspera la barra de progreso\n` +
      `§7   ████████░░░░ 67%\n\n` +
      `§e6. §fSi algo sale mal → §a↩ Deshacer\n`,
  },
  {
    title: "§e§l📖 8/8 — Tips Avanzados",
    body:
      `§6§l★ Atajos útiles:\n\n` +
      `§e⚡ Repetir último §7— Reactivar modo previo\n` +
      `§7  Sin navegar por los menús otra vez\n\n` +
      `§6§l★ Combinaciones poderosas:\n\n` +
      `§7• Marco → ver tamaño → Relleno → construir\n` +
      `§7• Muro + Piso = cuarto rápido\n` +
      `§7• Esfera hueca = cúpula perfecta\n` +
      `§7• Espejo Ambos + Cilindro = templo simétrico\n` +
      `§7• Repetir + Línea = columnas equidistantes\n` +
      `§7• Drenar + Reemplazar = transformar lagos\n\n` +
      `§6§l★ No olvides:\n\n` +
      `§7• "air" = borrar bloques\n` +
      `§7• "water" / "lava" = llenar de líquido\n` +
      `§7• §6🏛 Estructuras Bíblicas §7en Ajustes\n` +
      `§7  Arca de Noé, Templo, Torre de Babel...`,
  },
];

function showTutorial(player, page) {
  const t = TUTORIAL[page];
  const form = new MessageFormData();
  form.title(t.title);
  form.body(t.body);

  if (page < TUTORIAL.length - 1) {
    form.button1("§aSiguiente →");
    form.button2(page > 0 ? "§7← Anterior" : "§cCerrar");
  } else {
    form.button1("§a¡Listo! Abrir menú");
    form.button2("§7← Anterior");
  }

  form.show(player).then(res => {
    system.run(() => {
      if (page < TUTORIAL.length - 1) {
        if (res.selection === 0) showTutorial(player, page + 1);
        else if (page > 0) showTutorial(player, page - 1);
      } else {
        if (res.selection === 0) openWandMenu(player);
        else showTutorial(player, page - 1);
      }
    });
  });
}
