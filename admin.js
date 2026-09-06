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
const WORKFLOW_DEFS = {
  goods: {key:"goods", label:"Ware bestellt"},
  transfers: {key:"transfers", label:"Transfers bestellt"},
  print: {key:"print", label:"Druck fertig"},
  pickup_ready: {key:"pickup_ready", label:"Abholbereit"},
  picked_up: {key:"picked_up", label:"Abgeholt"},
  shipping_ready: {key:"shipping_ready", label:"Versandbereit"},
  shipped: {key:"shipped", label:"Versandt"}
};

function orderNeedsTransfer(order){
  return !!(order && order.transferRequired);
}

function orderDeliveryMethod(order){
  return order && order.deliveryMethod === "shipping" ? "shipping" : "pickup";
}

function workflowStepsForOrder(order){
  const steps=[WORKFLOW_DEFS.goods];
  if(orderNeedsTransfer(order)) steps.push(WORKFLOW_DEFS.transfers);
  steps.push(WORKFLOW_DEFS.print);
  if(orderDeliveryMethod(order)==="shipping"){
    steps.push(WORKFLOW_DEFS.shipping_ready,WORKFLOW_DEFS.shipped);
  }else{
    steps.push(WORKFLOW_DEFS.pickup_ready,WORKFLOW_DEFS.picked_up);
  }
  return steps;
}

function legacyWorkflowKey(order){
  if(!order) return "";
  if(order.workflowCurrentKey) return String(order.workflowCurrentKey);

  const label=String(order.workflowLabel||"");
  const byLabel={
    "Ware bestellt":"goods",
    "Transfers bestellt":"transfers",
    "Druck fertig":"print",
    "Abholbereit":"pickup_ready",
    "Abgeholt":"picked_up",
    "Versandbereit":"shipping_ready",
    "Versandt":"shipped"
  };
  if(byLabel[label]) return byLabel[label];

  const legacyStep=Number(order.workflowStep);
  if(Number(order.workflowVersion)===2 && Number.isInteger(legacyStep)){
    const oldV2=["goods","transfers","print","pickup_ready","picked_up"];
    return oldV2[legacyStep]||"";
  }
  return "";
}

function currentWorkflowIndex(order,steps){
  const key=legacyWorkflowKey(order);
  if(!key) return -1;
  const exact=steps.findIndex(step=>step.key===key);
  if(exact>=0) return exact;

  /* Bei Wechsel Abholung/Versand Fortschritt sinnvoll übernehmen */
  if(key==="picked_up" || key==="shipped") return steps.length-1;
  if(key==="pickup_ready" || key==="shipping_ready") return Math.max(0,steps.length-2);
  if(key==="transfers" && !orderNeedsTransfer(order)) return 0;
  return -1;
}

function statusFromWorkflowKey(key){
  if(key==="picked_up" || key==="shipped") return "Abgeholt";
  if(key==="print" || key==="pickup_ready" || key==="shipping_ready") return "Fertig";
  if(key==="goods" || key==="transfers") return "In Bearbeitung";
  return "Neu";
}


function euro(value){return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(value)||0)}
function dateText(ts){if(!ts||!ts.toDate)return "Datum wird geladen";return ts.toDate().toLocaleString("de-DE",{dateStyle:"medium",timeStyle:"short"})}
function dateOnlyText(ts){if(!ts||!ts.toDate)return "Datum wird geladen";return ts.toDate().toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"})}
function workflowTimeText(ts){if(!ts||!ts.toDate)return "";return ts.toDate().toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}
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
    o.orderNumber, entry.id, o.customerId, o.customerName, o.name, o.address, o.customerClass, o.email, o.phone, o.status,
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
    const statusMatch = selectedStatus === "Alle" ? status !== "Abgeholt" : status === selectedStatus;
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
  const productLabel = item => item.productName || (item.productId==="polo"?"Polo-Shirt":item.productId==="hoodie"?"Hoodie":"T-Shirt");

  const sourceItems = Array.isArray(order.items) ? order.items : [];
  const grouped = [];
  const groupedMap = new Map();
  sourceItems.forEach(item=>{
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice ?? order.unitPrice) || 0;
    const linePrice = Number(item.linePrice ?? (qty * unitPrice)) || 0;
    const key = [
      item.productId || "tshirt",
      text(item.size, "–"),
      text(item.shirtColor, "–"),
      text(item.motif, "–"),
      text(item.motifColor, "–")
    ].join("||");
    if(!groupedMap.has(key)){
      const row = {
        productName: productLabel(item),
        size: text(item.size, "–"),
        shirtColor: text(item.shirtColor, "–"),
        motif: text(item.motif, "–"),
        motifColor: text(item.motifColor, "–"),
        quantity: 0,
        linePrice: 0
      };
      groupedMap.set(key, row);
      grouped.push(row);
    }
    const target = groupedMap.get(key);
    target.quantity += qty;
    target.linePrice += linePrice;
  });

  const rows = grouped.length
    ? grouped.map((item,index)=>`<tr>
        <td class="col-pos">${index+1}</td>
        <td>
          <strong>${htmlEscape(item.productName)}</strong>
          <small>${htmlEscape(item.size)} · ${htmlEscape(item.shirtColor)}</small>
        </td>
        <td>
          <strong>${htmlEscape(item.motif)}</strong>
          <small>Farbe: ${htmlEscape(item.motifColor)}</small>
        </td>
        <td class="col-qty">${htmlEscape(item.quantity)}</td>
        <td class="col-price">${htmlEscape(euro(item.linePrice))}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="empty">Keine Artikel vorhanden.</td></tr>`;

  const printData = order.printData || {};
  const globalPrint = printData.global || {
    front: printData.tshirt?.front || printData.polo?.front || printData.hoodie?.front || {},
    back: printData.tshirt?.back || printData.polo?.back || printData.hoodie?.back || {}
  };
  const printBlocks = ["front","back"].map(side=>{
    const d = globalPrint[side] || {};
    const has = Object.values(d).some(v=>v!==null && v!==undefined && String(v).trim()!=="");
    if(!has) return "";
    const size = [d.widthCm,d.heightCm].every(v=>v!==null && v!==undefined && String(v).trim()!=="") ? `${d.widthCm} × ${d.heightCm} cm` : "–";
    return `<div class="print-card"><span>${side==="front"?"Vorne":"Hinten"}</span><strong>${htmlEscape(d.method || "–")}</strong><small>${htmlEscape(size)}</small></div>`;
  }).filter(Boolean).join("");
  const printSection = printBlocks ? `<div class="section"><div class="section-head"><h2>Druckdaten</h2></div><div class="print-grid">${printBlocks}</div></div>` : "";

  const totalQuantity = Number(order.totalQuantity) || grouped.reduce((sum,item)=>sum + (Number(item.quantity)||0), 0);
  const totalPrice = Number(order.totalPrice) || grouped.reduce((sum,item)=>sum + (Number(item.linePrice)||0), 0);
  const orderDate = htmlEscape(dateOnlyText(order.createdAt));
  const address = String(order.address || "").trim() || "–";
  const email = String(order.email || "").trim() || "–";
  const phone = String(order.phone || "").trim() || "–";
  const customerDisplay = String(order.name || "").trim() || "–";

  const w = window.open("", "_blank", "width=960,height=920");
  if(!w){ alert("Bitte Pop-ups für den Bestellschein erlauben."); return; }
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bestellschein ${htmlEscape(order.orderNumber||"")}</title><style>
    *{box-sizing:border-box} :root{--text:#17181c;--muted:#69707d;--line:#e6e8ee;--soft:#f7f8fb;--soft2:#fbfbfd;--accent:#e8c54a;--accent-soft:#fff8dc} html,body{margin:0;padding:0;background:#eef1f5;color:var(--text);font-family:Inter,Arial,Helvetica,sans-serif} body{padding:18px 10px 24px} .sheet{width:210mm;max-width:100%;margin:0 auto;background:#fff;border:1px solid #dde2ea;border-radius:22px;padding:14mm;box-shadow:0 14px 36px rgba(15,23,42,.08)} .topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line)} .brand{display:flex;align-items:center;gap:16px;min-width:0} .brand img{width:72px;height:72px;object-fit:contain;border-radius:18px;background:var(--soft2);border:1px solid var(--line);padding:8px;flex:0 0 auto} .brand-copy{min-width:0} .eyebrow{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9a7a00;margin-bottom:7px} .brand-copy h1{margin:0;font-size:24px;line-height:1.15} .brand-copy p{margin:7px 0 0;font-size:13px;color:var(--muted)} .meta{display:grid;grid-template-columns:repeat(2,minmax(125px,1fr));gap:10px;min-width:270px} .meta-card{background:var(--soft);border:1px solid var(--line);border-radius:16px;padding:11px 12px} .meta-card span{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px} .meta-card strong{display:block;font-size:16px;line-height:1.2;word-break:break-word} .hero{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;margin-top:16px} .hero-card,.summary-card,.info-card{background:var(--soft2);border:1px solid var(--line);border-radius:18px;padding:14px 16px} .section{margin-top:16px} .section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:10px} .section-head h2{margin:0;font-size:14px;font-weight:800;letter-spacing:.08em;text-transform:uppercase} .section-head p{margin:0;font-size:12px;color:var(--muted)} .info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px} .info-card.wide{grid-column:1/-1} .info-card span{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px} .info-card strong{display:block;font-size:16px;line-height:1.35;word-break:break-word} .order-table-wrap{border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#fff} table{width:100%;border-collapse:collapse} thead th{background:var(--soft);font-size:11px;font-weight:800;letter-spacing:.04em;color:#4f5662;padding:11px 12px;text-align:left;border-bottom:1px solid var(--line)} tbody td{padding:13px 12px;border-bottom:1px solid #edf0f4;vertical-align:top;font-size:13px} tbody tr:last-child td{border-bottom:none} td strong{display:block;font-size:15px;line-height:1.25;margin:0 0 3px} td small{display:block;font-size:12px;line-height:1.35;color:var(--muted)} .col-pos{width:44px;font-weight:700} .col-qty{width:90px;text-align:center;font-weight:700} .col-price{width:120px;text-align:right;font-weight:800;white-space:nowrap} .empty{text-align:center;color:var(--muted);padding:18px 12px} .totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px} .summary-card span{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px} .summary-card strong{display:block;font-size:20px;line-height:1.2} .summary-card.total{background:var(--accent-soft);border-color:#f2df97} .summary-card.total strong{font-size:24px} .print-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px} .print-card{background:var(--soft2);border:1px solid var(--line);border-radius:16px;padding:12px 14px} .print-card span{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:5px} .print-card strong{display:block;font-size:15px;margin-bottom:4px} .print-card small{display:block;font-size:12px;color:var(--muted)} .footer{margin-top:20px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--muted)} .actions{display:flex;gap:10px;justify-content:center;margin:16px auto 0;width:210mm;max-width:calc(100% - 20px)} button{border:0;border-radius:12px;padding:12px 16px;font-weight:700;font-size:14px;cursor:pointer} .print{background:#141821;color:#fff} .close{background:#e9edf2;color:#111} @media(max-width:760px){ body{padding:8px 6px 18px} .sheet{padding:16px;border-radius:18px} .topbar{flex-direction:column;align-items:stretch} .meta{grid-template-columns:1fr 1fr;min-width:0} .hero{grid-template-columns:1fr} .info-grid{grid-template-columns:1fr} .info-card.wide{grid-column:auto} .print-grid,.totals{grid-template-columns:1fr} .brand h1,.brand-copy h1{font-size:21px} .brand img{width:60px;height:60px} thead th{font-size:10px;padding:9px 8px} tbody td{padding:10px 8px;font-size:12px} td strong{font-size:13px} td small{font-size:11px} .col-qty{width:64px} .col-price{width:92px} .actions{width:auto;max-width:none;padding:0 2px}} @media print{ body{background:#fff;padding:0} .sheet{width:auto;max-width:none;border:none;border-radius:0;box-shadow:none;padding:8mm} .actions{display:none!important} @page{margin:10mm} }
  </style></head><body><div class="sheet"><div class="topbar"><div class="brand"><img src="${logoUrl}" alt="Logo"><div class="brand-copy"><span class="eyebrow">Bestellschein</span><h1>${htmlEscape(customerName)}</h1><p>Schlichter Überblick für Auftrag, Kunde und Bestellung</p></div></div><div class="meta"><div class="meta-card"><span>Bestellnummer</span><strong>${htmlEscape(order.orderNumber||"–")}</strong></div><div class="meta-card"><span>Datum</span><strong>${orderDate}</strong></div></div></div>
  <div class="section"><div class="section-head"><h2>Kundendaten</h2><p>Name, Kontakt und Lieferadresse</p></div><div class="info-grid"><div class="info-card"><span>Name</span><strong>${htmlEscape(customerDisplay)}</strong></div><div class="info-card"><span>Telefon</span><strong>${htmlEscape(phone)}</strong></div><div class="info-card"><span>E-Mail</span><strong>${htmlEscape(email)}</strong></div><div class="info-card wide"><span>Adresse</span><strong>${htmlEscape(address)}</strong></div></div></div>
  <div class="section"><div class="section-head"><h2>Bestellung</h2><p>Zusammengefasst und sauber gruppiert</p></div><div class="order-table-wrap"><table><thead><tr><th class="col-pos">#</th><th>Artikel</th><th>Motiv</th><th class="col-qty">Menge</th><th class="col-price">Gesamt</th></tr></thead><tbody>${rows}</tbody></table></div><div class="totals"><div class="summary-card"><span>Positionen</span><strong>${grouped.length}</strong></div><div class="summary-card"><span>Gesamtmenge</span><strong>${htmlEscape(totalQuantity)} Shirts</strong></div><div class="summary-card total"><span>Gesamtpreis</span><strong>${htmlEscape(euro(totalPrice))}</strong></div></div></div>
  ${printSection}
  <div class="footer"><span>${htmlEscape(customerName)}</span><span>Bestellnummer ${htmlEscape(order.orderNumber||"–")}</span></div></div><div class="actions"><button class="print" onclick="window.print()">Drucken / PDF</button><button class="close" onclick="window.close()">Schließen</button></div></body></html>`);
  w.document.close();
}


function printProductionSlip(order){
  const customerId = order.customerId || "_template";
  const customerName = order.customerName || customerId || "Shirtprojekt";
  const logoUrl = `${location.origin}/shops/${encodeURIComponent(customerId)}/shop-logo.png`;
  const items = Array.isArray(order.items) ? order.items : [];
  const itemRows = items.map((item,index)=>{
    const qty=Number(item.quantity)||1;
    return `<tr><td>${index+1}</td><td>${htmlEscape(item.productName || (item.productId==="polo"?"Polo-Shirt":item.productId==="hoodie"?"Hoodie":"T-Shirt"))}</td><td>${htmlEscape(item.size||"-")}</td><td>${qty}</td><td>${htmlEscape(item.shirtColor||"-")}</td><td>${htmlEscape(item.motif||"-")}</td><td>${htmlEscape(item.motifColor||"-")}</td><td class="check">□</td></tr>`;
  }).join("");

  const usedProducts = new Set(items.map(item=>item.productId||"tshirt"));
  const printData = order.printData || {};
  const specRows=[];
  const addSpec=(product,label,side,sideLabel)=>{
    if(!usedProducts.has(product)) return;
    const d=printData?.[product]?.[side]||{};
    const has=Object.values(d).some(v=>v!==null&&v!==undefined&&String(v).trim()!=="");
    if(!has) return;
    const format=[d.widthCm,d.heightCm].every(v=>v!==null&&v!==undefined&&v!=="")?`${d.widthCm} × ${d.heightCm} cm`:"–";
    specRows.push(`<tr><td>${htmlEscape(label)}</td><td>${htmlEscape(sideLabel)}</td><td>${htmlEscape(d.method||"-")}</td><td>${htmlEscape(format)}</td><td class="check">□</td></tr>`);
  };
  addSpec("tshirt","T-Shirt","front","Vorne");
  addSpec("tshirt","T-Shirt","back","Hinten");
  addSpec("polo","Polo-Shirt","front","Vorne");
  addSpec("polo","Polo-Shirt","back","Hinten");
  addSpec("hoodie","Hoodie","front","Vorne");
  addSpec("hoodie","Hoodie","back","Hinten");

  const specs = specRows.length
    ? `<section><h2>Produktionsdaten</h2><table><thead><tr><th>Textil</th><th>Seite</th><th>Druckverfahren</th><th>Druckmaß</th><th>OK</th></tr></thead><tbody>${specRows.join("")}</tbody></table></section>`
    : `<section><div class="warning">Für diese Bestellung sind noch keine Produktionsdaten hinterlegt.</div></section>`;

  const w=window.open("","_blank","width=1000,height=900");
  if(!w){alert("Bitte Pop-ups für den Produktionsschein erlauben.");return;}
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Produktionsschein ${htmlEscape(order.orderNumber||"")}</title><style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#151515;margin:0;background:#fff}.sheet{width:195mm;max-width:100%;margin:0 auto;padding:11mm}.head{display:flex;justify-content:space-between;align-items:center;gap:18px;border-bottom:3px solid #111;padding-bottom:10px}.brand{display:flex;align-items:center;gap:13px}.brand img{width:68px;height:68px;object-fit:contain}.brand h1{margin:0;font-size:19px}.brand p{margin:3px 0 0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:.08em}.meta{text-align:right}.meta strong{display:block;font-size:20px}.meta span{font-size:11px;color:#666}section{margin-top:16px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;margin:0 0 7px}.info{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.box{border:1px solid #ddd;border-radius:7px;padding:7px}.box span{display:block;color:#777;font-size:9px;text-transform:uppercase}.box strong{display:block;margin-top:2px;font-size:12px}table{width:100%;border-collapse:collapse;font-size:9.5px}th,td{border:1px solid #ccc;padding:6px;vertical-align:top}th{background:#f3f3f3;text-align:left}.check{text-align:center;font-size:16px;width:28px}.warning{padding:10px;border:1px solid #e0a400;background:#fff8d8;border-radius:7px;font-size:11px}.checklist{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.task{border:1px solid #bbb;border-radius:7px;padding:10px;font-size:11px}.task b{font-size:17px;margin-right:5px}.notes{height:62px;border:1px solid #bbb;border-radius:7px}.footer{margin-top:18px;display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:8px;font-size:9px;color:#777}.actions{display:flex;gap:8px;width:195mm;max-width:calc(100% - 20px);margin:14px auto}button{border:0;border-radius:7px;padding:10px 14px;font-weight:700;cursor:pointer}.print{background:#111;color:#fff}.close{background:#eee}a{color:#111}@media print{.actions{display:none}.sheet{padding:6mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="sheet"><div class="head"><div class="brand"><img src="${logoUrl}" alt="Logo"><div><h1>${htmlEscape(customerName)}</h1><p>Produktionsschein</p></div></div><div class="meta"><strong>${htmlEscape(order.orderNumber||"")}</strong><span>${htmlEscape(dateText(order.createdAt))}</span></div></div>
  <section><h2>Auftrag</h2><div class="info"><div class="box"><span>Kunde</span><strong>${htmlEscape(order.name||"-")}</strong></div><div class="box"><span>Adresse</span><strong>${htmlEscape(order.address||"-")}</strong></div><div class="box"><span>Gesamtmenge</span><strong>${htmlEscape(order.totalQuantity||0)} Teile</strong></div></div></section>
  <section><h2>Artikel</h2><table><thead><tr><th>#</th><th>Textil</th><th>Größe</th><th>Menge</th><th>Farbe</th><th>Motiv</th><th>Druckfarbe</th><th>OK</th></tr></thead><tbody>${itemRows}</tbody></table></section>
  ${specs}
  <section><h2>Produktions-Checkliste</h2><div class="checklist"><div class="task"><b>□</b>Textilien gezählt</div><div class="task"><b>□</b>Druckmaß geprüft</div><div class="task"><b>□</b>Position geprüft</div><div class="task"><b>□</b>Produktion fertig</div></div></section>
  <section><h2>Notizen / Besonderheiten</h2><div class="notes"></div></section>
  <div class="footer"><span>${htmlEscape(customerName)}</span><span>Produktionsschein · ${htmlEscape(order.orderNumber||"")}</span></div></div><div class="actions"><button class="print" onclick="window.print()">Drucken / PDF</button><button class="close" onclick="window.close()">Schließen</button></div></body></html>`);
  w.document.close();
}

