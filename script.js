// A hidden object game with level progression and a crypto-like currency.
// In a real implementation, wallet integration and blockchain interactions would be required.

const startGameBtn = document.getElementById('start-game');
const connectWalletBtn = document.getElementById('connect-wallet');
const hintButton = document.getElementById('hint-button');
const resetButton = document.getElementById('reset-button');
const gameContainer = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const hiddenObjectArea = document.getElementById('hidden-object-area');
const balanceEl = document.getElementById('balance');
const gameMessage = document.getElementById('game-message');
const timerEl = document.getElementById('timer');

// Demo balance stored in localStorage (for persistence between sessions)
let balance = parseInt(localStorage.getItem('demoBalance') || '5', 10);
// Game state
let objects = [];
let level = 1;
let timeLeft = 0;
let timerInterval;

// Update the displayed balance
function updateBalance() {
  balanceEl.textContent = `Balance: ${balance} coins`;
  localStorage.setItem('demoBalance', balance.toString());
}

// Connect wallet (placeholder)
connectWalletBtn.addEventListener('click', () => {
  alert('In the real system your crypto wallet would be connected. This is only a demo.');
});

// Initialize a new game session for the current level
function initGame() {
  hiddenObjectArea.innerHTML = '';
  gameMessage.textContent = '';
  // Determine time based on level: start with 60s and decrease by 10s per level, minimum 20s
  timeLeft = Math.max(60 - (level - 1) * 10, 20);
  timerEl.textContent = `Time left: ${timeLeft}s`;
  objects = [];
  // Add objects: number increases with level (level + 2)
  for (let i = 0; i < level + 2; i++) {
    const obj = document.createElement('div');
    obj.className = 'object';
    obj.textContent = '★';
    obj.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    obj.style.top = Math.floor(Math.random() * 90 + 5) + '%';
    obj.addEventListener('click', () => {
      obj.style.display = 'none';
      objects.splice(objects.indexOf(obj), 1);
      checkCompletion();
    });
    objects.push(obj);
    hiddenObjectArea.appendChild(obj);
  }
  startTimer();
}

// Start the countdown timer
function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      timerEl.textContent = 'Time left: 0s';
      stopTimer();
      gameMessage.textContent = `Time's up! You reached level ${level}. Click Reset Game to try again.`;
      // disable objects from being clicked after time's up
      objects.forEach(obj => obj.style.pointerEvents = 'none');
      return;
    }
    timerEl.textContent = `Time left: ${timeLeft}s`;
  }, 1000);
}

// Stop the countdown timer
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Start game button handler
startGameBtn.addEventListener('click', () => {
  level = 1;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateBalance();
  initGame();
});

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
  updateBalance();
  const obj = objects[0];
  const originalColor = obj.style.color;
  obj.style.color = '#00ff00'; // highlight color
  setTimeout(() => {
    obj.style.color = originalColor;
  }, 1000);
});

// Reset game button handler
resetButton.addEventListener('click', () => {
  level = 1;
  stopTimer();
  updateBalance();
  initGame();
});

// Check if all objects are collected
function checkCompletion() {
  if (objects.length === 0) {
    stopTimer();
    // Award coins equal to level number
    balance += level;
    updateBalance();
    gameMessage.textContent = `Great job! You completed level ${level}. Awarded ${level} coin${level > 1 ? 's' : ''}. Starting next level...`;
    level++;
    setTimeout(() => {
      initGame();
    }, 2000);
  }
}

// Initial balance display on page load
updateBalance();
