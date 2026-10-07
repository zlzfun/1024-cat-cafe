/* 1024 猫咖 · 夜城：屋顶天边的那片城，和"看风景"里几张远景共用的零件（设计见 docs/店内设计.md 第一节"屋顶"、第八节"看风景"）。
   依赖 scene-kit.js（R、P1、disc、line、use、C）、world-kit.js（hsh）。在 outdoor-kit.js 后面、map-roof.js 前面加载。
   - NC：画夜城的零件。远山（雪顶，向着月亮那面描一道亮边）、一栋楼（暖黄、冷白、粉、绿几种窗，亮度不一）、一排高高低低的楼、电视塔、摩天轮（转的那几帧画好存成小图）、电车、红灯。
     一个像素一格、色块之间用 4×4 抖动过渡；越远越淡、越偏蓝，越近越暗、窗越大。
   - roofSkyline(x,y,w)：屋顶天边那片城不动的部分。map-roof.js 画底图时调一次；y 是地平线，城从这里往上长。
     左边一座雪山、电视塔和两座高楼高过斜屋顶的屋脊；树冠底下露出远山、三层楼和一道高架；右边是摩天轮和几座高楼。
   - roofSkylineLive(x,y,w,t)：每帧调，不超过 0.3 毫秒。摩天轮在转、外圈上跑着两颗亮点，电视塔和高楼顶上的红灯一闪一闪，隔一阵一列亮着窗的电车开过高架，几扇窗一亮一灭。
     星星是每帧画在底图上面的（map-roof.js 的 nightStars），这里先把城再盖一遍，免得星星落在楼上。只画在矮墙（地平线上面 10）以上、斜屋顶（x<250、地平线上面 70）以外。
   屋顶整层夜里要乘一层颜色（WORLD.floors 里屋顶的 tint）：城的颜色先除掉它，画出来才是想要的颜色（灯最亮也只能到 tint 那么亮）。 */
const NC=(()=>{
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],bay=(x,y)=>(BAY[(y&3)*4+(x&3)]+.5)/16;
const rgb=h=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]},hex=a=>'#'+a.map(q=>Math.max(0,Math.min(255,Math.round(q))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,k)=>{const p=rgb(a),q=rgb(b);return hex(p.map((v,i)=>v+(q[i]-v)*k))},mul=(a,k)=>hex(rgb(a).map(v=>v*k));
const nz=(x,s)=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return hsh(i,s)*(1-u)+hsh(i+1,s)*u};   // 一维的平滑噪声 0～1
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);return c};
// 画进一张小图：f 里照常用 R、P1 画，画完换回原来的画布
const into=(cv,f)=>{const o=C;use(cv.getContext('2d'));try{f()}finally{use(o)}return cv};
function dith(x,y,w,h,col,lv){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(bay(i,j)<lv)P1(i,j,col)}
// 竖着一段一段变色：cols 从上到下，交界处 tz 行抖动过渡
function vgrad(x,y,w,h,cols,tz=6){const n=cols.length;for(let i=0;i<n;i++){const y0=Math.round(y+h*i/n),y1=Math.round(y+h*(i+1)/n);R(x,y0,w,y1-y0,cols[i])}
  for(let i=1;i<n;i++){const yb=Math.round(y+h*i/n),a=cols[i-1],b=cols[i];for(let yy=yb-tz/2;yy<yb+tz/2;yy++){const lv=(yy-yb+tz/2+.5)/tz;for(let xx=x;xx<x+w;xx++){const on=bay(xx,yy)<lv;if(yy<yb&&on)P1(xx,yy,b);else if(yy>=yb&&!on)P1(xx,yy,a)}}}}

