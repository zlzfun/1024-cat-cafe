/* 1024 猫咖 · 地图：一栋三层的小楼（设计见 docs/店内设计.md 第一节）。依赖 scene-kit.js、world-kit.js、world4-kit.js、house-kit.js、outdoor-kit.js。
   三层画在同一张大图上、上下错开（中间隔着一大段空白，互不相连）：一楼 y 0～900（连着后院），二楼 y 1400～1940，屋顶 y 2400～2940。宽都是 960。
   这个文件建 WORLD、写一楼；二楼、屋顶在 map-2f.js、map-roof.js，巨树在 map-tree.js，它们往 WORLD 里接着加。
   一楼：上排临街（门厅 · 橱窗长廊 · 1024 舞台），下排（吧台 · 咖啡厅 · 楼梯间），后门出去是后院和河。门开在门厅北墙上，人类永远在门外。
   WORLD = {w,h,floors 楼层,rooms,P 点位,WALK 可走区域,BLOCK 家具占地,portals 上下楼的口子,vac 扫地机器人的地盘,lights 夜灯,bg() 静态底图,wall() 会动的墙面,floor() 地面贴花,props 和猫一起排序的家具,over() 盖在猫上面的}
   S 是场景状态，由 world-play.js 维护；这里只读。 */
const Y2=1400,Y3=2400;   // 二楼、屋顶在大图上的起点
// 夜色（店里永远是晴天的夜里）：tint 是屋里的（点着灯，暖、亮），tintOut 是 out 那几块屋外的（后院和河边，冷、暗）；屋顶整层在屋外
// lv：哪层在上、哪层在下（地下 -1、一楼 0、二楼 1、屋顶 2），楼层签按它排；secret：猫猫星球这种只能坐火箭去的，不进楼层签、补位的猫不去
const FLOORS=[{id:'f1',n:'一楼',lv:0,x:0,y:0,w:960,h:900,tint:'#e0cfc0',tintOut:'#8a86c4',out:[[0,540,960,360]],sub:'门厅 · 橱窗长廊 · 1024 舞台 · 吧台 · 咖啡厅 · 楼梯间 · 后院 · 河边'},
  {id:'f2',n:'二楼',lv:1,x:0,y:Y2,w:960,h:540,tint:'#e0cfc0',sub:'1024 工坊 · 巨树回廊 · 猫猫图书馆 · 大客厅 · 午睡角'},
  {id:'roof',n:'屋顶',lv:2,x:0,y:Y3,w:960,h:540,tod:'night',tint:'#a8a4dc',camDy:-.25,sub:'星空 · 屋脊 · 巨树的树冠'}];
const WROOMS=[
  {id:'hall',f:'f1',n:'门厅',x:0,y:0,w:300,h:250,in:[10,66,280,170],d:'门上的投递口、分球机，接单毯上三个大毛线篮；前台猫在这儿，有事问它'},
  {id:'gallery',f:'f1',n:'橱窗长廊',x:300,y:0,w:360,h:250,in:[306,66,348,170],d:'两扇临街的大橱窗，织好的东西挂在这里；墙上是今天交付了几件的小黑板和爪印墙'},
  {id:'stage',f:'f1',n:'1024 舞台',x:660,y:0,w:300,h:250,in:[668,160,284,76],d:'一座木台子，背后是一整面 1024 背板，台口一支话筒；站上去拍合照。右下角一台抓娃娃机'},
  {id:'bar',f:'f1',n:'吧台',x:0,y:250,w:260,h:290,in:[10,412,240,30],d:'长吧台、大咖啡机和磨豆机、蛋糕柜、高脚凳，吧台上一只招财猫；猫的饭碗、饮水机、鱼缸也在这头'},
  {id:'cafe',f:'f1',n:'咖啡厅',x:260,y:250,w:436,h:290,in:[270,380,416,150],d:'巨树从这里长上去：树根一圈环形长凳，四张小圆桌，头顶的低枝上挂着全店织的成品；角落一台点唱机'},
  {id:'stairs',f:'f1',n:'楼梯间',x:696,y:250,w:264,h:290,in:[712,340,150,180],d:'上二楼的楼梯、零食机和三块爪垫、楼层指示牌、一只大伞桶；后门出去就是后院'},
  {id:'yard',f:'f1',n:'后院',x:0,y:540,w:960,h:204,in:[12,612,930,124],d:'枫树上挂着秋千，落叶堆、鸟浴盆、许愿池、石桌象棋；一条小溪从许愿池流进河里'},
  {id:'river',f:'f1',n:'河边',x:0,y:744,w:960,h:156,in:[12,810,930,66],d:'栈桥上拴着一条小船，自己划着捞毛线球；栈桥尽头能钓鱼，鱼桶里是鱼谱；一家鸭子在河上游；木桥过河，对岸是路标、邮筒和小门'}];
