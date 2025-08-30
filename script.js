// Ultimate game script with sound, animations and extra graphics.
// This file extends the previous audio version by adding explosion effects,
// coin fly animations, a gentle particle background, and persistent best scores.

// Audio context and helper functions for sounds (same as script_audio.js)
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContextClass();
function playTone(freq, duration) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = 'sine';
  oscillator.frequency.value = freq;
  const now = audioCtx.currentTime;
  oscillator.start(now);
  gainNode.gain.setValueAtTime(0.1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.stop(now + duration);
}
function playCollect() { playTone(850, 0.15); }
function playBonus() { playTone(1000, 0.2); }
function playTimeSound() { playTone(600, 0.25); }
function playLifeSound() { playTone(400, 0.25); }
function playBombSound() { playTone(150, 0.3); }
function playBossDefeat() { playTone(350, 0.5); }
function playPurchase() { playTone(500, 0.2); }
function playAchievementSound() { playTone(700, 0.4); }
function playStorySound() { playTone(900, 0.15); }

// DOM references
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
const bestStatsEl = document.getElementById('best-stats');
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

// Difficulty settings
const difficultySettings = {
  'Easy':   { time: 60, stars: 3, bombs: 1 },
  'Normal': { time: 50, stars: 4, bombs: 2 },
  'Hard':   { time: 40, stars: 5, bombs: 3 }
};

// Themes with icons and backgrounds
const themes = {
  default: {
    object: '⭐', bonus: '💰', time: '⌛', life: '❤️', bomb: '💣', boss: '🌟',
    background: 'linear-gradient(180deg, #83a4d4 0%, #b6fbff 100%)'
  },
  time: {
    object: '🕰️', bonus: '📜', time: '⏳', life: '🔮', bomb: '⌛', boss: '🕰️',
    background: 'linear-gradient(180deg, #ffd89b 0%, #19547b 100%)'
  },
  underwater: {
    object: '🐚', bonus: '🦈', time: '🐠', life: '🐙', bomb: '💣', boss: '🐳',
    background: 'linear-gradient(180deg, #00c6fb 0%, #005bea 100%)'
  },
  dream: {
    object: '🌙', bonus: '🌟', time: '💤', life: '🦋', bomb: '☁️', boss: '🌈',
    background: 'linear-gradient(180deg, #e0c3fc 0%, #8ec5fc 100%)'
  },
  village: {
    object: '🏡', bonus: '🐔', time: '🌿', life: '🌾', bomb: '🚜', boss: '🌳',
    background: 'linear-gradient(180deg, #eaf2d7 0%, #d5ebba 100%)'
  }
};

// Stories for narrative
const stories = [
  'You enter a mysterious realm where hidden objects hold the key to untold fortunes.',
  'Whispers of ancient secrets echo through the air as you venture deeper into the unknown.',
  'A surreal dream world unfolds before you, filled with curious relics and hidden dangers.',
  'The sound of waves guides you to an underwater kingdom where treasures glimmer beyond reach.',
  'In a quaint village, rumours of lost artefacts lure you into barns and fields full of surprises.',
  'Time bends as you travel through eras, searching for clues that bridge past and future.'
];

// Achievements
const achievementDefs = [
  { id: 'level5',    condition: () => level >= 5,         message: 'Great! You reached level 5!' },
  { id: 'level10',   condition: () => level >= 10,        message: 'Impressive! Level 10 achieved!' },
  { id: 'level15',   condition: () => level >= 15,        message: 'Master explorer! Level 15!' },
  { id: 'coins50',   condition: () => coins >= 50,        message: 'You collected 50 coins!' },
  { id: 'coins100',  condition: () => coins >= 100,       message: 'Treasure hoarder! 100 coins!' },
  { id: 'coins200',  condition: () => coins >= 200,       message: 'Wealthy adventurer! 200 coins!' }
];

