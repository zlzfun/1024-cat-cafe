/* 1024 猫咖 · 小游戏（设计见 docs/店内设计.md 第三节）。依赖 world-acts.js、world4-things.js、world4-vista.js、world-roof.js、world-river.js、props-kit.js、claw-art.js。
   - 地板钢琴 + 曲谱架：跳上钢琴，←→ 挪爪子、E 跳到那个键上（点琴键也行），照着曲谱架上的谱弹完一首；烁烁有时自己弹完一整首。
   - 抓娃娃机：凑过去切到特写（挂在"看风景"那一套上，画面在 claw-art.js）：←→ / 鼠标挪爪子，E / 点一下 落下去抓；十种玩偶。别的猫也来抓。
   - 猫跑轮：连按 → 跑快点，十六颗大灯泡全亮放一场烟花，记最快几秒。别的猫只是慢慢跑。
   - 秋千：顺着摆的方向按 ←→ 越荡越高，E 松手飞出去，正好落进落叶堆算一次。
   - 激光点、泡泡、扫地机器人的小玩头；六样的成绩（A.games，前台猫、图鉴读它）。
   小船和钓鱼在 world-river.js；成绩都记在图鉴那份存档里（A.guide.games()），跟着你的猫。 */
WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,speak,say,sfx,news,after,T,TID,settle,unclaim,dist,idle,land,faceTo,borrow,setK,free,useThing}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,tick=f=>A.tickers.push(f),atMe=(p,d=220)=>A.play&&near(me,p,d);
const GS=()=>A.guide.games(),save=()=>A.guide.save();
let newsT=0;const news1=s=>{if(now()<newsT)return;newsT=now()+6;news(s)};

/* ================= 成绩 ================= */
const GAMES=[{id:'boat',n:'小船',room:'一楼 · 河边',th:'boat'},{id:'fish',n:'钓鱼',room:'一楼 · 河边',th:'fish0'},{id:'piano',n:'地板钢琴',room:'二楼 · 大客厅',th:'piano'},
  {id:'claw',n:'抓娃娃机',room:'一楼 · 1024 舞台',th:'claw'},{id:'wheel',n:'猫跑轮',room:'屋顶',th:'wheel'},{id:'swing',n:'秋千',room:'一楼 · 后院',th:'swing'},
  {id:'dance',n:'迪斯科舞池',room:'地下 · 迪斯科舞厅',th:'dancefloor'}];   // 第七样：world-b1.js
const fishKinds=()=>{const L=A.guide.fishLog();return FISH_KINDS.filter(f=>!f.junk&&L[f.id]).length},fishAll=()=>FISH_KINDS.filter(f=>!f.junk).length;
function recLine(id){const g=GS();
  if(id==='boat')return g.boat&&g.boat.trips?`一趟最多捞了 ${g.boat.best||0} 颗毛线球`:'';
  if(id==='fish')return fishKinds()?`鱼谱 ${fishKinds()}/${fishAll()}`:'';
  if(id==='piano'){const n=Object.keys((g.piano||{}).songs||{}).length;return n?`会弹 ${n}/${SONGS.length} 首`:''}
  if(id==='claw'){const n=Object.keys((g.claw||{}).got||{}).length;return n?`玩偶 ${n}/${PRIZES.length} 种`:''}
  if(id==='wheel')return g.wheel&&g.wheel.best?`最快 ${g.wheel.best.toFixed(1)} 秒点亮串灯`:'';
  if(id==='swing')return g.swing&&g.swing.hits?`正中落叶堆 ${g.swing.hits} 次`:'';
  if(id==='dance')return g.dance&&g.dance.plays?`一曲最多踩中 ${g.dance.best||0} 块`:'';return''}
A.games={GAMES,rec:recLine,summary:()=>GAMES.map(G=>({...G,rec:recLine(G.id)}))};

