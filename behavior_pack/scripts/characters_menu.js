import { world, system } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import {
  onTransform, onDavidKillsGoliath, onSamsonHairCut,
  onSamsonHairRegrown, onTempleDestroyed, onSlingHit
} from "./quest_system.js";

// ── Estado global ──────────────────────────────────────
const transforms = new Map();
// playerName → { entity, charId, tickCount, lastAttackMsg }

// ── Limpieza de entidades huérfanas al cargar ──────────
const GHOST_TYPES = [
  "miaddon:samson_entity", "miaddon:dalila_entity",
  "miaddon:david_entity",  "miaddon:goliath_entity"
];
system.runTimeout(() => {
  try {
    const dim = world.getDimension("overworld");
    for (const type of GHOST_TYPES) {
      for (const ent of dim.getEntities({ type })) {
        try { ent.remove(); } catch {}
      }
    }
  } catch {}
}, 20);

// ── Datos de personajes ────────────────────────────────
const CHARS = {
  samson: {
    entityType: "miaddon:samson_entity",
    title: "§6§l⚡ Sansón — Nazareo de Israel",
    body:
      "§eJueces 13-16\n\n" +
      "§7Juez de Israel. Su fuerza venía del voto sagrado\n" +
      "§7del nazareo y del Espíritu de Dios.\n\n" +
      "§o§e\"El Espíritu del Señor vino poderosamente sobre él\"\n" +
      "§o§e— Jueces 14:6\n\n" +
      "§8─────────────────────────────\n" +
      "§fEscala: §anormal §8| §fFuerza: §asobrehumana\n" +
      "§fHabilidades:\n" +
      "§7 · §eFuerza IV §8— §7Daño masivo cuerpo a cuerpo\n" +
      "§7 · §eResistencia I §8— §7Reduce daño recibido\n" +
      "§7 · §eVelocidad I §8— §7Movimiento más rápido\n" +
      "§7 · §eSalto II §8— §7Saltos más altos\n" +
      "§7 · §eAura de poder §8— §7Partículas divinas",
    effects: [
      ["strength",4,9999],["haste",2,9999],["speed",1,9999],
      ["resistance",1,9999],["jump_boost",2,9999],["regeneration",0,9999]
    ],
    msg: "§6§l✦ EL ESPÍRITU DEL SEÑOR VINO SOBRE SANSÓN ✦\n§e§o\"Comenzó a manifestarse en él\" — Jueces 13:25",
    attackEffect: ["slowness",1,60]
  },
  dalila: {
    entityType: "miaddon:dalila_entity",
    title: "§d§l🗡 Dalila — Mujer del Valle de Sorec",
    body:
      "§eJueces 16:4-20\n\n" +
      "§7Filistea. Recibió 1,100 siclos de plata por\n" +
      "§7traicionar a Sansón y descubrir su secreto.\n\n" +
      "§o§d\"¿Cómo dices que me amas?\" — Jueces 16:15\n\n" +
      "§8─────────────────────────────\n" +
      "§fEscala: §aligera (0.9×) §8| §fVelocidad: §aalta\n" +
      "§fHabilidades:\n" +
      "§7 · §dVelocidad I §8— §7Movimiento ágil\n" +
      "§7 · §dVisión nocturna §8— §7Ve en la oscuridad\n" +
      "§7 · §dSuerte I §8— §7Mejor botín\n" +
      "§7 · §dCortar pelo §8— §7Debilita a Sansón al atacarlo",
    effects: [
      ["speed",1,9999],["night_vision",0,9999],["luck",1,9999],
      ["jump_boost",1,9999]
    ],
    msg: "§d§l✦ Entras al valle de Sorec como Dalila.\n§7§o\"...se llamaba Dalila\" — Jueces 16:4",
    attackEffect: ["weakness",2,100]
  },
  david: {
    entityType: "miaddon:david_entity",
    title: "§b§l🪨 David — Pastor de Belén",
    body:
      "§eI Samuel 16-17\n\n" +
      "§7Menor de 8 hijos. Rubio, hermosos ojos.\n" +
      "§7Mató a Goliat con una piedra y una honda.\n\n" +
      "§o§b\"Rubio, de hermosos ojos, y de buen parecer\"\n" +
      "§o§b— I Samuel 16:12\n\n" +
      "§8─────────────────────────────\n" +
      "§fEscala: §ejoven (0.82×) §8| §fVelocidad: §aágil\n" +
      "§fHabilidades:\n" +
      "§7 · §bVelocidad II §8— §7Muy rápido y ágil\n" +
      "§7 · §bHonda de piedras §8— §7Proyectil a distancia\n" +
      "§7 · §bMata-gigantes §8— §7Daño ×5 contra Goliát\n" +
      "§7 · §bSuerte I §8— §7Favorecido por Dios",
    effects: [
      ["speed",2,9999],["luck",1,9999],["resistance",0,9999],["jump_boost",1,9999]
    ],
    msg: "§b§l✦ El Señor está contigo, David.\n§7§o\"No temas al filisteo\" — I Samuel 17:32",
    attackEffect: ["slowness",0,40]
  },
  goliath: {
    entityType: "miaddon:goliath_entity",
    title: "§c§l💀 Goliát — Campeón de Gat",
    body:
      "§eI Samuel 17:4-7\n\n" +
      "§7Altura: 6 codos y 1 palmo = 2.9 m.\n" +
      "§7Armadura: 57 kg de bronce. Guerrero temible.\n\n" +
      "§o§c\"Un hombre de guerra desde su juventud\"\n" +
      "§o§c— I Samuel 17:33\n\n" +
      "§8─────────────────────────────\n" +
      "§fEscala: §cGIGANTE (1.85×) §8| §fFuerza: §cdestructiva\n" +
      "§fHabilidades:\n" +
      "§7 · §cFuerza IV §8— §7Golpes demoledores\n" +
      "§7 · §cResistencia III §8— §7Casi invulnerable\n" +
      "§7 · §cVida extra III §8— §7Enorme salud\n" +
      "§7 · §cGrito §8— §7Invoca filisteos aliados\n" +
      "§7 · §8Lentitud I §8— §7Su tamaño lo hace lento",
    effects: [
      ["strength",4,9999],["resistance",3,9999],
      ["slowness",1,9999],["health_boost",3,9999]
    ],
    msg: "§c§l✦ ¡ERES GOLIÁT, CAMPEÓN DE LOS FILISTEOS!\n§c§o\"¡Venid a mí!\" — I Samuel 17:44",
    attackEffect: ["slowness",2,80]
  }
};

