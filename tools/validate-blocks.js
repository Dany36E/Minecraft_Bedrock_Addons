// validate-blocks.js — Verifica que los block IDs sean válidos en Bedrock 1.21
const fs = require("fs");
const path = require("path");

const VALID = new Set([
  "minecraft:oak_planks","minecraft:spruce_planks","minecraft:birch_planks","minecraft:dark_oak_planks",
  "minecraft:acacia_planks","minecraft:jungle_planks",
  "minecraft:oak_log","minecraft:spruce_log","minecraft:birch_log","minecraft:dark_oak_log",
  "minecraft:acacia_log","minecraft:stripped_oak_log",
  "minecraft:oak_stairs","minecraft:spruce_stairs","minecraft:dark_oak_stairs","minecraft:acacia_stairs",
  "minecraft:oak_fence","minecraft:spruce_fence","minecraft:birch_fence","minecraft:dark_oak_fence",
  "minecraft:oak_door","minecraft:dark_oak_door","minecraft:spruce_door",
  "minecraft:oak_trapdoor","minecraft:dark_oak_trapdoor","minecraft:spruce_trapdoor",
  "minecraft:oak_slab","minecraft:spruce_slab","minecraft:dark_oak_slab",
  "minecraft:stone","minecraft:cobblestone","minecraft:stone_bricks","minecraft:stone_brick_stairs",
  "minecraft:stone_brick_slab","minecraft:smooth_stone","minecraft:smooth_stone_slab",
  "minecraft:cobblestone_wall","minecraft:stone_brick_wall","minecraft:cobblestone_stairs",
  "minecraft:blackstone","minecraft:polished_blackstone",
  "minecraft:sandstone","minecraft:smooth_sandstone","minecraft:sandstone_stairs",
  "minecraft:smooth_sandstone_stairs","minecraft:sandstone_slab","minecraft:smooth_sandstone_slab",
  "minecraft:cut_sandstone","minecraft:chiseled_sandstone",
  "minecraft:glass","minecraft:glass_pane",
  "minecraft:hardened_clay","minecraft:orange_terracotta","minecraft:red_terracotta",
  "minecraft:brown_terracotta","minecraft:clay","minecraft:terracotta",
  "minecraft:white_wool","minecraft:purple_wool","minecraft:blue_wool",
  "minecraft:gold_block","minecraft:iron_block","minecraft:iron_bars","minecraft:iron_trapdoor",
  "minecraft:chain",
  "minecraft:netherrack","minecraft:nether_brick_fence","minecraft:nether_bricks",
  "minecraft:dirt","minecraft:grass_block","minecraft:water","minecraft:fire",
  "minecraft:campfire","minecraft:torch","minecraft:soul_torch",
  "minecraft:ladder","minecraft:chest","minecraft:furnace","minecraft:crafting_table",
  "minecraft:air","minecraft:oak_sign","minecraft:spruce_sign",
  "minecraft:mud_bricks","minecraft:mud_brick_stairs","minecraft:mud_brick_slab",
  "minecraft:stained_glass","minecraft:blue_stained_glass","minecraft:purple_stained_glass",
  "minecraft:bed","minecraft:red_bed","minecraft:white_bed",
  "minecraft:bricks","minecraft:brick_block",
  "minecraft:red_sandstone","minecraft:cut_red_sandstone",
]);

const dir = path.join(__dirname, "..", "behavior_pack", "scripts", "structures");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js") && f !== "all_structures.js");
const allBlocks = new Set();
const issues = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), "utf8");
  const regex = /"(minecraft:[a-z_]+)"/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    allBlocks.add(m[1]);
    if (!VALID.has(m[1])) {
      issues.push({ file, block: m[1] });
    }
  }
}

console.log(`Block types found: ${allBlocks.size}`);
if (issues.length > 0) {
  console.log("\nPOTENTIAL ISSUES:");
  for (const i of issues) console.log(`  ${i.file}: ${i.block}`);
} else {
  console.log("All block types appear valid!");
}
console.log("\nAll unique blocks:");
for (const b of [...allBlocks].sort()) console.log(`  ${b}`);
