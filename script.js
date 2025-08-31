// ====== VERSION TAG ======
console.log('SCRIPT_VERSION','2025-08-31-final');

// ====== DOM ======
const startScreen=document.getElementById('start-screen');
const gameScreen=document.getElementById('game-screen');
const hiddenArea=document.getElementById('hidden-object-area');
const progressBar=document.getElementById('progress-bar');
const levelInfo=document.getElementById('level-info');
const coinsDisplay=document.getElementById('coins-display');
const livesInfo=document.getElementById('lives-info');
const highestInfo=document.getElementById('highest-info');
const gameMessage=document.getElementById('game-message');
const balanceDisplay=document.getElementById('balance-display');
const bestStatsEl=document.getElementById('best-stats');

const connectWalletBtn=document.getElementById('connect-wallet');
const startGameBtn=document.getElementById('start-game');
const difficultySelect=document.getElementById('difficulty-select');
const themeSelect=document.getElementById('theme-select');
const hintBtn=document.getElementById('hint-button');
const revealBtn=document.getElementById('reveal-button');
const pauseBtn=document.getElementById('pause-button');
const darkModeBtn=document.getElementById('darkmode-button');
const resetBtn=document.getElementById('reset-button');

const overlay=document.getElementById('overlay');
const storyPanel=document.getElementById('story-panel');
const storyTextEl=document.getElementById('story-text');
const storyContinueBtn=document.getElementById('story-continue');
const shopPanel=document.getElementById('shop-panel');
const shopItemsEl=document.getElementById('shop-items');
const shopContinueBtn=document.getElementById('shop-continue');
const achievementPanel=document.getElementById('achievement-panel');
const achievementTextEl=document.getElementById('achievement-text');
const achievementContinueBtn=document.getElementById('achievement-continue');

// ====== AUDIO ======
const AudioContextClass=window.AudioContext||window.webkitAudioContext;
const audioCtx=new AudioContextClass();
function tone(f,d){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='sine';o.frequency.value=f;const t=audioCtx.currentTime;o.start(t);g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.stop(t+d)}
const SFX={collect:()=>tone(850,.15),bonus:()=>tone(1000,.2),time:()=>tone(600,.25),life:()=>tone(400,.25),bomb:()=>tone(150,.3),boss:()=>tone(350,.5),purchase:()=>tone(500,.2),achv:()=>tone(700,.4)};

// ====== SETTINGS ======
const difficultySettings={Easy:{time:60,stars:3,bombs:1},Normal:{time:50,stars:4,bombs:2},Hard:{time:40,stars:5,bombs:3}};
const themes={
  default:{object:'⭐',bonus:'💰',time:'⌛',life:'❤️',bomb:'💣',boss:'🌟',bg:'linear-gradient(180deg,#83a4d4 0%,#b6fbff 100%)'},
  time:{object:'🕰️',bonus:'📜',time:'⏳',life:'🔮',bomb:'⌛',boss:'🕰️',bg:'linear-gradient(180deg,#ffd89b 0%,#19547b 100%)'},
  underwater:{object:'🐚',bonus:'🦈',time:'🐠',life:'🐙',bomb:'💣',boss:'🐳',bg:'linear-gradient(180deg,#00c6fb 0%,#005bea 100%)'},
  dream:{object:'🌙',bonus:'🌟',time:'💤',life:'🦋',bomb:'☁️',boss:'🌈',bg:'linear-gradient(180deg,#e0c3fc 0%,#8ec5fc 100%)'},
  village:{object:'🏡',bonus:'🐔',time:'🌿',life:'🌾',bomb:'🚜',boss:'🌳',bg:'linear-gradient(180deg,#eaf2d7 0%,#d5ebba 100%)'}
};