// ── Helpers: sonidos y partículas ───────────────────────
function playSound(dim, pos, sound, targets = "@a[r=32]", vol = 1, pitch = 1) {
  try { dim.runCommand(`playsound ${sound} ${targets} ${pos.x} ${pos.y} ${pos.z} ${vol} ${pitch}`); } catch {}
}
function spawnParticle(dim, pos, particleId) {
  try { dim.runCommand(`particle ${particleId} ${pos.x} ${pos.y} ${pos.z}`); } catch {}
}
function showTitle(player, title, subtitle) {
  try {
    player.runCommand(`titleraw @s title {"rawtext":[{"text":"${title}"}]}`);
    if (subtitle) player.runCommand(`titleraw @s subtitle {"rawtext":[{"text":"${subtitle}"}]}`);
  } catch {}
}

// ── Sistema de proyectil: Honda de David ────────────────
const activeSlingStones = new Set(); // { stone, shooter, spawnTick }
const SLING_COOLDOWNS = new Map(); // playerName → tick

// ── LISTENER: Libro de Personajes + Honda ──────────────
world.beforeEvents.itemUse.subscribe((ev) => {
  const typeId = ev.itemStack?.typeId;

  // ── Libro de personajes ──
  if (typeId === "miaddon:characters_book") {
    ev.cancel = true;
    const player = ev.source;
    if (transforms.has(player.name)) {
      system.run(() => revert(player));
    } else {
      system.run(() => openMenu(player));
    }
    return;
  }

  // ── Honda de David (solo funciona como David) ──
  if (typeId === "miaddon:david_sling") {
    const player = ev.source;
    const state = transforms.get(player.name);
    if (state?.charId === "david") {
      ev.cancel = true;
      const now = system.currentTick;
      const lastShot = SLING_COOLDOWNS.get(player.name) || 0;
      if (now - lastShot < 15) return; // 0.75s cooldown
      SLING_COOLDOWNS.set(player.name, now);
      system.run(() => launchSlingStone(player));
    }
  }
});

// ── MENÚ PRINCIPAL ─────────────────────────────────────
function openMenu(player) {
  const form = new ActionFormData()
    .title("§l§6✦ Personajes Bíblicos ✦")
    .body(
      "§e📖 Conviértete en un héroe o villano bíblico.\n" +
      "§7Usa el §eLibro de Personajes§7 de nuevo para revertir.\n\n" +
      "§a⚔ ISRAEL §8· · · · · · · · §c☠ FILISTEA\n" +
      "§eSansón, David §8              §cGoliát, Dalila\n\n" +
      "§8─────────────────────────────"
    )
    .button("§l§6⚡ Sansón§r\n§7Nazareo · Fuerza sobrehumana")
    .button("§l§b🪨 David§r\n§7Pastor de Belén · Honda y valentía")
    .button("§l§c💀 Goliát§r\n§7Gigante 2.9m · Poder destructivo")
    .button("§l§d🗡 Dalila§r\n§7Valle de Sorec · Velocidad y astucia")
    .button("§8Cerrar");

  form.show(player).then((res) => {
    if (res.canceled || res.selection === 4) return;
    const keys = ["samson","david","goliath","dalila"];
    system.run(() => showConfirm(player, keys[res.selection]));
  });
}