/* ---------- 远山 ---------- */
// (x0..x1) 一道山脊，b 山脚。pk：[[峰的 x, 高, 半宽]…]。o：c 背光面、l 向光面、sn 背光的雪、sl 向光的雪、rim 月光描的边、rim2 背光那面的边、lt 月亮在哪边（1 右 -1 左）、s 种子、sf 雪线（峰高的几成往上有雪）、sk 山脊线多斜。
// 向光、背光的分界是从峰顶斜着往下的山脊线；雪顺着山沟往下拉出几道。返回每一列的山顶 y
function ridge(x0,x1,b,pk,o){const s=o.s||0,lt=o.lt||1,n=x1-x0,top=new Int16Array(n+2).fill(b),who=new Int16Array(n+2).fill(-1),sf=o.sf??.58;
  for(let i=0;i<n;i++){const x=x0+i;let v=0,k=-1;pk.forEach(([px,ph,pw],j)=>{const d=Math.abs(x-px)/pw;if(d>=1.4)return;const h=ph*Math.max(0,1-Math.pow(d,1.15)*.86-(d>1?(d-1)*.6:0))*(1+(nz(x/9,s+j)-.5)*.22);if(h>v){v=h;k=j}});
    if(k<0)continue;v+=(nz(x/3.3,s+9)-.5)*3.2*Math.min(1,v/18)+(nz(x/1.4,s+11)-.5)*1.6*Math.min(1,v/26);top[i]=b-Math.max(0,Math.round(v));who[i]=k}
  for(let i=0;i<n;i++){const x=x0+i,y0=top[i],k=who[i];if(k<0||y0>=b)continue;const [px,ph]=pk[k];
    const pt=b-ph,dx=(x-px)*lt,ys=dx>=0?y0:Math.round(pt+(-dx)/(o.sk||.42)+(nz(x/2.2,s+3)-.5)*4),sl=Math.max(y0,Math.min(b,ys));
    if(sl>y0)R(x,y0,1,sl-y0,o.c);if(sl<b)R(x,sl,1,b-sl,o.l);
    const g=nz(x/4.2,s+7),sn=b-Math.round(ph*sf+(nz(x/2.6,s+5)-.5)*5-(g>.6?(g-.6)*16:0));
    if(sn>y0){const e=Math.min(sn,b);if(sl>y0)R(x,y0,1,Math.min(sl,e)-y0,o.sn);if(e>sl)R(x,Math.max(sl,y0),1,e-Math.max(sl,y0),o.sl);if(e<b&&bay(x,e)<.5)P1(x,e,sl>e?o.sn:o.sl)}
    // 边：向光的一面描亮边（陡的地方往下多描几格），背光的一面描暗一点的边
    const nb=lt>0?top[i+1]:(i?top[i-1]:b),len=Math.max(1,Math.min(4,nb-y0));if(dx>=0||ys<=y0+1)R(x,y0,1,len,o.rim);else if(o.rim2)P1(x,y0,o.rim2)}
  return top}

