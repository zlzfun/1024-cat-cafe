/* 1024 猫咖 · 场景 v4 · 巨树中庭，在整张图的正中间（x 640～1040，布局见 world-map.js 开头）。地图部分在 world4-map.js 后面加载（makeWorld 之前）；WORLD_MODS 里接在 world4-desk.js 后面。
   左边两道门通橱窗长廊、大客厅，右边一道门通工坊；右下角不砌墙，和后院连成一片草地。四条石子路都通到树下。
   店里别的东西都在 10～60 像素之间，这一棵有 400 多像素高，比哪一样都大一个量级：走到树底下，树冠在画面外面，只看得到树干往上伸。
   - 样子：金色树冠；树干和横枝裹着五色毛线织的套子（yarn bombing）；树下一圈石头围起来的树池，地上是树冠的斑驳影子和落叶。
   - 家族树：六根横枝各挂一块圆牌，是猫猫咖啡馆的六个家族（布偶 Claude、缅因 Codex、暹罗 Gemini、狸花 GLM、孟加拉 Antigravity、金渐层 opencode）。
     猫可以一根根跳上去；树顶有个瞭望台，你坐上去，画面就切到"看风景"（world4-vista.js）。
   - 全店一起挂：任何一只猫往橱窗里挂一件成品，树上就多挂一件（夜里每件上面亮一颗小灯）。挂满 36 件，满树金光十几秒，然后收下来重新挂。
   - 第一次走进中庭：镜头顺着树干摇上树冠（A.reveal + 引擎里的 A.camHook），页面上出一行大字。 */
const TREE={cx:840,base:402,N:36,top:{x:840,y:100},floor:{x:846,y:432},
  // 六根横枝：s 朝哪边，y 枝面的高度（猫脚底），len 长度，fam 家族（BREEDS 下标），col 毛线套的颜色
  br:[{s:1,y:372,len:42,fam:1,col:'#d97757'},{s:-1,y:330,len:42,fam:2,col:'#5B8C5A'},{s:1,y:288,len:40,fam:3,col:'#5B9BD5'},
      {s:-1,y:246,len:40,fam:4,col:'#e0533d'},{s:1,y:206,len:38,fam:5,col:'#e8b83a'},{s:-1,y:166,len:38,fam:6,col:'#9B7EBD'}]};
const treeCX=y=>TREE.cx+Math.round(5*Math.sin((TREE.base-y)/70)),treeHW=y=>Math.round(19+11*Math.max(0,Math.min(1,(y-150)/(TREE.base-150))));
const brX0=b=>treeCX(b.y)+b.s*(treeHW(b.y)-3);
// 猫能待的位置：六根横枝 + 树顶瞭望台两个位置。z 都比树干的 base 大一点：画在树干前面
const TREE_PERCH=[...TREE.br.map(b=>({x:brX0(b)+b.s*(b.len-13),y:b.y-1,z:TREE.base+.5,face:b.s>0?'R':'L'})),
  {x:TREE.top.x-11,y:TREE.top.y,z:TREE.base+.5,face:'R'},{x:TREE.top.x+11,y:TREE.top.y,z:TREE.base+.5,face:'L'}];
const FAM_NAMES=[null,['布偶猫','Claude'],['缅因猫','Codex'],['暹罗猫','Gemini'],['狸花猫','GLM'],['孟加拉猫','Antigravity'],['金渐层','opencode']];

/* ---------- 天空（中庭的天、"看风景"的天共用） ---------- */
const SKY4={day:['#5aa2dc','#78b8e8','#98cbf0','#bde0f6','#d8eefa'],dusk:['#3a2f6a','#6a3f78','#b8607a','#e8845e','#f7b26a','#fbd49a'],night:['#070920','#0d1030','#151a42','#1e2454','#2a3066'],
  grey:{day:['#8894a6','#a2adbd','#bcc5d2','#d2d8e0'],dusk:['#5e5268','#8a7482','#b8989c','#d4b8a8'],night:['#0c0e20','#13162c','#1b1f3a','#252946']}};
// 一段一段的色带，相邻两段之间一行抖动
function skyBands(x,y,w,h,tod,wx){const cols=wx==='sun'?SKY4[tod]:SKY4.grey[tod],n=cols.length,bh=h/n;
  for(let i=0;i<n;i++){const y0=Math.round(y+i*bh),y1=Math.round(y+(i+1)*bh);R(x,y0,w,y1-y0,cols[i]);if(i>0)for(let xx=x+(i%2);xx<x+w;xx+=2)P1(xx,y0,cols[i-1])}}
function skyStars(x,y,w,h,t,n=40,seed=0){for(let i=0;i<n;i++){if(Math.floor(t*1.3+i*.7)%7===0)continue;const sx=x+Math.floor(hsh(i,71+seed)*w),sy=y+Math.floor(hsh(i,72+seed)*h);
  P1(sx,sy,i%5?'#fff4dc':'#ffe890');if(i%9===0){P1(sx-1,sy,'#6a6a9a');P1(sx+1,sy,'#6a6a9a');P1(sx,sy-1,'#6a6a9a');P1(sx,sy+1,'#6a6a9a')}}}
