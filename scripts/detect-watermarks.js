// Descarga cada foto del ultimo scraping y usa OCR sobre la franja superior
// para detectar la marca de agua del proveedor: recorta el 10% superior de
// la imagen, la agranda 3x (el texto es chico y OCR falla si no se agranda)
// y busca las palabras "PERFUME" y "MARCA" -- que son el eslogan fijo
// ("EL PERFUME QUE MARCA TU ESENCIA") que el proveedor le pega a las fotos
// que el edito con su logo. Las fotos originales de fabrica no lo tienen.
//
// Marca item.watermark = true en scripts/nestor-parfum-raw.json. build-
// catalog.js oculta esa foto (a menos que este en photo-overrides.json con
// una foto propia de reemplazo).
//
// Corre solo via GitHub Actions (parte de npm run sync-catalog), pero
// tambien se puede correr a mano: node scripts/detect-watermarks.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');

const RAW_PATH = path.join(__dirname, 'nestor-parfum-raw.json');
const WORKER_COUNT = 4;

async function hasWatermark(worker, imageUrl) {
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const stripHeight = Math.max(20, Math.round(meta.height * 0.1));
  const crop = await sharp(buf)
    .extract({ left: 0, top: 0, width: meta.width, height: stripHeight })
    .resize({ width: meta.width * 3 })
    .toBuffer();
  const {
    data: { text },
  } = await worker.recognize(crop);
  const t = text.toUpperCase();
  return t.includes('PERFUME') && t.includes('MARCA');
}

async function run() {
  const raw = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));
  const items = raw.filter((r) => r.image);
  console.log(`Revisando ${items.length} fotos por marca de agua del proveedor...`);

  const workers = await Promise.all(
    Array.from({ length: WORKER_COUNT }, () => Tesseract.createWorker('eng'))
  );

  let idx = 0;
  let checked = 0;
  let flagged = 0;

  async function runWorker(worker) {
    while (idx < items.length) {
      const item = items[idx++];
      try {
        item.watermark = await hasWatermark(worker, item.image);
        if (item.watermark) flagged++;
      } catch (err) {
        item.watermark = false; // no bloquear el build por un fetch fallido puntual
      }
      checked++;
      if (checked % 200 === 0) console.log(`  ${checked}/${items.length} revisadas (${flagged} con marca de agua)`);
    }
  }

  await Promise.all(workers.map(runWorker));
  await Promise.all(workers.map((w) => w.terminate()));

  fs.writeFileSync(RAW_PATH, JSON.stringify(raw));
  console.log(`Listo: ${flagged} de ${items.length} fotos marcadas con watermark del proveedor.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
