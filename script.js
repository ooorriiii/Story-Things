// Advanced hidden object game with moving bombs, bonus coins, difficulty levels and more.

const startGameBtn = document.getElementById('start-game');
const connectWalletBtn = document.getElementById('connect-wallet');
const hintButton = document.getElementById('hint-button');
const revealButton = document.getElementById('reveal-button');
const resetButton = document.getElementById('reset-button');
const difficultySelect = document.getElementById('difficulty-select');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const hiddenObjectArea = document.getElementById('hidden-object-area');
const balanceEl = document.getElementById('balance');
const coinDisplay = document.getElementById('coin-display');
const levelInfo = document.getElementById('level-info');
const livesInfo = document.getElementById('lives-info');
const scoreInfo = document.getElementById('score-info');
const timerEl = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const gameMessage = document.getElementById('game-message');

// Persistent values via localStorage
let balance = parseInt(localStorage.getItem('demoBalance') || '5', 10);
let maxLevel = parseInt(localStorage.getItem('maxLevel') || '0', 10);

// Game state variables
let level = 1;
let lives = 3;
let objects = [];
let bombs = [];
let bonuses = [];
let timeLeft = 0;
let totalTime = 0;
let timerInterval;
let moveInterval;
let difficulty = 'normal';

const difficultySettings = {
  easy:   { baseTime: 70, timeDec: 10, bombsFactor: 0.3, starsOffset: 2 },
  normal: { baseTime: 60, timeDec: 8,  bombsFactor: 0.5, starsOffset: 2 },
  hard:   { baseTime: 50, timeDec: 6,  bombsFactor: 1.0, starsOffset: 3 }
};

function updateBalanceDisplay() {
  localStorage.setItem('demoBalance', balance.toString());
  balanceEl.textContent = `Balance: ${balance} coins`;
  coinDisplay.textContent = `Coins: ${balance}`;
}

function updateLevelInfo() {
  levelInfo.textContent = `Level: ${level}`;
  livesInfo.textContent = `Lives: ${lives}`;
  scoreInfo.textContent = `Highest level: ${maxLevel}`;
}

function updateTimerDisplay() {
  timerEl.textContent = `Time left: ${timeLeft}s`;
}

function updateProgressBar(fraction) {
  progressBar.style.width = `${fraction * 100}%`;
  const startColor = [76, 175, 80];
  const endColor = [244, 67, 54];
  const r = Math.round(startColor[0] + (1 - fraction) * (endColor[0] - startColor[0]));
  const g = Math.round(startColor[1] + (1 - fraction) * (endColor[1] - startColor[1]));
  const b = Math.round(startColor[2] + (1 - fraction) * (endColor[2] - startColor[2]));
  progressBar.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

function connectWallet() {
  alert('In the real system your crypto wallet would be connected. This is only a demo.');
}

function createSparkle(x, y) {
  for (let i = 0; i < 8; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 30 + 10;
    spark.style.left = `${x + Math.cos(angle) * distance - 4}px`;
    spark.style.top = `${y + Math.sin(angle) * distance - 4}px`;
    hiddenObjectArea.appendChild(spark);
    setTimeout(() => spark.remove(), 600);
  }
}

function startTimer() {
  stopTimer();
  updateTimerDisplay();
  updateProgressBar(1);
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerDisplay();
      updateProgressBar(0);
      stopTimer();
      gameMessage.textContent = `Time's up! You reached level ${level}. Click Reset Game to try again.`;
      disableAllInteractions();
      return;
    }
    updateTimerDisplay();
    updateProgressBar(timeLeft / totalTime);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (moveInterval) {
    clearInterval(moveInterval);
    moveInterval = null;
  }
}

function disableAllInteractions() {
  objects.forEach(o => o.style.pointerEvents = 'none');
  bombs.forEach(b => b.style.pointerEvents = 'none');
  bonuses.forEach(b => b.style.pointerEvents = 'none');
  hintButton.disabled = true;
  revealButton.disabled = true;
}

