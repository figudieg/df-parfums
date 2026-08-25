# DF Parfums — Estado del proyecto

Este archivo es para que retomes el proyecto en otra sesión de Claude (ej. en casa) sin perder contexto. Léelo completo antes de seguir trabajando.

## El negocio

- **Marca:** DF Parfums
- **Qué venden:** Perfumes 100% originales — tres ramas separadas: Árabes, Diseñador, y Nicho (nicho occidental, ej. Creed, Byredo, Mancera, Le Labo, Xerjoff, Montale). "Árabe de nicho" NO es una sola categoría — son tres cosas distintas, el usuario lo corrigió explícitamente (Agosto 2026) porque el sitio y el código las tenían mezcladas.
- **Modelo:** Tienda online, todo el proceso de venta es por WhatsApp (sin carrito ni pagos en el sitio)
- **Ubicación:** Miranda, Venezuela (Guarenas, Guatire) — entregas en persona en Caracas, envíos a nivel nacional
- **Emprendimiento desde casa**, el enfoque de marketing es contenido en TikTok e Instagram (@dfparfums.ve)
- **WhatsApp:** 0412-1985211 (formato internacional usado en el código: `584121985211`)

## En producción

- **Repo:** https://github.com/figudieg/df-parfums (público — ojo, eso incluye la fórmula de precios y el proveedor, ver nota de privacidad más abajo)
- **Sitio en vivo:** https://df-parfums.vercel.app (Vercel, deploy automático en cada push a `main`)
- El deploy inicial falló porque Vercel detectó `server.js` (el servidor de desarrollo local) y lo corrió como función serverless en vez de servir los archivos estáticos — por eso CSS/JS/imágenes daban 404. Se arregló renombrándolo a `dev-server.js` + agregando `.vercelignore` y `vercel.json` (`framework: null`) para forzar sitio estático puro. Si algún día vuelve a pasar algo raro en Vercel, ese es el primer sospechoso.

## Stack técnico

Sitio 100% estático, sin frameworks ni build:

```
index.html      → toda la estructura (hero, catálogo destacado, catálogo completo, modal, footer)
styles.css      → estilos
script.js       → scroll/reveal, modal de producto, catálogo completo (filtros/búsqueda/paginado), año del footer
dev-server.js   → servidor local Node puro (sin dependencias) SOLO para desarrollo — Vercel lo ignora (.vercelignore)
vercel.json     → framework: null, fuerza deploy estático sin build
assets/
  logo/         → logo.jpg (original), logo-white-nav.png (letras blancas, para el nav verde), logo-video.MP4
  productos/    → 6 fotos de producto reales (1 a 6, nombradas por producto)
  data/
    catalogo.js → catálogo completo (~1000 productos, con foto) generado desde el proveedor, ver abajo
scripts/
  scrape-catalog.js        → scraping con Playwright del catálogo en vivo del proveedor (titulo, precios, código, foto)
  build-catalog.js         → genera assets/data/catalogo.js a partir del raw scrapeado (filtros de marca + fórmula de precio)
  nestor-parfum-raw.json   → datos crudos de la última pasada de scraping (se regenera solo)
  catalog-curated.json     → resultado curado (los mismos que terminan en el sitio), para inspección
.github/workflows/sync-catalog.yml → GitHub Action que corre el scraping+build todos los días y hace push si cambió algo
package.json  → solo para las devDependencies del scraping (Playwright); el sitio en sí sigue sin build
.claude/launch.json → config del preview de Claude Code (nombre "df-parfums", corre dev-server.js en localhost:5501)
```

**Importante — dos servidores de desarrollo distintos, no te confundas:** este proyecto (`df-parfums`, en `~/Documents/GitHub/df-parfums`) usa el puerto **5501**. Hay OTRO proyecto viejo en `~/Documents/proyectos/perfumeria` (la carpeta original antes de subirlo a GitHub) que también tiene un `launch.json` con el nombre `"perfumeria"` en el puerto 5500 — si el preview de Claude Code arranca ese en vez de este, vas a estar editando un archivo pero viendo el otro. Si pasa, para el servidor equivocado y arranca `node dev-server.js` manualmente desde esta carpeta, o usa `preview_start` con el nombre exacto `"df-parfums"`.

Para levantar el sitio localmente: `node dev-server.js` (sirve en `http://localhost:5501`).

## Diseño

