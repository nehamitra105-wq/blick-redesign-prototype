/* Blick prototype — interactions mirror the Figma prototype flow:
   home → search → product (set / individual) → cart drawer (normal / ship / pickup)
   → arrange pickup → picking order (3s) → order ready (2s) → notification → email */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2);

const state = {
  storeSet: false,
  variant: 'set',
  mode: 'none',            // cart delivery mode: none | ship | pickup
  timers: [],
  cart: [
    { id: 'tsq', name: 'Art Alternatives Stainless Steel T-Squares', img: 'assets/cart-tsquare.png', cover: true, list: 38.99, price: 27.33, qty: 1 }
  ]
};
const GOUACHE = { id: 'set', name: 'Acrylic gouache, 12 pc set', sub: '20 ml tubes', img: 'assets/cart-set.png', list: 44.99, price: 32.99, qty: 1 };

/* ---------- Static content ---------- */
const avail = [
  ['avail-1.png', 'Liquitex Basics Acrylic Paint Set,<br>12 Colors', '$19.99', '$28.50'],
  ['avail-2.png', 'Winsor &amp; Newton Cotman<br>Watercolor Pocket Set', '$22.49', '$34.99'],
  ['avail-3.png', 'Blick Premier Stretched Cotton<br>Canvas, 16 × 20 in', '$14.49', '$21.89'],
  ['avail-4.png', 'Faber-Castell Pitt Artist Pens,<br>Set of 4', '$9.99', '$13.99'],
  ['avail-5.png', 'Strathmore 400 Series Sketch<br>Pad, 9 × 12 in', '$8.29', '$12.25']
];
$('#availGrid').innerHTML = avail.map(([img, n, p, l]) => `
  <div class="avail"><div class="ph"><img src="assets/${img}" alt=""></div>
  <div class="nm">${n}</div>
  <div class="price-row"><span class="price-red">${p}</span><span class="strike">${l}</span></div>
  <span class="pill-green">In stock today</span></div>`).join('');

const filterSets = [
  ['Availability', [['In stock at Savannah', 18, 1], ['Online only', 42], ['Ships free', 36], ['Pick up today', 18]]],
  ['Size', [['12 ml', 8], ['20 ml', 31], ['40 ml', 14], ['Sets', 9]]],
  ['Brand', [['Holbein', 54, 1], ['Turner', 22], ['Liquitex', 17], ['Winsor &amp; Newton', 12]]],
  ['Price', [['Under $10', 29], ['$10 – $25', 13], ['$25 – $50', 7], ['Over $50', 5]]],
  ['Surface', [['Paper', 48], ['Canvas', 40], ['Wood panel', 33], ['Illustration board', 21]]]
];
$('#filters').innerHTML = '<h2>Filters</h2>' + filterSets.map(([lg, opts], i) => `
  <div class="fs${i === filterSets.length - 1 ? ' last' : ''}"><div class="lg">${lg}</div>
  ${opts.map(([l, c, on]) => `<div class="fopt${on ? ' on' : ''}"><span class="box"></span><span class="lbl">${l}</span><span class="ct">${c}</span></div>`).join('')}
  </div>`).join('') + '<button class="clear-all" id="clearAll">Clear all</button>';
$$('.fopt').forEach(o => o.addEventListener('click', () => o.classList.toggle('on')));
$('#clearAll').addEventListener('click', () => $$('.fopt').forEach(o => o.classList.remove('on')));

const sr = [
  ['sr-white.png', 'Holbein Acrylic Gouache, 40 ml,<br>Titanium White', '$8.49', '$11.79', 1],
  ['sr-red.png', 'Holbein Acrylic Gouache, 20 ml,<br>Cadmium Red Light', '$9.99', '$13.79', 1],
  ['sr-24set.png', 'Holbein Acrylic Gouache 24-Color Set,<br>12 ml Tubes', '$54.99', '$74.99', 0],
  ['sr-blue.png', 'Holbein Acrylic Gouache, 20 ml,<br>Ultramarine Deep', '$9.99', '$13.79', 1],
  ['sr-yellow.png', 'Holbein Acrylic Gouache, 20 ml,<br>Lemon Yellow', '$9.99', '$13.79', 1]
];
$('#srCards').innerHTML = sr.map(([img, n, p, l, s]) => `
  <div class="rcard"><div class="ph"><img src="assets/${img}" alt=""></div>
  <div class="nm">${n}</div>
  <div class="price-row pr"><span class="price-red">${p}</span><span class="strike">${l}</span></div>
  <div class="stu">Your student price</div>
  <span class="stock${s ? '' : ' no'}">${s ? 'In stock at Savannah · 4 left' : 'Not at Savannah'}</span>
  <div class="ract"><button class="btn-red">Add to cart</button><button class="btn-out">Add to pick up</button></div></div>`).join('');

