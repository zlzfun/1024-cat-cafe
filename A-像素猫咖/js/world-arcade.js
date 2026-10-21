/* 1024 猫咖 · 游戏厅（设计见 docs/店内设计.md 第十七节"游戏厅"）。依赖 map-arcade.js、world4-vista.js（A.vista）；街机里的游戏在 js/arcade/（懒加载）。
   - 密道：小电影院东墙根那道缝（P.arcIn）走进去，就换到地下深处的密道西头；密道西头再往西走（P.arcBack）回电影院。
     没有门、没有招牌、不能点、悬停没有名字、不进图鉴、不算彩蛋，也没有谁会提起它。
   - 进了这一层才下载街机：先 js/arcade/core.js（主板），再五个游戏一起下；没下完就坐下来，屏幕上是 LOADING，下坏了是 OUT OF ORDER（再坐一次重新下）。
   - 五台街机：走到跟前按 E 坐下（背对着你），切到特写 'arc:<id>'：灯箱、屏幕、操纵台和你的两只爪子；Esc 起身回到游戏厅。
     机器一台一个，起身时正在玩就自动暂停，回来接着玩。
   - 最高分记在存档 guide.games().arcade 里，只给墙上的最高分榜看（S.arcBest），不进图鉴。
   - 存档不记游戏厅里的位置（A.savePos）：在这儿关了页面，下次醒在电影院密道口外面；万一醒在这一层（旧存档），也挪回去（照猫猫星球的做法）。 */
