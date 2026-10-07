/* 1024 猫咖 · "看风景"的画：七个画面 + 你的猫的背影。world4-vista.js 调这里。
   和店里一样的像素：1 倍像素、深色描边、色带之间用 4×4 抖动过渡；不缩放、不用抗锯齿的线和弧，也不用渐变和模糊。看到的永远是晴天的夜里。
   每张都有远近（天、远山或远海、中景、近景；越远越淡越偏蓝，越近越暗、细节越多），有一样主角，至少三样会动的。
   不动的部分画好存成图层（按画面大小）；树顶这种大的分几步画：打开特写、画面变黑的那一下里一帧画一步（VA.prep），会动的每帧画。
   橱窗外、窗边的屋里套一层夜色（画笔的颜色乘上 KTINT），发光的东西包在 lit() 里画、不压暗；别的画面直接用夜里的颜色画。
   依赖 scene-kit.js（R、P1、disc、grid、line、txt、knit、bird、yarnBall、YARN、spark、OL）、world-kit.js（hsh、ring）、house-kit.js（FEST_COL）、map-tree.js（leafMass、leafG）、
   skyline-art.js（NC：远山、楼、电视塔、摩天轮、电车）、world-play.js（PAL）。只露出一个全局名 VA。 */
const VA=(()=>{
/* ---------- 调色 ---------- */
let TINT=null,LIT=0;const lit=f=>{LIT++;try{f()}finally{LIT--}};
const hexRGB=h=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]};
const hexK=(h,k)=>'#'+hexRGB(h).map(q=>Math.max(0,Math.min(255,Math.round(q*k))).toString(16).padStart(2,'0')).join('');
const MX=new Map(),mixHex=(a,b,k)=>{const key=a+b+k;let v=MX.get(key);if(v)return v;const p=hexRGB(a),q=hexRGB(b);v='#'+p.map((x,i)=>Math.round(x+(q[i]-x)*k).toString(16).padStart(2,'0')).join('');if(MX.size>5000)MX.clear();MX.set(key,v);return v};
const TC=new Map(),mulHex=(hex,t)=>{const k=hex+t;let v=TC.get(k);if(v)return v;const a=hexRGB(hex),b=hexRGB(t);v='#'+a.map((q,i)=>Math.round(q*b[i]/255).toString(16).padStart(2,'0')).join('');TC.set(k,v);return v};
function tintCtx(real){const fns={};return new Proxy(real,{get(t,k){const v=t[k];return typeof v==='function'?(fns[k]||(fns[k]=v.bind(t))):v},set(t,k,v){if(k==='fillStyle'&&TINT&&!LIT&&typeof v==='string'&&v.length===7&&v[0]==='#')v=mulHex(v,TINT);t[k]=v;return true}})}
const TCTX=new WeakMap(),tctx=c=>{let p=TCTX.get(c);if(!p){p=tintCtx(c);TCTX.set(c,p)}return p};

/* ---------- 像素小工具 ---------- */
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],bay=(x,y)=>(BAY[(y&3)*4+(x&3)]+.5)/16;
// 竖着的渐变：一段一段色带，交界处 tz 行抖动过渡
function vGrad(x,y,w,h,cols,tz=8){const n=cols.length;for(let i=0;i<n;i++){const y0=Math.round(y+h*i/n),y1=Math.round(y+h*(i+1)/n);R(x,y0,w,y1-y0,cols[i])}
  for(let i=1;i<n;i++){const yb=Math.round(y+h*i/n),a=cols[i-1],b=cols[i];for(let yy=yb-tz/2;yy<yb+tz/2;yy++){const lv=(yy-yb+tz/2+.5)/tz;for(let xx=x;xx<x+w;xx++){const on=bay(xx,yy)<lv;if(yy<yb&&on)P1(xx,yy,b);else if(yy>=yb&&!on)P1(xx,yy,a)}}}}
function dith(x,y,w,h,col,lv){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(bay(i,j)<lv)P1(i,j,col)}
function layer(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),o=C;use(TINT?tctx(x):x);try{f()}finally{use(o)}return c}
const LC=new Map();function cached(key,w,h,f){const k=key+'|'+w+'|'+h+'|'+TINT;let c=LC.get(k);if(!c){if(LC.size>32)LC.delete(LC.keys().next().value);c=layer(w,h,f);LC.set(k,c)}return c}
function starPx(x,y,big,col){P1(x,y,col);if(big){P1(x-1,y,hexK(col,.6));P1(x+1,y,hexK(col,.6));P1(x,y-1,hexK(col,.6));P1(x,y+1,hexK(col,.6))}}
// 窗里坐着的一只小猫（剪影）
function winCat(x,y,col){grid(x,y-7,["o...o","oo.oo","ooooo","ooooo",".ooo.","ooooo","ooooo"],{o:col})}

/* ---------- 夜里的几样（几个画面共用） ---------- */
// 分几步画好的一套图层：打开特写时先在变黑的那一下里一帧画一步（VA.prep），画面里用到时还没画完的一口气画完
const BU=new Map();
function build(key,w,h,mk){const k=key+'|'+w+'|'+h;let B=BU.get(k);if(!B){if(BU.size>8)BU.delete(BU.keys().next().value);B={i:0,o:{w,h},steps:mk()};BU.set(k,B)}return B}
const stepB=B=>{if(B.i<B.steps.length){const o=C;try{B.steps[B.i++](B.o)}finally{use(o)}}return B.i>=B.steps.length};
const fullB=B=>{while(!stepB(B));return B.o};
// 小图：按 key 存
const SPR=new Map();function spr(key,w,h,f){let c=SPR.get(key);if(!c){if(SPR.size>160)SPR.delete(SPR.keys().next().value);c=layer(w,h,f);SPR.set(key,c)}return c}
// 一片不动的星：大多一个点，有的带十字，极少几颗是 2×2 的大星；颜色有白、蓝白、暖黄，少数偏红、偏蓝。skip(x,y) 返回 true 的地方不画
const STC=['#fff8ec','#fff8ec','#eef0ff','#d4e0ff','#ffeec4','#ffd6a4','#ffb0a0','#b0c8ff'];
function stars(x0,y0,w,h,n,seed,skip,bg='#1a1e48'){for(let i=0;i<n;i++){const x=x0+Math.floor(hsh(i,seed)*w),y=y0+Math.floor(hsh(i,seed+1)*h);if(skip&&skip(x,y))continue;
  const r=hsh(i,seed+2),c=STC[Math.floor(hsh(i,seed+3)*STC.length)];
  if(r<.012){R(x,y,2,2,c);const d=mixHex(c,bg,.5);P1(x-1,y,d);P1(x+2,y,d);P1(x,y-1,d);P1(x+1,y+2,d);P1(x-2,y,mixHex(c,bg,.75));P1(x+3,y,mixHex(c,bg,.75))}
  else if(r<.07)starPx(x,y,1,c);else P1(x,y,r<.55?mixHex(c,bg,.45):c)}}
// 银河：从 (ax,ay) 到 (bx,by) 斜着一条，宽 wd。中间密、两边稀，夹一道暗的尘带，带里撒满小星。
// o：lv 最密处、c 三层颜色（外→里）、up 越往 b 那头越亮（0～1）、n 小星多少、top/bot 只画这几行、s 种子
function milky(ax,ay,bx,by,wd,o={}){const L=Math.hypot(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L,nx=-uy,ny=ux,c=o.c||['#1c2250','#283068','#3a4486'],lv=o.lv??.5,s=o.s||0,up=o.up||0,N=512;
  const WV=new Float32Array(N),OF=new Float32Array(N),GA=new Float32Array(N),RF=new Float32Array(N);
  for(let i=0;i<N;i++){const u=-.05+i/(N-1)*1.1;WV[i]=wd*(.75+NC.nz(u*7,s)*.5);OF[i]=(NC.nz(u*5,s+1)-.5)*wd*.5;GA[i]=lv*(1-up+up*Math.min(1,Math.max(0,u)))*(.7+NC.nz(u*13,s+2)*.6);RF[i]=(NC.nz(u*4,s+3)-.5)*WV[i]*.6}
  const ext=wd*1.6,x0=Math.max(0,Math.floor(Math.min(ax,bx)-ext)),x1=Math.ceil(Math.max(ax,bx)+ext),y0=Math.max(o.top??0,Math.floor(Math.min(ay,by)-ext)),y1=Math.min(o.bot??1e9,Math.ceil(Math.max(ay,by)+ext));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const px=x-ax,py=y-ay,u=(px*ux+py*uy)/L;if(u<-.05||u>1.05)continue;const i=Math.round((u+.05)/1.1*(N-1)),wv=WV[i],d=px*nx+py*ny+OF[i],a=Math.abs(d)/wv;if(a>=1)continue;
    let k=(1-a*a)*GA[i];if(Math.abs(d-RF[i])<wv*.12)k*=.25;if(bay(x,y)<k)P1(x,y,k>.42?c[2]:k>.22?c[1]:c[0])}
  const M=Math.round(L*wd*(o.n??.3));for(let i=0;i<M;i++){const u=hsh(i,s+5),g=(hsh(i,s+6)+hsh(i,s+7)+hsh(i,s+8))/1.5-1,x=Math.round(ax+(bx-ax)*u+nx*g*wd*.9),y=Math.round(ay+(by-ay)*u+ny*g*wd*.9);
    if(y<(o.top??0)||y>=(o.bot??1e9))continue;const r=hsh(i,s+9);P1(x,y,r<.1?'#ffffff':r<.45?'#b8bcf0':'#6a70b0')}}
// 满月：外面一圈抖动的光晕，月面几片暗一点的"海"、几个环形山（右下亮、左上暗一点），边上一圈暗一点。o：hr 光晕半径、hl 光晕最密、h 光晕三层颜色（里→外）
function moonBig(cx,cy,r,o={}){const hr=o.hr??Math.round(r*2.6),hl=o.hl??.5,H=o.h||['#8a96d0','#56609e','#343e7a'];
  for(let y=cy-hr;y<=cy+hr;y++)for(let x=cx-hr;x<=cx+hr;x++){const d=Math.hypot(x-cx,y-cy);if(d<=r+.6||d>hr)continue;const k=1-(d-r)/(hr-r);if(bay(x,y)<k*k*hl)P1(x,y,k>.62?H[0]:k>.32?H[1]:H[2])}
  disc(cx,cy,r,r,'#f6f0dc');
  [[-.28,-.18,.42,.3],[.2,.2,.32,.34],[.06,-.44,.26,.16],[-.4,.3,.2,.18],[.42,-.12,.15,.22]].forEach(([a,b,rx,ry],i)=>{const mx=cx+a*r,my=cy+b*r;
    for(let y=Math.floor(my-ry*r);y<=my+ry*r;y++)for(let x=Math.floor(mx-rx*r);x<=mx+rx*r;x++){const q=((x-mx)/(rx*r))**2+((y-my)/(ry*r))**2+(NC.nz(x*.6+y*.35,i+40)-.5)*.7;if(q<1&&Math.hypot(x-cx,y-cy)<r-.4)P1(x,y,q<.5?'#d8d2be':'#e6e0cc')}});
  const n=Math.max(3,Math.round(r*.45));for(let i=0;i<n;i++){const a=hsh(i,77)*Math.PI*2,d=Math.sqrt(hsh(i,78))*r*.78,cr=Math.max(1,Math.round(r*(.05+hsh(i,79)*.09))),x=Math.round(cx+Math.cos(a)*d),y=Math.round(cy+Math.sin(a)*d);
    if(cr<2){P1(x,y,'#d2cab4');P1(x+1,y+1,'#fffaf0');continue}for(let q=0;q<cr*7;q++){const b=q/(cr*7)*Math.PI*2,px=Math.round(x+Math.cos(b)*cr),py=Math.round(y+Math.sin(b)*cr);P1(px,py,Math.cos(b-.8)>.2?'#fffaf0':Math.cos(b-.8)<-.3?'#c8c0a8':'#e0dac4')}}
  for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){const d=Math.hypot(x-cx,y-cy);if(d<=r+.3&&d>r-1.6&&bay(x,y)<.55)P1(x,y,'#dcd4bc')}}
// 夜里的一条薄云：长长的一条，底下暗、往下抖动着淡掉，顶上一道月光的亮边（月亮在 lt 那边更亮）。画在 (0,0)～(cw,ch) 的小图里
function nightCloud(cw,ch,seed,lt=1){for(let x=0;x<cw;x++){const u=x/(cw-1),env=Math.sin(u*Math.PI),n=NC.nz(x/7,seed)*.6+NC.nz(x/2.5,seed+1)*.4,t=Math.round(ch*.55-env*ch*.42*(.55+n*.6)),b=Math.round(ch*.62+env*ch*.25*(.6+NC.nz(x/5,seed+2)*.5)),hh=b-t;if(hh<=0)continue;
  R(x,t,1,hh,'#1e2250');for(let y=t+1;y<b;y++)if(bay(x,y)<.3*(1-(y-t)/hh))P1(x,y,'#2a2f60');const lit=lt>0?u:1-u;P1(x,t,lit>.55?'#a4aedc':'#5a6298');if(lit>.7&&hh>2)P1(x,t+1,'#5a6298');
  const fz=Math.max(1,Math.round(hh*.45));for(let y=b-fz;y<b;y++)if(bay(x,y)<(y-(b-fz)+1)/fz)C.clearRect(x,y,1,1)}}

/* ---------- 你的猫的背影：逐像素算出来（大圆头、两颊的毛、尖耳朵、没有脖子、两边鼓出来的屁股、尾巴盘在地上往上卷） ---------- */
function catBackPx(pal,o){const s=o.s||1,tilt=o.tilt||0,look=o.look||0,tail=o.tail||0,earL=o.earL||0,earR=o.earR||0,breath=o.breath||0,rim=o.rim||pal.light||'#ffffff',mul=o.mul||null,pf=o.puff||0;
  const X0=Math.ceil(34*s),Y0=Math.ceil(76*s),W=X0*2+1,H=Y0+2;   // 锚点 (X0, Y0)：脚底中点
  const inE=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
  const tri=(x,y,a,b,c)=>{const d=(p,q,r)=>(p[0]-r[0])*(q[1]-r[1])-(q[0]-r[0])*(p[1]-r[1]);const d1=d([x,y],a,b),d2=d([x,y],b,c),d3=d([x,y],c,a);return!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))};
  const hx=tilt*2*s,hy=(-44-look*1.5)*s,hrx=(17+pf*1.5)*s,hry=(14.5+pf*1.2)*s;
  const ear=(sd,f)=>[[hx+sd*17.5*s,hy-2.5*s],[hx+sd*3*s,hy-14*s],[hx+sd*(14.5+f*3)*s,hy+(-25+f*3+tilt*sd)*s]];
  const EL=ear(-1,earL),ER=ear(1,earR),inEar=(x,y)=>tri(x,y,...EL)||tri(x,y,...ER);
  const tuft=(x,y)=>[-1,1].some(sd=>tri(x,y,[hx+sd*16.5*s,hy+3*s],[hx+sd*17*s,hy+8.5*s],[hx+sd*21.5*s,hy+8*s])||tri(x,y,[hx+sd*15.5*s,hy+9*s],[hx+sd*14*s,hy+12.5*s],[hx+sd*19.5*s,hy+12.5*s]));
  const head=(x,y)=>inE(x,y,hx,hy,hrx,hry)||inE(x,y,hx-12.5*s,hy+7*s,6.5*s,5*s)||inE(x,y,hx+12.5*s,hy+7*s,6.5*s,5*s)||inEar(x,y)||tuft(x,y);
  const brx=(14+breath*.6+pf*2.4)*s,body=(x,y)=>y<=0&&(inE(x,y,0,-24*s,brx,(12.5+pf*1.4)*s)||inE(x,y,0,-11*s,(20.5+pf*2.6)*s,(11.5+pf*.8)*s));
  const TP=[[4,-2],[11,-2.2],[18,-3],[23.5,-5.5],[26.5,-9.5],[27+tail*1.2,-14],[25.5+tail*3,-17.5]].map(([x,y])=>[x*s,y*s]),TR=[3.3,3.2,3.1,3,2.9,2.7,2.5].map(r=>r*s*(1+pf*.9));
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
  // 炸毛：轮廓外面再冒出一圈参差的毛尖
  if(pf>0)for(let pass=0;pass<2;pass++){const add=[];for(let j=1;j<H-1;j++)for(let i=1;i<W-1;i++){const p=j*W+i;if(out[p]||reg[p])continue;if([p-1,p+1,p-W,p+W].some(q=>out[q]===ol&&!reg[q])&&hsh(i*3+pass,j*5)<(pass?.2:.36)*pf)add.push(p)}add.forEach(p=>out[p]=ol)}
  const wk=pal.whisk||pal.light||b;for(const sd of[-1,1])for(const [y0,dx,dy] of[[4.5,8,-1.5],[8,7.5,1]]){const n=Math.round(7*s),cx=hx+sd*19*s,cy=hy+y0*s;for(let k=0;k<=n;k++){const i=Math.round(X0+cx+sd*dx*s*k/n-.5),j=Math.round(Y0+cy+dy*s*k/n-.5);if(i>=0&&i<W&&j>=0&&j<H&&!reg[j*W+i])out[j*W+i]=wk}}
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),im=g.createImageData(W,H),M=mul?hexRGB(mul):null,cache={};
  for(let p=0;p<W*H;p++){const c=out[p];if(!c)continue;let v=cache[c];if(!v){v=hexRGB(c);if(M&&c!==rim)v=v.map((q,k)=>Math.round(q*M[k]/255));cache[c]=v}im.data[p*4]=v[0];im.data[p*4+1]=v[1];im.data[p*4+2]=v[2];im.data[p*4+3]=255}
  g.putImageData(im,0,0);return{cv,ax:X0,ay:Y0}}
const CBC=new Map();
function cat(pi,x,bottom,o={}){const mul=o.mul!==undefined?o.mul:(TINT?mixHex(TINT,'#ffffff',o.soft??.45):null),pf=Math.round((o.puff||0)*4)/4,key=[pi,o.s||1,o.tilt||0,o.look||0,o.tail||0,o.earL||0,o.earR||0,o.breath||0,o.rim||'',mul||'',pf].join('|');let c=CBC.get(key);
  if(!c){if(CBC.size>48)CBC.delete(CBC.keys().next().value);c=catBackPx(PAL[pi],{...o,puff:pf,mul});CBC.set(key,c)}C.drawImage(c.cv,Math.round(x-c.ax),Math.round(bottom-c.ay));return c}
// 待着的小动作：尾尖一甩一甩、隔一阵抖一下耳朵、喘气
const idle=t=>({tail:Math.round(Math.sin(t*1.7)*2)/2,earL:(t%6.3)<.2?1:0,earR:(t%8.9)<.16?1:0,breath:Math.floor(t*.8)%2});

/* ================= 1. 橱窗外：对面一排亮着灯的小店 ================= */
// 远：天边城里的灯映出一层淡紫，高高低低的楼（窗是一个个小点），电视塔顶的红灯一闪一闪，月亮挂在两座高楼中间的缝里；中：小店背后一排近一点的楼；
// 近：对面一排面包店、书店、花店、茶铺（橱窗暖黄，二楼窗台上坐着猫），门前地上一摊摊暖光；路灯和行道树套着毛线套，灯杆之间挂着三角旗；猫猫电车隔一阵开过去，麻雀落在窗外。
// 再近是这扇窗：窗帘、窗台、晾衣绳上挂着这扇窗里真挂着的成品，你的猫趴在窗台上。小店和屋里套一层夜色（KTINT），发光的、天和远处的城在 lit() 里画
// 一圈抖动的光：近处密、远处稀（代替会糊的渐变光晕）
function halo(cx,cy,r,col,lv=.5){cx=Math.round(cx);cy=Math.round(cy);for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){const d=Math.hypot(x-cx,y-cy)/r;if(d<1&&bay(x,y)<(1-d)*(1-d)*lv)P1(x,y,col)}}
const SHOPS=[{n:'BAKERY',wall:'#f2dcc2',aw:'#e0533d',win:'bread',roof:0},{n:'BOOKS',wall:'#c8d6e6',aw:'#5B9BD5',win:'books',roof:1},{n:'FLOWERS',wall:'#f4d6d2',aw:'#5B8C5A',win:'flowers',roof:0},{n:'TEA',wall:'#f5e4b2',aw:'#9B7EBD',win:'cups',roof:1,neon:1}];
const winGeo=(w,h)=>({F:9,sill:h-58,street:Math.round(h*.62),road0:Math.round(h*.62)+8,road1:Math.round(h*.755),mx:Math.round(w*.36),my:Math.round(h*.12),mr:Math.max(7,Math.round(h*.03))});
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
  if(s.neon&&night)lit(()=>{halo(bx+tw/2+4,sy+4,18,'#ff5a9a',.4);R(bx+1,sy+1,tw+6,7,'#2e2438');txt(s.n,bx+4,sy+2,'#ff9ac0')});else txt(s.n,bx+4,sy+2,'#fff4dc');
  const ay=sy+11;R(x-1,ay,wd+2,1,OL);for(let a=0;a<wd;a++){const c=Math.floor(a/6)%2?s.aw:'#fff4dc',m=a%6;R(x+a,ay+1,1,7,m===0?hexK(c,.9):c);P1(x+a,ay+8,m===0||m===5?OL:c);if(m>0&&m<5)P1(x+a,ay+9,OL)}
  // 一楼：橱窗、门
  const gy0=ay+11,dw=Math.round(wd*.58);R(x+4,gy0,dw,bot-gy0-3,OL);R(x+5,gy0+1,dw-2,bot-gy0-5,'#fff4dc');
  const gx=x+6,gyy=gy0+2,gw=dw-4,gh=bot-gy0-7;if(night)lit(()=>{R(gx,gyy,gw,gh,'#ffe9b0');goods(s.win,gx+2,gyy+gh-1,gw-2)});else{R(gx,gyy,gw,gh,'#dff0f7');goods(s.win,gx+2,gyy+gh-1,gw-2);for(let q=0;q<8;q++)P1(gx+3+q,gyy+9-q,'#ffffff')}
  const dx0=x+Math.round(wd*.68),dww=wd-Math.round(wd*.68)-6;R(dx0,gy0,dww,bot-gy0,OL);R(dx0+1,gy0+1,dww-2,bot-gy0-1,'#8a5a3a');R(dx0+3,gy0+3,dww-6,10,OL);
  if(night)lit(()=>R(dx0+4,gy0+4,dww-8,8,'#ffd98a'));else R(dx0+4,gy0+4,dww-8,8,'#9fc4e0');P1(dx0+dww-4,gy0+Math.round((bot-gy0)*.6),'#ffd84a');
  R(x,bot-1,wd,1,OL)}
