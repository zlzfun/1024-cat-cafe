/* 1024 猫咖 · 猫模型再审视（草案 v2，已并入 cat-sprites.js v2；本文件只供 cat-rework-v1 对照页使用）。依赖 cat-sprites-v1.js。
   内容：表情贴片、侧身三种比例、脸贴地的趴与睡、动作重做、新点子。
   爪子原则：抬起的那条腿从身下去掉；爪子是圆"手套"，前臂和爪子一样粗、很短，直接并进胸口。 */

/* ================= 通用 ================= */
function put(G,x,y,ch){if(G[y]&&G[y][x]!==undefined)G[y][x]=ch}
const HEAD12=()=>V3HEAD.slice(0,12).map(r=>[...r]);                                   // V3 正脸头（不含项圈）
const HEAD_R=()=>edit(TURNED,G=>{G[3][13]='p';G[4][12]='p';G[4][13]='p'});            // 3/4 转头，近侧耳朵保留粉色
const rotCCW=R=>{const H=R.length,W=R[0].length;return Array.from({length:W},(_,r)=>Array.from({length:H},(_,c)=>R[c][W-1-r]).join(''))};
// 耳朵向外倒一格（放松 / 犯困 / 抹脸那一侧）；side 含 'L' / 'R'
function EARS_RELAX(H,side='LR'){
  if(side.includes('L')){for(let y=0;y<=3;y++)for(let x=2;x<=5;x++)H[y][x]='.';[[0,2,'u'],[1,2,'o'],[2,2,'o'],[2,3,'o'],[3,2,'o'],[3,3,'p'],[3,4,'o']].forEach(([y,x,c])=>H[y][x]=c)}
  if(side.includes('R')){for(let y=0;y<=3;y++)for(let x=12;x<=15;x++)H[y][x]='.';[[0,15,'u'],[1,15,'o'],[2,15,'o'],[2,14,'o'],[3,15,'o'],[3,14,'p'],[3,13,'o']].forEach(([y,x,c])=>H[y][x]=c)}
  return H}
const liftL=G=>{for(let y=15;y<=19;y++){G[y][6]='b';G[y][7]='l';G[y][8]='d'}return G};   // 端坐时抬起画面左侧前腿
const liftR=G=>{for(let y=15;y<=19;y++){G[y][9]='d';G[y][10]='l';G[y][11]='b'}return G};  // 端坐时抬起画面右侧前腿
// 胖爪子：顶部圆、和前臂同宽，下端并进胸口
function mitt(G,x,y,h){sp(G,{[y]:`${x+1}:ooo`});for(let k=1;k<h;k++)sp(G,{[y+k]:`${x}:obbbo`})}
const YARN6=(x,y)=>({[y]:`${x+1}:RRRR`,[y+1]:`${x}:RrrhrR`,[y+2]:`${x}:RrhrrR`,[y+3]:`${x}:RhrrrR`,[y+4]:`${x+1}:RRRR`});

