/* 1024 猫咖 · 鱼谱的数据和画（设计见 docs/店内设计.md 第三节"钓鱼"）。依赖 scene-kit.js（C、use、grid、yarnBall、OL）。
   - FISH_KINDS：十种鱼（最后一种"水晶鱼"地上的河里钓不到，只在猫猫星球捞得到）和两样杂物。n 名字，sz 个头（厘米），big 大的要遛，rare 稀有，junk 杂物，sky 只在天上，d 一句介绍。
   - FISH_SPOT：三个钓点各自爱咬钩的鱼（权重）；FISH_WHERE(id)：它最爱在哪个钓点咬钩。
   - 每种一幅像素画（头朝右）：fishPx(id, cx, cy, t, {sil, flip}) 以 (cx, cy) 为中心画；sil 画成一团黑影（没钓到过）。
     fishCanvas(id, sil) 给图鉴和"钓到新的一种"那张卡：1 倍大小的小画布（按整数倍放大由用的地方做）。 */
const FISH_KINDS=[
  {id:'jiyu',n:'小鲫鱼',sz:[8,15],d:'河里最多的就是它，小小一条，银光一闪。'},
  {id:'liyu',n:'鲤鱼',sz:[20,42],big:1,d:'嘴边两对小胡须，力气大，要遛一会儿。'},
  {id:'jinli',n:'锦鲤',sz:[25,46],big:1,d:'白底红斑，像一幅画。钓到它，今天运气不错。'},
  {id:'guiyu',n:'桂鱼',sz:[18,36],big:1,d:'一身深色的花斑，背上一排硬刺，嘴很大。'},
  {id:'niqiu',n:'泥鳅',sz:[10,18],d:'滑溜溜的，一不留神就从爪子里钻走了。'},
  {id:'xia',n:'小河虾',sz:[4,8],d:'半透明的身子，弓着背，一弹一弹。'},
  {id:'pangxie',n:'小螃蟹',sz:[3,7],d:'横着走，举着两只小钳子，一脸不服气。'},
  {id:'nianyu',n:'鲶鱼',sz:[30,60],big:1,d:'大脑袋、长胡子，白天躲在深水的石头底下。'},
  {id:'jinyu',n:'金鱼',sz:[6,12],rare:1,d:'不知道是谁家鱼缸里溜出来的，拖着一条大尾巴。'},
  {id:'crystal',n:'水晶鱼',sky:1,d:'猫猫星球上的鱼：身子像一块会游的水晶，在低重力里跃得又高又慢。十条里有一条是金的。'},
  {id:'boot',n:'旧靴子',junk:1},{id:'yarn',n:'毛线球',junk:1}];
const FISH_BY={};FISH_KINDS.forEach(f=>FISH_BY[f.id]=f);
const FISH_SPOT=[{n:'栈桥尽头',w:{liyu:20,guiyu:14,nianyu:10,jinli:6,jiyu:10,boot:3,yarn:2,jinyu:1}},
  {n:'这边岸上',w:{jiyu:28,niqiu:16,xia:16,pangxie:12,liyu:6,yarn:2,jinyu:1}},{n:'对岸树荫底下',w:{jinli:16,jiyu:14,guiyu:8,nianyu:6,niqiu:8,jinyu:4,boot:2}}];
const FISH_WHERE=id=>{if(id==='crystal')return'猫猫星球 · 水晶鱼池';let b=0,bw=0;FISH_SPOT.forEach((s,i)=>{if((s.w[id]||0)>bw){bw=s.w[id];b=i}});return FISH_SPOT[b].n};

