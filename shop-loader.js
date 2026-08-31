// Lädt automatisch die Kundenkonfiguration anhand der URL.
// Beispiel: /tg-solingen/ -> /shops/tg-solingen/shop-config.js
(function(){
  const central = window.CENTRAL_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const fromQuery = (params.get("shop") || "").trim();
  const parts = window.location.pathname.split("/").filter(Boolean);
  const ignored = new Set(["admin.html", "danke.html", "index.html"]);
  const fromPath = parts.length && !ignored.has(parts[0]) ? parts[0] : "";
  const slug = fromQuery || fromPath || central.defaultShop || "_template";
  window.SHOP_SLUG = slug;

  window.shopAssetUrl = function(file){
    if (!file) return "";
    if (/^(https?:)?\/\//i.test(file) || file.startsWith("/")) return file;
    return `/shops/${encodeURIComponent(slug)}/${file}`;
  };

  window.loadShopConfig = function(callback){
    const script = document.createElement("script");
    script.src = `/shops/${encodeURIComponent(slug)}/shop-config.js?v=25.1`;
    script.onload = () => callback && callback(window.SHOP_CONFIG || {});
    script.onerror = () => {
      console.error(`Shop-Konfiguration nicht gefunden: ${slug}`);
      document.body.innerHTML = `<main style="font-family:Arial,sans-serif;padding:40px"><h1>Shop nicht gefunden</h1><p>Für <strong>${slug}</strong> wurde noch keine Kundenkonfiguration angelegt.</p></main>`;
    };
    document.head.appendChild(script);
  };
})();
