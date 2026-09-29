/* 1024 猫咖 · 进店第二步（第一次来的猫）：一段 Clowder AI 网页的动画。
   首页的对话里几只店猫在说"店里今天要来一只新猫" → 光标点左下角"设置" → 成员与运行时 → "+ 添加成员" → 在"角色描述"里敲下"1024 猫咖的新猫"
   → 点进"名称"那一格：整个页面一步步变成像素、换成店里的调色板，别的东西一块块暗下去，只剩"名称"这一格挪到正中，变成给你的猫取名字的输入框。
   界面照 Clowder AI 的 web 端画（packages/web 浅色主题的布局、颜色、文案），logo 用它的 SVG 路径；人类不出场，对话里只有猫。
   CW.play(canvas, {skip}) → Promise：结束时画面只剩那一格，位置由 CW.fieldRect(w,h) 给出（和取名表单的输入框对齐）。 */
const CW=(()=>{
const LOGO=["M1686 5315 c-137 -28 -256 -110 -256 -174 0 -47 49 -93 130 -120 136 -45 215 -142 214 -261 0 -73 -18 -105 -119 -223 -229 -267 -389 -599 -459 -949 -95 -473 -18 -961 220 -1391 441 -797 1334 -1214 2219 -1036 235 48 519 164 721 297 521 343 872 914 935 1521 23 225 -3 376 -73 409 -45 21 -72 0 -110 -86 -18 -42 -54 -109 -79 -149 -26 -40 -52 -94 -59 -121 -7 -26 -15 -49 -16 -51 -2 -2 -13 8 -24 22 -29 37 -74 62 -175 97 -49 18 -112 45 -140 61 -63 35 -90 37 -111 4 -24 -36 -10 -111 39 -208 32 -64 62 -103 152 -196 62 -64 120 -131 130 -150 44 -87 25 -225 -55 -386 -107 -217 -284 -385 -491 -468 -104 -42 -227 -49 -213 -13 7 19 27 26 98 36 80 12 86 21 46 66 -43 50 -60 93 -60 155 0 126 95 195 170 124 28 -26 32 -28 46 -13 23 23 5 51 -50 78 -77 37 -152 5 -198 -84 -30 -57 -30 -155 0 -215 12 -25 22 -48 22 -52 0 -4 -15 -10 -34 -13 -42 -8 -96 -56 -96 -85 0 -12 11 -33 25 -46 20 -21 34 -25 82 -25 338 1 757 430 780 800 8 133 -12 174 -151 315 -82 82 -122 132 -148 182 -39 73 -63 147 -53 163 3 5 29 -3 59 -20 29 -17 84 -41 122 -54 39 -13 83 -30 100 -39 35 -18 84 -70 110 -115 23 -40 58 -41 62 -2 9 89 29 148 75 223 27 45 61 109 74 142 14 33 31 66 39 74 12 13 16 9 33 -30 28 -63 34 -157 21 -294 -46 -477 -251 -910 -594 -1250 -314 -311 -673 -495 -1121 -571 -140 -24 -464 -24 -595 -1 -526 95 -952 340 -1263 727 -624 775 -608 1840 38 2594 93 108 114 149 121 229 14 150 -79 266 -269 337 -32 12 -62 31 -68 43 -10 18 -7 25 28 57 47 45 129 77 232 91 139 20 308 -4 561 -81 207 -63 264 -69 402 -41 283 59 306 62 488 68 327 10 579 -35 868 -157 330 -140 567 -337 683 -569 45 -90 65 -171 75 -296 4 -49 13 -102 20 -116 15 -29 62 -73 155 -143 82 -62 129 -123 136 -176 l6 -40 -50 0 c-128 0 -388 135 -525 272 -46 46 -78 92 -118 168 -30 58 -70 122 -88 142 -37 41 -90 63 -128 54 -37 -10 -74 -54 -74 -87 0 -34 0 -34 -71 -12 -80 25 -219 23 -289 -5 -97 -38 -194 -135 -259 -258 l-32 -61 -102 -7 c-56 -3 -156 -17 -222 -31 -65 -13 -120 -23 -121 -22 -1 1 2 27 8 57 22 121 -12 214 -91 248 -33 14 -44 13 -121 -2 -232 -47 -463 -178 -655 -371 -121 -121 -198 -228 -275 -379 -97 -191 -151 -390 -171 -624 -37 -447 110 -860 408 -1142 147 -139 279 -197 425 -187 256 17 414 249 339 497 -19 62 -31 81 -79 129 -61 61 -128 91 -203 91 -109 0 -178 -90 -116 -148 22 -20 30 -22 95 -16 58 6 76 4 97 -10 80 -53 68 -224 -22 -307 -52 -49 -89 -61 -168 -57 -62 3 -80 8 -131 40 -52 32 -61 42 -78 89 -26 75 -27 242 -2 323 39 131 126 253 228 321 67 45 97 75 108 111 10 28 8 41 -11 81 -18 41 -22 69 -24 181 l-3 132 35 -31 c32 -27 41 -30 72 -24 20 4 63 10 96 14 55 6 61 9 91 48 l32 42 12 -52 c7 -29 23 -78 36 -109 29 -70 30 -93 4 -158 -27 -68 -25 -94 11 -192 45 -120 47 -193 14 -353 -46 -219 -33 -353 39 -400 31 -20 33 -40 7 -55 -22 -11 -45 -5 -80 22 -18 14 -27 15 -37 7 -20 -16 -17 -27 12 -54 54 -50 155 -37 171 23 11 40 6 53 -40 100 -42 42 -42 44 -45 126 -3 61 3 117 23 216 36 175 32 268 -15 388 l-33 83 23 74 c25 81 23 140 -6 197 -9 17 -25 68 -36 112 -30 127 -52 135 -114 41 -36 -54 -37 -55 -86 -55 -27 0 -58 -5 -69 -10 -16 -9 -29 -4 -76 30 -31 22 -62 40 -69 40 -25 0 -36 -39 -29 -98 4 -32 7 -97 6 -145 -1 -70 3 -96 19 -127 38 -75 31 -91 -80 -170 -174 -124 -269 -329 -256 -552 3 -54 3 -98 1 -98 -15 0 -113 145 -150 221 -148 308 -137 694 30 1046 113 239 326 457 580 594 81 44 257 120 263 114 5 -5 -47 -130 -79 -192 -34 -65 -36 -82 -8 -117 25 -31 76 -35 160 -10 173 52 342 183 450 350 l44 67 106 -7 c263 -16 560 -96 844 -228 355 -165 480 -195 590 -140 79 39 105 84 107 194 2 128 -31 181 -187 298 -52 39 -101 83 -109 98 -7 15 -17 69 -21 121 -9 120 -26 186 -76 291 -86 181 -248 347 -459 470 -486 284 -1035 365 -1570 233 -162 -40 -239 -37 -425 20 -82 25 -193 56 -245 67 -123 28 -318 35 -414 15z m2637 -1054 c19 -21 57 -81 83 -132 61 -117 143 -206 272 -293 155 -104 361 -186 435 -172 20 4 27 1 27 -10 0 -32 -32 -75 -72 -95 -35 -18 -54 -21 -122 -17 -97 6 -160 27 -381 131 -327 153 -621 237 -892 254 l-102 6 31 61 c17 34 57 87 92 122 79 79 149 108 256 107 72 -1 101 -8 249 -61 57 -21 76 -20 85 4 4 10 -7 22 -29 35 -60 35 -56 99 5 99 19 0 38 -12 63 -39z m-1336 -147 c36 -23 47 -86 32 -178 l-14 -79 -117 -47 c-211 -85 -370 -185 -513 -322 -172 -164 -282 -336 -354 -553 -149 -448 -61 -917 223 -1182 125 -118 197 -154 307 -156 148 -3 264 106 277 259 7 88 -4 129 -44 173 -42 48 -98 65 -163 50 -47 -10 -66 -3 -56 24 7 17 55 37 91 37 46 0 132 -41 164 -77 54 -61 73 -117 74 -213 1 -67 -4 -95 -21 -132 -32 -70 -94 -131 -166 -164 -53 -24 -74 -28 -147 -28 -101 0 -154 19 -259 89 -167 112 -329 337 -416 575 -52 145 -66 231 -72 440 -5 169 -2 211 16 319 38 225 137 469 259 641 57 80 196 226 278 291 133 106 313 196 479 240 73 19 105 18 142 -7z m483 -241 c0 -5 -12 -26 -28 -49 -100 -148 -240 -256 -396 -303 -74 -23 -112 -26 -121 -11 -3 5 14 49 38 97 25 48 53 113 62 145 18 56 18 56 74 72 122 34 371 66 371 49z", "M3193 3208 c-8 -13 -25 -233 -25 -324 0 -35 8 -67 26 -102 14 -28 26 -60 26 -70 0 -11 -15 -52 -34 -93 -71 -155 -72 -248 -1 -514 25 -93 48 -202 51 -241 6 -63 4 -78 -20 -129 -31 -68 -32 -85 -8 -115 41 -51 147 -29 187 40 22 38 25 114 15 355 -4 106 2 155 20 155 17 0 21 -63 15 -245 -8 -216 -2 -259 45 -299 58 -49 144 -43 169 11 10 21 8 34 -14 80 -38 85 -34 145 26 379 44 168 52 214 53 294 1 100 -7 132 -55 236 -35 74 -36 88 -4 156 25 52 25 56 19 223 -4 94 -11 180 -15 193 -13 35 -45 26 -104 -29 l-54 -51 -82 0 -81 0 -52 51 c-51 50 -87 64 -103 39z m94 -100 l43 -42 102 0 103 -1 43 44 c23 24 44 42 46 40 2 -2 6 -69 9 -149 7 -141 6 -146 -19 -200 -35 -74 -32 -110 13 -205 34 -72 38 -89 41 -177 4 -90 1 -112 -46 -300 -66 -264 -70 -297 -42 -373 11 -33 23 -67 26 -76 8 -22 -19 -30 -57 -17 -55 19 -61 51 -53 286 7 224 3 249 -41 278 -25 16 -27 16 -53 -3 -46 -34 -55 -93 -41 -275 12 -161 8 -216 -17 -256 -20 -30 -59 -45 -84 -32 -18 10 -18 12 5 63 39 82 34 151 -24 385 -28 108 -53 226 -57 262 -8 78 11 160 56 249 37 75 39 125 5 190 -25 47 -25 51 -19 200 4 83 10 151 13 151 3 0 24 -19 48 -42z", "M3823 3112 c-14 -9 -33 -78 -33 -123 0 -20 -7 -56 -15 -79 -22 -62 -19 -122 10 -190 l25 -60 -31 -97 c-42 -131 -43 -201 -1 -348 57 -197 53 -306 -14 -386 -39 -47 -44 -85 -15 -120 15 -19 28 -23 61 -23 102 3 175 161 168 365 -3 76 -5 84 -23 84 -18 0 -21 -9 -26 -105 -7 -113 -20 -173 -50 -233 -21 -40 -57 -64 -83 -54 -23 9 -20 22 15 62 69 79 76 196 24 399 -44 170 -45 226 -5 346 17 50 30 100 30 111 0 11 -11 45 -25 75 -29 63 -31 95 -10 154 8 23 15 60 15 80 0 68 8 73 48 28 32 -35 40 -39 71 -35 20 3 58 0 85 -5 47 -10 49 -9 85 26 l38 37 6 -121 c7 -116 6 -123 -18 -168 -45 -84 -29 -145 52 -205 63 -46 165 -153 187 -196 52 -100 69 -206 54 -333 -8 -66 -7 -93 1 -101 21 -21 40 16 52 98 28 201 -37 381 -183 508 -152 131 -156 138 -113 210 13 23 24 58 25 77 1 72 -9 261 -15 280 -10 31 -41 24 -89 -20 l-44 -40 -73 6 c-70 7 -76 9 -107 46 -39 44 -63 60 -79 50z"];
const K={rail:'#eae4da',side:'#f3eee6',chat:'#fefbf8',card:'#fefdfb',acc:'#b0540e',acc50:'#fff0e5',acc100:'#ffe4d3',acc700:'#6a1c00',ink:'#181515',ink2:'#585454',mute:'#777373',line:'#cec9c8',line2:'#e6e2e1',hover:'#eee2d5',act:'#ead8c8'};
const CATS={宪宪:{c:'#9B7EBD',l:'#d4c7e5',breed:'布偶猫',id:'opus',body:'#f3ece2',pt:'#8c7a70',eye:'#4a7fd0',corner:'bl'},砚砚:{c:'#5B8C5A',l:'#bed5bd',breed:'缅因猫',id:'codex',body:'#9a8a70',pt:'#62533f',eye:'#c8a040',corner:'br',mono:1},
  烁烁:{c:'#5B9BD5',l:'#b5d1ed',breed:'暹罗猫',id:'gemini',body:'#f1e4c8',pt:'#5a4436',eye:'#4a7fd0',corner:'tr'},小狸花:{c:'#D4A76A',l:'#dfcab0',breed:'狸花猫',id:'glm52',body:'#b99a6c',pt:'#6a5236',eye:'#7a9a3a',corner:'tl'},
  斑斑:{c:'#D4853A',l:'#ebc6a7',breed:'孟加拉猫',id:'antigravity',body:'#e3a456',pt:'#8a4f1e',eye:'#7a9a3a',corner:'tl'},金哥:{c:'#C8A951',l:'#dbcda8',breed:'金渐层',id:'opencode',body:'#dcb46c',pt:'#c49a50',eye:'#3a7a5a',corner:'tl'}};
const FF='Inter,-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif',MONO='ui-monospace,"JetBrains Mono",Menlo,monospace';
const ease=k=>k<0?0:k>1?1:k<.5?2*k*k:1-(-2*k+2)**2/2,cl=(k)=>k<0?0:k>1?1:k,lerp=(a,b,k)=>a+(b-a)*k,seg=(t,a,b)=>cl((t-a)/(b-a));
const now=new Date(),MD=String(now.getMonth()+1).padStart(2,'0')+'/'+String(now.getDate()).padStart(2,'0');
const MSGS=[{who:'斑斑',t:'早～今天的咖啡豆到了 ☕',at:-1,time:'08:30'},{who:'宪宪',t:'店里今天要来一只新猫。',at:.35,time:'10:24'},{who:'砚砚',t:'先在成员里登记一下，名字别和别的猫重了。',at:1.15,time:'10:24'},{who:'烁烁',t:'我去把欢迎横幅挂上 ✨',at:1.95,time:'10:25'}];
// 时间轴（秒）
const T={gear0:2.1,gear1:2.75,click1:2.8,set:2.85,add0:3.2,add1:3.7,click2:3.75,modal:3.8,role0:4.2,role1:4.55,click3:4.6,type0:4.7,name0:5.55,name1:5.95,click4:6,px:6.25,end:8.5};
const ROLE='1024 猫咖的新猫';

/* ---------- 画图小工具 ---------- */
let X;const font=(w,s,f=FF)=>X.font=`${w} ${s}px ${f}`;
function rr(x,y,w,h,r,fill,stroke,lw=1){X.beginPath();const R=Array.isArray(r)?r:[r,r,r,r];if(X.roundRect)X.roundRect(x,y,w,h,R);else X.rect(x,y,w,h);if(fill){X.fillStyle=fill;X.fill()}if(stroke){X.lineWidth=lw;X.strokeStyle=stroke;X.stroke()}}
function tx(s,x,y,col,w=400,sz=14,al='left',f=FF){font(w,sz,f);X.fillStyle=col;X.textAlign=al;X.textBaseline='middle';X.fillText(s,x,y)}
const tw=(s,w=400,sz=14,f=FF)=>{font(w,sz,f);return X.measureText(s).width};
function ln(pts,col,lw=1.6){X.beginPath();pts.forEach(([a,b],i)=>i?X.lineTo(a,b):X.moveTo(a,b));X.strokeStyle=col;X.lineWidth=lw;X.lineCap='round';X.lineJoin='round';X.stroke()}
function circ(x,y,r,fill,stroke,lw=1.6){X.beginPath();X.arc(x,y,r,0,Math.PI*2);if(fill){X.fillStyle=fill;X.fill()}if(stroke){X.strokeStyle=stroke;X.lineWidth=lw;X.stroke()}}
// 头像：猫色一圈描边，里面一张简笔猫脸（原版是画的头像图）
function avatar(x,y,r,name){const c=CATS[name];circ(x,y,r,c.l);circ(x,y,r-1,null,c.c,2);const s=r/16;
  X.fillStyle=c.body;[-1,1].forEach(d=>{X.beginPath();X.moveTo(x+d*9*s,y-2*s);X.lineTo(x+d*8.5*s,y-11*s);X.lineTo(x+d*3*s,y-6*s);X.fill()});
  X.beginPath();X.ellipse(x,y+2*s,9.5*s,8*s,0,0,Math.PI*2);X.fill();
  if(c.pt){X.fillStyle=c.pt;X.globalAlpha=name==='宪宪'||name==='烁烁'?.55:.35;X.beginPath();X.ellipse(x,y+3.5*s,4.5*s,4*s,0,0,Math.PI*2);X.fill();X.globalAlpha=1}
  X.fillStyle=c.eye;[-1,1].forEach(d=>{X.beginPath();X.arc(x+d*3.6*s,y+.5*s,1.3*s,0,Math.PI*2);X.fill()})}
function logo(x,y,h){X.save();X.translate(x,y);X.scale(h/640,h/640);X.translate(0,640);X.scale(.1,-.1);const g=X.createLinearGradient(0,6400,6400,0);g.addColorStop(0,'#2563EB');g.addColorStop(.5,'#D97706');g.addColorStop(1,'#7C3AED');X.fillStyle=g;LOGO.forEach(d=>X.fill(new Path2D(d)));X.restore()}
// 左侧图标栏里的线条小图标
const ICON={chat:(x,y,c)=>{rr(x-8,y-7,16,12,4,null,c,1.6);ln([[x-3,y+5],[x-5,y+9],[x+1,y+5]],c)},planet:(x,y,c)=>{circ(x,y,6,null,c);X.beginPath();X.ellipse(x,y,11,3.5,-.4,0,Math.PI*2);X.strokeStyle=c;X.stroke()},
  mem:(x,y,c)=>{rr(x-7,y-8,14,16,2,null,c);ln([[x-3,y-3],[x+3,y-3]],c);ln([[x-3,y+1],[x+3,y+1]],c)},net:(x,y,c)=>{[[0,-6],[-6,5],[6,5]].forEach(([a,b])=>circ(x+a,y+b,2.2,null,c));ln([[x,y-4],[x-5,y+3]],c);ln([[x,y-4],[x+5,y+3]],c)},
  hub:(x,y,c)=>{circ(x,y,7.5,null,c);circ(x,y,3.5,null,c)},flag:(x,y,c)=>{ln([[x-6,y+8],[x-6,y-8]],c);ln([[x-6,y-7],[x+6,y-5],[x-6,y+1]],c)},
  ok:(x,y,c)=>{rr(x-7,y-7,14,14,3,null,c);ln([[x-3,y],[x-1,y+3],[x+4,y-3]],c)},bell:(x,y,c)=>{ln([[x-6,y+4],[x-5,y-2],[x-3,y-6],[x,y-7],[x+3,y-6],[x+5,y-2],[x+6,y+4],[x-6,y+4]],c);ln([[x-1,y+7],[x+1,y+7]],c)},
  ball:(x,y,c)=>{circ(x,y+1,6.5,null,c);ln([[x-5,y-3],[x-5,y-8],[x-2,y-5]],c);ln([[x+5,y-3],[x+5,y-8],[x+2,y-5]],c)},moon:(x,y,c)=>{X.beginPath();X.arc(x,y,7,.9,Math.PI*2-.9+Math.PI,false);X.strokeStyle=c;X.lineWidth=1.6;X.stroke();circ(x+3,y-2,5,null,c)},
  gear:(x,y,c)=>{for(let i=0;i<8;i++){const a=i*Math.PI/4;ln([[x+Math.cos(a)*6.5,y+Math.sin(a)*6.5],[x+Math.cos(a)*9,y+Math.sin(a)*9]],c,2.2)}circ(x,y,6.5,null,c);circ(x,y,2.5,null,c)}};
const RAIL=['chat','planet','mem','net','hub','flag'],RAIL2=['ok','bell','ball','moon','gear'];
const railY=(i,h)=>i<6?18+20+i*48:h-18-20-(4-(i-6))*48;

/* ---------- 左侧图标栏（52px） ---------- */
function rail(h,active){R0(0,0,52,h,K.rail);[...RAIL,...RAIL2].forEach((k,i)=>{const y=railY(i,h),on=(active==='chat'&&i===0)||(active==='gear'&&k==='gear');
  if(on){X.save();X.shadowColor='rgba(0,0,0,.08)';X.shadowBlur=6;X.shadowOffsetY=1;rr(6,y-20,40,40,10,K.chat);X.restore()}ICON[k](26,y,on?K.ink:K.ink2)})}
function star(x,y,r,c){X.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;X.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}X.closePath();X.fillStyle=c;X.fill()}
function R0(x,y,w,h,c){X.fillStyle=c;X.fillRect(x,y,w,h)}

/* ---------- 首页：对话列表 + 大厅 ---------- */
const THREADS=[{t:'大厅',cats:['宪宪','砚砚','烁烁'],time:'刚刚',on:1},{t:'1024 猫咖开张准备',cats:['斑斑','金哥'],time:'10:24'},{t:'毛线球分拣规则讨论',cats:['砚砚'],time:'昨天'},{t:'巨树挂件清单',cats:['小狸花','烁烁'],time:MD},{t:'未命名对话',cats:[],time:MD}];
function sidebar(h){const x0=52,w=240;R0(x0,0,w,h,K.side);tx('对话',x0+16,30,K.ink,600,14);
  const bw=tw('+ 新对话',600,12)+20;rr(x0+w-16-bw,17,bw,26,8,K.acc);tx('+ 新对话',x0+w-16-bw/2,30,'#fff',600,12,'center');circ(x0+w-28-bw,30,9,K.acc50);star(x0+w-28-bw,30,4.5,K.acc);
  rr(x0+12,54,w-24,32,8,K.card,K.line2);circ(x0+28,70,4.5,null,K.mute,1.3);ln([[x0+31,73],[x0+34,76]],K.mute,1.3);tx('搜索对话、项目或 ID...',x0+40,70,K.mute,400,12);
  let tx0=x0+14;['置顶','最近','项目','系统','收藏'].forEach((s,i)=>{const on=i===1,ww=tw(s,on?600:400,12);tx(s,tx0,106,on?K.acc:K.ink2,on?600:400,12);if(on)R0(tx0,117,ww,2,K.acc);tx0+=ww+16});R0(x0+12,119,w-24,1,K.line2);
  tx(`${THREADS.length} 个对话`,x0+14,136,K.mute,400,11);
  THREADS.forEach((th,i)=>{const y=150+i*62;if(th.on)rr(x0+8,y,w-16,56,12,K.act);tx(th.t,x0+20,y+18,K.ink,th.on?600:400,14);
    if(th.cats.length)th.cats.forEach((c,j)=>{circ(x0+28+j*13,y+40,8,CATS[c].l);circ(x0+28+j*13,y+40,7.5,null,CATS[c].c,1.5)});else tx('🐾 还没有猫猫加入',x0+20,y+40,K.mute,400,11);
    tx(th.time,x0+w-20,y+40,K.mute,400,10,'right')});
  R0(x0,h-44,w,1,K.line2);tx('回收站 (0)',x0+36,h-22,K.ink2,400,12);rr(x0+16,h-28,12,13,2,null,K.ink2,1.3)}
function wrap(s,maxW,sz,f){const out=[];let cur='';for(const ch of s){if(tw(cur+ch,400,sz,f)>maxW&&cur){out.push(cur);cur=ch}else cur+=ch}if(cur)out.push(cur);return out}
function chat(w,h,t){const x0=292,cw=w-x0;R0(x0,0,cw,h,K.chat);
  ln([[x0+20,32],[x0+34,32]],K.ink2,1.8);ln([[x0+20,38],[x0+34,38]],K.ink2,1.8);ln([[x0+20,44],[x0+34,44]],K.ink2,1.8);
  logo(x0+44,14,48);tx('Clowder AI',x0+98,31,K.ink,700,18);tx('大厅 · Your AI team collaboration space',x0+98,52,K.ink2,400,12);
  circ(w-36,38,16,K.card,K.line2,1);rr(w-43,31,14,14,3,null,K.ink2,1.4);ln([[w-38,31],[w-38,45]],K.ink2,1.4);
  let y=96;const mw=Math.min(560,cw*.7);
  for(const m of MSGS){if(t<m.at)break;const c=CATS[m.who],k=m.at<0?1:ease(seg(t,m.at,m.at+.25)),sz=14,f=c.mono?MONO:FF,lines=wrap(m.t,mw-32,sz,f),bw=Math.max(...lines.map(l=>tw(l,400,sz,f)))+32,bh=lines.length*22+22;
    X.save();X.globalAlpha=k;X.translate(0,(1-k)*8);avatar(x0+32,y+16,16,m.who);tx(m.who,x0+58,y+6,'rgba(24,21,21,.8)',600,12);tx(MD+' '+m.time,x0+62+tw(m.who,600,12),y+6,K.mute,400,11);
    const cr={tl:[4,16,16,16],tr:[16,4,16,16],br:[16,16,4,16],bl:[16,16,16,4]}[c.corner];rr(x0+58,y+18,bw,bh,cr,c.l);lines.forEach((l,i)=>tx(l,x0+74,y+40+i*22,'#26201f',400,sz,'left',f));X.restore();
    y+=bh+40}
  const typing=MSGS.find(m=>m.at>0&&t>m.at-.4&&t<m.at);
  // 输入框
  const iy=h-62;circ(x0+34,iy+20,17,K.chat,K.line2,1);ln([[x0+28,iy+20],[x0+40,iy+20]],K.ink2);ln([[x0+34,iy+14],[x0+34,iy+26]],K.ink2);
  rr(x0+58,iy,cw-120,40,12,K.card,K.line2);tx('输入消息... (@ 召唤猫猫 · /thread 引用对话)',x0+74,iy+20,K.mute,400,13);
  rr(w-50,iy+11,8,13,4,null,K.ink2,1.5);X.beginPath();X.arc(w-46,iy+22,7,.2,Math.PI-.2);X.strokeStyle=K.ink2;X.stroke();
  if(typing){tx('猫猫正在回复中...',x0+60,iy-14,K.mute,400,12);[0,1,2].forEach(i=>circ(x0+172+i*7,iy-14,2,Math.floor(t*6+i)%3===0?K.ink2:K.line))}
  // 右下角的猫猫球
  const bx=w-48,by=h-110;X.save();X.shadowColor='rgba(0,0,0,.12)';X.shadowBlur=10;X.shadowOffsetY=3;circ(bx,by,22,'#fff4e8');X.restore();circ(bx,by,22,null,'#e8d4c0',1);
  X.fillStyle='#fff4e8';[-1,1].forEach(d=>{X.beginPath();X.moveTo(bx+d*16,by-12);X.lineTo(bx+d*14,by-27);X.lineTo(bx+d*5,by-20);X.fill()});X.fillStyle='#3a2630';[-1,1].forEach(d=>circ(bx+d*7,by-1,2.2,'#3a2630'));circ(bx,by+5,1.4,'#e27a8f')}

/* ---------- 设置 → 成员与运行时 ---------- */
const NAV=['成员与运行时','能力画像来源','账户与密钥','IM 对接','Skill 管理','MCP 管理','插件集成','能力市场','猫猫球','语音管理','系统配置','协作与规则','通知','运维监控'];
function addBtn(w){const s='+ 添加成员',bw=tw(s,600,13)+28;return{x:w-40-bw,y:34,w:bw,h:32}}
function settings(w,h){const x0=52;R0(x0,0,220,h,K.side);tx('设置',x0+20,34,K.ink,700,18);
  NAV.forEach((s,i)=>{const y=62+i*36;if(i===0)rr(x0+10,y,200,32,8,K.act);rr(x0+22,y+10,12,12,3,null,i===0?'#9B7EBD':K.ink2,1.4);tx(s,x0+44,y+16,i===0?K.ink:K.ink2,i===0?600:400,13)});
  const cx=272;R0(cx,0,w-cx,h,K.chat);tx('成员与运行时',cx+36,48,K.ink,800,24);tx('成员名册、runtime 结构配置，以及只读路由账本。',cx+36,80,K.ink2,400,14);
  const b=addBtn(w);rr(b.x,b.y,b.w,b.h,16,K.acc);tx('+ 添加成员',b.x+b.w/2,b.y+16,'#fff',600,13,'center');
  tx('全部 · 已启用 · 已停用 · CLI（OAuth） · CLI（配置）',b.x-16,b.y+16,K.mute,400,12,'right');
  const gw=w-cx-72;rr(cx+36,112,gw,64,12,K.card,K.line2);tx('全局默认猫',cx+56,134,K.ink,600,14);tx('新 thread 没有历史时，默认由这只猫回复',cx+56,156,K.mute,400,12);
  rr(cx+36+gw-170,128,150,32,10,K.side,K.line2);avatar(cx+36+gw-150,144,10,'宪宪');tx('布偶猫 · 宪宪',cx+36+gw-134,144,K.ink,400,13);
  const cols=gw>700?2:1,cw2=(gw-(cols-1)*14)/cols;Object.keys(CATS).forEach((n,i)=>{const c=CATS[n],x=cx+36+(i%cols)*(cw2+14),y=192+Math.floor(i/cols)*84;rr(x,y,cw2,72,12,K.card,K.line2);
    tx('⠿',x+16,y+36,K.line,400,14);avatar(x+48,y+36,16,n);tx(c.breed+' · '+n,x+74,y+26,K.ink,600,14);tx(c.id,x+74,y+48,K.mute,400,12,'left',MONO);
    const aw=tw('@'+n,400,11)+14;rr(x+80+tw(c.id,400,12,MONO),y+40,aw,17,9,K.acc50);tx('@'+n,x+87+tw(c.id,400,12,MONO),y+48,K.acc,400,11);
    rr(x+cw2-128,y+26,48,20,10,'#e3f1e6');tx('已启用',x+cw2-104,y+36,'#3f8552',600,11,'center');rr(x+cw2-70,y+26,34,20,10,K.acc);circ(x+cw2-46,y+36,7,'#fff');
    rr(x+cw2-26,y+29,10,12,2,null,K.mute,1.3)});
  tx('按住 ⠿ 拖动卡片可自由排序；点击卡片进入成员配置 →',cx+36,h-28,K.mute,400,12)}

/* ---------- 添加成员（弹窗） ---------- */
function modalBox(w,h){const mw=Math.min(720,w-80),mh=Math.min(h*.88,h-40);return{x:Math.round((w-mw)/2),y:Math.round((h-mh)/2),w:mw,h:mh}}
const FIELDS=[['名称*','成员显示名称，如 我的助手'],['昵称','可选，co-creator给的昵称'],['显示后缀','如 GPT-5.5 / Opus 4.7'],['角色描述*','角色定位，如 代码审查专家'],['Avatar',''],['Background Color',''],['擅长领域','如 架构设计、安全分析'],['性格特征','如 温柔但有主见'],['注意事项','可选，留空表示无特殊注意']];
function fieldRows(m){const cx=m.x+28,cw=m.w-56,y0=m.y+212;return FIELDS.map((f,i)=>({label:f[0],ph:f[1],lx:cx+18,x:cx+168,y:y0+30+i*46,w:cw-186,h:34}))}
function modal(w,h,t,{role='',focus=-1,skipName=false}={}){const m=modalBox(w,h);X.save();X.shadowColor='rgba(43,33,26,.13)';X.shadowBlur=48;X.shadowOffsetY=22;rr(m.x,m.y,m.w,m.h,28,K.card);X.restore();
  X.save();rr(m.x,m.y,m.w,m.h,28);X.clip();
  tx('添加成员',m.x+28,m.y+34,K.acc700,800,13);circ(m.x+m.w-40,m.y+34,16,K.side);ln([[m.x+m.w-45,m.y+29],[m.x+m.w-35,m.y+39]],K.ink2,1.5);ln([[m.x+m.w-35,m.y+29],[m.x+m.w-45,m.y+39]],K.ink2,1.5);
  tx('首次安装默认只启用一个品种；可在成员管理继续添加其他成员。',m.x+28,m.y+70,K.mute,400,12);
  tx('成员模板',m.x+28,m.y+102,K.ink,700,13);tx('从内置成员模板开始，选择后自动填充身份、模型与运行时默认值。',m.x+28,m.y+124,K.mute,400,12);
  let cx=m.x+28;['自定义',...Object.keys(CATS)].forEach((s,i)=>{const ww=tw(s,600,12)+26;rr(cx,m.y+142,ww,30,15,i?K.card:K.acc,i?K.line2:null);tx(s,cx+ww/2,m.y+157,i?K.ink2:'#fff',600,12,'center');cx+=ww+8});
  const cw=m.w-56;rr(m.x+28,m.y+190,cw,FIELDS.length*46+52,18,K.chat,K.line2);tx('身份信息',m.x+46,m.y+216,K.ink,700,13);
  fieldRows(m).forEach((f,i)=>{if(i===0&&skipName)return;tx(f.label,f.lx,f.y+f.h/2,K.ink,700,12);
    if(f.label==='Avatar'){rr(f.x,f.y,112,f.h,17,K.side,K.line2);circ(f.x+17,f.y+17,12,K.card);tx('☺',f.x+17,f.y+17,K.mute,400,13,'center');tx('点击上传',f.x+38,f.y+17,K.ink2,400,12);return}
    if(f.label==='Background Color'){rr(f.x,f.y+5,24,24,5,'#9B7EBD');rr(f.x+36,f.y+3,76,28,8,'#d4c7e5');tx('喵～消息',f.x+74,f.y+17,'#26201f',400,12,'center');rr(f.x+120,f.y+3,76,28,8,'#3e3450');tx('喵～消息',f.x+158,f.y+17,'#f2edec',400,12,'center');return}
    drawInput(f,{val:i===3?role:'',focus:focus===i,t})});
  const fy=m.y+m.h-60;X.fillStyle=K.card;X.fillRect(m.x,fy,m.w,60);R0(m.x,fy,m.w,1,K.line2);rr(m.x+m.w-100,fy+14,72,32,10,K.acc);tx('保存',m.x+m.w-64,fy+30,'#fff',600,13,'center');X.restore();return m}
function drawInput(f,{val='',focus=false,t=0,label=null}={}){rr(f.x,f.y,f.w,f.h,10,K.side,focus?K.acc:null,focus?2:1);if(focus){X.save();X.globalAlpha=.25;rr(f.x-3,f.y-3,f.w+6,f.h+6,12,null,K.acc,3);X.restore()}
  if(val)tx(val,f.x+12,f.y+f.h/2,K.ink,400,13);else if(f.ph)tx(f.ph,f.x+12,f.y+f.h/2,K.mute,400,13);
  if(focus&&Math.floor(t*2.2)%2===0){const cx=f.x+12+(val?tw(val,400,13):0);R0(cx,f.y+9,1.5,f.h-18,K.ink)}}

/* ---------- 光标 ---------- */
function arrow(x,y,beam){if(beam){ln([[x,y-9],[x,y+9]],'#181515',1.6);ln([[x-3,y-10],[x+3,y-10]],'#181515',1.4);ln([[x-3,y+10],[x+3,y+10]],'#181515',1.4);return}
  X.beginPath();[[0,0],[0,17],[4.2,13.2],[7,19.6],[10,18.4],[7.3,12.2],[12.4,12.2]].forEach(([a,b],i)=>i?X.lineTo(x+a,y+b):X.moveTo(x+a,y+b));X.closePath();X.fillStyle='#fff';X.fill();X.strokeStyle='#181515';X.lineWidth=1.3;X.stroke()}
function paw(x,y){X.fillStyle='#f4a6b8';[[-5,-5],[0,-8],[5,-5]].forEach(([a,b])=>X.fillRect(x+a-1.5,y+b-1.5,4,4));X.fillRect(x-4,y-1,9,6);X.fillStyle='#241a2e';X.fillRect(x-4,y+5,9,1)}

/* ---------- 像素化：缩小取平均 → 换成店里的调色板（带一点抖动）→ 最近邻放大 ---------- */
const GAME=['#140e1a','#1c1424','#241a2e','#2f2340','#3a2c4c','#4a3a5c','#6a5a7a','#8a7a9a','#b9a8c9','#d8cce4','#fff4dc','#fff8e8','#fbfaf6','#eadcb8','#d6a868','#c49656','#a8703f','#8a5a3a','#6e4a28','#3a2630',
  '#e0533d','#f07a5e','#f7a58c','#b83e2c','#f4a6b8','#e27a8f','#ffd84a','#e8b83a','#fff0a8','#9ccc98','#7cc47a','#5B8C5A','#35593a','#a8d0f0','#5B9BD5','#34618f','#d0bce4','#9B7EBD','#654a86','#c8b89a','#e8dccb','#ffffff'].map(h=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]});
