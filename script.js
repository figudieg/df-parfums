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

const modal = document.getElementById('productModal');
const modalImg = document.getElementById('modalImg');
const modalBrand = document.getElementById('modalBrand');
const modalName = document.getElementById('modalName');
const modalSize = document.getElementById('modalSize');
const modalDesc = document.getElementById('modalDesc');
const modalPriceUsd = document.getElementById('modalPriceUsd');
const modalPriceBcv = document.getElementById('modalPriceBcv');
const modalDecant = document.getElementById('modalDecant');
const modalWhatsapp = document.getElementById('modalWhatsapp');

function openModal(card) {
  modalImg.src = card.dataset.img;
  modalImg.alt = card.dataset.name;
  modalBrand.textContent = card.dataset.brand;
  modalName.textContent = card.dataset.name;
  modalSize.textContent = card.dataset.size;
  modalDesc.textContent = card.dataset.desc;
  modalPriceUsd.textContent = card.dataset.priceUsd ? card.dataset.priceUsd + ' Divisas/Efectivo' : '';
  modalPriceBcv.textContent = card.dataset.priceBcv ? card.dataset.priceBcv + ' BCV' : '';
  modalPriceBcv.style.display = card.dataset.priceBcv ? '' : 'none';
  modalDecant.style.display = card.dataset.decant === 'true' ? '' : 'none';
  modalWhatsapp.href = card.dataset.wa;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.product-card').forEach((card) => {
  card.addEventListener('click', () => openModal(card));
});

document.getElementById('modalClose').addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ---------- Catalogo mayor (full inventory from Nestor Parfum) ----------
const WA_NUMBER = '584121985211';
const catalogoNestor = window.CATALOGO_NESTOR || [];
let catFilter = 'all';
let catSearch = '';
let catVisible = 30;
const CAT_BATCH = 30;

function fmtPrice(n) {
  return Number.isInteger(n) ? '$' + n : '$' + n.toFixed(2);
}

function buildCatWaLink(item) {
  const parts = [item.name];
  if (item.size) parts.push(item.size);
  const msg = `Hola, estoy interesado en ${parts.join(' ')}. Quiero más información.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function getFilteredCatalogo() {
  return catalogoNestor.filter((item) => {
    if (catFilter !== 'all' && item.category !== catFilter) return false;
    if (catSearch && !item.name.toLowerCase().includes(catSearch)) return false;
    return true;
  });
}

function renderMiniGrid() {
  const grid = document.getElementById('miniGrid');
  const countEl = document.getElementById('catCount');
  const loadMoreBtn = document.getElementById('catLoadMore');
  if (!grid) return;

  const filtered = getFilteredCatalogo();
  const toShow = filtered.slice(0, catVisible);

  if (toShow.length === 0) {
    grid.innerHTML = '<p class="cat-empty">No encontramos fragancias con ese criterio. Prueba con otro término o categoría.</p>';
  } else {
    grid.innerHTML = toShow.map((item) => `
      <div class="mini-card">
        ${item.image ? `<div class="mini-card-photo"><img src="${item.image}" alt="${item.name}" loading="lazy"></div>` : ''}
        <div class="mini-card-top">
          <span class="mini-card-category">${item.categoryLabel}</span>
        </div>
        <h4>${item.name}</h4>
        <div class="mini-card-meta">${[item.genero, item.size].filter(Boolean).join(' · ')}</div>
        ${item.note ? `<div class="mini-card-note">${item.note}</div>` : ''}
        <div class="mini-card-prices">
          <span class="price-usd">${fmtPrice(item.priceUsd)} <em>Divisas</em></span>
          <span class="price-bcv">${fmtPrice(item.priceBcv)} <em>BCV</em></span>
        </div>
        <a class="mini-card-wa" href="${buildCatWaLink(item)}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.001 2c-5.514 0-9.999 4.486-9.999 10 0 1.763.462 3.483 1.34 4.997L2 22l5.146-1.35A9.958 9.958 0 0 0 12.001 22C17.514 22 22 17.514 22 12S17.514 2 12.001 2zm0 18.06a8.03 8.03 0 0 1-4.096-1.122l-.294-.175-3.055.801.816-2.978-.192-.306a8.02 8.02 0 0 1-1.239-4.28c0-4.44 3.615-8.055 8.06-8.055 4.444 0 8.058 3.614 8.058 8.055 0 4.44-3.614 8.06-8.058 8.06z"/></svg>
          Consultar
        </a>
      </div>
    `).join('');
  }

  if (countEl) countEl.textContent = `Mostrando ${toShow.length} de ${filtered.length} fragancias`;
  if (loadMoreBtn) loadMoreBtn.style.display = catVisible < filtered.length ? '' : 'none';
}

if (catalogoNestor.length) {
  document.querySelectorAll('.cat-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      catFilter = btn.dataset.cat;
      catVisible = CAT_BATCH;
      renderMiniGrid();
    });
  });

  const catSearchInput = document.getElementById('catSearch');
  if (catSearchInput) {
    catSearchInput.addEventListener('input', () => {
      catSearch = catSearchInput.value.trim().toLowerCase();
      catVisible = CAT_BATCH;
      renderMiniGrid();
    });
  }

  const catLoadMoreBtn = document.getElementById('catLoadMore');
  if (catLoadMoreBtn) {
    catLoadMoreBtn.addEventListener('click', () => {
      catVisible += CAT_BATCH;
      renderMiniGrid();
    });
  }

  renderMiniGrid();
}
