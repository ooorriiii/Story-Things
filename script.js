console.clear();
console.log("SCRIPT_VERSION","2025-08-31-full");

// DOM
const startScreen=document.getElementById("start-screen");
const gameScreen=document.getElementById("game-screen");
const hiddenArea=document.getElementById("hidden-object-area");
const progressBar=document.getElementById("progress-bar");
const levelInfo=document.getElementById("level-info");
const coinsDisplay=document.getElementById("coins-display");
const livesInfo=document.getElementById("lives-info");
const gameMessage=document.getElementById("game-message");

const connectWalletBtn=document.getElementById("connect-wallet");
const startGameBtn=document.getElementById("start-game");
const hintBtn=document.getElementById("hint-button");
const resetBtn=document.getElementById("reset-button");

let level=1,coins=5,lives=3;
let stars=[],bombs=[],timeLeft=50,totalTime=50,timerInterval;

// Update UI
function updateScore(){
  levelInfo.textContent=`Level: ${level}`;
  coinsDisplay.textContent=`Coins: ${coins}`;
  livesInfo.textContent=`Lives: ${lives}`;
}
function updateProgress(){
  const r=timeLeft/totalTime;
  progressBar.style.width=Math.max(0,r*100)+"%";
  progressBar.style.background=r>0.5?"#4caf50":(r>0.25?"#ff9800":"#f44336");
}
function rndPos(){return {left:(Math.random()*90+5)+"%", top:(Math.random()*90+5)+"%"};}

// Setup level
function setupLevel(){
  hiddenArea.innerHTML=""; stars=[]; bombs=[]; timeLeft=totalTime; updateProgress();
  for(let i=0;i<5;i++){
    const o=document.createElement("div"); o.className="object"; o.textContent="⭐";
    const p=rndPos(); o.style.left=p.left; o.style.top=p.top;
    o.onclick=()=>{o.remove(); stars=stars.filter(s=>s!==o); coins++; updateScore(); if(stars.length===0) nextLevel();};
    hiddenArea.appendChild(o); stars.push(o);
  }
  for(let i=0;i<2;i++){
    const b=document.createElement("div"); b.className="bomb"; b.textContent="💣";
    const p=rndPos(); b.style.left=p.left; b.style.top=p.top;
    b.onclick=()=>{b.remove(); bombs=bombs.filter(x=>x!==b); lives--; updateScore(); if(lives<=0) endGame("Game Over");};
    hiddenArea.appendChild(b); bombs.push(b);
  }
  startTimer();
}
function startTimer(){
  clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    timeLeft--; updateProgress();
    if(timeLeft<=0){endGame("Time Up!");}
  },1000);
}
function nextLevel(){ level++; coins+=2; updateScore(); setupLevel(); }
function endGame(msg){ clearInterval(timerInterval); gameMessage.textContent=msg; startScreen.style.display="block"; gameScreen.style.display="none"; }

// Controls
startGameBtn.onclick=()=>{level=1;coins=5;lives=3;startScreen.style.display="none";gameScreen.style.display="block";updateScore();setupLevel();};
hintBtn.onclick=()=>{ if(coins>=1&&stars.length>0){coins--;stars[0].style.color="lime"; setTimeout(()=>stars[0].style.color="",800); updateScore();}};
resetBtn.onclick=()=>{endGame("Reset");};

// Wallet
connectWalletBtn.onclick=async()=>{
  try{
    if(typeof connectCryptoWallet!=="function"){alert("Wallet module not loaded");return;}
    const {address,balanceEth}=await connectCryptoWallet();
    document.getElementById("wallet-address").textContent=`Address: ${address}`;
    document.getElementById("balance-display").textContent=`ETH Balance: ${balanceEth}`;
  }catch(e){alert("Wallet error: "+(e?.message||e));}
};
