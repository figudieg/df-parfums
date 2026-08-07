# DF Parfums — Estado del proyecto

Este archivo es para que retomes el proyecto en otra sesión de Claude (ej. en casa) sin perder contexto. Léelo completo antes de seguir trabajando.

## El negocio

- **Marca:** DF Parfums
- **Qué venden:** Perfumes 100% originales, árabes de nicho y de diseñador
- **Modelo:** Tienda online, todo el proceso de venta es por WhatsApp (sin carrito ni pagos en el sitio)
- **Ubicación:** Miranda, Venezuela (Guarenas, Guatire) — entregas en persona en Caracas, envíos a nivel nacional
- **Emprendimiento desde casa**, el enfoque de marketing es contenido en TikTok e Instagram (@dfparfums.ve)
- **WhatsApp:** 0412-1985211 (formato internacional usado en el código: `584121985211`)

## Stack técnico

Sitio 100% estático, sin frameworks ni build:

```
index.html    → toda la estructura (hero, catálogo, modal, footer)
styles.css    → estilos
script.js     → scroll/reveal, modal de producto, año del footer
server.js     → servidor local Node puro (sin dependencias) para desarrollo
assets/
  logo/       → logo.jpg (original), logo-white-nav.png (letras blancas, para el nav verde), logo-video.MP4
  productos/  → 6 fotos de producto (1 a 6, nombradas por producto)
.claude/launch.json → config para que el preview de Claude Code levante server.js en localhost:5500
```

**Importante:** en este entorno no hay acceso a internet para `npm`/`npx`, por eso el servidor de desarrollo es `server.js` (Node nativo, sin `express` ni `serve`). Si en la otra sesión sí hay internet, no hace falta cambiar nada, `node server.js` sigue funcionando igual.

Para levantar el sitio localmente: `node server.js` (sirve en `http://localhost:5500`), o dejar que Claude Code lo haga automático vía el preview (`.claude/launch.json` ya está configurado).

## Diseño

- **Paleta:** verde botella (`--green-deep: #12352A`) + crema (`--cream: #FAF6EC`) + dorado como acento (`--gold: #B8965F`), tomados del logo real de la marca.
- **Tipografía:** Playfair Display (títulos) + Inter (texto), vía Google Fonts.
- **Nav:** pill flotante verde con blur, con el logo mostrando solo las letras "DF parfums" en blanco (el fondo del logo se hizo transparente con un truco de canvas en el navegador: se cargó el logo.jpg, se convirtió a alpha-mask por luminancia y se exportó como PNG con letras blancas sobre transparente — ese es `logo-white-nav.png`). El botón de WhatsApp del nav es blanco con letras verdes.
- **Hero:** una sola columna centrada (logo/video arriba, texto abajo, botones). Se probó un layout de grid en dos columnas (texto izquierda, logo derecha) y también secciones alternadas verde/blanco en toda la página, pero **el usuario pidió revertir todo eso** — solo se quedó el cambio de color del nav. No reintentar el grid de dos columnas ni las secciones alternadas a menos que el usuario lo pida de nuevo explícitamente.
- El video del logo (`logo-video.MP4`) tiene su propio fondo "quemado" en el video (textura de papel gris-crema) — no se puede recolorear con CSS, solo se igualó el fondo del contenedor al crema de la página para que combine lo mejor posible.

## Catálogo actual (6 productos)

Cada tarjeta de producto es un `<button class="product-card">` con `data-*` attributes que alimentan un **modal de detalle** (foto grande, descripción, precios, botón de WhatsApp con mensaje predefinido). El modal se abre con JS (`script.js`, funciones `openModal`/`closeModal`), no hay navegación de página.

| Producto | Precio Divisas/Efectivo | Precio BCV | Decant |
|---|---|---|---|
| AFNAN 9pm Night Out | $65 | $80 | Sí |
| Armaf Club de Nuit Urban Man Elixir | $55,08 | *(sin definir — ver pendientes)* | Sí |
| Lattafa Pride Art of Universe | $70 | $80 | Sí |
| Hawas For Him — Fire | $65 | $80 | Sí |
| Hawas For Him — Malibu | $60 | $75 | Sí |
| Armaf Dunescape Dubai | $55 | $65 | Sí |

Todos estos precios fueron **fijados manualmente por el usuario** (no siguen ninguna fórmula — son sus precios finales de venta).

## Proveedor y fórmula de precio (para productos nuevos que SÍ se calculen, no se fijen a mano)

- Proveedor: **vercatalogo.com/nestor_parfum** — catálogo de +200 productos (marcas: Lattafa, Armaf, Afnan, Rasasi/Hawas, más diseñador tipo Valentino, Hugo Boss, etc.)
- El precio que aparece en la página del proveedor (ej. "$41,00") **ya tiene un 10% de descuento** que el usuario obtiene como comprador mayorista.
- **Fórmula confirmada por el usuario:** costo real = precio_página × 0.90. Precio de venta final = costo_real × 1.20 (su ganancia del 20%).
  - Es decir: **precio final = precio_página × 1.08**
- OJO: esta fórmula se usó para calcular precios iniciales de referencia, pero el usuario luego **sobrescribió esos precios con sus propios números manuales** (ver tabla arriba) que incluyen precio en BCV y en divisas por separado. Para productos nuevos, hay que preguntarle si quiere que se calcule con la fórmula o si él va a dar el precio final directamente (parece preferir dar el precio final él mismo).
- "Divisas" y "Efectivo" son lo mismo para el usuario (un solo precio). El precio BCV es más alto (pago en bolívares a tasa BCV).

## Pendientes / próximos pasos

1. **Precio BCV de Armaf Club de Nuit Urban Man Elixir** — el usuario no lo dio, solo quedó el precio en divisas ($55,08). Preguntarle o dejarlo así.
2. **Agregar más productos** — el usuario quiere sumar productos que están en el catálogo del proveedor (vercatalogo.com/nestor_parfum). Confirmó que prefiere que Claude los busque y monte manualmente (el sitio es estático, no hay CMS). Falta que el usuario diga:
   - Qué productos exactos quiere agregar (nombres, o una categoría del catálogo del proveedor)
   - De dónde salen las fotos: ¿usar las fotos del catálogo del proveedor, o el usuario va a tomar sus propias fotos (como hizo con los 6 actuales, estilo "mano sosteniendo la caja con planta de fondo")?
3. **Nota sobre inventario:** el usuario mencionó que el proveedor tiene inventario limitado que se agota y no siempre repone — no es urgente reflejar esto en el sitio, pero tenerlo en cuenta si se agregan productos (podrían dejar de estar disponibles).
4. **Despliegue:** el sitio todavía NO está publicado. El plan (igual que en el proyecto anterior de TB2022) es: subir a GitHub → conectar con Vercel → auto-deploy. Esto no se ha hecho todavía.
5. Cuando falten precios de un producto nuevo, dejar `data-price-usd="Consultar precio"` y `data-price-bcv=""` en vez de inventar un número.

## Cómo están armadas las tarjetas de producto (para copiar el patrón)

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

Si no hay precio BCV, se omite el `<span class="price-bcv">` (el JS del modal ya maneja el caso de `data-price-bcv=""` vacío ocultando esa línea).
