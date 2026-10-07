/* 1024 猫咖 · 小电影院：银幕上放的像素小电影《猫猫咖啡馆》（设计见 docs/店内设计.md 第十二节"小电影院"、第八节"看风景"、第四节"片尾彩蛋"）。
   依赖 cat-sprites.js、pixel-text.js、scene-kit.js、world-kit.js、world4-kit.js、house-kit.js、outdoor-kit.js、world-play.js（drawCat3、PAL）、quest-bank.js（CAT_CARDS、SHELF_NAMES）、
   world4-things.js（A.linkDialog）、world4-vista.js（A.vista）、world-eggs.js（A.eggs）。
   - 片子（CINE）：倒数 3、2、1 和片名 → 六段正片 → 片尾卡 → 片尾字幕 → 片尾彩蛋。正片两分钟，连字幕和彩蛋两分半。每段先一张段名卡，再一小段动画，
     演猫猫咖啡馆一样真有的本事，配一行字幕（说法以仓库 README、docs/TIPS.md、docs/features 和 quest-bank.js 的 TIPS 为准）。
     整部画在一张 400×160 的胶片上：一个像素一格、深色描边、抖动着淡入淡出；不动的布景每段画一次存起来。
   - 看风景（A.vista.add('cinema')）：黑黑的放映厅，红丝绒幕布中间是银幕，字幕打在银幕下面，最下面是前排几只猫的后脑勺和你的猫的背影（被银幕照亮一圈边）。
     E、→ 下一段，← 上一段；Esc 回到店里。坐下就从头放；刚用放映机换过卷，就从那一卷放；刚起身又坐下，从刚才那一段接着放。
   - 放完（或者看到片尾卡以后起身）：关掉特写，弹片尾卡（官网、GitHub，点了盖"官网"章）。从头看到尾、一段没跳、连字幕和彩蛋那一段都看完，记彩蛋"片尾彩蛋"。
   - A.cinema：next() 换下一卷、restart() 从头放、chapter() 现在放到哪、playing() 你是不是正坐着看。
   - cinemaScreen(x,y,w,h,t)：店里北墙的银幕，把此刻的画面缩小画进去（按比例放进去，两边留黑），没人看也在循环放；一秒更新十二次。 */
