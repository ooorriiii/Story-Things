// Improved hidden object game with levels, timer, coin rewards, and progress bar.

const startGameBtn = document.getElementById('start-game');
const connectWalletBtn = document.getElementById('connect-wallet');
const hintButton = document.getElementById('hint-button');
const resetButton = document.getElementById('reset-button');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const hiddenObjectArea = document.getElementById('hidden-object-area');
const balanceEl = document.getElementById('balance');
const levelInfo = document.getElementById('level-info');
const coinDisplay = document.getElementById('coin-display');
const timerEl = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const gameMessage = document.getElementById('game-message');

// Demo balance stored in localStorage
let balance = parseInt(localStorage.getItem('demoBalance') || '5', 10);
let level = 1;
let objects = [];
let timeTotal = 30;
let timeLeft = 30;
let timerInterval;

function updateBalanceDisplay() {
  balanceEl.textContent = `Balance: ${balance} coins`;
  coinDisplay.textContent = `Coins: ${balance}`;
  localStorage.setItem('demoBalance', balance.toString());
}

function updateLevelInfo() {
  levelInfo.textContent = `Level: ${level} \u2013 Find ${objects.length} star${objects.length !== 1 ? 's' : ''}`;
}

function updateTimerDisplay() {
  timerEl.textContent = `Time left: ${timeLeft}s`;
  const width = (timeLeft / timeTotal) * 100;
  progressBar.style.width = `${width}%`;
}

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timeLeft = 0;
      updateTimerDisplay();
      gameMessage.textContent = "Time's up! Restarting level.";
      // Restart same level after short delay
      setTimeout(() => {
        initGame();
      }, 1500);
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function initGame() {
  // Clear existing objects and timer
  stopTimer();
  hiddenObjectArea.innerHTML = '';
  gameMessage.textContent = '';
  objects = [];
  // Determine number of objects based on level
  const numObjects = level + 2;
  // Determine time based on level (shorter as levels increase)
  timeTotal = Math.max(20, 35 - level * 3);
  timeLeft = timeTotal;
  // Generate objects
  for (let i = 0; i < numObjects; i++) {
    const obj = document.createElement('div');
    obj.className = 'object';
    obj.textContent = '★';
    obj.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    obj.style.top = Math.floor(Math.random() * 90 + 5) + '%';
    obj.addEventListener('click', () => {
      // Remove star from board
      obj.remove();
      objects.splice(objects.indexOf(obj), 1);
      checkCompletion();
    });
    objects.push(obj);
    hiddenObjectArea.appendChild(obj);
  }
  updateLevelInfo();
  updateTimerDisplay();
  startTimer();
}

function checkCompletion() {
  if (objects.length === 0) {
    stopTimer();
    // Award coins equal to current level
    balance += level;
    updateBalanceDisplay();
    gameMessage.textContent = `Level ${level} complete! You earned ${level} coin${level !== 1 ? 's' : ''}. Starting next level...`;
    level++;
    setTimeout(() => {
      initGame();
    }, 2000);
  }
}

// Event listeners
connectWalletBtn.addEventListener('click', () => {
  alert('In the real system your crypto wallet would be connected. This is only a demo.');
});

startGameBtn.addEventListener('click', () => {
  level = 1;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateBalanceDisplay();
  initGame();
});

hintButton.addEventListener('click', () => {
  if (balance <= 0) {
    gameMessage.textContent = "You don't have enough coins for a hint.";
    return;
  }
  if (objects.length === 0) {
    gameMessage.textContent = 'There are no objects left to find.';
    return;
  }
  // Deduct one coin and update balance
  balance -= 1;
  updateBalanceDisplay();
  // Highlight one of the remaining objects
  const obj = objects[0];
  const originalColor = obj.style.color;
  obj.style.color = '#ffeb3b';
  obj.style.transform = 'scale(1.5)';
  setTimeout(() => {
    obj.style.color = originalColor;
    obj.style.transform = '';
  }, 1000);
});

resetButton.addEventListener('click', () => {
  // Reset to level 1, keep balance
  level = 1;
  initGame();
});

// Initialize balance display on page load
updateBalanceDisplay();
