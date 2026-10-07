/* 1024 猫咖 · 账号：认出"你是哪只猫"。设计见 docs/登录与进店.md。
   不设密码、不让自己起名：名字从店里给的几个里挑（一个口味 + 一样点心，Account.NAMES），店里保证不重名；这个浏览器记着一张令牌，就是你。换了浏览器就是一只新猫。
   两种后端，接口一样：
   - 本机：没配服务端（直接打开文件）时用。数据存在这个浏览器里，开发和单机演示用。
   - 服务端：config.js 里配了 api。名字全店唯一；令牌只存散列。
   Account.offer(n, skip)      → {names:[...]} | {err:'net'}   此刻没有猫用的名字（skip：这一批别再给）
   Account.create({name,look}) → {cat} | {err:'taken'|'name'|'bad'|'store'|'net'}
   Account.resume()            → cat | null              这个浏览器记住的猫
   Account.save(state)、Account.logout()、Account.prizeSeen(no)
   Account.entry({real,emp,contact}) → {entry} | {err:'bad', field, why} | {err:'stamps'|'local'|'net'}   登记抽奖（只有服务端模式能登记）
   Account.entryWhy(e)         → null | {field, why}     抽奖登记的格式（前后端同一份）
   Account.token()             → 联机用的令牌（服务端模式才有）；Account.wsUrl() → 联机的地址
   cat = {id, name, look:{coat, collar, face}, created, last, state, prizes?, entry?} */
