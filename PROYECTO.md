# DF Parfums — Estado del proyecto

Este archivo es para que retomes el proyecto en otra sesión de Claude (ej. en casa) sin perder contexto. Léelo completo antes de seguir trabajando.

## El negocio

- **Marca:** DF Parfums
- **Qué venden:** Perfumes 100% originales, árabes de nicho y de diseñador
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
    catalogo.js → catálogo completo (600 productos) generado desde el proveedor, ver abajo
scripts/
  build-catalog.js         → script que genera assets/data/catalogo.js a partir del raw scrapeado
  nestor-parfum-raw.json   → datos crudos scrapeados del proveedor (nombre + 2 precios por producto)
  catalog-curated.json     → resultado curado (los mismos 600 que terminan en el sitio), para inspección
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

## Catálogo completo (600 productos, conectado con el proveedor)

Sección nueva (`#catalogo-mayor`) debajo del catálogo destacado: buscador + filtros por categoría (Árabe de nicho / Diseñador / Estuches / Todos) + grid paginado de 30 en 30 ("Mostrar más"). Cada tarjeta (`.mini-card`, sin foto ni modal) muestra nombre, género/tamaño, nota "similar a X" si aplica, ambos precios, y botón directo a WhatsApp con mensaje pre-armado por producto — todo generado dinámicamente en `script.js` a partir de `window.CATALOGO_NESTOR` (definido en `assets/data/catalogo.js`).

**Origen de los datos:** se scrapeó el catálogo público de `vercatalogo.com/nestor_parfum/products/by-all/all` (936 productos en total al momento de scrapear, Agosto 2026). El usuario pidió una **selección curada**, no el catálogo completo, porque incluye de todo (perfumes de niños, testers, splash, marcas genéricas de imitación baratas) y eso no calza con el posicionamiento "árabes de nicho y de diseñador". `scripts/build-catalog.js` filtra por listas de marcas (`ARABE_BRANDS`, `DESIGNER_BRANDS`, `EXCLUDE_BRANDS`) y patrones de título (excluye `TESTER`, `SPLASH`, niños) — quedaron 600 de 876 productos únicos. Si el usuario pide agregar algo que quedó afuera (ej. decants de nicho occidental tipo Xerjoff/Mancera, o alguna marca específica), hay que editar esas listas en `build-catalog.js` y volver a correrlo (`node scripts/build-catalog.js` desde la raíz del repo).

**Fórmula de precio confirmada por el usuario (Agosto 2026, la más reciente — reemplaza cualquier fórmula anterior):**
- El precio que aparece en la página del proveedor ya tiene incluido un 10% de descuento mayorista → costo real = precio_página × 0.90.
- Ganancia del usuario: 25% sobre ese costo real → precio final = costo_real × 1.25.
- **En una sola fórmula: precio final = precio_página × 1.125**
- Esto se aplica **por separado a los dos precios reales que muestra la página** (el precio en $ y el precio "(BCV)"). El tercer número que aparece tachado en la página del proveedor (precio de lista/sugerido) **se ignora por completo**, el usuario dijo explícitamente que "es nulo para nosotros".
- "Divisas" y "Efectivo" son lo mismo para el usuario (un solo precio, más barato). El precio BCV es más alto (pago en bolívares a tasa BCV).
- Nota: esta fórmula (25% de ganancia) es DISTINTA a la que se usó una vez antes para los 6 productos destacados (esa fue 20%, y además el usuario terminó fijando esos 6 a mano). Si el usuario pide recalcular los 6 destacados con la fórmula nueva, avisar que actualmente NO siguen ninguna fórmula automática.

**Limitación conocida — sin fotos para los 600:** en este entorno, el navegador usado para scrapear tiene un bug/limitación donde la pestaña queda marcada como "oculta" (`document.hidden = true`) incluso estando activa, lo que bloquea la carga de imágenes con lazy-load de terceros (el catálogo del proveedor usa un directivo Angular custom de lazy-load que respeta visibilidad de página). Por eso el catálogo completo no tiene fotos — el usuario aceptó explícitamente que estos 600 vayan sin foto por ahora. Si en otra sesión el entorno no tiene ese problema, se podría reintentar capturar las imágenes (selector: `.card img` dentro de cada `.card` en la página del proveedor) y agregarlas al `catalogo.js`.

## Pendientes / próximos pasos

1. **Precio BCV de Armaf Club de Nuit Urban Man Elixir** (uno de los 6 destacados) — el usuario nunca lo dio, solo el precio en divisas ($55,08).
2. **Fotos del catálogo completo (600 productos)** — ver limitación arriba. Pendiente si el usuario consigue las fotos por su cuenta o si se reintenta el scraping en un entorno sin el bug de visibilidad.
3. **Categorías que quedaron afuera a propósito:** testers, splash, perfumes de niños, marcas de imitación baratas (New Brand, Cuba, Fraglux, Macarena, etc.), y decants/nicho occidental (Xerjoff, Mancera, Creed decants sueltos). Si el usuario los quiere después, están en `scripts/catalog-unclassified.json` (gitignored, hay que re-correr el scraping) o simplemente se amplían las listas de marcas en `build-catalog.js`.
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
