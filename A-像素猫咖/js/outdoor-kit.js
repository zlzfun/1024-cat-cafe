/* 1024 猫咖 · 屋外的零件：后院的店背面、石板地、河、栈桥、小船、钓竿、木桥、小溪、芦苇；屋顶的瓦、屋脊、烟囱、平台、水塔、楼梯小屋、望远镜、观星毯；
   屋顶的夜空：银河、月亮、星星、流星、天边的屋顶剪影、萤火虫。依赖 scene-kit.js、world-kit.js、house-kit.js。
   约定同前：(x,y) 为左上角，注释里的 base 是落地的 y。 */

/* ---------- 后院 ---------- */
// 店的背面：红砖，几扇窗、窗下的花箱、爬山虎；doors 是门洞 [x,w]（门洞里不画墙）
function facade(x,y,w,h,{wins=[],doors=[]}={}){brickWall(x,y,w,h);wins.forEach(([wx,ww])=>{R(wx-2,y+8,ww+4,22,OL);R(wx,y+10,ww,18,'#f7e4b0');R(wx,y+10,ww,8,'#fff4c8');R(wx+Math.floor(ww/2)-1,y+10,2,18,'#fff4dc');R(wx,y+18,ww,2,'#fff4dc');
    R(wx-3,y+30,ww+6,5,OL);R(wx-2,y+31,ww+4,3,'#8a5a3a');for(let i=wx-1;i<wx+ww+1;i+=3)disc(i,y+29,1,1,['#e0533d','#f4a6b8','#ffd84a','#5ea85e'][Math.floor(hsh(i,9)*4)])});
  doors.forEach(([dx,dw])=>{R(dx,y,dw,h,'#cfc6b8');for(let j=y+2;j<y+h;j+=6)R(dx+1,j,dw-2,1,'#b4aa9a');jamb(dx-3,y,h);jamb(dx+dw,y,h);R(dx-4,y-2,dw+8,3,OL);R(dx-3,y-1,dw+6,1,'#a86e44')});
  [[x+30,26],[x+w-60,30],[x+Math.floor(w*.45),18]].forEach(([ix,l])=>ivy(ix,y+2,l))}
// 石板地（后门外的一小片）
function patio(x,y,w,h){texFill(x,y,w,h,['#cfc6b8','#c4bbac','#b4aa9a','#ddd5c8'],(i,j)=>{const X=i+x,Y=j+y,r=Math.floor(Y/8),u=(X+(r%2)*6)%12,v=Y%8;if(u===0||v===0)return 2;if(u===1&&v===1)return 3;return hsh(Math.floor((X+(r%2)*6)/12),r)<.4?1:0})}
// 小溪的一段：从 (x0,y0) 弯弯地流到 (x1,y1)，宽 w
function brook(pts,w,t){for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y));for(let k=0;k<=n;k++){const px=a.x+(b.x-a.x)*k/n,py=a.y+(b.y-a.y)*k/n;disc(Math.round(px),Math.round(py),Math.ceil(w/2)+1,Math.ceil(w/2),'#5e8a4e')}}
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y));for(let k=0;k<=n;k++){const px=a.x+(b.x-a.x)*k/n,py=a.y+(b.y-a.y)*k/n;disc(Math.round(px),Math.round(py),Math.floor(w/2),Math.floor(w/2)-1,'#6ab0e0')}}}
function brookShine(pts,t){for(let i=0;i<8;i++){const u=((t*.25+i/8)%1)*(pts.length-1),k=Math.floor(u),f=u-k,a=pts[k],b=pts[Math.min(pts.length-1,k+1)];P1(Math.round(a.x+(b.x-a.x)*f),Math.round(a.y+(b.y-a.y)*f),'#e4f6ff')}}
function steppingStone(x,y){disc(x,y,4,2,OL);disc(x,y,3,1,'#b4aa9a');P1(x-1,y-1,'#ddd5c8')}

