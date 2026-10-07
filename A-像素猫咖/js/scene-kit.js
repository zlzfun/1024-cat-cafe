/* 1024 猫咖 · 像素场景零件 v2。依赖 cat-sprites.js（v2）。
   场景里不出现人类。人类只在门外：委托（毛线球）从门上的投递口塞进来；猫把它解开、织成一件小东西挂进橱窗；人类取走时，窗外飘起一颗心。
   约定：先 use(ctx) 指定画布；元素函数的 (x,y) 为左上角，注释里的 base 是落地的 y，用于和猫按 y 排序做前后遮挡。
   v1 的零件（人类、客桌、工位、邮筒）冻结在 scene-kit-v1.js。 */
let C;const use=c=>(C=c);
const OL='#3a2630';
const R=(x,y,w,h,col)=>{if(!col||w<=0||h<=0)return;C.fillStyle=col;C.fillRect(Math.round(x),Math.round(y),w,h)};
const P1=(x,y,col)=>R(x,y,1,1,col);
function box(x,y,w,h,fill,ol=OL){R(x,y,w,h,ol);R(x+1,y+1,w-2,h-2,fill)}
function disc(cx,cy,rx,ry,col){for(let y=-ry;y<=ry;y++){const s=Math.floor(rx*Math.sqrt(Math.max(0,1-(y*y)/((ry+.5)*(ry+.5)))));R(cx-s,cy+y,2*s+1,1,col)}}
function grid(x,y,rows,pal){rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){const c=pal[r[i]];if(c)R(x+i,y+j,1,1,c)}})}
function line(x0,y0,x1,y1,col){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)P1(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),col)}
const alpha=(a,fn)=>{const o=C.globalAlpha;C.globalAlpha=a;fn();C.globalAlpha=o};

/* ---------- 3×5 像素字 ---------- */
const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',
  I:'111010010010111',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',R:'110101110101101',
  S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',
  0:'111101101101111',1:'010110010010111',2:'110001010100111',3:'110001010001110',4:'101101111001001',5:'111100110001110',6:'011100111101111',
  7:'111001010010010',8:'111101111101111',9:'111101111001110',':':'000010000010000','!':'010010010000010','?':'110001010000010','+':'000010111010000',
  '-':'000000111000000','/':'001001010100100','.':'000000000000010','♥':'000101111111010','<':'001010100010001','>':'100010001010100'};
function txt(s,x,y,col,k=1){let cx=x;for(const ch of String(s).toUpperCase()){const f=FONT[ch];if(f)for(let i=0;i<15;i++)if(f[i]==='1')R(cx+(i%3)*k,y+Math.floor(i/3)*k,k,k,col);cx+=4*k}}
const txtW=(s,k=1)=>String(s).length*4*k-k;

/* ---------- 地面 ---------- */
function floorWood(x,y,w,h){const A=['#c98d5c','#c28553'],S='#a86e44';for(let r=0,yy=y;yy<y+h;yy+=6,r++){const hh=Math.min(6,y+h-yy);R(x,yy,w,hh,A[r%2]);if(hh===6)R(x,yy+5,w,1,S);
  for(let xx=x+((r*17)%29);xx<x+w;xx+=29)R(xx,yy,1,Math.min(5,hh),S);if(r%3===1&&w>8)P1(x+((r*37)%(w-4))+2,yy+2,'#b3784a')}}
function floorTile(x,y,w,h){for(let j=0;j*8<h;j++)for(let i=0;i*8<w;i++)R(x+i*8,y+j*8,Math.min(8,w-i*8),Math.min(8,h-j*8),(i+j)%2?'#efe2cc':'#e0ceb2')}
// 椭圆地毯：解毛线球的地方，(cx,cy) 中心
function rugOval(cx,cy,rx,ry,a,b){disc(cx,cy,rx+1,ry+1,b);disc(cx,cy,rx,ry,a);disc(cx,cy,rx-3,ry-2,b);disc(cx,cy,rx-4,ry-3,a);
  for(let i=-rx+6;i<=rx-6;i+=6)P1(cx+i,cy,b)}