function renderOrder(id,order){
  const card=document.createElement("details");
  card.className="order-card order-card-v2956";

  /* Kompakte Listenzeile – immer sichtbar */
  const summary=document.createElement("summary");
  summary.className="order-row-summary-v2956";

  const left=document.createElement("div");
  left.className="order-row-left-v2956";

  const shopName=document.createElement("strong");
  shopName.className="order-row-shop-primary-v2958";
  shopName.textContent=text(order.customerName||order.customerId,"Unbekannter Shop");

  const customerName=document.createElement("span");
  customerName.className="order-row-customer-secondary-v2958";
  customerName.textContent=text(order.name,"Unbekannter Besteller");

  const meta=document.createElement("div");
  meta.className="order-row-meta-v2956";

  const date=document.createElement("span");
  date.className="order-row-date-v2958";
  date.textContent=dateOnlyText(order.createdAt);

  const compactOrderNo=document.createElement("span");
  compactOrderNo.className="order-row-number-v2963";
  compactOrderNo.textContent=text(order.orderNumber,id);

  meta.append(date,compactOrderNo);

  if(orderNeedsTransfer(order)){
    const badge=document.createElement("span");
    badge.className="order-mini-badge-v2961";
    badge.textContent="Transfer";
    meta.appendChild(badge);
  }
  if(orderDeliveryMethod(order)==="shipping"){
    const badge=document.createElement("span");
    badge.className="order-mini-badge-v2961";
    badge.textContent="Versand";
    meta.appendChild(badge);
  }

  left.append(shopName,customerName,meta);

  const right=document.createElement("div");
  right.className="order-row-right-v2956";

  const price=document.createElement("strong");
  price.className="order-row-price-v2956";
  price.textContent=euro(order.totalPrice);

  const chevron=document.createElement("span");
  chevron.className="order-row-chevron-v2956";
  chevron.textContent="⌄";

  right.append(price,chevron);
  summary.append(left,right);
  card.appendChild(summary);

  const body=document.createElement("div");
  body.className="order-card-body-v2956";

  /* Kleine Zusatzzeile im geöffneten Zustand */
  const info=document.createElement("div");
  info.className="order-open-info-v2956";

  const orderNo=document.createElement("span");
  orderNo.textContent=text(order.orderNumber,id);

  const shop=document.createElement("span");
  shop.textContent=text(order.customerName||order.customerId,"");

  const qty=document.createElement("strong");
  qty.textContent=`${text(order.totalQuantity,"0")} Shirts`;

  info.append(orderNo);
  if(shop.textContent) info.append(shop);
  info.append(qty);
  body.appendChild(info);

  /* Auftragstyp: Transfer ja/nein + Abholung/Versand */
  const options=document.createElement("div");
  options.className="order-flow-options-v2961";

  function makeChoiceGroup(title,choices,current,onChange){
    const wrap=document.createElement("div");
    wrap.className="flow-choice-group-v2961";
    const lab=document.createElement("span");
    lab.className="flow-choice-title-v2961";
    lab.textContent=title;
    const buttons=document.createElement("div");
    buttons.className="flow-choice-buttons-v2961";
    choices.forEach(choice=>{
      const b=document.createElement("button");
      b.type="button";
      b.className="flow-choice-btn-v2961";
      b.textContent=choice.label;
      b.dataset.value=choice.value;
      b.classList.toggle("active",String(current)===String(choice.value));
      b.addEventListener("click",async(event)=>{
        event.preventDefault();
        event.stopPropagation();
        if(b.classList.contains("active"))return;
        await onChange(choice.value);
      });
      buttons.appendChild(b);
    });
    wrap.append(lab,buttons);
    return wrap;
  }

  async function saveFlowOption(field,value){
    try{
      await db.collection("orders").doc(id).update({
        [field]:value,
        workflowVersion:3,
        workflowUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
      });
      order[field]=value;
      order.workflowVersion=3;
      applyFilters();
    }catch(err){
      alert("Auftragseinstellung konnte nicht gespeichert werden.");
      console.error(err);
    }
  }

  options.append(
    makeChoiceGroup(
      "Transfer",
      [{label:"Kein Transfer",value:false},{label:"Transfer nötig",value:true}],
      orderNeedsTransfer(order),
      value=>saveFlowOption("transferRequired",value)
    ),
    makeChoiceGroup(
      "Übergabe",
      [{label:"Abholung",value:"pickup"},{label:"Versand",value:"shipping"}],
      orderDeliveryMethod(order),
      value=>saveFlowOption("deliveryMethod",value)
    )
  );
  body.appendChild(options);

  const workflow=document.createElement("div");
  workflow.className="order-workflow";

  const workflowTitle=document.createElement("div");
  workflowTitle.className="order-workflow-title";

  const workflowHeading=document.createElement("strong");
  workflowHeading.textContent="Auftragsverlauf";

  const workflowCurrent=document.createElement("span");
  workflowCurrent.className="workflow-current-label";

  workflowTitle.append(workflowHeading,workflowCurrent);

  const workflowSteps=document.createElement("div");
  workflowSteps.className="order-workflow-steps";

  const flowSteps=workflowStepsForOrder(order);
  workflowSteps.style.setProperty("--workflow-count",String(flowSteps.length));
  let currentStep=currentWorkflowIndex(order,flowSteps);

  function workflowTimestampFor(step,index){
    const timestamps=(order&&order.workflowTimestamps)||{};
    return timestamps[step.key] || timestamps[String(index)] || null;
  }

  function paintWorkflow(){
    const currentDef=currentStep>=0 ? flowSteps[currentStep] : null;
    const currentTs=currentDef ? workflowTimestampFor(currentDef,currentStep) : null;
    const currentTime=workflowTimeText(currentTs);
    workflowCurrent.textContent=currentDef
      ? (currentDef.label+(currentTime?` · ${currentTime}`:""))
      : "Offen";
    [...workflowSteps.children].forEach((btn,index)=>{
      const done=index<=currentStep;
      const current=index===currentStep;
      btn.classList.toggle("done",done);
      btn.classList.toggle("current",current);
      const mark=btn.querySelector(".workflow-mark");
      if(mark) mark.textContent=done?"✓":String(index+1);
    });
  }

  flowSteps.forEach((step,index)=>{
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="workflow-step";
    btn.innerHTML=`<span class="workflow-mark">${index+1}</span><span class="workflow-label">${step.label}</span>`;
    btn.addEventListener("click",async(event)=>{
      event.preventDefault();
      event.stopPropagation();
      if(btn.disabled)return;

      const previousStep=currentStep;
      const previousKey=order.workflowCurrentKey||"";
      const previousStatus=order.status||"Neu";

      currentStep=index;
      paintWorkflow();
      [...workflowSteps.children].forEach(b=>b.disabled=true);

      const mappedStatus=statusFromWorkflowKey(step.key);
      try{
        const stepTimestamp=firebase.firestore.FieldValue.serverTimestamp();
        await db.collection("orders").doc(id).update({
          workflowVersion:3,
          workflowCurrentKey:step.key,
          workflowLabel:step.label,
          workflowUpdatedAt:stepTimestamp,
          [`workflowTimestamps.${step.key}`]:stepTimestamp,
          status:mappedStatus,
          statusUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
        });

        order.workflowVersion=3;
        order.workflowCurrentKey=step.key;
        order.workflowLabel=step.label;
        order.status=mappedStatus;
        order.workflowTimestamps=order.workflowTimestamps||{};
        order.workflowTimestamps[step.key]=firebase.firestore.Timestamp.now();

        applyFilters();
      }catch(err){
        currentStep=previousStep;
        order.workflowCurrentKey=previousKey;
        order.status=previousStatus;
        paintWorkflow();
        alert("Auftragsverlauf konnte nicht gespeichert werden.");
        console.error(err);
      }finally{
        [...workflowSteps.children].forEach(b=>b.disabled=false);
      }
    });
    workflowSteps.appendChild(btn);
  });

  workflow.append(workflowTitle,workflowSteps);
  body.appendChild(workflow);
  paintWorkflow();

  const actions=document.createElement("div");
  actions.className="order-actions order-actions-v2954";

  const printBtn=document.createElement("button");
  printBtn.type="button";
  printBtn.className="ghost-btn print-order-btn";
  printBtn.textContent="Bestellschein";
  printBtn.addEventListener("click",()=>printOrderSlip(order));

  const productionBtn=document.createElement("button");
  productionBtn.type="button";
  productionBtn.className="ghost-btn production-order-btn";
  productionBtn.textContent="Produktionsschein";
  productionBtn.addEventListener("click",()=>printProductionSlip(order));

  actions.append(printBtn,productionBtn);
  body.appendChild(actions);

  const customerDetails=document.createElement("details");
  customerDetails.className="customer-details";

  const customerSummary=document.createElement("summary");
  customerSummary.textContent="Kundendaten";
  customerDetails.appendChild(customerSummary);

  const customer=document.createElement("div");
  customer.className="customer-grid";

  [["Name",order.name],["Adresse",order.address],["E-Mail",order.email],["Telefon",order.phone]].forEach(([label,value])=>{
    const box=document.createElement("div");
    const l=document.createElement("span");l.textContent=label;
    const v=document.createElement("strong");v.textContent=text(value);
    box.append(l,v);
    customer.appendChild(box);
  });

  customerDetails.appendChild(customer);
  body.appendChild(customerDetails);

  const itemDetails=document.createElement("details");
  itemDetails.className="item-details-v2960";

  const itemSummary=document.createElement("summary");
  itemSummary.textContent=`Artikel · ${text(order.totalQuantity,"0")} Shirts`;
  itemDetails.appendChild(itemSummary);

  const items=document.createElement("div");
  items.className="items";

  (Array.isArray(order.items)?order.items:[]).forEach((item,index)=>{
    const row=document.createElement("div");
    row.className="item-row";

    const a=document.createElement("strong");
    a.textContent=`${index+1}. ${text(item.quantity,"1")}× ${text(item.size)} · ${text(item.shirtColor)} · ${euro(item.linePrice ?? ((Number(item.quantity)||1)*(Number(order.unitPrice)||15)))}`;

    const b=document.createElement("span");
    b.textContent=`${text(item.motif)} · Motivfarbe: ${text(item.motifColor)}`;

    row.append(a,b);
    items.appendChild(row);
  });

  itemDetails.appendChild(items);
  body.appendChild(itemDetails);
  card.appendChild(body);

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
const positionProduct = document.getElementById("positionProduct");
const positionSide = document.getElementById("positionSide");
const positionSize = document.getElementById("positionSize");
const positionSizeValue = document.getElementById("positionSizeValue");
const positionStage = document.getElementById("positionStage");
const positionPrintZone = document.getElementById("positionPrintZone");
const positionShirt = document.getElementById("positionShirt");
const positionMotif = document.getElementById("positionMotif");
const positionXValue = document.getElementById("positionXValue");
const positionYValue = document.getElementById("positionYValue");
const positionWValue = document.getElementById("positionWValue");
const savePositionBtn = document.getElementById("savePositionBtn");
const designerFeatureTools = document.getElementById("designerFeatureTools");

let shopConfigs = new Map();
let selectedShopId = "";
let selectedShopOriginal = null;
let workingMotifs = [];
let workingLogo = "";
let shopAdminInitialized = false;

const shopFields = {
  id: document.getElementById("shopId"), type: document.getElementById("shopType"), name: document.getElementById("shopName"),
  price: document.getElementById("shopPrice"), prefix: document.getElementById("shopPrefix"), email: document.getElementById("shopEmail"), active: document.getElementById("shopActive"),
  accent: document.getElementById("accentColor"), logoHeight: document.getElementById("logoHeight"), previewMode: document.getElementById("previewMode"), heading: document.getElementById("designerHeading"), intro: document.getElementById("designerIntro"),
  fixedShirtName: document.getElementById("fixedShirtName"), fixedShirtHex: document.getElementById("fixedShirtHex"), fixedMotifName: document.getElementById("fixedMotifName"), fixedMotifHex: document.getElementById("fixedMotifHex"),
  showShirtColors: document.getElementById("showShirtColors"), showMotifs: document.getElementById("showMotifs"), showMotifColors: document.getElementById("showMotifColors"),
  allowUpload: document.getElementById("allowUpload"), allowText: document.getElementById("allowText"), allowBack: document.getElementById("allowBack"), allowMove: document.getElementById("allowMove"), allowResize: document.getElementById("allowResize"), allowRotate: document.getElementById("allowRotate"),
  fixedFrontEnabled: document.getElementById("fixedFrontEnabled"), fixedFrontMotif: document.getElementById("fixedFrontMotif"), fixedFrontPosition: document.getElementById("fixedFrontPosition"), fixedFrontSize: document.getElementById("fixedFrontSize"), fixedFrontTop: document.getElementById("fixedFrontTop"), fixedFrontSide: document.getElementById("fixedFrontSide"),
  fixedBackEnabled: document.getElementById("fixedBackEnabled"), fixedBackMotif: document.getElementById("fixedBackMotif"), fixedBackPosition: document.getElementById("fixedBackPosition"), fixedBackSize: document.getElementById("fixedBackSize"), fixedBackTop: document.getElementById("fixedBackTop"),
  tshirtFrontX: document.getElementById("tshirtFrontX"), tshirtFrontY: document.getElementById("tshirtFrontY"), tshirtFrontW: document.getElementById("tshirtFrontW"),
  tshirtBackX: document.getElementById("tshirtBackX"), tshirtBackY: document.getElementById("tshirtBackY"), tshirtBackW: document.getElementById("tshirtBackW"),
  poloFrontX: document.getElementById("poloFrontX"), poloFrontY: document.getElementById("poloFrontY"), poloFrontW: document.getElementById("poloFrontW"),
  poloBackX: document.getElementById("poloBackX"), poloBackY: document.getElementById("poloBackY"), poloBackW: document.getElementById("poloBackW"),
  hoodieFrontX: document.getElementById("hoodieFrontX"), hoodieFrontY: document.getElementById("hoodieFrontY"), hoodieFrontW: document.getElementById("hoodieFrontW"),
  hoodieBackX: document.getElementById("hoodieBackX"), hoodieBackY: document.getElementById("hoodieBackY"), hoodieBackW: document.getElementById("hoodieBackW")
};

const printDataFields = {
  front: {method:document.getElementById("pdGlobalFrontMethod"),width:document.getElementById("pdGlobalFrontWidth"),height:document.getElementById("pdGlobalFrontHeight")},
  back: {method:document.getElementById("pdGlobalBackMethod"),width:document.getElementById("pdGlobalBackWidth"),height:document.getElementById("pdGlobalBackHeight")}
};
const productionFileUrl = document.getElementById("productionFileUrl");

function normalizePrintMethod(value){
  const method=String(value||"").trim();
  return method === "Flex" ? "Flexdruck" : (method || "Flexdruck");
}
function resolveGlobalPrintData(cfg){
  const data=cfg.printData||{};
  const g=data.global||{};
  return {
    front:g.front||data.tshirt?.front||data.polo?.front||data.hoodie?.front||{method:"Flexdruck",widthCm:9,heightCm:7},
    back:g.back||data.tshirt?.back||data.polo?.back||data.hoodie?.back||{method:"Flexdruck",widthCm:28,heightCm:21.8}
  };
}
function fillPrintData(cfg){
  const data=resolveGlobalPrintData(cfg);
  for(const side of ["front","back"]){
    const src=data[side]||{}; const f=printDataFields[side];
    f.method.value=normalizePrintMethod(src.method);
    f.width.value=src.widthCm ?? (side==="front"?9:28);
    f.height.value=src.heightCm ?? (side==="front"?7:21.8);
  }
}
function collectPrintData(){
  const read=(side)=>{
    const f=printDataFields[side];
    const num=(el)=>el.value===""?null:Number(el.value);
    return {method:normalizePrintMethod(f.method.value),widthCm:num(f.width),heightCm:num(f.height)};
  };
  const front=read("front"), back=read("back");
  return {
    global:{front:{...front},back:{...back}},
    tshirt:{front:{...front},back:{...back}},
    polo:{front:{...front},back:{...back}},
    hoodie:{front:{...front},back:{...back}}
  };
}

function getPositionFieldSet(product, side){
  const key = `${product}${side === "front" ? "Front" : "Back"}`;
  return {
    x: shopFields[`${key}X`],
    y: shopFields[`${key}Y`],
    w: shopFields[`${key}W`]
  };
}
function selectedPositionMotif(){
  const side = positionSide?.value || "front";
  const select = side === "front" ? shopFields.fixedFrontMotif : shopFields.fixedBackMotif;
  const id = select?.value || workingMotifs[0]?.id;
  return workingMotifs.find(m => m.id === id) || workingMotifs[0] || null;
}
// Die Live-Seite nutzt seit v28.2.3 eine 430px hohe Druckfläche mit 90px Headroom oben.
// Gespeicherte Y-Werte bleiben aber bewusst auf die ursprünglichen 340px bezogen.
// Diese beiden Funktionen sorgen dafür, dass Admin-Vorschau und Live-Shop 1:1 übereinstimmen.
const POSITION_BASE_HEIGHT = 340;
const POSITION_HEADROOM = 90;
const POSITION_STAGE_HEIGHT = POSITION_BASE_HEIGHT + POSITION_HEADROOM;
function storedYToStagePct(yPct){
  const y = Math.max(0, Math.min(100, Number(yPct) || 0));
  return ((POSITION_HEADROOM + POSITION_BASE_HEIGHT * (y / 100)) / POSITION_STAGE_HEIGHT) * 100;
}
function stagePctToStoredY(stagePct){
  const stageY = Math.max(0, Math.min(100, Number(stagePct) || 0));
  return ((stageY * POSITION_STAGE_HEIGHT / 100) - POSITION_HEADROOM) / POSITION_BASE_HEIGHT * 100;
}

const positionShirtPreviewCache = new Map();
function loadPositionImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});}
async function coloredPositionShirt(src,color){const key=`${src}|${color}`;if(positionShirtPreviewCache.has(key))return positionShirtPreviewCache.get(key);try{const img=await loadPositionImage(src);const c=document.createElement("canvas");c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;const ctx=c.getContext("2d");ctx.drawImage(img,0,0,c.width,c.height);if(color&&String(color).toLowerCase()!=="#ffffff"){ctx.globalCompositeOperation="multiply";ctx.fillStyle=color;ctx.fillRect(0,0,c.width,c.height);ctx.globalCompositeOperation="destination-in";ctx.drawImage(img,0,0,c.width,c.height);ctx.globalCompositeOperation="source-over";}const out=c.toDataURL("image/png");positionShirtPreviewCache.set(key,out);return out;}catch(e){return src;}}


