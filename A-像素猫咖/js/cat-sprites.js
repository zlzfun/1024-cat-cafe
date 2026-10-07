/* 1024 猫咖 · 像素猫精灵（定稿 v2）
   静止：V3 端坐猫（头宽 14px）；移动：侧身 A 标准（3/4 转头，圆屁股、问号尾巴、带脚掌的腿，比 A 原稿收窄 2px）。
   另有：表情贴片（正脸 face / 转头 faceT）、脸贴地的趴与睡、舔爪洗脸、6 个玩毛线球动作（随机触发）、5 个新点子、每只猫的默认表情与小习惯。
   画爪原则：抬起的那条腿从身下去掉；爪子是短粗的圆"手套"，前臂和爪子一样粗、只露两三格，直接并进胸口。
   统一入口：POSE[名](t, tf, o, 表情) → {G, cx, dy, flip, blink}；drawF(ctx, G, 毛色, x, y, {cx, flip, dy, blink})，(x,y) 为锚点列 cx 的脚底。
   字符 r/R/h 只留给毛线（drawCat 传 yarn 可整体换色）；张嘴的口腔用 M，爱心眼和青筋用 V。场景 v2 起另有 leap（跳）和 lookL（往左看）。
   场景 v3 起毛色可带 eye（眼睛颜色，给黑猫这类深色毛用），不带时仍是深紫。 */

/* ================= 调色 ================= */
const BREEDS=[
  {name:'你',body:'#fff3e0',light:'#ffffff',shade:'#e8d2c0',outline:'#5a3a4a',collar:'#e0533d',whisk:'#9a7a8a'},
  {name:'宪宪',body:'#f3ece2',light:'#ffffff',shade:'#d8ccc0',outline:'#5a4a52',points:'#8c7a70',collar:'#9B7EBD',whisk:'#9a8a90'},
  {name:'砚砚',body:'#9a8a70',light:'#e2d6bf',shade:'#7a6c56',outline:'#3a3028',stripe:'#62533f',tuft:1,collar:'#5B8C5A',whisk:'#e2d6bf'},
  {name:'烁烁',body:'#f1e4c8',light:'#fbf4e4',shade:'#d8c8a8',outline:'#3e3028',points:'#5a4436',collar:'#5B9BD5',whisk:'#b8a890'},
  {name:'小狸花',body:'#b99a6c',light:'#e8dcc0',shade:'#9a7e56',outline:'#3e3024',stripe:'#6a5236',collar:'#e0533d',whisk:'#e8dcc0'},
  {name:'斑斑',body:'#e3a456',light:'#f7e0b6',shade:'#c48840',outline:'#4a2c14',spot:'#8a4f1e',collar:'#4a7fd0',whisk:'#f7e0b6'},
  {name:'金哥',body:'#dcb46c',light:'#f5e6c0',shade:'#bf9752',outline:'#4a3818',stripe:'#c49a50',collar:'#6a4a9a',whisk:'#f5e6c0'},
];
function color(ch,b){switch(ch){
  case 'o':return b.outline;case 'b':return b.body;case 'l':return b.light;case 'd':return b.shade;case 'p':return '#f4a6b8';case 'n':return '#e27a8f';
  case 'e':return b.eye||'#241a2e';case 'w':return '#ffffff';case 'k':return b.whisk;case 'c':return b.collar;case 'y':return '#ffd84a';case 'q':return '#8fc8f0';
  case 'x':case 'm':case 't':return b.points||b.body;case 'f':case 'g':return b.stripe||b.spot||b.body;
  case 'r':return b.yarn?b.yarn[0]:'#e0533d';case 'R':return b.yarn?b.yarn[1]:'#9e2f2a';case 'h':return b.yarn?b.yarn[2]:'#f7a58c';case 'M':return '#9e2f2a';case 'V':return '#e0533d';case 'z':return '#b9a8c9';case 'T':return '#d9d2c4';
  case 'u':return b.tuft?b.outline:null;default:return null}}

/* ================= 网格工具 ================= */
const mir=rows=>rows.map(r=>r+[...r].reverse().join(''));
const blank=(w,h)=>Array.from({length:h},()=>Array(w).fill('.'));
function stamp(G,rows,dx=0,dy=0){rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&G[y+dy]&&x+dx>=0&&x+dx<G[0].length)G[y+dy][x+dx]=c}))}
function sp(G,o,dx=0,dy=0){for(const y in o)o[y].split('|').filter(Boolean).forEach(seg=>{const [sx,s]=seg.split(':');[...s].forEach((c,i)=>{if(c==='.')return;const yy=+y+dy,xx=+sx+i+dx;if(G[yy]&&xx>=0&&xx<G[0].length)G[yy][xx]=c})})}
function leg(G,x,len,fill,top){for(let i=0;i<len;i++){const y=top+i;if(!G[y])continue;const s=i===len-1?'ooo':'o'+fill+'o';[...s].forEach((c,k)=>{if(G[y][x+k]!==undefined)G[y][x+k]=c})}}
function put(G,x,y,ch){if(G[y]&&G[y][x]!==undefined)G[y][x]=ch}
const toRows=G=>G.map(r=>r.join(''));
const rot180=R=>R.slice().reverse().map(r=>[...r].reverse().join(''));
const rotCCW=R=>{const H=R.length,W=R[0].length;return Array.from({length:W},(_,r)=>Array.from({length:H},(_,c)=>R[c][W-1-r]).join(''))};
function edit(rows,ops){const G=rows.map(r=>[...r]);ops(G);return toRows(G)}

/* ================= V3 端坐 ================= */
const V3_HALF=["..u......","..o......","..oo.....","..opo....","..oppxooo",".obbbbfbf",".obbbbbbf",".obbbbebb","kobbbbebb",".obpbbbmn","kobbbbbom","..obbbbbb","...occccc","...obbbll","..obbbbll","..obgblld","..obbglld",".obbbblld",".obgbblld",".obbbolld","..ooooooo"];
// 窄头：头部(0-12 行)每半边去掉一列，再在外侧补一列空白，身体不变
const narrowHalf=h=>h.map((r,y)=>y>12?r:'.'+(y<5?r.slice(0,6)+r.slice(7):r.slice(0,4)+r.slice(5)));
let V3,V3HEAD,TURNED,HAPPY;
const V3TAIL=[{11:"18:o",12:"17:oto",13:"17:oto",14:"17:oto",15:"17:oto",16:"17:oto",17:"17:oto",18:"17:oto",19:"16:otto",20:"16:ooo"},
              {11:"19:o",12:"18:oto",13:"18:oto",14:"17:oto",15:"17:oto",16:"17:oto",17:"17:oto",18:"17:oto",19:"16:otto",20:"16:ooo"}];
