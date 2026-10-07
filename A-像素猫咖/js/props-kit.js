/* 1024 猫咖 · 这一轮新添的零件（docs/店内设计.md 第三、四节）。依赖 scene-kit.js、world-kit.js、house-kit.js（在它们后面加载）。
   全部是"画在 (x,y) 左上"的像素零件，注释里写着宽高和 base（和猫一起排序的那条线）。会动的带 t；状态从参数进来，零件自己不记状态。
   函数名都先 grep 过：别和别的零件、页面里的函数撞名（openBook、bench、grid、frame 都踩过）。 */

// 把一个颜色压暗（k<1）：关着的灯管
const pkDim=(hex,k)=>{const n=parseInt(hex.slice(1),16);return'#'+[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.round(v*k).toString(16).padStart(2,'0')).join('')};

/* ---------- 一楼 · 1024 舞台：抓娃娃机、话筒 ---------- */
// 抓娃娃机：36×58，base=y+58。上面一块招牌一圈跑马灯，中间玻璃柜（底下一堆玩偶，顶上吊着爪子），下面是操作台（摇杆、按钮、左边的出口）和机身。
// st：{cx 爪子在柜子里的左右 0～1, cy 往下放了多少 0～1, shut 爪子合上, prize 爪子里的玩偶颜色, pop 出口刚掉出东西（秒）, busy 有猫在玩}
const CLAW_PILE=[[3,'#c8bcae'],[8,'#f0a352'],[13,'#e8b83a'],[18,'#98a4b4'],[23,'#f4a6b8'],[27,'#5B9BD5'],[6,'#e0533d'],[16,'#9B7EBD'],[24,'#7ee08a']];
function clawMachine(x,y,t,st={}){alpha(.22,()=>disc(x+18,y+57,18,2,'#241a2e'));
  // 招牌：粉色，一圈灯一颗颗跑
  R(x+1,y,34,10,OL);R(x+2,y+1,32,8,'#e86a9a');R(x+2,y+1,32,1,'#f8a8c8');txt('CATCH',x+8,y+3,'#fff4dc');
  for(let i=0;i<9;i++){const on=(Math.floor(t*(st.busy?8:3))+i)%3===0;P1(x+3+i*4,y+1,on?'#ffd84a':'#c84a7a');P1(x+3+i*4,y+8,on?'#c84a7a':'#ffd84a')}
  // 玻璃柜
  R(x,y+10,36,30,OL);R(x+1,y+11,34,28,'#3a2a4a');R(x+2,y+12,32,26,'#5a3a6a');for(let i=0;i<6;i++)P1(x+4+Math.floor(hsh(i,501)*28),y+13+Math.floor(hsh(i,502)*12),'#8a6a9a');
  // 底下一堆玩偶（小圆脑袋）
  CLAW_PILE.forEach(([dx,col],i)=>{const px=x+3+dx,py=y+34-(i>5?3:0);disc(px,py,2,2,OL);disc(px,py,1,1,col);P1(px-1,py-2,OL);P1(px+1,py-2,OL)});
  // 顶上的横梁、小车、绳子、爪子
  R(x+2,y+12,32,1,'#c8c4d8');const cx=Math.round(x+5+(st.cx??.5)*26),cy=Math.round(y+15+(st.cy||0)*15);R(cx-2,y+12,5,2,OL);R(cx-1,y+12,3,1,'#e8e4f0');R(cx,y+14,1,cy-y-14,'#c8c4d8');
  R(cx-1,cy,3,2,'#b8b0c8');if(st.shut){R(cx-1,cy+2,1,2,'#d8d4e0');R(cx+1,cy+2,1,2,'#d8d4e0')}else{P1(cx-2,cy+2,'#d8d4e0');P1(cx-3,cy+3,'#d8d4e0');P1(cx+2,cy+2,'#d8d4e0');P1(cx+3,cy+3,'#d8d4e0')}
  if(st.prize){disc(cx,cy+5,2,2,OL);disc(cx,cy+5,1,1,st.prize)}
  // 玻璃的反光
  alpha(.35,()=>{line(x+26,y+12,x+33,y+19,'#ffffff');line(x+28,y+12,x+33,y+17,'#ffffff')});
  // 操作台：往前探一点；左边是出口
  R(x-1,y+40,38,8,OL);R(x,y+41,36,6,'#c84a7a');R(x,y+41,36,1,'#f8a8c8');R(x+2,y+42,9,5,OL);R(x+3,y+43,7,3,st.pop>0?'#ffd84a':'#241a2e');
  R(x+17,y+38,1,4,OL);disc(x+17,y+37,2,2,OL);disc(x+17,y+37,1,1,'#e0533d');P1(x+16,y+36,'#ff9a8a');disc(x+27,y+44,2,1,OL);disc(x+27,y+44,1,0,st.busy&&Math.floor(t*4)%2?'#7ee08a':'#ffd84a');
  // 机身
  R(x+1,y+48,34,10,OL);R(x+2,y+48,32,9,'#9B7EBD');R(x+2,y+48,32,1,'#d0bce4');for(let i=0;i<4;i++)R(x+5+i*8,y+50,4,5,'#7a5ea0');R(x+16,y+52,4,2,OL)}