// Shop items
const shopItems = [
  { name: 'Shield', cost: 5, description: 'Ignore the next bomb explosion.', apply: () => { shieldActive = true; } },
  { name: 'Time Freeze', cost: 8, description: 'Freeze time for 5 seconds in the next level.', apply: () => { freezeCount++; } },
  { name: 'Double Coins', cost: 10, description: 'Double coin rewards in the next level.', apply: () => { doubleCoinsActive = true; } },
  { name: 'Reveal All', cost: 4, description: 'One-time reveal of all objects in the next level.', apply: () => { revealCount++; } },
  { name: 'Slow Bombs', cost: 6, description: 'Bombs move slower in the next level.', apply: () => { slowBombActive = true; } }
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
let bonusCoinsArr = [];
let timeItems = [];
let lifeItems = [];
let bossStar = null;
let bossClicks = 0;
let timeLeft;
let totalTime;
let timerInterval;
let bombInterval;
let particleInterval;
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
let bestLevel = 0;
let bestCoins = 0;

// Initialize achievements flags
achievementDefs.forEach(def => { achievements[def.id] = false; });

// Utility to pick random position
function randomPosition() {
  const x = Math.random() * 90 + 5;
  const y = Math.random() * 90 + 5;
  return { left: x + '%', top: y + '%' };
}

// Update score bar and best stats
function updateScoreBar() {
  levelInfo.textContent = `Level: ${level}`;
  coinsDisplay.textContent = `Coins: ${coins}`;
  livesInfo.textContent = `Lives: ${lives}`;
  highestInfo.textContent = `Highest: ${highestLevel}`;
  balanceDisplay.textContent = `Balance: ${coins} coins`;
  // Update best stats display
  bestStatsEl.textContent = `Best Level: ${bestLevel} | Best Coins: ${bestCoins}`;
}

// Update progress bar
function updateProgressBar() {
  const ratio = timeLeft / totalTime;
  progressBar.style.width = Math.max(0, ratio * 100) + '%';
  if (ratio > 0.5) progressBar.style.background = '#4caf50';
  else if (ratio > 0.25) progressBar.style.background = '#ff9800';
  else progressBar.style.background = '#f44336';
}

// Create an explosion at screen coordinates x,y
function createExplosion(pageX, pageY) {
  const explosion = document.createElement('div');
  explosion.className = 'explosion';
  explosion.style.left = pageX - 20 + 'px';
  explosion.style.top = pageY - 20 + 'px';
  document.body.appendChild(explosion);
  setTimeout(() => explosion.remove(), 600);
}

// Animate a coin flying from start coordinates to the coins display
function animateCoinToScore(pageX, pageY) {
  const coin = document.createElement('div');
  coin.className = 'coin-fly';
  // Use bonus icon for flying coin
  coin.textContent = themes[theme].bonus;
  coin.style.left = pageX + 'px';
  coin.style.top = pageY + 'px';
  document.body.appendChild(coin);
  const targetRect = coinsDisplay.getBoundingClientRect();
  const dx = targetRect.left + targetRect.width / 2 - pageX;
  const dy = targetRect.top + targetRect.height / 2 - pageY;
  // trigger the transition
  requestAnimationFrame(() => {
    coin.style.transform = `translate(${dx}px, ${dy}px)`;
    coin.style.opacity = '0';
  });
  setTimeout(() => coin.remove(), 700);
}

// Spawn a decorative particle falling down the play area
function spawnParticle() {
  const particle = document.createElement('div');
  particle.className = 'particle';
  // Random color for variation
  const colors = ['#ffeb3b', '#ff9800', '#00bcd4', '#8bc34a', '#e91e63'];
  particle.style.background = colors[Math.floor(Math.random() * colors.length)];
  const startX = Math.random() * hiddenArea.clientWidth;
  particle.style.left = startX + 'px';
  particle.style.top = '-10px';
  hiddenArea.appendChild(particle);
  // Compute movement distance
  const distance = hiddenArea.clientHeight + 20;
  requestAnimationFrame(() => {
    particle.style.transform = `translateY(${distance}px)`;
    particle.style.opacity = '0';
  });
  setTimeout(() => {
    if (particle.parentNode) particle.remove();
  }, 4000);
}

function startParticles() {
  if (particleInterval) clearInterval(particleInterval);
  particleInterval = setInterval(spawnParticle, 500);
}

function stopParticles() {
  if (particleInterval) clearInterval(particleInterval);
}

// Show overlay panel
function showOverlay(panel) {
  overlay.style.display = 'flex';
  storyPanel.style.display = 'none';
  shopPanel.style.display = 'none';
  achievementPanel.style.display = 'none';
  if (panel === 'story') storyPanel.style.display = 'block';
  else if (panel === 'shop') shopPanel.style.display = 'block';
  else if (panel === 'achievement') achievementPanel.style.display = 'block';
  pauseGame(true);
}

function hideOverlay() {
  overlay.style.display = 'none';
  if (!paused) pauseGame(false);
}

function showStory() {
  const msg = stories[storyIndex % stories.length];
  storyIndex++;
  storyTextEl.textContent = msg;
  playStorySound();
  showOverlay('story');
}

function showShop() {
  shopItemsEl.innerHTML = '';
  shopItems.forEach(item => {
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
      if (coins >= item.cost) {
        coins -= item.cost;
        updateScoreBar();
        item.apply();
        div.style.opacity = '0.4';
        div.style.pointerEvents = 'none';
        gameMessage.textContent = `Purchased ${item.name}!`;
        playPurchase();
      } else {
        gameMessage.textContent = `Not enough coins for ${item.name}.`;
      }
    });
    shopItemsEl.appendChild(div);
  });
  showOverlay('shop');
}

