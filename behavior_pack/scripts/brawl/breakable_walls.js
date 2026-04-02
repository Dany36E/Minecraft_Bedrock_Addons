// breakable_walls.js — Paredes rompibles (hay_block)
// Los bloques de heno se destruyen al ser golpeados por jugadores
// Solo funciona durante una partida activa
//
import { world, system } from "@minecraft/server";
import { getState, GameState } from "./game_manager.js";

const BREAKABLE_BLOCK = "minecraft:hay_block";

world.afterEvents.entityHitBlock.subscribe((ev) => {
  // Solo funcionar durante una partida activa
  const st = getState();
  if (st !== GameState.PLAYING && st !== GameState.COUNTDOWN) return;

  const attacker = ev.damagingEntity;
  if (!attacker || attacker.typeId !== "minecraft:player") return;

  const block = ev.hitBlock;
  if (!block || block.typeId !== BREAKABLE_BLOCK) return;

  const loc = block.location;
  const dim = block.dimension;

  try {
    // Destruir el bloque
    block.setType("minecraft:air");

    // Efecto visual
    dim.runCommand(
      `particle minecraft:crop_growth_emitter ${loc.x + 0.5} ${loc.y + 0.5} ${loc.z + 0.5}`
    );
    dim.runCommand(
      `playsound dig.grass @a[r=16] ${loc.x} ${loc.y} ${loc.z} 0.8 0.8`
    );
  } catch {}
});
