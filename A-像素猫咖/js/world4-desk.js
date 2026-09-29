/* 1024 猫咖 · 场景 v4 前台猫：不知道玩什么、不知道找谁的时候，问它。依赖 world4-things.js、world4-quest.js、world4-guide.js（在它们后面加载）。
   对应猫猫咖啡馆正在做的"猫猫球"（F229）：前台猫是一个岗位，不是一只新猫；默认长相是布偶猫，名字由全家投票起。
   - 前台：入场纸箱左上方一张小桌子，桌上一只服务铃。点它就能问：
     听说店里有棵大树（没去过中庭时才有这一问，它带你去）、这附近有什么好玩的（它带你走过去）、我是哪只猫、毛线球怎么解、猫猫咖啡馆是什么、你是谁、打开图鉴
   - 店猫搭话：你在一间房里待了一会儿、什么都没碰，附近醒着的店猫偶尔朝一样你没玩过的东西看过去，说一句。至少隔 50 秒，一样东西只说一次
   画面上不给东西加记号：鼠标移到能玩的东西上会变成猫爪（页面里做）；走近了，按 E 会用到的那一样头上有 E 键帽（world4-guide.js）。 */
(()=>{const M=WORLD,P=WP;
Object.assign(P,{fdesk:{x:160,y:176},fdeskTop:{x:172,y:180,z:198.5,face:'R'},fdeskFloor:{x:176,y:208},bell:{x:184,y:172}});
M.BLOCK.push([160,190,36,8]);
M.props.push({x:156,y:166,w:44,h:34,base:198,draw:(t,S)=>{frontDesk(P.fdesk.x,P.fdesk.y);serviceBell(P.bell.x,P.bell.y,t,S.bellT||0)},ver:S=>S.bellT>0?Math.floor(S.now*12)%2+1:0});
})();

WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,pickW,run,setK,idle,emote,speak,say,sfx,T,TH,dist,findPath,roomAt,faceTo,land}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,tick=f=>A.tickers.push(f),val=(v,...a)=>typeof v==='function'?v(...a):v;
const G=A.guide,NAME='前台猫',tipOf=k=>TIPS[k]?{...TIPS[k],key:k}:null;
S.bellT=0;tick(dt=>{S.bellT=Math.max(0,S.bellT-dt)});
const cat=A.mkCat(1,NAME,{kind:'desk',desk:1,def:'content',myFace:'content',sp:30,...P.fdeskTop});S.cats.push(cat);
const onDesk=()=>cat.z!=null&&near(cat,P.fdeskTop,3);
const backSteps=()=>[{go:P.fdeskFloor},{jump:{...P.fdeskTop}},{fn:c=>{c.face='R';setK(c,'sit')}}];
const ring=()=>{S.bellT=.7;sfx('bell')};

/* ---------- 能玩的东西：GUIDE 的一条 ↔ 店里的一样（毛线篮、橱窗、书架……有好几个） ---------- */
// 一会儿有一会儿没有、或者要看天气的，不推荐
const SKIP=['treatBit','pop','dot','fly','paper','sunA','sunB','bath','pile','toyback'];
const center=th=>{const h=val(th.hit,me);if(h)return{x:h[0]+h[2]/2,y:h[1]+h[3]/2};return val(th.at,me)};
function thingOf(id){const L=TH.filter(t=>GID(t.id)===id&&!(t.hidden&&t.hidden(me))&&(!t.ok||t.ok(me)));return L.sort((a,b)=>dist(center(a),me)-dist(center(b),me))[0]||null}
// 推荐三样没玩过的：同一间房、近的优先，和猫猫咖啡馆特性有关的再往前挪一点；一间房最多两样
function suggest(n=3){const L=[],here=roomAt(me.x,me.y).id;for(const k in GUIDE){if(G.disc[k]||SKIP.includes(k))continue;const th=thingOf(k);if(!th||!val(th.at,me))continue;const g=GUIDE[k],at=val(th.at,me);
    L.push({k,g,th,d:dist(center(th),me)-(g.tie?110:0)-(g.tip?50:0)+(roomAt(at.x,at.y).id===here?0:160)})}
  L.sort((a,b)=>a.d-b.d);const out=[],per={};for(const s of L){const r=roomAt(val(s.th.at,me).x,val(s.th.at,me).y).id;if((per[r]||0)>=2)continue;per[r]=(per[r]||0)+1;out.push(s);if(out.length>=n)break}return out}

