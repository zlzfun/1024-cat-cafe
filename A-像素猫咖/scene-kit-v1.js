/* 1024 猫咖 · 像素场景与可交互元素（草案 v1，已冻结：只给 scene-v1.html 用；v2 起场景里不再出现人类，见 scene-kit.js）。依赖 cat-sprites.js（v2）。
   约定：先 use(ctx) 指定画布；元素函数的 (x,y) 为左上角，注释里的 base 是落地的 y，
   用于和猫按 y 排序做前后遮挡。 */
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
const AT=["011110","100001","101101","101110","100000","011110"];
function atSign(x,y,col){AT.forEach((r,j)=>[...r].forEach((c,i)=>{if(c==='1')P1(x+i,y+j,col)}))}

/* ---------- 地面 ---------- */
function floorWood(x,y,w,h){const A=['#c98d5c','#c28553'],S='#a86e44';for(let r=0,yy=y;yy<y+h;yy+=6,r++){const hh=Math.min(6,y+h-yy);R(x,yy,w,hh,A[r%2]);if(hh===6)R(x,yy+5,w,1,S);
  for(let xx=x+((r*17)%29);xx<x+w;xx+=29)R(xx,yy,1,Math.min(5,hh),S);if(r%3===1&&w>8)P1(x+((r*37)%(w-4))+2,yy+2,'#b3784a')}}
function floorTile(x,y,w,h){for(let j=0;j*8<h;j++)for(let i=0;i*8<w;i++)R(x+i*8,y+j*8,Math.min(8,w-i*8),Math.min(8,h-j*8),(i+j)%2?'#efe2cc':'#e0ceb2')}
function floorCarpet(x,y,w,h,a='#56607a',b='#4c5670'){R(x,y,w,h,a);for(let j=1;j<h;j+=3)for(let i=((j-1)/3%2)*3+1;i<w;i+=6)P1(x+i,y+j,b)}
function rug(x,y,w,h,a,b){R(x+1,y,w-2,h,a);R(x,y+1,w,h-2,a);R(x+3,y+2,w-6,1,b);R(x+3,y+h-3,w-6,1,b);R(x+2,y+3,1,h-6,b);R(x+w-3,y+3,1,h-6,b);
  for(let j=2;j<h-2;j+=2){P1(x-1,y+j,b);P1(x+w,y+j,b)}}

/* ---------- 墙 ---------- */
const WALLS={cream:['#f2dcc2','#ead0b2'],pink:['#f4d6d2','#eec4c2'],mint:['#d4eada','#c2dfca'],navy:['#3c4670','#353e64'],butter:['#f5e4b2','#eed89c']};
function wall(x,y,w,h,style='cream'){const [a,b]=WALLS[style];R(x,y,w,h,a);for(let i=x+2;i<x+w;i+=8)R(i,y+2,3,h-12,b);R(x,y,w,2,'#5a3a2a');
  const wy=y+h-10;R(x,wy,w,8,'#9a6448');R(x,wy,w,1,'#b87a58');for(let i=x+3;i<x+w-12;i+=16){R(i,wy+2,12,1,'#7a4c36');R(i,wy+6,12,1,'#7a4c36');R(i,wy+2,1,5,'#7a4c36');R(i+11,wy+2,1,5,'#7a4c36')}
  R(x,y+h-2,w,2,'#4a2e22')}