- **Paleta:** verde botella (`--green-deep: #12352A`) + crema (`--cream: #FAF6EC`) + dorado como acento (`--gold: #B8965F`), tomados del logo real de la marca.
- **Tipografía:** Playfair Display (títulos) + Inter (texto), vía Google Fonts.
- **Nav:** pill flotante verde con blur, con el logo mostrando solo las letras "DF parfums" en blanco (el fondo del logo se hizo transparente con un truco de canvas en el navegador: se cargó el logo.jpg, se convirtió a alpha-mask por luminancia y se exportó como PNG con letras blancas sobre transparente — ese es `logo-white-nav.png`). El botón de WhatsApp del nav es blanco con letras verdes.
- **Hero:** una sola columna centrada (logo/video arriba, texto abajo, botones). Se probó un layout de grid en dos columnas y secciones alternadas verde/blanco, pero **el usuario pidió revertir todo eso** — solo se quedó el cambio de color del nav. No reintentar esos cambios a menos que el usuario lo pida de nuevo explícitamente.
- El video del logo (`logo-video.MP4`) tiene su propio fondo "quemado" en el video — no se puede recolorear con CSS, solo se igualó el fondo del contenedor al crema de la página.

## Catálogo destacado (los 6 productos originales, con foto real)

Cada tarjeta es un `<button class="product-card">` con `data-*` attributes que alimentan el **modal de detalle** (foto grande, descripción, precios, botón de WhatsApp con mensaje predefinido). Estos 6 tienen foto real (tomada por el usuario) y precios **fijados a mano por él** (no vienen de la fórmula del proveedor):

| Producto | Precio Divisas/Efectivo | Precio BCV | Decant |
|---|---|---|---|
| AFNAN 9pm Night Out | $65 | $80 | Sí |
| Armaf Club de Nuit Urban Man Elixir | $55,08 | *(sin definir)* | Sí |
| Lattafa Pride Art of Universe | $70 | $80 | Sí |
| Hawas For Him — Fire | $65 | $80 | Sí |
| Hawas For Him — Malibu | $60 | $75 | Sí |
| Armaf Dunescape Dubai | $55 | $65 | Sí |

El "disponible en decant" es una afirmación real que el usuario hizo específicamente sobre estos 6 — **no asumir que aplica a los 600 del catálogo completo** (de esos no sabemos si hay decant).

## Catálogo completo (~1000 productos, conectado con el proveedor, se auto-actualiza)

Sección nueva (`#catalogo-mayor`) debajo del catálogo destacado: buscador + filtros por categoría (Árabes / Diseñador / Nicho / Estuches / Todos) + grid paginado de 30 en 30 ("Mostrar más"). Cada tarjeta (`.mini-card`) muestra foto (si el proveedor la tiene), nombre, género/tamaño, nota "similar a X" si aplica, ambos precios, y botón directo a WhatsApp con mensaje pre-armado por producto — todo generado dinámicamente en `script.js` a partir de `window.CATALOGO_NESTOR` (definido en `assets/data/catalogo.js`).

**Origen de los datos y auto-sync (Agosto 2026):** el catálogo del proveedor (`vercatalogo.com/nestor_parfum/products/by-all/all`) es un sitio Angular que carga los productos por lotes al hacer click en "Ver mas", con fotos en lazy-load. Un GitHub Action programado (`.github/workflows/sync-catalog.yml`, corre todos los días a las 9am hora Venezuela + se puede disparar a mano desde la pestaña Actions del repo) usa Playwright (`scripts/scrape-catalog.js`) para abrir esa página con un navegador real, clickear "Ver mas" hasta cargar todo, hacer scroll para disparar el lazy-load de fotos, y extraer título + precio + BCV + código único de producto + URL de foto de cada `.card`. Con eso regenera `scripts/nestor-parfum-raw.json` y corre `scripts/build-catalog.js`, que aplica la fórmula de precio y filtros de marca (ver abajo) y reescribe `assets/data/catalogo.js`. Si algo cambió, el workflow hace commit y push directo a `main`, lo que dispara el deploy automático de Vercel — es decir, el sitio se actualiza solo, sin que nadie tenga que correr nada a mano.
- **Cómo se detectan productos que el proveedor ya no tiene:** cada producto usa como `id` el código único que el proveedor le asigna internamente (`.codigo-producto` en su HTML, ej. `"yeelpa7cuvn"`), no un slug del nombre. Como el scraping siempre trae el catálogo completo y vigente, un producto que el proveedor quitó simplemente no aparece en la nueva pasada y desaparece de `catalogo.js` — no hace falta lógica de diff aparte.
- **Salvaguarda contra scraping roto:** `build-catalog.js` no sobreescribe `catalogo.js` si el nuevo catálogo tiene menos del 60% de los productos del anterior (protege contra que un cambio en el sitio del proveedor rompa los selectores y el Action vacíe el catálogo en vivo). `scrape-catalog.js` además aborta si extrae menos de 100 productos en crudo.
- **Fotos:** se linkean directo a la URL del proveedor (CDN de DigitalOcean Spaces, público, sin restricción de referrer — confirmado con curl) — no se descargan ni se guardan en el repo, así el sitio se mantiene sin build y liviano para Vercel free.
- Para forzar un refresh manual sin esperar al cron: `npm install && npx playwright install --with-deps chromium && npm run sync-catalog` desde la raíz del repo (o disparar el workflow a mano en GitHub Actions → "Sync catalogo Nestor Parfum" → "Run workflow").
- Este sistema reemplaza el proceso manual anterior (scraping puntual + `node scripts/build-catalog.js` a mano). Si el usuario pide agregar/quitar marcas de la selección curada, se sigue editando `ARABE_BRANDS` / `DESIGNER_BRANDS` / `NICHE_BRANDS` / `EXCLUDE_BRANDS` en `build-catalog.js` — el próximo run automático ya usa las listas nuevas.

