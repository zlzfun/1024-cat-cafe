/* 1024 猫咖 · 毛线巨树：从一楼咖啡厅的地面长出来，穿过二楼的天井，树冠在屋顶上（设计见 docs/店内设计.md 第二节）。
   地图部分在 map-roof.js 后面加载（makeWorld 之前）；WORLD_MODS 里接在 world4-desk.js 后面。
   - 一楼：粗大的树根、裹着五色毛线套的树干、一圈环形长凳；树干往上分出两根低枝，贴着天花板铺到咖啡桌上空。树下立着猫猫咖啡馆的大招牌（新来的猫落地第一眼看到它）。
   - 二楼：树干从天井里长上来，六根横枝伸在回廊上空，枝头各挂一盏小灯笼，猫能跳上去窝着；抱着树干能滑回一楼。
     （横枝原来一根对应一个家族、挂猫脸圆牌，去掉了：家族和模型以后还会加，内网能用的模型也不一样。）
   - 屋顶：金色的树冠，顶上是瞭望台，坐上去画面切到"看风景"；顺着树干也能滑回一楼。
   - 全店一起挂：橱窗里每挂一件成品，树上多挂一件，一楼的低枝、二楼的横枝、屋顶的树冠轮着挂；挂满 36 件，三层一起满树金光十几秒，然后收下来重新挂。
   - 爬树也是上下楼的一条路：你在一楼爬上去，一路穿过二楼爬到树顶；别的猫爬到二楼找根横枝窝着。 */
const TREE={cx:480,N:36,
  f1:{base:440,top:262},                                        // 一楼：树根落地、树干进天花板
  f2:{well:[400,Y2+380,160,100],base:Y2+470,top:Y2+56},         // 二楼：天井、树干从天井底长到天花板
  rf:{base:Y3+420,canX:280,canY:Y3+70,top:{x:480,y:Y3+170}},    // 屋顶：树干从屋顶的洞里出来，树冠、瞭望台
  // 二楼的六根横枝：s 朝哪边，y 枝面（猫脚底），len 长度，col 毛线套的颜色
  br:[{s:-1,y:Y2+344,len:78,col:'#d97757'},{s:1,y:Y2+306,len:78,col:'#5B8C5A'},{s:-1,y:Y2+268,len:74,col:'#5B9BD5'},
      {s:1,y:Y2+230,len:74,col:'#e0533d'},{s:-1,y:Y2+192,len:70,col:'#e8b83a'},{s:1,y:Y2+154,len:70,col:'#9B7EBD'}]};
const cx1=y=>TREE.cx+Math.round(4*Math.sin((TREE.f1.base-y)/60)),hw1=y=>Math.round(26+8*Math.max(0,Math.min(1,(y-262)/160)));
const cx2=y=>TREE.cx+Math.round(5*Math.sin((TREE.f2.base-y)/70)),hw2=y=>Math.round(24+6*Math.max(0,Math.min(1,(y-Y2-60)/400)));
const brX0=b=>cx2(b.y)+b.s*(hw2(b.y)-3);
// 二楼横枝上能窝的位置（枝梢往里一点），z 比树干的 base 大一点：画在树干前面
const BRANCH_PERCH=TREE.br.map(b=>({x:brX0(b)+b.s*(b.len-16),y:b.y-1,z:TREE.f2.base+.5,face:b.s>0?'R':'L'}));
// 屋顶瞭望台上两个位置
const TOP_PERCH=[{x:TREE.rf.top.x-11,y:TREE.rf.top.y,z:TREE.rf.base+.5,face:'R'},{x:TREE.rf.top.x+11,y:TREE.rf.top.y,z:TREE.rf.base+.5,face:'L'}];
// 一楼环形长凳上六个位置
const BENCH_SPOTS=[[-52,4,'L'],[-28,12,'L'],[28,12,'R'],[52,4,'R'],[-40,-8,'L'],[40,-8,'R']].map(([dx,dy,f])=>({x:TREE.cx+dx,y:TREE.f1.base+dy,z:TREE.f1.base+dy+.6,face:f}));

/* ---------- 颜色、叶子（"看风景"也用） ---------- */
const tint=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return'#'+[(n>>16)&255,(n>>8)&255,n&255].map(v=>f(v).toString(16).padStart(2,'0')).join('')};
function leafMass(shapes,big,{ol='#5a3a0e',sh='#b57d18',mn='#e3a92c',lt='#f7c940',hi='#ffe27a'}={}){
  shapes.forEach(s=>disc(s.x,s.y,s.rx+2,s.ry+2,ol));shapes.forEach(s=>disc(s.x,s.y+1,s.rx,s.ry,sh));
  shapes.forEach(s=>disc(s.x-1,s.y-2,Math.max(1,s.rx-3),Math.max(1,s.ry-3),mn));
  big.forEach(s=>{disc(Math.round(s.x-s.rx*.28),Math.round(s.y-s.ry*.34),Math.round(s.rx*.5),Math.round(s.ry*.42),lt);disc(Math.round(s.x-s.rx*.36),Math.round(s.y-s.ry*.48),Math.round(s.rx*.2),Math.round(s.ry*.16),hi)});
  shapes.forEach((s,i)=>{if(!big.includes(s)&&hsh(i,33)<.6)disc(s.x-2,s.y-2,Math.max(1,Math.round(s.rx*.45)),Math.max(1,Math.round(s.ry*.4)),lt)});
  big.forEach((b,j)=>{const n=Math.round(b.rx*b.ry/9);for(let i=0;i<n;i++){const a=hsh(i,51+j)*Math.PI*2,r=Math.sqrt(hsh(i,52+j))*.86,x=Math.round(b.x+Math.cos(a)*b.rx*r),y=Math.round(b.y+Math.sin(a)*b.ry*r);
    if(hsh(i,53+j)<.45)continue;const up=y<b.y-b.ry*.15,c=up?(hsh(i,54)<.5?hi:lt):(hsh(i,55)<.6?sh:'#9a6414');if(i%2)R(x,y,2,1,c);else R(x,y,1,2,c)}});
  for(let i=0;i<Math.min(70,big.length*6);i++){const b=big[i%big.length];P1(Math.round(b.x+(hsh(i,57)-.5)*b.rx*1.4),Math.round(b.y-b.ry*.2+(hsh(i,58)-.6)*b.ry),'#fff4c0')}}
