/* 1024 猫咖 · 联机（店里这一侧）。设计见 docs/联机.md。和网络之间只有两个口子：A.live.recv(msg) 收、A.live.send(obj) 发，app.js 把它们接到 Net 上。
   - 真人的猫（puppet）：只跟着网络走。收到的状态放进小缓冲，画 0.25 秒以前的那一刻：位置按时间插值，姿态、朝向、表情脸、叼着什么照抄。
     自己的状态每 0.15 秒看一次，变了才发。画面外的猫服务端每秒只给位置（小地图用），走进画面时补上完整状态。
   - 表情、快捷短语、蹭蹭、传球、挂进橱窗接到网络上。传球给真人只传题号，对方接着做同一道题；走流程的 Review 那一步可以请真人看一眼。
     传球是服务端记着的一笔事务：接球的一收到就回"接住了"（got）或"还回去"（back），球不会凭空多一颗或少一颗。
   - 机器人补位：bots 减去在线真人数，最少留 12 只（多猫任务要帮手）。真人的名字全店唯一，机器人撞了名就自己改名。
   - 联机时（A.shared）巨树和小黑板跟着服务端的计数走；断线 10 秒后真人的猫离开，恢复各算各的。
   WORLD_MODS 里放在最后：它包在别的模块的 A.pass / A.onEmote / A.onSay / A.onHang 外面。 */
