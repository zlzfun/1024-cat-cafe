/* 1024 猫咖 · "看风景"的画：四个画面 + 你的猫的背影。world4-vista.js 调这里。
   和店里一样的像素：1 倍像素、深色描边、色带之间用 4×4 抖动过渡；不缩放、不用抗锯齿的线和弧。
   不动的部分（天、远景、房间）画一次存成图层，换了时段、天气、画面大小才重画；会动的每帧画。
   夜里、黄昏：画笔套一层调色（颜色乘上夜色），发光的东西包在 lit() 里画，不压暗。
   依赖 scene-kit.js（R、P1、disc、grid、txt、knit、bird、yarnBall、glowTex、YARN）、world-kit.js（hsh、ring）、world4-atrium.js（leafMass、leafG）。只露出一个全局名 VA。 */
const VA=(()=>{
/* ---------- 调色 ---------- */
let TINT=null,LIT=0;const lit=f=>{LIT++;try{f()}finally{LIT--}};
const hexRGB=h=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]};
const hexK=(h,k)=>'#'+hexRGB(h).map(q=>Math.max(0,Math.min(255,Math.round(q*k))).toString(16).padStart(2,'0')).join('');
const mixHex=(a,b,k)=>{const p=hexRGB(a),q=hexRGB(b);return'#'+p.map((v,i)=>Math.round(v+(q[i]-v)*k).toString(16).padStart(2,'0')).join('')};
const TC=new Map(),mulHex=(hex,t)=>{const k=hex+t;let v=TC.get(k);if(v)return v;const a=hexRGB(hex),b=hexRGB(t);v='#'+a.map((q,i)=>Math.round(q*b[i]/255).toString(16).padStart(2,'0')).join('');TC.set(k,v);return v};
function tintCtx(real){const fns={};return new Proxy(real,{get(t,k){const v=t[k];return typeof v==='function'?(fns[k]||(fns[k]=v.bind(t))):v},set(t,k,v){if(k==='fillStyle'&&TINT&&!LIT&&typeof v==='string'&&v.length===7&&v[0]==='#')v=mulHex(v,TINT);t[k]=v;return true}})}
const TCTX=new WeakMap(),tctx=c=>{let p=TCTX.get(c);if(!p){p=tintCtx(c);TCTX.set(c,p)}return p};
const glow=(x,y,r,col,a)=>{C.save();C.globalCompositeOperation='lighter';C.globalAlpha=a;C.drawImage(glowTex(r,col),Math.round(x-r),Math.round(y-r));C.restore()};

/* ---------- 像素小工具 ---------- */
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],bay=(x,y)=>(BAY[(y&3)*4+(x&3)]+.5)/16;
// 竖着的渐变：一段一段色带，交界处 tz 行抖动过渡
function vGrad(x,y,w,h,cols,tz=8){const n=cols.length;for(let i=0;i<n;i++){const y0=Math.round(y+h*i/n),y1=Math.round(y+h*(i+1)/n);R(x,y0,w,y1-y0,cols[i])}
  for(let i=1;i<n;i++){const yb=Math.round(y+h*i/n),a=cols[i-1],b=cols[i];for(let yy=yb-tz/2;yy<yb+tz/2;yy++){const lv=(yy-yb+tz/2+.5)/tz;for(let xx=x;xx<x+w;xx++){const on=bay(xx,yy)<lv;if(yy<yb&&on)P1(xx,yy,b);else if(yy>=yb&&!on)P1(xx,yy,a)}}}}
function dith(x,y,w,h,col,lv){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(bay(i,j)<lv)P1(i,j,col)}
function layer(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),o=C;use(TINT?tctx(x):x);try{f()}finally{use(o)}return c}
const LC=new Map();function cached(key,w,h,f){const k=key+'|'+w+'|'+h+'|'+TINT;let c=LC.get(k);if(!c){if(LC.size>24)LC.delete(LC.keys().next().value);c=layer(w,h,f);LC.set(k,c)}return c}
// 一朵像素云：底下暗、上面亮
function cloudPx(x,y,sz,[hi,mid,lo],ears=0){const B=[[0,0,9,4],[8,-3,8,5],[-8,1,7,3],[15,1,6,3],[2,-5,6,4]].map(([a,b,rx,ry])=>[Math.round(x+a*sz),Math.round(y+b*sz),Math.round(rx*sz),Math.round(ry*sz)]);
  if(ears){const [hx,hy,hr]=[B[1][0],B[1][1],B[1][2]];for(const s of[-1,1])for(let j=0;j<5*sz;j++){const w0=Math.round((5*sz-j)*.5);R(hx+s*Math.round(hr*.55)-w0,hy-B[1][3]-5*sz+j+2,w0*2+1,1,mid)}}
  B.forEach(([cx,cy,rx,ry])=>disc(cx,cy,rx,ry,lo));B.forEach(([cx,cy,rx,ry])=>disc(cx,cy-1,rx,Math.max(1,ry-1),mid));B.forEach(([cx,cy,rx,ry])=>disc(cx-1,cy-2,Math.max(1,rx-2),Math.max(1,ry-2),hi))}
// 下雨、下雪：每一滴的起点随机撒开（不排成斜线），雨直直往下、雪一边飘一边落
function precip(x0,y0,w,h,t,kind,n,col){const snow=kind==='snow';for(let i=0;i<n;i++){const sp=(snow?18:200)*(.75+hsh(i,903)*.5),x=x0+Math.floor(((hsh(i,901)*w+(snow?Math.sin(t*1.3+i)*4+t*5:t*18))%w+w)%w),y=y0+Math.floor((hsh(i,902)*h+t*sp)%h);
  if(snow){P1(x,y,'#ffffff');if(i%7===0)P1(x+1,y,'#ffffff')}else R(x,y,1,3,col)}}
function starPx(x,y,big,col){P1(x,y,col);if(big){P1(x-1,y,hexK(col,.6));P1(x+1,y,hexK(col,.6));P1(x,y-1,hexK(col,.6));P1(x,y+1,hexK(col,.6))}}
// 窗里坐着的一只小猫（剪影）
function winCat(x,y,col){grid(x,y-7,["o...o","oo.oo","ooooo","ooooo",".ooo.","ooooo","ooooo"],{o:col})}
const SKYV={day:['#4f92d4','#63a4de','#7cb6e8','#98c8f0','#b8dcf6','#d6ecfa'],dusk:['#2e2a66','#553a7a','#8a4a80','#c85e72','#ec8160','#f8a860','#fcd08a'],night:['#060818','#0a0e26','#0f1432','#161c42','#1e2552','#28305e'],
  grey:{day:['#7e8a9c','#929eae','#a8b2c0','#bec6d0','#d0d6de'],dusk:['#4e4658','#6e5e6c','#907880','#b09490','#c8aca0'],night:['#0a0c1a','#10132a','#171b36','#1f2442','#282d4c']}};
const skyCols=(tod,wx)=>wx==='sun'?SKYV[tod]:SKYV.grey[tod];
const CLOUD={day:['#ffffff','#eef4fa','#c8d8ea'],dusk:['#ffe0c0','#f4a890','#b8708a'],grey:['#d8dee6','#bcc4d0','#9aa4b4']};

