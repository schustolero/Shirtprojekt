// Shop-/Vereinsbranding aus shop-config.js anwenden.
(function initThemeToggle(){
  const root=document.documentElement;
  root.dataset.theme="light";
  try{localStorage.setItem("shirtprojekt-theme","light")}catch(e){}
  document.getElementById("themeToggle")?.remove();
})();
const SHOP = window.SHOP_CONFIG || {};
const MASTER_FIXED_CHEST_LOGO = typeof SHOP.features?.fixedFrontChestLogo === "boolean"
  ? SHOP.features.fixedFrontChestLogo
  : SHOP.isMasterTemplate === true || SHOP.customerId === "_master" || SHOP.templateSource === "_master";
const FEATURES = Object.assign({
  layout: "simple",
  motifMode: "single",          // single | multiple | upload | mixed
  allowCustomerUpload: false,
  allowText: false,
  allowInitials: false,
  allowMoveMotif: false,
  allowResizeMotif: false,
  allowRotateMotif: false,
  allowBackDesign: true,
  allowMotifColor: true,
  showShirtColorPicker: true,
  showMotifPicker: true,
  showMotifColorPicker: true,
  showPrices: false,
  showNexaroBranding: true,
  autoSelectSingleMotif: false,
  showResetButton: true,
  maxUploadMB: 8
}, SHOP.features || {});
if(SHOP.features && Object.prototype.hasOwnProperty.call(SHOP.features,"allowInitials")){
  FEATURES.allowInitials=!!SHOP.features.allowInitials;
}else if(String(SHOP.customerId||"")!=="tg-solingen"){
  FEATURES.allowInitials=true;
}

function featureEnabled(name) { return FEATURES[name] !== false; }

function enforceCustomerPriceVisibility() {
  if (FEATURES.showPrices !== false) return;
  document.querySelectorAll(".product-btn-price,.order-price-info,#addToOrderPrice,.cart-item-price,#cartTotal,#checkoutTotal,#pricePatch").forEach(element => {
    if (element.style.getPropertyValue("display") !== "none" || element.style.getPropertyPriority("display") !== "important") {
      element.style.setProperty("display", "none", "important");
    }
  });
}

function syncMobileAfterShirtControls() {
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  const designerArea = document.querySelector(".designer-area");
  const productSection = document.getElementById("productSection");
  const shirtColorSection = document.querySelector(".color-section");
  const logoChoice = document.querySelector(".product-motif-choice-section");
  const initials = document.querySelector(".initials-section");
  if (!designerArea || (!logoChoice && !initials && !productSection)) return;

  let host = document.getElementById("mobileAfterShirtControls");
  if (mobile) {
    if (!host) {
      host = document.createElement("div");
      host.id = "mobileAfterShirtControls";
      host.className = "mobile-after-shirt-controls";
    }
    const workspace = document.querySelector(".workspace");
    const dualWorkspace = document.getElementById("dualWorkspace");
    const anchor = dualWorkspace && !dualWorkspace.hidden ? dualWorkspace : workspace;
    if (anchor) anchor.insertAdjacentElement("afterend", host);
    if (logoChoice) host.appendChild(logoChoice);
    if (initials && FEATURES.allowInitials) host.appendChild(initials);
    if (productSection) host.appendChild(productSection);
    return;
  }

  const sidebar=document.querySelector(".sidebar");
  const motifSection=sidebar?.querySelector(".club-logo-section")||sidebar?.querySelector(".motif-section");
  if (productSection && sidebar && productSection.parentElement!==sidebar) {
    sidebar.insertBefore(productSection,motifSection||sidebar.querySelector(".view-section")||null);
  }
  if (logoChoice && productSection) productSection.insertAdjacentElement("afterend", logoChoice);
  if (initials && productSection) productSection.insertAdjacentElement("afterend", initials);
  host?.remove();
}

window.matchMedia("(max-width: 900px)").addEventListener?.("change", syncMobileAfterShirtControls);

const F140_ALLOWED_META = (function parseAllowedShirtColorMeta(){
  const fixed = SHOP.fixedShirtColor || null;
  const result = { fixed, name: fixed?.name || "", defaultId: fixed?.id || "", allowedIds: [] };
  if (!fixed || !fixed.name) return result;
  const parts = String(fixed.name).split("||");
  result.name = (parts.shift() || result.name || "").trim();
  parts.forEach(part => {
    if (part.indexOf("default=") === 0) result.defaultId = part.slice(8).trim();
    if (part.indexOf("allowed=") === 0) result.allowedIds = part.slice(8).split(",").map(item => item.trim()).filter(Boolean);
  });
  if (result.defaultId === "weiss") result.defaultId = "white";
  result.allowedIds = result.allowedIds.map(id => id === "weiss" ? "white" : id);
  return result;
})();
function getAllowedShirtColorIds(){
  return Array.isArray(F140_ALLOWED_META.allowedIds) && F140_ALLOWED_META.allowedIds.length ? F140_ALLOWED_META.allowedIds : null;
}