/* ---------- 楼 ---------- */
const WARM=['#ffd77a','#ffcb6a','#ffe3a2','#f4b860'],COOL=['#e8f0ff','#cadaff','#b4e2ff'],ACC=['#ff9cc6','#a6f0b6','#ffb08a'];
// 窗色：这栋楼的口味（暖、冷、混着），偶尔一扇粉的、绿的
const winCol=(th,a,b)=>{const r=hsh(a,b);if(r<.06)return ACC[Math.floor(hsh(b,a)*3)];const P=th===0?WARM:th===1?COOL:(r<.5?WARM:COOL);return P[Math.floor(hsh(a+7,b)*P.length)]};
// 一栋楼：(x,b) 左下角，宽 bw、高 bh（不算屋顶上的东西）。o：f 正面，s 侧面（背着月亮那面，宽 sw），t 楼顶边上一道月光，
//   r 屋顶样式（0 平顶 1 水箱 2 收进去一截 3 尖天线 4 人字顶 5 圆顶 6 斜顶 7 台阶顶），g 窗格 [格宽,格高,窗宽,窗高]，p 亮灯的比例，
//   hz 雾（0～1，窗色往 hc 那边淡），dk 不亮的窗（不写就不画），sd 种子，lt 月亮在哪边，cb(x,y,w,h,col) 每扇亮窗回调一次，tip(x,y) 楼顶最高点回调（挂红灯）
function bld(x,b,bw,bh,o){const sd=o.sd||0,lt=o.lt||1,sw=Math.min(o.sw||0,bw>>1),top=b-bh,r=o.r||0,f=o.f,T=o.t;
  R(x,top,bw,bh,f);if(sw)R(lt>0?x:x+bw-sw,top,sw,bh,o.s);
  let tipX=x+(bw>>1),tipY=top;
  if(r===1&&bw>5){const wx=x+1+Math.floor(hsh(sd,3)*(bw-5));R(wx,top-3,3,2,f);P1(wx,top-1,f);P1(wx+2,top-1,f);if(T)R(wx,top-3,3,1,T);if(bw>9){R(x+bw-4,top-2,2,2,f);if(T)P1(x+bw-4,top-2,T)}}
  else if(r===2&&bw>6){const iw=Math.max(3,Math.round(bw*.6)),ih=Math.max(3,Math.round(bh*.22)),ix=x+Math.round((bw-iw)/2)+(lt>0?1:-1);R(ix,top-ih,iw,ih,f);if(sw)R(lt>0?ix:ix+iw-1,top-ih,1,ih,o.s);if(T)R(ix,top-ih,iw,1,T);tipY=top-ih;tipX=ix+(iw>>1);
    if(bw>10){const jw=Math.max(2,Math.round(iw*.5)),jh=Math.max(2,Math.round(ih*.6)),jx=ix+Math.round((iw-jw)/2);R(jx,tipY-jh,jw,jh,f);if(T)R(jx,tipY-jh,jw,1,T);tipY-=jh}}
  else if(r===3){const ah=Math.max(3,Math.round(bh*.18)+2);tipX=x+Math.round(bw/2);R(tipX,top-ah,1,ah,f);if(bw>6)R(tipX-1,top-Math.round(ah*.45),3,1,f);tipY=top-ah}
  else if(r===4){const rh=Math.max(2,Math.round(bw*.4));for(let j=0;j<rh;j++){const ins=Math.round((rh-j)*bw/(2*rh));R(x+ins,top-rh+j,bw-2*ins,1,j===0&&T?T:f);if(T&&j>0)P1(lt>0?x+bw-1-ins:x+ins,top-rh+j,T)}tipY=top-rh}
  else if(r===5&&bw>5){const dr=Math.floor(bw*.4);for(let j=0;j<dr;j++){const hw=Math.round(Math.sqrt(dr*dr-(dr-j)*(dr-j)));R(x+(bw>>1)-hw,top-dr+j,hw*2+1,1,f);if(T)P1(lt>0?x+(bw>>1)+hw:x+(bw>>1)-hw,top-dr+j,T)}if(T)P1(x+(bw>>1),top-dr,T);tipY=top-dr}
  else if(r===6){const sh=Math.max(2,Math.round(bw*.45));for(let i=0;i<bw;i++){const hh=Math.round(sh*(lt>0?(bw-1-i):i)/Math.max(1,bw-1));if(hh)R(x+i,top-hh,1,hh,f);if(T)P1(x+i,top-hh,T)}tipY=top-sh;tipX=lt>0?x:x+bw-1}
  else if(r===7&&bw>6){let wx=x,ww=bw,yy=top;for(let k=0;k<3&&ww>2;k++){const st=Math.max(1,Math.round(bh*.04)),d=Math.max(1,Math.round(ww*.16));wx+=d;ww-=2*d;yy-=st;R(wx,yy,ww,st,f);if(T)R(wx,yy,ww,1,T)}tipY=yy;tipX=wx+(ww>>1)}
  if(T&&r!==4&&r!==6)R(x,top,bw,1,T);
  // 窗：一格一格；有的楼一层一层亮（写字楼），有的东一扇西一扇（住家）
  const [cw,ch,ww,wh]=o.g||[2,3,1,1],th=hsh(sd,5)<.55?0:hsh(sd,6)<.55?1:2,p=(o.p??.4)*(.55+hsh(sd,7)*.9),floors=hsh(sd,8)<.3,hz=o.hz||0,hc=o.hc||'#6a6aa0';
  const x0=x+(lt>0?sw:0)+1,x1=x+bw-(lt>0?0:sw)-1;for(let wy=top+Math.max(1,ch-wh),rw=0;wy+wh<=b-1;wy+=ch,rw++){const lr=floors?hsh(rw,sd+9)<p*1.3:true;
    for(let wx=x0;wx+ww<=x1;wx+=cw){const q=hsh(wx*7+sd,wy*3+11),on=floors?lr&&q<.85:q<p;if(on){let c=winCol(th,wx+sd,wy);if(hsh(wy,wx+sd)<.22)c=mix(c,'#6a5a48',.35);if(hz)c=mix(c,hc,hz);R(wx,wy,ww,wh,c);if(o.cb)o.cb(wx,wy,ww,wh,c)}else if(o.dk)R(wx,wy,ww,wh,o.dk)}}
  if(o.tip)o.tip(tipX,tipY)}
