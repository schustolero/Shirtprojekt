window.SHOP_CONFIG = {
  customerId: "_motifs",
  customerName: "Vorlage Motive",
  pageTitle: "Vorlage Motive – T-Shirt Shop",
  brandTitle: "Vorlage Motive",
  brandSubtitle: "Mehrere Motive zur Auswahl",
  designerHeading: "Motiv auswählen",
  designerIntro: "Motiv, Textilfarbe, Größe und Menge auswählen.",
  accentColor: "#c99a1b",
  logoFile: "/dein-logo.svg?v=30.1.87",
  logoHeight: 90,
  shirtPrice: 15, currency: "EUR",
  orderEmail: "shirtzentrale@gmail.com",
  orderSubject: "Neue Bestellung",
  customerExtraFieldLabel: "Team / Abteilung",
  customerExtraFieldName: "Team / Abteilung",
  orderPrefix: "MOT",
  shopType: "motifs",
  active: true,
  fixedShirtColor: { id: "azure-blue", name: "Azure Blue||default=azure-blue", color: "#147fae" },
  products: [
    { id: "tshirt", name: "T-Shirt", articleNo: "F140", price: 15, purchasePrice: 2.60, printCost: 1.50, frontTemplate: "shirt-front-template.png", backTemplate: "shirt-back-template.png" },
    { id: "polo", name: "Polo-Shirt", articleNo: "F502", price: 25, purchasePrice: 5.61, printCost: 1.50, frontTemplate: "polo-front-template.png", backTemplate: "polo-back-template.png" },
    { id: "hoodie", name: "Hoodie", articleNo: "F421", price: 30, purchasePrice: 9.90, printCost: 1.50, frontTemplate: "hoodie-front-template.png", backTemplate: "hoodie-back-template.png" }
  ],
  features: {
    layout: "compact", motifMode: "multiple",
    allowCustomerUpload: false, allowText: false,
    allowMoveMotif: true, allowResizeMotif: true, allowRotateMotif: true,
    allowBackDesign: true, allowMotifColor: true,
    autoSelectSingleMotif: false, maxUploadMB: 8
  },
  motifs: [
    { id: "motiv1", name: "NOVA Wappen", file: "demo-motiv-1.png?v=30.1.87" },
    { id: "motiv2", name: "NOVA Dynamik", file: "demo-motiv-2.png?v=30.1.87" }
  ]
};