/* ---------- 墙 ---------- */
const WALLS={cream:['#f2dcc2','#ead0b2'],pink:['#f4d6d2','#eec4c2'],mint:['#d4eada','#c2dfca'],navy:['#3c4670','#353e64'],butter:['#f5e4b2','#eed89c'],peach:['#f2c8a2','#e8b88e'],lilac:['#e2d6ee','#d6c8e6']};
function wall(x,y,w,h,style='cream'){const [a,b]=WALLS[style];R(x,y,w,h,a);for(let i=x+2;i<x+w;i+=8)R(i,y+2,3,h-12,b);R(x,y,w,2,'#5a3a2a');
  const wy=y+h-10;R(x,wy,w,8,'#9a6448');R(x,wy,w,1,'#b87a58');for(let i=x+3;i<x+w-12;i+=16){R(i,wy+2,12,1,'#7a4c36');R(i,wy+6,12,1,'#7a4c36');R(i,wy+2,1,5,'#7a4c36');R(i+11,wy+2,1,5,'#7a4c36')}
  R(x,y+h-2,w,2,'#4a2e22')}
const SKY={day:['#a8d8f4','#cdeaf8','#7ab87a'],dusk:['#f09a6a','#fbd49a','#8a7a5a'],night:['#1f2248','#2e3266','#1c3a2c']};
const GREY={day:['#a9b4c2','#c8d0da'],dusk:['#b89a94','#d4b8a8'],night:['#1a1d36','#252946']};   // 雨天、雪天的天色
// 窗：weather = sun 晴 / rain 雨 / snow 雪；cross=1 画十字窗棂；inside(ix,iy,iw,ih) 画窗框以内、玻璃前面的东西（橱窗的晾衣绳）。窗台 base=y+h+2
function windowW(x,y,w,h,t=0,tod='day',{weather='sun',cross=1,inside=null}={}){R(x-2,y+h-1,w+4,3,OL);R(x-1,y+h,w+2,1,'#fff4dc');box(x,y,w,h,'#fff4dc');
  const ix=x+3,iy=y+3,iw=w-6,ih=h-6,wet=weather!=='sun',[s1,s2]=wet?GREY[tod]:SKY[tod],g=weather==='snow'?'#eef2f6':SKY[tod][2];
  R(ix,iy,iw,ih,s2);R(ix,iy,iw,Math.floor(ih/2),s1);
  C.save();C.beginPath();C.rect(ix,iy,iw,ih);C.clip();
  if(tod==='night'&&!wet){[[.15,.3],[.55,.18],[.8,.55],[.35,.62],[.7,.3]].forEach(([a,b],i)=>{if((Math.floor(t*1.5)+i)%6)P1(ix+Math.floor(a*iw),iy+Math.floor(b*ih),'#fff4dc')});disc(ix+iw-6,iy+5,2,2,'#fff4dc');P1(ix+iw-5,iy+4,s1)}
  else{const cc=wet?(tod==='night'?'#2c3050':'#e6e9ee'):'#fff',sp=wet?1.2:3,cl=(o,cy)=>{const cx=ix-10+((t*sp+o)%(iw+20));R(cx,cy,9,2,cc);R(cx+2,cy-1,4,1,cc)};cl(0,iy+5);cl(iw*.6,iy+9);if(wet)cl(iw*.3,iy+3)}
  R(ix,iy+ih-4,iw,4,g);for(let i=0;i<iw;i+=5)disc(ix+i+2,iy+ih-4,2,1,g);
  if(weather==='rain'){const col=tod==='night'?'#5a6a98':'#f2f6fa';for(let i=0,n=Math.floor(iw*ih/45);i<n;i++)R(ix+(i*37+Math.floor(t*28))%iw,iy+(i*53+Math.floor(t*110))%ih,1,2,col)}
  if(weather==='snow')for(let i=0,n=Math.floor(iw*ih/40);i<n;i++)P1(ix+((i*29+Math.floor(t*4+Math.sin(t*1.3+i)*2))%iw+iw)%iw,iy+(i*41+Math.floor(t*12))%ih,'#ffffff');
  if(inside)inside(ix,iy,iw,ih);C.restore();
  if(cross){R(x+Math.floor(w/2)-1,y+1,2,h-2,'#fff4dc');R(x+1,y+Math.floor(h/2)-1,w-2,2,'#fff4dc')}
  alpha(.5,()=>{line(ix+1,iy+5,ix+5,iy+1,'#ffffff');line(ix+1,iy+8,ix+8,iy+1,'#ffffff')})}
function curtains(x,y,w,h,col='#e88aa0',dk='#c46a82'){R(x-5,y-3,w+10,2,OL);[x-5,x+w-1].forEach(cx=>{R(cx,y-1,6,h,col);R(cx+2,y-1,1,h,dk);R(cx,y+h-1,6,1,dk)})}
// 彩旗串：文化节的小三角旗，挂在天花板下；span 是两个挂点之间的距离
function bunting(x0,x1,y,span=64){const sag=x=>Math.round(Math.sin(((x-x0)%span)/span*Math.PI)*3);
  for(let x=x0;x<x1;x++)P1(x,y+sag(x),'#8a5a3a');
  for(let x=x0+6,i=0;x<x1-3;x+=8,i++){const m=(x-x0)%span;if(m<4||m>span-4)continue;const s=y+sag(x)+1,[c,l]=YARNC[i%5];R(x-2,s,5,1,c);R(x-1,s+1,3,1,c);P1(x,s+2,c);P1(x-1,s,l)}}
