/* 1024 猫咖 · 彩蛋（设计见 docs/店内设计.md 第四节）：登记、记在你的猫身上、第一次找到弹一条"彩蛋"、图鉴最下面那一栏。
   - EGGS：彩蛋的登记表。n 名字，hint 没找到时图鉴里写的谜面，what 找到以后写的经过，steps 有几步（猫猫星球四步，别的没有）。
     别的文件可以往里加（在 world-eggs.js 后面加载、建店之前加好就行）。彩蛋不进 GUIDE，不算"店里的东西"的件数。
   - A.eggs.found(key)：找到了（只算第一次）；A.eggs.has(key)；A.eggs.step(key,i)：第 i 步做完了（0 起），返回做完了几步；A.eggs.steps(key)：做完了哪几步（数组）
   - A.eggs.list()：[{key,n,hint,what,found,at,steps,done}]，图鉴用；A.eggs.count()、A.eggs.total
   这个文件里还有几个不属于哪间房的彩蛋：九条命（屋顶的屋檐边）、10:24、老秘籍；别的在它们各自的房间里（澡堂、舞厅在 world-b1.js，猫猫星球在 world-rocket.js，片尾彩蛋在 cinema.js）。 */
const EGGS={
  planet:{n:'猫猫星球',hint:'望远镜里，有一颗星星长着耳朵',what:'坐纸箱火箭，飞到了一颗长着猫耳朵的星球上',steps:4},
  ninelives:{n:'九条命',hint:'屋顶的边上，探头往下看看',what:'从屋顶的屋檐边跳了下去，啪地拍在后院的草地上……幸好猫有九条命'},
  shark:{n:'鲨鱼来了',hint:'澡堂的玻璃后面，偶尔游过一个大家伙',what:'一条鲨鱼从玻璃前面游过去，鱼群一下子散开，满屋的猫都炸了毛'},
  milk:{n:'一口闷',hint:'泡完澡，来一瓶',what:'泡完温泉，叉着腰一口闷掉一瓶咖啡牛奶：哈——'},
  disco:{n:'迪斯科之夜',hint:'一只猫跳舞不算热闹',what:'六只猫一起在舞池上跳舞，镜面球炸开了一屋彩纸'},
  clock:{n:'10:24',hint:'门厅的钟，一天里有两分钟不一样',what:'10:24 的时候，门厅的钟里探出一只猫报时，舞台上放了一场 1024 烟花'},
  konami:{n:'老秘籍',hint:'一段老游戏里的秘籍，在店里也管用',what:'老游戏的秘籍真的管用：你的猫变成了彩虹色'},
  credits:{n:'片尾彩蛋',hint:'电影放完别急着走',what:'看完了整部《猫猫咖啡馆》：字幕后面，THE END 上溜进来一个红点，六只猫扑成一团；红点溜出银幕，被你的猫一爪拍掉，最后它们对你慢慢眨眼'}};

