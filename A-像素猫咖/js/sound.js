/* 1024 猫咖 · 声音：全部用 WebAudio 现合成，没有音频文件。默认关着，开关记在这台浏览器上（设计见 docs/店内设计.md 第六节）。
   Sound.sfx(名字, 参数)；Sound.on；Sound.set(true/false)。进店流程和店里共用这一套。
   - 音效：一次性的短声音。同一种 45 毫秒里只响一次，一秒最多 16 个。
   - 环境声和点唱机：店里（world-ambient.js）每 0.2 秒告诉这里你附近该有多大的流水、虫鸣、青蛙、壁炉、夜风、音乐（Sound.amb({...})），这里慢慢调大调小。
     点唱机三首曲子是这里写的小乐谱（Sound.TRACKS 是曲名）。
   - 所有声音过一条总线：音效一路、环境声一路（比音效小）、音乐一路（再小一点），最后过一道压限，不会突然很响。页面切到后台就停。 */
const Sound=(()=>{
let AC=null,on=false,MS=null,BUS={};try{on=localStorage.getItem('cat1024.sound')==='1'}catch(e){}
const lastSfx={};let sfxN=0,sfxWin=0;
function init(){try{if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();const comp=AC.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;
      MS=AC.createGain();MS.gain.value=.9;MS.connect(comp).connect(AC.destination);for(const [k,v] of [['sfx',1],['amb',.55],['mus',0]]){const g=AC.createGain();g.gain.value=v;g.connect(MS);BUS[k]=g}}
    if(AC.state==='suspended'&&!document.hidden)AC.resume()}catch(e){AC=null}}
const out=b=>BUS[b||'sfx']||AC.destination;
function tone(f,d,{type='sine',vol=.05,slide=0,delay=0,bus,attack=0}={}){const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
  if(attack){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+attack)}else g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(out(bus));o.start(t);o.stop(t+d+.02)}
let NB=null;const nbuf=()=>{if(NB)return NB;const n=AC.sampleRate*2,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;return NB=b};
function noise(d,{vol=.03,hp=1200,lp=0,delay=0,bus}={}){const t=AC.currentTime+delay,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nbuf();f.type='highpass';f.frequency.value=hp;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);let n=s.connect(f);if(lp){const l=AC.createBiquadFilter();l.type='lowpass';l.frequency.value=lp;n=n.connect(l)}n.connect(g).connect(out(bus));s.start(t,Math.random()*1.5);s.stop(t+d+.02)}
// 猫叫：锯齿波过一个扫频的低通，"咪——呜"；v 是这只猫的声线 {f 音高, d 长短, s 往上还是往下滑, two 连叫两声}
function meow(v={},delay=0,vol=.032){const f=v.f||620+Math.random()*160,d=v.d||.28,t=AC.currentTime+delay,o=AC.createOscillator(),lp=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';
  o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*(v.s||1.3),t+d*.35);o.frequency.exponentialRampToValueAtTime(f*(v.s||1.3)*.82,t+d);lp.type='lowpass';lp.Q.value=6;
  lp.frequency.setValueAtTime(700,t);lp.frequency.exponentialRampToValueAtTime(2600,t+d*.4);lp.frequency.exponentialRampToValueAtTime(900,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(lp).connect(g).connect(out());o.start(t);o.stop(t+d+.05);if(v.two&&!delay)meow({...v,two:0},d+.06,vol*.8)}
const SCALE=[523.25,587.33,659.25,698.46,783.99,880,987.77,1046.5,1174.66,1318.51,1396.91,1567.98];
const arp=(fs,d=.16,type='triangle',vol=.04,gap=.08)=>fs.forEach((f,i)=>tone(f,d,{type,vol,delay:i*gap}));
// 脚步：木地板、地毯、草地、石板、瓷砖、栈桥
const STEP={wood:()=>{noise(.05,{vol:.022,hp:300,lp:1400});tone(170,.04,{vol:.01})},carpet:()=>noise(.06,{vol:.012,hp:200,lp:600}),grass:()=>noise(.09,{vol:.016,hp:2200}),
  stone:()=>{noise(.035,{vol:.02,hp:1600});tone(320,.03,{type:'triangle',vol:.006})},tile:()=>{noise(.03,{vol:.016,hp:2800});tone(900,.02,{type:'triangle',vol:.004})},plank:()=>{tone(140,.07,{vol:.022,slide:.8});noise(.05,{vol:.012,hp:500,lp:1600})},
  rubber:()=>noise(.04,{vol:.01,hp:300,lp:900})};
