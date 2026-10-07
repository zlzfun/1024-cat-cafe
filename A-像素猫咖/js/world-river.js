/* 1024 猫咖 · 河边：钓鱼、小船、鸭子、河上漂的东西、河里的鱼影（设计见 docs/店内设计.md 第三节）。依赖 world-acts.js、map-1f.js、props-kit.js。
   - 钓鱼：三根钓竿（栈桥尽头水深、这边岸上水浅、对岸树荫底下），各自爱咬钩的鱼不一样。坐下甩竿 → 浮漂一沉、头上冒"!" → 收竿。
     大鱼要遛：头上一根小横条，点跑进绿的那段按 E，收三下拉上来，按错两下鱼就挣脱。鱼谱是图鉴里的一页（栈桥上的鱼桶也打开它）：
     地上的九种加上只在猫猫星球捞得到的水晶鱼，一共十种；钓到新的一种，上方弹一张鱼谱小卡；九种都齐了说一句。
     钓上来的看一眼、放回河里（没有鱼受伤）。别的猫也会来钓，一根钓竿一次一只。
   - 小船：拴在栈桥边，能坐两只。你坐上去按 E 开船：方向键 / 点河面划，捞漂下来的毛线球，躲开漂木，偶尔捞到漂流瓶；一趟一分钟，
     时间到了船自己划回栈桥（也可以早点回来按 E 靠岸）。捞上来的毛线球送进门厅的篮子。两只猫一起划，船快一半。
     别的猫自己坐船：还是顺着河漂到下游、再划回来。
   - 鸭子一家：鸭妈妈带三只小鸭在河上游；船、扑过去的猫靠近了，嘎嘎叫着游开。
   - 河里游着几条鱼的影子，猫会盯着看。 */
// 鱼的种类、三个钓点各爱咬钩的鱼、每种的像素画都在 fish-art.js（图鉴的鱼谱那一页也用）
// 钓上来那一下举起来的样子：那种鱼的画（或一只靴子、一颗毛线球、一只小螃蟹），一抖一抖
function caughtPx(x,y,k,t){fishPx(k,x-1,y-1+Math.round(Math.sin(t*14)),t)}

WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,speak,say,sfx,news,after,T,stay,unclaim,dist,idle,settle,setK,land}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,tick=f=>A.tickers.push(f),atMe=(p,d=220)=>A.play&&near(me,p,d);
const GS=()=>A.guide.games(),log=()=>A.guide.fishLog();
const FISH=FISH_KINDS.filter(f=>!f.junk),FISH_N=FISH.length,GROUND=FISH.filter(f=>!f.sky),fishKinds=()=>FISH.filter(f=>log()[f.id]).length;
// 钓到（捞到）新的一种：上方弹一张鱼谱小卡（app.js 的 ui.fishCard）；水晶鱼由 world-rocket.js 调
A.fishCard=(id,cm,spot)=>{const f=FISH_BY[id];if(!f||!A.ui.fishCard)return;A.ui.fishCard({id,n:f.n,cm:cm||0,where:spot!=null?FISH_SPOT[spot].n:FISH_WHERE(id),d:f.d,count:fishKinds(),total:FISH_N})};
const pickFish=i=>{const w=FISH_SPOT[i].w,L=FISH_KINDS.filter(f=>w[f.id]),s=L.reduce((a,f)=>a+w[f.id],0);let r=Math.random()*s;for(const f of L)if((r-=w[f.id])<=0)return f;return L[0]};
const isBig=(f,cm)=>f.big&&cm>=f.sz[0]+(f.sz[1]-f.sz[0])*.5;

