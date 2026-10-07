/* 1024 猫咖 · 猫猫星球（y 4400～4940，设计见 docs/店内设计.md 第四节"猫猫星球"）。依赖 map-1f.js、map-roof.js（在地下一层后面加载）、planet-art.js（PLA）。
   一小块能走的星球表面：天上横着一圈毛线环，地平线上两座耳朵山，两山之间挂着地球；地面是紫色的，坑坑洼洼，到处是发光的水晶。
   地平线是弯的（星球很小）。地上：纸箱火箭停的地方、水晶鱼池（一只大肉垫，上面四个趾头坑——整片地就是一只大爪印）、会唱歌的水晶、大毛线团和它的线头、插旗子的小山包、蹦蹦坑。
   这一层 secret：不进楼层签，补位的猫不来，只能坐火箭来（world-rocket.js）。另外两样不在星球上、但是走路的通行图建店时就要知道的：屋顶的发射台（斜屋顶底下那块空地）。
   会动的、能碰的在 world-rocket.js；画法在 planet-art.js。只往 WORLD 里追加。 */
const Y5=4400;   // 猫猫星球在大图上的起点
(()=>{const M=WORLD,P=WP,Y=Y5,HZ=PLA.HZ;
M.floors.push({id:'planet',n:'猫猫星球',lv:9,secret:true,x:0,y:Y,w:960,h:540,tod:'night',tint:'#cfc4ee',camDy:-.3,sub:'毛线环 · 耳朵山 · 水晶鱼池'});
M.h=Math.max(M.h,Y+540);
M.rooms.push({id:'planet',f:'planet',n:'耳朵山下',x:0,y:Y,w:960,h:540,in:[120,Y+300,720,180],d:'一颗紫色的小星球：天上挂着地球，一圈毛线环横过天空；重力小，走起来一蹦一蹦'});
// 屋顶：发射台（斜屋顶底下那块空地）；吧台：咖啡机边上的漏斗；屋顶：跑轮放完烟花剩下的那一筒落在哪
addP({plPad:{x:104,y:Y3+494},plPadAt:{x:104,y:Y3+511},plWake:{x:138,y:Y3+511},plFunnel:{x:WP.espresso.x-12,y:297},plFunnelAt:{x:WP.espresso.x-10,y:336},plFw:{x:796,y:Y3+516},plFwAt:{x:782,y:Y3+524},
  // 星球上：火箭停的地方、出来站的地方；水晶鱼池（大肉垫）和四个趾头坑；会唱歌的水晶；大毛线团和线头；旗子；蹦蹦坑
  plPad2:{x:440,y:Y+372},plPad2At:{x:440,y:Y+390},plOut:{x:466,y:Y+386},plLake:{x:600,y:Y+452,rx:62,ry:19},plLakeAt:{x:527,y:Y+456},
  plToes:[{x:536,y:Y+410},{x:578,y:Y+399},{x:624,y:Y+399},{x:664,y:Y+410}],plSing:{x:250,y:Y+322},plSingAt:{x:234,y:Y+338},
  plYarn:{x:806,y:Y+366,r:30},plYarnAt:{x:768,y:Y+402},plYarnTop:{x:806,y:Y+337,z:Y+392.5},plEnd:{x:754,y:Y+402},plEndAt:{x:744,y:Y+410},
  plFlag:{x:896,y:Y+326},plFlagAt:{x:884,y:Y+338},plBounce:{x:150,y:Y+440},plEarth:{x:504,y:Y+172,r:20}});
// 能走的：地平线往下一点到底下（按地平线一条条切，中间高两头低）
for(let x0=16;x0<944;x0+=32){const top=Math.ceil(Math.max(HZ(x0),HZ(x0+32)))+16;M.WALK.push([x0,Y+top,32,506-top])}
M.BLOCK.push([83,Y3+486,42,10],                                                        // 屋顶的发射台
  [428,Y+364,24,10],[536,Y+440,128,24],[552,Y+433,96,7],[552,Y+464,96,6],              // 星球上的火箭、水晶鱼池
  ...P.plToes.map(t=>[t.x-12,t.y-5,24,10]),[234,Y+314,40,10],[776,Y+376,60,18],[322,Y+447,16,8],[858,Y+466,14,8]);
M.lights.push({x:600,y:Y+452,r:84,col:'#5ac8f0',a:.8},...P.plToes.map(t=>({x:t.x,y:t.y-6,r:20,col:'#7ae8ff',a:.7})),{x:258,y:Y+304,r:40,col:'#ff9ad8',a:.7},{x:150,y:Y+440,r:28,col:'#e078b8',a:.5},
  {x:504,y:Y+172,r:44,col:'#6ac0ff',a:.35},{x:60,y:Y+326,r:16,col:'#7ae8ff',a:.6},{x:382,y:Y+316,r:16,col:'#ff9ad8',a:.6},{x:700,y:Y+318,r:16,col:'#ff9ad8',a:.6},{x:928,y:Y+348,r:16,col:'#7ae8ff',a:.6},
  {x:330,y:Y+500,r:16,col:'#ff9ad8',a:.6},{x:96,y:Y+356,r:22,col:'#7ae8ff',a:.6},{x:676,y:Y+290,r:18,col:'#ff9ad8',a:.6},{x:322,y:Y+446,r:24,col:'#ffd84a',a:.5},{x:690,y:Y+500,r:18,col:'#7ae8ff',a:.6},{x:40,y:Y+498,r:16,col:'#ffd84a',a:.5});
// 地上的坑（离地平线越近越小、越扁）、碎石、小水晶
const CR=[[90,300,7],[340,288,5],[700,296,6],[540,282,4],[360,420,13],[690,350,10],[880,440,15],[250,474,17],[452,490,8],[760,478,11],[52,444,9],[930,382,7],[300,372,8],[40,362,6],[170,320,6],[620,322,5]];
const TUFT=[[56,330,'CY',.8],[378,318,'PK',.8],[516,300,'CY',.6],[698,320,'PK',.8],[926,350,'CY',.8],[326,502,'PK',1],[686,502,'CY',1.1],[36,500,'GD',.9],[870,300,'PK',.6],[160,488,'CY',.7]];
const bg0=M.bg,wall0=M.wall,floor0=M.floor,over0=M.over;
M.bg=function(){bg0.call(this);const K=PLA.K;C.drawImage(PLA.floorBase(),0,Y);
  CR.forEach(([x,y,r])=>PLA.crater(x,Y+y,r,Math.max(1,Math.round(r*(.3+.14*(y-262)/240)))));
  // 水晶鱼池的坑沿、四个趾头坑（里面长着水晶）
  const L=P.plLake;disc(L.x,L.y,L.rx+4,L.ry+4,K.GND[6]);disc(L.x+1,L.y+2,L.rx+4,L.ry+3,K.GND[2]);disc(L.x,L.y,L.rx+1,L.ry+1,'#0c2a44');
  P.plToes.forEach(t=>{PLA.crater(t.x,t.y,12,5);PLA.crystalTuft(t.x-4,t.y+2,K.CY,.6)});
  // 火箭落下来烧黑的一圈；蹦蹦坑的浅坑
  for(let j=-6;j<=6;j++)for(let i=-24;i<=24;i++)if(i*i/576+j*j/36<1&&PLA.bay(P.plPad2.x+i,j)<.55-.4*(i*i/576+j*j/36))P1(P.plPad2.x+i,Y+373+j,'#140c26');
  disc(P.plBounce.x,P.plBounce.y,23,8,K.GND[6]);disc(P.plBounce.x+1,P.plBounce.y+1,22,7,K.GND[2]);disc(P.plBounce.x,P.plBounce.y,21,7,K.GND[1]);
  [[180,380,4],[520,350,3],[642,330,3],[330,452,6],[864,470,5],[96,410,3],[420,330,2],[730,420,3]].forEach(([x,y,s])=>PLA.rock(x,Y+y,s));
  TUFT.forEach(([x,y,c,s])=>PLA.crystalTuft(x,Y+y,K[c],s));
  // 最下面一道暗石脊（走不到那儿），把画面框住
  PLA.foreRidge(0,Y+540,960)};
M.wall=function(t,S,vis){wall0.call(this,t,S,vis);if(!vis(0,Y,960,320))return;
  nightStars(0,Y,960,230,t,70,40);
  // 流星：隔一会儿一颗
  const per=9,k=(t%per)/1.2,n=Math.floor(t/per);if(k<1)shootingStar(120+hsh(n,911)*700,Y+16+hsh(n,912)*90,80*(hsh(n,913)<.5?1:-1),40,k);
  // 毛线环（扯线头的时候会晃：一道波从毛线团那头传过去）、耳朵山、地球
  const RA=PLA.ringArc(),W=PLA.live.ringWob;
  if(W&&t-W.t0<3.4){const q=(t-W.t0)/3.4,amp=W.a*(1-q)*(1-q);for(let x=0;x<960;x+=2){if(!vis(x,Y+100,2,220))continue;const dx=x-(1000-q*1500),dy=Math.round(Math.sin(dx/24)*amp*Math.exp(-dx*dx/50000));C.drawImage(RA.cv,x,0,2,RA.cv.height,x,Y+RA.y0+dy,2,RA.cv.height)}}
  else C.drawImage(RA.cv,0,Y+RA.y0);
  C.drawImage(PLA.earsImg().cv,0,Y+PLA.earsImg().y0);const E=P.plEarth;if(vis(E.x-30,E.y-30,60,60))PLA.earth(E.x,E.y,E.r,t)};
M.floor=function(t,S,vis){floor0.call(this,t,S,vis);if(!vis(0,Y+250,960,290))return;const L=PLA.live;
  if(vis(530,Y+425,140,55))PLA.lake(P.plLake.x,P.plLake.y,P.plLake.rx,P.plLake.ry,t);
  if(vis(120,Y+425,60,30))PLA.bouncePad(P.plBounce.x,P.plBounce.y,t,L.bounceP||0);
  if(vis(730,Y+380,80,50))PLA.yarnEnd(786,Y+388,P.plEnd.x,P.plEnd.y,t,L.pull||0);
  // 漂着的小石头在地上的影子；水晶尖上一闪一闪
  for(let i=0;i<12;i++){const x=Math.round(70+hsh(i,901)*820),y=Math.round(Y+300+hsh(i,902)*190);if(vis(x-2,y-1,4,2))R(x-1,y,3,1,'#1c1234')}
  TUFT.forEach(([x,y],i)=>{if((Math.floor(t*1.5)+i)%7===0)P1(x+3,Y+y-13,'#ffffff')});P.plToes.forEach((q,i)=>{if((Math.floor(t*1.2)+i*2)%6===0)P1(q.x-1,q.y-9,'#f0ffff')})};
M.over=function(t,S,vis){over0.call(this,t,S,vis);if(!vis(0,Y+250,960,290))return;
  // 低重力：地上的小石头飘起来一点，慢慢上下浮
  for(let i=0;i<12;i++){const x=Math.round(70+hsh(i,901)*820),by=Y+300+hsh(i,902)*190,y=Math.round(by-7-hsh(i,903)*12+Math.sin(t*.9+i*1.7)*2.5);if(!vis(x-2,y-2,5,5))continue;
    R(x-1,y-1,3,3,OL);P1(x,y-1,PLA.K.GND[6]);P1(x-1,y,PLA.K.GND[4]);P1(x,y,PLA.K.GND[5]);if(i%3===0)P1(x+1,y,PLA.K.GND[3])}
  // 一缕缕亮晶晶的尘，慢慢往上飘
  for(let i=0;i<16;i++){const k=(t*.07+hsh(i,921))%1,x=Math.round(40+hsh(i,922)*880+Math.sin(t*.5+i)*6),y=Math.round(Y+500-k*230);if(vis(x,y,1,1)&&k<.9)P1(x,y,k<.5?'#c8a8f0':'#8a6ab8')}};
const add=(x,y,w,h,base,draw,o={})=>M.props.push({x,y,w,h,base,draw,...o});
// 漂在半空的三块石头岛（低重力）：地上一块影子，石头慢慢上下浮
const FLOATS=[{x:96,y:Y+392,s:8,cr:'CY',h:30,ph:0},{x:676,y:Y+318,s:6,cr:'PK',h:24,ph:1.7},{x:322,y:Y+486,s:10,cr:'GD',h:34,ph:3.1}];
FLOATS.forEach((f,i)=>add(f.x-30,f.y-f.h-40,60,f.h+48,f.y,t=>{const b=Math.sin(t*.7+f.ph)*3;disc(f.x,f.y,Math.round(f.s*1.3-b*.3),Math.max(1,Math.round(f.s*.35)),'#160e2a');PLA.floatRock(f.x,f.y-f.h+b,f.s,PLA.K[f.cr],i*7+3)},{live:1}));
const pal=()=>PLA.live.pal==null?0:PLA.live.pal;
// 一只火箭（屋顶那只、星球上那只是同一只，哪边有就画在哪边）：S 是它这一刻的样子 {lift 升起来多高, flame 火多长, shake, cat 你在里面, count 倒数}
function rocketAt(x,y,S,t){if(!S)return;const yy=Math.round(y-(S.lift||0)),sh=S.shake&&Math.floor(t*30)%2?1:0;if(S.flame>0)PLA.flame(x+sh,yy+1,Math.round(S.flame),t,1);
  const top=PLA.rocket(x+sh,yy,1,{pal:S.cat?pal():null,blink:(t%3.1)<.12});
  if(S.count){const s=String(S.count),w=txtW(s,2),cx=x-Math.round(w/2),cy=top-16;txt(s,cx+1,cy+1,OL,2);txt(s,cx,cy,'#ffd84a',2)}}
add(P.plPad.x-36,P.plPad.y-160,76,164,P.plPad.y,t=>{const L=PLA.live;PLA.pad(P.plPad.x,P.plPad.y,!!L.built);if(L.built&&L.at==='roof'&&!L.snapHide)rocketAt(P.plPad.x,P.plPad.y-5,L.ride||{},t)},{live:1});
add(P.plPad2.x-24,P.plPad2.y-280,48,284,P.plPad2.y,t=>{const L=PLA.live;if(L.at==='planet')rocketAt(P.plPad2.x,P.plPad2.y,L.ride||{},t)},{live:1});
add(P.plFunnel.x-9,P.plFunnel.y-15,19,16,318,()=>{if(!PLA.live.funnelGot)PLA.funnel(P.plFunnel.x,P.plFunnel.y)},{live:1});
add(P.plFw.x-8,P.plFw.y-140,24,142,P.plFw.y,t=>{const f=PLA.live.fw;if(!f)return;if(f.fall!=null&&f.fall<1){const k=f.fall,y=Math.round(P.plFw.y-130*(1-k*k));PLA.fwTube(P.plFw.x,y,t);return}PLA.fwTube(P.plFw.x,P.plFw.y,t)},{live:1});
add(P.plSing.x-12,P.plSing.y-34,40,38,P.plSing.y+2,t=>PLA.singCrystals(P.plSing.x,P.plSing.y,t,PLA.live.sing||[]),{live:1});
add(P.plYarn.x-34,P.plYarn.y-34,70,62,P.plYarn.y+25,()=>PLA.yarnGiant(P.plYarn.x,P.plYarn.y,P.plYarn.r,PLA.live.spin||0),{live:1});
add(P.plFlag.x-4,P.plFlag.y-30,22,34,P.plFlag.y+1,t=>{const L=PLA.live;if(L.flag)PLA.flag(P.plFlag.x,P.plFlag.y,t,L.flag.col,L.flag.paw)},{live:1});
})();
