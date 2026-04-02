// construction_wand.js — EasyBuild v4: Full Feature Pack
// @minecraft/server 1.12.0 + @minecraft/server-ui 1.3.0

import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
import { openBiblicalMenu } from "./construction_menu.js";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const MAX_BLOCKS        = 80000;
const MAX_UNDO          = 10;
const BATCH_SIZE        = 120;
const HUD_TICKS         = 20;
const CONFIRM_THRESHOLD = 1000;
const MAX_LOG           = 20;
const MAX_SCHEMATICS    = 10;
const PALETTE_SLOTS     = 5;
const BBOX_PARTICLE     = "minecraft:basic_flame_particle";
const CELE_PARTICLE     = "minecraft:totem_particle";

const MODE = {
  NONE: 0,    FILL: 1,    FLOOR: 2,    LINE: 3,
  CIRCLE: 4,  SPHERE: 5,  CYLINDER: 6, REPLACE: 7,
  COPY: 8,    PASTE: 9,   WALL: 10,    PYRAMID: 11,
  FRAME: 12,  DRAIN: 13,  BRUSH: 14,   MEASURE: 15,
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
  [MODE.BRUSH]:    { icon: "§a🖌", name: "Brocha",      need: 0, cat: "tool",   steps: 1, hint: "Pinta bloques al caminar" },
  [MODE.MEASURE]:  { icon: "§e📐", name: "Medir",       need: 2, cat: "tool",   steps: 2, hint: "Mide distancias y volúmenes" },
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
      redoStack: [],
      firstUse: true,
      lastMode: MODE.NONE,
      building: false,
      mirror:      { enabled: false, axis: "x", center: null },
      arrayRepeat: { enabled: false, count: 2, offset: { x: 10, y: 0, z: 0 } },
      palette: [
        "minecraft:stone", "minecraft:oak_planks", "minecraft:cobblestone",
        "minecraft:glass", "minecraft:quartz_block",
      ],
      pattern: { type: "single", blocks: [] },
      brushRadius: 2,
      brushActive: false,
      brushInterval: null,
      brushLastPos: null,
      brushUndoBatch: [],
      operationsLog: [],
      loaded: false,
    });
    loadPlayerState(player);
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
  if (st.brushActive) stopBrush(player);
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