function friendlySizeLabel(value){
  const n = Number(value) || 0;
  if(n < 32) return "Klein";
  if(n < 48) return "Mittel";
  return "Groß";
}

function refreshPositionEditor(){
  if(!positionStage || !positionMotif || !positionShirt) return;
  const product = positionProduct.value || "tshirt";
  const side = positionSide.value || "front";
  const fields = getPositionFieldSet(product, side);
  const x = Number(fields.x?.value || (side === "front" ? 68 : 50));
  const y = Number(fields.y?.value || (side === "front" ? 20 : 36));
  const w = Number(fields.w?.value || (side === "front" ? 28 : 50));
  const shirtSrc = product === "polo"
    ? (side === "front" ? "polo-front-template.png" : "polo-back-template.png")
    : product === "hoodie"
      ? (side === "front" ? "hoodie-front-template.png" : "hoodie-back-template.png")
      : (side === "front" ? "shirt-front-template.png" : "shirt-back-template.png");
  coloredPositionShirt(shirtSrc, shopFields.fixedShirtHex?.value || "#ffffff").then(src => { positionShirt.src = src; });
  const motif = selectedPositionMotif();
  if(motif?.file){
    positionMotif.src = safeAssetUrl(motif.file, shopFields.id.value || selectedShopId || "_simple");
    positionMotif.hidden = false;
  } else {
    positionMotif.hidden = true;
    positionMotif.removeAttribute("src");
  }
  positionMotif.style.left = `${x}%`;
  positionMotif.style.top = `${y}%`;
  positionMotif.style.width = `${w}%`;
  if(positionSize) positionSize.value = String(w);
  if(positionSizeValue) positionSizeValue.textContent = friendlySizeLabel(w);
  if(positionXValue) positionXValue.textContent = "";
  if(positionYValue) positionYValue.textContent = "";
  if(positionWValue) positionWValue.textContent = friendlySizeLabel(w);
  window.updateV284PrintTable?.();
  window.updateV2856PrintTable?.();
}
function writePositionValues(x, y, w){
  const fields = getPositionFieldSet(positionProduct.value || "tshirt", positionSide.value || "front");
  if(Number.isFinite(x)) fields.x.value = String(Math.round(x * 2) / 2);
  if(Number.isFinite(y)) fields.y.value = String(Math.round(y * 2) / 2);
  if(Number.isFinite(w)) fields.w.value = String(Math.round(w * 2) / 2);
  refreshPositionEditor();
  setShopState("Position geändert – oben Speichern klicken.");
}
function bindPositionEditor(){
  if(!positionStage || !positionMotif || !positionPrintZone) return;
  [positionProduct, positionSide].forEach(el => el?.addEventListener("change", refreshPositionEditor));
  shopFields.fixedShirtHex?.addEventListener("input", refreshPositionEditor);
  positionSize?.addEventListener("input", () => writePositionValues(NaN, NaN, Number(positionSize.value)));
  [shopFields.fixedFrontMotif, shopFields.fixedBackMotif].forEach(el => el?.addEventListener("change", refreshPositionEditor));
  Object.values(shopFields).forEach(el => {
    if(el && /^(tshirt|polo|hoodie)(Front|Back)(X|Y|W)$/.test(Object.keys(shopFields).find(k => shopFields[k] === el) || "")){
      el.addEventListener("input", refreshPositionEditor);
    }
  });
  let dragging = false;
  const move = (ev) => {
    if(!dragging) return;
    const r = positionPrintZone.getBoundingClientRect();
    const point = ev.touches?.[0] || ev;
    let x = ((point.clientX - r.left) / r.width) * 100;
    let y = ((point.clientY - r.top) / r.height) * 100;
    x = Math.max(8, Math.min(92, x));
    y = Math.max(6, Math.min(78, y));
    writePositionValues(x, y, NaN);
    ev.preventDefault();
  };
  positionMotif.addEventListener("pointerdown", ev => {
    dragging = true;
    positionMotif.setPointerCapture?.(ev.pointerId);
    ev.preventDefault();
  });
  positionMotif.addEventListener("pointermove", move);
  positionMotif.addEventListener("pointerup", ev => { dragging = false; positionMotif.releasePointerCapture?.(ev.pointerId); });
  positionMotif.addEventListener("pointercancel", () => { dragging = false; });
  savePositionBtn?.addEventListener("click", () => {
    positionSaveRequested = true;
    saveShopBtn?.click();
  });
}
function deepClone(value){ return JSON.parse(JSON.stringify(value || {})); }
function slugify(value){ return String(value||"").trim().toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""); }
function safeAssetUrl(file, slug){ if(!file)return ""; if(/^(https?:)?\/\//i.test(file)||/^(data|blob):/i.test(file)||file.startsWith("/"))return file; return `/shops/${encodeURIComponent(slug)}/${file}`; }
function setShopState(message, kind=""){ shopSaveState.textContent=message; shopSaveState.className=kind?`message-${kind}`:""; }

let positionSaveRequested = false;
function flashSavedButton(btn, normalText){
  if(!btn) return;
  const original = normalText || btn.dataset.normalText || btn.textContent.trim();
  btn.dataset.normalText = original;
  btn.classList.add("saved-state");
  btn.textContent = "✓ Gespeichert";
  clearTimeout(btn._savedTimer);
  btn._savedTimer = setTimeout(()=>{
    btn.classList.remove("saved-state");
    btn.textContent = original;
  }, 1800);
}

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
    const btn=document.createElement("button"); btn.type="button"; btn.dataset.shopId=id; btn.classList.toggle("active",id===selectedShopId);
    const strong=document.createElement("strong"); strong.textContent=cfg.customerName||id;
    const span=document.createElement("span"); span.textContent=`${id} · ${cfg.shopType||"simple"}${cfg.active===false?" · deaktiviert":""}`;
    btn.append(strong,span); btn.addEventListener("click",()=>selectShop(id)); shopList.appendChild(btn);
  });
  window.refreshV284ShopSelect?.();
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
  shopFields.accent.value=/^#[0-9a-f]{6}$/i.test(cfg.accentColor||"")?cfg.accentColor:"#111111"; shopFields.logoHeight.value=Number(cfg.logoHeight||90); shopFields.previewMode.value=cfg.features?.previewMode||"single"; shopFields.heading.value=cfg.designerHeading||""; shopFields.intro.value=cfg.designerIntro||"";
  shopFields.fixedShirtName.value=cfg.fixedShirtColor?.name||""; shopFields.fixedShirtHex.value=/^#[0-9a-f]{6}$/i.test(cfg.fixedShirtColor?.color||"")?cfg.fixedShirtColor.color:"#0758b2"; shopFields.fixedMotifName.value=cfg.fixedMotifColor?.name||""; shopFields.fixedMotifHex.value=/^#[0-9a-f]{6}$/i.test(cfg.fixedMotifColor?.color||"")?cfg.fixedMotifColor.color:"#f6c951";
  shopFields.showShirtColors.checked=featureValue(cfg,"showShirtColorPicker",true); shopFields.showMotifs.checked=featureValue(cfg,"showMotifPicker",cfg.shopType!=="simple"); shopFields.showMotifColors.checked=featureValue(cfg,"showMotifColorPicker",true);
  shopFields.allowUpload.checked=featureValue(cfg,"allowCustomerUpload",cfg.shopType==="designer"); shopFields.allowText.checked=featureValue(cfg,"allowText",cfg.shopType==="designer"); shopFields.allowBack.checked=featureValue(cfg,"allowBackDesign",true); shopFields.allowMove.checked=featureValue(cfg,"allowMoveMotif",cfg.shopType==="designer"); shopFields.allowResize.checked=featureValue(cfg,"allowResizeMotif",cfg.shopType==="designer"); shopFields.allowRotate.checked=featureValue(cfg,"allowRotateMotif",cfg.shopType==="designer");
  const fp=cfg.fixedPrint||{}; refreshFixedPrintMotifOptions(fp.front?.motifId||"",fp.back?.motifId||"");
  shopFields.fixedFrontEnabled.checked=!!fp.front?.enabled; shopFields.fixedFrontPosition.value=fp.front?.position||"left-chest"; shopFields.fixedFrontSize.value=fp.front?.size||"small"; shopFields.fixedFrontTop.value=Number(fp.front?.topPct ?? 24); shopFields.fixedFrontSide.value=Number(fp.front?.sidePct ?? 32);
  shopFields.fixedBackEnabled.checked=!!fp.back?.enabled; shopFields.fixedBackPosition.value=fp.back?.position||"center"; shopFields.fixedBackSize.value=fp.back?.size||"large"; shopFields.fixedBackTop.value=Number(fp.back?.topPct ?? 36);
  const pp=cfg.productPrint||{};
  const tshirt=pp.tshirt||{}; const polo=pp.polo||{}; const hoodie=pp.hoodie||{};
  shopFields.tshirtFrontX.value=Number(tshirt.front?.xPct ?? 68); shopFields.tshirtFrontY.value=Number(tshirt.front?.yPct ?? fp.front?.topPct ?? 20); shopFields.tshirtFrontW.value=Number(tshirt.front?.widthPct ?? 28);
  shopFields.tshirtBackX.value=Number(tshirt.back?.xPct ?? 50); shopFields.tshirtBackY.value=Number(tshirt.back?.yPct ?? fp.back?.topPct ?? 36); shopFields.tshirtBackW.value=Number(tshirt.back?.widthPct ?? 50);
  shopFields.poloFrontX.value=Number(polo.front?.xPct ?? 68); shopFields.poloFrontY.value=Number(polo.front?.yPct ?? 22); shopFields.poloFrontW.value=Number(polo.front?.widthPct ?? 28);
  shopFields.poloBackX.value=Number(polo.back?.xPct ?? 50); shopFields.poloBackY.value=Number(polo.back?.yPct ?? 36); shopFields.poloBackW.value=Number(polo.back?.widthPct ?? 50);
  shopFields.hoodieFrontX.value=Number(hoodie.front?.xPct ?? 68); shopFields.hoodieFrontY.value=Number(hoodie.front?.yPct ?? 22); shopFields.hoodieFrontW.value=Number(hoodie.front?.widthPct ?? 36);
  shopFields.hoodieBackX.value=Number(hoodie.back?.xPct ?? 50); shopFields.hoodieBackY.value=Number(hoodie.back?.yPct ?? 34); { const hb=Number(hoodie.back?.widthPct ?? 50); shopFields.hoodieBackW.value=(hb===46?50:hb); }
  fillPrintData(cfg);
  if(productionFileUrl) productionFileUrl.value = cfg.productionFile || cfg.printData?.productionFile || "";
  updateFeatureVisibility(cfg.shopType||"simple");
  updateLogoPreview(); renderMotifsEditor(); refreshPositionEditor(); previewShopBtn.hidden=!id; if(id) previewShopBtn.href=`/?shop=${encodeURIComponent(id)}`; setShopState("Bereit zum Bearbeiten."); renderShopList();
}

