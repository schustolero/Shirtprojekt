// MASTER-v27 – zentrale Systemkonfiguration und Startwerte für die Shopverwaltung.
window.CENTRAL_CONFIG = {
  adminEmail: "shirtzentrale@gmail.com",
  adminTitle: "Shirtprojekt – Zentrale",
  defaultShop: "_simple",
  orderEmail: "shirtzentrale@gmail.com",
  seedShops: {
    "tg-solingen": {
      customerId:"tg-solingen", customerName:"Tanzgruppe Klingenstadt Solingen",
      pageTitle:"Tanzgruppe Klingenstadt Solingen – T-Shirt Bestellung", brandTitle:"", brandSubtitle:"T-Shirt Bestellung",
      designerHeading:"Dein TG Solingen Shirt", designerIntro:"Royal Blue Shirt mit Vereinslogo in Medium Yellow – einfach Größe und Menge auswählen.",
      accentColor:"#f0df00", logoFile:"shop-logo.png", logoHeight:105, shirtPrice:15, currency:"EUR",
      products:[
        {id:"tshirt",name:"T-Shirt",articleNo:"F140",price:15,purchasePrice:2.60,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png"},
        {id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png"},
        {id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png"}
      ],
      orderEmail:"shirtzentrale@gmail.com", orderSubject:"Neue Tanzgruppe Klingenstadt Solingen T-Shirt Bestellung",
      customerExtraFieldLabel:"Mannschaft / Abteilung", customerExtraFieldName:"Mannschaft / Abteilung", orderPrefix:"TG", shopType:"simple", active:true, hoodieSizingVersion:1,
      fixedShirtColor:{id:"royal-blue",name:"Royal Blue",color:"#0758b2"}, fixedMotifColor:{name:"Medium Yellow",color:"#F6C951"},
      features:{layout:"simple",motifMode:"single",allowCustomerUpload:false,allowText:false,allowMoveMotif:false,allowResizeMotif:false,allowRotateMotif:false,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:false,showMotifPicker:false,showMotifColorPicker:false,showResetButton:false,autoSelectSingleMotif:true,maxUploadMB:8,previewMode:"dual"},
      productPrint:{tshirt:{front:{xPct:68,yPct:20,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},polo:{front:{xPct:68,yPct:22,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},hoodie:{front:{xPct:68,yPct:22,widthPct:36},back:{xPct:50,yPct:34,widthPct:46}}},
      fixedPrint:{front:{enabled:true,motifId:"motiv1",position:"left-chest",size:"small",topPct:20,sidePct:32,scalePct:100},back:{enabled:true,motifId:"motiv1",position:"center",size:"large",topPct:36,shiftXPct:0,scalePct:92}},
      motifs:[{id:"motiv1",name:"Vereinslogo",file:"motiv-1.png"}]
    },
    "hansa": {
      customerId:"hansa", customerName:"Hansa Berufskolleg", pageTitle:"Hansa Berufskolleg – T-Shirt Shop", brandTitle:"Hansa Berufskolleg", brandSubtitle:"T-Shirt Konfigurator",
      designerHeading:"Shirt gestalten", designerIntro:"Motiv auswählen, Farbe bestimmen und Shirt konfigurieren.", accentColor:"#1f3f76", logoFile:"shop-logo.jpg", logoHeight:90,
      shirtPrice:15,currency:"EUR",orderEmail:"shirtzentrale@gmail.com",orderSubject:"Neue Hansa Berufskolleg T-Shirt Bestellung",customerExtraFieldLabel:"Klasse",customerExtraFieldName:"Klasse",orderPrefix:"HAN",shopType:"motifs",active:true,
      features:{layout:"compact",motifMode:"multiple",allowCustomerUpload:false,allowText:false,allowMoveMotif:false,allowResizeMotif:false,allowRotateMotif:false,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:true,showMotifPicker:true,showMotifColorPicker:true,autoSelectSingleMotif:false,maxUploadMB:8,previewMode:"single"},
      motifs:[{id:"college",name:"College",file:"motiv-1.png"},{id:"script",name:"Script",file:"motiv-2.png"}]
    },
    "_simple": {customerId:"_simple",customerName:"Vorlage Simple",pageTitle:"Simple Shop",brandTitle:"Simple Shop",brandSubtitle:"Vorlage",designerHeading:"Shirt auswählen",designerIntro:"Ein festes Motiv – einfach bestellen.",accentColor:"#111111",logoFile:"shop-logo.png",logoHeight:90,shirtPrice:15,currency:"EUR",orderEmail:"shirtzentrale@gmail.com",orderSubject:"Neue Bestellung",customerExtraFieldLabel:"Team / Abteilung",customerExtraFieldName:"Team / Abteilung",orderPrefix:"SIM",shopType:"simple",active:true,features:{layout:"simple",motifMode:"single",allowCustomerUpload:false,allowText:false,allowMoveMotif:false,allowResizeMotif:false,allowRotateMotif:false,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:true,showMotifPicker:false,showMotifColorPicker:true,autoSelectSingleMotif:true,maxUploadMB:8,previewMode:"single"},motifs:[{id:"motiv1",name:"Vereinslogo",file:"motiv-1.png"}]},
    "_motifs": {customerId:"_motifs",customerName:"Vorlage Motive",pageTitle:"Motiv Shop",brandTitle:"Motiv Shop",brandSubtitle:"Vorlage",designerHeading:"Motiv auswählen",designerIntro:"Mehrere Motive zur Auswahl.",accentColor:"#111111",logoFile:"shop-logo.png",logoHeight:90,shirtPrice:15,currency:"EUR",orderEmail:"shirtzentrale@gmail.com",orderSubject:"Neue Bestellung",customerExtraFieldLabel:"Team / Abteilung",customerExtraFieldName:"Team / Abteilung",orderPrefix:"MOT",shopType:"motifs",active:true,features:{layout:"compact",motifMode:"multiple",allowCustomerUpload:false,allowText:false,allowMoveMotif:false,allowResizeMotif:false,allowRotateMotif:false,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:true,showMotifPicker:true,showMotifColorPicker:true,autoSelectSingleMotif:false,maxUploadMB:8,previewMode:"single"},motifs:[{id:"motiv1",name:"Motiv 1",file:"motiv-1.png"},{id:"motiv2",name:"Motiv 2",file:"motiv-2.png"}]},
    "_designer": {customerId:"_designer",customerName:"Vorlage Designer",pageTitle:"Designer Shop",brandTitle:"Designer Shop",brandSubtitle:"Vorlage",designerHeading:"Shirt frei gestalten",designerIntro:"Logo hochladen, Text ergänzen und frei gestalten.",accentColor:"#111111",logoFile:"shop-logo.png",logoHeight:90,shirtPrice:15,currency:"EUR",orderEmail:"shirtzentrale@gmail.com",orderSubject:"Neue Bestellung",customerExtraFieldLabel:"Firma / Team",customerExtraFieldName:"Firma / Team",orderPrefix:"DES",shopType:"designer",active:true,features:{layout:"designer",motifMode:"mixed",allowCustomerUpload:true,allowText:true,allowMoveMotif:true,allowResizeMotif:true,allowRotateMotif:true,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:true,showMotifPicker:true,showMotifColorPicker:true,autoSelectSingleMotif:false,maxUploadMB:8,previewMode:"single"},motifs:[{id:"motiv1",name:"Beispielmotiv",file:"motiv-1.png"}]}
  }
};
