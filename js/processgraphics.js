let assets = {
  width: 1900,
  height: 960,
  gridLines: 20,
  history: [],
  snapToGrid: true,
  drawing: {
    startDraw: true,
    currentDraw: null,
    lineColor: 0xffffff,
    fillColor: 0xffffff,
    lineWidth: 3,
    interactiveMode: false,
    moveSymbol: null,
    text: null
  },
  symbols: {}
};

let app = new PIXI.Application({
  width: assets.width, // default: assets.height
  height: assets.height, // default: assets.height
  antialias: true, // default: false
  transparent: false, // default: false
  resolution: 1, // default: 1
  backgroundColor: 0xfefefe, // 0x1a1a26
  forceCanvas: true
});

let canvasRenderer = new PIXI.CanvasRenderer({
  antialias: true,
  resolution: 1
});

const procLines = new PIXI.Container();
const procGrafx = new PIXI.Container();
const procValves = new PIXI.Container();
let tempLines = new PIXI.Container();
let gridLines = new PIXI.Container();

app.stage.addChild(gridLines);
app.stage.addChild(tempLines);
app.stage.addChild(procLines);
app.stage.addChild(procGrafx);
app.stage.addChild(procValves);

// Setup DOM and events
document.querySelector("#app").appendChild(app.view);
document.querySelector("#app").addEventListener("mousedown", mouseDown);
document
  .getElementsByName("action")
  .forEach(e => e.addEventListener("change", updateAction));

drawGrid();

