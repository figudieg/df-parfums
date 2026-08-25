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
    catalogo.js    → catálogo del proveedor (~900 productos, con foto), auto-generado, ver abajo
    destacados.js  → los 6 productos con foto propia y decant disponible, se edita a mano
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

## Catálogo (un solo sistema unificado, decants + inventario del proveedor)

**Importante (Agosto 2026):** hasta hace poco había dos secciones separadas en la página — un grid de 6 tarjetas con foto propia (`.product-card`, hardcodeadas en `index.html`) y, debajo, el catálogo completo del proveedor (`.mini-card`). El usuario dijo explícitamente que **no le gustaba esa separación**, así que se fusionó todo en **un solo grid** bajo `#catalogo`. Si en el futuro alguien propone volver a separar "destacados" del resto, avisar que fue una decisión explícita del usuario, no un accidente.

Cómo quedó:
- Los 6 productos con foto propia viven ahora en `assets/data/destacados.js` (`window.DESTACADOS_DECANT`), **no en HTML** — cada uno con id, nombre, tamaño, precios, `image` (foto real en `assets/productos/`), `desc` (descripción) y `decant: true`. Este archivo se edita a mano; el scraping automático nunca lo toca.
- `script.js` arma `allProducts = [...DESTACADOS_DECANT, ...CATALOGO_NESTOR]` y renderiza **todo con la misma tarjeta** (`.mini-card`). Los que tienen `decant: true` se ordenan siempre primero (dentro de "Todos" y dentro de su categoría) y llevan una insignia dorada "Decant". Hay un filtro extra `data-cat="decant"` para verlos solos.
- Solo las tarjetas con `decant: true` son clicables para abrir el modal de detalle (foto grande + descripción + precios); las del catálogo del proveedor no tienen descripción propia, así que su única acción es el botón directo a WhatsApp — igual que antes.
- **"Disponible en decant" sigue siendo una afirmación real solo sobre esos 6** — el usuario dijo explícitamente que hoy son los únicos que tiene físicamente a la mano para fraccionar; el resto del catálogo (proveedor) son botellas completas, nunca asumir que hay decant ahí.
- Precios: `$65,08` con coma no se usa en la UI — `fmtPrice()` en `script.js` usa punto decimal (`$55.08`), así ha sido siempre en el catálogo grande, no es un bug nuevo.

Cada tarjeta del grid unificado muestra foto (real para los 6, del proveedor para el resto — con fondo degradado sutil en dorado/verde en vez de blanco plano), categoría, nombre, género/tamaño, nota "similar a X" si aplica (con altura reservada aunque no haya nota, para que todas las tarjetas de una fila midan igual), ambos precios (ahora estandarizados: USD con fondo verde sólido, BCV con chip dorado claro, mismo tamaño y peso de fuente en ambos para que se lean igual de bien), y botón de WhatsApp — todo generado dinámicamente en `script.js`.

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

## Cómo agregar un producto individual con decant (foto propia)

**No se edita HTML.** Se agrega un objeto al array `window.DESTACADOS_DECANT` en `assets/data/destacados.js`:

```js
{
  id: 'destacado-marca-nombre',        // unico, minusculas, guiones
  name: 'Marca Nombre',                 // marca incluida en el nombre, igual que el catalogo grande
  genero: '',                           // opcional, ej. 'Caballero' / 'Dama' / 'Unisex'
  size: 'Tipo · tamaño',
  note: '',
  category: 'arabe',                    // 'arabe' | 'disenador' | 'nicho' | 'estuche'
  categoryLabel: 'Árabes',
  priceUsd: 65,                         // numero, no string
  priceBcv: 80,                         // o null si todavia no se sabe
  image: 'assets/productos/archivo.jpg',
  decant: true,
  desc: 'Descripción corta del aroma.'
}
```

Foto real del producto va en `assets/productos/`. No hace falta tocar `index.html` ni `script.js` — el render, el badge "Decant", el orden (siempre primero) y el modal de detalle salen solos de ese objeto.

Para el resto del catálogo (proveedor, sin decant), **tampoco se edita a mano** — corre solo todos los días (ver sección de auto-sync arriba). Si hay que ajustar qué marcas entran, se edita `scripts/build-catalog.js`.