// 路灯：灯杆下半截套着店里织的毛线套
function lampPx(x,base,hh,night,ci){R(x,base-hh,2,hh,OL);R(x-2,base-2,6,2,OL);const n=Math.round(hh*.5);for(let j=0;j<n;j++){const Y=YARN[(Math.floor(j/3)+ci)%5];R(x-1,base-3-j,4,1,j%3===0?Y[1]:Y[0])}R(x-2,base-3-n,6,1,OL);
  const ly=base-hh-8;R(x-3,ly-1,8,2,OL);R(x-2,ly,6,8,OL);R(x-1,ly+1,4,6,night?'#ffe08a':'#efdcb8');P1(x,ly-2,OL);if(night)lit(()=>{halo(x+1,ly+4,14,'#ffcf70',.5);R(x-1,ly+1,4,6,'#ffe08a')});return ly}
// 行道树：树干也穿着毛线套
function treePx(x,base,night){R(x-8,base-5,18,5,OL);R(x-7,base-4,16,3,'#8a5a3a');R(x-1,base-40,4,36,OL);for(let j=0;j<16;j++){const Y=YARN[(Math.floor(j/4)+2)%5];R(x,base-5-j,2,1,j%4===0?Y[1]:Y[0])}R(x,base-39,2,18,'#6e4430');
  line(x+1,base-38,x-8,base-50,OL);line(x+2,base-38,x+10,base-52,OL);
  const cs=[[-12,-54,11,8],[11,-56,12,8],[0,-62,13,9],[-6,-70,9,6],[8,-71,8,6],[-17,-60,6,5],[18,-62,6,5]];
  cs.forEach(([a,b,rx,ry])=>disc(x+1+a,base+b,rx+1,ry+1,'#8a4e14'));cs.forEach(([a,b,rx,ry])=>disc(x+1+a,base+b,rx,ry,'#c98a1e'));cs.forEach(([a,b,rx,ry])=>disc(x+a,base+b-1,rx-2,ry-2,'#e8b83a'));cs.forEach(([a,b,rx,ry])=>disc(x-1+a,base+b-3,Math.max(1,rx-6),Math.max(1,ry-4),'#f7c940'));
  for(let i=0;i<40;i++){const [a,b,rx,ry]=cs[i%cs.length],q=hsh(i,315)*Math.PI*2;P1(Math.round(x+a+Math.cos(q)*rx*.8),Math.round(base+b+Math.sin(q)*ry*.8),i%3?'#fff0a8':'#c98a1e')}}
function winOut(w,h,S){const G=winGeo(w,h),k=h/300,night=true;
  // 天、天边一层城里映出来的淡紫、几颗星、月亮
  lit(()=>{vGrad(0,0,w,G.street,['#060818','#0a0e26','#10153a','#181d48','#232656','#2e2c60'],10);const g0=Math.round(h*.14);for(let y=g0;y<G.street;y++){const lv=Math.min(.55,(y-g0)/(h*.18)*.55);for(let x=0;x<w;x++)if(bay(x,y)<lv)P1(x,y,'#3a3470')}
    stars(0,0,w,Math.round(h*.16),Math.round(w/7),71,(x,y)=>Math.hypot(x-G.mx,y-G.my)<G.mr*2.6,'#0a0e26');moonBig(G.mx,G.my,G.mr,{hr:Math.round(G.mr*2.3),hl:.45});
    // 远处一排高楼：淡、偏蓝，窗是一个个小点；月亮那儿留一道缝
    const yb=Math.round(h*.37),gap=(x,bw)=>x+bw>G.mx-G.mr-5&&x<G.mx+G.mr+5;
    NC.row(-6,w+6,yb,{sd:51,lt:-1,w:[Math.round(12*k),Math.round(26*k)],h:[Math.round(28*k),Math.round(64*k)],tall:[.25,Math.round(66*k),Math.round(88*k)],gap:2,f:'#262b62',s:'#20245a',sw:2,t:'#3e4686',g:[3,4,1,2],p:.5,hz:.35,hc:'#8a86c0',styles:[0,1,2,2,3,5,7],
      cap:(x,bw)=>gap(x,bw)?Math.max(4,yb-(G.my+G.mr+4)):999});
    const tp=NC.tower(Math.round(w*.66),yb,yb-Math.round(h*.035),{c:'#2a2f68',l:'#5a64a8',w:'#ffe7a0',lt:-1});G.tip=tp;
    // 小店背后近一点的一排：暗一点，窗大一点
    NC.row(-10,w+10,Math.round(h*.42),{sd:57,w:[Math.round(18*k),Math.round(34*k)],h:[Math.round(40*k),Math.round(64*k)],gap:3,f:'#1c1c46',s:'#16163a',sw:3,t:'#34386e',g:[5,5,2,3],p:.55,lt:1,styles:[0,1,4,6,1]})});
  // 对面的四家店（一直排满，最右一家露半截）
  const pools=[];let x=-40;for(let i=0;x<w;i++){const s=SHOPS[i%SHOPS.length],wd=118+Math.floor(hsh(i,310)*16),top=G.street-100-Math.floor(hsh(i,311)*14);shopPx(x,top,wd,G.street,s,i,night);
    pools.push([x+Math.round(wd*.35),Math.round(wd*.32),'#ffd98a',.6]);x+=wd+2}
  // 人行道、马路、电车轨道、架空线
  R(0,G.street,w,G.road0-G.street,'#cfc6b8');for(let x2=0;x2<w;x2+=12)R(x2,G.street,1,G.road0-G.street,'#b4aa9a');R(0,G.road0-2,w,2,'#8a8278');
  R(0,G.road0,w,G.road1-G.road0,'#5a5a66');dith(0,G.road0,w,G.road1-G.road0,'#62626e',.25);
  [G.road0+9,G.road1-9].forEach(y=>{R(0,y,w,1,'#b4b8c4');R(0,y+1,w,1,'#34343e')});
  R(0,G.road1,w,2,'#8a8278');R(0,G.road1+2,w,G.sill-G.road1,'#d8d0c4');for(let x2=0;x2<w;x2+=20)R(x2,G.road1+2,1,G.sill-G.road1,'#bcb2a4');
  // 店门前、路灯底下，人行道上一摊摊暖光（中间密、往外稀）
  const LP=[[.07,0],[.25,1],[.64,0],[.81,1],[.98,0],[1.16,1]];LP.forEach(([fx,tr])=>{if(!tr)pools.push([Math.round(w*fx)+1,24,'#ffe0a0',.7])});
  lit(()=>pools.forEach(([cx,rx,c,lv])=>{const ry=G.road0-G.street+4;for(let y=G.street;y<G.road0+4;y++)for(let q=-rx;q<=rx;q++){const d=Math.hypot(q/rx,(y-G.street)/ry);if(d<1&&bay(cx+q,y)<(1-d)*(1-d)*lv)P1(cx+q,y,c)}}));
  // 路灯、行道树，灯杆之间挂一串织的三角旗
  const lamps=[];LP.forEach(([fx,tr],i)=>{const lx=Math.round(w*fx);if(lx>w+20)return;if(tr)treePx(lx,G.street+4,night);else lamps.push({x:lx,y:lampPx(lx,G.street+4,58,night,i)})});
  for(let i=0;i+1<lamps.length;i++){const a=lamps[i],b=lamps[i+1],n=b.x-a.x;for(let k2=0;k2<=n;k2++){const y=a.y+2+Math.round(Math.sin(k2/n*Math.PI)*10);P1(a.x+k2,y,OL);if(k2%10===5&&k2<n-4){const Y=YARN[(k2/10|0)%5];R(a.x+k2-2,y+1,5,1,Y[0]);R(a.x+k2-1,y+2,3,1,Y[0]);P1(a.x+k2,y+3,Y[1]);P1(a.x+k2-2,y+1,Y[2])}}}
  R(0,G.road0-46,w,1,'#4a4a5a')}
// 电车：乘客都是猫
function tramPx(x,y,L,night,dir,wy){const H=30;
  line(x+Math.round(L*.42),y-3,x+Math.round(L*.5),wy+1,OL);line(x+Math.round(L*.58),y-3,x+Math.round(L*.5),wy+1,OL);R(x+Math.round(L*.46),wy+1,Math.round(L*.08),1,OL);
  R(x+6,y-4,L-12,4,OL);R(x+7,y-3,L-14,3,'#d8ccb0');
  R(x+1,y,L-2,H,OL);R(x,y+2,L,H-4,OL);R(x+2,y+1,L-4,H-2,'#f2e6c8');R(x+1,y+3,L-2,H-6,'#f2e6c8');R(x+1,y+H-11,L-2,8,'#5B8C5A');R(x+1,y+H-11,L-2,1,'#7aaa78');R(x+2,y+1,L-4,1,'#fffaf0');
  const PC=['#3e3846','#f0a352','#9a8a70','#fff3e0','#d6dae0','#dcb46c'];
  for(let i=0,n=Math.floor((L-24)/18);i<n;i++){const wx=x+12+i*18,wy=y+4;R(wx,wy,14,12,OL);const g=night?'#ffe9b0':'#8fc8f0';if(night)lit(()=>R(wx+1,wy+1,12,10,g));else R(wx+1,wy+1,12,10,g);
    if(hsh(i,331)<.75){const cc=PC[(i*7)%PC.length];grid(wx+3+(i%3),wy+4,["o...o","oo.oo","ooooo","ooooo","ooooo","ooooo"],{o:night?'#4a3040':cc});if(!night){P1(wx+4+(i%3),wy+6,OL)}}
    if(!night){P1(wx+10,wy+2,'#ffffff');P1(wx+9,wy+3,'#ffffff')}}
  const fx=dir>0?x+L-4:x+1;R(fx,y+H-9,3,3,'#fff4dc');if(night)lit(()=>{R(fx,y+H-9,3,3,'#fff8d0');for(let i=1;i<14;i++)for(let j=-2;j<=2;j++)if(bay(fx+dir*i,y+H-8+j)<(1-i/14)*(1-Math.abs(j)/3)*.7)P1(fx+(dir>0?i+3:-i),y+H-8+j,'#fff4c0')});
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
function winFrame(E){const {w,h,t,S,V}=E,G=winGeo(w,h),k=h/300,night=true;
  C.drawImage(cached('winOut',w,h,()=>winOut(w,h,S)),0,0);
  lit(()=>{for(let i=0;i<10;i++)if(Math.floor(t*1.5+i*.7)%5===0)starPx(Math.floor(hsh(i,71)*w),Math.floor(hsh(i,72)*h*.16),1,'#ffffff');
    // 一条薄云慢慢从楼顶上面飘过去
    const cw=Math.round(70*k),ch=Math.round(11*k),c=spr('wc|'+k,cw,ch,()=>nightCloud(cw,ch,77,-1));C.drawImage(c,Math.round(w+10-((t*2.2+w*.45)%(w+cw+40))),Math.round(h*.03));
    // 电视塔顶的红灯
    const tp=G.tip||{x:Math.round(w*.66),y:Math.round(h*.035)};NC.redLight(tp.x,tp.y,t,.3)});
  // 电车：18 秒一趟，来回换方向
  const per=18,cyc=Math.floor(t/per),ph=(t%per)/per;if(ph<.5){const L=Math.min(w-40,300),dir=cyc%2?-1:1,p=ph/.5,tx=Math.round(dir>0?-L+(w+L)*p:w-(w+L)*p),ty=G.road0-26;tramPx(tx,ty,L,night,dir,G.road0-46)}
  // 麻雀：隔一阵落在窗外的人行道上；敲玻璃就飞走
  const bp=(t%11)/11,bc=Math.floor(t/11),sh=V.shoo!=null&&Math.floor(V.shoo/11)===bc?t-V.shoo:-1,birdOn=bp>.25&&bp<.8&&sh<1.2;V.birdOn=birdOn;
  if(birdOn){const bx=Math.round(w*.66)+(sh>=0?Math.round(sh*50):0),by=G.sill-3-(sh>=0?Math.round(sh*90):bp>.74?Math.round((bp-.74)*400):0);bird(bx,by,t,{dir:sh>=0?1:-1,fly:bp>.74||sh>=0})}
  // 玻璃：两道斜的反光
  for(const [x0,y0,n] of[[22,52,16],[27,54,10],[34,52,5]])for(let q=0;q<n;q++){P1(x0+q,y0-q*2,'#ffffff');if(bay(q,x0)<.5)P1(x0+q+1,y0-q*2,'#ffffff')}
  C.drawImage(cached('winIn',w,h,()=>winIn(w,h,S)),0,0);
  // 窗里的晾衣绳：这扇窗真挂着的成品
  const f=G.F+6,ly=G.F+8,slots=((S.lines||[])[V.o.w||0]||[]),sag=x=>Math.round(Math.sin((x-f)/(w-2*f)*Math.PI)*6);for(let x=f;x<w-f;x++)P1(x,ly+sag(x),'#8a5a3a');
  slots.forEach((it,i)=>{if(!it)return;const x=Math.round(f+(w-2*f)*(i+.5)/slots.length),y=ly+sag(x);R(x,y-1,1,3,'#e8b83a');knit(it.kind,x,y+2,it.ci)});
  cat(E.pal,Math.round(w*.44),G.sill+4,{...idle(t),tilt:birdOn?1:0,earR:birdOn?1:idle(t).earR,rim:'#ffe0a0'})}
/* ================= 2. 图书馆窗边：看天 ================= */
// 拱形大窗，两边是书架。窗外：天边一片城的剪影（窗亮着灯，电视塔顶的红灯一闪一闪，城里的灯在天边映出一层淡紫），银河从城后面斜着升起来，越往上越亮，
// 中间一道暗的尘带，边上几团淡紫、淡粉的星云；星星有大有小，有几颗是彩色的；左上一弯细细的月牙。多看一会儿星星连成星座；流星划过可以许愿；偶尔一颗人造卫星慢慢挪过去。
// 屋里（书架、窗帘、软座、杯子）套一层夜色（KTINT），窗外的在 lit() 里画
function skyGeo(w,h){const ww=Math.round(w*.44/2)*2,ar=ww/2,cx=Math.round(w/2),wy0=Math.round(h*.06),wy1=Math.round(h*.7);return{ww,ar,cx,wx0:cx-ar,wx1:cx+ar,wy0,wy1,spring:wy0+ar,seat:Math.round(h*.79)}}
const archHW=(G,y,a=G.ar)=>y>=G.spring?a:Math.floor(Math.sqrt(Math.max(0,a*a-(G.spring-y+.5)**2)));
// 星座：窗里的相对位置（0～1），连线的顺序
const CONS=[{n:'猫座',p:[[.30,.34],[.28,.16],[.37,.26],[.46,.26],[.52,.14],[.52,.34],[.60,.52],[.62,.70],[.40,.72],[.76,.68],[.82,.52]],e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,0],[7,9],[9,10]]},
  {n:'毛线球座',p:[[.40,.22],[.52,.24],[.58,.36],[.54,.49],[.42,.51],[.34,.40],[.62,.60],[.72,.56],[.80,.66]],e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[3,6],[6,7],[7,8]]},
  {n:'小鱼干座',p:[[.24,.42],[.40,.30],[.56,.42],[.40,.54],[.70,.30],[.70,.54],[.30,.40]],e:[[0,1],[1,2],[2,3],[3,0],[2,4],[4,5],[5,2]]}];
function skyBack(w,h,S){const G=skyGeo(w,h),k=h/300;lit(()=>{
  vGrad(G.wx0-8,0,G.ww+16,G.wy1,['#04051a','#070a24','#0c1030','#13183e','#1c204c','#2a2858'],10);
  milky(G.wx0+G.ww*.12,G.wy1+12,G.wx0+G.ww*.96,G.wy0-14,30*k,{lv:.6,up:.85,s:23,n:.2,c:['#1e2458','#2e3474','#48529c']});
  // 银河边上几团淡淡的星云
  [[.42,.62,14,'#4a2e72'],[.62,.4,12,'#6a3a78'],[.78,.2,10,'#5a4a7a'],[.55,.5,7,'#8a5a7a']].forEach(([u,v,r,c])=>{const cx=Math.round(G.wx0+u*G.ww),cy=Math.round(G.wy0+v*(G.wy1-G.wy0)),R0=Math.round(r*k);for(let y=cy-R0;y<=cy+R0;y++)for(let x=cx-R0*1.5;x<=cx+R0*1.5;x++){const d=Math.hypot((x-cx)/1.5,y-cy)/R0+(NC.nz(x*.3,y)-.5)*.5;if(d<1&&bay(x,y)<(1-d)*.45)P1(Math.round(x),y,c)}});
  stars(G.wx0,G.wy0,G.ww,G.wy1-G.wy0,Math.round(G.ww*(G.wy1-G.wy0)/80),91,null,'#0c1030');
  // 几颗亮的、彩色的星
  [[.18,.22,'#ffb0a0'],[.7,.12,'#b0d0ff'],[.3,.46,'#ffe0a0'],[.86,.42,'#c0ffd8'],[.1,.6,'#fff8ec']].forEach(([u,v,c])=>{const x=Math.round(G.wx0+u*G.ww),y=Math.round(G.wy0+v*(G.wy1-G.wy0));R(x,y,2,2,c);P1(x-1,y,mixHex(c,'#0c1030',.5));P1(x+2,y,mixHex(c,'#0c1030',.5));P1(x,y-1,mixHex(c,'#0c1030',.5));P1(x+1,y+2,mixHex(c,'#0c1030',.5))});
  // 一弯细细的月牙
  const mx=Math.round(G.cx-G.ar*.48),my=Math.round(G.spring-G.ar*.1),mr=Math.max(5,Math.round(7*k));disc(mx,my,mr,mr,'#f6f0dc');disc(mx+Math.round(mr*.45),my-Math.round(mr*.2),mr,mr,'#0c1030');for(let y=my-mr-3;y<=my+mr+3;y++)for(let x=mx-mr-3;x<=mx+mr;x++){const d=Math.hypot(x-mx,y-my);if(d>mr&&d<mr+3&&x<mx&&bay(x,y)<.25)P1(x,y,'#3a4482')}
  // 天边：城里的灯映出一层淡紫，城的剪影，窗亮着灯，一座电视塔
  const cg=Math.round(36*k);for(let y=G.wy1-cg;y<G.wy1;y++){const lv=Math.pow((y-G.wy1+cg)/cg,1.6)*.6;for(let x=G.wx0;x<G.wx1;x++)if(bay(x,y)<lv)P1(x,y,'#3a3070')}
  NC.row(G.wx0-6,G.wx1+6,G.wy1,{sd:61,w:[Math.round(8*k),Math.round(18*k)],h:[Math.round(6*k),Math.round(24*k)],tall:[.18,Math.round(26*k),Math.round(44*k)],gap:1,f:'#0e0f26',s:'#0a0a1e',sw:1,t:'#22264e',g:[3,3,1,1],p:.42,lt:1,styles:[0,1,2,3,4,5,6,7]});
  const tv=NC.tower(Math.round(G.wx0+G.ww*.27),G.wy1,Math.round(78*k),{c:'#10122c',l:'#2a2e5a',w:'#ffe0a0',lt:1});o_skyTip=tv})}
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
  for(let x=bl+2;x<bl+bw-2;x+=2)R(x,sy-3+bh,1,3,BC[Math.floor((x-bl)/8)%3][0]);
}
let o_skyTip=null;
function skyFrame(E){const {w,h,t,S,V}=E,G=skyGeo(w,h),k=h/300;
  C.drawImage(cached('skyBack',w,h,()=>skyBack(w,h,S)),0,0);
  lit(()=>{for(let i=0;i<18;i++)if(Math.floor(t*1.3+i*.61)%6===0)starPx(G.wx0+Math.floor(hsh(i,353)*G.ww),G.wy0+Math.floor(hsh(i,354)*(G.wy1-G.wy0-30*k)),1,'#ffffff');
    // 人造卫星：一个小亮点慢慢挪过去（40 秒一趟）
    {const p=(t%40)/40;if(p<.5){const u=p/.5;P1(Math.round(G.wx0+G.ww*(.1+u*.8)),Math.round(G.wy0+G.ar*.4+u*(G.wy1-G.wy0)*.25),Math.floor(t*2)%3?'#e8ecff':'#8a90c8')}}
    if(o_skyTip)NC.redLight(o_skyTip.x,o_skyTip.y,t,.2);
    // 星座：看一会儿，星星一颗颗亮起来，再一笔笔连上
    const c=V.con;if(c){const K=CONS[c.i],kk=t-c.t0,P2=K.p.map(([u,v])=>[Math.round(G.wx0+u*G.ww),Math.round(G.wy0+v*(G.wy1-G.wy0-24))]);
      P2.forEach(([x,y],i)=>{if(kk>i*.12)starPx(x,y,1,'#fff8d0')});K.e.forEach(([a,b],i)=>{const q=Math.max(0,Math.min(1,(kk-1.4-i*.28)/.28));if(!q)return;const [x0,y0]=P2[a],[x1,y1]=P2[b],n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
        for(let j=2;j<=n*q-2;j+=2)P1(Math.round(x0+(x1-x0)*j/n),Math.round(y0+(y1-y0)*j/n),'#9fb4ff')})}
    const s=V.star;if(s){const a=t-s.t0;if(a<1)for(let i=0;i<18;i++){const q=a*1.4-i*.012;if(q<0||bay(i,Math.floor(a*20))>1-i/18)continue;P1(Math.round(s.x+s.dx*q),Math.round(s.y+s.dy*q),i<3?'#ffffff':'#fff8d0')}}});
  C.drawImage(cached('skyRoom',w,h,()=>skyRoom(w,h,S)),0,0);
  // 杯子和热气
  const mx=Math.round(w*.61),sy=G.seat;R(mx,sy-10,9,10,OL);R(mx+1,sy-9,7,8,'#fff4dc');R(mx+1,sy-9,7,1,'#8a5a3a');R(mx+9,sy-8,2,1,OL);R(mx+10,sy-7,1,3,OL);R(mx+9,sy-4,2,1,OL);
  for(let i=0;i<3;i++){const q=(t*.9+i/3)%1;if(bay(i,Math.floor(q*8))<1-q)P1(mx+4+Math.round(Math.sin((q+i)*5)*2),sy-12-Math.round(q*12),'#ffffff')}
  cat(E.pal,G.cx,G.seat+4,{...idle(t),look:1,rim:'#c8d4ff'})}
