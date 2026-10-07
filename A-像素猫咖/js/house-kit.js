/* 1024 猫咖 · 三层楼的室内零件：几种地面和墙、大毛线篮、吧台和咖啡机、咖啡桌椅、吊灯、楼梯、天井、舞台、门洞招牌、大号合并门禁。
   依赖 scene-kit.js、world-kit.js、world4-kit.js（画笔 R/P1/box/disc/grid/line/txt 和老零件都直接用）。
   约定同前：(x,y) 为左上角，注释里的 base 是落地的 y，用来和猫按 y 排序；画法同一套：一个像素一格、深色描边、不用平滑的线。 */

/* ---------- 大块纹理：fn(i,j) 返回调色板下标（-1 不画）。只在底图里用：putImageData 不管画布变换 ---------- */
const hexRGBk=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function texFill(x,y,w,h,pal,fn){x=Math.round(x);y=Math.round(y);if(w<=0||h<=0)return;const img=C.getImageData(x,y,w,h),d=img.data,P=pal.map(hexRGBk);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=fn(i,j);if(k<0||k==null)continue;const c=P[k],o=(j*w+i)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255}C.putImageData(img,x,y)}

/* ---------- 地面 ---------- */
// 长条木地板，几种颜色：[浅, 深, 缝, 疤]
const PLANK={honey:['#c98d5c','#c28553','#a86e44','#b3784a'],pale:['#ead0a2','#e2c694','#c4a272','#d8bb88'],plum:['#5e3e60','#573859','#3a2440','#6e4e70'],
  board:['#b98a5c','#b08052','#7e5636','#a47448'],deck:['#9c7c60','#947458','#6a4e3c','#aa8c70'],dark:['#8a5e3e','#82583a','#5e3e28','#966a48']};
function floorPlanks(x,y,w,h,k='honey',len=44){const pal=PLANK[k],rows=new Map();
  const seams=r=>{let m=rows.get(r);if(m)return m;m=new Uint8Array(w+1);let X=Math.floor(hsh(r,1)*len)-len;for(let n=0;X<x+w;n++){if(X>=x)m[X-x]=1;X+=Math.round(len*(.7+hsh(r,n+2)*.8))}rows.set(r,m);return m};
  texFill(x,y,w,h,pal,(i,j)=>{const r=Math.floor((j+y)/6),jj=(j+y)%6;if(jj===5)return 2;if(seams(r)[i])return 2;
    if(jj===2&&hsh(i+x,r*7)<.05)return 3;return r%2})}
// 人字拼（咖啡厅）：每 8 列换一个方向的斜条，拼成一行行 V
function floorHerring(x,y,w,h){texFill(x,y,w,h,['#c8925e','#bb8654','#9a6a42','#d6a26c'],(i,j)=>{const X=i+x,Y=j+y,c=Math.floor(X/8),u=X%8,d=(c%2?Y+u:Y-u+8),s=Math.floor(d/4);
  if(((d%4)+4)%4===0)return 2;if(u===0&&(s%3===0))return 2;return(s+c)%2?1:((d%4)===1&&(s%5===0)?3:0)})}
// 格子砖（吧台）：黑白相间，白砖左上一道亮边
function floorChecker(x,y,w,h,s=8){texFill(x,y,w,h,['#2f2a36','#3a3442','#ece4d6','#fffaf0','#d4cab8'],(i,j)=>{const X=i+x,Y=j+y,a=Math.floor(X/s),b=Math.floor(Y/s),u=X%s,v=Y%s,wh=(a+b)%2===0;
  if(wh)return u===0||v===0?3:(u===s-1||v===s-1?4:2);return u===0||v===0?1:0})}
// 石板（楼梯间）：一行行长短不一的石板，缝是深灰
function floorSlate(x,y,w,h){texFill(x,y,w,h,['#8e8a92','#86828b','#97939a','#7d7982','#5e5a63','#aaa6ad'],(i,j)=>{const Y=j+y,r=Math.floor(Y/10),v=Y%10;if(v===9)return 4;
  let X=i+x+Math.floor(hsh(r,3)*14),k=0;while(true){const sw=12+Math.floor(hsh(r,k+11)*9);if(X<sw)return X===sw-1?4:(v===0?5:Math.floor(hsh(r,k+40)*4));X-=sw;k++}})}
// 胶地板（工坊）：深灰方砖，每块中间一颗防滑点
function floorRubber(x,y,w,h){texFill(x,y,w,h,['#4b5163','#474d5e','#3a3f4d','#59607a'],(i,j)=>{const X=i+x,Y=j+y,u=X%10,v=Y%10;if(u===0||v===0)return 2;if((u===5&&v===5)||(u===4&&v===5))return 3;return(Math.floor(X/10)+Math.floor(Y/10))%2})}
// 软地毯（午睡角）：底色上稀稀落落的绒点
function floorCarpet(x,y,w,h,a='#c9b8dc',b='#bba8d0',c='#d8cae8'){texFill(x,y,w,h,[a,b,c],(i,j)=>{const r=hsh(i+x,j+y);return r<.12?1:r<.18?2:0})}
// 深色拼花（图书馆、二楼回廊用 board）
function floorParquetDark(x,y,w,h){texFill(x,y,w,h,['#7a5236','#6e4a30','#553823','#8a6040'],(i,j)=>{const X=i+x,Y=j+y,bx=Math.floor(X/12),by=Math.floor(Y/12),u=X%12,v=Y%12,hz=(bx+by)%2===0;
  if(u===0||v===0)return 2;if(hz)return v%4===0?2:(v%4===1?3:0);return u%4===0?2:(u%4===1?3:1)})}

