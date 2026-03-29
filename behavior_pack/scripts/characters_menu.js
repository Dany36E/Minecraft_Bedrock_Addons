import { world, system, EquipmentSlot, ItemStack } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

// ── Estado global ──────────────────────────────────────
const transforms = new Map();
// playerName → { entity, charId, tickCount, lastY }

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
      ["resistance",1,9999],["jump_boost",1,9999],["regeneration",0,9999]
    ],
    msg: "§6§l✦ EL ESPÍRITU DEL SEÑOR VINO SOBRE SANSÓN ✦\n§e§o\"Comenzó a manifestarse en él\" — Jueces 13:25",
    attackDmg: 12,
    attackEffect: ["slowness",1,60],
    jumpBoost: 3
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
      ["speed",1,9999],["night_vision",0,9999],["luck",1,9999]
    ],
    msg: "§d§l✦ Entras al valle de Sorec como Dalila.\n§7§o\"...se llamaba Dalila\" — Jueces 16:4",
    attackDmg: 4,
    attackEffect: ["weakness",2,100],
    jumpBoost: 2
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
    attackDmg: 6,
    attackEffect: ["slowness",0,40],
    jumpBoost: 2
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
    attackDmg: 20,
    attackEffect: ["slowness",2,80],
    jumpBoost: 0
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
  const form = new ModalFormData()
    .title(c.title)
    .textField(c.body, "", "")
    .toggle("§aConvertirme en este personaje", true);

  form.show(player).then((res) => {
    if (res.canceled || !res.formValues?.[1]) return;
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
    lastY: pos.y
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

    state.tickCount++;

    // ── RENOVAR INVISIBILIDAD CADA 100 TICKS ──
    if (state.tickCount % 100 === 0) {
      try {
        const inv = player.getEffect("invisibility");
        if (!inv || inv.duration < 400) {
          player.addEffect("invisibility", 9999999,
            { amplifier: 0, showParticles: false });
        }
      } catch {}
    }

    // ── DETECTAR SALTO: boost adicional ──
    const curY = pLoc.y;
    const rising = curY - (state.lastY ?? curY) > 0.3;
    state.lastY = curY;

    const c = CHARS[state.charId];
    if (rising && c.jumpBoost > 0 && state.tickCount % 20 > 10) {
      try {
        player.addEffect("jump_boost", 8,
          { amplifier: c.jumpBoost, showParticles: false });
      } catch {}
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

// ── ATAQUE: interceptar entityHitEntity ────────────────
world.afterEvents.entityHitEntity.subscribe((ev) => {
  const attacker = ev.damagingEntity;
  if (!attacker || attacker.typeId !== "minecraft:player") return;

  const playerName = attacker.name;
  const state = transforms.get(playerName);
  if (!state) return;

  const target = ev.hitEntity;
  if (!target) return;
  // No atacar la propia entidad avatar
  try {
    if (target === state.entity) return;
  } catch {}

  const c = CHARS[state.charId];
  const player = attacker;

  // Daño adicional
  try {
    target.applyDamage(c.attackDmg,
      { damagingEntity: player,
        cause: "entityAttack" });
  } catch {}

  // Efecto de ataque
  try {
    target.addEffect(c.attackEffect[0], c.attackEffect[2] * 20,
      { amplifier: c.attackEffect[1], showParticles: true });
  } catch {}

  // Mensajes de ataque temáticos
  const msgs = {
    samson:  "§e¡La fuerza del Señor!",
    dalila:  null,
    david:   "§b¡En el nombre del Señor de los ejércitos!",
    goliath: "§c¡MUERE, ISRAELITA!"
  };
  const msg = msgs[state.charId];
  if (msg) player.sendMessage(msg);

  // ── MECÁNICA ESPECIAL: David vs Goliát ──
  if (state.charId === "david") {
    try {
      const nearby = target.dimension.getEntities({
        type: "miaddon:goliath_entity",
        maxDistance: 3,
        location: target.location
      });
      if (nearby.length > 0) {
        target.applyDamage(50, { damagingEntity: player });
        target.addEffect("levitation", 40, { amplifier: 2 });
        player.sendMessage("§b§l\"La piedra hirió al filisteo en la frente\"");
        player.sendMessage("§b§o\"...y cayó sobre su rostro en tierra\" — I Samuel 17:49");
      }
    } catch {}
  }

  // ── MECÁNICA ESPECIAL: Dalila vs Sansón ──
  if (state.charId === "dalila") {
    try {
      if (target.typeId === "minecraft:player") {
        const eq = target.getComponent("equippable");
        const head = eq?.getEquipment(EquipmentSlot.Head);
        if (head?.typeId === "miaddon:samson_hair") {
          eq.setEquipment(EquipmentSlot.Head, undefined);
          target.removeEffect("strength");
          target.addEffect("weakness", 1200, { amplifier: 4 });
          target.addEffect("slowness", 1200, { amplifier: 2 });
          target.sendMessage("§4§l☠ DALILA HA CORTADO TU CABELLO ☠");
          target.sendMessage("§4§o\"...y su fuerza se apartó de él\" — Jueces 16:19");
          player.sendMessage("§d✦ Los 1,100 siclos de plata son tuyos.");
        }
      }
    } catch {}
  }
});

// ── LIMPIEZA AL SALIR ──────────────────────────────────
world.afterEvents.playerLeave.subscribe((ev) => {
  const state = transforms.get(ev.playerName);
  if (!state) return;
  try { state.entity?.remove(); } catch {}
  transforms.delete(ev.playerName);
});
