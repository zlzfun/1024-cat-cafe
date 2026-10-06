/* 1024 猫咖 · 场景 v4：新房间里的东西 + 对话框管理 + 事件。依赖 world-acts.js（在它后面 push 到 WORLD_MODS）、world4-map.js、quest-bank.js。
   对话框：A.dlg.show(spec, {pick, act, close})；页面实现 ui.dialog(spec|null) 把它画出来，玩家点了什么再调 A.dlg.pick / act。
   事件：A.emit('take'|'solve'|'hang'|'visit'|'use'|'freeze', ...)，训练营、集章卡在 world4-guide.js 里听。
   链接（官网、GitHub、内源主页……）由页面去打开（要在点击里打开新标签页），打开以后调 A.visit(key)。 */
WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,setK,emote,speak,say,sfx,news,after,T,stay,unclaim,free,dist,TID}=A;
const now=()=>A.t,near=(c,p,d)=>Math.hypot(c.x-p.x,c.y-p.y)<d,isBot=c=>c.kind==='bot';
const tick=f=>A.tickers.push(f);

/* ---------- 事件 ---------- */
const ON={};A.on=(k,f)=>(ON[k]=ON[k]||[]).push(f);A.emit=(k,...a)=>(ON[k]||[]).forEach(f=>f(...a));

/* ---------- 对话框 ---------- */
let D=null;
A.dlg={show(spec,h={}){D={spec,h};A.ui.dialog&&A.ui.dialog(spec)},update(spec){if(D){D.spec=spec;A.ui.dialog&&A.ui.dialog(spec)}},
  close(){if(!D)return;const h=D.h;D=null;A.ui.dialog&&A.ui.dialog(null);h.close&&h.close()},
  pick(i){if(D&&D.h.pick)D.h.pick(i)},act(id){if(!D)return;if(D.h.act&&D.h.act(id)===true)return;if(id==='close'||id==='ok'||id==='later')A.dlg.close()},
  get open(){return !!D},get spec(){return D&&D.spec}};
const tipOf=k=>TIPS[k]?{...TIPS[k],key:k}:null;
// 引流用的对话框：一段介绍 + 几个链接
function linkDialog(id,title,icon,text,keys,tip,acts=[{id:'close',t:'再逛逛',key:'Esc'}],h){
  A.dlg.show({id:id+'-'+Math.floor(now()*10),kind:'link',head:{icon,title},blocks:[{k:'text',t:text},{k:'links',items:keys.map(k=>({key:k,...LINKS[k]}))}],tip:tipOf(tip),acts},h)}
function infoDialog(id,title,icon,blocks,tip,links=[]){
  A.dlg.show({id:id+'-'+Math.floor(now()*10),kind:'info',head:{icon,title},blocks:[...blocks,...(links.length?[{k:'links',items:links.map(k=>({key:k,...LINKS[k]}))}]:[])],tip:tipOf(tip),acts:[{id:'ok',t:'知道了',key:'E'}]})}
A.linkDialog=linkDialog;A.infoDialog=infoDialog;
S.stamps={ball:0,inner:0,site:0};
A.visit=k=>{if(k==='inner')S.stamps.inner=1;else S.stamps.site=1;A.emit('visit',k);A.ui.stamps&&A.ui.stamps(S.stamps)};

/* ================= 图书馆 ================= */
S.ladder={x:P.ladder.x0,tx:P.ladder.x0,by:null};const LY=P.shelves[0].y-6;   // 图书馆那一排书架的顶（二楼的北墙）
S.gaps=[];S.catOpen=0;S.freeze=0;S.mailFlag=0;S.ripples=[];S.signHl=-1;
tick(dt=>{const L=S.ladder,d=L.tx-L.x;L.x+=Math.sign(d)*Math.min(Math.abs(d),70*dt);if(L.by&&L.by.gone)L.by=null;
  S.gaps=S.gaps.filter(g=>now()<g.until);['catOpen','freeze','mailFlag'].forEach(k=>S[k]=Math.max(0,S[k]-dt));
  S.ripples=S.ripples.filter(r=>(r.k=(now()-r.t0)/1.2)<1);S.signHl=S.signT>now()?Math.floor(now()*1.2)%3:-1});