// 一小团叶子：逐像素画，边缘毛糙；左上亮、右下暗，只在背光的那一侧描深色边
function leafTuft(cx,cy,rx,ry,seed=0){const pts=[],set=new Set();
  for(let y=-ry-2;y<=ry+2;y++)for(let x=-rx-2;x<=rx+2;x++){const n=hsh(x+seed*31+200,y+seed*17+200),d=(x*x)/(rx*rx)+(y*y)/(ry*ry)+(n-.5)*.55;if(d>1)continue;pts.push([x,y,n]);set.add(x+','+y)}
  const has=(x,y)=>set.has(x+','+y);
  pts.forEach(([x,y,n])=>{const shade=!has(x+1,y)||!has(x,y+1),edge=shade||!has(x-1,y)||!has(x,y-1),lit=(-x/rx-y/ry)*.5+.5;
    const col=shade?'#7a4c10':edge?'#c98a1e':lit>.72?(n<.45?'#ffe27a':'#f7c940'):lit>.42?(n<.25?'#f7c940':'#e3a92c'):(n<.35?'#c98a1e':'#b57d18');P1(cx+x,cy+y,col)});
  for(let i=0;i<Math.round((rx+ry)/2);i++){const a=hsh(i,seed+501)*Math.PI*2,r=1.1+hsh(i,seed+502)*.25;P1(Math.round(cx+Math.cos(a)*rx*r),Math.round(cy+Math.sin(a)*ry*r),hsh(i,seed+503)<.5?'#e3a92c':'#b57d18')}}
// 一簇叶子：几小团叠在一起
function leafCluster(cx,cy,rx,ry,seed=0){const n=3+Math.round((rx+ry)/10);for(let i=0;i<n;i++){const a=hsh(i,seed+401)*Math.PI*2,r=Math.sqrt(hsh(i,seed+402))*.55,sx=Math.max(3,Math.round(rx*(.45+hsh(i,seed+403)*.3))),sy=Math.max(2,Math.round(ry*(.5+hsh(i,seed+404)*.3)));
  leafTuft(Math.round(cx+Math.cos(a)*rx*r),Math.round(cy+Math.sin(a)*ry*r),sx,sy,seed*7+i)}leafTuft(cx,cy-1,Math.max(3,Math.round(rx*.55)),Math.max(2,Math.round(ry*.6)),seed+99)}
function leafG(x,y,i){const c=['#e8b83a','#f7c940','#c98a1e','#e3a92c'][i%4];if(i%2){R(x,y,2,1,c);P1(x+1,y+1,c)}else{R(x,y,1,2,c);P1(x+1,y,c)}}
function limb(x0,y0,x1,y1,w0,w1,col='#8a5a3a'){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)),P=[];for(let i=0;i<=n;i+=2){const u=i/n;P.push([Math.round(x0+(x1-x0)*u),Math.round(y0+(y1-y0)*u),Math.max(1,Math.round((w0+(w1-w0)*u)/2))])}
  P.forEach(([x,y,r])=>disc(x,y,r+1,r+1,OL));P.forEach(([x,y,r])=>disc(x,y,r,r,col));P.forEach(([x,y,r])=>{if(r>2)disc(x-Math.round(r*.4),y,Math.max(1,Math.round(r*.3)),Math.max(1,Math.round(r*.6)),'#a8703f')})}
// 横枝上的小灯笼：枝长 62% 处垂一根线，挂一盏纸灯笼，灯笼上下两道和这根枝的毛线套同色。L.y 是灯笼顶
const brLantern=b=>({x:brX0(b)+b.s*Math.round(b.len*.62),y:b.y+9});
function branchLantern(x,y,col){line(x,y-5,x,y-1,'#d9d2c4');R(x-2,y-1,5,2,OL);R(x-4,y+1,9,10,OL);R(x-3,y+2,7,8,'#ffe6a0');R(x-3,y+2,7,1,col);R(x-3,y+9,7,1,col);R(x-1,y+3,1,5,'#fff6d0');R(x+2,y+3,1,6,'#f0c060');R(x-2,y+11,5,2,OL);P1(x,y+13,col)}
function yarnStitch(xx,y,cx,y0,Y,u){const ly=(y-y0)%13;let col=u<.18?Y[2]:u<.72?Y[0]:Y[1];if(ly===0||ly===12)return Y[1];const sx=((xx-cx+100)%4+4)%4,sy=ly%3;
  if(sy===1&&(sx===0||sx===3))col=u<.18?Y[0]:Y[1];else if(sy===2&&(sx===1||sx===2))col=u<.18?Y[0]:Y[1];return col}
// 一段树干：一行一行画，knit=[y0,y1] 这一段裹着五色毛线套（一圈一个颜色，上下两道米色罗纹边），其余是树皮
function trunkRows(y0,y1,cxf,hwf,knit){for(let y=y0;y<=y1;y++){const cx=cxf(y),hw=hwf(y);R(cx-hw-1,y,2*hw+3,1,OL);
  for(let xx=cx-hw;xx<=cx+hw;xx++){const u=(xx-(cx-hw))/(2*hw);let col;
    if(knit&&y>=knit[0]&&y<=knit[1]){if(y<knit[0]+4||y>knit[1]-4)col=((xx-cx)%2===0)?'#fff4dc':'#d8c8a8';else{const band=Math.floor((y-knit[0]-4)/13);col=yarnStitch(xx,y,cx,knit[0]+4,YARN[(band+1)%5],u)}}
    else{col=u<.16?'#b07a48':u<.55?'#8a5a3a':u<.84?'#6e4430':'#4e3022';if(hsh(xx-cx+60,Math.floor(y/6))<.14&&u>.1&&u<.9)col='#5c3a26'}
    P1(xx,y,col)}}}
const bakeAt=(x,y,w,h,f)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d'),o=C;use(c);c.translate(-x,-y);f();use(o);return cv};