function cloud4(x,y,s,col){disc(x,y,6*s,3*s,col);disc(x+5*s,y-2*s,5*s,3*s,col);disc(x-5*s,y+s,4*s,2*s,col);disc(x+10*s,y+s,4*s,2*s,col)}
// 颜色调暗（k<1）/ 调亮（k>1）
const tint=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return'#'+[(n>>16)&255,(n>>8)&255,n&255].map(v=>f(v).toString(16).padStart(2,'0')).join('')};

/* ---------- 树冠：一团团金色的叶子（整棵只画一次，存成一张图） ---------- */
const CAN_X=640,CAN_W=400,CAN_H=216;
const CANOPY_BLOBS=[[200,74,74,52],[118,96,58,40],[282,96,58,40],[56,128,44,32],[344,128,44,32],[156,42,54,34],[244,42,54,34],[200,22,50,26],[96,62,42,30],[304,62,42,30],
  [28,160,28,22],[372,160,28,22],[150,136,52,34],[250,136,52,34],[200,148,58,36],[86,166,40,24],[314,166,40,24],[200,178,42,22],[140,176,30,18],[260,176,30,18]].map(([x,y,rx,ry])=>({x,y,rx,ry}));
const CANOPY_CLUMPS=(()=>{const L=[];CANOPY_BLOBS.forEach((b,j)=>{const n=Math.round((b.rx+b.ry)/8);for(let k=0;k<n;k++){const a=(k+hsh(j,k))/n*Math.PI*2,r=5+Math.round(hsh(k,j+9)*4);
  const x=b.x+Math.cos(a)*b.rx*.92,y=b.y+Math.sin(a)*b.ry*.92;if(y>-8)L.push({x:Math.round(x),y:Math.round(y),rx:r,ry:Math.max(3,Math.round(r*.85))})}});return L})();
const inCanopy=(x,y)=>CANOPY_BLOBS.some(b=>((x-CAN_X-b.x)/b.rx)**2+((y-b.y)/b.ry)**2<=1);
const canopyBottom=x=>{let m=0;for(const b of CANOPY_BLOBS){const dx=(x-CAN_X-b.x)/b.rx;if(Math.abs(dx)<1)m=Math.max(m,b.y+b.ry*Math.sqrt(1-dx*dx))}return m};
function leafMass(shapes,big,{ol='#5a3a0e',sh='#b57d18',mn='#e3a92c',lt='#f7c940',hi='#ffe27a'}={}){
  shapes.forEach(s=>disc(s.x,s.y,s.rx+2,s.ry+2,ol));shapes.forEach(s=>disc(s.x,s.y+1,s.rx,s.ry,sh));
  shapes.forEach(s=>disc(s.x-1,s.y-2,Math.max(1,s.rx-3),Math.max(1,s.ry-3),mn));
  big.forEach(s=>{disc(Math.round(s.x-s.rx*.28),Math.round(s.y-s.ry*.34),Math.round(s.rx*.5),Math.round(s.ry*.42),lt);disc(Math.round(s.x-s.rx*.36),Math.round(s.y-s.ry*.48),Math.round(s.rx*.2),Math.round(s.ry*.16),hi)});
  shapes.forEach((s,i)=>{if(!big.includes(s)&&hsh(i,33)<.6)disc(s.x-2,s.y-2,Math.max(1,Math.round(s.rx*.45)),Math.max(1,Math.round(s.ry*.4)),lt)});
  // 叶子的纹理：一个个小叶片，上半边亮、下半边暗
  big.forEach((b,j)=>{const n=Math.round(b.rx*b.ry/9);for(let i=0;i<n;i++){const a=hsh(i,51+j)*Math.PI*2,r=Math.sqrt(hsh(i,52+j))*.86,x=Math.round(b.x+Math.cos(a)*b.rx*r),y=Math.round(b.y+Math.sin(a)*b.ry*r);
    if(hsh(i,53+j)<.45)continue;const up=y<b.y-b.ry*.15,c=up?(hsh(i,54)<.5?hi:lt):(hsh(i,55)<.6?sh:'#9a6414');if(i%2)R(x,y,2,1,c);else R(x,y,1,2,c)}});
  for(let i=0;i<70;i++){const b=big[i%big.length];P1(Math.round(b.x+(hsh(i,57)-.5)*b.rx*1.4),Math.round(b.y-b.ry*.2+(hsh(i,58)-.6)*b.ry),'#fff4c0')}}
