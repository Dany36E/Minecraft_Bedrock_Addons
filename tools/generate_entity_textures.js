const Jimp = require("jimp");
const path = require("path");
const OUT = path.join(__dirname, "..", "resource_pack", "textures", "entity");

function hex(c) { return Jimp.cssColorToHex(c.length===7 ? c+"FF" : c); }
function fill(img, x1,y1,x2,y2,c) {
  for (let x=x1;x<=x2;x++) for (let y=y1;y<=y2;y++) img.setPixelColor(hex(c),x,y);
}
function px(img,x,y,c){ img.setPixelColor(hex(c),x,y); }

// ── SANSÓN ──────────────────────────────────────────────
async function genSamson() {
  const img = new Jimp(64, 64, hex("#00000000".slice(0,9)));

  // ── CABEZA FRONTAL (cara) x=8..15, y=8..15
  fill(img, 8,8,15,15, "#7A4530");
  fill(img, 8,8,15,9,  "#2C1505");
  fill(img, 8,10,9,15, "#2C1505");
  fill(img, 14,10,15,15,"#2C1505");

  // Ojos 2×2
  fill(img, 9,11,10,12, "#1A0800");
  fill(img, 13,11,14,12,"#1A0800");
  px(img, 10,12, "#4A2C14");
  px(img, 13,12, "#4A2C14");

  // Nariz
  fill(img, 11,13,12,13,"#5A2E1A");
  // Boca
  fill(img, 10,14,13,14,"#4A1A14");

  // ── CABEZA LATERAL izq x=0..7, der x=16..23
  fill(img, 0,8,7,15,  "#7A4530");
  fill(img, 16,8,23,15,"#7A4530");
  fill(img, 0,8,2,15,  "#2C1505");
  fill(img, 21,8,23,15,"#2C1505");

  // ── CABEZA SUPERIOR x=8..15, y=0..7
  fill(img, 8,0,15,7, "#2C1505");

  // ── CABEZA TRASERA x=24..31, y=8..15
  fill(img, 24,8,31,15,"#2C1505");
  fill(img, 25,8,26,15,"#4A2C0A");
  fill(img, 29,8,30,15,"#4A2C0A");

  // ── HAT (trenzas capa exterior) uv[32,0] size[8,8,8]
  fill(img, 32,0,63,15, "#2C1505");
  for (let x=34; x<=62; x+=4) fill(img, x,0,x+1,15,"#4A2C0A");
  fill(img, 32,13,63,15,"#5A3A1A");

  // ── CUERPO uv[16,16] size[8,12,4]
  // Front: x=20..27, y=20..31
  fill(img, 20,20,27,31,"#D4B483");
  fill(img, 20,24,27,25,"#8B6914");
  px(img, 23,24,"#C8A020"); px(img,24,24,"#C8A020");
  fill(img, 20,20,27,21,"#C0A070");
  fill(img, 20,30,27,31,"#B89050");

  // Lados del cuerpo
  fill(img, 16,16,19,31,"#C0A070");
  fill(img, 28,16,31,31,"#C0A070");
  fill(img, 20,16,27,19,"#C0A070");

  // ── BRAZO DERECHO uv[40,16] size[4,12,4]
  // Front: x=44..47, y=20..31
  fill(img, 44,20,47,31,"#7A4530");
  fill(img, 44,20,47,21,"#D4B483");
  fill(img, 44,28,47,29,"#8B6914");
  fill(img, 44,30,47,31,"#7A4530");
  fill(img, 40,16,43,31,"#6B3A2A");
  fill(img, 48,16,51,31,"#6B3A2A");

  // ── BRAZO IZQUIERDO uv[32,48] size[4,12,4]
  fill(img, 36,52,39,63,"#7A4530");
  fill(img, 36,52,39,53,"#D4B483");
  fill(img, 36,60,39,61,"#8B6914");
  fill(img, 32,48,35,63,"#6B3A2A");
  fill(img, 40,48,43,63,"#6B3A2A");

  // ── PIERNA DERECHA uv[0,16] size[4,12,4]
  // Front: x=4..7, y=20..31
  fill(img, 4,20,7,31, "#D4B483");
  fill(img, 4,26,7,29, "#7A4530");
  fill(img, 4,30,7,31, "#8B4513");
  fill(img, 0,16,3,31, "#C0A070");
  fill(img, 8,16,11,31,"#C0A070");

  // ── PIERNA IZQUIERDA uv[16,48] size[4,12,4]
  fill(img, 20,52,23,63,"#D4B483");
  fill(img, 20,58,23,61,"#7A4530");
  fill(img, 20,62,23,63,"#8B4513");
  fill(img, 16,48,19,63,"#C0A070");
  fill(img, 24,48,27,63,"#C0A070");

  // ── PELO LATERAL IZQUIERDO uv[56,0] size[2,16,2]
  fill(img, 56,0,63,19,"#2C1505");
  for (let y=2; y<=17; y+=4) fill(img, 56,y,63,y+1,"#4A2C0A");

  // ── PELO LATERAL DERECHO uv[56,20] size[2,14,2]
  fill(img, 56,20,63,37,"#2C1505");
  for (let y=22; y<=35; y+=4) fill(img, 56,y,63,y+1,"#4A2C0A");

  // ── PELO TRASERO uv[40,32] size[6,12,2]
  fill(img, 40,32,55,47,"#2C1505");
  for (let x=42; x<=55; x+=4) fill(img, x,32,x+1,47,"#4A2C0A");

  await img.writeAsync(path.join(OUT,"samson.png"));
  console.log("✅ samson.png generado");
}