const WP={
  // 门厅
  door:{x:96,y:16},slot:{x:107,y:37},drop:{x:107,y:60},sorter:{x:124,y:24},suckIn:{x:126,y:61},chute:{x:138,y:54},knock:{x:100,y:72},
  baskets:[{x:88,y:140},{x:130,y:128},{x:172,y:140}],xl:{x:70,y:42},xlOut:{x:80,y:70},
  post:{x:276,y:66},postAt:{x:270,y:118},spawn:{x:236,y:206},spawnIn:{x:251,y:220},spawnOut:{x:251,y:238},plantA:{x:8,y:100},
  jar:{x:250,y:16},stand:{x:40,y:64},fdesk:{x:18,y:174},fdeskTop:{x:30,y:178,z:196.5,face:'R'},fdeskFloor:{x:36,y:206},bell:{x:44,y:170},
  // 橱窗长廊
  wins:[{x:316,y:6,w:110,h:40},{x:490,y:6,w:110,h:40}],lines:[{x:321,y:12,w:100},{x:495,y:12,w:100}],sillY:48,hangY:64,board:{x:432,y:6,w:52,h:40},
  paw:{x:612,y:8,w:40,h:40},ink:{x:620,y:62},inkAt:{x:630,y:76},sunA:{x:370,y:92},rugs:[{x:384,y:204},{x:590,y:208}],
  giant:{x:482,y:156},giantPath:[{x:150,y:104},{x:300,y:108},{x:420,y:144}],
  // 1024 舞台
  backdrop:{x:706,y:14,w:208,h:82},stageTop:{x:692,y:98,w:236,h:44},stage:[{x:732,y:128},{x:772,y:130},{x:812,y:128},{x:852,y:130},{x:892,y:128}],
  cam:{x:802,y:204},camAt:{x:810,y:242},shot:{x:700,y:8,w:220,h:150},spots:[{x:672,y:104,dir:1},{x:936,y:104,dir:-1}],spotAt:{x:686,y:152},
  claw:{x:902,y:156},clawAt:{x:893,y:214},mic:{x:809,y:116},micAt:{x:812,y:130},
  // 吧台
  backBar:{x:70,y:296,w:180},espresso:{x:166,y:268},espressoAt:{x:186,y:336},frontBar:{x:44,y:356,w:160},cake:{x:6,y:346},cakeAt:{x:24,y:398},
  stools:[{x:70,y:386},{x:110,y:386},{x:150,y:386}],counterTop:{x:120,y:362,z:382.5},counterFloor:{x:124,y:414},
  maneki:{x:186,y:346},manekiAt:{x:192,y:392},grinder:{x:212,y:270},grinderAt:{x:220,y:336},
  feeds:[{x:16,y:446},{x:66,y:446}],fountain:{x:122,y:468},drinkAt:{x:116,y:494},grass:{x:162,y:466},grassAt:{x:156,y:496},tank:{x:196,y:456},tankView:{x:226,y:516},
  // 咖啡厅
  tables:[{x:318,y:340},{x:614,y:340},{x:318,y:476},{x:614,y:476}],juke:{x:266,y:500},jukeAt:{x:298,y:530},
  // 楼梯间
  treat:{x:712,y:252},plates:[{x:708,y:324},{x:726,y:324},{x:744,y:324}],stairs1:{x:884,y:300,w:52,h:120},backDoor:{x:802,w:36},dockB:{x:918,y:520},vacHomeB:{x:924,y:536},
  // 往下的楼梯口在西南角（正对着通咖啡厅的门洞），伞桶和衣帽架挪到东墙边
  hole0:{x:716,y:446,w:52,h:86},ubin:{x:930,y:482},ubinAt:{x:939,y:514},rack0:{x:940,y:430},dirAt:{x:857,y:318},
  // 后院
  // 秋千挂在枫树右边那根枝上（ax,ay 绳子拴的地方，L 绳长）；落叶堆在它右边，秋千飞出去正好能落进去
  maple:{x:96,y:700},pile:{x:206,y:718},swing:{x:128,y:656,L:36},swingAt:{x:128,y:712},bath:{x:192,y:648},flowers:{x:20,y:600,w:110},pond:{x:430,y:672},
  frogs:[{x:386,y:678},{x:474,y:670},{x:430,y:696},{x:497,y:714}],
  brook:[{x:462,y:682},{x:480,y:700},{x:492,y:720},{x:498,y:752}],bench:{x:409,y:626,w:42},chess:{x:600,y:668},stools2:[{x:582,y:676},{x:624,y:676}],
  flyArea:[30,612,640,120],
  // 河边
  // 两个码头：上游的栈桥（出发的地方）、下游木桥西边的小码头（2026-10-07 加：划到哪个码头都能靠岸，不用划回原处）
  river:{x:0,y:748,w:960,h:48},pier:{x:250,y:726,w:28,h:58},boat:{x:282,y:760},boatEnd:640,boardAt:{x:270,y:764},bucket:{x:262,y:734},bucketAt:{x:266,y:750},
  pier2:{x:690,y:724,w:24,h:46},boat2:{x:626,y:760},boardAt2:{x:702,y:758},
  // 三根钓竿：栈桥尽头、这边岸上、对岸；bob 浮漂落在哪儿
  fishSpots:[{x:258,y:776,face:'L',bob:{x:220,y:772}},{x:546,y:738,face:'R',bob:{x:578,y:764}},{x:420,y:812,face:'L',bob:{x:390,y:786}}],
  // 路标在后门一出来的石板地右边，邮筒在橱窗长廊两扇橱窗中间（原来都在河对岸的角上，2026-10-07 挪到人来人往的地方）
  bridge:{x:744,y:738,w:32,h:68},sign:{x:880,y:598},mailbox:{x:451,y:52},gate:{x:842,y:882,w:36},lampP:[{x:560,y:676},{x:790,y:822}]};