function bakeCanopy(){const cv=document.createElement('canvas');cv.width=CAN_W;cv.height=CAN_H;const o=C;use(cv.getContext('2d'));
  leafMass([...CANOPY_BLOBS,...CANOPY_CLUMPS],CANOPY_BLOBS);
  // 树冠底下正中凹进去一块暗的：大枝从这里伸进去，看得出深浅；下沿几团叶子再盖回来
  disc(200,142,86,34,'#b57d18');disc(200,148,66,26,'#9a6414');disc(200,152,46,18,'#7a4c10');for(let i=0;i<160;i++){const a=hsh(i,59)*Math.PI*2,r=Math.sqrt(hsh(i,60))*.95;R(Math.round(200+Math.cos(a)*84*r),Math.round(142+Math.sin(a)*32*r),2,1,r>.7?'#c98a1e':'#8a5a14')}
  const fr=[[140,176,30,18],[200,180,40,20],[260,176,30,18],[96,168,34,20],[304,168,34,20],[170,168,18,12],[232,168,18,12]].map(([x,y,rx,ry])=>({x,y,rx,ry}));leafMass(fr,fr);use(o);return cv}

/* ---------- 树干、横枝、树根、瞭望台（也只画一次） ---------- */
const TR_X=736,TR_Y=40,TR_W=208,TR_H=394;
function limb(x0,y0,x1,y1,w0,w1,col='#8a5a3a'){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)),P=[];for(let i=0;i<=n;i+=2){const u=i/n;P.push([Math.round(x0+(x1-x0)*u),Math.round(y0+(y1-y0)*u),Math.max(1,Math.round((w0+(w1-w0)*u)/2))])}
  P.forEach(([x,y,r])=>disc(x,y,r+1,r+1,OL));P.forEach(([x,y,r])=>disc(x,y,r,r,col));P.forEach(([x,y,r])=>{if(r>2)disc(x-Math.round(r*.4),y,Math.max(1,Math.round(r*.3)),Math.max(1,Math.round(r*.6)),'#a8703f')})}
// 小圆牌上的猫脸（这个家族的毛色）
function famFace(x,y,fam){const b=BREEDS[fam];grid(x,y,[".o...o.","oxo.oxo","obbbbbo","obebebo","obbnbbo",".ooooo."],{o:b.outline,b:b.body,x:b.points||b.stripe||b.spot||b.body,e:'#241a2e',n:'#f4a6b8'})}
function yarnStitch(xx,y,cx,y0,Y,u){const ly=(y-y0)%13;let col=u<.18?Y[2]:u<.72?Y[0]:Y[1];if(ly===0||ly===12)return Y[1];const sx=((xx-cx+100)%4+4)%4,sy=ly%3;
  if(sy===1&&(sx===0||sx===3))col=u<.18?Y[0]:Y[1];else if(sy===2&&(sx===1||sx===2))col=u<.18?Y[0]:Y[1];return col}
function bakeTrunk(){const cv=document.createElement('canvas');cv.width=TR_W;cv.height=TR_H;const x=cv.getContext('2d'),o=C;use(x);x.translate(-TR_X,-TR_Y);const B=TREE.base,cx0=TREE.cx;
  // 伸进树冠的三根大枝（中间那根托着瞭望台）
  limb(treeCX(170)-8,170,778,76,16,6);limb(treeCX(170)+8,170,908,72,16,6);limb(treeCX(160),160,cx0+1,104,18,10);limb(800,122,762,112,6,3);limb(880,118,920,104,6,3);
  // 树干：一行一行画。236～396 是五色毛线套（一圈一个颜色，上下两道米色罗纹边），其余是树皮
  for(let y=150;y<=B+2;y++){const cx=treeCX(y),hw=treeHW(y)+(y>B-16?Math.round((y-(B-16))*1.1):0);R(cx-hw-1,y,2*hw+3,1,OL);
    for(let xx=cx-hw;xx<=cx+hw;xx++){const u=(xx-(cx-hw))/(2*hw);let col;
      if(y>=236&&y<=396){if(y<240||y>392)col=((xx-cx)%2===0)?'#fff4dc':'#d8c8a8';else{const band=Math.floor((y-240)/13);col=yarnStitch(xx,y,cx,240,YARN[(band+1)%5],u)}}
      else{col=u<.16?'#b07a48':u<.55?'#8a5a3a':u<.84?'#6e4430':'#4e3022';if(hsh(xx-cx+60,Math.floor(y/6))<.14&&u>.1&&u<.9)col='#5c3a26'}
      P1(xx,y,col)}}
  // 树根：往树池里伸
  [[-1,B-4,-50,B+12,14],[1,B-4,48,B+10,14],[-1,B+2,-24,B+16,10],[1,B+2,26,B+17,10]].forEach(([s,y0,dx,y1,w])=>limb(cx0+s*20,y0,cx0+dx,y1,w,4));
  // 六根横枝：枝面平一点、枝梢微微上翘；靠树干那一段裹着这个家族颜色的毛线套，枝上挂一块圆牌
  TREE.br.forEach(b=>{const x0=brX0(b),dk=tint(b.col,.72),lt=tint(b.col,1.25);
    for(let i=0;i<=b.len;i++){const u=i/b.len,xx=x0+b.s*i,top=b.y-Math.round(3*u*u),th=Math.max(4,9-Math.round(4*u));R(xx,top-1,1,th+2,OL);
      if(i>=4&&i<=15){R(xx,top,1,th,(i%3===0)?dk:b.col);P1(xx,top,lt)}else{R(xx,top,1,th,'#8a5a3a');P1(xx,top,'#b07a48');P1(xx,top+th-1,'#5c3a26')}}
    R(x0+b.s*(b.len+1),b.y-4,1,7,OL);
    const tx=x0+b.s*Math.round(b.len*.8),ty=b.y+4;line(tx,ty,tx,ty+6,'#d9d2c4');disc(tx,ty+13,7,7,OL);disc(tx,ty+13,6,6,b.col);disc(tx-2,ty+11,2,2,lt);famFace(tx-3,ty+10,b.fam)});
  // 瞭望台：两块木板、两根柱子、一道绳栏
  const T0=TREE.top;R(T0.x-28,T0.y,57,5,OL);R(T0.x-27,T0.y+1,55,1,'#e0a878');R(T0.x-27,T0.y+2,55,2,'#b87a4a');for(let i=T0.x-24;i<T0.x+28;i+=9)P1(i,T0.y+2,'#8a5a3a');
  line(T0.x-20,T0.y+5,T0.x-4,T0.y+18,OL);line(T0.x+20,T0.y+5,T0.x+4,T0.y+18,OL);
  [T0.x-28,T0.x+26].forEach(px=>{R(px,T0.y-11,3,11,OL);R(px+1,T0.y-10,1,10,'#b87a4a')});for(let i=0;i<52;i++)P1(T0.x-26+i,T0.y-9+Math.round(Math.sin(i/52*Math.PI)*3),'#d9d2c4');
  // 树冠底下几团靠前的叶子：盖住大枝的枝梢
  const FR=[[776,90,13,9],[912,88,13,9],[758,114,9,6],[924,112,9,6]].map(([x,y,rx,ry])=>({x,y,rx,ry}));leafMass(FR,FR,{ol:'#c98a1e'});
  use(o);return cv}
