/* 1024 猫咖 · 抓娃娃机的特写画面（玩法在 world-games.js，挂在 world4-vista.js 的"看风景"那一套上）。依赖 scene-kit.js、world-play.js 的 PAL。
   和看风景一样的画法：一个像素一格、深色描边、不放大。整张画在画面大小（w×h，大约 480×270）上：
   中间是机器的玻璃柜（底下一堆玩偶，顶上吊着爪子，左边是出口），下面是操作台（摇杆、按钮、取物口），你的猫的爪子搭在摇杆上。
   不动的部分（墙、机器外壳）按画面大小画一次存起来。 */
const CLAW_GEO=(w,h)=>{const x0=Math.round(w*.2),x1=Math.round(w*.8),top=Math.round(h*.16),floor=Math.round(h*.7);return{x0,x1,top,floor,pad:16,chute:Math.round(x0+(x1-x0)*.13),panel:floor+12}};
const CLAW_BG={};
function clawBack(w,h){const G=CLAW_GEO(w,h);
  // 墙：深紫，竖着几条霓虹灯带
  R(0,0,w,h,'#1e1628');for(let j=0;j<h;j+=2)for(let i=(j/2)%2;i<w;i+=2)if(hsh(i,j)<.08)P1(i,j,'#2a2036');
  [[.06,'#f4a6b8'],[.94,'#6ac8ff']].forEach(([k,c])=>{const x=Math.round(w*k);R(x-1,0,3,h,'#2a2036');R(x,0,1,h,c)});
  // 机器外壳：粉色，两边立柱带灯
  R(G.x0-14,G.top-34,G.x1-G.x0+28,h-G.top+34,OL);R(G.x0-13,G.top-33,G.x1-G.x0+26,h-G.top+33,'#e86a9a');R(G.x0-13,G.top-33,G.x1-G.x0+26,2,'#f8a8c8');
  R(G.x0-13,G.top-33,4,h,'#c84a7a');R(G.x1+9,G.top-33,4,h,'#c84a7a');
  // 招牌
  R(G.x0+20,G.top-30,G.x1-G.x0-40,20,OL);R(G.x0+21,G.top-29,G.x1-G.x0-42,18,'#9B7EBD');R(G.x0+21,G.top-29,G.x1-G.x0-42,2,'#d0bce4');
  const s='CATCH',tw=txtW(s)*2,sx=Math.round((G.x0+G.x1)/2-tw/2);txt(s,sx+1,G.top-25,OL,2);txt(s,sx,G.top-26,'#fff4dc',2);
  // 玻璃柜里：后墙
  R(G.x0-2,G.top-2,G.x1-G.x0+4,G.floor-G.top+16,OL);for(let j=G.top;j<G.floor+14;j++){const k=(j-G.top)/(G.floor-G.top);R(G.x0,j,G.x1-G.x0,1,k<.5?'#4a2e5e':'#5a3a6a')}
  for(let n=0;n<40;n++){const x=G.x0+4+Math.floor(hsh(n,701)*(G.x1-G.x0-8)),y=G.top+6+Math.floor(hsh(n,702)*(G.floor-G.top-30));P1(x,y,n%3?'#7a5a8a':'#c8a0d8');if(n%7===0){P1(x-1,y,'#7a5a8a');P1(x+1,y,'#7a5a8a')}}
  // 横梁、出口
  R(G.x0,G.top,G.x1-G.x0,5,'#c8c4d8');R(G.x0,G.top+4,G.x1-G.x0,1,'#8a8496');R(G.x0,G.top,G.x1-G.x0,1,'#ffffff');
  R(G.chute,G.floor-24,3,38,OL);R(G.chute+1,G.floor-23,1,36,'#cfe8f8');alpha(.25,()=>R(G.x0,G.floor-24,G.chute-G.x0,38,'#cfe8f8'));R(G.x0,G.floor+12,G.chute-G.x0,2,'#241a2e');
  // 地面：一层软垫
  R(G.chute+3,G.floor,G.x1-G.chute-3,14,'#3a2a4a');for(let i=G.chute+4;i<G.x1;i+=6)R(i,G.floor+2,3,1,'#5a4a6a');
  // 操作台
  const py=G.panel;R(G.x0-14,py,G.x1-G.x0+28,h-py,OL);R(G.x0-13,py+1,G.x1-G.x0+26,h-py,'#c84a7a');R(G.x0-13,py+1,G.x1-G.x0+26,2,'#f8a8c8');
  // 取物口
  R(G.x0+2,py+10,46,24,OL);R(G.x0+3,py+11,44,22,'#241a2e');R(G.x0+3,py+11,44,3,'#3a2a3e');txt('GIFT',G.x0+9,py+36,'#fff4dc');
  // 按钮座
  const bx=G.x1-40;disc(bx,py+20,12,7,OL);disc(bx,py+19,11,6,'#9B7EBD')}