const CFG={head:-2};   // 已定稿：头宽 14px
function rebuild(){const nar=CFG.head<0;V3=mir(nar?narrowHalf(V3_HALF):V3_HALF);V3HEAD=V3.slice(0,13);
  const R=nar?15:16;   // 右侧描边列
  // 3/4 转向右的 V3 头：五官右移，去掉远侧胡须
  TURNED=edit(V3HEAD,G=>{for(let y=0;y<G.length;y++)for(let x=0;x<18;x++){const c=G[y][x];if('epnmk'.includes(c)||(c==='o'&&(y===9||y===10)&&x>6&&x<12))G[y][x]=(x>1&&x<R)?'b':(c==='k'?'.':c)}
    [[7,8,'e'],[8,8,'e'],[7,13,'e'],[8,13,'e'],[9,nar?6:5,'p'],[9,R-1,'p'],[9,11,'m'],[9,12,'n'],[9,13,'n'],[10,11,'o'],[10,14,'o'],[8,R+1,'k'],[10,R+1,'k']].forEach(([y,x,c])=>G[y][x]=c)});
  HAPPY=edit(V3,G=>{[[7,6],[8,6],[7,11],[8,11]].forEach(([y,x])=>G[y][x]='b');[[7,6],[8,5],[8,7],[7,11],[8,10],[8,12]].forEach(([y,x])=>G[y][x]='e');G[10][8]=G[10][9]='n'})}
function sit(tf,noTail){const G=blank(20,21);stamp(G,V3);if(!noTail)sp(G,V3TAIL[tf]);return G}
const HEAD12=()=>V3HEAD.slice(0,12).map(r=>[...r]);                                   // 正脸头（不含项圈）
const HEAD_R=()=>edit(TURNED,G=>{G[3][13]='p';G[4][12]='p';G[4][13]='p'});            // 3/4 转头，近侧耳朵保留粉色
// 耳朵向外倒一格（放松 / 犯困 / 抹脸那一侧）；side 含 'L' / 'R'
function EARS_RELAX(H,side='LR'){
  if(side.includes('L')){for(let y=0;y<=3;y++)for(let x=2;x<=5;x++)H[y][x]='.';[[0,2,'u'],[1,2,'o'],[2,2,'o'],[2,3,'o'],[3,2,'o'],[3,3,'p'],[3,4,'o']].forEach(([y,x,c])=>H[y][x]=c)}
  if(side.includes('R')){for(let y=0;y<=3;y++)for(let x=12;x<=15;x++)H[y][x]='.';[[0,15,'u'],[1,15,'o'],[2,15,'o'],[2,14,'o'],[3,15,'o'],[3,14,'p'],[3,13,'o']].forEach(([y,x,c])=>H[y][x]=c)}
  return H}

/* ================= 表情贴片 ================= */
// 正脸：头部网格左上角 (ox,oy)，眼睛中心列 6 / 11、行 7-8，鼻子行 9，嘴行 10
const EYE={ // [dx,dy,字符]，相对左眼 (6,7)；右眼默认镜像
  dot:[[0,0,'e'],[0,1,'e']], up:[[0,-1,'e'],[0,0,'e']], down:[[0,1,'e'],[0,2,'e']],
  lookL:[[-1,0,'e'],[-1,1,'e']], lookR:[[1,0,'e'],[1,1,'e']], lookRup:[[1,-1,'e'],[1,0,'e']],
  lookPawL:[[-1,1,'e'],[-1,2,'e']], lookPawR:[[-2,1,'e'],[-2,2,'e']],
  closed:[[-1,1,'e'],[0,1,'e'],[1,1,'e']], happy:[[0,0,'e'],[-1,1,'e'],[1,1,'e']], sleep:[[-1,0,'e'],[0,1,'e'],[1,0,'e']],
  half:[[-1,0,'o'],[0,0,'o'],[1,0,'o'],[0,1,'e']], halfL:[[-1,0,'o'],[0,0,'o'],[1,0,'o'],[-1,1,'e']],
  drowsy:[[-1,0,'o'],[0,0,'o'],[1,0,'o'],[-1,1,'e'],[0,1,'e'],[1,1,'e']],
  wideL:[[-1,-1,'w'],[0,-1,'e'],[-1,0,'e'],[0,0,'e'],[-1,1,'e'],[0,1,'e']], wideR:[[0,-1,'w'],[1,-1,'e'],[0,0,'e'],[1,0,'e'],[0,1,'e'],[1,1,'e']],
  star:[[0,-1,'y'],[-1,0,'y'],[0,0,'w'],[1,0,'y'],[0,1,'y']], heart:[[-1,0,'V'],[1,0,'V'],[-1,1,'V'],[0,1,'V'],[1,1,'V'],[0,2,'V']],
  dizzy:[[-1,-1,'e'],[1,-1,'e'],[0,0,'e'],[-1,1,'e'],[1,1,'e']], squeeze:[[-1,-1,'e'],[0,0,'e'],[-1,1,'e']],
  cry:[[-1,0,'e'],[0,0,'e'],[1,0,'e'],[0,1,'q'],[0,2,'q'],[0,3,'q']], wink:[[-1,1,'e'],[0,0,'e'],[1,1,'e']],
};
const MOUTH={
  w:[[7,10,'o'],[8,10,'m'],[9,10,'m'],[10,10,'o']], smile:[[7,10,'o'],[8,10,'n'],[9,10,'n'],[10,10,'o']],
  open:[[7,10,'o'],[8,10,'M'],[9,10,'M'],[10,10,'o'],[8,11,'o'],[9,11,'o']], o:[[8,10,'M'],[9,10,'M'],[8,11,'o'],[9,11,'o']],
  flat:[[7,10,'o'],[8,10,'o'],[9,10,'o'],[10,10,'o']], frown:[[8,10,'o'],[9,10,'o'],[7,11,'o'],[10,11,'o']],
  blep:[[7,10,'o'],[8,10,'m'],[9,10,'m'],[10,10,'o'],[9,11,'n']], lick:[[7,10,'o'],[8,10,'n'],[9,10,'n'],[10,10,'o'],[8,11,'n']],
  smirk:[[7,10,'m'],[8,10,'o'],[9,10,'o'],[10,10,'o'],[11,9,'o']],
};
const FACES={
  // 18 种对外表情
  normal:{L:'dot',m:'w'}, happy:{L:'happy',m:'smile'}, content:{L:'closed',m:'w'}, sleepy:{L:'drowsy',m:'o'},
  curious:{L:'wideL',R:'wideR',mirror:0,m:'w'}, surprise:{L:'wideL',R:'wideR',mirror:0,m:'o',blush:0}, sparkle:{L:'star',m:'smile'},
  love:{L:'heart',m:'smile',blush:2}, angry:{L:'dot',m:'frown',brow:1,blush:0,vein:1}, meh:{L:'half',m:'flat',blush:0},
  shy:{L:'lookR',R:'lookR',mirror:0,m:'w',blush:2}, wink:{L:'dot',R:'wink',m:'blep'}, cry:{L:'cry',m:'frown',blush:0},
  dizzy:{L:'dizzy',m:'open',sweat:1}, meow:{L:'closed',m:'open'}, smug:{L:'halfL',R:'halfL',mirror:0,m:'smirk'}, laugh:{L:'squeeze',m:'open'},
  blep:{L:'dot',m:'blep'},
  // 动作内部用
  sleepSnug:{L:'sleep',m:'w'}, lookUp:{L:'up',m:'w'}, lookDown:{L:'down',m:'w'}, lookDownO:{L:'down',m:'o'},
  lickA:{L:'closed',m:'lick'}, wipe:{L:'closed',m:'w'}, lookPaw:{L:'lookPawL',R:'lookPawR',mirror:0,m:'w'},
  lookR:{L:'lookR',R:'lookR',mirror:0,m:'w'}, lookL:{L:'lookL',R:'lookL',mirror:0,m:'w'}, lookRnear:{L:'lookR',R:'lookR',mirror:0,m:'o'}, lookRfar:{L:'lookRup',R:'lookRup',mirror:0,m:'w'},
  halfOpen:{L:'half',m:'w'}, yawn:{L:'closed',m:'open'}, focus:{L:'wideL',R:'wideR',mirror:0,m:'w',blush:0},
};
const FACE_NAMES={normal:'正常',happy:'开心',content:'满足',sleepy:'犯困',curious:'好奇',surprise:'惊讶',sparkle:'星星眼',love:'爱心眼',angry:'生气',meh:'无语',
  shy:'害羞',wink:'眨眼',cry:'哭',dizzy:'晕',meow:'喵',smug:'得意',laugh:'大笑',blep:'吐舌'};