const CANOPY_IMG=bakeCanopy(),TRUNK_IMG=bakeTrunk();

// 挂成品的位置：24 件挂在树冠下沿，12 件挂在叶子中间
const TREE_ORN=Array.from({length:TREE.N},(_,i)=>{if(i<24){const x=Math.round(664+352*(i+.5)/24+(hsh(i,62)-.5)*8),y=Math.round(canopyBottom(x)-5-hsh(i,63)*8);return{x,y,len:3+Math.round(hsh(i,65)*6)}}
  for(let k=0;k<40;k++){const x=Math.round(690+hsh(i,66+k)*300),y=Math.round(40+hsh(i,67+k)*120);if(inCanopy(x,y)&&inCanopy(x,y+16)&&Math.abs(x-TREE.cx)>18)return{x,y,len:3+Math.round(hsh(i,68)*4)}}return{x:760+i*4,y:150,len:4}})
  .map((p,i)=>({p,k:hsh(i,77)})).sort((a,b)=>a.k-b.k).map(o=>o.p);   // 打乱顺序：先挂上去的几件就散在整个树冠上

/* ---------- 地图：巨树中庭在正中间（640～1040），左右是店里的房间（布局见 world-map.js 开头） ---------- */
// 石板广场：一个大椭圆，一块块石板（逐行画，边缘是干净的像素）
function plaza(cx,cy,rx,ry){disc(cx,cy,rx+2,ry+2,'#8a8278');disc(cx,cy,rx+1,ry+1,'#a49c90');
  for(let dy=-ry;dy<=ry;dy++){const s=Math.floor(rx*Math.sqrt(Math.max(0,1-dy*dy/((ry+.5)*(ry+.5))))),y=cy+dy,x0=cx-s,x1=cx+s,j=Math.floor((dy+ry)/14),ly=(dy+ry)%14,off=(j%2)*7;
    R(x0,y,x1-x0+1,1,ly===0?'#b4aa9a':'#cfc6b8');if(ly===0)continue;
    for(let i=Math.floor((x0-cx-off)/14)-1;;i++){const sx=cx+off+i*14;if(sx>x1)break;if(sx>=x0)P1(sx,y,'#b4aa9a');
      const hl=hsh(i+40,j)<.3&&ly>=2&&ly<=10?'#d8d0c4':hsh(j,i+40)<.2&&ly>=4&&ly<=9?'#c2b8a8':null;if(!hl)continue;const a0=Math.max(x0,sx+2+(hl==='#c2b8a8'?1:0)),a1=Math.min(x1,sx+(hl==='#c2b8a8'?8:10));if(a1>=a0)R(a0,y,a1-a0+1,1,hl)}}}
