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
const customerFilter = null;
const customerChips = document.getElementById("customerChips"); // legacy, may be absent
const buyerFilter = document.getElementById("buyerFilter");
let loadedOrders = [];

const STATUSES = ["Neu", "In Bearbeitung", "Fertig", "Abgeholt"];

function euro(value){return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(value)||0)}
function dateText(ts){if(!ts||!ts.toDate)return "Datum wird geladen";return ts.toDate().toLocaleString("de-DE",{dateStyle:"medium",timeStyle:"short"})}
function dateOnlyText(ts){if(!ts||!ts.toDate)return "Datum wird geladen";return ts.toDate().toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"})}
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
    renderProductionDashboard();
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
    ...(Array.isArray(o.items) ? o.items.flatMap(item => [item.size,item.shirtColor,item.motif,item.motifColor,item.initials]) : [])
  ].filter(Boolean).join(" ").toLowerCase();
}

function refreshCustomerFilter(){
  refreshBuyerFilter();
}

function refreshBuyerFilter(){
  if(!buyerFilter) return;
  const previous=buyerFilter.value||"Alle";
  const buyers=new Map();
  loadedOrders.forEach(({order})=>{
    const name=String(order.name||"").trim();
    if(!name) return;
    const key=name.toLocaleLowerCase("de");
    if(!buyers.has(key)) buyers.set(key,name);
  });
  buyerFilter.replaceChildren();
  const all=document.createElement("option"); all.value="Alle"; all.textContent="Alle Kunden"; buyerFilter.appendChild(all);
  [...buyers.entries()].sort((a,b)=>a[1].localeCompare(b[1],"de")).forEach(([key,name])=>{
    const o=document.createElement("option"); o.value=key; o.textContent=name; buyerFilter.appendChild(o);
  });
  buyerFilter.value=[...buyerFilter.options].some(o=>o.value===previous)?previous:"Alle";
  if(customerChips) renderCustomerChips(buyers);
}

function renderCustomerChips(buyers){
  if(!customerChips || !buyerFilter) return;
  customerChips.replaceChildren();
  const entries=[["Alle","Alle"], ...[...buyers.entries()].sort((a,b)=>a[1].localeCompare(b[1],"de"))];
  entries.forEach(([id,name])=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="customer-chip";
    button.dataset.customerId=id;
    button.textContent=name;
    button.classList.toggle("active", buyerFilter.value===id);
    button.addEventListener("click",()=>{
      buyerFilter.value=id;
      customerChips.querySelectorAll(".customer-chip").forEach(chip=>chip.classList.toggle("active",chip.dataset.customerId===id));
      applyFilters();
    });
    customerChips.appendChild(button);
  });
}

