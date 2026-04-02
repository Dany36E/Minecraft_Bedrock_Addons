// generate_brawl_textures.js — Generate Power Box and Power Cube textures
// Run with: node tools/generate_brawl_textures.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ═══════════════════════════════════════════
// Minimal PNG encoder
// ═══════════════════════════════════════════
function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const combined = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(combined));
    return Buffer.concat([lenBuf, combined, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw pixel data with filter bytes
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * (1 + width * 4) + 1 + x * 4;
      raw[di]     = pixels[si];
      raw[di + 1] = pixels[si + 1];
      raw[di + 2] = pixels[si + 2];
      raw[di + 3] = pixels[si + 3];
    }
  }

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function setPixel(pixels, w, x, y, r, g, b, a = 255) {
  const i = (y * w + x) * 4;
  pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
}

function fillRect(pixels, w, x1, y1, x2, y2, r, g, b, a = 255) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      setPixel(pixels, w, x, y, r, g, b, a);
    }
  }
}

// ═══════════════════════════════════════════
// POWER BOX TEXTURE (64x64)
// ═══════════════════════════════════════════
// UV layout for 14x14x14 cube:
//   Row 0 (y=0..13):  [right 14x14 at (0,0)] [front 14x14 at (14,0)]  -- wait
//   Actually MC entity UV: for uv:[U,V], cube size [W,H,D]:
//     top:    (U+D, V)        size W x D
//     bottom: (U+D+W, V)      size W x D
//     right:  (U, V+D)        size D x H
//     front:  (U+D, V+D)      size W x H
//     left:   (U+D+W, V+D)    size D x H
//     back:   (U+D+W+D, V+D)  size W x H
//
// For W=14,H=14,D=14, U=0,V=0:
//     top:    (14, 0) 14x14
//     bottom: (28, 0) 14x14
//     right:  (0, 14) 14x14
//     front:  (14, 14) 14x14
//     left:   (28, 14) 14x14
//     back:   (42, 14) 14x14

function generatePowerBoxTexture() {
  const W = 64, H = 64;
  const pixels = new Uint8Array(W * H * 4);

  // Fill transparent
  pixels.fill(0);

  // Colors
  const WOOD    = [193, 122, 62];    // main wood brown
  const WOOD_DK = [155, 95, 45];     // darker wood grain
  const WOOD_LT = [210, 145, 80];    // lighter wood highlight
  const METAL   = [140, 140, 150];   // metal straps
  const METAL_DK= [100, 100, 110];   // darker metal
  const BOLT_Y  = [255, 215, 0];     // yellow lightning bolt
  const BOLT_DK = [200, 165, 0];     // shadow bolt

  // Helper: draw a face region filled with wood
  function drawWoodFace(fx, fy, fw, fh) {
    // Base wood
    fillRect(pixels, W, fx, fy, fx + fw - 1, fy + fh - 1, ...WOOD);

    // Wood grain (horizontal lines)
    for (let row = 0; row < fh; row++) {
      if (row % 3 === 0) {
        fillRect(pixels, W, fx, fy + row, fx + fw - 1, fy + row, ...WOOD_DK);
      }
      if (row % 5 === 2) {
        fillRect(pixels, W, fx + 2, fy + row, fx + fw - 3, fy + row, ...WOOD_LT);
      }
    }

    // Border (darker edge)
    for (let x = fx; x < fx + fw; x++) {
      setPixel(pixels, W, x, fy, ...WOOD_DK);
      setPixel(pixels, W, x, fy + fh - 1, ...WOOD_DK);
    }
    for (let y = fy; y < fy + fh; y++) {
      setPixel(pixels, W, fx, y, ...WOOD_DK);
      setPixel(pixels, W, fx + fw - 1, y, ...WOOD_DK);
    }
  }

  // Helper: draw metal strap (horizontal or vertical)
  function drawStrap(fx, fy, fw, fh, horizontal) {
    if (horizontal) {
      const sy = fy + Math.floor(fh / 2) - 1;
      fillRect(pixels, W, fx, sy, fx + fw - 1, sy + 1, ...METAL);
      fillRect(pixels, W, fx, sy, fx + fw - 1, sy, ...METAL_DK);
    } else {
      const sx = fx + Math.floor(fw / 2) - 1;
      fillRect(pixels, W, sx, fy, sx + 1, fy + fh - 1, ...METAL);
      fillRect(pixels, W, sx, fy, sx, fy + fh - 1, ...METAL_DK);
    }
  }

  // Helper: draw lightning bolt on a face
  function drawBolt(fx, fy, fw, fh) {
    const cx = fx + Math.floor(fw / 2);
    const cy = fy + Math.floor(fh / 2);

    // Lightning bolt shape (centered)
    const boltPixels = [
      [0, -4], [1, -4],
      [-1, -3], [0, -3],
      [-1, -2], [0, -2],
      [-2, -1], [-1, -1], [0, -1], [1, -1],
      [0, 0], [1, 0],
      [0, 1], [1, 1],
      [-1, 2], [0, 2],
      [-2, 3], [-1, 3],
    ];

    for (const [dx, dy] of boltPixels) {
      const px = cx + dx, py = cy + dy;
      if (px >= fx && px < fx + fw && py >= fy && py < fy + fh) {
        setPixel(pixels, W, px, py, ...BOLT_Y);
      }
    }
    // Shadow
    for (const [dx, dy] of boltPixels) {
      const px = cx + dx + 1, py = cy + dy + 1;
      if (px >= fx && px < fx + fw && py >= fy && py < fy + fh) {
        const i = (py * W + px) * 4;
        if (pixels[i] !== BOLT_Y[0]) { // don't overwrite bolt
          setPixel(pixels, W, px, py, ...BOLT_DK);
        }
      }
    }
  }

  // Draw all 6 faces
  // Top face (14,0) 14x14
  drawWoodFace(14, 0, 14, 14);
  drawStrap(14, 0, 14, 14, true);
  drawStrap(14, 0, 14, 14, false);
  // Metal clasp on top
  fillRect(pixels, W, 19, 5, 22, 8, ...METAL);
  fillRect(pixels, W, 20, 6, 21, 7, ...METAL_DK);

  // Bottom face (28,0) 14x14
  drawWoodFace(28, 0, 14, 14);
  drawStrap(28, 0, 14, 14, true);

  // Right face (0,14) 14x14
  drawWoodFace(0, 14, 14, 14);
  drawStrap(0, 14, 14, 14, true);

  // Front face (14,14) 14x14 — main face with bolt
  drawWoodFace(14, 14, 14, 14);
  drawStrap(14, 14, 14, 14, true);
  drawBolt(14, 14, 14, 14);

  // Left face (28,14) 14x14
  drawWoodFace(28, 14, 14, 14);
  drawStrap(28, 14, 14, 14, true);

  // Back face (42,14) 14x14 — also with bolt
  drawWoodFace(42, 14, 14, 14);
  drawStrap(42, 14, 14, 14, true);
  drawBolt(42, 14, 14, 14);

  return createPNG(W, H, pixels);
}