WORLD_MODS.push(A=>{
const {S,me,say,sfx,news,emote,speak,setK,roomAt}=A;
const now=()=>A.t,tick=f=>A.tickers.push(f),has=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const DELAY=.25,MIN_BOTS=12,SEND_EVERY=.15,PASS_WAIT=30;
const L=A.live={on:false,myId:null,send:()=>{},cats:new Map(),byN:new Map(),count:()=>L.cats.size,view:null};   // view：画面有多大（世界像素），app.js 填；服务端按它决定给你转哪些猫
A.shared=false;

/* ---------- 一只猫的状态：[x, y, z, dy, 姿态, 朝向, 表情脸, 叼着什么, 标志位] ---------- */
const okPose=k=>has(POSE,k),okFace=e=>has(FACES,e);
function holdOf(h){if(typeof h!=='string')return{hold:null,toy:null};let m=/^y([0-4])$/.exec(h);if(m)return{hold:{ci:+m[1],kind:null,knit:false},toy:null};
  m=/^(\w+):([0-4])$/.exec(h);if(m&&has(KNIT_NAMES,m[1]))return{hold:{ci:+m[2],kind:m[1],knit:true},toy:null};
  m=/^t:(\w+)$/.exec(h);if(m&&has(TOY_NAMES,m[1]))return{hold:null,toy:m[1]};return{hold:null,toy:null}}
function holdCode(c){const y=c.hold;if(y)return y.knit?y.kind+':'+y.ci:'y'+y.ci;return c.toy?'t:'+c.toy:0}
// 只发服务端认得的：姿态、表情脸不在表里就换成默认的（服务端会整条丢掉认不得的状态）
const myState=()=>[Math.round(me.x),Math.round(me.y),me.z==null?null:Math.round(me.z*2)/2,Math.max(-300,Math.min(20,Math.round(me.dy||0))),okPose(me.k)?me.k:'sit',me.face==='L'?1:0,okFace(me.ex)?me.ex:'',holdCode(me),(me.hidden?1:0)|(me.mirror?2:0)];
let lastSent='',lastView='',sendT=0;
tick(dt=>{if(!L.on)return;if((sendT-=dt)>0)return;sendT=SEND_EVERY;const v=L.view&&JSON.stringify(L.view);if(v&&v!==lastView){lastView=v;L.send({t:'v',v:L.view})}
  const s=myState(),j=JSON.stringify(s);if(j===lastSent)return;lastSent=j;L.send({t:'s',s})});

/* ---------- 真人的猫 ---------- */
const palOf=l=>l&&Number.isInteger(l.coat)&&l.coat>=0&&l.coat<9&&Number.isInteger(l.collar)&&l.collar>=0&&l.collar<6?7+l.coat*6+l.collar:7;
function claimName(n){const U=A.usedNames;for(const b of S.cats)if(b.kind==='bot'&&b.name===n){U.delete(n);let x;do x=n+(2+Math.floor(Math.random()*98));while(U.has(x));b.name=x;U.add(x)}U.add(n)}
function addCat(o){if(!o||typeof o.id!=='string'||o.id===L.myId||L.cats.has(o.id)||!Array.isArray(o.s))return null;const f=okFace(o.look&&o.look.face)?o.look.face:'normal';
  const c=A.mkCat(palOf(o.look),String(o.name||'').slice(0,16),{kind:'remote',puppet:true,rid:o.id,n:o.n,def:f,myFace:f,buf:[]});
  claimName(c.name);L.cats.set(o.id,c);L.byN.set(o.n,c);S.cats.push(c);push(c,o.s);put(c,o.s,+o.s[0]||0,+o.s[1]||0,+o.s[3]||0);return c}
function dropCat(id,quiet){const c=L.cats.get(id);if(!c)return;L.cats.delete(id);if(L.byN.get(c.n)===c)L.byN.delete(c.n);A.usedNames.delete(c.name);if(!quiet&&!c.hidden)S.puffs.push({x:c.x,y:c.y-4,t0:now()});c.gone=true}
// 停了很久再动：先补一份"刚才还停着"，免得它从很远慢慢滑过来
function push(c,s){const t=now(),B=c.buf,last=B[B.length-1];if(last&&t-last.t>.3)B.push({t:t-.1,s:last.s});B.push({t,s});if(B.length>40)B.splice(0,B.length-40)}
function put(c,s,x,y,dy){c.x=x;c.y=y;c.dy=dy;c.z=typeof s[2]==='number'?s[2]:null;const k=okPose(s[4])?s[4]:'sit',e=okFace(s[6])?s[6]:c.myFace;
  if(c.k!==k)setK(c,k,e);c.ex=e;c.face=s[5]?'L':'R';const H=holdOf(s[7]);c.hold=H.hold;c.toy=H.toy;c.yarn=H.hold&&!H.hold.knit&&PLAYS.includes(k)?H.hold.ci:null;
  const hid=!!(s[8]&1);if(c.hidden&&!hid)S.puffs.push({x:x,y:y-4,t0:now()});c.hidden=hid;c.mirror=!!(s[8]&2)}
// 画 0.25 秒以前的那一刻：前后两份之间按时间插值（相差 200 像素以上就直接跳过去）
tick(()=>{const rt=now()-DELAY;for(const c of L.cats.values()){const B=c.buf;if(!B.length)continue;while(B.length>=2&&B[1].t<=rt)B.shift();
  const a=B[0],b=B[1],s=a.s;let x=+s[0]||0,y=+s[1]||0,dy=+s[3]||0;
  if(b&&rt>a.t&&b.t>a.t&&Math.hypot(b.s[0]-x,b.s[1]-y)<200){const k=Math.min(1,(rt-a.t)/(b.t-a.t));x+=(b.s[0]-x)*k;y+=(b.s[1]-y)*k;dy+=((+b.s[3]||0)-dy)*k}
  put(c,s,x,y,dy)}});

/* ---------- 机器人补位 ---------- */
let base=null;const setBots0=A.setBots,want=()=>Math.max(Math.min(base,MIN_BOTS),base-L.cats.size);
A.setBots=(n,inst)=>{base=n;setBots0(want(),inst)};
const rebot=()=>{if(base!=null)setBots0(want())};

/* ---------- 收 ---------- */
let newsT=0,downT=0;
function welcome(m){L.myId=m.id;lastSent='';lastView='';sendT=0;for(const id of [...L.cats.keys()])dropCat(id,true);(m.cats||[]).forEach(addCat);L.on=true;A.shared=true;
  const w=m.world||{};if(Array.isArray(w.tree))A.tree.set(w.tree.filter(o=>o&&has(KNIT_NAMES,o.kind)));if(Number.isInteger(w.today)){S.count=w.today;L.day=w.day}rebot();
  // 断线期间被改了名、中了奖：重连时补上
  const my=m.me||{};if(my.name&&my.name!==me.name)renamed({id:L.myId,name:my.name});if(Array.isArray(my.prizes)&&my.prizes.length)A.ui.prizes&&A.ui.prizes(my.prizes)}
function batch(m){let n=0;(m.l||[]).forEach(k=>{const c=L.byN.get(k);if(c){dropCat(c.rid);n++}});
  (m.j||[]).forEach(o=>{const c=addCat(o);if(!c)return;n++;if(!c.hidden)S.puffs.push({x:c.x,y:c.y-4,t0:now()});if(now()>newsT&&(L.cats.size<20||Math.random()<.35)){newsT=now()+3;news(`${c.name} 上线了`)}});
  (m.u||[]).forEach(u=>{const c=Array.isArray(u)&&L.byN.get(u[0]);if(c&&Array.isArray(u[1])&&u[1].length===9)push(c,u[1])});
  // 画面外的猫只有位置：别的照旧
  (m.p||[]).forEach(u=>{const c=Array.isArray(u)&&L.byN.get(u[0]),b=c&&c.buf[c.buf.length-1];if(b&&typeof u[1]==='number'&&typeof u[2]==='number')push(c,[u[1],u[2],...b.s.slice(2)])});if(n)rebot()}
function rubbed(m){const a=L.cats.get(m.id),b=m.to===L.myId?me:L.cats.get(m.to);if(!a||!b)return;S.hearts.push({x:Math.round((a.x+b.x)/2),y:Math.round(Math.min(a.y,b.y)-14),t0:now()});
  if(b===me){emote(me,'heart',1.4);sfx('purr');say(`${a.name}蹭了蹭你`)}}
function hung(m){if(!has(KNIT_NAMES,m.kind)||!Number.isInteger(m.ci))return;const it={kind:m.kind,ci:m.ci%5},c=m.id===L.myId?me:L.cats.get(m.id);
  if(c&&!c.me&&roomAt(c.x,c.y).id==='gallery')A.hangShow(c,it);A.tree.add(it);if(m.gold)A.tree.bloom();
  // 小黑板：同一天里只往上涨，涨了才庆祝；换了一天（过了午夜）直接换成新的数
  if(Number.isInteger(m.today)){const up=m.day===L.day&&m.today>S.count;if(m.day!==L.day||up){S.count=m.today;L.day=m.day}if(up)A.cheer(c||me)}}
function renamed(m){const n=String(m.name||'').slice(0,16);if(!n)return;
  if(m.id===L.myId){me.name=me.label=n;say(`组织者把你的名字改成了「${n}」`);A.ui.renamed&&A.ui.renamed(n);return}
  const c=L.cats.get(m.id);if(c){A.usedNames.delete(c.name);c.name=n;claimName(n)}}
L.recv=m=>{switch(m.t){
  case 'welcome':return welcome(m);
  case 'b':return batch(m);
  case 'emo':{const c=L.cats.get(m.id),e=A.EMOTES[m.i];if(c&&e&&Number.isInteger(m.i)){if(e.e)emote(c,e.e,(e.dur||1.6)+.2);A.onEmote(c,m.i)}return}
  case 'ph':{const c=L.cats.get(m.id),s=Number.isInteger(m.i)&&PHRASES[m.i];if(c&&s){speak(c,s,3.5);A.onSay(c,s)}return}
  case 'rub':return rubbed(m);
  case 'pass':return incoming(m);
  case 'toss':{const a=L.cats.get(m.id),b=L.cats.get(m.to);if(a&&b&&Number.isInteger(m.ci))A.throwTo(a,b,{ci:m.ci%5});return}
  case 'back':return returned(m);
  case 'got':{const e=pend.get(m.p);if(e&&e.o.rid===m.id&&!e.rv)pend.delete(m.p);return}
  case 'woven':{const c=L.cats.get(m.id);if(has(KNIT_NAMES,m.kind))say(`${c?c.name:'一只猫'}把你传的毛线球织成了${A.kindOne(m)}，挂进了橱窗`);return}
  case 'hang':return hung(m);
  case 'rename':return renamed(m)}};
// 断线：真人的猫先停在原地，10 秒后离开；计数恢复各算各的
L.state=s=>{if(s!=='on'&&L.on){L.on=false;A.shared=false;downT=now()}};
tick(()=>{if(!L.on&&L.cats.size&&now()-downT>10){for(const id of [...L.cats.keys()])dropCat(id);rebot()}});

/* ---------- 传球 ---------- */
const okBall=b=>b&&Number.isInteger(b.ci)&&b.ci>=0&&b.ci<5&&has(KNIT_NAMES,b.kind);
const busy=()=>!!(me.hold||me.toy||me.hidden||A.arriving&&A.arriving());
// 收到球：一收到就回话（接住了 / 还回去），不等飞行动画——这样对方那边不会一直悬着，也不会一颗球变成两颗
function incoming(m){const c=L.cats.get(m.id),b=m.ball;if(!c||!okBall(b))return;const ball={ci:b.ci};
  // 请你 review：看一眼就把球还回去，你什么都不用做
  if(b.rv){L.send({t:'back',to:m.id,p:m.p,ok:1});say(`${c.name}请你看一眼它的代码。你看了看，点了点头 ✓`);emote(me,'note',1.4);A.throwTo(c,me,ball,()=>A.throwTo(me,c,ball));return}
  if(busy()){L.send({t:'back',to:m.id,p:m.p});say(`${c.name}传来一颗毛线球，可你现在腾不出嘴，球滚回去了`);return}
  L.send({t:'got',to:m.id,p:m.p});sfx('toss');const y={ci:b.ci,kind:b.kind,note:'',knit:false,qid:b.qid||null,chain:['门外',c.name],from:{rid:m.id,name:c.name}};
  // 飞到半路嘴里有了别的：球落进门口的毛线篮，谁也不亏
  A.throwTo(c,me,ball,()=>{if(busy()){S.baskets[0].push(y);say(`${c.name}传来的球你没接住，滚进了门口的毛线篮`);return}me.hold=y;say(`${c.name}把一颗毛线球传给了你`)})}
let pseq=0;const pend=new Map();
const pass1=A.pass;
A.pass=(c,o)=>{if(!o||!o.puppet)return pass1(c,o);if(!c.me)return;const y=c.hold;if(!y||y.knit)return;
  if(!L.on){say(`${o.name}现在连不上，球还在你嘴里`);return}
  const q=y.qs&&!y.qs.abandoned?y.qs:null,rv=!!(q&&A.Q.cur===q&&A.Q.flowAt()==='review');
  if(rv)say(`请${o.name}帮忙 review`);else if(q){q.abandoned=true;if(A.Q.cur===q)A.Q.cur=null;say(`你把便签也一起交给了${o.name}`)}else say(`传给${o.name}`);
  c.hold=null;A.run(c,[{k:'happy',dur:.6,soft:1}]);sfx('toss');A.throwTo(c,o,y);
  const p=++pseq;pend.set(p,{y,o,rv,t:now()});L.send({t:'pass',to:o.rid,p,ball:{ci:y.ci,kind:y.kind,qid:q?q.d.id:null,...(rv?{rv:1}:{})}})};
function giveBack(e,why){const o=L.cats.get(e.o.rid)||e.o;A.throwTo(o,me,e.y,()=>{if(me.hold||me.toy){S.baskets[0].push(e.y);say('嘴里有东西了，球滚回了门口的毛线篮');return}
  me.hold=e.y;if(why==='reviewed')A.Q.reviewDone(e.y.qs,o.name);else say(why==='busy'?`${o.name}现在腾不出嘴，球滚回来了`:`${o.name}不在了，球滚回来了`)})}
// 球回来了：只认这笔传球的接球方（服务端也只转它的回话）；why 是 busy / gone / reviewed
function returned(m){const e=pend.get(m.p);if(!e||m.id!==e.o.rid)return;pend.delete(m.p);giveBack(e,e.rv&&m.why==='reviewed'?'reviewed':m.why==='busy'?'busy':'gone')}
// 服务端 20 秒没等到回话会退球；这里再兜一层：30 秒还没消息（多半是断线了），review 的球照样还回来，普通的球算对方接住了
tick(()=>{for(const [p,e] of pend)if(now()-e.t>PASS_WAIT){pend.delete(p);if(e.rv)giveBack(e,'gone')}});

/* ---------- 发：包在别的模块外面 ---------- */
const emo0=A.onEmote;A.onEmote=(c,i)=>{emo0(c,i);if(c.me&&L.on)L.send({t:'emo',i})};
const say0=A.onSay;A.onSay=(c,s)=>{if(say0)say0(c,s);if(c.me&&L.on){const i=PHRASES.indexOf(s);if(i>=0)L.send({t:'ph',i})}};
A.onRub=(c,o)=>{if(c.me&&o.puppet&&L.on)L.send({t:'rub',to:o.rid})};
const hang0=A.onHang;A.onHang=(c,item)=>{if(hang0)hang0(c,item);if(c.me&&L.on){const y=item.y;L.send({t:'hang',kind:item.kind,ci:item.ci,...(y&&y.from?{from:y.from.rid}:{})})}};
});