/* ---------- 带路：走一小段、回头等你，到了就坐在旁边看你玩 ---------- */
let lead=null;
function startLead(k,th){const at=val(th.at,me),c=center(th),side=at.x>=cat.x?-1:1;
  lead={k,th,g:GUIDE[k],c,sp:land(at.x+side*16,at.y+3),t0:now(),said:0,far:0,phase:'go',used:false};
  speak(cat,'跟我来～',2);ring();run(cat,[...(onDesk()?[{jump:{...P.fdeskFloor}}]:[]),{k:'happy',dur:.4}]);cat.wait=0}
function endLead(msg,d=.2){lead=null;if(msg)speak(cat,msg,2.4);run(cat,[{k:'sit',dur:d},...backSteps()]);cat.wait=1}
A.on('use',g=>{if(lead&&g===lead.k)lead.used=true});
const campT0=A.campTarget;A.campTarget=()=>lead?null:campT0();   // 带路的时候，训练营的箭头先收起来
function leadStep(c,L){c.wait=.25;const t=now();
  if(L.used){faceTo(c,me);endLead(rnd(['就是这样～','会了吧～','玩得开心～']),1.2);return}
  if(t-L.t0>100){endLead('那我先回前台啦');return}
  if(L.phase==='go'){
    if(near(c,L.sp,6)){L.phase='show';L.showT=t;faceTo(c,L.c);setK(c,'sit');speak(c,'就是这个！'+(HEY[L.k]||'去试试～'),5);return}
    const dm=dist(c,me);
    if(dm>72){L.far+=.25;if(dm>260&&L.far>12){endLead('那我先回前台啦');return}faceTo(c,me);if(c.k!=='sit')setK(c,'sit');if(t-L.said>7){L.said=t;speak(c,'这边～',1.6)}return}
    L.far=0;const path=findPath(c.x,c.y,L.sp.x,L.sp.y);if(!path){endLead('咦，过不去');return}
    let rem=56,cur={x:c.x,y:c.y},pt=null;for(const p of path){const d=Math.hypot(p.x-cur.x,p.y-cur.y);if(d>=rem){pt={x:cur.x+(p.x-cur.x)*rem/d,y:cur.y+(p.y-cur.y)*rem/d};break}rem-=d;cur=p;pt=p}
    run(c,[{go:pt}]);return}
  // 到了：坐在旁边看你玩，30 秒没动静就回去
  faceTo(c,L.c);if(t-L.showT>30||dist(c,me)>300)endLead()}

/* ---------- 不带路的时候：坐在桌上；你走近了抬爪招呼一下（一次） ---------- */
let wasNear=false,waveT=-99,greeted=false;
function deskThink(c){if(lead)return leadStep(c,lead);if(!onDesk()){run(c,backSteps());return}
  c.wait=rr(6,12);if(near(me,c,70)&&!me.hidden){faceTo(c,me);setK(c,rnd(['sit','sit','lick']));return}
  setK(c,pickW({sit:3,lick:1,knead:1,sleep:S.tod==='night'?3:1}))}
const think0=A.think;A.think=c=>c.desk?deskThink(c):think0(c);
tick(()=>{if(!A.play||lead)return;const n=near(me,cat,56)&&!me.hidden;
  if(n&&!wasNear&&now()-waveT>25&&onDesk()&&!A.dlg.open){waveT=now();faceTo(cat,me);run(cat,[{k:'maneki',dur:1.6},{k:'sit',dur:.1}]);cat.wait=2;
    if(!greeted&&!G.count()){greeted=true;speak(cat,'新来的？有事问我～',3)}}
  wasNear=n});

