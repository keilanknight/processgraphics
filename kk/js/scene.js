let app = new PIXI.Application({
  width: 680, // default: 800
  height: 560, // default: 600
  antialias: true, // default: false
  transparent: false, // default: false
  resolution: 1.2 // default: 1
});
document.querySelector("#app").appendChild(app.view);
let assets = {
  farSpeed: 0.6,
  midSpeed: 2,
  nearSpeed: 10,
  audioRate: 1,
  manSpeed: 0.2,
  scrollLeft: false,
  scrollRight: false,
  canPressKey: true,
  manIsRunning: false,
  lastKeyPressed: null,
  sound: new Howl({
    src: ["audio/runningSound.ogg"],
    loop: true
  })
};
app.loader
  .add("running", "scenes/running.json")
  .add("logan", "scenes/logan.json")
  .add("monster", "scenes/monster.png")
  .add("spritesheet", "scenes/images.json")
  .load(setup);

function setup() {
  // Setup key listeners
  window.addEventListener("keyup", keyUp);
  window.addEventListener("keydown", keyDown);

  // Background sky
  app.renderer.backgroundColor = 0x649bb4;

  // Grass
  let rectangle = new PIXI.Graphics();
  rectangle.beginFill(0x3b5e33);
  rectangle.drawRect(0, 560 - 105, 680, 105);
  rectangle.endFill();
  app.stage.addChild(rectangle);

  // Clouds
  assets.cloud = [];
  for (let i = 0; i < 3; i++) {
    assets.cloud[i] = PIXI.Sprite.from("cloud.png");
    app.stage.addChild(assets.cloud[i]);
    assets.cloud[i].x = i * 300 - 100;
    assets.cloud[i].y = i * 5;
  }

  // Back hill
  //assets.backHill = PIXI.Sprite.from("backHill.png");
  assets.backHill = PIXI.TilingSprite.from("backHill.png", 800, 374);
  app.stage.addChild(assets.backHill);

  // Front hill
  assets.frontHill = PIXI.TilingSprite.from("frontHill.png", 800, 341);
  app.stage.addChild(assets.frontHill);
  assets.frontHill.y = 115;

  // Back trees
  assets.backTree = [];
  assets.backTree[0] = PIXI.Sprite.from("backTree.png");
  assets.backTree[1] = PIXI.Sprite.from("backTree.png");
  app.stage.addChild(assets.backTree[0]);
  app.stage.addChild(assets.backTree[1]);
  assets.backTree[0].y = 240;
  assets.backTree[1].y = 240;
  assets.backTree[1].x = 300;

  // Running Man
  let sheet = app.loader.resources["logan"].spritesheet;
  assets.runningMan = new PIXI.AnimatedSprite(sheet.animations["logan"]);
  app.stage.addChild(assets.runningMan);
  assets.runningMan.anchor.set(0.5);
  assets.runningMan.animationSpeed = 0;
  assets.runningMan.x = 320;
  assets.runningMan.y = 380;

  // Monster
  assets.monster = PIXI.Sprite.from("monster");
  app.stage.addChild(assets.monster);
  assets.monster.x = -100;
  assets.monster.y = 320;
  assets.monster.anchor.set(0.5);
  Tweener.addTween(assets.monster, {
    x: -600,
    time: 5,
    delay: 10,
    transition: "easeOutExpo",
    onComplete: function() {
      setTimeout(monster, 5000);
    }
  });

  // Front trees
  assets.frontTree = [];
  assets.frontTree[0] = PIXI.Sprite.from("frontTree.png");
  assets.frontTree[1] = PIXI.Sprite.from("frontTree.png");
  app.stage.addChild(assets.frontTree[0]);
  app.stage.addChild(assets.frontTree[1]);
  assets.frontTree[0].x = -200;
  assets.frontTree[0].y = 80;
  assets.frontTree[1].x = 320;
  assets.frontTree[1].y = 100;

  // animate();
}
function monster() {
 
  let newX = null;

  if (assets.monster.x < 0) {
    assets.monster.scale.x = -1;
    assets.monster.x = 1000;
    newX = 400;
  } else {
    assets.monster.scale.x = 1;
    assets.monster.x = -500;
    newX = -50;
  }

  Tweener.addTween(assets.monster, {
    x: newX,
    time: 3,
    delay: 0,
    transition: "easeInSine",
    onComplete: function() {
      assets.monster.y = 340;
      setTimeout(monster, 5000);
    }
  });
  // setTimeout(monster, 10000);
}
function animate() {

  if (Math.random() < 0.5) {
    assets.monster.y += 2;
  } else {
    assets.monster.y -= 2.5;
  }

  // Crude way of flipping these about...
  if (assets.scrollRight && assets.farSpeed > 0) {
    assets.farSpeed = -assets.farSpeed;
    assets.midSpeed = -assets.midSpeed;
    assets.nearSpeed = -assets.nearSpeed;
  } else if (assets.scrollLeft && assets.farSpeed < 0) {
    assets.farSpeed = -assets.farSpeed;
    assets.midSpeed = -assets.midSpeed;
    assets.nearSpeed = -assets.nearSpeed;
  }

  assets.backHill.tilePosition.x -= assets.farSpeed;
  assets.frontHill.tilePosition.x -= assets.midSpeed;

  for (let i = 0; i < assets.cloud.length; i++) {
    assets.cloud[i].x -= assets.farSpeed;
    if (assets.cloud[i].x < -200) assets.cloud[i].x = 620;
    if (assets.cloud[i].x > 650) assets.cloud[i].x = -199;

    if (i < assets.frontTree.length) {
      assets.backTree[i].x -= assets.midSpeed;
      assets.frontTree[i].x -= assets.nearSpeed;
      if (assets.backTree[i].x < -300)
        assets.backTree[i].x = Math.floor(Math.random() * 30) + 690;
      if (assets.frontTree[i].x < -400)
        assets.frontTree[i].x = Math.floor(Math.random() * 30) + 690;
      if (assets.backTree[i].x > 690)
        assets.backTree[i].x = Math.floor(Math.random() * 30) + -299;
      if (assets.frontTree[i].x > 690)
        assets.frontTree[i].x = Math.floor(Math.random() * 30) + -399;
    }
  }

  if (assets.manIsRunning) requestAnimationFrame(animate);
}
const keyDown = debounce(function(e) {
  if (!assets.manIsRunning) {
    assets.runningMan.animationSpeed = 0;
    if (e.key == "ArrowRight") {
      run.right();
    } else if (e.key == "ArrowLeft") {
      run.left();
    }
  }
}, 200);
const keyUp = debounce(function(e) {
  if (assets.manIsRunning) {
    // Need to tween out the scenery
    let farSpeed = assets.farSpeed;
    let nearSpeed = assets.nearSpeed;
    let midSpeed = assets.midSpeed;
    Tweener.addTween(assets, {
      farSpeed: 0,
      nearSpeed: 0,
      midSpeed: 0,
      time: Math.abs(farSpeed),
      delay: 0.2,
      transition: "easeOutExpo",
      onComplete: function() {
        assets.farSpeed = farSpeed * 1.1;
        assets.midSpeed = midSpeed * 1.1;
        assets.nearSpeed = nearSpeed * 1.1;
        assets.scrollRight = false;
        assets.scrollLeft = false;
        assets.canPressKey = true;
        assets.manIsRunning = false;
      }
    });

    if (assets.runningMan) {
      Tweener.addTween(assets.runningMan, {
        animationSpeed: 0,
        time: Math.abs(farSpeed),
        delay: 0,
        transition: "easeOutSine"
      });
    }

    assets.manSpeed += 0.01;
    assets.sound.stop();
    assets.audioRate += 0.1;
    assets.sound.rate(assets.audioRate);
  }
}, 200);
const run = {
  left() {
    assets.runningMan.scale.x = -1;
    assets.scrollLeft = false;
    assets.scrollRight = true;
    this.run();
  },
  right() {
    assets.runningMan.scale.x = 1;
    assets.scrollRight = false;
    assets.scrollLeft = true;
    this.run();
  },
  run() {
    let farSpeed = assets.farSpeed;
    let midSpeed = assets.midSpeed;
    let nearSpeed = assets.nearSpeed;

    // animate man starting to run
    Tweener.addTween(assets.runningMan, {
      animationSpeed: assets.manSpeed,
      time: Math.abs(farSpeed),
      delay: 0,
      transition: "easeNone"
    });

    //animate surroundings moving in proportion
    assets.farSpeed = 0;
    assets.midSpeed = 0;
    assets.nearSpeed = 0;

    Tweener.addTween(assets, {
      farSpeed: farSpeed,
      midSpeed: midSpeed,
      nearSpeed: nearSpeed,
      time: Math.abs(farSpeed),
      delay: 0,
      transition: "easeNone"
    });

    assets.sound.play();
    assets.runningMan.play();
    assets.manIsRunning = true;

    requestAnimationFrame(animate);
  }
};

