// Shop-/Vereinsbranding aus shop-config.js anwenden.
const SHOP = window.SHOP_CONFIG || {};
const FEATURES = Object.assign({
  layout: "simple",
  motifMode: "single",          // single | multiple | upload | mixed
  allowCustomerUpload: false,
  allowText: false,
  allowMoveMotif: false,
  allowResizeMotif: false,
  allowRotateMotif: false,
  allowBackDesign: true,
  allowMotifColor: true,
  showShirtColorPicker: true,
  showMotifPicker: true,
  showMotifColorPicker: true,
  autoSelectSingleMotif: true,
  showResetButton: true,
  maxUploadMB: 8
}, SHOP.features || {});

function featureEnabled(name) { return FEATURES[name] !== false; }
(function applyShopConfig() {
  const cfg = SHOP;
  if (cfg.pageTitle) document.title = cfg.pageTitle;
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };
  setText("brandTitle", cfg.brandTitle);
  setText("brandSubtitle", cfg.brandSubtitle);
  setText("designerHeading", cfg.designerHeading);
  setText("designerIntro", cfg.designerIntro);
  setText("customerExtraFieldLabel", `${cfg.customerExtraFieldLabel || "Team / Abteilung"} *`);
  setText("orderEmailDisplay", cfg.orderEmail);
  if (cfg.accentColor) document.documentElement.style.setProperty("--accent", cfg.accentColor);

  const extraField = document.getElementById("customerClass");
  if (extraField && cfg.customerExtraFieldName) extraField.name = cfg.customerExtraFieldName;
  const orderForm = document.getElementById("orderForm");
  if (orderForm && cfg.orderEmail) orderForm.action = `https://formsubmit.co/${encodeURIComponent(cfg.orderEmail)}`;
  const subject = document.getElementById("formSubject");
  if (subject && cfg.orderSubject) subject.value = cfg.orderSubject;
  const next = document.getElementById("formNext");
  if (next) next.value = new URL(`/danke.html?shop=${encodeURIComponent(cfg.customerId || window.SHOP_SLUG || "")}`, window.location.origin).href;

  if (cfg.logoFile) {
    const brand = document.querySelector(".brand");
    if (brand) {
      const img = document.createElement("img");
      img.src = window.shopAssetUrl ? window.shopAssetUrl(cfg.logoFile) : cfg.logoFile;
      img.alt = cfg.brandTitle || "Shop Logo";
      img.className = "shop-brand-logo";
      img.style.height = `${Number(cfg.logoHeight) || 52}px`;
      img.onerror = () => img.remove();
      brand.prepend(img);
    }
  }

  document.body.dataset.shopLayout = FEATURES.layout || "simple";

  const shirtColorSection = document.querySelector(".color-section");
  const motifSection = document.querySelector(".motif-section");
  const motifColorSection = document.querySelector(".motif-color-section");
  const viewSection = document.querySelector(".view-section");
  const motifHelp = document.querySelector(".motif-help");
  const backButton = document.querySelector('.view-btn[data-view="back"]');
  const resetSection = document.querySelector('.sidebar-bottom');

  const hasPresetMotifs = Array.isArray(cfg.motifs) && cfg.motifs.length > 0;
  const showPresetMotifs = hasPresetMotifs && !["upload"].includes(FEATURES.motifMode);
  if (shirtColorSection) shirtColorSection.hidden = FEATURES.showShirtColorPicker === false;
  if (motifSection) motifSection.hidden = !showPresetMotifs || FEATURES.showMotifPicker === false;
  if (motifColorSection) motifColorSection.hidden = !FEATURES.allowMotifColor || FEATURES.showMotifColorPicker === false;
  if (backButton) backButton.hidden = !FEATURES.allowBackDesign;
  if (viewSection && !FEATURES.allowBackDesign) viewSection.hidden = true;
  if (resetSection && FEATURES.showResetButton === false) resetSection.remove();
  if (motifHelp) {
    motifHelp.textContent = FEATURES.allowMoveMotif || FEATURES.allowResizeMotif
      ? "Motiv auswählen und anschließend auf dem Shirt anpassen."
      : "Motiv auswählen. Es wird automatisch fest platziert.";
  }

  const insertAfter = (reference, node) => reference && reference.parentNode && reference.parentNode.insertBefore(node, reference.nextSibling);

  if (FEATURES.allowCustomerUpload) {
    const uploadSection = document.createElement("section");
    uploadSection.className = "tool-section customer-upload-section";
    uploadSection.innerHTML = `
      <h3>Eigenes Logo</h3>
      <label class="upload-btn">Logo hochladen<input id="customerLogoUpload" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
      <p class="hint">PNG, JPG, WEBP oder SVG · max. ${Number(FEATURES.maxUploadMB) || 8} MB</p>`;
    insertAfter(motifSection || document.querySelector(".color-section"), uploadSection);
  }

  if (FEATURES.allowText) {
    const textSection = document.createElement("section");
    textSection.className = "tool-section text-section";
    textSection.innerHTML = `
      <h3>Eigener Text</h3>
      <div class="feature-row"><input id="customTextInput" class="feature-input" type="text" maxlength="40" placeholder="Text eingeben"><button id="addTextBtn" type="button" class="secondary-btn compact-btn">Hinzufügen</button></div>`;
    const anchor = document.querySelector(".customer-upload-section") || motifSection || document.querySelector(".color-section");
    insertAfter(anchor, textSection);
  }

  const footer = document.querySelector(".designer-footer");
  if (footer) {
    footer.textContent = FEATURES.allowMoveMotif || FEATURES.allowResizeMotif
      ? "Element auswählen und direkt auf dem Shirt positionieren."
      : "Das gewählte Motiv wird automatisch auf dem Shirt platziert.";
  }

  const motifGrid = document.getElementById("motifGrid");
  if (motifGrid && Array.isArray(cfg.motifs)) {
    cfg.motifs.forEach((motif) => {
      if (!motif || !motif.id || !motif.file) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "motif-btn";
      btn.dataset.motif = motif.id;
      btn.dataset.src = window.shopAssetUrl ? window.shopAssetUrl(motif.file) : motif.file;
      btn.setAttribute("aria-label", `${motif.name || motif.id} Motiv`);
      const preview = document.createElement("span");
      preview.className = "motif-preview";
      const img = document.createElement("img");
      img.src = window.shopAssetUrl ? window.shopAssetUrl(motif.file) : motif.file;
      img.alt = motif.name || motif.id;
      const label = document.createElement("span");
      label.textContent = motif.name || motif.id;
      preview.appendChild(img);
      btn.append(preview, label);
      motifGrid.appendChild(btn);
    });
  }
})();