const POLIFLEX_ALLOWED_META = (function parseAllowedMotifColorMeta(){
  const fixed = SHOP.fixedMotifColor || null;
  const result = { fixed, name: fixed?.name || "Yellow", allowedNames: [] };
  if (!fixed || !fixed.name) return result;
  const parts = String(fixed.name).split("||");
  result.name = (parts.shift() || result.name || "Yellow").trim();
  parts.forEach(part => {
    if (part.indexOf("allowed=") === 0) {
      try { result.allowedNames = JSON.parse(decodeURIComponent(part.slice(8))); } catch (e) { result.allowedNames = []; }
    }
  });
  return result;
})();
function getAllowedMotifColorNames(){
  return Array.isArray(POLIFLEX_ALLOWED_META.allowedNames) && POLIFLEX_ALLOWED_META.allowedNames.length ? POLIFLEX_ALLOWED_META.allowedNames : null;
}
(function applyShopConfig() {
  const cfg = SHOP;
  document.body.dataset.customerId = String(cfg.customerId || window.SHOP_SLUG || "");
  if (String(cfg.customerId || window.SHOP_SLUG || "").startsWith("_")) document.body.dataset.templateShop = "true";
  if (cfg.pageTitle) document.title = cfg.pageTitle;
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };
  const logoIsWordmark=/dein-logo/i.test(String(cfg.logoFile||""));
  const titleEl=document.getElementById("brandTitle");
  if(logoIsWordmark){
    if(titleEl){ titleEl.textContent=""; titleEl.hidden=true; }
  }else{
    setText("brandTitle", cfg.brandTitle || cfg.customerName || "");
    if(titleEl) titleEl.hidden=false;
  }
  setText("brandSubtitle", cfg.brandSubtitle);
  setText("designerHeading", cfg.designerHeading);
  setText("designerIntro", cfg.designerIntro);
  const isTGSolingen = String(cfg.customerId || window.SHOP_SLUG || "") === "tg-solingen";
  setText("customerExtraFieldLabel", isTGSolingen ? "Verein / Firma *" : `${cfg.customerExtraFieldLabel || "Team / Abteilung"} *`);
  if (isTGSolingen) {
    const nameLabel = document.querySelector('#customerName')?.closest('label')?.querySelector('span');
    const phoneLabel = document.querySelector('#customerPhone')?.closest('label')?.querySelector('span');
    const extraField = document.getElementById("customerClass");
    if (nameLabel) nameLabel.textContent = "Vor- und Nachname *";
    if (phoneLabel) phoneLabel.innerHTML = 'WhatsApp <small>(optional)</small>';
    if (extraField) extraField.name = "Verein / Firma";
  }
  setText("orderEmailDisplay", cfg.orderEmail);
  if (cfg.accentColor) document.documentElement.style.setProperty("--accent", cfg.accentColor);

  const extraField = document.getElementById("customerClass");
  if (extraField && cfg.customerExtraFieldName && !isTGSolingen) extraField.name = cfg.customerExtraFieldName;
  const orderForm = document.getElementById("orderForm");
  if (orderForm && cfg.orderEmail) orderForm.action = `https://formsubmit.co/${String(cfg.orderEmail).trim()}`;
  const subject = document.getElementById("formSubject");
  if (subject && cfg.orderSubject) subject.value = cfg.orderSubject;
  const next = document.getElementById("formNext");
  if (next) next.value = new URL(`/danke.html?shop=${encodeURIComponent(cfg.customerId || window.SHOP_SLUG || "")}`, window.location.origin).href;

  document.querySelectorAll(".shop-brand-logo").forEach(el=>el.remove());
  if (cfg.logoFile) {
    const header = document.querySelector(".designer-header");
    const host = header || document.querySelector(".brand");
    if (host) {
      const img = document.createElement("img");
      img.src = window.shopAssetUrl ? window.shopAssetUrl(cfg.logoFile) : cfg.logoFile;
      img.alt = cfg.brandTitle || "Shop Logo";
      img.className = "shop-brand-logo";
      img.style.height = `${Number(cfg.logoHeight) || 48}px`;
      img.onerror = () => img.remove();
      host.insertBefore(img, host.firstChild);
    }
  }

  document.body.dataset.shopLayout = FEATURES.layout || "simple";
  document.body.dataset.showPrices = FEATURES.showPrices === false ? "false" : "true";
  enforceCustomerPriceVisibility();
  if (FEATURES.showPrices === false) {
    new MutationObserver(enforceCustomerPriceVisibility).observe(document.body, { childList: true, subtree: true });
  }

  const shirtColorSection = document.querySelector(".color-section");
  const motifSection = document.querySelector(".motif-section");
  const motifColorSection = document.querySelector(".motif-color-section");
  const viewSection = document.querySelector(".view-section");
  const productSection = document.getElementById("productSection");
  const orderSection = document.querySelector(".order-section");
  const motifHelp = document.querySelector(".motif-help");
  const backButton = document.querySelector('.view-btn[data-view="back"]');
  const resetSection = document.querySelector('.sidebar-bottom');

  const hasPresetMotifs = Array.isArray(cfg.motifs) && cfg.motifs.some(motif=>motif?.file && motif.customerSelectable!==false);
  const showPresetMotifs = hasPresetMotifs && !["upload"].includes(FEATURES.motifMode);
  const allowedShirtColorIds = getAllowedShirtColorIds();
  if (shirtColorSection && allowedShirtColorIds && allowedShirtColorIds.length) {
    shirtColorSection.dataset.allowedColorIds = allowedShirtColorIds.join(",");
  }
  if (shirtColorSection) {
    shirtColorSection.hidden = FEATURES.showShirtColorPicker === false;
    if (FEATURES.showShirtColorPicker !== false) shirtColorSection.removeAttribute("hidden");
  }
  if (motifSection) motifSection.hidden = !showPresetMotifs || FEATURES.showMotifPicker === false;
  const allowedMotifColorNames = getAllowedMotifColorNames();
  if (motifColorSection && allowedMotifColorNames && allowedMotifColorNames.length) {
    motifColorSection.querySelectorAll(".motif-color").forEach((button) => {
      if (!allowedMotifColorNames.includes(button.dataset.name)) button.remove();
    });
  }
  if (motifColorSection) motifColorSection.hidden = !FEATURES.allowMotifColor || FEATURES.showMotifColorPicker === false;
  if (backButton) backButton.hidden = !FEATURES.allowBackDesign;
  if (viewSection && !FEATURES.allowBackDesign) viewSection.hidden = true;
  if (resetSection && FEATURES.showResetButton === false) resetSection.remove();
  if (motifHelp) {
    motifHelp.textContent = !MASTER_FIXED_CHEST_LOGO && (FEATURES.allowMoveMotif || FEATURES.allowResizeMotif)
      ? "Motiv auswählen und anschließend auf dem Shirt anpassen."
      : "Motiv auswählen. Es wird automatisch fest platziert.";
  }

  const isHansa = String(cfg.customerId || window.SHOP_SLUG || "") === "hansa";
  if (isHansa) {
    document.body.dataset.shopStructure = "solingen";
    const sidebar = document.querySelector(".sidebar");
    [viewSection,productSection,motifSection,shirtColorSection,motifColorSection,orderSection].forEach(section=>{
      if(sidebar && section) sidebar.appendChild(section);
    });
    const makePaletteCompact=(section,selector,label)=>{
      const palette=section?.querySelector(selector);
      if(!palette || section.querySelector(".hansa-palette-toggle")) return;
      palette.classList.add("hansa-collapsible-palette");
      const button=document.createElement("button");
      button.type="button";
      button.className="hansa-palette-toggle";
      button.textContent=`Alle ${label} anzeigen`;
      button.addEventListener("click",()=>{
        const expanded=palette.classList.toggle("is-expanded");
        button.textContent=expanded?`${label} einklappen`:`Alle ${label} anzeigen`;
      });
      palette.insertAdjacentElement("afterend",button);
    };
    // Textilfarben bleiben vollständig sichtbar; kein zusätzlicher Aufklappknopf.
    makePaletteCompact(motifColorSection,".motif-colors","Druckfarben");
  }

  // In jedem Shop: Textilwahl vor Motiven, Motive vor Textilfarbe.
  const sidebar = document.querySelector(".sidebar");
  if (sidebar && motifSection && shirtColorSection && shirtColorSection.parentNode === sidebar) {
    sidebar.insertBefore(motifSection, shirtColorSection);
  }
  if (sidebar && productSection && motifSection && motifSection.parentNode === sidebar) {
    sidebar.insertBefore(productSection, motifSection);
  }

  const insertAfter = (reference, node) => reference && reference.parentNode && reference.parentNode.insertBefore(node, reference.nextSibling);

  // Eigene Bilddateien ergänzen die vorbereiteten Vereinslogos, wenn der Shop den Upload erlaubt.
  if (FEATURES.allowCustomerUpload) {
    const uploadSection = document.createElement("section");
    uploadSection.className = "tool-section customer-upload-section";
    uploadSection.innerHTML = `
      <h3>Eigene Datei</h3>
      <label class="upload-btn">Bild hochladen<input id="customerLogoUpload" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" aria-label="Eigenes Motiv hochladen"></label>
      <p class="hint">PNG, JPG, WEBP oder SVG · max. ${Number(FEATURES.maxUploadMB) || 8} MB</p>
      <p class="upload-file-name" aria-live="polite" hidden></p>`;
    insertAfter(motifSection || document.querySelector(".color-section"), uploadSection);
  }

  if (FEATURES.allowText) {
    const textSection = document.createElement("section");
    textSection.className = "tool-section text-section";
    textSection.innerHTML = `
      <h3>Eigener Text</h3>
      <div class="feature-row"><input id="customTextInput" class="feature-input" type="text" maxlength="40" placeholder="Text eingeben"><button id="addTextBtn" type="button" class="secondary-btn compact-btn">Hinzufügen</button></div>
      <select id="customTextFont" hidden aria-label="Schriftart"><option value="Arial">Arial</option></select>`;
    const anchor = document.querySelector(".customer-upload-section") || motifSection || document.querySelector(".color-section");
    insertAfter(anchor && anchor.parentNode === sidebar ? anchor : motifSection, textSection);
  }

  if(typeof ensureInitialsField==="function") ensureInitialsField();
  const initialsField=document.getElementById("initialsInput");
  const initialsPop=document.getElementById("initialsPop");
  const initialsTab=document.getElementById("initialsTab");
  if(initialsTab) initialsTab.hidden=true;
  if(initialsPop){
    initialsPop.hidden=!FEATURES.allowInitials;
    if(FEATURES.allowInitials) initialsPop.removeAttribute("hidden");
  }
  if(initialsField){
    initialsField.maxLength=3;
    initialsField.setAttribute("maxlength","3");
  }
  queueMicrotask(()=>{ if(typeof updateInitialsOnCanvas==="function") updateInitialsOnCanvas(); });

  const footer = document.querySelector(".designer-footer");
  if (footer) {
    footer.textContent = !MASTER_FIXED_CHEST_LOGO && (FEATURES.allowMoveMotif || FEATURES.allowResizeMotif)
      ? "Element auswählen und direkt auf dem Shirt positionieren."
      : "Das gewählte Motiv wird automatisch auf dem Shirt platziert.";
  }

  const motifGrid = document.getElementById("motifGrid");
  if (motifGrid) {
    motifGrid.replaceChildren();
    const noneBtn=document.createElement("button");
    noneBtn.type="button";
    noneBtn.className="motif-btn motif-btn-off";
    noneBtn.dataset.motif="none";
    noneBtn.dataset.src="";
    noneBtn.setAttribute("aria-label","Kein Logo");
    noneBtn.innerHTML='<span class="motif-preview motif-preview-off" aria-hidden="true"></span><span>Kein Logo</span>';
    if(cfg.customerId!=="hansa") motifGrid.appendChild(noneBtn);
  }
  if (motifGrid && Array.isArray(cfg.motifs)) {
    cfg.motifs.forEach((motif) => {
      // Die neue Logo-Bibliothek wird ausschließlich im Admin verwaltet.
      if (!motif || !motif.id || !motif.file || motif.customerSelectable===false) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "motif-btn";
      btn.dataset.motif = motif.id;
      btn.dataset.src = window.shopAssetUrl ? window.shopAssetUrl(motif.file) : motif.file;
      btn.dataset.preserveColors = motif.preserveColors ? "true" : "false";
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

  if(motifGrid && motifSection){
    const clubMotifs=(cfg.motifs||[]).filter(m=>m?.file && m.customerSelectable!==false &&
      (m.category==="club" || (m.category!=="general" && /vereinslogo|vereinswappen/i.test(m.name||""))));
    const clubSection=document.createElement("section");
    clubSection.className="tool-section club-logo-section";
    clubSection.innerHTML='<h3>Vereinslogos</h3><p class="hint">Vom Verein vorbereitete Logos für diesen Shop.</p><div class="motif-grid club-logo-grid"></div>';
    const clubGrid=clubSection.querySelector(".club-logo-grid");
    const none=motifGrid.querySelector('.motif-btn[data-motif="none"]');
    if(none && clubMotifs.length && FEATURES.showClubLogos!==false) clubGrid.appendChild(none);
    for(const motif of clubMotifs){
      const button=Array.from(motifGrid.querySelectorAll(".motif-btn")).find(item=>item.dataset.motif===motif.id);
      if(button) clubGrid.appendChild(button);
    }
    if(!clubMotifs.length){
      const empty=document.createElement("p");empty.className="hint club-logo-empty";
      empty.textContent="Hier erscheinen die im Admin freigegebenen Vereinslogos.";
      clubSection.appendChild(empty);
    }
    motifSection.insertAdjacentElement("beforebegin",clubSection);
    clubSection.hidden=FEATURES.showClubLogos===false || !clubMotifs.length;
    motifSection.hidden=!motifGrid.querySelector('.motif-btn[data-src]') || FEATURES.showMotifPicker===false;
    motifSection.querySelector("h3").textContent="Logos";
  }

  (function dockColorRailNextToShirt(){
    const workspace=document.querySelector(".workspace");
    if(!shirtColorSection || !workspace) return;
    const show=FEATURES.showShirtColorPicker!==false;
    shirtColorSection.hidden=!show;
    if(show) shirtColorSection.removeAttribute("hidden");
    if(!show){
      shirtColorSection.classList.remove("color-rail");
      workspace.classList.remove("has-color-rail");
      return;
    }
    shirtColorSection.classList.add("color-rail");
    workspace.classList.add("has-color-rail");
    if(shirtColorSection.parentElement!==workspace){
      workspace.insertBefore(shirtColorSection, workspace.firstChild);
    }
    shirtColorSection.querySelector(".rail-nav")?.remove();
    const palette=shirtColorSection.querySelector(".shirt-colors");
    if(palette){
      palette.classList.add("is-scrollable");
      const syncFade=()=>{
        const top=palette.scrollTop>4;
        const more=palette.scrollHeight-palette.scrollTop-palette.clientHeight>8;
        palette.classList.toggle("has-more-top",top);
        palette.classList.toggle("has-more-bottom",more);
      };
      palette.onscroll=syncFade;
      requestAnimationFrame(syncFade);
    }
    document.querySelectorAll(".shirt-color").forEach(button=>{
      let hex=button.dataset.color||"";
      if(!hex && typeof MASTER_COLOR_VARIANTS==="object"){
        for(const list of Object.values(MASTER_COLOR_VARIANTS)){
          const hit=(list||[]).find(item=>item.id===button.dataset.id);
          if(hit?.color){hex=hit.color;break;}
        }
      }
      hex=hex||"#888888";
      button.dataset.color=hex;
      button.style.setProperty("--swatch",hex);
      button.style.background=hex;
    });
  })();
})();

setTimeout(() => document.body.classList.remove("shop-loading"), 400);
document.body.classList.remove("shop-loading");

// v28.2.3: Die sichtbare Druckzone bekommt zusätzliche Reserve NUR nach oben.
// Dadurch können große Motive höher positioniert werden, ohne am Canvas-Rand abgeschnitten zu werden.
const PRINT_BASE_WIDTH = 260;
const PRINT_BASE_HEIGHT = 340;
const PRINT_HEADROOM = 135;
const PRINT_CANVAS_WIDTH = 320;
const PRINT_CANVAS_HEIGHT = 500;
const PRINT_SIDE_MARGIN = 30;
const CUSTOMER_UPLOAD_CENTER_X = PRINT_CANVAS_WIDTH / 2;
const CUSTOMER_UPLOAD_CENTER_Y = PRINT_HEADROOM + PRINT_BASE_HEIGHT / 2;

let canvas;
try{
  canvas = new fabric.Canvas("designCanvas", {
    width: PRINT_CANVAS_WIDTH,
    height: PRINT_CANVAS_HEIGHT,
    backgroundColor: "transparent",
    selection: true,
    preserveObjectStacking: true,
    uniformScaling: true,
    uniScaleKey: null
  });
}catch(err){
  console.error("Canvas start failed", err);
  canvas = { getObjects(){return [];}, requestRenderAll(){}, add(){}, remove(){}, clear(){}, setWidth(){}, setHeight(){}, on(){}, off(){}, renderAll(){}, getActiveObject(){return null;}, discardActiveObject(){}, setActiveObject(){} };
}

// Canvas intern mit der tatsächlich angezeigten Pixelauflösung zeichnen.
// Der logische Druck-Koordinatenraum bleibt unverändert bei 320 x 500.
if(canvas.lowerCanvasEl && typeof canvas.setDimensions==="function"){
  let previewPixelRatio=0;
  const displayPixelRatio=()=>{
    const box=canvas.lowerCanvasEl.getBoundingClientRect();
    return Math.max(1,Number(window.devicePixelRatio)||1)*Math.max(1,box.width/PRINT_CANVAS_WIDTH,box.height/PRINT_CANVAS_HEIGHT);
  };
  canvas.getRetinaScaling=()=>displayPixelRatio();
  const refreshPreviewResolution=()=>{
    const ratio=displayPixelRatio();
    if(Math.abs(ratio-previewPixelRatio)<0.01) return;
    previewPixelRatio=ratio;
    canvas.setDimensions({width:PRINT_CANVAS_WIDTH,height:PRINT_CANVAS_HEIGHT});
    canvas.requestRenderAll();
  };
  if(typeof ResizeObserver!=="undefined"){
    new ResizeObserver(refreshPreviewResolution).observe(canvas.lowerCanvasEl.parentElement);
  }
  window.addEventListener("resize",refreshPreviewResolution,{passive:true});
  requestAnimationFrame(refreshPreviewResolution);
}

const resetBtn = document.getElementById("resetBtn");
const viewButtons = document.querySelectorAll(".view-btn");
let shirtColorButtons = document.querySelectorAll(".shirt-color");
const motifButtons = document.querySelectorAll(".motif-btn");
const motifColorButtons = document.querySelectorAll(".motif-color");
const shirtMockup = document.getElementById("shirtMockup");
const currentColorName = document.getElementById("currentColorName");
const currentMotifColorName = document.getElementById("currentMotifColorName");
const designerStatus = document.getElementById("designerStatus");
const printZone = document.getElementById("printZone");
const workspace = document.querySelector(".workspace");
// Auswahlrahmen für eigene Bilder und Texte: vier direkt bedienbare Eckgriffe.
function renderCustomerControl(icon,small=false){
  return function(ctx,left,top,_style,object){
    const size=small?object.cornerSize*.32:object.cornerSize;
    ctx.save();ctx.translate(left,top);
    ctx.beginPath();ctx.arc(0,0,size/2,0,Math.PI*2);
    ctx.fillStyle="#ffffff";ctx.fill();ctx.strokeStyle="#249ca9";
    ctx.lineWidth=Math.max(.7,size*.025);ctx.stroke();
    if(!small){
      ctx.scale(size/28,size/28);ctx.strokeStyle="#33454a";ctx.fillStyle="#33454a";
      ctx.lineWidth=1.5;ctx.lineCap="round";ctx.lineJoin="round";
      ctx.beginPath();
      if(icon==="move"){
        ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.moveTo(0,-7);ctx.lineTo(0,7);
        for(const [x,y,dx,dy] of [[-7,0,1,0],[7,0,-1,0],[0,-7,0,1],[0,7,0,-1]]){
          ctx.moveTo(x+dx*3+dy*2,y+dy*3+dx*2);ctx.lineTo(x,y);ctx.lineTo(x+dx*3-dy*2,y+dy*3-dx*2);
        }
      }else if(icon==="rotate"){
        ctx.arc(0,0,5.5,.45,Math.PI*1.85);
        ctx.moveTo(5,-6);ctx.lineTo(5.5,-1);ctx.lineTo(.5,-2);
      }else if(icon==="delete"){
        ctx.moveTo(-5,-4);ctx.lineTo(-4,6);ctx.lineTo(4,6);ctx.lineTo(5,-4);
        ctx.moveTo(-6,-4);ctx.lineTo(6,-4);ctx.moveTo(-2,-4);ctx.lineTo(-2,-7);ctx.lineTo(2,-7);ctx.lineTo(2,-4);
        ctx.moveTo(-1.5,-1);ctx.lineTo(-1.5,3.5);ctx.moveTo(1.5,-1);ctx.lineTo(1.5,3.5);
      }else{
        ctx.moveTo(-6,6);ctx.lineTo(6,-6);ctx.moveTo(-6,1);ctx.lineTo(-6,6);ctx.lineTo(-1,6);
        ctx.moveTo(1,-6);ctx.lineTo(6,-6);ctx.lineTo(6,-1);
      }
      ctx.stroke();
    }
    ctx.restore();
  };
}
function sizeCustomerControls(object){
  const width=canvas.upperCanvasEl?.getBoundingClientRect().width||canvas.width;
  const ratio=Math.max(.2,width/canvas.width);
  object.cornerSize=28/ratio;object.touchCornerSize=44/ratio;
  Object.values(object.controls).forEach(control=>{
    const size=control.isCustomerMidpoint?object.cornerSize*.32:object.cornerSize;
    control.sizeX=control.sizeY=size;
    control.touchSizeX=control.touchSizeY=object.touchCornerSize;
  });
  object.setCoords();
}
function configureCustomerControls(object){
  if(!["text","upload"].includes(object?.motifKind)||!fabric.Control)return;
  const actions=fabric.controlsUtils;
  object.set({hasControls:true,hasBorders:true,borderColor:"#249ca9",borderDashArray:[9,6],
    borderScaleFactor:1.1,padding:6,transparentCorners:false,lockScalingFlip:true,
    lockRotation:false,lockScalingX:false,lockScalingY:false,lockMovementX:false,lockMovementY:false});
  const control=(x,y,icon,handler,action,cursor)=>new fabric.Control({x,y,
    actionHandler:handler,actionName:action,cursorStyle:cursor,render:renderCustomerControl(icon)});
  object.controls={
    tl:control(-.5,-.5,"move",actions.dragHandler,"drag","move"),
    tr:control(.5,-.5,"rotate",actions.rotationWithSnapping,"rotate","crosshair"),
    bl:new fabric.Control({x:-.5,y:.5,cursorStyle:"pointer",render:renderCustomerControl("delete"),
      mouseUpHandler:(_event,transform)=>{
        const target=transform.target;target.canvas?.remove(target);
        canvas.discardActiveObject();canvas.requestRenderAll();saveCurrentView();
        syncCustomerUploadControls();
        if(FEATURES.previewMode==="dual") void renderDualPreview();
        return true;
      }}),
    br:control(.5,.5,"scale",actions.scalingEqually,"scale","nwse-resize")
  };
  for(const [key,x,y] of [["mt",0,-.5],["mb",0,.5],["ml",-.5,0],["mr",.5,0]]){
    object.controls[key]=new fabric.Control({x,y,isCustomerMidpoint:true,actionName:"scale",
      actionHandler:actions.scalingEqually,cursorStyle:"nwse-resize",render:renderCustomerControl("scale",true)});
  }
  object.setControlsVisibility?.({tl:true,tr:true,bl:true,br:true,mt:true,mb:true,ml:true,mr:true,mtr:false});
  sizeCustomerControls(object);
}
canvas.on("object:added",event=>{
  configureCustomerControls(event.target);
  if(event.target?.motifKind==="text")keepCustomerTextOnShirt(event.target);
});
canvas.on("selection:created",event=>{if(["text","upload"].includes(event.selected?.[0]?.motifKind))sizeCustomerControls(event.selected[0])});
canvas.on("selection:updated",event=>{if(["text","upload"].includes(event.selected?.[0]?.motifKind))sizeCustomerControls(event.selected[0])});
window.addEventListener("resize",()=>{
  canvas.getObjects().filter(object=>["text","upload"].includes(object.motifKind)).forEach(sizeCustomerControls);
  canvas.requestRenderAll();
},{passive:true});
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
let logoEnabled = true;
let currentShirtColor = "#ffffff";
let currentShirtColorId = "white";
let currentPattern = "";
let currentMotifColor = "#000000";
let currentMotifColorLabel = "Black";

const viewStates = { front: null, back: null };
const baseImages = { front: null, back: null };
let dualBaseImage = null;
const motifSourceCache = new Map();
const configuredProducts = Array.isArray(SHOP.products) ? SHOP.products.filter(product => product && product.enabled !== false) : [];
const PRODUCTS = configuredProducts.length ? configuredProducts : [{
  id: "tshirt", name: "T-Shirt", price: Number(SHOP.shirtPrice) || 15,
  frontTemplate: "shirt-front-template.png", backTemplate: "shirt-back-template.png"
}];
function ensureProductColorButtons(products){
  const host=document.querySelector(".shirt-colors");
  if(!host) return;
  const existing=new Map(Array.from(host.querySelectorAll(".shirt-color")).map(button=>[button.dataset.id,button]));
  products.forEach(product=>(product.colorVariants||[]).forEach(variant=>{
    if(!variant?.id || existing.has(variant.id)) return;
    const button=document.createElement("button");
    button.type="button";
    button.className="shirt-color";
    button.dataset.id=variant.id;
    button.dataset.name=variant.name||variant.id;
    button.dataset.color=variant.color||"#777777";
    if(variant.pattern) button.dataset.pattern=variant.pattern;
    button.setAttribute("aria-label",button.dataset.name);
    button.title=button.dataset.name;
    button.style.setProperty("--swatch",button.dataset.color);
    button.querySelector(".color-disc")?.setAttribute("fill",button.dataset.color);
    button.innerHTML=`<span class="color-swatch"></span><span class="color-label"></span>`;
    button.querySelector(".color-label").textContent=button.dataset.name;
    host.appendChild(button);
    existing.set(variant.id,button);
  }));
}
ensureProductColorButtons(PRODUCTS);
shirtColorButtons=document.querySelectorAll(".shirt-color");
let currentProductId = PRODUCTS[0].id;
const productMotifSelections = {};
const selectedLogoByProduct = {};
let productMotifChoiceSection = null;
function getCurrentProduct() { return PRODUCTS.find(p => p.id === currentProductId) || PRODUCTS[0]; }
function syncProductPrintSideControls(){
  const backOnly=getCurrentProduct().printSide==="back";
  const frontButton=document.querySelector('.view-btn[data-view="front"]');
  if(frontButton) frontButton.hidden=backOnly;
  if(backOnly && currentView!=="back") switchView("back");
}
function getCurrentUnitPrice() { return Number(getCurrentProduct().price ?? SHOP.shirtPrice) || 0; }

function getProductMotifMode(productId=currentProductId){
  return SHOP.productMotifModes?.[productId] || "normal";
}

function getMotifButtonByKind(kind){
  const buttons=Array.from(document.querySelectorAll(".motif-btn"));
  const usable=buttons.filter(button=>button.dataset.motif && button.dataset.motif!=="none" && button.dataset.src &&
    (!MASTER_FIXED_CHEST_LOGO || !button.closest("section")?.hidden));
  if(kind === "patch") return usable.find(button => button.dataset.motif === "tus-3d-patch") || null;
  return usable.find(button => button.dataset.motif === (selectedLogoByProduct[currentProductId]?.front || selectedLogoByProduct[currentProductId]) && button.dataset.motif !== "tus-3d-patch")
    || usable.find(button => button.dataset.motif !== "tus-3d-patch") || usable[0] || null;
}

function ensureProductMotifChoiceSection(){
  if(productMotifChoiceSection || !productSection) return productMotifChoiceSection;
  const section=document.createElement("section");
  section.className="tool-section product-motif-choice-section";
  section.hidden=true;
  section.innerHTML=`<h3>Logoart</h3><div class="product-motif-choice"><button type="button" data-logo-kind="normal">Vereinslogo</button><button type="button" data-logo-kind="patch">3D-Patch</button></div><p class="hint">Wähle die gewünschte Logoausführung.</p>`;
  productSection.insertAdjacentElement("afterend",section);
  section.querySelectorAll("[data-logo-kind]").forEach(button=>button.addEventListener("click",async()=>{
    productMotifSelections[currentProductId]=button.dataset.logoKind;
    await applyProductMotifRule(true);
  }));
  productMotifChoiceSection=section;
  syncMobileAfterShirtControls();
  return section;
}

async function applyProductMotifRule(force=false){
  if(!logoEnabled) return;
  const mode=getProductMotifMode();
  const section=ensureProductMotifChoiceSection();
  if(section) section.hidden=mode!=="both";
  const kind=mode==="patch" ? "patch" : (mode==="both" ? (productMotifSelections[currentProductId]||"normal") : "normal");
  if(section) section.querySelectorAll("[data-logo-kind]").forEach(button=>button.classList.toggle("active",button.dataset.logoKind===kind));
  const target=getMotifButtonByKind(kind);
  if(!target) return;
  const active=document.querySelector(".motif-btn.active");
  if(!force && active?.dataset.motif===target.dataset.motif) return;
  await addSelectedMotif(target.dataset.motif,target.dataset.src);
}

function updateSizeOptionsForCurrentSelection() {
  const select = document.getElementById("shirtSize");
  if (!select) return;
  const product = getCurrentProduct();
  const colorSizes = product?.sizesByColor?.[currentShirtColorId];
  const sizes = Array.isArray(colorSizes) && colorSizes.length
    ? colorSizes
    : (Array.isArray(product?.sizes) && product.sizes.length
      ? product.sizes
      : ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]);
  const previous = select.value;
  select.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Bitte wählen";
  select.appendChild(placeholder);
  sizes.forEach(size => {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size;
    select.appendChild(option);
  });
  select.value = sizes.includes(previous) ? previous : "";
  renderSizePills();
}

function applyProductColorRules(product, forceDefault = false) {
  const article=product?.articleNo || ({tshirt:"F140",polo:"F502",hoodie:"F421",jc001:"JC001",sport:"JC001",bcwu01w:"BCWU01W",sweatshirt:"BCWU01W",jh050:"JH050",s279:"S279"})[product?.id];
  const catalog=typeof MASTER_COLOR_VARIANTS!=="undefined" && Array.isArray(MASTER_COLOR_VARIANTS[article]) ? MASTER_COLOR_VARIANTS[article] : [];
  const variants=Array.isArray(product?.colorVariants)&&product.colorVariants.length ? product.colorVariants : catalog;
  const variantMap=new Map(variants.map(variant=>[variant.id,variant]));
  const allowed = Array.isArray(product?.allowedShirtColorIds) && product.allowedShirtColorIds.length
    ? product.allowedShirtColorIds
    : variants.map(variant=>variant.id);
  const catalogIds=new Set(catalog.map(variant=>variant.id));
  const shopAllowed=getAllowedShirtColorIds();
  const labels = product?.shirtColorLabels || {};
  shirtColorButtons.forEach(button => {
    if (!button.dataset.baseName) button.dataset.baseName = button.dataset.name || "";
    if (!button.dataset.baseColor) button.dataset.baseColor = button.dataset.color || "#777777";
    if (!button.dataset.basePattern) button.dataset.basePattern = button.dataset.pattern || "";
    const variant=variantMap.get(button.dataset.id) || catalog.find(item=>item.id===button.dataset.id);
    const visible = allowed.includes(button.dataset.id)
      && (!catalogIds.size || catalogIds.has(button.dataset.id))
      && (!shopAllowed || shopAllowed.includes(button.dataset.id));
    button.hidden = !visible;
    button.disabled = !visible;
    button.setAttribute("aria-hidden",String(!visible));
    const label = labels[button.dataset.id] || variant?.name || button.dataset.baseName;
    button.dataset.color=product?.shirtColorHex?.[button.dataset.id] || variant?.color || button.dataset.baseColor;
    button.dataset.pattern=variant?.pattern || button.dataset.basePattern || "";
    button.style.setProperty("--swatch",button.dataset.color);
    button.dataset.name = label;
    button.setAttribute("aria-label", label);
    button.title = label;
    const labelNode = button.querySelector(".color-label");
    if (labelNode) labelNode.textContent = label;
  });

  const currentButton = Array.from(shirtColorButtons).find(button => button.dataset.id === currentShirtColorId && !button.hidden);
  const defaultId = product?.defaultShirtColorId || F140_ALLOWED_META.defaultId || allowed[0] || currentShirtColorId || "";
  const target = Array.from(shirtColorButtons).find(button => button.dataset.id === defaultId && !button.hidden)
    || Array.from(shirtColorButtons).find(button => !button.hidden);
  if (target && (forceDefault || !currentButton)) {
    changeShirtColor(target.dataset.color, target.dataset.name, target.dataset.id, target.dataset.pattern || "", false);
  }
  updateSizeOptionsForCurrentSelection();
}

function renderProductSelector() {
  if (!productSection || !productSwitch) return;
  productSection.hidden = PRODUCTS.length <= 1;
  productSwitch.replaceChildren();
  PRODUCTS.forEach(product => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "product-btn";
    btn.dataset.product = product.id;
    const productName = document.createElement("span");
    productName.className = "product-btn-name";
    const shortNames={tshirt:"T-Shirt",polo:"Polo",hoodie:"Hoodie",jc001:"Sport",sport:"Sport",bcwu01w:"Sweat",sweatshirt:"Sweat",jh050:"Zoodie",s279:"Damen V-Shirt"};
    productName.textContent = shortNames[product.id] || product.name || product.id;
    const pricePending=["jh050","s279"].includes(product.id) && !(Number(product.price)>0);
    const priceText = pricePending
      ? "Preis folgt" : formatEuro(Number(product.price ?? SHOP.shirtPrice) || 0);
    btn.dataset.price = priceText;
    const productPrice = document.createElement("small");
    productPrice.className = pricePending ? "product-btn-status" : "product-btn-price";
    productPrice.textContent = priceText;
    if (FEATURES.showPrices === false && !pricePending) productPrice.style.setProperty("display", "none", "important");
    btn.append(productName, productPrice);
    btn.classList.toggle("active", product.id === currentProductId);
    btn.setAttribute("aria-pressed", String(product.id === currentProductId));
    productSwitch.appendChild(btn);
  });
  updateProductPriceLabel();
  renderTextileIconRail();
}
function renderTextileIconRail(){
  const host=document.querySelector(".textile-icon-rail");if(!host)return;
  host.replaceChildren();
  const basic='<path d="M10 7 4 11l4 7 4-2v15h16V16l4 2 4-7-6-4-5-4c-1 5-9 5-10 0Z"/>';
  const long='<path d="m10 7-6 4 1 18 5 1 2-14v15h16V16l2 14 5-1 1-18-6-4-5-4c-1 5-9 5-10 0Z"/>';
  const hoodie=long+'<path d="M14 7c0-5 12-5 12 0l-6 5Z"/><path d="M15 24h10v5H15Z"/>';
  const polo=basic+'<path d="m14 5 6 6 6-6M20 11v8"/>';
  const vNeck=basic+'<path d="m15 4 5 8 5-8"/>';
  const sport=basic+'<path d="m10 9 5 7M30 9l-5 7"/>';
  PRODUCTS.forEach(product=>{
    const source=Array.from(productSwitch?.querySelectorAll(".product-btn")||[]).find(button=>button.dataset.product===product.id);
    const name=source?.querySelector(".product-btn-name")?.textContent||product.name||product.id;
    const id=product.id;
    const zipHoodie=hoodie+'<path d="M20 11v20M18 15h4M15 23h3m4 0h3"/>';
    const shape=id==="jh050"?zipHoodie:id==="s279"?vNeck:id==="hoodie"?hoodie:id==="polo"?polo:["sport","jc001"].includes(id)?sport:["sweatshirt","sweat","bcwu01w"].includes(id)?long:basic;
    const button=document.createElement("button");button.type="button";button.className="textile-icon-button";
    button.dataset.product=id;button.title=name;button.setAttribute("aria-label",name);
    button.classList.toggle("active",id===currentProductId);button.setAttribute("aria-pressed",String(id===currentProductId));
    const icon=document.createElementNS("http://www.w3.org/2000/svg","svg");icon.setAttribute("viewBox","0 0 40 36");icon.setAttribute("aria-hidden","true");icon.innerHTML=shape;
    const label=document.createElement("span");label.textContent=name;
    button.append(icon,label);
    button.addEventListener("click",()=>{source?.click();renderTextileIconRail()});
    host.appendChild(button);
  });
}
let productSelectionRequest=0;
// Ein gemeinsamer Handler bleibt auch nach einem Neuaufbau der Schaltflächen aktiv.
productSwitch?.addEventListener("click", async event => {
  const button=event.target.closest("button[data-product]");
  if(!button || !productSwitch.contains(button)) return;
  const product=PRODUCTS.find(item=>item.id===button.dataset.product);
  if(!product || product.id===currentProductId) return;
  const request=++productSelectionRequest;
  saveCurrentView();
  currentProductId=product.id;
  syncProductPrintSideControls();
  dualBaseImage=null;
  productSwitch.querySelectorAll("button[data-product]").forEach(item=>{
    const active=item.dataset.product===product.id;
    item.classList.toggle("active",active);
    item.setAttribute("aria-pressed",String(active));
  });
  renderTextileIconRail();
  updateProductPriceLabel();
  updateInitialsOnCanvas();
  try {
    applyProductColorRules(product,true);
    await renderShirt();
    if(request!==productSelectionRequest) return;
    if(!canvas.getObjects().some(obj=>obj?.motifKind==="upload")) await applyProductMotifRule(true);
    if(request!==productSelectionRequest) return;
    canvas.getObjects().forEach(obj=>{
      if(obj?.motifKind==="upload") restoreUploadedEditing(obj);
      else if(obj?.motifId) applyFixedMotifLayout(obj,obj.motifId);
    });
    canvas.requestRenderAll();
    saveCurrentView();
    syncCustomerUploadControls();
    if(FEATURES.previewMode==="dual") await renderDualPreview();
  } catch(error) { console.error("Produktwechsel:",error); }
});

