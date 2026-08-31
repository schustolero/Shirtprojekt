const CENTRAL = window.CENTRAL_CONFIG || {};
const ADMIN_EMAIL = String(CENTRAL.adminEmail || "shirtzentrale@gmail.com").toLowerCase();
if (CENTRAL.adminTitle) document.title = CENTRAL.adminTitle;
const auth = firebase.auth();
const db = firebase.firestore();
const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const ordersList = document.getElementById("ordersList");
const ordersMessage = document.getElementById("ordersMessage");
const refreshBtn = document.getElementById("refreshBtn");
const statOrders = document.getElementById("statOrders");
const statShirts = document.getElementById("statShirts");
const statRevenue = document.getElementById("statRevenue");
const lastUpdate = document.getElementById("lastUpdate");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const customerFilter = document.getElementById("customerFilter");
let loadedOrders = [];

const STATUSES = ["Neu", "In Bearbeitung", "Fertig", "Abgeholt"];

function euro(value){return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(value)||0)}
function dateText(ts){if(!ts||!ts.toDate)return "Datum wird geladen";return ts.toDate().toLocaleString("de-DE",{dateStyle:"medium",timeStyle:"short"})}
function text(value,fallback="–"){return value===undefined||value===null||value===""?fallback:String(value)}

async function loadOrders(){
  ordersList.replaceChildren();
  ordersMessage.hidden = true;
  lastUpdate.textContent = "Bestellungen werden geladen …";
  try{
    const snap = await db.collection("orders").orderBy("createdAt","desc").get();
    loadedOrders = snap.docs.map(doc => ({ id: doc.id, order: doc.data() }));
    refreshCustomerFilter();
    applyFilters();
    lastUpdate.textContent = `Aktualisiert: ${new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}`;
  }catch(err){
    console.error(err);
    ordersMessage.textContent = "Bestellungen konnten nicht geladen werden.";
    ordersMessage.hidden = false;
    lastUpdate.textContent = "Fehler beim Laden";
  }
}

function updateStats(entries){
  let shirts=0,revenue=0;
  entries.forEach(({order})=>{
    shirts += Number(order.totalQuantity)||0;
    revenue += Number(order.totalPrice)||0;
  });
  statOrders.textContent = entries.length;
  statShirts.textContent = shirts;
  statRevenue.textContent = euro(revenue);
}

function searchableText(entry){
  const o = entry.order || {};
  return [
    o.orderNumber, entry.id, o.customerId, o.customerName, o.name, o.customerClass, o.email, o.phone, o.status,
    ...(Array.isArray(o.items) ? o.items.flatMap(item => [item.size,item.shirtColor,item.motif,item.motifColor]) : [])
  ].filter(Boolean).join(" ").toLowerCase();
}

function refreshCustomerFilter(){
  if(!customerFilter)return;
  const previous=customerFilter.value||"Alle";
  const customers=new Map();
  loadedOrders.forEach(({order})=>{
    const id=order.customerId||"ohne-kunde";
    customers.set(id,order.customerName||id);
  });
  customerFilter.replaceChildren();
  const all=document.createElement("option");all.value="Alle";all.textContent="Alle Kunden";customerFilter.appendChild(all);
  [...customers.entries()].sort((x,y)=>x[1].localeCompare(y[1],"de")).forEach(([id,name])=>{const o=document.createElement("option");o.value=id;o.textContent=name;customerFilter.appendChild(o)});
  customerFilter.value=[...customerFilter.options].some(o=>o.value===previous)?previous:"Alle";
}

function applyFilters(){
  const query = (searchInput.value || "").trim().toLowerCase();
  const selectedStatus = statusFilter.value || "Alle";
  const selectedCustomer = customerFilter ? (customerFilter.value || "Alle") : "Alle";
  const filtered = loadedOrders.filter(entry => {
    const status = entry.order.status || "Neu";
    const statusMatch = selectedStatus === "Alle" || status === selectedStatus;
    const customerMatch = selectedCustomer === "Alle" || (entry.order.customerId || "ohne-kunde") === selectedCustomer;
    const searchMatch = !query || searchableText(entry).includes(query);
    return statusMatch && customerMatch && searchMatch;
  });

  updateStats(filtered);
  ordersList.replaceChildren();
  filtered.forEach(entry => ordersList.appendChild(renderOrder(entry.id, entry.order)));
  ordersMessage.textContent = loadedOrders.length === 0 ? "Keine Bestellungen vorhanden." : "Keine passenden Bestellungen gefunden.";
  ordersMessage.hidden = filtered.length !== 0;
}