// v28.2.3: Die sichtbare Druckzone bekommt zusätzliche Reserve NUR nach oben.
// Dadurch können große Motive höher positioniert werden, ohne am Canvas-Rand abgeschnitten zu werden.
const PRINT_BASE_WIDTH = 260;
const PRINT_BASE_HEIGHT = 340;
const PRINT_HEADROOM = 90;
const PRINT_CANVAS_HEIGHT = PRINT_BASE_HEIGHT + PRINT_HEADROOM;

const canvas = new fabric.Canvas("designCanvas", {
  width: PRINT_BASE_WIDTH,
  height: PRINT_CANVAS_HEIGHT,
  backgroundColor: "transparent",
  selection: true,
  preserveObjectStacking: true
});

const resetBtn = document.getElementById("resetBtn");
const viewButtons = document.querySelectorAll(".view-btn");
const shirtColorButtons = document.querySelectorAll(".shirt-color");
const motifButtons = document.querySelectorAll(".motif-btn");
const motifColorButtons = document.querySelectorAll(".motif-color");
const shirtMockup = document.getElementById("shirtMockup");
const currentColorName = document.getElementById("currentColorName");
const currentMotifColorName = document.getElementById("currentMotifColorName");
const designerStatus = document.getElementById("designerStatus");
const printZone = document.getElementById("printZone");
const workspace = document.querySelector(".workspace");
const dualWorkspace = document.getElementById("dualWorkspace");
const viewSection = document.querySelector(".view-section");
const productSection = document.getElementById("productSection");
const productSwitch = document.getElementById("productSwitch");
const currentProductPrice = document.getElementById("currentProductPrice");
const dualCompositeStage = document.querySelector(".dual-composite-stage");
const dualCompositeShirt = document.getElementById("dualCompositeShirt");
const dualFrontMotif = document.getElementById("dualFrontMotif");
const dualBackMotif = document.getElementById("dualBackMotif");

let currentView = "front";
let currentShirtColor = "#ffffff";
let currentShirtColorId = "weiss";
let currentPattern = "";
let currentMotifColor = "#000000";
let currentMotifColorLabel = "Black";

const viewStates = { front: null, back: null };
const baseImages = { front: null, back: null };
let dualBaseImage = null;
const motifSourceCache = new Map();
const PRODUCTS = Array.isArray(SHOP.products) && SHOP.products.length ? SHOP.products : [{
  id: "tshirt", name: "T-Shirt", price: Number(SHOP.shirtPrice) || 15,
  frontTemplate: "shirt-front-template.png", backTemplate: "shirt-back-template.png"
}];
let currentProductId = PRODUCTS[0].id;
function getCurrentProduct() { return PRODUCTS.find(p => p.id === currentProductId) || PRODUCTS[0]; }
function getCurrentUnitPrice() { return Number(getCurrentProduct().price ?? SHOP.shirtPrice) || 0; }

function renderProductSelector() {
  if (!productSection || !productSwitch) return;
  productSection.hidden = PRODUCTS.length <= 1;
  productSwitch.replaceChildren();
  PRODUCTS.forEach(product => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "product-btn";
    btn.dataset.product = product.id;
    btn.textContent = product.name || product.id;
    btn.classList.toggle("active", product.id === currentProductId);
    btn.addEventListener("click", async () => {
      if (product.id === currentProductId) return;
      currentProductId = product.id;
      dualBaseImage = null;
      document.querySelectorAll(".product-btn").forEach(el => el.classList.toggle("active", el.dataset.product === currentProductId));
      updateProductPriceLabel();
      canvas.getObjects().forEach(obj => { if (obj && obj.motifId) applyFixedMotifLayout(obj, obj.motifId); });
      canvas.requestRenderAll();
      saveCurrentView();
      await renderShirt();
      if (FEATURES.previewMode === "dual") await renderDualPreview();
    });
    productSwitch.appendChild(btn);
  });
  updateProductPriceLabel();
}

function updateProductPriceLabel() {
  if (!currentProductPrice) return;
  const product = getCurrentProduct();
  currentProductPrice.textContent = `${formatEuro(getCurrentUnitPrice())} pro ${product.name || "Shirt"}`;
}

function enhanceMotifColorCards() {
  // Pantone-/Zusatztexte bewusst ausgeblendet.
}

function updateActiveMotifColorButton(color, label) {
  motifColorButtons.forEach(button => {
    const matchesColor = (button.dataset.color || "").toLowerCase() === String(color || "").toLowerCase();
    const matchesLabel = (button.dataset.name || "") === (label || "");
    button.classList.toggle("active", matchesColor && matchesLabel);
  });
}

enhanceMotifColorCards();
renderProductSelector();

function getBaseSrc(view) {
  const product = getCurrentProduct();
  return view === "back" ? (product.backTemplate || "shirt-back-template.png") : (product.frontTemplate || "shirt-front-template.png");
}