/* ================= 表情贴片 ================= */
// 作用在 V3 正脸头上：头部网格左上角 (ox,oy)，眼睛中心列 6 / 11、行 7-8，鼻子 8-9 行 9，嘴在行 10
const EYE={ // [dx,dy,字符]，相对左眼 (6,7)；右眼默认镜像
  dot:[[0,0,'e'],[0,1,'e']], up:[[0,-1,'e'],[0,0,'e']], down:[[0,1,'e'],[0,2,'e']],
  lookL:[[-1,0,'e'],[-1,1,'e']], lookR:[[1,0,'e'],[1,1,'e']], lookRup:[[1,-1,'e'],[1,0,'e']],
  lookPawL:[[-1,1,'e'],[-1,2,'e']], lookPawR:[[-2,1,'e'],[-2,2,'e']],
  closed:[[-1,1,'e'],[0,1,'e'],[1,1,'e']], happy:[[0,0,'e'],[-1,1,'e'],[1,1,'e']], sleep:[[-1,0,'e'],[0,1,'e'],[1,0,'e']],
  half:[[-1,0,'o'],[0,0,'o'],[1,0,'o'],[0,1,'e']], halfL:[[-1,0,'o'],[0,0,'o'],[1,0,'o'],[-1,1,'e']],
  drowsy:[[-1,0,'o'],[0,0,'o'],[1,0,'o'],[-1,1,'e'],[0,1,'e'],[1,1,'e']],
  wideL:[[-1,-1,'w'],[0,-1,'e'],[-1,0,'e'],[0,0,'e'],[-1,1,'e'],[0,1,'e']], wideR:[[0,-1,'w'],[1,-1,'e'],[0,0,'e'],[1,0,'e'],[0,1,'e'],[1,1,'e']],
  star:[[0,-1,'y'],[-1,0,'y'],[0,0,'w'],[1,0,'y'],[0,1,'y']], heart:[[-1,0,'r'],[1,0,'r'],[-1,1,'r'],[0,1,'r'],[1,1,'r'],[0,2,'r']],
  dizzy:[[-1,-1,'e'],[1,-1,'e'],[0,0,'e'],[-1,1,'e'],[1,1,'e']], squeeze:[[-1,-1,'e'],[0,0,'e'],[-1,1,'e']],
  cry:[[-1,0,'e'],[0,0,'e'],[1,0,'e'],[0,1,'q'],[0,2,'q'],[0,3,'q']], wink:[[-1,1,'e'],[0,0,'e'],[1,1,'e']],
};
const MOUTH={
  w:[[7,10,'o'],[8,10,'m'],[9,10,'m'],[10,10,'o']], smile:[[7,10,'o'],[8,10,'n'],[9,10,'n'],[10,10,'o']],
  open:[[7,10,'o'],[8,10,'R'],[9,10,'R'],[10,10,'o'],[8,11,'o'],[9,11,'o']], o:[[8,10,'R'],[9,10,'R'],[8,11,'o'],[9,11,'o']],
  flat:[[7,10,'o'],[8,10,'o'],[9,10,'o'],[10,10,'o']], frown:[[8,10,'o'],[9,10,'o'],[7,11,'o'],[10,11,'o']],
  blep:[[7,10,'o'],[8,10,'m'],[9,10,'m'],[10,10,'o'],[9,11,'n']], lick:[[7,10,'o'],[8,10,'n'],[9,10,'n'],[10,10,'o'],[8,11,'n']],
  smirk:[[7,10,'m'],[8,10,'o'],[9,10,'o'],[10,10,'o'],[11,9,'o']],
};
const FACES={
  // 展示用的 17 种
  normal:{L:'dot',m:'w'}, happy:{L:'happy',m:'smile'}, content:{L:'closed',m:'w'}, sleepy:{L:'drowsy',m:'o'},
  curious:{L:'wideL',R:'wideR',mirror:0,m:'w'}, surprise:{L:'wideL',R:'wideR',mirror:0,m:'o',blush:0}, sparkle:{L:'star',m:'smile'},
  love:{L:'heart',m:'smile',blush:2}, angry:{L:'dot',m:'frown',brow:1,blush:0,vein:1}, meh:{L:'half',m:'flat',blush:0},
  shy:{L:'lookR',R:'lookR',mirror:0,m:'w',blush:2}, wink:{L:'dot',R:'wink',m:'blep'}, cry:{L:'cry',m:'frown',blush:0},
  dizzy:{L:'dizzy',m:'open',sweat:1}, meow:{L:'closed',m:'open'}, smug:{L:'halfL',R:'halfL',mirror:0,m:'smirk'}, laugh:{L:'squeeze',m:'open'},
  blep:{L:'dot',m:'blep'},
  // 动作内部用
  sleepSnug:{L:'sleep',m:'w'}, lookUp:{L:'up',m:'w'}, lookDown:{L:'down',m:'w'}, lookDownO:{L:'down',m:'o'},
  lickA:{L:'closed',m:'lick'}, wipe:{L:'closed',m:'w'}, lookPaw:{L:'lookPawL',R:'lookPawR',mirror:0,m:'w'},
  lookR:{L:'lookR',R:'lookR',mirror:0,m:'w'}, lookRnear:{L:'lookR',R:'lookR',mirror:0,m:'o'}, lookRfar:{L:'lookRup',R:'lookRup',mirror:0,m:'w'},
  halfOpen:{L:'half',m:'w'}, yawn:{L:'closed',m:'open'}, focus:{L:'wideL',R:'wideR',mirror:0,m:'w',blush:0},
};
function face(G,ox,oy,name){const f=FACES[name]||FACES.normal;
  for(let y=6;y<=9;y++)for(const x of [5,6,7,10,11,12])if(y<9||'eqrywo'.includes((G[oy+y]||[])[ox+x]))put(G,ox+x,oy+y,'b');   // 清空眼区
  for(let x=7;x<=10;x++){put(G,ox+x,oy+10,'b');put(G,ox+x,oy+11,'b')}put(G,ox+11,oy+9,'b');put(G,ox+7,oy+9,'m');put(G,ox+10,oy+9,'m');
  const L=EYE[f.L],Rr=EYE[f.R||f.L],mir=f.mirror??1;
  L.forEach(([dx,dy,c])=>put(G,ox+6+dx,oy+7+dy,c));Rr.forEach(([dx,dy,c])=>put(G,ox+11+(mir?-dx:dx),oy+7+dy,c));
  MOUTH[f.m].forEach(([x,y,c])=>put(G,ox+x,oy+y,c));
  const bl=f.blush??1;put(G,ox+4,oy+9,bl?'p':'b');put(G,ox+13,oy+9,bl?'p':'b');if(bl>1){put(G,ox+5,oy+9,'p');put(G,ox+12,oy+9,'p')}
  if(f.brow)[[5,5],[6,6],[7,6],[12,5],[11,6],[10,6]].forEach(([x,y])=>put(G,ox+x,oy+y,'o'));
  if(f.vein)[[14,1],[16,1],[15,2],[14,3],[16,3]].forEach(([x,y])=>put(G,ox+x,oy+y,'r'));
  if(f.sweat)[[16,3],[16,4],[17,4],[16,5],[17,5]].forEach(([x,y])=>put(G,ox+x,oy+y,'q'));
  return G}
