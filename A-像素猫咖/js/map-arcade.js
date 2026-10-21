/* 1024 猫咖 · 地下深处的游戏厅（y 5400～5940，设计见 docs/店内设计.md 第十七节"游戏厅"）。依赖 map-1f.js、map-b1.js（在猫猫星球后面加载）。
   从小电影院东墙根放映机后面那道缝钻进去（world-arcade.js），出来是一条窄窄的砖砌密道，往东走到头是游戏厅：
   北墙下一排五台街机（打砖块、俄罗斯方块、贪吃蛇、太空侵略者，最右边一台粉色带猫耳朵的是迷你的猫猫咖啡馆），墙上霓虹招牌、最高分榜；地上是老游戏厅那种深蓝底、霓虹碎花的地毯。
   这一层 secret：不进楼层签，补位的猫不来，不进图鉴、不算彩蛋。整层其余的地方是黑黢黢的土和石头。
   街机屏幕上的待机画面每帧画（这里）；街机里的游戏进了游戏厅才下载（js/arcade/）。只往 WORLD 里追加。 */
const Y6=5400;   // 游戏厅在大图上的起点
(()=>{const M=WORLD,P=WP,Y=Y6;
// 只有密道、游戏厅两块是"屋里"；其余是土，压得更暗
M.floors.push({id:'arcade',n:'地下深处',lv:-2,secret:true,x:0,y:Y,w:960,h:540,tod:'night',tint:'#a898cc',tintOut:'#4a3c66',out:[[0,Y,960,150],[0,Y+476,960,64],[0,Y+150,330,154],[0,Y+414,330,62],[880,Y+150,80,326]],
  bright:[],sub:'密道 · 游戏厅'});
M.h=Math.max(M.h,Y+540);
M.rooms.push(
  {id:'passage',f:'arcade',n:'密道',x:0,y:Y+300,w:330,h:120,in:[40,Y+376,260,24],d:'砖墙夹着的一条窄道，头顶一盏小灯泡；地上的灰里有一串猫爪印，一直往东'},
  {id:'arcade',f:'arcade',n:'游戏厅',x:330,y:Y+150,w:550,h:326,in:[360,Y+290,490,160],d:'不知道是谁搬下来的一排街机，屏幕都亮着：投个币，玩一局'});
// 五台街机（左起）：每台 34 宽，底边贴着北墙脚；cab[i].at 是坐下来玩的地方
const CABS=['breakout','tetris','snake','invaders','cafe'],CX=[477,541,605,669,733],CB=Y+266;
addP({arcCabs:CABS.map((id,i)=>({id,x:CX[i]-17,y:CB-62,cx:CX[i],at:{x:CX[i],y:CB+18}})),
  // 密道口在小电影院东墙根（arcIn：走进这一块就钻进去；arcOut：从密道回来站的地方）；密道这头：钻进来站的地方，往西走到头（arcBack）回电影院
  arcIn:[948,Y4+446,12,30],arcOut:{x:930,y:Y4+461},arcSpawn:{x:30,y:Y+390},arcBack:[0,Y+372,8,34],
  // 兑币机、汽水机、最高分榜、长椅
  arcCoin:{x:830,y:Y+212},arcCoinAt:{x:842,y:Y+288},arcSoda:{x:350,y:Y+204},arcSodaAt:{x:364,y:Y+288},arcBoard:{x:392,y:Y+178,w:62,h:40},arcBench:{x:560,y:Y+410,w:90}});
M.WALK.push([944,Y4+446,16,30],[2,Y+374,340,30],[338,Y+264,534,204]);
M.BLOCK.push(...CX.map(x=>[x-17,CB-6,34,8]),[350,Y+256,30,10],[830,Y+258,30,10],[560,Y+418,90,8],[338,Y+264,4,108],[338,Y+404,4,64],
  [740,Y+440,20,8],[846,Y+444,16,8]);   // 垃圾桶、盆栽
// 灯：密道的小灯泡、五台街机屏幕的光、招牌、兑币机
M.lights.push({x:150,y:Y+340,r:46,col:'#ffcf70',a:.9},{x:260,y:Y+344,r:24,col:'#ffcf70',a:.5},{x:605,y:Y+176,r:70,col:'#ff6ac8',a:.55},{x:842,y:Y+230,r:22,col:'#ffd84a',a:.6},{x:364,y:Y+226,r:22,col:'#7ae8ff',a:.5},
  ...CX.map((x,i)=>({x,y:CB-34,r:30,col:['#ff8a5a','#6ac8ff','#7ee08a','#c8a0ff','#f4a6b8'][i],a:.8})));
const hs=(a,b)=>hsh(a,b+701);
/* ---------- 底图：土、密道、游戏厅的墙和地毯 ---------- */
const bg0=M.bg,wall0=M.wall;
M.bg=function(){bg0.call(this);
  // 土和石头
  texFill(0,Y,960,540,['#140e18','#1c141f','#241a26','#0e0a12'],(i,j)=>{const r=hs(i>>2,(j>>2)+3);return r<.08?2:r<.2?1:hs(i,j)<.04?3:0});
  // 密道：北面一堵老砖墙，脚下石板，南边一道墙头；西头黑下去（是钻进来的那道缝）
  wallTop(0,Y+304,342,6);brickWall(0,Y+310,342,64);R(0,Y+366,342,2,'#3a2420');
  texFill(0,Y+368,342,40,['#4a3e48','#3e343e','#2a222a','#57495a'],(i,j)=>{const u=(i+(Math.floor(j/10)%2)*9)%18,v=j%10;return u===0||v===0?2:hs(i>>1,j>>1)<.06?3:hs(i,j)<.05?1:0});
  wallTop(0,Y+406,342,8);for(let i=0;i<14;i++){alpha(.85-i*.06,()=>R(i,Y+310,1,98,'#0a0610'))}
  // 墙上的管子、一盏灯泡的线、墙根的蛛网；灰里一串猫爪印往东
  R(0,Y+318,342,3,OL);R(0,Y+319,342,1,'#6a6470');for(let x=40;x<342;x+=96){R(x,Y+316,4,7,OL);R(x+1,Y+317,2,5,'#8a8490')}
  R(0,Y+326,180,2,OL);R(0,Y+326,180,1,'#5a7a6a');R(180,Y+326,2,40,OL);
  [[16,Y+311],[326,Y+311]].forEach(([x,y],k)=>{for(let i=0;i<7;i++){P1(x+(k?-i:i),y+i,'#8a8496');P1(x+(k?-i:i)+(k?-3:3),y,'#8a8496');if(i<4)P1(x+(k?-i:i),y+3,'#6a6470')}});
  for(let i=0;i<12;i++){const x=46+i*22,y=Y+384+(i%2)*8;pawPrint(x,y,'#5e5262')}
  // 墙上粉笔画的一根小摇杆和箭头（像是谁留下的记号）
  const ch='#c8c0d0';R(232,Y+344,9,2,ch);R(236,Y+334,1,10,ch);R(234,Y+331,5,3,ch);R(250,Y+340,14,1,ch);P1(262,Y+339,ch);P1(262,Y+341,ch);P1(261,Y+338,ch);P1(261,Y+342,ch);
  // 游戏厅：深紫的北墙（高一倍，街机靠着它），两侧墙头，西墙上通密道的门洞
  wallTop(330,Y+150,550,8);R(330,Y+158,550,106,'#2a1e3e');for(let x=330;x<880;x+=22)R(x,Y+160,1,104,'#33264a');R(330,Y+158,550,2,'#1a1228');
  R(330,Y+176,550,1,'#ff6ac8');R(330,Y+177,550,1,'#8a3a78');R(330,Y+252,550,1,'#4fd8ff');R(330,Y+253,550,1,'#2a5a7a');R(330,Y+254,550,10,'#221832');R(330,Y+262,550,2,'#140e1c');
  // 地毯：深蓝底子上撒霓虹碎花（锯齿、圈、三角、十字），老游戏厅的那种
  texFill(338,Y+264,534,206,['#1c183a','#231e48','#a8448e','#3a8ab0','#b8943a','#4a8a62'],(i,j)=>{const X=i+338,cx=Math.floor((X+(Math.floor(j/16)%2)*8)/16),cy=Math.floor(j/16),u=(X+(cy%2)*8)%16,v=j%16,r=hs(cx,cy+40),col=2+Math.floor(hs(cx,cy+90)*4);
    if(r<.1){if(u>=4&&u<=11&&v===6+((u>>1)&1))return col}
    else if(r<.18){const d=Math.hypot(u-7.5,v-7.5);if(d>1.8&&d<2.9)return col}
    else if(r<.25){if((u===7&&v>=5&&v<=9)||(v===7&&u>=5&&u<=9))return col}
    else if(r<.34){if((u===4&&v===4)||(u===11&&v===10))return col}
    return hs(X,j)<.04?1:0});
  wallTop(330,Y+158,8,214);wallTop(330,Y+404,8,72);R(330,Y+372,8,32,'#3e343e');wallTop(872,Y+158,8,318);wallTop(330,Y+468,550,8);
  // 最高分榜（字每帧画，这里是板子）；五台街机身后墙上一圈淡淡的光晕
  const B=P.arcBoard;box(B.x,B.y,B.w,B.h,'#0e0a18');R(B.x+1,B.y+1,B.w-2,1,'#3a2e5a');
  // 墙上的海报（老游戏的宣传画：一个外星人、一个方块、一颗毛线球）
  [[778,Y+188,'#c8a0ff'],[800,Y+196,'#6ac8ff']].forEach(([x,y,c],k)=>{box(x,y,18,24,'#1a1430');R(x+2,y+2,14,20,k?'#1e2a4a':'#2a1a3a');
    if(k){R(x+6,y+6,6,3,c);R(x+6,y+9,3,3,c);R(x+4,y+15,10,2,'#ffd84a')}else{grid(x+4,y+6,['..1..1..','.111111.','11.11.11','11111111','.1....1.'].map(r=>r.slice(0,8)),{1:c});R(x+4,y+15,10,2,'#ff6ac8')}});
  yarnBall(296,Y+398,4,1,0);
};
/* ---------- 每帧：霓虹招牌、最高分榜 ---------- */
M.wall=function(t,S,vis){wall0.call(this,t,S,vis);if(!vis(330,Y+150,550,120))return;
  // 招牌"游戏厅"：粉色霓虹，偶尔闪一下灭一下；两边各一颗星
  const off=Math.floor(t*7)%53===0||Math.floor(t*7)%53===2,fl=off?'#5a2a50':'#ff8ad8',x0=605-Math.floor(PXT.w('游戏厅')/2)-2;
  box(x0-10,Y+160,PXT.w('游戏厅')+24,16,'#1a1228','#5a2a50');if(!off)alpha(.35,()=>R(x0-8,Y+161,PXT.w('游戏厅')+20,14,'#ff6ac8'));PXT.draw('游戏厅',x0+2,Y+160,fl,{shadow:off?null:'#8a2a70'});
  [[x0-6,'#ffd84a'],[x0+PXT.w('游戏厅')+10,'#4fd8ff']].forEach(([x,c],i)=>{const on=Math.floor(t*2+i)%2===0;P1(x,Y+167,on?c:'#3a2e4a');P1(x-1,Y+168,on?c:'#3a2e4a');P1(x+1,Y+168,on?c:'#3a2e4a');P1(x,Y+169,on?c:'#3a2e4a')});
  // 最高分榜：world-arcade.js 把你在每台机器上的最高分放进 S.arcBest
  const B=P.arcBoard,best=S.arcBest||{};txt('HI-SCORE',B.x+4,B.y+3,Math.floor(t*2)%2?'#ffd84a':'#ff8a5a');
  ['breakout','tetris','snake','invaders'].forEach((id,i)=>{const y=B.y+11+i*7;txt(['BRK','TET','SNK','INV'][i],B.x+4,y,'#8a80a8');const s=String(best[id]||0).padStart(6,'0');txt(s,B.x+B.w-4-txtW(s),y,best[id]?'#fff4dc':'#5a5070')})};
/* ---------- 东西：五台街机、兑币机、汽水机、长椅、垃圾桶、盆栽 ---------- */
const add=(x,y,w,h,base,draw,o={})=>M.props.push({x,y,w,h,base,draw,...o});
P.arcCabs.forEach((c,i)=>add(c.x-2,c.y-8,38,72,CB+2,(t,S)=>arcCabinet(c.x,c.y,i,t,S),{live:1}));
add(P.arcCoin.x,P.arcCoin.y,30,54,Y+266,t=>arcCoinBox(P.arcCoin.x,P.arcCoin.y,t),{live:1});
add(P.arcSoda.x,P.arcSoda.y,30,62,Y+266,t=>arcSodaBox(P.arcSoda.x,P.arcSoda.y,t),{live:1});
add(P.arcBench.x,P.arcBench.y-6,P.arcBench.w,20,P.arcBench.y+14,()=>longBench(P.arcBench.x,P.arcBench.y,P.arcBench.w));
add(740,Y+430,20,20,Y+448,()=>trashCan(740,Y+430));add(844,Y+420,22,30,Y+452,t=>plant(846,Y+448,t));
})();