WORLD_MODS.push(A=>{
const {S,me,news,sfx}=A;
const st=()=>A.guide.eggs();
const E=A.eggs={
  has:k=>!!(st()[k]&&st()[k].at),
  found(k){const e=EGGS[k];if(!e)return false;const s=st();if(s[k]&&s[k].at)return false;s[k]=Object.assign(s[k]||{},{at:Date.now()});A.guide.save();
    sfx('egg');A.ui.egg&&A.ui.egg({key:k,n:e.n,what:e.what,count:E.count(),total:E.total});news(`${me.label||'你'}找到了一个彩蛋：${e.n}`);A.emit&&A.emit('egg',k);return true},
  step(k,i){const s=st(),o=s[k]=s[k]||{};o.steps=o.steps||[];if(!o.steps.includes(i)){o.steps.push(i);o.steps.sort((a,b)=>a-b);A.guide.save()}return o.steps.length},
  steps:k=>((st()[k]||{}).steps||[]).slice(),
  list:()=>Object.entries(EGGS).map(([key,e])=>{const s=st()[key]||{};return{key,n:e.n,hint:e.hint,what:e.what,found:!!s.at,at:s.at||0,steps:e.steps||0,done:(s.steps||[]).length}}),
  count:()=>Object.keys(EGGS).filter(k=>E.has(k)).length,
  get total(){return Object.keys(EGGS).length}};
const {run,setK,say,emote,after,rr}=A,now=()=>A.t,tick=f=>A.tickers.push(f),P=A.P,GS=()=>A.guide.games();

/* ================= 九条命：从屋顶的屋檐边掉进后院 ================= */
// 第一下探头往下看（四秒内再按就跳）；跳下去：画面一暗切到一楼后院，猫从上面掉下来（地上的影子越来越大），啪地拍扁，僵直两秒多，爬起来
// 屋檐边的哪一段就落在后院的哪一段；最左头正对着落叶堆，正好落进去不疼
const EV=P.eaves,PILE=P.pile;let fall=null;
const rh0=A.restHook;A.restHook=c=>c.me&&fall?(fall.st==='air'?'leap':'splat'):(rh0?rh0(c):null);
function landAt(x){if(Math.abs(x-PILE.x)<24)return{x:PILE.x,y:PILE.y-4,soft:true};for(let dy=0;dy<40;dy+=4)for(const dx of [0,6,-6,12,-12]){const X=x+dx,Yy=650+dy;if(A.free(X,Yy))return{x:X,y:Yy}}return{x:420,y:640}}
function peek(c){run(c,[{go:{x:Math.max(EV.x0+8,Math.min(EV.x1-8,c.x)),y:EV.y}},{fn:c=>{c.peekT=now();c.face=c.x<260?'L':'R'}},{k:'lie',dur:1.6,ex:'lookDown'},{fn:c=>{c.peekT=now()}}]);
  say('好高……下面是后院的草地')}
function jump(c){const L=landAt(Math.round(c.x));fall={st:'go',L,t0:now()};c.stunUntil=now()+30;A.sfx('whoosh');
  run(c,[{jump:{x:c.x,y:EV.y+8,z:EV.y+8},h:10},{fn:c=>{c.z=undefined;A.transit(c,{k:'warp',dir:{x:0,y:1},out:{x:L.x,y:L.y,face:c.face},outDir:{x:0,y:0}},null)}}])}
A.T({id:'eaves',n:'屋檐边',hit:[EV.x0,EV.y-12,EV.x1-EV.x0,20],at:c=>({x:Math.max(EV.x0+8,Math.min(EV.x1-8,c.x)),y:EV.y}),near:[EV.x0,EV.y-14,EV.x1-EV.x0,22],hidden:c=>!c.me,
  label:c=>c.peekT>now()-4?'跳下去！':'探头往下看',ok:c=>!c.hold&&!fall,no:c=>c.hold?'叼着东西，先放下吧':'',go(c){if(c.peekT>now()-4)jump(c);else peek(c)}});
// 掉的过程：换到一楼那一刻开始，从画面上方掉下来；dy 越来越小，落地那一下拍扁
tick(dt=>{if(!fall)return;const c=me;
  if(fall.st==='go'&&c.transit&&c.transit.ph===1){fall.st='air';fall.dy=-240;fall.v=60;c.dy=fall.dy}
  if(fall.st==='air'){fall.v+=900*dt;fall.dy=Math.min(0,fall.dy+fall.v*dt);c.dy=fall.dy;c.alpha=1;if(c.k!=='leap')setK(c,'leap');
    if(fall.dy>=0){c.dy=0;const L=fall.L;if(L.soft){fall=null;c.stunUntil=0;A.pileBurst?A.pileBurst(c):0;after(.8,()=>say('正好掉进落叶堆，一点都不疼'));done(c,true);return}
      fall.st='splat';fall.t0=now();setK(c,'splat');c.stunUntil=now()+2.6;A.shakeUntil=now()+.35;A.sfx('splat');for(let i=0;i<3;i++)S.puffs.push({x:Math.round(c.x+(i-1)*8),y:Math.round(c.y),t0:now()+i*.05});
      S.cats.forEach(o=>{if(o!==c&&!o.hidden&&Math.hypot(o.x-c.x,o.y-c.y)<170){emote(o,'bang',1.2)}})}}
  else if(fall.st==='splat'){if(c.k!=='splat')setK(c,'splat');if(now()-fall.t0>2.6){fall=null;c.stunUntil=0;run(c,[{k:'stretch',dur:1.6}]);done(c,false)}}});
// 头上转着几颗星星（僵直的时候）
A.overs.push(vis=>{if(!fall||fall.st!=='splat')return;const t=now(),x=Math.round(me.x)+4,y=Math.round(me.y)-12;for(let i=0;i<3;i++){const a=t*5+i*2.1,sx=Math.round(x+Math.cos(a)*9),sy=Math.round(y+Math.sin(a)*3);P1(sx,sy,'#ffd84a');P1(sx-1,sy,'#ffd84a');P1(sx+1,sy,'#ffd84a');P1(sx,sy-1,'#ffd84a');P1(sx,sy+1,'#ffd84a')}});
// 落地的影子：掉的时候地上一个越来越大的黑影
A.floors.push(vis=>{if(!fall||fall.st!=='air')return;const k=1-Math.min(1,-fall.dy/240),x=Math.round(me.x),y=Math.round(me.y);alpha(.25+k*.3,()=>disc(x,y,Math.round(3+k*7),Math.round(1+k*2),'#140e1a'))});
// 每拍扁一次少一条命（落进落叶堆不算）；剩一条的时候开个玩笑，再掉一次九条命又攒满
function done(c,soft){A.news(`${me.label||'你'}从屋顶掉进了后院`);E.found('ninelives');if(soft)return;const g=GS(),n=g.falls=(g.falls||0)+1;A.guide.save();
  after(1.7,()=>{const left=9-n;if(n>=9){g.falls=0;A.guide.save();say('猫的九条命又攒满了');return}say(left===1?'只剩最后一条命了……喵，开玩笑的':`幸好猫有九条命（还剩 ${left} 条）`)})}

/* ================= 10:24：门厅的钟里探出一只猫报时，舞台背板放一场 1024 烟花 ================= */
const CK={x:286,y:16};let ckLast='',ckChk=0;S.cuckoo=0;
function chime(){S.cuckoo=now()+60;S.fw1024=now()+12;A.sfx('bell');after(.6,()=>A.sfx('bell'));after(1.2,()=>A.sfx('bell'));after(1.9,()=>A.sfx('fanfare'));
  const f=A.floorOf(me.y);S.cats.forEach(o=>{if(!o.hidden&&A.floorOf(o.y)===f&&!o.me){emote(o,'bang',1.4);if(!o.place&&A.idle(o)&&o.z==null)run(o,[{k:'sit',dur:2.4,ex:'lookUp'}],true)}});
  A.news('10:24 了：门厅的钟里探出一只猫报时');if(A.play)E.found('clock')}
tick(dt=>{if((ckChk+=dt)<1)return;ckChk=0;const d=new Date(),h=d.getHours(),m=d.getMinutes(),key=d.toDateString()+h;if((h===10||h===22)&&m===24&&ckLast!==key&&A.play){ckLast=key;chime()}});
A.events.clock=()=>chime();
// 钟上面的小门打开，一只小黄猫探出头来一下一下点头
A.drawers.push((L,vis)=>{if(!(S.cuckoo>now())||!vis(CK.x-10,CK.y-14,20,20))return;L.push([17,()=>{const t=now(),out=(Math.floor(t*1.5)%2)?2:0;R(CK.x-4,CK.y-13,9,8,OL);R(CK.x-3,CK.y-12,7,6,'#2a1820');
  R(CK.x-3,CK.y-12+3-out,7,5,'#ffd84a');P1(CK.x-3,CK.y-13+3-out,'#ffd84a');P1(CK.x+3,CK.y-13+3-out,'#ffd84a');P1(CK.x-1,CK.y-10+3-out,OL);P1(CK.x+1,CK.y-10+3-out,OL);if(out)P1(CK.x,CK.y-8,'#e27a8f');
  if(Math.floor(t*3)%2){P1(CK.x+7,CK.y-14,'#fff4dc');P1(CK.x+8,CK.y-15,'#fff4dc')}}])});
// 舞台背板上一场 1024 烟花
A.overs.push(vis=>{if(!(S.fw1024>now()))return;const B=P.backdrop;if(!vis(B.x,B.y,B.w,B.h))return;const t=now();
  for(let i=0;i<5;i++){const per=1.4,k=((t+i*.29)%per)/per,cx=B.x+20+((i*67+Math.floor((t+i*.29)/per)*41)%(B.w-40)),cy=B.y+14+((i*29)%40),col=['#ffd84a','#ff6ac8','#4fd8ff','#7ee08a','#fff4dc'][i];
    alpha(1-k,()=>{for(let a=0;a<12;a++){const q=a/12*Math.PI*2,r=2+k*16;P1(Math.round(cx+Math.cos(q)*r),Math.round(cy+Math.sin(q)*r*.8),col)}})}
  if(Math.floor(t*3)%2)txt('10:24',B.x+Math.floor((B.w-txtW('10:24',2))/2),B.y+B.h-16,'#ffd84a',2)});

/* ================= 老秘籍：上上下下左右左右 B A，你的猫变成彩虹色一分钟 ================= */
// 在最前面听按键（capture）：按到第九个 B 的时候把这一下吃掉，不然 B 会打开图鉴
const KS=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];let ki=0;
if(typeof window!=='undefined'&&A.play)window.addEventListener('keydown',e=>{if(e.repeat)return;const k=(e.key||'').toLowerCase();
  if(k===KS[ki]){if(ki===8){e.preventDefault();e.stopImmediatePropagation()}ki++;if(ki===KS.length){ki=0;me.rainbowUntil=now()+60;A.sfx('fanfare');emote(me,'heart',1.6);say('……你的猫变成了彩虹色（一分钟）');E.found('konami')}}
  else ki=k===KS[0]?1:0},true);
});
