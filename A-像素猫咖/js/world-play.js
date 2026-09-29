/* 1024 猫咖 · 店里的引擎（电脑端、多人同屏）。依赖 cat-sprites.js、scene-kit.js、world-kit.js、world-map.js；交互和 AI 在 world-acts.js 等 WORLD_MODS 里。
   makeWorld(canvas, {play, ui, bots}) → {S, me, tick(t,dt), render(ctx,vx,vy,vw,vh), hud(...), mini(...), input, cmd, ...}
   一个世界、多个视口：试玩画布跟着"你"走，页面上的全店大图画的是同一份世界。
   别的猫：店猫和补位的机器人（world-acts.js），它们和玩家走同一套接口（走到 / 用某个东西 / 表情 / 传球 / 蹭蹭）；
   联机时真人的猫（world-online.js）带 puppet 标记：位置和姿态只跟着网络走，引擎不给它排动作、不替它想事情、也不推它让路。
   动作队列同 v2：{go 走到 / chase 追着走} {jump 跳到} {k 姿态, dur 秒} {when 等到} {fn 回调}；soft 可被玩家打断，lock 不可。
   画猫走缓存：同一姿态、同一帧、同一毛色只画一次，之后直接贴图——100 只猫同屏也只是 100 次 drawImage。 */
const rnd=a=>a[Math.floor(Math.random()*a.length)],rr=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const pickW=w=>{const e=Object.entries(w).filter(([,v])=>v>0),s=e.reduce((a,[,v])=>a+v,0);if(!e.length)return null;let r=Math.random()*s;for(const [k,v] of e)if((r-=v)<=0)return k;return e[0][0]};
const WORLD_MODS=[];

/* ---------- 在线玩家的毛色：9 种毛 × 6 种项圈（前 7 个仍是 BREEDS：你 + 6 只 NPC） ---------- */
const COATS=[
  {name:'橘猫',body:'#f0a352',light:'#fbe2bc',shade:'#d4863a',outline:'#5a3014',stripe:'#cf7a30',whisk:'#fbe2bc'},
  {name:'黑猫',body:'#3e3846',light:'#5e5668',shade:'#2c2834',outline:'#17131c',whisk:'#8a8296',eye:'#e8c84a'},
  {name:'蓝猫',body:'#98a4b4',light:'#c8d2de',shade:'#7a8696',outline:'#343a46',whisk:'#dfe6ee',eye:'#e8b83a'},
  {name:'奶牛',body:'#f6f2ec',light:'#ffffff',shade:'#dcd6ce',outline:'#2e2a30',spot:'#35303a',whisk:'#8a8490'},
  {name:'三花',body:'#f6efe4',light:'#ffffff',shade:'#ded4c4',outline:'#4a3428',spot:'#e2963e',whisk:'#a8988a'},
  {name:'银渐层',body:'#d6dae0',light:'#f2f4f6',shade:'#b2b8c0',outline:'#474c56',stripe:'#a6aeb8',whisk:'#f2f4f6',eye:'#3a7a5a'},
  {name:'玳瑁',body:'#5c3c2c',light:'#8a6048',shade:'#48301f',outline:'#22160e',spot:'#c47a36',whisk:'#c8a888',eye:'#e8c84a'},
  {name:'奶油',body:'#f4dcb0',light:'#fff2dc',shade:'#dcc090',outline:'#5a4024',stripe:'#e4c490',whisk:'#fff2dc'},
  {name:'白猫',body:'#fbfaf6',light:'#ffffff',shade:'#e4e0d8',outline:'#5a5060',whisk:'#b0a8b0',eye:'#4a7fd0'}];
const COLLARS=['#e0533d','#5B9BD5','#9B7EBD','#5B8C5A','#e8b83a','#f4a6b8'];
const PAL=[...BREEDS];COATS.forEach(c=>COLLARS.forEach(col=>PAL.push({...c,collar:col})));
// 前台猫：蓝色重点色的布偶猫，金项圈、蓝眼睛——和宪宪（海豹色、紫项圈）一眼能分开。放在所有玩家毛色后面，机器人不会挑到
const DESK_PAL=PAL.length;PAL.push({name:'前台猫',body:'#f2efe9',light:'#ffffff',shade:'#d6d2cc',outline:'#4a4c5a',points:'#7c889c',collar:'#e8b83a',whisk:'#9a98a4',eye:'#4a7fd0'});
const BOT_FACES=['normal','content','curious','blep','sparkle','meh','sleepy','happy','smug','wink'];
const BOT_NAMES=`年糕 汤圆 芝麻 豆包 可乐 布丁 团子 咸鱼 拿铁 摩卡 奶盖 花卷 麻薯 栗子 桃酥 果冻 芋圆 黑糖 肉松 饼干 雪球 煤球 小满 阿福 锅巴 米粒 毛豆 蛋挞 酥酥 嘟嘟
  大橘 小橘 二花 奥利奥 可颂 贝果 松饼 曲奇 泡芙 抹茶 焦糖 奶茶 豆花 冰粉 春卷 小笼 烧卖 馄饨 粽子 麦芽 燕麦 玉米 土豆 地瓜 南瓜 柚子 橙子 柠檬 青提 蓝莓
  草莓 山楂 糖葫芦 棉花糖 薄荷 桂花 茉莉 海盐 芝士 黄油 吐司 薯条 寿司 味噌 小鱼干 毛线团 逗猫棒 摸鱼喵 加班喵 重构喵 单测喵 周报喵 回滚喵 合并喵 灰度喵
  发布喵 编译喵 需求喵 文档喵 运维喵 前端喵 后端喵 算法喵 测试喵 产品喵 设计喵 值班喵 缓存喵 日志喵 断点喵 分支喵 提交喵 评审喵 构建喵 部署喵 镜像喵 容器喵`.split(/\s+/);