function face(G,ox,oy,name){const f=FACES[name]||FACES.normal;
  for(let y=6;y<=9;y++)for(const x of [5,6,7,10,11,12])if(y<9||'eqrywoV'.includes((G[oy+y]||[])[ox+x]))put(G,ox+x,oy+y,'b');   // 清空眼区
  for(let x=7;x<=10;x++){put(G,ox+x,oy+10,'b');put(G,ox+x,oy+11,'b')}put(G,ox+11,oy+9,'b');put(G,ox+7,oy+9,'m');put(G,ox+10,oy+9,'m');
  const L=EYE[f.L],Rr=EYE[f.R||f.L],mir=f.mirror??1;
  L.forEach(([dx,dy,c])=>put(G,ox+6+dx,oy+7+dy,c));Rr.forEach(([dx,dy,c])=>put(G,ox+11+(mir?-dx:dx),oy+7+dy,c));
  MOUTH[f.m].forEach(([x,y,c])=>put(G,ox+x,oy+y,c));
  const bl=f.blush??1;put(G,ox+4,oy+9,bl?'p':'b');put(G,ox+13,oy+9,bl?'p':'b');if(bl>1){put(G,ox+5,oy+9,'p');put(G,ox+12,oy+9,'p')}
  if(f.brow)[[5,5],[6,6],[7,6],[12,5],[11,6],[10,6]].forEach(([x,y])=>put(G,ox+x,oy+y,'o'));
  if(f.vein)[[14,1],[16,1],[15,2],[14,3],[16,3]].forEach(([x,y])=>put(G,ox+x,oy+y,'V'));
  if(f.sweat)[[16,3],[16,4],[17,4],[16,5],[17,5]].forEach(([x,y])=>put(G,ox+x,oy+y,'q'));
  return G}
// 3/4 转头：眼睛中心列 8 / 13，嘴在 11-13
function faceT(G,ox,oy,name){const f=FACES[name]||FACES.normal;
  for(let y=6;y<=8;y++)for(const x of [7,8,9,12,13,14])if(G[oy+y][ox+x]!=='o'||y>6)put(G,ox+x,oy+y,'b');
  for(const x of [11,12,13])put(G,ox+x,oy+10,'b');put(G,ox+14,oy+10,'o');put(G,ox+15,oy+10,'o');
  const L=EYE[f.L],Rr=EYE[f.R||f.L],mir=f.mirror??1;
  L.forEach(([dx,dy,c])=>put(G,ox+8+dx,oy+7+dy,c));Rr.forEach(([dx,dy,c])=>{const x=13+(mir?-dx:dx);if(x<=14)put(G,ox+x,oy+7+dy,c)});
  MOUTH[f.m].forEach(([x,y,c])=>{const xx=x+3;if(xx>=10&&xx<=13)put(G,ox+xx,oy+y,c)});
  const bl=f.blush??1;put(G,ox+6,oy+9,bl?'p':'b');put(G,ox+14,oy+9,bl?'p':'b');
  if(f.sweat)[[16,2],[16,3],[17,3]].forEach(([x,y])=>put(G,ox+x,oy+y,'q'));return G}
const sitFace=(name,tf=0)=>face(sit(tf),0,0,name);
const turnedFace=name=>edit(HEAD_R(),G=>faceT(G,0,0,name));

