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
    this.id = null;
    this.resizable = true;
  }
  initialize(client) {
    // Add Graphic to the main stage so it is on top of everything else
    app.stage.addChild(this.graphic);

    // Kick off the event listerner for dragging the size and set dragging flag
    if (this.resizable) {
      // Draw guide lines if snap to grid enabled
      if (assets.snapToGrid) addTempLines(this.x, this.y);
      assets.drawing.dragging = true;
      this.registerMoveListener();
      this.draw(client); // THIS MUST BE IMPLEMENTED PER EACH DERIVED CLASS!
    } else {
      this.finishDrawing();
    }
  }
  update(client) {
    // Update props
    this.width = client.x - this.x;
    this.height = client.y - this.y;

    // so much for the open close principle...we'll finish the polygon drawing in its own method
    // until I can think how better this should be done... pass on client we'll need it.
    if (this.type == "polygon") {
      this.polygonHandler(client);
    } else {
      if (assets.drawing.dragging) this.draw();
      else this.finishDrawing();
    }
  }
  finishDrawing(client) {
    // Need to clear the previous graphic
    this.graphic.destroy();
    this.graphic = new PIXI.Graphics();

    // Normalise the coordinates in case we drew the symbol backwards // disable on polyons during dev
    if (this.resizable && this.type != "polygon") this.normaliseCoordinates();

    // Redraw and convert to sprite texture
    this.draw();
    this.convertToSprite();
    this.makeInteractive();
    this.addToStage();
    removeTempLines();

    // Add to undo stack
    assets.history.push(this);

    // Add to array, creates it if it doesn't already exist. Create ID so we know array position
    if (assets.symbols[this.type]) {
      this.id = assets.symbols[this.type].length;
      assets.symbols[this.type].push(this);
    } else {
      this.id = 0;
      assets.symbols[this.type] = [this];
    }

    // Set size if not already calculated
    if (this.height == 0 && this.width == 0) {
      this.height = this.sprite.height;
      this.width = this.sprite.width;
    }

    // Reset draw flags
    assets.drawing.currentDraw = null;
    assets.drawing.startDraw = true;
    delete this.drawing;
  }
  registerMoveListener() {
    document.querySelector("#app").addEventListener("mousemove", mouseMove);
  }
  addToStage() {
    switch (this.type) {
      case "line":
        procLines.addChild(this.sprite);
        break;
      default:
        procGrafx.addChild(this.sprite);
        break;
    }
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
    delete this.graphic;
  }
  normaliseCoordinates() {
    let lineIsDiaganol = this.height > 0 && this.width > 0;

    if (!this.centred && !lineIsDiaganol) {
      if (this.width < 0) {
        this.width = Math.abs(this.width);
        this.x -= this.width;
      }
      if (this.height < 0) {
        this.height = Math.abs(this.height);
        this.y -= this.height;
      }
    } else {
      this.width = Math.abs(this.width);
      this.height = Math.abs(this.height);
    }
  }
  makeInteractive() {
    this.sprite.interactive = false;
    this.sprite.buttonMode = true;
    this.sprite.on("mousedown", () => symbolAction(this.sprite));
  }
  destroy() {
    // Destroy the sprite object
    this.sprite.destroy();
    // And remove from array
    assets.symbols[this.type].splice(this.id, 1);
    // And clean up array is last item
    if (assets.symbols[this.type].length == 0) delete assets.symbols[this.type];
  }
  loadFromFile(sym) {
    // Defaults
    this.height = sym.height;
    this.width = sym.width;
    this.x = sym.x;
    this.y = sym.y;
    this.name = sym.name;
    // Specific
    if (sym.lineColor) this.lineColor = sym.lineColor;
    if (sym.lineWidth) this.lineWidth = sym.lineWidth;
    if (sym.fillColor) this.fillColor = sym.fillColor;
    if (sym.fontColor) this.fontColor = sym.fontColor;
    if (sym.font) this.font = sym.font;
    if (sym.text) this.text = sym.text;
    if (sym.points) this.points = sym.points;
    // Fix the fixes that are made later on
    if (this.type == "line" && this.height == 0) {
      this.width -= this.lineWidth;
    }

    this.finishDrawing();
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
class Valve extends Shape {
  constructor(client) {
    super(client);
    this.type = "valve";
    this.resizable = false;
    this.centred = true;
  }
  draw() {
    let units = 10;
    // prettier-ignore
    let path = [
        2 * units, 1 * units,
        4 * units, 0 * units,
        4 * units, 2 * units,
        2 * units, 1 * units,
        0 * units, 2 * units,
        0 * units, 0 * units
      ];

    this.graphic
      .lineStyle(1, 0x000000, 1)
      .beginFill(this.fillColor)
      .drawPolygon(path)
      .endFill();
  }
}
class Polygon extends Shape {
  constructor(client) {
    super(client);
    this.type = "polygon";
    this.resizable = true;
    this.points = [
      { x: this.x, y: this.y },
      { x: this.x, y: this.y },
      { x: this.x, y: this.y }
    ];
    this.currentPoint = 1;
  }
  polygonHandler(client) {
    if (assets.drawing.dragging) {
      this.draw(client);
    } else {
      this.addPoint(client);
    }
  }
  draw(client) {
    if (client) {
      this.points[this.currentPoint] = {
        x: client.x,
        y: client.y
      };
    }

    this.graphic
      .clear()
      .lineStyle(1, 0x000000, 1)
      .beginFill(this.fillColor)
      .drawPolygon(this.getPathFromPoints())
      .endFill();
  }
  addPoint(client) {
    // prettier-ignore
    if ((!this.points[this.currentPoint]) && (!this.points[this.currentPoint])){
      this.drawing = false;
    }

    if (this.drawing) {
      this.currentPoint++;
      this.registerMoveListener();
      assets.drawing.dragging = true;
    } else {
      this.finishDrawing();
    }
  }
  getPathFromPoints() {
    // We will store each point in the polygon as a pair, but PIXI expects them all in
    // one big array
    let path = [];
    for (let i = 0; i < this.points.length; i++) {
      path.push(this.points[i].x);
      path.push(this.points[i].y);
    }
    return path;
  }
}
class Pump extends Shape {
  constructor(client) {
    super(client);
    this.type = "pump";
    this.resizable = false;
    this.centred = true;
  }
  draw() {
    let units = 10;

    // prettier-ignore
    let path = [0 * units, 1 * units,
                2 * units, 4 * units,
                -2 * units, 4 * units];

    this.graphic
      .lineStyle(1, 0x000000, 1)
      .beginFill(assets.drawing.fillColor)
      .drawPolygon(path)
      .endFill()
      .beginFill(assets.drawing.fillColor)
      .drawEllipse(0, 12, 20, 20)
      .endFill();
  }
}
// Drawing Functions
function drawRectangle(client) {
  if (!assets.drawing.currentDraw) {
    assets.drawing.currentDraw = new Rectangle(client);
    assets.drawing.currentDraw.initialize();
  } else {
    assets.drawing.currentDraw.update(client);
  }
}
function drawLine(client) {
  if (!assets.drawing.currentDraw) {
    assets.drawing.currentDraw = new Line(client);
    assets.drawing.currentDraw.initialize();
  } else {
    assets.drawing.currentDraw.update(client);
  }
}
function drawEllipse(client) {
  if (!assets.drawing.currentDraw) {
    assets.drawing.currentDraw = new Ellipse(client);
    assets.drawing.currentDraw.initialize();
  } else {
    assets.drawing.currentDraw.update(client);
  }
}
function drawValve(client) {
  if (!assets.drawing.currentDraw) {
    assets.drawing.currentDraw = new Valve(client);
    assets.drawing.currentDraw.initialize();
  } else {
    assets.drawing.currentDraw.update(client);
  }
}
function drawPolygon(client) {
  if (!assets.drawing.currentDraw) {
    assets.drawing.currentDraw = new Polygon(client);
    assets.drawing.currentDraw.initialize(client);
  } else {
    assets.drawing.currentDraw.update(client);
  }
}
function drawPump(client) {
  if (!assets.drawing.currentDraw) {
    assets.drawing.currentDraw = new Pump(client);
    assets.drawing.currentDraw.initialize();
  } else {
    assets.drawing.currentDraw.update(client);
  }
}
