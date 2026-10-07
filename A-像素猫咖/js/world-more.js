/* 1024 猫咖 · 这一轮新添的东西里不算小游戏的那些（设计见 docs/店内设计.md 第四节）。依赖 world-acts.js、world4-things.js、world-roof.js、props-kit.js。
   一楼：话筒、聚光灯（舞台）；招财猫摆件、磨豆机（吧台）；点唱机（咖啡厅）；大伞桶、楼层指示牌（楼梯间）；青蛙（后院）。
   二楼：白板（工坊）；天井栏杆（回廊，趴上去往下看一楼）；滚梯、地球仪（图书馆）；弹簧逗猫棒（大客厅）；月亮小夜灯（午睡角）。
   屋顶：孔明灯、猫头鹰、水塔、烟囱。
   抓娃娃机、秋千、曲谱架在 world-games.js，鱼桶、鸭子在 world-river.js。点唱机放什么歌、多大声在 sound.js / world-ambient.js。 */
WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,speak,say,sfx,news,after,T,TID,settle,unclaim,dist,idle,land,faceTo,borrow,setK,seatThing,stay,roomAt}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,tick=f=>A.tickers.push(f),atMe=(p,d=220)=>A.play&&near(me,p,d),fx=A.fx;
let newsT=0;const news1=s=>{if(now()<newsT)return;newsT=now()+8;news(s)};
const idleNear=(p,d)=>S.cats.filter(o=>!o.me&&!o.puppet&&!o.hidden&&!o.place&&!o.working&&!o.hold&&o.z==null&&idle(o)&&near(o,p,d));

/* ================= 一楼 · 1024 舞台：话筒、聚光灯 ================= */
S.micT=0;tick(dt=>{S.micT=Math.max(0,S.micT-dt)});
T({id:'mic',n:'话筒',hit:[P.mic.x-1,P.mic.y-2,10,28],at:P.micAt,near:[P.micAt.x-14,P.micAt.y-12,28,22],label:'对着话筒喵一声',ok:c=>!c.hold,no:()=>'嘴里叼着东西，喵不出来',ai:{mood:'social',w:.4},
  go(c){run(c,[{go:P.micAt},{fn:c=>{c.face='R'}},{k:'meow',dur:1.9,fn:c=>{S.micT=2.2;speak(c,'喵——！',2.4);if(A.floorOf(me.y)===A.floorOf(P.mic.y))sfx('micmeow',A.voiceOf?A.voiceOf(c):null);
      for(let i=0;i<8;i++)fx.push({kind:'note',x:P.mic.x+4+rr(-14,14),y:P.mic.y-4+rr(-6,4),t0:now()+i*.1,life:1.6});
      // 台下的猫回头看，几只跑过来坐在台前
      S.cats.forEach(o=>{if(o===c||o.hidden||!near(o,P.mic,240))return;if(!o.me)emote(o,'bang',1.2)});idleNear(P.mic,240).slice(0,3).forEach((o,i)=>{const p=land(P.mic.x+rr(-60,60),P.mic.y+rr(70,96));run(o,[{go:p},{fn:o=>faceTo(o,P.mic)},{k:'sit',dur:rr(3,5),ex:'happy'}])});
      news1(`${c.me?'你':c.name}在 1024 舞台上对着话筒喵了一声，全店都听见了`)}},{k:'happy',dur:.8,soft:1}])}});
S.spotOn=null;
T({id:'spot',n:'聚光灯',hit:[P.spots[0].x-2,P.spots[0].y,16,34],at:P.spotAt,near:[P.spotAt.x-16,P.spotAt.y-12,32,24],label:'拨一下聚光灯',ai:{mood:'social',w:.25},
  go(c){run(c,[{go:P.spotAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.6,fn:c=>{S.spotOn={by:c,until:now()+15};sfx('clunk')}},
    {fn:c=>{if(c.me)say('聚光灯打在你身上了：走到哪儿跟到哪儿（十五秒）');else run(c,[{go:land(P.stage[rr(0,5)|0].x,P.stage[0].y+2)},{k:'sit',dur:rr(4,7),ex:'sparkle'}],true)}}])}});
tick(()=>{const s=S.spotOn;if(!s)return;if(now()>s.until||s.by.gone||A.floorOf(s.by.y).id!=='f1'){S.spotOn=null;return}const c=s.by;if(c.hidden)return;
  A.lights.push({x:c.x,y:c.y-6,r:30,col:'#fff2c0',a:.95},{x:c.x,y:c.y-2,r:16,col:'#ffffff',a:.5})});