// 话筒：立在舞台台口。8×26，base=y+26；on：有猫在唱，话筒上的小灯亮
function micStand(x,y,t,on){disc(x+4,y+25,4,1,OL);disc(x+4,y+25,3,0,'#5a5a66');R(x+3,y+8,2,17,OL);R(x+4,y+8,1,17,'#8a8a96');
  R(x+1,y+5,6,3,OL);R(x+2,y+6,4,1,'#8a8a96');disc(x+4,y+2,3,3,OL);disc(x+4,y+2,2,2,'#4a4a58');P1(x+3,y+1,'#8a8a96');P1(x+5,y+2,'#8a8a96');P1(x+4,y+3,'#6a6a78');
  if(on){P1(x+6,y+6,Math.floor(t*4)%2?'#ff5a6a':'#ff9aa8')}}

/* ---------- 一楼 · 吧台：招财猫摆件、磨豆机 ---------- */
// 招财猫：坐在前吧台上。12×14，base=y+14。左爪举着招手，fast 招得飞快
function manekiFig(x,y,t,fast){const up=Math.floor(t*(fast?7:1.2))%2===0;
  grid(x,y,[".o.....o....","oWo...oWo...","oWWoooWWWo..","oWeWWWeWWo..","oWWWnWWWWo..",".oWWmWWWo...",".ooRRRRoo...",".oWWYWWWo...","oWWWWWWWWo..","oWWWWGGWWo..","oWWWGGGGWo..","oWWWWGGWWo..",".oWWWWWWo...",".oooooooo..."],
    {o:OL,W:'#fff8ee',e:'#241a2e',n:'#f4a6b8',m:'#e0533d',R:'#e0533d',Y:'#ffd84a',G:'#e8b83a','.':null});
  // 举起来的那只爪子（左边，画在身子外面）
  if(up){R(x+9,y+1,3,5,OL);R(x+10,y+2,1,3,'#fff8ee');P1(x+10,y+1,'#f4a6b8')}else{R(x+9,y+4,3,4,OL);R(x+10,y+5,1,2,'#fff8ee')}
  if(fast&&Math.floor(t*3)%2){spark(x+12,y,t);spark(x-1,y+9,t+.4)}}
// 磨豆机：放在后吧台上，大咖啡机旁边。12×26，base=y+26；on：在磨，机身一抖一抖，豆子往下沉
function coffeeGrinder(x,y,t,on){const j=on?Math.round(Math.sin(t*40)):0;x+=j;
  R(x+2,y,8,1,OL);R(x+1,y+1,10,8,OL);R(x+2,y+2,8,6,'#cfe8f0');R(x+2,y+5-(on?Math.floor(t*2)%2:0),8,3,'#6a4028');R(x+3,y+5,2,1,'#8a5a3a');R(x+6,y+6,2,1,'#8a5a3a');R(x+2,y+2,1,3,'#ffffff');
  R(x+3,y+9,6,2,OL);R(x,y+11,12,13,OL);R(x+1,y+12,10,11,'#3a3a46');R(x+1,y+12,10,1,'#6a6a78');R(x+2,y+14,1,8,'#5a5a66');
  R(x+10,y+13,4,1,OL);R(x+13,y+13,1,3,OL);disc(x+13,y+16,1,1,on?'#e0533d':'#8a2a34');R(x+3,y+20,6,3,OL);R(x+4,y+21,4,1,'#8a5a3a');R(x,y+24,12,2,OL)}

