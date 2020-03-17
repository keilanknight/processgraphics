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
  backgroundColor: 0x1a1a26,
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
      symbol.interactive = option;
    }
  });
}
function drawLine2(client) {
  let x = client.x;
  let y = client.y;
  if (assets.drawing.startDraw) {
    // create two temp guide lines which sit above the grid layer
    // they will be disposed of once we finish our line
    if (assets.snapToGrid) tmpLines(x, y);
    assets.drawing.currentDraw = { x: x, y: y };
    assets.drawing.startDraw = false;
  } else {
    let start = {
      x: assets.drawing.currentDraw.x,
      y: assets.drawing.currentDraw.y
    };

    // Found the diaganol bug 1, need to do this delta check BEFORE increasing x
    let xDelta = Math.abs(x - start.x);
    let yDelta = Math.abs(y - start.y);

    let diaganolLine = xDelta == yDelta ? true : false;
    let horizontalLine = xDelta > yDelta ? true : false;

    // Sort out the coordinates if we drew it backwards
    let temp = { x: start.x, y: start.y };
    if (start.x > x) (start.x = x), (x = temp.x);
    if (start.y > y) (start.y = y), (y = temp.y);

    // Edge out the line so they always join up
    x += assets.drawing.lineWidth;

    // Ensure line stays straight unless a 45 degree angle
    if (assets.snapToGrid && !diaganolLine) {
      if (horizontalLine) y = start.y;
      else x = start.x;
    }

    let gfx = (assets.drawing.currentDraw = new PIXI.Graphics())
      .lineStyle(assets.drawing.lineWidth, assets.drawing.lineColor, 1)
      .moveTo(start.x, start.y)
      .lineTo(x, y);

    // Convert to Texture
    let l = app.renderer.generateTexture(gfx);
    let line = new PIXI.Sprite(l);

    // Add to Lines container and set correct position
    procLines.addChild(line);
    line.position.set(start.x, start.y);

    // Interactive options
    line.interactive = false;
    line.buttonMode = true;
    line.on("mousedown", () => symbolAction(line));

    // Add to array, creates it if it doesn't already exist
    if (assets.symbols.lines) assets.symbols.lines.push(line);
    else assets.symbols.lines = [line];

    // Add to history
    assets.history.push(line);
    assets.drawing.startDraw = true;
    assets.drawing.currentDraw = {};

    // Silly animation
    gsap.from(line, { alpha: 0, duration: 0.1 });

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

    // Clean up Graphic object
    gfx.destroy();
  }
}

