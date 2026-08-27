const navPill = document.getElementById('navPill');
const revealEls = document.querySelectorAll('.reveal');

function onScroll() {
  if (window.scrollY > 20) {
    navPill.classList.add('scrolled');
  } else {
    navPill.classList.remove('scrolled');
  }

  const windowHeight = window.innerHeight;
  revealEls.forEach((el) => {
    const top = el.getBoundingClientRect().top;
    if (top < windowHeight - 120) {
      el.classList.add('active');
    }
  });
}

window.addEventListener('scroll', onScroll);
window.addEventListener('load', onScroll);

document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Modo oscuro / claro (oscuro es el predeterminado) ----------
const THEME_KEY = 'df-theme';
const themeToggleBtn = document.getElementById('themeToggle');

function isDarkActive() {
  return localStorage.getItem(THEME_KEY) !== 'light';
}

function syncThemeToggleIcon() {
  if (!themeToggleBtn) return;
  const dark = isDarkActive();
  themeToggleBtn.classList.toggle('is-dark', dark);
  themeToggleBtn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

syncThemeToggleIcon();

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const goingLight = isDarkActive();
    localStorage.setItem(THEME_KEY, goingLight ? 'light' : 'dark');
    if (goingLight) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    syncThemeToggleIcon();
  });
}

// ---------- Catalogo (proveedor + insignia de decant cuando aplica) ----------
const WA_NUMBER = '584121985211';
const allProducts = window.CATALOGO_NESTOR || [];
let catFilter = 'all';
let catSearch = '';
let catPage = 1;
const CAT_PAGE_SIZE = 6;

function fmtPrice(n) {
  if (n == null) return '';
  return Number.isInteger(n) ? '$' + n : '$' + n.toFixed(2);
}

function buildCatWaLink(item) {
  if (item.decant && item.agotado) {
    const size = item.decantSize ? ` (${item.decantSize})` : '';
    const msg = `Hola, quiero consultar el decant de ${item.name}${size}. ¿Está disponible?`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  }
  const parts = [item.name];
  if (item.size) parts.push(item.size);
  const msg = `Hola, estoy interesado en ${parts.join(' ')}. Quiero más información.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function getFilteredCatalogo() {
  return allProducts
    .filter((item) => {
      if (catFilter === 'decant' && !item.decant) return false;
      if (catFilter !== 'all' && catFilter !== 'decant' && item.category !== catFilter) return false;
      if (catSearch && !item.name.toLowerCase().includes(catSearch)) return false;
      return true;
    })
    .sort((a, b) => (b.decant ? 1 : 0) - (a.decant ? 1 : 0));
}

function renderCard(item) {
  const metaText = item.agotado
    ? `Decant disponible · ${item.decantSize}`
    : [item.genero, item.size].filter(Boolean).join(' · ');

  const pricesHtml = item.agotado
    ? `
      <span class="badge-agotado">Agotado</span>
      <span class="badge-decant-available">Disponible en decant</span>
    `
    : `
      <span class="price-usd">${fmtPrice(item.priceUsd)} <em>Divisas</em></span>
      ${item.priceBcv != null ? `<span class="price-bcv">${fmtPrice(item.priceBcv)} <em>BCV</em></span>` : ''}
    `;

  return `
    <div class="mini-card${item.decant ? ' mini-card-decant' : ''}">
      <div class="mini-card-photo">
        ${item.image ? `
          <img src="${item.image}" alt="${item.name}" loading="lazy">
          <span class="photo-mask photo-mask-bl"></span>
          <span class="photo-mask photo-mask-br"></span>
        ` : ''}
      </div>
      <div class="mini-card-body">
        <div class="mini-card-top">
          <span class="mini-card-category">${item.categoryLabel}</span>
          ${item.decant ? '<span class="mini-card-decant-badge">Decant</span>' : ''}
        </div>
        <h4>${item.name}</h4>
        <div class="mini-card-meta">${metaText}</div>
        <div class="mini-card-note">${item.note || ''}</div>
      </div>
      <div class="mini-card-prices">${pricesHtml}</div>
      ${item.decant && !item.agotado ? '<div class="mini-card-decant-extra">+ Disponible en decant</div>' : ''}
      <a class="mini-card-wa" href="${buildCatWaLink(item)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.001 2c-5.514 0-9.999 4.486-9.999 10 0 1.763.462 3.483 1.34 4.997L2 22l5.146-1.35A9.958 9.958 0 0 0 12.001 22C17.514 22 22 17.514 22 12S17.514 2 12.001 2zm0 18.06a8.03 8.03 0 0 1-4.096-1.122l-.294-.175-3.055.801.816-2.978-.192-.306a8.02 8.02 0 0 1-1.239-4.28c0-4.44 3.615-8.055 8.06-8.055 4.444 0 8.058 3.614 8.058 8.055 0 4.44-3.614 8.06-8.058 8.06z"/></svg>
        ${item.agotado ? 'Consultar decant' : 'Consultar'}
      </a>
    </div>
  `;
}

function renderMiniGrid() {
  const grid = document.getElementById('miniGrid');
  const countEl = document.getElementById('catCount');
  const prevBtn = document.getElementById('catPrev');
  const nextBtn = document.getElementById('catNext');
  const pageInfo = document.getElementById('catPageInfo');
  if (!grid) return;

  const filtered = getFilteredCatalogo();
  const totalPages = Math.max(1, Math.ceil(filtered.length / CAT_PAGE_SIZE));
  if (catPage > totalPages) catPage = totalPages;
  const start = (catPage - 1) * CAT_PAGE_SIZE;
  const toShow = filtered.slice(start, start + CAT_PAGE_SIZE);

  grid.innerHTML = toShow.length === 0
    ? '<p class="cat-empty">No encontramos fragancias con ese criterio. Prueba con otro término o categoría.</p>'
    : toShow.map(renderCard).join('');

  if (countEl) {
    countEl.textContent = filtered.length
      ? `Mostrando ${start + 1}–${start + toShow.length} de ${filtered.length} fragancias`
      : '';
  }
  if (pageInfo) pageInfo.textContent = `Página ${catPage} de ${totalPages}`;
  if (prevBtn) prevBtn.disabled = catPage <= 1;
  if (nextBtn) nextBtn.disabled = catPage >= totalPages;
}

function goToCatPage(page) {
  catPage = page;
  renderMiniGrid();
  const section = document.getElementById('catalogo');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (allProducts.length) {
  document.querySelectorAll('.cat-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      catFilter = btn.dataset.cat;
      catPage = 1;
      renderMiniGrid();
    });
  });

  const catSearchInput = document.getElementById('catSearch');
  if (catSearchInput) {
    catSearchInput.addEventListener('input', () => {
      catSearch = catSearchInput.value.trim().toLowerCase();
      catPage = 1;
      renderMiniGrid();
    });
  }

  const catPrevBtn = document.getElementById('catPrev');
  if (catPrevBtn) {
    catPrevBtn.addEventListener('click', () => {
      if (catPage > 1) goToCatPage(catPage - 1);
    });
  }

  const catNextBtn = document.getElementById('catNext');
  if (catNextBtn) {
    catNextBtn.addEventListener('click', () => {
      const filtered = getFilteredCatalogo();
      const totalPages = Math.max(1, Math.ceil(filtered.length / CAT_PAGE_SIZE));
      if (catPage < totalPages) goToCatPage(catPage + 1);
    });
  }

  renderMiniGrid();
}
