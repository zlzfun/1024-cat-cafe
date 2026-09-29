/* 1024 猫咖 · 场景 v3 地图：电脑端大店 960×540（两排、每排三间）。依赖 cat-sprites.js、scene-kit.js、world-kit.js。
   上排是店面：前厅（门、投递口、分球机、毛线篮）· 橱窗长廊（交付、爪印墙、拍照角）· 1024 工坊（键盘、CI 灯、大毛线团）；
   下排是生活区：厨房 · 大客厅 · 后院。门开在最上面那面墙上，人类永远在门外。
   WORLD = {w,h,rooms,P 点位,WALK 可走区域,BLOCK 家具占地,lights 夜灯,bg() 静态底图,wall() 会动的墙面,floor() 地面贴花,props 和猫一起排序的家具,over() 盖在猫上面的}
   S 是场景状态，由 world-play.js 维护；这里只读。 */
const WROOMS=[
  {id:'hall',n:'前厅',x:0,y:0,w:320,h:250,d:'门上的投递口、分球机和三个毛线篮；金哥在吧台上招手；新上线的猫从入场纸箱里钻出来'},
  {id:'gallery',n:'橱窗长廊',x:320,y:0,w:320,h:250,d:'两扇橱窗十四个夹子，交付在这里；爪印墙、拍照角、解球毯'},
  {id:'lab',n:'1024 工坊',x:640,y:0,w:320,h:250,d:'踩键盘、CI 灯、调试鸭、打印机和纸团、服务器机柜；大毛线团滚到这里合力解'},
  {id:'kitchen',n:'厨房',x:0,y:250,w:320,h:290,d:'两台喂食器、流水饮水机、零食机（三只猫一起踩）、鱼缸、摆着小东西的桌子'},
  {id:'lounge',n:'大客厅',x:320,y:250,w:320,h:290,d:'暖桌、壁炉、地板钢琴、高爬架、泡泡机、隧道、激光点、沙发'},
  {id:'yard',n:'后院',x:640,y:250,w:320,h:290,d:'枫树和落叶堆、鸟浴盆、蝴蝶、跑轮发电的串灯、吊床'}];
const WP={
  // 前厅
  door:{x:136,y:16},slot:{x:147,y:37},drop:{x:147,y:60},sorter:{x:164,y:24},suckIn:{x:166,y:61},chute:{x:178,y:54},knock:{x:128,y:66},
  baskets:[{x:48,y:112},{x:122,y:130},{x:196,y:112}],xl:{x:110,y:42},xlOut:{x:120,y:66},
  counterTop:{x:73,y:66,z:86.5},counterFloor:{x:104,y:96},post:{x:284,y:64},postAt:{x:268,y:108},
  bigBox:{x:16,y:198},bigBoxAt:{x:36,y:228},bed:{x:104,y:212},bedAt:{x:121,y:232},spawn:{x:262,y:214},spawnIn:{x:277,y:228},spawnOut:{x:277,y:246},
  // 橱窗长廊
  wins:[{x:338,y:6,w:110,h:40},{x:474,y:6,w:110,h:40}],lines:[{x:343,y:12,w:100},{x:479,y:12,w:100}],sillY:48,hangY:64,
  aBoard:{x:450,y:56},paw:{x:592,y:8,w:38,h:40},ink:{x:600,y:60},inkAt:{x:610,y:72},
  backdrop:{x:560,y:118,w:64,h:40},stage:[{x:568,y:172},{x:580,y:173},{x:592,y:172},{x:604,y:173},{x:616,y:172}],cam:{x:584,y:196},camAt:{x:592,y:234},shot:{x:548,y:106,w:88,h:80},
  rugs:[{x:400,y:150},{x:500,y:196}],sunA:{x:396,y:92},
  // 1024 工坊
  desk:{x:650,y:62,w:120},mons:[{x:656,y:43},{x:692,y:43},{x:728,y:43}],kbds:[{x:659,y:68},{x:695,y:68},{x:731,y:68}],kbdFloor:[{x:670,y:100},{x:706,y:100},{x:742,y:100}],
  duck:{x:756,y:64},duckAt:{x:760,y:100},printer:{x:784,y:56},paperOut:{x:798,y:98},trash:{x:900,y:118},hoop:{x:907,y:124},
  rack:{x:916,y:24},rackTop:{x:931,y:28,z:88.5},rackFloor:{x:926,y:100},ci:{x:700,y:8},dockA:{x:872,y:46},vacHomeA:{x:878,y:66},
  giant:{x:820,y:192},beanbag:{x:680,y:196},beanSeat:{x:694,y:208,z:214.5},
  // 厨房
  feeds:[{x:44,y:300},{x:104,y:300}],fountain:{x:212,y:316},drinkAt:{x:202,y:338},treat:{x:262,y:250},plates:[{x:248,y:318},{x:266,y:318},{x:284,y:318}],
  table:{x:70,y:440,w:56},tank:{x:8,y:390},tankView:{x:48,y:426},grass:{x:270,y:370},grassAt:{x:262,y:394},
  // 大客厅
  kotatsu:{x:440,y:356},fire:{x:512,y:258},fireSpots:[{x:526,y:320},{x:542,y:322},{x:558,y:320}],sofa:{x:340,y:478},sofaSeats:[{x:356,y:497},{x:374,y:497},{x:392,y:497}],
  piano:{x:500,y:500},tree:{x:570,y:300},bubbler:{x:350,y:392},tunnel:{x:430,y:452},tunnelL:{x:424,y:464},tunnelR:{x:500,y:464},
  laser:{x:342,y:251},laserAt:{x:376,y:318},catnip:{x:416,y:498},sniff:{x:432,y:508},dockB:{x:440,y:290},vacHomeB:{x:446,y:312},sunB:{x:596,y:330},lamp:{x:420,y:452},
  // 后院
  maple:{x:900,y:396},pile:{x:872,y:446},bath:{x:690,y:330},flowers:{x:650,y:300,w:120},wheel:{x:720,y:430},hammock:{x:850,y:480}};
