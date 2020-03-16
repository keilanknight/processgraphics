let app = new PIXI.Application({
  width: 900, // default: 800
  height: 600, // default: 600
  antialias: true, // default: false
  transparent: false, // default: false
  resolution: 1 // default: 1
});
let assets = {
  balance: 20000,
  betAmount: 200,
  bonusStage: null,
  // prettier-ignore
  betAmounts: [10,25,50,80,100,150,200,300,400,500,600,800,1000,1200,1500,2000,2500,3000],
  symbols: [],
  thisSymbols: [],
  winGraphics: [],
  graphics: { scaleOffset: 0.002 },
  winSequence: false,
  reelsSpinning: false,
  slotTextures: [],
  spinTime: 5,
  display: {},
  buttons: {},
  tweens: {
    megamanL: {
      newTween() {
        gsap.to(assets.graphics.megamanL.scale, {
          duration: 0.3,
          y: 1.05,
          x: 1.05,
          onComplete: assets.tweens.megamanL.outTween
        });
      },
      outTween() {
        gsap.to(assets.graphics.megamanL.scale, {
          duration: 0.5,
          y: 1,
          x: 1,
          onComplete: assets.tweens.megamanL.newTween
        });
      }
    },
    megamanR: {
      newTween() {
        gsap.to(assets.graphics.megamanR, {
          duration: 0.5,
          y: assets.graphics.megamanR.y - 3,
          x: assets.graphics.megamanR.x - 3,
          onComplete: assets.tweens.megamanR.outTween
        });
      },
      outTween() {
        gsap.to(assets.graphics.megamanR, {
          duration: 0.5,
          y: assets.graphics.megamanR.y + 3,
          x: assets.graphics.megamanR.x + 3,
          onComplete: assets.tweens.megamanR.newTween
        });
      }
    }
  },
  winSymbols: [
    "winsymA.png",
    "winsymB.png",
    "winsymC.png",
    "winsymD.png",
    "winsymE.png",
    "winsymF.png",
    "winsymG.png",
    "winsymH.png",
    "winsymI.png",
    "winsymJ.png"
  ],
  backgroundMusic: new Howl({
    src: ["audio/megaManBG.ogg"],
    loop: true,
    autoplay: true
  }),
  spinSound: new Howl({
    src: ["audio/megaManSpinSound.ogg"]
  }),
  winSound: new Howl({
    src: ["audio/megaManWin.ogg"],
    onend: resetWin
  })
};

app.loader.add("sprites", "mega/megaman.json").load(initializeSprites);
document.body.appendChild(app.view);

function bonusRound() {
  assets.backgroundMusic.stop();
  let r = assets.bonusStage.children[0];
  gsap.to(r, {
    duration: 0.2,
    height: 370,
    ease: "bounce.out",
    onComplete: jumpInBonusRound
  });
  assets.graphics.runningMan.stop();
}

function jumpInBonusRound() {
  // Setup the scene first

  let bg = PIXI.TilingSprite.from("bonus.png", 618, 370);
  assets.bonusStage.addChild(bg);
  bg.alpha = 0;
  gsap.to(bg, { alpha: 1, duration: 0.7 });

  let hills = PIXI.TilingSprite.from("hills.png", 618, 200);
  assets.bonusStage.addChild(hills);
  hills.y = 82;

  // Hills animation, the duration of the bonus round
  gsap.to(hills.tilePosition, {
    x: -600,
    duration: 9,
    delay: 1.2,
    ease: "none",
    onComplete: endBonus
  });
  gsap.to(bg.tilePosition, {
    x: -2000,
    duration: 9,
    delay: 1.2,
    ease: "none",
  });

  let sheet = app.loader.resources["sprites"].spritesheet;
  let s = assets.graphics.runningMan;
  s.textures = sheet.animations["jump"];
  gsap.to(s, {
    duration: 0.2,
    y: -50,
    x: 160,
    ease: "power4.out"
  });
  gsap.to(s, {
    duration: 1,
    delay: 0.2,
    y: 290,
    x: 180,
    ease: "bounce.out",
    onComplete: backToNormal
  });

  // The ladder
  let ladder = PIXI.Sprite.from("ladder.png");
  assets.bonusStage.addChild(ladder);
  ladder.x = 800;

  gsap.to(ladder, {
    x: 500,
    duration: 2,
    ease: "none",
    delay: 10
  });
  gsap.to(bg.tilePosition, {
    x: -2050,
    duration: 2,
    delay: 10,
    ease: "circ.out",
  });
}

