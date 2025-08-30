// Master version of the hidden object game.
// Includes difficulty levels, moving bombs, bonus coins, time and life pickups,
// boss stars every 5th level, achievements, pause/resume, and dark mode.

// Grab DOM elements
const startGameBtn = document.getElementById('start-game');
const connectWalletBtn = document.getElementById('connect-wallet');
const hintButton = document.getElementById('hint-button');
const revealButton = document.getElementById('reveal-button');
const pauseButton = document.getElementById('pause-button');
const darkButton = document.getElementById('dark-button');
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
const achievementMsg = document.getElementById('achievement-message');

// Persistent values stored in localStorage
let balance = parseInt(localStorage.getItem('demoBalance') || '5', 10);
let maxLevel = parseInt(localStorage.getItem('maxLevel') || '0', 10);

// Game state
let level = 1;
let lives = 3;
let objects = [];
let bombs = [];
let bonuses = [];
let timeItems = [];
let lifeItems = [];
let bossStar = null;
let timeLeft = 0;
let totalTime = 0;
let timerInterval;
let moveInterval;
let difficulty = 'normal';
let isPaused = false;

// Achievement tracking
const achievements = {
  level5: false,
  level10: false,
  level15: false,
  coins50: false,
  coins100: false,
  coins200: false
};

// Difficulty parameters
const difficultySettings = {
  easy:   { baseTime: 75, timeDec: 10, bombsFactor: 0.3, starsOffset: 2 },
  normal: { baseTime: 60, timeDec: 8,  bombsFactor: 0.5, starsOffset: 2 },
  hard:   { baseTime: 50, timeDec: 6,  bombsFactor: 1.0, starsOffset: 3 }
};

// UI update functions
function updateBalanceDisplay() {
  localStorage.setItem('demoBalance', balance.toString());
  balanceEl.textContent = `Balance: ${balance} coins`;
  coinDisplay.textContent = `Coins: ${balance}`;
}
function updateInfo() {
  levelInfo.textContent = `Level: ${level}`;
  livesInfo.textContent = `Lives: ${lives}`;
  scoreInfo.textContent = `Highest level: ${maxLevel}`;
}
function updateTimerDisplay() {
  timerEl.textContent = `Time left: ${timeLeft}s`;
}
function updateProgressBar(fraction) {
  progressBar.style.width = `${fraction * 100}%`;
  // Colour transitions from green to red
  const startColor = [76,175,80];
  const endColor = [244,67,54];
  const r = Math.round(startColor[0] + (1 - fraction) * (endColor[0] - startColor[0]));
  const g = Math.round(startColor[1] + (1 - fraction) * (endColor[1] - startColor[1]));
  const b = Math.round(startColor[2] + (1 - fraction) * (endColor[2] - startColor[2]));
  progressBar.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

// Wallet placeholder
function connectWallet() {
  alert('In the real system your crypto wallet would be connected. This is only a demo.');
}

// Sparkle effect on star collection
function createSparkle(x, y) {
  for (let i = 0; i < 8; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 30 + 10;
    spark.style.left = `${x + Math.cos(angle) * dist - 4}px`;
    spark.style.top  = `${y + Math.sin(angle) * dist - 4}px`;
    hiddenObjectArea.appendChild(spark);
    setTimeout(() => spark.remove(), 600);
  }
}

// Timer control
function startTimer() {
  stopTimer();
  updateTimerDisplay();
  updateProgressBar(1);
  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeLeft--;
      if (timeLeft <= 0) {
        timeLeft = 0;
        updateTimerDisplay();
        updateProgressBar(0);
        stopTimer();
        gameMessage.textContent = `Time's up! You reached level ${level}. Click Reset Game to try again.`;
        disableAll();
        return;
      }
      updateTimerDisplay();
      updateProgressBar(timeLeft / totalTime);
    }
  }, 1000);
}
function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  if (moveInterval) clearInterval(moveInterval);
  moveInterval = null;
}

function disableAll() {
  objects.forEach(obj => obj.style.pointerEvents = 'none');
  bombs.forEach(b => b.style.pointerEvents = 'none');
  bonuses.forEach(b => b.style.pointerEvents = 'none');
  timeItems.forEach(t => t.style.pointerEvents = 'none');
  lifeItems.forEach(l => l.style.pointerEvents = 'none');
  if (bossStar) bossStar.style.pointerEvents = 'none';
  hintButton.disabled = true;
  revealButton.disabled = true;
  pauseButton.disabled = true;
}

// Pause/resume functionality
function togglePause() {
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
  gameMessage.textContent = isPaused ? 'Game paused.' : '';
}

// Dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  darkButton.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
}

// Achievements display
function showAchievement(message) {
  achievementMsg.textContent = message;
  achievementMsg.style.display = 'block';
  setTimeout(() => {
    achievementMsg.style.display = 'none';
  }, 3000);
}