// 3/4 转头版：眼睛中心列 8 / 13，嘴在 11-13
function faceT(G,ox,oy,name){const f=FACES[name]||FACES.normal;
  for(let y=6;y<=8;y++)for(const x of [7,8,9,12,13,14])if(G[oy+y][ox+x]!=='o'||y>6)put(G,ox+x,oy+y,'b');
  for(const x of [11,12,13])put(G,ox+x,oy+10,'b');put(G,ox+14,oy+10,'o');put(G,ox+15,oy+10,'o');
  const L=EYE[f.L],Rr=EYE[f.R||f.L],mir=f.mirror??1;
  L.forEach(([dx,dy,c])=>put(G,ox+8+dx,oy+7+dy,c));Rr.forEach(([dx,dy,c])=>{const x=13+(mir?-dx:dx);if(x<=14)put(G,ox+x,oy+7+dy,c)});
  MOUTH[f.m].forEach(([x,y,c])=>{const xx=x+3;if(xx>=10&&xx<=13)put(G,ox+xx,oy+y,c)});
  const bl=f.blush??1;put(G,ox+6,oy+9,bl?'p':'b');put(G,ox+14,oy+9,bl?'p':'b');
  if(f.sweat)[[16,2],[16,3],[17,3]].forEach(([x,y])=>put(G,ox+x,oy+y,'q'));return G}
const sitFace=(name,tf=0)=>face(sit(tf),0,0,name);
const turnedFace=name=>edit(HEAD_R(),G=>faceT(G,0,0,name));

