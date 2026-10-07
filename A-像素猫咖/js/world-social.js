/* 1024 猫咖 · 猫和猫（设计见 docs/店内设计.md 第五节）。依赖 world-acts.js、world4-desk.js、world4-guide.js（在它们后面加载），world-online.js 再包在它外面。
   - 你和一只猫：E 按它在干什么来——坐着趴着就蹭蹭，在走在玩就一起玩，在睡就挨着睡；右键菜单里是全部（蹭蹭、舔舔毛、碰碰鼻子、一起玩、挨着睡、跟着走、传球）。
   - 别的猫之间也会：走个对面碰碰鼻子，趴在一块儿互相舔毛，闲着的追着玩，想睡的挨着睡着的猫睡；三只以上挤在一起睡叫"猫饼"。
   - 店猫记得你：六只店猫各有最多三颗心；同一只猫一分钟只算一次，每只爱的不一样；熟到三颗心，各有一样待遇（见文档里的表）。
   A.social(c,o,kind)：kind 是 auto / rub / groom / boop / play / nap / follow / pass。 */
WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,speak,say,sfx,news,after,dist,idle,land,faceTo,borrow,setK,settle,unclaim,roomAt,TID,T}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,tick=f=>A.tickers.push(f),isBot=c=>c.kind==='bot',atMe=(p,d=200)=>A.play&&near(me,p,d);
const NAME={rub:'蹭蹭',groom:'舔舔毛',boop:'碰碰鼻子',play:'一起玩',nap:'挨着睡'};
// 能不能让它停下来回应：店猫、补位的猫，闲着、不在家具上、不在忙
const free=o=>!o.me&&!o.puppet&&!o.hidden&&!o.place&&!o.working&&!o.riding&&!o.leaving&&!o.hold&&o.z==null;
const busyMe=()=>me.place||me.hidden||A.busy();
const autoKind=(c,o)=>o.k==='sleep'?'nap':o.k.startsWith('walk')||PLAYS.includes(o.k)||o.k==='pounce'||o.k==='leap'?'play':'rub';
const side=(c,o,d=13)=>land(o.x+(c.x<o.x?-d:d),o.y+rr(-1,1));
A.socialLabel=(c,o)=>{const k=autoKind(c,o);return k==='nap'?`挨着${o.name}睡`:k==='play'?`和${o.name}一起玩`:'蹭蹭'+o.name};

/* ---------- 店猫的好感 ---------- */
const LOVE={1:{x:1.5,like:['groom','rub'],perk:'你走到沙发边，它会从沙发上跳下来给你舔舔毛'},2:{x:.6,like:['boop'],perk:'传球给它不会再拍回来；舔爪的时候碰它也不生气了；还让你跳上机柜顶，挤在一起取暖'},
  3:{x:1.3,like:['play'],perk:'你在它附近，它常跑过来拉你一起玩'},4:{x:1,like:['boop'],perk:'有时候给你叼来一本书，翻开是写着你的那一页'},
  5:{x:1.3,like:['play'],perk:'会把它抓到的东西叼来分给你'},6:{x:1,like:['nap'],perk:'让你跳上吧台，挨着它一起睡'}};
const BASE={rub:1,groom:2,boop:1,play:2,nap:2},HEART=[0,3,7,12];
const FR=()=>A.guide.friends(),hearts=pal=>{const v=FR()[pal]||0;return v>=12?3:v>=7?2:v>=3?1:0};
A.friendHearts=hearts;A.isFriend=pal=>hearts(pal)>=3;
const loveCD={};
function love(o,kind,d){if(o.kind!=='npc'||!LOVE[o.pal])return;const L=LOVE[o.pal],F=FR();
  if(d==null){if(now()-(loveCD[o.pal]||-99)<60)return;loveCD[o.pal]=now();d=BASE[kind]*L.x*(L.like.includes(kind)?2:1)}
  const h0=hearts(o.pal);F[o.pal]=Math.max(0,Math.min(20,(F[o.pal]||0)+d));A.guide.save();const h1=hearts(o.pal);
  if(h1>h0){S.hearts.push({x:Math.round(o.x),y:Math.round((o.top??o.y-20)-4),t0:now()});
    if(h1===3)A.ui.discover&&A.ui.discover({n:`${o.name}把你当朋友了`,what:`${o.name}：${L.perk}。`,tie:'猫猫咖啡馆的猫会记住你：谁和谁熟、你喜欢什么。图书馆里专门有一架「人物关系」。'});
    else say(`${o.name}和你熟了一点（${'♥'.repeat(h1)}${'♡'.repeat(3-h1)}）`)}}
