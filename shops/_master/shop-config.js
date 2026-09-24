// Master-Shop: einzige Vorlage für neue Kundenshops (Sortiment, Preise, Druck).
window.SHOP_CONFIG = JSON.parse(JSON.stringify(window.CENTRAL_CONFIG?.seedShops?._master || {}));