/* ================= 3. 毛线巨树的树顶：整座夜城 ================= */
// 地平线 hz 在四成高。左边两道雪山（远的那道淡），电视塔和一簇高楼；右边是海，海平线一道亮线，月亮挂在海上，月光在海面上碎成一溜；海边一座灯塔转着光。
// 一条河从海口弯弯曲曲穿过城流到眼前：远处一座小石桥，中段横着流（摩天轮站在对岸，倒影在水里晃），近处一座亮着灯的吊桥。最近一道高架，电车隔一阵开过去；再近是巨树的金色树冠、挂着成品的枝和瞭望台。
// 存成三层：t0 天、山、海、河、远处的城；t1 中间的城、吊桥、高架；t2 近处的城、树冠、瞭望台。水面的碎光画 4 帧轮着换。
// 每帧画：云、热气球、鸟、烟花（和倒影）、灯塔的光、摩天轮（和倒影）、红灯、几扇窗、电车、落叶、猫
const TT_SKY=['#04051a','#070a22','#0b0f2c','#111638','#171d45','#1f2450','#2a2b5a'],TT_LEAF={ol:'#2a1a08',sh:'#6e4a12',mn:'#a8761e',lt:'#d09a30',hi:'#eebe4c'};
const topGeo=(w,h)=>{const hz=Math.round(h*.4),H=h-hz,k=h/300;
  return{hz,H,k,coast:x=>x<w*.5?hz:hz+Math.round(Math.pow((x-w*.5)/(w*.5),.85)*H*.27),plank:Math.round(h*.87),catX:Math.round(w*.2),via:hz+Math.round(H*.66),
    moon:{x:Math.round(w*.8),y:Math.round(h*.12),r:Math.max(8,Math.round(14*k))},wheel:{x:Math.round(w*.55),b:hz+Math.round(H*.265),R:Math.round(34*k),bh:Math.round(42*k)},
    tv:{x:Math.round(w*.29),b:hz+Math.round(H*.12),top:Math.round(h*.07)},lh:{x:Math.round(w*.955),b:hz+Math.round(H*.075)},
    av:[[-.6,.35],[-.1,.4],[.3,.46],[.95,.52]],riv:[[.77,-.03],[.745,.1],[.705,.2],[.62,.28],[.5,.315],[.41,.365],[.355,.47],[.36,.59],[.33,.75],[.28,1.05]]}};
// 这一排楼的样子：v 是离地平线多远（0 远 1 近）。越远越淡、越偏蓝、窗越小
const tSty=v=>{const q=Math.round(Math.min(1,Math.max(0,v))*20)/20,s=.35+q*3.1;return{s,q,f:mixHex('#2a2f6a','#0d0b1e',Math.pow(q,.55)),t:q<.22?null:mixHex(mixHex('#2a2f6a','#0d0b1e',Math.pow(q,.55)),'#5a62a0',.32),
  g:s<.8?[2,2,1,1]:s<1.35?[2,3,1,1]:s<2?[3,3,1,1]:s<2.6?[3,4,2,2]:[4,5,2,3],hz:Math.pow(1-q,2.4)*.4,hc:'#a8a0c8',sw:q<.22?0:s<1.6?1:2,styles:q<.2?[0,0,1,2,3]:[0,0,1,2,3,4,5,6,7]}};
const topSteps=()=>[topMask,topL0a,topL0b,topL1,topL2,o=>topWater(o,0),o=>topWater(o,1),o=>topWater(o,2),o=>topWater(o,3)];
// 先算好：河和海在哪儿（水的蒙版）、两座桥、一排排楼（按楼脚排好，分到三层）、要映到水里的灯
function topMask(o){const {w,h}=o,G=o.G=topGeo(w,h),M=o.M=new Uint8Array(w*h),k=G.k,W=G.wheel;
  const P=G.riv.map(([u,v])=>[u*w,G.hz+v*G.H]),S=[];
  for(let i=0;i<P.length-1;i++){const a=P[Math.max(0,i-1)],b=P[i],c=P[i+1],d=P[Math.min(P.length-1,i+2)],n=Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])*2);
    for(let j=0;j<n;j++){const t=j/n,cr=(p,q,r,s)=>.5*(2*q+(-p+r)*t+(2*p-5*q+4*r-s)*t*t+(-p+3*q-3*r+s)*t*t*t);S.push([cr(a[0],b[0],c[0],d[0]),cr(a[1],b[1],c[1],d[1])])}}
  for(let x=Math.floor(w*.5);x<w;x++){const c=G.coast(x);for(let y=G.hz;y<c;y++)M[y*w+x]=1}
  const rx=y=>(1.4+Math.max(0,(y-G.hz)/G.H)*26)*k;
  for(const [cx,cy] of S){const a=rx(cy),b=Math.max(1,a*.55);for(let y=Math.max(G.hz,Math.floor(cy-b));y<=Math.min(h-1,Math.ceil(cy+b));y++){const q=(y-cy)/b,s=a*Math.sqrt(Math.max(0,1-q*q));for(let x=Math.max(0,Math.floor(cx-s));x<=Math.min(w-1,Math.ceil(cx+s));x++)if(!M[y*w+x])M[y*w+x]=2}}
  const water=o.water=(x,y)=>x>=0&&y>=0&&x<w&&y<h?M[y*w+x]:0,at=(u,v)=>{const X=u*w,Y=G.hz+v*G.H;let best=S[0],bd=1e9;for(const p of S){const d=Math.hypot(p[0]-X,p[1]-Y);if(d<bd){bd=d;best=p}}return best};
  o.LT=[];o.TW=[];o.RED=[];const IT=o.IT=[],lay=b=>b<=W.b?0:b<=G.via?1:2;
  // 几条大街：从眼前往地平线那头收拢（不盖楼，两边一溜路灯，车在上面跑）
  const avX=o.avX=(a,y)=>a[1]*w+(a[0]-a[1])*w*(y-G.hz)/G.H,avW=o.avW=y=>(1.6+(y-G.hz)/G.H*10)*k,onAv=(x0,x1,y)=>G.av.some(a=>{const c=avX(a,y),hw=avW(y)+1;return x1>c-hw&&x0<c+hw});
  // 一排排的楼：越近排得越开、楼越大
  for(let y=G.hz+2,d=2,ri=0;y<h+14;y+=d,d=Math.max(2,Math.round(d*1.16+.3)),ri++){const v=(y-G.hz)/G.H,st=tSty(v);let x=-Math.floor(hsh(ri,601)*12);
    for(let i=0;x<w+8;i++){const sd=ri*977+i,bw=Math.max(2,Math.round((3.4+hsh(sd,602)*6.6)*st.s)),bx=x;x+=bw+Math.floor(hsh(sd,603)*(1+st.s*1.4));
      const b=y+Math.floor((hsh(sd,604)-.5)*d*.8);let bh=Math.max(2,Math.round((2.4+Math.pow(hsh(sd,605),1.7)*14)*st.s));
      let wet=false;for(let q=bx;q<bx+bw&&!wet;q++)wet=!!(water(q,b)||water(q,b-1)||water(q,b+1));if(wet||onAv(bx,bx+bw,b))continue;
      // 摩天轮脚下、前面那一片只种树、盖矮房子，看得见轮子和水里的倒影
      const inW=bx+bw>W.x-W.R-10&&bx<W.x+W.R+10;if(inW&&b>W.b-5&&b<W.b+44*k)bh=Math.min(bh,Math.round(3*k));
      // 楼前面就是水：矮一点，留出看得见河的那一截（少数几座照样挡着）
      let dw=0;for(let q=2;q<=bh;q++)if(water(bx+(bw>>1),b-q)||water(bx+1,b-q)||water(bx+bw-2,b-q)){dw=q;break}
      if(dw&&(inW||hsh(sd,606)<.85))bh=Math.max(1,dw-2);if(bh<2)continue;
      const nearW=!!(water(bx+(bw>>1),b+2)||water(bx+(bw>>1),b+3)),bb=b,bbh=bh;
      IT.push({b,L:lay(b),d:()=>NC.bld(bx,bb,bw,bbh,{f:st.f,s:hexK(st.f,.78),sw:st.sw,t:st.t,g:st.g,p:v<.12?.72:.66,hz:st.hz,hc:st.hc,lt:1,sd,r:st.styles[Math.floor(hsh(sd,607)*st.styles.length)],
        cb:(wx,wy,ww,wh,c)=>{if(nearW&&o.LT.length<300)o.LT.push({x:wx,y:wy,yb:bb,c,v});if(hsh(wx,wy)<.025&&o.TW.length<44)o.TW.push([wx,wy,ww,wh,st.f,lay(bb)])}})})}}
  // 电视塔两边一簇高楼，顶上挂红灯
  [[.18,.07,9,40,2],[.21,.1,11,54,3],[.245,.06,8,34,7],[.33,.085,12,60,7],[.36,.12,9,44,3],[.395,.07,10,38,5],[.425,.105,8,30,2]].forEach(([u,v,bw,bh,r],i)=>{const b=G.hz+Math.round(v*G.H),st=tSty(v),x=Math.round(u*w),f=mixHex(st.f,'#1c2050',.3);
    IT.push({b,L:0,d:()=>NC.bld(x,b,Math.round(bw*k),Math.round(bh*k),{f,s:hexK(f,.75),sw:Math.max(1,Math.round(2*k)),t:'#5a64a6',g:[2,3,1,1],p:.55,hz:st.hz*.6,hc:st.hc,lt:1,sd:880+i,r,
      tip:(tx,ty)=>{if(r===3||r===2||r===7)o.RED.push([tx,ty-1,i*.23])},cb:(wx,wy,ww,wh)=>{if(hsh(wx,wy)<.03&&o.TW.length<44)o.TW.push([wx,wy,ww,wh,f,0])}})})});
  IT.push({b:G.tv.b,L:0,d:()=>{const tp=NC.tower(G.tv.x,G.tv.b,G.tv.b-G.tv.top,{c:'#272e66',l:'#5a64aa',w:'#ffe7a0',lt:1});o.RED.push([tp.x,tp.y,.5])}});
  // 远处的小石桥：桥面一溜灯
  {const [cx,cy]=at(.73,.14),y=Math.round(cy),hw=Math.round(rx(cy))+Math.round(3*k),x0=Math.round(cx)-hw,x1=Math.round(cx)+hw;
    IT.push({b:y+2,L:lay(y+2),d:()=>{R(x0,y-1,x1-x0,1,'#5a5e94');R(x0,y,x1-x0,2,'#2a2c58');for(let x=x0+2;x<x1-1;x+=Math.max(3,Math.round(4*k)))if(water(x,y+2))R(x,y+2,1,2,'#141634');
      for(let x=x0+1;x<x1;x+=2){const c=(x>>1)%2?'#ffe9a8':'#fff6dc';P1(x,y-2,c);o.LT.push({x,y:y-2,yb:y+2,c,v:.14})}}})}
  // 近处的吊桥：两座桥塔，主缆垂下来，缆上一串小灯，桥面一排路灯
  {const [cx,cy]=at(.36,.58),y=Math.round(cy),hw=Math.round(rx(cy))+Math.round(9*k),x0=Math.round(cx)-hw,x1=Math.round(cx)+hw,tw=Math.round(hw*.62),th=Math.round(24*k),t0=Math.round(cx)-tw,t1=Math.round(cx)+tw;o.bridge={x0,x1,y};
    IT.push({b:y+3,L:lay(y+3),d:()=>{R(x0,y,x1-x0,3,'#262850');R(x0,y,x1-x0,1,'#5a5e98');R(x0,y+3,x1-x0,1,'#0e0e26');
      const cab=(xa,ya,xb,yb,sag)=>{const n=Math.abs(xb-xa);for(let i=0;i<=n;i++){const u=i/n,x=Math.round(xa+(xb-xa)*u),yy=Math.round(ya+(yb-ya)*u+Math.sin(u*Math.PI)*sag);if(i%3===0&&yy<y-1)R(x,yy+1,1,y-yy-1,'#2a2c58');P1(x,yy,'#4a4e86');
        if(i%2===0&&i>0&&i<n){const c=(i>>1)%2?'#fff2c0':'#ffd27a';P1(x,yy,c);if(o.LT.length<340)o.LT.push({x,y:yy,yb:y+3,c,v:.58})}}};
      cab(x0,y,t0,y-th+1,th*.1);cab(t0,y-th+1,t1,y-th+1,th*.84);cab(t1,y-th+1,x1,y,th*.1);
      for(const tx of[t0,t1]){R(tx-1,y-th,3,th+4,'#2e3064');P1(tx+1,y-th,'#7a80c0');R(tx+1,y-th+1,1,th,'#4a4e88');R(tx-1,y-Math.round(th*.55),3,1,'#5a5e98');R(tx,y-th-2,1,2,'#2e3064');P1(tx,y-th-3,'#ff6a5a')}
      for(let x=x0+2;x<x1-1;x+=Math.max(3,Math.round(5*k))){P1(x,y-1,'#ffe0a0');o.LT.push({x,y:y-1,yb:y+3,c:'#ffe0a0',v:.58})}}})}
  // 高架：桥面下一个个拱，一溜小灯
  IT.push({b:G.via+1,L:1,d:()=>{const y=G.via,th=Math.max(2,Math.round(3*k)),sp=Math.round(28*k),pw=Math.max(2,Math.round(3*k)),ah=Math.round(6*k);R(0,y-th,w,th,'#22244c');R(0,y-th,w,1,'#50548c');R(0,y-th-1,w,1,'#2a2c58');
    for(let x0=Math.round(6*k)-sp;x0<w;x0+=sp){R(x0,y,pw,Math.round(34*k),'#1a1a3e');R(x0,y,1,Math.round(34*k),'#2c2e5c');for(let x=x0+pw;x<x0+sp;x++){const u=(x-x0-pw)/(sp-pw),dd=Math.round(ah*(1-Math.sin(u*Math.PI)));if(dd>0)R(x,y,1,dd,'#1e1e44')}}
    for(let x=Math.round(4*k);x<w;x+=Math.round(12*k))P1(x,y-th-2,'#ffd88a')}});
  IT.sort((a,b)=>a.b-b.b);
  // 摩天轮：转的那几帧（用到才画）；倒影落在河里的那几行
  o.WH=NC.wheel(W.R,16,W.bh,24,{key:'tt'+k,rim:'#8a92d0',rim2:'#4a528c',sp:'#565e9c',leg:'#3a4078',L:['#ffd84a','#ff7a9a','#7ee0a0','#6ac8ff'],RL:['#fff6c8','#ffc8e8'],SL:['#ffe08a','#ff9ac8','#8ae0ff','#b0f0a0'],st:'#2a2e60',sw:'#ffe08a',hub:'#ffffff'});
  o.WR=[];const ox=W.x-o.WH.ox;for(let r=1;r<W.bh+W.R;r++){const y=W.b+r,sy=o.WH.oy+W.bh-r;if(y>=h||sy<0)break;let x0=-1;for(let x=ox;x<=ox+2*o.WH.ox+1;x++){const in_=water(x,y)===2;if(in_&&x0<0)x0=x;if((!in_||x===ox+2*o.WH.ox+1)&&x0>=0){const x1=in_?x:x-1;if(x1-x0>2)o.WR.push([y,sy,x0,x1]);x0=-1}}}
  const RF=[];o.wref=i=>{i=((i%24)+24)%24;if(RF[i])return RF[i];const s=o.WH.get(i),c=NC.mk(s.width,s.height),g=c.getContext('2d');g.drawImage(s,0,0);const d=g.getImageData(0,0,c.width,c.height),p=d.data,wc=[28,36,82];
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const j=(y*c.width+x)*4;if(!p[j+3])continue;if(bay(x,y)>.6){p[j+3]=0;continue}for(let q=0;q<3;q++)p[j+q]=Math.round(p[j+q]*.55+wc[q]*.45)}g.putImageData(d,0,0);return RF[i]=c}}
function topL0a(o){const {w,h,G}=o,k=G.k;o.L0=layer(w,h,()=>{
  vGrad(0,0,w,G.hz+2,TT_SKY,10);
  const gh=Math.round(36*k);for(let y=G.hz-gh;y<=G.hz+1;y++){const lv=Math.pow((y-G.hz+gh)/gh,1.7)*.5;for(let x=0;x<w;x++)if(bay(x,y)<lv)P1(x,y,'#353068')}   // 地平线上映着城里的灯
  milky(w*.04,h*.3,w*.6,-h*.06,26*k,{lv:.2,s:9,n:.025,bot:Math.round(G.hz-26*k),c:['#141842','#1c2252','#283066']});
  stars(0,0,w,G.hz-gh*.6,Math.round(w*G.hz/300),31,(x,y)=>Math.hypot(x-G.moon.x,y-G.moon.y)<G.moon.r*2.7);
  moonBig(G.moon.x,G.moon.y,G.moon.r,{hr:Math.round(G.moon.r*2.2),hl:.42});
  // 远的一道山淡、偏蓝；近一点的雪山，月亮在右上，向右的山坡亮、描一道边
  NC.ridge(0,Math.round(w*.72),G.hz+1,[[.1,.13,.11],[.27,.15,.1],[.45,.12,.1],[.6,.09,.08]].map(([u,hh,pw])=>[u*w,hh*h,pw*w]),{c:'#20264f',l:'#272e5c',sn:'#444c84',sl:'#6a74aa',rim:'#98a2d4',rim2:'#2a3060',lt:1,s:17,sf:.55});
  NC.ridge(0,Math.round(w*.67),G.hz+2,[[.03,.16,.08],[.13,.21,.09],[.23,.15,.07],[.345,.19,.085],[.46,.14,.08],[.555,.11,.07],[.63,.06,.05]].map(([u,hh,pw])=>[u*w,hh*h,pw*w]),{c:'#171b44',l:'#1f2552',sn:'#3c4480',sl:'#a0a8d8',rim:'#e4e8ff',rim2:'#2c3262',lt:1,s:5,sf:.62})})}
