// Descarga cada foto del ultimo scraping y usa OCR para detectar si es una
// foto de "decant" (frasquito pequeño de muestra) en vez de la botella
// completa -- el proveedor le pone un dibujo con la palabra "DECANT" en
// grande + una pastilla "10 ML" arriba de la foto real del producto.
//
// No ofrecemos servicio de decant, asi que estos productos se excluyen del
// catalogo del sitio (ver build-catalog.js, bucket "exclude-decant"). El
// problema es que MUCHOS de estos productos no dicen "decant" en el titulo
// de texto -- a veces ni siquiera el tamaño es correcto (ej. un decant real
// de 10 ML listado como "100 ML" con precio de decant) -- asi que la unica
// forma confiable de detectarlos es mirando la foto.
//
// "DECANT" es una palabra grande, en mayuscula, con buen contraste -- mucho
// mas facil de leer por OCR que la marca de agua del proveedor (que por eso
// ya no se detecta por OCR, ver PROYECTO.md: esa se resuelve recortando y
// tapando geometricamente en el CSS del sitio, no detectando).
//
// Marca item.decantPhoto = true en scripts/nestor-parfum-raw.json.
// build-catalog.js excluye ese producto del catalogo (bucket
// exclude-decant), sin importar lo que diga el titulo.
//
// Corre solo via GitHub Actions (parte de npm run sync-catalog), pero
// tambien se puede correr a mano: node scripts/detect-decant-photos.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');

const RAW_PATH = path.join(__dirname, 'nestor-parfum-raw.json');
const WORKER_COUNT = 4;
const KEYWORDS = ['DECANT'];

async function isDecantPhoto(worker, imageUrl) {
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const w = meta.width;
  const h = meta.height;

  // La palabra "DECANT" + la pastilla "N ML" ocupan aprox el tercio
  // superior de estas fotos -- se recorta generoso para no fallar por poco.
  const stripH = Math.max(40, Math.round(h * 0.4));
  const crop = await sharp(buf)
    .extract({ left: 0, top: 0, width: w, height: stripH })
    .greyscale()
    .normalise()
    .resize({ width: w * 3 })
    .toBuffer();

  await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK });
  const {
    data: { text },
  } = await worker.recognize(crop);
  const t = text.toUpperCase();
  return KEYWORDS.some((k) => t.includes(k));
}

async function run() {
  const raw = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));
  const items = raw.filter((r) => r.image);
  console.log(`Revisando ${items.length} fotos por dibujo de "DECANT"...`);

  const workers = await Promise.all(
    Array.from({ length: WORKER_COUNT }, () => Tesseract.createWorker('eng'))
  );

  let idx = 0;
  let checked = 0;
  let flagged = 0;
  let errors = 0;

  async function runWorker(worker) {
    while (idx < items.length) {
      const item = items[idx++];
      try {
        item.decantPhoto = await isDecantPhoto(worker, item.image);
        if (item.decantPhoto) flagged++;
      } catch (err) {
        item.decantPhoto = false; // no bloquear el build por un fetch fallido puntual
        errors++;
        console.warn(`  [warn] fallo OCR en ${item.image}: ${err.message}`);
      }
      checked++;
      if (checked % 200 === 0) console.log(`  ${checked}/${items.length} revisadas (${flagged} son fotos de decant, ${errors} errores)`);
    }
  }

  await Promise.all(workers.map(runWorker));
  await Promise.all(workers.map((w) => w.terminate()));

  fs.writeFileSync(RAW_PATH, JSON.stringify(raw));
  console.log(`Listo: ${flagged} de ${items.length} fotos son de decant (${errors} con error de fetch/OCR, quedaron sin marcar).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