/* ---------- 一楼：树根、树干、两根低枝（贴着天花板），最上面一圈从天花板洞里垂下来的叶子 ---------- */
const T1={x:280,y:240,w:400,h:224};
const TRUNK1=bakeAt(T1.x,T1.y,T1.w,T1.h,()=>{const B=TREE.f1.base,cx=TREE.cx;
  limb(cx-18,292,382,282,20,7);limb(382,282,300,288,8,4);limb(cx+18,290,580,280,20,7);limb(580,280,664,288,8,4);limb(410,286,388,300,5,2);limb(556,284,578,300,5,2);
  trunkRows(262,B+2,cx1,y=>hw1(y)+(y>B-14?Math.round((y-(B-14))*1.3):0),[330,422]);
  [[-1,B-4,-56,B+12,14],[1,B-4,54,B+10,14],[-1,B+2,-28,B+16,10],[1,B+2,30,B+17,10]].forEach(([s,y0,dx,y1,w])=>limb(cx+s*22,y0,cx+dx,y1,w,4));
  // 两根低枝靠树干那一段的毛线套
  [[cx-34,286,-1],[cx+34,285,1]].forEach(([x0,y0,s])=>{for(let i=0;i<16;i++){const xx=x0+s*i,top=y0-5+Math.round(i*.15);for(let j=0;j<9;j++)P1(xx,top+j,j===0||j===8?OL:(i%3===0?YARN[(i>>2)%5][1]:YARN[(i>>2)%5][0]))}});
  // 天花板那一线：树干钻进去的地方一圈暗影，几团叶子从洞口垂下来
  // 低枝上一路长着叶子，树干钻进天花板的地方一大团
  [[cx,258,34,10,1],[cx-50,274,18,8,2],[cx+52,273,18,8,3],[cx-98,276,16,7,4],[cx+100,275,16,7,5],[cx-142,278,14,7,6],[cx+144,277,14,7,7],[312,284,13,7,8],[652,284,13,7,9]].forEach(([x,y,rx,ry,k])=>leafCluster(x,y,rx,ry,k*13))});
// 一楼的环形长凳：围着树根一圈，木板一块块放射开；前面露出凳子的侧面
function treeBench(cx,cy){disc(cx,cy+2,66,22,OL);disc(cx,cy+3,65,21,'#6e4430');disc(cx,cy,65,20,OL);disc(cx,cy,64,19,'#c98d5c');
  for(let i=0;i<36;i++){const a=i/36*Math.PI*2;line(Math.round(cx+Math.cos(a)*40),Math.round(cy+Math.sin(a)*11),Math.round(cx+Math.cos(a)*63),Math.round(cy+Math.sin(a)*19),'#a86e44')}
  disc(cx,cy,42,12,OL);disc(cx,cy,41,11,'#5a3a26');for(let i=0;i<30;i++){const a=hsh(i,301)*Math.PI*2,r=Math.sqrt(hsh(i,302))*.9;const x=Math.round(cx+Math.cos(a)*38*r),y=Math.round(cy+Math.sin(a)*9*r);if(hsh(i,303)<.5)R(x,y,2,1,'#5e8a4a');else leafG(x,y,i)}}
// 树下的招牌（第六轮）：新来的猫落地第一眼看到的就是它。92×34 的木牌，两根木柱撑着，牌头一对猫耳朵；
// 第一行金色大字 CLOWDER AI，第二行像素中文"猫猫咖啡馆"，上下沿各一串小灯轮着亮。(x,y) 是木牌左上角，底座落在 y+42
const SIGN_W=92,SIGN_H=34;
function treeSign(x,y,t){const W=SIGN_W,H=SIGN_H;alpha(.28,()=>disc(x+W/2,y+H+8,W/2-6,2,'#241a2e'));
  for(const px of [x+12,x+W-17]){R(px,y+H-2,5,10,OL);R(px+1,y+H-2,3,9,'#6e4430');P1(px+1,y+H-1,'#8a5a3a')}
  // 猫耳朵：外圈描边、里面一点粉
  for(const [ex,d] of [[x+5,1],[x+W-17,-1]])grid(ex,y-6,[".....oo.....","....obbo....","...obppbo...","..obppppbo..",".obbppppbbo.","obbbbbbbbbbo"],{o:OL,b:'#8a5a3a',p:'#f4a6b8','.':null});
  box(x,y,W,H,'#8a5a3a');R(x+1,y+1,W-2,1,'#b07a52');R(x+3,y+3,W-6,H-6,'#2e1c14');
  const tw=txtW('CLOWDER AI',2),tx=x+Math.floor((W-tw)/2);txt('CLOWDER AI',tx+1,y+6,'#5a3a10',2);txt('CLOWDER AI',tx,y+5,'#ffd84a',2);
  const cn='猫猫咖啡馆',cw=PXT.w(cn);PXT.draw(cn,x+Math.floor((W-cw)/2),y+16,'#fff4dc',{shadow:'#5a3a1a'});
  // 小灯：上沿、下沿一串，三颗一组轮着亮
  for(let i=0;i<14;i++){const bx=x+5+i*6,on=(Math.floor(t*3)+i)%3===0;P1(bx,y+1,on?'#ffd84a':'#6a4a2a');P1(bx+1,y+1,on?'#fff4c0':'#6a4a2a');P1(bx,y+H-2,on?'#ffd84a':'#6a4a2a');P1(bx+1,y+H-2,on?'#fff4c0':'#6a4a2a')}}