A.floors.push(vis=>{const s=S.spotOn;if(!s||s.by.hidden)return;const c=s.by;if(!vis(c.x-20,c.y-10,40,20))return;alpha(.22,()=>disc(Math.round(c.x),Math.round(c.y),14,5,'#fff4c0'))});
A.overs.push(vis=>{const s=S.spotOn;if(!s||s.by.hidden)return;const c=s.by,L=P.spots,in_=roomAt(c.x,c.y).id==='stage';if(!in_)return;
  L.forEach(q=>{const x0=q.x+6,y0=q.y+12;if(!vis(Math.min(x0,c.x)-10,y0,Math.abs(c.x-x0)+20,c.y-y0+10))return;alpha(.12,()=>{line(x0,y0,Math.round(c.x-10),Math.round(c.y),'#fff4c0');line(x0,y0,Math.round(c.x+10),Math.round(c.y),'#fff4c0')})})});

/* ================= 一楼 · 吧台：招财猫、磨豆机 ================= */
S.maneki=0;tick(dt=>{S.maneki=Math.max(0,S.maneki-dt)});
T({id:'maneki',n:'招财猫摆件',hit:[P.maneki.x-1,P.maneki.y-1,14,16],at:P.manekiAt,near:[P.manekiAt.x-14,P.manekiAt.y-12,28,22],label:'拍一下招财猫',ai:{mood:'play',w:.25},
  go(c){run(c,[{go:P.manekiAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.8,mirror:true,fn:()=>{S.maneki=6;if(atMe(P.maneki))sfx('ding');const g=A.byName('金哥');if(g&&g.atHome&&borrow(g,'maneki',2.4))emote(g,'note',2)}},
    {fn:c=>{const lucky=Math.random()<.3;if(lucky&&A.arrive1)after(1.2,()=>A.arrive1());if(c.me)say(lucky?'招财猫的爪子招得飞快……叮铃，门口好像塞进来一颗毛线球':rnd(['招财猫的爪子招得飞快。金哥看了它一眼','它招呀招，不知道在招什么','叮——爪子停在半空，好像在等你也招一招']))}},{k:'sit',dur:.8,ex:'content',soft:1}])}});
S.grind=0;S.aroma=[];
tick(dt=>{S.grind=Math.max(0,S.grind-dt);if(S.grind>0&&Math.random()<dt*6)S.aroma.push({x:P.grinder.x+6+rr(-3,3),y:P.grinder.y,t0:now(),ph:Math.random()*6});S.aroma=S.aroma.filter(a=>now()-a.t0<3)});
A.overs.push(vis=>{if(!S.aroma.length||!vis(P.grinder.x-30,P.grinder.y-60,70,70))return;for(const a of S.aroma){const k=(now()-a.t0)/3;alpha((1-k)*.7,()=>{P1(Math.round(a.x+Math.sin(k*6+a.ph)*4),Math.round(a.y-k*40),k<.4?'#c8956a':'#e8c8a0')})}});
T({id:'grinder',n:'磨豆机',hit:[P.grinder.x-1,P.grinder.y,14,26],at:P.grinderAt,near:[P.grinderAt.x-14,P.grinderAt.y-12,28,22],label:'转一转磨豆机',ok:()=>!(S.grind>0),no:()=>'正在磨，香味已经飘出来了',ai:{mood:'play',w:.25},
  go(c){run(c,[{go:P.grinderAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.6,fn:()=>{S.grind=2.6;if(atMe(P.grinder))sfx('grind')}},{k:'sit',dur:2.2,ex:'content'},
    {fn:c=>{if(c.me)say('咖啡豆的香味一缕缕飘起来。附近的猫都凑过来闻');idleNear(P.grinder,160).slice(0,2).forEach((o,i)=>after(i*.4,()=>{if(!idle(o))return;run(o,[{go:land(P.grinderAt.x+rr(-30,30),P.grinderAt.y+rr(4,14))},{fn:o=>faceTo(o,P.grinder)},{k:'sit',dur:1.4,ex:'curious'},{fn:o=>emote(o,'heart',1.2)}])}))}}])}});

/* ================= 一楼 · 咖啡厅：点唱机 ================= */
const TRACKS=()=>(window.Sound&&Sound.TRACKS)||['猫步爵士','毛线球圆舞曲','1024 小进行曲'];
S.juke={on:true,track:0};let jukeNote=0,jukeNpc=rr(120,240);
function jukePress(c){const J=S.juke;if(!J.on){J.on=true;J.track=0}else if(J.track<TRACKS().length-1)J.track++;else J.on=false;if(atMe(P.juke,300))sfx('coin');
  if(c.me)say(J.on?`点唱机：《${TRACKS()[J.track]}》${window.Sound&&Sound.on?'':'（右下角打开声音才听得见）'}`:'点唱机关掉了，咖啡厅一下子安静下来')}