/* ---------- 对话框 ---------- */
const HEAD={icon:'bell',title:NAME,chips:['有事问我']};
const say1=t=>({k:'say',pal:1,name:NAME,t});
const BACK=[{id:'back',t:'回去'},{id:'close',t:'再逛逛',key:'Esc'}];
function page(id){const q=A.Q&&A.Q.cur,ball=me.hold&&!me.hold.knit;let spec,pick=null;
  if(id==='menu'){const items=[...(q&&ball?[{id:'quest',t:'我叼着的这颗球，该怎么解？',sub:'再看一眼便签'}]:[]),
      ...(G.disc.yarntree?[]:[{id:'tree',t:'听说店里有棵大树？',sub:'就在店的正中间，我带你去'}]),{id:'fun',t:'这附近有什么好玩的？',sub:'我带你过去'},{id:'me',t:'我是哪只猫？'},{id:'ball',t:'毛线球是什么？怎么解？'},
      {id:'cafe',t:'猫猫咖啡馆是什么？',sub:'官网、GitHub、内源主页'},{id:'who',t:'你是谁？'},{id:'book',t:'把图鉴给我看看',sub:'全店能玩的都在里面（B）'}];
    const hi=G.count()?rnd(['又见面啦～今天想玩点什么？','想去哪儿？我带你去。','有什么想问的？']):'欢迎光临！第一次来吧？想玩什么、想找谁，问我就好。';
    spec={blocks:[say1(hi),{k:'choices',cols:2,items}],tip:tipOf('concierge'),acts:[{id:'close',t:'再逛逛',key:'Esc'}]};pick=i=>go(items[i].id)}
  else if(id==='fun'){const L=suggest(3);
    spec=L.length?{blocks:[say1('这几样你还没玩过，都不远：'),{k:'choices',items:L.map(s=>({t:s.g.n,sub:roomAt(val(s.th.at,me).x,val(s.th.at,me).y).n+' · '+s.g.what}))}],tip:tipOf(L[0].g.tip),acts:BACK}
      :{blocks:[say1('店里能玩的，你差不多都玩过啦！去毛线篮叼一颗球吧。')],acts:BACK};
    pick=i=>{const s=L[i];if(!s)return;A.dlg.close();startLead(s.k,s.th)}}
  else if(id==='ball'){const items=ball?[]:[{t:'带我去毛线篮'}];
    spec={blocks:[say1('门缝里塞进来的便签，就是一颗毛线球：人类想请猫帮的忙。'),
      {k:'steps',items:[{t:'叼一颗',sub:'前厅的毛线篮里就有'},{t:'看便签',sub:'对话框会告诉你这颗球怎么解'},{t:'解开',sub:'有时要找对的猫，有时要去图书馆翻书，有时要几只猫一起'},
        {t:'挂进橱窗',sub:'织好的东西叼去橱窗长廊'},{t:'等回信',sub:'人类取走以后，会回一封信'}]},...(items.length?[{k:'choices',items}]:[])],tip:tipOf('ball'),acts:BACK};
    pick=()=>{const th=thingOf('basket')||thingOf('knock');A.dlg.close();if(th)startLead(GID(th.id),th)}}
  else if(id==='cafe')spec={blocks:[say1('这家店，是照着猫猫咖啡馆开的。'),
      {k:'text',t:'猫猫咖啡馆（Clowder AI）把一个个孤立的 AI agent 变成一个团队：Claude、GPT、Gemini……每只猫有自己的身份、能力画像和长期记忆，互相 @、互相 review；你只管愿景、拍板和反馈。'},
      {k:'links',items:['inner','site','github'].map(k=>({key:k,...LINKS[k]}))}],tip:tipOf('multi'),acts:BACK};
  else if(id==='who')spec={blocks:[say1('我是前台猫。不知道找谁的时候，喊我就行。'),
      {k:'text',t:'实际上，猫猫咖啡馆的前台猫是一个岗位，不是一只新猫：长相默认是布偶猫，名字由全家投票来起，背后是哪只猫在值班也可以配置。它帮你找功能、翻以前聊过的事；深一点的活，它转给对应的猫。'}],
    tip:tipOf('concierge'),acts:BACK};
  spec={id:'desk-'+id,kind:'desk',head:HEAD,...spec};
  return{spec,h:{pick:i=>{if(pick)pick(i)},act:a=>{if(a==='back'){go('menu');return true}}}}}
function go(id){
  if(id==='quest'){A.dlg.close();A.Q.open();return}
  if(id==='me'){A.dlg.close();A.findMe();speak(cat,'黄色描边、脚下一圈光的就是你～',3.5);return}
  if(id==='book'){A.dlg.close();A.ui.book&&A.ui.book();return}
  if(id==='tree'){const th=thingOf('yarntree');A.dlg.close();if(th){speak(cat,'那棵树可大了，跟我来～',2.4);startLead('yarntree',th)}return}
  const p=page(id);A.dlg.show(p.spec,p.h)}
function talk(){if(lead){speak(cat,lead.phase==='go'?'跟我来～':'就是这个！',1.6);return}faceTo(cat,me);faceTo(me,cat);ring();go('menu')}
A.openDesk=talk;A.desk={cat,get lead(){return lead}};

