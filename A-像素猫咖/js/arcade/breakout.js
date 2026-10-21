/* 1024 猫咖 · 游戏厅的街机：打砖块（BREAKOUT）。
   怎么玩：←→ 挪猫爪（按住越挪越快），A 发球（不按，过五秒也会自己发）。球落在爪子哪儿决定往哪儿弹：正中几乎直上，越靠边越斜，最斜也离水平 30°。
   四关：彩虹排 → 带硬砖的（灰砖打两下）→ 猫脸 → 1024；一关比一关快，四关打完从头再来、再快一截。三条命（右上角小猫头），掉球扣一条。
   碎砖偶尔掉下一条小鱼干，用爪子接住 +200。
   取舍：球每小步最多走 1 像素、横竖分开判（横着撞了翻 dx，竖着撞了翻 dy），再快也穿不过砖和爪子；砖的碰撞框按整格算（连那 1 像素缝），球卡不进缝里。
   方向只有爪子能改，墙和砖只翻正负号，所以球永远是爪子给的角度，不会越弹越平、横着来回磨。速度按关卡、圈数和本关碎了几块慢慢加。 */
ARC.def('breakout',(()=>{
const W=160,H=144,OL='#3a2630',X0=5,Y0=24,CW=10,CH=6,NC=15,FL=3,FR=157,FT=12,PY=127,PW=25,BS=5;
// 砖：主色、亮边、暗边、分
const BK={r:['#e0533d','#ff9a7a','#9e2f2a',50],o:['#f08a3a','#ffc080','#b0582a',40],y:['#ffd84a','#fff4a8','#c89a1e',30],g:['#7ee08a','#c8f8c8','#3e9a5a',20],
  c:['#7ae8ff','#d0f8ff','#3a9ac0',10],p:['#f4a6b8','#ffd8e2','#c06a86',10],w:['#fff4dc','#ffffff','#c8b49a',10],H:['#a8a0c0','#e4e0f4','#5e5878',100]};
const dg=(n,c)=>[0,1,2,3,4].map(r=>ARC.F[n].slice(r*3,r*3+3).replace(/1/g,c).replace(/0/g,'.'));
const N=[dg('1','r'),dg('0','y'),dg('2','g'),dg('4','c')],E15='...............';
const LV=[
  ['rrrrrrrrrrrrrrr','ooooooooooooooo','yyyyyyyyyyyyyyy','ggggggggggggggg','ccccccccccccccc','ppppppppppppppp'],
  ['.HHHHH...HHHHH.','.rrrrr...rrrrr.','.ooooo...ooooo.','...HHHHHHHHH...','...yyyyyyyyy...','...ggggggggg...','ccccc.....ccccc','ppppp.....ppppp'],
  ['..HH.......HH..','..HpH.....HpH..','..ooooooooooo..','..ooggoooggoo..','wwooooopoooooww','wwoooooooooooww','...ooooooooo...','....rrryrrr....'],
  ['ppppppppppppppp',E15,...[0,1,2,3,4].map(r=>N.map(d=>d[r]).join('.')),E15,'H.H.H.H.H.H.H.H']];
const BALL=['.hrr.','hRrRr','rRrRr','rrRrR','.rrr.'],BALLP={r:'#e0533d',R:'#9e2f2a',h:'#ffb49a'};
const PAW=['..ooo...ooo...ooo...ooo..','.olllo.olllo.olllo.olllo.','obpppbobpppbobpppbobpppbo','olbbbbbbbbbbbbbbbbbbbbbbo','olbbbbbbbpppppppbbbbbbbbo','olbbbbbbpppppppppbbbbbbbo','.olbbbbbbpppppppbbbbbbbo.','..oolbbbbbbbbbbbbbbbboo..'];
const FISH=['..ddd...','.dllbd.d','debbbbdd','.dbbbd.d','..ddd...'],FISHP={d:'#8a5a2a',b:'#d8a060',l:'#f4d4a0',e:OL};
const HEAD=['b.....b','bb...bb','bbbbbbb','bebbbeb','bbbnbbb','.bbbbb.'];
const DEF={body:'#fff3e0',light:'#ffffff',outline:'#5a3a4a'};
const add=(g,n)=>{g.sc+=n;g.score(n)};
const sp=g=>Math.min(2.9,1.35+g.lv*.15+g.loop*.45+Math.min(.35,g.brk*.008));
function load(g){g.bt=[];g.hp=[];g.rows=LV[g.lv].length;LV[g.lv].forEach(r=>[...r].forEach(c=>{g.bt.push(c==='.'?'':c);g.hp.push(c==='H'?2:1)}));
  g.left=g.bt.filter(Boolean).length;g.brk=0;serve(g)}
function serve(g){g.st='serve';g.wt=0;g.fish=null}
function chips(g,x,y,col,n){for(let i=0;i<n;i++)g.fx.push({x:x+g.ri(0,8),y:y+g.ri(0,4),vx:g.rnd(-.8,.8),vy:g.rnd(-1.2,.2),c:col,l:g.ri(14,24)})}
// 打中第 i 块：硬砖先裂，再打才碎；碎了偶尔掉小鱼干；碎完了过关
function dmg(g,i){const t=g.bt[i],cx=X0+(i%NC)*CW,cy=Y0+Math.floor(i/NC)*CH;
  if(--g.hp[i]>0){g.sfx('wall');chips(g,cx,cy,BK.H[2],2);return}
  g.bt[i]='';g.left--;g.brk++;add(g,BK[t][3]);g.sfx('brick');chips(g,cx,cy,BK[t][0],4);
  if(!g.fish&&g.ri(1,12)===1)g.fish={x:cx+1,y:cy,t:0};
  if(!g.left){g.st='clear';g.ct=120;add(g,500);g.sfx('up')}}
// 球现在压着哪些砖：挑压得最多的那块
function hitB(g){const c0=Math.floor((g.bx-X0)/CW),c1=Math.floor((g.bx+BS-.01-X0)/CW),r0=Math.floor((g.by-Y0)/CH),r1=Math.floor((g.by+BS-.01-Y0)/CH);let best=-1,bo=0;
  for(let r=Math.max(0,r0);r<=Math.min(g.rows-1,r1);r++)for(let c=Math.max(0,c0);c<=Math.min(NC-1,c1);c++){const i=r*NC+c;if(!g.bt[i])continue;
    const o=(Math.min(g.bx+BS,X0+c*CW+CW)-Math.max(g.bx,X0+c*CW))*(Math.min(g.by+BS,Y0+r*CH+CH)-Math.max(g.by,Y0+r*CH));if(o>bo){bo=o;best=i}}
  if(best<0)return false;dmg(g,best);return true}
// 一小步（每轴 ≤1 像素）：先横后竖
function sub(g,mx,my){g.bx+=mx;
  if(g.bx<FL){g.bx=FL;g.dx=Math.abs(g.dx);g.sfx('wall')}else if(g.bx+BS>FR){g.bx=FR-BS;g.dx=-Math.abs(g.dx);g.sfx('wall')}else if(hitB(g)){g.bx-=mx;g.dx=-g.dx}
  if(g.st!=='play')return;const ob=g.by+BS;g.by+=my;
  if(g.by<FT){g.by=FT;g.dy=Math.abs(g.dy);g.sfx('wall')}else if(hitB(g)){g.by-=my;g.dy=-g.dy}
  else if(g.dy>0&&ob<=PY&&g.by+BS>PY&&g.bx+BS>g.px-1&&g.bx<g.px+PW+1){
    const rel=Math.max(-1,Math.min(1,(g.bx+BS/2-g.px-PW/2)/(PW/2+3)));let a=rel*Math.PI/3;if(Math.abs(a)<.15)a=(a<0||(!a&&g.dx<0)?-1:1)*.15;
    g.dx=Math.sin(a);g.dy=-Math.cos(a);g.by=PY-BS;g.sq=5;g.sfx('hit')}
  else if(g.by>H){g.st='dead';g.ct=70;g.lives--;g.fish=null;g.sfx('die')}}
/* ---------- 画 ---------- */
function bg(x){x.cls('#120c20');for(let j=16;j<H;j+=8)for(let i=4+(j&8?4:0);i<W;i+=8)x.px(i,j,'#221838');
  x.rect(0,FT-2,FL,H,'#2a1e46');x.rect(FL-1,FT-1,1,H,'#f4a6b8');x.rect(FR,FT-2,W-FR,H,'#2a1e46');x.rect(FR,FT-1,1,H,'#f4a6b8');x.rect(0,FT-2,W,1,'#2a1e46');x.rect(FL-1,FT-1,FR-FL+2,1,'#f4a6b8')}
function brick(x,t,bx,by,crack){const b=BK[t];x.rect(bx,by,9,5,b[0]);x.rect(bx,by,9,1,b[1]);x.rect(bx,by+4,9,1,b[2]);x.rect(bx+8,by+1,1,3,b[2]);
  if(t==='H'){x.px(bx+1,by+2,b[2]);x.px(bx+7,by+2,b[2]);if(crack){x.px(bx+4,by+1,OL);x.px(bx+5,by+2,OL);x.px(bx+4,by+3,OL);x.px(bx+3,by+3,OL)}}}
// 猫爪：胳膊从屏幕下边伸上来，上沿四个趾头（各一颗粉肉垫）、掌心一颗大的；sq 是刚接到球那一下往下一沉
function paw(x,X,pal,sq){const p=pal||DEF,ol=p.outline||OL,b=p.body,l=p.light||b,y=PY+(sq>2?1:0);X=Math.round(X);
  x.rect(X+3,y+8,19,H-y,ol);x.rect(X+4,y+8,17,H-y,b);x.rect(X+4,y+8,2,H-y,l);if(p.stripe){x.rect(X+7,y+11,13,2,p.stripe);x.rect(X+7,y+15,13,2,p.stripe)}if(p.spot)x.rect(X+13,y+10,5,3,p.spot);
  x.spr(PAW,X,y,{o:ol,b,l,p:'#f4a6b8'})}
return{n:'打砖块',en:'BREAKOUT',w:W,h:H,keys:'←→ 挪爪子　A 发球',
  init(g){g.sc=0;g.lv=0;g.loop=0;g.lives=3;g.px=W/2-PW/2;g.pd=0;g.ph=0;g.sq=0;g.fx=[];g.pop=[];load(g)},
  step(g,k){const d=(k.R?1:0)-(k.L?1:0);g.ph=d&&d===g.pd?g.ph+1:0;g.pd=d;g.px=Math.max(FL,Math.min(FR-PW,g.px+d*Math.min(3.2,1.6+g.ph*.08)));
    g.fx=g.fx.filter(p=>(p.x+=p.vx,p.y+=p.vy,p.vy+=.12,--p.l>0));g.pop=g.pop.filter(p=>(p.y-=.3,--p.l>0));if(g.sq>0)g.sq--;
    if(g.st==='clear'){if(--g.ct<=0){if(++g.lv>=LV.length){g.lv=0;g.loop++}load(g)}return}
    if(g.st==='dead'){if(--g.ct<=0){if(g.lives>0)serve(g);else{g.st='end';g.over()}}return}
    if(g.st==='end')return;
    const f=g.fish;if(f){f.y+=.7;f.t++;if(f.y+5>=PY&&f.y<PY+6&&f.x+8>g.px&&f.x<g.px+PW){add(g,200);g.sfx('eat');g.pop.push({x:f.x+4,y:PY-10,s:'+200',l:45});g.fish=null}else if(f.y>H)g.fish=null}
    if(g.st==='serve'){g.bx=g.px+(PW-BS>>1);g.by=PY-BS;if(k.p.A||++g.wt>300){g.st='play';const a=(d||(g.t&1?1:-1))*.4;g.dx=Math.sin(a);g.dy=-Math.cos(a);g.sfx('hit')}return}
    const s=sp(g),n=Math.ceil(s);for(let i=0;i<n&&g.st==='play';i++)sub(g,g.dx*s/n,g.dy*s/n);
    },
  draw(g,x){bg(x);
    for(let i=0;i<g.bt.length;i++)if(g.bt[i])brick(x,g.bt[i],X0+(i%NC)*CW,Y0+Math.floor(i/NC)*CH,g.hp[i]<2);
    g.fx.forEach(p=>x.px(p.x,p.y,p.c));
    if(g.fish)x.spr(FISH,g.fish.x,g.fish.y,FISHP,(g.fish.t>>3)&1);
    paw(x,g.px,g.pal,g.sq);
    if(g.st==='serve'||g.st==='play')x.spr(BALL,g.bx,g.by,BALLP);
    g.pop.forEach(p=>x.text(p.s,p.x,p.y,'#ffd84a',{al:'c',sh:OL}));
    const stg=g.lv+1+g.loop*LV.length;
    if(g.st==='serve'){x.text('STAGE '+stg,W/2,90,'#ffd84a',{k:2,al:'c',sh:OL});if((g.wt>>4)&1||g.wt<20)x.text('READY',W/2,106,'#fff4dc',{al:'c',sh:OL})}
    if(g.st==='clear'){x.text('CLEAR!',W/2,86,'#7ee08a',{k:2,al:'c',sh:OL});x.text('BONUS 500',W/2,102,'#fff4dc',{al:'c',sh:OL})}
    // HUD：分数、最高分、关卡、命（小猫头）
    x.rect(0,0,W,FT-2,'#0a0612');x.text(ARC.pad(g.sc),3,3,'#fff4dc');x.text('HI '+ARC.pad(Math.max(g.best||0,g.sc)),37,3,'#ffd84a');x.text('STAGE '+stg,84,3,'#7ae8ff');
    const p=g.pal||DEF;for(let i=0;i<g.lives;i++)x.spr(HEAD,W-10-i*9,2,{b:p.body,e:p.outline||OL,n:'#f4a6b8'})},
  // 开机画面的底：上面一排彩虹砖，底下一只爪子（你的猫的毛色）颠着毛线球
  attract(x,t,m){bg(x);for(let r=0;r<4;r++)for(let c=0;c<NC;c++)brick(x,'roygc'[r],X0+c*CW,16+r*CH);
    const u=(t*.3)%2,bx=Math.round(FL+1+(u<1?u:2-u)*(FR-FL-BS-2)),by=Math.round(PY-BS-Math.abs(Math.sin(t*2.4))*38);
    paw(x,Math.max(FL,Math.min(FR-PW,bx+3-(PW>>1))),m&&m.pal||DEF,0);x.spr(BALL,bx,by,BALLP)}}})());
