/* 1024 猫咖 · 地图：整张图 1680×540，毛线巨树在正中间。依赖 cat-sprites.js、scene-kit.js、world-kit.js。
   这个文件管左边两列和工坊、后院六间房（点位、可走区域、家具、夜灯和画法），坐标都是最终位置：
     上排：前厅（0～320）· 橱窗长廊（320～640）| 巨树中庭 | 1024 工坊（1040～1360）
     下排：厨房（0～320）· 大客厅（320～640）  |（640～1040）| 后院（1040～1360）
   巨树中庭在 world4-atrium.js，最右边一列（图书馆、花园小径）在 world4-map.js，它们往 WORLD 里接着加。
   门开在前厅最上面那面墙上，人类永远在门外。橱窗长廊、大客厅、工坊各开一道门通中庭；后院和中庭之间不砌墙，草地连成一片。
   WORLD = {w,h,rooms,P 点位,WALK 可走区域,BLOCK 家具占地,lights 夜灯,bg() 静态底图,wall() 会动的墙面,floor() 地面贴花,props 和猫一起排序的家具,over() 盖在猫上面的}
   S 是场景状态，由 world-play.js 维护；这里只读。 */
const WROOMS=[
  {id:'hall',n:'前厅',x:0,y:0,w:320,h:250,d:'门上的投递口、分球机和三个毛线篮；金哥在吧台上招手；新上线的猫从入场纸箱里钻出来'},
  {id:'gallery',n:'橱窗长廊',x:320,y:0,w:320,h:250,d:'两扇橱窗十四个夹子，交付在这里；爪印墙、拍照角、解球毯'},
  {id:'lab',n:'1024 工坊',x:1040,y:0,w:320,h:250,d:'踩键盘、CI 灯、调试鸭、打印机和纸团、服务器机柜；大毛线团滚到这里合力解'},
  {id:'kitchen',n:'厨房',x:0,y:250,w:320,h:290,d:'两台喂食器、流水饮水机、零食机（三只猫一起踩）、鱼缸、摆着小东西的桌子'},
  {id:'lounge',n:'大客厅',x:320,y:250,w:320,h:290,d:'暖桌、壁炉、地板钢琴、高爬架、泡泡机、隧道、激光点、沙发'},
  {id:'yard',n:'后院',x:1040,y:250,w:320,h:290,d:'枫树和落叶堆、鸟浴盆、蝴蝶、跑轮发电的串灯、吊床'}];
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
  desk:{x:1050,y:62,w:120},mons:[{x:1056,y:43},{x:1092,y:43},{x:1128,y:43}],kbds:[{x:1059,y:68},{x:1095,y:68},{x:1131,y:68}],kbdFloor:[{x:1070,y:100},{x:1106,y:100},{x:1142,y:100}],
  duck:{x:1156,y:64},duckAt:{x:1160,y:100},printer:{x:1184,y:56},paperOut:{x:1198,y:98},trash:{x:1300,y:118},hoop:{x:1307,y:124},
  rack:{x:1316,y:24},rackTop:{x:1331,y:28,z:88.5},rackFloor:{x:1326,y:100},ci:{x:1100,y:8},dockA:{x:1272,y:46},vacHomeA:{x:1278,y:66},
  giant:{x:1220,y:192},beanbag:{x:1080,y:196},beanSeat:{x:1094,y:208,z:214.5},
  // 厨房
  feeds:[{x:44,y:300},{x:104,y:300}],fountain:{x:212,y:316},drinkAt:{x:202,y:338},treat:{x:262,y:250},plates:[{x:248,y:318},{x:266,y:318},{x:284,y:318}],
  table:{x:70,y:440,w:56},tank:{x:8,y:390},tankView:{x:48,y:426},grass:{x:270,y:370},grassAt:{x:262,y:394},
  // 大客厅
  kotatsu:{x:440,y:356},fire:{x:512,y:258},fireSpots:[{x:526,y:320},{x:542,y:322},{x:558,y:320}],sofa:{x:340,y:478},sofaSeats:[{x:356,y:497},{x:374,y:497},{x:392,y:497}],
  piano:{x:500,y:500},tree:{x:570,y:300},bubbler:{x:350,y:392},tunnel:{x:430,y:452},tunnelL:{x:424,y:464},tunnelR:{x:500,y:464},
  laser:{x:342,y:251},laserAt:{x:376,y:318},catnip:{x:416,y:498},sniff:{x:432,y:508},dockB:{x:440,y:290},vacHomeB:{x:446,y:312},sunB:{x:596,y:330},lamp:{x:420,y:452},
  // 后院
  maple:{x:1300,y:396},pile:{x:1272,y:446},bath:{x:1090,y:330},flowers:{x:1050,y:300,w:120},wheel:{x:1120,y:430},hammock:{x:1250,y:480},
  // 蝴蝶飞的范围（后院连着巨树中庭）、后院串灯的两头、大毛线团从门口滚到工坊的路线
  flyArea:[680,300,660,220],yardLights:{x0:1050,x1:1350},
  giantPath:[{x:150,y:92},{x:300,y:160},{x:470,y:170},{x:600,y:214},{x:700,y:212},{x:980,y:212},{x:1080,y:204}]};