const CINE=(()=>{
const FW=400,FH=160,IT=1.6;   // 胶片的宽高；每段开头的段名卡放 1.6 秒
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const cl=(v,a,b)=>v<a?a:v>b?b:v,seg=(k,a,b)=>cl((k-a)/(b-a),0,1),ez=u=>u*u*(3-2*u),lp=(a,b,u)=>a+(b-a)*u,rd=Math.round;
let T=0,TP=0,fontOk=false;   // T 片子的时钟（猫眨眼、甩尾巴跟着它）；TP 这一段开始时的 T
if(typeof PXT!=='undefined')PXT.ready.then(()=>{fontOk=true});
let WHO=()=>({pal:0,name:'你',face:'normal'});   // 片尾字幕里的"你"：店里接上以后换成你的猫
const NM=p=>CAT_CARDS[p].name,MODEL={1:'Claude',2:'Codex',3:'Gemini',4:'GLM',5:'Antigravity',6:'opencode'},SKILL={1:'架构',2:'Review',3:'设计',4:'找证据',5:'生图',6:'写代码'};

/* ---------- 画笔：都画在当前画布 C 上，坐标是胶片里的像素 ---------- */
const tw=s=>PXT.w(s),tx=(s,x,y,col='#fff4dc',sh)=>PXT.draw(s,rd(x),rd(y),col,sh?{shadow:sh}:{}),txc=(s,cx,y,col,sh)=>tx(s,cx-tw(s)/2,y,col,sh);
// n 倍大的像素中文（片名、段名、倒数）：先画影子
function bigK(s,x,y,col,sh,n=2){const g=PXT.get(s,col);x=rd(x);y=rd(y);if(sh){const q=PXT.get(s,sh);C.drawImage(q,x+n,y+n,q.width*n,q.height*n)}C.drawImage(g,x,y,g.width*n,g.height*n);return g.width*n}
const big=(s,x,y,col,sh)=>bigK(s,x,y,col,sh,2),bigW=s=>tw(s)*2;
// 一只猫：p 毛色序号（1～6 是店猫），(x,y) 脚底；k 姿态，ex 表情，t0 一次性动作（舔爪、慢眨眼……）从这一段的第几秒开始，yarn 抱着的毛线球的颜色
const CO={k:'sit',pal:0,face:'R',o:0,t0:null,ex:null,def:'normal',mirror:false,yarn:null,alpha:1};
function kat(p,x,y,k='sit',ex=null,face='R',t0=null,yarn=null){const me=WHO();CO.k=k;CO.pal=p;CO.ex=ex;CO.def=p>=1&&p<=6?PERSONA[p].face:p===me.pal?me.face:'normal';CO.face=face;CO.t0=t0==null?null:TP+t0;CO.yarn=yarn;return drawCat3(C,CO,rd(x),rd(y),T)}
// 从 x0 走到 x1（a～b 秒），走到了就 end（默认坐下）
function walk(p,x0,x1,y,k,a,b,ex=null,end='sit'){const u=seg(k,a,b),go=u>0&&u<1;return kat(p,lp(x0,x1,u),y,go?(x1>x0?'walkR':'walkL'):end,go?null:ex)}
const arc=(x0,y0,x1,y1,h,u)=>[lp(x0,x1,u),lp(y0,y1,u)-h*4*u*(1-u)];
const emo=(x,y,kind)=>drawEmote(C,rd(x),rd(y),kind,T);
const ball=(x,y,ci=0,r=3)=>yarnBall(rd(x),rd(y),r,ci,Math.floor(T*8));
// 一张纸（便签、卡片）：深色描边，右下一道影子
function card(x,y,w,h,fill='#fff8e8'){x=rd(x);y=rd(y);w=rd(w);h=rd(h);alpha(.4,()=>R(x+2,y+2,w,h,'#000'));R(x,y,w,h,OL);R(x+1,y+1,w-2,h-2,fill);R(x+1,y+h-2,w-2,1,'#e8dcc8')}
// 小名牌：深底浅字，(cx,y) 是上边的中点（不出画面）
function chip(s,cx,y,bg='#241a2e',fg='#fff4dc'){const w=tw(s)+8,x=rd(cl(cx-w/2,2,FW-w-2));R(x+1,y,w-2,15,bg);R(x,y+1,w,13,bg);tx(s,x+4,y-1,fg);return w}
// 说话的泡泡：尖朝下指着 (x,y)
function bubble(x,y,s,col='#241a2e'){x=rd(x);y=rd(y);const w=tw(s)+10,h=17,x0=rd(cl(x-w/2,2,FW-w-2)),y0=y-h-3;R(x0+1,y0,w-2,h,OL);R(x0,y0+1,w,h-2,OL);R(x0+1,y0+1,w-2,h-2,'#fff8e8');
  grid(x-3,y0+h-1,["oFFFFFo",".oFFFo.","..oFo..","...o..."],{o:OL,F:'#fff8e8','.':null});tx(s,x0+5,y0,col)}
// 想事情的泡泡：两颗小圆点，顶上一朵云，云里坐着它想到的那只猫
function thinkOf(x,y,p){disc(x,y,1,1,OL);disc(x+4,y-5,2,2,OL);P1(x+4,y-5,'#fff8e8');const cx=x+16,cy=y-22;disc(cx,cy,16,13,OL);disc(cx,cy,15,12,'#fff8e8');kat(p,cx,cy+10,'sit','happy')}
// 一只小虫子（bug）：六条腿一抖一抖
const BUG=[[".o...o.","..ooo..","oorrroo",".orrro.","o.ooo.o"],["o.....o","..ooo..",".orrro.","oorrroo","..ooo.."]];
const bug=(x,y)=>grid(rd(x)-3,rd(y)-4,BUG[Math.floor(T*10)%2],{o:'#241a2e',r:'#e0533d','.':null});
// 交接的信封（sealed 盖了红火漆）
function envelope(x,y,sealed){x=rd(x);y=rd(y);R(x,y,13,9,OL);R(x+1,y+1,11,7,'#fff8e8');line(x+1,y+1,x+6,y+5,'#c8b8a8');line(x+11,y+1,x+6,y+5,'#c8b8a8');if(sealed){disc(x+6,y+5,2,2,'#e0533d');P1(x+6,y+4,'#ff9a8a')}}
// 一张写着 PR 的小纸（GitHub 来的）
function prNote(x,y){x=rd(x);y=rd(y);noteCard(x-8,y-6,16,12);R(x-6,y-4,12,7,'#fff8e8');txt('PR',x-3,y-3,'#5a4a6a')}
// 竖着的渐变，交界处 4 行抖动
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],bay=(x,y)=>(BAY[(y&3)*4+(x&3)]+.5)/16;
function vgrad(x,y,w,h,cols){const n=cols.length;for(let i=0;i<n;i++){const y0=rd(y+h*i/n),y1=rd(y+h*(i+1)/n);R(x,y0,w,y1-y0,cols[i])}
  for(let i=1;i<n;i++){const yb=rd(y+h*i/n);for(let yy=yb-2;yy<yb+2;yy++)for(let xx=x;xx<x+w;xx++){const on=bay(xx,yy)<(yy-yb+2.5)/4;if(yy<yb&&on)P1(xx,yy,cols[i]);else if(yy>=yb&&!on)P1(xx,yy,cols[i-1])}}}
// 抖动着暗下去：lv 0 不变，1 全黑（4×4 的抖动图样铺满一块）
const PATS=new WeakMap();
function pat(n,col){let m=PATS.get(C);if(!m)PATS.set(C,m={});const key=n+col;if(!m[key]){const c=mk(4,4),x=c.getContext('2d');x.fillStyle=col;for(let i=0;i<16;i++)if(BAY[i]<n)x.fillRect(i&3,i>>2,1,1);m[key]=C.createPattern(c,'repeat')}return m[key]}
function dim(lv,x=0,y=0,w=FW,h=FH,col='#000'){const n=rd(cl(lv,0,1)*16);if(n<=0)return;if(n>=16){R(x,y,w,h,col);return}C.fillStyle=pat(n,col);C.fillRect(x,y,w,h)}
// 从上往下照的一束光（抖动着的梯形）
function cone(cx,y0,y1,w0,w1,col,lv){for(let y=y0;y<y1;y++){const w=rd(lp(w0,w1,(y-y0)/(y1-y0)));dim(lv,rd(cx-w/2),y,w,1,col)}}
// 3×5 的像素字母，放大 s 倍，lie 时向右躺倒（片尾彩蛋里 THE END 被猫扑倒）
function glyph(ch,x,y,s,col,lie){const f=FONT[ch];if(!f)return;for(let i=0;i<15;i++)if(f[i]==='1'){const c=i%3,r=Math.floor(i/3);if(lie)R(x+(4-r)*s,y+c*s,s,s,col);else R(x+c*s,y+r*s,s,s,col)}}
// 不动的布景：每段画一次存起来（字体没加载好之前不存，免得字用系统字体画上去）
const BG={};function back(id,f){let c=BG[id];if(!c){c=mk(FW,FH);const o=C;use(c.getContext('2d'));try{f()}finally{use(o)}if(fontOk)BG[id]=c}C.drawImage(c,0,0)}
const room=(wl,fl,fy)=>{wl(0,0,FW,fy);fl(0,fy,FW,FH-fy);R(0,fy,FW,1,'#4a2e22')};
const navyWall=(x,y,w,h)=>{R(x,y,w,h,'#3c4670');for(let i=x+6;i<x+w;i+=24)R(i,y,1,h-8,'#353e64');R(x,y+h-8,w,8,'#2a3050');R(x,y+h-8,w,1,'#5a6690')};

/* ---------- 段名卡：黑底双线框，"第几段"和两倍大的段名 ---------- */
const CN=['','一','二','三','四','五','六'];
function inter(P,k){R(0,0,FW,FH,'#150d14');const L=(x,y,w,h,c)=>{R(x,y,w,1,c);R(x,y+h-1,w,1,c);R(x,y,1,h,c);R(x+w-1,y,1,h,c)};L(12,10,FW-24,FH-20,'#8a6a4a');L(16,14,FW-32,FH-28,'#4e3a30');
  for(const [x,y] of [[12,10],[FW-13,10],[12,FH-11],[FW-13,FH-11]])grid(x-2,y-2,["..o..",".ooo.","oo.oo",".ooo.","..o.."],{o:'#c8a878','.':null});
  txc('第'+CN[P.no]+'段',FW/2,38,'#c8a878');big(P.n,FW/2-bigW(P.n)/2,58,'#fff4dc','#5a2a3a');
  const y=104;for(let x=FW/2-52;x<FW/2+42;x++)P1(x,y+rd(Math.sin(x*.35)),YARN[P.no%5][0]);yarnBall(FW/2+47,y,3,P.no%5,Math.floor(T*4));
  dim(1-seg(k,0,.3));dim(seg(k,IT-.3,IT))}

/* ================= 片名：倒数 3、2、1，六只店猫走上台，片名一个字一个字掉下来 ================= */
let SWP=null;   // 倒数的扫针：24 张，转一圈
function sweeps(){const r=60,n=24,L=[];for(let s=0;s<n;s++){const c=mk(r*2,r*2),x=c.getContext('2d'),im=x.createImageData(r*2,r*2),d=im.data,lim=(s+1)/n;
  for(let j=0;j<r*2;j++)for(let i=0;i<r*2;i++){const dx=i-r+.5,dy=j-r+.5;if(dx*dx+dy*dy>r*r)continue;let a=Math.atan2(dx,-dy)/(Math.PI*2);if(a<0)a+=1;if(a>lim)continue;const o=(j*r*2+i)*4;d[o]=158;d[o+1]=146;d[o+2]=124;d[o+3]=255}
  x.putImageData(im,0,0);L.push(c)}return L}
function leader(k){if(!SWP)SWP=sweeps();const n=Math.min(2,Math.floor(k/.8)),u=(k-n*.8)/.8,f=Math.floor(k*12);R(0,0,FW,FH,'#bdb19c');C.drawImage(SWP[Math.min(23,Math.floor(u*24))],FW/2-60,FH/2-60);
  back('leader',()=>{ring(FW/2,FH/2,60,'#3a3028');ring(FW/2,FH/2,59,'#3a3028');ring(FW/2,FH/2,50,'#3a3028');R(0,FH/2,FW,1,'#3a3028');R(FW/2,0,1,FH,'#3a3028');dim(.5,0,0,FW,8,'#3a3028');dim(.5,0,FH-8,FW,8,'#3a3028')});
  const d=String(3-n);bigK(d,FW/2-tw(d)*2,FH/2-30,'#241c18','#8a7c68',4);
  for(let j=0;j<2;j++)if(hsh(f,j)<.6)R(rd(hsh(f,j+5)*FW),0,1,FH,'#e8e0d0');for(let j=0;j<10;j++)P1(rd(hsh(f,j+20)*FW),rd(hsh(f,j+40)*FH),'#3a3028')}
const TITLE='猫猫咖啡馆',WIRE=x=>24+rd(Math.sin(x/FW*Math.PI*5)*3);
function titleScene(q){back('title',()=>{vgrad(0,0,FW,138,['#0e0c26','#151236','#1d1844','#272052','#33285e']);for(let i=0;i<70;i++)P1(rd(hsh(i,31)*FW),rd(hsh(i,32)*120),hsh(i,33)<.3?'#8a86c0':'#5a5890');
    moonPx(336,58,8);skyline(0,138,FW,0);floorPlanks(0,138,FW,22,'plum');R(0,138,FW,1,'#7e5e80');for(let x=0;x<FW;x++)P1(x,WIRE(x),'#4a3a4a')});
  nightStars(0,0,FW,100,T,22,3);
  // 台口一串彩灯
  for(let i=0;i<20;i++){const x=10+i*20;festoonBulb(x,WIRE(x),FEST_COL[i%5],(Math.floor(T*3)+i)%4!==0)}
  // 片名：一个字一个字掉下来，弹一下
  if(q>2.0){let x=FW/2-bigW(TITLE)/2;[...TITLE].forEach((ch,i)=>{const a=2.0+i*.14,u=seg(q,a,a+.35);if(q>=a){const y=42-(1-u)*(1-u)*42-rd(Math.sin(seg(q,a+.35,a+.55)*Math.PI)*3);big(ch,x,y,'#fff4dc','#5a2a4a')}x+=bigW(ch)});
    if(q>2.9){txt('CLOWDER AI',FW/2-39,80,'#5a2a4a',2);txt('CLOWDER AI',FW/2-40,79,'#ffd84a',2)}
    if(q>2.7&&q<3.6)for(let i=0;i<6;i++)spark(rd(FW/2-70+hsh(i,7)*140),rd(38+hsh(i,8)*40),T+i*.3)}
  // 六只店猫依次走上台，坐成一排；片名掉下来的时候抬头看
  for(let i=0;i<6;i++){const p=i+1,a=.15+i*.26,x1=FW/2-75+i*30,sit=q>a+1.25;walk(p,-14,x1,152,q,a,a+1.25,sit&&q>2.6&&q<3.4?'lookUp':null)}
  dim(1-seg(q,0,.3))}

/* ================= 第一段：每只猫都是它自己（身份、能力画像；封印交接以后，记忆不断） ================= */
function idCard(p,x,y){const c=PAL[p];card(x,y,56,66);R(x+1,y+1,54,4,c.collar);disc(x+28,y+1,2,2,OL);disc(x+28,y+1,1,1,'#e0533d');
  txc(NM(p),x+28,y+6,'#3a2630');txc(CAT_CARDS[p].breed,x+28,y+20,'#8a6a5a');
  const m=MODEL[p].toUpperCase(),mw=txtW(m)+6,mx=rd(x+28-mw/2);R(mx,y+37,mw,9,c.collar);txt(m,mx+3,y+39,'#fff4dc');txc(SKILL[p],x+28,y+47,'#5a4a6a')}
const SIG={1:'slowBlink',2:'lick',3:'meow',4:'sit',5:'happy',6:'sleep'};
function whoA(k){back('whoA',()=>{wallPlaster(0,0,FW,122,'#f2d8bc','#e8c8a6');R(0,114,FW,8,'#9a6448');R(0,114,FW,1,'#b87a58');floorHerring(0,122,FW,38);R(0,122,FW,1,'#4a2e22');bunting(0,FW,1,80)});
  for(let i=0;i<6;i++){const p=i+1,x=8+i*65,a=IT+.3+i*.45;if(k>=a)idCard(p,x,22-rd(Math.sin(seg(k,a,a+.3)*Math.PI)*6));
    const on=k>=a&&k<a+2.8;kat(p,x+28,150,on?SIG[p]:'sit',on&&p===4?'focus':null,'R',on?a:null)}
  dim(seg(k,9.0,9.4))}
function whoB(k){back('whoB',()=>{R(0,0,FW,FH,'#241a2e');navyWall(2,15,FW-4,103);floorRubber(2,118,FW-4,FH-120);R(2,118,FW-4,1,'#2a3050');
    R(0,0,FW,15,'#4a3e66');R(0,14,FW,1,OL);[['#e0533d',8],['#ffd84a',15],['#7ee08a',22]].forEach(([c,x])=>disc(x,7,2,2,c));
    pegboard(26,32,56,40,0);plant(318,96,0);desk(130,100,124);tx('上下文',150,22,'#c8d0f0');R(194,26,100,10,OL);R(195,27,98,8,'#2a2238')});
  const s2=k>=14.6;tx(s2?'session 2':'session 1',34,-1,'#fff4dc');if(s2)chip('新',tw('session 2')+48,0,'#e0533d');serverRack(350,54,T,k>9.8&&k<13.2?1:0);
  // 上下文条：越写越满，满了一闪一闪；新 session 从头来
  const f=k<14.6?seg(k,9.8,13.2):seg(k,16.3,18.6)*.28,full=k>=13.2&&k<14.6,col=f<.6?'#7ee08a':f<.85?'#ffd84a':'#e0533d';if(!(full&&Math.floor(T*6)%2))R(195,27,rd(98*f),8,col);
  monitor(194,83,T,{mode:'code',seed:3});keyboard(197,106,T,(k>9.8&&k<13.2)||k>16.3?1:0);
  // 交接的信：写好、盖火漆、收进小木盒；新 session 一开，从盒子里拿出来读
  const bx=232,open=k>=15.3;box(bx,97,18,12,'#a86e44');R(bx+1,98,16,1,'#c98d5c');if(open){R(bx,93,18,3,OL);R(bx+1,94,16,1,'#c98d5c')}else{R(bx,96,18,2,OL);R(bx+8,99,2,2,'#e8b83a')}
  if(k>=13.4&&k<14.4){const u=seg(k,14.0,14.35);envelope(lp(178,bx+2,u),lp(100,96,u)-rd(Math.sin(u*Math.PI)*6),k>=13.85);
    if(k>=13.6&&k<13.9){const y=rd(lp(70,92,seg(k,13.6,13.85)));R(176,y,17,17,OL);R(177,y+1,15,15,'#c8402e');tx('封',179,y,'#fff4dc')}}
  if(k>=15.4){const u=seg(k,15.4,15.9),[x,y]=arc(bx+2,94,180,100,12,u);envelope(x,y,true)}
  const ex=k<13.2?'focus':k<14.6?'surprise':k<15.9?'lookDown':'happy',top=kat(1,166,109,'sit',ex);if(k>=15.9&&k<17)emo(166,top-2,'bang');
  if(k<14.6)dim(seg(k,14.25,14.6));else dim(1-seg(k,14.6,15.1));dim(1-seg(k,9.4,9.8))}

/* ================= 第二段：@ 谁谁来（另起一行 @ 才算；谁持球谁负责，按画像传球） ================= */
const L1='帮我把登录页重新设计一下 ',TOK='@砚砚';
function atScene(k){back('at',()=>{room((x,y,w,h)=>wall(x,y,w,h,'cream'),floorHerring,134);mat(12,134,36);windowW(332,24,56,44,0,'night');curtains(332,24,56,44);plant(64,110,0);catFrames(150,80,[[0,1],[24,3],[48,6]])});
  door(22,94,T,{flap:k>1.85&&k<2.4?1:0,tod:'night'});
  // 便签从门上的投递口塞进来，飞上去摊开
  const CX=96,CY=8,CW=220,CH=50;
  if(k>=1.9&&k<2.5){const [x,y]=arc(33,114,CX+CW/2,CY+CH/2,30,seg(k,1.9,2.5));noteCard(rd(x)-8,rd(y)-6,16,12)}
  if(k>=2.5){const u=ez(seg(k,2.5,2.8)),w=lp(16,CW,u),h=lp(12,CH,u);card(CX+CW/2-w/2,CY+CH/2-h/2,w,h);
    if(u>=1){const w1=tw(L1),w2=tw(TOK),x0=CX+10,rv=seg(k,2.8,4.2)*(w1+w2);C.save();C.beginPath();C.rect(x0,CY+4,rv,18);C.clip();tx(L1,x0,CY+4,'#3a2630');C.restore();
      const m=ez(seg(k,6.3,7.0)),tx0=lp(x0+w1,x0,m),ty0=lp(CY+4,CY+24,m);
      if(rv>w1){C.save();C.beginPath();C.rect(x0+w1,CY+4,rv-w1,18);if(m>0)C.rect(0,0,FW,FH);C.clip();tx(TOK,tx0,ty0,'#4a7fd0');C.restore()}
      if(k>=4.3&&k<6.3){for(let i=0;i<w2;i++)P1(x0+w1+i,CY+19+(i>>1)%2,'#e0533d');line(x0+w1+w2+3,CY+7,x0+w1+w2+9,CY+13,'#e0533d');line(x0+w1+w2+9,CY+7,x0+w1+w2+3,CY+13,'#e0533d')}
      if(k>=7.0)R(x0,CY+39,w2,1,'#ffd84a')}}
  // 球：从 @砚砚 里蹦出来，落到砚砚怀里；砚砚想了想（设计的活儿，烁烁最拿手），@烁烁 传过去
  const XB=84,XX=168,XY=250,XS=334,Y=152;let held=0;
  if(k>=7.3&&k<8.3){const [x,y]=arc(CX+30,CY+44,XY,Y-12,26,seg(k,7.3,8.3));ball(x,y,0,4)}
  if(k>=13.4&&k<14.4){const [x,y]=arc(XY+4,Y-12,XS,Y-12,44,seg(k,13.4,14.4));ball(x,y,0,4)}
  if(k>=8.3&&k<13.4)held=XY;else if(k>=14.4)held=XS;
  kat(5,XB,Y,'sit',k>1.8&&k<3.2?'lookUp':null);kat(1,XX,Y,'sit',(k>7.2&&k<8.6)||(k>13.3&&k<14.8)?'lookR':null);
  const ty=kat(2,XY,Y,held===XY?'hold':'sit',k>=11&&k<13.4?'focus':null);const ts=kat(3,XS,Y,held===XS?'hold':'sit',held===XS?'sparkle':null);
  if(k>=4.3&&k<6.0)emo(XY,ty-2,'q');
  if(held)downArrow(held,(held===XY?ty:ts)-14+rd(Math.sin(T*6)),'#ffd84a');
  if(k>=11&&k<12.3)thinkOf(XY+6,ty-4,3);
  if(k>=12.3&&k<13.6)bubble(XY,ty-2,'@烁烁','#4a7fd0')}

/* ================= 第三段：Claude 写，GPT 审（跨家族互审，bug 被另一只猫抓住） ================= */
const PX=150,PY=16,PW=124,PH=86,YX=300;
function prPaper(k){card(PX,PY,PW,PH);R(PX+1,PY+1,PW-2,11,'#e8e0f0');txt('PR 42',PX+5,PY+4,'#5a4a6a');const fixed=k>=15;
  [[0,62,'#5B9BD5'],[6,74,'#9B7EBD'],[6,48,'#e8b83a'],[12,66,'#e0533d'],[6,54,'#5B9BD5'],[0,30,'#9B7EBD'],[6,44,'#e8b83a']].forEach(([ind,len,col],i)=>{const y=PY+16+i*9;
    if(i===3&&fixed){R(PX+3,y-2,PW-6,6,'#d8f4dc');col='#3a8a5a'}R(PX+8+ind,y,len,2,col);R(PX+8+ind+len+3,y,10,2,'#c8c0d0')});
  if(k>=15.4){const s=k<15.55?1:0,x=PX+64-s*2,y=PY+56-s*2;R(x,y,48+s*4,20+s*4,'#3a8a5a');R(x+2,y+2,44+s*4,16+s*4,'#f4fff4');txt('LGTM',x+9+s*2,y+5+s*2,'#3a8a5a',2)}}
function revScene(k){back('rev',()=>{room(navyWall,floorRubber,128);pegboard(150,28,64,40,0);ciLight(232,30,0,'pass');desk(16,100,112)});
  serverRack(356,64,T,1);monitor(68,83,T,{mode:'code',seed:7});keyboard(71,106,T,(k>1.8&&k<4.5)||(k>13.4&&k<15.2)?1:0);
  const XL=YX-28,jump=k>=11.2&&k<11.7,[jx,jy]=arc(YX,152,XL,152,16,seg(k,11.2,11.7)),xx=k<11.2?YX:jump?jx:XL,yy=jump?jy:152;
  // PR 从桌上飞到砚砚面前，再摊开成一张大纸；放大镜一行行看
  if(k>=4.6&&k<5.9){const [x,y]=arc(96,96,YX-16,138,40,seg(k,4.6,5.6));prNote(x,y)}
  if(k>=5.9){const u=ez(seg(k,5.9,6.3));if(u<1)card(lp(YX-16,PX,u),lp(130,PY,u),lp(16,PW,u),lp(12,PH,u));else prPaper(k)}
  if(k>=6.4&&k<11){const u=seg(k,6.4,9.2)*3.99,li=Math.floor(u),fx=u-li,cx=rd(PX+16+fx*(PW-36)),cy=PY+17+li*9;ring(cx,cy,7,OL);ring(cx,cy,6,'#a8c8e0');alpha(.3,()=>disc(cx,cy,5,5,'#ffffff'));line(cx+5,cy+5,cx+10,cy+10,OL);line(cx+6,cy+5,cx+11,cy+10,'#8a5a3a')}
  // bug 从第四行爬出来，掉到地上往外跑，砚砚扑过去按住
  if(k>=9.4&&k<11.75){let x,y;if(k<10.8){const u=seg(k,9.4,10.8);x=lp(PX+84,PX+PW-6,u);y=lp(PY+44,PY+PH-2,u)}else if(k<11.2){const u=seg(k,10.8,11.2);x=PX+PW-6+u*6;y=lp(PY+PH-2,150,u*u)}else{x=lp(PX+PW,XL,seg(k,11.2,11.7));y=150}bug(x,y)}
  if(k>=11.7&&k<12.2)puff(XL,146,seg(k,11.7,12.2));
  const t1=kat(1,44,109,k>=15.8?'happy':'sit',k>=12.4&&k<13.4?'surprise':k>=13.4&&k<15.8?'focus':null);if(k>=12.4&&k<13.4)emo(44,t1-2,'bang');
  const pose=jump?'leap':k>=11.8&&k<13.4?'alert':'sit',t2=kat(2,xx,yy,pose,k>=6.4&&k<11?'focus':k>=15.8?'smug':null,'L');
  if(k>=2)chip('布偶猫 · Claude',44,t1-20,'#4a3e66');if(k>=2.4&&k<11.2)chip('缅因猫 · GPT',xx,t2-19,'#35593a')}

/* ================= 第四段：图书馆（决策、教训、证据都收着；"之前我们怎么定的"，猫自己去查） ================= */
const ASK='之前我们怎么定的？';
function libScene(k){back('lib',()=>{room(libWall,floorParquet,124);[0,1,2].forEach(i=>{const x=16+i*84;tallShelf(x,24,76,98,SHELF_COLS[i],'');R(x+6,4,64,17,OL);R(x+7,5,62,15,'#4a3428');txc(SHELF_NAMES[i],x+38,4,'#e8c874')});
    ladder(60,28,136);readTable(292,114,84,1)});
  // 问题：一张便签从左边飞进来，摊开在右上角
  const QX=268,QY=6,QW=126,QH=28;if(k>=1.8&&k<2.4){const [x,y]=arc(-8,70,QX+QW/2,QY+QH/2,24,seg(k,1.8,2.4));noteCard(rd(x)-8,rd(y)-6,16,12)}
  if(k>=2.4){const u=ez(seg(k,2.4,2.6));card(lp(QX+QW/2-8,QX,u),lp(QY+QH/2-6,QY,u),lp(16,QW,u),lp(12,QH,u));if(u>=1){C.save();C.beginPath();C.rect(QX+6,QY+4,seg(k,2.6,3.6)*tw(ASK),18);C.clip();tx(ASK,QX+7,QY+5,'#3a2630');C.restore()}}
  // 小狸花跑到"决策日志"那一架，爬梯子，抽出一本书，书飞到阅读桌上
  if(k>=8)bookGap(36,61);if(k>=8&&k<8.8){const [x,y]=arc(36,61,330,108,40,seg(k,8,8.8));book(rd(x),rd(y),1)}if(k>=8.8&&k<11)book(330,109,1);
  let x=344,y=152,pose='sit',ex=null,top=0;
  if(k>=3.8&&k<4.4)ex='surprise';else if(k>=4.4&&k<6.3){walk(4,344,64,152,k,4.4,6.3);x=null}
  else if(k>=6.3&&k<8.6){const h1=seg(k,6.3,6.8),h2=seg(k,7.0,7.5);if(k<6.8)[x,y]=arc(64,152,58,110,10,h1);else if(k<7.0){x=58;y=110}else if(k<7.5)[x,y]=arc(58,110,58,70,10,h2);else{x=58;y=70}pose=(k<6.8||(k>=7&&k<7.5))?'leap':'sit';ex='lookL'}
  else if(k>=8.6&&k<9.2){[x,y]=arc(58,70,70,152,8,seg(k,8.6,9.2));pose='leap'}else if(k>=9.2&&k<10.6){walk(4,70,318,152,k,9.2,10.6);x=null}else if(k>=10.6){x=318;ex=k>=12?'happy':null}
  if(x!=null){top=kat(4,x,y,pose,ex,'L');if(k>=3.8&&k<4.6)emo(x,top-2,'bang')}
  // 翻开的书：大大地摊在中间（左页是那天定下来的事，右页是为什么和出处）
  if(k>=11){dim(.5,0,0,FW,FH);const u=ez(seg(k,11,11.3)),bx=106,by=22,bw=184,bh=82,hw=bw/2;card(lp(180,bx,u),lp(60,by,u),lp(40,bw,u),lp(20,bh,u),'#f4ecd8');
    if(u>=1){R(bx+hw,by+1,1,bh-2,'#c8b8a0');R(bx+hw+1,by+1,1,bh-2,'#e0d4bc');tx('9 月 12 日',bx+9,by+5,'#8a7a6a');tx('定了：',bx+9,by+22,'#8a7a6a');tx('登录用方案 B',bx+9,by+39,'#3a2630');
      grid(bx+70,by+62,[".o.o.","ooooo","ooooo",".ooo."],{o:'#e0a0b0','.':null});tx('为什么',bx+hw+9,by+5,'#8a7a6a');[58,70,50].forEach((w,i)=>R(bx+hw+9,by+27+i*8,w,1,'#a89880'));tx('出处 ↗',bx+hw+9,by+58,'#4a7fd0');
      if(k<11.6){const v=seg(k,11.3,11.6),pw=rd(Math.abs(Math.cos(v*Math.PI))*(hw-2));if(v<.5)R(bx+hw,by+1,pw,bh-2,'#fff8e8');else R(bx+hw-pw,by+1,pw,bh-2,'#fff8e8')}}
    if(k>=12.2&&k<15.6&&top)bubble(318,top-2,'找到了：方案 B','#3a2630')}}

/* ================= 第五段：main 永远是绿的（测试 → CI → Review → 合并门禁） ================= */
const RX=[52,118,176,218,304];   // 球停的几处：金哥手边、测试灯、CI 灯、门禁前、并进 main
function ballX(k){const s=[[2.6,3.6,0,1],[4.4,5.2,1,0],[6.8,7.6,0,1],[8.2,8.9,1,2],[9.6,10.3,2,3],[12.2,13.2,3,4]];let x=RX[0];for(const [a,b,i,j] of s){if(k<a)return x;if(k<b)return lp(RX[i],RX[j],ez(seg(k,a,b)));x=RX[j]}return x}
function lamp(x,col,label){disc(x,96,6,6,OL);disc(x,96,5,5,col);if(col!=='#4a3a4a')P1(x-2,94,'#ffffff');R(x-1,102,3,36,OL);R(x,102,1,36,'#8a93a8');R(x-17,110,34,15,OL);R(x-16,111,32,13,'#2f2340');txc(label,x,109,'#fff4dc')}
// 墙上的流水线看板：四格，跑到哪一格哪一格亮（黄是在跑，绿是过了，红是挂了）
const STG=['测试','CI','Review','合并'],ST_COL={off:'#3a3450',run:'#8a7420',ok:'#2f7a4a',bad:'#9a2a2a'};
function stages(k){const tst=k<3.6?'off':k<4.2?'run':k<6.8?'bad':k<7.6?'off':k<8.0?'run':'ok',ci=k<8.9?'off':k<9.4?'run':'ok',rv=k<10.3?'off':k<11.2?'run':'ok',mg=k<11.4?'off':k<12.4?'run':'ok';
  [tst,ci,rv,mg].forEach((s,i)=>{const x=46+i*80,col=s==='run'&&Math.floor(T*6)%2?'#5a4a20':ST_COL[s];R(x,22,60,22,OL);R(x+1,23,58,20,col);R(x+1,23,58,1,'#ffffff30');txc(STG[i],x+30,25,s==='off'?'#8a84a0':'#fff4dc');
    if(s==='ok')grid(x+50,27,["....o","...oo","o.oo.","ooo..",".o..."],{o:'#a8f0b8','.':null});if(s==='bad'){line(x+50,27,x+54,31,'#ffb0a0');line(x+54,27,x+50,31,'#ffb0a0')}
    if(i<3)grid(x+63,29,["o..","oo.","ooo","oo.","o.."],{o:'#8a84a0','.':null})})}
function greenScene(k){back('green',()=>{room(navyWall,floorRubber,124);R(40,16,330,34,OL);R(41,17,328,32,'#232038');R(46,138,FW-46,2,'#8a93a8');for(let x=48;x<FW;x+=8)R(x,140,3,2,'#5a6478');R(36,128,18,12,OL);R(37,129,16,10,'#a86e44')});
  const blink=Math.floor(T*6)%2,Y='#ffd84a',G='#7ee08a',RE='#e0533d',OFF='#4a3a4a';stages(k);
  lamp(118,k<3.6?OFF:k<4.2?(blink?Y:OFF):k<6.8?RE:k<7.6?OFF:k<8.0?(blink?Y:OFF):G,'测试');lamp(176,k<8.9?OFF:k<9.4?(blink?Y:OFF):G,'CI');
  mergeGateBig(226,88,T,{lights:[k>=8.0?1:0,k>=9.4?1:0,k>=11.2?1:0],open:seg(k,11.4,12.2)});
  // main：一根粗粗的绿毛线，球并进去以后一路亮过去
  const glow=k>=13.2;R(292,134,FW-292,6,OL);R(292,135,FW-292,4,'#5B8C5A');for(let x=293;x<FW;x+=4)P1(x,136+(x>>2)%2,'#9ccc98');
  R(372,100,2,34,OL);R(374,100,22,11,OL);R(375,101,20,9,glow?'#7ee08a':'#5B8C5A');txt('MAIN',377,103,'#fff4dc');
  if(glow){for(let i=0;i<5;i++){const x=292+rd((T*70+i*21)%(FW-292));R(x,135,3,4,'#c8f8d0')}if(k<16)for(let i=0;i<5;i++)spark(rd(300+hsh(i,51)*96),rd(118+hsh(i,52)*12),T+i*.37)}
  const bxk=ballX(k);if(k>=2.4&&k<13.2)ball(bxk,134,0,4);if(k>=2.2&&k<2.7)puff(52,130,seg(k,2.2,2.7));if(k>=6.2&&k<6.7)puff(52,130,seg(k,6.2,6.7));
  const kn=(k>=1.8&&k<2.6)||(k>=5.4&&k<6.6),t6=kat(6,30,152,kn?'knead':k>=13.2?'happy':'sit',k>=4.3&&k<5.4?'surprise':null);if(k>=4.6&&k<5.6)emo(30,t6-2,'bang');
  kat(2,206,154,k>=11.2&&k<12.2?'happy':'sit',k>=10.3&&k<11.2?'focus':k>=13.2?'content':null)}

/* ================= 第六段：哪儿都能接球（飞书、钉钉、企业微信、微信、GitHub） ================= */
const IMS=['飞书','钉钉','企业微信','微信','GitHub'],IMC=['#3a7ad0','#2f8ef0','#2f9e6a','#3aa848','#3a3440'],IMP=[5,6,4,3,2];
function imScene(k){back('im',()=>{room((x,y,w,h)=>wall(x,y,w,h,'pink'),floorHerring,134);bunting(0,FW,1,80);
    IMS.forEach((s,i)=>{const x=40+i*80;R(x-30,24,60,18,OL);R(x-29,25,58,16,IMC[i]);txc(s,x,25,'#fff4dc');box(x-26,46,52,38,'#9a6448');R(x-25,47,50,2,'#b87a58');R(x-17,64,34,8,OL);R(x-16,65,32,6,'#241a2e');R(x-16,65,32,1,'#c9a030')})});
  const ciRed=k>=10&&k<13;R(370,88,26,11,OL);R(371,89,24,9,'#2f2340');txt('CI',373,91,'#fff4dc');disc(388,93,3,3,OL);disc(388,93,2,2,ciRed?(Math.floor(T*6)%2?'#e0533d':'#7a2a2a'):'#7ee08a');
  for(let i=0;i<5;i++){const x=40+i*80,p=IMP[i],a=i<4?2.0+i*1.25:7.0,u=seg(k,a,a+.7);let pose='sit',ex=null,dy=0;
    if(k>=a&&k<a+.7){const [bx,by]=arc(x,68,x,136,-12,u);if(i<4)ball(bx,by,i,4);else prNote(bx,by)}
    if(k>=a+.35&&k<a+.75){dy=-rd(Math.sin(seg(k,a+.35,a+.75)*Math.PI)*12);ex='sparkle'}
    if(i<4&&k>=a+.7)pose='hold';if(i===4&&k>=10.8&&k<12.6)pose='alert';
    if(i===4&&k>=12.6){walk(2,x,FW+20,152,k,12.6,13.6);continue}
    const top=kat(p,x,152+dy,k>=14&&i<4?'happy':pose,ex,'R',null,i<4?i:null);if(i===4&&k>=a+.7&&k<10.8)prNote(x+12,144);if(i===4&&k>=10.2&&k<10.8)emo(x,top-2,'bang')}
  if(k>=10.3&&k<10.9){const [bx,by]=arc(360,68,360,128,-10,seg(k,10.3,10.9));ball(bx,by,0,4);txt('!',rd(bx)-1,rd(by)-14,'#e0533d')}}

/* ================= 片尾卡：开源（MIT），官网、GitHub ================= */
function endScene(k){back('end',()=>{vgrad(0,0,FW,140,['#0e0c26','#151236','#1d1844','#272052','#33285e']);for(let i=0;i<60;i++)P1(rd(hsh(i,61)*FW),rd(hsh(i,62)*96),hsh(i,63)<.3?'#8a86c0':'#5a5890');
    R(0,140,FW,20,'#2a2438');R(0,140,FW,1,'#4a4060');for(let x=0;x<FW;x+=16)R(x,148,8,1,'#3a3450');
    // 小店：砖墙、暖黄的大窗（窗里坐着猫）、门、条纹雨棚、门头招牌
    brickWall(132,74,136,66);R(132,74,136,2,OL);R(144,92,60,34,OL);R(146,94,56,30,'#f7e4b0');R(146,94,56,12,'#fff4c8');R(173,94,2,30,'#fff4dc');[[154,124],[186,124]].forEach(([x,y])=>grid(x-3,y-7,["o...o","oo.oo","ooooo","ooooo",".ooo.","ooooo","ooooo"],{o:'#6a4a3a'}));
    for(let i=0;i<9;i++)R(140+i*7,84,7,7,i%2?'#fff4dc':'#e0533d');R(140,91,63,1,OL);R(220,100,26,40,OL);R(222,102,22,38,'#ffe8a8');P1(240,122,'#8a5a3a');
    R(212,78,44,15,OL);R(213,79,42,13,'#8a5a3a');txt('CLOWDER',218,83,'#ffd84a');lampPost(108,104,1);lampPost(288,104,1);
    [['官网 ↗',58],['GitHub ↗',342]].forEach(([s,x])=>{R(x-1,112,3,28,OL);const w=tw(s)+10;R(x-w/2,96,w,17,OL);R(x-w/2+1,97,w-2,15,'#a86e44');R(x-w/2+1,97,w-2,1,'#c98d5c');txc(s,x,96,'#fff4dc')})});
  nightStars(0,0,FW,90,T,24,9);big(TITLE,FW/2-bigW(TITLE)/2,6,'#fff4dc','#5a2a4a');txc('Clowder AI · 开源 · MIT',FW/2,42,'#ffd84a');
  for(let i=0;i<6;i++){const p=i+1,x=FW/2-60+i*24,a=1+i*.18;kat(p,x,156,k>=a&&k<a+3.2?'maneki':'sit')}
  dim(1-seg(k,0,.4));dim(seg(k,7.6,8))}

/* ================= 片尾字幕：出演的六只店猫和家族、你、还有每一只来过的猫 ================= */
function creditLines(){const me=WHO(),L=[],head=s=>L.push({h:26,d:y=>txc(s,FW/2,y+4,'#c8a878')}),gap=h=>L.push({h,d:()=>{}});
  head('出演');for(let p=1;p<=6;p++)L.push({h:26,d:y=>{kat(p,128,y+23);tx(NM(p),146,y+6,'#fff4dc');tx(CAT_CARDS[p].breed+' · '+MODEL[p],202,y+6,'#b8aec8')}});
  gap(16);head('特别出演');L.push({h:26,d:y=>{kat(me.pal,128,y+23);tx('你',146,y+6,'#fff4dc');tx(me.name,202,y+6,'#b8aec8')}});
  gap(16);head('还有');L.push({h:20,d:y=>txc('每一只来过的猫',FW/2,y+2,'#fff4dc')});
  L.push({h:30,d:y=>{for(let i=0;i<9;i++){const p=7+((i*7+3)%54);kat(p,FW/2-96+i*24,y+26,'sit')}}});
  gap(18);L.push({h:20,d:y=>txc('本片拍摄期间，没有一颗毛线球被浪费。',FW/2,y+2,'#8a8098')});gap(14);L.push({h:20,d:y=>txc('猫猫咖啡馆 · Clowder AI',FW/2,y+2,'#ffd84a')});return L}
let CRL=null,CRK='';
function credits(k,dur){R(0,0,FW,FH,'#0a0810');const me=WHO(),key=me.pal+'|'+me.name;if(!CRL||CRK!==key){CRL=creditLines();CRK=key}const H=CRL.reduce((s,l)=>s+l.h,0),sp=(H+FH)/(dur-1.2);
  let y=FH-rd(k*sp);for(const l of CRL){if(y>-40&&y<FH+10)l.d(y);y+=l.h}dim(1-seg(k,0,.4))}

/* ================= 片尾彩蛋：THE END 上来了一个红点 ================= */
const END_T='THE END',GX=x=>FW/2-67+x*20;   // 七个字母，每个 3×5 放大 5 倍，脚踩在 y=140
const FALL=[6.6,7.1,6.2,0,7.5,5.6,4.8];       // 每个字母什么时候被扑倒（空格不算）
function dot(k){if(k<1.6||k>=8.8)return null;if(k<4.0)return[FW/2+rd(Math.sin(k*2.3)*50),118+rd(Math.sin(k*3.7)*12)];if(k<4.8)return[lp(FW/2+20,GX(6)+8,seg(k,4.0,4.8)),lp(118,124,seg(k,4.0,4.8))];
  if(k<8.0){const u=(k-4.8)*1.6;return[FW/2+rd(Math.sin(u*2.1)*110),110+rd(Math.abs(Math.sin(u*3.3))*24)]}return[lp(FW/2-110,-6,seg(k,8.0,8.8)),lp(112,96,seg(k,8.0,8.8))]}
const laser=(x,y)=>{x=rd(x);y=rd(y);alpha(.35,()=>disc(x,y,4,4,'#ff3a3a'));disc(x,y,2,2,'#c81818');disc(x,y,1,1,'#ff5a5a');P1(x,y,'#ffe0e0')};
const RUN=[[1,-20,96,5.0,6.0],[6,-20,150,5.4,6.6],[3,FW+20,230,5.2,6.2],[4,FW+20,320,5.6,6.8],[2,-20,190,6.0,7.2]];   // 别的猫跑进来：[毛色, 从, 到, 开始, 到]
function egg(k){R(0,0,FW,FH,'#0a0810');R(0,140,FW,20,'#140f1c');R(0,140,FW,1,'#2a2238');const f=Math.floor(k*12);for(let j=0;j<6;j++)P1(rd(hsh(f,j+60)*FW),rd(hsh(f,j+70)*FH),'#2a2430');
  if(k<10.4){
    // THE END：一个个被扑倒，躺在地上
    [...END_T].forEach((ch,i)=>{if(ch===' ')return;const a=FALL[i],vis=seg(k,.3,1.2);if(vis<=0)return;const col=k<1.2?['#3a3048','#6a5a78','#a898b8','#e8dcc8'][Math.floor(vis*3.99)]:'#e8dcc8';
      if(k<a||!a)glyph(ch,GX(i),115,5,col);else{const u=seg(k,a,a+.35);if(u<1)glyph(ch,GX(i)+rd(u*8),115+rd(u*u*10),5,col);else glyph(ch,GX(i)+6,125,5,col,true)}});
    for(let i=0;i<7;i++){const a=FALL[i];if(a&&k>=a&&k<a+.5)puff(GX(i)+8,136,seg(k,a,a+.5))}
    const d=dot(k);if(d)laser(d[0],d[1]);
    // 斑斑最爱追红点：从右边跑进来，扑向 D；别的猫也跑进来，一通乱扑；红点跑出银幕，大家愣住
    if(k>=3.0){let x,y=152,pose;if(k<4.0){x=lp(FW+20,300,seg(k,3,4));pose='walkL'}else if(k<4.3){x=300;pose='pounce'}else if(k<4.8){[x,y]=arc(300,152,GX(6)+10,152,26,seg(k,4.3,4.8));pose='leap'}else if(k<8){const u=(k-4.8)*1.6;x=FW/2+rd(Math.sin((u-.4)*2.1)*110);pose=Math.cos((u-.4)*2.1)>0?'walkR':'walkL'}else{x=FW/2-60;pose='sit'}
      kat(5,x,y,pose,k>=8?(k>=9.2?'curious':'lookL'):'sparkle','L',k>=4&&k<4.3?4:null);if(k>=9.2)emo(x,y-23,'q')}
    RUN.forEach(([p,x0,x1,a,b],j)=>{if(k<a)return;const top=k<8?walk(p,x0,x1,152,k,a,b,'surprise'):kat(p,x1,152,'sit',k>=9.2?'curious':'lookL');if(k>=b&&k<b+.6)emo(x1,top-2,'bang');if(k>=9.4&&j%2)emo(x1,top-2,'q')})}
  else{
    // 一束光照下来：六只猫坐成一排，对着你慢慢眨眼
    txt(END_T,FW/2-13,14,'#4a4060');cone(FW/2,0,152,90,210,'#3a3050',.5);R(0,140,FW,1,'#3a3050');
    for(let i=0;i<6;i++){const p=i+1,a=11+i*.18;kat(p,FW/2-75+i*30,152,k>=a&&k<a+2.9?'slowBlink':'sit',k>=a+2.9?'content':null,'R',a)}
    if(k>=13.4&&k<15)for(let i=0;i<3;i++)heartUp(FW/2-60+i*60,128,seg(k,13.4+i*.2,14.8+i*.2));dim(1-seg(k,10.4,10.8))}
  dim(1-seg(k,0,.3));dim(seg(k,15.6,16))}

/* ================= 整部片子 ================= */
// subs：[第几秒, 字幕]；cues：[第几秒, 音效（店里已有的）, 谁叫（meow 用这只猫的声线）]；glow：银幕照到幕布和后脑勺上的光
const PARTS=[
  {id:'title',n:'片名',dur:7.8,glow:'#c8c0f0',subs:[[4.6,'Cats & U：猫猫和你，把想法做成能运行的世界。']],cues:[[.02,'tick'],[.8,'tick'],[1.6,'tick'],[2.45,'whirr'],[4.4,'twinkle'],[5.3,'meow',3]],
    draw(k){if(k<2.4)leader(k);else titleScene(k-2.4);dim(seg(k,7.4,7.8))}},
  {id:'who',no:1,n:'每只猫都是它自己',dur:18.6,glow:'#ffd8b0',subs:[[IT,'每只猫都有自己的身份和能力画像：谁擅长什么，一清二楚。'],[9.6,'上下文快满了，猫会自己"封印"，写好交接——'],[15,'换个新 session 接着干：角色、性格、记忆都不会丢。']],
    cues:[[1.95,'pop'],[2.4,'pop'],[2.85,'pop'],[3.3,'pop'],[3.75,'pop'],[4.2,'pop'],[4.6,'meow',3],[9.9,'clack'],[11.2,'clack'],[13.25,'beep'],[13.85,'stamp'],[14.1,'slide'],[14.45,'click'],[15.35,'click'],[15.95,'ding']],draw:k=>k<9.4?whoA(k):whoB(k)},
  {id:'at',no:2,n:'@ 谁谁来',dur:19,glow:'#ffe0b8',subs:[[IT,'写在句子中间的 @ 不算……'],[6.2,'另起一行、在行首写 @猫名，球就到了那只猫手里。'],[11,'谁持球谁负责；不是自己最擅长的，就按画像传给对的猫。']],
    cues:[[1.9,'rustle'],[2.55,'page'],[4.35,'boop'],[6.35,'slide'],[7.3,'toss'],[8.3,'pop'],[12.3,'meow',2],[13.4,'toss'],[14.4,'pop'],[14.7,'meow',3]],draw:atScene},
  {id:'review',no:3,n:'Claude 写，GPT 审',dur:19,glow:'#c0ccff',subs:[[IT,'写代码的猫和 review 的猫，必须来自不同家族。'],[9.4,'Claude 写，GPT 审：不同的脑子，抓得到不同的 bug。']],
    cues:[[1.9,'clack'],[3.1,'clack'],[4.65,'toss'],[5.95,'page'],[9.45,'scratch'],[11.2,'whoosh'],[11.7,'pop'],[12.4,'ding'],[13.5,'clack'],[15.42,'stamp'],[15.9,'ok']],draw:revScene},
  {id:'lib',no:4,n:'图书馆',dur:18,glow:'#ffd8a0',subs:[[IT,'决策、教训、证据，都收在猫的"图书馆"里。'],[10.6,'说一句"之前我们怎么定的"，猫会自己去查。']],
    cues:[[1.85,'rustle'],[2.45,'page'],[3.85,'meow',4],[6.35,'land'],[7.05,'land'],[8.02,'whoosh'],[8.8,'land'],[9.2,'land'],[11.02,'page'],[12.2,'ding']],draw:libScene},
  {id:'green',no:5,n:'main 永远是绿的',dur:18.4,glow:'#c0f0c8',subs:[[IT,'测试、CI、Review、合并门禁，一步都不少。'],[11.4,'红了就停下来修，main 永远是绿的。']],
    cues:[[2.25,'knit'],[4.2,'no'],[5.0,'meow',6],[6.25,'knit'],[8.0,'ok'],[9.4,'ok'],[11.2,'ding'],[11.45,'clunk'],[13.2,'twinkle'],[13.4,'goal']],draw:greenScene},
  {id:'im',no:6,n:'哪儿都能接球',dur:17,glow:'#ffd0e0',subs:[[IT,'飞书、钉钉、企业微信、微信……在哪儿都能把球交给猫。'],[9.4,'GitHub 上来了新 PR、CI 挂了，猫也会自己发现。']],
    cues:[[2.7,'pop'],[3.95,'pop'],[5.2,'pop'],[6.45,'pop'],[7.7,'pop'],[10.05,'beep'],[10.35,'beep'],[10.8,'ding'],[14,'meow',5]],draw:imScene},
  {id:'end',n:'片尾',dur:8,glow:'#ffe0a0',subs:[[.4,'Clowder AI 是开源的（MIT）：代码、Skills、家规都在 GitHub 上。']],cues:[[.3,'bell'],[1.1,'fanfare']],draw:endScene},
  {id:'credits',n:'片尾字幕',dur:16,glow:'#a8a0c8',subs:[],cues:[],draw:k=>credits(k,16)},
  {id:'egg',n:'片尾彩蛋',dur:16,glow:'#ffb8b8',subs:[[11.2,'猫对你慢慢眨眼，是在说：喜欢你。']],cues:[[1.65,'boop'],[3.1,'meow',5],[4.3,'whoosh'],[4.8,'bump'],[5.6,'bump'],[6.2,'bump'],[6.6,'bump'],[7.1,'bump'],[7.5,'bump'],[8.3,'whoosh'],[10.0,'boop'],[11.3,'twinkle'],[13.5,'meow',1]],draw:egg}];
PARTS.forEach((P,i)=>{P.i=i;P.label=P.no?`第 ${P.no}/6 段 · ${P.n}`:P.n});
const END=PARTS.findIndex(P=>P.id==='end'),EGG=PARTS.length-1,TOTAL=PARTS.reduce((s,P)=>s+P.dur,0);

/* ---------- 放：F 是此刻放到哪（店里一直在走；看风景的时候由店里那一段推） ---------- */
const F={i:0,k:0,t:0,pick:-1e9,pickI:0,live:-1e9};   // pick 放映机上次换卷的时刻，pickI 换到第几卷；live 店里最近一次推片子的时刻
function go(i){F.i=((i%PARTS.length)+PARTS.length)%PARTS.length;F.k=0}
function adv(dt){F.t+=dt;F.k+=dt;let n=0;while(F.k>=PARTS[F.i].dur&&n++<20){F.k-=PARTS[F.i].dur;F.i=(F.i+1)%PARTS.length}}
// 没有店在推（样页、单独预览）：按 t 循环放
function loopAt(t){let k=((t%TOTAL)+TOTAL)%TOTAL,i=0;while(k>=PARTS[i].dur){k-=PARTS[i].dur;i++}F.i=i;F.k=k;F.t=t}
let FC=null,rI=-1,rK=-1;
function render(i,k,t=F.t){if(!FC)FC=mk(FW,FH);const P=PARTS[i],x=FC.getContext('2d'),o=C;x.imageSmoothingEnabled=false;use(x);T=t;TP=t-k;
  try{if(P.no){if(k<IT)inter(P,k);else{P.draw(k);dim(1-seg(k,IT,IT+.35));dim(seg(k,P.dur-.35,P.dur))}}else P.draw(k)}finally{use(o)}rI=i;rK=k;return FC}
const frame=()=>rI===F.i&&rK===F.k&&FC?FC:render(F.i,F.k,F.t);
const sub=(i,k)=>{const P=PARTS[i];if(P.no&&(k<IT||k>P.dur-.3))return'';let s='';for(const [a,t,b] of P.subs)if(k>=a&&(b==null||k<b))s=t;return s};
// 店里的银幕：缩小到 dw×dh，一秒最多更新十二次
let SM=null,smAt=-1e9;
function small(dw,dh){const ms=performance.now();if(!SM||SM.width!==dw||SM.height!==dh){SM=mk(dw,dh);smAt=-1e9}
  if(ms-smAt>=83){smAt=ms;const f=frame(),x=SM.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.clearRect(0,0,dw,dh);x.drawImage(f,0,0,dw,dh)}return SM}

/* ================= 放映厅：看风景的特写画面 ================= */
// 银幕在中间偏上，字幕在银幕下面；底下是前排的后脑勺（坐在椅背后面）和你的猫（正中偏左）。
// 看风景底部那条说明（vcap）压在画面最下面二十几个像素上，所以你的猫坐得高一点，整个头露在它上面
function geo(w,h){const sx=rd((w-FW)/2),sy=cl(rd((h-FH-80)/2),12,72);return{sx,sy,sub:sy+FH+5,hx:rd(w/2-34)}}
const HALL={};
function hallBg(w,h){const key='bg'+w+'x'+h;if(HALL[key])return HALL[key];const c=mk(w,h),o=C;use(c.getContext('2d'));try{const G=geo(w,h),x0=G.sx-6,x1=G.sx+FW+6;
    R(0,0,w,h,'#0b0912');for(let x=0;x<w;x+=10)R(x,0,1,h,'#100d18');
    // 银幕：黑框
    R(G.sx-4,G.sy-4,FW+8,FH+8,'#050308');R(G.sx-2,G.sy-2,FW+4,FH+4,'#1c1826');
    // 两边的红丝绒幕布：一道道褶子，下摆往里收
    const curtain=(a,b)=>{for(let x=a;x<b;x++){const f=((x-a)%8),col=f<2?'#3e0c18':f<5?'#6a1626':f<7?'#8a2234':'#5a1220';const y1=G.sy+FH+14+rd(Math.sin((x-a)/Math.max(1,b-a)*Math.PI)*6);R(x,0,1,y1,col);P1(x,y1,'#2a0810')}};
    curtain(0,x0);curtain(x1,w);R(x0-1,0,1,G.sy+FH+20,'#2a0810');R(x1,0,1,G.sy+FH+20,'#2a0810');
    // 顶上的帷幔：一排扇形下摆，挂金穗
    const vb=Math.max(10,G.sy-6);for(let x=0;x<w;x++){const u=(x%24)/24,y=vb+rd(Math.sin(u*Math.PI)*5);R(x,0,1,y,(x%24)<3?'#5a1220':'#7a1a2c');P1(x,y,'#3a0a14');if(x%3===0)P1(x,y+1,'#c8a050')}
    R(0,0,w,3,'#3a0a14');for(let x=0;x<w;x+=6)P1(x,1,'#c8a050');
    // 左边墙上一块 EXIT，地上一排过道小灯
    R(6,G.sy+FH-30,22,11,'#0a2a14');R(7,G.sy+FH-29,20,9,'#1e6a34');txt('EXIT',9,G.sy+FH-27,'#a8f0b8');for(let x=10;x<w;x+=46){R(x,h-3,3,1,'#c8a050');R(x,h-2,3,1,'#6a5020')}
  }finally{use(o)}return HALL[key]=c}
// 椅背：front 前排一整排（盖住前排猫的肩膀），mine 你这一排（你左右两张椅子、你自己的椅背、扶手上一桶爆米花）
const seatBack=(x,y,w,h)=>{R(x+2,y,w-4,h,'#2a0810');R(x,y+2,w,h-2,'#2a0810');R(x+2,y+1,w-4,h-1,'#4a1020');R(x+1,y+3,w-2,h-3,'#4a1020');R(x+3,y+1,w-6,1,'#7a2838');for(let i=x+5;i<x+w-4;i+=6)R(i,y+4,1,h-5,'#3e0c1a')};
function seats(w,h,row){const key=row+w+'x'+h;if(HALL[key])return HALL[key];const c=mk(w,h),o=C;use(c.getContext('2d'));try{const G=geo(w,h);
    if(row==='front'){const ry=h-50;for(let x=rd(w/2)-30*9;x<w;x+=30)seatBack(x+2,ry,26,13)}
    else{const mx=G.hx;seatBack(mx-66,h-31,30,31);seatBack(mx+36,h-31,30,31);seatBack(mx-28,h-22,56,22);
      const px=mx+32,py=h-42;R(px,py,11,13,OL);for(let i=0;i<9;i++)R(px+1+i,py+2,1,10,i%3===1?'#fff4dc':'#c8402e');disc(px+5,py,5,3,'#fff0c0');P1(px+3,py-2,'#ffffff');P1(px+7,py-1,'#f8e0a0')}
  }finally{use(o)}return HALL[key]=c}
// 银幕照亮幕布内侧的一道光（按这一段的光的颜色，抖动着淡出去）
const SPL={};
function spill(G,col){if(!SPL[col]){const c=mk(10,FH+16),o=C;use(c.getContext('2d'));try{for(let x=0;x<10;x++)dim(.42*(1-x/10),x,0,1,FH+16,col)}finally{use(o)}SPL[col]=c}
  const c=SPL[col];C.save();C.translate(G.sx-6,0);C.scale(-1,1);C.drawImage(c,0,G.sy-4);C.restore();C.drawImage(c,G.sx+FW+6,G.sy-4)}
// 后脑勺：大圆头、尖耳朵、两颊的毛，连着肩膀；sil 是剪影（前排看不清是谁的猫），rim 是银幕照亮的那一圈边；ear 1 左耳抖、2 右耳抖、3 两只都竖起来
const HEADS=new Map();
const hexA=h=>{const n=parseInt(h.slice(1,7),16);return[n>>16,(n>>8)&255,n&255]},mixC=(a,b,k)=>{const p=hexA(a),q=hexA(b);return'#'+p.map((v,i)=>Math.round(v+(q[i]-v)*k).toString(16).padStart(2,'0')).join('')};
function headImg(pal,o){const key=[pal,o.s,o.look,o.ear,o.rim,o.sil?1:0].join('|');let c=HEADS.get(key);if(c)return c;if(HEADS.size>200)HEADS.delete(HEADS.keys().next().value);
  const s=o.s,W=Math.ceil(54*s),H=Math.ceil(46*s),cx=W/2+(o.look||0)*3*s,hy=20*s,b=PAL[pal]||PAL[0],eL=o.ear&1?1:0,eR=o.ear&2?1:0;
  const inE=(x,y,ex,ey,rx,ry)=>((x-ex)/rx)**2+((y-ey)/ry)**2<=1,tri=(x,y,A,B,Q)=>{const d=(p,q,r)=>(p[0]-r[0])*(q[1]-r[1])-(q[0]-r[0])*(p[1]-r[1]),d1=d([x,y],A,B),d2=d([x,y],B,Q),d3=d([x,y],Q,A);return!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))};
  const ear=(sd,e)=>[[cx+sd*15*s,hy-3*s],[cx+sd*3*s,hy-11*s],[cx+sd*(13+e*2)*s,hy-(21+e*2)*s]],EL=ear(-1,eL),ER=ear(1,eR);
  const IL=[[cx-12*s,hy-5*s],[cx-6*s,hy-9*s],[cx-(12+eL*2)*s,hy-(17+eL*2)*s]],IR=[[cx+12*s,hy-5*s],[cx+6*s,hy-9*s],[cx+(12+eR*2)*s,hy-(17+eR*2)*s]];
  const inside=(x,y)=>inE(x,y,cx,hy,15*s,12.5*s)||inE(x,y,cx-11*s,hy+6*s,6*s,5*s)||inE(x,y,cx+11*s,hy+6*s,6*s,5*s)||tri(x,y,...EL)||tri(x,y,...ER)||inE(x,y,W/2,H+5*s,22*s,18*s);
  const body=o.sil?'#1a1424':mixC(b.body,'#0b0912',.45),dark=o.sil?'#130f1c':mixC(b.shade||b.body,'#0b0912',.6),edge=o.sil?'#06050a':mixC(b.outline||OL,'#000000',.3);
  const rim=o.sil?mixC(o.rim,'#1a1424',.55):mixC(o.rim,b.light||b.body,.4),rim2=o.sil?mixC(o.rim,'#1a1424',.8):mixC(o.rim,body,.6),stripe=!o.sil&&(b.stripe||b.spot)?mixC(b.stripe||b.spot,'#0b0912',.55):null;
  const cv=mk(W,H),g=cv.getContext('2d'),im=g.createImageData(W,H),D=im.data,In=new Uint8Array(W*H),at=(i,j)=>j>=H||(i>=0&&i<W&&j>=0&&In[j*W+i]);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(inside(i+.5,j+.5))In[j*W+i]=1;
  const put=(i,j,col)=>{const n=parseInt(col.slice(1,7),16),p=(j*W+i)*4;D[p]=n>>16;D[p+1]=(n>>8)&255;D[p+2]=n&255;D[p+3]=255};
  const isEdge=(i,j)=>In[j*W+i]&&(!at(i,j-1)||!at(i-1,j)||!at(i+1,j)),near=(i,j,d)=>{for(let b2=-d;b2<=d;b2++)for(let a=-d;a<=d;a++)if((a||b2)&&!at(i+a,j+b2))return true;return false};
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(!In[j*W+i])continue;let col=body;
    if(isEdge(i,j))col=edge;else if(j<H-9*s&&near(i,j,1))col=rim;else if(j<H-12*s&&near(i,j,2))col=rim2;
    else if(!o.sil&&(tri(i+.5,j+.5,...IL)||tri(i+.5,j+.5,...IR)))col='#4a2232';else if(stripe&&j>hy-9*s&&j<hy+7*s&&Math.abs(i+.5-cx)<10*s&&(j+rd(Math.abs(i+.5-cx)/3))%5===0)col=stripe;else if(j>H-10*s)col=dark;put(i,j,col)}
  g.putImageData(im,0,0);c={cv,W,H};HEADS.set(key,c);return c}
