const canvas = new fabric.Canvas("designCanvas", {
  width: 260,
  height: 330,
  backgroundColor: "transparent",
  selection: true,
  preserveObjectStacking: true
});

const imageUpload = document.getElementById("imageUpload");
const centerBtn = document.getElementById("centerBtn");
const duplicateBtn = document.getElementById("duplicateBtn");
const deleteBtn = document.getElementById("deleteBtn");
const resetBtn = document.getElementById("resetBtn");

const viewButtons = document.querySelectorAll(".view-btn");
const shirtColorButtons = document.querySelectorAll(".shirt-color");

const shirtMockup = document.getElementById("shirtMockup");
const shirtColorLayer = document.getElementById("shirtColorLayer");
const currentColorName = document.getElementById("currentColorName");
const designerStatus = document.getElementById("designerStatus");
const printZone = document.getElementById("printZone");

let currentView = "front";
let currentShirtColor = "#ffffff";
let currentShirtColorId = "weiss";

const viewStates = {
  front: null,
  back: null
};


function getActiveObject() {
  return canvas.getActiveObject();
}


function saveCurrentView() {
  viewStates[currentView] = canvas.toJSON();
}


function loadView(view) {
  canvas.clear();
  canvas.backgroundColor = "transparent";

  const state = viewStates[view];

  if (state) {
    canvas.loadFromJSON(state, function() {
      canvas.requestRenderAll();
    });
  } else {
    canvas.requestRenderAll();
  }
}


function switchView(view) {
  if (view === currentView) {
    return;
  }

  saveCurrentView();

  currentView = view;

  viewButtons.forEach(function(button) {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });

  if (view === "front") {
    shirtMockup.src = "shirt-front-template.png";
    shirtColorLayer.src = "farbmaske-front.png";
    shirtMockup.alt = "T-Shirt Vorderseite";
    designerStatus.textContent = "Vorderseite";

    printZone.classList.remove("back");

    canvas.setHeight(330);
    canvas.setWidth(260);

  } else {
    shirtMockup.src = "shirt-back-template.png";
    shirtColorLayer.src = "farbmaske-back.png";
    shirtMockup.alt = "T-Shirt Rückseite";
    designerStatus.textContent = "Rückseite";

    printZone.classList.add("back");

    canvas.setHeight(350);
    canvas.setWidth(260);
  }

  loadView(view);
}


viewButtons.forEach(function(button) {
  button.addEventListener("click", function() {
    switchView(button.dataset.view);
  });
});


function changeShirtColor(color, name, colorId) {
  currentShirtColor = color;
  currentShirtColorId = colorId || "weiss";
  currentColorName.textContent = name;

  // Die weiße Shirt-Vorlage bleibt immer unverändert.
  // Nur die vom Nutzer gelieferte transparente Maske wird eingefärbt.
  if (currentShirtColorId === "weiss") {
    shirtColorLayer.style.opacity = "0";
    shirtColorLayer.style.filter = "none";
  } else {
    shirtColorLayer.style.opacity = "1";

    const filters = {
      schwarz: "brightness(0.13) saturate(0)",
      blau: "brightness(0) saturate(100%) invert(32%) sepia(95%) saturate(1700%) hue-rotate(194deg) brightness(82%) contrast(102%)",
      rot: "brightness(0) saturate(100%) invert(25%) sepia(96%) saturate(3230%) hue-rotate(351deg) brightness(87%) contrast(92%)",
      gelb: "brightness(0) saturate(100%) invert(81%) sepia(83%) saturate(930%) hue-rotate(351deg) brightness(101%) contrast(92%)",
      gruen: "brightness(0) saturate(100%) invert(38%) sepia(60%) saturate(870%) hue-rotate(82deg) brightness(83%) contrast(88%)",
      orange: "brightness(0) saturate(100%) invert(53%) sepia(99%) saturate(2700%) hue-rotate(2deg) brightness(99%) contrast(101%)",
      pink: "brightness(0) saturate(100%) invert(39%) sepia(92%) saturate(1670%) hue-rotate(303deg) brightness(96%) contrast(90%)"
    };

    shirtColorLayer.style.filter = filters[currentShirtColorId] || "none";
  }

  shirtColorButtons.forEach(function(button) {
    button.classList.toggle(
      "active",
      button.dataset.color.toLowerCase() === color.toLowerCase()
    );
  });
}


shirtColorButtons.forEach(function(button) {
  button.addEventListener("click", function() {
    changeShirtColor(
      button.dataset.color,
      button.dataset.name,
      button.dataset.name
        .toLowerCase()
        .replace("ü","ue")
        .replace("ß","ss")
    );
  });
});