function getBaseImage(view) {
  return new Promise((resolve, reject) => {
    const key = `${currentProductId}:${view}`;
    if (baseImages[key] && baseImages[key].complete) return resolve(baseImages[key]);
    const img = new Image();
    img.onload = () => { baseImages[key] = img; resolve(img); };
    img.onerror = reject;
    img.src = getBaseSrc(view);
  });
}

async function renderShirtImage(view) {
  try {
    const base = await getBaseImage(view);
    if (currentShirtColorId === "weiss") return getBaseSrc(view);
    const c = document.createElement("canvas");
    c.width = base.naturalWidth || base.width;
    c.height = base.naturalHeight || base.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(base, 0, 0, c.width, c.height);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = currentShirtColorId === "black" ? "#3a3a3d" : currentShirtColor;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(base, 0, 0, c.width, c.height);
    if (currentPattern === "heather") {
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = 0.10;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1, Math.round(c.width / 900));
      const step = Math.max(7, Math.round(c.width / 130));
      for (let x = -c.height; x < c.width + c.height; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + c.height, c.height); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
    return c.toDataURL("image/png");
  } catch (err) {
    console.error("Shirt rendering failed", err);
    return getBaseSrc(view);
  }
}

async function renderShirt() {
  const viewAtStart = currentView;
  const src = await renderShirtImage(viewAtStart);
  if (viewAtStart !== currentView) return;
  shirtMockup.src = src;
  if (FEATURES.previewMode === "dual") renderDualPreview();
}

function getConfiguredMotif(view) {
  const cfg = SHOP.fixedPrint && SHOP.fixedPrint[view];
  if (!cfg || !cfg.enabled) return null;
  const motif = (SHOP.motifs || []).find(m => m.id === cfg.motifId) || (SHOP.motifs || [])[0];
  if (!motif) return null;
  return { cfg, motif };
}

function getUnifiedPrintLayout(view, cfg) {
  const product = SHOP.productPrint && SHOP.productPrint[currentProductId] && SHOP.productPrint[currentProductId][view];
  if (product) {
    return {
      xPct: Math.max(8, Math.min(92, Number(product.xPct) || 50)),
      yPct: Math.max(10, Math.min(70, Number(product.yPct) || (view === "front" ? 20 : 36))),
      widthPct: Math.max(8, Math.min(80, Number(product.widthPct) || (view === "front" ? 22 : 50)))
    };
  }
  const size = cfg?.size || "medium";
  const widths = { small: 22, medium: 50, large: 70 };
  const scaleFactor = Math.max(0.4, Math.min(1.6, (Number(cfg?.scalePct) || 100) / 100));
  let xPct = 50 + (Number(cfg?.shiftXPct) || 0);
  if (view === "front" && (cfg?.position || "center") === "left-chest") {
    const side = Math.max(15, Math.min(50, Number(cfg?.sidePct) || 32));
    xPct = 100 - side;
  }
  return {
    xPct: Math.max(8, Math.min(92, xPct)),
    yPct: Math.max(10, Math.min(70, Number(cfg?.topPct) || (view === "front" ? 20 : 36))),
    widthPct: Math.max(8, Math.min(80, (widths[size] || widths.medium) * scaleFactor))
  };
}

function applyDualMotifLayout(img, view, cfg) {
  if (!img || !cfg) return;
  const layout = getUnifiedPrintLayout(view, cfg);

  // Dieselben X/Y/Größe-Werte wie in der Einzelansicht werden in die
  // reale Druckzone der jeweiligen Shirt-Hälfte übertragen.
  const zone = { left: 0.28, top: 0.222, width: 0.44, height: 0.496 };
  const left = (zone.left + zone.width * (layout.xPct / 100)) * 100;
  const top = (zone.top + zone.height * (layout.yPct / 100)) * 100;
  const width = zone.width * (layout.widthPct / 100) * 100;

  img.style.left = `${left}%`;
  img.style.top = `${top}%`;
  img.style.width = `${width}%`;
  img.style.maxWidth = `${width}%`;
  img.style.maxHeight = `${zone.height * 62}%`;
}

async function getDualBaseImage() {
  // v27.8: Die Doppelansicht wird aus den seit langem bewährten
  // Front-/Back-Templates zusammengesetzt. Dadurch braucht der Live-Shop
  // KEINE zusätzliche shirt-dual.png-Datei mehr.
  if (dualBaseImage) return dualBaseImage;
  const [front, back] = await Promise.all([getBaseImage("front"), getBaseImage("back")]);
  const c = document.createElement("canvas");
  const w = Math.max(front.naturalWidth || front.width, back.naturalWidth || back.width);
  const h = Math.max(front.naturalHeight || front.height, back.naturalHeight || back.height);
  c.width = w * 2;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(front, 0, 0, w, h);
  ctx.drawImage(back, w, 0, w, h);
  dualBaseImage = c;
  return c;
}

async function renderDualShirtImage() {
  try {
    const base = await getDualBaseImage();
    const c = document.createElement("canvas");
    c.width = base.width;
    c.height = base.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(base, 0, 0, c.width, c.height);

    if (currentShirtColorId !== "weiss") {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = currentShirtColorId === "black" ? "#3a3a3d" : currentShirtColor;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(base, 0, 0, c.width, c.height);
      ctx.globalCompositeOperation = "source-over";
    }
    return c.toDataURL("image/png");
  } catch (err) {
    console.error("Doppelansicht-Shirt konnte nicht gerendert werden", err);
    // Bewusster sichtbarer Fallback statt leerer Fläche.
    return getBaseSrc("front");
  }
}

async function renderDualMotif(view, img) {
  if (!img) return;
  const entry = getConfiguredMotif(view);
  if (!entry) { img.hidden = true; img.removeAttribute("src"); return; }
  try {
    const src = window.shopAssetUrl ? window.shopAssetUrl(entry.motif.file) : entry.motif.file;
    img.src = await recolorMotifSource(src, currentMotifColor);
    img.hidden = false;
    applyDualMotifLayout(img, view, entry.cfg);
  } catch (err) {
    console.error(`Doppelansicht-Motiv ${view} konnte nicht geladen werden`, err);
    img.hidden = true;
  }
}