/* ---------- 二楼：树干从天井里长上来，六根横枝、枝头的小灯笼，枝梢一团团叶子 ---------- */
const T2={x:330,y:Y2+40,w:300,h:440};
const TRUNK2=bakeAt(T2.x,T2.y,T2.w,T2.h,()=>{const B=TREE.f2.base;
  trunkRows(TREE.f2.top,B,cx2,hw2,[Y2+372,Y2+460]);trunkRows(Y2+176,Y2+226,cx2,hw2,[Y2+176,Y2+226]);
  TREE.br.forEach((b,k)=>{const x0=brX0(b),dk=tint(b.col,.72),lt=tint(b.col,1.25),sd=(k+1)*7;
    for(let i=0;i<=b.len;i++){const u=i/b.len,xx=x0+b.s*i,top=b.y-Math.round(4*u*u),th=Math.max(5,13-Math.round(7*u));R(xx,top-1,1,th+2,OL);
      if(i>=4&&i<=18){R(xx,top,1,th,(i%3===0)?dk:b.col);P1(xx,top,lt)}else{R(xx,top,1,th,'#8a5a3a');P1(xx,top,'#b07a48');P1(xx,top+th-1,'#5c3a26')}}
    R(x0+b.s*(b.len+1),b.y-6,1,8,OL);
    leafCluster(x0+b.s*(b.len+6),b.y-8,17,11,sd);leafCluster(x0+b.s*(b.len-14),b.y-11,11,6,sd+3);leafCluster(x0+b.s*Math.round(b.len*.45),b.y-8,7,4,sd+5);
    const L=brLantern(b);branchLantern(L.x,L.y,b.col)});
  // 天花板那一线也垂下来几团叶子：上面就是屋顶上的树冠
  [[TREE.cx,Y2+56,34,10,1],[TREE.cx-44,Y2+64,14,7,2],[TREE.cx+46,Y2+63,14,7,3]].forEach(([x,y,rx,ry,k])=>leafCluster(x,y,rx,ry,k*17))});

/* ---------- 屋顶：树冠（一团团金色的叶子）、伸进树冠的大枝、瞭望台 ---------- */
const CAN_W=400,CAN_H=216;
const CANOPY_BLOBS=[[200,74,74,52],[118,96,58,40],[282,96,58,40],[56,128,44,32],[344,128,44,32],[156,42,54,34],[244,42,54,34],[200,22,50,26],[96,62,42,30],[304,62,42,30],
  [28,160,28,22],[372,160,28,22],[150,136,52,34],[250,136,52,34],[200,148,58,36],[86,166,40,24],[314,166,40,24],[200,178,42,22],[140,176,30,18],[260,176,30,18]].map(([x,y,rx,ry])=>({x,y,rx,ry}));
const CANOPY_CLUMPS=(()=>{const L=[];CANOPY_BLOBS.forEach((b,j)=>{const n=Math.round((b.rx+b.ry)/8);for(let k=0;k<n;k++){const a=(k+hsh(j,k))/n*Math.PI*2,r=5+Math.round(hsh(k,j+9)*4);
  const x=b.x+Math.cos(a)*b.rx*.92,y=b.y+Math.sin(a)*b.ry*.92;if(y>-8)L.push({x:Math.round(x),y:Math.round(y),rx:r,ry:Math.max(3,Math.round(r*.85))})}});return L})();
const inCanopy=(x,y)=>CANOPY_BLOBS.some(b=>((x-TREE.rf.canX-b.x)/b.rx)**2+((y-TREE.rf.canY-b.y)/b.ry)**2<=1);
const canopyBottom=x=>{let m=0;for(const b of CANOPY_BLOBS){const dx=(x-TREE.rf.canX-b.x)/b.rx;if(Math.abs(dx)<1)m=Math.max(m,b.y+b.ry*Math.sqrt(1-dx*dx))}return TREE.rf.canY+m};
const CANOPY_IMG=(()=>{const cv=document.createElement('canvas');cv.width=CAN_W;cv.height=CAN_H;const o=C;use(cv.getContext('2d'));
  leafMass([...CANOPY_BLOBS,...CANOPY_CLUMPS],CANOPY_BLOBS);
  disc(200,142,86,34,'#b57d18');disc(200,148,66,26,'#9a6414');disc(200,152,46,18,'#7a4c10');for(let i=0;i<160;i++){const a=hsh(i,59)*Math.PI*2,r=Math.sqrt(hsh(i,60))*.95;R(Math.round(200+Math.cos(a)*84*r),Math.round(142+Math.sin(a)*32*r),2,1,r>.7?'#c98a1e':'#8a5a14')}
  const fr=[[140,176,30,18],[200,180,40,20],[260,176,30,18],[96,168,34,20],[304,168,34,20],[170,168,18,12],[232,168,18,12]].map(([x,y,rx,ry])=>({x,y,rx,ry}));leafMass(fr,fr);use(o);return cv})();
const TR={x:380,y:Y3+120,w:200,h:310};
const TRUNK3=bakeAt(TR.x,TR.y,TR.w,TR.h,()=>{const cx=TREE.cx,B=TREE.rf.base,cxr=y=>cx+Math.round(4*Math.sin((B-y)/60)),hwr=y=>Math.round(18+5*Math.max(0,Math.min(1,(y-Y3+230)/200)));
  limb(cxr(Y3+250)-8,Y3+250,418,Y3+152,16,6);limb(cxr(Y3+250)+8,Y3+250,548,Y3+148,16,6);limb(cxr(Y3+240),Y3+240,cx+1,Y3+176,18,10);
  trunkRows(Y3+230,B,cxr,hwr,[Y3+300,Y3+390]);
  const T0=TREE.rf.top;R(T0.x-28,T0.y,57,5,OL);R(T0.x-27,T0.y+1,55,1,'#e0a878');R(T0.x-27,T0.y+2,55,2,'#b87a4a');for(let i=T0.x-24;i<T0.x+28;i+=9)P1(i,T0.y+2,'#8a5a3a');
  line(T0.x-20,T0.y+5,T0.x-4,T0.y+18,OL);line(T0.x+20,T0.y+5,T0.x+4,T0.y+18,OL);
  [T0.x-28,T0.x+26].forEach(px=>{R(px,T0.y-11,3,11,OL);R(px+1,T0.y-10,1,10,'#b87a4a')});for(let i=0;i<52;i++)P1(T0.x-26+i,T0.y-9+Math.round(Math.sin(i/52*Math.PI)*3),'#d9d2c4');
  const FR=[[cx-64,Y3+166,13,9],[cx+66,Y3+164,13,9],[cx-84,Y3+190,9,6],[cx+86,Y3+188,9,6]].map(([x,y,rx,ry])=>({x,y,rx,ry}));leafMass(FR,FR,{ol:'#c98a1e'})});

