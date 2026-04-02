// jericho_wall.js — Muralla de Jericó — Josué 2, 6
// "El muro de la ciudad caerá" — Josué 6:5
// Muralla DOBLE (arqueología confirma muralla exterior e interior)
// Josué 2:15 — Rahab vivía en el muro, "su casa estaba en el muro"

function generateJerichoWall() {
  const blocks = [];
  const SAND = "minecraft:sandstone";
  const CUT = "minecraft:cut_sandstone";
  const SMOOTH = "minecraft:smooth_sandstone";
  const STAIR = "minecraft:sandstone_stairs";
  const WALL_BLK = "minecraft:sandstone_wall";
  const RED = "minecraft:red_sandstone";
  const MUD = "minecraft:mud_bricks";           // Ladrillos de barro (parte superior)
  const RED_WOOL = "minecraft:red_wool";         // Cordón rojo de Rahab (Jos 2:18)

  const OUTER_R = 20;           // Radio muralla exterior
  const INNER_R = 16;           // Radio muralla interior
  const OUTER_H = 7;            // Altura muralla exterior (de piedra + ladrillo)
  const INNER_H = 9;            // Muralla interior más alta
  const TOWER_HEIGHT = 13;
  const THICKNESS = 2;

  // ── Muralla EXTERIOR (más baja, de arenisca) — la primera en caer ──
  for (let angle = 0; angle < 360; angle += 1) {
    const rad = (angle * Math.PI) / 180;
    for (let t = 0; t < THICKNESS; t++) {
      const r = OUTER_R - t;
      const x = Math.round(Math.cos(rad) * r);
      const z = Math.round(Math.sin(rad) * r);
      for (let y = 0; y < OUTER_H; y++) {
        // Base de piedra, parte superior de ladrillos de barro
        const mat = y < 3 ? SMOOTH : y < OUTER_H - 1 ? MUD : CUT;
        blocks.push([x, y, z, mat]);
      }
      if (angle % 4 < 2) blocks.push([x, OUTER_H, z, WALL_BLK]);
    }
  }

  // ── Muralla INTERIOR (más alta, más fuerte) ──
  for (let angle = 0; angle < 360; angle += 1) {
    const rad = (angle * Math.PI) / 180;
    for (let t = 0; t < THICKNESS; t++) {
      const r = INNER_R - t;
      const x = Math.round(Math.cos(rad) * r);
      const z = Math.round(Math.sin(rad) * r);
      for (let y = 0; y < INNER_H; y++) {
        const mat = y === 0 ? SMOOTH : y < 4 ? SAND : y < INNER_H - 1 ? MUD : CUT;
        blocks.push([x, y, z, mat]);
      }
      if (angle % 4 < 2) blocks.push([x, INNER_H, z, WALL_BLK]);
    }
  }

  // ── Casa de Rahab (entre las dos murallas, lado norte) — Josué 2:15 ──
  // "Su casa estaba en el muro de la ciudad, y ella habitaba en el muro"
  const rahabX = 0;
  const rahabZ = -(OUTER_R + INNER_R) / 2; // entre ambas murallas, lado norte
  const rz = Math.round(rahabZ);
  // Paredes de la casa
  for (let y = 1; y <= 4; y++) {
    for (let rx = -2; rx <= 2; rx++) {
      blocks.push([rahabX + rx, y, rz - 1, MUD]);
      blocks.push([rahabX + rx, y, rz + 1, MUD]);
    }
    blocks.push([rahabX - 2, y, rz, MUD]);
    blocks.push([rahabX + 2, y, rz, MUD]);
  }
  // Techo plano
  for (let rx = -2; rx <= 2; rx++)
    for (let rdz = -1; rdz <= 1; rdz++)
      blocks.push([rahabX + rx, 5, rz + rdz, MUD]);
  // Puerta
  blocks.push([rahabX, 1, rz + 1, "minecraft:air"]);
  blocks.push([rahabX, 2, rz + 1, "minecraft:air"]);
  // Ventana con CORDÓN ROJO — Josué 2:18,21
  blocks.push([rahabX, 3, rz - 1, "minecraft:air"]);
  blocks.push([rahabX, 4, rz - 1, RED_WOOL]); // cordón escarlata
  blocks.push([rahabX, 2, rz - 1, RED_WOOL]); // cuerda para descolgarse (Jos 2:15)
  blocks.push([rahabX, 1, rz - 2, RED_WOOL]);
  // Lino en el techo (Jos 2:6 — "ella los había hecho subir al terrado y los había escondido entre manojos de lino")
  blocks.push([rahabX - 1, 6, rz, "minecraft:hay_block"]);
  blocks.push([rahabX + 1, 6, rz, "minecraft:hay_block"]);

  // ── 4 torres en puntos cardinales ──
  const towerOffsets = [
    { x: OUTER_R, z: 0 },
    { x: -OUTER_R, z: 0 },
    { x: 0, z: OUTER_R },
    { x: 0, z: -OUTER_R },
  ];
  for (const to of towerOffsets) {
    for (let tx = -2; tx <= 2; tx++) {
      for (let tz = -2; tz <= 2; tz++) {
        for (let y = 0; y < TOWER_HEIGHT; y++) {
          if (Math.abs(tx) === 2 || Math.abs(tz) === 2) {
            const mat = y === 0 ? SMOOTH : y < 4 ? SAND : y < TOWER_HEIGHT - 1 ? RED : CUT;
            blocks.push([to.x + tx, y, to.z + tz, mat]);
          }
        }
        if (Math.abs(tx) === 2 || Math.abs(tz) === 2) {
          if (!(Math.abs(tx) === 2 && Math.abs(tz) === 2))
            blocks.push([to.x + tx, TOWER_HEIGHT, to.z + tz, WALL_BLK]);
        }
        blocks.push([to.x + tx, 0, to.z + tz, SMOOTH]);
      }
    }
    // Antorcha en cada torre
    blocks.push([to.x, TOWER_HEIGHT - 1, to.z, "minecraft:torch"]);
  }

  // ── Puerta principal (sur) con arco ──
  const gateZ = OUTER_R;
  for (let gx = -1; gx <= 1; gx++) {
    for (let gy = 1; gy <= 4; gy++) {
      blocks.push([gx, gy, gateZ, "minecraft:air"]);
      blocks.push([gx, gy, gateZ - 1, "minecraft:air"]);
    }
    blocks.push([gx, 5, gateZ, CUT]);
    blocks.push([gx, 5, gateZ - 1, CUT]);
  }
  // También abrir la muralla interior
  const innerGateZ = INNER_R;
  for (let gx = -1; gx <= 1; gx++) {
    for (let gy = 1; gy <= 4; gy++) {
      blocks.push([gx, gy, innerGateZ, "minecraft:air"]);
      blocks.push([gx, gy, innerGateZ - 1, "minecraft:air"]);
    }
    blocks.push([gx, 5, innerGateZ, CUT]);
    blocks.push([gx, 5, innerGateZ - 1, CUT]);
  }

  // Camino empedrado entre las puertas
  for (let gz = INNER_R; gz <= OUTER_R; gz++)
    for (let gx = -1; gx <= 1; gx++)
      blocks.push([gx, 0, gz, SMOOTH]);

  // Camino exterior
  for (let gx = -3; gx <= 3; gx++)
    for (let gz = gateZ + 1; gz <= gateZ + 3; gz++)
      blocks.push([gx, 0, gz, "minecraft:sand"]);

  return blocks;
}

export const jerichoWall = {
  id: "jericho_wall",
  name: "Muralla de Jericó",
  category: "monumentos",
  description: "La muralla doble con la casa de Rahab — Josué 2, 6",
  blocks: generateJerichoWall(),
};
