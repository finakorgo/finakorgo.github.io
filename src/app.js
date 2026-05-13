// Starman - Versão com Botão de Música + Score ajustado by José Aparecido Finamor 
const config = {
    type: Phaser.AUTO,
    parent: 'stage',
    width: 800,
    height: 540,
    backgroundColor: '#2F4E7D',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false }
    },
    scene: { preload, create, update }
};

let player, stars, bombs, platforms, cursors;
let score = 0;
let gameOver = false;
let scoreText;
let music = null;
let musicButton = null;

const game = new Phaser.Game(config);

function preload() {
    this.load.audio('theme', 'assets/audio/bodenstaendig_2000_in_rock_4bit.mp3');

    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function create() {
    this.add.image(400, 300, 'sky');

    // ====================== MÚSICA ======================
    music = this.sound.add('theme', { loop: true, volume: 0.7 });

    this.sound.unlock();

    // ====================== UI ======================
    // Score mais para cima
    scoreText = this.add.text(16, 8, 'Score: 0', {
        fontSize: '32px',
        fill: '#ffff00',
        stroke: '#000',
        strokeThickness: 8,
        fontFamily: 'Arial'
    });

    // Botão de Música (usando DOM)
    createMusicButton(this);

    // ====================== PLATAFORMAS ======================
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // ====================== JOGADOR ======================
    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'turn', frames: [{ key: 'dude', frame: 4 }] });
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
    });

    bombs = this.physics.add.group();

    // Colisões
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    this.physics.add.overlap(player, stars, collectStar, null, this);
}

// Função para criar o botão de música
function createMusicButton(scene) {
    const buttonHTML = `
        <button id="musicBtn" style="
            position: absolute;
            top: 15px;
            right: 20px;
            padding: 10px 16px;
            font-size: 16px;
            background: #22d3ee;
            color: #000;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            z-index: 100;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
            🎵 Ligar Música
        </button>`;

    const stage = document.getElementById('stage');
    stage.insertAdjacentHTML('beforebegin', buttonHTML);

    const btn = document.getElementById('musicBtn');
    
    btn.addEventListener('click', () => {
        if (music) {
            if (music.isPlaying) {
                music.pause();
                btn.textContent = '🎵 Ligar Música';
                btn.style.background = '#22d3ee';
            } else {
                music.play();
                btn.textContent = '⏸️ Pausar Música';
                btn.style.background = '#f87171';
            }
        }
    });
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

    stars.children.iterate(child => {
        if (child.active) child.rotation += 0.03;
    });
}

function collectStar(player, star) {
    if (!star.active) return;
    star.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(child => {
            child.enableBody(true, child.x, 0, true, true);
        });

        const x = player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        const bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }
}

function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    gameOver = true;
    this.cameras.main.fade(1500, 0, 0, 0);

    setTimeout(() => {
        document.getElementById("pop").innerHTML = `
            <h3 style="color:white;">Game Over!</h3>
            <button onclick="window.location.reload()" style="padding:12px 30px; font-size:18px; background:#f00; color:white; border:none; border-radius:8px; cursor:pointer;">
                Jogar Novamente
            </button>`;
    }, 1500);
}
