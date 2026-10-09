const products = {
  long: { id: "long", name: "LONG", form: "LONG / rectangle", price: 5000, image: "assets/product/slava-long-cutout.png", alt: "SLAVA LONG 黃銅、碳纖維與楓木三層複合結構" },
  round: { id: "round", name: "ROUND", form: "ROUND / circle", price: 2500, image: "assets/product/slava-round-cutout.png", alt: "SLAVA ROUND 黃銅、碳纖維與楓木三層複合結構" },
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const money = (value) => `NT$ ${value.toLocaleString("zh-TW")}`;
const state = { selected: "long", cart: JSON.parse(localStorage.getItem("slava-cart") || "{}"), language: localStorage.getItem("slava-language") || "zh", soundOn: false, audio: null, scene: null };
const soundProfiles = {
  long: { name: "LONG", zh: "深沉／延展", en: "DEEP / EXTENDED", fundamental: 108, harmonic: 432, filter: 780, pan: -0.08, delay: 0.055, spaceGain: 0.1, color: "long" },
  round: { name: "ROUND", zh: "集中／明亮", en: "FOCUSED / BRIGHT", fundamental: 132, harmonic: 528, filter: 1120, pan: 0.18, delay: 0.115, spaceGain: 0.2, color: "round" },
};
const soundProfileCatalog = { long: { ...soundProfiles.long }, round: { ...soundProfiles.round } };

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
    document.title = language === "zh" ? "SLAVA｜三層複合結構大提琴支撐系統" : "SLAVA — Three-layer composite support for cello";
    document.body.dataset.language = language;
    textNodes.forEach((node) => { node.textContent = node.dataset[language] || node.textContent; });
    htmlNodes.forEach((node) => { node.innerHTML = node.dataset[`${language}Html`] || node.innerHTML; });
    choices.forEach((choice) => { const active = choice.dataset.languageChoice === language; choice.classList.toggle("is-active", active); choice.setAttribute("aria-pressed", String(active)); });
    const soundLabel = $("#sound-toggle .sound-label"); if (soundLabel) soundLabel.textContent = language === "zh" ? (state.soundOn ? "聲音開啟" : "聲音關閉") : (state.soundOn ? "Sound on" : "Sound off");
    const cartLabel = $(".cart-label"); if (cartLabel) cartLabel.textContent = language === "zh" ? "購物袋" : "BAG";
    const meterState = $("#meter-state"); if (meterState) meterState.textContent = state.soundOn ? (language === "zh" ? "播放中" : "PLAYING") : (language === "zh" ? "待機" : "OFFLINE");
    window.refreshSoundLanguage?.();
    window.refreshPricingLanguage?.();
    window.refreshModelLabLanguage?.();
    localStorage.setItem("slava-language", language);
  };
  choices.forEach((choice) => choice.addEventListener("click", () => applyLanguage(choice.dataset.languageChoice)));
  applyLanguage(state.language);
}

function persistCart() { localStorage.setItem("slava-cart", JSON.stringify(state.cart)); }

function cartEntries() { return Object.values(state.cart).filter((line) => line.quantity > 0); }

function cartTotal() { return cartEntries().reduce((sum, line) => sum + line.price * line.quantity, 0); }

