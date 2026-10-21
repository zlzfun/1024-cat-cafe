/* 1024 猫咖 · 游戏厅的街机：猫猫咖啡馆（CAT CAFE）。店里的街机里，有一台店。
   一楼按大约三分之一缩进一张 320×196 的小图，屏幕 160×144，镜头跟着你的猫卷动：北边一排门厅、橱窗长廊、1024 舞台，
   南边一排吧台、咖啡厅、楼梯间，中间一道墙开三个门洞。毛线巨树长在咖啡厅正中，树前立着招牌；窗外是夜空，店里永远是晴天的夜里。
   开局和真店里第一次来的猫一样，从巨树上掉下来，落在招牌跟前。
   怎么玩：方向键走（能斜走，撞到家具和墙就停住、贴着滑）；A 和身边的东西打招呼——店猫冒个小气泡、巨树下掉一颗毛线球（走过去能踢）、
   咖啡机咕嘟一杯、前台叮一声、舞台上 1024 背板的灯跑一圈、毛线篮里蹦出一颗球、点唱机放一段；楼梯间墙角还有一台更小的街机。不计分，不会结束。
   六只店猫用店里的毛色和性格：宪宪在树下长凳上睡，砚砚端坐舞台，烁烁满店溜达、自己哼歌，小狸花守着鱼缸，斑斑追毛线球，金哥趴在饭碗边睡。
   取舍：地面、墙和墙上的东西开局画进一张离屏底图；有高度的家具各画一张小图，每帧按脚底 y 和猫、毛线球一起排序贴上（整数位置、1:1，不会糊）；
   会动的（星星、蒸汽、鱼、灯、招牌上的中文）每帧现画。店猫在 4 像素一格的网格上 BFS 找路；你的猫按像素撞墙，过门洞差一两格会自己对齐。 */
