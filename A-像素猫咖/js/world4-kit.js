/* 1024 猫咖 · 场景 v4 新零件。依赖 scene-kit.js（R、P1、box、disc、txt、grid、OL、YARN…）和 world-kit.js（hsh…）。
   图书馆（长期记忆）：书墙、高书架、滚梯、检索柜、阅读桌、扶手椅、说明书讲台、窗边软座；后院和河边：许愿池、石桌象棋、长椅、路标、邮筒、小门；
   工坊的工具墙、合并门禁，门厅的星星罐子、迎宾立牌和前台（桌子 + 服务铃）；还有 E 键帽、往下指的箭头、梦泡泡。新地图的零件在 house-kit.js、outdoor-kit.js。
   写法同前：(x,y) 是左上角，注释里的 base 是和猫一起排序用的底边 y。 */

/* ---------- 图书馆 ---------- */
function libWall(x,y,w,h){R(x,y,w,h,'#5c4436');for(let i=x+4;i<x+w-6;i+=24){R(i,y+6,20,h-18,'#664c3c');R(i,y+6,20,1,'#7a5c48');R(i,y+h-13,20,1,'#4a3428')}
  R(x,y,w,2,'#3a2620');R(x,y+h-8,w,8,'#4a3428');R(x,y+h-8,w,1,'#7a5c48');R(x,y+h-1,w,1,'#2e1e18')}
// 地板：深色人字拼
function floorParquet(x,y,w,h){R(x,y,w,h,'#7a5038');for(let j=0;j<h;j+=4)for(let i=((j/4)%2)*4;i<w;i+=8){R(x+i,y+j,7,3,hsh(x+i,y+j)<.5?'#845a40':'#6e4630');P1(x+i,y+j,'#946a4c')}}
// 高书架：四层，顶上一块铜牌写着这一架是什么（英文像素字）；cols 是这一架书的主色
const SHELF_COLS=[['#e8b83a','#c9955e','#fff0a8','#9a7414'],['#e0533d','#9e2f2a','#f7a58c','#c46a5a'],['#5B9BD5','#34618f','#a8d0f0','#4a7fd0'],['#f4a6b8','#c46a82','#fbe2bc','#e88aa0'],['#7ee08a','#5B8C5A','#9ccc98','#35593a']];
function tallShelf(x,y,w,h,cols,label){box(x,y,w,h,'#7a4c36','#2e1e18');R(x+1,y+1,w-2,1,'#9a6448');
  const tw=txtW(label),px=x+Math.floor((w-tw)/2);R(px-2,y+2,tw+4,7,'#2e1e18');txt(label,px,y+3,'#e8c874');
  const tiers=4,th=Math.floor((h-12)/tiers);
  for(let s=0;s<tiers;s++){const sy=y+10+s*th;R(x+2,sy,w-4,th-2,'#3e281e');let bx=x+3,i=0;
    while(bx<x+w-4){const bw=2+Math.floor(hsh(bx,sy)*2),bh=th-5-Math.floor(hsh(sy,bx)*3),col=hsh(bx+i,sy)<.72?cols[Math.floor(hsh(i,sy+s)*cols.length)]:['#fff4dc','#b9a8c9','#8a5a3a'][i%3];
      const ww=Math.min(bw,x+w-3-bx);if(hsh(bx,sy+1)<.1){R(bx,sy+th-2-bh+1,ww+1,bh-1,col);bx+=ww+2}else{R(bx,sy+th-2-bh,ww,bh,col);P1(bx,sy+th-2-bh+1,'#ffffff');bx+=ww}i++}
    R(x+1,sy+th-2,w-2,2,'#8a5a3a')}}   // base=y+h
// 抽走一本书留下的空位（画在书架上）
function bookGap(x,y){R(x,y,3,8,'#2a1a14')}
// 滚梯：挂在书架前面，能左右滑
function ladder(x,y0,y1){for(let y=y0;y<=y1;y++){P1(x-5,y,OL);P1(x-4,y,'#c98d5c');P1(x+4,y,OL);P1(x+5,y,'#c98d5c')}
  for(let y=y0+5;y<y1-2;y+=6){R(x-4,y,9,1,'#e0a878');R(x-4,y+1,9,1,'#8a5a3a')}R(x-6,y0-1,3,2,OL);R(x+4,y0-1,3,2,OL);R(x-6,y1,3,2,OL);R(x+4,y1,3,2,OL)}   // base=y1+2
