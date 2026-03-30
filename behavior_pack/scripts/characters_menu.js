import { world, system } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

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
    title: "§6§lSansón — Nazareo de Israel",
    body:
      "§eJueces 13-16\n" +
      "§7Juez de Israel. Su fuerza venía del voto sagrado del nazareo.\n\n" +
      "§o\"El Espíritu del Señor vino poderosamente sobre él\"\n" +
      "§o— Jueces 14:6\n\n" +
      "§fEscala: §anormal §f| Fuerza: §asobrehumana",
    effects: [
      ["strength",4,9999],["haste",2,9999],["speed",1,9999],
      ["resistance",1,9999],["jump_boost",2,9999],["regeneration",0,9999]
    ],
    msg: "§6§l✦ EL ESPÍRITU DEL SEÑOR VINO SOBRE SANSÓN ✦\n§e§o\"Comenzó a manifestarse en él\" — Jueces 13:25",
    attackEffect: ["slowness",1,60]
  },
  dalila: {
    entityType: "miaddon:dalila_entity",
    title: "§d§lDalila — Mujer del Valle de Sorec",
    body:
      "§eJueces 16:4-20\n" +
      "§7Filistea. Recibió 1,100 siclos de plata por traicionar a Sansón.\n\n" +
      "§o\"¿Cómo dices que me amas?\" — Jueces 16:15\n\n" +
      "§fEscala: §aligera (0.9×) §f| Velocidad: §aalta",
    effects: [
      ["speed",1,9999],["night_vision",0,9999],["luck",1,9999],
      ["jump_boost",1,9999]
    ],
    msg: "§d§l✦ Entras al valle de Sorec como Dalila.\n§7§o\"...se llamaba Dalila\" — Jueces 16:4",
    attackEffect: ["weakness",2,100]
  },
  david: {
    entityType: "miaddon:david_entity",
    title: "§b§lDavid — Pastor de Belén",
    body:
      "§eI Samuel 16-17\n" +
      "§7Menor de 8 hijos. Rubio, hermosos ojos. Mató a Goliat con una piedra.\n\n" +
      "§o\"Rubio, de hermosos ojos, y de buen parecer\" — I Samuel 16:12\n\n" +
      "§fEscala: §ejoven (0.82×) §f| Velocidad: §aágil",
    effects: [
      ["speed",2,9999],["luck",1,9999],["resistance",0,9999],["jump_boost",1,9999]
    ],
    msg: "§b§l✦ El Señor está contigo, David.\n§7§o\"No temas al filisteo\" — I Samuel 17:32",
    attackEffect: ["slowness",0,40]
  },
  goliath: {
    entityType: "miaddon:goliath_entity",
    title: "§c§lGoliát — Campeón de Gat",
    body:
      "§eI Samuel 17:4-7\n" +
      "§7Altura: 6 codos y 1 palmo = 2.9 m. Armadura: 57 kg de bronce.\n\n" +
      "§o\"Un hombre de guerra desde su juventud\" — I Samuel 17:33\n\n" +
      "§fEscala: §cGIGANTE (1.85×) §f| Fuerza: §cdestructiva",
    effects: [
      ["strength",4,9999],["resistance",3,9999],
      ["slowness",1,9999],["health_boost",3,9999]
    ],
    msg: "§c§l✦ ¡ERES GOLIÁT, CAMPEÓN DE LOS FILISTEOS!\n§c§o\"¡Venid a mí!\" — I Samuel 17:44",
    attackEffect: ["slowness",2,80]
  }
};

// ── LISTENER: Libro de Personajes ──────────────────────
world.beforeEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack?.typeId !== "miaddon:characters_book") return;
  ev.cancel = true;
  const player = ev.source;
  if (transforms.has(player.name)) {
    system.run(() => revert(player));
  } else {
    system.run(() => openMenu(player));
  }
});

// ── MENÚ PRINCIPAL ─────────────────────────────────────
function openMenu(player) {
  const form = new ActionFormData()
    .title("§6§l✦ Personajes Bíblicos ✦")
    .body("§fElige un personaje. Usa el libro de nuevo para revertir.\n§7Tu movimiento y ataque funcionan normalmente.")
    .button("§l§eSansón§r\n§7Jueces 13-16 · Fuerza sobrehumana")
    .button("§l§dDalila§r\n§7Jueces 16 · Astucia y traición")
    .button("§l§bDavid§r\n§7I Samuel 16-17 · Pastor valiente")
    .button("§l§cGoliát§r\n§7I Samuel 17 · Gigante de Gat")
    .button("§7Cancelar");

  form.show(player).then((res) => {
    if (res.canceled || res.selection === 4) return;
    const keys = ["samson","dalila","david","goliath"];
    system.run(() => showConfirm(player, keys[res.selection]));
  });
}

// ── CONFIRMACIÓN CON LORE ──────────────────────────────
function showConfirm(player, charId) {
  const c = CHARS[charId];
  const form = new MessageFormData()
    .title(c.title)
    .body(c.body)
    .button1("§7Cancelar")
    .button2("§aConvertirme en este personaje");

  form.show(player).then((res) => {
    if (res.canceled || res.selection === 0) return;
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
    try {
      let animState = 0;
      if (player.isSneaking) {
        animState = 2;
      } else {
        const vel = player.getVelocity();
        const horizSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        if (horizSpeed > 0.01) animState = 1;
      }
      state.entity.setProperty("miaddon:anim_state", animState);
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
        world.sendMessage("§c[GOLIÁT]: §o\"¿Por qué habéis salido a presentar batalla?\"");
        world.sendMessage("§c§o\"¡Escoged un hombre que venga contra mí!\" — I Samuel 17:8");
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

  // Efecto de ataque (debuff al objetivo)
  try {
    target.addEffect(c.attackEffect[0], c.attackEffect[2] * 20,
      { amplifier: c.attackEffect[1], showParticles: true });
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
      } catch {}
    }
  }

  // ── MECÁNICA ESPECIAL: Dalila vs Sansón ──
  if (state.charId === "dalila" && target.typeId === "minecraft:player") {
    const targetState = transforms.get(target.name);
    if (targetState?.charId === "samson") {
      try {
        target.removeEffect("strength");
        target.addEffect("weakness", 1200, { amplifier: 4 });
        target.addEffect("slowness", 1200, { amplifier: 2 });
        target.sendMessage("§4§l☠ DALILA HA CORTADO TU CABELLO ☠");
        target.sendMessage("§4§o\"...y su fuerza se apartó de él\" — Jueces 16:19");
        player.sendMessage("§d✦ Los 1,100 siclos de plata son tuyos.");
      } catch {}
    }
  }
});

// ── LIMPIEZA AL SALIR ──────────────────────────────────
world.afterEvents.playerLeave.subscribe((ev) => {
  const state = transforms.get(ev.playerName);
  if (!state) return;
  try { state.entity?.remove(); } catch {}
  transforms.delete(ev.playerName);
});
