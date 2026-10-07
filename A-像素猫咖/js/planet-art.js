/* 1024 猫咖 · 猫猫星球的画法（设计见 docs/店内设计.md 第四节"猫猫星球"、第八节"看风景"）。依赖 scene-kit.js（R、P1、disc、line、alpha、txt、use、glowTex、OL）、world-kit.js（hsh）；运行时用 world-play.js 的 PAL。
   地图在 map-planet.js，玩法在 world-rocket.js，这里只管画；只露出一个全局名 PLA。和店里一样：一个像素一格、深色描边、抖动过渡，不放大、不用平滑的线。
   - 店里：纸箱火箭（纸箱身子、漏斗尖头、烟花筒发动机，侧面马克笔写着 1024，窗口里是你的猫）、发射台（平时盖着帆布）、吧台上的漏斗、那筒没放出去的烟花
   - 星球表面：天（星云、星星）、地球（一个小金点是巨树的树冠）、横过天空的毛线环、地平线上两座耳朵山、紫色的地面和陨石坑、水晶、水晶鱼、大毛线团、旗子、蹦蹦坑
   - 猫猫星球这颗球（紫色、两只耳朵、一圈毛线环）按半径逐像素画好存起来，特写里一帧贴一张；望远镜里划过去的那颗小的也是它
   - 飞的那段特写（flight）：屋顶 → 街灯变小 → 穿过云 → 星星往后飞 → 毛线球月亮 → 越来越大的猫猫星球；回来倒着放
   不动的都画一次存成图。PLA.live 是 world-rocket.js 每帧填的状态（火箭在哪、飞到哪了），地图上的东西照着它画。 */
