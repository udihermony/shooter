// Get the canvas element and its drawing context (2D)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Set the canvas dimensions to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ======================
// LOAD IMAGES & ASSETS
// ======================
const backgroundImg = new Image();
backgroundImg.src = 'assets/purple.png'; // Background image

const playerImg = new Image();
playerImg.src = 'assets/playerShip1_orange.png'; // Player ship image

const enemyImg = new Image();
enemyImg.src = 'assets/enemyBlack2.png'; // Enemy ship image

const bulletImg = new Image();
bulletImg.src = 'assets/laserBlue01.png'; // Bullet image

const shieldImg = new Image();
shieldImg.src = 'assets/shield1.png'; // Shield image

const bombImg = new Image();
bombImg.src = 'assets/bomb.png'; // Bomb image for power-up

// ======================
// LOAD SOUND EFFECTS
// ======================
const sfxLose = new Audio('assets/sfx_lose.ogg'); // Sound when player loses a life
const sfxLaser = new Audio('assets/sfx_laser2.ogg'); // Laser shot sound effect

// ======================
// GAME VARIABLES
// ======================
let score = 0;
let lives = 10;
let lastLifeBonus = 0;
let enemiesKilled = 0;
let stage = 1;

const player = { 
  x: canvas.width / 2,      
  y: canvas.height - 80,    
  width: 60,                
  height: 60,               
  speed: 200                
};

const bullets = [];
const enemies = [];

let bomb = null;
const bombLifetime = 30; // Bomb lifetime in seconds
let bombTimer = 0;
const bombSpawnRate = 0.005;
const forceSpawnBomb = true; // Force spawn bomb immediately (for testing)

const shieldFlashDuration = 1; // Duration in seconds for shield flash
let shieldFlashTimer = 0;

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  w: false,
  a: false,
  s: false,
  d: false
};