/* ---------- 钓鱼：三根钓竿，各钓各的 ---------- */
const SP=P.fishSpots;S.fishing=SP.map(()=>null);S.fishShow=null;let bucketN=0;
const fishOf=c=>S.fishing.find(st=>st&&st.c===c);
function cast(st){st.ph='cast';st.t0=now();if(atMe(SP[st.i]))sfx('splash');after(.6,()=>{if(S.fishing[st.i]===st&&st.ph==='cast'){st.ph='wait';st.until=now()+rr(3,8)}})}
function landed(st,f,cm){const c=st.c;S.fishShow={k:f.id,c,t0:now()};st.ph='show';st.t0=now();st.reel=null;if(atMe(c))sfx('reel');if(st.i===0)bucketN=Math.min(3,bucketN+1);
  if(c.me){const L=log(),first=!L[f.id];L[f.id]=(L[f.id]||0)+1;const M=GS().fishMax=GS().fishMax||{},rec=!f.junk&&cm>(M[f.id]||0);if(rec)M[f.id]=cm;A.guide.save();const kinds=fishKinds();
    if(f.id==='yarn'){say('钓上来一颗毛线球……不知道谁掉进河里的。拧干了，放回门厅的篮子里');A.addBall()}
    else if(f.id==='boot')say('钓上来一只旧靴子。……放回去吧');
    else say(`钓上来一条${f.n}（${cm} 厘米）${first?'，第一次钓到！':rec?'，新纪录！':''}看一眼，放回河里 · 鱼谱 ${kinds}/${FISH_N}`);
    if(first&&!f.junk){A.fishCard(f.id,cm,st.i);
      // 地上的九种都齐了：鱼谱上还差最后一种
      if(GROUND.every(k=>L[k.id])&&!GS().fish9){GS().fish9=Date.now();A.guide.save();after(3.2,()=>{say('地上的九种都钓齐了。鱼谱上还差最后一种——它不在这条河里');news('你钓齐了河里的九种鱼')})}}
    if(f.rare)news('你钓上来一条金鱼！');A.emit('game','fish')}
  else if(f.rare)news(`${c.name} 钓上来一条金鱼`);
  emote(c,f.junk?'q':'heart',1.6);after(1.8,()=>{if(S.fishing[st.i]===st&&st.ph==='show'){st.ph='wait';st.until=now()+rr(4,9);if(!c.me&&Math.random()<.5)leaveFish(c)}})}
function catchIt(st){const f=pickFish(st.i),cm=f.sz?Math.round(rr(f.sz[0],f.sz[1])):0;
  // 大鱼：要遛。点在横条上来回跑，跑进绿的那段按 E
  if(isBig(f,cm)){const k=f.sz[1]>f.sz[0]?(cm-f.sz[0])/(f.sz[1]-f.sz[0]):1;st.ph='reel';st.t0=now();st.reel={f,cm,p:rr(.1,.9),v:(.55+k*.6)*(Math.random()<.5?1:-1),w:.3-k*.12,z:rr(.2,.65),hits:0,miss:0,wob:0};st.reel.z=Math.min(1-st.reel.w,st.reel.z);
    emote(st.c,'bang',1.4);if(st.c.me){sfx('bite');say(`咬钩了，是条大的（${f.n}）！等点跑进绿的那段再收线，收三下`)}
    else after(rr(2.5,4.5),()=>{if(S.fishing[st.i]===st&&st.ph==='reel'){if(Math.random()<.6)landed(st,f,cm);else escaped(st)}});return}
  landed(st,f,cm)}
function escaped(st){st.ph='wait';st.until=now()+rr(3,7);st.reel=null;sfx('splash');emote(st.c,'q',1.2);if(st.c.me)say('鱼一甩尾巴，挣脱了。下次等点跑进绿的那段再按')}
function leaveFish(c){if(c.place)A.leavePlace(c);else run(c,[{fn:unclaim}])}
function fishAct(c){const st=fishOf(c);if(!st)return true;
  if(st.ph==='bite'){catchIt(st);return true}
  if(st.ph==='reel'){const R2=st.reel;if(now()-st.t0<.25)return true;if(R2.p>=R2.z&&R2.p<=R2.z+R2.w){R2.hits++;R2.wob=.3;sfx('reel');if(R2.hits>=3){landed(st,R2.f,R2.cm);return true}R2.z=rr(.05,.95-R2.w);R2.v*=1.12}
    else{R2.miss++;sfx('no');if(R2.miss>=2){escaped(st);return true}say('早了一点，再等等')}return true}
  if(st.ph==='wait'){st.ph='miss';st.t0=now();sfx('splash');if(c.me)say('收早了，鱼还没咬钩，吓跑了。再等等');after(1,()=>{if(S.fishing[st.i]===st)cast(st)});return true}
  return true}