// 一本书（飞下来 / 叼着）
function book(x,y,ci=0){R(x,y,6,4,OL);R(x+1,y,4,3,YARN[ci%5][0]);R(x+1,y+3,4,1,'#fff4dc')}
// 检索柜：一格格小抽屉，铜把手；open>0 时中间那格拉出来，露出卡片
function cardCatalog(x,y,t,open=0){R(x+1,y-8,26,7,'#2e1e18');txt('RECALL',x+3,y-7,'#e8c874');
  box(x,y,28,30,'#a86e44','#2e1e18');R(x+1,y+1,26,2,'#c98d5c');
  for(let j=0;j<4;j++)for(let i=0;i<3;i++){const dx=x+2+i*8,dy=y+4+j*6;box(dx,dy,8,6,'#c98d5c','#6e4430');R(dx+3,dy+2,2,2,'#e8b83a')}
  if(open>0){const dx=x+10,dy=y+14,k=Math.min(1,open);R(dx-1,dy+6,10,Math.round(4*k)+1,'#2e1e18');R(dx,dy+6,8,Math.round(4*k),'#e0a878');for(let i=0;i<3;i++)R(dx+1+i*2,dy+4,1,3,'#fff8e8')}
  R(x+2,y+30,3,2,OL);R(x+23,y+30,3,2,OL)}   // base=y+32
// 阅读桌：摊开的书、绿罩台灯
function openBook(x,y){R(x,y,15,5,OL);R(x+1,y+1,6,3,'#fff8e8');R(x+8,y+1,6,3,'#f4ecd8');for(let j=0;j<2;j++){R(x+2,y+1+j*2,4,1,'#c8b8a8');R(x+9,y+1+j*2,4,1,'#c8b8a8')}P1(x+7,y+1,'#8a7a6a')}
function bankerLamp(x,y,on){R(x+4,y+4,1,5,OL);R(x+2,y+9,5,1,OL);R(x,y,9,4,OL);R(x+1,y+1,7,2,'#3a8a5a');P1(x+2,y+1,'#7ee08a');if(on)R(x+1,y+4,7,1,'#ffe08a')}
function readTable(x,y,w,on){R(x,y,w,9,OL);R(x+1,y+1,w-2,5,'#8a5a3a');R(x+1,y+1,w-2,1,'#a8703f');R(x+1,y+6,w-2,2,'#5c3a28');R(x+4,y+9,3,19,OL);R(x+w-7,y+9,3,19,OL);
  openBook(x+8,y);bankerLamp(x+Math.floor(w/2)-4,y-8,on);openBook(x+w-24,y+1);R(x+w-40,y+1,6,3,'#5B9BD5');R(x+w-40,y-1,6,2,'#e0533d')}   // base=y+28
// 扶手椅
function armchair(x,y){const a='#b85a4a',d='#8a3a32',l='#d8806c';box(x+3,y,24,14,a);R(x+5,y+2,20,2,l);box(x,y+7,7,15,d);R(x+1,y+8,5,1,l);box(x+23,y+7,7,15,d);R(x+24,y+8,5,1,l);
  box(x+6,y+12,18,9,a);R(x+7,y+13,16,1,l);R(x+2,y+22,3,4,OL);R(x+25,y+22,3,4,OL)}   // base=y+26
// 说明书讲台：斜面上摊着一本大书，红色书签
function lectern(x,y){R(x+8,y+9,4,16,OL);R(x+9,y+9,2,16,'#8a5a3a');R(x+3,y+24,14,3,OL);R(x+4,y+24,12,1,'#8a5a3a');box(x,y+3,20,8,'#a86e44','#2e1e18');
  R(x+1,y,18,7,OL);R(x+2,y+1,7,5,'#fff8e8');R(x+11,y+1,7,5,'#f4ecd8');P1(x+10,y+1,'#b9a8c9');for(let j=0;j<3;j++){R(x+3,y+2+j,5,1,j===1?'#e8b83a':'#c8b8a8');R(x+12,y+2+j,5,1,'#c8b8a8')}R(x+15,y-2,2,6,'#e0533d')}   // base=y+27