// v29.9.6: Produktwechsel darf vor der späteren Order-Initialisierung nicht abbrechen.
function updateProductPriceLabel() {
  const product = getCurrentProduct();
  const unitPrice = getCurrentUnitPrice();
  const pricePending=["jh050","s279"].includes(product.id) && !(Number(product.price)>0);
  const qty = Math.max(1, Number(document.getElementById("shirtQuantity")?.value || 1));
  const liveAddLabel = document.getElementById("addToOrderLabel");
  const liveAddPrice = document.getElementById("addToOrderPrice");
  if (currentProductPrice) {
    currentProductPrice.textContent = pricePending?`${product.name || "Textil"} · Preis folgt`:`${formatEuro(unitPrice)} / Stück · ${product.name || "Textil"}`;
  }
  if (liveAddLabel) {
    liveAddLabel.textContent = pricePending?"Preis folgt":`${product.name || "Textil"} hinzufügen`;
  }
  if (liveAddPrice) {
    liveAddPrice.textContent = pricePending?"":formatEuro(unitPrice * qty);
  }
  const addButton=document.getElementById("addToOrderBtn");
  if(addButton) addButton.disabled=pricePending;
  const patch=document.getElementById("pricePatch");
  const patchValue=document.getElementById("pricePatchValue");
  if(patchValue) patchValue.textContent=formatEuro(unitPrice);
  const patchName=document.getElementById("pricePatchName");
  if(patchName) patchName.textContent=product.name||"Textil";
  if(patch) patch.hidden=FEATURES.showPrices===false;
}

function enhanceMotifColorCards() {
  // Pantone-/Zusatztexte bewusst ausgeblendet.
}

function updateActiveMotifColorButton(color, label) {
  const tool=document.querySelector('[data-design-tool="printColor"]');
  if(tool){
    const indicator=tool.querySelector('.print-color-indicator');
    if(indicator) indicator.style.backgroundColor=color||"#000000";
    tool.setAttribute("aria-label",`Druckfarbe ändern. Aktuell: ${label||color||"Schwarz"}`);
    tool.title=`Druckfarbe ändern · ${label||color||"Schwarz"}`;
  }
  motifColorButtons.forEach(button => {
    const matchesColor = (button.dataset.color || "").toLowerCase() === String(color || "").toLowerCase();
    const matchesLabel = (button.dataset.name || "") === (label || "");
    button.classList.toggle("active", matchesColor && matchesLabel);
  });
}

enhanceMotifColorCards();
renderProductSelector();
syncProductPrintSideControls();
try { applyProductColorRules(getCurrentProduct()); }
catch (err) { console.error("Produktfarben:", err); }

function getBaseSrc(view) {
  const product = getCurrentProduct();
  const raw = view === "back" ? (product.backTemplate || "shirt-back-template.png") : (product.frontTemplate || "shirt-front-template.png");
  if (/^(https?:)?\/\//i.test(raw) || /^(data|blob):/i.test(raw) || raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\.\//, "")}`;
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
    if (currentShirtColorId === "white" || currentShirtColorId === "weiss") return getBaseSrc(view);
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
    if (currentPattern === "heather" || currentPattern === "vintage") {
      const tile = document.createElement("canvas");
      tile.width = 72; tile.height = 72;
      const texture = tile.getContext("2d");
      let seed = currentPattern === "vintage" ? 9173 : 4817;
      const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
      texture.lineCap = "round";
      if (currentPattern === "heather") {
        for (let i = 0; i < 115; i++) {
          const x = random() * 72, y = random() * 72, len = 1.5 + random() * 5;
          texture.strokeStyle = random() > .28 ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.08)";
          texture.lineWidth = .45 + random() * .7;
          texture.beginPath(); texture.moveTo(x,y); texture.lineTo(x+len,y+(random()-.5)*1.7); texture.stroke();
        }
      } else {
        const wash = texture.createRadialGradient(20,18,2,36,36,52);
        wash.addColorStop(0,"rgba(255,255,255,.13)");
        wash.addColorStop(.55,"rgba(255,255,255,.025)");
        wash.addColorStop(1,"rgba(0,0,0,.07)");
        texture.fillStyle = wash; texture.fillRect(0,0,72,72);
        for (let i = 0; i < 70; i++) {
          texture.fillStyle = random() > .35 ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.045)";
          texture.fillRect(random()*72,random()*72,.7+random()*1.8,.5+random()*1.2);
        }
      }
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = currentPattern === "vintage" ? .72 : .88;
      ctx.fillStyle = ctx.createPattern(tile,"repeat");
      ctx.fillRect(0,0,c.width,c.height);
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
  const productAtStart = currentProductId;
  const colorAtStart = currentShirtColorId;
  const src = await renderShirtImage(viewAtStart);
  if (viewAtStart !== currentView || productAtStart !== currentProductId || colorAtStart !== currentShirtColorId) return;
  shirtMockup.src = src;
  shirtMockup.onload = () => updateInitialsOnCanvas();
  updateInitialsOnCanvas();
  if (FEATURES.previewMode === "dual") renderDualPreview();
}


function getMotifPlacement(motif, productId=currentProductId) {
  if(productId==="jh050"){
    const saved=motif?.placementsByProduct?.jh050;
    return saved?.side==="back" ? saved : {side:"back",...(SHOP.productPrint?.jh050?.back||{xPct:50,yPct:32,widthPct:55})};
  }
  return motif?.placementsByProduct?.[productId] || motif?.placement;
}

function getConfiguredMotif(view) {
  if(currentProductId==="jh050" && view==="front") return null;
  if(!logoEnabled) return null;
  const cfg = SHOP.fixedPrint && SHOP.fixedPrint[view];
  const selections=selectedLogoByProduct[currentProductId];
  const selectedId=typeof selections==="string" ? (view==="front"?selections:null) : selections?.[view];
  if ((!cfg || !cfg.enabled) && !selectedId) return null;
  const available=(SHOP.motifs||[]).filter(m=>{
    if(!m.file || m.customerSelectable===false) return false;
    const club=m.category==="club" || (m.category!=="general" && /vereinslogo|vereinswappen/i.test(m.name||""));
    return club ? FEATURES.showClubLogos!==false : FEATURES.showMotifPicker!==false;
  });
  const motif = available.find(m => m.id === selectedId)
    || available.find(m => m.id === cfg?.motifId)
    || available[0];
  if (!motif || (getMotifPlacement(motif)?.side && getMotifPlacement(motif).side!==view)) return null;
  return { cfg:cfg||{enabled:true}, motif };
}

function clampPrintValue(value, min, max, fallback) {
  const number = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : fallback));
}