/* ---------- 一楼 · 咖啡厅：点唱机 ---------- */
// 点唱机：24×36，base=y+36。拱顶一圈彩色灯管（开着的时候颜色流动、气泡往上冒），中间一扇小窗里一张唱片（开着就转），下面喇叭格栅
function jukebox(x,y,t,on,track=0){alpha(.22,()=>disc(x+12,y+35,12,2,'#241a2e'));
  const W=24,arch=(i,j)=>{const dx=i-11.5,dy=j-11;return j>=11||dx*dx+dy*dy<=132};
  for(let j=0;j<36;j++)for(let i=0;i<W;i++){if(!arch(i,j))continue;const edge=!arch(i-1,j)||!arch(i+1,j)||!arch(i,j-1)||j===35;P1(x+i,y+j,edge?OL:'#8a4a2e')}
  // 拱顶的灯管：两圈
  const T=['#e0533d','#e8b83a','#7ee08a','#6ac8ff','#c8a0ff'];for(let a=0;a<28;a++){const q=Math.PI+a/27*Math.PI,r=9;const px=Math.round(x+11.5+Math.cos(q)*r),py=Math.round(y+11+Math.sin(q)*r);
    const ci=on?Math.floor(a/3+t*4+track)%5:Math.floor(a/6)%5;P1(px,py,on?T[ci]:pkDim(T[ci],.5));P1(Math.round(x+11.5+Math.cos(q)*(r-1)),Math.round(y+11+Math.sin(q)*(r-1)),on?'#fff4dc':'#a88870')}
  if(on)for(let i=0;i<3;i++){const k=(t*.8+i/3)%1;alpha(.6,()=>P1(x+4+i*7,Math.round(y+30-k*16),'#ffffff'))}
  // 小窗和唱片
  R(x+6,y+8,12,9,OL);R(x+7,y+9,10,7,'#2a1e2e');disc(x+12,y+12,3,3,'#141018');const a=on?t*6:0;P1(Math.round(x+12+Math.cos(a)*2),Math.round(y+12+Math.sin(a)*2),'#8a8496');disc(x+12,y+12,1,1,T[track%5]);
  // 一排选歌按钮
  for(let i=0;i<3;i++){R(x+6+i*4,y+19,3,2,OL);P1(x+7+i*4,y+19,on&&i===track%3?'#ffd84a':'#c8c4d8')}
  // 喇叭格栅、底座
  R(x+4,y+23,16,9,OL);R(x+5,y+24,14,7,'#5a2e1e');for(let j=y+25;j<y+31;j+=2)R(x+5,j,14,1,'#c8a050');R(x+1,y+33,22,1,'#c8a050')}

/* ---------- 一楼 · 楼梯间：大伞桶（钻进去只露脑袋） ---------- */
// 18×24，(x,y) 左上；后半（桶口后沿、伞）base=y+6，前半（桶身）base=y+24。猫坐进去时脚在 y+20、z=y+22.5
function umbrellaBinBack(x,y){line(x+5,y+6,x+2,y-8,'#e0533d');line(x+12,y+6,x+15,y-6,'#5B9BD5');grid(x-1,y-11,[".ooooo.","orrrrro","o.o.o.o"],{o:OL,r:'#e0533d','.':null});grid(x+12,y-9,[".ooooo.","obbbbbo","o.o.o.o"],{o:OL,b:'#5B9BD5','.':null});
  disc(x+9,y+6,9,3,OL);disc(x+9,y+6,8,2,'#2a3a4a')}
function umbrellaBinFront(x,y){R(x,y+6,18,17,OL);R(x+1,y+7,16,15,'#e8eef4');R(x+1,y+7,16,2,'#ffffff');for(let i=0;i<4;i++){R(x+2+i*4,y+12,2,2,'#5B9BD5');P1(x+3+i*4,y+15,'#5B9BD5')}R(x+1,y+18,16,1,'#5B9BD5');R(x+1,y+20,16,2,'#c8d0dc');
  disc(x+9,y+6,9,2,OL);for(let i=-8;i<=8;i++)P1(x+9+i,y+7+(Math.abs(i)>6?-1:0),'#ffffff');R(x,y+23,18,1,OL)}

