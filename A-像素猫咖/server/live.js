/* 1024 猫咖 · 联机：谁在店里、各自在哪儿，把走路、表情、快捷短语、蹭蹭、传球转给附近的猫；巨树、小黑板、彩蛋、吧台大鱼缸的计数全店共用。设计见 docs/联机.md。
   - 身份只认令牌（第一条消息 {t:'hi', token}），名字和长相由服务端按令牌填，浏览器发来的消息里不带名字。令牌被作废（离店），用它连着的通道也断开。
   - 不转任何自由文字：短语只传序号，毛线球只传题号。每样字段都查（姿态、表情按 js/cat-sprites.js 里真有的查），不对的消息直接丢掉。
     处理一条消息出了任何错，只断开这一条连接，不影响别人。
   - 每 0.1 秒给每个人发一包：他画面里的猫（按他报的画面大小和镜头在地图边上会停住的规矩算，四周再多留一圈），
     凡是比他上次收到的新，就发一份完整状态；画面外的猫每秒只发一次位置（给小地图用）。走进画面的那一刻，缺的完整状态会补上。
     高频的这几样用连接的短编号 n 代替猫的 id。
   - 传球是一笔"事务"：服务端记着谁传给谁；只有接球的那只能回"接住了"或"还回去"，别的猫伪造不了；
     接球的那只下线或 20 秒没回应，球退给传球的。
   - 同一只猫从第二个地方连上来，先连的那个收到 {t:'bye', why:'elsewhere'}。 */
const fs=require('fs'),path=require('path'),vm=require('vm'),WS=require('./ws'),S=require('./store');
const TICK=100,FAR_EVERY=10,HI_MS=5000,MAX_CONN=600,TREE_N=36,PASS_TTL=20000,WW=960,WH=4940;   // 大图的高：一楼、二楼、屋顶、地下一层、猫猫星球（js/map-*.js）
const KINDS=['scarf','hat','mitten','sock','sweater','flag'],TOYS=['cup','sugar','vase','cake','pot'];   // 咖啡桌上能推下去、叼回来的东西（js/world-cafe.js 的 CTOY）
// 同一种消息最短间隔（秒）；回球、接球不限（它们受传球事务约束，丢了球就没了）
const GAP=new Map([['emo',.45],['ph',.9],['rub',.45],['pass',.45],['hang',2.5],['s',.07],['v',.5],['egg',2],['tank',3]]);
// 彩蛋的键（js/world-eggs.js 的 EGGS，顺序也一样）；每只猫最多往大鱼缸里放几条水晶鱼（js/world-crystal.js）
const EGG_KEYS=S.EGG_KEYS,TANK_MAX=3;
const SPR=vm.runInNewContext(fs.readFileSync(path.join(S.ROOT,'js/cat-sprites.js'),'utf8')+';({pose:new Set(Object.keys(POSE)),face:new Set(Object.keys(FACES))})',{console,Math});

const conns=new Set(),byCat=new Map(),passes=new Map();let joins=[],leaves=[],tickN=0,nseq=0;
const st={in:0,out:0,bytesIn:0,bytesOut:0,tickMs:0,drop:0,err:0,t0:Date.now()};

/* ---------- 检查 ---------- */
const num=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
const HOLD=new RegExp('^(y[0-4]|('+KINDS.join('|')+'):[0-4]|t:('+TOYS.join('|')+'))$');
const okHold=h=>h===0||typeof h==='string'&&HOLD.test(h);
function okState(s){if(!Array.isArray(s)||s.length!==9)return false;const [x,y,z,dy,k,f,e,h,fl]=s;
  return num(x,0,WW)&&num(y,0,WH)&&(z===null||num(z,0,WH+40))&&num(dy,-300,20)&&typeof k==='string'&&SPR.pose.has(k)&&(f===0||f===1)&&
    (e===''||typeof e==='string'&&SPR.face.has(e))&&okHold(h)&&Number.isInteger(fl)&&fl>=0&&fl<2048}   // fl：几个开关拼成的数（1 藏着、2 镜像、4 彩虹色、8 头顶毛巾、16 炸毛、32 项圈发光、64～960 挂坠编号、1024 水晶泡泡）
const okBall=b=>b&&typeof b==='object'&&Number.isInteger(b.ci)&&b.ci>=0&&b.ci<5&&KINDS.includes(b.kind)&&(b.qid==null||typeof b.qid==='string'&&/^[a-z0-9-]{1,24}$/.test(b.qid));
const cleanBall=b=>({ci:b.ci,kind:b.kind,qid:b.qid||null,...(b.rv?{rv:1}:{})});
const idx=(i,n)=>Number.isInteger(i)&&i>=0&&i<n;
const okP=p=>Number.isInteger(p)&&p>0&&p<1e9;