/* ================= 地板钢琴 + 曲谱架 ================= */
// 简谱：1～7 是 C5～B5（键 0～6），上面加点的 1～5 是 C6～G6（键 7～11）
const SONGS=[{n:'小星星',k:[0,0,4,4,5,5,4,3,3,2,2,1,1,0]},{n:'两只老虎',k:[0,1,2,0,0,1,2,0,2,3,4,2,3,4]},{n:'欢乐颂',k:[2,2,3,4,4,3,2,1,0,0,1,2,2,1,1]},{n:'送别',k:[4,2,4,7,5,7,4,4,0,1,2,1,0,1]}];
A.SONGS=SONGS;
const PN=P.piano,KY=PN.y+14,keyX=i=>PN.x+5+i*8,keyOf=x=>Math.max(0,Math.min(11,Math.floor((x-PN.x-1)/8)));
const onPiano=c=>c.z==null&&!c.hidden&&c.x>=PN.x+1&&c.x<PN.x+97&&c.y>=PN.y+2&&c.y<=PN.y+26;
const jp=i=>({d:String(i%7+1),hi:i>=7});
S.piano2={song:0,cur:0,by:null,pos:0};
const PZ=S.piano2;let lastKey=-1,lastDx=0,rep=0;
function pianoJump(c,i){PZ.cur=i;run(c,[{jump:{x:keyX(i),y:KY+rr(-1,1)},h:7,dur:.22}],true)}
function pianoSteer(dx,dy){if(dy&&!dx)return false;if(!dx){lastDx=0;return true}const t=now();
  if(dx!==lastDx||t>rep){PZ.cur=Math.max(0,Math.min(11,PZ.cur+dx));rep=t+(dx!==lastDx?.32:.11);sfx('tick')}lastDx=dx;return true}
function pianoTap(x,y){if(x<PN.x||x>PN.x+98||y<PN.y-6||y>PN.y+30)return false;pianoJump(me,keyOf(x));return true}
function onNote(k){const s=SONGS[PZ.song].k;if(k===s[PZ.pos]){PZ.pos++;if(PZ.pos>=s.length){PZ.pos=0;songDone(me,PZ.song)}}else PZ.pos=k===s[0]?1:0}
function songDone(c,si){const song=SONGS[si];for(let i=0;i<10;i++)A.fx.push({kind:'note',x:PN.x+rr(0,98),y:PN.y+rr(-4,10),t0:now()+i*.12,life:1.8});sfx('fanfare');
  S.cats.forEach(o=>{if(o===c||o.me||o.hidden||o.place||o.working||!near(o,PN,170))return;if(idle(o)&&o.z==null&&Math.random()<.7){const p=land(PN.x+rr(-10,110),PN.y+rr(-26,-12));run(o,[{go:p},{fn:o=>{faceTo(o,{x:PN.x+49,y:PN.y})}},{k:'meow',dur:1.8},{k:'sit',dur:rr(2,4),ex:'happy'}])}
    else emote(o,'note',1.6)});
  if(c.me){const g=GS(),P2=g.piano=g.piano||{songs:{}},first=!P2.songs[song.n];P2.songs[song.n]=(P2.songs[song.n]||0)+1;save();const n=Object.keys(P2.songs).length;
    say(first?`学会了《${song.n}》（会弹 ${n}/${SONGS.length} 首）。全屋的猫都抬起头来听`:`又弹了一遍《${song.n}》（会弹 ${n}/${SONGS.length} 首）`);news(`你在二楼大客厅弹完了一首《${song.n}》`);A.emit('game','piano')}
  else news1(`${c.name}在二楼大客厅的钢琴上弹了一首《${song.n}》`)}
tick(()=>{const k=PZ.by===me&&me.place&&onPiano(me)?keyOf(me.x):-1;if(k>=0&&k!==lastKey)onNote(k);lastKey=k;if(PZ.by&&(PZ.by.gone||PZ.by===me&&!me.place&&!me.cur&&!me.q.length))PZ.by=null});
{const th=TID('piano'),go0=th.go;th.label=c=>c.me?'跳上钢琴（照着曲谱架弹）':'在钢琴上走一段';
  th.go=c=>{if(!c.me){npcPiano(c,go0);return}const k0=keyOf(c.x);PZ.cur=k0;PZ.pos=0;
    run(c,[{go:{x:keyX(k0),y:KY}},{fn:c=>{PZ.by=c;c.doing='在弹钢琴';c.onLeave=c=>{if(PZ.by===c)PZ.by=null;c.doing=null};
      settle(c,{k:'sit',ex:'focus',steer:pianoSteer,act:()=>{pianoJump(me,PZ.cur);return true},tap:pianoTap,prompt:()=>'←→ 挪爪子 · E 跳上去 · 点琴键也行 · ↑↓ 下来',
        leave:c=>[{jump:{x:c.x,y:PN.y-4},h:6}]});
      if(!GS().piano)say(`照着曲谱架上的《${SONGS[PZ.song].n}》，一个键一个键跳上去`)}}])}}
