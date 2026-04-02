// ark.js — Arca de Noé — Génesis 6:14-16
// "Hazte un arca de madera de gofer; harás aposentos en el arca,
//  y la calafatearás con brea por dentro y por fuera."
// 300 codos × 50 codos × 30 codos, 3 pisos, 1 ventana arriba, 1 puerta lateral

function generateArk() {
  const blocks = [];
  const OAK_LOG = "minecraft:oak_log";
  const DOAK_LOG = "minecraft:dark_oak_log";
  const DOAK = "minecraft:dark_oak_planks";     // Madera de gofer (ciprés)
  const SPRUCE = "minecraft:dark_oak_planks";    // Exterior calafateado con brea = oscuro (Gn 6:14)
  const GLASS = "minecraft:glass_pane";
  const SPRUCE_STAIRS = "minecraft:dark_oak_stairs"; // Techo oscuro (brea)
  const FENCE = "minecraft:dark_oak_fence";
  const OAK_FENCE = "minecraft:oak_fence";       // Compartimentos interiores

  const L = 60; // largo (x)
  const maxHW = 9; // mitad del ancho máximo
  const H = 14; // altura total

  // Forma del casco: mitad-ancho en función de x
  function hullHW(x) {
    if (x < 8) return Math.max(1, Math.round(maxHW * (x / 8)));
    if (x > L - 8) return Math.max(2, Math.round(maxHW * ((L - x) / 8)));
    return maxHW;
  }

  // ── Quilla (y=0, línea central) ──
  for (let x = 0; x < L; x++) {
    blocks.push([x, 0, 0, DOAK_LOG]);
  }

  // ── Casco inferior: forma de V aplanada (y=1-2) ──
  for (let x = 0; x < L; x++) {
    const hw = hullHW(x);
    // V shape: y=1 tiene ancho reducido, y=2 ancho completo
    const hw1 = Math.max(1, hw - 2);
    for (let z = -hw1; z <= hw1; z++) {
      blocks.push([x, 1, z, OAK_LOG]);
    }
    // Piso del primer nivel (y=2)
    for (let z = -hw; z <= hw; z++) {
      blocks.push([x, 2, z, DOAK]);
    }
  }

  // ── Paredes laterales nivel 1 (y=3 a y=5) ──
  for (let x = 0; x < L; x++) {
    const hw = hullHW(x);
    for (let y = 3; y <= 5; y++) {
      blocks.push([x, y, -hw, SPRUCE]);
      blocks.push([x, y, hw, SPRUCE]);
    }
    // Proa y popa cerradas
    if (x === 0 || x === L - 1) {
      for (let z = -hw; z <= hw; z++) {
        for (let y = 3; y <= 5; y++) {
          blocks.push([x, y, z, SPRUCE]);
        }
      }
    }
  }

  // ── Piso nivel 2 (y=6) ──
  for (let x = 1; x < L - 1; x++) {
    const hw = hullHW(x);
    for (let z = -(hw - 1); z <= hw - 1; z++) {
      blocks.push([x, 6, z, DOAK]);
    }
  }

  // ── Paredes laterales nivel 2 (y=7 a y=9) ──
  for (let x = 1; x < L - 1; x++) {
    const hw = hullHW(x);
    for (let y = 7; y <= 9; y++) {
      blocks.push([x, y, -hw, SPRUCE]);
      blocks.push([x, y, hw, SPRUCE]);
    }
  }

  // ── Piso nivel 3 / cubierta (y=10) ──
  for (let x = 1; x < L - 1; x++) {
    const hw = hullHW(x);
    for (let z = -(hw - 1); z <= hw - 1; z++) {
      blocks.push([x, 10, z, DOAK]);
    }
  }

  // ── Borda de cubierta (y=11) ──
  for (let x = 1; x < L - 1; x++) {
    const hw = hullHW(x);
    blocks.push([x, 11, -hw, FENCE]);
    blocks.push([x, 11, hw, FENCE]);
  }

  // ── Vigas estructurales (dark oak log cada 10 bloques) ──
  for (let bx = 0; bx < L; bx += 10) {
    const hw = hullHW(bx);
    for (let z = -hw; z <= hw; z++) {
      blocks.push([bx, 3, z, DOAK_LOG]);
      blocks.push([bx, 6, z, DOAK_LOG]);
    }
    for (let y = 2; y <= 10; y++) {
      blocks.push([bx, y, -hw, DOAK_LOG]);
      blocks.push([bx, y, hw, DOAK_LOG]);
    }
  }

  // ── "Una ventana harás al arca, y la acabarás a un codo de elevación" — Gn 6:16 ──
  // UNA ventana continua a 1 codo del techo (y=10, justo bajo la cubierta)
  for (let x = 5; x < L - 5; x++) {
    const hw = hullHW(x);
    blocks.push([x, 10, -hw, GLASS]);  // franja de ventana norte
    blocks.push([x, 10, hw, GLASS]);   // franja de ventana sur
  }

  // ── Compartimentos interiores / aposentos — Gn 6:14 "harás aposentos" ──
  // Divisiones de madera cada 10 bloques en nivel 1 (establos para animales)
  for (let divX = 10; divX < L - 10; divX += 10) {
    const hw = hullHW(divX);
    for (let z = -(hw - 2); z <= hw - 2; z++) {
      blocks.push([divX, 3, z, OAK_FENCE]);
      blocks.push([divX, 4, z, OAK_FENCE]);
    }
    // Paso central
    blocks.push([divX, 3, 0, "minecraft:air"]);
    blocks.push([divX, 4, 0, "minecraft:air"]);
  }
  // Divisiones laterales en nivel 1 (corrales a cada lado)
  for (let x = 5; x < L - 5; x += 5) {
    const hw = hullHW(x);
    if (hw >= 4) {
      blocks.push([x, 3, -2, OAK_FENCE]);
      blocks.push([x, 3, 2, OAK_FENCE]);
    }
  }

  // ── Techo A-frame sobre cubierta (y=11-14) ──
  for (let x = 3; x < L - 3; x++) {
    const hw = Math.min(hullHW(x), 6);
    for (let i = 0; i < hw; i++) {
      const ry = 11 + Math.floor(i * 3 / hw);
      if (i < hw - 1) {
        blocks.push([x, ry, -(hw - i), SPRUCE_STAIRS, { "weirdo_direction": 2 }]);
        blocks.push([x, ry, (hw - i), SPRUCE_STAIRS, { "weirdo_direction": 3 }]);
      }
    }
    // Cresta
    blocks.push([x, H, 0, DOAK]);
  }

  // ── Puerta lateral (x = L/3, z = sur, y=3-4) ──
  const doorX = 20;
  const doorHW = hullHW(doorX);
  blocks.push([doorX, 3, doorHW, "minecraft:air"]);
  blocks.push([doorX, 4, doorHW, "minecraft:air"]);
  blocks.push([doorX + 1, 3, doorHW, "minecraft:air"]);
  blocks.push([doorX + 1, 4, doorHW, "minecraft:air"]);
  // Marco de la puerta — Gn 6:16 "pondrás la puerta... al lado"
  blocks.push([doorX - 1, 3, doorHW, DOAK_LOG]);
  blocks.push([doorX - 1, 4, doorHW, DOAK_LOG]);
  blocks.push([doorX - 1, 5, doorHW, DOAK_LOG]);
  blocks.push([doorX + 2, 3, doorHW, DOAK_LOG]);
  blocks.push([doorX + 2, 4, doorHW, DOAK_LOG]);
  blocks.push([doorX + 2, 5, doorHW, DOAK_LOG]);
  blocks.push([doorX, 5, doorHW, DOAK_LOG]);
  blocks.push([doorX + 1, 5, doorHW, DOAK_LOG]);

  // ── Antorchas interiores ──
  for (let tx = 10; tx < L - 10; tx += 15) {
    blocks.push([tx, 5, 0, "minecraft:torch"]);
    blocks.push([tx, 9, 0, "minecraft:torch"]);
  }

  return blocks;
}

export const ark = {
  id: "ark",
  name: "Arca de Noé",
  category: "biblicas",
  description: "El arca que salvó a toda especie viviente — Génesis 6",
  blocks: generateArk()
};
