/* 1024 猫咖 · 进店流程的像素零件：扭蛋机、扭蛋、九个暗号图案、项圈牌、聚光灯、光柱。
   依赖 scene-kit.js（C、R、P1、disc、grid、line、txt）、cat-sprites.js（POSE、drawF）、world-play.js（PAL、COATS、COLLARS）。
   约定同 scene-kit：先 use(ctx)；每个函数注释里写明 (x,y) 是哪一点。全局只露 EA。 */
const EA=(()=>{
const COLLAR_NAMES=['红','蓝','紫','绿','黄','粉'];
const LOOK_FACES=['normal','content','curious','blep','sparkle','meh','sleepy','happy','smug','wink'];
const FACE_DESC={normal:'总是一脸认真',content:'总是一脸满足',curious:'看什么都好奇',blep:'舌头老是忘了收',sparkle:'眼睛亮晶晶的',meh:'一脸"就这？"',sleepy:'总是睡不醒',happy:'笑眯眯的',smug:'有点小得意',wink:'爱眨一只眼'};
const hexRGB=h=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]};
const mix=(a,b,k)=>{const A=hexRGB(a),B=hexRGB(b);return'#'+A.map((q,i)=>Math.round(q+(B[i]-q)*k).toString(16).padStart(2,'0')).join('')};
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v+.5)/16),dith=(x,y,k)=>k>BAYER[(y&3)*4+(x&3)];

/* ---------- 外观：扭蛋扭出来的就是这三样，存进账号 ---------- */
const palOf=l=>7+l.coat*6+l.collar;
// prev：之前扭到的一只或几只；新扭的毛色 + 项圈不和其中任何一只完全一样
const roll=(prev)=>{const ps=Array.isArray(prev)?prev:prev?[prev]:[];let l;do{l={coat:Math.floor(Math.random()*COATS.length),collar:Math.floor(Math.random()*COLLARS.length),face:LOOK_FACES[Math.floor(Math.random()*LOOK_FACES.length)]}}while(ps.some(p=>l.coat===p.coat&&l.collar===p.collar));return l};
const describe=l=>({coat:COATS[l.coat].name,collar:COLLAR_NAMES[l.collar]+'项圈',face:FACE_DESC[l.face]||''});
// 画一只玩家毛色的猫（脚底中点 x,y）；和 cat-sprites 的 drawCat 一样，只是毛色从 PAL 里取
function cat(k,l,x,y,t,{face='R',ex,o=0}={}){const pi=palOf(l),tf=(Math.floor(t*2)+pi)%2,P=POSE[k](t+o,tf,o,ex??l.face);if(face==='L'&&FACING.has(k))P.flip=!P.flip;
  drawF(C,P.G,PAL[pi],Math.round(x),Math.round(y),{cx:P.cx,flip:P.flip,dy:P.dy||0,blink:P.blink});return P}
// 带一圈 1px 描边的猫（引导里用黄色：和店里标"你"的方式一样，先认得"黄边的就是我"）
const OLC=document.createElement('canvas');OLC.width=56;OLC.height=44;const OLT=document.createElement('canvas');OLT.width=56;OLT.height=44;
function catOl(k,l,x,y,t,o={},col='#ffd84a'){const a=OLC.getContext('2d'),b=OLT.getContext('2d'),keep=C;a.clearRect(0,0,56,44);use(a);cat(k,l,28,40,t,o);use(keep);
  b.clearRect(0,0,56,44);b.globalCompositeOperation='source-over';for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])b.drawImage(OLC,dx,dy);b.globalCompositeOperation='source-in';b.fillStyle=col;b.fillRect(0,0,56,44);b.globalCompositeOperation='source-over';
  C.drawImage(OLT,Math.round(x)-28,Math.round(y)-40);C.drawImage(OLC,Math.round(x)-28,Math.round(y)-40)}