const rel = [
  ['rel-white.png', 'Holbein Acrylic Gouache, 40 ml, Titanium<br>White', '$8.49', '$11.79'],
  ['rel-red.png', 'Holbein Acrylic Gouache, 20 ml, Cadmium<br>Red Light', '$9.99', '$13.79'],
  ['rel-blue.png', 'Holbein Acrylic Gouache, 20 ml, Ultramarine<br>Deep', '$9.99', '$13.79'],
  ['rel-yellow.png', 'Holbein Acrylic Gouache, 20 ml,<br>Lemon Yellow', '$9.99', '$13.79']
];
$('#relGrid').innerHTML = rel.map(([img, n, p, l]) => `
  <article class="rel"><div class="ph"><img src="assets/${img}" alt=""></div>
  <div class="nm">${n}</div>
  <div class="price-row pr"><span class="price-red">${p}</span><span class="strike">${l}</span></div>
  <div class="tags"><span class="g">4 in store</span><span>12 online</span></div>
  <button class="btn-red">Add to cart</button></article>`).join('');

/* ---------- Navigation ---------- */
function go(screen) {
  if (location.hash.slice(1) !== screen) location.hash = screen; else render();
}
function render() {
  const screen = location.hash.slice(1) || 'home';
  state.timers.forEach(clearTimeout); state.timers = [];
  closeStore(); closeToast(); closeCart(true);
  $$('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === screen));
  document.body.classList.toggle('no-header', screen === 'email');
  // Every screen past home shows the Savannah store and the typed search, as in the design
  const pastHome = screen !== 'home';
  setStoreLabel(state.storeSet || pastHome);
  if (pastHome) $('#searchInput').value = 'Holbein acrylic gouache';
  if (screen === 'product') renderVariant();
  if (screen === 'arrange') renderArrange();
  if (screen === 'status') startStatus();
  if (screen === 'email') syncTotals();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); go(g.dataset.go); }
});

/* ---------- Header ---------- */
$('#promoClose').addEventListener('click', () => $('#promo').classList.add('hidden'));
$('#searchInput').addEventListener('focus', e => { if (!e.target.value) e.target.value = 'Holbein acrylic gouache'; });
$('#searchForm').addEventListener('submit', e => { e.preventDefault(); go('search'); });

function setStoreLabel(selected) {
  state.headerSelected = selected;
  $('#storePin').src = selected ? 'assets/pin-selected.svg' : 'assets/pin.svg';
  $('#storeLabel').innerHTML = selected
    ? '<div class="t1">Savannah, GA</div><div class="t2">10AM - 7PM</div>'
    : '<div class="t1">Select Store</div>';
}

/* Store popover — anchored 56px below the button, shifted 80px left (per prototype overlay offset) */
const pop = $('#storePop');
function openStore() {
  const r = $('#storeBtn').getBoundingClientRect();
  const left = Math.max(8, Math.min(r.left - 80, window.innerWidth - 328));
  pop.style.left = (left + window.scrollX) + 'px';
  pop.style.top = (r.top + window.scrollY + 56) + 'px';
  pop.style.position = 'absolute';
  $('#spSelect').hidden = state.headerSelected;
  $('#spSelected').hidden = !state.headerSelected;
  pop.classList.add('open');
}
function closeStore() { pop.classList.remove('open'); }
$('#storeBtn').addEventListener('click', e => { e.stopPropagation(); pop.classList.contains('open') ? closeStore() : openStore(); });
pop.addEventListener('click', e => e.stopPropagation());
document.addEventListener('click', () => closeStore());
window.addEventListener('scroll', () => { if (pop.classList.contains('open')) openStore(); });
window.addEventListener('resize', () => { if (pop.classList.contains('open')) openStore(); });
$('.dept-next').addEventListener('click', () => { const l = $('.dept-list'); l.scrollLeft = l.scrollLeft + l.clientWidth * 0.6 >= l.scrollWidth - l.clientWidth ? (l.scrollLeft >= l.scrollWidth - l.clientWidth - 2 ? 0 : l.scrollWidth) : l.scrollLeft + l.clientWidth * 0.6; });
$('#setSavannah').addEventListener('click', () => {
  state.storeSet = true; setStoreLabel(true);
  $('#spSelect').hidden = true; $('#spSelected').hidden = false;
});
$('#storeDone').addEventListener('click', closeStore);

/* ---------- Search ---------- */
$('#bestMatch').addEventListener('click', e => {
  if (e.target.closest('[data-cart]')) return;
  state.variant = 'set'; go('product');
});