// ── CONFIRMACIÓN CON LORE ──────────────────────────────
function showConfirm(player, charId) {
  const c = CHARS[charId];
  const form = new MessageFormData()
    .title(c.title)
    .body(c.body)
    .button1("§7← Volver")
    .button2("§a✦ Transformarme");

  form.show(player).then((res) => {
    if (res.canceled || res.selection === 0) {
      system.run(() => openMenu(player));
      return;
    }
    system.run(() => transform(player, charId));
  });
}

// ── TRANSFORMACIÓN ─────────────────────────────────────
function transform(player, charId) {
  // Revertir transformación previa si existe
  if (transforms.has(player.name)) revert(player);

  const c = CHARS[charId];
  const pos = player.location;
  const dim = player.dimension;

  let entity;
  try {
    entity = dim.spawnEntity(c.entityType, { x: pos.x, y: pos.y, z: pos.z });
  } catch(e) {
    player.sendMessage("§c❌ Error al crear entidad: " + e.message);
    player.sendMessage("§7Verifica que el addon está desplegado correctamente.");
    return;
  }

  if (!entity) {
    player.sendMessage("§c❌ No se pudo crear la entidad del personaje.");
    return;
  }

  // Guardar estado
  transforms.set(player.name, {
    entity, charId,
    tickCount: 0,
    lastAttackMsg: 0
  });

  // Hacer invisible al jugador
  player.addEffect("invisibility", 9999999,
    { amplifier: 0, showParticles: false });

  // Aplicar efectos del personaje
  for (const [eff, amp, dur] of c.effects) {
    try {
      player.addEffect(eff, dur * 20,
        { amplifier: amp, showParticles: false });
    } catch {}
  }

  player.sendMessage(c.msg);
  player.sendMessage("§7§o[Usa el libro de personajes para revertir]");

  // ── Sonido + Partículas + Título ──
  playSound(dim, pos, "random.levelup", `"${player.name}"`, 1, 1);
  playSound(dim, pos, "mob.endermen.portal", "@a[r=32]", 0.5, 1.5);
  spawnParticle(dim, { x: pos.x, y: pos.y + 1, z: pos.z }, "miaddon:divine_transform");

  const titleColors = { samson: "§6§l", dalila: "§d§l", david: "§b§l", goliath: "§c§l" };
  const titleNames = { samson: "SANSÓN", dalila: "DALILA", david: "DAVID", goliath: "GOLIÁT" };
  const titleSubs = {
    samson: "§eNazareo de Israel",
    dalila: "§7Mujer del Valle de Sorec",
    david: "§ePastor de Belén",
    goliath: "§cCampeón de Gat"
  };
  showTitle(player, titleColors[charId] + titleNames[charId], titleSubs[charId]);

  // ── Quest tracking ──
  onTransform(player, charId);
}

// ── REVERTIR ───────────────────────────────────────────
function revert(player) {
  const state = transforms.get(player.name);
  if (!state) return;

  try { state.entity?.remove(); } catch {}

  const allEffects = [
    "invisibility","strength","haste","speed","resistance",
    "jump_boost","regeneration","night_vision","luck",
    "slowness","health_boost","weakness"
  ];
  for (const e of allEffects) {
    try { player.removeEffect(e); } catch {}
  }

  transforms.delete(player.name);
  player.sendMessage("§7Has vuelto a ser tú mismo.");
  try {
    const pos = player.location;
    playSound(player.dimension, pos, "mob.armor_stand.break", `"${player.name}"`, 0.6, 0.8);
  } catch {}
}