const WORLD={w:1680,h:540,rooms:WROOMS,P:WP,
  // 可走区域。下标有人用：0 是工坊（扫地机器人 A 只在这一块里转，它的充电座在工坊），1、2、7 是厨房、大客厅和它们之间的门洞（扫地机器人 B）
  WALK:[[1044,58,308,190],[8,306,304,230],[328,306,304,230],[1048,306,300,214],[156,240,32,72],[464,240,32,72],[1204,240,32,72],[306,404,32,36],[626,396,24,36],
    [8,58,628,190]],   // 8：大客厅右墙通中庭的门洞；9：上排左边（前厅 + 橱窗长廊）
  BLOCK:[[6,60,90,26],[162,56,28,8],[48,118,28,12],[122,136,28,12],[196,118,28,12],[286,98,12,8],[16,202,40,14],[106,214,30,8],[262,220,30,14],[308,206,18,44],
    [451,78,22,6],[562,156,60,8],[584,220,16,6],
    [1050,62,120,32],[1184,80,28,10],[1300,128,14,6],[1316,80,30,8],[1082,204,26,10],[1272,50,12,8],
    [8,296,28,10],[42,314,40,16],[102,314,40,16],[212,324,22,8],[262,296,36,10],[8,406,28,14],[70,448,56,20],[270,380,12,8],
    [330,296,36,8],[440,292,12,10],[509,296,64,6],[440,364,72,26],[570,414,44,10],[340,488,70,20],[350,398,18,8],[434,456,54,14],[420,484,10,6],
    [1050,300,120,12],[1094,344,14,8],[1292,390,16,8],[1124,472,40,8],[1250,508,4,6],[1310,508,4,6]],
  openings:[[152,40],[460,40],[1200,40]],
  lights:[{x:393,y:26,r:52,col:'#ffb070',when:'dusk'},{x:529,y:26,r:52,col:'#ffb070',when:'dusk'},{x:393,y:26,r:40,col:'#9fb4ff',when:'night',a:.6},{x:529,y:26,r:40,col:'#9fb4ff',when:'night',a:.6},
    {x:80,y:15,r:18,col:'#ff5a8a',when:'night'},{x:1074,y:16,r:24,col:'#7ee08a',when:'night'},{x:1070,y:52,r:14,col:'#8fc8f0',when:'night'},{x:1106,y:52,r:14,col:'#8fc8f0',when:'night'},{x:1142,y:52,r:14,col:'#8fc8f0',when:'night'},
    {x:1331,y:56,r:18,col:'#7ee08a',when:'night',a:.7},{x:541,y:292,r:56,col:'#ffa050'},{x:425,y:458,r:36,col:'#ffcf70',when:'night'},{x:22,y:398,r:22,col:'#8fe0ff',when:'night'},
    {x:280,y:278,r:18,col:'#d0a0ff',when:'night'},{x:147,y:24,r:12,col:'#ffcf70',when:'night',a:.6},{x:21,y:52,r:12,col:'#ffcf70',when:'night'},{x:66,y:275,r:30,col:'#ffb070',when:'dusk'},{x:604,y:276,r:34,col:'#ffb070',when:'dusk'}],
  // 静态底图：墙、地面、隔墙、门洞，以及靠墙、不会动、猫也绕不到后面去的东西
  bg(){const P=this.P;
    wall(0,0,320,56,'cream');wall(320,0,320,56,'butter');wall(1040,0,320,56,'navy');floorWood(0,56,640,194);floorWood(1040,56,320,194);
    wallTop(0,250,640,6);wallTop(1040,250,320,6);wall(0,256,316,44,'mint');wall(324,256,312,44,'pink');brickWall(1044,256,316,44);
    floorTile2(0,300,316,240);floorWood(324,300,312,240);floorGrass(1044,300,316,240);
    ivy(1060,258,26);ivy(1100,258,14);ivy(1160,258,30);ivy(1268,258,20);ivy(1340,258,34);
    // 门洞：地面接过去，两边门框
    [[152,40,'wood','tile'],[460,40,'wood','wood'],[1200,40,'wood','grass']].forEach(([x,w,a,b])=>{floorWood(x,250,w,28);if(b==='tile')floorTile2(x,278,w,22);else if(b==='grass'){R(x,278,w,22,'#9a8a78');for(let j=0;j<3;j++)R(x+2,280+j*7,w-4,5,j%2?'#b4aa9a':'#cfc6b8')}else floorWood(x,278,w,22);
      jamb(x-3,250,50);jamb(x+w,250,50);R(x,250,w,1,'#8a5a3a')});
    // 厨房和大客厅之间的竖隔墙（开一个门洞），墙头 + 端面。大客厅右边那面墙归巨树中庭画（world4-atrium.js）
    [[316,[[256,400],[444,540]],'#c2dfca']].forEach(([x,segs,face])=>segs.forEach(([a,b])=>{wallTop(x,a,8,b-a);if(b<540){R(x,b,8,8,face);R(x,b+6,8,2,'#4a2e22')}}));
    floorWood(316,408,8,36);R(316,408,1,36,'#a86e44');   // 门洞里是木地板
    R(0,538,640,2,'#4a2e22');R(1040,538,320,2,'#4a2e22');
    // 上排：墙上的东西
    bunting(0,640,1,80);bunting(1040,1360,1,80);shelf(8,26,50);hooks(262,28,[{kind:'hat',ci:0},{kind:'scarf',ci:1},{kind:'mitten',ci:3},{kind:'sock',ci:4}]);pillar(315,0,56);
    counter(6,60,90);cushion(62,62,22);mat(132,56,30);whiteboard(1224,6,64,34);
    // 下排：墙上的东西
    canShelf(96,282,4);fridge(8,248);
    bookshelf(330,258);[[372,264,1],[392,264,2],[412,264,6],[432,264,3]].forEach(([x,y,b])=>frame(x,y,18,18,(ix,iy)=>cat('sit',b,ix+7,iy+19,0)));
    flowerBed(P.flowers.x,P.flowers.y,P.flowers.w);fenceV(1354,300,222);stones([[1220,314],[1215,330],[1221,346],[1216,362]]);
    rugOval(476,382,62,22,'#e8c0a0','#c89878');rugRect(1184,168,72,44,'#8a93a8','#6b7480');
    rugOval(P.rugs[0].x,P.rugs[0].y,44,15,'#8cc4b0','#6aa490');rugOval(P.rugs[1].x,P.rugs[1].y,40,13,'#f4c8a0','#d8a878');inkPad(P.ink.x,P.ink.y)},
  // 墙面上会动的：窗外天色、霓虹、钟、咖啡机、壁炉、CI 灯
  wall(t,S,vis){const P=this.P,tod=S.tod||'day',wx=S.weather||'sun';
    if(vis(0,0,320,70)){neon(68,10,'OPEN','#ff7a9a',t);clock(290,14,t);coffeeMachine(12,43,t,S.brew>0);plant(98,32,t,S.plantShake>0);
      door(P.door.x,P.door.y,t,{ring:S.door&&S.door.ring>0,flap:S.door&&S.door.flap>0,tod});xlHatch(P.xl.x,P.xl.y,S.xl>0);corkboard(196,8,60,36,S.pending||0)}
    if(vis(320,0,320,60)){P.wins.forEach((W,k)=>{const Ln=P.lines[k],b=(S.birds||[])[k];windowW(W.x,W.y,W.w,W.h,t,tod,{weather:wx,cross:0,inside:()=>{if(b)bird(b.x,W.y+W.h-4,t,b);clothesline(Ln.x,Ln.y,Ln.w,(S.lines||[])[k]||[],7)}});curtains(W.x,W.y,W.w,W.h)});
      pawWall(P.paw.x,P.paw.y,P.paw.w,P.paw.h,S.paws||[]);if(S.banner>0)banner(340,1,242,t)}
    if(vis(1040,0,320,60)){neon(1056,8,'1024','#7ee08a',t,2);ciLight(P.ci.x,P.ci.y,t,(S.ci||{}).state||'pass')}
    if(vis(0,256,320,50))windowW(44,262,44,26,t,tod,{weather:wx,cross:1});
    if(vis(324,256,312,50)){windowW(582,262,44,28,t,tod,{weather:wx,cross:1});fireplace(P.fire.x,P.fire.y,t);laserBox(P.laser.x,P.laser.y,t,S.laser&&S.laser.on)}},
  // 地面贴花：猫永远在它上面
  floor(t,S,vis){const P=this.P,tod=S.tod||'day',sun=(S.weather||'sun')==='sun';
    if(sun&&vis(330,50,280,120)){sunbeam(342,50,100,70,30,t,tod);sunbeam(478,50,100,70,30,t,tod)}
    if(vis(240,310,70,20))P.plates.forEach((p,i)=>pawPlate(p.x,p.y,(S.plates||[])[i]));
    if(sun&&vis(560,296,70,80)){C.save();C.beginPath();C.rect(560,296,80,80);C.clip();sunbeam(566,300,52,60,26,t,tod);C.restore()}   // 斜着的光斑照到墙根为止
    if(vis(500,500,98,24))floorPiano(P.piano.x,P.piano.y,S.piano||[])},
  over(t,S,vis){const wx=S.weather||'sun';
    if(wx!=='sun'&&vis(1044,256,316,284)){const night=S.tod==='night';   // 后院在屋外：雨和雪直接落在地上
      if(wx==='rain'){const col=night?'#6a7ab0':'#dfe8f4';for(let i=0;i<170;i++){const x=1046+(i*37+Math.floor(t*30))%312,y=258+(i*53+Math.floor(t*150))%280;R(x,y,1,3,col)}}
      else for(let i=0;i<140;i++)P1(1046+((i*29+Math.floor(t*6+Math.sin(t*1.3+i)*3))%312+312)%312,258+(i*41+Math.floor(t*16))%280,'#ffffff')}
    if(vis(1044,280,316,40))stringLights(1050,1350,290,t,S.power||0,12)}};
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
  [[310,196],[310,222]].forEach(([x,y])=>add(x,y,16,26,y+24,t=>plant(x,y,t)));
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
  add(1044,520,316,20,540,()=>fenceH(1044,522,316));
  return L})();
WORLD.props=WPROPS;
