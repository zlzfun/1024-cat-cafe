/* 1024 猫咖 · 咖啡厅和吧台（设计见 docs/店内设计.md 第三节）。依赖 world-acts.js（在它后面 push 到 WORLD_MODS）、map-1f.js。
   - 咖啡桌：四张小圆桌，每张两样东西（咖啡杯、糖罐、小花瓶、蛋糕碟、小茶壶）。跳上桌推一样下去；掉在地上的，谁都能叼回桌上摆好，下一只猫还能再推。
     放着不管 40 秒，附近闲着的猫会来收拾；再过一阵还没有猫，就有谁悄悄摆回去了。
   - 椅子：每张桌子两把；吧台前三把高脚凳。坐上去像在等咖啡。
   - 大咖啡机：伸爪按一下，做出一杯拉花（杯面上一张猫脸），放在前吧台上；附近的猫凑过来闻一闻。
   - 蛋糕柜：隔着玻璃看。金哥的家在前吧台上（world-acts.js 的 HOMES）。 */
const CTOY={cup:[".....","ooooo","owwwo","owwwoo",".ooo.","ooooo"],sugar:[".oo.","owwo","owwo","oooo"],vase:["r.y","oro",".o.","owo","owo","ooo"],
  cake:["..p..",".oyo.","oyyyo","ooooo","wwwww"],pot:[".oo..","owwoo","owwwo","owwo.","oooo."]};
const CTOY_NAMES={cup:'咖啡杯',sugar:'糖罐',vase:'小花瓶',cake:'蛋糕碟',pot:'小茶壶'};
const rotC=g=>{const h=g.length,w=Math.max(...g.map(r=>r.length));return Array.from({length:w},(_,i)=>Array.from({length:h},(_,j)=>(g[j][w-1-i]||'.')).join(''))};
function ctoy(kind,x,y,fallen=0){const g=fallen?rotC(CTOY[kind]):CTOY[kind];grid(x-Math.floor(g[0].length/2),y-g.length,g,{o:OL,w:'#fff8e8',y:'#f8e0b8',p:'#e0533d',r:'#e0533d',g:'#5ea85e'})}   // (x,y) 底边中点

WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,speak,say,sfx,after,T,TH,stay,unclaim,dist,idle}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,tick=f=>A.tickers.push(f),atMe=(p,d=200)=>A.play&&near(me,p,d);

/* ---------- 咖啡桌：推东西下去、叼回来 ---------- */
const KINDS=[['cup','sugar'],['vase','cup'],['cake','cup'],['pot','cup']];
S.ctoys=[];P.tables.forEach((tb,t)=>KINDS[t].forEach((kind,j)=>S.ctoys.push({t,kind,tx:tb.x+9+j*10,on:true})));
const TOPY=t=>P.tables[t].y+4,TOPZ=t=>P.tables[t].y+20.5,FLOOR=t=>({x:P.tables[t].x+14,y:P.tables[t].y+30});
S.floorToys=S.floorToys||[];
const onFloor=o=>S.floorToys.find(f=>f.o===o&&!f.by);
function tidy(c,f){const o=f.o,t=o.t;f.by=c;
  const drop=c=>{if(!c.ctoy)return;S.floorToys.push({o:c.ctoy,x:c.x,y:c.y+2,t0:now()});c.ctoy=null};
  run(c,[{go:{x:f.x-7,y:f.y+1}},{fn:c=>{c.face='R';c.onLeave=c=>{if(f.by===c)f.by=null;drop(c)}}},{k:'lie',dur:.5,ex:'lookDown'},
    {fn:c=>{const i=S.floorToys.indexOf(f);if(i<0){c.q=[];return}S.floorToys.splice(i,1);c.ctoy=o;c.doing='把'+CTOY_NAMES[o.kind]+'叼回桌上';if(c.me)say(`叼起了${CTOY_NAMES[o.kind]}`)}},
    {go:FLOOR(t)},{jump:{x:o.tx-4,y:TOPY(t),z:TOPZ(t)}},{fn:c=>{c.face='R'}},{k:'sit',dur:.4},
    {fn:c=>{o.on=true;c.ctoy=null;c.doing=null;c.onLeave=null;S.puffs.push({x:o.tx,y:TOPY(t)-4,t0:now()});if(atMe(o))sfx('clack');if(c.me)say(`把${CTOY_NAMES[o.kind]}摆回了桌上。下一只猫还能再推一次`)}},
    {k:'sit',dur:.7,ex:'content'},{jump:{...FLOOR(t)}},{fn:c=>{c.z=undefined}}])}