// ── TICK LOOP: SINCRONIZAR ENTIDAD CON JUGADOR ─────────
system.runInterval(() => {
  for (const [pName, state] of transforms.entries()) {

    // Buscar el jugador
    const player = world.getAllPlayers().find(p => p.name === pName);
    if (!player) {
      try { state.entity?.remove(); } catch {}
      transforms.delete(pName);
      continue;
    }

    // Verificar entidad válida
    let valid = false;
    try { valid = state.entity?.isValid() ?? false; } catch {}
    if (!valid) {
      try { player.removeEffect("invisibility"); } catch {}
      transforms.delete(pName);
      player.sendMessage("§7Transformación interrumpida.");
      continue;
    }

    const pLoc = player.location;

    // ── TELEPORT DE LA ENTIDAD AL JUGADOR ──
    try {
      state.entity.teleport(
        { x: pLoc.x, y: pLoc.y, z: pLoc.z },
        { dimension: player.dimension,
          facingLocation: {
            x: pLoc.x + player.getViewDirection().x,
            y: pLoc.y + player.getViewDirection().y,
            z: pLoc.z + player.getViewDirection().z
          }
        }
      );
    } catch {}

    // ── SINCRONIZAR ESTADO DE ANIMACIÓN ──
    // Skip if in attack animation window
    try {
      if (!state.attackUntil || state.tickCount >= state.attackUntil) {
        let animState = 0;
        if (player.isSneaking) {
          animState = 2;
        } else {
          const vel = player.getVelocity();
          const horizSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
          if (horizSpeed > 0.01) animState = 1;
        }
        state.entity.setProperty("miaddon:anim_state", animState);
      }
    } catch {}

    state.tickCount++;

    // ── RENOVAR TODOS LOS EFECTOS CADA 100 TICKS ──
    if (state.tickCount % 100 === 0) {
      const c = CHARS[state.charId];
      try {
        const inv = player.getEffect("invisibility");
        if (!inv || inv.duration < 400) {
          player.addEffect("invisibility", 9999999,
            { amplifier: 0, showParticles: false });
        }
      } catch {}
      for (const [eff, amp, dur] of c.effects) {
        try {
          const cur = player.getEffect(eff);
          if (!cur || cur.duration < 400) {
            player.addEffect(eff, dur * 20,
              { amplifier: amp, showParticles: false });
          }
        } catch {}
      }
    }

    // ── GOLIÁT: grito de intimidación cada 600 ticks ──
    if (state.charId === "goliath" && state.tickCount % 600 === 300) {
      try {
        const pos = player.location;
        const dim = player.dimension;
        world.sendMessage("§c[GOLIÁT]: §o\"¿Por qué habéis salido a presentar batalla?\"");
        world.sendMessage("§c§o\"¡Escoged un hombre que venga contra mí!\" — I Samuel 17:8");
        playSound(dim, pos, "mob.ravager.roar", "@a[r=64]", 1.5, 0.6);

        // Spawn 2-3 Philistine allies on every other taunt
        if (state.tickCount % 1200 === 300) {
          const count = 2 + Math.floor(Math.random() * 2);
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const r = 5 + Math.random() * 5;
            system.runTimeout(() => {
              try {
                dim.spawnEntity("miaddon:philistine", {
                  x: pos.x + Math.cos(angle) * r,
                  y: pos.y + 1,
                  z: pos.z + Math.sin(angle) * r
                });
              } catch {}
            }, i * 10);
          }
          world.sendMessage("§c§l¡Los filisteos acuden al llamado de su campeón!");
        }
      } catch {}
    }
  }
}, 1);