/* ---------- Product variants ---------- */
const VARIANTS = {
  set: {
    name: 'Acrylic gouache, 12 pc set', price: '$32.99', list: '$44.99', img: 'assets/pd-main-set.png', imgFit: 'cover', thumb: 0, dot: 0,
    bullets: ['Acrylic-based gouache with a flat, matte, opaque finish', 'Water-resistant when dry, so layers don’t lift', '12 colors in 20 ml tubes']
  },
  individual: {
    name: 'Light Red Bright Acrylic gouache tube', price: '$9.99', list: '$13.79', img: 'assets/pd-main-red.png', imgFit: 'contain', thumb: 3, dot: 2,
    bullets: ['Red Acrylic-based gouache with a flat, matte, opaque finish', 'Water-resistant when dry, so layers don’t lift', '20 ml tube']
  }
};
function renderVariant() {
  const v = VARIANTS[state.variant];
  $('#pdName').textContent = v.name;
  $('#pdPrice').textContent = v.price;
  $('#pdList').textContent = v.list;
  $('#pdImg').src = v.img; $('#pdImg').style.objectFit = v.imgFit;
  $('#pdBullets').innerHTML = v.bullets.map(b => `<li>${b}</li>`).join('');
  $$('.gthumb').forEach((t, i) => t.classList.toggle('on', i === v.thumb));
  $$('#pdDots i').forEach((d, i) => d.classList.toggle('on', i === v.dot));
  $$('.vchip').forEach(c => c.classList.toggle('on', c.dataset.variant === state.variant));
}
$$('[data-variant]').forEach(el => el.addEventListener('click', () => { state.variant = el.dataset.variant; renderVariant(); }));
$$('.garrow').forEach(a => a.addEventListener('click', () => {
  state.variant = state.variant === 'set' ? 'individual' : 'set'; renderVariant();
}));

/* ---------- Cart drawer ---------- */
const drawer = $('#drawer'), scrim = $('#scrim');
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cart]');
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  addGouache();
  openCart(b.dataset.cart === 'normal' ? 'none' : b.dataset.cart);
});
function addGouache() {
  const it = state.cart.find(i => i.id === 'set');
  if (!it) state.cart.unshift({ ...GOUACHE });
}
function openCart(mode) {
  state.mode = mode; renderCart();
  scrim.classList.add('open'); drawer.classList.add('open');
}
function closeCart(instant) {
  drawer.classList.remove('open'); scrim.classList.remove('open');
  if (instant) { drawer.style.transition = 'none'; requestAnimationFrame(() => drawer.style.transition = ''); }
}
$('#cartIcon').addEventListener('click', () => openCart(state.mode));
drawer.addEventListener('click', e => {
  if (e.target.closest('[data-close-cart]')) return closeCart();
  const r = e.target.closest('[data-mode]');
  if (r) { state.mode = r.dataset.mode; return renderCart(); }
  const q = e.target.closest('[data-qty]');
  if (q) {
    const it = state.cart.find(i => i.id === q.dataset.id);
    const d = +q.dataset.qty;
    if (d < 0 && it.qty <= 1) return;   // matches prototype: − only works while qty > 1
    it.qty += d; return renderCart();
  }
  const rm = e.target.closest('[data-remove]');
  if (rm) { state.cart = state.cart.filter(i => i.id !== rm.dataset.remove); return renderCart(); }
  if (e.target.closest('[data-checkout]')) { go('arrange'); }
});

const itemsTotal = () => state.cart.reduce((s, i) => s + i.price * i.qty, 0);
const itemCount = () => state.cart.reduce((s, i) => s + i.qty, 0);
const discount = () => Math.round(itemsTotal() * 10) / 100;          // 10% student discount
const pickupTotal = () => itemsTotal() - discount();

