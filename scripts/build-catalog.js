const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'nestor-parfum-raw.json'), 'utf8'));

// Arabes: rama de perfumeria arabe/oriental
const ARABE_BRANDS = [
  'LATTAFA', 'ARMAF', 'AFNAN', 'RASASI', 'HAWAS', 'AL HARAMAIN', 'ORIENTICA',
  'MAISON ALHAMBRA', 'BHARARA', 'FRENCH AVENUE', 'EMPER', 'SWISS ARABIAN',
  'AJMAL', 'NABEEL', 'ARD AL ZAAFARAN', 'RASHEED',
  'NAYAAT', 'MAKTOUB', 'RAYHAAN', 'ASSALA', 'ARABIYAD', 'DAR EL', 'CIEL',
  "L'HAYA", "L' HAYA", "L ' HAYA"
];

// Diseñador: marcas de moda / prestigio mainstream (venta masiva, department stores)
const DESIGNER_BRANDS = [
  'VERSACE', 'TOM FORD', 'DOLCE', 'VALENTINO', 'HUGO BOSS', 'JEAN PAUL GAULTIER',
  'CAROLINA HERRERA', 'CAROLINA HERREARA', 'PACO RABANNE', 'LACOSTE', 'CALVIN KLEIN',
  'RALPH LAUREN', 'PRADA', 'LANCOME', 'AZZARO', 'GUESS', 'ISSEY MIYAKE',
  'SALVATORE FERRAGAMO', 'VIKTOR & ROLF', 'ARIANA GRANDE', 'BRITNEY SPEARS',
  'KATY PERRY', 'JESUS DEL POZO', 'JESÚS DEL POZO', 'CLINIQUE', 'CLÍNIQUE',
  'NAUTICA', 'TOMMY HILFIGER', 'TOMMY GIRL', 'TOMMY IMPACT', 'TOMMY NOW',
  'ANTONIO BANDERAS', 'ANTONIO BANDERA', 'VICTORINOX', 'PARIS HILTON', 'D&G',
  'CHRISTIAN DIOR', 'DIOR', 'GIORGIO ARMANI', 'EMPORIO ARMANI', 'ARMANI',
  'BURBERRY', 'BVLGARI', 'CARTIER', 'GUCCI', 'GUERLAIN', 'GIVENCHY', 'JIMMY CHOO',
  'JUICY COUTURE', 'KENZO', 'LALIQUE', 'ELIZABETH ARDEN', 'ESTEE LAUDER',
  'ESTEE LAUDEE', 'DKNY', 'COACH', 'DAVIDOFF', 'ESCADA', 'CACHAREL', 'BOUCHERON',
  'ANIMALE', 'ABERCROMBIE', 'YVES SAINT LAURENT', 'MONT BLANC', 'JOOP', 'JO MILANO',
  'KENNETH COLE', 'LOUIS VUITTON', 'MARC JACOBS', 'MOSCHINO', 'NINA RICCI',
  'PERRY ELLIS', 'PHILIPP PLEIN', 'TED LAPIDUS', 'TOUS', 'ÓSCAR DE', 'OSCAR DE',
  "VICTORIA'S SECRET", 'VICTIRIA\'S SECRET', 'BALDESSARINI', 'BENTLEY', 'BOND NRO',
  'LIZ CLAIBORNE', 'LOLITA LEMPICKA', 'LAGERFELD', 'POLICE', "TERRE D'",
  'YVES SAINT LAUREN'
];

// Nicho: casas de perfumeria de nicho occidental (indie/artesanal, no venta
// masiva) -- rama separada de "Diseñador", no la misma cosa.
const NICHE_BRANDS = [
  'LE LABO', 'PARFUMS DE MARLY', 'MARLY', 'CREED', 'BYREDO', 'MANCERA',
  'XERJOFF', 'MONTALE'
];

// Budget/clone-only brands to exclude even though numerous
const EXCLUDE_BRANDS = [
  'NEW BRAND', 'CUBA', 'FRAGLUXE', 'FRAGLUX', 'MACARENA', 'GRANDEUR TUBBEES',
  'DUMONT', 'MAST PERFUME', 'SHAKIRA', 'ADIDAS', 'BENETTON'
];