**Fórmula de precio confirmada por el usuario (Agosto 2026, la más reciente — reemplaza cualquier fórmula anterior):**
- El precio que aparece en la página del proveedor ya tiene incluido un 10% de descuento mayorista → costo real = precio_página × 0.90.
- Ganancia del usuario: 25% sobre ese costo real → precio final = costo_real × 1.25.
- **En una sola fórmula: precio final = precio_página × 1.125**
- Esto se aplica **por separado a los dos precios reales que muestra la página** (el precio en $ y el precio "(BCV)"). El tercer número que aparece tachado en la página del proveedor (precio de lista/sugerido) **se ignora por completo**, el usuario dijo explícitamente que "es nulo para nosotros".
- "Divisas" y "Efectivo" son lo mismo para el usuario (un solo precio, más barato). El precio BCV es más alto (pago en bolívares a tasa BCV).
- Nota: esta fórmula (25% de ganancia) es DISTINTA a la que se usó una vez antes para los 6 productos destacados (esa fue 20%, y además el usuario terminó fijando esos 6 a mano). Si el usuario pide recalcular los 6 destacados con la fórmula nueva, avisar que actualmente NO siguen ninguna fórmula automática.

## Pendientes / próximos pasos

1. **Precio BCV de Armaf Club de Nuit Urban Man Elixir** (uno de los 6 destacados) — el usuario nunca lo dio, solo el precio en divisas ($55,08).
2. **Categorías que quedaron afuera a propósito:** testers, splash, perfumes de niños, marcas de imitación baratas (New Brand, Cuba, Fraglux, Macarena, etc.), y **decants** (cualquier producto con "DECANT" en el nombre, ~140 en el catálogo del proveedor) — el usuario no ofrece servicio de decant, así que no le sirve mostrarlos (confirmado Agosto 2026). Si el usuario los quiere después, están en `scripts/catalog-unclassified.json` (gitignored, hay que re-correr el scraping) o simplemente se amplían/ajustan las reglas de `classify()` en `build-catalog.js`.
4. El catálogo completo es una **foto fija** del proveedor al momento del scraping (Agosto 2026) — no se actualiza solo. Si los precios o el inventario del proveedor cambian, hay que volver a scrapear y correr `build-catalog.js`.

## Cómo agregar un producto individual al catálogo destacado (los 6 con foto)

```html
<button type="button" class="product-card reveal reveal-up"
  data-brand="MARCA" data-name="Nombre" data-size="Tipo · tamaño"
  data-price-usd="$XX" data-price-bcv="$YY" data-decant="true"
  data-desc="Descripción corta del aroma."
  data-img="assets/productos/archivo.jpg"
  data-wa="https://wa.me/584121985211?text=Hola%2C%20estoy%20interesado%20en%20[NOMBRE%20URL-ENCODED].%20Quiero%20m%C3%A1s%20informaci%C3%B3n.">
  <div class="product-photo"><img src="assets/productos/archivo.jpg" alt="Marca Nombre" loading="lazy"></div>
  <div class="product-info">
    <span class="product-brand">MARCA</span>
    <h4>Nombre</h4>
    <span class="product-size">Tipo · tamaño</span>
    <div class="product-prices">
      <span class="price-usd">$XX <em>Divisas/Efectivo</em></span>
      <span class="price-bcv">$YY <em>BCV</em></span>
    </div>
    <span class="decant-badge">Disponible en decant</span>
  </div>
  <span class="product-cta">Ver detalle →</span>
</button>
```

Si no hay precio BCV, se omite el `<span class="price-bcv">` (el JS del modal ya maneja `data-price-bcv=""` vacío ocultando esa línea).

Para el catálogo completo (los 600), **no se edita HTML a mano** — se edita `scripts/build-catalog.js` (listas de marcas o lógica de precio) y se vuelve a correr `node scripts/build-catalog.js`, que regenera `assets/data/catalogo.js` completo.