/* ---------- 河 ---------- */
// 河岸和河床（底图）：(x,y) 左上，w 宽，h 水面高；上下两道岸：草边、几块石头
function riverBed(x,y,w,h){R(x,y,w,h,'#4a8ec8');for(let j=0;j<h;j++){const k=j/h;if(k<.12||k>.88)R(x,y+j,w,1,'#5a9ed4');else if(k>.4&&k<.6)R(x,y+j,w,1,'#4486c0')}
  for(let i=x;i<x+w;i+=2){const a=Math.round(Math.sin(i*.11)*1.5+hsh(i,3)*1.5),b=Math.round(Math.sin(i*.09+2)*1.5+hsh(i,4)*1.5);R(i,y-2+a,2,3,'#5e8a4e');R(i,y+h-1-b,2,3,'#5e8a4e');P1(i,y-3+a,'#7ab86a');P1(i,y+h+1-b,'#7ab86a')}
  for(let i=0;i<w/40;i++){const sx=x+Math.floor(hsh(i,5)*w);disc(sx,y-1,3,2,'#8a8278');disc(sx,y-1,2,1,'#cfc6b8');const sx2=x+Math.floor(hsh(i,6)*w);disc(sx2,y+h,3,2,'#8a8278');disc(sx2,y+h,2,1,'#cfc6b8')}}
// 河面上会动的：一道道往东流的水纹、亮点；night 时颜色暗一点
function riverFlow(x,y,w,h,t){for(let i=0;i<w*h/90;i++){const ly=y+3+Math.floor(hsh(i,11)*(h-6)),sp=10+hsh(i,12)*8,len=4+Math.floor(hsh(i,13)*6),lx=x+((hsh(i,14)*w+t*sp)%w);R(Math.round(lx),ly,len,1,'#7ab8e4')}
  for(let i=0;i<w/14;i++){if((Math.floor(t*2)+i)%5)continue;P1(x+Math.floor(hsh(i,15)*w),y+2+Math.floor(hsh(i,16)*(h-4)),'#e4f6ff')}}