// ── ATAQUE: interceptar entityHurt ─────────────────────
world.afterEvents.entityHurt.subscribe((ev) => {
  const source = ev.damageSource;
  if (source.cause !== "entityAttack") return;

  const attacker = source.damagingEntity;
  if (!attacker || attacker.typeId !== "minecraft:player") return;

  const playerName = attacker.name;
  const state = transforms.get(playerName);
  if (!state) return;

  const target = ev.hurtEntity;
  if (!target) return;
  // No procesar la propia entidad avatar
  try {
    if (target === state.entity) return;
  } catch {}

  const c = CHARS[state.charId];
  const player = attacker;

  // ── TRIGGER ATTACK ANIMATION ──
  try {
    state.entity.setProperty("miaddon:anim_state", 3);
    state.attackUntil = state.tickCount + 10; // 0.5s attack window
  } catch {}

  // Efecto de ataque (debuff al objetivo)
  try {
    target.addEffect(c.attackEffect[0], c.attackEffect[2] * 20,
      { amplifier: c.attackEffect[1], showParticles: true });
  } catch {}

  // Sonido de impacto por personaje
  try {
    const pos = player.location;
    const dim = player.dimension;
    const hitSounds = {
      samson:  ["mob.irongolem.attack", 1.0, 0.8],
      dalila:  ["mob.fox.bite", 0.8, 1.3],
      david:   ["mob.player.attack.strong", 0.9, 1.2],
      goliath: ["mob.irongolem.attack", 1.5, 0.5]
    };
    const [snd, vol, pit] = hitSounds[state.charId] || ["mob.player.attack.strong", 0.8, 1];
    playSound(dim, pos, snd, "@a[r=16]", vol, pit);
  } catch {}

  // Mensajes de ataque temáticos (con cooldown)
  if (!state.lastAttackMsg || state.tickCount - state.lastAttackMsg > 40) {
    const msgs = {
      samson:  "§e¡La fuerza del Señor!",
      dalila:  null,
      david:   "§b¡En el nombre del Señor de los ejércitos!",
      goliath: "§c¡MUERE, ISRAELITA!"
    };
    const msg = msgs[state.charId];
    if (msg) {
      player.sendMessage(msg);
      state.lastAttackMsg = state.tickCount;
    }
  }

  // ── MECÁNICA ESPECIAL: David vs Goliát ──
  if (state.charId === "david" && target.typeId === "minecraft:player") {
    const targetState = transforms.get(target.name);
    if (targetState?.charId === "goliath") {
      try {
        target.applyDamage(50, { cause: "override" });
        target.addEffect("levitation", 40, { amplifier: 2 });
        player.sendMessage("§b§l\"La piedra hirió al filisteo en la frente\"");
        player.sendMessage("§b§o\"...y cayó sobre su rostro en tierra\" — I Samuel 17:49");
        world.sendMessage("§b§l✦ ¡DAVID HA DERRIBADO A GOLIÁT! ✦");
        const pos = target.location;
        const dim = player.dimension;
        playSound(dim, pos, "conduit.activate", "@a[r=64]", 2, 1);
        spawnParticle(dim, { x: pos.x, y: pos.y + 1, z: pos.z }, "miaddon:divine_transform");
        showTitle(player, "§b§l¡VICTORIA!", "§e\"Jehová da la batalla\" — I Samuel 17:47");
        onDavidKillsGoliath(player);
      } catch {}
    }
  }

  // ── MECÁNICA ESPECIAL: Dalila vs Sansón — CORTAR PELO ──
  if (state.charId === "dalila" && target.typeId === "minecraft:player") {
    const targetState = transforms.get(target.name);
    if (targetState?.charId === "samson" && !targetState.hairCut) {
      try {
        // Cortar pelo en la entidad avatar
        targetState.entity.setProperty("miaddon:hair_state", 1);
        targetState.hairCut = true;
        targetState.hairCutTick = state.tickCount;

        // Debuffs al jugador Sansón
        target.removeEffect("strength");
        target.removeEffect("resistance");
        target.removeEffect("haste");
        target.removeEffect("speed");
        target.removeEffect("jump_boost");
        target.removeEffect("regeneration");
        target.addEffect("weakness", 1200, { amplifier: 4, showParticles: true });
        target.addEffect("slowness", 1200, { amplifier: 2, showParticles: true });
        target.addEffect("mining_fatigue", 1200, { amplifier: 2, showParticles: true });
        target.addEffect("blindness", 100, { amplifier: 0, showParticles: true });

        // Mensajes narrativos
        world.sendMessage("§4§l☠ DALILA HA TRAICIONADO A SANSÓN ☠");
        world.sendMessage('§c§o"Y ella hizo que le raparan los siete cabellos de su cabeza..."');
        world.sendMessage("§4§o— Jueces 16:19");
        target.sendMessage("§4§l¡Tu fuerza se ha ido! Los filisteos vienen por ti...");
        player.sendMessage("§d✦ Los 1,100 siclos de plata son tuyos.");

        // Sonido + partículas de corte
        const tPos = target.location;
        const tDim = target.dimension;
        playSound(tDim, tPos, "mob.sheep.shear", "@a[r=32]", 1, 1);
        playSound(tDim, tPos, "random.glass", "@a[r=32]", 0.8, 0.8);
        spawnParticle(tDim, { x: tPos.x, y: tPos.y + 1.8, z: tPos.z }, "miaddon:hair_cut_sparks");
        showTitle(target, "§4§l¡TRAICIÓN!", "§c\"Tu fuerza se ha ido...\"");

        // Quest tracking
        onSamsonHairCut(target);
      } catch {}
    }
  }
});

