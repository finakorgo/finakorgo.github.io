// by José Aparecido Finamor - Phaser JavaScript com melhorias

const config = {
    type: Phaser.AUTO,
    parent: 'stage',
    width: 800,
    height: 540,
    backgroundColor: '#2F4E7D',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: { preload, create, update }
};

let player;
let stars;
let bombs;
let platforms;
let cursors;
let score = 0;
let gameOver = false;
let scoreText;
let collectSound;
let explosionSound;

const game = new Phaser.Game(config);

function preload() {
    this.load.audio('theme', [
        'assets/audio/bodenstaendig_2000_in_rock_4bit.ogg',
        'assets/audio/bodenstaendig_2000_in_rock_4bit.mp3'
    ]);
    this.load.audio('collect', 'assets/audio/collect.wav');
    this.load.audio('explosion', 'assets/audio/explosion.wav');

    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');

    this.load.spritesheet('dude', 'assets/dude.png', {
        frameWidth: 32,
        frameHeight: 48
    });
}

function create() {
    const music = this.sound.add('theme');
    music.play();

    collectSound = this.sound.add('collect');
    explosionSound = this.sound.add('explosion');

    this.add.image(400, 300, 'sky');

    // Plataformas
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // Jogador
    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();

    // Estrelas
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(child => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    // Bombas
    bombs = this.physics.add.group();

    // Pontuação
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#ffff00',
        fontFamily: 'Arial',
        stroke: '#000',
        strokeThickness: 4
    });

    // Colisões
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    this.physics.add.overlap(player, stars, collectStar, null, this);
}

function update() {
    if (gameOver) return;

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }

    // Rotação contínua das estrelas
    stars.children.iterate(child => {
        if (child.active) {
            child.rotation += 0.03;
        }
    });
}

function collectStar(player, star) {
    star.disableBody(true, true);
    collectSound.play();

    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(child => {
            child.enableBody(true, child.x, 0, true, true);
        });

        const x = player.x < 400
            ? Phaser.Math.Between(400, 800)
            : Phaser.Math.Between(0, 400);

        const bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }
}

function hitBomb(player, bomb) {
    this.physics.pause();
    explosionSound.play();

    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;

    this.cameras.main.fade(1500, 0, 0, 0);

    setTimeout(() => {
        const sit = document.getElementById("pop");
        sit.innerHTML += `
            <button id="btr" type="button"
                onclick="window.location.reload(true)"
                style="margin-top: 20px; padding: 10px 20px; background: #f00; color: #fff; font-size: 18px; border: none; border-radius: 8px; cursor: pointer;">
                Jogar novamente
            </button>
        `;
    }, 1800);
}