// 睡莲叶、芦苇
function lilyPad(x,y,flower){disc(x,y,4,2,'#3f7a44');disc(x,y,3,1,'#5ea85e');P1(x+3,y,'#4a8ec8');if(flower){P1(x,y-1,'#f4a6b8');P1(x-1,y-1,'#fff4dc');P1(x+1,y-1,'#fff4dc')}}
function reeds(x,y,t,n=4){for(let i=0;i<n;i++){const h=8+Math.floor(hsh(x+i,1)*6),sw=Math.round(Math.sin(t*1.3+i+x*.1));for(let j=0;j<h;j++)P1(x+i*2+(j>h-4?sw:0),y-j,j<h-3?'#4a8a4e':'#6aa84a');R(x+i*2+sw,y-h-2,1,3,'#8a5a3a')}}
// 木桥：南北向跨过河，两边扶手，中间略拱。(x,y) 左上 w×h，base 按两岸
function bridgeDeck(x,y,w,h){R(x-2,y,w+4,h,OL);for(let j=y+1;j<y+h-1;j+=4){R(x,j,w,3,'#b88a5a');R(x,j,w,1,'#d4a874');R(x,j+3,w,1,'#7e5636')}}
function bridgeRail(x,y,h){R(x,y,3,h,OL);R(x+1,y,1,h,'#c49460');for(let j=y;j<=y+h-4;j+=10){R(x-1,j,5,5,OL);R(x,j+1,3,3,'#a8784a')}}
// 栈桥：从岸边伸进河里的木板，底下几根桩子
function pier(x,y,w,h){for(let i=x+2;i<x+w-2;i+=Math.max(6,w-6))R(i,y+h-2,3,8,OL);R(x-1,y,w+2,h,OL);for(let j=y+1;j<y+h-1;j+=4){R(x,j,w,3,'#a8784a');R(x,j,w,1,'#c49460');R(x,j+3,w,1,'#6e4a30')}R(x+w-4,y+h-6,3,9,OL);R(x+1,y+h-6,3,9,OL)}
// 小船：弯弯的木船身，看得见船舱、两条坐板；船舷上一左一右两支桨，船头挑一盏小灯笼，船尾刻着 1024。朝东（船头在右）。
// 60×20，(x,y) 左上，base=y+20，坐板落脚 y+9（x+20、x+40）。rock 摇晃（像素偏移）；oar 0～1 划桨的相位（null 就是桨收着）
function boat(x,y,t,rock=0,oar=null){const dy=Math.round(Math.sin(t*1.6)*rock);y+=dy;
  const top=i=>i>=50?6-Math.round((i-50)/3):6,near=i=>i>=50?12-Math.round((i-50)*.6):i<3?11:12,bot=i=>i>46?18-Math.round((i-46)*.55):i<5?17:18;
  alpha(.3,()=>disc(x+28,y+20,27,2,'#10243c'));
  // 远处那一侧的桨（在船后面）
  const sw=oar==null?0:Math.round(Math.sin(oar*Math.PI*2)*5),lift=oar==null?0:Math.max(0,Math.round(Math.cos(oar*Math.PI*2)*2));
  if(oar!=null){line(x+30,y+7,x+19+sw,y+1-lift,OL);line(x+31,y+7,x+20+sw,y+1-lift,'#c49460');R(x+16+sw,y-1-lift,5,2,OL)}
  for(let i=0;i<60;i++){const a=top(i),n=near(i),b=bot(i),X=x+i;
    P1(X,y+a,OL);P1(X,y+a+1,'#e0b07a');if(n-a>2){R(X,y+a+2,1,n-a-2,(i%9===0)?'#5e3e28':'#6e4a30');if((i+1)%9===0)P1(X,y+a+2,'#8a5a3a')}
    P1(X,y+n-1,'#8a5a3a');P1(X,y+n,'#e8c08a');if(b-n>1){R(X,y+n+1,1,b-n-1,'#a8703f');if(b-n>3)P1(X,y+n+3,'#8a5a3a');if(b-n>5)P1(X,y+n+5,'#93603a')}P1(X,y+b,OL)}
  R(x,y+6,1,12,OL);R(x+1,y+6,1,12,'#8a5a3a');R(x+59,y+3,1,9,OL);
  // 两条坐板
  [20,40].forEach(c=>{R(x+c-4,y+8,9,3,OL);R(x+c-3,y+8,7,2,'#d8a878');R(x+c-3,y+8,7,1,'#f0c890')});
  // 船尾刻的字、船头的绳圈
  txt('1024',x+5,y+13,'#fff4dc');disc(x+52,y+12,1,1,'#d9d2c4');P1(x+52,y+12,'#a8703f');
  // 船头的灯笼
  line(x+56,y+5,x+58,y-5,OL);R(x+57,y-5,4,1,OL);R(x+59,y-4,1,1,OL);R(x+58,y-3,3,4,OL);R(x+59,y-2,1,2,Math.floor(t*5)%7?'#ffd88a':'#fff4c0');
  // 近处这一侧的桨（压在船前面，桨叶在水里）
  if(oar!=null){line(x+30,y+12,x+17-sw,y+22+lift,OL);line(x+31,y+12,x+18-sw,y+22+lift,'#c49460');R(x+14-sw,y+21+lift,6,2,OL);R(x+15-sw,y+21+lift,4,1,'#a8784a');
    if(!lift)alpha(.6,()=>{P1(x+13-sw,y+23,'#cfe8f8');P1(x+20-sw,y+23,'#cfe8f8')})}
  else{line(x+24,y+11,x+44,y+10,OL);R(x+42,y+9,5,2,OL)}}
