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
        {id:"tshirt",name:"T-Shirt",articleNo:"F140",price:15,purchasePrice:2.60,printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png"},
        {id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,printCost:1.50,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png"},
        {id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,printCost:1.50,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png"}
      ],
      orderEmail:"shirtzentrale@gmail.com", orderSubject:"Neue Tanzgruppe Klingenstadt Solingen T-Shirt Bestellung",
      customerExtraFieldLabel:"Mannschaft / Abteilung", customerExtraFieldName:"Mannschaft / Abteilung", orderPrefix:"TG", shopType:"simple", active:true, hoodieSizingVersion:5,
      fixedShirtColor:{id:"royal-blue",name:"Royal Blue",color:"#0758b2"}, fixedMotifColor:{name:"Medium Yellow",color:"#F6C951"},
      features:{layout:"simple",motifMode:"single",allowCustomerUpload:false,allowText:false,allowMoveMotif:false,allowResizeMotif:false,allowRotateMotif:false,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:false,showMotifPicker:false,showMotifColorPicker:false,showResetButton:false,autoSelectSingleMotif:true,maxUploadMB:8,previewMode:"dual"},
      productPrint:{tshirt:{front:{xPct:68,yPct:20,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},polo:{front:{xPct:68,yPct:22,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},hoodie:{front:{xPct:68,yPct:22,widthPct:36},back:{xPct:50,yPct:34,widthPct:78}}},
      fixedPrint:{front:{enabled:true,motifId:"motiv1",position:"left-chest",size:"small",topPct:20,sidePct:32,scalePct:100},back:{enabled:true,motifId:"motiv1",position:"center",size:"large",topPct:36,shiftXPct:0,scalePct:92}},
      motifs:[{id:"motiv1",name:"Vereinslogo",file:"motiv-1.png"}]
    },
    "hansa": {
      customerId:"hansa", customerName:"Hansa Berufskolleg", pageTitle:"Hansa Berufskolleg – T-Shirt Shop", brandTitle:"Hansa Berufskolleg", brandSubtitle:"Wir sind Hansa!", hansaSubtitleVersion:1,
      designerHeading:"Shirt gestalten", designerIntro:"Motiv auswählen, Farbe bestimmen und Shirt konfigurieren.", accentColor:"#1f3f76", logoFile:"shop-logo.jpg", logoHeight:90,
      shirtPrice:15,currency:"EUR",
      products:[
        {id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,printCost:1.50,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png",enabled:true},
        {id:"tshirt",name:"T-Shirt",articleNo:"F140",price:15,purchasePrice:2.60,printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png",enabled:true},
        {id:"bcwu01w",name:"Sweatshirt",articleNo:"BCWU01W",price:23,printCost:1.50,frontTemplate:"/sweatshirt-front-template.png",backTemplate:"/sweatshirt-back-template.png",enabled:true,allowedShirtColorIds:["white","black","navy","red","royal-blue","bottle-green","heather-grey"],defaultShirtColorId:"black",shirtColorLabels:{white:"White",black:"Black Pure",navy:"Navy Blue",red:"Red","royal-blue":"Royal","bottle-green":"Forest Green","heather-grey":"Heather Grey"},sizesByColor:{white:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],black:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],navy:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],red:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],"royal-blue":["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],"heather-grey":["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],"bottle-green":["XS","S","M","L","XL","2XL","3XL"]}},
        {id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,printCost:1.50,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png",enabled:false}
      ],
      productPrint:{bcwu01w:{front:{xPct:50,yPct:31,widthPct:72},back:{xPct:50,yPct:36,widthPct:50}}},productMotifModes:{bcwu01w:"normal"},hansaSweatshirtVersion:1,
      fixedShirtColor:{id:"black",name:"Black||default=black",color:"#111015"},fixedMotifColor:{name:"Yellow",color:"#ffe600"},defaultMotifId:"college",hansaDefaultsVersion:1,
      orderEmail:"shirtzentrale@gmail.com",orderSubject:"Neue Hansa Berufskolleg T-Shirt Bestellung",customerExtraFieldLabel:"Klasse",customerExtraFieldName:"Klasse",orderPrefix:"HAN",shopType:"motifs",active:true,
      features:{layout:"simple",motifMode:"multiple",allowCustomerUpload:false,allowText:false,allowMoveMotif:false,allowResizeMotif:false,allowRotateMotif:false,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:true,showMotifPicker:true,showMotifColorPicker:true,showResetButton:false,showPrices:false,autoSelectSingleMotif:false,maxUploadMB:8,previewMode:"single"},hansaPriceVisibilityVersion:2,
      motifs:[{id:"college",name:"College",file:"motiv-1.png"},{id:"script",name:"Allstar",file:"motiv-2.png"}]
    },
    "tus-hemmerde": {
      customerId:"tus-hemmerde",customerName:"TuS Hemmerde",pageTitle:"TuS Hemmerde – T-Shirt Shop",brandTitle:"TuS Hemmerde",brandSubtitle:"Vereinsshirts einfach bestellen",designerHeading:"Dein TuS Hemmerde Shirt",designerIntro:"Farbe, Größe und Menge auswählen.",accentColor:"#e30613",logoFile:"shop-logo.png",logoHeight:100,shirtPrice:10,currency:"EUR",orderEmail:"shirtzentrale@gmail.com",orderSubject:"Neue TuS Hemmerde T-Shirt Bestellung",customerExtraFieldLabel:"Mannschaft / Abteilung",customerExtraFieldName:"Mannschaft / Abteilung",orderPrefix:"TUS",shopType:"simple",active:true,
      fixedShirtColor:{id:"white",name:"White||default=white||allowed=white,red,heather-grey",color:"#ffffff"},fixedMotifColor:{name:"Red||default=Red||allowed=%5B%22Red%22%5D",color:"#B62820"},shirtMotifColors:{white:{name:"Red",color:"#B62820"},red:{name:"White",color:"#FFFFFF"},"heather-grey":{name:"Red",color:"#B62820"}},tusColorPairsVersion:1,defaultMotifId:"vereinslogo",
      products:[
        {id:"tshirt",name:"T-Shirt",articleNo:"F140",price:10,purchasePrice:2.60,printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png",enabled:true,allowedShirtColorIds:["white","heather-grey","red"],defaultShirtColorId:"white",sizes:["S","M","L","XL","2XL","3XL"]},
        {id:"jc001",name:"Sport",articleNo:"JC001",price:12,printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png",enabled:true,allowedShirtColorIds:["red","heather-grey"],defaultShirtColorId:"red",shirtColorLabels:{red:"Fire Red","heather-grey":"Heather Grey"},sizesByColor:{red:["S","M","L","XL","2XL","3XL"],"heather-grey":["S","M","L","XL","2XL"]}},
        {id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,printCost:1.50,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png",enabled:false},
        {id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,printCost:1.50,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png",enabled:false}
      ],
      features:{layout:"simple",motifMode:"single",allowCustomerUpload:false,allowText:false,allowInitials:true,allowMoveMotif:false,allowResizeMotif:false,allowRotateMotif:false,allowBackDesign:false,allowMotifColor:false,showShirtColorPicker:true,showMotifPicker:false,showMotifColorPicker:false,showPrices:false,showNexaroBranding:false,showResetButton:false,autoSelectSingleMotif:true,maxUploadMB:8,previewMode:"single"},
      initialsConfig:{label:"Initialen (optional)",placeholder:"z. B. TS",maxLength:3,stageXPct:29,stageYPct:90,fontSize:24,fontFamily:"Arial"},tusInitialsVersion:5,tusJc001Version:4,tusProductMotifVersion:1,tusOrderPageVersion:2,
      productMotifModes:{tshirt:"normal",jc001:"both",polo:"normal",hoodie:"normal"},
      productPrint:{tshirt:{front:{xPct:68,yPct:16,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},jc001:{front:{xPct:78,yPct:0,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},polo:{front:{xPct:68,yPct:22,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},hoodie:{front:{xPct:68,yPct:22,widthPct:36},back:{xPct:50,yPct:34,widthPct:78}}},
      fixedPrint:{front:{enabled:true,motifId:"vereinslogo",position:"left-chest",size:"small",topPct:16,sidePct:32,scalePct:100},back:{enabled:false,motifId:"vereinslogo",position:"center",size:"large",topPct:36,shiftXPct:0,scalePct:100}},
      motifs:[{id:"vereinslogo",name:"Vereinslogo",file:"motiv-1.png"},{id:"tus-3d-patch",name:"TuS 3D-Patch",file:"/tus-3d-patch.png?v=30.3.14",preserveColors:true}]
    },
    "_simple": {
      customerId:"_simple",customerName:"Vorlage Simple",pageTitle:"Vorlage Simple – T-Shirt Shop",brandTitle:"Vorlage Simple",brandSubtitle:"Einfach auswählen und bestellen",designerHeading:"Shirt auswählen",designerIntro:"Ein festes Motiv – einfach Farbe, Größe und Menge auswählen.",accentColor:"#c99a1b",logoFile:"/dein-logo.svg?v=30.1.87",logoHeight:90,shirtPrice:15,currency:"EUR",orderEmail:"shirtzentrale@gmail.com",orderSubject:"Neue Bestellung",customerExtraFieldLabel:"Team / Abteilung",customerExtraFieldName:"Team / Abteilung",orderPrefix:"SIM",shopType:"simple",active:true,
      products:[
        {id:"tshirt",name:"T-Shirt",articleNo:"F140",price:15,purchasePrice:2.60,printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png"},
        {id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,printCost:1.50,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png"},
        {id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,printCost:1.50,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png"}
      ],
      features:{layout:"simple",motifMode:"single",allowCustomerUpload:false,allowText:false,allowMoveMotif:true,allowResizeMotif:true,allowRotateMotif:true,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:true,showMotifPicker:false,showMotifColorPicker:true,autoSelectSingleMotif:true,maxUploadMB:8,previewMode:"single"},
      productPrint:{
        tshirt:{front:{xPct:68,yPct:16,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},
        polo:{front:{xPct:68,yPct:22,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},
        hoodie:{front:{xPct:68,yPct:22,widthPct:36},back:{xPct:50,yPct:34,widthPct:78}}
      },
      fixedPrint:{front:{enabled:true,motifId:"motiv1",position:"left-chest",size:"small",topPct:16,sidePct:32,scalePct:100},back:{enabled:true,motifId:"motiv1",position:"center",size:"large",topPct:36,shiftXPct:0,scalePct:100}},
      motifs:[{id:"motiv1",name:"NOVA Athletic",file:"demo-motiv-1.png?v=30.1.87"}]
    },
    "_motifs": {customerId:"_motifs",customerName:"Vorlage Motive",pageTitle:"Vorlage Motive – T-Shirt Shop",brandTitle:"Vorlage Motive",brandSubtitle:"Mehrere Motive zur Auswahl",designerHeading:"Motiv auswählen",designerIntro:"Motiv, Textilfarbe, Größe und Menge auswählen.",accentColor:"#c99a1b",logoFile:"/dein-logo.svg?v=30.1.87",logoHeight:90,shirtPrice:15,currency:"EUR",orderEmail:"shirtzentrale@gmail.com",orderSubject:"Neue Bestellung",customerExtraFieldLabel:"Team / Abteilung",customerExtraFieldName:"Team / Abteilung",orderPrefix:"MOT",shopType:"motifs",active:true,fixedShirtColor:{id:"azure-blue",name:"Azure Blue||default=azure-blue",color:"#147fae"},products:[{id:"tshirt",name:"T-Shirt",articleNo:"F140",price:15,purchasePrice:2.60,printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png"},{id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,printCost:1.50,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png"},{id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,printCost:1.50,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png"}],features:{layout:"compact",motifMode:"multiple",allowCustomerUpload:false,allowText:false,allowMoveMotif:true,allowResizeMotif:true,allowRotateMotif:true,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:true,showMotifPicker:true,showMotifColorPicker:true,autoSelectSingleMotif:false,maxUploadMB:8,previewMode:"single"},motifs:[{id:"motiv1",name:"NOVA Wappen",file:"demo-motiv-1.png?v=30.1.87"},{id:"motiv2",name:"NOVA Dynamik",file:"demo-motiv-2.png?v=30.1.87"}]},
    "_designer": {customerId:"_designer",customerName:"Vorlage Designer",pageTitle:"Vorlage Designer – T-Shirt Shop",brandTitle:"Vorlage Designer",brandSubtitle:"Dein Textil frei gestalten",designerHeading:"Shirt frei gestalten",designerIntro:"Eigenes Logo hochladen, Text ergänzen und frei gestalten.",accentColor:"#c99a1b",logoFile:"/dein-logo.svg?v=30.1.87",logoHeight:90,shirtPrice:15,currency:"EUR",orderEmail:"shirtzentrale@gmail.com",orderSubject:"Neue Bestellung",customerExtraFieldLabel:"Firma / Team",customerExtraFieldName:"Firma / Team",orderPrefix:"DES",shopType:"designer",active:true,products:[{id:"tshirt",name:"T-Shirt",articleNo:"F140",price:15,purchasePrice:2.60,printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png"},{id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,printCost:1.50,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png"},{id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,printCost:1.50,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png"}],features:{layout:"designer",motifMode:"mixed",allowCustomerUpload:true,allowText:true,allowMoveMotif:true,allowResizeMotif:true,allowRotateMotif:true,allowBackDesign:true,allowMotifColor:true,showShirtColorPicker:true,showMotifPicker:true,showMotifColorPicker:true,autoSelectSingleMotif:false,maxUploadMB:8,previewMode:"single"},motifs:[{id:"motiv1",name:"NOVA Athletic",file:"demo-motiv-1.png?v=30.1.87"}]}
  }
};