function drawText(client) {
  assets.drawing.text = {
    font: "Arial",
    size: "12",
    value: "Enter Text.....",
    client: client
  };
  // First pop open the modal
  document.getElementById("fontForm").style.display = "block";
}
function addText() {
  if (assets.drawing.text) {
    let t = assets.drawing.text;

    // Update the values
    t.value = document.getElementById("text-value").value;
    t.fontSize = document.getElementById("text-size").value;

    // Sort this out later....
    let txt = new PIXI.Text(t.value);
    txt.y = t.client.y;
    txt.x = t.client.x;
    txt.style.fontSize = Number(t.fontSize);
    txt.style.fill = "white";
    txt.style.fontFamily = "Arial";
    procGrafx.addChild(txt);

    // Interactive options
    txt.interactive = false;
    txt.buttonMode = true;
    txt.on("mousedown", () => symbolAction(txt));

    // Add to history
    assets.history.push(txt);

    // Add to array, creates it if it doesn't already exist
    if (assets.symbols.texts) assets.symbols.texts.push(txt);
    else assets.symbols.texts = [txt];

    assets.drawing.text = null;

    // Now close the modal....
    document.getElementById("fontForm").style.display = "none";
  }
}
function addTempLines(x, y) {
  if (!tempLines.destroyed) {
    tempLines = new PIXI.Container();
    app.stage.addChild(tempLines);
  }
  let tempLine = new PIXI.Graphics();
  tempLine.lineStyle(1, 0xff3333, 1);
  // X LINE
  tempLine.moveTo(0, y).lineTo(assets.width, y);
  // Y LINE
  tempLine.moveTo(x, 0).lineTo(x, assets.height);
  tempLines.addChild(tempLine);
  gsap.from(tempLines, { alpha: 0, duration: 0.1, ease: "none" });
}
function removeTempLines() {
  gsap.to(tempLines, {
    alpha: 0,
    duration: 0.1,
    ease: "none",
    onComplete: () =>
      tempLines.destroy({
        children: true,
        texture: true,
        baseTexture: true
      })
  });
}
function symbolAction(symbol) {
  let action = document.querySelector('input[name="action"]:checked').value;
  switch (action) {
    case "rotate":
      rotateSymbol(symbol);
      break;
    case "moveSymbol":
      moveSymbol(symbol);
      break;
  }
}
function deleteSymbol(symbol) {
  // We don't know where this symbol lives in our symbols object yet. Need to figure that out.
  symbol.destroy();
  assets.drawing.moveSymbol = null;
  // Set interactive mode back on because we still have move selected, this is a bit of a waste...
  interactiveMode(true);
}
function updateAction() {
  // Adding a delay to this because its being triggered before the value has updated in DOM
  // got to be a better way of doing this...
  setTimeout(() => {
    let action = document.querySelector('input[name="action"]:checked').value;
    updateHandler(action);
  }, 15);
}
function updateHandler(option) {
  switch (option) {
    case "rotate":
      interactiveMode(true);
      break;
    case "moveSymbol":
      interactiveMode(true);
      break;
    case "text":
      interactiveMode(true);
      break;
    default:
      if (assets.drawing.interactiveMode) interactiveMode(false);
      break;
  }
}
function interactiveMode(option) {
  assets.drawing.interactiveMode = option;
  Object.keys(assets.symbols).forEach(e => {
    let symbols = assets.symbols[e];
    for (let i = 0; i < symbols.length; i++) {
      let symbol = symbols[i];
      // To fix this once all symbols are corrected
      if (symbol.sprite) {
        symbol = symbols[i].sprite;
      } else {
        symbol = symbols[i];
      }
      symbol.interactive = option;
    }
  });
}
function moveSymbol(symbol) {
  symbol.alpha = 0.5;
  // Need a delay here as its being triggered too quickly
  setTimeout(() => {
    assets.drawing.moveSymbol = symbol;
    // Turn off interactive mode to prevent messing with other objects
    interactiveMode(false);
  }, 10);
}
function moveSymbolTo(client) {
  if (assets.drawing.moveSymbol) {
    let symbol = assets.drawing.moveSymbol;
    gsap.to(symbol, {
      x: client.x,
      y: client.y,
      alpha: 1,
      duration: 0.2,
      ease: "back"
    });

    assets.drawing.moveSymbol = null;
    interactiveMode(true);
  }
}
function rotateSymbol(symbol) {
  // Add more here once we have the document object made
  symbol.rotation += 4.712391;
}
function mouseDown(e) {
  // Fix coordinates now we have new layers on page ruining pageX
  let topMenu = document.querySelector("#topMenu");
  let x = e.pageX - offsetX;
  let y = e.pageY - topMenu.clientHeight;

  let client = {
    x: assets.snapToGrid ? scaleToGrid(x) : x,
    y: assets.snapToGrid ? scaleToGrid(y) : y
  };

  // Ensure colours up to date
  updateColors();

  // Reset dragging flag
  assets.drawing.dragging = false;
  // And remove mousemove listener
  document.querySelector("#app").removeEventListener("mousemove", mouseMove);

  let action = document.querySelector('input[name="action"]:checked').value;
  switch (action) {
    case "drawLine":
      drawLine(client);
      break;
    case "drawEllipse":
      drawEllipse(client);
      break;
    case "drawValve":
      drawValve(client);
      break;
    case "drawPolygon":
      drawPolygon(client);
      break;
    case "drawRectangle":
      drawRectangle(client);
      break;
    case "drawPump":
      drawPump(client);
      break;
    case "drawVessel":
      drawVessel(client);
      break;
    case "moveSymbol":
      moveSymbolTo(client);
      break;
    case "text":
      drawText(client);
      break;
  }
}
function mouseMove(e) {
  // NEED TO CONSOLIDATE MOST OF THIS INTO GENERAL MOUSE ACTION FUNCTION
  // JUST ADDED CIRCLE AND IT WASN'T WORKING.....PRIME EXAMPLE!

  // Fix coordinates now we have new layers on page ruining pageX
  let topMenu = document.querySelector("#topMenu");
  let x = e.pageX - offsetX;
  let y = e.pageY - topMenu.clientHeight;

  let client = {
    x: assets.snapToGrid ? scaleToGrid(x) : x,
    y: assets.snapToGrid ? scaleToGrid(y) : y
  };

  let action = document.querySelector('input[name="action"]:checked').value;
  switch (action) {
    case "drawLine":
      drawLine(client);
      break;
    case "drawValve":
      drawValve(client);
      break;
    case "drawPolygon":
      drawPolygon(client);
      break;
    case "drawRectangle":
      drawRectangle(client);
      break;
    case "drawPump":
      drawPump(client);
      break;
    case "drawVessel":
      drawVessel(client);
      break;
    case "drawEllipse":
      drawEllipse(client);
      break;
  }
}
function undo() {
  // First check if we are in drawing mode, if so, just cancel that
  if (!assets.drawing.startDraw) {
    assets.drawing.startDraw = true;
    // Clean up temp lines
    gsap.to(tempLines, {
      alpha: 0,
      duration: 0.1,
      ease: "none",
      onComplete: () =>
        tempLines.destroy({
          children: true,
          texture: true,
          baseTexture: true
        })
    });
  } else {
    if (assets.history.length > 0) {
      let s = assets.history[assets.history.length - 1];

      if (s.sprite) {
        s.destroy();
      } else {
        gsap.to(s, {
          alpha: 0,
          duration: 0.1,
          ease: "none",
          onComplete: () => s.destroy()
        });
        gsap.to(s.scale, {
          x: 0,
          y: 0,
          duration: 0.1,
          ease: "none"
        });
      }
      // Remove from array
      assets.history.pop();
    }
  }
}
function updateColor(option) {
  let c = document.getElementsByName(option)[0];
  let parts = c.value.split("#");
  assets.drawing[option] = Number("0x" + parts[1]);
  if (option == "bgColor")
    app.renderer.backgroundColor = assets.drawing.bgColor;
}
function updateLine() {
  let l = document.querySelector("#line");
  assets.drawing.lineWidth = Number(l.value);
}
function toggleGrid() {
  if (assets.snapToGrid) {
    gridLines.alpha = 0;
    assets.snapToGrid = false;
  } else {
    gridLines.alpha = 1;
    assets.snapToGrid = true;
  }
}
function scaleToGrid(x) {
  return Math.round(x / assets.gridLines) * assets.gridLines;
}
function grid(x) {
  assets.snapToGrid = true;
  gridLines.destroy({ children: true, texture: true, baseTexture: true });
  assets.gridLines = x;
  drawGrid();
}
function drawGrid() {
  if (!gridLines.destroyed) {
    gridLines = new PIXI.Container();
    app.stage.addChild(gridLines);
  }
  let lines = new PIXI.Graphics();
  gridLines.addChild(lines);
  gridLines.position.set(0, 0);
  // vertical lines
  for (let i = 0; i < assets.height / assets.gridLines; i++) {
    lines.lineStyle(1, 0x3333ff, 0.4);
    if (i % 2 == 0) lines.lineStyle(1, 0x3333ff, 0.2);
    lines
      .moveTo(0, i * assets.gridLines)
      .lineTo(assets.width, i * assets.gridLines);
  }
  // horizontal lines
  for (let i = 0; i < assets.width / assets.gridLines; i++) {
    lines.lineStyle(1, 0x3333ff, 0.4);
    if (i % 2 == 0) lines.lineStyle(1, 0x3333ff, 0.2);
    lines
      .moveTo(i * assets.gridLines, 0)
      .lineTo(i * assets.gridLines, assets.height);
  }
  gridLines.cacheAsBitmap = true;
}
function updateColors() {
  updateLineColor();
  updateFillColor();
  updateBGColor();
}
const updateLineColor = () => updateColor("lineColor");
const updateFillColor = () => updateColor("fillColor");
const updateBGColor = () => updateColor("bgColor");

window.onbeforeunload = function() {
  return "";
};
window.onload = function() {
  this.updateColors();
};
