/**
 * schema-validate.js — Validación profunda contra reglas de Bedrock 1.21.x
 * 
 * NO usa schemas externos (no existen schemas oficiales descargables).
 * En su lugar, codifica las reglas conocidas de la documentación oficial:
 * https://learn.microsoft.com/en-us/minecraft/creator/
 * 
 * Uso: node tools/schema-validate.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function err(file, msg) { errors.push(`❌ ${file}: ${msg}`); }
function warn(file, msg) { warnings.push(`⚠️  ${file}: ${msg}`); }
function ok(file, msg) { console.log(`  ✅ ${file}: ${msg}`); }

// ══════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════
function readJSON(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) { err(relPath, "Archivo no existe"); return null; }
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (e) {
    err(relPath, `JSON inválido: ${e.message}`);
    return null;
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function pngValid(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return false;
  const buf = fs.readFileSync(full);
  // PNG magic: 89 50 4E 47 0D 0A 1A 0A
  return buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
    buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
}

function pngDimensions(relPath) {
  const full = path.join(ROOT, relPath);
  const buf = fs.readFileSync(full);
  if (buf.length < 24) return null;
  // IHDR chunk starts at byte 8, width at 16, height at 20 (big-endian)
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  return { w, h };
}

// ══════════════════════════════════════════
// 1. Manifests
// ══════════════════════════════════════════
console.log("\n=== 1. MANIFESTS ===");

function validateManifest(relPath, expectedType) {
  const data = readJSON(relPath);
  if (!data) return null;

  // format_version
  const fv = data.format_version;
  if (fv !== 2 && fv !== 3) err(relPath, `format_version debe ser 2 o 3, tiene: ${fv}`);
  else ok(relPath, `format_version: ${fv}`);

  // header
  const h = data.header;
  if (!h) { err(relPath, "Falta header"); return data; }
  if (!h.uuid) err(relPath, "Falta header.uuid");
  if (!h.version) err(relPath, "Falta header.version");
  if (!h.min_engine_version) err(relPath, "Falta header.min_engine_version");
  else {
    const mev = h.min_engine_version;
    if (typeof mev === "string") {
      // Debe ser array, no string
      err(relPath, `min_engine_version debe ser array [1,21,0], no string "${mev}"`);
    } else if (Array.isArray(mev)) {
      ok(relPath, `min_engine_version: ${mev.join(".")}`);
    }
  }

  // UUID formato
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (h.uuid && !uuidRegex.test(h.uuid)) err(relPath, `header.uuid inválido: ${h.uuid}`);

  // modules
  if (!data.modules || data.modules.length === 0) err(relPath, "Falta modules");
  else {
    for (const mod of data.modules) {
      if (!mod.type) err(relPath, "Módulo sin type");
      if (!mod.uuid) err(relPath, "Módulo sin uuid");
      if (expectedType && !data.modules.some(m => m.type === expectedType))
        err(relPath, `No tiene módulo tipo "${expectedType}"`);
    }
  }

  return data;
}

const bpManifest = validateManifest("behavior_pack/manifest.json", "data");
const rpManifest = validateManifest("resource_pack/manifest.json", "resources");

// Verificar BP depende del RP
if (bpManifest && rpManifest) {
  const rpUUID = rpManifest.header?.uuid;
  const deps = bpManifest.dependencies || [];
  const dependsOnRP = deps.some(d => d.uuid === rpUUID);
  if (!dependsOnRP) err("behavior_pack/manifest.json", `BP no depende del RP (uuid: ${rpUUID})`);
  else ok("behavior_pack/manifest.json", "BP depende correctamente del RP");

  // Script module necesita @minecraft/server
  const scriptModule = bpManifest.modules?.find(m => m.type === "script");
  if (scriptModule) {
    const serverDep = deps.find(d => d.module_name === "@minecraft/server");
    if (!serverDep) err("behavior_pack/manifest.json", "Script module sin dependencia @minecraft/server");
    else ok("behavior_pack/manifest.json", `@minecraft/server ${serverDep.version}`);

    // Verificar que el entry file existe
    if (scriptModule.entry) {
      const entryPath = `behavior_pack/${scriptModule.entry}`;
      if (!fileExists(entryPath)) err("behavior_pack/manifest.json", `Entry file no existe: ${scriptModule.entry}`);
      else ok("behavior_pack/manifest.json", `Entry file: ${scriptModule.entry}`);
    }
  }
}

// ══════════════════════════════════════════
// 2. Items (format 1.21.10)
// ══════════════════════════════════════════
console.log("\n=== 2. ITEMS ===");

const VALID_COMPONENTS_1_21 = new Set([
  "minecraft:icon", "minecraft:display_name", "minecraft:max_stack_size",
  "minecraft:hand_equipped", "minecraft:damage", "minecraft:durability",
  "minecraft:wearable", "minecraft:food", "minecraft:use_modifiers",
  "minecraft:use_animation", "minecraft:glint", "minecraft:cooldown",
  "minecraft:throwable", "minecraft:shooter", "minecraft:projectile",
  "minecraft:entity_placer", "minecraft:block_placer", "minecraft:record",
  "minecraft:repairable", "minecraft:can_destroy_in_creative",
  "minecraft:hover_text_color", "minecraft:allow_off_hand",
  "minecraft:should_despawn", "minecraft:liquid_clipped",
  "minecraft:stacked_by_data", "minecraft:tags", "minecraft:custom_components",
  "minecraft:interact_button", "minecraft:enchantable",
]);

const VALID_SLOTS = new Set([
  "slot.armor.head", "slot.armor.chest", "slot.armor.legs", "slot.armor.feet",
  "slot.weapon.mainhand", "slot.weapon.offhand"
]);

const VALID_CATEGORIES = new Set(["equipment", "items", "nature", "construction", "none"]);

const itemsDir = path.join(ROOT, "behavior_pack", "items");
const itemFiles = fs.readdirSync(itemsDir).filter(f => f.endsWith(".json"));
const itemDefs = {};

for (const file of itemFiles) {
  const relPath = `behavior_pack/items/${file}`;
  const data = readJSON(relPath);
  if (!data) continue;

  const item = data["minecraft:item"];
  if (!item) { err(relPath, "Falta clave 'minecraft:item'"); continue; }

  // format_version
  const fv = data.format_version;
  if (fv !== "1.21.10" && fv !== "1.20.80" && fv !== "1.20.50" && fv !== "1.20.40") {
    warn(relPath, `format_version ${fv} — recomendado: 1.21.10`);
  }

  // description
  const desc = item.description;
  if (!desc?.identifier) { err(relPath, "Falta description.identifier"); continue; }

  const id = desc.identifier;
  itemDefs[id] = { file, relPath, data };

  // Namespace check
  if (!id.includes(":")) err(relPath, `Identifier sin namespace: ${id}`);

  // menu_category
  if (desc.menu_category) {
    const cat = desc.menu_category.category;
    if (cat && !VALID_CATEGORIES.has(cat)) warn(relPath, `Categoría desconocida: ${cat}`);
  }

  // components
  const comps = item.components || {};
  const compKeys = Object.keys(comps);

  // Verificar componentes conocidos
  for (const key of compKeys) {
    if (!VALID_COMPONENTS_1_21.has(key)) {
      warn(relPath, `Componente desconocido: ${key} (puede ser custom o de versión futura)`);
    }
  }

  // icon — debe ser string en 1.21.10
  if (comps["minecraft:icon"] !== undefined) {
    const icon = comps["minecraft:icon"];
    if (typeof icon !== "string") {
      err(relPath, `minecraft:icon debe ser STRING en 1.21.10, tiene: ${JSON.stringify(icon)}`);
    }
  } else {
    err(relPath, "Falta minecraft:icon");
  }

  // display_name
  if (!comps["minecraft:display_name"]) {
    warn(relPath, "Falta minecraft:display_name");
  }

  // wearable validations
  if (comps["minecraft:wearable"]) {
    const w = comps["minecraft:wearable"];
    if (!w.slot) err(relPath, "minecraft:wearable sin slot");
    else if (!VALID_SLOTS.has(w.slot)) err(relPath, `Slot inválido: ${w.slot}`);
    if (w.protection === undefined) warn(relPath, "minecraft:wearable sin protection (default=0)");
  }

  // food sin use_modifiers
  if (comps["minecraft:food"] && !comps["minecraft:use_modifiers"]) {
    err(relPath, "minecraft:food REQUIERE minecraft:use_modifiers con use_duration (1.21.10)");
  }

  // use_modifiers validations
  if (comps["minecraft:use_modifiers"]) {
    const um = comps["minecraft:use_modifiers"];
    if (um.use_duration === undefined) {
      err(relPath, "minecraft:use_modifiers sin use_duration");
    } else if (typeof um.use_duration !== "number" || um.use_duration <= 0) {
      err(relPath, `use_duration debe ser número > 0, tiene: ${um.use_duration}`);
    }
  }

  // food validations
  if (comps["minecraft:food"]) {
    const food = comps["minecraft:food"];
    if (food.saturation_modifier === undefined) {
      err(relPath, "minecraft:food sin saturation_modifier (requerido en 1.21.10)");
    }
  }

  // durability validations
  if (comps["minecraft:durability"]) {
    const d = comps["minecraft:durability"];
    if (!d.max_durability || d.max_durability <= 0) {
      err(relPath, "minecraft:durability sin max_durability válido");
    }
  }

  // max_stack_size
  if (comps["minecraft:max_stack_size"] !== undefined) {
    const mss = comps["minecraft:max_stack_size"];
    if (typeof mss !== "number" || mss < 1 || mss > 64) {
      err(relPath, `max_stack_size debe ser 1-64, tiene: ${mss}`);
    }
  }

  ok(relPath, `${id} — ${compKeys.length} componentes`);
}

// ══════════════════════════════════════════
// 3. Textures & Icons cross-reference
// ══════════════════════════════════════════
console.log("\n=== 3. TEXTURAS E ÍCONOS ===");

const itemTexture = readJSON("resource_pack/textures/item_texture.json");
if (itemTexture) {
  const texData = itemTexture.texture_data || {};

  // Cada item tiene su ícono registrado?
  for (const [id, def] of Object.entries(itemDefs)) {
    const icon = def.data["minecraft:item"].components["minecraft:icon"];
    if (typeof icon === "string") {
      if (!texData[icon]) {
        err(def.relPath, `Ícono "${icon}" NO está en item_texture.json`);
      } else {
        const texPath = texData[icon].textures;
        const pngPath = `resource_pack/${texPath}.png`;
        if (!fileExists(pngPath)) {
          err(def.relPath, `PNG no existe: ${pngPath}`);
        } else if (!pngValid(pngPath)) {
          err(def.relPath, `${pngPath} no es un PNG válido (magic bytes incorrectos)`);
        } else {
          const dims = pngDimensions(pngPath);
          if (dims) {
            if (dims.w !== 16 || dims.h !== 16) {
              warn(def.relPath, `Ícono ${pngPath} es ${dims.w}x${dims.h} — recomendado 16x16`);
            }
            ok(def.relPath, `Ícono → ${texPath}.png (${dims.w}x${dims.h}) ✓`);
          }
        }
      }
    }
  }

  // Entradas huérfanas en item_texture.json?
  const usedIcons = new Set(Object.values(itemDefs).map(d =>
    d.data["minecraft:item"].components["minecraft:icon"]
  ).filter(i => typeof i === "string"));
  for (const key of Object.keys(texData)) {
    if (!usedIcons.has(key)) {
      warn("resource_pack/textures/item_texture.json", `Entrada huérfana: "${key}" — ningún item la usa`);
    }
  }
}

// ══════════════════════════════════════════
// 4. Attachable validation
// ══════════════════════════════════════════
console.log("\n=== 4. ATTACHABLES ===");

const attachablesDir = path.join(ROOT, "resource_pack", "attachables");
if (fs.existsSync(attachablesDir)) {
  const attachFiles = fs.readdirSync(attachablesDir).filter(f => f.endsWith(".json"));
  for (const file of attachFiles) {
    const relPath = `resource_pack/attachables/${file}`;
    const data = readJSON(relPath);
    if (!data) continue;

    const att = data["minecraft:attachable"];
    if (!att) { err(relPath, "Falta 'minecraft:attachable'"); continue; }

    const desc = att.description;
    if (!desc) { err(relPath, "Falta description"); continue; }
    if (!desc.identifier) err(relPath, "Falta identifier");

    // Verificar que el identifier corresponde a un item existente
    if (desc.identifier && !itemDefs[desc.identifier]) {
      warn(relPath, `Identifier ${desc.identifier} no corresponde a ningún item en BP`);
    }

    // Materials
    if (!desc.materials?.default) warn(relPath, "Sin material 'default'");

    // Textures
    if (!desc.textures?.default) err(relPath, "Sin textura 'default'");
    else {
      const texRef = desc.textures.default;
      const texPng = `resource_pack/${texRef}.png`;
      if (!fileExists(texPng)) {
        err(relPath, `Textura no existe: ${texPng}`);
      } else if (!pngValid(texPng)) {
        err(relPath, `${texPng} no es PNG válido`);
      } else {
        const dims = pngDimensions(texPng);
        ok(relPath, `Textura modelo: ${texRef}.png (${dims.w}x${dims.h}) ✓`);
      }
    }

    // Geometry
    if (!desc.geometry?.default) err(relPath, "Sin geometría 'default'");
    else {
      const geoId = desc.geometry.default;
      // Buscar el archivo de geometría
      const modelsDir = path.join(ROOT, "resource_pack", "models", "entity");
      let geoFound = false;
      if (fs.existsSync(modelsDir)) {
        const geoFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith(".json"));
        for (const gf of geoFiles) {
          const geoData = readJSON(`resource_pack/models/entity/${gf}`);
          if (!geoData) continue;
          const geos = geoData["minecraft:geometry"];
          if (Array.isArray(geos)) {
            for (const g of geos) {
              if (g.description?.identifier === geoId) {
                geoFound = true;
                // Validate geometry
                validateGeometry(g, `resource_pack/models/entity/${gf}`, geoId);
              }
            }
          }
        }
      }
      if (!geoFound) err(relPath, `Geometría "${geoId}" no encontrada en models/entity/`);
      else ok(relPath, `Geometría ${geoId} encontrada ✓`);
    }

    // Render controllers
    if (!desc.render_controllers || desc.render_controllers.length === 0) {
      warn(relPath, "Sin render_controllers");
    }

    ok(relPath, `Attachable ${desc.identifier} validado`);
  }
} else {
  console.log("  (No hay directorio attachables)");
}

// ══════════════════════════════════════════
// 5. Geometry deep validation
// ══════════════════════════════════════════
function validateGeometry(geo, relPath, geoId) {
  const desc = geo.description;
  if (!desc) { err(relPath, `${geoId}: falta description`); return; }

  const texW = desc.texture_width;
  const texH = desc.texture_height;
  if (!texW || !texH) {
    warn(relPath, `${geoId}: sin texture_width/texture_height en description`);
  }

  const bones = geo.bones;
  if (!bones || bones.length === 0) {
    err(relPath, `${geoId}: sin bones`);
    return;
  }

  for (const bone of bones) {
    if (!bone.name) err(relPath, `${geoId}: bone sin name`);
    if (!bone.pivot) warn(relPath, `${geoId}: bone "${bone.name}" sin pivot`);

    if (bone.cubes) {
      for (let i = 0; i < bone.cubes.length; i++) {
        const cube = bone.cubes[i];
        if (!cube.origin || !Array.isArray(cube.origin) || cube.origin.length !== 3) {
          err(relPath, `${geoId}: bone "${bone.name}" cube[${i}] sin origin [x,y,z]`);
        }
        if (!cube.size || !Array.isArray(cube.size) || cube.size.length !== 3) {
          err(relPath, `${geoId}: bone "${bone.name}" cube[${i}] sin size [w,h,d]`);
        }
        if (cube.uv === undefined) {
          err(relPath, `${geoId}: bone "${bone.name}" cube[${i}] sin uv`);
        }

        // UV bounds check
        if (texW && texH && cube.uv && Array.isArray(cube.uv) && cube.size) {
          const [u, v] = cube.uv;
          const [sw, sh, sd] = cube.size;
          // Box UV: width = (sd + sw) * 2, height = sd + sh
          const uvWidth = (sd + sw) * 2;
          const uvHeight = sd + sh;
          if (u + uvWidth > texW) {
            err(relPath, `${geoId}: cube[${i}] UV overflow horizontal: u=${u} + ancho UV ${uvWidth} = ${u + uvWidth} > texWidth ${texW}`);
          }
          if (v + uvHeight > texH) {
            err(relPath, `${geoId}: cube[${i}] UV overflow vertical: v=${v} + alto UV ${uvHeight} = ${v + uvHeight} > texHeight ${texH}`);
          }
        }

        // Position sanity — for head attachable, cubes should be near y=24 (head height)
        if (cube.origin) {
          const [x, y, z] = cube.origin;
          if (y < -10 || y > 50) {
            warn(relPath, `${geoId}: cube[${i}] origin.y=${y} — fuera del rango típico de un jugador`);
          }
          if (Math.abs(x) > 20 || Math.abs(z) > 20) {
            warn(relPath, `${geoId}: cube[${i}] origin.x/z muy lejos del centro — ¿intencional?`);
          }
        }

        // Size sanity
        if (cube.size) {
          for (let s = 0; s < 3; s++) {
            if (cube.size[s] <= 0) err(relPath, `${geoId}: cube[${i}] size[${s}]=${cube.size[s]} — debe ser > 0`);
            if (cube.size[s] > 32) warn(relPath, `${geoId}: cube[${i}] size[${s}]=${cube.size[s]} — muy grande`);
          }
        }
      }
      ok(relPath, `${geoId}: ${bone.cubes.length} cubos en bone "${bone.name}" — UVs validados`);
    }
  }
}

// ══════════════════════════════════════════
// 6. Lang files
// ══════════════════════════════════════════
console.log("\n=== 5. LANG FILES ===");

for (const langPath of ["behavior_pack/texts/en_US.lang", "resource_pack/texts/en_US.lang"]) {
  if (!fileExists(langPath)) {
    err(langPath, "Archivo lang no existe");
    continue;
  }
  const content = fs.readFileSync(path.join(ROOT, langPath), "utf8");
  for (const id of Object.keys(itemDefs)) {
    const key = `item.${id}.name`;
    if (!content.includes(key)) {
      err(langPath, `Falta traducción: ${key}`);
    } else {
      ok(langPath, `${key} ✓`);
    }
  }
}

// ══════════════════════════════════════════
// 7. Script API validation
// ══════════════════════════════════════════
console.log("\n=== 6. SCRIPT API ===");

const scriptPath = "behavior_pack/scripts/samson_effects.js";
if (fileExists(scriptPath)) {
  const script = fs.readFileSync(path.join(ROOT, scriptPath), "utf8");

  // Check imports
  const imports = script.match(/import\s*\{([^}]+)\}\s*from\s*"@minecraft\/server"/);
  if (!imports) {
    err(scriptPath, "No importa de @minecraft/server");
  } else {
    const imported = imports[1].split(",").map(s => s.trim());
    ok(scriptPath, `Imports: ${imported.join(", ")}`);

    // Verify used APIs exist in imports
    const apiUsage = {
      "world.afterEvents": "world",
      "system.run": "system",
      "system.runInterval": "system",
      "system.currentTick": "system",
      "EquipmentSlot.Head": "EquipmentSlot",
      "EquipmentSlot.Mainhand": "EquipmentSlot",
    };
    for (const [usage, need] of Object.entries(apiUsage)) {
      if (script.includes(usage) && !imported.includes(need)) {
        err(scriptPath, `Usa ${usage} pero no importa "${need}"`);
      }
    }
  }

  // Check for common Script API mistakes
  if (script.includes("beforeEvents.itemUse")) {
    warn(scriptPath, "Usa beforeEvents.itemUse — puede causar problemas de timing");
  }
  if (script.includes("player.runCommand") && !script.includes("system.run")) {
    warn(scriptPath, "Usa runCommand fuera de system.run() — puede fallar en algunos contextos");
  }

  // Verify event names are valid
  const validAfterEvents = [
    "entityHitEntity", "playerInteractWithEntity", "itemCompleteUse",
    "itemUse", "entityHurt", "playerSpawn", "worldInitialize",
    "chatSend", "entityDie", "pistonActivate", "leverActivate",
    "buttonPush", "tripWireTrip", "playerBreakBlock", "playerPlaceBlock",
  ];
  const afterEventMatches = script.matchAll(/world\.afterEvents\.(\w+)/g);
  for (const match of afterEventMatches) {
    const eventName = match[1];
    if (!validAfterEvents.includes(eventName)) {
      warn(scriptPath, `Evento "${eventName}" no reconocido — verificar en docs`);
    } else {
      ok(scriptPath, `Evento afterEvents.${eventName} ✓`);
    }
  }

  // Verify effect names are valid Bedrock effects
  const validEffects = [
    "speed", "slowness", "haste", "mining_fatigue", "strength", "instant_health",
    "instant_damage", "jump_boost", "nausea", "regeneration", "resistance",
    "fire_resistance", "water_breathing", "invisibility", "blindness", "night_vision",
    "hunger", "weakness", "poison", "wither", "health_boost", "absorption",
    "saturation", "levitation", "fatal_poison", "conduit_power", "slow_falling",
    "bad_omen", "village_hero", "darkness",
  ];
  const effectMatches = script.matchAll(/addEffect\("(\w+)"/g);
  for (const match of effectMatches) {
    const effectName = match[1];
    if (!validEffects.includes(effectName)) {
      err(scriptPath, `Efecto "${effectName}" no existe en Bedrock`);
    }
  }
  const removeMatches = script.matchAll(/removeEffect\("(\w+)"/g);
  for (const match of removeMatches) {
    const effectName = match[1];
    if (!validEffects.includes(effectName)) {
      err(scriptPath, `removeEffect: "${effectName}" no existe en Bedrock`);
    }
  }

  ok(scriptPath, "Análisis de Script API completo");
} else {
  err(scriptPath, "Script principal no existe");
}

// ══════════════════════════════════════════
// RESUMEN FINAL
// ══════════════════════════════════════════
console.log("\n" + "═".repeat(50));
console.log("RESUMEN DE VALIDACIÓN");
console.log("═".repeat(50));

if (errors.length === 0 && warnings.length === 0) {
  console.log("\n🎉 TODO PERFECTO — Sin errores ni warnings.");
} else {
  if (errors.length > 0) {
    console.log(`\n🔴 ERRORES (${errors.length}):`);
    for (const e of errors) console.log(`  ${e}`);
  }
  if (warnings.length > 0) {
    console.log(`\n🟡 WARNINGS (${warnings.length}):`);
    for (const w of warnings) console.log(`  ${w}`);
  }
}

console.log(`\nTotal: ${errors.length} errores, ${warnings.length} warnings`);
process.exit(errors.length > 0 ? 1 : 0);