/* ================= 侧身行走：A 标准（定稿，比原稿收窄 2px） ================= */
// 腿：1px 宽 + 朝前的小脚掌；fx=脚掌相对腿根的偏移（迈步角度），up=抬起格数
function legP(G,x,top,bottom,fill,fx=0,up=0){bottom-=up;
  for(let y=top;y<=bottom;y++){const k=bottom===top?1:(y-top)/(bottom-top),sx=x+Math.round(fx*k),
    s=y===bottom?'oooo':y===bottom-1?'o'+fill+fill+'o':'o'+fill+'o';
    [...s].forEach((c,i)=>{const cur=G[y]&&G[y][sx+i];if(cur===undefined)return;if(c==='o'&&i>0&&i<s.length-1&&cur!=='.'&&cur!=='o')return;G[y][sx+i]=c})}}
// 迈步 4 帧：[近后, 远后, 远前, 近前] → [x, 抬起, 脚偏移]
const STEP4=(B,F,s=1)=>[[[B-s,0,-1],[B+s+1,0,1],[F-s-1,0,-1],[F+s,0,1]],[[B,1,0],[B+1,0,0],[F-1,1,0],[F,0,0]],
                        [[B+s+1,0,1],[B-s,0,-1],[F+s,0,1],[F-s-1,0,-1]],[[B+1,0,0],[B,1,0],[F,0,0],[F-1,1,0]]];
const TAIL_Q=[{1:"1:oo",2:"0:otto",3:"0:oto",4:"0:oto",5:"0:oto",6:"0:oto",7:"1:oto",8:"1:ooto",9:"2:oo"},
              {1:"2:oo",2:"1:otto",3:"1:oto",4:"0:oto",5:"0:oto",6:"0:oto",7:"1:oto",8:"1:ooto",9:"2:oo"}];   // 问号尾巴，尾尖左右摆
const SIDE={w:24,h:19,hx:5,cx:14,top:15,bottom:18,
  body:{8:"3:oooo",9:"2:obbbbooo",10:"1:obbgbbgbbo",11:"0:obbbbgbbgbbb",12:"0:obbbbbbbbbbb|19:o",13:"0:obbbbbbbbbbbbbbbbbllo",14:"1:obbbbbbbbbbbbbbbblo",15:"2:ooooooooooooooooo"},
  shade:{12:"5:d",13:"6:d",14:"6:d"},tail:TAIL_Q,legs:STEP4(2,14)};
function sideWalk(step,tf,{expr=null,bob=0}={}){step=((step%4)+4)%4;const v=SIDE,G=blank(v.w,v.h),L=v.legs[step],b=bob&&step%2?1:0;   // 帧号对负数取正（时间早于起点时 floor 出负数）
  [1,2].forEach(i=>legP(G,L[i][0],v.top,v.bottom,'d',L[i][2],L[i][1]));
  sp(G,v.tail[tf],0,b);sp(G,v.body,0,b);sp(G,v.shade,0,b);
  [0,3].forEach(i=>legP(G,L[i][0],v.top+1,v.bottom,'b',L[i][2],L[i][1]));
  stamp(G,expr?turnedFace(expr):HEAD_R(),v.hx,b);G.cx=v.cx;return G}

/* ================= 趴与睡：脸贴地 ================= */
// 斜着趴：头朝镜头，下巴搁在两只前爪上；身体往右后方延伸，耳朵始终衬在背景上。头和端坐时同一位置
const HUMP=[{6:"12:oooooooo",7:"10:oobbgbbgbboo",8:"9:obbbbgbbgbbbbo",9:"9:obbbbbbbbbbbbbo",10:"9:obbbbbbbbbbbbbbo",11:"9:obbbbbbbbbbbbbbo",12:"9:obbbbbbbbbbbbbbo",13:"10:ooooooooooooooo"},
            {5:"12:oooooooo",6:"10:oobbgbbgbboo",7:"9:obbbbgbbgbbbbo",8:"9:obbbbbbbbbbbbbo",9:"9:obbbbbbbbbbbbbbo",10:"9:obbbbbbbbbbbbbbo",11:"9:obbbbbbbbbbbbbbo",12:"9:obbbbbbbbbbbbbbo",13:"10:ooooooooooooooo"}];   // [1] 吸气
const TAILF=[{11:"25:o",12:"24:oto",13:"15:oooooooootto",14:"15:oooooooooo"},{10:"25:o",11:"25:oo",12:"24:otto",13:"16:ooooooootto",14:"16:ooooooooo"}];   // 尾巴绕到身前
const PAWS2={12:"3:obbo|9:obbo",13:"2:oooooo|8:oooooo"};
const NOSE_BUBBLE=[[],[[11,10,'q']],[[11,10,'q'],[12,10,'q'],[11,9,'w'],[12,9,'q']],[[11,10,'q'],[12,10,'q'],[13,10,'q'],[11,9,'q'],[12,9,'w'],[13,9,'q'],[12,8,'q']]];
const ZZ=[{0:"22:zzz",1:"23:z",2:"22:zzz",3:"19:zz",4:"19:zz"},{1:"22:zzz",2:"23:z",3:"22:zzz",4:"19:zz",5:"19:zz"}];
// 选项：expr 表情，ears 耳朵放松，bubble 鼻涕泡帧(0-3)，breathe 呼吸帧，zz Z 字帧，tail 尾巴帧
function st_lie({expr='lookUp',ears=0,bubble=-1,breathe=0,zz=-1,tail=0}={}){const G=blank(27,15);
  sp(G,TAILF[tail%2]);sp(G,HUMP[breathe%2]);
  const H=HEAD12();face(H,0,0,expr);if(ears)EARS_RELAX(H);stamp(G,toRows(H),0,0);sp(G,PAWS2);
  if(bubble>=0)NOSE_BUBBLE[bubble%4].forEach(([x,y,c])=>put(G,x,y,c));if(zz>=0)sp(G,ZZ[zz%2]);return G}

