// Descarga cada foto del ultimo scraping y usa OCR para detectar la marca de
// agua del proveedor. Nestor Parfum le pega a algunas de sus fotos (las que
// son foto real de el, no render de fabrica) dos cosas fijas:
//   1) Un banner arriba de toda la foto: "EL PERFUME QUE MARCA TU ESENCIA".
//   2) Una insignia con su nombre "NESTOR PARFUM" (variante chica abajo-
//      izquierda, o cinta diagonal grande abajo-derecha).
//
// v1 de este script solo miraba el banner de arriba y exigia leer "PERFUME"
// Y "MARCA" exactos via OCR -- en la practica el OCR es inconsistente con
// ese texto (fuente fina, muy espaciada): en una prueba manual, dos fotos
// con el banner clarisimo a simple vista (Creed Aventus, Armaf Club de Nuit
// Sillage) no se marcaron porque el texto salio garabateado. v2 es mas
// tolerante en tres frentes:
//   - Preprocesa cada recorte (escala de grises + normalizar contraste)
//     antes del OCR, que ayuda mucho con texto fino de bajo contraste.
//   - Exige leer UNA de varias palabras clave, no todas -- si el OCR
//     garabatea una palabra pero lee otra bien, igual detecta.
//   - Ademas del banner de arriba, revisa las dos esquinas inferiores por
//     separado buscando "NESTOR" (nombre de marca, muy poco probable que
//     aparezca por accidente en el texto de una caja de perfume), para
//     agarrar casos donde el banner de arriba no se pueda leer pero la
//     insignia si.
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

// Cualquiera de estas en el banner de arriba = marca de agua. Se exige una
// sola (no las tres) porque el OCR a veces lee bien 1-2 palabras del eslogan
// y garabatea el resto.
const TOP_KEYWORDS = ['PERFUME', 'MARCA', 'ESENCIA'];
// "NESTOR" es un nombre propio: practicamente cero riesgo de que aparezca
// por accidente en el texto real de una caja de perfume.
const CORNER_KEYWORDS = ['NESTOR'];

async function ocrRegion(worker, buf, region, psm) {
  const safeRegion = {
    left: Math.max(0, Math.min(region.left, region.imgWidth - 1)),
    top: Math.max(0, Math.min(region.top, region.imgHeight - 1)),
    width: Math.max(1, Math.min(region.width, region.imgWidth - region.left)),
    height: Math.max(1, Math.min(region.height, region.imgHeight - region.top)),
  };
  const crop = await sharp(buf)
    .extract(safeRegion)
    .greyscale()
    .normalise()
    .resize({ width: safeRegion.width * 4 })
    .toBuffer();
  await worker.setParameters({ tessedit_pageseg_mode: psm });
  const {
    data: { text },
  } = await worker.recognize(crop);
  return text.toUpperCase();
}

async function hasWatermark(worker, imageUrl) {
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const w = meta.width;
  const h = meta.height;

  // Banner superior: linea completa, ancho total de la foto.
  const topH = Math.max(24, Math.round(h * 0.13));
  const topText = await ocrRegion(
    worker, buf,
    { left: 0, top: 0, width: w, height: topH, imgWidth: w, imgHeight: h },
    Tesseract.PSM.SINGLE_LINE
  );
  if (TOP_KEYWORDS.some((k) => topText.includes(k))) return true;

  // Esquinas inferiores: bloque de texto (el nombre va en 2 lineas,
  // "NESTOR" arriba de "PARFUM" dentro de la insignia).
  const cornerW = Math.max(60, Math.round(w * 0.34));
  const cornerH = Math.max(40, Math.round(h * 0.17));

  const bottomLeftText = await ocrRegion(
    worker, buf,
    { left: 0, top: h - cornerH, width: cornerW, height: cornerH, imgWidth: w, imgHeight: h },
    Tesseract.PSM.SINGLE_BLOCK
  );
  if (CORNER_KEYWORDS.some((k) => bottomLeftText.includes(k))) return true;

  const bottomRightText = await ocrRegion(
    worker, buf,
    { left: w - cornerW, top: h - cornerH, width: cornerW, height: cornerH, imgWidth: w, imgHeight: h },
    Tesseract.PSM.SINGLE_BLOCK
  );
  if (CORNER_KEYWORDS.some((k) => bottomRightText.includes(k))) return true;

  return false;
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
  let errors = 0;

  async function runWorker(worker) {
    while (idx < items.length) {
      const item = items[idx++];
      try {
        item.watermark = await hasWatermark(worker, item.image);
        if (item.watermark) flagged++;
      } catch (err) {
        item.watermark = false; // no bloquear el build por un fetch fallido puntual
        errors++;
        console.warn(`  [warn] fallo OCR en ${item.image}: ${err.message}`);
      }
      checked++;
      if (checked % 200 === 0) console.log(`  ${checked}/${items.length} revisadas (${flagged} con marca de agua, ${errors} errores)`);
    }
  }

  await Promise.all(workers.map(runWorker));
  await Promise.all(workers.map((w) => w.terminate()));

  fs.writeFileSync(RAW_PATH, JSON.stringify(raw));
  console.log(`Listo: ${flagged} de ${items.length} fotos marcadas con watermark del proveedor (${errors} con error de fetch/OCR, quedaron sin marcar).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
