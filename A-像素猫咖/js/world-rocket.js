/* 1024 猫咖 · 猫猫星球：坐纸箱火箭（设计见 docs/店内设计.md 第四节"猫猫星球"）。依赖 world-acts.js、world4-things.js、world4-quest.js、world4-vista.js、world-eggs.js、world-games.js、map-planet.js、planet-art.js。
   四步（做完一步 A.eggs.step('planet',i)；第一次落到星球上 A.eggs.found('planet')）：
   ① 望远镜：看得够久，偶尔一颗长着两只耳朵的小星球从镜筒边上慢慢划过（叠在月亮那张特写上）
   ② 图书馆的检索柜：看到过那颗星球以后，最里面那格多一张《纸箱火箭制造指南》
   ③ 三样零件，凑过去碰一下就算拿到：午睡角的大纸箱、吧台咖啡机边上的漏斗、屋顶跑轮放完烟花以后从天上掉下来的那一筒
   ④ 屋顶斜屋顶底下的发射台上搭起一只纸箱火箭；坐进去，倒数三、二、一，发射
   飞：一段特写（挂在"看风景"那一套上，画面在 planet-art.js），落在星球上；星球上走走、碰碰只有这里才有的东西，坐回火箭飞回屋顶。
   星球上：水晶鱼池（坐在池边，看准了伸爪捞跳出水面的水晶鱼）、大毛线团（爬上去；扯一下线头，天上那圈毛线环跟着晃）、插旗子的小山包、会唱歌的水晶、蹦蹦坑（一蹦老高）。
   重力小：在星球上走起来一蹦一蹦，跳得又高又慢。补位的猫不来（这里的东西都不写 ai）。
   记在你的猫身上（彩蛋记录里 planet 那一条）：steps 四步、parts 拿到的零件、flag 插过旗子、fish 捞到几条。在星球上关了页面，下次进店醒在屋顶的火箭旁边。 */
WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,say,sfx,news,after,T,settle,setK,TID}=A;
const now=()=>A.t,tick=f=>A.tickers.push(f),L=PLA.live,near=(c,p,d)=>Math.hypot(c.x-p.x,c.y-p.y)<d,onPlanet=c=>c.y>=Y5-40,here=()=>A.floorOf(me.y).id;
const st=()=>{const e=A.guide.eggs();return e.planet=e.planet||{}},rd=()=>A.guide.eggs().planet||{},save=()=>A.guide.save();   // st 要写的时候用，rd 只读
const done=i=>A.eggs.steps('planet').includes(i);
function stepDone(i,msg,nw){if(done(i))return false;A.eggs.step('planet',i);if(nw)news(nw);if(msg)say(msg);return true}
const PARTS=['box','funnel','fw'],PN={box:'一只大纸箱',funnel:'一个漏斗',fw:'一筒烟花'},parts=()=>rd().parts||{},need=k=>done(1)&&!parts()[k];
L.at='roof';L.ride={};
let buildAt=0;   // 三样凑齐以后过一会儿搭起火箭（刷新页面错过了也补上）
tick(()=>{const p=parts(),c=PAL[me.pal]||PAL[0],f=rd().flag;if(!done(2)&&done(1)&&PARTS.every(k=>p[k])&&now()>=buildAt&&stepDone(2,'零件齐了。要飞，得去最高、最开阔的地方','三样火箭零件凑齐了'))builtNow();
  L.built=done(2);L.funnelGot=!!p.funnel;L.pal=me.pal;L.flag=f?{col:c.collar||'#e0533d',paw:c.body}:null});
// 小粒子：落地扬起的灰、水花、水晶的亮点（低重力，落得慢）
const FX=[],fx=(x,y,vx,vy,life,c,g=10)=>{if(FX.length<180)FX.push({x,y,vx,vy,g,t0:now(),life,c})};
tick(dt=>{for(let i=FX.length-1;i>=0;i--){const f=FX[i];if(now()-f.t0>f.life){FX.splice(i,1);continue}f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=f.g*dt}});
A.overs.push(vis=>{for(const f of FX){const k=(now()-f.t0)/f.life,x=Math.round(f.x),y=Math.round(f.y);if(vis(x,y,1,1)&&!(k>.7&&Math.floor(now()*20+x)%2))P1(x,y,f.c)}});
// 镜头：抬头看天（扯线头、看旗子）、蹦起来的时候跟着往上
let look=null;const cam0=A.camHook;A.camHook=(vw,vh)=>{const o=cam0?cam0(vw,vh):null;if(o)return o;if(look&&now()<look.until&&onPlanet(me))return{x:me.x,y:look.y(vh),k:2.2};look=null;return null};

