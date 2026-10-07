/* 1024 猫咖 · 彩蛋的挂坠（设计见 docs/店内设计.md 第四节"找到了有奖励"）。依赖 scene-kit.js、cat-sprites.js、planet-art.js（PLA.fish）；world-play.js 的 drawCat3 会调 CAT_DECO。
   - CHARMS：每个彩蛋一枚，顺序就是联机标志位里的编号（1～8，0 没戴），和 world-eggs.js 的 EGGS 一一对应。
   - 画法：三格宽、四行高；第一行是挂环，正好落在项圈正中间那一格上，下面三行挂在胸前，外面描一圈猫的描边色（挂环那一行不描，免得盖住项圈）。
   - 猫身上：c.charm 戴着哪枚（彩蛋的键），c.glow 项圈发光（去过猫猫星球），c.bubble 身边飘着水晶泡泡（1 普通、2 金色）。
     你的猫由 world-eggs.js、world-crystal.js 设好；别的真人的猫由 world-online.js 按标志位设。店猫、补位的猫都没有。
   - charmCanvas(key)：图鉴、彩蛋提示里那枚挂坠的小图（1 倍，用的地方按整数倍放大）。 */
const CHARMS={
  planet:{n:'水晶项链',d:'项圈上挂一颗星球水晶',g:[".w.","wcb","cbd",".d."],p:{w:'#f0ffff',c:'#a8f0ff',b:'#5ac8f0',d:'#2a8ac0'},spark:1},
  ninelives:{n:'平安符',d:'一枚小红符，顶上一个金结',g:[".y.","rrr","ryr","rrr"],p:{y:'#ffd84a',r:'#d8402a'}},
  shark:{n:'鲨鱼牙',d:'一颗白白的鲨鱼牙',g:[".k.","www","wwg",".w."],p:{k:'#c8b070',w:'#fffaf0',g:'#c8bca8'}},
  milk:{n:'牛奶瓶盖',d:'咖啡牛奶的蓝边瓶盖',g:[".k.",".b.","bwb",".b."],p:{k:'#c8b070',b:'#4a8ad0',w:'#ffffff'}},
  disco:{n:'迪斯科小球',d:'一颗小镜面球，中间那一点轮着换颜色',g:[".k.",".s.","sXs",".s."],p:{k:'#c8b070',s:'#d0d8e8'},X:['#ff6ad5','#6ad5ff','#ffe06a']},
  clock:{n:'小铃铛',d:'一只金色的小铃铛',g:[".y.","yyy","YYY",".o."],p:{y:'#ffd84a',Y:'#c8901e',o:'#5a3a1a'}},
  konami:{n:'彩虹徽章',d:'三道彩虹色',g:[".k.","rrr","yyy","bbb"],p:{k:'#c8b070',r:'#e8503a',y:'#ffd84a',b:'#4a9ae8'}},
  credits:{n:'小红点',d:'一颗微微发光的红珠子',g:[".k.",".R.","RrR",".R."],p:{k:'#c8b070',R:'#c82828',r:'#ff6a5a'},glow:'#ff4a4a'}};
const CHARM_KEYS=Object.keys(CHARMS);   // 下标 + 1 就是联机里的编号
// 一枚挂坠的画（ol 描边色，f 第几帧：迪斯科球的颜色、水晶的闪光）。缓存成小画布
const CHC={};
function charmImg(key,ol,f=0){const k=key+'|'+ol+'|'+f;if(CHC[k])return CHC[k];const D=CHARMS[key],g=D.g,cv=document.createElement('canvas');cv.width=5;cv.height=6;const x=cv.getContext('2d'),at=(i,j)=>(g[j]||'')[i]&&g[j][i]!=='.';
  if(ol){x.fillStyle=ol;for(let j=1;j<=g.length;j++)for(let i=-1;i<=3;i++){if(at(i,j))continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>j+b>=1&&at(i+a,j+b)))x.fillRect(i+1,j,1,1)}}
  g.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='.')return;x.fillStyle=ch==='X'?D.X[f%D.X.length]:D.p[ch];x.fillRect(i+1,j,1,1)}));
  if(D.spark&&f%2)x.fillStyle='#ffffff',x.fillRect(4,0,1,1);
  return CHC[k]=cv}