/* ---------- 墙 ---------- */
// 地铁砖（吧台）：青绿色小长砖，上面一道木线，下面踢脚
function wallTiles(x,y,w,h){R(x,y,w,h,'#5a9a90');for(let j=0,yy=y+4;yy<y+h-8;yy+=5,j++)for(let xx=x-(j%2)*5;xx<x+w;xx+=10){const a=Math.max(x,xx+1),b=Math.min(x+w,xx+10);R(a,yy,b-a,4,hsh(xx,j)<.2?'#8fd0c4':'#7fc4b8');if(a===xx+1)P1(a,yy,'#b4e4dc')}
  R(x,y,w,4,'#8a5a3a');R(x,y,w,1,'#5a3a2a');R(x,y+3,w,1,'#6e4430');R(x,y+h-8,w,6,'#3a5a56');R(x,y+h-8,w,1,'#6aa49a');R(x,y+h-2,w,2,'#4a2e22')}
// 灰泥墙（咖啡厅）：暖色抹灰，下半截一道木护墙板
function wallPlaster(x,y,w,h,a='#e8b48c',b='#dda47c'){R(x,y,w,h,a);for(let i=0;i<w*h/22;i++){const px=x+Math.floor(hsh(i,61)*w),py=y+2+Math.floor(hsh(i,62)*(h-16));P1(px,py,b)}
  R(x,y,w,2,'#5a3a2a');const wy=y+h-14;R(x,wy,w,12,'#8a5a3a');R(x,wy,w,1,'#b07a52');R(x,wy+1,w,1,'#6e4430');for(let i=x+2;i<x+w-12;i+=14){R(i,wy+3,11,7,'#7a4c32');R(i,wy+3,11,1,'#9a6a46')}
  R(x,y+h-2,w,2,'#4a2e22')}
// 木护墙（二楼回廊）：竖着的木板
function wallPanel(x,y,w,h){R(x,y,w,h,'#a87a52');for(let i=x;i<x+w;i+=7){R(i,y+2,1,h-4,'#7e5636');R(i+1,y+2,1,h-4,'#c0946a')}R(x,y,w,3,'#5a3a2a');R(x,y+3,w,1,'#c8a07a');R(x,y+h-6,w,4,'#6e4a30');R(x,y+h-2,w,2,'#4a2e22')}
// 舞台后墙：深靛蓝，星星点点，两边一道幕布
function wallStage(x,y,w,h){R(x,y,w,h,'#2a2350');for(let i=0;i<w*h/30;i++){const px=x+Math.floor(hsh(i,71)*w),py=y+3+Math.floor(hsh(i,72)*(h-10));P1(px,py,hsh(i,73)<.25?'#ffd84a':'#5a4e8a')}
  R(x,y,w,2,'#5a3a2a');R(x,y+h-2,w,2,'#1a1430');[x,x+w-14].forEach(cx=>{R(cx,y+2,14,h-4,'#8a2a3a');for(let i=cx+2;i<cx+14;i+=4)R(i,y+2,1,h-4,'#6a1a2a');R(cx,y+2,14,2,'#c8a050')})}
// 室内砖墙（楼梯间）：和外墙一样的红砖，没有石头墙脚
function wallBrickIn(x,y,w,h){R(x,y,w,h,'#8e4a3c');for(let j=0,yy=y+2;yy<y+h-4;yy+=5,j++)for(let xx=x-(j%2)*6;xx<x+w;xx+=12){const a=Math.max(x,xx+1),b=Math.min(x+w,xx+12);R(a,yy,b-a,4,hsh(xx,j+50)<.3?'#a85a48':'#b4654f');if(a===xx+1)P1(a,yy,'#c47a62')}
  R(x,y,w,2,'#5a3a2a');R(x,y+h-4,w,2,'#6e4430');R(x,y+h-2,w,2,'#4a2e22')}

/* ---------- 门厅：大毛线篮 ---------- */
// 大毛线篮：最多画 9 颗毛线球，最上面那颗挂着便签。40×24，base=y+24
const BIG_POS=[[9,12],[17,13],[25,12],[32,12],[13,8],[21,8],[29,8],[17,4],[25,4]];
function bigBasket(x,y,balls,t){const n=Math.min(balls.length,9);
  disc(x+20,y+12,20,5,OL);disc(x+20,y+12,19,4,'#7a5428');
  for(let i=0;i<n;i++)yarnBall(x+BIG_POS[i][0],y+BIG_POS[i][1],3,balls[i],i);
  if(n){const [bx,by]=BIG_POS[n-1];line(x+bx+2,y+by-3,x+bx+3,y+by-5,'#d9d2c4');R(x+bx+3,y+by-9,7,6,OL);R(x+bx+4,y+by-8,5,4,'#fff8e0');R(x+bx+5,y+by-7,3,1,'#b9a8c9');R(x+bx+5,y+by-5,2,1,'#b9a8c9')}
  for(let j=0;j<11;j++){const ins=Math.round(j*j/30),yy=y+13+j;R(x+ins,yy,40-ins*2,1,OL);if(j<10)for(let i=x+ins+1;i<x+39-ins;i++){const u=(i-x+(j%2)*2)%4;P1(i,yy,j===0?'#e2b676':u<2?'#c9954e':'#a8783a')}}
  for(let i=0;i<40;i++){const d=Math.round(Math.sqrt(Math.max(0,1-((i-20)/20)**2))*4);P1(x+i,y+12+d,'#e2b676');P1(x+i,y+13+d,OL)}
  R(x-2,y+13,4,5,OL);R(x-1,y+14,2,3,'#c9954e');R(x+38,y+13,4,5,OL);R(x+39,y+14,2,3,'#c9954e');if(n)spark(x+42,y+4,t)}