/* ================= 侧身：三种比例 ================= */
// 腿：1px 宽 + 朝前的小脚掌；fx=脚掌相对腿根的偏移（迈步角度），up=抬起格数
function legP(G,x,top,bottom,fill,fx=0,up=0){bottom-=up;
  for(let y=top;y<=bottom;y++){const k=bottom===top?1:(y-top)/(bottom-top),sx=x+Math.round(fx*k),
    s=y===bottom?'oooo':y===bottom-1?'o'+fill+fill+'o':'o'+fill+'o';
    [...s].forEach((c,i)=>{const cur=G[y]&&G[y][sx+i];if(cur===undefined)return;if(c==='o'&&i>0&&i<s.length-1&&cur!=='.'&&cur!=='o')return;G[y][sx+i]=c})}}
// 迈步 4 帧：[近后, 远后, 远前, 近前] → [x, 抬起, 脚偏移]；s=步幅
const STEP4=(B,F,s=1)=>[[[B-s,0,-1],[B+s+1,0,1],[F-s-1,0,-1],[F+s,0,1]],[[B,1,0],[B+1,0,0],[F-1,1,0],[F,0,0]],
                        [[B+s+1,0,1],[B-s,0,-1],[F+s,0,1],[F-s-1,0,-1]],[[B+1,0,0],[B,1,0],[F,0,0],[F-1,1,0]]];
const TAIL_Q=[{1:"1:oo",2:"0:otto",3:"0:oto",4:"0:oto",5:"0:oto",6:"0:oto",7:"1:oto",8:"1:ooto",9:"2:oo"},
              {1:"2:oo",2:"1:otto",3:"1:oto",4:"0:oto",5:"0:oto",6:"0:oto",7:"1:oto",8:"1:ooto",9:"2:oo"}];   // 问号尾巴，尾尖左右摆
// A 标准：臀部比肩高、屁股圆、有大腿线，胸口白
const SIDE_A={w:26,h:19,hx:7,hy:0,cx:16,top:15,bottom:18,
  body:{8:"3:oooo",9:"2:obbbbooo",10:"1:obbgbbgbbo",11:"0:obbbbgbbgbbb",12:"0:obbbbbbbbbbb|21:o",13:"0:obbbbbbbbbbbbbbbbbbllo",14:"1:obbbbbbbbbbbbbbbbblo",15:"2:ooooooooooooooooooo"},
  shade:{12:"5:d",13:"6:d",14:"6:d"},tail:TAIL_Q,legs:STEP4(2,16)};
// B 长腿：身体同 A，腿长 5 格、步幅更大
const SIDE_B={...SIDE_A,h:21,bottom:20,legs:STEP4(2,16,2)};
// C 短身：臀部往前收 4 格，更像团子
const SIDE_C={...SIDE_A,w:24,hx:5,cx:14,
  body:{8:"4:oooo",9:"3:obbbbooo",10:"2:obbgbgbbo",11:"1:obbbbgbbgbb",12:"1:obbbbbbbbb|19:o",13:"1:obbbbbbbbbbbbbbbbllo",14:"2:obbbbbbbbbbbbbbblo",15:"3:oooooooooooooooo"},
  tail:TAIL_Q.map(t=>Object.fromEntries(Object.entries(t).map(([y,s])=>{const [x,c]=s.split(':');return [y,(+x+2)+':'+c]}))),legs:STEP4(3,14)};
function walkW(v,step,tf,{expr=null,bob=0}={}){const G=blank(v.w,v.h),L=v.legs[step%4],b=bob&&step%2?1:0;
  [1,2].forEach(i=>legP(G,L[i][0],v.top,v.bottom,'d',L[i][2],L[i][1]));
  sp(G,v.tail[tf],0,b);sp(G,v.body,0,b);sp(G,v.shade,0,b);
  [0,3].forEach(i=>legP(G,L[i][0],v.top+1,v.bottom,'b',L[i][2],L[i][1]));
  stamp(G,expr?turnedFace(expr):HEAD_R(),v.hx,v.hy+b);G.cx=v.cx;return G}

