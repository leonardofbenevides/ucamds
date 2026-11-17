// Decodificador mínimo de PNG (8 bits, RGB ou RGBA, sem entrelaçamento) — o
// que o Page.captureScreenshot do Chrome devolve. Sem dependência: as sondas
// rodam em máquina que pode não ter o registro de pacotes.

import { inflateSync } from 'node:zlib';

export function lePng(buf) {
  let p = 8;
  const chunks = [];
  let w, h, depth, ctype;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    if (type === 'IDAT') chunks.push(data);
    p += 12 + len;
  }
  if (depth !== 8 || (ctype !== 6 && ctype !== 2)) throw new Error(`PNG não suportado: profundidade ${depth}, tipo ${ctype}`);
  const bpp = ctype === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, b = prev ? prev[i] : 0, c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = src[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      row[i] = v & 255;
    }
  }
  return { w, h, bpp, dados: out, px: (x, y) => { const o = y * stride + x * bpp; return [out[o], out[o + 1], out[o + 2]]; } };
}

/** Quantos pixels diferem (soma |ΔR|+|ΔG|+|ΔB| acima do limiar) entre duas fotos do mesmo tamanho. */
export function pixelsDiferentes(a, b, limiar = 30) {
  if (a.w !== b.w || a.h !== b.h) return Infinity;
  let n = 0;
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      const p = a.px(x, y), q = b.px(x, y);
      if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) > limiar) n++;
    }
  }
  return n;
}
