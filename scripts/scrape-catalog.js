// Vuelve a scrapear el catalogo publico de Nestor Parfum (vercatalogo.com) con
// un navegador real (Playwright), clickeando "Ver mas" hasta cargar todo el
// catalogo, y extrae titulo + precio + BCV + codigo de producto + foto de
// cada tarjeta. Escribe scripts/nestor-parfum-raw.json en el mismo formato
// que build-catalog.js espera.
//
// Corre solo via GitHub Actions (.github/workflows/sync-catalog.yml), pero
// tambien se puede correr a mano: node scripts/scrape-catalog.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const CATALOG_URL = 'https://vercatalogo.com/nestor_parfum/products/by-all/all';
const MAX_CLICKS = 100; // suficiente para cubrir >2000 productos (24 por click)

async function run() {
  const browser = await chromium.launch({
    args: [
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=CalculateNativeWinOcclusion',
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 2200 } });

  await page.goto(CATALOG_URL, { waitUntil: 'networkidle', timeout: 60000 });

  const acceptBtn = page.getByRole('button', { name: 'Acepto' });
  if (await acceptBtn.isVisible().catch(() => false)) {
    await acceptBtn.click().catch(() => {});
  }

  await page.waitForSelector('.card', { timeout: 30000 });

  let clicks = 0;
  while (clicks < MAX_CLICKS) {
    const verMas = page.locator('button.button-secondary', { hasText: 'Ver mas' }).first();

    // El boton puede desaparecer un instante entre tandas mientras Angular
    // carga la siguiente pagina; reintenta unas veces antes de asumir que
    // se acabo el catalogo.
    let visible = false;
    for (let attempt = 0; attempt < 5 && !visible; attempt++) {
      visible = await verMas.isVisible().catch(() => false);
      if (!visible) await page.waitForTimeout(800);
    }
    if (!visible) break;

    const before = await page.locator('.card').count();
    await verMas.click().catch(() => {});
    await page
      .waitForFunction(
        (prevCount) => document.querySelectorAll('.card').length > prevCount,
        before,
        { timeout: 15000 }
      )
      .catch(() => {});
    clicks++;
  }

  const totalCards = await page.locator('.card').count();
  console.log(`Cargadas ${totalCards} tarjetas despues de ${clicks} clicks en "Ver mas"`);

  // Recorre toda la pagina para disparar el lazy-load de las fotos.
  await page.evaluate(async () => {
    const step = 900;
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });

  // Espera a que la mayoria de las fotos terminen de cargar (con limite).
  await page
    .waitForFunction(
      () => {
        const imgs = Array.from(document.querySelectorAll('.card img'));
        if (imgs.length === 0) return true;
        const withSrc = imgs.filter((i) => i.src && i.src.startsWith('http')).length;
        return withSrc >= imgs.length * 0.9;
      },
      { timeout: 25000 }
    )
    .catch(() => {});

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.card'))
      .map((card) => {
        const title = (card.querySelector('.title.p5')?.textContent || '').trim();
        const priceEl = card.querySelector('.price.h4');
        let price = '';
        if (priceEl) {
          price = Array.from(priceEl.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent)
            .join(' ')
            .trim();
        }
        const bcv = (card.querySelector('.custom-notes.p5')?.textContent || '').trim();
        const code = (card.querySelector('.codigo-producto')?.textContent || '').trim();
        const img = card.querySelector('img');
        const image = img && img.src && img.src.startsWith('http') ? img.src : '';
        return { code, title, price, bcv, image };
      })
      .filter((it) => it.title && it.price);
  });

  const outPath = path.join(__dirname, 'nestor-parfum-raw.json');
  fs.writeFileSync(outPath, JSON.stringify(items));
  const withImage = items.filter((i) => i.image).length;
  console.log(`Escritos ${items.length} productos en ${outPath} (${withImage} con foto)`);

  await browser.close();

  if (items.length < 100) {
    throw new Error(
      `Solo se extrajeron ${items.length} productos, algo salio mal (esperado varios cientos). Abortando para no sobreescribir el catalogo con datos incompletos.`
    );
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
