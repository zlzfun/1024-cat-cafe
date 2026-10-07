/* 1024 猫咖 · 地下一层：夜里不打烊（y 3400～3940，设计见 docs/店内设计.md 第一节"地下一层"）。依赖 map-1f.js（在它和二楼、屋顶后面加载）、b1-kit.js。
   上排：迪斯科舞厅（0～556）· 地下门厅（556～960，楼梯上一楼）；下排：猫猫澡堂（0～600）· 小电影院（600～960）。
   上排的北墙是普通高度；下排的北墙（澡堂的水族馆玻璃、电影院的银幕）高一倍，所以下排的地面从 Y+352 开始。
   上下排之间两个门洞：门厅 → 澡堂（挂"汤"字布帘）、门厅 → 电影院（在银幕右边，门头跑马灯）；舞厅和门厅之间的竖墙上一个门洞。
   舞厅和电影院比门厅、澡堂暗（out 两块，tintOut 更暗）；舞厅的彩色光点、水族馆的鱼和鲨鱼、银幕上的电影、会动的那些在 world-b1.js。只往 WORLD 里追加。 */
const Y4=3400;   // 地下一层在大图上的起点
(()=>{const M=WORLD,P=WP,Y=Y4;
// bright：电影院的银幕、舞厅的发光舞池本身就亮，夜色不压暗它们
M.floors.push({id:'b1',n:'地下',lv:-1,x:0,y:Y,w:960,h:540,tint:'#d8cce4',tintOut:'#8a7cb4',out:[[0,Y,556,252],[608,Y+252,352,288]],bright:[[650,Y+260,220,88],[144,Y+112,240,104]],sub:'迪斯科舞厅 · 地下门厅 · 猫猫澡堂 · 小电影院'});
M.h=Math.max(M.h,Y+540);
M.rooms.push(
  {id:'disco',f:'b1',n:'迪斯科舞厅',x:0,y:Y,w:556,h:252,in:[110,Y+104,436,140],d:'发光的舞池、头顶的镜面球、DJ 台和两摞大音箱；站上舞池就跳舞，走到舞池边能跳一曲'},
  {id:'b1hall',f:'b1',n:'地下门厅',x:556,y:Y,w:404,h:252,in:[572,Y+104,370,140],d:'从一楼下来的楼梯；海报墙上是本周上映的电影，售票亭、爆米花机；往南是澡堂和电影院'},
  {id:'bath',f:'b1',n:'猫猫澡堂',x:0,y:Y+252,w:600,h:288,in:[20,Y+478,420,52],d:'一整面水族馆的大玻璃，前面是冒热气的温泉池；更衣的地方有牛奶冰柜、吹风机、按摩椅和体重秤'},
  {id:'cinema',f:'b1',n:'小电影院',x:600,y:Y+252,w:360,h:288,in:[616,Y+364,40,166],d:'大银幕上放着《猫猫咖啡馆》，坐下就开演；最后面一台放映机'});
// 点位：舞厅 · 门厅 · 澡堂 · 电影院
const SEATX=[664,706,748,790,832,874],SEATY=[Y+390,Y+430,Y+470];
addP({b1Stairs:{x:716,y:Y+64,w:52,h:120},b1BathDoor:{x:562,w:36},b1CineDoor:{x:906,w:36},
  dfloor:{x:144,y:Y+112,cols:6,rows:4,tw:40,th:26},djBooth:{x:214,y:Y+58,w:100},djSpot:{x:264,y:Y+70,z:Y+70,face:'R'},djAt:{x:200,y:Y+104},djOff:{x:236,y:Y+104},
  spkL:{x:146,y:Y+30},spkR:{x:350,y:Y+30},spkAt:{x:162,y:Y+106},ballX:264,ballY:Y+102,chain:{x:530,y:Y+12},chainAt:{x:526,y:Y+76},
  mirL:{x:12,y:Y+8,w:128,h:36},mirR:{x:392,y:Y+8,w:150,h:36},sofaT:{x:24,y:Y+112,w:64},boothTbl:{x:56,y:Y+152},sofaB:{x:24,y:Y+172,w:64},boothAt:{x:104,y:Y+152},
  ticket:{x:572,y:Y+20},ticketAt:{x:600,y:Y+108},popcorn:{x:642,y:Y+40},popcornAt:{x:662,y:Y+108},posters:[0,1,2,3,4].map(k=>({x:786+k*34,y:Y+6})),hallBench:{x:822,y:Y+170,w:72},
  aq:{x:12,y:Y+262,w:428,h:84},aqAt:{x:226,y:Y+366},lockers:{x:452,y:Y+262,w:100,h:84},pool:{x:36,y:Y+384,w:360,h:84},spout:{x:18,y:Y+394},
  buckets:{x:406,y:Y+430},bucketsAt:{x:426,y:Y+478},fridge:{x:456,y:Y+356},fridgeAt:{x:472,y:Y+414},dryer:{x:498,y:Y+370},dryerSpot:{x:516,y:Y+408,z:Y+409,face:'L'},dryerAt:{x:516,y:Y+432},
  massage:{x:546,y:Y+400},massageSpot:{x:564,y:Y+424,z:Y+441,face:'L'},massageAt:{x:560,y:Y+456},scale:{x:462,y:Y+466},scaleAt:{x:474,y:Y+484},fan:{x:572,y:Y+466},bathBench:{x:466,y:Y+514,w:84},
  screen:{x:650,y:Y+260,w:220,h:88},seatX:SEATX,seatY:SEATY,projector:{x:912,y:Y+500},projAt:{x:928,y:Y+538}});
M.WALK.push([16,Y+58,928,196],[562,Y+250,36,110],[906,Y+250,36,110],[16,Y+356,928,178]);
M.BLOCK.push(
  [556,Y+56,8,94],[556,Y+206,8,50],          // 舞厅和门厅之间的竖墙（门洞在 Y+150～Y+206）
  [600,Y+352,8,188],                          // 澡堂和电影院之间的竖墙
  [710,Y+64,6,120],[768,Y+64,6,120],          // 楼梯两边的栏杆
  [146,Y+86,32,8],[350,Y+86,32,8],[214,Y+88,100,8],[24,Y+124,64,10],[48,Y+150,18,8],[24,Y+182,64,10],   // 舞厅：音箱、DJ 台、卡座
  [572,Y+90,56,6],[642,Y+90,40,8],[822,Y+176,72,6],[940,Y+132,14,8],[849,Y+230,8,4],[889,Y+230,8,4],   // 门厅：售票亭、爆米花车、长椅、一盆花、红绒绳的两根柱子
  [40,Y+388,352,76],[406,Y+446,36,8],[456,Y+394,32,8],[500,Y+404,30,8],[546,Y+430,36,10],[462,Y+490,24,6],[574,Y+504,14,6],[466,Y+522,84,4],[14,Y+512,18,6],   // 澡堂
  ...SEATY.map(y=>[660,y+12,246,10]),[912,Y+524,32,6]);                                                   // 电影院：三排座位、放映机
M.portals.push({id:'s1b',from:'f1',to:'b1',n:'楼梯（下地下）',k:'walk',auto:1,walk:1,zone:[720,440,44,12],at:{x:742,y:444},dir:{x:0,y:1},out:{x:742,y:Y+196,face:'R'},outDir:{x:0,y:1}},
  {id:'sb1',from:'b1',to:'f1',n:'楼梯（上一楼）',k:'walk',auto:1,walk:1,zone:[716,Y+58,52,14],at:{x:742,y:Y+66},dir:{x:0,y:-1},out:{x:742,y:426,face:'R'},outDir:{x:0,y:-1}});
// 灯：门厅的壁灯、澡堂暖黄的灯和玻璃里透出来的蓝光、电影院银幕的光（舞厅的彩色光点每帧在 world-b1.js 里算）
M.lights.push({x:600,y:Y+40,r:30,col:'#ffcf70'},{x:930,y:Y+40,r:30,col:'#ffcf70'},{x:742,y:Y+120,r:44,col:'#ffcf70',a:.6},{x:868,y:Y+30,r:60,col:'#ffe08a',a:.5},
  {x:120,y:Y+330,r:90,col:'#8fd0ff',a:.7},{x:330,y:Y+330,r:90,col:'#8fd0ff',a:.7},{x:216,y:Y+430,r:120,col:'#ffcf90',a:.6},{x:500,y:Y+420,r:70,col:'#ffcf70',a:.7},
  {x:780,y:Y+430,r:120,col:'#a8b0e8',a:.5},{x:928,y:Y+510,r:20,col:'#ffe8a0'},{x:924,y:Y+262,r:16,col:'#ffd84a',a:.6},{x:264,y:Y+70,r:50,col:'#ff6ac8',a:.5});
const bg0=M.bg,wall0=M.wall,floor0=M.floor,over0=M.over,B=b1Kit;
M.bg=function(){bg0.call(this);
  // 上排的北墙：舞厅是黑底霓虹墙，门厅是酒红色的墙；中间一根柱子
  B.wallDisco(0,Y,556,56);B.wallHall(556,Y,404,56);pillar(552,Y,56);
  B.floorDisco(0,Y+56,556,196);B.floorHall(556,Y+56,404,196);
  // 舞厅和门厅之间的竖墙，开一个门洞
  [[Y+56,Y+150],[Y+206,Y+252]].forEach(([a,b])=>{wallTop(556,a,8,b-a);R(556,b,8,6,'#e8dccb');R(556,b+5,8,1,'#4a2e22')});B.floorHall(556,Y+150,8,56);
  // 上下排之间的横墙：下排的北墙高一倍（澡堂是水族馆玻璃和储物柜，电影院是银幕），两个门洞
  wallTop(0,Y+250,960,6);B.wallBath(0,Y+256,600,96);B.wallCinema(600,Y+256,360,96);
  [P.b1BathDoor,P.b1CineDoor].forEach(d=>{R(d.x,Y+250,d.w,102,'#000');B.floorHall(d.x,Y+250,d.w,30);(d===P.b1BathDoor?B.floorBath:B.floorCinema)(d.x,Y+280,d.w,72);jamb(d.x-3,Y+250,102);jamb(d.x+d.w,Y+250,102);R(d.x,Y+250,d.w,1,'#8a5a3a')});
  B.floorBath(0,Y+352,600,188);B.floorCinema(608,Y+352,352,188);wallTop(600,Y+352,8,188);R(0,Y+538,960,2,'#4a2e22');
  // 楼梯：门厅西头往上通一楼
  stairsUp(P.b1Stairs.x,P.b1Stairs.y,P.b1Stairs.w,P.b1Stairs.h);
  // 澡堂：水族馆的玻璃（不动的部分）、储物柜、温泉池、门口的小黄牌
  B.aquariumBack(P.aq.x,P.aq.y,P.aq.w,P.aq.h);B.lockers(P.lockers.x,P.lockers.y,P.lockers.w,P.lockers.h);B.onsenBack(P.pool.x,P.pool.y,P.pool.w,P.pool.h);
  rugRect(564,Y+356,32,22,'#5a8a9a','#4a7a8a');
  // 电影院：银幕的框和红幕布，绿色的出口牌
  B.screenFrame(P.screen.x,P.screen.y,P.screen.w,P.screen.h)};
M.wall=function(t,S,vis){wall0.call(this,t,S,vis);const D=S.disco||{},pal=B.PALS[D.pal||0];
  if(vis(0,Y,556,56)){B.mirrorWall(P.mirL.x,P.mirL.y,P.mirL.w,P.mirL.h,t,pal);B.mirrorWall(P.mirR.x,P.mirR.y,P.mirR.w,P.mirR.h,t,pal);neon(52,Y+14,'DISCO','#ff6ac8',t,2);neon(440,Y+14,'1024','#4fd8ff',t,2)}
  if(vis(0,Y+256,600,96)&&A_B1.aquarium)A_B1.aquarium(t,S);
  if(vis(600,Y+256,360,96)){const s=P.screen;if(typeof cinemaScreen==='function')cinemaScreen(s.x,s.y,s.w,s.h,t);else B.screenIdle(s.x,s.y,s.w,s.h,t)}
  if(vis(P.b1CineDoor.x-12,Y+250,P.b1CineDoor.w+24,20))B.marquee(P.b1CineDoor.x-8,Y+254,P.b1CineDoor.w+16,t)};
M.floor=function(t,S,vis){floor0.call(this,t,S,vis);const D=S.disco||{};
  if(vis(P.dfloor.x,P.dfloor.y,240,104)){const F=P.dfloor;B.danceFloor(F.x,F.y,F.cols,F.rows,F.tw,F.th,t,{pal:D.pal||0,beat:Math.floor(t*2),crazy:D.crazy>t,allGold:D.allGold>t,gold:D.gold,hit:D.hit})}
  if(vis(P.pool.x,P.pool.y,P.pool.w,P.pool.h))B.onsenLive(P.pool.x,P.pool.y,P.pool.w,P.pool.h,t)};
M.over=function(t,S,vis){over0.call(this,t,S,vis);const D=S.disco||{};
  if(vis(P.ballX-10,Y,20,P.ballY-Y+10)){const low=D.crazy>t?8:0;B.mirrorBall(P.ballX,Y,P.ballY+low,t,D.crazy>t?4:1)}
  if(vis(P.pool.x,P.pool.y-40,P.pool.w,P.pool.h+40))B.steam(P.pool.x+20,P.pool.y+P.pool.h-10,P.pool.w-40,t,12)};
const add=(x,y,w,h,base,draw,o={})=>M.props.push({x,y,w,h,base,draw,...o});
add(710,Y+64,6,120,Y+184,()=>railV(710,Y+64,120));add(768,Y+64,6,120,Y+184,()=>railV(768,Y+64,120));
// 舞厅：两摞音箱、DJ 台、卡座两张沙发和中间的小圆桌、墙上拉镜面球的链子
add(P.spkL.x,P.spkL.y,32,64,Y+94,(t,S)=>B.speakerStack(P.spkL.x,P.spkL.y,t,Math.floor(t*2),(S.disco||{}).blow>t),{live:1});add(P.spkR.x,P.spkR.y,32,64,Y+94,t=>B.speakerStack(P.spkR.x,P.spkR.y,t,Math.floor(t*2)),{live:1});
add(P.djBooth.x-2,P.djBooth.y-10,P.djBooth.w+4,48,Y+96,(t,S)=>{const D=S.disco||{};B.djBooth(P.djBooth.x,P.djBooth.y,P.djBooth.w,t,{pal:D.pal||0,beat:Math.floor(t*2),scratch:D.scratch>t?1:0})},{live:1});
add(P.sofaT.x-2,P.sofaT.y,P.sofaT.w+4,20,Y+132,()=>B.boothSofa(P.sofaT.x,P.sofaT.y,P.sofaT.w));add(P.boothTbl.x-11,P.boothTbl.y-10,22,22,Y+160,t=>B.boothTable(P.boothTbl.x,P.boothTbl.y,t),{live:1});
add(P.sofaB.x-2,P.sofaB.y,P.sofaB.w+4,22,Y+192,()=>B.boothSofa(P.sofaB.x,P.sofaB.y,P.sofaB.w,1));
add(P.chain.x-2,P.chain.y,6,32,Y+56,(t,S)=>B.pullChain(P.chain.x,P.chain.y,t,(S.disco||{}).pull>t),{live:1});
// 门厅：售票亭、爆米花车、五张海报（挂在墙上，和墙一起排在最后面）、等电影的长椅、一盆花
add(P.ticket.x-3,P.ticket.y-12,64,90,Y+96,(t,S)=>B.ticketBooth(P.ticket.x,P.ticket.y,t,Math.max(0,((S.b1||{}).ticket||0)-t)),{live:1});
add(P.popcorn.x,P.popcorn.y-16,40,74,Y+98,(t,S)=>B.popcornCart(P.popcorn.x,P.popcorn.y,t,((S.b1||{}).pop||0)>t),{live:1});
P.posters.forEach((p,k)=>add(p.x-3,p.y-3,36,50,Y+56,t=>B.poster(p.x,p.y,k,t),{live:1}));
add(P.hallBench.x,P.hallBench.y,P.hallBench.w,14,Y+182,()=>B.bathBench(P.hallBench.x,P.hallBench.y,P.hallBench.w));
// 电影院门口排队的红绒绳（在门洞右边，不挡门）
add(850,Y+214,48,24,Y+234,()=>B.rope(852,892,Y+214));add(940,Y+116,16,26,Y+140,t=>plant(940,Y+116,t));
add(P.b1BathDoor.x-1,Y+252,P.b1BathDoor.w+2,22,Y+352,(t,S)=>B.noren(P.b1BathDoor.x,Y+254,P.b1BathDoor.w,Math.sin(t*6)*Math.max(0,((S.b1||{}).noren||0)-t)),{live:1});
// 澡堂：竹筒、一摞黄木桶、牛奶冰柜、吹风机、按摩椅、体重秤、电扇、长凳、小黄牌
add(P.spout.x,P.spout.y,16,20,P.spout.y+2,t=>B.spout(P.spout.x,P.spout.y,t),{live:1});
add(P.buckets.x-8,P.buckets.y-2,56,44,Y+454,(t,S)=>B.buckets(P.buckets.x,P.buckets.y,((S.b1||{}).bucketsDown||0)>t,t),{live:1});
add(P.fridge.x,P.fridge.y-12,32,60,Y+402,(t,S)=>B.milkFridge(P.fridge.x,P.fridge.y,t,((S.b1||{}).milk||0)>t),{live:1});
add(P.dryer.x,P.dryer.y-2,34,48,Y+414,(t,S)=>B.hoodDryer(P.dryer.x,P.dryer.y,t,((S.b1||{}).dryer||0)>t),{live:1});
add(P.massage.x-3,P.massage.y,40,44,Y+442,(t,S)=>B.massageChair(P.massage.x,P.massage.y,t,((S.b1||{}).massage||0)>t),{live:1});
add(P.scale.x,P.scale.y,24,30,Y+496,(t,S)=>B.scale(P.scale.x,P.scale.y,(S.b1||{}).needle||0),{live:1});
add(P.fan.x,P.fan.y,16,44,Y+510,t=>B.fan(P.fan.x,P.fan.y,t),{live:1});add(P.bathBench.x,P.bathBench.y,P.bathBench.w,12,Y+526,()=>B.bathBench(P.bathBench.x,P.bathBench.y,P.bathBench.w));
add(14,Y+496,18,18,Y+514,()=>B.wetSign(14,Y+496));
// 电影院：三排座位（猫坐进去，椅背挡住身子，只露脑袋）、放映机
SEATY.forEach(y=>SEATX.forEach(x=>add(x-2,y,32,22,y+22.5,()=>B.seat(x,y))));
add(P.projector.x,P.projector.y-4,30,36,Y+530,(t,S)=>B.projector(P.projector.x,P.projector.y,t,1),{live:1});
})();
// world-b1.js 往这里挂会动的画法（水族馆的鱼和鲨鱼）
const A_B1={};