function updateCart() {
  Object.values(state.cart).forEach((line) => { const product = products[line.id]; if (product) Object.assign(line, { ...product, quantity: line.quantity }); });
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

function refreshProductPricing() {
  const longPrice = money(products.long.price);
  const roundPrice = money(products.round.price);
  const longCardPrice = $('[data-product-card="long"] .product-card-bottom strong');
  const roundCardPrice = $('[data-product-card="round"] .product-card-bottom strong');
  const startingPrice = $(".purchase-summary > div strong");
  if (longCardPrice) longCardPrice.textContent = longPrice;
  if (roundCardPrice) roundCardPrice.textContent = roundPrice;
  if (startingPrice) startingPrice.textContent = money(Math.min(products.long.price, products.round.price));
  const faqPrice = $("#faq .faq-row p");
  if (faqPrice) faqPrice.textContent = state.language === "en" ? `Current planning prices: LONG ${longPrice} and ROUND ${roundPrice}. Final pricing will be recalculated after material, acoustic, packaging, and fulfilment tests.` : `目前網站採用測試售價：LONG ${longPrice}、ROUND ${roundPrice}。正式募資前會依材料、聲學測試、包裝與物流重新核算。`;
}
window.refreshPricingLanguage = refreshProductPricing;

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
  const stageAngle = $("#stage-product-angle"); if (stageAngle) { stageAngle.dataset.zh = "近看材質"; stageAngle.dataset.en = "MATERIAL DETAIL"; }
  const setProduct = (id) => { state.selected = id; const product = products[id]; $("#stage-product-name").textContent = `${product.name} / 0${id === "long" ? 1 : 2}`; $("#stage-product-form").textContent = product.form; const image = $("#hero-product-image"); if (image) { image.style.backgroundImage = `url("${product.image}")`; image.setAttribute("aria-label", product.alt); } const desktopImage = $("#hero-product-desktop"); if (desktopImage) { desktopImage.src = product.image; desktopImage.alt = product.alt; } state.scene?.setProduct(id); };
  const switchProduct = () => setProduct(state.selected === "long" ? "round" : "long");
  [$("#stage-prev"), $("#stage-next")].forEach((button) => {
    button.addEventListener("click", switchProduct);
  });
  return setProduct;
}

async function setupThree(setProduct) {
  const canvas = $("#product-canvas");
  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const { GLTFLoader } = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
    const scene = new THREE.Scene(); const defaultCameraDistance = window.matchMedia("(max-width: 580px)").matches ? 9.15 : 7.3; const camera = new THREE.PerspectiveCamera(31, 1, .1, 100); camera.position.set(0, .65, defaultCameraDistance); camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffe9d1, 0x121017, 2.05)); const key = new THREE.DirectionalLight(0xffd5a4, 4.2); key.position.set(-3, 4.5, 5); scene.add(key); const rim = new THREE.PointLight(0xb26848, 24, 10); rim.position.set(3, 1.4, 3.4); scene.add(rim); const fill = new THREE.PointLight(0x8798ae, 8, 12); fill.position.set(-3, -2, 2); scene.add(fill);
    const group = new THREE.Group(); group.rotation.x = -.12; group.rotation.z = -.025; scene.add(group);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.15, .012, 12, 120), new THREE.MeshBasicMaterial({ color: 0xc89556, transparent: true, opacity: .2, depthWrite: false })); ring.position.set(0, -.08, -.32); ring.rotation.x = Math.PI * .53; group.add(ring);
    const particles = new THREE.BufferGeometry(); const points = new Float32Array(100 * 3); for (let i = 0; i < points.length; i += 3) { const radius = 1.8 + Math.random() * 1.05; const angle = Math.random() * Math.PI * 2; points[i] = Math.cos(angle) * radius; points[i+1] = (Math.random() - .5) * .55; points[i+2] = Math.sin(angle) * radius; } particles.setAttribute("position", new THREE.BufferAttribute(points, 3)); group.add(new THREE.Points(particles, new THREE.PointsMaterial({ color: 0xe4b96f, size: .016, transparent: true, opacity: .72 })));
    let modelRoot = null; let modelScale = 1; let targetRotation = 0; let currentRotation = 0; let targetTilt = -.12; let currentTilt = -.12; let cameraDistance = defaultCameraDistance; let pointer = { x: 0, y: 0 }; let dragging = false; let lastX = 0; let lastY = 0;
    const loader = new GLTFLoader();
    const showProduct = (id) => { document.body.classList.toggle("hero-round", id === "round"); if (modelRoot) modelRoot.visible = true; };
    state.scene = { setProduct: showProduct }; setProduct("long");
    const resize = () => { const bounds = canvas.getBoundingClientRect(); renderer.setSize(bounds.width, bounds.height, false); camera.aspect = bounds.width / Math.max(1, bounds.height); camera.updateProjectionMatrix(); }; window.addEventListener("resize", resize); resize();
    const stopDrag = (event) => { dragging = false; canvas.classList.remove("is-dragging"); if (event?.pointerId != null && canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId); };
    canvas.addEventListener("pointerdown", (event) => { event.preventDefault(); dragging = true; lastX = event.clientX; lastY = event.clientY; canvas.classList.add("is-dragging"); canvas.setPointerCapture(event.pointerId); });
    canvas.addEventListener("pointerup", stopDrag); canvas.addEventListener("pointercancel", stopDrag); canvas.addEventListener("lostpointercapture", stopDrag);
    canvas.addEventListener("pointermove", (event) => { const bounds = canvas.getBoundingClientRect(); pointer.x = ((event.clientX - bounds.left) / Math.max(1, bounds.width) - .5) * 2; pointer.y = ((event.clientY - bounds.top) / Math.max(1, bounds.height) - .5) * 2; if (dragging) { targetRotation += (event.clientX - lastX) * .018; targetTilt = THREE.MathUtils.clamp(targetTilt + (event.clientY - lastY) * .009, -.55, .28); lastX = event.clientX; lastY = event.clientY; } });
    canvas.addEventListener("wheel", (event) => { event.preventDefault(); cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * .006, 5.2, 9.8); }, { passive: false });
    canvas.addEventListener("dblclick", () => { targetRotation = 0; targetTilt = -.12; cameraDistance = defaultCameraDistance; });
    loader.load("assets/models/slava-cello-board.glb", (gltf) => { modelRoot = gltf.scene; const bounds = new THREE.Box3().setFromObject(modelRoot); const center = bounds.getCenter(new THREE.Vector3()); const size = bounds.getSize(new THREE.Vector3()); modelScale = 4.35 / Math.max(size.x, size.y, size.z); modelRoot.position.sub(center).multiplyScalar(modelScale); modelRoot.scale.setScalar(modelScale); modelRoot.traverse((node) => { if (!node.isMesh) return; const materials = Array.isArray(node.material) ? node.material : [node.material]; materials.forEach((material) => { if (material) { material.side = THREE.DoubleSide; material.needsUpdate = true; } }); node.castShadow = true; node.receiveShadow = true; }); group.add(modelRoot); showProduct(state.selected); document.body.classList.add("has-three"); }, undefined, (error) => { console.info("Homepage GLB unavailable; using the static cutout.", error); document.body.classList.add("hero-round"); });
    const animate = (time) => { currentRotation += (targetRotation - currentRotation) * .12; currentTilt += (targetTilt - currentTilt) * .12; group.rotation.y = currentRotation + (dragging ? 0 : Math.sin(time * .00028) * .035) + pointer.x * .06; group.rotation.x = currentTilt + (dragging ? 0 : pointer.y * -.025); ring.rotation.z += .0007; camera.position.z += (cameraDistance - camera.position.z) * .1; camera.lookAt(0, 0, 0); renderer.render(scene, camera); requestAnimationFrame(animate); }; document.body.classList.add("has-three"); requestAnimationFrame(animate);
  } catch (error) { console.info("Interactive product layer unavailable; using the static cutout.", error); canvas.style.display = "none"; setProduct("long"); }
}