function distance3D(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function progressBar(pct) {
  const filled = Math.round(pct / 5);
  return "§a" + "█".repeat(filled) + "§7" + "░".repeat(20 - filled);
}

function stepTag(current, total) {
  return `§8[§a${current}§8/§7${total}§8]`;
}

function spawnParticle(dim, x, y, z, particle) {
  try { dim.runCommand(`particle ${particle || BBOX_PARTICLE} ${x} ${y} ${z}`); } catch {}
}

function celebrationParticles(player, positions) {
  if (positions.length === 0) return;
  const dim = player.dimension;
  const mid = positions[Math.floor(positions.length / 2)];
  for (let i = 0; i < 10; i++) {
    const ox = Math.random() * 6 - 3, oz = Math.random() * 6 - 3;
    spawnParticle(dim, mid.x + ox, mid.y + 1 + Math.random() * 3, mid.z + oz, CELE_PARTICLE);
  }
}

// ═══════════════════════════════════════════════════════════
// PERSISTENCE — DynamicProperties (save/load per player)
// ═══════════════════════════════════════════════════════════
function savePlayerState(player) {
  const st = states.get(player.name);
  if (!st) return;
  try {
    player.setDynamicProperty("eb:blockType", st.blockType);
    player.setDynamicProperty("eb:mirror", JSON.stringify({
      enabled: st.mirror.enabled, axis: st.mirror.axis,
    }));
    player.setDynamicProperty("eb:array", JSON.stringify({
      enabled: st.arrayRepeat.enabled,
      count: st.arrayRepeat.count,
      offset: st.arrayRepeat.offset,
    }));
    player.setDynamicProperty("eb:palette", JSON.stringify(st.palette));
    player.setDynamicProperty("eb:pattern", JSON.stringify(st.pattern));
    player.setDynamicProperty("eb:brushRadius", st.brushRadius);
    player.setDynamicProperty("eb:firstUse", st.firstUse);
  } catch {}
}

function loadPlayerState(player) {
  const st = states.get(player.name);
  if (!st || st.loaded) return;
  st.loaded = true;
  try {
    const bt = player.getDynamicProperty("eb:blockType");
    if (typeof bt === "string") st.blockType = bt;

    const mir = player.getDynamicProperty("eb:mirror");
    if (typeof mir === "string") {
      const m = JSON.parse(mir);
      st.mirror.enabled = m.enabled ?? false;
      st.mirror.axis = m.axis ?? "x";
    }

    const arr = player.getDynamicProperty("eb:array");
    if (typeof arr === "string") {
      const a = JSON.parse(arr);
      st.arrayRepeat.enabled = a.enabled ?? false;
      st.arrayRepeat.count = a.count ?? 2;
      st.arrayRepeat.offset = a.offset ?? { x: 10, y: 0, z: 0 };
    }

    const pal = player.getDynamicProperty("eb:palette");
    if (typeof pal === "string") st.palette = JSON.parse(pal);

    const pat = player.getDynamicProperty("eb:pattern");
    if (typeof pat === "string") st.pattern = JSON.parse(pat);

    const br = player.getDynamicProperty("eb:brushRadius");
    if (typeof br === "number") st.brushRadius = br;

    const fu = player.getDynamicProperty("eb:firstUse");
    if (typeof fu === "boolean") st.firstUse = fu;
  } catch {}
}

// ═══════════════════════════════════════════════════════════
// NAMED SCHEMATICS — world-level DynamicProperties
// ═══════════════════════════════════════════════════════════
function getSchematicNames() {
  try {
    const raw = world.getDynamicProperty("eb:sch:list");
    return typeof raw === "string" ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSchematicData(name, clipboard) {
  try {
    const data = JSON.stringify(clipboard);
    if (data.length > 30000) return false;
    world.setDynamicProperty(`eb:sch:${name}`, data);
    const names = getSchematicNames();
    if (!names.includes(name)) {
      if (names.length >= MAX_SCHEMATICS) return false;
      names.push(name);
      world.setDynamicProperty("eb:sch:list", JSON.stringify(names));
    }
    return true;
  } catch { return false; }
}

function loadSchematicData(name) {
  try {
    const raw = world.getDynamicProperty(`eb:sch:${name}`);
    return typeof raw === "string" ? JSON.parse(raw) : null;
  } catch { return null; }
}

function deleteSchematicData(name) {
  try {
    world.setDynamicProperty(`eb:sch:${name}`, undefined);
    const names = getSchematicNames().filter(n => n !== name);
    world.setDynamicProperty("eb:sch:list", JSON.stringify(names));
    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════
// OPERATIONS LOG
// ═══════════════════════════════════════════════════════════
function logOperation(player, modeName, blockCount, region) {
  const st = getState(player);
  st.operationsLog.push({
    mode: modeName,
    blocks: blockCount,
    region: region || "—",
    time: new Date().toLocaleTimeString(),
  });
  if (st.operationsLog.length > MAX_LOG) st.operationsLog.shift();
}

// ═══════════════════════════════════════════════════════════
// UNDO + REDO SYSTEM
// ═══════════════════════════════════════════════════════════
function pushUndo(player, entries) {
  const st = getState(player);
  if (entries.length === 0) return;
  st.undoStack.push(entries);
  if (st.undoStack.length > MAX_UNDO) st.undoStack.shift();
  st.redoStack = [];
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
  const redoEntries = [];

  player.sendMessage(`§e↩ Deshaciendo §f${total} §ebloques...`);

  const id = system.runInterval(() => {
    const end = Math.min(i + BATCH_SIZE, total);
    for (; i < end; i++) {
      try {
        const block = dim.getBlock(entries[i]);
        if (block) {
          redoEntries.push({ x: entries[i].x, y: entries[i].y, z: entries[i].z, old: block.typeId });
          block.setType(entries[i].old);
        }
      } catch {}
    }
    const pct = Math.floor((i / total) * 100);
    try { player.onScreenDisplay.setActionBar(`§e↩ Deshaciendo... ${progressBar(pct)} §f${pct}%`); } catch {}
    if (i >= total) {
      system.clearRun(id);
      st.building = false;
      st.redoStack.push(redoEntries);
      if (st.redoStack.length > MAX_UNDO) st.redoStack.shift();
      player.sendMessage(`§a✓ Deshecho. §7(${st.undoStack.length} undo, ${st.redoStack.length} redo)`);
      playSound(player, "mob.shulker.close");
      logOperation(player, "Deshacer", total, "");
    }
  }, 1);
}

function performRedo(player) {
  const st = getState(player);
  if (st.redoStack.length === 0) {
    player.sendMessage("§c✗ Nada que rehacer.");
    playSound(player, "note.bass", 0.5);
    return;
  }
  const entries = st.redoStack.pop();
  const dim = player.dimension;
  let i = 0;
  const total = entries.length;
  st.building = true;
  const undoEntries = [];

  player.sendMessage(`§e↪ Rehaciendo §f${total} §ebloques...`);

  const id = system.runInterval(() => {
    const end = Math.min(i + BATCH_SIZE, total);
    for (; i < end; i++) {
      try {
        const block = dim.getBlock(entries[i]);
        if (block) {
          undoEntries.push({ x: entries[i].x, y: entries[i].y, z: entries[i].z, old: block.typeId });
          block.setType(entries[i].old);
        }
      } catch {}
    }
    const pct = Math.floor((i / total) * 100);
    try { player.onScreenDisplay.setActionBar(`§e↪ Rehaciendo... ${progressBar(pct)} §f${pct}%`); } catch {}
    if (i >= total) {
      system.clearRun(id);
      st.building = false;
      st.undoStack.push(undoEntries);
      if (st.undoStack.length > MAX_UNDO) st.undoStack.shift();
      player.sendMessage(`§a✓ Rehecho. §7(${st.undoStack.length} undo, ${st.redoStack.length} redo)`);
      playSound(player, "random.levelup", 1);
      logOperation(player, "Rehacer", total, "");
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
// PATTERN SYSTEM — multi-block placement
// ═══════════════════════════════════════════════════════════
function resolveBlockType(st, x, y, z, index, total, defaultType) {
  const pat = st.pattern;
  if (pat.type === "single" || !pat.blocks || pat.blocks.length === 0) return defaultType;
  const blocks = pat.blocks;
  switch (pat.type) {
    case "random":
      return blocks[Math.floor(Math.random() * blocks.length)];
    case "checkerboard":
      return blocks[(Math.abs(x) + Math.abs(y) + Math.abs(z)) % blocks.length];
    case "gradient": {
      const idx = Math.min(Math.floor((index / Math.max(total, 1)) * blocks.length), blocks.length - 1);
      return blocks[idx];
    }
    default:
      return defaultType;
  }
}

// ═══════════════════════════════════════════════════════════
// BLOCK PLACEMENT ENGINE — with patterns, celebration, log
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
          const actualType = resolveBlockType(st, p.x, p.y, p.z, i, total, blockType);
          block.setType(actualType);
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
      celebrationParticles(player, positions);
      logOperation(player, MODE_INFO[st.mode]?.name ?? "Colocar", placed,
        st.p1 && st.p2 ? dimStr(st.p1, st.p2).str : `${placed} bloques`);
      if (callback) callback();
    }
  }, 1);
}

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
      celebrationParticles(player, positions);
      logOperation(player, "Reemplazar", replaced,
        st.p1 && st.p2 ? dimStr(st.p1, st.p2).str : "");
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
      logOperation(player, "Drenar", drained, dimStr(st.p1, st.p2).str);
      resetMode(player);
    }
  }, 1);
}

// ═══════════════════════════════════════════════════════════
// BRUSH MODE — paint blocks while walking
// ═══════════════════════════════════════════════════════════
function startBrush(player) {
  const st = getState(player);
  const playerName = player.name;
  st.brushActive = true;
  st.brushLastPos = null;
  st.brushUndoBatch = [];

  player.sendMessage(`§a🖌 Brocha §l§aACTIVA §r§7(radio ${st.brushRadius}) — §aCamina para pintar`);
  player.sendMessage(`§7  Agáchate + aire para detener`);
  playSound(player, "block.beehive.enter", 1.5);

  st.brushInterval = system.runInterval(() => {
    const s = states.get(playerName);
    if (!s || !s.brushActive) {
      if (s?.brushInterval) { system.clearRun(s.brushInterval); s.brushInterval = null; }
      return;
    }

    let p = null;
    for (const pl of world.getAllPlayers()) {
      if (pl.name === playerName) { p = pl; break; }
    }
    if (!p) {
      s.brushActive = false;
      if (s.brushInterval) { system.clearRun(s.brushInterval); s.brushInterval = null; }
      return;
    }

    const loc = p.location;
    const bx = Math.floor(loc.x), by = Math.floor(loc.y) - 1, bz = Math.floor(loc.z);
    const key = `${bx},${by},${bz}`;
    if (s.brushLastPos === key) return;
    s.brushLastPos = key;

    const dim = p.dimension;
    const r = s.brushRadius;

    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        if (dx * dx + dz * dz > r * r) continue;
        const px = bx + dx, pz = bz + dz;
        try {
          const block = dim.getBlock({ x: px, y: by, z: pz });
          if (block && block.typeId !== "minecraft:air") {
            s.brushUndoBatch.push({ x: px, y: by, z: pz, old: block.typeId });
            const type = resolveBlockType(s, px, by, pz, 0, 1, s.blockType);
            block.setType(type);
          }
        } catch {}
      }
  }, 2);
}