function pillar(x,y,h){R(x,y,6,h,OL);R(x+1,y,4,h,'#b87a58');R(x+1,y,1,h,'#d4966c')}
const SKY={day:['#a8d8f4','#cdeaf8','#7ab87a'],dusk:['#f09a6a','#fbd49a','#8a7a5a'],night:['#1f2248','#2e3266','#1c3a2c']};
function windowW(x,y,w,h,t=0,tod='day'){R(x-2,y+h-1,w+4,3,OL);R(x-1,y+h,w+2,1,'#fff4dc');box(x,y,w,h,'#fff4dc');
  const ix=x+3,iy=y+3,iw=w-6,ih=h-6,[s1,s2,g]=SKY[tod];R(ix,iy,iw,ih,s2);R(ix,iy,iw,Math.floor(ih/2),s1);
  C.save();C.beginPath();C.rect(ix,iy,iw,ih);C.clip();
  if(tod==='night'){[[.15,.3],[.55,.18],[.8,.55],[.35,.62],[.7,.3]].forEach(([a,b],i)=>{if((Math.floor(t*1.5)+i)%6)P1(ix+Math.floor(a*iw),iy+Math.floor(b*ih),'#fff4dc')});disc(ix+iw-6,iy+5,2,2,'#fff4dc');P1(ix+iw-5,iy+4,s1)}
  else{const cl=(o,cy)=>{const cx=ix-10+((t*3+o)%(iw+20));R(cx,cy,9,2,'#fff');R(cx+2,cy-1,4,1,'#fff')};cl(0,iy+5);cl(iw*.6,iy+9)}
  R(ix,iy+ih-4,iw,4,g);for(let i=0;i<iw;i+=5)disc(ix+i+2,iy+ih-4,2,1,g);C.restore();
  R(x+Math.floor(w/2)-1,y+1,2,h-2,'#fff4dc');R(x+1,y+Math.floor(h/2)-1,w-2,2,'#fff4dc')}
function curtains(x,y,w,h,col='#e88aa0',dk='#c46a82'){R(x-5,y-3,w+10,2,OL);[x-5,x+w-1].forEach(cx=>{R(cx,y-1,6,h,col);R(cx+2,y-1,1,h,dk);R(cx,y+h-1,6,1,dk)})}
function chalkboard(x,y,w,h,lines){box(x,y,w,h,'#8a5a3a');R(x+2,y+2,w-4,h-4,'#2f4a3a');R(x+2,y+2,w-4,1,'#3c5c4a');
  lines.forEach(([s,yy,col='#e8f0e0',k=1])=>txt(s,x+Math.floor((w-txtW(s,k))/2),y+yy,col,k));R(x+5,y+h-1,w-10,2,'#6e4430');R(x+8,y+h-2,3,1,'#fff4dc')}
function clock(cx,cy,t){disc(cx,cy,6,6,OL);disc(cx,cy,5,5,'#fff4dc');[[0,-4],[4,0],[0,4],[-4,0]].forEach(([a,b])=>P1(cx+a,cy+b,'#b9a8c9'));
  const m=t*.6,h=t*.05;line(cx,cy,cx+Math.round(Math.sin(m)*4),cy-Math.round(Math.cos(m)*4),OL);line(cx,cy,cx+Math.round(Math.sin(h)*3),cy-Math.round(Math.cos(h)*3),'#e0533d')}
function shelf(x,y,w){R(x,y,w,3,OL);R(x+1,y,w-2,2,'#a8703f');R(x+3,y+3,2,3,OL);R(x+w-5,y+3,2,3,OL);
  const cols=['#e0533d','#fff4dc','#5B9BD5','#ffd84a','#9B7EBD'];let cx=x+3,i=0;
  while(cx<x+w-8){const k=i%4;if(k===2){box(cx,y-7,5,7,'#e8dccb');R(cx+1,y-4,3,3,'#6a3a22');cx+=7}
    else if(k===3){R(cx+1,y-4,5,4,OL);R(cx+2,y-4,3,3,'#c46a44');disc(cx+3,y-7,2,2,'#5b9a5a');cx+=8}
    else{box(cx,y-4,4,4,cols[i%5]);P1(cx+4,y-3,OL);P1(cx+4,y-2,OL);cx+=7}i++}}