function chalkboard(x,y,w,h,lines){box(x,y,w,h,'#8a5a3a');R(x+2,y+2,w-4,h-4,'#2f4a3a');R(x+2,y+2,w-4,1,'#3c5c4a');
  lines.forEach(([s,yy,col='#e8f0e0',k=1])=>txt(s,x+Math.floor((w-txtW(s,k))/2),y+yy,col,k));R(x+5,y+h-1,w-10,2,'#6e4430');R(x+8,y+h-2,3,1,'#fff4dc')}
function clock(cx,cy,t){disc(cx,cy,6,6,OL);disc(cx,cy,5,5,'#fff4dc');[[0,-4],[4,0],[0,4],[-4,0]].forEach(([a,b])=>P1(cx+a,cy+b,'#b9a8c9'));
  const m=t*.6,h=t*.05;line(cx,cy,cx+Math.round(Math.sin(m)*4),cy-Math.round(Math.cos(m)*4),OL);line(cx,cy,cx+Math.round(Math.sin(h)*3),cy-Math.round(Math.cos(h)*3),'#e0533d')}
// 墙上的架子：咖啡豆罐、线轴、小盆栽、毛线球轮流摆
function shelf(x,y,w){R(x,y,w,3,OL);R(x+1,y,w-2,2,'#a8703f');R(x+3,y+3,2,3,OL);R(x+w-5,y+3,2,3,OL);
  let cx=x+3,i=0;while(cx<x+w-8){const k=i%4;
    if(k===0){box(cx,y-7,5,7,'#e8dccb');R(cx+1,y-4,3,3,'#6a3a22');cx+=7}
    else if(k===1){const [a,l]=YARNC[(i>>2)%5];R(cx,y-8,6,1,OL);R(cx+1,y-7,4,7,OL);R(cx+2,y-7,2,6,a);P1(cx+2,y-5,l);P1(cx+3,y-3,l);R(cx,y-1,6,1,OL);cx+=8}
    else if(k===2){R(cx+1,y-4,5,4,OL);R(cx+2,y-4,3,3,'#c46a44');disc(cx+3,y-7,2,2,'#5b9a5a');cx+=8}
    else{yarnBall(cx+3,y-4,3,(i>>2)+2);cx+=9}i++}}
// 门：ring 门铃在摇；flap 投递口的翻盖被推开。门上小窗里只有外面的天色——人类永远在门外
function door(x,y,t=0,{ring=0,flap=0,tod='day'}={}){const [s1,s2]=SKY[tod];R(x-2,y-2,26,42,'#5a3a2a');box(x,y,22,40,'#9a6448');
  box(x+4,y+4,14,10,s2);R(x+5,y+5,12,4,s1);R(x+5,y+5,4,1,'#ffffff');
  R(x+4,y+18,14,6,OL);R(x+5,y+19,12,4,'#d8b04a');R(x+5,y+19,12,1,'#f4d27a');R(x+6,y+20,10,2,'#241a2e');   // 投递口：黄铜框
  if(flap){R(x+6,y+16,10,2,OL);R(x+6,y+16,10,1,'#ffd84a')}else{R(x+6,y+20,10,2,'#c9a030');R(x+6,y+20,10,1,'#e8c050')}
  box(x+4,y+26,6,10,'#8a5a3a');box(x+12,y+26,6,10,'#8a5a3a');P1(x+19,y+19,'#ffd84a');P1(x+19,y+20,'#c9a030');
  const sw=ring?Math.round(Math.sin(t*22)*1.4):0;R(x+2,y+1,1,2,OL);grid(x+1+sw,y+3,["ooo","oyo","ooo",".y."],{o:OL,y:'#ffd84a'})}   // 投递口中心 (x+11, y+21)
function mat(x,y,w=26){R(x,y,w,6,OL);R(x+1,y+1,w-2,4,'#b5654a');for(let i=x+3;i<x+w-2;i+=4)R(i,y+2,2,2,'#d98a6a')}
function neon(x,y,s,col,t,k=1){const on=Math.floor(t*6)%31!==0;box(x,y,txtW(s,k)+6,5*k+6,'#2a2238');txt(s,x+3,y+3,on?col:'#5a4a5a',k)}

