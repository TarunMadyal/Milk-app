// Generates PNG app icons with no external dependencies (pure Node + zlib).
// Draws a simple white milk bottle on a brand-blue background.
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "icons");

const BRAND = [21, 101, 192]; // #1565C0
const CAP = [66, 165, 245]; // #42A5F5
const WHITE = [255, 255, 255];

function crcTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}
const TABLE = crcTable();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function render(size) {
  const buf = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = 255;
  };
  const rect = (x0, y0, w, h, color, radius = 0) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (radius > 0) {
          const dx = Math.min(x - x0, x0 + w - 1 - x);
          const dy = Math.min(y - y0, y0 + h - 1 - y);
          if (dx < radius && dy < radius) {
            const ddx = radius - dx;
            const ddy = radius - dy;
            if (ddx * ddx + ddy * ddy > radius * radius) continue;
          }
        }
        set(x, y, color);
      }
    }
  };

  // Background
  rect(0, 0, size, size, BRAND);

  const f = (v) => Math.round(v * size);
  // Bottle cap
  rect(f(0.42), f(0.16), f(0.16), f(0.06), CAP, f(0.02));
  // Bottle neck
  rect(f(0.43), f(0.21), f(0.14), f(0.08), WHITE);
  // Bottle body
  rect(f(0.3), f(0.28), f(0.4), f(0.5), WHITE, f(0.07));
  // Blue "milk line" band for a little detail
  rect(f(0.3), f(0.46), f(0.4), f(0.05), BRAND);

  return encodePNG(size, size, buf);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "icon-192.png"), render(192));
fs.writeFileSync(path.join(OUT, "icon-512.png"), render(512));
fs.writeFileSync(path.join(OUT, "icon-maskable-512.png"), render(512));
console.log("Icons written to", OUT);
