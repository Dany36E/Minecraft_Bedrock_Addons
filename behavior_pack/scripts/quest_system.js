// quest_system.js — Biblical Quest & Progression System
// Tracks player progress through biblical narratives with rewards
import { world, system } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

// ══════════════════════════════════════════
// QUEST DEFINITIONS
// ══════════════════════════════════════════
const QUESTS = {
  david_journey: {
    title: "§b§lEl Pastor de Belén",
    icon: "§b⚔",
    description: "Recorre el camino de David, desde pastor hasta rey.",
    verse: "§o\"Jehová no mira lo que mira el hombre\" — I Samuel 16:7",
    steps: [
      { id: "craft_sling",       text: "Craftea la Honda de David",           reward: "§a+2 niveles de XP" },
      { id: "transform_david",   text: "Transfórmate en David",               reward: "§a+3 niveles de XP" },
      { id: "kill_goliath",      text: "Derrota a un jugador Goliát",         reward: "§6Lanza de Bronce + 5 niveles" },
      { id: "sling_10",          text: "Golpea 10 enemigos con la honda",     reward: "§a+5 niveles de XP" }
    ],
    finalReward: "§6§l✦ Título: REY DAVID ✦"
  },
  samson_redemption: {
    title: "§6§lLa Redención de Sansón",
    icon: "§6✦",
    description: "Vive la historia completa del nazareo más fuerte de Israel.",
    verse: '§o"Señor, acuérdate de mí" — Jueces 16:28',
    steps: [
      { id: "transform_samson", text: "Transfórmate en Sansón",               reward: "§a+2 niveles de XP" },
      { id: "hair_cut",         text: "Sobrevive la traición de Dalila",      reward: "§a+3 niveles de XP" },
      { id: "hair_regrown",     text: "Recupera tu cabello y fuerza",         reward: "§a+3 niveles de XP" },
      { id: "destroy_temple",   text: "Destruye el Templo de Dagón",          reward: "§6Cabello de Sansón + 5 niveles" }
    ],
    finalReward: "§6§l✦ Título: NAZAREO DE DIOS ✦"
  },
  lords_builder: {
    title: "§e§lConstructor del Señor",
    icon: "§e⛪",
    description: "Edifica las grandes obras de la historia bíblica.",
    verse: '§o"Edifiquen la casa del Señor" — Esdras 1:2',
    steps: [
      { id: "build_3",   text: "Construye 3 estructuras bíblicas",    reward: "§a+3 niveles de XP" },
      { id: "build_7",   text: "Construye 7 estructuras bíblicas",    reward: "§a+5 niveles de XP" },
      { id: "build_all", text: "Construye las 11 estructuras",         reward: "§6Varita de Construcción encantada + 10 niveles" }
    ],
    finalReward: "§6§l✦ Título: MAESTRO CONSTRUCTOR ✦"
  },
  philistine_slayer: {
    title: "§c§lAzote de los Filisteos",
    icon: "§c☠",
    description: "Libra a Israel del yugo filisteo.",
    verse: '§o"El Señor peleará por vosotros" — Éxodo 14:14',
    steps: [
      { id: "slay_10",  text: "Derrota 10 filisteos",    reward: "§a+3 niveles de XP" },
      { id: "slay_50",  text: "Derrota 50 filisteos",    reward: "§6Honda de David + 5 niveles" },
      { id: "slay_100", text: "Derrota 100 filisteos",   reward: "§6Libro de Personajes + 10 niveles" }
    ],
    finalReward: "§6§l✦ Título: JUEZ DE ISRAEL ✦"
  }
};

// ══════════════════════════════════════════
// QUEST PROGRESS HELPERS
// ══════════════════════════════════════════