/* ---------- 你的猫的背影：逐像素算出来（大圆头、两颊的毛、尖耳朵、没有脖子、两边鼓出来的屁股、尾巴盘在地上往上卷） ---------- */
function catBackPx(pal,o){const s=o.s||1,tilt=o.tilt||0,look=o.look||0,tail=o.tail||0,earL=o.earL||0,earR=o.earR||0,breath=o.breath||0,rim=o.rim||pal.light||'#ffffff',mul=o.mul||null;
  const X0=Math.ceil(34*s),Y0=Math.ceil(76*s),W=X0*2+1,H=Y0+2;   // 锚点 (X0, Y0)：脚底中点
  const inE=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
  const tri=(x,y,a,b,c)=>{const d=(p,q,r)=>(p[0]-r[0])*(q[1]-r[1])-(q[0]-r[0])*(p[1]-r[1]);const d1=d([x,y],a,b),d2=d([x,y],b,c),d3=d([x,y],c,a);return!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))};
  const hx=tilt*2*s,hy=(-44-look*1.5)*s,hrx=17*s,hry=14.5*s;
  const ear=(sd,f)=>[[hx+sd*17.5*s,hy-2.5*s],[hx+sd*3*s,hy-14*s],[hx+sd*(14.5+f*3)*s,hy+(-25+f*3+tilt*sd)*s]];
  const EL=ear(-1,earL),ER=ear(1,earR),inEar=(x,y)=>tri(x,y,...EL)||tri(x,y,...ER);
  const tuft=(x,y)=>[-1,1].some(sd=>tri(x,y,[hx+sd*16.5*s,hy+3*s],[hx+sd*17*s,hy+8.5*s],[hx+sd*21.5*s,hy+8*s])||tri(x,y,[hx+sd*15.5*s,hy+9*s],[hx+sd*14*s,hy+12.5*s],[hx+sd*19.5*s,hy+12.5*s]));
  const head=(x,y)=>inE(x,y,hx,hy,hrx,hry)||inE(x,y,hx-12.5*s,hy+7*s,6.5*s,5*s)||inE(x,y,hx+12.5*s,hy+7*s,6.5*s,5*s)||inEar(x,y)||tuft(x,y);
  const brx=(14+breath*.6)*s,body=(x,y)=>y<=0&&(inE(x,y,0,-24*s,brx,12.5*s)||inE(x,y,0,-11*s,20.5*s,11.5*s));
  const TP=[[4,-2],[11,-2.2],[18,-3],[23.5,-5.5],[26.5,-9.5],[27+tail*1.2,-14],[25.5+tail*3,-17.5]].map(([x,y])=>[x*s,y*s]),TR=[3.3,3.2,3.1,3,2.9,2.7,2.5].map(r=>r*s);
  const tailU=(x,y)=>{for(let i=0;i<TP.length-1;i++){const [ax,ay]=TP[i],[bx,by]=TP[i+1],dx=bx-ax,dy=by-ay,u=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy))),r=TR[i]+(TR[i+1]-TR[i])*u;if((x-ax-dx*u)**2+(y-ay-dy*u)**2<=r*r)return i+u}return -1};
  const reg=new Uint8Array(W*H),tu=new Float32Array(W*H);   // 1 头 2 尾 3 身体
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const x=i-X0+.5,y=j-Y0+.5;let r=0;if(head(x,y))r=1;else{const q=tailU(x,y);if(q>=0){r=2;tu[j*W+i]=q}else if(body(x,y))r=3}reg[j*W+i]=r}
  const RG=(i,j)=>i<0||j<0||i>=W||j>=H?0:reg[j*W+i];
  const b=pal.body,sh=pal.shade||b,ol=pal.outline,pt=pal.points,st=pal.stripe,sp=pal.spot,sh2=hexK(sh,.86),col=new Array(W*H).fill(null);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const r=reg[j*W+i];if(!r)continue;const x=i-X0+.5,y=j-Y0+.5,q=tu[j*W+i];
    let nx=0,ny=0;if(r===1){nx=(x-hx)/hrx;ny=(y-hy)/hry}else if(r===3){if(y>-17*s){nx=x/(20.5*s);ny=(y+11*s)/(11.5*s)}else{nx=x/brx;ny=(y+24*s)/(12.5*s)}}
    let c=(nx*.62+ny*.78)>.3&&nx*nx+ny*ny>.5?sh:b;          // 左上来光：右下边上一弯暗面
    if(r===2)c=q<2.4?sh:b;
    if(r===3){let k=0;while(k<4&&RG(i,j-k-1)===3)k++;if(RG(i,j-k-1)===1&&k<Math.round(3*s))c=sh}   // 头在肩膀上投一道影
    const ear=r===1&&inEar(x,y)&&!inE(x,y,hx,hy,hrx*.96,hry*.96);
    if(pt&&(ear||(r===2&&q>2.2)))c=pt;
    if(st){if(r===1&&!ear){const lx=x-hx;for(const k of[-6,0,6])if(Math.abs(lx-k*s)<(k?.9:1.1)*s&&y<hy+5*s-Math.abs(k)*.4*s)c=st}
      if(r===3){if(Math.abs(x)<1.1*s&&y<-14*s)c=st;const yy=y+Math.pow(Math.abs(x)/(20*s),2)*7*s;for(const k of[-31,-25,-19,-13,-7])if(Math.abs(x)>3.5*s&&yy>(k-1)*s&&yy<=(k+.5)*s)c=st}
      if(r===2&&Math.floor(q*1.6)%2===1)c=st}
    if(sp&&((r===1&&inE(x,y,hx+7*s,hy-4*s,6*s,5*s))||(r===3&&(inE(x,y,-9*s,-24*s,7*s,6*s)||inE(x,y,12*s,-8*s,6*s,5*s)))||(r===2&&q>4)))c=sp;
    if(r!==2&&(RG(i,j-1)===0||RG(i-1,j)===0)&&!(r===3&&y>-8*s))c=rim;   // 上沿、左沿一道亮边（它看着亮处，这是轮廓光）
    if(r===3&&RG(i,j-1)===1)c=ol;
    if(r===2&&(RG(i,j-1)===3||RG(i-1,j)===3||RG(i+1,j)===3))c=ol;
    col[j*W+i]=c}
  for(let i=0;i<W;i++){if(Math.abs(i-X0+.5-hx)>10*s)continue;for(let j=0;j<H-1;j++)if(reg[j*W+i]===1&&reg[(j+1)*W+i]===3){for(let k=2;k<=1+Math.max(2,Math.round(1.6*s));k++)if(reg[(j+k)*W+i]===3)col[(j+k)*W+i]=pal.collar;break}}   // 后颈的项圈
  for(const sd of[-1,1])for(let a=-Math.PI/2;a>=-Math.PI*.95;a-=.02/s){const i=Math.round(X0+sd*(14*s+Math.cos(a)*9*s)-.5),j=Math.round(Y0-3*s+Math.sin(a)*9*s-.5);if(RG(i,j)===3&&col[j*W+i]!==ol)col[j*W+i]=sh2}   // 大腿
  if(pal.tuft)for(const E of[EL,ER]){const i=Math.round(X0+E[2][0]-.5),j=Math.round(Y0+E[2][1]-.5);for(let k=1;k<=2;k++)if(j-k>=0)col[(j-k)*W+i]=ol}
  const out=col.slice();for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(reg[j*W+i])continue;if(RG(i-1,j)||RG(i+1,j)||RG(i,j-1)||RG(i,j+1))out[j*W+i]=ol}
  const wk=pal.whisk||pal.light||b;for(const sd of[-1,1])for(const [y0,dx,dy] of[[4.5,8,-1.5],[8,7.5,1]]){const n=Math.round(7*s),cx=hx+sd*19*s,cy=hy+y0*s;for(let k=0;k<=n;k++){const i=Math.round(X0+cx+sd*dx*s*k/n-.5),j=Math.round(Y0+cy+dy*s*k/n-.5);if(i>=0&&i<W&&j>=0&&j<H&&!reg[j*W+i])out[j*W+i]=wk}}
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),im=g.createImageData(W,H),M=mul?hexRGB(mul):null,cache={};
  for(let p=0;p<W*H;p++){const c=out[p];if(!c)continue;let v=cache[c];if(!v){v=hexRGB(c);if(M&&c!==rim)v=v.map((q,k)=>Math.round(q*M[k]/255));cache[c]=v}im.data[p*4]=v[0];im.data[p*4+1]=v[1];im.data[p*4+2]=v[2];im.data[p*4+3]=255}
  g.putImageData(im,0,0);return{cv,ax:X0,ay:Y0}}
const CBC=new Map();
function cat(pi,x,bottom,o={}){const key=[pi,o.s||1,o.tilt||0,o.look||0,o.tail||0,o.earL||0,o.earR||0,o.breath||0,o.rim||'',TINT||''].join('|');let c=CBC.get(key);
  if(!c){if(CBC.size>40)CBC.delete(CBC.keys().next().value);c=catBackPx(PAL[pi],{...o,mul:TINT?mixHex(TINT,'#ffffff',o.soft??.45):null});CBC.set(key,c)}C.drawImage(c.cv,Math.round(x-c.ax),Math.round(bottom-c.ay));return c}
// 待着的小动作：尾尖一甩一甩、隔一阵抖一下耳朵、喘气
const idle=t=>({tail:Math.round(Math.sin(t*1.7)*2)/2,earL:(t%6.3)<.2?1:0,earR:(t%8.9)<.16?1:0,breath:Math.floor(t*.8)%2});

/* ================= 1. 橱窗外：对面一排小店 ================= */
const SHOPS=[{n:'BAKERY',wall:'#f2dcc2',aw:'#e0533d',win:'bread',roof:0},{n:'BOOKS',wall:'#c8d6e6',aw:'#5B9BD5',win:'books',roof:1},{n:'FLOWERS',wall:'#f4d6d2',aw:'#5B8C5A',win:'flowers',roof:0},{n:'TEA',wall:'#f5e4b2',aw:'#9B7EBD',win:'cups',roof:1,neon:1}];
const winGeo=(w,h)=>({F:9,sill:h-58,street:Math.round(h*.62),road0:Math.round(h*.62)+8,road1:Math.round(h*.755)});
function goods(kind,x,y,w){for(let i=0;i+6<w;i+=8){const cx=x+i;
  if(kind==='bread'){R(cx,y-4,7,4,OL);R(cx+1,y-3,5,3,'#e0a060');R(cx+1,y-3,5,1,'#f4c080');P1(cx+3,y-2,'#c47a3a')}
  else if(kind==='books'){[[0,6,0],[2,5,2],[4,6,3]].forEach(([a,hh,ci])=>{R(cx+a,y-hh,2,hh,YARN[(ci+i)%5][0]);P1(cx+a,y-hh,YARN[(ci+i)%5][2])})}
  else if(kind==='flowers'){R(cx+1,y-3,5,3,OL);R(cx+2,y-2,3,2,'#c46a44');[[2,-6],[4,-7],[3,-8]].forEach(([a,b],k)=>{P1(cx+a,y+b+2,'#5B8C5A');R(cx+a,y+b,1,1,['#f4a6b8','#ffd84a','#e0533d'][(k+i)%3])})}
  else{R(cx,y-4,5,4,OL);R(cx+1,y-3,3,3,'#fff4dc');P1(cx+5,y-3,OL);P1(cx+2,y-3,'#9B7EBD');if(i%16===0){P1(cx+2,y-6,'#ffffff');P1(cx+3,y-7,'#ffffff')}}}}
function shopPx(x,top,wd,bot,s,i,night){
  if(s.roof){for(let j=0;j<9;j++){const ins=9-j;R(x-3+ins,top-9+j,wd+6-2*ins,1,j===0?OL:j%3===2?'#7a3c30':'#9a4e3e')}}
  else{R(x-2,top-4,wd+4,5,OL);R(x-1,top-3,wd+2,1,hexK(s.wall,1.04));R(x-1,top-2,wd+2,2,hexK(s.wall,.82))}
  R(x,top,wd,bot-top,OL);R(x+1,top+1,wd-2,bot-top-1,s.wall);for(let yy=top+5;yy<bot;yy+=5)R(x+1,yy,wd-2,1,hexK(s.wall,.95));
  // 二楼两扇窗 + 花箱；有的窗台上坐着一只猫
  const uy=top+7;[.12,.58].forEach((fx,k)=>{const wx0=x+Math.round(wd*fx),ww=Math.round(wd*.3),wh=20;R(wx0,uy,ww,wh,OL);R(wx0+1,uy+1,ww-2,wh-2,'#fff4dc');const gx=wx0+2,gy=uy+2,gw=ww-4,gh=wh-4;
    if(night)lit(()=>R(gx,gy,gw,gh,'#ffd98a'));else{R(gx,gy,gw,gh,'#9fc4e0');for(let q=0;q<6;q++)P1(gx+2+q,gy+gh-2-q,'#cfe6f6')}
    if((i*2+k)%3===1)winCat(gx+gw-8,gy+gh,night?'#4a3040':'#3e3846');
    R(gx+(gw>>1),gy,1,gh,'#fff4dc');R(gx,gy+(gh>>1),gw,1,'#fff4dc');
    R(wx0-1,uy+wh,ww+2,4,OL);R(wx0,uy+wh+1,ww,2,'#8a5a3a');for(let q=1;q<ww-1;q+=2){P1(wx0+q,uy+wh-1,q%4?'#5B8C5A':'#4a7a4a');if(q%4===1)P1(wx0+q,uy+wh-2,['#f4a6b8','#ffd84a','#e0533d'][(q+i)%3])}});
  // 招牌、遮阳篷（条纹，下沿一排小弧）
  const sy=uy+29,tw=txtW(s.n),bx=x+Math.round((wd-tw)/2)-4;R(bx,sy,tw+8,9,OL);R(bx+1,sy+1,tw+6,7,'#2e2438');
  if(s.neon&&night)lit(()=>{txt(s.n,bx+4,sy+2,'#ff9ac0');glow(bx+tw/2+4,sy+4,22,'#ff5a9a',.35)});else txt(s.n,bx+4,sy+2,'#fff4dc');
  const ay=sy+11;R(x-1,ay,wd+2,1,OL);for(let a=0;a<wd;a++){const c=Math.floor(a/6)%2?s.aw:'#fff4dc',m=a%6;R(x+a,ay+1,1,7,m===0?hexK(c,.9):c);P1(x+a,ay+8,m===0||m===5?OL:c);if(m>0&&m<5)P1(x+a,ay+9,OL)}
  // 一楼：橱窗、门
  const gy0=ay+11,dw=Math.round(wd*.58);R(x+4,gy0,dw,bot-gy0-3,OL);R(x+5,gy0+1,dw-2,bot-gy0-5,'#fff4dc');
  const gx=x+6,gyy=gy0+2,gw=dw-4,gh=bot-gy0-7;if(night)lit(()=>{R(gx,gyy,gw,gh,'#ffe9b0');goods(s.win,gx+2,gyy+gh-1,gw-2)});else{R(gx,gyy,gw,gh,'#dff0f7');goods(s.win,gx+2,gyy+gh-1,gw-2);for(let q=0;q<8;q++)P1(gx+3+q,gyy+9-q,'#ffffff')}
  const dx0=x+Math.round(wd*.68),dww=wd-Math.round(wd*.68)-6;R(dx0,gy0,dww,bot-gy0,OL);R(dx0+1,gy0+1,dww-2,bot-gy0-1,'#8a5a3a');R(dx0+3,gy0+3,dww-6,10,OL);
  if(night)lit(()=>R(dx0+4,gy0+4,dww-8,8,'#ffd98a'));else R(dx0+4,gy0+4,dww-8,8,'#9fc4e0');P1(dx0+dww-4,gy0+Math.round((bot-gy0)*.6),'#ffd84a');
  R(x,bot-1,wd,1,OL)}