tick(dt=>{S.fishing.forEach((st,i)=>{if(!st)return;if(st.c.gone){S.fishing[i]=null;return}
  if(st.ph==='wait'&&now()>st.until){st.ph='bite';st.t0=now();emote(st.c,'bang',1.1);if(st.c.me)sfx('bite');
    if(!st.c.me){const hit=Math.random()<.6;after(rr(.25,.8),()=>{if(S.fishing[i]===st&&st.ph==='bite'){if(hit)catchIt(st);else{st.ph='wait';st.until=now()+rr(3,7)}}})}}
  if(st.ph==='bite'&&now()-st.t0>1.1){st.ph='wait';st.until=now()+rr(3,7);if(st.c.me)say('浮漂又浮上来了：鱼跑了。下次一沉就收竿')}
  if(st.ph==='reel'){const R2=st.reel;R2.p+=R2.v*dt;if(R2.p<0){R2.p=-R2.p;R2.v=-R2.v}if(R2.p>1){R2.p=2-R2.p;R2.v=-R2.v}R2.wob=Math.max(0,R2.wob-dt);if(now()-st.t0>9&&st.c.me)escaped(st)}});
  if(S.fishShow&&now()-S.fishShow.t0>1.8)S.fishShow=null});
SP.forEach((sp,i)=>T({id:'fish'+i,n:'钓竿',hit:[sp.x+(sp.face==='L'?-36:-10),sp.y-30,46,34],at:{x:sp.x,y:sp.y},near:[sp.x-14,sp.y-14,30,22],label:c=>S.fishing[i]&&S.fishing[i].c!==c?S.fishing[i].c.name+'在钓鱼':'坐下钓鱼（'+FISH_SPOT[i].n+'）',
  ok:c=>!c.hold&&!(S.fishing[i]&&S.fishing[i].c!==c&&!S.fishing[i].c.gone),no:c=>c.hold?'叼着东西，先放下':S.fishing[i].c.name+'在钓，换一根钓竿',ai:{mood:'rest',w:c=>c.pal===3?3:.7},
  go(c){run(c,[{go:{x:sp.x,y:sp.y}},{fn:c=>{if(S.fishing[i]&&S.fishing[i].c!==c&&!S.fishing[i].c.gone){c.q=[];emote(c,'q');return}c.face=sp.face;c.doing='在钓鱼';const st=S.fishing[i]={c,i,ph:'cast',t0:now()};
    c.onLeave=c=>{if(S.fishing[i]&&S.fishing[i].c===c)S.fishing[i]=null;c.doing=null};
    stay(c,{k:'sit',ex:'focus',face:sp.face,dur:rr(16,30),act:fishAct,prompt:()=>{const s2=S.fishing[i];return s2&&s2.ph==='bite'?'E · 收竿！':s2&&s2.ph==='reel'?`E · 收线（点跑进绿的那段再按）· ${s2.reel.hits}/3`:'E · 收竿（等浮漂往下一沉）· WASD 离开'}});
    if(c.me)say(`在${FISH_SPOT[i].n}甩竿了。等浮漂往下一沉、头上冒出"!"，再收竿`);cast(st)}}])}}));
// 钓竿、鱼线、浮漂（钓鱼的猫画完再画），栈桥上的鱼桶，钓上来的那一条
A.drawers.push((L,vis)=>{const t=now();SP.forEach((sp,i)=>{if(!vis(sp.bob.x-20,sp.y-40,80,70))return;const st=S.fishing[i],d=sp.face==='L'?-1:1;
    L.push([sp.y+1,()=>{const c=st&&st.c,rx=sp.x+d*8,ry=sp.y-12;
      if(c){const bend=st.ph==='reel'?3:0;line(c.x+d*4,c.y-6,rx+d*10,ry-12+bend,OL);line(c.x+d*3,c.y-6,rx+d*9,ry-12+bend,'#c49460');const k=Math.min(1,(t-st.t0)/.6),by=sp.bob.y+(st.ph==='cast'?-Math.round(Math.sin(k*Math.PI)*16):0),bx=st.ph==='cast'?Math.round(rx+d*10+(sp.bob.x-rx-d*10)*k):sp.bob.x+(st.ph==='reel'?Math.round(Math.sin(t*9)*3):0);
        fishLine(rx+d*10,ry-12+bend,bx,by);if(st.ph!=='show')bobber(bx,by,t,st.ph==='bite'||st.ph==='reel');if(st.ph==='miss'||st.ph==='reel')disc(sp.bob.x,sp.bob.y+2,6,2,'#cfe8f8')}
      else if(d<0)rodStand(sp.x-4,sp.y);else{R(sp.x+4,sp.y-6,2,6,OL);line(sp.x+5,sp.y-6,sp.x-8,sp.y-26,OL);line(sp.x+4,sp.y-6,sp.x-9,sp.y-26,'#c49460')}
      if(i===0)fishBucket(P.bucket.x,P.bucket.y,bucketN)}])});
  const sh=S.fishShow;if(sh&&!sh.c.gone&&vis(sh.c.x-30,sh.c.y-60,60,70)){const k=t-sh.t0,up=Math.min(1,k/.3);L.push([1e6,()=>{caughtPx(Math.round(sh.c.x-8),Math.round((sh.c.top??sh.c.y-20)-4-up*8),sh.k,t);if(Math.floor(t*6)%2)spark(Math.round(sh.c.x-14),Math.round((sh.c.top??sh.c.y-20)-12),t)}])}});