const SHARED_LOGO_WIDTH_PCT = 22;
function getUnifiedPrintLayout(view, cfg) {
  const product = SHOP.productPrint && SHOP.productPrint[currentProductId] && SHOP.productPrint[currentProductId][view];
  if (product) {
    return {
      xPct: clampPrintValue(product.xPct,-20,120,view==="front"?68:50),
      yPct: clampPrintValue(product.yPct,-20,120,view==="front"?18:32),
      widthPct: clampPrintValue(product.widthPct,5,110,SHARED_LOGO_WIDTH_PCT)
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
    xPct: clampPrintValue(xPct, -20, 120, 50),
    yPct: clampPrintValue(cfg?.topPct, -20, 120, view === "front" ? 20 : 36),
    widthPct: SHARED_LOGO_WIDTH_PCT
  };
}

function applyDualMotifLayout(img, view, cfg, motif) {
  if (!img || !cfg) return;
  const placement=getMotifPlacement(motif);
  const layout = placement?.side===view ? placement : getUnifiedPrintLayout(view, cfg);

  // Dieselben X/Y/Größe-Werte wie in der Einzelansicht werden in die
  // reale Druckzone der jeweiligen Shirt-Hälfte übertragen.
  const zone = { left: 0.28, top: 0.222, width: 0.44, height: 0.496 };
  const chestFront = MASTER_FIXED_CHEST_LOGO && view === "front";
  const left = (zone.left + zone.width * ((clampPrintValue(layout.xPct,-20,120,50) + (chestFront ? 7 : 0)) / 100)) * 100;
  const top = (zone.top + zone.height * ((clampPrintValue(layout.yPct,-20,120,30) - (chestFront ? 3.5 : 0)) / 100)) * 100;
  const width = zone.width * (clampPrintValue(layout.widthPct,5,110,22) / 100) * 100;

  img.style.left = `${left}%`;
  img.style.top = `${top}%`;
  img.style.width = `${width}%`;
  img.style.maxWidth = `${width}%`;
  img.style.maxHeight = `${zone.height * ((currentProductId === "hoodie" && view === "back") ? 90 : 62)}%`;
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

    if (currentShirtColorId !== "white" && currentShirtColorId !== "weiss") {
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
    img.src = entry.motif.preserveColors ? src : await recolorMotifSource(src, currentMotifColor);
    img.hidden = false;
    applyDualMotifLayout(img, view, entry.cfg, entry.motif);
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
  updateDualInitials();
}

function updateDualInitials(){
  if(!dualCompositeStage) return;
  const value=initialsValue();
  for(const [index,side] of ["front","back"].entries()){
    let mark=dualCompositeStage.querySelector(`.dual-initials-${side}`);
    if(!mark){
      mark=document.createElement("span");
      mark.className=`dual-initials dual-initials-${side}`;
      dualCompositeStage.appendChild(mark);
    }
    mark.hidden=side!=="front"||!value||!FEATURES.allowInitials;
    mark.textContent=value;
    const defaults=side==="front"?{x:24,y:90}:{x:24,y:90};
    const saved=SHOP.initialsByProduct?.[currentProductId]?.[side]||{};
    mark.style.left=`${index*50+Number(saved.x??defaults.x)/2}%`;
    mark.style.top=`${Number(saved.y??defaults.y)}%`;
    mark.style.fontSize=`${dualCompositeStage.clientWidth/2*Math.max(2,Math.min(12,Number(saved.sizePct??5)))/100}px`;
    mark.style.setProperty("color",getInitialsColor(),"important");
  }
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
  syncMobileAfterShirtControls();
  if (viewSection) viewSection.hidden = dual || !FEATURES.allowBackDesign;
  if (designerStatus) designerStatus.textContent = dual ? "Vorder- & Rückseite" : (currentView === "back" ? "Rückseite" : "Vorderseite");
  if (dual) {
    requestAnimationFrame(() => renderDualPreview());
  }
}

function getActiveObject() { return canvas.getActiveObject(); }
function saveCurrentView() { viewStates[currentView] = canvas.toJSON(["motifId", "motifSrc", "motifColor", "motifColorLabel", "motifKind", "motifName", "preserveColors", "uploadBaseScale"]); }

function loadView(view) {
  canvas.clear();
  canvas.backgroundColor = "transparent";
  const state = viewStates[view];
  if (state) canvas.loadFromJSON(state, () => {
    canvas.getObjects().forEach(obj => {
      if (obj?.motifKind==="upload") restoreUploadedEditing(obj);
      else if (obj?.motifId) applyFixedMotifLayout(obj, obj.motifId);
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncCustomerUploadControls();
  });
  else {canvas.requestRenderAll();syncCustomerUploadControls();}
}

function switchView(view) {
  if (view !== "front" && view !== "back") return;
  if (currentProductId==="jh050" && view==="front") return;
  if (view === currentView) {
    renderShirt();
    updateInitialsOnCanvas();
    return;
  }
  saveCurrentView();
  currentView = view;
  viewButtons.forEach(button => {
    const active=button.dataset.view === view;
    button.classList.toggle("active",active);
    button.setAttribute("aria-pressed",String(active));
  });
  if (view === "front") {
    shirtMockup.alt = "T-Shirt Vorderseite";
    designerStatus.textContent = "Vorderseite";
    printZone.classList.remove("back");
    canvas.setHeight(PRINT_CANVAS_HEIGHT); canvas.setWidth(PRINT_CANVAS_WIDTH);
  } else {
    shirtMockup.alt = "T-Shirt Rückseite";
    designerStatus.textContent = "Rückseite";
    printZone.classList.add("back");
    canvas.setHeight(PRINT_CANVAS_HEIGHT); canvas.setWidth(PRINT_CANVAS_WIDTH);
  }
  renderShirt();
  loadView(view);
  updateInitialsOnCanvas();
}

viewButtons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.view===currentView)));
document.addEventListener("click",event=>{
  const button=event.target instanceof Element ? event.target.closest(".view-section .view-btn[data-view]") : null;
  if(button && !button.hidden && !button.disabled) switchView(button.dataset.view);
},true);

function lookupMasterHex(colorId){
  const catalogs=typeof MASTER_COLOR_VARIANTS==="object"?MASTER_COLOR_VARIANTS:{};
  for(const list of Object.values(catalogs)){
    const hit=(list||[]).find(item=>item.id===colorId);
    if(hit?.color) return hit.color;
  }
  return "";
}
function changeShirtColor(color, name, colorId, pattern, redraw = true) {
  currentShirtColor = color || lookupMasterHex(colorId) || "#ffffff";
  currentShirtColorId = colorId || "white";
  currentPattern = pattern || "";
  if(currentColorName) currentColorName.textContent = name || "White";
  shirtColorButtons.forEach(button => button.classList.toggle("active", button.dataset.id === currentShirtColorId));
  updateSizeOptionsForCurrentSelection();
  if (redraw) {
    renderShirt();
    if (FEATURES.previewMode === "dual") renderDualPreview();
  }
  const pairedMotifColor = SHOP.shirtMotifColors && SHOP.shirtMotifColors[currentShirtColorId];
  if (pairedMotifColor?.color) {
    void recolorActiveMotif(pairedMotifColor.color, pairedMotifColor.name || "Druckfarbe");
  }
  updateInitialsOnCanvas();
}

document.addEventListener("click", (event) => {
  const colorBtn=event.target.closest(".shirt-color");
  if(colorBtn && document.contains(colorBtn)){
    if(colorBtn.hidden || colorBtn.disabled) return;
    changeShirtColor(colorBtn.dataset.color, colorBtn.dataset.name, colorBtn.dataset.id, colorBtn.dataset.pattern || "");
    return;
  }
});

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
    try { img.crossOrigin = "anonymous"; } catch (e) {}
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
  const motif=(SHOP.motifs||[]).find(m=>m.id===motifId);
  const saved=getMotifPlacement(motif);
  const club=motif?.category==="club" || (motif?.category!=="general" && /vereinslogo|vereinswappen/i.test(motif?.name||""));
  if(saved && (!saved.side || saved.side===currentView)){
    return {
      left:clampPrintValue(saved.xPct,-20,120,68)/100,
      top:clampPrintValue(saved.yPct,-20,120,19)/100,
      maxWidth:clampPrintValue(saved.widthPct,5,110,22)/100,
      maxHeight:club ? (currentView==="front"?0.24:0.60) : clampPrintValue(saved.widthPct,5,110,72)/100
    };
  }
  if (MASTER_FIXED_CHEST_LOGO) {
    return currentView==="front"
      ? { left: 0.68, top: 0.19, maxWidth: 0.22, maxHeight: 0.24 }
      : { left: 0.50, top: 0.32, maxWidth: 0.40, maxHeight: 0.60 };
  }
  const cfg = SHOP.fixedPrint && SHOP.fixedPrint[currentView];
  const productLayout = SHOP.productPrint && SHOP.productPrint[currentProductId] && SHOP.productPrint[currentProductId][currentView];
  // Eine im Admin gespeicherte Artikelposition gilt auch dann, wenn kein
  // klassischer "fester Druck" aktiviert ist (z. B. Hansa-Motivshop).
  if (productLayout || (cfg && cfg.enabled)) {
    const unified = getUnifiedPrintLayout(currentView, cfg);
    return {
      left: unified.xPct / 100,
      top: unified.yPct / 100,
      maxWidth: unified.widthPct / 100,
      maxHeight: unified.widthPct / 100
    };
  }
  return FIXED_MOTIF_LAYOUTS.default;
}