// 一排楼：从 x0 排到 x1，b 楼脚。o：w [最窄,最宽]，h [最矮,最高]，tall [概率,h0,h1] 偶尔一座高的，gap 楼和楼之间，jit 楼脚上下错一点，skip(x,w) 返回 true 就跳过，cap(x,w) 这儿最高多少，
//   styles 屋顶样式表；别的照 bld（f、s、sw、t、g、p、hz、hc、dk、lt、cb、tip）
function row(x0,x1,b,o){const s=o.sd||0,S=o.styles||[0,0,1,2,3,4,6];let x=x0-Math.floor(hsh(s,1)*o.w[1]);for(let i=0;x<x1;i++){const bw=o.w[0]+Math.floor(hsh(i,s+2)*(o.w[1]-o.w[0]+1));
    let bh=o.h[0]+Math.floor(Math.pow(hsh(i,s+3),1.4)*(o.h[1]-o.h[0]+1));if(o.tall&&hsh(i,s+4)<o.tall[0])bh=o.tall[1]+Math.floor(hsh(i,s+5)*(o.tall[2]-o.tall[1]));
    if(o.cap)bh=Math.min(bh,o.cap(x,bw));const by=b+(o.jit?Math.floor(hsh(i,s+6)*o.jit):0);
    if(bh>1&&!(o.skip&&o.skip(x,bw)))bld(x,by,bw,bh,{...o,r:S[Math.floor(hsh(i,s+7)*S.length)],sd:s*131+i});x+=bw+(o.gap?Math.floor(hsh(i,s+8)*(o.gap+1)):0)}}

/* ---------- 电视塔 ---------- */
// (x,b) 塔脚中点，H 总高。o：c 塔身、l 向光的一边、w 观景球上一圈亮窗、lt 月亮在哪边。返回塔尖 {x,y}（红灯在那儿闪）
function tower(x,b,H,o){const c=o.c,l=o.l,lt=o.lt||1,k=H/160;
  const lh=Math.round(H*.13);for(let j=0;j<lh;j++){const sp=Math.round(2+(j/lh)*7*k);R(x-sp,b-j-1,2,1,c);R(x+sp-1,b-j-1,2,1,c);R(x-1,b-j-1,2,1,c)}   // 三条腿往下撇开
  const y1=b-lh,yp=b-Math.round(H*.64),ys=b-Math.round(H*.8);for(let y=yp;y<y1;y++){const wd=Math.max(2,Math.round((2+(y-yp)/(y1-yp)*2.2)*Math.max(.7,k)));R(x-(wd>>1),y,wd,1,c);P1(lt>0?x-(wd>>1)+wd-1:x-(wd>>1),y,l)}   // 塔身越往上越细
  // 观景球：一圈亮窗，顶上一道月光
  const pr=Math.max(3,Math.round(6.5*k)),pry=Math.max(2,Math.round(pr*.72));disc(x,yp,pr,pry,c);for(let j=-pry;j<=pry;j++){const hw=Math.floor(pr*Math.sqrt(Math.max(0,1-(j*j)/((pry+.5)*(pry+.5)))));P1(lt>0?x+hw:x-hw,yp+j,l)}
  R(x-pr+1,yp-pry,pr*2-1,1,l);for(let i=-pr+1;i<pr;i+=2)P1(x+i,yp,o.w);if(pr>4)for(let i=-pr+2;i<pr-1;i+=3)P1(x+i,yp+2,mix(o.w,c,.45));R(x-pr-1,yp+pry,pr*2+3,1,c);
  // 上面一截、一个小球、天线
  R(x-1,ys,2,yp-pry-ys,c);P1(lt>0?x:x-1,ys+1,l);const sr=Math.max(1,Math.round(2.4*k));disc(x,ys,sr+1,sr,c);P1(x-1,ys,o.w);P1(x+1,ys,o.w);
  const top=b-H;R(x,top,1,ys-sr-top,c);for(let y=top+3;y<ys-sr;y+=Math.max(3,Math.round(5*k)))R(x-1,y,3,1,c);return{x,y:top}}