async function renderDualPreview() {
  if (FEATURES.previewMode !== "dual" || !dualWorkspace) return;
  const base = await getDualBaseImage();
  if (dualCompositeStage && base && base.width && base.height) {
    dualCompositeStage.style.aspectRatio = `${base.width} / ${base.height}`;
  }
  if (dualCompositeShirt) {
    dualCompositeShirt.hidden = false;
    dualCompositeShirt.src = await renderDualShirtImage();
  }
  await Promise.all([renderDualMotif("front", dualFrontMotif), renderDualMotif("back", dualBackMotif)]);
}

function applyPreviewMode() {
  const dual = FEATURES.previewMode === "dual";
  const designerArea = document.querySelector(".designer-area");
  if (designerArea) designerArea.classList.toggle("is-dual", dual);
  if (workspace) workspace.hidden = dual;
  if (dualWorkspace) {
    dualWorkspace.hidden = !dual;
    dualWorkspace.style.display = dual ? "grid" : "none";
  }
  if (viewSection) viewSection.hidden = dual;
  if (designerStatus) designerStatus.textContent = dual ? "Vorder- & Rückseite" : (currentView === "back" ? "Rückseite" : "Vorderseite");
  if (dual) {
    requestAnimationFrame(() => renderDualPreview());
  }
}

function getActiveObject() { return canvas.getActiveObject(); }
function saveCurrentView() { viewStates[currentView] = canvas.toJSON(["motifId", "motifSrc", "motifColor", "motifColorLabel"]); }

function loadView(view) {
  canvas.clear();
  canvas.backgroundColor = "transparent";
  const state = viewStates[view];
  if (state) canvas.loadFromJSON(state, () => {
    canvas.getObjects().forEach(obj => {
      if (obj && obj.motifId) applyFixedMotifLayout(obj, obj.motifId);
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  });
  else canvas.requestRenderAll();
}

function switchView(view) {
  if (view === currentView) return;
  saveCurrentView();
  currentView = view;
  viewButtons.forEach(button => button.classList.toggle("active", button.dataset.view === view));
  if (view === "front") {
    shirtMockup.alt = "T-Shirt Vorderseite";
    designerStatus.textContent = "Vorderseite";
    printZone.classList.remove("back");
    canvas.setHeight(PRINT_CANVAS_HEIGHT); canvas.setWidth(PRINT_BASE_WIDTH);
  } else {
    shirtMockup.alt = "T-Shirt Rückseite";
    designerStatus.textContent = "Rückseite";
    printZone.classList.add("back");
    canvas.setHeight(PRINT_CANVAS_HEIGHT); canvas.setWidth(PRINT_BASE_WIDTH);
  }
  renderShirt();
  loadView(view);
}

viewButtons.forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));

function changeShirtColor(color, name, colorId, pattern) {
  currentShirtColor = color || "#ffffff";
  currentShirtColorId = colorId || "weiss";
  currentPattern = pattern || "";
  currentColorName.textContent = name || "White";
  shirtColorButtons.forEach(button => button.classList.toggle("active", button.dataset.id === currentShirtColorId));
  renderShirt();
  if (FEATURES.previewMode === "dual") renderDualPreview();
}

shirtColorButtons.forEach(button => button.addEventListener("click", () => {
  changeShirtColor(button.dataset.color, button.dataset.name, button.dataset.id, button.dataset.pattern || "");
}));

function hexToRgb(hex) {
  const clean = String(hex || "#000000").replace("#", "");
  const normalized = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean.padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(normalized.slice(0,2), 16),
    g: parseInt(normalized.slice(2,4), 16),
    b: parseInt(normalized.slice(4,6), 16)
  };
}