// ====== STATE ======
let level,coins,lives,highestLevel,theme,difficulty;
let stars=[],bombs=[],bonusCoins=[],timeItems=[],lifeItems=[]; let bossStar=null,bossClicks=0;
let timeLeft,totalTime,timerInterval,bombInterval,paused=false;
let shieldActive=false,freezeCount=0,doubleCoinsActive=false;
(function initBest(){const bestLevel=parseInt(localStorage.getItem('bestLevel')||'0',10),bestCoins=parseInt(localStorage.getItem('bestCoins')||'0',10); bestStatsEl.textContent=`Best Level: ${bestLevel} | Best Coins: ${bestCoins}`;})();

// ====== HELPERS ======
function updateScoreBar(){levelInfo.textContent=`Level: ${level}`; coinsDisplay.textContent=`Coins: ${coins}`; livesInfo.textContent=`Lives: ${lives}`; highestInfo.textContent=`Highest: ${highestLevel}`; balanceDisplay.textContent=`Balance: ${coins} coins`;}
function updateProgress(){const r=timeLeft/totalTime; progressBar.style.width=Math.max(0,r*100)+'%'; progressBar.style.background=r>0.5?'#4caf50':(r>0.25?'#ff9800':'#f44336');}
function rndPos(){return {left:(Math.random()*90+5)+'%', top:(Math.random()*90+5)+'%'};}
function spark(x,y){for(let i=0;i<8;i++){const s=document.createElement('div'); s.className='spark'; const a=Math.random()*Math.PI*2, d=Math.random()*30+10; s.style.left=`${x+Math.cos(a)*d-4}px`; s.style.top=`${y+Math.sin(a)*d-4}px`; hiddenArea.appendChild(s); setTimeout(()=>s.remove(),600)}}

// ====== WALLET BUTTON ======
connectWalletBtn.addEventListener('click', async()=>{
  try{
    if(typeof connectCryptoWallet!=='function'){ alert('Wallet module not loaded (wallet_exodus_integration.js)'); return; }
    const { address, balanceEth } = await connectCryptoWallet();
    document.getElementById('wallet-address').textContent=`Address: ${address}`;
    document.getElementById('balance-display').textContent=`ETH Balance: ${balanceEth}`;
  }catch(e){ alert('Wallet error: '+(e?.message||e)); }
});