function topL0b(o){const {w,h,G,M,IT,water}=o,k=G.k;NC.into(o.L0,()=>{
  // 地面、海（近海平线亮，往近处暗）、海平线一道亮线、海边
  R(0,G.hz+1,w,h-G.hz-1,'#11132e');for(let y=G.hz+1;y<h;y++){const q=(y-G.hz)/G.H;if(q>.15)for(let x=0;x<w;x++)if(bay(x,y)<(q-.15)*1.2)P1(x,y,'#0a0a1c')}
  for(const a of G.av)for(let y=G.hz+3;y<h;y++){const v=(y-G.hz)/G.H,c=o.avX(a,y),hw=o.avW(y);for(let x=Math.round(c-hw);x<=Math.round(c+hw);x++)if(!water(x,y))P1(x,y,'#17173a');
    const st=Math.max(1,Math.round(1+v*5));if((y-G.hz)%st===0)for(const sd of[-1,1]){const lx=Math.round(c+sd*hw);if(!water(lx,y))P1(lx,y,v<.15?'#b88a5a':'#ffb45a')}}
  const SC=['#2a3062','#20265a','#181e4c','#131842'];for(let x=Math.floor(w*.5);x<w;x++){const c=G.coast(x);for(let y=G.hz;y<c;y++){const q=Math.min(.999,(y-G.hz)/Math.max(2,c-G.hz))*(SC.length-1),i=Math.floor(q);P1(x,y,bay(x,y)<q-i?SC[i+1]:SC[i])}P1(x,G.hz,'#4a5290');P1(x,c,'#2c2e58')}
  for(let i=0;i<40;i++){const x=Math.floor(w*.5+hsh(i,701)*w*.5),y=G.hz+2+Math.floor(hsh(i,702)*(G.coast(x)-G.hz-2));if(water(x,y)===1&&water(x+3,y)===1)R(x,y,2+Math.floor(hsh(i,703)*3),1,'#2e3670')}
  // 防波堤、灯塔（红白条，顶上的灯每帧画）
  const L=G.lh,bx0=Math.round(w*.885),by=L.b,lw=Math.max(3,Math.round(4*k)),lhh=Math.round(22*k);R(bx0,by-1,w-bx0,3,'#141634');R(bx0,by-1,w-bx0,1,'#3a3e6e');disc(L.x,by,Math.round(6*k),Math.max(1,Math.round(2*k)),'#141634');
  for(let j=0;j<lhh;j++){const ww=lw+Math.round((j/lhh)*-1+1);R(L.x-(ww>>1),by-j-1,ww,1,Math.floor(j/Math.max(2,4*k))%2?'#b8b0c8':'#9a3a4a');P1(L.x-(ww>>1)+ww-1,by-j-1,j%2?'#d8d0e4':'#c05a68')}
  R(L.x-(lw>>1)-1,by-lhh-1,lw+2,1,'#141634');R(L.x-(lw>>1),by-lhh-4,lw,3,'#fff4c0');R(L.x-(lw>>1)-1,by-lhh-5,lw+2,1,'#141634');R(L.x-1,by-lhh-6,3,1,'#141634');o.lamp=[L.x,by-lhh-3];
  // 河：远处映着天光淡一点，近处暗；岸边一道石头的亮边，岸上一盏盏灯
  const RC=['#283062','#1c2352','#151b44','#10153a','#0c1032','#0a0d2a'];for(let y=G.hz;y<h;y++){const q=Math.min(.999,(y-G.hz)/G.H*1.7)*(RC.length-1),i0=Math.floor(q),fr=q-i0;for(let x=0;x<w;x++)if(M[y*w+x]===2)P1(x,y,bay(x,y)<fr?RC[i0+1]:RC[i0])}
  for(let y=G.hz+1;y<h-1;y++)for(let x=1;x<w-1;x++){if(M[y*w+x]!==2)continue;const v=(y-G.hz)/G.H;
    if(!M[(y-1)*w+x]){P1(x,y-1,'#3c4074');if(v>.06&&hsh(x,y)<.24){P1(x,y-2,'#ffd890');o.LT.push({x,y:y-2,yb:y,c:'#ffd890',v})}}
    else if(!M[y*w+x-1]||!M[y*w+x+1]){const sx=!M[y*w+x-1]?x-1:x+1;P1(sx,y,'#2c2e5c');if(v>.06&&hsh(sx,y)<.09){P1(sx,y-1,'#ffd890');o.LT.push({x:sx,y:y-1,yb:y,c:'#ffd890',v})}}
    if(!M[(y+1)*w+x])P1(x,y+1,'#0a0b20')}
  IT.forEach(it=>{if(it.L===0)it.d()});
  // 远处的城上蒙着一层夜雾：越靠地平线越浓
  const fh=Math.round(16*k);for(let y=G.hz-Math.round(8*k);y<G.hz+fh;y++){const lv=(1-Math.abs(y-G.hz)/(y<G.hz?8*k:fh))*.38;if(lv>0)for(let x=0;x<w;x++)if(!water(x,y)&&bay(x,y)<lv)P1(x,y,'#3a3672')}})}
function topL1(o){const {w,h,IT}=o;o.L1=layer(w,h,()=>IT.forEach(it=>{if(it.L===1)it.d()}))}
// 一张图从第几行开始有东西（每帧只画那一截，省一点）
const topRow=cv=>{const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,W=cv.width;for(let y=0;y<cv.height;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3])return y;return cv.height};
// 树冠的叶子团：先画叶子，再在上沿点几颗小灯（挂着的成品夜里都亮着灯）
function topLeaves(L,w,h){leafMass(L,L,TT_LEAF);L.forEach((b,i)=>{for(let j=0;j<2;j++){const a=-Math.PI*(.15+hsh(b.x+i,j+801)*.7),x=Math.round(b.x+Math.cos(a)*b.rx*.7),y=Math.round(b.y+Math.sin(a)*b.ry*.7);if(x<2||x>w-3||y<2||y>h-3)continue;
  for(let q=-3;q<=3;q++)for(let r=-3;r<=3;r++){const d=Math.hypot(q,r);if(d>1.2&&d<3.4&&bay(x+q,y+r)<(1-d/3.4)*.7)P1(x+q,y+r,'#ffd27a')}R(x,y,1,1,'#fff6d0');P1(x-1,y,'#ffc860');P1(x+1,y,'#ffc860');P1(x,y-1,'#ffc860');P1(x,y+1,'#ffc860')}})}
function topL2(o){const {w,h,IT,G}=o,k=G.k;o.L2=layer(w,h,()=>{IT.forEach(it=>{if(it.L===2)it.d()});
  // 下沿、两个下角：一团团金色的树叶
  const L=[];for(let i=0;i*30*k<w+60;i++)L.push({x:Math.round(i*30*k-10),y:h-4+Math.round(hsh(i,391)*10*k),rx:Math.round((24+hsh(i,392)*9)*k),ry:Math.round((15+hsh(i,393)*7)*k)});
  for(let i=0;i*46*k<w+60;i++){const x=Math.round(i*46*k+12);if(Math.abs(x-G.catX)>58*k)L.push({x,y:h-Math.round((20+hsh(i,394)*8)*k),rx:Math.round((19+hsh(i,397)*8)*k),ry:Math.round((12+hsh(i,398)*5)*k)})}
  L.push({x:-6,y:Math.round(h*.78),rx:Math.round(34*k),ry:Math.round(24*k)},{x:Math.round(8*k),y:Math.round(h*.66),rx:Math.round(20*k),ry:Math.round(16*k)},{x:w+6,y:Math.round(h*.74),rx:Math.round(38*k),ry:Math.round(28*k)},
    {x:Math.round(w-30*k),y:Math.round(h*.9),rx:Math.round(34*k),ry:Math.round(20*k)},{x:w+4,y:Math.round(h*.6),rx:Math.round(22*k),ry:Math.round(20*k)});
  topLeaves(L,w,h);
  // 瞭望台：两块木板、两根柱子、一道绳栏
  const px=G.catX,py=G.plank,hw=Math.round(44*k);R(px-hw,py,hw*2,6,OL);R(px-hw+1,py+1,hw*2-2,1,'#b08058');R(px-hw+1,py+2,hw*2-2,3,'#7a5236');for(let x=px-hw+4;x<px+hw;x+=11)P1(x,py+3,'#5a3a24');
  [px-hw,px+hw-3].forEach(x=>{R(x,py-16,3,16,OL);R(x+1,py-15,1,15,'#8a6040')});for(let i=0;i<hw*2-4;i++)P1(px-hw+2+i,py-13+Math.round(Math.sin(i/(hw*2-4)*Math.PI)*4),'#a8a092')});o.L2y=topRow(o.L2);o.L1y=topRow(o.L1);
  // 左上角伸进来一根枝：叶子、挂着的成品、枝头一盏纸灯笼（单独一小张）
  const cw=Math.round(w*.25)+20,ch=Math.round(64*k);o.L2c=layer(cw,ch,()=>{topLeaves([{x:-8,y:-6,rx:Math.round(46*k),ry:Math.round(30*k)},{x:Math.round(30*k),y:Math.round(2*k),rx:Math.round(26*k),ry:Math.round(16*k)}],w,h);
    const by=Math.round(16*k),x0=Math.round(36*k),x1=Math.round(w*.215),yy=x=>by+Math.round((x-x0)*.07);for(let x=x0;x<x1;x++){R(x,yy(x)-2,1,5,'#1e1208');R(x,yy(x)-1,1,3,'#5a3a1e');P1(x,yy(x)-1,'#7a5434')}
    [['scarf',0,.1],['hat',1,.14],['sock',3,.18]].forEach(([kd,ci,fx],i)=>{const x=Math.round(w*fx),y=yy(x)+2,len=Math.round((5+i*3)*k);R(x,y,1,len,'#9a948a');knit(kd,x,y+len,ci)});
    const lx=x1-2,ly=yy(x1)+Math.round(10*k);for(let y=ly-14;y<=ly+14;y++)for(let x=lx-14;x<=lx+14;x++){const d=Math.hypot(x-lx,(y-ly)*1.1);if(d>5&&d<14&&bay(x,y)<(1-d/14)*.45)P1(x,y,'#e8a850')}
    R(lx,ly-10,1,6,'#9a948a');R(lx-3,ly-4,7,9,OL);R(lx-2,ly-3,5,7,'#ffd88a');R(lx-2,ly+1,5,1,'#e8a040');R(lx-1,ly-3,1,7,'#fff0c0');R(lx-1,ly+5,3,2,OL)})}
// 水面的碎光（第 f 帧）：海上月光碎成一溜、海面零星的反光、河里每盏灯拉下来的一道倒影、河面的波纹
function topWater(o,f){const {w,h,G,water}=o,k=G.k;(o.W=o.W||[])[f]=layer(w,h,()=>{
  const mx=G.moon.x,c=G.coast(mx);for(let y=G.hz+1;y<c;y++){const q=(y-G.hz)/Math.max(1,c-G.hz),hw=Math.round((1.5+q*6)*k);for(let x=mx-hw;x<=mx+hw;x++){if(water(x,y)!==1)continue;const n=hsh(x*3+f*17,y*5+f*3),e=1-Math.abs(x-mx)/(hw+1);if(n<e*.6)P1(x,y,n<e*.22?'#f0f2ff':'#9aa6dc')}}
  for(let i=0;i<70;i++){const x=Math.floor(w*.5+hsh(i,f*131+5)*w*.5),y=G.hz+1+Math.floor(hsh(i,f*131+6)*Math.max(1,G.coast(x)-G.hz-1));if(water(x,y)===1&&water(x+2,y)===1)R(x,y,2+Math.floor(hsh(i,f+7)*3),1,'#36408a')}
  for(const L of o.LT){const len=Math.round((2+L.v*9)*k),y0=2*L.yb-L.y;if(y0>=h)continue;const cc=mixHex(L.c,'#1a2150',.3);for(let j=0;j<len;j++){const y=y0+j,xx=L.x+(hsh(L.x*7+j,f*31+L.y)<.32?(hsh(j+L.y,f)<.5?1:-1):0);if(water(xx,y)===2&&bay(xx+f,y+f)<(1-j/len)*.95)P1(xx,y,cc)}}
  for(let i=0;i<110;i++){const x=Math.floor(hsh(i,f*97+11)*w),y=G.hz+Math.floor(hsh(i,f*97+12)*G.H);if(water(x,y)===2){const l=1+Math.round((y-G.hz)/G.H*4*k);for(let q=0;q<l;q++)if(water(x+q,y)===2)P1(x+q,y,'#3a4482')}}})}
// 烟花：先一颗火星升上去，再炸开（一圈、垂下来的金柳，偶尔一张猫脸），往下坠、一点点暗下去；倒影映在河里
const FWC=['#ffd84a','#ff7a6a','#7ee08a','#6ac8ff','#f4a6b8','#ffffff','#c8a0ff'];
function fwParts(p,a,k){const out=[],R0=(1-Math.pow(1-Math.min(1,a/.8),2.4))*p.r,g=a*a*7*k*(p.kind===1?1.9:1),c2=p.col2||p.col;
  if(p.kind===2){const E=[];for(let i=0;i<22;i++){const q=i/22*Math.PI*2;E.push([Math.cos(q)*.8,Math.sin(q)*.72])}[[-1,1],[1,1]].forEach(([s])=>{for(let i=0;i<=5;i++){const u=i/5;E.push([s*(.72-u*.18),-.45-u*.62],[s*(.54-u*.36),-1.07+u*.32])}});E.push([-.3,-.12],[.3,-.12],[0,.15]);
    E.forEach(([u,v],i)=>out.push([p.x+u*R0,p.y+v*R0+g,i>=E.length-3?c2:p.col,i]));return out}
  const n=p.kind===1?26:30;for(let i=0;i<n;i++){const q=i/n*Math.PI*2+(p.kind===1?.1:0);out.push([p.x+Math.cos(q)*R0,p.y+Math.sin(q)*R0*.92+g*(p.kind===1?1+Math.abs(Math.cos(q))*.4:1),p.kind===1?'#ffd27a':p.col,i])}
  if(!p.kind)for(let i=0;i<14;i++){const q=i/14*Math.PI*2+.2;out.push([p.x+Math.cos(q)*R0*.55,p.y+Math.sin(q)*R0*.5+g,c2,100+i])}return out}
function fwSky(V,t,o){const G=o.G,k=G.k,yl=G.hz+G.H*.36;V.fx=V.fx.filter(p=>t-(p.tb??p.t0)<2.2);
  for(const p of V.fx){const tb=p.tb??p.t0;if(t<tb){const u=Math.max(0,(t-p.t0)/(tb-p.t0)),e=1-(1-u)*(1-u),x=Math.round((p.x0??p.x)+(p.x-(p.x0??p.x))*u),y=Math.round(yl+(p.y-yl)*e);P1(x,y,'#fff4d0');P1(x,y+1,'#e8b060');if(bay(x,y)<.5)P1(x,y+3,'#a87040');continue}
    const a=t-tb,fade=Math.max(0,1-a/2.1);if(a<.09)R(Math.round(p.x)-1,Math.round(p.y)-1,3,3,'#ffffff');
    const g=a*a*7*k*(p.kind===1?1.9:1),cy=p.y+g;
    for(const [x,y,c,i] of fwParts(p,a,k)){if(bay(i,Math.floor(a*12))>fade+.12)continue;const px=Math.round(x),py=Math.round(y);
      // 每颗火星后面拖两格尾巴（往中心那边，一格比一格暗）；快灭的时候偶尔一闪白光
      if(a>.12&&p.kind!==1){const c1=mixHex(c,'#0a0c20',.4),c2=mixHex(c,'#0a0c20',.68);P1(Math.round(p.x+(x-p.x)*.9),Math.round(cy+(y-cy)*.9),c1);P1(Math.round(p.x+(x-p.x)*.8),Math.round(cy+(y-cy)*.8),c2)}
      if(a<.32)R(px,py,2,2,c);else{P1(px,py,a>1.1&&hsh(i,Math.floor(t*14))<.18?'#ffffff':c);if(p.kind===1&&a>.2){P1(px,py-1,'#c89040');if(bay(px,py)<.5)P1(px,py-2,'#8a6030')}}}}}
function fwRefl(V,t,o){const G=o.G,k=G.k;for(const p of V.fx){const tb=p.tb??p.t0;if(t<tb)continue;const a=t-tb,fade=Math.max(0,1-a/2.1);
  for(const [x,y,c,i] of fwParts(p,a,k)){if(i%2||bay(i,Math.floor(a*12))>fade)continue;const px=Math.round(x),ry=Math.round(2*G.hz-y+6*k);if(o.water(px,ry)===2)P1(px,ry,mixHex(c,'#1a2150',.4))}}}
function topFrame(E){const {w,h,t,V}=E,o=fullB(build('treetop',w,h,topSteps)),G=o.G,k=G.k,W=G.wheel;
  C.drawImage(o.L0,0,0);
  // 云：两条薄云慢慢往左飘，向着月亮那一边亮一道
  for(let i=0;i<2;i++){const cw=Math.round((96-i*24)*k),ch=Math.round((15-i*3)*k),c=spr('ttc'+i+'|'+k,cw,ch,()=>nightCloud(cw,ch,331+i*7,1)),x=Math.round(w+20-((t*(1.1+i*.6)+i*w*.55)%(w+cw+60))),y=Math.round(h*(.05+i*.1));C.drawImage(c,x,y)}
  for(let i=0;i<14;i++){const x=Math.floor(hsh(i,951)*w),y=Math.floor(hsh(i,952)*(G.hz-30*k));if(Math.floor(t*1.3+i*.61)%6===0)starPx(x,y,1,'#ffffff')}
  // 毛线球热气球：篮子里坐着一只猫，喷口一点火光
  {const br=Math.round(10*k),bh=Math.round(12*k),sw=br*2+5,sh=bh*2+Math.round(14*k),c=spr('ttb|'+k,sw,sh,()=>{const cx=br+2,cy=bh+1;disc(cx,cy,br+1,bh+1,OL);for(let j=-bh;j<=bh;j++){const hw=Math.floor(br*Math.sqrt(Math.max(0,1-(j/(bh+.5))**2)));for(let x=-hw;x<=hw;x++){const Y=YARN[((x+j+40)>>2)%5],sh2=(x*.5+j*.7)/br>.35;P1(cx+x,cy+j,sh2?Y[1]:((x-j+40)>>1)%2?Y[0]:Y[2])}}
      line(cx-Math.round(6*k),cy+bh-1,cx-Math.round(3*k),cy+bh+Math.round(6*k),OL);line(cx+Math.round(6*k),cy+bh-1,cx+Math.round(3*k),cy+bh+Math.round(6*k),OL);const by=cy+bh+Math.round(6*k);R(cx-4,by,9,5,OL);R(cx-3,by+1,7,3,'#8a5a3a');grid(cx-2,by-4,["o...o","oo.oo","ooooo"],{o:'#f0a352'});P1(cx,cy+bh+1,'#ffd27a')}),
    x=Math.round(((w*.08+(t-V.t0)*3.2*k)%(w+60))-30),y=Math.round(h*.24+Math.sin(t*.5)*3*k);C.drawImage(c,x-(sw>>1),y-(sh>>1))}
  // 一群鸟从月亮前面飞过去（17 秒一趟，只有挡着月亮的时候看得清）
  {const bp=(t%17)/17;if(bp<.6){const u=bp/.6,cx=w+20-(w+70)*u,cy=G.moon.y+(cx-G.moon.x)*.1+Math.sin(u*9)*2*k;for(let i=0;i<7;i++){const j=i-3,x=Math.round(cx+Math.abs(j)*6*k+(i%2)),y=Math.round(cy+j*3.4*k),f=Math.floor(t*6+i)%2;P1(x,y,'#141634');R(x-2,y-(f?1:0),2,1,'#141634');R(x+1,y-(f?1:0),2,1,'#141634');if(f){P1(x-3,y,'#141634');P1(x+3,y,'#141634')}}}}
  fwSky(V,t,o);
  const wy=G.hz-1;C.drawImage(o.W[Math.floor(t*3)%4],0,wy,w,h-wy,0,wy,w,h-wy);
  // 灯塔的光：转到这边的时候一道光扫过海面；正对着这边的时候灯一亮
  {const [lx,ly]=o.lamp,q=t*.8,s=Math.sin(q),Lm=Math.round(w*.42);if(s<-.08){const L=Math.max(8,Math.round(-s*Lm)),hm=Math.round(2+L*.06*k),dr=Math.round(L*.07),bm=spr('ttbm|'+L+'|'+k,L+2,hm*2+dr+4,()=>{const y0=hm+1;
      for(let d=1;d<L;d++){const hw=.6+d*.06*k,yc=y0+d*.07,kk=.62*Math.pow(1-d/L,.55);for(let y=Math.floor(yc-hw);y<=Math.ceil(yc+hw);y++){const e=1-Math.abs(y-yc)/(hw+.8);if(e>0&&bay(L-d,y)<kk*Math.sqrt(e))P1(L-d,y,d<L*.25&&e>.5?'#fff8d0':e>.6?'#d8d4b8':'#9a9a98')}}});C.drawImage(bm,lx-L,ly-hm-1)}
    if(Math.cos(q)>.9){R(lx-3,ly,7,1,'#fff8d0');R(lx,ly-3,1,7,'#fff8d0');P1(lx-2,ly-2,'#c8c4a8');P1(lx+2,ly+2,'#c8c4a8');P1(lx+2,ly-2,'#c8c4a8');P1(lx-2,ly+2,'#c8c4a8')}}
  fwRefl(V,t,o);
  // 摩天轮在水里的倒影：一行一行左右晃，断断续续
  const wf=Math.floor(t*1.2),ref=o.wref(wf),ox=W.x-o.WH.ox;for(const [y,sy,x0,x1] of o.WR){if((y-W.b)%4===3)continue;const wob=Math.round(Math.sin(t*2.4+y*.8)*1.2),n=x1-x0-1;if(n>0)C.drawImage(ref,x0+1-ox,sy,n,1,x0+1+wob,y,n,1)}
  o.RED.forEach(([x,y,ph])=>NC.redLight(x,y,t,ph));
  // 大街上的车：朝这边开的是一对对白的车头灯，往远处去的是红的车尾灯
  for(let ai=0;ai<G.av.length;ai++){const a=G.av[ai];for(let j=0;j<6;j++){const dir=j%2?1:-1,u=((t*(.016+hsh(j,ai)*.012)*dir+hsh(j,ai+7))%1+1)%1,v=.06+u*.94,y=Math.round(G.hz+v*G.H);if(y>=h)continue;
    const c=o.avX(a,y),lx=Math.round(c+dir*o.avW(y)*.45);if(o.water(lx,y))continue;const col=dir>0?'#fff6d8':'#ff5a4a';P1(lx,y,col);if(v>.3)P1(lx+1,y,col)}}
  o.TW.forEach(([x,y,ww,wh,off,L],i)=>{if(L===0&&hsh(i,Math.floor(t/(5+hsh(i,9)*7)+hsh(i,10)))<.3)R(x,y,ww,wh,off)});
  // 摩天轮：慢慢转，外圈上跑着两颗亮点
  C.drawImage(o.WH.get(wf),ox,W.b-W.bh-o.WH.oy);for(let i=0;i<2;i++){const a=t*.7+i*Math.PI;P1(Math.round(W.x+Math.cos(a)*W.R),Math.round(W.b-W.bh+Math.sin(a)*W.R),'#ffffff')}
  if(o.L1y<h)C.drawImage(o.L1,0,o.L1y,w,h-o.L1y,0,o.L1y,w,h-o.L1y);
  o.TW.forEach(([x,y,ww,wh,off,L],i)=>{if(L===1&&hsh(i,Math.floor(t/(5+hsh(i,9)*7)+hsh(i,10)))<.3)R(x,y,ww,wh,off)});
  // 电车：22 秒一趟，左右轮流开过高架
  {const per=22,cyc=Math.floor(t/per),ph=(t%per)/per;if(ph<.55){const L=Math.round(30*k),H=Math.round(9*k),nc=3,tw=nc*(L+2),dir=cyc%2?-1:1,u=ph/.55,tx=Math.round(dir>0?-tw+(w+tw)*u:w-(w+tw)*u),th=Math.max(2,Math.round(3*k));
    NC.tram(tx,G.via-th-1-H,L,H,nc,{c:'#4c4c88',d:'#262650',w:'#ffe2a0',k:'#4a3040',hl:'#ffffff',dir})}}
  if(o.L2y<h)C.drawImage(o.L2,0,o.L2y,w,h-o.L2y,0,o.L2y,w,h-o.L2y);C.drawImage(o.L2c,0,0);
  for(let i=0;i<10;i++){const q=((t*.1+hsh(i,395))%1),x=Math.round(w*1.05-q*w*1.2+Math.sin(t*1.3+i)*10),y=Math.round(h*(.12+hsh(i,396)*.7)+q*40);leafG(x,y,i)}
  cat(E.pal,G.catX,G.plank+1,{...idle(t),rim:'#c8d4ff',mul:'#b4b0d8'})}

