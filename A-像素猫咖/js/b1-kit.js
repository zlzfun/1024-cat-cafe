/* 1024 猫咖 · 地下一层的零件（画法）。依赖 scene-kit.js（R、P1、OL、box、disc、line、alpha、txt……）、house-kit.js、pixel-text.js（PXT）。
   地图在 map-b1.js，会动的、能碰的在 world-b1.js。都挂在 b1Kit 上，免得和别的零件重名。(x,y) 是左上角，注释里的 base 是落地的 y。 */
const b1Kit=(()=>{
const K={};
const h=(i,s)=>hsh(i,s);
/* ---------- 墙和地 ---------- */
// 舞厅的墙：黑底，竖着一条条暗紫的护墙板，墙脚一道踢脚线
K.wallDisco=(x,y,w,ht)=>{R(x,y,w,ht,'#1c1428');for(let i=x+3;i<x+w;i+=12)R(i,y+4,1,ht-10,'#2a1e3a');R(x,y,w,2,'#5a3a2a');R(x,y+ht-6,w,6,'#140e1a');R(x,y+ht-6,w,1,'#3a2c4c')};
// 门厅的墙：酒红色，上半截壁纸的竖条，下半截木护墙
K.wallHall=(x,y,w,ht)=>{R(x,y,w,ht,'#6e2a3a');for(let i=x+4;i<x+w;i+=10)R(i,y+3,2,ht-24,'#7e3446');R(x,y+ht-20,w,20,'#4a2a22');R(x,y+ht-20,w,1,'#8a5a3a');for(let i=x+6;i<x+w-18;i+=24)R(i,y+ht-16,18,10,'#5a3428');R(x,y,w,2,'#5a3a2a')};
// 舞厅的地：黑色的地面，一格格很暗的方砖
K.floorDisco=(x,y,w,ht)=>{R(x,y,w,ht,'#18121f');for(let j=y;j<y+ht;j+=16)R(x,j,w,1,'#120c18');for(let i=x;i<x+w;i+=16)R(i,y,1,ht,'#120c18')};
// 门厅的地：深红地毯，菱形暗纹
K.floorHall=(x,y,w,ht)=>{R(x,y,w,ht,'#7a2c38');for(let j=y;j<y+ht;j+=8)for(let i=x+((j-y)/8%2?4:0);i<x+w;i+=8)P1(i,j,'#8e3a46')};
// 澡堂的地：青白小方砖
K.floorBath=(x,y,w,ht)=>{R(x,y,w,ht,'#d8ece8');for(let j=y;j<y+ht;j+=8)R(x,j,w,1,'#b8d4d0');for(let i=x;i<x+w;i+=8)R(i,y,1,ht,'#b8d4d0')};
// 电影院的地：深蓝地毯
K.floorCinema=(x,y,w,ht)=>{R(x,y,w,ht,'#22284a');for(let j=y+2;j<y+ht;j+=6)for(let i=x+((j-y)/6%2?3:0);i<x+w;i+=6)P1(i,j,'#2a3258')};
// 澡堂的北墙（玻璃另画）：青灰瓷砖；电影院的北墙：深色吸音板
K.wallBath=(x,y,w,ht)=>{R(x,y,w,ht,'#9cc8c4');for(let j=y+4;j<y+ht;j+=8)R(x,j,w,1,'#84b4b0');for(let i=x;i<x+w;i+=8)R(i,y,1,ht,'#84b4b0');R(x,y,w,2,'#5a3a2a');R(x,y+ht-4,w,4,'#6a9a96')};
K.wallCinema=(x,y,w,ht)=>{R(x,y,w,ht,'#1a1830');for(let i=x+2;i<x+w;i+=14){R(i,y+4,12,ht-10,'#22203c');R(i,y+4,12,1,'#2c2a4a')}R(x,y,w,2,'#5a3a2a');R(x,y+ht-6,w,6,'#12101e')};

/* ---------- 迪斯科舞厅 ---------- */
// 舞池的几套颜色（DJ 台搓一下换一套）：粉紫、冰蓝、金色、薄荷
K.PALS=[['#ff4fa8','#a84fff','#4fd8ff','#ffd84a'],['#4fd8ff','#a8f0ff','#5a8cff','#e8f8ff'],['#ffd84a','#ffb04f','#fff4c0','#ff8a4f'],['#4fffb0','#a8ffd8','#4fd8ff','#ffd84a']];
// 发光舞池：cols×rows 块 tw×th 的格子；st={pal,beat,crazy,gold:[{i,j,k}],hit:[{i,j,k}],allGold}
K.danceFloor=(x,y,cols,rows,tw,th,t,st={})=>{const P=K.PALS[st.pal||0],b=st.beat||0;R(x-2,y-2,cols*tw+4,rows*th+4,OL);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const X=x+i*tw,Y=y+j*th;let c='#2a1e3a',lit=false;
    const on=st.crazy?((i*7+j*3+b*5)%3!==0):((i+j+b)%4===0||(i*3+j*5+b)%7===0);if(on){c=P[(i+j*2+b)%4];lit=true}
    if(st.allGold){c=(i+j+b)%2?'#ffd84a':'#fff4c0';lit=true}
    R(X,Y,tw-1,th-1,c);R(X,Y,tw-1,1,lit?'#ffffff':'#3a2c4c');R(X,Y+th-2,tw-1,1,lit?'#00000033':'#140e1a');if(lit){alpha(.16,()=>R(X+3,Y+3,tw-7,th-7,'#ffffff'));R(X+2,Y+2,3,1,'#ffffff')}}
  (st.gold||[]).forEach(g=>{const X=x+g.i*tw,Y=y+g.j*th,k=g.k??1;R(X,Y,tw-1,th-1,'#ffd84a');R(X+1,Y+1,tw-3,th-3,k>.35||Math.floor(t*8)%2?'#ffe98a':'#ffd84a');R(X,Y,tw-1,1,'#ffffff');
    alpha(Math.max(.2,k),()=>R(X+3,Y+3,tw-7,th-7,'#fff8d8'));spark(X+4,Y+3,t);spark(X+tw-6,Y+th-5,t+.4)});
  (st.hit||[]).forEach(g=>{const X=x+g.i*tw,Y=y+g.j*th,k=g.k;alpha(1-k,()=>{R(X-2-k*6,Y-2-k*4,tw+3+k*12,th+3+k*8,'#ffffff')})})};
// 镜面球：吊在 (cx,top) 那根链子上，球心 (cx,cy)；spin 越大转得越快
K.mirrorBall=(cx,top,cy,t,spin=1)=>{for(let y=top;y<cy-7;y+=2)P1(cx,y,'#8a7a9a');disc(cx,cy,8,8,OL);disc(cx,cy,7,7,'#9aa4b8');
  const ph=Math.floor(t*spin*6);for(let y=-6;y<=6;y+=2)for(let x=-6;x<=6;x+=2){if(x*x+y*y>42)continue;const k=((x>>1)+(y>>1)+ph)%3;R(cx+x,cy+y,2,2,k===0?'#ffffff':k===1?'#c8d0e0':'#6a7088')}
  R(cx-3,cy-5,2,1,'#ffffff');if(Math.floor(t*5)%3===0){P1(cx+4,cy-4,'#fff');P1(cx+5,cy-5,'#fff');P1(cx+3,cy-5,'#fff')}};
// DJ 台：w×38，base=y+38；两只唱盘、中间的调音台、前脸一排跟着节拍跳的灯柱和 1024
K.djBooth=(x,y,w,t,st={})=>{const P=K.PALS[st.pal||0],b=st.beat||0;
  box(x,y+8,w,30,'#241a2e');R(x+1,y+9,w-2,2,'#3a2c4c');box(x-2,y,w+4,10,'#2f2340');R(x-1,y+1,w+2,2,'#4a3a5c');
  [[x+14,y+5],[x+w-14,y+5]].forEach(([cx,cy],k)=>{disc(cx,cy,10,4,OL);disc(cx,cy,9,3,'#141018');const a=t*(st.scratch>0&&k===0?-9:3)+k;R(cx+Math.round(Math.cos(a)*6),cy+Math.round(Math.sin(a)*2),2,1,'#8a7a9a');P1(cx,cy,P[k])});
  box(x+w/2-12,y+1,24,7,'#3a2c4c');for(let i=0;i<5;i++){R(x+w/2-10+i*5,y+3,1,4,'#141018');R(x+w/2-11+i*5,y+3+((i+b)%3),3,1,'#d8d0e0')}
  for(let i=0;i<10;i++){const hgt=2+((i*7+b*3)%9);R(x+4+i*(w-8)/10,y+36-hgt,4,hgt,P[i%4])}txt('1024',x+w/2-7,y+14,P[(b+1)%4]);
  // 笔记本：屏幕上一只猫耳朵的标
  box(x+w/2+16,y-8,18,10,'#3a3a48');R(x+w/2+17,y-7,16,8,'#2a2a38');R(x+w/2+22,y-5,6,3,'#7ee08a');P1(x+w/2+22,y-6,'#7ee08a');P1(x+w/2+27,y-6,'#7ee08a')};
// 一摞大音箱：w=32，base=y+64；喇叭跟着节拍一鼓一鼓
K.speakerStack=(x,y,t,beat=0,big=0)=>{const kick=beat%2===0&&(t*4%2)<.6?1:0;
  box(x,y+26,32,38,'#1e1a24');R(x+1,y+27,30,1,'#3a3444');disc(x+16,y+44,11+kick,11+kick,OL);disc(x+16,y+44,10+kick,10+kick,'#2e2a36');disc(x+16,y+44,6,6,'#44404e');disc(x+16,y+44,2,2,'#141018');
  R(x+4,y+58,24,2,'#141018');box(x+3,y,26,26,'#24202c');disc(x+16,y+10,5,5,OL);disc(x+16,y+10,4,4,'#3a3444');P1(x+16,y+10,'#8a8498');R(x+8,y+19,16,3,'#141018');
  if(big)for(let i=0;i<3;i++)alpha(.5-i*.15,()=>{const r=14+i*4+kick*2;for(let a=-1;a<=1;a+=.25)P1(Math.round(x+16+Math.cos(a)*r),Math.round(y+44+Math.sin(a)*r*.6)+20,'#d8d0e0')})};
// 卡座：一张红丝绒的长沙发，w 宽，base=y+20；flip=1 是背朝我们（坐在桌子南边的那张）
K.boothSofa=(x,y,w,flip=0)=>{if(!flip){box(x,y,w,12,'#7a1e34');R(x+1,y+1,w-2,2,'#a8304a');for(let i=x+6;i<x+w-4;i+=8){P1(i,y+5,'#5a1424');P1(i+4,y+8,'#5a1424')}box(x-2,y+10,w+4,10,'#8a2440');R(x-1,y+11,w+2,2,'#b8405a')}
  else{box(x-2,y+2,w+4,9,'#8a2440');R(x-1,y+3,w+2,2,'#b8405a');box(x,y+9,w,11,'#7a1e34');R(x+1,y+10,w-2,1,'#a8304a');for(let i=x+6;i<x+w-4;i+=8)P1(i,y+14,'#5a1424')}};
// 卡座中间的小圆桌：两杯发光的汽水
K.boothTable=(x,y,t)=>{disc(x,y,11,4,OL);disc(x,y,10,3,'#3a2c4c');R(x-1,y+3,3,8,OL);R(x-5,y+10,11,2,OL);
  [[x-5,'#ff4fa8'],[x+3,'#4fd8ff']].forEach(([cx,c],k)=>{R(cx,y-7,4,7,OL);R(cx+1,y-6,2,5,c);if(Math.floor(t*2+k)%2)P1(cx+1,y-5,'#ffffff');R(cx+3,y-10,1,4,'#fff4dc')})};
// 墙上的拉链（拉一下镜面球降下来）：base=y+30
K.pullChain=(x,y,t,pulled=0)=>{const d=pulled>0?4:0;for(let j=0;j<22+d;j+=2)P1(x,y+j,'#c8b8a0');disc(x,y+24+d,2,2,OL);disc(x,y+24+d,1,1,'#ffd84a')};
// 镜面砖：墙上一大块，一格格银色，有几格反着灯的颜色
K.mirrorWall=(x,y,w,ht,t,P)=>{R(x-1,y-1,w+2,ht+2,'#0e0a14');for(let j=0;j<ht;j+=4)for(let i=0;i<w;i+=4){const k=h(i*13+j,71),f=Math.floor(t*3+k*9)%11;R(x+i,y+j,3,3,f===0?P[(i+j)%4]:k<.15?'#e8ecf4':k<.5?'#9aa4b8':'#6a7088')}};

/* ---------- 地下门厅 ---------- */
// 自助售票亭：w=56，base=y+76；顶上一块"售票"招牌，窗口里一卷票，红按钮；flash>0 吐出一张票
K.ticketBooth=(x,y,t,flash=0)=>{box(x,y+14,56,62,'#c84a3a');R(x+1,y+15,54,2,'#e8705a');box(x-3,y+6,62,10,'#f4d26a');R(x-2,y+7,60,2,'#fff0a8');
  box(x+12,y-10,32,16,'#7a2c2a');R(x+13,y-9,30,1,'#a8483a');PXT.draw('售票',x+16,y-10,'#fff4dc');box(x+8,y+22,40,22,'#2a2238');R(x+9,y+23,38,20,'#3a3a58');disc(x+28,y+33,6,6,'#f4ead8');disc(x+28,y+33,3,3,'#c8b8a0');R(x+9,y+23,38,2,'#5a5a78');
  R(x+12,y+50,32,3,OL);disc(x+40,y+62,4,4,OL);disc(x+40,y+62,3,3,flash>0?'#ff8a7a':'#e0533d');R(x+6,y+56,22,12,'#a83a2c');R(x+8,y+58,18,1,'#f4d26a');R(x+8,y+61,14,1,'#f4d26a');
  if(flash>0){const k=Math.min(1,flash*2);R(x+16,y+52-k*8,14,8,'#fff4dc');R(x+16,y+52-k*8,14,1,'#e0533d');R(x+18,y+54-k*8,4,1,'#e0533d')}R(x-3,y+74,62,2,OL)};
// 爆米花车：w=40，base=y+58；玻璃箱里一堆爆米花，pop>0 时噼里啪啦往上蹦
K.popcornCart=(x,y,t,pop=0)=>{R(x+2,y,36,6,OL);for(let i=0;i<6;i++)R(x+3+i*6,y+1,6,4,i%2?'#fff4dc':'#e0533d');PXT.draw('爆米花',x+2,y-14,'#ffd84a',{shadow:OL});
  box(x+3,y+6,34,24,'#c8e8f0');R(x+4,y+7,32,22,'#e8f6fa');for(let i=0;i<40;i++){const px=x+5+((i*7)%30),py=y+28-((i*13)%9)-(i>30?3:0);R(px,py,2,2,i%5?'#fff4c0':'#f4d26a')}
  if(pop>0)for(let i=0;i<6;i++){const a=t*9+i*1.7,k=(t*3+i*.37)%1;R(x+8+((i*11)%24),y+24-k*16,2,2,'#fff4c0')}R(x+4,y+8,2,18,'#ffffff');
  box(x+1,y+30,38,20,'#c8302a');R(x+2,y+31,36,2,'#e8605a');txt('POP',x+14,y+37,'#ffd84a');disc(x+8,y+54,4,4,OL);disc(x+8,y+54,2,2,'#8a8a98');disc(x+32,y+54,4,4,OL);disc(x+32,y+54,2,2,'#8a8a98')};
// 海报：w=30，ht=44；一圈跑马灯小灯泡；k 是第几张（颜色、图标、两个字的片名）
K.POSTERS=[{bg:'#3a4a8a',fg:'#ffd84a',t:'身份',ic:'cat'},{bg:'#2e5a4a',fg:'#a8f0c8',t:'记忆',ic:'book'},{bg:'#8a3a5a',fg:'#ffd8e8',t:'传球',ic:'at'},{bg:'#2a6a3a',fg:'#c8ffb0',t:'门禁',ic:'check'},{bg:'#6a4a2a',fg:'#ffe0a0',t:'开店',ic:'house'}];
K.poster=(x,y,k,t,hl=0)=>{const P=K.POSTERS[k];box(x-3,y-3,36,50,'#2a1820');for(let i=0;i<9;i++){const on=Math.floor(t*4+i)%3!==0;P1(x-2+i*4,y-2,on?'#ffe08a':'#6a4a3a');P1(x-2+i*4,y+44,on?'#ffe08a':'#6a4a3a')}
  for(let j=0;j<11;j++){const on=Math.floor(t*4+j)%3!==0;P1(x-2,y-2+j*4,on?'#ffe08a':'#6a4a3a');P1(x+31,y-2+j*4,on?'#ffe08a':'#6a4a3a')}
  R(x,y,30,42,P.bg);R(x,y,30,1,'#ffffff44');R(x+2,y+2,26,22,'#00000033');const cx=x+15,cy=y+13;
  if(P.ic==='cat'){disc(cx,cy+2,7,6,P.fg);R(cx-7,cy-5,3,4,P.fg);R(cx+5,cy-5,3,4,P.fg);P1(cx-3,cy+1,OL);P1(cx+3,cy+1,OL);P1(cx,cy+3,'#e27a8f')}
  if(P.ic==='book'){R(cx-9,cy-5,8,12,P.fg);R(cx+1,cy-5,8,12,P.fg);R(cx-1,cy-6,2,14,OL);for(let i=0;i<4;i++){R(cx-7,cy-3+i*3,5,1,P.bg);R(cx+3,cy-3+i*3,5,1,P.bg)}}
  if(P.ic==='at'){txt('@',cx-2,cy-3,P.fg,2);disc(cx-6,cy+5,3,3,'#e0533d');R(cx-4,cy+3,10,1,P.fg)}
  if(P.ic==='check'){[[-6,0],[-5,1],[-4,2],[-3,3],[-2,2],[-1,1],[0,0],[1,-1],[2,-2],[3,-3],[4,-4],[5,-5]].forEach(([a,b2])=>R(cx+a,cy+b2,2,2,P.fg));R(cx-8,cy+7,16,2,'#7ee08a')}
  if(P.ic==='house'){for(let i=0;i<8;i++)R(cx-i,cy-6+i,i*2+1,1,'#e0533d');R(cx-6,cy+2,12,8,P.fg);R(cx-2,cy+5,4,5,P.bg);R(cx+3,cy-6,2,4,P.fg)}
  PXT.draw(P.t,x+3,y+26,P.fg);R(x+2,y+38,26,1,P.fg+'88');if(hl>0)alpha(.25,()=>R(x,y,30,42,'#ffffff'))};
// "汤"字布帘：w 宽，挂在门洞上沿；sway 被猫碰了一下晃一晃（-1～1）
K.noren=(x,y,w,sway=0)=>{const half=Math.floor(w/2);R(x-1,y,w+2,2,'#6e4430');[0,1].forEach(k=>{const X=x+k*half+1,s=Math.round(sway*(k?2:-2));R(X,y+2,half-2,18,'#2a3a6a');R(X+s,y+16,half-2,4,'#2a3a6a');R(X,y+2,half-2,1,'#3a4a8a');R(X,y+19,half-2,1,'#1a2448')});
  PXT.draw('汤',x+Math.floor(w/2)-6,y+4,'#fff4dc')};
// 门头的跑马灯：一块招牌 "CINEMA"，四周小灯一颗颗跑
K.marquee=(x,y,w,t)=>{box(x,y,w,13,'#3a1e2a');R(x+1,y+1,w-2,1,'#5a2e3a');txt('CINEMA',x+Math.floor((w-23)/2),y+4,'#ffd84a');const n=Math.floor(w/4),ph=Math.floor(t*8);
  for(let i=0;i<n;i++){const on=(i+ph)%3===0;P1(x+1+i*4,y,on?'#fff4c0':'#8a5a3a');P1(x+1+i*4,y+12,on?'#fff4c0':'#8a5a3a')}};
// 一楼楼梯间那块霓虹牌：B1 ↓ 和下面一行小字
K.b1Sign=(x,y,t)=>{const on=Math.floor(t*5)%23!==0;box(x,y,58,30,'#1e1428');R(x+1,y+1,56,1,'#3a2c4c');txt('B1',x+5,y+5,on?'#ff6ac8':'#5a3a5a',2);
  const a=on?'#ff6ac8':'#5a3a5a';R(x+26,y+5,2,7,a);R(x+24,y+10,6,1,a);R(x+25,y+11,4,1,a);P1(x+26,y+12,a);P1(x+27,y+12,a);
  txt('DISCO',x+34,y+4,on?'#4fd8ff':'#3a4a5a');PXT.draw('汤',x+34,y+9,on?'#ffd84a':'#5a4a3a');txt('CINEMA',x+5,y+22,on?'#ffd84a':'#5a4a3a');R(x+28,y+29,2,8,OL)};

/* ---------- 猫猫澡堂 ---------- */
// 水族馆的玻璃墙：静态的部分（水、光、沙、礁石、珊瑚、窗框）画进底图；鱼、水母、海龟、鳐鱼、鲨鱼、气泡、海草在 aquariumLive 里每帧画
K.AQ_PANES=3;
K.aquariumBack=(x,y,w,ht)=>{R(x-3,y-3,w+6,ht+6,OL);R(x-2,y-2,w+4,ht+4,'#5a6878');
  const bands=['#3a8ac8','#3482c0','#2e7ab8','#2a72ae','#2668a2','#226096','#1e588a','#1a507e'];for(let j=0;j<ht;j++){const k=j/ht*(bands.length-1),i=Math.floor(k),f=k-i;R(x,y+j,w,1,bands[i]);if(f>.5)for(let q=(j%2);q<w;q+=2)P1(x+q,y+j,bands[Math.min(bands.length-1,i+1)])}
  for(let r=0;r<5;r++){const rx=x+20+r*w/5;for(let j=0;j<ht-12;j++){const xx=Math.round(rx+j*.45);if(xx>x+w-2)break;if((j+r)%2===0)alpha(.18,()=>R(xx,y+j,6,1,'#c8ecff'))}}
  const sand=y+ht-10;for(let i=0;i<w;i++){const hh=10+Math.round(Math.sin(i*.07)*2+Math.sin(i*.19)*1);R(x+i,y+ht-hh,1,hh,'#d8c48a');if((i*7)%5===0)P1(x+i,y+ht-hh+2,'#b8a46a');if((i*3)%7===0)P1(x+i,y+ht-3,'#e8d8a8')}
  [[.12,8],[.47,10],[.8,7]].forEach(([f,r])=>{const cx=x+Math.round(w*f),cy=sand+2;disc(cx,cy,r+1,r*.7+1|0,'#3a4450');disc(cx,cy,r,(r*.7)|0,'#5a6470');disc(cx-2,cy-2,r-4,2,'#7a8490')});
  [[.22,'#ff7a6a'],[.3,'#ffb04f'],[.58,'#ff8ac8'],[.66,'#c8a0ff'],[.9,'#ff7a6a']].forEach(([f,c],k)=>{const cx=x+Math.round(w*f),cy=sand;for(let b=0;b<5;b++){const bx=cx-6+b*3,bh=6+((b*7+k*3)%7);R(bx,cy-bh,2,bh,c);P1(bx,cy-bh-1,'#fff4dc')}})};
K.aquariumFrame=(x,y,w,ht)=>{const n=K.AQ_PANES;for(let i=1;i<n;i++){const mx=x+Math.round(w*i/n);R(mx-2,y-2,4,ht+4,OL);R(mx-1,y-2,2,ht+4,'#6a7888')}
  for(let i=0;i<n;i++){const px=x+Math.round(w*i/n)+6;alpha(.22,()=>{for(let j=0;j<14;j++){P1(px+j,y+4+j*2,'#ffffff');P1(px+j+1,y+4+j*2,'#ffffff')}})}R(x-3,y+ht+1,w+6,3,'#3a4450')};
// 一条鱼：kind 0 小鱼（霓虹灯）1 黄鱼 2 小丑鱼 3 蓝鱼；dir 1 往右
K.fish=(x,y,kind,dir,t)=>{const f=Math.floor(t*6)%2,X=Math.round(x),Y=Math.round(y);
  if(kind===0){R(X-2,Y,4,1,'#4fd8ff');P1(X-2*dir,Y-1,'#ff4f6a');P1(X+2*dir,Y,'#fff4dc');P1(X-3*dir,Y+(f?-1:1),'#4fd8ff');return}
  const c=['#4fd8ff','#ffd84a','#ff8a3a','#4a7aff'][kind],d=kind===2?'#fff4dc':'#00000055';R(X-4,Y-2,8,5,OL);R(X-3,Y-1,6,3,c);if(kind===2){R(X-1,Y-1,1,3,d);R(X+2*dir,Y-1,1,3,d)}
  P1(X+2*dir,Y-1,'#141018');R(X-5*dir-(dir<0?1:0),Y-1+(f?-1:0),2,3,c);P1(X+3*dir,Y,'#ffffff55')};
K.jelly=(x,y,t,k)=>{const p=Math.sin(t*3+k)*1.5,X=Math.round(x),Y=Math.round(y);alpha(.75,()=>{disc(X,Y,5+Math.round(p*.5),3,'#ffb0e0');R(X-4,Y,9,1,'#ff8ad0')});for(let i=0;i<4;i++)for(let j=0;j<6;j++)if((j+i)%2===0)alpha(.6,()=>P1(X-3+i*2+Math.round(Math.sin(t*2+j*.6+i)),Y+2+j,'#ffd0f0'))};
K.turtle=(x,y,t,dir)=>{const X=Math.round(x),Y=Math.round(y),f=Math.floor(t*2)%2;disc(X,Y,9,5,OL);disc(X,Y,8,4,'#6a8a4a');for(let i=-6;i<=6;i+=4)P1(X+i,Y-1,'#8aaa6a');disc(X+10*dir,Y-1,3,2,'#8aaa6a');P1(X+11*dir,Y-2,OL);
  R(X+5*dir-1,Y+3+f,4,2,'#8aaa6a');R(X-6*dir-1,Y+3-f,4,2,'#8aaa6a')};
K.ray=(x,y,t,dir)=>{const X=Math.round(x),Y=Math.round(y),f=Math.round(Math.sin(t*3)*2);for(let i=-10;i<=10;i++){const hh=Math.max(1,4-Math.abs(i)/3|0);R(X+i,Y-hh+(Math.abs(i)>6?f:0),1,hh*2,'#5a6a8a')}R(X-10*dir-6*dir,Y,6,1,'#4a5a7a');P1(X+2*dir,Y-1,'#141018');P1(X-2*dir,Y-1,'#141018')};
// 鲨鱼：大约 64×20，dir 1 往右
K.shark=(x,y,t,dir)=>{const X=Math.round(x),Y=Math.round(y),f=Math.floor(t*4)%2,D=dir,px=i=>X+i*D;
  for(let i=-30;i<=26;i++){const k=(i+30)/56,hh=Math.round(Math.sin(Math.min(1,k*1.25)*Math.PI*.92)*7)+1;R(px(i)-(D<0?0:0),Y-hh,1,hh*2,OL)}
  for(let i=-29;i<=25;i++){const k=(i+30)/56,hh=Math.round(Math.sin(Math.min(1,k*1.25)*Math.PI*.92)*7);if(hh<1)continue;R(px(i),Y-hh+1,1,hh,'#7a8a9a');R(px(i),Y,1,hh-1,'#d8e0e8')}
  for(let j=0;j<9;j++)R(px(-4+j*.6|0),Y-8-(8-j),2,1,OL),R(px(-3+j*.6|0),Y-8-(8-j)+1,1,1,'#7a8a9a');
  for(let j=0;j<7;j++){R(px(-32-j*.3|0),Y-1-j-(f?1:0),2,1,'#7a8a9a');R(px(-32-j*.3|0),Y+1+j-(f?0:1),2,1,'#7a8a9a')}
  P1(px(18),Y-2,'#141018');R(px(14),Y+2,6,1,'#5a6a7a');for(let i=0;i<3;i++)P1(px(8+i*2),Y-1,'#5a6a7a')};
// 储物柜：一格格木门，铜号码牌，开着两格（一只袜子、一颗毛线球）
K.lockers=(x,y,w,ht)=>{box(x,y,w,ht,'#8a5a3a');const cw=Math.floor((w-2)/6),ch=Math.floor((ht-2)/3);for(let j=0;j<3;j++)for(let i=0;i<6;i++){const X=x+1+i*cw,Y=y+1+j*ch,open=(i===2&&j===1)||(i===5&&j===0);
  if(open){R(X,Y,cw-1,ch-1,'#3a2418');if(i===2)R(X+3,Y+ch-7,4,5,'#e0533d');else{disc(X+cw/2|0,Y+ch-5,3,3,'#4a7fd0');P1(X+cw/2|0,Y+ch-6,'#8ab8ff')}continue}
  R(X,Y,cw-1,ch-1,'#b07a52');R(X,Y,cw-1,1,'#c8946a');R(X+cw-4,Y+ch/2|0,2,3,'#ffd84a');R(X+2,Y+2,5,3,'#d8b048');P1(X+3,Y+3,OL);P1(X+5,Y+3,OL)}};
// 温泉池：w×ht 的圆角池子，石头围一圈；池水在底图画一层，水波和光点在 onsenLive 里画
K.onsenBack=(x,y,w,ht)=>{const cx=x+w/2,cy=y+ht/2;for(let j=0;j<ht;j++){const yy=(j-ht/2)/(ht/2),s=Math.round(w/2*Math.sqrt(Math.max(0,1-Math.pow(Math.abs(yy),2.6))));R(cx-s,y+j,s*2,1,'#4aa8a0')}
  for(let j=2;j<ht-2;j++){const yy=(j-ht/2)/(ht/2),s=Math.round((w/2-4)*Math.sqrt(Math.max(0,1-Math.pow(Math.abs(yy),2.6))));R(cx-s,y+j,s*2,1,j<ht*.35?'#6ac8c0':'#5ab8b0')}
  for(let a=0;a<64;a++){const q=a/64*Math.PI*2,c=Math.cos(q),s2=Math.sin(q),rx=w/2-1,ry=ht/2-1,sx=Math.round(cx+Math.sign(c)*rx*Math.pow(Math.abs(c),.75)),sy=Math.round(cy+Math.sign(s2)*ry*Math.pow(Math.abs(s2),.75)),r=3+((a*7)%3);
    disc(sx,sy,r+1,r,OL);disc(sx,sy,r,r-1,['#8a8a90','#9a9aa0','#7a7a84'][a%3]);P1(sx-1,sy-1,'#b8b8c0')}};
K.onsenLive=(x,y,w,ht,t)=>{const cx=x+w/2;for(let i=0;i<10;i++){const px=cx-w*.4+h(i,91)*w*.8,py=y+8+h(i,92)*(ht-16),k=(t*.5+h(i,93))%1;alpha(.5*(1-k),()=>{const r=Math.round(2+k*7);for(let a=0;a<12;a++){const q=a/12*Math.PI*2;P1(Math.round(px+Math.cos(q)*r),Math.round(py+Math.sin(q)*r*.4),'#c8f0ec')}})}
  for(let i=0;i<14;i++){if(Math.floor(t*2+h(i,94)*7)%4)continue;P1(Math.round(cx-w*.42+h(i,95)*w*.84),Math.round(y+6+h(i,96)*(ht-12)),'#ffffff')}};
// 热气：在池子上方一缕缕往上飘（画在猫上面）
K.steam=(x,y,w,t,n=9)=>{for(let i=0;i<n;i++){const k=(t*.25+h(i,97))%1,px=x+h(i,98)*w+Math.sin(t+i)*4,py=y-k*34;alpha(.32*(1-k)*Math.min(1,k*5),()=>{disc(Math.round(px),Math.round(py),3+Math.round(k*4),2+Math.round(k*2),'#f4fbfa')})}};
// 竹筒出水：从池边往池子里倒一股水
K.spout=(x,y,t)=>{R(x,y,14,4,OL);R(x+1,y+1,12,2,'#7aa84a');R(x+3,y+1,1,2,'#5a8a3a');R(x+12,y+3,2,6,OL);for(let j=0;j<10;j++){const k=(t*6+j*.3)%1;P1(x+13+(j%2),y+5+j,k<.5?'#c8f0ff':'#8ad8f0')}alpha(.6,()=>disc(x+13,y+16,3,1,'#e8fbff'))};
// 一摞黄木桶（澡堂的经典）：down>0 时倒了一地
K.buckets=(x,y,down=0,t)=>{const one=(bx,by)=>{R(bx,by,12,9,OL);R(bx+1,by+1,10,7,'#f4c84a');R(bx+1,by+1,10,1,'#fff0a8');R(bx+3,by+4,6,2,'#e0533d');R(bx+1,by+7,10,1,'#c8962a')};
  if(!down){[[0,18],[12,18],[24,18],[6,9],[18,9],[12,0]].forEach(([a,b2])=>one(x+a,y+b2));return}
  [[-6,22],[10,24],[26,20],[38,26],[2,30],[18,30]].forEach(([a,b2],k)=>{const bx=x+a,by=y+b2;if(k%2){R(bx,by,9,12,OL);R(bx+1,by+1,7,10,'#f4c84a');R(bx+3,by+3,3,6,'#e0533d')}else one(bx,by)})};
// 牛奶冰柜：w=32，base=y+46；玻璃门里三层：白的、咖啡色的、粉的；顶上一块"牛乳"牌
K.milkFridge=(x,y,t,open=0)=>{box(x,y-8,32,54,'#e8eef0');R(x+1,y-7,30,2,'#ffffff');box(x+3,y-7,26,13,'#2a5a9a');PXT.draw('牛乳',x+4,y-9,'#fff4dc');box(x+2,y+6,28,34,'#9ac8d8');R(x+3,y+7,26,32,'#c8e8f0');
  [['#ffffff','#e8e0d0'],['#a8703f','#8a5a2a'],['#ffb0c8','#e890a8']].forEach(([a,b2],r)=>{for(let i=0;i<5;i++){const bx=x+5+i*5,by=y+9+r*10;R(bx,by+2,4,7,OL);R(bx+1,by+3,2,5,a);R(bx+1,by,2,3,OL);P1(bx+1,by+1,'#c8b8a0');P1(bx+1,by+5,b2)}R(x+3,y+18+r*10,26,1,'#9ac8d8')});
  R(x+3,y+7,2,32,'#ffffff');R(x+28,y+20,2,8,'#8a9aa0');if(open>0)alpha(.5,()=>R(x+2,y+6,28,34,'#ffffff'))};
// 吹风机（理发店那种罩子）：椅子 + 圆罩；on 时罩子里一圈圈热风，base=y+44
K.hoodDryer=(x,y,t,on=0)=>{R(x+10,y+16,3,24,OL);R(x+11,y+16,1,24,'#c8c8d0');box(x+2,y+30,26,8,'#e88aa8');box(x+4,y+38,22,6,'#c86a88');R(x+6,y+44,2,2,OL);R(x+22,y+44,2,2,OL);
  disc(x+18,y+8,13,8,OL);disc(x+18,y+8,12,7,'#f4a6c0');disc(x+18,y+6,9,4,'#ffc8d8');R(x+6,y+12,25,3,'#c86a88');if(on)for(let i=0;i<3;i++){const k=(t*3+i/3)%1;alpha(.7*(1-k),()=>R(x+8+i*7,y+15+k*8,4,1,'#fff4dc'))}};
// 按摩椅：base=y+40；on 时整张椅子嗡嗡抖
K.massageChair=(x,y,t,on=0)=>{const j=on?(Math.floor(t*30)%2):0;x+=j;box(x+4,y,26,22,'#6a4a3a');R(x+5,y+1,24,2,'#8a6a5a');for(let i=0;i<3;i++)R(x+8,y+5+i*5,18,2,'#5a3a2a');
  box(x,y+18,34,14,'#7a5a4a');R(x+1,y+19,32,2,'#9a7a6a');box(x-2,y+12,6,16,'#5a3a2a');box(x+30,y+12,6,16,'#5a3a2a');R(x+31,y+16,3,2,on?'#7ee08a':'#3a2a22');box(x+6,y+32,22,8,'#4a3428');R(x+8,y+40,18,2,OL)};
// 体重秤：base=y+30；圆表盘，needle 0～1 指针转到哪
K.scale=(x,y,needle=0)=>{box(x,y+14,24,14,'#e8e0d8');R(x+1,y+15,22,2,'#ffffff');R(x+2,y+26,20,2,'#b8b0a8');disc(x+12,y+8,8,8,OL);disc(x+12,y+8,7,7,'#fff8e8');for(let i=0;i<8;i++){const q=-Math.PI*.9+i/7*Math.PI*.8;P1(Math.round(x+12+Math.cos(q)*6),Math.round(y+8+Math.sin(q)*6),OL)}
  const q=-Math.PI*.9+needle*Math.PI*.8;line(x+12,y+8,Math.round(x+12+Math.cos(q)*5),Math.round(y+8+Math.sin(q)*5),'#e0533d');P1(x+12,y+8,OL)};
// 摇头电扇：base=y+44
K.fan=(x,y,t)=>{R(x+7,y+18,2,22,OL);R(x+2,y+40,12,4,OL);R(x+3,y+41,10,2,'#8ab8c8');const sw=Math.round(Math.sin(t*.8)*3);disc(x+8+sw,y+10,8,8,OL);disc(x+8+sw,y+10,7,7,'#c8e8f0');
  const a=t*20;for(let i=0;i<3;i++){const q=a+i*2.1;line(x+8+sw,y+10,Math.round(x+8+sw+Math.cos(q)*6),Math.round(y+10+Math.sin(q)*6),'#8ab8c8')}P1(x+8+sw,y+10,OL)};
// 长凳：w 宽，base=y+12
K.bathBench=(x,y,w)=>{R(x,y,w,6,OL);R(x+1,y+1,w-2,4,'#c8946a');R(x+1,y+1,w-2,1,'#e8b48a');R(x+3,y+6,3,6,OL);R(x+w-6,y+6,3,6,OL)};
// "小心地滑"的小黄牌：一只滑倒的猫
K.wetSign=(x,y)=>{for(let i=0;i<8;i++){R(x+7-i,y+i*2,2+i*2,2,OL)}for(let i=1;i<8;i++)R(x+8-i,y+i*2,i*2,2,'#ffd84a');R(x+4,y+9,6,2,OL);P1(x+5,y+8,OL);P1(x+9,y+12,OL);R(x,y+16,18,2,OL)};

/* ---------- 小电影院 ---------- */
// 银幕的框和两边的红丝绒幕布（银幕里的画面由 cinema.js 的 cinemaScreen 画）
K.screenFrame=(x,y,w,ht)=>{R(x-4,y-4,w+8,ht+8,'#0a0812');R(x-2,y-2,w+4,ht+4,'#3a3044');R(x,y,w,ht,'#d8d4e8');
  [[x-26,0],[x+w+4,1]].forEach(([cx,k])=>{for(let i=0;i<22;i++){const fold=(i%6)<3?'#9a1e34':'#7a1428';R(cx+i,y-6,1,ht+16,fold)}R(cx,y-6,22,2,'#c8a050');disc(cx+(k?4:18),y+ht/2|0,3,2,'#e8c870')});R(x-30,y-10,w+60,5,'#5a1420');R(x-30,y-10,w+60,1,'#c8a050')};
K.screenIdle=(x,y,w,ht,t)=>{R(x,y,w,ht,'#2a2a44');txt('CLOWDER',x+w/2-13,y+ht/2-6,'#ffd84a');PXT.draw('猫猫咖啡馆',x+w/2-30,y+ht/2+1,'#fff4dc');if(Math.floor(t*2)%2)R(x+w/2-30,y+ht/2+15,60,1,'#ffd84a')};
// 电影院的座位（从后面看）：w=28，base=y+22，一排排红丝绒椅背和扶手
K.seat=(x,y)=>{box(x,y,28,16,'#8a1e34');R(x+1,y+1,26,2,'#b8304a');R(x+2,y+5,24,1,'#6a1424');box(x-2,y+10,4,10,'#3a1a24');box(x+26,y+10,4,10,'#3a1a24');R(x+4,y+16,20,6,'#5a1424')};
// 放映机：base=y+30；两盘胶片转着，镜头朝北（光柱在 world-b1.js 里画）
K.projector=(x,y,t,on=1)=>{R(x+6,y+18,3,12,OL);R(x+20,y+18,3,12,OL);R(x+2,y+28,26,3,OL);box(x,y+8,30,12,'#3a3a48');R(x+1,y+9,28,2,'#5a5a68');box(x+12,y+4,8,6,'#2a2a38');disc(x+16,y+4,3,2,'#8ab8ff');
  [[x+7,y+2],[x+23,y+2]].forEach(([cx,cy],k)=>{disc(cx,cy,6,6,OL);disc(cx,cy,5,5,'#5a5a68');const q=t*(on?4:0)+k;for(let i=0;i<3;i++){const a=q+i*2.1;P1(Math.round(cx+Math.cos(a)*3),Math.round(cy+Math.sin(a)*3),'#2a2a38')}P1(cx,cy,'#c8c8d0')})};
K.exitSign=(x,y)=>{box(x,y,22,9,'#1e5a2e');txt('EXIT',x+4,y+2,'#9cffb0')};
// 排队的红绒绳：两根铜柱中间垂一道红绳，base=y+20
K.rope=(x0,x1,y)=>{[x0,x1].forEach(x=>{R(x-1,y,4,18,OL);R(x,y+1,2,16,'#d8b048');R(x,y+1,1,16,'#ffe08a');disc(x+1,y,3,2,OL);disc(x+1,y,2,1,'#ffe08a');R(x-3,y+17,8,3,OL);R(x-2,y+18,6,1,'#b8902a')});
  for(let i=0;i<=x1-x0;i++){const k=i/(x1-x0),sag=Math.round(Math.sin(k*Math.PI)*5);R(x0+1+i,y+4+sag,1,2,'#c8203a');P1(x0+1+i,y+4+sag,'#e85a6a')}};

return K})();
