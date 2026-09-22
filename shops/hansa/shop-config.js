window.SHOP_CONFIG = {
  customerId: "hansa",
  customerName: "Hansa Berufskolleg",
  pageTitle: "Hansa Berufskolleg – T-Shirt Shop",
  brandTitle: "Hansa Berufskolleg",
  brandSubtitle: "T-Shirt Konfigurator",
  designerHeading: "Shirt gestalten",
  designerIntro: "Motiv auswählen, Farbe bestimmen und Shirt konfigurieren.",
  accentColor: "#1f3f76",
  logoFile: "shop-logo.jpg",
  logoHeight: 90,
  shirtPrice: 15, currency: "EUR",
  products: [
    { id: "hoodie", name: "Hoodie", articleNo: "F421", price: 30, purchasePrice: 9.90, printCost: 1.50, frontTemplate: "hoodie-front-template.png", backTemplate: "hoodie-back-template.png", enabled: true },
    { id: "tshirt", name: "T-Shirt", articleNo: "F140", price: 15, purchasePrice: 2.60, printCost: 1.50, frontTemplate: "shirt-front-template.png", backTemplate: "shirt-back-template.png", enabled: true },
    { id: "bcwu01w", name: "Sweatshirt", articleNo: "BCWU01W", price: 23, printCost: 1.50, frontTemplate: "/sweatshirt-front-template.png", backTemplate: "/sweatshirt-back-template.png", enabled: true, allowedShirtColorIds: ["white","black","navy","red","royal-blue","bottle-green","heather-grey"], defaultShirtColorId: "black", shirtColorLabels: { white: "White", black: "Black Pure", navy: "Navy Blue", red: "Red", "royal-blue": "Royal", "bottle-green": "Forest Green", "heather-grey": "Heather Grey" }, sizesByColor: { white: ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"], black: ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"], navy: ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"], red: ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"], "royal-blue": ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"], "heather-grey": ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"], "bottle-green": ["XS","S","M","L","XL","2XL","3XL"] } },
    { id: "polo", name: "Polo-Shirt", articleNo: "F502", price: 25, purchasePrice: 5.61, printCost: 1.50, frontTemplate: "polo-front-template.png", backTemplate: "polo-back-template.png", enabled: false }
  ],
  productPrint: { bcwu01w: { front: { xPct: 50, yPct: 31, widthPct: 72 }, back: { xPct: 50, yPct: 36, widthPct: 50 } } },
  productMotifModes: { bcwu01w: "normal" },
  hansaSweatshirtVersion: 1,
  fixedShirtColor: { id: "black", name: "Black||default=black", color: "#111015" },
  fixedMotifColor: { name: "Yellow", color: "#ffe600" },
  defaultMotifId: "college",
  hansaDefaultsVersion: 1,
  orderEmail: "shirtzentrale@gmail.com",
  orderSubject: "Neue Hansa Berufskolleg T-Shirt Bestellung",
  customerExtraFieldLabel: "Klasse",
  customerExtraFieldName: "Klasse",
  orderPrefix: "HAN",
  shopType: "motifs",
  features: {
    layout: "simple", motifMode: "multiple",
    allowCustomerUpload: false, allowText: false,
    allowMoveMotif: false, allowResizeMotif: false, allowRotateMotif: false,
    allowBackDesign: true, allowMotifColor: true,
    showShirtColorPicker: true, showMotifPicker: true, showMotifColorPicker: true,
    showResetButton: false, showPrices: false, autoSelectSingleMotif: false, maxUploadMB: 8
  },
  hansaPriceVisibilityVersion: 2,
  motifs: [
    { id: "college", name: "College", file: "motiv-1.png" },
    { id: "script", name: "Allstar", file: "motiv-2.png" }
  ]
};