function stopBrush(player) {
  const st = states.get(player.name);
  if (!st) return;
  st.brushActive = false;
  if (st.brushInterval) {
    system.clearRun(st.brushInterval);
    st.brushInterval = null;
  }
  if (st.brushUndoBatch.length > 0) {
    st.undoStack.push(st.brushUndoBatch);
    if (st.undoStack.length > MAX_UNDO) st.undoStack.shift();
    st.redoStack = [];
    const count = st.brushUndoBatch.length;
    st.brushUndoBatch = [];
    player.sendMessage(`§a🖌 Brocha detenida. §7${count} bloques pintados.`);
    logOperation(player, "Brocha", count, `radio ${st.brushRadius}`);
  } else {
    player.sendMessage(`§7🖌 Brocha detenida.`);
  }
  playSound(player, "mob.shulker.close", 0.8);
}

// ═══════════════════════════════════════════════════════════
// MEASURE MODE — show distances without building
// ═══════════════════════════════════════════════════════════
function executeMeasure(player) {
  const st = getState(player);
  if (!st.p1 || !st.p2) return;

  const d = dimStr(st.p1, st.p2);
  const dist = distance3D(st.p1, st.p2).toFixed(1);
  const surface = 2 * (d.dx * d.dy + d.dy * d.dz + d.dx * d.dz);

  player.sendMessage(
    `§e📐 §l=== Medición ===\n` +
    `§fDimensiones: §e${d.str}\n` +
    `§fDistancia: §e${dist} §7bloques\n` +
    `§fVolumen: §e${d.total} §7bloques\n` +
    `§fSuperficie: §e${surface} §7bloques\n` +
    `§fP1: ${pos(st.p1)}\n` +
    `§fP2: ${pos(st.p2)}`
  );
  playSound(player, "random.orb", 1.5);
  logOperation(player, "Medir", 0, `${d.str} (${dist}m)`);
  resetMode(player);
}

// ═══════════════════════════════════════════════════════════
// BOUNDING BOX PARTICLES — draw selection edges
// ═══════════════════════════════════════════════════════════
function drawBoundingBox(dim, p1, p2) {
  const x1 = Math.min(p1.x, p2.x), x2 = Math.max(p1.x, p2.x);
  const y1 = Math.min(p1.y, p2.y), y2 = Math.max(p1.y, p2.y);
  const z1 = Math.min(p1.z, p2.z), z2 = Math.max(p1.z, p2.z);

  const edgeLen = 4 * ((x2 - x1) + (y2 - y1) + (z2 - z1));
  const step = Math.max(1, Math.ceil(edgeLen / 120));

  for (let x = x1; x <= x2; x += step) {
    spawnParticle(dim, x + 0.5, y1 + 0.5, z1 + 0.5);
    spawnParticle(dim, x + 0.5, y1 + 0.5, z2 + 0.5);
    spawnParticle(dim, x + 0.5, y2 + 0.5, z1 + 0.5);
    spawnParticle(dim, x + 0.5, y2 + 0.5, z2 + 0.5);
  }
  for (let y = y1; y <= y2; y += step) {
    spawnParticle(dim, x1 + 0.5, y + 0.5, z1 + 0.5);
    spawnParticle(dim, x1 + 0.5, y + 0.5, z2 + 0.5);
    spawnParticle(dim, x2 + 0.5, y + 0.5, z1 + 0.5);
    spawnParticle(dim, x2 + 0.5, y + 0.5, z2 + 0.5);
  }
  for (let z = z1; z <= z2; z += step) {
    spawnParticle(dim, x1 + 0.5, y1 + 0.5, z + 0.5);
    spawnParticle(dim, x1 + 0.5, y2 + 0.5, z + 0.5);
    spawnParticle(dim, x2 + 0.5, y1 + 0.5, z + 0.5);
    spawnParticle(dim, x2 + 0.5, y2 + 0.5, z + 0.5);
  }
}

// ═══════════════════════════════════════════════════════════
// HUD — Shows next action + bounding box particles
// ═══════════════════════════════════════════════════════════
system.runInterval(() => {
  for (const [name, st] of states) {
    if (st.mode === MODE.NONE && !st.building && !st.brushActive) continue;
    try {
      const players = world.getAllPlayers();
      let player = null;
      for (const p of players) { if (p.name === name) { player = p; break; } }
      if (!player) continue;

      if (st.building) continue;

      // Brush HUD
      if (st.brushActive) {
        player.onScreenDisplay.setActionBar(
          `§a🖌 Brocha §l§aACTIVA §r§7| Radio: ${st.brushRadius} | ${shortName(st.blockType)} | §7Agáchate+aire para detener`
        );
        continue;
      }

      const info = MODE_INFO[st.mode];
      if (!info) continue;

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
      if (st.pattern.type !== "single") mods += " §6🧩";

      const bar = `${info.icon} ${info.name} §7| §f${shortName(st.blockType)}${mods} §7| ${nextAction}`;
      player.onScreenDisplay.setActionBar(bar);

      // Selection particles & bounding box
      if (st.p1 && st.p2) {
        drawBoundingBox(player.dimension, st.p1, st.p2);
      } else {
        if (st.p1) {
          try { player.dimension.runCommand(`particle minecraft:endrod ${st.p1.x} ${st.p1.y + 1} ${st.p1.z}`); } catch {}
        }
        if (st.p2) {
          try { player.dimension.runCommand(`particle minecraft:endrod ${st.p2.x} ${st.p2.y + 1} ${st.p2.z}`); } catch {}
        }
      }
    } catch {}
  }
}, HUD_TICKS);

// ═══════════════════════════════════════════════════════════
// PERMISSIONS
// ═══════════════════════════════════════════════════════════
function isPermissionsEnabled() {
  try {
    return world.getDynamicProperty("eb:permissions") === true;
  } catch { return false; }
}

function setPermissionsEnabled(val) {
  try { world.setDynamicProperty("eb:permissions", val); } catch {}
}

// ═══════════════════════════════════════════════════════════
// WAND EVENT HANDLER
// ═══════════════════════════════════════════════════════════
world.beforeEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack?.typeId !== "miaddon:construction_wand") return;
  ev.cancel = true;
  const player = ev.source;
  const sneaking = player.isSneaking;
  system.run(() => {
    if (isPermissionsEnabled() && !player.hasTag("builder")) {
      player.sendMessage("§c✗ No tienes permiso. Necesitas el tag §ebuilder§c.");
      playSound(player, "note.bass", 0.5);
      return;
    }
    if (sneaking) pickBlock(player);
    else handleUse(player);
  });
});