/* ================= 脸贴地：趴着 / 睡觉 ================= */
// 斜着趴：头朝镜头，下巴搁在两只前爪上；身体往右后方延伸，耳朵始终在背景上
const HUMP=[{6:"12:oooooooo",7:"10:oobbgbbgbboo",8:"9:obbbbgbbgbbbbo",9:"9:obbbbbbbbbbbbbo",10:"9:obbbbbbbbbbbbbbo",11:"9:obbbbbbbbbbbbbbo",12:"9:obbbbbbbbbbbbbbo",13:"10:ooooooooooooooo"},
            {5:"12:oooooooo",6:"10:oobbgbbgbboo",7:"9:obbbbgbbgbbbbo",8:"9:obbbbbbbbbbbbbo",9:"9:obbbbbbbbbbbbbbo",10:"9:obbbbbbbbbbbbbbo",11:"9:obbbbbbbbbbbbbbo",12:"9:obbbbbbbbbbbbbbo",13:"10:ooooooooooooooo"}];   // [1] 吸气
const TAILF=[{11:"25:o",12:"24:oto",13:"15:oooooooootto",14:"15:oooooooooo"},{10:"25:o",11:"25:oo",12:"24:otto",13:"16:ooooooootto",14:"16:ooooooooo"}];   // 尾巴绕到身前
const PAWS2={12:"3:obbo|9:obbo",13:"2:oooooo|8:oooooo"};
const NOSE_BUBBLE=[[],[[11,10,'q']],[[11,10,'q'],[12,10,'q'],[11,9,'w'],[12,9,'q']],[[11,10,'q'],[12,10,'q'],[13,10,'q'],[11,9,'q'],[12,9,'w'],[13,9,'q'],[12,8,'q']]];
const ZZ=[{0:"22:zzz",1:"23:z",2:"22:zzz",3:"19:zz",4:"19:zz"},{1:"22:zzz",2:"23:z",3:"22:zzz",4:"19:zz",5:"19:zz"}];
// 选项：expr 表情，ears 耳朵放松，bubble 鼻涕泡帧(0-3)，breathe 呼吸帧(0/1)，zz Z 字帧(0/1)，tail 尾巴帧
function lieDown({expr='normal',ears=0,bubble=-1,breathe=0,zz=-1,tail=0}={}){const G=blank(27,15);
  sp(G,TAILF[tail%2]);sp(G,HUMP[breathe%2]);
  const H=HEAD12();face(H,0,0,expr);if(ears)EARS_RELAX(H);stamp(G,toRows(H),0,0);sp(G,PAWS2);
  if(bubble>=0)NOSE_BUBBLE[bubble%4].forEach(([x,y,c])=>put(G,x,y,c));if(zz>=0)sp(G,ZZ[zz%2]);return G}

/* ================= 动作重做 ================= */
// 舔爪洗脸：0 伸舌舔 / 1 收舌、爪子上抬 / 2 停一下看爪子 / 3 爪子贴脸抹（那一侧耳朵倒下）
function groom2(f,tf=0){const G=liftL(sit(tf));
  if(f===0){face(G,0,0,'lickA');mitt(G,6,11,4);put(G,8,11,'n')}
  if(f===1){face(G,0,0,'content');mitt(G,6,10,5)}
  if(f===2){face(G,0,0,'lookPaw');mitt(G,5,12,3)}
  if(f===3){face(G,0,0,'wipe');const H=G.slice(0,12).map(r=>r.slice(0,18));EARS_RELAX(H,'L');H.forEach((r,y)=>r.forEach((c,x)=>G[y][x]=c));
    sp(G,{7:"3:ooo",8:"2:obbbo",9:"2:obbbo",10:"2:obbbo",11:"3:obbbo",12:"4:obbo",13:"4:obbo",14:"4:obo"})}
  return G}