T({id:'juke',n:'点唱机',hit:[P.juke.x,P.juke.y,24,36],at:P.jukeAt,near:[P.jukeAt.x-16,P.jukeAt.y-14,32,24],label:()=>!S.juke.on?'打开点唱机':S.juke.track<TRACKS().length-1?'换一首歌':'关掉点唱机',ai:{mood:'play',w:.1},
  go(c){run(c,[{go:P.jukeAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.6,fn:c=>jukePress(c)},{k:'sit',dur:.8,ex:'content',soft:1}])}});
tick(dt=>{const J=S.juke;if(J.on&&(jukeNote-=dt)<=0){jukeNote=rr(.9,1.6);fx.push({kind:'note',x:P.juke.x+12+rr(-8,8),y:P.juke.y-2,t0:now(),life:1.6})}
  // 隔几分钟，店里的猫会过去换一首
  if((jukeNpc-=dt)<=0){jukeNpc=rr(150,300);const o=idleNear(P.juke,320)[0];if(o)run(o,[{go:P.jukeAt},{fn:o=>{o.face='L'}},{k:'maneki',dur:.6,fn:o=>{if(!S.juke.on){S.juke.on=true}else S.juke.track=(S.juke.track+1)%TRACKS().length}},{k:'sit',dur:1,ex:'happy'}])}});

/* ================= 一楼 · 楼梯间：大伞桶、楼层指示牌 ================= */
const UB=P.ubin,UBS={x:UB.x+9,y:UB.y+15,z:UB.y+22.5};
seatThing({id:'ubin',n:'大伞桶',hit:[UB.x,UB.y-10,18,34],at:P.ubinAt,near:[P.ubinAt.x-14,P.ubinAt.y-12,28,22],label:'钻进伞桶',spots:[{...UBS,face:'R'}],up:()=>[{...UBS}],down:()=>[{...P.ubinAt}],floor:()=>({...P.ubinAt}),
  k:'sit',ex:'content',doing:'在伞桶里只露个脑袋',dur:()=>rr(8,16),ai:{mood:'rest',w:.5}});
T({id:'directory',n:'楼层指示牌',hit:[836,260,42,36],at:P.dirAt,near:[P.dirAt.x-16,P.dirAt.y-12,32,22],label:'看看楼层指示牌',ai:{mood:'explore',w:.1},
  go(c){run(c,[{go:P.dirAt},{fn:c=>{c.face='R'}},{k:'sit',dur:.5,ex:'lookUp'},{fn:c=>{if(c.me)A.infoDialog('dir','楼层指示牌','sign',[
    {k:'steps',items:[{t:'屋顶 · 星空露台',sub:'永远是晴天的夜里：屋脊、观星毯、望远镜、跑轮和串灯、孔明灯、巨树的瞭望台'},{t:'二楼',sub:'1024 工坊、巨树回廊、猫猫图书馆、大客厅（地板钢琴）、午睡角'},{t:'一楼 · 你在这儿',sub:'门厅、橱窗长廊、1024 舞台（抓娃娃机）、吧台、咖啡厅、楼梯间；后门出去是后院（秋千）和河（小船、钓鱼）'}]},
    {k:'text',t:'楼梯就在旁边，走进楼梯口就上去了；二楼午睡角里还有一段楼梯通屋顶。也可以在咖啡厅爬上巨树，一路爬到屋顶。'}],null)}}])}});

/* ================= 一楼 · 后院：青蛙 ================= */
const FR=S.frog={i:0,x:P.frogs[0].x,y:P.frogs[0].y,st:'sit',t:now()+rr(25,50),croak:-9,jump:null,back:0};
function frogTo(i){const a={x:FR.x,y:FR.y},b=P.frogs[i];FR.jump={a,b,t0:now()};FR.i=i}
tick(()=>{const t=now();if(FR.jump){const k=(t-FR.jump.t0)/.5;if(k>=1){FR.x=FR.jump.b.x;FR.y=FR.jump.b.y;FR.jump=null}else{FR.x=FR.jump.a.x+(FR.jump.b.x-FR.jump.a.x)*k;FR.y=FR.jump.a.y+(FR.jump.b.y-FR.jump.a.y)*k}return}
  if(FR.st==='gone'){if(t>FR.back){FR.st='sit';const i=Math.floor(Math.random()*P.frogs.length);FR.x=P.frogs[i].x;FR.y=P.frogs[i].y;FR.i=i;FR.t=t+rr(25,50)}return}
  if(t>FR.t){FR.t=t+rr(25,50);frogTo((FR.i+1+Math.floor(Math.random()*(P.frogs.length-1)))%P.frogs.length)}
  if(t-FR.croak>rr(3.5,7)){FR.croak=t;if(atMe(FR,200))sfx('croak')}});