// 烁烁有时候自己在上面弹完一整首
function npcPiano(c,go0){if(c.pal!==3||Math.random()>.45){go0(c);return}const si=Math.floor(Math.random()*SONGS.length),s=SONGS[si].k,steps=[{go:{x:keyX(s[0]),y:KY}}];
  s.forEach(k=>steps.push({jump:{x:keyX(k),y:KY},h:6,dur:.22},{k:'sit',dur:.16,soft:1}));steps.push({fn:c=>songDone(c,si)},{k:'happy',dur:.8,soft:1},{go:{x:keyX(11)+12,y:KY}});run(c,steps)}
// 你在弹的时候：键上一个小爪印（光标），画面下方一张曲谱卡
A.overs.push(vis=>{if(PZ.by!==me||!me.place||!vis(PN.x,PN.y-10,100,40))return;const x=keyX(PZ.cur),b=Math.floor(now()*4)%2;
  R(x-2,PN.y-6+b,5,1,'#241a2e');R(x-1,PN.y-5+b,3,1,'#241a2e');P1(x,PN.y-4+b,'#241a2e');R(x-1,PN.y-6+b,3,1,'#ffd84a');P1(x,PN.y-5+b,'#ffd84a');
  alpha(.55,()=>R(PN.x+1+PZ.cur*8,PN.y+1,7,22,'#ffd84a'))});
// 曲谱卡画在钢琴上方（镜头贴着房间底边，钢琴在画面下方，卡片不能压着它）
// 曲谱卡：像素字（12×k 个画布像素，k 和名牌一样按像素密度取整），硬边的像素窗框
A.huds.push((hx,scale,dpr,v)=>{if(PZ.by!==me||!me.place)return;let pk=Math.max(1,Math.floor(dpr));if(pk*(pk+1)<dpr*dpr)pk++;const song=SONGS[PZ.song],W=hx.canvas.width,H=hx.canvas.height,fs=12*pk,step=Math.round(19*dpr);
  const w=Math.max(song.k.length*step+28*dpr,220*dpr),h=Math.round(58*dpr),px=(PN.x+49-v.x)*scale,py=(PN.y-30-v.y)*scale,t=now();
  const x0=Math.round(Math.max(8*dpr,Math.min(W-w-8*dpr,px-w/2))),y0=Math.round(Math.max(8*dpr,py-h));
  hx.save();const k=pk;hx.fillStyle='#140e1a';hx.fillRect(x0+k,y0,w-2*k,h);hx.fillRect(x0,y0+k,w,h-2*k);hx.fillStyle='#fff4dc';hx.fillRect(x0+2*k,y0+k,w-4*k,h-2*k);hx.fillRect(x0+k,y0+2*k,w-2*k,h-4*k);hx.fillStyle='#241a2e';hx.fillRect(x0+2*k,y0+2*k,w-4*k,h-4*k);
  hx.font=`${12*pk}px FusionPixel,"PingFang SC","Microsoft YaHei",sans-serif`;hx.textAlign='left';hx.textBaseline='middle';hx.fillStyle='#ffd84a';
  const g=GS().piano,n=g?Object.keys(g.songs||{}).length:0;hx.fillText(`曲谱架 · 《${song.n}》`,x0+12*dpr,y0+14*dpr);hx.fillStyle='#b8aec8';hx.textAlign='right';hx.fillText(`会弹 ${n}/${SONGS.length} 首 · 曲谱架上能翻页`,x0+w-12*dpr,y0+14*dpr);
  hx.textAlign='center';hx.font=`${fs}px FusionPixel,ui-monospace,Menlo,monospace`;const sx=x0+w/2-(song.k.length-1)*step/2;
  song.k.forEach((k,i)=>{const {d,hi}=jp(k),x=sx+i*step,y=y0+38*dpr,done=i<PZ.pos,nx=i===PZ.pos;hx.fillStyle=done?'#ffd84a':nx?(Math.floor(t*3)%2?'#ffffff':'#8a7aa8'):'#6a5e80';
    hx.fillText(d,Math.round(x),Math.round(y));if(hi)hx.fillRect(Math.round(x-k),Math.round(y-9*dpr-k),2*k,2*k)});hx.restore()});
T({id:'sheet',n:'曲谱架',hit:[P.musicStand.x-1,P.musicStand.y,12,24],at:P.standAt,near:[P.standAt.x-14,P.standAt.y-16,30,26],label:()=>`翻到下一首（现在是《${SONGS[PZ.song].n}》）`,ai:{mood:'play',w:.15},
  go(c){run(c,[{go:P.standAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.5,fn:()=>{PZ.song=(PZ.song+1)%SONGS.length;PZ.pos=0;sfx('page')}},
    {fn:c=>{if(c.me)say(`曲谱架翻到了《${SONGS[PZ.song].n}》：${SONGS[PZ.song].k.map(k=>jp(k).d+(jp(k).hi?'̇':'')).join(' ')}`)}},{k:'sit',dur:.6,ex:'curious',soft:1}])}});