const PLA=(()=>{
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c};
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],bay=(x,y)=>(BAY[(y&3)*4+(x&3)]+.5)/16;
const rgb=h=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]};
const C32={},c32=h=>C32[h]||(C32[h]=(()=>{const [r,g,b]=rgb(h);return(255<<24|b<<16|g<<8|r)>>>0})());
const cl=(v,a=0,b=1)=>v<a?a:v>b?b:v,sm=k=>{k=cl(k);return k*k*(3-2*k)};
// 逐像素画一张图：f(u,W,H)，u 是 Uint32 的像素（写 c32(颜色)）
function pix(W,H,f){W=Math.ceil(W);H=Math.ceil(H);const cv=mk(W,H),x=cv.getContext('2d'),im=x.createImageData(W,H),u=new Uint32Array(im.data.buffer);f(u,W,H);x.putImageData(im,0,0);return cv}
// 用 R、disc 这些画一张图
function paint(W,H,f){const cv=mk(W,H),o=C;use(cv.getContext('2d'));try{f()}finally{use(o)}return cv}
// 值噪声 0～1
const vn=(x,y,s,sd=0)=>{const X=Math.floor(x/s),Y=Math.floor(y/s),fx=x/s-X,fy=y/s-Y,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hsh(X+sd*131,Y),b=hsh(X+1+sd*131,Y),c=hsh(X+sd*131,Y+1),d=hsh(X+1+sd*131,Y+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
const lv=(pal,L,b)=>pal[cl(Math.floor(L*(pal.length-1)+b),0,pal.length-1)];   // 按亮度挑颜色（b 是抖动）
// 三角形：点在不在里面、点到边的距离
const side=(p,a,b)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),inT=(p,A,B,T)=>{const s1=side(p,A,B),s2=side(p,B,T),s3=side(p,T,A);return(s1>=0&&s2>=0&&s3>=0)||(s1<=0&&s2<=0&&s3<=0)},dE=(p,A,B)=>Math.abs(side(p,A,B))/Math.hypot(B[0]-A[0],B[1]-A[1]);

/* ---------- 颜色 ---------- */
const GND=['#1c1234','#281a46','#36245a','#46306e','#583e84','#6c4e9a','#8262b2','#9c7cc8'];   // 地面，从暗到亮
const SKY=['#04030e','#070518','#0a0822','#0e0b2c','#140f38','#1b1344','#24184f','#2e1d5a','#3a2264'];
const NEB=['#2a1450','#46206a','#6a2c7c','#8e3c88','#2a3a7a','#2a5a8a'];
const EAR=['#3c2c66','#4c3a7c','#5e4a92','#7260a8','#8a78be'],EIN=['#8a4a7a','#a85c92','#c878ac','#e49cc8'];
const CY=['#14507a','#2a8ac0','#5ac8f0','#a8f0ff','#f0ffff'],PK=['#7a2a62','#b04a8a','#e078b8','#ffb0e0','#fff0fa'],GD=['#8a5a10','#c8901e','#ffd84a','#fff0a0','#fffbe0'];
const YN=['#6a2442','#9a3a60','#c85a82','#ec88a8','#ffb8cc','#ffe0ea'];   // 毛线（粉色：天上那圈环、大毛线团是同一根线）
const PAPER=['#6a4424','#8a5a32','#b07a44','#d09a5a','#e8bc7c'];          // 纸箱
const TIN=['#3a3e4c','#5c6272','#8a90a2','#bcc2d0','#eef2f8'];             // 漏斗（铁皮）

/* ================= 星球表面 ================= */
const HZ=x=>262+(x-480)*(x-480)/6000;   // 地平线（离这一层顶上有多高）：中间高、两头低——星球很小，看得出是圆的
// 底：天（从上往下变亮的深紫、一条斜着的星云、不会动的星星）、地面（近处深、远处被一层薄雾冲淡，斑块、一道道沙纹和碎石）
function floorBase(){return pix(960,540,u=>{const S=SKY.map(c32),G=GND.map(c32),NP=['#2a1450','#4a2070','#7a3088','#b0509a'].map(c32),NB=['#1a2058','#20407a','#2a6a90'].map(c32),st=['#fff8ec','#c8d8ff','#ffe8a8','#ffc8f0'].map(c32),rim=c32('#d8b8ff'),rim2=c32('#a888d8'),glow=c32('#4a2a6a');
  for(let y=0;y<540;y++)for(let x=0;x<960;x++){const i=y*960+x,h0=HZ(x),b=bay(x,y);
    if(y<h0){const v=y/h0;u[i]=S[cl(Math.floor(v*(S.length-1)+b),0,S.length-1)];
      // 星云：从左上斜着往右下一条宽带（粉紫），右上角一团青蓝；浓的地方颜色一档档抖动过渡
      const m=Math.exp(-Math.pow((y-(20+x*.17))/58,2))*(vn(x,y,80,3)*.55+vn(x,y,26,5)*.3+vn(x,y,9,7)*.15),q=Math.exp(-Math.pow((x-860)/120,2)-Math.pow((y-40)/70,2))*(vn(x,y,40,9)*.7+vn(x,y,12,4)*.3);
      const lp=(m-.26)*9+b-.5,lb=(q-.25)*6+b-.5;if(lp>=1)u[i]=NP[cl(Math.floor(lp)-1,0,3)];else if(lb>=1)u[i]=NB[cl(Math.floor(lb)-1,0,2)];
      if(h0-y<9&&b<(1-(h0-y)/9)*.75)u[i]=glow;
      if(hsh(x*3+1,y*7+2)<.0018+.004*m)u[i]=st[Math.floor(hsh(x,y+9)*4)];continue}
    const d=y-h0;if(d<1){u[i]=rim;continue}if(d<2){u[i]=rim2;continue}
    const far=cl(1-d/110),n=vn(x,y*2.4,50,11)*.55+vn(x,y*2.4,15,13)*.45,big=vn(x,y*2.2,170,17),rip=Math.sin((x*.05+y*.35)+vn(x,y,40,15)*6)>.93?.1:0,L=.34+(n-.5)*.45+(big-.5)*.3+far*.3+rip-cl((d-150)/240)*.12;
    let c=G[cl(Math.floor(L*(G.length-1)+b-.5),0,G.length-1)];const s=hsh(x+5,y*3);if(s<.008)c=G[1];else if(s<.013)c=G[6];u[i]=c}})}
// 陨石坑：光从左上来——坑沿高出一圈（左上亮、右下有影子），坑里左上一弯暗、右下一弯亮，坑底居中
function crater(cx,cy,rx,ry){const G=GND;disc(cx+1,cy+1,rx+2,ry+1,G[2]);disc(cx,cy,rx+2,ry+1,G[5]);disc(cx,cy,rx,ry,G[4]);disc(cx-1,cy-Math.max(1,Math.round(ry*.25)),Math.max(1,rx-1),Math.max(1,ry-1),G[1]);
  disc(cx+Math.max(1,Math.round(rx*.15)),cy+Math.max(0,Math.round(ry*.2)),Math.max(1,Math.round(rx*.6)),Math.max(1,Math.round(ry*.5)),G[3]);if(rx>6)P1(cx-rx-1,cy-1,G[7])}
function rock(x,y,s){const h=Math.max(1,Math.round(s*.7));disc(x,y,s+1,h+1,OL);disc(x,y,s,h,GND[3]);disc(x-1,y-1,Math.max(1,s-2),Math.max(1,h-2),GND[5]);P1(x-Math.round(s*.4),y-Math.round(h*.5),GND[7])}
// 一根水晶：(x,y) 底，h 高，pal 颜色，lean 歪一点，lit 亮一档；亮的一面在左
function spike(x,y,h,pal,lean=0,lit=0){const w=Math.max(2,Math.round(h/4)),hw=j=>{const k=j/h;return Math.max(0,Math.round(w*(1-k*k)*.9+(k>.85?0:.4)))},X=j=>Math.round(x+lean*j/h),q=n=>pal[Math.min(pal.length-1,n+lit)];
  for(let j=0;j<h;j++)R(X(j)-hw(j)-1,y-j,2*hw(j)+3,1,OL);P1(X(h),y-h,OL);
  for(let j=1;j<h;j++){const a=hw(j),cx=X(j);if(a<1){P1(cx,y-j,q(3));continue}R(cx-a,y-j,a,1,q(2));R(cx,y-j,a+1,1,q(1));P1(cx-a,y-j,q(3))}}
function crystalTuft(x,y,pal,s=1,lit=0){spike(x,y,Math.round(9*s),pal,-1,lit);spike(x+3,y+1,Math.round(13*s),pal,1,lit);spike(x+7,y,Math.round(7*s),pal,2,lit)}

// 漂在半空的石头岛：上面平一点、长着水晶，底下尖尖地垂着几块碎石；s 大小，cr 水晶的颜色（存成图）
const FLR={};
function floatRockImg(s,cr,seed){const k=s+'|'+seed;if(FLR[k])return FLR[k];const W=s*4+8,H=s*4+8,cx=Math.round(W/2),cy=Math.round(s*1.6)+2;
  const cv=paint(W,H,()=>{const B=[[0,0,s*1.6,s*.7],[-s*.6,s*.5,s*.9,s*.8],[s*.5,s*.6,s*.9,s*.7],[0,s*1.3,s*.6,s*.8],[s*.1,s*2,s*.3,s*.6]].map(([a,b,rx,ry])=>[Math.round(cx+a),Math.round(cy+b),Math.max(1,Math.round(rx)),Math.max(1,Math.round(ry))]);
    B.forEach(([x,y,rx,ry])=>disc(x,y,rx+1,ry+1,OL));B.forEach(([x,y,rx,ry],i)=>disc(x,y,rx,ry,i?GND[2]:GND[4]));B.slice(1).forEach(([x,y,rx,ry])=>disc(x-1,y-1,Math.max(1,rx-2),Math.max(1,ry-2),GND[3]));
    disc(cx-1,cy-1,Math.max(1,Math.round(s*1.3)),Math.max(1,Math.round(s*.45)),GND[5]);R(cx-Math.round(s*1.1),cy-Math.round(s*.6),Math.round(s*1.2),1,GND[7]);
    for(let i=0;i<3;i++){const x=Math.round(cx+(hsh(i,seed)-.5)*s*1.8),y=Math.round(cy+s*1.4+hsh(i,seed+1)*s*1.2);disc(x,y,1,1,OL);P1(x,y,GND[3])}
    spike(cx-Math.round(s*.4),cy,Math.round(s*1.1),cr,-1);spike(cx+Math.round(s*.2),cy+1,Math.round(s*1.5),cr,1);spike(cx+Math.round(s*.8),cy,Math.round(s*.8),cr,2)});
  return FLR[k]={cv,cx,cy}}
function floatRock(x,y,s,cr,seed){const I=floatRockImg(s,cr,seed);C.drawImage(I.cv,Math.round(x)-I.cx,Math.round(y)-I.cy)}
// 前景：最下面一道暗石脊，几簇水晶的剪影，尖上亮着
function foreRidge(X,Y,W){const base=Y;for(let x=X;x<X+W;x++){const h=Math.round(6+vn(x,0,26,51)*14+vn(x,0,7,53)*5);R(x,base-h,1,h+40,'#120a22');if(vn(x,0,26,51)>.62)P1(x,base-h,'#2a1c44')}
  for(let i=0;i<9;i++){const x=Math.round(X+30+hsh(i,55)*(W-60)),h=8+Math.round(hsh(i,56)*16),pal=[CY,PK,GD][i%3];for(let j=0;j<h;j++){const w=Math.max(0,Math.round(2.4*(1-j/h)));R(x-w,base-6-j,2*w+1,1,'#120a22')}P1(x,base-6-h,pal[3]);P1(x,base-5-h,pal[2])}}

/* ---------- 天上：毛线环、两座耳朵山、地球（都存成图，店里每帧贴一次） ---------- */
// 毛线环：一个很扁的大椭圆，最高的地方在头顶，两头落到耳朵山后面去；一根两股拧在一起的粉毛线
const RING={cx:480,cy:468,rx:640,ry:330,th:12};
let RINGC=null;
function ringArc(){if(RINGC)return RINGC;const {cx,cy,rx,ry,th}=RING,Y0=110,H=200,P=YN.map(c32),ol=c32('#3a1630');
  const cv=pix(960,H,u=>{for(let j=0;j<H;j++)for(let x=0;x<960;x++){const y=j+Y0;if(y>=HZ(x)-1)continue;const X=(x-cx)/rx,Yv=(y-cy)/ry,rho=Math.hypot(X,Yv);if(rho<.9||rho>1.1)continue;
    const gx=X/(rx*rho),gy=Yv/(ry*rho),d=(rho-1)/Math.hypot(gx,gy),a=d/(th/2);if(Math.abs(a)>1)continue;
    if(Math.abs(a)>.84){u[j*960+x]=ol;continue}const s=Math.atan2(Yv,X)*(rx+ry)/2,ph=((s/9+a*.9)%1+1)%1,q=(ph%.5)/.5,L=.18+.62*Math.sin(q*Math.PI)-a*.16;u[j*960+x]=lv(P,L,bay(x,y)-.4)}});
  return RINGC={cv,y0:Y0}}
// 两座耳朵山：远处的两只大猫耳朵——外沿鼓出来、内沿收进去，耳尖往外偏；里面一片粉，耳根长着一绺绺往上翘的长毛；底下埋在地平线后面（按地平线裁掉）
// 每只耳朵：o 外侧的底角、i 里侧的底角、t 耳尖，co/ci 两条边的弯（二次曲线的控制点）
const EARS=[{o:[34,304],i:[296,304],t:[146,98],co:[46,160],ci:[236,196]},{o:[930,304],i:[668,304],t:[812,110],co:[918,168],ci:[730,200]}];
const qx=(a,c,b,y)=>{let lo=0,hi=1;for(let n=0;n<22;n++){const m=(lo+hi)/2,yy=(1-m)*(1-m)*a[1]+2*(1-m)*m*c[1]+m*m*b[1];if((yy>y)===(a[1]>b[1]))lo=m;else hi=m}const m=(lo+hi)/2;return(1-m)*(1-m)*a[0]+2*(1-m)*m*c[0]+m*m*b[0]};
let EARC=null;
const lerp2=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
function earsImg(){if(EARC)return EARC;const E=EAR.map(c32),I=EIN.map(c32),ol=c32('#2a1c44'),hz=c32('#7a6aa8');
  const cv=pix(960,210,u=>{for(const e of EARS){const L=e.o[0]<e.i[0],H=304-e.t[1];
    // 里面粉的那一片：同样的形状往里缩一圈，偏向里侧
    const io=lerp2(e.o,e.i,.3),ii=lerp2(e.o,e.i,.93),it=lerp2(e.t,lerp2(e.o,e.i,.6),.16),ico=lerp2(e.co,e.ci,.35),ici=lerp2(e.ci,e.i,.15);
    for(let y=Math.ceil(e.t[1]);y<304;y++){const j=y-100,xo=qx(e.o,e.co,e.t,y),xi=qx(e.i,e.ci,e.t,y),x0=Math.round(Math.min(xo,xi)),x1=Math.round(Math.max(xo,xi)),s=(304-y)/H;
      const inR=y>it[1]?[qx(io,ico,it,y),qx(ii,ici,it,y)].sort((a,b)=>a-b):null;
      for(let x=x0;x<=x1;x++){if(y>=HZ(x))continue;const k=j*960+x,b=bay(x,y),ed=Math.min(x-x0,x1-x),f=(x-x0)/Math.max(1,x1-x0),haze=cl((.35-s)/.35);
        if(ed<1||y-e.t[1]<1){u[k]=ol;continue}
        if(inR&&x>=inR[0]&&x<=inR[1]){const ei=Math.min(x-inR[0],inR[1]-x);u[k]=ei<1.5?E[1]:lv(I,.9-s*.45+(vn(x,y,8,25)-.5)*.2-(ei<4?.15:0),b-.4);continue}
        u[k]=ed<3&&f<.5?E[4]:lv(E,.62-f*.38-haze*.15+(vn(x,y,10,21)-.5)*.2,b-.4);if(haze>.5&&b<(haze-.5)*.9)u[k]=hz}}}});
  // 耳根的长毛：粉的那一片底下冒出来几簇，往上翘、往外弯
  const o=C;use(cv.getContext('2d'));for(const e of EARS){const L=e.o[0]<e.i[0],sg=L?-1:1;for(let n=0;n<6;n++){const bx=lerp2(e.o,e.i,.42+n*.09)[0],by=Math.min(300,HZ(bx))-1;
    for(let m=0;m<4;m++){const hgt=22+hsh(n*7+m,77)*34,lean=(m-1.5)*3;for(let k=0;k<hgt;k++){const q=k/hgt,x=Math.round(bx+lean+sg*(Math.sin(q*1.8)*6+q*q*14)),y=Math.round(by-k);if(y>=HZ(x)-1)continue;
      const c=q<.6?'#ece2fa':q<.85?'#c8b8e8':'#9a88c8';R(x,y-100,q<.5?2:1,1,c)}}}}use(o);
  return EARC={cv,y0:100}}
// 地球：海、大陆、云；左边亮，右边是夜里，夜里那一半亮着城市的灯；一个小金点是巨树的树冠（金点每帧另画，会闪）
const ERTH={},GOLD={u:.4,v:-.22};
function earthImg(r){if(ERTH[r])return ERTH[r];const W=2*r+5,cx=r+2,cy=r+2,O=['#0e2448','#163a6e','#20589a','#3a7ac0'].map(c32),Lg=['#1e3a26','#2f6a3c','#4a8a4e','#7ab86a'].map(c32),cw=c32('#eef4ff'),cg=c32('#b8c8e8'),at=c32('#8ad8ff'),at2=c32('#3a8ad0'),ol=c32('#0a1428'),lt=c32('#ffd88a');
  const cv=pix(W,W,u=>{for(let j=0;j<W;j++)for(let i=0;i<W;i++){const X=(i-cx+.5)/r,Y=(j-cy+.5)/r,d2=X*X+Y*Y,b=bay(i,j),k=j*W+i;
    if(d2>1){const d=Math.sqrt(d2);if(d<1+1.6/r&&X<.35)u[k]=d<1+.8/r?at:at2;continue}if(d2>1-2.2/r&&X>.1){u[k]=ol;continue}
    const Z=Math.sqrt(1-d2),lum=-X*.85-Y*.2+Z*.25,lon=Math.atan2(X,Z)+.6,lat=Math.asin(Y),land=vn(lon*14+40,lat*14+40,3.2,4)*.7+vn(lon*30,lat*30,3,6)*.3,cloud=vn(lon*20+9,lat*30,3.5,9),L=cl(lum*.7+.42);
    let c=land>.55?lv(Lg,L,b-.5):lv(O,L,b-.5);if(cloud>.74&&L>.3)c=L>.55?cw:cg;if(L<.32&&land>.55&&hsh(i*9,j*5)<.3)c=lt;u[k]=c}});
  return ERTH[r]={cv,cx,cy}}
function earth(cx,cy,r,t){const E=earthImg(r);C.save();C.globalCompositeOperation='lighter';C.globalAlpha=.2;C.drawImage(glowTex(r+12,'#6ac0ff'),cx-r-12,cy-r-12);C.restore();C.drawImage(E.cv,cx-E.cx,cy-E.cy);
  const gx=Math.round(cx+GOLD.u*r),gy=Math.round(cy+GOLD.v*r),on=Math.floor(t*2.2)%3;C.save();C.globalCompositeOperation='lighter';C.globalAlpha=on?.9:.5;C.drawImage(glowTex(6,'#ffc840'),gx-6,gy-6);C.restore();
  R(gx,gy,2,2,'#ffd84a');P1(gx,gy,'#fff8c0');if(on){P1(gx-1,gy,'#e8a020');P1(gx+2,gy+1,'#e8a020');P1(gx+1,gy-1,'#e8a020');P1(gx,gy+2,'#e8a020')}}

/* ---------- 星球表面上的东西 ---------- */
// 水晶鱼池（大肉垫形状的坑，装着会发光的水）：坑沿在底图里，这里每帧画水面（一圈圈慢慢晃开的光）
function lake(cx,cy,rx,ry,t){disc(cx,cy,rx,ry,'#123a5a');disc(cx,cy,rx-2,ry-1,'#1a5a82');
  for(let i=0;i<3;i++){const k=(t*.25+i/3)%1,a=Math.round(rx*(.25+k*.7)),b=Math.max(1,Math.round(ry*(.25+k*.7)));if(k>.85)continue;
    for(let q=0;q<a*3;q++){const g=q/(a*3)*Math.PI*2,x=Math.round(cx+Math.cos(g)*a),y=Math.round(cy+Math.sin(g)*b);if(bay(x,y)<.6)P1(x,y,k<.4?'#5ac8f0':'#2a8ac0')}}
  for(let i=0;i<14;i++){const a=hsh(i,71)*Math.PI*2,r=Math.sqrt(hsh(i,72))*.85,x=Math.round(cx+Math.cos(a)*rx*r),y=Math.round(cy+Math.sin(a)*ry*r);P1(x,y,(Math.floor(t*2+hsh(i,73)*8))%5===0?'#e0fcff':'#7ae8ff')}}
// 一条水晶鱼：x,y 中心，dir 1 朝右；ang 头往上翘（-1～1）；gold 金色的那条
function fish(x,y,dir,ang,gold,t){x=Math.round(x);y=Math.round(y);const pal=gold?GD:CY,d=dir>=0?1:-1,o=(a,b)=>[x+a*d,y+b-Math.round(a*ang*.6)];
  const B=[[-3,0],[-2,0],[-1,0],[0,0],[1,0],[2,0],[-2,-1],[-1,-1],[0,-1],[1,-1],[-2,1],[-1,1],[0,1],[1,1],[-1,-2],[0,-2],[-4,-1],[-4,1],[-5,-2],[-5,2]];
  B.forEach(([a,b])=>{const [px,py]=o(a,b);R(px-1,py-1,3,3,'#0c2a44')});B.forEach(([a,b])=>{const [px,py]=o(a,b);P1(px,py,a<-3?pal[2]:b<0?pal[3]:b>0?pal[1]:pal[2])});
  const [ex,ey]=o(2,-1);P1(ex,ey,'#0c2a44');if(Math.floor(t*6)%2){const [sx,sy]=o(0,-2);P1(sx,sy-1,pal[4])}}
// 大毛线团：半埋在地里，r 半径；spin 扯线头时转一点
const YB={};
function yarnGiantImg(r,f){const k=r+'|'+f;if(YB[k])return YB[k];const W=2*r+3,cx=r+1,P=YN.map(c32),ol=c32('#3a1630'),ph=f/8,axes=[[.2,.95,.24],[.92,.15,.36],[-.5,.6,.62],[.6,-.3,.74]];
  const cv=pix(W,W,u=>{for(let j=0;j<W;j++)for(let i=0;i<W;i++){const X=(i-cx+.5)/r,Y=(j-cx+.5)/r,d2=X*X+Y*Y;if(d2>1)continue;if(d2>1-2.4/r){u[j*W+i]=ol;continue}
    const Z=Math.sqrt(1-d2),lum=-X*.55-Y*.6+Z*.58,pat=vn(X*3+5,Y*3+5,1,17),ax=axes[pat<.3?0:pat<.55?1:pat<.8?2:3];
    // 一圈圈绕上去的线：法线和这一片绕线轴的点积，分成一条条
    const s=(X*ax[0]+Y*ax[1]+Z*ax[2])*r/2.4+ph*(pat<.55?1:-1),fr=((s%1)+1)%1;u[j*W+i]=lv(P,cl(lum*.5+.48)+(fr<.18?-.28:fr>.7?.08:0),bay(i,j)-.4)}});
  return YB[k]={cv,cx}}
function yarnGiant(cx,cy,r,spin){const I=yarnGiantImg(r,((Math.floor(spin*8)%8)+8)%8);disc(cx+2,cy+Math.round(r*.8),Math.round(r*1.05),Math.round(r*.22),'#1c1234');
  C.save();C.beginPath();C.rect(cx-r-2,cy-r-2,2*r+4,Math.round(r*1.8)+2);C.clip();C.drawImage(I.cv,cx-I.cx,cy-I.cx);C.restore();
  for(let x=-r;x<=r;x++)R(cx+x,cy+Math.round(r*.8+Math.sin(x*.7)*1.2),1,x*x<r*r*.8?2:1,GND[x<0?5:3])}   // 埋进土里的那一圈
// 线头：从毛线团底下拖出来的一截，末端在 (x1,y1)；pull 0～1 刚被扯过
function yarnEnd(x0,y0,x1,y1,t,pull){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)),w=pull>0?Math.sin(t*14)*pull*3:0;
  for(let i=0;i<=n;i++){const k=i/n,x=Math.round(x0+(x1-x0)*k),y=Math.round(y0+(y1-y0)*k+Math.sin(k*9+t*1.5)*1.5*(1-k*.5)+Math.sin(k*Math.PI)*w);P1(x,y+1,'#3a1630');P1(x,y,i%3?YN[3]:YN[4])}
  const ex=Math.round(x1),ey=Math.round(y1+Math.sin(t*1.3));R(ex-1,ey-1,3,3,'#3a1630');P1(ex,ey,YN[4]);P1(ex+1,ey-2,YN[3]);P1(ex+2,ey-3,YN[3])}