A.drawers.push((L,vis)=>{if(FR.st==='gone'||!vis(FR.x-8,FR.y-16,16,18))return;const k=FR.jump?(now()-FR.jump.t0)/.5:0;L.push([FR.y,()=>frogPx(Math.round(FR.x),Math.round(FR.y),now(),now()-FR.croak<.6,FR.jump?k:0)])});
T({id:'frog',n:'青蛙',hidden:()=>FR.st!=='sit'||!!FR.jump,hit:()=>[FR.x-6,FR.y-8,12,9],at:c=>land(FR.x+(c.x<FR.x?-16:16),FR.y+3),near:()=>[FR.x-34,FR.y-20,68,40],label:'扑青蛙',ai:{mood:'play',w:c=>FR.st==='sit'&&near(c,FR,220)?(c.pal===5?3:1):0},
  go(c){faceTo(c,FR);run(c,[{fn:c=>faceTo(c,FR)},{k:'pounce',dur:.9},{jump:()=>land(FR.x,FR.y+2),h:12,dur:.34},{fn:c=>{if(FR.st!=='sit')return;FR.st='gone';FR.back=now()+rr(8,15);S.ripples.push({x:P.pond.x+rr(-14,14),y:P.pond.y+rr(-2,4),t0:now(),k:0});
      if(atMe(FR,240))sfx('splash');if(c.me)say(rnd(['扑通——青蛙跳进池子里了','差一点！青蛙扑通一声跳进了水里','青蛙呱了一声，跳进池子里']))}},{k:'sit',dur:.8,ex:'meh',soft:1}])}});
// 许愿池里的涟漪（投星星、青蛙跳水）
A.floors.push(vis=>{for(const r of S.ripples){if(!vis(r.x-20,r.y-8,40,16))continue;const k=r.k||0,rx=Math.round(3+k*14),ry=Math.max(1,Math.round(1+k*5));alpha(1-k,()=>{for(let a=0;a<24;a++){const q=a/24*Math.PI*2;P1(Math.round(r.x+Math.cos(q)*rx),Math.round(r.y+Math.sin(q)*ry),'#cfe8f8')}})}});

/* ================= 二楼 · 工坊：白板 ================= */
S.doodles=[];const WBK=['fish','yarn','cat','heart','lgtm','flow','paw'],WBSLOT=[[5,7],[24,6],[43,8],[6,21],[25,22],[44,20]];
tick(()=>{if(S.doodles.length&&now()-S.doodles[0].t0>150)S.doodles.shift()});
T({id:'wboard',n:'白板',hit:[P.wb.x,P.wb.y,P.wb.w,P.wb.h],at:P.wbAt,near:[P.wbAt.x-16,P.wbAt.y-12,32,22],label:()=>S.doodles.length>=6?'白板画满了（擦掉重画）':'在白板上画一笔',ai:{mood:'play',w:.35},
  go(c){run(c,[{go:P.wbAt},{fn:c=>{c.face='L'}},{jump:{x:P.wbAt.x,y:P.wbAt.y},h:16,dur:.5},{k:'maneki',dur:.7,fn:c=>{if(S.doodles.length>=6){S.doodles.length=0;if(atMe(P.wb))sfx('rustle');if(c.me)say('白板画满了，擦掉，重新来');return}
      const used=new Set(S.doodles.map(d=>d.s)),free=WBSLOT.map((s,i)=>i).filter(i=>!used.has(i)),s=rnd(free),k=rnd(WBK);S.doodles.push({s,x:WBSLOT[s][0],y:WBSLOT[s][1],k,ink:Math.floor(Math.random()*4),t0:now()});if(atMe(P.wb))sfx('marker');
      if(c.me)say({fish:'画了一条鱼',yarn:'画了一颗毛线球',cat:'画了一张猫脸',heart:'画了一颗心',lgtm:'写了一个 LGTM',flow:'画了一张流程图：写代码 → review → 合并',paw:'按了一个爪印'}[k])}},{k:'sit',dur:.6,ex:'content',soft:1}])}});

/* ================= 二楼 · 回廊：趴在天井栏杆上往下看 ================= */
const W=TREE.f2.well,WR=[W[0]-14,W[1]-12,W[2]+28,W[3]+28],WC={x:W[0]+W[2]/2,y:W[1]+W[3]/2};
const railAt=c=>{const x=Math.max(WR[0],Math.min(WR[0]+WR[2],c.x)),y=Math.max(WR[1],Math.min(WR[1]+WR[3],c.y));let p={x,y};
  const dl=Math.abs(c.x-WR[0]),dr=Math.abs(c.x-WR[0]-WR[2]),dt2=Math.abs(c.y-WR[1]),db=Math.abs(c.y-WR[1]-WR[3]),m=Math.min(dl,dr,dt2,db);
  if(m===dl)p.x=WR[0];else if(m===dr)p.x=WR[0]+WR[2];else if(m===dt2)p.y=WR[1];else p.y=WR[1]+WR[3];return land(p.x,p.y)};
