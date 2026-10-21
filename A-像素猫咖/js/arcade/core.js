/* 1024 猫咖 · 游戏厅的街机主板。进了游戏厅才下载（world-arcade.js 的 ARCADE.load），每台街机一个游戏文件 js/arcade/<id>.js，到了以后 ARC.def(id,spec) 登记。
   设计见 docs/店内设计.md 第十七节"游戏厅"。主板管所有游戏共用的：开机画面、开始、暂停、结束和最高分、按键、哔哔声、3×5 小字和 12px 中文；游戏只管自己那一局。
   spec：{n 中文名, en 开机画面上的英文大字, w,h 屏幕多大（游戏像素：一格就是店里的一个像素，不放大）, keys 按键说明（特写底下那行）,
          free 不计分、不会结束（猫猫咖啡馆）, init(g) 开一局, step(g,k) 每 1/60 秒走一步, draw(g,x) 画这一帧,
          attract(x,t,m) 开机画面的底（可选，不写是黑底）, title(x,t,m) 整个开机画面自己画（可选，写了主板就不叠标题）；m 是这台机器，m.pal 你的猫的毛色、m.best 最高分}
   g：这一局的状态（每局一个新的 {}）。主板放进去：g.score(n) 加分、g.over() 结束、g.sfx(名字)、g.pal 你的猫的毛色（BREEDS 那样的对象）、g.best 开局时的最高分（画 HUD 用）、g.t 这局走了几步、g.rnd(a,b)、g.ri(a,b) 整数、g.tone(f,d,o) 自己定音高的一声（f 赫兹、d 秒，o:{type 默认方波,vol,slide 结束时的音高倍数,delay}）
   k：按键 {L,R,U,D,A,B 按着没有；p:{L,R,U,D,A,B,S} 这一步刚按下的}。方向键 / WASD；A：空格、Z、J、E；B：X、K、Shift；S（开始）：回车。按住不放不会重复算"刚按下"，要连发自己数步数
   x：画笔，画在这台街机自己的小画布上（w×h）：{w,h,c 原始 2d,cls(col),rect(x,y,w,h,col),px(x,y,col),line(x0,y0,x1,y1,col),disc(cx,cy,r,col),ring(cx,cy,r,col),
          text(s,x,y,col,o) 3×5 小字 → 宽（o:{k 放大倍数, al:'c' 居中 / 'r' 右对齐, sh 影子色}）, tw(s,k), zh(s,x,y,col,o) 12px 中文（一行 16 高，(x,y) 是左上角）→ 宽, zw(s),
          spr(rows,x,y,pal,flip) 字符画（pal 把字符映射成颜色，'.' 和空格透明）, dim(a) 整屏压暗}
   g.sfx 的名字：coin start blip move rot hit wall brick eat line tetris drop shoot boom die over hi up pause meow step
   机器（world-arcade.js 用）：ARC.machine(id,{best,onBest(n),pal}) → {key(e,down) 吃没吃掉这个键, release() 松开所有键, tick(dt), draw(ctx,x,y), mode, score, best, k, spec} */