/* ---------- 猫精灵缓存 ---------- */
const mkCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const WLOCAL=new Set(['pounce','lick','stretch','slowBlink']);   // 一次性动作：从动作开始那一刻播放
// 每个姿态的"帧号"：和 cat-sprites.js 里 POSE 的取帧方式一一对应；帧号相同，画出来就一样
const FK=(()=>{const bl=(T,o)=>((T+o)*1000%3000)<150?1:0,f=(T,r)=>Math.floor(T*r)%2,ST=SLOW.reduce((s,x)=>s+x[1],0);
  const walk=(T,tf,o,e)=>(Math.floor(T*8+o)%4)+e+tf+bl(T,o);
  return{sit:(T,tf,o,e)=>e+tf+bl(T,o),walkR:walk,walkL:walk,lick:(T,tf)=>LICK_SEQ[Math.floor(T*5)%LICK_SEQ.length]+'.'+tf,lie:(T,tf,o,e)=>e+tf+bl(T,o),
    sleep:(T,tf,o)=>''+Math.floor((T+o)*1.6)%4+Math.floor((T+o)*.9)%2+Math.floor((T+o)*1.2)%2+tf,meow:(T,tf,o)=>(Math.floor((T+o)*2.5)%3?1:0)+'.'+tf,
    happy:T=>f(T,4),hold:T=>f(T,2.5),alert:T=>f(T,3),pounce:T=>POUNCE_SEQ[Math.floor(T*5.5)%POUNCE_SEQ.length],swing:T=>Math.round(21+Math.sin(T*2.6)*4),
    bat:T=>{const k=(T*1.1)%1;return k<.22?'h':14+Math.round(Math.sin((k-.22)/.78*Math.PI)*4)},kick:T=>f(T,4),belly:T=>f(T,4),cocoon:T=>f(T,6),wrapped:T=>f(T,5),
    slowBlink:(T,tf)=>{let k=T%ST,i=0;while(k>SLOW[i][1]){k-=SLOW[i][1];i++}return i+'.'+tf},maneki:(T,tf)=>f(T,3)+'.'+tf,knead:(T,tf)=>f(T,2.5)+'.'+tf,stretch:T=>f(T,.8),leap:()=>0}})();
const SPR=new Map(),SPR_MAX=4000;   // 最近用过的放在后面，满了先丢最久没用的
function catImg(k,T,tf,o,e,pi,yi,flip){const f=FK[k],key=k+'|'+(f?f(T,tf,o,e):T.toFixed(2))+'|'+pi+'|'+yi+'|'+(flip?1:0);let s=SPR.get(key);if(s){SPR.delete(key);SPR.set(key,s);return s}
  const P=POSE[k](T,tf,o,e),G=P.G,h=G.length,w=Math.max(...G.map(r=>r.length)),cv=mkCanvas(w,h),pal=yi!=null?{...PAL[pi],yarn:YARN[yi]}:PAL[pi];
  drawF(cv.getContext('2d'),G,pal,flip?w-P.cx:P.cx,h,{cx:P.cx,flip,blink:P.blink});
  s={cv,w,h,cx:P.cx,dy:P.dy||0};if(SPR.size>=SPR_MAX){let n=0;for(const k2 of SPR.keys()){SPR.delete(k2);if(++n>=400)break}}SPR.set(key,s);return s}
// 画一只猫（脚底 x,y 为整数），返回头顶的 y
function drawCat3(ctx,c,x,y,t,ol){const k=c.k,loc=WLOCAL.has(k)&&c.t0!=null,tt=loc?t-c.t0:t,o=loc?0:(c.o||0),tf=(Math.floor(tt*2)+c.pal)%2,T=tt+o,e=c.ex??c.def;
  const f0=k==='walkL'||(c.face==='L'&&FACING.has(k)),flip=c.mirror?!f0:f0,yi=c.yarn!=null&&k!=='sit'?c.yarn:null,s=catImg(k,T,tf,o,e,c.pal,yi,flip);
  const top=Math.round(y-s.h+s.dy),dx=flip?Math.round(x+s.cx-1)-(s.w-1):Math.round(x-s.cx);if(ol)ctx.drawImage(outlineOf(s,ol),dx-1,top-1);ctx.drawImage(s.cv,dx,top);if(ol)c._ring=[ringOf(s,ol),dx-1,top-1];return top}
// v4：给"你"描一圈 1px 的边（按贴图算一次，存在贴图上）
function outlineOf(s,col){if(s.ol&&s.olc===col)return s.ol;const cv=mkCanvas(s.w+2,s.h+2),x=cv.getContext('2d');for(const [a,b] of [[0,1],[2,1],[1,0],[1,2]])x.drawImage(s.cv,a,b);
  x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,cv.width,cv.height);s.ol=cv;s.olc=col;return cv}
// v4：只有一圈边（描边减去猫本身），画在最上层：被家具挡住时也能看见自己在哪
function ringOf(s,col){if(s.rg&&s.rgc===col)return s.rg;const cv=mkCanvas(s.w+2,s.h+2),x=cv.getContext('2d');x.drawImage(outlineOf(s,col),0,0);x.globalCompositeOperation='destination-out';x.drawImage(s.cv,1,1);s.rg=cv;s.rgc=col;return cv}
// v4：脚下的光圈（一圈像素椭圆，虚线慢慢转）
function meRing(x,y,t){const rx=11,ry=4,n=40,ph=Math.floor(t*8);for(let i=0;i<n;i++){if((i+ph)%5===4)continue;const a=i/n*Math.PI*2;P1(Math.round(x+Math.cos(a)*rx),Math.round(y+1+Math.sin(a)*ry),i%5<2?'#ffd84a':'#fff4dc')}}
function meMark3(x,y){R(x-2,y,5,1,'#e0533d');R(x-1,y+1,3,1,'#e0533d');P1(x,y+2,'#e0533d')}