/* ================= ① 望远镜里那颗长耳朵的星球 ================= */
const SC={v:null,next:0,pass:null};
// 镜筒和月亮的位置、大小：望远镜那张画导出的 VA.geo.moon → {cx,cy,r 镜筒半径,mr 月亮半径}；没有就按画面中心估
function scopeGeo(w,h){try{const g=VA.geo&&VA.geo.moon&&VA.geo.moon(w,h);if(g&&isFinite(g.cx)&&isFinite(g.cy)&&isFinite(g.r))return g}catch(e){}const r=Math.round(Math.min(w,h)*.42);return{cx:Math.round(w/2),cy:Math.round(h*.47),r,mr:Math.round(r*.86)}}
tick(()=>{const V=A.vista.cur;if(!V||V.kind!=='moon'||V.phase!=='on'){SC.v=null;SC.pass=null;return}
  if(SC.v!==V){SC.v=V;SC.next=now()+rr(12,15);SC.pass=null}
  if(!SC.pass&&now()>=SC.next)SC.pass={t0:now(),dur:9,seen:0};const ps=SC.pass;if(!ps)return;const k=(now()-ps.t0)/ps.dur;
  if(k>=1){SC.pass=null;SC.next=now()+rr(25,40);return}
  if(k>.3&&!ps.seen){ps.seen=1;if(stepDone(0,'……那颗星星长着两只耳朵？一晃就不见了。书里会不会写过它？','你在望远镜里看到一颗长着耳朵的星球'))sfx('twinkle')}});
A.vista.overlay('moon',E=>{const ps=SC.pass;if(!ps)return;const g=scopeGeo(E.w,E.h);PLA.scopePass(g.cx,g.cy,g.r,(now()-ps.t0)/ps.dur,E.t,g.mr)});

/* ================= ② 检索柜里多一张《纸箱火箭制造指南》 ================= */
const CARD='《纸箱火箭制造指南》：一只大纸箱，要大到坐得进一只猫；一个漏斗，倒过来扣在顶上当尖头，闻得到咖啡味的最好；一筒烟花，要还没放出去的。三样凑齐，找一个最高、最开阔的地方，头顶上什么也别挡着。';
function openCard(){const first=!done(1),p=parts();
  A.infoDialog('rocketcard','检索柜','book',[{k:'text',t:first?'最里面那格抽屉里，多了一张手写的卡片：':'最里面那格抽屉里，还是那张手写的卡片：'},{k:'book',t:CARD},...(PARTS.some(k=>p[k])?[{k:'steps',items:PARTS.map(k=>({t:PN[k],done:!!p[k]}))}]:[])],'memory',['docs']);
  if(first)stepDone(1,null,'你在检索柜里翻到一张《纸箱火箭制造指南》')}
if(A.Q){const oc0=A.Q.onCatalog,cl0=A.Q.catalogLabel;
  A.Q.onCatalog=c=>{if(oc0&&oc0(c))return true;if(c.me&&done(0)){openCard();return true}return false};
  A.Q.catalogLabel=c=>(cl0&&cl0(c))||(c.me&&done(0)&&!done(1)?'翻翻检索柜最里面那格':null)}
// 关上卡片以后说一句（像个谜语，不说去哪）
const close0=A.dlg.close;A.dlg.close=()=>{const sp=A.dlg.spec;close0();if(sp&&/^rocketcard-/.test(sp.id||'')&&!PARTS.some(k=>parts()[k]))after(.4,()=>say('三样东西……好像都在店里见过'))};

/* ================= ③ 三样零件 ================= */
function getPart(k){if(!need(k))return;const s=st(),p=s.parts=s.parts||{};p[k]=Date.now();save();const n=PARTS.filter(q=>p[q]).length;sfx('ding');
  say({box:'正好坐得下一只猫：火箭的身子有了',funnel:'倒过来扣着，就是火箭的尖头',fw:'没放出去的烟花：火箭的发动机有了'}[k]+`（${n}/3）`);
  if(k==='fw')L.fw=null;if(n===3)buildAt=now()+2.2}
// 大纸箱：跳进去比一比，正好坐得下（纸箱还在午睡角，火箭用的是"它这么大的"）
{const th=TID('bigbox');if(th){const lab0=th.label,go0=th.go,ok0=th.ok,B=P.bigBox;
  th.label=c=>c.me&&need('box')?'量一量这只大纸箱':typeof lab0==='function'?lab0(c):lab0;th.ok=c=>c.me&&need('box')?!c.hold:ok0(c);
  th.go=c=>{if(!(c.me&&need('box'))){go0(c);return}run(c,[{go:P.bigBoxAt},{jump:{x:B.x+20,y:B.y+15,z:B.y+10},h:12,dur:.45},{k:'sit',dur:1,ex:'happy'},{jump:{...P.bigBoxAt},h:10,dur:.4},{fn:c=>{c.z=undefined;getPart('box')}}])}}}