const WORLD={w:960,h:540,rooms:WROOMS,P:WP,
  WALK:[[8,58,944,190],[8,306,304,230],[328,306,304,230],[648,306,300,214],[156,240,32,72],[464,240,32,72],[804,240,32,72],[306,404,32,36],[626,396,32,36]],
  BLOCK:[[6,60,90,26],[162,56,28,8],[48,118,28,12],[122,136,28,12],[196,118,28,12],[286,98,12,8],[16,202,40,14],[106,214,30,8],[262,220,30,14],[308,206,18,44],[628,206,18,44],
    [451,78,22,6],[562,156,60,8],[584,220,16,6],
    [650,62,120,32],[784,80,28,10],[900,128,14,6],[916,80,30,8],[682,204,26,10],[872,50,12,8],
    [8,296,28,10],[42,314,40,16],[102,314,40,16],[212,324,22,8],[262,296,36,10],[8,406,28,14],[70,448,56,20],[270,380,12,8],
    [330,296,36,8],[440,292,12,10],[509,296,64,6],[440,364,72,26],[570,414,44,10],[340,488,70,20],[350,398,18,8],[434,456,54,14],[420,484,10,6],
    [650,300,120,12],[694,344,14,8],[892,390,16,8],[724,472,40,8],[850,508,4,6],[910,508,4,6]],
  openings:[[152,40],[460,40],[800,40]],
  lights:[{x:393,y:26,r:52,col:'#ffb070',when:'dusk'},{x:529,y:26,r:52,col:'#ffb070',when:'dusk'},{x:393,y:26,r:40,col:'#9fb4ff',when:'night',a:.6},{x:529,y:26,r:40,col:'#9fb4ff',when:'night',a:.6},
    {x:80,y:15,r:18,col:'#ff5a8a',when:'night'},{x:674,y:16,r:24,col:'#7ee08a',when:'night'},{x:670,y:52,r:14,col:'#8fc8f0',when:'night'},{x:706,y:52,r:14,col:'#8fc8f0',when:'night'},{x:742,y:52,r:14,col:'#8fc8f0',when:'night'},
    {x:931,y:56,r:18,col:'#7ee08a',when:'night',a:.7},{x:541,y:292,r:56,col:'#ffa050'},{x:425,y:458,r:36,col:'#ffcf70',when:'night'},{x:22,y:398,r:22,col:'#8fe0ff',when:'night'},
    {x:280,y:278,r:18,col:'#d0a0ff',when:'night'},{x:147,y:24,r:12,col:'#ffcf70',when:'night',a:.6},{x:21,y:52,r:12,col:'#ffcf70',when:'night'},{x:66,y:275,r:30,col:'#ffb070',when:'dusk'},{x:604,y:276,r:34,col:'#ffb070',when:'dusk'}],
  // 静态底图：墙、地面、隔墙、门洞，以及靠墙、不会动、猫也绕不到后面去的东西
  bg(){const P=this.P;
    wall(0,0,320,56,'cream');wall(320,0,320,56,'butter');wall(640,0,320,56,'navy');floorWood(0,56,960,194);
    wallTop(0,250,960,6);wall(0,256,316,44,'mint');wall(324,256,312,44,'pink');brickWall(644,256,316,44);
    floorTile2(0,300,316,240);floorWood(324,300,312,240);floorGrass(644,300,316,240);
    ivy(660,258,26);ivy(700,258,14);ivy(760,258,30);ivy(868,258,20);ivy(940,258,34);
    // 门洞：地面接过去，两边门框
    [[152,40,'wood','tile'],[460,40,'wood','wood'],[800,40,'wood','grass']].forEach(([x,w,a,b])=>{floorWood(x,250,w,28);if(b==='tile')floorTile2(x,278,w,22);else if(b==='grass'){R(x,278,w,22,'#9a8a78');for(let j=0;j<3;j++)R(x+2,280+j*7,w-4,5,j%2?'#b4aa9a':'#cfc6b8')}else floorWood(x,278,w,22);
      jamb(x-3,250,50);jamb(x+w,250,50);R(x,250,w,1,'#8a5a3a')});
    // 下排的竖隔墙（开一个门洞），墙头 + 端面
    [[316,[[256,400],[444,540]],'#c2dfca'],[636,[[256,392],[436,540]],'#b4654f']].forEach(([x,segs,face])=>segs.forEach(([a,b])=>{wallTop(x,a,8,b-a);if(b<540){R(x,b,8,8,face);R(x,b+6,8,2,'#4a2e22')}}));
    floorWood(316,408,8,36);R(316,408,1,36,'#a86e44');R(636,400,8,36,'#b4aa9a');for(let j=402;j<436;j+=6)R(637,j,6,1,'#cfc6b8');   // 竖隔墙上的门洞：客厅这边是木地板，通后院的是一道石门槛
    R(0,538,960,2,'#4a2e22');
    // 上排：墙上的东西
    bunting(0,960,1,80);shelf(8,26,50);hooks(262,28,[{kind:'hat',ci:0},{kind:'scarf',ci:1},{kind:'mitten',ci:3},{kind:'sock',ci:4}]);pillar(315,0,56);pillar(635,0,56);
    counter(6,60,90);cushion(62,62,22);mat(132,56,30);whiteboard(824,6,64,34);
    // 下排：墙上的东西
    canShelf(96,282,4);fridge(8,248);
    bookshelf(330,258);[[372,264,1],[392,264,2],[412,264,6],[432,264,3]].forEach(([x,y,b])=>frame(x,y,18,18,(ix,iy)=>cat('sit',b,ix+7,iy+19,0)));
    flowerBed(P.flowers.x,P.flowers.y,P.flowers.w);fenceV(954,300,222);stones([[820,314],[815,330],[821,346],[816,362]]);
    rugOval(476,382,62,22,'#e8c0a0','#c89878');rugRect(784,168,72,44,'#8a93a8','#6b7480');
    rugOval(P.rugs[0].x,P.rugs[0].y,44,15,'#8cc4b0','#6aa490');rugOval(P.rugs[1].x,P.rugs[1].y,40,13,'#f4c8a0','#d8a878');inkPad(P.ink.x,P.ink.y)},
  // 墙面上会动的：窗外天色、霓虹、钟、咖啡机、壁炉、CI 灯
  wall(t,S,vis){const P=this.P,tod=S.tod||'day',wx=S.weather||'sun';
    if(vis(0,0,320,70)){neon(68,10,'OPEN','#ff7a9a',t);clock(290,14,t);coffeeMachine(12,43,t,S.brew>0);plant(98,32,t,S.plantShake>0);
      door(P.door.x,P.door.y,t,{ring:S.door&&S.door.ring>0,flap:S.door&&S.door.flap>0,tod});xlHatch(P.xl.x,P.xl.y,S.xl>0);corkboard(196,8,60,36,S.pending||0)}
    if(vis(320,0,320,60)){P.wins.forEach((W,k)=>{const Ln=P.lines[k],b=(S.birds||[])[k];windowW(W.x,W.y,W.w,W.h,t,tod,{weather:wx,cross:0,inside:()=>{if(b)bird(b.x,W.y+W.h-4,t,b);clothesline(Ln.x,Ln.y,Ln.w,(S.lines||[])[k]||[],7)}});curtains(W.x,W.y,W.w,W.h)});
      pawWall(P.paw.x,P.paw.y,P.paw.w,P.paw.h,S.paws||[]);if(S.banner>0)banner(340,1,242,t)}
    if(vis(640,0,320,60)){neon(656,8,'1024','#7ee08a',t,2);ciLight(P.ci.x,P.ci.y,t,(S.ci||{}).state||'pass')}
    if(vis(0,256,320,50))windowW(44,262,44,26,t,tod,{weather:wx,cross:1});
    if(vis(324,256,312,50)){windowW(582,262,44,28,t,tod,{weather:wx,cross:1});fireplace(P.fire.x,P.fire.y,t);laserBox(P.laser.x,P.laser.y,t,S.laser&&S.laser.on)}},
  // 地面贴花：猫永远在它上面
  floor(t,S,vis){const P=this.P,tod=S.tod||'day',sun=(S.weather||'sun')==='sun';
    if(sun&&vis(330,50,280,120)){sunbeam(342,50,100,70,30,t,tod);sunbeam(478,50,100,70,30,t,tod)}
    if(vis(240,310,70,20))P.plates.forEach((p,i)=>pawPlate(p.x,p.y,(S.plates||[])[i]));
    if(sun&&vis(560,296,70,80))sunbeam(566,300,52,60,26,t,tod);
    if(vis(500,500,98,24))floorPiano(P.piano.x,P.piano.y,S.piano||[])},
  over(t,S,vis){const wx=S.weather||'sun';
    if(wx!=='sun'&&vis(644,256,316,284)){const night=S.tod==='night';   // 后院在屋外：雨和雪直接落在地上
      if(wx==='rain'){const col=night?'#6a7ab0':'#dfe8f4';for(let i=0;i<170;i++){const x=646+(i*37+Math.floor(t*30))%312,y=258+(i*53+Math.floor(t*150))%280;R(x,y,1,3,col)}}
      else for(let i=0;i<140;i++)P1(646+((i*29+Math.floor(t*6+Math.sin(t*1.3+i)*3))%312+312)%312,258+(i*41+Math.floor(t*16))%280,'#ffffff')}
    if(vis(644,280,316,40))stringLights(650,950,290,t,S.power||0,12)}};
