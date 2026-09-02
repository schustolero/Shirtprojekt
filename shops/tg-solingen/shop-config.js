window.SHOP_CONFIG = {
  customerId: "tg-solingen",
  customerName: "Tanzgruppe Klingenstadt Solingen",
  pageTitle: "Tanzgruppe Klingenstadt Solingen – T-Shirt Bestellung",
  brandTitle: "",
  brandSubtitle: "T-Shirt Bestellung",
  designerHeading: "Dein TG Solingen Shirt",
  designerIntro: "Royal Blue Shirt mit Vereinslogo in Medium Yellow – einfach Größe und Menge auswählen.",
  accentColor: "#f0df00",
  logoFile: "shop-logo.png",
  logoHeight: 105,

  shirtPrice: 15,
  currency: "EUR",
  products: [
    { id: "tshirt", name: "T-Shirt", articleNo: "F140", price: 15, purchasePrice: 2.60, frontTemplate: "shirt-front-template.png", backTemplate: "shirt-back-template.png" },
    { id: "polo", name: "Polo-Shirt", articleNo: "F502", price: 25, purchasePrice: 5.61, frontTemplate: "polo-front-template.png", backTemplate: "polo-back-template.png" },
    { id: "hoodie", name: "Hoodie", articleNo: "F421", price: 30, purchasePrice: 9.90, frontTemplate: "hoodie-front-template.png", backTemplate: "hoodie-back-template.png" }
  ],
  orderEmail: "shirtzentrale@gmail.com",
  orderSubject: "Neue Tanzgruppe Klingenstadt Solingen T-Shirt Bestellung",
  customerExtraFieldLabel: "Mannschaft / Abteilung",
  customerExtraFieldName: "Mannschaft / Abteilung",
  orderPrefix: "TG",
  shopType: "simple",

  fixedShirtColor: {
    id: "royal-blue",
    name: "Royal Blue",
    color: "#0758b2"
  },

  fixedMotifColor: {
    name: "Medium Yellow",
    color: "#F6C951"
  },

  productPrint: {
    tshirt: {
      front: { xPct: 68, yPct: 20, widthPct: 28 },
      back:  { xPct: 50, yPct: 36, widthPct: 50 }
    },
    polo: {
      front: { xPct: 68, yPct: 22, widthPct: 28 },
      back:  { xPct: 50, yPct: 36, widthPct: 50 }
    },
    hoodie: {
      front: { xPct: 68, yPct: 22, widthPct: 28 },
      back:  { xPct: 50, yPct: 34, widthPct: 50 }
    }
  },

  fixedPrint: {
    front: {
      enabled: true,
      motifId: "motiv1",
      position: "left-chest",
      size: "small",
      topPct: 20,
      sidePct: 32,
      scalePct: 82
    },
    back: {
      enabled: true,
      motifId: "motiv1",
      position: "center",
      size: "large",
      topPct: 36,
      shiftXPct: 0,
      scalePct: 92
    }
  },

  features: {
    layout: "simple",
    motifMode: "single",
    allowCustomerUpload: false,
    allowText: false,
    allowMoveMotif: false,
    allowResizeMotif: false,
    allowRotateMotif: false,
    allowBackDesign: true,
    allowMotifColor: true,
    showShirtColorPicker: false,
    showMotifPicker: false,
    showMotifColorPicker: false,
    showResetButton: false,
    autoSelectSingleMotif: true,
    maxUploadMB: 8,
    previewMode: "dual"
  },

  motifs: [
    { id: "motiv1", name: "Vereinslogo", file: "motiv-1.png" }
  ]
};