const GROOM_SEQ=[0,1,0,1,0,1,2,2,3,3,3,1];                                              // 每帧 0.2 秒
// 拍吊球：球挂在右脸旁边来回荡，眼睛一直跟着球；球荡近时抬起右爪拍（露肉垫）
function swing2(t){const G=blank(28,25),a=Math.sin(t*2.6),bx=Math.round(21+a*4),by=10,near=bx<=19;
  const S=sit(0);if(near)liftR(S);face(S,0,0,bx<=18?'lookRnear':bx>=23?'lookRfar':'lookR');stamp(G,toRows(S),0,4);
  for(let y=0;y<by-2;y++)G[y][Math.round(23+(bx-23)*(y/(by-2)))]='T';
  sp(G,{[by-3]:`${bx-1}:RRR`,[by-2]:`${bx-2}:RrhrR`,[by-1]:`${bx-2}:RrrhR`,[by]:`${bx-2}:RhrrR`,[by+1]:`${bx-1}:RRR`});
  if(near)sp(G,{10:"14:oooo",11:"13:oppppo",12:"13:obpbbo",13:"13:obbbbo",14:"12:obbbbo",15:"11:obbbbo",16:"11:obbbo"});
  return G}
// 趴着拨球：斜趴，球在下巴前面；爪子往前一伸把球拨出去，球再滚回来
function pawBat(t){const G=blank(27,22),k=(t*1.1)%1,hit=k<.22,by=14+Math.round(hit?0:Math.sin((k-.22)/.78*Math.PI)*4);
  stamp(G,toRows(lieDown({expr:hit?'lookDownO':'lookDown'})),0,0);
  if(hit)sp(G,{12:"8:obbo",13:"8:obbo",14:"8:obbo",15:"8:obppo",16:"9:ooo"});
  sp(G,YARN6(11,by));return G}
// 侧躺抱球蹬：斜趴，球在身前，前爪抱住、后爪蹬
function kickBall(f){const G=blank(28,19),L=lieDown({expr:f?'laugh':'happy'});
  for(let y=13;y<15;y++)for(let x=14;x<27;x++)if('ot'.includes(L[y][x]))L[y][x]=y===13&&x<25?'o':'.';   // 尾巴收到身后
  stamp(G,toRows(L),0,0);const bx=f?14:15;
  sp(G,{12:`${bx+1}:RRRR`,13:`${bx}:RrrhrR`,14:`${bx}:RrhrrR`,15:`${bx}:RhrrrR`,16:`${bx}:RrrrhR`,17:`${bx+1}:RRRR`});
  sp(G,{12:"11:ooo",13:"10:obbbo",14:"10:obppo",15:"11:ooo"});
  sp(G,f?{11:"20:ooo",12:"19:obbbo",13:"19:ppbbo",14:"19:oooo"}:{11:"22:ooo",12:"21:obbbo",13:"21:obbpo",14:"22:ooo"});return G}
// 翻肚皮（侧面）：头侧躺朝镜头，肚皮朝上，前爪抱球、后腿蹬球
function belly3(f){const G=blank(32,18);
  sp(G,f?{12:"28:oo",13:"27:otto",14:"27:oto",15:"26:ooto",16:"26:ooo"}:{13:"28:oo",14:"27:otto",15:"26:ooto",16:"26:ooo"});
  sp(G,{3:"13:ooo",4:"12:odddo",5:"12:odddo",6:"13:odo"});
  sp(G,f?{4:"25:ooo",5:"24:odddo",6:"24:odddo",7:"25:odo"}:{2:"24:ooo",3:"23:odddo",4:"23:odddo",5:"24:oddo",6:"25:odo"});
  sp(G,{7:"14:oooooooooo",8:"12:oolllllllllloo",9:"11:obllllllllllllbo",10:"11:obllllllllllllbo",11:"11:obbllllllllllbbo",12:"11:obbbbbbbbbbbbbbo",
        13:"11:obbgbbbgbbbgbbbo",14:"11:obbbbbbbbbbbbbbo",15:"12:oobbbbbbbbbboo",16:"14:oooooooooo"});
  const H=HEAD12();face(H,0,0,'happy');stamp(G,rotCCW(toRows(H)),0,0);
  sp(G,YARN6(16,f?2:3));
  sp(G,{3:"14:ooo",4:"13:obppo",5:"13:obbbo",6:"13:obbbo",7:"14:obbbo",8:"15:obo"});
  sp(G,f?{2:"22:ooo",3:"21:oppbo",4:"21:obbbo",5:"22:obbbo",6:"23:obbbo",7:"24:obo"}:{4:"23:ooo",5:"22:oppbo",6:"22:obbbo",7:"23:obbbo",8:"24:obo"});
  return G}
