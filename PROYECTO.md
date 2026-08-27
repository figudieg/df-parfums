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
  productos/    → vacía (se usó para las 6 fotos propias, eliminadas en Agosto 2026 al pasar todo a fotos del proveedor)
  data/
    catalogo.js    → catálogo del proveedor (~900 productos, con foto y decants marcados), auto-generado, ver abajo
scripts/
  scrape-catalog.js        → scraping con Playwright del catálogo en vivo del proveedor (titulo, precios, código, foto)
  detect-watermarks.js     → OCR sobre cada foto para marcar las que traen el logo del proveedor pegado
  build-catalog.js         → genera assets/data/catalogo.js: filtros de marca + fórmula de precio + cruce con decant-registry.json
  decant-registry.json     → lista corta a mano: qué perfumes tiene el usuario para decantar (ver sección de Catálogo)
  photo-overrides.json     → lista corta a mano: qué fotos del proveedor ocultar/reemplazar (ej. traen su logo)
  nestor-parfum-raw.json   → datos crudos de la última pasada de scraping (se regenera solo)
  catalog-curated.json     → resultado curado (los mismos que terminan en el sitio), para inspección
.github/workflows/sync-catalog.yml → GitHub Action que corre el scraping+build todos los días y hace push si cambió algo
package.json  → solo para las devDependencies del scraping (Playwright); el sitio en sí sigue sin build
.claude/launch.json → config del preview de Claude Code (nombre "df-parfums", corre dev-server.js en localhost:5501)
```

**Importante — dos servidores de desarrollo distintos, no te confundas:** este proyecto (`df-parfums`, en `~/Documents/GitHub/df-parfums`) usa el puerto **5501**. Hay OTRO proyecto viejo en `~/Documents/proyectos/perfumeria` (la carpeta original antes de subirlo a GitHub) que también tiene un `launch.json` con el nombre `"perfumeria"` en el puerto 5500 — si el preview de Claude Code arranca ese en vez de este, vas a estar editando un archivo pero viendo el otro. Si pasa, para el servidor equivocado y arranca `node dev-server.js` manualmente desde esta carpeta, o usa `preview_start` con el nombre exacto `"df-parfums"`.

Para levantar el sitio localmente: `node dev-server.js` (sirve en `http://localhost:5501`).

## Diseño

- **Paleta:** verde botella (`--green-deep: #12352A`) + crema (`--bg: #FAF6EC`) + dorado como acento (`--gold: #B8965F`), tomados del logo real de la marca.
- **Tipografía:** Playfair Display (títulos) + Inter (texto), vía Google Fonts.
- **Modo oscuro/claro (Agosto 2026):** el usuario pidió esto explícitamente porque el fondo blanco/crema "se ve vacío". **Oscuro es el modo predeterminado** (pedido explícito del usuario, no sigue `prefers-color-scheme` del sistema) — el claro solo se activa si el usuario lo elige a mano con el botón de sol/luna en el nav (`#themeToggle`), que pone `data-theme="light"` en `<html>` y lo guarda en `localStorage` (`df-theme`). Sin nada guardado (o con `df-theme` distinto de `"light"`), siempre es oscuro. Toda la paleta está en tokens CSS: `:root` en `styles.css` ya trae los valores **oscuros** por defecto, y `:root[data-theme="light"]` los sobreescribe con los claros. Tokens que cambian entre modos: `--bg`, `--bg-alt`, `--surface`, `--text`, `--text-soft`, `--heading` (+ `--heading-rgb` para `rgba()`), `--border`, `--border-strong`, `--tint`, `--gold`. `--green-deep` y `--white` son fijos de marca (fondos de botones/pills verdes que se quedan verdes en ambos modos). **Sin degradados/gradients en ningún lado** — el usuario pidió explícitamente que el diseño no "se vea hecho por IA"; si se necesita distinguir un fondo (ej. el contenedor de foto de las mini-cards), usar un color plano de otro token (`--bg-alt`), nunca `radial-gradient`/`linear-gradient`. **Importante para futuros cambios de estilo:** cualquier color nuevo debe usar estos tokens (nunca un hex fijo) para que funcione en ambos modos, y no usar gradientes.
- **Nav:** pill flotante verde con blur, con el logo mostrando solo las letras "DF parfums" en blanco (el fondo del logo se hizo transparente con un truco de canvas en el navegador: se cargó el logo.jpg, se convirtió a alpha-mask por luminancia y se exportó como PNG con letras blancas sobre transparente — ese es `logo-white-nav.png`). El botón de WhatsApp del nav es blanco con letras verdes.
- **Hero:** una sola columna centrada (logo/video arriba, texto abajo, botones). Se probó un layout de grid en dos columnas y secciones alternadas verde/blanco, pero **el usuario pidió revertir todo eso** — solo se quedó el cambio de color del nav. No reintentar esos cambios a menos que el usuario lo pida de nuevo explícitamente.
- El video del logo (`logo-video.MP4`) tiene su propio fondo "quemado" en el video — no se puede recolorear con CSS, solo se igualó el fondo del contenedor al crema de la página.