// ── DALILA ──────────────────────────────────────────────
async function genDalila() {
  const img = new Jimp(64, 64, hex("#00000000".slice(0,9)));

  // CARA
  fill(img, 8,8,15,15, "#9B7055");
  fill(img, 8,8,15,9, "#7B3FA0");
  fill(img, 8,10,15,11,"#C8A020");

  // Ojos con kohl
  fill(img, 9,12,10,13, "#1A0A14");
  fill(img, 11,12,12,13,"#1A6B3A");
  fill(img, 13,12,14,13,"#1A0A14");

  // Labios
  fill(img, 10,14,13,15,"#8B2A2A");

  // Lados de cara
  fill(img, 0,8,7,15,  "#9B7055");
  fill(img, 16,8,23,15,"#9B7055");
  fill(img, 0,8,1,15,  "#1A0A14");
  fill(img, 22,8,23,15,"#1A0A14");

  // Superior
  fill(img, 8,0,15,7,"#1A0A14");
  // Trasera
  fill(img, 24,8,31,15,"#1A0A14");

  // HAT uv[32,0] size[8,8,8]
  fill(img, 32,0,63,15,"#7B3FA0");
  fill(img, 32,0,63,1,  "#C8A020");
  fill(img, 32,14,63,15,"#3D1A5C");
  fill(img, 48,8,63,15,"#1A0A14");

  // CUERPO
  fill(img, 20,20,27,31,"#4A1A6B");
  fill(img, 20,20,27,21,"#8B0000");
  fill(img, 20,22,27,23,"#C8A020");
  fill(img, 20,24,27,25,"#C8A020");
  for (let y=26; y<=30; y+=4) fill(img, 20,y,27,y+1,"#3D1A5C");
  fill(img, 20,31,27,31,"#2D1040");

  fill(img, 16,16,19,31,"#3D1A5C");
  fill(img, 28,16,31,31,"#3D1A5C");

  // BRAZOS SLIM
  fill(img, 44,20,46,31,"#9B7055");
  fill(img, 44,20,46,23,"#4A1A6B");
  fill(img, 44,24,46,25,"#C8A020");
  fill(img, 40,16,43,31,"#4A1A6B");

  fill(img, 36,52,38,63,"#9B7055");
  fill(img, 36,52,38,55,"#4A1A6B");
  fill(img, 36,56,38,57,"#C8A020");
  fill(img, 32,48,35,63,"#4A1A6B");

  // PIERNAS
  fill(img, 4,20,7,31, "#4A1A6B");
  fill(img, 4,31,7,31, "#C8A020");
  fill(img, 0,16,3,31, "#3D1A5C");

  fill(img, 20,52,23,63,"#4A1A6B");
  fill(img, 20,63,23,63,"#C8A020");
  fill(img, 16,48,19,63,"#3D1A5C");

  // VEIL bone uv[32,16] size[8,4,8]
  fill(img, 40,16,55,27,"#7B3FA0");
  fill(img, 40,16,55,17,"#C8A020");

  // SKIRT bone uv[40,32] size[8,12,3]
  fill(img, 40,32,61,47,"#3D1A5C");
  for (let y=34; y<=46; y+=4) fill(img, 40,y,61,y+1,"#2D1040");
  fill(img, 40,46,61,47,"#C8A020");

  await img.writeAsync(path.join(OUT,"dalila.png"));
  console.log("✅ dalila.png generado");
}

