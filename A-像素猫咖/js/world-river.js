/* 1024 猫咖 · 河边：钓鱼、小船、河里的鱼影（设计见 docs/店内设计.md 第三节）。依赖 world-acts.js、map-1f.js。
   - 钓鱼：三根钓竿（栈桥尽头、这边岸上、对岸）。坐下甩竿 → 浮漂漂着 → 往下一沉、头上冒"!"，这时候按（E 或点一下）就钓上来一条；沉之前按、或者沉了太久才按，鱼就跑了。
     钓上来的看一眼、放回河里（没有鱼受伤）。钓到过哪几种记在你的猫身上（图鉴的存档里）。别的猫也会来钓，一根钓竿一次一只。
   - 小船：拴在栈桥边，能坐两只。坐满两只，或者你坐上去按一下，船就解开缆绳顺着河漂到下游，再划回来；船在河上的时候下不了船。
   - 河里游着几条鱼的影子，猫会盯着看。 */
const FISH_KINDS=[{id:'jiyu',n:'小鲫鱼',w:28,sz:[8,15],col:'#9aa8b0'},{id:'liyu',n:'鲤鱼',w:18,sz:[20,40],col:'#c8a050'},{id:'jinli',n:'锦鲤',w:12,sz:[25,45],col:'#f08a4a'},
  {id:'guiyu',n:'鳜鱼',w:9,sz:[18,35],col:'#8a9a6a'},{id:'niqiu',n:'泥鳅',w:11,sz:[10,18],col:'#6a5a4a'},{id:'xia',n:'小河虾',w:10,sz:[4,8],col:'#e0806a'},
  {id:'jinyu',n:'金鱼',w:3,sz:[6,12],col:'#ffd84a',rare:1},{id:'boot',n:'旧靴子',w:2,col:'#6a5040',junk:1},{id:'yarn',n:'一颗毛线球',w:1.5,col:'#e0533d',junk:1}];
// 钓上来那一下举起来的样子：一条小鱼（或一只靴子、一颗毛线球）
function caughtPx(x,y,k,t){const f=FISH_KINDS.find(f=>f.id===k)||FISH_KINDS[0];if(k==='boot'){grid(x-4,y-6,[".oooo...","owwwo...","owwwo...","owwwoooo","owwwwwwo","oooooooo"],{o:OL,w:f.col});return}
  if(k==='yarn'){yarnBall(x,y-3,3,0,Math.floor(t*8));return}const s=Math.round(Math.sin(t*14));grid(x-6,y-4+s,["...oooo..o","..obbbbo.oo",".obbbebboao","obbbbbbbbao",".oddddddo.o","..oooooo...","........."],{o:OL,b:f.col,d:tint(f.col,.8),a:tint(f.col,.7),e:'#241a2e'})}

WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,speak,say,sfx,news,after,T,stay,unclaim,dist,idle,settle,setK}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,tick=f=>A.tickers.push(f),atMe=(p,d=220)=>A.play&&near(me,p,d);
const pickFish=()=>{const s=FISH_KINDS.reduce((a,f)=>a+f.w,0);let r=Math.random()*s;for(const f of FISH_KINDS)if((r-=f.w)<=0)return f;return FISH_KINDS[0]};
// 钓到过哪几种：存在图鉴那份存档里（成品里跟着账号）
const log=()=>A.guide.fishLog();