function makeWorld(canvas,{play=true,ui={},bots=60,hi=false}={}){   // hi：v4 的"我是哪只猫"加强（描边、光圈、名牌），v3 不开
const M=WORLD,P=M.P,W=M.w,H=M.h;
const S={tod:'day',weather:'sun',count:0,pending:0,cats:[],hearts:[],puffs:[],flying:[],now:0};
let now=0,timers=[];
const after=(s,f)=>timers.push({s,f}),say=s=>ui.toast&&ui.toast(s),sfx=(k,a)=>ui.sfx&&ui.sfx(k,a),news=s=>ui.news&&ui.news(s);

/* ---------- 走路：2px 通行图 + 4px 网格 A* ---------- */
const inR=(x,y,r)=>x>=r[0]&&x<r[0]+r[2]&&y>=r[1]&&y<r[1]+r[3];
const blocked=(x,y,m)=>M.BLOCK.some(([bx,by,bw,bh])=>x>bx-m&&x<bx+bw+m&&y>by-1&&y<by+bh+1);
const HW=W>>1,HH=H>>1,FM=new Uint8Array(HW*HH);
for(let j=0;j<HH;j++)for(let i=0;i<HW;i++){const x=i*2+1,y=j*2+1;FM[j*HW+i]=M.WALK.some(r=>inR(x,y,r))&&!blocked(x,y,4)?1:0}
const free=(x,y)=>{const i=x>>1,j=y>>1;return i>=0&&j>=0&&i<HW&&j<HH&&FM[j*HW+i]===1};
const FREE={cat:free,vacA:(x,y)=>y>=66&&y<=244&&inR(x,y,M.WALK[0])&&!blocked(x,y,9),vacB:(x,y)=>y>=312&&x<=624&&(inR(x,y,M.WALK[1])||inR(x,y,M.WALK[2])||inR(x,y,M.WALK[7]))&&!blocked(x,y,9)};
const G=4,GW=W/G,GH=H/G,N=GW*GH,GRID={};
for(const k in FREE){const g=new Uint8Array(N);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)g[j*GW+i]=FREE[k](i*G+2,j*G+2)?1:0;GRID[k]=g}
function nearCell(g,i,j){i=Math.max(0,Math.min(GW-1,i));j=Math.max(0,Math.min(GH-1,j));if(g[j*GW+i])return j*GW+i;
  const seen=new Set([j*GW+i]),q=[j*GW+i];for(let h=0;h<q.length;h++){const k=q[h],a=k%GW,b=(k/GW)|0;
    for(const [da,db] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=a+da,y=b+db;if(x<0||y<0||x>=GW||y>=GH)continue;const n=y*GW+x;if(seen.has(n))continue;seen.add(n);if(g[n])return n;q.push(n)}}return j*GW+i}
const cellPt=k=>({x:(k%GW)*G+2,y:((k/GW)|0)*G+2});
// 走到一半停下（跟着别的猫走、near 提前结束）偶尔会停在家具边上的一小格里：挪到最近的空地
function snapFree(c){for(let r=1;r<14;r++)for(let a=0;a<16;a++){const q=a*Math.PI/8,x=c.x+Math.cos(q)*r,y=c.y+Math.sin(q)*r;if(free(x,y)){c.x=x;c.y=y;return}}}
function los(fr,a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2);for(let i=1;i<=n;i++)if(!fr(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true}
const gs=new Float32Array(N),from=new Int32Array(N),mark=new Uint32Array(N),shut=new Uint32Array(N),HK=new Int32Array(N*8),HF=new Float32Array(N*8);let gen=0,hn=0,pathN=0;
function hpush(f,k){if(hn>=HK.length)return;let i=hn++;while(i){const p=(i-1)>>1;if(HF[p]<=f)break;HK[i]=HK[p];HF[i]=HF[p];i=p}HK[i]=k;HF[i]=f}
function hpop(){const top=HK[0],lk=HK[--hn],lf=HF[hn];let i=0;for(;;){let c=2*i+1;if(c>=hn)break;if(c+1<hn&&HF[c+1]<HF[c])c++;if(HF[c]>=lf)break;HK[i]=HK[c];HF[i]=HF[c];i=c}HK[i]=lk;HF[i]=lf;return top}
function findPath(x0,y0,x1,y1,kind='cat'){pathN++;const g=GRID[kind],fr=FREE[kind],s=nearCell(g,Math.floor(x0/G),Math.floor(y0/G)),goal=nearCell(g,Math.floor(x1/G),Math.floor(y1/G));
  const end=fr(x1,y1)?{x:x1,y:y1}:cellPt(goal),start={x:x0,y:y0};if(s===goal||los(fr,start,end))return[end];
  gen++;hn=0;const gi=goal%GW,gj=(goal/GW)|0,h=k=>{const dx=Math.abs(k%GW-gi),dy=Math.abs(((k/GW)|0)-gj);return Math.max(dx,dy)+.414*Math.min(dx,dy)};
  mark[s]=gen;gs[s]=0;from[s]=-1;hpush(h(s),s);let found=false;
  while(hn){const k=hpop();if(shut[k]===gen)continue;shut[k]=gen;if(k===goal){found=true;break}const i=k%GW,j=(k/GW)|0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const x=i+di,y=j+dj;if(x<0||y<0||x>=GW||y>=GH)continue;const n=y*GW+x;if(!g[n]||shut[n]===gen)continue;
      if(di&&dj&&(!g[j*GW+x]||!g[y*GW+i]))continue;const ng=gs[k]+(di&&dj?1.414:1);if(mark[n]!==gen||ng<gs[n]){mark[n]=gen;gs[n]=ng;from[n]=k;hpush(ng+h(n),n)}}}
  if(!found)return null;
  const pts=[];for(let k=goal;k!==s&&k!==-1;k=from[k])pts.push(cellPt(k));pts.reverse();if(!pts.length)return[end];pts[pts.length-1]=end;
  const out=[];let cur=start,i=0;while(i<pts.length){let j=Math.min(pts.length-1,i+40);while(j>i&&!los(fr,cur,pts[j]))j--;out.push(pts[j]);cur=pts[j];i=j+1}return out}
