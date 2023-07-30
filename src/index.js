
let game;
let scoreboard = []; 

const gameOptions = {
  playerGravity: 1100,
  playerSpeed: 300,
  attackRange: 100
};

window.onload = function () {
  let gameConfig = {
    type: Phaser.AUTO,
    backgroundColor: "#737373",
    parent: "game",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER,
      width: 640
    },
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: {
          y: 300,
        },
      },
    },
    
    scene: PlayGame
  }

  game = new Phaser.Game(gameConfig);
  window.focus();
};


//scoreboard to keep track, taking user input for name after winning game

function addToScoreboard(attemptNumber, time) {
const username = window.prompt('Enter your username:');
  if (username) {
    scoreboard.push({ username, attemptNumber, time });
  }
  scoreboard.sort((entryA, entryB) => entryA.time - entryB.time);
  if(scoreboard.length > 5) {
    scoreboard.pop(5); //Keep only top 5 times
  }
}


function updateScoreboard(scene) {
  const boardText = scene.add.text(8, 50, '', { font: '16px Times New Roman, serif', fill: '#000000' });
  let scoreText = '';
  scoreboard.forEach(entry => {
    scoreText += entry.username + ": " + entry.time + "s\n";
  });
  boardText.setText(scoreText);
  scene.scoreboardText = boardText;
}

class PlayGame extends Phaser.Scene {

    //Most variables just to make sure animations work correctly
    constructor() {
        super("PlayGame")
        this.hp = 6;
        this.stars = 0;
        this.isPlayerDead = false;
        this.isPlayerDying = false;
        this.playerAttacking = false;
        this.startTime = 0;
        this.gameTimer = null;
        this.isGameEnding = false;
    }

    restartGame() {
        this.isPlayerDead = false;
        this.isPlayerDying = false;
        this.playerAttacking = false;
        this.startTime = 0;
        this.gameTimer = null;
        this.isGameEnding = false;
        this.sound.stopAll();
        this.scene.restart();
    }


  preload() {
    
    this.load.image("background", "./src/assets/Legacy-Fantasy - High Forest 2.3/Background/Background.png")
    this.load.image("tile2", "./src/assets/Ground/pngs/2wide.png")
    this.load.image("heart", "./src/assets/heart pixel art/heart pixel art 16x16.png")  
    this.load.image("star", "./src/assets/stars/StarImage/Star.png")
    this.load.image("star0", "./src/assets/stars/StarImage/0Stars.png")
    this.load.image("star1", "./src/assets/stars/StarImage/1Star.png")
    this.load.image("star2", "./src/assets/stars/StarImage/2Stars.png")
    this.load.image("star3", "./src/assets/stars/StarImage/3Stars.png")
    this.load.image("star4", "./src/assets/stars/StarImage/4Stars.png")
    this.load.image("star5", "./src/assets/stars/StarImage/5Stars.png")

    this.load.spritesheet("player", 
        "./src/assets/Legacy-Fantasy - High Forest 2.3/Character/Idle/Idle-Sheet.png",
        {frameWidth: 64, frameHeight: 64}) 
    this.load.spritesheet("player-idle", 
        "./src/assets/Legacy-Fantasy - High Forest 2.3/Character/Idle/Idle-Sheet.png", 
        {frameWidth: 64, frameHeight: 64})
    this.load.spritesheet("player-run", 
        "./src/assets/Legacy-Fantasy - High Forest 2.3/Character/Run/Run-Sheet.png", 
        {frameWidth: 80, frameHeight: 64})
    this.load.spritesheet("player-run-mirror", 
        "./src/assets/Legacy-Fantasy - High Forest 2.3/Character/Run/Run-Sheet-mirror.png", 
        {frameWidth: 80, frameHeight: 64})
    this.load.spritesheet("player-jump", 
        "./src/assets/Legacy-Fantasy - High Forest 2.3/Character/Jumlp-All/Jump-All-Sheet.png", 
        {frameWidth: 64, frameHeight: 64})
    this.load.spritesheet("player-attack", 
        "./src/assets/Legacy-Fantasy - High Forest 2.3/Character/Attack-01/Attack-01-Sheet.png", 
        {frameWidth: 96, frameHeight: 64})
    this.load.spritesheet("player-die", 
        "./src/assets/Legacy-Fantasy - High Forest 2.3/Character/Dead/Dead-Sheet.png", 
        {frameWidth: 80, frameHeight: 64})
    this.load.spritesheet("bee-fly", 
        "./src/assets/Legacy-Fantasy - High Forest 2.3/Mob/Small bee/Fly/Fly-Sheet.png",
        {frameWidth: 64, frameHeight: 64}) 
    this.load.spritesheet("bee-attack", 
        "./src/assets/Legacy-Fantasy - High Forest 2.3/Mob/Small bee/Attack/Attack-Sheet.png",
        {frameWidth: 64, frameHeight: 64})        
    this.load.spritesheet("health", 
        "./src/assets/HealthPickup.png", 
        {frameWidth: 32, frameHeight: 32})

    this.load.audio("boing", "./src/assets/sounds/Record 2023-07-29 at 21h20m21s.wav")
    this.load.audio("aiai", "./src/assets/sounds/Record 2023-07-29 at 21h21m02s.wav")
    this.load.audio("swing", "./src/assets/sounds/swing-6045.mp3")
    this.load.audio("theme", "./src/assets/sounds/We-Shop-Song-PM-Music.mp3")
    this.load.audio("victory", "./src/assets/sounds/success-fanfare-trumpets-6185.mp3")
}