## Catálogo (un solo sistema unificado, con "decants" cruzados contra el proveedor)

**Importante (Agosto 2026):** hasta hace poco había dos secciones separadas en la página, y luego un archivo `destacados.js` con fotos y precios fijados a mano para los productos con decant. **Ambas cosas se descartaron a pedido del usuario** — no le gustaba la separación visual, y además los precios a mano se desactualizaban (pasó con el Elixir). Si en el futuro alguien propone volver a alguna de esas dos formas, avisar que fueron decisiones explícitas del usuario, no accidentes.

Cómo quedó (el sistema "decant + agotado"):
- `scripts/decant-registry.json` es el único archivo que se edita a mano para esto: una lista corta de `{ matchPattern, displayName, category, decantSize, decantPrice? }` — el perfume que el usuario tiene físicamente para decantar, un patrón regex para reconocerlo en el scraping, y el tamaño/precio del decant (si no se especifica `decantPrice`, se usa el default de su categoría: `DECANT_DEFAULT_PRICE` en `build-catalog.js`, hoy `{ arabe: 5, disenador: 7, nicho: 12 }`).
- **`build-catalog.js` cruza ese registro contra el scraping en cada corrida**, después de armar `siteData`:
  - Si encuentra el perfume en el catálogo vigente del proveedor → le agrega `decant: true`, `decantSize`, `decantPrice`, `agotado: false` al producto real (que ya trae su foto y precio de botella completa actualizados, como cualquier otro).
  - Si **no** lo encuentra (el proveedor no lo tiene esta semana como botella completa) → se sintetiza una entrada con `agotado: true`, sin foto ni precio de botella (esos datos no existen), solo el `decantSize`/`decantPrice` del registro. El producto no desaparece del sitio.