// 桌子、桌上的东西、叼在嘴里的那一样
A.drawers.push((L,vis)=>{P.tables.forEach((tb,t)=>{if(!vis(tb.x-2,tb.y-8,32,30))return;L.push([tb.y+20,()=>{cafeTableRound(tb.x,tb.y);S.ctoys.forEach(o=>{if(o.t===t&&o.on)ctoy(o.kind,o.tx,TOPY(t)+1)})}])});
  for(const c of S.cats){if(!c.ctoy||c.hidden||c.gone||!vis(c.x-12,c.y-30,24,32))continue;L.push([(c.z??c.y)+.2,()=>{const w=c.k.startsWith('walk'),d=w?(c.k==='walkL'?-1:1):(c.face==='L'?-1:1);
    ctoy(c.ctoy.kind,Math.round(c.x)+d*(w?8:4),w?Math.round(c.y+(c.dy||0))-5:Math.round((c.top??c.y-20))+15,1)}])}});
A.floors.push(vis=>S.floorToys.forEach(f=>{if(f.o&&vis(f.x-6,f.y-8,12,10))ctoy(f.o.kind,f.x,f.y,1)}));
P.tables.forEach((tb,t)=>{
  T({id:'table'+t,n:'咖啡桌',hit:[tb.x-2,tb.y-8,32,28],at:FLOOR(t),near:[tb.x-10,tb.y+20,48,20],label:'跳上咖啡桌，推一样东西下去',
    ok:c=>!c.hold&&S.ctoys.some(o=>o.t===t&&o.on)&&!S.cats.some(o=>o!==c&&o.onTable===t),no:c=>c.hold?'先把嘴里的东西放下':S.ctoys.some(o=>o.t===t&&o.on)?'桌上已经有猫了':'桌上的东西都被推下去了。把地上的叼回去吧',ai:{mood:'play',w:1},
    go(c){const o=rnd(S.ctoys.filter(o=>o.t===t&&o.on));if(!o)return;
      run(c,[{go:FLOOR(t)},{fn:c=>{c.onTable=t;c.onLeave=c=>{c.onTable=null}}},{jump:{x:o.tx-6,y:TOPY(t),z:TOPZ(t)}},{fn:c=>{c.face='R'}},{k:'sit',dur:.8,ex:'smug'},{k:'maneki',dur:.7},
        {fn:c=>{if(!o.on)return;o.on=false;const x1=o.tx+rr(10,20),y1=tb.y+28+rr(0,8);S.flying.push({x0:o.tx,y0:TOPY(t),x1,y1,t0:now(),dur:.45,arc:8,draw:f=>ctoy(o.kind,Math.round(f.x),Math.round(f.y),1),
          done:()=>{S.floorToys.push({o,x:x1,y:y1,t0:now()});if(atMe(o))sfx('clack')}});if(c.me)say(`啪嗒。${CTOY_NAMES[o.kind]}掉下去了`)}},{k:'sit',dur:1,ex:'smug',soft:1},{jump:{...FLOOR(t)}},{fn:unclaim}])}});
  // 两把椅子：左边那把椅背在左（猫面朝右坐），右边那把反过来
  const seat=j=>({x:tb.x+(j?38:-10),y:tb.y+11,z:tb.y+20.6,face:j?'L':'R'}),foot=j=>({x:tb.x+(j?40:-12),y:tb.y+26});
  A.seatThing({id:'chair'+t,n:'椅子',hit:[tb.x-16,tb.y+2,60,18],at:foot(0),near:[tb.x-22,tb.y+18,72,18],label:'坐到椅子上',spots:[seat(0),seat(1)],up:j=>[seat(j)],down:j=>[foot(j)],floor:j=>foot(j),
    k:()=>rnd(['sit','sit','lie']),ex:'content',doing:'坐在咖啡桌旁',ai:{mood:'rest',w:1}})});
// 放着不管 40 秒：附近闲着的猫过来收拾；90 秒还没有猫，就有谁悄悄摆回去了
tick(()=>{for(const f of S.floorToys){if(f.by||!f.o)continue;const age=now()-f.t0;
  if(age>40&&!f.asked){f.asked=1;const c=S.cats.filter(c=>!c.me&&!c.desk&&idle(c)&&!c.place&&!c.hidden&&!c.working&&!c.hold&&!c.ctoy&&c.z==null&&near(c,f,420)).sort((a,b)=>dist(a,f)-dist(b,f))[0];if(c){tidy(c,f);if(atMe(f))speak(c,'我来收拾',2)}}
  if(age>90){const i=S.floorToys.indexOf(f);S.floorToys.splice(i,1);f.o.on=true;S.puffs.push({x:f.o.tx,y:TOPY(f.o.t)-4,t0:now()});if(atMe(f))say('不知道谁又把'+CTOY_NAMES[f.o.kind]+'摆回了桌上');break}}});