/* ---------- 一楼 · 后院：秋千、青蛙 ---------- */
// 秋千：两根绳从枝上 (ax,ay) 垂到座板 (sx,sy)；座板 16×3。猫坐在座板上
function swingRopes(ax,ay,sx,sy){line(ax-6,ay,sx-6,sy,'#d9c8a8');line(ax+6,ay,sx+6,sy,'#d9c8a8');R(ax-8,ay-1,4,2,OL);R(ax+4,ay-1,4,2,OL)}
function swingSeat(sx,sy){R(sx-8,sy,16,4,OL);R(sx-7,sy+1,14,1,'#c98d5c');R(sx-7,sy+2,14,1,'#8a5a3a')}
// 青蛙：7×6，(x,y) 脚底中点。croak：鼓起白色的下巴；jump 0～1：跳起来
function frogPx(x,y,t,croak,jump=0){const h=jump?Math.round(Math.sin(jump*Math.PI)*6):0;y-=h;
  grid(x-4,y-6,[".oo.oo..","oewoewo.","oggggggo","ogGGGGgo",".oggggo.","oo.oo.oo"],{o:OL,e:'#ffd84a',w:'#241a2e',g:'#5e9a4a',G:'#7cc45e','.':null});
  if(croak){disc(x,y-1,2,1,'#fff4dc');P1(x,y-2,'#e8e0c8')}if(!jump)alpha(.25,()=>R(x-3,y,7,1,'#241a2e'))}

/* ---------- 一楼 · 河边：鸭子、漂木、漂流瓶，重画的小船在 outdoor-kit.js ---------- */
// 鸭子：浮在水上，(x,y) 水线中点，dir 朝向；baby 小鸭
function duckPx(x,y,t,dir=1,baby){const b=Math.round(Math.sin(t*3+x*.1));y+=b;
  if(baby){grid(x-3,y-4,dir>0?["..oo.","oyyyb","oyyyo",".ooo."]:[".oo..","byyyo","oyyyo",".ooo."],{o:OL,y:'#ffe066',b:'#f08a2a','.':null});}
  else grid(x-5,y-7,dir>0?[".....oo..","....oggo.","....ogeoo","ooo.oggbb","oWWooWWo.","oWWWWWWo.",".oooooo.."]:["..oo.....",".oggo....","ooego....","bbggo.ooo",".oWWooWWo",".oWWWWWWo","..oooooo."],
    {o:OL,g:'#3a7a4a',e:'#241a2e',b:'#f0a030',W:'#c8b090','.':null});
  if(Math.floor(t*2+x)%3===0)alpha(.6,()=>{P1(x-(baby?4:6)*dir,y+1,'#cfe8f8');P1(x-(baby?5:7)*dir,y+1,'#cfe8f8')})}
// 漂木：16×5；漂流瓶：8×4（瓶子里卷着一张纸）
function driftLog(x,y,t){y+=Math.round(Math.sin(t*1.7+x*.07));R(x,y,16,5,OL);R(x+1,y+1,14,3,'#8a5a3a');R(x+1,y+1,14,1,'#b07a52');disc(x+1,y+2,1,1,'#c8a070');P1(x+1,y+2,'#8a5a3a');R(x+6,y+2,4,1,'#6a4028');R(x+15,y+1,1,3,'#c8a070');
  alpha(.5,()=>{R(x-2,y+5,3,1,'#cfe8f8');R(x+15,y+5,3,1,'#cfe8f8')})}
function bottlePx(x,y,t){y+=Math.round(Math.sin(t*2.3+x*.05));R(x,y,7,4,OL);R(x+1,y+1,5,2,'#7ec8a0');R(x+2,y+1,3,1,'#fff4dc');R(x+7,y+1,2,2,OL);P1(x+8,y+1,'#c8956a');P1(x+1,y+1,'#c8f0dc')}