// ═══════════════════════════════════════════
// POWER CUBE TEXTURE (32x32)
// ═══════════════════════════════════════════
// UV layout for 8x8x8 cube:
//     top:    (8, 0) 8x8
//     bottom: (16, 0) 8x8
//     right:  (0, 8) 8x8
//     front:  (8, 8) 8x8
//     left:   (16, 8) 8x8
//     back:   (24, 8) 8x8

function generatePowerCubeTexture() {
  const W = 32, H = 32;
  const pixels = new Uint8Array(W * H * 4);
  pixels.fill(0);

  const GREEN    = [76, 175, 80];    // main green
  const GREEN_LT = [102, 200, 106];  // highlight
  const GREEN_DK = [56, 142, 60];    // darker green
  const GREEN_DD = [40, 110, 44];    // edge dark
  const BOLT_Y   = [255, 215, 0];    // yellow bolt
  const BOLT_DK  = [218, 180, 0];    // bolt shadow

  function drawCubeFace(fx, fy, fs) {
    // Fill with green
    fillRect(pixels, W, fx, fy, fx + fs - 1, fy + fs - 1, ...GREEN);

    // Highlight top-left
    fillRect(pixels, W, fx, fy, fx + fs - 1, fy, ...GREEN_LT);
    fillRect(pixels, W, fx, fy, fx, fy + fs - 1, ...GREEN_LT);
    fillRect(pixels, W, fx + 1, fy + 1, fx + fs - 2, fy + 1, ...GREEN_LT);

    // Shadow bottom-right
    fillRect(pixels, W, fx, fy + fs - 1, fx + fs - 1, fy + fs - 1, ...GREEN_DD);
    fillRect(pixels, W, fx + fs - 1, fy, fx + fs - 1, fy + fs - 1, ...GREEN_DD);
    fillRect(pixels, W, fx + 1, fy + fs - 2, fx + fs - 2, fy + fs - 2, ...GREEN_DK);

    // Lightning bolt (small, 4px tall)
    const cx = fx + Math.floor(fs / 2);
    const cy = fy + Math.floor(fs / 2);
    const bolt = [
      [0, -2], [1, -2],
      [-1, -1], [0, -1],
      [0, 0], [1, 0],
      [-1, 1], [0, 1],
    ];
    // Shadow first
    for (const [dx, dy] of bolt) {
      const px = cx + dx + 1, py = cy + dy;
      if (px >= fx && px < fx + fs && py >= fy && py < fy + fs) {
        setPixel(pixels, W, px, py, ...BOLT_DK);
      }
    }
    // Bolt on top
    for (const [dx, dy] of bolt) {
      const px = cx + dx, py = cy + dy;
      if (px >= fx && px < fx + fs && py >= fy && py < fy + fs) {
        setPixel(pixels, W, px, py, ...BOLT_Y);
      }
    }
  }

  // Draw all faces
  drawCubeFace(8, 0, 8);   // top
  drawCubeFace(16, 0, 8);  // bottom
  drawCubeFace(0, 8, 8);   // right
  drawCubeFace(8, 8, 8);   // front
  drawCubeFace(16, 8, 8);  // left
  drawCubeFace(24, 8, 8);  // back

  return createPNG(W, H, pixels);
}

// ═══════════════════════════════════════════
// MAIN — Write textures
// ═══════════════════════════════════════════
const baseDir = path.join(__dirname, '..', 'resource_pack', 'textures', 'entity');

const boxPng = generatePowerBoxTexture();
fs.writeFileSync(path.join(baseDir, 'power_box.png'), boxPng);
console.log('✓ power_box.png generada (64x64)');

const cubePng = generatePowerCubeTexture();
fs.writeFileSync(path.join(baseDir, 'power_cube.png'), cubePng);
console.log('✓ power_cube.png generada (32x32)');

console.log('\nTexturas de Brawl Stars generadas exitosamente.');
