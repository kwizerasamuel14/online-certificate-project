import fs from 'fs';

export default async function run(page, ui) {
  const b64 = fs.readFileSync('qa-download.pdf').toString('base64');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"><\/script>
</head><body style="margin:0"><canvas id="c"></canvas>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
(async () => {
  const bytes = Uint8Array.from(atob('${b64}'), ch => ch.charCodeAt(0));
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pg = await pdf.getPage(1);
  const vp = pg.getViewport({ scale: 2.2 });
  const c = document.getElementById('c');
  c.width = vp.width; c.height = vp.height;
  await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  window.done = true;
})();
<\/script></body></html>`;
  fs.writeFileSync('qa-pdf-render.html', html);
  await page.goto('http://localhost:8090/qa-pdf-render.html');
  await page.waitForFunction(() => window.done === true, null, { timeout: 30000 });
  await page.locator('canvas').screenshot({ path: 'qa-pdf-rendered.png' });
  return { ok: true };
}