S.peek=null;
T({id:'rail',n:'天井栏杆',hit:[W[0]-6,W[1]+W[3]-4,W[2]+12,12],at:railAt,near:[WR[0]-14,WR[1]-14,WR[2]+28,WR[3]+28],label:'趴在栏杆上往下看',ai:{mood:'explore',w:.5},
  go(c){run(c,[{go:()=>railAt(c)},{fn:c=>{faceTo(c,WC);if(c.me){S.peek={t0:now()};settle(c,{k:'lie',ex:'lookDown',prompt:()=>'在看一楼的咖啡厅 · WASD 回来',leave:()=>[{fn:()=>{S.peek=null}}]});c.doing='趴在栏杆上往下看';
      c.onLeave=c=>{S.peek=null;c.doing=null};say('往下看：一楼的咖啡厅，巨树底下的猫在干什么')}else stay(c,{k:'lie',ex:'lookDown',dur:rr(5,10)})}}])}});
// 镜头：你趴在栏杆上的时候，移到一楼的咖啡厅（直接切过去，不在两层中间的空白里滑）
{const cam0=A.camHook;A.camHook=(vw,vh)=>{const o=cam0?cam0(vw,vh):null;if(o)return o;if(S.peek&&me.place&&!me.transit)return{x:480,y:420,k:1000};if(S.peek&&!me.place)S.peek=null;return null}}

/* ================= 二楼 · 图书馆：滚梯、地球仪 ================= */
const LYT=P.shelves[0].y-6,LD=S.ladder;
T({id:'ladder',n:'滚梯',hit:()=>[LD.x-6,P.ladder.y0,14,P.ladder.y1-P.ladder.y0+6],at:()=>({x:LD.x,y:LYT+82}),near:()=>[LD.x-18,LYT+72,36,22],label:'站上滚梯，滑一趟',ok:c=>!c.hold&&!LD.by,no:c=>c.hold?'叼着东西呢':LD.by.name+'在用滚梯',ai:{mood:'play',w:c=>c.pal===4?1.5:.35},
  go(c){run(c,[{go:()=>({x:LD.x,y:LYT+82})},{fn:c=>{if(LD.by&&LD.by!==c){c.q=[];emote(c,'q');return}LD.by=c;c.doing='在滑滚梯';c.onLeave=c=>{if(LD.by===c){LD.by=null;LD.fast=false}c.ride=false;c.doing=null;if(c.y<LYT+74){c.y=LYT+84;c.dy=0}c.z=undefined}}},
    {jump:()=>({x:LD.x,y:LYT+46,z:LYT+73}),h:5,dur:.5},{fn:c=>{c.ride=true;LD.tx=LD.x<765?878:652;LD.fast=true;if(atMe(LD,260))sfx('roll');if(c.me)say('蹬一下——嗖')}},
    {when:()=>Math.abs(LD.x-LD.tx)<1},{fn:c=>{c.ride=false;LD.fast=false}},{k:'happy',dur:.6},{jump:()=>({x:LD.x+rr(-6,6),y:LYT+84}),h:5},{fn:c=>{c.z=undefined;unclaim(c)}}])}});
tick(()=>{for(const c of S.cats)if(c.ride&&LD.by===c){c.x=LD.x;c.y=LYT+46}});
S.globeA=0;let globeV=0,globeBy=null;
const PLACES=['冰岛：那边的猫，冬天要过很长很长的夜','日本：海边有一座小岛，岛上的猫比人还多','土耳其：街上的猫比人还自在，谁都会喂它们','新西兰：好多人家的门上，都开着一个猫洞','埃及：很久很久以前，猫在这儿被当成神',
  '挪威：森林里住着大个子的长毛猫','一片大海……猫不太喜欢海','南极：太冷了，一只猫也没有','中国：一家开在三层小楼里的猫咖'];
tick(dt=>{if(globeV>0){S.globeA+=globeV*dt;globeV*=Math.exp(-1.1*dt);if(globeV<.25){globeV=0;if(globeBy&&globeBy.me)say('爪子按住了……'+rnd(PLACES));globeBy=null}}});
T({id:'globe',n:'地球仪',hit:[P.globe.x-1,P.globe.y-2,18,26],at:P.globeAt,near:[P.globeAt.x-14,P.globeAt.y-12,28,22],label:'拍一下地球仪',ok:()=>!globeV,no:()=>'还在转',ai:{mood:'play',w:c=>c.pal===4?1.5:.3},
  go(c){run(c,[{go:P.globeAt},{fn:c=>{c.face='R'}},{k:'maneki',dur:.6,fn:c=>{globeV=rr(9,14);globeBy=c;if(atMe(P.globe))sfx('spin')}},{k:'sit',dur:2.4,ex:'curious',soft:1}])}});