function pullBook(c,i,low){const s=P.shelves[i],gx=Math.round(s.x+6+rr(0,32)),tier=low?3:Math.floor(rr(0,3)),gy=s.y+10+tier*13+3;
  if(S.gaps.length<12)S.gaps.push({x:gx,y:gy,until:now()+rr(25,45)});
  S.flying.push({x0:gx,y0:gy,x1:c.x+(c.face==='L'?-8:8),y1:c.y+(low?0:36),t0:now(),dur:.45,arc:6,ci:i,draw:f=>book(Math.round(f.x)-3,Math.round(f.y)-2,[4,0,1,2,3][f.ci])})}
function readShelf(c,i){const s=P.shelves[i],cx=s.x+23;
  const steps=[{go:{x:cx+rr(-6,6),y:LY+82}},{fn:c=>{c.face='R';c.doing='在翻「'+SHELF_NAMES[i]+'」'}}];
  if(!S.ladder.by)steps.push({fn:c=>{if(S.ladder.by&&S.ladder.by!==c){c.q=[{k:'maneki',dur:.8,fn:c=>pullBook(c,i,true)},{k:'lie',dur:1.4,ex:'lookDown'},{fn:c=>done(c,i)}];return}
      S.ladder.by=c;S.ladder.tx=cx;c.onLeave=c=>{if(S.ladder.by===c)S.ladder.by=null;if(c.y<LY+74){c.y=LY+84;c.dy=0}c.z=undefined}}},   // 在梯子上被打断：直接落回地面
    {when:()=>Math.abs(S.ladder.x-cx)<1.5},{jump:{x:cx,y:LY+46,z:LY+73},h:5,dur:.55},{k:'maneki',dur:.9},{fn:c=>pullBook(c,i)},{k:'sit',dur:.5,ex:'happy'},
    {jump:()=>({x:cx+rr(-8,8),y:LY+84}),h:5},{fn:c=>{c.z=undefined;if(S.ladder.by===c)S.ladder.by=null;c.onLeave=null}});
  else steps.push({k:'maneki',dur:.8,fn:c=>pullBook(c,i,true)});
  steps.push({k:'lie',dur:1.5,ex:'lookDown'},{fn:c=>{c.doing=null;done(c,i)}},{k:'sit',dur:.4,soft:1});run(c,steps)}
function done(c,i){if(!c.me)return;if(A.Q&&A.Q.onShelf&&A.Q.onShelf(c,i))return;say(`翻到一页「${SHELF_NAMES[i]}」：${rnd(SHELF_BOOKS[i])}`)}
P.shelves.forEach((s,i)=>T({id:'shelf'+i,n:'书架 · '+SHELF_NAMES[i],hit:[s.x,s.y,s.w,s.h],at:()=>({x:s.x+23,y:LY+82}),near:[s.x,LY+72,s.w+4,22],
  label:c=>(A.Q&&A.Q.shelfLabel&&A.Q.shelfLabel(c,i))||'翻一翻「'+SHELF_NAMES[i]+'」',ai:{mood:'play',w:c=>c.pal===4?3:.5},go(c){readShelf(c,i)}}));
T({id:'catalog',n:'检索柜',hit:[P.catalog.x,P.catalog.y-9,28,42],at:P.catalogAt,near:[P.catalog.x-8,P.catalog.y+30,44,22],label:c=>(A.Q&&A.Q.catalogLabel&&A.Q.catalogLabel(c))||'拉开检索柜',ai:{mood:'play',w:c=>c.pal===4?2:.4},
  go(c){run(c,[{go:P.catalogAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.7,fn:()=>{S.catOpen=2.6;if(A.play&&near(me,P.catalog,120))sfx('clack')}},{k:'sit',dur:1,ex:'curious'},{fn:c=>{if(!c.me)return;if(A.Q&&A.Q.onCatalog&&A.Q.onCatalog(c))return;
    infoDialog('catalog','检索柜','book',[{k:'text',t:'一格格小抽屉，每张卡片记着一件事在哪一架：决策日志、教训沉淀、证据库、人物关系、事件记忆。'},{k:'text',t:'实际上，在猫猫咖啡馆里你只要说一句"之前我们怎么定的"，猫会先在这里查到出处，再去把那一页翻出来——不用你重新解释一遍。'}],'memory',['docs'])}}])}});