const roomAt=(x,y)=>M.rooms.find(r=>inR(x,y,[r.x,r.y,r.w,r.h]))||M.rooms[0];
function randFree(rect){const [x0,y0,w,h]=rect||[8,58,W-16,478];for(let n=0;n<60;n++){const x=rr(x0,x0+w),y=rr(y0,y0+h);if(free(x,y))return{x,y}}return{x:400,y:150}}
const randIn=id=>{const r=M.rooms.find(q=>q.id===id);return randFree([r.x+8,r.y+(r.y?56:60),r.w-16,r.h-(r.y?60:66)])};

/* ---------- 猫 ---------- */
let nid=0;
function mkCat(pal,name,o){return Object.assign({id:++nid,pal,name,x:0,y:0,k:'sit',face:'R',o:Math.random()*3,q:[],cur:null,wait:rr(1,4),sp:28,hold:null,def:'normal'},o)}
const me=mkCat(0,'你',{me:1,kind:'me',sp:56,x:236,y:150});S.cats.push(me);
const byName=n=>S.cats.find(c=>c.name===n);
function setK(c,k,ex){c.k=k;c.t0=now;c.ex=ex??c.myFace;c.mirror=false}
function unclaim(c){const f=c.onLeave;c.onLeave=null;if(f)f(c)}
function run(c,steps,keep){if(c.puppet)return;if(!keep){c.q=[];c.cur=null;c.dy=0;c.place=null;unclaim(c)}c.q.push(...steps)}
const idle=c=>!c.cur&&!c.q.length;
const restPose=c=>c.hold&&!c.hold.knit?'hold':'sit';
function startStep(c,s){
  if(s.fn)s.fn(c);if(c.cur!==s)return;
  if(s.go||s.chase){s.tgt=s.chase?s.chase():typeof s.go==='function'?s.go():s.go;s.path=s.direct?[s.tgt]:findPath(c.x,c.y,s.tgt.x,s.tgt.y);s.re=now+.6;c.z=s.z}
  if(s.jump){const j=typeof s.jump==='function'?s.jump():s.jump;s.j=j;s.t0=now;s.x0=c.x;s.y0=c.y;s.dur=s.dur||.42;s.h=s.h??Math.max(5,Math.abs(j.y-c.y)*.35);
    const dx=j.x-c.x;if(Math.abs(dx)>8){c.face=dx>0?'R':'L';setK(c,'leap')}else setK(c,'sit');c.z=Math.max(c.z??c.y,j.z??j.y)}
  if(s.k){setK(c,s.k,s.ex);if(s.face)c.face=s.face;if(s.yarn&&c.hold)c.yarn=c.hold.ci;c.mirror=!!s.mirror}
  if(s.dur!=null&&!s.jump)s.until=now+s.dur}
function stepCat(c,dt){
  if(!c.cur){if(!c.q.length)return;c.cur=c.q.shift();startStep(c,c.cur);if(!c.cur)return}
  const s=c.cur;let fin=false;
  if(s.go||s.chase){if(s.chase&&now>s.re){const t2=s.chase();if(t2&&Math.hypot(t2.x-s.tgt.x,t2.y-s.tgt.y)>5){s.tgt=t2;s.path=findPath(c.x,c.y,t2.x,t2.y)}s.re=now+.6}
    if(!s.path||!s.path.length)fin=true;
    else{const p=s.path[0],dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy),st=Math.min(d,(s.sp||c.sp*(c.run?1.6:1))*dt);
      if(d>.01){c.x+=dx/d*st;c.y+=dy/d*st;if(Math.abs(dx)>.5)c.face=dx>0?'R':'L'}const wk=s.pose||(c.face==='L'?'walkL':'walkR');if(c.k!==wk)setK(c,wk);
      if(d-st<.3){s.path.shift();if(!s.path.length)fin=true}
      if(s.near&&Math.hypot(s.tgt.x-c.x,s.tgt.y-c.y)<s.near)fin=true}
    if(fin&&!s.keepPose)setK(c,restPose(c));if(fin&&c.z==null&&!free(c.x,c.y))snapFree(c)}
  else if(s.jump){const k=Math.min(1,(now-s.t0)/s.dur);c.x=s.x0+(s.j.x-s.x0)*k;c.y=s.y0+(s.j.y-s.y0)*k;c.dy=-Math.sin(k*Math.PI)*s.h;
    if(k>=1){c.dy=0;c.z=s.j.z;if(s.j.face)c.face=s.j.face;setK(c,restPose(c));fin=true}}
  else if(s.until!=null)fin=now>=s.until;
  else if(s.when)fin=s.when(c);
  else fin=true;
  if(fin&&c.cur===s){c.cur=null;if(s.then)s.then(c)}}
function borrow(c,k,dur,ex){if(!idle(c)||c.riding||c.hidden||c.place)return false;const pk=c.k,pe=c.ex;run(c,[{k,dur,ex},{k:pk,dur:0,ex:pe}],true);return true}
function emote(c,kind,sec=1.6){c.emote=kind;c.emoteUntil=now+sec}
function speak(c,text,sec=3){c.say=text;c.sayUntil=now+sec}
// 待在某个地方：玩家待到按方向键；别的猫待 dur 秒再走
function settle(c,{k='sit',ex,leave,face}={}){c.place={leave};if(face)c.face=face;setK(c,k,ex)}
function leavePlace(c){const p=c.place;c.place=null;run(c,p&&p.leave?p.leave(c):[])}
function stay(c,{k='sit',ex,face,dur=rr(6,12),leave}){if(c.me){settle(c,{k,ex,leave,face});return}run(c,[{k,dur,ex,face},...(leave?leave(c):[]),{fn:unclaim}],true)}