/* ---------- 挂成品的位置：一楼低枝 12 处、二楼横枝 12 处、屋顶树冠 12 处；第 i 件挂在 i%3 那一层 ---------- */
const ORN=[[],[],[]];
(()=>{for(let k=0;k<12;k++){const side=k%2?1:-1,j=k>>1,x=Math.round(TREE.cx+side*(60+j*22+hsh(k,61)*8)),y=x<TREE.cx?282+Math.round((TREE.cx-x)*.02):281+Math.round((x-TREE.cx)*.02);ORN[0].push({x,y,len:4+Math.round(hsh(k,62)*7)})}
  TREE.br.forEach((b,i)=>{const x0=brX0(b);[.38,.82].forEach((u,j)=>{ORN[1].push({x:x0+b.s*Math.round(b.len*u),y:b.y+(u>.6?3:5),len:3+Math.round(hsh(i*2+j,63)*5)})})});
  for(let k=0;k<12;k++){if(k<8){const x=Math.round(TREE.rf.canX+30+340*(k+.5)/8+(hsh(k,64)-.5)*8);ORN[2].push({x,y:Math.round(canopyBottom(x)-5-hsh(k,65)*8),len:3+Math.round(hsh(k,66)*6)})}
    else for(let n=0;n<40;n++){const x=Math.round(TREE.rf.canX+60+hsh(k,67+n)*280),y=Math.round(TREE.rf.canY+40+hsh(k,68+n)*110);if(inCanopy(x,y)&&inCanopy(x,y+16)&&Math.abs(x-TREE.cx)>20){ORN[2].push({x,y,len:3+Math.round(hsh(k,69)*4)});break}}}
  ORN.forEach(L=>L.sort((a,b)=>hsh(a.x,7)-hsh(b.x,7)))})();
const ornAt=i=>ORN[i%3][Math.floor(i/3)%12];
function treeOrnaments(T0,floor){if(!T0)return;T0.orn.forEach((it,i)=>{if(i%3!==floor)return;const p=ornAt(i);if(!p)return;line(p.x,p.y,p.x,p.y+p.len,'#d9d2c4');R(p.x-1,p.y-1,3,2,OL);P1(p.x,p.y-1,'#fff4c0');knit(it.kind,p.x,p.y+p.len,it.ci)})}

/* ---------- 往 WORLD 里加：一楼的长凳和树、二楼的天井和栏杆、屋顶的树冠 ---------- */
(()=>{const M=WORLD,P=WP,W=TREE.f2.well;
// plaque：树下招牌的左上角（木牌 92×34，底座落在 base+72）；爬树从招牌右边起跳
addP({treeAt:{x:TREE.cx+68,y:TREE.f1.base+30},plaque:{x:TREE.cx-46,y:TREE.f1.base+30},branchAt:{x:390,y:Y2+372},slideAt:{x:420,y:Y2+374},topAt:{x:TREE.cx+24,y:TREE.rf.base+16}});
M.BLOCK.push([W[0]-6,W[1]-4,W[2]+12,W[3]+12]);   // 天井和一圈栏杆
M.BLOCK.push([P.plaque.x+2,P.plaque.y+SIGN_H-4,SIGN_W-4,12]);   // 树下的招牌占的地
// 招牌夜里不被夜色压暗，前面一盏暖光照着
{const F1=M.floors.find(f=>f.id==='f1');(F1.bright=F1.bright||[]).push([P.plaque.x,P.plaque.y,SIGN_W,SIGN_H])}   // 只框木牌本身（全是不透明的），牌头上面的地板照常压暗
const bg0=M.bg;M.bg=function(){bg0.call(this);treeBench(TREE.cx,TREE.f1.base);wellHole(W[0],W[1],W[2],W[3])};
const add=(x,y,w,h,base,draw,o={})=>M.props.push({x,y,w,h,base,draw,...o});
add(T1.x,T1.y,T1.w,T1.h,TREE.f1.base,(t,S)=>{C.drawImage(TRUNK1,T1.x,T1.y);treeOrnaments(S.tree,0)},{ver:S=>S.tree?S.tree.v:0});
add(P.plaque.x,P.plaque.y-6,SIGN_W,SIGN_H+16,P.plaque.y+SIGN_H+8,t=>treeSign(P.plaque.x,P.plaque.y,t),{live:1});
add(T2.x,T2.y,T2.w,T2.h,TREE.f2.base,(t,S)=>{C.drawImage(TRUNK2,T2.x,T2.y);treeOrnaments(S.tree,1)},{ver:S=>S.tree?S.tree.v:0});
add(W[0]-6,W[1]-6,W[2]+12,14,W[1]+6,()=>railH(W[0]-6,W[1]-6,W[2]+12));add(W[0]-6,W[1]+W[3]-4,W[2]+12,14,W[1]+W[3]+8,()=>railH(W[0]-6,W[1]+W[3]-4,W[2]+12));
add(W[0]-6,W[1],6,W[3],W[1]+W[3],()=>railV(W[0]-6,W[1],W[3]));add(W[0]+W[2]+2,W[1],6,W[3],W[1]+W[3],()=>railV(W[0]+W[2]+2,W[1],W[3]));
add(TREE.rf.canX,TREE.rf.canY,CAN_W,TREE.rf.base-TREE.rf.canY,TREE.rf.base,(t,S)=>{C.drawImage(CANOPY_IMG,TREE.rf.canX,TREE.rf.canY);C.drawImage(TRUNK3,TR.x,TR.y);treeOrnaments(S.tree,2)},{ver:S=>S.tree?S.tree.v:0});
M.lights.push({x:TREE.cx,y:P.plaque.y+SIGN_H+4,r:46,col:'#ffd88a',when:'night',a:.45},{x:TREE.cx,y:300,r:70,col:'#ffcf60',when:'night',a:.5},{x:TREE.cx,y:Y2+250,r:90,col:'#ffcf60',when:'night',a:.45},{x:TREE.cx,y:Y3+170,r:120,col:'#ffcf60',a:.5},
  ...TREE.br.map(b=>{const L=brLantern(b);return{x:L.x,y:L.y+8,r:16,col:'#ffd890',when:'night',a:.8}}));
})();

WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,say,sfx,news,after,emote,T,stay,unclaim,dist,floorOf}=A;
const now=()=>A.t,tick=f=>A.tickers.push(f),near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,onTree=c=>{const r=A.roomAt(c.x,c.y).id;return r==='cafe'||r==='well'||r==='roof'};