// ══════════════════════════════════════════
// SANSÓN: REGENERACIÓN DEL PELO (60s)
// "...y el cabello de su cabeza comenzó a crecer
//  después que fue rapado" — Jueces 16:22
// ══════════════════════════════════════════
system.runInterval(() => {
  for (const [pName, state] of transforms.entries()) {
    if (state.charId !== "samson" || !state.hairCut) continue;

    const player = world.getAllPlayers().find(p => p.name === pName);
    if (!player) continue;

    const elapsed = state.tickCount - (state.hairCutTick || 0);

    // Mensajes narrativos progresivos
    if (elapsed === 400) { // ~20s
      player.sendMessage("§7§o...sientes un leve cosquilleo en tu cabeza...");
    }
    if (elapsed === 800) { // ~40s
      player.sendMessage("§e§o...tu cabello comienza a brotar de nuevo...");
    }

    // A los 60s: pelo vuelve a crecer
    if (elapsed >= 1200) {
      try {
        state.entity.setProperty("miaddon:hair_state", 2); // triggers regrow animation
        state.hairCut = false;
        state.hairRegrowing = true;

        // Restaurar poder
        const c = CHARS.samson;
        for (const [eff, amp, dur] of c.effects) {
          try { player.addEffect(eff, dur * 20, { amplifier: amp, showParticles: false }); } catch {}
        }
        // Quitar debuffs
        try { player.removeEffect("weakness"); } catch {}
        try { player.removeEffect("slowness"); } catch {}
        try { player.removeEffect("mining_fatigue"); } catch {}

        world.sendMessage('§a§l✦ "...y su cabello comenzó a crecer de nuevo" ✦');
        world.sendMessage("§a§o— Jueces 16:22");
        player.sendMessage("§6§l¡EL ESPÍRITU DEL SEÑOR VIENE SOBRE TI DE NUEVO!");
        player.sendMessage("§e§oBusca el Templo de Dagón... es hora de la venganza.");

        // Sonido + partículas + título
        const rDim = player.dimension;
        const rPos = player.location;
        playSound(rDim, rPos, "random.levelup", `"${player.name}"`, 1, 1.5);
        playSound(rDim, rPos, "conduit.activate", "@a[r=32]", 0.5, 1.2);
        spawnParticle(rDim, { x: rPos.x, y: rPos.y + 1, z: rPos.z }, "miaddon:samson_power");
        showTitle(player, "§6§l¡TU FUERZA REGRESA!", "§eJueces 16:22");

        // Quest tracking
        onSamsonHairRegrown(player);
      } catch {}
    }
  }
}, 20);

// Reset hair_state to 0 after regrow animation finishes (~2s)
system.runInterval(() => {
  for (const [pName, state] of transforms.entries()) {
    if (state.charId !== "samson" || !state.hairRegrowing) continue;
    // Wait ~2.5s for regrow animation
    state.hairRegrowTicks = (state.hairRegrowTicks || 0) + 1;
    if (state.hairRegrowTicks >= 50) { // 50 * 1 tick = 2.5s at runInterval(1)
      try { state.entity.setProperty("miaddon:hair_state", 0); } catch {}
      state.hairRegrowing = false;
      state.hairRegrowTicks = 0;
    }
  }
}, 1);

// ══════════════════════════════════════════
// SANSÓN: DESTRUCCIÓN DEL TEMPLO DE DAGÓN
// "Déjame que toque las columnas sobre las que
//  descansa este edificio..." — Jueces 16:26
//
// Triggers when Samson (with hair) uses attack
// animation near stone_bricks columns (the temple
// pillars at relative position).
// Uses /scriptevent miaddon:samson_temple
// ══════════════════════════════════════════
const templeDestroyedAt = new Set(); // "x,y,z" keys to avoid double-destroy

