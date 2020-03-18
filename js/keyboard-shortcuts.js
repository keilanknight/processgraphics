bindAll();

function bindAll() {
  // Menu
  Mousetrap.bind("l", function() {
    document.getElementById("drawLine").checked = true;
    updateHandler("drawLine");
  });
  Mousetrap.bind("r", function() {
    document.getElementById("rotate").checked = true;
    updateHandler("rotate");
  });
  Mousetrap.bind("m", function() {
    document.getElementById("moveSymbol").checked = true;
    updateHandler("moveSymbol");
  });
  Mousetrap.bind("t", function() {
    document.getElementById("text").checked = true;
    updateHandler("text");
  });
  Mousetrap.bind(["ctrl+z", "command+z"], function() {
    undo();
  });

  // Handle Moving
  Mousetrap.bind("left", function() {
    if (assets.drawing.moveSymbol) {
      let sym = assets.drawing.moveSymbol;
      sym.x -= assets.gridLines;
    }
  });
  Mousetrap.bind("right", function() {
    if (assets.drawing.moveSymbol) {
      let sym = assets.drawing.moveSymbol;
      sym.x += assets.gridLines;
    }
  });
  Mousetrap.bind("up", function() {
    if (assets.drawing.moveSymbol) {
      let sym = assets.drawing.moveSymbol;
      sym.y -= assets.gridLines;
    }
  });
  Mousetrap.bind("down", function() {
    if (assets.drawing.moveSymbol) {
      let sym = assets.drawing.moveSymbol;
      sym.y += assets.gridLines;
    }
  });
  Mousetrap.bind("enter", function() {
    if (assets.drawing.moveSymbol) {
      let sym = assets.drawing.moveSymbol;
      let client = { x: sym.x, y: sym.y };
      moveSymbolTo(client);
    }
  });
  Mousetrap.bind(["del", "backspace"], function() {
    if (assets.drawing.moveSymbol) {
      let sym = assets.drawing.moveSymbol;
      deleteSymbol(sym);
    }
  });
}

function unbindAll() {
  // prettier-ignore
  let keysToUnbind = ["l", "r", "m", "left", "right", "up", "down", "enter", ["del", "backspace"]];

  for (let i = 0; i < keysToUnbind.length; i++) {
    Mousetrap.unbind(keysToUnbind[i]);
  }
}