// 门洞招牌居中：cx 门洞中线
function signOver(cx,y,label,icon,col){const ic=icon&&SIGN_IC[icon],iw=ic?Math.max(...ic.map(r=>r.length))+3:0,w=txtW(label)+iw+8;return signBoard(Math.round(cx-w/2),y,label,icon,col)}
// 竖墙（侧墙）上的门洞：招牌用一根铁架从墙头挑出来，两根链子挂在铁架上（wallX 是墙的那一边；原来只画了往上的链子，看着悬在半空）
function signSide(cx,y,label,icon,wallX,col){const ic=icon&&SIGN_IC[icon],iw=ic?Math.max(...ic.map(r=>r.length))+3:0,w=txtW(label)+iw+8,x=Math.round(cx-w/2),a=Math.min(wallX,x-3),b=Math.max(wallX,x+w+2);
  R(a,y-3,b-a+1,2,OL);R(a+1,y-3,b-a-1,1,'#8a8a98');R(wallX-1,y-6,3,8,OL);R(wallX,y-5,1,6,'#6a6a78');const far=wallX<x?b:a;P1(far,y-4,OL);P1(far+(wallX<x?1:-1),y-5,OL);P1(far+(wallX<x?1:-1),y-6,OL);
  const d=wallX<x?-1:1;for(let i=1;i<=5;i++)P1(wallX-d*i,y-1+Math.round(i*.8),OL);R(x+3,y-1,1,1,OL);R(x+w-4,y-1,1,1,OL);return signBoard(x,y,label,icon,col)}

/* ---------- 吧台 ---------- */
// 后吧台：靠墙的柜子，台面上摆东西，墙上两层架子放杯子和咖啡豆。(x,y) 是台面左上角，w 宽，base=y+22
function backBar(x,y,w,sw=w){R(x,y-34,sw,3,OL);R(x+1,y-34,sw-2,2,'#a8703f');R(x,y-18,sw,3,OL);R(x+1,y-18,sw-2,2,'#a8703f');
  for(let i=x+4;i<x+sw-6;i+=9){const k=Math.floor(hsh(i,5)*3);if(k===0){R(i,y-41,6,7,OL);R(i+1,y-40,4,6,'#fff4dc');R(i+1,y-38,4,1,'#e0533d')}else if(k===1){R(i+1,y-42,5,8,OL);R(i+2,y-41,3,7,'#6a3a22');R(i+2,y-41,3,1,'#e8dccb')}else{R(i,y-39,7,5,OL);R(i+1,y-38,5,3,'#f4f0e8');R(i+6,y-38,2,2,OL)}}
  for(let i=x+3;i<x+sw-6;i+=8){R(i,y-24,6,6,OL);R(i+1,y-23,4,5,YARNC[Math.floor(hsh(i,7)*5)][0]);R(i+1,y-23,4,1,'#ffffff')}
  R(x,y,w,22,OL);R(x+1,y+1,w-2,4,'#e8e0d0');R(x+1,y+1,w-2,1,'#ffffff');R(x+1,y+5,w-2,1,OL);R(x+1,y+6,w-2,15,'#6e4a32');for(let i=x+2;i<x+w-2;i+=16){R(i,y+8,14,11,'#5e3e28');R(i,y+8,14,1,'#8a5e3e');P1(i+7,y+13,'#d8b04a')}}
// 前吧台：大理石台面、木头竖条的前脸、底下一道踢脚板。(x,y) 左上，base=y+h，台面落脚 y+3
function barCounter(x,y,w,h=26){R(x,y,w,h,OL);R(x+1,y+1,w-2,5,'#f0ece4');R(x+1,y+1,w-2,1,'#ffffff');for(let i=0;i<w/6;i++)P1(x+2+Math.floor(hsh(i,81)*(w-4)),y+2+Math.floor(hsh(i,82)*3),'#c8c0b8');R(x+1,y+6,w-2,1,OL);
  R(x+1,y+7,w-2,h-11,'#8a5a3a');for(let i=x+3;i<x+w-2;i+=4)R(i,y+8,1,h-13,'#6e4430');R(x+1,y+7,w-2,1,'#b07a52');R(x+1,y+h-4,w-2,3,'#3a2a2a');R(x+1,y+h-4,w-2,1,'#c8a050')}
