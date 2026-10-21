/* 1024 现场抽奖 · 舞台（抽奖页 desk.js 用）。设计见 README.md"抽奖的那一幕"。
   一个 256×144 的像素舞台：背后深紫墙、两边红幕、右上一块跑马灯招牌、两盏追光；正中一台巨大的猫头扭蛋机（进店那台，EA.machine），
   台下一群猫围着看。转一下：
     旋钮转 → 扭蛋滚出来、蹦到聚光灯里 → 晃一下、停住，屏息，再晃……（宝可梦收服那样）
     中了：晃满三下，"咔哒"一下冒星星，"叮咚"！白光一闪，扭蛋裂开、奖品卡（页面叠上来的）跳出来，猫群欢呼，两边炮筒喷彩带
     没中：晃一到三下就裂开，冒一团灰烟，猫群一起叹气
   扭蛋的颜色是随机的，不透露结果；奖品卡和彩带的主色跟着几等奖走：一等奖金、二等奖蓝、三等奖赤陶（和奖品海报一套）。
   抽到什么是服务端定的：spin() 开转，结果回来 result(r)；没回来就一直晃着等。服务端说不行 abort()。
   系统开了"减少动态效果"：结果一回来就直接揭晓，不晃、不放彩带。
   依赖：scene-kit（use 之后的 C、R、P1、OL、alpha、disc、box、txt、spark）、pixel-text（PXT）、cat-sprites（drawEmote）、entry-art（EA）、world-play（COATS、COLLARS）、sfx（Sfx，现场音效）。
   Stage.create({onReveal(r), onShown(r)}) → {W, H, draw(t), spin()→true/false, result(r), abort(), ready(on), ph, busy}
   onReveal：扭蛋裂开那一刻（页面在这时把奖品卡叠到舞台上，见 Stage.LAYOUT）；onShown：再过 .6 秒，可以登记了。
   Stage.LAYOUT：舞台上留给页面叠东西的地方（舞台坐标）：board 左边墙上的奖品榜，card 揭晓的奖品卡。 */