/* ================= 抓娃娃机 ================= */
const PRIZES=[{k:'xian',n:'宪宪玩偶',pal:1,grip:.72},{k:'yan',n:'砚砚玩偶',pal:2,grip:.72},{k:'shuo',n:'烁烁玩偶',pal:3,grip:.72},{k:'li',n:'小狸花玩偶',pal:4,grip:.72},{k:'ban',n:'斑斑玩偶',pal:5,grip:.72},{k:'jin',n:'金哥玩偶',pal:6,grip:.72},
  {k:'fish',n:'小鱼玩偶',grip:.78},{k:'yarn',n:'毛线球',grip:.82},{k:'mouse',n:'小老鼠',grip:.85},{k:'gold',n:'金色小鱼干',grip:.32,rare:1}];
A.PRIZES=PRIZES;
const prizeCol=p=>p.pal?PAL[p.pal].body:p.k==='fish'?'#5B9BD5':p.k==='yarn'?'#e0533d':p.k==='mouse'?'#a8a4b0':'#ffd84a';
S.claw={cx:.5,cy:0,shut:0,prize:null,pop:0,busy:null};
const CL=S.claw;
const pickPrize=()=>{const r=Math.random();if(r<.05)return PRIZES[9];return PRIZES[Math.floor(Math.random()*9)]};
// 柜子里的一堆：底下一排 7 个，上面一排 4 个；x 是 0～1（左边 0.14 以内是出口，不放）
function newPile(){const L=[];for(let i=0;i<7;i++)L.push({p:pickPrize(),x:.2+i*.125+rr(-.02,.02),row:0});for(let i=0;i<4;i++)L.push({p:pickPrize(),x:.27+i*.19+rr(-.03,.03),row:1});
  if(!L.some(q=>q.p.rare)&&Math.random()<.5)L[3].p=PRIZES[9];return L}
const C2={pile:newPile()};A.clawPile=()=>C2.pile;   // 测试和开发工具条看柜子里有什么
function clawOpen(V){V.cl={x:.5,ph:'move',t0:now(),vx:0,L:0,R:0,hold:null,tries:0,wins:0,msg:'',msgT:0,tx:null};CL.busy=me;sfx('coin')}
function clawClose(V){CL.busy=null;CL.cy=0;CL.shut=0;CL.prize=null;if(V.cl&&V.cl.hold){C2.pile.push(V.cl.hold);V.cl.hold=null}}
function topAt(x){let best=null;for(const q of C2.pile){const d=Math.abs(q.x-x);if(d<.065&&(!best||q.row>best.row||q.row===best.row&&d<Math.abs(best.x-x)))best=q}return best}
function clawDrop(V){const c=V.cl;if(c.ph!=='move')return;c.ph='down';c.t0=now();c.tries++;sfx('whirr');const q=topAt(c.x);c.target=q;c.depth=q?(q.row?.62:.9):.96}
function msg(V,s){V.cl.msg=s;V.cl.msgT=now();A.vista.cap()}
tick(dt=>{const V=A.vista.cur;CL.pop=Math.max(0,CL.pop-dt);if(!V||V.kind!=='claw'||!V.cl)return;const c=V.cl,k=now()-c.t0;
  if(c.ph==='move'){const dir=(c.R?1:0)-(c.L?1:0);if(dir){c.x+=dir*.42*dt;c.tx=null}else if(c.tx!=null){const d=c.tx-c.x;c.x+=Math.sign(d)*Math.min(Math.abs(d),.6*dt)}c.x=Math.max(.06,Math.min(.95,c.x))}
  else if(c.ph==='down'){c.cy=Math.min(1,k/.8)*c.depth;if(k>=.8){c.ph='grab';c.t0=now();sfx('clunk')}}
  else if(c.ph==='grab'){c.shut=Math.min(1,k/.3);if(k>=.35){const q=c.target;c.out='miss';
      if(q&&C2.pile.includes(q)){const qa=1-Math.abs(q.x-c.x)/.065,ch=q.p.grip*(.42+.58*qa);if(Math.random()<ch){c.out=Math.random()<(1-qa)*.55?'slip':'win';C2.pile.splice(C2.pile.indexOf(q),1);c.hold=q}}
      c.ph='up';c.t0=now();sfx('whirr')}}
  else if(c.ph==='up'){c.cy=c.depth*(1-Math.min(1,k/.8));if(c.hold&&c.out==='slip'&&k>.4){const q=c.hold;c.hold=null;q.row=0;q.x=Math.max(.18,Math.min(.95,c.x+rr(-.04,.04)));C2.pile.push(q);msg(V,'滑下去了！差一点');sfx('no')}
    if(k>=.8){c.cy=0;if(c.hold){c.ph='carry';c.t0=now();c.x0=c.x}else{if(c.out==='miss')msg(V,'爪子空着上来了');c.ph='open';c.t0=now()}}}
  else if(c.ph==='carry'){c.x=c.x0+(.07-c.x0)*Math.min(1,k/.7);if(k>=.7){c.ph='open';c.t0=now()}}
  else if(c.ph==='open'){c.shut=Math.max(0,1-k/.3);if(k>=.4){if(c.hold){won(V,c.hold.p);c.hold=null;C2.pile.push({p:pickPrize(),x:rr(.2,.92),row:0,fall:now()})}c.ph='move';c.t0=now()}}
  CL.cx=c.x;CL.cy=c.cy||0;CL.shut=c.shut>.5?1:0;CL.prize=c.hold?prizeCol(c.hold.p):null});
