// One-off script: convert "Logo Image.jpeg" into "logo.png" with a fully
// transparent background, using flood-fill from the corners so the white
// background AND its JPEG halo are removed, while the round badge's cream
// interior (a distinct, enclosed colour) is preserved untouched.
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('Logo Image.jpeg');
const OUT = path.resolve('logo.png');
const OUT_SMALL = path.resolve('logo-256.png');

const img = await loadImage(SRC);
const size = Math.min(img.width, img.height);
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Draw the square central crop of the source (it's square already).
ctx.drawImage(img, 0, 0, size, size);
const frame = ctx.getImageData(0, 0, size, size);
const px = frame.data;

const idx = (x, y) => (y * size + x) * 4;
const get = (x, y) => { const i = idx(x, y); return [px[i], px[i + 1], px[i + 2]]; };

// Flood fill from every border pixel that is near-white. Anything
// connected to the border and within tolerance becomes transparent.
const visited = new Uint8Array(size * size);
const stack = [];
const isNearWhite = (r, g, b) => r > 235 && g > 235 && b > 235 &&
  (Math.max(r, g, b) - Math.min(r, g, b)) < 14;

for (let x = 0; x < size; x++) { stack.push([x, 0]); stack.push([x, size - 1]); }
for (let y = 0; y < size; y++) { stack.push([0, y]); stack.push([size - 1, y]); }

while (stack.length) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= size || y >= size) continue;
  if (visited[y * size + x]) continue;
  const [r, g, b] = get(x, y);
  if (!isNearWhite(r, g, b)) { visited[y * size + x] = 1; continue; }
  visited[y * size + x] = 1;
  px[idx(x, y) + 3] = 0; // fully transparent
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// Second pass: soften the 1px halo left at the boundary between the kept
// badge and the removed background — pixels adjacent to transparency that
// are still light get partial alpha so no white edge remains.
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const i = idx(x, y);
    if (px[i + 3] === 0) continue;
    let touchesTransparent = false;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (px[idx(nx, ny) + 3] === 0) { touchesTransparent = true; break; }
    }
    if (touchesTransparent) {
      const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
      if (r > 225 && g > 225 && b > 225) px[i + 3] = 90; // soften halo
    }
  }
}

ctx.putImageData(frame, 0, 0);
fs.writeFileSync(OUT, canvas.toBuffer('image/png'));

// Also write a small 256px version for fast page loads.
const small = createCanvas(256, 256);
small.getContext('2d').drawImage(canvas, 0, 0, 256, 256);
fs.writeFileSync(OUT_SMALL, small.toBuffer('image/png'));

console.log('Wrote', OUT, 'and', OUT_SMALL);