/* ---------- 全店一起挂：橱窗里每挂一件，树上多挂一件；挂满了满树金光 ---------- */
const kinds=Object.keys(KNIT);S.tree={orn:Array.from({length:12},()=>({kind:rnd(kinds),ci:Math.floor(Math.random()*5),t0:-99})),blooms:0,bloom:0,v:1};
// 满树金光那十几秒里又有人挂：先记在下一轮（next），金光收起来以后挂上去，不丢
function treeAdd(item){const T0=S.tree;if(T0.bloom){(T0.next=T0.next||[]).push({kind:item.kind,ci:item.ci});return}if(T0.orn.length>=TREE.N)return;T0.orn.push({kind:item.kind,ci:item.ci,t0:now()});T0.v++;if(T0.orn.length>=TREE.N)bloom()}
function bloom(){const T0=S.tree;if(T0.bloom)return;T0.bloom=now();T0.blooms++;news(`毛线巨树挂满了 ${TREE.N} 件！满树金光`);if(A.play&&onTree(me)){sfx('fanfare');say('毛线巨树挂满了！满树金光')}
    S.cats.forEach(c=>{if(onTree(c)&&!c.me&&!c.hidden&&Math.random()<.6)emote(c,'bang',2)});
    after(14,()=>{T0.orn=(T0.next||[]).slice(0,TREE.N-1).map(o=>({kind:o.kind,ci:o.ci,t0:now()}));T0.next=[];T0.bloom=0;T0.v++;if(A.play&&onTree(me))say('树上的成品收下来了，又可以从头挂')})}
// 联机时（A.shared）树跟着服务端走：谁挂了一件，world-online.js 调 A.tree.add；连上时用 A.tree.set 换成服务端那一份
const h0=A.onHang;A.onHang=(c,item)=>{if(h0)h0(c,item);if(!A.shared)treeAdd(item)};
A.tree={add:treeAdd,bloom,set:list=>{const T0=S.tree;if(T0.bloom){T0.next=list.map(o=>({kind:o.kind,ci:o.ci}));return}T0.orn=list.slice(0,TREE.N-1).map(o=>({kind:o.kind,ci:o.ci,t0:-99}));T0.v++},get n(){return S.tree.orn.length},N:TREE.N};

/* ---------- 上下楼的几条树上的路（不走寻路，只有按了才走） ---------- */
const TP={up12:{id:'t12',from:'f1',to:'f2',k:'climb',dir:{x:0,y:-1},out:{x:TREE.cx-2,y:Y2+398,z:TREE.f2.base+.5,face:'L'}},
  up2r:{id:'t2r',from:'f2',to:'roof',k:'climb',dir:{x:0,y:-1},out:{x:TREE.cx,y:TREE.rf.top.y+40,z:TREE.rf.base+.5,face:'R'}},
  slide:{id:'tdown',to:'f1',k:'slide',dir:{x:0,y:1},out:{x:TREE.cx+30,y:TREE.f1.base+30,face:'R'},outDir:{x:1,y:.3}}};
// 一楼：从长凳前面跳上凳子，再顺着树干一节节往上
const CLIMB1=[{x:TREE.cx+6,y:TREE.f1.base+12,z:TREE.f1.base+12.6},{x:TREE.cx+2,y:TREE.f1.base-50,z:TREE.f1.base+.5},{x:TREE.cx-2,y:TREE.f1.base-110,z:TREE.f1.base+.5},{x:TREE.cx,y:TREE.f1.base-160,z:TREE.f1.base+.5}];
// 二楼：从树干一根根横枝往上，到天花板
const CLIMB2=[BRANCH_PERCH[0],BRANCH_PERCH[1],BRANCH_PERCH[2],BRANCH_PERCH[3],BRANCH_PERCH[4],BRANCH_PERCH[5],{x:TREE.cx,y:Y2+96,z:TREE.f2.base+.5}];
// 屋顶：从树干往上到瞭望台
const CLIMB3=[{x:TREE.cx-4,y:TREE.rf.base-40,z:TREE.rf.base+.5},{x:TREE.cx+2,y:TREE.rf.base-110,z:TREE.rf.base+.5},{x:TREE.cx,y:TREE.rf.base-180,z:TREE.rf.base+.5}];

/* ---------- 二楼横枝：随便挑一根窝着（你也行）；屋顶瞭望台：你坐上去切到看风景 ---------- */
const brOcc=BRANCH_PERCH.map(()=>null),topOcc=TOP_PERCH.map(()=>null);
const freeOf=(occ,c,order)=>order.find(i=>!occ[i]||occ[i]===c||occ[i].gone);
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
// 坐上横枝 i：从当前位置一根根跳上去；下来时跳回天井边的地板
function perchSteps(c,i){const s=BRANCH_PERCH[i],path=BRANCH_PERCH.slice(0,i+1).filter((p,j)=>j===i||(j%2)===(i%2)||j===0);
  return[...path.map(p=>({jump:{...p}})),{fn:c=>{if(brOcc[i]&&brOcc[i]!==c&&!brOcc[i].gone){c.q=[];run(c,[{jump:{...P.branchAt}},{fn:c=>{c.z=undefined}}]);return}brOcc[i]=c;c.doing='窝在巨树的横枝上';c.face=s.face;
    c.onLeave=c=>{if(brOcc[i]===c)brOcc[i]=null;c.doing=null};
    stay(c,{k:c.me?'sit':rnd(['sit','lie','sleep','sit']),ex:'content',face:s.face,dur:rr(10,22),leave:c=>[...BRANCH_PERCH.slice(0,i).reverse().filter((p,j)=>j%2===0).map(p=>({jump:{...p}})),{jump:{...P.branchAt}},{fn:c=>{c.z=undefined}}]})}}]}
function topSteps(c){const i=freeOf(topOcc,c,c.me?[0,1]:[1,0]);if(i==null)return null;const s=TOP_PERCH[i];
  return[{jump:{...s}},{fn:c=>{if(topOcc[i]&&topOcc[i]!==c&&!topOcc[i].gone){c.q=[];return}topOcc[i]=c;c.doing='在树顶的瞭望台上';c.onLeave=c=>{if(topOcc[i]===c)topOcc[i]=null;c.doing=null};
    stay(c,{k:'sit',ex:'content',face:s.face,dur:rr(10,20),leave:c=>[...CLIMB3.slice().reverse().map(p=>({jump:{...p}})),{jump:{...P.topAt}},{fn:c=>{c.z=undefined}}]});if(A.onSeat)A.onSeat('treetop',c,i)}}]}