/* ---------- 像素多边形 / 圆：按像素判断里外，边上一圈描边 ---------- */
function fillPx(x0,y0,x1,y1,inside,colAt,clip){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(!inside(x,y)||clip&&!clip(x,y))continue;
  const edge=!inside(x+1,y)||!inside(x-1,y)||!inside(x,y+1)||!inside(x,y-1);P1(x,y,edge?OL:colAt(x,y))}}
const inTri=(px,py,a,b,c)=>{const d=(p,q,r)=>(p[0]-r[0])*(q[1]-r[1])-(q[0]-r[0])*(p[1]-r[1]),P=[px+.5,py+.5],d1=d(P,a,b),d2=d(P,b,c),d3=d(P,c,a);return!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))};
function tri(a,b,c,col,inner){const xs=[a[0],b[0],c[0]],ys=[a[1],b[1],c[1]];fillPx(Math.floor(Math.min(...xs)),Math.floor(Math.min(...ys)),Math.ceil(Math.max(...xs)),Math.ceil(Math.max(...ys)),(x,y)=>inTri(x,y,a,b,c),()=>col);
  if(inner){const cx=(a[0]+b[0]+c[0])/3,cy=(a[1]+b[1]+c[1])/3,s=p=>[cx+(p[0]-cx)*.5,cy+(p[1]-cy)*.5],A=s(a),B=s(b),D=s(c);for(let y=Math.floor(Math.min(A[1],B[1],D[1]));y<=Math.max(A[1],B[1],D[1]);y++)for(let x=Math.floor(Math.min(A[0],B[0],D[0]));x<=Math.max(A[0],B[0],D[0]);x++)if(inTri(x,y,A,B,D))P1(x,y,inner)}}
// 扭蛋（圆心 cx,cy，半径 r）：一条缝把它分成上下两半，a 是缝的角度；part 只画上半 'top' / 下半 'bot'
function capsule(cx,cy,r,a,colI,{part='both',clip}={}){const top=COLLARS[colI%COLLARS.length],hl=mix(top,'#ffffff',.55),bot='#fff4dc',ca=Math.cos(a),sa=Math.sin(a),R2=(r+.45)**2;
  cx=Math.round(cx);cy=Math.round(cy);
  const inside=(x,y)=>{const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy>R2)return false;if(part==='both')return true;const v=-dx*sa+dy*ca;return part==='top'?v<=.2:v>=-.2};
  fillPx(cx-r-1,cy-r-1,cx+r+1,cy+r+1,inside,(x,y)=>{const dx=x-cx,dy=y-cy,v=-dx*sa+dy*ca,u=dx*ca+dy*sa;if(part==='both'&&Math.abs(v)<.55)return OL;
    if(v<0)return u<-r*.15&&u>-r*.7&&v<-r*.35&&v>-r*.8?hl:top;return u>r*.3&&v>r*.45?'#e8dcc8':bot},clip)}

/* ---------- 扭蛋机（底边中点 mx,my）：猫头形状的玻璃罩 + 红机身 + 旋钮 + 投币口 + 出蛋口 ----------
   o.turn 旋钮转了几圈（0～1 一圈）；o.flap 出蛋口的翻盖打开多少；o.jig 罩子里的扭蛋晃多厉害；o.caps 罩子里的扭蛋（pile() 生成） */
const GR=24,globeY=my=>my-74;
function pile(n=20,seed=1){const out=[];let s=seed;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<n&&out.length<n;i++){for(let k=0;k<60;k++){const x=Math.round((rnd()*2-1)*17),y=Math.round(-3+rnd()*22);if(x*x+y*y>18*18)continue;if(out.some(c=>(c.x-x)**2+(c.y-y)**2<56))continue;out.push({x,y,a:rnd()*Math.PI,c:Math.floor(rnd()*6),ph:rnd()*6});break}}
  return out.sort((a,b)=>a.y-b.y)}