/* ---------- 摩天轮 ---------- */
// 画好 n 帧存成小图：外圈两道环（中间斜撑）、辐条（可以带一串小灯）、吊舱（亮着灯）、轮毂、A 字支架、底下的小站。
// R0 半径，k 吊舱数，bh 轮心到地面。o：key、rim、rim2 里圈、sp 辐条、leg 支架、L 吊舱的灯（轮流）、RL 外圈的小灯（轮流）、SL 辐条上的小灯（不写就没有）、st 小站、sw 小站的窗、hub。
// n 帧正好转过 L.length 个吊舱的角度（颜色首尾接得上）。返回 {get(i), ox, oy, n}：drawImage(get(i), 轮心x-ox, 轮心y-oy)。用到哪帧才画哪帧
const WHEELS=new Map();
function wheel(R0,k,bh,n,o){const key=[R0,k,bh,n,o.key||''].join('|');let W=WHEELS.get(key);if(W)return W;const pad=4,ox=R0+pad,oy=R0+pad,cw=2*ox+1,chh=oy+bh+2,frames=[],per=(Math.PI*2/k)*o.L.length;
  const draw=f=>{const cv=mk(cw,chh),a0=f/n*per,cx=ox,cy=oy;into(cv,()=>{
    const lx=Math.round(R0*.58),gb=cy+bh;for(const sd of[-1,1]){line(cx,cy,cx+sd*lx,gb,o.leg);line(cx+sd,cy,cx+sd*(lx+1),gb,o.leg)}const cb=Math.round(cy+bh*.6),cbx=Math.round(lx*.6);R(cx-cbx,cb,cbx*2+1,1,o.leg);
    if(o.st){const sw=Math.max(6,Math.round(R0*.7)),sh=Math.max(3,Math.round(R0*.16));R(cx-(sw>>1),gb-sh,sw,sh,o.st);R(cx-(sw>>1),gb-sh,sw,1,o.rim);for(let i=cx-(sw>>1)+1;i<cx+(sw>>1)-1;i+=2)P1(i,gb-sh+Math.max(1,sh>>1),o.sw)}
    for(let i=0;i<k;i++){const a=a0+i*Math.PI*2/k;line(cx,cy,Math.round(cx+Math.cos(a)*R0),Math.round(cy+Math.sin(a)*R0),o.sp);
      if(o.SL)for(let d=4;d<R0-2;d+=3)P1(Math.round(cx+Math.cos(a)*d),Math.round(cy+Math.sin(a)*d),o.SL[(i+Math.floor(d/3))%o.SL.length])}
    const ring=(r,col)=>{const m=Math.max(24,Math.round(r*7));for(let j=0;j<m;j++){const q=j/m*Math.PI*2;P1(Math.round(cx+Math.cos(q)*r),Math.round(cy+Math.sin(q)*r),col)}};
    ring(R0,o.rim);if(R0>=14){ring(R0-2,o.rim2||o.rim);for(let i=0;i<k*2;i++){const a=a0+(i+.5)*Math.PI/k;P1(Math.round(cx+Math.cos(a)*(R0-1)),Math.round(cy+Math.sin(a)*(R0-1)),o.rim)}}
    if(o.RL){const m=k*(R0>=24?4:2);for(let j=0;j<m;j++){const a=a0+(j+.5)*Math.PI*2/m;P1(Math.round(cx+Math.cos(a)*R0),Math.round(cy+Math.sin(a)*R0),o.RL[j%o.RL.length])}}
    const gs=R0>=26?3:2;for(let i=0;i<k;i++){const a=a0+i*Math.PI*2/k,gx=Math.round(cx+Math.cos(a)*R0),gy=Math.round(cy+Math.sin(a)*R0),lc=o.L[i%o.L.length];P1(gx,gy+1,o.sp);R(gx-(gs>>1),gy+2,gs,gs,lc);if(gs>2)R(gx-1,gy+2,3,1,mix(lc,'#ffffff',.45))}   // 吊舱永远朝下
    disc(cx,cy,2,2,o.leg);P1(cx,cy,o.hub||o.L[0])});return cv};
  W={n,ox,oy,get:i=>{i=((i%n)+n)%n;return frames[i]||(frames[i]=draw(i))}};WHEELS.set(key,W);return W}