// 路灯：灯杆下半截套着店里织的毛线套
function lampPx(x,base,hh,night,ci){R(x,base-hh,2,hh,OL);R(x-2,base-2,6,2,OL);const n=Math.round(hh*.5);for(let j=0;j<n;j++){const Y=YARN[(Math.floor(j/3)+ci)%5];R(x-1,base-3-j,4,1,j%3===0?Y[1]:Y[0])}R(x-2,base-3-n,6,1,OL);
  const ly=base-hh-8;R(x-3,ly-1,8,2,OL);R(x-2,ly,6,8,OL);R(x-1,ly+1,4,6,night?'#ffe08a':'#efdcb8');P1(x,ly-2,OL);if(night)lit(()=>{R(x-1,ly+1,4,6,'#ffe08a');glow(x+1,ly+4,30,'#ffcf70',.5)});return ly}
// 行道树：树干也穿着毛线套
function treePx(x,base,night){R(x-8,base-5,18,5,OL);R(x-7,base-4,16,3,'#8a5a3a');R(x-1,base-40,4,36,OL);for(let j=0;j<16;j++){const Y=YARN[(Math.floor(j/4)+2)%5];R(x,base-5-j,2,1,j%4===0?Y[1]:Y[0])}R(x,base-39,2,18,'#6e4430');
  line(x+1,base-38,x-8,base-50,OL);line(x+2,base-38,x+10,base-52,OL);
  const cs=[[-12,-54,11,8],[11,-56,12,8],[0,-62,13,9],[-6,-70,9,6],[8,-71,8,6],[-17,-60,6,5],[18,-62,6,5]];
  cs.forEach(([a,b,rx,ry])=>disc(x+1+a,base+b,rx+1,ry+1,'#8a4e14'));cs.forEach(([a,b,rx,ry])=>disc(x+1+a,base+b,rx,ry,'#c98a1e'));cs.forEach(([a,b,rx,ry])=>disc(x+a,base+b-1,rx-2,ry-2,'#e8b83a'));cs.forEach(([a,b,rx,ry])=>disc(x-1+a,base+b-3,Math.max(1,rx-6),Math.max(1,ry-4),'#f7c940'));
  for(let i=0;i<40;i++){const [a,b,rx,ry]=cs[i%cs.length],q=hsh(i,315)*Math.PI*2;P1(Math.round(x+a+Math.cos(q)*rx*.8),Math.round(base+b+Math.sin(q)*ry*.8),i%3?'#fff0a8':'#c98a1e')}}
function winOut(w,h,S){const G=winGeo(w,h),tod=S.tod||'day',wx=S.weather||'sun',night=tod==='night';
  lit(()=>vGrad(0,0,w,G.street,skyCols(tod,wx)));
  if(night&&wx==='sun')lit(()=>{for(let i=0;i<40;i++)starPx(Math.floor(hsh(i,301)*w),Math.floor(hsh(i,302)*60),i%9===0,'#fff4dc');const mx=Math.round(w*.84),my=18;glow(mx,my,26,'#c8d4ff',.4);disc(mx,my,7,7,'#fff4dc');disc(mx+2,my-1,2,2,'#e8e0c8');P1(mx-3,my+2,'#e8e0c8')});
  if(tod==='dusk'&&wx==='sun')lit(()=>glow(w*.2,G.street-30,90,'#ffb070',.5));
  // 远处的屋顶和一座钟楼
  const far=night?'#1c2040':tod==='dusk'?'#6a4a6a':wx==='sun'?'#a8b6d0':'#9aa2b0';
  for(let i=0,x=-6;x<w;i++){const bw=14+Math.floor(hsh(i,303)*16),bh=46+Math.floor(hsh(i,304)*40);lit(()=>{R(x,G.street-bh-60,bw,bh+60,far);if(hsh(i,305)<.4)R(x+3,G.street-bh-66,3,6,far)});if(night)lit(()=>{for(let k=0;k<3;k++)if(hsh(i,k+306)<.4)P1(x+3+k*4,G.street-bh-55+k*6,'#ffe08a')});x+=bw+1}
  const tx=Math.round(w*.57);lit(()=>{R(tx,8,16,G.street,far);for(let j=0;j<6;j++)R(tx+8-j,j+2,j*2,1,far);R(tx+7,-2,2,4,far)});lit(()=>{disc(tx+8,20,4,4,night?'#ffe08a':'#e8e0c8');P1(tx+8,18,OL);P1(tx+8,19,OL);P1(tx+9,20,OL)});
  // 对面的四家店（一直排满，最右一家露半截）
  let x=-40;for(let i=0;x<w;i++){const s=SHOPS[i%SHOPS.length],wd=118+Math.floor(hsh(i,310)*16),top=G.street-100-Math.floor(hsh(i,311)*14);shopPx(x,top,wd,G.street,s,i,night);x+=wd+2}
  // 人行道、马路、电车轨道、架空线
  R(0,G.street,w,G.road0-G.street,'#cfc6b8');for(let x2=0;x2<w;x2+=12)R(x2,G.street,1,G.road0-G.street,'#b4aa9a');R(0,G.road0-2,w,2,'#8a8278');
  const wet=wx==='rain';R(0,G.road0,w,G.road1-G.road0,wet?'#3e404e':'#5a5a66');if(!wet)dith(0,G.road0,w,G.road1-G.road0,'#62626e',.25);
  [G.road0+9,G.road1-9].forEach(y=>{R(0,y,w,1,'#b4b8c4');R(0,y+1,w,1,'#34343e')});
  R(0,G.road1,w,2,'#8a8278');R(0,G.road1+2,w,G.sill-G.road1,'#d8d0c4');for(let x2=0;x2<w;x2+=20)R(x2,G.road1+2,1,G.sill-G.road1,'#bcb2a4');
  if(wet)for(let i=0;i<5;i++){const px=Math.round(hsh(i,320)*w),pw=18+Math.floor(hsh(i,321)*20);disc(px,G.road1+8,pw>>1,2,'#8a9ab0');if(night)lit(()=>R(px-3,G.road1+7,6,1,'#ffe08a'))}
  // 路灯、行道树，灯杆之间挂一串织的三角旗
  const lamps=[];[[.07,0],[.25,1],[.64,0],[.81,1],[.98,0],[1.16,1]].forEach(([fx,tr],i)=>{const lx=Math.round(w*fx);if(lx>w+20)return;if(tr)treePx(lx,G.street+4,night);else lamps.push({x:lx,y:lampPx(lx,G.street+4,58,night,i)})});
  for(let i=0;i+1<lamps.length;i++){const a=lamps[i],b=lamps[i+1],n=b.x-a.x;for(let k=0;k<=n;k++){const y=a.y+2+Math.round(Math.sin(k/n*Math.PI)*10);P1(a.x+k,y,OL);if(k%10===5&&k<n-4){const Y=YARN[(k/10|0)%5];R(a.x+k-2,y+1,5,1,Y[0]);R(a.x+k-1,y+2,3,1,Y[0]);P1(a.x+k,y+3,Y[1]);P1(a.x+k-2,y+1,Y[2])}}}
  R(0,G.road0-46,w,1,'#4a4a5a');
  if(wx==='snow'){R(0,G.road1,w,2,'#ffffff');R(0,G.street,w,2,'#ffffff')}}
// 电车：乘客都是猫
function tramPx(x,y,L,night,dir,wy){const H=30;
  line(x+Math.round(L*.42),y-3,x+Math.round(L*.5),wy+1,OL);line(x+Math.round(L*.58),y-3,x+Math.round(L*.5),wy+1,OL);R(x+Math.round(L*.46),wy+1,Math.round(L*.08),1,OL);
  R(x+6,y-4,L-12,4,OL);R(x+7,y-3,L-14,3,'#d8ccb0');
  R(x+1,y,L-2,H,OL);R(x,y+2,L,H-4,OL);R(x+2,y+1,L-4,H-2,'#f2e6c8');R(x+1,y+3,L-2,H-6,'#f2e6c8');R(x+1,y+H-11,L-2,8,'#5B8C5A');R(x+1,y+H-11,L-2,1,'#7aaa78');R(x+2,y+1,L-4,1,'#fffaf0');
  const PC=['#3e3846','#f0a352','#9a8a70','#fff3e0','#d6dae0','#dcb46c'];
  for(let i=0,n=Math.floor((L-24)/18);i<n;i++){const wx=x+12+i*18,wy=y+4;R(wx,wy,14,12,OL);const g=night?'#ffe9b0':'#8fc8f0';if(night)lit(()=>R(wx+1,wy+1,12,10,g));else R(wx+1,wy+1,12,10,g);
    if(hsh(i,331)<.75){const cc=PC[(i*7)%PC.length];grid(wx+3+(i%3),wy+4,["o...o","oo.oo","ooooo","ooooo","ooooo","ooooo"],{o:night?'#4a3040':cc});if(!night){P1(wx+4+(i%3),wy+6,OL)}}
    if(!night){P1(wx+10,wy+2,'#ffffff');P1(wx+9,wy+3,'#ffffff')}}
  const fx=dir>0?x+L-4:x+1;R(fx,y+H-9,3,3,'#fff4dc');if(night)lit(()=>{R(fx,y+H-9,3,3,'#fff8d0');glow(fx+(dir>0?8:-6),y+H-8,18,'#fff4c0',.6)});
  txt('1024',x+Math.round(L/2)-7,y+H-9,'#fff4dc');
  for(const fx2 of[.14,.28,.72,.86])disc(x+Math.round(L*fx2),y+H,3,2,OL)}
