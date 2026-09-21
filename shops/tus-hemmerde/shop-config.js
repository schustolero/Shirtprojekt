window.SHOP_CONFIG = {
  customerId: "tus-hemmerde",
  customerName: "TuS Hemmerde",
  pageTitle: "TuS Hemmerde – T-Shirt Shop",
  brandTitle: "TuS Hemmerde",
  brandSubtitle: "Vereinsshirts einfach bestellen",
  designerHeading: "Dein TuS Hemmerde Shirt",
  designerIntro: "Farbe, Größe und Menge auswählen.",
  accentColor: "#e30613",
  logoFile: "shop-logo.png",
  logoHeight: 100,
  shirtPrice: 10,
  currency: "EUR",
  orderEmail: "shirtzentrale@gmail.com",
  orderSubject: "Neue TuS Hemmerde T-Shirt Bestellung",
  customerExtraFieldLabel: "Mannschaft / Abteilung",
  customerExtraFieldName: "Mannschaft / Abteilung",
  orderPrefix: "TUS",
  shopType: "simple",
  active: true,
  fixedShirtColor: { id: "white", name: "White||default=white", color: "#ffffff" },
  fixedMotifColor: { name: "Red||default=Red||allowed=%5B%22Red%22%5D", color: "#B62820" },
  defaultMotifId: "vereinslogo",
  products: [
    { id: "tshirt", name: "T-Shirt", articleNo: "F140", price: 10, purchasePrice: 2.60, printCost: 1.50, frontTemplate: "shirt-front-template.png", backTemplate: "shirt-back-template.png", enabled: true },
    { id: "polo", name: "Polo-Shirt", articleNo: "F502", price: 25, purchasePrice: 5.61, printCost: 1.50, frontTemplate: "polo-front-template.png", backTemplate: "polo-back-template.png", enabled: false },
    { id: "hoodie", name: "Hoodie", articleNo: "F421", price: 30, purchasePrice: 9.90, printCost: 1.50, frontTemplate: "hoodie-front-template.png", backTemplate: "hoodie-back-template.png", enabled: false }
  ],
  features: {
    layout: "simple",
    motifMode: "single",
    allowCustomerUpload: false,
    allowText: false,
    allowMoveMotif: false,
    allowResizeMotif: false,
    allowRotateMotif: false,
    allowBackDesign: false,
    allowMotifColor: false,
    showShirtColorPicker: true,
    showMotifPicker: false,
    showMotifColorPicker: false,
    showResetButton: false,
    autoSelectSingleMotif: true,
    maxUploadMB: 8,
    previewMode: "single"
  },
  productPrint: {
    tshirt: { front: { xPct: 68, yPct: 16, widthPct: 28 }, back: { xPct: 50, yPct: 36, widthPct: 50 } },
    polo: { front: { xPct: 68, yPct: 22, widthPct: 28 }, back: { xPct: 50, yPct: 36, widthPct: 50 } },
    hoodie: { front: { xPct: 68, yPct: 22, widthPct: 36 }, back: { xPct: 50, yPct: 34, widthPct: 78 } }
  },
  fixedPrint: {
    front: { enabled: true, motifId: "vereinslogo", position: "left-chest", size: "small", topPct: 16, sidePct: 32, scalePct: 100 },
    back: { enabled: false, motifId: "vereinslogo", position: "center", size: "large", topPct: 36, shiftXPct: 0, scalePct: 100 }
  },
  motifs: [{ id: "vereinslogo", name: "Vereinslogo", file: "motiv-1.png" }]
};
