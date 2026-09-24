// MASTER-v27 – zentrale Systemkonfiguration und Startwerte für die Shopverwaltung.
const MASTER_COLOR_VARIANTS = {
  F140:[
    {id:"azure-blue",name:"Azure Blue",color:"#0076ad"},{id:"black",name:"Black",color:"#120f14"},{id:"bottle-green",name:"Bottle Green",color:"#1e4026"},{id:"brick-red",name:"Brick Red",color:"#78131a"},{id:"burgundy",name:"Burgundy",color:"#77002f"},{id:"chocolate",name:"Chocolate",color:"#563d29"},{id:"classic-olive",name:"Classic Olive",color:"#63673f"},{id:"dark-grey-heather",name:"Dark Grey Heather",color:"#4f5054",pattern:"heather"},{id:"deep-navy",name:"Deep Navy",color:"#000f33"},{id:"fuchsia",name:"Fuchsia",color:"#e50d89"},{id:"heather-burgundy",name:"Heather Burgundy",color:"#893b67",pattern:"heather"},{id:"heather-grey",name:"Heather Grey",color:"#cfd0d2",pattern:"heather"},{id:"heather-purple",name:"Heather Purple",color:"#512d6d",pattern:"heather"},{id:"kelly-green",name:"Kelly Green",color:"#00a056"},{id:"khaki",name:"Khaki",color:"#7f6518"},{id:"light-graphite",name:"Light Graphite (Solid)",color:"#554b47"},{id:"light-pink",name:"Light Pink",color:"#f0a5c7"},{id:"lime",name:"Lime",color:"#88bc53"},{id:"natural",name:"Natural",color:"#fffad9"},{id:"navy",name:"Navy",color:"#051734"},{id:"orange",name:"Orange",color:"#ea4f00"},{id:"purple",name:"Purple",color:"#431279"},{id:"red",name:"Red",color:"#e61709"},{id:"retro-heather-green",name:"Retro Heather Green",color:"#5d9d7b",pattern:"heather"},{id:"retro-heather-royal",name:"Retro Heather Royal",color:"#5166a8",pattern:"heather"},{id:"royal-blue",name:"Royal Blue",color:"#004d9f"},{id:"sky-blue",name:"Sky Blue",color:"#82cdf2"},{id:"sunflower",name:"Sunflower",color:"#f9ba05"},{id:"vintage-heather-navy",name:"Vintage Heather Navy",color:"#626a86",pattern:"vintage"},{id:"vintage-heather-red",name:"Vintage Heather Red",color:"#a64b64",pattern:"vintage"},{id:"white",name:"White",color:"#ffffff"},{id:"yellow",name:"Yellow",color:"#ffed00"}
  ],
  F502:[
    {id:"black",name:"Black",color:"#120f14"},{id:"bottle-green",name:"Bottle Green",color:"#1e4026"},{id:"burgundy",name:"Burgundy",color:"#77002f"},{id:"dark-heather-grey",name:"Dark Heather Grey",color:"#4f5054",pattern:"heather"},{id:"deep-navy",name:"Deep Navy",color:"#000f33"},{id:"emerald",name:"Emerald",color:"#009f9e"},{id:"heather-grey",name:"Heather Grey",color:"#cfd0d2",pattern:"heather"},{id:"kelly-green",name:"Kelly Green",color:"#00a056"},{id:"navy",name:"Navy",color:"#051734"},{id:"orange",name:"Orange",color:"#ea4f00"},{id:"purple",name:"Purple",color:"#431279"},{id:"red",name:"Red",color:"#e61709"},{id:"royal-blue",name:"Royal Blue",color:"#004d9f"},{id:"sky-blue",name:"Sky Blue",color:"#82cdf2"},{id:"sunflower",name:"Sunflower",color:"#f9ba05"},{id:"white",name:"White",color:"#ffffff"}
  ],
  F421:[
    {id:"azure-blue",name:"Azure Blue",color:"#0076ad"},{id:"black",name:"Black",color:"#120f14"},{id:"bottle-green",name:"Bottle Green",color:"#1e4026"},{id:"burgundy",name:"Burgundy",color:"#77002f"},{id:"classic-olive",name:"Classic Olive",color:"#63673f"},{id:"dark-heather-grey",name:"Dark Heather Grey",color:"#4f5054",pattern:"heather"},{id:"deep-navy",name:"Deep Navy",color:"#000f33"},{id:"fuchsia",name:"Fuchsia",color:"#e50d89"},{id:"heather-green",name:"Heather Green",color:"#00965e",pattern:"heather"},{id:"heather-grey",name:"Heather Grey",color:"#cfd0d2",pattern:"heather"},{id:"heather-navy",name:"Heather Navy",color:"#1f2a44",pattern:"heather"},{id:"heather-red",name:"Heather Red",color:"#b04a5a",pattern:"heather"},{id:"heather-royal",name:"Heather Royal",color:"#0047bb",pattern:"heather"},{id:"kelly-green",name:"Kelly Green",color:"#00a056"},{id:"light-graphite",name:"Light Graphite (Solid)",color:"#554b47"},{id:"light-pink",name:"Light Pink",color:"#f0a5c7"},{id:"natural",name:"Natural",color:"#fffad9"},{id:"navy",name:"Navy",color:"#051734"},{id:"orange",name:"Orange",color:"#ea4f00"},{id:"purple",name:"Purple",color:"#431279"},{id:"red",name:"Red",color:"#e61709"},{id:"royal-blue",name:"Royal Blue",color:"#004d9f"},{id:"sky-blue",name:"Sky Blue",color:"#82cdf2"},{id:"sunflower",name:"Sunflower",color:"#f9ba05"},{id:"white",name:"White",color:"#ffffff"}
  ],
  JC001:[
    {id:"airforce-blue",name:"Airforce Blue",color:"#4f758b"},{id:"white",name:"Arctic White",color:"#ffffff"},{id:"ash",name:"Ash (Solid)",color:"#d9d9d6"},{id:"baby-pink",name:"Baby Pink",color:"#fabbcb"},{id:"bottle-green",name:"Bottle Green",color:"#154734"},{id:"burgundy",name:"Burgundy",color:"#6f263d"},{id:"charcoal",name:"Charcoal (Solid)",color:"#3f4444"},{id:"citrus",name:"Citrus",color:"#c2fa0f"},{id:"combat-green",name:"Combat Green",color:"#1a2711"},{id:"cornflower-blue",name:"Cornflower Blue",color:"#5e8fcb"},{id:"desert-sand",name:"Desert Sand",color:"#b0aa7e"},{id:"digital-lavender",name:"Digital Lavender",color:"#7870f5"},{id:"dusty-pink",name:"Dusty Pink",color:"#ce6ead"},{id:"earthy-green",name:"Earthy Green",color:"#476240"},{id:"electric-green",name:"Electric Green",color:"#44d62c"},{id:"electric-orange",name:"Electric Orange",color:"#ff8f6c"},{id:"electric-pink",name:"Electric Pink",color:"#ff3eb5"},{id:"electric-yellow",name:"Electric Yellow",color:"#e3e829"},{id:"red",name:"Fire Red",color:"#c8102e"},{id:"french-navy",name:"French Navy",color:"#041c2c"},{id:"gold",name:"Gold",color:"#ffa300"},{id:"hawaiian-blue",name:"Hawaiian Blue",color:"#5bc2e7"},{id:"heather-grey",name:"Heather Grey (Solid)",color:"#a7a8aa",pattern:"heather"},{id:"hot-chocolate",name:"Hot Chocolate",color:"#382e2c"},{id:"hot-pink",name:"Hot Pink",color:"#ce0f69"},{id:"hyper-pink",name:"Hyper Pink",color:"#ff12ff"},{id:"ink-blue",name:"Ink Blue",color:"#123955"},{id:"jade",name:"Jade",color:"#00685e"},{id:"black",name:"Jet Black",color:"#000710"},{id:"kelly-green",name:"Kelly Green",color:"#00832f"},{id:"lime-green",name:"Lime Green",color:"#78be20"},{id:"magenta-magic",name:"Magenta Magic",color:"#8c4799"},{id:"melon-green",name:"Melon Green",color:"#b7eda4"},{id:"mint",name:"Mint",color:"#bafade"},{id:"olive-green",name:"Olive Green",color:"#4a412a"},{id:"orange-crush",name:"Orange Crush",color:"#ff6a13"},{id:"orange-flame",name:"Orange Flame",color:"#ff2124"},{id:"oxford-navy",name:"Oxford Navy",color:"#13294b"},{id:"peach-sorbet",name:"Peach Sorbet",color:"#ff8791"},{id:"plum",name:"Plum",color:"#512a44"},{id:"purple",name:"Purple",color:"#512d6d"},{id:"red-hot-chilli",name:"Red Hot Chilli",color:"#8a1538"},{id:"reflex-blue",name:"Reflex Blue",color:"#0034cd"},{id:"royal-blue",name:"Royal Blue",color:"#003594"},{id:"sapphire-blue",name:"Sapphire Blue",color:"#009cde"},{id:"seafoam",name:"Seafoam",color:"#61bbaa"},{id:"sherbet-lemon",name:"Sherbet Lemon",color:"#fbdb65"},{id:"sky-blue",name:"Sky Blue",color:"#9bb8d3"},{id:"sour-green",name:"Sour Green",color:"#00ffa3"},{id:"sun-yellow",name:"Sun Yellow",color:"#ffd100"},{id:"turquoise-blue",name:"Turquoise Blue",color:"#0092bc"},{id:"vanilla",name:"Vanilla",color:"#f0e8d6"}
  ],
  BCWU01W:[
    {id:"asphalt",name:"Asphalt",color:"#433f42"},{id:"black",name:"Black Pure",color:"#070508"},{id:"candy-pink",name:"Candy Pink",color:"#e0bed5"},{id:"desert",name:"Desert",color:"#ceb596"},{id:"elephant-grey",name:"Elephant Grey",color:"#827679"},{id:"bottle-green",name:"Forest Green",color:"#002500"},{id:"grey-fog",name:"Grey Fog",color:"#d8d2c0"},{id:"hawaiian-blue",name:"Hawaiian Blue",color:"#0097c3"},{id:"heather-asphalt",name:"Heather Asphalt",color:"#3e4041",pattern:"heather"},{id:"heather-dark-green",name:"Heather Dark Green",color:"#415d56",pattern:"heather"},{id:"heather-grey",name:"Heather Grey",color:"#b1b3b4",pattern:"heather"},{id:"heather-mid-grey",name:"Heather Mid Grey",color:"#7f8080",pattern:"heather"},{id:"heather-navy",name:"Heather Navy",color:"#3f404e",pattern:"heather"},{id:"heather-purple",name:"Heather Purple",color:"#714d69",pattern:"heather"},{id:"heather-red",name:"Heather Red",color:"#e11a3b",pattern:"heather"},{id:"heather-royal-blue",name:"Heather Royal Blue",color:"#425a97",pattern:"heather"},{id:"kelly-green",name:"Kelly Green",color:"#009149"},{id:"lavender",name:"Lavender",color:"#d5cddf"},{id:"light-jade",name:"Light Jade",color:"#c9dbae"},{id:"melon-orange",name:"Melon Orange",color:"#f6aa70"},{id:"millennial-khaki",name:"Millennial Khaki",color:"#585b55"},{id:"navy",name:"Navy Blue",color:"#101145"},{id:"nude",name:"Nude",color:"#e1b09d"},{id:"pale-pink",name:"Pale Pink",color:"#feede1"},{id:"pale-yellow",name:"Pale Yellow",color:"#faf1d7"},{id:"pink-fizz",name:"Pink Fizz",color:"#ed6890"},{id:"pure-orange",name:"Pure Orange",color:"#eb5d0f"},{id:"pure-sky",name:"Pure Sky",color:"#dde7e9"},{id:"radiant-purple",name:"Radiant Purple",color:"#3b1d66"},{id:"red",name:"Red",color:"#db001b"},{id:"royal-blue",name:"Royal",color:"#13377d"},{id:"sage",name:"Sage",color:"#aac1b3"},{id:"solar-yellow",name:"Solar Yellow",color:"#ffe93c"},{id:"white",name:"White",color:"#ffffff"},{id:"wine",name:"Wine",color:"#6a2b40"}
  ]
};
function masterColorSettings(key,defaultId){
  const colorVariants=(MASTER_COLOR_VARIANTS[key]||[]).map(color=>({...color}));
  return {
    colorVariants,
    allowedShirtColorIds:colorVariants.map(color=>color.id),
    defaultShirtColorId:defaultId||colorVariants[0]?.id||"",
    shirtColorLabels:Object.fromEntries(colorVariants.map(color=>[color.id,color.name])),
    shirtColorHex:Object.fromEntries(colorVariants.map(color=>[color.id,color.color]))
  };
}
const SZ=(from,to)=>{const all=["XS","S","M","L","XL","2XL","3XL","4XL","5XL"];return all.slice(all.indexOf(from),all.indexOf(to)+1)};
const MASTER_SIZES_BY_NAME={
  F140:Object.fromEntries(MASTER_COLOR_VARIANTS.F140.map(c=>[c.name,SZ("S",["Bottle Green","Heather Purple","Kelly Green","Orange","Yellow"].includes(c.name)?"5XL":"3XL")])),
  F502:Object.fromEntries(MASTER_COLOR_VARIANTS.F502.map(c=>[c.name,SZ("S",["Black","Bottle Green","Burgundy","Navy","Orange","Sunflower"].includes(c.name)?"5XL":"3XL")])),
  F421:Object.fromEntries(MASTER_COLOR_VARIANTS.F421.map(c=>[c.name,SZ("S",["Orange","Purple"].includes(c.name)?"4XL":["Burgundy","Classic Olive","Dark Heather Grey","Heather Red","Light Pink","Natural","Sky Blue"].includes(c.name)?"3XL":"2XL")])),
  JC001:Object.fromEntries(MASTER_COLOR_VARIANTS.JC001.map(c=>[c.name,SZ("XS",["Baby Pink","Hawaiian Blue"].includes(c.name)?"5XL":["Desert Sand","Digital Lavender","Dusty Pink","Earthy Green","French Navy","Gold","Melon Green","Mint","Oxford Navy","Sapphire Blue","Seafoam","Turquoise Blue","Vanilla"].includes(c.name)?"3XL":"2XL")])),
  BCWU01W:Object.fromEntries(MASTER_COLOR_VARIANTS.BCWU01W.map(c=>[c.name,SZ("XS","5XL")]))
};
function masterSizesByColor(key){
  const byName=MASTER_SIZES_BY_NAME[key]||{};
  return Object.fromEntries((MASTER_COLOR_VARIANTS[key]||[]).map(c=>[c.id,byName[c.name]||[]]));
}
const MASTER_PRODUCT_CATALOG = [
  {id:"tshirt",name:"T-Shirt",articleNo:"F140",price:15,purchasePrice:2.60,printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png",sizes:["S","M","L","XL","2XL","3XL","4XL","5XL"],sizesByColor:masterSizesByColor("F140"),...masterColorSettings("F140","white")},
  {id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,printCost:1.50,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png",sizes:["S","M","L","XL","2XL","3XL","4XL","5XL"],sizesByColor:masterSizesByColor("F502"),...masterColorSettings("F502","white")},
  {id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,printCost:1.50,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png",sizes:["S","M","L","XL","2XL","3XL","4XL","5XL"],sizesByColor:masterSizesByColor("F421"),...masterColorSettings("F421","white")},
  {id:"jc001",name:"Sport",articleNo:"JC001",price:12,purchasePrice:7.62,purchasePriceBySize:{S:7.62,M:7.62,L:7.62,XL:7.62,"2XL":7.62,"3XL":7.62,"4XL":9.55,"5XL":9.55},printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png",sizes:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],sizesByColor:masterSizesByColor("JC001"),...masterColorSettings("JC001","red")},
  {id:"bcwu01w",name:"Sweatshirt",articleNo:"BCWU01W",price:23,purchasePrice:8.20,printCost:1.50,frontTemplate:"/sweatshirt-front-template.png",backTemplate:"/sweatshirt-back-template.png",sizes:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],sizesByColor:masterSizesByColor("BCWU01W"),...masterColorSettings("BCWU01W","black")}
];
window.CENTRAL_CONFIG = {
  adminEmail: "shirtzentrale@gmail.com",
  adminTitle: "Shirtprojekt – Zentrale",
  defaultShop: "_simple",
  orderEmail: "shirtzentrale@gmail.com",
  productCatalog: MASTER_PRODUCT_CATALOG,
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
        {id:"bcwu01w",name:"Sweatshirt",articleNo:"BCWU01W",price:23,purchasePrice:8.20,printCost:1.50,frontTemplate:"/sweatshirt-front-template.png",backTemplate:"/sweatshirt-back-template.png",enabled:true,allowedShirtColorIds:["white","black","navy","red","royal-blue","bottle-green","heather-grey"],defaultShirtColorId:"black",shirtColorLabels:{white:"White",black:"Black Pure",navy:"Navy Blue",red:"Red","royal-blue":"Royal","bottle-green":"Forest Green","heather-grey":"Heather Grey"},sizesByColor:{white:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],black:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],navy:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],red:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],"royal-blue":["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],"heather-grey":["XS","S","M","L","XL","2XL","3XL","4XL","5XL"],"bottle-green":["XS","S","M","L","XL","2XL","3XL"]}},
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
        {id:"jc001",name:"Sport",articleNo:"JC001",price:12,purchasePrice:7.62,purchasePriceBySize:{S:7.62,M:7.62,L:7.62,XL:7.62,"2XL":7.62,"3XL":7.62,"4XL":9.55,"5XL":9.55},printCost:1.50,frontTemplate:"shirt-front-template.png",backTemplate:"shirt-back-template.png",enabled:true,allowedShirtColorIds:["red","heather-grey"],defaultShirtColorId:"red",shirtColorLabels:{red:"Fire Red","heather-grey":"Heather Grey"},sizesByColor:{red:["S","M","L","XL","2XL","3XL"],"heather-grey":["S","M","L","XL","2XL"]}},
        {id:"polo",name:"Polo-Shirt",articleNo:"F502",price:25,purchasePrice:5.61,printCost:1.50,frontTemplate:"polo-front-template.png",backTemplate:"polo-back-template.png",enabled:false},
        {id:"hoodie",name:"Hoodie",articleNo:"F421",price:30,purchasePrice:9.90,printCost:1.50,frontTemplate:"hoodie-front-template.png",backTemplate:"hoodie-back-template.png",enabled:false}
      ],
      features:{layout:"simple",motifMode:"single",allowCustomerUpload:false,allowText:false,allowInitials:true,allowMoveMotif:false,allowResizeMotif:false,allowRotateMotif:false,allowBackDesign:false,allowMotifColor:false,showShirtColorPicker:true,showMotifPicker:false,showMotifColorPicker:false,showPrices:false,showNexaroBranding:false,showResetButton:false,autoSelectSingleMotif:true,maxUploadMB:8,previewMode:"single"},
      initialsConfig:{label:"Initialen (optional)",placeholder:"z. B. TS",maxLength:3,stageXPct:29,stageYPct:90,fontSize:24,fontFamily:"Arial"},tusInitialsVersion:5,tusJc001Version:4,tusProductMotifVersion:1,tusOrderPageVersion:2,
      productMotifModes:{tshirt:"normal",jc001:"both",polo:"normal",hoodie:"normal"},
      productPrint:{tshirt:{front:{xPct:68,yPct:16,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},jc001:{front:{xPct:78,yPct:0,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},polo:{front:{xPct:68,yPct:22,widthPct:28},back:{xPct:50,yPct:36,widthPct:50}},hoodie:{front:{xPct:68,yPct:22,widthPct:36},back:{xPct:50,yPct:34,widthPct:78}}},
      fixedPrint:{front:{enabled:true,motifId:"vereinslogo",position:"left-chest",size:"small",topPct:16,sidePct:32,scalePct:100},back:{enabled:false,motifId:"vereinslogo",position:"center",size:"large",topPct:36,shiftXPct:0,scalePct:100}},
      motifs:[{id:"vereinslogo",name:"Vereinslogo",file:"motiv-1.png"},{id:"tus-3d-patch",name:"TuS 3D-Patch",file:"/tus-3d-patch.png?v=30.3.19",preserveColors:true}]
    },
    "_master": {
      customerId:"_master", customerName:"Master Shop", pageTitle:"Master Shop – Gesamtsortiment",
      brandTitle:"DEIN VEREINSSHOP", brandSubtitle:"Komplettes Textilsortiment",
      designerHeading:"Dein Shop. Dein Sortiment.", designerIntro:"Alle verfügbaren Textilien als zentrale Vorlage.",
      accentColor:"#c99a1b", logoFile:"/dein-logo.svg?v=30.1.87", logoHeight:90,
      shirtPrice:15, currency:"EUR", orderEmail:"shirtzentrale@gmail.com",
      orderSubject:"Neue Master-Shop Bestellung",
      customerExtraFieldLabel:"Team / Abteilung", customerExtraFieldName:"Team / Abteilung",
      orderPrefix:"MAS", shopType:"simple", active:true, isMasterTemplate:true, templateVersion:1,
      fixedShirtColor:{id:"azure-blue",name:"Azure Blue||default=azure-blue",color:"#147fae"},
      products:MASTER_PRODUCT_CATALOG.map(product=>({...product,enabled:true})),
      features:{
        layout:"simple", motifMode:"single",
        allowCustomerUpload:false, allowText:false, allowInitials:true,
        allowMoveMotif:true, allowResizeMotif:true, allowRotateMotif:true,
        allowBackDesign:true, allowMotifColor:true,
        showShirtColorPicker:true, showMotifPicker:false, showMotifColorPicker:true,
        showPrices:false, showNexaroBranding:false, showResetButton:false,
        autoSelectSingleMotif:false, maxUploadMB:8, previewMode:"single"
      },
      initialsConfig:{label:"Initialen (optional)",placeholder:"z. B. TS",maxLength:3,stageXPct:29,stageYPct:90,fontSize:24,fontFamily:"Arial"},
      productPrint:{
        tshirt:{front:{xPct:68,yPct:18,widthPct:22},back:{xPct:50,yPct:32,widthPct:22}},
        polo:{front:{xPct:68,yPct:20,widthPct:22},back:{xPct:50,yPct:32,widthPct:22}},
        hoodie:{front:{xPct:68,yPct:20,widthPct:22},back:{xPct:50,yPct:32,widthPct:22}},
        jc001:{front:{xPct:68,yPct:18,widthPct:22},back:{xPct:50,yPct:32,widthPct:22}},
        bcwu01w:{front:{xPct:68,yPct:20,widthPct:22},back:{xPct:50,yPct:32,widthPct:22}}
      },
      productMotifModes:{tshirt:"normal",polo:"normal",hoodie:"normal",jc001:"normal",bcwu01w:"normal"},
      fixedPrint:{
        front:{enabled:false,motifId:"motiv1",position:"left-chest",size:"small",topPct:18,sidePct:32,scalePct:100},
        back:{enabled:false,motifId:"motiv1",position:"center",size:"small",topPct:32,shiftXPct:0,scalePct:100}
      },
      motifs:[{id:"motiv1",name:"NOVA Athletic",file:"/shops/_designer/demo-motiv-1.png?v=30.3.19"}]
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