/* ---------- 电车 ---------- */
// (x,y) 车身左上角，L 每节长、H 车高、nc 节数。o：c 车身、d 车顶和下沿、w 窗里的灯、k 窗里猫的剪影（不写就不画）、hl 车头灯、dir 往哪边开、x0/x1 只画这一段
function tram(x,y,L,H,nc,o){const RR=(a,b,w,h,c)=>{const l=Math.max(a,o.x0??-1e9),r=Math.min(a+w,o.x1??1e9);if(r>l)R(l,b,r-l,h,c)};
  for(let i=0;i<nc;i++){const cx=x+i*(L+2);RR(cx,y,L,H,o.c);RR(cx,y,L,1,o.d);RR(cx,y+H-1,L,1,o.d);if(i)RR(cx-2,y+(H>>1),2,1,o.d);
    const ww=H>=8?3:2,wh=Math.max(1,H-(H>=8?5:3));for(let wx=cx+2;wx+ww<=cx+L-2;wx+=ww+1){RR(wx,y+2,ww,wh,o.w);if(o.k&&H>=8&&hsh(wx-x,i)<.6)RR(wx+(hsh(i,wx-x)<.5?0:1),y+2+wh-2,2,2,o.k)}}
  if(H>=6){const px=x+Math.round(L*.4);RR(px,y-2,1,2,o.d);RR(px-1,y-3,4,1,o.d)}
  if(o.hl){const hx=o.dir>0?x+nc*(L+2)-3:x;RR(hx,y+H-3,1,1,o.hl)}}
// 一颗红灯一闪一闪：亮的时候中间一点亮红，四边暗红一圈
function redLight(x,y,t,ph,col='#ff4a3a',dim='#8a2a3a'){if(((t*.75+ph)%1)>.42)return;P1(x,y,col);P1(x-1,y,dim);P1(x+1,y,dim);P1(x,y-1,dim);P1(x,y+1,dim)}
return{bay,dith,vgrad,mix,mul,rgb,hex,nz,mk,into,ridge,bld,row,tower,wheel,tram,redLight,WARM,COOL,ACC,winCol}})();

