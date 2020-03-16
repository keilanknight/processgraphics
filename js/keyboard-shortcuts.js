// Menu
Mousetrap.bind('l', function() { document.getElementById("drawLine").checked = true; });
Mousetrap.bind('r', function() { document.getElementById("rotate").checked = true; });
Mousetrap.bind('m', function() { document.getElementById("moveSymbol").checked = true; });

// Handle Moving
Mousetrap.bind('left', function() {
    if(assets.drawing.moveSymbol){
        let sym = assets.drawing.moveSymbol;
        sym.x -= assets.gridLines;
    }
});
Mousetrap.bind('right', function() {
    if(assets.drawing.moveSymbol){
        let sym = assets.drawing.moveSymbol;
        sym.x += assets.gridLines;
    }
});
Mousetrap.bind('up', function() {
    if(assets.drawing.moveSymbol){
        let sym = assets.drawing.moveSymbol;
        sym.y -= assets.gridLines;
    }
});
Mousetrap.bind('down', function() {
    if(assets.drawing.moveSymbol){
        let sym = assets.drawing.moveSymbol;
        sym.y += assets.gridLines;
    }
});
Mousetrap.bind('enter', function() {
    if(assets.drawing.moveSymbol){
        let sym = assets.drawing.moveSymbol;
        let client = {x: sym.x, y:sym.y};
        moveSymbolTo(client);
    }
});