/* ================= 画法 ================= */
// 一台街机（34×62）：顶上灯箱、斜面屏幕、操纵台、投币口、踢脚板；第五台（猫猫咖啡馆）是粉色的，头顶两只猫耳朵
const ARC_COL=[['#c8442e','#8a2a1e','#e86a4a'],['#2e5aa8','#1e3a70','#4a7ad0'],['#2e8a4e','#1e5a32','#4ab06a'],['#5a3a9a','#3a2468','#7a5ac0'],['#e88aa0','#c46a82','#f6b0c0']];
const ARC_EN=['BRICKS','TETRIS','SNAKE','ALIENS','CAFE'];   // 灯箱上的英文：最多 7 个字母（灯箱里 28 像素宽）
function arcCabinet(x,y,i,t,S){const [a,d,l]=ARC_COL[i],busy=S.arcBusy&&S.arcBusy[i];alpha(.3,()=>disc(x+17,y+62,17,2,'#000'));
  if(i===4)[x+7,x+27].forEach(ex=>{for(let r=0;r<7;r++){const h=r>>1;R(ex-h,y-7+r,2*h+1,1,OL);if(r>1&&h)R(ex-h+1,y-7+r,2*h-1,1,r>3?a:'#f4a6b8')}});
  // 柜子的侧板和正面
  R(x,y,34,62,OL);R(x+1,y+1,32,60,d);R(x+3,y+1,28,60,a);R(x+3,y+1,1,60,l);
  // 灯箱：机器名（3×5 字），亮着
  R(x+2,y+2,30,9,OL);R(x+3,y+3,28,7,'#fff4dc');R(x+3,y+3,28,1,'#ffffff');const en=ARC_EN[i];txt(en,x+17-Math.floor(txtW(en)/2),y+4,i===4?'#c46a82':d);
  // 屏幕：外框、黑底、待机画面
  R(x+4,y+13,26,22,OL);R(x+5,y+14,24,20,'#0a0810');arcAttract(x+6,y+15,22,18,i,t,busy);R(x+5,y+14,24,1,'#2a2438');P1(x+27,y+15,'#ffffff');
  // 操纵台：斜面、摇杆、两颗按钮
  R(x+1,y+36,32,7,OL);R(x+2,y+37,30,5,'#2a2030');R(x+2,y+37,30,1,'#4a3e52');const jx=x+9+(busy?Math.round(Math.sin(t*9)):0);R(jx,y+35,1,4,'#8a8496');R(jx-1,y+33,3,3,'#e0533d');P1(jx-1,y+33,'#ff8a7a');
  R(x+19,y+39,3,2,'#ffd84a');R(x+24,y+39,3,2,'#7ae8ff');if(busy&&Math.floor(t*6)%2)R(x+19,y+40,3,1,'#c8a020');
  // 投币口（一圈橘色的光）、踢脚板
  R(x+12,y+46,10,9,OL);R(x+13,y+47,8,7,'#1a1420');R(x+15,y+48,4,1,Math.floor(t*1.5)%2?'#ff8a3a':'#a8502a');R(x+16,y+50,2,3,'#8a8496');R(x+2,y+57,30,4,d);R(x+2,y+57,30,1,OL)}