/* ================= 屋顶天边的那片城 ================= */
// RS：画好以后留给每帧用。ov 盖星星用的那份（矮墙、斜屋顶那两块挖掉），pat 落在城上的星星（每帧从 ov 里抠一小块盖上），wins 一亮一灭的窗，reds 红灯，wh 摩天轮，HS 画到地平线以上多高；off、tc、td 是先算好的颜色
let RS=null;
function roofSkyline(x,y,w){const HS=210,b=HS,lt=1,F=(typeof WORLD!=='undefined'&&WORLD.floors||[]).find(f=>f.id==='roof'),TN=NC.rgb(F&&F.tint||'#a8a4dc');
  const T=c=>NC.hex(NC.rgb(c).map((v,i)=>v*255/Math.max(1,TN[i])));   // 想要的颜色先除掉屋顶的 tint
  const cv=NC.mk(w,HS),wins=[],reds=[],wheelX=748;
  const cb=(wx,wy,ww,wh,col)=>{if(wx>=258&&wy>b-48&&wy<b-12&&hsh(wx,wy)<.3)wins.push([wx,wy,ww,wh,col])};
  NC.into(cv,()=>{
    // 地平线上一层城里的灯映出来的光：抖动着往下越来越密
    const glow=T('#22265c');for(let j=0;j<44;j++){const yy=b-44+j,lv=Math.pow(j/44,1.6)*.55;for(let i=0;i<w;i++)if(NC.bay(i,yy)<lv)P1(i,yy,glow)}
    // 远山：左边一座高的雪山露出屋脊，右边一溜雪山；月亮在右上，向右的山坡描一道亮边
    NC.ridge(0,w,b,[[64,104,74],[150,66,58],[318,50,64],[430,58,60],[566,54,76],[660,46,52],[722,66,56],[806,88,70],[896,74,58],[968,60,50]],
      {c:T('#1c2154'),l:T('#262d66'),sn:T('#3c4480'),sl:T('#7880ba'),rim:T('#a4acdc'),rim2:T('#343c78'),lt,s:3,sf:.64});
    // 最远的一层城：淡、偏蓝，窗是一个个小点
    NC.row(250,w,b,{sd:11,w:[5,12],h:[6,24],tall:[.12,28,40],gap:1,f:T('#272d64'),s:T('#22275b'),sw:1,t:T('#363e7a'),g:[2,3,1,1],p:.34,hz:.5,hc:T('#5a5a90'),lt,styles:[0,0,1,2,3,4,5,6]});
    // 左边：电视塔、一座带尖天线的高楼、一座台阶顶的楼，高过斜屋顶的屋脊（屋脊在地平线上面 70）
    NC.bld(20,b,18,94,{f:T('#232860'),s:T('#1d2152'),sw:3,t:T('#3a4280'),r:3,g:[3,4,1,2],p:.5,sd:901,lt,tip:(tx,ty)=>reds.push([tx,ty,.1])});
    NC.bld(232,b,16,78,{f:T('#21265c'),s:T('#1c2050'),sw:3,t:T('#363e7a'),r:7,g:[3,4,1,2],p:.45,sd:902,lt});
    const tp=NC.tower(206,b,170,{c:T('#262b62'),l:T('#4a5294'),w:'#ffe7a0',lt});reds.push([tp.x,tp.y,.55]);
    // 中间一层：高高低低，窗大一点、颜色多一点；摩天轮那块留出来
    NC.row(250,w,b,{sd:23,w:[8,17],h:[12,40],tall:[.1,44,62],gap:2,f:T('#20245a'),s:T('#1b1e4f'),sw:2,t:T('#323a76'),g:[3,4,1,2],p:.42,lt,cb,skip:(bx,bw)=>bx+bw>wheelX-30&&bx<wheelX+30,styles:[0,1,1,2,3,4,5,6,7]});
    // 右边几座高楼，有天线、收顶的挂红灯
    [[812,18,96,3],[856,13,72,2],[900,20,88,7],[940,12,62,1],[688,14,70,2]].forEach(([bx,bw,bh,r],i)=>NC.bld(bx,b,bw,bh,{f:T(i%2?'#1e2258':'#22275e'),s:T('#191c4c'),sw:3,t:T('#38407c'),r,g:[3,4,1,2],p:.5,sd:910+i,lt,cb,tip:(tx,ty)=>{if(r===3||r===2||r===7)reds.push([tx,ty-1,.3*i])}}));
    // 最近的一层：暗，窗亮
    NC.row(250,w,b,{sd:37,w:[10,22],h:[10,30],gap:1,f:T('#191b4a'),s:T('#14163e'),sw:2,t:T('#2c3270'),g:[4,4,2,2],p:.38,lt,cb,cap:(bx,bw)=>bx+bw>wheelX-36&&bx<wheelX+36?13:99,styles:[0,1,4,6,1,0]});
    // 高架：一道桥面，隔一段一根桥墩
    R(250,b-14,w-250,2,T('#262b62'));R(250,b-14,w-250,1,T('#3c4482'));for(let px=262;px<w;px+=46)R(px,b-12,2,12,T('#1e2254'))});
  C.drawImage(cv,x,y-HS);
  // 盖星星：只盖落在城上的那几颗。星星的位置照 map-roof.js 里的 nightStars(0,Y,960,300,t,170,7) 算（那边改了参数，这里跟着改）
  const ov=NC.mk(w,HS),g=ov.getContext('2d');g.drawImage(cv,0,0);g.clearRect(0,b-10,w,10);g.clearRect(0,b-70,250,70);
  const A=g.getImageData(0,0,w,HS).data,op=(px,py)=>px>=0&&py>=0&&px<w&&py<HS&&A[(py*w+px)*4+3]>0,pat=[];
  for(let i=0;i<170;i++){const sx=Math.floor(hsh(i,219)*960)-x,sy=Math.floor(hsh(i,220)*300)-(316-HS);let hit=false;for(let j=-1;j<=1&&!hit;j++)for(let k=-2;k<=2&&!hit;k++)hit=op(sx+k,sy+j);if(hit)pat.push([sx-2,sy-1])}
  // 摩天轮：转一圈两分钟多；吊舱的灯黄粉相间，外圈一圈小灯
  const wh=NC.wheel(30,16,50,16,{key:'roof',rim:T('#6a70b0'),rim2:T('#3e4482'),sp:T('#3a407a'),leg:T('#2c3270'),L:['#ffd84a','#ff8ab0'],RL:['#fff0b0','#8ad8ff'],st:T('#252a60'),sw:'#ffe08a',hub:'#ffffff'});
  RS={HS,b,ov,pat,wins:wins.slice(0,48),reds,wh,wheelX,off:T('#1b1e4c'),tc:T('#3c4280'),td:T('#262a62')}}