/* ---------- 钓鱼：三根钓竿，各钓各的 ---------- */
const SP=P.fishSpots;S.fishing=SP.map(()=>null);S.fishShow=null;let bucketN=0;
const fishOf=c=>S.fishing.find(st=>st&&st.c===c);
function cast(st){st.ph='cast';st.t0=now();if(atMe(SP[st.i]))sfx('splash');after(.6,()=>{if(S.fishing[st.i]===st){st.ph='wait';st.until=now()+rr(3,8)}})}
function catchIt(st){const c=st.c,f=pickFish(),cm=f.sz?Math.round(rr(f.sz[0],f.sz[1])):0;S.fishShow={k:f.id,c,t0:now()};st.ph='show';st.t0=now();if(atMe(c))sfx('reel');if(st.i===0)bucketN=Math.min(3,bucketN+1);
  if(c.me){const L=log(),first=!L[f.id];L[f.id]=(L[f.id]||0)+1;A.guide.save();const kinds=FISH_KINDS.filter(k=>!k.junk&&L[k.id]).length;
    if(f.id==='yarn'){say('钓上来一颗毛线球……不知道谁掉进河里的。拧干了，放回门厅的篮子里');S.baskets[0].push({ci:Math.floor(Math.random()*5),kind:rnd(Object.keys(KNIT)),note:'',knit:false})}
    else if(f.id==='boot')say('钓上来一只旧靴子。……放回去吧');
    else say(`钓上来一条${f.n}（${cm} 厘米）${first?'，第一次钓到！':''}看一眼，放回河里`+(kinds>1?` · 钓到过 ${kinds} 种`:''));
    if(f.rare)news('你钓上来一条金鱼！')}
  else if(f.rare)news(`${c.name} 钓上来一条金鱼`);
  emote(c,f.junk?'q':'heart',1.6);after(1.8,()=>{if(S.fishing[st.i]===st){st.ph='wait';st.until=now()+rr(4,9);if(!c.me&&Math.random()<.5)leaveFish(c)}})}
function leaveFish(c){if(c.place)A.leavePlace(c);else run(c,[{fn:unclaim}])}
function fishAct(c){const st=fishOf(c);if(!st)return true;
  if(st.ph==='bite'){catchIt(st);return true}
  if(st.ph==='wait'){st.ph='miss';st.t0=now();sfx('splash');if(c.me)say('收早了，鱼还没咬钩，吓跑了。再等等');after(1,()=>{if(S.fishing[st.i]===st)cast(st)});return true}
  return true}
tick(()=>{S.fishing.forEach((st,i)=>{if(!st)return;if(st.c.gone){S.fishing[i]=null;return}
  if(st.ph==='wait'&&now()>st.until){st.ph='bite';st.t0=now();emote(st.c,'bang',1.1);if(st.c.me)sfx('bite');
    if(!st.c.me){const hit=Math.random()<.6;after(rr(.25,.8),()=>{if(S.fishing[i]===st&&st.ph==='bite'){if(hit)catchIt(st);else{st.ph='wait';st.until=now()+rr(3,7)}}})}}
  if(st.ph==='bite'&&now()-st.t0>1.1){st.ph='wait';st.until=now()+rr(3,7);if(st.c.me)say('浮漂又浮上来了：鱼跑了。下次一沉就收竿')}});
  if(S.fishShow&&now()-S.fishShow.t0>1.8)S.fishShow=null});
SP.forEach((sp,i)=>T({id:'fish'+i,n:'钓竿',hit:[sp.x+(sp.face==='L'?-36:-10),sp.y-30,46,34],at:{x:sp.x,y:sp.y},near:[sp.x-14,sp.y-14,30,22],label:c=>S.fishing[i]&&S.fishing[i].c!==c?S.fishing[i].c.name+'在钓鱼':'坐下钓鱼',
  ok:c=>!c.hold&&!(S.fishing[i]&&S.fishing[i].c!==c&&!S.fishing[i].c.gone),no:c=>c.hold?'叼着东西，先放下':S.fishing[i].c.name+'在钓，换一根钓竿',ai:{mood:'rest',w:c=>c.pal===3?3:.7},
  go(c){run(c,[{go:{x:sp.x,y:sp.y}},{fn:c=>{if(S.fishing[i]&&S.fishing[i].c!==c&&!S.fishing[i].c.gone){c.q=[];emote(c,'q');return}c.face=sp.face;c.doing='在钓鱼';const st=S.fishing[i]={c,i,ph:'cast',t0:now()};
    c.onLeave=c=>{if(S.fishing[i]&&S.fishing[i].c===c)S.fishing[i]=null;c.doing=null};
    stay(c,{k:'sit',ex:'focus',face:sp.face,dur:rr(16,30),act:fishAct,prompt:()=>{const s2=S.fishing[i];return s2&&s2.ph==='bite'?'E · 收竿！':'E · 收竿（等浮漂往下一沉）· WASD 离开'}});
    if(c.me)say('甩竿了。等浮漂往下一沉、头上冒出"!"，再收竿');cast(st)}}])}}));