/* ---------- 画 ---------- */
// 字母：o 描边、b 身子、d 背上深一点、l 肚皮浅一点、f 鳍、s 花斑、r 红斑、w 眼白和亮点、e 眼珠、k 胡须和触须
const FO='#241a2e';
const FISH_ART={
  jiyu:{p:{o:FO,b:'#a8b8c4',d:'#7a8a98',l:'#e0ecf2',f:'#8a9aa8',w:'#ffffff',e:'#141018'},g:[
    "....oooo....",
    "o..odddddo..",
    "oooddbbbbbo.",
    "ofobbbbbbweo",
    "oooblllllbbo",
    "o..ollllloo.",
    "....oooo...."]},
  liyu:{p:{o:FO,b:'#d0a656',d:'#a07a34',l:'#f2dc9c',f:'#e08a3c',w:'#ffffff',e:'#141018',k:'#5a3a1a'},g:[
    "......ooo......",
    ".....offfoo....",
    "o...oodddddoo..",
    "oo.oddbbbbbbbo.",
    "ofoobbbbbbbbweo",
    "ofoobbllllllbbo",
    "oo..oolllllloko",
    "o.....oooooo.k."]},
  jinli:{p:{o:FO,b:'#f6f0e4',d:'#e8502a',l:'#ffffff',f:'#f8d8c8',r:'#e8502a',w:'#ffffff',e:'#141018',k:'#c8a090'},g:[
    "......ooo......",
    ".....offfoo....",
    "o...oorrbbboo..",
    "oo.orrrbbbrrbo.",
    "ofoobbbbrrbbweo",
    "ofoobrrlllllbbo",
    "oo..oolllllloko",
    "o.....oooooo..."]},
  guiyu:{p:{o:FO,b:'#c8c860',d:'#8a9a40',l:'#eeeaa8',f:'#a0a048',s:'#4a4024',w:'#ffffff',e:'#141018'},g:[
    "...o.o.o.o.....",
    "..ofofofofo....",
    "o.oddsddddsoo..",
    "ooddbbsbbbsbbo.",
    "ofosbbbbsbbbweo",
    "ofoobsbbbsbbbbo",
    "oo..oollllllooo",
    "o.....oooooo..."]},
  niqiu:{p:{o:FO,b:'#8a6a48',d:'#5a4430',l:'#c8a880',f:'#6a5038',s:'#4a3424',w:'#ffffff',e:'#141018',k:'#3a2818'},g:[
    "..ooooooooooooo..",
    "oodddsddsddsdddwo",
    "ofbbbbbbbbbbbbbbeo",
    "oolllllllllllllloko",
    "..ooooooooooooooo.k"]},
  xia:{p:{o:FO,b:'#f4b0a0',d:'#e07a68',l:'#ffe0d8',f:'#e8907c',w:'#ffffff',e:'#141018',k:'#d07060'},g:[
    "......kkkkk",
    ".....k.....",
    "...ooooooo.",
    "..odbdbdbeo",
    ".obbdbbdbbo",
    "obbo.oooooo",
    "ofo.k.k.k..",
    "ooo........"]},
  pangxie:{p:{o:FO,b:'#d8603a',d:'#a8402a',l:'#f09060',e:'#241a2e',w:'#ffffff'},g:[
    "oo.......oo",
    "olo.....olo",
    ".oo.o.o.oo.",
    "..obbbbbo..",
    ".obwebwebo.",
    ".obbbbbbbo.",
    "..oddddo...",
    ".o.o...o.o."]},
  nianyu:{p:{o:FO,b:'#6a7478',d:'#46505a',l:'#a8b2b4',f:'#525c62',w:'#ffffff',e:'#141018',k:'#2a3034'},g:[
    "...........ooo.....",
    "o.......ooodddoo...",
    "oo..ooodddddddddoo.",
    "ofoodddbbbbbbbbbweo",
    "ofoobbbbbbbbbbbbbbo",
    "oo..oollllllllllook",
    "o.......oooooooo..k",
    "...............kk.."]},
  jinyu:{p:{o:FO,b:'#ff8a2a',d:'#e85a1a',l:'#ffd27a',f:'#ffb060',w:'#ffffff',e:'#141018'},g:[
    "oo.......ooo...",
    "ofo.....offfoo.",
    "offo..oobbbbbbo",
    "offfoobbbbbbweo",
    "offffobbbbbbbbo",
    "offfoobllllllo.",
    "offo..oollllo..",
    "ofo.....oooo...",
    "oo............."]},
  crystal:{p:{o:'#0c2a44',b:'#5ac8f0',d:'#2a8ac0',l:'#a8f0ff',f:'#a8f0ff',w:'#f0ffff',e:'#0c2a44'},g:[
    "o.....ooo...",
    "oo..oolwloo.",
    "ofoolllbbbwo",
    ".ofobbbbbbeo",
    "ofoobbddbbbo",
    "oo..ooddooo.",
    "o.....ooo..."]},
  gold:{p:{o:'#5a3a08',b:'#ffd84a',d:'#c8901e',l:'#fff0a0',f:'#fff0a0',w:'#fffbe0',e:'#5a3a08'},g:null},
  boot:{p:{o:FO,b:'#6a5040',d:'#4a3428',l:'#8a6a54'},g:[
    ".oooo...",
    ".obdo...",
    ".obbo...",
    ".obbooooo",
    ".obbbbbbo",
    ".olllllllo",
    ".oooooooo."]}};
FISH_ART.gold.g=FISH_ART.crystal.g;   // 金色的水晶鱼：同一幅，换一套金色
const SIL='#130d1a';
// (cx, cy) 为中心；sil 一团黑影；flip 头朝左
function fishPx(id,cx,cy,t=0,{sil=false,flip=false}={}){if(id==='yarn'){yarnBall(cx,cy,3,0,Math.floor(t*8));return}
  const A=FISH_ART[id]||FISH_ART.jiyu,g=A.g,w=Math.max(...g.map(r=>r.length)),h=g.length,x0=Math.round(cx-w/2),y0=Math.round(cy-h/2);
  for(let j=0;j<h;j++){const r=g[j];for(let i=0;i<r.length;i++){const ch=r[i];if(ch==='.')continue;const col=sil?SIL:A.p[ch];if(!col)continue;C.fillStyle=col;C.fillRect(flip?x0+w-1-i:x0+i,y0+j,1,1)}}}
const FISH_CV={};
function fishCanvas(id,sil){const k=id+(sil?'|s':'');if(FISH_CV[k])return FISH_CV[k];const A=FISH_ART[id];let w=9,h=9;if(A&&A.g){w=Math.max(...A.g.map(r=>r.length));h=A.g.length}
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const o=C;use(cv.getContext('2d'));try{fishPx(id,w/2,h/2,0,{sil})}finally{use(o)}return FISH_CV[k]=cv}
