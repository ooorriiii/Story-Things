console.clear();
console.log('SCRIPT_VERSION','2025-08-31-full');


/* ==== DOM ==== */
const startScreen = document.getElementById('start-screen');
const gameScreen  = document.getElementById('game-screen');
const hiddenArea  = document.getElementById('hidden-object-area');
const bar         = document.getElementById('bar');
const levelInfo   = document.getElementById('level-info');
const coinsDisplay= document.getElementById('coins-display');
const livesInfo   = document.getElementById('lives-info');
const highestInfo = document.getElementById('highest-info');
const gameMessage = document.getElementById('game-message');
const balanceDisp = document.getElementById('balance-display');
const bestStatsEl = document.getElementById('best-stats');

const connectBtn  = document.getElementById('connect-wallet');
const startBtn    = document.getElementById('start-game');
const diffSel     = document.getElementById('difficulty-select');
const themeSel    = document.getElementById('theme-select');
const hintBtn     = document.getElementById('hint-button');
const revealBtn   = document.getElementById('reveal-button');
const pauseBtn    = document.getElementById('pause-button');
const darkBtn     = document.getElementById('darkmode-button');
const resetBtn    = document.getElementById('reset-button');

/* ==== Overlay skeleton ==== */
const overlay     = document.getElementById('overlay');
const overlayT    = document.getElementById('overlay-title');
const overlayP    = document.getElementById('overlay-text');
const overlayClose= document.getElementById('overlay-close');

/* ==== Audio ==== */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const ac = new AudioCtx();
function tone(f,d){const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=f;const t=ac.currentTime;o.start(t);g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.stop(t+d)}
const SFX={collect:()=>tone(850,.15),bonus:()=>tone(1000,.2),time:()=>tone(600,.25),life:()=>tone(400,.25),bomb:()=>tone(150,.3),boss:()=>tone(350,.5)};

/* ==== Settings ==== */
const diffCfg={Easy:{time:60,stars:3,bombs:1},Normal:{time:50,stars:4,bombs:2},Hard:{time:40,stars:5,bombs:3}};
const themes={
  default:{object:'⭐',bonus:'💰',time:'⌛',life:'❤️',bomb:'💣',boss:'🌟',bg:'linear-gradient(180deg,#83a4d4 0%,#b6fbff 100%)'},
  dream:  {object:'🌙',bonus:'🌟',time:'💤',life:'🦋',bomb:'☁️',boss:'🌈',bg:'linear-gradient(180deg,#e0c3fc 0%,#8ec5fc 100%)'},
  underwater:{object:'🐚',bonus:'🦈',time:'🐠',life:'🐙',bomb:'💣',boss:'🐳',bg:'linear-gradient(180deg,#00c6fb 0%,#005bea 100%)'}
};

/* ==== State ==== */
let level=1,coins=5,lives=3,highest=0,theme='default',difficulty='Normal';
let stars=[],bombs=[],bonusItems=[],timeItems=[],lifeItems=[],bossStar=null,bossHits=0;
let timeLeft=60,totalTime=60,timerInt,bombInt,paused=false;

/* ==== Helpers ==== */
function rndPos(){return {left:(Math.random()*90+5)+'%', top:(Math.random()*90+5)+'%'}}
function spark(x,y){for(let i=0;i<8;i++){const s=document.createElement('div');s.className='spark';const a=Math.random()*Math.PI*2,d=Math.random()*30+10;s.style.left=`${x+Math.cos(a)*d-4}px`;s.style.top=`${y+Math.sin(a)*d-4}px`;hiddenArea.appendChild(s);setTimeout(()=>s.remove(),600)}}
function updateUI(){levelInfo.textContent=`Level: ${level}`; coinsDisplay.textContent=`Coins: ${coins}`; livesInfo.textContent=`Lives: ${lives}`; highestInfo.textContent=`Highest: ${highest}`; balanceDisp.textContent=`Balance: ${coins} coins`; }
function updateBar(){const r=timeLeft/totalTime; bar.style.width=Math.max(0,r*100)+'%'; bar.style.background=r>.5?'#4caf50':(r>.25?'#ff9800':'#f44336')}

/* ==== Wallet ==== */
connectBtn.addEventListener('click',async()=>{
  try{
    const {address,balanceEth,gameAddress}=await connectCryptoWallet();
    document.getElementById('wallet-address').textContent=`Your address: ${address}`;
    balanceDisp.textContent = `ETH Balance: ${balanceEth}`;
    console.log('Game treasury address:',gameAddress);
  }catch(e){ alert('Wallet error: '+(e?.message||e)); }
});

/* ==== Game Core ==== */
function setupLevel(){
  hiddenArea.innerHTML=''; gameMessage.textContent=''; stars=[]; bombs=[]; bonusItems=[]; timeItems=[]; lifeItems=[];
  const cfg=diffCfg[difficulty]; const starN=cfg.stars+Math.floor((level-1)/2); const bombN=cfg.bombs+Math.floor(level/2);
  totalTime=Math.max(20,cfg.time-(level-1)*2); timeLeft=totalTime; updateBar();
  hiddenArea.style.background=themes[theme].bg;

  for(let i=0;i<starN;i++){
    const o=document.createElement('div'); o.className='object'; o.textContent=themes[theme].object;
    const p=rndPos(); o.style.left=p.left; o.style.top=p.top;
    o.onclick=()=>{const r=o.getBoundingClientRect();o