function door(x,y,t=0,ring=0){R(x-2,y-2,26,42,'#5a3a2a');box(x,y,22,40,'#9a6448');box(x+4,y+4,14,10,'#cdeaf8');R(x+5,y+5,4,1,'#fff');
  box(x+4,y+18,6,17,'#8a5a3a');box(x+12,y+18,6,17,'#8a5a3a');P1(x+19,y+22,'#ffd84a');P1(x+19,y+23,'#c9a030');
  const sw=ring?Math.round(Math.sin(t*22)*1.4):0;R(x+2,y+1,1,2,OL);grid(x+1+sw,y+3,["ooo","oyo","ooo",".y."],{o:OL,y:'#ffd84a'})}
function mat(x,y,w=26){R(x,y,w,6,OL);R(x+1,y+1,w-2,4,'#b5654a');for(let i=x+3;i<x+w-2;i+=4)R(i,y+2,2,2,'#d98a6a')}
function neon(x,y,s,col,t,k=1){const on=Math.floor(t*6)%31!==0;box(x,y,txtW(s,k)+6,5*k+6,'#2a2238');txt(s,x+3,y+3,on?col:'#5a4a5a',k)}
function poster(x,y,kind='1024'){if(kind==='1024'){box(x,y,18,22,'#e0533d');txt('10',x+5,y+4,'#fff4dc');txt('24',x+5,y+11,'#fff4dc');R(x+4,y+18,10,1,'#fff4dc')}
  else{box(x,y,18,22,'#9B7EBD');grid(x+3,y+5,["o..........o","oo........oo","oooooooooooo","oooooooooooo","ooowoooowooo","oooooooooooo",".oooooooooo.","..oooooooo.."],{o:'#fff4dc',w:'#9B7EBD'});txt('MEOW',x+2,y+15,'#fff4dc')}
  P1(x,y,'#f6e6b0');P1(x+17,y,'#f6e6b0')}
function pendant(x,y,len,on){R(x,y,1,len,OL);grid(x-3,y+len,[".ooooo.","oyyyyyo","ooooooo"],{o:OL,y:on?'#ffe08a':'#e8c86a'});if(on)R(x-1,y+len+3,3,1,'#fff4a0')}

/* ---------- 家具 ---------- */
function counter(x,y,w,h=26){R(x,y,w,h,OL);R(x+1,y+1,w-2,6,'#ecdcc0');R(x+1,y+1,w-2,1,'#fff4dc');R(x+1,y+7,w-2,1,OL);R(x+1,y+8,w-2,h-11,'#9a6448');
  for(let i=x+6;i<x+w-4;i+=12)R(i,y+10,1,h-15,'#7a4c36');R(x+1,y+h-3,w-2,2,'#6e4430')}               // base=y+h
function table(x,y,w){R(x,y,w,10,OL);R(x+1,y+1,w-2,6,'#d9a870');R(x+1,y+1,w-2,1,'#ecc490');R(x+1,y+7,w-2,2,'#a8703f');
  const lx=x+Math.floor(w/2)-1;R(lx-1,y+10,4,12,OL);R(lx,y+10,2,12,'#8a5a3a');R(lx-5,y+21,12,2,OL)}   // base=y+23
function chairBack(x,y,col='#8a5a3a'){R(x,y,2,14,OL);R(x+22,y,2,14,OL);R(x,y,24,3,OL);R(x+1,y+1,22,1,col)}
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
function yarnBall(cx,cy,r,ci=0){const [a,b]=YARNC[ci%YARNC.length];disc(cx,cy,r+1,r+1,OL);disc(cx,cy,r,r,a);if(r>=2){line(cx-r+1,cy,cx,cy-r+1,b);line(cx-1,cy+r-1,cx+r-1,cy-1,b)}else P1(cx-1,cy-1,b)}
const YARNC=[['#e0533d','#f7a58c'],['#5B9BD5','#a8d0f0'],['#9B7EBD','#d0bce4'],['#5B8C5A','#9ccc98'],['#e8b83a','#fff0a8']];
function spark(x,y,t){if(Math.floor(t*3)%2)return;P1(x,y-1,'#ffd84a');P1(x-1,y,'#ffd84a');P1(x+1,y,'#ffd84a');P1(x,y+1,'#ffd84a');P1(x,y,'#fff')}
function yarnBasket(x,y,n,t){const pos=[[6,4,0],[18,4,1],[12,3,2],[9,0,3]];for(let i=0;i<Math.min(n,4);i++)yarnBall(x+pos[i][0],y+pos[i][1],3,pos[i][2]);
  R(x,y+5,24,10,OL);R(x+1,y+6,22,8,'#c9954e');for(let j=0;j<4;j++)for(let i=(j%2)*2;i<22;i+=4)R(x+1+i,y+7+j*2,2,1,'#a8783a');R(x+1,y+6,22,1,'#dcae6a');
  if(n>0){line(x+18,y+8,x+22,y+15,YARNC[1][0]);spark(x+23,y-1,t)}}                                     // base=y+15