// 漏斗：吧台上，咖啡机左边
T({id:'plFunnel',n:'漏斗',hit:[P.plFunnel.x-9,P.plFunnel.y-15,19,16],at:P.plFunnelAt,near:[P.plFunnelAt.x-14,P.plFunnelAt.y-14,28,24],label:'借走这个漏斗',hidden:c=>!c.me||!need('funnel'),
  go(c){run(c,[{go:P.plFunnelAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.6},{fn:()=>getPart('funnel')}])}});
// 烟花：屋顶放过一场烟花以后（跑轮的串灯全亮），最后一筒没炸开，从天上掉下来，落在跑轮旁边
let showAt=-1;
tick(dt=>{for(const f of S.fireworks||[])if(!f._pl){f._pl=1;if(f.y0>=Y3&&f.y0<Y3+540)showAt=now()}
  if(need('fw')&&showAt>0&&!L.fw&&now()-showAt>8.5){L.fw={fall:0};if(here()==='roof'&&near(me,P.plFw,320))sfx('whoosh')}
  if(L.fw&&L.fw.fall<1){L.fw.fall=Math.min(1,L.fw.fall+dt/1.2);if(L.fw.fall>=1&&here()==='roof'){sfx('clunk');S.puffs.push({x:P.plFw.x,y:P.plFw.y-2,t0:now()});if(near(me,P.plFw,320))say('有一筒烟花没炸开，掉回了平台上')}}
  if(L.fw&&!need('fw'))L.fw=null});
T({id:'plFw',n:'没放出去的烟花',hit:[P.plFw.x-8,P.plFw.y-8,20,10],at:P.plFwAt,near:[P.plFwAt.x-14,P.plFwAt.y-14,34,24],label:'捡起这筒没放出去的烟花',hidden:c=>!c.me||!need('fw')||!L.fw||L.fw.fall<1,
  go(c){run(c,[{go:P.plFwAt},{fn:c=>{c.face='R'}},{k:'pounce',dur:.8},{fn:()=>getPart('fw')}])}});

/* ================= ④ 纸箱火箭：倒数、发射、飞、落地 ================= */
const PADS={roof:{x:P.plPad.x,y:P.plPad.y-5,at:P.plPadAt,out:P.plWake},planet:{x:P.plPad2.x,y:P.plPad2.y,at:P.plPad2At,out:P.plOut}};
let R=null,flown=false,reveal=0;   // R：这一趟；flown：这一次进店坐火箭去过星球
function builtNow(){if(here()==='roof'&&near(me,PADS.roof,300)){reveal=now();sfx('fanfare');for(let i=0;i<4;i++)S.puffs.push({x:PADS.roof.x+rr(-14,14),y:PADS.roof.y-rr(0,30),t0:now()+i*.08})}news('一只纸箱火箭搭好了，就等一只猫坐进去')}
A.overs.push(vis=>{if(!reveal||now()-reveal>2.2)return;const k=(now()-reveal)/2.2;for(let i=0;i<10;i++){const a=i/10*Math.PI*2+k*2,r=12+k*26;spark(Math.round(PADS.roof.x+Math.cos(a)*r),Math.round(PADS.roof.y-22+Math.sin(a)*r*.7),now()+i)}});
function board(from){if(R)return;const pd=PADS[from];
  run(me,[{go:pd.at},{fn:c=>{c.face='R'}},{jump:{x:pd.x,y:pd.y,z:pd.y+.5},h:from==='planet'?26:14,dur:from==='planet'?.8:.45},{fn:()=>count(from)}])}
function count(from){R={from,dir:from==='roof'?1:-1,ph:'count',t0:now(),n:3};me.hidden=true;me.z=PADS[from].y+.5;L.ride={cat:1,count:3};sfx('beepdown');
  settle(me,{k:'sit',prompt:()=>!R?'':R.ph==='count'?`倒数 ${R.n}…… · 方向键跳出来`:R.ph==='land'?'着陆……':'发射！',steer:(dx,dy)=>{if((dx||dy)&&R&&R.ph==='count')abort();return true},act:()=>true,leave:()=>R&&R.ph==='count'?outSteps():[]});
  me.place.stay=()=>!!R&&R.ph!=='count';me.doing='坐在纸箱火箭里'}
