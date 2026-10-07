/* 1024 猫咖 · 地下一层的东西怎么用（设计见 docs/店内设计.md 第一节"地下一层"、第三节"迪斯科舞池"、第四节彩蛋、第五节"第五轮新添的 19 样"）。
   依赖 map-b1.js（点位、A_B1）、b1-kit.js（画法）、world-acts.js（seatThing）、world-eggs.js（彩蛋）。
   - 舞厅：站上舞池就跳舞；舞池边"跳一曲"是第七个小游戏（三十秒踩亮的金格子）；拉链子放二十秒"迪斯科时间"；DJ 台搓碟换颜色；蹲在音箱前被低音吹得炸毛；卡座。
     舞池上同时有六只猫在跳舞 → 彩蛋"迪斯科之夜"。
   - 门厅：五张海报（每张一项猫猫咖啡馆的能力 + 链接）、爆米花机（蹦出来的爆米花附近的猫会来吃）、售票亭（领一张票，猫自己走去那个座位）。
   - 澡堂：温泉池（头顶小毛巾、背对着我们看鱼）、水族馆玻璃墙（凑近看是特写 aquarium）、牛奶冰柜（泡完再喝 → 彩蛋"一口闷"）、吹风机（炸成毛球）、按摩椅（一起抖）、体重秤、木桶。
     水族馆里的鱼群、水母、海龟、鳐鱼、鲨鱼在这里画；鲨鱼游过 → 满屋的猫炸毛往后一跳，彩蛋"鲨鱼来了"。
   - 电影院：三排座位（坐下切到 cinema.js 的特写）、放映机（换一卷）和它的光柱。 */