const RT=P.readTable.y+34;
A.seatThing({id:'readtable',n:'阅读桌',hit:[P.readTable.x,P.readTable.y-8,P.readTable.w,36],at:{x:P.readTable.x+44,y:RT},near:[P.readTable.x-4,RT-8,P.readTable.w+8,20],label:'跳上桌，趴在摊开的书上',
  spots:[14,44,74].map((d,i)=>({x:P.readTable.x+d,y:P.readTable.y+5,z:P.readTable.y+28.5,face:i%2?'L':'R'})),up:i=>[{x:P.readTable.x+[14,44,74][i],y:P.readTable.y+5,z:P.readTable.y+28.5}],
  down:i=>[{x:P.readTable.x+[14,44,74][i],y:RT}],floor:i=>({x:P.readTable.x+[14,44,74][i],y:RT}),k:'lie',ex:'content',doing:'趴在摊开的书上',ai:{mood:'rest',w:1.5}});
const AF=P.armchair.y+32;
A.seatThing({id:'armchair',n:'扶手椅',hit:[P.armchair.x,P.armchair.y,30,26],at:{x:P.armchair.x+15,y:AF},near:[P.armchair.x-6,AF-8,42,18],label:'窝进扶手椅',
  spots:[{x:P.armchair.x+15,y:P.armchair.y+16,z:P.armchair.y+26.5,face:'R'}],up:()=>[{x:P.armchair.x+15,y:P.armchair.y+16,z:P.armchair.y+26.5}],down:()=>[{x:P.armchair.x+15,y:AF}],floor:()=>({x:P.armchair.x+15,y:AF}),
  k:()=>S.tod==='night'||Math.random()<.5?'sleep':'lie',ex:'content',doing:'窝在扶手椅里',ai:{mood:'rest',w:1.2}});
const WS=P.winSeat;
const WF=WS.y+20;
A.seatThing({id:'winseat',n:'窗边软座',hit:[WS.x,WS.y-8,WS.w,18],at:{x:WS.x+24,y:WF},near:[WS.x-4,WF-8,WS.w+8,18],label:()=>S.tod==='night'?'在窗边睡一觉（会做梦）':'在窗边趴一会儿',
  spots:[{x:WS.x+12,y:WS.y+1,z:WS.y+10.5,face:'R'},{x:WS.x+36,y:WS.y+1,z:WS.y+10.5,face:'L'}],up:i=>[{x:WS.x+12+i*24,y:WS.y+1,z:WS.y+10.5}],down:i=>[{x:WS.x+12+i*24,y:WF}],floor:i=>({x:WS.x+12+i*24,y:WF}),
  k:()=>S.tod==='night'?'sleep':'lie',ex:'lookUp',doing:'在窗边做梦',ai:{mood:'rest',w:()=>S.tod==='night'?3:1},inn:c=>{c.dream=true},out:c=>{c.dream=false}});
T({id:'lectern',n:'说明书讲台',hit:[P.lectern.x-2,P.lectern.y-4,24,32],at:P.lecternAt,near:[P.lectern.x-8,P.lectern.y+28,36,20],label:'翻开猫咖说明书',ai:{mood:'play',w:.4},
  go(c){run(c,[{go:P.lecternAt},{fn:c=>{c.face='L'}},{k:'sit',dur:.6,ex:'curious'},{k:'maneki',dur:.6},{fn:c=>{if(c.me)openDocs()}},{k:'sit',dur:1.4,ex:'content',soft:1}])}});
function openDocs(){linkDialog('docs','猫咖说明书','book','Clowder AI 是把一群 AI agent 变成真正团队的那一层：持久身份、跨模型互审、共享记忆、协作纪律。安装、命令、每只猫的本事，说明书里都写着。',['docs','site','tips'],'identity')}
// 夜里在窗边软座、或者在自己窝里睡着的店猫，头上冒梦泡泡
A.overs.push(vis=>{for(const c of S.cats){if(c.hidden||c.gone||c.k!=='sleep')continue;if(!(c.dream||(c.kind==='npc'&&S.tod==='night')))continue;const x=Math.round(c.x),y=Math.round(c.top??c.y-16);if(vis(x-4,y-24,30,26))dreamBubble(x+5,y,A.t+c.id,c.id%4)}});