// 二楼、屋顶、巨树往 WP 里加点位都走 addP：重名就报错（屋顶的水塔、萤火虫范围曾经盖掉过一楼的鱼缸和后院的蝴蝶）
function addP(o){for(const k in o)if(k in WP)console.error('WP 点位重名：'+k);Object.assign(WP,o)}
const WORLD={w:960,h:Y3+540,   // 后面的地图文件（地下一层、猫猫星球）往下接着加，h 跟着变大
  floors:FLOORS,rooms:WROOMS,P:WP,home:{x:520,y:480},
  WALK:[[8,58,944,190],[272,246,36,62],[582,246,36,62],[792,246,36,62],       // 上排；三个门洞
    [8,306,686,232],[690,380,24,60],[704,306,248,232],[884,298,52,10],         // 吧台 + 咖啡厅；通楼梯间的门洞；楼梯间；楼梯顶
    [802,536,36,64],[8,598,944,144],[252,740,24,44],[692,740,20,26],[746,740,28,66],[8,806,944,74]],   // 后门；后院；栈桥；下游的小码头；木桥；对岸
  BLOCK:[[18,190,36,8],[88,154,40,10],[130,142,40,10],[172,154,40,10],[120,56,34,10],[40,88,32,8],[236,214,30,12],[276,100,16,8],[8,116,14,8],   // 门厅
    [304,216,14,8],[640,212,14,8],                                             // 长廊
    [692,142,98,12],[830,142,98,12],[672,132,12,6],[936,132,12,6],[700,90,220,8],[800,230,18,6],[902,200,36,14],   // 舞台（最后一块是抓娃娃机）
    [70,296,180,22],[44,358,160,24],[6,346,36,36],[72,400,8,6],[112,400,8,6],[152,400,8,6],[14,466,42,10],[64,466,42,10],[120,476,24,8],[160,476,14,7],[196,488,58,12],   // 吧台（最后一块是大鱼缸）
    [416,424,128,32],[318,352,28,8],[614,352,28,8],[318,488,28,8],[614,488,28,8],[302,352,12,8],[350,352,12,8],[598,352,12,8],[646,352,12,8],[302,488,12,8],[350,488,12,8],[598,488,12,8],[646,488,12,8],[266,526,24,10],   // 咖啡厅（最后一块是点唱机）
    [696,300,8,80],[696,440,8,100],[712,296,36,12],[874,300,6,124],[936,300,20,124],[942,470,10,8],[930,500,18,6],[918,522,14,9],[710,446,6,90],[768,446,6,90],[716,462,52,74],[797,444,6,6],   // 楼梯间（往下的楼梯口和两边的栏杆、霓虹牌的柱子）
    [10,598,120,12],[250,600,80,12],[470,600,90,12],[86,692,20,10],[22,630,16,10],[294,704,12,8],[194,664,14,8],[396,660,68,26],[409,636,42,6],[602,678,22,8],[584,682,10,6],[626,682,10,6],[559,704,8,6],[644,664,14,8],   // 后院
    [878,638,6,6],[455,82,8,6],   // 后门外的路标、长廊里的邮筒
    [790,856,8,6],[52,850,12,10],[150,842,12,10],[318,852,12,10],[486,846,12,10]],   // 对岸
  // 上下楼：auto 走到口子里就换层，walk 寻路会用它；zone 口子，at 寻路走到哪儿，dir 走进去的方向，out 另一层出来的地方，outDir 出来以后再走两步的方向
  portals:[{id:'s12',from:'f1',to:'f2',n:'楼梯（上二楼）',k:'walk',auto:1,walk:1,zone:[884,298,52,16],at:{x:910,y:306},dir:{x:0,y:-1},out:{x:860,y:Y2+318,face:'L'},outDir:{x:-1,y:0}},
    {id:'s21',from:'f2',to:'f1',n:'楼梯（下一楼）',k:'walk',auto:1,walk:1,zone:[880,Y2+302,14,22],at:{x:886,y:Y2+312},dir:{x:1,y:0},out:{x:910,y:432,face:'R'},outDir:{x:0,y:1}}],
  vac:[],lights:[]};
