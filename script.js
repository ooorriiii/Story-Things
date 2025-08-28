// A simple demo of a hidden object game with a crypto-like currency.
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

// Demo balance stored in localStorage (for persistence between sessions)
let balance = parseInt(localStorage.getItem('demoBalance') || '5', 10);
let objects = [];

// Update the displayed balance
function updateBalance() {
  balanceEl.textContent = `Balance: ${balance} coins`;
  localStorage.setItem('demoBalance', balance.toString());
}

// Connect wallet (placeholder)
connectWalletBtn.addEventListener('click', () => {
  alert('Wallet connection in a real system. This is just a demo.');
});

// Initialize a new game session
function initGame() {
  // Clear previous state
  hiddenObjectArea.innerHTML = '';
  gameMessage.textContent = '';
  objects = [];
  // Create three objects at random positions
  for (let i = 0; i < 3; i++) {
    const obj = document.createElement('div');
    obj.className = 'object';
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
}

// Start game button
startGameBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  initGame();
});

// Hint button: reveals the location of one remaining object at the cost of 1 coin
hintButton.addEventListener('click', () => {
  if (balance <= 0) {
    gameMessage.textContent = 'You do not have enough coins for a hint.';
    return;
  }
  if (objects.length === 0) {
    gameMessage.textContent = 'There are no objects to find.';
    return;
  }
  balance -= 1;
  updateBalance();
  // Highlight the first remaining object by flashing it
  const obj = objects[0];
  obj.style.backgroundColor = 'yellow';
  setTimeout(() => {
    obj.style.backgroundColor = 'red';
  }, 1000);
});

// Reset game button
resetButton.addEventListener('click', () => {
  initGame();
});

// Check if all objects are collected
function checkCompletion() {
  if (objects.length === 0) {
    gameMessage.textContent = 'Great job! You found all the objects.';
  }
}

// Initial balance display on page load
updateBalance();
