const fs = require("fs");
const path = require("path");
const root = "c:\\Proyectos\\Addons\\mi-addon";

const itemsDir = path.join(root, "behavior_pack", "items");
const itemFiles = fs.readdirSync(itemsDir).filter(f => f.endsWith(".json"));
const items = {};
for (const f of itemFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(itemsDir, f), "utf8"));
  const id = data["minecraft:item"]?.description?.identifier;
  const iconComp = data["minecraft:item"]?.components?.["minecraft:icon"];
  const icon = typeof iconComp === "string" ? iconComp : iconComp?.textures?.default || iconComp?.texture;
  items[f] = { id, icon };
}

const texJson = JSON.parse(fs.readFileSync(path.join(root, "resource_pack", "textures", "item_texture.json"), "utf8"));
const texKeys = Object.keys(texJson.texture_data);
const texPaths = {};
for (const [k, v] of Object.entries(texJson.texture_data)) {
  texPaths[k] = v.textures;
}

const bpLang = fs.readFileSync(path.join(root, "behavior_pack", "texts", "en_US.lang"), "utf8");
const rpLang = fs.readFileSync(path.join(root, "resource_pack", "texts", "en_US.lang"), "utf8");

const bpManifest = JSON.parse(fs.readFileSync(path.join(root, "behavior_pack", "manifest.json"), "utf8"));
const rpManifest = JSON.parse(fs.readFileSync(path.join(root, "resource_pack", "manifest.json"), "utf8"));

const script = fs.readFileSync(path.join(root, "behavior_pack", "scripts", "samson_effects.js"), "utf8");

console.log("=== ITEM DEFINITIONS ===");
let errors = [];
for (const [file, info] of Object.entries(items)) {
  console.log(file + ": id=" + info.id + ", icon=" + info.icon);

  if (info.icon && !texKeys.includes(info.icon)) {
    errors.push("ERROR: " + file + " icon '" + info.icon + "' NOT FOUND in item_texture.json. Available: " + texKeys.join(", "));
  }

  const itemData = JSON.parse(fs.readFileSync(path.join(itemsDir, file), "utf8"));
  const displayName = itemData["minecraft:item"]?.components?.["minecraft:display_name"]?.value;
  if (displayName && displayName.startsWith("item.")) {
    if (!rpLang.includes(displayName + "=")) {
      errors.push("ERROR: " + file + " display_name '" + displayName + "' NOT FOUND in RP en_US.lang");
    }
    if (!bpLang.includes(displayName + "=")) {
      errors.push("ERROR: " + file + " display_name '" + displayName + "' NOT FOUND in BP en_US.lang");
    }
  }
}

console.log("\n=== TEXTURE REFERENCES ===");
for (const [k, texPath] of Object.entries(texPaths)) {
  const pngPath = path.join(root, "resource_pack", texPath + ".png");
  const exists = fs.existsSync(pngPath);
  console.log(k + " -> " + texPath + " -> PNG exists: " + exists);
  if (!exists) errors.push("ERROR: PNG missing for texture '" + k + "': " + pngPath);
}

console.log("\n=== SCRIPT REFERENCES ===");
const scriptItemIds = ["miaddon:samson_hair", "miaddon:scissors", "miaddon:samson_scroll"];
for (const id of scriptItemIds) {
  const found = script.includes('"' + id + '"');
  console.log("Script references " + id + ": " + found);
  if (!found) errors.push("ERROR: Script does not reference item " + id);
}

console.log("\n=== MANIFEST CHECKS ===");
const hasScriptModule = bpManifest.modules?.some(m => m.type === "script");
const scriptEntry = bpManifest.modules?.find(m => m.type === "script")?.entry;
const hasServerDep = bpManifest.dependencies?.some(d => d.module_name === "@minecraft/server");
const serverVer = bpManifest.dependencies?.find(d => d.module_name === "@minecraft/server")?.version;
console.log("BP has script module: " + hasScriptModule);
console.log("Script entry: " + scriptEntry);
if (scriptEntry) {
  const entryPath = path.join(root, "behavior_pack", scriptEntry);
  console.log("Entry file exists: " + fs.existsSync(entryPath));
  if (!fs.existsSync(entryPath)) errors.push("ERROR: Script entry file missing: " + entryPath);
}
console.log("Has @minecraft/server dep: " + hasServerDep + " (ver: " + serverVer + ")");

const rpUUID = rpManifest.header?.uuid;
const bpDepsRP = bpManifest.dependencies?.some(d => d.uuid === rpUUID);
console.log("BP depends on RP UUID: " + bpDepsRP);

// Check components validity for 1.21.10
console.log("\n=== COMPONENT DEEP CHECKS ===");
for (const [file, info] of Object.entries(items)) {
  const itemData = JSON.parse(fs.readFileSync(path.join(itemsDir, file), "utf8"));
  const mi = itemData["minecraft:item"];
  const fv = itemData.format_version;
  const comps = mi?.components || {};
  const compNames = Object.keys(comps);
  console.log(file + " (format " + fv + "): components = " + compNames.join(", "));
  
  // Check for known problematic components
  if (comps["minecraft:use_animation"] && !comps["minecraft:food"]) {
    errors.push("WARN: " + file + " has minecraft:use_animation without minecraft:food");
  }
  if (comps["minecraft:glint"] && typeof comps["minecraft:glint"] !== "boolean") {
    errors.push("WARN: " + file + " minecraft:glint should be boolean in 1.21.10+");
  }
  if (comps["minecraft:hand_equipped"]) {
    errors.push("WARN: " + file + " minecraft:hand_equipped is DEPRECATED in 1.21.10. Use minecraft:hand_equipped component is removed.");
  }
}

console.log("\n=== ERRORS FOUND ===");
if (errors.length === 0) {
  console.log("No issues found!");
} else {
  errors.forEach(e => console.log(e));
}
console.log("Total issues: " + errors.length);
