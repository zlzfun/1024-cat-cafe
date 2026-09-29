/* 1024 猫咖 · 地图最右边一列（x 1360～1680）。依赖 world-map.js、world4-kit.js（在它们后面加载，makeWorld 之前）。
   整张图的布局见 world-map.js 开头：巨树中庭在正中间，这一列接在工坊、后院的右边。
   上：猫猫图书馆——长期记忆。五架书分别是决策日志、教训沉淀、证据库、人物关系、事件记忆；检索柜、阅读桌、扶手椅、说明书讲台、窗边软座（夜里在这儿睡的猫会做梦）。
   下：花园小径——从后院的小门走过来：许愿池、石桌象棋、长椅、路标（指向官网、GitHub、内源主页）、邮筒；最下面那扇小门外就是人类的世界。
   另外在老房间里添了几样：工坊的工具墙（MCP 工具、Skills）和合并门禁，前厅吧台上方的星星罐子，入场纸箱旁边的迎宾立牌。
   只往 WORLD 里追加（WALK、BLOCK 的老下标不变）。 */
const FEST_COL=['#ffd84a','#ff7a6a','#7ee08a','#6ac8ff','#f4a6b8'];
(()=>{const M=WORLD,P=WP;
M.rooms.push({id:'library',n:'猫猫图书馆',x:1360,y:0,w:320,h:250,d:'长期记忆：五架书（决策日志、教训沉淀、证据库、人物关系、事件记忆）、检索柜、阅读桌、说明书讲台、窗边软座'},
  {id:'path',n:'花园小径',x:1360,y:250,w:320,h:290,d:'许愿池、石桌象棋、长椅；路标指向猫咖外面（官网、GitHub、内源主页），邮筒收反馈'});
const SX=[1370,1420,1470,1520,1570];
Object.assign(P,{shelves:SX.map(x=>({x,y:6,w:46,h:64})),ladder:{y0:14,y1:70},catalog:{x:1384,y:96},catalogAt:{x:1398,y:140},readTable:{x:1466,y:142,w:88},armchair:{x:1606,y:148},lamp2:{x:1642,y:130},
  lectern:{x:1378,y:188},lecternAt:{x:1388,y:226},win3:{x:1632,y:8,w:40,h:38},winSeat:{x:1626,y:60,w:48},libPlant:{x:1652,y:206},
  pond:{x:1460,y:374},chess:{x:1554,y:380},stools:[{x:1536,y:388},{x:1578,y:388}],bench:{x:1612,y:316,w:42},sign:{x:1582,y:462},mailbox:{x:1644,y:448},gate:{x:1598,y:522,w:36},lampP:[{x:1542,y:468},{x:1376,y:474}],
  tools:{x:1174,y:6,w:46,h:36},merge:{x:1252,y:128},jar:{x:46,y:14},stand:{x:222,y:180},
  // 后院跑轮旁边：发电机 → 灯杆 → 一串大灯泡挂到枫树上
  dyn:{x:1168,y:466},pole:{x:1190,y:402,h:78},festA:{x:1191,y:404},festB:{x:1297,y:372},festSag:16,festN:8});
M.WALK.push([1368,58,304,190],[1344,142,32,46],[1368,306,304,214],[1504,240,32,72],[1340,442,40,32]);
M.BLOCK.push([1370,58,246,12],[1626,58,48,14],[1384,112,28,16],[1466,150,88,18],[1606,160,30,14],[1642,164,10,6],[1380,208,16,8],[1652,210,14,8],
  [1426,362,68,24],[1556,388,22,10],[1536,392,10,6],[1578,392,10,6],[1612,326,42,6],[1582,500,4,6],[1648,476,6,6],[1540,498,8,6],[1376,504,8,6],
  [1252,150,22,8],[222,204,32,8],[1400,300,70,12],[1580,300,40,12],[1168,472,10,6],[1188,474,7,6]);
M.openings.push([1500,40]);
M.lights.push({x:1476,y:134,r:26,col:'#ffe08a',when:'night'},{x:1476,y:134,r:22,col:'#ffcf70',when:'dusk'},{x:1647,y:134,r:22,col:'#ffcf70',when:'night'},{x:1652,y:26,r:34,col:'#9fb4ff',when:'night',a:.6},
  {x:1545,y:472,r:26,col:'#ffe08a',when:'night'},{x:1379,y:478,r:26,col:'#ffe08a',when:'night'},{x:1545,y:472,r:22,col:'#ffcf70',when:'dusk'},{x:51,y:20,r:10,col:'#ffe890',when:'night'});
const bg0=M.bg,wall0=M.wall,floor0=M.floor,over0=M.over;
M.bg=function(){bg0.call(this);
  // 图书馆：墙、地板、和工坊之间的隔墙（开一个门洞）
  libWall(1360,0,320,56);pillar(1355,0,56);floorParquet(1360,56,320,194);
  rugRect(1446,100,128,96,'#3f6f6a','#2e5450');rugOval(1622,196,34,12,'#c8a0d8','#9a78b0');
  wallTop(1356,56,8,86);wallTop(1356,188,8,62);R(1356,142,8,46,'#a86e44');R(1356,142,8,1,'#6e4430');R(1356,187,8,1,'#6e4430');
  P.shelves.forEach((s,i)=>tallShelf(s.x,s.y,s.w,s.h,SHELF_COLS[i],SHELF_EN[i]));
  windowW(P.win3.x,P.win3.y,P.win3.w,P.win3.h,0,'day',{cross:1});curtains(P.win3.x,P.win3.y,P.win3.w,P.win3.h,'#6a8ac8','#4a6aa8');
  // 下排：花园小径（屋外）。后墙接着后院的砖墙，开一个门洞通图书馆
  wallTop(1360,250,320,6);brickWall(1360,256,320,44);ivy(1380,258,22);ivy(1460,258,12);ivy(1570,258,28);ivy(1650,258,18);
  floorGrass(1354,300,326,240);floorWood(1500,250,40,28);R(1500,278,40,22,'#9a8a78');for(let j=0;j<3;j++)R(1502,280+j*7,36,5,j%2?'#b4aa9a':'#cfc6b8');jamb(1497,250,50);jamb(1540,250,50);R(1500,250,40,1,'#8a5a3a');
  // 和后院之间的篱笆：开一道口子
  fenceV(1354,300,138);fenceV(1354,476,46);R(1352,434,10,6,OL);R(1353,435,8,4,'#ecd2a4');R(1352,474,10,6,OL);R(1353,475,8,4,'#ecd2a4');
  stones([[1346,458],[1366,462],[1390,466],[1416,470],[1444,474],[1472,476],[1500,478],[1528,482],[1554,488],[1576,496],[1600,504],[1614,514],[1520,316],[1518,334],[1514,352]]);
  fenceV(1674,300,222);flowerBed(1400,302,70);flowerBed(1580,302,40);R(1360,538,320,2,'#4a2e22');
  pegboard(P.tools.x,P.tools.y,P.tools.w,P.tools.h,-1)},   // 工具墙不会动，画进底图；终端上那一闪在 wall() 里补
M.wall=function(t,S,vis){wall0.call(this,t,S,vis);const tod=S.tod||'day',wx=S.weather||'sun';
  if(vis(1356,0,324,60)){const W=P.win3;windowW(W.x,W.y,W.w,W.h,t,tod,{weather:wx,cross:1});curtains(W.x,W.y,W.w,W.h,'#6a8ac8','#4a6aa8');
    (S.gaps||[]).forEach(g=>bookGap(g.x,g.y))}
  if(vis(1170,0,56,50)&&Math.floor(t*2)%2)P1(P.tools.x+31,P.tools.y+8,'#7ee08a');
  if(vis(40,8,20,24))starJar(P.jar.x,P.jar.y,t,S.freeze||0)};
M.floor=function(t,S,vis){floor0.call(this,t,S,vis);if(vis(1160,470,40,14)){line(1178,476,1190,478,OL);line(1178,477,1189,479,'#3a3a48')}   // 发电机到灯杆的电线，贴着地
  if(vis(1420,356,80,40))pond(P.pond.x,P.pond.y,t,S.tod||'day');
  (S.ripples||[]).forEach(r=>{if(r.k<1)ripple(r.x,r.y,r.k)})};
M.over=function(t,S,vis){over0.call(this,t,S,vis);const wx=S.weather||'sun';
  // 跑轮串灯：跑得越久亮得越多（S.power 由 world-acts.js 的跑轮给，world4-things.js 再加一把劲）
  if(vis(1184,360,120,70)){const A0=P.festA,B0=P.festB,n=P.festN,lit=Math.ceil((S.power||0)*n-.001);festoonWire(A0,B0,P.festSag);
    for(let i=0;i<n;i++){const q=festoonAt(A0,B0,P.festSag,(i+.6)/(n+.2));festoonBulb(Math.round(q.x),Math.round(q.y),FEST_COL[i%FEST_COL.length],i<lit)}}
  if(wx!=='sun'&&vis(1356,256,324,284)){const night=S.tod==='night';
    if(wx==='rain'){const col=night?'#6a7ab0':'#dfe8f4';for(let i=0;i<180;i++){const x=1358+(i*37+Math.floor(t*30))%320,y=258+(i*53+Math.floor(t*150))%280;R(x,y,1,3,col)}}
    else for(let i=0;i<150;i++)P1(1358+((i*29+Math.floor(t*6+Math.sin(t*1.3+i)*3))%320+320)%320,258+(i*41+Math.floor(t*16))%280,'#ffffff')}};
// 和猫一起排序的家具
const add=(x,y,w,h,base,draw,o={})=>M.props.push({x,y,w,h,base,draw,...o});
add(1370,6,256,72,72.5,(t,S)=>{const L=S.ladder||{x:1445};ladder(Math.round(L.x),P.ladder.y0,P.ladder.y1)},{live:1});
add(P.catalog.x,P.catalog.y-8,28,42,P.catalog.y+32,(t,S)=>cardCatalog(P.catalog.x,P.catalog.y,t,S.catOpen||0),{live:1});
add(P.readTable.x,P.readTable.y-8,P.readTable.w,36,P.readTable.y+28,(t,S)=>readTable(P.readTable.x,P.readTable.y,P.readTable.w,S.tod!=='day'),{ver:S=>S.tod});
add(P.armchair.x,P.armchair.y,30,26,P.armchair.y+26,()=>armchair(P.armchair.x,P.armchair.y));
add(P.lamp2.x,P.lamp2.y,10,38,P.lamp2.y+38,(t,S)=>lamp(P.lamp2.x,P.lamp2.y,S.tod!=='day'),{ver:S=>S.tod});
add(P.lectern.x,P.lectern.y-2,20,30,P.lectern.y+27,()=>lectern(P.lectern.x,P.lectern.y));
add(P.winSeat.x,P.winSeat.y-6,P.winSeat.w,16,P.winSeat.y+10,()=>windowSeat(P.winSeat.x,P.winSeat.y,P.winSeat.w));
add(P.libPlant.x,P.libPlant.y,16,26,P.libPlant.y+24,t=>plant(P.libPlant.x,P.libPlant.y,t),{live:1});
add(P.chess.x-2,P.chess.y-4,24,24,P.chess.y+18,(t,S)=>stoneTable(P.chess.x,P.chess.y,(S.chess||{}).pieces),{live:1});
P.stools.forEach(s=>add(s.x,s.y-2,10,10,s.y+8,()=>stool(s.x,s.y)));
add(P.bench.x,P.bench.y,P.bench.w,15,P.bench.y+15,()=>bench(P.bench.x,P.bench.y,P.bench.w));
add(P.sign.x-40,P.sign.y,84,46,P.sign.y+44,(t,S)=>signpost(P.sign.x,P.sign.y,t,S.signHl??-1),{live:1});
add(P.mailbox.x,P.mailbox.y-1,20,36,P.mailbox.y+34,(t,S)=>mailbox(P.mailbox.x,P.mailbox.y,t,S.mailFlag||0),{ver:S=>S.mailFlag>0?1:0});
P.lampP.forEach(l=>add(l.x-1,l.y-1,8,38,l.y+36,(t,S)=>lampPost(l.x,l.y,S.tod!=='day'),{ver:S=>S.tod}));
add(1354,518,326,22,540,()=>{fenceH(1360,522,238);gardenGate(P.gate.x,P.gate.y,P.gate.w);fenceH(1638,522,42)});
add(P.merge.x-1,P.merge.y-3,24,34,P.merge.y+29,(t,S)=>mergeGate(P.merge.x,P.merge.y,t,S.merge||{}),{ver:S=>S.merge?S.merge.lights.join('')+Math.round(S.merge.open*8):''});
add(P.stand.x,P.stand.y,32,31,P.stand.y+30,t=>welcomeStand(P.stand.x,P.stand.y,t),{live:1});
add(P.dyn.x,P.dyn.y,10,12,P.dyn.y+12,(t,S)=>dynamo(P.dyn.x,P.dyn.y,t,S.wheelOn||0),{live:1});
add(P.pole.x-2,P.pole.y,7,P.pole.h,P.pole.y+P.pole.h,()=>lightPole(P.pole.x,P.pole.y,P.pole.h));
})();