// 夜里亮着的灯：门厅的霓虹和壁灯、橱窗外的路灯（黄昏）、舞台的追光、吧台和咖啡厅的吊灯、楼梯间的壁灯、后院的路灯和窗户
WORLD.lights.push({x:34,y:15,r:20,col:'#ff5a8a',when:'night'},{x:107,y:24,r:12,col:'#ffcf70',when:'night',a:.6},{x:255,y:22,r:12,col:'#ffe890',when:'night'},
  {x:371,y:26,r:52,col:'#ffb070',when:'dusk'},{x:545,y:26,r:52,col:'#ffb070',when:'dusk'},{x:371,y:26,r:40,col:'#9fb4ff',when:'night',a:.6},{x:545,y:26,r:40,col:'#9fb4ff',when:'night',a:.6},
  {x:760,y:120,r:60,col:'#ff8ac8',when:'night',a:.7},{x:870,y:120,r:60,col:'#8ac8ff',when:'night',a:.7},{x:810,y:52,r:70,col:'#f4a6b8',when:'night',a:.5},
  {x:170,y:290,r:26,col:'#9fe8d8',when:'night',a:.6},{x:124,y:350,r:40,col:'#ffcf70'},{x:225,y:470,r:30,col:'#8fe0ff',when:'night'},
  ...[0,1,2,3].map(i=>({x:WP.tables[i].x+14,y:WP.tables[i].y-16,r:40,col:'#ffcf70'})),{x:353,y:268,r:20,col:'#ffcf70',when:'night'},{x:609,y:268,r:20,col:'#ffcf70',when:'night'},
  {x:730,y:276,r:30,col:'#d0a0ff',when:'night'},{x:850,y:276,r:22,col:'#ffcf70',when:'night'},
  ...[[60,560],[170,560],[352,560],[612,560],[900,560]].map(([x,y])=>({x,y,r:30,col:'#ffcf70',when:'night',a:.7})),
  ...WP.lampP.map(l=>({x:l.x+3,y:l.y+4,r:28,col:'#ffe08a',when:'night'})),{x:820,y:566,r:20,col:'#ffcf70',when:'night'},{x:WP.pier2.x+WP.pier2.w-3,y:WP.pier2.y-22,r:24,col:'#ffe08a',when:'night'});
// 扫地机器人 B：吧台、咖啡厅、楼梯间
WORLD.vac.push({home:WP.vacHomeB,dock:WP.dockB,area:[[16,412,240,120],[270,312,420,224],[690,384,24,52],[712,340,160,96],[780,436,92,94]]});