function showAchievement(message) {
  achievementTextEl.textContent = message;
  playAchievementSound();
  showOverlay('achievement');
}

function pauseGame(state) {
  if (state) {
    if (timerInterval) clearInterval(timerInterval);
    if (bombInterval) clearInterval(bombInterval);
  } else {
    if (timeLeft > 0) startTimer();
    startBombMovement();
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (freezeActive || paused) return;
    timeLeft--;
    updateProgressBar();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      lives--;
      gameMessage.textContent = 'Time is up! You lost a life.';
      playBombSound();
      updateScoreBar();
      if (lives <= 0) {
        endGame('You ran out of lives!');
      } else {
        setTimeout(() => handleLevelEnd(), 1500);
      }
    }
  }, 1000);
}

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

function startBombMovement() {
  if (bombInterval) clearInterval(bombInterval);
  bombInterval = setInterval(() => {
    if (paused || freezeActive) return;
    bombs.forEach(bombObj => {
      const el = bombObj.element;
      let x = parseFloat(el.style.left);
      let y = parseFloat(el.style.top);
      const factor = slowBombActive ? 0.5 : 1;
      let newX = x + bombObj.dx * factor;
      let newY = y + bombObj.dy * factor;
      if (newX < 0 || newX > 95) {
        bombObj.dx *= -1;
        newX = x + bombObj.dx * factor;
      }
      if (newY < 0 || newY > 95) {
        bombObj.dy *= -1;
        newY = y + bombObj.dy * factor;
      }
      el.style.left = newX + '%';
      el.style.top = newY + '%';
    });
  }, 50);
}

function clearField() {
  hiddenArea.innerHTML = '';
  stars = [];
  bombs = [];
  bonusCoinsArr = [];
  timeItems = [];
  lifeItems = [];
  bossStar = null;
  bossClicks = 0;
  stopParticles();
}

function initGame() {
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
  achievementDefs.forEach(def => { achievements[def.id] = false; });
  storyIndex = 0;
  // load best stats from localStorage
  bestLevel = parseInt(localStorage.getItem('bestLevel') || '0');
  bestCoins = parseInt(localStorage.getItem('bestCoins') || '0');
  gameMessage.textContent = '';
  updateScoreBar();
  startScreen.style.display = 'block';
  gameScreen.style.display = 'none';
  clearField();
}