/* ---------- 二楼 · 工坊：白板上的涂鸦 ---------- */
// 一样涂鸦大约 10×8，(x,y) 左上
const WB_INK=['#3a6ab0','#c83a3a','#3a8a4a','#2a2a33'];
function wbDoodle(x,y,kind,ink=0){const c=WB_INK[ink%4];
  if(kind==='fish'){grid(x,y+2,[".ccc..c","c.e.cc.",".ccc..c"],{c,e:c,'.':null});return}
  if(kind==='yarn'){ring(x+4,y+4,3,c);line(x+2,y+2,x+6,y+6,c);line(x+7,y+4,x+10,y+7,c);return}
  if(kind==='cat'){grid(x,y,["c.....c","cc...cc","c.....c","c.c.c.c","c..c..c",".ccccc."],{c,'.':null});return}
  if(kind==='heart'){grid(x+1,y+1,[".c.c.","ccccc","ccccc",".ccc.","..c.."],{c,'.':null});return}
  if(kind==='lgtm'){txt('LGTM',x-2,y+2,c);return}
  if(kind==='flow'){R(x,y+1,4,3,c);R(x+1,y+2,2,1,'#f4f6f8');line(x+4,y+2,x+6,y+2,c);R(x+7,y+1,4,3,c);R(x+8,y+2,2,1,'#f4f6f8');line(x+9,y+4,x+9,y+6,c);R(x+7,y+6,4,2,c);return}
  if(kind==='paw'){disc(x+4,y+5,2,2,c);[[1,2],[3,0],[5,0],[7,2]].forEach(([a,b])=>P1(x+a,y+b,c));return}}

/* ---------- 二楼 · 图书馆：地球仪 ---------- */
// 16×24，base=y+24；a 转到哪儿（弧度，一直往上加）
function globeToy(x,y,t,a=0){alpha(.22,()=>disc(x+8,y+23,7,1,'#241a2e'));R(x+3,y+21,10,3,OL);R(x+4,y+22,8,1,'#a8703f');R(x+7,y+15,2,6,OL);
  for(let k=0;k<14;k++){const q=Math.PI*.15+k/13*Math.PI*1.1;P1(Math.round(x+8+Math.cos(q+Math.PI/2)*8),Math.round(y+8+Math.sin(q+Math.PI/2)*8)-0,'#c8a050')}
  disc(x+8,y+8,6,6,OL);disc(x+8,y+8,5,5,'#4a8ec8');
  // 陆地：几块绿色，按转角左右移，只画在球里
  const L=[[0,-2,3,2],[2.2,2,2,2],[4,-1,2,3],[5.4,3,2,1]];L.forEach(([p,dy,w,h])=>{const u=((p+a)%6.28+6.28)%6.28,dx=Math.round(Math.cos(u)*5);if(Math.sin(u)<-.2)return;
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){const px=x+8+dx+i-1,py=y+8+dy+j;if((px-x-8)**2+(py-y-8)**2<=24)P1(px,py,'#5e9a4a')}});
  P1(x+6,y+5,'#a8d8f8');P1(x+5,y+6,'#a8d8f8')}

/* ---------- 二楼 · 大客厅：曲谱架、弹簧逗猫棒 ---------- */
// 曲谱架：10×24，base=y+24；架子上一张谱，si 是第几首（谱纸的颜色不同）
function musicStand(x,y,si=0){R(x+4,y+10,2,13,OL);line(x+5,y+21,x+1,y+24,OL);line(x+5,y+21,x+9,y+24,OL);
  const pc=['#fff8e8','#f4f0ff','#f0fff4','#fff4f0'][si%4];R(x,y,10,10,OL);R(x+1,y+1,8,8,pc);for(let j=0;j<3;j++)R(x+2,y+2+j*2,6,1,'#c8bca8');P1(x+3,y+3,OL);P1(x+6,y+5,OL);P1(x+4,y+7,OL);R(x-1,y+9,12,2,OL)}
// 弹簧逗猫棒：8×32，base=y+32；wob：羽毛偏多少（-1～1）
function wandToy(x,y,t,wob=0){R(x+1,y+29,6,3,OL);R(x+2,y+30,4,1,'#8a8a96');for(let j=0;j<4;j++){R(x+2,y+22+j*2,4,1,'#b8b8c0');P1(x+1,y+23+j*2,OL);P1(x+6,y+23+j*2,OL)}
  const tx=Math.round(x+4+wob*9),ty=y+4+Math.round(Math.abs(wob)*2);line(x+4,y+21,tx,ty+3,'#5a5a66');
  [['#e0533d',-2,0],['#ffd84a',0,-1],['#5B9BD5',2,0],['#7ee08a',1,2],['#f4a6b8',-1,2]].forEach(([c,a,b])=>{line(tx,ty+2,tx+a*2,ty+b-2,c)});P1(tx,ty+2,OL)}

