window.onbeforeunload = function() {
  return "";
};
let app = new PIXI.Application({
  width: 1280, // default: 800
  height: 600, // default: 600
  antialias: true, // default: false
  transparent: false, // default: false
  resolution: 1, // default: 1
  backgroundColor: 0xcccccc,
  forceCanvas: true
});
let assets = {
  gridLines: 10,
  history: [],
  snapToGrid: true,
  drawing: {
    startDraw: true,
    currentDraw: {},
    lineColor: 0xffffff,
    lineWidth: 2
  },
  symbols: {}
};
const procGrafx = new PIXI.Container();
const procValves = new PIXI.Container();
let tempLines = new PIXI.Container();
let gridLines = new PIXI.Container();

app.stage.addChild(gridLines);
app.stage.addChild(tempLines);
app.stage.addChild(procGrafx);
app.stage.addChild(procValves);

function drawLine(client) {
  let x = client.x;
  let y = client.y;
  if (assets.drawing.startDraw) {
    // create two temp guide lines which sit above the grid layer
    // they will be disposed of once we finish our line
    if (assets.snapToGrid) tmpLines(x, y);
    assets.drawing.currentDraw = { x: x, y: y };
    assets.drawing.startDraw = false;
  } else {
    updateColor(); // Ensure up to date
    let start = {
      x: assets.drawing.currentDraw.x,
      y: assets.drawing.currentDraw.y
    };

    let xDelta = Math.abs(start.x - x);
    let yDelta = Math.abs(start.y - y);

    // Ensure line stays straight unless a 45 degree angle
    if (xDelta != yDelta) {
      if (xDelta > yDelta) {
        y = start.y;
        x;
      } else {
        x = start.x;
        y;
      }
    }

    let gfx = (assets.drawing.currentDraw = new PIXI.Graphics())
      .lineStyle(assets.drawing.lineWidth, assets.drawing.lineColor, 1)
      .moveTo(start.x, start.y)
      .lineTo(x, y);

    // Convert to Texture
    let l = app.renderer.generateTexture(gfx);
    let line = new PIXI.Sprite(l);
    procGrafx.addChild(line);
    // Fix minor glitch when drawing shapes backwards
    let drawX = start.x < x ? start.x : x;
    let drawY = start.y < y ? start.y : y;
    line.position.set(drawX, drawY);

    // Add to array, creates it if it doesn't already exist
    if (assets.symbols.lines) assets.symbols.lines.push(line);
    else assets.symbols.lines = [line];

    // Add to history
    assets.history.push(line);
    assets.drawing.startDraw = true;
    assets.drawing.currentDraw = {};

    // Silly animation
    gsap.from(line, { alpha: 0, duration: 0.2 });

    // Clean up temp lines
    gsap.to(tempLines, {
      alpha: 0,
      duration: 0.2,
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
function drawRectangle(client) {
  let x = client.x;
  let y = client.y;

  if (assets.drawing.startDraw) {
    // create two temp guide rectangles which sit above the grid layer
    // they will be disposed of once we finish our rectangle
    if (assets.snapToGrid) tmpLines(x, y);
    assets.drawing.currentDraw = { x: x, y: y };
    assets.drawing.startDraw = false;
  } else {
    updateColor(); // Ensure up to date
    let start = {
      x: assets.drawing.currentDraw.x,
      y: assets.drawing.currentDraw.y
    };

    let gfx = new PIXI.Graphics()
      .lineStyle(1, 0x000000, 1)
      .beginFill(assets.drawing.lineColor)
      .drawRect(start.x, start.y, x - start.x, y - start.y)
      .endFill();

    // Further fix needed for rectangles not rendering correctly when
    // drawn backwards
    if (x < start.x) gfx.scale.x = -1;
    if (y < start.y) gfx.scale.y = -1;

    // Convert to Texture
    let l = app.renderer.generateTexture(gfx);
    let rectangle = new PIXI.Sprite(l);
    procGrafx.addChild(rectangle);

    // Fix minor glitch when drawing shapes backwards
    let drawX = start.x < x ? start.x : x;
    let drawY = start.y < y ? start.y : y;
    rectangle.position.set(drawX, drawY);

    // Add to array, creates it if it doesn't already exist
    if (assets.symbols.rectangles) assets.symbols.rectangles.push(rectangle);
    else assets.symbols.rectangles = [rectangle];

    // Add to history
    assets.history.push(rectangle);
    assets.drawing.startDraw = true;
    assets.drawing.currentDraw = {};

    // Silly animation
    gsap.from(rectangle, { alpha: 0, duration: 0.2 });

    // Clean up temp lines
    gsap.to(tempLines, {
      alpha: 0,
      duration: 0.2,
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
  let units = 10;

  updateColor(); // Ensure up to date

  // prettier-ignore
  let path = [0 * units, 0 * units,
              2 * units, 1 * units,
              4 * units, 0 * units,
              4 * units, 2 * units,
              2 * units, 1 * units,
              0 * units, 2 * units];

  let gfx = new PIXI.Graphics()
    .lineStyle(1, 0x000000, 1)
    .beginFill(assets.drawing.lineColor)
    .drawPolygon(path)
    .endFill();

  // Now convert to Sprite and add to stage
  let v = app.renderer.generateTexture(gfx);
  let vlv = new PIXI.Sprite(v);
  vlv.x = x;
  vlv.y = y;
  vlv.anchor.x = 0.5;
  vlv.anchor.y = 0.5;
  vlv.interactive = true;
  vlv.buttonMode = true;
  vlv.on("mousedown", () => rotateValve(vlv));

  procValves.addChild(vlv);

  // Add to array, creates it if it doesn't already exist
  if (assets.symbols.vales) assets.symbols.valves.push(vlv);
  else assets.symbols.valves = [vlv];

  // Add to history
  assets.history.push(vlv);

  // clean up graphic object
  gfx.destroy();

  // Animation
  gsap.from(vlv, { alpha: 0, duration: 0.2, ease: "none" });
}
function drawPump(client) {
  let x = client.x;
  let y = client.y;
  // let units = assets.gridLines;
  let units = 10;

  updateColor(); // Ensure up to date

  // prettier-ignore
  let path = [0 * units, 1 * units,
              2 * units, 4 * units,
              -2 * units, 4 * units];

  let gfx = new PIXI.Graphics()
    .lineStyle(1, 0x000000, 1)
    .beginFill(assets.drawing.lineColor)
    .drawPolygon(path)
    .endFill()
    .beginFill(assets.drawing.lineColor)
    .drawCircle(0, 12, 20, 20)
    .endFill();

  // Now convert to Sprite and add to stage
  let p = app.renderer.generateTexture(gfx);
  let pmp = new PIXI.Sprite(p);
  pmp.x = x;
  pmp.y = y;
  // pmp.anchor.x = 0.5;
  // pmp.anchor.y = 0.5;
  // pmp.interactive = true;
  // pmp.buttonMode = true;
  // pmp.on("mousedown", () => rotatePump(pmp));

  procGrafx.addChild(pmp);

  // Add to array, creates it if it doesn't already exist
  if (assets.symbols.vales) assets.symbols.pumps.push(pmp);
  else assets.symbols.pumps = [pmp];

  // Add to history
  assets.history.push(pmp);

  // clean up graphic object
  gfx.destroy();

  // Animation
  gsap.from(pmp, { alpha: 0, duration: 0.2, ease: "none" });
}
function rotateValve(that) {
  let action = document.querySelector('input[name="action"]:checked').value;
  if (action == "rotate") that.rotation += 1.5708;
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
  }
}
function undo() {
  if (assets.history.length > 0) {
    let s = assets.history[assets.history.length - 1];

    gsap.to(s, {
      alpha: 0,
      duration: 0.2,
      ease: "none",
      onComplete: () => s.destroy()
    });

    // Remove from array
    assets.history.pop();
  }
}
function updateColor() {
  let c = document.querySelector("#input-color");
  let tmp = c.value.split("#");
  assets.drawing.lineColor = Number("0x" + tmp[1]);
}
function updateLine() {
  let l = document.querySelector("#line");
  assets.drawing.lineWidth = l.value;
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
  tempLine.moveTo(0, y).lineTo(1280, y);
  // Y LINE
  tempLine.moveTo(x, 0).lineTo(x, 800);
  tempLines.addChild(tempLine);
  gsap.from(tempLines, { alpha: 0, duration: 0.1, ease: "none" });
  tempLines.cacheAsBitmap = true;
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
  for (let i = 0; i < 800 / assets.gridLines; i++) {
    lines.lineStyle(1, 0x3333ff, 0.4);
    if (i % 2 == 0) lines.lineStyle(1, 0x3333ff, 0.2);
    lines.moveTo(0, i * assets.gridLines).lineTo(1280, i * assets.gridLines);
  }
  // horizontal lines
  for (let i = 0; i < 1280 / assets.gridLines; i++) {
    lines.lineStyle(1, 0x3333ff, 0.4);
    if (i % 2 == 0) lines.lineStyle(1, 0x3333ff, 0.2);
    lines.moveTo(i * assets.gridLines, 0).lineTo(i * assets.gridLines, 800);
  }
  gridLines.cacheAsBitmap = true;
}

// Setup DOM and events
document.querySelector("#app").appendChild(app.view);
document.querySelector("#app").addEventListener("mousedown", mouseDown);
drawGrid();