window.ARC=window.ARC||(()=>{
const G={},STEP=1/60;
/* ---------- 3×5 小字（比 scene-kit 那套多 J、Q、Z 和几个标点） ---------- */
const F={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',
  I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',
  Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',
  Y:'101101010010010',Z:'111001010100111',0:'111101101101111',1:'010110010010111',2:'110001010100111',3:'110001010001110',4:'101101111001001',5:'111100110001110',
  6:'011100111101111',7:'111001010010010',8:'111101111101111',9:'111101111001110',':':'000010000010000','!':'010010010000010','?':'110001010000010','+':'000010111010000',
  '-':'000000111000000','/':'001001010100100','.':'000000000000010',',':'000000000010100',"'":'010010000000000','(':'001010010010001',')':'100010010010100',
  '♥':'000101111111010','<':'001010100010001','>':'100010001010100','=':'000111000111000','×':'000101010101000','*':'000101010101000','#':'101111101111101','%':'101001010100101'};
function kit(cv){const c=cv.getContext('2d'),w=cv.width,h=cv.height;c.imageSmoothingEnabled=false;
  const rect=(x,y,W,H,col)=>{if(!col||W<=0||H<=0)return;c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(W),Math.round(H))};
  const px=(x,y,col)=>rect(x,y,1,1,col);
  const line=(x0,y0,x1,y1,col)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)px(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),col)};
  const disc=(cx,cy,r,col)=>{for(let y=-r;y<=r;y++){const s=Math.floor(Math.sqrt(Math.max(0,(r+.5)*(r+.5)-y*y)));rect(cx-s,cy+y,2*s+1,1,col)}};
  const ring=(cx,cy,r,col)=>{for(let i=0,n=Math.max(8,Math.round(r*7));i<n;i++){const a=i/n*Math.PI*2;px(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r),col)}};
  const tw=(s,k=1)=>{s=String(s);return s.length?s.length*4*k-k:0};
  const glyphs=(s,x,y,col,k)=>{let cx=x;for(const ch of s){const f=F[ch];if(f)for(let i=0;i<15;i++)if(f[i]==='1')rect(cx+(i%3)*k,y+Math.floor(i/3)*k,k,k,col);cx+=4*k}};
  function text(s,x,y,col,o={}){const k=o.k||1;s=String(s).toUpperCase();const W=tw(s,k);if(o.al==='c')x-=Math.floor(W/2);else if(o.al==='r')x-=W;x=Math.round(x);y=Math.round(y);
    if(o.sh)glyphs(s,x+k,y+k,o.sh,k);glyphs(s,x,y,col,k);return W}
  // 12px 中文：店里有 PXT（pixel-text.js）就用裁剪过的像素字，没有（单独试玩）就用系统字凑合
  const zw=s=>typeof PXT!=='undefined'?PXT.w(s):(c.font='12px sans-serif',Math.ceil(c.measureText(String(s)).width));
  function zh(s,x,y,col,o={}){s=String(s);const W=zw(s);if(o.al==='c')x-=Math.floor(W/2);else if(o.al==='r')x-=W;x=Math.round(x);y=Math.round(y);
    const one=(dx,cl)=>{if(typeof PXT!=='undefined')c.drawImage(PXT.get(s,cl),x+dx,y+dx);else{c.font='12px sans-serif';c.textBaseline='alphabetic';c.fillStyle=cl;c.fillText(s,x+dx,y+13+dx)}};
    if(o.sh)one(1,o.sh);one(0,col);return W}
  // 字符画：一行里连着同色的点并成一笔
  function spr(rows,x,y,pal,flip){x=Math.round(x);y=Math.round(y);for(let j=0;j<rows.length;j++){const r=rows[j],n=r.length;let i=0;
    while(i<n){const col=pal[r[i]];let e=i+1;while(e<n&&r[e]===r[i])e++;if(col)rect(flip?x+n-e:x+i,y+j,e-i,1,col);i=e}}}
  const dim=(a=.55)=>{const o=c.globalAlpha;c.globalAlpha=a;rect(0,0,w,h,'#000');c.globalAlpha=o};
  return{w,h,c,cls:col=>rect(0,0,w,h,col),rect,px,line,disc,ring,text,tw,zh,zw,spr,dim}}
/* ---------- 哔哔声：方波，借店里的 Sound（声音关着就不响）；同一个声音 30 毫秒里只响一次 ---------- */
const last={};
const T=(f,d,o={})=>{if(typeof Sound!=='undefined'&&Sound.tone)Sound.tone(f,d,{type:'square',vol:.022,...o})};
const N=(d,o={})=>{if(typeof Sound!=='undefined'&&Sound.noise)Sound.noise(d,{vol:.05,hp:300,lp:2400,...o})};
const arp=(fs,d,o={})=>fs.forEach((f,i)=>T(f,d*1.6,{...o,delay:i*d}));
const SFX={coin:()=>{T(988,.07);T(1319,.22,{delay:.07})},start:()=>arp([523,659,784,1047],.07),blip:()=>T(880,.04),move:()=>T(420,.02,{vol:.012}),rot:()=>T(740,.03,{vol:.016}),
  hit:()=>T(520,.05),wall:()=>T(300,.04,{vol:.016}),brick:()=>T(1046,.05),eat:()=>{T(660,.05);T(990,.07,{delay:.05})},line:()=>arp([523,659,784,1047],.05),
  tetris:()=>arp([523,659,784,1047,1319,1568],.05),drop:()=>T(200,.07,{slide:.6}),shoot:()=>T(1400,.09,{slide:.35,vol:.014}),boom:()=>{N(.28);T(160,.25,{slide:.4,vol:.02})},
  die:()=>T(523,.6,{slide:.2}),over:()=>arp([392,330,262,196],.13),hi:()=>arp([523,659,784,1047,784,1047,1319],.08),up:()=>arp([659,784,988,1319],.06),pause:()=>T(988,.05),
  meow:()=>{if(typeof Sound!=='undefined')Sound.sfx('meow')},step:()=>T(240,.02,{vol:.008})};