function head(pal,x,bottom,o){const c=headImg(pal,o);C.drawImage(c.cv,rd(x-c.W/2),rd(bottom-c.H));return c}
// 一只伸上来的爪子（片尾彩蛋：拍红点）
function paw(pal,x0,y0,x1,y1,rim){const b=PAL[pal]||PAL[0],body=mixC(b.body,'#0b0912',.45),ol=mixC(b.outline||OL,'#000000',.3),lit=mixC(rim,b.light||b.body,.4),st=b.stripe?mixC(b.stripe,'#0b0912',.55):null;
  const n=Math.max(1,Math.round(Math.hypot(x1-x0,y1-y0))),pt=i=>[rd(lp(x0,x1,i/n)),rd(lp(y0,y1,i/n))];   // 放映厅里暗，爪子和后脑勺一样压暗，朝银幕那一边亮一道
  for(let i=0;i<=n;i+=2){const [x,y]=pt(i);disc(x,y,6,6,ol)}for(let i=0;i<=n;i+=2){const [x,y]=pt(i);disc(x,y,5,5,body);if(st&&i%8===4)R(x-4,y,9,2,st)}for(let i=0;i<=n;i+=2){const [x,y]=pt(i);P1(x-5,y-1,lit);P1(x-5,y,lit)}
  const X=rd(x1),Y=rd(y1);disc(X,Y,7,6,ol);disc(X,Y,6,5,body);R(X-5,Y-4,9,1,lit);[[-4,-5],[-1,-6],[2,-6],[5,-5]].forEach(([a,c2])=>{R(X+a,Y+c2,2,2,ol);P1(X+a,Y+c2,lit)})}