function boatWake(x,y,t){for(let i=0;i<3;i++){const k=(t*1.2+i/3)%1;alpha(1-k,()=>{R(Math.round(x-6-k*14),y+2+i*3,4,1,'#cfe8f8')})}}
// 钓竿：插在栈桥边；line 线垂到 (bx,by)；bob 浮漂状态 0 漂着 / 1 往下一沉
function rodStand(x,y){R(x,y,2,6,OL);line(x+1,y,x+14,y-20,OL);line(x+2,y,x+15,y-20,'#c49460');P1(x+14,y-21,OL)}
function fishLine(x0,y0,x1,y1){const n=Math.max(2,Math.abs(y1-y0));for(let i=0;i<=n;i++){const k=i/n,px=x0+(x1-x0)*k,py=y0+(y1-y0)*k+Math.sin(k*Math.PI)*3;P1(Math.round(px),Math.round(py),'#e8e0d0')}}
function bobber(x,y,t,dip=0){const d=dip?2:Math.round(Math.sin(t*3));R(x-1,y-2+d,3,2,'#e0533d');R(x-1,y+d,3,1,'#fff4dc');if(!dip&&Math.floor(t*1.5)%3===0){P1(x-3,y+2,'#cfe8f8');P1(x+3,y+2,'#cfe8f8')}if(dip){disc(x,y+3,4,1,'#cfe8f8');disc(x,y+3,3,0,'#4a8ec8')}}
// 鱼桶：钓上来的鱼先放这儿看一眼。12×12，base=y+12
function fishBucket(x,y,n){R(x,y+2,12,10,OL);R(x+1,y+3,10,8,'#8a9aaa');R(x+1,y+3,10,1,'#b8c4d0');R(x+1,y+3,10,2,'#4a8ec8');for(let i=0;i<Math.min(n,3);i++)P1(x+3+i*3,y+4,'#f08a4a');R(x+2,y,8,1,OL)}

/* ---------- 屋顶 ---------- */
// 斜屋顶：一列列筒瓦（亮的一半、暗的一半），一排排往下叠，越往屋檐越暗；顶上一道圆脊瓦，右边一条封檐板。(x,y) 屋脊左端，w 宽，h 往下到屋檐
function roofTiles(x,y,w,h){const rows=Math.ceil(h/9);for(let r=0;r<rows;r++){const yy=y+5+r*9,k=r/rows,hi=k<.3?'#e8906a':k<.7?'#d47a56':'#b8603e',md=k<.3?'#c86a48':k<.7?'#b85a3c':'#9a4a30',dk=k<.3?'#a8503a':k<.7?'#8a3e2a':'#6e3020';
    for(let i=x;i<x+w;i+=8){R(i,yy,8,9,OL);R(i+1,yy,3,8,hi);R(i+4,yy,3,8,md);R(i+1,yy+7,6,1,dk);P1(i+2,yy+1,'#f4b08a')}R(x,yy+8,w,1,'#4a2018')}
  R(x,y,w,7,OL);for(let i=x;i<x+w;i+=6){disc(i+3,y+3,3,3,OL);disc(i+3,y+3,2,2,'#c8603e');P1(i+2,y+2,'#e8906a')}R(x,y+y%1,w,1,'#5a2a20');
  R(x+w-4,y,5,h+4,OL);R(x+w-3,y+1,3,h+2,'#8a5a3a');R(x+w-3,y+1,1,h+2,'#b07a52');R(x,y+h,w,4,OL);R(x+1,y+h,w-2,2,'#5a4a42')}
// 老虎窗：斜屋顶上开的一扇小窗，夜里亮着暖黄的灯。28×30，(x,y) 左上
function dormer(x,y,lit=1){for(let j=0;j<10;j++){const ins=Math.round((10-j)*1.4);R(x+ins-2,y+j,32-ins*2+4,1,j===0?OL:'#8a3e2a')}R(x-3,y+10,34,3,OL);
  R(x,y+12,28,18,OL);R(x+1,y+13,26,17,'#e8dccb');R(x+5,y+15,18,13,OL);R(x+6,y+16,16,11,lit?'#ffd88a':'#2a3060');R(x+13,y+16,2,11,'#e8dccb');R(x+6,y+21,16,1,'#e8dccb');if(lit){R(x+7,y+17,5,3,'#fff4c0')}}
// 烟囱：砖砌，顶上冒一缕烟。20×40，base=y+40
function chimney(x,y,t){R(x-1,y,22,5,OL);R(x,y+1,20,3,'#8a8a96');R(x,y+1,20,1,'#b8b8c0');R(x+1,y+5,18,35,OL);for(let j=y+6,k=0;j<y+39;j+=4,k++)for(let i=x+2-(k%2)*3;i<x+18;i+=6){const a=Math.max(x+2,i),b=Math.min(x+18,i+5);R(a,j,b-a,3,hsh(i,k)<.3?'#a85a48':'#b4654f')}
  for(let i=0;i<5;i++){const k=(t*.25+i/5)%1;alpha(.55*(1-k),()=>disc(Math.round(x+10+Math.sin(k*5+i)*3+k*8),Math.round(y-2-k*36),1+Math.round(k*3),1+Math.round(k*2),'#c8c4d8'))}}
