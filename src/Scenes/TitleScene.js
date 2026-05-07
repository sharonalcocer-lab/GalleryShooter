class TitleScene extends Phaser.Scene {
    constructor() {
        super("TitleScene");
    }

    preload(){
        this.load.image("clouds", "assets/different_background.png");
        document.getElementById('description').innerHTML = '<h2>TitleScene.js</h2>'
    }

    
    create() {
        //scrolling background
        this.clouds = this.add.tileSprite(400, 300, 800, 600, "clouds");

        this.add.text(200, 180, "SKY STRIKE", {
            fontSize: "64px",
            fill: "#ffffff"
        });

        this.add.text(220, 280, "Right/Left Arrow Keys: Move", {
            fontSize: "24px",
            fill: "#ffffff"
        });

        this.add.text(220, 315, "Space: Shoot", {
            fontSize: "24px",
            fill: "#ffffff"
        });

        this.add.text(190, 380, "Press SPACE to Start", {
            fontSize: "28px",
            fill:"#ffff00"
        });

        this.input.keyboard.once("keydown-SPACE", () => {
            this.scene.start("GameScene");
        });
        
    }


    update(){
        this.clouds.tilePositionY -= 0.3;
    }


}