/* ================= 后院和河对岸：许愿池、石桌象棋、长椅、路标、邮筒、小门 ================= */
const starPx=(x,y)=>{x=Math.round(x);y=Math.round(y);P1(x,y-1,'#ffd84a');R(x-1,y,3,1,'#ffd84a');P1(x,y+1,'#ffd84a');P1(x,y,'#fff8e0')};
T({id:'pond',n:'许愿池',hit:[P.pond.x-36,P.pond.y-16,72,32],at:{x:P.pond.x,y:P.pond.y+20},near:[P.pond.x-34,P.pond.y+12,68,18],label:'往许愿池里投一颗星星',ai:{mood:'play',w:c=>c.pal===3?3:.6},
  go(c){run(c,[{go:{x:P.pond.x+rr(-12,12),y:P.pond.y+20}},{fn:c=>{c.face=c.x<P.pond.x?'R':'L'}},{k:'maneki',dur:.7,fn:c=>{const tx=P.pond.x+rr(-14,14),ty=P.pond.y+rr(-2,5);
      S.flying.push({x0:c.x,y0:c.y-12,x1:tx,y1:ty,t0:now(),dur:.7,arc:22,draw:f=>starPx(f.x,f.y),done:()=>{S.ripples.push({x:tx,y:ty,t0:now(),k:0});if(A.play&&near(me,P.pond,160))sfx('pop')}})}},
    {k:'sit',dur:1.2,ex:'sparkle'},{fn:c=>{if(c.me)openStar()}}])}});
function openStar(){linkDialog('star','许愿池','star','星星落进池子里，漾开一圈。许个愿吧：希望猫猫咖啡馆越来越好。\n在 GitHub 上给猫猫咖啡馆点一颗 Star，就等于往池子里投了一颗。',['github','inner'],'open')}
// 石桌象棋：两个石凳都坐了猫，就开一盘
const CH=P.stools2,CF=CH[0].y+16;
A.seatThing({id:'chess',n:'石桌象棋',hit:[P.chess.x-20,P.chess.y-6,62,28],at:c=>{const l=CH[0],r=CH[1];return c.x<P.chess.x+10?{x:l.x+2,y:CF}:{x:r.x+8,y:CF}},near:[P.chess.x-24,P.chess.y+16,70,16],
  label:()=>S.chess&&S.chess.on?'它们在下棋（坐不下了）':'坐到石凳上，等一只猫来下棋',spots:CH.map((s,i)=>({x:s.x+5,y:s.y+1,z:s.y+8.5,face:i?'L':'R'})),
  up:i=>[{x:CH[i].x+5,y:CH[i].y+1,z:CH[i].y+8.5}],down:i=>[{x:CH[i].x+(i?9:1),y:CF}],floor:i=>({x:CH[i].x+(i?9:1),y:CF}),
  k:'sit',ex:'focus',doing:'在下象棋',dur:()=>rr(18,26),ai:{mood:'social',w:()=>chessOcc()===1?6:.5}});
const chessTh=TID('chess'),chessOcc=()=>chessTh.occ.filter(c=>c&&!c.gone).length;
const PIECES=()=>[[-7,0,0],[-4,0,0],[-1,0,0],[2,0,0],[5,0,0],[-6,3,1],[-3,3,1],[0,3,1],[3,3,1],[6,3,1]].map(([x,y,side])=>({x,y,side}));
S.chess={on:false,pieces:PIECES(),next:0,cd:0};
tick(dt=>{const G=S.chess,occ=chessTh.occ,a=occ[0],b=occ[1],seated=c=>c&&!c.gone&&!c.k.startsWith('walk')&&c.k!=='leap'&&c.z!=null;G.cd-=dt;
  if(!G.on){if(seated(a)&&seated(b)&&G.cd<=0){G.on=true;G.t0=now();G.pieces=PIECES();G.next=0;G.who=[a,b];if(A.play&&(a.me||b.me))say(`和${(a.me?b:a).name}下一盘象棋`)}return}
  if(!seated(a)||!seated(b)||a!==G.who[0]||b!==G.who[1]){G.on=false;G.cd=2;return}
  if((G.next-=dt)<=0){G.next=rr(.6,1.2);const p=rnd(G.pieces),mv=Math.random()<.5?[rnd([-3,3]),0]:[0,p.side?-1:1];p.x=Math.max(-7,Math.min(6,p.x+mv[0]));p.y=Math.max(0,Math.min(3,p.y+mv[1]));
    if(Math.random()<.15&&G.pieces.length>4)G.pieces.splice(G.pieces.indexOf(rnd(G.pieces.filter(q=>q!==p))),1);if(A.play&&near(me,P.chess,140))sfx('clack');emote(Math.random()<.5?a:b,rnd(['q','note']),.8)}
  if(now()-G.t0>14){G.on=false;G.cd=5;const w=Math.random()<.5?a:b,l=w===a?b:a;emote(w,'heart',1.6);emote(l,'anger',1.2);news(`${a.name} 和 ${b.name} 下了一盘象棋，${w.name}赢了`);
    if(w.me||l.me){say(w.me?'你赢了！':`${w.name}赢了。再来一盘？`);A.emit('chess',w.me)}}});
