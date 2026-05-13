// Starman - Versão com Botão de Música + Score ajustado by José Aparecido Finamor 
// Starman - Versão Final com Botão no HTML
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
let musicBtn = null;

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

    // Música
    music = this.sound.add('theme', { loop: true, volume: 0.7 });
    this.sound.unlock();

    // Score mais no topo
    scoreText = this.add.text(16, 8, 'Score: 0', {
        fontSize: '34px',
        fill: '#ffff00',
        stroke: '#000',
        strokeThickness: 8
    });

    // Pegar o botão que está no HTML
    musicBtn = document.getElementById('musicBtn');
    
    if (musicBtn) {
        musicBtn.addEventListener('click', () => {
            if (!music) return;
            
            if (music.isPlaying) {
                music.pause();
                musicBtn.textContent = '🎵 Ligar Música';
                musicBtn.style.background = '#22d3ee';
            } else {
                music.play();
                musicBtn.textContent = '⏸️ Pausar Música';
                musicBtn.style.background = '#f87171';
            }
        });
    }

    // ====================== PLATAFORMAS ======================
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // Jogador
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

    stars.children.iterate(child => child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)));

    bombs = this.physics.add.group();

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

    stars.children.iterate(child => {
        if (child.active) child.rotation += 0.03;
    });
}

// Funções de coleta e game over (mesmas)
function collectStar(player, star) {
    if (!star.active) return;
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(child => child.enableBody(true, child.x, 0, true, true));

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