function applyFixedMotifLayout(image, motifId) {
  const layout = getFixedPrintLayout(motifId);
  // Kleine Korrektur der Herzseiten-Position, in derselben
  // 260 x 340-Druckfläche wie die Admin-Vorschau.
  const chestX = MASTER_FIXED_CHEST_LOGO && currentView === "front" ? 0.07 : 0;
  const chestY = MASTER_FIXED_CHEST_LOGO && currentView === "front" ? -0.035 : 0;
  const maxWidth = PRINT_BASE_WIDTH * layout.maxWidth;
  const maxHeight = PRINT_BASE_HEIGHT * layout.maxHeight;
  const scale = MASTER_FIXED_CHEST_LOGO
    ? Math.min(maxWidth / image.width, maxHeight / image.height)
    : Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const locked=!!(SHOP.motifs||[]).find(m=>m.id===motifId)?.locked;
  const movable = !MASTER_FIXED_CHEST_LOGO && !locked && !!FEATURES.allowMoveMotif;
  const resizable = !MASTER_FIXED_CHEST_LOGO && !locked && !!FEATURES.allowResizeMotif;
  const rotatable = !MASTER_FIXED_CHEST_LOGO && !locked && !!FEATURES.allowRotateMotif;
  const editable = movable || resizable || rotatable;
  image.set({
    left: PRINT_SIDE_MARGIN + PRINT_BASE_WIDTH * (layout.left + chestX),
    // Y-Werte bleiben auf die bisherige 340px-Druckzone bezogen.
    // PRINT_HEADROOM liegt unsichtbar darüber und verhindert Clipping.
    top: PRINT_HEADROOM + (PRINT_BASE_HEIGHT * (layout.top + chestY)),
    originX: "center", originY: "center",
    angle: 0,
    scaleX: scale, scaleY: scale,
    objectCaching:false,
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

function configureFabricImage(image, motifId, motifSrc, preserveColors = false) {
  applyFixedMotifLayout(image, motifId);
  image.set({
    motifId, motifSrc,
    motifColor: currentMotifColor,
    motifColorLabel: currentMotifColorLabel,
    preserveColors: !!preserveColors
  });
}

async function addMotifToView(view, motifId, motifSrc, markActive = true) {
  if (!motifId || motifId === "none" || !motifSrc) {
    if (typeof clearShirtLogos === "function") clearShirtLogos();
    return;
  }
  if (currentView !== view) switchView(view);
  await new Promise(resolve => requestAnimationFrame(resolve));
  try {
    const motif=(SHOP.motifs||[]).find(item=>item.id===motifId);
    const preserveColors=!!motif?.preserveColors;
    const dataUrl = preserveColors ? motifSrc : await recolorMotifSource(motifSrc, currentMotifColor);
    canvas.clear();
    canvas.backgroundColor = "transparent";
    await new Promise((resolve) => {
      fabric.Image.fromURL(dataUrl, function(image) {
        configureFabricImage(image, motifId, motifSrc, preserveColors);
        canvas.add(image);
        canvas.discardActiveObject();
        image.setCoords();
        canvas.requestRenderAll();
        viewStates[view] = canvas.toJSON(["motifId", "motifSrc", "motifColor", "motifColorLabel", "motifKind", "motifName", "preserveColors"]);
        if (markActive && view === "front") motifButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.motif === motifId));
        syncCustomerUploadControls();
        resolve();
      }, { crossOrigin: "anonymous" });
    });
  } catch (err) {
    console.error("Motiv konnte nicht geladen werden", err);
  }
}

async function addSelectedMotif(motifId, motifSrc) {
  logoEnabled = true;
  const motif=(SHOP.motifs||[]).find(m=>m.id===motifId);
  const side=getMotifPlacement(motif)?.side==="back" ? "back" : "front";
  await addMotifToView(side, motifId, motifSrc, true);
  motifButtons.forEach(button=>button.classList.toggle("active",button.dataset.motif===motifId));
  if(FEATURES.previewMode==="dual") await renderDualPreview();
}

function clearShirtLogos(){
  logoEnabled = false;
  const removeFrom=target=>{
    if(!target) return;
    target.getObjects().filter(obj=>obj && obj.motifSrc).forEach(obj=>target.remove(obj));
    target.discardActiveObject();
    target.requestRenderAll();
  };
  removeFrom(canvas);
  saveCurrentView();
  for(const side of ["front","back"]){
    if(side===currentView || !viewStates[side]) continue;
    try{
      const parsed=typeof viewStates[side]==="string"?JSON.parse(viewStates[side]):viewStates[side];
      if(Array.isArray(parsed.objects)) parsed.objects=parsed.objects.filter(obj=>!obj.motifSrc);
      viewStates[side]=parsed;
    }catch(e){}
  }
  document.querySelectorAll(".motif-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.motif==="none"));
  syncCustomerUploadControls();
  if(FEATURES.previewMode==="dual") void renderDualPreview();
}

document.addEventListener("click",(event)=>{
  const button=event.target.closest(".motif-btn");
  if(!button) return;
  if(button.dataset.motif==="none"){
    delete selectedLogoByProduct[currentProductId];
    clearShirtLogos();
    return;
  }
  if(button.dataset.src){
    const motif=(SHOP.motifs||[]).find(item=>item.id===button.dataset.motif);
    const side=getMotifPlacement(motif)?.side==="back"?"back":"front";
    const selections=selectedLogoByProduct[currentProductId];
    selectedLogoByProduct[currentProductId]={...(typeof selections==="object"?selections:{}),[side]:button.dataset.motif};
    productMotifSelections[currentProductId]=button.dataset.motif==="tus-3d-patch"?"patch":"normal";
    logoEnabled=true;
    addSelectedMotif(button.dataset.motif, button.dataset.src);
  }
});

async function recolorActiveMotif(color, label) {
  currentMotifColor = color;
  currentMotifColorLabel = label;
  currentMotifColorName.textContent = label;
  updateActiveMotifColorButton(color, label);
  updateInitialsOnCanvas();
  const selectedText = getActiveTextObject();
  const texts = selectedText ? [selectedText] : canvas.getObjects().filter(obj => obj.motifKind === "text");
  texts.forEach(text => {
    text.set({ fill: color, motifColor: color, motifColorLabel: label });
    updateTextStyleControls(text);
  });
  if (texts.length) {
    canvas.requestRenderAll();
    saveCurrentView();
  }
  if (FEATURES.previewMode === "dual") await renderDualPreview();
  if (selectedText) return;

  // Die Farbe gilt für das Motiv auf der gerade angezeigten Druckseite.
  const object = canvas.getObjects().find(obj => obj && obj.motifSrc && obj.type === "image" && obj.motifKind !== "upload");
  if (!object) return;
  if (object.preserveColors) return;

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

const customerLogoFiles = new Map();
const customerLogoUpload = document.getElementById("customerLogoUpload");
function restoreUploadedEditing(image){
  image.set({selectable:true,evented:true,hasControls:true,hasBorders:true,
    hoverCursor:"move",moveCursor:"move"});
  configureCustomerControls(image);
}
function currentUploadedMotif(){
  return canvas.getObjects().find(object=>object?.motifKind==="upload") || null;
}
// Der volle Reglerwert entspricht dem auf dem Textil verfügbaren Druckbereich.
function customerUploadMaxScale(image){
  return Math.min(300/image.width,PRINT_BASE_HEIGHT/image.height);
}
function clampCustomerUploadSize(image){
  if(image?.motifKind!=="upload" || !image.width || !image.height) return;
  // Auch bei Touch-Gesten und alten gespeicherten Werten bleibt das Seitenverhältnis erhalten.
  if(Math.abs(image.scaleX-image.scaleY)>0.0001) image.scale(Math.max(image.scaleX,image.scaleY));
  const maximum=customerUploadMaxScale(image);
  if(image.scaleX>maximum || image.scaleY>maximum) image.scale(maximum);
  const minimum=maximum*.25;
  if(image.scaleX<minimum || image.scaleY<minimum) image.scale(minimum);
}
function centerCustomerUpload(image){
  image.setPositionByOrigin(new fabric.Point(CUSTOMER_UPLOAD_CENTER_X,CUSTOMER_UPLOAD_CENTER_Y),"center","center");
  image.setCoords();
}
function keepCustomerUploadOnShirt(image){
  if(image?.motifKind!=="upload") return;
  clampCustomerUploadSize(image);
  const angle=(Number(image.angle)||0)*Math.PI/180;
  const rotatedWidth=(Math.abs(image.width*Math.cos(angle))+Math.abs(image.height*Math.sin(angle)))*image.scaleX;
  const rotatedHeight=(Math.abs(image.width*Math.sin(angle))+Math.abs(image.height*Math.cos(angle)))*image.scaleY;
  const fit=Math.min(1,300/rotatedWidth,PRINT_BASE_HEIGHT/rotatedHeight);
  if(Number.isFinite(fit)&&fit<1) image.scale(image.scaleX*fit);
  image.setCoords();
  const bounds=image.getBoundingRect(true,true);
  const minX=10, maxX=310;
  const minY=PRINT_HEADROOM, maxY=PRINT_HEADROOM+PRINT_BASE_HEIGHT;
  const dx=bounds.left<minX ? minX-bounds.left : bounds.left+bounds.width>maxX ? maxX-bounds.left-bounds.width : 0;
  const dy=bounds.top<minY ? minY-bounds.top : bounds.top+bounds.height>maxY ? maxY-bounds.top-bounds.height : 0;
  if(dx||dy) image.set({left:image.left+dx,top:image.top+dy});
  image.setCoords();
}
function keepCustomerTextOnShirt(text){
  if(text?.motifKind!=="text")return;
  text.setCoords();
  let bounds=text.getBoundingRect(true,true);
  const minX=PRINT_SIDE_MARGIN,maxX=PRINT_SIDE_MARGIN+PRINT_BASE_WIDTH;
  const minY=PRINT_HEADROOM+20,maxY=PRINT_HEADROOM+PRINT_BASE_HEIGHT;
  const fit=Math.min(1,(maxX-minX)/Math.max(1,bounds.width),(maxY-minY)/Math.max(1,bounds.height));
  if(fit<1){text.scale(text.scaleX*fit);text.setCoords();bounds=text.getBoundingRect(true,true)}
  const dx=bounds.left<minX?minX-bounds.left:bounds.left+bounds.width>maxX?maxX-bounds.left-bounds.width:0;
  const dy=bounds.top<minY?minY-bounds.top:bounds.top+bounds.height>maxY?maxY-bounds.top-bounds.height:0;
  if(dx||dy)text.set({left:text.left+dx,top:text.top+dy});
  text.setCoords();
}
function resizeCustomerUpload(percent){
  const image=currentUploadedMotif();
  if(!image) return;
  const base=customerUploadMaxScale(image);
  image.scale(base*Math.max(25,Math.min(100,percent))/100);
  keepCustomerUploadOnShirt(image);
  canvas.setActiveObject(image);canvas.requestRenderAll();saveCurrentView();syncCustomerUploadControls();
}
function rotateCustomerUpload(degrees){
  const image=currentUploadedMotif();if(!image)return;
  image.rotate(((degrees+180)%360+360)%360-180);
  keepCustomerUploadOnShirt(image);
  canvas.setActiveObject(image);canvas.requestRenderAll();saveCurrentView();syncCustomerUploadControls();
}
function removeCustomerUpload(){
  const image=currentUploadedMotif();if(!image)return;
  canvas.remove(image);canvas.discardActiveObject();canvas.requestRenderAll();
  saveCurrentView();syncCustomerUploadControls();
  if(FEATURES.previewMode==="dual") void renderDualPreview();
}
function syncCustomerUploadControls(){
  const section=document.querySelector(".customer-upload-section");
  if(!section) return;
  const image=currentUploadedMotif();
  const filename=section.querySelector(".upload-file-name");
  if(filename){filename.hidden=!image;filename.textContent=image?.motifName||"";}
  document.body.classList.toggle("has-editable-upload",!!image);
}
let pendingUploadPoint=null;
function handleCustomerUploadFile(file,dropPoint=null){
  if (!file) return;
  const maxBytes = (Number(FEATURES.maxUploadMB) || 8) * 1024 * 1024;
  if (file.size > maxBytes) {
    alert(`Die Datei ist zu groß. Maximal ${Number(FEATURES.maxUploadMB) || 8} MB.`);
    if(customerLogoUpload) customerLogoUpload.value="";
    return;
  }
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) { alert("Bitte PNG, JPG, WEBP oder SVG auswählen."); if(customerLogoUpload) customerLogoUpload.value=""; return; }
  const reader = new FileReader();
  reader.onload = () => {
    if(currentProductId==="jh050" && currentView!=="back") switchView("back");
    if (currentView !== "front" && !FEATURES.allowBackDesign) switchView("front");
    if(FEATURES.previewMode==="dual"){
      FEATURES.previewMode="single";
      applyPreviewMode();
    }
    fabric.Image.fromURL(reader.result, function(original) {
      if (!original?.width || !original.height) { alert("Die Bilddatei konnte nicht geöffnet werden."); if(customerLogoUpload) customerLogoUpload.value=""; return; }
      try {
        // Originalquelle behalten; nur die Darstellung auf dem Textil skalieren.
        const image = original;
          if (FEATURES.motifMode !== "mixed") canvas.clear();
          const scale=Math.min(PRINT_BASE_WIDTH*.8/image.width,PRINT_BASE_HEIGHT*.94/image.height);
          image.set({
            left:CUSTOMER_UPLOAD_CENTER_X,top:CUSTOMER_UPLOAD_CENTER_Y,
            originX:"center",originY:"center",scaleX:scale,scaleY:scale,
            motifId:"customer-upload",motifSrc:reader.result,motifName:file.name,motifKind:"upload",uploadBaseScale:scale,
            objectCaching:false
          });
          if(dropPoint){
            image.setPositionByOrigin(new fabric.Point(dropPoint.x,dropPoint.y),"center","center");
            keepCustomerUploadOnShirt(image);
          }else centerCustomerUpload(image);
          restoreUploadedEditing(image);
          canvas.add(image);
          canvas.setActiveObject(image);
          canvas.requestRenderAll();
          saveCurrentView();
          logoEnabled=true;
          if(selectedLogoByProduct[currentProductId]) delete selectedLogoByProduct[currentProductId][currentView];
          motifButtons.forEach(btn=>btn.classList.remove("active"));
          customerLogoFiles.set(file.name,file);
          closePhotoDialog();
          syncCustomerUploadControls();
          if(FEATURES.previewMode==="dual") void renderDualPreview();
          if(customerLogoUpload) customerLogoUpload.value="";
      } catch(error) {
        console.error("Bildvorschau:",error);
        alert("Die Bildvorschau konnte nicht erstellt werden. Bitte eine andere Bilddatei auswählen.");
        if(customerLogoUpload) customerLogoUpload.value="";
      }
    });
  };
  reader.onerror = () => { alert("Die Bilddatei konnte nicht gelesen werden."); if(customerLogoUpload) customerLogoUpload.value=""; };
  reader.readAsDataURL(file);
}
customerLogoUpload?.addEventListener("change",event=>{
  const point=pendingUploadPoint;
  pendingUploadPoint=null;
  handleCustomerUploadFile(event.target.files?.[0],point);
});

const customTextInput = document.getElementById("customTextInput");
const addTextBtn = document.getElementById("addTextBtn");
const customTextFont = document.getElementById("customTextFont");
const initialsInput = document.getElementById("initialsInput");

function initialsValue() {
  if(currentProductId==="jh050") return "";
  const field = document.getElementById("initialsInput") || initialsInput;
  const maxLength = Math.min(3, Number(SHOP.initialsConfig?.maxLength) || 3);
  const value = String(field?.value || "")
    .toUpperCase()
    .replace(/[^A-ZÄÖÜ0-9]/g, "")
    .slice(0, maxLength);
  if (field && field.value !== value) field.value = value;
  return value;
}

function getInitialsColor(){
  return /^#[0-9a-f]{6}$/i.test(String(currentMotifColor||""))?currentMotifColor:"#000000";
}

function initialsShirtBox(){
  const stage=document.querySelector(".mockup-stage");
  const img=document.getElementById("shirtMockup");
  if(!stage||!img) return null;
  return {stage, img, stageBox:stage.getBoundingClientRect(), imgBox:img.getBoundingClientRect()};
}
function applyInitialsOnShirt(overlay, xPct, yPct){
  const box=initialsShirtBox();
  if(!box||!overlay) return;
  const left=((box.imgBox.left-box.stageBox.left)+box.imgBox.width*(xPct/100))/box.stageBox.width*100;
  const top=((box.imgBox.top-box.stageBox.top)+box.imgBox.height*(yPct/100))/box.stageBox.height*100;
  overlay.style.setProperty("left", `${left}%`, "important");
  overlay.style.setProperty("top", `${top}%`, "important");
}
function updateInitialsOnCanvas() {
  const value = initialsValue();
  const cfg = SHOP.initialsConfig || {};
  const color = getInitialsColor();
  const stage = document.querySelector(".mockup-stage");
  if (!stage) return;
  stage.querySelectorAll(".shirt-initials-overlay").forEach((extra, index) => {
    if (index) extra.remove();
  });
  let overlay = stage.querySelector(".shirt-initials-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "shirt-initials-overlay";
    overlay.setAttribute("aria-hidden", "true");
    stage.appendChild(overlay);
  }
  overlay.textContent = "";
  if(value){
    const glyph=document.createElement("span");
    glyph.className="initials-glyph";
    glyph.textContent=value;
    overlay.appendChild(glyph);
  }
  overlay.hidden = currentView !== "front" || !value || !FEATURES.allowInitials;
  const productId = (typeof currentProductId === "string" && currentProductId) || "tshirt";
  const view = (typeof currentView === "string" && currentView) || "front";
  const defaults = {
    tshirt:{front:{x:24,y:84},back:{x:24,y:90}},
    polo:{front:{x:24,y:88},back:{x:24,y:88}},
    hoodie:{front:{x:23,y:91},back:{x:23,y:89}},
    sport:{front:{x:24,y:89},back:{x:24,y:89}},
    sweatshirt:{front:{x:24,y:91},back:{x:24,y:90}}
  };
  const custom = SHOP.initialsByProduct?.[productId]?.[view] || {};
  const fallback = defaults[productId]?.[view] || defaults.tshirt.front;
  const x = Number(custom.x ?? fallback.x);
  const y = Number(custom.y ?? fallback.y);
  applyInitialsOnShirt(overlay, x, y);
  const box = initialsShirtBox();
  const sizePct = Math.max(2,Math.min(12,Number(custom.sizePct ?? 5)));
  const px = box ? Math.max(10, box.imgBox.width * sizePct / 100) : 25;
  overlay.style.setProperty("font-size",`${px}px`,"important");
  overlay.style.fontFamily = cfg.fontFamily || "Arial Black, Impact, sans-serif";
  overlay.style.fontWeight = "900";
  overlay.style.letterSpacing = "0.02em";
  overlay.style.setProperty("color",color || "#ffffff","important");
  overlay.style.setProperty("--initials-ink",color,"important");
  overlay.querySelector(".initials-glyph")?.style.setProperty("color",color,"important");
  overlay.style.pointerEvents = "none";
  overlay.style.cursor = "default";
  overlay.style.zIndex = "80";
  overlay.classList.toggle("is-set", !overlay.hidden);
  overlay.setAttribute("aria-hidden", String(overlay.hidden));
  if(FEATURES.previewMode==="dual") updateDualInitials();
  if(!overlay.dataset.resizeBound){
    overlay.dataset.resizeBound="1";
    window.addEventListener("resize", updateInitialsOnCanvas, {passive:true});
  }
}

initialsInput?.addEventListener("input",ev=>{
  if(!ev.isComposing && ev.target.dataset.composing!=="true") updateInitialsOnCanvas();
});

function getActiveTextObject() {
  const active = canvas.getActiveObject();
  return active && active.motifKind === "text" ? active : null;
}
function updateTextStyleControls(textObject) {
  if (!textObject) return;
  if (customTextFont && textObject.fontFamily) customTextFont.value = textObject.fontFamily;
}
function applyTextStyle() {
  const text = getActiveTextObject();
  if (!text) return;
  text.set({
    fontFamily: customTextFont?.value || "Arial"
  });
  text.initDimensions?.();
  keepCustomerTextOnShirt(text);
  text.setCoords();
  canvas.requestRenderAll();
  saveCurrentView();
}
customTextFont?.addEventListener("change", applyTextStyle);
canvas.on("selection:created", event => updateTextStyleControls(event.selected?.[0]));
canvas.on("selection:updated", event => updateTextStyleControls(event.selected?.[0]));
function addCustomerText(value,point=null){
  value=String(value||"").trim();
  if (!value) return;
  const text = new fabric.Textbox(value, {
    left: point?.x ?? canvas.width / 2, top: point?.y ?? canvas.height * 0.56, originX: "center", originY: "center",
    width: canvas.width * 0.7, textAlign: "center", fontSize: 28, fontWeight: 700,
    fill: currentMotifColor || "#111111", fontFamily: customTextFont?.value || "Arial",
    editable: true, selectable: true, motifKind: "text", motifName: value
  });
  canvas.add(text);
  keepCustomerTextOnShirt(text);
  canvas.setActiveObject(text);
  canvas.requestRenderAll();
  saveCurrentView();
  document.fonts?.load(`700 28px "${text.fontFamily}"`).then(()=>{
    if(!canvas.getObjects().includes(text))return;
    text.initDimensions?.();keepCustomerTextOnShirt(text);text.setCoords();
    canvas.requestRenderAll();saveCurrentView();
  }).catch(()=>{});
  if(customTextInput) customTextInput.value="";
}
if (addTextBtn && customTextInput) addTextBtn.addEventListener("click",()=>addCustomerText(customTextInput.value));

const designRail=document.querySelector(".editor-dnd-rail");
const printDropZone=document.getElementById("printZone");
const designTools=designRail?.querySelectorAll("[data-design-tool]")||[];
const designMenu=document.createElement("div");
designMenu.id="editorToolMenu";
designMenu.className="editor-tool-menu";
designMenu.hidden=true;
designRail?.appendChild(designMenu);
let openDesignTool=null;
function closeDesignMenu(){
  openDesignTool=null;designMenu.hidden=true;designMenu.replaceChildren();
  designTools.forEach(button=>button.setAttribute("aria-expanded","false"));
}
function menuOption(label,action,active=false){
  const button=document.createElement("button");button.type="button";
  button.className="editor-menu-option";button.textContent=label;
  button.classList.toggle("active",active);button.addEventListener("click",action);
  return button;
}
function populatePhotoEditTools(host){
  host.replaceChildren();
  const designMenu=host;


    const upload=currentUploadedMotif();
    if(upload){
      const label=document.createElement("label");label.className="editor-menu-field";label.textContent="Bildgröße";
      const slider=document.createElement("input");slider.type="range";slider.min="25";slider.max="100";
      slider.value=String(Math.max(25,Math.min(100,Math.round(100*upload.scaleX/customerUploadMaxScale(upload)))));
      const sizeValue=document.createElement("output");sizeValue.textContent=`${slider.value} %`;
      slider.addEventListener("input",()=>{resizeCustomerUpload(Number(slider.value));sizeValue.textContent=`${slider.value} %`});
      label.append(slider,sizeValue);designMenu.appendChild(label);
      const rotateLabel=document.createElement("label");rotateLabel.className="editor-menu-field";rotateLabel.textContent="Drehung";
      const rotation=document.createElement("input");rotation.type="range";rotation.min="-180";rotation.max="180";rotation.value=String(Math.round(upload.angle||0));
      const angleValue=document.createElement("output");angleValue.textContent=`${rotation.value}°`;
      rotation.addEventListener("input",()=>{rotateCustomerUpload(Number(rotation.value));angleValue.textContent=`${rotation.value}°`});
      rotateLabel.append(rotation,angleValue);designMenu.appendChild(rotateLabel);
      const actions=document.createElement("div");actions.className="editor-menu-colors";
      actions.append(
        menuOption("↶ −15°",()=>{rotateCustomerUpload((currentUploadedMotif()?.angle||0)-15);rotation.value=String(Math.round(currentUploadedMotif()?.angle||0));angleValue.textContent=`${rotation.value}°`}),
        menuOption("↷ +15°",()=>{rotateCustomerUpload((currentUploadedMotif()?.angle||0)+15);rotation.value=String(Math.round(currentUploadedMotif()?.angle||0));angleValue.textContent=`${rotation.value}°`})
      );designMenu.appendChild(actions);
      designMenu.appendChild(menuOption("Mittig platzieren",()=>{
        const image=currentUploadedMotif();if(image){centerCustomerUpload(image);keepCustomerUploadOnShirt(image);canvas.setActiveObject(image);canvas.requestRenderAll();saveCurrentView();syncCustomerUploadControls()}
        closePhotoDialog();
      }));
      const remove=menuOption("Bild entfernen",()=>{removeCustomerUpload();closePhotoDialog()});
      remove.classList.add("danger");designMenu.appendChild(remove);
    }

}
const photoDialog=document.getElementById("photoDialog");
let photoPreviewUrls=[];
function closePhotoDialog(){
  if(photoDialog?.open)photoDialog.close();
}
function renderPhotoLibrary(){
  const host=document.getElementById("photoImageLibrary");if(!host)return;
  photoPreviewUrls.forEach(url=>URL.revokeObjectURL(url));photoPreviewUrls=[];host.replaceChildren();
  if(!customerLogoFiles.size){
    const empty=document.createElement("p");empty.className="photo-library-empty";
    empty.textContent="Noch keine Bilder vorhanden. Lade zuerst ein Bild hoch.";host.appendChild(empty);return;
  }
  customerLogoFiles.forEach(file=>{
    const button=document.createElement("button");button.type="button";button.className="photo-library-image";
    const image=document.createElement("img");const url=URL.createObjectURL(file);photoPreviewUrls.push(url);
    image.src=url;image.alt=file.name;
    const label=document.createElement("span");label.textContent=file.name;
    button.append(image,label);button.addEventListener("click",()=>handleCustomerUploadFile(file));host.appendChild(button);
  });
}
function setPhotoTab(library){
  document.getElementById("photoUploadTab")?.setAttribute("aria-selected",String(!library));
  document.getElementById("photoLibraryTab")?.setAttribute("aria-selected",String(library));
  document.getElementById("photoUploadPanel").hidden=library;
  document.getElementById("photoLibraryPanel").hidden=!library;
  if(library)renderPhotoLibrary();
}
function openPhotoDialog(){
  if(!FEATURES.allowCustomerUpload||!photoDialog)return;
  document.getElementById("photoMaxUpload").textContent=String(Number(FEATURES.maxUploadMB)||8);
  setPhotoTab(false);
  const details=document.getElementById("photoEditDetails");details.hidden=!currentUploadedMotif();details.open=false;
  populatePhotoEditTools(document.getElementById("photoEditTools"));
  if(!photoDialog.open)photoDialog.showModal();
}
document.getElementById("photoUploadTab")?.addEventListener("click",()=>setPhotoTab(false));
document.getElementById("photoLibraryTab")?.addEventListener("click",()=>setPhotoTab(true));
photoDialog?.querySelector(".photo-dialog-close")?.addEventListener("click",closePhotoDialog);
photoDialog?.addEventListener("close",()=>{photoPreviewUrls.forEach(url=>URL.revokeObjectURL(url));photoPreviewUrls=[]});
photoDialog?.addEventListener("click",event=>{if(event.target===photoDialog)closePhotoDialog()});
document.getElementById("photoUploadButton")?.addEventListener("click",()=>{pendingUploadPoint=null;customerLogoUpload?.click()});
const photoDrop=document.getElementById("photoUploadDrop");
photoDrop?.addEventListener("click",event=>{if(!event.target.closest("button")){pendingUploadPoint=null;customerLogoUpload?.click()}});
photoDrop?.addEventListener("dragover",event=>{event.preventDefault();photoDrop.classList.add("is-dragover")});
photoDrop?.addEventListener("dragleave",()=>photoDrop.classList.remove("is-dragover"));
photoDrop?.addEventListener("drop",event=>{
  event.preventDefault();event.stopPropagation();photoDrop.classList.remove("is-dragover");
  handleCustomerUploadFile(event.dataTransfer?.files?.[0]);
});
const textDialog=document.getElementById("textDialog");
const textDialogInput=document.getElementById("textDialogInput");
const textFontChoices=[
  {name:"Roboto Slab",group:"serif",family:"Roboto Slab"},
  {name:"Dosis",group:"sans",family:"Dosis"},
  {name:"Ubuntu",group:"sans",family:"Ubuntu"},
  {name:"Permanent Marker",group:"display",family:"Permanent Marker"},
  {name:"Caveat",group:"script",family:"Caveat"},
  {name:"Bevan",group:"serif",family:"Bevan"},
  {name:"Lobster",group:"script",family:"Lobster"},
  {name:"Dancing Script",group:"script",family:"Dancing Script"},
  {name:"Alfa Slab One",group:"serif",family:"Alfa Slab One"},
  {name:"Nunito",group:"sans",family:"Nunito"},
  {name:"Pacifico",group:"script",family:"Pacifico"},
  {name:"Oswald",group:"display",family:"Oswald"},
  {name:"Rubik Wet Paint",group:"display",family:"Rubik Wet Paint"},
  {name:"Lora",group:"serif",family:"Lora"}
];
let textPlacementPoint=null,textEditingObject=null;
function closeTextDialog(){if(textDialog?.open)textDialog.close()}
function selectTextFont(choice){
  if(customTextFont){
    let option=[...customTextFont.options].find(item=>item.value===choice.family);
    if(!option){option=new Option(choice.name,choice.family);customTextFont.add(option)}
    customTextFont.value=choice.family;
  }
  if(textEditingObject){
    textEditingObject.set({fontFamily:choice.family});textEditingObject.initDimensions?.();
    keepCustomerTextOnShirt(textEditingObject);textEditingObject.setCoords();
    canvas.requestRenderAll();saveCurrentView();
  }
  document.fonts?.load(`700 28px "${choice.family}"`).then(()=>{
    if(textEditingObject?.fontFamily===choice.family){
      textEditingObject.initDimensions?.();keepCustomerTextOnShirt(textEditingObject);
      canvas.requestRenderAll();saveCurrentView();
    }
  }).catch(()=>{});
  renderTextFontGallery();
}
function renderTextFontGallery(){
  const gallery=document.getElementById("fontGallery");if(!gallery)return;
  gallery.replaceChildren();
  textFontChoices.forEach(choice=>{
    const card=document.createElement("button");card.type="button";card.className="text-font-card";
    card.classList.toggle("selected",customTextFont?.value===choice.family);
    card.setAttribute("aria-pressed",String(customTextFont?.value===choice.family));
    const name=document.createElement("span");name.className="text-font-name";name.textContent=choice.name;
    const preview=document.createElement("span");preview.className="text-font-preview";
    preview.style.fontFamily=`"${choice.family}", Arial, sans-serif`;
    preview.textContent=(textDialogInput?.value||"Dein Text").trim()||"Dein Text";
    card.append(name,preview);card.addEventListener("click",()=>selectTextFont(choice));gallery.appendChild(card);
  });
}
function openTextDialog(point=null){
  if(!FEATURES.allowText||!textDialog)return;
  textEditingObject=getActiveTextObject();textPlacementPoint=point;
  textDialogInput.value=textEditingObject?.text||customTextInput?.value||"";
  if(textEditingObject?.fontFamily&&customTextFont){
    if(![...customTextFont.options].some(item=>item.value===textEditingObject.fontFamily))
      customTextFont.add(new Option(textEditingObject.fontFamily,textEditingObject.fontFamily));
    customTextFont.value=textEditingObject.fontFamily;
  }
  document.getElementById("textDialogAdd").textContent=textEditingObject?"Text übernehmen":"Text hinzufügen";
  renderTextFontGallery();if(!textDialog.open)textDialog.showModal();
  textDialogInput.focus();
}
document.getElementById("textDialogClose")?.addEventListener("click",closeTextDialog);
textDialog?.addEventListener("click",event=>{if(event.target===textDialog)closeTextDialog()});
textDialogInput?.addEventListener("input",renderTextFontGallery);
textDialogInput?.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();document.getElementById("textDialogAdd").click()}});
document.getElementById("textDialogAdd")?.addEventListener("click",()=>{
  const value=textDialogInput.value.trim();if(!value){textDialogInput.focus();return}
  if(textEditingObject){
    textEditingObject.set({text:value,fontFamily:customTextFont?.value||"Arial"});
    textEditingObject.initDimensions?.();keepCustomerTextOnShirt(textEditingObject);
    canvas.setActiveObject(textEditingObject);canvas.requestRenderAll();saveCurrentView();
  }else addCustomerText(value,textPlacementPoint);
  textEditingObject=getActiveTextObject();
  if(customTextInput)customTextInput.value="";closeTextDialog();
});
function toggleDesignMenu(tool){
  if(tool==="photo"){closeDesignMenu();openPhotoDialog();return;}
  if(tool==="text"){closeDesignMenu();openTextDialog();return;}
  if(openDesignTool===tool){closeDesignMenu();return;}
  openDesignTool=tool;designMenu.replaceChildren();designMenu.hidden=false;
  designTools.forEach(button=>button.setAttribute("aria-expanded",String(button.dataset.designTool===tool)));
  const title=document.createElement("strong");title.className="editor-menu-title";
  title.textContent=({product:"Textil wählen",logo:"Logos wählen",photo:"Eigenes Bild",text:"Text hinzufügen",initials:"Initialen",printColor:"Druckfarbe wählen"})[tool]||"Auswahl";
  designMenu.appendChild(title);
  if(tool==="product"){
    productSwitch?.querySelectorAll(".product-btn").forEach(source=>{
      const name=source.querySelector(".product-btn-name")?.textContent||source.textContent;
      const price=FEATURES.showPrices===false?"":` · ${source.dataset.price||""}`;
      designMenu.appendChild(menuOption(name+price,()=>{source.click();closeDesignMenu()},source.classList.contains("active")));
    });
  }else if(tool==="logo"){
    document.querySelectorAll(".club-logo-section:not([hidden]) .motif-btn,.motif-section:not([hidden]) .motif-btn").forEach(source=>{
      const label=source.querySelector(".motif-label,.motif-name")?.textContent?.trim()||source.textContent.trim()||"Logo";
      designMenu.appendChild(menuOption(label,()=>{source.click();closeDesignMenu()},source.classList.contains("active")));
    });
    if(designMenu.children.length===1){const hint=document.createElement("p");hint.textContent="Keine Logos vorhanden.";designMenu.appendChild(hint)}
  }else if(tool==="printColor"){
    const colors=document.createElement("div");colors.className="editor-print-colors";
    document.querySelectorAll(".motif-color-section .motif-color:not([hidden])").forEach(source=>{
      const button=menuOption("",()=>{source.click();closeDesignMenu()},source.classList.contains("active"));
      button.style.backgroundColor=source.dataset.color;
      button.title=source.dataset.name;button.setAttribute("aria-label",source.dataset.name||"Druckfarbe");
      button.setAttribute("aria-pressed",String(source.classList.contains("active")));
      colors.appendChild(button);
    });
    designMenu.appendChild(colors);
  }else if(tool==="initials"){
    const input=document.createElement("input");input.className="editor-menu-input";input.type="text";input.maxLength=3;
    input.placeholder="ABC";input.setAttribute("aria-label","Initialen eingeben");
    input.value=document.getElementById("initialsInput")?.value||"";
    input.addEventListener("input",()=>{
      input.value=input.value.toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g,"").slice(0,3);
      const source=document.getElementById("initialsInput");
      if(source){source.value=input.value;source.dispatchEvent(new Event("input",{bubbles:true}))}
    });
    designMenu.appendChild(input);
  }
}
document.addEventListener("click",event=>{if(openDesignTool&&!designRail?.contains(event.target))closeDesignMenu()});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&openDesignTool)closeDesignMenu()});
designTools.forEach(button=>{
  const tool=button.dataset.designTool;
  if(tool==="logo") button.querySelector("strong").textContent="Logos";
  button.hidden=(tool==="photo"&&!FEATURES.allowCustomerUpload) || (tool==="text"&&!FEATURES.allowText)
    || (tool==="logo" && FEATURES.showClubLogos===false && FEATURES.showMotifPicker===false) || (tool==="initials"&&!FEATURES.allowInitials)
    || (tool==="printColor"&&!FEATURES.allowText&&!FEATURES.allowInitials&&(!FEATURES.allowMotifColor||FEATURES.showMotifColorPicker===false))
    || tool==="product" || tool==="logo";
});
function printPointAt(clientX,clientY){
  const rect=printDropZone.getBoundingClientRect();
  return {
    x:Math.max(PRINT_SIDE_MARGIN,Math.min(PRINT_SIDE_MARGIN+PRINT_BASE_WIDTH,(clientX-rect.left)/rect.width*PRINT_CANVAS_WIDTH)),
    y:Math.max(PRINT_HEADROOM,Math.min(PRINT_HEADROOM+PRINT_BASE_HEIGHT,(clientY-rect.top)/rect.height*PRINT_CANVAS_HEIGHT))
  };
}
function useDesignTool(tool,point=null){
  if(tool==="photo" && FEATURES.allowCustomerUpload){
    pendingUploadPoint=point;
    customerLogoUpload?.click();
  }else if(tool==="text" && FEATURES.allowText){
    openTextDialog(point);
  }else if(tool==="product"){
    document.getElementById("productSection")?.scrollIntoView({behavior:"smooth",block:"start"});
  }else if(tool==="initials"){
    document.getElementById("initialsPop")?.scrollIntoView({behavior:"smooth",block:"start"});
    document.getElementById("initialsInput")?.focus();
  }else if(tool==="logo"){
    if(point){
      const section=document.querySelector(".club-logo-section:not([hidden]),.motif-section:not([hidden])");
      const chosen=section?.querySelector(".motif-btn.active[data-src]")||section?.querySelector(".motif-btn[data-src]");
      chosen?.click(); // Vereinslogos übernehmen ihre im Admin gespeicherte Position.
    }else document.querySelector(".club-logo-section:not([hidden]),.motif-section:not([hidden])")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
}
designTools.forEach(button=>{
  button.setAttribute("aria-controls","editorToolMenu");
  button.setAttribute("aria-expanded","false");
  button.addEventListener("click",()=>{
    if(button.dataset.dragged==="true"){button.dataset.dragged="false";return;}
    toggleDesignMenu(button.dataset.designTool);
  });
  button.addEventListener("dragstart",event=>{
    if(button.hidden){event.preventDefault();return;}
    event.dataTransfer.effectAllowed="copy";
    event.dataTransfer.setData("application/x-shirtprojekt-tool",button.dataset.designTool);
  });
});
printDropZone?.addEventListener("dragover",event=>{
  const types=Array.from(event.dataTransfer?.types||[]);
  if(types.includes("Files") || types.includes("application/x-shirtprojekt-tool")){
    event.preventDefault();event.dataTransfer.dropEffect="copy";
  }
});
printDropZone?.addEventListener("drop",event=>{
  event.preventDefault();
  const point=printPointAt(event.clientX,event.clientY);
  const file=Array.from(event.dataTransfer?.files||[]).find(item=>item.type.startsWith("image/"));
  if(file && FEATURES.allowCustomerUpload) handleCustomerUploadFile(file,point);
  else useDesignTool(event.dataTransfer?.getData("application/x-shirtprojekt-tool"),point);
});
// HTML-Drag-and-drop startet auf iPhones nicht. Touch benutzt denselben Ablagepunkt.
designTools.forEach(button=>{
  let gesture=null;
  button.addEventListener("pointerdown",event=>{
    if(event.pointerType!=="touch"||button.hidden)return;
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    button.setPointerCapture?.(event.pointerId);
  });
  button.addEventListener("pointermove",event=>{
    if(!gesture||event.pointerId!==gesture.id)return;
    if(Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>10) gesture.moved=true;
    if(gesture.moved){
      if(!gesture.ghost){
        gesture.ghost=document.createElement("div");
        gesture.ghost.className="editor-drag-ghost";
        gesture.ghost.textContent=button.querySelector("strong")?.textContent||"Motiv";
        document.body.appendChild(gesture.ghost);
      }
      gesture.ghost.style.left=`${event.clientX+14}px`;
      gesture.ghost.style.top=`${event.clientY+14}px`;
      button.classList.add("is-dragging");
      const r=printDropZone?.getBoundingClientRect();
      printDropZone?.classList.toggle("drag-target",!!r&&event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom);
    }
  });
  const finish=event=>{
    if(!gesture||event.pointerId!==gesture.id)return;
    if(gesture.moved){
      button.dataset.dragged="true";
      setTimeout(()=>{button.dataset.dragged="false"},350);
      const r=printDropZone?.getBoundingClientRect();
      if(r&&event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)
        useDesignTool(button.dataset.designTool,printPointAt(event.clientX,event.clientY));
    }
    gesture.ghost?.remove();
    button.classList.remove("is-dragging");printDropZone?.classList.remove("drag-target");gesture=null;
  };
  button.addEventListener("pointerup",finish);
  button.addEventListener("pointercancel",finish);
});

if (resetBtn) resetBtn.addEventListener("click", function() {
  viewStates.front = null; viewStates.back = null;
  Object.keys(selectedLogoByProduct).forEach(id=>delete selectedLogoByProduct[id]);
  canvas.clear(); canvas.backgroundColor = "transparent";
  currentView = "front";
  designerStatus.textContent = "Vorderseite";
  printZone.classList.remove("back");
  canvas.setWidth(PRINT_CANVAS_WIDTH); canvas.setHeight(PRINT_CANVAS_HEIGHT);
  viewButtons.forEach(button => {
    const active=button.dataset.view === "front";
    button.classList.toggle("active",active);
    button.setAttribute("aria-pressed",String(active));
  });
  motifButtons.forEach(button => button.classList.remove("active"));
  changeShirtColor("#ffffff", "White", "white", "");
  recolorActiveMotif("#000000", "Black");
  canvas.requestRenderAll();
  syncProductPrintSideControls();
});

canvas.on("object:scaling",function(event){
  if(event.target?.motifKind==="upload") keepCustomerUploadOnShirt(event.target);
  if(event.target?.motifKind==="text") keepCustomerTextOnShirt(event.target);
});
canvas.on("object:moving",function(event){
  if(event.target?.motifKind==="upload") keepCustomerUploadOnShirt(event.target);
  if(event.target?.motifKind==="text") keepCustomerTextOnShirt(event.target);
});
canvas.on("object:rotating",event=>{
  if(event.target?.motifKind==="text")keepCustomerTextOnShirt(event.target);
  if(event.target?.motifKind==="upload")keepCustomerUploadOnShirt(event.target);
});
canvas.on("text:changed",event=>{keepCustomerTextOnShirt(event.target);saveCurrentView()});
// Zwei Finger skalieren die eigene Datei gleichmäßig, ohne das Textil zu verschieben.
if(canvas.upperCanvasEl){
  let uploadPinch=null;
  const distance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
  canvas.upperCanvasEl.addEventListener("touchstart",event=>{
    if(event.touches.length!==2)return;
    const image=currentUploadedMotif();
    if(!image)return;
    uploadPinch={image,distance:distance(event.touches),scale:image.scaleX};
    event.preventDefault();event.stopImmediatePropagation();
  },{passive:false,capture:true});
  canvas.upperCanvasEl.addEventListener("touchmove",event=>{
    if(!uploadPinch)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(event.touches.length!==2)return;
    uploadPinch.image.scale(uploadPinch.scale*distance(event.touches)/Math.max(1,uploadPinch.distance));
    keepCustomerUploadOnShirt(uploadPinch.image);
    canvas.setActiveObject(uploadPinch.image);
    canvas.requestRenderAll();
  },{passive:false,capture:true});
  const finishPinch=event=>{
    if(!uploadPinch)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(event.touches.length>=2)return;
    keepCustomerUploadOnShirt(uploadPinch.image);
    uploadPinch=null;
    canvas.requestRenderAll();saveCurrentView();syncCustomerUploadControls();
  };
  canvas.upperCanvasEl.addEventListener("touchend",finishPinch,{passive:false,capture:true});
  canvas.upperCanvasEl.addEventListener("touchcancel",finishPinch,{passive:false,capture:true});
}
canvas.on("object:modified", function(event) {
  const object = event.target;
  if (!object) return;
  if(object.motifKind==="text"){
    keepCustomerTextOnShirt(object);canvas.requestRenderAll();saveCurrentView();return;
  }
  if(object.motifKind==="upload"){
    keepCustomerUploadOnShirt(object);canvas.requestRenderAll();saveCurrentView();syncCustomerUploadControls();return;
  }
  object.setCoords();
  const bounds = object.getBoundingRect(true, true);
  let left = object.left, top = object.top;
  if (bounds.left < 0) left += -bounds.left;
  if (bounds.left + bounds.width > canvas.width) left -= bounds.left + bounds.width - canvas.width;
  if (bounds.top < 0) top += -bounds.top;
  if (bounds.top + bounds.height > canvas.height) top -= bounds.top + bounds.height - canvas.height;
  object.set({ left, top }); object.setCoords(); canvas.requestRenderAll(); saveCurrentView();
  if(object.motifKind==="upload")syncCustomerUploadControls();
});



// v14: Mehrere unterschiedliche Shirts in einer Bestellung
const shirtSize = document.getElementById("shirtSize");
function renderSizePills(){
  const select=document.getElementById("shirtSize");
  const host=document.getElementById("sizePills");
  if(!select || !host) return;
  if(select.options.length<=1){
    ["S","M","L","XL","2XL","3XL","4XL","5XL"].forEach(size=>{
      const option=document.createElement("option");
      option.value=size;
      option.textContent=size;
      select.appendChild(option);
    });
  }
  const sizes=Array.from(select.options).map(opt=>opt.value).filter(Boolean);
  host.replaceChildren();
  sizes.forEach(size=>{
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="size-pill"+(select.value===size?" active":"");
    btn.textContent=size;
    btn.dataset.size=size;
    btn.setAttribute("role","option");
    btn.addEventListener("click",()=>{
      select.value=size;
      host.querySelectorAll(".size-pill").forEach(el=>el.classList.toggle("active",el.dataset.size===size));
    });
    host.appendChild(btn);
  });
}
renderSizePills();
const shirtQuantity = document.getElementById("shirtQuantity");
const addToOrderBtn = document.getElementById("addToOrderBtn");
const addToOrderLabel = document.getElementById("addToOrderLabel");
const addToOrderPrice = document.getElementById("addToOrderPrice");
const orderBtn = document.getElementById("orderBtn");
const orderMessage = document.getElementById("orderMessage");
const cartBox = document.getElementById("cartBox");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutTotal = document.getElementById("checkoutTotal");
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
shirtQuantity?.addEventListener("input", updateProductPriceLabel);
shirtQuantity?.addEventListener("change", updateProductPriceLabel);
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
  const uploads=getCustomerUploads();
  if(uploads.length) return uploads.map(({side,image})=>
    `${uploads.length>1?(side==="front"?"Vorne: ":"Hinten: "):""}Eigenes Logo (${image.motifName||"Upload"})`).join(" · ");
  const selections=selectedLogoByProduct[currentProductId];
  if(selections && typeof selections==="object"){
    const names=(currentProductId==="jh050"?["back"]:["front","back"]).flatMap(side=>{
      const motif=(SHOP.motifs||[]).find(item=>item.id===selections[side]);
      return motif ? [`${side==="front"?"Vorne":"Rücken"}: ${motif.name||motif.id}`] : [];
    });
    if(names.length) return names.join(" · ");
  }
  const active = document.querySelector(".motif-btn.active");
  if (active) return active.textContent.replace(/\s+/g, " ").trim();
  const text = canvas.getObjects().find(obj => obj && obj.motifKind === "text");
  if (text) return `Eigener Text: ${text.text || text.motifName || "Text"}`;
  return "Noch kein Motiv gewählt";
}