function machine(mx,my,t,o={}){const turn=o.turn||0,flap=o.flap||0,jig=o.jig||0,caps=o.caps||[],gy=globeY(my);
  // 地上的影子
  for(let x=-30;x<=30;x++){const h=Math.round(3*Math.sqrt(1-(x/31)**2));for(let y=0;y<h;y++)if(dith(mx+x,my+y,.7-y*.2))P1(mx+x,my+y,'#0a070c')}
  // 机身
  R(mx-24,my-3,9,3,OL);R(mx+15,my-3,9,3,OL);
  box(mx-26,my-48,52,46,'#e0533d');R(mx-25,my-47,2,44,'#f07a5e');R(mx+21,my-47,4,44,'#b83e2c');R(mx-25,my-5,50,2,'#b83e2c');
  txt('1024',mx-7,my-45,'#fff4dc');
  box(mx-21,my-38,42,23,'#fff4dc');R(mx-20,my-17,40,1,'#e4d6bc');R(mx+19,my-37,1,21,'#e4d6bc');
  // 旋钮：白色圆盘 + 一根红把手，转起来就是把手在转
  const kx=mx-8,ky=my-27;disc(kx,ky,8,8,OL);disc(kx,ky,7,7,'#9a9286');disc(kx,ky,6,6,'#c8beb0');for(let a=3.5;a<4.9;a+=.05)P1(Math.round(kx+Math.cos(a)*5),Math.round(ky+Math.sin(a)*5),'#e8e0d4');
  const th=turn*Math.PI*2+(o.wiggle?Math.sin(t*9)*.28*o.wiggle:0),ux=Math.cos(th),uy=Math.sin(th);
  for(let s=-9;s<=9;s++){const x=Math.round(kx+ux*s-.5),y=Math.round(ky+uy*s-.5);R(x-1,y-1,4,4,OL)}for(let s=-8;s<=8;s++){const x=Math.round(kx+ux*s-.5),y=Math.round(ky+uy*s-.5);R(x,y,2,2,Math.abs(s)>6?'#e0533d':'#fbfaf6')}disc(kx,ky,1,1,OL);
  // 投币口
  box(mx+7,my-35,9,15,'#c8b89a');R(mx+8,my-34,7,1,'#e8dccb');R(mx+11,my-32,1,10,OL);R(mx+10,my-32,1,10,'#8a7a66');
  // 出蛋口 + 翻盖
  R(mx-10,my-13,20,10,OL);R(mx-9,my-12,18,8,'#1a1220');const fh=Math.round(8*(1-flap));if(fh>0){R(mx-9,my-12,18,fh,'#b83e2c');R(mx-9,my-12,18,1,'#9e2f2a');if(fh>2)R(mx-3,my-12+fh-2,6,1,'#f07a5e')}
  // 脖子上一圈金属
  R(mx-22,my-52,44,5,OL);R(mx-21,my-51,42,3,'#c8b89a');R(mx-21,my-51,42,1,'#e8dccb');
  // 玻璃罩：先画深色的"透过玻璃看到的后面"，再画扭蛋，再画高光
  disc(mx,gy,GR+1,GR+1,OL);disc(mx,gy,GR,GR,'#8fb4c8');disc(mx,gy,GR-1,GR-1,'#26303f');
  for(let y=gy-GR+2;y<gy+GR;y++)for(let x=mx-GR+2;x<mx+GR;x++){const d=Math.hypot(x-mx,y-gy);if(d<GR-1&&dith(x,y,(1-(y-gy+GR)/(GR*2))*.35))P1(x,y,'#34425a')}
  const clip=(x,y)=>(x-mx)**2+(y-gy)**2<=(GR-1.5)**2;
  for(const c of caps){const j=jig*(Math.sin(t*23+c.ph)*2.2),k=jig*(Math.cos(t*19+c.ph*1.3)*1.6+Math.abs(Math.sin(t*13+c.ph))*-2.5);capsule(mx+c.x+j,gy+c.y+k,4,c.a+jig*Math.sin(t*9+c.ph),c.c,{clip})}
  for(let a=3.55;a<4.45;a+=.03)P1(Math.round(mx+Math.cos(a)*(GR-5)),Math.round(gy+Math.sin(a)*(GR-5)),'#ffffff');
  for(let a=3.7;a<4.2;a+=.04)P1(Math.round(mx+Math.cos(a)*(GR-8)),Math.round(gy+Math.sin(a)*(GR-8)),'#cfe8f4');
  P1(mx+13,gy+13,'#cfe8f4');P1(mx+14,gy+12,'#cfe8f4');P1(mx+15,gy+10,'#8fb4c8');
  // 顶上一块红帽子，两只耳朵：整台机器像一颗猫头
  for(let y=gy-GR-1;y<=gy-GR+6;y++){const s=Math.floor(Math.sqrt(Math.max(0,(GR+1)**2-(y-gy)**2)));R(mx-s,y,2*s+1,1,y===gy-GR+6||y===gy-GR-1?OL:'#e0533d');if(y>gy-GR-1&&y<gy-GR+6){P1(mx-s,y,OL);P1(mx+s,y,OL)}}
  R(mx-8,gy-GR,10,1,'#f07a5e');
  tri([mx-22,gy-13],[mx-7,gy-22],[mx-22,gy-34],'#e0533d','#f4a6b8');tri([mx+22,gy-13],[mx+7,gy-22],[mx+22,gy-34],'#e0533d','#f4a6b8');
  return{knob:{x:kx,y:ky,r:9},slot:{x:mx+11,y:my-32},chute:{x:mx,y:my-8},globe:{x:mx,y:gy,r:GR}}}