// 一楼：爬上毛线巨树。你一路爬到屋顶的瞭望台；别的猫爬到二楼挑一根横枝
T({id:'yarntree',n:'毛线巨树',hit:[TREE.cx-30,TREE.f1.top,60,TREE.f1.base-TREE.f1.top],at:P.treeAt,near:[P.treeAt.x-18,P.treeAt.y-14,36,24],
  label:c=>c.me?'爬上毛线巨树（一直爬到屋顶）':'爬上毛线巨树',ok:c=>!c.hold,no:()=>'叼着东西爬不了树',ai:{mood:'rest',w:1.6},
  go(c){const steps=[{go:P.treeAt},{fn:c=>{c.face='L';c.doing='在爬毛线巨树'}},...CLIMB1.map(p=>({jump:{...p},dur:.5})),{portal:TP.up12}];
    if(c.me){const ti=freeOf(topOcc,c,[0,1]);if(ti==null){say('树顶上已经坐满了');return}
      run(c,[...steps,...CLIMB2.map(p=>({jump:{...p},dur:.45})),{portal:TP.up2r},{fn:c=>{const st=topSteps(c);if(st)run(c,st,true)}}]);sfx('rustle');return}
    const i=freeOf(brOcc,c,shuffle([0,1,2,3,4,5]));if(i==null)return;run(c,[...steps,...perchSteps(c,i)])}});
A.seatThing({id:'treebench',n:'树下的环形长凳',hit:[TREE.cx-66,TREE.f1.base-18,132,40],at:{x:TREE.cx-40,y:TREE.f1.base+24},near:[TREE.cx-70,TREE.f1.base+8,140,24],label:'在树下的长凳上坐一会儿',
  spots:BENCH_SPOTS,up:i=>[{...BENCH_SPOTS[i]}],down:i=>[{x:BENCH_SPOTS[i].x+(BENCH_SPOTS[i].x<TREE.cx?-6:6),y:TREE.f1.base+26}],floor:i=>({x:BENCH_SPOTS[i].x+(BENCH_SPOTS[i].x<TREE.cx?-6:6),y:TREE.f1.base+26}),
  k:()=>rnd(['sit','lie','sit','sleep']),ex:'content',doing:'坐在树下的长凳上',ai:{mood:'rest',w:1.8}});
{const SA={x:P.plaque.x+SIGN_W/2,y:P.plaque.y+SIGN_H+20};
T({id:'treeplaque',n:'猫猫咖啡馆的招牌',hit:[P.plaque.x,P.plaque.y-6,SIGN_W,SIGN_H+14],at:SA,near:[P.plaque.x+2,SA.y-10,SIGN_W-4,22],label:'看看招牌',ai:{mood:'explore',w:.2},
  go(c){run(c,[{go:SA},{fn:c=>{c.face='R'}},{k:'sit',dur:.6,ex:'lookUp'},{fn:c=>{if(c.me)openPlaque()}}])}})}
function openPlaque(){const T0=S.tree;A.dlg.show({id:'tree-'+Math.floor(now()*10),kind:'info',head:{icon:'tree',title:'毛线巨树'},blocks:[
  {k:'text',t:'招牌上写着 CLOWDER AI · 猫猫咖啡馆。Clowder 是"一群猫"：猫猫咖啡馆把一只只 AI 猫变成一个团队，各有各的身份和本事，互相 @、互相 review。'},
  {k:'text',t:'这棵树从咖啡厅的地面长出来，穿过二楼，树冠在屋顶上。树干上的毛线套一圈一个颜色，是店里的猫一针一针织上去的。'},
  {k:'text',t:'全店每挂出一件成品，树上就多挂一件，一楼、二楼、屋顶轮着挂；挂满 '+TREE.N+' 件，满树金光。'},
  {k:'progress',p:T0.orn.length/TREE.N,t:`树上挂了 ${T0.orn.length} / ${TREE.N} 件`+(T0.blooms?` · 已经满树金光过 ${T0.blooms} 次`:'')},
  {k:'links',items:['site','github'].map(k=>({key:k,...LINKS[k]}))}],
  tip:{...TIPS.multi,key:'multi'},acts:[{id:'ok',t:'知道了',key:'E'}]})}
// 二楼：跳上一根横枝
T({id:'branch',n:'巨树的横枝',hit:[TREE.cx-110,Y2+130,220,230],at:P.branchAt,near:[P.branchAt.x-16,P.branchAt.y-14,40,24],label:'跳上一根横枝',ok:c=>!c.hold&&freeOf(brOcc,c,[0,1,2,3,4,5])!=null,no:c=>c.hold?'叼着东西跳不上去':'横枝上都有猫了',
  ai:{mood:'rest',w:1.4},go(c){const i=freeOf(brOcc,c,c.me?[0,2,4,1,3,5]:shuffle([0,1,2,3,4,5]));if(i==null)return;run(c,[{go:P.branchAt},...perchSteps(c,i)])}});
// 二楼、屋顶：抱着树干滑回一楼
T({id:'treeslide',n:'抱着树干滑下去',hit:[TREE.cx-20,Y2+384,40,40],at:P.slideAt,near:[P.slideAt.x-14,P.slideAt.y-14,36,24],label:'抱着树干，一路滑回一楼',ok:c=>!c.hold,no:()=>'叼着东西，走楼梯吧',ai:{mood:'explore',w:.3},
  go(c){run(c,[{go:P.slideAt},{jump:{x:TREE.cx-16,y:Y2+404,z:TREE.f2.base+.5}},{portal:TP.slide},{k:'happy',dur:.6,soft:1}]);if(c.me)sfx('rustle')}});