function won(V,p){const g=GS(),G2=g.claw=g.claw||{got:{}},first=!G2.got[p.k];G2.got[p.k]=(G2.got[p.k]||0)+1;save();V.cl.wins++;V.cl.last={p,t0:now()};CL.pop=1.2;sfx('prize');
  const n=Object.keys(G2.got).length;msg(V,`抓到了：${p.n}！${first?'第一次抓到 · ':''}抓到过 ${n}/${PRIZES.length} 种`);if(p.rare)news('你在抓娃娃机里抓到了金色小鱼干！');A.emit('game','claw')}
A.vista.add('claw',{info:()=>({n:'抓娃娃机',sub:'挪爪子，按下去抓：六只店猫的玩偶、小鱼、毛线球、小老鼠……',hint:'←→ 或鼠标挪爪子 · E / 点一下 抓'}),
  open:clawOpen,close:clawClose,draw:E=>drawClawVista(E,C2.pile,PRIZES),
  cap:V=>{const c=V.cl;if(!c)return'';const n=Object.keys((GS().claw||{}).got||{}).length;return c.msg&&now()-c.msgT<4?c.msg:`抓到过 ${n}/${PRIZES.length} 种 · 这一回抓了 ${c.tries} 次`+(c.wins?`、中了 ${c.wins} 个`:'')},
  act:V=>clawDrop(V),click:(x,y,V)=>clawDrop(V),pointer:(x,y,V)=>{if(V.cl&&V.cl.ph==='move'){const G=CLAW_GEO(V.W||480,V.H||270);V.cl.tx=Math.max(.06,Math.min(.95,(x-G.x0-G.pad)/(G.x1-G.x0-G.pad*2)))}},
  key:(e,V)=>{const k=e.key,c=V.cl;if(!c)return false;if(k==='ArrowLeft'||k==='a'||k==='A'){c.L=1;return true}if(k==='ArrowRight'||k==='d'||k==='D'){c.R=1;return true}if(/^(ArrowUp|ArrowDown|[wsWS])$/.test(k))return true;return false},
  keyup:(e,V)=>{const k=e.key,c=V.cl;if(!c)return;if(k==='ArrowLeft'||k==='a'||k==='A')c.L=0;if(k==='ArrowRight'||k==='d'||k==='D')c.R=0}});
