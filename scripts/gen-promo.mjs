import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import zlib from 'node:zlib'

const crcTable = (() => {
  const table = new Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

const crc32 = (buf) => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const typeBuf = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([length, typeBuf, data, crc])
}

const makePng = (size, color) => {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const [r, g, b] = color
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size.w, 0)
  ihdr.writeUInt32BE(size.h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const row = Buffer.alloc(1 + size.w * 3)
  row[0] = 0
  for (let x = 0; x < size.w; x++) {
    row[1 + x * 3] = r
    row[1 + x * 3 + 1] = g
    row[1 + x * 3 + 2] = b
  }
  const raw = Buffer.concat(Array.from({ length: size.h }, () => row))
  const idat = zlib.deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const dir = resolve('store/images')
mkdirSync(dir, { recursive: true })

const brand = [79, 70, 229]
const sizes = [
  { w: 440, h: 280, name: 'promo-small' },
  { w: 920, h: 680, name: 'promo-large' },
  { w: 1400, h: 560, name: 'promo-marquee' },
]

for (const s of sizes) {
  writeFileSync(resolve(dir, `${s.name}.png`), makePng(s, brand))
  console.log(`Wrote ${s.name}.png (${s.w}x${s.h})`)
}