function winIn(w,h,S){const G=winGeo(w,h),F=G.F;
  R(0,0,w,h,'#fff4dc');R(0,0,w,1,'#e0d0b0');R(F-3,F-3,w-2*F+6,1,'#e0d0b0');
  C.clearRect(F,F,w-2*F,G.sill-F);R(F-1,F-1,w-2*F+2,1,OL);R(F-1,F-1,1,G.sill-F+1,OL);R(w-F,F-1,1,G.sill-F+1,OL);R(F-2,F-2,w-2*F+4,1,'#d8c8a8');
  // 窗帘：两边收在腰上，褶子往系带那儿收
  const cw=Math.round(w*.1),yt=Math.round(G.sill*.52);for(const sd of[-1,1])for(let y=0;y<G.sill;y++){const k=Math.min(1,Math.abs(y-yt)/(yt*.9)),e=Math.round(cw*(.5+.5*Math.pow(k,.8))),x0=sd<0?0:w-e;
    R(x0,y,e,1,'#e88aa0');for(let f=1;f<5;f++){const fx=Math.round(e*f/5);P1(sd<0?fx:w-1-fx,y,'#c46a82')}P1(sd<0?e-1:w-e,y,'#fbb4c4');P1(sd<0?e:w-e-1,y,OL)}
  for(const sd of[-1,1]){const e=Math.round(cw*.5)+3;R(sd<0?0:w-e,yt-1,e,4,OL);R(sd<0?0:w-e,yt,e-1,2,'#e8b83a')}
  // 窗台和底下的墙
  R(0,G.sill,w,1,OL);R(0,G.sill+1,w,4,'#e0a878');R(0,G.sill+1,w,1,'#f4c898');R(0,G.sill+5,w,1,OL);R(0,G.sill+6,w,5,'#b87a4a');R(0,G.sill+11,w,1,OL);
  R(0,G.sill+12,w,h-G.sill-12,'#9a6448');R(0,G.sill+12,w,2,'#7a4c36');for(let x=6;x<w-20;x+=26){R(x,G.sill+20,20,1,'#7a4c36');R(x,G.sill+34,20,1,'#7a4c36');R(x,G.sill+20,1,15,'#7a4c36');R(x+19,G.sill+20,1,15,'#7a4c36')}
  // 窗台上：一盆草、一颗毛线球
  const px=Math.round(w*.83),py=G.sill+3;R(px-6,py-10,13,10,OL);R(px-5,py-9,11,8,'#c46a44');R(px-5,py-9,11,1,'#e08a5a');R(px-6,py-11,13,2,OL);R(px-5,py-11,11,1,'#d87a50');
  [[0,-20,5,4],[-5,-16,4,3],[5,-17,4,3],[-1,-25,3,3],[3,-23,3,2]].forEach(([a,b,rx,ry])=>disc(px+a,py+b,rx+1,ry+1,OL));[[0,-20,5,4],[-5,-16,4,3],[5,-17,4,3],[-1,-25,3,3],[3,-23,3,2]].forEach(([a,b,rx,ry],i)=>{disc(px+a,py+b,rx,ry,i%2?'#4a8a4e':'#5ea85e');P1(px+a-1,py+b-1,'#8cd08a')});
  yarnBall(Math.round(w*.2),G.sill+1,3,1)}
function winFrame(E){const {w,h,t,S,V}=E,G=winGeo(w,h),tod=S.tod||'day',wx=S.weather||'sun',night=tod==='night';
  C.drawImage(cached('winOut'+tod+wx,w,h,()=>winOut(w,h,S)),0,0);
  if(wx==='sun'&&!night){const cc=tod==='dusk'?CLOUD.dusk:CLOUD.day;cloudPx(Math.round((t*4)%(w+120))-60,14,1,cc);cloudPx(Math.round((t*2.6+w*.55)%(w+120))-60,30,1,cc)}
  if(night&&wx==='sun')lit(()=>{for(let i=0;i<8;i++)if(Math.floor(t*1.5+i*.7)%5===0)starPx(Math.floor(hsh(i,301)*w),Math.floor(hsh(i,302)*60),1,'#ffffff')});
  // 电车：18 秒一趟，来回换方向
  const per=18,cyc=Math.floor(t/per),ph=(t%per)/per;if(ph<.5){const L=Math.min(w-40,300),dir=cyc%2?-1:1,p=ph/.5,tx=Math.round(dir>0?-L+(w+L)*p:w-(w+L)*p),ty=G.road0-26;tramPx(tx,ty,L,night,dir,G.road0-46)}
  // 麻雀：隔一阵落在窗外的人行道上；敲玻璃就飞走
  const bp=(t%11)/11,bc=Math.floor(t/11),sh=V.shoo!=null&&Math.floor(V.shoo/11)===bc?t-V.shoo:-1,birdOn=bp>.25&&bp<.8&&sh<1.2;V.birdOn=birdOn;
  if(birdOn){const bx=Math.round(w*.66)+(sh>=0?Math.round(sh*50):0),by=G.sill-3-(sh>=0?Math.round(sh*90):bp>.74?Math.round((bp-.74)*400):0);bird(bx,by,t,{dir:sh>=0?1:-1,fly:bp>.74||sh>=0})}
  if(wx==='rain'||wx==='snow')precip(0,0,w,G.sill,t,wx,Math.floor(w*h/(wx==='rain'?420:360)),night?'#6a7ab0':'#eef3f8');
  // 玻璃：两道斜的反光；下雨天玻璃上挂着水珠，有几颗往下淌
  for(const [x0,y0,n] of[[22,52,16],[27,54,10],[34,52,5]])for(let q=0;q<n;q++){P1(x0+q,y0-q*2,'#ffffff');if(bay(q,x0)<.5)P1(x0+q+1,y0-q*2,'#ffffff')}
  if(wx==='rain'){for(let i=0;i<50;i++){const x=Math.round(G.F+hsh(i,340)*(w-2*G.F)),y=Math.round(G.F+hsh(i,341)*(G.sill-G.F-4));R(x,y,2,2,'#e6eef6');P1(x,y+2,'#8a9ab0')}
    for(let i=0;i<7;i++){const x=Math.round(G.F+hsh(i,342)*(w-2*G.F)),y0=G.F+((t*(10+i*3)+hsh(i,343)*200)%(G.sill-G.F));for(let k=1;k<8;k++)if(bay(x,Math.round(y0)-k)<.6)P1(x,Math.round(y0)-k,'#cfdcea');R(x,Math.round(y0),2,2,'#f2f6fa')}}
  C.drawImage(cached('winIn',w,h,()=>winIn(w,h,S)),0,0);
  // 窗里的晾衣绳：这扇窗真挂着的成品
  const f=G.F+6,ly=G.F+8,slots=((S.lines||[])[V.o.w||0]||[]),sag=x=>Math.round(Math.sin((x-f)/(w-2*f)*Math.PI)*6);for(let x=f;x<w-f;x++)P1(x,ly+sag(x),'#8a5a3a');
  slots.forEach((it,i)=>{if(!it)return;const x=Math.round(f+(w-2*f)*(i+.5)/slots.length),y=ly+sag(x);R(x,y-1,1,3,'#e8b83a');knit(it.kind,x,y+2,it.ci)});
  if(wx==='snow')R(0,G.sill,w,1,'#ffffff');
  cat(E.pal,Math.round(w*.44),G.sill+4,{...idle(t),tilt:birdOn?1:0,earR:birdOn?1:idle(t).earR,rim:night?'#ffe0a0':tod==='dusk'?'#ffd0a0':'#fff8e8'})}

/* ================= 2. 图书馆窗边：看天 ================= */
function skyGeo(w,h){const ww=Math.round(w*.44/2)*2,ar=ww/2,cx=Math.round(w/2),wy0=Math.round(h*.06),wy1=Math.round(h*.7);return{ww,ar,cx,wx0:cx-ar,wx1:cx+ar,wy0,wy1,spring:wy0+ar,seat:Math.round(h*.79)}}
const archHW=(G,y,a=G.ar)=>y>=G.spring?a:Math.floor(Math.sqrt(Math.max(0,a*a-(G.spring-y+.5)**2)));
// 星座：窗里的相对位置（0～1），连线的顺序
const CONS=[{n:'猫座',p:[[.30,.34],[.28,.16],[.37,.26],[.46,.26],[.52,.14],[.52,.34],[.60,.52],[.62,.70],[.40,.72],[.76,.68],[.82,.52]],e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,0],[7,9],[9,10]]},
  {n:'毛线球座',p:[[.40,.22],[.52,.24],[.58,.36],[.54,.49],[.42,.51],[.34,.40],[.62,.60],[.72,.56],[.80,.66]],e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[3,6],[6,7],[7,8]]},
  {n:'小鱼干座',p:[[.24,.42],[.40,.30],[.56,.42],[.40,.54],[.70,.30],[.70,.54],[.30,.40]],e:[[0,1],[1,2],[2,3],[3,0],[2,4],[4,5],[5,2]]}];
function skyBack(w,h,S){const G=skyGeo(w,h),tod=S.tod||'day',wx=S.weather||'sun',night=tod==='night';
  lit(()=>vGrad(0,0,w,G.wy1,skyCols(tod,wx),10));
  if(night&&wx==='sun')lit(()=>{
    // 银河：从左下斜到右上的一条，抖动的淡光 + 密密的小星星
    const ax=G.wx0,ay=G.wy1-20,bx=G.wx1,by=G.wy0+16,L=Math.hypot(bx-ax,by-ay),nx=-(by-ay)/L,ny=(bx-ax)/L;
    for(let y=G.wy0;y<G.wy1;y++)for(let x=G.wx0;x<G.wx1;x++){const d=Math.abs((x-ax)*nx+(y-ay)*ny);if(d<22){const lv=(1-d/22)*.45;if(bay(x,y)<lv)P1(x,y,d<9?'#3a4284':'#2a3068')}}
    for(let i=0;i<180;i++){const u=hsh(i,351),v=(hsh(i,352)-.5)*30,x=Math.round(ax+(bx-ax)*u+nx*v),y=Math.round(ay+(by-ay)*u+ny*v);P1(x,y,i%4?'#c8ccff':'#ffffff')}
    for(let i=0;i<90;i++)starPx(G.wx0+Math.floor(hsh(i,353)*G.ww),G.wy0+Math.floor(hsh(i,354)*(G.wy1-G.wy0)),i%11===0,i%3?'#e8e8ff':'#fff4dc');
    const mx=G.cx+Math.round(G.ar*.5),my=G.wy0+Math.round(G.ar*.55);glow(mx,my,44,'#c8d4ff',.35);disc(mx,my,12,12,'#fff4dc');disc(mx+3,my-4,3,2,'#e8e0c8');disc(mx-4,my+3,2,2,'#e8e0c8');disc(mx+4,my+5,2,1,'#e8e0c8');R(mx-9,my-6,2,1,'#ffffff')});
  else if(tod==='dusk'&&wx==='sun')lit(()=>{glow(G.cx-G.ar*.3,G.wy1-10,80,'#ffb070',.55);const mx=G.cx+Math.round(G.ar*.45),my=G.wy0+Math.round(G.ar*.6);disc(mx,my,7,7,'#fff4dc');disc(mx+3,my-2,6,6,'#8a4a80');starPx(G.cx-Math.round(G.ar*.4),G.wy0+30,1,'#ffffff')});
  else if(wx==='sun')lit(()=>glow(G.cx+G.ar*.6,G.wy0+10,70,'#fff4c0',.35));
  // 窗底下一排屋顶和电视塔
  const far=night?'#0c0e22':tod==='dusk'?'#4a3050':wx==='sun'?'#7a8cb0':'#7e8696';
  lit(()=>{for(let i=0,x=G.wx0-4;x<G.wx1;i++){const bw=10+Math.floor(hsh(i,355)*14),bh=8+Math.floor(hsh(i,356)*16);R(x,G.wy1-bh,bw,bh,far);if(i%3===0)R(x+2,G.wy1-bh-4,2,4,far);if(hsh(i,357)<.3)for(let j=0;j<4;j++)R(x+bw/2-j,G.wy1-bh-4+j,j*2+1,1,far);x+=bw}
    const tv=G.wx0+Math.round(G.ww*.2);R(tv,G.wy1-60,2,60,far);disc(tv+1,G.wy1-44,3,2,far);R(tv,G.wy1-64,2,4,far)});
  if(night)lit(()=>{for(let i=0;i<30;i++)P1(G.wx0+Math.floor(hsh(i,358)*G.ww),G.wy1-2-Math.floor(hsh(i,359)*12),'#ffe08a')})}