// 屋顶平台的女儿墙：一道矮墙加一排栏杆柱头
function parapet(x,y,w){R(x,y,w,12,OL);R(x,y+1,w,10,'#9a8a7e');R(x,y+1,w,2,'#c8b8aa');for(let i=x+2;i<x+w;i+=9)R(i,y+4,6,5,'#8a7a6e');R(x,y+11,w,2,'#5a4a42')}
// 水塔：铁皮桶架在四根腿上。40×58，base=y+58
function waterTank(x,y){R(x+4,y+30,3,28,OL);R(x+33,y+30,3,28,OL);R(x+14,y+30,2,26,OL);R(x+24,y+30,2,26,OL);line(x+5,y+34,x+34,y+52,OL);line(x+34,y+34,x+5,y+52,OL);
  R(x,y+4,40,28,OL);R(x+1,y+5,38,26,'#7a8a9a');for(let i=x+3;i<x+38;i+=6)R(i,y+5,1,26,'#6a7a8a');R(x+1,y+5,38,2,'#a8b8c8');disc(x+20,y+4,19,4,OL);disc(x+20,y+4,18,3,'#8a9aaa');R(x+19,y-2,2,4,OL)}
// 天线：一根杆子几道横杠
function antenna(x,y,h){R(x,y,2,h,OL);[[0,8],[4,6],[9,4]].forEach(([dy,hw])=>R(x-hw,y+dy,hw*2+2,1,OL));P1(x,y-1,'#e0533d')}
// 楼梯小屋：屋顶上一间小屋，一扇门通到楼下。70×80（含屋顶），门在南面正中，base=y+80
function stairHut(x,y,t){R(x+2,y+14,66,66,OL);R(x+3,y+15,64,64,'#d8c8b0');for(let j=y+18;j<y+78;j+=6)R(x+3,j,64,1,'#c8b89e');R(x+3,y+15,64,2,'#efe2cc');
  for(let j=0;j<16;j++){const ins=Math.round(j*.4);R(x-2+ins,y+j,74-ins*2,1,j===0?OL:j%4===0?'#8a3a2a':'#b85a3c')}R(x-3,y+13,76,3,OL);
  R(x+24,y+44,22,36,OL);R(x+25,y+45,20,35,'#6e4a30');R(x+25,y+45,20,2,'#8a5e3e');R(x+27,y+48,7,12,'#5e3e28');R(x+36,y+48,7,12,'#5e3e28');P1(x+42,y+64,'#ffd84a');
  R(x+8,y+24,14,12,OL);R(x+9,y+25,12,10,'#ffe8a8');R(x+15,y+25,1,10,'#c8a050');R(x+48,y+24,14,12,OL);R(x+49,y+25,12,10,'#ffe8a8');R(x+55,y+25,1,10,'#c8a050');sconce(x+48,y+46,1)}
// 望远镜：三脚架上一根铜管，斜着指天。24×30，base=y+30
function telescope(x,y,t){line(x+12,y+14,x+4,y+30,OL);line(x+12,y+14,x+20,y+30,OL);line(x+12,y+14,x+12,y+30,'#5a5a66');
  for(let i=0;i<20;i++){const px=x+2+i,py=y+18-Math.round(i*.75);R(px,py-2,1,5,OL);R(px,py-1,1,3,i<6?'#8a6a2a':'#c8a050');P1(px,py-1,'#f0d080')}R(x+21,y+1,4,6,OL);R(x+22,y+2,2,4,'#cfe8f8')}
// 观星毯：一块格子毯、一个小枕头，躺着看天。44×20，base=y+20
function blanket(x,y){R(x,y+2,44,18,OL);R(x+1,y+3,42,16,'#5B9BD5');for(let i=x+1;i<x+43;i+=6)R(i,y+3,2,16,'#4a86c0');for(let j=y+5;j<y+19;j+=6)R(x+1,j,42,2,'#7ab0e0');R(x+1,y+3,42,1,'#a8d0f0');
  R(x+3,y,12,7,OL);R(x+4,y+1,10,5,'#fff4dc');R(x+4,y+1,10,1,'#ffffff')}