// 大咖啡机：两个冲煮头、一根蒸汽棒、顶上暖着一排杯子。40×28，放在台面上；brew 时滴咖啡、冒蒸汽
function espresso(x,y,t,brew=0){for(let i=0;i<4;i++){R(x+5+i*8,y,6,5,OL);R(x+6+i*8,y+1,4,3,'#fff4dc')}R(x+1,y+4,38,3,OL);R(x+2,y+5,36,1,'#c8d0d8');
  R(x,y+7,40,21,OL);R(x+1,y+8,38,19,'#b8c2cc');R(x+1,y+8,38,2,'#e4eaf0');R(x+1,y+8,2,19,'#dfe6ec');R(x+36,y+8,2,19,'#8e98a4');R(x+1,y+24,38,3,'#7a848e');
  R(x+15,y+10,10,6,OL);R(x+16,y+11,8,4,'#241a2e');txt('1024',x+16,y+11,brew?'#ffd84a':'#7ee08a');disc(x+8,y+13,3,3,OL);disc(x+8,y+13,2,2,'#fff4dc');P1(x+8,y+12,'#e0533d');disc(x+32,y+13,3,3,OL);disc(x+32,y+13,2,2,'#fff4dc');P1(x+33,y+13,OL);
  [10,26].forEach(gx=>{R(x+gx-1,y+17,6,3,OL);R(x+gx,y+18,4,1,'#5a6470');R(x+gx-3,y+19,10,2,OL);R(x+gx-2,y+19,8,1,'#2a2a34')});R(x+37,y+17,2,9,OL);R(x+38,y+26,2,2,OL);
  if(brew){[12,28].forEach(gx=>{if(Math.floor(t*8)%2)P1(x+gx,y+22,'#6a3a22');P1(x+gx,y+23,'#6a3a22')});steam(x+39,y+15,t,4)}else steam(x+20,y-1,t,1)}
// 拉花咖啡：杯面上一张猫脸。8×6，(x,y) 左上
function latte(x,y){R(x,y+1,8,5,OL);R(x+1,y+2,6,3,'#fff4dc');R(x+1,y+1,6,1,'#c8956a');P1(x+2,y+1,'#fff4dc');P1(x+5,y+1,'#fff4dc');P1(x+3,y+2,'#8a5a3a');P1(x+4,y+2,'#8a5a3a');R(x+8,y+2,1,2,OL)}
// 蛋糕柜：玻璃柜两层，草莓蛋糕、圆蛋糕、马卡龙；下面一节木柜。36×36，base=y+36
function cakeCase(x,y,t){R(x,y,36,24,OL);R(x+1,y+1,34,22,'#dff2f8');R(x+1,y+1,34,1,'#ffffff');R(x+1,y+11,34,1,'#a8c8d8');R(x+2,y+2,1,20,'#ffffff');
  [[4,'#fff4dc','#f4a6b8'],[13,'#f8e0b8','#e0533d'],[22,'#5a3a2a','#8a5a3a']].forEach(([cx,a,b])=>{R(x+cx,y+6,7,5,OL);R(x+cx+1,y+7,5,3,a);R(x+cx+1,y+8,5,1,b);P1(x+cx+3,y+5,'#e0533d')});
  disc(x+30,y+8,3,2,OL);disc(x+30,y+8,2,1,'#e8b83a');[[5,'#f4a6b8'],[11,'#a8d0f0'],[17,'#9ccc98'],[23,'#fff0a8'],[29,'#d0bce4']].forEach(([cx,c])=>{R(x+cx,y+17,5,4,OL);R(x+cx+1,y+18,3,1,c);R(x+cx+1,y+19,3,1,'#fff4dc');R(x+cx+1,y+20,3,1,c)});
  if(Math.floor(t*.5)%5===0)P1(x+8+Math.floor(t*3)%20,y+3,'#ffffff');
  R(x,y+24,36,12,OL);R(x+1,y+25,34,10,'#8a5a3a');R(x+1,y+25,34,1,'#b07a52');R(x+17,y+26,1,8,'#6e4430');P1(x+15,y+30,'#d8b04a');P1(x+19,y+30,'#d8b04a')}
// 菜单板：墙上的小黑板。w×h
function menuBoard(x,y,w,h){box(x,y,w,h,'#8a5a3a');R(x+2,y+2,w-4,h-4,'#2f4a3a');txt('MENU',x+Math.floor((w-txtW('MENU'))/2),y+3,'#ffd84a');
  for(let j=0,yy=y+10;yy<y+h-4;yy+=5,j++){R(x+4,yy,Math.floor(w*.45),1,'#e8f0e0');for(let i=x+6+Math.floor(w*.45);i<x+w-8;i+=2)P1(i,yy,'#7a9a88');R(x+w-7,yy,3,1,'#f4a6b8')}}