/* ================= 4. 鱼缸：凑近看鱼，伸爪碰碰玻璃 ================= */
// 一口大鱼缸，凑得很近：顶上的灯照下来几道光；后面一排水草的影子、一截沉木；沙上是 1024 城堡、开着盖的宝箱（冒泡泡）、石头，一只寄居蟹爬来爬去（爪子碰到它附近就缩进壳里）。
// 一小群霓虹灯鱼跟着领头的游，领头的一掉头，一群一起转弯；四条大一点的慢慢游，偶尔一条变成金鱼。你的猫凑在玻璃前，只露出头和肩膀，跟着鼠标左右挪，爪子只够得着身前一段。
// V.fish 里两种鱼都在（sc 是霓虹灯鱼）：world4-vista.js 的伸爪按它们的位置算碰没碰到、谁被吓跑
const FISH_COL=[['#f08a4a','#c46a2a','#ffc890'],['#ffd84a','#c9a030','#fff0a8'],['#fff4dc','#e0533d','#ffffff'],['#5B9BD5','#34618f','#a8d0f0']];
// 凑近了看的大鱼：圆圆的身子、背深肚子浅、一身细鳞、尾巴一张一合、背鳍胸鳍、亮亮的眼睛（26×16 左右）
function bigFishSpr([b,a,d],f,dir){return spr('bf'+b+a+d+f+dir,32,18,()=>{C.save();if(dir<0){C.translate(32,0);C.scale(-1,1)}const cx=18,cy=9,tw=f?5:3;
  for(let j=-tw;j<=tw;j++){const l=Math.round(7-Math.abs(j)*.4);R(cx-10-l,cy+j,l+3,1,OL)}for(let j=-tw+1;j<=tw-1;j++){const l=Math.round(6-Math.abs(j)*.4);R(cx-10-l+1,cy+j,l+1,1,a);if(Math.abs(j)%2)P1(cx-10-l+2,cy+j,d)}
  for(let i=0;i<7;i++){const hh=i<4?i:6-i;R(cx-4+i,cy-7-hh,1,hh+2,OL);if(hh>0)R(cx-4+i,cy-6-hh,1,hh,a)}
  disc(cx,cy,11,7,OL);disc(cx,cy,10,6,b);for(let x=cx-9;x<=cx+8;x++){const yy=cy-Math.round(6*Math.sqrt(Math.max(0,1-((x-cx)/10.5)**2)))+1;P1(x,yy,a);if(x%2)P1(x,yy+1,a)}disc(cx,cy+3,8,2,d);
  for(let i=0;i<6;i++)for(let j=0;j<2;j++)P1(cx-7+i*3+j,cy-1+j*2-(i%2),mixHex(b,d,.6));
  for(let j=-4;j<=3;j++)P1(cx+4+Math.round(Math.abs(j)*.25),cy+j,a);for(let i=0;i<4;i++)R(cx+1-i,cy+3+i,2,1,a);
  R(cx+6,cy-3,3,3,OL);R(cx+6,cy-3,2,2,'#ffffff');P1(cx+7,cy-2,'#101418');C.restore()})}
// 霓虹灯鱼：7×3，背深，身上一道发亮的蓝绿，后半截红
const NEON=[["..kkkkkk..","tccccccce.","trrrrwwww.","..rrww...."],["t.kkkkkk..",".ccccccce.",".rrrrwwww.","t.rrww...."]];
const neonSpr=(f,dir)=>spr('neon'+f+dir,10,4,()=>{const g=NEON[f];grid(0,0,dir>0?g:g.map(r=>[...r].reverse().join('')),{k:'#2a3a50',t:'#a85a6a',r:'#ff3a4a',c:'#5af0ff',e:'#101418',w:'#e0e8ee'})});
const tankGeo=(w,h)=>({top:Math.round(h*.08),sand:Math.round(h*.8)});
function tankBack(w,h){const G=tankGeo(w,h),k=h/300;
  // 鱼缸顶上的灯罩，下沿一道灯
  R(0,0,w,G.top,'#18141e');R(0,G.top-4,w,1,'#3a3444');R(0,G.top-3,w,2,'#e8f8ff');R(0,G.top-1,w,1,'#9ad8e8');
  vGrad(0,G.top,w,G.sand-G.top+6,['#8adcec','#68c6e2','#4caed6','#3896c6','#287eb2','#1e689c'],10);
  // 光柱：从灯那儿斜着照下来
  for(let r=0;r<5;r++){const x0=Math.round(w*(.06+r*.21)),wd=Math.round((16+r*3)*k);for(let y=G.top;y<G.sand;y++){const q=(y-G.top)/(G.sand-G.top),xs=x0+Math.round(q*50*k);for(let x=xs;x<xs+wd;x++){const e=1-Math.abs((x-xs)/wd-.5)*2;if(bay(x,y)<.34*(1-q)*e)P1(x,y,'#d8f6ff')}}}
  // 后面一排水草的影子（远、淡）、一截沉木
  for(let i=0;i<34;i++){const x=Math.round(hsh(i,1601)*w),H=Math.round((40+hsh(i,1602)*90)*k),c=i%2?'#2a7a8a':'#2e8494';for(let j=0;j<H;j+=2){const sw=Math.round(Math.sin(j*.05+i)*4*k*(j/H));R(x+sw,G.sand-j,2,2,c)}}
  const dw=[[.02,.86],[.12,.74],[.24,.69],[.33,.72]];for(let i=0;i<dw.length-1;i++){const [u0,v0]=dw[i],[u1,v1]=dw[i+1];for(let s=0;s<=20;s++){const u=s/20,x=Math.round(w*(u0+(u1-u0)*u)),y=Math.round(h*(v0+(v1-v0)*u)),r=Math.round((7-i*1.6)*k);disc(x,y,r+1,Math.max(1,r-1)+1,'#2a1a12');disc(x,y-1,r,Math.max(1,r-1),'#5a3a24');P1(x,y-r+1,'#8a6040')}}
  line(Math.round(w*.12),Math.round(h*.74),Math.round(w*.16),Math.round(h*.6),'#5a3a24');line(Math.round(w*.12)+1,Math.round(h*.74),Math.round(w*.16)+1,Math.round(h*.6),'#3a2416');
  // 沙子、石子
  R(0,G.sand,w,h-G.sand,'#e6d49a');for(let x=0;x<w;x++){const y=G.sand+Math.round(Math.sin(x*.05)*2);R(x,y,1,G.sand-y+2,'#e6d49a');P1(x,y,'#f4e8b8')}dith(0,G.sand+12,w,h-G.sand-12,'#d4c088',.35);
  for(let i=0;i<34;i++){const x=Math.round(hsh(i,401)*w),y=G.sand+6+Math.round(hsh(i,402)*(h-G.sand-10)),c=['#c46a44','#8a93a8','#f4a6b8','#fff4dc','#6a8a5a'][i%5];disc(x,y,3,2,OL);disc(x,y,2,1,c);P1(x-1,y-1,'#ffffff')}
  // 城堡
  const cx=Math.round(w*.72),cb=G.sand+4,cw=54,chh=46;R(cx,cb-chh,cw,chh,OL);R(cx+1,cb-chh+1,cw-2,chh-1,'#9aa3ad');for(let j=cb-chh+4;j<cb;j+=6)for(let i=cx+2+((j/6)%2)*4;i<cx+cw-3;i+=8)R(i,j,6,1,'#7a8490');
  [[cx-6,18,62],[cx+cw-12,18,62]].forEach(([tx,tw,th])=>{R(tx,cb-th,tw,th,OL);R(tx+1,cb-th+1,tw-2,th-1,'#a8b0ba');for(let i=0;i<tw;i+=5){R(tx+i,cb-th-4,3,4,OL);R(tx+i+1,cb-th-3,1,3,'#a8b0ba')}R(tx+6,cb-th+12,5,7,'#2a2238');R(tx+7,cb-th+12,3,1,'#ffd88a');R(tx+7,cb-th+13,3,5,'#e8a040')});
  for(let j=0;j<18;j++){const hw=j<5?Math.floor(Math.sqrt(25-(5-j)**2)):5;R(cx+cw/2-hw,cb-18+j,hw*2,1,'#241a2e')}for(let i=0;i<cw;i+=6){R(cx+i,cb-chh-4,4,4,OL);R(cx+i+1,cb-chh-3,2,3,'#9aa3ad')}txt('1024',cx+cw/2-7,cb-chh+8,'#fff4dc');
  // 苔藓一样的小草沿着城堡脚
  for(let i=0;i<22;i++){const x=cx-10+Math.round(hsh(i,1611)*(cw+20)),hh=2+Math.round(hsh(i,1612)*5);R(x,cb-hh,1,hh,i%2?'#4a9a5a':'#6ab86a')}
  // 宝箱：盖子开着，里面一颗毛线球
  const kx=Math.round(w*.16),ky=G.sand+2;R(kx,ky-12,26,12,OL);R(kx+1,ky-11,24,10,'#8a5a3a');R(kx+1,ky-11,24,2,'#e8b83a');R(kx+11,ky-8,4,4,'#e8b83a');R(kx+2,ky-22,24,8,OL);R(kx+3,ky-21,22,6,'#a8703f');R(kx+3,ky-21,22,1,'#e8b83a');yarnBall(kx+13,ky-14,4,0);
  [[Math.round(w*.42),G.sand+2,16,9],[Math.round(w*.5),G.sand+4,10,6],[Math.round(w*.92),G.sand+3,14,8]].forEach(([x,y,rx,ry])=>{disc(x,y,rx+1,ry+1,OL);disc(x,y,rx,ry,'#6b7480');disc(x-3,y-3,rx-5,ry-4,'#8a93a8');P1(x-6,y-5,'#b4bcc8')})}
function tankFront(w,h){const G=tankGeo(w,h);R(0,G.top-3,4,h,'#18141e');R(w-4,G.top-3,4,h,'#18141e');R(4,G.top,1,h,'#6b7480');R(w-5,G.top,1,h,'#6b7480');
  for(const [x0,y0,n] of[[16,70,22],[23,72,14],[32,70,6],[w-120,74,18],[w-114,76,10]])for(let q=0;q<n;q++){P1(x0+q,y0-q*2,'#f4feff');if(bay(q,x0)<.5)P1(x0+q+1,y0-q*2,'#f4feff')}}
// 寄居蟹：螺壳一圈一圈，几条腿一前一后地挪，两只钳子；缩起来的时候只剩一个壳
function crabPx(x,y,dir,t,hide){const sx=x-dir*3;disc(sx,y-6,7,6,OL);disc(sx,y-6,6,5,'#e8c8a0');disc(sx-1,y-7,4,3,'#f4dcc0');for(let a=0;a<14;a++){const q=a*.55,r=5-a*.32;if(r<1)break;P1(Math.round(sx+Math.cos(q)*r),Math.round(y-6+Math.sin(q)*r*.85),'#b08868')}P1(sx+dir*3,y-9,'#f4a6b8');
  if(hide>0)return;const f=Math.floor(t*6)%2;for(let i=0;i<3;i++){const lx=x+dir*(2+i*2),up=(i+f)%2;line(lx,y-3,lx+dir*2,y+(up?-1:0),'#d0503a')}
  const cx=x+dir*8;disc(cx,y-4,2,2,OL);disc(cx,y-4,2,1,'#ff6a4a');P1(cx+dir,y-5,'#ffb08a');R(x+dir*4,y-9,1,4,'#d0503a');R(x+dir*6,y-9,1,4,'#d0503a');P1(x+dir*4,y-10,'#101418');P1(x+dir*6,y-10,'#101418')}
function tankInit(V,w,h){const G=tankGeo(w,h);V.fish=Array.from({length:4},(_,i)=>({x:w*(.15+hsh(i,411)*.7),y:G.top+20+hsh(i,412)*(G.sand-G.top-50),tx:0,ty:0,sp:14+hsh(i,413)*10,dir:1,scare:0,ci:i%4,gold:false,ph:i*.3}));
  for(let i=0;i<18;i++)V.fish.push({x:w*.5+(hsh(i,421)-.5)*60,y:h*.45+(hsh(i,422)-.5)*30,tx:0,ty:0,sp:30,dir:1,scare:0,sc:1,ox:(hsh(i,423)-.5)*50,oy:(hsh(i,424)-.5)*26,ph:hsh(i,425)});
  V.lead={x:w*.5,y:h*.45,dir:1};V.crab={x:w*.66,dir:1,hide:0,turn:0};V.nextGold=V.t0+12+Math.random()*8;V.bub=[];V.W=w;V.H=h;V.lt=null}
function tankFrame(E){const {w,h,t,V}=E,G=tankGeo(w,h);if(!V.fish||V.W!==w||V.H!==h||!V.lead)tankInit(V,w,h);const dt=Math.min(.05,V.lt==null?0:t-V.lt);V.lt=t;
  C.drawImage(cached('tankBack',w,h,()=>tankBack(w,h)),0,0);
  // 水面一道波纹、沙子上晃动的光斑
  for(let x=0;x<w;x++){const y=G.top+Math.round(Math.sin(x*.06+t*2)*1.2);P1(x,y,'#e6fbff');if((x+Math.floor(t*6))%9===0)P1(x,y+1,'#ffffff')}
  for(let i=0;i<24;i++){const x=Math.round(hsh(i,421)*w+Math.sin(t*1.2+i)*6),y=G.sand+3+Math.round(hsh(i,422)*10);if((Math.floor(t*2)+i)%3)R(x,y,3,1,'#fff4c8')}
  // 水草：一节一节，左右摆
  [[.05,70],[.09,52],[.3,40],[.62,58],[.93,74],[.97,50]].forEach(([fx,hh],p)=>{const px=Math.round(w*fx);for(let j=0;j<hh;j+=2){const sw=Math.round(Math.sin(t*1.4+j*.08+p)*3*(j/hh));R(px+sw,G.sand-j,3,2,p%2?'#4a9a5a':'#5ea85e');if(j%6===0)P1(px+sw+(j%12?3:-1),G.sand-j,'#7ec87a')}R(px-1,G.sand,5,2,'#35593a')});
  // 寄居蟹：慢慢横着爬，到头了掉头；爪子碰到它附近，缩进壳里
  {const c=V.crab;if(V.tap&&t-V.tap.t0<.3&&Math.abs(V.tap.x-c.x)<40&&V.tap.y>G.sand-40)c.hide=2.2;if(c.hide>0)c.hide-=dt;else{c.x+=c.dir*dt*7;if(t>c.turn){c.turn=t+4+Math.random()*6;if(Math.random()<.4)c.dir*=-1}if(c.x<w*.6)c.dir=1;if(c.x>w*.94)c.dir=-1}crabPx(Math.round(c.x),G.sand+12,c.dir,t,c.hide)}
  // 气泡：从宝箱里冒出来
  if(Math.random()<dt*3)V.bub.push({x:Math.round(w*.16)+13+Math.round(Math.random()*6-3),y:G.sand-16,r:1+Math.round(Math.random())});V.bub=V.bub.filter(b=>(b.y-=dt*36)>G.top+2);
  V.bub.forEach(b=>{const x=Math.round(b.x+Math.sin(b.y*.1)*2),y=Math.round(b.y);if(b.r>1){R(x-1,y-2,3,1,'#eaf8ff');R(x-1,y+2,3,1,'#eaf8ff');R(x-2,y-1,1,3,'#eaf8ff');R(x+2,y-1,1,3,'#eaf8ff');P1(x-1,y-1,'#ffffff')}else{R(x-1,y-1,2,1,'#eaf8ff');R(x-1,y+1,2,1,'#eaf8ff');P1(x-2,y,'#eaf8ff');P1(x+1,y,'#eaf8ff')}});
  // 霓虹灯鱼：跟着领头的那条；领头的一掉头，一群一起转弯
  const L=V.lead,lx=w*(.5+.36*Math.sin(t*.23)),ly=h*(.42+.16*Math.sin(t*.37+1));if(Math.abs(lx-L.x)>.05)L.dir=lx>L.x?1:-1;L.x=lx;L.y=ly;
  if(t>V.nextGold&&!V.fish.some(f=>f.gold)){const big=V.fish.filter(f=>!f.sc),f=big[Math.floor(Math.random()*big.length)];f.gold=true;f.goldT=t+8+Math.random()*4;V.nextGold=t+25+Math.random()*15}
  V.fish.forEach(f=>{if(f.sc){const ox=f.x;if(f.scare>0){f.scare=Math.max(0,f.scare-dt);const dx=f.tx-f.x,dy=f.ty-f.y,d=Math.hypot(dx,dy)||1;f.x+=dx/d*Math.min(d,140*dt);f.y+=dy/d*Math.min(d,80*dt)}
      else{const tx=L.x-L.dir*(10+(f.ox+25)*.95),ty=L.y+f.oy*.8+Math.sin(t*1.3+f.ph*6)*3;f.x+=(tx-f.x)*Math.min(1,dt*(1.6+f.ph));f.y+=(ty-f.y)*Math.min(1,dt*(1.6+f.ph))}
      f.dir=f.scare>0?(f.x>=ox?1:-1):L.dir;C.drawImage(neonSpr(Math.floor(t*7+f.ph*5)%2,f.dir),Math.round(f.x)-5,Math.round(f.y+Math.sin(t*3+f.ph*9)*.6)-2);return}
    // 大一点的鱼：慢慢游；被爪子吓到的猛地游开；隔一阵来一条金鱼
    if(f.gold&&t>f.goldT)f.gold=false;if(!f.tx||Math.hypot(f.tx-f.x,f.ty-f.y)<4){f.tx=w*(.08+Math.random()*.84);f.ty=h*.3+Math.pow(Math.random(),.7)*(G.sand-18-h*.3)}
    const sp=f.scare>0?f.sp*4:f.sp;f.scare=Math.max(0,f.scare-dt);const dx=f.tx-f.x,dy=f.ty-f.y,d=Math.hypot(dx,dy)||1;f.x+=dx/d*Math.min(d,sp*dt);f.y+=dy/d*Math.min(d,sp*dt*.6);if(Math.abs(dx)>1)f.dir=dx>0?1:-1;
    C.drawImage(bigFishSpr(f.gold?['#ffd84a','#c9a030','#fff4a0']:FISH_COL[f.ci],Math.floor(t*4+f.ph*3)%2,f.dir),Math.round(f.x)-16,Math.round(f.y+Math.sin(t*2+f.ph)*1.2)-9);if(f.gold&&Math.floor(t*6)%2){spark(Math.round(f.x+f.dir*12),Math.round(f.y-8),t+.2);spark(Math.round(f.x-f.dir*6),Math.round(f.y+6),t)}});
  C.drawImage(cached('tankFront',w,h,()=>tankFront(w,h)),0,0);
  // 你的猫：凑得很近，只露出头和肩膀；跟着鼠标左右挪（坐在目标旁边一点，爪子从侧面伸出去，不被头挡住），只够得着身前一段
  const s=1.7,bottom=h+Math.round(20*s);V.cx=V.cx??w/2;const px0=V.px??w/2,want=Math.max(w*.2,Math.min(w*.8,px0+(px0<w/2?44:-44)));V.cx+=(want-V.cx)*Math.min(1,dt*4);const catX=Math.round(V.cx);
  const aim=tankReach(V,w,h),pal=PAL[E.pal];
  if(V.tap){const a=t-V.tap.t0,p=a<.12?a/.12:a<.24?1:Math.max(0,1-(a-.24)/.16);if(a>.4)V.tap=null;else{const sx=V.tap.sx,sy=h+8,ex=Math.round(sx+(V.tap.x-sx)*p),ey=Math.round(sy+(V.tap.y-sy)*p);
    const n=Math.max(1,Math.round(Math.hypot(ex-sx,ey-sy)/3)),pts=Array.from({length:n+1},(_,i)=>[Math.round(sx+(ex-sx)*i/n),Math.round(sy+(ey-sy)*i/n)]);
    const rad=i=>Math.round(12-3*i/n);pts.forEach(([x,y],i)=>disc(x,y,rad(i)+1,rad(i)+1,pal.outline));disc(ex,ey,12,10,pal.outline);pts.forEach(([x,y],i)=>disc(x,y,rad(i),rad(i),pal.body));disc(ex,ey,11,9,pal.body);pts.forEach(([x,y],i)=>P1(x-rad(i)+2,y,pal.light||pal.body));disc(ex-3,ey-3,4,3,pal.light||pal.body);
    for(const k of[-5,0,5])R(ex+k,ey-9,1,3,pal.outline);if(a>.12&&a<.32)ring(V.tap.x,V.tap.y,Math.round(6+(a-.12)*70),'#ffffff')}}
  cat(E.pal,catX,bottom,{s,...idle(t),tilt:aim.x<catX-30?-1:aim.x>catX+30?1:0,look:aim.y<h*.55?1:0,rim:'#dffaff',mul:'#e4eef4'})}
