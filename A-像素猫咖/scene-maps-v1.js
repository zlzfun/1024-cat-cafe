/* 1024 猫咖 · 三张地图草案（v1，已冻结：只给 scene-v1.html 用）。依赖 cat-sprites.js、scene-kit.js。
   每张图：{w,h,zones,lights,draw(t,tod,S)}；S 是场景里各元素的状态（可交互时由游戏逻辑改写）。
   绘制顺序：墙与地面 → 按 base(y) 排序的家具与猫 → 气泡 → 昼夜光照。 */
function paint(list){list.sort((a,b)=>a[0]-b[0]).forEach(([,f])=>f())}
function catList(S,t){return (S.cats||[]).filter(c=>!c.hidden).map(c=>[c.z??c.y,()=>{const P=cat(c.k,c.b,c.x,c.y,t,c.o||0,c.face||'R');if(c.emote&&t<c.emoteUntil)drawEmote(C,c.x,c.y-P.G.length+(P.dy||0)-2,c.emote,t);if(c.me)meMark(c.x,c.y-P.G.length+(P.dy||0)-4);if(c.carry!=null)yarnBall(c.x+(c.k==='walkL'?-9:9),c.y-6,2,c.carry)}])}
function meMark(x,y){R(x-1,y,3,2,'#e0533d');P1(x,y+2,'#e0533d')}

/* ============ M1 一屏小店 320×192 ============ */
const M1={w:320,h:192,
  zones:[{n:'吧台',d:'毛线篮：公共毛线球',x:2,y:34,w:84,h:50},{n:'门口',d:'门铃 = 有新毛线球投递；邮筒 = 传球',x:88,y:6,w:54,h:50},
    {n:'客座',d:'人类坐着发毛线球',x:102,y:74,w:132,h:52},{n:'窗边',d:'阳光斑，晒太阳',x:146,y:40,w:54,h:34},
    {n:'猫之家',d:'爬架、沙发、灯',x:232,y:40,w:86,h:126},{n:'角落',d:'纸箱、饭碗',x:2,y:140,w:88,h:50}],
  lights:[{x:171,y:30,r:44,col:'#ffb070',when:'dusk'},{x:305,y:130,r:36,col:'#ffcf70'},{x:128,y:19,r:18,col:'#ff5a8a',when:'night'},
    {x:128,y:96,r:24,col:'#ffcf70',when:'night'},{x:200,y:92,r:20,col:'#bfe0ff',when:'night'},{x:19,y:45,r:14,col:'#ffcf70',when:'night'}],
  draw(t,tod,S){wall(0,0,320,50,'cream');floorWood(0,50,320,142);
    shelf(8,18,52);poster(66,12,'cat');door(92,10,t,S.bell>0);neon(118,14,'OPEN','#ff7a9a',t);
    windowW(146,8,50,30,t,tod);curtains(146,8,50,30);chalkboard(214,8,52,30,[['CAT CAFE',4],['1024',11,'#ffd84a',2],['TODAY '+String(S.count).padStart(2,'0'),23,'#f4a6b8']]);clock(283,18,t);
    mat(90,50);sunbeam(150,50,42,46,26,t,tod);rug(98,86,134,42,'#8cc4b0','#6aa490');
    const g=S.guests,L=[
      [80,()=>{counter(4,54,78);coffeeMachine(10,37,t,S.brew>0);yarnBasket(52,44,S.basket,t)}],
      [52,()=>mailbox(122,26,S.mail>1?2:S.mail>0?1:0,t)],[58,()=>plant(270,34,t,S.plant>0)],[116,()=>catTree(284,46,t)],
      [119,()=>guestTable(108,96,40,HUMANS[g[0].lk],t,0,{item:S.cup===2?null:'cup',itemState:S.cup})],
      [119,()=>guestTable(180,96,40,HUMANS[g[1].lk],t,1.3,{typing:!S.laptop,item:'laptop',itemState:S.laptop?1:0,catOn:S.laptop?0:null})],
      [162,()=>sofa(236,132,60)],[162,()=>lamp(300,124,tod!=='day')],[166,()=>cardbox(22,150,S.box,t,S.boxCat??4)],[179,()=>bowls(54,172,S.bowl)],[184,()=>plant(2,160,t)]];
    if(S.cup===2)L.push([124,()=>cup(146,122,2,t)]);
    paint(L.concat(catList(S,t)));
    guestBubble(108,96,40,g[0].st,t);guestBubble(180,96,40,g[1].st,t);if(S.laptop)floatDigits(214,82,t);
    applyTod(320,192,tod,this.lights)}};
const M1_STATE=()=>({count:7,basket:3,bell:0,brew:0,mail:0,plant:0,cup:0,laptop:0,box:1,bowl:1,
  guests:[{lk:0,st:'yarn'},{lk:1,st:'dots'}],
  cats:[{k:'sleep',b:1,x:278,y:151,z:162.5},{k:'lie',b:2,x:299,y:58,z:116.5,o:.4},{k:'lie',b:3,x:172,y:74,o:.9},{k:'lick',b:6,x:40,y:60,z:80.5},
        {k:'belly',b:5,x:92,y:150},{k:'sit',b:0,x:170,y:152,me:1}]});