// 高脚凳：圆凳面、一根柱子、一圈脚踏。10×20，base=y+20，凳面落脚 y+3
function barStool(x,y){disc(x+5,y+2,5,2,OL);disc(x+5,y+2,4,1,'#c8503c');P1(x+3,y+1,'#e8806a');R(x+4,y+4,3,14,OL);R(x+5,y+4,1,14,'#c8a050');R(x+1,y+12,9,2,OL);R(x+2,y+12,7,1,'#c8a050');disc(x+5,y+19,4,1,OL)}
// 咖啡桌：一张小圆桌（单脚），桌面落脚 y+4。28×20，base=y+20
function cafeTableRound(x,y){disc(x+14,y+4,14,5,OL);disc(x+14,y+4,13,4,'#f0e6d6');disc(x+14,y+3,12,3,'#fffaf0');R(x+3,y+7,22,1,'#c8b89a');R(x+12,y+9,4,9,OL);R(x+13,y+9,2,9,'#5a4a3a');disc(x+14,y+19,7,1,OL);R(x+9,y+18,10,1,'#5a4a3a')}
// 椅子：弯木椅，椅背在外侧（side=-1 椅背在左，猫面朝右坐）。12×18，base=y+18，椅面落脚 y+9
function cafeChair(x,y,side=-1){const bx=side<0?x:x+9;R(bx,y,3,13,OL);R(bx+1,y+1,1,11,'#8a5a3a');R(x,y+8,12,4,OL);R(x+1,y+9,10,2,'#a8703f');R(x+1,y+9,10,1,'#c98d5c');
  R(x+1,y+12,2,6,OL);R(x+9,y+12,2,6,OL);R(x+5,y+12,2,5,OL);R(x+2,y+15,8,1,'#6e4430')}
// 吊灯：从天花板垂下一根线，黄铜灯罩；夜里灯泡亮着。cord 线长，(x,y) 线的顶端
function pendant(x,y,cord,on){R(x,y,1,cord,'#3a2a2a');const sy=y+cord;R(x-5,sy,11,5,OL);R(x-4,sy+1,9,3,'#c8a050');R(x-4,sy+1,9,1,'#f0d080');R(x-2,sy+5,5,2,OL);R(x-1,sy+5,3,1,on?'#fff4c0':'#e8dcb8')}
// 墙上的壁灯
function sconce(x,y,on){R(x,y+4,6,2,OL);R(x+1,y,4,5,OL);R(x+2,y+1,2,3,on?'#ffe08a':'#e8dcb8');R(x+2,y+6,2,2,OL)}

/* ---------- 楼梯、天井、栏杆 ---------- */
// 上楼的楼梯（一楼）：从南往北一级级升上去，顶上是一个黑洞洞的楼梯口。(x,y) 左上 w×h，每级 10
function stairsUp(x,y,w,h){const n=Math.floor(h/10);R(x-2,y-30,w+4,32,OL);R(x,y-28,w,30,'#1a1220');for(let j=0;j<3;j++)R(x+2,y-26+j*8,w-4,5,'#241a2e');
  for(let i=0;i<n;i++){const sy=y+i*10,dk=Math.max(0,n-1-i)/n;R(x,sy,w,10,OL);R(x+1,sy+1,w-2,6,dk>.6?'#9a7050':'#c49460');R(x+1,sy+1,w-2,1,'#e0b07a');R(x+1,sy+7,w-2,2,'#6e4a30');
    for(let k=x+6;k<x+w-4;k+=13)R(k,sy+2,1,4,'#a8784a')}
  R(x-1,y,2,h,OL);R(x+w-1,y,2,h,OL);R(x+w+1,y,3,h,'#8a5a3a');R(x+w+1,y,1,h,'#b07a52')}
// 下楼的楼梯口（二楼）：地板上开着一个口，栏杆围着两边，台阶往南一级级降下去、越往下越暗
function stairsDown(x,y,w,h){R(x-2,y-2,w+4,h+4,OL);R(x,y,w,h,'#140e1a');const n=Math.floor(h/10);for(let i=0;i<n;i++){const sy=y+i*10,k=i/n;if(k>.85)break;
  const c=k<.3?'#b48858':k<.55?'#8a6444':'#5a4030';R(x+1,sy+1,w-2,6,c);R(x+1,sy+1,w-2,1,k<.3?'#d8a870':'#6e5038');R(x+1,sy+7,w-2,2,'#2a1e22')}
  R(x-2,y-2,w+4,2,'#6e4430');R(x-2,y-2,w+4,1,'#a8784a')}
// 栏杆：横的一段（从上往下看是一排柱子加扶手），base=y+12
function railH(x,y,w){R(x,y+9,w,3,OL);for(let i=x;i<=x+w-2;i+=6){R(i,y+1,2,10,OL);P1(i,y+2,'#c8946a')}R(x,y,w,3,OL);R(x+1,y+1,w-2,1,'#c8946a');R(x,y+10,w,1,'#8a5a3a')}
// 栏杆：竖的一段，从上往下看只看得到扶手顶和一排柱头
function railV(x,y,h){R(x,y,4,h,OL);R(x+1,y,2,h,'#a8784a');R(x+1,y,1,h,'#c8946a');for(let j=y;j<y+h;j+=8){R(x-1,j,6,3,OL);R(x,j+1,4,1,'#c8946a')}}
// 二楼的天井：地板上开的大口子，边上露出楼板的厚度；往下看是一楼咖啡厅暖暖的光、环形长凳和桌面
function wellHole(x,y,w,h){R(x-2,y-2,w+4,h+4,OL);R(x,y,w,h,'#1c1218');for(let j=0;j<h;j++){const k=j/h;if(k<.2)continue;const c=k<.45?'#2e1e1c':k<.7?'#4a2e24':'#6a4230';R(x+1,y+j,w-2,1,c)}
  const cx=x+Math.floor(w/2),by=y+h-10;disc(cx,by,Math.floor(w*.42),8,'#8a5a3a');disc(cx,by,Math.floor(w*.42)-3,6,'#5a3a26');[[-.42,.2],[.42,.2],[-.38,-.5],[.38,-.5]].forEach(([a,b])=>disc(cx+Math.round(a*w),by+Math.round(b*14)-6,6,2,'#c8b89a'));
  R(x,y,w,6,'#6e4430');R(x,y,w,1,'#a8784a');R(x,y+5,w,1,OL);R(x,y,4,h,'#4a2e22');R(x+w-4,y,4,h,'#3a2420')}