function htmlEscape(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}

function printOrderSlip(order){
  const customerId = order.customerId || "_template";
  const customerName = order.customerName || customerId || "Shirtprojekt";
  const logoUrl = `${location.origin}/shops/${encodeURIComponent(customerId)}/shop-logo.png`;
  const rows = (Array.isArray(order.items) ? order.items : []).map((item,index)=>{
    const qty = Number(item.quantity)||1;
    const linePrice = item.linePrice ?? (qty*(Number(order.unitPrice)||15));
    return `<tr><td>${index+1}</td><td>${htmlEscape(item.size)}</td><td>${htmlEscape(item.shirtColor)}</td><td>${htmlEscape(item.motif)}</td><td>${htmlEscape(item.motifColor)}</td><td>${qty}</td><td>${htmlEscape(euro(linePrice))}</td></tr>`;
  }).join("");
  const w = window.open("", "_blank", "width=900,height=900");
  if(!w){ alert("Bitte Pop-ups für den Bestellschein erlauben."); return; }
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bestellschein ${htmlEscape(order.orderNumber||"")}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#18181b;margin:0;background:#fff}.sheet{width:190mm;max-width:100%;margin:0 auto;padding:14mm}.head{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:2px solid #18181b;padding-bottom:14px}.brand{display:flex;align-items:center;gap:16px}.brand img{width:82px;height:82px;object-fit:contain}.brand h1{font-size:20px;margin:0 0 4px}.brand p{margin:0;color:#666}.number{text-align:right}.number strong{display:block;font-size:19px}.number span{font-size:12px;color:#666}.section{margin-top:20px}.section h2{font-size:14px;margin:0 0 9px;text-transform:uppercase;letter-spacing:.04em}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}.field{border-bottom:1px solid #ddd;padding:7px 0}.field span{display:block;font-size:10px;color:#777}.field strong{font-size:13px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:7px;text-align:left}th{background:#f3f3f4}.total{display:flex;justify-content:flex-end;gap:28px;margin-top:14px;font-size:15px;font-weight:700}.footer{margin-top:28px;padding-top:12px;border-top:1px solid #ddd;font-size:10px;color:#777}.actions{display:flex;gap:10px;margin:18px auto 0;width:190mm;max-width:calc(100% - 20px)}button{border:0;border-radius:8px;padding:11px 16px;font-weight:700;cursor:pointer}.print{background:#111;color:#fff}.close{background:#eee}@media print{.actions{display:none}.sheet{padding:8mm}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body><div class="sheet"><div class="head"><div class="brand"><img src="${logoUrl}" alt="Logo"><div><h1>${htmlEscape(customerName)}</h1><p>Bestellschein</p></div></div><div class="number"><strong>${htmlEscape(order.orderNumber||"")}</strong><span>${htmlEscape(dateText(order.createdAt))}</span></div></div>
  <div class="section"><h2>Kundendaten</h2><div class="grid"><div class="field"><span>Name</span><strong>${htmlEscape(order.name||"-")}</strong></div><div class="field"><span>Klasse / Abteilung</span><strong>${htmlEscape(order.customerClass||"-")}</strong></div><div class="field"><span>E-Mail</span><strong>${htmlEscape(order.email||"-")}</strong></div><div class="field"><span>Telefon</span><strong>${htmlEscape(order.phone||"-")}</strong></div></div></div>
  <div class="section"><h2>Bestellung</h2><table><thead><tr><th>#</th><th>Größe</th><th>Shirtfarbe</th><th>Motiv</th><th>Motivfarbe</th><th>Menge</th><th>Preis</th></tr></thead><tbody>${rows}</tbody></table><div class="total"><span>${htmlEscape(order.totalQuantity||0)} Shirts</span><span>${htmlEscape(euro(order.totalPrice))}</span></div></div>
  <div class="footer">${htmlEscape(customerName)} · Bestellnummer ${htmlEscape(order.orderNumber||"")}</div></div><div class="actions"><button class="print" onclick="window.print()">Drucken / PDF</button><button class="close" onclick="window.close()">Schließen</button></div></body></html>`);
  w.document.close();
}

function renderOrder(id,order){
  const card=document.createElement("article");card.className="order-card";
  const top=document.createElement("div");top.className="order-top";
  const title=document.createElement("div");
  const number=document.createElement("div");number.className="order-number";number.textContent=text(order.orderNumber,id);
  const customerTag=document.createElement("div");customerTag.className="order-customer";customerTag.textContent=text(order.customerName||order.customerId,"Unbekannter Kunde");
  const date=document.createElement("div");date.className="order-date";date.textContent=dateText(order.createdAt);
  title.append(number,customerTag,date);
  const status=document.createElement("select");status.className="status-select";status.setAttribute("aria-label",`Status ${id}`);
  STATUSES.forEach(value=>{const option=document.createElement("option");option.value=value;option.textContent=value;option.selected=(order.status||"Neu")===value;status.appendChild(option)});
  status.addEventListener("change",async()=>{
    const previousStatus = order.status || "Neu";
    status.disabled=true;
    try{
      await db.collection("orders").doc(id).update({status:status.value,statusUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()});
      order.status = status.value;
      if(statusFilter.value !== "Alle") applyFilters();
    }catch(err){
      status.value = previousStatus;
      alert("Status konnte nicht gespeichert werden.");
      console.error(err);
    }finally{status.disabled=false}
  });
  const actions=document.createElement("div");actions.className="order-actions";
  const printBtn=document.createElement("button");printBtn.type="button";printBtn.className="ghost-btn print-order-btn";printBtn.textContent="Bestellschein";printBtn.addEventListener("click",()=>printOrderSlip(order));
  actions.append(status,printBtn);
  top.append(title,actions);card.appendChild(top);

  const customer=document.createElement("div");customer.className="customer-grid";
  [["Name",order.name],["Klasse / Abteilung",order.customerClass],["E-Mail",order.email],["Telefon",order.phone]].forEach(([label,value])=>{const box=document.createElement("div");const l=document.createElement("span");l.textContent=label;const v=document.createElement("strong");v.textContent=text(value);box.append(l,v);customer.appendChild(box)});
  card.appendChild(customer);

  const items=document.createElement("div");items.className="items";
  (Array.isArray(order.items)?order.items:[]).forEach((item,index)=>{const row=document.createElement("div");row.className="item-row";const a=document.createElement("strong");a.textContent=`${index+1}. ${text(item.quantity,"1")}× ${text(item.size)} · ${text(item.shirtColor)} · ${euro(item.linePrice ?? ((Number(item.quantity)||1)*(Number(order.unitPrice)||15)))}`;const b=document.createElement("span");b.textContent=`${text(item.motif)} · Motivfarbe: ${text(item.motifColor)}`;row.append(a,b);items.appendChild(row)});
  card.appendChild(items);
  const footer=document.createElement("div");footer.className="order-footer";footer.innerHTML=`<span>${text(order.totalQuantity,"0")} Shirts</span><span>${euro(order.totalPrice)}</span>`;card.appendChild(footer);
  return card;
}

loginForm.addEventListener("submit",async e=>{
  e.preventDefault();loginMessage.textContent="";
  const email=document.getElementById("adminEmail").value.trim();const password=document.getElementById("adminPassword").value;
  if(email.toLowerCase()!==ADMIN_EMAIL){loginMessage.textContent="Dieses Konto ist nicht als Admin freigegeben.";return}
  try{await auth.signInWithEmailAndPassword(email,password)}catch(err){console.error(err);loginMessage.textContent="Anmeldung fehlgeschlagen. E-Mail oder Passwort prüfen."}
});
logoutBtn.addEventListener("click",()=>auth.signOut());
refreshBtn.addEventListener("click",loadOrders);
searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
if(customerFilter)customerFilter.addEventListener("change", applyFilters);

auth.onAuthStateChanged(user=>{
  const admin = user && (user.email||"").toLowerCase()===ADMIN_EMAIL;
  loginCard.hidden=!!admin;dashboard.hidden=!admin;logoutBtn.hidden=!admin;
  if(admin){ loadOrders(); initShopAdmin(); }
  else if(user) auth.signOut();
});


// ============================================================
// MASTER-v27 – zentrale Shopverwaltung
// ============================================================
const seedShops = (CENTRAL && CENTRAL.seedShops) || {};
const tabButtons = [...document.querySelectorAll(".tab-btn")];
const ordersTab = document.getElementById("ordersTab");
const shopsTab = document.getElementById("shopsTab");
const shopList = document.getElementById("shopList");
const shopForm = document.getElementById("shopForm");
const shopEditorTitle = document.getElementById("shopEditorTitle");
const shopSaveState = document.getElementById("shopSaveState");
const saveShopBtn = document.getElementById("saveShopBtn");
const newShopBtn = document.getElementById("newShopBtn");
const previewShopBtn = document.getElementById("previewShopBtn");
const motifsEditor = document.getElementById("motifsEditor");
const addMotifBtn = document.getElementById("addMotifBtn");
const logoUpload = document.getElementById("logoUpload");
const logoPreview = document.getElementById("logoPreview");
const removeLogoBtn = document.getElementById("removeLogoBtn");

let shopConfigs = new Map();
let selectedShopId = "";
let selectedShopOriginal = null;
let workingMotifs = [];
let workingLogo = "";
let shopAdminInitialized = false;

const shopFields = {
  id: document.getElementById("shopId"), type: document.getElementById("shopType"), name: document.getElementById("shopName"),
  price: document.getElementById("shopPrice"), prefix: document.getElementById("shopPrefix"), email: document.getElementById("shopEmail"), active: document.getElementById("shopActive"),
  accent: document.getElementById("accentColor"), logoHeight: document.getElementById("logoHeight"), heading: document.getElementById("designerHeading"), intro: document.getElementById("designerIntro"),
  fixedShirtName: document.getElementById("fixedShirtName"), fixedShirtHex: document.getElementById("fixedShirtHex"), fixedMotifName: document.getElementById("fixedMotifName"), fixedMotifHex: document.getElementById("fixedMotifHex"),
  showShirtColors: document.getElementById("showShirtColors"), showMotifs: document.getElementById("showMotifs"), showMotifColors: document.getElementById("showMotifColors"),
  allowUpload: document.getElementById("allowUpload"), allowText: document.getElementById("allowText"), allowBack: document.getElementById("allowBack"), allowMove: document.getElementById("allowMove"), allowResize: document.getElementById("allowResize"), allowRotate: document.getElementById("allowRotate"),
  fixedFrontEnabled: document.getElementById("fixedFrontEnabled"), fixedFrontMotif: document.getElementById("fixedFrontMotif"), fixedFrontPosition: document.getElementById("fixedFrontPosition"), fixedFrontSize: document.getElementById("fixedFrontSize"), fixedFrontTop: document.getElementById("fixedFrontTop"),
  fixedBackEnabled: document.getElementById("fixedBackEnabled"), fixedBackMotif: document.getElementById("fixedBackMotif"), fixedBackPosition: document.getElementById("fixedBackPosition"), fixedBackSize: document.getElementById("fixedBackSize"), fixedBackTop: document.getElementById("fixedBackTop")
};

function deepClone(value){ return JSON.parse(JSON.stringify(value || {})); }
function slugify(value){ return String(value||"").trim().toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""); }
function safeAssetUrl(file, slug){ if(!file)return ""; if(/^(https?:)?\/\//i.test(file)||/^(data|blob):/i.test(file)||file.startsWith("/"))return file; return `/shops/${encodeURIComponent(slug)}/${file}`; }
function setShopState(message, kind=""){ shopSaveState.textContent=message; shopSaveState.className=kind?`message-${kind}`:""; }

function switchAdminTab(name){
  tabButtons.forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  ordersTab.hidden=name!=="orders"; shopsTab.hidden=name!=="shops";
}
tabButtons.forEach(btn=>btn.addEventListener("click",()=>switchAdminTab(btn.dataset.tab)));

async function initShopAdmin(){
  if(shopAdminInitialized) return;
  shopAdminInitialized=true;
  await loadShopConfigs();
}

async function loadShopConfigs(){
  shopConfigs = new Map(Object.entries(seedShops).map(([id,cfg])=>[id,deepClone(cfg)]));
  try{
    const snap=await db.collection("shops").get();
    snap.forEach(doc=>{ const seed=shopConfigs.get(doc.id)||{}; shopConfigs.set(doc.id,{...deepClone(seed),...deepClone(doc.data()),customerId:doc.id}); });
  }catch(err){ console.error(err); setShopState("Shopdaten konnten nicht vollständig geladen werden.","error"); }
  renderShopList();
  if(!selectedShopId && shopConfigs.has("tg-solingen")) selectShop("tg-solingen");
  else if(!selectedShopId && shopConfigs.size) selectShop(shopConfigs.keys().next().value);
}

function renderShopList(){
  shopList.replaceChildren();
  [...shopConfigs.entries()].sort((a,b)=>String(a[1].customerName||a[0]).localeCompare(String(b[1].customerName||b[0]),"de")).forEach(([id,cfg])=>{
    const btn=document.createElement("button"); btn.type="button"; btn.classList.toggle("active",id===selectedShopId);
    const strong=document.createElement("strong"); strong.textContent=cfg.customerName||id;
    const span=document.createElement("span"); span.textContent=`${id} · ${cfg.shopType||"simple"}${cfg.active===false?" · deaktiviert":""}`;
    btn.append(strong,span); btn.addEventListener("click",()=>selectShop(id)); shopList.appendChild(btn);
  });
}

function featureValue(cfg,key,defaultValue=false){ return cfg.features && cfg.features[key] !== undefined ? !!cfg.features[key] : defaultValue; }
function refreshFixedPrintMotifOptions(selectedFront="", selectedBack=""){
  const opts=workingMotifs.map((m,i)=>({id:m.id||`motiv${i+1}`,name:m.name||`Motiv ${i+1}`}));
  [shopFields.fixedFrontMotif,shopFields.fixedBackMotif].forEach((select,idx)=>{
    if(!select) return; select.replaceChildren();
    opts.forEach(o=>{const op=document.createElement("option");op.value=o.id;op.textContent=o.name;select.appendChild(op)});
    const wanted=idx===0?selectedFront:selectedBack;
    if(wanted && opts.some(o=>o.id===wanted)) select.value=wanted;
  });
}
function selectShop(id){
  const cfg=deepClone(shopConfigs.get(id)||{}); selectedShopId=id; selectedShopOriginal=cfg; workingMotifs=deepClone(cfg.motifs||[]); workingLogo=cfg.logoFile||"";
  shopForm.hidden=false; saveShopBtn.disabled=false; shopEditorTitle.textContent=cfg.customerName||id||"Neuer Shop";
  shopFields.id.value=id||""; shopFields.id.disabled=!!(id && shopConfigs.has(id)); shopFields.type.value=cfg.shopType||"simple"; shopFields.name.value=cfg.customerName||""; shopFields.price.value=Number(cfg.shirtPrice??15); shopFields.prefix.value=cfg.orderPrefix||""; shopFields.email.value=cfg.orderEmail||CENTRAL.orderEmail||"shirtzentrale@gmail.com"; shopFields.active.checked=cfg.active!==false;
  shopFields.accent.value=/^#[0-9a-f]{6}$/i.test(cfg.accentColor||"")?cfg.accentColor:"#111111"; shopFields.logoHeight.value=Number(cfg.logoHeight||90); shopFields.heading.value=cfg.designerHeading||""; shopFields.intro.value=cfg.designerIntro||"";
  shopFields.fixedShirtName.value=cfg.fixedShirtColor?.name||""; shopFields.fixedShirtHex.value=/^#[0-9a-f]{6}$/i.test(cfg.fixedShirtColor?.color||"")?cfg.fixedShirtColor.color:"#0758b2"; shopFields.fixedMotifName.value=cfg.fixedMotifColor?.name||""; shopFields.fixedMotifHex.value=/^#[0-9a-f]{6}$/i.test(cfg.fixedMotifColor?.color||"")?cfg.fixedMotifColor.color:"#f6c951";
  shopFields.showShirtColors.checked=featureValue(cfg,"showShirtColorPicker",true); shopFields.showMotifs.checked=featureValue(cfg,"showMotifPicker",cfg.shopType!=="simple"); shopFields.showMotifColors.checked=featureValue(cfg,"showMotifColorPicker",true);
  shopFields.allowUpload.checked=featureValue(cfg,"allowCustomerUpload",cfg.shopType==="designer"); shopFields.allowText.checked=featureValue(cfg,"allowText",cfg.shopType==="designer"); shopFields.allowBack.checked=featureValue(cfg,"allowBackDesign",true); shopFields.allowMove.checked=featureValue(cfg,"allowMoveMotif",cfg.shopType==="designer"); shopFields.allowResize.checked=featureValue(cfg,"allowResizeMotif",cfg.shopType==="designer"); shopFields.allowRotate.checked=featureValue(cfg,"allowRotateMotif",cfg.shopType==="designer");
  const fp=cfg.fixedPrint||{}; refreshFixedPrintMotifOptions(fp.front?.motifId||"",fp.back?.motifId||"");
  shopFields.fixedFrontEnabled.checked=!!fp.front?.enabled; shopFields.fixedFrontPosition.value=fp.front?.position||"left-chest"; shopFields.fixedFrontSize.value=fp.front?.size||"small"; shopFields.fixedFrontTop.value=Number(fp.front?.topPct ?? 24);
  shopFields.fixedBackEnabled.checked=!!fp.back?.enabled; shopFields.fixedBackPosition.value=fp.back?.position||"center"; shopFields.fixedBackSize.value=fp.back?.size||"large"; shopFields.fixedBackTop.value=Number(fp.back?.topPct ?? 36);
  updateLogoPreview(); renderMotifsEditor(); previewShopBtn.hidden=!id; if(id) previewShopBtn.href=`/?shop=${encodeURIComponent(id)}`; setShopState("Bereit zum Bearbeiten."); renderShopList();
}

function typePreset(type){
  const designer=type==="designer", motifs=type==="motifs";
  shopFields.showMotifs.checked=motifs||designer; shopFields.allowUpload.checked=designer; shopFields.allowText.checked=designer; shopFields.allowMove.checked=designer; shopFields.allowResize.checked=designer; shopFields.allowRotate.checked=designer; shopFields.showShirtColors.checked=true; shopFields.showMotifColors.checked=true; shopFields.allowBack.checked=true;
}
shopFields.type.addEventListener("change",()=>typePreset(shopFields.type.value));

function updateLogoPreview(){
  const slug=shopFields.id.value||selectedShopId||"_simple"; const src=safeAssetUrl(workingLogo,slug); logoPreview.src=src||""; logoPreview.style.display=src?"block":"none";
}

async function compressImage(file,maxSide=700,targetChars=230000){
  if(!file || !file.type.startsWith("image/")) throw new Error("Bitte eine Bilddatei auswählen.");
  const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=raw});
  let scale=Math.min(1,maxSide/Math.max(img.width,img.height)); let quality=.84; let result="";
  for(let attempt=0;attempt<7;attempt++){
    const canvas=document.createElement("canvas"); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale));
    canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height); result=canvas.toDataURL("image/webp",quality);
    if(result.length<=targetChars) break; scale*=.82; quality=Math.max(.58,quality-.07);
  }
  if(result.length>300000) throw new Error("Bild ist trotz Komprimierung zu groß. Bitte ein kleineres Bild verwenden.");
  return result;
}

logoUpload.addEventListener("change",async()=>{
  const file=logoUpload.files?.[0]; if(!file)return;
  try{ setShopState("Logo wird vorbereitet …"); workingLogo=await compressImage(file,600,180000); updateLogoPreview(); setShopState("Logo geändert – noch speichern.","ok"); }
  catch(err){ alert(err.message||"Logo konnte nicht verarbeitet werden."); }
  logoUpload.value="";
});
removeLogoBtn.addEventListener("click",()=>{ const id=selectedShopId||shopFields.id.value; workingLogo=seedShops[id]?.logoFile||"shop-logo.png"; updateLogoPreview(); setShopState("Logo zurückgesetzt – noch speichern."); });

function renderMotifsEditor(){
  motifsEditor.replaceChildren();
  workingMotifs.forEach((motif,index)=>{
    const row=document.createElement("div"); row.className="motif-edit-row";
    const img=document.createElement("img"); img.alt="Motiv"; img.src=safeAssetUrl(motif.file,shopFields.id.value||selectedShopId||"_simple");
    const fields=document.createElement("div"); fields.className="motif-fields";
    const name=document.createElement("input"); name.className="motif-name"; name.value=motif.name||`Motiv ${index+1}`; name.placeholder="Motivname"; name.addEventListener("input",()=>{workingMotifs[index].name=name.value});
    const upload=document.createElement("input"); upload.type="file"; upload.accept="image/*"; upload.addEventListener("change",async()=>{const file=upload.files?.[0];if(!file)return;try{setShopState("Motiv wird vorbereitet …");workingMotifs[index].file=await compressImage(file,800,210000);img.src=workingMotifs[index].file;setShopState("Motiv geändert – noch speichern.","ok")}catch(err){alert(err.message||"Motiv konnte nicht verarbeitet werden.")}upload.value=""});
    fields.append(name,upload);
    const del=document.createElement("button"); del.type="button"; del.className="danger-btn"; del.textContent="Entfernen"; del.addEventListener("click",()=>{workingMotifs.splice(index,1);renderMotifsEditor();setShopState("Motiv entfernt – noch speichern.")});
    row.append(img,fields,del); motifsEditor.appendChild(row);
  });
  if(!workingMotifs.length){const p=document.createElement("p");p.className="section-note";p.textContent="Noch keine Motive vorhanden.";motifsEditor.appendChild(p)}
  refreshFixedPrintMotifOptions(shopFields.fixedFrontMotif?.value||"",shopFields.fixedBackMotif?.value||"");
}
addMotifBtn.addEventListener("click",()=>{ if(workingMotifs.length>=4){alert("Für die direkte Firebase-Verwaltung sind maximal 4 Motive vorgesehen.");return;} const n=workingMotifs.length+1;workingMotifs.push({id:`motiv${n}`,name:`Motiv ${n}`,file:""});renderMotifsEditor();setShopState("Neues Motiv angelegt – Bild auswählen und speichern.") });

newShopBtn.addEventListener("click",()=>{
  selectedShopId=""; selectedShopOriginal={}; workingMotifs=[{id:"motiv1",name:"Motiv 1",file:""}]; workingLogo=""; shopForm.hidden=false; saveShopBtn.disabled=false; shopEditorTitle.textContent="Neuen Shop anlegen"; shopFields.id.disabled=false;
  shopFields.id.value=""; shopFields.name.value=""; shopFields.type.value="simple"; shopFields.price.value=15; shopFields.prefix.value=""; shopFields.email.value=CENTRAL.orderEmail||"shirtzentrale@gmail.com"; shopFields.active.checked=true; shopFields.accent.value="#111111"; shopFields.logoHeight.value=90; shopFields.heading.value="Shirt gestalten"; shopFields.intro.value=""; shopFields.fixedShirtName.value=""; shopFields.fixedMotifName.value=""; refreshFixedPrintMotifOptions("motiv1","motiv1"); shopFields.fixedFrontEnabled.checked=false; shopFields.fixedFrontPosition.value="left-chest"; shopFields.fixedFrontSize.value="small"; shopFields.fixedBackEnabled.checked=false; shopFields.fixedBackPosition.value="center"; shopFields.fixedBackSize.value="large"; typePreset("simple"); updateLogoPreview(); renderMotifsEditor(); previewShopBtn.hidden=true; setShopState("Neue Shop-ID und Daten eintragen."); renderShopList();
});
shopFields.name.addEventListener("blur",()=>{ if(!selectedShopId && !shopFields.id.value) shopFields.id.value=slugify(shopFields.name.value); });

function buildShopConfig(){
  const id=slugify(shopFields.id.value); if(!id) throw new Error("Bitte eine gültige Shop-ID eingeben.");
  const name=shopFields.name.value.trim(); if(!name) throw new Error("Bitte einen Shopnamen eingeben.");
  const type=shopFields.type.value; const old=deepClone(selectedShopOriginal||{});
  const features={...(old.features||{}),layout:type==="designer"?"designer":type==="motifs"?"compact":"simple",motifMode:type==="designer"?"mixed":type==="motifs"?"multiple":"single",allowCustomerUpload:shopFields.allowUpload.checked,allowText:shopFields.allowText.checked,allowMoveMotif:shopFields.allowMove.checked,allowResizeMotif:shopFields.allowResize.checked,allowRotateMotif:shopFields.allowRotate.checked,allowBackDesign:shopFields.allowBack.checked,allowMotifColor:true,showShirtColorPicker:shopFields.showShirtColors.checked,showMotifPicker:shopFields.showMotifs.checked,showMotifColorPicker:shopFields.showMotifColors.checked,autoSelectSingleMotif:type==="simple",maxUploadMB:8};
  const cfg={...old,customerId:id,customerName:name,pageTitle:old.pageTitle||`${name} – T-Shirt Shop`,brandTitle:old.brandTitle!==undefined?old.brandTitle:name,brandSubtitle:old.brandSubtitle||"T-Shirt Konfigurator",designerHeading:shopFields.heading.value.trim()||"Shirt gestalten",designerIntro:shopFields.intro.value.trim(),accentColor:shopFields.accent.value,logoFile:workingLogo||old.logoFile||"shop-logo.png",logoHeight:Number(shopFields.logoHeight.value)||90,shirtPrice:Number(shopFields.price.value)||0,currency:"EUR",orderEmail:shopFields.email.value.trim()||CENTRAL.orderEmail||"shirtzentrale@gmail.com",orderSubject:`Neue ${name} T-Shirt Bestellung`,customerExtraFieldLabel:old.customerExtraFieldLabel||"Team / Abteilung",customerExtraFieldName:old.customerExtraFieldName||"Team / Abteilung",orderPrefix:(shopFields.prefix.value.trim()||id.slice(0,3)).toUpperCase(),shopType:type,active:shopFields.active.checked,features,motifs:workingMotifs.filter(m=>m.name||m.file).map((m,i)=>({id:m.id||`motiv${i+1}`,name:m.name||`Motiv ${i+1}`,file:m.file||""}))};
  const fsn=shopFields.fixedShirtName.value.trim(), fmn=shopFields.fixedMotifName.value.trim(); if(fsn) cfg.fixedShirtColor={id:slugify(fsn),name:fsn,color:shopFields.fixedShirtHex.value}; else delete cfg.fixedShirtColor; if(fmn) cfg.fixedMotifColor={name:fmn,color:shopFields.fixedMotifHex.value}; else delete cfg.fixedMotifColor;
  cfg.fixedPrint={
    front:{enabled:shopFields.fixedFrontEnabled.checked,motifId:shopFields.fixedFrontMotif.value||"motiv1",position:shopFields.fixedFrontPosition.value||"left-chest",size:shopFields.fixedFrontSize.value||"small",topPct:Math.max(10,Math.min(70,Number(shopFields.fixedFrontTop.value)||24))},
    back:{enabled:shopFields.fixedBackEnabled.checked,motifId:shopFields.fixedBackMotif.value||"motiv1",position:shopFields.fixedBackPosition.value||"center",size:shopFields.fixedBackSize.value||"large",topPct:Math.max(10,Math.min(70,Number(shopFields.fixedBackTop.value)||36))}
  };
  if(cfg.fixedPrint.back.enabled) cfg.features.allowBackDesign=true;
  return cfg;
}

saveShopBtn.addEventListener("click",async()=>{
  try{
    const cfg=buildShopConfig(); saveShopBtn.disabled=true; setShopState("Wird gespeichert …");
    const serialized=JSON.stringify(cfg); if(serialized.length>900000) throw new Error("Shopdaten sind zu groß. Bitte kleinere Motivbilder verwenden.");
    await db.collection("shops").doc(cfg.customerId).set(cfg,{merge:false});
    selectedShopId=cfg.customerId; selectedShopOriginal=deepClone(cfg); shopConfigs.set(cfg.customerId,deepClone(cfg)); shopFields.id.disabled=true; previewShopBtn.hidden=false; previewShopBtn.href=`/?shop=${encodeURIComponent(cfg.customerId)}`; shopEditorTitle.textContent=cfg.customerName; renderShopList(); setShopState("Gespeichert – Änderungen sind sofort live.","ok");
  }catch(err){ console.error(err); setShopState(err.message||"Speichern fehlgeschlagen.","error"); alert(err.message||"Shop konnte nicht gespeichert werden."); }
  finally{ saveShopBtn.disabled=false; }
});
