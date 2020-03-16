let app = new PIXI.Application({
  width: 600, // default: 800
  height: 600, // default: 600
  antialias: true, // default: false
  transparent: false, // default: false
  resolution: 1 // default: 1
});

let TextureCache = PIXI.utils.TextureCache,
  Sprite = PIXI.Sprite;

PIXI.loader.add([["images/anims.json"],["images/images.json"]]).load(setup);

let assets = {};

function anims(){

}

function setup() {
  console.log(TextureCache);
  assets.background = new Sprite(TextureCache[1]);
  assets.cloud1 = new Sprite(TextureCache[2]);
  assets.cloud2 = new Sprite(TextureCache[2]);
  assets.grass = new Sprite(TextureCache[4]);
  assets.grass2 = new Sprite(TextureCache[4]);
  assets.man = new Sprite(TextureCache[5]);
  assets.ball = new Sprite(TextureCache[0]);

  // Background
  app.stage.addChild(assets.background);
  // Clouds
  app.stage.addChild(assets.cloud1);
  app.stage.addChild(assets.cloud2);
  assets.cloud2.x = 300;
  // Man
  app.stage.addChild(assets.man);
  assets.man.x = 600;
  assets.man.y = 200;
  assets.man.scale.x = 0.5;
  assets.man.scale.y = 0.5;
  assets.man.y = 300;
  // Ball
  app.stage.addChild(assets.ball);
  assets.ball.x = 0;
  assets.ball.y = -50;
  // Grass
  app.stage.addChild(assets.grass);
  assets.grass.y = 460;
  app.stage.addChild(assets.grass2);
  assets.grass2.y = 460;
  assets.grass2.x = 600;

  Tweener.addTween(assets.man.scale, {
    x: 1.5,
    y: 1.5,
    time: 5,
    transition: "easeOutSine"
  });

  Tweener.addTween(assets.man.scale, {
    x: 0.5,
    y: 0.5,
    time: 5,
    delay: 5,
    transition: "easeOutSine"
  });

  Tweener.addTween(assets.man, {
    x: -300,
    time: 10,
    delay: 1,
    transition: "easeOutSine"
  });

  Tweener.addTween(assets.grass2, {
    x: -100,
    time: 105,
    delay: 1,
    transition: "easeNone"
  });

  Tweener.addTween(assets.grass, {
    x: -700,
    time: 105,
    delay: 1,
    transition: "easeNone"
  });

  Tweener.addTween(assets.cloud1, {
    x: -100,
    time: 10,
    transition: "easeOutInSine",
    onComplete: cloud
  });

  Tweener.addTween(assets.cloud2, {
    x: -100,
    time: 40,
    transition: "easeOutInSine"
  });

  dropBall();
}

function cloud() {
  assets.cloud1.x = 500;
  Tweener.addTween(assets.cloud1, {
    x: -100,
    time: 35,
    delay: 0,
    transition: "easeInCirc",
    onComplete: cloud
  });
}

function moveMan(x, y) {
  //assets.man.anchor.y = 1;
  // assets.man.scale.y = 2;
  // assets.man.scale.x = -2;
  Tweener.addTween(assets.man, {
    x: x,
    time: 2,
    delay: 0,
    transition: "easeOutCirc"
  });

  scaleNum = y / 800;
  if (x > assets.man.x) {
    assets.man.scale.x = -assets.man.scale.y;
    scaleX = -scaleNum;
  } else {
    assets.man.scale.x = assets.man.scale.y;
    scaleX = scaleNum;
  }

  Tweener.addTween(assets.man.scale, {
    x: scaleX,
    y: scaleNum,
    time: 5,
    delay: 0,
    transition: "easeOutCirc"
  });
}

function collisionDetection() {}

document.querySelector("#app").appendChild(app.view);

document.querySelector("#app").addEventListener("click", checkClickable);

function dropBall() {
  assets.ball.y = -30;
  assets.ball.x = Math.floor(Math.random() * 300) + 100;

  Tweener.addTween(assets.ball, {
    y: 600,
    x: assets.ball.x - 5,
    time: 10,
    delay: 0,
    transition: "easeOutBounce",
    onComplete: dropBall,
    onUpdate: collisionDetection
  });
}

function checkClickable(e) {
  let x = e.pageX;
  let y = e.pageY;
  moveMan(x, y);
}
