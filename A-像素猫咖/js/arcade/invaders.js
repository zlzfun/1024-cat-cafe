/* 1024 猫咖 · 游戏厅的街机：太空侵略者（INVADERS）。主板见 core.js，这里只管一局。
   - 玩法照街机原版：←→ 挪炮，A 开火（按住也行），屏幕上同时只有一发自己的子弹。上面 5 排 × 9 列外星人整体左右走、碰边下来一行；
     上排小的 30 分、中间两排 20、下面两排大的 10。外星人走到炮那一行，或者三条命用完，就结束。打光一波，下一波起始低一点、走得更快；1500 分奖一条命。
   - 越打越快：照原版的做法，每一下只挪一只（从左下到右上轮一遍，整排才算走了一步），所以剩得越少一轮越短、走得越快，还带出那种一只接一只的"波浪"。
     每走一步一声低音，照原版是四个下行的音循环（g.tone，音量压低，不盖过射击声）。
   - 外星人只从每列最下面那只往下扔子弹：扭扭、活塞、螺丝三种，各一发；"螺丝"专挑你头顶那一列。双方子弹对撞一起没。
   - 掩体是 16×12 的小位图，双方子弹打上去按像素啃掉一块，外星人压下来也会擦掉；地平线也会被打出小坑。每一波掩体重建。
   - 神秘飞碟是一条会飞的鱼，飞过时一高一低轻轻地颤；分值照原版那张表按你打了第几枪轮（50～300，看着随机；第 23 枪、之后每 15 枪是 300，老玩家的诀窍照样灵）。
   - 猫咖点缀：炮是坐在纸箱火箭里的你的猫（g.pal 的毛色，底下一小截烟花筒），命数图标是冒出猫耳朵的小纸箱。外星人保持经典造型，一眼认得出。
   - 开机画面自己画（title）：一排外星人慢慢走、底下一张一个字一个字打出来的分值表，地平线上是坐纸箱的你的猫（m.pal）。 */