/* ---------- 发 ---------- */
function send(c,o){if(!c.ws.open)return;const s=JSON.stringify(o);c.ws.send(s);st.out++;st.bytesOut+=s.length}
const live=()=>[...conns].filter(c=>c.cat&&c.s);
// 画面：镜头跟着猫，但到了地图边上会停住（和 world-play.js 的 camera 一样）；四周再多留一圈（左右 200、上下 120，对话框把镜头往下推的那一点也在里面）
const center=(v,size,W)=>size>=W?W/2:Math.min(Math.max(v,size/2),W-size/2);
const sees=(r,c)=>{if(!r.s)return true;const cx=center(r.s[0],r.vw,WW),cy=center(r.s[1]-12,r.vh,WH);return Math.abs(c.s[0]-cx)<r.vw/2+200&&Math.abs(c.s[1]-cy)<r.vh/2+120};
const nearOf=c=>live().filter(o=>o!==c&&sees(o,c));
const dist=(a,b)=>Math.hypot(a.s[0]-b.s[0],a.s[1]-b.s[1]);
const info=c=>({id:c.cat.id,n:c.n,name:c.cat.name,look:c.cat.look,s:c.s});
const worldInfo=()=>({hung:S.db.world.hung,day:S.today(),today:S.db.world.days[S.today()]||0,tree:S.db.world.tree,eggs:S.db.world.eggs,crystal:S.db.world.crystal});

/* ---------- 连上来 ---------- */
function upgrade(req,socket,head){if(conns.size>=MAX_CONN){socket.end('HTTP/1.1 503 Busy\r\n\r\n');return}
  const ws=WS.accept(req,socket,head,{maxPayload:2048});if(!ws)return;
  const c={ws,cat:null,h:null,s:null,ver:0,n:0,seen:new Map(),posSent:new Map(),last:new Map(),bucket:60,bt:Date.now(),strikes:0,vw:480,vh:287};conns.add(c);
  const hiT=setTimeout(()=>{if(!c.cat)ws.close(1008)},HI_MS);
  ws.on('message',txt=>{st.in++;st.bytesIn+=txt.length;
    try{let m;try{m=JSON.parse(txt)}catch(e){return strike(c)}if(!m||typeof m!=='object'||typeof m.t!=='string')return strike(c);
      if(!c.cat){if(m.t==='hi')hello(c,m,hiT);else ws.close(1008);return}
      if(!Object.prototype.hasOwnProperty.call(ON,m.t))return strike(c);if(!allow(c,m.t))return;ON[m.t](c,m)}
    catch(e){st.err++;console.error('[live]',e&&e.message);ws.close(1011)}});
  ws.on('close',()=>{clearTimeout(hiT);conns.delete(c);if(c.cat&&byCat.get(c.cat.id)===c){byCat.delete(c.cat.id);if(c.announced)leaves.push({id:c.cat.id,n:c.n});
    // 它还没回应的传球：退给传球的；它传出去还没落地的：作废
    for(const [k,tx] of passes){if(tx.to===c.cat.id){passes.delete(k);giveBack(tx,'gone')}else if(tx.from===c.cat.id)passes.delete(k)}}})}
function hello(c,m,hiT){const me=typeof m.token==='string'&&m.token.length<200?S.who(m.token):null;if(!me){send(c,{t:'bye',why:'auth'});return c.ws.close(1008)}clearTimeout(hiT);
  const old=byCat.get(me.c.id);if(old){send(old,{t:'bye',why:'elsewhere'});old.ws.close(4000);if(old.announced)leaves.push({id:me.c.id,n:old.n})}
  c.cat=me.c;c.h=me.h;c.n=nseq=nseq%999999+1;byCat.set(me.c.id,c);const p=S.pub(me.c);
  send(c,{t:'welcome',id:me.c.id,me:{name:p.name,prizes:p.prizes},cats:live().filter(o=>o!==c&&o.announced).map(o=>{c.seen.set(o.n,o.ver);return info(o)}),world:worldInfo()})}
// 限速：每条连接一个桶（每秒补 30 条，最多攒 60 条），有的消息还有最短间隔；老是超就断开
function allow(c,t){const now=Date.now();c.bucket=Math.min(60,c.bucket+(now-c.bt)*.03);c.bt=now;if(c.bucket<1){st.drop++;return strike(c),false}c.bucket--;
  const g=GAP.get(t);if(g){if(now-(c.last.get(t)||0)<g*1000){st.drop++;return false}c.last.set(t,now)}return true}
function strike(c){if(++c.strikes>200)c.ws.close(1008);return false}

