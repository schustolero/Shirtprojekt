window.SHOP_CONFIG = {
  customerId: "_designer",
  customerName: "Vorlage Designer",
  pageTitle: "Vorlage Designer – T-Shirt Shop",
  brandTitle: "Vorlage Designer",
  brandSubtitle: "Dein Textil frei gestalten",
  designerHeading: "Shirt frei gestalten",
  designerIntro: "Eigenes Logo hochladen, Text ergänzen und Motiv frei positionieren.",
  accentColor: "#c99a1b",
  logoFile: "/dein-logo.svg",
  logoHeight: 90,
  shirtPrice: 15, currency: "EUR",
  orderEmail: "shirtzentrale@gmail.com",
  orderSubject: "Neue Bestellung",
  customerExtraFieldLabel: "Firma / Team",
  customerExtraFieldName: "Firma / Team",
  orderPrefix: "DES",
  shopType: "designer",
  active: true,
  products: [
    { id: "tshirt", name: "T-Shirt", articleNo: "F140", price: 15, purchasePrice: 2.60, printCost: 1.50, frontTemplate: "shirt-front-template.png", backTemplate: "shirt-back-template.png" },
    { id: "polo", name: "Polo-Shirt", articleNo: "F502", price: 25, purchasePrice: 5.61, printCost: 1.50, frontTemplate: "polo-front-template.png", backTemplate: "polo-back-template.png" },
    { id: "hoodie", name: "Hoodie", articleNo: "F421", price: 30, purchasePrice: 9.90, printCost: 1.50, frontTemplate: "hoodie-front-template.png", backTemplate: "hoodie-back-template.png" }
  ],
  features: {
    layout: "designer", motifMode: "mixed",
    allowCustomerUpload: true, allowText: true,
    allowMoveMotif: true, allowResizeMotif: true, allowRotateMotif: true,
    allowBackDesign: true, allowMotifColor: true,
    autoSelectSingleMotif: false, maxUploadMB: 8
  },
  motifs: [{ id: "motiv1", name: "Beispielmotiv", file: "motiv-1.png" }]
};