// 屏幕上的待机画面（22×18）：每台一样自己的小动画；有人在玩的时候动得快一点
function arcAttract(x,y,w,h,i,t,busy){const k=busy?2:1,T=t*k,f=Math.floor(T*4);
  if(i===0){['#e0533d','#e8b83a','#7ee08a','#6ac8ff'].forEach((c,r)=>{for(let q=0;q<5;q++)if(!((r*5+q+Math.floor(T))%7===0))R(x+1+q*4,y+1+r*2,3,1,c)});
    const bx=Math.abs((T*14)%(2*(w-2))-(w-2)),by=Math.abs((T*11)%(2*(h-12))-(h-12));P1(x+1+Math.round(bx),y+9+Math.round(by),'#fff4dc');R(x+Math.round(bx)-2,y+h-2,6,1,'#f4a6b8')}
  else if(i===1){const C7=['#6ac8ff','#ffd84a','#c8a0ff','#7ee08a','#e0533d','#ff8a3a','#4a7ad0'];for(let q=0;q<5;q++)for(let r=0;r<2+(q*3)%3;r++)R(x+6+q*2,y+h-1-r*2,2,2,C7[(q+r)%7]);
    const py=Math.floor(T*6)%(h-4);R(x+8,y+py,6,2,C7[Math.floor(T/3)%7]);R(x+10,y+py-2,2,2,C7[Math.floor(T/3)%7]);R(x+5,y,1,h,'#3a3450');R(x+17,y,1,h,'#3a3450')}
  else if(i===2){const n=10;for(let s=0;s<n;s++){const q=(f-s+400)%56,px=q<14?q:q<28?14:q<42?42-q:0,py=q<14?0:q<28?q-14:q<42?14:56-q;R(x+3+px,y+2+py,2,1,s===0?'#ffd84a':s%2?'#7ee08a':'#4ab06a')}
    if(Math.floor(T*2)%2)R(x+12,y+9,2,1,'#ff8a5a')}
  else if(i===3){const dx=Math.floor(T*2)%6;for(let r=0;r<2;r++)for(let q=0;q<4;q++){const ax=x+2+dx+q*4,ay=y+2+r*4,c=r?'#7ee08a':'#c8a0ff';R(ax,ay,3,2,c);if(f%2){P1(ax-1,ay+2,c);P1(ax+3,ay+2,c)}else{P1(ax,ay+2,c);P1(ax+2,ay+2,c)}}
    const sx=x+4+Math.round((Math.sin(T*1.3)+1)*7);R(sx,y+h-2,4,2,'#c89060');P1(sx,y+h-3,'#fff3e0');P1(sx+3,y+h-3,'#fff3e0');if(f%3===0)R(sx+2,y+h-6-(f%9),1,2,'#fff4dc')}
  else{R(x,y+h-6,w,6,'#5a3a2a');R(x,y+h-6,w,1,'#8a5a3a');R(x+9,y+2,4,h-8,'#8a5a3a');disc(x+11,y+4,6,3,'#4a8a4e');P1(x+8,y+3,'#e0533d');P1(x+14,y+5,'#6ac8ff');P1(x+11,y+2,'#ffd84a');
    const cx=x+2+Math.round((Math.sin(T*.9)+1)*8);R(cx,y+h-9,3,2,'#fff3e0');P1(cx,y+h-10,'#fff3e0');P1(cx+2,y+h-10,'#fff3e0');P1(cx+(Math.sin(T*.9+1.57)>0?2:0),y+h-8,'#e0533d');R(x+17,y+h-8,2,2,'#e3a456')}}