function coffeeMachine(x,y,t,brew=0){box(x,y,18,22,'#9aa3ad');R(x+1,y+1,16,5,'#6b7480');P1(x+3,y+3,Math.floor(t*2)%2||brew?'#e0533d':'#7a3030');R(x+11,y+2,5,3,'#b8f0c8');
  box(x+3,y+7,12,4,'#4a5058');R(x+8,y+11,2,2,OL);box(x+6,y+15,6,6,'#fff4dc');P1(x+12,y+16,OL);P1(x+12,y+17,OL);R(x+1,y+20,16,1,'#6b7480');
  if(brew)P1(x+8,y+13+Math.floor(t*10)%2,'#6a3a22');steam(x+9,y-1,t,brew?4:2)}                        // base=y+22
function steam(x,y,t,n=2){alpha(.7,()=>{for(let i=0;i<n;i++){const k=(t*1.5+i/n)%1;P1(x+Math.round(Math.sin((k+i)*6)*1.5),y-Math.round(k*8),'#fff')}})}
function cup(x,y,state,t){if(state===2){alpha(.85,()=>{R(x-4,y+3,13,3,'#6a3a22');R(x-2,y+2,9,1,'#6a3a22')});grid(x-3,y,["o..o","ow.wo",".o..."],{o:OL,w:'#fff4dc'});P1(x+6,y+1,'#fff4dc');P1(x+6,y,OL);return}
  const w=state===1?(Math.floor(t*14)%2?1:-1):0;box(x+w,y,6,6,'#fff4dc');R(x+1+w,y+1,4,1,'#6a3a22');P1(x+6+w,y+2,OL);P1(x+6+w,y+3,OL);R(x-1,y+5,8,1,OL);if(!state)steam(x+3,y-1,t)}   // base=y+6
function laptop(x,y,on){box(x,y,13,9,'#c9ced6');grid(x+4,y+3,["o...o","ooooo","o.o.o"],{o:on?'#ffd84a':'#fff4dc'});R(x-1,y+9,15,1,OL)}   // 背面朝外，base=y+10
function monitor(x,y,t,seed=0){box(x,y,22,16,'#2a2a36');R(x+2,y+2,18,12,'#16202e');const cols=['#7ec27e','#8fc8f0','#ffd84a','#f4a6b8','#b9a8c9'],s=Math.floor(t*1.6+seed*3);
  for(let i=0;i<5;i++){const h=((s+i)*2654435761>>>0)%997;R(x+3+(h%3)*2,y+3+i*2,3+h%11,1,cols[h%5])}if(Math.floor(t*2)%2)R(x+3,y+13,2,1,'#fff');R(x+9,y+16,4,3,OL)}   // 高 19