// 窗边软座
function windowSeat(x,y,w){box(x,y,w,10,'#6e4430','#2e1e18');box(x+1,y-3,w-2,6,'#9B7EBD','#4a3a5c');R(x+2,y-2,w-4,1,'#d0bce4');disc(x+7,y-4,4,3,'#f4a6b8');disc(x+w-8,y-4,4,3,'#a8d0f0')}   // base=y+10
// 梦泡泡：几个小圆点 + 一朵云，云里画一个小东西
function dreamBubble(x,y,t,icon=0){const k=Math.floor(t*1.5)%3;P1(x,y,'#fff4dc');if(k>0)R(x+2,y-3,2,2,'#fff4dc');if(k>1){disc(x+8,y-9,7,4,OL);disc(x+8,y-9,6,3,'#fff8e8');
  const ix=x+5,iy=y-11;if(icon===0)yarnBall(ix+3,iy+2,2,Math.floor(t)%5);else if(icon===1){R(ix,iy+1,5,2,'#f0a352');P1(ix+5,iy,'#f0a352');P1(ix+5,iy+3,'#f0a352')}else if(icon===2){R(ix,iy,7,4,OL);R(ix+1,iy+1,5,2,'#8fc8f0')}else{P1(ix+1,iy,'#e0533d');P1(ix+3,iy,'#e0533d');R(ix,iy+1,5,1,'#e0533d');R(ix+1,iy+2,3,1,'#e0533d');P1(ix+2,iy+3,'#e0533d')}}}

/* ---------- 后院、河边 ---------- */
function pond(cx,cy,t,tod){disc(cx,cy,36,15,'#8a8278');disc(cx,cy,35,14,'#cfc6b8');disc(cx,cy+1,32,11,'#3e6e8e');disc(cx,cy+2,30,9,'#4f86a8');
  if(tod==='night'){[[-18,-2],[6,3],[20,-3],[-6,6],[26,4]].forEach(([a,b],i)=>{if((Math.floor(t*2)+i)%4)P1(cx+a,cy+2+b,'#fff4dc')});disc(cx+12,cy+1,2,1,'#fff4dc')}
  else{R(cx-20,cy-2,8,1,'#8fc8f0');R(cx+6,cy+5,6,1,'#8fc8f0')}
  for(let i=0;i<2;i++){const a=t*(.5+i*.3)+i*3,fx=Math.round(cx+Math.cos(a)*(20-i*7)),fy=Math.round(cy+2+Math.sin(a)*(6-i*2)),d=-Math.sin(a)>0?1:-1;R(fx-2,fy,5,1,i?'#fff4dc':'#f0a352');P1(fx+(d>0?-3:3),fy,i?'#e0533d':'#f0a352');P1(fx+(d>0?2:-2),fy,OL)}
  [[-15,5],[17,-1]].forEach(([a,b])=>{disc(cx+a,cy+2+b,3,2,'#5B8C5A');P1(cx+a+1,cy+1+b,'#88c070')});P1(cx+18,cy,'#f4a6b8');P1(cx+17,cy,'#fbe2bc')}
// 投进池子的星星溅起的涟漪
function ripple(cx,cy,k){const r=Math.round(2+k*10);for(let i=0;i<16;i++){const a=i/16*Math.PI*2;if(i%2)P1(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r*.4),'#dff0ff')}}
// 石桌象棋：g={pieces:[{x,y,side}]}
function stoneTable(x,y,pieces){R(x+7,y+8,6,9,'#8a8278');R(x+8,y+8,4,9,'#b4aa9a');R(x+4,y+16,12,2,'#6a625a');disc(x+10,y+4,11,5,'#6a625a');disc(x+10,y+3,10,4,'#cfc6b8');
  for(let i=-6;i<=6;i+=3)R(x+10+i,y+1,1,5,'#9a8a7a');R(x+2,y+3,17,1,'#9a8a7a');(pieces||[]).forEach(p=>{R(x+10+p.x,y+1+p.y,2,2,p.side?'#e0533d':'#241a2e');P1(x+10+p.x,y+1+p.y,p.side?'#f7a58c':'#5e5668')})}   // base=y+18
