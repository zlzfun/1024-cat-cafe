/* 1024 猫咖 · 二楼：猫自己的房间（y 1400～1940，布局见 docs/店内设计.md 第一节）。依赖 map-1f.js（在它后面加载）。
   上排：1024 工坊 ·（巨树回廊）· 猫猫图书馆；下排：大客厅 ·（巨树回廊）· 午睡角。巨树回廊上下贯通，正中是天井；午睡角里两段楼梯：下一楼、上屋顶。
   只往 WORLD 里追加。 */
(()=>{const M=WORLD,P=WP,Y=Y2;
M.rooms.push(
  {id:'lab',f:'f2',n:'1024 工坊',x:0,y:Y,w:326,h:250,in:[16,Y+104,292,140],d:'踩键盘、CI 灯、调试鸭、打印机和纸团、砚砚的机柜；房间正中是合并门禁，测试、CI、Review 三盏灯全亮才放行'},
  {id:'well',f:'f2',n:'巨树回廊',x:326,y:Y,w:308,h:540,in:[340,Y+64,280,300],d:'地板正中开着天井，往下看得见一楼的咖啡厅；巨树从天井里长上来，六根横枝是猫猫咖啡馆的六个家族'},
  {id:'library',f:'f2',n:'猫猫图书馆',x:634,y:Y,w:326,h:250,in:[650,Y+90,290,150],d:'长期记忆：五架书（决策日志、教训沉淀、证据库、人物关系、事件记忆）、检索柜、阅读桌、说明书讲台、窗边软座'},
  {id:'lounge',f:'f2',n:'大客厅',x:0,y:Y+250,w:326,h:290,in:[16,Y+320,292,200],d:'壁炉前一张暖桌、对面的沙发、高猫爬架、地板钢琴、泡泡机、猫隧道、激光点'},
  {id:'nap',f:'f2',n:'午睡角',x:634,y:Y+250,w:326,h:290,in:[650,Y+330,120,190],d:'猫窝、大纸箱、懒人沙发，一扇晒得到太阳的窗；下一楼、上屋顶的楼梯都在这儿'});
Object.assign(P,{
  // 工坊
  desk:{x:16,y:Y+62,w:120},mons:[{x:22,y:Y+43},{x:58,y:Y+43},{x:94,y:Y+43}],kbds:[{x:25,y:Y+68},{x:61,y:Y+68},{x:97,y:Y+68}],kbdFloor:[{x:36,y:Y+100},{x:72,y:Y+100},{x:108,y:Y+100}],
  duck:{x:122,y:Y+64},duckAt:{x:126,y:Y+100},printer:{x:146,y:Y+56},paperOut:{x:160,y:Y+98},trash:{x:276,y:Y+196},hoop:{x:283,y:Y+202},
  rack:{x:288,y:Y+24},rackTop:{x:303,y:Y+28,z:Y+88.5},rackFloor:{x:298,y:Y+100},ci:{x:120,y:Y+8},tools:{x:160,y:Y+6,w:46,h:36},merge:{x:146,y:Y+108},mergeAt:{x:174,y:Y+196},lane:{x:152,y:Y+100,w:42,h:150},
  // 图书馆
  shelves:[642,692,742,792,842].map(x=>({x,y:Y+6,w:46,h:64})),ladder:{y0:Y+14,y1:Y+70,x0:717},catalog:{x:648,y:Y+112},catalogAt:{x:662,y:Y+156},readTable:{x:742,y:Y+142,w:88},
  armchair:{x:900,y:Y+152},lamp2:{x:936,y:Y+134},lectern:{x:650,y:Y+190},lecternAt:{x:660,y:Y+228},win3:{x:900,y:Y+8,w:44,h:38},winSeat:{x:896,y:Y+60,w:52},libPlant:{x:930,y:Y+204},
  // 大客厅
  kotatsu:{x:126,y:Y+364},fire:{x:132,y:Y+258},fireSpots:[{x:146,y:Y+320},{x:162,y:Y+322},{x:178,y:Y+320}],sofa:{x:128,y:Y+472},sofaSeats:[{x:144,y:Y+491},{x:162,y:Y+491},{x:180,y:Y+491}],
  piano:{x:214,y:Y+506},tree:{x:10,y:Y+300},bubbler:{x:250,y:Y+378},tunnel:{x:232,y:Y+440},tunnelL:{x:226,y:Y+452},tunnelR:{x:302,y:Y+452},
  laser:{x:28,y:Y+251},laserAt:{x:44,y:Y+318},catnip:{x:58,y:Y+502},sniff:{x:74,y:Y+512},sunB:{x:262,y:Y+318},lamp:{x:100,y:Y+422},dockA:{x:14,y:Y+520},vacHomeA:{x:20,y:Y+536},
  // 午睡角
  bed:{x:660,y:Y+330},bedAt:{x:677,y:Y+352},bigBox:{x:660,y:Y+420},bigBoxAt:{x:680,y:Y+450},beanbag:{x:722,y:Y+436},beanSeat:{x:736,y:Y+448,z:Y+454.5},sunC:{x:706,y:Y+318},
  stairs2:{x:760,y:Y+300,w:48,h:100},hole1:{x:884,y:Y+300,w:52,h:120}});
M.WALK.push([8,Y+58,318,190],[8,Y+306,318,232],[334,Y+58,292,480],[634,Y+58,318,190],[634,Y+306,318,232],
  [320,Y+118,20,52],[320,Y+398,20,52],[620,Y+118,20,52],[620,Y+398,20,52],[220,Y+246,40,62],[680,Y+246,40,62],[764,Y+296,40,12],[880,Y+298,14,10]);
M.BLOCK.push([16,Y+62,120,32],[146,Y+80,28,10],[288,Y+80,30,8],[142,Y+164,14,8],[198,Y+164,14,8],[276,Y+206,14,6],
  [642,Y+58,246,12],[896,Y+58,52,14],[648,Y+128,28,16],[742,Y+150,88,18],[900,Y+164,30,14],[938,Y+168,10,6],[652,Y+210,16,8],[930,Y+212,14,8],
  [18,Y+300,36,6],[130,Y+298,64,8],[126,Y+366,72,26],[128,Y+482,70,20],[10,Y+414,48,10],[250,Y+386,18,8],[232,Y+444,54,14],[56,Y+502,10,6],[100,Y+452,10,8],[14,Y+522,14,9],
  [660,Y+334,34,8],[660,Y+424,40,12],[722,Y+446,26,10],[756,Y+300,4,100],[808,Y+300,4,100],[894,Y+300,46,124],[874,Y+326,6,100],[874,Y+420,66,6],
  [440,Y+512,80,6],[340,Y+506,14,8],[606,Y+506,14,8]);
M.portals.push({id:'s23',from:'f2',to:'roof',n:'楼梯（上屋顶）',k:'walk',auto:1,walk:1,zone:[764,Y+298,40,16],at:{x:784,y:Y+306},dir:{x:0,y:-1},out:{x:825,y:Y3+464,face:'R'},outDir:{x:0,y:1}});
M.vac.push({home:P.vacHomeA,dock:P.dockA,area:[[16,Y+312,300,220]]});
M.lights.push({x:36,y:Y+15,r:24,col:'#7ee08a',when:'night'},{x:30,y:Y+52,r:14,col:'#8fc8f0',when:'night'},{x:66,y:Y+52,r:14,col:'#8fc8f0',when:'night'},{x:102,y:Y+52,r:14,col:'#8fc8f0',when:'night'},
  {x:128,y:Y+16,r:18,col:'#7ee08a',when:'night',a:.7},{x:303,y:Y+56,r:18,col:'#7ee08a',when:'night',a:.7},{x:176,y:Y+120,r:34,col:'#7ee08a',when:'night',a:.5},
  {x:786,y:Y+134,r:26,col:'#ffe08a',when:'night'},{x:786,y:Y+134,r:22,col:'#ffcf70',when:'dusk'},{x:941,y:Y+134,r:22,col:'#ffcf70',when:'night'},{x:922,y:Y+26,r:34,col:'#9fb4ff',when:'night',a:.6},
  {x:161,y:Y+292,r:56,col:'#ffa050'},{x:105,y:Y+428,r:36,col:'#ffcf70',when:'night'},{x:274,y:Y+276,r:30,col:'#ffb070',when:'dusk'},{x:728,y:Y+276,r:34,col:'#ffb070',when:'dusk'},{x:728,y:Y+276,r:30,col:'#9fb4ff',when:'night',a:.5},
  {x:480,y:Y+430,r:70,col:'#ffcf70',when:'night',a:.6},{x:784,y:Y+290,r:20,col:'#ffcf70',when:'night'});
const bg0=M.bg,wall0=M.wall,floor0=M.floor,over0=M.over;
M.bg=function(){bg0.call(this);
  // 北墙：工坊深蓝、回廊木护墙、图书馆书墙；两根柱子
  wall(0,Y,326,56,'navy');wallPanel(334,Y,292,56);libWall(634,Y,326,56);pillar(326,Y,56);pillar(626,Y,56);
  floorRubber(0,Y+56,326,194);floorPlanks(334,Y+56,292,484,'board',36);floorParquet(634,Y+56,326,194);
  // 回廊左右两道墙（各开两个门洞），工坊和大客厅、图书馆和午睡角之间一道横墙（开一个门洞）
  [[326,[[Y+56,Y+118],[Y+170,Y+398],[Y+450,Y+540]]],[626,[[Y+56,Y+118],[Y+170,Y+398],[Y+450,Y+540]]]].forEach(([x,segs])=>segs.forEach(([a,b])=>{wallTop(x,a,8,b-a);if(b<Y+540){R(x,b,8,6,'#e8dccb');R(x,b+5,8,1,'#4a2e22')}}));
  [[326,Y+118],[326,Y+398],[626,Y+118],[626,Y+398]].forEach(([x,y])=>floorPlanks(x,y+6,8,46,'board'));
  wallTop(0,Y+250,326,6);wall(0,Y+256,326,44,'pink');wallTop(634,Y+250,326,6);wall(634,Y+256,326,44,'lilac');
  [[220,40],[680,40]].forEach(([x,w])=>{R(x,Y+250,w,50,'#000');if(x<326){floorRubber(x,Y+250,w,28);floorPlanks(x,Y+278,w,22,'honey')}else{floorParquet(x,Y+250,w,28);floorCarpet(x,Y+278,w,22)}jamb(x-3,Y+250,50);jamb(x+w,Y+250,50);R(x,Y+250,w,1,'#8a5a3a')});
  floorPlanks(0,Y+300,326,240,'honey');floorCarpet(634,Y+300,326,240);R(0,Y+538,960,2,'#4a2e22');
  // 工坊：墙上的工具墙、白板；地上一条主干道穿过门禁
  pegboard(P.tools.x,P.tools.y,P.tools.w,P.tools.h,-1);whiteboard(222,Y+6,60,34);laneMain(P.lane.x,P.lane.y,P.lane.w,P.lane.h);
  // 图书馆：书架、窗户、阅读桌下的大地毯、扶手椅下的小地毯
  rugRect(712,Y+104,148,92,'#3f6f6a','#2e5450');rugOval(916,Y+192,34,12,'#c8a0d8','#9a78b0');
  P.shelves.forEach((s,i)=>tallShelf(s.x,s.y,s.w,s.h,SHELF_COLS[i],SHELF_EN[i]));windowW(P.win3.x,P.win3.y,P.win3.w,P.win3.h,0,'day',{cross:1});curtains(P.win3.x,P.win3.y,P.win3.w,P.win3.h,'#6a8ac8','#4a6aa8');
  // 大客厅：书架、墙上的猫相框、窗；大地毯
  bookshelf(18,Y+258);catFrames(204,Y+264,[[0,3],[20,6]]);rugOval(162,Y+394,106,38,'#e8c0a0','#c89878');rugOval(162,Y+394,84,28,'#f4d0b0','#e8c0a0');
  // 午睡角：一扇大窗、一块圆地毯；上屋顶的楼梯、下一楼的楼梯口（栏杆围着）
  rugOval(700,Y+478,64,22,'#f4c8d8','#d8a0b8');stairsUp(P.stairs2.x,P.stairs2.y,P.stairs2.w,P.stairs2.h);stairsDown(P.hole1.x,P.hole1.y,P.hole1.w,P.hole1.h);
  // 回廊：天井南边一张长凳旁的两盆花（家具在 props）；门洞上的招牌
  signOver(300,Y+104,'LAB','gear');signOver(660,Y+104,'BOOKS','book');signOver(300,Y+384,'LOUNGE','heart');signOver(660,Y+384,'NAP','moon');signOver(784,Y+262,'ROOF','up','#a8d0f0');signOver(910,Y+284,'1F','down')},
M.wall=function(t,S,vis){wall0.call(this,t,S,vis);const tod=S.tod||'day',wx=S.weather||'sun';
  if(vis(0,Y,326,60)){neon(8,Y+8,'1024','#7ee08a',t,2);ciLight(P.ci.x,P.ci.y,t,(S.ci||{}).state||'pass');if(Math.floor(t*2)%2)P1(P.tools.x+31,P.tools.y+8,'#7ee08a')}
  if(vis(634,Y,326,60)){const W=P.win3;windowW(W.x,W.y,W.w,W.h,t,tod,{weather:wx,cross:1});curtains(W.x,W.y,W.w,W.h,'#6a8ac8','#4a6aa8');(S.gaps||[]).forEach(g=>bookGap(g.x,g.y))}
  if(vis(0,Y+250,326,60)){windowW(262,Y+262,44,28,t,tod,{weather:wx,cross:1});fireplace(P.fire.x,P.fire.y,t);laserBox(P.laser.x,P.laser.y,t,S.laser&&S.laser.on)}
  if(vis(634,Y+250,326,60)){windowW(690,Y+262,56,28,t,tod,{weather:wx,cross:1});curtains(690,Y+262,56,28,'#c8a0d8','#9a78b0')}};
M.floor=function(t,S,vis){floor0.call(this,t,S,vis);const tod=S.tod||'day',sun=(S.weather||'sun')==='sun';
  if(sun&&vis(250,Y+300,80,80)){C.save();C.beginPath();C.rect(250,Y+300,76,80);C.clip();sunbeam(254,Y+300,46,56,22,t,tod);C.restore()}
  if(sun&&vis(680,Y+300,90,80)){C.save();C.beginPath();C.rect(680,Y+300,90,80);C.clip();sunbeam(688,Y+300,58,60,22,t,tod);C.restore()}
  if(vis(214,Y+500,100,30))floorPiano(P.piano.x,P.piano.y,S.piano||[])};
// 和猫一起排序的家具
const add=(x,y,w,h,base,draw,o={})=>M.props.push({x,y,w,h,base,draw,...o});
// 工坊
add(P.desk.x,P.mons[0].y,P.desk.w,52,P.desk.y+32,(t,S)=>{desk(P.desk.x,P.desk.y,P.desk.w);const ci=S.ci||{},kb=S.kbd||[];
  P.mons.forEach((m,i)=>monitor(m.x,m.y,t,{mode:kb[i]?'type':ci.state==='pass'&&ci.glow>0?'pass':'code',seed:i*7}));P.kbds.forEach((k,i)=>keyboard(k.x,k.y,t,kb[i]));if(!S.duckGone)duck(P.duck.x,P.duck.y)},{live:1});
add(P.printer.x,P.printer.y,28,34,P.printer.y+34,(t,S)=>printer(P.printer.x,P.printer.y,t,S.print||0),{live:1});
add(P.trash.x,P.trash.y,14,16,P.trash.y+16,()=>trashCan(P.trash.x,P.trash.y));
add(P.rack.x,P.rack.y,30,64,P.rack.y+64,(t,S)=>serverRack(P.rack.x,P.rack.y,t,(S.kbd||[]).some(Boolean)),{live:1});
add(P.merge.x-4,P.merge.y-4,70,66,P.merge.y+60,(t,S)=>mergeGateBig(P.merge.x,P.merge.y,t,S.merge||{}),{ver:S=>S.merge?S.merge.lights.join('')+Math.round(S.merge.open*8):''});
// 图书馆
add(642,Y+6,256,72,Y+72.5,(t,S)=>{const L=S.ladder||{x:P.ladder.x0};ladder(Math.round(L.x),P.ladder.y0,P.ladder.y1)},{live:1});
add(P.catalog.x,P.catalog.y-8,28,42,P.catalog.y+32,(t,S)=>cardCatalog(P.catalog.x,P.catalog.y,t,S.catOpen||0),{live:1});
add(P.readTable.x,P.readTable.y-8,P.readTable.w,36,P.readTable.y+28,(t,S)=>readTable(P.readTable.x,P.readTable.y,P.readTable.w,S.tod!=='day'),{ver:S=>S.tod});
add(P.armchair.x,P.armchair.y,30,26,P.armchair.y+26,()=>armchair(P.armchair.x,P.armchair.y));
add(P.lamp2.x,P.lamp2.y,10,38,P.lamp2.y+38,(t,S)=>lamp(P.lamp2.x,P.lamp2.y,S.tod!=='day'),{ver:S=>S.tod});
add(P.lectern.x,P.lectern.y-2,20,30,P.lectern.y+27,()=>lectern(P.lectern.x,P.lectern.y));
add(P.winSeat.x,P.winSeat.y-6,P.winSeat.w,16,P.winSeat.y+10,()=>windowSeat(P.winSeat.x,P.winSeat.y,P.winSeat.w));
add(P.libPlant.x,P.libPlant.y,16,26,P.libPlant.y+24,t=>plant(P.libPlant.x,P.libPlant.y,t),{live:1});
// 大客厅
add(P.kotatsu.x,P.kotatsu.y-6,72,48,P.kotatsu.y+34,(t,S)=>kotatsu(P.kotatsu.x,P.kotatsu.y,t,(S.kotatsu||{}).tails||[],(S.kotatsu||{}).jig||0),{live:1});
add(P.tree.x,P.tree.y,48,124,P.tree.y+124,t=>catTreeTall(P.tree.x,P.tree.y,t),{live:1});
add(P.sofa.x,P.sofa.y,70,30,P.sofa.y+30,()=>sofa(P.sofa.x,P.sofa.y,70));
add(P.lamp.x,P.lamp.y,10,38,P.lamp.y+38,(t,S)=>lamp(P.lamp.x,P.lamp.y,S.tod!=='day'),{ver:S=>S.tod});
add(P.bubbler.x,P.bubbler.y,18,14,P.bubbler.y+14,(t,S)=>bubbleMachine(P.bubbler.x,P.bubbler.y,t,S.bubbleOn>0),{live:1});
add(P.tunnel.x,P.tunnel.y-2,62,20,P.tunnel.y+18,(t,S)=>tunnel(P.tunnel.x,P.tunnel.y,t,S.tunnelBulge??-1),{live:1});
add(P.catnip.x,P.catnip.y-12,11,17,P.catnip.y+5,(t,S)=>catnip(P.catnip.x,P.catnip.y,t,S.catnipUsed>0),{live:1});
add(P.dockA.x-1,P.dockA.y,14,11,P.dockA.y+11,(t,S)=>dock(P.dockA.x,P.dockA.y,t,((S.vacs||[])[1]||{}).charging),{live:1});
// 午睡角
add(P.bed.x,P.bed.y,34,12,P.bed.y+2,()=>catBedBack(P.bed.x,P.bed.y));add(P.bed.x,P.bed.y+4,34,8,P.bed.y+12,()=>catBedFront(P.bed.x,P.bed.y));
add(P.bigBox.x-4,P.bigBox.y,48,8,P.bigBox.y+3,()=>bigBoxBack(P.bigBox.x,P.bigBox.y));add(P.bigBox.x-4,P.bigBox.y+4,48,16,P.bigBox.y+18,()=>bigBoxFront(P.bigBox.x,P.bigBox.y));
add(P.beanbag.x,P.beanbag.y,30,18,P.beanbag.y+18,()=>beanbag(P.beanbag.x,P.beanbag.y,['#9B7EBD','#654a86','#d0bce4']));
add(756,Y+300,4,100,Y+400,()=>railV(756,Y+300,100));add(808,Y+300,4,100,Y+400,()=>railV(808,Y+300,100));
add(874,Y+326,6,100,Y+426,()=>railV(874,Y+326,100));add(874,Y+414,66,14,Y+426,()=>railH(874,Y+414,66));
add(938,Y+500,16,26,Y+524,t=>plant(938,Y+500,t));
// 回廊：天井南边一张长凳、两盆花
add(440,Y+506,80,12,Y+518,()=>longBench(440,Y+506,80));add(340,Y+490,16,26,Y+514,t=>plant(340,Y+490,t));add(606,Y+490,16,26,Y+514,t=>plant(606,Y+490,t));
})();