// 店里：走到机器左边，你就切到特写；别的猫玩一会儿（机器上的爪子跟着动），三成能抓到
T({id:'claw',n:'抓娃娃机',hit:[P.claw.x,P.claw.y,36,58],at:P.clawAt,near:[P.clawAt.x-16,P.clawAt.y-14,40,26],label:()=>CL.busy&&CL.busy!==me?CL.busy.name+'在抓':'玩抓娃娃机',
  ok:c=>!c.hold&&(!CL.busy||CL.busy===c||CL.busy.gone),no:c=>c.hold?'叼着东西，先放下':CL.busy.name+'在玩，等一会儿',ai:{mood:'play',w:c=>CL.busy?0:c.pal===5?3:1},
  go(c){run(c,[{go:P.clawAt},{fn:c=>{if(CL.busy&&CL.busy!==c&&!CL.busy.gone){c.q=[];emote(c,'q');return}c.face='R';
    if(c.me){settle(c,{k:'sit',ex:'focus'});c.doing='在抓娃娃';c.onLeave=c=>{c.doing=null};A.vista.open('claw');return}
    CL.busy=c;c.doing='在抓娃娃';c.onLeave=c=>{if(CL.busy===c){CL.busy=null;CL.cy=0;CL.shut=0;CL.prize=null}c.doing=null};const tries=1+Math.floor(Math.random()*3),steps=[];
    for(let i=0;i<tries;i++){const tx=rr(.15,.95),win=Math.random()<.3,p=pickPrize();steps.push({k:'maneki',dur:1.4,soft:1,fn:()=>{CL.tx=tx}},{k:'sit',dur:.9,ex:'focus',fn:()=>{CL.drop=now()}},{k:'sit',dur:1.4,ex:'focus',fn:()=>{CL.win=win?p:null}},
      {fn:c=>{if(win){CL.pop=1.2;emote(c,'heart',1.6);if(atMe(P.claw,240)){sfx('prize');speak(c,'抓到了！',2)}news1(`${c.name}在抓娃娃机里抓到一只${p.n}`)}else if(Math.random()<.4)emote(c,'q',1)}})}
    steps.push({fn:unclaim},{k:'happy',dur:.6,soft:1});run(c,steps,true)}}])}});
// 别的猫在玩：机器上的爪子左右挪、放下去、提起来
tick(dt=>{const b=CL.busy;if(!b||b===me)return;if(b.gone){CL.busy=null;return}const k=now()-(CL.drop||-9);
  if(k<2.3){CL.cy=k<.9?k/.9*.9:k<1.4?.9:Math.max(0,.9*(1-(k-1.4)/.9));CL.shut=k>.9?1:0;CL.prize=k>1.4&&CL.win?prizeCol(CL.win):null}
  else{CL.cy=0;CL.shut=0;CL.prize=null;if(CL.tx!=null){const d=CL.tx-CL.cx;CL.cx+=Math.sign(d)*Math.min(Math.abs(d),.4*dt)}}});

/* ================= 猫跑轮：连按冲刺，十六颗全亮放烟花 ================= */
S.wheelV=0;S.fireworks=[];let wheelT0=null,fwT=-99,wLast=0,shown=false;
A.wheelGain=c=>c.me?.03+.21*S.wheelV:.03;          // world-acts.js 的跑轮每秒加多少电：别的猫慢，你连按越快越多
A.wheelSpin=c=>c.me?2+11*S.wheelV:5;
{const th=TID('wheel'),go0=th.go;th.go=c=>{if(!c.me){go0(c);return}go0(c);run(c,[{fn:c=>{if(!c.place)return;S.wheelV=.15;wheelT0=now();shown=false;
    c.place.steer=(dx,dy)=>{if(dy&&!dx||dx<0)return false;if(dx>0&&wLast<=0){S.wheelV=Math.min(1,S.wheelV+.13);sfx('tick')}wLast=dx;return true};
    c.place.prompt=()=>{const n=Math.ceil(S.power*P.festN-.001);return`连按 → 跑快点 · 串灯 ${n}/${P.festN} · ←↑↓ 出来`}}}],true)}}
tick(dt=>{S.wheelV=Math.max(0,S.wheelV-.55*dt);const full=S.power>=.999;
  if(full&&now()-fwT>12){fwT=now();show();const runner=S.cats.find(c=>c.doing==='在跑轮里跑');
    if(runner&&runner.me&&wheelT0!=null&&!shown){shown=true;const sec=now()-wheelT0,g=GS(),W=g.wheel=g.wheel||{},best=W.best==null||sec<W.best;if(best)W.best=sec;W.n=(W.n||0)+1;save();
      say(`用了 ${sec.toFixed(1)} 秒点亮全部串灯（最快 ${W.best.toFixed(1)} 秒）${best&&W.n>1?' · 新纪录！':''}`);A.emit('game','wheel')}
    news('屋顶的串灯全亮了，放了一场烟花')}
  // 放完烟花：灯一颗颗暗下去，下一只猫可以再来
  if(now()-fwT>9&&now()-fwT<20)S.power=Math.max(0,S.power-.12*dt);
  for(let i=S.fireworks.length-1;i>=0;i--){const f=S.fireworks[i];if(now()-f.t0>f.life)S.fireworks.splice(i,1)}
  S.fireworks.forEach(f=>{const k=now()-f.t0;if(k>f.up&&k<f.up+1)A.lights.push({x:f.x,y:f.y1,r:46,col:f.col,a:.8*(1-(k-f.up))})})});