function stool(x,y){R(x+2,y+2,6,6,'#8a8278');R(x+3,y+2,4,6,'#b4aa9a');disc(x+5,y+1,5,2,'#6a625a');disc(x+5,y,5,2,'#cfc6b8')}   // base=y+8
function bench(x,y,w){R(x,y,w,3,OL);R(x+1,y+1,w-2,1,'#c98d5c');R(x,y+6,w,4,OL);R(x+1,y+7,w-2,2,'#c98d5c');R(x+1,y+7,w-2,1,'#e0a878');R(x+2,y+3,2,3,OL);R(x+w-4,y+3,2,3,OL);R(x+2,y+10,2,5,OL);R(x+w-4,y+10,2,5,OL)}   // base=y+15
// 路标：三块木牌，指向猫咖外面（官网、GitHub、内源主页）；柱子顶上一对猫耳朵
function signpost(x,y,t,hl=-1){R(x,y+4,3,40,OL);R(x+1,y+4,1,40,'#a86e44');R(x-1,y+2,5,3,OL);P1(x-1,y+1,OL);P1(x+3,y+1,OL);
  const plank=(py,label,col,dir,i)=>{const w=txtW(label)+9,px=dir>0?x-3:x+6-w,c=hl===i&&Math.floor(t*4)%2?'#fff4dc':col;R(px,py,w,9,OL);R(px+1,py+1,w-2,7,c);R(px+1,py+7,w-2,1,'#00000022');
    const tx=dir>0?px+w:px-1;for(let k=0;k<4;k++)R(tx+(dir>0?k:-k),py+1+k,1,7-2*k,OL);for(let k=0;k<3;k++)R(tx+(dir>0?k:-k),py+2+k,1,5-2*k,c);txt(label,px+(dir>0?3:6),py+2,'#3a2630')};
  plank(y+7,'GITHUB','#e8dccb',1,0);plank(y+18,'SITE','#f4d06a',-1,1);plank(y+29,'INNER','#a8d0f0',1,2)}   // base=y+44
function mailbox(x,y,t,flag=0){R(x+5,y+12,3,22,OL);R(x+6,y+12,1,22,'#6e4430');R(x,y+2,14,11,OL);R(x+1,y,12,3,OL);R(x+1,y+1,12,11,'#e0533d');R(x+2,y+1,10,2,'#f7a58c');R(x+3,y+6,8,2,OL);R(x+4,y+6,6,1,'#3a2630');
  const up=flag>0;R(x+14,y+(up?1:6),1,up?7:3,OL);R(x+15,y+(up?1:6),4,3,'#ffd84a')}   // base=y+34
// 小门：比篱笆高一截，深色木头，顶上一道拱，中间一个黄铜门闩（门外是人类的世界，推不开）
function gardenGate(x,y,w){R(x,y+5,w,2,'#5c3a28');R(x,y+12,w,2,'#5c3a28');for(let i=x+1;i<x+w-3;i+=5){R(i,y-1,4,19,OL);R(i+1,y,2,17,'#b88858');P1(i+1,y-1,OL)}
  R(x-4,y-8,5,27,OL);R(x-3,y-7,3,25,'#8a5a3a');R(x+w-1,y-8,5,27,OL);R(x+w,y-7,3,25,'#8a5a3a');
  for(let i=0;i<=w;i++){const a=Math.round(Math.sin(i/w*Math.PI)*5);R(x-1+i,y-9-a,1,3,OL);P1(x-1+i,y-8-a,'#a86e44')}R(x+Math.floor(w/2)-2,y+7,5,4,OL);R(x+Math.floor(w/2)-1,y+8,3,2,'#ffd84a')}
// 小径两旁的灯柱
function lampPost(x,y,on){R(x+2,y+6,2,30,OL);R(x,y+34,6,2,OL);R(x-1,y,8,7,OL);R(x,y+1,6,5,on?'#ffe08a':'#efdcb8');R(x+1,y-1,4,1,OL)}   // base=y+36