- Esto es 100% automático de ahí en adelante: si el usuario consigue un perfume nuevo para decantar, solo agrega una línea a `decant-registry.json` — no hay que tocar fotos ni precios nunca, ni preocuparse de que el proveedor dejó de tenerlo (pasa a mostrarse "Agotado" solo, y vuelve a mostrar precio de botella si el proveedor lo recupera).
- `script.js` ya no mezcla dos fuentes de datos — todo sale de `window.CATALOGO_NESTOR` (`assets/data/catalogo.js`) directo. Los `decant: true` se ordenan siempre primero (dentro de "Todos" y dentro de su categoría) y llevan insignia dorada "Decant". Hay un filtro extra `data-cat="decant"` para verlos solos.
- **Estado agotado:** en la tarjeta se ve una insignia gris "Agotado" + una insignia dorada "Disponible en decant" (**sin precio** — ver nota abajo). El botón de WhatsApp cambia su mensaje para pedir el decant específicamente (no la botella completa) — confirmado con el usuario que así debe ser.
- **Ya no hay modal de detalle** (foto grande + descripción) — se eliminó junto con `destacados.js` porque ningún producto (ni los del proveedor ni los decant) tiene descripción curada a mano. Todas las tarjetas usan solo el botón directo a WhatsApp.
- Precios: `$65,08` con coma no se usa en la UI — `fmtPrice()` en `script.js` usa punto decimal (`$55.08`), así ha sido siempre en el catálogo grande, no es un bug nuevo.
- **Estado real a Agosto 2026:** de los 6 perfumes que el usuario tiene para decantar, solo "Hawas For Him Malibu" (aparece como "Rasari Hawas Malibu" en el proveedor) coincidió con el catálogo vigente. Los otros 5 (Afnan 9pm Night Out, Armaf Club de Nuit Urban Man Elixir, Lattafa Pride Art of Universe, Hawas Fire, Armaf Dunescape Dubai) están marcados "Agotado" porque el proveedor no los tiene con esos nombres ahora mismo — puede que reaparezcan solos si el proveedor los repone, o que haya que ajustar el `matchPattern` en `decant-registry.json` si en realidad están con otro nombre.
- **Precio de decant: se calcula pero NO se muestra en el sitio (Agosto 2026, pedido explícito del usuario).** El usuario prefiere variarlo el mismo por WhatsApp según el cliente, no fijarlo en la web. `decantPrice`/`DECANT_DEFAULT_PRICE` (`{ arabe: 5, disenador: 7, nicho: 12 }`) se siguen calculando y quedan guardados en `catalogo.js` por si se necesitan después (ej. si arma los combos de TikTok que mencionó — "3 decants por $15" — eso es una función aparte, no implementada), pero `script.js` ya no los pinta en ningún lado. Si se vuelve a pedir mostrar precio de decant, es solo tocar `renderCard()` en `script.js`, el dato ya existe.
- **Fotos con logo del proveedor (detección automática, Agosto 2026):** el usuario mostró capturas con 2 variantes de marca de agua que Nestor Parfum le pega a algunas fotos (insignia chica abajo-izquierda, o cinta diagonal grande abajo-derecha) — ambas comparten el mismo eslogan fijo arriba de la foto: **"EL PERFUME QUE MARCA TU ESENCIA"**. `scripts/detect-watermarks.js` (parte de `npm run sync-catalog`, corre después del scraping) descarga cada foto, recorta el 10% superior, lo agranda 3x y le hace OCR (con `tesseract.js`) buscando las palabras "PERFUME" y "MARCA" — si aparecen, marca `item.watermark = true` en `nestor-parfum-raw.json`. `build-catalog.js` deja `image: ''` para esos casos (queda sin foto, no la del proveedor). Validado contra los ejemplos reales que dio el usuario + una corrida completa sobre las ~1600 fotos: **112 marcadas (~7%)**, ~256ms por foto con 4 workers en paralelo (~3-4 min extra en cada corrida del scraping). No es 100% infalible (OCR), pero el fallo seguro es no detectar una marca de agua rara vez, nunca al revés (no debería borrar fotos limpias por error, ya que "PERFUME"+"MARCA" juntos en el 10% superior es un texto muy específico del eslogan).
  - `scripts/photo-overrides.json` sigue disponible para casos puntuales: `"hide"` para ocultar una foto específica a mano (si el detector se equivoca), `"replace"` para poner una foto propia del usuario en `assets/productos/` en vez de la del proveedor (para cualquier producto, no solo los marcados con watermark).
  - Si el proveedor cambia su eslogan o el estilo de marca de agua, hay que ajustar las palabras clave (`PERFUME`/`MARCA`) en `detect-watermarks.js`.

Cada tarjeta del grid unificado muestra foto (del proveedor, o vacía si está agotado o si `photo-overrides.json` la oculta), categoría, nombre, género/tamaño (o "Decant disponible · {tamaño}" si está agotado), nota "similar a X" si aplica (con altura reservada aunque no haya nota, para que todas las tarjetas de una fila midan igual), precio (USD con fondo verde sólido + BCV con chip dorado claro, o las insignias "Agotado"/"Disponible en decant" sin precio si aplica), y botón de WhatsApp — todo generado dinámicamente en `script.js`.

