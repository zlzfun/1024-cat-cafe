/* 1024 现场抽奖 · 现场音效（舞台 stage.js 和抽奖页 desk.js 用）。素材是真录音，来源和许可见 snd/来源.md。
   一次抽奖听到的：
     旋钮咔哒咔哒 → 扭蛋骨碌碌滚出来、落地 → 鼓点滚奏（越晃越响）……
     中了：鼓声一断，"咔哒"扣上；"叮"！钢鼓一串往上走，两边彩带炮"砰砰"，台下欢呼鼓掌、几只猫跟着叫（一等奖最热闹）
     没中：鼓声一断，萨克斯"哇～哇～哇～"往下滑，台下一声"哦～"，两只猫低低地叫
   页面一打开就把录音解码好；开关跟着猫咖的 Sound.on（抽奖页条上的"声音"）。哪段录音没加载上，就退回猫咖那套合成音（Sound.sfx），不会没声。
   Sfx.ev(名字)：crank toss roll land wob lock stamp；Sfx.win(几等奖)；Sfx.lose()；Sfx.drum() 开始滚奏；Sfx.stop() 全停。 */
const Sfx=(()=>{
const NAMES=['crank','toss','roll','land','wob','lock','ding','stamp','tada','womp','drum','cheer','hurray','ohh','meow1','meow2','meow3','meow4','meow5'];
// 没加载上时用的猫咖合成音
const OLD={crank:'ratchet',toss:'toss',roll:'roll',land:'land',wob:'clack',lock:'twinkle',stamp:'stamp'};
// 各段录音的音量（录音都归一到 -3dB 峰值，这里按听感再配）
const VOL={crank:.9,toss:.7,roll:.8,land:.8,wob:.9,lock:1,ding:.75,stamp:.8,tada:.7,womp:.55,drum:.6,cheer:.85,hurray:.8,ohh:.75};
const MEOWS=['meow1','meow2','meow3','meow4','meow5'];
const rr=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
let AC=null,OUT=null,NB=null,DR=null;const BUF={};
const on=()=>{try{return Sound.on}catch(e){return true}};
const old=k=>{try{Sound.sfx(k)}catch(e){}};

function ctx(){if(AC)return AC;const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;AC=new A();
  const comp=AC.createDynamicsCompressor();comp.threshold.value=-12;comp.ratio.value=3;OUT=AC.createGain();OUT.gain.value=.9;OUT.connect(comp).connect(AC.destination);return AC}
// 页面打开就去拿录音、解码（这时候 AudioContext 还是暂停的，不响；第一次点击或按键时 resume）
function load(){if(!ctx())return;for(const n of NAMES)fetch('snd/'+n+'.mp3').then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no))).then(b=>{BUF[n]=b}).catch(()=>{})}
function wake(){if(AC&&AC.state==='suspended')AC.resume().catch(()=>{})}

// 放一段：rate 变调（猫叫一只一个调），pan 左右（-1～1），delay 秒
function play(n,{vol=1,rate=1,pan=0,delay=0}={}){if(!on()||!AC||!BUF[n])return null;wake();
  const t=AC.currentTime+delay,s=AC.createBufferSource(),g=AC.createGain();s.buffer=BUF[n];s.playbackRate.value=rate;g.gain.value=(VOL[n]||.6)*vol;
  let x=s.connect(g);if(pan&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;x=x.connect(p)}x.connect(OUT);s.start(t);return{s,g}}
const has=n=>!!(AC&&BUF[n]);

// 彩带炮"砰"：一小段白噪声，低通、快速衰减（录音里没有合适的）
function pop(pan,delay){if(!on()||!AC)return;const t=AC.currentTime+delay;if(!NB){const n=AC.sampleRate*.4;NB=AC.createBuffer(1,n,AC.sampleRate);const a=NB.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,3)}
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NB;f.type='lowpass';f.frequency.value=2600;g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);
  let x=s.connect(f).connect(g);if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;x=x.connect(p)}x.connect(OUT);s.start(t)}

// 鼓点滚奏：扭蛋落地就开始，循环中段，6 秒内从轻到响；揭晓时一刀切断（宝可梦那种屏息之后的安静）
function drum(){if(DR||!has('drum')||!on())return;const s=AC.createBufferSource(),g=AC.createGain(),t=AC.currentTime;s.buffer=BUF.drum;s.loop=true;s.loopStart=.6;s.loopEnd=3.4;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(VOL.drum*.35,t+.25);g.gain.linearRampToValueAtTime(VOL.drum,t+6);s.connect(g).connect(OUT);s.start(t);DR={s,g}}
function cut(fade=.04){if(!DR)return;const t=AC.currentTime;DR.g.gain.cancelScheduledValues(t);DR.g.gain.setValueAtTime(DR.g.gain.value,t);DR.g.gain.linearRampToValueAtTime(0,t+fade);try{DR.s.stop(t+fade+.02)}catch(e){}DR=null}

// 一群猫叫：n 声，错开，一只一个调，左右散开
function meows(n,{from=.3,span=1.6,rate=[1,1.35],vol=[.35,.55]}={}){for(let i=0;i<n;i++)play(pick(MEOWS),{delay:from+rr(0,span),rate:rr(...rate),vol:rr(...vol),pan:rr(-.8,.8)})}

function ev(k){if(!on())return;if(k==='lock')cut(.02);
  if(!has(k))return old(OLD[k]||k);
  // 机械声每次略变一点调，不像同一段在重放
  play(k,{rate:k==='crank'?rr(.85,1.15):k==='wob'?rr(.9,1.1):1,pan:k==='crank'||k==='toss'?-.25:k==='stamp'?0:.3})}
function win(tier){cut();if(!on())return;
  if(!has('ding')){old('ding');setTimeout(()=>old('bell'),180);setTimeout(()=>old('fanfare'),420);return}
  play('ding',{pan:.3});play('tada',{delay:.15});pop(-.8,.05);pop(.8,.12);
  if(tier===1){play('cheer',{delay:.1});pop(-.6,.45);pop(.6,.55);meows(5)}
  else if(tier===2){play('cheer',{delay:.1,vol:.7});meows(3)}
  else{play('hurray',{delay:.1});meows(2)}}
function lose(){cut();if(!on())return;if(!has('womp'))return old('boop');
  play('womp',{delay:.05});play('ohh',{delay:.25,rate:.95});meows(2,{from:.8,span:.6,rate:[.78,.9],vol:[.25,.35]})}
function stop(){cut(.1)}

load();addEventListener('pointerdown',wake);addEventListener('keydown',wake);
return{ev,win,lose,drum,stop}})();