function loadNativeImage(src) {
  return new Promise((resolve, reject) => {
    if (motifSourceCache.has(src)) return resolve(motifSourceCache.get(src));
    const img = new Image();
    img.onload = () => { motifSourceCache.set(src, img); resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

async function recolorMotifSource(src, color) {
  const img = await loadNativeImage(src);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const data = imageData.data;
  const rgb = hexToRgb(color);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    // Preserve original transparency/anti-aliasing; all visible motif pixels get the chosen print color.
    data[i] = rgb.r; data[i + 1] = rgb.g; data[i + 2] = rgb.b;
  }
  ctx.putImageData(imageData, 0, 0);
  return c.toDataURL("image/png");
}

const FIXED_MOTIF_LAYOUTS = {
  default: { left: 0.50, top: 0.31, maxWidth: 0.72, maxHeight: 0.36 },
  "front:left-chest:small": { left: 0.68, top: 0.24, maxWidth: 0.22, maxHeight: 0.18 },
  "front:center:small": { left: 0.50, top: 0.26, maxWidth: 0.28, maxHeight: 0.20 },
  "front:center:medium": { left: 0.50, top: 0.31, maxWidth: 0.50, maxHeight: 0.32 },
  "front:center:large": { left: 0.50, top: 0.34, maxWidth: 0.72, maxHeight: 0.46 },
  "back:center:small": { left: 0.50, top: 0.27, maxWidth: 0.30, maxHeight: 0.22 },
  "back:center:medium": { left: 0.50, top: 0.32, maxWidth: 0.52, maxHeight: 0.38 },
  "back:center:large": { left: 0.50, top: 0.36, maxWidth: 0.78, maxHeight: 0.58 }
};

function getFixedPrintLayout(motifId) {
  const cfg = SHOP.fixedPrint && SHOP.fixedPrint[currentView];
  if (cfg && cfg.enabled) {
    const unified = getUnifiedPrintLayout(currentView, cfg);
    return {
      left: unified.xPct / 100,
      top: unified.yPct / 100,
      maxWidth: unified.widthPct / 100,
      maxHeight: Math.min(0.62, (unified.widthPct / 100) * 0.86)
    };
  }
  return FIXED_MOTIF_LAYOUTS.default;
}

function applyFixedMotifLayout(image, motifId) {
  const layout = getFixedPrintLayout(motifId);
  const maxWidth = PRINT_BASE_WIDTH * layout.maxWidth;
  const maxHeight = PRINT_BASE_HEIGHT * layout.maxHeight;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const movable = !!FEATURES.allowMoveMotif;
  const resizable = !!FEATURES.allowResizeMotif;
  const rotatable = !!FEATURES.allowRotateMotif;
  const editable = movable || resizable || rotatable;
  image.set({
    left: PRINT_BASE_WIDTH * layout.left,
    // Y-Werte bleiben auf die bisherige 340px-Druckzone bezogen.
    // PRINT_HEADROOM liegt unsichtbar darüber und verhindert Clipping.
    top: PRINT_HEADROOM + (PRINT_BASE_HEIGHT * layout.top),
    originX: "center", originY: "center",
    angle: 0,
    scaleX: scale, scaleY: scale,
    selectable: editable, evented: editable,
    hasControls: resizable || rotatable, hasBorders: editable,
    lockMovementX: !movable, lockMovementY: !movable,
    lockScalingX: !resizable, lockScalingY: !resizable,
    lockRotation: !rotatable,
    hoverCursor: editable ? "move" : "default"
  });
  if (image.setControlsVisibility) image.setControlsVisibility({ mtr: rotatable });
  image.setCoords();
}

function configureFabricImage(image, motifId, motifSrc) {
  applyFixedMotifLayout(image, motifId);
  image.set({
    motifId, motifSrc,
    motifColor: currentMotifColor,
    motifColorLabel: currentMotifColorLabel
  });
}

async function addMotifToView(view, motifId, motifSrc, markActive = true) {
  if (currentView !== view) switchView(view);
  await new Promise(resolve => requestAnimationFrame(resolve));
  try {
    const dataUrl = await recolorMotifSource(motifSrc, currentMotifColor);
    canvas.clear();
    canvas.backgroundColor = "transparent";
    await new Promise((resolve) => {
      fabric.Image.fromURL(dataUrl, function(image) {
        configureFabricImage(image, motifId, motifSrc);
        canvas.add(image);
        canvas.discardActiveObject();
        image.setCoords();
        canvas.requestRenderAll();
        viewStates[view] = canvas.toJSON(["motifId", "motifSrc", "motifColor", "motifColorLabel"]);
        if (markActive && view === "front") motifButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.motif === motifId));
        resolve();
      }, { crossOrigin: "anonymous" });
    });
  } catch (err) {
    console.error("Motiv konnte nicht geladen werden", err);
    alert("Das Motiv konnte nicht geladen werden. Bitte Seite neu laden.");
  }
}

async function addSelectedMotif(motifId, motifSrc) {
  return addMotifToView("front", motifId, motifSrc, true);
}

motifButtons.forEach(button => button.addEventListener("click", () => {
  addSelectedMotif(button.dataset.motif, button.dataset.src);
}));

async function recolorActiveMotif(color, label) {
  currentMotifColor = color;
  currentMotifColorLabel = label;
  currentMotifColorName.textContent = label;
  updateActiveMotifColorButton(color, label);
  if (FEATURES.previewMode === "dual") await renderDualPreview();

  // Die Motive sind absichtlich nicht auswählbar. Daher direkt das feste Motiv einfärben.
  if (currentView !== "front") {
    switchView("front");
    await new Promise(resolve => requestAnimationFrame(resolve));
  }

  const object = canvas.getObjects().find(obj => obj && obj.motifSrc && obj.type === "image" && obj.motifKind !== "upload");
  if (!object) return;

  const oldWidth = object.getScaledWidth();
  const oldHeight = object.getScaledHeight();
  try {
    const dataUrl = await recolorMotifSource(object.motifSrc, color);
    object.setSrc(dataUrl, () => {
      const targetScale = Math.min(oldWidth / object.width, oldHeight / object.height);
      object.set({ motifColor: color, motifColorLabel: label });
      applyFixedMotifLayout(object, object.motifId || "college");
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      saveCurrentView();
    }, { crossOrigin: "anonymous" });
  } catch (err) {
    console.error("Motivfarbe konnte nicht angewendet werden", err);
  }
}

motifColorButtons.forEach(button => button.addEventListener("click", () => {
  recolorActiveMotif(button.dataset.color, button.dataset.name);
}));

const customerLogoUpload = document.getElementById("customerLogoUpload");
if (customerLogoUpload) customerLogoUpload.addEventListener("change", function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const maxBytes = (Number(FEATURES.maxUploadMB) || 8) * 1024 * 1024;
  if (file.size > maxBytes) {
    alert(`Die Datei ist zu groß. Maximal ${Number(FEATURES.maxUploadMB) || 8} MB.`);
    event.target.value = "";
    return;
  }
  if (!/^image\//.test(file.type)) { alert("Bitte eine Bilddatei auswählen."); return; }
  const reader = new FileReader();
  reader.onload = () => {
    if (currentView !== "front" && !FEATURES.allowBackDesign) switchView("front");
    fabric.Image.fromURL(reader.result, function(image) {
      if (FEATURES.motifMode !== "mixed") canvas.clear();
      const maxWidth = canvas.width * 0.72;
      const maxHeight = canvas.height * 0.36;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const movable = !!FEATURES.allowMoveMotif;
      const resizable = !!FEATURES.allowResizeMotif;
      const rotatable = !!FEATURES.allowRotateMotif;
      image.set({
        left: canvas.width / 2, top: canvas.height * 0.31, originX: "center", originY: "center",
        scaleX: scale, scaleY: scale, motifId: "customer-upload", motifSrc: reader.result, motifName: file.name, motifKind: "upload",
        selectable: movable || resizable || rotatable, evented: movable || resizable || rotatable,
        hasControls: resizable || rotatable, hasBorders: movable || resizable || rotatable,
        lockMovementX: !movable, lockMovementY: !movable, lockScalingX: !resizable, lockScalingY: !resizable, lockRotation: !rotatable
      });
      if (image.setControlsVisibility) image.setControlsVisibility({ mtr: rotatable });
      canvas.add(image);
      if (image.selectable) canvas.setActiveObject(image); else canvas.discardActiveObject();
      canvas.requestRenderAll();
      saveCurrentView();
      motifButtons.forEach(btn => btn.classList.remove("active"));
      event.target.dataset.selectedName = file.name;
    });
  };
  reader.readAsDataURL(file);
});

const customTextInput = document.getElementById("customTextInput");
const addTextBtn = document.getElementById("addTextBtn");
if (addTextBtn && customTextInput) addTextBtn.addEventListener("click", function() {
  const value = customTextInput.value.trim();
  if (!value) return;
  const text = new fabric.Textbox(value, {
    left: canvas.width / 2, top: canvas.height * 0.56, originX: "center", originY: "center",
    width: canvas.width * 0.7, textAlign: "center", fontSize: 28, fontWeight: 700, fill: currentMotifColor,
    editable: true, selectable: true, motifKind: "text", motifName: value
  });
  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.requestRenderAll();
  saveCurrentView();
  customTextInput.value = "";
});

if (resetBtn) resetBtn.addEventListener("click", function() {
  viewStates.front = null; viewStates.back = null;
  canvas.clear(); canvas.backgroundColor = "transparent";
  currentView = "front";
  designerStatus.textContent = "Vorderseite";
  printZone.classList.remove("back");
  canvas.setWidth(PRINT_BASE_WIDTH); canvas.setHeight(PRINT_CANVAS_HEIGHT);
  viewButtons.forEach(button => button.classList.toggle("active", button.dataset.view === "front"));
  motifButtons.forEach(button => button.classList.remove("active"));
  changeShirtColor("#ffffff", "White", "weiss", "");
  recolorActiveMotif("#000000", "Black");
  canvas.requestRenderAll();
});

canvas.on("object:modified", function(event) {
  const object = event.target;
  if (!object) return;
  object.setCoords();
  const bounds = object.getBoundingRect(true, true);
  let left = object.left, top = object.top;
  if (bounds.left < 0) left += -bounds.left;
  if (bounds.left + bounds.width > canvas.width) left -= bounds.left + bounds.width - canvas.width;
  if (bounds.top < 0) top += -bounds.top;
  if (bounds.top + bounds.height > canvas.height) top -= bounds.top + bounds.height - canvas.height;
  object.set({ left, top }); object.setCoords(); canvas.requestRenderAll(); saveCurrentView();
});



// v14: Mehrere unterschiedliche Shirts in einer Bestellung
const shirtSize = document.getElementById("shirtSize");
const shirtQuantity = document.getElementById("shirtQuantity");
const addToOrderBtn = document.getElementById("addToOrderBtn");
const orderBtn = document.getElementById("orderBtn");
const orderMessage = document.getElementById("orderMessage");
const cartBox = document.getElementById("cartBox");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const orderModal = document.getElementById("orderModal");
const orderSummary = document.getElementById("orderSummary");
const orderForm = document.getElementById("orderForm");
const formOrderItems = document.getElementById("formOrderItems");
const formTotalQuantity = document.getElementById("formTotalQuantity");
const sendOrderMessage = document.getElementById("sendOrderMessage");
const formOrderNumber = document.getElementById("formOrderNumber");
const formTotalPrice = document.getElementById("formTotalPrice");

const SHIRT_PRICE = Number(SHOP.shirtPrice) || 15;
const ORDER_PREFIX = SHOP.orderPrefix || String(SHOP.customerId || "SHOP").toUpperCase().replace(/[^A-Z0-9]+/g,"-").slice(0,12);
const CUSTOMER_ID = SHOP.customerId || window.SHOP_SLUG || "unknown";
let orderItems = [];
let firestoreDb = null;

function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: SHOP.currency || "EUR" }).format(value);
}