async function setupModelLab() {
  const canvas = $("#model-canvas");
  if (!canvas) return;
  const viewer = $(".model-viewer");
  const status = $("#model-status");
  const modeReadout = $("#model-mode-readout");
  const materialReadout = $("#model-material-readout");
  const modeButtons = $$('[data-model-mode]');
  const finishButtons = $$('[data-material-focus]');
  let currentMode = "object";
  let materialFocus = "all";
  let refreshLanguage = () => {};
  window.refreshModelLabLanguage = () => refreshLanguage();

  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const { GLTFLoader } = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    const scene = new THREE.Scene(); const defaultCameraDistance = window.matchMedia("(max-width: 580px)").matches ? 8.8 : 7.8; const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.set(0, 1.2, defaultCameraDistance);
    const target = new THREE.Vector3(0, .1, 0);
    scene.add(new THREE.HemisphereLight(0xffe5c7, 0x16131a, 1.8));
    const key = new THREE.DirectionalLight(0xffd3a0, 3.2); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.PointLight(0xb06a46, 18, 11); rim.position.set(3, 1.2, 2.7); scene.add(rim);
    const fill = new THREE.PointLight(0x7e90a6, 9, 12); fill.position.set(-3, -2, 2); scene.add(fill);
    const stage = new THREE.Group(); scene.add(stage);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.55, .009, 10, 160), new THREE.MeshBasicMaterial({ color: 0xe4b96f, transparent: true, opacity: .26 }));
    orbit.rotation.x = Math.PI * .49; orbit.position.z = -.3; stage.add(orbit);
    const modelGroup = new THREE.Group(); stage.add(modelGroup);
    const celloGroup = new THREE.Group(); celloGroup.visible = false; stage.add(celloGroup);
    let modelRoot = null; let baseScale = 1; let targetRotation = 0; let currentRotation = 0; let targetTilt = 0; let currentTilt = 0; let cameraDistance = defaultCameraDistance; let dragging = false; let lastX = 0; let lastY = 0;

    const makeCello = () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, -2.18); shape.bezierCurveTo(-.76, -2.22, -1.22, -1.72, -1.02, -1.08); shape.bezierCurveTo(-.9, -.68, -.52, -.72, -.64, -.2); shape.bezierCurveTo(-.74, .18, -1.05, .45, -.86, .94); shape.bezierCurveTo(-.68, 1.56, -.42, 2.02, 0, 2.16); shape.bezierCurveTo(.42, 2.02, .68, 1.56, .86, .94); shape.bezierCurveTo(1.05, .45, .74, .18, .64, -.2); shape.bezierCurveTo(.52, -.72, .9, -.68, 1.02, -1.08); shape.bezierCurveTo(1.22, -1.72, .76, -2.22, 0, -2.18);
      const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .28, bevelEnabled: true, bevelSegments: 3, bevelSize: .06, bevelThickness: .06 }), new THREE.MeshStandardMaterial({ color: 0x6b3f25, roughness: .43, metalness: .02 })); body.position.z = -.08; celloGroup.add(body);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(.22, 2.65, .12), new THREE.MeshStandardMaterial({ color: 0x3b2118, roughness: .5 })); neck.position.set(0, 3.25, .01); celloGroup.add(neck);
      const fingerboard = new THREE.Mesh(new THREE.BoxGeometry(.45, 2.35, .09), new THREE.MeshStandardMaterial({ color: 0x111013, roughness: .32, metalness: .06 })); fingerboard.position.set(0, 3.02, .1); celloGroup.add(fingerboard);
      const tailpiece = new THREE.Mesh(new THREE.ConeGeometry(.33, .65, 32), new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: .28, metalness: .12 })); tailpiece.rotation.x = Math.PI; tailpiece.position.set(0, -1.72, .1); celloGroup.add(tailpiece);
      [-.075, -.025, .025, .075].forEach((x, index) => { const string = new THREE.Mesh(new THREE.CylinderGeometry(.008 + index * .002, .008 + index * .002, 6.25, 8), new THREE.MeshStandardMaterial({ color: 0xd4b17a, roughness: .22, metalness: .72 })); string.position.set(x, .85, .22); celloGroup.add(string); });
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(.72, .08, .22), new THREE.MeshStandardMaterial({ color: 0xc18b52, roughness: .46 })); bridge.position.set(0, .45, .2); celloGroup.add(bridge);
      celloGroup.scale.setScalar(.9);
    };
    makeCello();

    const applyMaterialFocus = () => {
      if (!modelRoot) return;
      const match = { wood: "maple", brass: "brass", carbon: "carbon" }[materialFocus];
      modelRoot.traverse((node) => { if (!node.isMesh) return; const materials = Array.isArray(node.material) ? node.material : [node.material]; materials.forEach((material) => { if (!material) return; const name = `${node.name} ${material.name || ""}`.toLowerCase(); const active = materialFocus === "all" || (match && name.includes(match)); material.transparent = materialFocus !== "all"; material.opacity = active ? 1 : .3; if (material.emissive) { material.emissive.setHex(active && materialFocus !== "all" ? (materialFocus === "brass" ? 0x9a5c22 : 0x4b2b1d) : 0x000000); material.emissiveIntensity = active ? .28 : 0; } material.needsUpdate = true; }); });
      materialReadout.textContent = { all: "WOOD / BRASS / CARBON", wood: "WOOD / SATIN", brass: "BRASS / SOFT POLISH", carbon: "CARBON / DEEP GLOSS" }[materialFocus];
    };
    const setMode = (mode) => { currentMode = mode; modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.modelMode === mode)); const installation = mode === "installation"; celloGroup.visible = installation; modelGroup.position.set(0, installation ? -1.65 : 0, installation ? .55 : 0); modelGroup.rotation.set(installation ? .1 : 0, 0, installation ? -.08 : 0); modelGroup.scale.setScalar(installation ? baseScale * .28 : baseScale); target.y = installation ? -.18 : .1; refreshLanguage(); };
    modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.modelMode)));
    finishButtons.forEach((button) => button.addEventListener("click", () => { materialFocus = button.dataset.materialFocus; finishButtons.forEach((item) => item.classList.toggle("is-active", item === button)); applyMaterialFocus(); }));
    refreshLanguage = () => { const language = state.language === "en"; modeReadout.textContent = currentMode === "installation" ? (language ? "CELLO INSTALL / CONCEPT" : "大提琴安裝 / 概念示意") : (language ? "OBJECT VIEW" : "產品本體"); const installationNote = $(".installation-note p"); if (installationNote) installationNote.textContent = currentMode === "installation" ? (language ? "SLAVA is shown resting beneath the cello tail-end area, as a placement study rather than a final fixing method." : "SLAVA 示意為放在大提琴尾端下方的接觸位置，不是黏在琴面上的最終固定方式。") : (language ? "The cello installation is a concept placement study. Final fixing and acoustic results require on-cello testing." : "大提琴安裝為概念位置示意；實際固定方式與聲學結果，需以琴上測試確認。"); status.textContent = language ? (status.classList.contains("is-ready") ? "GLB / READY" : "GLB / LOADING") : (status.classList.contains("is-ready") ? "GLB / 已載入" : "GLB / 載入中"); };

    const resize = () => { const bounds = canvas.getBoundingClientRect(); renderer.setSize(bounds.width, bounds.height, false); camera.aspect = bounds.width / Math.max(1, bounds.height); camera.updateProjectionMatrix(); };
    window.addEventListener("resize", resize); resize();
    const activePointers = new Map(); let pinchStartDistance = 0; let pinchStartCamera = cameraDistance;
    const pointerDistance = () => { const points = [...activePointers.values()]; return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y); };
    const endPointer = (event) => { activePointers.delete(event.pointerId); if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId); dragging = activePointers.size === 1; if (dragging) { const point = [...activePointers.values()][0]; lastX = point.x; lastY = point.y; } else canvas.classList.remove("is-dragging"); };
    canvas.addEventListener("pointerdown", (event) => { event.preventDefault(); activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); canvas.setPointerCapture(event.pointerId); if (activePointers.size === 1) { dragging = true; lastX = event.clientX; lastY = event.clientY; canvas.classList.add("is-dragging"); } else if (activePointers.size === 2) { pinchStartDistance = pointerDistance(); pinchStartCamera = cameraDistance; dragging = false; canvas.classList.remove("is-dragging"); } });
    canvas.addEventListener("pointerup", endPointer); canvas.addEventListener("pointercancel", endPointer); canvas.addEventListener("lostpointercapture", (event) => { activePointers.delete(event.pointerId); dragging = activePointers.size === 1; if (!dragging) canvas.classList.remove("is-dragging"); });
    canvas.addEventListener("pointermove", (event) => { if (!activePointers.has(event.pointerId)) return; activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); if (activePointers.size >= 2) { const distance = pointerDistance(); cameraDistance = THREE.MathUtils.clamp(pinchStartCamera - (distance - pinchStartDistance) * .018, 4.6, 10); return; } if (!dragging) return; targetRotation += (event.clientX - lastX) * .018; targetTilt = THREE.MathUtils.clamp(targetTilt + (event.clientY - lastY) * .012, -.55, .55); lastX = event.clientX; lastY = event.clientY; });
    canvas.addEventListener("wheel", (event) => { event.preventDefault(); cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * .006, 4.6, 10); }, { passive: false });
    canvas.addEventListener("dblclick", () => { targetRotation = 0; targetTilt = 0; cameraDistance = defaultCameraDistance; });

    const loader = new GLTFLoader();
    loader.load("assets/models/cello-cc0.glb", (gltf) => { const celloRoot = gltf.scene; celloRoot.rotation.x = -Math.PI / 2; const bounds = new THREE.Box3().setFromObject(celloRoot); const center = bounds.getCenter(new THREE.Vector3()); const size = bounds.getSize(new THREE.Vector3()); celloRoot.position.sub(center); celloRoot.scale.setScalar(3.9 / Math.max(size.x, size.y, size.z)); celloGroup.children.forEach((child) => { child.visible = false; }); celloRoot.traverse((node) => { if (!node.isMesh) return; node.castShadow = true; node.receiveShadow = true; const materials = Array.isArray(node.material) ? node.material : [node.material]; materials.forEach((material) => { if (!material) return; if (material.color) material.color.setHex(0x6b351f); material.roughness = .34; material.metalness = .04; material.needsUpdate = true; }); }); celloGroup.add(celloRoot); celloGroup.scale.setScalar(.9); }, undefined, (error) => { console.info("CC0 cello asset unavailable; using the concept cello fallback.", error); });
    loader.load("assets/models/slava-cello-board.glb", (gltf) => { modelRoot = gltf.scene; const bounds = new THREE.Box3().setFromObject(modelRoot); const center = bounds.getCenter(new THREE.Vector3()); const size = bounds.getSize(new THREE.Vector3()); modelRoot.position.sub(center); baseScale = 3.4 / Math.max(size.x, size.y, size.z); modelGroup.add(modelRoot); modelRoot.traverse((node) => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } }); viewer.classList.add("has-model"); status.classList.add("is-ready"); refreshLanguage(); applyMaterialFocus(); setMode("object"); }, undefined, (error) => { console.info("GLB viewer unavailable; using the static preview.", error); status.classList.add("is-error"); status.textContent = state.language === "en" ? "GLB / FALLBACK" : "GLB / 預覽模式"; });
    const animate = (time) => { currentRotation += (targetRotation - currentRotation) * .08; currentTilt += (targetTilt - currentTilt) * .08; stage.rotation.y = currentRotation + (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : Math.sin(time * .00035) * .045); stage.rotation.x = -.26 + THREE.MathUtils.clamp(currentTilt, -.28, .28); stage.rotation.z = -.025; orbit.rotation.z += .00035; camera.position.z += (cameraDistance - camera.position.z) * .08; camera.lookAt(target); renderer.render(scene, camera); requestAnimationFrame(animate); };
    document.body.classList.add("has-model-lab"); requestAnimationFrame(animate);
  } catch (error) { console.info("Interactive GLB layer unavailable; using the static preview.", error); status.classList.add("is-error"); status.textContent = state.language === "en" ? "GLB / FALLBACK" : "GLB / 預覽模式"; }
}