/* ---------- 东西：每个可交互的东西在 world-acts.js 里用 T({...}) 注册 ---------- */
const TH=[];
const val=(v,...a)=>typeof v==='function'?v(...a):v;
function T(d){d.users=new Set();if(!d.near&&d.at&&typeof d.at!=='function')d.near=[d.at.x-18,d.at.y-14,36,26];TH.push(d);return d}
const lab=(th,c)=>val(th.label,c);
// quiet：地上的一块光斑这类东西，走路经过时不算（停下来才算），免得路过就被抢走 E
function thingNear(c){let best=null,bd=1e9;for(const th of TH){if(th.hidden&&th.hidden(c))continue;if(th.quiet&&c.k.startsWith('walk'))continue;const r=val(th.near,c);if(!r||!inR(c.x,c.y,r))continue;
  const d=Math.hypot(c.x-(r[0]+r[2]/2),c.y-(r[1]+r[3]/2))-(!th.ok||th.ok(c)?1000:0);if(d<bd){bd=d;best=th}}return best}
function thingAt(x,y){let best=null,bb=-1;for(const th of TH){if(th.hidden&&th.hidden(me))continue;const r=val(th.hit,me);if(r&&inR(x,y,r)){const b=r[1]+r[3];if(b>bb){bb=b;best=th}}}return best}
function act(c,th){if(th.ok&&!th.ok(c)){if(c.me&&th.no)say(th.no(c));return false}th.go(c);if(c.me&&A.onUse)A.onUse(th);return true}

/* ---------- 给 world-acts.js 用的接口 ---------- */
const A={S,P,M,me,play,ui,after,say,sfx,news,rnd,rr,pickW,dist,run,setK,idle,emote,speak,borrow,settle,stay,leavePlace,unclaim,restPose,findPath,free,FREE,randFree,randIn,roomAt,inR,
  T,TH,act,thingNear,thingAt:(x,y)=>thingAt(x,y),mkCat,byName,tickers:[],floors:[],drawers:[],overs:[],marks:[],lights:[],huds:[],hi,think:()=>{},social:()=>{},pass:()=>{},solveHere:()=>{},onEmote:()=>{}};
Object.defineProperty(A,'t',{get:()=>now});
WORLD_MODS.forEach(m=>m(A));
const nearCatOf=(c,d=26)=>S.cats.filter(o=>o!==c&&!o.hidden&&!o.gone&&!o.riding&&o.z==null&&Math.hypot(o.x-c.x,o.y-c.y)<d).sort((a,b)=>dist(a,c)-dist(b,c))[0];
A.nearCatOf=nearCatOf;

/* ---------- 画 ---------- */
const BG=mkCanvas(W,H);{const o=C;use(BG.getContext('2d'));M.bg();use(o)}
let MINI=null;
function bake(p,v){const cv=mkCanvas(p.w,p.h),x=cv.getContext('2d'),o=C;use(x);x.translate(-p.x,-p.y);p.draw(0,S);use(o);p._v=v;return cv}
function drawProp(p){if(p.live){p.draw(now,S);return}const v=p.ver?String(p.ver(S)):'';if(!p._c||p._v!==v)p._c=bake(p,v);C.drawImage(p._c,p.x,p.y)}
function drawCarry(c,x,y,top){if(!c.carry)return;const walk=c.k.startsWith('walk'),mx=x+(walk?(c.k==='walkL'?-7:7):0),my=walk?y-8:top+11;
  if(c.carry.kind)knit(c.carry.kind,mx,my,c.carry.ci);else if(walk)yarnBall(mx,my+2,2,c.carry.ci)}
let lastView={x:0,y:0,w:480,h:270},drawN=0;
function render(cx,vx,vy,vw,vh,{marker=true}={}){vx=Math.round(vx);vy=Math.round(vy);const o=C;use(cx);cx.imageSmoothingEnabled=false;
  cx.save();cx.translate(-vx,-vy);cx.drawImage(BG,vx,vy,vw,vh,vx,vy,vw,vh);
  const vis=(x,y,w,h)=>x<vx+vw&&x+w>vx&&y<vy+vh&&y+h>vy;
  M.wall(now,S,vis);M.floor(now,S,vis);A.floors.forEach(f=>f(vis));
  const L=[];for(const p of M.props)if(vis(p.x,p.y,p.w,p.h))L.push([p.base,()=>drawProp(p)]);
  A.drawers.forEach(f=>f(L,vis));
  const over=[];let n=0;
  for(const c of S.cats){if(c.hidden||c.gone)continue;const x=Math.round(c.x),y=Math.round(c.y+(c.dy||0));if(!vis(x-18,y-30,36,34))continue;n++;
    const hm=hi&&c.me&&marker;if(hm&&c.z==null)L.push([c.y-.45,()=>meRing(x,Math.round(c.y),now)]);
    L.push([c.z??c.y,()=>{const top=drawCat3(cx,c,x,y,now,hm?'#ffd84a':null);c.top=top;drawCarry(c,x,y,top);
      const em=c.emote&&now<c.emoteUntil;if(em)over.push(()=>drawEmote(cx,x,top-2,c.emote,now));if(c.me&&marker&&!hi)over.push(()=>meMark3(x,top-(em?11:5)));
      if(hm&&c._ring)over.push(()=>{const [cv,a,b]=c._ring;cx.globalAlpha=.7;cx.drawImage(cv,a,b);cx.globalAlpha=1})}])}
  L.sort((a,b)=>a[0]-b[0]);for(const e of L)e[1]();drawN=n;
  (S.flying||[]).forEach(f=>{if(f.draw)f.draw(f);else if(f.kind)knit(f.kind,Math.round(f.x),Math.round(f.y)-4,f.ci);else yarnBall(Math.round(f.x),Math.round(f.y),f.r||2,f.ci,Math.floor(now*8))});
  S.puffs.forEach(p=>{if(p.k>=0)puff(p.x,p.y,p.k)});S.hearts.forEach(h=>heartUp(h.x,h.y,h.k));M.over(now,S,vis);A.overs.forEach(f=>f(vis));over.forEach(f=>f());
  cx.restore();
  applyTod(vw,vh,S.tod,[...M.lights,...A.lights].filter(l=>(!l.when||l.when===S.tod)&&vis(l.x-l.r,l.y-l.r,l.r*2,l.r*2)).map(l=>({...l,x:l.x-vx,y:l.y-vy})));
  lastView={x:vx,y:vy,w:vw,h:vh};use(o)}
