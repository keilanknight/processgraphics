"use strict";
const app = new PIXI.Application({
  width: 680,
  height: 560,
  antialias: true,
  transparent: false,
  resolution: 1
});
const chips = {
  value: 0,
  coords: [],
  graphics: {
    25: "chips-5.png",
    50: "chips-4.png",
    100: "chips-2.png",
    500: "chips-9.png",
    1000: "chips-7.png",
    5000: "chips-1.png",
    10000: "chips-3.png"
  },
  updateBalance(){
    this.text.text = "$T" + this.value;
  },
  createNewChip(value) {
    let coords = { x: 300, y: 400 };
  
    if (chips.coords.length > 0) {
      let lastChip = chips.coords[chips.coords.length - 1];
      coords = { x: lastChip.x, y: lastChip.y - 10 };
    }
    chips.coords.push(coords);
    chips.value += value;
    chips.updateBalance();
  
    let chip = new PIXI.Sprite(sheet.textures[chips.graphics[value]]);
  
    chip.scale.x = 0.5;
    chip.scale.y = 0.5;
    chip.position.set(coords.x, coords.y);
    chip.interactive = true;
    chip.buttonMode = true;
    chip.on("mousedown", () => chips.createNewChip(value));
  
    app.stage.addChild(chip);
  }
};
let sheet = null;

app.loader.add("chips", "roulette/chips.json").load(setup);
document.querySelector("#app").appendChild(app.view);

function setup() {
  app.renderer.backgroundColor = 0x003300;
  sheet = app.loader.resources["chips"].spritesheet;

  // Table
  let rectangle = new PIXI.Graphics();
  rectangle.beginFill(0x3b5e33);
  rectangle.drawRect(0, 560 - 300, 680, 250);
  rectangle.endFill();
  app.stage.addChild(rectangle);

  // Bet amount
  chips.text = new PIXI.Text("T$" + chips.value);
  chips.text.y = 390;
  chips.text.x = 170;
  chips.text.style.fontSize = 18;
  chips.text.style.fill = "white";
  chips.text.style.fontFamily = "Arial Black";
  app.stage.addChild(chips.text);

  chips.createNewChip(50);
}