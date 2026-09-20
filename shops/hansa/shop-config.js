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
    { id: "polo", name: "Polo-Shirt", articleNo: "F502", price: 25, purchasePrice: 5.61, printCost: 1.50, frontTemplate: "polo-front-template.png", backTemplate: "polo-back-template.png", enabled: false }
  ],
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
    showResetButton: false, autoSelectSingleMotif: false, maxUploadMB: 8
  },
  motifs: [
    { id: "college", name: "College", file: "motiv-1.png" },
    { id: "script", name: "Script", file: "motiv-2.png" }
  ]
};
