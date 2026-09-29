/* 1024 猫咖 · 场景 v2：一屏猫咖 320×180。依赖 cat-sprites.js、scene-kit.js。
   场景里不出现人类。毛线球的一生：门上的投递口 → 毛线篮 → 猫解开、织成小物件 → 橱窗晾衣绳 → 人类取走（窗外飘心）。
   CAFE = {w,h,P 点位,zones 分区,lights 夜灯,BLOCK 家具占地,draw(t,S)}；S 是场景状态，由 scene-play.js 维护，CAFE_STATE() 给出一份静态样例。
   绘制顺序：墙与地面 → 按 base(y) 排序的家具、猫、机器人 → 飞行物、烟、飘心、头顶符号 → 昼夜光照。 */
function paint(list){list.sort((a,b)=>a[0]-b[0]).forEach(([,f])=>f())}
const LOCAL=new Set(['pounce','lick','stretch','slowBlink']);   // 一次性动作：从动作开始的那一刻播放
function meMark(x,y){R(x-2,y,5,1,'#e0533d');R(x-1,y+1,3,1,'#e0533d');P1(x,y+2,'#e0533d')}

const CAFE={w:320,h:180,
  // 点位：猫站在哪里跟元素互动（脚底坐标），以及几个元素的锚点
  P:{door:{x:98,y:10},slot:{x:109,y:31},drop:{x:109,y:55},basket:{x:128,y:50},basketIn:{x:142,y:57},take:{x:142,y:74},
     window:{x:166,y:8,w:66,h:32},line:{x:173,y:14,w:52},sill:{x:199,y:41},hang:{x:199,y:60},board:{x:268,y:58},
     dock:{x:258,y:42},vacHome:{x:264,y:62},counterTop:{x:63,y:60},counterFloor:{x:63,y:88},knock:{x:110,y:62},
     tank:{x:4,y:94},tankView:{x:42,y:126},feed:{x:6,y:140},eat:{x:48,y:172},eatIn:{x:14,y:166},box:{x:58,y:154},boxFront:{x:69,y:176},
     catnip:{x:92,y:166},sniff:{x:108,y:174},treeTop:{x:300,y:58},treeMid:{x:292,y:84},treeFloor:{x:296,y:124},
     sofa:{x:236,y:140},sofaSeat:{x:260,y:159},sofaFloor:{x:262,y:176},sun:{x:196,y:84},rug:{x:160,y:124}},
  zones:[
    {n:'吧台 · 招财猫',d:'金哥坐在吧台垫子上，门外塞进毛线球时它会招手',x:2,y:32,w:84,h:52},
    {n:'门口 · 投递口',d:'人类在门外把毛线球塞进投递口，门铃叮一声',x:90,y:4,w:36,h:54},
    {n:'毛线篮',d:'待解的毛线球。最上面那颗挂着人类写的便签',x:124,y:38,w:36,h:34},
    {n:'橱窗',d:'织好的小物件挂在这里，人类取走时窗外飘起一颗心',x:160,y:2,w:80,h:44},
    {n:'黑板 · 充电座',d:'今天交付了几件；扫地机器人在下面充电',x:242,y:4,w:52,h:58},
    {n:'猫爬架',d:'砚砚的地盘，中层空着可以上去趴',x:282,y:44,w:36,h:76},
    {n:'解球毯',d:'NPC 猫叼着毛线球来这里解，玩家在哪都能解',x:112,y:106,w:96,h:36},
    {n:'鱼缸',d:'看鱼，眼睛跟着鱼转；忍不住会伸爪',x:2,y:90,w:32,h:36},
    {n:'饭碗 · 喂食器',d:'没有人类，只好自动出粮',x:2,y:144,w:42,h:34},
    {n:'纸箱 · 猫薄荷',d:'钻进去就是"勿扰"；旁边的猫薄荷鱼闻了会晕',x:52,y:148,w:58,h:28},
    {n:'沙发',d:'宪宪的地盘，挤一挤也能睡',x:232,y:136,w:84,h:40}],
  lights:[{x:199,y:24,r:44,col:'#ffb070',when:'dusk'},{x:199,y:22,r:34,col:'#9fb4ff',when:'night',a:.6},{x:80,y:19,r:18,col:'#ff5a8a',when:'night'},
    {x:307,y:134,r:36,col:'#ffcf70'},{x:18,y:104,r:22,col:'#8fe0ff',when:'night'},{x:19,y:45,r:12,col:'#ffcf70',when:'night'},{x:109,y:20,r:12,col:'#ffcf70',when:'night',a:.6}],
  // 家具占地（猫和扫地机器人的脚底不能进入）
  BLOCK:[[4,54,80,26],[126,56,32,12],[256,46,14,8],[284,50,32,66],[4,112,28,13],[4,154,38,22],[56,160,26,10],[236,150,60,20],[302,162,10,6]],
  draw(t,S){const P=this.P,tod=S.tod||'day',wx=S.weather||'sun',now=S.now??t;
    wall(0,0,320,50,'cream');floorWood(0,50,320,130);bunting(0,320,1);
    shelf(8,22,50);neon(70,14,'OPEN','#ff7a9a',t);clock(304,18,t);plant(81,32,t,S.plantShake>0);
    door(P.door.x,P.door.y,t,{ring:S.door&&S.door.ring>0,flap:S.door&&S.door.flap>0,tod});mat(96,50,28);
    const W=P.window,Ln=P.line;
    windowW(W.x,W.y,W.w,W.h,t,tod,{weather:wx,cross:0,inside:()=>{if(S.bird)bird(S.bird.x,W.y+W.h-4,t,S.bird);clothesline(Ln.x,Ln.y,Ln.w,S.line||[])}});curtains(W.x,W.y,W.w,W.h);
    chalkboard(246,8,44,30,S.goal>0?[['GOAL!',4,'#f4a6b8'],[String(S.count),11,'#ffd84a',2],['THANKS',23]]:[['CAT CAFE',4],['1024',11,'#ffd84a',2],['TODAY '+String(S.count||0).padStart(2,'0'),23,'#f4a6b8']]);
    if(S.goal>0){spark(248,10,t);spark(288,36,t+.3);spark(289,9,t+.6)}
    if(wx==='sun')sunbeam(170,50,58,50,30,t,tod);
    rugOval(P.rug.x,P.rug.y,44,15,'#8cc4b0','#6aa490');
    const V=S.vac||{x:P.vacHome.x,y:P.vacHome.y,dir:-1},F=S.feed||{},L=[
      [80,()=>{counter(4,54,80);coffeeMachine(10,37,t,S.brew>0);cushion(52,56,22)}],
      [68,()=>yarnBasket(P.basket.x,P.basket.y,(S.inbox||[]).map(y=>y.ci??y),t)],
      [53,()=>dock(P.dock.x,P.dock.y,t,V.charging)],
      [116,()=>catTree(284,46,t)],
      [124,()=>fishTank(P.tank.x,P.tank.y,t,{paw:S.fishPaw>0})],
      [162,()=>feeder(P.feed.x,P.feed.y,t,F)],[170,()=>feedBowls(P.feed.x,P.feed.y,t,F)],
      [170,()=>cardbox(P.box.x,P.box.y,S.box?S.box.state:0,t,S.box?S.box.bi:4)],
      [171,()=>catnip(P.catnip.x,P.catnip.y,t,S.catnipUsed>0)],
      [170,()=>sofa(P.sofa.x,P.sofa.y,60)],[168,()=>lamp(302,130,tod!=='day')],
      [V.y,()=>vacuum(Math.round(V.x)-8,Math.round(V.y)-8,t,{dir:V.dir,moving:V.moving,led:V.led})]];
    if(S.arrive)L.push([S.arrive.y+3,()=>yarnBall(Math.round(S.arrive.x),Math.round(S.arrive.y),2,S.arrive.ci,S.arrive.spin)]);
    const over=[];
    (S.cats||[]).forEach(c=>{if(c.hidden)return;L.push([c.z??c.y,()=>{const loc=LOCAL.has(c.k)&&c.t0!=null,yi=c.yarn!=null&&c.k!=='sit'?YARN[c.yarn]:undefined;
      const P2=cat(c.k,c.b,Math.round(c.x),Math.round(c.y+(c.dy||0)),loc?now-c.t0:t,loc?0:(c.o||0),c.face||'R',c.ex,yi,c.mirror);
      const top=Math.round(c.y+(c.dy||0))-P2.G.length+(P2.dy||0);
      if(c.carry){const walk=c.k.startsWith('walk'),mx=Math.round(c.x)+(walk?(c.k==='walkL'?-7:7):0),my=walk?Math.round(c.y)-8:Math.round(c.y+(c.dy||0))-10;
        if(c.carry.kind)knit(c.carry.kind,mx,my,c.carry.ci);else if(walk)yarnBall(mx,my+2,2,c.carry.ci)}
      if(c.emote&&now<c.emoteUntil)over.push(()=>drawEmote(C,Math.round(c.x),top-2,c.emote,t));
      if(c.me)over.push(()=>meMark(Math.round(c.x),top-(c.emote&&now<c.emoteUntil?11:5)))}])});
    paint(L);
    (S.flying||[]).forEach(f=>{if(f.kind)knit(f.kind,Math.round(f.x),Math.round(f.y)-4,f.ci);else yarnBall(Math.round(f.x),Math.round(f.y),2,f.ci,Math.floor(now*8))});
    (S.puffs||[]).forEach(p=>puff(p.x,p.y,p.k));(S.hearts||[]).forEach(h=>heartUp(h.x,h.y,h.k));over.forEach(f=>f());
    applyTod(this.w,this.h,tod,this.lights)}};

// 静态样例：一屏里各个元素都在营业
function CAFE_STATE(){const P=CAFE.P;return{tod:'day',weather:'sun',count:12,inbox:[0,1,4,2],door:{ring:0,flap:0},line:[{kind:'scarf',ci:1},null,{kind:'hat',ci:0},{kind:'sock',ci:3},null],
  hearts:[],puffs:[],flying:[],vac:{x:170,y:152,dir:1,moving:1,led:'#7ee08a'},feed:{level:2,food:1},box:{state:1,bi:4},bird:{x:222,dir:-1},
  cats:[{k:'sleep',b:1,x:P.sofaSeat.x,y:P.sofaSeat.y,z:170.5},{k:'lie',b:2,x:P.treeTop.x,y:P.treeTop.y,z:116.5,o:.4},{k:'sit',b:6,x:P.counterTop.x,y:P.counterTop.y,z:80.5},
    {k:'sit',b:3,x:P.tankView.x,y:P.tankView.y,ex:'lookL'},{k:'kick',b:5,x:150,y:128,yarn:4},{k:'sit',b:0,x:196,y:98,me:1,carry:{kind:'mitten',ci:2}}]}}