function getFirestoreDb() {
  if (firestoreDb) return firestoreDb;
  if (!window.firebase || !firebase.apps || !firebase.apps.length || !firebase.firestore) {
    throw new Error("Firebase/Firestore ist nicht verfügbar.");
  }
  firestoreDb = firebase.firestore();
  return firestoreDb;
}

function createOrderNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  let randomPart;
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    randomPart = String(values[0] % 10000).padStart(4, "0");
  } else {
    randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  }

  return `${ORDER_PREFIX}-${yy}${mm}${dd}-${hh}${mi}${ss}-${randomPart}`;
}

function getSelectedMotifName() {
  const active = document.querySelector(".motif-btn.active");
  if (active) return active.textContent.replace(/\s+/g, " ").trim();
  const uploaded = canvas.getObjects().find(obj => obj && obj.motifKind === "upload");
  if (uploaded) return `Eigenes Logo (${uploaded.motifName || "Upload"})`;
  const text = canvas.getObjects().find(obj => obj && obj.motifKind === "text");
  if (text) return `Eigener Text: ${text.text || text.motifName || "Text"}`;
  return "Noch kein Motiv gewählt";
}

function summaryRow(label, value) {
  const row = document.createElement("div");
  row.className = "order-summary-row";
  const key = document.createElement("span");
  key.textContent = label;
  const val = document.createElement("strong");
  val.textContent = value;
  row.append(key, val);
  return row;
}

