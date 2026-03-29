/**
 * preview-model.js — Genera una imagen PNG con vista frontal y lateral del modelo 3D
 * Dibuja los cubos como rectángulos proyectados para verificar proporciones y posiciones
 * 
 * Uso: node tools/preview-model.js
 * Salida: tools/preview_samson_hair.png (se puede abrir en cualquier visor de imágenes)
 */
const fs = require("fs");
const path = require("path");

// Leer geometría
const geoPath = path.join(__dirname, "..", "resource_pack", "models", "entity", "samson_hair.geo.json");
const geoData = JSON.parse(fs.readFileSync(geoPath, "utf8"));
const geo = geoData["minecraft:geometry"][0];
const bones = geo.bones;

// Imagen: 400x500 — izquierda vista frontal, derecha vista lateral
const W = 400;
const H = 500;
const pixels = Buffer.alloc(W * H * 4, 0); // RGBA

// Colores para cada cubo
const CUBE_COLORS = [
  [139, 90, 43, 200],   // Marrón — Hair cap
  [180, 120, 60, 200],  // Marrón claro — Back upper
  [200, 150, 80, 200],  // Dorado — Back lower
  [100, 70, 30, 200],   // Marrón oscuro — Left side
  [100, 70, 30, 200],   // Marrón oscuro — Right side
];

const PLAYER_COLOR = [80, 80, 80, 100]; // Gris transparente para silueta del jugador
const GRID_COLOR = [40, 40, 40, 255];
const AXIS_COLOR = [60, 60, 60, 255];
const TEXT_COLOR = [255, 255, 255, 255];
const BG_COLOR = [20, 20, 30, 255];

// Rellenar fondo
for (let i = 0; i < W * H; i++) {
  pixels[i * 4 + 0] = BG_COLOR[0];
  pixels[i * 4 + 1] = BG_COLOR[1];
  pixels[i * 4 + 2] = BG_COLOR[2];
  pixels[i * 4 + 3] = BG_COLOR[3];
}