function coin(x,y,edge=0){const w=Math.max(1,Math.round(3*(1-edge)));disc(x,y,w+1,4,OL);disc(x,y,w,3,'#e8b83a');if(w>1){P1(x-1,y-1,'#fff0a8');P1(x,y-2,'#fff0a8')}}

/* ---------- 暗号的九个图案（9×9，左上角 x,y） ---------- */
const IC=[
  {rows:['.........','...oooo..','o.oyyyyo.','oooyyyyeo','oyyyyyyyo','oooylllyo','o.oyyyyo.','...oooo..','.........'],pal:{o:OL,y:'#a8bccb',l:'#dfe8ee',e:OL}},
  {fn:(x,y)=>{yarnBall(x+4,y+4,3,0);P1(x+8,y+7,'#e0533d');P1(x+7,y+8,'#e0533d')}},
  {rows:['....o....','...ooo...','..oyyyo..','..oylyo..','.oyyyyyo.','.oyyyyyo.','ooooooooo','...oko...','....o....'],pal:{o:OL,y:'#e8b83a',l:'#fff0a8',k:'#9a7414'}},
  {rows:['..pp.pp..','..pp.pp..','pp.....pp','pp.....pp','...ppp...','..ppppp..','.ppppppp.','.ppppppp.','..ppppp..'],pal:{p:'#e27a8f'}},
  {rows:['..s..s...','...s..s..','.........','ooooooo..','occccco..','owwwwwooo','owwwwwo.o','.owwwoooo','..ooo....'],pal:{o:OL,c:'#6e4a28',w:'#fff4dc',s:'#b9a8c9'}},
  {rows:['.........','...oo....','..okko...','.oggggoo.','oegggggo.','kgggggggo','.ooooooo.','......oo.','.......oo'],pal:{o:OL,g:'#b4acbc',k:'#f4a6b8',e:OL}},
  {rows:['.........','o.......o','oo.....oo','ooooooooo','obbbtbbbo','obbbtbbbo','obbbbbbbo','odddddddo','ooooooooo'],pal:{o:OL,b:'#d6a868',t:'#eadcb8',d:'#b88a4e'}},
  {rows:['.........','..oo.....','.oggo.oo.','.ogLgoggo','..ogoggo.','...oogo..','....oo...','....o....','....o....'],pal:{o:OL,g:'#7cc47a',L:'#b4e0a8'}},
  {rows:['...oooo..','..oyyyo..','.oyyo....','.oyo.....','.oyo.....','.oyyo....','..oyyyo..','...oooo..','.........'],pal:{o:OL,y:'#ffe08a'}}];