const SFX={bell:()=>{tone(1318,.5,{vol:.04});tone(1046,.6,{vol:.035,delay:.12})},pop:()=>tone(880,.08,{type:'triangle',slide:1.6,vol:.04}),note:i=>tone(SCALE[(i||0)%12],.35,{type:'triangle',vol:.05}),
  shutter:()=>{noise(.08,{vol:.07});tone(2000,.03,{type:'square',vol:.015,delay:.05})},beep:()=>tone(1500,.08,{type:'square',vol:.02}),meow:v=>meow(v),
  purr:()=>{for(let i=0;i<4;i++)tone(46+i%2*4,.22,{type:'sawtooth',vol:.012,delay:i*.24,attack:.06})},knit:()=>arp([784,988,1318],.18),hang:()=>tone(1046,.3,{type:'triangle',vol:.035}),treat:()=>arp([659,784,988,1318]),
  alarm:()=>arp([660,440,660],.18,'square',.015,.2),fanfare:()=>arp([523,659,784,1046,1318],.22,'triangle',.045,.1),kick:()=>tone(160,.08,{slide:.5,vol:.06}),goal:()=>arp([784,1046,1568],.15,'square',.02),
  print:()=>noise(.5,{vol:.015,hp:2500}),clack:()=>tone(300,.06,{type:'square',vol:.025}),rustle:()=>noise(.35,{vol:.04,hp:3000}),stamp:()=>tone(120,.1,{vol:.06}),scratch:()=>noise(.4,{vol:.025,hp:1800}),toss:()=>tone(400,.2,{slide:2,vol:.015}),
  disc:()=>arp([1046,1318],.12,'triangle',.03,.07),page:()=>noise(.12,{vol:.03,hp:3500}),
  // 进店流程
  tick:()=>tone(2400,.015,{type:'square',vol:.008}),click:()=>{noise(.02,{vol:.05,hp:4000});tone(1800,.02,{type:'square',vol:.01})},
  crunch:()=>{noise(.18,{vol:.03,hp:600});tone(220,.12,{type:'square',vol:.012,slide:.5})},
  coin:()=>{tone(1976,.12,{type:'square',vol:.018});tone(2637,.35,{type:'square',vol:.016,delay:.07})},
  ratchet:()=>{noise(.03,{vol:.05,hp:2500});tone(240,.04,{type:'square',vol:.02})},
  roll:()=>{for(let i=0;i<5;i++)tone(180+i*20,.05,{type:'triangle',vol:.03,delay:i*.07})},
  crack:()=>{noise(.12,{vol:.08,hp:1500});tone(660,.1,{type:'triangle',vol:.04,slide:2})},
  reveal:()=>arp([784,988,1175,1568],.3,'triangle',.045,.09),
  engrave:()=>{noise(.06,{vol:.03,hp:5000});tone(1568,.05,{type:'triangle',vol:.02,delay:.03})},
  whoosh:()=>noise(.5,{vol:.05,hp:700}),land:()=>{tone(90,.18,{slide:.6,vol:.08});noise(.2,{vol:.05,hp:900})},
  step:()=>tone(1318,.12,{type:'triangle',vol:.03}),ok:()=>arp([988,1318],.14,'triangle',.035,.08),no:()=>tone(220,.16,{type:'square',vol:.015,slide:.8}),
  yawn:()=>tone(520,.7,{type:'sine',vol:.03,slide:.55}),
  // 咖啡机、钓鱼、划船
  pour:()=>{noise(.9,{vol:.02,hp:900});tone(330,.25,{type:'sine',vol:.02,slide:1.4,delay:.6})},splash:()=>{noise(.25,{vol:.05,hp:1400});tone(240,.12,{type:'sine',vol:.03,slide:.6})},
  bite:()=>{tone(1200,.06,{type:'square',vol:.02});tone(1500,.08,{type:'square',vol:.02,delay:.08})},reel:()=>{for(let i=0;i<8;i++)tone(900+i*60,.03,{type:'square',vol:.012,delay:i*.04})},
  row:()=>{noise(.18,{vol:.03,hp:1000});tone(180,.15,{type:'sine',vol:.02,slide:.7,delay:.05})},
  // 小游戏
  collect:()=>{tone(988,.08,{type:'triangle',vol:.03});tone(1318,.14,{type:'triangle',vol:.03,delay:.07});noise(.12,{vol:.02,hp:2500})},bump:()=>{tone(110,.16,{vol:.07,slide:.6});noise(.12,{vol:.03,hp:400,lp:1200})},
  whirr:()=>{tone(140,.75,{type:'sawtooth',vol:.008,slide:1.15});noise(.7,{vol:.008,hp:900,lp:2400})},clunk:()=>{tone(200,.06,{type:'square',vol:.02});noise(.05,{vol:.03,hp:800,lp:3000})},
  prize:()=>{arp([784,988,1175,1568,1976],.14,'triangle',.035,.07);tone(2637,.4,{type:'sine',vol:.015,delay:.4})},
  boom:()=>{tone(70,.6,{vol:.07,slide:.5});noise(.5,{vol:.04,hp:200,lp:900});for(let i=0;i<6;i++)noise(.03,{vol:.015,hp:3000,delay:.3+Math.random()*.6})},
  creak:()=>{tone(260,.28,{type:'sawtooth',vol:.007,slide:1.3});tone(330,.2,{type:'sawtooth',vol:.005,slide:.8,delay:.12})},
  // 新添的东西
  quack:()=>{for(const d of [0,.18]){tone(300,.12,{type:'sawtooth',vol:.02,slide:.7,delay:d});noise(.1,{vol:.012,hp:1200,lp:2600,delay:d})}},
  croak:()=>{for(let i=0;i<3;i++)tone(110,.07,{type:'square',vol:.018,slide:1.3,delay:i*.08})},
  hoot:()=>{tone(392,.32,{vol:.03,slide:.94,attack:.05});tone(350,.5,{vol:.03,slide:.92,attack:.06,delay:.42})},flap:()=>{for(let i=0;i<4;i++)noise(.06,{vol:.025,hp:600,lp:2200,delay:i*.11})},
  micmeow:v=>{meow(v,0,.05);meow(v,.22,.022);meow(v,.44,.01)},ding:()=>{tone(2093,.6,{vol:.025});tone(3136,.4,{vol:.012,delay:.02})},
  grind:()=>{for(let i=0;i<10;i++)noise(.06,{vol:.025,hp:1500,lp:5000,delay:i*.07});tone(90,.7,{type:'sawtooth',vol:.008})},
  marker:()=>{for(let i=0;i<3;i++)tone(2400+i*300,.05,{type:'square',vol:.004,slide:1.2,delay:i*.09})},spin:()=>{for(let i=0;i<6;i++)noise(.05,{vol:.015,hp:2000,delay:i*.12})},
  boing:()=>tone(220,.35,{type:'triangle',vol:.03,slide:2.2}),twinkle:()=>arp([1568,2093,2637,3136],.25,'sine',.018,.12),
  bonk:()=>{tone(520,.07,{type:'square',vol:.02});tone(260,.12,{vol:.03,delay:.04})},
  // 猫和猫
  groom:()=>{for(let i=0;i<3;i++)noise(.08,{vol:.012,hp:2500,lp:6000,delay:i*.22})},boop:()=>tone(1760,.06,{vol:.025,slide:1.4}),
  scuffle:()=>{for(let i=0;i<5;i++){noise(.05,{vol:.02,hp:1200,delay:i*.09});if(i%2)tone(700+Math.random()*300,.06,{type:'triangle',vol:.008,delay:i*.09})}},
  step2:k=>{(STEP[k]||STEP.wood)()}};
