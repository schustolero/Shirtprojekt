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
  if(admin) loadOrders();
  else if(user) auth.signOut();
});