// 钓竿、鱼线、浮漂（钓鱼的猫画完再画），栈桥上的鱼桶，钓上来的那一条
A.drawers.push((L,vis)=>{const t=now();SP.forEach((sp,i)=>{if(!vis(sp.bob.x-20,sp.y-40,80,70))return;const st=S.fishing[i],d=sp.face==='L'?-1:1;
    L.push([sp.y+1,()=>{const c=st&&st.c,rx=sp.x+d*8,ry=sp.y-12;
      if(c){line(c.x+d*4,c.y-6,rx+d*10,ry-12,OL);line(c.x+d*3,c.y-6,rx+d*9,ry-12,'#c49460');const k=Math.min(1,(t-st.t0)/.6),by=sp.bob.y+(st.ph==='cast'?-Math.round(Math.sin(k*Math.PI)*16):0),bx=st.ph==='cast'?Math.round(rx+d*10+(sp.bob.x-rx-d*10)*k):sp.bob.x;
        fishLine(rx+d*10,ry-12,bx,by);if(st.ph!=='show')bobber(bx,by,t,st.ph==='bite');if(st.ph==='miss')disc(sp.bob.x,sp.bob.y+2,6,2,'#cfe8f8')}
      else if(d<0)rodStand(sp.x-4,sp.y);else{R(sp.x+4,sp.y-6,2,6,OL);line(sp.x+5,sp.y-6,sp.x-8,sp.y-26,OL);line(sp.x+4,sp.y-6,sp.x-9,sp.y-26,'#c49460')}
      if(i===0)fishBucket(P.bucket.x,P.bucket.y,bucketN)}])});
  const sh=S.fishShow;if(sh&&!sh.c.gone&&vis(sh.c.x-30,sh.c.y-60,60,70)){const k=t-sh.t0,up=Math.min(1,k/.3);L.push([1e6,()=>{caughtPx(Math.round(sh.c.x-8),Math.round((sh.c.top??sh.c.y-20)-4-up*8),sh.k,t);if(Math.floor(t*6)%2)spark(Math.round(sh.c.x-14),Math.round((sh.c.top??sh.c.y-20)-12),t)}])}});
tick(dt=>{if(bucketN>0&&Math.random()<dt/40)bucketN--});

/* ---------- 小船 ---------- */
const B=S.boat={x:P.boat.x,y:P.boat.y,mode:'moored',dir:1,riders:[null,null],t0:0,rock:.6};
const seatAt=i=>({x:B.x+20+i*20,y:B.y+9,z:B.y+20.5});
const riders=()=>B.riders.filter(c=>c&&!c.gone);
function depart(){if(B.mode!=='moored'||!riders().length)return;B.mode='out';B.dir=1;B.t0=now();sfx('row');if(riders().some(c=>c.me))say('解开缆绳，顺着河漂下去');news(riders().map(c=>c.name==='你'?'你':c.name).join('、')+' 坐着小船漂到下游去了')}
tick(dt=>{B.riders=B.riders.map((c,i)=>c&&!c.gone&&c.boatSeat===i?c:null);const n=riders().filter(c=>c.inBoat).length;
  if(B.mode==='moored'){B.rock=n?.8:.4;if(n>=2&&!B.wait)B.wait=now()+1.5;if(B.wait&&now()>B.wait){B.wait=0;depart()}if(n<2)B.wait=0;
    if(n===1&&riders().every(c=>!c.me)&&now()-(riders()[0].inT||0)>10)depart()}
  else{const sp=26;B.x+=B.dir*sp*dt;B.rock=1.2;if(Math.floor(now()*1.2)!==Math.floor((now()-dt)*1.2)&&riders().some(c=>c.me))sfx('row');
    if(B.mode==='out'&&B.x>=P.boatEnd){B.mode='back';B.dir=-1;if(riders().some(c=>c.me))say('掉头，慢慢划回去')}
    else if(B.mode==='back'&&B.x<=P.boat.x){B.x=P.boat.x;B.mode='moored';B.landT=now();riders().forEach(c=>{if(c.me)say('靠岸了。WASD 下船');else after(rr(.5,2),()=>{if(c.inBoat)leaveBoat(c)})})}}
  B.riders.forEach((c,i)=>{if(!c||!c.inBoat)return;const s=seatAt(i);c.x=s.x;c.y=s.y+Math.round(Math.sin(now()*1.6)*B.rock*.5);c.z=s.z;c.dy=0;c.face=B.dir>0?'R':'L'})});