function outSteps(){const pd=PADS[R.from];R=null;L.ride={};me.hidden=false;me.doing=null;say('还没准备好？火箭就停在这儿等你');return[{jump:{x:pd.at.x,y:pd.at.y},h:12,dur:.45},{fn:c=>{c.z=undefined}}]}
function abort(){if(!R||R.ph!=='count')return;me.place=null;run(me,outSteps())}
function ignite(){R.ph='lift';R.t0=now();L.ride.count=0;sfx('rocket');after(.3,()=>sfx('whoosh'));
  if(R.from==='roof')stepDone(3,null,'纸箱火箭点火了');say(R.from==='roof'?'三、二、一……发射！':'坐稳了，回家！');
  const pd=PADS[R.from];S.cats.forEach(c=>{if(c.me||c.hidden||!near(c,pd,220))return;c.face=c.x<pd.x?'R':'L';emote(c,'bang',1.6);if(A.idle(c)&&!c.place&&!c.puppet)run(c,[{k:'alert',dur:1.4,soft:1}])})}
// 截一张屋顶（没有火箭）给特写当第一幅画：和店里同一个镜头，飞起来以后它往下走
function roofShot(w,h){const pd=PADS.roof,cx=Math.max(0,Math.min(960-w,Math.round(pd.x-w/2))),cy=Math.max(Y3,Math.min(Y3+540-h,Math.round(pd.y-12-.25*h-h/2)));
  L.snapHide=1;let cv;try{cv=A.snap(cx,Y3,w,cy+h-Y3)}finally{L.snapHide=0}
  // 截图顶上那一截抖动着淡进太空的颜色，接缝看不出来
  try{const x=cv.getContext('2d'),n=Math.min(24,cv.height),im=x.getImageData(0,0,cv.width,n),d=im.data;for(let y=0;y<n;y++)for(let i=0;i<cv.width;i++)if(PLA.bay(i,y)<1-y/n){const o=(y*cv.width+i)*4;d[o]=4;d[o+1]=3;d[o+2]=14}x.putImageData(im,0,0)}catch(e){}
  return{cv,sy:-(cy-Y3),px:pd.x-cx,py:pd.y-cy}}
function openFlight(){const v=A.view(),w=v.w,h=v.h,s=roofShot(w,h);R.F={dir:R.dir,u:0,T:R.dir>0?15:9.5,boost:0,boostT:0,snap:s.cv,sy:s.sy,px:s.px,py:s.py,pal:me.pal};R.ph='fly';A.vista.open('rocket')}
function boost(){if(!R||!R.F||R.ph!=='fly')return;if(now()>R.F.boostT)sfx('whoosh');R.F.boostT=now()+1.2}
// hideOk：飞的时候你的猫一直藏着（别人看不到它坐在发射台边上）；esc：字幕里 Esc 写"直接降落"
A.vista.add('rocket',{hideOk:true,info:()=>({n:'纸箱火箭',sub:R&&R.dir<0?'飞回屋顶':'飞往猫猫星球',hint:'E 加把劲',esc:'直接降落'}),draw:E=>{if(R&&R.F)PLA.flight(E,R.F);else R0(E)},
  close:()=>arrive(),act:()=>boost(),click:()=>boost(),key:e=>/^(Arrow|[wasdWASD]$)/.test(e.key),cap:()=>''});
const R0=E=>{C.fillStyle='#04030e';C.fillRect(0,0,E.w,E.h)};
// 落地：画面黑下去的那一下换到目的地（星球上：火箭从天上慢慢落下来；回屋顶：特写里已经落好了）
function arrive(){if(!R||R.ph!=='fly')return;const dst=R.dir>0?'planet':'roof',pd=PADS[dst],from=A.floorOf(me.y);R.ph='land';R.t0=now();R.dst=dst;if(dst==='planet')flown=true;
  L.at=dst;L.ride={cat:1,lift:dst==='planet'?250:0,flame:dst==='planet'?12:0};me.x=pd.x;me.y=pd.y;me.z=pd.y+.5;me.hidden=true;me.face='R';
  if(R.F)R.F.snap=null;PLA.drop();if(A.onFloor)A.onFloor(A.floorOf(me.y),{id:'rocket',k:'warp',from:from.id,to:A.floorOf(me.y).id,out:{x:pd.x,y:pd.y}})}
function hopOut(){const dst=R.dst,o=PADS[dst].out,first=dst==='planet'&&!A.eggs.has('planet');R=null;L.ride={};me.hidden=false;me.place=null;me.doing=null;
  run(me,[{jump:{x:o.x,y:o.y},h:dst==='planet'?34:12,dur:dst==='planet'?1.1:.45},{fn:c=>{c.z=undefined;if(dst!=='planet'){say('回到屋顶了。火箭还停在这儿，想去随时再去');return}
    if(first)A.eggs.found('planet');else say(rnd(['又回到猫猫星球了','耳朵山还在，地球也还在','低重力，走两步就要飘起来']))}}]);
  if(dst==='planet'){sfx('meow');for(let i=0;i<10;i++)fx(o.x+rr(-6,6),o.y,rr(-24,24),rr(-26,-8),1.6,i%2?'#a888d8':'#c8a8f0',14)}}