// 遛鱼的横条：只画你自己的
A.overs.push(vis=>{S.fishing.forEach(st=>{if(!st||st.ph!=='reel'||!st.c.me)return;const c=st.c,R2=st.reel,x=Math.round(c.x-15),y=Math.round((c.top??c.y-22)-12-(R2.wob>0?1:0));if(!vis(x,y,32,8))return;
  R(x-1,y-1,32,6,OL);R(x,y,30,4,'#5a4a6a');R(x+Math.round(R2.z*30),y,Math.max(2,Math.round(R2.w*30)),4,'#7ee08a');R(x+Math.round(R2.z*30),y,Math.max(2,Math.round(R2.w*30)),1,'#c8f8c8');
  const px=x+Math.round(R2.p*29);R(px-1,y-2,3,8,OL);R(px,y-1,1,6,'#ffd84a');for(let i=0;i<3;i++)R(x+10+i*4,y+6,3,2,i<R2.hits?'#ffd84a':'#5a4a6a')})});
tick(dt=>{if(bucketN>0&&Math.random()<dt/40)bucketN--});
// 鱼桶：凑过去打开图鉴的鱼谱那一页
T({id:'bucket',n:'鱼桶 · 鱼谱',hit:[P.bucket.x-2,P.bucket.y-2,16,16],at:P.bucketAt,near:[P.bucketAt.x-12,P.bucketAt.y-12,26,20],label:'看看鱼谱',ai:{mood:'explore',w:.1},
  go(c){run(c,[{go:P.bucketAt},{fn:c=>{c.face='L'}},{k:'lie',dur:.7,ex:'lookDown'},{fn:c=>{if(c.me)openBook()}},{k:'sit',dur:.6,soft:1}])}});
function openBook(){if(A.ui.book)A.ui.book('fish')}
A.openFishBook=openBook;

/* ---------- 河上漂的东西：从栈桥底下漂出来，往下游（东边）漂，漂到木桥底下就看不见了 ---------- */
S.drift=[];let driftT=3;const RV=P.river,X0=P.pier.x+6,X1=P.bridge.x-4;
const B=S.boat={x:P.boat.x,y:P.boat.y,mode:'moored',dir:1,riders:[null,null],t0:0,rock:.6,vx:0,vy:0,got:0,bump:0,tgt:null,oar:0};
function spawnDrift(k){S.drift.push({k:k||(Math.random()<.6?'yarn':'log'),x:X0,y:rr(RV.y+8,RV.y+RV.h-12),vx:rr(8,13),ci:Math.floor(Math.random()*5),t0:now()})}
tick(dt=>{const trip=B.mode==='free';if((driftT-=dt)<=0){driftT=trip?rr(2.6,4.4):rr(9,16);if(S.drift.length<(trip?9:4))spawnDrift()}
  for(let i=S.drift.length-1;i>=0;i--){const d=S.drift[i];d.x+=d.vx*dt;d.y+=Math.sin(now()*.7+d.t0)*2*dt;d.y=Math.max(RV.y+6,Math.min(RV.y+RV.h-10,d.y));if(d.x>X1)S.drift.splice(i,1)}});
A.floors.push(vis=>{const t=now();for(const d of S.drift){const x=Math.round(d.x),y=Math.round(d.y);if(!vis(x-10,y-8,26,14))continue;
  if(d.k==='yarn'){yarnBall(x,y,2,d.ci,Math.floor(t*3+d.t0));alpha(.5,()=>{P1(x-4,y+3,'#cfe8f8');P1(x+4,y+3,'#cfe8f8')})}else if(d.k==='log')driftLog(x-8,y-2,t);else bottlePx(x-4,y-2,t)}});

