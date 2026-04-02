// arena_builder.js — Constructor de arenas Brawl Stars
// Coloca bloques de arena en el mundo a partir de la definición de estructura
//
import { system } from "@minecraft/server";

const BLOCKS_PER_BATCH = 500;
const BATCH_DELAY = 1;  // ticks entre batches

/**
 * Construye una arena en el mundo.
 * @param {object} opts
 * @param {Dimension} opts.dimension
 * @param {{x:number,y:number,z:number}} opts.origin — esquina base
 * @param {Array} opts.blocks — [[rx, ry, rz, blockType], ...]
 * @param {Function} [opts.onProgress] — (placed, total) => void
 * @param {Function} [opts.onComplete] — () => void
 */
export function buildArena(opts) {
  const { dimension, origin, blocks, onProgress, onComplete } = opts;
  const total = blocks.length;
  let placed = 0;
  let batchIndex = 0;

  function placeBatch() {
    const start = batchIndex * BLOCKS_PER_BATCH;
    const end = Math.min(start + BLOCKS_PER_BATCH, total);

    for (let i = start; i < end; i++) {
      const [rx, ry, rz, blockType] = blocks[i];
      try {
        const block = dimension.getBlock({
          x: origin.x + rx,
          y: origin.y + ry,
          z: origin.z + rz,
        });
        if (block) block.setType(blockType);
      } catch {}
      placed++;
    }

    if (onProgress) onProgress(placed, total);
    batchIndex++;

    if (placed < total) {
      system.runTimeout(placeBatch, BATCH_DELAY);
    } else {
      if (onComplete) onComplete();
    }
  }

  placeBatch();
}

/**
 * Limpia una arena (reemplaza todo con aire).
 */
export function clearArena(dimension, origin, size) {
  const { w, h, l } = size;
  const blocks = [];
  for (let y = 0; y < h; y++) {
    for (let z = 0; z < l; z++) {
      for (let x = 0; x < w; x++) {
        blocks.push([x, y, z, "minecraft:air"]);
      }
    }
  }
  buildArena({ dimension, origin, blocks });
}