function applyFilters(){
  const query = (searchInput.value || "").trim().toLowerCase();
  const selectedStatus = statusFilter.value || "Alle";
  const selectedBuyer = buyerFilter ? (buyerFilter.value || "Alle") : "Alle";
  const filtered = loadedOrders.filter(entry => {
    const status = entry.order.status || "Neu";
    const statusMatch = selectedStatus === "Alle" || status === selectedStatus;
    const buyerKey = String(entry.order.name||"").trim().toLocaleLowerCase("de");
    const buyerMatch = selectedBuyer === "Alle" || buyerKey === selectedBuyer;
    const searchMatch = !query || searchableText(entry).includes(query);
    return statusMatch && buyerMatch && searchMatch;
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

function normalizeOrderPrintMethod(value){
  const method=String(value||"").trim();
  if(/dtf/i.test(method)) return "DTF";
  if(/flex|transfer/i.test(method)) return "Flexdruck";
  return "";
}

function fallbackItemPrintMethod(order,item){
  const printData=order.printData||{};
  const product=item.productId||"tshirt";
  const methods=["front","back"]
    .map(side=>printData?.[product]?.[side]?.method||printData?.global?.[side]?.method||"")
    .filter(Boolean);
  return methods.some(method=>/dtf/i.test(method))?"DTF":"Flexdruck";
}

function orderMotifLabel(order,item){
  const raw=text(item?.motifName||item?.motif||item?.designName,"Motiv");
  return String(order?.customerId||"").toLowerCase()==="hansa" && /^script$/i.test(raw.trim()) ? "Allstar" : raw;
}

async function saveItemPrintMethod(id,order,index,value){
  const items=(Array.isArray(order.items)?order.items:[]).map((item,itemIndex)=>
    itemIndex===index?{...item,productionMethod:normalizeOrderPrintMethod(value)||"Flexdruck"}:{...item}
  );
  await db.collection("orders").doc(id).update({
    items,
    productionUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  order.items=items;
  renderProductionDashboard();
}

function printOrderSlip(order){
  const customerId = order.customerId || "_template";
  const customerName = order.customerName || customerId || "Shirtprojekt";
  const currentShopConfig = shopConfigs.get(customerId) || {};
  const showPrices = order.showPrices !== undefined ? order.showPrices !== false : currentShopConfig.features?.showPrices !== false;
  const showNexaroBranding = order.showNexaroBranding !== undefined ? order.showNexaroBranding !== false : currentShopConfig.features?.showNexaroBranding !== false;
  const logoUrl = `${location.origin}/nexaro-logo-compact-v2.jpg?v=30.3.19`;
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items.map((item,index)=>{
    const qty = Number(item.quantity)||1;
    const unit = Number(item.unitPrice)||Number(order.unitPrice)||15;
    const linePrice = Number(item.linePrice)||qty*unit;
    const product = item.productName || (item.productId==="polo"?"Polo-Shirt":item.productId==="hoodie"?"Hoodie":"T-Shirt");
    const printMethod = normalizeOrderPrintMethod(item.productionMethod) || fallbackItemPrintMethod(order,item);
    const printAction = printMethod === "DTF" ? "DTF bestellen" : "Transfer selbst drucken";
    return `<tr>
      <td>${index+1}</td>
      <td><b>${htmlEscape(product)}</b><span>Motiv: ${htmlEscape(orderMotifLabel(order,item))}${item.initials?` · Initialen: ${htmlEscape(item.initials)}`:""}</span></td>
      <td>${htmlEscape(item.shirtColor||"-")}</td>
      <td>${htmlEscape(item.size||"-")}</td>
      <td>${htmlEscape(item.motifColor||"-")}</td>
      <td>${htmlEscape(printAction)}</td>
      <td class="num">${qty}</td>
      ${showPrices?`<td class="num">${htmlEscape(euro(linePrice))}</td>`:""}
    </tr>`;
  }).join("");

  const w = window.open("", "_blank", "width=920,height=900");
  if(!w){ alert("Bitte Pop-ups für den Bestellschein erlauben."); return; }

  w.document.write(`<!doctype html><html lang="de"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bestellschein ${htmlEscape(order.orderNumber||"")}</title>
  <style>
    @page{size:A4;margin:8mm}
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:#f4f6f8;color:#17212b;font-family:Arial,Helvetica,sans-serif}
    .sheet{width:194mm;max-width:calc(100% - 14px);margin:8px auto;background:#fff;border:1px solid #e2e7ea;border-radius:14px;padding:8mm 9mm}
    .head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-bottom:8px;border-bottom:1px solid #e4eaed}
    .brand{display:flex;flex-direction:column;align-items:center;width:165px}.brand img{display:block;width:165px;height:auto;object-fit:contain}
    .brand p{margin:4px 0 0;font-size:11px;line-height:1;font-weight:800;color:#3d4d56;text-transform:uppercase;letter-spacing:.13em;text-align:center}
    .head-shop{text-align:right;font-size:13px;font-weight:700;line-height:1.2}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}
    .card{border:1px solid #e1e7ea;border-radius:10px;overflow:hidden}
    .card h2{margin:0;padding:5px 7px;background:#f7f9fa;font-size:9px;line-height:1.05;text-transform:uppercase;letter-spacing:.025em;white-space:nowrap}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:0 7px;padding:3px 7px}
    .field{min-width:0;padding:3px 0;border-bottom:1px solid #eef1f3}.field.full{grid-column:1/-1}.field:nth-last-child(-n+2){border-bottom:0}
    .field span{display:block;font-size:7px;line-height:1.05;color:#87939b}.field strong{display:block;margin-top:1px;font-size:8.7px;line-height:1.12;overflow-wrap:anywhere;word-break:break-word}
    .meta{display:grid;grid-template-columns:1fr 1fr;padding:2px 4px}
    .meta .field{padding:3px 4px}.meta .field:nth-child(odd){border-right:1px solid #edf1f3}
    .meta .field span{font-size:6.7px}.meta .field strong{font-size:8.1px;line-height:1.1}
    .meta .field:nth-child(3) strong{font-size:7.3px;letter-spacing:-.02em}
    .items{margin-top:7px;border:1px solid #e1e7ea;border-radius:10px;overflow:hidden}
    table{width:100%;border-collapse:collapse;font-size:8.8px}
    th{padding:5px 6px;background:#f6f8f9;color:#596871;text-align:left;font-size:7.7px;text-transform:uppercase;letter-spacing:.025em}
    td{padding:6px;border-top:1px solid #edf1f3;vertical-align:middle}
    td b{display:block;font-size:9.2px}td span{display:block;margin-top:1px;color:#7c8991;font-size:7.8px}
    .num{text-align:right;white-space:nowrap}
    .total{display:flex;justify-content:flex-end;gap:22px;padding:7px 8px;border-top:1px solid #e4e9ec;font-size:10px;font-weight:800}
    .foot{display:flex;align-items:flex-end;justify-content:flex-end;margin-top:8px;padding-top:7px;border-top:1px solid #e8ecee}
    .sum{text-align:right}.sum span{display:block;font-size:8px;color:#839098}.sum strong{font-size:15px}
    .actions{width:194mm;max-width:calc(100% - 20px);margin:10px auto;display:flex;gap:8px}
    button{border:0;border-radius:8px;padding:10px 14px;font-weight:800;cursor:pointer}.print{background:#153946;color:#fff}.close{background:#e8edef;color:#34434b}
    @media print{
      html,body{background:#fff}
      .actions{display:none}
      .sheet{width:auto;max-width:none;margin:0;border:0;border-radius:0;padding:0}
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
  </style></head><body>
  <div class="sheet">
    <div class="head">
      <div class="brand">${showNexaroBranding?`<img src="${logoUrl}" alt="NEXARO SPORTS Logo">`:""}<p>Bestellschein</p></div>
      <strong class="head-shop">${htmlEscape(customerName)}</strong>
    </div>

    <div class="two">
      <section class="card">
        <h2>Kundendaten</h2>
        <div class="grid">
          <div class="field"><span>Vor- und Nachname</span><strong>${htmlEscape(order.name||"-")}</strong></div>
          <div class="field"><span>Verein / Firma</span><strong>${htmlEscape(order.customerClass||"-")}</strong></div>
          <div class="field"><span>E-Mail</span><strong>${htmlEscape(order.email||"-")}</strong></div>
          <div class="field"><span>WhatsApp</span><strong>${htmlEscape(order.whatsapp||order.phone||"-")}</strong></div>
          <div class="field full"><span>Adresse</span><strong>${htmlEscape(order.address||"-")}</strong></div>
        </div>
      </section>

      <section class="card">
        <h2>Bestellung & Zahlung</h2>
        <div class="meta">
          <div class="field"><span>Bestellart</span><strong>${htmlEscape(order.deliveryType||"Abholung")}</strong></div>
          <div class="field"><span>Zahlung</span><strong>${htmlEscape(order.paymentMethod||"Bar bei Abholung")}</strong></div>
          <div class="field"><span>Bestellnummer</span><strong>${htmlEscape(order.orderNumber||"-")}</strong></div>
          <div class="field"><span>Datum</span><strong>${htmlEscape(dateOnlyText(order.createdAt))}</strong></div>
        </div>
      </section>
    </div>

    <section class="items">
      <table>
        <thead><tr><th>#</th><th>Artikel / Motiv</th><th>Farbe</th><th>Größe</th><th>Druckfarbe</th><th>Verfahren</th><th class="num">Menge</th>${showPrices?'<th class="num">Gesamt</th>':""}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total"><span>${htmlEscape(order.totalQuantity||0)} Artikel</span>${showPrices?`<span>${htmlEscape(euro(order.totalPrice))}</span>`:""}</div>
    </section>

    ${showPrices?`<div class="foot">
      <div class="sum"><span>Gesamtbetrag</span><strong>${htmlEscape(euro(order.totalPrice))}</strong></div>
    </div>`:""}
  </div>
  <div class="actions"><button class="print" onclick="window.print()">Drucken / PDF</button><button class="close" onclick="window.close()">Schließen</button></div>
  </body></html>`);
  w.document.close();
}


function printProductionSlip(order){
  const customerId = order.customerId || "_template";
  const customerName = order.customerName || customerId || "Shirtprojekt";
  const logoUrl = `${location.origin}/nexaro-logo-compact-v2.jpg?v=30.3.19`;
  const items = Array.isArray(order.items) ? order.items : [];
  const printData = order.printData || {};
  const activePrintMethods=[];
  const itemPrintMethod=(item)=>{
    const manual=normalizeOrderPrintMethod(item.productionMethod);
    if(manual) return manual;
    const product=item.productId||"tshirt";
    const methods=["front","back"]
      .map(side=>printData?.[product]?.[side]?.method||printData?.global?.[side]?.method||"")
      .filter(Boolean);
    return methods.some(method=>/dtf/i.test(method))?"DTF":"Flexdruck";
  };

  const itemRows = items.map((item,index)=>{
    const qty=Number(item.quantity)||1;
    const product=item.productName || (item.productId==="polo"?"Polo-Shirt":item.productId==="hoodie"?"Hoodie":"T-Shirt");
    const method=itemPrintMethod(item);
    activePrintMethods.push(method);
    return `<tr>
      <td>${index+1}</td>
      <td><b>${htmlEscape(product)}</b><span>${htmlEscape(orderMotifLabel(order,item))}${item.initials?` · Initialen: ${htmlEscape(item.initials)}`:""}</span></td>
      <td>${htmlEscape(item.size||"-")}</td>
      <td>${htmlEscape(item.shirtColor||"-")}</td>
      <td>${htmlEscape(item.motifColor||"-")}</td>
      <td>${htmlEscape(method)}</td>
      <td class="num">${qty}</td>
      <td class="check">□</td>
    </tr>`;
  }).join("");

  const usedProducts = new Set(items.map(item=>item.productId||"tshirt"));
  const specRows=[];
  const addSpec=(product,label,side,sideLabel)=>{
    if(!usedProducts.has(product)) return;
    const d=printData?.[product]?.[side]||printData?.global?.[side]||{};
    const has=Object.values(d).some(v=>v!==null&&v!==undefined&&String(v).trim()!=="");
    if(!has) return;
    if(d.method && !items.length) activePrintMethods.push(String(d.method).trim());
    const productMethods=[...new Set(items.filter(item=>(item.productId||"tshirt")===product).map(itemPrintMethod))];
    const methodLabel=productMethods.length>1?"Gemischt":(productMethods[0]||d.method||"-");
    const format=[d.widthCm,d.heightCm].every(v=>v!==null&&v!==undefined&&v!=="")?`${d.widthCm} × ${d.heightCm} cm`:"–";
    specRows.push(`<tr><td>${htmlEscape(label)}</td><td>${htmlEscape(sideLabel)}</td><td>${htmlEscape(methodLabel)}</td><td>${htmlEscape(format)}</td><td class="check">□</td></tr>`);
  };
  addSpec("tshirt","T-Shirt","front","Vorne");
  addSpec("tshirt","T-Shirt","back","Hinten");
  addSpec("polo","Polo-Shirt","front","Vorne");
  addSpec("polo","Polo-Shirt","back","Hinten");
  addSpec("hoodie","Hoodie","front","Vorne");
  addSpec("hoodie","Hoodie","back","Hinten");

  const finalLabel=/versand/i.test(order.deliveryType||order.orderType||"")?"Versand":"Abholung";
  const hasDtf=activePrintMethods.some(method=>/dtf/i.test(method));
  const hasFlex=activePrintMethods.some(method=>/flex|transfer/i.test(method));
  const productionMethodLabel=hasDtf&&hasFlex?"Transfer + DTF":hasDtf?"DTF":"Transfer";
  const specs=specRows.length
    ? `<section class="block"><div class="block-head">Druckdaten</div><table><thead><tr><th>Textil</th><th>Seite</th><th>Verfahren</th><th>Druckmaß</th><th>OK</th></tr></thead><tbody>${specRows.join("")}</tbody></table></section>`
    : `<section class="warning">Noch keine Produktionsdaten hinterlegt.</section>`;

  const w=window.open("","_blank","width=1000,height=900");
  if(!w){alert("Bitte Pop-ups für den Produktionsschein erlauben.");return;}

  w.document.write(`<!doctype html><html lang="de"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Produktionsschein ${htmlEscape(order.orderNumber||"")}</title>
  <style>
    @page{size:A4;margin:8mm}
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:#f4f6f8;color:#17212b;font-family:Arial,Helvetica,sans-serif}
    .sheet{width:194mm;max-width:calc(100% - 20px);margin:12px auto;background:#fff;border:1px solid #e2e7ea;border-radius:14px;padding:9mm 10mm}
    .head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-bottom:8px;border-bottom:1px solid #e4eaed}
    .brand{display:flex;flex-direction:column;align-items:center;width:165px}.brand img{display:block;width:165px;height:auto;object-fit:contain}
    .brand p{margin:4px 0 0;font-size:11px;line-height:1;font-weight:800;color:#3d4d56;text-transform:uppercase;letter-spacing:.13em;text-align:center}
    .meta{text-align:right}.meta strong{display:block;font-size:13px}.meta span{display:block;margin-top:2px;font-size:8px;color:#829098}.meta .shop-name{margin-top:4px}
    .info{display:grid;grid-template-columns:1.2fr 1.2fr .7fr .8fr;gap:6px;margin-top:8px}
    .box{border:1px solid #e1e7ea;border-radius:8px;padding:5px 7px}.box span{display:block;font-size:7.2px;color:#87939b}.box strong{display:block;margin-top:1px;font-size:9.5px}
    .flow{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:8px}
    .step{border-radius:999px;padding:6px 8px;text-align:center;font-size:8px;font-weight:800;border:1px solid}
    .s1{background:#fff3c4;border-color:#f0d278;color:#806000}.s2{background:#dcecff;border-color:#afd0f5;color:#2467aa}.s3{background:#def3e5;border-color:#afddbd;color:#287245}.s4{background:#ffe1e1;border-color:#efb3b3;color:#a43b3b}
    .block{margin-top:8px;border:1px solid #e1e7ea;border-radius:9px;overflow:hidden}.block-head{padding:5px 7px;background:#f6f8f9;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
    table{width:100%;border-collapse:collapse;font-size:8.4px}th{padding:5px 6px;background:#fafbfc;color:#63727b;text-align:left;font-size:7.3px;text-transform:uppercase}td{padding:5px 6px;border-top:1px solid #edf1f3;vertical-align:middle}
    td b{display:block;font-size:8.8px}td span{display:block;margin-top:1px;color:#7c8991;font-size:7.4px}.num{text-align:right}.check{text-align:center;font-size:14px;width:27px}
    .checklist{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:6px}.task{border:1px solid #dfe5e8;border-radius:7px;padding:7px;font-size:8px}.task b{font-size:12px;margin-right:4px}
    .notes{min-height:82px;margin:6px;padding:8px 10px;border:1px solid #dfe5e8;border-radius:7px;background:#fff}
    .notes span{display:block;font-size:8px;font-weight:700;color:#89959d;letter-spacing:.03em}
    .warning{margin-top:8px;padding:8px;border:1px solid #e7d184;background:#fff9dc;border-radius:8px;font-size:8.5px}
    .footer{display:flex;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px solid #e7ecee;font-size:7.8px;color:#7c8991}
    .actions{width:194mm;max-width:calc(100% - 20px);margin:10px auto;display:flex;gap:8px}
    button{border:0;border-radius:8px;padding:10px 14px;font-weight:800;cursor:pointer}.print{background:#153946;color:#fff}.close{background:#e8edef;color:#34434b}
    @media print{
      html,body{background:#fff}.actions{display:none}.sheet{width:auto;max-width:none;margin:0;border:0;border-radius:0;padding:0}
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
  </style></head><body>
  <div class="sheet">
    <div class="head">
      <div class="brand"><img src="${logoUrl}" alt="NEXARO SPORTS Logo"><p>Produktionsschein</p></div>
      <div class="meta"><strong>${htmlEscape(order.orderNumber||"-")}</strong><span>${htmlEscape(dateText(order.createdAt))}</span><strong class="shop-name">${htmlEscape(customerName)}</strong></div>
    </div>

    <div class="info">
      <div class="box"><span>Kunde</span><strong>${htmlEscape(order.name||"-")}</strong></div>
      <div class="box"><span>Verein / Firma</span><strong>${htmlEscape(order.customerClass||"-")}</strong></div>
      <div class="box"><span>Gesamt</span><strong>${htmlEscape(order.totalQuantity||0)} Artikel</strong></div>
      <div class="box"><span>Bestellart</span><strong>${htmlEscape(order.deliveryType||"Abholung")}</strong></div>
    </div>

    <div class="flow">
      <div class="step s1">□ Bestellt</div>
      <div class="step s2">□ ${htmlEscape(productionMethodLabel)}</div>
      <div class="step s3">□ Abgeschlossen</div>
      <div class="step s4">□ ${htmlEscape(finalLabel)}</div>
    </div>

    <section class="block">
      <div class="block-head">Artikel</div>
      <table><thead><tr><th>#</th><th>Textil / Motiv</th><th>Größe</th><th>Farbe</th><th>Druckfarbe</th><th>Verfahren</th><th class="num">Menge</th><th>OK</th></tr></thead><tbody>${itemRows}</tbody></table>
    </section>

    ${specs}

    <section class="block">
      <div class="block-head">Produktionskontrolle</div>
      <div class="checklist">
        <div class="task"><b>□</b>Textilien gezählt</div>
        <div class="task"><b>□</b>Transfer geprüft</div>
        <div class="task"><b>□</b>Position / Druckmaß</div>
        <div class="task"><b>□</b>Qualität geprüft</div>
      </div>
      <div class="notes"><span>Bemerkungen</span></div>
    </section>

    <div class="footer"><span>NEXARO SPORTS · Produktion</span><span>${htmlEscape(order.orderNumber||"")}</span></div>
  </div>
  <div class="actions"><button class="print" onclick="window.print()">Drucken / PDF</button><button class="close" onclick="window.close()">Schließen</button></div>
  </body></html>`);
  w.document.close();
}

const PRODUCTION_STEPS = ["Bestellt","Transfer","Abgeschlossen"];
function deliveryLabel(order){
  return text(order.deliveryType || order.orderType || "Abholung","Abholung");
}
function productionFinalStatus(order){
  return /versand/i.test(deliveryLabel(order)) ? "Versandt" : "Abgeholt";
}
function productionStatus(order){
  const raw = String(order.productionStatus || "").trim();
  const finalStatus = productionFinalStatus(order);
  if(raw==="Abgeholt" || raw==="Versandt") return finalStatus;
  if(raw==="Fertig" || raw==="Bereit zum Pressen" || raw==="Abgeschlossen") return "Abgeschlossen";
  if(raw==="Transfer bestellt" || raw==="Transfer") return "Transfer";
  if(raw==="Textil bestellt" || raw==="Bestellt") return "Bestellt";
  if(raw==="Offen") return "Bestellt";
  const s = String(order.status || "Neu");
  if(s==="Abgeholt" || s==="Versandt") return finalStatus;
  if(s==="Fertig") return "Abgeschlossen";
  return "Bestellt";
}
function productionOptions(order){
  return [...PRODUCTION_STEPS, productionFinalStatus(order)];
}
async function saveProductionStatus(id, order, value){
  const patch={
    productionStatus:value,
    productionUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
  };
  if(value==="Abgeschlossen") patch.status="Fertig";
  else if(value==="Abgeholt") patch.status="Abgeholt";
  else if(value==="Versandt") patch.status="Versandt";
  else if(["Bestellt","Transfer"].includes(value) && (!order.status || order.status==="Neu")) {
    patch.status="In Bearbeitung";
  }
  await db.collection("orders").doc(id).update(patch);
  order.productionStatus=value;
  if(patch.status) order.status=patch.status;
  renderProductionDashboard();
}

function renderOrder(id,order){
  const card=document.createElement("article");card.className="order-card v2966-order-card collapsed";

  const summary=document.createElement("button");
  summary.type="button";
  summary.className="v2966-order-summary";
  summary.setAttribute("aria-expanded","false");

  const main=document.createElement("div");main.className="v2966-order-main v2967-order-main";
  const headline=document.createElement("div");headline.className="v2967-order-headline";
  const summaryDate=document.createElement("span");summaryDate.className="v2967-order-date";summaryDate.textContent=dateOnlyText(order.createdAt);
  const shop=document.createElement("strong");shop.className="v2967-order-shop";shop.textContent=text(order.customerName||order.customerId,"Unbekannter Shop");
  const buyer=document.createElement("strong");buyer.className="v2967-order-buyer";buyer.textContent=text(order.name,"Unbekannter Besteller");
  headline.append(summaryDate,shop,buyer);
  main.append(headline);

  const stageWrap=document.createElement("div");
  stageWrap.className="v30150-stage-wrap";
  const currentStage=productionStatus(order);
  const finalStage=productionFinalStatus(order);
  const stageValues=[
    {value:"Bestellt",label:"Bestellt"},
    {value:"Transfer",label:"Transfer"},
    {value:"Abgeschlossen",label:"Abgeschlossen"},
    {value:finalStage,label:finalStage==="Versandt"?"Versand":"Abholung"}
  ];
  const currentIndex=Math.max(0,stageValues.findIndex(s=>s.value===currentStage));
  stageValues.forEach((stage,index)=>{
    const step=document.createElement("button");
    step.type="button";
    step.className=`v30150-stage v30150-stage-${index+1}`;
    step.dataset.value=stage.value;
    step.textContent=stage.label;
    step.classList.toggle("done",index<=currentIndex);
    step.classList.toggle("current",index===currentIndex);
    step.setAttribute("aria-label",`Produktionsstatus ${stage.label}`);
    step.addEventListener("click",async e=>{
      e.preventDefault();
      e.stopPropagation();
      if(step.disabled || productionStatus(order)===stage.value) return;
      stageWrap.querySelectorAll("button").forEach(b=>b.disabled=true);
      try{
        await saveProductionStatus(id,order,stage.value);
        const newIndex=stageValues.findIndex(s=>s.value===stage.value);
        stageWrap.querySelectorAll(".v30150-stage").forEach((b,i)=>{
          b.classList.toggle("done",i<=newIndex);
          b.classList.toggle("current",i===newIndex);
          b.disabled=false;
        });
      }catch(err){
        console.error(err);
        alert("Produktionsstatus konnte nicht gespeichert werden.");
        stageWrap.querySelectorAll("button").forEach(b=>b.disabled=false);
      }
    });
    stageWrap.appendChild(step);
  });

  const quick=document.createElement("div");quick.className="v2966-order-quick";
  const qty=document.createElement("span");qty.textContent=`${text(order.totalQuantity,"0")} Artikel`;
  const total=document.createElement("strong");total.textContent=euro(order.totalPrice);
  const arrow=document.createElement("span");arrow.className="v2966-order-arrow";arrow.textContent="⌄";
  quick.append(qty,total,arrow);
  summary.append(main,stageWrap,quick);
  card.appendChild(summary);

  const body=document.createElement("div");body.className="v2966-order-body";
  const top=document.createElement("div");top.className="order-top";
  const title=document.createElement("div");
  const number=document.createElement("div");number.className="order-number";number.textContent=text(order.orderNumber,id);
  const customerTag=document.createElement("div");customerTag.className="order-customer";customerTag.textContent=text(order.customerName||order.customerId,"Unbekannter Kunde");
  const date=document.createElement("div");date.className="order-date";date.textContent=dateText(order.createdAt);
  title.append(number,customerTag,date);

  const actions=document.createElement("div");actions.className="order-actions";

  const printBtn=document.createElement("button");printBtn.type="button";printBtn.className="ghost-btn print-order-btn";printBtn.textContent="Bestellschein";printBtn.addEventListener("click",e=>{e.stopPropagation();printOrderSlip(order)});
  const productionBtn=document.createElement("button");productionBtn.type="button";productionBtn.className="ghost-btn production-order-btn";productionBtn.textContent="Produktion";productionBtn.addEventListener("click",e=>{e.stopPropagation();printProductionSlip(order)});
  actions.append(printBtn,productionBtn);
  top.append(title,actions);body.appendChild(top);

  const customer=document.createElement("div");customer.className="customer-grid";
  [["Vor- und Nachname",order.name],["Verein / Firma",order.customerClass],["E-Mail",order.email],["WhatsApp",order.whatsapp||order.phone],["Adresse",order.address],["Bestellart",order.deliveryType||"Abholung"],["Zahlung",order.paymentMethod||"Bar bei Abholung"]].forEach(([label,value])=>{const box=document.createElement("div");const l=document.createElement("span");l.textContent=label;const v=document.createElement("strong");v.textContent=text(value);box.append(l,v);customer.appendChild(box)});
  body.appendChild(customer);

  const items=document.createElement("div");items.className="items";
  (Array.isArray(order.items)?order.items:[]).forEach((item,index)=>{
    const row=document.createElement("div");row.className="item-row v2971-item-row";
    const info=document.createElement("div");info.className="v2971-item-info";
    const main=document.createElement("strong");main.textContent=`${index+1}. ${text(item.quantity,"1")}× ${productLabel(item)} · ${text(item.size)} · ${text(item.shirtColor)} · ${orderMotifLabel(order,item)} · Motivfarbe: ${text(item.motifColor)}${item.initials?` · Initialen: ${text(item.initials)}`:""}`;
    const methodControl=document.createElement("label");methodControl.className="v30169-method-control";
    const methodLabel=document.createElement("span");methodLabel.textContent="Verfahren";
    const methodSelect=document.createElement("select");methodSelect.className="v30169-method-select";methodSelect.setAttribute("aria-label",`Druckverfahren für Artikel ${index+1}`);
    ["Flexdruck","DTF"].forEach(value=>{
      const option=document.createElement("option");option.value=value;option.textContent=value;methodSelect.appendChild(option);
    });
    methodSelect.value=normalizeOrderPrintMethod(item.productionMethod)||fallbackItemPrintMethod(order,item);
    methodSelect.addEventListener("change",async()=>{
      methodSelect.disabled=true;
      try{
        await saveItemPrintMethod(id,order,index,methodSelect.value);
        item.productionMethod=methodSelect.value;
      }catch(err){
        console.error(err);
        alert("Druckverfahren konnte nicht gespeichert werden.");
        methodSelect.value=normalizeOrderPrintMethod(item.productionMethod)||fallbackItemPrintMethod(order,item);
      }finally{
        methodSelect.disabled=false;
      }
    });
    methodControl.append(methodLabel,methodSelect);
    const amount=document.createElement("strong");amount.className="v2971-item-amount";amount.textContent=euro(item.linePrice ?? ((Number(item.quantity)||1)*(Number(order.unitPrice)||15)));
    info.appendChild(main);row.append(info,methodControl,amount);items.appendChild(row);
  });
  body.appendChild(items);
  const footer=document.createElement("div");footer.className="order-footer";footer.innerHTML=`<span>${text(order.totalQuantity,"0")} Artikel</span><span>${euro(order.totalPrice)}</span>`;body.appendChild(footer);
  card.appendChild(body);

  summary.addEventListener("click",()=>{
    const isOpen=card.classList.toggle("open");
    card.classList.toggle("collapsed",!isOpen);
    summary.setAttribute("aria-expanded",String(isOpen));
  });
  return card;
}


function productLabel(item){
  return text(item.productName || (item.productId==="polo"?"Polo-Shirt":item.productId==="hoodie"?"Hoodie":"T-Shirt"),"T-Shirt");
}
function renderProductionDashboard(){
  const root=document.getElementById("productionPanel");
  if(!root) return;

  const openEntries=loadedOrders.filter(({order})=>!["Abgeholt","Versandt"].includes(productionStatus(order)));
  const textileMap=new Map();
  const printMap=new Map();
  let totalItems=0;

  openEntries.forEach(({order})=>{
    (Array.isArray(order.items)?order.items:[]).forEach(item=>{
      const qty=Number(item.quantity)||1;
      totalItems+=qty;

      const product=productLabel(item);
      textileMap.set(product,(textileMap.get(product)||0)+qty);

      const motif=orderMotifLabel(order,item);
      printMap.set(motif,(printMap.get(motif)||0)+qty);
    });
  });

  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=String(val)};
  const textileRows=[...textileMap.entries()].sort((a,b)=>a[0].localeCompare(b[0],"de"));
  const printRows=[...printMap.entries()].sort((a,b)=>a[0].localeCompare(b[0],"de"));

  set("prodStatOrders",openEntries.length);
  set("prodStatItems",totalItems);
  set("prodStatVariants",textileRows.length);
  set("prodStatPrints",printRows.length);

  const renderSimple=(host,rows)=>{
    if(!host)return;
    host.replaceChildren();
    if(!rows.length){host.innerHTML='<p class="production-empty">Aktuell kein Bedarf.</p>';return;}
    rows.forEach(([name,qty])=>{
      const el=document.createElement("div");
      el.className="production-row v30147-production-row";
      el.innerHTML=`<span>${htmlEscape(name)}</span><b>${qty}×</b>`;
      host.appendChild(el);
    });
  };

  renderSimple(document.getElementById("productionTextiles"),textileRows);
  renderSimple(document.getElementById("productionPrints"),printRows);

  const textileTotal=textileRows.reduce((s,r)=>s+Number(r[1]||0),0);
  const printTotal=printRows.reduce((s,r)=>s+Number(r[1]||0),0);
  set("prodNeedsSummary",`${textileTotal} Artikel · ${printTotal} Drucke`);
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
if(buyerFilter)buyerFilter.addEventListener("change",applyFilters);

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
const productionPanel = document.getElementById("productionPanel");
const shopList = document.getElementById("shopList");
const shopForm = document.getElementById("shopForm");
const shopEditorTitle = document.getElementById("shopEditorTitle");
const shopSaveState = document.getElementById("shopSaveState");
const saveShopBtn = document.getElementById("saveShopBtn");
const newShopBtn = document.getElementById("newShopBtn");
const previewShopBtn = document.getElementById("previewShopBtn");
const motifsEditor = document.getElementById("motifsEditor");
const addMotifBtn = document.getElementById("addMotifBtn");
const addTusPatchBtn = document.getElementById("addTusPatchBtn");
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
let workingProductMotifModes = {};
let workingProductPrint = {};
let workingProducts = [];
let workingLogo = "";
let shopAdminInitialized = false;

const PRODUCT_COLOR_CATALOG = [
  ["white","White"],["black","Black"],["azure-blue","Azure Blue"],["bottle-green","Bottle Green"],
  ["brick-red","Brick Red"],["burgundy","Burgundy"],["chocolate","Chocolate"],["classic-olive","Classic Olive"],
  ["dark-grey-heather","Dark Grey Heather"],["deep-navy","Deep Navy"],["fuchsia","Fuchsia"],["heather-burgundy","Heather Burgundy"],
  ["heather-grey","Heather Grey"],["heather-purple","Heather Purple"],["kelly-green","Kelly Green"],["khaki","Khaki"],
  ["light-graphite","Light Graphite (Solid)"],["light-pink","Light Pink"],["lime","Lime"],["natural","Natural"],
  ["navy","Navy"],["orange","Orange"],["purple","Purple"],["red","Red"],["retro-heather-green","Retro Heather Green"],
  ["retro-heather-royal","Retro Heather Royal"],["royal-blue","Royal Blue"],["sky-blue","Sky Blue"],["sunflower","Sunflower"],
  ["vintage-heather-navy","Vintage Heather Navy"],["vintage-heather-red","Vintage Heather Red"],["yellow","Yellow"]
];
const PRODUCT_SIZES = ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"];
let currentVariantProductId = "";
function hansaSweatshirtProduct(){
  const extended=["XS","S","M","L","XL","2XL","3XL","4XL","5XL"];
  return {id:"bcwu01w",name:"Sweatshirt",articleNo:"BCWU01W",price:23,printCost:1.50,frontTemplate:"/sweatshirt-front-template.png",backTemplate:"/sweatshirt-back-template.png",enabled:true,allowedShirtColorIds:["white","black","navy","red","royal-blue","bottle-green","heather-grey"],defaultShirtColorId:"black",shirtColorLabels:{white:"White",black:"Black Pure",navy:"Navy Blue",red:"Red","royal-blue":"Royal","bottle-green":"Forest Green","heather-grey":"Heather Grey"},sizesByColor:{white:[...extended],black:[...extended],navy:[...extended],red:[...extended],"royal-blue":[...extended],"heather-grey":[...extended],"bottle-green":["XS","S","M","L","XL","2XL","3XL"]}};
}

const shopFields = {
  id: document.getElementById("shopId"), type: document.getElementById("shopType"), name: document.getElementById("shopName"),
  price: document.getElementById("shopPrice"), prefix: document.getElementById("shopPrefix"), email: document.getElementById("shopEmail"), active: document.getElementById("shopActive"),
  accent: document.getElementById("accentColor"), logoHeight: document.getElementById("logoHeight"), previewMode: document.getElementById("previewMode"), subtitle: document.getElementById("brandSubtitle"), heading: document.getElementById("designerHeading"), intro: document.getElementById("designerIntro"),
  fixedShirtName: document.getElementById("fixedShirtName"), fixedShirtHex: document.getElementById("fixedShirtHex"), fixedMotifName: document.getElementById("fixedMotifName"), fixedMotifHex: document.getElementById("fixedMotifHex"),
  productTshirtEnabled: document.getElementById("productTshirtEnabled"), productPoloEnabled: document.getElementById("productPoloEnabled"), productHoodieEnabled: document.getElementById("productHoodieEnabled"),
  showShirtColors: document.getElementById("showShirtColors"), showMotifs: document.getElementById("showMotifs"), showMotifColors: document.getElementById("showMotifColors"),
  showPrices: document.getElementById("showPrices"), showNexaroBranding: document.getElementById("showNexaroBranding"),
  allowUpload: document.getElementById("allowUpload"), allowText: document.getElementById("allowText"), allowBack: document.getElementById("allowBack"), allowMove: document.getElementById("allowMove"), allowResize: document.getElementById("allowResize"), allowRotate: document.getElementById("allowRotate"),
  followMasterTemplate: document.getElementById("followMasterTemplate"),
  pushMasterOnSave: document.getElementById("pushMasterOnSave"),
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
  const standard={
    x: shopFields[`${key}X`],
    y: shopFields[`${key}Y`],
    w: shopFields[`${key}W`]
  };
  if(standard.x&&standard.y&&standard.w) return standard;
  workingProductPrint[product]=workingProductPrint[product]||{};
  workingProductPrint[product][side]=workingProductPrint[product][side]||{};
  const values=workingProductPrint[product][side];
  const virtual=(prop,fallback)=>({
    get value(){return values[prop]??fallback;},
    set value(next){values[prop]=Number(next);}
  });
  return {x:virtual("xPct",side==="front"?68:50),y:virtual("yPct",side==="front"?20:36),w:virtual("widthPct",side==="front"?28:50)};
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
const positionMotifPreviewCache = new Map();
function loadPositionImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});}
async function coloredPositionShirt(src,color){const key=`${src}|${color}`;if(positionShirtPreviewCache.has(key))return positionShirtPreviewCache.get(key);try{const img=await loadPositionImage(src);const c=document.createElement("canvas");c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;const ctx=c.getContext("2d");ctx.drawImage(img,0,0,c.width,c.height);if(color&&String(color).toLowerCase()!=="#ffffff"){ctx.globalCompositeOperation="multiply";ctx.fillStyle=String(color).toLowerCase()==="#111015"?"#3a3a3d":color;ctx.fillRect(0,0,c.width,c.height);ctx.globalCompositeOperation="destination-in";ctx.drawImage(img,0,0,c.width,c.height);ctx.globalCompositeOperation="source-over";}const out=c.toDataURL("image/png");positionShirtPreviewCache.set(key,out);return out;}catch(e){return src;}}
function positionHexToRgb(hex){const clean=String(hex||"#000000").replace("#","");const value=clean.length===3?clean.split("").map(char=>char+char).join(""):clean.padEnd(6,"0").slice(0,6);return{r:parseInt(value.slice(0,2),16),g:parseInt(value.slice(2,4),16),b:parseInt(value.slice(4,6),16)};}
async function coloredPositionMotif(src,color){const key=`${src}|${color}`;if(positionMotifPreviewCache.has(key))return positionMotifPreviewCache.get(key);try{const img=await loadPositionImage(src);const c=document.createElement("canvas");c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);const imageData=ctx.getImageData(0,0,c.width,c.height);const data=imageData.data;const rgb=positionHexToRgb(color);for(let i=0;i<data.length;i+=4){if(data[i+3]===0)continue;data[i]=rgb.r;data[i+1]=rgb.g;data[i+2]=rgb.b;}ctx.putImageData(imageData,0,0);const out=c.toDataURL("image/png");positionMotifPreviewCache.set(key,out);return out;}catch(e){return src;}}


function friendlySizeLabel(value){
  const n = Math.round(Number(value) || 0);
  return `${n} %`;
}

function renderAdminColorRail(){
  try{
  const stage=document.getElementById("positionStage");
  const layout=document.querySelector(".position-editor-layout");
  if(!stage||!layout) return;
  layout.classList.add("has-color-rail");
  let rail=document.getElementById("adminColorRail");
  if(!rail){
    rail=document.createElement("section");
    rail.id="adminColorRail";
    rail.className="tool-section color-section color-rail";
    rail.innerHTML='<h3>Textilfarbe</h3><div class="shirt-colors"></div><p class="current-color">Ausgewählt: <strong id="adminCurrentColorName">White</strong></p>';
    layout.insertBefore(rail,stage);
  } else if(rail.parentElement!==layout){
    layout.insertBefore(rail,stage);
  }
  const host=rail.querySelector(".shirt-colors");
  const nameEl=rail.querySelector("#adminCurrentColorName");
  const product=(workingProducts||[]).find(item=>item.id===(positionProduct?.value||"tshirt"))||{};
  const catalog=typeof MASTER_COLOR_VARIANTS==="object"?(MASTER_COLOR_VARIANTS[product.articleNo]||MASTER_COLOR_VARIANTS.F140||[]):[];
  const catalogMap=Object.fromEntries(catalog.map(v=>[v.id,v]));
  const ids=Array.isArray(product.allowedShirtColorIds)&&product.allowedShirtColorIds.length
    ?product.allowedShirtColorIds
    :(product.colorVariants||catalog).map(v=>v.id);
  const hexMap=product.shirtColorHex||{};
  const variants=Object.fromEntries((product.colorVariants||[]).map(v=>[v.id,v.color||v.hex||""]));
  const currentHex=String(shopFields.fixedShirtHex?.value||"").toLowerCase();
  host.replaceChildren();
  let selectedName="White";
  ids.forEach(id=>{
    const hex=hexMap[id]||variants[id]||catalogMap[id]?.color||"#555555";
    const label=product.shirtColorLabels?.[id]||catalogMap[id]?.name||id;
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="shirt-color";
    btn.dataset.id=id;
    btn.dataset.color=hex;
    btn.dataset.name=label;
    btn.dataset.pattern=catalogMap[id]?.pattern||"";
    btn.style.setProperty("--swatch",hex);
    btn.style.background=hex;
    btn.title=label;
    btn.setAttribute("aria-label",label);
    btn.innerHTML='<span class="color-swatch"></span><span class="color-label"></span>';
    if(hex.toLowerCase()===currentHex || product.defaultShirtColorId===id){
      btn.classList.add("active");
      selectedName=label;
    }
    btn.addEventListener("click",()=>{
      if(shopFields.fixedShirtHex) shopFields.fixedShirtHex.value=hex;
      if(shopFields.fixedShirtName) shopFields.fixedShirtName.value=`${label}||default=${id}||allowed=${ids.join(",")}`;
      product.defaultShirtColorId=id;
      refreshPositionEditor();
    });
    host.appendChild(btn);
  });
  if(nameEl) nameEl.textContent=selectedName;
  }catch(err){ console.error("admin color rail", err); }
}
function refreshPositionEditor(){
  if(!positionStage || !positionMotif || !positionShirt) return;
  const product = positionProduct?.value || "tshirt";
  const side = positionSide?.value || "front";
  const fields = getPositionFieldSet(product, side);
  const x = Number(fields.x?.value || (side === "front" ? 68 : 50));
  const y = Number(fields.y?.value || (side === "front" ? 20 : 36));
  const w = Number(fields.w?.value || (side === "front" ? 28 : 50));
  const productConfig=(workingProducts||[]).find(item=>item.id===product)||(selectedShopOriginal?.products||[]).find(item=>item.id===product)||{};
  const shirtSrc=side==="front"
    ? (productConfig.frontTemplate||(product==="polo"?"polo-front-template.png":product==="hoodie"?"hoodie-front-template.png":"shirt-front-template.png"))
    : (productConfig.backTemplate||(product==="polo"?"polo-back-template.png":product==="hoodie"?"hoodie-back-template.png":"shirt-back-template.png"));
  coloredPositionShirt(shirtSrc, shopFields.fixedShirtHex?.value || "#ffffff").then(src => { positionShirt.src = src; });
  renderAdminColorRail();
  const motif = selectedPositionMotif();
  if(motif?.file){
    positionMotif.onerror = () => {
      const fallback = `/shops/${encodeURIComponent(currentAssetSlug())}/motiv-1.png`;
      if(positionMotif.src !== new URL(fallback, location.href).href) positionMotif.src = fallback;
      else positionMotif.onerror = null;
    };
    const motifSrc=safeAssetUrl(motif.file,currentAssetSlug());
    const motifPreview=motif.preserveColors
      ? Promise.resolve(motifSrc)
      : coloredPositionMotif(motifSrc,shopFields.fixedMotifHex?.value||"#000000");
    motifPreview.then(src=>{positionMotif.src=src;});
    positionMotif.hidden = false;
  } else {
    positionMotif.hidden = true;
    positionMotif.removeAttribute("src");
  }
  positionMotif.style.left = `${x}%`;
  positionMotif.style.top = `${y}%`;
  positionMotif.style.width = `${w}%`;
  if(positionSize) positionSize.value = String(w);
  const sizePct=document.getElementById("positionSizeValue")||positionSizeValue;
  if(sizePct) sizePct.textContent = friendlySizeLabel(w);
  if(positionXValue) positionXValue.textContent = "";
  if(positionYValue) positionYValue.textContent = "";
  if(positionWValue) positionWValue.textContent = friendlySizeLabel(w);

  // v29.8.6: Artikel-Metadaten immer direkt mit der echten Vorschau synchronisieren.
  // Das greift unabhängig davon, ob die Artikel-Karte später im DOM umgebaut wurde.
  const articleModel = document.getElementById("v2853Model");
  const articleTitle = document.getElementById("v2853PreviewTitle");
  const articleColorName = document.getElementById("v2853ColorName");
  const articleColorDot = document.querySelector(".v2853-color-readonly i");
  const modelMap = {tshirt:"F140 · T-Shirt",polo:"F502 · Polo-Shirt",hoodie:"F421 · Hoodie"};
  const dynamicModel=productConfig.articleNo?`${productConfig.articleNo} · ${productConfig.name||product}`:(productConfig.name||modelMap[product]||"Textil");
  if(articleModel) articleModel.value = dynamicModel;
  if(articleTitle) articleTitle.textContent = `Vorschau – ${side === "back" ? "Rückseite" : "Vorderseite"}`;
  if(articleColorName) articleColorName.textContent = cleanVisibleColorName(shopFields.fixedShirtName?.value) || "Royal Blue";
  if(articleColorDot) articleColorDot.style.background = shopFields.fixedShirtHex?.value || "#0758b2";

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
  shopFields.fixedMotifHex?.addEventListener("input", refreshPositionEditor);
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
    x = Math.max(-20, Math.min(120, x));
    y = Math.max(-20, Math.min(120, y));
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

// v29.8.6: robuster Fallback für die Artikelzeile (Kategorie/Modell/Ansicht).
document.addEventListener("change", (ev) => {
  if(ev.target?.id === "positionProduct" || ev.target?.id === "positionSide"){
    requestAnimationFrame(() => refreshPositionEditor());
  }
}, true);


// v29.9.4 – Grunddaten: sichtbaren Titel "Funktionen" entfernen.
function removeInlineFunctionsTitle(){
  const box=document.querySelector(".v2972-inline-functions");
  if(!box) return;
  box.querySelectorAll(".v2972-functions-label").forEach(el=>el.remove());
  [...box.childNodes].forEach(node=>{
    if(node.nodeType===Node.TEXT_NODE && node.textContent.trim().toLowerCase()==="funktionen") node.remove();
  });
  box.querySelectorAll("span,strong,div").forEach(el=>{
    if(el.children.length===0 && el.textContent.trim().toLowerCase()==="funktionen") el.remove();
  });
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(removeInlineFunctionsTitle,0));

function deepClone(value){ return JSON.parse(JSON.stringify(value || {})); }
function mergeProductsWithMasterCatalog(products){
  const existing=Array.isArray(products)?products.filter(product=>product&&product.id):[];
  const existingById=new Map(existing.map(product=>[product.id,product]));
  const master=Array.isArray(CENTRAL.productCatalog)?CENTRAL.productCatalog:[];
  const merged=master.map(base=>{
    const saved=existingById.get(base.id);
    existingById.delete(base.id);
    const next=saved
      ?{...deepClone(base),...deepClone(saved),enabled:saved.enabled!==false}
      :{...deepClone(base),enabled:false};
    const masterAllowed=Array.isArray(base.allowedShirtColorIds)?base.allowedShirtColorIds.slice():[];
    const savedAllowed=Array.isArray(next.allowedShirtColorIds)?next.allowedShirtColorIds.filter(Boolean):[];
    if(masterAllowed.length > 5 && savedAllowed.length <= 1){
      next.allowedShirtColorIds=masterAllowed;
      next.colorVariants=deepClone(base.colorVariants||next.colorVariants||[]);
      next.shirtColorLabels=deepClone(base.shirtColorLabels||next.shirtColorLabels||{});
      if(!next.defaultShirtColorId || next.allowedShirtColorIds.indexOf(next.defaultShirtColorId)===-1){
        next.defaultShirtColorId=base.defaultShirtColorId||next.allowedShirtColorIds[0];
      }
    }
    return next;
  });
  existingById.forEach(product=>merged.push({...deepClone(product),enabled:product.enabled!==false}));
  return merged;
}
function slugify(value){ return String(value||"").trim().toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""); }
function safeAssetUrl(file, slug){ if(!file)return ""; if(/^(https?:)?\/\//i.test(file)||/^(data|blob):/i.test(file)||file.startsWith("/"))return file; return `/shops/${encodeURIComponent(slug)}/${file}`; }
function assetSlugForShop(id, cfg){
  const raw=String(id||"");
  const name=String(cfg?.customerName||shopFields?.name?.value||"").trim().toLowerCase();
  if(raw==="_simple" || name==="vorlage simple") return "_simple";
  if(raw==="_motifs" || name==="vorlage motive") return "_motifs";
  if(raw==="_designer" || name==="vorlage designer") return "_designer";
  if(raw==="_master" || name==="master shop") return "_master";
  return raw || "_simple";
}
function currentAssetSlug(){
  const id=shopFields?.id?.value || selectedShopId || "_simple";
  const cfg=shopConfigs?.get?.(selectedShopId) || selectedShopOriginal || {};
  return assetSlugForShop(id,cfg);
}
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
  const target = name==="shops" ? "shops" : "orders";
  tabButtons.forEach(b=>b.classList.toggle("active",b.dataset.tab===target));
  ordersTab.hidden=target!=="orders";
  shopsTab.hidden=target!=="shops";
  if(target==="orders") renderProductionDashboard();
}
tabButtons.forEach(btn=>btn.addEventListener("click",()=>switchAdminTab(btn.dataset.tab)));

async function initShopAdmin(){
  if(shopAdminInitialized) return;
  shopAdminInitialized=true;
  await loadShopConfigs();
  // v29.6.0: Admin startet grundsätzlich in der Shop-Verwaltung.
  switchAdminTab("shops");
}

async function loadShopConfigs(){
  shopConfigs = new Map(Object.entries(seedShops).map(([id,cfg])=>[id,deepClone(cfg)]));
  try{
    const snap=await db.collection("shops").get();
    snap.forEach(doc=>{
      const seed=shopConfigs.get(doc.id)||{};
      const stored=deepClone(doc.data());
      const merged={...deepClone(seed),...stored,customerId:doc.id};
      if((stored.priceVisibilityVersion||0)<1){
        merged.features={...(merged.features||{}),showPrices:false};
        merged.priceVisibilityVersion=1;
      }
      if(doc.id==="hansa"){
        merged.motifs=(merged.motifs||[]).map(motif=>
          motif.id==="script"||/^script$/i.test(String(motif.name||""))?{...motif,name:"Allstar"}:motif
        );
        if((stored.hansaSubtitleVersion||0)<1){
          merged.brandSubtitle="Wir sind Hansa!";
          merged.hansaSubtitleVersion=1;
        }
        if((stored.hansaPriceVisibilityVersion||0)<2){
          merged.features={...(merged.features||{}),showPrices:false};
          merged.hansaPriceVisibilityVersion=2;
        }
        if((stored.hansaSweatshirtVersion||0)<1){
          const products=(merged.products||[]).filter(product=>product.id!=="bcwu01w");
          const tshirtIndex=products.findIndex(product=>product.id==="tshirt");
          products.splice(tshirtIndex>=0?tshirtIndex+1:products.length,0,hansaSweatshirtProduct());
          merged.products=products;
          merged.productPrint={...(merged.productPrint||{}),bcwu01w:{front:{xPct:50,yPct:31,widthPct:72},back:{xPct:50,yPct:36,widthPct:50}}};
          merged.productMotifModes={...(merged.productMotifModes||{}),bcwu01w:"normal"};
          merged.hansaSweatshirtVersion=1;
        }
      }
      if(doc.id==="tus-hemmerde" && (stored.tusColorPairsVersion||0)<1){
        merged.shirtPrice=10;
        merged.products=(merged.products||[]).map(product=>product.id==="tshirt"?{...product,price:10,enabled:true}:{...product,enabled:false});
        merged.fixedShirtColor={id:"white",name:"White||default=white||allowed=white,red,heather-grey",color:"#ffffff"};
        merged.fixedMotifColor={name:"Red||default=Red||allowed=%5B%22Red%22%5D",color:"#B62820"};
        merged.shirtMotifColors={white:{name:"Red",color:"#B62820"},red:{name:"White",color:"#FFFFFF"},"heather-grey":{name:"Red",color:"#B62820"}};
        merged.tusColorPairsVersion=1;
      }
      if(doc.id==="tus-hemmerde" && (stored.tusInitialsVersion||0)<5){
        merged.features={...(merged.features||{}),allowInitials:true};
        merged.initialsConfig={label:"Initialen (optional)",placeholder:"z. B. TS",maxLength:3,stageXPct:29,stageYPct:90,fontSize:24,fontFamily:"Arial"};
        merged.tusInitialsVersion=5;
      }
      if(doc.id==="tus-hemmerde" && (stored.tusJc001Version||0)<4){
        merged.products=(merged.products||[]).map(product=>product.id==="tshirt"
          ?{...product,price:10,enabled:true,allowedShirtColorIds:["white","heather-grey","red"],defaultShirtColorId:"white",sizes:["S","M","L","XL","2XL","3XL"]}
          :product).filter(product=>product.id!=="jc001");
        merged.products.splice(1,0,{id:"jc001",name:"Sport",articleNo:"JC001",price:12,printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png",enabled:true,allowedShirtColorIds:["red","heather-grey"],defaultShirtColorId:"red",shirtColorLabels:{red:"Fire Red","heather-grey":"Heather Grey"},sizesByColor:{red:["S","M","L","XL","2XL","3XL"],"heather-grey":["S","M","L","XL","2XL"]}});
        merged.productPrint={...(merged.productPrint||{}),jc001:{front:{xPct:78,yPct:0,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}}};
        merged.tusJc001Version=4;
      }
      if(doc.id==="tus-hemmerde" && (stored.tusProductMotifVersion||0)<1){
        const motifs=Array.isArray(merged.motifs)?merged.motifs:[];
        if(!motifs.some(motif=>motif.id==="tus-3d-patch")) motifs.push({id:"tus-3d-patch",name:"TuS 3D-Patch",file:"/tus-3d-patch.png?v=30.3.19",preserveColors:true});
        merged.motifs=motifs;
        merged.productMotifModes={tshirt:"normal",polo:"normal",hoodie:"normal",...(merged.productMotifModes||{}),jc001:"both"};
        merged.tusProductMotifVersion=1;
      }
      if(doc.id==="tus-hemmerde" && (stored.tusOrderPageVersion||0)<2){
        merged.features={...(merged.features||{}),showPrices:false,showNexaroBranding:false};
        merged.tusOrderPageVersion=2;
      }
      shopConfigs.set(doc.id,merged);
    });
  }catch(err){ console.error(err); setShopState("Shopdaten konnten nicht vollständig geladen werden.","error"); }
  const templateDemos={
    _master:{customerName:"Master Shop",pageTitle:"Master Shop – Gesamtsortiment",brandTitle:"DEIN VEREINSSHOP",brandSubtitle:"Komplettes Textilsortiment",shopType:"simple",motifs:[{id:"motiv1",name:"NOVA Athletic",file:"/shops/_designer/demo-motiv-1.png?v=30.3.19"}]},
    _simple:{customerName:"Vorlage Simple",pageTitle:"Vorlage Simple – T-Shirt Shop",brandTitle:"Vorlage Simple",brandSubtitle:"Einfach auswählen und bestellen",shopType:"simple",motifs:[{id:"motiv1",name:"NOVA Athletic",file:"demo-motiv-1.png?v=30.1.87"}]},
    _motifs:{customerName:"Vorlage Motive",pageTitle:"Vorlage Motive – T-Shirt Shop",brandTitle:"Vorlage Motive",brandSubtitle:"Mehrere Motive zur Auswahl",shopType:"motifs",fixedShirtColor:{id:"azure-blue",name:"Azure Blue||default=azure-blue",color:"#147fae"},motifs:[{id:"motiv1",name:"NOVA Wappen",file:"demo-motiv-1.png?v=30.1.87"},{id:"motiv2",name:"NOVA Dynamik",file:"demo-motiv-2.png?v=30.1.87"}]},
    _designer:{customerName:"Vorlage Designer",pageTitle:"Vorlage Designer – T-Shirt Shop",brandTitle:"Vorlage Designer",brandSubtitle:"Dein Textil frei gestalten",shopType:"designer",motifs:[{id:"motiv1",name:"NOVA Athletic",file:"demo-motiv-1.png?v=30.1.87"}]}
  };
  Object.entries(templateDemos).forEach(([id,demo])=>{
    const cfg=shopConfigs.get(id);
    if(cfg) shopConfigs.set(id,{...cfg,...demo,brandSubtitle:typeof cfg.brandSubtitle==="string"?cfg.brandSubtitle:demo.brandSubtitle,features:{...(cfg.features||{}),allowMoveMotif:true,allowResizeMotif:true,allowRotateMotif:true},customerId:id,logoFile:"/dein-logo.svg?v=30.1.87",logoHeight:90,active:true});
  });
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


function cleanVisibleColorName(value){
  const raw=String(value||"").trim();
  if(!raw) return "";
  let first=raw.split("||")[0].trim();
  first=first.split("|default=")[0].trim();
  first=first.split("|allowed=")[0].trim();
  const key=first.toLowerCase();
  const labels={
    "royal-blue":"Royal Blue",
    "royal blue":"Royal Blue",
    "white":"Weiß","weiss":"Weiß",
    "black":"Schwarz",
    "blue":"Blau",
    "red":"Rot",
    "yellow":"Gelb",
    "green":"Grün",
    "orange":"Orange",
    "pink":"Pink"
  };
  return labels[key] || first;
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
function fillProductToggles(cfg){
  const products=mergeProductsWithMasterCatalog(cfg.products);
  workingProducts=deepClone(products);
  const enabled=new Set(products.length?products.filter(product=>product.enabled!==false).map(product=>product.id):["tshirt"]);
  const fields={tshirt:shopFields.productTshirtEnabled,polo:shopFields.productPoloEnabled,hoodie:shopFields.productHoodieEnabled};
  Object.entries(fields).forEach(([id,input])=>{
    if(!input) return;
    input.checked=enabled.has(id);
    input.closest(".v2850-product")?.classList.toggle("is-disabled",!input.checked);
  });
  renderProductPriceEditor();
}
function renderProductPriceEditor(){
  const host=document.getElementById("productPriceEditor");
  if(!host) return;
  host.replaceChildren();
  workingProducts.forEach((product,index)=>{
    const row=document.createElement("div");
    row.className="v3036-product-row";
    row.classList.toggle("is-disabled",product.enabled===false);

    const name=document.createElement("strong");
    name.textContent=product.name||product.id||"Textil";
    const article=document.createElement("span");
    article.textContent=product.articleNo||"–";

    const priceWrap=document.createElement("label");
    priceWrap.className="v3036-price-field";
    const price=document.createElement("input");
    price.type="number"; price.min="0"; price.step="0.01"; price.inputMode="decimal";
    price.value=Number(product.price||0).toFixed(2);
    price.setAttribute("aria-label",`Preis ${product.name||product.id||"Textil"}`);
    const currency=document.createElement("span"); currency.textContent="€";
    priceWrap.append(price,currency);

    const purchaseWrap=document.createElement("label");
    purchaseWrap.className="v3036-price-field v3036-purchase-field";
    const purchase=document.createElement("input");
    purchase.type="number"; purchase.min="0"; purchase.step="0.01"; purchase.inputMode="decimal";
    purchase.value=product.purchasePrice == null ? "" : Number(product.purchasePrice||0).toFixed(2);
    purchase.placeholder="EK";
    purchase.setAttribute("aria-label",`EK-Preis ${product.name||product.id||"Textil"}`);
    const purchaseCurrency=document.createElement("span"); purchaseCurrency.textContent="€";
    purchaseWrap.append(purchase,purchaseCurrency);

    const printWrap=document.createElement("label");
    printWrap.className="v3036-price-field v3036-print-field";
    const print=document.createElement("input");
    print.type="number"; print.min="0"; print.step="0.01"; print.inputMode="decimal";
    print.value=product.printCost == null ? "" : Number(product.printCost||0).toFixed(2);
    print.placeholder="Druck";
    print.setAttribute("aria-label",`Druckkosten ${product.name||product.id||"Textil"}`);
    const printCurrency=document.createElement("span"); printCurrency.textContent="€";
    printWrap.append(print,printCurrency);

    const toggle=document.createElement("label");
    toggle.className="v3036-product-toggle";
    const checkbox=document.createElement("input"); checkbox.type="checkbox"; checkbox.checked=product.enabled!==false;
    const switchUi=document.createElement("i");
    toggle.append(checkbox,switchUi);

    price.addEventListener("input",()=>{
      workingProducts[index].price=Math.max(0,Number(price.value)||0);
      setShopState("Preis geändert – oben Speichern klicken.");
    });
    purchase.addEventListener("input",()=>{
      workingProducts[index].purchasePrice=Math.max(0,Number(purchase.value)||0);
      setShopState("EK-Preis geändert – oben Speichern klicken.");
    });
    print.addEventListener("input",()=>{
      workingProducts[index].printCost=Math.max(0,Number(print.value)||0);
      setShopState("Druckkosten geändert – oben Speichern klicken.");
    });
    checkbox.addEventListener("change",()=>{
      workingProducts[index].enabled=checkbox.checked;
      row.classList.toggle("is-disabled",!checkbox.checked);
      const standardField={tshirt:shopFields.productTshirtEnabled,polo:shopFields.productPoloEnabled,hoodie:shopFields.productHoodieEnabled}[product.id];
      if(standardField) standardField.checked=checkbox.checked;
      setShopState("Produktauswahl geändert – oben Speichern klicken.");
    });
    const title=document.createElement("div");
    title.className="v3036-product-title";
    title.append(name,article);
    row.append(title,priceWrap,purchaseWrap,printWrap,toggle);
    host.appendChild(row);
  });
  renderProductVariantEditor();
}
function renderProductVariantEditor(){
  const host=document.getElementById("productVariantEditor");
  if(!host) return;
  host.replaceChildren();
  if(!workingProducts.length) return;
  if(!workingProducts.some(product=>product.id===currentVariantProductId)) currentVariantProductId=workingProducts[0].id;
  const toolbar=document.createElement("label"); toolbar.className="v3040-variant-select";
  const title=document.createElement("span"); title.textContent="Artikel";
  const select=document.createElement("select");
  workingProducts.forEach(product=>{const option=document.createElement("option");option.value=product.id;option.textContent=`${product.name||product.id} · ${product.articleNo||"–"}`;select.appendChild(option);});
  select.value=currentVariantProductId;
  select.addEventListener("change",()=>{
    currentVariantProductId=select.value;
    if(positionProduct){positionProduct.value=select.value;positionProduct.dispatchEvent(new Event("change",{bubbles:true}));}
    refreshPositionEditor();
    renderProductVariantEditor();
  });
  toolbar.append(title,select); host.appendChild(toolbar);
  const index=workingProducts.findIndex(product=>product.id===currentVariantProductId);
  const product=workingProducts[index];
  if(!product) return;
  if(!Array.isArray(product.allowedShirtColorIds)){
    const note=document.createElement("p"); note.className="v3040-variant-note";
    note.textContent="Dieser Artikel verwendet derzeit die allgemeinen Shopfarben. Artikelspezifische Varianten werden bei Markenartikeln hinterlegt.";
    host.appendChild(note); return;
  }
  const articleColorCatalog=Array.isArray(product.colorVariants)&&product.colorVariants.length
    ?product.colorVariants.map(variant=>[variant.id,variant.name||variant.id])
    :PRODUCT_COLOR_CATALOG;
  const allowed=new Set(product.allowedShirtColorIds);
  const hexMap=product.shirtColorHex||{};
  const variantHex=Object.fromEntries((product.colorVariants||[]).map(v=>[v.id,v.color||v.hex||""]));
  const picker=document.createElement("div"); picker.className="v3040-color-picker";
  articleColorCatalog.forEach(([id,fallbackName])=>{
    const label=document.createElement("label");
    label.className="v3040-color-chip"+(allowed.has(id)?" is-on":"");
    const hex=hexMap[id]||variantHex[id]||"#ccc";
    label.style.setProperty("--sw",hex);
    const input=document.createElement("input"); input.type="checkbox"; input.checked=allowed.has(id);
    const swatch=document.createElement("i"); swatch.className="v3040-swatch";
    const copy=document.createElement("span"); copy.textContent=product.shirtColorLabels?.[id]||fallbackName;
    input.addEventListener("change",()=>{
      const next=new Set(workingProducts[index].allowedShirtColorIds||[]);
      input.checked?next.add(id):next.delete(id);
      if(!next.size){input.checked=true;return;}
      workingProducts[index].allowedShirtColorIds=articleColorCatalog.map(item=>item[0]).filter(colorId=>next.has(colorId));
      workingProducts[index].sizesByColor=workingProducts[index].sizesByColor||{};
      if(input.checked&&!workingProducts[index].sizesByColor[id]) workingProducts[index].sizesByColor[id]=[...(workingProducts[index].sizes||PRODUCT_SIZES)];
      if(!next.has(workingProducts[index].defaultShirtColorId)) workingProducts[index].defaultShirtColorId=workingProducts[index].allowedShirtColorIds[0];
      setShopState("Artikelvarianten geändert – oben Speichern klicken."); renderProductVariantEditor();
    });
    label.append(swatch,copy,input); picker.appendChild(label);
  });
  host.appendChild(picker);
  const extra=document.createElement("details"); extra.className="v3040-size-extra";
  extra.innerHTML="<summary>Größen je Farbe</summary>";
  const heads=document.createElement("div"); heads.className="v3040-size-head"; heads.innerHTML="<span>Marken-Farbname</span><span>verfügbare Größen</span><span>Start</span>";
  const rows=document.createElement("div"); rows.className="v3040-size-rows";
  product.allowedShirtColorIds.forEach(colorId=>{
    const row=document.createElement("div"); row.className="v3040-size-row";
    const fallback=articleColorCatalog.find(item=>item[0]===colorId)?.[1]||colorId;
    const colorName=document.createElement("input"); colorName.type="text"; colorName.value=product.shirtColorLabels?.[colorId]||fallback; colorName.setAttribute("aria-label",`Farbname ${fallback}`);
    const sizes=document.createElement("input"); sizes.type="text"; sizes.value=(product.sizesByColor?.[colorId]||product.sizes||PRODUCT_SIZES).join(", "); sizes.setAttribute("aria-label",`Größen ${fallback}`);
    colorName.addEventListener("input",()=>{workingProducts[index].shirtColorLabels=workingProducts[index].shirtColorLabels||{};workingProducts[index].shirtColorLabels[colorId]=colorName.value.trim()||fallback;setShopState("Farbname geändert – oben Speichern klicken.");});
    sizes.addEventListener("change",()=>{const parsed=sizes.value.split(/[,;\s]+/).map(value=>value.trim().toUpperCase()).filter(value=>PRODUCT_SIZES.includes(value));const unique=[...new Set(parsed)];if(!unique.length){sizes.value=(workingProducts[index].sizesByColor?.[colorId]||PRODUCT_SIZES).join(", ");return;}workingProducts[index].sizesByColor=workingProducts[index].sizesByColor||{};workingProducts[index].sizesByColor[colorId]=unique;sizes.value=unique.join(", ");setShopState("Größen geändert – oben Speichern klicken.");});
    const defaultLabel=document.createElement("label"); defaultLabel.className="v3040-default-color";
    const radio=document.createElement("input"); radio.type="radio"; radio.name="v3040DefaultColor"; radio.checked=product.defaultShirtColorId===colorId;
    radio.addEventListener("change",()=>{workingProducts[index].defaultShirtColorId=colorId;setShopState("Startfarbe geändert – oben Speichern klicken.");});
    const swatch=document.createElement("i"); swatch.className="v3040-swatch";
    swatch.style.setProperty("--sw",hexMap[colorId]||variantHex[colorId]||"#ccc");
    const radioCopy=document.createElement("span"); radioCopy.textContent="Start"; defaultLabel.append(radio,swatch,radioCopy);
    row.append(colorName,sizes,defaultLabel); rows.appendChild(row);
  });
  extra.append(heads,rows);
  host.appendChild(extra);
}
function configurePositionProducts(cfg){
  const configured=workingProducts.length?workingProducts:mergeProductsWithMasterCatalog(cfg.products);
  const allIds=[...new Set(configured.map(product=>product.id).filter(Boolean))];
  const labels={tshirt:"T-Shirt",polo:"Polo-Shirt",hoodie:"Hoodie",...Object.fromEntries(configured.map(product=>[product.id,product.name||product.id]))};
  if(positionProduct){
    positionProduct.replaceChildren();
    allIds.forEach(id=>{const option=document.createElement("option");option.value=id;option.textContent=labels[id];positionProduct.appendChild(option);});
    positionProduct.value=configured.find(product=>product.enabled!==false)?.id||allIds[0]||"tshirt";
  }
  if(positionSide) positionSide.value="front";
  const grid=document.querySelector(".v2850-product-grid");
  allIds.forEach(id=>{const card=grid?.querySelector(`.v2850-product[data-product="${id}"]`);if(card)grid.appendChild(card);});
}
function selectShop(id){
  const cfg=deepClone(shopConfigs.get(id)||{}); selectedShopId=id; selectedShopOriginal=cfg; workingMotifs=deepClone(cfg.motifs||[]); workingProductMotifModes=deepClone(cfg.productMotifModes||{}); workingProductPrint=deepClone(cfg.productPrint||{}); workingLogo=cfg.logoFile||"";
  shopForm.hidden=false; saveShopBtn.disabled=false; setTimeout(removeInlineFunctionsTitle,0); shopEditorTitle.textContent=id==="_master"?"Master Shop – zentrale Vorlage":(cfg.customerName||id||"Neuer Shop");
  shopFields.id.value=id||""; shopFields.id.disabled=!!(id && shopConfigs.has(id)); shopFields.type.value=cfg.shopType||"simple"; shopFields.name.value=cfg.customerName||""; shopFields.price.value=Number(cfg.shirtPrice??15); shopFields.prefix.value=cfg.orderPrefix||""; shopFields.email.value=cfg.orderEmail||CENTRAL.orderEmail||"shirtzentrale@gmail.com"; shopFields.active.checked=cfg.active!==false;
  shopFields.accent.value=/^#[0-9a-f]{6}$/i.test(cfg.accentColor||"")?cfg.accentColor:"#111111"; shopFields.logoHeight.value=Number(cfg.logoHeight||90); shopFields.previewMode.value=cfg.features?.previewMode||"single"; shopFields.subtitle.value=cfg.brandSubtitle||""; shopFields.heading.value=cfg.designerHeading||""; shopFields.intro.value=cfg.designerIntro||"";
  fillProductToggles(cfg); configurePositionProducts(cfg);
  shopFields.fixedShirtName.value=cfg.fixedShirtColor?.name||cfg.fixedShirtColor?.id||""; shopFields.fixedShirtHex.value=/^#[0-9a-f]{6}$/i.test(cfg.fixedShirtColor?.color||"")?cfg.fixedShirtColor.color:"#0758b2"; shopFields.fixedMotifName.value=cfg.fixedMotifColor?.name||""; shopFields.fixedMotifHex.value=/^#[0-9a-f]{6}$/i.test(cfg.fixedMotifColor?.color||"")?cfg.fixedMotifColor.color:"#f6c951";
  shopFields.showShirtColors.checked=featureValue(cfg,"showShirtColorPicker",true); shopFields.showMotifs.checked=featureValue(cfg,"showMotifPicker",cfg.shopType!=="simple"); shopFields.showMotifColors.checked=featureValue(cfg,"showMotifColorPicker",true);
  shopFields.showPrices.checked=featureValue(cfg,"showPrices",true); shopFields.showNexaroBranding.checked=featureValue(cfg,"showNexaroBranding",true);
  shopFields.allowUpload.checked=featureValue(cfg,"allowCustomerUpload",cfg.shopType==="designer"); shopFields.allowText.checked=featureValue(cfg,"allowText",cfg.shopType==="designer"); shopFields.allowBack.checked=featureValue(cfg,"allowBackDesign",true); shopFields.allowMove.checked=featureValue(cfg,"allowMoveMotif",cfg.shopType==="designer"); shopFields.allowResize.checked=featureValue(cfg,"allowResizeMotif",cfg.shopType==="designer"); shopFields.allowRotate.checked=featureValue(cfg,"allowRotateMotif",cfg.shopType==="designer");
  const fp=cfg.fixedPrint||{}; refreshFixedPrintMotifOptions(fp.front?.motifId||"",fp.back?.motifId||"");
  shopFields.fixedFrontEnabled.checked=!!fp.front?.enabled; shopFields.fixedFrontPosition.value=fp.front?.position||"left-chest"; shopFields.fixedFrontSize.value=fp.front?.size||"small"; shopFields.fixedFrontTop.value=Number(fp.front?.topPct ?? 24); shopFields.fixedFrontSide.value=Number(fp.front?.sidePct ?? 32);
  shopFields.fixedBackEnabled.checked=!!fp.back?.enabled; shopFields.fixedBackPosition.value=fp.back?.position||"center"; shopFields.fixedBackSize.value=fp.back?.size||"large"; shopFields.fixedBackTop.value=Number(fp.back?.topPct ?? 36);
  const pp=cfg.productPrint||{};
  const tshirt=pp.tshirt||{}; const polo=pp.polo||{}; const hoodie=pp.hoodie||{};
  const hansaDefaultFront=id==="hansa"?{x:50,y:31,w:72}:null;
  shopFields.tshirtFrontX.value=Number(tshirt.front?.xPct ?? hansaDefaultFront?.x ?? 68); shopFields.tshirtFrontY.value=Number(tshirt.front?.yPct ?? hansaDefaultFront?.y ?? fp.front?.topPct ?? 20); shopFields.tshirtFrontW.value=Number(tshirt.front?.widthPct ?? hansaDefaultFront?.w ?? 28);
  shopFields.tshirtBackX.value=Number(tshirt.back?.xPct ?? 50); shopFields.tshirtBackY.value=Number(tshirt.back?.yPct ?? fp.back?.topPct ?? 36); shopFields.tshirtBackW.value=Number(tshirt.back?.widthPct ?? 50);
  shopFields.poloFrontX.value=Number(polo.front?.xPct ?? hansaDefaultFront?.x ?? 68); shopFields.poloFrontY.value=Number(polo.front?.yPct ?? hansaDefaultFront?.y ?? 22); shopFields.poloFrontW.value=Number(polo.front?.widthPct ?? hansaDefaultFront?.w ?? 28);
  shopFields.poloBackX.value=Number(polo.back?.xPct ?? 50); shopFields.poloBackY.value=Number(polo.back?.yPct ?? 36); shopFields.poloBackW.value=Number(polo.back?.widthPct ?? 50);
  shopFields.hoodieFrontX.value=Number(hoodie.front?.xPct ?? hansaDefaultFront?.x ?? 68); shopFields.hoodieFrontY.value=Number(hoodie.front?.yPct ?? hansaDefaultFront?.y ?? 22); shopFields.hoodieFrontW.value=Number(hoodie.front?.widthPct ?? hansaDefaultFront?.w ?? 36);
  shopFields.hoodieBackX.value=Number(hoodie.back?.xPct ?? 50); shopFields.hoodieBackY.value=Number(hoodie.back?.yPct ?? 34); { const hb=Number(hoodie.back?.widthPct ?? 78); shopFields.hoodieBackW.value=([46,54,58,62,72].includes(hb)?78:hb); }
  fillPrintData(cfg);
  if(productionFileUrl) productionFileUrl.value = cfg.productionFile || cfg.printData?.productionFile || "";
  updateFeatureVisibility(cfg.shopType||"simple");
  updateLogoPreview(); renderMotifsEditor(); refreshPositionEditor(); previewShopBtn.hidden=!id; if(id) previewShopBtn.href=`/?shop=${encodeURIComponent(id)}`; setShopState(id==="_master"?"Zentrale Vorlage: Änderungen hier sind die Basis für „Neuer Shop“.":"Bereit zum Bearbeiten."); renderShopList();
  syncTemplateBar(id,cfg);
}

function syncTemplateBar(id,cfg){
  const followRow=document.getElementById("followMasterRow");
  const pushRow=document.getElementById("pushMasterRow");
  const applyBtn=document.getElementById("applyMasterTemplateBtn");
  const isMaster=id==="_master" || cfg?.isMasterTemplate;
  if(followRow) followRow.hidden=!!isMaster;
  if(pushRow) pushRow.hidden=!isMaster;
  if(applyBtn) applyBtn.hidden=!!isMaster;
  if(shopFields.followMasterTemplate) shopFields.followMasterTemplate.checked=isMaster?false:cfg?.followMasterTemplate!==false;
}

function applyMasterCatalogToWorkingShop(){
  const master=deepClone(shopConfigs.get("_master")||seedShops["_master"]||{});
  if(!master || !Object.keys(master).length) throw new Error("Master-Vorlage nicht gefunden.");
  workingProducts=deepClone(master.products||[]);
  workingProductPrint=deepClone(master.productPrint||{});
  fillProductToggles(master);
  configurePositionProducts(master);
  fillPrintData(master);
  if(shopFields.price) shopFields.price.value=Number(master.shirtPrice ?? shopFields.price.value ?? 15);
  selectedShopOriginal={...(selectedShopOriginal||{}),products:deepClone(master.products||[]),productPrint:deepClone(master.productPrint||{}),printData:deepClone(master.printData||{}),shirtPrice:master.shirtPrice};
  setShopState("Master-Sortiment übernommen. Speichern, damit der Shop live aktualisiert.","ok");
}

document.getElementById("applyMasterTemplateBtn")?.addEventListener("click",()=>{
  try{ applyMasterCatalogToWorkingShop(); }
  catch(err){ setShopState(err.message||"Vorlage konnte nicht übernommen werden.","error"); }
});

function updateFeatureVisibility(type){
  if(designerFeatureTools) designerFeatureTools.hidden = type !== "designer";
}

function typePreset(type){
  const designer=type==="designer", motifs=type==="motifs";
  shopFields.showMotifs.checked=motifs||designer; shopFields.allowUpload.checked=designer; shopFields.allowText.checked=designer; shopFields.allowMove.checked=designer; shopFields.allowResize.checked=designer; shopFields.allowRotate.checked=designer; shopFields.showShirtColors.checked=true; shopFields.showMotifColors.checked=true; shopFields.showPrices.checked=false; shopFields.showNexaroBranding.checked=true; shopFields.allowBack.checked=true;
  updateFeatureVisibility(type);
}
shopFields.type.addEventListener("change",()=>typePreset(shopFields.type.value));
[shopFields.productTshirtEnabled,shopFields.productPoloEnabled,shopFields.productHoodieEnabled].forEach(input=>{
  input?.addEventListener("change",()=>{
    input.closest(".v2850-product")?.classList.toggle("is-disabled",!input.checked);
    setShopState("Produktauswahl geändert – noch speichern.");
  });
});
bindPositionEditor();

function updateLogoPreview(){
  const slug=currentAssetSlug(); const src=safeAssetUrl(workingLogo,slug); logoPreview.src=src||""; logoPreview.style.display=src?"block":"none";
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
    const img=document.createElement("img"); img.alt="Motiv"; img.onerror=()=>{ const f=`/shops/${encodeURIComponent(currentAssetSlug())}/motiv-1.png`; if(img.src!==new URL(f,location.href).href){img.src=f;} else {img.onerror=null;} }; img.src=safeAssetUrl(motif.file,currentAssetSlug());
    const fields=document.createElement("div"); fields.className="motif-fields";
    const name=document.createElement("input"); name.className="motif-name"; name.value=motif.name||`Motiv ${index+1}`; name.placeholder="Motivname"; name.addEventListener("input",()=>{workingMotifs[index].name=name.value});
    const upload=document.createElement("input"); upload.type="file"; upload.accept="image/*"; upload.addEventListener("change",async()=>{const file=upload.files?.[0];if(!file)return;try{setShopState("Motiv wird vorbereitet …");workingMotifs[index].file=await compressImage(file,800,210000);img.src=workingMotifs[index].file;setShopState("Motiv geändert – noch speichern.","ok")}catch(err){alert(err.message||"Motiv konnte nicht verarbeitet werden.")}upload.value=""});
    fields.append(name,upload);
    if(motif.preserveColors){const note=document.createElement("small");note.className="motif-original-colors";note.textContent="Originalfarben / 3D bleiben erhalten";fields.appendChild(note);}
    const del=document.createElement("button"); del.type="button"; del.className="danger-btn"; del.textContent="Entfernen"; del.addEventListener("click",()=>{workingMotifs.splice(index,1);renderMotifsEditor();setShopState("Motiv entfernt – noch speichern.")});
    row.append(img,fields,del); motifsEditor.appendChild(row);
  });
  if(!workingMotifs.length){const p=document.createElement("p");p.className="section-note";p.textContent="Noch keine Motive vorhanden.";motifsEditor.appendChild(p)}
  refreshFixedPrintMotifOptions(shopFields.fixedFrontMotif?.value||"",shopFields.fixedBackMotif?.value||"");
  refreshPositionEditor();
}
addMotifBtn.addEventListener("click",()=>{ if(workingMotifs.length>=4){alert("Für die direkte Firebase-Verwaltung sind maximal 4 Motive vorgesehen.");return;} const n=workingMotifs.length+1;workingMotifs.push({id:`motiv${n}`,name:`Motiv ${n}`,file:""});renderMotifsEditor();setShopState("Neues Motiv angelegt – Bild auswählen und speichern.") });
addTusPatchBtn?.addEventListener("click",()=>{
  const patchId="tus-3d-patch";
  let motif=workingMotifs.find(item=>item.id===patchId);
  if(!motif){
    if(workingMotifs.length>=4){alert("Es sind bereits 4 Motive vorhanden. Bitte zuerst ein Motiv entfernen.");return;}
    motif={id:patchId,name:"TuS 3D-Patch",file:"/tus-3d-patch.png?v=30.3.19",preserveColors:true};
    workingMotifs.push(motif);
  }else{
    motif.name="TuS 3D-Patch";
    motif.file="/tus-3d-patch.png?v=30.3.19";
    motif.preserveColors=true;
  }
  renderMotifsEditor();
  if(shopFields.fixedFrontMotif) shopFields.fixedFrontMotif.value=patchId;
  refreshPositionEditor();
  setShopState("TuS 3D-Patch eingesetzt – jetzt oben Speichern klicken.","ok");
});

newShopBtn.addEventListener("click",()=>{
  // Jeder neue Shop ist ein Klon des Master-Shops: Sortiment, EK/VK, Druckpositionen, Features.
  const template = deepClone(shopConfigs.get("_master") || seedShops["_master"] || shopConfigs.get("_simple") || seedShops["_simple"] || {});
  delete template.isMasterTemplate;
  delete template.customerId;
  template.templateSource = "_master";
  selectedShopId=""; selectedShopOriginal=template; workingMotifs=deepClone(template.motifs||[{id:"motiv1",name:"Motiv 1",file:""}]); workingProductMotifModes=deepClone(template.productMotifModes||{}); workingProductPrint=deepClone(template.productPrint||{}); workingLogo=template.logoFile||"";
  shopForm.hidden=false; saveShopBtn.disabled=false; setTimeout(removeInlineFunctionsTitle,0); shopEditorTitle.textContent="Neuer Shop aus Master"; shopFields.id.disabled=false;
  shopFields.id.value=""; shopFields.name.value=""; shopFields.type.value=template.shopType||"simple"; shopFields.price.value=Number(template.shirtPrice??15); shopFields.prefix.value=""; shopFields.email.value=template.orderEmail||CENTRAL.orderEmail||"shirtzentrale@gmail.com"; shopFields.active.checked=true;
  shopFields.accent.value=/^#[0-9a-f]{6}$/i.test(template.accentColor||"")?template.accentColor:"#111111"; shopFields.logoHeight.value=Number(template.logoHeight||90); shopFields.previewMode.value=template.features?.previewMode||"single"; shopFields.subtitle.value=""; shopFields.heading.value=""; shopFields.intro.value="";
  fillProductToggles(template); configurePositionProducts(template);
  shopFields.fixedShirtName.value=template.fixedShirtColor?.name||template.fixedShirtColor?.id||""; shopFields.fixedShirtHex.value=/^#[0-9a-f]{6}$/i.test(template.fixedShirtColor?.color||"")?template.fixedShirtColor.color:"#0758b2"; shopFields.fixedMotifName.value=template.fixedMotifColor?.name||""; shopFields.fixedMotifHex.value=/^#[0-9a-f]{6}$/i.test(template.fixedMotifColor?.color||"")?template.fixedMotifColor.color:"#f6c951";
  shopFields.showShirtColors.checked=featureValue(template,"showShirtColorPicker",true);
  shopFields.showMotifs.checked=featureValue(template,"showMotifPicker",false);
  shopFields.showMotifColors.checked=featureValue(template,"showMotifColorPicker",true);
  shopFields.showPrices.checked=featureValue(template,"showPrices",false);
  shopFields.showNexaroBranding.checked=featureValue(template,"showNexaroBranding",false);
  shopFields.allowUpload.checked=featureValue(template,"allowCustomerUpload",false);
  shopFields.allowText.checked=featureValue(template,"allowText",false);
  shopFields.allowBack.checked=featureValue(template,"allowBackDesign",true);
  shopFields.allowMove.checked=featureValue(template,"allowMoveMotif",true);
  shopFields.allowResize.checked=featureValue(template,"allowResizeMotif",true);
  shopFields.allowRotate.checked=featureValue(template,"allowRotateMotif",true);
  updateFeatureVisibility(shopFields.type.value||"simple");
  const fp=template.fixedPrint||{}; refreshFixedPrintMotifOptions(fp.front?.motifId||"motiv1",fp.back?.motifId||"motiv1");
  shopFields.fixedFrontEnabled.checked=!!fp.front?.enabled; shopFields.fixedFrontPosition.value=fp.front?.position||"left-chest"; shopFields.fixedFrontSize.value=fp.front?.size||"small"; shopFields.fixedFrontTop.value=Number(fp.front?.topPct??16); shopFields.fixedFrontSide.value=Number(fp.front?.sidePct??32);
  shopFields.fixedBackEnabled.checked=!!fp.back?.enabled; shopFields.fixedBackPosition.value=fp.back?.position||"center"; shopFields.fixedBackSize.value=fp.back?.size||"large"; shopFields.fixedBackTop.value=Number(fp.back?.topPct??36);
  const pp=template.productPrint||{};
  shopFields.tshirtFrontX.value=Number(pp.tshirt?.front?.xPct??68); shopFields.tshirtFrontY.value=Number(pp.tshirt?.front?.yPct??16); shopFields.tshirtFrontW.value=Number(pp.tshirt?.front?.widthPct??28); shopFields.tshirtBackX.value=Number(pp.tshirt?.back?.xPct??50); shopFields.tshirtBackY.value=Number(pp.tshirt?.back?.yPct??36); shopFields.tshirtBackW.value=Number(pp.tshirt?.back?.widthPct??50);
  shopFields.poloFrontX.value=Number(pp.polo?.front?.xPct??68); shopFields.poloFrontY.value=Number(pp.polo?.front?.yPct??22); shopFields.poloFrontW.value=Number(pp.polo?.front?.widthPct??28); shopFields.poloBackX.value=Number(pp.polo?.back?.xPct??50); shopFields.poloBackY.value=Number(pp.polo?.back?.yPct??36); shopFields.poloBackW.value=Number(pp.polo?.back?.widthPct??50);
  shopFields.hoodieFrontX.value=Number(pp.hoodie?.front?.xPct??68); shopFields.hoodieFrontY.value=Number(pp.hoodie?.front?.yPct??22); shopFields.hoodieFrontW.value=Number(pp.hoodie?.front?.widthPct??36); shopFields.hoodieBackX.value=Number(pp.hoodie?.back?.xPct??50); shopFields.hoodieBackY.value=Number(pp.hoodie?.back?.yPct??34); shopFields.hoodieBackW.value=Number(pp.hoodie?.back?.widthPct??78);
  fillPrintData(template); updateLogoPreview(); renderMotifsEditor(); refreshPositionEditor(); previewShopBtn.hidden=true; setShopState("Master übernommen: Sortiment, Preise und Druckpositionen. Name eintragen, Artikel bei Bedarf abschalten, speichern."); renderShopList();
  if(shopFields.followMasterTemplate) shopFields.followMasterTemplate.checked=true;
  syncTemplateBar("",template);
});
shopFields.name.addEventListener("blur",()=>{ if(!selectedShopId && !shopFields.id.value) shopFields.id.value=slugify(shopFields.name.value); });

function buildShopConfig(){
  const id=slugify(shopFields.id.value); if(!id) throw new Error("Bitte eine gültige Shop-ID eingeben.");
  const name=shopFields.name.value.trim(); if(!name) throw new Error("Bitte einen Shopnamen eingeben.");
  const type=shopFields.type.value; const old=deepClone(selectedShopOriginal||{});
  const features={...(old.features||{}),layout:id==="hansa"?"simple":type==="designer"?"designer":type==="motifs"?"compact":"simple",motifMode:type==="designer"?"mixed":type==="motifs"?"multiple":"single",allowCustomerUpload:shopFields.allowUpload.checked,allowText:shopFields.allowText.checked,allowMoveMotif:shopFields.allowMove.checked,allowResizeMotif:shopFields.allowResize.checked,allowRotateMotif:shopFields.allowRotate.checked,allowBackDesign:shopFields.allowBack.checked,allowMotifColor:true,showShirtColorPicker:shopFields.showShirtColors.checked,showMotifPicker:shopFields.showMotifs.checked,showMotifColorPicker:shopFields.showMotifColors.checked,showPrices:shopFields.showPrices.checked,showNexaroBranding:shopFields.showNexaroBranding.checked,autoSelectSingleMotif:type==="simple",maxUploadMB:8,previewMode:shopFields.previewMode.value||"single"};
  const cfg={...old,customerId:id,customerName:name,pageTitle:old.pageTitle||`${name} – T-Shirt Shop`,brandTitle:old.brandTitle!==undefined?old.brandTitle:name,brandSubtitle:shopFields.subtitle.value.trim(),designerHeading:shopFields.heading.value.trim()||"Shirt gestalten",designerIntro:shopFields.intro.value.trim(),accentColor:shopFields.accent.value,logoFile:workingLogo||old.logoFile||"shop-logo.png",logoHeight:Number(shopFields.logoHeight.value)||90,shirtPrice:Number(shopFields.price.value)||0,currency:"EUR",orderEmail:shopFields.email.value.trim()||CENTRAL.orderEmail||"shirtzentrale@gmail.com",orderSubject:`Neue ${name} T-Shirt Bestellung`,customerExtraFieldLabel:old.customerExtraFieldLabel||"Team / Abteilung",customerExtraFieldName:old.customerExtraFieldName||"Team / Abteilung",orderPrefix:(shopFields.prefix.value.trim()||id.slice(0,3)).toUpperCase(),shopType:type,active:shopFields.active.checked,features,motifs:workingMotifs.filter(m=>m.name||m.file).map((m,i)=>({id:m.id||`motiv${i+1}`,name:m.name||`Motiv ${i+1}`,file:m.file||"",...(m.preserveColors?{preserveColors:true}:{})}))};
  cfg.priceVisibilityVersion=1;
  if(id==="_master"){ cfg.isMasterTemplate=true; cfg.templateVersion=Math.max(1,Number(old.templateVersion)||1); }
  else {
    delete cfg.isMasterTemplate;
    if(!cfg.templateSource) cfg.templateSource="_master";
    cfg.followMasterTemplate=!!shopFields.followMasterTemplate?.checked;
  }
  const fsRaw=shopFields.fixedShirtName.value.trim(), fsn=cleanVisibleColorName(fsRaw), fmn=shopFields.fixedMotifName.value.trim(); if(fsn) cfg.fixedShirtColor={id:slugify(fsn),name:fsRaw||fsn,color:shopFields.fixedShirtHex.value}; else delete cfg.fixedShirtColor; if(fmn) cfg.fixedMotifColor={name:fmn,color:shopFields.fixedMotifHex.value}; else delete cfg.fixedMotifColor;
  cfg.fixedPrint={
    front:{enabled:shopFields.fixedFrontEnabled.checked,motifId:shopFields.fixedFrontMotif.value||"motiv1",position:shopFields.fixedFrontPosition.value||"left-chest",size:shopFields.fixedFrontSize.value||"small",topPct:Math.max(10,Math.min(70,Number(shopFields.fixedFrontTop.value)||24)),sidePct:Math.max(15,Math.min(50,Number(shopFields.fixedFrontSide.value)||32))},
    back:{enabled:shopFields.fixedBackEnabled.checked,motifId:shopFields.fixedBackMotif.value||"motiv1",position:shopFields.fixedBackPosition.value||"center",size:shopFields.fixedBackSize.value||"large",topPct:Math.max(10,Math.min(70,Number(shopFields.fixedBackTop.value)||36))}
  };
  const clamp=(v,min,max,fallback)=>{const n=Number(v);return Math.max(min,Math.min(max,Number.isFinite(n)?n:fallback));};
  cfg.productPrint={
    ...(workingProductPrint||{}),
    tshirt:{front:{xPct:clamp(shopFields.tshirtFrontX.value,-20,120,68),yPct:clamp(shopFields.tshirtFrontY.value,-20,120,20),widthPct:clamp(shopFields.tshirtFrontW.value,5,110,28)},back:{xPct:clamp(shopFields.tshirtBackX.value,-20,120,50),yPct:clamp(shopFields.tshirtBackY.value,-20,120,36),widthPct:clamp(shopFields.tshirtBackW.value,5,110,50)}},
    polo:{front:{xPct:clamp(shopFields.poloFrontX.value,-20,120,68),yPct:clamp(shopFields.poloFrontY.value,-20,120,22),widthPct:clamp(shopFields.poloFrontW.value,5,110,28)},back:{xPct:clamp(shopFields.poloBackX.value,-20,120,50),yPct:clamp(shopFields.poloBackY.value,-20,120,36),widthPct:clamp(shopFields.poloBackW.value,5,110,50)}},
    hoodie:{front:{xPct:clamp(shopFields.hoodieFrontX.value,-20,120,68),yPct:clamp(shopFields.hoodieFrontY.value,-20,120,22),widthPct:clamp(shopFields.hoodieFrontW.value,5,110,36)},back:{xPct:clamp(shopFields.hoodieBackX.value,-20,120,50),yPct:clamp(shopFields.hoodieBackY.value,-20,120,34),widthPct:clamp(shopFields.hoodieBackW.value,5,110,78)}}
  };
  cfg.printData=collectPrintData();
  cfg.productMotifModes={...workingProductMotifModes};
  cfg.productionFile=(productionFileUrl?.value||"").trim();
  const sourceProducts = workingProducts.length ? workingProducts : (Array.isArray(old.products) ? old.products : []);
  const productCatalog=sourceProducts.map(product=>({...product,price:Math.max(0,Number(product.price)||0),enabled:product.enabled!==false}));
  if(!productCatalog.some(product=>product.enabled)) throw new Error("Bitte mindestens ein Textil für den Shop aktivieren.");
  cfg.products=productCatalog;
  if(id === "tg-solingen") cfg.hoodieSizingVersion = 5;
  if(cfg.fixedPrint.back.enabled) cfg.features.allowBackDesign=true;
  return cfg;
}

saveShopBtn.addEventListener("click",async()=>{
  try{
    const cfg=buildShopConfig(); saveShopBtn.disabled=true; setShopState("Wird gespeichert …");
    const serialized=JSON.stringify(cfg); if(serialized.length>900000) throw new Error("Shopdaten sind zu groß. Bitte kleinere Motivbilder verwenden.");
    await db.collection("shops").doc(cfg.customerId).set(cfg,{merge:false});
    let synced=0;
    if(cfg.customerId==="_master" && shopFields.pushMasterOnSave?.checked){
      cfg.templateVersion=Math.max(1,Number(cfg.templateVersion)||1)+1;
      await db.collection("shops").doc("_master").set({templateVersion:cfg.templateVersion},{merge:true});
      for(const [id,shop] of shopConfigs.entries()){
        if(id==="_master" || id.startsWith("_") || shop.followMasterTemplate===false) continue;
        const next={...shop,products:deepClone(cfg.products||[]),productPrint:deepClone(cfg.productPrint||{}),printData:deepClone(cfg.printData||{}),shirtPrice:cfg.shirtPrice,templateSource:"_master",masterTemplateVersion:cfg.templateVersion};
        await db.collection("shops").doc(id).set(next,{merge:false});
        shopConfigs.set(id,next);
        synced+=1;
      }
    }
    selectedShopId=cfg.customerId; selectedShopOriginal=deepClone(cfg); shopConfigs.set(cfg.customerId,deepClone(cfg)); shopFields.id.disabled=true; previewShopBtn.hidden=false; previewShopBtn.href=`/?shop=${encodeURIComponent(cfg.customerId)}`; shopEditorTitle.textContent=cfg.customerName; renderShopList(); setShopState(synced?`✓ Vorlage gespeichert und an ${synced} Shop${synced===1?"":"s"} übergeben.`:"✓ Gespeichert – Änderungen sind sofort live.","ok");
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
    <label class="v284-shop-select-wrap v2949-shop-select-hidden"><span>Shop</span><select id="v284ShopSelect"><option>Shop wählen</option></select></label>
    <section class="v2949-shops-folder" aria-label="Shops">
      <button type="button" id="v2949ShopsToggle" class="v2949-shops-toggle" aria-expanded="true">
        <span class="v2949-folder-icon">▾</span><strong>Shops</strong><span id="v2949ShopCount" class="v2949-shop-count">0</span>
      </button>
      <div id="v2959ShopTypes" class="v2959-shop-types" role="tablist" aria-label="Shop-Typen">
        <button type="button" class="v2959-shop-type v2959-simple active" data-shop-type="simple" role="tab" aria-selected="true">Simple</button>
        <button type="button" class="v2959-shop-type v2959-motifs" data-shop-type="motifs" role="tab" aria-selected="false">Motive</button>
        <button type="button" class="v2959-shop-type v2959-designer" data-shop-type="designer" role="tab" aria-selected="false">Designer</button>
      </div>
      <div id="v2949ShopsTree" class="v2949-shops-tree"></div>
    </section>
    <nav class="v284-nav" aria-label="Admin Navigation">
      <button type="button" data-main="shops" class="active"><span>⚙</span>Shop Einstellungen</button>
      <button type="button" data-main="orders"><span>▣</span>Bestellungen</button>
    </nav>
    <div class="v284-side-bottom">
      <button type="button" id="v284NewShop">＋ Neuer Shop</button>
      <button type="button" id="v284Logout">↪ Abmelden</button>
    </div>`;
  document.body.insertBefore(sidebar,shell);

  const shopSelect=sidebar.querySelector("#v284ShopSelect");
  const shopsTree=sidebar.querySelector("#v2949ShopsTree");
  const shopsToggle=sidebar.querySelector("#v2949ShopsToggle");
  const shopCount=sidebar.querySelector("#v2949ShopCount");
  const shopTypeTabs=[...sidebar.querySelectorAll(".v2959-shop-type")];
  let activeShopType="simple";
  const SHOP_TYPE_GROUPS=[
    {key:"simple",label:"1 · SIMPLE"},
    {key:"motifs",label:"2 · MOTIVE"},
    {key:"designer",label:"3 · DESIGNER"}
  ];
  function renderV2949ShopTree(){
    if(!shopsTree) return;
    shopsTree.replaceChildren();
    const allEntries=[...shopConfigs.entries()];
    const canonicalTemplateIds=new Set(["_master","_simple","_motifs","_designer"].filter(id=>shopConfigs.has(id)));
    const entries=allEntries.filter(([id,cfg])=>{
      if(canonicalTemplateIds.has(id)) return true;
      const n=String(cfg?.customerName||"").trim().toLowerCase();
      if(n==="vorlage simple" && canonicalTemplateIds.has("_simple")) return false;
      if(n==="vorlage motive" && canonicalTemplateIds.has("_motifs")) return false;
      if(n==="vorlage designer" && canonicalTemplateIds.has("_designer")) return false;
      return true;
    }).sort((a,b)=>String(a[1].customerName||a[0]).localeCompare(String(b[1].customerName||b[0]),"de"));
    if(shopCount) shopCount.textContent=String(entries.length);
    const group=SHOP_TYPE_GROUPS.find(g=>g.key===activeShopType) || SHOP_TYPE_GROUPS[0];
    const matches=entries
      .filter(([,cfg])=>(cfg.shopType||"simple")===group.key)
      .sort((a,b)=>{
        const isTemplateA=a[0].startsWith("_") || String(a[1]?.customerName||"").trim().toLowerCase().startsWith("vorlage ");
        const isTemplateB=b[0].startsWith("_") || String(b[1]?.customerName||"").trim().toLowerCase().startsWith("vorlage ");
        if(isTemplateA!==isTemplateB) return isTemplateA?-1:1;
        return String(a[1]?.customerName||a[0]).localeCompare(String(b[1]?.customerName||b[0]),"de");
      });
    const block=document.createElement("div");
    block.className=`v2949-shop-group v2959-active-group v2959-group-${group.key}`;
    matches.forEach(([id,cfg])=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="v2949-shop-item";
      btn.dataset.shopId=id;
      btn.classList.toggle("active",id===selectedShopId);
      const name=document.createElement("span");
      name.className="v2949-shop-item-name";
      name.textContent=cfg.customerName||id;
      const meta=document.createElement("small");
      const normalizedName=String(cfg?.customerName||"").trim().toLowerCase();
      const isTemplate=id.startsWith("_") || normalizedName.startsWith("vorlage ") || cfg.isMasterTemplate;
      meta.textContent=id==="_master"||cfg.isMasterTemplate?"Vorlage":(isTemplate?"":(cfg.active===false?"Inaktiv":"Aktiv"));
      if(isTemplate) meta.setAttribute("aria-hidden","true");
      btn.append(name,meta);
      btn.addEventListener("click",()=>{
        const original=list?.querySelector(`button[data-shop-id="${CSS.escape(id)}"]`);
        original?.click();
        switchAdminTab("shops");
        setNavActive("shops");
        renderV2949ShopTree();
        if(window.matchMedia("(max-width:720px)").matches){
          sidebar.classList.remove("mobile-menu-open");
          if(mobileMenuBtn){ mobileMenuBtn.setAttribute("aria-expanded","false"); mobileMenuBtn.textContent="☰"; }
        }
      });
      block.appendChild(btn);
    });
    if(!matches.length){
      const empty=document.createElement("div");
      empty.className="v2959-shop-empty";
      empty.textContent="Noch kein Shop in dieser Kategorie";
      block.appendChild(empty);
    }
    shopsTree.appendChild(block);
    shopTypeTabs.forEach(tab=>{
      const active=tab.dataset.shopType===activeShopType;
      tab.classList.toggle("active",active);
      tab.setAttribute("aria-selected",String(active));
    });
  }

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
    renderV2949ShopTree();
  };
  shopTypeTabs.forEach(tab=>tab.addEventListener("click",()=>{
    activeShopType=tab.dataset.shopType||"simple";
    renderV2949ShopTree();
  }));

  shopsToggle?.addEventListener("click",()=>{
    const collapsed=sidebar.classList.toggle("v2949-shops-collapsed");
    shopsToggle.setAttribute("aria-expanded",String(!collapsed));
    const icon=shopsToggle.querySelector(".v2949-folder-icon");
    if(icon) icon.textContent=collapsed?"▸":"▾";
  });
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

  let v2959InitialMobileStartDone=false;
  const dashObserver=new MutationObserver(()=>{
    sidebar.hidden=dashboardEl.hidden;
    if(!dashboardEl.hidden){
      if(window.matchMedia("(max-width:720px)").matches && !v2959InitialMobileStartDone){
        v2959InitialMobileStartDone=true;
        switchAdminTab("shops");
        setNavActive("shops");
        activeShopType="simple";
        sidebar.classList.add("mobile-menu-open");
        if(mobileMenuBtn){ mobileMenuBtn.setAttribute("aria-expanded","true"); mobileMenuBtn.textContent="×"; }
      } else {
        setNavActive(ordersTab.hidden?"shops":"orders");
      }
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
  if(production){ const body=production.querySelector(".accordion-body")||production; card("Druckvorgaben","production",body,false); }
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
    const selectedMotifId=shopFields.fixedFrontMotif?.value||workingMotifs?.[0]?.id||'';
    const motif=workingMotifs?.find(item=>item.id===selectedMotifId)||workingMotifs?.[0];
    const motifSrc=motif?.file?safeAssetUrl(motif.file,currentAssetSlug()):"";
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
      if(p==="hoodie"&&s==="back") return n<60?"small":n<70?"medium":"large";
      if(s==="front") return n<24?"small":n<33?"medium":"large";
      return n<44?"small":n<56?"medium":"large";
    };
    const sizeValue=(p,s,label)=>{
      if(p==="hoodie"&&s==="front") return label==="small"?30:label==="medium"?36:42;
      if(p==="hoodie"&&s==="back") return label==="small"?58:label==="medium"?68:78;
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
  if(display){
    display.classList.add('v2853-display');
    basic.body.appendChild(display);
  }
  if(products){
    products.classList.add('v2853-products');
    basic.body.appendChild(products);
  }
  left.appendChild(basic.card);

  const appearance=makeCard('Darstellung & Farben','v2853-appearance-card v2869-appearance-colors');
  let detachedAccent=null;
  if(false){
    detachedAccent=null;
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
    const motifSrc=motif?.file?safeAssetUrl(motif.file,currentAssetSlug()):'';
    const motifName=motif?.name||'Motiv';
    const shirtHex=(shopFields.fixedShirtHex?.value||'#0758b2').trim();
    const productionHref=(productionFileUrl?.value||'').trim();
    const customProducts=(workingProducts||[])
      .filter(item=>item&&item.enabled!==false&&!['tshirt','polo','hoodie'].includes(item.id))
      .map(item=>({key:item.id,name:item.name||item.id,tone:'v3030-product-custom',front:getPositionFieldSet(item.id,'front').w,back:getPositionFieldSet(item.id,'back').w}));
    const products=[
      {key:'tshirt',name:'T-Shirt',tone:'v2862-product-tshirt',front:shopFields.tshirtFrontW,back:shopFields.tshirtBackW},
      {key:'polo',name:'Polo-Shirt',tone:'v2862-product-polo',front:shopFields.poloFrontW,back:shopFields.poloBackW},
      {key:'hoodie',name:'Hoodie',tone:'v2862-product-hoodie',front:shopFields.hoodieFrontW,back:shopFields.hoodieBackW},
      ...customProducts
    ];
    const sizeLabel=(p,s,w)=>{
      const n=Number(w?.value||0);
      if(p==='hoodie'&&s==='front') return n<33?'small':n<40?'medium':'large';
      if(p==='hoodie'&&s==='back') return n<60?'small':n<70?'medium':'large';
      if(s==='front') return n<24?'small':n<33?'medium':'large';
      return n<44?'small':n<56?'medium':'large';
    };
    const sizeValue=(p,s,label)=>{
      if(p==='hoodie'&&s==='front') return label==='small'?30:label==='medium'?36:42;
      if(p==='hoodie'&&s==='back') return label==='small'?58:label==='medium'?68:78;
      if(s==='front') return label==='small'?20:label==='medium'?28:36;
      return label==='small'?38:label==='medium'?50:60;
    };
    const optionHtml=(p,s,w)=>`<option value="small" ${sizeLabel(p,s,w)==='small'?'selected':''}>Klein</option><option value="medium" ${sizeLabel(p,s,w)==='medium'?'selected':''}>Mittel</option><option value="large" ${sizeLabel(p,s,w)==='large'?'selected':''}>Groß</option>`;
    const motifDownload=motifSrc?`<a class="v2863-download-btn" href="${motifSrc}" download>Motivdatei herunterladen</a>`:'';
    const productionDownload=productionHref?`<a class="v2863-download-btn secondary" href="${productionHref}" target="_blank" rel="noopener">Produktionsdatei öffnen</a>`:'';
    const motifModeOptions=productId=>{
      const value=workingProductMotifModes[productId]||'normal';
      return `<option value="normal" ${value==='normal'?'selected':''}>Normales Vereinslogo</option><option value="patch" ${value==='patch'?'selected':''}>3D-Patch</option><option value="both" ${value==='both'?'selected':''}>Kunde kann wählen</option>`;
    };
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
    const sharedMotif=`<div class="v2862-shared-motif v2863-shared-motif"><div class="v2863-motif-meta"><strong>Gemeinsames Motiv</strong><span>Die Motivart wird unten für jeden Artikel einzeln festgelegt.</span><div class="v2863-downloads">${motifDownload}${sizeInfo}${productionDownload}</div></div><span class="v2861-motif-preview v2863-shirt-bg" style="--shirt-preview-bg:${shirtHex}" title="${motifName}">${motifSrc?`<img src="${motifSrc}" alt="${motifName}">`:'–'}</span></div>`;
    const sizeBadge=(productKey,side)=>{
      const dims=side==='front'
        ? fmtSizeMm(printDataFields.front.width,printDataFields.front.height)
        : fmtSizeMm(printDataFields.back.width,printDataFields.back.height);
      return `<span class="v2917-size-badge v2921-inline-size" aria-label="Druckgröße ${side==='front'?'Vorderseite':'Rückseite'}">${dims}</span>`;
    };
    table.innerHTML=sharedMotif+'<div class="v2862-product-groups">'+products.map(item=>`<section class="v2862-product-group ${item.tone}" data-product="${item.key}"><div class="v2862-product-head"><strong>${item.name}</strong><label class="v3030-product-motif"><span>Motivart</span><select class="v3030-product-motif-select" data-product="${item.key}">${motifModeOptions(item.key)}</select></label></div><div class="v2862-side-row"><span>Vorderseite</span><select class="v2856-size-select" data-product="${item.key}" data-side="front">${optionHtml(item.key,'front',item.front)}</select>${sizeBadge(item.key,'front')}<button type="button" class="v284-edit-print v2856-position-btn" data-product="${item.key}" data-side="front">Positionieren</button></div><div class="v2862-side-row"><span>Rückseite</span><select class="v2856-size-select" data-product="${item.key}" data-side="back">${optionHtml(item.key,'back',item.back)}</select>${sizeBadge(item.key,'back')}<button type="button" class="v284-edit-print v2856-position-btn" data-product="${item.key}" data-side="back">Positionieren</button></div></section>`).join('')+'</div>';
    table.querySelectorAll('.v3030-product-motif-select').forEach(select=>select.addEventListener('change',()=>{
      const next=select.value;
      if((next==='patch'||next==='both')&&!workingMotifs.some(item=>item.id==='tus-3d-patch')){
        if(workingMotifs.length>=4){alert('Es sind bereits 4 Motive vorhanden. Bitte zuerst ein Motiv entfernen.');renderMergedPrintTable();return;}
        workingMotifs.push({id:'tus-3d-patch',name:'TuS 3D-Patch',file:'/tus-3d-patch.png?v=30.3.19',preserveColors:true});
        renderMotifsEditor();
      }
      workingProductMotifModes[select.dataset.product]=next;
      setShopState('Motivart für '+(products.find(item=>item.key===select.dataset.product)?.name||'Artikel')+' geändert – jetzt oben Speichern klicken.','ok');
      renderMergedPrintTable();
    }));
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
    if(colorName) colorName.textContent=cleanVisibleColorName(document.getElementById('fixedShirtName')?.value) || 'Royal Blue';
    if(colorDot) colorDot.style.background=document.getElementById('fixedShirtHex')?.value || '#0758b2';
  }
  product?.addEventListener('change',refreshReferenceMeta);
  side?.addEventListener('change',refreshReferenceMeta);
  document.getElementById('fixedShirtName')?.addEventListener('input',refreshReferenceMeta);
  document.getElementById('fixedShirtHex')?.addEventListener('input',refreshReferenceMeta);
  refreshReferenceMeta();

  document.getElementById('v284Sidebar')?.classList.remove('v2853-dark-sidebar');
  document.getElementById('v284Sidebar')?.classList.add('v32-sidebar');

  // Versionsbadge eindeutig aktualisieren.
  document.querySelectorAll('.v2849-version').forEach(el=>el.textContent='v30.3.53');
})();

// ============================================================
// v32 – Admin aufräumen: Shop / Design / Druck
// ============================================================
(function initV32AdminStructure(){
  function boot(){
  const workspace=document.getElementById("v2853Workspace");
  const editor=document.querySelector(".shop-editor-panel");
  if(!workspace || !editor) return false;
  if(document.getElementById("v32ShopNav")) return true;

  document.body.classList.add("v32-admin");
  document.getElementById("v284Sidebar")?.classList.remove("v2853-dark-sidebar");
  document.getElementById("v284Sidebar")?.classList.add("v32-sidebar");

  const nav=document.createElement("nav");
  nav.id="v32ShopNav";
  nav.setAttribute("aria-label","Shop-Einstellungen");
  nav.innerHTML=`
    <button type="button" data-v32="shop" class="active">Shop &amp; Sortiment</button>
    <button type="button" data-v32="design">Design &amp; Farben</button>
    <button type="button" data-v32="print">Motiv &amp; Druck</button>`;

  const hint=document.createElement("p");
  hint.className="v32-hint";
  hint.id="v32Hint";
  hint.textContent="Stammdaten, Funktionen und Preise. Die Vorschau bleibt rechts sichtbar.";

  const head=editor.querySelector(":scope > .panel-head");
  if(head) head.after(nav);
  else workspace.before(nav);
  nav.after(hint);

  const left=workspace.querySelector(".v2853-left");
  const right=workspace.querySelector(".v2853-right");
  const bottom=workspace.querySelector(".v2853-bottom");

  left?.querySelector(".v2853-basic-card")?.classList.add("v32-view-shop");
  left?.querySelector(".v2853-appearance-card")?.classList.add("v32-view-design");
  right?.classList.add("v32-view-print");
  if(window.matchMedia("(min-width:721px)").matches) right?.classList.add("v32-view-shop");
  bottom?.classList.add("v32-view-print");
  workspace.querySelectorAll(".v2853-print-card,.v284-card[data-card='production'],.v284-card[data-card='fixed'],.v284-card[data-card='functions']").forEach(el=>{
    el.classList.add("v32-view-print");
  });

  const hints={
    shop:"Stammdaten, Funktionen und Preise. Die Textil-Vorschau bleibt rechts.",
    design:"Logo, Texte, Shirtfarben und Druckfarben für diesen Shop.",
    print:"Motiv positionieren, Größe und Produktionsdaten."
  };

  function setView(name){
    workspace.dataset.v32View=name;
    nav.querySelectorAll("button").forEach(btn=>btn.classList.toggle("active",btn.dataset.v32===name));
    hint.textContent=hints[name]||"";
  }
  nav.addEventListener("click",e=>{
    const btn=e.target.closest("button[data-v32]");
    if(btn) setView(btn.dataset.v32);
  });
  setView("shop");
  document.querySelectorAll(".v2849-version").forEach(el=>el.textContent="v30.3.56");
  return true;
  }
  if(!boot()){
    [50,200,600,1500,3000].forEach(ms=>setTimeout(boot,ms));
    document.addEventListener("DOMContentLoaded",boot);
  }
})();