function handleUse(player) {
  const st = getState(player);

  if (st.building) {
    player.sendMessage("§c⏳ Espera, hay una operación en curso...");
    return;
  }

  if (st.firstUse) {
    st.firstUse = false;
    savePlayerState(player);
    showWelcome(player);
    return;
  }

  if (st.mode === MODE.NONE) {
    openWandMenu(player);
    return;
  }

  const info = MODE_INFO[st.mode];
  if (!info) { resetMode(player); openWandMenu(player); return; }

  // Brush toggle
  if (st.mode === MODE.BRUSH) {
    if (st.brushActive) stopBrush(player);
    else showBrushForm(player);
    return;
  }

  const block = getTargetBlock(player);
  if (!block && st.step === 0) {
    resetMode(player);
    openWandMenu(player);
    return;
  }

  if (st.mode === MODE.PASTE) { executePaste(player); return; }

  if (st.mode === MODE.DRAIN) {
    if (st.step === 0) selectPoint(player, 1);
    else if (st.step === 1) selectPoint(player, 2);
    return;
  }

  if (st.mode === MODE.COPY) {
    if (st.step === 0) selectPoint(player, 1);
    else if (st.step === 1) selectPoint(player, 2);
    return;
  }

  if (st.mode === MODE.MEASURE) {
    if (st.step === 0) selectPoint(player, 1);
    else if (st.step === 1) selectPoint(player, 2);
    return;
  }

  if (info.need === 1) {
    if (st.step === 0) selectPoint(player, 1);
    else showShapeForm(player);
    return;
  }

  if (st.step === 0) selectPoint(player, 1);
  else if (st.step === 1) selectPoint(player, 2);
  else showOperationForm(player);
}

function pickBlock(player) {
  const block = getTargetBlock(player);
  const st = getState(player);

  if (!block || block.typeId === "minecraft:air") {
    if (st.brushActive) {
      stopBrush(player);
      resetMode(player);
    } else if (st.mode !== MODE.NONE) {
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
  savePlayerState(player);
}

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
    if (st.mode === MODE.MEASURE) {
      player.sendMessage(`${stepTag(2, 2)} §aPunto 2 marcado.`);
      executeMeasure(player);
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
  if (st.pattern.type !== "single") mods += `\n§6🧩 Patrón: ${st.pattern.type}`;

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
      confirmAndPlace(player, positions, blockType, () => {
        resetMode(player);
        savePlayerState(player);
      });
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
  if (st.pattern.type !== "single") mods += `\n§6🧩 Patrón: ${st.pattern.type}`;

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
      confirmAndPlace(player, positions, blockType, () => {
        resetMode(player);
        savePlayerState(player);
      });
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
      logOperation(player, "Copiar", blocks.length, dimStr(st.p1, st.p2).str);
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
          celebrationParticles(player, [base]);
          logOperation(player, "Pegar", total, `en ${pos(base)}`);
          resetMode(player);
        }
      }, 1);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// MAIN MENU — Categorized hub (8 buttons)