/* ============ M2 长街 640×192（镜头横向跟随） ============ */
const M2={w:640,h:192,
  zones:[{n:'① 门口 · 吧台',d:'进门、领毛线球',x:0,y:0,w:158,h:192},{n:'② 客座',d:'人类在这里发毛线球',x:160,y:0,w:158,h:192},
    {n:'③ 1024 工位',d:'写代码的人类，猫会踩键盘',x:320,y:0,w:158,h:192},{n:'④ 猫之家',d:'休息、传球、晒太阳',x:480,y:0,w:160,h:192}],
  lights:[{x:52,y:18,r:18,col:'#ff5a8a',when:'night'},{x:210,y:30,r:44,col:'#ffb070',when:'dusk'},{x:400,y:20,r:30,col:'#8fe0ff',when:'night'},
    {x:343,y:45,r:16,col:'#8fc8f0'},{x:393,y:45,r:16,col:'#8fc8f0'},{x:443,y:45,r:16,col:'#8fc8f0'},{x:524,y:30,r:40,col:'#ffb070',when:'dusk'},
    {x:192,y:98,r:24,col:'#ffcf70',when:'night'},{x:258,y:98,r:24,col:'#ffcf70',when:'night'},{x:224,y:142,r:24,col:'#ffcf70',when:'night'},{x:620,y:128,r:30,col:'#ffcf70',when:'night'}],
  draw(t,tod,S){wall(0,0,160,50,'butter');wall(160,0,160,50,'pink');wall(320,0,160,50,'navy');wall(480,0,160,50,'mint');
    floorTile(0,50,160,142);floorWood(160,50,160,142);floorCarpet(320,50,160,142);floorWood(480,50,160,142);
    [157,317,477].forEach(x=>pillar(x,0,192));
    door(10,10,t,S.bell>0);mat(8,50);neon(40,12,'OPEN','#ff7a9a',t);chalkboard(70,8,52,30,[['CAT CAFE',4],['1024',11,'#ffd84a',2],['TODAY '+String(S.count).padStart(2,'0'),23,'#f4a6b8']]);shelf(128,22,26);
    windowW(180,8,60,30,t,tod);curtains(180,8,60,30);poster(262,12,'cat');clock(301,20,t);rug(166,88,146,84,'#f4c0a0','#d89a7a');
    neon(382,8,'1024','#8fe0ff',t,2);poster(452,12,'1024');
    windowW(500,8,48,30,t,tod);curtains(500,8,48,30,'#8cc4b0','#6aa490');sunbeam(504,50,40,46,24,t,tod);
    const L=[[86,()=>{counter(40,60,112);coffeeMachine(48,43,t,S.brew>0);yarnBasket(80,50,S.basket,t);box(124,52,16,11,'#6b7480');R(126,54,12,4,'#b8f0c8');R(122,62,20,2,OL)}],
      [121,()=>guestTable(172,98,40,HUMANS[0],t,0,{item:'cup'})],[121,()=>guestTable(238,98,40,HUMANS[3],t,.7,{item:'cup2'})],[165,()=>guestTable(204,142,40,HUMANS[1],t,1.4,{typing:1,item:'laptop'})],
      [58,()=>plant(296,34,t)],[180,()=>plant(128,156,t)],
      [82,()=>workDesk(326,52,HUMANS[2],t,0)],[82,()=>workDesk(376,52,HUMANS[4],t,1)],[82,()=>workDesk(426,52,HUMANS[5],t,2)],
      [52,()=>mailbox(560,26,S.mail||0,t)],[114,()=>catTree(600,44,t)],[160,()=>sofa(508,130,60)],[166,()=>cardbox(590,150,1,t,4)],[181,()=>bowls(584,174,1)],[58,()=>plant(462,34,t)],[168,()=>lamp(620,130,tod!=='day')]];
    paint(L.concat(catList(S,t)));
    guestBubble(172,98,40,'yarn',t);guestBubble(238,98,40,'heart',t);guestBubble(204,142,40,'dots',t);bubble(343,36,'yarn',t);
    applyTod(640,192,tod,this.lights)}};
const M2_STATE=()=>({count:12,basket:4,cats:[{k:'lick',b:6,x:100,y:66,z:86.5},{k:'lie',b:3,x:352,y:60,z:82.5,o:.3},{k:'bat',b:5,x:420,y:150},
  {k:'sleep',b:1,x:530,y:149,z:160.5},{k:'lie',b:2,x:615,y:56,z:114.5,o:.6},{k:'lie',b:0,x:528,y:78,o:.2},{k:'walkR',b:4,x:0,y:176,walker:1}]});