WORLD_MODS.push(A=>{
const {S,P,me,run,stay,settle,say,sfx,news,emote,speak,after,rr,rnd,dist,setK}=A;
const now=()=>A.t,tick=f=>A.tickers.push(f),near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,Y=Y4,B=b1Kit;
const D=S.disco={pal:0,crazy:0,allGold:0,gold:[],hit:[],pull:0,scratch:0,blow:0};
const S1=S.b1={ticket:0,pop:0,noren:0,bucketsDown:0,milk:0,dryer:0,massage:0,needle:0};
const onB1=c=>A.floorOf(c.y).id==='b1',room=c=>A.roomAt(c.x,c.y).id,GS=()=>A.guide.games(),idle=A.idle;
const awake=c=>!c.hidden&&!c.gone&&!c.leaving&&!c.puppet;

/* ================= 舞厅 ================= */
const F=P.dfloor,tileAt=(x,y)=>{const i=Math.floor((x-F.x)/F.tw),j=Math.floor((y-F.y)/F.th);return i>=0&&j>=0&&i<F.cols&&j<F.rows?{i,j}:null};
const tileC=(i,j)=>({x:F.x+i*F.tw+F.tw/2,y:F.y+j*F.th+F.th-6});
const onFloor=c=>c.z==null&&!!tileAt(c.x,c.y);
const randTile=()=>tileC(Math.floor(Math.random()*F.cols),Math.floor(Math.random()*F.rows));
// 站在舞池上不动的猫就跳舞（走起来是走路，停下来又跳）：停下来的姿势改成 dance
const rh0=A.restHook;A.restHook=c=>onFloor(c)&&!c.hold?'dance':rh0?rh0(c):null;
tick(()=>{for(const c of S.cats){if(!awake(c)||c.place&&!c.me)continue;const on=onFloor(c);if(on&&c.k==='sit'&&!c.cur&&!c.q.length&&!c.place&&!c.hold)setK(c,'dance');else if(!on&&c.k==='dance'&&!c.cur)setK(c,'sit')}});
// 第七个小游戏：跳一曲（三十秒）
let G=null;const DUR=30;
function startDance(){G={t0:now(),score:0,combo:0,best:0,next:now()+.8};D.gold=[];sfx('fanfare');say(GS().dance?'跳一曲：踩亮的金格子':'跳一曲：格子一块块亮成金色，赶在它暗下去之前踩上去，三十秒');news('你在舞池上跳起了一曲')}
function endDance(){const g=GS(),r=g.dance=g.dance||{},n=G.score,best=n>(r.best||0);r.plays=(r.plays||0)+1;if(best)r.best=n;A.guide.save();A.emit('game','dance');
  say(`这一曲踩中 ${n} 块`+(G.best>2?`，最长连击 ×${G.best}`:'')+`（最多 ${r.best||n} 块）`+(best&&r.plays>1?' · 新纪录':''));sfx(best?'fanfare':'ok');D.gold=[];G=null}
tick(()=>{D.hit=D.hit.filter(h=>(h.k=(now()-h.t0)/.35)<1);if(!G)return;const e=now()-G.t0;if(e>=DUR||!onB1(me)){endDance();return}
  const n=e<10?1:e<20?2:3,life=Math.max(1,2.3-e*.045),gap=Math.max(.45,1.3-e*.028);
  if(now()>=G.next&&D.gold.length<n){const mt=tileAt(me.x,me.y),L=[];for(let i=0;i<F.cols;i++)for(let j=0;j<F.rows;j++)if(!D.gold.some(g=>g.i===i&&g.j===j)&&!(mt&&mt.i===i&&mt.j===j))L.push({i,j});
    const g=rnd(L);if(g){D.gold.push({...g,t0:now(),life,k:1});G.next=now()+gap}}
  for(const g of D.gold)g.k=1-(now()-g.t0)/g.life;
  for(const g of D.gold.slice()){const who=S.cats.find(c=>awake(c)&&c.z==null&&(t=>t&&t.i===g.i&&t.j===g.j)(tileAt(c.x,c.y)));
    if(who){D.gold.splice(D.gold.indexOf(g),1);D.hit.push({i:g.i,j:g.j,t0:now(),k:0});if(who.me){G.score++;G.combo++;G.best=Math.max(G.best,G.combo);sfx('note',(G.combo-1)%8)}else emote(who,'note',.8)}
    else if(g.k<=0){D.gold.splice(D.gold.indexOf(g),1);if(G.combo>2)sfx('no');G.combo=0}}});
const po0=A.promptOver;A.promptOver=c=>{if(G)return `跳一曲 · 踩中 ${G.score} 块`+(G.combo>1?` · 连击 ×${G.combo}`:'')+` · 还剩 ${Math.max(0,Math.ceil(DUR-(now()-G.t0)))} 秒`;return po0?po0(c):null};
A.T({id:'dancefloor',n:'舞池',hit:[F.x,F.y,F.cols*F.tw,F.rows*F.th],at:c=>onFloor(c)?{x:c.x,y:c.y}:{x:F.x+F.cols*F.tw/2,y:F.y+F.rows*F.th+10},near:[F.x-10,F.y-8,F.cols*F.tw+20,F.rows*F.th+22],
  label:c=>c.me?(G?'正在跳一曲':'跳一曲'):'跳舞',ok:c=>!c.hold&&!(c.me&&G),no:c=>c.hold?'叼着东西，先放下吧':'正在跳',ai:{mood:'play',w:c=>D.crazy>now()?6:1.2},
  go(c){if(c.me){if(!onFloor(c))run(c,[{go:randTile()},{fn:startDance}]);else startDance();return}run(c,[{go:randTile()},{k:'dance',dur:rr(8,20)}])}});
// 镜面球：拉一下墙上的链子，二十秒"迪斯科时间"
function discoTime(by){D.crazy=now()+20;D.pull=now()+.6;sfx('clunk');after(.3,()=>sfx('fanfare'));news((by&&!by.me?by.name:'你')+'拉下了镜面球：迪斯科时间！');
  S.cats.filter(c=>awake(c)&&!c.me&&!c.desk&&onB1(c)&&c.z==null&&!c.place&&!c.hold&&(room(c)==='disco'||near(c,{x:556,y:Y+180},220))).slice(0,14).forEach((c,k)=>after(k*.15,()=>run(c,[{go:randTile()},{k:'dance',dur:rr(10,18)}])))}
A.events.disco=()=>{if(D.crazy>now())return'迪斯科时间还没完';discoTime(null)};
A.T({id:'mball',n:'镜面球',hit:[P.ballX-9,P.ballY-9,18,18],at:P.chainAt,near:[P.chainAt.x-18,P.chainAt.y-14,36,26],label:c=>D.crazy>now()?'迪斯科时间还没完':'拉一下镜面球的链子',
  ok:c=>D.crazy<=now(),no:()=>'迪斯科时间还没完，先跳着',ai:{mood:'play',w:c=>D.crazy>now()?0:.25},
  go(c){run(c,[{go:P.chainAt},{fn:c=>{c.face='R'}},{k:'bat',dur:.6},{fn:c=>discoTime(c)}])}});
// DJ 台：跳到唱盘后面搓碟，舞池换一套颜色
let dj=null;
function scratch(c){D.scratch=now()+.5;D.pal=(D.pal+1)%B.PALS.length;sfx('scratch2');if(c&&c.me&&!scratch.said){scratch.said=1;say('呲啦——舞池换了一套颜色')}}
A.T({id:'dj',n:'DJ 台',hit:[P.djBooth.x,P.djBooth.y-8,P.djBooth.w,46],at:P.djAt,near:[P.djAt.x-16,P.djAt.y-14,40,26],label:c=>dj&&dj!==c&&!dj.gone?'DJ 台上有猫了':'跳到唱盘后面',
  ok:c=>!c.hold&&!(dj&&dj!==c&&!dj.gone),no:c=>c.hold?'叼着东西，先放下吧':'DJ 台上有猫了',ai:{mood:'play',w:.3},
  go(c){run(c,[{go:P.djAt},{fn:c=>{if(dj&&dj!==c&&!dj.gone){c.q=[];emote(c,'q');return}dj=c;c.doing='在打碟';c.onLeave=c=>{if(dj===c)dj=null;c.doing=null}}},{jump:{...P.djSpot}},
    {fn:c=>{const leave=c=>[{jump:{...P.djOff}},{fn:c=>{c.z=undefined}}];if(c.me){settle(c,{k:'sit',ex:'happy',face:'R',act:()=>{scratch(c);run(c,[{k:'bat',dur:.4},{fn:c=>{if(me.place)setK(me,'sit','happy')}}],true);return true},prompt:()=>'E · 搓碟 · 方向键离开',leave});scratch(c);return}
      stay(c,{k:'sit',ex:'happy',dur:rr(8,16),leave});scratch(c)}}],true)}});
tick(()=>{if(dj&&!dj.me&&!dj.gone&&dj.z!=null&&Math.random()<.004)scratch(dj)});
// 大音箱：蹲在跟前，低音一下一下把毛吹得往后飘（背对着我们，看着音箱）
let spkSaid=0;
A.T({id:'speaker',n:'大音箱',hit:[P.spkL.x,P.spkL.y,32,64],at:P.spkAt,near:[P.spkAt.x-16,P.spkAt.y-14,32,24],label:'蹲到音箱跟前',ok:c=>!c.hold,no:()=>'叼着东西，先放下吧',ai:{mood:'play',w:.3},
  go(c){run(c,[{go:P.spkAt},{fn:c=>{c.doing='在听低音炮';c.onLeave=c=>{c.doing=null};stay(c,{k:'back',face:'R',dur:rr(5,9)});if(c.me&&!spkSaid){spkSaid=1;say('咚、咚、咚……毛被吹得往后飘')}}}])}});
tick(()=>{const c=S.cats.find(c=>c.doing==='在听低音炮'&&near(c,P.spkAt,6));if(c){D.blow=now()+.3;if(Math.floor(now()*2)%2===0)c.puffUntil=now()+.25}});
// 卡座：上面一张面朝我们坐，下面一张背对着我们（看着中间的小圆桌）
const ST=P.sofaT,SB=P.sofaB;
A.seatThing({id:'booth',n:'卡座',hit:[ST.x,ST.y,ST.w,20],at:{x:ST.x+32,y:ST.y+30},near:[ST.x,ST.y+16,ST.w,22],label:'窝进卡座歇一会儿',k:'sit',ex:'content',ai:{mood:'rest',w:.5},doing:'在卡座上歇着',
  spots:[{x:ST.x+16,y:ST.y+16,z:ST.y+21,face:'R'},{x:ST.x+48,y:ST.y+16,z:ST.y+21,face:'L'}],up:i=>[{x:ST.x+16+i*32,y:ST.y+16,z:ST.y+21}],down:i=>[{x:ST.x+16+i*32,y:ST.y+30}],floor:i=>({x:ST.x+16+i*32,y:ST.y+30})});
A.seatThing({id:'booth2',n:'卡座',hit:[SB.x,SB.y,SB.w,22],at:{x:SB.x+32,y:SB.y+28},near:[SB.x,SB.y+18,SB.w,22],label:'窝进卡座歇一会儿',k:'back',ai:{mood:'rest',w:.5},doing:'在卡座上歇着',
  spots:[{x:SB.x+16,y:SB.y+10,z:SB.y+11,face:'R'},{x:SB.x+48,y:SB.y+10,z:SB.y+11,face:'L'}],up:i=>[{x:SB.x+16+i*32,y:SB.y+10,z:SB.y+11}],down:i=>[{x:SB.x+16+i*32,y:SB.y+28}],floor:i=>({x:SB.x+16+i*32,y:SB.y+28})});
// 舞厅的彩色光点：十几盏会动的灯（地上一个亮斑），迪斯科时间转得更快、更亮
// A.lights 每帧清空（world-acts.js），所以每帧推一次
const DL=[];for(let i=0;i<12;i++)DL.push({x:0,y:0,r:22,col:'#fff',a:.5,i});
tick(()=>{const t=now(),crazy=D.crazy>t,P4=B.PALS[D.pal];DL.forEach(L=>{const sp=(crazy?1.6:.5)*(L.i%2?1:-1),a=t*sp+L.i*.52,rx=crazy?250:200,ry=crazy?92:70;L.x=278+Math.cos(a+L.i)*rx*(.4+(L.i%4)*.2);L.y=Y+160+Math.sin(a*1.3)*ry*(.5+(L.i%3)*.25);
  L.col=P4[(L.i+Math.floor(t*(crazy?4:1)))%4];L.a=crazy?.75:.45;L.r=crazy?26:20;if(onB1(me))A.lights.push(L)})});
A.floors.push(vis=>{if(!vis(0,Y,556,252))return;DL.forEach(L=>{const x=Math.round(L.x),y=Math.round(L.y);if(y<Y+60)return;alpha(.4,()=>disc(x,y,6,2,L.col));alpha(.7,()=>{disc(x,y,3,1,L.col);P1(x,y,'#ffffff')})})});
// 墙上也晃着光点（镜面球打上去的），迪斯科时间里从镜面球射出一圈转着的光束
A.overs.push(vis=>{if(!vis(0,Y,556,252))return;const t=now(),crazy=D.crazy>t,P4=B.PALS[D.pal];
  for(let i=0;i<10;i++){const x=Math.round(20+((t*(crazy?60:22)*(i%2?1:-1)+i*97)%516+516)%516),y=Math.round(Y+12+((i*13)%30)+Math.sin(t*1.5+i)*4);alpha(.5,()=>{R(x-1,y,3,1,P4[i%4]);P1(x,y-1,P4[i%4]);P1(x,y+1,P4[i%4])})}
  if(!crazy)return;const bx=P.ballX,by=P.ballY+8;for(let i=0;i<8;i++){const a=t*1.4+i*Math.PI/4,dx=Math.cos(a),dy=Math.abs(Math.sin(a))*.6+.25;alpha(.22,()=>{for(let k=10;k<150;k+=2)P1(Math.round(bx+dx*k),Math.round(by+dy*k),P4[i%4])})}});
// 迪斯科之夜：舞池上同时有六只猫在跳舞 → 镜面球炸开一屋彩纸，舞池全变金色
const confetti=[];let nightT=-99,nightChk=0;
tick(dt=>{if((nightChk+=dt)<.5)return;nightChk=0;const n=S.cats.filter(c=>awake(c)&&c.k==='dance'&&onFloor(c)).length;
  if(n>=6&&now()-nightT>40&&onB1(me)&&room(me)==='disco'){nightT=now();D.allGold=now()+5;sfx('boom');after(.2,()=>sfx('fanfare'));for(let i=0;i<70;i++)confetti.push({x:P.ballX+rr(-6,6),y:P.ballY,vx:rr(-90,90),vy:rr(-80,10),c:rnd(['#ff4fa8','#4fd8ff','#ffd84a','#a84fff','#7ee08a','#fff4dc']),t0:now()});
    news('舞池上六只猫一起跳：镜面球炸开了一屋彩纸');A.eggs.found('disco')}});
tick(dt=>{for(let i=confetti.length-1;i>=0;i--){const p=confetti[i];p.vy+=60*dt;p.vx*=.98;p.x+=p.vx*dt;p.y+=p.vy*dt;if(now()-p.t0>4||p.y>Y+250)confetti.splice(i,1)}});
A.overs.push(vis=>{if(!confetti.length||!vis(0,Y,556,252))return;const t=now();confetti.forEach((p,i)=>R(Math.round(p.x),Math.round(p.y),(i+Math.floor(t*8))%3?2:1,(i+Math.floor(t*8))%3?1:2,p.c))});

/* ================= 地下门厅 ================= */
// 五张海报：每张是猫猫咖啡馆的一项能力（说法和 TIPS 一致）
const POSTERS=[{t:'《每只猫都是它自己》',x:'每只猫跨对话保持同一个身份：角色、性格、记忆都不会丢。每只猫还有自己的能力画像，传球的时候，会把任务交给最擅长的那只。',l:['site','docs'],tip:'identity'},
  {t:'《图书馆》',x:'猫猫咖啡馆有长期记忆：决策、教训、证据都收在"图书馆"里。说一句"之前我们怎么定的"，猫会自己去查。',l:['docs','site'],tip:'memory'},
  {t:'《@ 谁谁来》',x:'另起一行、在行首写 @猫名，任务就交给那只猫。在猫猫咖啡馆，任务就叫"毛线球"：谁持球谁负责，拿不准的，升级给你来拍板。',l:['tips','docs'],tip:'at'},
  {t:'《main 永远是绿的》',x:'自由判断，结构化交付：测试、Review、门禁一步都不少。写代码的猫和 review 的猫必须来自不同家族。',l:['docs','github'],tip:'sop'},
  {t:'《一键开店》',x:'想在自己电脑上开一家猫咖？下载 Windows / macOS 安装包，或者从源码启动。Clowder AI 是开源的（MIT）。',l:['releases','github'],tip:'deploy'}];
P.posters.forEach((p,k)=>A.T({id:'poster'+k,n:'海报墙',hit:[p.x-3,p.y-3,36,50],at:{x:p.x+15,y:Y+72},near:[p.x-2,Y+60,34,24],label:'看海报',ai:{mood:'explore',w:.12},
  go(c){run(c,[{go:{x:p.x+15,y:Y+72}},{k:'sit',dur:c.me?.4:rr(2,4),ex:'lookUp'},{fn:c=>{if(c.me){const Q=POSTERS[k];A.linkDialog('poster','本周上映 · '+Q.t,'star',Q.x,Q.l,Q.tip)}}}])}}));
// 爆米花机：噼里啪啦爆一锅，几颗蹦到地上，附近的猫过来吃
const kernels=[];let popAte=0;
function popcorn(){S1.pop=now()+3;for(let i=0;i<6;i++)after(.3+i*.35,()=>{sfx('popcorn');const x0=P.popcorn.x+20,y0=P.popcorn.y+8,tx=x0+rr(-46,46),ty=Y+rr(108,150),t0=now();
  const f={x:x0,y:y0,draw:f=>{const k=Math.min(1,(now()-t0)/.5);R(Math.round(x0+(tx-x0)*k),Math.round(y0+(ty-y0)*k-Math.sin(k*Math.PI)*22),2,2,'#fff4c0')}};
  S.flying.push(f);after(.5,()=>{const j=S.flying.indexOf(f);if(j>=0)S.flying.splice(j,1);kernels.push({x:tx,y:ty,t0:now()})})});
  after(2.8,()=>{S.cats.filter(o=>!o.me&&awake(o)&&!o.desk&&idle(o)&&!o.place&&o.z==null&&onB1(o)&&near(o,P.popcornAt,170)).slice(0,3).forEach(o=>{const k=rnd(kernels);if(k)run(o,[{go:{x:k.x+6,y:k.y+2}},{k:'lick',dur:1.2},{fn:o=>{const i=kernels.indexOf(k);if(i>=0){kernels.splice(i,1);emote(o,'heart',1)}}}])})})}
tick(()=>{for(let i=kernels.length-1;i>=0;i--){const k=kernels[i];if(now()-k.t0>40){kernels.splice(i,1);continue}if(me.z==null&&near(me,k,6)){kernels.splice(i,1);sfx('pop');if(!popAte){popAte=1;say('咔嚓，一颗爆米花')}}}});
A.floors.push(vis=>kernels.forEach(k=>{if(vis(k.x-2,k.y-2,4,4)){R(Math.round(k.x),Math.round(k.y),2,2,'#fff4c0');P1(Math.round(k.x)+1,Math.round(k.y),'#f4d26a')}}));
A.T({id:'popcorn',n:'爆米花机',hit:[P.popcorn.x,P.popcorn.y-14,40,72],at:P.popcornAt,near:[P.popcornAt.x-18,P.popcornAt.y-14,36,26],label:'拍一下爆米花机',ok:()=>S1.pop<now(),no:()=>'正在爆',ai:{mood:'play',w:.25},
  go(c){run(c,[{go:P.popcornAt},{fn:c=>{c.face='R'}},{k:'bat',dur:.5},{fn:()=>popcorn()},{k:'sit',dur:c.me?.3:2.5,ex:'sparkle'}])}});
// 售票亭：领一张票，猫自己走去那个座位
A.T({id:'ticket',n:'售票亭',hit:[P.ticket.x-3,P.ticket.y-12,62,88],at:P.ticketAt,near:[P.ticketAt.x-18,P.ticketAt.y-14,36,26],label:'领一张电影票',ai:{mood:'explore',w:.15},ok:c=>!c.hold,no:()=>'叼着东西，先放下吧',
  go(c){run(c,[{go:P.ticketAt},{fn:c=>{c.face='R'}},{k:'bat',dur:.5},{fn:c=>{S1.ticket=now()+1;sfx('click');const th=A.TID('cseat'),free=th.occ.map((u,i)=>!u||u.gone?i:-1).filter(i=>i>=0);
    if(!free.length){if(c.me)say('今天的票卖完了：座位都坐满了');return}const i=rnd(free),r=Math.floor(i/6)+1,s=i%6+1;c.ticketSeat=i;
    if(c.me)say(`一张电影票：第 ${r} 排 ${s} 座`);after(.6,()=>{if(c.ticketSeat===i)A.act(c,th)})}}])}});

/* ================= 猫猫澡堂 ================= */
// 温泉池：六个泡的位置，背对着我们看玻璃里的鱼；头顶一块小毛巾，身子泡在水里
const PL=P.pool,SOAK=[[96,412],[156,408],[216,412],[276,408],[336,412],[186,446]].map(([x,y])=>({x,y:Y+y,z:Y+y,face:'R'}));
const SOAKIN=SOAK.map(s=>({x:s.x,y:s.y<Y+440?Y+372:Y+476}));
let soakSaid=0;
A.seatThing({id:'onsen',n:'温泉池',hit:[PL.x,PL.y,PL.w,PL.h],at:c=>{let b=SOAKIN[0],bd=1e9;SOAKIN.forEach(p=>{const d=dist(p,c);if(d<bd){bd=d;b=p}});return b},near:[PL.x-6,PL.y-20,PL.w+12,PL.h+40],
  label:'泡进温泉',k:'back',ai:{mood:'rest',w:1},doing:'在泡温泉',dur:()=>rr(10,25),spots:SOAK,up:i=>[SOAK[i]],down:i=>[SOAKIN[i]],floor:i=>SOAKIN[i],
  inn(c){c.soakT=now();sfx('splash');if(c.me&&!soakSaid){soakSaid=1;say('哗——泡进去了，头上顶一块小毛巾')}},out(c){if(c.soakT&&now()-c.soakT>=10)c.warmUntil=now()+60;c.soakT=null;after(.5,()=>shake(c))}});
// 从池子里出来，抖一抖：甩出一圈水珠
const drops=[];function shake(c){if(c.hidden||c.gone)return;for(let i=0;i<14;i++){const a=i/14*Math.PI*2;drops.push({x:c.x,y:c.y-8,vx:Math.cos(a)*rr(30,55),vy:Math.sin(a)*rr(18,30)-20,t0:now()})}if(near(c,me,200))sfx('rustle')}
tick(dt=>{for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.vy+=90*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;if(now()-d.t0>.6)drops.splice(i,1)}});
A.overs.push(vis=>drops.forEach(d=>{if(vis(d.x-1,d.y-1,3,3))alpha(1-(now()-d.t0)/.6,()=>{P1(Math.round(d.x),Math.round(d.y),'#a8e8f8');P1(Math.round(d.x),Math.round(d.y)-1,'#e8fbff')})}));
tick(()=>{if(me.soakT&&now()-me.soakT>=10&&!me.warmSaid){me.warmSaid=1;me.warmUntil=now()+60;say('泡得暖乎乎的')}if(!me.soakT)me.warmSaid=0});
A.drawers.push((L,vis)=>{for(const c of S.cats){if(!c.soakT||c.hidden||!vis(c.x-14,c.y-24,28,30))continue;const x=Math.round(c.x),y=Math.round(c.y);
  // 水漫到脖子：一块和池水同色的水面盖住下半身，水线上一道亮边，四周一圈圈涟漪
  L.push([c.y+.3,()=>{R(x-11,y-9,22,12,'#5ab8b0');R(x-12,y-7,24,9,'#5ab8b0');R(x-11,y-10,22,1,'#8ad8d0');R(x-8,y-6,6,1,'#6ac8c0');R(x+3,y-3,5,1,'#6ac8c0');const k=(now()*.8+c.id*.3)%1;alpha(.6*(1-k),()=>{for(let a=0;a<16;a++){const q=a/16*Math.PI*2;P1(Math.round(x+Math.cos(q)*(10+k*6)),Math.round(y-9+Math.sin(q)*(2+k*2)),'#c8f0ec')}});
    const top=c.top??y-18;R(x-4,top+1,9,3,OL);R(x-3,top+1,7,2,'#ffffff');P1(x-1,top+2,'#d8e8f0')}])}});
// 水族馆的玻璃墙：鱼群、水母、海龟、鳐鱼；隔一阵一条鲨鱼游过去（店里的画面；凑近看的特写是 world4-vista 的 aquarium）
const AQ=P.aq,SCH=[];for(let s=0;s<3;s++)for(let i=0;i<9;i++)SCH.push({s,i,dx:(i%3)*5+((i*7)%3),dy:Math.floor(i/3)*3+((i*5)%2)});
const SOLO=[[1,.7,40,1],[2,.5,28,-1],[3,.9,58,1],[1,.6,66,-1],[2,.8,18,1],[3,.4,48,-1]];
let shark=null,sharkNext=20;S1.shark=null;
A_B1.aquarium=(t)=>{const x0=AQ.x,y0=AQ.y,w=AQ.w,h=AQ.h;C.save();C.beginPath();C.rect(x0,y0,w,h);C.clip();
  const sx=shark?shark.x:-999,sy=shark?shark.y:-999,flee=(fx,fy)=>{const d=Math.abs(fx-sx);return d<70?Math.sign(fy-sy||1)*(70-d)/70*14:0};
  // 海草：底下一丛丛跟着水晃
  for(let i=0;i<9;i++){const bx=x0+18+i*48+((i*17)%13),hh=14+(i*7)%10;for(let j=0;j<hh;j++)P1(Math.round(bx+Math.sin(t*1.4+j*.35+i)*(j/hh)*3),y0+h-8-j,j%3?'#3a8a4a':'#5aaa5a')}
  // 三群小鱼（霓虹灯鱼）一起转弯；几条大一点的鱼；两只水母；一只海龟、一条鳐鱼慢慢来回
  for(const f of SCH){const sp=[18,13,22][f.s],ph=[0,140,300][f.s],X=x0+((t*sp*(f.s===1?-1:1)+ph+f.dx)%(w+60)+w+60)%(w+60)-30,yb=y0+[22,40,58][f.s]+Math.sin(t*.7+f.s*2)*6+f.dy;B.fish(X,yb+flee(X,yb),0,f.s===1?-1:1,t+f.i*.1)}
  SOLO.forEach(([k,sp,yy,dir],i)=>{const X=x0+((t*sp*14*dir+i*97)%(w+40)+w+40)%(w+40)-20,Yb=y0+yy+Math.sin(t*.9+i)*3;B.fish(X,Yb+flee(X,Yb),k,dir,t+i)});
  [[.3,0],[.75,1]].forEach(([fx,k])=>B.jelly(x0+w*fx+Math.sin(t*.3+k)*20,y0+18+((t*4+k*30)%50),t,k));
  {const per=70,k=(t%per)/per,X=x0-30+(w+60)*k;B.turtle(X,y0+30+Math.sin(t*.5)*6,t,1)}{const per=52,k=((t+20)%per)/per,X=x0+w+30-(w+60)*k;B.ray(X,y0+h-14,t,-1)}
  if(shark)B.shark(shark.x,shark.y,t,shark.dir);
  // 气泡
  for(let i=0;i<10;i++){const k=(t*.35+i*.13)%1,bx=x0+20+i*42+Math.sin(t*2+i)*2;P1(Math.round(bx),Math.round(y0+h-10-k*(h-14)),'#c8ecff');if(i%3===0)P1(Math.round(bx)+1,Math.round(y0+h-12-k*(h-14)),'#e8f8ff')}
  C.restore();B.aquariumFrame(x0,y0,w,h)};
// 鲨鱼：四十到七十秒一条，从一头游到另一头；游到玻璃正中那一下，澡堂里的猫炸毛往后一跳
function sharkGo(){const dir=Math.random()<.5?1:-1;shark={dir,x:dir>0?AQ.x-40:AQ.x+AQ.w+40,y:AQ.y+rr(34,56),v:rr(70,95),scared:false};S1.shark=shark}
tick(dt=>{if(!shark){sharkNext-=dt;if(sharkNext<=0){sharkNext=rr(40,70);sharkGo()}return}shark.x+=shark.dir*shark.v*dt;
  const mid=AQ.x+AQ.w/2;if(!shark.scared&&(shark.dir>0?shark.x>mid-60:shark.x<mid+60)){shark.scared=true;if(onB1(me))sfx('shark');
    S.cats.forEach(c=>{if(!awake(c)||room(c)!=='bath')return;c.puffUntil=now()+3;emote(c,'bang',1.4);if(!c.me&&idle(c)&&!c.place&&c.z==null){const y2=Math.min(Y+530,c.y+10);if(A.free(c.x,y2))run(c,[{jump:{x:c.x,y:y2},h:8},{k:'alert',dur:1}])}});
    if(room(me)==='bath'&&!A.vista.on){if(A.eggs.found('shark'));else say('一条鲨鱼从玻璃前面游过去了')}news('一条鲨鱼游过澡堂的玻璃墙')}
  if(shark.x<AQ.x-80||shark.x>AQ.x+AQ.w+80){shark=null;S1.shark=null}});
A.events.shark=()=>{if(shark)return'鲨鱼正在游';sharkNext=0};
A.T({id:'aqwall',n:'水族馆玻璃墙',hit:[AQ.x,AQ.y,AQ.w,AQ.h],at:P.aqAt,near:[P.aqAt.x-30,P.aqAt.y-12,60,20],label:'趴在玻璃前看鱼',ok:c=>!c.hold,no:()=>'叼着东西，先放下吧',ai:{mood:'explore',w:.6},
  go(c){run(c,[{go:P.aqAt},{fn:c=>{c.doing='在看鱼';c.onLeave=c=>{c.doing=null};stay(c,{k:'back',face:'R',dur:rr(6,14)});
    if(c.me)after(.3,()=>{if(me.place&&me.doing==='在看鱼'&&typeof VA!=='undefined'&&VA.draw&&VA.draw.aquarium)A.vista.open('aquarium')})}}])}});
// 牛奶冰柜：拿一瓶咖啡牛奶喝掉；泡完澡（一分钟内）再喝，叉着腰一口闷 → 彩蛋
A.T({id:'milk',n:'牛奶冰柜',hit:[P.fridge.x,P.fridge.y-12,32,58],at:P.fridgeAt,near:[P.fridgeAt.x-16,P.fridgeAt.y-14,32,24],label:'拿一瓶牛奶',ok:c=>!c.hold,no:()=>'叼着东西，先放下吧',ai:{mood:'explore',w:.25},
  go(c){run(c,[{go:P.fridgeAt},{fn:c=>{c.face='L';S1.milk=now()+.8;sfx('clunk')}},{k:'sit',dur:.6,ex:'sparkle'},{fn:c=>{c.drink=now()+1.8;sfx('gulp')}},{k:'sit',dur:1.8,ex:'content'},
    {fn:c=>{const warm=c.warmUntil>now();if(warm){emote(c,'heart',1.6);run(c,[{k:'happy',dur:1.4}],true);if(c.me){say('叉着腰，一口闷：哈——');A.eggs.found('milk')}else speak(c,'哈——',1.6)}
      else if(c.me)say('冰冰凉凉的咖啡牛奶')}}])}});
A.drawers.push((L,vis)=>{for(const c of S.cats){if(!(c.drink>now())||c.hidden)continue;const x=Math.round(c.x)+(c.face==='L'?-6:6),top=c.top??c.y-18;L.push([c.y+.2,()=>{R(x-1,top+5,4,8,OL);R(x,top+6,2,6,'#a8703f');R(x,top+4,2,2,'#c8b8a0')}])}});
// 吹风机：坐到罩子底下，呼呼吹一阵，出来炸成一个毛球
let dryU=null;
A.T({id:'dryer',n:'吹风机',hit:[P.dryer.x,P.dryer.y-2,34,46],at:P.dryerAt,near:[P.dryerAt.x-16,P.dryerAt.y-12,32,22],label:'坐到吹风机底下',ok:c=>!c.hold&&!(dryU&&dryU!==c&&!dryU.gone),no:c=>c.hold?'叼着东西，先放下吧':'有猫在吹',ai:{mood:'rest',w:.3},
  go(c){run(c,[{go:P.dryerAt},{fn:c=>{if(dryU&&dryU!==c&&!dryU.gone){c.q=[];return}dryU=c;c.dryT=now();c.doing='在吹毛';c.onLeave=c=>{if(dryU===c)dryU=null;c.doing=null;if(c.dryT&&now()-c.dryT>3){c.puffUntil=now()+20;if(c.me)say('吹得蓬蓬的，像一颗毛球')}c.dryT=null}}},
    {jump:{...P.dryerSpot}},{fn:c=>{stay(c,{k:'sit',ex:'content',face:'L',dur:rr(5,8),leave:c=>[{jump:{...P.dryerAt}},{fn:c=>{c.z=undefined}}]});sfx('whirr')}}],true)}});
tick(()=>{if(dryU&&!dryU.gone&&dryU.dryT)S1.dryer=now()+.3});
// 按摩椅：窝进去，跟着椅子一起嗡嗡抖，抖着抖着就睡着了
const MS=P.massageSpot;
const mth=A.seatThing({id:'massage',n:'按摩椅',hit:[P.massage.x-2,P.massage.y,40,42],at:P.massageAt,near:[P.massageAt.x-16,P.massageAt.y-12,32,22],label:'窝进按摩椅',k:'sit',ex:'content',ai:{mood:'rest',w:.45},doing:'在按摩',
  dur:()=>rr(10,20),spots:[MS],up:()=>[MS],down:()=>[P.massageAt],floor:()=>P.massageAt,inn(c){c.massT=now();sfx('whirr')},out(c){c.massT=null;c.dy=0}});
tick(()=>{const c=mth.occ[0];if(!c||c.gone||!c.massT)return;S1.massage=now()+.3;if(c.z!=null&&!c.cur)c.dy=Math.floor(now()*28)%2?-1:0;if(now()-c.massT>8&&c.k==='sit'&&!c.cur)setK(c,'sleep')});
// 体重秤：站上去，指针晃两下停住；每只猫的体重按名字定，隔一天会胖一点或瘦一点
const kgOf=c=>{let h=0;for(const ch of c.name||'')h=(h*31+ch.charCodeAt(0))>>>0;const day=Math.floor(Date.now()/864e5);return Math.round((3.4+(h%28)/10+Math.sin(day*1.7+h)*.2)*10)/10};
const ON_SCALE={x:P.scale.x+12,y:P.scale.y+22,z:P.scale.y+30.5};
A.T({id:'scale',n:'体重秤',hit:[P.scale.x,P.scale.y,24,30],at:P.scaleAt,near:[P.scaleAt.x-14,P.scaleAt.y-12,28,22],label:'站到体重秤上',ok:c=>!c.hold,no:()=>'叼着东西，先放下吧',ai:{mood:'explore',w:.2},
  go(c){run(c,[{go:P.scaleAt},{jump:{...ON_SCALE},h:6},{fn:c=>{const kg=kgOf(c);S1.needleT=Math.max(0,Math.min(1,(kg-2)/6));sfx('boing');
    after(1.1,()=>{if(!c.me)return;const g=GS(),r=g.scale=g.scale||{},day=new Date().toDateString();let s=`${kg} 公斤`;if(r.kg&&r.day!==day){const d=Math.round((kg-r.kg)*10)/10;s+=d>0?`，比上次胖了 ${d} 公斤`:d<0?`，比上次瘦了 ${-d} 公斤`:'，和上次一样'}r.kg=kg;r.day=day;A.guide.save();say(s)})}},
    {k:'sit',dur:c.me?1.6:2.4,ex:'curious'},{jump:{...P.scaleAt},h:6},{fn:c=>{c.z=undefined}}])}});
tick(dt=>{if(!S.cats.some(c=>c.z!=null&&near(c,ON_SCALE,4)))S1.needleT=0;const tg=S1.needleT||0;S1.needle+=(tg-S1.needle)*Math.min(1,dt*4)});
// 一摞木桶：扒拉一下，哗啦倒一地，过一会儿店猫又摞回去
A.T({id:'buckets',n:'木桶',hit:[P.buckets.x-6,P.buckets.y,48,40],at:P.bucketsAt,near:[P.bucketsAt.x-16,P.bucketsAt.y-14,32,24],label:c=>S1.bucketsDown>now()?'木桶倒了一地':'扒拉一下木桶',ok:()=>S1.bucketsDown<=now(),no:()=>'已经倒了一地了',ai:{mood:'play',w:c=>S1.bucketsDown>now()?0:.15},
  go(c){run(c,[{go:P.bucketsAt},{fn:c=>{c.face='R'}},{k:'bat',dur:.5},{fn:c=>{S1.bucketsDown=now()+25;sfx('clunk');after(.15,()=>sfx('clack'));after(.3,()=>sfx('clunk'));
    S.cats.forEach(o=>{if(o!==c&&awake(o)&&room(o)==='bath'&&near(o,P.bucketsAt,120))emote(o,'bang',1)});if(c.me)say('哗啦——倒了一地');
    after(25,()=>{const n=A.byName('金哥');if(onB1(me))news((n?'金哥':'店猫')+'把木桶一个个摞回去了')})}},{k:'alert',dur:1}])}});

/* ================= 小电影院 ================= */
// 三排座位：坐进去背对着我们看银幕，椅背挡住身子只露脑袋；你坐下，画面切到电影（cinema.js）
const SEATS=[];P.seatY.forEach(y=>P.seatX.forEach(x=>SEATS.push({x:x+14,y:y+12,z:y+12,face:'R',fx:x+14,fy:y+28})));
A.seatThing({id:'cseat',n:'电影院座位',hit:[P.seatX[0]-2,P.seatY[0],P.seatX[5]+32-P.seatX[0],P.seatY[2]+22-P.seatY[0]],at:c=>{let b=SEATS[0],bd=1e9;SEATS.forEach(s=>{const d=dist({x:s.fx,y:s.fy},c);if(d<bd){bd=d;b=s}});return{x:b.fx,y:b.fy}},
  near:[P.seatX[0]-6,P.seatY[0]+8,P.seatX[5]+40-P.seatX[0],P.seatY[2]+40-P.seatY[0]],label:'坐下看电影',k:'back',ai:{mood:'rest',w:.7},doing:'在看电影',dur:()=>rr(14,30),
  prefer:c=>c.ticketSeat!=null?[c.ticketSeat]:[],spots:SEATS,up:i=>[SEATS[i]],down:i=>[{x:SEATS[i].fx,y:SEATS[i].fy}],floor:i=>({x:SEATS[i].fx,y:SEATS[i].fy}),
  inn(c){c.ticketSeat=null;if(c.me)after(.5,()=>{if(me.place&&me.doing==='在看电影'){if(A.cinema)A.vista.open('cinema');else say('银幕上在放《猫猫咖啡馆》')}})}});
// 放映机：换一卷；它的光柱一直打在银幕上
A.T({id:'projector',n:'放映机',hit:[P.projector.x,P.projector.y-4,30,34],at:{x:P.projector.x-8,y:P.projector.y+18},near:[P.projector.x-24,P.projector.y+4,40,24],label:'换一卷',ai:{mood:'explore',w:.1},
  go(c){run(c,[{go:{x:P.projector.x-8,y:P.projector.y+18}},{fn:c=>{c.face='R'}},{k:'bat',dur:.5},{fn:c=>{sfx('click');if(A.cinema){const r=A.cinema.next();if(c.me)say('换了一卷：'+(r&&r.label||'下一段'))}else if(c.me)say('胶片转起来了，咔嗒咔嗒')}}])}});
A.overs.push(vis=>{const s=P.screen;if(!vis(s.x,s.y,P.projector.x+30-s.x,P.projector.y-s.y))return;const lx=P.projector.x+16,ly=P.projector.y+4,t=now();
  alpha(.07+Math.sin(t*20)*.01,()=>{for(let y=s.y+s.h;y<ly;y+=1){const k=(y-(s.y+s.h))/(ly-(s.y+s.h)),x0=Math.round(s.x+(lx-s.x)*k),x1=Math.round(s.x+s.w+(lx-s.x-s.w)*k);R(x0,y,Math.max(1,x1-x0),1,'#e8f0ff')}});
  for(let i=0;i<8;i++){const k=(t*.07+i*.13)%1,x=Math.round(lx+(s.x+s.w/2-lx)*k+Math.sin(t+i)*6),y=Math.round(ly+(s.y+s.h-ly)*k);if((i+Math.floor(t*3))%2)alpha(.5,()=>P1(x,y,'#ffffff'))}});

/* ---------- 店猫也来：烁烁爱跳舞、看鱼，斑斑爱爆米花和木桶，小狸花爱看海报和电影 ---------- */
Object.assign(A.LIKES[3],{dancefloor:3,onsen:1.2,aqwall:2});Object.assign(A.LIKES[4],{poster1:2,cseat:2,scale:1});Object.assign(A.LIKES[5],{dancefloor:2,popcorn:2.5,buckets:1.5,mball:1});
});