function renderCart() {
  $('#cartBadge').textContent = itemCount();
  $('#drItems').innerHTML = state.cart.length ? state.cart.map(i => `
    <div class="dr-sec line-item">
      <div class="ph${i.cover ? ' cover' : ''}"><img src="${i.img}" alt=""></div>
      <div class="mid">
        <div class="nm${i.sub ? '' : ' sm'}">${i.name}</div>${i.sub ? `<div class="sub">${i.sub}</div>` : ''}
        <div class="qty"><button data-qty="-1" data-id="${i.id}" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button data-qty="1" data-id="${i.id}" aria-label="Increase quantity">+</button></div>
        <button class="remove" data-remove="${i.id}">Remove</button>
      </div>
      <div class="right"><span class="strike">${money(i.list * i.qty)}</span><span class="now">${money(i.price * i.qty)}</span><span class="save">Save 35% off List</span></div>
    </div>`).join('') : '<div class="dr-sec empty">Your cart is empty.</div>';

  $$('#drHow .radio').forEach(r => r.classList.toggle('on', r.dataset.mode === state.mode));
  $('#drHow').hidden = !state.cart.length;

  const sub = itemsTotal();
  let rows;
  if (state.mode === 'ship') {
    const total = sub + 9.95;
    rows = `<div class="row"><span>Subtotal</span><span>${money(total)}</span></div><hr>
      <div class="row total"><span>Total</span><span>${money(total)}</span></div>`;
  } else {
    rows = `<div class="row"><span>Subtotal</span><span>${money(sub)}</span></div>
      <div class="row red"><span>10% Off Student Discount</span><span>-${money(discount())}</span></div>
      ${state.mode === 'pickup' ? '<div class="row green"><span>Pickup</span><span>Free</span></div>' : ''}<hr>
      <div class="row total"><span>Total</span><span>${money(pickupTotal())}</span></div>
      ${state.mode === 'pickup' ? '<div class="note">You save $9.95 by picking it up. Pay at the counter when ready.</div>' : ''}`;
  }
  $('#drSum').innerHTML = rows;
  $('#drSum').hidden = !state.cart.length;

  const primary = state.mode === 'pickup'
    ? '<button class="btn-red" data-checkout>Confirm pickup</button>'
    : state.mode === 'ship'
      ? '<button class="btn-red" data-checkout>Go to Checkout</button>'
      : '<button class="btn-out blk" data-checkout>Go to Checkout</button>';
  $('#drFoot').innerHTML = (state.cart.length ? primary : '') + '<button class="btn-out" data-close-cart>Keep shopping</button>';
}

/* ---------- Arrange pickup ---------- */
function renderArrange() {
  $('#apItems').innerHTML = state.cart.map(i => `
    <div class="ap-item"><div class="ph${i.cover ? ' cover' : ''}"><img src="${i.img}" alt=""></div>
      <div class="nm"><span class="m">${i.name}</span><span class="mu">${i.sub || ''}</span></div>
      <span class="q">Qty ${i.qty}</span>
      <div class="st"><span>In stock at Savannah</span></div></div>`).join('');
  $('#apStock').textContent = `All ${itemCount()} item${itemCount() === 1 ? '' : 's'} in stock`;
  syncTotals();
}
function syncTotals() {
  const t = money(pickupTotal());
  $('#cbTotal').textContent = t; $('#counterTotal').textContent = t; $('#mailTotal').textContent = t;
  const n = itemCount();
  $('#mailItems').textContent = `View the ${n} item${n === 1 ? '' : 's'}`;
}
$('#whereCard').addEventListener('click', e => e.currentTarget.classList.toggle('on'));
$$('.slot').forEach(s => s.addEventListener('click', () => {
  $$('.slot').forEach(x => x.classList.toggle('on', x === s));
  const t = $('.t', s).textContent, d = $('.s', s).textContent;
  $('#cbWhen').textContent = d === 'Ready in 2 hrs' ? 'Ready today, about 2 hours' : `Ready ${t.toLowerCase()}, ${d.toLowerCase()}`;
}));
$('#confirmPickup').addEventListener('click', () => go('status'));

/* ---------- Pickup status: picking (3s) → ready (2s) → notification ---------- */
function setStatus(ready) {
  const s = $('[data-screen="status"]');
  s.classList.toggle('status-ready', ready);
  $('#statusHero').classList.toggle('ready', ready);
  $('#statusIcon').src = ready ? 'assets/check-circle-white.svg' : 'assets/clock-white.svg';
  $('#statusTitle').textContent = ready ? 'Your order is ready' : "We're picking your order";
  $('#statusSub').textContent = ready
    ? 'Pick up by tomorrow, 7PM | Bring your student ID! | Pay at the counter'
    : "Ready today, around 3PM. We'll email you when it's at the counter.";
  $('#stepMid').textContent = ready ? 'Collected' : 'Collecting';
}
function startStatus() {
  syncTotals();
  setStatus(false);
  state.timers.push(setTimeout(() => {
    setStatus(true);
    state.timers.push(setTimeout(openToast, 2000));
  }, 3000));
}

/* ---------- Toast ---------- */
const toast = $('#toast');
function openToast() { toast.classList.add('open'); }
function closeToast() { toast.classList.remove('open'); }
toast.addEventListener('click', e => { e.stopPropagation(); if (e.target.closest('[data-close-toast]')) closeToast(); });
document.addEventListener('click', e => { if (!toast.contains(e.target)) closeToast(); });
$('#viewOrder').addEventListener('click', () => go('email'));

/* ---------- Restart: press R to start the prototype over from the home page ---------- */
document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() !== 'r' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;   // don't hijack typing
  location.hash = 'home';
  location.reload();   // fresh state: cart, store, banner and timers all reset
});

/* ---------- Boot ---------- */
// Opening a later screen directly (e.g. #email) starts with the design's cart: gouache set + T-square
if (['arrange', 'status', 'email'].includes(location.hash.slice(1))) { addGouache(); $('#cartBadge').textContent = itemCount(); }
render();