T({id:'treeslide2',n:'顺着树干滑下去',hit:[TREE.cx-24,TREE.rf.base-60,48,60],at:P.topAt,near:[P.topAt.x-20,P.topAt.y-14,44,24],label:'顺着树干，一路滑回一楼',ok:c=>!c.hold,no:()=>'叼着东西，走楼梯吧',hidden:c=>!c.me,
  go(c){run(c,[{go:P.topAt},{jump:{x:TREE.cx+10,y:TREE.rf.base-6,z:TREE.rf.base+.5}},{portal:TP.slide},{k:'happy',dur:.6,soft:1}]);if(c.me)sfx('rustle')}});
// 屋顶：爬上树顶的瞭望台
T({id:'treetop',n:'树顶瞭望台',hit:[TREE.rf.canX+120,TREE.rf.canY,160,170],at:P.topAt,near:[P.topAt.x-34,P.topAt.y-16,60,26],label:'爬上树顶的瞭望台（看整条街）',ok:c=>!c.hold&&freeOf(topOcc,c,[0,1])!=null,no:c=>c.hold?'叼着东西爬不了树':'瞭望台上坐满了',
  ai:{mood:'rest',w:1.2},go(c){run(c,[{go:P.topAt},{fn:c=>{c.face='L'}},...CLIMB3.map(p=>({jump:{...p},dur:.5})),{fn:c=>{const st=topSteps(c);if(st)run(c,st,true);else{c.q=[];run(c,[{jump:{...P.topAt}},{fn:c=>{c.z=undefined}}],true)}}}])}});
A.treePerch={br:brOcc,top:topOcc};

/* ---------- 会动的：金色光点往上飘、落叶往下飘、新挂上的一闪、树顶的灯、满树金光 ---------- */
const TOPLAMP={x:TREE.rf.top.x+27,y:TREE.rf.top.y-12};
A.overs.push(vis=>{const t=now(),T0=S.tree,bl=T0.bloom?Math.min(1,(t-T0.bloom)/1.5)*Math.min(1,(T0.bloom+14-t)/2):0;
  // 一楼：天花板洞口漏下来的光点、落叶
  if(vis(300,250,360,240)){for(let i=0;i<14;i++){const sp=3+hsh(i,93)*4,y=Math.round(440-((t*sp+hsh(i,94)*170)%170)),x=Math.round(330+hsh(i,95)*300+Math.sin(t*.7+i)*5);if((Math.floor(t*2+i)%4)!==0)P1(x,y,bl>0?'#fff8d0':'#ffe890')}
    for(let i=0;i<6;i++){const per=8+hsh(i,96)*6,k=((t+hsh(i,97)*per)%per)/per,gy=330+hsh(i,98)*190,y0=270,y=Math.round(y0+(gy-y0)*Math.min(1,k*1.25)),x=Math.round(320+hsh(i,100)*320+(k<.8?Math.sin(t*1.6+i)*8:0));leafG(x,y,i+Math.floor(t*3))}}
  // 二楼：天井里飘上来的光点
  if(vis(330,Y2,300,540))for(let i=0;i<16;i++){const sp=4+hsh(i,101)*5,y=Math.round(Y2+470-((t*sp+hsh(i,102)*420)%420)),x=Math.round(400+hsh(i,103)*160+Math.sin(t*.7+i)*6);if((Math.floor(t*2+i)%4)!==0)P1(x,y,bl>0?'#fff8d0':'#ffe890')}
  // 新挂上去的一件：一圈小光点
  T0.orn.forEach((it,i)=>{const k=t-it.t0;if(k<0||k>2.2)return;const p=ornAt(i);if(!p||!vis(p.x-20,p.y-10,40,40))return;for(let j=0;j<6;j++){const a=t*4+j*Math.PI/3,r=4+k*8;P1(Math.round(p.x+Math.cos(a)*r),Math.round(p.y+p.len+4+Math.sin(a)*r*.7),'#fff4c0')}});
  // 树顶瞭望台的小灯笼：满树金光过几次，就亮一点
  if(vis(TOPLAMP.x-14,TOPLAMP.y-8,28,28)){const L=TOPLAMP,g=Math.min(1,.35+T0.blooms*.2);R(L.x,L.y,1,4,OL);R(L.x-3,L.y+4,7,8,OL);R(L.x-2,L.y+5,5,6,g>.6?'#fff4c0':'#ffd84a');R(L.x-2,L.y+10,5,1,'#e8b83a')}
  if(bl>0){C.save();C.globalCompositeOperation='lighter';C.globalAlpha=.35*bl*(.75+.25*Math.sin(t*5));[[TREE.cx,300,110],[TREE.cx,Y2+250,140],[TREE.cx,Y3+160,150]].forEach(([x,y,r])=>{if(vis(x-r,y-r,2*r,2*r))C.drawImage(glowTex(r,'#ffd070'),x-r,y-r)});C.restore()}});
// 夜里（屋顶永远是夜里）挂着的每一件亮一颗小灯
tick(()=>{const T0=S.tree;T0.orn.forEach((it,i)=>{const p=ornAt(i);if(p)A.lights.push({x:p.x,y:p.y,r:9,col:'#ffe8a0',a:.9})});A.lights.push({x:TOPLAMP.x,y:TOPLAMP.y+8,r:14+T0.blooms*4,col:'#ffe08a'})});

/* ---------- 第一次上屋顶：镜头往上摇到树冠和星空，再回来（你一走开就结束） ---------- */
let cine=null;const ease=u=>u<.5?2*u*u:1-2*(1-u)*(1-u);
A.reveal=()=>{cine={t0:now(),x0:me.x,y0:me.y}};
A.camHook=(vw,vh)=>{if(!cine)return null;const k=now()-cine.t0;if(k>6.5||Math.hypot(me.x-cine.x0,me.y-cine.y0)>70){cine=null;return null}
  const u=k<.4?0:k<3.4?ease((k-.4)/3):k<5?1:1-ease((k-5)/1.5),bx=me.x,by=me.y-12-vh*.25,tx=TREE.cx,ty=Y3+vh/2;return{x:bx+(tx-bx)*u,y:by+(ty-by)*u,k:10}};
A.inCine=()=>!!cine;
Object.assign(A.LIKES[3],{yarntree:1.5,treebench:1});Object.assign(A.LIKES[5],{yarntree:2.5,branch:2});Object.assign(A.LIKES[4],{yarntree:1,branch:1.5});
});