// Initialize a level
function initLevel() {
  hiddenObjectArea.innerHTML = '';
  gameMessage.textContent = '';
  objects = [];
  bombs = [];
  bonuses = [];
  timeItems = [];
  lifeItems = [];
  bossStar = null;
  const settings = difficultySettings[difficulty];
  totalTime = Math.max(settings.baseTime - (level - 1) * settings.timeDec, 15);
  timeLeft = totalTime;
  updateTimerDisplay();
  updateProgressBar(1);
  updateInfo();
  // dynamic background
  const backgrounds = [
    'linear-gradient(180deg, #83a4d4 0%, #b6fbff 100%)',
    'linear-gradient(180deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(180deg, #f8ffae 0%, #43c6ac 100%)'
  ];
  hiddenObjectArea.style.background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  // spawn stars
  const numStars = level + settings.starsOffset;
  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'object';
    star.textContent = '★';
    star.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    star.style.top  = Math.floor(Math.random() * 80 + 10) + '%';
    star.addEventListener('click', (e) => {
      if (isPaused) return;
      const rect = hiddenObjectArea.getBoundingClientRect();
      createSparkle(e.clientX - rect.left, e.clientY - rect.top);
      star.remove();
      objects.splice(objects.indexOf(star), 1);
      checkCompletion();
    });
    objects.push(star);
    hiddenObjectArea.appendChild(star);
  }
  // spawn bombs
  const numBombs = Math.max(1, Math.floor(level * settings.bombsFactor));
  for (let i = 0; i < numBombs; i++) {
    const bomb = document.createElement('div');
    bomb.className = 'bomb';
    bomb.textContent = '💣';
    bomb.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    bomb.style.top  = Math.floor(Math.random() * 80 + 10) + '%';
    bomb.dataset.vx = (Math.random() * 0.6 + 0.2).toString();
    bomb.dataset.vy = (Math.random() * 0.6 + 0.2).toString();
    bomb.addEventListener('click', () => handleBombClick(bomb));
    bombs.push(bomb);
    hiddenObjectArea.appendChild(bomb);
  }
  // spawn bonus coin (50%)
  if (Math.random() < 0.5) {
    const bonus = document.createElement('div');
    bonus.className = 'bonus';
    bonus.textContent = '💰';
    bonus.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    bonus.style.top  = Math.floor(Math.random() * 80 + 10) + '%';
    bonus.addEventListener('click', () => {
      if (isPaused) return;
      bonus.remove();
      bonuses.splice(bonuses.indexOf(bonus), 1);
      balance += 2;
      updateBalanceDisplay();
      gameMessage.textContent = 'Bonus! +2 coins';
    });
    bonuses.push(bonus);
    hiddenObjectArea.appendChild(bonus);
  }
  // spawn time item (40%)
  if (Math.random() < 0.4) {
    const timeItem = document.createElement('div');
    timeItem.className = 'time-item';
    timeItem.textContent = '⏱';
    timeItem.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    timeItem.style.top  = Math.floor(Math.random() * 80 + 10) + '%';
    timeItem.addEventListener('click', () => {
      if (isPaused) return;
      timeItem.remove();
      timeItems.splice(timeItems.indexOf(timeItem), 1);
      timeLeft += 10;
      totalTime += 10;
      updateTimerDisplay();
      updateProgressBar(timeLeft / totalTime);
      gameMessage.textContent = '+10s time!';
    });
    timeItems.push(timeItem);
    hiddenObjectArea.appendChild(timeItem);
  }
  // spawn life item (40%)
  if (Math.random() < 0.4) {
    const lifeItem = document.createElement('div');
    lifeItem.className = 'life-item';
    lifeItem.textContent = '❤️';
    lifeItem.style.left = Math.floor(Math.random() * 90 + 5) + '%';
    lifeItem.style.top  = Math.floor(Math.random() * 80 + 10) + '%';
    lifeItem.addEventListener('click', () => {
      if (isPaused) return;
      lifeItem.remove();
      lifeItems.splice(lifeItems.indexOf(lifeItem), 1);
      lives += 1;
      updateInfo();
      gameMessage.textContent = '+1 life!';
    });
    lifeItems.push(lifeItem);
    hiddenObjectArea.appendChild(lifeItem);
  }
  // spawn boss star every 5th level
  if (level % 5 === 0) {
    const boss = document.createElement('div');
    boss.className = 'boss-star';
    boss.textContent = '⭐';
    boss.dataset.health = '3';
    boss.style.left = Math.floor(Math.random() * 80 + 10) + '%';
    boss.style.top  = Math.floor(Math.random() * 70 + 15) + '%';
    boss.addEventListener('click', () => {
      if (isPaused) return;
      let h = parseInt(boss.dataset.health);
      h--;
      boss.dataset.health = h.toString();
      // change colour to reflect damage
      if (h === 2) boss.style.color = '#ffa726';
      if (h === 1) boss.style.color = '#ff7043';
      if (h <= 0) {
        // boss defeated
        boss.remove();
        bossStar = null;
        balance += 5;
        timeLeft += 10;
        totalTime += 10;
        updateBalanceDisplay();
        updateTimerDisplay();
        updateProgressBar(timeLeft / totalTime);
        gameMessage.textContent = 'Boss defeated! +5 coins, +10s time.';
      }
    });
    bossStar = boss;
    hiddenObjectArea.appendChild(boss);
  }
  // start timers
  startTimer();
  moveBombs();
  // enable controls
  hintButton.disabled = false;
  revealButton.disabled = false;
  pauseButton.disabled = false;
}

