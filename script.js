// Complex hidden object game with bombs, lives, reveal-all power-up, level progression,
// animated stars, progress bar color change, sparkle effects, and highest level tracking.

const startGameBtn = document.getElementById('start-game');
const connectWalletBtn = document.getElementById('connect-wallet');
const hintButton = document.getElementById('hint-button');
const revealButton = document.getElementById('reveal-button');
const resetButton = document.getElementById('reset-button');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const hiddenObjectArea = document.getElementById('hidden-object-area');
const balanceEl = document.getElementById('balance');
const coinDisplay = document.getElementById('coin-display');
const levelInfo = document.getElementById('level-info');
const scoreInfo = document.getElementById('score-info');
const livesInfo = document.getElementById('lives-info');
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
let timeLeft = 0;
let totalTime = 0;
let timerInterval;

function updateBalanceDisplay() {
  localStorage.setItem('demoBalance', balance.toString());
  balanceEl.textContent = `Balance: ${balance} coins`;
  coinDisplay.textContent = `Coins: ${balance}`;
}

function updateLevelInfo() {
  levelInfo.textContent = `Level: ${level}`;
  scoreInfo.textContent = `Highest level: ${maxLevel}`;
  livesInfo.textContent = `Lives: ${lives}`;
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
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;
    spark.style.left = `${x + offsetX - 4}px`;
    spark.style.top = `${y + offsetY - 4}px`;
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
}

function disableAllInteractions() {
  // disable clicks on objects and bombs
  objects.forEach(obj => obj.style.pointerEvents = 'none');
  bombs.forEach(b => b.style.pointerEvents = 'none');
  hintButton.disabled = true;
  revealButton.disabled = true;
}

function initLevel() {
  hiddenObjectArea.innerHTML = '';
  gameMessage.textContent = '';
  objects = [];
  bombs = [];
  // Determine time for current level
  totalTime = Math.max(60 - (level - 1) * 10, 20);
  timeLeft = totalTime;
  updateTimerDisplay();
  updateProgressBar(1);
  updateLevelInfo();
  // Determine background gradient randomization
  const gradients = [
    'linear-gradient(180deg, #83a4d4 0%, #b6fbff 100%)',
    'linear-gradient(180deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(180deg, #f8ffae 0%, #43c6ac 100%)'
  ];
  const bg = gradients[Math.floor(Math.random() * gradients.length)];
  hiddenObjectArea.style.background = bg;
  // Add stars (objects)
  for (let i = 0; i < level + 2; i++) {
    const obj = document.createElement('div');
    obj.className = 'object';
    obj.textContent = '★';
    obj.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    obj.style.top = Math.floor(Math.random() * 80 + 10) + '%';
    obj.addEventListener('click', (e) => {
      const rect = hiddenObjectArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createSparkle(x, y);
      obj.style.display = 'none';
      objects.splice(objects.indexOf(obj), 1);
      checkCompletion();
    });
    objects.push(obj);
    hiddenObjectArea.appendChild(obj);
  }
  // Add bombs depending on level
  const bombCount = Math.max(1, Math.floor(level / 2));
  for (let i = 0; i < bombCount; i++) {
    const bomb = document.createElement('div');
    bomb.className = 'bomb';
    bomb.textContent = '💣';
    bomb.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    bomb.style.top = Math.floor(Math.random() * 80 + 10) + '%';
    bomb.addEventListener('click', (e) => {
      handleBombClick(bomb);
    });
    bombs.push(bomb);
    hiddenObjectArea.appendChild(bomb);
  }
  startTimer();
  // Enable buttons
  hintButton.disabled = false;
  revealButton.disabled = false;
}

function handleBombClick(bomb) {
  // remove bomb
  bomb.remove();
  bombs.splice(bombs.indexOf(bomb), 1);
  lives--;
  if (lives < 0) lives = 0;
  // reduce time by 5 seconds
  timeLeft = Math.max(0, timeLeft - 5);
  updateLivesInfo();
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

function updateLivesInfo() {
  livesInfo.textContent = `Lives: ${lives}`;
}

// Start game handler
startGameBtn.addEventListener('click', () => {
  level = 1;
  lives = 3;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateBalanceDisplay();
  updateLevelInfo();
  initLevel();
});

connectWalletBtn.addEventListener('click', connectWallet);

// Hint button handler
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

// Reveal all button handler
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
  // Highlight all objects temporarily
  objects.forEach(obj => {
    obj.dataset.originalColor = obj.style.color;
    obj.style.color = '#00ff00';
  });
  setTimeout(() => {
    objects.forEach(obj => {
      obj.style.color = obj.dataset.originalColor;
    });
  }, 2000);
});

// Reset game handler
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
    // Award coins equal to current level
    balance += level;
    updateBalanceDisplay();
    gameMessage.textContent = `Great job! You completed level ${level}. Awarded ${level} coin${level > 1 ? 's' : ''}. Starting next level...`;
    // update max level
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
updateLivesInfo();