// 每帧：盖星星、摩天轮、红灯、窗、电车（y 是地平线，和 roofSkyline 一样）
function roofSkylineLive(x,y,w,t){if(!RS)return;const S=RS,top=y-S.HS;for(const [px,py] of S.pat)C.drawImage(S.ov,px,py,5,3,x+px,top+py,5,3);
  const wf=S.wh.get(Math.floor(t*1.05)),wv=S.wh.oy+40;C.drawImage(wf,0,0,wf.width,wv,x+S.wheelX-S.wh.ox,top+S.b-50-S.wh.oy,wf.width,wv);   // 轮脚在矮墙后面，只画到矮墙上沿
  for(let i=0;i<2;i++){const a=t*.9+i*Math.PI;P1(Math.round(x+S.wheelX+Math.cos(a)*30),Math.round(top+S.b-50+Math.sin(a)*30),'#ffffff')}   // 外圈上跑着的两颗亮点
  S.reds.forEach(([rx,ry,ph])=>NC.redLight(x+rx,top+ry,t,ph));
  for(let i=0;i<S.wins.length;i++){const [wx,wy,ww,wh]=S.wins[i],per=6+hsh(i,71)*9,n=Math.floor(t/per+hsh(i,72));if(hsh(i,n)<.3)R(x+wx,top+wy,ww,wh,S.off)}   // 几扇窗隔一阵灭了又亮
  // 电车：24 秒一趟，从斜屋顶那头开到右边
  const ph=(t%24)/24;if(ph<.62){const L=30,nc=3,tw=nc*(L+2),tx=Math.round(x+250-tw+(w-250+tw)*(ph/.62));NC.tram(tx,top+S.b-21,L,7,nc,{c:S.tc,d:S.td,w:'#ffd98a',hl:'#ffffff',dir:1,x0:x+250,x1:x+w})}}
