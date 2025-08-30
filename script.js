// Enhanced hidden object game with level progression, animated stars,
// progress bar with color change, sparkle effects on collection, and a score tracker.

const startGameBtn = document.getElementById('start-game');
const connectWalletBtn = document.getElementById('connect-wallet');
const hintButton = document.getElementById('hint-button');
const resetButton = document.getElementById('reset-button');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const hiddenObjectArea = document.getElementById('hidden-object-area');
const balanceEl = document.getElementById('balance');
const coinDisplay = document.getElementById('coin-display');
const levelInfo = document.getElementById('level-info');
const scoreInfo = document.getElementById('score-info');
const timerEl = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const gameMessage = document.getElementById('game-message');

// Demo balance stored in localStorage (for persistence between sessions)
let balance = parseInt(localStorage.getItem('demoBalance') || '5', 10);
let objects = [];
let level = 1;
let timeLeft = 0;
let totalTime = 0;
let timerInterval;
let maxLevel = parseInt(localStorage.getItem('maxLevel') || '0', 10);

function updateBalanceDisplay() {
  // update both persistent balance and displayed coin info
  localStorage.setItem('demoBalance', balance.toString());
  balanceEl.textContent = `Balance: ${balance} coins`;
  coinDisplay.textContent = `Coins: ${balance}`;
}

function updateLevelInfo() {
  levelInfo.textContent = `Level: ${level}`;
  scoreInfo.textContent = `Highest level: ${maxLevel}`;
}

function connectWallet() {
  alert('In the real system your crypto wallet would be connected. This is only a demo.');
}

// Initialize a new level
function initGame() {
  hiddenObjectArea.innerHTML = '';
  gameMessage.textContent = '';
  // Determine time based on level: start with 60s and decrease by 10s per level, minimum 20s
  totalTime = Math.max(60 - (level - 1) * 10, 20);
  timeLeft = totalTime;
  updateProgressBar(1); // full width and green
  updateTimerDisplay();
  objects = [];
  updateLevelInfo();
  // Add objects: number increases with level (level + 2)
  for (let i = 0; i < level + 2; i++) {
    const obj = document.createElement('div');
    obj.className = 'object';
    obj.textContent = '★';
    obj.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    obj.style.top = Math.floor(Math.random() * 80 + 10) + '%';
    obj.addEventListener('click', (e) => {
      // create sparkle effect at click location
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
  startTimer();
}

function updateTimerDisplay() {
  timerEl.textContent = `Time left: ${timeLeft}s`;
}

function updateProgressBar(fraction) {
  // fraction between 0 and 1
  progressBar.style.width = `${fraction * 100}%`;
  // Transition color from green (#4caf50) to red (#f44336)
  const startColor = [76, 175, 80];
  const endColor = [244, 67, 54];
  const r = Math.round(startColor[0] + (1 - fraction) * (endColor[0] - startColor[0]));
  const g = Math.round(startColor[1] + (1 - fraction) * (endColor[1] - startColor[1]));
  const b = Math.round(startColor[2] + (1 - fraction) * (endColor[2] - startColor[2]));
  progressBar.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
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
      // disable further clicks
      objects.forEach(obj => obj.style.pointerEvents = 'none');
      return;
    }
    updateTimerDisplay();
    const fraction = timeLeft / totalTime;
    updateProgressBar(fraction);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function createSparkle(x, y) {
  // Create 8 sparkles around the clicked location
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
    setTimeout(() => {
      spark.remove();
    }, 600);
  }
}

// Start game button
startGameBtn.addEventListener('click', () => {
  level = 1;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateBalanceDisplay();
  initGame();
});

// Connect wallet button
connectWalletBtn.addEventListener('click', connectWallet);

// Hint button: reveals one remaining object at the cost of 1 coin
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
  // highlight one object temporarily
  const obj = objects[0];
  const originalColor = obj.style.color;
  obj.style.color = '#00ff00';
  setTimeout(() => {
    obj.style.color = originalColor;
  }, 800);
});

// Reset game button
resetButton.addEventListener('click', () => {
  level = 1;
  stopTimer();
  updateBalanceDisplay();
  initGame();
});

function checkCompletion() {
  if (objects.length === 0) {
    stopTimer();
    // Award coins equal to current level
    balance += level;
    updateBalanceDisplay();
    gameMessage.textContent = `Great job! You completed level ${level}. Awarded ${level} coin${level > 1 ? 's' : ''}. Starting next level...`;
    // update maxLevel if surpassed
    if (level > maxLevel) {
      maxLevel = level;
      localStorage.setItem('maxLevel', maxLevel.toString());
    }
    level++;
    updateLevelInfo();
    setTimeout(() => {
      initGame();
    }, 2000);
  }
}

// Initial display on page load
updateBalanceDisplay();
updateLevelInfo();