/* ---------- 家具 ---------- */
function counter(x,y,w,h=26){R(x,y,w,h,OL);R(x+1,y+1,w-2,6,'#ecdcc0');R(x+1,y+1,w-2,1,'#fff4dc');R(x+1,y+7,w-2,1,OL);R(x+1,y+8,w-2,h-11,'#9a6448');
  for(let i=x+6;i<x+w-4;i+=12)R(i,y+10,1,h-15,'#7a4c36');R(x+1,y+h-3,w-2,2,'#6e4430')}               // base=y+h
function cushion(x,y,w,col='#9B7EBD',l='#d0bce4'){R(x+1,y,w-2,4,OL);R(x,y+1,w,2,OL);R(x+1,y+1,w-2,2,col);R(x+2,y+1,w-4,1,l);P1(x-1,y+3,col);P1(x+w,y+3,col)}   // base=y+4
function coffeeMachine(x,y,t,brew=0){box(x,y,18,22,'#9aa3ad');R(x+1,y+1,16,5,'#6b7480');P1(x+3,y+3,Math.floor(t*2)%2||brew?'#e0533d':'#7a3030');R(x+11,y+2,5,3,'#b8f0c8');
  box(x+3,y+7,12,4,'#4a5058');R(x+8,y+11,2,2,OL);box(x+6,y+15,6,6,'#fff4dc');P1(x+12,y+16,OL);P1(x+12,y+17,OL);R(x+1,y+20,16,1,'#6b7480');
  if(brew)P1(x+8,y+13+Math.floor(t*10)%2,'#6a3a22');steam(x+9,y-1,t,brew?4:2)}                        // base=y+22
function steam(x,y,t,n=2){alpha(.7,()=>{for(let i=0;i<n;i++){const k=(t*1.5+i/n)%1;P1(x+Math.round(Math.sin((k+i)*6)*1.5),y-Math.round(k*8),'#fff')}})}
function sofa(x,y,w,col=['#e88aa0','#c46a82','#f6b0c0']){const [a,d,l]=col;
  R(x+4,y,w-8,15,OL);R(x+5,y+1,w-10,13,a);R(x+5,y+1,w-10,2,l);R(x+Math.floor(w/2),y+2,1,11,d);
  R(x+4,y+14,w-8,9,OL);R(x+5,y+15,w-10,6,l);R(x+5,y+20,w-10,1,d);R(x+Math.floor(w/2),y+15,1,6,d);
  box(x,y+6,7,20,a);box(x+w-7,y+6,7,20,a);R(x+1,y+7,5,2,l);R(x+w-6,y+7,5,2,l);
  R(x+2,y+24,w-4,4,OL);R(x+3,y+24,w-6,3,d);R(x+4,y+28,2,2,OL);R(x+w-6,y+28,2,2,OL)}                   // base=y+30，坐垫 y+19
function lamp(x,y,on){grid(x,y,["..oooooo..",".oyyyyyyo.",".oyyyyyyo.","oyyyyyyyyo","oooooooooo"],{o:OL,y:on?'#ffe08a':'#efdcb8'});
  R(x+4,y+5,2,31,OL);R(x+1,y+36,8,2,OL)}                                                               // base=y+38
function catTree(x,y,t){const post=(px,y1,y2)=>{R(px,y1,7,y2-y1,OL);R(px+1,y1,5,y2-y1,'#d9b98a');for(let j=y1+1;j<y2;j+=2)R(px+1,j,5,1,'#c4a26f')};
  const plat=(px,py,w)=>{R(px,py,w,7,OL);R(px+1,py+1,w-2,3,'#b8a0d8');R(px+1,py+4,w-2,2,'#8a70b0')};
  box(x,y+62,32,8,'#b8a0d8');R(x+1,y+66,30,3,'#8a70b0');post(x+18,y+12,y+62);post(x+5,y+38,y+62);
  plat(x,y+34,22);plat(x+8,y+8,24);
  const a=Math.sin(t*2.2)*3,bx=Math.round(x+29+a);line(x+29,y+15,bx,y+25,'#d9d2c4');yarnBall(bx,y+27,2,3)}             // base=y+70，顶层落脚 y+12，中层 y+38