function sfx(k,a){if(!on||!SFX[k])return;init();if(!AC)return;const now=performance.now();if(now-(lastSfx[k]||0)<45)return;if(now-sfxWin>1000){sfxWin=now;sfxN=0}if(++sfxN>16)return;lastSfx[k]=now;try{SFX[k](a)}catch(e){}}

/* ---------- 环境声：几条一直在的（流水、夜风、壁炉的低音），按大小推拉；虫鸣、青蛙、壁炉的噼啪是隔一会儿响一下 ---------- */
const LOOPS={};let LV={},lastT=0;
function loop(k,mk){if(LOOPS[k])return LOOPS[k];const s=AC.createBufferSource(),g=AC.createGain();s.buffer=nbuf();s.loop=true;g.gain.value=0;const tail=mk(s);tail.connect(g).connect(BUS.amb);s.start();return LOOPS[k]={s,g}}
const lpf=(f,q=.7)=>{const b=AC.createBiquadFilter();b.type='lowpass';b.frequency.value=f;b.Q.value=q;return b},bpf=(f,q=1)=>{const b=AC.createBiquadFilter();b.type='bandpass';b.frequency.value=f;b.Q.value=q;return b};
const MAKE={river:s=>s.connect(lpf(620)),brook:s=>s.connect(bpf(2600,.8)),wind:s=>s.connect(lpf(380)),fire:s=>s.connect(lpf(180))};
const GAIN={river:.11,brook:.05,wind:.12,fire:.07};
let chirpT=0,croakT=0,crackT=0,purrT=0;
function amb(lv){if(!on||!AC||AC.state!=='running')return;LV=lv||{};const t=AC.currentTime,dt=Math.min(.5,t-(lastT||t));lastT=t;
  for(const k in MAKE){const v=(LV[k]||0)*GAIN[k]*(k==='wind'?.7+.3*Math.sin(t*.35):k==='river'?.85+.15*Math.sin(t*.9):1);if(v<=0&&!LOOPS[k])continue;const L=loop(k,MAKE[k]);L.g.gain.setTargetAtTime(v,t,.4)}
  // 虫鸣：两只蟋蟀，一串三四声
  if(LV.crickets>0&&(chirpT-=dt)<=0){chirpT=.4+Math.random()*1.6;const f=Math.random()<.5?4300:4750,n=3+(Math.random()*2|0);for(let i=0;i<n;i++)tone(f,.025,{vol:.006*LV.crickets,delay:i*.045,bus:'amb'})}
  if(LV.frogs>0&&(croakT-=dt)<=0){croakT=2+Math.random()*5;const d=Math.random()*.2;for(let i=0;i<2+(Math.random()*2|0);i++)tone(95+Math.random()*20,.08,{type:'square',vol:.008*LV.frogs,slide:1.3,delay:d+i*.1,bus:'amb'})}
  if(LV.fire>0&&(crackT-=dt)<=0){crackT=.08+Math.random()*.35;noise(.015+Math.random()*.03,{vol:.03*LV.fire,hp:1800,bus:'amb'})}
  if(LV.purr>0&&(purrT-=dt)<=0){purrT=1.1;for(let i=0;i<4;i++)tone(44+i%2*5,.22,{type:'sawtooth',vol:.01*LV.purr,delay:i*.26,attack:.06,bus:'amb'})}
  music(LV.music||0,LV.track||0)}