function hall(E){const {w,h,t}=E,G=geo(w,h),P=PARTS[F.i],k=F.k,me=WHO();
  C.drawImage(hallBg(w,h),0,0);C.drawImage(frame(),G.sx,G.sy);spill(G,P.glow);
  const s=sub(F.i,k);if(s)PXT.draw(s,rd(w/2-PXT.w(s)/2),G.sub,'#fff4dc',{shadow:'#000'});
  // 前排三只（剪影），偶尔动一下耳朵、歪一下头；肩膀藏在椅背后面
  const fy=h-40,mid=rd(w/2);[[mid+75,.62,0],[mid-135,.58,1],[mid+135,.55,2]].forEach(([x,sc,j])=>{const tt=t+j*2.3,ear=(tt%5.1)<.18?1:(tt%7.3)<.15?2:0,lk=(tt%11)<1.4?(j%2?-1:1):0;head(0,x,fy,{s:sc,look:lk,ear,rim:P.glow,sil:1})});
  C.drawImage(seats(w,h,'front'),0,0);
  // 你的猫：银幕照亮一圈边；彩蛋里红点跑出银幕，你的猫跟着看，伸爪去拍
  let look=0,ear=(t%6.7)<.16?1:(t%9.1)<.14?2:0,dx=0;const hx=G.hx,eggK=F.i===EGG?k:-1,dotOut=eggK>=8.8&&eggK<10.1;
  let dp=null;if(dotOut){const u=seg(eggK,8.8,9.9);dp=u<.45?[lp(G.sx+2,G.sx-26,u/.45),lp(G.sy+96,G.sy+40,u/.45)]:[lp(G.sx-26,hx-8,(u-.45)/.55),lp(G.sy+40,h-90,(u-.45)/.55)]}
  if(eggK>=8.7&&eggK<10.4){look=-1;ear=3;dx=eggK>9.6?-2:0}
  head(me.pal,hx+dx,h-20,{s:1.1,look,ear,rim:P.glow,sil:0});C.drawImage(seats(w,h,'mine'),0,0);
  if(dp)laser(dp[0],dp[1]);
  if(eggK>=9.7&&eggK<10.5){const u=eggK<9.95?seg(eggK,9.7,9.95):1-seg(eggK,10.2,10.5);paw(me.pal,hx+16,h-30,lp(hx+16,hx-8,u),lp(h-30,h-84,u),P.glow);if(eggK>=9.95&&eggK<10.2){spark(hx-14,h-94,t);spark(hx-2,h-97,t+.4)}}}
