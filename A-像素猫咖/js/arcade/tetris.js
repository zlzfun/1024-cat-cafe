/* 1024 猫咖 · 游戏厅的街机：俄罗斯方块（TETRIS）。开机、暂停、结束、最高分归主板（core.js），这里只管一局。
   怎么玩：10×20 的场地，7 种方块按"7 个一袋"发（每 7 块里每种正好一块，不会久等长条）。←→ 移动（按住 10 步以后每 2 步连移），↓ 软降（每格 1 分），
     ↑ 硬降（每格 2 分，立刻锁定），A 顺时针转，B 逆时针转。消 1/2/3/4 行得 100/300/500/800 × 等级；每 10 行升一级，越落越快（SPD 表，最快 2 步一格）。
   取舍：旋转用 SRS 的踢墙表（I 块一张、其余一张），表里都不行再试一次"往上顶一格"，贴墙贴地都转得动。落地有 30 步锁定延迟，移动、旋转成功会重置，
     但每到一个新的最低行才重新给 15 次，原地转不到天荒地老。场地上面藏着 2 行（转身的余地），方块出生在可见的头两行，挤不下就往上让一行，还挤不下就 GAME OVER。
     不做 HOLD：A/B 留给两个方向的旋转。左边空地坐着你的猫：盯着方块看，消行就蹦两下冒心（四行连消冒一串），堆高了冒汗，输了就睡着。 */
ARC.def('tetris',(()=>{
const W=10,H=22,HID=2,CS=6,FX=46,FY=12,LOCK=30,LIM=15,DAS=10,ARR=2,CLR=30;   // 22 行里上面 2 行藏着；一格 6×6，可见区左上角 (46,12)；消行动画 30 步
const SRC=['....|####|....|....','#..|###|...','..#|###|...','##|##','.##|##.|...','.#.|###|...','##.|.##|...'];   // I J L O S T Z（SRS 的出生朝向）
// 每种方块 4 个朝向的格子：顺时针转一次 (x,y) → (n-1-y,x)
const SH=SRC.map(s=>{const m=s.split('|'),n=m.length;let c=[];m.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='#')c.push([x,y])}));const R=[c];for(let i=1;i<4;i++)R.push(c=c.map(([x,y])=>[n-1-y,x]));return R});
// SRS 踢墙，偏移表写法：从朝向 a 转到 b，第 i 次试探挪 OF[a][i]-OF[b][i]（每朝向 5 对 x,y；表里 y 朝上）
const OJ=[[0,0,0,0,0,0,0,0,0,0],[0,0,1,0,1,-1,0,2,1,2],[0,0,0,0,0,0,0,0,0,0],[0,0,-1,0,-1,-1,0,2,-1,2]],
      OI=[[0,0,0,0,0,0,0,0,0,0],[0,0,2,0,-1,0,2,1,-1,-2],[0,0,3,0,-3,0,3,-1,-3,-1],[0,0,1,0,-2,0,1,-2,-2,1]];
const SPD=[48,42,36,31,26,22,18,15,12,10,8,7,6,5,5,4,4,3,3,2],spd=lv=>SPD[Math.min(lv,SPD.length)-1];   // 第 n 级几步落一格
// 配色 [高光, 本色, 暗边]：I 青 J 蓝 L 橙 O 金 S 薄荷 T 紫 Z 红；第 8 组是输了以后的灰
const COL=[['#d4f8ff','#7ae8ff','#3a9ec0'],['#b8c8ff','#6a8cf0','#3a4aa0'],['#ffd2a0','#f0963c','#a8582a'],['#fff4b0','#ffd84a','#c8902a'],
  ['#cff8cf','#7ee08a','#3a9a5a'],['#ecc4ff','#c07ee8','#74429e'],['#ffb09c','#e0533d','#982c2c'],['#9a8a98','#6a5a6a','#3e3040']];