// ====== GAME ======
function setupLevel(){
  hiddenArea.innerHTML=''; gameMessage.textContent=''; stars=[]; bombs=[]; bonusCoins=[]; timeItems=[]; lifeItems=[];
  const diff=difficultySettings[difficulty]; const starCount=diff.stars+Math.floor((level-1)/2); const bombCount=diff.bombs+Math.floor(level/2);
  totalTime=Math.max(20,diff.time-(level-1)*2); timeLeft=totalTime; updateProgress();
  hiddenArea.style.background=themes[theme].bg;
  // stars
  for(let i=0;i<starCount;i++){const o=document.createElement('div'); o.className='object'; o.textContent=themes[theme].object; const p=rndPos(); o.style.left=p.left; o.style.top=p.top; o.addEventListener('click',()=>hitStar(o)); hiddenArea.appendChild(o); stars.push(o);}
  // bombs
  for(let i=0;i<bombCount;i++){const b=document.createElement('div'); b.className='bomb'; b.textContent=themes[theme].bomb; const p=rndPos(); b.style.left=p.left; b.style.top=p.top; const dx=(Math.random()<.5?-1:1)*(.5+Math.random()); const dy=(Math.random()<.5?-1:1)*(.5+Math.random()); b.dataset.dx=dx; b.dataset.dy=dy; b.addEventListener('click',()=>hitBomb(b)); hiddenArea.appendChild(b); bombs.push(b);}
  // boss
  if(level%5===0){const boss=document.createElement('div'); boss.className='boss-star'; boss.textContent=themes[theme].boss; const p=rndPos(); boss.style.left=p.left; boss.style.top=p.top; bossClicks=3; boss.addEventListener('click',()=>{bossClicks--; boss.style.transform=`scale(${1+(3-bossClicks)*.1})`; if(bossClicks<=0){ const r=boss.getBoundingClientRect(); boss.remove(); bossStar=null; coins+=doubleCoinsActive?10:5; timeLeft+=10; gameMessage.textContent='Boss defeated! +5 coins, +10s'; SFX.boss(); spark(r.left+r.width/2,r.top+r.height/2); updateScoreBar(); checkAchievements(); checkLevelEnd(); }}); hiddenArea.appendChild(boss); bossStar=boss; }
  // pickups
  if(Math.random()<.5) spawnBonus(); if(Math.random()<.4) spawnTime(); if(Math.random()<.4) spawnLife();
  startTimer(); moveBombs();
}
function spawnBonus(){const e=document.createElement('div'); e.className='bonus'; e.textContent=themes[theme].bonus; const p=rndPos(); e.style.left=p.left; e.style.top=p.top; e.addEventListener('click',()=>{const r=e.getBoundingClientRect(); e.remove(); coins+=2; SFX.bonus(); spark(r.left+r.width/2,r.top+r.height/2); updateScoreBar(); checkAchievements();}); hiddenArea.appendChild(e); bonusCoins.push(e)}
function spawnTime(){const e=document.createElement('div'); e.className='time-item'; e.textContent=themes[theme].time; const p=rndPos(); e.style.left=p.left; e.style.top=p.top; e.addEventListener('click',()=>{const r=e.getBoundingClientRect(); e.remove(); timeLeft+=10; totalTime+=10; SFX.time(); spark(r.left+r.width/2,r.top+r.height/2); updateProgress();}); hiddenArea.appendChild(e); timeItems.push(e)}
function spawnLife(){const e=document.createElement('div'); e.className='life-item'; e.textContent=themes[theme].life; const p=rndPos(); e.style.left=p.left; e.style.top=p.top; e.addEventListener('click',()=>{const r=e.getBoundingClientRect(); e.remove(); lives++; SFX.life(); spark(r.left+r.width/2,r.top+r.height/2); updateScoreBar();}); hiddenArea.appendChild(e); lifeItems.push(e)}
function startTimer(){clearInterval(timerInterval); timerInterval=setInterval(()=>{ if(!paused){ timeLeft--; if(timeLeft<=0){timeLeft=0; endGame(\"Time's up!\");} updateProgress(); } },1000)}
function moveBombs(){clearInterval(bombInterval); bombInterval=setInterval(()=>{ if(paused) return; bombs.forEach(b=>{ let x=parseFloat(b.style.left), y=parseFloat(b.style.top), dx=parseFloat(b.dataset.dx), dy=parseFloat(b.dataset.dy); x+=dx; y+=dy; if(x<0||x>95){dx=-dx; b.dataset.dx=dx} if(y<0||y>95){dy=-dy; b.dataset.dy=dy} b.style.left=Math.max(0,Math.min(95,x))+'%'; b.style.top=Math.max(0,Math.min(95,y))+'%'; }); },60)}
function hitStar(o){const r=o.getBoundingClientRect(); o.remove(); stars=stars.filter(s=>s!==o); coins+=doubleCoinsActive?2:1; SFX.collect(); spark(r.left+r.width/2,r.top+r.height/2); updateScoreBar(); checkAchievements(); checkLevelEnd()}
function hitBomb(b){const r=b.getBoundingClientRect(); b.remove(); bombs=bombs.filter(x=>x!==b); if(shieldActive){shieldActive=false; gameMessage.textContent='Shield absorbed a bomb!'; } else { lives--; timeLeft=Math.max(0,timeLeft-5); SFX.bomb(); if(lives<=0){ endGame('A bomb ended your adventure.'); return; } } updateScoreBar(); updateProgress();}
function checkLevelEnd(){ if(stars.length===0 && (!bossStar || bossClicks<=0)){ clearInterval(timerInterval); clearInterval(bombInterval); const timeBonus=Math.floor(timeLeft/5); let reward=(doubleCoinsActive?2:1)+timeBonus; coins+=reward; gameMessage.textContent=`Level ${level} cleared! +${reward} coins`; if(level>highestLevel){highestLevel=level; localStorage.setItem('bestLevel', highestLevel.toString());} showShop(); updateScoreBar(); checkAchievements(); } }
function showShop(){ overlay.style.display='flex'; shopPanel.style.display='block'; storyPanel.style.display='none'; achievementPanel.style.display='none'; shopItemsEl.innerHTML=''; const items=[{name:'Shield',cost:5,apply:()=>shieldActive=true},{name:'Time Freeze',cost:8,apply:()=>freezeCount++},{name:'Double Coins',cost:10,apply:()=>doubleCoinsActive=true},{name:'Reveal All',cost:4,apply:()=>revealCount()},{name:'Slow Bombs',cost:6,apply:()=>{} }]; items.forEach(it=>{const row=document.createElement('div'); row.className='shop-item'; row.innerHTML=`<span>${it.name}</span><span>${it.cost} coins</span>`; row.onclick=()=>{ if(coins>=it.cost){ coins-=it.cost; SFX.purchase(); it.apply(); updateScoreBar(); } else { gameMessage.textContent='Not enough coins.'; } }; shopItemsEl.appendChild(row); });}
function endGame(msg){ clearInterval(timerInterval); clearInterval(bombInterval); paused=false; gameMessage.textContent=msg; overlay.style.display='flex'; shopPanel.style.display='none'; storyPanel.style.display='none'; achievementPanel.style.display='block'; achievementTextEl.textContent=`Highest level: ${highestLevel} | Coins: ${coins}`; }

// ====== ACHIEVEMENTS ======
function checkAchievements(){ const l=level,c=coins; const ups=[]; if(l>=5&&!ach('level5')) ups.push('Reached level 5'); if(l>=10&&!ach('level10')) ups.push('Reached level 10'); if(c>=50&&!ach('coins50')) ups.push('Collected 50 coins'); if(ups.length){ SFX.achv(); overlay.style.display='flex'; achievementPanel.style.display='block'; shopPanel.style.display='none'; storyPanel.style.display='none'; achievementTextEl.textContent=ups[0]; } }
function ach(key){ if(localStorage.getItem('ach_'+key)) return true; localStorage.setItem('ach_'+key,'1'); return false; }

// ====== CONTROLS ======
startGameBtn.addEventListener('click',()=>{ level=1; coins=5; lives=3; highestLevel=parseInt(localStorage.getItem('bestLevel')||'0',10); difficulty=difficultySettings[difficultySelect.value]?difficultySelect.value:'Normal'; theme=themeSelect.value||'default'; startScreen.style.display='none'; gameScreen.style.display='block'; updateScoreBar(); setupLevel(); });
hintBtn.addEventListener('click',()=>{ if(paused||stars.length===0) return; if(coins<1){ gameMessage.textContent='Not enough coins.'; return; } coins--; const s=stars[0]; const orig=s.style.color; s.style.color='#00e676'; setTimeout(()=>s.style.color=orig,1000); SFX.collect(); updateScoreBar(); });
revealBtn.addEventListener('click',()=>{ if(paused||stars.length===0) return; if(coins<3){ gameMessage.textContent='Not enough coins.'; return; } coins-=3; const orig=stars.map(s=>s.style.color); stars.forEach(s=>s.style.color='#00e676'); setTimeout(()=>stars.forEach((s,i)=>s.style.color=orig[i]),2000); SFX.collect(); updateScoreBar(); });
pauseBtn.addEventListener('click',()=>{ paused=!paused; pauseBtn.textContent=paused?'Resume':'Pause'; });
darkModeBtn.addEventListener('click',()=>{ document.body.classList.toggle('dark-mode'); });
resetBtn.addEventListener('click',()=>{ startScreen.style.display='block'; gameScreen.style.display='none'; });

storyContinueBtn.addEventListener('click',()=>{ overlay.style.display='none'; setupLevel(); });
shopContinueBtn.addEventListener('click',()=>{ overlay.style.display='none'; level++; setupLevel(); });
achievementContinueBtn.addEventListener('click',()=>{ overlay.style.display='none'; startScreen.style.display='block'; gameScreen.style.display='none'; });