const Stage=(()=>{
const W=256,H=144,FLOOR=86,MX=104,MY=118,RX=184,RY=114;
const TIER=t=>['谢谢惠顾','一等奖','二等奖','三等奖'][t]||'';
const TCOL={1:'#e8b83a',2:'#5B9BD5',3:'#d9774f',0:'#9B7EBD'},TLIGHT={1:'#fff0a8',2:'#cfe4f6',3:'#f6c8b0',0:'#d8cce4'};
const ease=k=>k<0?0:k>1?1:k<.5?2*k*k:1-(-2*k+2)**2/2,cl=k=>k<0?0:k>1?1:k,lerp=(a,b,k)=>a+(b-a)*k,rr=(a,b)=>a+Math.random()*(b-a);
const sfx=k=>{try{Sfx.ev(k)}catch(e){}};
const REDUCED=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const BUSY=['turn','roll','hop','shake','still','click','burst'];

/* ---------- 不动的背景：先画进一张小画布，每帧贴上去 ---------- */
let BG=null;
function bg(){if(BG)return BG;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const o=C;use(cv.getContext('2d'));
  // 后墙：深紫，竖条墙板；墙裙
  R(0,0,W,FLOOR,'#2a1f38');for(let x=6;x<W;x+=14)R(x,0,1,FLOOR-10,'#32253f');R(0,FLOOR-10,W,10,'#221a2e');R(0,FLOOR-10,W,1,'#3a2c4c');
  // 舞台地板：一条条木板，越往前越亮一点
  for(let y=FLOOR;y<H;y++){const k=(y-FLOOR)/(H-FLOOR);R(0,y,W,1,k<.5?'#4a2f2a':'#5a3a30');if((y-FLOOR)%7===0)R(0,y,W,1,'#3a2420')}
  for(let row=0;row*7<H-FLOOR;row++){const y=FLOOR+row*7,off=(row%2)*19;for(let x=off;x<W;x+=38)R(x,y+1,1,6,'#3a2420')}
  R(0,FLOOR,W,1,'#6a4436');
  // 两边红幕：一道道褶子；顶上一条幕檐，金穗
  const fold=['#7a1f2e','#962a3a','#a8364a','#8a2434','#6a1a28'];
  for(const side of [0,1])for(let i=0;i<22;i++){const x=side?W-1-i:i,c=fold[Math.floor(i/3)%fold.length],bot=H-Math.round(Math.sin(i/22*Math.PI)*6);R(x,0,1,bot,c)}
  R(0,0,W,7,'#7a1f2e');R(0,7,W,1,'#5e1724');for(let x=0;x<W;x+=8){disc(x+4,7,4,2,'#962a3a')}for(let x=2;x<W;x+=4)R(x,10,1,2,'#e8b83a');
  // 幕布系带
  for(const x of [10,W-11]){R(x-3,58,7,3,'#e8b83a');R(x-2,59,5,1,'#fff0a8')}
  use(o);return BG=cv}

/* ---------- 跑马灯招牌：右上，一圈灯泡一颗颗跑 ---------- */
const SX=150,SY=13,SW=92,SH=28;
function sign(t,hot){box(SX,SY,SW,SH,'#1c1424',OL);R(SX+2,SY+2,SW-4,SH-4,'#241a2e');
  const bulbs=[];for(let x=SX+3;x<SX+SW-2;x+=5){bulbs.push([x,SY+1]);}for(let y=SY+5;y<SY+SH-2;y+=5)bulbs.push([SX+SW-2,y]);
  for(let x=SX+SW-3;x>SX+1;x-=5)bulbs.push([x,SY+SH-2]);for(let y=SY+SH-6;y>SY+2;y-=5)bulbs.push([SX+1,y]);
  const sp=hot?14:5;bulbs.forEach(([x,y],i)=>{const on=(Math.floor(t*sp)+i)%3===0;R(x,y,1,1,on?'#fff0a8':'#8a5a2a');if(on){P1(x-1,y,'#e8b83a');P1(x+1,y,'#e8b83a')}});
  const a='1024',b='扭蛋抽奖',wa=PXT.w(a),wb=PXT.w(b),x0=Math.round(SX+SW/2-(wa+4+wb)/2);PXT.draw(a,x0,SY+7,'#ffd84a',{shadow:OL});PXT.draw(b,x0+wa+4,SY+7,'#fff4dc',{shadow:OL})}

/* ---------- 追光：从顶上两个角打下来，抖动成像素 ---------- */
function beam(x0,tx,ty,w,k){const top=8;for(let y=top;y<ty;y++){const f=(y-top)/(ty-top),cx=lerp(x0,tx,f),hw=lerp(2,w,f);
    for(let x=Math.floor(cx-hw);x<=cx+hw;x++){const e=1-Math.abs(x-cx)/hw;if(EA.dith(x,y,e*.22*k*(.4+.6*f)))P1(x,y,'#fff4dc')}}
  EA.spot(tx,ty+1,w+4,6,{bright:'#5a4060',mid:'#3a2c40',k:Math.min(1,k+.2)})}

/* ---------- 观众：一群猫。左右两边坐着看，前排是背影 ---------- */
const SEAT=[{x:16,y:122,f:'R'},{x:38,y:128,f:'R'},{x:60,y:121,f:'R'},{x:230,y:124,f:'L'},{x:246,y:131,f:'L'},
  {x:26,y:146,b:1},{x:52,y:149,b:1},{x:78,y:146,b:1},{x:132,y:148,b:1},{x:156,y:145,b:1},{x:208,y:148,b:1},{x:232,y:146,b:1}];
function crowd(){let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;const faces=['normal','content','curious','happy','sleepy','smug','blep'];
  return SEAT.map((p,i)=>({...p,look:{coat:Math.floor(rnd()*COATS.length),collar:Math.floor(rnd()*COLLARS.length),face:faces[i%faces.length]},d:rnd()*.35,o:rnd()*4,act:null,next:rnd()*6}))}
// 小气泡：省略号（屏息）；(x,y) 气泡底部中点
function dots(x,y,t){const w=11;R(x-6,y-8,w+2,8,OL);R(x-5,y-7,w,6,'#fff4dc');P1(x-1,y-1,'#fff4dc');P1(x-1,y,OL);
  for(let i=0;i<3;i++)R(x-3+i*3,y-4-(Math.floor(t*4)%3===i?1:0),1,1,'#241a2e')}
function drop(x,y){P1(x,y,'#8fd0f0');R(x-1,y+1,3,2,'#8fd0f0');P1(x,y+1,'#e8f8ff')}   // 汗滴（叹气）

/* ---------- 彩带：两边炮筒往上喷，飘下来；顶上也撒一阵 ---------- */
function confetti(A,t,col){const C2=[col,'#fff4dc','#ffd84a','#f4a6b8','#93f5d2',TLIGHT[A.res.tier]||col];
  const add=(x,y,vx,vy)=>A.fx.push({k:'cf',x,y,vx,vy,t0:t,life:rr(2.4,4),c:C2[Math.floor(Math.random()*C2.length)],w:Math.random()<.5?2:1,ph:rr(0,6)});
  for(let i=0;i<70;i++){add(rr(4,16),H-6,rr(25,75),rr(-150,-90));add(rr(W-16,W-4),H-6,rr(-75,-25),rr(-150,-90))}
  for(let i=0;i<50;i++)add(rr(20,W-20),rr(-30,0),rr(-10,10),rr(10,40))}

function create({onShown,onReveal}={}){
const caps=EA.pile(20,1024),aud=crowd();
const A={ph:'idle',t:0,t0:0,res:null,cap:null,fx:[],dim:0,shakes:0,need:0,flash:0,popT:-9,mood:'idle',moodT:0};
const set=(ph,t)=>{A.ph=ph;A.t0=t};
// 观众的状态：idle 各做各的；watch 刚开转，冒"!"；hold 屏息；cheer 欢呼；sigh 叹气
const setMood=(m,t)=>{A.mood=m;A.moodT=t};

function drawCrowd(t){const m=A.mood,k=t-A.moodT;
  aud.forEach(c=>{const kk=k-c.d;let pose='sit',ex=null,tt=t+c.o,y=c.y,x=c.x,emo=null;
    if(c.b){pose='back'}
    else if(m==='idle'){if(c.act&&t>c.act.end)c.act=null;if(!c.act&&t>c.next){c.act={k:['lick','slowBlink','knead','meow'][Math.floor(Math.random()*4)],t0:t,end:t+2.4};c.next=t+rr(4,9)}if(c.act){pose=c.act.k;tt=t-c.act.t0}}
    else if(m==='watch'){if(kk>0&&kk<.7){pose=c.b?'back':'alert';tt=kk;emo=kk<.6?'bang':null}else ex='curious'}
    else if(m==='hold'){ex='surprise';if(!c.b){const lean=Math.sign(RX-x);x+=A.ph==='shake'?lean:0}}
    else if(m==='cheer'){if(kk>3.5){ex='happy'}else if(kk>0){const hop=Math.abs(Math.sin((kk+c.o)*7))*5;y-=Math.round(hop);if(!c.b){pose=(Math.floor(c.o*10)%3===0)?'dance':'happy';tt=kk}emo=kk<2.6?(Math.floor(c.o*10)%2?'heart':'note'):null}}
    else if(m==='sigh'){if(kk>0&&kk<2.2){ex=Math.floor(c.o*10)%3===0?'cry':'meh';if(!c.b&&Math.floor(c.o*10)%4===1){pose='lie';ex='meh'}}}
    if(pose==='sit'&&ex)EA.cat('sit',c.look,x,y,tt,{face:c.f||'R',ex});else EA.cat(pose,c.look,x,y,tt,{face:c.f||'R'});
    const hy=y-(c.b?22:24);
    if(emo)drawEmote(C,x,hy,emo,t);
    if(m==='hold'&&A.ph==='still'&&!c.b&&Math.floor(c.o*10)%2===0)dots(x+4,hy+2,t-A.t0);
    if(m==='sigh'&&kk>0&&kk<2.2&&!c.b)drop(x+6,y-18+Math.round(cl(kk/2.2)*4))})}

function draw(t){A.t=t;const k=t-A.t0;let turn=0,flap=0,jig=0,jx=0;
  // —— 时间线 ——
  const R0=A.res;
  if(A.ph==='turn'){turn=ease(cl(k/.9));jig=k<.9?Math.sin(cl(k/.9)*Math.PI)+.3:0;jx=k<.9?Math.round(Math.sin(k*40)*.8):0;if(k<.9&&Math.floor(k*4)!==A.rat){A.rat=Math.floor(k*4);sfx('crank')}
    if(k>.9&&!A.cap){const i=caps.reduce((b,c,j)=>c.y>caps[b].y?j:b,0);caps.splice(i,1);caps.push(...EA.pile(1,Math.floor(t*1000)%9973+1));A.cap={x:MX,y:MY-8,r:5,a:0,c:Math.floor(Math.random()*6)};sfx('toss')}
    flap=k<.9?0:k<1.1?(k-.9)/.2:1;if(k>1.1){set('roll',t);sfx('roll')}}
  else if(A.ph==='roll'){flap=Math.max(0,1-k/.3);const q=cl(k/.6);A.cap.x=MX+2+q*28;A.cap.y=q<.3?lerp(MY-8,MY+3,q/.3):MY+3-Math.abs(Math.sin((q-.3)/.7*Math.PI*2))*3*(1-q);A.cap.a=q*6;
    if(k>.6){A.hop={x:A.cap.x,y:A.cap.y};set('hop',t)}}
  else if(A.ph==='hop'){const q=ease(cl(k/.7));A.cap.x=lerp(A.hop.x,RX,q);A.cap.y=lerp(A.hop.y,RY-16,q)-Math.sin(cl(k/.7)*Math.PI)*30;A.cap.r=Math.round(lerp(5,16,q));A.cap.a*=1-q;
    if(k>.7){set('still',t);A.cap.a=0;sfx('land');try{Sfx.drum()}catch(e){}for(let i=0;i<10;i++)A.fx.push({k:'dust',x:RX+rr(-10,10),y:RY,vx:rr(-30,30),vy:rr(-20,-5),t0:t,life:.5});A.shakes=0;setMood('hold',t)}}
  // 晃一下（.5 秒）、停住屏息（.7 秒）……中了晃满三下再"咔哒"；没中晃到 need 下就裂开。结果没回来就一直晃
  else if(A.ph==='shake'){const q=cl(k/.5);A.cap.a=Math.sin(q*Math.PI*2)*.4*(1-q*.3);A.cap.hopY=-Math.round(Math.sin(q*Math.PI)*2);
    if(k>.5){A.cap.a=0;A.cap.hopY=0;A.shakes++;set('still',t)}}
  else if(A.ph==='still'){const pause=A.shakes===0?.35:.7;
    if(k>pause){if(R0&&!A.need)A.need=R0.tier>0?3:1+Math.floor(Math.random()*3);
      if(A.need&&A.shakes>=A.need){if(R0.tier>0){set('click',t);sfx('lock')}else burst(t)}else{set('shake',t);sfx('wob')}}}
  else if(A.ph==='click'){if(k>.55)burst(t)}
  else if(A.ph==='burst'&&k>.6){set('shown',t);onShown&&onShown(R0)}
  // —— 灯光：平时两盏追光来回扫；转的时候打在扭蛋机上；屏息时打在扭蛋上、四周暗下来；中了乱扫 ——
  const target=A.ph==='idle'||A.ph==='ready'?null:['turn','roll'].includes(A.ph)?{x:MX,y:MY}:{x:RX,y:RY};
  const want=['still','shake','click'].includes(A.ph)?.55:['turn','roll','hop'].includes(A.ph)?.35:A.mood==='sigh'?.25:0;A.dim+=(want-A.dim)*.08;
  // —— 画 ——
  C.drawImage(bg(),0,0);sign(t,A.mood==='cheer');
  if(A.dim>.01)alpha(A.dim,()=>R(0,0,W,H,'#0b0710'));
  const party=A.mood==='cheer'&&t-A.moodT<4;
  const L=target&&!party?target:{x:128+Math.sin(t*(party?3:.45))*90,y:RY+2},Rt=target&&!party?target:{x:128+Math.sin(t*(party?2.6:.37)+2)*90,y:RY+2};
  beam(30,L.x,L.y,party?18:14,1);beam(W-30,Rt.x,Rt.y,party?18:14,1);
  EA.spot(MX,MY+1,46,9);EA.machine(MX+jx,MY,t,{caps,turn,flap,jig,wiggle:A.ph==='ready'?1:0});
  const lit=!['idle','ready','turn'].includes(A.ph);if(lit)EA.spot(RX,RY+1,26,6);
  // 揭晓：中了是光芒、白光一闪；没中是一团灰烟
  const pa=t-A.popT;
  if(R0&&(A.ph==='burst'||A.ph==='shown')){const won=R0.tier>0;
    if(won)EA.rays(RX,RY-14,46+Math.min(pa,1)*24,t,TLIGHT[R0.tier]);
    if(A.bot){const q=cl(pa/.6);if(q<1)alpha(1-q,()=>EA.capsule(A.bot.x,A.bot.y+q*5,16,0,A.cap.c,{part:'bot'}))}
    if(A.top&&pa<3)EA.capsule(A.top.x+A.top.vx*pa,A.top.y+A.top.vy*pa+80*pa*pa,16,A.top.va*pa,A.cap.c,{part:'top'})}
  if(A.cap&&['roll','hop','shake','still','click'].includes(A.ph)){EA.capsule(A.cap.x,A.cap.y+(A.cap.hopY||0),A.cap.r,A.cap.a,A.cap.c);
    if(A.ph==='click')for(let i=0;i<5;i++){const a=i*1.26+k*5,r=10+k*12;spark(Math.round(RX+Math.cos(a)*r),Math.round(RY-16+Math.sin(a)*r*.7),t+i*.2)}}
  drawCrowd(t);
  // 粒子：灰尘、灰烟、彩带
  A.fx=A.fx.filter(f=>{const a=t-f.t0;if(a>f.life)return false;
    if(f.k==='cf'){const x=Math.round(f.x+f.vx*a+Math.sin(a*6+f.ph)*3),y=Math.round(f.y+f.vy*a+70*a*a);if(y>H+2)return false;R(x,y,f.w,Math.floor(a*8+f.ph)%3?1:2,f.c);return true}
    const x=Math.round(f.x+f.vx*a),y=Math.round(f.y+f.vy*a+(f.k==='dust'?40*a*a:-8*a));
    if(f.k==='puff'){const r=Math.round(2+a*6);alpha(cl(1-a/f.life)*.8,()=>disc(x,y,r,r,'#8a7a9a'))}else P1(x,y,'#b9a08a');return true});
  if(A.flash>0){alpha(A.flash,()=>R(0,0,W,H,'#ffffff'));A.flash=Math.max(0,A.flash-.06)}}

function burst(t){const c=A.cap,r=A.res,won=r.tier>0;set('burst',t);A.popT=t;onReveal&&onReveal(r);
  A.top={x:c.x,y:c.y,vx:(Math.random()<.5?-1:1)*40,vy:won?-90:-50,va:(Math.random()<.5?-1:1)*7};A.bot={x:c.x,y:c.y};
  if(won){A.flash=REDUCED?0:.85;try{Sfx.win(r.tier)}catch(e){}setMood('cheer',t+.15);if(!REDUCED)confetti(A,t,TCOL[r.tier])}
  else{try{Sfx.lose()}catch(e){}for(let i=0;i<14;i++)A.fx.push({k:'puff',x:c.x+rr(-6,6),y:c.y+rr(-6,4),vx:rr(-14,14),vy:rr(-18,-4),t0:t,life:rr(.7,1.2)});setMood('sigh',t+.2)}}

return{W,H,draw,TIER,get ph(){return A.ph},get busy(){return BUSY.includes(A.ph)},
  spin(){if(BUSY.includes(A.ph))return false;Object.assign(A,{res:null,cap:null,top:null,bot:null,need:0,shakes:0,rat:-1});A.fx=A.fx.filter(f=>f.k==='cf');set('turn',A.t);setMood('watch',A.t);sfx('crank');return true},
  // 结果回来：减少动态效果时直接揭晓
  result(r){A.res=r;if(REDUCED){if(!A.cap)A.cap={x:RX,y:RY-16,r:16,a:0,c:2};A.cap.x=RX;A.cap.y=RY-16;A.cap.r=16;burst(A.t);A.ph='shown';onShown&&onShown(r)}},
  abort(){try{Sfx.stop()}catch(e){}A.ph='idle';A.cap=null;A.res=null;setMood('idle',A.t)},
  ready(on){if(!BUSY.includes(A.ph)){A.ph=on?'ready':'idle';if(A.mood!=='idle'&&A.t-A.moodT>2.5)setMood('idle',A.t)}}}}
return{create,TIER,W,H,LAYOUT:{board:{x:25,y:14,w:52,h:70},card:{x:RX-60,y:40,w:120,h:68}}}})();