const BG='#1c1426',FB='#130d1b',OL='#3a2630',CR='#fff4dc',PK='#f4a6b8',GD='#ffd84a';
const mix=(a,b,f)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.substr(i,2),16)*(1-f)+parseInt(b.substr(i,2),16)*f).toString(16).padStart(2,'0')).join('');
const GH=COL.map(c=>mix(c[1],FB,.45)),TR=COL.map(c=>mix(c[1],FB,.75));   // 幽灵块描边、硬降拖影
const PAL0={body:'#fff3e0',light:'#ffffff',shade:'#e8d2c0',outline:'#5a3a4a',collar:'#e0533d',whisk:'#9a7a8a'};

/* ---------- 规则 ---------- */
const fits=(g,t,r,x,y)=>SH[t][r].every(([a,b])=>{const X=x+a,Y=y+b;return X>=0&&X<W&&Y<H&&(Y<0||!g.b[Y][X])});
const dropY=(g,p)=>{let y=p.y;while(fits(g,p.t,p.r,p.x,y+1))y++;return y};
const add=(g,n)=>{g.sc+=n;g.score(n)};
const bag=g=>{const a=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=g.ri(0,i);[a[i],a[j]]=[a[j],a[i]]}g.q.push(...a)};
const held=g=>{if(g.lk&&g.rs<LIM){g.lk=0;g.rs++}};   // 落地后挪动/转动成功：锁定计时重来（有次数上限）
const low=g=>{if(g.p.y>g.low){g.low=g.p.y;g.rs=0}};
function spawn(g){const t=g.q.shift();if(g.q.length<7)bag(g);const p=g.p={t,r:0,x:t===3?4:3,y:t?HID:HID-1};g.fall=0;g.lk=0;g.rs=0;
  if(!fits(g,t,0,p.x,p.y)&&!fits(g,t,0,p.x,--p.y))return die(g);g.low=p.y}
function die(g){Object.assign(g,{dead:1,hap:0,pop:null,lf:null,tr:null});g.b.forEach(r=>r.forEach((v,i)=>{if(v)r[i]=8}));g.over()}
function mv(g,d){const p=g.p;if(!fits(g,p.t,p.r,p.x+d,p.y))return;p.x+=d;g.sfx('move');held(g)}
function rot(g,d){const p=g.p;if(p.t===3)return;const a=p.r,b=(a+d+4)%4,O=p.t?OJ:OI;
  for(let i=0;i<6;i++){const dx=i<5?O[a][2*i]-O[b][2*i]:0,dy=i<5?O[b][2*i+1]-O[a][2*i+1]:-1;   // 场地 y 朝下，所以 y 反过来；第 6 次：往上顶一格
    if(fits(g,p.t,b,p.x+dx,p.y+dy)){p.x+=dx;p.y+=dy;p.r=b;g.sfx('rot');held(g);low(g);return}}}
function lock(g){const p=g.p,C=SH[p.t][p.r];let vis=0;g.p=null;g.sfx('drop');g.lf=[C.map(([a,b])=>[p.x+a,p.y+b,p.t]),4];
  C.forEach(([a,b])=>{const X=p.x+a,Y=p.y+b;if(Y>=0)g.b[Y][X]=p.t+1;if(Y>=HID)vis=1});
  if(!vis)return die(g);   // 整块锁在看不见的地方：也算顶到头了
  const full=[];g.b.forEach((r,y)=>{if(r.every(v=>v))full.push(y)});if(!full.length)return spawn(g);
  const n=full.length;g.clr=full;g.ct=0;g.lf=null;add(g,[0,100,300,500,800][n]*g.lv);g.lines+=n;g.sfx(n>3?'tetris':'line');g.hap=n>3?96:48;g.hn=n>3?3:1;
  if(n>3)g.pop=['TETRIS!',CLR+30,GD]}
function collapse(g){g.b=g.b.filter((r,y)=>!g.clr.includes(y));while(g.b.length<H)g.b.unshift(Array(W).fill(0));g.clr=null;
  const lv=1+Math.floor(g.lines/10);if(lv>g.lv){g.lv=lv;g.sfx('up');g.pop=['LEVEL UP',90,'#7ee08a']}spawn(g)}