// 玩偶：(x,y) 底边中点。小尺寸的像素猫头 / 小鱼 / 毛线球 / 小老鼠 / 金色小鱼干
function clawPrize(p,x,y,t){x=Math.round(x);y=Math.round(y);
  if(p.pal){const c=PAL[p.pal],ear=c.points||c.body,face=c.light||c.body;
    disc(x,y-8,10,8,OL);disc(x,y-8,9,7,c.body);grid(x-9,y-19,["oo..............oo","oeo............oeo","oeeo..........oeeo"],{o:OL,e:ear,'.':null});
    if(c.points)disc(x,y-7,6,4,c.points);if(c.stripe){for(const dx of [-3,0,3])R(x+dx,y-15,1,3,c.stripe)}if(c.spot)disc(x+5,y-11,2,2,c.spot);
    disc(x,y-5,5,3,face);R(x-4,y-9,2,2,'#241a2e');R(x+3,y-9,2,2,'#241a2e');P1(x-4,y-9,'#ffffff');P1(x+3,y-9,'#ffffff');P1(x,y-6,'#f4a6b8');R(x-1,y-5,3,1,OL);
    R(x-8,y-1,16,1,c.collar||'#e0533d');return}
  if(p.k==='fish'||p.k==='gold'){const b=p.k==='gold'?'#ffd84a':'#5B9BD5',d=p.k==='gold'?'#c89a1e':'#34618f',l=p.k==='gold'?'#fff4b0':'#a8d0f0';
    grid(x-10,y-11,["....ooooooo.....oo","..oobbbbbbboo..obo",".obblbbbbbbbbo.obo","obbeobbbbbdbbbobbo","obbbbbbbbdbbbbbbo.",".obbbbbbbbbbbbo.o.","..oodddddddoo..obo","....ooooooo.....oo"],{o:OL,b,d,l,e:'#241a2e','.':null});
    if(p.k==='gold'&&Math.floor(t*3)%2){spark(x+6,y-12,t);spark(x-8,y-2,t+.5)}return}
  if(p.k==='yarn'){yarnBall(x,y-7,7,0,Math.floor(t*2));return}
  if(p.k==='mouse')grid(x-9,y-10,["......ooo.........",".....oppo..........","..ooooooooo.......",".obbbbbbbbbo......","obebbbbbbbbbo..ooo","obbbbbbbbbbbbooo..",".oooooooooooo....."],{o:OL,b:'#b8b4c0',p:'#f4a6b8',e:'#241a2e','.':null})}