ARC.def('invaders',(()=>{
const W=160,H=144,PY=118,GY=131,BY=100,UY=11,DROP=4,CW=14,RH=12,NC=9;
const BG='#120c1c',CR='#fff4dc',AU='#ffd84a',MI='#7ee08a',CY='#7ae8ff',PK='#f4a6b8',RD='#e0533d',SH='#ff7a5c',DIM='#6a5a88';
// 三种外星人（上排小 30、中排中 20、下排大 10），每种两帧，随步伐切
const AL=[
  {w:8,o:3,v:30,c:PK,f:[['...##...','..####..','.######.','##.##.##','########','..#..#..','.#.##.#.','#.#..#.#'],
                        ['...##...','..####..','.######.','##.##.##','########','.#.##.#.','#......#','.#....#.']]},
  {w:11,o:1,v:20,c:CY,f:[['..#.....#..','...#...#...','..#######..','.##.###.##.','###########','#.#######.#','#.#.....#.#','...##.##...'],
                         ['..#.....#..','#..#...#..#','#.#######.#','###.###.###','###########','.#########.','..#.....#..','.#.......#.']]},
  {w:12,o:1,v:10,c:AU,f:[['....####....','.##########.','############','###..##..###','############','...##..##...','..##.##.##..','##........##'],
                         ['....####....','.##########.','############','###..##..###','############','..###..###..','.##..##..##.','..##....##..']]}];
AL.forEach(a=>a.p={'#':a.c});
const TY=[0,1,1,2,2],BOOM=['....#...#....','.#...#.#...#.','..#.......#..','...#.....#...','##.........##','...#.....#...','..#..#.#..#..','.#..#...#..#.'];
// 外星人的子弹：扭扭、活塞、螺丝，各四帧
const SHOT=[[['.#.','#..','.#.','..#','.#.','#..'],['#..','.#.','..#','.#.','#..','.#.'],['.#.','..#','.#.','#..','.#.','..#'],['..#','.#.','#..','.#.','..#','.#.']],
  [['###','.#.','.#.','.#.','.#.','.#.'],['.#.','###','.#.','.#.','.#.','.#.'],['.#.','.#.','.#.','###','.#.','.#.'],['.#.','.#.','.#.','.#.','.#.','###']],
  [['.#.','.##','.#.','##.','.#.','.#.'],['.#.','.#.','.##','.#.','##.','.#.'],['.#.','##.','.#.','.##','.#.','.#.'],['.#.','.#.','##.','.#.','.##','.#.']]];
const SPL=['#.#.#','.###.','##.##','.###.','#.#.#'],PSP=['+.#.+','.###.','#####','+###+','.###.','+.#.+'],ASP=['+#+','###','###','+#+','.+.'];
// 掩体 16×12；四个，中心在 32、64、96、128
const BK=['....########....','...##########...','..############..','.##############.','################','################','################','################','################','#####......#####','####........####','####........####'],BX=[24,56,88,120];
// 神秘飞碟：一条会飞的鱼（朝右；往左飞就翻过来），胸鳍当翅膀扇
const FISH=[['......ff........','.....fff........','t...rrfrrrr.....','tt.rrrrrrrrrr...','.trrrrrrrrrrwer.','tt.cccccccccrr..','t...ccccccc.....','................'],
  ['................','................','t...rrrrrrr.....','tt.rrrrrrrrrr...','.trrrrrrrrrrwer.','tt.cccfcccccrr..','t...cfffccc.....','....ff..........']],FP={f:CY,t:PK,r:SH,c:'#ffd0a8',w:CR,e:'#3a2630'};
const BEAT=[98,87,78,73];   // 外星人步伐：原版四个下行的低音（约 G2 F2 D#2 D2）
const UFOTB=[10,5,5,10,15,10,10,5,30,10,10,10,5,15,10];   // 原版飞碟分值表（×10），按第几枪轮
// 炮：纸箱火箭里冒出你的猫，底下一截烟花筒；命数图标是小纸箱
const CAN=['...b.....b...','..bpb...bpb..','..bbbbbbbbb..','..bbebbbebb..','NKKKKKKKKKKKN','NCCCCCCCCCCDN','NTTTTTTTTTTTN','NCCCCCCCCCCDN','NCCCCCCCCCCDN','NNNNNNNNNNNNN','....RWRWR....','....NNNNN....'];
const MINI=['.b...b.','.bbbbb.','NKKKKKN','NCCCCCN','NNNNNNN'];
const PXF=[['.y.....C.....y.','....C.....b....','..y...y.y...C..','.C..yy.y.yy....','...yyrrrrry.C..','.CyyrrYYYrryy..','..CyyrrYrryyC..','.CCCCCCCCCCCCC.'],
  ['....C.......C..','.y.....y.......','...C.b....C..y.','y....y.yy.y....','..C.yyrrryy.C..','...yrrYYYrry.C.','.C.CyrrYrryC...','..CCCC.CCCCCC..']];
const DEF={body:'#fff3e0'};
const catPal=p=>(p=p||DEF,{b:p.body,p:PK,e:p.eye||'#241a2e',N:'#6a4424',K:'#e8bc7c',C:'#d09a5a',D:'#b07a44',T:'#e8d8a0',R:'#d84a3a',W:CR,y:AU,r:'#ff8a3a',Y:'#fff8d0'});
const STAR=(()=>{let s=11;const r=()=>(s=s*16807%2147483647)/2147483647;return Array.from({length:24},()=>[Math.floor(r()*W),14+Math.floor(r()*82),Math.floor(r()*200)])})();
const stars=(x,t)=>STAR.forEach(([sx,sy,p])=>x.px(sx,sy,(t+p)%200<14?'#5a4a7a':'#2a2240'));
const runs=(n,on,put)=>{let i=0;while(i<n){if(!on(i)){i++;continue}let e=i;while(e<n&&on(e))e++;put(i,e-i);i=e}};

/* ---------- 掩体：按像素查、按像素啃 ---------- */
const bkAt=(g,x,y)=>{if(y<BY||y>=BY+12)return null;for(const b of g.bk)if(x>=b.x&&x<b.x+16)return b;return null};
const bk=(g,x,y)=>{const b=bkAt(g,x,y);return b?b.m[(y-BY)*16+x-b.x]:0};
const nib=(g,x,y)=>{const b=bkAt(g,x,y);if(b)b.m[(y-BY)*16+x-b.x]=0};
const carve=(g,cx,cy,pat,oy)=>pat.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='#'||ch==='+'&&Math.random()<.5)nib(g,cx-(r.length>>1)+i,cy-oy+j)}));
const onCan=(g,x,y)=>{const r=CAN[y-PY],i=x-g.px;return!!r&&i>=0&&i<r.length&&r[i]!=='.'};
const add=(g,n)=>{g.pts+=n;g.score(n);if(!g.bonus&&g.pts>=1500){g.bonus=1;g.lives++;g.sfx('up')}};