/* ---------- 画 ---------- */
// 一格：本色打底，上、左一道高光，右、下一道暗边，左上角一点亮（4px 的小格不点）
const blk=(x,px,py,c,s=CS)=>{x.rect(px,py,s,s,c[1]);x.rect(px,py,s-1,1,c[0]);x.rect(px,py+1,1,s-2,c[0]);x.rect(px+s-1,py,1,s,c[2]);x.rect(px,py+s-1,s-1,1,c[2]);if(s>4)x.px(px+1,py+1,CR)};
// 预览：按朝向 0 的外接框居中摆
function prev(x,t,cx,cy,s){const C=SH[t][0],xs=C.map(c=>c[0]),ys=C.map(c=>c[1]),x0=Math.min(...xs),y0=Math.min(...ys),w=(Math.max(...xs)-x0+1)*s,h=(Math.max(...ys)-y0+1)*s;
  C.forEach(([a,b])=>blk(x,Math.floor(cx-w/2)+(a-x0)*s,Math.floor(cy-h/2)+(b-y0)*s,COL[t],s))}
const box=(x,bx,by,bw,bh,e='#5a3e6a')=>{x.rect(bx,by,bw,bh,OL);x.rect(bx+1,by+1,bw-2,bh-2,e);x.rect(bx+2,by+2,bw-4,bh-4,FB)};
// 你的猫：正面坐着，眼睛跟着方块；尾巴另画，左右摆
const CAT=['.o.........o.','.oo.......oo.','.opooooooopo.','obbbbbbbbbbdo','obbbbbbbbbbdo','obbbbbbbbbbdo','obbbbbbbbbbdo','obbbbbnbbbbdo','.obbbbbbbbdo.',
  '..occcccco...','.obbbbbbbbdo.','obbbbbbbbbbdo','obbblllllbbdo','obbblllllbbdo','obblllolllbdo','.ooooooooooo.'];
const TAIL=[['...oo','..obo','.obo.','.obo.','obo..','bo...'],['.oo..','obbo.','.obo.','.obo.','obo..','bo...']];
function cat(x,g){const P=g.pal||PAL0,pal={o:P.outline,b:P.body,l:P.light,d:P.shade,c:P.collar,p:PK,n:'#e27a8f'},t=g.fr,hap=g.hap>0,cx=15,by=111,
  cy=by-(hap?Math.round(Math.abs(Math.sin(g.t*.26))*3):0),E='#241a2e';
  x.rect(cx-4,by+14,21,5,OL);x.rect(cx-3,by+14,19,4,'#c0443a');x.rect(cx-3,by+14,19,1,'#e86a54');   // 坐垫
  x.spr(TAIL[(t>>5)%2],cx+11,cy+8,pal);x.spr(CAT,cx,cy,pal);
  x.px(cx-1,cy+7,P.whisk||P.outline);x.px(cx-2,cy+6,P.whisk||P.outline);x.px(cx+13,cy+7,P.whisk||P.outline);x.px(cx+14,cy+6,P.whisk||P.outline);
  if(g.dead){x.rect(cx+2,cy+6,3,1,E);x.rect(cx+8,cy+6,3,1,E);const z=(t>>4)%3;x.text('Z',cx+14+z,cy-3-z*3,'#7ae8ff');return}
  if(hap){[[2,6],[3,5],[4,6],[8,6],[9,5],[10,6]].forEach(([a,b])=>x.px(cx+a,cy+b,E));x.px(cx+2,cy+7,PK);x.px(cx+10,cy+7,PK);x.px(cx+6,cy+8,'#e27a8f');
    for(let i=0;i<g.hn;i++){const k=(g.t*.5+i*9)%24;x.text('♥',cx+5+[0,-7,8][i]+Math.round(Math.sin((g.t+i*20)*.15)),cy-6-Math.floor(k),i%2?'#e0533d':PK)}return}
  const p=g.p,ey=p?4+Math.max(0,Math.min(2,Math.floor((p.y-HID)/6))):5,ex=p?1:0,bl=t%220<6;
  [3,9].forEach(a=>x.rect(cx+a+ex,cy+ey+(bl?1:0),1,bl?1:2,E));
  if(g.hi<HID+6&&(t>>3)%4<3){x.px(cx+13,cy+1,'#7ae8ff');x.rect(cx+12,cy+2,3,2,'#7ae8ff');x.px(cx+13,cy+4,'#3a9ec0')}}   // 堆高了：冒汗

