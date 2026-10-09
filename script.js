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
    const setMode = (mode) => { currentMode = mode; modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.modelMode === mode)); const installation = mode === "installation"; celloGroup.visible = installation; modelGroup.position.set(0, installation ? -1.05 : 0, installation ? .36 : 0); modelGroup.rotation.set(installation ? .1 : 0, 0, installation ? -.08 : 0); modelGroup.scale.setScalar(installation ? baseScale * .28 : baseScale); refreshLanguage(); };
    modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.modelMode)));
    finishButtons.forEach((button) => button.addEventListener("click", () => { materialFocus = button.dataset.materialFocus; finishButtons.forEach((item) => item.classList.toggle("is-active", item === button)); applyMaterialFocus(); }));
    refreshLanguage = () => { const language = state.language === "en"; modeReadout.textContent = currentMode === "installation" ? (language ? "CELLO INSTALL / CONCEPT" : "大提琴安裝 / 概念示意") : (language ? "OBJECT VIEW" : "產品本體"); status.textContent = language ? (status.classList.contains("is-ready") ? "GLB / READY" : "GLB / LOADING") : (status.classList.contains("is-ready") ? "GLB / 已載入" : "GLB / 載入中"); };

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
    loader.load("assets/models/slava-cello-board.glb", (gltf) => { modelRoot = gltf.scene; const bounds = new THREE.Box3().setFromObject(modelRoot); const center = bounds.getCenter(new THREE.Vector3()); const size = bounds.getSize(new THREE.Vector3()); modelRoot.position.sub(center); baseScale = 3.4 / Math.max(size.x, size.y, size.z); modelGroup.add(modelRoot); modelRoot.traverse((node) => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } }); viewer.classList.add("has-model"); status.classList.add("is-ready"); refreshLanguage(); applyMaterialFocus(); setMode("object"); }, undefined, (error) => { console.info("GLB viewer unavailable; using the static preview.", error); status.classList.add("is-error"); status.textContent = state.language === "en" ? "GLB / FALLBACK" : "GLB / 預覽模式"; });
    const animate = (time) => { currentRotation += (targetRotation - currentRotation) * .08; currentTilt += (targetTilt - currentTilt) * .08; stage.rotation.y = currentRotation + (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : Math.sin(time * .00035) * .045); stage.rotation.x = -.26 + THREE.MathUtils.clamp(currentTilt, -.28, .28); stage.rotation.z = -.025; orbit.rotation.z += .00035; camera.position.z += (cameraDistance - camera.position.z) * .08; camera.lookAt(target); renderer.render(scene, camera); requestAnimationFrame(animate); };
    document.body.classList.add("has-model-lab"); requestAnimationFrame(animate);
  } catch (error) { console.info("Interactive GLB layer unavailable; using the static preview.", error); status.classList.add("is-error"); status.textContent = state.language === "en" ? "GLB / FALLBACK" : "GLB / 預覽模式"; }
}

function setupSound() {
  const buttons = [$("#sound-toggle"), $("#hero-sound-trigger"), $("#field-sound-trigger")]; const meter = $("#field"); const meterBars = $("#meter-bars"); const waveformBars = $("#stage-waveform .waveform-bars"); const heroStage = $("#hero-stage"); for (let i = 0; i < 36; i += 1) { const bar = document.createElement("i"); bar.className = "meter-bar"; bar.style.height = `${18 + Math.random() * 75}%`; bar.style.animationDelay = `${Math.random() * -.8}s`; meterBars.appendChild(bar); } for (let i = 0; i < 28; i += 1) { const bar = document.createElement("i"); bar.style.setProperty("--bar-height", `${20 + Math.random() * 76}%`); bar.style.animationDelay = `${Math.random() * -.85}s`; waveformBars.appendChild(bar); }
  const setSound = async () => { if (!state.audio) { const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return showToast("此瀏覽器不支援空間聲音"); const audioContext = new AudioContext(); const master = audioContext.createGain(); master.gain.value = 0; master.connect(audioContext.destination); const oscillator = audioContext.createOscillator(); oscillator.type = "sine"; oscillator.frequency.value = 108; const overtone = audioContext.createOscillator(); overtone.type = "triangle"; overtone.frequency.value = 432; const warmth = audioContext.createBiquadFilter(); warmth.type = "lowpass"; warmth.frequency.value = 780; oscillator.connect(warmth); overtone.connect(warmth); warmth.connect(master); oscillator.start(); overtone.start(); state.audio = { audioContext, master }; } state.soundOn = !state.soundOn; const { audioContext, master } = state.audio; if (audioContext.state === "suspended") await audioContext.resume(); master.gain.setTargetAtTime(state.soundOn ? .035 : 0, audioContext.currentTime, .4); buttons.forEach((button) => { button.classList.toggle("is-on", state.soundOn); if (button.id === "sound-toggle") { button.setAttribute("aria-pressed", String(state.soundOn)); $(".sound-label", button).textContent = state.language === "zh" ? (state.soundOn ? "聲音開啟" : "聲音關閉") : (state.soundOn ? "Sound on" : "Sound off"); } }); meter.classList.toggle("is-playing", state.soundOn); heroStage.classList.toggle("is-audio-active", state.soundOn); $("#meter-state").textContent = state.soundOn ? (state.language === "zh" ? "播放中" : "PLAYING") : (state.language === "zh" ? "待機" : "OFFLINE"); showToast(state.soundOn ? (state.language === "zh" ? "空間聲音已開啟" : "Sound space on") : (state.language === "zh" ? "空間聲音已關閉" : "Sound space off")); };
  buttons.forEach((button) => button.addEventListener("click", setSound));
}

function boot() { setupAmbientCanvas(); const setProduct = setupStageControls(); setupLanguage(); setupCart(); setupAccount(); setupReveal(); setupSound(); setupThree(setProduct); setupModelLab(); }
boot();
