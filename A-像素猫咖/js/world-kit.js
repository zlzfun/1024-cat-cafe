/* 1024 猫咖 · 场景 v3 零件（电脑端大店、多人同屏）。依赖 cat-sprites.js、scene-kit.js（v2 的画笔 R/P1/box/disc/grid/line/txt 和老零件都直接用）。
   场景里仍然不出现人类。v3 新加：砖墙、草地、隔墙和门洞、后院，以及一批新家具和机器。
   约定同 v2：(x,y) 为左上角，注释里的 base 是落地的 y，用来和猫按 y 排序；back/front 成对的零件，猫夹在两层之间（纸箱、猫窝、吊床）。 */
const hsh=(a,b=0)=>{let h=(a*374761393+b*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
function ring(cx,cy,r,col){for(let a=0,n=Math.max(8,Math.round(r*7));a<n;a++){const q=a/n*Math.PI*2;P1(Math.round(cx+Math.cos(q)*r),Math.round(cy+Math.sin(q)*r),col)}}
function pbar(x,y,w,p,col='#7ee08a'){R(x,y,w,3,OL);R(x+1,y+1,w-2,1,'#4a3a5c');R(x+1,y+1,Math.round((w-2)*Math.max(0,Math.min(1,p))),1,col)}

/* ---------- 墙、地面、隔墙 ---------- */
// 砖墙：后院那面是店的外墙，底下一圈石头墙脚
function brickWall(x,y,w,h){R(x,y,w,h,'#8e4a3c');for(let j=0,yy=y+2;yy<y+h-7;yy+=5,j++)for(let xx=x-(j%2)*6;xx<x+w;xx+=12){const a=Math.max(x,xx+1),b=Math.min(x+w,xx+12);R(a,yy,b-a,4,hsh(xx,j)<.3?'#a85a48':'#b4654f');if(a===xx+1)P1(a,yy,'#c47a62')}
  R(x,y,w,2,'#5a3a2a');R(x,y+h-7,w,7,'#8f8f96');R(x,y+h-7,w,1,'#b8b8c0');for(let i=x+4;i<x+w;i+=11)R(i,y+h-6,1,5,'#77777e');R(x,y+h-2,w,2,'#4a4a52')}
function ivy(x,y,len){for(let j=0;j<len;j++){const dx=Math.round(Math.sin(j*.5)*1.5);P1(x+dx,y+j,'#3f7a44');if(j%3===1){const s=j%6<3?-1:1;R(x+dx+(s<0?-2:1),y+j-1,2,2,'#5ea85e');P1(x+dx+s,y+j,'#4a8a4e')}}}
function floorGrass(x,y,w,h){R(x,y,w,h,'#88c070');for(let j=0;j<h;j+=2)for(let i=(j*3)%4;i<w;i+=4){const r=hsh(x+i,y+j),px=x+i,py=y+j;
  if(r<.28)P1(px,py,'#76ae60');else if(r<.42)P1(px,py,'#9cd488');else if(r<.47){P1(px,py,'#5f9a4e');P1(px+1,py-1,'#5f9a4e');P1(px-1,py-1,'#5f9a4e')}else if(r<.476)P1(px,py,['#fff4dc','#f4a6b8','#ffd84a'][Math.floor(r*1e4)%3])}}
function floorTile2(x,y,w,h){for(let j=0;j*10<h;j++)for(let i=0;i*10<w;i++){const a=x+i*10,b=y+j*10,ww=Math.min(10,x+w-a),hh=Math.min(10,y+h-b);R(a,b,ww,hh,(i+j)%2?'#e2efe6':'#cfe3d6');R(a,b,ww,1,'#bcd6c6');R(a,b,1,hh,'#bcd6c6')}}
function stones(pts){pts.forEach(([x,y])=>{disc(x,y,5,3,'#8a8278');disc(x,y,4,2,'#cfc6b8');P1(x-2,y-1,'#e8e0d4')})}
function rugRect(x,y,w,h,a,b){R(x,y,w,h,b);R(x+2,y+2,w-4,h-4,a);R(x+4,y+4,w-8,h-8,b);R(x+5,y+5,w-10,h-10,a);for(let i=x+2;i<x+w-2;i+=3){P1(i,y-1,b);P1(i,y+h,b)}}
// 隔墙顶（从上往下看的那条墙头）和门洞两侧的门框
function wallTop(x,y,w,h){R(x,y,w,h,'#4a2e22');R(x+1,y+1,w-2,h-2,'#6e4430');R(x+1,y+1,w-2,1,'#8a5a3a')}
function jamb(x,y,h){R(x,y,3,h,'#4a2e22');R(x+1,y,1,h,'#8a5a3a')}
function pillar(x,y,h){R(x,y,10,h,OL);R(x+1,y,8,h,'#e8dccb');R(x+1,y,2,h,'#fff4dc');R(x+7,y,2,h,'#c8b89a');R(x-1,y,12,4,OL);R(x,y+1,10,2,'#d8c8a8');R(x-1,y+h-4,12,4,OL);R(x,y+h-3,10,2,'#d8c8a8')}
// 木栅栏：横着一排尖头木板（后院的下沿）；竖着的一段是从上往下看
function fenceH(x,y,w){R(x,y+5,w,2,'#7a4c36');R(x,y+12,w,2,'#7a4c36');for(let i=x;i<x+w-3;i+=6){R(i,y+1,5,17,OL);P1(i+2,y,OL);R(i+1,y+2,3,15,'#d9b98a');P1(i+2,y+1,'#d9b98a');R(i+1,y+2,1,15,'#ecd2a4')}}
function fenceV(x,y,h){R(x,y,6,h,OL);R(x+1,y,4,h,'#c4a26f');for(let j=y;j<y+h;j+=14){R(x,j,6,4,OL);R(x+1,j+1,4,2,'#ecd2a4')}}

/* ---------- 门厅 ---------- */
// 分球机：投递口掉进来的毛线球被吸进玻璃罩，再从前面的出球口弹进毛线篮。(x,y) 左上 28×40，base=y+40
// balls 罩里排队的颜色；pop 出球口在吐球；suck {ci,k} 正从左边的管子吸上来（k 0→1）
function sorter(x,y,t,{balls=[],pop=0,suck=null}={}){
  R(x-1,y+13,6,25,OL);R(x,y+13,4,25,'#d8f0f8');R(x,y+13,1,25,'#ffffff');R(x-2,y+36,8,4,OL);R(x-1,y+37,6,1,'#9aa3ad');
  disc(x+14,y+11,11,10,OL);disc(x+14,y+11,10,9,'#e2f4fa');
  balls.slice(0,6).forEach((ci,i)=>yarnBall(x+8+(i%3)*6,y+15-Math.floor(i/3)*5,2,ci));
  if(suck){const k=suck.k;if(k<.7)yarnBall(x+2,y+35-Math.round(k/.7*22),1,suck.ci);else yarnBall(x+3+Math.round((k-.7)/.3*7),y+11-Math.round(Math.sin((k-.7)/.3*Math.PI)*3),2,suck.ci)}
  P1(x+8,y+5,'#ffffff');P1(x+7,y+6,'#ffffff');P1(x+7,y+7,'#ffffff');
  R(x+3,y+20,22,3,OL);R(x+4,y+21,20,1,'#e8b83a');
  box(x+4,y+22,20,14,'#e0533d');R(x+5,y+23,18,2,'#f07a60');R(x+5,y+34,18,1,'#b8402c');
  R(x+10,y+27,9,7,OL);R(x+11,y+28,7,5,'#241a2e');R(x+10,y+33,9,1,'#d8b04a');if(pop)R(x+11,y+28,7,1,'#ffd84a');
  P1(x+7,y+26,Math.floor(t*2)%2||pop?'#ffd84a':'#7a3030');R(x+21,y+26,1,5,'#b8402c');
  R(x+5,y+36,3,4,OL);R(x+20,y+36,3,4,OL)}
// 委托看板：钉着还没解的便签，一张便签就是一颗毛线球
function corkboard(x,y,w,h,n){box(x,y,w,h,'#8a5a3a');R(x+2,y+2,w-4,h-4,'#c9955e');for(let i=0;i<w*h/14;i++)P1(x+2+Math.floor(hsh(i,7)*(w-4)),y+2+Math.floor(hsh(i,9)*(h-4)),'#b07e48');
  const cols=Math.floor((w-5)/9),rows=Math.floor((h-4)/8);for(let i=0;i<Math.min(n,cols*rows);i++){const cx=x+3+(i%cols)*9+(Math.floor(i/cols)%2),cy=y+3+Math.floor(i/cols)*8;
    R(cx,cy+1,7,6,'#e8dcc4');R(cx,cy,7,6,'#fff8e0');R(cx+1,cy+2,5,1,'#b9a8c9');R(cx+1,cy+4,3,1,'#b9a8c9');P1(cx+3,cy,YARNC[i%5][0])}}
// 大件投递口：门边墙脚的小门，大毛线团从这里滚进来。(x,y) 左上 20×14
function xlHatch(x,y,open=0){R(x,y,20,14,OL);R(x+1,y+1,18,13,'#d8b04a');R(x+1,y+1,18,1,'#f4d27a');R(x+3,y+4,14,10,'#241a2e');
  if(open)R(x+3,y+1,14,3,'#9a6448');else{R(x+3,y+4,14,10,'#9a6448');R(x+3,y+4,14,1,'#b87a58');txt('XL',x+7,y+7,'#fff4dc')}}
// 入场纸箱：新上线的猫从这里钻出来，下线的猫跳进去。(x,y) 左上 30×20，base=y+20；pop 翻盖弹一下
function welcomeBox(x,y,t,pop=0){const b=pop>0?Math.round(Math.abs(Math.sin(pop*18))*2):0;
  R(x-5,y+1-b,8,3,OL);R(x-4,y+2-b,6,1,'#c49656');R(x+27,y+1-b,8,3,OL);R(x+28,y+2-b,6,1,'#c49656');
  R(x,y+2,30,5,OL);R(x+1,y+3,28,3,'#6e4a28');
  R(x,y+6,30,14,OL);R(x+1,y+7,28,12,'#d6a868');R(x+1,y+7,28,1,'#e8c088');R(x+13,y+7,4,12,'#eadcb8');txt('HI',x+4,y+10,'#8a5a3a');txt('♥',x+20,y+10,'#e0533d')}
// 大纸箱：能挤三只猫，只露脑袋。back 画箱口，猫画在中间（脚底 y+15），front 画前面板。40×18，base=y+18
function bigBoxBack(x,y){R(x+3,y,34,4,OL);R(x+4,y+1,32,2,'#c49656');R(x,y+3,40,4,OL);R(x+1,y+4,38,2,'#6e4a28')}
function bigBoxFront(x,y){R(x,y+6,40,12,OL);R(x+1,y+7,38,10,'#d6a868');R(x+1,y+7,38,1,'#e8c088');R(x+17,y+7,6,10,'#eadcb8');R(x-3,y+4,4,3,OL);R(x-2,y+5,3,1,'#c49656');R(x+39,y+4,4,3,OL);R(x+40,y+5,3,1,'#c49656');txt('XL',x+5,y+10,'#b08448')}
// 甜甜圈猫窝：猫蜷在中间（脚底 y+8）。34×12，base=y+12
function catBedBack(x,y){disc(x+17,y+6,16,5,OL);disc(x+17,y+6,15,4,'#9B7EBD');disc(x+17,y+6,12,3,'#d0bce4');R(x+7,y+4,20,1,'#b8a0d8')}
function catBedFront(x,y){for(let i=-15;i<=15;i++){const d=Math.round(4*Math.sqrt(1-(i/16)**2));R(x+17+i,y+6+d-2,1,3,Math.abs(i)>12?'#8a70b0':'#9B7EBD');P1(x+17+i,y+6+d+1,OL)}R(x+6,y+8,22,1,'#b8a0d8')}
// 猫抓柱：剑麻柱子，顶上挂个小绒球；scratch 时掉毛屑。16×42，base=y+42
function scratchPost(x,y,t,scratch=0){R(x,y+37,16,5,OL);R(x+1,y+38,14,3,'#b8a0d8');R(x+1,y+38,14,1,'#d0bce4');
  R(x+4,y+6,8,32,OL);R(x+5,y+6,6,32,'#d9b98a');for(let j=y+7;j<y+37;j+=2)R(x+5,j,6,1,'#c4a26f');if(scratch)for(let j=y+19;j<y+31;j+=3)R(x+5,j,6,1,'#eadcb8');
  R(x+1,y+3,14,4,OL);R(x+2,y+4,12,2,'#b8a0d8');
  const a=Math.sin(t*2)*2,bx=Math.round(x+13+a);line(x+13,y+7,bx,y+13,'#d9d2c4');disc(bx,y+15,2,2,OL);disc(bx,y+15,1,1,'#f4a6b8');
  if(scratch)for(let i=0;i<3;i++){const k=(t*2+i/3)%1;P1(x+3-Math.round(k*5)+i*5,y+22+Math.round(k*14),'#eadcb8')}}
function hooks(x,y,items){R(x,y,items.length*10+4,3,OL);R(x+1,y,items.length*10+2,2,'#a8703f');items.forEach((it,i)=>{R(x+6+i*10,y+3,1,2,OL);if(it)knit(it.kind,x+6+i*10,y+4,it.ci)})}

/* ---------- 橱窗长廊 ---------- */
// 立式小黑板：写今天交付了几件。24×28，base=y+28
function aBoard(x,y,lines){line(x+3,y+4,x+1,y+27,OL);line(x+20,y+4,x+22,y+27,OL);box(x,y,24,21,'#8a5a3a');R(x+2,y+2,20,17,'#2f4a3a');
  lines.forEach(([s,yy,col='#e8f0e0',k=1])=>txt(s,x+Math.floor((24-txtW(s,k))/2),y+yy,col,k))}
// 爪印墙：交付完可以按一个爪印，一整天下来印满
function pawPrint(x,y,col){P1(x+1,y,col);P1(x+3,y,col);P1(x,y+1,col);P1(x+4,y+1,col);R(x+1,y+2,3,2,col)}
function pawWall(x,y,w,h,prints){R(x+1,y+1,w,h,'#c9b89a');R(x,y,w,h,'#fffaf0');R(x,y,w,1,'#f0e4cc');[[x-1,y-1],[x+w-4,y-1],[x-1,y+h-3],[x+w-4,y+h-3]].forEach(([a,b])=>R(a,b,5,4,'#e8d890'));
  txt('PAW',x+Math.floor((w-11)/2),y+3,'#d8c8a8');prints.forEach(p=>pawPrint(x+p.x,y+p.y,p.col))}
function inkPad(x,y){R(x,y,20,7,OL);R(x+1,y+1,18,5,'#8a8a96');['#e0533d','#5B9BD5','#e8b83a'].forEach((c,i)=>R(x+2+i*6,y+2,4,3,c))}   // 20×7，平放在地上
// 拍照角：立着的背景板；相机背对我们，背面小屏倒数 3、2、1
function backdrop(x,y,w,h,t){R(x+3,y+h,2,6,OL);R(x+w-5,y+h,2,6,OL);box(x,y,w,h,'#2f2340','#8a5a3a');
  for(let i=0;i<w*h/40;i++){const px=x+2+Math.floor(hsh(i,3)*(w-4)),py=y+2+Math.floor(hsh(i,5)*(h-4));P1(px,py,(Math.floor(t*2)+i)%5?'#6a5a8a':'#ffd84a')}
  txt('1024',x+Math.floor((w-txtW('1024',2))/2),y+Math.floor(h/2)-4,'#f4a6b8',2);bunting(x+2,x+w-2,y+2,w-4)}   // base=y+h+6
function camBack(x,y,t,{count=0,flash=0}={}){line(x+8,y+12,x+2,y+30,OL);line(x+8,y+12,x+14,y+30,OL);line(x+8,y+13,x+8,y+30,'#6b7480');
  R(x+5,y-3,6,4,OL);R(x+6,y-2,4,2,flash?'#ffffff':'#b9c2ca');box(x,y,16,12,'#3a3a46');R(x+2,y+2,12,7,'#16202c');
  if(count)txt(String(count),x+7,y+3,'#8fe0a8');else{P1(x+4,y+4,Math.floor(t*1.5)%2?'#e0533d':'#6a2a30');R(x+7,y+4,5,1,'#4a5a6a');R(x+7,y+6,4,1,'#4a5a6a')}}   // 16×30，base=y+30

/* ---------- 1024 工坊 ---------- */
// 长桌：桌面有进深，显示器立在后半边，猫坐在前半边（落脚 y+9）。base=y+32
function desk(x,y,w){R(x,y,w,12,OL);R(x+1,y+1,w-2,10,'#e8dccb');R(x+1,y+1,w-2,1,'#fff4dc');R(x,y+12,w,4,OL);R(x+1,y+12,w-2,3,'#b8a488');
  R(x+2,y+16,4,16,OL);R(x+3,y+16,2,15,'#8a7a66');R(x+w-6,y+16,4,16,OL);R(x+w-5,y+16,2,15,'#8a7a66');box(x+w-30,y+16,22,12,'#c8b89a');R(x+w-21,y+21,4,1,OL)}
// 显示器：code 慢慢滚代码 / type 被猫踩了键盘满屏乱码 / pass 构建通过。28×22（含底座）
function monitor(x,y,t,{mode='code',seed=0}={}){box(x,y,28,19,'#2a2238');R(x+2,y+2,24,14,'#16202c');
  if(mode==='pass'){R(x+2,y+2,24,14,'#1c3a2c');grid(x+11,y+5,['.....o','....oo','o..oo.','oooo..','.oo...'],{o:'#7ee08a'})}
  else{const fast=mode==='type',sc=Math.floor(t*(fast?9:.7));for(let i=0;i<6;i++){const r=hsh(seed+i+sc,11),ind=fast?0:Math.floor(hsh(seed+i+sc,13)*3)*2,len=Math.round(r*(fast?20:14))+4;
      const col=fast?(r<.3?'#e0533d':r<.6?'#ffd84a':'#e8f0e0'):r<.25?'#f4a6b8':r<.5?'#8fc8f0':r<.75?'#9ccc98':'#e8f0e0';
      if(fast){for(let k=0;k<Math.min(len,22);k+=2)if(hsh(k,seed+i+sc)<.7)P1(x+3+k,y+3+i*2,col)}else R(x+3+ind,y+3+i*2,Math.min(len,22-ind),1,col)}
    if(Math.floor(t*2)%2)R(x+3+(fast?Math.round(hsh(sc,3)*18):2),y+14,2,1,'#e8f0e0')}
  R(x+12,y+19,4,2,OL);R(x+9,y+21,10,1,OL)}
function keyboard(x,y,t,press=0){R(x,y,22,5,OL);R(x+1,y+1,20,3,'#4a4a56');for(let j=0;j<2;j++)for(let i=0;i<9;i++){const on=press&&hsh(i+j*9,Math.floor(t*10))<.3;P1(x+2+i*2,y+1+j*2,on?'#ffd84a':'#8a8a98')}}   // 22×5
// 小黄鸭：调试鸭。对着它把问题讲一遍，就想通了
const DUCK=["..ooo...",".oyyyo..",".oyeyooo",".oyyyaa.","ooyyyyo.","oyyyyyyo",".oooooo."];
function duck(x,y){grid(x,y,DUCK,{o:OL,y:'#ffd84a',e:'#241a2e',a:'#f08a4a'});P1(x+3,y+5,'#fff0a8')}   // 8×7
// 打印机（放在小柜子上）：吐出来的纸会被猫拍成纸团。28×34，base=y+34；printing 0→1 纸往外吐
function printer(x,y,t,printing=0){box(x,y+14,28,20,'#9a6448');R(x+1,y+15,26,1,'#b87a58');R(x+4,y+22,20,1,'#7a4c36');R(x+12,y+25,4,1,'#d8b04a');
  R(x+7,y,14,6,OL);R(x+8,y+1,12,5,'#fff8e8');R(x+9,y+2,9,1,'#d8d0c0');
  box(x+1,y+4,26,11,'#d8dde2');R(x+2,y+5,24,2,'#eef2f4');R(x+5,y+11,18,1,OL);P1(x+22,y+7,printing&&Math.floor(t*6)%2?'#7ee08a':'#4a7a58');
  if(printing){const h=Math.round(Math.min(1,printing)*9);R(x+7,y+12,14,h,'#fff8e8');for(let j=2;j<h-1;j+=2)R(x+9,y+12+j,9-(j%4),1,'#b9a8c9')}}
function trashCan(x,y){R(x,y,14,3,OL);R(x+1,y+1,12,1,'#b9c2ca');for(let j=3;j<16;j++){const s=j>12?1:0;R(x+1+s,y+j,12-2*s,1,OL);R(x+2+s,y+j,10-2*s,1,j%3?'#8f99a3':'#6b7480')}for(let i=x+3;i<x+12;i+=3)R(i,y+4,1,9,'#aab3bc');R(x+2,y+15,10,1,OL)}   // 14×16，base=y+16
function paperBall(cx,cy){disc(cx,cy,3,3,OL);disc(cx,cy,2,2,'#f4f0e8');P1(cx-1,cy,'#c8c0b4');P1(cx+1,cy-1,'#c8c0b4');P1(cx,cy+1,'#dcd4c8')}
// 服务器机柜：顶上暖和，砚砚的地盘。30×64，base=y+64，顶面落脚 y+4；busy 灯闪得快
function serverRack(x,y,t,busy=0){R(x,y,30,64,OL);R(x+1,y+1,28,3,'#6a6a7a');R(x+1,y+4,28,58,'#2a2a36');
  for(let i=0;i<9;i++){const uy=y+6+i*6;R(x+3,uy,24,5,'#3a3a48');R(x+3,uy,24,1,'#4a4a5a');for(let k=0;k<3;k++){const on=hsh(i*3+k,Math.floor(t*(busy?9:2)))<.5;P1(x+5+k*2,uy+2,on?(k===2?'#ffd84a':'#7ee08a'):'#2f4a36')}for(let k=x+13;k<x+25;k+=2)R(k,uy+1,1,3,'#22222c')}
  R(x+3,y+60,4,4,OL);R(x+23,y+60,4,4,OL)}
// CI 灯：pass 绿 / fail 红（转着闪）/ run 黄。16×19
function ciLight(x,y,t,state='pass'){box(x,y+11,16,8,'#3a3a46');txt('CI',x+5,y+13,'#fff4dc');const col={pass:'#7ee08a',fail:'#e0533d',run:'#ffd84a'}[state];
  disc(x+8,y+6,6,5,OL);disc(x+8,y+6,5,4,state==='run'&&Math.floor(t*3)%2?'#8a7a30':col);
  if(state==='fail'){const a=t*8;P1(x+8+Math.round(Math.cos(a)*3),y+6+Math.round(Math.sin(a)*2),'#ffc0b0');P1(x+8+Math.round(Math.cos(a)*2),y+6+Math.round(Math.sin(a)),'#ffc0b0')}else P1(x+6,y+4,'#ffffff')}
function whiteboard(x,y,w,h){box(x,y,w,h,'#f4f6f8','#8a8a96');R(x+1,y+h-3,w-2,2,'#c8cdd2');
  const bx=(a,b,c,d,col)=>{R(x+a,y+b,c,1,col);R(x+a,y+b+d-1,c,1,col);R(x+a,y+b,1,d,col);R(x+a+c-1,y+b,1,d,col)};
  bx(4,4,12,8,'#5B9BD5');bx(22,4,12,8,'#5B9BD5');bx(12,18,14,8,'#e0533d');line(x+16,y+8,x+21,y+8,'#3a3a46');line(x+10,y+12,x+16,y+18,'#3a3a46');line(x+28,y+12,x+23,y+18,'#3a3a46');
  txt('TODO',x+w-19,y+4,'#9B7EBD');R(x+w-19,y+11,14,1,'#b9a8c9');R(x+w-19,y+14,10,1,'#b9a8c9');R(x+w-19,y+17,12,1,'#b9a8c9')}
// 大毛线团：一件疑难委托，三只猫一起扒拉才解得开。p 进度 0→1，越解越小、线越少。(cx,cy) 落地中点
function giantYarn(cx,cy,t,p=0,cols=[0,1,4]){const r=Math.round(13-p*6),y0=cy-r-1;
  alpha(.25,()=>disc(cx,cy,r+2,2,'#241a2e'));
  for(let i=0;i<Math.round(4*(1-p))+1;i++){const s=i%2?1:-1,len=8+i*4,col=YARN[cols[1+i%2]][0];for(let k=0;k<len;k++)P1(cx+s*(r-2+k),cy-1+Math.round(Math.sin(k*.5+i)*1.5),col)}
  disc(cx,y0,r+1,r+1,OL);disc(cx,y0,r,r,YARN[cols[0]][0]);
  const n=Math.round(10*(1-p))+3;for(let i=0;i<n;i++){const q=hsh(i,21)*Math.PI*2,q2=q+1.2+hsh(i,22)*2,rr=r-1;line(cx+Math.round(Math.cos(q)*rr),y0+Math.round(Math.sin(q)*rr),cx+Math.round(Math.cos(q2)*rr),y0+Math.round(Math.sin(q2)*rr),YARN[cols[1+i%2]][i%3?0:1])}
  P1(cx-Math.round(r*.5),y0-Math.round(r*.6),YARN[cols[0]][2]);P1(cx-Math.round(r*.6),y0-Math.round(r*.5),YARN[cols[0]][2]);
  if(p>0)for(let i=0;i<4;i++){const k=(t*1.6+i/4)%1;P1(cx+Math.round(Math.cos(i*1.7)*(r+2+k*8)),y0+Math.round(Math.sin(i*1.7)*(r+2+k*6))-Math.round(k*4),YARN[cols[i%3]][0])}}
// 懒人沙发：陷进去。30×18，base=y+18，落脚 y+12
function beanbag(x,y,col=['#5B9BD5','#34618f','#a8d0f0']){const [a,d,l]=col;disc(x+15,y+11,15,7,OL);disc(x+15,y+11,14,6,a);disc(x+10,y+6,8,6,OL);disc(x+10,y+6,7,5,a);disc(x+9,y+4,4,2,l);disc(x+19,y+11,7,3,d);R(x+3,y+17,24,1,OL)}

/* ---------- 吧台那头（猫的饭碗）、楼梯间的零食机 ---------- */
function fridge(x,y){box(x,y,28,58,'#eef2f4');R(x+1,y+1,26,2,'#ffffff');R(x+1,y+19,26,1,OL);R(x+22,y+8,2,8,'#9aa3ad');R(x+22,y+24,2,14,'#9aa3ad');R(x+1,y+56,26,1,'#c8cdd2');
  [[5,6,'#e0533d'],[10,10,'#5B9BD5'],[6,28,'#e8b83a'],[12,34,'#9B7EBD']].forEach(([a,b,c])=>R(x+a,y+b,3,3,c));pawPrint(x+8,y+42,'#f4a6b8')}   // 28×58，base=y+58
// 零食机：前面三块爪垫同时有猫踩着才出零食。lit 亮了几块，drop 出零食中。36×56，base=y+56
function treatMachine(x,y,t,{lit=0,drop=0}={}){box(x,y,36,56,'#9B7EBD');R(x+1,y+1,34,2,'#b8a0d8');R(x+2,y+3,32,9,'#654a86');txt('SNACK',x+8,y+5,Math.floor(t*2)%2||lit>=3?'#ffd84a':'#e8b83a');
  R(x+3,y+14,22,26,OL);R(x+4,y+15,20,24,'#dff4fb');for(let j=0;j<3;j++)for(let i=0;i<3;i++){const fx=x+6+i*6,fy=y+18+j*8,c=YARNC[(i+j*2)%5][0];R(fx,fy,4,2,c);P1(fx+4,fy-1,c);P1(fx+4,fy+2,c);R(fx-1,fy+4,6,1,'#9aa3ad')}
  R(x+4,y+15,1,24,'#ffffff');for(let i=0;i<3;i++){R(x+27,y+15+i*8,6,6,OL);R(x+28,y+16+i*8,4,4,i<lit?'#ffd84a':'#4a3a5c');if(i<lit)P1(x+29,y+17+i*8,'#fff')}
  R(x+5,y+44,20,8,OL);R(x+6,y+45,18,6,'#241a2e');if(drop)for(let i=0;i<3;i++){const k=(t*2+i/3)%1;R(x+9+i*5,y+45+Math.round(k*4),3,2,YARNC[i][0])}R(x+2,y+54,4,2,OL);R(x+30,y+54,4,2,OL)}
function pawPlate(x,y,on=0){R(x+1,y,14,8,OL);R(x,y+1,16,6,OL);R(x+1,y+1,14,6,on?'#ffd84a':'#e8dccb');pawPrint(x+6,y+2,on?'#e0533d':'#c8b89a')}   // 16×8，平放在地上
// 流水饮水机：22×16，base=y+16
function fountain(x,y,t){disc(x+11,y+11,11,5,OL);disc(x+11,y+11,10,4,'#fff4dc');disc(x+11,y+10,8,3,'#8fd0ef');R(x+10,y+3,3,7,OL);R(x+11,y+3,1,7,'#e8f6ff');
  for(let i=0;i<6;i++){const k=(t*2.2+i/6)%1,s=i%2?1:-1;P1(x+11+s*Math.round(k*6),y+3-Math.round(Math.sin(k*Math.PI)*4)+Math.round(k*6),'#cfeef8')}
  const rr=Math.floor(t*3)%3;P1(x+8-rr,y+10,'#e8f6ff');P1(x+14+rr,y+10,'#e8f6ff')}
// 小圆桌：上面摆着能推下去的小东西。base=y+28，桌面落脚 y+5
function cafeTable(x,y,w=50){R(x,y,w,9,OL);R(x+1,y+1,w-2,5,'#c98d5c');R(x+1,y+1,w-2,1,'#e0a878');R(x+1,y+6,w-2,2,'#8a5a3a');R(x+4,y+9,3,19,OL);R(x+w-7,y+9,3,19,OL);R(x+Math.floor(w/2)-1,y+9,3,17,OL)}
const TOY={pen:["y.b.r","y.b.r","ooooo","owwwo","owwwo","owwwo","ooooo"],globe:[".ooo.","oqwqo","oqqwo","oqqqo",".ooo.","orrro","ooooo"],
  mouse:[".oo....","ogggo..","oggggoo",".ooooo."],cactus:["..o..",".ogo.","ogggo",".ogo.","ooooo","orrro",".ooo."]};
const TOY_NAMES={pen:'笔筒',globe:'雪花球',mouse:'玩具老鼠',cactus:'小仙人掌'};
function toy(kind,x,y,fallen=0){const g=fallen?rotCCW(TOY[kind]):TOY[kind];grid(x-Math.floor(g[0].length/2),y-g.length,g,{o:OL,y:'#ffd84a',b:'#5B9BD5',r:'#e0533d',w:'#fff8e8',q:'#cfeef8',g:kind==='mouse'?'#b9a8c9':'#5ea85e'})}   // (x,y) 底边中点
function catGrass(x,y,t,chew=0){const hh=chew?4:9;for(let i=0;i<7;i++){const sw=Math.round(Math.sin(t*1.6+i)),h=hh-(i%3);for(let j=0;j<h;j++)P1(x+2+i+(j>h-3?sw:0),y+10-j,i%2?'#5ea85e':'#7cc48a')}R(x,y+10,12,7,OL);R(x+1,y+11,10,5,'#c46a44');R(x+1,y+11,10,1,'#e08a5a')}   // 12×17，base=y+17
function canShelf(x,y,n=5){R(x,y,n*9+4,3,OL);R(x+1,y,n*9+2,2,'#a8703f');for(let i=0;i<n;i++){const cx=x+3+i*9;R(cx,y-8,7,8,OL);R(cx+1,y-7,5,7,YARNC[i%5][0]);R(cx+1,y-7,5,1,'#e8e8f0');R(cx+2,y-4,3,1,'#fff4dc')}}

/* ---------- 大客厅 ---------- */
function fireplace(x,y,t){R(x-3,y,64,5,OL);R(x-2,y+1,62,3,'#8a5a3a');R(x-2,y+1,62,1,'#a8703f');
  R(x,y+5,58,36,OL);R(x+1,y+5,56,35,'#cfc6b8');for(let j=0;j<7;j++){R(x+1,y+9+j*5,56,1,'#b4aa9a');for(let i=(j%2)*5;i<56;i+=10)R(x+1+i,y+5+j*5,1,4,'#b4aa9a')}
  R(x+13,y+13,32,27,OL);R(x+14,y+14,30,26,'#241a2e');
  for(let i=0;i<9;i++){const h=6+Math.round((Math.sin(t*9+i*1.7)+Math.sin(t*5.3+i))*2.2)+(i>2&&i<7?4:0),fx=x+16+i*3;R(fx,y+36-h,3,h,'#e0533d');R(fx,y+36-Math.round(h*.65),3,Math.round(h*.65),'#f08a4a');R(fx+1,y+36-Math.round(h*.35),1,Math.round(h*.35),'#ffd84a')}
  R(x+15,y+35,28,3,'#6a3a22');R(x+18,y+34,10,2,'#8a5028');R(x+30,y+34,10,2,'#8a5028');R(x-3,y+40,64,4,OL);R(x-2,y+41,62,2,'#8f8f96')}   // 58×44，base=y+44
function bookshelf(x,y,w=36,h=46){box(x,y,w,h,'#9a6448');for(let s=0;s<3;s++){const sy=y+3+s*14;R(x+2,sy,w-4,12,'#6e4430');let bx=x+3,i=0;
  while(bx<x+w-5){const bw=2+Math.floor(hsh(bx,sy)*3),bh=8+Math.floor(hsh(sy,bx)*4);R(bx,sy+12-bh,Math.min(bw,x+w-3-bx),bh,['#e0533d','#5B9BD5','#e8b83a','#5B8C5A','#9B7EBD','#f4a6b8','#fff4dc'][Math.floor(hsh(bx,i++)*7)]);bx+=bw+(hsh(bx,1)<.2?2:0)}R(x+1,sy+12,w-2,2,'#8a5a3a')}}   // base=y+h
// 相框：inner(x,y) 画框里的东西（店里几只 NPC 猫的大头照）
function frame(x,y,w,h,inner){box(x,y,w,h,'#d8b04a','#8a5a3a');R(x+2,y+2,w-4,h-4,'#f4e4c8');if(inner){C.save();C.beginPath();C.rect(x+2,y+2,w-4,h-4);C.clip();inner(x+2,y+2);C.restore()}}
// 暖桌（被炉）：猫钻进去只露尾巴。tails = [{pal}]，最多 6 条；拼布被子，桌上一盆橘子。72×34，base=y+34
const TAILK=[".oo..","obbo.","obbo.","ofbo.","obbo.",".obbo",".ofbo","..oo."];
function kotatsu(x,y,t,tails=[],jig=0){const PAT=['#f7a58c','#a8d0f0','#d0bce4','#9ccc98','#fff0a8'],j=jig>0?Math.round(Math.sin(jig*30)):0;
  R(x+2,y+8+j,68,24-j,OL);R(x,y+12,72,18,OL);R(x+3,y+9+j,66,22-j,PAT[0]);R(x+1,y+13,70,16,PAT[0]);
  for(let r=0;r<4;r++)for(let i=0;i<9;i++){const px=x+1+i*8,py=y+10+j+r*5;const pw=Math.min(8,x+71-px);R(px,py,pw,5,PAT[(i+r*2)%5]);R(px,py+4,pw,1,'#e8dccb')}R(x+1,y+29,70,2,'#c8b89a');
  R(x+6,y+2,60,8,OL);R(x+7,y+3,58,5,'#b87a58');R(x+7,y+3,58,1,'#d09870');
  disc(x+36,y+2,7,2,OL);disc(x+36,y+2,6,1,'#c9954e');[[32,-1],[39,-1],[35,-3]].forEach(([a,b])=>{disc(x+a,y+b,2,2,OL);disc(x+a,y+b,1,1,'#f08a4a');P1(x+a,y+b-2,'#5ea85e')});
  tails.slice(0,6).forEach((tl,i)=>{const tx=x+6+i*11,sw=Math.round(Math.sin(t*2.2+i*1.3)),p=tl.pal,g=i%2?TAILK.map(r=>[...r].reverse().join('')):TAILK;
    grid(tx,y+29,g.slice(0,5),{o:p.outline,b:p.body,f:p.stripe||p.points||p.spot||p.shade});grid(tx+sw,y+34,g.slice(5),{o:p.outline,b:p.body,f:p.stripe||p.points||p.spot||p.shade})})}
// 地板钢琴：踩上去就响。98×24，平铺在地上；pressed[i] 第 i 个白键被踩着
function floorPiano(x,y,pressed=[]){R(x,y,98,24,OL);for(let i=0;i<12;i++){R(x+1+i*8,y+1,7,22,pressed[i]?'#ffd84a':'#fff8e8');R(x+1+i*8,y+21,7,1,pressed[i]?'#e8b83a':'#e0d6c4')}
  [0,1,3,4,5,7,8,10].forEach(i=>R(x+6+i*8,y+1,4,12,'#2a2238'))}
// 高猫爬架：四层。44×124，base=y+124；TREE_TALL 是各层落脚点（相对 x,y 的猫脚底）
const TREE_TALL=[[28,12],[12,42],[32,70],[14,98]];
function catTreeTall(x,y,t){const post=(px,y1,y2)=>{R(px,y1,7,y2-y1,OL);R(px+1,y1,5,y2-y1,'#d9b98a');for(let j=y1+1;j<y2;j+=2)R(px+1,j,5,1,'#c4a26f')};
  const plat=(px,py,w)=>{R(px,py,w,7,OL);R(px+1,py+1,w-2,3,'#b8a0d8');R(px+1,py+4,w-2,2,'#8a70b0')};
  box(x,y+116,44,8,'#b8a0d8');R(x+1,y+120,42,3,'#8a70b0');post(x+30,y+14,y+116);post(x+6,y+44,y+116);post(x+24,y+72,y+100);
  plat(x+14,y+10,28);plat(x,y+40,24);plat(x+20,y+68,24);plat(x+2,y+96,24);
  const a=Math.sin(t*2.2)*3,bx=Math.round(x+41+a);line(x+41,y+17,bx,y+27,'#d9d2c4');yarnBall(bx,y+29,2,1)}
function bubbleMachine(x,y,t,on=0){box(x,y+4,18,10,'#5B9BD5');R(x+1,y+5,16,2,'#a8d0f0');P1(x+3,y+9,on?'#7ee08a':'#34618f');
  const a=on?t*4:0;for(let i=0;i<4;i++){const q=a+i*Math.PI/2;ring(x+11+Math.round(Math.cos(q)*3),y+4+Math.round(Math.sin(q)*3),1,'#e8b83a')}R(x+10,y+3,2,2,OL)}   // 18×14，base=y+14
function bubble(x,y,r,pop=0){if(pop){const d=r+Math.round(pop*4);[[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]].forEach(([a,b])=>P1(x+Math.round(a*d),y+Math.round(b*d),'#ffffff'));return}
  alpha(.3,()=>disc(x,y,r-1,r-1,'#cfeef8'));ring(x,y,r,'#e8f6ff');P1(x-Math.round(r/2),y-Math.round(r/2),'#ffffff')}
function laserDot(x,y){alpha(.35,()=>R(x-2,y-1,5,3,'#ff3048'));R(x-1,y-1,2,2,'#ff3048');P1(x-1,y-1,'#ffc0c8')}
function laserBox(x,y,t,on){box(x,y,12,7,'#3a3a46');R(x+2,y+2,5,1,'#6b7480');P1(x+9,y+3,on&&Math.floor(t*6)%2?'#ff3048':'#6a2a30')}
// 猫隧道：钻进去从另一头出来。bulge 0→1 猫在里面走到哪儿（-1 空）。62×18，base=y+18
function tunnel(x,y,t,bulge=-1){const bx=bulge>=0?x+8+Math.round(bulge*46):-99;
  for(let i=5;i<57;i++){const d=Math.abs(x+i-bx),up=d<6?(d<3?2:1):0;R(x+i,y+2-up,1,14+up,OL);R(x+i,y+3-up,1,12+up,(i%5)?'#5B9BD5':'#34618f');P1(x+i,y+4-up,(i%5)?'#a8d0f0':'#5B9BD5');R(x+i,y+13,1,2,'#34618f')}
  disc(x+5,y+9,4,7,OL);disc(x+5,y+9,3,6,'#5B9BD5');disc(x+4,y+9,2,5,'#241a2e');disc(x+57,y+9,4,7,OL);disc(x+57,y+9,3,6,'#34618f');disc(x+58,y+9,2,5,'#241a2e')}

/* ---------- 后院 ---------- */
const AUT=['#e0533d','#f08a4a','#e8b83a','#c8402c'];
// 枫树：(x,y) 是树干落地中点，base=y；树冠在上面
function maple(x,y,t){R(x-6,y-46,12,46,OL);R(x-5,y-46,10,45,'#8a5a3a');for(let j=y-44;j<y-2;j+=5)R(x-3+(j%3),j,2,3,'#6a4028');R(x-8,y-4,16,4,OL);R(x-7,y-3,14,2,'#8a5a3a');
  const B=[[0,-66,22,14],[-20,-58,16,12],[20,-58,16,12],[-10,-76,14,10],[12,-76,14,10],[-26,-48,10,8],[26,-48,10,8],[0,-52,18,10]];
  B.forEach(([a,b,rx,ry])=>disc(x+a,y+b,rx+1,ry+1,OL));B.forEach(([a,b,rx,ry],i)=>disc(x+a,y+b,rx,ry,i%3===0?'#e0533d':i%3===1?'#f08a4a':'#d8462e'));
  for(let i=0;i<80;i++){const a=(hsh(i,31)-.5)*62,b=-46-hsh(i,32)*36;P1(x+Math.round(a),y+Math.round(b),i%3?'#f7a58c':'#ffd84a')}
  const sw=Math.sin(t*1.3);P1(x-14+Math.round(sw),y-70,'#ffd84a');P1(x+16-Math.round(sw),y-62,'#ffd84a')}
function leaf(x,y,ci,f=0){const c=AUT[ci%4];if(f%2){R(x,y,2,1,c);P1(x+1,y+1,c)}else{R(x,y,1,2,c);P1(x+1,y,c)}}
// 落叶堆：跳进去叶子炸开。size 0→1 堆的大小。(x,y) 落地中点
function leafPile(x,y,size=1){const w=Math.round(18+size*20),h=Math.round(4+size*6);disc(x,y-Math.round(h/2),Math.round(w/2)+1,Math.round(h/2)+1,'#8a4a2a');
  for(let i=0;i<w*h*.9;i++){const a=(hsh(i,41)-.5)*w,b=(hsh(i,42)-.5)*h;if(a*a/(w*w/4)+b*b/(h*h/4)<=1)P1(x+Math.round(a),y-Math.round(h/2)+Math.round(b),AUT[i%4])}}
function birdBath(x,y){R(x+8,y+6,6,14,OL);R(x+9,y+6,4,14,'#cfc6b8');R(x+5,y+19,12,3,OL);R(x+6,y+19,10,2,'#b4aa9a');disc(x+11,y+4,11,3,OL);disc(x+11,y+4,10,2,'#cfc6b8');disc(x+11,y+3,8,1,'#8fd0ef');P1(x+7,y+3,'#e8f6ff')}   // 22×22，base=y+22，盆沿 y+2
function flowerBed(x,y,w){R(x,y+6,w,6,OL);R(x+1,y+7,w-2,4,'#6a4a30');for(let i=3;i<w-2;i+=5){const h=5+Math.floor(hsh(i,x)*5),c=['#f4a6b8','#fff4dc','#ffd84a','#e88aa0'][i%4];R(x+i,y+7-h,1,h,'#4a8a4e');P1(x+i-1,y+6-h,c);P1(x+i+1,y+6-h,c);P1(x+i,y+5-h,c);P1(x+i,y+7-h,c);P1(x+i,y+6-h,'#e8b83a')}}   // base=y+12
function butterfly(x,y,t,col='#ffd84a'){const f=Math.floor(t*10)%2;if(f){R(x-2,y-1,2,2,col);R(x+1,y-1,2,2,col);P1(x-2,y+1,col);P1(x+2,y+1,col)}else{R(x-1,y-2,1,2,col);R(x+1,y-2,1,2,col)}R(x,y-1,1,3,OL)}
// 猫跑轮：猫在里面跑，轮子转；a 轮子转过的角度。48×50，base=y+50；轮心 (x+24,y+22)，猫脚底 y+42
function catWheel(x,y,a=0){const cx=x+24,cy=y+22;line(cx,cy,x+8,y+49,OL);line(cx,cy,x+40,y+49,OL);line(cx+1,cy,x+9,y+49,'#8a5a3a');line(cx-1,cy,x+39,y+49,'#8a5a3a');R(x+4,y+48,40,2,OL);
  for(let r=19;r<=22;r++)ring(cx,cy,r,r===19||r===22?OL:'#e8dccb');for(let i=0;i<6;i++){const q=a+i*Math.PI/3;line(cx,cy,cx+Math.round(Math.cos(q)*18),cy+Math.round(Math.sin(q)*18),'#c8b89a')}disc(cx,cy,2,2,OL);P1(cx,cy,'#e8b83a')}
// 吊床：back 画柱子和网兜，front 画网兜前沿（猫躺在中间，脚底 y+14）。64×34，base=y+34；sw 摆动 -1..1
const hamSag=(i,sw)=>Math.round(Math.sin((i-4)/56*Math.PI)*(9+sw*2));
function hammockBack(x,y,sw=0){[x,x+60].forEach(px=>{R(px,y,4,34,OL);R(px+1,y,2,33,'#8a5a3a')});for(let i=4;i<60;i++){const s=hamSag(i,sw);R(x+i,y+6+s,1,4,(i%6)<3?'#e8dccb':'#e0533d');P1(x+i,y+5+s,OL);P1(x+i,y+10+s,OL)}}
function hammockFront(x,y,sw=0){for(let i=14;i<50;i++){const s=hamSag(i,sw);R(x+i,y+8+s,1,2,(i%6)<3?'#e8dccb':'#e0533d');P1(x+i,y+10+s,OL)}}
// 串灯：power 0→1 亮几颗（跑轮发电）
function stringLights(x0,x1,y,t,power=0,sag=8){const n=Math.floor((x1-x0)/10);for(let x=x0;x<=x1;x++)P1(x,y+Math.round(Math.sin((x-x0)/(x1-x0)*Math.PI)*sag),OL);
  for(let i=0;i<=n;i++){const x=x0+i*10,yy=y+Math.round(Math.sin((x-x0)/(x1-x0)*Math.PI)*sag)+1,on=i/n<power;R(x,yy,2,3,OL);R(x,yy+1,2,2,on?YARN[i%5][2]:'#6a5a6a');if(on)P1(x,yy+1,'#ffffff')}}