function cardbox(x,y,state,t,bi=4){R(x+3,y,16,4,OL);R(x+4,y+1,14,2,'#c49656');R(x,y+3,22,4,OL);R(x+1,y+4,20,2,'#6e4a28');
  if(state){C.save();C.beginPath();C.rect(x-6,y-24,34,38);C.clip();cat('sit',bi,x+11,state===1?y+14:y+19,t);C.restore()}
  R(x,y+6,22,10,OL);R(x+1,y+7,20,8,'#d6a868');R(x+1,y+7,20,1,'#e8c088');R(x+9,y+7,4,8,'#eadcb8');R(x-3,y+4,4,3,OL);R(x-2,y+5,3,1,'#c49656');R(x+21,y+4,4,3,OL);R(x+21,y+5,3,1,'#c49656')}   // base=y+16
function plant(x,y,t,shake=0){const s=shake?Math.round(Math.sin(t*30)):0,L=[[7,5,5,4],[3,10,4,3],[11,10,4,3],[5,2,3,3],[10,3,3,3]];
  L.forEach(([a,b,rx,ry])=>disc(x+a+s,y+b,rx+1,ry+1,OL));L.forEach(([a,b,rx,ry],i)=>{disc(x+a+s,y+b,rx,ry,i%2?'#4a8a4e':'#5ea85e');P1(x+a+s-1,y+b-1,'#8cd08a')});
  R(x+2,y+14,11,10,OL);R(x+3,y+16,9,7,'#c46a44');R(x+2,y+14,11,3,OL);R(x+3,y+15,9,1,'#e08a5a')}         // base=y+24
// 斜照进来的光：白天、黄昏是阳光（带浮尘），夜里是月光（淡蓝、没有浮尘）
function sunbeam(x,y,w,h,shift,t,tod){const night=tod==='night',col=night?'#e4ecff':tod==='dusk'?'#ffb070':'#fff3b0';
  alpha(night?.22:tod==='dusk'?.24:.3,()=>{for(let j=0;j<h;j++){const o=Math.round(j*shift/h);R(x+o,y+j,Math.floor(w/2)-1,1,col);R(x+o+Math.floor(w/2)+1,y+j,Math.ceil(w/2)-1,1,col)}});
  if(!night)alpha(.8,()=>{for(let i=0;i<4;i++){const k=(t*.15+i*.27)%1;P1(x+Math.round(k*shift+w*(i/4)),y+Math.round(h*(1-k)),'#fff8d8')}})}

/* ---------- 毛线球：从门外进来，被解开，织成小物件 ---------- */
// 五种毛线：[主色, 暗边, 高光]；YARN 也直接喂给 drawCat 的 yarn 选项，让玩球动作里的毛线同色
const YARN=[['#e0533d','#9e2f2a','#f7a58c'],['#5B9BD5','#34618f','#a8d0f0'],['#9B7EBD','#654a86','#d0bce4'],['#5B8C5A','#35593a','#9ccc98'],['#e8b83a','#9a7414','#fff0a8']];
const YARNC=YARN.map(([a,,l])=>[a,l]);
// spin 0/1 交替就是在滚
function yarnBall(cx,cy,r,ci=0,spin=0){const [a,b]=YARNC[ci%YARNC.length];disc(cx,cy,r+1,r+1,OL);disc(cx,cy,r,r,a);if(r<2){P1(cx-1,cy-1,b);return}
  if(spin%2){line(cx+r-1,cy,cx,cy-r+1,b);line(cx+1,cy+r-1,cx-r+1,cy-1,b)}else{line(cx-r+1,cy,cx,cy-r+1,b);line(cx-1,cy+r-1,cx+r-1,cy-1,b)}}
function spark(x,y,t){if(Math.floor(t*3)%2)return;P1(x,y-1,'#ffd84a');P1(x-1,y,'#ffd84a');P1(x+1,y,'#ffd84a');P1(x,y+1,'#ffd84a');P1(x,y,'#fff')}
// 毛线篮：balls 是篮子里每颗毛线球的颜色序号（最多画 6 颗），最上面那颗挂着人类写的便签。base=y+18
const BASKET_POS=[[7,6],[14,6],[21,6],[10,2],[18,2],[14,-2]];
function yarnBasket(x,y,balls,t){const n=Math.min(balls.length,6);for(let i=0;i<n;i++)yarnBall(x+BASKET_POS[i][0],y+BASKET_POS[i][1],3,balls[i]);
  if(n){const [bx,by]=BASKET_POS[n-1];line(x+bx+2,y+by-3,x+bx+3,y+by-5,'#d9d2c4');R(x+bx+3,y+by-9,6,5,OL);R(x+bx+4,y+by-8,4,3,'#fff8e0');R(x+bx+5,y+by-7,2,1,'#b9a8c9')}
  R(x,y+7,28,11,OL);R(x+1,y+8,26,9,'#c9954e');for(let j=0;j<4;j++)for(let i=(j%2)*2;i<26;i+=4)R(x+1+i,y+9+j*2,2,1,'#a8783a');R(x+1,y+8,26,1,'#dcae6a');
  R(x-2,y+8,3,3,OL);R(x+27,y+8,3,3,OL);if(n)spark(x+29,y+2,t)}