// Move bombs (and other animated items) continuously
function moveBombs() {
  moveInterval = setInterval(() => {
    if (isPaused) return;
    bombs.forEach(bomb => {
      let vx = parseFloat(bomb.dataset.vx);
      let vy = parseFloat(bomb.dataset.vy);
      let x = parseFloat(bomb.style.left);
      let y = parseFloat(bomb.style.top);
      x += vx;
      y += vy;
      if (x < 0 || x > 95) {
        vx = -vx;
        bomb.dataset.vx = vx.toString();
      }
      if (y < 10 || y > 85) {
        vy = -vy;
        bomb.dataset.vy = vy.toString();
      }
      x = Math.max(0, Math.min(95, x));
      y = Math.max(10, Math.min(85, y));
      bomb.style.left = `${x}%`;
      bomb.style.top  = `${y}%`;
    });
  }, 60);
}

// Bomb click handler
function handleBombClick(bomb) {
  if (isPaused) return;
  bomb.remove();
  bombs.splice(bombs.indexOf(bomb), 1);
  lives--;
  if (lives < 0) lives = 0;
  timeLeft = Math.max(0, timeLeft - 5);
  updateInfo();
  updateTimerDisplay();
  updateProgressBar(timeLeft / totalTime);
  if (lives <= 0) {
    stopTimer();
    gameMessage.textContent = `Game over! You lost all lives. You reached level ${level}. Click Reset Game to try again.`;
    disableAll();
    return;
  }
  if (timeLeft === 0) {
    stopTimer();
    gameMessage.textContent = `Time's up! You reached level ${level}. Click Reset Game to try again.`;
    disableAll();
    return;
  }
}

// Button handlers
startGameBtn.addEventListener('click', () => {
  level = 1;
  lives = 3;
  difficulty = difficultySelect.value;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateBalanceDisplay();
  updateInfo();
  isPaused = false;
  pauseButton.textContent = 'Pause';
  initLevel();
});

connectWalletBtn.addEventListener('click', connectWallet);

hintButton.addEventListener('click', () => {
  if (isPaused) return;
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
  const orig = obj.style.color;
  obj.style.color = '#00ff00';
  setTimeout(() => {
    obj.style.color = orig;
  }, 800);
});

revealButton.addEventListener('click', () => {
  if (isPaused) return;
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
    obj.dataset.origColor = obj.style.color;
    obj.style.color = '#00ff00';
  });
  setTimeout(() => {
    objects.forEach(obj => {
      obj.style.color = obj.dataset.origColor;
    });
  }, 2000);
});

pauseButton.addEventListener('click', togglePause);

darkButton.addEventListener('click', toggleDarkMode);

resetButton.addEventListener('click', () => {
  level = 1;
  lives = 3;
  isPaused = false;
  pauseButton.textContent = 'Pause';
  stopTimer();
  updateBalanceDisplay();
  updateInfo();
  initLevel();
});

// Check if all objects collected
function checkCompletion() {
  if (objects.length === 0 && (!bossStar || !bossStar.parentElement)) {
    stopTimer();
    // Award coins equal to level
    balance += level;
    updateBalanceDisplay();
    gameMessage.textContent = `Great job! You completed level ${level}. Awarded ${level} coin${level > 1 ? 's' : ''}. Starting next level...`;
    // Update max level
    if (level > maxLevel) {
      maxLevel = level;
      localStorage.setItem('maxLevel', maxLevel.toString());
    }
    // Achievement checks
    if (level >= 5 && !achievements.level5) {
      achievements.level5 = true;
      showAchievement('Achievement unlocked: Reached level 5!');
    }
    if (level >= 10 && !achievements.level10) {
      achievements.level10 = true;
      showAchievement('Achievement unlocked: Reached level 10!');
    }
    if (level >= 15 && !achievements.level15) {
      achievements.level15 = true;
      showAchievement('Achievement unlocked: Reached level 15!');
    }
    if (balance >= 50 && !achievements.coins50) {
      achievements.coins50 = true;
      showAchievement('Achievement unlocked: Collected 50 coins!');
    }
    if (balance >= 100 && !achievements.coins100) {
      achievements.coins100 = true;
      showAchievement('Achievement unlocked: Collected 100 coins!');
    }
    if (balance >= 200 && !achievements.coins200) {
      achievements.coins200 = true;
      showAchievement('Achievement unlocked: Collected 200 coins!');
    }
    level++;
    updateInfo();
    setTimeout(() => initLevel(), 2000);
  }
}

// Initialise displays on page load
updateBalanceDisplay();
updateInfo();