// 旗子：(x,y) 旗杆底；col 旗面（你的项圈色），paw 爪印（你的毛色）。没有风，旗面是毛线织的、撑开的，低重力里慢慢晃
function flag(x,y,t,col,paw){R(x,y-26,1,26,'#d8d4e0');R(x+1,y-26,1,26,'#8a8496');P1(x,y-27,'#ffd84a');P1(x+1,y-27,'#ffd84a');
  for(let j=0;j<12;j++){const w=14-Math.round(j*.3),off=Math.round(Math.sin(t*1.4+j*.35)*1.2);R(x+2,y-25+j,w+off,1,j===0||j===11?OL:col);P1(x+2+w+off,y-25+j,OL)}
  const px=x+7+Math.round(Math.sin(t*1.4)*.6),py=y-20;R(px,py+2,4,3,paw);P1(px-1,py,paw);P1(px+1,py-1,paw);P1(px+3,py-1,paw);P1(px+5,py,paw);R(x-3,y,8,2,OL);R(x-2,y,6,1,GND[5])}
// 蹦蹦坑：一个浅坑，坑底一圈会发光的弹力苔（pulse 刚蹦过，亮一下）
function bouncePad(cx,cy,t,pulse){const a=Math.sin(t*2.2)>0;for(let q=0;q<64;q++){const g=q/64*Math.PI*2,x=Math.round(cx+Math.cos(g)*20),y=Math.round(cy+Math.sin(g)*7);if(bay(x,y)<.55+.4*pulse)P1(x,y,pulse>.3?'#fff0fa':a?'#e078b8':'#b04a8a')}
  for(let i=0;i<9;i++){const g=hsh(i,81)*Math.PI*2,r=Math.sqrt(hsh(i,82))*.7;P1(Math.round(cx+Math.cos(g)*20*r),Math.round(cy+Math.sin(g)*7*r),(Math.floor(t*3+i)%4)?'#e078b8':'#ffb0e0')}}