function addImageToCanvas(dataUrl) {

  fabric.Image.fromURL(
    dataUrl,
    function(image) {

      const maxWidth =
        canvas.width * 0.62;

      const maxHeight =
        canvas.height * 0.46;

      const scale =
        Math.min(
          maxWidth / image.width,
          maxHeight / image.height,
          1
        );

      image.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented: true,
        centeredRotation: true,
        centeredScaling: true,
        transparentCorners: false,
        cornerColor: "#ffffff",
        cornerStrokeColor: "#111111",
        borderColor: "#635bff",
        cornerSize: 11,
        padding: 3
      });

      canvas.add(image);
      canvas.setActiveObject(image);
      image.setCoords();
      canvas.requestRenderAll();
    },
    {
      crossOrigin: "anonymous"
    }
  );
}


imageUpload.addEventListener("change", function(event) {

  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Bitte wähle eine PNG-, JPG- oder WEBP-Datei aus.");
    imageUpload.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function(loadEvent) {
    addImageToCanvas(
      loadEvent.target.result
    );
  };

  reader.readAsDataURL(file);

  imageUpload.value = "";
});


centerBtn.addEventListener("click", function() {

  const object = getActiveObject();

  if (!object) {
    return;
  }

  object.set({
    left: canvas.width / 2,
    top: canvas.height / 2,
    originX: "center",
    originY: "center"
  });

  object.setCoords();

  canvas.requestRenderAll();
});


duplicateBtn.addEventListener("click", function() {

  const object = getActiveObject();

  if (!object) {
    return;
  }

  object.clone(function(clone) {

    clone.set({
      left: (object.left || 0) + 15,
      top: (object.top || 0) + 15
    });

    canvas.add(clone);
    canvas.setActiveObject(clone);

    clone.setCoords();

    canvas.requestRenderAll();
  });
});


function deleteSelected() {

  const activeObjects =
    canvas.getActiveObjects();

  if (!activeObjects.length) {
    return;
  }

  activeObjects.forEach(function(object) {
    canvas.remove(object);
  });

  canvas.discardActiveObject();

  canvas.requestRenderAll();
}


deleteBtn.addEventListener(
  "click",
  deleteSelected
);


document.addEventListener("keydown", function(event) {

  if (
    event.key !== "Delete" &&
    event.key !== "Backspace"
  ) {
    return;
  }

  const activeElement =
    document.activeElement;

  if (
    activeElement &&
    (
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA"
    )
  ) {
    return;
  }

  event.preventDefault();

  deleteSelected();
});


resetBtn.addEventListener("click", function() {

  viewStates.front = null;
  viewStates.back = null;

  canvas.clear();
  canvas.backgroundColor = "transparent";

  currentView = "front";

  shirtMockup.src =
    "shirt-front.png";

  designerStatus.textContent =
    "Vorderseite";

  printZone.classList.remove("back");

  canvas.setWidth(260);
  canvas.setHeight(330);

  viewButtons.forEach(function(button) {
    button.classList.toggle(
      "active",
      button.dataset.view === "front"
    );
  });

  changeShirtColor(
    "#ffffff",
    "Weiß"
  );

  canvas.requestRenderAll();
});


/* Keep the canvas objects visually inside the printable area
   after moves or scaling. */
canvas.on("object:modified", function(event) {

  const object = event.target;

  if (!object) {
    return;
  }

  object.setCoords();

  const bounds =
    object.getBoundingRect(true, true);

  let left = object.left;
  let top = object.top;

  if (bounds.left < 0) {
    left += -bounds.left;
  }

  if (
    bounds.left + bounds.width >
    canvas.width
  ) {
    left -=
      bounds.left +
      bounds.width -
      canvas.width;
  }

  if (bounds.top < 0) {
    top += -bounds.top;
  }

  if (
    bounds.top + bounds.height >
    canvas.height
  ) {
    top -=
      bounds.top +
      bounds.height -
      canvas.height;
  }

  object.set({
    left: left,
    top: top
  });

  object.setCoords();

  canvas.requestRenderAll();
});


changeShirtColor(
  "#ffffff",
  "Weiß"
);



// Stabile Dateinamen/Farb-IDs für die Maskenfärbung.
shirtColorButtons.forEach(function(button) {
  button.onclick = function() {
    const map = {
      white: "weiss", black: "schwarz", blue: "blau", red: "rot",
      yellow: "gelb", green: "gruen", orange: "orange", pink: "pink"
    };
    let id = "weiss";
    Object.keys(map).forEach(function(cls) {
      if (button.classList.contains(cls)) id = map[cls];
    });
    changeShirtColor(button.dataset.color, button.dataset.name, id);
  };
});