function leaveBoat(c){if(c.place)A.leavePlace(c);else run(c,[{jump:{...P.boardAt}},{fn:c=>{c.z=undefined;unclaim(c)}}])}
T({id:'boat',n:'小船',hit:()=>[B.x,B.y-4,60,24],at:P.boardAt,near:[P.boardAt.x-10,P.boardAt.y-16,36,32],
  label:()=>B.mode!=='moored'?'小船在河上':riders().length?'坐上小船（坐满两只就开）':'坐上小船',ok:c=>!c.hold&&B.mode==='moored'&&B.riders.some(r=>!r||r.gone),no:c=>c.hold?'叼着东西，先放下':B.mode!=='moored'?'小船还没回来':'船上坐满了',ai:{mood:'play',w:c=>B.mode==='moored'?1:0},
  go(c){run(c,[{go:P.boardAt},{fn:c=>{const i=B.riders.findIndex(r=>!r||r.gone);if(i<0||B.mode!=='moored'){c.q=[];emote(c,'q');return}B.riders[i]=c;c.boatSeat=i;c.inT=now();c.doing='坐在小船上';
      c.onLeave=c=>{const j=B.riders.indexOf(c);if(j>=0)B.riders[j]=null;c.inBoat=false;c.boatSeat=null;c.doing=null};
      run(c,[{jump:()=>seatAt(i)},{fn:c=>{c.inBoat=true;stay(c,{k:'sit',ex:'happy',face:'R',dur:c.me?0:200,act:()=>{if(B.mode==='moored'){depart();return true}return true},
        prompt:()=>B.mode==='moored'?'E · 开船 · WASD 下船':'船在河上……',leave:c=>[{jump:{...P.boardAt}},{fn:c=>{c.z=undefined}}]});
        if(c.place)c.place.stay=c=>{if(B.mode!=='moored'){say('船还在河上，等它靠岸');return true}return false};if(c.me)say('坐上小船了。再来一只猫，或者按一下就开')}}],true)}}])}});
// 船（在河面上，排序按船底）、船尾的水纹；船开的时候缆绳收起来
A.drawers.push((L,vis)=>{if(!vis(B.x-20,B.y-10,100,40))return;L.push([B.y+20,()=>{const t=now();if(B.mode!=='moored')boatWake(B.dir>0?B.x:B.x+60,B.y+12,t);boat(Math.round(B.x),B.y,t,B.rock);
  if(B.mode==='moored')line(P.pier.x+P.pier.w-2,P.pier.y+44,Math.round(B.x)+4,B.y+10,'#d9d2c4')}])});

/* ---------- 河里的鱼影：慢慢游，偶尔转身 ---------- */
S.rfish=Array.from({length:6},(_,i)=>({x:rr(40,920),y:P.river.y+8+rr(0,P.river.h-16),dir:Math.random()<.5?1:-1,sp:rr(6,14),gold:i===0}));
tick(dt=>S.rfish.forEach(f=>{f.x+=f.dir*f.sp*dt;if(f.x<20||f.x>940||Math.random()<dt*.05)f.dir*=-1}));
A.floors.push(vis=>S.rfish.forEach(f=>{const x=Math.round(f.x),y=Math.round(f.y);if(!vis(x-6,y-3,12,6))return;alpha(f.gold?.55:.35,()=>{R(x-3,y,7,2,f.gold?'#ffd84a':'#1e4a78');P1(x-4*f.dir,y,f.gold?'#ffd84a':'#1e4a78');P1(x-5*f.dir,y-1,f.gold?'#ffd84a':'#1e4a78');P1(x-5*f.dir,y+2,f.gold?'#ffd84a':'#1e4a78')})}));
Object.assign(A.LIKES[3],{fish0:2,fish1:2,fish2:2,boat:1.5});Object.assign(A.LIKES[5],{boat:2,fish1:1});
});