function getQuestData(player, questId) {
  try {
    const raw = player.getDynamicProperty(`quest:${questId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function setQuestData(player, questId, data) {
  try {
    player.setDynamicProperty(`quest:${questId}`, JSON.stringify(data));
  } catch {}
}

function isStepComplete(player, questId, stepId) {
  const data = getQuestData(player, questId);
  return !!data[stepId];
}

function completeStep(player, questId, stepId) {
  if (isStepComplete(player, questId, stepId)) return false;
  const data = getQuestData(player, questId);
  data[stepId] = system.currentTick;
  setQuestData(player, questId, data);
  return true;
}

function getCounter(player, key) {
  try {
    return player.getDynamicProperty(`counter:${key}`) || 0;
  } catch { return 0; }
}

function incrementCounter(player, key, amount = 1) {
  const val = getCounter(player, key) + amount;
  try { player.setDynamicProperty(`counter:${key}`, val); } catch {}
  return val;
}

function getCompletedSteps(player, questId) {
  const quest = QUESTS[questId];
  if (!quest) return 0;
  const data = getQuestData(player, questId);
  return quest.steps.filter(s => !!data[s.id]).length;
}

function isQuestComplete(player, questId) {
  const quest = QUESTS[questId];
  if (!quest) return false;
  return getCompletedSteps(player, questId) === quest.steps.length;
}

// ══════════════════════════════════════════
// REWARD SYSTEM
// ══════════════════════════════════════════

function grantStepReward(player, questId, stepIndex) {
  const quest = QUESTS[questId];
  const step = quest.steps[stepIndex];

  // XP rewards
  const xpMatch = step.reward.match(/\+(\d+) niveles/);
  if (xpMatch) {
    const levels = parseInt(xpMatch[1]);
    try { player.runCommand(`xp ${levels}L @s`); } catch {}
  }

  // Item rewards for final steps
  if (questId === "david_journey" && step.id === "kill_goliath") {
    try { player.runCommand("give @s miaddon:bronze_spear 1"); } catch {}
  }
  if (questId === "samson_redemption" && step.id === "destroy_temple") {
    try { player.runCommand("give @s miaddon:samson_hair 1"); } catch {}
  }
  if (questId === "philistine_slayer" && step.id === "slay_50") {
    try { player.runCommand("give @s miaddon:david_sling 1"); } catch {}
  }
  if (questId === "philistine_slayer" && step.id === "slay_100") {
    try { player.runCommand("give @s miaddon:characters_book 1"); } catch {}
  }

  // Sound
  const dim = player.dimension;
  const pos = player.location;
  try {
    dim.runCommand(`playsound random.toast "${player.name}" ${pos.x} ${pos.y} ${pos.z} 1 1`);
  } catch {}
}

function grantFinalReward(player, questId) {
  const quest = QUESTS[questId];
  const pos = player.location;
  const dim = player.dimension;

  // Fanfare
  try {
    dim.runCommand(`playsound ui.toast.challenge_complete "${player.name}" ${pos.x} ${pos.y} ${pos.z} 1 1`);
    player.runCommand(`titleraw @s title {"rawtext":[{"text":"${quest.finalReward}"}]}`);
    player.runCommand(`titleraw @s subtitle {"rawtext":[{"text":"§eMisión completada"}]}`);
    dim.runCommand(`particle miaddon:divine_transform ${pos.x} ${pos.y + 1} ${pos.z}`);
  } catch {}

  // Bonus XP
  try { player.runCommand("xp 10L @s"); } catch {}
}

// ══════════════════════════════════════════
// NOTIFY STEP COMPLETION
// ══════════════════════════════════════════

function notifyStepComplete(player, questId, stepId) {
  const quest = QUESTS[questId];
  const stepIdx = quest.steps.findIndex(s => s.id === stepId);
  if (stepIdx < 0) return;

  const step = quest.steps[stepIdx];
  const completed = getCompletedSteps(player, questId);
  const total = quest.steps.length;

  player.sendMessage(`${quest.icon} §a¡Objetivo completado! §f${step.text}`);
  player.sendMessage(`§7  Recompensa: ${step.reward}`);
  player.sendMessage(`§7  Progreso: §e${completed}§7/§e${total}`);

  grantStepReward(player, questId, stepIdx);

  if (completed === total) {
    system.runTimeout(() => {
      player.sendMessage(`§6§l══════════════════════════════`);
      player.sendMessage(`${quest.icon} §6§l¡MISIÓN COMPLETADA!`);
      player.sendMessage(`§f${quest.title}`);
      player.sendMessage(`§e${quest.verse}`);
      player.sendMessage(`§6§l══════════════════════════════`);
      grantFinalReward(player, questId);
    }, 20);
  }
}

// ══════════════════════════════════════════
// QUEST TRIGGERS (exported for use by other modules)
// Called from characters_menu.js and samson_effects.js
// ══════════════════════════════════════════

// Track: player transformed into a character
export function onTransform(player, charId) {
  if (charId === "david" && completeStep(player, "david_journey", "transform_david")) {
    notifyStepComplete(player, "david_journey", "transform_david");
  }
  if (charId === "samson" && completeStep(player, "samson_redemption", "transform_samson")) {
    notifyStepComplete(player, "samson_redemption", "transform_samson");
  }
}

// Track: David killed Goliath
export function onDavidKillsGoliath(player) {
  if (completeStep(player, "david_journey", "kill_goliath")) {
    notifyStepComplete(player, "david_journey", "kill_goliath");
  }
}

// Track: Samson hair was cut
export function onSamsonHairCut(player) {
  if (completeStep(player, "samson_redemption", "hair_cut")) {
    notifyStepComplete(player, "samson_redemption", "hair_cut");
  }
}

// Track: Samson hair regrown
export function onSamsonHairRegrown(player) {
  if (completeStep(player, "samson_redemption", "hair_regrown")) {
    notifyStepComplete(player, "samson_redemption", "hair_regrown");
  }
}

// Track: Temple destroyed
export function onTempleDestroyed(player) {
  if (completeStep(player, "samson_redemption", "destroy_temple")) {
    notifyStepComplete(player, "samson_redemption", "destroy_temple");
  }
}

// Track: Structure built
export function onStructureBuilt(player) {
  const count = incrementCounter(player, "structures_built");
  if (count >= 3 && completeStep(player, "lords_builder", "build_3")) {
    notifyStepComplete(player, "lords_builder", "build_3");
  }
  if (count >= 7 && completeStep(player, "lords_builder", "build_7")) {
    notifyStepComplete(player, "lords_builder", "build_7");
  }
  if (count >= 11 && completeStep(player, "lords_builder", "build_all")) {
    notifyStepComplete(player, "lords_builder", "build_all");
  }
}

// Track: Philistine killed
export function onPhilistineKilled(player) {
  const count = incrementCounter(player, "philistines_killed");
  if (count >= 10 && completeStep(player, "philistine_slayer", "slay_10")) {
    notifyStepComplete(player, "philistine_slayer", "slay_10");
  }
  if (count >= 50 && completeStep(player, "philistine_slayer", "slay_50")) {
    notifyStepComplete(player, "philistine_slayer", "slay_50");
  }
  if (count >= 100 && completeStep(player, "philistine_slayer", "slay_100")) {
    notifyStepComplete(player, "philistine_slayer", "slay_100");
  }
}

// Track: Sling stone hits
export function onSlingHit(player) {
  const count = incrementCounter(player, "sling_hits");
  if (count >= 10 && completeStep(player, "david_journey", "sling_10")) {
    notifyStepComplete(player, "david_journey", "sling_10");
  }
}

// Track: Crafted sling
export function onCraftSling(player) {
  if (completeStep(player, "david_journey", "craft_sling")) {
    notifyStepComplete(player, "david_journey", "craft_sling");
  }
}

// ══════════════════════════════════════════
// QUEST MENU UI
// ══════════════════════════════════════════

export function showQuestMenu(player) {
  const form = new ActionFormData()
    .title("§6§l✦ Misiones Bíblicas ✦")
    .body("§7Completa misiones para ganar recompensas y títulos.\n§7Cada misión sigue una historia bíblica.");

  const questKeys = Object.keys(QUESTS);
  for (const qId of questKeys) {
    const q = QUESTS[qId];
    const completed = getCompletedSteps(player, qId);
    const total = q.steps.length;
    const done = completed === total;
    const status = done ? "§a✔ Completada" : `§e${completed}§7/§e${total}`;
    form.button(`${q.icon} ${q.title}\n§7${status}`);
  }
  form.button("§7Volver");

  form.show(player).then((res) => {
    if (res.canceled || res.selection === questKeys.length) return;
    system.run(() => showQuestDetail(player, questKeys[res.selection]));
  });
}

function showQuestDetail(player, questId) {
  const quest = QUESTS[questId];
  const data = getQuestData(player, questId);

  let body = `§f${quest.description}\n§e${quest.verse}\n\n§l§fObjetivos:\n`;

  for (let i = 0; i < quest.steps.length; i++) {
    const step = quest.steps[i];
    const done = !!data[step.id];
    const check = done ? "§a✔" : "§7○";
    const textColor = done ? "§a§m" : "§f";
    body += `\n${check} ${textColor}${step.text}§r`;
    body += `\n§7   ${step.reward}`;
  }

  const allDone = isQuestComplete(player, questId);
  if (allDone) {
    body += `\n\n${quest.finalReward}`;
  }

  // Counter display for relevant quests
  if (questId === "philistine_slayer") {
    const kills = getCounter(player, "philistines_killed");
    body += `\n\n§7Filisteos derrotados: §c${kills}`;
  }
  if (questId === "lords_builder") {
    const builds = getCounter(player, "structures_built");
    body += `\n\n§7Estructuras construidas: §e${builds}`;
  }
  if (questId === "david_journey") {
    const hits = getCounter(player, "sling_hits");
    body += `\n\n§7Impactos de honda: §b${hits}`;
  }

  const form = new MessageFormData()
    .title(quest.title)
    .body(body)
    .button1("§7Volver")
    .button2("§6Lista de misiones");

  form.show(player).then((res) => {
    if (res.selection === 1) {
      system.run(() => showQuestMenu(player));
    }
  });
}

// ══════════════════════════════════════════
// PHILISTINE KILL TRACKING
// (entityDie event for Philistines)
// ══════════════════════════════════════════
world.afterEvents.entityDie.subscribe((ev) => {
  if (ev.deadEntity?.typeId !== "miaddon:philistine") return;

  const source = ev.damageSource;
  const killer = source?.damagingEntity;
  if (!killer || killer.typeId !== "minecraft:player") return;

  onPhilistineKilled(killer);

  // Particle + sound on kill
  const pos = ev.deadEntity.location;
  const dim = killer.dimension;
  try {
    dim.runCommand(`playsound mob.vindicator.death @a[r=16] ${pos.x} ${pos.y} ${pos.z} 0.8 0.8`);
  } catch {}
});

// ══════════════════════════════════════════
// CRAFT TRACKING (for sling)
// ══════════════════════════════════════════
world.afterEvents.playerInteractWithBlock.subscribe((ev) => {
  // Check if player just got a sling in inventory after using crafting table
  if (ev.block?.typeId !== "minecraft:crafting_table") return;
  const player = ev.player;

  // Delayed check for sling in inventory
  system.runTimeout(() => {
    try {
      const inv = player.getComponent("inventory")?.container;
      if (!inv) return;
      for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i);
        if (item?.typeId === "miaddon:david_sling") {
          onCraftSling(player);
          return;
        }
      }
    } catch {}
  }, 5);
});

// ══════════════════════════════════════════
// PHILISTINE WAVE SPAWNER
// /scriptevent miaddon:philistines [count]
// ══════════════════════════════════════════
system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id !== "miaddon:philistines") return;
  const player = ev.sourceEntity;
  if (!player || player.typeId !== "minecraft:player") return;

  const count = Math.min(Math.max(parseInt(ev.message) || 6, 1), 20);
  const pos = player.location;
  const dim = player.dimension;

  player.sendMessage(`§c§l¡OLEADA DE ${count} FILISTEOS!`);
  player.sendMessage('§c§o"Los filisteos vinieron contra Israel" — I Samuel 4:2');

  try {
    dim.runCommand(`playsound mob.wither.spawn @a[r=64] ${pos.x} ${pos.y} ${pos.z} 0.5 1.5`);
  } catch {}

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    const radius = 8 + Math.random() * 6;
    const sx = pos.x + Math.cos(angle) * radius;
    const sz = pos.z + Math.sin(angle) * radius;

    system.runTimeout(() => {
      try {
        dim.spawnEntity("miaddon:philistine", { x: sx, y: pos.y + 1, z: sz });
        dim.runCommand(`particle minecraft:campfire_smoke_particle ${sx} ${pos.y + 1} ${sz}`);
      } catch {}
    }, i * 5);
  }
});