S.ctoys.forEach((o,k)=>{const f=()=>onFloor(o);
  T({id:'toyback'+k,n:'掉在地上的'+CTOY_NAMES[o.kind],hidden:()=>!f(),hit:()=>{const q=f();return q?[q.x-7,q.y-7,14,10]:null},at:()=>{const q=f();return q?{x:q.x-7,y:q.y+1}:null},near:()=>{const q=f();return q?[q.x-22,q.y-14,40,26]:null},
    label:'把'+CTOY_NAMES[o.kind]+'叼回桌上',ok:c=>!c.hold&&!c.ctoy,no:c=>c.hold?'嘴里叼着东西呢':'一次只能叼一样',ai:{mood:'play',w:c=>{const q=f();return q&&now()-q.t0>8?(c.pal===6?4:2):0}},
    go(c){const q=f();if(q)tidy(c,q)}})});

/* ---------- 吧台：高脚凳、大咖啡机、蛋糕柜 ---------- */
const SEAT=P.stools.map((s,i)=>({x:s.x+5,y:s.y+2,z:s.y+20.6,face:'L'})),SFOOT=P.stools.map(s=>({x:s.x+5,y:s.y+26}));
A.seatThing({id:'stool',n:'高脚凳',hit:[P.stools[0].x-2,P.stools[0].y-2,P.stools[2].x-P.stools[0].x+14,24],at:SFOOT[1],near:[P.stools[0].x-8,P.stools[0].y+18,P.stools[2].x-P.stools[0].x+26,16],label:'跳上高脚凳',
  spots:SEAT,up:i=>[SEAT[i]],down:i=>[SFOOT[i]],floor:i=>SFOOT[i],k:'sit',ex:'content',doing:'坐在吧台前',ai:{mood:'rest',w:.8}});
S.lattes=[];S.brew=0;
T({id:'coffee',n:'大咖啡机',hit:[P.espresso.x,P.espresso.y,40,28],at:P.espressoAt,near:[P.espressoAt.x-20,P.espressoAt.y-12,40,22],label:'按一下咖啡机（做一杯拉花）',
  ok:()=>!(S.brew>0),no:()=>'正在做，等一下',ai:{mood:'play',w:.4},
  go(c){run(c,[{go:P.espressoAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.6,fn:()=>{S.brew=2.6;if(atMe(P.espresso,220))sfx('pour')}},{k:'sit',dur:2.2,ex:'curious'},
    {fn:c=>{const xs=[60,82,104,126,148,170],used=new Set(S.lattes.map(l=>l.x)),x=xs.find(x=>!used.has(x));if(x!=null){S.lattes.push({x,t0:now()});if(S.lattes.length>4)S.lattes.shift()}
      if(c.me)say('咕嘟咕嘟……一杯拉花，杯面上是一张猫脸。放在吧台上了');
      S.cats.filter(o=>!o.me&&idle(o)&&!o.place&&!o.hidden&&!o.working&&o.z==null&&near(o,P.frontBar,150)).slice(0,2).forEach((o,i)=>after(.4+i*.5,()=>{if(!idle(o))return;run(o,[{go:{x:P.frontBar.x+(x??100),y:P.frontBar.y+40}},{fn:o=>{o.face='L'}},{k:'sit',dur:1.4,ex:'curious'},{fn:o=>emote(o,'heart',1.2)}])}))}},{k:'happy',dur:.8,soft:1}])}});
tick(dt=>{S.brew=Math.max(0,S.brew-dt);S.lattes=S.lattes.filter(l=>now()-l.t0<45)});
T({id:'cake',n:'蛋糕柜',hit:[P.cake.x,P.cake.y,36,36],at:P.cakeAt,near:[P.cakeAt.x-18,P.cakeAt.y-12,36,22],label:'看看蛋糕柜',ai:{mood:'explore',w:.3},
  go(c){run(c,[{go:P.cakeAt},{fn:c=>{c.face='L'}},{k:'sit',dur:1.4,ex:'sparkle'},{fn:c=>{if(c.me)say(rnd(['草莓蛋糕、巧克力蛋糕、一排马卡龙……隔着玻璃，闻得到','玻璃上留下一个鼻子印','蛋糕是给人类准备的。猫看看就好'])) }}])}});

/* ---------- 店猫：金哥爱收拾桌子，斑斑爱推东西，宪宪爱坐椅子 ---------- */
Object.assign(A.LIKES[4],{table0:2,table1:2,table2:2,table3:2});Object.assign(A.LIKES[5],{table0:1.5,table3:1.5,coffee:1});Object.assign(A.LIKES[3],{chair0:1,chair1:1,cake:1.5,coffee:1.5});
});
