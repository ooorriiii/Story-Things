// This script powers the most advanced version of the hidden object game.
// It builds upon previous iterations to include themes, difficulty modes,
// bombs, bonuses, time and life items, boss stars, achievements, pause/resume,
// dark mode, story interludes and a shop for power‑ups.

// Grab references to DOM elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const hiddenArea = document.getElementById('hidden-object-area');
const progressBar = document.getElementById('progress-bar');
const levelInfo = document.getElementById('level-info');
const coinsDisplay = document.getElementById('coins-display');
const livesInfo = document.getElementById('lives-info');
const highestInfo = document.getElementById('highest-info');
const gameMessage = document.getElementById('game-message');
const balanceDisplay = document.getElementById('balance-display');
const overlay = document.getElementById('overlay');
const storyPanel = document.getElementById('story-panel');
const storyTextEl = document.getElementById('story-text');
const storyContinueBtn = document.getElementById('story-continue');
const shopPanel = document.getElementById('shop-panel');
const shopItemsEl = document.getElementById('shop-items');
const shopContinueBtn = document.getElementById('shop-continue');
const achievementPanel = document.getElementById('achievement-panel');
const achievementTextEl = document.getElementById('achievement-text');
const achievementContinueBtn = document.getElementById('achievement-continue');

// Buttons
const connectWalletBtn = document.getElementById('connect-wallet');
const startGameBtn = document.getElementById('start-game');
const difficultySelect = document.getElementById('difficulty-select');
const themeSelect = document.getElementById('theme-select');
const hintBtn = document.getElementById('hint-button');
const revealBtn = document.getElementById('reveal-button');
const pauseBtn = document.getElementById('pause-button');
const darkModeBtn = document.getElementById('darkmode-button');
const resetBtn = document.getElementById('reset-button');

// Difficulty settings controlling initial time, star and bomb counts
const difficultySettings = {
  'Easy':    { time: 60, stars: 3, bombs: 1 },
  'Normal':  { time: 50, stars: 4, bombs: 2 },
  'Hard':    { time: 40, stars: 5, bombs: 3 }
};

// Theme definitions. Each theme defines icons and a background gradient for the play area.
const themes = {
  default: {
    object: '⭐',
    bonus: '💰',
    time: '⌛',
    life: '❤️',
    bomb: '💣',
    boss: '🌟',
    background: 'linear-gradient(180deg, #83a4d4 0%, #b6fbff 100%)'
  },
  time: {
    object: '🕰️',
    bonus: '📜',
    time: '⏳',
    life: '🔮',
    bomb: '⌛',
    boss: '🕰️',
    background: 'linear-gradient(180deg, #ffd89b 0%, #19547b 100%)'
  },
  underwater: {
    object: '🐚',
    bonus: '🦈',
    time: '🐠',
    life: '🐙',
    bomb: '💣',
    boss: '🐳',
    background: 'linear-gradient(180deg, #00c6fb 0%, #005bea 100%)'
  },
  dream: {
    object: '🌙',
    bonus: '🌟',
    time: '💤',
    life: '🦋',
    bomb: '☁️',
    boss: '🌈',
    background: 'linear-gradient(180deg, #e0c3fc 0%, #8ec5fc 100%)'
  },
  village: {
    object: '🏡',
    bonus: '🐔',
    time: '🌿',
    life: '🌾',
    bomb: '🚜',
    boss: '🌳',
    background: 'linear-gradient(180deg, #eaf2d7 0%, #d5ebba 100%)'
  }
};

// Stories shown at the start of selected levels to add a narrative flavour
const stories = [
  'You enter a mysterious realm where hidden objects hold the key to untold fortunes.',
  'Whispers of ancient secrets echo through the air as you venture deeper into the unknown.',
  'A surreal dream world unfolds before you, filled with curious relics and hidden dangers.',
  'The sound of waves guides you to an underwater kingdom where treasures glimmer beyond reach.',
  'In a quaint village, rumours of lost artefacts lure you into barns and fields full of surprises.',
  'Time bends as you travel through eras, searching for clues that bridge past and future.'
];

// Achievements definitions: when these milestones are reached, a notification will appear
const achievementDefs = [
  { id: 'level5',    condition: () => level >= 5,         message: 'Great! You reached level 5!' },
  { id: 'level10',   condition: () => level >= 10,        message: 'Impressive! Level 10 achieved!' },
  { id: 'level15',   condition: () => level >= 15,        message: 'Master explorer! Level 15!' },
  { id: 'coins50',   condition: () => coins >= 50,        message: 'You collected 50 coins!' },
  { id: 'coins100',  condition: () => coins >= 100,       message: 'Treasure hoarder! 100 coins!' },
  { id: 'coins200',  condition: () => coins >= 200,       message: 'Wealthy adventurer! 200 coins!' }
];

