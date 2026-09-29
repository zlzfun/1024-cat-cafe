/* 1024 猫咖 · 像素猫精灵（v1，已冻结：仅供 cat-final-v1 / cat-rework-v1 两个历史页面使用；新代码请用 cat-sprites.js v2）
   V3 端坐（头宽 14px）为静止态；S2 3/4 转头侧身（身长 −5px）为移动态；含 4 个玩毛线球动作与 7 个状态。
   坐标约定：drawF(ctx, 网格, 毛色, x, y, {cx, flip, dy, blink})，(x,y) 为锚点列 cx 的脚底。 */
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
  case 'e':return '#241a2e';case 'w':return '#ffffff';case 'k':return b.whisk;case 'c':return b.collar;case 'y':return '#ffd84a';case 'q':return '#8fc8f0';
  case 'x':case 'm':case 't':return b.points||b.body;case 'f':case 'g':return b.stripe||b.spot||b.body;
  case 'r':return '#e0533d';case 'R':return '#9e2f2a';case 'h':return '#f7a58c';case 'z':return '#b9a8c9';case 'T':return '#d9d2c4';
  case 'u':return b.tuft?b.outline:null;default:return null}}

/* ================= 网格工具 ================= */
const mir=rows=>rows.map(r=>r+[...r].reverse().join(''));
const blank=(w,h)=>Array.from({length:h},()=>Array(w).fill('.'));
function stamp(G,rows,dx=0,dy=0){rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&G[y+dy]&&x+dx>=0&&x+dx<G[0].length)G[y+dy][x+dx]=c}))}
function sp(G,o,dx=0,dy=0){for(const y in o)o[y].split('|').filter(Boolean).forEach(seg=>{const [sx,s]=seg.split(':');[...s].forEach((c,i)=>{if(c==='.')return;const yy=+y+dy,xx=+sx+i+dx;if(G[yy]&&xx>=0&&xx<G[0].length)G[yy][xx]=c})})}
function leg(G,x,len,fill,top){for(let i=0;i<len;i++){const y=top+i;if(!G[y])continue;const s=i===len-1?'ooo':'o'+fill+'o';[...s].forEach((c,k)=>{if(G[y][x+k]!==undefined)G[y][x+k]=c})}}
function legUp(G,x,len,bottom){for(let i=0;i<len;i++){const y=bottom-i;const s=i===len-1?'opo':'olo';[...s].forEach((c,k)=>G[y][x+k]=c)}[...'ooo'].forEach((c,k)=>G[bottom-len][x+k]=c)}
const toRows=G=>G.map(r=>r.join(''));
const rot180=R=>R.slice().reverse().map(r=>[...r].reverse().join(''));

/* ================= V3 ================= */
const V3_HALF=["..u......","..o......","..oo.....","..opo....","..oppxooo",".obbbbfbf",".obbbbbbf",".obbbbebb","kobbbbebb",".obpbbbmn","kobbbbbom","..obbbbbb","...occccc","...obbbll","..obbbbll","..obgblld","..obbglld",".obbbblld",".obgbblld",".obbbolld","..ooooooo"];
// 窄头：头部(0-12 行)每半边去掉一列，再在外侧补一列空白，身体不变
const narrowHalf=h=>h.map((r,y)=>y>12?r:'.'+(y<5?r.slice(0,6)+r.slice(7):r.slice(0,4)+r.slice(5)));
let V3,V3HEAD,TURNED,HAPPY;
const V3TAIL=[{11:"18:o",12:"17:oto",13:"17:oto",14:"17:oto",15:"17:oto",16:"17:oto",17:"17:oto",18:"17:oto",19:"16:otto",20:"16:ooo"},
              {11:"19:o",12:"18:oto",13:"18:oto",14:"17:oto",15:"17:oto",16:"17:oto",17:"17:oto",18:"17:oto",19:"16:otto",20:"16:ooo"}];