// 一簇会唱歌的水晶：五根，高矮不一；lit[i] 0～1 刚被敲响
const SING=[{dx:0,h:22,pal:CY,l:-1},{dx:7,h:30,pal:PK,l:1},{dx:14,h:18,pal:CY,l:2},{dx:-7,h:15,pal:PK,l:-2},{dx:20,h:12,pal:GD,l:1}];
function singCrystals(x,y,t,lit){SING.map((s,i)=>i).sort((a,b)=>SING[b].h-SING[a].h).forEach(i=>{const s=SING[i],L=lit[i]||0;spike(x+s.dx,y+(i%2)-(L>.5?1:0),s.h,s.pal,s.l,L>.2?1:0)})}

/* ---------- 店里的：纸箱火箭、发射台、漏斗、没放出去的烟花 ---------- */
// 窗口里你的猫：一张小脸（k=1 店里那么大，k=2 特写里那么大）
function catFace(x,y,w,h,pal,k,blink){const c=PAL[pal]||PAL[0],ol=c.outline||OL,mask=c.points||c.body,eye=c.eye||'#241a2e',fx=x+Math.floor(w/2),fy=y+h-1;R(x,y,w,h,'#2a1a14');
  if(k===1){R(x,y+1,w,h-1,c.body);R(fx-1,y+2,3,2,mask);P1(x+1,y,ol);P1(x+w-2,y,ol);P1(x+1,y+1,'#f4a6b8');P1(x+w-2,y+1,'#f4a6b8');if(!blink){P1(fx-2,y+2,eye);P1(fx+2,y+2,eye)}P1(fx,y+3,'#f4a6b8');return}
  R(fx-6,fy-7,13,8,ol);R(fx-5,fy-6,11,7,c.body);R(fx-5,fy,11,1,c.shade||c.body);
  for(const s of[-1,1]){const ex=fx+s*4;P1(ex,fy-10,ol);R(ex-1,fy-9,3,2,ol);P1(ex,fy-9,'#f4a6b8');P1(ex,fy-8,mask)}
  if(c.points)R(fx-3,fy-5,7,4,c.points);if(c.stripe){P1(fx-1,fy-6,c.stripe);P1(fx+1,fy-6,c.stripe);P1(fx,fy-5,c.stripe)}if(c.spot)R(fx+2,fy-6,3,2,c.spot);
  if(blink){R(fx-3,fy-3,2,1,eye);R(fx+2,fy-3,2,1,eye)}else{R(fx-3,fy-4,2,2,eye);R(fx+2,fy-4,2,2,eye);P1(fx-3,fy-4,'#ffffff');P1(fx+2,fy-4,'#ffffff')}
  P1(fx,fy-2,'#f4a6b8');P1(fx-1,fy-1,ol);P1(fx+1,fy-1,ol);for(const s of[-1,1]){P1(fx+s*7,fy-3,c.whisk||'#ffffff');P1(fx+s*7,fy-1,c.whisk||'#ffffff')}}
