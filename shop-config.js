// ============================================================
// MASTER-v24 – ZENTRALE KUNDEN-/VEREINSKONFIGURATION
// Für einen neuen Shop möglichst nur diese Datei + Bilddateien ändern.
// ============================================================

window.SHOP_CONFIG = {
  // Branding
  customerId: "demo-kunde",
  pageTitle: "Kundenname – T-Shirt Designer",
  brandTitle: "Kundenname",
  brandSubtitle: "T-Shirt Konfigurator",
  designerHeading: "Shirt gestalten",
  designerIntro: "Motiv auswählen, Farbe bestimmen und Shirt konfigurieren.",
  accentColor: "#111111",
  logoFile: "shop-logo.jpg",
  logoHeight: 74,

  // Verkauf / Bestellung
  shirtPrice: 15,
  currency: "EUR",
  orderEmail: "textilien@proton.me",
  orderSubject: "Neue T-Shirt Bestellung – Kundenname",
  thankYouUrl: "./danke.html",
  customerExtraFieldLabel: "Team / Abteilung",
  customerExtraFieldName: "Team / Abteilung",
  orderPrefix: "SHOP-260901",
  orderCounterDoc: "counters/orderCounter",
  confirmationStorageKey: "shirtOrderConfirmation",

  // Motive. Dateien in denselben Ordner legen und hier eintragen.
  motifs: [
    { id: "motiv1", name: "Motiv 1", file: "motiv-1.png" },
    { id: "motiv2", name: "Motiv 2", file: "motiv-2.png" }
  ]
};