function desk(x,y,w){R(x,y,w,9,OL);R(x+1,y+1,w-2,5,'#e6d2b0');R(x+1,y+1,w-2,1,'#f4e6cc');R(x+1,y+6,w-2,2,'#b89a70');R(x+2,y+9,3,12,OL);R(x+w-5,y+9,3,12,OL)}   // base=y+21
function cardbox(x,y,state,t,bi=4){R(x+3,y,16,4,OL);R(x+4,y+1,14,2,'#c49656');R(x,y+3,22,4,OL);R(x+1,y+4,20,2,'#6e4a28');
  if(state){C.save();C.beginPath();C.rect(x-6,y-24,34,38);C.clip();cat('sit',bi,x+11,state===1?y+14:y+19,t);C.restore()}
  R(x,y+6,22,10,OL);R(x+1,y+7,20,8,'#d6a868');R(x+1,y+7,20,1,'#e8c088');R(x+9,y+7,4,8,'#eadcb8');R(x-3,y+4,4,3,OL);R(x-2,y+5,3,1,'#c49656');R(x+21,y+4,4,3,OL);R(x+21,y+5,3,1,'#c49656')}   // base=y+16
function bowls(x,y,full,water=1){R(x-2,y+3,30,4,'#f4a6b8');R(x-2,y+6,30,1,'#e27a8f');
  R(x,y,12,6,OL);R(x+1,y+1,10,3,'#5B9BD5');R(x+1,y+1,10,1,'#a8d0f0');R(x+2,y+4,8,1,'#3f6f9a');if(full){R(x+2,y,8,2,'#a0602e');P1(x+4,y,'#c9884a');P1(x+7,y+1,'#c9884a');P1(x+5,y-1,'#a0602e')}
  R(x+14,y,12,6,OL);R(x+15,y+1,10,3,'#e0533d');R(x+15,y+1,10,1,water?'#a8e0f8':'#f7a58c');R(x+16,y+4,8,1,'#9e2f2a')}   // base=y+7
function mailbox(x,y,state,t){grid(x+1,y,["oo........oo","opo......opo","oppoooooooppo"],{o:OL,p:'#f4a6b8'});box(x+1,y+2,14,15,'#e0533d');R(x+2,y+3,12,1,'#f07a60');
  R(x+4,y+5,8,2,OL);atSign(x+5,y+9,'#fff4dc');R(x+6,y+17,4,7,OL);R(x+7,y+17,2,7,'#9e2f2a');R(x+3,y+24,10,2,OL);
  if(state===1){R(x+15,y+3,1,9,OL);R(x+16,y+3,4,3,'#ffd84a');R(x+16,y+3,4,1,'#fff0a8')}else{R(x+15,y+9,1,3,OL);R(x+15,y+8,4,2,'#ffd84a')}
  if(state===2){const k=(t*1.6)%1;yarnBall(x+8,y-4+Math.round(k*9),2,1)}}                              // base=y+26
function plant(x,y,t,shake=0){const s=shake?Math.round(Math.sin(t*30)):0,L=[[7,5,5,4],[3,10,4,3],[11,10,4,3],[5,2,3,3],[10,3,3,3]];
  L.forEach(([a,b,rx,ry])=>disc(x+a+s,y+b,rx+1,ry+1,OL));L.forEach(([a,b,rx,ry],i)=>{disc(x+a+s,y+b,rx,ry,i%2?'#4a8a4e':'#5ea85e');P1(x+a+s-1,y+b-1,'#8cd08a')});
  R(x+2,y+14,11,10,OL);R(x+3,y+16,9,7,'#c46a44');R(x+2,y+14,11,3,OL);R(x+3,y+15,9,1,'#e08a5a')}         // base=y+24
function sunbeam(x,y,w,h,shift,t,tod){if(tod==='night')return;const col=tod==='dusk'?'#ffb070':'#fff3b0';
  alpha(tod==='dusk'?.24:.3,()=>{for(let j=0;j<h;j++){const o=Math.round(j*shift/h);R(x+o,y+j,Math.floor(w/2)-1,1,col);R(x+o+Math.floor(w/2)+1,y+j,Math.ceil(w/2)-1,1,col)}});
  alpha(.8,()=>{for(let i=0;i<4;i++){const k=(t*.15+i*.27)%1;P1(x+Math.round(k*shift+w*(i/4)),y+Math.round(h*(1-k)),'#fff8d8')}})}