const QC=new Int16Array(32768).fill(-1),BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function near(r,g,b){const k=(r>>3)<<10|(g>>3)<<5|b>>3;let v=QC[k];if(v>=0)return v;let bd=1e9;for(let i=0;i<GAME.length;i++){const p=GAME[i],d=(p[0]-r)**2*.3+(p[1]-g)**2*.59+(p[2]-b)**2*.11;if(d<bd){bd=d;v=i}}QC[k]=v;return v}
const mk=()=>document.createElement('canvas');
function shrink(src,k,dpr,q,sm){const w=Math.max(1,Math.ceil(src.width/(k*dpr))),h=Math.max(1,Math.ceil(src.height/(k*dpr)));sm.width=w;sm.height=h;const x=sm.getContext('2d',{willReadFrequently:true});
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.clearRect(0,0,w,h);x.drawImage(src,0,0,w,h);if(q<=0)return x;
  const im=x.getImageData(0,0,w,h),d=im.data;for(let j=0;j<h;j++)for(let i=0;i<w;i++){const p=(j*w+i)*4;if(d[p+3]<8){d[p+3]=0;continue}const a=d[p+3]/255,o=(BY[(j&3)*4+(i&3)]/16-.47)*26*q;
    const r=d[p]/a,g=d[p+1]/a,b=d[p+2]/a,c=GAME[near(Math.max(0,Math.min(255,r+o)),Math.max(0,Math.min(255,g+o)),Math.max(0,Math.min(255,b+o)))];
    d[p]=r+(c[0]-r)*q;d[p+1]=g+(c[1]-g)*q;d[p+2]=b+(c[2]-b)*q;d[p+3]=q>.5?(d[p+3]>110?255:0):d[p+3]}x.putImageData(im,0,0);return x}