tick(dt=>{if(!R)return;const k=now()-R.t0,pd=PADS[R.ph==='land'?R.dst:R.from];
  if(R.ph==='count'||R.ph==='lift'){const v=A.view();if(PLA.flightPrep(v.w,v.h,.8)){const Lr=PLA.radList(v.h);PLA.warm(R.dir>0?Lr:Lr.filter(r=>r<=60).reverse(),.9)}}
  if(R.ph==='count'){const n=3-Math.floor(k/.9);if(n!==R.n&&n>0){R.n=n;L.ride.count=n;sfx('beepdown')}if(k>=2.7)ignite()}
  else if(R.ph==='lift'){L.ride.flame=5+Math.min(1,k/.6)*9;L.ride.shake=1;L.ride.lift=Math.max(0,k-.45)**2*(R.from==='planet'?26:44);if(Math.random()<.5)S.puffs.push({x:pd.x+rr(-14,14),y:pd.y+rr(-3,2),t0:now()});
    if(k>1.15&&!R.F)openFlight()}
  else if(R.ph==='fly'){const V=A.vista.cur;if(V&&V.kind==='rocket'){me.hidden=true;if(V.phase==='on'){const F=R.F;F.boost=F.boostT>now()?1:0;F.u+=dt*(F.boost?2:1);if(F.u>=F.T+(F.dir<0?.8:0))A.vista.close()}}
    if(R.dir>0)PLA.warm(PLA.radList(A.view().h),.9)}
  else if(R.ph==='land'){if(R.dst==='planet'){const q=Math.min(1,k/2.6);L.ride.lift=250*Math.pow(1-q,2.2);L.ride.flame=q<1?7+Math.sin(now()*20)*2:0;L.ride.shake=q<1?1:0;
      if(q>=1&&!R.down){R.down=1;sfx('land');for(let i=0;i<5;i++)S.puffs.push({x:pd.x+rr(-18,18),y:pd.y+rr(-2,3),t0:now()+i*.05});for(let i=0;i<16;i++)fx(pd.x+rr(-20,20),pd.y,rr(-30,30),rr(-30,-6),2,i%3?'#8a6ab8':'#c8a8f0',12)}}
    else if(k<.6&&Math.random()<.3)S.puffs.push({x:pd.x+rr(-12,12),y:pd.y+rr(-2,2),t0:now()});
    if(k>(R.dst==='planet'?3.1:.8)&&!R.out){R.out=1;hopOut()}}
  // 火光
  const fl=L.ride&&L.ride.flame;if(fl>0){const p=L.at==='planet'?PADS.planet:PADS.roof;A.lights.push({x:p.x,y:p.y-(L.ride.lift||0)+6,r:34,col:'#ffb060',a:.9})}});
T({id:'plRocket',n:'纸箱火箭',hit:[P.plPad.x-12,P.plPad.y-50,24,46],at:P.plPadAt,near:[P.plPadAt.x-18,P.plPadAt.y-14,36,24],label:'坐进纸箱火箭',hidden:c=>!c.me||!L.built||L.at!=='roof'||!!R,go(){board('roof')}});
T({id:'plRocket2',n:'纸箱火箭',hit:[P.plPad2.x-12,P.plPad2.y-45,24,46],at:P.plPad2At,near:[P.plPad2At.x-18,P.plPad2At.y-14,36,24],label:'坐回火箭（飞回屋顶）',hidden:c=>!c.me||L.at!=='planet'||!!R,go(){board('planet')}});
// 指路（world4-guide.js 的 viaStairs）：人在星球上、要去的地方在店里，没有楼梯，就指向火箭
{const np0=A.nextPortal;A.nextPortal=(fa,fb)=>{const p=np0(fa,fb);if(p||!fa||!fb||fa.id!=='planet'||fb.id==='planet')return p;return{id:'rocket',from:'planet',to:'roof',at:{...P.plPad2At}}}}
// 在星球上关了页面：下次进店醒在屋顶的火箭旁边（不是坐火箭来的，一律挪回屋顶）
tick(()=>{if(flown||R||me.transit||here()!=='planet')return;const p=P.plWake;me.x=p.x;me.y=p.y;me.z=undefined;me.hidden=false;me.place=null;L.at='roof'});

/* ================= 星球上 ================= */
// 重力小：走起来一蹦一蹦（只是画的时候往上提一点，不改位置，也不发给别人）；你自己落地扬起一点灰
const BNC=[];let hopPh=0;
A.drawers.push(()=>{BNC.length=0;for(const c of S.cats){if(c.hidden||c.gone||c.z!=null||c.y<Y5||!c.k||!c.k.startsWith('walk')||(c.cur&&c.cur.jump))continue;
  const b=Math.round(Math.sin(((now()*2.6+(c.o||0))%1)*Math.PI)*5);BNC.push(c,c.dy);c.dy=(c.dy||0)-b}});