WORLD_MODS.push(A=>{
const {S,P,me,run,say,sfx,T,settle,inR}=A,tick=f=>A.tickers.push(f),here=()=>A.floorOf(me.y).id;
const CABS=P.arcCabs,IDS=CABS.map(c=>c.id),NAMES=['打砖块','俄罗斯方块','贪吃蛇','太空侵略者','猫猫咖啡馆'],
  SUBS=['一颗毛线球，一排砖','转一转，消一行','越吃越长的一根毛线','它们一排一排地往下走','一台很小很小的猫咖'],
  HINTS=['←→ 挪爪子 · 空格 发球','←→ 挪 · ↓ 快落 · ↑ 落到底 · 空格 / X 转','方向键 转弯 · 按住空格 冲刺','←→ 挪 · 空格 开火','方向键 走两步 · 空格 和身边的打个招呼'];
S.arcBusy=[0,0,0,0,0];

/* ---------- 密道：电影院东墙根 ⇄ 地下深处 ---------- */
let came=false;
const through=(dir,out)=>{run(me,[]);me.follow=null;A.transit(me,{id:'arcade',k:'walk',dir,out,outDir:dir},null)};
tick(()=>{if(me.transit||me.portalLock||me.place||me.hidden||me.z!=null)return;
  if(inR(me.x,me.y,P.arcIn)){came=true;through({x:1,y:0},{...P.arcSpawn,face:'R'});return}
  if(here()!=='arcade')return;
  if(inR(me.x,me.y,P.arcBack)){through({x:-1,y:0},{...P.arcOut,face:'L'});return}
  if(!came){const o=P.arcOut;me.x=o.x;me.y=o.y;me.place=null}});   // 不是走密道进来的（醒在这儿）：挪回电影院
A.savePos=()=>here()==='arcade'?{x:P.arcOut.x,y:P.arcOut.y}:null;
// 指路（图鉴的"带我去"）：人在游戏厅、要去的地方在店里，先往密道口走
{const g0=A.goThing;A.goThing=id=>{if(here()==='arcade'){A.tap(P.arcBack[0]+2,P.arcBack[1]+P.arcBack[3]/2);say('先从密道回去');return true}return g0?g0(id):false}}

/* ---------- 懒加载：进了这一层才下载 ---------- */
const LD={st:'idle',n:0,p:null};
function load(){if(LD.p)return LD.p;LD.st='loading';LD.n=0;
  const one=f=>new Promise((ok,no)=>{const s=document.createElement('script');s.src='js/arcade/'+f+'.js';s.onload=()=>{LD.n++;ok()};s.onerror=()=>{s.remove();no(f)};document.body.appendChild(s)});
  return LD.p=(window.ARC?Promise.resolve():one('core')).then(()=>Promise.all(IDS.filter(id=>!ARC.has(id)).map(id=>one(id).catch(()=>null)))).then(()=>{LD.st='ok'},()=>{LD.st='fail';LD.p=null})}
tick(()=>{if(LD.st==='idle'&&here()==='arcade')load()});

/* ---------- 街机：坐下来玩 ---------- */
const GS=()=>A.guide.games(),bests=()=>GS().arcade=GS().arcade||{};
tick(()=>{S.arcBest=bests()});
const MACH={};
function machine(i){const id=IDS[i];if(MACH[id])return MACH[id];if(!window.ARC||!ARC.has(id))return null;
  return MACH[id]=ARC.machine(id,{best:bests()[id]||0,pal:PAL[me.pal]||PAL[0],onBest:n=>{bests()[id]=n;A.guide.save()}})}
CABS.forEach((c,i)=>{const kind='arc:'+c.id;
  T({id:'arcade:'+c.id,n:NAMES[i],hit:[c.x,c.y,34,62],at:c.at,near:[c.cx-15,c.at.y-12,30,22],label:'坐下来玩'+NAMES[i],hidden:c=>!c.me,ok:c=>!c.hold,no:()=>'叼着东西呢，先放下',
    go(c){run(c,[{go:CABS[i].at},{fn:c=>{settle(c,{k:'back'});c.doing='在玩'+NAMES[i];S.arcBusy[i]=1;c.onLeave=c=>{c.doing=null;S.arcBusy[i]=0};if(LD.st==='fail')load();A.vista.open(kind)}}])}});
  A.vista.add(kind,{info:()=>({n:NAMES[i],sub:SUBS[i],hint:HINTS[i]+' · 回车 暂停',esc:'起身'}),
    close:()=>{const m=MACH[c.id];if(!m)return;m.release();if(m.mode==='play')m.mode='pause'},
    draw:E=>cabVista(E,i,machine(i)),
    key:(e,V)=>{const m=machine(i);if(m)return m.key(e,true);return /^(Arrow|[wasdWASD ]$|Enter)/.test(e.key)},
    keyup:(e,V)=>{const m=MACH[c.id];if(m)m.key(e,false)},act:()=>{},click:()=>{},
    cap:()=>{const m=MACH[c.id];if(!m)return LD.st==='fail'?'这台机器没开起来':'正在开机……';if(m.spec.free)return '';return (m.mode==='play'||m.mode==='pause'||m.mode==='over'?`分数 ${m.score} · `:'')+`最高分 ${m.best}`}})});
// 每帧推一下正在玩的那台；分数变了刷新字幕
let capS='';
tick(dt=>{const V=A.vista.cur;if(!V||!/^arc:/.test(V.kind)||V.phase!=='on')return;const i=IDS.indexOf(V.kind.slice(4)),m=machine(i);if(!m)return;m.tick(dt);
  const s=m.mode+m.score+'/'+m.best;if(s!==capS){capS=s;A.vista.cap()}});
// 老秘籍（world-eggs.js）在 window 上听方向键和 B、A：街机里按的不算（A.arcOn）
Object.defineProperty(A,'arcOn',{get:()=>A.vista.on&&/^arc:/.test(A.vista.kind||'')});

/* ---------- 游戏厅里偶尔有一台街机自己"哔哔"两声（待机的音乐），坐下来玩的时候不响 ---------- */
let ambT=6;
tick(dt=>{if(here()!=='arcade'||A.vista.on||typeof Sound==='undefined'||!Sound.tone)return;if((ambT-=dt)>0)return;ambT=7+Math.random()*9;
  if(me.x<330)return;const sc=[523,587,659,784,880,1047],n=2+Math.floor(Math.random()*3),b=Math.floor(Math.random()*3);for(let k=0;k<n;k++)Sound.tone(sc[(b+k*2)%6],.09,{type:'square',vol:.006,delay:k*.1})});

/* ---------- 兑币机、汽水机：碰一下，说一句 ---------- */
T({id:'arcade:coin',n:'兑币机',hit:[P.arcCoin.x,P.arcCoin.y,30,54],at:P.arcCoinAt,label:'换几个游戏币',hidden:c=>!c.me,
  go(c){run(c,[{go:P.arcCoinAt},{k:'maneki',dur:.8,fn:()=>{sfx('coin');say(A.rnd(['叮叮当当，掉出来三枚游戏币：正面一只猫爪，背面写着 1024','游戏币是热的：刚才还有谁来换过？','兑币机吐出一枚游戏币，又吐出一枚……然后打了个嗝']))}},{k:'sit',dur:.6,soft:1}])}});
T({id:'arcade:soda',n:'汽水机',hit:[P.arcSoda.x,P.arcSoda.y,30,62],at:P.arcSodaAt,label:'买一罐汽水',hidden:c=>!c.me,
  go(c){run(c,[{go:P.arcSodaAt},{k:'maneki',dur:.8,fn:()=>{sfx('clack');say(A.rnd(['咕咚，掉下来一罐猫薄荷汽水','汽水机里的灯一闪一闪，掉下来一罐鱼味汽水（真的有人喝吗）','罐子太冰了，爪子缩了一下']))}},{k:'sit',dur:.6,soft:1}])}});

/* ---------- 特写：一台街机的正面（灯箱、屏幕、操纵台），底下伸上来你的两只爪子 ---------- */
function cabVista(E,i,m){const {w,h,t}=E,[a,d,l]=ARC_COL[i],SW=m?m.spec.w:160,SH=m?m.spec.h:144,k=m?m.k:{},pal=PAL[me.pal]||PAL[0];
  R(0,0,w,h,'#120c1c');for(let x=0;x<w;x+=24)R(x,0,1,h,'#1a1228');
  const bz=7,mq=h>=262?24:h>=228?14:0,pn=h>=244?34:22,CW=SW+bz*2+28,CH=mq+SH+bz*2+pn,cx=Math.floor(w/2),x0=cx-Math.floor(CW/2),y0=Math.max(0,Math.floor((h-CH)/2)-2);
  // 两边隔壁的街机，只露一半，屏幕的光
  [[i-1,x0-26-CW],[i+1,x0+CW+26]].forEach(([j,xx])=>{if(j<0||j>4)return;const c=ARC_COL[j];R(xx,y0+8,CW,h,OL);R(xx+1,y0+9,CW-2,h,c[1]);R(xx+6,y0+9,CW-12,h,c[0]);R(xx+14,y0+mq+16,CW-28,SH,'#0a0810');
    alpha(.18+.06*Math.sin(t*3+j),()=>R(xx+14,y0+mq+16,CW-28,SH,['#ff8a5a','#6ac8ff','#7ee08a','#c8a0ff','#f4a6b8'][j]));alpha(.62,()=>R(xx,y0+8,CW,h,'#120c1c'))});
  // 柜子正面
  R(x0-3,y0,CW+6,h-y0,OL);R(x0-2,y0+1,CW+4,h-y0,d);R(x0+3,y0+1,CW-6,h-y0,a);R(x0+3,y0+1,2,h-y0,l);R(x0+CW-5,y0+1,2,h-y0,d);
  if(i===4)[x0+18,x0+CW-18].forEach(ex=>{for(let r=0;r<12;r++){const q=r>>1;R(ex-q,y0-12+r,2*q+1,1,OL);if(r>2&&q>1)R(ex-q+2,y0-12+r,2*q-3,1,r>6?a:'#f4a6b8')}});
  // 灯箱：机器名，一闪一闪的灯泡边
  if(mq){const by=y0+3,bw=CW-12;R(x0+6,by,bw,mq-4,OL);R(x0+7,by+1,bw-2,mq-6,'#fff4dc');R(x0+7,by+1,bw-2,1,'#ffffff');
    for(let q=0;q<bw-4;q+=6)P1(x0+9+q,by+mq-6,Math.floor(t*4+q/6)%2?'#ffd84a':l);
    const n=NAMES[i],tw=PXT.w(n),en=ARC_EN[i];if(mq>=20){PXT.draw(n,cx-Math.floor(tw/2),by+1,d,{shadow:'#ffffff'})}else txt(en,cx-Math.floor(txtW(en)/2),by+3,d)}
  // 屏幕：黑框（四个圆角），屏幕里是这台机器；没开起来的时候是 LOADING / OUT OF ORDER
  const sx=cx-Math.floor(SW/2),sy=y0+mq+bz;R(sx-bz,sy-bz,SW+bz*2,SH+bz*2,OL);R(sx-bz+1,sy-bz+1,SW+bz*2-2,SH+bz*2-2,'#1a1420');R(sx-bz+1,sy-bz+1,SW+bz*2-2,1,'#3a3048');
  if(m)m.draw(C,sx,sy);else{R(sx,sy,SW,SH,'#06040a');const bad=LD.st==='fail'||LD.st==='ok';
    txt(bad?'OUT OF ORDER':'LOADING',cx-Math.floor(txtW(bad?'OUT OF ORDER':'LOADING')/2),sy+SH/2-6,bad?'#ff6a6a':'#fff4dc');
    if(!bad){const p=Math.min(1,LD.n/(IDS.length+1));R(sx+40,sy+SH/2+4,SW-80,3,'#3a3048');R(sx+40,sy+SH/2+4,Math.round((SW-80)*p),3,'#7ee08a')}}
  [[0,0],[SW-1,0],[0,SH-1],[SW-1,SH-1]].forEach(([qx,qy])=>P1(sx+qx,sy+qy,'#1a1420'));alpha(.1,()=>{R(sx+6,sy+4,18,1,'#ffffff');R(sx+4,sy+6,1,12,'#ffffff')});
  // 操纵台：斜面，摇杆（跟着方向键歪），A、B 两颗按钮（按下去矮一格）
  const py=sy+SH+bz+2;if(py>=h)return;R(x0-3,py,CW+6,h-py,OL);R(x0-2,py+1,CW+4,h-py,'#2a2030');R(x0-2,py+1,CW+4,1,'#4a3e52');R(x0-2,py+4,CW+4,1,'#221a28');
  const dx=(k.R?1:0)-(k.L?1:0),dy=(k.D?1:0)-(k.U?1:0),jx=x0+34,jy=py+Math.min(16,Math.floor(pn*.5)),bx=jx+dx*3,by2=jy-7+dy*2;
  disc(jx,jy+1,6,2,'#140e18');line(jx,jy,bx,by2,'#8a8496');disc(bx,by2,4,4,OL);disc(bx,by2,3,3,'#e0533d');P1(bx-1,by2-2,'#ff9a8a');
  const bA={x:x0+CW-50,y:jy-3},bB={x:x0+CW-32,y:jy-6};[[bA,'#ffd84a','#c8a020',k.A],[bB,'#7ae8ff','#3a98b8',k.B]].forEach(([b,c1,c2,on])=>{disc(b.x,b.y+2,5,3,'#140e18');disc(b.x,b.y+(on?1:0),4,3,OL);disc(b.x,b.y+(on?1:0),3,2,on?c2:c1)});
  txt('A',bA.x-1,bA.y+6,'#8a80a8');txt('B',bB.x-1,bB.y+6,'#8a80a8');
  // 你的猫：后脑勺和两只耳朵从底下露出来，两条前腿斜着伸上去，左爪握着摇杆，右爪搭在按钮上（按 A 落在 A 上，按 B 挪到 B 上）
  if(h-py<=12)return;const o=pal.outline,bd=pal.body,sh=pal.shade,lt=pal.light,hx=cx;
  const arm=(px,y,s)=>{for(let yy=y+8;yy<h;yy++){const q=Math.round((yy-y-8)*.42)*s,x=px+q;R(x-6,yy,13,1,o);R(x-5,yy,11,1,bd);R(x+s*3,yy,2,1,s>0?lt:sh)}
    const rows=[[4,10],[2,14],[1,16],[1,16],[1,16],[1,16],[1,16],[2,14]];rows.forEach(([i,w],r)=>{R(px-8+i-1,y+r,w+2,1,o)});R(px-8+4,y-1,10,1,o);
    rows.forEach(([i,w],r)=>{if(r)R(px-8+i,y+r,w,1,r<3?lt:r>5?sh:bd)});R(px-8+4,y,10,1,lt);[-3,2].forEach(q=>R(px+q,y,1,3,o));R(px-7,y+8,16,1,o)};
  const head=()=>{const y=h-36;
    [-14,14].forEach(dx=>{for(let r=0;r<14;r++){const w=(r>>1)+1;R(hx+dx-w,y-9+r,w*2+1,1,o);R(hx+dx-w+1,y-9+r,w*2-1,1,bd);if(r>4&&w>3)R(hx+dx-w+3,y-9+r,w*2-5,1,'#f4a6b8')}});
    disc(hx,y+22,24,18,o);disc(hx,y+22,23,17,bd);R(hx-14,y+8,28,2,lt)};
  arm(bx,by2+4,1);const b=k.B&&!k.A?bB:bA;arm(b.x,b.y-2+(k.A||k.B?2:0),-1);head()}
});
