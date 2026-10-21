/* 1024 猫咖 · 游戏厅的街机：贪吃蛇（SNAKE）。
   怎么玩：方向键转弯（不能直接掉头），吃小鱼干变长；撞墙或咬到自己就结束。按住 A 冲刺（走得快一倍）。
   偶尔冒出一条金鱼干，几秒就没了（最后两秒一闪一闪），+50。
   蛇是一根毛线：头是你的猫（往哪走就朝哪看），身子一节粉一节奶白、带斜纹，尾巴尖拖一根线头。
   取舍：20×16 格、一格 8 像素，顶上 16 像素是 HUD。按步数走：开始 9 步一格，每长 5 节快一步，最快 4 步一格。
   转向有缓冲（最多攒两个）：一格之内连按"上、左"两下都算，跟上一个相反或相同的那下不收。尾巴这一步要挪走的那格不算撞。 */
ARC.def('snake',(()=>{
const W=160,H=144,CS=8,GW=20,GH=16,TOP=16,OL='#3a2630',DIR={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0]},OPP={U:'D',D:'U',L:'R',R:'L'};
const DEF={body:'#fff3e0',light:'#ffffff',shade:'#e8d2c0',outline:'#5a3a4a'};
// 猫头（10×9，比一格大一圈，压在格子外沿上）：下 = 正脸，上 = 后脑勺，右 = 脸朝右（左就翻过来）；E 是眼睛上半，眨眼时抹掉
const HEAD={D:['oo......oo','opoooooopo','obbbbbbbbo','obbEbbEbbo','obbebbebbo','olbbnnbblo','obbbbbbbbo','.occcccco.','..oooooo..'],
  U:['oo......oo','opoooooopo','obbbbbbbbo','obbdbbdbbo','obbbbbbbbo','obbbbbbbbo','obbbbbbbbo','.occcccco.','..oooooo..'],
  R:['oo......oo','opoooooopo','obbbbbbbbo','obbbEbbEbo','obbbebbebo','olbbbbbbno','obbbbbbbbo','.occcccco.','..oooooo..']};
const SEG=['b...b.','...b..','..b...','.b...b','b...b.','...b..'];   // 毛线的斜纹
const YARN=[['#f4a6b8','#c8607e'],['#fff4dc','#e89aae']];
const FISH=['..ddd...','.dllbd.d','debbbbdd','.dbbbd.d','..ddd...'],FP={d:'#8a5a2a',b:'#d8a060',l:'#f4d4a0',e:OL},GP={d:'#b07a10',b:'#ffd84a',l:'#fff4b0',e:OL};
const add=(g,n)=>{g.sc+=n;g.score(n)};
const speed=g=>Math.max(4,9-Math.floor((g.sn.length-4)/5));
function spot(g){const S=new Set(g.sn.map(s=>s.y*GW+s.x));for(const f of [g.food,g.gold])if(f)S.add(f.y*GW+f.x);const L=[];for(let i=0;i<GW*GH;i++)if(!S.has(i))L.push(i);
  if(!L.length)return null;const i=L[g.ri(0,L.length-1)];return{x:i%GW,y:Math.floor(i/GW)}}
/* ---------- 画 ---------- */
function field(x,oy){x.cls('#191230');for(let j=oy;j<H;j+=CS)for(let i=((j-oy)/CS&1)*CS;i<W;i+=CS*2)x.rect(i,j,CS,CS,'#1e1638')}
// 一整条：先描边层，再底色（每节往相邻那节伸 1 像素，连成一根），再斜纹，最后猫头
function snake(x,sn,dir,pal,oy,blink){const n=sn.length,at=s=>[s.x*CS,oy+s.y*CS];
  for(let i=1;i<n;i++){const [px,py]=at(sn[i]);x.rect(px+1,py,6,8,OL);x.rect(px,py+1,8,6,OL)}
  for(let i=1;i<n;i++){const s=sn[i],[px,py]=at(s),c=YARN[i&1];x.rect(px+1,py+1,6,6,c[0]);
    for(const o of [sn[i-1],sn[i+1]])if(o){const dx=o.x-s.x,dy=o.y-s.y;if(dx)x.rect(dx>0?px+7:px,py+1,1,6,c[0]);if(dy)x.rect(px+1,dy>0?py+7:py,6,1,c[0])}
    x.spr(SEG,px+1,py+1,{b:c[1]})}
  // 线头：从尾巴尖往外拐出去两三个像素
  if(n>1){const t=sn[n-1],q=sn[n-2],dx=t.x-q.x,dy=t.y-q.y,[px,py]=at(t),cx=px+3.5+dx*4,cy=py+3.5+dy*4,c=YARN[(n-1)&1][1];
    x.px(cx+dx*.5+dy*.5,cy+dy*.5+dx*.5,c);x.px(cx+dx*1.5+dy*1.5,cy+dy*1.5+dx*1.5,c);x.px(cx+dx*2.5+dy*.5,cy+dy*2.5+dx*.5,c)}
  const p=pal||DEF,h=sn[0],[hx,hy]=at(h);
  x.spr(HEAD[dir==='L'?'R':dir],hx-1,hy-1,{o:p.outline||OL,b:p.body,l:p.light||p.body,d:p.shade||p.body,c:p.collar||'#e0533d',p:'#f4a6b8',n:'#e27a8f',e:'#241a2e',E:blink?p.body:'#241a2e'},dir==='L')}
function fish(x,f,P,oy){x.spr(FISH,f.x*CS,oy+f.y*CS+2,P)}
// 开机画面：一条蛇（头是你的猫）沿着外圈一直绕
const LOOP=(()=>{const L=[];for(let i=1;i<18;i++)L.push({x:i,y:2});for(let j=2;j<16;j++)L.push({x:18,y:j});for(let i=18;i>1;i--)L.push({x:i,y:16});for(let j=16;j>2;j--)L.push({x:1,y:j});return L})();
return{n:'贪吃蛇',en:'SNAKE',w:W,h:H,keys:'方向键 转弯　按住 A 冲刺',
  init(g){g.sc=0;g.sn=[{x:6,y:8},{x:5,y:8},{x:4,y:8},{x:3,y:8}];g.dir='R';g.q=[];g.mt=0;g.grow=0;g.ate=0;g.gold=null;g.dead=0;g.pop=[];g.food=spot(g)},
  step(g,k){g.pop=g.pop.filter(p=>(p.y-=.25,--p.l>0));
    if(g.dead){if(++g.dead===50)g.over();return}
    for(const d of 'UDLR')if(k.p[d]){const last=g.q.length?g.q[g.q.length-1]:g.dir;if(g.q.length<2&&d!==last&&d!==OPP[last])g.q.push(d)}
    if(g.gold&&--g.gold.l<=0)g.gold=null;
    const iv=speed(g);if(++g.mt<(k.A?Math.max(2,iv>>1):iv))return;g.mt=0;
    if(g.q.length)g.dir=g.q.shift();
    const [dx,dy]=DIR[g.dir],nx=g.sn[0].x+dx,ny=g.sn[0].y+dy,eatF=g.food&&nx===g.food.x&&ny===g.food.y,eatG=g.gold&&nx===g.gold.x&&ny===g.gold.y,keep=g.grow>0||eatF||eatG;
    if(nx<0||ny<0||nx>=GW||ny>=GH||g.sn.some((s,i)=>s.x===nx&&s.y===ny&&(keep||i<g.sn.length-1))){g.dead=1;g.sfx('die');return}
    g.sn.unshift({x:nx,y:ny});
    if(eatF){g.grow++;g.ate++;add(g,10);g.sfx('eat');g.food=spot(g);if(!g.gold&&g.ate>2&&g.ri(1,4)===1){g.gold=spot(g);if(g.gold)g.gold.l=360}}
    if(eatG){g.grow++;add(g,50);g.sfx('up');g.pop.push({x:nx*CS+4,y:TOP+ny*CS-6,s:'+50',l:40});g.gold=null}
    if(g.grow>0)g.grow--;else g.sn.pop();
    if(!g.food&&!g.gold)g.over()},   // 满屏了：没地方放鱼干，算你赢
  draw(g,x){field(x,TOP);
    if(g.food)fish(x,g.food,FP,TOP);
    const G=g.gold;if(G&&(G.l>120||(G.l>>3)&1)){fish(x,G,GP,TOP);const s=(g.t>>3)&3;x.px(G.x*CS+[7,6,0,1][s],TOP+G.y*CS+[0,1,7,6][s],'#fff4dc')}
    if(!g.dead||g.dead>40||(g.dead>>2)&1)snake(x,g.sn,g.dir,g.pal,TOP,!g.dead&&g.t%200>193);
    g.pop.forEach(p=>x.text(p.s,p.x,p.y,'#ffd84a',{al:'c',sh:OL}));
    // HUD：分数（大字）、金鱼干还剩多久、最高分、长度
    x.rect(0,0,W,TOP,'#0a0612');x.rect(0,TOP-1,W,1,'#f4a6b8');x.text(ARC.pad(g.sc),4,3,'#fff4dc',{k:2});
    if(G){x.spr(FISH,62,5,GP);x.rect(73,7,Math.ceil(G.l/360*36),2,G.l>120||(G.l>>3)&1?'#ffd84a':'#c89a1e')}
    x.text('HI '+ARC.pad(Math.max(g.best||0,g.sc)),W-4,2,'#ffd84a',{al:'r'});x.text('LEN '+g.sn.length,W-4,8,'#7ee08a',{al:'r'})},
  attract(x,t,m){field(x,0);const L=LOOP.length,h=Math.floor(t*7)%L,sn=[];for(let i=0;i<13;i++)sn.push(LOOP[(h-i+L)%L]);
    const a=sn[1],b=sn[0],d=b.x>a.x?'R':b.x<a.x?'L':b.y>a.y?'D':'U';fish(x,{x:14,y:11},FP,0);snake(x,sn,d,m&&m.pal||DEF,0,false)}}})());