// 织好的小物件。(x,y) 为顶边中点（夹子夹的位置）
const KNIT={
  scarf:["oooo","oaao","obbo","oaao","oaao","obbo","oaao","oooo","a..a"],
  hat:["..ooo..",".obbbo.","..obo..",".oaaao.","oaaaaao","oaaaaao","obbbbbo","obobobo","ooooooo"],
  mitten:[".oooo..","oaaaao.","oaaaaoo","oaaaaao","oaaaaoo","oaaaao.","obbbbo.","oooooo."],
  sock:["ooooo..","obbbo..","oaaao..","oaaao..","oaaaooo","oaaaaao","oaaaaao",".oooooo"],
  sweater:[".oo...oo.","oaaoooaao","oaaaaaaao","ooaaaaaoo",".oaaaaao.",".oaaaaao.",".obbbbbo.",".ooooooo."],
  flag:["ooooooo","oaaaaao",".oaaao.",".obbbo.","..oao..","...o..."]};
const KNIT_NAMES={scarf:['围巾','条'],hat:['毛线帽','顶'],mitten:['手套','只'],sock:['袜子','只'],sweater:['小毛衣','件'],flag:['三角旗','面']};
function knit(kind,x,y,ci=0){const g=KNIT[kind],[a,,l]=YARN[ci%YARN.length];grid(x-Math.floor(g[0].length/2),y,g,{o:OL,a,b:l})}
// 橱窗晾衣绳：slots[i] = {kind,ci} 或空，n 个位置均匀排开；lineSlot 给出第 i 个夹子的位置（飘心从那里起）
const lineSag=(x0,y0,w,x)=>y0+Math.round(2.5*(1-((x-x0-w/2)/(w/2))**2));
const lineSlot=(x0,y0,w,i,n=5)=>{const x=Math.round(x0+w*(i+.5)/n);return{x,y:lineSag(x0,y0,w,x)}};
function clothesline(x0,y0,w,slots,n=5){for(let x=x0;x<x0+w;x++)P1(x,lineSag(x0,y0,w,x),'#8a5a3a');
  for(let i=0;i<n;i++){const it=slots[i];if(!it)continue;const {x,y}=lineSlot(x0,y0,w,i,n);knit(it.kind,x,y+1,it.ci);R(x,y-1,1,3,'#e8b83a')}}
// 人类取走了成品：窗外飘起一颗心，k 0→1
function heartUp(x,y,k){alpha(k<.6?1:Math.max(0,(1-k)/.4),()=>drawEmote(C,x,Math.round(y-k*16),'heart',0))}
// 毛线球织成小物件时冒的一团烟，k 0→1
function puff(x,y,k){alpha(Math.max(0,1-k),()=>[[-1,-.6],[1,-.6],[-1,.6],[1,.6],[0,-1],[0,1]].forEach(([a,b])=>{const d=2+k*7,r=k<.5?2:1;disc(Math.round(x+a*d),Math.round(y+b*d*.8),r,r,'#fff4dc')}))}
// 便签：人类写的委托。只露字，不露人
function noteCard(x,y,w=16,h=12){box(x,y,w,h,'#fff8e0');for(let j=3;j<h-2;j+=3)R(x+2,y+j,w-5-(j%2)*2,1,'#b9a8c9');R(x+w-5,y-1,2,3,'#e0533d')}

/* ---------- 店里的机器（没有人类，只好自动） ---------- */
// 扫地机器人：店里唯一的"员工"。(x,y) 左上 16×8，base=y+8，顶面落脚 y+4；dir 1 朝右 / -1 朝左，moving 时前面的边刷在转
const VAC=["....oooooooo....","..oowwwwwwwwoo..",".owwllwwwwwwwwo.","owwlwwwwwwwwwwwo","owwwwwwwwwwwwwwo","oggggggggggggggo",".oddddddddddddo.","..oooooooooooo.."];
function vacuum(x,y,t,{dir=1,moving=0,led='#7ee08a'}={}){grid(x,y,VAC,{o:OL,w:'#e9edf1',l:'#ffffff',g:'#aab3bc',d:'#7d8791'});
  R(x+6,y+3,4,1,'#cfd5db');R(dir>0?x+11:x+3,y+2,2,1,led);
  if(moving){const bx=dir>0?x+15:x,by=y+7,f=Math.floor(t*14)%2,c='#8a8a96';P1(bx,by,'#4a4a56');if(f){P1(bx-1,by,c);P1(bx+1,by,c)}else{P1(bx,by-1,c);P1(bx,by+1,c)}}}
