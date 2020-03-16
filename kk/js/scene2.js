let app = new PIXI.Application({
  width: 600, // default: 800
  height: 600, // default: 600
  antialias: true, // default: false
  transparent: false, // default: false
  resolution: 1 // default: 1
});
document.querySelector("#app").appendChild(app.view);

app.stop();

let skulls = [];
let count = 0;
const myContainer = new PIXI.Container();
myContainer.x = 400;
myContainer.y = 200;
app.stage.addChild(myContainer);

app.loader.add("skull", "scenes/skull.png").load(setup);

function setup() {
  for (let i = 0; i < 100; i++) {
    let skull = PIXI.Sprite.from("skull");
    skull.anchor.x = 0.5;
    skull.anchor.y = 0.5;
    skull.x = -400 + Math.random() * 800;
    skull.y = -400 + Math.random() * 800;
    skull.interactive = true;
    skull.buttonMode = true;
    skull.on("pointerdown", dragStart);
    skull.tint = Math.random() * 1000 * 0xffffff;
    if (i < 99) skull.blendMode = PIXI.BLEND_MODES.ADD;
    skulls.push(skull);
    myContainer.addChild(skull);
  }

  app.start();

  function dragStart(e) {
    this.data = e.data;
    this.alpha = 0.5;
    const newPos = e.data.getLocalPosition(e.parent);
    e.x = newPos.x;
    e.y = newPos.y;
  }

  /*  app.ticker.add(() => {
    for (let i = 0; i < skulls.length; i++) {
      let skull = skulls[i];
      skull.x += Math.sin(count);
      skull.y += Math.sin(count);
      skull.rotation += 0.1;
    }

    myContainer.scale.x = Math.sin(count);
    myContainer.scale.y = Math.sin(count);
    count += 0.01;

    myContainer.rotation += 0.01;
  }); */
}