// 被毛线缠成茧：只露出头和尾巴尖，晃来晃去
function cocoon(t){const f=Math.floor(t*6)%2,G=blank(28,22),S=blank(20,21);stamp(S,V3HEAD.slice(0,12),0,0);face(S,0,0,'dizzy');
  sp(S,{11:"4:RRRRRRRRRR",12:"3:RrrhrrRrrrR",13:"2:RrrRrrhrrRrrR",14:"1:RrhrrRrrrRrhrR",15:"1:RrrrhrrRrrrrhR",16:"1:RRrrrrhrRrrrrR",17:"1:RrrhRrrrrRhrrR",18:"1:RrrrrRrhrrRrrR",19:"2:RrhrrrRrrrhR",20:"4:RRRRRRRRRR"});
  sp(S,{2:"2:r|15:r",3:"3:r|14:r",4:"4:rr"});stamp(G,toRows(S),1+f,1);
  sp(G,f?{13:"17:oo",14:"17:oto",15:"18:oo"}:{14:"17:oo",15:"17:oto",16:"17:oo"});
  sp(G,{19:"16:rr",20:`${f?18:18}:rr`,21:`${f?20:20}:rrr`});sp(G,{16:"23:RRR",17:"22:RrhrR",18:"22:RhrrR",19:"22:RrrhR",20:"23:RRR"});return G}
// 线缠在身上：几圈线顺着身体轮廓绕，耳朵根也挂了线，线头拖到地上的毛线团
function wrapped(t){const f=Math.floor(t*5)%2,G=blank(28,22),S=sit(0);face(S,0,0,'surprise');
  [[13,[[2,0],[4,1],[8,1],[11,1],[14,0]]],[16,[[2,0],[5,1],[9,2],[12,1],[15,0]]],[19,[[1,0],[5,1],[9,1],[13,1],[16,0]]]].forEach(([y0,pts])=>{
    for(let i=0;i<pts.length-1;i++){const [x0,d0]=pts[i],[x1,d1]=pts[i+1];for(let x=x0;x<=x1;x++){const d=Math.round(d0+(d1-d0)*(x-x0)/(x1-x0));if(S[y0+d]&&S[y0+d][x]!=='.')S[y0+d][x]='r'}}});
  [[3,4],[4,4],[5,3],[4,13],[3,13],[5,14]].forEach(([y,x])=>S[y][x]='r');stamp(G,toRows(S),f,1);
  (f?[[17,18],[18,19],[19,19],[20,20],[21,20]]:[[17,18],[18,18],[19,19],[20,19],[21,20]]).forEach(([x,y])=>G[y][x]='r');
  sp(G,YARN6(21,16));if(f)sp(G,{2:"18:q",3:"18:qq",4:"18:qq"});return G}

/* ================= 新点子 ================= */
// 慢眨眼：猫的"我喜欢你"。睁 → 半闭 → 闭 → 停 → 半闭 → 睁
const SLOW=[['normal',1.4],['halfOpen',.25],['content',.25],['content',.7],['halfOpen',.25]];
function slowBlink(t,tf=0){const T=SLOW.reduce((s,x)=>s+x[1],0);let k=t%T,i=0;while(k>SLOW[i][1]){k-=SLOW[i][1];i++}return sitFace(SLOW[i][0],tf)}
// 招财猫招手：右爪举在脸边，手腕上下折
function maneki(f,tf=0){const G=liftR(sit(tf));face(G,0,0,'happy');
  sp(G,f?{9:"15:ooo",10:"14:obbbo",11:"14:obbbo",12:"13:obbbo",13:"12:obbbo",14:"12:obbo"}:{7:"15:ooo",8:"14:oppbo",9:"14:opppo",10:"14:obbbo",11:"14:obbbo",12:"13:obbbo",13:"12:obbbo",14:"12:obbo"});return G}