/* ---------- 传球的事务 ---------- */
const txKey=(from,p)=>from+':'+p;
// why：busy 对方腾不出嘴 / gone 对方不在了或没回应 / reviewed 对方看过了
function giveBack(tx,why){const f=byCat.get(tx.from);if(f)send(f,{t:'back',id:tx.to,p:tx.p,ball:tx.ball,why})}
setInterval(()=>{const now=Date.now();for(const [k,tx] of passes)if(now-tx.t>PASS_TTL){passes.delete(k);giveBack(tx,'gone')}},2000).unref();

/* ---------- 收 ---------- */
const ON={
  s(c,m){if(!okState(m.s))return strike(c);c.s=m.s;c.ver++;if(!c.announced){c.announced=true;joins.push(c)}},
  v(c,m){const v=m.v;if(!Array.isArray(v)||!num(v[0],100,WW)||!num(v[1],80,WH))return;c.vw=v[0];c.vh=v[1]},
  emo(c,m){if(!c.s||!idx(m.i,8))return;for(const o of nearOf(c))send(o,{t:'emo',id:c.cat.id,i:m.i})},
  ph(c,m){if(!c.s||!idx(m.i,8))return;for(const o of nearOf(c))send(o,{t:'ph',id:c.cat.id,i:m.i})},
  // 蹭蹭；k 是别的几种猫和猫的互动（舔舔毛、碰碰鼻子、一起玩、挨着睡），只认这几个词
  rub(c,m){const o=typeof m.to==='string'&&byCat.get(m.to);if(!c.s||!o||!o.s||dist(c,o)>60)return;const k=['groom','boop','play','nap'].includes(m.k)?m.k:null;for(const r of nearOf(c))send(r,{t:'rub',id:c.cat.id,to:o.cat.id,...(k?{k}:{})})},
  // 传球：对方不在，球马上滚回来；附近看热闹的只收到一道弧线
  pass(c,m){if(!c.s||!okBall(m.ball)||!okP(m.p))return;const ball=cleanBall(m.ball),o=typeof m.to==='string'&&byCat.get(m.to),k=txKey(c.cat.id,m.p);
    if(passes.has(k))return;
    if(!o||!o.s||o===c||dist(c,o)>200){send(c,{t:'back',id:typeof m.to==='string'?m.to:'',p:m.p,ball,why:'gone'});return}
    passes.set(k,{from:c.cat.id,to:o.cat.id,p:m.p,ball,t:Date.now()});
    send(o,{t:'pass',id:c.cat.id,p:m.p,ball});for(const r of nearOf(c))if(r!==o)send(r,{t:'toss',id:c.cat.id,to:o.cat.id,ci:ball.ci})},
  // 接球的那只回：接住了（got）或者还回去（back；review 的球 ok:1 表示看过了）。只认这笔事务的接球方
  got(c,m){if(!okP(m.p)||typeof m.to!=='string')return;const k=txKey(m.to,m.p),tx=passes.get(k);if(!tx||tx.to!==c.cat.id)return;passes.delete(k);
    const f=byCat.get(tx.from);if(f)send(f,{t:'got',id:c.cat.id,p:tx.p})},
  back(c,m){if(!okP(m.p)||typeof m.to!=='string')return;const k=txKey(m.to,m.p),tx=passes.get(k);if(!tx||tx.to!==c.cat.id)return;passes.delete(k);
    giveBack(tx,tx.ball.rv&&m.ok?'reviewed':'busy');const f=byCat.get(tx.from);if(c.s&&f)for(const r of nearOf(c))if(r!==f)send(r,{t:'toss',id:c.cat.id,to:tx.from,ci:tx.ball.ci})},
  // 挂进橱窗：全店计数 +1，巨树多一件；这颗球是别人传过来的，告诉它
  hang(c,m){if(!KINDS.includes(m.kind)||!idx(m.ci,5))return;const W=S.db.world,d=S.today();W.hung++;W.days[d]=(W.days[d]||0)+1;
    W.tree.push({kind:m.kind,ci:m.ci});let gold=false;if(W.tree.length>=TREE_N){W.tree=[];gold=true}
    c.cat.hangs=(c.cat.hangs||0)+1;S.save();
    const msg={t:'hang',id:c.cat.id,kind:m.kind,ci:m.ci,hung:W.hung,day:d,today:W.days[d],...(gold?{gold:1}:{})};for(const o of conns)if(o.cat)send(o,msg);
    const f=typeof m.from==='string'&&byCat.get(m.from);if(f&&f!==c)send(f,{t:'woven',id:c.cat.id,kind:m.kind,ci:m.ci})},
  // 第一次找到一个彩蛋：同一只猫同一个彩蛋只算一次；全店在线的猫都收到（只带键和一共几只猫找到，新闻里不说是哪个由前端决定）
  //（存档先到、已经算过了的：一分钟之内照样告诉大家，再晚的就不说了，免得有人反复发）
  egg(c,m){if(!EGG_KEYS.includes(m.k))return;const E=c.cat.eggs=c.cat.eggs||{},W=S.db.world,now=Date.now();if(E[m.k]){if(now-E[m.k]>60000)return}else{E[m.k]=now;W.eggs[m.k]=(W.eggs[m.k]||0)+1;S.save()}
    const msg={t:'egg',id:c.cat.id,k:m.k,n:W.eggs[m.k]||0};for(const o of conns)if(o.cat)send(o,msg)},
  // 往吧台的大鱼缸里放一条水晶鱼：全店共用一口缸。k 是这只猫一共放过第几条（最多三条）：比算过的多才加（存档先到、已经补算过的不重复加）
  tank(c,m){const k=Math.min(TANK_MAX,Number.isInteger(m.k)?m.k:0),had=c.cat.tank||0;if(k<1)return;const W=S.db.world;
    if(k>had){W.crystal.n+=k-had;if(m.gold===1)W.crystal.gold++;c.cat.tank=k;S.save()}else if(k<had)return;
    const msg={t:'tank',id:c.cat.id,n:W.crystal.n,gold:W.crystal.gold};for(const o of conns)if(o.cat)send(o,msg)}};