function endBonus() {
  gsap.to(assets.graphics.runningMan, {
    x: 635,
    duration: 3,
    ease: "none"
  });
  gsap.to(assets.graphics.runningMan, {
    y: 0,
    delay: 3.2,
    duration: 1,
    ease: "none"
  });
  gsap.to(assets.graphics.runningMan.scale, {
    x: -1,
    delay: 4.2,
    duration: 0.1,
    ease: "none"
  });
  gsap.to(assets.graphics.runningMan, {
    x: 130,
    delay: 4.3,
    duration: 3,
    ease: "bounce.out"
  });
  gsap.to(assets.graphics.runningMan.scale, {
    x: 1,
    delay: 6.3,
    duration: 0.1,
    ease: "none"
  });
  gsap.to(assets.bonusStage, {
    alpha: 0,
    delay: 6.4,
    duration: 0.3,
    ease: "none"
  });
}

function backToNormal() {
  let sheet = app.loader.resources["sprites"].spritesheet;
  let s = assets.graphics.runningMan;
  s.textures = sheet.animations["megaman"];
  s.play();
}

function bonusEnd() {
  let r = assets.bonusStage.children[0];
  gsap.to(r, {
    duration: 3,
    height: 1,
    ease: "bounce.out"
  });
}

function initializeSprites() {
  // Spritesheet
  assets.animations = app.loader.resources["sprites"].spritesheet.animations;
  // Background
  let g = (assets.background = PIXI.Sprite.from("background.png"));
  app.stage.addChild(g);
  g.cacheAsBitmap = true;

  // Win Graphics
  for (let i = 0; i < 15; i++) {
    assets.winGraphics.push(PIXI.Sprite.from("spinwin.png"));
    app.stage.addChild(assets.winGraphics[i]);
    let x = 155 + Math.floor(i / 3) * 124;
    let y = 122 + (i % 3) * 124;
    assets.winGraphics[i].alpha = 0;
    assets.winGraphics[i].position.set(x, y);
  }

  // Symbol Container
  assets.symbolContainer = new PIXI.Container();
  // Symbols
  for (let i = 0; i < assets.winSymbols.length; i++) {
    assets.slotTextures.push(PIXI.Texture.from(assets.winSymbols[i]));
  }
  for (let i = 0; i < 15; i++) {
    assets.symbols.push(PIXI.Sprite.from(assets.winSymbols[getRandomInt()]));
    assets.symbolContainer.addChild(assets.symbols[i]);
    let x = 170 + Math.floor(i / 3) * 124;
    let y = 140 + (i % 3) * 124;
    assets.symbols[i].position.set(x, y);
  }
  app.stage.addChild(assets.symbolContainer);

  // Bonus round stage
  assets.bonusStage = new PIXI.Container();
  app.stage.addChild(assets.bonusStage);
  assets.bonusStage.position.set(156, 122);
  let r = new PIXI.Graphics();
  r.beginFill(0x000000);
  // Height should be 370
  r.drawRect(-309, -185, 618, 1);
  r.pivot.y = -185;
  r.pivot.x = -309;
  r.endFill();
  assets.bonusStage.addChild(r);
  assets.bonusStage.mask = r;

  // Megaman left
  g = assets.graphics.megamanL = PIXI.Sprite.from("megaman_left.png");
  g.y = 120;
  app.stage.addChild(g);
  assets.tweens.megamanL.newTween();

  // Megaman Right
  g = assets.graphics.megamanR = PIXI.Sprite.from("megaman_right.png");
  g.position.set(740, 120);
  app.stage.addChild(g);
  assets.tweens.megamanR.newTween();

  // Running Megaman
  let sheet = app.loader.resources["sprites"].spritesheet;
  g = assets.graphics.runningMan = new PIXI.AnimatedSprite(
    sheet.animations["megaman"]
  );
  g.x = 125;
  g.y = 2;
  g.loop = true;
  g.animationSpeed = 0.1;
  g.play();
  app.stage.addChild(g);

  // Start Button
  g = assets.graphics.startButton = PIXI.Sprite.from("spin.png");
  g.position.set(785, 280);
  g.interactive = true;
  g.buttonMode = true;
  g.on("pointerdown", spinReels);
  app.stage.addChild(g);

  // Balance
  let balance = (assets.balance / 100).toFixed(2);
  let t = (assets.display.balance = new PIXI.Text("£" + balance));
  t.y = 550;
  t.x = 170;
  t.style.fontSize = 18;
  t.style.fill = "white";
  t.style.fontFamily = "Arial Black";
  app.stage.addChild(t);

  // Bet
  let bet = (assets.betAmount / 100).toFixed(2);
  t = assets.display.betAmount = new PIXI.Text("£" + bet);
  t.y = 550;
  t.x = 545;
  t.style.fontSize = 18;
  t.style.fill = "white";
  t.style.fontFamily = "Arial Black";
  app.stage.addChild(t);

  // Bet Buttons
  g = assets.buttons.up = PIXI.Sprite.from("arrow.png");
  g.position.set(635, 548);
  g.interactive = true;
  g.buttonMode = true;
  g.on("pointerdown", betUp);
  app.stage.addChild(g);
  g = assets.buttons.down = PIXI.Sprite.from("arrow.png");
  g.position.set(658, 573);
  g.scale.y = -1;
  g.interactive = true;
  g.buttonMode = true;
  g.on("pointerdown", betDown);
  app.stage.addChild(g);
}