// 踩奶：两只前爪轮流抬起踩下，垫着小毯子
function knead(f,tf=0){const G=blank(22,23),S=sit(tf);face(S,0,0,'content');
  if(f%2){liftL(S);sp(S,{16:"5:ooo",17:"5:olo",18:"5:olo",19:"5:olo"})}else{liftR(S);sp(S,{16:"10:ooo",17:"10:olo",18:"10:olo",19:"10:olo"})}
  sp(G,{19:"0:hhhhhhhhhhhhhhhhhhhh",20:"0:hphphphphphphphphphp",21:"0:hhhhhhhhhhhhhhhhhhhh",22:"0:pppppppppppppppppppp"});stamp(G,toRows(S),0,1);return G}
// 伸懒腰（侧面）：前腿往前平伸、胸口压低、屁股翘高、打哈欠
function stretchCat(f){const G=blank(31,19);
  sp(G,{0:"2:oo",1:"1:otto",2:"1:oto",3:"1:oto",4:"1:oto",5:"2:oto",6:"2:ott"});
  sp(G,{5:"3:oooo",6:"2:obbbboo",7:"1:obbgbbgbo",8:"1:obbbgbbgbbo",9:"1:obbbbbbbbbbbo",10:"1:obbbbbbbbbbbbbo",11:"1:obbbbbbbbbbbbbbbo",12:"2:obbbbbbbbbbbbbbbbo",
        13:"2:obbbbbbbbbbbbbbbbbbo",14:"3:ooobbbbbbbbbbbbbbbo",15:"5:oooooooooooooooo"});
  sp(G,{9:"5:d",10:"6:d",11:"6:d",12:"6:d",13:"6:d"});leg(G,2,5,'d',13);leg(G,4,5,'b',13);
  sp(G,{15:"14:oooooooooooooo",16:"13:odddddddddddddo",17:"13:obbbbbbbbbbbbbbbo",18:"13:oooooooooooooooo"});
  stamp(G,turnedFace(f?'yawn':'content'),11,5);return G}
// 屁股扭扭准备扑（侧面低伏）：0/1 扭屁股、尾巴尖抖，2 扑出去
function pounce(f){const G=blank(30,17);
  if(f<2){const w=f?1:0;
    sp(G,{2:`${1+w}:oo`,3:`${w}:oto`,4:`${w}:oto`,5:`${1+w}:oto`,6:`${1+w}:ooto`,7:`${2+w}:oo`});
    sp(G,{6:`${3+w}:oooo`,7:`${2+w}:obbbboo`,8:`${1+w}:obbgbbgbbo`,9:`${1+w}:obbbgbbgbbbo`,10:"1:obbbbbbbbbbbbbbbbbo",11:"1:obbbbbbbbbbbbbbbbbbbo",12:"2:obbbbbbbbbbbbbbbbbbbo",13:"3:oooooooooooooooooooo"});
    leg(G,2+w,4,'d',12);leg(G,5+w,4,'b',12);sp(G,{14:"15:oooo|19:oooo",15:"14:obbbbo|18:obbbbo",16:"14:oooooo|18:oooooo"});
    stamp(G,turnedFace('focus'),10,3)}
  else{sp(G,{2:"0:oo",3:"0:ott",4:"1:ott",5:"2:ooo"});
    sp(G,{3:"3:oooooo",4:"2:obbbbbbooo",5:"2:obbgbbgbbbbo",6:"2:obbbbbbbbbbbbo",7:"3:obbbbbbbbbbbbbo",8:"4:oooooooooobbbo"});
    sp(G,{7:"0:oo",8:"0:obo",9:"1:oboo",10:"2:ooo"});sp(G,{9:"13:oooo",10:"13:obbbooooo",11:"14:obbbbbbbbo",12:"15:oooooooooo"});
    stamp(G,turnedFace('surprise'),11,-2)}
  return G}
const POUNCE_SEQ=[0,1,0,1,0,1,0,1,2,2,2];                                                // 每帧 0.18 秒