// 高清层：名字、说的话（像素字只有英文，名字用系统字体画在另一张画布上）
let hoverCat=null;
function hud(hx,scale,dpr=1){const v=lastView,W2=hx.canvas.width,H2=hx.canvas.height;hx.clearRect(0,0,W2,H2);const fs=Math.round(12*dpr);hx.font=`${fs}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`;hx.textAlign='center';hx.textBaseline='middle';
  const tag=(c,text,{fg='#fff4dc',bg='rgba(36,26,46,.82)',say=false}={})=>{const sx=(c.x-v.x)*scale,sy=((c.top??c.y-22)-v.y)*scale-(c.emote&&now<c.emoteUntil?9*scale:3*scale);const w=hx.measureText(text).width+10*dpr,h=fs+6*dpr;
    if(sx<-w||sx>W2+w||sy<-h||sy>H2+h)return;hx.fillStyle=bg;const x0=Math.round(sx-w/2),y0=Math.round(sy-h);if(hx.roundRect){hx.beginPath();hx.roundRect(x0,y0,w,h,4*dpr);hx.fill()}else hx.fillRect(x0,y0,w,h);
    if(say){hx.beginPath();hx.moveTo(sx-4*dpr,y0+h);hx.lineTo(sx,y0+h+5*dpr);hx.lineTo(sx+4*dpr,y0+h);hx.fill()}hx.fillStyle=fg;hx.fillText(text,sx,y0+h/2+.5)};
  let n=0;for(const c of S.cats){if(c.hidden||c.gone||c.x<v.x-20||c.x>v.x+v.w+20||c.y<v.y||c.y>v.y+v.h+30)continue;
    if(c.say&&now<c.sayUntil){tag(c,(c.me?'':c.name+'：')+c.say,{fg:'#241a2e',bg:'#fff8e8',say:true});continue}
    if(c===hoverCat||c===me.follow||(!c.me&&play&&n<14&&Math.hypot(c.x-me.x,c.y-me.y)<40)){n++;tag(c,c.name+(c.kind==='npc'?' · 店猫':''),{fg:c.kind==='npc'?'#ffd84a':'#fff4dc'})}}
  // v4：你的名牌永远画在最上面，黄底，带一个往下指的小尖
  if(hi&&play&&!me.hidden&&!(me.say&&now<me.sayUntil)){const b=Math.round(Math.sin(now*4)*1.5*dpr);hx.font=`600 ${fs}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`;
    const text=me.label||'你',sx=(me.x-v.x)*scale,sy=((me.top??me.y-22)-v.y)*scale-(me.emote&&now<me.emoteUntil?9*scale:3*scale)-4*dpr+b,w=hx.measureText(text).width+14*dpr,h=fs+8*dpr,x0=Math.round(sx-w/2),y0=Math.round(sy-h);
    hx.fillStyle='#241a2e';hx.fillRect(x0-2*dpr,y0-2*dpr,w+4*dpr,h+4*dpr);hx.fillStyle='#ffd84a';hx.fillRect(x0,y0,w,h);hx.beginPath();hx.moveTo(sx-6*dpr,y0+h);hx.lineTo(sx,y0+h+7*dpr);hx.lineTo(sx+6*dpr,y0+h);hx.fill();
    hx.fillStyle='#241a2e';hx.fillText(text,sx,y0+h/2+.5)}
  A.huds.forEach(f=>f(hx,scale,dpr,v))}
// 小地图：整店缩小，点是猫（红点是你）
function mini(mx,mw,mh){if(!MINI){MINI=mkCanvas(mw,mh);const x=MINI.getContext('2d');x.imageSmoothingEnabled=true;x.drawImage(BG,0,0,mw,mh)}
  const k=mw/W;mx.drawImage(MINI,0,0);for(const c of S.cats){if(c.gone||hi&&c.me)continue;mx.fillStyle=c.me?'#e0533d':c.kind==='npc'?'#ffd84a':'#fff4dc';mx.fillRect(Math.round(c.x*k)-1,Math.round(c.y*k)-2,c.me?3:2,c.me?3:2)}
  if(hi){const x=Math.round(me.x*k),y=Math.round(me.y*k)-1,on=Math.floor(now*3)%2;mx.fillStyle='#241a2e';mx.fillRect(x-3,y-3,7,7);mx.fillStyle=on?'#ffd84a':'#fff4dc';mx.fillRect(x-2,y-2,5,5);mx.fillStyle='#e0533d';mx.fillRect(x-1,y-1,3,3)}
  A.marks.forEach(m=>{const p=m();if(!p)return;mx.fillStyle=p.col||'#7ee08a';mx.fillRect(Math.round(p.x*k)-2,Math.round(p.y*k)-2,4,4)});
  const v=lastView;mx.strokeStyle='#ffd84a';mx.lineWidth=1;mx.strokeRect(Math.round(v.x*k)+.5,Math.round(v.y*k)+.5,Math.round(v.w*k),Math.round(v.h*k))}

/* ---------- 玩家 ---------- */
const keys={};let pendingTap=null,run2=false;
const busy=()=>{const s=me.cur||me.q[0];return !!s&&(s.lock||!s.go&&!s.chase&&!s.soft)};
function catAt(x,y){let best=null,bz=-1e9;for(const c of S.cats){if(c.hidden||c.gone||c.me)continue;const top=c.top??c.y-22;if(x>c.x-10&&x<c.x+10&&y>top-2&&y<c.y+(c.dy||0)+2){const z=c.z??c.y;if(z>bz){bz=z;best=c}}}return best}
function pressE(){if(!play||busy())return;if(me.place){leavePlace(me);return}if(me.hidden)return;me.follow=null;
  // 人多的时候旁边总有猫，所以 E 不自动传球：传球要按 Q、右键点猫或者直接点猫
  const th=thingNear(me),ok=th&&(!th.ok||th.ok(me));if(ok)return act(me,th);
  if(me.hold&&!me.hold.knit)return A.solveHere(me);
  if(th)return act(me,th);
  const c=nearCatOf(me,24);if(c)return A.social(me,c,'rub');
  if(me.hold)say('叼着织好的东西，去橱窗挂上吧')}