let HV=null;
function hallDraw(E){const {w,h}=E;if(w>=840&&h>=500){const W2=Math.ceil(w/2),H2=Math.ceil(h/2);if(!HV||HV.width!==W2||HV.height!==H2)HV=mk(W2,H2);   // 很大的窗口：放映厅画在一半大小上，再放大两倍
    const o=C,x=HV.getContext('2d');x.imageSmoothingEnabled=false;use(x);try{hall({...E,w:W2,h:H2})}finally{use(o)}C.drawImage(HV,0,0,W2*2,H2*2);return}hall(E)}

return{FW,FH,PARTS,END,EGG,TOTAL,F,go,adv,loopAt,render,frame,sub,small,hall:hallDraw,set who(f){WHO=f},get who(){return WHO}}})();

/* ---------- 店里北墙的银幕：把此刻的画面按比例缩进 (x,y,w,h)，两边留黑；没有店在推的时候按 t 自己循环放 ---------- */
function cinemaScreen(x,y,w,h,t){if(typeof C==='undefined'||!C||w<2||h<2)return;const F=CINE.F;if(performance.now()-F.live>1500)CINE.loopAt(t||0);
  const s=Math.min(w/CINE.FW,h/CINE.FH),dw=Math.max(1,Math.round(CINE.FW*s)),dh=Math.max(1,Math.round(CINE.FH*s)),dx=Math.round(x+(w-dw)/2),dy=Math.round(y+(h-dh)/2);
  R(x,y,w,h,'#0c0a14');C.drawImage(CINE.small(dw,dh),dx,dy)}