/* ---------- 门洞上的招牌：一块木牌，一个小图标加英文 ---------- */
const SIGN_IC={cup:["..o.o.","......","oooooo","owwwwoo","owwwwo.",".oooo."],book:["oooooo","owwrwo","owwrwo","owwrwo","oooooo"],gear:[".o.o.","ooooo","oo.oo","ooooo",".o.o."],
  sofa:["oooooo","owwwwo","oooooo","o....o"],star:["..o..",".ooo.","ooooo",".ooo.","o...o"],up:["..o..",".ooo.","ooooo","..o..","..o.."],down:["..o..","..o..","ooooo",".ooo.","..o.."],
  heart:[".o.o.","ooooo","ooooo",".ooo.","..o.."],moon:[".ooo..o","ooo....","oo.....","ooo....",".ooo..."],yarn:[".ooo.","oo.oo","o.o.o","oo.oo",".ooo."],paw:["o.o.o","....." ,".ooo.","ooooo",".ooo."]};
function signBoard(x,y,label,icon,col='#ffd84a'){const ic=icon&&SIGN_IC[icon],iw=ic?Math.max(...ic.map(r=>r.length))+3:0,w=txtW(label)+iw+8;
  R(x+3,y,1,4,OL);R(x+w-4,y,1,4,OL);R(x,y+4,w,11,OL);R(x+1,y+5,w-2,9,'#8a5a3a');R(x+1,y+5,w-2,1,'#b07a52');R(x+1,y+13,w-2,1,'#5e3e28');
  if(ic)grid(x+4,y+9-Math.floor(ic.length/2),ic,{o:col,w:'#8a5a3a',r:'#e0533d','.':null});txt(label,x+4+iw,y+7,'#fff4dc');return w}   // w×15

/* ---------- 1024 舞台 ---------- */
// 台子：深紫色台板，前脸一道金边，正中两级台阶。(x,y) 是台面左上角，w×h 台面，前脸 9，base=y+h+9
function stagePlatform(x,y,w,h){floorPlanks(x,y,w,h,'plum');R(x,y,w,1,'#7e5e80');R(x-1,y+h,w+2,10,OL);R(x,y+h+1,w,7,'#3a2440');R(x,y+h+1,w,1,'#c8a050');for(let i=x+6;i<x+w-4;i+=12)R(i,y+h+3,6,3,'#4a3050');
  const sx=x+Math.floor(w/2)-20;R(sx-1,y+h+8,42,10,OL);R(sx,y+h+9,40,3,'#6e4e70');R(sx,y+h+9,40,1,'#9a7e9c');R(sx+2,y+h+13,36,4,'#5e3e60')}
// 1024 大背板：木框，深色布面上满是小星星，正中一个大大的 1024，四周一圈串灯。w×h，base=y+h
function bigBackdrop(x,y,w,h,t){R(x-2,y-2,w+4,h+4,OL);R(x-1,y-1,w+2,h+2,'#8a5a3a');R(x+1,y+1,w-2,h-2,'#241c48');
  for(let i=0;i<w*h/26;i++){const px=x+3+Math.floor(hsh(i,3)*(w-6)),py=y+3+Math.floor(hsh(i,5)*(h-6));P1(px,py,(Math.floor(t*2)+i)%7?'#5a4e8a':'#ffd84a')}
  const s='1024',k=5,tw=txtW(s,k),tx=x+Math.floor((w-tw)/2),ty=y+Math.floor(h/2)-Math.floor(5*k/2)-3;txt(s,tx+2,ty+2,'#140e2a',k);txt(s,tx,ty,'#f4a6b8',k);
  const sub='CLOWDER  CAT  CAFE';txt(sub,x+Math.floor((w-txtW(sub))/2),ty+5*k+5,'#ffd84a');
  for(let i=0,n=Math.floor((w+h)*2/9);i<n;i++){const u=i/n,per=2*(w+h),d=u*per;let px,py;if(d<w){px=x+d;py=y}else if(d<w+h){px=x+w;py=y+d-w}else if(d<2*w+h){px=x+w-(d-w-h);py=y+h}else{px=x;py=y+h-(d-2*w-h)}
    const on=(Math.floor(t*3)+i)%3!==0;R(Math.round(px)-1,Math.round(py)-1,3,3,OL);P1(Math.round(px),Math.round(py),on?FEST_COL[i%5]:'#6a5a6a')}
  bunting(x+4,x+w-4,y+4,Math.floor((w-8)/3))}