A.love=love;

/* ---------- 几种互动 ---------- */
// 走到对方旁边（对方闲着就停下来面对你）
const meet=(c,o,d)=>[{chase:()=>side(c,o,d),near:4},{fn:c=>{faceTo(c,o);if(free(o)&&idle(o)){faceTo(o,c);run(o,[{k:o.k==='sleep'?'sleep':'sit',dur:2.2,ex:o.k==='sleep'?undefined:'content'}])}}}];
const note=(c,o,a,b)=>{if(c.me)say(a);else if(o.me)say(b)};
function groom(c,o){run(c,[...meet(c,o,11),{k:'lick',dur:DUR.lick,fn:c=>{if(atMe(c))sfx('groom');if(!o.me&&!o.puppet&&free(o)&&idle(o))run(o,[{k:'sit',dur:2.4,ex:'sleepy'}]);else emote(o,'heart',1.6)}},
  {fn:c=>{S.hearts.push({x:Math.round(o.x),y:Math.round((o.top??o.y-20)-2),t0:now()});note(c,o,`给${o.name}舔了舔毛，它眯起了眼睛`,`${c.name}给你舔了舔毛`);done(c,o,'groom')}},{k:'sit',dur:.6,ex:'content',soft:1}])}
function boop(c,o){run(c,[...meet(c,o,9),{k:'sit',dur:.5,ex:'curious'},{fn:c=>{const x=Math.round((c.x+o.x)/2),y=Math.round(Math.min(c.top??c.y-18,o.top??o.y-18)+8);S.hearts.push({x,y:y-4,t0:now()});spark(x,y,now());if(atMe(c))sfx('boop');
    if(!o.me&&!o.puppet&&free(o))borrow(o,'sit',.8,'happy');note(c,o,`和${o.name}碰了碰鼻子`,`${c.name}碰了碰你的鼻子`);done(c,o,'boop')}},{k:'happy',dur:.6,soft:1}])}
function playWith(c,o){const go=free(o)&&(idle(o)||o.k.startsWith('walk'));if(atMe(c))sfx('scuffle');
  const away=(a,b)=>land(a.x+(a.x<b.x?-1:1)*rr(26,40),a.y+rr(-10,10));
  run(c,[{fn:c=>faceTo(c,o)},{k:'pounce',dur:.7},{jump:()=>side(c,o,6),h:10,dur:.32},{fn:c=>{if(go){run(o,[{jump:away(o,c),h:12,dur:.36},{fn:o=>faceTo(o,c)},{k:'pounce',dur:.6},{jump:()=>side(o,c,6),h:10,dur:.32},{k:'belly',dur:1.2},{k:'happy',dur:.6}])}
      else{emote(o,'bang',1);if(o.me&&!busyMe())run(me,[{k:'alert',dur:.6,soft:1}])}}},
    {k:'sit',dur:go?1.4:.3,ex:'happy'},{jump:()=>away(c,o),h:10,dur:.34},{k:'belly',dur:1.2},{k:'happy',dur:.6,soft:1},
    {fn:c=>{note(c,o,`和${o.name}追着玩了两圈`,`${c.name}扑过来找你玩`);done(c,o,'play')}}])}
function napWith(c,o){const p=side(c,o,12);
  if(c.me){run(me,[{go:p},{fn:()=>{faceTo(me,o);settle(me,{k:'sleep'});say(`挨着${o.name}睡下了`);done(me,o,'nap')}}]);return}
  run(c,[{go:p},{fn:c=>{faceTo(c,o);if(o.me)say(`${c.name}挨着你睡下了`);done(c,o,'nap')}},{k:'lie',dur:1.2,ex:'sleepy'},{k:'sleep',dur:rr(14,30)},{k:'stretch',dur:DUR.stretch,soft:1}])}