// 竖着的外墙开一道门：上一段墙的端头（砖面）+ 石门槛
function sideDoor(x,y,h){R(x,y,8,8,'#b4654f');R(x,y+1,8,1,'#c8806a');R(x,y+6,8,2,'#4a2e22');R(x,y+8,8,h-8,'#b4aa9a');for(let j=y+10;j<y+h;j+=6)R(x+1,j,6,1,'#cfc6b8')}
(()=>{const M=WORLD,P=WP;
M.rooms.push({id:'atrium',n:'巨树中庭',x:640,y:0,w:400,h:540,d:'店的正中间，露天。一棵毛线巨树：六根横枝是猫猫咖啡馆的六个家族，爬到树顶能看整条街；全店每挂出一件成品，树上就多挂一件。四面的门通橱窗长廊、大客厅、工坊，右下角和后院连成一片草地'});
Object.assign(P,{plaque:{x:774,y:414},atLamps:[{x:678,y:268},{x:996,y:268},{x:700,y:470},{x:974,y:470}]});
M.WALK.push([646,178,388,342],[626,198,24,40],[1030,198,24,40],[1030,300,24,220]);   // 中庭；通橱窗长廊、通工坊的门；和后院连着的那一段
M.BLOCK.push([780,384,120,36],[768,392,12,20],[900,392,12,20],[774,426,36,6],...P.atLamps.map(l=>[l.x-1,l.y+30,8,6]));
M.lights.push({x:TREE.cx,y:118,r:110,col:'#ffcf60',when:'night',a:.55},{x:730,y:140,r:64,col:'#ffcf60',when:'night',a:.45},{x:950,y:140,r:64,col:'#ffcf60',when:'night',a:.45},
  {x:TREE.cx,y:118,r:110,col:'#ffb050',when:'dusk',a:.5},...P.atLamps.map(l=>({x:l.x+3,y:l.y+4,r:28,col:'#ffe08a',when:'night'})));
const bg0=M.bg,wall0=M.wall,floor0=M.floor,over0=M.over;
M.bg=function(){bg0.call(this);
  // 地面：中庭的草地，右下角一直连进后院（盖住 v3 隔墙切开后留下的那一窄条）
  floorGrass(640,174,396,366);floorGrass(1036,300,12,240);
  skyBands(644,0,392,124,'day','sun');brickWall(644,124,392,50);ivy(660,126,26);ivy(740,126,18);ivy(950,126,30);ivy(1010,126,20);
  flowerBed(652,164,54);flowerBed(976,164,54);
  // 左边：橱窗长廊、大客厅的外墙，各开一道门
  pillar(635,0,56);wallTop(636,56,8,134);sideDoor(636,190,50);wallTop(636,240,8,152);sideDoor(636,392,44);wallTop(636,436,8,104);
  // 右边：工坊的外墙（开一道门），下面接后院砖墙的端头；再往下不砌墙
  pillar(1035,0,56);wallTop(1036,56,8,134);sideDoor(1036,190,50);wallTop(1036,240,8,16);brickWall(1036,256,12,44);R(1036,256,1,44,'#4a2e22');R(1036,298,12,2,'#5a2e24');
  // 树下的石板广场
  plaza(TREE.cx,428,168,82);
  // 树冠投下的斑驳影子
  [[184,78],[164,68],[140,56],[112,44]].forEach(([rx,ry])=>alpha(.05,()=>disc(TREE.cx,394,rx,ry,'#241a2e')));alpha(.12,()=>{for(let i=0;i<90;i++){const a=hsh(i,81)*Math.PI*2,r=Math.sqrt(hsh(i,82)),x=Math.round(TREE.cx+Math.cos(a)*170*r),y=Math.round(392+Math.sin(a)*68*r);disc(x,y,2+Math.round(hsh(i,83)*3),1+Math.round(hsh(i,84)*2),'#fff8d0')}});
  // 树池：一圈石头，里面是土、青苔和落叶
  disc(TREE.cx,402,74,19,'#8a8278');disc(TREE.cx,402,72,17,'#cfc6b8');disc(TREE.cx,403,66,14,'#6a4a30');for(let i=0;i<60;i++){const a=i/60*Math.PI*2;disc(Math.round(TREE.cx+Math.cos(a)*70),Math.round(402+Math.sin(a)*17),3,2,i%2?'#b4aa9a':'#d8d0c4')}
  for(let i=0;i<50;i++){const a=hsh(i,85)*Math.PI*2,r=Math.sqrt(hsh(i,86))*.9;const x=Math.round(TREE.cx+Math.cos(a)*62*r),y=Math.round(403+Math.sin(a)*12*r);if(hsh(i,87)<.5)R(x,y,2,1,'#5e8a4a');else leafG(x,y,i)}
  // 地上的金色落叶，后院那边也飘过去一些
  for(let i=0;i<170;i++){const x=650+Math.floor(hsh(i,88)*470),y=180+Math.floor(hsh(i,89)*350);if(x>1040&&y<306)continue;if(Math.hypot((x-TREE.cx)/1.6,y-400)<160||hsh(i,90)<.3)leafG(x,y,i)}
  // 四条小路：三道门、后院，都通到树下
  stones([[652,222],[664,234],[674,248],[682,264],[688,282],[692,300],[694,318],[694,336],[1028,222],[1016,234],[1006,248],[998,264],[992,282],[988,300],[986,318],[986,336],
    [652,418],[662,422],[1018,430],[1032,433],[1046,436],[1060,440]]);
  R(640,538,400,2,'#4a2e22');
  C.drawImage(CANOPY_IMG,CAN_X,0)};   // 树冠也画进底图：小地图上看得见这一大团金色
M.wall=function(t,S,vis){wall0.call(this,t,S,vis);if(!vis(640,0,400,CAN_H))return;const tod=S.tod||'day',wx=S.weather||'sun';
  skyBands(644,0,392,124,tod,wx);if(tod==='night'&&wx==='sun'){skyStars(644,0,392,110,t,36,3);disc(1012,22,5,5,'#fff4dc');disc(1014,21,4,4,'#fff4dc');P1(1010,20,'#e8e0c8')}
  else if(wx==='sun'){const cc=tod==='dusk'?'#fbd8c0':'#ffffff';cloud4(650+((t*3)%120),34,1,cc);cloud4(956+((t*2.4)%60),58,1,cc)}
  for(let i=0;i<23;i++){const bx=644+i*17,bh=6+Math.floor(hsh(i,91)*16);R(bx,124-bh,15,bh,tod==='night'?'#1a1d36':tod==='dusk'?'#7a5a7a':'#8aa0c0');if(tod!=='day')for(let k=0;k<3;k++)if(hsh(i,k+92)<.5)P1(bx+3+k*4,124-bh+3,'#ffe08a')}
  C.drawImage(CANOPY_IMG,CAN_X,0)};
M.over=function(t,S,vis){over0.call(this,t,S,vis);const wx=S.weather||'sun';if(wx==='sun'||!vis(640,0,400,540))return;const night=S.tod==='night';
  if(wx==='rain'){const col=night?'#6a7ab0':'#dfe8f4';for(let i=0;i<200;i++){const x=644+(i*37+Math.floor(t*30))%392,y=(i*53+Math.floor(t*150))%540;if(y>190||!inCanopy(x,y))R(x,y,1,3,col)}}
  else for(let i=0;i<170;i++){const x=644+((i*29+Math.floor(t*6+Math.sin(t*1.3+i)*3))%392+392)%392,y=(i*41+Math.floor(t*16))%540;if(y>190||!inCanopy(x,y))P1(x,y,'#ffffff')}};
// 和猫一起排序：树干（连同横枝、瞭望台、挂着的成品）、铭牌、灯柱
const add=(x,y,w,h,base,draw,o={})=>M.props.push({x,y,w,h,base,draw,...o});
add(656,40,368,TR_H,TREE.base,(t,S)=>{C.drawImage(TRUNK_IMG,TR_X,TR_Y);treeOrnaments(S.tree)},{ver:S=>S.tree?S.tree.v:0});
add(P.plaque.x,P.plaque.y,36,18,P.plaque.y+17,()=>treePlaque(P.plaque.x,P.plaque.y));
add(640,520,404,20,540,()=>fenceH(644,522,400));   // 中庭下沿的篱笆，接着后院的
P.atLamps.forEach(l=>add(l.x-1,l.y-1,8,38,l.y+36,(t,S)=>lampPost(l.x,l.y,S.tod!=='day'),{ver:S=>S.tod}));
})();
function leafG(x,y,i){const c=['#e8b83a','#f7c940','#c98a1e','#e3a92c'][i%4];if(i%2){R(x,y,2,1,c);P1(x+1,y+1,c)}else{R(x,y,1,2,c);P1(x+1,y,c)}}
function treePlaque(x,y){R(x+4,y+10,3,8,OL);R(x+29,y+10,3,8,OL);box(x,y,36,12,'#8a5a3a');R(x+2,y+2,32,8,'#5c3a26');txt('CLOWDER',x+5,y+4,'#ffd84a')}
// 树上挂着的成品：一根线、一颗小灯珠、下面挂着织好的东西
function treeOrnaments(T0){if(!T0)return;T0.orn.forEach((it,i)=>{const p=TREE_ORN[i];if(!p)return;line(p.x,p.y,p.x,p.y+p.len,'#d9d2c4');R(p.x-1,p.y-1,3,2,OL);P1(p.x,p.y-1,'#fff4c0');knit(it.kind,p.x,p.y+p.len,it.ci)})}

WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,say,sfx,news,after,emote,speak,T,roomAt,dist}=A;
const now=()=>A.t,tick=f=>A.tickers.push(f),near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,inAtrium=c=>c.x>=640&&c.x<1040;

/* ---------- 全店一起挂：橱窗里每挂一件，树上多挂一件；挂满了满树金光 ---------- */
const kinds=Object.keys(KNIT);S.tree={orn:Array.from({length:12},()=>({kind:rnd(kinds),ci:Math.floor(Math.random()*5),t0:-99})),blooms:0,bloom:0,v:1};
function treeAdd(item){const T0=S.tree;if(T0.bloom||T0.orn.length>=TREE.N)return;T0.orn.push({kind:item.kind,ci:item.ci,t0:now()});T0.v++;if(T0.orn.length>=TREE.N)bloom()}
function bloom(){const T0=S.tree;if(T0.bloom)return;T0.bloom=now();T0.blooms++;news(`毛线巨树挂满了 ${TREE.N} 件！满树金光`);if(A.play&&inAtrium(me)){sfx('fanfare');say('毛线巨树挂满了！满树金光')}
    S.cats.forEach(c=>{if(inAtrium(c)&&!c.me&&!c.hidden&&Math.random()<.6)emote(c,'bang',2)});
    after(14,()=>{T0.orn=[];T0.bloom=0;T0.v++;if(A.play&&inAtrium(me))say('树上的成品收下来了，又可以从头挂')})}