function getCurrentShirtSelection() {
  const size = shirtSize.value;
  const quantity = Math.max(1, Math.min(99, Number(shirtQuantity.value) || 1));
  shirtQuantity.value = quantity;
  const activeMotif = document.querySelector(".motif-btn.active");
  const hasCustomDesign = canvas.getObjects().some(obj => obj && (obj.motifKind === "upload" || obj.motifKind === "text"));

  if (!size) {
    orderMessage.textContent = "Bitte zuerst eine Größe auswählen.";
    shirtSize.focus();
    return null;
  }
  if (!activeMotif && !hasCustomDesign) {
    orderMessage.textContent = FEATURES.allowCustomerUpload ? "Bitte zuerst ein Motiv auswählen oder eigenes Logo hochladen." : "Bitte zuerst ein Motiv auswählen.";
    return null;
  }

  const fixedPrintParts = [];
  if (SHOP.fixedPrint?.front?.enabled) fixedPrintParts.push("Vorne: linke Herzseite klein");
  if (SHOP.fixedPrint?.back?.enabled) fixedPrintParts.push("Hinten: groß mittig");
  const product = getCurrentProduct();
  return {
    id: Date.now() + Math.random(),
    productId: product.id,
    productName: product.name || "T-Shirt",
    articleNo: product.articleNo || "",
    unitPrice: getCurrentUnitPrice(),
    purchasePrice: Number(product.purchasePrice) || 0,
    shirtColor: currentColorName.textContent || "White",
    motif: getSelectedMotifName(),
    motifColor: currentMotifColorName.textContent || currentMotifColorLabel,
    printLayout: fixedPrintParts.join(" · "),
    size,
    quantity
  };
}

function renderCart() {
  const total = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  cartBox.hidden = orderItems.length === 0;
  cartCount.textContent = `${total} ${total === 1 ? "Textil" : "Textilien"}`;
  cartItems.replaceChildren();

  orderItems.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "cart-item";

    const info = document.createElement("div");
    info.className = "cart-item-info";
    const title = document.createElement("strong");
    title.textContent = `${item.quantity}× ${item.productName || "T-Shirt"} · ${item.size} · ${item.shirtColor} · ${formatEuro(item.quantity * (Number(item.unitPrice) || SHIRT_PRICE))}`;
    const meta = document.createElement("span");
    meta.textContent = `${item.motif} · ${item.motifColor}${item.printLayout ? ` · ${item.printLayout}` : ""}`;
    info.append(title, meta);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "cart-remove";
    remove.textContent = "Entfernen";
    remove.setAttribute("aria-label", `Position ${index + 1} entfernen`);
    remove.addEventListener("click", () => {
      orderItems.splice(index, 1);
      renderCart();
    });

    card.append(info, remove);
    cartItems.appendChild(card);
  });
}

function addCurrentShirtToOrder() {
  orderMessage.textContent = "";
  orderMessage.classList.remove("success");
  const item = getCurrentShirtSelection();
  if (!item) return;

  // Gleiche Kombinationen werden automatisch zusammengefasst.
  const existing = orderItems.find(entry =>
    entry.productId === item.productId &&
    entry.shirtColor === item.shirtColor &&
    entry.motif === item.motif &&
    entry.motifColor === item.motifColor &&
    entry.size === item.size
  );

  if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
  else orderItems.push(item);

  renderCart();
  orderMessage.textContent = `${item.productName || "Textil"} wurde zur Bestellung hinzugefügt.`;
  orderMessage.classList.add("success");
}

function orderItemsAsText() {
  return orderItems.map((item, i) =>
    `${i + 1}. ${item.quantity}x | Artikel: ${item.productName || "T-Shirt"} | Größe ${item.size} | Farbe: ${item.shirtColor} | Motiv: ${item.motif} | Motivfarbe: ${item.motifColor}${item.printLayout ? ` | Druck: ${item.printLayout}` : ""} | Preis: ${formatEuro(item.quantity * (Number(item.unitPrice) || SHIRT_PRICE))}`
  ).join("\n");
}

