var fileName; // nasty global for now

function saveDisplay() {
  let display = {
    displayName: "Methanol Recovery Process",
    thumbnail: "meoh.png",
    author: "",
    history: [],
    symbols: {}
  };

  let d = display.symbols;

  let keys = Object.keys(assets.symbols);

  for (key in keys) {
    let symType = keys[key];
    let symbolContainer = assets.symbols[symType];
    for (let i = 0; i < symbolContainer.length; i++) {
      let symbol = symbolContainer[i];

      let sym = {
        name: symType + i,
        x: symbol.x,
        y: symbol.y,
        width: symbol.width,
        height: symbol.height,
        lineColor: symbol.lineColor,
        fillColor: symbol.fillColor
      };

      switch (symType) {
        case "line":
          sym.lineWidth = symbol.lineWidth;
          break;
        case "polygon":
          sym.points = symbol.points;
          break;
        case "texts":
          sym.text = symbol.text;
          sym.font = symbol._font;
          sym.fontColor = symbol.tint;
      }

      if (d[symType]) {
        d[symType].push(sym);
      } else {
        d[symType] = [sym];
      }
    }
  }

  console.log(JSON.stringify(display));
}

function loadDisplay(filename) {
  fileName = filename;
  init();
}

function loadJSON(callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", "json/" + fileName + ".json", true);
  xobj.onreadystatechange = function() {
    if (xobj.readyState == 4 && xobj.status == "200") {
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

function init() {
  loadJSON(function(response) {
    let displayJSON = JSON.parse(response);
    loadFromFile(displayJSON);
  });
}

function loadFromFile(displayJSON) {
  let tempSymbols = [];
  // Fakes the client x,y data, will be overridden from file anyway
  let x = { x: 0, y: 0 };
  let keys = Object.keys(assets.symbols);
  if (keys.length != 0) {
    alert("Display is not empty. Please save this file first.");
  } else {
    keys = Object.keys(displayJSON.symbols);
    for (let i = 0; i < keys.length; i++) {
      let symType = keys[i];
      let symbolContainer = displayJSON.symbols[symType];
      for (let j = 0; j < symbolContainer.length; j++) {
        let symJSON = symbolContainer[j];
        switch (symType) {
          case "line":
            let l = new Line(x);
            // Fix the fixes that are made later on
            l.width -= l.lineWidth;
            l.x -= l.lineWidth;
            l.loadFromFile(symJSON);
            break;
          case "ellipse":
            let e = new Ellipse(x);
            e.loadFromFile(symJSON);
            break;
          case "polygon":
            let p = new Polygon(x);
            p.loadFromFile(symJSON);
            break;
          case "rectangle":
            let r = new Rectangle(x);
            r.loadFromFile(symJSON);
            break;
          case "pump":
            let pmp = new Pump(x);
            pmp.loadFromFile(symJSON);
            break;
          case "valve":
            let vlv = new Valve(x);
            vlv.loadFromFile(symJSON);
            break;
        }
      }
    }
  }
}