// 兑币机：一个金色的大投币口，掉币的槽亮着
function arcCoinBox(x,y,t){alpha(.3,()=>disc(x+15,y+54,15,2,'#000'));R(x,y,30,54,OL);R(x+1,y+1,28,52,'#c89a2a');R(x+1,y+1,28,1,'#ffe08a');R(x+3,y+4,24,10,OL);R(x+4,y+5,22,8,'#1a1420');txt('COIN',x+7,y+7,Math.floor(t*2)%2?'#ffd84a':'#ff8a3a');
  R(x+10,y+18,10,14,OL);R(x+11,y+19,8,12,'#8a6a1a');R(x+14,y+21,2,8,OL);disc(x+15,y+38,4,3,'#ffe08a');P1(x+15,y+38,'#c89a2a');R(x+6,y+44,18,6,OL);R(x+7,y+45,16,4,'#2a2030');R(x+9,y+47,3,2,'#ffd84a');R(x+14,y+46,3,2,'#ffd84a')}
// 汽水机：一扇亮着的玻璃门，三层汽水罐
function arcSodaBox(x,y,t){alpha(.3,()=>disc(x+15,y+62,15,2,'#000'));R(x,y,30,62,OL);R(x+1,y+1,28,60,'#3a6ab0');R(x+1,y+1,28,1,'#6a9ae0');R(x+3,y+4,17,46,OL);R(x+4,y+5,15,44,'#bfe8ff');
  for(let r=0;r<4;r++)for(let q=0;q<3;q++){const cx=x+5+q*5,cy=y+7+r*11;R(cx,cy,3,7,['#e0533d','#7ee08a','#ffd84a','#f4a6b8'][(r+q)%4]);P1(cx,cy,'#ffffff')}
  R(x+22,y+6,5,3,'#ffd84a');R(x+22,y+12,5,8,OL);for(let k=0;k<3;k++)R(x+23,y+13+k*2,3,1,'#8a8496');R(x+4,y+52,22,6,OL);R(x+5,y+53,20,4,'#1a1430');if(Math.floor(t*.7)%2)R(x+4,y+5,1,44,'#ffffff')}