const Account=(()=>{
const CFG=window.CAT1024_CONFIG||{},API=(CFG.api||'').replace(/\/$/,'');

/* ---------- 名字：一个口味 + 一样点心，36 × 36 = 1296 个。两半都是挑过的词，拼出来不用再审；补位机器人用的是一个词的名字，永远撞不上 ---------- */
const TASTE=`芝麻 焦糖 抹茶 海盐 桂花 薄荷 奶盖 可可 柚子 蜜桃 栗子 红豆 椰子 黑糖 奶油 蜂蜜 柠檬 草莓
  蓝莓 芋泥 杏仁 榛子 枫糖 乌龙 南瓜 山楂 青提 橘子 雪梨 荔枝 芒果 樱桃 葡萄 酸奶 香草 玉米`.trim().split(/\s+/);
const SNACK=`团子 汤圆 布丁 麻薯 泡芙 可颂 曲奇 年糕 豆包 吐司 蛋挞 松饼 贝果 奶茶 拿铁 摩卡 饼干 冰粉
  芋圆 豆花 花卷 酥饼 蛋糕 果冻 软糖 甜筒 月饼 汽水 糯米糍 雪糕 千层 奶冻 米糕 糖糕 华夫 馅饼`.trim().split(/\s+/);
const NAMES=TASTE.flatMap(a=>SNACK.map(b=>a+b));
// 1296 个都有猫了，再在前面加"小""大"各发一轮
const ALL=[...NAMES,...['小','大'].flatMap(p=>NAMES.map(n=>p+n))],POOL=new Set(ALL);
const key=s=>String(s||'').normalize('NFKC').trim().toLowerCase();
const inPool=n=>typeof n==='string'&&POOL.has(n);
// 挑 n 个没被占的：先在基本的 1296 个里随机挑，不够再用加了"小""大"的；连 skip 也算上都不够，就不管 skip 了
function pick(n,taken,skip=[]){const out=[],no=new Set(skip),ok=x=>!taken(x)&&!no.has(x)&&!out.includes(x);
  for(let i=0;i<n*40&&out.length<n;i++){const x=NAMES[Math.floor(Math.random()*NAMES.length)];if(ok(x))out.push(x)}
  for(const f of [ok,x=>!taken(x)&&!out.includes(x)]){if(out.length>=n)break;const free=ALL.filter(f);while(out.length<n&&free.length)out.push(free.splice(Math.floor(Math.random()*free.length),1)[0])}
  return out}
const okLook=l=>l&&Number.isInteger(l.coat)&&l.coat>=0&&l.coat<9&&Number.isInteger(l.collar)&&l.collar>=0&&l.collar<6&&typeof l.face==='string'&&l.face.length<16;

/* ---------- 抽奖登记：姓名、工号、联系方式 ---------- */
const clip=s=>String(s??'').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,'').trim();
// 联系方式只收手机号（2026-10-07 定：组织者要打电话、发短信通知领奖）：去掉空格、短横、括号和前面的 +86，剩下 11 位、1 开头、第二位 3～9
const phoneClean=s=>{let p=clip(s).replace(/[\s\-()（）]/g,'');if(/^(\+?86|0086)1\d{10}$/.test(p))p=p.replace(/^(\+?86|0086)/,'');return p};
const entryClean=e=>({real:clip(e.real),emp:clip(e.emp).replace(/\s+/g,''),contact:phoneClean(e.contact)});
function entryWhy(e){if(!e||typeof e!=='object')return{field:'real',why:'填一下姓名'};const {real,emp,contact}=entryClean(e);
  if(!real)return{field:'real',why:'填一下姓名'};if([...real].length>20)return{field:'real',why:'姓名最多 20 个字'};
  if(!emp)return{field:'emp',why:'填一下工号'};if(!/^[A-Za-z0-9_-]{2,32}$/.test(emp))return{field:'emp',why:'工号是字母和数字，2～32 位'};
  if(!contact)return{field:'contact',why:'留个手机号'};if(!/^1[3-9]\d{9}$/.test(contact))return{field:'contact',why:'手机号是 11 位数字，1 开头'};
  return null}
// 按工号去重时比的东西：去掉空白、转大写
const empKey=emp=>clip(emp).replace(/\s+/g,'').toUpperCase();

/* ---------- 令牌散列（本机模式用；浏览器在 http 的内网地址上没有 WebCrypto，用一份小的 SHA-256） ---------- */
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const rand=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return hex(a)};
function sha256(str){const K=[],H=[];let n=2,c=0;const isP=q=>{for(let f=2;f*f<=q;f++)if(q%f===0)return false;return true},fr=x=>(x-Math.floor(x))*4294967296|0;
  while(c<64){if(isP(n)){if(c<8)H[c]=fr(Math.pow(n,1/2));K[c++]=fr(Math.pow(n,1/3))}n++}
  const b=[...new TextEncoder().encode(str)],l=b.length*8;b.push(0x80);while(b.length%64!==56)b.push(0);for(let i=7;i>=0;i--)b.push(i>3?0:(l>>>(i*8))&255);
  const h=H.slice(),r=(x,k)=>x>>>k|x<<(32-k);
  for(let o=0;o<b.length;o+=64){const w=[];for(let i=0;i<64;i++)w[i]=i<16?(b[o+i*4]<<24|b[o+i*4+1]<<16|b[o+i*4+2]<<8|b[o+i*4+3]):(((r(w[i-2],17)^r(w[i-2],19)^w[i-2]>>>10)+w[i-7]+(r(w[i-15],7)^r(w[i-15],18)^w[i-15]>>>3)+w[i-16])|0);
    let [A,B,C,D,E,F,G,Hh]=h;for(let i=0;i<64;i++){const t1=(Hh+(r(E,6)^r(E,11)^r(E,25))+(E&F^~E&G)+K[i]+w[i])|0,t2=((r(A,2)^r(A,13)^r(A,22))+(A&B^A&C^B&C))|0;Hh=G;G=F;F=E;E=(D+t1)|0;D=C;C=B;B=A;A=(t1+t2)|0}
    [A,B,C,D,E,F,G,Hh].forEach((v,i)=>h[i]=(h[i]+v)|0)}
  return h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('')}