const FEST_COL=['#ffd84a','#ff7a6a','#7ee08a','#6ac8ff','#f4a6b8'];   // 串灯、彩灯的五种颜色
// 聚光灯：三脚架上一盏灯，朝台上照。12×34，base=y+34；dir 1 朝右照
function spotlight(x,y,t,dir=1){line(x+6,y+12,x+1,y+33,OL);line(x+6,y+12,x+11,y+33,OL);line(x+6,y+12,x+6,y+33,'#5a5a66');R(x+3,y+10,7,3,OL);
  const g=dir>0?["oooooo.","ossssyo","ossssyy","ossssyo","oooooo."]:[".oooooo","ossssso","yysssso","oysssso",".oooooo"];grid(x+(dir>0?1:-1),y+3,g,{o:OL,s:'#3a3a46',y:'#fff4c0'})}

/* ---------- 工坊：大号合并门禁、主干道 ---------- */
// 合并门禁：横跨主干道的一座门架，横梁上三盏大灯（T 测试 / C CI / R Review），顶上一块 MERGE 牌子；全亮了，横杆才抬起来。64×62，base=y+60
function mergeGateBig(x,y,t,{lights=[0,0,0],open=0}={}){R(x,y+10,6,50,OL);R(x+1,y+11,4,48,'#8a93a8');R(x+1,y+11,1,48,'#b8c0cc');R(x+54,y+10,6,50,OL);R(x+55,y+11,4,48,'#8a93a8');R(x+55,y+11,1,48,'#b8c0cc');
  for(let j=y+16;j<y+58;j+=8){R(x+1,j,4,3,'#e8b83a');R(x+55,j,4,3,'#e8b83a')}
  R(x-2,y+6,64,13,OL);R(x-1,y+7,62,11,'#5a6478');R(x-1,y+7,62,2,'#8a93a8');R(x+10,y-3,40,10,OL);R(x+11,y-2,38,8,'#2f2340');txt('MERGE',x+11+Math.floor((38-txtW('MERGE'))/2),y,'#ffd84a');
  ['T','C','R'].forEach((s2,i)=>{const lx=x+14+i*16,on=lights[i];disc(lx,y+12,5,5,OL);disc(lx,y+12,4,4,on?'#7ee08a':'#3a2a2a');if(on){P1(lx-1,y+10,'#ffffff');P1(lx-2,y+11,'#c8f8d0')}txt(s2,lx-1,y+20,on?'#7ee08a':'#8a7a8a')});
  const a=open*Math.PI/2.3,L=50;for(let i=0;i<L;i++){const px=Math.round(x+54-Math.cos(a)*i),py=Math.round(y+44-Math.sin(a)*i);R(px,py,1,3,OL);P1(px,py+1,Math.floor(i/6)%2?'#fff4dc':'#e0533d')}
  disc(x+56,y+45,3,3,OL);disc(x+56,y+45,2,2,'#c8a050');R(x-2,y+58,10,3,OL);R(x+52,y+58,10,3,OL)}
// 主干道：地上刷的一条路，两边黄黑相间，中间写 MAIN，穿过门禁
function laneMain(x,y,w,h){R(x,y,w,h,'#3e4454');for(let j=y;j<y+h;j+=4){R(x,j,3,2,'#e8b83a');R(x,j+2,3,2,'#241a2e');R(x+w-3,j+2,3,2,'#e8b83a');R(x+w-3,j,3,2,'#241a2e')}
  for(let j=y+8;j<y+h-14;j+=18)R(x+Math.floor(w/2)-1,j,2,8,'#c8ccd8');txt('MAIN',x+Math.floor((w-txtW('MAIN'))/2),y+h-10,'#c8ccd8')}