// 烟花在天边那排屋顶上方炸开：站在平台上（镜头只看得到天的下半截）也看得见
function show(){const t=now();for(let i=0;i<9;i++){const x=rr(120,880),y1=Y3+rr(160,260),col=rnd(FEST_COL);S.fireworks.push({x,y0:Y3+330,y1,col,col2:rnd(FEST_COL),t0:t+i*.75+rr(0,.3),up:.8,life:2.6,r:rr(18,30)})}
  if(A.floorOf(me.y).id==='roof')for(let i=0;i<9;i++)after(i*.75+.8,()=>sfx('boom'))}
A.overs.push(vis=>{for(const f of S.fireworks){const k=now()-f.t0;if(k<0)continue;
  if(k<f.up){const u=k/f.up,y=Math.round(f.y0+(f.y1-f.y0)*(1-(1-u)*(1-u)));if(vis(f.x-2,y-2,4,14)){P1(f.x,y,'#fff4c0');alpha(.6,()=>{P1(f.x,y+2,f.col);P1(f.x,y+4,f.col)})}continue}
  const u=(k-f.up)/(f.life-f.up);if(!vis(f.x-f.r-4,f.y1-f.r-4,f.r*2+8,f.r*2+12))continue;alpha(Math.max(0,1-u),()=>{for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=f.r*Math.min(1,u*2.2);
    P1(Math.round(f.x+Math.cos(a)*r),Math.round(f.y1+Math.sin(a)*r+u*u*10),i%2?f.col:f.col2);if(u<.5)P1(Math.round(f.x+Math.cos(a)*r*.6),Math.round(f.y1+Math.sin(a)*r*.6+u*u*6),'#fff4c0')}})}});
A.events.fireworks=()=>{show()};

/* ================= 秋千：顺着摆荡越荡越高，松手落进落叶堆 ================= */
const SW=P.swing,GND=SW.y+48,SWK=9,SWD=.12;
S.swing={th:0,om:0,by:null,pump:0};const Q=S.swing;
const seat=()=>({x:SW.x+SW.L*Math.sin(Q.th),y:SW.y+SW.L*Math.cos(Q.th)});
tick(dt=>{dt=Math.min(dt,.05);if(Q.by&&(Q.by.gone||!Q.by.onSwing))Q.by=null;const pump=Q.by?Q.pump:0;
  Q.om+=(-SWK*Math.sin(Q.th)-SWD*Q.om*(Q.by?1:4)+pump)*dt;Q.th+=Q.om*dt;if(Math.abs(Q.th)>.78){Q.th=Math.sign(Q.th)*.78;Q.om*=-.3}
  const r=Q.by;if(r){const s=seat();r.x=s.x;r.y=GND;r.z=GND+.5;r.dy=Math.round(s.y-GND+1);r.face=Q.om>=0?'R':'L'}
  if(Q.by&&!Q.by.me&&Q.by.onSwing){const a=Math.abs(Q.th)<.3?1.2:0;Q.pump=Math.sign(Q.om||1)*a*(Math.abs(Q.th)<.45?1:0)}});
A.drawers.push((L,vis)=>{if(!vis(SW.x-50,SW.y-4,100,60))return;L.push([GND+.4,()=>{const s=seat();swingRopes(SW.x,SW.y,Math.round(s.x),Math.round(s.y));swingSeat(Math.round(s.x),Math.round(s.y))}])});
function swingSteer(dx,dy){if(dy&&!dx)return false;if(!dx){Q.pump=0;return true}const with_=Math.sign(Q.om)===dx||Math.abs(Q.om)<.05;
  Q.pump=with_?dx*(Math.abs(Q.th)<.45?2.1:.8):dx*1.4;if(with_&&Math.abs(Q.th)<.12&&now()-(Q.creak||0)>.9){Q.creak=now();if(Math.abs(Q.om)>.6)sfx('creak')}return true}