// 联机时（A.shared）树跟着服务端走：谁挂了一件，world-online.js 调 A.tree.add；连上时用 A.tree.set 换成服务端那一份
const h0=A.onHang;A.onHang=(c,item)=>{if(h0)h0(c,item);if(!A.shared)treeAdd(item)};
A.tree={add:treeAdd,bloom,set:list=>{const T0=S.tree;if(T0.bloom)return;T0.orn=list.slice(0,TREE.N-1).map(o=>({kind:o.kind,ci:o.ci,t0:-99}));T0.v++},get n(){return S.tree.orn.length},N:TREE.N};

/* ---------- 爬树：一根根横枝跳上去；你先上树顶，别的猫随便挑一根 ---------- */
const FLOOR=TREE.floor,up=i=>i<6?TREE_PERCH.slice(0,i+1):[...TREE_PERCH.slice(0,6),TREE_PERCH[i]];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
A.seatThing({id:'yarntree',n:'毛线巨树',hit:[812,160,56,236],at:FLOOR,near:[812,420,62,22],label:c=>c.me?'爬上毛线巨树（树顶能看整条街）':'爬上毛线巨树',spots:TREE_PERCH,
  prefer:c=>c.me?[6,7,5,4,3,2,1,0]:[...shuffle([0,1,2,3,4,5]),6,7],up,down:i=>[...up(i).slice(0,-1).reverse(),{...FLOOR}],floor:()=>({...FLOOR}),
  k:c=>c.me?'sit':rnd(['sit','lie','sit','sleep']),ex:'content',doing:'在毛线巨树上',dur:()=>rr(10,22),ai:{mood:'rest',w:2.4}});
T({id:'treeplaque',n:'巨树的铭牌',hit:[P.plaque.x,P.plaque.y,36,18],at:{x:P.plaque.x+18,y:440},near:[P.plaque.x-4,432,44,16],label:'看看铭牌',ai:{mood:'explore',w:.2},
  go(c){run(c,[{go:{x:P.plaque.x+18,y:440}},{fn:c=>{c.face='R'}},{k:'sit',dur:.6,ex:'lookUp'},{fn:c=>{if(c.me)openPlaque()}}])}});
function openPlaque(){const T0=S.tree;A.dlg.show({id:'tree-'+Math.floor(now()*10),kind:'info',head:{icon:'tree',title:'毛线巨树'},blocks:[
  {k:'text',t:'铭牌上刻着 CLOWDER：一群猫。树干上的毛线套一圈一个颜色，是店里的猫一针一针织上去的。六根横枝，是猫猫咖啡馆的六个家族：'},
  {k:'words',items:TREE.br.map(b=>{const k=CAT_CARDS[b.fam];return[FAM_NAMES[b.fam][0]+' · '+FAM_NAMES[b.fam][1],k.name+'：'+k.good]})},
  {k:'text',t:'全店每挂出一件成品，树上就多挂一件；挂满 '+TREE.N+' 件，满树金光。'},
  {k:'progress',p:T0.orn.length/TREE.N,t:`树上挂了 ${T0.orn.length} / ${TREE.N} 件`+(T0.blooms?` · 已经满树金光过 ${T0.blooms} 次`:'')}],
  tip:{...TIPS.family,key:'family'},acts:[{id:'ok',t:'知道了',key:'E'}]})}