/* ---------- 小摆设 ---------- */
// 伞桶 + 衣帽架（楼梯间）
function umbrellaStand(x,y){R(x,y+6,10,12,OL);R(x+1,y+7,8,10,'#5a6a7a');R(x+1,y+7,8,1,'#8a9aaa');line(x+3,y+6,x+1,y-6,'#e0533d');line(x+6,y+6,x+8,y-4,'#5B9BD5');R(x,y-8,4,3,'#e0533d');R(x+7,y-6,4,3,'#5B9BD5')}   // base=y+18
function coatRack(x,y){R(x+5,y,2,40,OL);R(x+6,y,1,40,'#a8784a');R(x+1,y+38,10,2,OL);[[0,4],[10,4],[1,10],[9,10]].forEach(([a,b])=>R(x+a,y+b,2,2,OL));knit('scarf',x+2,y+6,0);knit('hat',x+10,y+2,1)}   // base=y+40
// 墙上一排相框：每个里面一只猫
function catFrames(x,y,list){list.forEach(([dx,b],i)=>frame(x+dx,y,16,16,(ix,iy)=>cat(i%2?'sit':'lie',b,ix+8,iy+15,0,0,i%2?'L':'R')))}
// 楼层指示牌（楼梯间墙上）：每层一行，一个图标加几个字母
function floorDirectory(x,y){box(x,y,42,44,'#2f2340','#8a5a3a');[['RF','star','#ffd84a'],['2F','book','#a8d0f0'],['1F','cup','#9ccc98'],['B1','heart','#f0a8d8']].forEach(([s,ic,col],i)=>{const yy=y+3+i*10;txt(s,x+4,yy+1,col);grid(x+16,yy,SIGN_IC[ic],{o:col,w:'#2f2340',r:'#e0533d','.':null});R(x+26,yy+2,12,1,'#5a4e7a');R(x+26,yy+4,8,1,'#5a4e7a')})}   // 42×44（四层：屋顶、二楼、一楼、地下）
// 长木凳（楼梯间、二楼回廊）：凳面落脚 y+5，w 宽，base=y+12
function longBench(x,y,w){R(x,y,w,7,OL);R(x+1,y+1,w-2,3,'#c98d5c');R(x+1,y+1,w-2,1,'#e0a878');R(x+1,y+4,w-2,2,'#8a5a3a');R(x+3,y+7,3,5,OL);R(x+w-6,y+7,3,5,OL)}
// 大懒人沙发（午睡角）：46×30，base=y+30；靠背鼓在左上，座位的凹陷在右边。col=[主色, 暗, 亮]。能坐两只：(x+15,y+14)、(x+31,y+15)
function beanbagBig(x,y,[a,d,l]){alpha(.22,()=>disc(x+23,y+28,22,3,'#241a2e'));
  disc(x+23,y+19,23,10,OL);disc(x+15,y+12,14,10,OL);disc(x+23,y+19,22,9,a);disc(x+15,y+12,13,9,a);
  disc(x+29,y+19,12,5,d);disc(x+29,y+18,10,3,a);disc(x+11,y+8,6,3,l);disc(x+38,y+16,3,2,l);
  for(let i=0;i<6;i++)P1(x+5+i*3,y+16+(i%2),d);for(let i=0;i<4;i++)P1(x+36+i*2,y+23+(i%2),d);R(x+5,y+29,36,1,OL)}
// 大泡泡机（大客厅）：36×32，base=y+32。蓝色机身、正面一个风扇格栅；顶上立着一只泡泡圈转轮（5 个小圈），开着的时候转；前面一盘泡泡水
function bubbleMachineBig(x,y,t,on){alpha(.22,()=>disc(x+18,y+31,17,2,'#241a2e'));
  const a=on?t*3:0,cx=x+20,cy=y+10;R(cx-1,cy,2,12,OL);ring(cx,cy,8,'#c98a1e');ring(cx,cy,7,'#e8b83a');
  for(let i=0;i<5;i++){const q=a+i*Math.PI*2/5,rx=Math.round(cx+Math.cos(q)*8),ry=Math.round(cy+Math.sin(q)*8);disc(rx,ry,2,2,'#ffd84a');P1(rx,ry,'#cfeef8')}R(cx-1,cy-1,3,3,OL);
  box(x+2,y+16,32,15,'#5B9BD5');R(x+3,y+17,30,3,'#a8d0f0');R(x+3,y+28,30,2,'#34618f');
  disc(x+11,y+24,5,4,OL);disc(x+11,y+24,4,3,'#34618f');for(let i=-3;i<=3;i+=2)R(x+11+i,y+21,1,7,'#5B9BD5');
  R(x+20,y+22,11,6,OL);R(x+21,y+23,9,4,'#cfeef8');R(x+21,y+23,9,1,'#ffffff');P1(x+31,y+19,on?'#7ee08a':'#2e4a6a')}
// 月亮小夜灯（午睡角墙上）：14×14 的弯月，挂一颗小星星
function moonLamp(x,y){const IN=(i,j)=>(i-6.5)**2+(j-6.5)**2<=42&&(i-10)**2+(j-4)**2>24;
  for(let j=-1;j<15;j++)for(let i=-1;i<15;i++){if(IN(i,j))P1(x+i,y+j,i+j<10?'#fff2b8':'#ffd870');else if(IN(i-1,j)||IN(i+1,j)||IN(i,j-1)||IN(i,j+1))P1(x+i,y+j,OL)}
  line(x+11,y+11,x+11,y+15,'#d9d2c4');R(x+10,y+16,3,3,'#ffd84a');P1(x+11,y+16,'#fff8d0')}
// 激光逗猫器（大客厅墙上）：22×14 的白色小机器，顶上两只猫耳朵，正中一只红镜头；开着的时候镜头一闪一闪
function laserToy(x,y,t,on){R(x+9,y,4,3,OL);R(x+10,y+1,2,1,'#8a8496');
  grid(x+2,y+1,["..o..............o..",".ofo............ofo.","ofpfo..........ofpfo"],{o:OL,f:'#e8e4f0',p:'#f4a6b8','.':null});
  box(x+2,y+4,19,10,'#e8e4f0');R(x+3,y+5,17,2,'#ffffff');R(x+3,y+12,17,1,'#b8b0c8');
  const blink=on&&Math.floor(t*6)%2;disc(x+11,y+9,3,2,OL);disc(x+11,y+9,2,1,blink?'#ff3048':'#8a2a34');P1(x+10,y+8,blink?'#ffd0d8':'#c86a74');P1(x+17,y+7,on?'#7ee08a':'#4a5a4a')}