// 火箭：(x,y) 中线、底边；k=1 店里，k=2 特写。o.pal 窗口里的猫（没有就是空窗口），o.blink
function rocket(x,y,k,o={}){x=Math.round(x);y=Math.round(y);const bw=18*k,bh=18*k,ew=8*k,eh=7*k,cw=20*k,ch=10*k,sh=5*k,bx=x-bw/2,by=y-eh-bh;
  // 发动机：一筒烟花（红白斜纹，一道金箍）
  const ex=x-ew/2,ey=y-eh;R(ex-1,ey,ew+2,eh,OL);for(let j=0;j<eh-1;j++)for(let i=0;i<ew;i++)P1(ex+i,ey+j,((i+j*2)>>(k-1))%5===0?'#fff4dc':i<k?'#9e2f2a':'#d84a3a');
  R(ex,ey+Math.round(eh*.3),ew,k,'#ffd84a');R(ex+1,y-1,ew-2,1,'#3a2630');
  // 纸箱的两片底翻边当尾翼
  for(const s of[-1,1]){const fx=s<0?bx:bx+bw-1;for(let j=0;j<7*k;j++){const w=Math.round(j/(7*k)*4*k)+1,xx=s<0?fx-w:fx+1;R(xx,by+bh-7*k+j,w,1,j%3===0?PAPER[2]:PAPER[3]);P1(s<0?xx-1:xx+w,by+bh-7*k+j,OL)}R(s<0?fx-4*k-1:fx+1,by+bh,4*k+1,1,OL)}
  // 纸箱身子、一道胶带、马克笔写的 1024
  R(bx-1,by-1,bw+2,bh+2,OL);R(bx,by,bw,bh,PAPER[3]);R(bx,by,2*k,bh,PAPER[4]);R(bx+bw-2*k,by,2*k,bh,PAPER[2]);R(bx,by+bh-k,bw,k,PAPER[1]);
  R(bx,by+2*k,bw,2*k,'#e8d8a0');R(bx,by+4*k-1,bw,1,'#c8b880');txt('1024',x-Math.round(txtW('1024',k)/2),by+bh-7*k,'#2a1a2e',k);
  // 窗口（剪出来的方洞）里是你的猫
  const ww=k===1?7:16,wh=k===1?5:12,wx=x-Math.floor(ww/2),wy=by+4*k+1;R(wx-1,wy-1,ww+2,wh+2,PAPER[0]);if(o.pal!=null)catFace(wx,wy,ww,wh,o.pal,k,o.blink);else{R(wx,wy,ww,wh,'#1a100c');R(wx,wy,ww,1,'#2a1a14')}
  // 漏斗倒扣在顶上当尖头：一圈边、锥、细嘴
  const cy0=by-1;R(x-cw/2-1,cy0-2*k,cw+2,2*k+1,OL);R(x-cw/2,cy0-2*k+1,cw,2*k-1,TIN[2]);R(x-cw/2,cy0-2*k+1,cw,1,TIN[3]);
  for(let j=0;j<ch;j++){const hw=Math.max(1,Math.round((cw/2-1)*(1-j/ch))),yy=cy0-2*k-1-j;R(x-hw-1,yy,2*hw+2,1,OL);R(x-hw,yy,hw,1,TIN[3]);R(x,yy,hw,1,TIN[2]);P1(x-hw,yy,TIN[4]);if(hw>2)P1(x+hw-1,yy,TIN[1])}
  const sy=cy0-2*k-ch;R(x-k-1,sy-sh,2*k+2,sh+1,OL);R(x-k,sy-sh+1,k,sh,TIN[4]);R(x,sy-sh+1,k,sh,TIN[2]);
  if(k>1){P1(x+5,cy0-6,'#8a5a32');P1(x+6,cy0-6,'#8a5a32');P1(x+4,cy0-5,'#8a5a32')}   // 一小圈咖啡渍
  return sy-sh}
// 火焰：(x,y) 喷口下面那一行，len 长度；k 粗细
function flame(x,y,len,t,k=1){x=Math.round(x);y=Math.round(y);const f=Math.floor(t*24);for(let j=0;j<len;j++){const q=j/len,w=Math.max(0,Math.round(3.2*k*(1-q*q)+(hsh(f,j)-.5)*1.6*k)),c=q<.25?'#fff8d0':q<.55?'#ffd84a':q<.8?'#ff8a3a':'#d84a3a';
    if(w<=0)continue;R(x-w,y+j,2*w+1,1,c);if(q<.5&&w>2)R(x-w+2,y+j,2*w-3,1,'#fffbe8')}
  for(let i=0;i<4*k;i++){const a=hsh(f,i+30),b=hsh(f,i+60);P1(Math.round(x+(a-.5)*8*k),Math.round(y+len*.6+b*len*.7),b<.5?'#ffd84a':'#ff8a3a')}}
// 发射台：一块木托盘；没搭火箭的时候上面盖着一块蓝帆布（底下压着几张纸箱），搭好以后帆布叠好放在一边、旁边一卷胶带
function pad(x,y,built){x=Math.round(x);y=Math.round(y);R(x-21,y-6,42,7,OL);for(let i=0;i<5;i++)R(x-20+i*8,y-5,7,2,i%2?'#b07a44':'#c98d5c');R(x-20,y-3,40,1,'#6a4424');[-18,-1,15].forEach(d=>R(x+d,y-2,3,2,'#8a5a32'));
  if(!built){R(x-17,y-15,34,10,OL);R(x-16,y-14,32,9,'#3a6a9a');R(x-16,y-14,32,2,'#5a8ac0');for(let i=x-14;i<x+16;i+=6)R(i,y-12,1,7,'#2a4a72');R(x-16,y-7,32,1,'#2a4a72');R(x-6,y-15,1,10,'#d8c8a0');R(x+8,y-15,1,10,'#d8c8a0');P1(x-17,y-6,PAPER[3]);R(x+16,y-9,2,3,PAPER[3]);return}
  R(x-34,y-4,12,4,OL);R(x-33,y-3,10,3,'#3a6a9a');R(x-33,y-3,10,1,'#5a8ac0');disc(x+27,y-2,3,2,OL);disc(x+27,y-2,2,1,'#e8d8a0');P1(x+27,y-2,'#8a7a50')}
// 吧台上的漏斗：架在一只小白杯上（手冲咖啡的那种）；(x,y) 杯底中点
function funnel(x,y){x=Math.round(x);y=Math.round(y);R(x-4,y-6,9,6,OL);R(x-3,y-5,7,4,'#fff4dc');R(x-3,y-2,7,1,'#d8ccb8');R(x+5,y-5,2,3,OL);P1(x+5,y-4,'#fff4dc');
  for(let j=0;j<6;j++){const hw=1+Math.round(j*.95),yy=y-7-j;R(x-hw-1,yy,2*hw+3,1,OL);R(x-hw,yy,hw,1,TIN[3]);R(x,yy,hw+1,1,TIN[2]);P1(x-hw,yy,TIN[4])}R(x-8,y-14,17,2,OL);R(x-7,y-14,15,1,TIN[3]);P1(x-6,y-13,TIN[4])}
// 那筒没放出去的烟花：躺在地上，引信焦了一截；(x,y) 底边中点
function fwTube(x,y,t){x=Math.round(x);y=Math.round(y);R(x-7,y-6,14,6,OL);for(let i=0;i<12;i++)for(let j=0;j<4;j++)P1(x-6+i,y-5+j,(i+j)%4===0?'#fff4dc':j===0?'#ff7a6a':'#d84a3a');R(x-3,y-5,2,4,'#ffd84a');R(x+6,y-5,1,4,'#5a4a42');
  P1(x+7,y-4,'#3a2630');P1(x+8,y-5,'#3a2630');P1(x+9,y-5,'#6a5a52');if(Math.floor(t*1.3)%4===0)P1(x+10,y-7,'#8a8496')}