function done(c,o,kind){if(c.me){love(o,kind);A.emit('social',kind)}if(A.onSocial)A.onSocial(c,o,kind)}
const social0=A.social;
A.social=(c,o,kind='auto')=>{if(!o||o.gone)return;if(o.desk||kind==='pass'||kind==='follow')return social0(c,o,kind);
  if(kind==='auto'){if(c.hold&&!c.hold.knit)return social0(c,o,'pass');kind=autoKind(c,o)}
  if(kind==='rub'){social0(c,o,'rub');if(c.me){love(o,'rub');A.emit('social','rub')}return}
  if(o.kind==='npc'&&o.pal===2&&o.k==='lick'&&c.me&&!A.isFriend(2)){emote(o,'anger',1.6);say('砚砚在舔爪，别打扰它');love(o,'',-1);return}
  ({groom,boop,play:playWith,nap:napWith})[kind]?.(c,o)};

/* ---------- 猫饼：三只以上挤在一起睡 ---------- */
let pileT=0;const pileSaid={};
tick(dt=>{if((pileT-=dt)>0)return;pileT=1.2;const sl=S.cats.filter(c=>c.k==='sleep'&&!c.hidden&&!c.gone&&c.z==null);if(sl.length<3)return;
  for(const a of sl){const g=sl.filter(b=>near(a,b,20));if(g.length<3)continue;const r=roomAt(a.x,a.y),key=r.id;if(now()-(pileSaid[key]||-999)<90)continue;pileSaid[key]=now();
    const x=Math.round(g.reduce((s,c)=>s+c.x,0)/g.length),y=Math.round(Math.min(...g.map(c=>c.top??c.y-14)));for(let i=0;i<3;i++)A.fx.push({kind:'note',x:x+rr(-8,8),y:y-2,t0:now()+i*.4,life:1.6});
    news(`${g.length} 只猫在${r.n}挤成了一团猫饼`);if(g.includes(me)){say('猫饼！');A.emit('social','pile')}else if(atMe(a,160))say(`${g.length} 只猫挤成了一团猫饼`);break}});

/* ---------- 别的猫之间：碰鼻子、舔毛、追着玩、挨着睡 ---------- */
const think0=A.think;
A.think=c=>{if(c.kind==='bot'&&!c.hold&&!c.working&&!c.followT&&!c.leaving){const p=c.mood==='social'?.3:c.mood==='rest'||c.mood==='afk'?.16:.04;if(Math.random()<p&&autoSocial(c))return}
  if(c.kind==='npc'&&!c.atHome&&!c.hold&&!c.working&&Math.random()<.06&&autoSocial(c))return;think0(c)};
function autoSocial(c){const fl=A.floorOf(c.y),L=S.cats.filter(o=>o!==c&&!o.hidden&&!o.gone&&o.z==null&&!o.puppet&&!o.leaving&&!o.desk&&A.floorOf(o.y)===fl&&near(o,c,c.mood==='rest'||c.mood==='afk'?260:140)&&(!o.me||!busyMe()&&Math.random()<.25));if(!L.length)return false;
  if(c.mood==='rest'||c.mood==='afk'){const o=L.filter(o=>o.k==='sleep')[0];if(o){napWith(c,o);return true}}
  const o=rnd(L),k=o.k==='sleep'?(Math.random()<.6?'nap':'groom'):o.k.startsWith('walk')?(Math.random()<.6?'boop':'play'):rnd(['groom','boop','boop','play']);
  if(k==='play'&&!(free(o)||o.me))return false;A.social(c,o,k);return true}