function skyRoom(w,h,S){const G=skyGeo(w,h),night=S.tod==='night';
  R(0,0,w,h,'#4a3428');for(let x=4;x<w;x+=34){R(x,0,28,h,'#54392c');R(x,0,1,h,'#664c3c');R(x+27,0,1,h,'#3e2a20')}
  // 两边的书架
  const sw=Math.max(0,G.wx0-58);if(sw>20)for(const sd of[-1,1]){const x0=sd<0?0:w-sw;R(x0,0,sw,h,'#3e2a20');for(let yy=10;yy<G.seat-10;yy+=30){R(x0,yy+22,sw,4,'#6e4430');R(x0,yy+22,sw,1,'#8a5a3a');let bx=x0+3,i=0;while(bx<x0+sw-5){const bw=3+Math.floor(hsh(bx,yy)*3),bh=13+Math.floor(hsh(yy,bx)*8),Y=YARN[(i+yy)%5];R(bx,yy+22-bh,bw,bh,hexK(Y[0],.75));P1(bx,yy+22-bh,Y[2]);if(bw>3)R(bx+1,yy+22-bh+4,bw-2,1,hexK(Y[1],.8));bx+=bw+(hsh(i,yy)<.15?3:0);i++}}}
  // 拱形窗：挖一个洞，外圈木框，中间一根竖棂、两道横棂
  for(let y=G.wy0;y<G.wy1;y++){const hw=archHW(G,y);C.clearRect(G.cx-hw,y,hw*2,1)}
  const inA=(x,y,a)=>y<G.wy1+1&&y>=G.spring-a&&Math.abs(x-G.cx+.5)<archHW(G,y,a)+.5;
  for(let y=G.wy0-8;y<G.wy1;y++)for(let x=G.wx0-8;x<G.wx1+8;x++){if(!inA(x,y,G.ar+7)||inA(x,y,G.ar))continue;P1(x,y,!inA(x,y,G.ar+6)?OL:inA(x,y,G.ar+1)?'#a8703f':inA(x,y,G.ar+2)?'#8a5a3a':'#6e4430')}
  R(G.cx-2,G.wy0,4,G.wy1-G.wy0,'#6e4430');R(G.cx-1,G.wy0,1,G.wy1-G.wy0,'#8a5a3a');R(G.cx-2,G.wy0,1,G.wy1-G.wy0,OL);R(G.cx+2,G.wy0,1,G.wy1-G.wy0,OL);
  for(const yy of[G.spring,Math.round((G.spring+G.wy1)/2)]){const hw=archHW(G,yy);R(G.cx-hw,yy-2,hw*2,4,'#6e4430');R(G.cx-hw,yy-2,hw*2,1,OL);R(G.cx-hw,yy+2,hw*2,1,OL);R(G.cx-hw,yy-1,hw*2,1,'#8a5a3a')}
  R(G.wx0-12,G.wy1,G.ww+24,6,OL);R(G.wx0-11,G.wy1+1,G.ww+22,2,'#a8703f');R(G.wx0-11,G.wy1+3,G.ww+22,2,'#6e4430');
  // 窗帘：从横杆上垂下来，腰上用金色系带收住
  const cw=Math.round(w*.11),rodY=G.wy0-12;R(G.wx0-cw-10,rodY,G.ww+2*cw+20,3,OL);R(G.wx0-cw-9,rodY+1,G.ww+2*cw+18,1,'#e8b83a');disc(G.wx0-cw-10,rodY+1,3,3,'#e8b83a');disc(G.wx1+cw+10,rodY+1,3,3,'#e8b83a');
  const yt=Math.round(G.wy0+(G.wy1-G.wy0)*.55);for(const sd of[-1,1])for(let y=rodY+3;y<G.wy1+4;y++){const k=Math.min(1,Math.abs(y-yt)/((yt-rodY)*.9)),e=Math.round(cw*(.55+.45*Math.pow(k,.8))),x0=sd<0?G.wx0-cw+2:G.wx1+cw-2-e;
    const ex=sd<0?x0:x0;R(ex,y,e,1,'#6a8ac8');for(let f=1;f<5;f++)P1(ex+Math.round(e*f/5),y,'#4a6aa8');P1(sd<0?ex+e-1:ex,y,OL);P1(sd<0?ex:ex+e-1,y,'#8aa8e0')}
  for(const sd of[-1,1]){const e=Math.round(cw*.55)+2,x0=sd<0?G.wx0-cw+1:G.wx1+cw-1-e;R(x0,yt-1,e,4,OL);R(x0+1,yt,e-2,2,'#e8b83a')}
  // 软座：垫子、钮扣；左边一摞书，右边一条针织毯
  const sy=G.seat;R(0,sy,w,h-sy,OL);R(0,sy+1,w,7,'#b8a0d8');R(0,sy+1,w,1,'#d0bce4');R(0,sy+8,w,1,'#8a70b0');R(0,sy+9,w,h-sy-9,'#9B7EBD');for(let x=14;x<w;x+=36){R(x,sy+18,2,2,'#654a86');R(x+18,sy+30,2,2,'#654a86')}
  const bx0=Math.round(w*.2);[[0,'#5B9BD5'],[-2,'#e0533d'],[1,'#e8b83a']].forEach(([dx,c],i)=>{const y=sy-5*(i+1)+1,bw=30-i*3;R(bx0+dx,y,bw,5,OL);R(bx0+dx+1,y+1,bw-2,3,c);R(bx0+dx+1,y+1,bw-2,1,hexK(c,1.2));R(bx0+dx+bw-4,y+1,2,3,'#fff4dc')});
  const bl=Math.round(w*.66),bw=Math.round(w*.22),bh=Math.round((h-sy)*.75),BC=[YARN[0],YARN[4],YARN[1]];R(bl,sy-3,bw,bh,OL);
  for(let y=sy-2;y<sy-3+bh-1;y++){const Y=BC[Math.floor((y-sy+2)/7)%3];R(bl+1,y,bw-2,1,Y[0]);const ly=(y-sy+2)%7;if(ly===2||ly===3)for(let x=bl+2+(ly===3?1:0);x<bl+bw-2;x+=3)P1(x,y,Y[1]);if(ly===0)R(bl+1,y,bw-2,1,Y[2])}
  for(let x=bl+2;x<bl+bw-2;x+=2)R(x,sy-3+bh,1,3,BC[Math.floor((x-bl)/8)%3][0])}
function skyFrame(E){const {w,h,t,S,V}=E,G=skyGeo(w,h),tod=S.tod||'day',wx=S.weather||'sun',night=tod==='night';
  C.drawImage(cached('skyBack'+tod+wx,w,h,()=>skyBack(w,h,S)),0,0);
  if(night&&wx==='sun')lit(()=>{for(let i=0;i<14;i++)if(Math.floor(t*1.3+i*.61)%6===0)starPx(G.wx0+Math.floor(hsh(i,353)*G.ww),G.wy0+Math.floor(hsh(i,354)*(G.wy1-G.wy0)),1,'#ffffff');
    // 星座：看一会儿，星星一颗颗亮起来，再一笔笔连上
    const c=V.con;if(c){const K=CONS[c.i],k=t-c.t0,P2=K.p.map(([u,v])=>[Math.round(G.wx0+u*G.ww),Math.round(G.wy0+v*(G.wy1-G.wy0-24))]);
      P2.forEach(([x,y],i)=>{if(k>i*.12)starPx(x,y,1,'#fff8d0')});K.e.forEach(([a,b],i)=>{const q=Math.max(0,Math.min(1,(k-1.4-i*.28)/.28));if(!q)return;const [x0,y0]=P2[a],[x1,y1]=P2[b],n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
        for(let j=2;j<=n*q-2;j+=2)P1(Math.round(x0+(x1-x0)*j/n),Math.round(y0+(y1-y0)*j/n),'#9fb4ff')})}
    const s=V.star;if(s){const a=t-s.t0;if(a<1)for(let i=0;i<18;i++){const q=a*1.4-i*.012;if(q<0||bay(i,Math.floor(a*20))>1-i/18)continue;P1(Math.round(s.x+s.dx*q),Math.round(s.y+s.dy*q),i<3?'#ffffff':'#fff8d0')}}});
  else if(wx==='sun'){const cc=tod==='dusk'?CLOUD.dusk:CLOUD.day;const k0=t-V.t0;cloudPx(G.wx0+Math.round((k0*3+G.ww*.15)%(G.ww+120))-60,G.wy0+44,1,cc);cloudPx(G.wx0+Math.round((k0*1.6+G.ww*.62)%(G.ww+120))-60,G.wy0+92,1,cc,1);cloudPx(G.wx0+Math.round((k0*2.2+G.ww*.95)%(G.ww+140))-70,G.wy0+128,1,cc);
    const bp=(t%9)/9;if(bp<.6)for(let i=0;i<3;i++){const bx=G.wx0+Math.round(G.ww*(bp/.6))-i*7,by=G.wy0+70+i*3+(i%2),f=Math.floor(t*6+i)%2;P1(bx,by,OL);R(bx-2,by-(f?1:0),2,1,OL);R(bx+1,by-(f?1:0),2,1,OL)}}
  if(wx==='rain'){const col=night?'#5a6a98':'#eef3f8';precip(G.wx0,G.wy0,G.ww,G.wy1-G.wy0,t,'rain',90,col);for(let i=0;i<30;i++){const x=G.wx0+Math.round(hsh(i,360)*G.ww),y=G.wy0+20+Math.round(hsh(i,361)*(G.wy1-G.wy0-24));R(x,y,2,2,'#dfe8f2')}}
  else if(wx==='snow')precip(G.wx0,G.wy0,G.ww,G.wy1-G.wy0,t,'snow',80,'#ffffff');
  C.drawImage(cached('skyRoom',w,h,()=>skyRoom(w,h,S)),0,0);
  // 杯子和热气
  const mx=Math.round(w*.61),sy=G.seat;R(mx,sy-10,9,10,OL);R(mx+1,sy-9,7,8,'#fff4dc');R(mx+1,sy-9,7,1,'#8a5a3a');R(mx+9,sy-8,2,1,OL);R(mx+10,sy-7,1,3,OL);R(mx+9,sy-4,2,1,OL);
  for(let i=0;i<3;i++){const q=(t*.9+i/3)%1;if(bay(i,Math.floor(q*8))<1-q)P1(mx+4+Math.round(Math.sin((q+i)*5)*2),sy-12-Math.round(q*12),'#ffffff')}
  if(night)lit(()=>glow(G.cx,G.seat-30,90,'#9fb4ff',.18));
  cat(E.pal,G.cx,G.seat+4,{...idle(t),look:1,rim:night?'#c8d4ff':tod==='dusk'?'#ffc890':'#ffffff'})}