/* ---------- 一波：外星人从左下到右上排好（也是"轮着挪"的顺序），掩体重建 ---------- */
function rack(g){const y0=22+Math.min(g.wave-1,4)*4;g.iv=[];
  for(let r=4;r>=0;r--)for(let c=0;c<NC;c++)g.iv.push({c,r,t:TY[r],x:17+c*CW,y:y0+r*RH,f:0,a:1});
  g.bk=BX.map(x=>({x,m:Uint8Array.from(BK.join(''),ch=>ch==='#'?1:0)}));
  Object.assign(g,{mi:0,dir:1,dn:0,edge:0,acc:0,cf:0,bt:0,rev:0,ib:null,pb:null,ab:[],ufo:null,uh:null,fcd:50,nk:0,ut:g.ri(800,1200),
    rate:Math.min(2.4,1.1+.15*(g.wave-1)),minF:g.wave<3?3:2})}
function init(g){Object.assign(g,{pts:0,lives:3,wave:1,bonus:0,shots:0,beat:0,px:8,dead:0,gone:0,clr:0,fx:[],gr:new Uint8Array(W).fill(1),cp:catPal(g.pal)});rack(g)}
function die(g){g.dead=120;g.lives--;g.pb=null;g.ab=[];g.sfx('die')}

// 挪一只；轮完一遍（且至少隔 minF 步）才算整排走了一步：碰过边就掉头、下一遍往下走
function march(g){const L=g.iv;let i=g.mi;while(i<L.length&&!L[i].a)i++;
  if(i>=L.length){if(g.cf<g.minF)return 1;g.cf=0;g.mi=0;if(g.dn)g.dn=0;else if(g.edge){g.dir=-g.dir;g.dn=1;g.edge=0}
    if(g.bt>=6){g.tone(BEAT[g.beat++&3],.07,{vol:.011});g.bt=0}return 0}
  const v=L[i],a=AL[v.t];g.mi=i+1;if(g.dn)v.y+=DROP;else v.x+=2*g.dir;v.f^=1;
  const l=v.x+a.o;if(!g.dn&&(g.dir>0?l+a.w>=W-2:l<=2))g.edge=1;
  if(v.y+8>BY)for(let y=Math.max(v.y,BY);y<Math.min(v.y+8,BY+12);y++)for(let x=l;x<l+a.w;x++)nib(g,x,y);   // 压到掩体就擦掉
  if(v.y+8>PY){g.lives=1;die(g);return 1}
  return 0}

// 自己的子弹：一步 4 格，一格一格查（飞鱼、外星人按像素、对面的子弹、掩体）
function shoot(g){const b=g.pb;if(!b)return;
  for(let s=0;s<4;s++){b.y--;const end=f=>{if(f)g.fx.push(f);g.pb=null};
    if(b.y<9)return end({x:b.x,y:10,t:10,c:RD});
    const u=g.ufo,ux=u&&Math.round(u.x);
    if(u&&b.y>=UY+2&&b.y<UY+8&&b.x>=ux&&b.x<ux+16){const v=UFOTB[g.shots%15]*10;add(g,v);g.uh={x:ux,v,t:80};g.ufo=null;g.sfx('boom');return end()}
    for(const v of g.iv)if(v.a){const a=AL[v.t],i=b.x-v.x-a.o,j=b.y-v.y;
      if(i>=0&&i<a.w&&j>=0&&j<8&&a.f[v.f][j][i]==='#'){v.a=0;g.ib={x:v.x+7,y:v.y,t:14,c:a.c};add(g,a.v);g.sfx('boom');return end()}}
    const k=g.ab.findIndex(e=>Math.abs(e.x-b.x)<=1&&b.y<=e.y+5&&b.y+3>=e.y);if(k>=0){g.ab.splice(k,1);return end({x:b.x,y:b.y,t:8,c:CR})}
    if(bk(g,b.x,b.y)){carve(g,b.x,b.y,PSP,4);return end({x:b.x,y:b.y-1,t:8,c:CR})}}}