// 充电座：靠墙，(x,y) 左上 12×11，base=y+11；charging 时绿灯一闪一闪
function dock(x,y,t,charging){R(x+1,y,10,1,OL);R(x,y+1,12,9,OL);R(x+1,y+1,10,8,'#8f99a3');R(x+1,y+1,10,2,'#b9c2ca');R(x+3,y+4,6,3,'#5d6570');
  R(x+5,y+5,2,1,charging&&Math.floor(t*1.5)%2?'#7ee08a':'#2f4a36');R(x-1,y+9,14,2,OL);R(x,y+9,12,1,'#6d7680')}
// 自动喂食器（没有人类，只好自动出粮）：(x,y) 左上 14×24，base=y+22；level 粮桶余量 0-3，drop 出粮中。饭碗另画（feedBowls），吃饭的猫夹在两层之间
function feeder(x,y,t,{level=2,drop=0}={}){box(x+1,y+4,12,10,'#dff0f7');const k=level*3;if(k){R(x+2,y+13-k,10,k,'#b0703a');for(let i=0;i<k*2;i++)P1(x+2+((i*7)%10),y+13-k+((i*3)%k),'#8a5028')}R(x+2,y+5,1,8,'#ffffff');
  box(x,y+1,14,4,'#5B9BD5');R(x+1,y+2,12,1,'#a8d0f0');R(x+5,y,4,2,OL);
  box(x+1,y+13,12,9,'#fff4dc');R(x+3,y+15,6,3,'#2f3a34');P1(x+4,y+16,Math.floor(t*2)%2?'#8fe0a8':'#4a7a58');P1(x+6,y+16,'#8fe0a8');P1(x+10,y+16,level?'#8fe0a8':'#e0533d');R(x+5,y+22,4,2,OL);
  if(drop)for(let i=0;i<3;i++){const f=(t*3+i/3)%1;P1(x+6+(i%2),y+24+Math.floor(f*3),'#b0703a')}}
// 饭碗和水碗（接在喂食器下面）：(x,y) 与喂食器同一个左上角，base=y+30；food 碗里有粮
function feedBowls(x,y,t,{food=1}={}){R(x-2,y+25,40,4,'#f4a6b8');R(x-2,y+28,40,1,'#e27a8f');
  R(x,y+24,14,6,OL);R(x+1,y+25,12,3,'#5B9BD5');R(x+1,y+25,12,1,'#a8d0f0');R(x+2,y+28,10,1,'#34618f');
  if(food){R(x+3,y+24,8,2,'#b0703a');P1(x+5,y+24,'#d0904a');P1(x+8,y+25,'#d0904a');P1(x+6,y+23,'#b0703a')}
  R(x+20,y+24,14,6,OL);R(x+21,y+25,12,3,'#e0533d');R(x+21,y+25,12,1,'#a8e0f8');R(x+22,y+28,10,1,'#9e2f2a');if(Math.floor(t*1.2)%3===0)P1(x+26,y+25,'#ffffff')}
// 鱼缸 + 矮柜：(x,y) 左上 28×30，base=y+30；paw 猫爪伸过来时，鱼躲到最里面
function fishTank(x,y,t,{paw=0}={}){box(x,y+16,28,14,'#9a6448');R(x+1,y+17,26,1,'#b87a58');R(x+13,y+19,1,9,'#7a4c36');P1(x+11,y+23,'#ffd84a');P1(x+15,y+23,'#ffd84a');
  box(x+1,y,26,17,'#9fd6ec');R(x+2,y+1,24,2,'#cfeef8');R(x+2,y+13,24,3,'#e6d49a');P1(x+7,y+13,'#c9b070');P1(x+19,y+14,'#c9b070');
  for(let j=0;j<9;j++)P1(x+5+(j%2)+(j>4?Math.round(Math.sin(t*2+j)):0),y+12-j,'#4a9a5a');for(let j=0;j<6;j++)P1(x+22+(j%2),y+12-j,'#5ea85e');
  for(let i=0;i<3;i++){const k=(t*.8+i/3)%1;P1(x+18+Math.round(Math.sin(k*9+i)),y+12-Math.floor(k*10),'#eaf8ff')}
  const fish=(fx,fy,d,col)=>{fx=Math.round(fx);fy=Math.round(fy);R(fx-1,fy,3,2,col);P1(fx-2*d,fy,col);P1(fx-3*d,fy-1,col);P1(fx-3*d,fy+1,col);P1(fx+d,fy,'#241a2e')};
  if(paw){fish(x+6,y+8,-1,'#f08a4a');fish(x+9,y+5,-1,'#ffd84a')}
  else{const a=t*.7,b=t*.5+2;fish(x+14+Math.sin(a)*8,y+7+Math.sin(t*1.9)*1.5,Math.cos(a)>=0?1:-1,'#f08a4a');fish(x+14+Math.sin(b)*8,y+10+Math.sin(t*1.3+1),Math.cos(b)>=0?1:-1,'#ffd84a')}
  R(x,y-1,28,2,OL);R(x+1,y-1,26,1,'#6b7480')}