/* ---------- 本机后端：localStorage 里模拟一份"服务端的库" ---------- */
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const DBK='cat1024.db',SK='cat1024.session';
const pub=c=>c&&{id:c.id,name:c.name,look:c.look,created:c.created,last:c.last,prev:c.prev,state:c.state||{},entry:null};
const local={
  async offer(n,skip){const db=LS.get(DBK,{cats:{}});return{names:pick(n,x=>!!db.cats[key(x)],skip)}},
  async create({name,look}){if(!inPool(name))return{err:'name'};if(!okLook(look))return{err:'bad'};
    const db=LS.get(DBK,{cats:{}}),k=key(name);if(db.cats[k])return{err:'taken'};
    const now=Date.now(),c={id:'c'+rand(8),name,look,created:now,last:now,prev:0,state:{},tokens:[]};
    const token=rand(24);c.tokens.push(sha256(token));db.cats[k]=c;if(!LS.set(DBK,db))return{err:'store'};LS.set(SK,{id:c.id,k,token});return{cat:pub(c)}},
  async resume(){const s=LS.get(SK,null);if(!s)return null;const db=LS.get(DBK,{cats:{}}),c=db.cats[s.k];if(!c||c.id!==s.id||!(c.tokens||[]).includes(sha256(s.token))){LS.del(SK);return null}
    c.prev=c.last;c.last=Date.now();LS.set(DBK,db);return pub(c)},
  async save(state){const s=LS.get(SK,null);if(!s)return false;const db=LS.get(DBK,{cats:{}}),c=db.cats[s.k];if(!c||c.id!==s.id)return false;c.state={...c.state,...state};c.last=Date.now();return LS.set(DBK,db)},
  async logout(){const s=LS.get(SK,null);if(s){const db=LS.get(DBK,{cats:{}}),c=db.cats[s.k];if(c){c.tokens=(c.tokens||[]).filter(t=>t!==sha256(s.token));LS.set(DBK,db)}}LS.del(SK)},
  async entry(){return{err:'local'}}};

/* ---------- 服务端后端：接口见 docs/登录与进店.md，参考实现在 server/server.js ---------- */
const TK='cat1024.token';
async function call(method,path,body,keepalive){const t=LS.get(TK,null),h={'Content-Type':'application/json'};if(t)h.Authorization='Bearer '+t;
  const r=await fetch(API+path,{method,headers:h,body:body?JSON.stringify(body):undefined,keepalive:!!keepalive,credentials:'same-origin'});let j={};try{j=await r.json()}catch(e){}return{status:r.status,...j}}
const remote={
  async offer(n,skip){const j=await call('POST','/names/offer',{n,skip});return Array.isArray(j.names)?{names:j.names}:{err:'net'}},
  async create(o){const j=await call('POST','/cats',o);if(j.token){LS.set(TK,j.token);return{cat:j.cat}}return{err:j.err||'net'}},
  async resume(){if(!LS.get(TK,null))return null;const j=await call('GET','/me');if(j.cat)return j.cat;if(j.status===401)LS.del(TK);return null},
  async save(state,keepalive){const j=await call('PUT','/me/state',{state},keepalive);return j.status===200},
  async logout(){await call('POST','/logout').catch(()=>{});LS.del(TK)},
  async prizeSeen(no){await call('POST','/me/prize-seen',{no})},
  async entry(e){const j=await call('POST','/me/entry',e);if(j.entry)return{entry:j.entry};return{err:j.err||'net',field:j.field,why:j.why}}};

const B=API?remote:local;
// 连不上服务端时别整页卡死：返回 {err:'net'}，界面上说"店门口网不好"
const safe=f=>async(...a)=>{try{return await f(...a)}catch(e){console.warn('[account]',e);return{err:'net'}}};
return{NAMES,inPool,pick,key,okLook,entryWhy,entryClean,empKey,mode:API?'server':'local',
  offer:safe(B.offer),create:safe(B.create),entry:safe(B.entry),resume:async()=>{try{return await B.resume()}catch(e){return null}},
  save:(s,k)=>B.save(s,k).catch(()=>false),logout:()=>B.logout().catch(()=>{}),prizeSeen:no=>API?remote.prizeSeen(no).catch(()=>{}):null,
  token:()=>API?LS.get(TK,null):null,
  // 联机地址：和接口同一台服务器的 /ws（config.js 里也可以用 ws 另给）
  wsUrl:()=>{if(!API)return null;if(CFG.ws)return CFG.ws;const u=new URL(API,location.href);if(!/^https?:$/.test(u.protocol))return null;u.protocol=u.protocol==='https:'?'wss:':'ws:';u.pathname=u.pathname.replace(/\/api\/?$/,'')+'/ws';u.search='';return u.href}}})();
