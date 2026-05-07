class GameScene extends Phaser.Scene{
    constructor(){
        super("GameScene");
    }


    preload(){
        this.load.image("clouds", "assets/different_background.png");
        this.load.image("player", "assets/ship_0000.png");
        this.load.image("bullet", "assets/laserRed05.png");
        this.load.image("enemyBullet", "assets/laserGreen09.png");
        this.load.image("scout", "assets/ship_0007.png");
        this.load.image("bomber", "assets/ship_0001.png");
        this.load.audio("bgMusic", "assets/backgroundmusic.mp3");
        this.load.audio("shootSound", "assets/shootingsound.mp3");
        this.load.audio("deathSound", "assets/bombexplosion.mp3");
        document.getElementById('description').innerHTML = '<h2>GameScene.js</h2>'


    }


    create(){
        

        //pass restart data into initGame
        this.initGame(this.scene.settings.data);

        //background music
        this.bgMusic = this.sound.add("bgMusic", {
            loop: true,
            volume: 0.4
        });

        this.bgMusic.play();

        //background
        this.clouds = this.add.tileSprite(400, 300, 800, 600, "clouds");

        //shooting sound
        this.shootSFX = this.sound.add("shootSound", {
            volume: 0.5
        });

        //player
        this.player = this.physics.add.sprite(400, 550, "player");
        this.player.setCollideWorldBounds(true);

        //Groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        

        //UI
        this.scoreText = this.add.text(10, 10, "Score: 0", {
            fontSize: "20px",
            fill: "#ffffff"
        });

        this.livesText = this.add.text(10, 35, "Lives: 3", {
            fontSize: "20px",
            fill: "#ffffff"

        });

        this.highScoreText = this.add.text(10, 60, "High Score: "+ this.highScore, {
            fontSize: "20px",
            fill: "#ffff00"
        });

        //input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        //collisions
        this.physics.add.overlap(
            this.playerBullets,
            this.enemies,
            this.playerHitEnemy,
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.enemyBullets,
            this.enemyHitPlayer,
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.playerCrashEnemy,
            null,
            this
        );

        //spawn first wave
        this.enemySpawner = this.time.addEvent({
            delay: 1000,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });

    }

    initGame(data = {}){
        this.gameOver = false;
        this.lives = 3;
    
        if (data.mode === "soft"){
            //play again
            this.score = data.score;
            this.wave = data.wave;
            const savedHighScore = localStorage.getItem("skystrike_highscore");
            this.highScore = savedHighScore ? parseInt(savedHighScore) : 0;
        } else{
            //full restart
            this.score = 0;
            this.wave = 0;
            this.highScore = 0;

            localStorage.setItem("skystrike_highscore", 0);
        }
        
        
        
        
    }


    update(){

    //background scroll
    this.clouds.tilePositionY -= 0.5;

    if (this.gameOver) return;

    //player movement
    this.player.setVelocityX(0);

    if (this.cursors.left.isDown){
        this.player.setVelocityX(-300);
    }

    if (this.cursors.right.isDown){
        this.player.setVelocityX(300);
    }

    //shooting
    if(Phaser.Input.Keyboard.JustDown(this.fireKey)){
        this.shootBullet();
    }

    //enemy movement & firing
    this.enemies.children.iterate(enemy => {
        if (!enemy) return;
        if(enemy.type === "scout") {
            enemy.y += 2;
            enemy.x += Math.sin(enemy.y * 0.05) * 3;
        } else{
            enemy.y += 1;
        }

        

        //enemy fires randomly
        const currentTime = this.time.now;

        if (currentTime > enemy.nextFireTime){
            //smaller number = more likely to fire
            if(Phaser.Math.Between(0, 1000) < 4) {
                this.enemyShoot(enemy);
                enemy.nextFireTime = currentTime + enemy.fireRate;
            }
        }

        if(enemy.y > 650){
            enemy.destroy();
        }

    });

    

}

    shootBullet() {
        const bullet = this.playerBullets.create(
            this.player.x,
            this.player.y - 20,
            "bullet"
        );
        bullet.setVelocityY(-400);

        //shooting sound
        this.shootSFX.play();
    }

    enemyShoot (enemy){
        const bullet = this.enemyBullets.create(
            enemy.x,
            enemy.y + 20,
            "enemyBullet"
        );
        bullet.setVelocityY(250);
    }

    spawnWave(){
        if (this.gameOver) return;

        this.wave++;

        //scouts
        const maxScouts = 6;
        const scoutCount = Math.min(3 + Math.floor(this.wave / 2), maxScouts);
        for (let i = 0; i < scoutCount; i++){
            const scout = this.enemies.create(
                Phaser.Math.Between(50, 750),
                -50,
                "scout"
            );
            scout.type = "scout";
            //fire cooldown
            scout.fireRate = 3500;
            scout.nextFireTime = 0;

        }

        //bombers
        if (this.wave >= 2){
            const maxBombers = 2;
            const bomberCount = Math.min(Math.floor((this.wave - 1) / 3), maxBombers);
            for (let i = 0; i < bomberCount; i++) {
                const bomber = this.enemies.create(
                    Phaser.Math.Between(100, 700),
                    -80,
                    "bomber"
                );
                bomber.type = "bomber";

                //slower but heavier fire
                bomber.fireRate = 5000;
                bomber.nextFireTime = 0;
            }
        }
        
    }


    playerHitEnemy(bullet, enemy){
        bullet.destroy();
        enemy.destroy();

        this.score += enemy.type === "scout" ? 50 : 100;
        this.scoreText.setText("Score: " + this.score);

        //check for new high score

        if (this.score > this.highScore){
            this.highScore = this.score;
            this.highScoreText.setText("High Score: " + this.highScore);

            //save to disk
            localStorage.setItem("skystrike_highscore", this.highScore);
        }
    }


    enemyHitPlayer(player, bullet){
        bullet.destroy();
        this.damagePlayer();
    }

    playerCrashEnemy(player, enemy){
        enemy.destroy();
        this.damagePlayer();
    }

    damagePlayer(){
        this.lives--;
        this.livesText.setText("Lives: " + this.lives);

        if (this.lives <= 0){
            this.endGame();
        }
    }

    endGame(){
        this.gameOver = true;

        //stop background music
        if(this.bgMusic && this.bgMusic.isPlaying){
            this.bgMusic.stop();
        }

        //play death sound
        this.sound.play("deathSound", {
            volume: 0.7
        });

        this.player.setVisible(false);
        this.player.body.enable = false;

        //stop spawning & gameplay
        if (this.enemySpawner){
            this.enemySpawner.remove(false);
        }

        this.enemies.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.playerBullets.clear(true, true);

        this.add.text(250, 250, "GAME OVER", {
            fontSize: "48px",
            fill: "#ff0000"
        });

        this.add.text(220, 300, "Press R to Restart", {
            fontSize: "20px",
            fill: "#ffffff"
        });

        this.add.text(220, 330, "Press P to Play Again", {
            fontSize: "20px",
            fill: "#ffffff"
        });

        this.add.text(235, 365, "Final Score: " + this.score, {
            fontSize: "22px",
            fill: "#ffff00"
        });

        this.add.text(235, 400, "High Score: " + this.highScore, {
            fontSize: "22px",
            fill: "#ffff00"
        });

        this.input.keyboard.once("keydown-R", () => {
            this.scene.restart({mode: "hard"});
        });

        this.input.keyboard.once("keydown-P", () => {
            this.scene.restart({
                mode: "soft",
                score: this.score,
                wave: this.wave
            });
        });
    }


}