// ── DAVID ───────────────────────────────────────────────
async function genDavid() {
  const img = new Jimp(64, 64, hex("#00000000".slice(0,9)));

  // CARA
  fill(img, 8,8,15,15,"#D4845A");
  fill(img, 8,8,15,9,"#C85A14");
  fill(img, 8,10,9,15,"#C85A14");
  fill(img, 14,10,15,15,"#C85A14");

  // Ojos
  fill(img, 9,11,10,12, "#5A3A10");
  fill(img, 11,11,12,12,"#E8E0D0");
  fill(img, 11,12,12,12,"#2A6B5A");
  fill(img, 13,11,14,11,"#5A3A10");
  fill(img, 13,11,14,12,"#E8E0D0");
  fill(img, 13,12,14,12,"#2A6B5A");

  // Mejillas
  px(img,8,13,"#E0906A"); px(img,15,13,"#E0906A");

  // Boca
  fill(img, 10,14,13,14,"#C87060");
  fill(img, 11,14,12,14,"#A05040");

  // Lados
  fill(img, 0,8,7,15,  "#D4845A");
  fill(img, 16,8,23,15,"#D4845A");
  fill(img, 0,8,1,15,  "#C85A14");
  fill(img, 22,8,23,15,"#C85A14");

  // Superior
  fill(img, 8,0,15,7,"#C85A14");
  // Trasera
  fill(img, 24,8,31,15,"#A04010");

  // PELO RIZADO (hat) uv[32,0] size[8,8,8]
  fill(img, 32,0,63,15,"#C85A14");
  for (let bx=32; bx<=62; bx+=4)
    for (let by=0; by<=14; by+=4)
      fill(img, bx,by,bx+1,by+1,"#A04010");

  // CUERPO
  fill(img, 20,20,27,31,"#D4A060");
  fill(img, 20,22,21,31,"#8B6030");
  fill(img, 22,25,27,26,"#8B6030");
  fill(img, 20,26,27,27,"#5A3A0A");
  fill(img, 20,31,27,31,"#C09050");

  fill(img, 16,16,19,31,"#C09050");
  fill(img, 28,16,31,31,"#C09050");

  // BRAZOS SLIM
  fill(img, 44,20,46,31,"#D4845A");
  fill(img, 44,20,46,21,"#D4A060");
  fill(img, 44,28,46,29,"#8B6030");
  fill(img, 40,16,43,31,"#C09050");

  fill(img, 36,52,38,63,"#D4845A");
  fill(img, 36,52,38,53,"#D4A060");
  fill(img, 36,60,38,61,"#8B6030");
  fill(img, 32,48,35,63,"#C09050");

  // PIERNAS
  fill(img, 4,20,7,31, "#D4A060");
  fill(img, 4,26,7,29, "#D4845A");
  fill(img, 4,30,7,31, "#8B4513");
  fill(img, 0,16,3,31, "#C09050");

  fill(img, 20,52,23,63,"#D4A060");
  fill(img, 20,58,23,61,"#D4845A");
  fill(img, 20,62,23,63,"#8B4513");
  fill(img, 16,48,19,63,"#C09050");

  // curlyHair bone uv[32,16] size[8,4,8]
  fill(img, 40,16,55,27,"#C85A14");
  for (let bx=40; bx<=54; bx+=4)
    for (let by=16; by<=26; by+=4)
      fill(img, bx,by,bx+1,by+1,"#A04010");

  await img.writeAsync(path.join(OUT,"david.png"));
  console.log("✅ david.png generado");
}