/* ---------- 每 0.1 秒：按远近打包 ---------- */
setInterval(()=>{const t0=process.hrtime.bigint();tickN++;const far=tickN%FAR_EVERY===0,L=live().filter(c=>c.announced),J=joins.filter(c=>c.ws.open&&c.announced),Lv=leaves;joins=[];leaves=[];
  for(const r of conns){if(!r.cat)continue;const u=[],p=[];for(const x of Lv){r.seen.delete(x.n);r.posSent.delete(x.n)}
    for(const c of L){if(c===r||J.includes(c))continue;
      if(sees(r,c)){if(r.seen.get(c.n)!==c.ver){u.push([c.n,c.s]);r.seen.set(c.n,c.ver)}}
      else if(far&&r.seen.get(c.n)!==c.ver){const k=c.s[0]*1000+c.s[1];if(r.posSent.get(c.n)!==k){p.push([c.n,c.s[0],c.s[1]]);r.posSent.set(c.n,k)}}}
    const j=J.filter(c=>c!==r).map(c=>{r.seen.set(c.n,c.ver);return info(c)}),l=Lv.filter(x=>x.id!==r.cat.id).map(x=>x.n);
    if(u.length||p.length||j.length||l.length)send(r,{t:'b',...(u.length?{u}:{}),...(p.length?{p}:{}),...(j.length?{j}:{}),...(l.length?{l}:{})})}
  st.tickMs=st.tickMs*.9+Number(process.hrtime.bigint()-t0)/1e6*.1},TICK).unref();

/* ---------- 给后台和账号接口用 ---------- */
function kick(id,why){const c=byCat.get(id);if(c){send(c,{t:'bye',why});c.ws.close(4000)}}
// 离店作废了一张令牌：用它连着的通道也断开
function dropToken(h){for(const c of conns)if(c.h===h){send(c,{t:'bye',why:'auth'});c.ws.close(4000)}}
function rename(id,name){const c=byCat.get(id);if(c)c.cat.name=name;for(const o of conns)if(o.cat)send(o,{t:'rename',id,name})}
function prize(id,p){const c=byCat.get(id);if(c)send(c,{...p,t:'prize'})}
// 收发速率每 5 秒算一次
let rate={inPerSec:0,outPerSec:0,kbInPerSec:0,kbOutPerSec:0,dropped:0,errors:0,cpu:0,rssMB:0},cpu0=process.cpuUsage();
setInterval(()=>{const sec=(Date.now()-st.t0)/1000,cu=process.cpuUsage(cpu0);cpu0=process.cpuUsage();
  rate={inPerSec:+(st.in/sec).toFixed(1),outPerSec:+(st.out/sec).toFixed(1),kbInPerSec:+(st.bytesIn/sec/1024).toFixed(1),kbOutPerSec:+(st.bytesOut/sec/1024).toFixed(1),dropped:st.drop,errors:st.err,
    cpu:Math.round((cu.user+cu.system)/1e4/sec),rssMB:Math.round(process.memoryUsage().rss/1048576)};   // cpu：这 5 秒里占了一个核的百分之几
  Object.assign(st,{in:0,out:0,bytesIn:0,bytesOut:0,drop:0,err:0,t0:Date.now()})},5000).unref();
const stats=()=>({online:[...byCat.values()].filter(c=>c.announced).length,conns:conns.size,...rate,tickMs:+st.tickMs.toFixed(3)});
const isOnline=id=>byCat.has(id);
module.exports={upgrade,kick,dropToken,rename,prize,stats,isOnline};