/* ================= 端坐类状态 ================= */
const liftL=G=>{for(let y=15;y<=19;y++){G[y][6]='b';G[y][7]='l';G[y][8]='d'}return G};   // 抬起画面左侧前腿
const liftR=G=>{for(let y=15;y<=19;y++){G[y][9]='d';G[y][10]='l';G[y][11]='b'}return G};  // 抬起画面右侧前腿
function mitt(G,x,y,h){sp(G,{[y]:`${x+1}:ooo`});for(let k=1;k<h;k++)sp(G,{[y+k]:`${x}:obbbo`})}   // 圆手套爪，下端并进胸口
// 舔爪洗脸：0 伸舌舔 / 1 收舌、爪子上抬 / 2 停一下看爪子 / 3 爪子贴脸抹（那一侧耳朵倒下）
function st_lick(f,tf=0){const G=liftL(sit(tf));
  if(f===0){face(G,0,0,'lickA');mitt(G,6,11,4);put(G,8,11,'n')}
  if(f===1){face(G,0,0,'content');mitt(G,6,10,5)}
  if(f===2){face(G,0,0,'lookPaw');mitt(G,5,12,3)}
  if(f===3){face(G,0,0,'wipe');const H=G.slice(0,12).map(r=>r.slice(0,18));EARS_RELAX(H,'L');H.forEach((r,y)=>r.forEach((c,x)=>G[y][x]=c));
    sp(G,{7:"3:ooo",8:"2:obbbo",9:"2:obbbo",10:"2:obbbo",11:"3:obbbo",12:"4:obbo",13:"4:obbo",14:"4:obo"})}
  return G}
const LICK_SEQ=[0,1,0,1,0,1,2,2,3,3,3,1];   // 每帧 0.2 秒
function st_happy(f){const G=blank(20,21);stamp(G,HAPPY);sp(G,V3TAIL[f]);if(f)sp(G,{1:"0:y|19:y",3:"17:y"});else sp(G,{2:"1:y",0:"16:y"});return G}
function st_hold(f){const G=sit(f);sp(G,{7:"6:b|11:b",8:"6:e|11:e",9:"6:e|11:e"});
  sp(G,{14:"6:RRRRRR",15:"5:RrrhrrR",16:"5:RrhrrrR",17:"5:RrrrhrR",18:"5:RhrrrrR",19:"6:RRRRRR",20:"12:rr"},f?0:1,0);sp(G,{14:"4:olo|12:olo",15:"4:olo|12:olo",16:"4:ooo|12:ooo"},f?0:1,0);return G}
function st_alert(f){const H=blank(20,30);stamp(H,toRows(sit(0)),0,9);sp(H,{0:"6:ooooooo",1:"5:owwwwwwwo",2:"5:owwwrwwwo",3:"5:owwwrwwwo",4:"5:owwwrwwwo",5:"5:owwwwwwwo",6:"5:owwwrwwwo",7:"6:oooowoo",8:"9:o"},0,f?0:1);return H}

/* ================= 玩毛线球（随机触发） ================= */
const YARN6=(x,y)=>({[y]:`${x+1}:RRRR`,[y+1]:`${x}:RrrhrR`,[y+2]:`${x}:RrhrrR`,[y+3]:`${x}:RhrrrR`,[y+4]:`${x+1}:RRRR`});
// 拍吊球：球挂在右脸旁边来回荡，眼睛一直跟着球；球荡近时抬起右爪拍（露肉垫）
function p_swing(t){const G=blank(28,25),a=Math.sin(t*2.6),bx=Math.round(21+a*4),by=10,near=bx<=19;
  const S=sit(0);if(near)liftR(S);face(S,0,0,bx<=18?'lookRnear':bx>=23?'lookRfar':'lookR');stamp(G,toRows(S),0,4);
  for(let y=0;y<by-2;y++)G[y][Math.round(23+(bx-23)*(y/(by-2)))]='T';
  sp(G,{[by-3]:`${bx-1}:RRR`,[by-2]:`${bx-2}:RrhrR`,[by-1]:`${bx-2}:RrrhR`,[by]:`${bx-2}:RhrrR`,[by+1]:`${bx-1}:RRR`});
  if(near)sp(G,{10:"14:oooo",11:"13:oppppo",12:"13:obpbbo",13:"13:obbbbo",14:"12:obbbbo",15:"11:obbbbo",16:"11:obbbo"});
  return G}
// 下巴贴地拨球：球在下巴前面，爪子往前一伸把球拨出去，球再滚回来
function p_bat(t){const G=blank(27,22),k=(t*1.1)%1,hit=k<.22,by=14+Math.round(hit?0:Math.sin((k-.22)/.78*Math.PI)*4);
  stamp(G,toRows(st_lie({expr:hit?'lookDownO':'lookDown'})),0,0);
  if(hit)sp(G,{12:"8:obbo",13:"8:obbo",14:"8:obbo",15:"8:obppo",16:"9:ooo"});
  sp(G,YARN6(11,by));return G}
// 侧躺抱球蹬：趴着把球抱在身前，前爪按住、后爪蹬
function p_kick(f){const G=blank(28,19),L=st_lie({expr:f?'laugh':'happy'});
  for(let y=13;y<15;y++)for(let x=14;x<27;x++)if('ot'.includes(L[y][x]))L[y][x]=y===13&&x<25?'o':'.';   // 尾巴收到身后
  stamp(G,toRows(L),0,0);const bx=f?14:15;
  sp(G,{12:`${bx+1}:RRRR`,13:`${bx}:RrrhrR`,14:`${bx}:RrhrrR`,15:`${bx}:RhrrrR`,16:`${bx}:RrrrhR`,17:`${bx+1}:RRRR`});
  sp(G,{12:"11:ooo",13:"10:obbbo",14:"10:obppo",15:"11:ooo"});
  sp(G,f?{11:"20:ooo",12:"19:obbbo",13:"19:ppbbo",14:"19:oooo"}:{11:"22:ooo",12:"21:obbbo",13:"21:obbpo",14:"22:ooo"});return G}