function updateFeatureVisibility(type){
  if(designerFeatureTools) designerFeatureTools.hidden = type !== "designer";
}

function typePreset(type){
  const designer=type==="designer", motifs=type==="motifs";
  shopFields.showMotifs.checked=motifs||designer; shopFields.allowUpload.checked=designer; shopFields.allowText.checked=designer; shopFields.allowMove.checked=designer; shopFields.allowResize.checked=designer; shopFields.allowRotate.checked=designer; shopFields.showShirtColors.checked=true; shopFields.showMotifColors.checked=true; shopFields.allowBack.checked=true;
  updateFeatureVisibility(type);
}
shopFields.type.addEventListener("change",()=>typePreset(shopFields.type.value));
bindPositionEditor();

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
  refreshPositionEditor();
}
addMotifBtn.addEventListener("click",()=>{ if(workingMotifs.length>=4){alert("Für die direkte Firebase-Verwaltung sind maximal 4 Motive vorgesehen.");return;} const n=workingMotifs.length+1;workingMotifs.push({id:`motiv${n}`,name:`Motiv ${n}`,file:""});renderMotifsEditor();setShopState("Neues Motiv angelegt – Bild auswählen und speichern.") });

newShopBtn.addEventListener("click",()=>{
  selectedShopId=""; selectedShopOriginal={}; workingMotifs=[{id:"motiv1",name:"Motiv 1",file:""}]; workingLogo=""; shopForm.hidden=false; saveShopBtn.disabled=false; shopEditorTitle.textContent="Neuen Shop anlegen"; shopFields.id.disabled=false;
  shopFields.id.value=""; shopFields.name.value=""; shopFields.type.value="simple"; shopFields.price.value=15; shopFields.prefix.value=""; shopFields.email.value=CENTRAL.orderEmail||"shirtzentrale@gmail.com"; shopFields.active.checked=true; shopFields.accent.value="#111111"; shopFields.logoHeight.value=90; shopFields.previewMode.value="single"; shopFields.heading.value="Shirt gestalten"; shopFields.intro.value=""; shopFields.fixedShirtName.value=""; shopFields.fixedMotifName.value=""; refreshFixedPrintMotifOptions("motiv1","motiv1"); shopFields.fixedFrontEnabled.checked=false; shopFields.fixedFrontPosition.value="left-chest"; shopFields.fixedFrontSize.value="small"; shopFields.fixedFrontTop.value=24; shopFields.fixedFrontSide.value=32; shopFields.fixedBackEnabled.checked=false; shopFields.fixedBackPosition.value="center"; shopFields.fixedBackSize.value="large";
  shopFields.tshirtFrontX.value=68; shopFields.tshirtFrontY.value=20; shopFields.tshirtFrontW.value=28; shopFields.tshirtBackX.value=50; shopFields.tshirtBackY.value=36; shopFields.tshirtBackW.value=50;
  shopFields.poloFrontX.value=68; shopFields.poloFrontY.value=22; shopFields.poloFrontW.value=28; shopFields.poloBackX.value=50; shopFields.poloBackY.value=36; shopFields.poloBackW.value=50; shopFields.hoodieFrontX.value=68; shopFields.hoodieFrontY.value=22; shopFields.hoodieFrontW.value=36; shopFields.hoodieBackX.value=50; shopFields.hoodieBackY.value=34; shopFields.hoodieBackW.value=50; fillPrintData({}); typePreset("simple"); updateLogoPreview(); renderMotifsEditor(); refreshPositionEditor(); previewShopBtn.hidden=true; setShopState("Neue Shop-ID und Daten eintragen."); renderShopList();
});
shopFields.name.addEventListener("blur",()=>{ if(!selectedShopId && !shopFields.id.value) shopFields.id.value=slugify(shopFields.name.value); });