function classify(title) {
  const t = title.toUpperCase();
  // Only match brand names against the part BEFORE the first "•" (the actual
  // product name), never against the full title — otherwise a "(similar al
  // Paco Rabanne ...)" note on a budget/clone product would wrongly tag it
  // as that designer brand.
  const namePart = t.split('•')[0];
  // The "(ÁRABE)" annotation is a real category marker and can appear
  // anywhere in the title, so that one check still uses the full string.
  if (/^TESTER\b/.test(t)) return 'exclude-tester';
  if (/^SPLASH\b/.test(t)) return 'exclude-splash';
  // No ofrecemos servicio de decant (no se venden por separado en tamaños
  // chicos tipo 10 ML), asi que se excluyen del catalogo del sitio.
  if (/DECANT/.test(namePart)) return 'exclude-decant';
  if (/NI[ÑN]O|KIDS|MARVEL|SPIDERMAN/.test(t)) return 'exclude-kids';
  if (EXCLUDE_BRANDS.some(b => namePart.includes(b))) return 'exclude-budget';
  if (/^ESTUCHE|^SET\b/.test(t)) return 'estuche';
  if (/\(\s*ÁRABE\s*\)|\(\s*ARABE\s*\)/.test(t) || ARABE_BRANDS.some(b => namePart.includes(b))) return 'arabe';
  if (NICHE_BRANDS.some(b => namePart.includes(b))) return 'nicho';
  if (DESIGNER_BRANDS.some(b => namePart.includes(b))) return 'disenador';
  return 'unclassified';
}

function parseMoney(str) {
  if (!str) return null;
  const m = str.replace(/\./g, '').match(/([\d,]+)/);
  if (!m) return null;
  return parseFloat(m[1].replace(',', '.'));
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (w) => {
    // keep known acronyms upper
    if (/^(EDP|EDT|ML|CH|DKNY|YSL|USA|AM|PM|VIP|OUD)$/i.test(w)) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

const seen = new Set();
const results = raw.map((item) => {
  const rawTitle = item.title.replace(/\s+/g, ' ').trim();
  const bucket = classify(rawTitle);

  // Title format: "NAME • GENERO • SIZE (nota)"
  const parts = rawTitle.split('•').map(s => s.trim());
  const namePart = parts[0] || rawTitle;
  const generoPart = parts[1] || '';
  let sizePart = parts[2] || '';

  // Pull "(similar al X)" / "(ÁRABE)" asides out of the size string into
  // their own note, so size just shows e.g. "100 ML".
  let note = '';
  const parenMatch = sizePart.match(/\(([^)]+)\)/);
  if (parenMatch) {
    note = parenMatch[1].trim();
    sizePart = sizePart.replace(/\([^)]+\)/g, '').trim();
  }
  if (/^ÁRABE$|^ARABE$/i.test(note)) note = '';

  const rawUsd = parseMoney(item.price);
  const rawBcv = parseMoney(item.bcv);
  const finalUsd = rawUsd != null ? Math.round(rawUsd * 1.125 * 100) / 100 : null;
  const finalBcv = rawBcv != null ? Math.round(rawBcv * 1.125 * 100) / 100 : null;

  return {
    key: rawTitle.toLowerCase(),
    code: item.code || '',
    // Si scripts/detect-watermarks.js marco esta foto con el logo del
    // proveedor pegado, no la mostramos (queda sin foto hasta que
    // photo-overrides.json le ponga una propia).
    image: item.watermark ? '' : (item.image || ''),
    rawTitle,
    name: toTitleCase(namePart),
    genero: generoPart,
    size: sizePart,
    note: note ? toTitleCase(note.toLowerCase()) : '',
    bucket,
    rawUsd, rawBcv, finalUsd, finalBcv
  };
}).filter((item) => {
  if (item.finalUsd == null) return false;
  const dedupeKey = item.code || item.key;
  if (seen.has(dedupeKey)) return false;
  seen.add(dedupeKey);
  return true;
});

const counts = {};
results.forEach(r => { counts[r.bucket] = (counts[r.bucket] || 0) + 1; });

const curatedBuckets = ['arabe', 'disenador', 'nicho', 'estuche'];
const curated = results.filter(r => curatedBuckets.includes(r.bucket));
const unclassified = results.filter(r => r.bucket === 'unclassified');

fs.writeFileSync(path.join(__dirname, 'catalog-full-classified.json'), JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(__dirname, 'catalog-curated.json'), JSON.stringify(curated, null, 2));
fs.writeFileSync(path.join(__dirname, 'catalog-unclassified.json'), JSON.stringify(unclassified.map(u => u.rawTitle), null, 2));

// ---- Site-ready data file ----
const bucketOrder = { arabe: 0, disenador: 1, nicho: 2, estuche: 3 };
const bucketLabel = { arabe: 'Árabes', disenador: 'Diseñador', nicho: 'Nicho', estuche: 'Estuche' };

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const usedIds = new Set();
const keyToSiteItem = new Map();
const siteData = curated
  .sort((a, b) => (bucketOrder[a.bucket] - bucketOrder[b.bucket]) || a.name.localeCompare(b.name))
  .map((item) => {
    let id = item.code || slugify(`${item.name}-${item.size}`);
    while (usedIds.has(id)) id += '-x';
    usedIds.add(id);
    const siteItem = {
      id,
      name: item.name,
      genero: item.genero ? item.genero.charAt(0) + item.genero.slice(1).toLowerCase() : '',
      size: item.size,
      note: item.note,
      category: item.bucket,
      categoryLabel: bucketLabel[item.bucket],
      priceUsd: item.finalUsd,
      priceBcv: item.finalBcv,
      image: item.image || ''
    };
    keyToSiteItem.set(item.key, siteItem);
    return siteItem;
  });