// 爪子能碰到的位置：从肩膀起最多伸 REACH 像素
const REACH=128;
function tankReach(V,w,h){const cx=V.cx??w/2,px=V.px??cx,py=V.py??h*.5,sx=Math.round(cx+(px<cx?-1:1)*28),sy=h+8,dx=px-sx,dy=py-sy,d=Math.hypot(dx,dy)||1,k=Math.min(1,REACH/d);return{x:Math.round(sx+dx*k),y:Math.round(sy+dy*k),sx}}
/* ================= 5. 屋顶的观星毯：躺着往上看，整屏都是天 ================= */
// 银河斜着横过整屏，正中是银河的核心：一团亮的星云，外面紫、往里粉、再往里金，最里面一点白；几道暗的尘带从中间穿过去。右上一颗带环的大星。
// 满天大大小小的星，几颗彩色的亮星拖着四道芒。会动的：星星一闪一闪、星座一笔笔连上、流星（许愿）、一颗人造卫星慢慢挪过去、屋檐上的小灯。底下是屋脊和烟囱的剪影
const starsGeo=(w,h)=>({x0:Math.round(w*.1),x1:Math.round(w*.9),y0:Math.round(h*.06),y1:Math.round(h*.68),ridge:Math.round(h*.84),px:Math.round(w*.8),py:Math.round(h*.2),pr:Math.max(10,Math.round(h*.055))});
// 一团星云：几层抖动的颜色，边缘被噪声啃得毛毛糙糙
function nebula(cx,cy,rx,ry,layers,s){for(let y=Math.floor(cy-ry*1.3);y<=cy+ry*1.3;y++)for(let x=Math.floor(cx-rx*1.3);x<=cx+rx*1.3;x++){const d=Math.hypot((x-cx)/rx,(y-cy)/ry),n=NC.nz(x*.09+y*.05,s)*.5+NC.nz(x*.27-y*.13,s+1)*.3+NC.nz(y*.21,s+2)*.2,q=d-(n-.5)*.7;
  for(const [r,lv,c] of layers){if(q<r){const e=1-q/r;if(bay(x,y)<Math.min(1,e*lv+.08)){P1(x,y,c);break}}}}}
function starsBack(w,h){const G=starsGeo(w,h),k=h/300;vGrad(0,0,w,h,['#03041a','#060824','#0a0d2e','#0f1338','#151a44','#1c204e'],12);
  milky(-w*.06,h*.98,w*1.06,-h*.12,64*k,{lv:.5,s:41,n:.13,c:['#1a1f52','#283070','#3c4892'],bot:G.ridge});
  // 银河的核心：外紫、里粉、再里金、最里一点白
  const cx=Math.round(w*.38),cy=Math.round(h*.5);nebula(cx,cy,Math.round(82*k),Math.round(56*k),[[.32,1.4,'#fff0c8'],[.5,1.1,'#e8b878'],[.72,.9,'#b85a9a'],[.92,.7,'#7a3a8a'],[1.1,.55,'#4a2e7a']],43);
  // 尘带：几道暗的从核心里斜着穿过去
  for(let b=0;b<3;b++){const off=(b-1)*22*k,wd=(5+b*2)*k;for(let x=Math.round(cx-120*k);x<cx+120*k;x++){const yc=cy+off-(x-cx)*.62+Math.sin(x*.05+b)*6*k;for(let y=Math.round(yc-wd);y<=yc+wd;y++){const e=1-Math.abs(y-yc)/wd,dd=Math.hypot((x-cx)/(90*k),(y-cy)/(64*k));if(dd<1.1&&bay(x,y)<e*.8*(1.1-dd))P1(x,y,'#140c24')}}}
  // 核心里密密的小星
  for(let i=0;i<260;i++){const a=hsh(i,431)*Math.PI*2,r=Math.pow(hsh(i,432),.7),x=Math.round(cx+Math.cos(a)*r*80*k),y=Math.round(cy+Math.sin(a)*r*54*k);P1(x,y,r<.35?'#fffaf0':i%3?'#ffe8d0':'#ffffff')}
  stars(0,0,w,G.ridge,Math.round(w*G.ridge/95),603,(x,y)=>Math.hypot(x-G.px,y-G.py)<G.pr*2.6,'#0a0d2e');
  // 几颗彩色的亮星，拖着四道芒
  [[.12,.18,'#ffb0a0'],[.6,.1,'#c8d8ff'],[.9,.55,'#ffe0a0'],[.22,.7,'#a8e0ff'],[.66,.74,'#fff0e0']].forEach(([u,v,c])=>{const x=Math.round(w*u),y=Math.round(h*v),d=mixHex(c,'#0a0d2e',.45),e=mixHex(c,'#0a0d2e',.75);R(x,y,2,2,c);for(let q=1;q<=4;q++){const col=q<3?d:e;P1(x-q,y,col);P1(x+1+q,y,col);P1(x,y-q,col);P1(x+1,y+1+q,col)}});
  // 一颗带环的大星：环先画后半圈，再画星，再画前半圈
  const px=G.px,py=G.py,pr=G.pr,ring=(front)=>{for(let a=0;a<720;a++){const q=a/720*Math.PI*2,s=Math.sin(q);if(front!==(s>0))continue;for(const [rr,c] of[[2.25,'#c8b898'],[2.05,'#e8dcc0'],[1.85,'#a89878'],[1.65,'#d8c8a8']]){const x=Math.round(px+Math.cos(q)*pr*rr),y=Math.round(py+s*pr*rr*.24-Math.cos(q)*pr*rr*.2);P1(x,y,c)}}};
  ring(false);disc(px,py,pr+1,pr+1,'#2a1e2a');disc(px,py,pr,pr,'#d8a86a');const B=['#f0dcb0','#d8a86a','#e8c48a','#c8905a','#f0dcb0','#b88050'];for(let y=py-pr;y<=py+pr;y++){const hw=Math.floor(pr*Math.sqrt(Math.max(0,1-((y-py)/(pr+.5))**2))),bi=Math.floor((y-py+pr+Math.sin(y*.7)*.8)/(pr*2+1)*B.length*1.6)%B.length;
    for(let x=px-hw;x<=px+hw;x++){const lx=(x-px)/pr,ly=(y-py)/pr,sh=lx*.75+ly*.35;P1(x,y,sh>.45&&bay(x,y)<(sh-.45)*2.2?'#5a3a3a':B[bi])}}
  P1(px-Math.round(pr*.4),py-Math.round(pr*.5),'#fff8e0');ring(true);
  // 下沿：屋脊的剪影、烟囱
  for(let x=0;x<w;x+=6)disc(x+3,G.ridge-1,4,3,'#0b0c20');R(0,G.ridge,w,h-G.ridge,'#0b0c20');const chx=Math.round(w*.82);R(chx,G.ridge-34,16,34,'#0b0c20');R(chx-2,G.ridge-36,20,4,'#0b0c20')}
function starsFrame(E){const {w,h,t,V}=E,G=starsGeo(w,h);C.drawImage(cached('starsBack',w,h,()=>starsBack(w,h)),0,0);
  for(let i=0;i<30;i++)if(Math.floor(t*1.3+i*.61)%6===0)starPx(Math.floor(hsh(i,603)*w),Math.floor(hsh(i,604)*G.ridge),1,'#ffffff');
  // 人造卫星：一个小亮点慢慢挪过去（34 秒一趟）
  {const p=(t%34)/34;if(p<.45){const u=p/.45;P1(Math.round(w*(.05+u*.9)),Math.round(h*(.12+u*.3)),Math.floor(t*2)%4?'#e8ecff':'#8a90c8')}}
  // 屋檐上的一串小灯，轮着亮
  for(let i=0;i<14;i++){const x=Math.round(w*.05+i*w*.065),y=G.ridge+10+Math.round(Math.sin(i/13*Math.PI)*8),on=(i+Math.floor(t*2))%3!==0,c=on?FEST_COL[i%5]:'#3a3040';P1(x,y,c);P1(x,y+1,c)}
  const c=V.con;if(c){const K=CONS[c.i],k=t-c.t0,cw=G.x1-G.x0,ch=G.y1-G.y0,P2=K.p.map(([u,v])=>[Math.round(G.x0+u*cw),Math.round(G.y0+v*ch)]);
    P2.forEach(([x,y],i)=>{if(k>i*.12)starPx(x,y,1,'#fff8d0')});K.e.forEach(([a,b],i)=>{const q=Math.max(0,Math.min(1,(k-1.4-i*.28)/.28));if(!q)return;const [x0,y0]=P2[a],[x1,y1]=P2[b],n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
      for(let j=2;j<=n*q-2;j+=2)P1(Math.round(x0+(x1-x0)*j/n),Math.round(y0+(y1-y0)*j/n),'#9fb4ff')})}
  const s=V.star;if(s){const a=t-s.t0;if(a<1)for(let i=0;i<22;i++){const q=a*1.4-i*.012;if(q<0||bay(i,Math.floor(a*20))>1-i/22)continue;P1(Math.round(s.x+s.dx*q),Math.round(s.y+s.dy*q),i<3?'#ffffff':'#fff8d0')}}
  cat(E.pal,Math.round(w*.5),h+6,{...idle(t),look:1,rim:'#c8d4ff',mul:'#c8c8e4'})}