// 翻肚皮：头侧过来朝镜头，肚皮朝上，四爪朝天抱球、后腿蹬
function p_belly(f){const G=blank(32,18);
  sp(G,f?{12:"28:oo",13:"27:otto",14:"27:oto",15:"26:ooto",16:"26:ooo"}:{13:"28:oo",14:"27:otto",15:"26:ooto",16:"26:ooo"});
  sp(G,{3:"13:ooo",4:"12:odddo",5:"12:odddo",6:"13:odo"});
  sp(G,f?{4:"25:ooo",5:"24:odddo",6:"24:odddo",7:"25:odo"}:{2:"24:ooo",3:"23:odddo",4:"23:odddo",5:"24:oddo",6:"25:odo"});
  sp(G,{7:"14:oooooooooo",8:"12:oolllllllllloo",9:"11:obllllllllllllbo",10:"11:obllllllllllllbo",11:"11:obbllllllllllbbo",12:"11:obbbbbbbbbbbbbbo",
        13:"11:obbgbbbgbbbgbbbo",14:"11:obbbbbbbbbbbbbbo",15:"12:oobbbbbbbbbboo",16:"14:oooooooooo"});
  const H=HEAD12();face(H,0,0,'happy');stamp(G,rotCCW(toRows(H)),0,0);
  sp(G,YARN6(16,f?2:3));
  sp(G,{3:"14:ooo",4:"13:obppo",5:"13:obbbo",6:"13:obbbo",7:"14:obbbo",8:"15:obo"});
  sp(G,f?{2:"22:ooo",3:"21:oppbo",4:"21:obbbo",5:"22:obbbo",6:"23:obbbo",7:"24:obo"}:{4:"23:ooo",5:"22:oppbo",6:"22:obbbo",7:"23:obbbo",8:"24:obo"});
  return G}
// 毛线茧：整个身子裹成一团毛线，只露出头和尾巴尖，晕乎乎地晃
function p_cocoon(t){const f=Math.floor(t*6)%2,G=blank(28,22),S=blank(20,21);stamp(S,V3HEAD.slice(0,12),0,0);face(S,0,0,'dizzy');
  sp(S,{11:"4:RRRRRRRRRR",12:"3:RrrhrrRrrrR",13:"2:RrrRrrhrrRrrR",14:"1:RrhrrRrrrRrhrR",15:"1:RrrrhrrRrrrrhR",16:"1:RRrrrrhrRrrrrR",17:"1:RrrhRrrrrRhrrR",18:"1:RrrrrRrhrrRrrR",19:"2:RrhrrrRrrrhR",20:"4:RRRRRRRRRR"});
  sp(S,{2:"2:r|15:r",3:"3:r|14:r",4:"4:rr"});stamp(G,toRows(S),1+f,1);
  sp(G,f?{13:"17:oo",14:"17:oto",15:"18:oo"}:{14:"17:oo",15:"17:oto",16:"17:oo"});
  sp(G,{19:"16:rr",20:"18:rr",21:"20:rrr"});sp(G,{16:"23:RRR",17:"22:RrhrR",18:"22:RhrrR",19:"22:RrrhR",20:"23:RRR"});return G}
// 线绕在身上：几圈线顺着身体的弧度绕，耳朵根也挂了线，线头拖到地上的毛线团
function p_wrapped(t){const f=Math.floor(t*5)%2,G=blank(28,22),S=sit(0);face(S,0,0,'surprise');
  [[13,[[2,0],[4,1],[8,1],[11,1],[14,0]]],[16,[[2,0],[5,1],[9,2],[12,1],[15,0]]],[19,[[1,0],[5,1],[9,1],[13,1],[16,0]]]].forEach(([y0,pts])=>{
    for(let i=0;i<pts.length-1;i++){const [x0,d0]=pts[i],[x1,d1]=pts[i+1];for(let x=x0;x<=x1;x++){const d=Math.round(d0+(d1-d0)*(x-x0)/(x1-x0));if(S[y0+d]&&S[y0+d][x]!=='.')S[y0+d][x]='r'}}});
  [[3,4],[4,4],[5,3],[4,13],[3,13],[5,14]].forEach(([y,x])=>S[y][x]='r');stamp(G,toRows(S),f,1);
  (f?[[17,18],[18,19],[19,19],[20,20],[21,20]]:[[17,18],[18,18],[19,19],[20,19],[21,20]]).forEach(([x,y])=>G[y][x]='r');
  sp(G,YARN6(21,16));if(f)sp(G,{2:"18:q",3:"18:qq",4:"18:qq"});return G}
const PLAYS=['swing','bat','kick','belly','cocoon','wrapped'];   // 解球时随机挑一个
const PLAY_NAMES={swing:'拍吊球',bat:'下巴贴地拨球',kick:'侧躺抱球蹬',belly:'翻肚皮',cocoon:'毛线茧',wrapped:'线绕在身上'};

/* ================= 第五轮：背影、拍扁 ================= */
// 背影：端坐的轮廓不变，脸上的五官、胡须换成毛，耳朵内侧换成耳背的暗色，项圈留着
function st_back(tf=0){const G=sit(tf);for(let y=0;y<=12;y++)for(let x=0;x<20;x++){const c=G[y][x];
    if('ewVqyMnm'.includes(c))G[y][x]='b';else if(c==='p')G[y][x]='d';else if(c==='k')G[y][x]='.';else if(c==='o'&&y>=7&&y<=11&&x>=5&&x<=13)G[y][x]='b'}return G}
// 拍扁：脸贴地趴着、身子压扁拉长（耳朵那两行去掉、身子中间多出几列），眼睛是两个叉；f 只换尾巴尖
function st_splat(f=0){const rows=toRows(st_lie({expr:'dizzy',ears:1,tail:f})).filter((r,y)=>y!==1&&y!==3),X=20,N=4;
  return rows.map(r=>[...(r.slice(0,X)+r[X].repeat(N)+r.slice(X))])}

/* ================= 新点子 ================= */
// 慢眨眼：猫的"我喜欢你"。睁 → 半闭 → 闭 → 停 → 半闭
const SLOW=[['normal',1.4],['halfOpen',.25],['content',.25],['content',.7],['halfOpen',.25]];
function st_slowBlink(t,tf=0){const T=SLOW.reduce((s,x)=>s+x[1],0);let k=t%T,i=0;while(k>SLOW[i][1]){k-=SLOW[i][1];i++}return sitFace(SLOW[i][0],tf)}
// 招财猫招手：右爪举在脸边，手腕上下折
function st_maneki(f,tf=0){const G=liftR(sit(tf));face(G,0,0,'happy');
  sp(G,f?{9:"15:ooo",10:"14:obbbo",11:"14:obbbo",12:"13:obbbo",13:"12:obbbo",14:"12:obbo"}:{7:"15:ooo",8:"14:oppbo",9:"14:opppo",10:"14:obbbo",11:"14:obbbo",12:"13:obbbo",13:"12:obbbo",14:"12:obbo"});return G}