/* ================= 3. 毛线巨树的树顶：整条街、远处的海 ================= */
const ROOFS=[['#c46a44','#e08a5a','OPEN','#ff7a9a'],['#b85a4a','#d8806c'],['#3c4670','#5a6690','1024','#7ee08a'],['#5c4436','#7a5c48'],['#8a5a3a','#a8703f'],['#c46a82','#e88aa0']];
const topGeo=(w,h)=>({hz:Math.round(h*.46),cafe:Math.round(h*.74),plank:Math.round(h*.86)});
function house(x,base,bw,bh,roof,wall,night,seed){R(x,base-bh,bw,bh,OL);R(x+1,base-bh+1,bw-2,bh-1,wall);const rh=Math.max(3,Math.round(bw*.35));for(let j=0;j<rh;j++){const ins=Math.round((rh-j)*bw/(2*rh));R(x-1+ins,base-bh-rh+j,bw+2-2*ins,1,j===0?OL:roof)}
  for(let k=0;k<Math.floor((bw-2)/4);k++)for(let r=0;r<Math.floor((bh-2)/5);r++){const lx=x+2+k*4,ly=base-bh+2+r*5;if(night){if(hsh(seed+k,r)<.6)lit(()=>R(lx,ly,2,2,'#ffe08a'));else R(lx,ly,2,2,hexK(wall,.6))}else R(lx,ly,2,2,'#8fb8d8')}}
function topBack(w,h,S){const G=topGeo(w,h),tod=S.tod||'day',wx=S.weather||'sun',night=tod==='night',sun=wx==='sun';
  lit(()=>vGrad(0,0,w,G.hz+2,skyCols(tod,wx),10));
  if(sun){if(night)lit(()=>{for(let i=0;i<120;i++)starPx(Math.floor(hsh(i,371)*w),Math.floor(hsh(i,372)*G.hz*.9),i%13===0,i%3?'#e8e8ff':'#fff4dc');const mx=Math.round(w*.22),my=Math.round(h*.13);glow(mx,my,40,'#c8d4ff',.35);disc(mx,my,9,9,'#fff4dc');disc(mx+3,my-2,2,2,'#e8e0c8');disc(mx-3,my+3,2,1,'#e8e0c8')});
    else if(tod==='dusk')lit(()=>{const sx=Math.round(w*.72);glow(sx,G.hz,110,'#ffb060',.6);for(let y=-22;y<=0;y++){const hw=Math.floor(Math.sqrt(22*22-y*y));R(sx-hw,G.hz+y,hw*2+1,1,y>-6?'#ffb050':y>-14?'#ffc868':'#ffe08a')}
      for(let i=0;i<5;i++){const y=Math.round(h*(.16+i*.06)),x0=Math.round(hsh(i,373)*w*.6);R(x0,y,Math.round(w*(.25+hsh(i,374)*.3)),2,i%2?'#f8a860':'#e8807a');R(x0+6,y+2,Math.round(w*.2),1,'#c86a7a')}});
    else lit(()=>{const sx=Math.round(w*.56),sy=Math.round(h*.13);glow(sx,sy,50,'#fff4c0',.5);disc(sx,sy,8,8,'#fff8d8')})}
  // 远山（左边）、海（右边，天边那条线）
  const mt=night?['#161a38','#1c2046']:tod==='dusk'?['#5a3a60','#7a4a6a']:sun?['#8a9cc4','#a8b8d8']:['#8a92a2','#a0a8b6'];
  lit(()=>{for(let x=0;x<w*.62;x++){const u=x/(w*.62),y1=Math.round(G.hz-(Math.sin(x*.021+1)*.5+Math.sin(x*.057)*.25+.8)*h*.1*(1-u*.8)),y2=Math.round(G.hz-(Math.sin(x*.034+2)*.5+Math.sin(x*.09)*.2+.6)*h*.06*(1-u*.6));R(x,y1,1,G.hz-y1+2,mt[1]);R(x,y2,1,G.hz-y2+2,mt[0]);if(!night&&y1<G.hz-h*.12)P1(x,y1,'#ffffff')}});
  // 地面先铺满，再画海：海岸线从左往右斜下去
  const land=night?['#1a2034','#161b2c']:tod==='dusk'?['#8a6a6a','#7a5a60']:sun?['#a4b27a','#94a46c']:['#8e9486','#80867a'];R(0,G.hz,w,h-G.hz,land[0]);dith(0,G.hz,w,h-G.hz,land[1],.3);
  const sea=night?'#101838':tod==='dusk'?'#8a5a7a':sun?'#4a86c0':'#7a8898',coast=x=>Math.max(0,Math.min(34,Math.round((x-w*.36)*.16)));
  for(let x=Math.round(w*.36);x<w;x++){const d=coast(x);if(d>0){R(x,G.hz,1,d,sea);P1(x,G.hz+d,hexK(land[0],1.15))}}for(let i=0;i<60;i++){const x=Math.round(w*.4+hsh(i,375)*w*.6),y=G.hz+2+Math.floor(hsh(i,376)*28);if(y<G.hz+coast(x)-1)R(x,y,3+Math.floor(hsh(i,377)*5),1,hexK(sea,1.25))}
  if(tod==='dusk'&&sun)lit(()=>{const sx=Math.round(w*.72);for(let y=G.hz+1;y<G.hz+30;y+=2){const hw=Math.round(8+(y-G.hz)*.7);for(let x=sx-hw;x<sx+hw;x+=3)if(bay(x,y)<.6)R(x,y,2,1,'#ffc868')}});
  // 灯塔：海边一块礁石上，红白条
  const lx=Math.round(w*.9),ly=G.hz+6;disc(lx+2,ly+4,12,5,night?'#1a1c30':'#6a6258');R(lx-2,ly-24,6,24,OL);for(let j=0;j<23;j++)R(lx-1,ly-23+j,4,1,Math.floor(j/5)%2?'#fff4dc':'#e0533d');R(lx-3,ly-30,8,6,OL);lit(()=>R(lx-2,ly-29,6,4,night?'#fff8c0':'#ffe890'));R(lx-2,ly-32,6,2,OL);
  // 城：三排房子，越近越大；一条河弯弯地流进海里，河上一座桥
  const rv=night?'#1a2448':tod==='dusk'?'#9a6a88':'#5a96d0';for(let y=G.hz+8;y<h;y++){const cx=Math.round(w*.5+Math.sin((y-G.hz)*.05)*w*.08-(y-G.hz)*.6),hw=Math.round(3+(y-G.hz)*.18);R(cx-hw,y,hw*2,1,rv);if(y%3===0)P1(cx-hw+2+((y*7)%Math.max(1,hw*2-4)),y,hexK(rv,1.35))}
  const WALLS=['#f2dcc2','#e8d0b0','#d8c8b8','#f4e4c4','#e0c8c0'],RFS=['#b85a4a','#c46a44','#8a5a3a','#5c4436','#3c4670','#6a7a4a'];
  const rows=[[G.hz+14,7,5,9],[G.hz+30,11,8,13],[G.hz+50,15,11,17],[G.hz+76,19,14,22]];rows.forEach(([base,bw0,bh0,step],r)=>{for(let i=0,x=-8+r*5;x<w;i++){const bw=bw0+Math.floor(hsh(i,380+r)*4),bh=bh0+Math.floor(hsh(i,383+r)*6);
    const ry=base-G.hz,rcx=Math.round(w*.5+Math.sin(ry*.05)*w*.08-ry*.6),rhw=Math.round(3+ry*.18);if(Math.abs(x+bw/2-rcx)<rhw+bw/2+1){x+=bw+step-bw0+2;continue}
    if(hsh(i,386+r)<.18){const tr=Math.round(bw*.45);disc(x+tr,base-tr,tr+1,tr,OL);disc(x+tr,base-tr,tr,tr-1,r%2?'#e8b83a':'#5e8a4a');disc(x+tr-1,base-tr-1,Math.max(1,tr-2),Math.max(1,tr-3),r%2?'#f7c940':'#7aa860')}
    else house(x,base+Math.floor(hsh(i,389)*3),bw,bh,RFS[(i+r)%RFS.length],WALLS[(i*3+r)%WALLS.length],night,i*7+r);x+=bw+step-bw0+2}});
  const bY=G.hz+40,bcx=Math.round(w*.5+Math.sin(40*.05)*w*.08-40*.6);R(bcx-18,bY,36,3,OL);R(bcx-17,bY+1,34,1,'#cfc6b8');for(let k=-14;k<=14;k+=7)R(bcx+k,bY+3,2,4,OL);
  // 钟楼
  const ct=Math.round(w*.34);house(ct,G.hz+34,12,40,'#5c4436','#e8dcc8',night,99);lit(()=>disc(ct+6,G.hz+2,3,3,night?'#ffe08a':'#fff4dc'));P1(ct+6,G.hz+1,OL);P1(ct+6,G.hz+2,OL);
  // 猫咖这一排：OPEN、1024 的招牌，后院的串灯
  const rw=Math.round(Math.min(56,w*.11)),rx0=Math.round(w*.42);R(rx0-4,G.cafe-30,rw*6+8,48,land[0]);ROOFS.forEach(([a,l,sign,sc],i)=>{const x=rx0+i*rw,rh=18,peak=6+(i%3)*2;R(x,G.cafe-rh,rw-1,rh+14,OL);R(x+1,G.cafe+1,rw-3,12,'#f2dcc2');
    for(let j=0;j<rh;j++){const ins=Math.max(0,Math.round((peak-j)*1.4));R(x+1+ins,G.cafe-rh+1+j,rw-3-2*ins,1,j%3?a:l)}for(let q=x+4;q<x+rw-6;q+=7){R(q,G.cafe+4,4,5,OL);if(night)lit(()=>R(q+1,G.cafe+5,2,3,'#ffd98a'));else R(q+1,G.cafe+5,2,3,'#8fc8f0')}
    if(sign){const tw=txtW(sign);R(x+Math.round((rw-tw)/2)-2,G.cafe-rh-9,tw+4,8,'#2a2238');lit(()=>txt(sign,x+Math.round((rw-tw)/2),G.cafe-rh-7,sc))}
    if(i===3||i===5){const chx=x+rw-10;R(chx,G.cafe-rh-6,5,8,OL);R(chx+1,G.cafe-rh-5,3,7,'#8e4a3c')}})}