A.overs.push(()=>{for(let i=0;i<BNC.length;i+=2)BNC[i].dy=BNC[i+1];BNC.length=0});
tick(()=>{if(!onPlanet(me)||!me.k.startsWith('walk')||me.z!=null)return;const ph=(now()*2.6+(me.o||0))%1;if(ph<hopPh)for(let i=0;i<3;i++)fx(me.x+rr(-4,4),me.y,rr(-10,10),rr(-14,-4),.9,i%2?'#8a6ab8':'#b898e0',10);hopPh=ph});

/* ---------- 水晶鱼池：隔一会儿跳出来一条，在低重力里划一道又高又慢的弧；坐在池边，看准了伸爪 ---------- */
const LK=P.plLake,FISH=[];let fishT=0,swipeT=-9,caught=null;
const fishing=()=>me.doing==='在池边捞水晶鱼'&&me.place;
const inLake=(x,y)=>((x-LK.x)/(LK.rx-8))**2+((y-LK.y)/(LK.ry-4))**2<1;
function splash(x,y,n=6){for(let i=0;i<n;i++)fx(x+rr(-3,3),y,rr(-18,18),rr(-40,-16),1.5,i%2?'#7ae8ff':'#e0fcff',22);if(here()==='planet'&&near(me,{x,y},220))sfx('splash')}
function leap(close){let x0,y0,x1,y1,h,dur;
  if(close){x1=LK.x-LK.rx+6+rr(0,5);y1=LK.y+rr(-3,4);x0=x1+rr(40,64);y0=LK.y+rr(-5,5);h=rr(27,34);dur=rr(1.9,2.4)}   // 落在你爪子底下的水边
  else{x0=LK.x+rr(-LK.rx*.6,LK.rx*.6);y0=LK.y+rr(-LK.ry*.4,LK.ry*.4);x1=x0+rr(-50,50);y1=y0+rr(-5,5);if(!inLake(x1,y1)){x1=LK.x+rr(-30,30);y1=LK.y}h=rr(18,48);dur=rr(1.6,2.7)}
  FISH.push({x0,y0,x1,y1,h,dur,t0:now(),gold:Math.random()<.1});splash(x0,y0,4)}
const fpos=f=>{const k=(now()-f.t0)/f.dur;return{k,x:f.x0+(f.x1-f.x0)*k,y:f.y0+(f.y1-f.y0)*k-4*f.h*k*(1-k)}};
function swipe(){if(now()-swipeT<.55)return;swipeT=now();setK(me,'pounce');sfx('kick');after(.55,()=>{if(fishing())setK(me,'sit','focus')})}
tick(dt=>{if(!onPlanet(me)&&!FISH.length)return;
  if(onPlanet(me)&&(fishT-=dt)<=0){const f=fishing();fishT=f?rr(1.4,2.3):rr(1.8,3.4);leap(f&&Math.random()<.75)}
  for(let i=FISH.length-1;i>=0;i--){const f=FISH[i],p=fpos(f);if(p.k>=1){if(!f.back)splash(f.x1,f.y1,5);FISH.splice(i,1);continue}A.lights.push({x:p.x,y:p.y,r:12,col:f.gold?'#ffd84a':'#7ae8ff',a:.9})
    // 伸爪的那一下（0.1～0.4 秒）：爪子够得着就捞到了
    const k=now()-swipeT;if(!f.back&&fishing()&&k>.08&&k<.42&&Math.hypot(p.x-(me.x+(me.face==='L'?-13:13)),p.y-(me.y-9))<14){FISH.splice(i,1);catchFish(f)}}
  if(caught&&now()-caught.t0>1.5){const c=caught;caught=null;FISH.push({x0:me.x+(me.face==='L'?-6:6),y0:me.y-24,x1:LK.x+rr(-20,20),y1:LK.y,h:22,dur:1.5,t0:now(),gold:c.gold,back:1})}});
function catchFish(f){caught={t0:now(),gold:f.gold};const s=st();s.fish=(s.fish||0)+1;if(f.gold)s.gold=(s.gold||0)+1;save();sfx('twinkle');setK(me,'hold');
  for(let i=0;i<8;i++)fx(me.x+rr(-6,6),me.y-24,rr(-16,16),rr(-24,-6),1.4,f.gold?'#ffd84a':'#a8f0ff',8);
  say(f.gold?'金色的水晶鱼！在爪子里亮得像一颗小太阳':s.fish===1?'捞到一条水晶鱼！它在爪子里亮了一下，又慢慢游回了池子里':rnd(['又捞到一条！','水晶鱼在爪子里叮地亮了一下','凉凉的，亮晶晶的'])+`（捞到过 ${s.fish} 条）`);
  after(1.4,()=>{if(fishing())setK(me,'sit','focus')})}