const CFG={head:-2,len:-5,nod:0};   // 已定稿：头宽 14px、侧身 −5px、默认不点头
function edit(rows,ops){const G=rows.map(r=>[...r]);ops(G);return toRows(G)}
function rebuild(){const nar=CFG.head<0;V3=mir(nar?narrowHalf(V3_HALF):V3_HALF);V3HEAD=V3.slice(0,13);
  const R=nar?15:16;   // 右侧描边列
  // 3/4 转向右的 V3 头：五官右移，去掉远侧胡须
  TURNED=edit(V3HEAD,G=>{for(let y=0;y<G.length;y++)for(let x=0;x<18;x++){const c=G[y][x];if('epnmk'.includes(c)||(c==='o'&&(y===9||y===10)&&x>6&&x<12))G[y][x]=(x>1&&x<R)?'b':(c==='k'?'.':c)}
    [[7,8,'e'],[8,8,'e'],[7,13,'e'],[8,13,'e'],[9,nar?6:5,'p'],[9,R-1,'p'],[9,11,'m'],[9,12,'n'],[9,13,'n'],[10,11,'o'],[10,14,'o'],[8,R+1,'k'],[10,R+1,'k']].forEach(([y,x,c])=>G[y][x]=c)});
  HAPPY=edit(V3,G=>{[[7,6],[8,6],[7,11],[8,11]].forEach(([y,x])=>G[y][x]='b');[[7,6],[8,5],[8,7],[7,11],[8,10],[8,12]].forEach(([y,x])=>G[y][x]='e');G[10][8]=G[10][9]='n'})}
function sit(tf,noTail){const G=blank(20,21);stamp(G,V3);if(!noTail)sp(G,V3TAIL[tf]);return G}

/* ================= 侧面行走：S2 3/4 转头（定稿） ================= */
const WALK={w:26,h:19,top:15,L:4,B:3,F:13,k:1,shrink:0,   // 已按 −5px 身长直接绘制，不再运行时删列
  body:{9:"4:oooooooo",10:"2:oobbbbgbbbb",11:"1:obbbgbbbbgbbbb",12:"1:obbbbgbbbbgbbbb",13:"1:obbbbbbbbbbbbbbbll",14:"2:obllllllllllllllllo",15:"3:ooooooooooooooooo"},
  tail:{2:"1:oo",3:"0:oto",4:"0:oto",5:"0:oto",6:"0:oto",7:"0:oto",8:"0:oto",9:"1:oto",10:"1:t"},head:{dx:7,dy:0},cx:16};

const GAIT=[{dx:[-2,1,-1,2],up:[0,0,0,0]},{dx:[-1,0,0,1],up:[0,1,0,1]},{dx:[1,-2,2,-1],up:[0,0,0,0]},{dx:[0,-1,1,0],up:[1,0,1,0]}];
function swayTail(t,on){if(!on)return t;const ys=Object.keys(t).map(Number),mid=Math.min(...ys)+Math.floor((Math.max(...ys)-Math.min(...ys))/2),o={};
  for(const y in t)o[y]=+y<mid?t[y].split('|').map(s=>{const [x,c]=s.split(':');return (+x+1)+':'+c}).join('|'):t[y];return o}
// 身长可调：从后腿与前腿之间删去 n 列，前腿、头部整体左移
function sideWalk(step,tf,v=WALK){if(v.rate)step=Math.floor(step*v.rate/8);const n=Math.round(-CFG.len*(v.k>1?1.4:1)*(v.shrink??1)),cut=v.B+4,W=v.w-n;
  const BG=blank(v.w,v.h);sp(BG,v.body);const G=blank(W,v.h);stamp(G,BG.map(r=>r.filter((_,x)=>x<cut||x>=cut+n).join('')));
  const g=(v.gait==='gallop'?GALLOP:GAIT)[step%4],k=v.k,F=v.F-n,up=i=>g.up[i]*(v.lift||1);
  const X=[v.B+Math.round(g.dx[0]*k),v.B+Math.round(g.dx[1]*k),F+Math.round(g.dx[2]*k),F+Math.round(g.dx[3]*k)];
  if(!v.two){leg(G,X[1],v.L-up(1),'d',v.top);leg(G,X[2],v.L-up(2),'d',v.top)}
  leg(G,v.two?v.B+(step%2?1:-1):X[0],v.L-(v.two?(step%2):up(0)),'l',v.top);leg(G,v.two?F+(step%2?-1:1):X[3],v.L-(v.two?1-(step%2):up(3)),'l',v.top);
  sp(G,swayTail(v.tail,tf));const hdy=v.head.dy+(CFG.nod&&step%2?1:0);
  stamp(G,TURNED,v.head.dx-n,hdy);if(v.after)sp(G,v.after,-n,0);
  G.cx=v.cx-n;G.bob=g.bob||0;return G}