// Shop items available after each level
const shopItems = [
  {
    name: 'Shield',
    cost: 5,
    description: 'Ignore the next bomb explosion.',
    apply: () => { shieldActive = true; }
  },
  {
    name: 'Time Freeze',
    cost: 8,
    description: 'Freeze time for 5 seconds in the next level.',
    apply: () => { freezeCount++; }
  },
  {
    name: 'Double Coins',
    cost: 10,
    description: 'Double coin rewards in the next level.',
    apply: () => { doubleCoinsActive = true; }
  },
  {
    name: 'Reveal All',
    cost: 4,
    description: 'One-time reveal of all objects in the next level.',
    apply: () => { revealCount++; }
  },
  {
    name: 'Slow Bombs',
    cost: 6,
    description: 'Bombs move slower in the next level.',
    apply: () => { slowBombActive = true; }
  }
];

// Game state variables
let difficulty;
let theme;
let level;
let coins;
let lives;
let highestLevel;
let stars = [];
let bombs = [];
let bonusCoins = [];
let timeItems = [];
let lifeItems = [];
let bossStar = null;
let bossClicks = 0;
let timeLeft;
let totalTime;
let timerInterval;
let bombInterval;
let paused = false;
let darkMode = false;
let shieldActive = false;
let freezeCount = 0;
let freezeActive = false;
let doubleCoinsActive = false;
let revealCount = 0;
let slowBombActive = false;
let achievements = {};
let storyIndex = 0;

// Initialise achievements to false
achievementDefs.forEach(def => { achievements[def.id] = false; });

// Utility: pick a random position within the hidden area
function randomPosition() {
  const x = Math.random() * 90 + 5;
  const y = Math.random() * 90 + 5;
  return { left: x + '%', top: y + '%' };
}

// Update the score bar display
function updateScoreBar() {
  levelInfo.textContent = `Level: ${level}`;
  coinsDisplay.textContent = `Coins: ${coins}`;
  livesInfo.textContent = `Lives: ${lives}`;
  highestInfo.textContent = `Highest: ${highestLevel}`;
  balanceDisplay.textContent = `Balance: ${coins} coins`;
}

// Update the progress bar based on time left
function updateProgressBar() {
  const ratio = timeLeft / totalTime;
  progressBar.style.width = Math.max(0, ratio * 100) + '%';
  // Change color from green to red as time decreases
  if (ratio > 0.5) {
    progressBar.style.background = '#4caf50';
  } else if (ratio > 0.25) {
    progressBar.style.background = '#ff9800';
  } else {
    progressBar.style.background = '#f44336';
  }
}

// Show overlay with specific panel
function showOverlay(panel) {
  overlay.style.display = 'flex';
  // hide all panels first
  storyPanel.style.display = 'none';
  shopPanel.style.display = 'none';
  achievementPanel.style.display = 'none';
  if (panel === 'story') {
    storyPanel.style.display = 'block';
  } else if (panel === 'shop') {
    shopPanel.style.display = 'block';
  } else if (panel === 'achievement') {
    achievementPanel.style.display = 'block';
  }
  // Pause the game while overlay is active
  pauseGame(true);
}

// Hide overlay and resume game if appropriate
function hideOverlay() {
  overlay.style.display = 'none';
  // Only resume if the game is not globally paused via pause button
  if (!paused) {
    pauseGame(false);
  }
}

// Show a story message at the start of certain levels
function showStory() {
  const msg = stories[storyIndex % stories.length];
  storyIndex++;
  storyTextEl.textContent = msg;
  showOverlay('story');
}