// ---- Decants disponibles (registro manual en decant-registry.json, cruzado
// contra el scraping mas reciente) ----
// Si el proveedor tiene el perfume esta semana, el producto sale con su foto
// y precio de botella completa reales + insignia de decant. Si no lo tiene
// (agotado o descontinuado del lado del proveedor), el producto no
// desaparece del sitio: se muestra como "Agotado" con solo el precio/tamaño
// del decant, que si controla el usuario porque es su propio inventario.
const DECANT_DEFAULT_PRICE = { arabe: 5, disenador: 7, nicho: 12 };
const decantRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, 'decant-registry.json'), 'utf8'));

decantRegistry.forEach((entry) => {
  const pattern = new RegExp(entry.matchPattern, 'i');
  const liveMatch = results.find((r) =>
    !r.bucket.startsWith('exclude-') && r.bucket !== 'unclassified' && r.bucket !== 'estuche' &&
    pattern.test(r.rawTitle)
  );
  const decantPrice = entry.decantPrice != null ? entry.decantPrice : DECANT_DEFAULT_PRICE[entry.category];

  if (liveMatch) {
    const siteItem = keyToSiteItem.get(liveMatch.key);
    if (siteItem) {
      siteItem.decant = true;
      siteItem.decantSize = entry.decantSize;
      siteItem.decantPrice = decantPrice;
      siteItem.agotado = false;
    }
  } else {
    let id = 'decant-' + slugify(entry.displayName);
    while (usedIds.has(id)) id += '-x';
    usedIds.add(id);
    siteData.unshift({
      id,
      name: entry.displayName,
      genero: '',
      size: '',
      note: '',
      category: entry.category,
      categoryLabel: bucketLabel[entry.category],
      priceUsd: null,
      priceBcv: null,
      image: '',
      decant: true,
      decantSize: entry.decantSize,
      decantPrice,
      agotado: true
    });
  }
});

// ---- Fotos del proveedor que traen su logo/marca de agua (no las queremos
// mostrar tal cual) -- registro manual en scripts/photo-overrides.json.
// action "hide": no se muestra ninguna foto para ese producto (queda el
// fondo de la tarjeta, sin imagen) hasta que se le agregue una propia.
// action "replace": usa la imagen local indicada en vez de la del proveedor.
const photoOverridesPath = path.join(__dirname, 'photo-overrides.json');
const photoOverrides = fs.existsSync(photoOverridesPath)
  ? JSON.parse(fs.readFileSync(photoOverridesPath, 'utf8'))
  : [];

photoOverrides.forEach((entry) => {
  const pattern = new RegExp(entry.matchPattern, 'i');
  const match = results.find((r) => !r.bucket.startsWith('exclude-') && pattern.test(r.rawTitle));
  if (!match) return;
  const siteItem = keyToSiteItem.get(match.key);
  if (!siteItem) return;
  siteItem.image = entry.action === 'replace' ? (entry.image || '') : '';
});

const jsOut = `// Generado automaticamente por scripts/build-catalog.js a partir del
// catalogo publico de Nestor Parfum (vercatalogo.com/nestor_parfum).
// Precio final = precio_proveedor x 0.90 (mayorista) x 1.25 (ganancia 25%).
// Este archivo se regenera solo (ver .github/workflows/sync-catalog.yml) cada
// vez que corre scripts/scrape-catalog.js. No editar a mano.
window.CATALOGO_NESTOR = ${JSON.stringify(siteData, null, 2)};
`;
const outFile = path.join(__dirname, '..', 'assets', 'data', 'catalogo.js');

// Salvaguarda: si el nuevo catalogo tiene muchos menos productos que el
// anterior (ej. el scraping se rompio a medias por un cambio en el sitio del
// proveedor), no lo sobreescribimos -- eso vaciaria el catalogo en vivo.
if (fs.existsSync(outFile)) {
  const prevMatch = fs.readFileSync(outFile, 'utf8').match(/"id":/g);
  const prevCount = prevMatch ? prevMatch.length : 0;
  if (prevCount > 0 && siteData.length < prevCount * 0.6) {
    throw new Error(
      `El nuevo catalogo tiene ${siteData.length} productos vs ${prevCount} antes (caida > 40%). ` +
      `Probablemente el scraping fallo a medias. Abortando sin escribir catalogo.js.`
    );
  }
}

fs.writeFileSync(outFile, jsOut);

console.log('Site-ready items written:', siteData.length);

console.log('Total raw:', raw.length);
console.log('Total unique parsed:', results.length);
console.log('Counts by bucket:', counts);
console.log('Curated total:', curated.length);
console.log('Sample curated:', curated.slice(0, 5));