function drawClawVista(E,pile,PRIZES){const {w,h,t,V,pal}=E,G=CLAW_GEO(w,h),c=V.cl||{x:.5,cy:0,shut:0},span=G.x1-G.x0-G.pad*2,X=k=>G.x0+G.pad+k*span;
  const key=w+'x'+h;if(!CLAW_BG[key]){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const o=C;use(cv.getContext('2d'));clawBack(w,h);use(o);CLAW_BG[key]=cv}
  C.drawImage(CLAW_BG[key],0,0);
  // 两边立柱上的灯，一颗颗跑
  for(let j=G.top-28;j<h-6;j+=10){const on=Math.floor(t*6+j/10)%3===0;P1(G.x0-11,j,on?'#ffd84a':'#8a2a54');P1(G.x1+11,j,on?'#ffd84a':'#8a2a54')}
  // 玩偶：先画底下一排，再画上面一排；刚补进来的从上面掉下来
  pile.slice().sort((a,b)=>a.row-b.row).forEach(q=>{let y=G.floor+10-(q.row?18:0);if(q.fall){const k=Math.min(1,(t-q.fall)/.5);y=G.top+30+(y-G.top-30)*k*k}clawPrize(q.p,X(q.x),y,t)});
  // 爪子：横梁上的小车、绳子、三根爪
  const cx=Math.round(X(c.x)),cy=Math.round(G.top+18+(c.cy||0)*(G.floor-G.top-40)),open=1-(c.shut||0);
  R(cx-8,G.top-1,17,7,OL);R(cx-7,G.top,15,5,'#e8e4f0');R(cx-7,G.top+4,15,1,'#a8a4b0');R(cx,G.top+6,1,cy-G.top-6,'#d8d4e0');
  R(cx-5,cy,11,5,OL);R(cx-4,cy+1,9,3,'#b8b4c8');R(cx-4,cy+1,9,1,'#e8e4f0');
  const sp=Math.round(2+open*6);[[-1,0],[1,0],[0,1]].forEach(([s,mid])=>{if(mid){R(cx,cy+5,1,10,OL);P1(cx,cy+15,'#d8d4e0');return}const x2=cx+s*sp;line(cx+s*3,cy+5,x2,cy+11,OL);line(x2,cy+11,x2-s*Math.round(2-open),cy+16,OL);P1(x2,cy+11,'#d8d4e0')});
  if(c.hold)clawPrize(c.hold.p,cx,cy+28,t);
  // 玻璃反光
  alpha(.18,()=>{for(let i=0;i<3;i++)line(G.x1-60+i*7,G.top+8,G.x1-20+i*7,G.top+48,'#ffffff')});
  // 刚抓到的那一个：在取物口里蹦一下
  const L=c.last;if(L&&t-L.t0<2.4){const k=t-L.t0,b=Math.round(Math.abs(Math.sin(k*6))*Math.max(0,6-k*4));clawPrize(L.p,G.x0+25,G.panel+32-b,t);if(Math.floor(t*4)%2){spark(G.x0+10,G.panel+14,t);spark(G.x0+42,G.panel+12,t+.3)}
    if(k<1.6){const s='GET!',tw=txtW(s)*2;txt(s,Math.round((G.x0+G.x1)/2-tw/2)+1,G.top+31,OL,2);txt(s,Math.round((G.x0+G.x1)/2-tw/2),G.top+30,'#ffd84a',2)}}
  // 按钮（落下去的时候亮）和摇杆；你的猫的爪子搭在摇杆上
  const bx=G.x1-40,by=G.panel+16,lit=c.ph&&c.ph!=='move';disc(bx,by,8,5,OL);disc(bx,by-1,7,4,lit?'#ff6a5a':'#e0533d');disc(bx-2,by-2,2,1,lit?'#ffd0c8':'#ff9a8a');
  const jx=Math.round((G.x0+G.x1)/2),jy=G.panel+26,tilt=c.L&&!c.R?-4:c.R&&!c.L?4:c.tx!=null&&Math.abs(c.tx-c.x)>.01?Math.sign(c.tx-c.x)*3:0;
  disc(jx,jy+4,9,4,OL);disc(jx,jy+3,8,3,'#3a2a3e');line(jx,jy+2,jx+tilt,jy-12,OL);line(jx+1,jy+2,jx+tilt+1,jy-12,OL);disc(jx+tilt,jy-15,5,5,OL);disc(jx+tilt,jy-15,4,4,'#e0533d');P1(jx+tilt-2,jy-17,'#ff9a8a');
  // 你的猫的爪子：胳膊从画面下边伸上来，圆圆的一团搭在摇杆球旁边，四颗粉肉垫
  const pc=PAL[pal]||PAL[0],ol=pc.outline||OL,lt=pc.light||pc.body,px=jx+tilt+3,py=jy-14;
  R(px-1,py+4,16,h-py-4,ol);R(px,py+5,14,h-py-5,pc.body);R(px,py+5,3,h-py-5,lt);if(pc.stripe){R(px+3,py+14,10,2,pc.stripe);R(px+4,py+22,9,2,pc.stripe)}if(pc.spot)disc(px+9,py+18,3,2,pc.spot);
  disc(px+7,py+3,8,6,ol);disc(px+7,py+3,7,5,pc.body);disc(px+5,py+2,4,3,lt);[[2,0],[6,-2],[10,-2],[13,0]].forEach(([a,b])=>disc(px+a,py+b,1,1,'#f4a6b8'))}