// Populate and show the shop
function showShop() {
  // Clear previous items
  shopItemsEl.innerHTML = '';
  shopItems.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${item.name} (${item.cost} coins)`;
    const descSpan = document.createElement('span');
    descSpan.textContent = item.description;
    descSpan.style.fontSize = '0.8rem';
    descSpan.style.color = '#666';
    div.appendChild(nameSpan);
    div.appendChild(descSpan);
    div.addEventListener('click', () => {
      // Attempt to purchase
      if (coins >= item.cost) {
        coins -= item.cost;
        updateScoreBar();
        item.apply();
        div.style.opacity = '0.4';
        div.style.pointerEvents = 'none';
        gameMessage.textContent = `Purchased ${item.name}!`;
      } else {
        gameMessage.textContent = `Not enough coins for ${item.name}.`;
      }
    });
    shopItemsEl.appendChild(div);
  });
  showOverlay('shop');
}

// Show an achievement notification
function showAchievement(message) {
  achievementTextEl.textContent = message;
  showOverlay('achievement');
}

// Pause or resume game components
function pauseGame(state) {
  if (state) {
    // Pause timer
    if (timerInterval) clearInterval(timerInterval);
    // Pause bomb movement
    if (bombInterval) clearInterval(bombInterval);
  } else {
    // Resume timer if not freeze active
    if (timeLeft > 0) startTimer();
    // Resume bomb movement
    startBombMovement();
  }
}

// Start the countdown timer
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (freezeActive || paused) return;
    timeLeft--;
    updateProgressBar();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      // Lose a life when time runs out
      lives--;
      gameMessage.textContent = 'Time is up! You lost a life.';
      updateScoreBar();
      if (lives <= 0) {
        endGame('You ran out of lives!');
      } else {
        // Start a new level after short pause
        setTimeout(() => handleLevelEnd(), 1500);
      }
    }
  }, 1000);
}

// Freeze time for a duration (used by Time Freeze power)
function activateFreeze() {
  if (freezeCount > 0) {
    freezeCount--;
    freezeActive = true;
    gameMessage.textContent = 'Time frozen!';
    setTimeout(() => {
      freezeActive = false;
      gameMessage.textContent = '';
    }, 5000);
  }
}

// Start bomb movement interval
function startBombMovement() {
  if (bombInterval) clearInterval(bombInterval);
  bombInterval = setInterval(() => {
    if (paused || freezeActive) return;
    bombs.forEach(bombObj => {
      const { element, dx, dy } = bombObj;
      let rect = hiddenArea.getBoundingClientRect();
      let x = parseFloat(element.style.left);
      let y = parseFloat(element.style.top);
      // Adjust speed if slow bomb power is active
      const speedFactor = slowBombActive ? 0.5 : 1;
      let newX = x + dx * speedFactor;
      let newY = y + dy * speedFactor;
      // Bounce off walls
      if (newX < 0 || newX > 95) {
        bombObj.dx *= -1;
        newX = x + bombObj.dx * speedFactor;
      }
      if (newY < 0 || newY > 95) {
        bombObj.dy *= -1;
        newY = y + bombObj.dy * speedFactor;
      }
      element.style.left = newX + '%';
      element.style.top = newY + '%';
    });
  }, 50);
}

// Clear all game elements from the play area
function clearField() {
  hiddenArea.innerHTML = '';
  stars = [];
  bombs = [];
  bonusCoins = [];
  timeItems = [];
  lifeItems = [];
  bossStar = null;
  bossClicks = 0;
}

// Start a new game session
function initGame() {
  // Reset variables
  level = 1;
  coins = 5;
  lives = 3;
  highestLevel = 0;
  pauseBtn.textContent = 'Pause';
  paused = false;
  shieldActive = false;
  freezeCount = 0;
  freezeActive = false;
  doubleCoinsActive = false;
  revealCount = 0;
  slowBombActive = false;
  // Reset achievements
  achievementDefs.forEach(def => { achievements[def.id] = false; });
  storyIndex = 0;
  gameMessage.textContent = '';
  updateScoreBar();
  // Show start screen
  startScreen.style.display = 'block';
  gameScreen.style.display = 'none';
  clearField();
}

// Start the game using current selections
function startGame() {
  difficulty = difficultySelect.value;
  theme = themeSelect.value;
  coins = 5;
  lives = 3;
  level = 1;
  highestLevel = 0;
  shieldActive = false;
  freezeCount = 0;
  freezeActive = false;
  doubleCoinsActive = false;
  revealCount = 0;
  slowBombActive = false;
  storyIndex = 0;
  gameMessage.textContent = '';
  updateScoreBar();
  // Apply theme to play area background
  hiddenArea.style.background = themes[theme].background;
  // Hide start screen and show game screen
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  // Begin with a story interlude
  showStory();
}

// Set up a level: generate objects, bombs, bonus items
function setupLevel() {
  clearField();
  const diff = difficultySettings[difficulty];
  // Compute star and bomb counts by increasing difficulty as level grows
  const starCount = diff.stars + Math.floor((level - 1) / 2);
  const bombCount = diff.bombs + Math.floor(level / 2);
  totalTime = Math.max(20, diff.time - (level - 1) * 2);
  timeLeft = totalTime;
  updateProgressBar();
  // Create stars
  for (let i = 0; i < starCount; i++) {
    const obj = document.createElement('div');
    obj.className = 'object';
    obj.textContent = themes[theme].object;
    const pos = randomPosition();
    obj.style.left = pos.left;
    obj.style.top = pos.top;
    obj.addEventListener('click', () => handleObjectClick(obj));
    hiddenArea.appendChild(obj);
    stars.push(obj);
  }
  // Create bombs
  for (let i = 0; i < bombCount; i++) {
    const bombEl = document.createElement('div');
    bombEl.className = 'bomb';
    bombEl.textContent = themes[theme].bomb;
    const pos = randomPosition();
    bombEl.style.left = pos.left;
    bombEl.style.top = pos.top;
    // Random movement direction
    const dx = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random());
    const dy = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random());
    bombEl.addEventListener('click', () => handleBombClick(bombEl));
    hiddenArea.appendChild(bombEl);
    bombs.push({ element: bombEl, dx, dy });
  }
  // Possibly spawn a boss star every 5 levels
  if (level % 5 === 0) {
    const boss = document.createElement('div');
    boss.className = 'boss-star';
    boss.textContent = themes[theme].boss;
    const pos = randomPosition();
    boss.style.left = pos.left;
    boss.style.top = pos.top;
    bossClicks = 3;
    boss.addEventListener('click', () => {
      bossClicks--;
      boss.style.transform = `scale(${1 + (3 - bossClicks) * 0.1})`;
      if (bossClicks <= 0) {
        // Boss defeated
        hiddenArea.removeChild(boss);
        bossStar = null;
        coins += doubleCoinsActive ? 10 : 5;
        timeLeft += 10;
        gameMessage.textContent = 'You defeated the boss star! +5 coins, +10s';
        updateScoreBar();
        checkAchievements();
        checkLevelComplete();
      }
    });
    hiddenArea.appendChild(boss);
    bossStar = boss;
  }
  // 50% chance to spawn a bonus coin
  if (Math.random() < 0.5) {
    const bonus = document.createElement('div');
    bonus.className = 'bonus';
    bonus.textContent = themes[theme].bonus;
    const pos = randomPosition();
    bonus.style.left = pos.left;
    bonus.style.top = pos.top;
    bonus.addEventListener('click', () => {
      hiddenArea.removeChild(bonus);
      coins += 2;
      gameMessage.textContent = 'Bonus coin collected! +2 coins';
      updateScoreBar();
      checkAchievements();
    });
    hiddenArea.appendChild(bonus);
    bonusCoins.push(bonus);
  }
  // 40% chance to spawn a time extension item
  if (Math.random() < 0.4) {
    const timeItem = document.createElement('div');
    timeItem.className = 'time-item';
    timeItem.textContent = themes[theme].time;
    const pos = randomPosition();
    timeItem.style.left = pos.left;
    timeItem.style.top = pos.top;
    timeItem.addEventListener('click', () => {
      hiddenArea.removeChild(timeItem);
      timeLeft += 10;
      totalTime += 10;
      gameMessage.textContent = 'Extra time! +10 seconds';
      updateProgressBar();
    });
    hiddenArea.appendChild(timeItem);
    timeItems.push(timeItem);
  }
  // 40% chance to spawn a life item
  if (Math.random() < 0.4) {
    const lifeItem = document.createElement('div');
    lifeItem.className = 'life-item';
    lifeItem.textContent = themes[theme].life;
    const pos = randomPosition();
    lifeItem.style.left = pos.left;
    lifeItem.style.top = pos.top;
    lifeItem.addEventListener('click', () => {
      hiddenArea.removeChild(lifeItem);
      lives++;
      gameMessage.textContent = 'Extra life gained!';
      updateScoreBar();
    });
    hiddenArea.appendChild(lifeItem);
    lifeItems.push(lifeItem);
  }
  // Activate Freeze if purchased
  if (freezeCount > 0) {
    activateFreeze();
  }
  // Start timer and bomb movement
  startTimer();
  startBombMovement();
}

// Handle clicking a regular object
function handleObjectClick(obj) {
  // Remove from DOM and list
  hiddenArea.removeChild(obj);
  stars = stars.filter(o => o !== obj);
  // Add coins; double coins if power active
  coins += doubleCoinsActive ? 2 : 1;
  gameMessage.textContent = doubleCoinsActive ? 'Object collected! +2 coins' : 'Object collected! +1 coin';
  updateScoreBar();
  checkAchievements();
  checkLevelComplete();
}

// Handle bomb click
function handleBombClick(bombEl) {
  // Remove bomb
  hiddenArea.removeChild(bombEl);
  bombs = bombs.filter(b => b.element !== bombEl);
  if (shieldActive) {
    shieldActive = false;
    gameMessage.textContent = 'Shield protected you from a bomb!';
  } else {
    lives--;
    timeLeft = Math.max(0, timeLeft - 5);
    gameMessage.textContent = 'Bomb hit! -1 life, -5s';
    updateScoreBar();
    if (lives <= 0) {
      endGame('A bomb ended your adventure.');
      return;
    }
  }
  updateProgressBar();
}

// Check if level is complete
function checkLevelComplete() {
  if (stars.length === 0 && (!bossStar || bossClicks <= 0)) {
    // Level finished
    clearInterval(timerInterval);
    clearInterval(bombInterval);
    // Award bonus for leftover time
    const timeBonus = Math.floor(timeLeft / 5);
    const reward = timeBonus + (doubleCoinsActive ? 2 : 1); // minimal reward for finishing level
    coins += reward;
    gameMessage.textContent = `Level complete! +${reward} coins`;
    if (level > highestLevel) highestLevel = level;
    updateScoreBar();
    checkAchievements();
    // Reset per-level powers
    doubleCoinsActive = false;
    slowBombActive = false;
    // Proceed to shop unless player has no lives
    if (lives > 0) {
      setTimeout(() => showShop(), 1500);
    } else {
      endGame('You finished the level but have no lives left.');
    }
  }
}

// Apply achievements if conditions met
function checkAchievements() {
  for (const def of achievementDefs) {
    if (!achievements[def.id] && def.condition()) {
      achievements[def.id] = true;
      showAchievement(def.message);
      return; // show one achievement at a time
    }
  }
}

// End the game and return to start screen
function endGame(message) {
  clearInterval(timerInterval);
  clearInterval(bombInterval);
  gameMessage.textContent = message;
  // Delay before resetting
  setTimeout(() => {
    initGame();
  }, 3000);
}

// Handler for when player leaves shop to continue to next level
function proceedToNextLevel() {
  level++;
  if (lives <= 0) {
    endGame('Game over!');
    return;
  }
  // Story at every third level
  if ((level - 1) % 3 === 0) {
    showStory();
  } else {
    setupLevel();
  }
}

// Event listeners
connectWalletBtn.addEventListener('click', () => {
  alert('In a real implementation this would connect your crypto wallet.');
});

startGameBtn.addEventListener('click', startGame);

storyContinueBtn.addEventListener('click', () => {
  hideOverlay();
  setupLevel();
});

shopContinueBtn.addEventListener('click', () => {
  hideOverlay();
  proceedToNextLevel();
});

achievementContinueBtn.addEventListener('click', () => {
  hideOverlay();
  // Continue the current flow: if level completed, wait for shop or next; otherwise resume game
  if (stars.length === 0 && (!bossStar || bossClicks <= 0)) {
    // Already finished level; shop will show automatically after achievements
    setTimeout(() => showShop(), 500);
  } else if (lives <= 0) {
    endGame('Game over!');
  }
});

hintBtn.addEventListener('click', () => {
  if (paused || overlay.style.display === 'flex') return;
  if (coins < 1) {
    gameMessage.textContent = "You don't have enough coins for a hint.";
    return;
  }
  if (stars.length === 0) {
    gameMessage.textContent = 'There are no objects left to reveal.';
    return;
  }
  coins -= 1;
  updateScoreBar();
  // Highlight the first star temporarily
  const star = stars[0];
  const originalColor = star.style.color;
  star.style.color = '#00e676';
  setTimeout(() => {
    star.style.color = originalColor;
  }, 1000);
});

revealBtn.addEventListener('click', () => {
  if (paused || overlay.style.display === 'flex') return;
  if (coins < 3) {
    gameMessage.textContent = "You don't have enough coins for reveal.";
    return;
  }
  if (stars.length === 0) {
    gameMessage.textContent = 'There are no objects left to reveal.';
    return;
  }
  coins -= 3;
  updateScoreBar();
  // Reveal all stars
  const originalColors = stars.map(s => s.style.color);
  stars.forEach(s => { s.style.color = '#00e676'; });
  setTimeout(() => {
    stars.forEach((s, idx) => { s.style.color = originalColors[idx]; });
  }, 2000);
});

pauseBtn.addEventListener('click', () => {
  if (overlay.style.display === 'flex') return; // cannot pause during overlay
  paused = !paused;
  if (paused) {
    pauseBtn.textContent = 'Resume';
    pauseGame(true);
  } else {
    pauseBtn.textContent = 'Pause';
    pauseGame(false);
  }
});

darkModeBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.classList.toggle('dark-mode', darkMode);
  darkModeBtn.textContent = darkMode ? 'Light Mode' : 'Dark Mode';
});

resetBtn.addEventListener('click', () => {
  initGame();
});

// Initialize the game on load
initGame();