function setupSoundVisual(meter) {
  if (!meter || $(".meter-visual", meter)) return;
  const chooser = document.createElement("div");
  chooser.className = "sound-compare";
  chooser.setAttribute("role", "group");
  chooser.setAttribute("aria-label", "LONG 與 ROUND 空間音訊比較");
  chooser.innerHTML = `<span class="sound-compare-label">SOUND PROFILE / 聲場預設</span><div class="sound-compare-buttons"><button type="button" class="sound-profile-button is-active" data-sound-profile="long"><strong>LONG</strong><small>深沉／延展</small></button><button type="button" class="sound-profile-button" data-sound-profile="round"><strong>ROUND</strong><small>集中／明亮</small></button></div>`;
  $(".meter-head", meter)?.after(chooser);
  const visual = document.createElement("div");
  visual.className = "meter-visual";
  visual.setAttribute("aria-hidden", "true");
  const heights = [28, 42, 35, 56, 72, 48, 34, 64, 82, 58, 39, 69, 88, 52, 31, 47, 76, 63, 44, 70, 36, 55, 80, 50, 33, 61, 74, 45];
  visual.innerHTML = `<span class="meter-glow"></span><span class="meter-orbit meter-orbit-one"></span><span class="meter-orbit meter-orbit-two"></span><span class="meter-core"><i></i></span><span class="meter-frequency">432<small>Hz</small></span><span class="meter-profile-readout">LONG / DEEP / EXTENDED</span><div class="meter-waveform">${heights.map((height) => `<i style="--wave-height:${height}%"></i>`).join("")}</div>`;
  $("#meter-bars", meter)?.before(visual);
}