// 盆栽（屋顶花园）：一盆矮矮的灌木
function potShrub(x,y,col='#5ea85e'){disc(x+6,y+5,7,5,OL);disc(x+6,y+5,6,4,col);P1(x+4,y+3,'#8cd08a');P1(x+8,y+4,'#8cd08a');R(x+1,y+9,10,8,OL);R(x+2,y+10,8,6,'#c46a44');R(x+2,y+10,8,1,'#e08a5a')}   // base=y+17

/* ---------- 屋顶的夜空 ---------- */
const NIGHT=['#060818','#090c22','#0c112c','#111736','#161d42','#1c2350','#232a5c'];
// 天：从上往下一层层变亮，层和层之间一行抖动；银河是一条斜着的亮带，满是密密的小星点
function nightSkyBase(x,y,w,h){const n=NIGHT.length,bh=h/n;for(let i=0;i<n;i++){const y0=Math.round(y+i*bh),y1=Math.round(y+(i+1)*bh);R(x,y0,w,y1-y0,NIGHT[i]);if(i>0)for(let xx=x+(i%2);xx<x+w;xx+=2)P1(xx,y0,NIGHT[i-1])}
  const mw=(i,j)=>{const u=(i-x)/w,v=(j-y)/h,d=v-(.15+u*.55);return Math.exp(-(d*d)/.006)};
  for(let i=0;i<w*h/7;i++){const px=x+Math.floor(hsh(i,201)*w),py=y+Math.floor(hsh(i,202)*h),m=mw(px,py);if(hsh(i,203)>m*.95)continue;P1(px,py,m>.7?'#3a4078':'#2a3064')}
  for(let i=0;i<w*h/40;i++){const px=x+Math.floor(hsh(i,204)*w),py=y+Math.floor(hsh(i,205)*h),m=mw(px,py);if(hsh(i,206)>m)continue;P1(px,py,hsh(i,207)<.5?'#8a90c8':'#b8bce8')}}
// 会闪的星星（亮的几颗画成小十字）
function nightStars(x,y,w,h,t,n=120,seed=0){for(let i=0;i<n;i++){const ph=hsh(i,211+seed);if(Math.floor(t*1.1+ph*7)%9===0)continue;const sx=x+Math.floor(hsh(i,212+seed)*w),sy=y+Math.floor(hsh(i,213+seed)*h),big=hsh(i,214+seed)<.12;
  const col=hsh(i,215+seed)<.15?'#ffe8a8':hsh(i,216+seed)<.3?'#c8d8ff':'#fff8ec';P1(sx,sy,col);if(big){const d='#6a6aa0';P1(sx-1,sy,d);P1(sx+1,sy,d);P1(sx,sy-1,d);P1(sx,sy+1,d);if(Math.floor(t*2+ph*5)%4===0){P1(sx-2,sy,d);P1(sx+2,sy,d)}}}}
// 月亮：一轮满月，有几块坑；cat 时一只猫的影子从月亮前面走过去（望远镜里用）
function moonPx(cx,cy,r){disc(cx,cy,r+2,r+2,'#2a3060');disc(cx,cy,r+1,r+1,'#c8c4b0');disc(cx,cy,r,r,'#fff4dc');disc(cx-Math.round(r*.3),cy-Math.round(r*.2),Math.max(1,Math.round(r*.22)),Math.max(1,Math.round(r*.2)),'#e8dcc0');
  disc(cx+Math.round(r*.35),cy+Math.round(r*.3),Math.max(1,Math.round(r*.18)),Math.max(1,Math.round(r*.15)),'#e8dcc0');disc(cx+Math.round(r*.1),cy-Math.round(r*.5),Math.max(1,Math.round(r*.1)),Math.max(1,Math.round(r*.1)),'#e8dcc0');
  for(let a=0;a<r*3;a++){const q=a/(r*3)*Math.PI*2;if(Math.cos(q-2.3)>.3)P1(Math.round(cx+Math.cos(q)*r),Math.round(cy+Math.sin(q)*r),'#e0d4b8')}}
