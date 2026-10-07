/* 1024 猫咖 · 屋顶：永远是晴天的夜里（y 2400～2940，设计见 docs/店内设计.md 第一节）。依赖 map-1f.js、map-2f.js（在它们后面加载）。
   上半张是夜空：银河、月亮、星星、流星，天边一排屋顶的剪影；正中是巨树的树冠（map-tree.js）。
   左边一片斜屋顶，屋脊上能坐一排猫，一根烟囱；右边是木头平台：观星毯、望远镜、吊床、猫跑轮和一串大灯泡；最右边是楼梯小屋。
   为什么永远是夜里：星空是屋顶的主角，来店里的人大多是白天来的。全店都是晴天的夜里（2026-10-07 起），一楼、二楼的窗外和屋顶是同一片天。 */
(()=>{const M=WORLD,P=WP,Y=Y3;
M.rooms.push({id:'roof',f:'roof',n:'星空露台',x:0,y:Y,w:960,h:540,in:[250,Y+344,500,170],d:'永远是晴天的夜里：屋脊上坐一排猫，观星毯上躺着看满天星，巨树的树冠在头顶；跑起跑轮，串灯一颗颗亮；放一盏孔明灯'});
addP({ridge:[30,62,94,168,198,226].map((x,i)=>({x,y:Y+247,z:Y+251.5,face:i<3?'L':'R'})),ridgeUp:[{x:236,y:Y+384,z:Y+412.5},{x:230,y:Y+316,z:Y+412.5}],ridgeAt:{x:244,y:Y+430},chimney:{x:122,y:Y+206},
  blanket:{x:540,y:Y+470},blanketAt:{x:534,y:Y+500},scope:{x:604,y:Y+428},scopeAt:{x:596,y:Y+466},hammock:{x:676,y:Y+452},wheel:{x:768,y:Y+438},dyn:{x:820,y:Y+476},
  pole:{x:838,y:Y+352,h:134},festA:{x:839,y:Y+354},festB:{x:170,y:Y+282},festSag:34,festN:16,hut:{x:790,y:Y+372},waterTank:{x:880,y:Y+330},
  moon:{x:836,y:Y+64},sky:[0,Y,960,316],ffArea:[260,Y+250,520,260],
  // 孔明灯的篮子；猫头鹰停的地方（天线、水塔顶、烟囱顶）；水塔顶上、烟囱边上能坐的位置
  lanterns:{x:372,y:Y+462},lanternAt:{x:366,y:Y+484},owlPerch:[{x:847,y:Y+351},{x:906,y:Y+325},{x:132,y:Y+204}],
  tankTop:[{x:892,y:Y+331,z:Y+388.6,face:'L'},{x:910,y:Y+331,z:Y+388.6,face:'R'}],tankAt:{x:900,y:Y+398},chimSeat:[{x:110,y:Y+249,z:Y+251.6,face:'R'},{x:154,y:Y+249,z:Y+251.6,face:'L'}]});
M.WALK.push([250,Y+322,702,212],[8,Y+418,250,116],[814,Y+430,22,24]);
M.BLOCK.push([792,Y+400,22,54],[836,Y+400,22,54],[814,Y+400,22,30],[884,Y+380,32,8],[450,Y+402,60,22],[602,Y+452,20,6],[676,Y+482,4,8],[736,Y+482,4,8],[772,Y+484,40,6],[820,Y+484,10,6],[836,Y+482,7,6],
  [258,Y+340,14,8],[702,Y+340,14,8],[940,Y+500,14,8],[300,Y+330,120,10],[560,Y+330,120,10],[20,Y+500,40,10],[630,Y+488,40,10],[372,Y+468,16,6]);
M.portals.push({id:'s32',from:'roof',to:'f2',n:'楼梯（下二楼）',k:'walk',auto:1,walk:1,zone:[814,Y+434,22,12],at:{x:825,y:Y+442},dir:{x:0,y:-1},out:{x:784,y:Y2+412,face:'R'},outDir:{x:0,y:1}});
M.lights.push({x:836,y:Y+64,r:90,col:'#c8d0ff',a:.5},{x:58,y:Y+322,r:24,col:'#ffcf70'},{x:310,y:Y+328,r:16,col:'#ffcf70'},{x:690,y:Y+328,r:16,col:'#ffcf70'},{x:132,y:Y+214,r:26,col:'#ffa060',a:.4},{x:810,y:Y+400,r:22,col:'#ffe08a'},{x:850,y:Y+400,r:22,col:'#ffe08a'},{x:838,y:Y+420,r:16,col:'#ffcf70'},{x:575,y:Y+470,r:30,col:'#ffcf70',a:.6},{x:40,y:Y+500,r:20,col:'#ffcf70'});
const bg0=M.bg,wall0=M.wall,floor0=M.floor,over0=M.over;
M.bg=function(){bg0.call(this);
  // 夜空、月亮、天边的屋顶剪影（不会动的部分画进底图）
  nightSkyBase(0,Y,960,316);moonPx(P.moon.x,P.moon.y,22);skyline(0,Y+316,960,0);
  // 平台从屋檐底下一直铺到右边；平台后沿一道矮墙；左边一面斜屋顶，屋脊高过天边，猫坐上去背后就是星空
  floorPlanks(0,Y+318,960,222,'deck');parapet(250,Y+306,710);roofTiles(0,Y+246,250,166);dormer(44,Y+300);dormer(180,Y+300,0);R(0,Y+412,250,4,'#5a4a42');R(0,Y+412,250,1,'#8a7a6e');
  for(let i=6;i<250;i+=24){R(i,Y+416,2,4,OL)}
  // 平台上两只花箱、一块圆垫子（观星的地方）
  [[300,Y+322,120],[560,Y+322,120]].forEach(([x,y,w])=>{R(x,y+6,w,10,OL);R(x+1,y+7,w-2,8,'#8a5a3a');R(x+1,y+7,w-2,1,'#b07a52');for(let i=x+4;i<x+w-3;i+=5){const h=4+Math.floor(hsh(i,7)*5);R(i,y+7-h,1,h,'#4a8a4e');P1(i,y+6-h,['#f4a6b8','#fff4dc','#ffd84a','#c8a0ff'][i%4])}});
  rugOval(560,Y+482,62,20,'#3f5a8a','#2e4470');rugOval(560,Y+482,46,13,'#5a78aa','#3f5a8a')
  // 树干从平台中间的洞里长出来
  disc(480,Y+418,34,10,OL);disc(480,Y+418,33,9,'#2a1e22');disc(480,Y+417,30,7,'#3a2a26');
  // 几盆小灌木、平台上的灯笼
  [[940,Y+486],[20,Y+484],[44,Y+490]].forEach(([x,y])=>potShrub(x,y))},
M.wall=function(t,S,vis){wall0.call(this,t,S,vis);
  if(!vis(0,Y,960,330))return;nightStars(0,Y,960,300,t,170,7);
  // 天边窗户的灯一闪一闪
  for(let i=0;i<14;i++){const x=Math.floor(hsh(i,301)*960),y=Y+290+Math.floor(hsh(i,302)*22);if((Math.floor(t*.4+hsh(i,303)*9)%7)===0)P1(x,y,'#ffd88a')}
  // 流星：每隔几秒一颗
  const per=7,k=(t%per)/1.1,n=Math.floor(t/per);if(k<1){const sx=80+hsh(n,311)*640,sy=Y+20+hsh(n,312)*120;shootingStar(sx,sy,90*(hsh(n,313)<.5?1:-1),50,k)}};
M.floor=function(t,S,vis){floor0.call(this,t,S,vis)};
M.over=function(t,S,vis){over0.call(this,t,S,vis);
  // 萤火虫：在树冠边上、平台上空慢慢飘
  if(vis(240,Y+200,560,320))for(let i=0;i<22;i++){const a=t*(.18+hsh(i,321)*.2)+i*2.1,x=Math.round(300+hsh(i,322)*440+Math.sin(a)*40),y=Math.round(Y+250+hsh(i,323)*220+Math.cos(a*1.3)*20);firefly(x,y,t,hsh(i,324))}};
const add=(x,y,w,h,base,draw,o={})=>M.props.push({x,y,w,h,base,draw,...o});
add(P.chimney.x-2,P.chimney.y-40,26,84,Y+247,t=>chimney(P.chimney.x,P.chimney.y,t),{live:1});
// 屋顶平台上的灯笼（花箱两头、观星垫旁边）
[[306,Y+318],[686,Y+318],[606,Y+462],[36,Y+478]].forEach(([x,y])=>add(x-3,y-14,8,16,y,t=>{R(x,y-14,1,3,OL);R(x-3,y-11,7,9,OL);R(x-2,y-10,5,7,'#ffd88a');R(x-2,y-4,5,1,'#e8a040');R(x-1,y-2,3,2,OL)}));
// 观星毯右边一张小茶几，两杯拉花（原来摆在吊床正下方，吊床的落脚点落在它的占地里，下来就卡住）
add(630,Y+486,40,14,Y+500,()=>{R(630,Y+490,40,6,OL);R(631,Y+491,38,4,'#a8703f');R(646,Y+496,8,4,OL);latte(634,Y+484);latte(654,Y+484)});
add(P.blanket.x,P.blanket.y,44,20,P.blanket.y+2,()=>blanket(P.blanket.x,P.blanket.y));
add(P.scope.x,P.scope.y,26,30,P.scope.y+30,t=>telescope(P.scope.x,P.scope.y,t));
add(P.hammock.x,P.hammock.y,64,34,P.hammock.y+6,(t,S)=>hammockBack(P.hammock.x,P.hammock.y,S.hamSw||0),{live:1});add(P.hammock.x,P.hammock.y+10,64,24,P.hammock.y+30,(t,S)=>hammockFront(P.hammock.x,P.hammock.y,S.hamSw||0),{live:1});
add(P.wheel.x,P.wheel.y,48,50,P.wheel.y+50,(t,S)=>catWheel(P.wheel.x,P.wheel.y,S.wheelA||0),{live:1});
add(P.dyn.x,P.dyn.y,10,12,P.dyn.y+12,(t,S)=>dynamo(P.dyn.x,P.dyn.y,t,S.wheelOn||0),{live:1});
add(P.pole.x-2,P.pole.y,7,P.pole.h,P.pole.y+P.pole.h,()=>lightPole(P.pole.x,P.pole.y,P.pole.h));
add(P.hut.x-4,P.hut.y-2,78,82,P.hut.y+80,t=>{stairHut(P.hut.x,P.hut.y,t);antenna(P.hut.x+56,P.hut.y-20,22)});
add(P.waterTank.x,P.waterTank.y-4,40,62,P.waterTank.y+58,()=>waterTank(P.waterTank.x,P.waterTank.y));
add(P.lanterns.x,P.lanterns.y,16,12,P.lanterns.y+12,()=>lanternBasket(P.lanterns.x,P.lanterns.y));
})();