function ambStop(){if(!AC)return;const t=AC.currentTime;for(const k in LOOPS){const L=LOOPS[k];L.g.gain.setTargetAtTime(0,t,.15);try{L.s.stop(t+.8)}catch(e){}delete LOOPS[k]}if(BUS.mus)BUS.mus.gain.setTargetAtTime(0,t,.1);M.on=false}

/* ---------- 点唱机：三首小曲（原创），按拍子往前排 0.4 秒的音符 ---------- */
// 一个音：[第几拍, MIDI 音高, 几拍长, 乐器]；乐器：b 贝斯、c 和弦、l 旋律、m 八音盒、h 镲、s 军鼓、k 底鼓
const mid=n=>440*Math.pow(2,(n-69)/12);
const CHORD=(beat,notes,len,inst='c')=>notes.map(n=>[beat,n,len,inst]);
const TR=[
  {n:'猫步爵士',bpm:112,len:16,notes:[
    ...[[0,38],[1,41],[2,45],[3,48],[4,43],[5,41],[6,38],[7,35],[8,36],[9,40],[10,43],[11,47],[12,33],[13,37],[14,40],[15,43]].map(([b,n])=>[b,n,.9,'b']),
    ...[[0,[65,69,72]],[4,[65,71,74]],[8,[64,67,71]],[12,[61,67,69]]].flatMap(([b,ns])=>[...CHORD(b+1.66,ns,.3),...CHORD(b+3,ns,.3)]),
    ...[[0,69,.66],[.66,72,.34],[1,74,1],[2,72,.66],[2.66,69,.34],[3,65,1],[4,67,.66],[4.66,71,.34],[5,74,.66],[5.66,72,.34],[6,71,1],[7,67,1],
      [8,64,.66],[8.66,67,.34],[9,71,1],[10,72,.66],[10.66,71,.34],[11,67,1],[12,69,.66],[12.66,73,.34],[13,76,1],[14,73,.66],[14.66,69,.34],[15,67,1]].map(([b,n,l])=>[b,n+12,l,'l']),
    ...Array.from({length:16},(_,i)=>[i+.66,0,.1,'h'])]},
  {n:'毛线球圆舞曲',bpm:92,len:24,notes:[
    ...[[0,48],[3,45],[6,41],[9,43],[12,48],[15,45],[18,50],[19.5,43],[21,48]].map(([b,n])=>[b,n,1.2,'b']),
    ...[[0,[64,67,72]],[3,[64,69,72]],[6,[65,69,72]],[9,[62,67,71]],[12,[64,67,72]],[15,[64,69,72]],[18,[62,65,69]],[21,[64,67,72]]].flatMap(([b,ns])=>[...CHORD(b+1,ns,.8,'c'),...CHORD(b+2,ns,.8,'c')]),
    ...[[0,76,1],[1,79,1],[2,84,1],[3,81,1.5],[4.5,79,.5],[5,76,1],[6,77,1],[7,81,1],[8,84,1],[9,83,2],[11,79,1],[12,76,1],[13,79,1],[14,84,1],[15,81,1],[16,79,1],[17,76,1],[18,74,1],[19,77,1],[20,71,1],[21,72,3]].map(([b,n,l])=>[b,n,l,'m'])]},
  {n:'1024 小进行曲',bpm:124,len:16,notes:[
    ...[[0,36],[2,43],[4,41],[6,48],[8,43],[10,50],[12,36],[14,43]].map(([b,n])=>[b,n,.8,'b']),
    ...[[0,[60,64,67]],[4,[60,65,69]],[8,[59,62,67]],[12,[60,64,67]]].flatMap(([b,ns])=>[...CHORD(b+1,ns,.35),...CHORD(b+3,ns,.35)]),
    ...[[0,72,.5],[1,74,.5],[1.5,77,.5],[2,79,1],[3,77,.5],[3.5,76,.5],[4,77,.5],[5,81,.5],[5.5,79,.5],[6,77,1],[7,76,1],[8,74,.5],[8.5,76,.5],[9,77,.5],[9.5,79,.5],[10,81,1],[11,79,1],[12,76,.5],[12.5,74,.5],[13,72,1],[14,79,.5],[15,72,1]].map(([b,n,l])=>[b,n,l,'l']),
    ...Array.from({length:16},(_,i)=>[i,0,.1,i%2?'s':'k'])]}];