// 天边：一排高高低低的屋顶剪影，窗户亮着暖黄的灯，远处还有一座塔
function skyline(x,base,w,t){for(let i=0,xx=x;xx<x+w;i++){const bw=14+Math.floor(hsh(i,221)*22),bh=10+Math.floor(hsh(i,222)*34);R(xx,base-bh,bw,bh,'#0c0f22');
    if(hsh(i,223)<.4){for(let j=0;j<Math.floor(bw/4);j++)P1(xx+j*4+1,base-bh-1-((j%2)),'#0c0f22')}else if(hsh(i,224)<.5){const ins=Math.floor(bw/2);for(let j=0;j<5;j++)R(xx+ins-j-1,base-bh-5+j,j*2+2,1,'#0c0f22')}
    for(let r=base-bh+4;r<base-3;r+=5)for(let c=xx+2;c<xx+bw-2;c+=4)if(hsh(c,r)<.28)P1(c,r,(Math.floor(t*.3+hsh(c,r+1)*9)%11)?'#ffd88a':'#6a5a3a');xx+=bw+1}
  R(x+Math.floor(w*.72),base-62,3,62,'#0c0f22');R(x+Math.floor(w*.72)-3,base-48,9,4,'#0c0f22');if(Math.floor(t*1.2)%2)P1(x+Math.floor(w*.72)+1,base-63,'#e0533d')}
// 流星：k 0→1 划过去
function shootingStar(x,y,dx,dy,k){const L=12;for(let i=0;i<L;i++){const u=k-i*.02;if(u<0)break;const px=Math.round(x+dx*u),py=Math.round(y+dy*u);P1(px,py,i<2?'#ffffff':i<5?'#fff4c0':'#8a8ac8')}}
// 萤火虫：一个暖黄的小点，一闪一闪
function firefly(x,y,t,ph){const on=(Math.sin(t*3+ph*7)+1)/2;if(on<.15)return;P1(x,y,on>.6?'#fffbd0':'#e8f070');if(on>.6){P1(x-1,y,'#a8b840');P1(x+1,y,'#a8b840')}}
// 灌木丛：几团圆圆的叶子。(x,y) 底边中点，s 大小（1 小、2 大），base=y
function bush(x,y,s=1,col=['#3f7a44','#5ea85e','#8cd08a']){const L=s>1?[[0,-7,9,6],[-8,-4,6,4],[8,-4,6,4],[-3,-11,5,4],[5,-10,5,4]]:[[0,-5,6,4],[-5,-3,4,3],[5,-3,4,3]];
  L.forEach(([a,b,rx,ry])=>disc(x+a,y+b,rx+1,ry+1,OL));L.forEach(([a,b,rx,ry],i)=>{disc(x+a,y+b,rx,ry,i%2?col[0]:col[1]);P1(x+a-1,y+b-1,col[2]);P1(x+a+1,y+b-2,col[2])})}
// 一棵圆冠的小树（从上往下看）：树干一小截，一团冠。(x,y) 树根，base=y
function roundTree(x,y,col=['#2f6a3c','#4a8a4e','#6aa84a']){R(x-2,y-10,5,10,OL);R(x-1,y-10,3,9,'#8a5a3a');const L=[[0,-22,13,10],[-9,-16,8,6],[9,-16,8,6],[0,-30,8,6]];
  L.forEach(([a,b,rx,ry])=>disc(x+a,y+b,rx+1,ry+1,OL));L.forEach(([a,b,rx,ry],i)=>disc(x+a,y+b,rx,ry,i%2?col[0]:col[1]));[[-4,-26],[3,-24],[-7,-19],[6,-30]].forEach(([a,b])=>disc(x+a,y+b,2,1,col[2]))}
// 野餐垫上一只小篮子（后院的摆设）
function picnic(x,y){R(x,y,30,16,OL);R(x+1,y+1,28,14,'#e8dccb');for(let i=x+1;i<x+29;i+=6)R(i,y+1,3,14,'#e0533d');for(let j=y+1;j<y+15;j+=6)R(x+1,j,28,3,'#e0533d');R(x+1,y+1,28,14,'#e0533d22')}
