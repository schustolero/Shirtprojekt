window.SHOP_CONFIG = {
  customerId: "hansa",
  customerName: "Hansa Berufskolleg",
  pageTitle: "Hansa Berufskolleg – T-Shirt Shop",
  brandTitle: "Hansa Berufskolleg",
  brandSubtitle: "T-Shirt Konfigurator",
  designerHeading: "Shirt gestalten",
  designerIntro: "Motiv auswählen, Farbe bestimmen und Shirt konfigurieren.",

  // Keine feste Hauptfarbe: neutrales Shop-Design
  accentColor: "#222222",

  logoFile: "shop-logo.jpg",
  logoHeight: 90,

  shirtPrice: 15,
  currency: "EUR",
  orderEmail: "shirtzentrale@gmail.com",
  orderSubject: "Neue Hansa Berufskolleg T-Shirt Bestellung",

  customerExtraFieldLabel: "Klasse",
  customerExtraFieldName: "Klasse",
  orderPrefix: "HAN",

  shopType: "motifs",
  features: {
    layout: "compact",
    motifMode: "multiple",
    allowCustomerUpload: false,
    allowText: false,
    allowMoveMotif: false,
    allowResizeMotif: false,
    allowRotateMotif: false,
    allowBackDesign: true,
    allowMotifColor: true,
    autoSelectSingleMotif: false,
    maxUploadMB: 8
  },

  motifs: [
    { id: "motiv1", name: "Motiv 1", file: "motiv-1.png" },
    { id: "motiv2", name: "Motiv 2", file: "motiv-2.png" }
  ]
};
