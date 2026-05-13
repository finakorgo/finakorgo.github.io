// by José Aparecido Finamor - Versão Corrigida 2026
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

let player, stars, bombs, platforms, cursors;
let score = 0;
let gameOver = false;
let scoreText;
let music;
let collectSound, explosionSound;

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
    // === MÚSICA DE FUNDO (corrigido) ===
    music = this.sound.add('theme', { loop: true, volume: 0.7 });
    
    // Desbloqueia áudio (importante para browsers modernos)
    this.sound.unlock();
    if (this.sound.locked) {
        this.input.once('pointerdown', () => music.play());
    } else {
        music.play();
    }

    collectSound = this.sound.add('collect', { volume: 0.8 });
    explosionSound = this.sound.add('explosion', { volume: 0.9 });

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

    this.anims.create({ key: 'left',  frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'turn',  frames: [{ key: 'dude', frame: 4 }], frameRate: 20 });
    this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });

    cursors = this.input.keyboard.createCursorKeys();

    // Estrelas
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(child => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        child.setCollideWorldBounds(true);
    });

    // Bombas
    bombs = this.physics.add.group();

    // Pontuação
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#ffff00',
        fontFamily: 'Arial',
        stroke: '#000',
        strokeThickness: 6
    });

    // Colisões
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    
    // Coleta de estrelas - Versão mais segura
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

    // Rotação das estrelas
    stars.children.iterate(child => {
        if (child.active) child.rotation += 0.03;
    });
}

// ====================== FUNÇÕES DE COLETA ======================
function collectStar(player, star) {
    if (!star.active) return;

    collectSound.play();

    star.disableBody(true, true);   // desativa visual e fisicamente

    score += 10;
    scoreText.setText('Score: ' + score);

    // Respawn das estrelas + bomba
    if (stars.countActive(true) === 0) {
        stars.children.iterate(child => {
            child.enableBody(true, child.x, 0, true, true);
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        const x = (player.x < 400) 
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
        const pop = document.getElementById("pop");
        if (pop) {
            pop.innerHTML = `
                <h3 style="color: white;">Game Over!</h3>
                <button onclick="window.location.reload(true)" 
                        style="padding: 12px 30px; font-size: 18px; background: #f00; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Jogar Novamente
                </button>`;
        }
    }, 1600);
}