/* ---------- 屋顶：孔明灯、猫头鹰 ---------- */
// 一篮叠好的孔明灯：16×12，base=y+12
function lanternBasket(x,y){R(x+1,y+4,14,8,OL);R(x+2,y+5,12,6,'#c8a070');for(let i=x+3;i<x+14;i+=3)R(i,y+5,1,6,'#a8804a');R(x+2,y+7,12,1,'#a8804a');
  [[3,'#e0533d'],[7,'#f08a4a'],[11,'#e8b83a']].forEach(([dx,c])=>{R(x+dx-2,y,5,5,OL);R(x+dx-1,y+1,3,3,c);P1(x+dx,y+1,'#fff4c0')})}
// 天上的孔明灯：s 越小越远（1 = 刚放出去）
function skyLantern(x,y,t,s=1){const w=Math.max(2,Math.round(6*s)),h=Math.max(3,Math.round(8*s)),fl=Math.floor(t*6+x)%2;
  if(w<=2){P1(x,y,'#ffd88a');P1(x,y+1,fl?'#ffb050':'#ffd88a');return}
  R(x-Math.floor(w/2),y,w,h,'#e0533d');R(x-Math.floor(w/2)+1,y+1,w-2,h-2,'#ffb070');R(x-Math.floor(w/2)+1,y+h-3,w-2,2,fl?'#fff4c0':'#ffd88a');R(x-Math.floor(w/2),y-1,w,1,'#c83a2a')}
// 猫头鹰：9×11，(x,y) 脚底中点；back：头转过去只看得见后脑勺；fly 0～1 扑翅膀
function owlPx(x,y,t,back,fly=0){const blink=Math.floor(t*.7+x)%9===0;
  if(fly){const w=Math.floor(t*10)%2;grid(x-7,y-9,w?["o.....oo.....o","oo...obbo...oo",".oobbbbbbbboo.","...obbbbbbo...","....obbbbo....",".....oooo....."]:["......oo......",".....obbo.....",".oobbbbbbbboo.","oobbbbbbbbbboo","....obbbbo....",".....oooo....."],{o:OL,b:'#8a6a4a','.':null});return}
  grid(x-4,y-11,back?[".o.....o.","obo...obo","obbbbbbbo","obbbbbbbo","obBbbbBbo",".obbbbbo.","obbbbbbbo","obbBbBbbo","obbbbbbbo",".obbbbbo.","..y...y.."]:[".o.....o.","obo...obo","obbbbbbbo","oWWobWWbo",blink?"oooobooob":"oeeobeeob",".obbnbbo.","obcccccbo","obcbcbcbo","obcccccbo",".obbbbbo.","..y...y.."],
    {o:OL,b:'#8a6a4a',B:'#6a4a32',W:'#f4e8c8',e:'#ffd84a',n:'#e8a040',c:'#d8c0a0',y:'#e8a040','.':null})}