function applySpatialProfile(audio, profile) {
  if (!audio?.spatialAttached || !profile) return;
  const now = audio.audioContext.currentTime;
  audio.panner.pan.setTargetAtTime(profile.pan, now, 0.28);
  audio.spaceDelay.delayTime.setTargetAtTime(profile.delay, now, 0.28);
  audio.spaceGain.gain.setTargetAtTime(profile.spaceGain, now, 0.28);
}

function attachSpatialAudio(audio, profile) {
  if (!audio || audio.spatialAttached || !audio.audioContext.createStereoPanner) return;
  const { audioContext, warmth, master } = audio;
  warmth.disconnect();
  const panner = audioContext.createStereoPanner();
  const spaceDelay = audioContext.createDelay(0.5);
  const spaceGain = audioContext.createGain();
  warmth.connect(panner);
  panner.connect(master);
  warmth.connect(spaceDelay);
  spaceDelay.connect(spaceGain);
  spaceGain.connect(master);
  audio.panner = panner;
  audio.spaceDelay = spaceDelay;
  audio.spaceGain = spaceGain;
  audio.spatialAttached = true;
  applySpatialProfile(audio, profile);
}

function setupSound() {
  let soundProfileKey = "long";
  const buttons = [$("#sound-toggle"), $("#hero-sound-trigger"), $("#field-sound-trigger")].filter(Boolean); const meter = $("#field"); setupSoundVisual(meter); const meterBars = $("#meter-bars"); const waveformBars = $("#stage-waveform .waveform-bars"); const heroStage = $("#hero-stage"); for (let i = 0; i < 36; i += 1) { const bar = document.createElement("i"); bar.className = "meter-bar"; bar.style.height = `${18 + Math.random() * 75}%`; bar.style.animationDelay = `${Math.random() * -.8}s`; meterBars.appendChild(bar); } for (let i = 0; i < 28; i += 1) { const bar = document.createElement("i"); bar.style.setProperty("--bar-height", `${20 + Math.random() * 76}%`); bar.style.animationDelay = `${Math.random() * -.85}s`; waveformBars.appendChild(bar); }
  meter.classList.add("is-js-animated");
  heroStage.classList.add("is-js-animated");
  const animateSoundField = (timestamp) => { const active = state.soundOn; const meterBarsList = $$(".meter-bar", meter); const fieldWaveList = $$(".meter-waveform i", meter); const stageWaveList = $$("#stage-waveform .waveform-bars i"); meterBarsList.forEach((bar, index) => { const pulse = .35 + ((Math.sin(timestamp * .0042 + index * .72) + 1) / 2) * .65; bar.style.transform = `scaleY(${active ? pulse : .34})`; bar.style.opacity = active ? String(.58 + pulse * .42) : ".42"; }); fieldWaveList.forEach((bar, index) => { const pulse = .28 + ((Math.sin(timestamp * .0038 + index * .58) + 1) / 2) * .72; bar.style.transform = `scaleY(${active ? pulse : .24})`; bar.style.opacity = active ? String(.56 + pulse * .44) : ".42"; }); stageWaveList.forEach((bar, index) => { const pulse = .34 + ((Math.sin(timestamp * .0047 + index * .67) + 1) / 2) * .66; bar.style.transform = `scaleY(${active ? pulse : ".78"})`; bar.style.opacity = active ? String(.62 + pulse * .38) : ".6"; }); requestAnimationFrame(animateSoundField); };
  requestAnimationFrame(animateSoundField);
  const setSound = async () => { if (!state.audio) { const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return showToast("此瀏覽器不支援空間聲音"); const profile = soundProfileCatalog[soundProfileKey] || soundProfileCatalog.long; const audioContext = new AudioContext(); const master = audioContext.createGain(); master.gain.value = 0; master.connect(audioContext.destination); const oscillator = audioContext.createOscillator(); oscillator.type = "sine"; oscillator.frequency.value = profile.fundamental; const overtone = audioContext.createOscillator(); overtone.type = "triangle"; overtone.frequency.value = profile.harmonic; const warmth = audioContext.createBiquadFilter(); warmth.type = "lowpass"; warmth.frequency.value = profile.filter; oscillator.connect(warmth); overtone.connect(warmth); warmth.connect(master); oscillator.start(); overtone.start(); state.audio = { audioContext, master, oscillator, overtone, warmth }; } state.soundOn = !state.soundOn; const { audioContext, master } = state.audio; if (audioContext.state === "suspended") await audioContext.resume(); master.gain.setTargetAtTime(state.soundOn ? .035 : 0, audioContext.currentTime, .4); buttons.forEach((button) => { button.classList.toggle("is-on", state.soundOn); if (button.id === "sound-toggle") { button.setAttribute("aria-pressed", String(state.soundOn)); $(".sound-label", button).textContent = state.language === "zh" ? (state.soundOn ? "聲音開啟" : "聲音關閉") : (state.soundOn ? "Sound on" : "Sound off"); } }); meter.classList.toggle("is-playing", state.soundOn); heroStage.classList.toggle("is-audio-active", state.soundOn); $("#meter-state").textContent = state.soundOn ? (state.language === "zh" ? "播放中" : "PLAYING") : (state.language === "zh" ? "待機" : "OFFLINE"); showToast(state.soundOn ? (state.language === "zh" ? "空間聲音已開啟" : "Sound space on") : (state.language === "zh" ? "空間聲音已關閉" : "Sound space off")); };
  const profileButtons = $$(".sound-profile-button", meter);
  const setSoundProfile = (key) => { const profile = soundProfileCatalog[key] || soundProfileCatalog.long; soundProfileKey = key; profileButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.soundProfile === key)); meter.dataset.soundProfile = key; const profileLabel = $("#meter-profile-label"); const frequency = $(".meter-frequency", meter); const profileReadout = $(".meter-profile-readout", meter); if (profileLabel) profileLabel.textContent = state.language === "zh" ? `空間聲 / ${profile.harmonic}Hz` : `SPACE / ${profile.harmonic}Hz`; if (frequency) frequency.innerHTML = `${profile.harmonic}<small>Hz</small>`; if (profileReadout) profileReadout.textContent = `${profile.name} / ${state.language === "zh" ? profile.zh : profile.en}`; if (state.audio) { const now = state.audio.audioContext.currentTime; state.audio.oscillator.frequency.setTargetAtTime(profile.fundamental, now, .28); state.audio.overtone.frequency.setTargetAtTime(profile.harmonic, now, .28); state.audio.warmth.frequency.setTargetAtTime(profile.filter, now, .28); applySpatialProfile(state.audio, profile); } };
  profileButtons.forEach((button) => button.addEventListener("click", async () => { setSoundProfile(button.dataset.soundProfile); if (!state.soundOn) await setSound(); attachSpatialAudio(state.audio, soundProfileCatalog[soundProfileKey]); }));
  window.refreshSoundLanguage = () => setSoundProfile(soundProfileKey);
  setSoundProfile("long");
  let soundStartedAt = 0;
  const timeNode = $("#meter-time");
  const updateMeterClock = () => { const elapsed = state.soundOn && soundStartedAt ? Math.floor((Date.now() - soundStartedAt) / 1000) : 0; if (timeNode) timeNode.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`; };
  buttons.forEach((button) => button.addEventListener("click", () => { if (!state.soundOn) soundStartedAt = Date.now(); else soundStartedAt = 0; }));
  window.setInterval(updateMeterClock, 1000);
  buttons.forEach((button) => button.addEventListener("click", () => window.setTimeout(() => { if (state.audio) attachSpatialAudio(state.audio, soundProfileCatalog[soundProfileKey]); }, 0)));
  buttons.forEach((button) => button.addEventListener("click", setSound));
}

function setupMobileNav() {
  const shell = $(".nav-shell");
  const trigger = $("#mobile-menu-trigger");
  const panel = $("#mobile-nav");
  if (!shell || !trigger || !panel) return;

  const setOpen = (open) => {
    shell.classList.toggle("is-menu-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("aria-label", open ? "關閉網站選單" : "開啟網站選單");
    panel.setAttribute("aria-hidden", String(!open));
  };

  trigger.addEventListener("click", () => setOpen(!shell.classList.contains("is-menu-open")));
  $$("a", panel).forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("click", (event) => { if (!shell.contains(event.target)) setOpen(false); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && shell.classList.contains("is-menu-open")) {
      setOpen(false);
      trigger.focus();
    }
  });
  const desktopQuery = window.matchMedia("(min-width: 901px)");
  desktopQuery.addEventListener?.("change", (event) => { if (event.matches) setOpen(false); });
}

function boot() { setupAmbientCanvas(); setupStageControls(); setupLanguage(); setupMobileNav(); setupCart(); setupAccount(); setupReveal(); setupSound(); setupModelLab(); }
boot();
