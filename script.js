console.clear();
console.log("SCRIPT_VERSION","2025-08-31-wc2");

// DOM
const startScreen=document.getElementById("start-screen");
const gameScreen=document.getElementById("game-screen");
const hiddenArea=document.getElementById("hidden-object-area");
const progressBar=document.getElementById("progress-bar");
const levelInfo=document.getElementById("level-info");
const coinsDisplay=document.getElementById("coins-display");
const livesInfo=document.getElementById("lives-info");
const highestInfo=document.getElementById("highest-info");
const walletAddrEl=document.getElementById("wallet-address");
const walletBalEl=document.getElementById("balance-display");

const connectWalletBtn=document.getElementById("connect-wallet");
const startGameBtn=document.getElementById("start-game");
const hintBtn=document.getElementById("hint-button");
const revealBtn=document.getElementById("reveal-button");
const pauseBtn=document.getElementById("pause-button");
const darkModeBtn=document.getElementById("darkmode-button");
const resetBtn=document.getElementById("reset-button");

// State
let level=1, coins=5, lives=3, highestLevel=parseInt(localStorage.getItem('bestLevel')||'0',10);
let stars=[], bombs=[], timeLeft=50, totalTime=50, timerInterval, paused=false;

// Utils
function updateScore(){ levelInfo.textContent=`Level: ${level}`; coinsDisplay.textContent=`Coins: ${coins}`; livesInfo.textContent=`Lives: ${lives}`; highestInfo.textContent=`Highest: ${highestLevel}`; }
function updateProgress(){ const r=timeLeft/totalTime; progressBar.style.width=Math.max(0,r*100)+'%'; progressBar.style.background=r>0.5?'#4caf50':(r>0.25?'#ff9800':'#f44336'); }
function rndPos(){ return { left:(Math.random()*90+5)+'%', top:(Math.random()*85+5)+'%' }; }
function spark(x,y){ for(let i=0;i<8;i++){ const s=document.createElement('div'); s.className='spark'; const a=Math.random()*Math.PI*2, d=Math.random()*30+10; s.style.left=`${x+Math.cos(a)*d-4}px`; s.style.top=`${y+Math.sin(a)*d-4}px`; hiddenArea.appendChild(s); setTimeout(()=>s.remove(),600);} }
function startParticles(){ setInterval(()=>{ if(document.hidden) return; const p=document.createElement('div'); p.className='particle'; p.style.left=Math.random()*100+'%'; p.style.top='-6px'; hiddenArea.appendChild(p); setTimeout(()=>p.remove(),4000); },250); }

// Game
function setupLevel(){
  hiddenArea.innerHTML=''; stars=[]; bombs=[]; timeLeft=totalTime; updateProgress(); updateScore();
  for(let i=0;i<5;i++){
    const o=document.createElement('div'); o.className='object'; o.textContent='⭐';
    const p=rndPos(); o.style.left=p.left; o.style.top=p.top;
    o.onclick=()=>{ const r=o.getBoundingClientRect(); o.remove(); stars=stars.filter(s=>s!==o); coins++; updateScore(); spark(r.left+r.width/2,r.top+r.height/2); if(stars.length===0) nextLevel(); };
    hiddenArea.appendChild(o); stars.push(o);
  }
  for(let i=0;i<2;i++){
    const b=document.createElement('div'); b.className='bomb'; b.textContent='💣';
    const p=rndPos(); b.style.left=p.left; b.style.top=p.top;
    b.onclick=()=>{ const r=b.getBoundingClientRect(); b.remove(); bombs=bombs.filter(x=>x!==b); lives--; updateScore(); spark(r.left+r.width/2,r.top+r.height/2); if(lives<=0) endGame('Game Over'); };
    hiddenArea.appendChild(b); bombs.push(b);
  }
  startParticles();
  startTimer();
}
function startTimer(){ clearInterval(timerInterval); timerInterval=setInterval(()=>{ if(!paused){ timeLeft--; updateProgress(); if(timeLeft<=0){ endGame('Time Up!'); } } },1000); }
function nextLevel(){ clearInterval(timerInterval); level++; coins+=2; highestLevel=Math.max(highestLevel,level); localStorage.setItem('bestLevel', String(highestLevel)); updateScore(); setupLevel(); }
function endGame(msg){ clearInterval(timerInterval); document.getElementById('game-message').textContent=msg; startScreen.style.display='block'; gameScreen.style.display='none'; }

// Controls
startGameBtn.onclick=()=>{ level=1; coins=5; lives=3; startScreen.style.display='none'; gameScreen.style.display='block'; updateScore(); setupLevel(); };
hintBtn.onclick =()=>{ if(coins>=1&&stars.length>0){ coins--; const s=stars[0]; const orig=s.style.color; s.style.color='lime'; setTimeout(()=>s.style.color=orig,800); updateScore(); } };
revealBtn.onclick=()=>{ if(coins>=3&&stars.length>0){ coins-=3; const orig=stars.map(s=>s.style.color); stars.forEach(s=>s.style.color='lime'); setTimeout(()=>stars.forEach((s,i)=>s.style.color=orig[i]),1500); updateScore(); } };
pauseBtn.onclick =()=>{ paused=!paused; pauseBtn.textContent=paused?'Resume':'Pause'; };
darkModeBtn.onclick=()=>{ document.body.classList.toggle('dark-mode'); };
resetBtn.onclick   =()=>{ endGame('Reset'); };

// Wallet – uses window.connectCryptoWallet() from wallet_wc_v2.js
document.getElementById("connect-wallet").onclick = async ()=>{
  try{
    if(typeof window.connectCryptoWallet!=='function'){ alert('WalletConnect v2 not loaded'); return; }
    const { address, balanceEth } = await window.connectCryptoWallet();
    walletAddrEl.textContent = `Your Address: ${address}`;
    walletBalEl.textContent  = `ETH Balance: ${balanceEth}`;
  }catch(e){ alert('Wallet error: ' + (e?.message||e)); }
};