return{n:'俄罗斯方块',en:'TETRIS',w:160,h:144,keys:'←→ 移动　↓ 软降　↑ 硬降　A 顺转　B 逆转',
init(g){g.b=Array.from({length:H},()=>Array(W).fill(0));g.q=[];bag(g);bag(g);Object.assign(g,{sc:0,lines:0,lv:1,dir:0,das:0,hap:0,hn:1,clr:null,dead:0,fr:0,pop:null,lf:null,tr:null});spawn(g)},
step(g,k){if(g.dead)return;if(g.hap>0)g.hap--;for(const f of['pop','lf','tr'])if(g[f]&&--g[f][1]<=0)g[f]=null;
  // 左右：刚按下立刻挪一格；按住 DAS 步以后每 ARR 步一格（消行动画期间照样蓄着）
  let now=0;if(k.p.L||k.p.R){g.dir=k.p.L?-1:1;g.das=0;now=1}else if(g.dir&&(g.dir<0?k.L:k.R))g.das++;else{g.dir=k.L?-1:k.R?1:0;g.das=0}
  if(g.clr){if(++g.ct>=CLR)collapse(g);return}
  const p=g.p;if(!p)return;
  if(k.p.A)rot(g,1);if(k.p.B)rot(g,-1);
  if(g.dir&&(now||g.das>=DAS&&(g.das-DAS)%ARR===0))mv(g,g.dir);
  if(k.p.U){const y=dropY(g,p);if(y>p.y){add(g,2*(y-p.y));g.tr=[SH[p.t][p.r].filter(([a,b],i,C)=>!C.some(q=>q[0]===a&&q[1]<b)).map(([a,b])=>[p.x+a,p.y+b,y+b]),6,p.t]}p.y=y;return lock(g)}
  if(k.p.D)g.fall=99;
  if(++g.fall>=(k.D?Math.min(2,spd(g.lv)):spd(g.lv))){g.fall=0;if(fits(g,p.t,p.r,p.x,p.y+1)){p.y++;g.lk=0;if(k.D)add(g,1);low(g)}}
  if(!fits(g,p.t,p.r,p.x,p.y+1)&&++g.lk>=LOCK)lock(g)},
draw(g,x){g.fr++;x.cls(BG);let hi=H;g.b.forEach((r,y)=>{if(y<hi&&r.some(v=>v))hi=y});g.hi=hi;
  for(let y=1;y<144;y+=4)x.rect(0,y,160,1,'#20172b');   // 一点扫描线的底纹
  // 场地框：四行连消时框闪金色
  const fl=g.clr&&g.clr.length>3&&(g.ct>>2)%2===0;x.rect(FX-3,FY-3,W*CS+6,126,OL);x.rect(FX-2,FY-2,W*CS+4,124,fl?GD:'#7a4e8a');x.rect(FX-2,FY-2,W*CS+4,1,fl?'#fff4b0':'#a874b4');
  x.rect(FX-1,FY-1,W*CS+2,122,OL);x.rect(FX,FY,W*CS,120,FB);
  for(let j=1;j<20;j++)for(let i=1;i<W;i++)x.px(FX+i*CS,FY+j*CS,'#241a30');
  if(g.tr)g.tr[0].forEach(([X,Y0,Y1])=>{const L=Math.round(Math.min((Y1-Math.max(Y0,HID))*CS,18)*g.tr[1]/6);if(L>0)x.rect(FX+X*CS+1,FY+(Y1-HID)*CS-L,CS-2,L,TR[g.tr[2]])});   // 硬降拖影
  // 堆着的格子；正在消的行先闪三下，再从中间往两边抹掉
  for(let y=HID;y<H;y++){const py=FY+(y-HID)*CS,cl=g.clr&&g.clr.includes(y);g.b[y].forEach((v,i)=>{if(!v)return;const px=FX+i*CS;
    if(cl){if(g.ct<18){if(g.ct/3%2<1)return x.rect(px,py,CS,CS,CR)}else if(Math.abs(2*i-9)<=g.ct-18)return}blk(x,px,py,COL[v-1])})}
  if(g.lf)g.lf[0].forEach(([X,Y,t])=>{if(Y>=HID)blk(x,FX+X*CS,FY+(Y-HID)*CS,[CR,COL[t][0],COL[t][1]])});   // 刚锁上的那块亮一下
  const p=g.p;if(p){const C=SH[p.t][p.r],c=g.dead?COL[7]:COL[p.t];
    if(!g.dead){const gy=dropY(g,p),has=(a,b)=>C.some(q=>q[0]===a&&q[1]===b),col=GH[p.t];   // 幽灵块：只描外轮廓
      if(gy>p.y)C.forEach(([a,b])=>{const Y=gy+b;if(Y<HID)return;const px=FX+(p.x+a)*CS,py=FY+(Y-HID)*CS;
        if(!has(a,b-1))x.rect(px,py,CS,1,col);if(!has(a,b+1))x.rect(px,py+CS-1,CS,1,col);if(!has(a-1,b))x.rect(px,py,1,CS,col);if(!has(a+1,b))x.rect(px+CS-1,py,1,CS,col)})}
    C.forEach(([a,b])=>{const Y=p.y+b;if(Y>=HID)blk(x,FX+(p.x+a)*CS,FY+(Y-HID)*CS,c)})}
  if(g.pop&&(g.pop[1]>40||(g.pop[1]>>2)%2)){const w=x.tw(g.pop[0]);x.rect(FX+30-(w>>1)-3,FY+41,w+6,11,OL);x.text(g.pop[0],FX+30,FY+44,g.pop[2],{al:'c'})}   // 弹字：TETRIS! / LEVEL UP
  // 右边一列：NEXT（下一块大、再后两块小），分数、行数、等级、最高分
  const RX=112,RW=44;box(x,RX,9,RW,48);x.text('NEXT',RX+RW/2,13,GD,{al:'c'});x.rect(RX+4,42,RW-8,1,'#2c2038');
  prev(x,g.q[0],RX+RW/2,30,CS);prev(x,g.q[1],RX+12,49,4);prev(x,g.q[2],RX+32,49,4);
  box(x,RX,59,RW,76);[['SCORE',ARC.pad(g.sc)],['LINES',ARC.pad(g.lines,3)],['LEVEL',ARC.pad(g.lv,2)],['HI',ARC.pad(Math.max(g.best||0,g.sc))]].forEach(([l,v],i)=>{
    const y=64+i*18,h=i===3;x.text(l,RX+5,y,h?GD:PK);x.text(v,RX+RW-5,y+7,h?GD:CR,{al:'r'})});
  // 左边空地：霓虹小招牌 + 你的猫
  const on=g.dead||(g.fr%150)>4;x.rect(6,16,29,17,OL);x.rect(7,17,27,15,'#2a1e34');
  x.text('1024',21,20,on?'#7ae8ff':'#3a6a80',{al:'c'});x.text('♥',21,26,on?PK:'#7a5060',{al:'c'});x.px(11,15,'#5a4a5a');x.px(30,15,'#5a4a5a');x.rect(11,13,1,2,'#5a4a5a');x.rect(30,13,1,2,'#5a4a5a');
  cat(x,g)},
// 开机画面的底：几列方块一格一格往下落
attract(x,t){x.cls(BG);for(let i=0;i<12;i++){const L=i%6,v=t*(9+(i*5)%7)+(i<6?0:95)+L*41,c=Math.floor(v/190),y=Math.floor(v%190/CS)*CS-30,tp=(L*3+c+(i>5?4:0))%7;
  SH[tp][(c+L)%4].forEach(([a,b])=>blk(x,4+L*26+a*CS,y+b*CS,COL[tp]))}x.dim(.55);
  x.rect(0,36,160,43,OL);x.rect(0,37,160,41,'#7a4e8a');x.rect(0,38,160,39,BG);for(let y=39;y<77;y+=4)x.rect(0,y,160,1,'#20172b')}};
})());