// ═══════════════════════════════════════════════════════════
function openWandMenu(player) {
  const st = getState(player);
  const block = shortName(st.blockType);
  const clip = st.clipboard ? `§a${st.clipboard.blocks.length}` : "§8—";
  const undoN = st.undoStack.length;
  const redoN = st.redoStack.length;

  let modLine = "";
  if (st.mirror.enabled) modLine += `§d🪞 Espejo §aON `;
  if (st.arrayRepeat.enabled) modLine += `§b🔁 Repetir §a×${st.arrayRepeat.count} `;
  if (st.pattern.type !== "single") modLine += `§6🧩 ${st.pattern.type} `;
  if (!modLine) modLine = "§8Ninguno";

  const form = new ActionFormData();
  form.title("§6§l✦ EasyBuild v4 ✦");
  form.body(
    `§fMaterial: §e${block}\n` +
    `§fDeshacer: §e${undoN}§7/${MAX_UNDO}  §fRehacer: §e${redoN}  §fPortapapeles: ${clip}\n` +
    `§fModificadores: ${modLine}\n`
  );

  form.button("§l§e🔨 Construcciones\n§r§7Relleno, Piso, Línea, Muro, Marco");
  form.button("§l§6🎨 Formas 3D\n§r§7Círculo, Esfera, Cilindro, Pirámide");
  form.button("§l§5🔧 Herramientas\n§r§7Reemplazar, Drenar, Copiar, Medir, Brocha");
  form.button(`§l§a↩↪ Deshacer / Rehacer\n§r§7Undo: ${undoN} | Redo: ${redoN}`);

  const lastInfo = MODE_INFO[st.lastMode];
  if (lastInfo) {
    form.button(`§l§e⚡ Repetir: ${lastInfo.name}\n§r§7Reactivar el último modo usado`);
  } else {
    form.button("§l§8⚡ Repetir último\n§r§7Aún no has usado ningún modo");
  }

  form.button("§l§b🎨 Paleta rápida\n§r§75 materiales a un clic");
  form.button("§l§d⚙ Ajustes\n§r§7Espejo, Patrones, Permisos, Tutorial");
  form.button("§l§cCerrar");

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      switch (res.selection) {
        case 0: openBuildMenu(player); break;
        case 1: openShapesMenu(player); break;
        case 2: openToolsMenu(player); break;
        case 3: openUndoRedoMenu(player); break;
        case 4:
          if (lastInfo) activateMode(player, st.lastMode);
          else player.sendMessage("§7Aún no has usado ningún modo.");
          break;
        case 5: showPaletteForm(player); break;
        case 6: openSettingsMenu(player); break;
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SUB-MENU: Construcciones
// ═══════════════════════════════════════════════════════════
function openBuildMenu(player) {
  const form = new ActionFormData();
  form.title("§e§l🔨 Construcciones");
  form.body(
    `§fSelecciona una herramienta de construcción.\n` +
    `§7Todas necesitan marcar §e2 puntos §7(esquinas).\n`
  );

  form.button("§l§b📦 Relleno\n§r§7Cuboid sólido, hueco o paredes");
  form.button("§l§a⬛ Piso / Techo\n§r§7Capa plana entre 2 esquinas");
  form.button("§l§d📏 Línea\n§r§7Línea recta 3D entre 2 puntos");
  form.button("§l§f🧱 Muro\n§r§7Pared vertical (funciona en diagonal)");
  form.button("§l§8🔲 Marco\n§r§7Solo las aristas — ideal para previsualizar");
  form.button("§7← Volver al menú");

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
// SUB-MENU: Formas 3D
// ═══════════════════════════════════════════════════════════
function openShapesMenu(player) {
  const form = new ActionFormData();
  form.title("§6§l🎨 Formas 3D");
  form.body(
    `§fFormas geométricas desde un punto centro.\n` +
    `§7Solo necesitas marcar §e1 punto §7(el centro).\n`
  );

  form.button("§l§6⭕ Círculo\n§r§7Disco plano en cualquier orientación");
  form.button("§l§c🔴 Esfera\n§r§7Esfera sólida o hueca");
  form.button("§l§3🏛 Cilindro\n§r§7Torre circular con altura");
  form.button("§l§e🔺 Pirámide\n§r§7Pirámide escalonada, sólida o hueca");
  form.button("§7← Volver al menú");

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
// SUB-MENU: Herramientas (expanded with Measure, Brush, Schematics)
// ═══════════════════════════════════════════════════════════
function openToolsMenu(player) {
  const st = getState(player);
  const clip = st.clipboard ? `§a${st.clipboard.blocks.length} bloques` : "§8vacío";

  const form = new ActionFormData();
  form.title("§5§l🔧 Herramientas");
  form.body(
    `§fHerramientas de edición de terreno.\n` +
    `§fPortapapeles: ${clip}\n`
  );

  form.button("§l§5🔄 Reemplazar\n§r§7Cambia un tipo de bloque por otro");
  form.button("§l§b💧 Drenar\n§r§7Elimina agua y lava de una región");
  form.button("§l§9📋 Copiar\n§r§7Guarda una región en el portapapeles");
  form.button(`§l§9📋 Pegar\n§r§7${st.clipboard ? "Pega con rotación" : "No hay nada copiado"}`);
  form.button("§l§e📐 Medir\n§r§7Distancia, volumen y dimensiones");
  form.button("§l§a🖌 Brocha\n§r§7Pinta el suelo mientras caminas");
  form.button("§l§6💾 Esquemáticos\n§r§7Guardar y cargar portapapeles");
  form.button("§7← Volver al menú");

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      switch (res.selection) {
        case 0: activateMode(player, MODE.REPLACE); break;
        case 1: activateMode(player, MODE.DRAIN); break;
        case 2: activateMode(player, MODE.COPY); break;
        case 3: activatePaste(player); break;
        case 4: activateMode(player, MODE.MEASURE); break;
        case 5: activateMode(player, MODE.BRUSH); break;
        case 6: openSchematicsMenu(player); break;
        case 7: openWandMenu(player); break;
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SUB-MENU: Undo / Redo
// ═══════════════════════════════════════════════════════════
function openUndoRedoMenu(player) {
  const st = getState(player);
  const form = new ActionFormData();
  form.title("§a§l↩↪ Deshacer / Rehacer");
  form.body(
    `§fDeshacer: §e${st.undoStack.length} §7operación(es)\n` +
    `§fRehacer: §e${st.redoStack.length} §7operación(es)\n`
  );

  form.button(`§l§e↩ Deshacer\n§r§7${st.undoStack.length > 0 ? "Revierte la última operación" : "Pila vacía"}`);
  form.button(`§l§b↪ Rehacer\n§r§7${st.redoStack.length > 0 ? "Repite lo que se deshizo" : "Pila vacía"}`);
  form.button("§7← Volver al menú");

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      switch (res.selection) {
        case 0: performUndo(player); break;
        case 1: performRedo(player); break;
        case 2: openWandMenu(player); break;
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SUB-MENU: Ajustes (expanded)
// ═══════════════════════════════════════════════════════════
function openSettingsMenu(player) {
  const st = getState(player);
  const mirrorSt = st.mirror.enabled
    ? `§a ON §7(${st.mirror.axis === "both" ? "Ambos ejes" : "Eje " + st.mirror.axis.toUpperCase()})`
    : "§8 OFF";
  const arraySt = st.arrayRepeat.enabled
    ? `§a ON §7(×${st.arrayRepeat.count})`
    : "§8 OFF";
  const patSt = st.pattern.type !== "single"
    ? `§a ${st.pattern.type}`
    : "§8 normal";
  const permSt = isPermissionsEnabled() ? "§a ON" : "§8 OFF";

  const form = new ActionFormData();
  form.title("§d§l⚙ Ajustes");
  form.body(
    `§d🪞 Espejo: ${mirrorSt}\n` +
    `§b🔁 Repetir: ${arraySt}\n` +
    `§6🧩 Patrón: ${patSt}\n` +
    `§c🔒 Permisos: ${permSt}\n`
  );

  form.button("§l§d🪞 Espejo\n§r§7Simetría automática al construir");
  form.button("§l§b🔁 Repetir / Array\n§r§7Duplicar la construcción N veces");
  form.button("§l§6🧩 Patrones\n§r§7Multi-bloque: aleatorio, tablero, degradado");
  form.button("§l§c🔒 Permisos\n§r§7Requerir tag 'builder'");
  form.button("§l§7📊 Historial\n§r§7Últimas operaciones realizadas");
  form.button("§l§6🏛 Estructuras Bíblicas\n§r§7Construcciones prefabricadas");
  form.button("§l§e📖 Tutorial\n§r§7Aprende a usar EasyBuild paso a paso");
  form.button("§7← Volver al menú");

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      switch (res.selection) {
        case 0: showMirrorForm(player); break;
        case 1: showArrayForm(player); break;
        case 2: showPatternForm(player); break;
        case 3: showPermissionsForm(player); break;
        case 4: showOperationsLog(player); break;
        case 5: openBiblicalMenu(player); break;
        case 6: showTutorial(player, 0); break;
        case 7: openWandMenu(player); break;
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SCHEMATICS MENU
// ═══════════════════════════════════════════════════════════
function openSchematicsMenu(player) {
  const st = getState(player);
  const names = getSchematicNames();
  const clipTxt = st.clipboard
    ? `§a${st.clipboard.blocks.length} bloques (${st.clipboard.size.x}×${st.clipboard.size.y}×${st.clipboard.size.z})`
    : "§8vacío";

  const form = new ActionFormData();
  form.title("§6§l💾 Esquemáticos");
  form.body(
    `§fPortapapeles: ${clipTxt}\n` +
    `§fGuardados: §e${names.length}§7/${MAX_SCHEMATICS}\n`
  );

  form.button(`§l§a💾 Guardar\n§r§7${st.clipboard ? "Guardar portapapeles actual" : "No hay nada copiado"}`);
  form.button(`§l§b📂 Cargar\n§r§7${names.length > 0 ? `${names.length} esquemáticos guardados` : "No hay guardados"}`);
  form.button(`§l§c🗑 Eliminar\n§r§7${names.length > 0 ? "Borrar un esquemático" : "No hay guardados"}`);
  form.button("§7← Volver");

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      switch (res.selection) {
        case 0: showSaveSchematicForm(player); break;
        case 1: showLoadSchematicMenu(player); break;
        case 2: showDeleteSchematicMenu(player); break;
        case 3: openToolsMenu(player); break;
      }
    });
  });
}

function showSaveSchematicForm(player) {
  const st = getState(player);
  if (!st.clipboard) {
    player.sendMessage("§c✗ No hay nada en el portapapeles. Usa §9Copiar §cprimero.");
    playSound(player, "note.bass", 0.5);
    return;
  }

  const form = new ModalFormData();
  form.title("§a💾 Guardar esquemático");
  form.textField(
    `§fPortapapeles: §e${st.clipboard.blocks.length} §fbloques\n` +
    `§fTamaño: §e${st.clipboard.size.x}×${st.clipboard.size.y}×${st.clipboard.size.z}\n\n` +
    `§fNombre:`,
    "mi_estructura",
    ""
  );

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      const name = (res.formValues[0] || "").trim();
      if (!name || name.length > 30) {
        player.sendMessage("§c✗ Nombre inválido (1-30 caracteres).");
        return;
      }
      if (saveSchematicData(name, st.clipboard)) {
        player.sendMessage(`§a✓ Esquemático §e"${name}" §aguardado.`);
        playSound(player, "random.orb", 1.5);
      } else {
        player.sendMessage(`§c✗ Error al guardar. ¿Límite alcanzado (${MAX_SCHEMATICS}) o datos muy grandes?`);
        playSound(player, "note.bass", 0.5);
      }
    });
  });
}

function showLoadSchematicMenu(player) {
  const names = getSchematicNames();
  if (names.length === 0) {
    player.sendMessage("§c✗ No hay esquemáticos guardados.");
    playSound(player, "note.bass", 0.5);
    return;
  }

  const form = new ActionFormData();
  form.title("§b📂 Cargar esquemático");
  form.body("§fSelecciona un esquemático para cargar al portapapeles:");

  for (const name of names) {
    const data = loadSchematicData(name);
    const info = data ? `${data.blocks.length} bloques (${data.size.x}×${data.size.y}×${data.size.z})` : "?";
    form.button(`§l§e${name}\n§r§7${info}`);
  }
  form.button("§7← Volver");

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      if (res.selection >= names.length) { openSchematicsMenu(player); return; }
      const name = names[res.selection];
      const data = loadSchematicData(name);
      if (data) {
        const st = getState(player);
        st.clipboard = data;
        player.sendMessage(`§a✓ Esquemático §e"${name}" §acargado al portapapeles.`);
        playSound(player, "random.orb", 1.5);
      } else {
        player.sendMessage("§c✗ Error al cargar el esquemático.");
      }
    });
  });
}