// 走到桌前按 E、点桌子；点猫本身走 A.social
T({id:'deskcat',n:NAME,hit:()=>[P.fdesk.x,P.fdesk.y-18,36,40],at:()=>({x:P.fdeskFloor.x,y:P.fdeskFloor.y+2}),near:()=>[P.fdesk.x-6,P.fdesk.y+20,48,24],
  hidden:()=>!!lead||!onDesk(),label:'问问前台猫',go:c=>{if(c.me)talk()}});
const social0=A.social;A.social=(c,o,kind='auto')=>{if(o&&o.desk&&c.me&&kind!=='follow'){if(kind==='pass'){speak(o,'球要交给对的猫哦',2.2);return}talk();return}return social0(c,o,kind)};
const pass0=A.pass;A.pass=(c,o)=>{if(o&&o.desk){if(c.me){speak(o,'球要交给对的猫哦',2.2);say('前台猫不接球：它帮你找路，活要交给对应的猫')}return}return pass0(c,o)};

/* ---------- 店猫搭话：很少说，一次只说一样你没玩过的 ---------- */
const HEY={basket:'篮子里有毛线球，叼一颗？',knock:'扒拉一下门，会塞进来球',cork:'看板上贴的都是没解的球',stand:'立牌上写着咱们店的来历',starjar:'星星罐子，打开大家都会停下',
  post:'猫抓柱，磨磨爪子超解压',plant:'那盆草，蹭一下会晃',coffee:'咖啡机会自己咕嘟',bigbox:'大纸箱能挤三只',bed:'那个猫窝可软了',
  win:'空着嘴也能趴在窗台上，看看街对面',board:'小黑板记着今天交付了几件',paw:'墙边有印泥，按个爪印吧',stage:'背景板前拍张照？',camera:'相机能拍合照',
  desk:'CI 红了就去踩键盘',duck:'叼着球跟小黄鸭讲讲，解得快',printer:'打印机能打出纸团',rack:'机柜顶上最暖',tools:'工具墙上是咱们的家伙什',merge:'合并门禁：三盏灯全亮才放行',giant:'大毛线团要几只猫一起扒拉',bean:'懒人沙发，陷进去就不想起',
  feed:'饿了去喂食器',fountain:'流水饮水机，喝口水',plate:'零食机要三只猫同时踩爪垫',treat:'零食机，研究一下？',table:'桌上的小东西，推下去！',grass:'猫草，啃两口',tank:'鱼缸里有鱼……',
  kotatsu:'暖桌里能钻六只',fire:'壁炉前最舒服',sofa:'沙发最左边是宪宪的位置',tree:'爬架能一层层跳上去',piano:'地板钢琴，踩上去就响',bubbler:'泡泡机，打开试试',laser:'激光逗猫器！',tunnel:'隧道从这头钻到那头',catnip:'猫薄荷鱼，闻一下',
  wheel:'跑轮跑起来，串灯会亮',hammock:'吊床晃呀晃',toyback:'地上那个，叼回桌上吧',winseat:'窗边软座，夜里能等流星',
  yarntree:'爬到树顶，能看整条街',treeplaque:'树下的铭牌，写着这棵树的来历'};
let roomId=null,inRoom=0,quiet=0,heyT=-40,chk=0;const heard=new Set();
A.on('use',()=>{quiet=0});
tick(dt=>{if(!A.play)return;const r=roomAt(me.x,me.y).id;if(r!==roomId){roomId=r;inRoom=0}inRoom+=dt;quiet+=dt;if((chk-=dt)>0)return;chk=1;
  if(lead||A.dlg.open||me.hold||me.hidden||me.place||A.Q&&A.Q.cur||inRoom<15||quiet<20||now()-heyT<50)return;
  let best=null;for(const th of TH){const k=GID(th.id);if(!k||!HEY[k]||G.disc[k]||heard.has(k)||SKIP.includes(k))continue;if(th.hidden&&th.hidden(me)||th.ok&&!th.ok(me))continue;
    const p=center(th);if(!p)continue;const d=dist(p,me);if(d<110&&(!best||d<best.d))best={k,p,d}}
  if(!best)return;
  const o=S.cats.filter(c=>(c.kind==='npc'||c===cat&&onDesk())&&!c.hidden&&!c.working&&!c.hold&&idle(c)&&c.k!=='sleep'&&near(c,me,140)).sort((a,b)=>dist(a,me)-dist(b,me))[0];if(!o)return;
  heyT=now();heard.add(best.k);if(o.z==null)faceTo(o,best.p);speak(o,HEY[best.k],4.5)});
});