ARC.def('cafe',(()=>{
const W=160,H=144,MW=320,MH=196,OL='#3a2630',CR='#fff4dc',GD='#ffd84a',PK='#f4a6b8',RD='#e0533d',CY='#7ae8ff',MI='#7ee08a';
// 店猫的毛色：店里有 BREEDS（cat-sprites.js）就用它，单独试玩没有就用同一组写死的
const FALL=[{body:'#fff3e0',light:'#ffffff',shade:'#e8d2c0',outline:'#5a3a4a',collar:'#e0533d'},
  {body:'#f3ece2',light:'#ffffff',shade:'#d8ccc0',outline:'#5a4a52',points:'#8c7a70',collar:'#9B7EBD'},
  {body:'#9a8a70',light:'#e2d6bf',shade:'#7a6c56',outline:'#3a3028',stripe:'#62533f',collar:'#5B8C5A'},
  {body:'#f1e4c8',light:'#fbf4e4',shade:'#d8c8a8',outline:'#3e3028',points:'#5a4436',collar:'#5B9BD5'},
  {body:'#b99a6c',light:'#e8dcc0',shade:'#9a7e56',outline:'#3e3024',stripe:'#6a5236',collar:'#e0533d'},
  {body:'#e3a456',light:'#f7e0b6',shade:'#c48840',outline:'#4a2c14',spot:'#8a4f1e',collar:'#4a7fd0'},
  {body:'#dcb46c',light:'#f5e6c0',shade:'#bf9752',outline:'#4a3818',stripe:'#c49a50',collar:'#6a4a9a'}];
const BR=i=>(typeof BREEDS!=='undefined'&&BREEDS[i])||FALL[i];
const DESKC={body:'#f4f0f4',light:'#ffffff',shade:'#d8d0dc',outline:'#4a4458',points:'#8a8aa0',collar:CY};   // 前台猫
const PAL=b=>({O:b.outline||OL,b:b.body,l:b.light||b.body,d:b.shade||b.body,c:b.collar||RD,e:b.eye||'#241a2e',n:'#e27a8f',x:b.points||b.body,f:b.stripe||b.spot||b.body});
// 迷你猫：只写里面的颜色，外面自动包一圈描边（O）。w 侧身走两帧（头朝右）、s 正脸端坐、k 端坐眨眼、z 趴着睡
const OUT=r=>{const h=r.length,w=Math.max(...r.map(s=>s.length)),at=(i,j)=>(r[j]||'')[i]||'.',R=[];
  for(let j=-1;j<=h;j++){let s='';for(let i=-1;i<=w;i++){const c=at(i,j);s+=c!=='.'?c:[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>at(i+a,j+b)!=='.')?'O':'.'}R.push(s)}return R};
const CAT={w:[OUT(['x....x..x','x....bbbb','x....bbeb','.ffbfcbbb','.bbbbbll.','.b...b.b.']),OUT(['x....x..x','x....bbbb','x....bbeb','.ffbfcbbb','.bbbbbll.','..b.b..b.'])],
  s:OUT(['x...x.','bfbfb.','bebeb.','bbnbb.','.ccc..','blllbx','bbbbbx']),k:OUT(['x...x.','bfbfb.','bdbdb.','bbnbb.','.ccc..','blllbx','bbbbbx']),
  z:OUT(['......x.x','.bfbfbbbb','bbbbbbddb','xbbbbbbbb'])};
const YARN=[['#e0533d','#9e2f2a','#f7a58c'],['#5B9BD5','#34618f','#a8d0f0'],['#9B7EBD','#654a86','#d0bce4'],['#6aba6a','#3a7a40','#b8e8b0'],['#e8b83a','#9a7414','#fff0a8']];
const BALL=[['.hrr.','hRrRr','rRrRr','rrRrR','.rRr.'],['.rhr.','rRrRh','RrRrr','rRrRr','.Rrr.']];
const NOTE=['.##','.#.','##.','##.'],ZZ=['####','..#.','.#..','####'],EAR=['..O..','.OpO.','OpppO'],MANE=['O.O.','bbbO','bebc','bbbO'];
const ARW={L:['..#..','.#...','#####','.#...','..#..'],R:['..#..','...#.','#####','...#.','..#..'],U:['..#..','.###.','#.#.#','..#..','..#..'],D:['..#..','..#..','#.#.#','.###.','..#..']};
/* ---------- 地图：哪儿走不了（脚底一块 7×2 撞上就算） ---------- */
const DOORS=[[88,101],[184,197],[263,276]],TABLES=[[106,118],[205,118],[106,168],[205,168]],WINS=[106,165];
const BL=[[0,0,MW,20],[0,0,3,MH],[317,0,3,MH],[0,190,MW,6],[0,84,88,17],[101,84,83,17],[197,84,66,17],[276,84,44,17],[231,100,3,26],[231,142,3,48],
  [3,58,18,8],[43,18,8,3],[31,51,13,4],[44,45,13,4],[57,51,13,4],[3,38,6,3],[91,33,6,3],[77,70,12,4],[148,26,5,2],[101,69,6,3],[212,68,6,3],   // 门厅、长廊
  [222,35,6,3],[308,35,6,3],[269,38,3,2],[267,68,6,2],[293,64,18,8],                                                                 // 舞台
  [23,99,62,8],[15,119,54,10],[3,124,12,7],[63,171,23,10],                                                                           // 吧台
  ...TABLES.map(([x,y])=>[x-10,y-2,21,3]),[142,134,36,20],[126,162,69,25],[89,183,10,4],                                             // 咖啡厅
  [236,99,14,5],[291,99,23,48],[236,152,22,36],[266,150,5,4],[287,174,6,3],[304,182,11,6]];                                         // 楼梯间
const hit=(x,y,a=3)=>{for(const r of BL)if(x-a<r[0]+r[2]&&x+a+1>r[0]&&y-1<r[1]+r[3]&&y+1>r[1])return true;return false};
const ROOMS=[['门厅',0,0,100,84],['橱窗长廊',100,0,120,84],['1024 舞台',220,0,100,84],['吧台',0,84,86,112],['咖啡厅',86,84,146,112],['楼梯间',232,84,88,112]];
const roomAt=(x,y)=>ROOMS.findIndex(r=>x>=r[1]&&x<r[1]+r[3]&&y>=r[2]&&y<r[2]+r[4]);
// 店猫找路：4 像素一格，八个方向，斜着走要两边都空
const CS=4,GW=MW/CS,GH=Math.ceil(MH/CS),D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];let WK=null;
function route(x0,y0,x1,y1){const s=(y0/CS|0)*GW+(x0/CS|0),e=(y1/CS|0)*GW+(x1/CS|0);if(!WK[e])return null;const pr=new Int32Array(GW*GH).fill(-1);pr[s]=s;const q=[s];
  for(let h=0;h<q.length&&pr[e]<0;h++){const c=q[h],ci=c%GW,cj=c/GW|0;for(const [a,b] of D8){const i=ci+a,j=cj+b;if(i<0||j<0||i>=GW||j>=GH)continue;const n=j*GW+i;
    if(pr[n]>=0||!WK[n]||(a&&b&&(!WK[cj*GW+i]||!WK[j*GW+ci])))continue;pr[n]=c;q.push(n)}}
  if(pr[e]<0)return null;const P=[{x:x1,y:y1}];for(let c=pr[e];c!==s;c=pr[c])P.unshift({x:c%GW*CS+2,y:(c/GW|0)*CS+2});return P}
// 你的猫：先横后竖，撞了就停；只按一个方向时差几格对不上门洞，自己往空的那边挪
const nudge=(o,ax,mx,my)=>{for(let d=1;d<=4;d++)for(const s of [1,-1])if(ax?!hit(o.x+mx,o.y+s*d)&&!hit(o.x,o.y+s*.5):!hit(o.x+s*d,o.y+my)&&!hit(o.x+s*.5,o.y)){if(ax)o.y+=s*.5;else o.x+=s*.5;return 1}return 0};
function move(o,mx,my){let m=0;if(mx){if(!hit(o.x+mx,o.y)){o.x+=mx;m=1}else if(!my)m=nudge(o,1,mx,0)}if(my){if(!hit(o.x,o.y+my)){o.y+=my;m=1}else if(!mx)m=nudge(o,0,0,my)}return m}
/* ---------- 店猫：毛色序号、爱待的地方、睡着的概率、走多快 ---------- */
const SHOP=[{i:1,at:[[128,151],[192,151],[134,158],[121,128]],zz:.6,v:.3},                        // 宪宪：树下长凳，最爱睡
  {i:2,at:[[262,42],[246,40],[120,24],[186,25]],zz:.12,v:.35},                                      // 砚砚：舞台上端坐、橱窗底下
  {i:3,at:[[78,62],[140,58],[180,108],[255,124],[122,186],[40,140],[290,82],[200,40]],zz:.06,v:.45,talk:1},   // 烁烁：满店溜达
  {i:4,at:[[74,186],[70,186],[78,186],[50,142]],zz:.1,v:.4},                                        // 小狸花：守着鱼缸
  {i:5,at:[[50,66],[84,60],[170,106],[120,140],[24,74]],zz:.06,v:.55,ball:1},                       // 斑斑：毛线篮边，追毛线球
  {i:6,at:[[23,176],[38,177]],zz:.9,v:.25}];                                                         // 金哥：饭碗边睡
const SPOT=[{id:'bell',x:16,y:70,r:13,mk:[17,49]},{id:'yarn',x:50,y:60,r:20,mk:[50,36]},
  {id:'tree',in:p=>((p.x-160)/50)**2+((p.y-147)/22)**2<1,mk:[160,105]},{id:'coffee',x:62,y:112,r:16,mk:[78,84]},
  {id:'stage',in:p=>p.x>222&&p.x<316&&p.y<48,mk:[270,22]},{id:'juke',x:94,y:187,r:12,mk:[94,165]},{id:'tank',x:74,y:186,r:11,mk:[74,151]},
  {id:'arcade',x:309,y:190,r:13,mk:[309,165]}];
/* ---------- 画画的小工具 ---------- */
const mkcv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const bake=(r,f)=>{const cv=mkcv(r[2],r[3]),k=ARC.kit(cv);k.c.translate(-r[0],-r[1]);f(k);return cv};
// 逐点给颜色，一行里同色的并成一笔
function fill(k,x0,y0,w,h,fn){for(let y=y0;y<y0+h;y++){let s=x0,c=fn(x0,y);for(let x=x0+1;x<=x0+w;x++){const n=x<x0+w?fn(x,y):0;if(n!==c){if(c)k.rect(s,y,x-s,1,c);s=x;c=n}}}}
const ell=(k,cx,cy,rx,ry,col)=>{for(let y=-ry;y<=ry;y++){const s=Math.round(rx*Math.sqrt(Math.max(0,1-(y/(ry+.5))**2)));k.rect(cx-s,cy+y,2*s+1,1,col)}};
const hs=(a,b)=>(((a*73856093)^(b*19349663))>>>0)%997;
const cat=(x,P,cx,cy,pose,face,fr)=>{cx=Math.round(cx);cy=Math.round(cy);if(pose==='w')x.spr(CAT.w[fr&1],cx-5,cy-7,P,face<0);else if(pose==='z')x.spr(CAT.z,cx-5,cy-5,P,face<0);
  else x.spr(CAT[pose],cx-3,cy-8,P,face<0)};
/* ---------- 地面：木地板、黑白格、人字拼、石板 ---------- */
const HALL=['#b17245','#a5683d','#8a5534'],GAL=['#cda878','#c39c6a','#a8845a'],GAL2=['#dfc193','#d6b585','#b8966a'],STF=['#7b4d2e','#71462a','#55331e'],STT=['#8c5a37','#815232','#5e3a22'],
  CAF=['#b07747','#a87043','#92603a'],CAF2=['#c48b55','#bc834f','#a46e44'];
const PL=(x,y,P,o)=>{const r=y>>2;if((y&3)===3)return P[2];const u=x+o+r*11;return u%18===0?P[2]:P[hs(u/18|0,r)%3===0?1:0]};
const HB=(x,y,P)=>{const u=(x>>2)&1?x+y:x-y+400;return u%4===0?P[2]:P[(u>>2)&1]};
const beam=(x,y)=>{if(y>=60)return false;for(const a of WINS){const s=(y-18)*.45;if(x>=a+1+s&&x<=a+34+s)return y<50||(x*3+y)%(y<55?2:4)===0}return false};
const glow=(x,y)=>{for(const [a,b] of TABLES){const d=((x-a)/13)**2+((y-b-3)/8)**2;if(d<.55||(d<1&&!((x+y)&1)))return true}return false};
function floorC(x,y){if(y<84){if(x<100)return PL(x,y,HALL,0);if(x<220)return PL(x,y,beam(x,y)?GAL2:GAL,5);return PL(x,y,y<45&&x>221&&x<316?STT:STF,3)}
  if(x<86)return ((x>>2)+(y>>2))&1?'#3a3036':'#e4d2ba';
  if(x<232)return HB(x,y,glow(x,y)?CAF2:CAF);
  const r=y>>2;if((y&3)===3)return '#776a66';const u=x+(r&1)*4;return u%8===0?'#776a66':['#958782','#8d7f7a','#9b8d88'][hs(u>>3,r)%3]}
const TW=[];   // 窗里会眨的星星
function buildBG(){const cv=mkcv(MW,MH),k=ARC.kit(cv);
  fill(k,0,18,MW,66,floorC);fill(k,0,100,MW,90,floorC);
  // 地毯、长凳、猫的饭垫、红地毯、舞台台口
  ell(k,50,52,31,10,'#c8786a');ell(k,50,52,30,9,'#e09a88');ell(k,50,52,24,7,'#eab0a0');for(let i=0;i<14;i++){const a=i/14*Math.PI*2;k.px(50+Math.cos(a)*27,52+Math.sin(a)*8,CR)}
  ell(k,128,68,14,5,'#4f8a7a');ell(k,128,68,13,4,'#6aa894');ell(k,197,69,12,4,'#c87a72');ell(k,197,69,11,3,'#e0a090');
  ell(k,160,152,43,14,'#a87048');ell(k,160,152,42,13,'#c99060');ell(k,160,152,35,11,'#d5a070');ell(k,160,154,29,8,'#5a3820');ell(k,160,152,28,7,'#a0683a');ell(k,160,151,21,5,'#8a5832');ell(k,160,151,20,4,'#a0683a');
  k.rect(4,152,57,30,'#9ab09a');k.rect(5,153,55,28,'#bcd2bc');for(let i=6;i<59;i+=3){k.px(i,153,'#d8e8d8');k.px(i,180,'#d8e8d8')}
  for(const b of [12,28]){k.rect(b,166,6,2,'#a0302a');k.rect(b+1,165,4,1,'#7a4a2a');k.rect(b,168,6,1,'#7a2020')}
  ell(k,45,168,3,1,'#5a8ab0');k.px(45,167,'#a8d8f0');k.rect(53,165,4,3,'#c0603a');k.rect(53,162,1,3,'#5aaa5a');k.rect(55,161,1,4,'#3a8a4a');k.px(56,163,'#5aaa5a');
  k.rect(222,45,94,1,'#9c6a8a');k.rect(222,46,94,2,'#4e2c45');for(let i=225;i<315;i+=6)k.px(i,46,GD);
  k.rect(263,45,14,39,'#b8383a');k.rect(263,45,1,39,'#d85a50');k.rect(276,45,1,39,'#8a2a2c');for(let y=49;y<84;y+=6)k.rect(264,y,12,1,'#a83034');
  for(const a of [237,242,247]){k.rect(a,107,4,2,'#e8dcc4');k.px(a,108,'#c8b49a')}
  // 上二楼的楼梯（东墙边）、下地下的楼梯口（西南角）
  k.rect(294,99,19,5,'#2a1a20');for(let y=104;y<146;y+=4){k.rect(294,y,19,3,'#b88a58');k.rect(294,y+3,19,1,'#7a5434')}k.rect(292,99,2,48,'#5e3a24');k.rect(313,99,2,48,'#5e3a24');
  for(let y=102;y<146;y+=6){k.px(292,y,'#8a5a3a');k.px(314,y,'#8a5a3a')}
  k.rect(237,153,21,34,'#3a3036');k.rect(237,153,21,1,'#b8aaa4');const DN=['#a07850','#8a6440','#705030','#58402a','#40301f','#2a2018','#1a1410','#120e0c'];
  DN.forEach((c,i)=>{k.rect(239,155+i*4,17,3,c);k.rect(239,158+i*4,17,1,'#0e0a08')});k.rect(237,153,2,34,'#5e3a24');k.rect(256,153,2,34,'#5e3a24');
  // 北墙：门厅（条纹墙纸）、长廊（橱窗）、舞台（星空紫的墙和红幕）
  k.rect(0,0,MW,2,'#2a1a20');fill(k,3,2,97,14,x=>x%4===0?'#cfa984':'#dcbb96');fill(k,102,2,116,14,x=>x%4===0?'#d8c0a4':'#e6d2ba');
  fill(k,220,2,97,16,(x,y)=>hs(x,y)%61===0?CR:hs(x,y)%37===0?'#6a5a8a':'#231938');k.rect(3,16,215,2,'#875136');k.rect(3,16,215,1,'#a86a44');
  k.rect(8,3,18,9,'#4a3a4a');k.rect(9,4,16,7,'#1a1220');                                                          // OPEN 霓虹（字现画）
  k.rect(29,2,14,15,'#5e3a24');k.rect(30,3,12,14,'#8a5a3a');k.rect(31,4,10,4,'#2e3266');k.px(34,5,CR);k.px(38,6,'#c8c8f0');k.rect(32,10,8,1,GD);k.rect(31,12,4,4,'#7a4a2e');k.rect(37,12,4,4,'#7a4a2e');k.px(40,11,GD);
  k.rect(29,17,14,2,'#b0503a');k.rect(29,18,14,1,'#8a3a2a');                                                     // 门和门垫
  k.rect(54,3,24,12,'#6a4028');k.rect(55,4,22,10,'#c8955a');for(let i=0;i<6;i++){k.rect(57+i*3,5+(i&1),2,2,CR);k.rect(58+i*3,10-(i&1),2,2,i%3?'#f4d4a0':PK)}   // 软木板
  k.rect(84,5,3,3,'#ffe8a0');k.rect(83,8,5,1,'#8a5a3a');for(const [a,b] of [[82,4],[88,4],[85,3],[82,8],[88,8]])k.px(a,b,'#e8c890');           // 壁灯
  for(const a of [99,217]){k.rect(a,0,3,18,'#f0e4d0');k.rect(a+2,0,1,18,'#d0c0a8');k.rect(a-1,2,5,1,'#d0c0a8');k.rect(a-1,15,5,3,'#c8b49a')}
  for(const a of WINS){k.rect(a-3,1,2,15,'#cc7078');k.rect(a+36,1,2,15,'#cc7078');k.px(a-3,1,'#e88a9a');k.px(a+37,1,'#e88a9a');k.rect(a-1,1,38,15,'#f4ecd8');
    fill(k,a,2,36,12,(x,y)=>y<5?'#1f2248':y<8?'#272a58':((x-a-18)**2/90+(y-9)**2/6<1)?'#4a4a84':'#33376a');
    for(let i=0;i<9;i++){const sx=a+1+hs(i,a)%34,sy=2+hs(a,i)%7;k.px(sx,sy,i%3?'#c8c8f0':CR);TW.push([sx,sy])}
    k.rect(a,12,36,2,'#1c3a2c');for(let i=0;i<36;i+=5)k.rect(a+i+(hs(i,1)%3),11,2+(hs(i,2)%2),1,'#1c3a2c');k.rect(a-2,15,40,1,'#e8dcc4')}
  k.rect(102,1,116,1,'#6a4a3a');for(let i=103,j=0;i<216;i+=4,j++){const c=[RD,GD,MI,CY,PK,'#9B7EBD'][j%6];k.rect(i,2,3,1,c);k.px(i+1,3,c)}   // 彩旗
  k.rect(145,2,17,13,'#6a4028');k.rect(146,3,15,11,'#2e4a3a');k.rect(147,4,9,1,'#c8d8c8');                       // 今天交付几件（数字现画）
  k.rect(204,2,13,14,'#c8b49a');k.rect(205,3,11,12,'#f4ecd8');for(const [a,b] of [[206,4],[211,8],[206,11]]){k.rect(a+1,b+1,3,2,'#c87a8a');k.px(a,b,'#c87a8a');k.px(a+2,b,'#c87a8a');k.px(a+4,b,'#c87a8a')}  // 爪印墙
  for(const a of [220,311]){k.rect(a,0,6,20,'#79222c');for(let i=a+1;i<a+6;i+=2)k.rect(i,0,1,20,'#5d1520');k.rect(a,19,6,1,'#5d1520')}
  k.rect(233,3,75,31,'#8a5a3a');fill(k,234,4,73,29,(x,y)=>hs(y,x)%41===0?CR:hs(y,x)%23===0?'#5a4a7a':'#1c1634');
  for(let i=235,j=0;i<306;i+=4,j++){const c=[RD,GD,MI,CY,PK][j%5];k.rect(i,4,3,1,c);k.px(i+1,5,c)}
  k.text('1024',271,9,PK,{k:2,al:'c',sh:'#7a2a4a'});k.text('CLOWDER CAT CAFE',271,25,GD,{al:'c'});
  // 中间那道墙：吧台的薄荷瓷砖、咖啡厅的条纹墙纸和护墙板、楼梯间的红砖；三个门洞
  k.rect(0,84,MW,2,'#5a3220');k.rect(0,86,MW,1,'#79492c');
  fill(k,3,87,83,13,(x,y)=>(y-87)%3===2||(x+(((y-87)/3|0)&1)*3)%6===0?'#76ae96':'#8cc6ae');
  fill(k,86,87,145,13,(x,y)=>y>=96?(y===96?'#79492c':y===99?'#6a3e22':'#a26342'):x%3===0?'#e9bc94':'#f2caa4');
  fill(k,234,87,83,13,(x,y)=>(y-87)%3===2||(x+(((y-87)/3|0)&1)*3)%6===0?'#7a3a2c':'#9e523b');
  for(const [a,b] of DOORS){fill(k,a,87,b-a,13,floorC);k.rect(a-1,84,1,16,'#4a2a1c');k.rect(b,84,1,16,'#4a2a1c')}
  k.rect(231,87,3,39,'#5a3220');k.rect(232,87,1,39,'#79492c');k.rect(231,142,3,48,'#5a3220');k.rect(232,142,1,48,'#79492c');
  k.rect(0,0,3,MH,'#3a2630');k.rect(2,0,1,MH,'#5e3a2e');k.rect(317,0,3,MH,'#3a2630');k.rect(317,0,1,MH,'#5e3a2e');k.rect(0,190,MW,2,'#5a3220');k.rect(0,192,MW,4,'#2a1a20');
  // 吧台的墙：菜单、两层架子、大咖啡机和磨豆机，后吧台
  k.rect(4,87,20,12,'#5e3a24');k.rect(5,88,18,10,'#2a3a2e');k.text('MENU',7,89,GD);k.rect(7,95,14,1,'#c8d8c8');k.rect(7,97,10,1,'#c8d8c8');k.px(19,97,PK);
  k.rect(26,92,25,1,'#6a4028');k.rect(26,97,25,1,'#6a4028');for(let i=0;i<8;i++){k.rect(27+i*3,89,1,3,'#4a2a1c');k.px(27+i*3,88,'#7a5a3a');k.rect(27+i*3,94,2,3,[RD,GD,MI,PK,CY,'#9B7EBD'][i%6])}
  k.rect(54,89,16,11,'#4a4a5a');k.rect(55,90,14,9,'#d8d8e0');k.rect(55,90,14,1,'#f0f0f4');k.rect(66,90,3,9,'#b0b0bc');for(const a of [56,59,62,65])k.rect(a,88,2,1,CR);
  k.rect(60,92,4,2,'#203020');k.px(61,92,MI);k.px(62,93,MI);k.px(57,92,CR);k.px(67,92,CR);k.rect(57,95,2,2,'#3a3a4a');k.rect(65,95,2,2,'#3a3a4a');k.rect(55,98,14,1,'#8a8a9a');
  k.rect(71,90,4,10,'#2a2228');k.rect(71,88,4,2,'#6a4a2a');k.px(72,93,RD);
  k.rect(23,99,62,2,'#e8dcc8');k.rect(23,101,62,6,'#6a4028');for(let i=23;i<85;i+=10){k.rect(i,101,1,6,'#4a2a18');k.px(i+5,103,'#c89a1e')}k.rect(23,107,62,1,'#3a2018');
  // 巨树的两根低枝：贴着墙铺开，挂着金叶子和全店织的成品
  for(const s of [-1,1]){for(let i=0;i<46;i++){const x=s<0?145-i:175+i,y=93-Math.round(i*3/46);k.rect(x,y,1,3,'#8a5a32');k.px(x,y,'#a76e3d');k.px(x,y+3,'#5a3820')}
    for(let i=0;i<9;i++){const x=s<0?127-i:193+i,y=93+Math.round(i*.7);k.rect(x,y,1,2,'#7a4c2a');k.px(x,y+2,'#5a3820')}
    for(const d of [7,20,33,44]){const x=160+s*(14+d),y=89-Math.round(d*3/46);ell(k,x,y,5,2,'#b8761a');ell(k,x-1,y-1,4,1,'#e9be5f');k.px(x-2,y-2,GD);k.px(x+1,y-1,'#fff0a8');k.px(x+3,y,'#e9be5f')}
    for(let i=0;i<4;i++)k.rect(160+s*(19+i),94,1,4,[RD,'#5B9BD5',MI,'#9B7EBD'][i])}
  // 楼梯间的墙：零食机、楼层指示牌
  k.rect(236,83,14,20,'#4a3a6a');k.rect(237,84,12,18,'#9a88c8');k.rect(237,84,12,3,'#7a68a8');k.rect(239,85,8,1,GD);k.rect(238,88,8,9,'#f4f0f8');
  for(let j=0;j<3;j++)for(let i=0;i<3;i++)k.rect(239+i*2.6,89+j*3,2,1,[RD,'#5B9BD5',GD][(i+j)%3]);k.rect(247,88,1,6,'#5a4a8a');k.rect(238,98,8,2,'#2a2040');
  k.rect(280,87,12,12,'#2a2030');[GD,PK,MI,PK].forEach((c,i)=>{k.px(282,89+i*2.5,c);k.rect(285,89+i*2.5,5,1,'#6a6a7a')});
  WK=new Uint8Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)WK[j*GW+i]=hit(i*CS+2,j*CS+2)?0:1;
  return cv}
/* ---------- 有高度的东西：和猫一起按脚底排序 ---------- */
const PROPS=[],prop=(r,by,f,dyn)=>PROPS.push({r,by,f,dyn});
const plant=(x,y)=>prop([x-4,y-12,9,13],y,k=>{k.rect(x-2,y-3,5,3,'#c0603a');k.rect(x-3,y-4,7,1,'#d87a4a');k.disc(x,y-8,3,'#3a8a4a');k.px(x-1,y-10,'#5aaa5a');k.px(x+1,y-8,'#5aaa5a');k.px(x-2,y-7,'#2a6a3a')});
// 门厅：分球机、前台（前台猫另算一只猫）、三个大毛线篮、植物、猫爬柱、纸箱
prop([42,3,11,18],20,k=>{k.disc(47,8,4,'#8a8a9a');k.disc(47,8,3,'#e8eef4');k.px(46,6,'#fff');k.px(46,9,RD);k.px(48,8,CY);k.px(47,10,GD);k.px(49,10,MI);
  k.rect(43,12,9,8,'#a0302a');k.rect(44,12,7,7,'#d04a3a');k.rect(45,14,5,2,'#2a1a20');k.px(47,17,GD)});
prop([2,54,21,13],66,k=>{k.rect(3,56,18,2,'#5aa0a0');k.rect(3,58,18,8,'#2e6a6a');k.rect(3,58,18,1,'#244e4e');k.rect(5,59,14,6,'#c89a1e');k.rect(6,60,12,4,GD);k.text('ASK',6,60,OL);
  k.rect(2,56,1,10,OL);k.rect(21,56,1,10,OL);k.rect(3,65,18,1,'#1a3a3a')},(x,g)=>{x.rect(16,55,3,1,GD);x.px(17,54,GD);x.rect(15,56,5,1,'#c89a1e');
  if(g.bell>0&&(g.bell>>2)&1)for(const [a,b] of [[13,52],[21,52],[17,50],[12,55],[22,55]])x.px(a,b,CR)});
const BASK=[[37,55],[50,49],[63,55]];
BASK.forEach(([x,y],i)=>prop([x-7,y-8,15,9],y,k=>{k.rect(x-6,y-5,13,5,'#a0703a');k.rect(x-6,y-6,13,1,'#c89050');for(let j=x-5;j<x+7;j+=2)k.rect(j,y-4,1,3,'#7a5028');k.rect(x-6,y-1,13,1,'#6a4020');
  [[x-3,y-7,i],[x+1,y-7,i+1],[x+4,y-6,i+3]].forEach(([a,b,c])=>{k.rect(a-1,b,3,2,YARN[c%5][0]);k.px(a-1,b,YARN[c%5][2])});k.px(x+6,y-8,CR)}));
plant(5,41);plant(104,72);plant(215,71);plant(290,177);
prop([89,19,9,17],35,k=>{k.rect(90,33,7,2,'#9a88c0');k.rect(92,22,3,11,'#d8c098');for(let y=23;y<33;y+=2)k.rect(92,y,3,1,'#b8a078');k.rect(90,20,7,2,'#9a88c0');k.rect(96,22,1,4,'#8a7a9a');k.px(96,26,PK)});
prop([76,64,15,11],74,k=>{k.rect(76,65,14,1,'#a88050');k.rect(77,66,12,8,'#8a6a40');k.rect(78,67,10,6,'#c8a070');k.text('HI',79,68,'#6a4a2a');k.px(87,69,RD);k.px(86,70,RD);k.px(87,71,RD)});
// 长廊：红邮筒；舞台：聚光灯、话筒、三脚架上的相机、抓娃娃机
prop([146,15,10,14],28,k=>{k.rect(150,22,1,6,OL);k.rect(147,17,7,5,'#c0302a');k.rect(147,16,7,1,RD);k.rect(148,18,5,1,'#5a1a1a');k.px(154,16,GD);k.px(154,17,GD)});
for(const [x,d] of [[225,1],[311,-1]])prop([x-4,24,9,15],38,k=>{k.line(x,31,x-2,37,'#3a3040');k.line(x,31,x+2,37,'#3a3040');k.rect(x,30,1,8,'#3a3040');k.rect(x-2,26,5,4,'#4a4a5a');k.rect(x-2,26,5,1,'#6a6a7a');k.px(x+d*2,28,CR)});
prop([267,27,6,14],40,k=>{k.rect(270,31,1,9,'#5a5a6a');k.rect(269,28,3,3,'#3a3a4a');k.px(270,29,'#8a8a9a');k.rect(268,40,5,1,'#3a3a4a')});
prop([265,58,11,13],70,k=>{k.line(270,65,267,70,'#3a3040');k.line(270,65,273,70,'#3a3040');k.rect(270,65,1,5,'#3a3040');k.rect(267,60,7,5,'#2a2a34');k.rect(268,61,3,3,'#4a4a5a');k.px(269,62,CY);k.rect(268,59,2,1,'#3a3a44');k.px(273,61,RD)});
prop([292,47,20,26],72,k=>{k.rect(292,47,20,25,OL);k.rect(293,48,18,4,'#e05a8a');for(let i=295;i<310;i+=3)k.px(i,49,CR);k.rect(294,52,16,11,'#3a2a4a');k.rect(294,52,16,1,'#5a4a7a');
  k.rect(301,53,1,3,'#c8c8d0');k.rect(300,56,3,1,'#c8c8d0');[[296,61,RD],[299,60,GD],[302,61,MI],[305,60,CY],[307,61,PK],[297,59,PK],[304,59,GD]].forEach(([a,b,c])=>k.rect(a,b,2,2,c));
  k.rect(293,63,18,9,'#8a6aa8');k.rect(293,63,18,1,'#e05a8a');k.rect(295,65,4,2,'#2a1a30');k.rect(305,66,3,2,GD);k.rect(293,69,18,1,'#6a4a88')});
// 吧台：前吧台（头顶三盏吊灯、一头的招财猫、做好的拉花放在台面上）、蛋糕柜、高脚凳、鱼缸
prop([14,100,57,30],129,k=>{for(const a of [27,41,55]){k.rect(a,101,1,7,OL);k.rect(a-1,108,3,2,'#c89a1e');k.px(a,110,'#ffe295');k.px(a-2,111,'#f0d8a0');k.px(a+2,111,'#f0d8a0')}
  k.rect(14,114,56,1,OL);k.rect(15,115,54,4,'#e8dcc8');for(let i=17;i<68;i+=4)k.px(i+(i&1)*2,116+(i&1),'#d0c0a8');k.rect(15,119,54,1,'#c8b49a');k.rect(15,120,54,9,'#7a4a2c');k.rect(15,120,54,1,'#a06a40');
  for(let i=21;i<68;i+=6)k.rect(i,121,1,7,'#6a3e22');k.rect(15,128,54,1,'#4a2a18');k.rect(14,115,1,14,OL);k.rect(69,115,1,14,OL);
  k.spr(MANE,61,111,{O:'#4a3a3a',b:'#fff8f0',e:OL,c:GD});k.px(64,110,'#fff8f0')},(x,g)=>{for(let i=0;i<g.cups;i++){const a=30+i*7;x.rect(a,115,4,2,CR);x.rect(a,114,4,1,'#c89a6a');x.px(a+1,114,CR);x.rect(a-1,117,6,1,'#d8c8b8')}});
prop([1,112,15,20],131,k=>{k.rect(1,112,15,19,OL);k.rect(2,113,13,10,'#cfe6ec');k.rect(2,113,13,1,'#f4fcff');k.rect(2,118,13,1,'#8aa8b0');
  [[3,116,PK],[6,116,'#8a5a3a'],[9,116,CR],[12,116,GD],[3,121,'#c87a3a'],[7,121,PK],[11,121,MI]].forEach(([a,b,c])=>{k.rect(a,b,2,2,c);k.px(a,b,CR)});k.rect(2,123,13,7,'#7a4a2c');k.rect(8,124,1,5,'#5a3420');k.px(7,126,GD);k.px(9,126,GD)});
for(const a of [24,38,52])prop([a-1,129,3,6],134,k=>{k.rect(a-1,129,3,1,'#c04a3a');k.rect(a-1,130,3,1,'#8a2a2a');k.rect(a,131,1,3,'#5e3a24');k.rect(a-1,134,3,1,'#5e3a24')});
prop([62,156,25,26],180,k=>{k.rect(62,156,25,16,'#3a4a5a');k.rect(63,157,23,13,'#4ab0d8');k.rect(63,157,23,2,'#8ad8f0');k.rect(63,168,23,2,'#e8d8a0');k.rect(79,163,4,5,'#8a8a9a');k.rect(79,162,1,1,'#8a8a9a');k.rect(82,162,1,1,'#8a8a9a');k.px(80,165,'#3a3a4a');
  k.rect(66,163,1,5,'#3a9a4a');k.rect(68,165,1,3,'#5aba5a');k.rect(75,164,1,4,'#3a9a4a');k.rect(62,171,25,10,'#7a4a2c');k.rect(62,171,25,1,'#a06a40');k.rect(74,172,1,8,'#5a3420');k.px(72,175,GD);k.px(76,175,GD);k.rect(62,180,25,1,'#4a2a18')},
  (x,g)=>{const t=g.t*(g.tank>0?2.5:1);[[0,RD,.35],[13,GD,.27],[25,'#ff8a3a',.31]].forEach(([o,c,s],i)=>{const u=(t*s+o*3)%40,fx=u<20?65+u:85-(u-20),fy=159+i*3+Math.round(Math.sin(t/40+i));
    x.px(Math.round(fx),fy,c);x.px(Math.round(fx)+(u<20?-1:1),fy,c)});if(g.tank>0&&g.t%6===0)g.fx.push({k:'b',x:65+g.ri(0,18),y:167,vx:0,vy:-.25,l:36})});
// 咖啡厅：四张小圆桌（各两把椅子、头顶一盏吊灯）、巨树、招牌、点唱机
for(const [tx,ty] of TABLES)prop([tx-11,ty-20,23,22],ty+1,k=>{k.rect(tx,ty-19,1,5,OL);k.rect(tx-2,ty-14,5,2,'#c89a1e');k.rect(tx-1,ty-14,3,1,GD);k.rect(tx-1,ty-12,3,1,'#ffe295');
  for(const s of [-1,1]){const cx=tx+s*9;k.rect(cx+s*1,ty-8,1,9,'#6a4028');k.rect(cx-1,ty-3,3,1,'#8a5a36');k.px(cx-1,ty,'#4a2a18');k.px(cx+1,ty,'#4a2a18');k.rect(cx-1,ty-2,3,1,'#5a3420')}
  ell(k,tx,ty-6,6,1,'#d8c8b0');ell(k,tx,ty-7,6,1,'#f4ecd8');k.px(tx-3,ty-8,CR);k.px(tx-3,ty-7,'#8a5a3a');k.px(tx+2,ty-8,PK);k.px(tx+3,ty-8,CR);k.rect(tx,ty-4,1,4,OL);k.rect(tx-2,ty,5,1,OL)});
prop([131,68,58,90],153,k=>{   // 巨树：树干、五色毛线套、树根、顶上一团金叶子
  for(const [a,b,w,h] of [[140,143,8,5],[136,147,8,5],[133,151,7,3],[172,143,8,5],[176,147,8,5],[180,151,7,3],[150,145,6,9],[164,145,6,9]]){k.rect(a-1,b-1,w+2,h+2,'#5a3820');k.rect(a,b,w,h,'#945b2f');k.rect(a,b,w,1,'#b07040')}
  fill(k,145,78,30,68,(x,y)=>x===145||x===174?'#5a3820':x<149?'#b8804a':x>166?'#7e4c2c':hs(x,y>>2)%9===0?'#8a5a32':'#a76e3d');
  const KN=[['#5c88a5','#34618f','#a8d0f0'],['#8b688f','#654a86','#d0bce4'],['#507244','#35593a','#9ccc98'],['#cc952c','#9a7414','#fff0a8'],['#c5432e','#9e2f2a','#f7a58c'],['#5c88a5','#34618f','#a8d0f0'],['#8b688f','#654a86','#d0bce4']];
  KN.forEach((P,b)=>fill(k,144,112+b*4,32,4,(x,y)=>{const r=y-112-b*4,dk=x>166;if(x===144||x===175)return OL;if(r===3)return P[1];if(r<2&&(x+r)%2===0)return dk?P[0]:P[2];return dk?P[1]:P[0]}));
  fill(k,144,110,32,2,x=>x===144||x===175?OL:x>166?'#c8b8a0':x%2?'#f0e4d0':'#d8c8b0');fill(k,144,140,32,2,x=>x===144||x===175?OL:x>166?'#c8b8a0':x%2?'#f0e4d0':'#d8c8b0');
  for(const [a,b,r] of [[149,80,6],[160,76,8],[171,80,6],[154,86,5],[166,86,5],[142,85,3],[178,85,3]])k.disc(a,b,r,'#b8761a');
  for(const [a,b,r] of [[148,79,5],[159,75,7],[170,79,5],[153,85,4],[165,85,4],[141,84,2],[177,84,2]])k.disc(a,b,r,'#e9be5f');
  for(let i=0;i<26;i++){const a=142+hs(i,7)%36,b=70+hs(7,i)%18;if(Math.abs(a-160)+Math.abs(b-80)*1.6<22)k.px(a,b,i%3?GD:'#fff0a8')}});
prop([124,154,73,35],188,null,(x,g)=>{const L=125,T=158,R=195,B=182;   // 招牌：猫耳朵牌头、CLOWDER AI、猫猫咖啡馆、下沿一串小灯
  x.rect(133,B,3,6,'#4a2a18');x.rect(185,B,3,6,'#4a2a18');x.spr(EAR,L+4,T-3,{O:OL,p:PK});x.spr(EAR,R-9,T-3,{O:OL,p:PK});
  x.rect(L,T,R-L,B-T,OL);x.rect(L+1,T+1,R-L-2,B-T-2,'#c89a1e');x.rect(L+2,T+2,R-L-4,B-T-4,'#2a1a14');
  x.text('CLOWDER AI',160,T+3,GD,{al:'c'});x.zh('猫猫咖啡馆',160,T+8,CR,{al:'c'});
  for(let i=L+3,j=0;i<R-2;i+=4,j++){const on=(j+(g.t>>3))%3===0;x.px(i,B-2,on?CR:'#8a6a1e');x.px(i,T+1,on?'#8a6a1e':CR)}});
prop([87,168,13,20],187,k=>{k.rect(88,170,11,17,OL);k.rect(89,171,9,15,'#8a3a2a');k.rect(90,174,7,4,'#2a1418');k.px(92,175,RD);k.px(94,175,RD);k.rect(92,176,3,1,RD);k.px(93,177,RD);
  for(let y=180;y<185;y+=2)k.rect(90,y,7,1,'#5a2418');k.rect(88,186,11,1,'#4a2a18')},(x,g)=>{const C=[RD,GD,MI,CY,PK],q=g.t>>4;x.rect(89,171,9,1,C[q%5]);x.rect(90,172,7,1,C[(q+1)%5]);
  x.rect(89,172,1,12,C[(q+2)%5]);x.rect(97,172,1,12,C[(q+3)%5])});
// 楼梯间：下地下的霓虹牌、墙角那台更小的街机
prop([257,139,24,16],153,k=>{k.rect(268,149,2,5,'#3a3040');k.rect(257,139,24,11,'#3a2a4a');k.rect(258,140,22,9,'#120c18')},(x,g)=>{const on=g.t%240>6||g.t%240<3;
  x.text('B1',260,142,on?'#ff6ab0':'#5a2a4a');x.spr(['.#.','.#.','###','.#.'],269,142,{'#':on?'#ff6ab0':'#5a2a4a'});x.rect(274,142,4,1,on?CY:'#2a4a5a');x.rect(273,144,5,1,on?CY:'#2a4a5a');x.rect(274,146,4,1,on?CY:'#2a4a5a')});
prop([303,170,13,19],188,k=>{k.rect(304,171,11,17,OL);k.rect(305,172,9,15,'#4a3a7a');k.rect(305,172,9,3,'#e05a8a');k.px(307,173,GD);k.px(311,173,GD);k.rect(306,176,7,5,'#101018');
  k.rect(305,182,9,2,'#6a5a9a');k.px(307,182,RD);k.px(311,182,GD);k.rect(305,184,9,3,'#3a2a5a')},(x,g)=>{if(g.arc>0){x.px(309,177,GD);x.px(308,178,'#b07747');x.px(310,178,'#b07747');x.px(307,179,PK);x.px(311,179,CY);
  if((g.arc>>3)&1)x.px(306,176,CR)}else if((g.t>>5)&1)x.px(308+((g.t>>6)%3),178,MI)});
/* ---------- 一局 ---------- */
let BG=null;
const leaf=(g,x,y)=>g.fx.push({k:'l',x,y,vx:0,vy:g.rnd(.2,.45),l:g.ri(50,90),p:g.rnd(0,6)});
function near(g){const p=g.p;let best=null,bd=1;   // 店猫和能碰的东西一起比：谁离得近（按各自的感应半径算）就是谁
  for(const c of g.cats){const d=Math.hypot(c.x-p.x,(c.y-p.y)*1.4)/15;if(d<bd){bd=d;best={c}}}
  for(const s of SPOT){const d=s.in?(s.in(p)?.95:9):Math.hypot(s.x-p.x,s.y-p.y)/s.r;if(d<bd){bd=d;best={s}}}return best}
const ball=(g,x,y,z,vx,vy,vz)=>{g.balls.push({x,y,z,vx,vy,vz,c:g.ri(0,4),r:0,t:0,kk:0});if(g.balls.length>6)g.balls.shift()};
function act(g,t){const p=g.p;
  if(t.c){const c=t.c;c.hold=110;c.bub={s:c.st==='z'?'z':c.i===2&&g.ri(0,1)?'…':'♥',t:90};if(c.st!=='z'){c.st='s';c.t=Math.max(c.t,150);c.path=null}if(c.i===1)c.bl=24;g.sfx('meow');return}
  switch(t.s.id){
    case 'tree':{let x=p.x+g.rnd(-5,5),y=p.y+g.rnd(3,6);if(hit(x,y,1)){x=p.x+p.f*9;y=p.y}if(hit(x,y,1)){x=p.x;y=p.y-4}if(hit(x,y,1))y=p.y;ball(g,x,y,48,g.rnd(-.6,.6),g.rnd(.05,.35),0);g.n++;g.sfx('drop');for(let i=0;i<5;i++)leaf(g,x+g.rnd(-12,12),y-48+g.rnd(-6,4));break}
    case 'yarn':{const [bx,by]=BASK.reduce((a,b)=>Math.hypot(b[0]-p.x,b[1]-p.y)<Math.hypot(a[0]-p.x,a[1]-p.y)?b:a);ball(g,bx,by+3,4,g.rnd(-.8,.8),g.rnd(.3,.9),1.8);g.n++;g.sfx('hit');break}
    case 'coffee':for(let i=0;i<16;i++)g.fx.push({k:'s',x:56+g.rnd(-2,12),y:87+g.rnd(-2,1),vx:g.rnd(-.15,.15),vy:-g.rnd(.1,.3),l:g.ri(50,100)});g.cups=Math.min(3,g.cups+1);g.cupT=1200;
      [0,9,18].forEach(d=>g.sq.push({t:d+1,n:'move'}));break;
    case 'bell':g.bell=28;g.desk.bub={s:'?',t:80};g.sfx('blip');break;
    case 'stage':g.stg=160;g.sfx('up');break;
    case 'juke':for(let i=0;i<4;i++)g.fx.push({k:'n',x:93+g.rnd(-4,4),y:170,vx:g.rnd(-.2,.2),vy:-g.rnd(.25,.45),l:g.ri(50,80),c:[RD,GD,MI,CY,PK][g.ri(0,4)]});g.sfx('line');break;
    case 'tank':g.tank=150;g.sfx('rot');break;
    case 'arcade':g.fl=10;g.arc=300;g.sfx('coin');break}}
function step(g,k){const p=g.p;
  for(const s of g.sq)if(--s.t===0)g.sfx(s.n);g.sq=g.sq.filter(s=>s.t>0);
  // 开局：叶子沙沙响一阵，你的猫从树冠里掉下来，落在招牌跟前
  if(g.wait>0){g.wait--;if(g.wait%5===0)leaf(g,160+g.rnd(-16,16),84+g.rnd(-6,4))}
  else if(p.z>0){p.vz+=.11;p.z=Math.max(0,p.z-p.vz);if(!p.z){g.land=16;g.sfx('wall');g.hint=360;for(let i=0;i<4;i++)leaf(g,p.x+g.rnd(-8,8),p.y-3)}}
  else if(g.land>0)g.land--;
  else{const dx=(k.R?1:0)-(k.L?1:0),dy=(k.D?1:0)-(k.U?1:0);p.mv=0;
    if(dx||dy){const s=dx&&dy?.5:.7;if(dx)p.f=dx;p.mv=move(p,dx*s,dy*s);p.idle=0;if(p.mv){p.d+=s;if(p.d>=3.5){p.d=0;p.fr^=1;if(p.fr)g.sfx('step')}}}else p.idle++;
    p.dx=dx;p.dy=dy;
    if(k.p.A){p.idle=0;const t=near(g);if(t)act(g,t);else if(!p.bub){p.bub={s:'♪',t:50};g.sfx('meow')}}}
  if(p.bub&&--p.bub.t<=0)p.bub=null;if(p.idle>2100&&p.idle%100===0)g.fx.push({k:'z',x:p.x+p.f*3,y:p.y-7,vx:.08*p.f,vy:-.18,l:60});if(g.desk.bub&&--g.desk.bub.t<=0)g.desk.bub=null;
  // 店猫
  for(const c of g.cats){if(c.bub&&--c.bub.t<=0)c.bub=null;if(c.bl>0)c.bl--;
    if(c.st==='z'&&(g.t+c.i*29)%100===0)g.fx.push({k:'z',x:c.x+c.f*3,y:c.y-7,vx:.08*c.f,vy:-.18,l:60});
    if(c.talk&&!c.bub&&c.st!=='z'&&g.ri(1,700)===1)c.bub={s:g.ri(0,1)?'♪':'!',t:60};
    if(c.hold>0){c.hold--;continue}
    if(c.ball&&c.st!=='z'){let b=null,bd=110;for(const o of g.balls){const d=Math.hypot(o.x-c.x,o.y-c.y);if(!o.z&&o.t<1500&&d<bd){bd=d;b=o}}
      if(b){const dx=b.x-c.x,dy=b.y-c.y,d=bd||1;c.f=dx<0?-1:1;c.st='w';c.path=null;
        if(d<4.5){b.vx+=dx/d*1.1+g.rnd(-.5,.5);b.vy+=dy/d*.8+g.rnd(-.4,.4);b.vz=.9;c.hold=g.ri(14,40);g.sfx('move');continue}
        if(!move(c,dx/d*c.v*1.4,dy/d*c.v*1.4)){b.t+=500;c.st='s';c.t=60}else{c.d+=c.v;if(c.d>=3.5){c.d=0;c.fr^=1}}continue}}
    if(c.st==='w'){if(!c.path||!c.path.length){c.st=Math.random()<c.zz?'z':'s';c.t=g.ri(240,900);continue}
      const n=c.path[0],dx=n.x-c.x,dy=n.y-c.y,d=Math.hypot(dx,dy);if(d<=c.v){c.x=n.x;c.y=n.y;c.path.shift()}else{c.x+=dx/d*c.v;c.y+=dy/d*c.v;if(Math.abs(dx)>.2)c.f=dx<0?-1:1}
      c.d+=c.v;if(c.d>=3.5){c.d=0;c.fr^=1}}
    else if(--c.t<=0){const s=c.at[g.ri(0,c.at.length-1)],tx=s[0]+g.ri(-3,3),ty=s[1]+g.ri(-2,2),r=!hit(tx,ty)&&route(c.x,c.y,tx,ty);if(r){c.path=r;c.st='w'}else c.t=30}}
  // 毛线球：落地弹两下，滚一段，撞墙反弹；你的猫走过去踢一脚
  for(const b of g.balls){b.t++;if(b.kk>0)b.kk--;
    if(b.z>0||b.vz>0){b.vz-=.16;b.z+=b.vz;if(b.z<=0){b.z=0;if(b.vz<-.9){b.vz=-b.vz*.42;g.sfx('move')}else b.vz=0}}
    const nx=b.x+b.vx;if(hit(nx,b.y,1))b.vx*=-.7;else b.x=nx;const ny=b.y+b.vy;if(hit(b.x,ny,1))b.vy*=-.7;else b.y=ny;
    if(!b.z){b.vx*=.975;b.vy*=.975;if(Math.abs(b.vx)+Math.abs(b.vy)<.03)b.vx=b.vy=0}b.r+=Math.abs(b.vx)+Math.abs(b.vy);
    if(p.mv&&!b.z&&!b.kk&&Math.hypot(b.x-p.x,b.y-p.y)<5){const n=Math.hypot(p.dx,p.dy)||1;b.vx=p.dx/n*1.4+g.rnd(-.2,.2);b.vy=p.dy/n*1.1+g.rnd(-.2,.2);b.vz=.6;b.kk=12;g.sfx('hit')}}
  // 小东西：蒸汽、叶子、音符、zzz、气泡
  if(g.t%46===0)g.fx.push({k:'s',x:58+g.ri(0,8),y:87,vx:0,vy:-.15,l:40});
  if(g.t%170===0)g.fx.push({k:'n',x:93,y:170,vx:g.rnd(-.15,.15),vy:-.3,l:60,c:[RD,GD,MI,CY,PK][(g.t/170|0)%5]});
  if(g.t%220===0)leaf(g,g.ri(104,216),90);
  for(const f of g.fx){f.l--;if(f.k==='l'){f.p+=.06;f.x+=Math.sin(f.p)*.35;f.y+=f.vy}else{f.x+=f.vx+(f.k==='s'?Math.sin((f.l+f.y)/6)*.12:0);f.y+=f.vy}}g.fx=g.fx.filter(f=>f.l>0);
  if(!g.star&&g.t%540===270){const a=WINS[g.ri(0,1)];g.star={x:a+g.ri(14,34),y:2,l:12}}if(g.star){g.star.x--;g.star.y+=.6;if(--g.star.l<=0)g.star=null}
  for(const s of ['stg','bell','fl','arc','hint','rn','tank'])if(g[s]>0)g[s]--;
  if(g.cups&&--g.cupT<=0){g.cups--;g.cupT=900}
  // 镜头：平滑跟着你的猫，夹在小图里
  const tx=Math.max(0,Math.min(MW-W,Math.round(p.x)-80)),ty=Math.max(0,Math.min(MH-H,Math.round(p.y)-80));g.cx+=(tx-g.cx)*.12;g.cy+=(ty-g.cy)*.12;
  const r=roomAt(p.x,p.y);if(r!==g.room&&r>=0){if(g.room>=0)g.rn=120;g.room=r}}
/* ---------- 画一帧 ---------- */
function bubble(x,cx,cy,s){cx=Math.round(cx);cy=Math.round(cy);const w=s==='…'?9:7;x.rect(cx-(w>>1)-1,cy-8,w+2,8,OL);x.rect(cx-(w>>1),cy-7,w,6,CR);x.px(cx,cy-1,OL);x.px(cx,cy,OL);
  if(s==='…')for(let i=-2;i<=2;i+=2)x.px(cx+i,cy-3,OL);else if(s==='♪')x.spr(NOTE,cx-1,cy-6,{'#':'#9B7EBD'});else if(s==='z')x.spr(ZZ,cx-2,cy-6,{'#':'#7a6a9a'});else x.text(s,cx-1,cy-7,s==='♥'?RD:OL)}
const badge=(x,a,y)=>{x.rect(a-4,y-3,9,7,OL);x.rect(a-3,y-4,7,9,OL);x.rect(a-3,y-3,7,7,GD);x.text('A',a-1,y-2,OL)};   // 和店里的 E 一样：金色小牌子上一个深色的字
function draw(g,x){const ox=Math.round(g.cx),oy=Math.round(g.cy),c=x.c,t=g.t,p=g.p;
  c.save();c.translate(-ox,-oy);c.drawImage(BG,0,0);
  // 墙上会动的：窗里的星星和流星、OPEN 霓虹、今天的数字、背板的灯、树上成品的小灯
  if(oy<34){TW.forEach(([a,b],i)=>{if((t+i*37)%150<12)x.px(a,b,'#ffffff')});const s=g.star;if(s)for(let i=0;i<3;i++){const a=Math.round(s.x)+i,b=Math.round(s.y-i*.6);if(WINS.some(w=>a>=w&&a<w+36)&&b>=2&&b<11)x.px(a,b,['#ffffff','#c8c8f0','#7a7ab0'][i])}
    const on=t%300>8||t%300<4;x.text('OPEN',10,5,on?'#ff6ab0':'#6a2a4a');x.text(String(g.n%10),152,7,GD);
    const P=[];for(let i=235;i<306;i+=3)P.push([i,3]);for(let j=6;j<33;j+=3)P.push([307,j]);for(let i=304;i>234;i-=3)P.push([i,33]);for(let j=30;j>4;j-=3)P.push([233,j]);
    const n=P.length,u=160-g.stg,h=g.stg>0&&u<100?Math.floor(u/100*n):-1,fl=g.stg>0&&h<0&&(g.stg>>3)&1;
    P.forEach(([a,b],i)=>{const d=(h-i+n)%n;x.px(a,b,h>=0?(d===0?'#ffffff':d<4?CR:d<9?GD:'#5a3a2a'):g.stg>0?(fl?CR:GD):((i+(t>>4))&1?GD:'#8a6a2a'))});
    if(fl)x.text('1024',271,9,'#fff0f4',{k:2,al:'c',sh:'#e05a8a'})}
  if(g.stg>0&&g.stg<130){ell(x,270,41,15,3,'#c89a64');ell(x,270,41,12,2,'#e8c48c');for(let y=-4;y<=4;y+=2)for(let i=-18;i<=18;i+=2)if(((i/18)**2+(y/4.6)**2)<1&&((i/15)**2+(y/3.5)**2)>=1)x.px(270+i+(y&2?1:0),41+y,'#c89a64');
    for(const a of [227,309]){x.px(a,28,'#ffffff');x.px(a,27,GD);x.px(a,29,GD)}}
  if(t%60<40)for(const [a,b] of [[141,93],[179,93],[121,90],[199,90]])x.px(a,b,(t+a)%120<60?GD:CR);
  // 排序层：家具、猫、毛线球按脚底 y
  const L=[];for(const o of PROPS)if(o.r[0]<ox+W&&o.r[0]+o.r[2]>ox&&o.r[1]<oy+H&&o.r[1]+o.r[3]>oy)L.push([o.by,0,o]);
  for(const o of g.cats)L.push([o.y,1,o]);L.push([g.desk.sy,1,g.desk]);L.push([p.y+.1,2,p]);for(const b of g.balls)L.push([b.y,3,b]);L.sort((a,b)=>a[0]-b[0]);
  for(const [,ty,o] of L){if(ty===0){if(o.cv)c.drawImage(o.cv,o.r[0],o.r[1]);if(o.dyn)o.dyn(x,g)}
    else if(ty===1)cat(x,o.P,o.x,o.y,o.st==='w'?'w':o.st==='z'?'z':(o.bl>0||(t+o.x*7|0)%230<8)?'k':'s',o.f,o.fr);
    else if(ty===2){if(p.z>0)x.rect(p.x-2,p.y,5,1,'#6a4028');cat(x,g.pp,p.x,p.y-p.z,p.z>0?'w':g.land>9?'z':p.mv||p.idle<30?'w':p.idle>2100?'z':t%210<8?'k':'s',p.f,p.fr)}
    else{const Y=YARN[o.c];if(o.z>0)x.rect(o.x-2,o.y,5,1,'#5a3820');x.spr(BALL[(o.r/3|0)&1],o.x-2,o.y-4-o.z,{r:Y[0],R:Y[1],h:Y[2]})}}
  // 盖在上面的：门洞上的小牌子、蒸汽、叶子、音符、zzz、气泡、能互动的提示
  for(const [a,s] of [[94,'CAFE'],[190,'CAFE'],[269,'UP']]){const w=s==='UP'?13:19;x.px(a-4,85,OL);x.px(a+4,85,OL);x.rect(a-(w>>1),86,w,7,'#4a2a1c');x.rect(a-(w>>1)+1,87,w-2,5,'#7a4a2c');
    if(s==='UP'){x.spr(['.#.','###','.#.','.#.','.#.'],a-5,87,{'#':GD});x.text('UP',a-1,87,'#ffe8b0')}else x.text(s,a-7,87,'#ffe8b0')}
  for(const f of g.fx){const a=Math.round(f.x),b=Math.round(f.y);if(f.k==='s'){if(f.l>45)x.rect(a,b,2,2,CR);else x.px(a,b,f.l>20?CR:'#d8d0cc')}else if(f.k==='l')x.px(a,b,f.l&8?'#e9be5f':'#c8901e');else if(f.k==='n')x.spr(NOTE,a,b,{'#':f.c});
    else if(f.k==='z')x.spr(ZZ,a,b,{'#':'#b9a8c9'});else x.px(a,b,'#d0f4ff')}
  for(const o of g.cats)if(o.bub)bubble(x,o.x,o.y-(o.st==='z'?6:10),o.bub.s);if(g.desk.bub)bubble(x,g.desk.x,g.desk.y-10,g.desk.bub.s);if(p.bub)bubble(x,p.x,p.y-p.z-10,p.bub.s);
  if(!p.z&&!g.land&&!g.wait){const n=near(g);if(n){const [a,b]=n.c?[n.c.x,n.c.y-(n.c.st==='z'?8:12)]:n.s.mk,y=b+((t>>4)&1);if(!(n.c&&n.c.bub))badge(x,a,y)}}
  if(g.land>0||(g.hint>200&&(t>>3)&1))x.spr(['###','.#.'],Math.round(p.x)-1,Math.round(p.y-p.z)-13,{'#':GD});
  c.restore();
  // 屏幕上的：房间名、开头的按键提示、小街机的闪光
  if(g.rn>0){const s=ROOMS[g.room][0],w=x.zw(s)+10,y=g.rn>110?(g.rn-110)*-2+3:g.rn<10?3-(10-g.rn)*2:3;x.rect(80-(w>>1),y,w,16,OL);x.rect(81-(w>>1),y+1,w-2,14,'#2a1a2a');x.rect(82-(w>>1),y+14,w-4,1,'#c89a1e');x.zh(s,W/2,y,CR,{al:'c'})}
  if(g.hint>0){const y=H-12+(g.hint<40?Math.ceil((40-g.hint)/3):0);x.rect(52,y,57,11,OL);x.rect(53,y+1,55,9,'#2a1a2a');['L','R','U','D'].forEach((d,i)=>x.spr(ARW[d],56+i*7,y+3,{'#':CR}));
    badge(x,90,y+5);x.text('♥',98,y+3,PK)}
  if(g.fl>0){if(g.fl>6)x.rect(0,0,W,H,CR);else for(let y=g.fl&1;y<H;y+=2)x.rect(0,y,W,1,CR)}}
/* ---------- 开机画面：夜里的店门脸，树冠从屋顶上冒出来 ---------- */
const STARS=[[8,6],[22,14],[35,4],[47,20],[112,8],[124,22],[150,30],[6,30],[28,34],[140,4],[100,18],[16,46],[152,12],[58,8],[118,36],[3,18],[132,40],[44,40]];
function title(x,t){const f=Math.floor(t*60);x.cls('#1f2248');x.rect(0,24,W,24,'#252858');x.rect(0,48,W,30,'#2c3064');
  STARS.forEach(([a,b],i)=>x.px(a,b,(f+i*41)%160<14?'#ffffff':i%3?'#9a9ad0':'#d8d8f0'));x.disc(136,16,6,CR);x.disc(139,13,5,'#1f2248');
  x.rect(74,30,13,14,'#5a3820');x.rect(75,30,11,14,'#a76e3d');x.rect(82,30,4,14,'#7e4c2c');x.rect(74,36,13,3,'#c5432e');x.rect(74,39,13,3,'#5c88a5');x.rect(74,36,13,1,'#f0e4d0');   // 树干穿出屋顶，还套着毛线
  for(const [a,b,r] of [[61,24,10],[80,15,12],[99,24,10],[69,31,7],[91,31,7],[50,31,5],[110,31,5]])x.disc(a,b,r,'#b8761a');
  for(const [a,b,r] of [[60,22,8],[79,13,10],[98,22,8],[68,29,5],[90,29,5],[49,29,3],[109,29,3]])x.disc(a,b,r,'#e9be5f');
  for(let i=0;i<30;i++){const a=44+hs(i,3)%72,b=4+hs(3,i)%32;if(Math.abs(a-80)+Math.abs(b-20)*1.5<36)x.px(a,b,i%4===0?'#c8901e':(f+i*23)%90<45?GD:'#fff0a8')}
  x.rect(8,42,144,3,'#6a3e28');x.rect(10,45,140,2,'#4a2a1c');x.rect(12,47,136,76,'#e6cfae');for(let i=14;i<148;i+=4)x.rect(i,47,1,76,'#dcc29e');
  for(const a of [20,52,96,128]){x.rect(a,50,13,10,'#8a5a3a');x.rect(a+1,51,11,8,'#ffd88a');x.rect(a+6,51,1,8,'#8a5a3a');x.rect(a+1,55,11,1,'#8a5a3a')}
  x.spr(CAT.s,98,52,PAL(BR(3)));
  const L=47,T=63,R=113,B=87;x.spr(EAR,L+4,T-3,{O:OL,p:PK});x.spr(EAR,R-9,T-3,{O:OL,p:PK});x.rect(L,T,R-L,B-T,OL);x.rect(L+1,T+1,R-L-2,B-T-2,'#c89a1e');x.rect(L+2,T+2,R-L-4,B-T-4,'#2a1a14');
  x.text('CLOWDER AI',80,T+3,GD,{al:'c'});x.zh('猫猫咖啡馆',80,T+8,CR,{al:'c'});for(let i=L+3,j=0;i<R-2;i+=4,j++){const on=(j+(f>>3))%3===0;x.px(i,B-2,on?CR:'#8a6a1e');x.px(i,T+1,on?'#8a6a1e':CR)}
  for(const a of [16,96]){for(let i=0;i<48;i+=6){x.rect(a+i,89,6,5,(i/6)&1?CR:RD);x.rect(a+i+1,94,4,1,(i/6)&1?CR:RD)}
    x.rect(a+2,96,44,22,'#6a4028');x.rect(a+3,97,42,20,'#f2c47a');for(let y=98;y<117;y+=3)for(let i=a+4;i<a+44;i+=6)x.px(i+(y%2)*3,y,'#ffd88a');x.rect(a+3,113,42,4,'#c88a4a');x.rect(a+2,117,44,2,'#8a5a3a')}
  x.rect(41,103,6,10,'#b8804a');for(let i=0;i<5;i++)x.rect(40,103+i*2,8,2,[ '#5c88a5','#8b688f','#507244','#cc952c','#c5432e'][i]);x.disc(44,99,5,'#e9be5f');   // 左窗里看得见巨树的毛线套
  x.spr(CAT.s,24,105,PAL(BR(1)));x.rect(104,99,23,9,'#1a1220');x.text('OPEN',106,101,f%300>8?'#ff6ab0':'#6a2a4a');x.spr(f%240<8?CAT.k:CAT.s,128,105,PAL(BR(4)),true);
  x.rect(66,92,28,31,'#5e3a24');x.rect(68,94,24,29,'#8a5a3a');x.rect(70,96,20,10,'#ffd88a');x.rect(79,96,2,10,'#8a5a3a');x.rect(70,108,8,12,'#7a4a2e');x.rect(82,108,8,12,'#7a4a2e');x.px(80,113,GD);
  x.text('1024',80,88,GD,{al:'c'});
  x.rect(0,123,W,21,'#34365a');x.rect(0,123,W,1,'#4a4c78');for(let i=6;i<W;i+=16)x.rect(i,124,1,20,'#2a2c4c');x.rect(0,134,W,1,'#2a2c4c');
  for(let y=124;y<133;y+=2)for(let i=64-(y-124);i<96+(y-124);i+=3)x.px(i+(y&2?1:0),y,'#6a5a5a');x.rect(66,123,28,2,'#b0503a');
  x.rect(153,60,2,63,'#2a2a3a');x.rect(150,56,8,4,'#2a2a3a');x.rect(151,60,6,3,'#ffe8a0');for(const [a,b] of [[149,64],[158,64],[154,66],[147,61],[160,61]])x.px(a,b,'#c8b070');
  x.spr(CAT.z,75,119,PAL(BR(6)));if((f+40)%140<70)x.spr(ZZ,86,112-((f%70)>>4),{'#':'#b9a8c9'});
  const u=(f*.45)%340,cx=u<170?-10+u:160-(u-170),cf=u<170?1:-1;x.spr(CAT.w[(f>>3)&1],Math.round(cx)-5,124,PAL(BR(5)),cf<0);
  if((t%.9)<.54)x.text('PUSH START',W/2,136,CR,{al:'c',sh:OL})}
return{n:'猫猫咖啡馆',en:'CAT CAFE',w:W,h:H,free:true,keys:'方向键 走　A 打个招呼',title,
  init(g){if(!BG)BG=buildBG();if(!PROPS[0].cv)for(const o of PROPS)if(o.f)o.cv=bake(o.r,o.f);
    g.p={x:160,y:158,z:72,vz:0,f:1,fr:0,d:0,idle:0,mv:0,dx:0,dy:0,bub:null};g.pp=PAL(g.pal||BR(0));g.cx=80;g.cy=MH-H;
    Object.assign(g,{balls:[],fx:[],sq:[],cups:0,cupT:0,stg:0,bell:0,fl:0,arc:0,hint:0,rn:0,tank:0,n:0,land:0,wait:30,star:null,room:roomAt(160,158)});
    g.cats=SHOP.map((s,j)=>({...s,P:PAL(BR(s.i)),x:s.at[0][0],y:s.at[0][1],f:j&1?-1:1,st:s.zz>.5?'z':'s',t:g.ri(60,400),path:null,fr:0,d:0,bub:null,hold:0,bl:0}));
    g.desk={P:PAL(DESKC),x:10,y:57,sy:66.5,f:1,st:'s',bub:null,bl:0,fr:0}},
  step,draw}})());