function promptText(){if(me.place)return 'WASD / 方向键 · 离开';if(busy()||me.hidden)return '';if(me.follow)return '跟着'+me.follow.name+' · Esc 不跟了';
  const th=thingNear(me),ok=th&&(!th.ok||th.ok(me)),ball=me.hold&&!me.hold.knit;if(ok)return 'E · '+lab(th,me);
  if(ball){const o=nearCatOf(me,120);return 'E · '+(A.ballPrompt?A.ballPrompt(me):'就地解开')+(o?' · Q 传给'+o.name:'')}
  if(th)return 'E · '+lab(th,me)+'（'+(th.no?th.no(me):'现在不行')+'）';
  if(me.hold)return '叼着'+KNIT_NAMES[me.hold.kind][0]+' · 去橱窗长廊挂上';
  const c=nearCatOf(me,24);if(c)return 'E · 蹭蹭'+c.name;return ''}
function tap(mx,my){if(!play)return;poke();if(busy()&&!me.place){pendingTap=[mx,my];return}pendingTap=null;const leaving=!!me.place;if(leaving)leavePlace(me);if(me.hidden&&!leaving)return;
  const go=steps=>run(me,steps,leaving);me.follow=null;
  const o=catAt(mx,my);if(o){go([{chase:()=>({x:o.x+(me.x<o.x?-16:16),y:o.z!=null?o.z+6:o.y+2}),near:22},{fn:()=>A.social(me,o,'auto')}]);return}
  if(!leaving&&A.vacAt){const v=A.vacAt(mx,my);if(v&&!me.hold){A.ride(me,v);return}}
  const th=thingAt(mx,my);if(th){const at=val(th.at,me);go([{go:at},{fn:()=>act(me,th)}]);return}
  go([{go:{x:mx,y:my}}])}
function hover(mx,my){const c=catAt(mx,my);hoverCat=c;A.hoverTh=null;if(c)return{label:c.name+(c.kind==='npc'?'（店猫）':'')+(c.doing?' · '+c.doing:''),cat:c};
  const th=thingAt(mx,my);A.hoverTh=th||null;if(th)return{label:(th.n||lab(th,me)),th,act:lab(th,me),ok:!th.ok||th.ok(me)};return null}
// 挂机：12 秒后自己舔舔爪或喵一声，35 秒后就地睡着
let afkT=0,afkDid=false;const poke=()=>{afkT=0;afkDid=false};
function afk(dt,moving){if(moving){poke();return}if(me.place||me.hidden||!idle(me)||me.follow)return;afkT+=dt;
  if(afkT>12&&!afkDid&&!me.hold){afkDid=true;const k=rnd(['lick','meow']);run(me,[{k,dur:k==='lick'?DUR.lick:1.6,soft:1}])}
  if(afkT>35&&!me.hold){settle(me,{k:'sleep'});poke()}}
function keyMove(dt){const dx=(keys.r?1:0)-(keys.l?1:0),dy=(keys.d?1:0)-(keys.u?1:0);if(!dx&&!dy)return false;
  if(busy())return true;if(me.place){leavePlace(me);return true}if(me.hidden)return true;me.follow=null;if(me.q.length||me.cur)run(me,[]);
  const l=Math.hypot(dx,dy),sp=me.sp*(keys.shift?1.6:1),nx=me.x+dx/l*sp*dt,ny=me.y+dy/l*sp*dt;if(free(nx,me.y))me.x=nx;if(free(me.x,ny))me.y=ny;if(dx)me.face=dx>0?'R':'L';
  const wk=me.face==='L'?'walkL':'walkR';if(me.k!==wk)setK(me,wk);return true}