// ── GOLIÁT ──────────────────────────────────────────────
async function genGoliath() {
  const img = new Jimp(128, 64, hex("#00000000".slice(0,9)));

  // ── YELMO uv[0,0] size[10,10,10]
  // front: x=10..19, y=10..19
  fill(img, 0,0,39,19,"#CD8B3A");

  // Cresta dorada
  fill(img, 10,10,19,11,"#C8A020");

  // Ranura de visión
  fill(img, 10,13,19,14,"#0A0A0A");
  fill(img, 11,13,12,14,"#3A1A08");
  fill(img, 17,13,18,14,"#3A1A08");

  // Guarda nasal
  fill(img, 14,15,15,17,"#8B5A14");

  // Barbiquejo
  fill(img, 10,19,19,19,"#6B3A1A");

  // Remaches dorados
  fill(img, 10,11,11,12,"#C8A020");
  fill(img, 18,11,19,12,"#C8A020");
  fill(img, 10,17,11,18,"#C8A020");
  fill(img, 18,17,19,18,"#C8A020");

  // Lados del yelmo
  fill(img, 0,10,9,19, "#CD8B3A");
  fill(img, 20,10,29,19,"#CD8B3A");
  for (let y=10; y<=19; y+=4) {
    fill(img, 0,y,9,y+1,  "#A07030");
    fill(img, 20,y,29,y+1,"#A07030");
  }

  // Superior e inferior
  fill(img, 10,0,19,9,"#CD8B3A");
  fill(img, 10,0,19,1,"#C8A020");
  fill(img, 30,10,39,19,"#8B5A14");

  // ── HAT (cubrecelmo) uv[44,0] size[11,11,11]
  fill(img, 44,0,87,21,"#CD8B3A");
  fill(img, 55,14,65,15,"#0A0A0A");
  fill(img, 44,0,87,1,  "#C8A020");

  // ── CUERPO uv[0,22] size[10,14,5]
  // front: x=5..14, y=27..40
  for (let bx=5; bx<=13; bx+=4)
    for (let by=27; by<=39; by+=4) {
      fill(img, bx,by,bx+1,by+1,"#CD8B3A");
      fill(img, bx+2,by,bx+3,by+1,"#8B5A14");
      fill(img, bx,by+2,bx+1,by+3,"#A07030");
      fill(img, bx+2,by+2,bx+3,by+3,"#CD8B3A");
    }
  fill(img, 5,27,14,28,"#C8A020");
  fill(img, 5,33,14,34,"#6B3A1A");
  fill(img, 9,33,10,34,"#C8A020");
  fill(img, 0,22,4,40, "#A07030");
  fill(img, 15,22,19,40,"#A07030");

  // ── BRAZOS uv[40,22] size[5,14,5]
  // front: x=45..49, y=27..40
  for (let bx=45; bx<=48; bx+=4)
    for (let by=27; by<=39; by+=4) {
      fill(img, bx,by,bx+1,by+1,"#CD8B3A");
      fill(img, bx+2,by,bx+3,by+1,"#8B5A14");
      fill(img, bx,by+2,bx+1,by+3,"#A07030");
      fill(img, bx+2,by+2,bx+3,by+3,"#CD8B3A");
    }
  fill(img, 45,27,49,28,"#C8A020");
  fill(img, 45,38,49,39,"#6B3A1A");
  fill(img, 40,22,44,40,"#A07030");
  fill(img, 50,22,54,40,"#A07030");

  // ── PIERNA DER uv[60,22] size[5,12,5]
  // front: x=65..69, y=27..38
  for (let bx=65; bx<=68; bx+=4)
    for (let by=27; by<=31; by+=4) {
      fill(img, bx,by,bx+1,by+1,"#CD8B3A");
      fill(img, bx+2,by,bx+3,by+1,"#8B5A14");
    }
  fill(img, 65,32,69,33,"#6B3A1A");
  fill(img, 65,34,69,38,"#CD8B3A");
  for (let y=34; y<=38; y+=2) fill(img, 65,y,69,y,"#A07030");
  fill(img, 60,22,64,38,"#A07030");
  fill(img, 70,22,74,38,"#A07030");

  // ── PIERNA IZQ uv[60,42] size[5,12,5]
  // front: x=65..69, y=47..58
  for (let bx=65; bx<=68; bx+=4)
    for (let by=47; by<=51; by+=4) {
      fill(img, bx,by,bx+1,by+1,"#CD8B3A");
      fill(img, bx+2,by,bx+3,by+1,"#8B5A14");
    }
  fill(img, 65,52,69,53,"#6B3A1A");
  fill(img, 65,54,69,58,"#CD8B3A");
  for (let y=54; y<=58; y+=2) fill(img, 65,y,69,y,"#A07030");
  fill(img, 60,42,64,58,"#A07030");
  fill(img, 70,42,74,58,"#A07030");

  // ── CRESTA uv[88,0] size[2,8,1]
  fill(img, 88,0,93,8,"#C8A020");
  fill(img, 88,0,93,1,"#FFD700");

  // ── LANZA uv[94,0] size[1,28,1]
  fill(img, 94,0,97,3, "#CD8B3A");
  fill(img, 94,3,97,5, "#A07030");
  fill(img, 94,6,97,29,"#2C1A0A");

  await img.writeAsync(path.join(OUT,"goliath.png"));
  console.log("✅ goliath.png generado");
}

Promise.all([genSamson(), genDalila(), genDavid(), genGoliath()])
  .then(() => console.log("\n✅ TODAS LAS TEXTURAS GENERADAS — sin moiré"))
  .catch(console.error);