const BF=P.bench.y+24;
A.seatThing({id:'bench',n:'长椅',hit:[P.bench.x,P.bench.y-4,P.bench.w,19],at:{x:P.bench.x+21,y:BF},near:[P.bench.x-6,BF-8,P.bench.w+12,16],label:'在长椅上晒太阳',
  spots:[{x:P.bench.x+11,y:P.bench.y+7,z:P.bench.y+15.5,face:'R'},{x:P.bench.x+31,y:P.bench.y+7,z:P.bench.y+15.5,face:'L'}],up:i=>[{x:P.bench.x+11+i*20,y:P.bench.y+7,z:P.bench.y+15.5}],
  down:i=>[{x:P.bench.x+11+i*20,y:BF}],floor:i=>({x:P.bench.x+11+i*20,y:BF}),k:()=>S.tod==='night'?'sleep':'lie',ex:'content',doing:'在长椅上看许愿池',ai:{mood:'rest',w:1}});
const SG={x:P.sign.x-10,y:P.sign.y+50};
T({id:'signpost',n:'路标',hit:[P.sign.x-24,P.sign.y,60,46],at:SG,near:[SG.x-20,SG.y-8,56,16],label:'看看路标',ai:{mood:'explore',w:.3},
  go(c){run(c,[{go:SG},{fn:c=>{c.face='R';S.signT=now()+4}},{k:'sit',dur:.7,ex:'lookUp'},{fn:c=>{if(c.me)openSign()}},{k:'sit',dur:1,soft:1}])}});
function openSign(){linkDialog('sign','路标','sign','顺着小路出了这扇小门，就是猫咖外面的世界。三块木牌指着三个方向：',['inner','site','github'],'open')}
const MB={x:P.mailbox.x-8,y:P.mailbox.y+42};
T({id:'mailbox',n:'邮筒',hit:[P.mailbox.x-2,P.mailbox.y-2,24,38],at:MB,near:[MB.x-14,MB.y-8,40,16],label:'给猫咖写封信',ai:{mood:'play',w:.3},
  go(c){run(c,[{go:MB},{fn:c=>{c.face='R'}},{k:'maneki',dur:.6,fn:()=>{S.mailFlag=3}},{fn:c=>{if(c.me)openMail()}},{k:'sit',dur:.8,ex:'content',soft:1}])}});
function openMail(){linkDialog('mail','邮筒','mail','用得不顺、想要新功能、发现了 bug，都可以写信给猫咖。猫猫咖啡馆会把这些信整理成结构化的反馈，送到社区里。',['issues','inner'],'feedback')}
const GT={x:P.gate.x+18,y:P.gate.y-8};
T({id:'gate',n:'小门',hit:[P.gate.x-3,P.gate.y-4,P.gate.w+6,22],at:GT,near:[P.gate.x-6,GT.y-8,P.gate.w+12,14],label:'推推小门',
  go(c){run(c,[{go:GT},{k:'maneki',dur:.6},{k:'sit',dur:.8,ex:'curious'},{fn:c=>{if(c.me)say('小门推不开。门外是人类的世界——猫不出门。想出去看看，旁边的路标写着方向')}}])}});