system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id !== "miaddon:samson_temple") return;
  const player = ev.sourceEntity;
  if (!player || player.typeId !== "minecraft:player") return;

  const state = transforms.get(player.name);
  if (!state || state.charId !== "samson") {
    player.sendMessage("§c¡Debes ser Sansón para destruir el templo!");
    return;
  }
  if (state.hairCut) {
    player.sendMessage("§c§oSin tu cabello, no tienes la fuerza...");
    player.sendMessage("§7Espera a que tu pelo crezca de nuevo.");
    return;
  }

  // Find nearby stone_bricks pillars (5-block radius)
  const pos = player.location;
  const dim = player.dimension;
  const cx = Math.floor(pos.x), cy = Math.floor(pos.y), cz = Math.floor(pos.z);
  const key = `${cx},${cy},${cz}`;
  if (templeDestroyedAt.has(key)) {
    player.sendMessage("§7Ya destruiste este templo.");
    return;
  }

  // Check if there are pillar-like stone_bricks columns nearby
  let pillarCount = 0;
  const pillarPositions = [];
  for (let dx = -6; dx <= 6; dx++) {
    for (let dz = -6; dz <= 6; dz++) {
      let columnHeight = 0;
      for (let dy = 0; dy <= 18; dy++) {
        try {
          const block = dim.getBlock({ x: cx + dx, y: cy + dy, z: cz + dz });
          if (block?.typeId === "minecraft:stone_bricks") {
            columnHeight++;
          }
        } catch {}
      }
      if (columnHeight >= 8) { // at least 8 blocks tall = a pillar
        pillarCount++;
        pillarPositions.push({ x: cx + dx, z: cz + dz });
      }
    }
  }

  if (pillarCount < 2) {
    player.sendMessage("§c¡No hay columnas de un templo cerca!");
    player.sendMessage("§7Construye el Templo de Dagón con la varita de construcción.");
    return;
  }

  // ═══ DESTROY THE TEMPLE ═══
  templeDestroyedAt.add(key);

  // Narrative sequence
  world.sendMessage("§4§l══════════════════════════════════");
  world.sendMessage("§6§lSansón tomó las dos columnas centrales...");
  world.sendMessage('§e§o"Señor, acuérdate de mí... dame fuerzas sólo esta vez"');
  world.sendMessage("§e§o— Jueces 16:28");
  world.sendMessage("§4§l══════════════════════════════════");

  // Prayer sound
  playSound(dim, pos, "block.bell.hit", "@a[r=64]", 1.5, 0.6);

  // Trigger attack animation
  try { state.entity.setProperty("miaddon:anim_state", 3); } catch {}

  // Phase 1: Shake screen (1s delay)
  system.runTimeout(() => {
    try {
      dim.runCommand(`camerashake add @a[r=50] 0.4 1 positional`);
    } catch {}
    world.sendMessage('§c§l"¡MUERA YO CON LOS FILISTEOS!"');
    world.sendMessage("§4§o— Jueces 16:30");
    playSound(dim, pos, "random.explode", "@a[r=80]", 1.5, 0.5);
    showTitle(player, "§4§l¡MUERA YO CON ELLOS!", "§cJueces 16:30");
  }, 20);

  // Phase 2: Destroy pillars + surrounding blocks (2s delay) 
  system.runTimeout(() => {
    const R = 22; // destruction radius
    let destroyed = 0;
    const batchSize = 120;
    const blocksToDestroy = [];

    // Collect all destroyable blocks in radius
    for (let dx = -R; dx <= R; dx++) {
      for (let dz = -R; dz <= R; dz++) {
        for (let dy = 20; dy >= -2; dy--) {
          try {
            const block = dim.getBlock({ x: cx + dx, y: cy + dy, z: cz + dz });
            if (block && block.typeId !== "minecraft:air" && block.typeId !== "minecraft:bedrock") {
              blocksToDestroy.push({ x: cx + dx, y: cy + dy, z: cz + dz });
            }
          } catch {}
        }
      }
    }

    // Massive collapse particles
    spawnParticle(dim, { x: cx, y: cy + 5, z: cz }, "miaddon:temple_collapse");

    // Destroy in batches (top-down for realistic collapse)
    let batch = 0;
    function destroyBatch() {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, blocksToDestroy.length);
      for (let i = start; i < end; i++) {
        try {
          const b = blocksToDestroy[i];
          dim.runCommand(`setblock ${b.x} ${b.y} ${b.z} air destroy`);
          destroyed++;
        } catch {}
      }

      // Ongoing destruction sounds
      if (batch % 3 === 0) {
        playSound(dim, { x: cx, y: cy, z: cz }, "dig.stone", "@a[r=64]", 1.0, 0.5 + Math.random() * 0.5);
      }

      batch++;
      if (batch * batchSize < blocksToDestroy.length) {
        system.runTimeout(destroyBatch, 1);
      } else {
        // Destruction complete
        world.sendMessage(`§4§l¡EL TEMPLO DE DAGÓN HA CAÍDO! §r§7(${destroyed} bloques destruidos)`);
        world.sendMessage('§e§o"Y los que mató al morir fueron muchos más que los que mató en vida."');
        world.sendMessage("§e§o— Jueces 16:30");
        playSound(dim, { x: cx, y: cy, z: cz }, "conduit.activate", "@a[r=80]", 2, 0.8);
        onTempleDestroyed(player);
      }
    }
    destroyBatch();

    // Camera shake during collapse
    try { dim.runCommand(`camerashake add @a[r=80] 0.8 3 positional`); } catch {}

    // Vanilla particles
    try {
      dim.runCommand(`particle minecraft:explosion_particle ${cx} ${cy + 5} ${cz}`);
      dim.runCommand(`particle minecraft:huge_explosion_emitter ${cx} ${cy + 3} ${cz}`);
    } catch {}
  }, 40);
});

// ── LIMPIEZA AL SALIR ──────────────────────────────────
world.afterEvents.playerLeave.subscribe((ev) => {
  const state = transforms.get(ev.playerName);
  if (!state) return;
  try { state.entity?.remove(); } catch {}
  transforms.delete(ev.playerName);
});

// ══════════════════════════════════════════
// HONDA DE DAVID: SISTEMA DE PROYECTIL
// "Y metiendo David su mano en la bolsa, tomó
//  de allí una piedra" — I Samuel 17:49
// ══════════════════════════════════════════