/* ---------- 工坊：工具墙、合并门禁；门厅：星星罐子、迎宾立牌 ---------- */
const TOOLS_PX={
  wrench:[" oo  ","o..o ","o..oo"," oo.o","  o.o","  o.o","  ooo"],glass:[" ooo ","o...o","o...o"," ooo ","   oo","    o"],
  globe:[" ooo ","obgbo","oggbo","obbgo"," ooo "],cam:[" oo  ","ooooo","o.o.o","ooooo"],brush:["   oo","  ooo"," ooo "," oo  ","oo   ","o    "],
  term:["oooooo","o>...o","o.>..o","o..__o","oooooo"],puzzle:[" oo  ","oggoo","ogggo"," ogg ","oooo "]};
function pegboard(x,y,w,h,t){box(x,y,w,h,'#d8b888','#6e4430');for(let j=y+3;j<y+h-2;j+=4)for(let i=x+3;i<x+w-2;i+=4)P1(i,j,'#b09060');
  const pal={o:OL,'.':'#b4bcc8',b:'#5B9BD5',g:'#7ee08a','>':'#7ee08a',_:'#7ee08a'};
  const L=[['wrench',4,5],['globe',12,4],['cam',21,5],['term',29,4],['brush',5,17],['glass',13,16],['puzzle',22,17]];
  L.forEach(([k,dx,dy],i)=>{const p=k==='brush'?{...pal,o:'#e0533d'}:k==='puzzle'?{...pal,o:'#35593a'}:pal;grid(x+dx,y+dy,TOOLS_PX[k],p);P1(x+dx+2,y+dy-2,'#8a8a96')});
  if(t>=0&&Math.floor(t*2)%2)P1(x+31,y+8,'#7ee08a')}
// 合并门禁：左柱三盏灯（测试 / CI / Review），全亮了横杆才抬起来
function mergeGate(x,y,t,{lights=[0,0,0],open=0}={}){R(x,y+4,5,24,OL);R(x+1,y+5,3,22,'#8a93a8');R(x+17,y+10,4,18,OL);R(x+18,y+11,2,16,'#8a93a8');
  for(let i=0;i<3;i++){R(x,y-2+i*5,5,5,OL);R(x+1,y-1+i*5,3,3,lights[i]?'#7ee08a':'#5a4a4a')}
  const a=open*Math.PI/2.4;for(let i=0;i<18;i++){const px=Math.round(x+4+Math.cos(-a)*i),py=Math.round(y+14+Math.sin(-a)*i);P1(px,py,i%6<3?'#e0533d':'#fff4dc');P1(px,py+1,OL)}
  R(x-1,y+27,7,2,OL);R(x+16,y+27,6,2,OL)}   // base=y+29
// 星星罐子：玻璃罐里一罐星星；glow>0 时发光
function starJar(x,y,t,glow=0){R(x+1,y,8,2,'#a86e44');R(x+1,y,8,1,'#c98d5c');R(x,y+2,10,10,OL);R(x+1,y+2,8,9,glow>0?'#fff4c0':'#dfe8f4');R(x+1,y+2,1,9,'#ffffff');
  [[3,5],[6,4],[4,8],[7,8],[5,6]].forEach(([a,b],i)=>{if(glow>0||(Math.floor(t*2)+i)%5)P1(x+a,y+b,'#e8b83a')});if(glow>0&&Math.floor(t*6)%2){spark(x-2,y+2,t);spark(x+12,y+6,t)}}   // base=y+12
// 迎宾立牌：A 字小黑板
function welcomeStand(x,y,t){line(x+3,y+4,x,y+30,OL);line(x+27,y+4,x+30,y+30,OL);box(x,y,31,24,'#8a5a3a');R(x+2,y+2,27,20,'#2f4a3a');R(x+2,y+2,27,1,'#3c5c4a');
  txt('CLOWDER',x+3,y+4,'#fff4dc');txt('AI',x+3,y+11,'#ffd84a');const on=Math.floor(t*2)%2;P1(x+12,y+12,on?'#f4a6b8':'#e0533d');txt('♥',x+11,y+11,'#e0533d');
  grid(x+18,y+10,["o...o","oo.oo","ooooo","o.o.o","ooooo"," ooo "],{o:'#fff4dc','.':null});R(x+2,y+19,27,1,'#fff4dc33')}   // base=y+30