/* ---------- 猫猫星球这颗球：按半径逐像素画好（球、两只耳朵；毛线环分前后两半） ---------- */
const SPH=new Map(),LT=[-.56,-.5,.66];
// 坑：经度、纬度、半径。最大的那个是肉垫，上面四个小的是趾头——整颗星球上印着一只大爪印
const CRATERS=[[-.35,.2,.17],[-.62,0,.07],[-.47,-.1,.07],[-.25,-.1,.07],[-.1,0,.07],[.45,.35,.14],[.2,-.42,.1],[.62,.0,.09],[-.7,.52,.1]];
const rq=r=>r<40?Math.round(r):r<80?2*Math.round(r/2):3*Math.round(r/3);
// 一颗球分三张图逐行画：球（带耳朵）、毛线环的后半圈、前半圈。大的一张要好几毫秒，所以拆成一行行，特写开始前一帧画一点（warm）
const JOBS=new Map();
function sphJob(r){const G=GND.map(c32),E=EAR.map(c32),I=EIN.map(c32),ol=c32('#140c26'),rim=c32('#c8a8f0'),rim2=c32('#7a5aa8'),cy1=c32('#7ae8ff'),pk1=c32('#ff9ad8'),Y=YN.map(c32),yol=c32('#3a1630');
  const big=r<12,sm2=cl((15-r)/8),EH=1.5+.45*sm2,EW=.3+.12*sm2,ear=s=>{const th=s*.66,P=(a,d)=>[Math.sin(a)*d,-Math.cos(a)*d];return{A:P(th-EW,.93),B:P(th+EW,.93),T:P(th,EH),IA:P(th-EW*.55,1),IB:P(th+EW*.55,1),IT:P(th,EH*.88)}},EA=[ear(-1),ear(1)];   // 小号的耳朵画大一点（越小越大，慢慢过渡），不然认不出来
  const top=Math.ceil(r*(EH-.2))+2,W=2*r+5,H=top+r+3,cx=r+2,cy=top;
  // 毛线环：斜一点的扁椭圆
  const rx=r*1.78,ry=r*.36,th=Math.max(1.2,r*.11),al=-.2,ca=Math.cos(al),sa=Math.sin(al),RW=Math.ceil(rx*1.04+th+3)*2,RH=Math.ceil(ry+th+Math.abs(sa)*rx+4)*2,rcx=RW/2,rcy=RH/2;
  const J={r,W,H,cx,cy,RW,RH,rcx,rcy,st:0,j:0,b:[new Uint32Array(W*H),new Uint32Array(RW*RH),new Uint32Array(RW*RH)]};
  J.row=(st,j)=>{if(st===0){const u=J.b[0];for(let i=0;i<W;i++){const X=(i-cx+.5)/r,Yv=(j-cy+.5)/r,d2=X*X+Yv*Yv,b=bay(i,j),k=j*W+i,p=[X,Yv];
      let done=false;if(d2>.78)for(let e=0;e<2;e++){const q=EA[e];if(!inT(p,q.A,q.B,q.T))continue;done=true;if(Math.min(dE(p,q.A,q.T),dE(p,q.B,q.T))*r<(big?.55:1)){u[k]=ol;break}
        u[k]=r>=6&&inT(p,q.IA,q.IB,q.IT)?(big?I[3]:lv(I,e?.35:.7,b-.5)):big?E[e?3:4]:lv(E,e?.25:.65,b-.5);break}   // 小号的耳朵亮一点、描边细一点
      if(done)continue;if(d2>1){const d=Math.sqrt(d2);if(d<1+1.2/r&&X+Yv<.3)u[k]=d<1+.6/r||r<8?rim:rim2;continue}
      if(d2>1-2/r&&X+Yv>-.2){u[k]=ol;continue}
      const Z=Math.sqrt(1-d2),lum=X*LT[0]+Yv*LT[1]+Z*LT[2],lon=Math.atan2(X,Z),lat=Math.asin(Yv);let L=cl(lum*.62+.42)+(vn(lon*6+9,lat*6+9,1,23)-.5)*.3;
      for(const [lo,la,rr] of CRATERS){const dl=(lon-lo)*Math.cos(lat),dd=Math.hypot(dl,lat-la);if(dd>rr)continue;const q=dd/rr,face=(dl*LT[0]+(lat-la)*LT[1])/(dd||1);L+=(q>.72?(face<0?.22:-.1):(face>0?-.3:.05))-.12;break}
      if(lum<-.04&&r>=10&&hsh(Math.floor(lon*r*.6)+77,Math.floor(lat*r*.6))<.05&&hsh(i,j)<.6){u[k]=hsh(Math.floor(lon*r),9)<.5?cy1:pk1;continue}u[k]=lv(G,L,b-.4)}return}
    const front=st===2,u=J.b[st];for(let i=0;i<RW;i++){const x=i-rcx+.5,y=j-rcy+.5,U=x*ca+y*sa,V=-x*sa+y*ca;if((V>=0)!==front)continue;
      const Xn=U/rx,Yn=V/ry,rho=Math.hypot(Xn,Yn);if(rho<.6||rho>1.4)continue;const d=(rho-1)/Math.hypot(Xn/(rx*rho),Yn/(ry*rho)),a=d/th;if(Math.abs(a)>1)continue;
      if(th>=2&&Math.abs(a)>.7){u[j*RW+i]=yol;continue}const s=Math.atan2(Yn,Xn)*(rx+ry)/2,ph=((s/Math.max(2.5,th*1.4)+a*1.5)%1+1)%1;
      u[j*RW+i]=lv(Y,(front?.62:.36)-a*.3+(th>=2?(ph<.5?.2:-.12):0),bay(i,j)-.3)}};
  return J}
// 往下画，到 deadline（毫秒时刻，0 表示画完为止）停；画完了存起来
function runJob(J,dl){while(J.st<3){const lim=J.st===0?J.H:J.RH;while(J.j<lim){J.row(J.st,J.j++);if(dl&&performance.now()>dl)return false}J.st++;J.j=0;if(dl)return false}
  J.cvs=J.cvs||[];while(J.cvs.length<3){const n=J.cvs.length,[w,h]=n?[J.RW,J.RH]:[J.W,J.H],cv=mk(w,h),x=cv.getContext('2d'),im=x.createImageData(w,h);new Uint32Array(im.data.buffer).set(J.b[n]);x.putImageData(im,0,0);J.cvs.push(cv);J.b[n]=null;if(dl&&J.cvs.length<3)return false}
  SPH.set(J.r,{cv:J.cvs[0],cx:J.cx,cy:J.cy,r:J.r,back:J.cvs[1],front:J.cvs[2],rcx:J.rcx,rcy:J.rcy});JOBS.delete(J.r);return true}
function sphere(r0){const r=Math.max(2,rq(r0));const c=SPH.get(r);if(c)return c;runJob(JOBS.get(r)||sphJob(r),0);return SPH.get(r)}
// 画一颗：(x,y) 球心；ready 只用已经画好的（还没画好就先用小一号的，不在这一帧现画）
function planet(x,y,r,ready){if(r<1.5){P1(Math.round(x),Math.round(y),'#c8a8f0');return}let s=SPH.get(Math.max(2,rq(r)));if(!s&&ready)for(let q=Math.max(2,rq(r));q>=2&&!s;q--)s=SPH.get(q);if(!s)s=sphere(r);x=Math.round(x);y=Math.round(y);C.drawImage(s.back,x-s.rcx,y-s.rcy);C.drawImage(s.cv,x-s.cx,y-s.cy);C.drawImage(s.front,x-s.rcx,y-s.rcy)}
// 先画好要用的那几种大小：这一帧最多画 ms 毫秒，画不完下一帧接着画
function warm(list,ms){const dl=performance.now()+ms;for(const r0 of list){const r=Math.max(2,rq(r0));if(SPH.has(r))continue;let J=JOBS.get(r);if(!J){J=sphJob(r);JOBS.set(r,J)}if(!runJob(J,dl)||performance.now()>dl)return false}return true}
function drop(keep=10){for(const k of [...SPH.keys()])if(k>keep)SPH.delete(k);JOBS.clear()}
// 望远镜里：沿着镜筒右边、月亮和镜筒边之间那一圈缝，从下往上慢慢划过去（k 0→1）；(cx,cy,r) 镜筒，mr 月亮。
// 在右边，耳朵朝上、球身顺着缝；大小按缝的宽窄定，只画在缝里、不盖到月亮上（毛线环的两头藏到月亮边和镜筒边后面）。顶上常有提示条、底下是说明，所以走右边
function scopePass(cx,cy,r,k,t,mr){mr=mr||r*.68;const gap=r-mr,rp=Math.max(5,Math.min(10,Math.round(gap/2.5))),a=Math.PI*(.3-.6*k),rho=(mr+r)/2,x=Math.round(cx+Math.cos(a)*rho),y=Math.round(cy+Math.sin(a)*rho);
  C.save();C.beginPath();C.arc(cx,cy,r-1,0,Math.PI*2);C.moveTo(cx+mr+1,cy);C.arc(cx,cy,mr+1,0,Math.PI*2);C.clip('evenodd');
  C.save();C.globalCompositeOperation='lighter';C.globalAlpha=.35;C.drawImage(glowTex(16,'#c8a8f0'),x-16,y-16);C.restore();
  planet(x,y,rp);if(Math.floor(t*3)%2)P1(x+rp+2,y-rp-2,'#fff8ec');C.restore();return{x,y}}