function openOrderSummary() {
  orderMessage.textContent = "";
  orderMessage.classList.remove("success");
  if (!orderItems.length) {
    orderMessage.textContent = "Bitte zuerst mindestens ein Shirt zur Bestellung hinzufügen.";
    return;
  }

  const total = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = orderItems.reduce((sum, item) => sum + item.quantity * (Number(item.unitPrice) || SHIRT_PRICE), 0);
  orderSummary.replaceChildren();

  orderSummary.appendChild(summaryRow("Bestellnummer", "wird beim Absenden vergeben"));
  orderItems.forEach((item, i) => {
    orderSummary.appendChild(summaryRow(
      `Position ${i + 1}`,
      `${item.quantity}× ${item.productName || "T-Shirt"} · ${item.size} · ${item.shirtColor} · ${item.motif} · ${item.motifColor}${item.printLayout ? ` · ${item.printLayout}` : ""} · ${formatEuro(item.quantity * (Number(item.unitPrice) || SHIRT_PRICE))}`
    ));
  });
  orderSummary.appendChild(summaryRow("Gesamtmenge", String(total)));
  orderSummary.appendChild(summaryRow("Gesamtpreis", formatEuro(totalPrice)));

  formOrderItems.value = orderItemsAsText();
  formTotalQuantity.value = String(total);
  if (formOrderNumber) formOrderNumber.value = "";
  if (formTotalPrice) formTotalPrice.value = formatEuro(totalPrice);
  if (sendOrderMessage) {
    sendOrderMessage.textContent = "";
    sendOrderMessage.classList.remove("success");
  }

  orderModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeOrderSummary() {
  orderModal.hidden = true;
  document.body.style.overflow = "";
}

if (addToOrderBtn) addToOrderBtn.addEventListener("click", addCurrentShirtToOrder);
if (orderBtn) orderBtn.addEventListener("click", openOrderSummary);
document.querySelectorAll("[data-close-order]").forEach(el => el.addEventListener("click", closeOrderSummary));
document.addEventListener("keydown", e => { if (e.key === "Escape" && !orderModal.hidden) closeOrderSummary(); });

if (orderForm) {
  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const customerClass = document.getElementById("customerClass").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const sendOrderBtn = document.getElementById("sendOrderBtn");

    if (!orderItems.length) {
      sendOrderMessage.textContent = "Die Bestellung enthält noch keine Shirts.";
      return;
    }
    if (!name || !customerClass || !email) {
      sendOrderMessage.textContent = `Bitte Name, ${SHOP.customerExtraFieldLabel || "Team / Abteilung"} und E-Mail vollständig ausfüllen.`;
      return;
    }

    if (!orderForm.reportValidity()) return;

    if (sendOrderBtn) sendOrderBtn.disabled = true;
    sendOrderMessage.textContent = "Bestellung wird vorbereitet …";
    sendOrderMessage.classList.add("success");

    try {
      const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = orderItems.reduce((sum, item) => sum + item.quantity * (Number(item.unitPrice) || SHIRT_PRICE), 0);
      const orderNumber = createOrderNumber();

      formOrderItems.value = orderItemsAsText();
      formTotalQuantity.value = String(totalQuantity);
      if (formOrderNumber) formOrderNumber.value = orderNumber;
      if (formTotalPrice) formTotalPrice.value = formatEuro(totalPrice);

      const phone = document.getElementById("customerPhone").value.trim();
      const orderPayload = {
        orderNumber,
        customerId: CUSTOMER_ID,
        customerName: SHOP.customerName || SHOP.brandTitle || CUSTOMER_ID,
        sourcePath: window.location.pathname,
        name,
        customerClass,
        email,
        phone,
        totalQuantity,
        unitPrice: orderItems.length === 1 ? (Number(orderItems[0].unitPrice) || SHIRT_PRICE) : null,
        totalPrice,
        status: "Neu",
        printData: SHOP.printData || {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        items: orderItems.map(item => ({
          productId: item.productId || "tshirt",
          productName: item.productName || "T-Shirt",
          articleNo: item.articleNo || "",
          unitPrice: Number(item.unitPrice) || SHIRT_PRICE,
          purchasePrice: Number(item.purchasePrice) || 0,
          shirtColor: item.shirtColor,
          motif: item.motif,
          motifColor: item.motifColor,
          printLayout: item.printLayout || "",
          size: item.size,
          quantity: item.quantity,
          linePrice: item.quantity * (Number(item.unitPrice) || SHIRT_PRICE)
        }))
      };

      // Bestellung zusätzlich zentral in Firestore speichern, damit sie im Admin-Bereich erscheint.
      await getFirestoreDb().collection("orders").doc(orderNumber).set(orderPayload);

      try {
        sessionStorage.setItem(`shirtOrderConfirmation:${CUSTOMER_ID}`, JSON.stringify({
          orderNumber,
          customerId: CUSTOMER_ID,
          customerName: SHOP.customerName || SHOP.brandTitle || CUSTOMER_ID,
          name,
          customerClass,
          email,
          totalQuantity,
          unitPrice: orderItems.length === 1 ? (Number(orderItems[0].unitPrice) || SHIRT_PRICE) : null,
          totalPrice,
          items: orderPayload.items
        }));
      } catch (error) {}

      sendOrderMessage.textContent = `Bestellnummer ${orderNumber} vergeben. Bestellung wird gesendet …`;
      orderForm.submit();
    } catch (error) {
      console.error("Bestellung konnte nicht gespeichert werden:", error);
      sendOrderMessage.classList.remove("success");
      sendOrderMessage.textContent = "Die Bestellung konnte nicht gespeichert werden. Bitte kurz erneut versuchen.";
      if (sendOrderBtn) sendOrderBtn.disabled = false;
    }
  });
}


// Startzustand. Feste Shopfarben haben Vorrang vor der allgemeinen Auswahl.
const FIXED_SHIRT = SHOP.fixedShirtColor || null;
const FIXED_MOTIF = SHOP.fixedMotifColor || null;

if (FIXED_SHIRT && FIXED_SHIRT.color) {
  changeShirtColor(
    FIXED_SHIRT.color,
    FIXED_SHIRT.name || "Festfarbe",
    FIXED_SHIRT.id || "fixed-shirt-color",
    FIXED_SHIRT.pattern || ""
  );
} else {
  changeShirtColor("#ffffff", "White", "weiss", "");
}

if (FIXED_MOTIF && FIXED_MOTIF.color) {
  currentMotifColor = FIXED_MOTIF.color;
  currentMotifColorLabel = FIXED_MOTIF.name || "Festfarbe";
  currentMotifColorName.textContent = currentMotifColorLabel;
}
updateActiveMotifColorButton(currentMotifColor, currentMotifColorLabel);
async function initializeFixedPrints() {
  const fixed = SHOP.fixedPrint || {};
  const motifById = (id) => Array.from(motifButtons).find(btn => btn.dataset.motif === id) || motifButtons[0];
  if (fixed.front?.enabled) {
    const btn = motifById(fixed.front.motifId);
    if (btn) await addMotifToView("front", btn.dataset.motif, btn.dataset.src, true);
  } else if (FEATURES.autoSelectSingleMotif && motifButtons.length === 1 && FEATURES.motifMode === "single") {
    const only = motifButtons[0];
    await addSelectedMotif(only.dataset.motif, only.dataset.src);
  }
  if (fixed.back?.enabled) {
    const btn = motifById(fixed.back.motifId);
    if (btn) await addMotifToView("back", btn.dataset.motif, btn.dataset.src, false);
  }
  if (currentView !== "front") switchView("front");
  applyPreviewMode();
  if (FEATURES.previewMode === "dual") await renderDualPreview();
}
applyPreviewMode();
initializeFixedPrints();