/* ---------- 熟了以后：每只店猫的待遇 ---------- */
let perkT=8;const NPCS=()=>S.cats.filter(c=>c.kind==='npc');
tick(dt=>{if(!A.play||(perkT-=dt)>0)return;perkT=rr(20,40);if(busyMe()||me.hold||A.dlg.open||A.vista.on)return;
  const cand=NPCS().filter(o=>A.isFriend(o.pal)&&!o.hidden&&idle(o)&&!o.working&&!o.hold&&near(o,me,220)&&A.floorOf(o.y)===A.floorOf(me.y));const o=rnd(cand);if(!o)return;
  // 宪宪平时窝在沙发最左边：跳下来给你舔舔毛，再回去
  if(o.pal===1){if(!near(o,me,90))return;const h=A.HOMES[1];if(o.atHome){o.atHome=false;run(o,[{jump:{...h.floor}},{fn:o=>{o.z=undefined;groom(o,me);run(o,A.goHome(o),true)}}])}else{groom(o,me);run(o,A.goHome(o),true)}}
  else if(o.pal===3)playWith(o,me);
  else if(o.pal===4)gift(o,'book');
  else if(o.pal===5)gift(o,rnd(['paper','leaf','toy']));});
S.gifts=[];
function gift(o,k){run(o,[{chase:()=>side(o,me,14),near:6},{fn:o=>{faceTo(o,me);S.gifts.push({k,x:Math.round((o.x+me.x)/2),y:Math.round(me.y+3),t0:now()});
  say(k==='book'?'小狸花给你叼来一本书。翻开，「人物关系」那一架里，有一页写着你':k==='toy'?`斑斑把它抓到的玩偶叼来送给你`:k==='paper'?'斑斑把一个纸团叼来，放在你脚边':'斑斑叼来一片枫叶，放在你脚边');emote(o,'heart',1.6)}},{k:'happy',dur:.8,soft:1}])}
tick(()=>{S.gifts=S.gifts.filter(g=>now()-g.t0<40)});
A.floors.push(vis=>S.gifts.forEach(g=>{if(!vis(g.x-6,g.y-6,12,10))return;if(g.k==='book')book(g.x-3,g.y-2,4);else if(g.k==='paper')paperBall(g.x,g.y);else if(g.k==='leaf')leaf(g.x,g.y,0,1);else{disc(g.x,g.y-1,3,2,OL);disc(g.x,g.y-1,2,1,'#f4a6b8')}}));
// 砚砚：熟了以后传球不再拍回来（world-acts.js 的 receive 读 A.isFriend）；让你上机柜顶，挤在一起取暖
const yan=()=>A.byName('砚砚'),gold=()=>A.byName('金哥');
const RT2={x:P.rackTop.x-11,y:P.rackTop.y,z:P.rackTop.z,face:'R'};
T({id:'rackfriend',n:'服务器机柜',hidden:()=>!A.isFriend(2)||!(yan()&&yan().atHome),at:P.rackFloor,near:[P.rackFloor.x-16,P.rackFloor.y-12,32,22],hit:()=>null,label:'跳上机柜顶，和砚砚挤在一起取暖',ok:c=>!c.hold,
  go(c){run(c,[{go:P.rackFloor},{jump:{...RT2}},{fn:c=>{settle(c,{k:'lie',ex:'content',face:'R',leave:()=>[{jump:{...P.rackFloor}},{fn:c=>{c.z=undefined}}]});say('和砚砚挤在机柜顶上，暖烘烘的');const y=yan();if(y)emote(y,'heart',1.6)}}])}});
const GT2={x:P.counterTop.x-14,y:P.counterTop.y,z:P.counterTop.z,face:'R'};
T({id:'goldnap',n:'吧台',hidden:()=>!A.isFriend(6)||!(gold()&&gold().atHome),at:P.counterFloor,near:[P.counterFloor.x-18,P.counterFloor.y-12,36,22],hit:()=>null,label:'跳上吧台，挨着金哥睡',ok:c=>!c.hold,
  go(c){run(c,[{go:P.counterFloor},{jump:{...GT2}},{fn:c=>{settle(c,{k:'sleep',face:'R',leave:()=>[{jump:{...P.counterFloor}},{fn:c=>{c.z=undefined}}]});say('挨着金哥睡在吧台上');const g=gold();if(g)emote(g,'heart',1.6)}}])}});
});