function buildShopConfig(){
  const id=slugify(shopFields.id.value); if(!id) throw new Error("Bitte eine gültige Shop-ID eingeben.");
  const name=shopFields.name.value.trim(); if(!name) throw new Error("Bitte einen Shopnamen eingeben.");
  const type=shopFields.type.value; const old=deepClone(selectedShopOriginal||{});
  const features={...(old.features||{}),layout:type==="designer"?"designer":type==="motifs"?"compact":"simple",motifMode:type==="designer"?"mixed":type==="motifs"?"multiple":"single",allowCustomerUpload:shopFields.allowUpload.checked,allowText:shopFields.allowText.checked,allowMoveMotif:shopFields.allowMove.checked,allowResizeMotif:shopFields.allowResize.checked,allowRotateMotif:shopFields.allowRotate.checked,allowBackDesign:shopFields.allowBack.checked,allowMotifColor:true,showShirtColorPicker:shopFields.showShirtColors.checked,showMotifPicker:shopFields.showMotifs.checked,showMotifColorPicker:shopFields.showMotifColors.checked,autoSelectSingleMotif:type==="simple",maxUploadMB:8,previewMode:shopFields.previewMode.value||"single"};
  const cfg={...old,customerId:id,customerName:name,pageTitle:old.pageTitle||`${name} – T-Shirt Shop`,brandTitle:old.brandTitle!==undefined?old.brandTitle:name,brandSubtitle:old.brandSubtitle||"T-Shirt Konfigurator",designerHeading:shopFields.heading.value.trim()||"Shirt gestalten",designerIntro:shopFields.intro.value.trim(),accentColor:shopFields.accent.value,logoFile:workingLogo||old.logoFile||"shop-logo.png",logoHeight:Number(shopFields.logoHeight.value)||90,shirtPrice:Number(shopFields.price.value)||0,currency:"EUR",orderEmail:shopFields.email.value.trim()||CENTRAL.orderEmail||"shirtzentrale@gmail.com",orderSubject:`Neue ${name} T-Shirt Bestellung`,customerExtraFieldLabel:"Adresse",customerExtraFieldName:"Adresse",orderPrefix:(shopFields.prefix.value.trim()||id.slice(0,3)).toUpperCase(),shopType:type,active:shopFields.active.checked,features,motifs:workingMotifs.filter(m=>m.name||m.file).map((m,i)=>({id:m.id||`motiv${i+1}`,name:m.name||`Motiv ${i+1}`,file:m.file||""}))};
  const fsn=shopFields.fixedShirtName.value.trim(), fmn=shopFields.fixedMotifName.value.trim(); if(fsn) cfg.fixedShirtColor={id:slugify(fsn),name:fsn,color:shopFields.fixedShirtHex.value}; else delete cfg.fixedShirtColor; if(fmn) cfg.fixedMotifColor={name:fmn,color:shopFields.fixedMotifHex.value}; else delete cfg.fixedMotifColor;
  cfg.fixedPrint={
    front:{enabled:shopFields.fixedFrontEnabled.checked,motifId:shopFields.fixedFrontMotif.value||"motiv1",position:shopFields.fixedFrontPosition.value||"left-chest",size:shopFields.fixedFrontSize.value||"small",topPct:Math.max(10,Math.min(70,Number(shopFields.fixedFrontTop.value)||24)),sidePct:Math.max(15,Math.min(50,Number(shopFields.fixedFrontSide.value)||32))},
    back:{enabled:shopFields.fixedBackEnabled.checked,motifId:shopFields.fixedBackMotif.value||"motiv1",position:shopFields.fixedBackPosition.value||"center",size:shopFields.fixedBackSize.value||"large",topPct:Math.max(10,Math.min(70,Number(shopFields.fixedBackTop.value)||36))}
  };
  const clamp=(v,min,max,fallback)=>Math.max(min,Math.min(max,Number(v)||fallback));
  cfg.productPrint={
    ...(old.productPrint||{}),
    tshirt:{front:{xPct:clamp(shopFields.tshirtFrontX.value,10,90,68),yPct:clamp(shopFields.tshirtFrontY.value,10,70,20),widthPct:clamp(shopFields.tshirtFrontW.value,8,70,28)},back:{xPct:clamp(shopFields.tshirtBackX.value,10,90,50),yPct:clamp(shopFields.tshirtBackY.value,10,70,36),widthPct:clamp(shopFields.tshirtBackW.value,10,80,50)}},
    polo:{front:{xPct:clamp(shopFields.poloFrontX.value,10,90,68),yPct:clamp(shopFields.poloFrontY.value,10,70,22),widthPct:clamp(shopFields.poloFrontW.value,8,70,28)},back:{xPct:clamp(shopFields.poloBackX.value,10,90,50),yPct:clamp(shopFields.poloBackY.value,10,70,36),widthPct:clamp(shopFields.poloBackW.value,10,80,50)}},
    hoodie:{front:{xPct:clamp(shopFields.hoodieFrontX.value,10,90,68),yPct:clamp(shopFields.hoodieFrontY.value,10,70,22),widthPct:clamp(shopFields.hoodieFrontW.value,8,70,36)},back:{xPct:clamp(shopFields.hoodieBackX.value,10,90,50),yPct:clamp(shopFields.hoodieBackY.value,10,70,34),widthPct:clamp(shopFields.hoodieBackW.value,10,80,50)}}
  };
  cfg.printData=collectPrintData();
  cfg.productionFile=(productionFileUrl?.value||"").trim();
  if(id === "tg-solingen") {
    cfg.hoodieSizingVersion = 1;
    const oldProducts = Array.isArray(old.products) ? old.products : [];
    const byId = Object.fromEntries(oldProducts.map(p => [p.id, p]));
    cfg.products = [
      {...(byId.tshirt||{}),id:"tshirt",name:"T-Shirt",articleNo:"F140",price:15,purchasePrice:2.60,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png"},
      {...(byId.polo||{}),id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png"},
      {...(byId.hoodie||{}),id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png"}
    ];
  }
  if(cfg.fixedPrint.back.enabled) cfg.features.allowBackDesign=true;
  return cfg;
}

saveShopBtn.addEventListener("click",async()=>{
  try{
    const cfg=buildShopConfig(); saveShopBtn.disabled=true; setShopState("Wird gespeichert …");
    const serialized=JSON.stringify(cfg); if(serialized.length>900000) throw new Error("Shopdaten sind zu groß. Bitte kleinere Motivbilder verwenden.");
    await db.collection("shops").doc(cfg.customerId).set(cfg,{merge:false});
    selectedShopId=cfg.customerId; selectedShopOriginal=deepClone(cfg); shopConfigs.set(cfg.customerId,deepClone(cfg)); shopFields.id.disabled=true; previewShopBtn.hidden=false; previewShopBtn.href=`/?shop=${encodeURIComponent(cfg.customerId)}`; shopEditorTitle.textContent=cfg.customerName; renderShopList(); setShopState("✓ Gespeichert – Änderungen sind sofort live.","ok");
    flashSavedButton(saveShopBtn, "Speichern");
    if(positionSaveRequested) flashSavedButton(savePositionBtn, "Position speichern");
    positionSaveRequested = false;
  }catch(err){ positionSaveRequested = false; console.error(err); setShopState(err.message||"Speichern fehlgeschlagen.","error"); alert(err.message||"Shop konnte nicht gespeichert werden."); }
  finally{ saveShopBtn.disabled=false; }
});


// MASTER v28.3.6 – kompakte Unter-Navigation für Shop-Einstellungen
(function initShopSubTabs(){
  const form = document.getElementById("shopForm");
  if(!form || document.getElementById("shopSubTabs")) return;

  const fixedPrint = form.querySelector(".fixed-print-accordion");
  const production = form.querySelector(".print-data-accordion");
  const functions = form.querySelector(".functions-accordion");
  const motifDetails = [...form.querySelectorAll("details.compact-accordion")].find(el =>
    el !== fixedPrint && el !== production && el !== functions && el.querySelector("#motifsEditor")
  );
  if(!fixedPrint || !production || !functions || !motifDetails) return;

  const nav = document.createElement("div");
  nav.id = "shopSubTabs";
  nav.className = "shop-subtabs";
  nav.innerHTML = `
    <button type="button" class="shop-subtab active" data-panel="motif">Motiv</button>
    <button type="button" class="shop-subtab" data-panel="production">Produktionsdaten</button>
    <button type="button" class="shop-subtab" data-panel="functions">Funktionen</button>
    <button type="button" class="shop-subtab" data-panel="more">Weitere Einstellungen</button>`;

  const panels = document.createElement("div");
  panels.className = "shop-subtab-panels";
  panels.innerHTML = `
    <section class="shop-subpanel active" data-panel="motif"></section>
    <section class="shop-subpanel" data-panel="production" hidden></section>
    <section class="shop-subpanel" data-panel="functions" hidden></section>
    <section class="shop-subpanel" data-panel="more" hidden></section>`;

  fixedPrint.parentNode.insertBefore(nav, fixedPrint);
  nav.after(panels);

  const motifPanel = panels.querySelector('[data-panel="motif"]');
  const productionPanel = panels.querySelector('[data-panel="production"]');
  const functionsPanel = panels.querySelector('[data-panel="functions"]');
  const morePanel = panels.querySelector('[data-panel="more"]');

  // Details-Elemente bleiben technisch erhalten; innerhalb der Reiter werden sie immer offen gezeigt.
  [fixedPrint, production, functions, motifDetails].forEach(el => {
    el.open = true;
    el.classList.add("subtab-section");
  });
  motifPanel.appendChild(fixedPrint);
  productionPanel.appendChild(production);
  functionsPanel.appendChild(functions);
  morePanel.appendChild(motifDetails);

  const setPanel = name => {
    nav.querySelectorAll(".shop-subtab").forEach(btn => btn.classList.toggle("active", btn.dataset.panel === name));
    panels.querySelectorAll(".shop-subpanel").forEach(panel => {
      const active = panel.dataset.panel === name;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    });
  };
  nav.addEventListener("click", e => {
    const btn = e.target.closest(".shop-subtab");
    if(btn) setPanel(btn.dataset.panel);
  });
})();


// ============================================================
// MASTER v28.4.0 – Adminlayout nach Referenzdesign
// ============================================================
(function initV284ReferenceLayout(){
  if(document.getElementById("v284Sidebar")) return;
  document.body.classList.add("v284-admin");

  const shell = document.querySelector(".admin-shell");
  const dashboardEl = document.getElementById("dashboard");
  const originalLogout = document.getElementById("logoutBtn");
  const originalNewShop = document.getElementById("newShopBtn");
  const list = document.getElementById("shopList");
  const shopListPanel = document.querySelector(".shop-list-panel");
  const editorPanel = document.querySelector(".shop-editor-panel");

  const sidebar=document.createElement("aside");
  sidebar.id="v284Sidebar";
  sidebar.className="v284-sidebar";
  sidebar.hidden=true;
  sidebar.innerHTML=`
    <div class="v284-brand">
      <div class="v284-brand-mark">⌁</div>
      <div class="v284-brand-copy"><strong>ShirtProjekt</strong><span>Admin</span></div>
      <button type="button" id="v284MobileMenu" class="v284-mobile-menu" aria-label="Admin-Menü öffnen" aria-expanded="false">☰</button>
    </div>
    <label class="v284-shop-select-wrap"><span>Shop</span><select id="v284ShopSelect"><option>Shop wählen</option></select></label>
    <nav class="v284-nav" aria-label="Admin Navigation">
      <button type="button" data-main="shops" class="active"><span>⚙</span>Shop Einstellungen</button>
      <button type="button" data-main="orders"><span>▣</span>Bestellungen</button>
      <button type="button" data-jump="motif"><span>✥</span>Motive / Logos</button>
      <button type="button" data-jump="functions"><span>◉</span>Funktionen</button>
    </nav>
    <div class="v284-side-bottom">
      <button type="button" id="v284NewShop">＋ Neuer Shop</button>
      <button type="button" id="v284Logout">↪ Abmelden</button>
    </div>`;
  document.body.insertBefore(sidebar,shell);

  const shopSelect=sidebar.querySelector("#v284ShopSelect");
  window.refreshV284ShopSelect=function(){
    if(!shopSelect || !list) return;
    const current=selectedShopId || "";
    const opts=[...list.querySelectorAll("button[data-shop-id]")];
    shopSelect.replaceChildren();
    opts.forEach(btn=>{
      const op=document.createElement("option");
      op.value=btn.dataset.shopId;
      op.textContent=btn.querySelector("strong")?.textContent || btn.dataset.shopId;
      op.selected=op.value===current;
      shopSelect.appendChild(op);
    });
  };
  const listObserver=new MutationObserver(()=>window.refreshV284ShopSelect?.());
  if(list) listObserver.observe(list,{childList:true,subtree:true});
  shopSelect.addEventListener("change",()=>{
    const btn=list?.querySelector(`button[data-shop-id="${CSS.escape(shopSelect.value)}"]`);
    btn?.click();
  });

  sidebar.querySelector("#v284NewShop").addEventListener("click",()=>originalNewShop?.click());
  sidebar.querySelector("#v284Logout").addEventListener("click",()=>originalLogout?.click());
  const mobileMenuBtn=sidebar.querySelector("#v284MobileMenu");
  mobileMenuBtn?.addEventListener("click",()=>{
    const open=sidebar.classList.toggle("mobile-menu-open");
    mobileMenuBtn.setAttribute("aria-expanded",String(open));
    mobileMenuBtn.textContent=open?"×":"☰";
  });

  function setNavActive(name){
    sidebar.querySelectorAll(".v284-nav button").forEach(btn=>{
      btn.classList.toggle("active",btn.dataset.main===name || (name==="shops" && btn.dataset.jump===undefined && btn.dataset.main==="shops"));
    });
  }
  function openCard(key){
    switchAdminTab("shops");
    setNavActive("shops");
    const card=document.querySelector(`.v284-card[data-card="${key}"]`);
    if(card){ card.open=true; card.scrollIntoView({behavior:"smooth",block:"start"}); }
  }
  sidebar.querySelectorAll(".v284-nav button").forEach(btn=>btn.addEventListener("click",()=>{
    if(btn.dataset.main){ switchAdminTab(btn.dataset.main); setNavActive(btn.dataset.main); }
    else if(btn.dataset.jump) openCard(btn.dataset.jump);
    if(window.matchMedia("(max-width:720px)").matches){
      sidebar.classList.remove("mobile-menu-open");
      if(mobileMenuBtn){ mobileMenuBtn.setAttribute("aria-expanded","false"); mobileMenuBtn.textContent="☰"; }
    }
  }));

  const dashObserver=new MutationObserver(()=>{
    sidebar.hidden=dashboardEl.hidden;
    if(!dashboardEl.hidden){
      setNavActive(ordersTab.hidden?"shops":"orders");
      window.refreshV284ShopSelect?.();
    }
  });
  dashObserver.observe(dashboardEl,{attributes:true,attributeFilter:["hidden"]});

  // Referenz-Layout für die Shop-Einstellungen aufbauen, ohne Feld-IDs zu ändern.
  const form=document.getElementById("shopForm");
  if(!form || !editorPanel) return;
  if(shopListPanel) shopListPanel.classList.add("v284-hidden-shop-list");
  document.querySelector(".admin-tabs")?.classList.add("v284-hide-top-tabs");
  document.querySelector(".admin-header")?.classList.add("v284-hide-old-header");

  const topSettings=form.querySelector(".top-settings-column");
  const topPosition=form.querySelector(".top-position-column");
  const grund=topSettings?.querySelector(".form-section:not(.compact-colors-section):not(.embedded-display-section)");
  const colors=topSettings?.querySelector(".compact-colors-section");
  const display=topSettings?.querySelector(".embedded-display-section");
  const logo=grund?.querySelector(".shop-logo-inline");
  const position=topPosition?.querySelector(".position-editor-section");
  const technical=topPosition?.querySelector(".technical-position-values");
  const fixed=form.querySelector(".fixed-print-accordion");
  const production=form.querySelector(".print-data-accordion");
  const functions=form.querySelector(".functions-accordion");
  const motifDetails=[...form.querySelectorAll("details.compact-accordion")].find(el=>el!==fixed&&el!==production&&el!==functions&&el.querySelector("#motifsEditor"));

  const stack=document.createElement("div");
  stack.className="v284-card-stack";

  function card(title,key,content,open=true,subtitle=""){
    const d=document.createElement("details");
    d.className="v284-card";
    d.dataset.card=key;
    const mobile=window.matchMedia("(max-width:720px)").matches;
    d.open=mobile ? (key === "motif") : open;
    const summary=document.createElement("summary");
    summary.innerHTML=`<span class="v284-card-title">${title}</span>${subtitle?`<small>${subtitle}</small>`:""}<b>⌃</b>`;
    const body=document.createElement("div"); body.className="v284-card-body";
    if(content) body.appendChild(content);
    d.append(summary,body); stack.appendChild(d); return d;
  }

  // Grunddaten bewusst als EINEN kompakten Bereich behalten.
  // Shop-Logo, Farben sowie Darstellung & Texte werden in Grunddaten integriert,
  // statt wieder als große Einzelkarten untereinander zu erscheinen.
  if(grund){
    grund.classList.add("v284-inner-section","v284-basic-combined","v2850-basic");
    const designHost=grund.querySelector(".v2850-design");
    if(designHost){
      const designGrid=document.createElement("div");
      designGrid.className="v2850-design-grid";
      if(colors){
        colors.classList.add("v284-inner-section","v284-basic-colors");
        designGrid.appendChild(colors);
      }
      if(display){
        display.classList.add("v284-inner-section","v284-basic-display");
        designGrid.appendChild(display);
      }
      designHost.appendChild(designGrid);
    }else{
      if(colors) grund.appendChild(colors);
      if(display) grund.appendChild(display);
    }
    card("Grunddaten & Produkte","basic",grund,true);
  }
  if(functions){ const body=functions.querySelector(".accordion-body")||functions; card("Funktionen","functions",body,true); }

  // Motiv-/Druckbereich: kompakte Übersicht + vorhandenen visuellen Editor.
  if(position){
    const wrap=document.createElement("div"); wrap.className="v284-motif-wrap";
    const table=document.createElement("div"); table.id="v284PrintTable"; table.className="v284-print-table";
    wrap.append(table,position);
    if(motifDetails){
      const mb=motifDetails.querySelector(".accordion-body");
      if(mb){ const manage=document.createElement("details"); manage.className="v284-inline-manage"; manage.innerHTML="<summary>Motivdateien verwalten</summary>"; manage.appendChild(mb); wrap.appendChild(manage); }
    }
    card("Motive (Druckbereich)","motif",wrap,true);
  }
  if(fixed){ const body=fixed.querySelector(".accordion-body")||fixed; card("Fester Druck (vorne / hinten)","fixed",body,true); }
  if(production){ const body=production.querySelector(".accordion-body")||production; card("Produktionsdaten","production",body,false); }
  if(technical){ technical.hidden=true; form.appendChild(technical); }

  // Alte Zwischen-Navigation/Wrapper entfernen, nachdem Inhalte umgezogen wurden.
  form.querySelector("#shopSubTabs")?.remove();
  form.querySelector(".shop-subtab-panels")?.remove();
  form.querySelector(".top-editor-grid")?.remove();
  form.querySelector(".accordion-grid")?.remove();
  form.appendChild(stack);

  // Motivübersicht wie im Referenzbild.
  window.updateV284PrintTable=function(){
    const table=document.getElementById("v284PrintTable"); if(!table) return;
    const motif=workingMotifs?.[0];
    const motifSrc=motif?.file?safeAssetUrl(motif.file,shopFields.id.value||selectedShopId||"_simple"):"";
    const rows=[
      ["tshirt","front","T-Shirt","Vorderseite",shopFields.tshirtFrontX,shopFields.tshirtFrontY,shopFields.tshirtFrontW],
      ["tshirt","back","T-Shirt","Rückseite",shopFields.tshirtBackX,shopFields.tshirtBackY,shopFields.tshirtBackW],
      ["polo","front","Polo","Vorderseite",shopFields.poloFrontX,shopFields.poloFrontY,shopFields.poloFrontW],
      ["polo","back","Polo","Rückseite",shopFields.poloBackX,shopFields.poloBackY,shopFields.poloBackW],
      ["hoodie","front","Hoodie","Vorderseite",shopFields.hoodieFrontX,shopFields.hoodieFrontY,shopFields.hoodieFrontW],
      ["hoodie","back","Hoodie","Rückseite",shopFields.hoodieBackX,shopFields.hoodieBackY,shopFields.hoodieBackW]
    ];
    const sizeLabel=(p,s,w)=>{
      const n=Number(w?.value||0);
      if(p==="hoodie"&&s==="front") return n<33?"small":n<40?"medium":"large";
      if(p==="hoodie"&&s==="back") return n<42?"small":n<50?"medium":"large";
      if(s==="front") return n<24?"small":n<33?"medium":"large";
      return n<44?"small":n<56?"medium":"large";
    };
    const sizeValue=(p,s,label)=>{
      if(p==="hoodie"&&s==="front") return label==="small"?30:label==="medium"?36:42;
      if(p==="hoodie"&&s==="back") return label==="small"?38:label==="medium"?46:54;
      if(s==="front") return label==="small"?20:label==="medium"?28:36;
      return label==="small"?38:label==="medium"?50:60;
    };
    table.innerHTML=`<div class="v284-tr v284-th v284-simple-print-row v2852-print-row"><span>Textil</span><span>Seite</span><span>Motiv</span><span>Größe</span><span>Aktion</span></div>`+
      rows.map(([p,s,pn,sn,x,y,w])=>`<div class="v284-tr v284-simple-print-row v2852-print-row"><span>${pn}</span><span>${sn}</span><span class="v284-motif-cell">${motifSrc?`<img src="${motifSrc}" alt="Motiv">`:"–"}</span><span><select class="v2852-size-select" data-product="${p}" data-side="${s}" aria-label="Motivgröße ${pn} ${sn}"><option value="small" ${sizeLabel(p,s,w)==="small"?"selected":""}>Klein</option><option value="medium" ${sizeLabel(p,s,w)==="medium"?"selected":""}>Mittel</option><option value="large" ${sizeLabel(p,s,w)==="large"?"selected":""}>Groß</option></select></span><span><button type="button" class="v284-edit-print" data-product="${p}" data-side="${s}">Positionieren</button></span></div>`).join("");
    table.querySelectorAll(".v2852-size-select").forEach(sel=>sel.addEventListener("change",()=>{
      const row=rows.find(r=>r[0]===sel.dataset.product&&r[1]===sel.dataset.side);
      if(!row) return;
      row[6].value=String(sizeValue(sel.dataset.product,sel.dataset.side,sel.value));
      if(positionProduct.value===sel.dataset.product&&positionSide.value===sel.dataset.side) refreshPositionEditor();
      setShopState("Motivgröße geändert – bitte speichern.");
    }));
    table.querySelectorAll(".v284-edit-print").forEach(btn=>btn.addEventListener("click",()=>{
      positionProduct.value=btn.dataset.product;
      positionSide.value=btn.dataset.side;
      refreshPositionEditor();
      position.scrollIntoView({behavior:"smooth",block:"center"});
    }));
  };
  window.updateV284PrintTable();

  // Buttons/Status im Kopf wie im Referenzdesign beschriften.
  editorPanel.classList.add("v284-editor-panel");
  const panelHead=editorPanel.querySelector(":scope > .panel-head");
  panelHead?.classList.add("v284-editor-head");
  if(panelHead){
    const h=panelHead.querySelector("h2"); if(h) h.insertAdjacentHTML("beforebegin",'<span class="v284-kicker">Shop Einstellungen</span>');
  }
})();

// ============================================================
// v28.5.3 – Referenzlayout A (sichtbarer Neuaufbau)
// ============================================================
(function initV2853ReferenceUI(){
  const form=document.getElementById('shopForm');
  if(!form || document.getElementById('v2853Workspace')) return;

  document.body.classList.add('v2853-reference');

  const stack=form.querySelector('.v284-card-stack');
  const basicCard=form.querySelector('.v284-card[data-card="basic"]');
  const motifCard=form.querySelector('.v284-card[data-card="motif"]');
  const functionCard=form.querySelector('.v284-card[data-card="functions"]');
  const productionCard=form.querySelector('.v284-card[data-card="production"]');
  const fixedCard=form.querySelector('.v284-card[data-card="fixed"]');
  if(!stack || !basicCard || !motifCard) return;

  const basicBody=basicCard.querySelector('.v284-card-body');
  const grund=basicBody?.querySelector('.v2850-basic, .v284-basic-combined, .form-section');
  const mainGrid=grund?.querySelector('.v2850-main-fields');
  const products=grund?.querySelector('.v2850-products');
  const designHost=grund?.querySelector('.v2850-design');
  const logo=designHost?.querySelector('.shop-logo-inline') || grund?.querySelector('.shop-logo-inline');
  const colors=designHost?.querySelector('.compact-colors-section') || grund?.querySelector('.compact-colors-section');
  const display=designHost?.querySelector('.embedded-display-section') || grund?.querySelector('.embedded-display-section');

  const motifBody=motifCard.querySelector('.v284-card-body');
  const motifWrap=motifBody?.querySelector('.v284-motif-wrap');
  const printTable=motifWrap?.querySelector('#v284PrintTable');
  const position=motifWrap?.querySelector('.position-editor-section');
  const toolbar=position?.querySelector('.position-editor-toolbar');
  const stage=position?.querySelector('#positionStage');
  const readout=position?.querySelector('.position-readout');
  const sizeControl=toolbar?.querySelector('.position-size-control');
  const productLabel=toolbar?.querySelector('label:has(#positionProduct)');
  const sideLabel=toolbar?.querySelector('label:has(#positionSide)');

  const workspace=document.createElement('div');
  workspace.id='v2853Workspace';
  workspace.className='v2853-workspace';
  workspace.innerHTML=`
    <div class="v2853-left"></div>
    <div class="v2853-right"></div>
    <div class="v2853-bottom"></div>`;
  const left=workspace.querySelector('.v2853-left');
  const right=workspace.querySelector('.v2853-right');
  const bottom=workspace.querySelector('.v2853-bottom');

  function makeCard(title,cls=''){
    const card=document.createElement('section');
    card.className=`v2853-card ${cls}`.trim();
    const head=document.createElement('div');
    head.className='v2853-card-head';
    head.innerHTML=`<h3>${title}</h3><span aria-hidden="true">⌃</span>`;
    const body=document.createElement('div');
    body.className='v2853-card-body';
    card.append(head,body);
    return {card,body};
  }

  // Grunddaten: nur wirklich relevante Felder + Produkte.
  const basic=makeCard('Grunddaten','v2853-basic-card');
  if(mainGrid){
    mainGrid.classList.add('v2853-basic-grid');
    // Name zuerst; Shop-Logo sitzt direkt daneben.
    const name=mainGrid.querySelector('.v2850-name-field');
    if(name) name.classList.add('v2853-name');
    const nameLogoRow=document.createElement('div');
    nameLogoRow.className='v2854-name-logo-row';
    if(name) nameLogoRow.appendChild(name);
    if(logo){
      logo.classList.add('v2854-basic-logo');
      nameLogoRow.appendChild(logo);
    }
    if(nameLogoRow.childElementCount) basic.body.appendChild(nameLogoRow);
    basic.body.appendChild(mainGrid);
  }
  if(products){
    products.classList.add('v2853-products');
    basic.body.appendChild(products);
  }
  left.appendChild(basic.card);

  // Darstellung & Farben: alle optischen Einstellungen kompakt in einer Karte.
  const appearance=makeCard('Darstellung & Farben','v2853-appearance-card v2869-appearance-colors');
  let detachedAccent=null;
  if(display){
    detachedAccent=display.querySelector('.v2850-accent');
    if(detachedAccent) detachedAccent.remove();
    display.classList.add('v2853-display');
    appearance.body.appendChild(display);
  }
  if(colors){
    colors.classList.add('v2869-inline-colors');
    appearance.body.appendChild(colors);
    if(detachedAccent){
      let grid=colors.querySelector('.compact-color-row');
      if(grid) grid.appendChild(detachedAccent);
      else colors.appendChild(detachedAccent);
    }
  } else if(detachedAccent){
    appearance.body.appendChild(detachedAccent);
  }
  if(designHost) designHost.remove();
  left.appendChild(appearance.card);

  // Artikel + große Vorschau rechts.
  const article=makeCard('Artikel','v2853-article-card');
  const articleControls=document.createElement('div');
  articleControls.className='v2853-article-controls';
  if(productLabel){ productLabel.querySelector('span').textContent='Kategorie'; articleControls.appendChild(productLabel); }
  const model=document.createElement('label');
  model.innerHTML='<span>Modell</span><input id="v2853Model" type="text" readonly value="F140 · T-Shirt">';
  articleControls.appendChild(model);
  const color=document.createElement('label');
  color.innerHTML='<span>Farbe</span><div class="v2853-color-readonly"><i></i><b id="v2853ColorName">Royal Blue</b></div>';
  articleControls.appendChild(color);
  if(sideLabel){ sideLabel.querySelector('span').textContent='Ansicht'; articleControls.appendChild(sideLabel); }
  article.body.appendChild(articleControls);

  const previewShell=document.createElement('div');
  previewShell.className='v2853-preview-shell';
  previewShell.innerHTML='<div class="v2853-preview-head"><strong id="v2853PreviewTitle">Vorschau – Vorderseite</strong><small>Motiv direkt auf dem Textil verschieben</small></div>';
  if(stage) previewShell.appendChild(stage);
  // v28.6.1: Motivgröße wieder direkt unter der Vorschau sichtbar machen.
  // Der bestehende Range-Regler steuert weiterhin exakt die gespeicherte Breite,
  // zeigt aber bewusst keine Prozentwerte – nur Klein / Mittel / Groß.
  if(sizeControl){
    const sizeWrap=document.createElement('div');
    sizeWrap.className='v2859-size-wrap';
    const sizeTitle=document.createElement('div');
    sizeTitle.className='v2859-size-title';
    sizeTitle.textContent='Motivgröße';
    sizeControl.classList.add('v2859-preview-size-control');
    const labelSpan=sizeControl.querySelector(':scope > span');
    if(labelSpan) labelSpan.remove();
    sizeWrap.append(sizeTitle,sizeControl);
    previewShell.appendChild(sizeWrap);
  }
  if(readout) previewShell.appendChild(readout);
  article.body.appendChild(previewShell);
  right.appendChild(article.card);

  // Motiv / Druckbereich: zentrale, eigenständige Übersicht.
  // Wichtig: Die bestehende Artikelauswahl/Positionierungs-Logik bleibt unangetastet.
  const print=makeCard('Motiv / Druckbereich','v2853-print-card');
  const motifIntro=document.createElement('div');
  motifIntro.className='v2855-motif-intro';
  motifIntro.innerHTML='<strong>Motiv & Position</strong><span>Größe wählen und bei Bedarf direkt auf dem Textil positionieren.</span>';
  print.body.appendChild(motifIntro);
  const mergedTable=document.createElement('div');
  mergedTable.id='v2856PrintTable';
  mergedTable.className='v284-print-table v2855-print-table';
  print.body.appendChild(mergedTable);
  if(productionCard){
    const pb=productionCard.querySelector('.v284-card-body');
    const production=pb?.querySelector('.accordion-body') || pb?.firstElementChild || pb;
    if(production){
      const divider=document.createElement('div');
      divider.className='v2855-production-divider';
      divider.innerHTML='<strong>Produktion</strong><span>Einmal hinterlegt – gilt für alle Textilien.</span>';
      print.body.appendChild(divider);
      production.classList.add('v2911-production-compact');
      print.body.appendChild(production);
      productionCard.remove();
    }
  }
  right.appendChild(print.card);

  // Funktionen mit echten Toggle-Switches.
  if(functionCard){
    const functions=makeCard('Funktionen','v2853-functions-card');
    const fb=functionCard.querySelector('.v284-card-body');
    if(fb) while(fb.firstChild) functions.body.appendChild(fb.firstChild);
    bottom.appendChild(functions.card);
  }

  // Fester Druck bleibt vorhanden, aber kompakt und weiter unten.
  if(fixedCard){
    const fixed=makeCard('Fester Druck','v2853-fixed-card');
    const xb=fixedCard.querySelector('.v284-card-body');
    if(xb) while(xb.firstChild) fixed.body.appendChild(xb.firstChild);
    bottom.appendChild(fixed.card);
  }

  // Alte Karten entfernen; alle benötigten Felder wurden mit ihren IDs umgezogen.
  stack.remove();
  form.appendChild(workspace);

  const product=document.getElementById('positionProduct');
  const side=document.getElementById('positionSide');

  // v28.6.1: Artikelauswahl immer vollständig halten.
  if(product){
    const keep=product.value || 'tshirt';
    product.innerHTML='<option value="tshirt">T-Shirt</option><option value="polo">Polo-Shirt</option><option value="hoodie">Hoodie</option>';
    product.value=['tshirt','polo','hoodie'].includes(keep)?keep:'tshirt';
  }

  function renderMergedPrintTable(){
    const table=document.getElementById('v2856PrintTable');
    if(!table) return;
    const motif=workingMotifs?.[0];
    const motifSrc=motif?.file?safeAssetUrl(motif.file,shopFields.id.value||selectedShopId||'_simple'):'';
    const motifName=motif?.name||'Motiv';
    const shirtHex=(shopFields.fixedShirtHex?.value||'#0758b2').trim();
    const productionHref=(productionFileUrl?.value||'').trim();
    const products=[
      {key:'tshirt',name:'T-Shirt',tone:'v2862-product-tshirt',front:shopFields.tshirtFrontW,back:shopFields.tshirtBackW},
      {key:'polo',name:'Polo-Shirt',tone:'v2862-product-polo',front:shopFields.poloFrontW,back:shopFields.poloBackW},
      {key:'hoodie',name:'Hoodie',tone:'v2862-product-hoodie',front:shopFields.hoodieFrontW,back:shopFields.hoodieBackW}
    ];
    const sizeLabel=(p,s,w)=>{
      const n=Number(w?.value||0);
      if(p==='hoodie'&&s==='front') return n<33?'small':n<40?'medium':'large';
      if(p==='hoodie'&&s==='back') return n<42?'small':n<50?'medium':'large';
      if(s==='front') return n<24?'small':n<33?'medium':'large';
      return n<44?'small':n<56?'medium':'large';
    };
    const sizeValue=(p,s,label)=>{
      if(p==='hoodie'&&s==='front') return label==='small'?30:label==='medium'?36:42;
      if(p==='hoodie'&&s==='back') return label==='small'?38:label==='medium'?50:58;
      if(s==='front') return label==='small'?20:label==='medium'?28:36;
      return label==='small'?38:label==='medium'?50:60;
    };
    const optionHtml=(p,s,w)=>`<option value="small" ${sizeLabel(p,s,w)==='small'?'selected':''}>Klein</option><option value="medium" ${sizeLabel(p,s,w)==='medium'?'selected':''}>Mittel</option><option value="large" ${sizeLabel(p,s,w)==='large'?'selected':''}>Groß</option>`;
    const motifDownload=motifSrc?`<a class="v2863-download-btn" href="${motifSrc}" download>Motivdatei herunterladen</a>`:'';
    const productionDownload=productionHref?`<a class="v2863-download-btn secondary" href="${productionHref}" target="_blank" rel="noopener">Produktionsdatei öffnen</a>`:'';
    const fmtSizeMm=(w,h)=>{
      const toMm=v=>{
        const n=Number(v?.value??v??0);
        if(!Number.isFinite(n) || n<=0) return '';
        return String(Math.round(n * 10)).replace('.',',');
      };
      const wn=toMm(w);
      const hn=toMm(h);
      return wn&&hn?`${wn} × ${hn} mm`:'–';
    };
    const sizeInfo=`<div class="v2864-size-info"><span><b>Vorne</b> ${fmtSizeMm(printDataFields.front.width,printDataFields.front.height)}</span><span><b>Hinten</b> ${fmtSizeMm(printDataFields.back.width,printDataFields.back.height)}</span></div>`;
    const sharedMotif=`<div class="v2862-shared-motif v2863-shared-motif"><div class="v2863-motif-meta"><strong>Gemeinsames Motiv</strong><span>Dieses Motiv wird auf T-Shirt, Polo-Shirt und Hoodie verwendet.</span><div class="v2863-downloads">${motifDownload}${sizeInfo}${productionDownload}</div></div><span class="v2861-motif-preview v2863-shirt-bg" style="--shirt-preview-bg:${shirtHex}" title="${motifName}">${motifSrc?`<img src="${motifSrc}" alt="${motifName}">`:'–'}</span></div>`;
    const sizeBadge=(productKey,side)=>{
      const dims=side==='front'
        ? fmtSizeMm(printDataFields.front.width,printDataFields.front.height)
        : fmtSizeMm(printDataFields.back.width,printDataFields.back.height);
      return `<span class="v2917-size-badge v2921-inline-size" aria-label="Druckgröße ${side==='front'?'Vorderseite':'Rückseite'}">${dims}</span>`;
    };
    table.innerHTML=sharedMotif+'<div class="v2862-product-groups">'+products.map(item=>`<section class="v2862-product-group ${item.tone}" data-product="${item.key}"><div class="v2862-product-head"><strong>${item.name}</strong><span>Vorder- & Rückseite</span></div><div class="v2862-side-row"><span>Vorderseite</span><select class="v2856-size-select" data-product="${item.key}" data-side="front">${optionHtml(item.key,'front',item.front)}</select>${sizeBadge(item.key,'front')}<button type="button" class="v284-edit-print v2856-position-btn" data-product="${item.key}" data-side="front">Positionieren</button></div><div class="v2862-side-row"><span>Rückseite</span><select class="v2856-size-select" data-product="${item.key}" data-side="back">${optionHtml(item.key,'back',item.back)}</select>${sizeBadge(item.key,'back')}<button type="button" class="v284-edit-print v2856-position-btn" data-product="${item.key}" data-side="back">Positionieren</button></div></section>`).join('')+'</div>';
    table.querySelectorAll('.v2856-size-select').forEach(sel=>sel.addEventListener('change',()=>{
      const item=products.find(x=>x.key===sel.dataset.product);
      if(!item) return;
      const field=sel.dataset.side==='front'?item.front:item.back;
      field.value=String(sizeValue(sel.dataset.product,sel.dataset.side,sel.value));
      if(product?.value===sel.dataset.product&&side?.value===sel.dataset.side) refreshPositionEditor();
      setShopState('Motivgröße geändert – bitte speichern.');
    }));
    table.querySelectorAll('.v2856-position-btn').forEach(btn=>btn.addEventListener('click',()=>{
      if(product){ product.value=btn.dataset.product; product.dispatchEvent(new Event('change',{bubbles:true})); }
      if(side){ side.value=btn.dataset.side; side.dispatchEvent(new Event('change',{bubbles:true})); }
      refreshPositionEditor();
      document.querySelector('.v2853-preview-shell')?.scrollIntoView({behavior:'smooth',block:'center'});
    }));
  }
  window.updateV2856PrintTable=renderMergedPrintTable;
  renderMergedPrintTable();
  if(shopFields.fixedMotifHex && !shopFields.fixedMotifHex.dataset.v2861Bound){
    shopFields.fixedMotifHex.dataset.v2861Bound='1';
    shopFields.fixedMotifHex.addEventListener('input',renderMergedPrintTable);
    shopFields.fixedMotifHex.addEventListener('change',renderMergedPrintTable);
  }
  if(shopFields.fixedShirtHex && !shopFields.fixedShirtHex.dataset.v2863Bound){
    shopFields.fixedShirtHex.dataset.v2863Bound='1';
    shopFields.fixedShirtHex.addEventListener('input',renderMergedPrintTable);
    shopFields.fixedShirtHex.addEventListener('change',renderMergedPrintTable);
  }
  if(productionFileUrl && !productionFileUrl.dataset.v2863Bound){
    productionFileUrl.dataset.v2863Bound='1';
    productionFileUrl.addEventListener('input',renderMergedPrintTable);
    productionFileUrl.addEventListener('change',renderMergedPrintTable);
  }
  [printDataFields.front.width,printDataFields.front.height,printDataFields.back.width,printDataFields.back.height].forEach(el=>{
    if(el && !el.dataset.v2864Bound){
      el.dataset.v2864Bound='1';
      el.addEventListener('input',renderMergedPrintTable);
      el.addEventListener('change',renderMergedPrintTable);
    }
  });

  const modelInput=document.getElementById('v2853Model');
  const previewTitle=document.getElementById('v2853PreviewTitle');
  const colorName=document.getElementById('v2853ColorName');
  const colorDot=colorCard.card.querySelector('.v2853-color-readonly i');

  function refreshReferenceMeta(){
    const map={
      tshirt:'F140 · T-Shirt',
      polo:'F502 · Polo-Shirt',
      hoodie:'F421 · Hoodie'
    };
    if(modelInput) modelInput.value=map[product?.value]||'Textil';
    if(previewTitle) previewTitle.textContent=`Vorschau – ${side?.value==='back'?'Rückseite':'Vorderseite'}`;
    if(colorName) colorName.textContent=document.getElementById('fixedShirtName')?.value || 'Royal Blue';
    if(colorDot) colorDot.style.background=document.getElementById('fixedShirtHex')?.value || '#0758b2';
  }
  product?.addEventListener('change',refreshReferenceMeta);
  side?.addEventListener('change',refreshReferenceMeta);
  document.getElementById('fixedShirtName')?.addEventListener('input',refreshReferenceMeta);
  document.getElementById('fixedShirtHex')?.addEventListener('input',refreshReferenceMeta);
  refreshReferenceMeta();

  // Sidebar wieder dunkel wie im Zielbild.
  document.getElementById('v284Sidebar')?.classList.add('v2853-dark-sidebar');

  // Versionsbadge eindeutig aktualisieren.
  document.querySelectorAll('.v2849-version').forEach(el=>el.textContent='v29.6.4');
})();


// v29.5.3 – mobile Filter klarer + aktive Filter sichtbar
document.addEventListener("DOMContentLoaded",()=>{
  const btn=document.getElementById("mobileFilterToggle");
  const filters=document.querySelector("#ordersTab .filters");
  const statusSel=document.getElementById("statusFilter");
  const customerSel=document.getElementById("customerFilter");
  const search=document.getElementById("searchInput");
  if(!btn||!filters)return;
  const activeCount=()=>{
    let n=0;
    if(statusSel && statusSel.value!=="Alle")n++;
    if(customerSel && customerSel.value!=="Alle")n++;
    if(search && String(search.value||"").trim())n++;
    return n;
  };
  const refreshState=()=>{
    const n=activeCount();
    btn.classList.toggle("is-filtered",n>0);
    const open=filters.classList.contains("v2950-open");
    btn.textContent=open ? (n?`Filter schließen · ${n}`:"Filter schließen") : (n?`Filter · ${n} aktiv`:"Filter");
    if(statusSel)statusSel.classList.toggle("v2953-filtered",statusSel.value!=="Alle");
    if(customerSel)customerSel.classList.toggle("v2953-filtered",customerSel.value!=="Alle");
    if(search)search.classList.toggle("v2953-filtered",!!String(search.value||"").trim());
  };
  const close=()=>{filters.classList.remove("v2950-open");btn.setAttribute("aria-expanded","false");refreshState();};
  close();
  btn.addEventListener("click",()=>{
    const open=!filters.classList.contains("v2950-open");
    filters.classList.toggle("v2950-open",open);
    btn.setAttribute("aria-expanded",String(open));
    refreshState();
  });
  [statusSel,customerSel].filter(Boolean).forEach(el=>el.addEventListener("change",refreshState));
  if(search)search.addEventListener("input",refreshState);
  refreshState();
});