/* ================= 二楼 · 大客厅：弹簧逗猫棒 ================= */
S.wandWob=0;let wandV=0;
tick(dt=>{dt=Math.min(dt,.05);wandV+=(-38*S.wandWob-2.2*wandV)*dt;S.wandWob=Math.max(-1,Math.min(1,S.wandWob+wandV*dt))});
function bat(c){wandV+=(c.x<P.wand.x+4?1:-1)*rr(5,8);if(atMe(P.wand,200))sfx('boing')}
T({id:'wand',n:'弹簧逗猫棒',hit:[P.wand.x-4,P.wand.y-2,16,34],at:P.wandAt,near:[P.wandAt.x-14,P.wandAt.y-12,28,22],label:'拍一下逗猫棒',ai:{mood:'play',w:c=>c.pal===5?2:.6},
  go(c){run(c,[{go:P.wandAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.4,mirror:true,fn:bat},{k:'sit',dur:.5,ex:'focus'},{k:'maneki',dur:.4,mirror:true,fn:bat},
    {fn:c=>{if(c.me){settle(c,{k:'sit',ex:'focus',act:c=>{run(c,[{k:'maneki',dur:.35,mirror:true,fn:bat},{k:'sit',dur:.1,ex:'focus'}],true);return true},prompt:()=>'E · 再拍一下 · WASD 离开'});say('羽毛来回弹。再拍！')}
      else run(c,[{k:'maneki',dur:.4,mirror:true,fn:bat},{k:'sit',dur:.6,ex:'happy'}],true)}}])}});

/* ================= 二楼 · 午睡角：月亮小夜灯 ================= */
S.stars=null;const NAP=A.M.rooms.find(r=>r.id==='nap');
T({id:'moonlamp',n:'月亮小夜灯',hit:[P.napMoon.x-2,P.napMoon.y-2,18,24],at:P.moonAt,near:[P.moonAt.x-14,P.moonAt.y-12,28,22],label:()=>S.stars?'星星还在转':'跳起来拍一下小夜灯',ai:{mood:'rest',w:.3},
  go(c){run(c,[{go:P.moonAt},{fn:c=>{c.face='L'}},{jump:{x:P.moonAt.x,y:P.moonAt.y},h:18,dur:.5},{k:'maneki',dur:.5,fn:c=>{S.stars={t0:now(),until:now()+25};if(atMe(P.moonAt,300))sfx('twinkle');
      if(c.me)say('墙上地上转起一屋子星星');idleNear(P.moonAt,260).filter(o=>roomAt(o.x,o.y).id==='nap').slice(0,4).forEach((o,i)=>after(1+i*.8,()=>{if(idle(o)&&!o.place)run(o,[{k:'lie',dur:2,ex:'sleepy'},{k:'sleep',dur:rr(10,18)}])}))}},{k:'sit',dur:1,ex:'lookUp',soft:1}])}});
tick(()=>{if(S.stars&&now()>S.stars.until)S.stars=null;if(S.stars)A.lights.push({x:P.napMoon.x+7,y:P.napMoon.y+8,r:38,col:'#ffe8a0',a:.7})});
// 投在墙上地上的星星：七十颗散满整间房，绕着小夜灯慢慢转；亮的几颗是十字星
A.overs.push(vis=>{const s=S.stars;if(!s||!vis(NAP.x,NAP.y,NAP.w,NAP.h))return;const t=now(),k=Math.max(0,Math.min(1,(t-s.t0)/1.5,(s.until-t)/2)),cx=P.napMoon.x+7,cy=P.napMoon.y+90,a=(t-s.t0)*.07,ca=Math.cos(a),sa=Math.sin(a);
  alpha(k,()=>{for(let i=0;i<70;i++){const dx=NAP.x+10+hsh(i,901)*(NAP.w-20)-cx,dy=(NAP.y+46+hsh(i,902)*(NAP.h-56)-cy)*1.8,x=Math.round(cx+dx*ca-dy*sa),y=Math.round(cy+(dx*sa+dy*ca)/1.8);
    if(x<NAP.x+4||x>NAP.x+NAP.w-4||y<NAP.y+6||y>NAP.y+NAP.h-4)continue;const on=(Math.sin(t*2.4+i*1.7)+1)/2;
    if(i%6===0){const c=on>.4?'#fff4c0':'#ffd84a';P1(x,y,'#ffffff');P1(x-1,y,c);P1(x+1,y,c);P1(x,y-1,c);P1(x,y+1,c);if(on>.75){P1(x-2,y,c);P1(x+2,y,c)}}else P1(x,y,on>.5?'#fff8d0':'#e8c860')}})});