A.overs.push(vis=>{for(const f of FISH){const p=fpos(f);if(!vis(p.x-8,p.y-8,16,16))continue;const k=Math.min(.999,p.k),dir=f.x1>=f.x0?1:-1,ang=Math.max(-1,Math.min(1,4*f.h*(1-2*k)/Math.max(12,Math.abs(f.x1-f.x0))));PLA.fish(p.x,p.y,dir,ang,f.gold,now())}
  if(caught){const x=Math.round(me.x+(me.face==='L'?-6:6)),y=Math.round(me.y-24-Math.sin(now()*4)*1.5);C.save();C.globalCompositeOperation='lighter';C.globalAlpha=.6;C.drawImage(glowTex(10,caught.gold?'#ffd84a':'#7ae8ff'),x-10,y-10);C.restore();PLA.fish(x,y,me.face==='L'?-1:1,.2,caught.gold,now())}});
T({id:'plLake',n:'水晶鱼池',hit:[LK.x-LK.rx,LK.y-LK.ry,LK.rx*2,LK.ry*2],at:P.plLakeAt,near:[P.plLakeAt.x-16,P.plLakeAt.y-16,36,30],label:'坐在池边捞水晶鱼',hidden:c=>!c.me,
  go(c){run(c,[{go:P.plLakeAt},{fn:c=>{c.face='R';settle(c,{k:'sit',ex:'focus',prompt:()=>`E · 伸爪 · 捞到过 ${rd().fish||0} 条 · 方向键离开`,act:()=>{swipe();return true},leave:c=>{c.doing=null;return[]}});c.doing='在池边捞水晶鱼';fishT=.6;
    if(!rd().fish)say('水晶鱼会跳出水面，看准了再伸爪')}}])}});

/* ---------- 大毛线团：爬上去坐着；它拖出来的线头一直连到天上那圈毛线环，扯一下，环就晃一下 ---------- */
const YT=P.plYarnTop;
T({id:'plYarn',n:'大毛线团',hit:[P.plYarn.x-30,P.plYarn.y-30,60,52],at:P.plYarnAt,near:[P.plYarnAt.x-16,P.plYarnAt.y-14,36,26],label:'爬上大毛线团',hidden:c=>!c.me,
  go(c){run(c,[{go:P.plYarnAt},{jump:{...YT},h:46,dur:1.2},{fn:c=>{c.face='L';settle(c,{k:'sit',ex:'content',leave:c=>[{jump:{...P.plYarnAt},h:24,dur:1},{fn:c=>{c.z=undefined;c.doing=null}}]});c.doing='坐在大毛线团顶上';
    look={until:now()+3,y:vh=>Y5+250};say(rnd(['软软的，一坐就陷下去一点','从这儿看，毛线环好像就在头顶上','坐在毛线团顶上，地球就在眼前']))}}])}});
let spinTo=0;
function pull(){L.pull=1;L.ringWob={t0:now(),a:7};spinTo+=.5;sfx('spin');const s=st(),n=s.pulls=(s.pulls||0)+1;save();look={until:now()+3.4,y:()=>Y5+268};
  after(.6,()=>say(n===1?'线头一直连到天上……那圈毛线环晃了一下！':rnd(['天上的毛线环又晃了一下','扯一下，整个天都跟着晃','毛线团转了半圈，环也跟着转'])))}
tick(dt=>{L.pull=Math.max(0,(L.pull||0)-dt*.8);if(spinTo>(L.spin||0))L.spin=Math.min(spinTo,(L.spin||0)+dt*.45)});
T({id:'plEnd',n:'线头',hit:[P.plEnd.x-6,P.plEnd.y-6,14,10],at:P.plEndAt,near:[P.plEndAt.x-16,P.plEndAt.y-14,32,24],label:'扯一下线头',hidden:c=>!c.me,
  go(c){run(c,[{go:P.plEndAt},{fn:c=>{c.face='R'}},{k:'pounce',dur:.7},{k:'bat',dur:.9,fn:()=>pull()},{k:'sit',dur:1.4,ex:'lookUp'}])}});