/* ================= 坐火箭飞的那段特写 =================
   F：world-rocket.js 建的一趟 {dir 1 去 / -1 回, u 飞了几秒, T 一共几秒, boost, snap 屋顶那一块（截的店里的图，没有火箭）, sy 截图顶在画面上的位置, px,py 发射台在画面上的位置, pal}
   p 是这一趟走到哪了：0 屋顶，1 星球。去的时候慢慢起飞、中间最快、最后慢慢靠近；回来倒着放，最后落回发射台。 */
const FL={};
const fp=F=>{const k=cl(F.u/F.T);return F.dir>0?.5-.5*Math.cos(Math.PI*k):.86*(.5+.5*Math.cos(Math.PI*k))};
const fv=F=>{const k=cl(F.u/F.T);return(F.dir>0?1:-.86)*.5*Math.PI/F.T*Math.sin(Math.PI*k)};
// 逐行画一张大图：一帧画一点，画完存成图
const pixJob=(W,H,row)=>({W,H,j:0,u:new Uint32Array(W*H),row});
function pixRun(J,dl){while(J.j<J.H){J.row(J.u,J.j++);if(dl&&performance.now()>dl)return null}const cv=mk(J.W,J.H),x=cv.getContext('2d'),im=x.createImageData(J.W,J.H);new Uint32Array(im.data.buffer).set(J.u);x.putImageData(im,0,0);return cv}
// 太空：从上往下一点点变亮的深紫，一条斜着的粉紫星云、右下一团青蓝，浓的地方颜色一档档抖动过渡
function spaceRow(w,h){const S=SKY.map(c32),NP=['#22124a','#3e1c66','#682a80','#9a4492'].map(c32),NB=['#141a4a','#1a3470','#245a88'].map(c32),st=['#fff8ec','#c8d8ff','#ffe8a8','#ffc8f0'].map(c32);
  return(u,y)=>{for(let x=0;x<w;x++){const i=y*w+x,b=bay(x,y);u[i]=S[cl(Math.floor((.1+y/h*.35)*(S.length-1)+b),0,S.length-1)];
    const m=Math.exp(-Math.pow((y-h*.18-x*.32)/(h*.2),2))*(vn(x,y,60,31)*.55+vn(x,y,20,33)*.3+vn(x,y,7,37)*.15),q=Math.exp(-Math.pow((x-w*.82)/(w*.16),2)-Math.pow((y-h*.72)/(h*.2),2))*(vn(x,y,36,39)*.7+vn(x,y,11,43)*.3);
    const lp=(m-.24)*9+b-.5,lb=(q-.22)*7+b-.5;if(lp>=1)u[i]=NP[cl(Math.floor(lp)-1,0,3)];else if(lb>=1)u[i]=NB[cl(Math.floor(lb)-1,0,2)];
    if(hsh(x*5+3,y*9+1)<.0024+m*.004)u[i]=st[Math.floor(hsh(x,y+7)*4)]}}}
// 毛线球月亮：一颗奶黄色的毛线球，插着两根织针，一截线头飘在后面（逐行画，画完再插针）
function yarnMoonJob(R){const W=Math.ceil(R*2.6),H=Math.ceil(R*2.8),cx=Math.round(R*1.2),cy=Math.round(R*1.55),P=['#4a3c26','#7a6644','#a8925e','#d0ba84','#ecdcae','#fff6dc'].map(c32),ol=c32('#221a12'),axes=[[.3,.9,.3],[.95,.1,.3],[-.6,.5,.6]];
  const J=pixJob(W,H,(u,j)=>{for(let i=0;i<W;i++){const X=(i-cx+.5)/R,Y=(j-cy+.5)/R,d2=X*X+Y*Y;if(d2>1)continue;if(d2>1-2/R){u[j*W+i]=ol;continue}
    const Z=Math.sqrt(1-d2),lum=-X*.6-Y*.45+Z*.65,pat=vn(X*2.6+4,Y*2.6+4,1,41),ax=axes[pat<.38?0:pat<.68?1:2],s=(X*ax[0]+Y*ax[1]+Z*ax[2])*R/2.2,fr=((s%1)+1)%1;u[j*W+i]=lv(P,cl(lum*.55+.42)+(fr<.2?-.3:0),bay(i,j)-.4)}});
  J.done=cv=>{const o=C;use(cv.getContext('2d'));
    for(const [a,b,c,d] of [[-.9,-.95,.5,.2],[.95,-.7,-.2,.35]]){const x0=Math.round(cx+a*R),y0=Math.round(cy+b*R),x1=Math.round(cx+c*R),y1=Math.round(cy+d*R);line(x0,y0,x1,y1,'#3a3e4c');line(x0+1,y0,x1+1,y1,'#bcc2d0');disc(x0,y0,2,2,'#e0533d')}
    for(let i=0;i<R*1.4;i++){const k=i/(R*1.4),x=Math.round(cx+R*.7+k*R*.9),y=Math.round(cy-R*.75-k*R*.75+Math.sin(k*9)*3);P1(x,y,'#ecdcae');P1(x,y+1,'#7a6644')}use(o);return{cv,cx,cy}};return J}
// 夜里的云：顶上被月光照亮，底下暗
function cloudImg(n,w){const h=Math.round(w*.42);return paint(w+4,h+4,()=>{const B=[];for(let i=0;i<6;i++){const a=hsh(n,i*3+1),b=hsh(n,i*3+2);B.push([Math.round(w*(.15+a*.7)),Math.round(h*(.45+b*.25)),Math.round(w*(.12+hsh(n,i*3+3)*.12)),Math.round(h*(.22+b*.12))])}
  B.push([Math.round(w/2),Math.round(h*.68),Math.round(w*.46),Math.round(h*.22)]);B.forEach(([x,y,rx,ry])=>disc(x,y,rx+1,ry+1,'#2a2850'));B.forEach(([x,y,rx,ry])=>disc(x,y,rx,ry,'#4a4878'));
  B.forEach(([x,y,rx,ry])=>disc(x-1,y-2,Math.max(1,rx-2),Math.max(1,ry-2),'#7a78a8'));B.forEach(([x,y,rx,ry])=>disc(x-2,y-Math.round(ry*.55),Math.max(1,Math.round(rx*.6)),Math.max(1,Math.round(ry*.4)),'#b8b6e0'))})}
const CITY=Array.from({length:150},(_,i)=>{const r=Math.pow(hsh(i,501),1.6),a=hsh(i,502)*Math.PI*2,grid=hsh(i,503)<.5;return{u:grid?Math.round(Math.cos(a)*r*8)/8:Math.cos(a)*r,v:.35+Math.sin(a)*r*.45,c:hsh(i,504)<.15?'#fff8ec':hsh(i,505)<.4?'#ffd88a':'#ffb060'}});
// 准备这一趟要用的图（倒数的时候一帧准备一点；ms=0 一口气准备好）：返回 true 表示都好了
function flightPrep(w,h,ms=0){const k=w+'x'+h,F=FL[k]=FL[k]||{},dl=ms?performance.now()+ms:0;
  if(!F.space){F.sj=F.sj||pixJob(w,h,spaceRow(w,h));const cv=pixRun(F.sj,dl);if(!cv)return false;F.space=cv;F.sj=null;if(ms)return false}
  if(!F.moon){F.mj=F.mj||yarnMoonJob(Math.round(h*.16));const cv=pixRun(F.mj,dl);if(!cv)return false;F.moon=F.mj.done(cv);F.mj=null;if(ms)return false}
  F.clouds=F.clouds||[];while(F.clouds.length<6){const i=F.clouds.length;F.clouds.push(cloudImg(i,Math.round(w*(.22+hsh(i,601)*.18))));if(ms&&F.clouds.length<6)return false}return true}