/* ================= 屋顶：孔明灯、猫头鹰、水塔、烟囱 ================= */
S.lanterns=[];let lanternCD=0;
tick(dt=>{lanternCD-=dt;for(let i=S.lanterns.length-1;i>=0;i--){const L=S.lanterns[i],k=now()-L.t0;L.y=L.y0-Math.min(240,k*(10-k*.06));L.x=L.x0+Math.sin(k*.3+L.ph)*10+k*L.dx;if(k>55||L.y<Y3+8)S.lanterns.splice(i,1)}
  S.lanterns.forEach(L=>{const s=Math.max(.2,1-(now()-L.t0)/45);A.lights.push({x:L.x,y:L.y+4,r:Math.round(6+10*s),col:'#ffb060',a:.8})})});
A.overs.push(vis=>{for(const L of S.lanterns){const s=Math.max(.2,1-(now()-L.t0)/45);if(vis(L.x-6,L.y-4,12,14))skyLantern(Math.round(L.x),Math.round(L.y),now(),s)}});
T({id:'lantern',n:'孔明灯',hit:[P.lanterns.x,P.lanterns.y,16,12],at:P.lanternAt,near:[P.lanternAt.x-14,P.lanternAt.y-12,30,22],label:'放一盏孔明灯',ok:c=>S.lanterns.length<8&&(!c.me||lanternCD<=0),no:()=>S.lanterns.length>=8?'天上已经有好多盏了，等它们飘远一点':'刚放了一盏，看它飘一会儿',ai:{mood:'play',w:.25},
  go(c){run(c,[{go:P.lanternAt},{fn:c=>{c.face='R'}},{k:'maneki',dur:.7,fn:c=>{S.lanterns.push({x0:P.lanterns.x+8,y0:P.lanterns.y-6,x:P.lanterns.x+8,y:P.lanterns.y-6,t0:now(),dx:rr(-.6,.8),ph:Math.random()*6});if(c.me)lanternCD=20;if(atMe(P.lanterns,300))sfx('whoosh')}},
    {k:'sit',dur:2,ex:'lookUp'},{fn:c=>{if(c.me)say('孔明灯慢慢飘起来了，越飘越小。许个愿吧');else news1(`${c.name}在屋顶放了一盏孔明灯`)}}])}});
const OW=S.owl={i:0,st:'perch',t0:0,head:0,headT:-9,from:null};const OAT=[{x:846,y:Y3+462},{x:900,y:Y3+400},{x:150,y:Y3+440}];
const owlXY=()=>{if(OW.st==='fly'){const k=Math.min(1,(now()-OW.t0)/2.2),a=P.owlPerch[OW.from],b=P.owlPerch[OW.i];return{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k-Math.sin(k*Math.PI)*40}}return P.owlPerch[OW.i]};
tick(()=>{if(OW.st==='fly'&&now()-OW.t0>2.2)OW.st='perch';if(OW.st==='perch'&&Math.random()<.002&&A.floorOf(me.y).id==='roof'&&!near(me,owlXY(),120))sfx('hoot')});
A.overs.push(vis=>{const p=owlXY();if(!vis(p.x-10,p.y-14,20,16))return;owlPx(Math.round(p.x),Math.round(p.y),now(),OW.st==='perch'&&now()-OW.headT<1.6,OW.st==='fly'?1:0)});
function owlFly(){const n=P.owlPerch.length;OW.from=OW.i;OW.i=(OW.i+1+Math.floor(Math.random()*(n-1)))%n;OW.st='fly';OW.t0=now();if(atMe(owlXY(),300))sfx('flap')}
T({id:'owl',n:'猫头鹰',hidden:()=>OW.st!=='perch',hit:()=>{const p=owlXY();return[p.x-6,p.y-12,12,13]},at:()=>OAT[OW.i],near:()=>{const a=OAT[OW.i];return[a.x-22,a.y-16,44,30]},
  label:()=>now()-OW.headT<10?'扑过去':'盯着猫头鹰看',ai:{mood:'explore',w:.25},
  go(c){run(c,[{go:()=>OAT[OW.i]},{fn:c=>faceTo(c,owlXY())},{k:'sit',dur:1.2,ex:'lookUp',fn:c=>{if(now()-OW.headT<10&&c.me){OW.headT=-9;owlFly();emote(c,'bang',1);say('猫头鹰扑棱扑棱，飞到别处去了');return}
      OW.headT=now();if(atMe(c,300))sfx('hoot');if(c.me)say('猫头鹰盯着你看，把头转了半圈……又转回来了')}},{k:'sit',dur:.6,ex:'lookUp',soft:1}])}});