/* ---------- 插旗子的小山包：插上你的旗子（你项圈的颜色，上面一个你毛色的爪印），一直立在那儿 ---------- */
const FG=P.plFlag;
T({id:'plFlag',n:'小山包',hit:[FG.x-8,FG.y-28,24,32],at:P.plFlagAt,near:[P.plFlagAt.x-16,P.plFlagAt.y-14,36,26],label:()=>rd().flag?'看看你的旗子':'插上你的旗子',hidden:c=>!c.me,
  go(c){const first=!rd().flag;run(c,[{go:P.plFlagAt},{fn:c=>{c.face='R'}},...(first?[{k:'pounce',dur:.8},{fn:()=>{st().flag={at:Date.now()};save();sfx('stamp');S.puffs.push({x:FG.x,y:FG.y,t0:now()});news('你在猫猫星球上插了一面旗子');say('插好了。你的旗子会一直立在这儿')}},{k:'happy',dur:1.2}]:
    [{fn:c=>{settle(c,{k:'sit',ex:'lookUp'});look={until:now()+2.6,y:()=>Y5+250};say(rnd(['旗子还立在这儿','没有风，旗子也在慢慢晃——低重力','从这儿看得见地球上那个小金点']))}}])])}});

/* ---------- 会唱歌的水晶：敲一下响一声，敲完一整段，几根一起亮 ---------- */
const MEL=[0,2,4,7,6,4,5,7],CR=[3,0,2,1,4,2,0,1];let singI=0;L.sing=[0,0,0,0,0];
function ding(){const i=singI%MEL.length;L.sing[CR[i]]=1;sfx('note',MEL[i]);singI++;setK(me,'bat');after(.4,()=>{if(me.doing==='在敲水晶')setK(me,'sit','curious')});
  const S0=PLA.SING[CR[i]];for(let j=0;j<3;j++)fx(P.plSing.x+S0.dx+rr(-2,2),P.plSing.y-S0.h*.6,rr(-8,8),rr(-20,-8),1.2,j%2?'#ffffff':'#ffb0e0',4);
  if(singI%MEL.length===0)after(.5,()=>{L.sing=[1,1,1,1,1];sfx('twinkle');for(let j=0;j<20;j++)fx(P.plSing.x+rr(-10,26),P.plSing.y-rr(4,30),rr(-14,14),rr(-30,-10),2,['#7ae8ff','#ff9ad8','#ffd84a','#ffffff'][j%4],3);say('水晶们一起唱完了一整段')})}
tick(dt=>{for(let i=0;i<5;i++)L.sing[i]=Math.max(0,L.sing[i]-dt*1.4);L.sing.forEach((v,i)=>{if(v>.1){const s=PLA.SING[i];A.lights.push({x:P.plSing.x+s.dx,y:P.plSing.y-s.h*.5,r:18,col:s.pal[3],a:v})}})});
T({id:'plSing',n:'会唱歌的水晶',hit:[P.plSing.x-10,P.plSing.y-32,36,34],at:P.plSingAt,near:[P.plSingAt.x-14,P.plSingAt.y-14,32,24],label:'敲敲会唱歌的水晶',hidden:c=>!c.me,
  go(c){run(c,[{go:P.plSingAt},{fn:c=>{c.face='R';settle(c,{k:'sit',ex:'curious',prompt:()=>'E · 敲一下 · 方向键离开',act:()=>{ding();return true},leave:c=>{c.doing=null;return[]}});c.doing='在敲水晶';ding()}}])}});

/* ---------- 蹦蹦坑：坑底一圈弹力苔，使劲一蹦，蹦得老高，慢慢飘下来 ---------- */
const BP=P.plBounce;let bounces=0;
T({id:'plBounce',n:'蹦蹦坑',hit:[BP.x-22,BP.y-8,44,16],at:{x:BP.x-8,y:BP.y},near:[BP.x-24,BP.y-10,48,22],quiet:1,label:'使劲一蹦',hidden:c=>!c.me,
  go(c){run(c,[{go:{x:BP.x-8,y:BP.y}},{fn:c=>{c.face='R'}},{k:'pounce',dur:.6},{fn:()=>{L.bounceP=1;sfx('whoosh');look={until:now()+3.6,y:vh=>me.y+(me.dy||0)*.85-12-.3*vh};for(let i=0;i<10;i++)fx(BP.x+rr(-16,16),BP.y,rr(-20,20),rr(-30,-10),1.4,'#ffb0e0',14)}},
    {jump:{x:BP.x+8,y:BP.y},h:150,dur:3.2},{fn:c=>{sfx('land');for(let i=0;i<8;i++)fx(c.x+rr(-8,8),c.y,rr(-16,16),rr(-18,-6),1.2,'#a888d8',12);bounces++;
      say(bounces===1?'蹦得好高！在天上飘了好一会儿':rnd(['差一点就碰到毛线环了','又飘了好久才落下来','在半空里看见了整颗地球']))}},{k:'happy',dur:.8}])}});
tick(dt=>{L.bounceP=Math.max(0,(L.bounceP||0)-dt*.8)});
});