function betUp() {
  currKey = assets.betAmounts.indexOf(assets.betAmount);
  if (currKey < assets.betAmounts.length - 1)
    currKey++, (assets.betAmount = assets.betAmounts[currKey]);
  updateBalance();
}

function betDown() {
  currKey = assets.betAmounts.indexOf(assets.betAmount);
  if (currKey > 0) currKey--, (assets.betAmount = assets.betAmounts[currKey]);
  updateBalance();
}

function getRandomInt() {
  return Math.floor(Math.random() * assets.winSymbols.length);
}

function spinReels() {
  if (!assets.reelsSpinning) {
    assets.spinSound.play();
    assets.balance -= assets.betAmount;
    updateBalance();
    assets.reelsSpinning = true;
    spin();
  }
}

function updateBalance() {
  let balance = (assets.balance / 100).toFixed(2);
  let betAmount = (assets.betAmount / 100).toFixed(2);
  assets.display.balance.text = "£" + balance;
  assets.display.betAmount.text = "£" + betAmount;
}

function spin() {
  assets.thisSymbols = [];
  for (let i = 0; i < assets.symbols.length; i++) {
    let sym = assets.symbols[i];
    sym.tint = Math.random() * 0xffffff;
    sym.alpha = 0.5;
    let r = getRandomInt();
    assets.thisSymbols.push({ i: i, s: r });
    sym.texture = assets.slotTextures[r];
  }
  assets.spinTime += 10;

  if (assets.spinTime < 300) {
    setTimeout(() => spin(), assets.spinTime);
  } else {
    for (let i = 0; i < assets.symbols.length; i++) {
      let sym = assets.symbols[i];
      sym.tint = 0xffffff;
      sym.alpha = 1;
    }
    assets.reelsSpinning = false;
    assets.spinTime = 5;
    checkWin();
  }
}

function checkWin() {
  let s = assets.thisSymbols;
  let r1 = [s[0], s[1], s[2]];
  let r2 = [s[3], s[4], s[5]];
  let r3 = [s[6], s[7], s[8]];
  let r4 = [s[9], s[10], s[11]];
  let r5 = [s[12], s[13], s[14]];

  let wins = [];
  for (i = 0; i < 3; i++) {
    let sym = s[i];
    r1Count = reelCount(sym, r1);
    r2Count = reelCount(sym, r2);
    r3Count = reelCount(sym, r3);
    r4Count = reelCount(sym, r4);
    r5Count = reelCount(sym, r5);

    let win = {};
    if (r1Count > 0 && r2Count > 0 && r3Count > 0)
      win = {
        winAmount: r1Count * r2Count * r3Count * assets.betAmount * 0.5
      };
    if (r1Count > 0 && r2Count > 0 && r3Count > 0 && r4Count > 0)
      win = {
        winAmount: r1Count * r2Count * r3Count * r4Count * assets.betAmount * 1
      };
    if (r1Count > 0 && r2Count > 0 && r3Count > 0 && r4Count > 0 && r5Count > 0)
      win = {
        winAmount:
          r1Count * r2Count * r3Count * r4Count * r5Count * assets.betAmount * 3
      };
  }
}

function reelCount(s, arr) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == s) count++;
  }
  return count;
}

function simWin() {
  assets.backgroundMusic.stop();
  assets.winSound.play();
  assets.winSequence = true;
  fakeWin();
}

function fakeWin() {
  assets.winGraphics[0].alpha = 1;
  assets.winGraphics[4].alpha = 1;
  assets.winGraphics[6].alpha = 1;
  assets.winGraphics[10].alpha = 1;
  assets.winGraphics[12].alpha = 1;

  let t = Math.random() * 0xffffff;

  assets.winGraphics[0].tint = t;
  assets.winGraphics[4].tint = t;
  assets.winGraphics[6].tint = t;
  assets.winGraphics[10].tint = t;
  assets.winGraphics[12].tint = t;

  if (assets.winSequence) {
    setTimeout(() => fakeWin(), 100);
  } else {
    assets.winGraphics[0].alpha = 0;
    assets.winGraphics[4].alpha = 0;
    assets.winGraphics[6].alpha = 0;
    assets.winGraphics[10].alpha = 0;
    assets.winGraphics[12].alpha = 0;
  }
}

function resetWin() {
  app.stop();
  assets.backgroundMusic.stop();
  assets.balance += 2000;
  assets.winGraphics[0].alpha = 0;
  assets.winGraphics[4].alpha = 0;
  assets.winGraphics[6].alpha = 0;
  assets.winGraphics[10].alpha = 0;
  assets.winGraphics[12].alpha = 0;
  assets.winSequence = false;
  assets.backgroundMusic.play();
  assets.backgroundMusic.fade(0, 1, 1000);
  updateBalance();
  app.start();
}