function startGame() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
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
  hiddenArea.style.background = themes[theme].background;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  showStory();
}

function setupLevel() {
  clearField();
  const diff = difficultySettings[difficulty];
  const starCount = diff.stars + Math.floor((level - 1) / 2);
  const bombCount = diff.bombs + Math.floor(level / 2);
  totalTime = Math.max(20, diff.time - (level - 1) * 2);
  timeLeft = totalTime;
  updateProgressBar();
  // Start particle background
  startParticles();
  // Stars
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
  // Bombs
  for (let i = 0; i < bombCount; i++) {
    const bombEl = document.createElement('div');
    bombEl.className = 'bomb';
    bombEl.textContent = themes[theme].bomb;
    const pos = randomPosition();
    bombEl.style.left = pos.left;
    bombEl.style.top = pos.top;
    const dx = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random());
    const dy = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random());
    bombEl.addEventListener('click', () => handleBombClick(bombEl));
    hiddenArea.appendChild(bombEl);
    bombs.push({ element: bombEl, dx, dy });
  }
  // Boss star
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
        const rect = boss.getBoundingClientRect();
        hiddenArea.removeChild(boss);
        bossStar = null;
        coins += doubleCoinsActive ? 10 : 5;
        timeLeft += 10;
        gameMessage.textContent = 'You defeated the boss star! +5 coins, +10s';
        playBossDefeat();
        animateCoinToScore(rect.left + rect.width / 2, rect.top + rect.height / 2);
        updateScoreBar();
        checkAchievements();
        checkLevelComplete();
      }
    });
    hiddenArea.appendChild(boss);
    bossStar = boss;
  }
  // Bonus coin
  if (Math.random() < 0.5) {
    const bonus = document.createElement('div');
    bonus.className = 'bonus';
    bonus.textContent = themes[theme].bonus;
    const pos = randomPosition();
    bonus.style.left = pos.left;
    bonus.style.top = pos.top;
    bonus.addEventListener('click', () => {
      const rect = bonus.getBoundingClientRect();
      hiddenArea.removeChild(bonus);
      coins += 2;
      gameMessage.textContent = 'Bonus coin collected! +2 coins';
      playBonus();
      animateCoinToScore(rect.left + rect.width / 2, rect.top + rect.height / 2);
      updateScoreBar();
      checkAchievements();
    });
    hiddenArea.appendChild(bonus);
    bonusCoinsArr.push(bonus);
  }
  // Time item
  if (Math.random() < 0.4) {
    const timeItem = document.createElement('div');
    timeItem.className = 'time-item';
    timeItem.textContent = themes[theme].time;
    const pos = randomPosition();
    timeItem.style.left = pos.left;
    timeItem.style.top = pos.top;
    timeItem.addEventListener('click', () => {
      const rect = timeItem.getBoundingClientRect();
      hiddenArea.removeChild(timeItem);
      timeLeft += 10;
      totalTime += 10;
      gameMessage.textContent = 'Extra time! +10 seconds';
      playTimeSound();
      animateCoinToScore(rect.left + rect.width / 2, rect.top + rect.height / 2);
      updateProgressBar();
    });
    hiddenArea.appendChild(timeItem);
    timeItems.push(timeItem);
  }
  // Life item
  if (Math.random() < 0.4) {
    const lifeItem = document.createElement('div');
    lifeItem.className = 'life-item';
    lifeItem.textContent = themes[theme].life;
    const pos = randomPosition();
    lifeItem.style.left = pos.left;
    lifeItem.style.top = pos.top;
    lifeItem.addEventListener('click', () => {
      const rect = lifeItem.getBoundingClientRect();
      hiddenArea.removeChild(lifeItem);
      lives++;
      gameMessage.textContent = 'Extra life gained!';
      playLifeSound();
      animateCoinToScore(rect.left + rect.width / 2, rect.top + rect.height / 2);
      updateScoreBar();
    });
    hiddenArea.appendChild(lifeItem);
    lifeItems.push(lifeItem);
  }
  if (freezeCount > 0) activateFreeze();
  startTimer();
  startBombMovement();
}