// 外星人开火：三种子弹轮着来，各一发；只从每列最下面那只扔；"螺丝"挑离你最近的那列
function fire(g,n){if(--g.fcd>0)return;const k=g.nk;g.nk=(k+1)%3;if(g.ab.some(e=>e.k===k))return;
  const low=[];for(const v of g.iv)if(v.a&&(!low[v.c]||v.r>low[v.c].r))low[v.c]=v;const cs=low.filter(Boolean);if(!cs.length)return;
  const cx=g.px+6,v=k===2?cs.reduce((p,q)=>Math.abs(q.x+7-cx)<Math.abs(p.x+7-cx)?q:p):cs[g.ri(0,cs.length-1)];
  g.ab.push({k,x:v.x+7,y:v.y+6,fy:v.y+6,sp:Math.min(1.7,1+(n<=8?.3:0)+(g.wave-1)*.06)});
  const p=g.pts;g.fcd=Math.max(12,(p<200?56:p<1000?44:p<2000?34:p<3000?26:20)-(g.wave-1)*3+g.ri(0,16))}
function bullets(g){for(let i=g.ab.length-1;i>=0;i--){const s=g.ab[i];s.fy+=s.sp;
  while(s.y<Math.floor(s.fy)){s.y++;const by=s.y+5;
    if(onCan(g,s.x,by)){die(g);return}
    if(bk(g,s.x,by)){carve(g,s.x,by,ASP,1);g.fx.push({x:s.x,y:by+1,t:8,c:SH});g.ab.splice(i,1);break}
    if(by>=GY){g.gr[s.x]=0;g.fx.push({x:s.x,y:GY-2,t:8,c:SH});g.ab.splice(i,1);break}}}}
function saucer(g,n){const u=g.ufo;
  if(!u){if(--g.ut<=0){g.ut=g.ri(900,1300);if(n>=8){const d=g.shots&1?-1:1;g.ufo={x:d>0?-16:W,d}}}return}
  u.x+=u.d*.7;if(u.x<-17||u.x>W+1)g.ufo=null;else if(g.t%5===0)g.tone(g.t%10?990:1320,.045,{vol:.005})}   // 飞鱼的颤音，很轻

function step(g,k){g.fx=g.fx.filter(f=>--f.t>0);if(g.uh&&--g.uh.t<=0)g.uh=null;
  if(g.dead){if(--g.dead<=0){if(g.lives<=0){g.gone=1;g.over()}else g.px=8}return}
  if(g.gone)return;
  if(k.L)g.px=Math.max(2,g.px-1);if(k.R)g.px=Math.min(W-15,g.px+1);
  if(g.clr){if(--g.clr<=0)rack(g);return}
  const L=g.iv;if(g.rev<L.length+30){g.rev++;return}   // 一只一只排出来（原版的味道），排好再开打
  if(k.A&&!g.pb){g.pb={x:g.px+6,y:PY-3};g.shots++;g.sfx('shoot')}
  shoot(g);
  if(g.ib){if(--g.ib.t<=0)g.ib=null}   // 打中一只，整排顿一下
  else{g.cf++;g.bt++;g.acc+=g.rate;while(g.acc>=1){g.acc--;if(march(g)){g.acc=0;break}}if(g.dead)return}
  let n=0;for(const v of L)n+=v.a;
  if(!n&&!g.ib){g.wave++;g.clr=90;g.pb=null;g.ab=[];g.ufo=null;g.sfx('up');return}
  fire(g,n);bullets(g);if(g.dead)return;saucer(g,n)}