/* ---------- 前台：一张小桌子，桌上一只服务铃；前台猫坐在桌面左边 ---------- */
function frontDesk(x,y){R(x,y,36,22,OL);R(x+1,y+1,34,4,'#ecdcc0');R(x+1,y+1,34,1,'#fff4dc');R(x+1,y+5,34,1,OL);
  R(x+1,y+6,34,15,'#3f6f6a');R(x+1,y+6,34,1,'#5a8f88');R(x+2,y+20,32,1,'#2e5450');
  R(x+4,y+9,28,9,OL);R(x+5,y+10,26,7,'#ffd84a');R(x+5,y+16,26,1,'#c9a030');txt('ASK ME',x+6,y+11,OL)}   // 36×22，base=y+22
function serviceBell(x,y,t,ring=0){const k=ring>0&&Math.floor(t*12)%2;
  grid(x,y+(k?-1:0),["...o...","..ooo..",".owwwo.","oswwwso","ooooooo"],{o:OL,w:'#f4f8fc',s:'#b8c4d0','.':null});R(x,y+5,7,1,'#8a5a3a');
  if(ring>0){P1(x-2,y-1,'#ffd84a');P1(x-3,y-3,'#ffd84a');P1(x+8,y-1,'#ffd84a');P1(x+9,y-3,'#ffd84a')}}   // 7×6，(x,y) 左上角

/* ---------- 后院：跑轮旁边的发电机、灯杆、大灯泡串灯 ---------- */
// 发电机：一个小铁盒，跑轮转起来闪电亮。10×12，base=y+12
function dynamo(x,y,t,on=0){R(x,y,10,12,OL);R(x+1,y+1,8,10,'#6a7a8a');R(x+1,y+1,8,1,'#8a9aaa');R(x+2,y+10,6,1,'#4a5a6a');
  const c=on?(Math.floor(t*8)%2?'#ffd84a':'#fff4a0'):'#3a4a5a';grid(x+3,y+3,[".oo",".o.","oo.","..o"],{o:c,'.':null})}
// 灯杆：细木杆，顶上一个挂钩。4×(h+2)，base=y+h
function lightPole(x,y,h){R(x,y,3,h,OL);R(x+1,y,1,h-1,'#a8764a');R(x-2,y,7,2,OL);R(x-1,y,5,1,'#8a5a3a');R(x-1,y+h-2,5,2,OL)}
// 一颗大灯泡：(x,y) 是挂在电线上的那一点，5×7
function festoonBulb(x,y,col,on){grid(x-2,y,[".sss.",".sss.","obbbo","obwbo","obbbo",".ooo."],{s:'#4a4a58',o:OL,b:on?col:'#8e8494',w:on?'#ffffff':'#b8aebb','.':null})}
// 电线的形状：两点之间往下垂 sag
const festoonAt=(a,b,sag,u)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u+Math.sin(u*Math.PI)*sag});
function festoonWire(a,b,sag){const n=Math.ceil(Math.abs(b.x-a.x));let px=null;for(let i=0;i<=n;i++){const p=festoonAt(a,b,sag,i/n),q={x:Math.round(p.x),y:Math.round(p.y)};if(!px||q.x!==px.x||q.y!==px.y)P1(q.x,q.y,OL);px=q}}

/* ---------- 引导：E 键帽、箭头 ---------- */
function eKey(x,y,col='#fff4dc'){R(x,y,9,10,OL);R(x+1,y+1,7,7,col);R(x+1,y+8,7,1,'#b9a8c9');txt('E',x+3,y+2,OL)}   // (x,y) 左上角，9×10
function downArrow(x,y,col='#ffd84a'){grid(x-4,y,["ooooooooo","oyyyyyyyo",".oyyyyyo.","..oyyyo..","...oyo...","....o...."],{o:OL,y:col,'.':null})}   // 尖在 (x, y+5)
