console.clear();
console.log("SCRIPT_VERSION","2025-08-31-full");

// ===== DOM =====
const startScreen=document.getElementById("start-screen");
const gameScreen=document.getElementById("game-screen");
const hiddenArea=document.getElementById("hidden-object-area");
const progressBar=document.getElementById("progress-bar");
const levelInfo=document.getElementById("level-info");
const coinsDisplay=document.getElementById("coins-display");
const livesInfo=document.getElementById("lives-info");
const highestInfo=document.getElementById("highest-info");
const gameMessage=document.getElementById("game-message");

const connectWalletBtn=document.getElementById("connect-wallet");
const startGameBtn=document.getElementById("start-game");
const difficultySelect=document.getElementById("difficulty-select");
const themeSelect=document.getElementById("theme-select");
const hintBtn=document.getElementById("hint-button");
const revealBtn=document.getElementById("reveal-button");
const pauseBtn=document.getElementById("pause-button");
const darkModeBtn=document.getElementById("darkmode-button");
const resetBtn=document.getElementById("reset-button");

// ===== STATE =====
let level=1, coins=5, lives=3, highestLevel=parseInt(localStorage.getItem('bestLevel')||'0',10);
let stars=[], bombs=[];
let timeLeft=50, totalTime=50, timerInterval, bombInterval, paused=false;

// ===== HELPERS =====
function updateScore(){
  levelInfo.textContent=`Level: ${level}`;
  coinsDisplay.textContent=`Coins: ${coins}`;
  livesInfo.textContent=`Lives: ${lives}`;
  highestInfo.textContent=`Highest: ${highestLevel}`;
}
function updateProgress(){
  const r = timeLeft/totalTime;
  progressBar.style.width = Math.max(0,r*100)+'%';
  progressBar.style.background = r>0.5 ? '#4caf50' : (r>0.25 ? '#ff9800' : '#f44336');
}
function rndPos(){ return { left:(Math.random()*90+5)+'%', top:(Math.random()*85+5)+'%' }; }

// חלקיקים דקורטיביים
function startParticles(){
  setInterval(()=>{
    if(document.hidden) return;
    const p=document.createElement('div'); p.className='particle';
    p.style.left=Math.random()*100+'%'; p.style.top='-6px';
    hiddenArea.appendChild(p); setTimeout(()=>p.remove(),4000);
  },250);
}

// ===== GAME =====
function setupLevel(){
  hiddenArea.innerHTML=''; stars=[]; bombs=[]; gameMessage.textContent='';
  timeLeft = totalTime; updateProgress();
  // כוכבים
  for(let i=0;i<5;i++){
    const o=document.createElement('div'); o.className='object'; o.textContent='⭐';
    const p=rndPos(); o.style.left=p.left; o.style.top=p.top;
    o.onclick=()=>{ o.remove(); stars=stars.filter(s=>s!==o); coins++; updateScore(); if(stars.length===0) nextLevel(); };
    hiddenArea.appendChild(o); stars.push(o);
  }
  // פצצות
  for(let i=0;i<2;i++){
    const b=document.createElement('div'); b.className='bomb'; b.textContent='💣';
    const p=rndPos(); b.style.left=p.left; b.style.top=p.top;
    b.onclick=()=>{ b.remove(); bombs=bombs.filter(x=>x!==b); lives--; updateScore(); if(lives<=0) endGame('Game Over'); };
    hiddenArea.appendChild(b); bombs.push(b);
  }
  startParticles();
  startTimer();
}

function startTimer(){
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    if(!paused){
      timeLeft--; updateProgress();
      if(timeLeft<=0){ endGame("Time Up!"); }
    }
  },1000);
}

function nextLevel(){
  clearInterval(timerInterval);
  level++; coins+=2; highestLevel=Math.max(highestLevel,level);
  localStorage.setItem('bestLevel', highestLevel.toString());
  updateScore(); setupLevel();
}

function endGame(msg){
  clearInterval(timerInterval);
  gameMessage.textContent = msg;
  startScreen.style.display='block';
  gameScreen.style.display='none';
}

// ===== CONTROLS =====
startGameBtn.onclick=()=>{
  level=1; coins=5; lives=3; updateScore();
  startScreen.style.display='none';
  gameScreen.style.display='block';
  setupLevel();
};

hintBtn.onclick=()=>{
  if(coins>=1 && stars.length>0){
    coins--;
    const s = stars[0]; const orig = s.style.color;
    s.style.color='lime'; setTimeout(()=>s.style.color=orig, 800);
    updateScore();
  }else{
    gameMessage.textContent = 'No stars or not enough coins.';
  }
};

revealBtn.onclick=()=>{
  if(coins>=3 && stars.length>0){
    coins-=3; updateScore();
    const orig = stars.map(s=>s.style.color);
    stars.forEach(s=>s.style.color='lime');
    setTimeout(()=>stars.forEach((s,i)=>s.style.color=orig[i]),1500);
  }else{
    gameMessage.textContent = 'No stars or not enough coins.';
  }
};

pauseBtn.onclick=()=>{ paused=!paused; pauseBtn.textContent = paused ? 'Resume' : 'Pause'; };
darkModeBtn.onclick=()=>{ document.body.classList.toggle('dark-mode'); };
resetBtn.onclick=()=>{ endGame('Reset'); };

// ===== WALLET =====
connectWalletBtn.onclick = async ()=>{
  try{
    if(typeof window.connectCryptoWallet!=='function'){
      alert('Wallet module not loaded (wallet_exodus_integration.js)');
      return;
    }
    const { address, balanceEth } = await window.connectCryptoWallet();
    document.getElementById('wallet-address').textContent  = `Your Address: ${address}`;
    document.getElementById('balance-display').textContent = `ETH Balance: ${balanceEth}`;
  }catch(e){ alert('Wallet error: ' + (e?.message||e)); }
};