function icon(i,x,y){const d=IC[i];if(!d)return;if(d.fn)d.fn(x,y);else grid(x,y,d.rows,d.pal)}

/* ---------- 项圈牌（圆心 cx,cy）：四个格子放暗号图案，filled 是已经刻上的几个 ---------- */
function tag(cx,cy,code,t,{shine=0}={}){disc(cx,cy,16,16,OL);disc(cx,cy,15,15,'#c89a2c');disc(cx,cy,14,14,'#e8b83a');
  for(let a=3.6;a<4.6;a+=.04)P1(Math.round(cx+Math.cos(a)*12),Math.round(cy+Math.sin(a)*12),'#fff0a8');
  R(cx-2,cy-19,5,4,OL);R(cx-1,cy-18,3,2,'#c8b89a');
  for(let i=0;i<4;i++){const x=cx-10+(i%2)*11,y=cy-10+Math.floor(i/2)*11;if(code[i]!=null)icon(code[i],x,y);else{R(x+1,y+1,7,7,'#d4a432');R(x+2,y+2,5,5,'#c8962a')}}
  if(shine>0){const k=Math.floor(shine*30)-6;for(let j=-16;j<=16;j++){const x=cx+k+j*.4|0,y=cy+j;if((x-cx)**2+(y-cy)**2<196){P1(x,y,'#ffffff');P1(x+1,y,'#fff8d8')}}}}

/* ---------- 地上的聚光灯（中心 cx,cy）和从上面照下来的光柱 ---------- */
function spot(cx,cy,rx,ry,{bright='#4a3a60',mid='#30243e',k=1}={}){for(let y=-ry-4;y<=ry+4;y++)for(let x=-rx-8;x<=rx+8;x++){const d=Math.sqrt((x/rx)**2+(y/ry)**2),X=Math.round(cx+x),Y=Math.round(cy+y);
  if(d<.72*k)P1(X,Y,bright);else if(d<1*k){if(dith(X,Y,(1*k-d)/(.28*k)))P1(X,Y,bright);else P1(X,Y,mid)}else if(d<1.28*k&&dith(X,Y,(1.28*k-d)/(.28*k)))P1(X,Y,mid)}}
function shaft(cx,top,bot,w0,w1,t,k=1){for(let y=top;y<bot;y++){const f=(y-top)/(bot-top),hw=(w0+(w1-w0)*f)/2;for(let x=Math.floor(cx-hw);x<=cx+hw;x++){const e=1-Math.abs(x-cx)/hw,a=Math.min(1,e*1.6)*(.35+.4*f)*k;
    if(dith(x,y,a))P1(x,y,a>.55?'#fff4dc':'#ffe08a')}}
  for(let i=0;i<10;i++){const q=(t*.12+i*.1)%1,x=Math.round(cx+Math.sin(i*7.3+t*.8)*(w0/2+(w1-w0)*q/2)*.8),y=Math.round(top+(bot-top)*q);if(Math.floor(t*3+i)%3)P1(x,y,'#fff8e8')}}
function rays(cx,cy,r,t,col='#fff4dc'){for(let i=0;i<10;i++){const a=i/10*Math.PI*2+t*.4,r0=r*.35;for(let s=r0;s<r;s+=1){if(!dith(Math.round(cx+Math.cos(a)*s),Math.round(cy+Math.sin(a)*s),1-(s-r0)/(r-r0)))continue;P1(Math.round(cx+Math.cos(a)*s),Math.round(cy+Math.sin(a)*s),col)}}}

return{COLLAR_NAMES,LOOK_FACES,FACE_DESC,mix,dith,palOf,roll,describe,cat,catOl,capsule,pile,machine,coin,icon,tag,spot,shaft,rays,tri,globeY,ICON_N:IC.length}})();