function getCustomerUploads(){
  return (currentProductId==="jh050"?["back"]:["front","back"]).flatMap(side=>{
    const objects=side===currentView ? canvas.getObjects() : viewStates[side]?.objects||[];
    const image=objects.find(object=>object?.motifKind==="upload");
    return image?[{side,image}]:[];
  });
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
  const product = getCurrentProduct();
  const size = shirtSize.value;
  const quantity = Math.max(1, Math.min(99, Number(shirtQuantity.value) || 1));
  shirtQuantity.value = quantity;
  const activeMotif = document.querySelector(".motif-btn.active");
  const uploads=getCustomerUploads();
  const hasCustomDesign = uploads.length>0 || canvas.getObjects().some(obj => obj?.motifKind === "text");

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
  if (MASTER_FIXED_CHEST_LOGO){
    const selections=selectedLogoByProduct[currentProductId];
    for(const side of (product.id==="jh050"?["back"]:["front","back"])){
      if(uploads.some(upload=>upload.side===side))continue;
      const motif=(SHOP.motifs||[]).find(item=>item.id===selections?.[side]);
      if(motif) fixedPrintParts.push(`${side==="front"?"Vorne":"Rücken"}: ${motif.name||motif.id}, Position ${getMotifPlacement(motif)?.xPct??(side==="front"?68:50)} % / ${getMotifPlacement(motif)?.yPct??(side==="front"?19:32)} %, Breite ${getMotifPlacement(motif)?.widthPct??(side==="front"?22:40)} %`);
    }
  }
  else {
    if (product.id!=="jh050" && SHOP.fixedPrint?.front?.enabled) fixedPrintParts.push("Vorne: linke Herzseite klein");
    if (SHOP.fixedPrint?.back?.enabled) fixedPrintParts.push("Hinten: groß mittig");
  }
  uploads.forEach(({side,image})=>{
    const x=Math.round((image.left-PRINT_SIDE_MARGIN)/PRINT_BASE_WIDTH*100);
    const y=Math.round((image.top-PRINT_HEADROOM)/PRINT_BASE_HEIGHT*100);
    const width=Math.round(image.width*image.scaleX/PRINT_BASE_WIDTH*100);
    fixedPrintParts.push(`${side==="front"?"Vorne":"Hinten"}: eigenes Motiv, X ${x} %, Y ${y} %, Breite ${width} %`);
  });
  return {
    id: Date.now() + Math.random(),
    productId: product.id,
    productName: product.name || "T-Shirt",
    articleNo: product.articleNo || "",
    unitPrice: getCurrentUnitPrice(),
    purchasePrice: Number(product.purchasePriceBySize?.[size] ?? product.purchasePrice) || 0,
    printCost: Number(product.printCost) || 0,
    shirtColor: currentColorName.textContent || "White",
    motif: getSelectedMotifName(),
    uploadFileName: uploads[0]?.image.motifName || "",
    uploadFileNames: uploads.map(({image})=>image.motifName).filter(Boolean),
    motifColor: currentMotifColorName.textContent || currentMotifColorLabel,
    initials: initialsValue(),
    initialsColor: initialsValue() ? (currentMotifColorLabel || getInitialsColor()) : "",
    printLayout: fixedPrintParts.join(" · "),
    size,
    quantity
  };
}

