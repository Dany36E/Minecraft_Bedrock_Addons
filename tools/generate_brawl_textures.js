// generate_brawl_textures.js — Genera texturas para Brawl Ball y Brawl Master
const fs = require("fs");
const path = require("path");
const { deflateSync } = require("zlib");

function crc32(buf) {
  let c = 0xFFFFFFFF;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xEDB88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crcIn = Buffer.concat([typeB, data]);
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc32(crcIn));
  return Buffer.concat([len, typeB, data, crcB]);
}

function writePNG(filepath, w, h, buf) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = [];
  for (let y = 0; y < h; y++) {
    raw.push(0);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      raw.push(buf[i], buf[i + 1], buf[i + 2], buf[i + 3]);
    }
  }
  const compressed = deflateSync(Buffer.from(raw));
  const png = Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, png);
  console.log("Created:", filepath, `(${png.length} bytes)`);
}

// ═══════════════════════════════════════════
// 1. BRAWL BALL ENTITY TEXTURE (32x32)
// ═══════════════════════════════════════════
{
  const W = 32, H = 32;
  const buf = Buffer.alloc(W * H * 4, 0);
  function set(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  }
  function fill(x1, y1, x2, y2, r, g, b) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) set(x, y, r, g, b);
  }

  // White ball base
  fill(0, 0, 31, 31, 240, 240, 240);
  // Dark edges
  fill(0, 0, 31, 1, 200, 200, 200);
  fill(0, 0, 1, 31, 200, 200, 200);
  fill(0, 30, 31, 31, 180, 180, 180);
  fill(30, 0, 31, 31, 180, 180, 180);

  // Soccer pentagon pattern (black patches)
  fill(10, 4, 16, 8, 50, 50, 50);
  fill(2, 12, 6, 18, 50, 50, 50);
  fill(20, 12, 26, 18, 50, 50, 50);
  fill(6, 22, 12, 26, 50, 50, 50);
  fill(18, 22, 24, 26, 50, 50, 50);

  // Subtle highlights
  fill(12, 6, 14, 6, 80, 80, 80);
  fill(4, 14, 4, 16, 80, 80, 80);
  fill(22, 14, 24, 14, 80, 80, 80);

  writePNG(path.join(__dirname, "..", "resource_pack", "textures", "entity", "brawl_ball.png"), W, H, buf);
}

// ═══════════════════════════════════════════
// 2. BRAWL MASTER ITEM TEXTURE (16x16)
// ═══════════════════════════════════════════
{
  const W = 16, H = 16;
  const buf = Buffer.alloc(W * H * 4, 0);
  function set(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  }

  // Star shape — Golden star (Brawl Stars style)
  const starPixels = [
    [7, 0], [8, 0],
    [7, 1], [8, 1],
    [6, 2], [7, 2], [8, 2], [9, 2],
    [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3],
    [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4],
    [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
    [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
    [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7],
    [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8],
    [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9],
    [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10],
    [1, 11], [2, 11], [3, 11], [4, 11], [5, 11], [6, 11], [7, 11], [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11],
    [0, 12], [1, 12], [2, 12], [3, 12], [12, 12], [13, 12], [14, 12], [15, 12],
    [6, 12], [7, 12], [8, 12], [9, 12],
    [6, 13], [7, 13], [8, 13], [9, 13],
    [7, 14], [8, 14],
    [7, 15], [8, 15],
  ];

  for (const [x, y] of starPixels) {
    const brightness = 1.0 - (y / H) * 0.3;
    const r = Math.round(255 * brightness);
    const g = Math.round(200 * brightness);
    const b = Math.round(50 * brightness);
    set(x, y, r, g, b);
  }

  // Bright center highlights
  set(7, 5, 255, 240, 120);
  set(8, 5, 255, 240, 120);
  set(7, 6, 255, 235, 100);
  set(8, 6, 255, 235, 100);

  writePNG(path.join(__dirname, "..", "resource_pack", "textures", "items", "brawl_master.png"), W, H, buf);
}

console.log("All Brawl textures generated.");