function launchSlingStone(player) {
  const viewDir = player.getViewDirection();
  const pos = player.location;
  const dim = player.dimension;

  const spawnPos = {
    x: pos.x + viewDir.x * 1.5,
    y: pos.y + 1.5 + viewDir.y * 1.5,
    z: pos.z + viewDir.z * 1.5
  };

  try {
    const stone = dim.spawnEntity("miaddon:sling_stone", spawnPos);
    const speed = 2.5;
    stone.applyImpulse({
      x: viewDir.x * speed,
      y: viewDir.y * speed + 0.15,
      z: viewDir.z * speed
    });

    activeSlingStones.add({ stone, shooter: player, spawnTick: system.currentTick });

    // Sling whirl animation on entity
    const state = transforms.get(player.name);
    if (state) {
      try {
        state.entity.setProperty("miaddon:anim_state", 3);
        state.attackUntil = state.tickCount + 16;
      } catch {}
    }

    // Sound: sling whirl + release
    playSound(dim, pos, "random.bow", `"${player.name}"`, 1, 1.5);

    // Auto-remove after 5 seconds
    system.runTimeout(() => {
      try { if (stone.isValid()) stone.remove(); } catch {}
    }, 100);
  } catch (e) {
    player.sendMessage("§c" + e.message);
  }
}

// Track sling stones every tick — check for entity hits
system.runInterval(() => {
  for (const data of activeSlingStones) {
    let stone;
    try { stone = data.stone; } catch {}

    if (!stone || !stone.isValid()) {
      activeSlingStones.delete(data);
      continue;
    }

    const stoneLoc = stone.location;
    const dim = stone.dimension;

    // Trail particle
    try {
      dim.runCommand(`particle miaddon:sling_trail ${stoneLoc.x} ${stoneLoc.y} ${stoneLoc.z}`);
    } catch {}

    // Check for nearby entities (hit detection)
    let nearby;
    try {
      nearby = dim.getEntities({ location: stoneLoc, maxDistance: 1.5, excludeTypes: ["miaddon:sling_stone"] });
    } catch { continue; }

    for (const ent of nearby) {
      // Don't hit the shooter or their ghost entity
      if (ent.id === data.shooter?.id) continue;
      const shooterState = transforms.get(data.shooter?.name);
      if (shooterState && ent === shooterState.entity) continue;

      try {
        // Base sling damage
        ent.applyDamage(12, { cause: "projectile", damagingEntity: data.shooter });

        // Bonus vs Goliath players — I Samuel 17:49
        if (ent.typeId === "minecraft:player") {
          const targetState = transforms.get(ent.name);
          if (targetState?.charId === "goliath") {
            ent.applyDamage(50, { cause: "override" });
            ent.addEffect("levitation", 40, { amplifier: 2 });
            data.shooter.sendMessage("§b§l\"La piedra se hundió en la frente del filisteo\"");
            data.shooter.sendMessage("§b§o— I Samuel 17:49");
            world.sendMessage("§b§l✦ ¡DAVID HA DERRIBADO A GOLIÁT CON UNA PIEDRA! ✦");
            showTitle(data.shooter, "§b§l¡VICTORIA!", "§eI Samuel 17:49");
            onDavidKillsGoliath(data.shooter);
          }
        }

        // Bonus vs Philistines
        if (ent.typeId === "miaddon:philistine") {
          ent.applyDamage(8, { cause: "override" }); // extra damage to Philistines
        }

        // Impact effects
        playSound(dim, stoneLoc, "random.anvil_land", "@a[r=32]", 0.5, 1.2);
        spawnParticle(dim, stoneLoc, "minecraft:crit_emitter");

        // Quest tracking
        onSlingHit(data.shooter);

        stone.remove();
        activeSlingStones.delete(data);
        break;
      } catch {}
    }

    // Check if stone stopped (hit a block)
    if (activeSlingStones.has(data)) {
      try {
        const vel = stone.getVelocity();
        const speed = Math.abs(vel.x) + Math.abs(vel.y) + Math.abs(vel.z);
        const age = system.currentTick - data.spawnTick;
        if (speed < 0.03 && age > 5) {
          playSound(dim, stoneLoc, "step.stone", "@a[r=16]", 0.3, 1.5);
          stone.remove();
          activeSlingStones.delete(data);
        }
      } catch {}
    }
  }
}, 1);

// ══════════════════════════════════════════
// AURA DE PODER: Sansón con pelo (cada 40 ticks)
// ══════════════════════════════════════════
system.runInterval(() => {
  for (const [pName, state] of transforms.entries()) {
    if (state.charId !== "samson" || state.hairCut) continue;
    const player = world.getAllPlayers().find(p => p.name === pName);
    if (!player) continue;
    try {
      const pos = player.location;
      player.dimension.runCommand(`particle miaddon:samson_power ${pos.x} ${pos.y + 1} ${pos.z}`);
    } catch {}
  }
}, 40);