function setPixel(x, y, r, g, b, a) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const idx = (y * W + x) * 4;
  // Alpha blending
  const srcA = a / 255;
  const dstA = pixels[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return;
  pixels[idx + 0] = Math.round((r * srcA + pixels[idx + 0] * dstA * (1 - srcA)) / outA);
  pixels[idx + 1] = Math.round((g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA);
  pixels[idx + 2] = Math.round((b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA);
  pixels[idx + 3] = Math.round(outA * 255);
}

function fillRect(x1, y1, x2, y2, color) {
  for (let y = Math.max(0, Math.floor(y1)); y <= Math.min(H - 1, Math.floor(y2)); y++) {
    for (let x = Math.max(0, Math.floor(x1)); x <= Math.min(W - 1, Math.floor(x2)); x++) {
      setPixel(x, y, color[0], color[1], color[2], color[3]);
    }
  }
}

function drawRect(x1, y1, x2, y2, color) {
  for (let x = Math.floor(x1); x <= Math.floor(x2); x++) {
    setPixel(x, Math.floor(y1), color[0], color[1], color[2], color[3]);
    setPixel(x, Math.floor(y2), color[0], color[1], color[2], color[3]);
  }
  for (let y = Math.floor(y1); y <= Math.floor(y2); y++) {
    setPixel(Math.floor(x1), y, color[0], color[1], color[2], color[3]);
    setPixel(Math.floor(x2), y, color[0], color[1], color[2], color[3]);
  }
}

function drawDashedLine(x1, y1, x2, y2, color, dashLen) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(len);
  for (let i = 0; i < steps; i++) {
    if (Math.floor(i / dashLen) % 2 === 0) {
      const t = i / steps;
      setPixel(x1 + dx * t, y1 + dy * t, color[0], color[1], color[2], color[3]);
    }
  }
}

// ══════════════════════════════════════════
// Coordinate system:
// Minecraft: X=right, Y=up, Z=forward
// Front view (looking at -Z): screen X = mc X, screen Y = mc Y (inverted)
// Side view (looking at -X): screen X = mc Z, screen Y = mc Y (inverted)
// ══════════════════════════════════════════

const SCALE = 10; // pixels per Minecraft unit
const FRONT_CX = 100; // center X of front view
const SIDE_CX = 300;  // center X of side view
const BASE_Y = 450;   // Y=0 in Minecraft → pixel Y=BASE_Y

function mcToFront(x, y) {
  return [FRONT_CX + x * SCALE, BASE_Y - y * SCALE];
}
function mcToSide(z, y) {
  return [SIDE_CX + z * SCALE, BASE_Y - y * SCALE];
}

// Draw grid lines  
for (let mcY = 0; mcY <= 32; mcY += 4) {
  const py = BASE_Y - mcY * SCALE;
  drawDashedLine(0, py, W, py, GRID_COLOR, 4);
}

// Draw player silhouette (approximate)
// Head: [-4, 24, -4] to [4, 32, 4] (8x8x8)
// Body: [-4, 12, -2] to [4, 24, 2] (8x12x4)
// Left arm: [-8, 12, -2] to [-4, 24, 2]
// Right arm: [4, 12, -2] to [8, 24, 2]
// Left leg: [-4, 0, -2] to [0, 12, 2]
// Right leg: [0, 0, -2] to [4, 12, 2]

const playerParts = [
  { name: "head",     front: [-4, 24, 8, 8],   side: [-4, 24, 8, 8] },
  { name: "body",     front: [-4, 12, 8, 12],  side: [-2, 12, 4, 12] },
  { name: "arm_l",    front: [-8, 12, 4, 12],  side: [-2, 12, 4, 12] },
  { name: "arm_r",    front: [4, 12, 4, 12],   side: [-2, 12, 4, 12] },
  { name: "leg_l",    front: [-4, 0, 4, 12],   side: [-2, 0, 4, 12] },
  { name: "leg_r",    front: [0, 0, 4, 12],    side: [-2, 0, 4, 12] },
];

for (const part of playerParts) {
  // Front view
  const [fx, fy] = mcToFront(part.front[0], part.front[1] + part.front[3]);
  const [fx2, fy2] = mcToFront(part.front[0] + part.front[2], part.front[1]);
  fillRect(fx, fy, fx2, fy2, PLAYER_COLOR);
  drawRect(fx, fy, fx2, fy2, [100, 100, 100, 150]);

  // Side view
  const [sx, sy] = mcToSide(part.side[0], part.side[1] + part.side[3]);
  const [sx2, sy2] = mcToSide(part.side[0] + part.side[2], part.side[1]);
  fillRect(sx, sy, sx2, sy2, PLAYER_COLOR);
  drawRect(sx, sy, sx2, sy2, [100, 100, 100, 150]);
}

// Draw hair cubes
const cubeNames = ["Cap (gorro)", "Back upper", "Back lower", "Side left", "Side right"];

for (const bone of bones) {
  if (!bone.cubes) continue;
  
  for (let i = 0; i < bone.cubes.length; i++) {
    const cube = bone.cubes[i];
    const [ox, oy, oz] = cube.origin;
    const [sw, sh, sd] = cube.size;
    const inflate = cube.inflate || 0;
    const color = CUBE_COLORS[i % CUBE_COLORS.length];
    const outlineColor = [255, 255, 100, 255]; // Yellow outline

    // Front view: X and Y
    const fTL = mcToFront(ox - inflate, oy + sh + inflate);
    const fBR = mcToFront(ox + sw + inflate, oy - inflate);
    fillRect(fTL[0], fTL[1], fBR[0], fBR[1], color);
    drawRect(fTL[0], fTL[1], fBR[0], fBR[1], outlineColor);

    // Side view: Z and Y
    const sTL = mcToSide(oz - inflate, oy + sh + inflate);
    const sBR = mcToSide(oz + sd + inflate, oy - inflate);
    fillRect(sTL[0], sTL[1], sBR[0], sBR[1], color);
    drawRect(sTL[0], sTL[1], sBR[0], sBR[1], outlineColor);
  }
}

// ══════════════════════════════════════════
// Labels usando un mini font de 3x5 pixels
// ══════════════════════════════════════════
const FONT = {
  'F': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
  'R': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
  'O': [[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
  'N': [[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
  'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
  'S': [[0,1,1],[1,0,0],[0,1,0],[0,0,1],[1,1,0]],
  'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
  'D': [[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
  'E': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
  ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
  'V': [[1,0,1],[1,0,1],[1,0,1],[0,1,0],[0,1,0]],
  'A': [[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
  'L': [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
};

function drawText(text, startX, startY, scale, color) {
  for (let ci = 0; ci < text.length; ci++) {
    const ch = text[ci].toUpperCase();
    const glyph = FONT[ch];
    if (!glyph) continue;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (glyph[row][col]) {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              setPixel(
                startX + ci * (3 * scale + scale) + col * scale + sx,
                startY + row * scale + sy,
                color[0], color[1], color[2], color[3]
              );
            }
          }
        }
      }
    }
  }
}

drawText("FRONT", 55, 12, 3, TEXT_COLOR);
drawText("SIDE", 265, 12, 3, TEXT_COLOR);

// Divider line
for (let y = 0; y < H; y++) {
  setPixel(200, y, 60, 60, 60, 255);
}

// Legend
const legendY = 460;
const legendNames = ["CAP", "REAR", "TAIL", "SIDE L", "SIDE R"];
for (let i = 0; i < CUBE_COLORS.length; i++) {
  const lx = 10 + i * 80;
  fillRect(lx, legendY, lx + 8, legendY + 8, CUBE_COLORS[i]);
  drawRect(lx, legendY, lx + 8, legendY + 8, [255, 255, 100, 255]);
}

// ══════════════════════════════════════════
// Write PNG manually (no dependencies)
// ══════════════════════════════════════════
const zlib = require("zlib");

function createPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c >>> 0;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([len, typeAndData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — raw pixel data with filter byte 0 per row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx + 0] = rgbaBuffer[srcIdx + 0];
      rawData[dstIdx + 1] = rgbaBuffer[srcIdx + 1];
      rawData[dstIdx + 2] = rgbaBuffer[srcIdx + 2];
      rawData[dstIdx + 3] = rgbaBuffer[srcIdx + 3];
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outPath = path.join(__dirname, "preview_samson_hair.png");
fs.writeFileSync(outPath, createPNG(W, H, pixels));
console.log(`✅ Preview generado: ${outPath}`);
console.log(`   Tamaño: ${W}x${H} px`);
console.log(`   Vista FRONTAL (izq) — cómo se ve de frente`);
console.log(`   Vista LATERAL (der) — cómo se ve de lado`);
console.log(`   Silueta gris = jugador de Minecraft`);
console.log(`   Cubos amarillos = pelo de Sansón`);
console.log(`\n   Abre el archivo para verificar las proporciones.`);