// 项圈正中间那一格：最低的一行项圈（'c'）里取中间那一格，[x, y]；没有项圈为 null（world-play.js 的贴图缓存里同样这么算）
function collarOf(G){let by=-1,xs=[];G.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='c')return;if(y>by){by=y;xs=[x]}else if(y===by)xs.push(x)}));return by<0?null:[xs[Math.floor((xs.length-1)/2)],by]}
const charmFrame=(key,t)=>key==='disco'?Math.floor(t*3):key==='planet'?(t%2.6<.25?1:0):0;
function charmCanvas(key){return charmImg(key,'#3a2630',0)}
// 水晶泡泡：一圈淡青的泡泡，里面一条发光的小水晶鱼，一上一下地晃
function bubblePx(x,y,t,gold){x=Math.round(x);y=Math.round(y);const r=6,rim=gold?'#fff0a0':'#bff4ff';
  alpha(.18,()=>disc(x,y,r,r,gold?'#ffd84a':'#7ae8ff'));
  for(let i=0;i<40;i++){const a=i/40*Math.PI*2;P1(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r),rim)}
  P1(x-3,y-4,'#ffffff');P1(x-4,y-3,'#ffffff');PLA.fish(x,y+1,Math.sin(t*.9)>0?1:-1,Math.sin(t*2)*.3,gold,t)}

WORLD_MODS.push(A=>{
const {S}=A,now=()=>A.t;
// world-play.js 的 drawCat3 画完一只猫以后调它（CAT_DECO 在 world-play.js 里声明）。项圈的位置记在猫身上（世界坐标），发光的那圈光下一帧按它放
CAT_DECO=(ctx,c,x,y,dx,top,s,t,k)=>{const cc=s.cc;
  if(cc){c._cc=[dx+cc[0],top+cc[1]];c._ccT=now()}
  if(cc&&c.charm&&CHARMS[c.charm]&&k!=='back'){const ol=(PAL[c.pal]||PAL[0]).outline;ctx.drawImage(charmImg(c.charm,ol,charmFrame(c.charm,t)),dx+cc[0]-2,top+cc[1])}
  if(c.bubble){const d=c.face==='L'?1:-1,bx=x+d*13,by=top+3+Math.sin(t*2.2+(c.id||0))*2;const o=C;use(ctx);bubblePx(bx,by,t,c.bubble===2);use(o);c._bub=[bx,by]}};
// 项圈发光：项圈的颜色往白里提一半，跟着呼吸一明一暗；挂着小红点的再多一点红光；水晶泡泡一团淡青（金色的是金光）
const lite=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=v=>Math.round(v+(255-v)*k);return'#'+[n>>16,(n>>8)&255,n&255].map(v=>f(v).toString(16).padStart(2,'0')).join('')};
const GC={};const glowCol=p=>GC[p]||(GC[p]=lite((PAL[p]||PAL[0]).collar||'#e0533d',.5));
A.tickers.push(()=>{const t=now();for(const c of S.cats){if(c.gone||c.hidden||!c._cc||t-c._ccT>.25)continue;
  if(c.glow)A.lights.push({x:c._cc[0],y:c._cc[1]+1,r:11,col:glowCol(c.pal),a:.75+.25*Math.sin(t*2+(c.id||0))});
  if(c.charm&&CHARMS[c.charm]&&CHARMS[c.charm].glow)A.lights.push({x:c._cc[0],y:c._cc[1]+3,r:6,col:CHARMS[c.charm].glow,a:.6+.3*Math.sin(t*4)});
  if(c.bubble&&c._bub)A.lights.push({x:c._bub[0],y:c._bub[1],r:15,col:c.bubble===2?'#ffd84a':'#7ae8ff',a:.85})}});
});