/*
function keyDown(e) {
  if (assets.canPressKey) {
    assets.lastKeyPressed = e.key;
    assets.canPressKey = false;
    if (!assets.manIsRunning) {
      assets.runningMan.animationSpeed = 0;
      if (e.key == "ArrowRight") {
        run.right();
      } else if (e.key == "ArrowLeft") {
        run.left();
      }
    }
  }
}
function keyUp(e) {
  if (assets.manIsRunning) {
    // Need to tween out the scenery
    let farSpeed = assets.farSpeed;
    let nearSpeed = assets.nearSpeed;
    let midSpeed = assets.midSpeed;
    Tweener.addTween(assets, {
      farSpeed: 0,
      nearSpeed: 0,
      midSpeed: 0,
      time: Math.abs(farSpeed),
      delay: 0.2,
      transition: "easeOutExpo",
      onComplete: function() {
        assets.farSpeed = farSpeed * 1.1;
        assets.midSpeed = midSpeed * 1.1;
        assets.nearSpeed = nearSpeed * 1.1;
        assets.scrollRight = false;
        assets.scrollLeft = false;
        assets.canPressKey = true;
        assets.manIsRunning = false;
      }
    });

    if (assets.runningMan) {
      Tweener.addTween(assets.runningMan, {
        animationSpeed: 0,
        time: Math.abs(farSpeed),
        delay: 0,
        transition: "easeOutSine"
      });
    }

    assets.manSpeed += 0.01;
    assets.sound.stop();
    assets.audioRate += 0.1;
    assets.sound.rate(assets.audioRate);
  }
} */