function sfx(k){const n=performance.now();if(n-(last[k]||0)<30)return;last[k]=n;try{SFX[k]&&SFX[k]()}catch(e){}}
/* ---------- 按键 ---------- */
const KEYMAP={arrowleft:'L',a:'L',arrowright:'R',d:'R',arrowup:'U',w:'U',arrowdown:'D',s:'D',' ':'A',z:'A',j:'A',e:'A',x:'B',k:'B',shift:'B',enter:'S'};
const pad=(n,l=6)=>String(Math.max(0,Math.floor(n))).padStart(l,'0');
/* ---------- 一台街机 ---------- */
function machine(id,o={}){const S=G[id];if(!S)return null;const cv=document.createElement('canvas');cv.width=S.w;cv.height=S.h;const X=kit(cv);
  const K={L:0,R:0,U:0,D:0,A:0,B:0,p:{}};let pend={},acc=0,modeT=0;
  const M={id,spec:S,mode:'title',score:0,best:o.best||0,newBest:false,k:K,t:0,g:null,pal:o.pal,
    key(e,down){const b=KEYMAP[(e.key||'').toLowerCase()];if(!b)return false;if(b!=='S')K[b]=down?1:0;if(down&&!e.repeat)pend[b]=1;return true},
    release(){'LRUDAB'.split('').forEach(b=>K[b]=0);pend={}},
    tick(dt){acc+=Math.min(dt,.1);M.t+=Math.min(dt,.1);while(acc>=STEP){acc-=STEP;step()}},
    draw(ctx,x,y){paint();ctx.drawImage(cv,Math.round(x),Math.round(y))}};
  function start(){const g={t:0,pal:o.pal,best:M.best,score:n=>{if(!S.free&&M.mode==='play')M.score+=n},over:()=>over(),sfx,tone:T,rnd:(a,b)=>a+Math.random()*(b-a),ri:(a,b)=>a+Math.floor(Math.random()*(b-a+1))};
    M.g=g;M.score=0;M.newBest=false;M.mode='play';modeT=0;S.init(g)}
  function over(){if(M.mode!=='play'||S.free)return;M.mode='over';modeT=0;if(M.score>M.best){M.best=M.score;M.newBest=true;if(o.onBest)o.onBest(M.score)}sfx(M.newBest?'hi':'over')}
  function step(){modeT+=STEP;K.p=pend;pend={};const p=K.p;
    if(M.mode==='title'){if(p.A||p.S){sfx(S.free?'start':'coin');start()}}
    else if(M.mode==='play'){if(p.S){M.mode='pause';modeT=0;sfx('pause');return}S.step(M.g,K);M.g.t++}
    else if(M.mode==='pause'){if(p.S||p.A){M.mode='play';sfx('pause')}}
    else if(M.mode==='over'){if(modeT>1.2&&(p.A||p.S)){sfx('coin');start()}}}
  const blink=(per=.9)=>(M.t%per)<per*.6;
  function paint(){const w=S.w,h=S.h;X.c.globalAlpha=1;
    if(M.mode==='title'){if(S.title){S.title(X,M.t,M);return}if(S.attract)S.attract(X,M.t,M);else X.cls('#000');
      if(!S.free)X.text('HI '+pad(M.best),w/2,6,'#ffd84a',{al:'c'});
      const k=w>=120?2:1;X.text(S.en||id,w/2,Math.round(h*.3),'#fff4dc',{k,al:'c',sh:'#e0533d'});X.zh(S.n,w/2,Math.round(h*.3)+5*k+6,'#7ae8ff',{al:'c'});
      if(blink())X.text('PUSH START',w/2,Math.round(h*.72),'#fff4dc',{al:'c'});return}
    S.draw(M.g,X);
    if(M.mode==='pause'){X.dim(.5);X.text('PAUSE',w/2,h/2-3,'#fff4dc',{k:2,al:'c'})}
    else if(M.mode==='over'&&modeT>.4){X.dim(.6);const y=Math.round(h*.3);X.text('GAME OVER',w/2,y,'#ff6a6a',{k:2,al:'c',sh:'#3a0a10'});
      X.text('SCORE '+pad(M.score),w/2,y+18,'#fff4dc',{al:'c'});X.text('HI '+pad(M.best),w/2,y+26,'#ffd84a',{al:'c'});
      if(M.newBest&&blink(.5))X.text('NEW RECORD!',w/2,y+38,'#7ee08a',{al:'c'});if(modeT>1.2&&blink())X.text('PUSH START',w/2,Math.round(h*.78),'#fff4dc',{al:'c'})}}
  return M}
return{def:(id,spec)=>{G[id]=spec},has:id=>!!G[id],get:id=>G[id],machine,kit,sfx,pad,F}})();
