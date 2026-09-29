/* 1024 猫咖 · 声音：全部用 WebAudio 现合成，没有音频文件。默认关着，开关记在这台浏览器上。
   Sound.sfx(名字, 参数)；Sound.on；Sound.set(true/false)。进店流程和店里共用这一套。 */
const Sound=(()=>{
let AC=null,on=false;try{on=localStorage.getItem('cat1024.sound')==='1'}catch(e){}
const lastSfx={};let sfxN=0,sfxWin=0;
function init(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){AC=null}}
function tone(f,d,{type='sine',vol=.05,slide=0,delay=0}={}){const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f*slide),t+d);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.02)}
function noise(d,{vol=.03,hp=1200,delay=0}={}){const n=Math.floor(AC.sampleRate*d),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;f.type='highpass';f.frequency.value=hp;g.gain.value=vol;s.connect(f).connect(g).connect(AC.destination);s.start(AC.currentTime+delay)}
const SCALE=[523.25,587.33,659.25,698.46,783.99,880,987.77,1046.5,1174.66,1318.51,1396.91,1567.98];
const arp=(fs,d=.16,type='triangle',vol=.04,gap=.08)=>fs.forEach((f,i)=>tone(f,d,{type,vol,delay:i*gap}));
const SFX={bell:()=>{tone(1318,.5,{vol:.04});tone(1046,.6,{vol:.035,delay:.12})},pop:()=>tone(880,.08,{type:'triangle',slide:1.6,vol:.04}),note:i=>tone(SCALE[(i||0)%12],.35,{type:'triangle',vol:.05}),
  shutter:()=>{noise(.08,{vol:.07});tone(2000,.03,{type:'square',vol:.015,delay:.05})},beep:()=>tone(1500,.08,{type:'square',vol:.02}),meow:()=>tone(620+Math.random()*160,.28,{type:'sawtooth',vol:.012,slide:1.35}),
  purr:()=>tone(55,.5,{type:'sawtooth',vol:.015}),knit:()=>arp([784,988,1318],.18),hang:()=>tone(1046,.3,{type:'triangle',vol:.035}),treat:()=>arp([659,784,988,1318]),
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
  yawn:()=>tone(520,.7,{type:'sine',vol:.03,slide:.55})};
function sfx(k,a){if(!on||!SFX[k])return;init();if(!AC)return;const now=performance.now();if(now-(lastSfx[k]||0)<45)return;if(now-sfxWin>1000){sfxWin=now;sfxN=0}if(++sfxN>16)return;lastSfx[k]=now;try{SFX[k](a)}catch(e){}}
return{sfx,get on(){return on},set(v){on=!!v;try{localStorage.setItem('cat1024.sound',on?'1':'0')}catch(e){}if(on)init()},init:()=>{if(on)init()}}})();