// ======================
// DRAWING FUNCTIONS
// ======================
function drawBackground() {
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function drawBullets() {
  bullets.forEach(bullet => {
    ctx.save();
    ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
    let rotation = 0;
    if (bullet.direction === 'left') rotation = Math.PI * 1.5;
    else if (bullet.direction === 'down') rotation = Math.PI;
    else if (bullet.direction === 'right') rotation = Math.PI * 0.5;
    
    ctx.rotate(rotation);
    ctx.drawImage(bulletImg, -bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
    ctx.restore();
    
    switch (bullet.direction) {
      case 'up':
        bullet.y -= bullet.speed;
        break;
      case 'right':
        bullet.x += bullet.speed;
        break;
      case 'down':
        bullet.y += bullet.speed;
        break;
      case 'left':
        bullet.x -= bullet.speed;
        break;
    }
  });
}

function drawEnemies() {
    enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
      
      // Use the calculated angle for rotation instead of fixed directions
      // Add 90 degrees (PI/2) because the enemy sprite faces up by default
      let rotation = enemy.angle + Math.PI * 1.5;
      
      ctx.rotate(rotation);
      ctx.drawImage(enemyImg, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
      ctx.restore();
      
      // Update position using velocities
      enemy.x += enemy.velocityX;
      enemy.y += enemy.velocityY;
    });
  }

function drawBomb(deltaTime) {
  if (bomb) {
    const scale = 1 + Math.sin(bombTimer * 4) * 0.2;
    const width = bomb.width * scale;
    const height = bomb.height * scale;
    const x = bomb.x - (width - bomb.width) / 2;
    const y = bomb.y - (height - bomb.height) / 2;

    ctx.beginPath();
    ctx.arc(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, bomb.width * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.fill();
    
    ctx.drawImage(bombImg, x, y, width, height);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE UP', bomb.x + bomb.width / 2, bomb.y - 10);
    
    bombTimer += deltaTime;
    
    if (bombTimer >= bombLifetime) {
      bomb = null;
      bombTimer = 0;
    }
  }
}

// Display the current score
function drawScore() {
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Score: ' + score, 10, 30);
}

// Display the current number of lives
function drawLives() {
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Lives: ' + lives, 10, 60);
}

// Display the number of enemies killed
function drawEnemiesKilled() {
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Enemies Killed: ' + enemiesKilled, 10, 90);
}

// Display the current stage
function drawStage() {
  ctx.fillStyle = 'rgba(0, 0, 100, 0.7)';
  ctx.fillRect(canvas.width - 200, 10, 190, 60);
  
  ctx.strokeStyle = 'gold';
  ctx.lineWidth = 3;
  ctx.strokeRect(canvas.width - 200, 10, 190, 60);
  
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = 'gold';
  ctx.textAlign = 'center';
  ctx.fillText('STAGE: ' + stage, canvas.width - 105, 50);
  
  ctx.textAlign = 'left';
}
// ======================
// BOMB SPAWNING
// ======================
function spawnBomb() {
    if (!bomb) {
      bomb = {
        x: Math.random() * (canvas.width - 50),
        y: Math.random() * (canvas.height - 50),
        width: 50,
        height: 50
      };
      bombTimer = 0;
    }
  }
  
  // ======================
  // GAME INITIALIZATION
  // ======================
  function initGame() {
    // Force spawn a bomb at the start if required
    if (forceSpawnBomb) {
      spawnBomb();
    }
    
    // Spawn initial enemies
    for (let i = 0; i < 5; i++) {
      spawnEnemy();
    }
  }
  
  // Add these to your gameLoop function to continuously spawn enemies and bombs
  function updateSpawning(deltaTime) {
    // Spawn enemies based on stage and time
    if (Math.random() < 0.02 + (stage * 0.005)) {
      spawnEnemy();
    }
    
    // Randomly spawn a bomb if none exists
    if (!bomb && Math.random() < bombSpawnRate) {
      spawnBomb();
    }
    
    // Handle enemy cleanup when they leave the screen
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (
        enemy.x < -100 || 
        enemy.x > canvas.width + 100 || 
        enemy.y < -100 || 
        enemy.y > canvas.height + 100
      ) {
        enemies.splice(i, 1);
      }
    }
  }
// Flash effect on the player when hit
function drawShieldEffect(deltaTime) {
  if (shieldFlashTimer > 0) {
    if (Math.floor(shieldFlashTimer * 10) % 2 === 0) {
      ctx.drawImage(shieldImg, player.x, player.y, player.width, player.height);
    }
    shieldFlashTimer -= deltaTime;
  }
}

// ======================
// PLAYER MOVEMENT
// ======================
function updatePlayerPosition(deltaTime) {
    // Calculate movement based on arrow key presses
    if (keys.ArrowLeft || keys.a) {
      player.x -= player.speed * deltaTime;
    }
    if (keys.ArrowRight || keys.d) {
      player.x += player.speed * deltaTime;
    }
    if (keys.ArrowUp || keys.w) {
      player.y -= player.speed * deltaTime;
    }
    if (keys.ArrowDown || keys.s) {
      player.y += player.speed * deltaTime;
    }
    
    // Keep player within canvas bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
  }
  
// ======================
// ENEMY SPAWNING
// ======================
// ======================
// ENHANCED ENEMY SPAWNING
// ======================
function spawnEnemy() {
    const size = Math.random() * 20 + 40;
    const direction = Math.floor(Math.random() * 4); // Spawn direction (edge)
    
    const baseSpeed = 1 + (stage * 0.2);
    const minSpeed = baseSpeed * 0.5;
    const maxSpeed = baseSpeed * 1.5;
    
    let x, y;
    
    // Determine spawn position based on direction
    switch(direction) {
      case 0: // Top edge
        x = Math.random() * (canvas.width - size);
        y = -size;
        break;
      case 1: // Right edge
        x = canvas.width + size;
        y = Math.random() * (canvas.height - size);
        break;
      case 2: // Bottom edge
        x = Math.random() * (canvas.width - size);
        y = canvas.height + size;
        break;
      case 3: // Left edge
        x = -size;
        y = Math.random() * (canvas.height - size);
        break;
    }
    
    // Calculate movement vector towards a random point in the screen
    // This creates diagonal movement instead of straight lines
    let targetX, targetY;
    
    // Option 1: Random point in the screen for truly random diagonal movement
    if (Math.random() < 0.6) { // 60% chance for random movement
      targetX = Math.random() * canvas.width;
      targetY = Math.random() * canvas.height;
    } 
    // Option 2: Target near the player for more challenging gameplay
    else {
      // Target area near the player with some randomness
      const randomOffset = 100 + Math.random() * 200;
      const randomAngle = Math.random() * Math.PI * 2;
      targetX = player.x + Math.cos(randomAngle) * randomOffset;
      targetY = player.y + Math.sin(randomAngle) * randomOffset;
    }
    
    // Calculate direction vector
    const dx = targetX - x;
    const dy = targetY - y;
    
    // Normalize the direction vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;
    
    // Set velocity based on normalized direction and random speed
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const velocityX = normalizedDx * speed;
    const velocityY = normalizedDy * speed;
    
    // Calculate the angle for proper enemy rotation
    const angle = Math.atan2(dy, dx);
    
    enemies.push({
      x: x,
      y: y,
      width: size,
      height: size,
      velocityX: velocityX,
      velocityY: velocityY,
      direction: direction,
      angle: angle // Store angle for correct rotation
    });
  }
// ======================
// COLLISION DETECTION
// ======================
function collisionDetection() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    let bulletHit = false;
    
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemies.splice(j, 1);
        bulletHit = true;
        score += 10 * stage;
        enemiesKilled++;
        break;
      }
    }
    
    if (bulletHit) {
      bullets.splice(i, 1);
    } else if (
      bullet.x < -50 || 
      bullet.x > canvas.width + 50 || 
      bullet.y < -50 || 
      bullet.y > canvas.height + 50
    ) {
      bullets.splice(i, 1);
    }
  }
}

