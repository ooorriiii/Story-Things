console.clear();
console.log("SCRIPT_VERSION","2025-08-31-full");

const startScreen=document.getElementById("start-screen");
const gameScreen=document.getElementById("game-screen");
const hiddenArea=document.getElementById("hidden-object-area");
const progressBar=document.getElementById("progress-bar");
const levelInfo=document.getElementById("level-info");
const coinsDisplay=document.getElementById("coins-display");
const livesInfo=document.getElementById("lives-info");
const highestInfo=document.getElementById("highest-info");
const gameMessage=document.getElementById("game-message");
const balanceDisplay=document.getElementById("balance-display");
const bestStatsEl=document.getElementById("best-stats");

const connectWalletBtn=document.getElementById("connect-wallet");
const startGameBtn=document.getElementById("start-game");
const difficultySelect=document.getElementById("difficulty-select");
const themeSelect=document.getElementById("theme-select");
const hintBtn=document.getElementById("hint-button");
const revealBtn=document.getElementById("reveal-button");
const pauseBtn=document.getElementById("pause-button");
const darkModeBtn=document.getElementById("darkmode-button");
const resetBtn=document.getElementById("reset-button");

let level=1,coins=5,lives=3,highestLevel=0,theme="default",difficulty="Normal";
let stars=[],bombs=[];
let timeLeft=60,totalTime=60,timerInterval,bombInterval,paused=false;

function updateScoreBar(){
  levelInfo.textContent=`Level: ${level}`;
  coinsDisplay.textContent=`Coins: ${coins}`;
  livesInfo.textContent=`Lives: ${lives}`;
  highestInfo.textContent=`Highest: ${highestLevel}`;
  balanceDisplay.textContent=`Balance: ${coins} coins`;
}
function updateProgress(){
  const r=timeLeft/totalTime;
  progressBar.style.width=Math.max(0,r*100)+"%";
  progressBar.style.background=r>0.5?"#4caf50":(r>0.25?"#ff9800":"#f44336");
}
function rndPos(){return {left:(Math.random()*90+5)+"%", top:(Math.random()*90+5)+"%"};}

function setupLevel(){
  hiddenArea.innerHTML=""; stars=[]; bombs=[]; gameMessage.textContent="";
  totalTime=50; timeLeft=totalTime; updateProgress();
  for(let i=0;i<5;i++){
    const o=document.createElement("div"); o.className="object"; o.textContent="⭐";
    const p=rndPos(); o.style.left=p.left; o.style.top=p.top;
    o.onclick=()=>{o.remove(); stars=stars.filter(s=>s!==o); coins++; updateScoreBar(); checkLevelEnd();};
    hiddenArea.appendChild(o); stars.push(o);
  }
  for(let i=0;i<2;i++){
    const b=document.createElement("div"); b.className="bomb"; b.textContent="💣";
    const p=rndPos(); b.style.left=p.left; b.style.top=p.top;
    b.onclick=()=>{b.remove(); lives--; if(lives<=0){endGame("Game Over!");} updateScoreBar();};
    hiddenArea.appendChild(b); bombs.push(b);
  }
  startTimer();
}
function startTimer(){
  clearInterval(timerInterval);
  timerInterval=setInterval(()=>{if(!paused){timeLeft--; updateProgress(); if(timeLeft<=0){endGame("Time up!");}}},1000);
}
function checkLevelEnd(){
  if(stars.length===0){
    clearInterval(timerInterval);
    level++; coins+=2; highestLevel=Math.max(highestLevel,level);
    updateScoreBar(); setupLevel();
  }
}
function endGame(msg){
  clearInterval(timerInterval); gameMessage.textContent=msg;
  startScreen.style.display="block"; gameScreen.style.display="none";
}

// ===== Controls =====
startGameBtn.onclick=()=>{level=1;coins=5;lives=3;startScreen.style.display="none";gameScreen.style.display="block";updateScoreBar();setupLevel();};
hintBtn.onclick=()=>{if(coins>=1&&stars.length>0){coins--;stars[0].style.color="lime";setTimeout(()=>stars[0].style.color="",1000);updateScoreBar();}};
revealBtn.onclick=()=>{if(coins>=3){coins-=3;stars.forEach(s=>s.style.color="lime");setTimeout(()=>stars.forEach(s=>s.style.color=""),1500);updateScoreBar();}};
pauseBtn.onclick=()=>{paused=!paused;pauseBtn.textContent=paused?"Resume":"Pause";};
darkModeBtn.onclick=()=>{document.body.classList.toggle("dark-mode");};
resetBtn.onclick=()=>{endGame("Reset");};

// ===== Wallet =====
connectWalletBtn.addEventListener("click",async()=>{
  try{
    if(typeof connectCryptoWallet!=="function"){alert("Wallet module not loaded");return;}
    const {address,balanceEth}=await connectCryptoWallet();
    document.getElementById("wallet-address").textContent=`Address: ${address}`;
    document.getElementById("balance-display").textContent=`ETH Balance: ${balanceEth}`;
  }catch(e){alert("Wallet error: "+(e?.message||e));}
});