// 猫薄荷鱼抱枕：(x,y) 左上 11×5，base=y+5；used 被闻过，冒两片小叶子
function catnip(x,y,t,used=0){grid(x,y,["..ooooo...o",".ogggggo.oo",".egkgkggooo",".ogggggo.oo","..ooooo...o"],{o:OL,g:'#7cc48a',k:'#4f9a5e',e:'#241a2e'});P1(x+1,y+2,OL);
  if(used)for(let i=0;i<2;i++){const k=(t*.9+i/2)%1;alpha(1-k,()=>{P1(x+3+i*4+Math.round(Math.sin(k*6)),y-2-Math.round(k*8),'#7cc48a');P1(x+4+i*4+Math.round(Math.sin(k*6)),y-2-Math.round(k*8),'#4f9a5e')})}}
// 小鸟：停在窗外的麻雀。(x,y) 为脚底中点；dir 1 朝右；fly 时扇翅膀、不落脚
const BIRD=["...oooo..","..obbbbo.","oobbbbbey",".obllbbo.","..olllo..","...o.o..."];
function bird(x,y,t,{dir=1,fly=0}={}){const hop=!fly&&Math.floor(t*2.5)%3===0?1:0,rows=fly?BIRD.slice(0,5):BIRD,g=dir>0?rows:rows.map(r=>[...r].reverse().join(''));
  grid(x-4,y-6-hop,g,{o:'#4a3020',b:'#9a6a42',l:'#ecdcc4',e:'#241a2e',y:'#e8b83a'});
  if(fly){const f=Math.floor(t*12)%2;R(x-1,y-7-hop-(f?1:-2),3,1,'#6a4a30')}}

/* ---------- 猫 ---------- */
// 姿态表 POSE、每只猫的性格 PERSONA、drawCat 都在 cat-sprites.js（v2）里；这里只包一层，画到当前画布 C 上
function cat(k,bi,x,y,t,o=0,face='R',ex,yarn,mirror){return drawCat(C,k,bi,x,y,t,{o,face,ex,yarn,mirror})}

/* ---------- 昼夜 ---------- */
const GLOW={};
function glowTex(r,col){const k=r+col;if(GLOW[k])return GLOW[k];const c=document.createElement('canvas');c.width=c.height=r*2;const g=c.getContext('2d'),gr=g.createRadialGradient(r,r,0,r,r,r);
  gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,r*2,r*2);return GLOW[k]=c}
// 夜色：整屏乘一层颜色（tint，屋里点着灯，暖一点、亮一点），out 是屋外的几块（{rects:[[x,y,w,h]…], tint}，冷一点、暗一点），再把灯光叠上去
function applyTod(w,h,tod,lights=[],tint,out){if(tod==='day')return;C.save();C.globalCompositeOperation='multiply';const base=tod==='dusk'?'#ffd6b4':tint||'#6c68a8';
  if(tod==='night'&&out&&out.rects.length){C.save();C.beginPath();C.rect(0,0,w,h);out.rects.forEach(r=>C.rect(r[0],r[1],r[2],r[3]));C.clip('evenodd');C.fillStyle=base;C.fillRect(0,0,w,h);C.restore();
    C.fillStyle=out.tint||'#6c68a8';out.rects.forEach(r=>C.fillRect(r[0],r[1],r[2],r[3]))}
  else{C.fillStyle=base;C.fillRect(0,0,w,h)}
  C.globalCompositeOperation='lighter';lights.forEach(l=>{if(l.when&&l.when!==tod)return;C.globalAlpha=(tod==='dusk'?.35:.55)*(l.a||1);C.drawImage(glowTex(l.r,l.col),l.x-l.r,l.y-l.r)});C.restore()}
