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

  window.shopAssetUrl = function(file){
    if (!file) return "";
    if (/^(https?:)?\/\//i.test(file) || /^(data|blob):/i.test(file) || file.startsWith("/")) return file;
    return `/shops/${encodeURIComponent(slug)}/${file}`;
  };

  function loadFileFallback(callback){
    const script = document.createElement("script");
    script.src = `/shops/${encodeURIComponent(slug)}/shop-config.js?v=28.1`;
    script.onload = () => callback && callback(window.SHOP_CONFIG || {});
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
          const merged = {
            ...seed,
            ...data,
            features: { ...(seed.features || {}), ...(data.features || {}) },
            fixedPrint: {
              ...(seed.fixedPrint || {}),
              ...(data.fixedPrint || {}),
              front: { ...((seed.fixedPrint || {}).front || {}), ...((data.fixedPrint || {}).front || {}) },
              back: { ...((seed.fixedPrint || {}).back || {}), ...((data.fixedPrint || {}).back || {}) }
            }
          };
          if (merged.active === false) {
            document.body.innerHTML = `<main style="font-family:Arial,sans-serif;padding:40px"><h1>Shop derzeit nicht aktiv</h1><p>Dieser Shop ist momentan deaktiviert.</p></main>`;
            return;
          }
          window.SHOP_CONFIG = merged;
          callback && callback(merged);
          return;
        }
      }
    } catch(err) {
      console.warn("Firestore-Shopkonfiguration konnte nicht geladen werden – Dateifallback wird verwendet.", err);
    }
    loadFileFallback(callback);
  };
})();