function release(c){const s=seat(),om=Q.om,vx=om*SW.L*Math.cos(Q.th),sp=Math.min(1,Math.abs(om)/2.4),T=.42+.36*sp,D=vx*T*1.25;
  Q.by=null;c.onSwing=false;c.place=null;const tx=s.x+D,ty=GND+Math.min(14,Math.abs(D)*.2),p=land(tx,ty);c.x=s.x;c.y=s.y;c.dy=0;c.z=undefined;sfx('whoosh');
  const hit=Math.abs(p.x-P.pile.x)<17&&Math.abs(p.y-P.pile.y)<11;
  run(c,[{jump:p,h:16+22*sp,dur:T},{fn:c=>{c.z=undefined;c.doing=null;if(hit&&S.pile>.45){A.pileBurst(c);if(c.me){const g=GS(),W=g.swing=g.swing||{};W.hits=(W.hits||0)+1;save();say(`正中落叶堆！（第 ${W.hits} 次）`);A.emit('game','swing')}}
    else if(hit){sfx('rustle');if(c.me)say('噗——落叶堆里的叶子还不够多，没炸开')}
    else{if(c.me)say(D>0&&p.x>P.pile.x?'飞过头了！啪叽':D>0?'差一点就到落叶堆了':'往左飞了……啪叽');run(c,[{k:'belly',dur:.7},{k:'sit',dur:.4,ex:'meh',soft:1}],true)}}}])}
T({id:'swing',n:'秋千',hit:()=>{const s=seat();return[s.x-10,SW.y,20,s.y-SW.y+6]},at:P.swingAt,near:[P.swingAt.x-20,P.swingAt.y-16,40,26],label:'坐上秋千',
  ok:c=>!c.hold&&!Q.by,no:c=>c.hold?'叼着东西呢':Q.by.name+'在荡',ai:{mood:'play',w:c=>Q.by?0:c.pal===5?2.5:.8},
  go(c){run(c,[{go:P.swingAt},{fn:c=>{if(Q.by&&Q.by!==c){c.q=[];emote(c,'q');return}c.doing='在荡秋千'}},{jump:()=>{const s=seat();return{x:s.x,y:GND,z:GND+.5}},h:12},
    {fn:c=>{Q.by=c;c.onSwing=true;c.onLeave=c=>{if(Q.by===c)Q.by=null;c.onSwing=false;c.doing=null;c.dy=0;if(c.z!=null&&!c.place){c.z=undefined;c.y=Math.max(c.y,GND+2)}};
      if(c.me){settle(c,{k:'sit',ex:'happy',steer:swingSteer,act:c=>{release(c);return true},prompt:()=>Math.abs(Q.th)<.2&&Math.abs(Q.om)<.3?'顺着摆的方向按 ←→ 荡起来 · ↑↓ 下来':'顺着摆的方向按 ←→ · E 松手飞出去',
        leave:c=>[{fn:c=>{c.dy=0;c.onSwing=false;if(Q.by===c)Q.by=null}},{jump:{...P.swingAt}},{fn:c=>{c.z=undefined}}]});if(!GS().swing)say('顺着摆的方向使劲，越荡越高；松手飞出去，看能不能落进右边的落叶堆')}
      else{const dur=rr(6,12),bold=c.pal===5&&Math.random()<.4;run(c,[{k:'sit',dur,ex:'happy'},{fn:c=>{if(bold&&Q.by===c)release(c);else{Q.by=null;c.onSwing=false;c.dy=0;run(c,[{jump:{...P.swingAt}},{fn:c=>{c.z=undefined;unclaim(c)}}],true)}}}],true)}}}])}});

/* ================= 激光点、泡泡：这一回的成绩 ================= */
let dotN=0,dotOn=false,bubN=0,bubOn=false;
A.onDot=(c,caught)=>{if(!c.me)return;if(caught){dotN++;say(`按住了！（这一回 ${dotN} 次）……它又从爪子底下溜走了`);sfx('pop')}else say('差一点！要等它停下来的那一下')};
A.onPop=c=>{if(c.me&&S.bubbleOn>0)bubN++};
tick(()=>{const on=S.laser.on>0;if(dotOn&&!on&&dotN){const g=GS(),D=g.dot=g.dot||{},best=dotN>(D.best||0);if(best)D.best=dotN;save();say(`激光关了。这一回按住了 ${dotN} 次（最多 ${D.best} 次）`)}if(!on)dotN=0;dotOn=on;
  const b=S.bubbleOn>0;if(bubOn&&!b&&bubN){const g=GS(),B=g.pop=g.pop||{},best=bubN>(B.best||0);if(best)B.best=bubN;save();say(`泡泡停了。这一回戳破了 ${bubN} 个（最多 ${B.best} 个）`)}if(!b)bubN=0;bubOn=b});

/* ================= 扫地机器人：骑上去以后自己开 ================= */
A.vacSteer=(V,dx,dy)=>{V.steer=dx||dy?{dx,dy}:null;return true};

/* ---------- 店猫：斑斑爱抓娃娃、荡秋千，烁烁爱弹琴 ---------- */
Object.assign(A.LIKES[5],{claw:3,swing:2.5});Object.assign(A.LIKES[3],{sheet:.5});
});