/* ---------- 人类 ---------- */
const HF={
  short:["......ooooo","....oohhhhh","...ohhhhhhh","..ohhhhhhhh","..ohhhhhhhh",".ohhhhhhhhh",".ohhhhhhhss",".ohhhssssss",".ohssssssss",".ohsssseess",".ohsssseess","..osspsssss","..osssssssm","...ooooooss","..oocccccss",".occcccccsc","occcccccccc","ococccccccc","ococccccccc","ococccccccc"],
  long:["......ooooo","....oohhhhh","...ohhhhhhh","..ohhhhhhhh",".ohhhhhhhhh",".ohhhhhhhhh","ohhhhhhhhss","ohhhhssssss","ohhssssssss","ohhsssseess","ohhsssseess","ohhsspsssss","ohhhssssssm","ohhhoooooss","ohhocccccss","ooocccccccc","occcccccccc","ococccccccc","ococccccccc","ococccccccc"],
  back:["......ooooo","....oohhhhh","...ohhhhhhh","..ohhhhhhhh","..ohhhhhhhh",".ohhhhhhhhh",".ohhhhhhhhh",".ohhhhhhhhh","sohhhhhhhhh","sohhhhhhhhh",".ohhhhhhhhh","..ohhhhhhhh","...ohhhhhhh","....oooooss","..ooccccccc",".occccccccc","occcccccccc","ococccccccc","ococccccccc","ococccccccc"]};
const HUMANS=[{hair:'#3a2a2a',skin:'#f2c9a0',shirt:'#4d7cc9',style:'short'},{hair:'#6a3a2a',skin:'#f5d0b0',shirt:'#e88aa0',style:'long'},
  {hair:'#2a2a3a',skin:'#e8b890',shirt:'#5B8C5A',style:'short',glasses:1},{hair:'#b07038',skin:'#f2c9a0',shirt:'#e8b83a',style:'bun'},
  {hair:'#3a3a3a',skin:'#d9a878',shirt:'#9B7EBD',style:'short',cap:'#e0533d'},{hair:'#5a3424',skin:'#f5d0b0',shirt:'#fff4dc',style:'long',glasses:1}];
/* 人类 22×20（坐姿上半身），(x,y) 左上；back=1 为背影 */
function human(x,y,lk,t,o=0,back=0){if(lk.style==='bun'&&!back){disc(x+11,y-1,4,3,OL);disc(x+11,y-1,3,2,lk.hair)}
  const blink=((t+o)*1000%4200)<140;const rows=mir(HF[back?'back':lk.style==='long'?'long':'short']).map(r=>blink?r.replace(/e/g,'s'):r);
  grid(x,y,rows,{o:OL,h:lk.hair,s:lk.skin,e:'#241a2e',p:'#f4a6b8',m:'#c46a6a',c:lk.shirt});
  if(back&&lk.style==='bun'){disc(x+11,y+3,4,3,OL);disc(x+11,y+3,3,2,lk.hair)}
  if(lk.cap){R(x+3,y,16,6,OL);R(x+4,y+1,14,5,lk.cap);R(x+4,y+1,14,1,'#f07a60');if(!back)R(x+2,y+6,18,1,OL)}
  if(lk.glasses&&!back){[6,12].forEach(gx=>{R(x+gx,y+8,4,1,OL);R(x+gx,y+11,4,1,OL);R(x+gx,y+8,1,4,OL);R(x+gx+3,y+8,1,4,OL)});R(x+10,y+9,2,1,OL)}}