/* ================= 屋顶：跑轮 → 发电机 → 一串大灯泡（屋顶永远是夜里，灯一亮就看得见） ================= */
// 跑轮在转（S.wheelA 在变）：发电机的闪电亮、电流沿着电线往灯上跑；灯泡一颗颗亮，照亮平台
S.wheelOn=0;let wheelA0=0,fullSaid=false;
const festPts=()=>{const n=P.festN;return Array.from({length:n},(_,i)=>festoonAt(P.festA,P.festB,P.festSag,(i+.6)/(n+.2)))};
tick(dt=>{const on=S.wheelA!==wheelA0;wheelA0=S.wheelA;S.wheelOn=on?1:Math.max(0,S.wheelOn-dt*2);
  if(on)S.power=Math.min(1,S.power+.07*dt);
  const lit=Math.ceil(S.power*P.festN-.001);if(lit>=P.festN&&!fullSaid&&near(me,P.wheel,200)){fullSaid=true;say('串灯全亮了！')}if(lit<P.festN)fullSaid=false;
  festPts().forEach((q,i)=>{if(i<lit)A.lights.push({x:q.x,y:q.y+12,r:20,col:FEST_COL[i%FEST_COL.length],a:.9},{x:q.x,y:q.y+4,r:6,col:'#fff8d0',a:1})})});
const WIRE=[{x:P.dyn.x+10,y:P.dyn.y+10},{x:P.pole.x+1,y:P.pole.y+P.pole.h-2},{x:P.festA.x,y:P.festA.y}],FBOX=[P.festB.x-12,P.festB.y-12,P.festA.x-P.festB.x+40,P.dyn.y+24-P.festB.y];
function along(pts,d){for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b.x-a.x,b.y-a.y);if(d<=l)return{x:a.x+(b.x-a.x)*d/l,y:a.y+(b.y-a.y)*d/l};d-=l}return null}
A.overs.push(vis=>{if(!vis(...FBOX))return;const t=now(),pts=festPts(),lit=Math.ceil(S.power*P.festN-.001);
  festoonWire(P.festA,P.festB,P.festSag);pts.forEach((q,i)=>festoonBulb(Math.round(q.x),Math.round(q.y),FEST_COL[i%FEST_COL.length],i<lit));
  if(lit>0){C.save();C.globalCompositeOperation='lighter';pts.forEach((q,i)=>{if(i>=lit)return;C.globalAlpha=.5+.12*Math.sin(t*4+i);C.drawImage(glowTex(9,FEST_COL[i%FEST_COL.length]),Math.round(q.x)-9,Math.round(q.y)-5)});C.restore()}
  if(S.wheelOn>0){const path=[...WIRE,...pts,P.festB],L=path.slice(1).reduce((s,b,i)=>s+Math.hypot(b.x-path[i].x,b.y-path[i].y),0);alpha(S.wheelOn,()=>{for(let k=0;k<7;k++){const p=along(path,(t*70+k*L/7)%L);if(p){R(Math.round(p.x)-1,Math.round(p.y)-1,2,2,'#ffd84a');P1(Math.round(p.x),Math.round(p.y),'#fffbe0')}}})}});

/* ================= 工坊的工具墙、合并门禁；门厅的星星罐子、迎宾立牌 ================= */
const TW={x:P.tools.x+16,y:P.tools.y+94};
T({id:'tools',n:'工具墙',hit:[P.tools.x,P.tools.y,P.tools.w,P.tools.h],at:TW,near:[TW.x-20,TW.y-10,40,20],label:'看看工具墙',ai:{mood:'play',w:.3},
  go(c){run(c,[{go:TW},{fn:c=>{c.face='R'}},{k:'sit',dur:.8,ex:'lookUp'},{fn:c=>{if(c.me)openTools()}}])}});
function openTools(){infoDialog('tools','工具墙','tool',[{k:'text',t:'扳手、放大镜、地球仪、相机、终端、画笔、拼图块——这是猫的工具。'},{k:'text',t:'实际上，它们是猫猫咖啡馆的 MCP 工具和按需加载的 Skills：做 PPT、生图、深度调研、定时任务、浏览器自动化……缺什么，就让猫去能力市场找，先评估安全再装上。'}],'skills',['docs'])}
S.merge={lights:[0,0,0],open:0};
T({id:'merge',n:'合并门禁',hit:[P.merge.x-2,P.merge.y-4,64,64],at:P.mergeAt,near:[P.mergeAt.x-26,P.mergeAt.y-14,52,24],label:c=>(A.Q&&A.Q.mergeLabel&&A.Q.mergeLabel(c))||'看看合并门禁',
  go(c){if(A.Q&&A.Q.onMerge&&A.Q.onMerge(c))return;run(c,[{go:P.mergeAt},{k:'sit',dur:.6,ex:'curious'},{fn:c=>{if(c.me)infoDialog('merge','合并门禁','gate',[{k:'text',t:'三盏灯：测试、CI、Review。全亮了，横杆才会抬起来，改动才能合进 main。'},{k:'text',t:'猫猫咖啡馆的家规：main 永远是绿的；写代码的猫和 review 的猫必须来自不同家族。叼着一颗"走流程"的毛线球来，就能亲手过一次门禁。'}],'sop')}}])}});