function topFront(w,h,S){const G=topGeo(w,h);
  // 近处：巨树的金色树冠，铺满下沿和两个角
  const L=[];for(let i=0;i*28<w+60;i++)L.push({x:i*28-10,y:h-6+Math.round(hsh(i,391)*10),rx:24+Math.round(hsh(i,392)*8),ry:16+Math.round(hsh(i,393)*6)});for(let i=0;i*46<w+60;i++)if(Math.abs(i*46-w*.26)>60)L.push({x:i*46+12,y:h-22+Math.round(hsh(i,394)*8),rx:20+Math.round(hsh(i,397)*8),ry:12+Math.round(hsh(i,398)*5)});
  L.push({x:-6,y:Math.round(h*.78),rx:34,ry:24},{x:w+6,y:Math.round(h*.76),rx:36,ry:26},{x:w-30,y:Math.round(h*.9),rx:34,ry:20},{x:w+10,y:-10,rx:40,ry:30},{x:w-40,y:6,rx:24,ry:16});leafMass(L,L);
  // 右上角伸进来一根枝，挂着店里织的东西和一盏灯笼
  const by=18;for(let x=Math.round(w*.62);x<w;x++){const yy=by+Math.round((w-x)*.06);R(x,yy-3,1,7,OL);R(x,yy-2,1,5,'#8a5a3a');P1(x,yy-2,'#b07a48')}
  [['scarf',0,.7],['hat',1,.78],['sock',3,.86]].forEach(([k,ci,fx],i)=>{const x=Math.round(w*fx),yy=by+Math.round((w-x)*.06)+2;R(x,yy,1,6+i*3,'#d9d2c4');knit(k,x,yy+6+i*3,ci)});
  // 瞭望台：两块木板和一道绳栏
  const px=Math.round(w*.26),py=G.plank;R(px-44,py,88,6,OL);R(px-43,py+1,86,1,'#e0a878');R(px-43,py+2,86,3,'#b87a4a');for(let x=px-40;x<px+44;x+=11)P1(x,py+3,'#8a5a3a');
  [px-44,px+41].forEach(x=>{R(x,py-16,3,16,OL);R(x+1,py-15,1,15,'#b87a4a')});for(let i=0;i<82;i++)P1(px-42+i,py-13+Math.round(Math.sin(i/82*Math.PI)*4),'#d9d2c4')}
function topFrame(E){const {w,h,t,S,V}=E,G=topGeo(w,h),tod=S.tod||'day',wx=S.weather||'sun',night=tod==='night';
  C.drawImage(cached('topBack'+tod+wx,w,h,()=>topBack(w,h,S)),0,0);
  if(night&&wx==='sun')lit(()=>{for(let i=0;i<16;i++)if(Math.floor(t*1.2+i*.53)%6===0)starPx(Math.floor(hsh(i,371)*w),Math.floor(hsh(i,372)*G.hz*.9),1,'#ffffff')});
  if(wx==='sun'&&tod!=='night'){const cc=tod==='dusk'?CLOUD.dusk:CLOUD.day;cloudPx(Math.round((t*3)%(w+140))-70,Math.round(h*.1),1,cc);cloudPx(Math.round((t*1.8+w*.5)%(w+140))-70,Math.round(h*.24),1,cc)}
  // 灯塔的光：夜里扫过海面
  const lx=Math.round(w*.9),ly=G.hz-21;if(night)lit(()=>{const L=Math.round(Math.cos(t*.9)*170);if(Math.abs(L)>12)for(let d=4;d<Math.abs(L);d++){const x=lx+Math.sign(L)*d,hw=Math.floor(d*.07);if(x<0||x>=w)break;for(let k=-hw;k<=hw;k++)if(bay(x,ly+k)<.4*(1-d/Math.abs(L)))P1(x,ly+k,'#fff8c0')}});
  // 毛线球热气球：慢慢飘过去，篮子里坐着一只猫
  const bx=Math.round(((w*.62+(t-V.t0)*5)%(w+80))-40),bby=Math.round(h*.2+Math.sin(t*.5)*4);for(let j=-12;j<=12;j++){const hw=Math.floor(10*Math.sqrt(1-(j/13)**2));R(bx-hw-1,bby+j,hw*2+3,1,OL)}for(let j=-11;j<=11;j++){const hw=Math.floor(9*Math.sqrt(1-(j/12.5)**2));for(let x=-hw;x<=hw;x++)P1(bx+x,bby+j,YARN[((x+j+40)>>2)%5][((x-j+40)>>1)%2?0:2])}
  line(bx-6,bby+11,bx-3,bby+18,OL);line(bx+6,bby+11,bx+3,bby+18,OL);R(bx-4,bby+18,9,5,OL);R(bx-3,bby+19,7,3,'#b87a4a');grid(bx-2,bby+14,["o...o","oo.oo","ooooo"],{o:'#f0a352'});
  const bp=(t%14)/14;if(!night&&bp<.7)for(let i=0;i<5;i++){const x=Math.round(w*1.05-w*1.2*bp/.7)+Math.abs(i-2)*7,y=Math.round(h*.3)-Math.abs(i-2)*3+i,f=Math.floor(t*5+i)%2;P1(x,y,OL);R(x-2,y-(f?1:0),2,1,OL);R(x+1,y-(f?1:0),2,1,OL)}
  // 猫咖的串灯：后院跑轮发的电
  const rw=Math.round(Math.min(56,w*.11)),x0=Math.round(w*.42)+rw*4,x1=x0+rw*2,y0=G.cafe-6,n=10,on=Math.ceil((S.power||0)*n-.001);for(let x=x0;x<x1;x++)P1(x,y0+Math.round(Math.sin((x-x0)/(x1-x0)*Math.PI)*4),OL);
  for(let i=0;i<n;i++){const x=Math.round(x0+(x1-x0)*(i+.5)/n),y=y0+Math.round(Math.sin((i+.5)/n*Math.PI)*4)+1;R(x,y,2,2,'#6a5a6a');if(i<on)lit(()=>R(x,y,2,2,FEST_COL[i%5]))}
  if(Math.floor(t*1.5)%2)lit(()=>P1(Math.round(w*.34)+6,G.hz-8,'#e0533d'));
  // 烟花
  V.fx=V.fx.filter(p=>t-p.t0<1.9);if(V.fx.length)lit(()=>V.fx.forEach(p=>{const a=t-p.t0;if(a<0)return;const r=(1-Math.pow(1-Math.min(1,a/.9),2))*p.r,g=a*a*10,fade=Math.max(0,1-a/1.9);
    for(let i=0;i<28;i++){if(bay(i,Math.floor(a*12))>fade+.1)continue;const q=i/28*Math.PI*2,x=Math.round(p.x+Math.cos(q)*r),y=Math.round(p.y+Math.sin(q)*r*.9+g);R(x,y,2,2,i%3?p.col:'#fff8d0');if(a>.2)P1(Math.round(p.x+Math.cos(q)*r*.78),Math.round(p.y+Math.sin(q)*r*.7+g-1),p.col)}}));
  if(wx==='rain'||wx==='snow')precip(0,0,w,h,t,wx,Math.floor(w*h/(wx==='rain'?320:340)),night?'#6a7ab0':'#e6ecf4');
  C.drawImage(cached('topFront',w,h,()=>topFront(w,h,S)),0,0);
  for(let i=0;i<10;i++){const q=((t*.1+hsh(i,395))%1),x=Math.round(w*1.05-q*w*1.2+Math.sin(t*1.3+i)*10),y=Math.round(h*(.12+hsh(i,396)*.7)+q*40);leafG(x,y,i)}
  cat(E.pal,Math.round(w*.26),G.plank+1,{...idle(t),rim:night?'#c8d4ff':tod==='dusk'?'#ffc070':'#fff8e0'})}

/* ================= 4. 鱼缸：凑近看鱼，伸爪碰碰玻璃 ================= */
const FISH=[[".....ooooo...","oo..obbbbbbo.","oaoobbbbbbbbo","oaaabbbbbbebo","oaoobddddbbbo","oo..oddddddo.",".....ooooo..."],
            [".....ooooo...","o...obbbbbbo.","ooaobbbbbbbbo","oaaabbbbbbebo","ooaobddddbbbo","o...oddddddo.",".....ooooo..."]];