function hands(x,y,lk,t,typing){const k=typing&&Math.floor(t*8)%2;box(x+3,y+k,5,3,lk.skin);box(x+14,y+(typing?1-k:0),5,3,lk.skin)}
function bubble(x,y,kind,t){y+=Math.round(Math.sin(t*3));const bx=x-6,by=y-12;R(bx+1,by,11,10,OL);R(bx,by+1,13,8,OL);R(bx+1,by+1,11,8,'#fff4dc');R(x-1,y-2,3,1,OL);P1(x,y-2,'#fff4dc');P1(x,y-1,OL);
  if(kind==='yarn')yarnBall(x,by+5,2,0);
  if(kind==='dots')[-3,0,3].forEach((d,i)=>P1(x+d,by+5,i<=Math.floor(t*3)%3?OL:'#d8ccc0'));
  if(kind==='heart')grid(x-2,by+3,["oo.oo","ooooo",".ooo.","..o.."],{o:'#e0533d'});
  if(kind==='bang')R(x,by+2,1,4,'#e0533d'),P1(x,by+7,'#e0533d');
  if(kind==='at')atSign(x-2,by+3,'#5B9BD5')}
/* 一桌客人：椅背 + 人 + 桌子 + 手 + 桌上物件。(x,y) = 桌面左上，base=y+23；头顶气泡用 guestBubble */
function guestTable(x,y,w,lk,t,o=0,{typing=0,item=null,itemState=0,catOn=null}={}){const hx=x+Math.floor(w/2)-11;chairBack(hx-1,y-10);human(hx,y-18,lk,t,o);table(x,y,w);hands(hx,y+1,lk,t,typing);
  if(catOn!=null)cat('lie',catOn,hx+11,y+4,t);
  if(item==='cup')cup(x+w-9,y-1,itemState,t);if(item==='cup2')cup(x+3,y-1,itemState,t);if(item==='laptop')laptop(hx+5,y-5,itemState)}
const guestBubble=(x,y,w,kind,t)=>kind&&bubble(x+Math.floor(w/2),y-20,kind,t);
/* 工位：桌 + 显示器 + 背对镜头的人 + 办公椅，base=y+30；显示器顶在 y-14 */
function workDesk(x,y,lk,t,o=0){desk(x,y,34);monitor(x+6,y-14,t,o);R(x+8,y+2,18,2,OL);R(x+9,y+2,16,1,'#9aa3ad');human(x+6,y+4,lk,t,o,1);
  R(x+8,y+16,18,8,OL);R(x+9,y+17,16,6,'#3b4766');R(x+9,y+17,16,1,'#55618a');R(x+16,y+24,2,4,OL);R(x+11,y+28,12,2,OL)}
function floatDigits(x,y,t){for(let i=0;i<4;i++){const k=(t*1.1+i*.25)%1;alpha(1-k,()=>txt('1024'[i],x-8+i*5,Math.round(y-k*14),'#ffd84a'))}}
/* ---------- 猫 ---------- */
// 姿态表 POSE、每只猫的性格 PERSONA、drawCat 都在 cat-sprites.js（v2）里；这里只包一层，画到当前画布 C 上
function cat(k,bi,x,y,t,o=0,face='R'){return drawCat(C,k,bi,x,y,t,{o,face})}

/* ---------- 昼夜 ---------- */
const GLOW={};
function glowTex(r,col){const k=r+col;if(GLOW[k])return GLOW[k];const c=document.createElement('canvas');c.width=c.height=r*2;const g=c.getContext('2d'),gr=g.createRadialGradient(r,r,0,r,r,r);
  gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,r*2,r*2);return GLOW[k]=c}
function applyTod(w,h,tod,lights=[]){if(tod==='day')return;C.save();C.globalCompositeOperation='multiply';C.fillStyle=tod==='dusk'?'#ffd6b4':'#6c68a8';C.fillRect(0,0,w,h);
  C.globalCompositeOperation='lighter';lights.forEach(l=>{if(l.when&&l.when!==tod)return;C.globalAlpha=(tod==='dusk'?.35:.55)*(l.a||1);C.drawImage(glowTex(l.r,l.col),l.x-l.r,l.y-l.r)});C.restore()}
