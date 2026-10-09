const products = {
  long: { id: "long", name: "LONG", form: "LONG / rectangle", price: 2480, image: "assets/product/slava-long-cutout.png", alt: "SLAVA LONG 木質與黃銅聲音工具" },
  round: { id: "round", name: "ROUND", form: "ROUND / circle", price: 2880, image: "assets/product/slava-round-cutout.png", alt: "SLAVA ROUND 木質與黃銅聲音工具" },
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const money = (value) => `NT$ ${value.toLocaleString("zh-TW")}`;
const state = { selected: "long", cart: JSON.parse(localStorage.getItem("slava-cart") || "{}"), language: localStorage.getItem("slava-language") || "zh", soundOn: false, audio: null, scene: null };

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function setupLanguage() {
  const choices = $$('[data-language-choice]');
  const textNodes = $$('[data-i18n]');
  const htmlNodes = $$('[data-i18n-html]');
  const applyLanguage = (language) => {
    state.language = language;
    document.documentElement.lang = language === "zh" ? "zh-Hant" : "en";
    document.title = language === "zh" ? "SLAVA｜大提琴聲音工具與材質設計" : "SLAVA — Sound tools for cello practice";
    document.body.dataset.language = language;
    textNodes.forEach((node) => { node.textContent = node.dataset[language] || node.textContent; });
    htmlNodes.forEach((node) => { node.innerHTML = node.dataset[`${language}Html`] || node.innerHTML; });
    choices.forEach((choice) => { const active = choice.dataset.languageChoice === language; choice.classList.toggle("is-active", active); choice.setAttribute("aria-pressed", String(active)); });
    const soundLabel = $("#sound-toggle .sound-label"); if (soundLabel) soundLabel.textContent = language === "zh" ? (state.soundOn ? "聲音開啟" : "聲音關閉") : (state.soundOn ? "Sound on" : "Sound off");
    const cartLabel = $(".cart-label"); if (cartLabel) cartLabel.textContent = language === "zh" ? "購物袋" : "BAG";
    const meterState = $("#meter-state"); if (meterState) meterState.textContent = state.soundOn ? (language === "zh" ? "播放中" : "PLAYING") : (language === "zh" ? "待機" : "OFFLINE");
    localStorage.setItem("slava-language", language);
  };
  choices.forEach((choice) => choice.addEventListener("click", () => applyLanguage(choice.dataset.languageChoice)));
  applyLanguage(state.language);
}

function persistCart() { localStorage.setItem("slava-cart", JSON.stringify(state.cart)); }

function cartEntries() { return Object.values(state.cart).filter((line) => line.quantity > 0); }

function cartTotal() { return cartEntries().reduce((sum, line) => sum + line.price * line.quantity, 0); }

function updateCart() {
  const entries = cartEntries();
  const count = entries.reduce((sum, line) => sum + line.quantity, 0);
  $("#cart-count").textContent = count;
  $("#cart-total").textContent = money(cartTotal());
  $("#checkout-total").textContent = money(cartTotal());
  $("#checkout-trigger").disabled = entries.length === 0;
  $("#cart-empty").classList.toggle("is-visible", entries.length === 0);
  const cartItems = $("#cart-items");
  cartItems.innerHTML = entries.map((line) => `
    <div class="cart-line" data-line="${line.id}">
      <img src="${line.image}" alt="${line.alt}" />
      <div><h3>${line.name}</h3><p>${money(line.price)}</p><div class="quantity"><button type="button" data-quantity="decrease" aria-label="減少數量">−</button><span>${line.quantity}</span><button type="button" data-quantity="increase" aria-label="增加數量">+</button></div></div>
      <strong>${money(line.price * line.quantity)}</strong>
    </div>`).join("");
  persistCart();
}

function addToCart(id) {
  const product = products[id];
  state.cart[id] = state.cart[id] || { ...product, quantity: 0 };
  state.cart[id].quantity += 1;
  updateCart();
  showToast(`${product.name} 已放入購物袋`);
}

function setCartOpen(isOpen) {
  const drawer = $("#cart-drawer");
  drawer.classList.toggle("is-open", isOpen);
  drawer.setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
}

function setupCart() {
  updateCart();
  $$("[data-add]").forEach((button) => button.addEventListener("click", () => addToCart(button.dataset.add)));
  $("#cart-trigger").addEventListener("click", () => setCartOpen(true));
  $$('[data-close-cart]').forEach((node) => node.addEventListener("click", () => setCartOpen(false)));
  $("#cart-items").addEventListener("click", (event) => {
    const button = event.target.closest("[data-quantity]");
    if (!button) return;
    const line = button.closest("[data-line]")?.dataset.line;
    if (!line || !state.cart[line]) return;
    state.cart[line].quantity += button.dataset.quantity === "increase" ? 1 : -1;
    if (state.cart[line].quantity <= 0) delete state.cart[line];
    updateCart();
  });
  $("#checkout-trigger").addEventListener("click", () => {
    if (!cartEntries().length) return;
    $("#checkout-modal").showModal();
  });
  $("#checkout-form").addEventListener("submit", (event) => {
    event.preventDefault();
    $("#checkout-status").textContent = "訂單意願已收到，我們會在正式開放時聯絡你。";
    showToast("謝謝你，訂單意願已送出");
    state.cart = {};
    updateCart();
    window.setTimeout(() => { $("#checkout-modal").close(); setCartOpen(false); }, 1400);
  });
}

function setupAccount() {
  const modal = $("#account-modal");
  $("#account-trigger").addEventListener("click", () => modal.showModal());
  $$('[data-close-modal]').forEach((button) => button.addEventListener("click", () => $("#" + button.dataset.closeModal).close()));
  $$('[data-account-tab]').forEach((tab) => tab.addEventListener("click", () => {
    $$('[data-account-tab]').forEach((item) => item.classList.toggle("is-active", item === tab));
    const signup = tab.dataset.accountTab === "signup";
    $("#account-title").innerHTML = signup ? "建立你的<br /><em>SLAVA 空間。</em>" : "登入你的<br /><em>SLAVA 空間。</em>";
    $("#account-submit").innerHTML = signup ? "建立帳戶 <span>→</span>" : "登入 <span>→</span>";
  }));
  $("#account-form").addEventListener("submit", (event) => {
    event.preventDefault();
    $("#account-status").textContent = "帳戶資料已保留，正式開放時會通知你。";
    showToast("歡迎進入 SLAVA 空間");
    window.setTimeout(() => modal.close(), 1300);
  });
}

function setupReveal() {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: .12 });
  $$(".reveal").forEach((element) => observer.observe(element));
}