const KEYMAP={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',s:'d',a:'l',d:'r'};
const EMOTES=[{n:'喵',k:'meow',dur:1.6,e:'note'},{n:'爱心',k:'sit',ex:'love',dur:1.8,e:'heart'},{n:'惊讶',k:'alert',dur:1.2,e:'bang'},{n:'疑问',k:'sit',ex:'curious',dur:1.6,e:'q'},
  {n:'开心',k:'happy',dur:1.6},{n:'生气',k:'sit',ex:'angry',dur:1.6,e:'anger'},{n:'睡觉',k:'sleep'},{n:'伸懒腰',k:'stretch',dur:DUR.stretch}];
function doEmote(c,i){const e=EMOTES[i];if(!e)return;if(c.me&&(busy()||me.hidden&&!me.place))return;if(c.place&&!c.me)return;
  if(e.k==='sleep'){if(c.me){if(me.place)leavePlace(me);run(c,[{fn:c=>settle(c,{k:'sleep'})}],true)}else run(c,[{k:'sleep',dur:rr(8,16)}]);return}
  const st=[{k:e.k,dur:e.dur,ex:e.ex,soft:1}];if(c.me&&me.place){leavePlace(me);run(c,st,true)}else run(c,st);if(e.e)emote(c,e.e,e.dur+.2);A.onEmote(c,i)}
function key(e,down){const k=e.key.length===1?e.key.toLowerCase():e.key,m=KEYMAP[k];if(e.key==='Shift'){keys.shift=down;return true}
  if(m){keys[m]=down;if(down)poke();return true}if(!down)return false;poke();
  if(e.key===' '||k==='e'||e.key==='Enter'){if(!e.repeat)pressE();return true}
  if(k==='f'){if(me.follow)me.follow=null;else{const c=hoverCat||nearCatOf(me,60);if(c){me.follow=c;say('跟着'+c.name+'走（Esc 不跟了）')}}return true}
  if(k==='q'){if(me.hold&&!me.hold.knit){const c=hoverCat&&dist(hoverCat,me)<160?hoverCat:nearCatOf(me,120);if(c)A.pass(me,c);else if(A.voidPass)A.voidPass(me);else say('附近没有猫可以传')}return true}
  if(e.key==='Escape'){me.follow=null;return true}
  if(/^[1-8]$/.test(k)){doEmote(me,+k-1);return true}return false}
function blurKeys(){for(const k in keys)keys[k]=false}
A.doEmote=doEmote;A.EMOTES=EMOTES;A.view=()=>lastView;A.poke=()=>poke();A.busy=busy;A.pressE=pressE;A.tap=(x,y)=>tap(x,y);A.snap=(x,y,w,h)=>{const cv=mkCanvas(w,h),keep=lastView;render(cv.getContext('2d'),x,y,w,h,{marker:false});lastView=keep;return cv};

/* ---------- 每帧 ---------- */
let room=null,camX=me.x-240,camY=me.y-135;
function tick(t,dt){now=t;S.now=t;
  timers.forEach(q=>q.s-=dt);const due=timers.filter(q=>q.s<=0);timers=timers.filter(q=>q.s>0);due.forEach(q=>q.f());
  A.tickers.forEach(f=>f(dt));
  S.hearts=S.hearts.filter(h=>(h.k=(now-h.t0)/1.8)<1);S.puffs=S.puffs.filter(p=>(p.k=(now-p.t0)/.6)<1);
  S.flying=S.flying.filter(f=>{const k=Math.max(0,Math.min(1,(now-f.t0)/f.dur));f.x=f.x0+(f.x1-f.x0)*k;f.y=f.y0+(f.y1-f.y0)*k-Math.sin(k*Math.PI)*(f.arc??18);if(k<1)return true;f.done&&f.done();return false});
  const moving=play&&keyMove(dt);
  for(const c of S.cats){if(c.gone||c.puppet)continue;if(c===me&&moving&&!busy())continue;stepCat(c,dt);if(c.riding)continue;
    if(c!==me&&idle(c)&&!c.place&&(c.wait-=dt)<=0)A.think(c);
    if(c===me&&idle(c)){if(me.follow&&!me.place&&!me.hidden){const f=me.follow;if(f.gone||f.hidden)me.follow=null;else if(dist(f,me)>30)run(me,[{chase:()=>({x:f.x+(me.x<f.x?-14:14),y:f.z!=null?f.z+6:f.y+1}),near:18}])}
      else if(play&&!me.place&&!me.hidden&&!moving&&c.k!==restPose(c))setK(c,restPose(c))}}
  S.cats=S.cats.filter(c=>!c.gone);
  if(play)afk(dt,moving);if(pendingTap&&!busy())tap(...pendingTap);
  for(const c of S.cats)c.carry=c.hold&&(c.hold.knit||c.k.startsWith('walk'))&&!PLAYS.includes(c.k)?{ci:c.hold.ci,kind:c.hold.knit?c.hold.kind:null}:null;
  // 挤在一起的闲猫慢慢让开一点
  for(let i=0;i<S.cats.length;i++){const a=S.cats[i];if(a.z!=null||a.hidden||!idle(a)||a.place||a.puppet)continue;for(let j=i+1;j<S.cats.length;j++){const b=S.cats[j];if(b.z!=null||b.hidden||!idle(b)||b.place||b.puppet)continue;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<7){const ux=d>.01?dx/d:1,uy=d>.01?dy/d:0,st=10*dt;if(free(b.x+ux*st,b.y+uy*st)&&!b.me){b.x+=ux*st;b.y+=uy*st}else if(free(a.x-ux*st,a.y-uy*st)&&!a.me){a.x-=ux*st;a.y-=uy*st}}}}
  if(play&&ui.prompt)ui.prompt(promptText());
  const r=roomAt(me.x,me.y);if(r!==room){room=r;ui.room&&ui.room(r)}}
// oy：v4 对话框开着时，把"你"往画面上方挪一点；A.camHook：v4 的运镜（第一次走进中庭时镜头摇上树冠），返回画面中心 {x,y}
function camera(vw,vh,dt,oy=0){const ov=A.camHook&&A.camHook(vw,vh),cx=ov?ov.x:me.x,cy=ov?ov.y:me.y-12+oy;
  const tx=Math.max(0,Math.min(W-vw,cx-vw/2)),ty=Math.max(0,Math.min(H-vh,cy-vh/2)),k=Math.min(1,dt*(ov?ov.k||3:5));camX+=(tx-camX)*k;camY+=(ty-camY)*k;
  if(!ov){if(Math.abs(tx-camX)>vw)camX=tx;if(Math.abs(ty-camY)>vh)camY=ty}return{x:Math.round(camX),y:Math.round(camY)}}

const cmd={face:()=>{const f=Object.keys(FACE_NAMES),i=f.indexOf(me.myFace||'normal');me.myFace=me.ex=f[(i+1)%f.length];return FACE_NAMES[me.myFace]},
  coat:()=>{const i=me.pal<7?0:Math.floor((me.pal-7)/6)+1;me.pal=i>=COATS.length?0:7+i*6;return i>=COATS.length?'白色（原来的）':COATS[i].name},
  emote:i=>doEmote(me,i),event:k=>A.events[k]&&A.events[k](),say:s=>{speak(me,s,3.5);A.onSay&&A.onSay(me,s)},social:(c,kind)=>{poke();A.social(me,c,kind)},follow:c=>{me.follow=c}};
return{S,me,A,tick,render,hud,mini,camera,cmd,bots:(n,inst)=>A.setBots(n,inst),online:()=>A.online||1,findPath,free,tap,hover,catAt,key,blurKeys,poke,EMOTES,
  stats:()=>({cats:S.cats.length,drawn:drawN,sprites:SPR.size,paths:pathN}),toWorld:(sx,sy)=>({x:lastView.x+sx,y:lastView.y+sy}),view:()=>lastView}}