**Paginación (Agosto 2026):** antes usaba un botón "Mostrar más" que iba acumulando tarjetas (con ~870 productos, buscar algo podía dejar una página kilométrica y el footer quedaba inalcanzable). El usuario pidió paginación real: **6 por página (2 filas × 3 columnas)**, con botones Anterior/Siguiente (`#catPrev`/`#catNext`) y contador "Página X de Y" (`#catPageInfo`). Cambiar de filtro o buscar siempre resetea a la página 1 (`catPage = 1`). Al cambiar de página hace scroll suave hasta el inicio de la sección `#catalogo` (`goToCatPage()` en `script.js`) para que el usuario vea las tarjetas nuevas sin tener que buscar dónde quedó. La constante `CAT_PAGE_SIZE` en `script.js` controla cuántas se muestran por página — subirla no rompe nada, el grid ya es responsive (3 columnas desktop, 2 tablet, 1 mobile).

**Origen de los datos y auto-sync (Agosto 2026):** el catálogo del proveedor (`vercatalogo.com/nestor_parfum/products/by-all/all`) es un sitio Angular que carga los productos por lotes al hacer click en "Ver mas", con fotos en lazy-load. Un GitHub Action programado (`.github/workflows/sync-catalog.yml`, corre todos los días a las 9am hora Venezuela + se puede disparar a mano desde la pestaña Actions del repo) usa Playwright (`scripts/scrape-catalog.js`) para abrir esa página con un navegador real, clickear "Ver mas" hasta cargar todo, hacer scroll para disparar el lazy-load de fotos, y extraer título + precio + BCV + código único de producto + URL de foto de cada `.card`. Con eso regenera `scripts/nestor-parfum-raw.json`, corre `scripts/detect-watermarks.js` (marca las fotos con logo del proveedor, ver abajo) y luego `scripts/build-catalog.js`, que aplica la fórmula de precio y filtros de marca (ver abajo) y reescribe `assets/data/catalogo.js`. Si algo cambió, el workflow hace commit y push directo a `main`, lo que dispara el deploy automático de Vercel — es decir, el sitio se actualiza solo, sin que nadie tenga que correr nada a mano.
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

## Cómo agregar/quitar un perfume disponible para decant

**No se edita HTML ni JS, ni se necesita foto propia.** Se agrega un objeto a `scripts/decant-registry.json`:

```json
{
  "matchPattern": "MARCA.*NOMBRE.*DEL.*PERFUME",
  "displayName": "Marca Nombre Del Perfume",
  "category": "arabe",
  "decantSize": "10 ML",
  "decantPrice": 5
}
```

- `matchPattern`: regex case-insensitive para reconocer el producto en el título crudo del proveedor (ej. `"LATTAFA SHEIKH AL SHUYUKH FINAL EDITION EAU DE PARFUM"`). Mientras más específico, mejor — evita que matchee un producto distinto por accidente. Si no estás seguro del texto exacto, revisar `scripts/nestor-parfum-raw.json` después del último scraping.
- `displayName`: como se muestra en el sitio **solo si el proveedor no lo tiene** (estado "Agotado"). Si el proveedor sí lo tiene, se usa el nombre real del proveedor (ya title-cased).
- `category`: `arabe` | `disenador` | `nicho` (no aplica `estuche` para decants).
- `decantSize`: texto libre, ej. `"10 ML"`.
- `decantPrice`: opcional — si se omite, usa el default de la categoría (`DECANT_DEFAULT_PRICE` en `build-catalog.js`).

Después de editar el archivo hay que volver a correr `node scripts/build-catalog.js` (o esperar la próxima corrida automática) para que se refleje. Para quitar un perfume de decant disponible, simplemente se borra su entrada del JSON — si el producto sigue en el catálogo del proveedor, vuelve a mostrarse normal, sin insignia.

Para el resto del catálogo (proveedor, sin decant), tampoco se edita a mano — corre solo todos los días (ver sección de auto-sync arriba). Si hay que ajustar qué marcas entran, se edita `scripts/build-catalog.js`.