/* ================= 玩毛线球（新） ================= */
const YARN=(dx,dy)=>({[0+dy]:`${dx+1}:RRRR`,[1+dy]:`${dx}:RrrhrR`,[2+dy]:`${dx}:RrhrrR`,[3+dy]:`${dx}:RrrrhR`,[4+dy]:`${dx}:RhrrrR`,[5+dy]:`${dx+1}:RRRR`});
function p_belly(f){const G=blank(32,20);
  sp(G,{11:"4:oooooooooo",12:"2:oollllllllllo",13:"1:olllllllllllllo",14:"1:obbbbbbbbbbbbbbo",15:"1:obbbbgbbbbgbbbbo",16:"2:oobbbbbbbbbbbo",17:"4:oooooooooooo"});
  [[3,2+f],[6,3-f],[10,3-f],[13,2+f]].forEach(([x,l])=>legUp(G,x,l,11));
  sp(G,f?{13:"0:o",14:"0:o",15:"0:oto",16:"1:ottoo",17:"2:oooo"}:{14:"0:o",15:"0:oto",16:"0:ottoo",17:"1:oooo"});sp(G,YARN(7,1+f));stamp(G,rot180(HAPPY.slice(0,13)),14,7);return G}
function p_paw(t){const R=sit(0,true).filter((_,i)=>![15,16,17].includes(i));const G=blank(32,18);stamp(G,R,0,0);
  sp(G,{7:"6:b|11:b",8:"6:b|11:b"});sp(G,{7:"7:e|12:e",8:"7:e|12:e"});sp(G,{15:"1:oooooo",16:"0:otttttto",17:"1:oooooo"});
  const yx=Math.round(20+Math.abs(Math.sin(t*2.2))*7),out=yx<22;if(out)sp(G,{14:"15:ooooo",15:"14:ollllpo",16:"15:ooooo"});
  sp(G,{12:`${yx+1}:RRRR`,13:`${yx}:RrrhrR`,14:`${yx}:RhrrrR`,15:`${yx}:RrrhrR`,16:`${yx}:RrhrrR`,17:`${yx+1}:RRRR`});return G}
function p_swing(t){const G=blank(28,31);stamp(G,sit(0),0,10);const a=Math.sin(t*2.6),yx=Math.round(17+a*6),yy=5;
  for(let y=0;y<yy;y++){const x=Math.round(21+(yx+2-21)*(y/yy));G[y][x]='T'}sp(G,YARN(yx,yy));
  sp(G,{17:"6:b|11:b",18:"6:b|11:b"});sp(G,{16:"7:e|12:e",17:"7:e|12:e"});
  if(a<-.1){sp(G,{25:"9:dbb",26:"9:dbb",27:"9:dbb",28:"9:dbb",29:"9:dbo"});sp(G,{11:"13:ooo",12:"12:ollpo",13:"12:olllo",14:"13:olo",15:"13:olo",16:"12:olo",17:"12:olo",18:"11:olo",19:"11:olo",20:"11:olo",21:"11:olo",22:"11:olo",23:"11:olo",24:"11:olo"})}
  return G}
function p_tangle(t){const G=sit(0);const H=blank(26,22);stamp(H,G,1,1);
  sp(H,{8:"7:b|12:b",9:"7:b|12:b"});sp(H,{8:"6:e|14:e",9:"7:e|13:e",10:"6:e|14:e"});sp(H,{11:"9:oo"});
  const lines=[[1,7,18,15],[2,17,17,9],[4,3,15,20],[10,1,13,20]];lines.forEach(([x0,y0,x1,y1])=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i+=1){const x=Math.round(x0+(x1-x0)*i/n),y=Math.round(y0+(y1-y0)*i/n);if(H[y]&&H[y][x]!==undefined&&(i+Math.floor(t*6))%5!==0)H[y][x]='r'}});
  sp(H,{4:"17:q",5:"17:qq",6:"17:qq"},Math.floor(t*3)%2?0:1,0);sp(H,YARN(19,15));return H}
const PLAYS=[
 {name:'四脚朝天蹬球',use:'解题中 · 生活/吐槽类',f:t=>({G:p_belly(Math.floor(t*4)%2)}),w:32,h:20},
 {name:'趴着拨球',use:'解题中 · 选择题',f:t=>({G:p_paw(t)}),w:32,h:18},
 {name:'坐着拍吊球',use:'等待 / 思考中',f:t=>({G:p_swing(t)}),w:28,h:31},
 {name:'被毛线缠住',use:'难题 / 需要传球时',f:t=>({G:p_tangle(t),dx:Math.floor(t*8)%2}),w:26,h:22},
];

