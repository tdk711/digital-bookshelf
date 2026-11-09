// Generates PNG PWA icons (no canvas dependency): a #366D99 rounded-ish square
// with three white "book" bars, echoing public/favicon.svg.
// Run:  node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = buf => {
  let c = ~0
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (~c) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcInput = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput))
  return Buffer.concat([len, crcInput, crc])
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function drawIcon(size) {
  const s = size / 64 // scale from the 64x64 layout
  const bg = [0x36, 0x6d, 0x99, 0xff]
  const fg = [0xff, 0xff, 0xff, 0xff]
  const buf = Buffer.alloc(size * size * 4)
  const set = (x, y, c) => {
    const i = (y * size + x) * 4
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = c[3]
  }
  const r = size * 0.1875 * 2 // corner radius ~12/64
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // rounded-rect background
      const dx = Math.min(x, size - 1 - x)
      const dy = Math.min(y, size - 1 - y)
      const corner = dx < r && dy < r && Math.hypot(r - dx, r - dy) > r
      if (corner) continue
      set(x, y, bg)
    }
  }
  const book = (bx, by, bw, bh, cut) => {
    for (let y = by * s; y < by * s + bh * s; y++) {
      for (let x = bx * s; x < bx * s + bw * s; x++) {
        if (cut && y >= (by + bh) * s - 3 * s && x >= bx * s + 1 * s && x < bx * s + 6 * s) continue // spine notch
        set(Math.floor(x), Math.floor(y), fg)
      }
    }
  }
  book(14, 16, 9, 32, true)
  book(27, 20, 9, 28, false)
  book(40, 16, 9, 32, true)
  return encodePng(size, size, buf)
}

for (const [file, size] of [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180], // iOS home-screen icon (must be 180x180)
  ['favicon-180.png', 180] // raster favicon for clients that need a fixed size
]) {
  writeFileSync(join(root, 'public', file), drawIcon(size))
  console.log('wrote', file)
}