function renderCart() {
  const total = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = orderItems.reduce((sum, item) => sum + item.quantity * (Number(item.unitPrice) || SHIRT_PRICE), 0);
  cartBox.hidden = orderItems.length === 0;
  cartCount.textContent = `${total} ${total === 1 ? "Textil" : "Textilien"}`;
  if (cartTotal) cartTotal.textContent = formatEuro(totalPrice);
  if (checkoutTotal) checkoutTotal.textContent = formatEuro(totalPrice);
  cartItems.replaceChildren();

  orderItems.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "cart-item";

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const top = document.createElement("div");
    top.className = "cart-item-top";

    const title = document.createElement("strong");
    title.textContent = `${item.quantity}× ${item.productName || "T-Shirt"} · ${item.size}`;

    const price = document.createElement("b");
    price.className = "cart-item-price";
    price.textContent = formatEuro(item.quantity * (Number(item.unitPrice) || SHIRT_PRICE));

    top.append(title, price);

    const meta = document.createElement("span");
    // Kundenseitig kompakt halten: Motiv-, Druckfarben- und Positionsdetails
    // werden weiterhin im Bestellobjekt gespeichert, aber nicht unter jedem
    // Shirt als langer Text angezeigt.
    meta.textContent = `${item.shirtColor}${item.initials ? ` · Initialen: ${item.initials} (${item.initialsColor || item.motifColor || "Druckfarbe"})` : ""}`;
    info.append(top, meta);

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
  if(["jh050","s279"].includes(getCurrentProduct().id) && !(Number(getCurrentProduct().price)>0)){
    orderMessage.textContent=`Für ${getCurrentProduct().name} ist noch kein Verkaufspreis hinterlegt.`;
    return;
  }
  if(typeof validateInitialsField==="function" && !validateInitialsField()){
    document.getElementById("initialsInput")?.focus();
    return;
  }
  const item = getCurrentShirtSelection();
  if (!item) return;

  // Gleiche Kombinationen werden automatisch zusammengefasst.
  const existing = orderItems.find(entry =>
    entry.productId === item.productId &&
    entry.shirtColor === item.shirtColor &&
    entry.motif === item.motif &&
    entry.motifColor === item.motifColor &&
    entry.initials === item.initials &&
    entry.initialsColor === item.initialsColor &&
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
    `${i + 1}. ${item.quantity}x | Artikel: ${item.productName || "T-Shirt"} | Größe ${item.size} | Farbe: ${item.shirtColor} | Motiv: ${item.motif} | Motivfarbe: ${item.motifColor}${item.initials ? ` | Initialen: ${item.initials} (${item.initialsColor || item.motifColor || "Druckfarbe"})` : ""}${item.printLayout ? ` | Druck: ${item.printLayout}` : ""} | Preis: ${formatEuro(item.quantity * (Number(item.unitPrice) || SHIRT_PRICE))}`
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
    const visiblePrice = FEATURES.showPrices === false ? "" : ` · ${formatEuro(item.quantity * (Number(item.unitPrice) || SHIRT_PRICE))}`;
    orderSummary.appendChild(summaryRow(
      `Position ${i + 1}`,
      `${item.quantity}× ${item.productName || "T-Shirt"} · ${item.size} · ${item.shirtColor} · ${item.motif} · ${item.motifColor}${item.initials ? ` · Initialen: ${item.initials} (${item.initialsColor || item.motifColor || "Druckfarbe"})` : ""}${item.printLayout ? ` · ${item.printLayout}` : ""}${visiblePrice}`
    ));
  });
  orderSummary.appendChild(summaryRow("Gesamtmenge", String(total)));
  if (FEATURES.showPrices !== false) orderSummary.appendChild(summaryRow("Gesamtpreis", formatEuro(totalPrice)));

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

const deliveryTypeSelect = document.getElementById("customerDeliveryType");
const paymentMethodSelect = document.getElementById("customerPaymentMethod");
function syncPaymentWithDelivery(){
  if(!deliveryTypeSelect || !paymentMethodSelect) return;
  const cashOption = Array.from(paymentMethodSelect.options).find(option => option.value === "Bar bei Abholung");
  const isShipping = deliveryTypeSelect.value === "Versand";
  if(cashOption) cashOption.disabled = isShipping;
  if(isShipping && paymentMethodSelect.value === "Bar bei Abholung") paymentMethodSelect.value = "Überweisung";
}
if(deliveryTypeSelect){
  deliveryTypeSelect.addEventListener("change", syncPaymentWithDelivery);
  syncPaymentWithDelivery();
}
document.querySelectorAll("[data-close-order]").forEach(el => el.addEventListener("click", closeOrderSummary));
document.addEventListener("keydown", e => { if (e.key === "Escape" && !orderModal.hidden) closeOrderSummary(); });