function handleObjectClick(obj) {
  const rect = obj.getBoundingClientRect();
  hiddenArea.removeChild(obj);
  stars = stars.filter(o => o !== obj);
  coins += doubleCoinsActive ? 2 : 1;
  gameMessage.textContent = doubleCoinsActive ? 'Object collected! +2 coins' : 'Object collected! +1 coin';
  playCollect();
  animateCoinToScore(rect.left + rect.width / 2, rect.top + rect.height / 2);
  updateScoreBar();
  checkAchievements();
  checkLevelComplete();
}

function handleBombClick(bombEl) {
  const rect = bombEl.getBoundingClientRect();
  hiddenArea.removeChild(bombEl);
  bombs = bombs.filter(b => b.element !== bombEl);
  createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
  if (shieldActive) {
    shieldActive = false;
    gameMessage.textContent = 'Shield protected you from a bomb!';
  } else {
    lives--;
    timeLeft = Math.max(0, timeLeft - 5);
    gameMessage.textContent = 'Bomb hit! -1 life, -5s';
    playBombSound();
    updateScoreBar();
    if (lives <= 0) {
      endGame('A bomb ended your adventure.');
      return;
    }
  }
  updateProgressBar();
}

function checkLevelComplete() {
  if (stars.length === 0 && (!bossStar || bossClicks <= 0)) {
    clearInterval(timerInterval);
    clearInterval(bombInterval);
    const timeBonus = Math.floor(timeLeft / 5);
    const reward = timeBonus + (doubleCoinsActive ? 2 : 1);
    coins += reward;
    gameMessage.textContent = `Level complete! +${reward} coins`;
    if (level > highestLevel) highestLevel = level;
    updateScoreBar();
    checkAchievements();
    doubleCoinsActive = false;
    slowBombActive = false;
    if (lives > 0) {
      setTimeout(() => showShop(), 1500);
    } else {
      endGame('You finished the level but have no lives left.');
    }
  }
}

function checkAchievements() {
  for (const def of achievementDefs) {
    if (!achievements[def.id] && def.condition()) {
      achievements[def.id] = true;
      showAchievement(def.message);
      return;
    }
  }
}

function endGame(message) {
  clearInterval(timerInterval);
  clearInterval(bombInterval);
  gameMessage.textContent = message;
  // Update best stats
  if (highestLevel > bestLevel) {
    bestLevel = highestLevel;
    localStorage.setItem('bestLevel', bestLevel.toString());
  }
  if (coins > bestCoins) {
    bestCoins = coins;
    localStorage.setItem('bestCoins', bestCoins.toString());
  }
  setTimeout(() => {
    initGame();
  }, 3000);
}

function proceedToNextLevel() {
  level++;
  if (lives <= 0) {
    endGame('Game over!');
    return;
  }
  if ((level - 1) % 3 === 0) showStory();
  else setupLevel();
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
  if (stars.length === 0 && (!bossStar || bossClicks <= 0)) {
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
  const star = stars[0];
  const original = star.style.color;
  star.style.color = '#00e676';
  playCollect();
  const rect = star.getBoundingClientRect();
  animateCoinToScore(rect.left + rect.width / 2, rect.top + rect.height / 2);
  setTimeout(() => star.style.color = original, 1000);
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
  const originalColors = stars.map(s => s.style.color);
  stars.forEach(s => { s.style.color = '#00e676'; });
  playCollect();
  stars.forEach(s => {
    const rect = s.getBoundingClientRect();
    animateCoinToScore(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
  setTimeout(() => {
    stars.forEach((s, i) => s.style.color = originalColors[i]);
  }, 2000);
});

pauseBtn.addEventListener('click', () => {
  if (overlay.style.display === 'flex') return;
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

// Initialize on load
initGame();