TR.forEach(T=>T.notes.sort((a,b)=>a[0]-b[0]));
const INST={b:(f,t,d)=>tone(f,d,{type:'triangle',vol:.06,delay:t,bus:'mus',attack:.01}),c:(f,t,d,w)=>tone(f,d,{type:w?'sine':'triangle',vol:.016,delay:t,bus:'mus',attack:.01}),
  l:(f,t,d,w,k)=>tone(f,d,{type:k===2?'square':'triangle',vol:k===2?.012:.03,delay:t,bus:'mus',attack:.015}),m:(f,t,d)=>{tone(f,Math.max(.5,d),{vol:.035,delay:t,bus:'mus'});tone(f*2,.3,{vol:.008,delay:t,bus:'mus'})},
  h:(f,t)=>noise(.025,{vol:.01,hp:7000,delay:t,bus:'mus'}),s:(f,t)=>noise(.08,{vol:.02,hp:1500,delay:t,bus:'mus'}),k:(f,t)=>tone(110,.12,{vol:.06,slide:.45,delay:t,bus:'mus'})};
const M={on:false,track:-1,i:0,t0:0};
function music(level,track){if(!AC)return;const t=AC.currentTime;BUS.mus.gain.setTargetAtTime(Math.min(1,level)*.55,t,.5);if(level<=.01){M.on=false;return}
  const T=TR[track%TR.length],spb=60/T.bpm;if(!M.on||M.track!==track){M.on=true;M.track=track;M.i=0;M.t0=t+.1}
  // 往前排 0.6 秒
  for(let n=0;n<200;n++){if(M.i>=T.notes.length){M.i=0;M.t0+=T.len*spb}const e=T.notes[M.i],at=M.t0+e[0]*spb;if(at>t+.6)break;M.i++;if(at<t-.05)continue;
    INST[e[3]](mid(e[1]||60),at-t,e[2]*spb*.95,track===1,track)}}
// 页面切到后台就停；切回来接着
document.addEventListener('visibilitychange',()=>{if(!AC)return;if(document.hidden)AC.suspend();else if(on)AC.resume()});
// 点唱机隔 0.2 秒才被叫一次，排得再勤一点，免得卡顿时断拍
setInterval(()=>{if(on&&AC&&AC.state==='running'&&M.on)music(LV.music||0,LV.track||0)},150);
return{sfx,amb,TRACKS:TR.map(T=>T.n),get on(){return on},set(v){on=!!v;try{localStorage.setItem('cat1024.sound',on?'1':'0')}catch(e){}if(on)init();else ambStop()},init:()=>{if(on)init()}}})();
