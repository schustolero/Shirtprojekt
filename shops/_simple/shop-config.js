window.SHOP_CONFIG = {
  customerId: "_simple",
  customerName: "Vorlage Simple",
  pageTitle: "Vorlage Simple – T-Shirt Shop",
  brandTitle: "Vorlage Simple",
  brandSubtitle: "Einfach auswählen und bestellen",
  designerHeading: "Shirt auswählen",
  designerIntro: "Ein festes Motiv – einfach Farbe, Größe und Menge auswählen.",
  accentColor: "#c99a1b",
  logoFile: "/dein-logo.svg?v=30.1.86",
  logoHeight: 90,
  shirtPrice: 15, currency: "EUR",
  orderEmail: "shirtzentrale@gmail.com",
  orderSubject: "Neue Bestellung",
  customerExtraFieldLabel: "Team / Abteilung",
  customerExtraFieldName: "Team / Abteilung",
  orderPrefix: "SIM",
  shopType: "simple",
  active: true,
  products: [
    { id: "tshirt", name: "T-Shirt", articleNo: "F140", price: 15, purchasePrice: 2.60, printCost: 1.50, frontTemplate: "shirt-front-template.png", backTemplate: "shirt-back-template.png" },
    { id: "polo", name: "Polo-Shirt", articleNo: "F502", price: 25, purchasePrice: 5.61, printCost: 1.50, frontTemplate: "polo-front-template.png", backTemplate: "polo-back-template.png" },
    { id: "hoodie", name: "Hoodie", articleNo: "F421", price: 30, purchasePrice: 9.90, printCost: 1.50, frontTemplate: "hoodie-front-template.png", backTemplate: "hoodie-back-template.png" }
  ],
  features: {
    layout: "simple", motifMode: "single",
    allowCustomerUpload: false, allowText: false,
    allowMoveMotif: false, allowResizeMotif: false, allowRotateMotif: false,
    allowBackDesign: true, allowMotifColor: true,
    autoSelectSingleMotif: true, maxUploadMB: 8
  },
  motifs: [{ id: "motiv1", name: "NOVA Athletic", file: "demo-motiv-1.png?v=30.1.86" }]
};