function setupAmbientCanvas() {
  const canvas = $("#ambient-canvas");
  const context = canvas.getContext("2d");
  let width = 0; let height = 0; let pointer = { x: .5, y: .45 };
  const stars = Array.from({ length: 105 }, () => ({ x: Math.random(), y: Math.random(), radius: Math.random() * 1.3 + .15, alpha: Math.random() * .5 + .1, drift: Math.random() * .0003 + .0001 }));
  const resize = () => { width = canvas.width = window.innerWidth * devicePixelRatio; height = canvas.height = window.innerHeight * devicePixelRatio; canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`; context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
  const draw = (time) => { context.clearRect(0, 0, window.innerWidth, window.innerHeight); const gradient = context.createRadialGradient(window.innerWidth * (.76 + (pointer.x - .5) * .03), window.innerHeight * (.3 + (pointer.y - .5) * .04), 0, window.innerWidth * .76, window.innerHeight * .3, window.innerWidth * .7); gradient.addColorStop(0, "rgba(185,119,75,.10)"); gradient.addColorStop(1, "rgba(0,0,0,0)"); context.fillStyle = gradient; context.fillRect(0, 0, window.innerWidth, window.innerHeight); stars.forEach((star) => { star.y = (star.y + star.drift) % 1; context.globalAlpha = star.alpha + Math.sin(time * .001 + star.x * 20) * .07; context.fillStyle = "#e4cda7"; context.beginPath(); context.arc(star.x * window.innerWidth + (pointer.x - .5) * 12, star.y * window.innerHeight + (pointer.y - .5) * 8, star.radius, 0, Math.PI * 2); context.fill(); }); context.globalAlpha = 1; requestAnimationFrame(draw); };
  window.addEventListener("resize", resize); window.addEventListener("pointermove", (event) => { pointer = { x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight }; }); resize(); requestAnimationFrame(draw);
}

function setupStageControls() {
  const setProduct = (id) => { state.selected = id; const product = products[id]; $("#stage-product-name").textContent = `${product.name} / 0${id === "long" ? 1 : 2}`; $("#stage-product-form").textContent = product.form; $("#product-fallback").src = product.image; $("#product-fallback").alt = product.alt; state.scene?.setProduct(id); };
  $("#stage-prev").addEventListener("click", () => setProduct(state.selected === "long" ? "round" : "long"));
  $("#stage-next").addEventListener("click", () => setProduct(state.selected === "long" ? "round" : "long"));
  return setProduct;
}

async function setupThree(setProduct) {
  const canvas = $("#product-canvas");
  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(28, 1, .1, 100); camera.position.set(0, 0, 6);
    scene.add(new THREE.AmbientLight(0xffead2, 1.9)); const key = new THREE.DirectionalLight(0xffd9a5, 3); key.position.set(-2, 3, 4); scene.add(key); const rim = new THREE.PointLight(0x9d5a3e, 20, 8); rim.position.set(2, 1, 2); scene.add(rim);
    const group = new THREE.Group(); scene.add(group); const textureLoader = new THREE.TextureLoader(); const textureCache = {};
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, .012, 12, 120), new THREE.MeshBasicMaterial({ color: 0xc89556, transparent: true, opacity: .22, depthWrite: false })); ring.position.z = -.18; ring.rotation.x = Math.PI * .52; group.add(ring);
    const particles = new THREE.BufferGeometry(); const points = new Float32Array(120 * 3); for (let i = 0; i < points.length; i += 3) { const radius = 1.5 + Math.random() * .85; const angle = Math.random() * Math.PI * 2; points[i] = Math.cos(angle) * radius; points[i+1] = (Math.random() - .5) * .6; points[i+2] = Math.sin(angle) * radius; } particles.setAttribute("position", new THREE.BufferAttribute(points, 3)); group.add(new THREE.Points(particles, new THREE.PointsMaterial({ color: 0xe4b96f, size: .018, transparent: true, opacity: .8 })));
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.45), new THREE.MeshStandardMaterial({ transparent: true, roughness: .48, metalness: .08 })); group.add(plane);
    const loadTexture = (id) => { if (!textureCache[id]) { textureCache[id] = textureLoader.load(products[id].image); textureCache[id].colorSpace = THREE.SRGBColorSpace; } plane.material.map = textureCache[id]; plane.material.needsUpdate = true; plane.scale.set(id === "round" ? .72 : 1, id === "round" ? .72 : 1, 1); };
    let targetRotation = 0; let currentRotation = 0; let pointer = { x: 0, y: 0 }; let dragging = false; let lastX = 0;
    const resize = () => { const bounds = canvas.getBoundingClientRect(); renderer.setSize(bounds.width, bounds.height, false); camera.aspect = bounds.width / bounds.height; camera.fov = camera.aspect < 1 ? Math.min(60, 2 * Math.atan((3.7 / 2) / (6 * camera.aspect)) * 180 / Math.PI) : 28; camera.updateProjectionMatrix(); }; window.addEventListener("resize", resize); resize();
    canvas.addEventListener("pointerdown", (event) => { dragging = true; lastX = event.clientX; canvas.setPointerCapture(event.pointerId); }); canvas.addEventListener("pointerup", () => { dragging = false; }); canvas.addEventListener("pointermove", (event) => { pointer.x = (event.clientX / window.innerWidth - .5) * 2; pointer.y = (event.clientY / window.innerHeight - .5) * 2; if (dragging) { targetRotation += (event.clientX - lastX) * .012; lastX = event.clientX; } });
    state.scene = { setProduct: (id) => loadTexture(id) }; setProduct("long");
    const animate = (time) => { currentRotation += (targetRotation - currentRotation) * .08; group.rotation.y = currentRotation + Math.sin(time * .00035) * .06 + pointer.x * .16; group.rotation.x = pointer.y * -.09; ring.rotation.z += .0007; renderer.render(scene, camera); requestAnimationFrame(animate); }; document.body.classList.add("has-three"); requestAnimationFrame(animate);
  } catch (error) { console.info("Interactive product layer unavailable; using the static cutout.", error); canvas.style.display = "none"; setProduct("long"); }
}

function setupSound() {
  const buttons = [$("#sound-toggle"), $("#hero-sound-trigger"), $("#field-sound-trigger")]; const meter = $("#field"); const meterBars = $("#meter-bars"); const waveformBars = $("#stage-waveform .waveform-bars"); const heroStage = $("#hero-stage"); for (let i = 0; i < 36; i += 1) { const bar = document.createElement("i"); bar.className = "meter-bar"; bar.style.height = `${18 + Math.random() * 75}%`; bar.style.animationDelay = `${Math.random() * -.8}s`; meterBars.appendChild(bar); } for (let i = 0; i < 28; i += 1) { const bar = document.createElement("i"); bar.style.setProperty("--bar-height", `${20 + Math.random() * 76}%`); bar.style.animationDelay = `${Math.random() * -.85}s`; waveformBars.appendChild(bar); }
  const setSound = async () => { if (!state.audio) { const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return showToast("此瀏覽器不支援空間聲音"); const audioContext = new AudioContext(); const master = audioContext.createGain(); master.gain.value = 0; master.connect(audioContext.destination); const oscillator = audioContext.createOscillator(); oscillator.type = "sine"; oscillator.frequency.value = 108; const overtone = audioContext.createOscillator(); overtone.type = "triangle"; overtone.frequency.value = 432; const warmth = audioContext.createBiquadFilter(); warmth.type = "lowpass"; warmth.frequency.value = 780; oscillator.connect(warmth); overtone.connect(warmth); warmth.connect(master); oscillator.start(); overtone.start(); state.audio = { audioContext, master }; } state.soundOn = !state.soundOn; const { audioContext, master } = state.audio; if (audioContext.state === "suspended") await audioContext.resume(); master.gain.setTargetAtTime(state.soundOn ? .035 : 0, audioContext.currentTime, .4); buttons.forEach((button) => { button.classList.toggle("is-on", state.soundOn); if (button.id === "sound-toggle") { button.setAttribute("aria-pressed", String(state.soundOn)); $(".sound-label", button).textContent = state.language === "zh" ? (state.soundOn ? "聲音開啟" : "聲音關閉") : (state.soundOn ? "Sound on" : "Sound off"); } }); meter.classList.toggle("is-playing", state.soundOn); heroStage.classList.toggle("is-audio-active", state.soundOn); $("#meter-state").textContent = state.soundOn ? (state.language === "zh" ? "播放中" : "PLAYING") : (state.language === "zh" ? "待機" : "OFFLINE"); showToast(state.soundOn ? (state.language === "zh" ? "空間聲音已開啟" : "Sound space on") : (state.language === "zh" ? "空間聲音已關閉" : "Sound space off")); };
  buttons.forEach((button) => button.addEventListener("click", setSound));
}

function boot() { setupAmbientCanvas(); const setProduct = setupStageControls(); setupLanguage(); setupCart(); setupAccount(); setupReveal(); setupSound(); setupThree(setProduct); }
boot();
