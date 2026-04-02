// generate_power_box_item_texture.js
// Genera el ícono 16x16 del Power Box Spawner
const fs = require("fs");
const path = require("path");

const W = 16, H = 16;
const buf = Buffer.alloc(W * H * 4, 0);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
}

function fillRect(x1, y1, x2, y2, r, g, b, a = 255) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      setPixel(x, y, r, g, b, a);
}

// Caja principal - marrón/dorada como Power Box de Brawl Stars
// Base de la caja (marrón oscuro)
fillRect(3, 4, 12, 13, 139, 90, 43);
// Cara frontal (marrón medio)
fillRect(4, 5, 11, 12, 178, 122, 55);
// Franja central horizontal (dorada)
fillRect(3, 8, 12, 9, 255, 200, 50);
// Franja central vertical (dorada)
fillRect(7, 4, 8, 13, 255, 200, 50);
// Centro - gema/brillo (amarillo brillante)
fillRect(7, 8, 8, 9, 255, 240, 100);
// Borde superior (resalte)
fillRect(3, 4, 12, 4, 200, 140, 60);
// Borde inferior (sombra)
fillRect(3, 13, 12, 13, 100, 60, 25);
// Bordes laterales
for (let y = 4; y <= 13; y++) {
  setPixel(3, y, 110, 70, 30);
  setPixel(12, y, 110, 70, 30);
}
// Esquinas
setPixel(3, 4, 160, 110, 50);
setPixel(12, 4, 160, 110, 50);
// Pequeño brillo arriba-izquierda
setPixel(5, 6, 210, 170, 90);
setPixel(6, 6, 200, 155, 80);

// Signo + verde debajo (indica "spawner/colocar")
fillRect(6, 0, 9, 2, 50, 200, 50);
fillRect(7, 0, 8, 3, 50, 200, 50);
// Contorno del +
setPixel(7, 0, 30, 160, 30);
setPixel(8, 0, 30, 160, 30);

// --- Generar PNG ---
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

const sig = Buffer.from([137,80,78,71,13,10,26,10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

const raw = [];
for (let y = 0; y < H; y++) {
  raw.push(0); // filter none
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    raw.push(buf[i], buf[i+1], buf[i+2], buf[i+3]);
  }
}
const compressed = deflateSync(Buffer.from(raw));

const png = Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
const out = path.join(__dirname, "..", "resource_pack", "textures", "items", "power_box_spawner.png");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log("Created:", out, `(${png.length} bytes)`);