const radList=h=>{const L=[],rM=Math.min(120,Math.round(h*.42));for(let r=2;r<=rM;r++)if(!L.includes(rq(r)))L.push(rq(r));return L};
function flight(E,F){const {w,h,t}=E,k=w+'x'+h;flightPrep(w,h,0);const G=FL[k],p=fp(F),v=fv(F),dt=F.lt==null?0:Math.min(.1,t-F.lt);F.lt=t;
  // 截图（屋顶）往下走：A 是火箭离发射台多高；火箭升到画面 0.6 处以后镜头跟着它
  const SH=F.snap?F.snap.height:h,A=p/.16*(SH+h*.4),scroll=Math.max(0,A-(F.py-h*.6)),ry=Math.round(F.py-A+scroll),rx=Math.round(F.px+(w*.5-F.px)*sm(p/.12)+Math.sin(t*1.6)*2*cl(A/80));
  C.drawImage(G.space,0,0);
  // 星星：往后飞，越快拉得越长（去的时候往下，回来往上）
  if(!F.stars)F.stars=Array.from({length:120},(_,i)=>({x:Math.floor(hsh(i,611)*w),y:hsh(i,612)*h,d:.15+Math.pow(hsh(i,613),1.8)*.85,c:hsh(i,614)<.2?'#ffe8a8':hsh(i,615)<.3?'#c8d8ff':'#fff8ec'}));
  const sp=v*(300+2600*cl((p-.16)/.15))*(F.boost?1.8:1),dir=sp>0?-1:1;
  for(const s of F.stars){s.y=((s.y+sp*s.d*dt)%(h+40)+h+40)%(h+40);const len=Math.round(Math.min(20,Math.abs(sp)*s.d*s.d*.06)),y=Math.round(s.y-20);
    if(len>=2){const a=Math.ceil(len*.4);R(s.x,dir<0?y-a:y+1,1,a,s.d>.6?'#a8b0e8':'#5a5a98');for(let k=a+1;k<=len;k+=2)P1(s.x,y+dir*k,'#3a3a70')}P1(s.x,y,s.d>.5?'#ffffff':s.c)}
  // 越来越大的猫猫星球（耳朵、毛线环）
  if(p>.5){const q=(p-.5)/.5,r=2+(Math.min(120,Math.round(h*.42))-2)*Math.pow(q,2.3);planet(w*.5+(1-q)*w*.06,h*(.22+q*.12),r,true)}
  // 毛线球月亮从旁边擦过去
  if(p>.42&&p<.68){const q=(p-.42)/.26,M=G.moon,R=Math.round(h*.16);C.drawImage(M.cv,Math.round(w*.8-M.cx),Math.round(-R*1.5+q*(h+R*3)-M.cy))}
  // 地球的边：一条弯弯的地平线，城里的灯聚成一小片，越来越小；中间一个小金点是巨树
  if(p>.13&&p<.42){const q=(p-.13)/.29,Rs=3200*Math.pow(70/3200,q),top=Math.round(h+6-h*.24*Math.sin(Math.PI*cl(q*1.3))),cy=top+Rs,x0=w/2;
    for(let y=Math.max(0,top);y<h;y++){const hw=Math.sqrt(Math.max(0,Rs*Rs-(cy-y)*(cy-y))),a=Math.max(0,Math.round(x0-hw)),b=Math.min(w,Math.round(x0+hw));if(b<=a)continue;const d=y-top;
      R(a,y,b-a,1,d<1?'#8ad8ff':d<2?'#3a8ad0':d<5?'#163a6e':'#0c2244');if(d>=2){P1(a,y,'#3a8ad0');P1(b-1,y,'#3a8ad0')}}
    for(let j=1;j<=5;j++){const y=top-j;if(y<0||y>=h)continue;const hw=Math.sqrt(Math.max(0,Rs*Rs-(cy-y)*(cy-y))),a=Math.max(0,Math.round(x0-hw)),b=Math.min(w,Math.round(x0+hw));if(b>a)alpha(.32-j*.055,()=>R(a,y,b-a,1,'#5ab0f0'))}
    const Wc=Rs*.05;for(const L of CITY){const x=Math.round(x0+L.u*Wc),y=Math.round(top+2+L.v*Wc*.3);if(y>=h||y<top+2)continue;P1(x,y,L.c)}
    const gy=Math.round(top+2+.35*Wc*.3);P1(Math.round(x0),gy,'#ffd84a');if(Math.floor(t*3)%2){P1(Math.round(x0)-1,gy,'#e8a020');P1(Math.round(x0)+1,gy,'#e8a020');P1(Math.round(x0),gy-1,'#fff8c0')}}
  // 穿过一层云：后面几朵在火箭后面，两朵在前面
  const cloudY=i=>Math.round(-120+(p-.19)/.19*(h+260)+(hsh(i,621)-.5)*140),inCloud=p>.17&&p<.4;
  if(inCloud)for(let i=0;i<4;i++)C.drawImage(G.clouds[i],Math.round(hsh(i,622)*w*1.1-w*.15),cloudY(i));
  // 屋顶（截的图）和起飞的烟
  if(F.snap&&A<SH+h)C.drawImage(F.snap,0,Math.round(F.sy+scroll));
  if(!F.puffs)F.puffs=[];if(A<120&&(F.u<1.6||F.dir<0)&&Math.random()<.5)F.puffs.push({x:rx+(Math.random()-.5)*16,a:A-6,vx:(Math.random()-.5)*34,r:3+Math.random()*4,t0:t});
  F.puffs=F.puffs.filter(q=>t-q.t0<2.2);for(const q of F.puffs){const k2=(t-q.t0)/2.2,x=Math.round(q.x+q.vx*k2*2),y=Math.round(F.py-q.a+scroll-k2*6),r=Math.round(q.r*(1+k2*1.6));alpha(.75*(1-k2),()=>{disc(x,y,r,Math.max(1,Math.round(r*.7)),'#8a86a8');disc(x-1,y-1,Math.max(1,r-2),Math.max(1,Math.round(r*.5)),'#c8c4dc')})}
  // 火箭：起飞和刚上天的时候抖一下
  const shake=(A<40||F.boost)&&Math.floor(t*30)%2?1:0,on=F.dir>0||F.u<F.T-.15,len=Math.round((on?12+Math.sin(t*20)*3:0)+(F.boost?10:0)+(A<2&&F.dir>0?-6:0));
  if(!F.sp)F.sp=[];if(on&&A>4)for(let i=0;i<(F.boost?3:1);i++)F.sp.push({x:rx+(Math.random()-.5)*8,y:ry+len*.6,vx:(Math.random()-.5)*20,vy:30+Math.random()*40+Math.abs(sp)*.3*-dir,t0:t,c:Math.random()<.5?'#ffd84a':'#ff8a3a'});
  F.sp=F.sp.filter(q=>t-q.t0<.9);for(const q of F.sp){const k2=t-q.t0;if(k2<.6||Math.floor(t*20+q.x)%2)P1(Math.round(q.x+q.vx*k2),Math.round(q.y+q.vy*k2),q.c)}
  if(on&&len>0)flame(rx+shake,ry+1,len,t,2);rocket(rx+shake,ry,2,{pal:F.pal,blink:(t%3.4)<.12});
  if(inCloud)for(let i=4;i<6;i++)alpha(.85,()=>C.drawImage(G.clouds[i],Math.round(hsh(i,622)*w*1.1-w*.15),cloudY(i)));
  // 快到了：冲进星球的紫色里
  if(F.dir>0&&F.u>F.T-.9)alpha(cl((F.u-(F.T-.9))/.9),()=>R(0,0,w,h,GND[5]))}

return{K:{GND,SKY,NEB,EAR,EIN,CY,PK,GD,YN,PAPER,TIN},HZ,RING,EARS,live:{},mk,pix,paint,vn,bay,cl,floorBase,crater,rock,spike,crystalTuft,ringArc,earsImg,earth,lake,fish,yarnGiant,yarnEnd,flag,bouncePad,singCrystals,SING,
  catFace,rocket,flame,pad,funnel,fwTube,floatRock,foreRidge,sphere,planet,warm,drop,rq,scopePass,flight,flightPrep,radList,fp}})();