/* ---------- 一楼的画法 ---------- */
const F1={
  bg(){const P=WP;
    // 上排：临街的北墙，三间房三种墙面；中间两根柱子
    wall(0,0,300,56,'cream');wall(300,0,360,56,'butter');wallStage(660,0,300,56);pillar(296,0,56);pillar(656,0,56);
    floorPlanks(0,56,300,194,'honey');floorPlanks(300,56,360,194,'pale');floorPlanks(660,56,300,194,'dark');
    // 门厅：衣帽钩、架子上的星星罐子、门前地垫、接单毯
    hooks(16,30,[{kind:'hat',ci:0},{kind:'scarf',ci:1},{kind:'mitten',ci:3}]);R(240,30,28,3,OL);R(241,30,26,2,'#a8703f');mat(94,58,28);
    rugOval(150,158,94,32,'#d98a6a','#b5654a');rugOval(150,158,70,22,'#f2c69a','#d98a6a');for(let i=0;i<24;i++){const a=i/24*Math.PI*2;P1(Math.round(150+Math.cos(a)*84),Math.round(158+Math.sin(a)*28),'#fff4dc')}
    // 长廊：两块解球毯
    rugOval(P.rugs[0].x,P.rugs[0].y,40,13,'#8cc4b0','#6aa490');rugOval(P.rugs[1].x,P.rugs[1].y,36,12,'#f4c8a0','#d8a878');
    // 舞台：红地毯从相机铺到台阶前
    R(792,160,36,90,'#8a2a3a');R(794,160,32,90,'#b8404c');for(let j=164;j<250;j+=6)R(796,j,28,1,'#a8343f');R(792,160,1,90,'#c8a050');R(827,160,1,90,'#c8a050');
    // 上下两排之间的墙，三个门洞（避开树干）
    const DOORS=[[272,36],[582,36],[792,36]];
    wallTop(0,250,960,6);wallTiles(0,256,260,44);wall(260,256,436,44,'peach');wallBrickIn(696,256,264,44);
    DOORS.forEach(([x,w])=>{R(x,250,w,50,'#000');floorPlanks(x,250,w,28,x<300?'honey':x<660?'pale':'dark');floorPlanks(x,278,w,22,x<300?'honey':'honey');jamb(x-3,250,50);jamb(x+w,250,50);R(x,250,w,1,'#8a5a3a')});
    // 下排的地面：吧台黑白格、咖啡厅人字拼、楼梯间石板；和楼梯间之间一道墙（开门洞）
    floorChecker(0,300,260,240);floorHerring(260,300,436,240);floorSlate(704,300,256,240);floorHerring(272,278,36,22);floorHerring(582,278,36,22);floorSlate(792,278,36,22);
    wallTop(696,300,8,80);wallTop(696,440,8,100);R(696,380,8,8,'#d8a07a');R(696,386,8,2,'#4a2e22');floorSlate(696,388,8,52);
    // 吧台：墙上的菜单，猫饭角的薄荷绿垫子
    menuBoard(10,262,52,32);rugRect(8,440,190,72,'#cfe8dc','#a8d0c0');
    // 咖啡厅：树下的大圆地毯（北墙上是巨树的两根低枝，门洞边不挂相框）
    rugOval(480,452,104,30,'#d8a070','#b07a48');rugOval(480,452,86,22,'#e8bc8a','#d8a070');
    // 楼梯间：通往哪层的招牌（夹在门洞和楼梯口之间，两边都留空）；楼梯。北墙是隔墙，隔壁是舞台，不开窗
    floorDirectory(836,260);stairsUp(P.stairs1.x,P.stairs1.y,P.stairs1.w,P.stairs1.h);stairsDown(P.hole0.x,P.hole0.y,P.hole0.w,P.hole0.h);
    // 门洞上的招牌
    signOver(290,251,'CAFE','cup');signOver(600,251,'CAFE','cup');signOver(810,251,'UP','up');
    // 店的南墙（从后院看是背面），后门
    wallTop(0,540,960,6);facade(0,546,960,50,{wins:[[40,40],[150,40],[332,44],[590,44],[880,40]],doors:[[P.backDoor.x,P.backDoor.w]]});
    R(P.backDoor.x,540,P.backDoor.w,6,'#cfc6b8');floorSlate(P.backDoor.x,536,P.backDoor.w,10);
    // 后院：草地、后门外的石板地、花坛、小溪和踏脚石、石子路
    floorGrass(0,596,960,152);patio(740,596,180,40);flowerBed(P.flowers.x,P.flowers.y,P.flowers.w);flowerBed(250,600,80);flowerBed(470,600,90);
    // 许愿池四周一圈石子小路
    for(let i=0;i<28;i++){const a=i/28*Math.PI*2;stones([[Math.round(P.pond.x+Math.cos(a)*50),Math.round(P.pond.y+Math.sin(a)*22)]])}
    brook(P.brook,7,0);[[478,694],[488,708]].forEach(([x,y])=>steppingStone(x,y));
    stones([[820,642],[810,660],[798,678],[786,696],[774,714],[764,730],[700,640],[660,644],[540,644],[500,640]]);
    // 河：河床、两岸；对岸的草地、通到小门的石子路；最下面的篱笆
    floorGrass(0,796,960,104);riverBed(P.river.x,P.river.y,P.river.w,P.river.h);stones([[762,814],[778,826],[796,838],[816,850],[832,864],[850,876],[740,820],[700,824],[660,820]]);
    [[30,4],[180,3],[330,5],[600,3],[880,4]].forEach(([x,n])=>reeds(x,748,0,n));[[110,796],[420,796],[640,796],[920,796]].forEach(([x,y])=>reeds(x,y+8,0,3))},
  // 墙面上会动的：橱窗外的天色和晾衣绳、小黑板的数、钟、霓虹、咖啡机、看板、门；舞台背板的串灯
  wall(t,S,vis){const P=WP,tod=S.tod||'day',wx=S.weather||'sun';
    if(vis(0,0,300,70)){neon(14,10,'OPEN','#ff7a9a',t);clock(286,16,t);door(P.door.x,P.door.y,t,{ring:S.door&&S.door.ring>0,flap:S.door&&S.door.flap>0,tod});xlHatch(P.xl.x,P.xl.y,S.xl>0);corkboard(168,10,60,34,S.pending||0)}
    if(vis(300,0,360,60)){P.wins.forEach((W,k)=>{const Ln=P.lines[k],b=(S.birds||[])[k];windowW(W.x,W.y,W.w,W.h,t,tod,{weather:wx,cross:0,inside:()=>{if(b)bird(b.x,W.y+W.h-4,t,b);clothesline(Ln.x,Ln.y,Ln.w,(S.lines||[])[k]||[],7)}});curtains(W.x,W.y,W.w,W.h)});
      const n=String(S.count||0),B=P.board;chalkboard(B.x,B.y,B.w,B.h,[['TODAY',4],[n,15,'#ffd84a',n.length>2?2:3]]);if(S.goal>0){spark(B.x+4,B.y+6,t);spark(B.x+B.w-5,B.y+B.h-8,t+.3)}
      pawWall(P.paw.x,P.paw.y,P.paw.w,P.paw.h,S.paws||[]);bunting(300,656,1,90);if(S.banner>0)banner(318,1,282,t)}
  },
  // 地面贴花：猫永远在它上面
  floor(t,S,vis){const P=WP,tod=S.tod||'day',sun=(S.weather||'sun')==='sun';
    if(sun&&vis(310,50,300,120)){sunbeam(320,50,100,70,30,t,tod);sunbeam(494,50,100,70,30,t,tod)}
    if(vis(700,316,70,20))P.plates.forEach((p,i)=>pawPlate(p.x,p.y,(S.plates||[])[i]));
    if(vis(0,750,960,80)){C.save();C.beginPath();C.rect(P.river.x,P.river.y+1,P.river.w,P.river.h-2);C.clip();riverFlow(P.river.x,P.river.y,P.river.w,P.river.h,t);C.restore();
      [[60,760,0],[140,782,1],[392,766,0],[540,780,1],[680,760,0],[880,784,1]].forEach(([x,y,f])=>lilyPad(x+Math.round(Math.sin(t*.4+x)*1),y,f))}
    if(vis(440,690,80,90))brookShine(P.brook,t);
    if(vis(380,640,100,60))pond(P.pond.x,P.pond.y,t,tod)},
  over(t,S,vis){const wx=S.weather||'sun';
    // 后院在屋外：雨和雪直接落在地上
    if(wx!=='sun'&&vis(0,546,960,354)){const night=S.tod==='night';
      if(wx==='rain'){const col=night?'#6a7ab0':'#dfe8f4';for(let i=0;i<260;i++){const x=(i*37+Math.floor(t*30))%960,y=548+(i*53+Math.floor(t*150))%350;R(x,y,1,3,col)}}
      else for(let i=0;i<200;i++)P1(((i*29+Math.floor(t*6+Math.sin(t*1.3+i)*3))%960+960)%960,548+(i*41+Math.floor(t*16))%350,'#ffffff')}
    // 吧台、咖啡厅的吊灯（挂在猫头顶上）
    if(vis(0,296,700,40)){const on=S.tod!=='day';[94,144,194].forEach(x=>pendant(x,300,26,on));WP.tables.forEach(tb=>pendant(tb.x+14,300,14,on))}}};