/* ---------- 小船 ---------- */
const seatAt=i=>({x:B.x+20+i*20,y:B.y+9,z:B.y+20.5});
const riders=()=>B.riders.filter(c=>c&&!c.gone);
const meIn=()=>riders().some(c=>c.me&&c.inBoat);
const BX0=P.pier.x+P.pier.w+2,BX1=P.boat2.x,BY0=RV.y-4,BY1=RV.y+RV.h-26,TRIP=60;
// 两个码头：上游的栈桥、下游木桥边的小码头。船停在哪个（B.dock），就在哪个上下船；划到哪个码头边上都能靠岸
const DOCKS={up:{x:P.boat.x,y:P.boat.y,board:P.boardAt,post:{x:P.pier.x+P.pier.w-2,y:P.pier.y+44},n:'栈桥'},down:{x:P.boat2.x,y:P.boat2.y,board:P.boardAt2,post:{x:P.pier2.x+2,y:P.pier2.y+32},n:'下游的小码头'}};
B.dock='up';const DK0=()=>DOCKS[B.dock];
const nearDockKey=()=>{for(const k in DOCKS){const d=DOCKS[k];if(Math.abs(B.x-d.x)<26&&Math.abs(B.y-d.y)<12)return k}return null};
const closestDock=()=>Math.abs(B.x-DOCKS.up.x)<=Math.abs(B.x-DOCKS.down.x)?'up':'down';
const NOTES=['如果你捡到这个瓶子：猫猫咖啡馆的猫也在飞书、钉钉、企业微信里接球','瓶子里一张纸条：今天的 CI 是绿的','纸条上画着一只猫，旁边写着：谢谢你把我捞上来',
  '纸条上写着：想要一只会写代码的猫','纸条：下游的木桥底下，住着一家鸭子','纸条上只有一行：TODO'];
// 你开船：解开缆绳以后自己划；别的猫开船：从船停着的码头划到另一个码头，靠岸下船
function depart(){if(B.mode!=='moored'||!riders().length)return;B.t0=now();if(meIn()||atMe(B,260))sfx('row');
  if(meIn()){B.mode='free';B.got=0;B.bottle=Math.random()<.4?now()+rr(10,40):0;B.vx=8;B.vy=0;B.tgt=null;driftT=.5;say(GS().boat?'解开缆绳了。捞毛线球，躲漂木，一分钟':'解开缆绳了。自己划：捞漂下来的毛线球，躲开漂木，一趟一分钟');news('你划着小船出发了')}
  else{B.mode='out';B.dir=B.dock==='up'?1:-1;news(riders().map(c=>c.name).join('、')+(B.dir>0?' 坐着小船漂到下游去了':' 坐着小船划回上游的栈桥'))}}
function dock(k){k=k||nearDockKey()||closestDock();B.mode='moored';B.dock=k;B.x=DOCKS[k].x;B.y=DOCKS[k].y;B.vx=B.vy=0;B.tgt=null;B.landT=now();
  const n=B.got;B.got=0;let put=0;for(let i=0;i<n;i++)if(A.addBall())put++;
  if(meIn()){const g=GS(),bt=g.boat=g.boat||{},best=n>(bt.best||0);bt.trips=(bt.trips||0)+1;bt.total=(bt.total||0)+n;if(best)bt.best=n;A.guide.save();A.emit('game','boat');
    say(n?`在${DOCKS[k].n}靠岸了。这一趟捞了 ${n} 颗毛线球${best&&bt.trips>1?'，新纪录':''}（最多一次 ${bt.best} 颗）${put?'，送进了门厅的毛线篮':''}`:`在${DOCKS[k].n}靠岸了。这一趟一颗也没捞到……`)}
  riders().forEach(c=>{if(!c.me)after(rr(.5,2),()=>{if(c.inBoat)leaveBoat(c)})})}
