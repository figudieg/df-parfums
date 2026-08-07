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