/* ================= 6. 屋顶的望远镜：镜筒里一轮占满的大月亮 ================= */
// 圆圆的镜筒（黄铜的边、里面一圈暗下去），月亮几乎占满：几片暗的"海"，环形山一个套一个（大坑的底上、边上还有小坑，中间一座小峰），
// 右边来光：坑里靠光的那面落着影子、对面的坑壁亮；下面一个年轻的坑往四面拉出几道亮的射纹；月亮边上淡淡一圈光。
// 会动的：偶尔一只猫的影子从月亮前面走过去、一缕薄云飘过、镜筒里的星一闪一闪。别的模块可以往上叠东西（A.vista.overlay('moon',f)），镜筒和月亮的位置见 VA.geo.moon
const moonGeo=(w,h)=>{const r=Math.round(Math.min(w,h)*.42);return{cx:Math.round(w/2),cy:Math.round(h*.47),r,mr:Math.round(r*.86)}};
// 二维的平滑噪声
const nz2=(x,y,s)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hsh(i+j*157,s),b=hsh(i+1+j*157,s),c=hsh(i+(j+1)*157,s),d=hsh(i+1+(j+1)*157,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
function moonBack(w,h){const G=moonGeo(w,h),{cx,cy,r,mr}=G;R(0,0,w,h,'#04050c');disc(cx,cy,r,r,'#070a1e');
  for(let i=0;i<70;i++){const a=hsh(i,611)*Math.PI*2,d=Math.sqrt(hsh(i,612))*r*.97;if(d<mr+4)continue;P1(Math.round(cx+Math.cos(a)*d),Math.round(cy+Math.sin(a)*d),i%3?'#a8b0e0':'#e8ecff')}
  // 月亮边上淡淡一圈光
  for(let y=cy-mr-14;y<=cy+mr+14;y++)for(let x=cx-mr-14;x<=cx+mr+14;x++){const d=Math.hypot(x-cx,y-cy);if(d>mr&&d<mr+14&&bay(x,y)<Math.pow(1-(d-mr)/14,2)*.5)P1(x,y,d<mr+5?'#5a6496':'#2c3466')}
  // 月面：底色、"海"、边上暗一圈（逐像素算，一次写进去）
  const SEA=[[-.42,-.28,.36,.3],[-.02,-.42,.22,.18],[.24,-.18,.2,.2],[.44,-.02,.13,.12],[-.55,.2,.28,.36],[-.12,.32,.22,.18],[.32,.24,.14,.18]],PC={};['#aaa69e','#c8c2b2','#e2dcca','#ece6d4','#d6d0be','#9a968e','#c4bea8'].forEach(c=>PC[c]=hexRGB(c));
  const id=C.getImageData(cx-mr,cy-mr,mr*2+1,mr*2+1),D=id.data,IW=mr*2+1;
  for(let y=cy-mr;y<=cy+mr;y++)for(let x=cx-mr;x<=cx+mr;x++){const dx=(x-cx)/mr,dy=(y-cy)/mr,d=Math.hypot(dx,dy);if(d>1)continue;
    let m=0;for(const [a,b,rx,ry] of SEA){const q=((dx-a)/rx)**2+((dy-b)/ry)**2;m=Math.max(m,1-q)}m+=(nz2(x*.08,y*.08,7)-.5)*.6+(nz2(x*.25,y*.25,8)-.5)*.25;
    let c=m>.35?'#aaa69e':m>.15?(bay(x,y)<(m-.15)*5?'#aaa69e':'#c8c2b2'):m>0?(bay(x,y)<m*5?'#c8c2b2':'#e2dcca'):'#e2dcca';
    const n=nz2(x*.5,y*.5,9);if(c==='#e2dcca'&&n>.72)c='#ece6d4';else if(c==='#e2dcca'&&n<.2)c='#d6d0be';
    if(d>.93&&bay(x,y)<(d-.93)*12)c=c==='#aaa69e'?'#9a968e':'#c4bea8';const v=PC[c],j=((y-cy+mr)*IW+(x-cx+mr))*4;D[j]=v[0];D[j+1]=v[1];D[j+2]=v[2];D[j+3]=255}
  C.putImageData(id,cx-mr,cy-mr);
  // 环形山：右边来光。坑里靠光那面一弯影子、对面的坑壁亮，外沿向光那面一道亮边；大坑里套小坑、中间一座小峰
  const crater=(x,y,cr)=>{if(Math.hypot(x-cx,y-cy)>mr-cr-1)return;const fl='#d4ceba';disc(x,y,cr,Math.max(1,Math.round(cr*.92)),fl);
    for(let q=0;q<Math.max(12,cr*9);q++){const a=q/Math.max(12,cr*9)*Math.PI*2,c=Math.cos(a-(-.35));const px=Math.round(x+Math.cos(a)*cr),py=Math.round(y+Math.sin(a)*cr*.92);P1(px,py,c>.3?'#fffaee':c<-.4?'#a49e8e':'#e8e2d0');
      if(cr>=3){const ix=Math.round(x+Math.cos(a)*(cr-1)),iy=Math.round(y+Math.sin(a)*(cr-1)*.92);if(c>.25)P1(ix,iy,'#9a9484');else if(c<-.3)P1(ix,iy,'#f4eedc')}}
    if(cr>=3)for(let j=-cr+1;j<cr;j++)for(let i=1;i<cr;i++){const q=(i*i+j*j)/(cr*cr);if(q<.82&&q>.2&&i>Math.abs(j)*.3)P1(x+i,y+Math.round(j*.92),'#bab4a2')}
    if(cr>=4&&cr<10){P1(x,y,'#fffaee');P1(x-1,y,'#a49e8e')}if(cr>=7){P1(x,y-1,'#fffaee');P1(x+1,y,'#fffaee');P1(x-1,y+1,'#a49e8e')}};
  const BIG=[[-.3,-.05,.17],[.18,.42,.15],[.48,-.38,.12],[-.62,-.3,.1],[.06,.05,.1],[-.2,.62,.11]];
  BIG.forEach(([a,b,s],i)=>{const x=Math.round(cx+a*mr),y=Math.round(cy+b*mr),cr=Math.round(s*mr);crater(x,y,cr);for(let j=0;j<3;j++){const q=hsh(i,j+621)*Math.PI*2,d=hsh(i,j+622)*cr*(j?1:.5);crater(Math.round(x+Math.cos(q)*d),Math.round(y+Math.sin(q)*d*.92),Math.max(1,Math.round(cr*(.18+hsh(i,j+623)*.18))))}});
  for(let i=0;i<70;i++){const a=hsh(i,631)*Math.PI*2,d=Math.sqrt(hsh(i,632))*mr*.94,cr=Math.max(1,Math.round(Math.pow(hsh(i,633),2.2)*mr*.07));crater(Math.round(cx+Math.cos(a)*d),Math.round(cy+Math.sin(a)*d),cr)}
  // 一个年轻的坑，往四面拉出亮的射纹
  const tx=Math.round(cx-mr*.12),ty=Math.round(cy+mr*.7);for(let rr=0;rr<16;rr++){const a=hsh(rr,641)*Math.PI*2,L=mr*(.25+hsh(rr,642)*.55);for(let s=4;s<L;s++){const x=Math.round(tx+Math.cos(a)*s),y=Math.round(ty+Math.sin(a)*s);if(Math.hypot(x-cx,y-cy)<mr-1&&bay(x,y)<.55*(1-s/L))P1(x,y,'#f6f2e6')}}crater(tx,ty,Math.max(2,Math.round(mr*.035)));disc(tx,ty,1,1,'#ffffff');
  // 镜筒：一圈黄铜，里面靠边暗一圈，外面全黑（按行算，只算圈上那几格）
  for(let y=0;y<h;y++){const dy=y-cy,ro=r+6;if(Math.abs(dy)>ro){R(0,y,w,1,'#04050c');continue}const ho=Math.floor(Math.sqrt(ro*ro-dy*dy)),x0=cx-ho,x1=cx+ho;R(0,y,Math.max(0,x0),1,'#04050c');R(x1+1,y,Math.max(0,w-x1-1),1,'#04050c');
    const ri=r-10,hi=Math.abs(dy)<ri?Math.floor(Math.sqrt(ri*ri-dy*dy)):-1;for(let x=x0;x<=x1;x++){if(hi>=0&&x>cx-hi&&x<cx+hi)continue;const d=Math.hypot(x-cx,dy);
      if(d>r+3)P1(x,y,'#7a5a24');else if(d>r+1)P1(x,y,'#c8a050');else if(d>r)P1(x,y,'#e8c878');else if(d>mr&&bay(x,y)<(d-(r-10))/10*.7)P1(x,y,'#020308')}}}
// 飘过月亮的一缕薄云：抖动着半透明，透得出后面的月亮，边上淡
function wisp(cw,ch,seed){for(let x=0;x<cw;x++){const u=x/(cw-1),env=Math.pow(Math.sin(u*Math.PI),.7),c=ch/2+(NC.nz(x/11,seed)-.5)*ch*.4,hh=ch*.5*env*(.45+NC.nz(x/6,seed+1)*.7);
  for(let y=Math.floor(c-hh);y<=c+hh;y++){const e=1-Math.abs(y-c)/(hh+.5);if(bay(x,y)<e*.75)P1(x,y,e>.55?'#585c7a':'#40445e')}if(hh>2&&bay(x,0)<.5)P1(x,Math.round(c-hh),'#9a9cb8')}}
// 走过月亮的猫的影子：侧面，尾巴翘着，四条腿一前一后（1 倍像素画的两帧）
function moonCatSpr(f,k){return spr('mcat'+f+'|'+k,Math.round(48*k),Math.round(30*k),()=>{const s=k,c='#120e1c',y0=Math.round(18*s);disc(Math.round(22*s),y0,Math.round(13*s),Math.round(6*s),c);disc(Math.round(36*s),y0-Math.round(5*s),Math.round(6*s),Math.round(5*s),c);
  for(const sd of[0,1]){const ex=Math.round((32+sd*6)*s);for(let j=0;j<Math.round(5*s);j++)R(ex-Math.round(j*.4),y0-Math.round(9*s)-Math.round(5*s)+j,Math.max(1,Math.round(j*.8)),1,c)}
  for(let j=0;j<Math.round(14*s);j++){const u=j/(14*s);R(Math.round((10-u*5+Math.sin(u*3)*2)*s),y0-Math.round(2*s)-j,2,1,c)}R(Math.round(4*s),y0-Math.round(17*s),3,2,c);
  const L=[[14,0],[18,1],[28,0],[32,1]];L.forEach(([lx,ph])=>{const sw=(ph+f)%2?2:-2;line(Math.round(lx*s),y0+Math.round(4*s),Math.round((lx+sw)*s),y0+Math.round(11*s),c);line(Math.round(lx*s)+1,y0+Math.round(4*s),Math.round((lx+sw)*s)+1,y0+Math.round(11*s),c)})})}
function moonFrame(E){const {w,h,t}=E,G=moonGeo(w,h),{cx,cy,r,mr}=G,k=h/300;C.drawImage(cached('moonBack',w,h,()=>moonBack(w,h)),0,0);
  for(let i=0;i<10;i++){const a=hsh(i,611)*Math.PI*2,d=Math.sqrt(hsh(i,612))*r*.97;if(d<mr+4)continue;if(Math.floor(t*1.4+i*.7)%5===0)starPx(Math.round(cx+Math.cos(a)*d),Math.round(cy+Math.sin(a)*d),1,'#ffffff')}
  // 一缕薄云从月亮前面飘过（23 秒一趟）
  const inTube=(s,x0,y0)=>{for(let j=0;j<s.height;j++){const y=y0+j,hw=Math.floor(Math.sqrt(Math.max(0,(r-1)*(r-1)-(y-cy)**2)));if(hw<=0)continue;const a=Math.max(x0,cx-hw),b=Math.min(x0+s.width,cx+hw);if(b>a)C.drawImage(s,a-x0,j,b-a,1,a,y,b-a,1)}};
  {const p=(t%23)/23;if(p<.62){const u=p/.62;[[1.3,16,91,0],[.9,11,97,9]].forEach(([wf,hh,sd,dy],i)=>{const cw=Math.round(mr*wf),ch=Math.round(hh*1.6*k),c=spr('mcl'+i+'|'+cw+'|'+k,cw,ch,()=>wisp(cw,ch,sd));inTube(c,Math.round(cx-r-cw+(2*r+cw)*u+i*mr*.3),Math.round(cy-mr*.3+dy*k))})}}
  // 一只猫的影子从月亮前面走过去（每 9 秒一次）：一行一行只画在月亮上
  const kk=(t%9)/9;if(kk<.6){const u=kk/.6,s=moonCatSpr(Math.floor(t*5)%2,k),sw=s.width,x0=Math.round(cx-mr-sw+u*(2*mr+sw)),y0=Math.round(cy+mr*.3);
    for(let j=0;j<s.height;j++){const y=y0+j,hw=Math.floor(Math.sqrt(Math.max(0,mr*mr-(y-cy)**2)))-1;if(hw<=0)continue;const a=Math.max(x0,cx-hw),b=Math.min(x0+sw,cx+hw);if(b>a)C.drawImage(s,a-x0,j,b-a,1,a,y,b-a,1)}}}
/* ================= 7. 澡堂的水族馆玻璃墙：一整面海 ================= */
// 远：深处的蓝、几道从顶上斜着透下来的光、淡淡的远礁；中：沙地、珊瑚、海扇、礁石、海草；近：玻璃的框和反光，玻璃前冒着热气的温泉池，池边一摞木桶，坐在池沿上的你的猫。
// 会动的：鱼群（聚成一团又散开）、几条彩色的鱼、水母（一伸一缩往上飘）、海龟、贴着沙子滑过去的鳐鱼、海草、气泡、沙上晃的光、热气、池里的小黄鸭。
// 隔 25～40 秒一条鲨鱼：先在远处横着游过去，再掉头从玻璃前擦过去，鱼群一下散开，你的猫往后一缩、毛炸起来（V.ev 里放一个 'shark'，world4-vista.js 记彩蛋、出声）。
// 伸爪碰玻璃（VA.aqTap）：爪子按在玻璃上，附近的鱼游开。
const aqGeo=(w,h)=>{const k=h/300;return{k,gy:Math.round(h*.77),py:Math.round(h*.865),sand:Math.round(h*.64),catX:Math.round(w*.45),mull:[Math.round(w*.2),Math.round(w*.8)],fw:Math.max(3,Math.round(5*k))}};
const AQ_SEA=['#3d94c4','#2f80b4','#246aa0','#1b568c','#144478','#0f3664','#0c2b54'];
// 珊瑚：一丛分叉的，枝头圆圆的
function coralBranch(x,y,len,a,dep,c){const ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len,n=Math.ceil(len);for(let i=0;i<=n;i++){const u=i/n,px=Math.round(x+(ex-x)*u),py=Math.round(y+(ey-y)*u),r=Math.max(1,Math.round((dep+1)*.7));R(px-r+1,py,r,2,c[1]);P1(px-r+1,py,c[2])}
  if(dep<=0){disc(Math.round(ex),Math.round(ey),2,2,c[1]);P1(Math.round(ex)-1,Math.round(ey)-1,c[2]);return}coralBranch(ex,ey,len*.72,a-.42-hsh(Math.round(x),dep)*.3,dep-1,c);coralBranch(ex,ey,len*.7,a+.38+hsh(Math.round(y),dep)*.3,dep-1,c)}
// 海扇：一把扇子，细细的网格，几根脉从根上散开
function seaFan(x,y,r,c){for(let j=0;j<=r;j++)for(let i=-r;i<=r;i++){const d=Math.hypot(i,j*1.15)+(NC.nz((i+40)*.4,j+7)-.5)*3;if(d>r)continue;const px=x+i,py=y-j;if(d>r-1.5)P1(px,py,c[2]);else if(((i+j)%3===0||(i-j+90)%3===0)&&bay(px,py)<.8)P1(px,py,c[1])}
  for(let v=0;v<7;v++){const a=-Math.PI*(.12+v*.126);line(x,y,Math.round(x+Math.cos(a)*r*.9),Math.round(y+Math.sin(a)*r*.78),c[0])}}
// 脑珊瑚：一个圆包，上面弯弯的纹
function brain(x,y,rx,ry,c){disc(x,y,rx+1,ry+1,c[0]);disc(x,y,rx,ry,c[1]);disc(x-Math.round(rx*.25),y-Math.round(ry*.3),Math.round(rx*.6),Math.round(ry*.5),c[2]);for(let i=-rx+2;i<rx-1;i+=3)for(let j=-ry+2;j<ry;j++)if(((i*i)/(rx*rx)+(j*j)/(ry*ry))<.8&&Math.sin(i*.9+j*.7)>.55)P1(x+i,y+j,c[0])}
function aqDeep(w,h,G){const k=G.k;vGrad(0,0,w,G.gy,AQ_SEA,12);
  // 远处的礁：一层比一层近、一层比一层暗
  [[.5,'#1f5f90',22,3],[.57,'#194e7e',30,7],[.63,'#143f6a',18,11]].forEach(([v,c,amp,s])=>{const b=Math.round(h*v);for(let x=0;x<w;x++){const t=Math.round(b-amp*k*(NC.nz(x/(26*k),s)*.8+NC.nz(x/(7*k),s+1)*.3));R(x,t,1,G.gy-t,c)}});
  for(let i=0;i<60;i++){const x=Math.floor(hsh(i,1201)*w),y=Math.floor(h*(.08+hsh(i,1202)*.45));P1(x,y,'#5aaad0')}}   // 水里漂的小颗粒
function aqMid(w,h,G){const k=G.k,S=G.sand;
  // 沙地：近玻璃的地方亮一点，几道沙纹
  for(let x=0;x<w;x++){const t=Math.round(S+Math.sin(x*.04)*2*k+NC.nz(x/9,61)*3*k);R(x,t,1,G.gy-t,'#5f8e98');P1(x,t,'#9ac4c4')}
  for(let y=S+2;y<G.gy;y+=3)for(let x=0;x<w;x++)if(Math.sin(x*.12+y*.9)>.82)P1(x,y,'#7aa8ac');dith(0,Math.round((S+G.gy)/2),w,G.gy-Math.round((S+G.gy)/2),'#527e8a',.3);
  for(let i=0;i<26;i++){const x=Math.floor(hsh(i,1211)*w),y=S+4+Math.floor(hsh(i,1212)*(G.gy-S-6)),c=['#e8d8c8','#f4a6b8','#c8b8a8','#ffd0a0'][i%4];P1(x,y,c);if(i%3===0)P1(x+1,y,c)}
  const sx=Math.round(w*.63),sy=G.gy-Math.round(7*k);for(let a=0;a<5;a++){const q=-Math.PI/2+a*Math.PI*2/5;line(sx,sy,Math.round(sx+Math.cos(q)*4*k),Math.round(sy+Math.sin(q)*3*k),'#f08a4a')}P1(sx,sy,'#ffc080');   // 海星
  // 左边一丛：大礁石、分叉的粉珊瑚、紫色的海扇、脑珊瑚、橙色的管海绵
  const rk=(x,y,rx,ry)=>{disc(x,y,rx+1,ry+1,'#16304a');disc(x,y,rx,ry,'#2c4c6a');disc(x-Math.round(rx*.3),y-Math.round(ry*.35),Math.round(rx*.55),Math.round(ry*.45),'#3e6488');P1(x-Math.round(rx*.5),y-Math.round(ry*.6),'#6a90b0')};
  rk(Math.round(w*.06),S+Math.round(10*k),Math.round(40*k),Math.round(26*k));rk(Math.round(w*.16),S+Math.round(16*k),Math.round(22*k),Math.round(14*k));
  seaFan(Math.round(w*.05),S+Math.round(4*k),Math.round(44*k),['#5a2a7a','#9a5ac8','#d8a0ff']);
  coralBranch(Math.round(w*.13),S+Math.round(4*k),14*k,-Math.PI/2-.2,4,['#7a2a4a','#e0607a','#ffa8b8']);coralBranch(Math.round(w*.2),S+Math.round(12*k),10*k,-Math.PI/2+.25,3,['#7a2a4a','#ff8a6a','#ffc0a0']);
  brain(Math.round(w*.1),G.gy-Math.round(10*k),Math.round(16*k),Math.round(9*k),['#7a5a2a','#c8a050','#e8c878']);
  [[.235,24,0],[.255,17,1],[.272,21,2]].forEach(([u,hh,i])=>{const x=Math.round(w*u),H=Math.round(hh*k),wd=Math.max(3,Math.round(5*k));for(let j=0;j<H;j++){const xx=x+Math.round(Math.sin(j*.15+i)*1.2);R(xx,G.gy-j-1,wd,1,'#c0602a');P1(xx,G.gy-j-1,'#e88a4a');P1(xx+wd-1,G.gy-j-1,'#8a3a1a')}
    const tx=x+Math.round(Math.sin(H*.15+i)*1.2);R(tx-1,G.gy-H-1,wd+2,2,'#ffa060');R(tx+1,G.gy-H-1,wd-2,1,'#3a1a10')});   // 橙色的管海绵
  // 右边一丛：高的礁石、平平的桌珊瑚、海葵、绿色的海扇
  rk(Math.round(w*.9),S+Math.round(4*k),Math.round(44*k),Math.round(40*k));rk(Math.round(w*.78),S+Math.round(18*k),Math.round(20*k),Math.round(12*k));
  const tx=Math.round(w*.88),ty=S-Math.round(30*k);R(tx-1,ty,3,Math.round(14*k),'#4a7a5a');for(let j=0;j<Math.round(4*k);j++){const hw=Math.round((16-j*2)*k);R(tx-hw,ty-j,hw*2,1,j?'#7ab070':'#a8d898')}
  seaFan(Math.round(w*.965),S-Math.round(12*k),Math.round(36*k),['#a83a3a','#e86a5a','#ffb0a0']);
  const ax=Math.round(w*.8),ay=S+Math.round(4*k);disc(ax,ay,Math.round(8*k),Math.round(4*k),'#a84a7a');for(let i=0;i<14;i++){const a=-Math.PI*(.08+i/13*.84),l=(6+hsh(i,1221)*4)*k;line(ax,ay-2,Math.round(ax+Math.cos(a)*l),Math.round(ay-2+Math.sin(a)*l),i%2?'#ffa8d8':'#f070b0')}
  coralBranch(Math.round(w*.72),G.gy-2,12*k,-Math.PI/2+.1,3,['#4a2a7a','#9a6ae0','#d0b0ff']);
  // 中间一块矮石头上一丛小珊瑚
  rk(Math.round(w*.58),G.gy-Math.round(4*k),Math.round(16*k),Math.round(8*k));coralBranch(Math.round(w*.585),G.gy-Math.round(10*k),7*k,-Math.PI/2,2,['#7a3a2a','#ffb04a','#ffe0a0'])}
// 顶上透下来的光：几道斜着的光柱（画得比画面宽一点，每帧左右晃一点）
function aqRays(w,h,G){const k=G.k;for(let r=0;r<5;r++){const x0=Math.round((w+40)*(.02+r*.2+hsh(r,1231)*.06)),wd=Math.round((18+hsh(r,1232)*22)*k);for(let y=0;y<G.sand;y++){const q=y/G.sand,xs=x0+Math.round(y*.42),f=Math.pow(1-q,1.3);
  for(let x=xs;x<xs+wd;x++){const e=1-Math.abs((x-xs)/wd-.5)*2,lv=f*e;if(bay(x,y)<lv*.42)P1(x,y,lv>.55&&bay(x+1,y)<lv*.3?'#b8ecfa':'#6cc0e4')}}}}
function aqFront(w,h,G){const k=G.k,fw=G.fw;
  // 玻璃上两道斜的反光、顶上一道框、两根竖框、下沿
  [[.06,.05],[.1,.07],[.48,.08],[.52,.1],[.86,.06]].forEach(([u,v],i)=>{const x0=Math.round(w*u),y0=Math.round(h*v),n=Math.round((i%2?14:26)*k);for(let q=0;q<n;q++)if(bay(q,i)<.6){P1(x0+q,y0+n-q*2,'#d8f4ff');if(i%2===0)P1(x0+q+1,y0+n-q*2,'#bfe8f8')}});
  R(0,0,w,fw,'#141a24');R(0,fw-1,w,1,'#3a4658');G.mull.forEach(x=>{R(x-(fw>>1),0,fw,G.gy,'#141a24');R(x-(fw>>1),0,1,G.gy,'#3a4658');R(x+(fw>>1),0,1,G.gy,'#0a0e14')});
  R(0,G.gy,w,fw,'#1c2430');R(0,G.gy,w,1,'#4a5a6e');
  // 温泉池：水面映着玻璃那边的蓝光
  const p0=G.gy+fw;R(0,p0,w,G.py-p0,'#1f5a6a');for(let y=p0;y<G.py;y++){const q=(y-p0)/(G.py-p0);for(let x=0;x<w;x++)if(bay(x,y)<.35*(1-q))P1(x,y,'#2e7a88')}
  // 池沿：一排石砖，暖暖的灯照着
  R(0,G.py,w,h-G.py,'#8a7a6a');R(0,G.py,w,2,'#d8c8b0');R(0,G.py+2,w,1,'#b8a890');for(let x=0;x<w;x+=Math.round(22*k))R(x,G.py+3,1,h-G.py-3,'#5a4a3e');R(0,G.py+Math.round(14*k),w,1,'#5a4a3e');
  // 右边池沿上一摞木桶
  const bk=(x,y,s)=>{const bw=Math.round(16*s*k),bh=Math.round(10*s*k);R(x,y-bh,bw,bh,'#4a2e1a');R(x+1,y-bh+1,bw-2,bh-1,'#c8925a');R(x+1,y-bh+1,bw-2,1,'#e8b880');R(x+2,y-bh+3,bw-4,1,'#7a5236');R(x+2,y-3,bw-4,1,'#7a5236');R(x+1,y-bh+1,2,bh-2,'#e0aa70')};
  const bx=Math.round(w*.82),by=G.py+Math.round(3*k);bk(bx,by,1);bk(bx+Math.round(17*k),by,1);bk(bx+Math.round(8*k),by-Math.round(10*k),1)}
// 小鱼（鱼群里的）：6×3，背深、肚子白、银色的身子
const AQF=[["..bbbb.","ybbbbbe","yssssss","..www.."],["y.bbbb.",".bbbbbe",".ssssss","y.www.."]];
function aqFishSpr(f,dir){return spr('aqf'+f+dir,7,4,()=>{const g=AQF[f];grid(0,0,dir>0?g:g.map(r=>[...r].reverse().join('')),{b:'#3a62a8',s:'#a8c8e0',w:'#e8f2fa',y:'#f0c040',e:'#101820'})})}
// 彩色的鱼：黄的、小丑鱼、蓝的、条纹的神仙鱼
const AQR=[{b:'#ffd84a',d:'#c8a020',l:'#fff0a0',len:12,ht:9},{b:'#ff8a2a',d:'#c85a10',l:'#ffffff',len:11,ht:6,str:1},{b:'#3a7ae8',d:'#1a3a8a',l:'#ffd84a',len:13,ht:8},{b:'#e8e0c8',d:'#3a3a4a',l:'#ffffff',len:10,ht:12,ang:1}];
function aqReefSpr(i,f,dir,k){const F=AQR[i],L=Math.round(F.len*k),H=Math.round(F.ht*k),W=L+6,HH=H+6;return spr('aqr'+i+f+dir+'|'+k,W,HH,()=>{const cx=Math.round(W/2)+1,cy=Math.round(HH/2);
  C.save();if(dir<0){C.translate(W,0);C.scale(-1,1)}
  const tx=cx-Math.round(L/2)-1;R(tx-2,cy-2-f,3,5+f*2,F.d);disc(cx,cy,Math.round(L/2)+1,Math.round(H/2)+1,OL);disc(cx,cy,Math.round(L/2),Math.round(H/2),F.b);for(let x=cx-Math.round(L/2);x<cx+Math.round(L/2);x++)P1(x,cy-Math.round(H/2)+1,F.d);
  if(F.str)for(const q of[-.15,.25])R(cx+Math.round(L*q),cy-Math.round(H/2)+1,1,H-1,F.l);if(F.ang){for(const q of[-.2,.1,.35])R(cx+Math.round(L*q),cy-Math.round(H/2),1,H,F.d);R(cx,cy-Math.round(H/2)-3,1,3,F.d);R(cx,cy+Math.round(H/2),1,3,F.d)}
  if(i===2)R(tx,cy-1,2,2,F.l);P1(cx+Math.round(L/2)-2,cy-1,'#101418');P1(cx+Math.round(L/2)-3,cy-2,'#ffffff');C.restore()})}
// 水母：一个半透明的伞，一伸一缩；底下几根飘带。p 0～1 是收缩到哪儿
function aqJellySpr(c,p,k){const q=Math.round(p*3)/3;return spr('aqj'+c+q+'|'+k,Math.round(26*k),Math.round(44*k),()=>{const C2=[['#f4a6d8','#ffd8f0','#b0609a'],['#b8a8ff','#e8e0ff','#7060c0'],['#8ae0f0','#d8f8ff','#4a90b0']][c],W=Math.round(26*k),cx=W>>1,rx=Math.round((9+q*2.5)*k),ry=Math.round((8-q*2.5)*k),cy=Math.round(10*k);
  for(let y=-ry;y<=0;y++){const hw=Math.round(rx*Math.sqrt(1-(y*y)/((ry+.5)*(ry+.5))));for(let x=-hw;x<=hw;x++){const e=Math.abs(x)/(hw+.5),top=y<-ry*.55;if(bay(cx+x,cy+y)<(top?.85:.55)+e*.2)P1(cx+x,cy+y,e>.75||y===-ry?C2[1]:C2[0])}}
  for(let x=-rx;x<=rx;x+=2)P1(cx+x,cy+1,C2[1]);for(let i=0;i<5;i++){const x0=cx-rx+Math.round((i+.5)*rx*2/5);for(let j=0;j<Math.round((18+i%2*8)*k);j++){const x=x0+Math.round(Math.sin(j*.35+i+q*3)*1.6);if(bay(x,j)<.75-j/(40*k))P1(x,cy+2+j,j%5?C2[2]:C2[0])}}
  for(let i=0;i<3;i++)R(cx-2+i*2,cy+1,1,Math.round(5*k),C2[1])})}
// 海龟：侧面，龟壳一格一格，前鳍一上一下
function aqTurtleSpr(f,k){return spr('aqt'+f+'|'+k,Math.round(46*k),Math.round(26*k),()=>{const s=k,cx=Math.round(22*s),cy=Math.round(13*s);
  const fl=f?-1:1;for(let i=0;i<Math.round(12*s);i++)R(cx+Math.round((2-i*.4)*s),cy+Math.round((2+i*fl*.55)*s),Math.round(4*s),2,'#5a7a4a');R(cx-Math.round(14*s),cy+Math.round(3*s),Math.round(5*s),Math.round(3*s),'#5a7a4a');
  disc(cx,cy,Math.round(13*s)+1,Math.round(8*s)+1,'#1e2a1a');disc(cx,cy,Math.round(13*s),Math.round(8*s),'#6a5a2a');for(let i=-2;i<=2;i++)for(let j=-1;j<=1;j++){const x=cx+Math.round(i*5*s),y=cy+Math.round(j*4*s)-1;if(((i*5)**2)/169+((j*4)**2)/64<.75){disc(x,y,Math.round(2*s),Math.round(1.5*s),'#8a7a3a');P1(x-1,y-1,'#b0a050')}}
  R(cx-Math.round(13*s),cy+Math.round(5*s),Math.round(26*s),Math.round(2*s),'#c8c090');disc(cx+Math.round(16*s),cy+Math.round(2*s),Math.round(4*s),Math.round(3*s),'#6a8a5a');P1(cx+Math.round(18*s),cy+Math.round(1*s),'#101410')})}
// 鳐鱼：贴着沙子滑，两边的翅膀一起一伏，后面拖一根细尾巴
function aqRaySpr(f,k){return spr('aqy'+f+'|'+k,Math.round(70*k),Math.round(18*k),()=>{const W=Math.round(70*k),cx=Math.round(26*k),cy=Math.round(9*k),fl=[0,-2,2][f]*k;
  for(let x=-Math.round(24*k);x<=Math.round(24*k);x++){const u=x/(24*k),hh=Math.round((1-u*u)*4*k+1),tip=Math.round(u*u*fl);R(cx+x,cy-hh+tip,1,hh*2,'#3a4a5e');P1(cx+x,cy-hh+tip,'#6a7e94');P1(cx+x,cy+hh+tip-1,'#9aaabe')}
  for(let x=Math.round(24*k);x<W-2;x++)P1(cx+x,cy+Math.round(Math.sin(x*.2)*.6),'#2a3442');P1(cx-Math.round(14*k),cy-1,'#101418')})}
// 鲨鱼：侧面。L 身长，dir 朝向，ph 尾巴摆到哪儿，hz 雾（远处淡）。按列填：背深灰蓝、肚子白，背鳍、胸鳍、尾鳍，眼睛、腮
function sharkPx(x0,y0,L,dir,ph,hz){const H=L*.22,c=q=>hz?mixHex(q,'#1b568c',hz):q,ol=c('#1a2230'),bk=c('#4e5e78'),md=c('#72849c'),bl=c('#d4dce4'),X=u=>Math.round(dir>0?x0+u*L:x0+L-u*L);
  const prof=u=>{const v=Math.pow(Math.min(1,Math.max(0,(u-.05)/.97)),1.35);return Math.max(.075,.5*Math.pow(Math.sin(Math.PI*v),.72))+(u>.93?(1-u)*.3:0)};
  const tri=(a,b,cc,col)=>{const ys=[a[1],b[1],cc[1]],y1=Math.floor(Math.min(...ys)),y2=Math.ceil(Math.max(...ys));for(let y=y1;y<=y2;y++){let xs=[];[[a,b],[b,cc],[cc,a]].forEach(([p,q])=>{if((p[1]<=y&&q[1]>y)||(q[1]<=y&&p[1]>y)){xs.push(p[0]+(y-p[1])/(q[1]-p[1])*(q[0]-p[0]))}});if(xs.length>=2){const l=Math.round(Math.min(...xs)),r=Math.round(Math.max(...xs));R(l,y,r-l+1,1,col)}}};
  const sw=Math.sin(ph)*H*.18,tp=(u,v)=>[X(u),y0+v*H];
  // 尾鳍、背鳍、胸鳍（先画，身子盖住根部）
  tri(tp(.15,-.06),tp(-.02,-.92+sw/H),tp(.05,0),ol);tri(tp(.145,-.04),tp(0,-.83+sw/H),tp(.06,-.02),bk);tri(tp(.14,.05),tp(.01,.5-sw/H*.5),tp(.06,0),ol);tri(tp(.135,.05),tp(.025,.42-sw/H*.5),tp(.065,.02),md);
  tri(tp(.6,-.4),tp(.47,-1.05),tp(.43,-.38),ol);tri(tp(.59,-.38),tp(.475,-.96),tp(.445,-.36),bk);tri(tp(.3,-.12),tp(.24,-.42),tp(.22,-.1),bk);
  for(let i=0,n=Math.round(L);i<=n;i++){const u=i/n,p=prof(u),x=X(u),top=Math.round(y0-p*H),bot=Math.round(y0+p*H*.82),mid=Math.round(y0+p*H*.12);if(bot<=top)continue;R(x,top,1,mid-top,bk);R(x,mid,1,bot-mid,bl);if(top+2<mid)P1(x,top+2,md);P1(x,mid,md);P1(x,top,ol);P1(x,bot,ol)}
  tri(tp(.66,.3),tp(.5,.95),tp(.56,.32),ol);tri(tp(.65,.32),tp(.515,.86),tp(.57,.34),md);
  for(let g=0;g<4;g++){const x=X(.74+g*.022);R(x,Math.round(y0-H*.18),1,Math.round(H*.4),c('#3a4658'))}
  const ex=X(.885),ey=Math.round(y0-H*.14),er=Math.max(1,Math.round(L/110));R(ex-er+1,ey-er+1,er,er,'#0a0c10');if(er>1)P1(ex,ey-er+1,'#ffffff');for(let i=0;i<Math.round(L*.05);i++)P1(X(.9+i/L*.6),Math.round(y0+H*.3+i*.2),ol)}
function aqSharkSpr(L,f,hz){L=Math.round(L);const W=L+4,H=Math.round(L*.5),key='aqs'+L+'|'+f+'|'+hz;return spr(key,W,H,()=>sharkPx(2,Math.round(H*.55),L,1,f*Math.PI/2,hz))}
function aqInit(V,w,h){const G=aqGeo(w,h);V.aq={G,fish:Array.from({length:42},(_,i)=>({x:w*(.3+hsh(i,1301)*.4),y:h*(.3+hsh(i,1302)*.15),vx:0,vy:0,a:hsh(i,1303)*Math.PI*2,r:.25+hsh(i,1304)*.75,sp:(.5+hsh(i,1305)*.5)*(i%3?1:-1),scare:0,dir:1,school:1})),
  reef:AQR.map((_,i)=>({x:w*(.15+i*.22),y:h*(.42+hsh(i,1311)*.15),tx:0,ty:0,sp:(9+hsh(i,1312)*6)*G.k,dir:1,scare:0,kind:i})),jelly:[0,1,2].map(i=>({x:w*(.28+i*.27),y:h*(.15+i*.18),c:i,ph:hsh(i,1321),s:i})),
  bub:[],lt:null,shark:{next:V.t0+14+Math.random()*6,t0:-99,said:0},flinch:-99,ev:[]};V.ev=V.aq.ev;V.W=w;V.H=h}
// 爪子能碰到的玻璃：从肩膀起最多伸 reach，落点总在玻璃上
function aqReach(V,w,h){const G=aqGeo(w,h),cx=G.catX,px=V.px??cx,py=V.py??G.gy*.55,sx=Math.round(cx+(px<cx?-1:1)*12*G.k),sy=h-Math.round(42*G.k),dx=px-sx,dy=Math.min(G.gy-6,py)-sy,d=Math.hypot(dx,dy)||1,kk=Math.min(1,80*G.k/d);
  return{x:Math.round(sx+dx*kk),y:Math.round(Math.min(G.gy-6,sy+dy*kk)),sx,sy}}
function aqTap(V,w,h){if(!V.aq)aqInit(V,w,h);if(V.tap&&V.t-V.tap.t0<.45)return false;const r=aqReach(V,w,h);V.tap={x:r.x,y:r.y,sx:r.sx,sy:r.sy,t0:V.t||0};
  [...V.aq.fish,...V.aq.reef].forEach(f=>{const d=Math.hypot(f.x-r.x,f.y-r.y);if(d<70*V.aq.G.k){const a=Math.atan2(f.y-r.y,f.x-r.x)+(Math.random()-.5)*.6;f.scare=1.1;f.vx=Math.cos(a)*110*V.aq.G.k;f.vy=Math.sin(a)*70*V.aq.G.k;if(f.tx!=null){f.tx=Math.max(w*.05,Math.min(w*.95,f.x+Math.cos(a)*100));f.ty=Math.max(h*.12,Math.min(V.aq.G.sand-10,f.y+Math.sin(a)*50))}}});return true}
function aqFrame(E){const {w,h,t,V}=E;if(!V.aq||V.W!==w||V.H!==h)aqInit(V,w,h);const A=V.aq,G=A.G,k=G.k,dt=Math.min(.05,A.lt==null?0:t-A.lt);A.lt=t;V.t=t;
  C.drawImage(cached('aqDeep',w,h,()=>aqDeep(w,h,G)),0,0);C.drawImage(spr('aqRays|'+w+'|'+h,w+40,G.sand,()=>aqRays(w,h,G)),Math.round(-20+Math.sin(t*.25)*4*k),0);
  // 鲨鱼：先在远处横着游过去，再掉头从玻璃前擦过去
  const SH=A.shark;if(t>SH.next&&SH.t0<0){SH.t0=t;SH.said=0}const st=SH.t0>=0?t-SH.t0:-1;
  if(st>=0&&st<4.2){const u=st/4.2,L=Math.round((64+u*22)*k/6)*6,s=aqSharkSpr(L,Math.floor(t*3)%4,.55);C.drawImage(s,Math.round(-L*1.2+(w+L*2.4)*u),Math.round(h*.4-s.height*.55))}
  C.drawImage(cached('aqMid',w,h,()=>aqMid(w,h,G)),0,0);
  // 沙上晃的光
  for(let i=0;i<26;i++){const x=Math.round((hsh(i,1401)*w+Math.sin(t*.9+i)*5*k+t*3)%w),y=G.sand+Math.round((4+hsh(i,1402)*(G.gy-G.sand-8))),l=Math.round((2+hsh(i,1403)*4)*k);if((Math.floor(t*1.6)+i)%4)R(x,y,l,1,'#b8e8e8')}
  // 海草：一节一节，跟着水晃
  [[.08,.42],[.115,.3],[.68,.36],[.705,.26],[.93,.4]].forEach(([u,hh],p)=>{const px=Math.round(w*u),H=Math.round(h*hh),b=G.gy-2;for(let j=0;j<H;j+=2){const q=j/H,sw=Math.round(Math.sin(t*1.1+j*.06+p*1.7)*6*k*q);R(px+sw,b-j,Math.max(2,Math.round(3*k)),2,p%2?'#2e7a4a':'#3a8a52');if(j%8===0){const sd=(j>>3)%2?1:-1;R(px+sw+(sd>0?Math.round(3*k):-Math.round(4*k)),b-j,Math.round(4*k),1,'#5aaa62')}}P1(px,b-H,'#7ac87a')});
  // 海龟（32 秒一趟）、鳐鱼（27 秒一趟）
  {const p=(t+5)%32;if(p<16){const s=aqTurtleSpr(Math.floor(t*1.5)%2,k);C.drawImage(s,Math.round(-s.width+(w+s.width*2)*p/16),Math.round(h*.24+Math.sin(t*.6)*5*k))}}
  {const p=(t+18)%27;if(p<11){const s=aqRaySpr(Math.floor(t*2.2)%3,k);C.drawImage(s,Math.round(w+s.width-(w+s.width*2)*p/11)-s.width,G.sand-Math.round(6*k)+Math.round(Math.sin(t*.8)*2*k))}}
  // 水母：一伸一缩往上飘，飘出顶上从底下再来
  A.jelly.forEach(j=>{const p=(t*.7+j.ph)%1,push=p<.3?(1-p/.3):0;j.y-=dt*(4+push*14)*k*(1-j.s*.2);if(j.y<-46*k){j.y=G.gy+10*k;j.x=w*(.15+Math.random()*.7)}const s=aqJellySpr(j.c,p<.3?p/.3:1-(p-.3)/.7,k*(1-j.s*.18));C.drawImage(s,Math.round(j.x+Math.sin(t*.4+j.ph*6)*6*k-s.width/2),Math.round(j.y))});
  // 鲨鱼来了：鱼群往外逃
  const close=st>=5.2&&st<7.4,shx=close?Math.round(w*1.15-(w*2.1)*(st-5.2)/2.2):null,shy=h*.36;
  if(close&&!SH.said&&st>5.6){SH.said=1;A.ev.push('shark');A.flinch=t}
  // 彩色的鱼：慢慢游，被吓到的游得快
  A.reef.forEach(f=>{if(!f.tx||Math.hypot(f.tx-f.x,f.ty-f.y)<4){f.tx=w*(.08+Math.random()*.84);f.ty=h*(.2+Math.random()*.38)}if(close&&Math.abs(f.x-shx)<120*k){f.scare=.8;f.ty=f.y<shy?h*.12:G.sand-6}
    const sp=f.scare>0?f.sp*4:f.sp;f.scare=Math.max(0,f.scare-dt);const dx=f.tx-f.x,dy=f.ty-f.y,d=Math.hypot(dx,dy)||1;f.x+=dx/d*Math.min(d,sp*dt);f.y+=dy/d*Math.min(d,sp*dt*.6);if(Math.abs(dx)>1)f.dir=dx>0?1:-1;
    const s=aqReefSpr(f.kind,Math.floor(t*4+f.kind)%2,f.dir,k);C.drawImage(s,Math.round(f.x-s.width/2),Math.round(f.y+Math.sin(t*2+f.kind)*1.5-s.height/2))});
  // 鱼群：围着一个慢慢挪的中心转，隔一阵散开、又聚拢
  const cx=w*(.5+.28*Math.sin(t*.11)),cy=h*(.33+.1*Math.sin(t*.17+1)),br=(16+30*(.5+.5*Math.sin(t*Math.PI*2/15)))*k;
  A.fish.forEach((f,i)=>{f.a+=dt*f.sp*1.1;const tx=cx+Math.cos(f.a)*br*f.r*1.7,ty=cy+Math.sin(f.a)*br*f.r*.75;if(close&&Math.abs(f.x-shx)<140*k&&f.scare<.3){const a=Math.atan2(f.y-shy,f.x-shx);f.scare=1.4;f.vx=Math.cos(a)*90*k-60*k;f.vy=(f.y<shy?-1:1)*110*k}
    const ox=f.x;if(f.scare>0){f.scare-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.97;f.vy*=.95}else{f.x+=(tx-f.x)*Math.min(1,dt*1.6);f.y+=(ty-f.y)*Math.min(1,dt*1.6)}f.y=Math.max(G.fw+4,Math.min(G.sand+6,f.y));
    if(Math.abs(f.x-ox)>.05)f.dir=f.x>ox?1:-1;C.drawImage(aqFishSpr((Math.floor(t*6)+i)%2,f.dir),Math.round(f.x)-3,Math.round(f.y)-2)});
  // 气泡：从珊瑚里一串串冒上去
  if(Math.random()<dt*4)A.bub.push({x:w*[.13,.58,.9][Math.floor(Math.random()*3)]+Math.random()*6,y:G.sand+4,r:Math.random()<.4?2:1});A.bub=A.bub.filter(b=>(b.y-=dt*30*k)>G.fw+2);
  A.bub.forEach(b=>{const x=Math.round(b.x+Math.sin(b.y*.12)*2),y=Math.round(b.y);if(b.r>1){R(x-1,y-2,3,1,'#d8f4ff');R(x-1,y+2,3,1,'#d8f4ff');R(x-2,y-1,1,3,'#d8f4ff');R(x+2,y-1,1,3,'#d8f4ff');P1(x-1,y-1,'#ffffff')}else{R(x-1,y-1,2,1,'#c8eeff');R(x-1,y+1,2,1,'#c8eeff');P1(x-2,y,'#c8eeff');P1(x+1,y,'#c8eeff')}});
  if(close){const L=Math.round(330*k),s=aqSharkSpr(L,Math.floor(t*5)%4,0);C.drawImage(s,shx-(L>>1),Math.round(shy-s.height*.55))}
  if(st>7.6){SH.t0=-1;SH.next=t+25+Math.random()*15}
  C.drawImage(cached('aqFront',w,h,()=>aqFront(w,h,G)),0,0);
  // 池水：一道道亮的波纹、热气、小黄鸭
  const p0=G.gy+G.fw;for(let i=0;i<18;i++){const x=Math.round((hsh(i,1501)*w+t*(4+hsh(i,1502)*5))%w),y=p0+2+Math.floor(hsh(i,1503)*(G.py-p0-4));R(x,y,Math.round((3+hsh(i,1504)*5)*k),1,(Math.floor(t*2)+i)%3?'#5ab8c4':'#9ae0e8')}
  {const dx=Math.round(w*.2+Math.sin(t*.3)*12*k),dy=Math.round(G.py-4*k+Math.sin(t*1.7)*1.2);disc(dx,dy,Math.round(5*k),Math.round(3*k),'#e8b020');disc(dx,dy-1,Math.round(5*k)-1,Math.round(3*k)-1,'#ffd84a');disc(dx+Math.round(3*k),dy-Math.round(4*k),Math.round(3*k),Math.round(3*k),'#ffd84a');R(dx+Math.round(6*k),dy-Math.round(4*k),Math.round(2*k),1,'#ff8a2a');P1(dx+Math.round(4*k),dy-Math.round(5*k),'#1a1a1a');R(dx-Math.round(5*k),dy+Math.round(2*k),Math.round(10*k),1,'#7ad0d8')}
  for(let i=0;i<8;i++){const u=(t*.22+hsh(i,1511))%1,x=Math.round(w*(.05+hsh(i,1512)*.9)+Math.sin(t*1.1+i)*5*k),y=Math.round(G.py-u*70*k),r=Math.round((2+u*5)*k),lv=.3*(1-u);for(let q=-r;q<=r;q++)for(let s2=-r;s2<=r;s2++)if(q*q+s2*s2<=r*r&&bay(x+q+i,y+s2)<lv*(1-(q*q+s2*s2)/(r*r+1)))P1(x+q,y+s2,'#e8f4f4')}
  // 伸爪：爪子按到玻璃上，按的地方一圈水纹
  const pal=PAL[E.pal],fl=t-A.flinch,fk=fl>=0&&fl<2.6?Math.max(0,1-fl/2.6):0,back=fl>=0&&fl<1.2?Math.round(4*k*(1-fl/1.2)):0;
  if(V.tap){const a=t-V.tap.t0,p=a<.12?a/.12:a<.28?1:Math.max(0,1-(a-.28)/.16);if(a>.46)V.tap=null;else{const sx=V.tap.sx,sy=V.tap.sy+back,ex=Math.round(sx+(V.tap.x-sx)*p),ey=Math.round(sy+(V.tap.y-sy)*p),n=Math.max(1,Math.round(Math.hypot(ex-sx,ey-sy)/3));
    for(let i=0;i<=n;i++){const x=Math.round(sx+(ex-sx)*i/n),y=Math.round(sy+(ey-sy)*i/n),r=Math.round((6-2*i/n)*k);disc(x,y,r+1,r+1,pal.outline)}for(let i=0;i<=n;i++){const x=Math.round(sx+(ex-sx)*i/n),y=Math.round(sy+(ey-sy)*i/n),r=Math.round((6-2*i/n)*k);disc(x,y,r,r,pal.body)}
    disc(ex,ey,Math.round(7*k)+1,Math.round(6*k)+1,pal.outline);disc(ex,ey,Math.round(7*k),Math.round(6*k),pal.body);disc(ex-2,ey-2,Math.round(3*k),Math.round(2*k),pal.light||pal.body);for(const q of[-4,0,4])R(ex+Math.round(q*k),ey-Math.round(6*k),1,2,pal.outline);
    if(a>.12&&a<.4)ring(V.tap.x,V.tap.y,Math.round(5+(a-.12)*60),'#d8f8ff')}}
  // 你的猫：坐在池沿上看；鲨鱼擦过去的时候往后一缩、毛炸起来
  cat(E.pal,G.catX,h-Math.round(5*k)+back,{...idle(t),s:fk>.2?1.06:1,puff:fk,earL:fk>.3?1:idle(t).earL,earR:fk>.3?1:idle(t).earR,tail:fk>.3?3:idle(t).tail,rim:'#c8f4ff',mul:'#d8e6ee'})}

/* ---------- 给 world4-vista.js 的 ---------- */
// 夜色：哪几张画面套一层（橱窗外的小店、窗边的屋里）
const KTINT={window:'#8a86c0',sky:'#b8b4e0'};
// 先画的那几张：打开特写、画面变黑的那一下里每帧调一次，画一步，画完返回 true
const L1=(key,f)=>o=>cached(key,o.w,o.h,()=>f(o.w,o.h,{}));
const STEPS={treetop:topSteps,
  aquarium:()=>[o=>{const G=aqGeo(o.w,o.h);cached('aqDeep',o.w,o.h,()=>aqDeep(o.w,o.h,G));spr('aqRays|'+o.w+'|'+o.h,o.w+40,G.sand,()=>aqRays(o.w,o.h,G))},o=>{const G=aqGeo(o.w,o.h);cached('aqMid',o.w,o.h,()=>aqMid(o.w,o.h,G));cached('aqFront',o.w,o.h,()=>aqFront(o.w,o.h,G))},
    o=>{const k=o.h/300;aqSharkSpr(Math.round(330*k),0,0);aqSharkSpr(Math.round(330*k),1,0)},o=>{const k=o.h/300;aqSharkSpr(Math.round(330*k),2,0);aqSharkSpr(Math.round(330*k),3,0)}],
  window:()=>[o=>cached('winOut',o.w,o.h,()=>winOut(o.w,o.h,{})),o=>cached('winIn',o.w,o.h,()=>winIn(o.w,o.h,{}))],
  sky:()=>[o=>cached('skyBack',o.w,o.h,()=>skyBack(o.w,o.h,{})),o=>cached('skyRoom',o.w,o.h,()=>skyRoom(o.w,o.h,{tod:'night'}))],
  stars:()=>[o=>cached('starsBack',o.w,o.h,()=>starsBack(o.w,o.h))],moon:()=>[o=>cached('moonBack',o.w,o.h,()=>moonBack(o.w,o.h))],tank:()=>[o=>{cached('tankBack',o.w,o.h,()=>tankBack(o.w,o.h));cached('tankFront',o.w,o.h,()=>tankFront(o.w,o.h))}]};
function prep(kind,w,h){const f=STEPS[kind];if(!f||!w||!h)return true;const o=TINT;TINT=KTINT[kind]||null;try{return stepB(build(kind,w,h,f))}finally{TINT=o}}
return{get tint(){return TINT},set tint(v){TINT=v},tctx,lit,mulHex,CONS,KTINT,prep,cat,idle,aqTap,aqReach,
  draw:{window:winFrame,sky:skyFrame,treetop:topFrame,tank:tankFrame,stars:starsFrame,moon:moonFrame,aquarium:aqFrame},geo:{tank:tankGeo,sky:skyGeo,stars:starsGeo,treetop:topGeo,aquarium:aqGeo,moon:moonGeo},tankReach}})();