// 大毛线团解开后织成的横幅，挂在两扇橱窗上沿
function banner(x,y,w,t){for(let i=0;i<w;i++)P1(x+i,y+Math.round(Math.sin(i/w*Math.PI)*3),'#8a5a3a');
  for(let i=4;i<w-4;i+=10){const s=y+Math.round(Math.sin(i/w*Math.PI)*3)+1,ci=Math.floor(i/10)%5;R(x+i-1,s,9,9,OL);R(x+i,s+1,7,7,YARN[ci][0]);R(x+i,s+7,7,1,YARN[ci][1])}
  const s='THANK YOU 1024',tw=txtW(s),sx=x+Math.floor((w-tw)/2);R(sx-3,y+11,tw+6,9,OL);R(sx-2,y+12,tw+4,7,'#fff8e0');txt(s,sx,y+13,'#e0533d');if(Math.floor(t*3)%2){spark(x+6,y+14,t);spark(x+w-6,y+14,t)}}
// 和猫一起按 base 排序的家具；live 的每帧画，其余画一次缓存（ver 变了再重画）
const WPROPS=(()=>{const P=WP,L=[];const add=(x,y,w,h,base,draw,o={})=>L.push({x,y,w,h,base,draw,...o});
  add(P.sorter.x-3,P.sorter.y-2,32,44,P.sorter.y+40,(t,S)=>{const s=S.sorter||{};sorter(P.sorter.x,P.sorter.y,t,{balls:(s.balls||[]).map(b=>b.ci??b),pop:s.pop,suck:s.suck})},{live:1});
  P.baskets.forEach((b,i)=>add(b.x-3,b.y-14,40,34,b.y+18,(t,S)=>yarnBasket(b.x,b.y,((S.baskets||[])[i]||[]).map(y=>y.ci??y),t),{live:1}));
  add(P.post.x,P.post.y,18,44,P.post.y+42,(t,S)=>scratchPost(P.post.x,P.post.y,t,S.scratch>0),{live:1});
  add(P.bigBox.x-4,P.bigBox.y,48,8,P.bigBox.y+3,()=>bigBoxBack(P.bigBox.x,P.bigBox.y));add(P.bigBox.x-4,P.bigBox.y+4,48,16,P.bigBox.y+18,()=>bigBoxFront(P.bigBox.x,P.bigBox.y));
  add(P.bed.x,P.bed.y,34,12,P.bed.y+2,()=>catBedBack(P.bed.x,P.bed.y));add(P.bed.x,P.bed.y+4,34,8,P.bed.y+12,()=>catBedFront(P.bed.x,P.bed.y));
  add(P.spawn.x-6,P.spawn.y-2,42,22,P.spawn.y+20,(t,S)=>welcomeBox(P.spawn.x,P.spawn.y,t,S.spawnPop||0),{live:1});
  [[310,196],[310,222],[630,196],[630,222]].forEach(([x,y])=>add(x,y,16,26,y+24,t=>plant(x,y,t)));
  add(P.aBoard.x,P.aBoard.y,26,28,P.aBoard.y+28,(t,S)=>{const n=String(S.count||0);aBoard(P.aBoard.x,P.aBoard.y,[['TODAY',4],[n,10,'#ffd84a',n.length>2?1:2]])},{ver:S=>S.count||0});
  add(P.backdrop.x,P.backdrop.y-2,P.backdrop.w,P.backdrop.h+8,P.backdrop.y+P.backdrop.h+6,t=>backdrop(P.backdrop.x,P.backdrop.y,P.backdrop.w,P.backdrop.h,t),{live:1});
  add(P.cam.x,P.cam.y-4,16,34,P.cam.y+30,(t,S)=>camBack(P.cam.x,P.cam.y,t,S.cam||{}),{live:1});
  add(P.desk.x,P.mons[0].y,P.desk.w,52,P.desk.y+32,(t,S)=>{desk(P.desk.x,P.desk.y,P.desk.w);const ci=S.ci||{},kb=S.kbd||[];
    P.mons.forEach((m,i)=>monitor(m.x,m.y,t,{mode:kb[i]?'type':ci.state==='pass'&&ci.glow>0?'pass':'code',seed:i*7}));P.kbds.forEach((k,i)=>keyboard(k.x,k.y,t,kb[i]));if(!S.duckGone)duck(P.duck.x,P.duck.y)},{live:1});
  add(P.printer.x,P.printer.y,28,34,P.printer.y+34,(t,S)=>printer(P.printer.x,P.printer.y,t,S.print||0),{live:1});
  add(P.trash.x,P.trash.y,14,16,P.trash.y+16,()=>trashCan(P.trash.x,P.trash.y));
  add(P.rack.x,P.rack.y,30,64,P.rack.y+64,(t,S)=>serverRack(P.rack.x,P.rack.y,t,(S.kbd||[]).some(Boolean)),{live:1});
  add(P.beanbag.x,P.beanbag.y,30,18,P.beanbag.y+18,()=>beanbag(P.beanbag.x,P.beanbag.y));
  add(P.dockA.x-1,P.dockA.y,14,11,P.dockA.y+11,(t,S)=>dock(P.dockA.x,P.dockA.y,t,((S.vacs||[])[0]||{}).charging),{live:1});
  add(P.dockB.x-1,P.dockB.y,14,11,P.dockB.y+11,(t,S)=>dock(P.dockB.x,P.dockB.y,t,((S.vacs||[])[1]||{}).charging),{live:1});
  P.feeds.forEach((f,i)=>{add(f.x,f.y,14,26,f.y+22,(t,S)=>feeder(f.x,f.y,t,(S.feeds||[])[i]||{}),{live:1});add(f.x-2,f.y+22,40,8,f.y+30,(t,S)=>feedBowls(f.x,f.y,t,(S.feeds||[])[i]||{}),{live:1})});
  add(P.fountain.x,P.fountain.y,22,16,P.fountain.y+16,t=>fountain(P.fountain.x,P.fountain.y,t),{live:1});
  add(P.treat.x,P.treat.y,36,56,P.treat.y+56,(t,S)=>treatMachine(P.treat.x,P.treat.y,t,S.treat||{}),{live:1});
  add(P.tank.x,P.tank.y-1,28,31,P.tank.y+30,(t,S)=>fishTank(P.tank.x,P.tank.y,t,{paw:S.fishPaw>0}),{live:1});
  add(P.table.x,P.table.y-8,P.table.w,36,P.table.y+28,(t,S)=>{cafeTable(P.table.x,P.table.y,P.table.w);(S.toys||[]).forEach(o=>{if(o.on)toy(o.kind,o.tx,P.table.y+5)})},{ver:S=>(S.toys||[]).map(o=>o.on?1:0).join('')});
  add(P.grass.x,P.grass.y,12,17,P.grass.y+17,(t,S)=>catGrass(P.grass.x,P.grass.y,t,S.grassChew>0),{live:1});
  add(P.kotatsu.x,P.kotatsu.y-6,72,48,P.kotatsu.y+34,(t,S)=>kotatsu(P.kotatsu.x,P.kotatsu.y,t,(S.kotatsu||{}).tails||[],(S.kotatsu||{}).jig||0),{live:1});
  add(P.tree.x,P.tree.y,48,124,P.tree.y+124,t=>catTreeTall(P.tree.x,P.tree.y,t),{live:1});
  add(P.sofa.x,P.sofa.y,70,30,P.sofa.y+30,()=>sofa(P.sofa.x,P.sofa.y,70));
  add(P.lamp.x,P.lamp.y,10,38,P.lamp.y+38,(t,S)=>lamp(P.lamp.x,P.lamp.y,S.tod!=='day'),{ver:S=>S.tod});
  add(P.bubbler.x,P.bubbler.y,18,14,P.bubbler.y+14,(t,S)=>bubbleMachine(P.bubbler.x,P.bubbler.y,t,S.bubbleOn>0),{live:1});
  add(P.tunnel.x,P.tunnel.y-2,62,20,P.tunnel.y+18,(t,S)=>tunnel(P.tunnel.x,P.tunnel.y,t,S.tunnelBulge??-1),{live:1});
  add(P.catnip.x,P.catnip.y-12,11,17,P.catnip.y+5,(t,S)=>catnip(P.catnip.x,P.catnip.y,t,S.catnipUsed>0),{live:1});
  add(P.maple.x-40,P.maple.y-92,80,92,P.maple.y,t=>maple(P.maple.x,P.maple.y,t),{live:1});
  add(P.pile.x-20,P.pile.y-12,40,12,P.pile.y-4,(t,S)=>leafPile(P.pile.x,P.pile.y,S.pile??1),{ver:S=>Math.round((S.pile??1)*20)});
  add(P.bath.x,P.bath.y,22,22,P.bath.y+22,()=>birdBath(P.bath.x,P.bath.y));
  add(P.wheel.x,P.wheel.y,48,50,P.wheel.y+50,(t,S)=>catWheel(P.wheel.x,P.wheel.y,S.wheelA||0),{live:1});
  add(P.hammock.x,P.hammock.y,64,34,P.hammock.y+6,(t,S)=>hammockBack(P.hammock.x,P.hammock.y,S.hamSw||0),{live:1});add(P.hammock.x,P.hammock.y+10,64,24,P.hammock.y+30,(t,S)=>hammockFront(P.hammock.x,P.hammock.y,S.hamSw||0),{live:1});
  add(644,520,316,20,540,()=>fenceH(644,522,316));
  return L})();
WORLD.props=WPROPS;