tick(dt=>{B.riders=B.riders.map((c,i)=>c&&!c.gone&&c.boatSeat===i?c:null);const n=riders().filter(c=>c.inBoat).length;B.bump=Math.max(0,B.bump-dt);
  if(B.mode==='moored'){B.rock=n?.8:.4;if(n>=2&&!B.wait&&!meIn())B.wait=now()+1.5;if(B.wait&&now()>B.wait){B.wait=0;depart()}if(n<2)B.wait=0;
    if(n===1&&riders().every(c=>!c.me)&&now()-(riders()[0].inT||0)>10)depart()}
  else if(B.mode==='free'||B.mode==='home'){const two=n>=2,MX=two?60:40;
    if(B.mode==='free'&&now()-B.t0>TRIP){B.mode='home';B.home=closestDock();say('一分钟到了，船慢慢划到近的那个码头：'+DOCKS[B.home].n)}
    if(B.mode==='home'||B.tgt){const g=B.mode==='home'?DOCKS[B.home]:B.tgt,dx=g.x-B.x,dy=g.y-B.y,d=Math.hypot(dx,dy);
      if(d<3){if(B.mode==='home'){dock(B.home);return}B.tgt=null}else{B.vx+=(dx/d*70-B.vx*.6)*dt;B.vy+=(dy/d*40-B.vy*.6)*dt}}
    const k=Math.exp(-1.1*dt);B.vx=B.vx*k+(B.mode==='home'?0:6*dt);B.vy*=k;B.vx=Math.max(-MX,Math.min(MX,B.vx));B.vy=Math.max(-22,Math.min(22,B.vy));
    B.x+=B.vx*dt;B.y+=B.vy*dt;if(B.x<BX0){B.x=BX0;B.vx=Math.abs(B.vx)*.3}if(B.x>BX1){B.x=BX1;B.vx=-Math.abs(B.vx)*.3}if(B.y<BY0){B.y=BY0;B.vy=0}if(B.y>BY1){B.y=BY1;B.vy=0}
    B.rock=1+B.bump*3;if(Math.hypot(B.vx,B.vy)>6)B.oar=(B.oar+dt*1.3)%1;
    if(Math.floor(now()*1.2)!==Math.floor((now()-dt)*1.2)&&Math.hypot(B.vx,B.vy)>8)sfx('row');
    // 撞上漂着的东西
    for(let i=S.drift.length-1;i>=0;i--){const d=S.drift[i];if(d.imm>now()||d.x<B.x+2||d.x>B.x+58||d.y<B.y+4||d.y>B.y+20)continue;
      if(d.k==='yarn'){S.drift.splice(i,1);B.got++;sfx('collect');S.puffs.push({x:Math.round(d.x),y:Math.round(d.y)-4,t0:now()});if(meIn())say(`捞起一颗毛线球（这一趟 ${B.got} 颗）`)}
      else if(d.k==='bottle'){S.drift.splice(i,1);sfx('disc');const g=GS();g.bottles=(g.bottles||0)+1;A.guide.save();if(meIn())say('捞起一个漂流瓶。'+rnd(NOTES))}
      else if(B.bump<=0){B.bump=.6;B.vx=-B.vx*.4+d.vx;B.vy+=(B.y+12<d.y?-1:1)*18;d.vx+=6;sfx('bump');
        // 掉回河里的那一颗漂在船后面，一秒半之内捞不回来
        if(B.got>0){B.got--;S.drift.push({k:'yarn',x:B.x-8,y:Math.max(RV.y+8,Math.min(RV.y+RV.h-12,B.y+14)),vx:10,ci:Math.floor(Math.random()*5),t0:now(),imm:now()+1.5});if(meIn())say(`咚！撞上漂木了，掉回河里一颗（还剩 ${B.got} 颗）`)}else if(meIn())say('咚！撞上漂木了')}}
    if(B.mode==='free'&&B.bottle&&now()>B.bottle){B.bottle=0;spawnDrift('bottle')}}
  else{const sp=26;B.x+=B.dir*sp*dt;B.rock=1.2;B.oar=(B.oar+dt*1.1)%1;const to=B.dir>0?'down':'up',g=DOCKS[to];B.y+=(g.y-B.y)*Math.min(1,dt*2);
    if(B.dir>0?B.x>=g.x:B.x<=g.x){B.x=g.x;B.y=g.y;B.dock=to;B.mode='moored';B.landT=now();riders().forEach(c=>{if(!c.me)after(rr(.5,2),()=>{if(c.inBoat)leaveBoat(c)})})}}
  B.riders.forEach((c,i)=>{if(!c||!c.inBoat)return;const s=seatAt(i);c.x=s.x;c.y=s.y+Math.round(Math.sin(now()*1.6)*B.rock*.5);c.z=s.z;c.dy=0;c.face=B.vx<-4||B.mode==='out'&&B.dir<0?'L':'R'})});