/* ============ M3 中庭大厅 480×320（吧台岛为枢纽，四角分区） ============ */
const M3={w:480,h:320,
  zones:[{n:'中央吧台岛',d:'毛线球集散地，所有动线的中心',x:170,y:112,w:140,h:64},{n:'窗边座',d:'人类发毛线球',x:8,y:52,w:150,h:130},
    {n:'1024 工位',d:'写代码的人类',x:300,y:34,w:172,h:66},{n:'猫窝',d:'爬架、沙发、纸箱、饭碗',x:8,y:190,w:176,h:122},
    {n:'门口',d:'进门、邮筒传球',x:292,y:268,w:136,h:52},{n:'广场',d:'NPC 猫闲逛、玩球',x:182,y:196,w:118,h:74},{n:'客座',d:'更多人类',x:340,y:120,w:132,h:126}],
  lights:[{x:65,y:22,r:40,col:'#ffb070',when:'dusk'},{x:135,y:22,r:40,col:'#ffb070',when:'dusk'},{x:420,y:18,r:30,col:'#8fe0ff',when:'night'},
    {x:321,y:45,r:16,col:'#8fc8f0'},{x:365,y:45,r:16,col:'#8fc8f0'},{x:409,y:45,r:16,col:'#8fc8f0'},{x:240,y:140,r:50,col:'#ffcf70',when:'night'},
    {x:47,y:78,r:22,col:'#ffcf70',when:'night'},{x:113,y:78,r:22,col:'#ffcf70',when:'night'},{x:77,y:136,r:22,col:'#ffcf70',when:'night'},
    {x:417,y:136,r:22,col:'#ffcf70',when:'night'},{x:437,y:194,r:22,col:'#ffcf70',when:'night'},{x:95,y:240,r:34,col:'#ffcf70',when:'night'}],
  draw(t,tod,S){wall(0,0,480,50,'cream');R(290,0,190,48,'#3c4670');for(let i=292;i<480;i+=8)R(i,2,3,38,'#353e64');R(290,0,190,2,'#5a3a2a');
    floorWood(0,50,480,270);floorCarpet(296,50,178,60);floorTile(166,110,148,76);rug(186,204,108,62,'#b8a0d8','#8a70b0');
    R(0,50,6,270,'#c9a888');R(474,50,6,270,'#c9a888');R(0,50,6,2,'#5a3a2a');R(474,50,6,2,'#5a3a2a');R(0,314,300,6,'#9a6448');R(346,314,134,6,'#9a6448');R(0,313,300,1,'#5a3a2a');R(346,313,134,1,'#5a3a2a');
    windowW(40,8,50,30,t,tod);curtains(40,8,50,30);windowW(110,8,50,30,t,tod);curtains(110,8,50,30);clock(176,18,t);
    chalkboard(200,8,64,32,[['CAT CAFE',4],['1024',12,'#ffd84a',2],['TODAY '+String(S.count).padStart(2,'0'),25,'#f4a6b8']]);poster(270,12,'cat');
    neon(402,8,'1024','#8fe0ff',t,2);poster(452,12,'1024');mat(300,306,46);
    const L=[[168,()=>{counter(178,140,124,28);coffeeMachine(186,123,t,S.brew>0);yarnBasket(222,130,S.basket,t);yarnBasket(250,130,3,t+.5);box(280,132,16,11,'#6b7480');R(282,134,12,4,'#b8f0c8');R(278,142,20,2,OL)}],
      [105,()=>guestTable(26,82,40,HUMANS[0],t,0,{item:'cup'})],[105,()=>guestTable(94,82,40,HUMANS[3],t,.8,{item:'cup2'})],[163,()=>guestTable(58,140,40,HUMANS[1],t,1.6,{typing:1,item:'laptop'})],
      [82,()=>workDesk(304,52,HUMANS[2],t,0)],[82,()=>workDesk(348,52,HUMANS[4],t,1)],[82,()=>workDesk(392,52,HUMANS[5],t,2)],[58,()=>plant(446,34,t)],
      [163,()=>guestTable(396,140,40,HUMANS[5],t,.4,{item:'cup'})],[221,()=>guestTable(416,198,40,HUMANS[4],t,2.2,{item:'laptop',typing:1})],
      [270,()=>sofa(18,240,60)],[266,()=>catTree(96,196,t)],[294,()=>cardbox(140,278,1,t,4)],[309,()=>bowls(24,302,1)],[270,()=>lamp(84,232,tod!=='day')],[208,()=>plant(8,184,t)],
      [306,()=>mailbox(360,280,S.mail||0,t)],[306,()=>plant(410,282,t)]];
    paint(L.concat(catList(S,t)));
    guestBubble(26,82,40,'yarn',t);guestBubble(94,82,40,'dots',t);guestBubble(58,140,40,'heart',t);guestBubble(396,140,40,'yarn',t);bubble(365,36,'at',t);
    applyTod(480,320,tod,this.lights)}};
const M3_STATE=()=>({count:21,basket:4,cats:[{k:'lick',b:6,x:292,y:146,z:168.5},{k:'sleep',b:1,x:40,y:259,z:270.5},{k:'lie',b:2,x:115,y:208,z:266.5,o:.5},
  {k:'belly',b:5,x:230,y:236},{k:'bat',b:3,x:196,y:258},{k:'sit',b:0,x:250,y:196,me:1},{k:'hold',b:4,x:150,y:120}]});