const SJ={x:P.jar.x+6,y:P.jar.y+62};
T({id:'starjar',n:'星星罐子',hit:[P.jar.x-4,P.jar.y-4,18,20],at:SJ,near:[SJ.x-14,SJ.y-8,28,18],label:'打开星星罐子',ok:()=>!(S.freeze>0),no:()=>'罐子还亮着，等它暗下来',ai:{mood:'play',w:.05},
  go(c){run(c,[{go:SJ},{fn:c=>{c.face='L'}},{k:'maneki',dur:.7,fn:c=>freeze(c)},{k:'sit',dur:1.2,ex:'focus'}])}});
function freeze(by){S.freeze=3.2;if(A.play&&near(me,P.jar,300))sfx('beep');let n=0;
  S.cats.forEach(o=>{if(o===by||o.gone||o.hidden||!near(o,by,220))return;n++;emote(o,'bang',2.6);   // 闲着的猫原地坐下；正在忙的只是愣一下，不打断（打断在半路会停在家具边上）
    if(!o.me&&A.idle(o)&&!o.place&&!o.riding&&o.z==null)run(o,[{k:'sit',dur:3,ex:'focus'}]);else if(!o.me&&Math.random()<.3)speak(o,'冻结！',2)});
  news(`${by.name==='你'?'你':by.name}打开了星星罐子：附近 ${n} 只猫停下来等指示`);A.emit('freeze',by);
  if(by.me)infoDialog('jar','星星罐子','star',[{k:'text',t:`你说了拉闸词「星星罐子」。附近 ${n} 只猫全都停下手里的事，等你指示。`},
    {k:'words',items:[['星星罐子','全面冻结：不发命令、不写文件、不 push，等你指示'],['绕路了','停下来，画出直线路径，丢掉绕路的部分'],['脚手架','检查产物是终态还是临时的，临时的就重写'],['喵约','重读全部家规，逐条对照']]},
    {k:'text',t:'猫猫咖啡馆里有一组这样的拉闸词，只有你直接对猫说的时候才会触发。'}],'magic',['tips'])}
const ST={x:P.stand.x+16,y:P.stand.y+42};
T({id:'stand',n:'迎宾立牌',hit:[P.stand.x-2,P.stand.y-2,34,34],at:ST,near:[ST.x-16,ST.y-10,32,18],label:'看看迎宾立牌',ai:{mood:'explore',w:.2},
  go(c){run(c,[{go:ST},{fn:c=>{c.face='R'}},{k:'sit',dur:.5,ex:'lookUp'},{fn:c=>{if(c.me)A.openWelcome()}}])}});
A.openWelcome=()=>linkDialog('welcome','欢迎光临 1024 猫咖','cat','这家店照着 Clowder AI（猫猫咖啡馆）开。在猫猫咖啡馆里，Claude、GPT、Gemini……每只 AI 猫都有自己的身份、画像和记忆，会互相 @、互相 review，一起把你的想法做成能跑的东西。\n在这里，你也是一只猫：接住人类从门缝塞进来的毛线球，解开它，挂进橱窗。',
  ['inner','site','github'],'multi',[{id:'camp',t:'开始训练营',key:'E'},{id:'close',t:'进店逛逛',key:'Esc'}],{act:id=>{if(id==='camp'){A.dlg.close();A.camp&&A.camp.start();return true}}});

/* ---------- 店猫的新去处：小狸花爱泡图书馆，烁烁爱看许愿池里的鱼，斑斑爱下棋 ---------- */
Object.assign(A.LIKES[4],{shelf0:1.5,shelf1:1.5,shelf2:2,shelf3:1.5,shelf4:1.5,catalog:2,readtable:2.5,winseat:1});
Object.assign(A.LIKES[3],{pond:3,lectern:.8,bench:1});Object.assign(A.LIKES[5],{chess:3,pond:1});
});