function collisionDetectionPlayer() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    
    if (
      enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x &&
      enemy.y < player.y + player.height &&
      enemy.y + enemy.height > player.y
    ) {
      enemies.splice(i, 1);
      lives--;
      shieldFlashTimer = shieldFlashDuration;
      sfxLose.play();
    }
  }
}

function checkBombCollision() {
  if (bomb && 
      player.x < bomb.x + bomb.width &&
      player.x + player.width > bomb.x &&
      player.y < bomb.y + bomb.height &&
      player.y + player.height > bomb.y) {
    
    stage++;
    shieldFlashTimer = shieldFlashDuration * 2;
    enemiesKilled += enemies.length;
    enemies.length = 0;
    score += stage * 500;
    
    if (stage % 3 === 0) {
      lives++;
    }
    
    bomb = null;
    bombTimer = 0;
    
    setTimeout(() => {
      spawnBomb();
    }, 3000);
  }
}

// ======================
// GAME OVER CONDITION
// ======================
function gameOver() {
    const playerName = prompt("Enter your name: ");
    if (playerName) {
      const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
      
      // Save player name, score, stage, and enemies killed
      leaderboard.push({ 
        name: playerName, 
        score: score,
        stage: stage,
        enemiesKilled: enemiesKilled
      });
      
      // Sort by score (highest first)
      leaderboard.sort((a, b) => b.score - a.score);
      
      // Keep only top 10
      if (leaderboard.length > 10) {
        leaderboard.length = 10;
      }
      
      localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
  
    ctx.font = '48px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText('Highest Stage: ' + stage, canvas.width / 2, canvas.height / 2 + 70);
    ctx.fillText('Enemies Killed: ' + enemiesKilled, canvas.width / 2, canvas.height / 2 + 100);
    ctx.fillText('Press F5 to Restart', canvas.width / 2, canvas.height / 2 + 140);
  
    setTimeout(() => {
      window.location.href = 'leaderboard.html';
    }, 3000);
  }

// ======================
// INPUT HANDLING
// ======================
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  
  if (key === 'arrowleft' || key === 'arrowright' || key === 'arrowup' || key === 'arrowdown') {
    keys[e.key] = true;
  }
  
  if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
    keys[key] = true;
    
    let direction, bulletX, bulletY;
    
    switch (key) {
      case 'w':
        direction = 'up';
        bulletX = player.x + player.width / 2 - 8;
        bulletY = player.y - 10;
        break;
      case 'd':
        direction = 'right';
        bulletX = player.x + player.width + 10;
        bulletY = player.y + player.height / 2 - 8;
        break;
      case 's':
        direction = 'down';
        bulletX = player.x + player.width / 2 - 8;
        bulletY = player.y + player.height + 10;
        break;
      case 'a':
        direction = 'left';
        bulletX = player.x - 30;
        bulletY = player.y + player.height / 2 - 8;
        break;
    }
    
    bullets.push({
      x: bulletX,
      y: bulletY,
      width: 16,
      height: 32,
      speed: 10,
      direction: direction
    });
    
    sfxLaser.play();
  }
});

window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  
  if (key === 'arrowleft' || key === 'arrowright' || key === 'arrowup' || key === 'arrowdown') {
    keys[e.key] = false;
  }
  
  if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
    keys[key] = false;
  }
});

// ======================
// GAME LOOP
// ======================
let lastTime = performance.now();

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawBackground();
  updatePlayerPosition(deltaTime);
  updateSpawning(deltaTime);
  drawBomb(deltaTime);
  drawPlayer();
  drawBullets();
  drawEnemies();
  collisionDetection();
  collisionDetectionPlayer();
  checkBombCollision();
  drawScore();
  drawLives();
  drawEnemiesKilled();
  drawStage();
  drawShieldEffect(deltaTime);
  
  if (lives <= 0) {
    gameOver();
    return;
  }

  requestAnimationFrame(gameLoop);
}
initGame();
requestAnimationFrame(gameLoop);

// ======================
// HANDLE WINDOW RESIZE
// ======================
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