function initLevel() {
  hiddenObjectArea.innerHTML = '';
  gameMessage.textContent = '';
  objects = [];
  bombs = [];
  bonuses = [];
  // Read difficulty
  const settings = difficultySettings[difficulty];
  totalTime = Math.max(settings.baseTime - (level - 1) * settings.timeDec, 15);
  timeLeft = totalTime;
  updateTimerDisplay();
  updateProgressBar(1);
  updateLevelInfo();
  // Randomize background gradient
  const gradients = [
    'linear-gradient(180deg, #83a4d4 0%, #b6fbff 100%)',
    'linear-gradient(180deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(180deg, #f8ffae 0%, #43c6ac 100%)'
  ];
  hiddenObjectArea.style.background = gradients[Math.floor(Math.random() * gradients.length)];
  // Spawn stars
  const numStars = level + settings.starsOffset;
  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'object';
    star.textContent = '★';
    star.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    star.style.top = Math.floor(Math.random() * 80 + 10) + '%';
    star.addEventListener('click', (e) => {
      const rect = hiddenObjectArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createSparkle(x, y);
      star.style.display = 'none';
      objects.splice(objects.indexOf(star), 1);
      checkCompletion();
    });
    objects.push(star);
    hiddenObjectArea.appendChild(star);
  }
  // Spawn bombs
  const numBombs = Math.max(1, Math.floor(level * settings.bombsFactor));
  for (let i = 0; i < numBombs; i++) {
    const bomb = document.createElement('div');
    bomb.className = 'bomb';
    bomb.textContent = '💣';
    bomb.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    bomb.style.top = Math.floor(Math.random() * 80 + 10) + '%';
    // assign random velocity
    bomb.dataset.vx = (Math.random() * 0.6 + 0.2).toString();
    bomb.dataset.vy = (Math.random() * 0.6 + 0.2).toString();
    bomb.addEventListener('click', () => handleBombClick(bomb));
    bombs.push(bomb);
    hiddenObjectArea.appendChild(bomb);
  }
  // Possibly spawn bonus coin (50% chance)
  if (Math.random() < 0.5) {
    const bonus = document.createElement('div');
    bonus.className = 'bonus';
    bonus.textContent = '💰';
    bonus.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    bonus.style.top = Math.floor(Math.random() * 80 + 10) + '%';
    bonus.addEventListener('click', () => {
      bonus.remove();
      bonuses.splice(bonuses.indexOf(bonus), 1);
      balance += 2;
      updateBalanceDisplay();
      gameMessage.textContent = 'Bonus! +2 coins';
    });
    bonuses.push(bonus);
    hiddenObjectArea.appendChild(bonus);
  }
  startTimer();
  moveBombs();
  hintButton.disabled = false;
  revealButton.disabled = false;
}

function moveBombs() {
  // update bomb positions every 60ms
  moveInterval = setInterval(() => {
    const areaRect = hiddenObjectArea.getBoundingClientRect();
    bombs.forEach(bomb => {
      let vx = parseFloat(bomb.dataset.vx);
      let vy = parseFloat(bomb.dataset.vy);
      let x = parseFloat(bomb.style.left);
      let y = parseFloat(bomb.style.top);
      // update
      x += vx;
      y += vy;
      // bounce off walls
      if (x < 0 || x > 95) {
        vx = -vx;
        bomb.dataset.vx = vx.toString();
      }
      if (y < 10 || y > 85) {
        vy = -vy;
        bomb.dataset.vy = vy.toString();
      }
      // clamp
      x = Math.max(0, Math.min(95, x));
      y = Math.max(10, Math.min(85, y));
      bomb.style.left = `${x}%`;
      bomb.style.top = `${y}%`;
    });
  }, 60);
}

function handleBombClick(bomb) {
  bomb.remove();
  bombs.splice(bombs.indexOf(bomb), 1);
  lives--;
  if (lives < 0) lives = 0;
  // reduce time
  timeLeft = Math.max(0, timeLeft - 5);
  updateLevelInfo();
  updateTimerDisplay();
  updateProgressBar(timeLeft / totalTime);
  if (lives <= 0) {
    stopTimer();
    gameMessage.textContent = `Game over! You lost all lives. You reached level ${level}. Click Reset Game to try again.`;
    disableAllInteractions();
    return;
  }
  if (timeLeft === 0) {
    stopTimer();
    gameMessage.textContent = `Time's up! You reached level ${level}. Click Reset Game to try again.`;
    disableAllInteractions();
    return;
  }
}

startGameBtn.addEventListener('click', () => {
  level = 1;
  lives = 3;
  difficulty = difficultySelect.value;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateBalanceDisplay();
  updateLevelInfo();
  initLevel();
});

connectWalletBtn.addEventListener('click', connectWallet);

hintButton.addEventListener('click', () => {
  if (balance <= 0) {
    gameMessage.textContent = "You don't have enough coins for a hint.";
    return;
  }
  if (objects.length === 0) {
    gameMessage.textContent = 'There are no objects left to find.';
    return;
  }
  balance -= 1;
  updateBalanceDisplay();
  const obj = objects[0];
  const originalColor = obj.style.color;
  obj.style.color = '#00ff00';
  setTimeout(() => {
    obj.style.color = originalColor;
  }, 800);
});

revealButton.addEventListener('click', () => {
  if (balance < 3) {
    gameMessage.textContent = "You don't have enough coins to reveal all.";
    return;
  }
  if (objects.length === 0) {
    gameMessage.textContent = 'There are no objects left to reveal.';
    return;
  }
  balance -= 3;
  updateBalanceDisplay();
  objects.forEach(obj => {
    obj.dataset.orig = obj.style.color;
    obj.style.color = '#00ff00';
  });
  setTimeout(() => {
    objects.forEach(obj => {
      obj.style.color = obj.dataset.orig;
    });
  }, 2000);
});

resetButton.addEventListener('click', () => {
  level = 1;
  lives = 3;
  stopTimer();
  updateBalanceDisplay();
  updateLevelInfo();
  initLevel();
});

function checkCompletion() {
  if (objects.length === 0) {
    stopTimer();
    balance += level;
    updateBalanceDisplay();
    gameMessage.textContent = `Great job! You completed level ${level}. Awarded ${level} coin${level > 1 ? 's' : ''}. Starting next level...`;
    if (level > maxLevel) {
      maxLevel = level;
      localStorage.setItem('maxLevel', maxLevel.toString());
    }
    level++;
    updateLevelInfo();
    setTimeout(() => {
      initLevel();
    }, 2000);
  }
}

// Initial display on page load
updateBalanceDisplay();
updateLevelInfo();
