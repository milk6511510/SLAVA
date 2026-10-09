const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
}

const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
}, { passive: true });

const productData = {
  long: {
    index: 'SLAVA / 01',
    name: 'Long',
    main: 'assets/product/slava-long-oak.jpg',
    detail: 'assets/product/slava-brass-carbon.jpg',
    alt: 'SLAVA 長方形木製音色增幅產品，搭配黃銅圓盤與碳纖維圓片',
    detailAlt: 'SLAVA 長方款產品頂部的黃銅與碳纖維細節',
    copy: '延伸琴身的水平線條，把天然木材、黃銅與碳纖維放進一個可攜式的聲音物件裡。適合從日常練習開始，慢慢找到自己的聽感。',
    form: 'Rectangle',
    material: 'Oak / Brass / Carbon',
    stamp: '01'
  },
  round: {
    index: 'SLAVA / 02',
    name: 'Round',
    main: 'assets/product/slava-walnut-round.jpg',
    detail: 'assets/product/slava-case.jpg',
    alt: 'SLAVA 圓形核桃木音色增幅產品，搭配黃銅核心與碳纖維環',
    detailAlt: 'SLAVA 圓形款產品放置在黑色收納盒中',
    copy: '以圓形為起點，讓木材的紋理、黃銅的重量與碳纖維的深色形成一個更集中、更像物件的聲音核心。',
    form: 'Round',
    material: 'Walnut / Brass / Carbon',
    stamp: '02'
  }
};

const productButtons = document.querySelectorAll('.switch-button');
const mainImage = document.querySelector('#product-main-image');
const detailImage = document.querySelector('#product-detail-image');
const productIndex = document.querySelector('#product-index');
const productName = document.querySelector('#product-name');
const productCopy = document.querySelector('#product-copy');
const productForm = document.querySelector('#product-form');
const productMaterial = document.querySelector('#product-material');
const productStamp = document.querySelector('#product-stamp');

function selectProduct(key) {
  const product = productData[key];
  if (!product) return;
  productButtons.forEach((button) => {
    const active = button.dataset.product === key;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  mainImage.src = product.main;
  mainImage.alt = product.alt;
  detailImage.src = product.detail;
  detailImage.alt = product.detailAlt;
  productIndex.textContent = product.index;
  productName.textContent = product.name;
  productCopy.textContent = product.copy;
  productForm.textContent = product.form;
  productMaterial.textContent = product.material;
  productStamp.textContent = product.stamp;
}

productButtons.forEach((button) => {
  button.addEventListener('click', () => selectProduct(button.dataset.product));
});

const form = document.querySelector('#signup-form');
const note = document.querySelector('#form-note');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = new FormData(form).get('email');
  if (!email) return;
  note.textContent = '已收到你的意願。正式串接後，這裡會送出募資通知確認信。';
  note.classList.add('success');
  form.reset();
});

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
}

document.querySelectorAll('.gallery-tile').forEach((tile) => {
  tile.addEventListener('click', () => {
    lightboxImage.src = tile.dataset.lightboxSrc;
    lightboxImage.alt = tile.dataset.lightboxAlt;
    lightboxCaption.textContent = tile.dataset.lightboxAlt;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
});