function leaveBoat(c){if(c.place)A.leavePlace(c);else run(c,[{jump:{...DK0().board}},{fn:c=>{c.z=undefined;unclaim(c)}}])}
const nearDock=()=>!!nearDockKey();
function boatSteer(dx,dy,dt){if(B.mode==='moored')return false;if(B.mode!=='free')return true;if(dx||dy)B.tgt=null;B.vx+=dx*80*dt;B.vy+=dy*55*dt;return true}
function boatTap(x,y){if(B.mode==='moored')return false;if(B.mode==='free'&&y>RV.y-2&&y<RV.y+RV.h+4){B.tgt={x:Math.max(BX0,Math.min(BX1,x-30)),y:Math.max(BY0,Math.min(BY1,y-12))};return true}
  say(B.mode==='free'?'船还在河上：划到码头边靠岸，才能下船':'船在往码头划，等它靠岸');return true}
T({id:'boat',n:'小船',hit:()=>[B.x,B.y-6,62,26],at:()=>DK0().board,near:()=>{const b=DK0().board;return[b.x-10,b.y-16,36,32]},
  label:()=>B.mode!=='moored'?'小船在河上':riders().length?'坐上小船（两只猫一起划，快一半）':'坐上小船',ok:c=>!c.hold&&B.mode==='moored'&&B.riders.some(r=>!r||r.gone),no:c=>c.hold?'叼着东西，先放下':B.mode!=='moored'?'小船还没回来':'船上坐满了',ai:{mood:'play',w:c=>B.mode==='moored'&&!meIn()?1:0},
  go(c){const bd=DK0().board;run(c,[{go:bd},{fn:c=>{const i=B.riders.findIndex(r=>!r||r.gone);if(i<0||B.mode!=='moored'){c.q=[];emote(c,'q');return}B.riders[i]=c;c.boatSeat=i;c.inT=now();c.doing='坐在小船上';
      c.onLeave=c=>{const j=B.riders.indexOf(c);if(j>=0)B.riders[j]=null;c.inBoat=false;c.boatSeat=null;c.doing=null};
      run(c,[{jump:()=>seatAt(i)},{fn:c=>{c.inBoat=true;stay(c,{k:'sit',ex:'happy',face:'R',dur:c.me?0:200,steer:boatSteer,tap:boatTap,
        act:()=>{if(B.mode==='moored'){depart();return true}if(B.mode==='free'&&nearDock()){dock();return true}if(B.mode==='free')say('划到码头边才能靠岸：上游的栈桥，或者下游木桥边的小码头');return true},
        prompt:()=>B.mode==='moored'?'E · 解开缆绳 · WASD 下船':B.mode==='free'?(nearDock()?'E · 在'+DOCKS[nearDockKey()].n+'靠岸':`方向键划船 · 点河面也行 · 捞了 ${B.got} 颗 · 还剩 ${Math.max(0,Math.ceil(TRIP-(now()-B.t0)))} 秒`):'船在往回划……',
        leave:c=>[{jump:{...DK0().board}},{fn:c=>{c.z=undefined}}]});
        if(c.place)c.place.stay=c=>{if(B.mode!=='moored'){say(B.mode==='free'?'船还在河上：划到码头边靠岸，才能下船':'船在往码头划，等它靠岸');return true}return false};if(c.me)say(GS().boat?'坐上小船了。解开缆绳就出发':'坐上小船了。解开缆绳，自己划：捞漂下来的毛线球，躲开漂木')}}],true)}}])}});
// 船（在河面上，排序按船底）、船尾的水纹、船头的灯笼光；船开的时候缆绳收起来
A.drawers.push((L,vis)=>{if(!vis(B.x-20,B.y-10,100,40))return;L.push([B.y+20,()=>{const t=now(),moving=B.mode!=='moored'&&(Math.hypot(B.vx,B.vy)>6||B.mode==='out'||B.mode==='back');
  if(moving)boatWake(B.vx<0||B.mode==='out'&&B.dir<0?B.x+60:B.x,B.y+12,t);boat(Math.round(B.x),Math.round(B.y),t,B.rock,moving||meIn()&&B.mode!=='moored'?B.oar:null);
  if(B.mode==='moored'){const p=DK0().post;line(p.x,p.y,Math.round(B.x)+(B.dock==='up'?4:58),Math.round(B.y)+10,'#d9d2c4')}}])});
tick(()=>A.lights.push({x:B.x+59,y:B.y-2,r:16,col:'#ffd88a',a:.8},{x:B.x+59,y:B.y+22,r:10,col:'#ffd88a',a:.35}));