function draw(g,x){const t=g.t;x.cls(BG);stars(x,t);
  x.text('SCORE '+ARC.pad(g.pts),2,2,CR);x.text('HI '+ARC.pad(Math.max(g.best||0,g.pts)),W-2,2,AU,{al:'r'});
  const u=g.ufo;if(u)x.spr(FISH[(t>>3)&1],u.x,UY,FP,u.d<0);
  if(g.uh){if(g.uh.t>56)x.spr(BOOM,g.uh.x+1,UY,{'#':SH});else x.text(String(g.uh.v),g.uh.x+8,UY+2,PK,{al:'c'})}
  if(g.clr||g.rev<g.iv.length+30)x.text('WAVE '+g.wave,W/2,UY+2,CY,{al:'c'});
  const L=g.iv;if(!g.clr)for(let i=0;i<L.length&&i<g.rev;i++){const v=L[i];if(v.a){const a=AL[v.t];x.spr(a.f[v.f],v.x+a.o,v.y,a.p)}}
  if(g.ib)x.spr(BOOM,g.ib.x-6,g.ib.y,{'#':g.ib.c});
  if(!g.clr)for(const b of g.bk)for(let j=0;j<12;j++)runs(16,i=>b.m[j*16+i],(i,n)=>x.rect(b.x+i,BY+j,n,1,MI));
  if(g.pb)x.rect(g.pb.x,g.pb.y,1,4,CR);
  for(const s of g.ab)x.spr(SHOT[s.k][(t>>2)&3],s.x-1,s.y,{'#':SH});
  for(const f of g.fx)x.spr(SPL,f.x-2,f.y-2,{'#':f.c});
  if(g.dead){if(g.dead>50)x.spr(PXF[(g.dead>>3)&1],g.px-1,PY+4,g.cp)}else if(!g.gone)x.spr(CAN,g.px,PY,g.cp);
  runs(W,i=>g.gr[i],(i,n)=>x.rect(i,GY,n,1,MI));
  x.text(String(Math.max(0,g.lives)),3,135,CR);for(let i=0;i<Math.min(4,g.lives-1);i++)x.spr(MINI,10+i*10,135,g.cp);
  x.text('WAVE '+g.wave,W-3,135,DIM,{al:'r'})}

// 开机画面：一排外星人慢慢走，底下一张一个字一个字打出来的分值表，地平线上一只纸箱猫来回挪
let TPk=0,TP=null;const tp=p=>p===TPk&&TP?TP:(TPk=p,TP=catPal(p));   // 开机画面上的猫：毛色变了才重算
function title(x,t,m){x.cls(BG);stars(x,Math.floor(t*60));
  x.text('HI '+ARC.pad(m.best),W/2,3,AU,{al:'c'});x.text('INVADERS',W/2,12,CR,{k:2,al:'c',sh:RD});x.zh('太空侵略者',W/2,24,CY,{al:'c'});
  const s=Math.floor(t*2),p=s%24,o=(p<12?p:24-p)*2-12;
  [0,1,2,1,0].forEach((k,i)=>{const a=AL[k];x.spr(a.f[s&1],40+i*16+o+((16-a.w)>>1),44,a.p)});
  x.text('*SCORE ADVANCE TABLE*',W/2,60,CR,{al:'c'});
  [[-1,'=? MYSTERY'],[0,'=30 POINTS'],[1,'=20 POINTS'],[2,'=10 POINTS']].forEach(([k,str],i)=>{const y=70+i*10,n=Math.floor((t-.8-i*.8)*12);if(n<0)return;
    if(k<0)x.spr(FISH[(Math.floor(t*8))&1],51,y-1,FP);else{const a=AL[k];x.spr(a.f[s&1],59-(a.w>>1),y,a.p)}x.text(str.slice(0,n),69,y+2,k<0?PK:CR)});
  if(t%.9<.54)x.text('PUSH START',W/2,116,CR,{al:'c'});
  const q=Math.floor(t*14)%220,cx=10+(q<110?q:220-q);x.spr(CAN,cx,127,tp(m.pal));x.rect(0,139,W,1,MI)}

return{n:'太空侵略者',en:'INVADERS',w:W,h:H,keys:'←→ 挪炮　A 开火',init,step,draw,title}})());