function showDeleteSchematicMenu(player) {
  const names = getSchematicNames();
  if (names.length === 0) {
    player.sendMessage("§c✗ No hay esquemáticos guardados.");
    playSound(player, "note.bass", 0.5);
    return;
  }

  const form = new ActionFormData();
  form.title("§c🗑 Eliminar esquemático");
  form.body("§fSelecciona un esquemático para borrar:");

  for (const name of names) {
    form.button(`§l§c${name}\n§r§7Borrar permanentemente`);
  }
  form.button("§7← Volver");

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      if (res.selection >= names.length) { openSchematicsMenu(player); return; }
      const name = names[res.selection];
      if (deleteSchematicData(name)) {
        player.sendMessage(`§a✓ Esquemático §e"${name}" §aeliminado.`);
        playSound(player, "random.orb", 1);
      } else {
        player.sendMessage("§c✗ Error al eliminar.");
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
      savePlayerState(player);
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
      savePlayerState(player);
      openSettingsMenu(player);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// PATTERN FORM — multi-block
// ═══════════════════════════════════════════════════════════
function showPatternForm(player) {
  const st = getState(player);
  const typeIdx = ["single", "random", "checkerboard", "gradient"].indexOf(st.pattern.type);

  const form = new ModalFormData();
  form.title("§6🧩 Patrones Multi-bloque");
  form.dropdown("§fTipo de patrón:", [
    "Normal — solo 1 bloque",
    "Aleatorio — elige al azar",
    "Tablero de ajedrez — alterna",
    "Degradado — transición suave",
  ], Math.max(0, typeIdx));
  form.textField(
    `§fBloques del patrón §7(separados por coma):\n` +
    `§7Ej: stone, oak_planks, cobblestone\n\n` +
    `§fBloques:`,
    "stone, cobblestone, mossy_cobblestone",
    st.pattern.blocks?.map(b => shortName(b)).join(", ") || ""
  );

  form.show(player).then(res => {
    if (res.canceled) { openSettingsMenu(player); return; }
    system.run(() => {
      const types = ["single", "random", "checkerboard", "gradient"];
      st.pattern.type = types[res.formValues[0]];

      const blocksRaw = (res.formValues[1] || "").trim();
      if (blocksRaw) {
        st.pattern.blocks = blocksRaw.split(",")
          .map(b => normalizeBlock(b.trim()))
          .filter(b => b.length > 10);
      } else {
        st.pattern.blocks = [];
      }

      if (st.pattern.type !== "single" && st.pattern.blocks.length > 0) {
        playSound(player, "random.orb", 1.5);
        player.sendMessage(
          `§6🧩 Patrón §e${st.pattern.type} §aactivado §7con §e${st.pattern.blocks.length} §7bloques.`
        );
      } else {
        st.pattern.type = "single";
        player.sendMessage("§6🧩 Patrón §7normal (1 bloque).");
      }
      savePlayerState(player);
      openSettingsMenu(player);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// BRUSH FORM — configure before activating
// ═══════════════════════════════════════════════════════════
function showBrushForm(player) {
  const st = getState(player);
  const form = new ModalFormData();
  form.title("§a🖌 Brocha");
  form.slider("§fRadio", 1, 5, 1, st.brushRadius);
  form.textField(
    `§fMaterial actual: §e${shortName(st.blockType)}\n` +
    (st.pattern.type !== "single"
      ? `§6🧩 Patrón ${st.pattern.type} activo\n`
      : "") +
    `\n§7Activa la brocha y camina para pintar.\n` +
    `§7Agáchate + aire para detener.\n\n§fBloque:`,
    "stone",
    st.blockType
  );

  form.show(player).then(res => {
    if (res.canceled) { resetMode(player); return; }
    system.run(() => {
      st.brushRadius = res.formValues[0];
      const blockType = normalizeBlock(res.formValues[1] || st.blockType);
      st.blockType = blockType;
      savePlayerState(player);
      startBrush(player);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// PERMISSIONS FORM
// ═══════════════════════════════════════════════════════════
function showPermissionsForm(player) {
  const enabled = isPermissionsEnabled();
  const hasTag = player.hasTag("builder");

  const form = new ModalFormData();
  form.title("§c🔒 Permisos");
  form.toggle(
    `§fRequerir tag "builder" para usar EasyBuild\n\n` +
    `§7Cuando está activo, solo jugadores con el\n` +
    `§7tag §ebuilder §7pueden usar la vara.\n\n` +
    `§7Tu estado: ${hasTag ? "§a✓ Tienes el tag" : "§c✗ No tienes el tag"}\n` +
    `§7Usa: §e/tag @s add builder §7para auto-asignarlo.\n\n` +
    `§fActivar:`,
    enabled
  );

  form.show(player).then(res => {
    if (res.canceled) { openSettingsMenu(player); return; }
    system.run(() => {
      const newVal = res.formValues[0];
      setPermissionsEnabled(newVal);
      if (newVal) {
        player.sendMessage("§c🔒 Permisos §aactivados§f. Se requiere tag §ebuilder§f.");
      } else {
        player.sendMessage("§c🔒 Permisos §cdesactivados§f. Todos pueden usar la vara.");
      }
      openSettingsMenu(player);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// OPERATIONS LOG VIEWER
// ═══════════════════════════════════════════════════════════
function showOperationsLog(player) {
  const st = getState(player);
  const log = st.operationsLog;

  if (log.length === 0) {
    player.sendMessage("§7📊 No hay operaciones registradas aún.");
    playSound(player, "note.bass", 0.5);
    openSettingsMenu(player);
    return;
  }

  let body = `§fÚltimas §e${log.length} §foperaciones:\n\n`;
  const recent = log.slice(-10).reverse();
  for (let i = 0; i < recent.length; i++) {
    const op = recent[i];
    body += `§e${i + 1}. §f${op.mode} §7— ${op.blocks} bloques §8(${op.region}) §7${op.time}\n`;
  }

  const form = new MessageFormData();
  form.title("§7§l📊 Historial de Operaciones");
  form.body(body);
  form.button1("§aOK");
  form.button2("§7← Volver");

  form.show(player).then(res => {
    system.run(() => { openSettingsMenu(player); });
  });
}

// ═══════════════════════════════════════════════════════════
// QUICK PALETTE — 5 material slots
// ═══════════════════════════════════════════════════════════
function showPaletteForm(player) {
  const st = getState(player);
  const form = new ActionFormData();
  form.title("§b§l🎨 Paleta rápida");
  form.body(
    `§fMaterial actual: §e${shortName(st.blockType)}\n` +
    `§7Toca un slot para usarlo, o edita la paleta.\n`
  );

  for (let i = 0; i < PALETTE_SLOTS; i++) {
    const block = st.palette[i];
    const isCurrent = block === st.blockType;
    form.button(
      `§l${isCurrent ? "§a▶ " : "§f"}Slot ${i + 1}: ${shortName(block)}\n` +
      `§r§7${isCurrent ? "← En uso" : "Toca para seleccionar"}`
    );
  }
  form.button("§l§d✎ Editar paleta\n§r§7Cambiar los bloques guardados");
  form.button("§l§e💾 Guardar actual en slot\n§r§7Guarda tu material en un slot");
  form.button("§7← Volver al menú");

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      if (res.selection < PALETTE_SLOTS) {
        st.blockType = st.palette[res.selection];
        playSound(player, "random.orb", 1.5);
        player.sendMessage(`§b🎨 Material cambiado a: §f${shortName(st.blockType)}`);
        savePlayerState(player);
      } else if (res.selection === PALETTE_SLOTS) {
        showEditPaletteForm(player);
      } else if (res.selection === PALETTE_SLOTS + 1) {
        showSaveToPaletteForm(player);
      } else {
        openWandMenu(player);
      }
    });
  });
}

function showEditPaletteForm(player) {
  const st = getState(player);
  const form = new ModalFormData();
  form.title("§d✎ Editar paleta");

  for (let i = 0; i < PALETTE_SLOTS; i++) {
    form.textField(`§fSlot ${i + 1}:`, "stone", shortName(st.palette[i]));
  }

  form.show(player).then(res => {
    if (res.canceled) { showPaletteForm(player); return; }
    system.run(() => {
      for (let i = 0; i < PALETTE_SLOTS; i++) {
        const val = (res.formValues[i] || "").trim();
        if (val) st.palette[i] = normalizeBlock(val);
      }
      playSound(player, "random.orb", 1.5);
      player.sendMessage("§b🎨 Paleta actualizada.");
      savePlayerState(player);
      showPaletteForm(player);
    });
  });
}

function showSaveToPaletteForm(player) {
  const st = getState(player);
  const form = new ActionFormData();
  form.title("§e💾 Guardar en paleta");
  form.body(`§fGuardar §e${shortName(st.blockType)} §fen un slot:`);

  for (let i = 0; i < PALETTE_SLOTS; i++) {
    form.button(`§fSlot ${i + 1}\n§r§7${shortName(st.palette[i])} → §e${shortName(st.blockType)}`);
  }
  form.button("§7← Volver");

  form.show(player).then(res => {
    if (res.canceled) return;
    system.run(() => {
      if (res.selection < PALETTE_SLOTS) {
        st.palette[res.selection] = st.blockType;
        playSound(player, "random.orb", 1.5);
        player.sendMessage(`§a✓ Slot ${res.selection + 1} actualizado a: §f${shortName(st.blockType)}`);
        savePlayerState(player);
      }
      showPaletteForm(player);
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

  if (mode === MODE.BRUSH) {
    player.sendMessage(`${stepTag(1, 1)} §fUsa la vara para configurar y activar la brocha.`);
    player.sendMessage(`§7  Cancelar: agáchate + clic al aire`);
    return;
  }

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
  form.title("§6§l✦ Bienvenido a EasyBuild v4 ✦");
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
    `§e▸ §fAgáchate + clic al aire §7= Cancelar\n\n` +
    `§6§lNuevo en v4:\n` +
    `§7Brocha, Medir, Patrones, Paleta, Esquemáticos,\n` +
    `§7Rehacer, Persistencia, y más.\n`
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
// TUTORIAL (11 pages — covers all v4 features)
// ═══════════════════════════════════════════════════════════
const TUTORIAL = [
  {
    title: "§e§l📖 1/11 — Controles Básicos",
    body:
      `§6§lTres acciones con la vara:\n\n` +
      `§e▸ Usar §f(sin modo activo)\n` +
      `§7  Abre el menú principal\n\n` +
      `§e▸ Agáchate + usar §fmirando a un bloque\n` +
      `§7  Selecciona ese bloque como material\n\n` +
      `§e▸ Agáchate + usar §fmirando al aire\n` +
      `§7  Cancela el modo actual / detiene brocha\n\n` +
      `§6§lDurante un modo activo:\n\n` +
      `§e▸ Usar la vara §fmirando a un bloque\n` +
      `§7  Marca un punto (P1/P2/Centro)\n\n` +
      `§b§lTip: §r§fTu material y ajustes §ase guardan §7entre sesiones.`,
  },
  {
    title: "§b§l📖 2/11 — Menú Principal",
    body:
      `§6§lEl menú tiene 8 secciones:\n\n` +
      `§e🔨 Construcciones\n` +
      `§7  Relleno, Piso, Línea, Muro, Marco\n\n` +
      `§6🎨 Formas 3D\n` +
      `§7  Círculo, Esfera, Cilindro, Pirámide\n\n` +
      `§5🔧 Herramientas\n` +
      `§7  Reemplazar, Drenar, Copiar, Pegar, Medir, Brocha\n\n` +
      `§a↩↪ Deshacer / Rehacer\n\n` +
      `§e⚡ Repetir último §7— reactivar modo anterior\n\n` +
      `§b🎨 Paleta §7— 5 materiales rápidos\n\n` +
      `§d⚙ Ajustes §7— Todo lo demás`,
  },
  {
    title: "§e§l📖 3/11 — Construcciones",
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
    title: "§6§l📖 4/11 — Formas 3D",
    body:
      `§6⭕ §lCírculo §r— Disco plano\n` +
      `§7  Elige plano: horizontal/vertical\n\n` +
      `§c🔴 §lEsfera §r— Bola 3D\n` +
      `§7  Sólida o hueca (cúpula/burbuja)\n\n` +
      `§3🏛 §lCilindro §r— Torre circular\n` +
      `§7  Elige eje y altura, sólido o hueco\n\n` +
      `§e🔺 §lPirámide §r— Escalonada\n` +
      `§7  Tamaño = capas. Sólida o hueca\n\n` +
      `§b§lTip: §r§fTodas permiten elegir radio,\n` +
      `§7si es hueca, y el bloque a usar.`,
  },
  {
    title: "§5§l📖 5/11 — Herramientas",
    body:
      `§5🔄 §lReemplazar §r— Cambia bloques en masa\n` +
      `§7  "air" como destino = borrar\n\n` +
      `§b💧 §lDrenar §r— Elimina líquidos\n\n` +
      `§9📋 §lCopiar §r— Guarda región al portapapeles\n` +
      `§9📋 §lPegar §r— Con rotación (0°-270°)\n\n` +
      `§e📐 §lMedir §r— Marca 2 puntos y muestra:\n` +
      `§7  Dimensiones, distancia, volumen, superficie\n\n` +
      `§a🖌 §lBrocha §r— Pinta mientras caminas\n` +
      `§7  Configura radio (1-5) y camina por el suelo\n\n` +
      `§6💾 §lEsquemáticos §r— Guarda/carga portapapeles\n` +
      `§7  Hasta ${MAX_SCHEMATICS} esquemáticos con nombre`,
  },
  {
    title: "§d§l📖 6/11 — Espejo y Repetir",
    body:
      `§d🪞 §lEspejo§r — Simetría al construir\n\n` +
      `§e1. §f⚙ Ajustes → 🪞 Espejo\n` +
      `§e2. §fActiva y elige eje (X / Z / Ambos)\n` +
      `§e3. §fMira al bloque centro\n` +
      `§e4. §fConstruye — ¡se espeja solo!\n\n` +
      `§b🔁 §lRepetir / Array§r — Clonar en línea\n\n` +
      `§e1. §f⚙ Ajustes → 🔁 Repetir\n` +
      `§e2. §fElige copias, dirección y distancia\n` +
      `§e3. §fConstruye — ¡se repite solo!\n\n` +
      `§b§lEjemplo: §r§f3 columnas cada 5 bloques\n` +
      `§7→ Copias: 3, Este, Distancia: 5`,
  },
  {
    title: "§6§l📖 7/11 — Patrones Multi-bloque",
    body:
      `§6🧩 §lPatrones §r— Usa varios bloques a la vez\n\n` +
      `§fVe a §d⚙ Ajustes §f→ §6🧩 Patrones\n\n` +
      `§e4 tipos:\n\n` +
      `§f• Normal §7— Un solo bloque (por defecto)\n` +
      `§f• Aleatorio §7— Elige al azar de la lista\n` +
      `§f• Tablero §7— Alterna tipo ajedrez\n` +
      `§f• Degradado §7— Transición suave\n\n` +
      `§7Escribe los bloques separados por coma:\n` +
      `§e  stone, cobblestone, mossy_cobblestone\n\n` +
      `§b§lTip: §r§fFunciona con §atodas §flas herramientas\n` +
      `§7incluyendo la brocha.`,
  },
  {
    title: "§b§l📖 8/11 — Paleta y Esquemáticos",
    body:
      `§b🎨 §lPaleta rápida §r— 5 materiales guardados\n\n` +
      `§7Usa el botón §b🎨 Paleta §7del menú:\n` +
      `§f• Toca un slot para activar ese bloque\n` +
      `§f• Edita la paleta para cambiar bloques\n` +
      `§f• Guarda tu material actual en un slot\n\n` +
      `§6💾 §lEsquemáticos §r— Diseños con nombre\n\n` +
      `§7Accede desde §5🔧 Herramientas §7→ §6💾 Esquemáticos:\n` +
      `§f• Copia una región al portapapeles\n` +
      `§f• Usa §a💾 Guardar §fpara ponerle nombre\n` +
      `§f• §b📂 Cargar §fpara recuperarla cuando quieras\n` +
      `§f• Hasta §e${MAX_SCHEMATICS} §fesquemáticos guardados\n\n` +
      `§b§lTip: §r§7Los esquemáticos §apersisten §7entre sesiones.`,
  },
  {
    title: "§a§l📖 9/11 — Brocha y Medir",
    body:
      `§a🖌 §lBrocha §r— Pinta mientras caminas\n\n` +
      `§e1. §fAbre §5Herramientas §f→ §a🖌 Brocha\n` +
      `§e2. §fConfigura: radio (1-5) y bloque\n` +
      `§e3. §f¡Camina! Los bloques bajo tus pies cambian\n` +
      `§e4. §fAgáchate + aire para §cdetener\n\n` +
      `§7Funciona con patrones multi-bloque.\n` +
      `§7Se puede deshacer con §a↩ Undo§7.\n\n` +
      `§e📐 §lMedir §r— Sin construir nada\n\n` +
      `§e1. §f§5Herramientas §f→ §e📐 Medir\n` +
      `§e2. §fMarca 2 puntos\n` +
      `§e3. §fMuestra: tamaño, distancia, volumen, superficie`,
  },
  {
    title: "§c§l📖 10/11 — Permisos e Historial",
    body:
      `§c🔒 §lPermisos §r— Control de acceso\n\n` +
      `§7Ve a §d⚙ Ajustes §7→ §c🔒 Permisos\n\n` +
      `§7Cuando está §aactivo§7, solo jugadores con el\n` +
      `§7tag §ebuilder §7pueden usar la vara.\n` +
      `§7Asigna el tag con: §e/tag Player add builder\n\n` +
      `§7📊 §lHistorial §r— Registro de operaciones\n\n` +
      `§7Ve a §d⚙ Ajustes §7→ §7📊 Historial\n` +
      `§7Muestra las últimas §e${MAX_LOG} §7operaciones:\n` +
      `§f• Modo usado\n` +
      `§f• Cantidad de bloques\n` +
      `§f• Dimensiones\n` +
      `§f• Hora\n\n` +
      `§b§lTip: §r§7Tu material, paleta y ajustes se\n` +
      `§7§aguardan automáticamente §7entre sesiones.`,
  },
  {
    title: "§e§l📖 11/11 — Tips Avanzados",
    body:
      `§6§l★ Combinaciones poderosas:\n\n` +
      `§7• Marco → ver tamaño → Relleno → construir\n` +
      `§7• Muro + Piso = cuarto rápido\n` +
      `§7• Esfera hueca = cúpula perfecta\n` +
      `§7• Espejo Ambos + Cilindro = templo simétrico\n` +
      `§7• Brocha + Patrón aleatorio = terreno natural\n` +
      `§7• Copiar → Guardar como esquemático → forever\n` +
      `§7• Medir → saber el tamaño antes de construir\n\n` +
      `§6§l★ No olvides:\n\n` +
      `§7• "air" = borrar bloques\n` +
      `§7• "water" / "lava" = llenar de líquido\n` +
      `§7• §a↩ ↪ §7Undo y Redo ilimitado (10 pasos)\n` +
      `§7• §6🏛 Estructuras Bíblicas §7en Ajustes\n` +
      `§7• Todo se §aguarda §7automáticamente\n` +
      `§7• ¡Diviértete construyendo! §6✦`,
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