/* ---------- 鸭子一家：鸭妈妈在前，三只小鸭跟着 ---------- */
const DK=S.ducks={x:520,y:RV.y+30,dir:-1,flee:0,tail:[]};
for(let i=0;i<3;i++)DK.tail.push({x:DK.x+(i+1)*9,y:DK.y});
function scare(from,why){DK.flee=2.2;DK.dir=from.x<DK.x?1:-1;if(atMe(DK,260))sfx('quack');if(why&&why.me)say('鸭子嘎嘎叫着游开了')}
tick(dt=>{DK.flee=Math.max(0,DK.flee-dt);const sp=DK.flee>0?30:7;if(Math.random()<dt*.05&&!DK.flee)DK.dir*=-1;DK.x+=DK.dir*sp*dt;DK.y+=Math.sin(now()*.5)*3*dt;
  if(DK.x<BX0+10){DK.x=BX0+10;DK.dir=1}if(DK.x>X1-30){DK.x=X1-30;DK.dir=-1}DK.y=Math.max(RV.y+12,Math.min(RV.y+RV.h-8,DK.y));
  if(B.mode!=='moored'&&!DK.flee&&Math.hypot(B.x+30-DK.x,B.y+12-DK.y)<46)scare({x:B.x+30},null);
  let px=DK.x,py=DK.y;DK.tail.forEach(d=>{const dx=px-d.x,dy=py-d.y,dd=Math.hypot(dx,dy);if(dd>9){d.x+=dx/dd*(dd-9);d.y+=dy/dd*(dd-9)}px=d.x;py=d.y})});
A.floors.push(vis=>{if(!vis(DK.x-60,DK.y-14,120,28))return;const t=now();DK.tail.forEach(d=>duckPx(Math.round(d.x),Math.round(d.y),t,DK.dir,1));duckPx(Math.round(DK.x),Math.round(DK.y),t,DK.dir,0)});
const nearDuck=c=>!c.inBoat&&Math.hypot(DK.x-c.x,(DK.y-c.y)*1.4)<70&&(c.y<RV.y||c.y>RV.y+RV.h);
// 按 E 的范围以鸭子为中心（横跨两岸的一条），不跟着你走：鸭子游过栈桥边时，别抢了小船、钓竿的 E
T({id:'ducks',n:'鸭子一家',quiet:1,hidden:c=>!nearDuck(c),near:()=>[DK.x-36,RV.y-26,72,RV.h+52],hit:()=>[DK.x-8,DK.y-8,40,12],at:c=>({x:c.x,y:c.y}),label:'扑鸭子',ai:{mood:'play',w:c=>nearDuck(c)?(c.pal===5?3:1):0},
  go(c){const bank=c.y<RV.y?RV.y-6:RV.y+RV.h+6;A.faceTo(c,DK);run(c,[{k:'pounce',dur:.8},{jump:()=>land(Math.max(c.x-30,Math.min(c.x+30,DK.x)),bank),h:10,dur:.32},{fn:c=>{scare(c,c);S.puffs.push({x:Math.round(DK.x),y:Math.round(DK.y),t0:now()})}},{k:'sit',dur:.7,ex:'meh',soft:1}])}});

/* ---------- 河里的鱼影：慢慢游，偶尔转身 ---------- */
S.rfish=Array.from({length:6},(_,i)=>({x:rr(40,920),y:P.river.y+8+rr(0,P.river.h-16),dir:Math.random()<.5?1:-1,sp:rr(6,14),gold:i===0}));
tick(dt=>S.rfish.forEach(f=>{f.x+=f.dir*f.sp*dt;if(f.x<20||f.x>940||Math.random()<dt*.05)f.dir*=-1}));
A.floors.push(vis=>S.rfish.forEach(f=>{const x=Math.round(f.x),y=Math.round(f.y);if(!vis(x-6,y-3,12,6))return;alpha(f.gold?.55:.35,()=>{R(x-3,y,7,2,f.gold?'#ffd84a':'#1e4a78');P1(x-4*f.dir,y,f.gold?'#ffd84a':'#1e4a78');P1(x-5*f.dir,y-1,f.gold?'#ffd84a':'#1e4a78');P1(x-5*f.dir,y+2,f.gold?'#ffd84a':'#1e4a78')})}));
Object.assign(A.LIKES[3],{fish0:2,fish1:2,fish2:2,boat:1.5});Object.assign(A.LIKES[5],{boat:2,fish1:1,ducks:1.5});
});