/* ---------- 店里：看风景的特写、放映机的接口、片尾卡、片尾彩蛋 ---------- */
WORLD_MODS.push(A=>{
if(!A.vista||!A.vista.add)return;   // 没有看风景那一套的页面（样页、后台）不挂
const {me,sfx,after}=A,now=()=>A.t,F=CINE.F,P=CINE.PARTS,EGG=CINE.EGG,END=CINE.END;
CINE.who=()=>({pal:me.pal||0,name:me.name||'你',face:me.myFace||'normal'});
const W={full:false,seenEnd:false,done:false,left:null};   // 这一遍：full 从片头开始、一段没跳；seenEnd 看到了片尾卡；left 刚才起身时放到哪
const cur=()=>{const V=A.vista.cur;return V&&V.kind==='cinema'?V:null},watching=()=>{const V=cur();return !!V&&V.phase==='on'};
const voice=p=>A.voiceOf?A.voiceOf(p>=1&&p<=6?{kind:'npc',pal:p,name:CAT_CARDS[p].name}:me):undefined;
function cues(i,k0,k1){for(const c of P[i].cues)if(c[0]>k0&&c[0]<=k1)sfx(c[1],c[1]==='meow'?voice(c[2]):undefined)}
const chap=()=>{const Q=P[F.i];return{i:F.i,id:Q.id,n:Q.n,no:Q.no||0,of:6,label:Q.label,k:F.k,dur:Q.dur}};
A.tickers.push(dt=>{F.live=performance.now();const V=cur();
  if(V){if(V.phase!=='on')return;   // 切进特写的那一下先停着：从片头放
    const i=F.i,k0=F.k;if(i===EGG&&k0+dt>=P[i].dur){finish();return}
    CINE.adv(dt);if(F.i===i)cues(i,k0,F.k);else{cues(i,k0,P[i].dur);cues(F.i,-1,F.k);A.vista.cap()}if(F.i>=END)W.seenEnd=true;return}
  CINE.adv(dt)});
// 放完：一遍没跳过就记彩蛋；关掉特写（close 里弹片尾卡）；银幕回到片头接着循环
function finish(){W.done=true;W.seenEnd=true;const full=W.full;CINE.go(0);if(full&&A.eggs)A.eggs.found('credits');A.vista.close()}
function skip(d){const i=F.i;if(d>0){W.full=false;if(i===EGG){finish();return}CINE.go(i+1)}else CINE.go(F.k>2.5||i===0?i:i-1);if(F.i>=END)W.seenEnd=true;sfx('click');A.vista.cap()}
function endCard(){if(!A.linkDialog)return;const acts=[{id:'close',t:'再逛逛',key:'Esc'}];if(me.place)acts.push({id:'again',t:'从头再看一遍'});
  A.linkDialog('cinema','《猫猫咖啡馆》','film','片子里演的，都是猫猫咖啡馆（Clowder AI）真有的本事。它是开源的（MIT）：想认识这群猫，就去官网或 GitHub 看看吧。',
    ['site','github'],'open',acts,{act:id=>{if(id!=='again')return;A.dlg.close();if(me.place){F.pick=-1e9;W.left=null;A.vista.open('cinema')}return true}})}
A.vista.add('cinema',{
  info:()=>({n:'小电影院',sub:'《猫猫咖啡馆》，一部两分钟的像素小电影',hint:'E / → 下一段 · ← 上一段'}),
  open(V){const t=now(),L=W.left;W.done=false;W.left=null;
    if(t-F.pick<120&&(!L||F.pick>L.at)){CINE.go(F.pickI);W.full=F.pickI===0}   // 刚用放映机换过卷：从那一卷放（跳过了前面的，不算看完）
    else if(L&&t-L.at<30&&!L.done){CINE.go(L.i);W.full=L.full}                // 刚起身又坐下：从刚才那一段的开头接着放
    else{CINE.go(0);W.full=true}
    W.seenEnd=F.i>=END},
  close(V){W.left={i:F.i,at:now(),full:W.full,done:W.done};const show=W.seenEnd&&!A.dlg.open;W.seenEnd=false;if(show)after(.75,()=>{if(!A.dlg.open&&!A.vista.on)endCard()})},
  draw:E=>CINE.hall(E),
  cap:()=>{const Q=P[F.i];return Q.id==='egg'?'还没完……':Q.label},
  act:()=>skip(1),click:()=>{},
  key:(e,V)=>{const k=e.key;if(k==='ArrowRight'||k==='d'||k==='D'){if(!e.repeat)skip(1);return true}if(k==='ArrowLeft'||k==='a'||k==='A'){if(!e.repeat)skip(-1);return true}return false}});
// 放映机"换一卷"：next 换到下一卷，restart 从头放。坐着看的时候换卷，这一遍就不算看完
A.cinema={next(){const i=(F.i+1)%P.length;CINE.go(i);F.pick=now();F.pickI=i;if(watching()){W.full=false;if(F.i>=END)W.seenEnd=true;A.vista.cap()}return chap()},
  restart(){CINE.go(0);F.pick=now();F.pickI=0;if(watching()){W.full=true;W.seenEnd=false;A.vista.cap()}return chap()},
  chapter:chap,playing:watching};
});