// 踩奶：两只前爪轮流抬起踩下，垫着小毯子
function st_knead(f,tf=0){const G=blank(22,23),S=sit(tf);face(S,0,0,'content');
  if(f%2){liftL(S);sp(S,{16:"5:ooo",17:"5:olo",18:"5:olo",19:"5:olo"})}else{liftR(S);sp(S,{16:"10:ooo",17:"10:olo",18:"10:olo",19:"10:olo"})}
  sp(G,{19:"0:hhhhhhhhhhhhhhhhhhhh",20:"0:hphphphphphphphphphp",21:"0:hhhhhhhhhhhhhhhhhhhh",22:"0:pppppppppppppppppppp"});stamp(G,toRows(S),0,1);return G}
// 伸懒腰（侧面）：前腿往前平伸、胸口压低、屁股翘高、打哈欠
function st_stretch(f){const G=blank(31,19);
  sp(G,{0:"2:oo",1:"1:otto",2:"1:oto",3:"1:oto",4:"1:oto",5:"2:oto",6:"2:ott"});
  sp(G,{5:"3:oooo",6:"2:obbbboo",7:"1:obbgbbgbo",8:"1:obbbgbbgbbo",9:"1:obbbbbbbbbbbo",10:"1:obbbbbbbbbbbbbo",11:"1:obbbbbbbbbbbbbbbo",12:"2:obbbbbbbbbbbbbbbbo",
        13:"2:obbbbbbbbbbbbbbbbbbo",14:"3:ooobbbbbbbbbbbbbbbo",15:"5:oooooooooooooooo"});
  sp(G,{9:"5:d",10:"6:d",11:"6:d",12:"6:d",13:"6:d"});leg(G,2,5,'d',13);leg(G,4,5,'b',13);
  sp(G,{15:"14:oooooooooooooo",16:"13:odddddddddddddo",17:"13:obbbbbbbbbbbbbbbo",18:"13:oooooooooooooooo"});
  stamp(G,turnedFace(f?'yawn':'content'),11,5);return G}
// 屁股扭扭准备扑（侧面低伏）：0/1 扭屁股、尾巴尖抖，2 扑出去
function st_pounce(f){const G=blank(30,17);
  if(f<2){const w=f?1:0;
    sp(G,{2:`${1+w}:oo`,3:`${w}:oto`,4:`${w}:oto`,5:`${1+w}:oto`,6:`${1+w}:ooto`,7:`${2+w}:oo`});
    sp(G,{6:`${3+w}:oooo`,7:`${2+w}:obbbboo`,8:`${1+w}:obbgbbgbbo`,9:`${1+w}:obbbgbbgbbbo`,10:"1:obbbbbbbbbbbbbbbbbo",11:"1:obbbbbbbbbbbbbbbbbbbo",12:"2:obbbbbbbbbbbbbbbbbbbo",13:"3:oooooooooooooooooooo"});
    leg(G,2+w,4,'d',12);leg(G,5+w,4,'b',12);sp(G,{14:"15:oooo|19:oooo",15:"14:obbbbo|18:obbbbo",16:"14:oooooo|18:oooooo"});
    stamp(G,turnedFace('focus'),10,3)}
  else{sp(G,{2:"0:oo",3:"0:ott",4:"1:ott",5:"2:ooo"});
    sp(G,{3:"3:oooooo",4:"2:obbbbbbooo",5:"2:obbgbbgbbbbo",6:"2:obbbbbbbbbbbbo",7:"3:obbbbbbbbbbbbbo",8:"4:oooooooooobbbo"});
    sp(G,{7:"0:oo",8:"0:obo",9:"1:oboo",10:"2:ooo"});sp(G,{9:"13:oooo",10:"13:obbbooooo",11:"14:obbbbbbbbo",12:"15:oooooooooo"});
    stamp(G,turnedFace('surprise'),11,-2)}
  return G}
const POUNCE_SEQ=[0,1,0,1,0,1,0,1,2,2,2];   // 每帧 0.18 秒，整套 2 秒

/* ================= 每只猫的性格（与 BREEDS 一一对应） ================= */
// face 默认表情；sig 招牌表情；idle 不被打扰时各待机动作的权重（walk = 闲逛）；slowBlink 被靠近时慢眨眼的概率；role 特殊职责
const PERSONA=[
  {face:'normal',sig:['happy','wink'],text:'玩家自己。可以随时换表情',idle:{},slowBlink:0},
  {face:'content',sig:['love','meow'],text:'温柔。最爱翻肚皮和踩奶，看到人会慢眨眼',idle:{belly:3,knead:3,lie:2,sleep:2,lick:1,walk:2},slowBlink:.9},
  {face:'meh',sig:['smug','angry'],text:'高冷认真。坐得最端正、舔爪最勤，被打扰会不爽',idle:{lick:4,sit:3,lie:1,sleep:1,walk:2},slowBlink:.3},
  {face:'curious',sig:['meow','surprise'],text:'话多、好奇。常张嘴喵，什么都要凑过去看',idle:{meow:3,walk:5,lick:1,lie:1},slowBlink:.5},
  {face:'focus',sig:['surprise','smug'],text:'机警，爱泡图书馆。常蹲坐着把情况看清楚，再扑出去',idle:{sit:3,pounce:2,lick:1,lie:1,walk:3},slowBlink:.4},
  {face:'sparkle',sig:['laugh','dizzy'],text:'精力最旺。扑球最多，也最常把自己缠成茧',idle:{pounce:3,kick:2,cocoon:1,walk:4},slowBlink:.4},
  {face:'sleepy',sig:['content','cry'],text:'懒，也是门口的招财猫。总趴在饭碗边睡，饿了会哭唧唧；来了新毛线球会招手',idle:{sleep:4,lie:3,knead:1,walk:1},slowBlink:.6,role:'maneki'},
];