const FISH_COL=[['#f08a4a','#c46a2a','#ffc890'],['#ffd84a','#c9a030','#fff0a8'],['#fff4dc','#e0533d','#ffffff'],['#5B9BD5','#34618f','#a8d0f0']];
function fishPx(x,y,dir,[b,a,d],t,ph){const g=FISH[Math.floor(t*5+ph)%2],pal={o:OL,b,a,d,e:'#241a2e'};grid(x-6,y-3,dir>0?g:g.map(r=>[...r].reverse().join('')),pal)}
const tankGeo=(w,h)=>({top:Math.round(h*.08),sand:Math.round(h*.8)});
function tankBack(w,h){const G=tankGeo(w,h);R(0,0,w,G.top,'#2a2238');R(0,G.top-3,w,3,'#6b7480');R(0,G.top-3,w,1,'#9aa3ad');
  vGrad(0,G.top,w,G.sand-G.top+6,['#aee6f6','#90d6ee','#74c2e2','#5aaad6','#4892c4','#3a7cb2'],10);
  // 光柱：从水面斜着照下来
  for(let r=0;r<4;r++){const x0=Math.round(w*(.12+r*.24)),wd=14+r*4;for(let y=G.top;y<G.sand;y++){const k=(y-G.top)/(G.sand-G.top),xs=x0+Math.round(k*60);for(let x=xs;x<xs+wd;x++)if(bay(x,y)<.2*(1-k))P1(x,y,'#e6fbff')}}
  // 沙子、石子
  R(0,G.sand,w,h-G.sand,'#e6d49a');for(let x=0;x<w;x++){const y=G.sand+Math.round(Math.sin(x*.05)*2);R(x,y,1,G.sand-y+2,'#e6d49a');P1(x,y,'#f4e8b8')}dith(0,G.sand+12,w,h-G.sand-12,'#d4c088',.35);
  for(let i=0;i<34;i++){const x=Math.round(hsh(i,401)*w),y=G.sand+6+Math.round(hsh(i,402)*(h-G.sand-10)),c=['#c46a44','#8a93a8','#f4a6b8','#fff4dc','#6a8a5a'][i%5];disc(x,y,3,2,OL);disc(x,y,2,1,c);P1(x-1,y-1,'#ffffff')}
  // 城堡
  const cx=Math.round(w*.72),cb=G.sand+4,cw=54,chh=46;R(cx,cb-chh,cw,chh,OL);R(cx+1,cb-chh+1,cw-2,chh-1,'#9aa3ad');for(let j=cb-chh+4;j<cb;j+=6)for(let i=cx+2+((j/6)%2)*4;i<cx+cw-3;i+=8)R(i,j,6,1,'#7a8490');
  [[cx-6,18,62],[cx+cw-12,18,62]].forEach(([tx,tw,th])=>{R(tx,cb-th,tw,th,OL);R(tx+1,cb-th+1,tw-2,th-1,'#a8b0ba');for(let i=0;i<tw;i+=5){R(tx+i,cb-th-4,3,4,OL);R(tx+i+1,cb-th-3,1,3,'#a8b0ba')}R(tx+6,cb-th+12,5,7,'#2a2238');R(tx+7,cb-th+12,3,1,'#3a3a4a')});
  for(let j=0;j<18;j++){const hw=j<5?Math.floor(Math.sqrt(25-(5-j)**2)):5;R(cx+cw/2-hw,cb-18+j,hw*2,1,'#241a2e')}for(let i=0;i<cw;i+=6){R(cx+i,cb-chh-4,4,4,OL);R(cx+i+1,cb-chh-3,2,3,'#9aa3ad')}txt('1024',cx+cw/2-7,cb-chh+8,'#fff4dc');
  // 宝箱：盖子开着，里面一颗毛线球
  const kx=Math.round(w*.16),ky=G.sand+2;R(kx,ky-12,26,12,OL);R(kx+1,ky-11,24,10,'#8a5a3a');R(kx+1,ky-11,24,2,'#e8b83a');R(kx+11,ky-8,4,4,'#e8b83a');R(kx+2,ky-22,24,8,OL);R(kx+3,ky-21,22,6,'#a8703f');R(kx+3,ky-21,22,1,'#e8b83a');yarnBall(kx+13,ky-14,4,0);
  // 两块大石头
  [[Math.round(w*.42),G.sand+2,16,9],[Math.round(w*.5),G.sand+4,10,6]].forEach(([x,y,rx,ry])=>{disc(x,y,rx+1,ry+1,OL);disc(x,y,rx,ry,'#6b7480');disc(x-3,y-3,rx-5,ry-4,'#8a93a8');P1(x-6,y-5,'#b4bcc8')})}
function tankFront(w,h){const G=tankGeo(w,h);R(0,G.top-3,4,h,'#2a2238');R(w-4,G.top-3,4,h,'#2a2238');R(4,G.top,1,h,'#6b7480');R(w-5,G.top,1,h,'#6b7480');
  for(const [x0,y0,n] of[[16,70,22],[23,72,14],[32,70,6]])for(let q=0;q<n;q++){P1(x0+q,y0-q*2,'#f4feff');if(bay(q,x0)<.5)P1(x0+q+1,y0-q*2,'#f4feff')}}
function tankInit(V,w,h){const G=tankGeo(w,h);V.fish=Array.from({length:6},(_,i)=>({x:w*(.15+hsh(i,411)*.7),y:G.top+20+hsh(i,412)*(G.sand-G.top-50),tx:0,ty:0,sp:14+hsh(i,413)*10,dir:1,scare:0,ci:i%4,gold:false,ph:i*.3}));V.nextGold=V.t0+12+Math.random()*8;V.bub=[];V.W=w;V.H=h;V.lt=null}
function tankFrame(E){const {w,h,t,S,V}=E,G=tankGeo(w,h);if(!V.fish||V.W!==w||V.H!==h)tankInit(V,w,h);const dt=Math.min(.05,V.lt==null?0:t-V.lt);V.lt=t;
  C.drawImage(cached('tankBack',w,h,()=>tankBack(w,h)),0,0);
  // 水面一道波纹
  for(let x=0;x<w;x++){const y=G.top+Math.round(Math.sin(x*.06+t*2)*1.2);P1(x,y,'#e6fbff');if((x+Math.floor(t*6))%9===0)P1(x,y+1,'#ffffff')}
  // 沙子上晃动的光斑
  for(let i=0;i<24;i++){const x=Math.round(hsh(i,421)*w+Math.sin(t*1.2+i)*6),y=G.sand+3+Math.round(hsh(i,422)*10);if((Math.floor(t*2)+i)%3)R(x,y,3,1,'#fff4c8')}
  // 水草：一节一节，左右摆
  [[.05,70],[.09,52],[.3,40],[.62,58],[.93,74],[.97,50]].forEach(([fx,hh],p)=>{const px=Math.round(w*fx);for(let j=0;j<hh;j+=2){const sw=Math.round(Math.sin(t*1.4+j*.08+p)*3*(j/hh));R(px+sw,G.sand-j,3,2,p%2?'#4a9a5a':'#5ea85e');if(j%6===0)P1(px+sw+(j%12?3:-1),G.sand-j,'#7ec87a')}R(px-1,G.sand,5,2,'#35593a')});
  // 气泡：从宝箱里冒出来
  if(Math.random()<dt*3)V.bub.push({x:Math.round(w*.16)+13+Math.round(Math.random()*6-3),y:G.sand-16,r:1+Math.round(Math.random())});V.bub=V.bub.filter(b=>(b.y-=dt*36)>G.top+2);
  V.bub.forEach(b=>{const x=Math.round(b.x+Math.sin(b.y*.1)*2),y=Math.round(b.y);if(b.r>1){R(x-1,y-2,3,1,'#eaf8ff');R(x-1,y+2,3,1,'#eaf8ff');R(x-2,y-1,1,3,'#eaf8ff');R(x+2,y-1,1,3,'#eaf8ff');P1(x-1,y-1,'#ffffff')}else{R(x-1,y-1,2,1,'#eaf8ff');R(x-1,y+1,2,1,'#eaf8ff');P1(x-2,y,'#eaf8ff');P1(x+1,y,'#eaf8ff')}});
  // 鱼：慢慢游；被爪子吓到的猛地游开；隔一阵来一条金鱼
  if(t>V.nextGold&&!V.fish.some(f=>f.gold)){const f=V.fish[Math.floor(Math.random()*V.fish.length)];f.gold=true;f.goldT=t+8+Math.random()*4;V.nextGold=t+25+Math.random()*15}
  V.fish.forEach(f=>{if(f.gold&&t>f.goldT)f.gold=false;if(!f.tx||Math.hypot(f.tx-f.x,f.ty-f.y)<4){f.tx=w*(.08+Math.random()*.84);f.ty=h*.3+Math.pow(Math.random(),.7)*(G.sand-18-h*.3)}
    const sp=f.scare>0?f.sp*4:f.sp;f.scare=Math.max(0,f.scare-dt);const dx=f.tx-f.x,dy=f.ty-f.y,d=Math.hypot(dx,dy)||1;f.x+=dx/d*Math.min(d,sp*dt);f.y+=dy/d*Math.min(d,sp*dt*.6);if(Math.abs(dx)>1)f.dir=dx>0?1:-1;
    fishPx(Math.round(f.x),Math.round(f.y+Math.sin(t*3+f.ph)),f.dir,f.gold?['#ffd84a','#e8b83a','#fff4a0']:FISH_COL[f.ci],t,f.ph);if(f.gold&&Math.floor(t*6)%2)lit(()=>spark(Math.round(f.x+f.dir*8),Math.round(f.y-5),t+.2))});
  C.drawImage(cached('tankFront',w,h,()=>tankFront(w,h)),0,0);
  // 你的猫：凑得很近，只露出头和肩膀；跟着鼠标左右挪（坐在目标旁边一点，爪子从侧面伸出去，不被头挡住），只够得着身前一段
  const s=1.7,bottom=h+Math.round(20*s);V.cx=V.cx??w/2;const px0=V.px??w/2,want=Math.max(w*.2,Math.min(w*.8,px0+(px0<w/2?44:-44)));V.cx+=(want-V.cx)*Math.min(1,dt*4);const catX=Math.round(V.cx);
  const aim=tankReach(V,w,h),pal=PAL[E.pal];
  if(!V.tap&&V.px!=null)ring(aim.x,aim.y,6,'#ffffff');
  if(V.tap){const a=t-V.tap.t0,p=a<.12?a/.12:a<.24?1:Math.max(0,1-(a-.24)/.16);if(a>.4)V.tap=null;else{const sx=V.tap.sx,sy=h+8,ex=Math.round(sx+(V.tap.x-sx)*p),ey=Math.round(sy+(V.tap.y-sy)*p);
    const n=Math.max(1,Math.round(Math.hypot(ex-sx,ey-sy)/3)),pts=Array.from({length:n+1},(_,i)=>[Math.round(sx+(ex-sx)*i/n),Math.round(sy+(ey-sy)*i/n)]);
    const rad=i=>Math.round(12-3*i/n);pts.forEach(([x,y],i)=>disc(x,y,rad(i)+1,rad(i)+1,pal.outline));disc(ex,ey,12,10,pal.outline);pts.forEach(([x,y],i)=>disc(x,y,rad(i),rad(i),pal.body));disc(ex,ey,11,9,pal.body);pts.forEach(([x,y],i)=>P1(x-rad(i)+2,y,pal.light||pal.body));disc(ex-3,ey-3,4,3,pal.light||pal.body);
    for(const k of[-5,0,5])R(ex+k,ey-9,1,3,pal.outline);if(a>.12&&a<.32)lit(()=>ring(V.tap.x,V.tap.y,Math.round(6+(a-.12)*70),'#ffffff'))}}
  cat(E.pal,catX,bottom,{s,...idle(t),tilt:aim.x<catX-30?-1:aim.x>catX+30?1:0,look:aim.y<h*.55?1:0,rim:'#dffaff'})}
// 爪子能碰到的位置：从肩膀起最多伸 REACH 像素
const REACH=128;
function tankReach(V,w,h){const cx=V.cx??w/2,px=V.px??cx,py=V.py??h*.5,sx=Math.round(cx+(px<cx?-1:1)*28),sy=h+8,dx=px-sx,dy=py-sy,d=Math.hypot(dx,dy)||1,k=Math.min(1,REACH/d);return{x:Math.round(sx+dx*k),y:Math.round(sy+dy*k),sx}}

return{get tint(){return TINT},set tint(v){TINT=v},tctx,lit,mulHex,CONS,
  draw:{window:winFrame,sky:skyFrame,treetop:topFrame,tank:tankFrame},geo:{tank:tankGeo,sky:skyGeo},tankReach}})();