/* ---------- 会动的：金色光点往上飘、落叶往下飘、新挂上的一闪、树顶的灯、满树金光 ---------- */
const TOPLAMP={x:TREE.top.x+27,y:TREE.top.y-12};
A.overs.push(vis=>{if(!vis(640,0,400,540))return;const t=now(),T0=S.tree,bl=T0.bloom?Math.min(1,(t-T0.bloom)/1.5)*Math.min(1,(T0.bloom+14-t)/2):0;
  for(let i=0;i<34;i++){const sp=4+hsh(i,93)*6,y=Math.round(520-((t*sp+hsh(i,94)*520)%520)),x=Math.round(656+hsh(i,95)*370+Math.sin(t*.7+i)*6);if(!vis(x-1,y-1,3,3))continue;
    const on=(Math.floor(t*2+i)%4)!==0;if(on)P1(x,y,bl>0?'#fff8d0':'#ffe890');if(bl>0||i%5===0){P1(x-1,y,'#e8b83a');P1(x+1,y,'#e8b83a')}}
  for(let i=0;i<14;i++){const per=7+hsh(i,96)*6,k=((t+hsh(i,97)*per)%per)/per,gy=300+hsh(i,98)*220,y0=120+hsh(i,99)*70,y=Math.round(y0+(gy-y0)*Math.min(1,k*1.25)),x=Math.round(660+hsh(i,100)*360+(k<.8?Math.sin(t*1.6+i)*8:0));
    if(vis(x-2,y-2,4,4))leafG(x,y,i+Math.floor(t*3))}
  T0.orn.forEach((it,i)=>{const k=t-it.t0;if(k<0||k>2.2)return;const p=TREE_ORN[i];for(let j=0;j<6;j++){const a=t*4+j*Math.PI/3,r=4+k*8;P1(Math.round(p.x+Math.cos(a)*r),Math.round(p.y+p.len+4+Math.sin(a)*r*.7),'#fff4c0')}});
  // 白天、黄昏：树冠边上一圈淡淡的金光；晴天还有几道光柱从叶子缝里斜着照下来
  if(S.tod!=='night'){C.save();C.globalCompositeOperation='lighter';C.globalAlpha=.1+.03*Math.sin(t*.8);[[690,110,70],[990,110,70],[840,24,90],[760,176,56],[920,176,56]].forEach(([x,y,r])=>C.drawImage(glowTex(r,'#ffe08a'),x-r,y-r));
    if((S.weather||'sun')==='sun'){C.globalAlpha=.06;C.fillStyle='#fff4c0';[[712,186,20],[796,194,12],[946,184,16]].forEach(([x,y,wd],i)=>{const sw=Math.sin(t*.3+i)*6;C.beginPath();C.moveTo(x,y);C.lineTo(x+wd,y);C.lineTo(x+wd+70+sw,y+320);C.lineTo(x+70+sw,y+320);C.closePath();C.fill()})}C.restore()}   // 光柱只在晴天有
  // 树顶瞭望台的小灯笼：满树金光过几次，就亮一点
  const L=TOPLAMP,g=Math.min(1,.35+T0.blooms*.2);R(L.x,L.y,1,4,OL);R(L.x-3,L.y+4,7,8,OL);R(L.x-2,L.y+5,5,6,g>.6?'#fff4c0':'#ffd84a');R(L.x-2,L.y+10,5,1,'#e8b83a');
  if(S.tod==='day'||bl>0){C.save();C.globalCompositeOperation='lighter';C.globalAlpha=.25*g+.5*bl;C.drawImage(glowTex(12,'#ffd84a'),L.x-12,L.y-4);C.restore()}
  if(bl>0){C.save();C.globalCompositeOperation='lighter';C.globalAlpha=.35*bl*(.75+.25*Math.sin(t*5));[[TREE.cx,90,96],[730,120,64],[950,120,64],[TREE.cx,200,70]].forEach(([x,y,r])=>C.drawImage(glowTex(r,'#ffd070'),x-r,y-r));C.restore();
    for(let i=0;i<40;i++){const x=Math.round(660+hsh(i,101)*360),y=Math.round((hsh(i,102)*420+t*40*(0.6+hsh(i,103)))%440+40);if((Math.floor(t*6)+i)%3)P1(x,y,'#fff4c0');if(i%3===0){P1(x-1,y,'#ffd84a');P1(x+1,y,'#ffd84a')}}}});
tick(()=>{if(S.tod==='day')return;const T0=S.tree;T0.orn.forEach((it,i)=>{const p=TREE_ORN[i];A.lights.push({x:p.x,y:p.y,r:9,col:'#ffe8a0',a:.9})});A.lights.push({x:TOPLAMP.x,y:TOPLAMP.y+8,r:14+T0.blooms*4,col:'#ffe08a'})});

/* ---------- 第一次走进中庭：镜头顺着树干往上摇，停在树冠，再回来（你一走开就结束） ---------- */
let cine=null;const ease=u=>u<.5?2*u*u:1-2*(1-u)*(1-u);
A.reveal=()=>{cine={t0:now(),x0:me.x,y0:me.y}};
A.camHook=(vw,vh)=>{if(!cine)return null;const k=now()-cine.t0;if(k>7||Math.hypot(me.x-cine.x0,me.y-cine.y0)>70){cine=null;return null}
  const u=k<.6?0:k<3.6?ease((k-.6)/3):k<5.6?1:1-ease((k-5.6)/1.4),bx=me.x,by=me.y-12,tx=TREE.cx,ty=vh/2;return{x:bx+(tx-bx)*u,y:by+(ty-by)*u,k:10}};
A.inCine=()=>!!cine;
Object.assign(A.LIKES[3],{yarntree:2});Object.assign(A.LIKES[5],{yarntree:2.5});Object.assign(A.LIKES[4],{yarntree:1});
});