/* ================= 统一入口 ================= */
const blinkAt=(t,o=0)=>((t+o)*1000%3000)<150;
const faceOr=(ex,d)=>ex&&ex!=='normal'?ex:d;
// POSE[名](t 秒, tf 尾巴帧, o 相位偏移, ex 该猫的默认表情) → {G, cx, dy, flip, blink}
const POSE={
  sit:(t,tf,o=0,ex)=>({G:ex&&ex!=='normal'?sitFace(ex,tf):sit(tf),cx:9.5,blink:blinkAt(t,o)}),
  walkR:(t,tf,o=0,ex)=>{const G=sideWalk(Math.floor(t*8+o),tf,{expr:faceOr(ex,null)});return{G,cx:G.cx,blink:blinkAt(t,o)}},
  walkL:(t,tf,o=0,ex)=>{const G=sideWalk(Math.floor(t*8+o),tf,{expr:faceOr(ex,null)});return{G,cx:G.cx,flip:true,blink:blinkAt(t,o)}},
  lick:(t,tf)=>({G:st_lick(LICK_SEQ[Math.floor(t*5)%LICK_SEQ.length],tf),cx:9.5}),
  lie:(t,tf,o=0,ex)=>({G:st_lie({expr:faceOr(ex,'lookUp'),tail:tf}),cx:9.5,blink:blinkAt(t,o)}),
  sleep:(t,tf,o=0)=>({G:st_lie({expr:'sleepSnug',ears:1,bubble:Math.floor((t+o)*1.6)%4,breathe:Math.floor((t+o)*.9)%2,zz:Math.floor((t+o)*1.2)%2,tail:tf}),cx:9.5}),
  meow:(t,tf,o=0)=>({G:sitFace(Math.floor((t+o)*2.5)%3?'curious':'meow',tf),cx:9.5}),
  happy:t=>{const f=Math.floor(t*4)%2;return{G:st_happy(f),cx:9.5,dy:f?-1:0}},
  hold:t=>({G:st_hold(Math.floor(t*2.5)%2),cx:9.5}),
  alert:t=>({G:st_alert(Math.floor(t*3)%2),cx:9.5}),
  pounce:t=>({G:st_pounce(POUNCE_SEQ[Math.floor(t*5.5)%POUNCE_SEQ.length]),cx:18.5}),
  swing:t=>({G:p_swing(t),cx:9.5}),
  bat:t=>({G:p_bat(t),cx:9.5}),
  kick:t=>({G:p_kick(Math.floor(t*4)%2),cx:9.5}),
  belly:t=>({G:p_belly(Math.floor(t*4)%2),cx:7}),
  cocoon:t=>({G:p_cocoon(t),cx:10.5}),
  wrapped:t=>({G:p_wrapped(t),cx:9.5}),
  slowBlink:(t,tf)=>({G:st_slowBlink(t,tf),cx:9.5}),
  maneki:(t,tf)=>({G:st_maneki(Math.floor(t*3)%2,tf),cx:9.5}),
  knead:(t,tf)=>({G:st_knead(Math.floor(t*2.5)%2,tf),cx:9.5}),
  stretch:t=>({G:st_stretch(Math.floor(t*.8)%2),cx:19.5}),
  leap:()=>({G:st_pounce(2),cx:18.5}),                                           // 跳上跳下（扑出去那一帧）
  // 第五轮：背影（电影院的座位、温泉里、趴在水族馆玻璃前，背对着我们）、跳舞（舞池）、拍扁（从屋顶掉下来，头上转星星）
  back:(t,tf)=>({G:st_back(tf),cx:9.5}),
  dance:t=>{const f=Math.floor(t*4)%4;return{G:f%2?st_happy(f>>1):st_maneki(0,f>>1),cx:9.5,dy:f%2?-1:0,flip:f>1}},
  splat:t=>({G:st_splat(Math.floor(t*3)%2),cx:13.5}),
};
const FACING=new Set(['lie','sleep','bat','kick','belly','stretch','pounce','leap']);   // 这些姿态跟着猫的朝向水平翻转
const DUR={pounce:2,lick:2.4,stretch:1.6,slowBlink:2.9};                         // 一次完整动作的秒数（其余可任意时长）

/* ================= 头顶小符号 ================= */
const EMO={heart:["oo.oo","ooooo",".ooo.","..o.."],note:["..oo","..o.","..o.","ooo.","oo.."],bang:["o","o","o",".","o"],q:["ooo","..o",".o.","...",".o."],anger:["o.o",".o.","o.o"]};
const EMO_C={heart:'#e0533d',note:'#ffd84a',bang:'#ffd84a',q:'#fff4dc',anger:'#e0533d'};
// (x,y) = 符号底部中点
function drawEmote(ctx,x,y,kind,t=0){const g=EMO[kind];if(!g)return;const w=g[0].length,ox=Math.round(x-w/2),oy=Math.round(y-g.length+Math.sin(t*4));
  ctx.fillStyle='#241a2e';g.forEach((r,j)=>[...r].forEach((c,i)=>{if(c==='o')ctx.fillRect(ox+i-1,oy+j-1,3,3)}));
  ctx.fillStyle=EMO_C[kind];g.forEach((r,j)=>[...r].forEach((c,i)=>{if(c==='o')ctx.fillRect(ox+i,oy+j,1,1)}))}

/* ================= 渲染 ================= */
// (x,y) = 锚点列 cx 的脚底；flip 时以 cx 为轴镜像
function drawF(ctx,G,b,x,y,o={}){const h=G.length,cx=o.cx??9.5,oy=Math.round(y-h+(o.dy||0));
  G.forEach((r,ry)=>r.forEach((ch,rx)=>{if(ch==='.')return;if(o.blink&&(ch==='e'||ch==='w')){const bl=(G[ry+1]||[])[rx];if(bl==='e'||bl==='w')ch='b'}
    const c=color(ch,b);if(!c)return;ctx.fillStyle=c;const px=o.flip?Math.round(x+cx-rx-1):Math.round(x-cx+rx);ctx.fillRect(px,oy+ry,1,1)}))}
// 便捷：按 POSE 画一只猫。k 姿态名，bi 毛色序号，face 'L'/'R' 朝向，ex 表情（默认用这只猫的性格表情），yarn 毛线换色 [主色, 暗边, 高光]，mirror 额外左右翻一次
function drawCat(ctx,k,bi,x,y,t,{o=0,face='R',ex,yarn,mirror}={}){const tf=(Math.floor(t*2)+bi)%2,P=POSE[k](t+o,tf,o,ex??PERSONA[bi].face);
  if(face==='L'&&FACING.has(k))P.flip=true;if(mirror)P.flip=!P.flip;drawF(ctx,P.G,yarn?{...BREEDS[bi],yarn}:BREEDS[bi],x,y,{cx:P.cx,flip:P.flip,dy:P.dy||0,blink:P.blink});return P}
rebuild();