/* ---------- 第五轮：吧台的大鱼缸、舞台的 Tips 大屏 ---------- */
// 大鱼缸：58×40，base=y+40；木柜子上一口长缸：沙、水草、小城堡、气泡，七条鱼来回游；paw>0 时玻璃上一个爪印、鱼吓得散开
function bigFishTank(x,y,t,{paw=0}={}){box(x,y+28,58,12,'#9a6448');R(x+1,y+29,56,1,'#b87a58');R(x+28,y+31,1,8,'#7a4c36');P1(x+25,y+34,'#ffd84a');P1(x+31,y+34,'#ffd84a');
  box(x,y,58,29,'#3a5a6a');for(let j=0;j<24;j++)R(x+1,y+3+j,56,1,j<6?'#9fd6ec':j<14?'#86c8e4':'#72b6d8');R(x+1,y+1,56,2,'#c8d0d8');R(x+1,y+3,56,1,'#cfeef8');
  R(x+1,y+23,56,4,'#e6d49a');for(let i=0;i<8;i++)P1(x+4+i*7,y+24+(i%2),'#c9b070');
  // 小城堡、石头、水草
  R(x+40,y+15,9,9,'#8a8a98');R(x+40,y+13,2,2,'#8a8a98');R(x+44,y+13,2,2,'#8a8a98');R(x+48,y+13,1,2,'#8a8a98');R(x+43,y+19,3,5,'#3a3a48');disc(x+12,y+24,4,2,'#6a7280');
  for(const [px,hh,c] of [[6,11,'#4a9a5a'],[20,8,'#5ea85e'],[33,12,'#4a9a5a'],[53,9,'#5ea85e']])for(let j=0;j<hh;j++)P1(x+px+Math.round(Math.sin(t*2+j*.5+px)*(j/hh)*1.5),y+22-j,c);
  // 七条鱼：三角波来回游，转身时换方向；paw 的时候往两边散
  const COL=['#ff8a3a','#ffd84a','#ff6a8a','#4fd8ff','#ff8a3a','#c8a0ff','#ffd84a'];
  for(let i=0;i<7;i++){const u=((t*(.12+i*.025)+i*.37)%2),k=u<1?u:2-u,dir=u<1?1:-1,sc=paw>0?Math.sign(i%2-.5)*paw*6:0,fx=Math.round(x+5+k*46+sc),fy=Math.round(y+6+((i*5)%14)+Math.sin(t*1.3+i)*1.5);
    R(fx-2,fy,4,2,COL[i]);P1(fx-3*dir,fy+(Math.floor(t*6+i)%2),COL[i]);P1(fx+dir,fy,'#141018')}
  for(let i=0;i<4;i++){const k=(t*.6+i*.25)%1;P1(x+9+(i%2),Math.round(y+22-k*18),'#e8f8ff')}
  R(x+2,y+4,1,18,'#ffffff55');if(paw>0){alpha(.7,()=>{disc(x+29,y+14,3,2,'#fff4dc');[[-3,-3],[0,-4],[3,-3]].forEach(([a,b])=>P1(x+29+a,y+14+b,'#fff4dc'))})}}
// Tips 大屏：舞台背板变成一块 LED 屏，左边一个"TIPS"小标和猫脸，中间一行中文像素字从右往左滚（PXT，画在 1 倍的画布上，跟着画面放大）
function tipBoard(x,y,w,h,t,tb){R(x-2,y-2,w+4,h+4,OL);R(x-1,y-1,w+2,h+2,'#8a5a3a');R(x+1,y+1,w-2,h-2,'#101828');
  for(let j=y+3;j<y+h-2;j+=3)for(let i=x+3;i<x+w-2;i+=3)P1(i,j,'#1a2638');
  box(x+5,y+5,40,13,'#1e6a5a');txt('TIPS',x+11,y+9,'#9cffd8');const cx=x+56,cy=y+11;R(cx-5,cy-3,11,8,'#9cffd8');R(cx-5,cy-5,2,2,'#9cffd8');R(cx+4,cy-5,2,2,'#9cffd8');P1(cx-2,cy,'#101828');P1(cx+2,cy,'#101828');
  const s=tb.s||'',sw=PXT.w(s),X0=x+w-4,X=Math.round(X0-tb.k*(sw+w)),ty=y+Math.floor(h/2)-4;
  C.save();C.beginPath();C.rect(x+4,y+22,w-8,h-30);C.clip();PXT.draw(s,X,ty,'#ffe98a',{shadow:'#5a3a1a'});C.restore();
  txt('CLOWDER CAT CAFE',x+Math.floor((w-txtW('CLOWDER CAT CAFE'))/2),y+h-9,Math.floor(t*2)%2?'#9cffd8':'#5aa898');
  for(let i=0,n=Math.floor((w+h)*2/9);i<n;i++){const u=i/n,per=2*(w+h),d=u*per;let px,py;if(d<w){px=x+d;py=y}else if(d<w+h){px=x+w;py=y+d-w}else if(d<2*w+h){px=x+w-(d-w-h);py=y+h}else{px=x;py=y+h-(d-2*w-h)}
    P1(Math.round(px),Math.round(py),(i+Math.floor(t*6))%4?'#3a4a5a':'#9cffd8')}}