if (orderForm) {
  let orderSubmitting = false;
  const sendOrderBtn = document.getElementById("sendOrderBtn");

  async function submitBindingOrder(event) {
    if (event) event.preventDefault();
    if (orderSubmitting) return;

    if (sendOrderMessage) {
      sendOrderMessage.classList.remove("success");
      sendOrderMessage.textContent = "Bestellung wird geprüft …";
    }

    try {
      const nameEl = document.getElementById("customerName");
      const classEl = document.getElementById("customerClass");
      const emailEl = document.getElementById("customerEmail");
      const streetEl = document.getElementById("customerStreet");
      const cityEl = document.getElementById("customerCity");
      const legacyAddressEl = document.getElementById("customerAddress");
      const deliveryEl = document.getElementById("customerDeliveryType");
      const paymentEl = document.getElementById("customerPaymentMethod");
      const phoneEl = document.getElementById("customerPhone");

      if (!Array.isArray(orderItems) || !orderItems.length) {
        if (sendOrderMessage) sendOrderMessage.textContent = "Die Bestellung enthält noch keine Shirts.";
        return;
      }

      // Pflichtfelder robust prüfen. Fehlende DOM-Elemente dürfen den Klick nicht mehr still abbrechen.
      const baseFields = [nameEl, classEl, emailEl];
      const missingBase = baseFields.find(el => !el || !String(el.value || "").trim());
      if (missingBase || baseFields.some(el => !el)) {
        if (sendOrderMessage) sendOrderMessage.textContent = "Bitte Vor- und Nachname, Verein / Firma und E-Mail vollständig ausfüllen.";
        try { if (missingBase) missingBase.focus(); } catch (_) {}
        return;
      }

      let street = streetEl ? String(streetEl.value || "").trim() : "";
      let city = cityEl ? String(cityEl.value || "").trim() : "";
      let legacyAddress = legacyAddressEl ? String(legacyAddressEl.value || "").trim() : "";

      // Rückwärtskompatibel: falls eine alte Shop-/Cache-Version noch nur ein Adressfeld liefert.
      if ((!street || !city) && legacyAddress) {
        const lines = legacyAddress.split(/\n+/).map(v => v.trim()).filter(Boolean);
        if (!street) street = lines[0] || legacyAddress;
        if (!city) city = lines.slice(1).join(", ") || "";
      }

      if (!street || !city) {
        if (sendOrderMessage) sendOrderMessage.textContent = "Bitte Straße / Hausnummer und PLZ / Ort vollständig ausfüllen.";
        try { (street ? cityEl : streetEl)?.focus(); } catch (_) {}
        return;
      }

      if (emailEl && !emailEl.checkValidity()) {
        if (sendOrderMessage) sendOrderMessage.textContent = "Bitte eine gültige E-Mail-Adresse eingeben.";
        try { emailEl.focus(); } catch (_) {}
        return;
      }

      const attachments=[...new Set(orderItems.flatMap(item=>item.uploadFileNames||[item.uploadFileName]).filter(Boolean))]
        .map(fileName=>customerLogoFiles.get(fileName)).filter(Boolean);
      if(attachments.reduce((sum,file)=>sum+file.size,0)>10*1024*1024){
        if(sendOrderMessage) sendOrderMessage.textContent="Eigene Bilddateien dürfen zusammen höchstens 10 MB groß sein. Bitte kleinere Dateien verwenden.";
        return;
      }

      const name = nameEl.value.trim();
      const customerClass = classEl.value.trim();
      const email = emailEl.value.trim();
      const address = [street, city].filter(Boolean).join("\n");
      const deliveryType = deliveryEl && String(deliveryEl.value || "").trim() ? deliveryEl.value : "Abholung";
      let paymentMethod = paymentEl && String(paymentEl.value || "").trim() ? paymentEl.value : "Bar bei Abholung";
      if (deliveryType === "Versand" && paymentMethod === "Bar bei Abholung") paymentMethod = "Überweisung";
      const phone = phoneEl ? phoneEl.value.trim() : "";

      orderSubmitting = true;
      if (sendOrderBtn) {
        sendOrderBtn.disabled = true;
        sendOrderBtn.setAttribute("aria-busy", "true");
      }
      if (sendOrderMessage) sendOrderMessage.textContent = "Bestellung wird verbindlich gespeichert …";

      const totalQuantity = orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const totalPrice = orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || SHIRT_PRICE), 0);
      const orderNumber = createOrderNumber();

      if (formOrderItems) formOrderItems.value = orderItemsAsText();
      if (formTotalQuantity) formTotalQuantity.value = String(totalQuantity);
      if (formOrderNumber) formOrderNumber.value = orderNumber;
      if (formTotalPrice) formTotalPrice.value = formatEuro(totalPrice);
      const formAddress = document.getElementById("formAddress");
      if (formAddress) formAddress.value = address;

      const orderPayload = {
        orderNumber,
        customerId: CUSTOMER_ID,
        customerName: SHOP.customerName || SHOP.brandTitle || CUSTOMER_ID,
        sourcePath: window.location.pathname,
        name,
        customerClass,
        email,
        phone,
        whatsapp: phone,
        address,
        deliveryType,
        paymentMethod,
        showPrices: FEATURES.showPrices !== false,
        showNexaroBranding: FEATURES.showNexaroBranding !== false,
        totalQuantity,
        unitPrice: orderItems.length === 1 ? (Number(orderItems[0].unitPrice) || SHIRT_PRICE) : null,
        totalPrice,
        status: "Neu",
        printData: SHOP.printData || {},
        items: orderItems.map(item => ({
          productId: item.productId || "tshirt",
          productName: item.productName || "T-Shirt",
          articleNo: item.articleNo || "",
          unitPrice: Number(item.unitPrice) || SHIRT_PRICE,
          purchasePrice: Number(item.purchasePrice) || 0,
          printCost: Number(item.printCost) || 0,
          totalCost: (Number(item.quantity) || 1) * ((Number(item.purchasePrice) || 0) + (Number(item.printCost) || 0)),
          shirtColor: item.shirtColor || "",
          motif: item.motif || "",
          uploadFileName: item.uploadFileName || "",
          uploadFileNames: item.uploadFileNames || [],
          motifColor: item.motifColor || "",
          initials: item.initials || "",
          initialsColor: item.initialsColor || "",
          printLayout: item.printLayout || "",
          size: item.size || "",
          quantity: Number(item.quantity) || 1,
          linePrice: (Number(item.quantity) || 1) * (Number(item.unitPrice) || SHIRT_PRICE)
        }))
      };

      const confirmationKey = `shirtOrderConfirmation:${CUSTOMER_ID}`;
      const confirmationJson = JSON.stringify(orderPayload);
      sessionStorage.setItem(confirmationKey, confirmationJson);
      localStorage.setItem(confirmationKey, confirmationJson);

      // Firestore speichern. Fehler werden sichtbar und blockieren nicht still.
      const db = getFirestoreDb();
      const firestorePayload = { ...orderPayload };
      if (window.firebase && firebase.firestore && firebase.firestore.FieldValue) {
        firestorePayload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      await Promise.race([
        db.collection("orders").doc(orderNumber).set(firestorePayload),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Speichern dauert zu lange")), 8000))
      ]);

      // Originaldateien per Bestell-E-Mail mitsenden; vor der Weiterleitung auf den Upload warten.
      let attachmentDelivered=true;
      try {
        const targetEmail = String(SHOP.orderEmail || "shirtzentrale@gmail.com").trim();
        const mailData = new FormData(orderForm);
        mailData.set("Bestellung", orderItemsAsText());
        mailData.set("Gesamtmenge", String(totalQuantity));
        mailData.set("Bestellnummer", orderNumber);
        mailData.set("Gesamtpreis", formatEuro(totalPrice));
        mailData.set("Adresse", address);
        mailData.set("Bestellart", deliveryType);
        mailData.set("Zahlung", paymentMethod);
        attachments.forEach((file,index)=>mailData.append(index===0?"attachment":`attachment${index+1}`,file,file.name));
        const mailController=attachments.length ? new AbortController() : null;
        const mailRequest=fetch(`https://formsubmit.co/${targetEmail}`, {
          method: "POST",
          body: mailData,
          mode: "no-cors",
          keepalive: attachments.length===0,
          ...(mailController?{signal:mailController.signal}:{})
        });
        if(attachments.length){
          const timeout=setTimeout(()=>mailController.abort(),30000);
          try{await mailRequest;}finally{clearTimeout(timeout);}
        }
        else mailRequest.catch(() => {});
      } catch (_) { if(attachments.length) attachmentDelivered=false; }

      if(!attachmentDelivered){
        if(sendOrderMessage) sendOrderMessage.textContent=`Bestellung ${orderNumber} gespeichert, aber die Bilddatei konnte nicht versendet werden. Bitte die Datei mit der Bestellnummer per E-Mail nachreichen.`;
        return;
      }

      if (sendOrderMessage) {
        sendOrderMessage.classList.add("success");
        sendOrderMessage.textContent = `Bestellung ${orderNumber} wurde gespeichert.`;
      }

      const thanksUrl = new URL("/danke.html", window.location.origin);
      thanksUrl.searchParams.set("shop", CUSTOMER_ID);
      window.location.assign(thanksUrl.href);
    } catch (error) {
      console.error("Verbindliche Bestellung fehlgeschlagen:", error);
      if (sendOrderMessage) {
        sendOrderMessage.classList.remove("success");
        const msg = error && error.message ? error.message : "Unbekannter Fehler";
        sendOrderMessage.textContent = `Bestellung konnte nicht gespeichert werden: ${msg}`;
      }
      orderSubmitting = false;
      if (sendOrderBtn) {
        sendOrderBtn.disabled = false;
        sendOrderBtn.removeAttribute("aria-busy");
      }
    }
  }

  // Expliziter Klick-Handler: funktioniert auch dann, wenn native Submit-Validierung
  // das submit-Event im Browser nicht auslöst.
  if (sendOrderBtn) sendOrderBtn.addEventListener("click", submitBindingOrder);
  orderForm.addEventListener("submit", submitBindingOrder);
}

// Startzustand. Feste Shopfarben haben Vorrang vor der allgemeinen Auswahl.
const FIXED_SHIRT = SHOP.fixedShirtColor || null;
const FIXED_SHIRT_META = F140_ALLOWED_META || { name: FIXED_SHIRT?.name || "", defaultId: FIXED_SHIRT?.id || "", allowedIds: [] };
const FIXED_MOTIF = SHOP.fixedMotifColor || null;

if (FIXED_SHIRT && FIXED_SHIRT.color) {
  const fixedButton = FIXED_SHIRT_META.defaultId
    ? document.querySelector(`.shirt-color[data-id="${FIXED_SHIRT_META.defaultId}"]`)
    : null;
  changeShirtColor(
    fixedButton?.dataset.color || FIXED_SHIRT.color,
    fixedButton?.dataset.name || FIXED_SHIRT_META.name || FIXED_SHIRT.name || "Festfarbe",
    fixedButton?.dataset.id || FIXED_SHIRT_META.defaultId || FIXED_SHIRT.id || "fixed-shirt-color",
    fixedButton?.dataset.pattern || FIXED_SHIRT.pattern || ""
  );
} else {
  const firstVisibleColor = document.querySelector(".shirt-color");
  if (firstVisibleColor) {
    changeShirtColor(firstVisibleColor.dataset.color, firstVisibleColor.dataset.name, firstVisibleColor.dataset.id, firstVisibleColor.dataset.pattern || "");
  } else {
    changeShirtColor("#ffffff", "White", "white", "");
  }
}

if (FIXED_MOTIF && FIXED_MOTIF.color) {
  currentMotifColor = FIXED_MOTIF.color;
  currentMotifColorLabel = POLIFLEX_ALLOWED_META.name || "Yellow";
  currentMotifColorName.textContent = currentMotifColorLabel;
}
updateActiveMotifColorButton(currentMotifColor, currentMotifColorLabel);
async function initializeFixedPrints() {
  logoEnabled = false;
  document.querySelectorAll(".motif-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.motif === "none"));
  if (typeof clearShirtLogos === "function") clearShirtLogos();
  if (currentView !== "front") switchView("front");
  applyPreviewMode();
  if (FEATURES.previewMode === "dual") await renderDualPreview();
}
applyPreviewMode();
initializeFixedPrints()
  .then(async () => {
    await applyProductMotifRule(true);
    // Die finale Shopfarbe noch einmal vollständig rendern und erst danach
    // die Oberfläche freigeben. Dadurch blitzen weder das weiße
    // Standard-Shirt noch die ungefilterte Farbauswahl kurz auf.
    await renderShirt();
    if (shirtMockup && typeof shirtMockup.decode === "function") {
      try { await shirtMockup.decode(); } catch (e) {}
    }
    requestAnimationFrame(() => {
      document.body.classList.remove("shop-loading");
    });
  })
  .catch((error) => {
    console.error("Shop-Start konnte nicht vollständig vorbereitet werden:", error);
    document.body.classList.remove("shop-loading");
  });

// v29.1.5: Mobile Vorschau exakt wie Admin skalieren.
// Die interne Geometrie bleibt immer 590px breit mit aspect-ratio .86;
// nur die komplette Stage wird proportional verkleinert.
(function syncAdminMobilePreviewGeometry() {
  const BASE_STAGE_WIDTH = 590;
  const BASE_STAGE_HEIGHT = BASE_STAGE_WIDTH / 0.86;

  function update() {
    const stage = document.querySelector('.mockup-stage');
    if (!stage) return;

    stage.style.removeProperty('--mobile-preview-scale');
    stage.style.transform = "none";
    return;
  }

  update();
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('orientationchange', update, { passive: true });
})();

window.dockShirtColorRail=function(){
  const workspace=document.querySelector(".workspace");
  const section=document.querySelector(".color-section");
  const view=document.querySelector(".view-section");
  if(!workspace||!section) return;
  let leftRail=workspace.querySelector(".preview-left-rail");
  if(!leftRail){
    leftRail=document.createElement("aside");leftRail.id="previewLeftRail";leftRail.className="preview-left-rail";leftRail.setAttribute("aria-label","Textilien und Textilfarben");
    const icons=document.createElement("nav");icons.className="textile-icon-rail";icons.setAttribute("aria-label","Textil wählen");
    leftRail.appendChild(icons);workspace.insertBefore(leftRail,workspace.firstChild);
  }
  if(section.parentElement!==leftRail)leftRail.appendChild(section);
  if(view&&view.parentElement!==workspace){
    workspace.insertBefore(view,workspace.querySelector(".editor-dnd-rail"));
  }
  renderTextileIconRail();
  workspace.classList.add("has-color-rail");
  if(FEATURES.showShirtColorPicker===false){
    section.hidden=true;
    return;
  }
  section.hidden=false;
  section.removeAttribute("hidden");
  section.classList.add("color-rail");
  workspace.classList.add("has-color-rail");
  const host=section.querySelector(".shirt-colors");
  if(!host) return;
  const existing=host.querySelectorAll(".shirt-color");
  existing.forEach(button=>{
    const hex=button.dataset.color||button.style.getPropertyValue("--swatch")||"#888";
    button.style.setProperty("--swatch",hex);
    let icon=button.querySelector(".rail-color-svg");
    if(!icon){
      icon=document.createElementNS("http://www.w3.org/2000/svg","svg");icon.classList.add("rail-color-svg");
      icon.setAttribute("viewBox","0 0 36 36");icon.setAttribute("width","36");icon.setAttribute("height","36");icon.setAttribute("aria-hidden","true");
      icon.innerHTML='<circle class="selection-ring" cx="18" cy="18" r="16" fill="none" stroke="#bf9824" stroke-width="2"/><circle class="color-disc" cx="18" cy="18" r="12" stroke="#9aa4ad" stroke-width=".8"/>';
      button.appendChild(icon);
    }
    icon.querySelector(".color-disc").setAttribute("fill",hex);
  });
};

function validateInitialsField(){
  const field=document.getElementById("initialsInput");
  const err=document.getElementById("initialsError");
  if(!field) return true;
  if(field.dataset.composing==="true") return true;
  const raw=String(field.value||"");
  const clean=raw.toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g,"").slice(0,3);
  if(field.value!==clean) field.value=clean;
  let message="";
  if(/[^A-ZÄÖÜ0-9]/.test(raw.toUpperCase())) message="Nur Buchstaben und Zahlen.";
  else if(raw.length>3) message="Maximal 3 Zeichen.";
  const valid=!message;
  field.setAttribute("aria-invalid", valid?"false":"true");
  field.classList.toggle("is-invalid", !valid);
  if(err){
    err.hidden=valid;
    err.textContent=message;
  }
  if(typeof updateInitialsOnCanvas==="function") updateInitialsOnCanvas();
  return valid;
}
(function hardenInitials(){
  const field=document.getElementById("initialsInput");
  if(!field) return;
  field.maxLength=3;
  field.setAttribute("maxlength","3");
  field.setAttribute("pattern","[A-Za-zÄÖÜäöü0-9]{0,3}");
  field.value="";
  field.addEventListener("compositionstart",()=>{field.dataset.composing="true"});
  field.addEventListener("compositionend",()=>{delete field.dataset.composing;validateInitialsField()});
  // iOS liefert beim Tippen teils leere beforeinput-Daten. Erst nach der Eingabe bereinigen.
  field.addEventListener("input", validateInitialsField);
  field.addEventListener("blur", validateInitialsField);
  field.addEventListener("paste",()=>setTimeout(validateInitialsField,0));
  validateInitialsField();
})();

function ensureInitialsField(){
  const sidebar=document.querySelector(".sidebar");
  let box=document.getElementById("initialsPop");
  if(!box && sidebar){
    box=document.createElement("section");
    box.className="tool-section initials-section";
    box.id="initialsPop";
    box.innerHTML='<h3>Initialen</h3><div class="initials-controls"><div class="initials-field-wrap"><input id="initialsInput" class="feature-input" type="text" maxlength="3" value="" placeholder="ABC" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Initialen" aria-describedby="initialsHint"><p class="hint" id="initialsHint">1–3 Zeichen · A–Z und 0–9 · optional</p></div></div><p class="field-error" id="initialsError" hidden></p>';
    sidebar.appendChild(box);
  }
  if(box){
    const field=box.querySelector("#initialsInput");
    const hint=box.querySelector("#initialsHint");
    if(field && hint && !field.closest(".initials-field-wrap")){
      const wrapper=document.createElement("div");
      wrapper.className="initials-field-wrap";
      field.before(wrapper);
      wrapper.append(field,hint);
    }
    const wrap=box.querySelector(".initials-field-wrap");
    if(wrap && !wrap.closest(".initials-controls")){
      const controls=document.createElement("div");
      controls.className="initials-controls";
      wrap.before(controls);
      controls.appendChild(wrap);
    }
    box.querySelector(".initials-color-choice")?.remove();
    const controls=box.querySelector(".initials-controls");
    if(controls && hint && hint.parentElement!==controls) controls.appendChild(hint);
    box.hidden=!FEATURES.allowInitials;
    box.style.display=FEATURES.allowInitials?"":"none";
    const product=document.getElementById("productSection");
    if(product && product.parentElement && !window.matchMedia("(max-width:900px)").matches) product.insertAdjacentElement("afterend", box);
  }
  return box;
}
function orderCustomerSidebar(){
  const sidebar=document.querySelector(".sidebar");
  if(!sidebar) return;
  ensureInitialsField();
  const seq=["productSection",".club-logo-section",".motif-section",".customer-upload-section",".motif-color-section",".view-section",".order-section",".sidebar-bottom"];
  seq.forEach(sel=>{
    const node=sel.startsWith("#")||sel.startsWith(".")?sidebar.querySelector(sel):document.getElementById(sel);
    if(node && (node.parentElement===sidebar || sidebar.contains(node))) sidebar.appendChild(node);
  });
  syncMobileAfterShirtControls();
}
document.addEventListener("input",(ev)=>{
  if(ev.target && ev.target.id==="initialsInput" && !ev.isComposing && ev.target.dataset.composing!=="true"){
    ev.target.value=String(ev.target.value||"").toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g,"").slice(0,3);
    updateInitialsOnCanvas();
  }
});
function dockPricePatch(){
  const patch=document.getElementById("pricePatch");
  if(patch){ patch.hidden=true; patch.style.setProperty("display","none","important"); }
}
setTimeout(()=>{ window.dockShirtColorRail(); orderCustomerSidebar(); dockPricePatch(); updateInitialsOnCanvas(); },0);
setTimeout(()=>{ window.dockShirtColorRail(); orderCustomerSidebar(); dockPricePatch(); updateInitialsOnCanvas(); },250);
