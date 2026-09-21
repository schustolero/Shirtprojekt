// MASTER-v27 – Shopkonfiguration zuerst aus Firestore, Datei nur als Fallback.
(function(){
  const central = window.CENTRAL_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const fromQuery = (params.get("shop") || "").trim();
  const parts = window.location.pathname.split("/").filter(Boolean);
  const ignored = new Set(["admin.html", "danke.html", "index.html"]);
  const fromPath = parts.length && !ignored.has(parts[0]) ? parts[0] : "";
  const slug = fromQuery || fromPath || central.defaultShop || "_simple";
  window.SHOP_SLUG = slug;

  const templateDemos = {
    _simple: { customerName:"Vorlage Simple", pageTitle:"Vorlage Simple – T-Shirt Shop", brandTitle:"Vorlage Simple", brandSubtitle:"Einfach auswählen und bestellen", shopType:"simple", motifs:[{id:"motiv1",name:"NOVA Athletic",file:"demo-motiv-1.png?v=30.1.85"}] },
    _motifs: { customerName:"Vorlage Motive", pageTitle:"Vorlage Motive – T-Shirt Shop", brandTitle:"Vorlage Motive", brandSubtitle:"Mehrere Motive zur Auswahl", shopType:"motifs", fixedShirtColor:{id:"azure-blue",name:"Azure Blue||default=azure-blue",color:"#147fae"}, motifs:[{id:"motiv1",name:"NOVA Wappen",file:"demo-motiv-1.png?v=30.1.85"},{id:"motiv2",name:"NOVA Dynamik",file:"demo-motiv-2.png?v=30.1.85"}] },
    _designer: { customerName:"Vorlage Designer", pageTitle:"Vorlage Designer – T-Shirt Shop", brandTitle:"Vorlage Designer", brandSubtitle:"Dein Textil frei gestalten", shopType:"designer", motifs:[{id:"motiv1",name:"NOVA Athletic",file:"demo-motiv-1.png?v=30.1.85"}] }
  };
  function normalizeTemplateDemo(config){
    const template = templateDemos[slug];
    if (!template) return config;
    return { ...config, ...template, customerId:slug, logoFile:"/dein-logo.svg?v=30.1.85", logoHeight:90, active:true };
  }

  window.shopAssetUrl = function(file){
    if (!file) return "";
    if (/^(https?:)?\/\//i.test(file) || /^(data|blob):/i.test(file) || file.startsWith("/")) return file;
    return `/shops/${encodeURIComponent(slug)}/${file}`;
  };

  function loadFileFallback(callback){
    const script = document.createElement("script");
    script.src = `/shops/${encodeURIComponent(slug)}/shop-config.js?v=30.1.85`;
    script.onload = () => {
      window.SHOP_CONFIG = normalizeTemplateDemo(window.SHOP_CONFIG || {});
      callback && callback(window.SHOP_CONFIG);
    };
    script.onerror = () => {
      console.error(`Shop-Konfiguration nicht gefunden: ${slug}`);
      document.body.innerHTML = `<main style="font-family:Arial,sans-serif;padding:40px"><h1>Shop nicht gefunden</h1><p>Für <strong>${slug}</strong> wurde noch keine Kundenkonfiguration angelegt.</p></main>`;
    };
    document.head.appendChild(script);
  }

  window.loadShopConfig = async function(callback){
    try{
      if (window.firebase && firebase.firestore) {
        const snap = await firebase.firestore().collection("shops").doc(slug).get();
        if (snap.exists) {
          const data = snap.data() || {};
          const seed = (central.seedShops && central.seedShops[slug]) || {};
          const seedProducts = Array.isArray(seed.products) ? seed.products : [];
          const dataProducts = Array.isArray(data.products) ? data.products : [];
          const productMap = new Map(seedProducts.map(p => [p.id, {...p}]));
          dataProducts.forEach(p => productMap.set(p.id, {...(productMap.get(p.id)||{}), ...p}));
          const merged = {
            ...seed,
            ...data,
            products: [...productMap.values()],
            features: { ...(seed.features || {}), ...(data.features || {}) },
            productPrint: {
              ...(seed.productPrint || {}), ...(data.productPrint || {}),
              tshirt: { ...((seed.productPrint||{}).tshirt||{}), ...((data.productPrint||{}).tshirt||{}) },
              polo: { ...((seed.productPrint||{}).polo||{}), ...((data.productPrint||{}).polo||{}) },
              hoodie: { ...((seed.productPrint||{}).hoodie||{}), ...((data.productPrint||{}).hoodie||{}) }
            },
            printData: {
              ...(seed.printData || {}), ...(data.printData || {}),
              tshirt: { ...((seed.printData||{}).tshirt||{}), ...((data.printData||{}).tshirt||{}) },
              polo: { ...((seed.printData||{}).polo||{}), ...((data.printData||{}).polo||{}) },
              hoodie: { ...((seed.printData||{}).hoodie||{}), ...((data.printData||{}).hoodie||{}) }
            },
            fixedPrint: {
              ...(seed.fixedPrint || {}),
              ...(data.fixedPrint || {}),
              front: { ...((seed.fixedPrint || {}).front || {}), ...((data.fixedPrint || {}).front || {}) },
              back: { ...((seed.fixedPrint || {}).back || {}), ...((data.fixedPrint || {}).back || {}) }
            }
          };
          // TG Solingen: feste Artikelnummern sowie aktuelle VK-/EK-Preise.
          // Diese Werte haben bewusst Vorrang vor älteren Firestore-Produktpreisen.
          if (slug === "tg-solingen") {
            // v28.5.2: Einmalige Migration der bisherigen Hoodie-Standardgröße.
            // Danach kann die Größe im Admin frei über den Regler gespeichert werden.
            if ((data.hoodieSizingVersion || 0) < 5) {
              merged.productPrint = merged.productPrint || {};
              merged.productPrint.hoodie = merged.productPrint.hoodie || {};
              merged.productPrint.hoodie.front = { ...(merged.productPrint.hoodie.front || {}), widthPct: 36 };
              merged.productPrint.hoodie.back = { ...(merged.productPrint.hoodie.back || {}), widthPct: 78 };
              merged.hoodieSizingVersion = 5;
            }
            const commercial = {
              tshirt: { articleNo: "F140", price: 15, purchasePrice: 2.60 },
              polo: { articleNo: "F502", price: 25, purchasePrice: 5.61 },
              hoodie: { articleNo: "F421", price: 30, purchasePrice: 9.90 }
            };
            merged.products = (merged.products || []).map(product => ({
              ...product,
              ...(commercial[product.id] || {})
            }));
          } else if (slug === "hansa") {
            // Hansa nutzt bewusst denselben kompakten Grundaufbau wie Solingen,
            // behält aber seine eigene Farb- und Motivauswahl.
            merged.features = { ...(merged.features || {}), layout: "simple", showResetButton: false };
            const order={hoodie:0,tshirt:1,polo:2};
            merged.products=(merged.products||[]).sort((a,b)=>(order[a.id]??99)-(order[b.id]??99));
            merged.motifs=(merged.motifs||[]).map(motif=>
              motif.id==="script"||/^script$/i.test(String(motif.name||""))?{...motif,name:"Allstar"}:motif
            );
            if ((data.hansaDefaultsVersion || 0) < 1) {
              merged.fixedShirtColor={id:"black",name:"Black||default=black",color:"#111015"};
              merged.fixedMotifColor={name:"Yellow",color:"#ffe600"};
              merged.defaultMotifId="college";
              merged.hansaDefaultsVersion=1;
            }
          }

          const finalConfig = normalizeTemplateDemo(merged);
          if (finalConfig.active === false) {
            document.body.innerHTML = `<main style="font-family:Arial,sans-serif;padding:40px"><h1>Shop derzeit nicht aktiv</h1><p>Dieser Shop ist momentan deaktiviert.</p></main>`;
            return;
          }
          window.SHOP_CONFIG = finalConfig;
          callback && callback(finalConfig);
          return;
        }
      }
    } catch(err) {
      console.warn("Firestore-Shopkonfiguration konnte nicht geladen werden – Dateifallback wird verwendet.", err);
    }
    loadFileFallback(callback);
  };
})();
