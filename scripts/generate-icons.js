import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to calculate CRC32 for PNG chunks
function crc32(buf) {
  let c = 0xffffffff;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let curr = n;
    for (let k = 0; k < 8; k++) {
      curr = (curr & 1) ? (0xedb88320 ^ (curr >>> 1)) : (curr >>> 1);
    }
    table[n] = curr;
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const chunkCrc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(chunkCrc, 8 + len);
  return buf;
}

function createPNG(width, height, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT - Draw an elegant emerald & gold heritage background with safe zone
  const rawRows = [];
  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.38 : width * 0.44;

  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offset = 1 + x * 4;

      // Outer ring / background
      if (dist <= radius) {
        // Deep emerald center with gold ring edge
        if (dist > radius - 12 && dist <= radius) {
          // Gold ring
          row[offset] = 234;   // R
          row[offset + 1] = 179; // G
          row[offset + 2] = 8;   // B
          row[offset + 3] = 255; // A
        } else if (dist > radius - 16 && dist <= radius - 12) {
          // Inner ring accent
          row[offset] = 254;
          row[offset + 1] = 240;
          row[offset + 2] = 138;
          row[offset + 3] = 255;
        } else {
          // Emerald gradient fill
          const factor = 1 - (dist / radius);
          row[offset] = Math.round(6 + factor * 20);   // R
          row[offset + 1] = Math.round(78 + factor * 70);  // G
          row[offset + 2] = Math.round(59 + factor * 40);  // B
          row[offset + 3] = 255; // A
        }
      } else if (isMaskable) {
        // Maskable padding fill (Dark Emerald)
        row[offset] = 2;
        row[offset + 1] = 44;
        row[offset + 2] = 34;
        row[offset + 3] = 255;
      } else {
        // Transparent outside radius
        row[offset] = 0;
        row[offset + 1] = 0;
        row[offset + 2] = 0;
        row[offset + 3] = 0;
      }
    }
    rawRows.push(row);
  }

  const rawData = Buffer.concat(rawRows);
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, false));

console.log('PNG Icons successfully generated in public directory.');