const WT=P.waterTank,MID=i=>({x:WT.x+12+i*16,y:WT.y+40,z:WT.y+58.6});
seatThing({id:'wtank',n:'水塔',hit:[WT.x,WT.y-4,40,62],at:P.tankAt,near:[P.tankAt.x-20,P.tankAt.y-14,40,24],label:'爬上水塔顶',spots:P.tankTop,up:i=>[MID(i),{...P.tankTop[i]}],down:i=>[MID(i),{...P.tankAt}],floor:()=>({...P.tankAt}),
  k:'sit',ex:'lookUp',doing:'坐在水塔顶上看星星',dur:()=>rr(10,20),ai:{mood:'rest',w:.5}});
const CS=P.chimSeat,CUP=i=>[{x:CS[i].x+6,y:Y3+384,z:Y3+412.5},{x:CS[i].x+4,y:Y3+316,z:Y3+412.5},{...CS[i]}],CAT2={x:130,y:Y3+436};
S.rings=[];let ringT=0;
seatThing({id:'chimney',n:'烟囱',hit:[P.chimney.x-2,P.chimney.y-40,26,84],at:CAT2,near:[CAT2.x-20,CAT2.y-14,40,24],label:'挨着烟囱趴一会儿',spots:CS,up:i=>CUP(i),down:i=>[...CUP(i).reverse().slice(1),{...CAT2}],floor:()=>({...CAT2}),
  k:'lie',ex:'content',doing:'挨着烟囱取暖',dur:()=>rr(12,24),ai:{mood:'rest',w:.6},inn:c=>{ringT=0;if(c.me)say('烟囱暖烘烘的。时不时冒一个烟圈')}});
const chimTh=TID('chimney');
tick(dt=>{const sit=chimTh.occ.some(c=>c&&!c.gone);if(sit&&(ringT-=dt)<=0){ringT=rr(5,9);S.rings.push({t0:now()})}S.rings=S.rings.filter(r=>now()-r.t0<4)});
A.overs.push(vis=>{if(!S.rings.length||!vis(P.chimney.x-30,P.chimney.y-80,80,90))return;for(const r of S.rings){const k=(now()-r.t0)/4,x=P.chimney.x+10+Math.round(k*18),y=Math.round(P.chimney.y-4-k*60),rx=Math.round(3+k*7),ry=Math.max(1,Math.round(1+k*3));
  alpha(.75*(1-k),()=>{for(let a=0;a<20;a++){const q=a/20*Math.PI*2;P1(Math.round(x+Math.cos(q)*rx),Math.round(y+Math.sin(q)*ry),'#d8d4e8')}})}});

/* ---------- 店猫的新去处 ---------- */
Object.assign(A.LIKES[4],{ladder:2,globe:1.5,ubin:1});Object.assign(A.LIKES[3],{mic:1.5,frog:2,juke:.6,lantern:1});Object.assign(A.LIKES[5],{wand:3,frog:2,owl:1.5,wtank:1});
A.events.lantern=()=>{S.lanterns.push({x0:P.lanterns.x+8,y0:P.lanterns.y-6,x:0,y:P.lanterns.y-6,t0:now(),dx:rr(-.6,.8),ph:Math.random()*6})};A.events.owl=()=>owlFly();A.events.stars=()=>{S.stars={t0:now(),until:now()+25}};

/* ---------- 舞台的 Tips 大屏（第五轮）：背板平时是 1024，每隔二十秒变成一块大屏，滚一条猫猫咖啡馆的小贴士，滚完变回去 ---------- */
// 轮着滚 TIPS 里的每一条；凑过去（或者点背板）弹出这一条的全文和"了解更多"
const TIPK=Object.keys(TIPS).filter(k=>k!=='camp'),TB=S.tipb={on:false,s:'',k:0,key:null,i:Math.floor(Math.random()*TIPK.length),off:now()+8,t0:0};
tick(()=>{const B=P.backdrop;if(!TB.on){if(now()<TB.off)return;TB.i=(TB.i+1)%TIPK.length;TB.key=TIPK[TB.i];TB.s='猫猫咖啡馆小贴士：'+TIPS[TB.key].t;TB.on=true;TB.t0=now();TB.w=PXT.w(TB.s);return}
  TB.k=(now()-TB.t0)*42/(TB.w+B.w);if(TB.k>=1){TB.on=false;TB.off=now()+20}});
const BD=P.backdrop;
T({id:'tipboard',n:'Tips 大屏',hit:[BD.x,BD.y,BD.w,BD.h],at:{x:BD.x+60,y:P.stageTop.y+26},near:[BD.x+20,P.stageTop.y+8,BD.w-40,30],label:'看看大屏上的小贴士',ai:{mood:'explore',w:.1},
  go(c){run(c,[{go:{x:BD.x+60,y:P.stageTop.y+26}},{k:'sit',dur:c.me?.4:2,ex:'lookUp'},{fn:c=>{if(!c.me)return;const k=TB.key||TIPK[TB.i];A.linkDialog('tipboard','猫猫咖啡馆小贴士','star',TIPS[k].t,[TIPS[k].l],k)}}])}});
});