/* ================= 已认可的状态 ================= */
function st_groom(f){const G=sit(0);sp(G,{7:"6:b|11:b",8:"6:e|11:e"});sp(G,{15:"9:dbb",16:"9:dbb",17:"9:dbb",18:"9:dbb",19:"9:dbo"});
  sp(G,f?{9:"11:ooo",10:"10:olllo",11:"10:olllo",12:"11:olo",13:"11:olo",14:"11:olo"}:{10:"11:ooo",11:"10:olllo",12:"10:olllo",13:"11:olo",14:"11:olo"});if(f)sp(G,{11:"9:n"});return G}
function st_happy(f){const G=blank(20,21);stamp(G,HAPPY);sp(G,V3TAIL[f]);if(f)sp(G,{1:"0:y|19:y",3:"17:y"});else sp(G,{2:"1:y",0:"16:y"});return G}
function st_hold(f){const G=sit(f);sp(G,{7:"6:b|11:b",8:"6:e|11:e",9:"6:e|11:e"});
  sp(G,{14:"6:RRRRRR",15:"5:RrrhrrR",16:"5:RrhrrrR",17:"5:RrrrhrR",18:"5:RhrrrrR",19:"6:RRRRRR",20:"12:rr"},f?0:1,0);sp(G,{14:"4:olo|12:olo",15:"4:olo|12:olo",16:"4:ooo|12:ooo"},f?0:1,0);return G}
function st_loaf(tf,sleep){const R=sit(tf,true).filter((_,i)=>![15,16,17].includes(i));sp(R,{15:"12:oooooo",16:"11:otttttto",17:"12:oooooo"});if(sleep)sp(R,{7:"6:b|11:b"});return R}
function st_alert(f){const H=blank(20,30);stamp(H,toRows(sit(0)),0,9);sp(H,{0:"6:ooooooo",1:"5:owwwwwwwo",2:"5:owwwrwwwo",3:"5:owwwrwwwo",4:"5:owwwrwwwo",5:"5:owwwwwwwo",6:"5:owwwrwwwo",7:"6:oooowoo",8:"9:o"},0,f?0:1);return H}
function st_sleep(f){const R=st_loaf(0,true);const H=blank(20,R.length+8);stamp(H,toRows(R),0,8);sp(H,f?{0:"14:zzzz",1:"16:z",2:"15:z",3:"14:zzzz",5:"11:zz",6:"11:zz"}:{2:"14:zzzz",3:"16:z",4:"15:z",5:"14:zzzz",6:"11:zz",7:"11:zz"});return H}
const STATES=[
 {name:'待机',f:(t,tf)=>({G:sit(tf),blink:(t*1000%3000)<150})},{name:'洗脸',f:t=>({G:st_groom(Math.floor(t*4)%2)})},
 {name:'开心',f:t=>{const f=Math.floor(t*4)%2;return{G:st_happy(f),dy:f?-1:0}}},{name:'抱毛线球',f:t=>({G:st_hold(Math.floor(t*2.5)%2)})},
 {name:'猫饼',f:(t,tf)=>({G:st_loaf(tf),blink:(t*1000%3600)<150})},{name:'睡觉',f:t=>({G:st_sleep(Math.floor(t*1.2)%2)})},{name:'发现毛线球',f:t=>({G:st_alert(Math.floor(t*3)%2)})},
];

/* ================= 渲染 ================= */
// (x,y) = 锚点列 cx 的脚底；flip 时以 cx 为轴镜像
function drawF(ctx,G,b,x,y,o={}){const h=G.length,cx=o.cx??9.5,oy=Math.round(y-h+(o.dy||0));
  G.forEach((r,ry)=>r.forEach((ch,rx)=>{if(ch==='.')return;if(o.blink&&(ch==='e'||ch==='w')){const bl=(G[ry+1]||[])[rx];if(bl==='e'||bl==='w')ch='b'}
    const c=color(ch,b);if(!c)return;ctx.fillStyle=c;const px=o.flip?Math.round(x+cx-rx-1):Math.round(x-cx+rx);ctx.fillRect(px,oy+ry,1,1)}))}
rebuild();