WORLD.bg=function(){F1.bg()};WORLD.wall=(t,S,vis)=>F1.wall(t,S,vis);WORLD.floor=(t,S,vis)=>F1.floor(t,S,vis);WORLD.over=(t,S,vis)=>F1.over(t,S,vis);
// 大毛线团解开后织成的横幅，挂在两扇橱窗上沿
function banner(x,y,w,t){for(let i=0;i<w;i++)P1(x+i,y+Math.round(Math.sin(i/w*Math.PI)*3),'#8a5a3a');
  for(let i=4;i<w-4;i+=10){const s=y+Math.round(Math.sin(i/w*Math.PI)*3)+1,ci=Math.floor(i/10)%5;R(x+i-1,s,9,9,OL);R(x+i,s+1,7,7,YARN[ci][0]);R(x+i,s+7,7,1,YARN[ci][1])}
  const s='THANK YOU 1024',tw=txtW(s),sx=x+Math.floor((w-tw)/2);R(sx-3,y+11,tw+6,9,OL);R(sx-2,y+12,tw+4,7,'#fff8e0');txt(s,sx,y+13,'#e0533d');if(Math.floor(t*3)%2){spark(x+6,y+14,t);spark(x+w-6,y+14,t)}}

/* ---------- 和猫一起按 base 排序的家具；live 的每帧画，其余画一次缓存（ver 变了再重画） ---------- */
WORLD.props=(()=>{const P=WP,L=[];const add=(x,y,w,h,base,draw,o={})=>L.push({x,y,w,h,base,draw,...o});
  // 门厅
  add(P.sorter.x-3,P.sorter.y-2,32,44,P.sorter.y+40,(t,S)=>{const s=S.sorter||{};sorter(P.sorter.x,P.sorter.y,t,{balls:(s.balls||[]).map(b=>b.ci??b),pop:s.pop,suck:s.suck})},{live:1});
  P.baskets.forEach((b,i)=>add(b.x-3,b.y-4,48,30,b.y+24,(t,S)=>bigBasket(b.x,b.y,((S.baskets||[])[i]||[]).map(y=>y.ci??y),t),{live:1}));
  add(P.post.x,P.post.y,18,44,P.post.y+42,(t,S)=>scratchPost(P.post.x,P.post.y,t,S.scratch>0),{live:1});
  add(P.spawn.x-6,P.spawn.y-2,42,22,P.spawn.y+20,(t,S)=>welcomeBox(P.spawn.x,P.spawn.y,t,S.spawnPop||0),{live:1});
  add(P.plantA.x,P.plantA.y,16,26,P.plantA.y+24,(t,S)=>plant(P.plantA.x,P.plantA.y,t,S.plantShake>0),{live:1});
  add(P.jar.x-2,P.jar.y-2,14,16,30.5,(t,S)=>starJar(P.jar.x,P.jar.y,t,S.freeze||0),{live:1});
  add(P.stand.x,P.stand.y,32,31,P.stand.y+30,t=>welcomeStand(P.stand.x,P.stand.y,t),{live:1});
  add(P.fdesk.x-4,P.fdesk.y-10,48,34,P.fdesk.y+22,(t,S)=>{frontDesk(P.fdesk.x,P.fdesk.y);serviceBell(P.bell.x,P.bell.y,t,S.bellT||0)},{ver:S=>S.bellT>0?Math.floor(S.now*12)%2+1:0});
  // 长廊
  [[304,192],[640,188]].forEach(([x,y])=>add(x,y,16,26,y+24,t=>plant(x,y,t)));
  // 舞台
  add(P.stageTop.x-2,P.stageTop.y,P.stageTop.w+4,P.stageTop.h+20,P.stageTop.y+2,()=>stagePlatform(P.stageTop.x,P.stageTop.y,P.stageTop.w,P.stageTop.h));
  // 舞台背板：平时是 1024，隔一会儿变成 Tips 大屏（world-more.js 管什么时候变、滚哪一条）
  add(P.backdrop.x-2,P.backdrop.y-2,P.backdrop.w+4,P.backdrop.h+4,P.stageTop.y+3,(t,S)=>{const B=P.backdrop;if(S.tipb&&S.tipb.on)tipBoard(B.x,B.y,B.w,B.h,t,S.tipb);else bigBackdrop(B.x,B.y,B.w,B.h,t)},{live:1});
  P.spots.forEach(s=>add(s.x-2,s.y,16,34,s.y+34,t=>spotlight(s.x,s.y,t,s.dir)));
  add(P.cam.x,P.cam.y-4,16,34,P.cam.y+30,(t,S)=>camBack(P.cam.x,P.cam.y,t,S.cam||{}),{live:1});
  add(P.mic.x,P.mic.y,8,26,P.mic.y+26,(t,S)=>micStand(P.mic.x,P.mic.y,t,S.micT>0),{live:1});
  add(P.claw.x-2,P.claw.y,40,60,P.claw.y+58,(t,S)=>clawMachine(P.claw.x,P.claw.y,t,S.claw||{}),{live:1});
  // 吧台
  add(P.backBar.x,P.backBar.y-44,P.backBar.w,66,P.backBar.y+22,()=>backBar(P.backBar.x,P.backBar.y,P.backBar.w,78));
  add(P.espresso.x-2,P.espresso.y-4,46,34,P.backBar.y+22.1,(t,S)=>espresso(P.espresso.x,P.espresso.y,t,S.brew>0),{live:1});
  add(P.grinder.x-1,P.grinder.y,16,26,P.backBar.y+22.2,(t,S)=>coffeeGrinder(P.grinder.x,P.grinder.y,t,S.grind>0),{live:1});
  add(P.frontBar.x,P.frontBar.y-10,P.frontBar.w,36,P.frontBar.y+26,(t,S)=>{barCounter(P.frontBar.x,P.frontBar.y,P.frontBar.w);(S.lattes||[]).forEach(l=>latte(l.x,P.frontBar.y-4))},{ver:S=>(S.lattes||[]).length});
  add(P.cake.x,P.cake.y,36,36,P.cake.y+36,t=>cakeCase(P.cake.x,P.cake.y,t),{live:1});
  add(P.maneki.x,P.maneki.y,13,14,P.frontBar.y+26.1,(t,S)=>manekiFig(P.maneki.x,P.maneki.y,t,S.maneki>0),{live:1});
  P.stools.forEach(s=>add(s.x,s.y,10,20,s.y+20,()=>barStool(s.x,s.y)));
  P.feeds.forEach((f,i)=>{add(f.x,f.y,14,26,f.y+22,(t,S)=>feeder(f.x,f.y,t,(S.feeds||[])[i]||{}),{live:1});add(f.x-2,f.y+22,40,8,f.y+30,(t,S)=>feedBowls(f.x,f.y,t,(S.feeds||[])[i]||{}),{live:1})});
  add(P.fountain.x,P.fountain.y,22,16,P.fountain.y+16,t=>fountain(P.fountain.x,P.fountain.y,t),{live:1});
  add(P.grass.x,P.grass.y,12,17,P.grass.y+17,(t,S)=>catGrass(P.grass.x,P.grass.y,t,S.grassChew>0),{live:1});
  add(P.tank.x,P.tank.y-1,58,41,P.tank.y+40,(t,S)=>bigFishTank(P.tank.x,P.tank.y,t,{paw:Math.max(0,Math.min(1,S.fishPaw||0)),crystal:S.crystalTank}),{live:1});
  // 咖啡厅：四张小圆桌和椅子（桌上的小东西 world-cafe.js 画）
  P.tables.forEach((tb,i)=>{add(tb.x-16,tb.y+2,12,18,tb.y+20,()=>cafeChair(tb.x-16,tb.y+2,-1));add(tb.x+32,tb.y+2,12,18,tb.y+20,()=>cafeChair(tb.x+32,tb.y+2,1))});
  add(P.juke.x,P.juke.y,24,36,P.juke.y+36,(t,S)=>{const J=S.juke||{};jukebox(P.juke.x,P.juke.y,t,!!J.on,J.track||0)},{live:1});
  // 楼梯间
  add(P.treat.x,P.treat.y,36,56,P.treat.y+56,(t,S)=>treatMachine(P.treat.x,P.treat.y,t,S.treat||{}),{live:1});
  add(874,300,6,124,424,()=>railV(874,300,124));add(P.rack0.x,P.rack0.y,12,40,P.rack0.y+40,()=>coatRack(P.rack0.x,P.rack0.y));
  // 往下的楼梯口：两边栏杆，右上角立一块霓虹牌
  add(770,412,58,38,449,t=>b1Kit.b1Sign(770,412,t),{live:1});
  add(P.hole0.x-6,P.hole0.y,6,P.hole0.h,P.hole0.y+P.hole0.h,()=>railV(P.hole0.x-6,P.hole0.y,P.hole0.h));add(P.hole0.x+P.hole0.w,P.hole0.y,6,P.hole0.h,P.hole0.y+P.hole0.h,()=>railV(P.hole0.x+P.hole0.w,P.hole0.y,P.hole0.h));
  // 大伞桶：后沿和伞先画，猫坐进去，桶身压在猫前面（只露脑袋）
  add(P.ubin.x-2,P.ubin.y-12,22,20,P.ubin.y+6,()=>umbrellaBinBack(P.ubin.x,P.ubin.y));add(P.ubin.x,P.ubin.y+5,18,20,P.ubin.y+24,()=>umbrellaBinFront(P.ubin.x,P.ubin.y));
  add(P.dockB.x-1,P.dockB.y,14,11,P.dockB.y+11,(t,S)=>dock(P.dockB.x,P.dockB.y,t,((S.vacs||[])[0]||{}).charging),{live:1});
  add(712,402,56,12,414,()=>longBench(712,402,56));add(860,494,16,26,518,t=>plant(860,494,t));
  // 后院
  add(P.maple.x-40,P.maple.y-92,80,92,P.maple.y,t=>maple(P.maple.x,P.maple.y,t),{live:1});
  [[30,640,2],[300,712,1],[650,672,2],[360,640,1],[700,700,1],[930,640,2]].forEach(([x,y,k])=>add(x-14,y-18,28,20,y,()=>bush(x,y,k)));
  [[58,860],[156,852],[324,862],[492,856],[600,864]].forEach(([x,y])=>add(x-16,y-40,32,42,y,()=>roundTree(x,y)));
  add(P.pile.x-20,P.pile.y-12,40,12,P.pile.y-4,(t,S)=>leafPile(P.pile.x,P.pile.y,S.pile??1),{ver:S=>Math.round((S.pile??1)*20)});
  add(P.bath.x,P.bath.y,22,22,P.bath.y+22,()=>birdBath(P.bath.x,P.bath.y));
  add(P.bench.x,P.bench.y,P.bench.w,15,P.bench.y+15,()=>bench(P.bench.x,P.bench.y,P.bench.w));
  add(P.chess.x-2,P.chess.y-4,24,24,P.chess.y+18,(t,S)=>stoneTable(P.chess.x,P.chess.y,(S.chess||{}).pieces),{live:1});
  P.stools2.forEach(s=>add(s.x,s.y-2,10,10,s.y+8,()=>stool(s.x,s.y)));
  P.lampP.forEach(l=>add(l.x-1,l.y-1,8,38,l.y+36,(t,S)=>lampPost(l.x,l.y,S.tod!=='day'),{ver:S=>S.tod}));
  // 河边：栈桥、小船、钓竿（会动的那部分在 world-river.js）、木桥、路标、邮筒、篱笆和小门
  add(P.pier.x-2,P.pier.y,P.pier.w+4,P.pier.h+8,P.pier.y+2,()=>pier(P.pier.x,P.pier.y,P.pier.w,P.pier.h));
  add(P.pier2.x-2,P.pier2.y,P.pier2.w+4,P.pier2.h+8,P.pier2.y+2,()=>pier(P.pier2.x,P.pier2.y,P.pier2.w,P.pier2.h));
  add(P.pier2.x+P.pier2.w-6,P.pier2.y-26,8,38,P.pier2.y+12,(t,S)=>lampPost(P.pier2.x+P.pier2.w-6,P.pier2.y-26,S.tod!=='day'),{ver:S=>S.tod});
  add(P.bridge.x-4,P.bridge.y,P.bridge.w+8,P.bridge.h,P.bridge.y+2,()=>bridgeDeck(P.bridge.x,P.bridge.y,P.bridge.w,P.bridge.h));
  [P.bridge.x-3,P.bridge.x+P.bridge.w].forEach(x=>add(x-1,P.bridge.y-4,6,P.bridge.h+4,P.bridge.y+P.bridge.h-2,()=>bridgeRail(x,P.bridge.y-4,P.bridge.h+2)));
  add(P.sign.x-40,P.sign.y,84,46,P.sign.y+44,(t,S)=>signpost(P.sign.x,P.sign.y,t,S.signHl??-1),{live:1});
  add(P.mailbox.x,P.mailbox.y-1,20,36,P.mailbox.y+34,(t,S)=>mailbox(P.mailbox.x,P.mailbox.y,t,S.mailFlag||0),{ver:S=>S.mailFlag>0?1:0});
  add(0,878,960,22,900,()=>{fenceH(0,882,P.gate.x);gardenGate(P.gate.x,P.gate.y,P.gate.w);fenceH(P.gate.x+P.gate.w,882,960-P.gate.x-P.gate.w)});
  return L})();