class Shape {
  constructor(client) {
    // Setup initial properties
    this.x = client.x;
    this.y = client.y;
    this.height = 0;
    this.width = 0;
    this.centred = false;
    this.lineColor = 0x000000;
    this.fillColor = assets.drawing.fillColor;
    this.drawing = true;
    this.graphic = new PIXI.Graphics();
    this.graphic.alpha = 0.5;
    this.sprite = new PIXI.Sprite();

    // Draw guide lines if snap to grid enabled
    if (assets.snapToGrid) tmpLines(client.x, client.y);

    // Add Graphic to the process graphics container
    procGrafx.addChild(this.graphic);

    // Kick off the event listerner for dragging the size and set dragging flag
    assets.drawing.dragging = true;
    document.querySelector("#app").addEventListener("mousemove", mouseMove);
    this.draw(); // THIS MUST BE IMPLEMENTED PER EACH DERIVED CLASS!
  }
  update(client) {
    // Update props
    this.width = client.x - this.x;
    this.height = client.y - this.y;

    if (assets.drawing.dragging) this.draw();
    else this.finishDrawing();
  }
  finishDrawing() {
    // Need to clear the previous graphic
    this.graphic.destroy();
    this.graphic = new PIXI.Graphics();

    // Normalise the coordinates in case we drew the symbol backwards
    // Don't do this for centre aligned objects
    if (!this.centred) this.normaliseCoordinates();

    // Redraw and convert to sprite texture
    this.draw();
    this.convertToSprite();
    //this.makeInteractive();
    app.stage.addChild(this.sprite);
    removeTempLines();

    // Add to undo stack - just the sprite for now...correct later
    assets.history.push(this.sprite);

    // Add to array, creates it if it doesn't already exist
    if (assets.symbols[this.type]) assets.symbols[this.type].push(this);
    else assets.symbols[this.type] = [this];

    // Reset draw flags
    assets.drawing.currentDraw = null;
    assets.drawing.startDraw = true;
  }
  convertToSprite() {
    // Convert to Texture
    let texture = canvasRenderer.generateTexture(this.graphic);
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.smoothed = true;

    // Add to stage at correct position
    if (this.type == "line") procLines.addChild(this.sprite);
    else procGrafx.addChild(this.sprite);

    this.sprite.position.set(this.x, this.y);

    // Add anchor point if centre aligned (eg. Ellipses)
    if (this.centred) {
      this.sprite.anchor.x = 0.5;
      this.sprite.anchor.y = 0.5;
      this.sprite.x += 1; // Not sure why this needed
    }

    // Destroy graphic object
    this.graphic.destroy();
  }
  normaliseCoordinates() {
    if (this.width < 0) {
      this.width = Math.abs(this.width);
      this.x -= this.width;
    }
    if (this.height < 0) {
      this.height = Math.abs(this.width);
      this.y -= this.height;
    }
  }
  makeInteractive() {
    this.sprite.interactive = false;
    this.sprite.buttonMode = true;
    this.sprite.on("mousedown", () => symbolAction(this.sprite));
  }
}
class Rectangle extends Shape {
  constructor(client) {
    super(client);
    this.type = "rectangle";
  }
  draw() {
    this.graphic
      .clear()
      .lineStyle(1, this.lineColor, 1)
      .beginFill(this.fillColor)
      .drawRect(this.x, this.y, this.width, this.height)
      .endFill();
  }
}
class Line extends Shape {
  constructor(client) {
    super(client);
    this.type = "line";
    this.lineWidth = assets.drawing.lineWidth;
    this.lineColor = assets.drawing.lineColor;
  }
  draw() {
    // Increase the width by the line unit so there are no gaps
    // unless the line is diaganol
    let lineIsDiaganol = this.height > 0 && this.width > 0;
    if (!lineIsDiaganol && this.height == 0) this.width += this.lineWidth;

    this.graphic
      .clear()
      .lineStyle(this.lineWidth, this.lineColor, 1)
      .moveTo(this.x, this.y)
      .lineTo(this.x + this.width, this.y + this.height);
  }
}
class Ellipse extends Shape {
  constructor(client) {
    super(client);
    this.type = "ellipse";
    this.centred = true;
  }
  draw() {
    this.graphic
      .clear()
      .lineStyle(1, this.lineColor, 1)
      .beginFill(this.fillColor)
      .drawEllipse(this.x, this.y, this.width, this.height)
      .endFill();
  }
}
function drawRectangle(client) {
  if (!assets.drawing.currentDraw) {
    assets.drawing.currentDraw = new Rectangle(client);
  } else {
    assets.drawing.currentDraw.update(client);
  }
}
function drawLine(client) {
  if (!assets.drawing.currentDraw) {
    assets.drawing.currentDraw = new Line(client);
  } else {
    assets.drawing.currentDraw.update(client);
  }
}
function drawEllipse(client) {
  if (!assets.drawing.currentDraw) {
    assets.drawing.currentDraw = new Ellipse(client);
  } else {
    assets.drawing.currentDraw.update(client);
  }
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
function drawVessel(client) {
  let x = client.x;
  let y = client.y;

  if (assets.drawing.startDraw) {
    // create two temp guide vessels which sit above the grid layer
    // they will be disposed of once we finish our vessel
    if (assets.snapToGrid) tmpLines(x, y);
    assets.drawing.currentDraw = { x: x, y: y };
    assets.drawing.startDraw = false;
  } else {
    let start = {
      x: assets.drawing.currentDraw.x,
      y: assets.drawing.currentDraw.y
    };

    // Sort out the coordinates if we drew it backwards
    let temp = { x: start.x, y: start.y };
    if (start.x > x) (start.x = x), (x = temp.x);
    if (start.y > y) (start.y = y), (y = temp.y);

    // Vessel dimensions
    let vesselDimensions = {
      width: x - start.x,
      height: y - start.y,
      rectangle: {
        x: start.x,
        y: start.y + start.y * 0.2,
        width: x - start.x,
        height: (y - start.y) * 0.8
      },
      arcTop: { start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },
      arcBtm: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }
    };

    let r = vesselDimensions.rectangle;
    console.log(r);

    let gfx = new PIXI.Graphics()
      // Rectangle
      .lineStyle(1, 0x000000, 1)
      .beginFill(assets.drawing.fillColor)
      .drawRect(r.x, r.y, r.width, r.height)
      .endFill();
    // Arc Top
    // Arc Bottom

    // Convert to Texture
    let txtr = app.renderer.generateTexture(gfx);
    let vessel = new PIXI.Sprite(txtr);
    procGrafx.addChild(vessel);

    // Fix minor glitch when drawing shapes backwards
    let drawX = start.x < x ? start.x : x;
    let drawY = start.y < y ? start.y : y;
    vessel.position.set(drawX, drawY);

    // Add to array, creates it if it doesn't already exist
    if (assets.symbols.vessels) assets.symbols.vessels.push(vessel);
    else assets.symbols.vessels = [vessel];

    // Add to history
    assets.history.push(vessel);
    assets.drawing.startDraw = true;
    assets.drawing.currentDraw = {};

    // Silly animation
    gsap.from(vessel, { alpha: 0, duration: 0.1 });

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

    // Clean up Graphic object
    gfx.destroy();
  }
}
function drawValve(client) {
  let x = client.x;
  let y = client.y;
  // let units = assets.gridLines;
  let units = 12;

  // prettier-ignore
  let path = [0 * units, 0 * units,
              2 * units, 1 * units,
              4 * units, 0 * units,
              4 * units, 2 * units,
              2 * units, 1 * units,
              0 * units, 2 * units];

  let gfx = new PIXI.Graphics()
    .lineStyle(1, 0x000000, 1)
    .beginFill(assets.drawing.fillColor)
    .drawPolygon(path)
    .endFill();

  // Now convert to Sprite and add to stage
  let v = canvasRenderer.generateTexture(gfx);
  let vlv = new PIXI.Sprite(v);
  vlv.x = x;
  vlv.y = y;
  vlv.anchor.x = 0.5;
  vlv.anchor.y = 0.5;
  vlv.interactive = false;
  vlv.buttonMode = true;
  vlv.on("mousedown", () => symbolAction(vlv));

  procValves.addChild(vlv);

  // Add to array, creates it if it doesn't already exist
  if (assets.symbols.valves) assets.symbols.valves.push(vlv);
  else assets.symbols.valves = [vlv];

  // Add to history
  assets.history.push(vlv);

  // clean up graphic object
  gfx.destroy();

  // Animation
  gsap.from(vlv, { alpha: 0, duration: 0.1, ease: "none" });
}
function drawPump(client) {
  let x = client.x;
  let y = client.y;
  // let units = assets.gridLines;
  let units = 10;

  // prettier-ignore
  let path = [0 * units, 1 * units,
              2 * units, 4 * units,
              -2 * units, 4 * units];

  let gfx = new PIXI.Graphics()
    .lineStyle(1, 0x000000, 1)
    .beginFill(assets.drawing.fillColor)
    .drawPolygon(path)
    .endFill()
    .beginFill(assets.drawing.fillColor)
    .drawEllipse(0, 12, 20, 20)
    .endFill();

  // Now convert to Sprite and add to stage
  let p = app.renderer.generateTexture(gfx);
  let pmp = new PIXI.Sprite(p);
  pmp.x = x;
  pmp.y = y;

  // Interactive options
  pmp.interactive = false;
  pmp.buttonMode = true;
  pmp.on("mousedown", () => symbolAction(pmp));

  procGrafx.addChild(pmp);

  // Add to array, creates it if it doesn't already exist
  if (assets.symbols.pumps) assets.symbols.pumps.push(pmp);
  else assets.symbols.pumps = [pmp];

  // Add to history
  assets.history.push(pmp);

  // clean up graphic object
  gfx.destroy();

  // Animation
  gsap.from(pmp, { alpha: 0, duration: 0.1, ease: "none" });
}
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
    //symbol.x = client.x;
    //symbol.y = client.y;
    //symbol.alpha = 1;
    // Let's animate it for fun...
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
  symbol.rotation += 1.5708;
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
function tmpLines(x, y) {
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
    lines.moveTo(0, i * assets.gridLines).lineTo(assets.width, i * assets.gridLines);
  }
  // horizontal lines
  for (let i = 0; i < assets.width / assets.gridLines; i++) {
    lines.lineStyle(1, 0x3333ff, 0.4);
    if (i % 2 == 0) lines.lineStyle(1, 0x3333ff, 0.2);
    lines.moveTo(i * assets.gridLines, 0).lineTo(i * assets.gridLines, assets.height);
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