  create() {

   
    

//    this.physics.world.checkCollision.up = false;
//   this.physics.world.checkCollision.down = false;

    //Clear the existing animations when reloading after win/death
    this.anims.remove("health");
    this.anims.remove("fly");
    this.anims.remove("left")
    this.anims.remove("right")
    this.anims.remove("jump")
    this.anims.remove("idle")
    this.anims.remove("player-attack")
    this.anims.remove("die")
    this.anims.remove("bee-attack")
    
    //Background music
    this.load.audio("theme", "./src/assets/sounds/We-Shop-Song-PM-Music.mp3")
    this.sound.play("theme", {loop: true, volume: 0.1})

    this.groundGroup = this.physics.add.group({
      immovable:true,
      allowGravity: false,
      defaultKey: 'tile2'
    })

    this.beeGroup = this.physics.add.group({
        immovable: false,
        allowGravity: false,
    })

    this.healthGroup = this.physics.add.group({
        immovable: true,
        allowGravity: false
    })

    this.starGroup = this.physics.add.group({
        immovable: true,
        allowGravity: false
    })

    this.fakePlatforms = this.physics.add.group({
        defaultKey: 'tile2',
        immovable: true,
        allowGravity: true
    });
    
    // Adding all the static hud elements
    this.add.image(game.config.width / 2, game.config.height / 2, "background").setScale(3)
    this.add.image(16, 16, "heart")
    this.hpText = this.add.text(32, 3, this.hp, {font: "24px Times New Roman", fill: "#000000"})
    this.add.image(game.config.width / 2, 16, "star0").setScale(0.1)
    
    var title = this.add.text(8, 32, '', { font: '16px Times New Roman', fill: '#000000' });
    title.setText("SCOREBOARD")

    var guide = this.add.text(game.config.width - 180, 8, '', { font: '16px Times New Roman', fill: '#000000' });
    guide.setText("Left/right arrow move\nUp arrow jump\nClick on bees to attack\nCollect 5 stars to win\nKeep hp above 0")
    
    // Creating the platforms
    for(let i = 0; i < (game.config.width / 64); i++) {
        if(i != 5 && i != 6 && i != 7) {
            this.groundGroup.create(32 + i*64, game.config.height, "tile2");
        }
    }

    for(let i = 0; i < 3; i++) {
        this.groundGroup.create(32 + i*64, game.config.height - 128, "tile2");
    }

    this.groundGroup.create(128, game.config.height - 256);
    this.groundGroup.create(400, game.config.height - 300);
    this.groundGroup.create(640, game.config.height - 400);
    this.groundGroup.create(400, game.config.height - 500);

    for(let i = 0; i < 3; i++) {
        this.groundGroup.create(128 + i*64, game.config.height - 540, "tile2");
    }
    for(let i = 0; i < 5; i++) {
        this.groundGroup.create(400, game.config.height - 300, "tile2");
    }
    for(let i = 0; i < 4; i++) {
        this.fakePlatforms.create(464 + i * 64, game.config.height - 300);
    }
    
    for (const fakePlatform of this.fakePlatforms.getChildren())
        {
            fakePlatform.body.moves = false;
        }

    //Making stars
    this.starGroup.create(32, game.config.height - 158, "star").setScale(0.1);
    this.starGroup.create(128, game.config.height - 286, "star").setScale(0.1);
    this.starGroup.create(400, game.config.height - 330, "star").setScale(0.1);
    this.starGroup.create(620, game.config.height - 430, "star").setScale(0.1);
    this.starGroup.create(128, game.config.height - 570, "star").setScale(0.1);

    // Creating the enemies and health packs
    this.bee1 = this.beeGroup.create(game.config.width - 64, game.config.height - 32, "bee")
    this.bee2 = this.beeGroup.create(32, game.config.height - 256, "bee")
    this.bee3 = this.beeGroup.create(320, game.config.height - 520, "bee")
    this.bee4 = this.beeGroup.create(400, game.config.height - 600, "bee")
    
    this.health1 = this.healthGroup.create(200, game.config.height - 512, "health");
    this.health2 = this.healthGroup.create(game.config.width - 64, game.config.height - 24, "health");
    

    //Creating player and adding physics
    this.player = this.physics.add.sprite(32, game.config.height - 64, "player")
    this.player.body.gravity.y = gameOptions.playerGravity
    this.player.attackRange = gameOptions.attackRange
    this.physics.add.collider(this.player, this.groundGroup)
    this.physics.add.collider(this.healthGroup, this.groundGroup)
    this.physics.add.overlap(this.player, this.beeGroup, this.takeDmg, null, this)
    this.physics.add.overlap(this.player, this.healthGroup, this.heal, null, this)
    this.physics.add.overlap(this.player, this.starGroup, this.getStar, null, this) 
    //make fake platforms fall when player touches
    this.physics.add.collider(this.player, this.fakePlatforms, (player, fakePlatform) =>
        {
            fakePlatform.body.moves = true;
            fakePlatform.body.checkCollision.none = true;
        });
  
    this.cursors = this.input.keyboard.createCursorKeys()
    this.input.on("pointerdown", this.onPointerDown, this);
    
    //All animations for player, bees and health
    this.anims.create({
        key: "left",
        frames: this.anims.generateFrameNumbers("player-run-mirror", {start: 7, end: 0}),
        frameRate: 8,
        repeat: -1
    })
    this.anims.create({
        key: "idle",
        frames: this.anims.generateFrameNumbers("player-idle", {start: 0, end: 3}),
        frameRate: 4,
    })

    this.anims.create({
        key: "right",
        frames: this.anims.generateFrameNumbers("player-run", {start: 0, end: 7}),
        frameRate: 8,
        repeat: -1
    })

    this.anims.create({
        key: "jump",
        frames: this.anims.generateFrameNumbers("player-jump", {start: 0, end: 14}),
        frameRate: 8
    })

    this.anims.create({
        key: "player-attack",
        frames: this.anims.generateFrameNumbers("player-attack", {start: 0, end: 5, zeroPad: 4}),
        frameRate: 8,
        repeat: 2
    })

    this.anims.create({
        key: "die",
        frames: this.anims.generateFrameNumbers("player-die", {start: 0, end: 7}),
        frameRate: 8
    })

    this.anims.create({
        key: "fly",
        frames: this.anims.generateFrameNumbers("bee-fly", {start: 0, end: 3}),
        frameRate: 8,
        loop: true
    })

    this.anims.create({
        key: "bee-attack",
        frames: this.anims.generateFrameNumbers("bee-attack", {start: 0, end: 3}),
        frameRate: 8
    })

    this.anims.create({
        key: "health",
        frames: this.anims.generateFrameNumbers("health", {frames: [0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3]}),
        framerate: 16,  
    })

    updateScoreboard(this);
    this.startTime = this.time.now;
  }
    //Mouse attack
  onPointerDown(pointer) {
    if (this.hp > 0) {
        const clickedBees = this.beeGroup.getChildren().filter(bee => bee.getBounds().contains(pointer.x, pointer.y));
        clickedBees.forEach(bee => {
            //check if bee is in attack range
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, bee.x, bee.y);
            if (distance < this.player.attackRange) {
                bee.disableBody(true, true);
                this.playerAttacking = true;
                this.sound.add("swing").play()
                this.player.anims.stop();
                this.player.anims.play("player-attack", true)
                this.time.delayedCall(1000, () => { 
                    this.playerAttacking = false;
            })

            }
        });
    }
}

    //Overlap events
  takeDmg(player,bee) {
    if (!this.isBeeDying) {
        this.isBeeDying = true
        this.sound.add("aiai").play()
        bee.anims.stop();
        bee.anims.play("bee-attack", true)
        this.time.delayedCall(500, () => {
            this.isBeeDying = false;
            bee.disableBody(true, true)
            this.hp += -5
            this.hpText.setText(this.hp)
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, bee.x, bee.y);
        })
    } else { return}
  }

  heal(player, health) {
    health.disableBody(true, true)
    this.hp += 3
    this.hpText.setText(this.hp)
  }

  getStar(player, star) {
    star.disableBody(true,true)
    this.stars += 1
    this.add.image(game.config.width / 2, 16, "star" + this.stars).setScale(0.1)
  }

  update() {


    const isPlayerInAir = !this.player.body.touching.down;

    //left and right movement + idle animation
    if (this.cursors.left.isDown && this.hp > 0) {
        this.player.body.velocity.x = -gameOptions.playerSpeed;
        if (!isPlayerInAir) this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown && this.hp > 0) {
        this.player.body.velocity.x = gameOptions.playerSpeed;
        if (!isPlayerInAir) this.player.anims.play("right", true);
    } else {
        this.player.body.velocity.x = 0;
        if (!isPlayerInAir && this.hp > 0 && !this.playerAttacking) {
            this.player.anims.play("idle", true);
        }
    }
    //jump
    if(this.cursors.up.isDown && this.player.body.touching.down && this.hp > 0) {
        this.sound.add("boing").play()
        this.player.anims.play("jump", true)
        this.player.body.velocity.y = -gameOptions.playerGravity / 1.6
    }  
    //Moving bees
    if (this.bee1.x >= 500) {
        this.bee1.setVelocityX(-50);
    } else if (this.bee1.x <= 300) {
        this.bee1.setVelocityX(50);
    }
    if (this.bee4.x >= 600){
        this.bee4.setVelocityX(-50);
    } else if (this.bee4.x <= 400) {
        this.bee4.setVelocityX(50);
    }
    //play flying animation unless dying
    if(!this.isBeeDying) {this.bee1.anims.play("fly", true)}
    if(!this.isBeeDying) {this.bee2.anims.play("fly", true)}
    if(!this.isBeeDying) {this.bee3.anims.play("fly", true)}
    if(!this.isBeeDying) {this.bee4.anims.play("fly", true)}
    //health animations
    this.health1.anims.play("health", true)
    this.health2.anims.play("health", true)
    
    //Player death, falling off the sides or 
    if (this.player.y > game.config.height || (this.hp <= 0 && !this.isPlayerDead)) {
        if (!this.isPlayerDying) { 
            this.isPlayerDying = true;
            this.add.text(game.config.width / 2  - 128, 
                game.config.height / 2 - 64, "You died !", 
                {font: "48px Times New Roman", fill: "#000000"})
            this.player.anims.play("die", true).once("animationcomplete", () => {
                this.sound.stopAll();  
                    this.time.delayedCall(1500, () => {
                        this.attemptNumber += 1
                        this.isPlayerDying = false; 
                        this.hp = 6;
                        this.stars = 0;
                        this.hpText.setText(this.hp);
                        this.restartGame();
                });
            });
        }
    }
    //Player victory, tracks time and adds to scoreboard
    if(this.stars == 5 && !this.isGameEnding) {
        this.isGameEnding = true;
        const elapsedTime = Math.floor((this.time.now - this.startTime) / 1000);
        this.sound.add("victory").play();
        this.add.text(game.config.width / 2  - 128, 
                game.config.height / 2 - 64, "YOU WON !!!\nTime: " + elapsedTime + "s", 
                {font: "48px Times New Roman", fill: "#000000"})
        this.time.delayedCall(3000, () => {
            addToScoreboard(this.attemptNumber, elapsedTime);
            this.attemptNumber += 1
            this.hp = 6;
            this.stars = 0;
            this.sound.stopAll()
            this.restartGame();
        });
    }
  }

}