/* ---------- 取名输入框最后停在哪（和 entry-name 的表单对齐） ---------- */
const fieldRect=(w,h)=>{const fw=Math.min(440,w-48);return{x:Math.round((w-fw)/2),y:Math.round(h*.4),w:fw,h:60}};

/* ---------- 播放 ---------- */
function play(cv,{skip}={}){const dpr=Math.min(2,window.devicePixelRatio||1),W=innerWidth,H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
  const out=cv.getContext('2d'),B=mk(),smA=mk(),smB=mk();B.width=W*dpr;B.height=H*dpr;
  const s=Math.max(.7,Math.min(1.5,W/1280,H/780)),vw=W/s,vh=H/s;  // 按 1280×780 的版面缩放：大屏放大，小屏缩小
  let blurBg=null;
  const cur={x:W*.72,y:H*1.05},pts=()=>{const m=modalBox(vw,vh),F=fieldRows(m),b=addBtn(vw);return{gear:[26,railY(10,vh)],add:[b.x+b.w/2,b.y+b.h/2],role:[F[3].x+60,F[3].y+F[3].h/2],name:[F[0].x+50,F[0].y+F[0].h/2],F0:F[0]}};
  const clicks=[T.click1,T.click2,T.click3,T.click4];
  function scene(ctx,t,{noName=false}={}){X=ctx;X.setTransform(dpr*s,0,0,dpr*s,0,0);X.clearRect(0,0,vw,vh);
    if(t<T.set+.3){rail(vh,'chat');sidebar(vh);chat(vw,vh,t)}
    if(t>=T.set){const k=ease(seg(t,T.set,T.set+.3));X.save();X.globalAlpha=k;X.translate((1-k)*16,0);rail(vh,'gear');settings(vw,vh);X.restore()}
    if(t>=T.modal){const k=ease(seg(t,T.modal,T.modal+.28));if(!blurBg){blurBg=mk();blurBg.width=W*dpr;blurBg.height=H*dpr;const b=blurBg.getContext('2d');b.filter='blur(4px)';b.drawImage(ctx.canvas,0,0);b.filter='none';b.fillStyle='rgba(24,21,21,.28)';b.fillRect(0,0,blurBg.width,blurBg.height)}
      X.save();X.setTransform(1,0,0,1,0,0);X.globalAlpha=k;X.drawImage(blurBg,0,0);X.restore();
      X.save();X.globalAlpha=k;const c=vw/2,cy=vh/2,sc=.96+.04*k;X.translate(c,cy);X.scale(sc,sc);X.translate(-c,-cy);
      const n=Math.floor((t-T.type0)/.08);modal(vw,vh,t,{role:ROLE.slice(0,Math.max(0,Math.min(ROLE.length,n))),focus:t>=T.click4?0:t>=T.click3?3:-1,skipName:noName});X.restore()}}
  function cursorAt(t){const p=pts(),path=[[T.gear0,T.gear1,p.gear],[T.add0,T.add1,p.add],[T.role0,T.role1,p.role],[T.name0,T.name1,p.name]];let x=vw*.72,y=vh*.9;
    if(t<T.gear0){const k=ease(seg(t,1.4,T.gear0));x=lerp(vw*.8,vw*.55,k);y=lerp(vh*1.05,vh*.62,k)}else{let prev=[vw*.55,vh*.62];for(const [a,b,q] of path){if(t<a){x=prev[0];y=prev[1];break}const k=ease(seg(t,a,b));x=lerp(prev[0],q[0],k);y=lerp(prev[1],q[1],k);prev=q}}
    return{x,y,beam:t>T.role1-.05&&t<T.name0||t>T.name1-.05}}
  return new Promise(res=>{const t0=performance.now();let done=false,skipT=null;
    const finish=()=>{if(done)return;done=true;res()};if(skip)skip(()=>{skipT=skipT??(performance.now()-t0)/1000});
    function frame(ms){if(done)return;let t=(ms-t0)/1000;if(skipT!=null)t=Math.max(t,T.px+1.1+(t-skipT)*2.5);if(t>=T.end){finish();paintEnd();return}
      out.setTransform(1,0,0,1,0,0);
      if(t<T.px){scene(out,t);const c=cursorAt(t);X.setTransform(dpr*s,0,0,dpr*s,0,0);const ck=clicks.find(q=>t>q&&t<q+.35);if(ck!=null){const k=(t-ck)/.35;X.save();X.globalAlpha=1-k;circ(c.x,c.y,6+k*14,null,K.acc,2);X.restore()}arrow(c.x,c.y,c.beam)}
      else pixelFrame(t);
      if(typeof Sound!=='undefined'){const i=clicks.findIndex(q=>t>q&&t<q+.05);if(i>=0&&!frame['c'+i]){frame['c'+i]=1;Sound.sfx('click')}const n=Math.floor((t-T.type0)/.08);if(n>=0&&n<ROLE.length&&!frame['k'+n]){frame['k'+n]=1;Sound.sfx('tick')}}
      requestAnimationFrame(frame)}
    // 像素化这一段：A = 名称这一格以外的全部（碎成 6px 的块，从四周往里一块块掉下去、暗掉），B = 名称这一格（先变粗，挪到正中以后又一步步变清楚）
    let baseA=null;const kA=t=>{const p=t-T.px;return p<.25?2:p<.5?3:p<.8?4:6},kB=t=>{const p=t-T.px;return p<.25?2:p<.5?3:p<1.75?4:p<1.95?3:p<2.1?2:1};
    const nz=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
    function pixelFrame(t){const p=t-T.px;
      if(!baseA){baseA=mk();baseA.width=W*dpr;baseA.height=H*dpr;scene(baseA.getContext('2d'),T.px-.001,{noName:true})}
      const q=cl(p/.8),dis=cl((p-.55)/1.45),mv=ease(seg(p,.9,2));
      // A
      const k=kA(t),kk=k*dpr,xa=shrink(baseA,k,dpr,q,smA),wa=smA.width,ha=smA.height;out.imageSmoothingEnabled=false;out.fillStyle='#1c1424';out.fillRect(0,0,cv.width,cv.height);
      if(dis<=0)out.drawImage(smA,0,0,wa*kk,ha*kk);
      else{const d=xa.getImageData(0,0,wa,ha).data,fall=[];for(let j=0;j<ha;j++)for(let i=0;i<wa;i++){const dx=(i+.5)/wa-.5,dy=(j+.5)/ha-.42,dn=Math.min(1,Math.hypot(dx*1.2,dy)*1.7),e=dis*1.35-(.35*nz(i,j)+.65*(1-dn));
          if(e<=0){const p4=(j*wa+i)*4;out.fillStyle=`rgb(${d[p4]},${d[p4+1]},${d[p4+2]})`;out.fillRect(i*kk,j*kk,kk,kk)}else if(e<.16)fall.push([i,j,e/.16])}
        for(const [i,j,f] of fall){const p4=(j*wa+i)*4,g=1-f*.7;out.fillStyle=`rgb(${28+(d[p4]-28)*g|0},${20+(d[p4+1]-20)*g|0},${36+(d[p4+2]-36)*g|0})`;out.fillRect(i*kk,j*kk+Math.round(f*f*4)*kk,kk,kk)}}
      // B：名称这一格从弹窗里的位置挪到正中，边框从圆角慢慢变成店里对话框的像素窗框
      const bx=B.getContext('2d');X=bx;bx.setTransform(dpr,0,0,dpr,0,0);bx.clearRect(0,0,W,H);const F=pts().F0,m0={x:F.x*s,y:F.y*s,w:F.w*s,h:F.h*s},m1=fieldRect(W,H),r={x:lerp(m0.x,m1.x,mv),y:lerp(m0.y,m1.y,mv),w:lerp(m0.w,m1.w,mv),h:lerp(m0.h,m1.h,mv)};
      morphField(r,mv,t);X.save();X.globalAlpha=1-cl(mv*2);tx('名称*',F.lx*s,F.y*s+F.h*s/2,K.ink,700,12);X.restore();
      const c=cursorAt(T.px),cx=lerp(c.x*s,m1.x+m1.w-26,mv),cy=lerp(c.y*s,m1.y+m1.h/2,mv);X.save();X.globalAlpha=1-cl((p-1.5)/.4);if(p<.35)arrow(cx,cy,true);else paw(cx,cy);X.restore();
      const kb=kB(t);if(kb===1)out.drawImage(B,0,0);else{shrink(B,kb,dpr,q,smB);out.drawImage(smB,0,0,smB.width*kb*dpr,smB.height*kb*dpr)}}
    function paintEnd(){out.setTransform(1,0,0,1,0,0);out.fillStyle='#1c1424';out.fillRect(0,0,cv.width,cv.height)}
    requestAnimationFrame(frame)})}
// 名称这一格：m=0 是 Clowder 的圆角输入框，m=1 是店里对话框那种外深内浅、切角的像素窗框（里面是便签纸色）
function morphField(r,m,t){const {x,y,w,h}=r;if(m<.5){drawInput({x,y,w,h,ph:m<.25?'成员显示名称，如 我的助手':''},{focus:true,t});return}
  const k=(m-.5)*2;X.fillStyle='#140e1a';X.fillRect(x-6,y-6,w+12,h+12);X.fillStyle='#fff4dc';X.fillRect(x-3,y-3,w+6,h+6);X.fillStyle=`rgb(${lerp(243,255,k)},${lerp(238,248,k)},${lerp(230,232,k)})`;X.fillRect(x,y,w,h);
  if(Math.floor(t*2.2)%2===0){X.fillStyle='#e0533d';X.fillRect(x+18,y+14,3,h-28)}}
return{play,fieldRect}})();
