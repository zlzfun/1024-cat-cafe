/* 1024 猫咖 · 账号：认出"你是哪只猫"。设计见 docs/登录与进店.md。
   两种后端，接口一样：
   - 本机：没配服务端（直接打开文件）时用。数据存在这台浏览器里，只能保证这台浏览器上不重名，开发和单机演示用。
   - 服务端：config.js 里配了 api。名字全店唯一；暗号只存散列；输错有次数限制；这台电脑记住的是一张随机令牌。
   Account.rule(name)          → null | {why}            只查格式（不联网）
   Account.check([names])      → {name: {ok, why, mine}}  格式 + 有没有被占
   Account.create({name,code,look}) → {cat}              code 是暗号：4 个图案的编号，如 [3,0,7,5]
   Account.login(name, code)   → {cat} | {err:'code', left} | {err:'lock', wait} | {err:'none'} | {err:'ban'}
   Account.resume()            → cat | null              这台电脑记住的猫
   Account.save(state)、Account.logout()、Account.prizeSeen(no)
   Account.token()             → 联机用的令牌（服务端模式才有）；Account.wsUrl() → 联机的地址
   cat = {id, name, look:{coat, collar, face}, created, last, state, prizes?} */
const Account=(()=>{
const CFG=window.CAT1024_CONFIG||{},API=(CFG.api||'').replace(/\/$/,'');
const STORE_CATS=['宪宪','砚砚','烁烁','小狸花','斑斑','金哥','前台猫'];
const RESERVED=[...STORE_CATS,'你','我','人类','店长','店猫','猫猫','管理员','系统','猫猫咖啡馆','clowder','clowderai','admin','root','null','undefined'];
// 名字里带这些词容易被当成办活动的人
const NO_PART=['管理员','官方','系统','客服','组织者','主办方'];
const ICONS=['小鱼干','毛线球','铃铛','爪印','咖啡杯','老鼠玩具','纸箱','猫薄荷','月亮'],CODE_LEN=4,MAX_FAIL=5,LOCK_MIN=10;
const key=s=>String(s||'').normalize('NFKC').trim().toLowerCase();
const wide=ch=>/[⺀-鿿가-힯豈-﫿＀-｠]/.test(ch);
const width=s=>[...s].reduce((w,ch)=>w+(wide(ch)?2:1),0);
function rule(name){const s=String(name||'').normalize('NFKC').trim();if(!s)return{why:'先取个名字'};
  if(/\s/.test(s))return{why:'名字里别带空格'};
  if(!/^[\p{L}\p{N}·_\-]+$/u.test(s))return{why:'只能用中文、字母和数字'};
  const w=width(s);if(w<2)return{why:'再长一点：至少一个汉字或两个字母'};if(w>16)return{why:'太长了：最多 8 个汉字或 16 个字母'};
  if(STORE_CATS.some(r=>key(r)===key(s)))return{why:`「${s}」是店里的猫，换一个吧`};
  if(RESERVED.some(r=>key(r)===key(s)))return{why:'这个名字店里留着用，换一个吧'};
  if(NO_PART.some(p=>s.includes(p)))return{why:'这个名字容易被当成办活动的人，换一个吧'};
  return null}
const okCode=c=>Array.isArray(c)&&c.length===CODE_LEN&&c.every(i=>Number.isInteger(i)&&i>=0&&i<ICONS.length);
const okLook=l=>l&&Number.isInteger(l.coat)&&l.coat>=0&&l.coat<9&&Number.isInteger(l.collar)&&l.collar>=0&&l.collar<6&&typeof l.face==='string';

/* ---------- 散列：有 WebCrypto 用 PBKDF2，没有（比如 http 的内网地址）用一份小的 SHA-256 ---------- */
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
async function hashCode(code,salt){const s=code.join('-');
  if(crypto.subtle){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(s),'PBKDF2',false,['deriveBits']);
    return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:60000},k,256))}
  let h=salt+s;for(let i=0;i<500;i++)h=sha256(h+s);return 'js:'+h}

/* ---------- 本机后端：localStorage 里模拟一份"服务端的库" ---------- */
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const DBK='cat1024.db',SK='cat1024.session';
const pub=c=>c&&{id:c.id,name:c.name,look:c.look,created:c.created,last:c.last,prev:c.prev,state:c.state||{}};
const local={
  async check(names){const db=LS.get(DBK,{cats:{}}),me=LS.get(SK,null),out={};
    for(const n of names){const r=rule(n),c=db.cats[key(n)];out[n]=r?{ok:false,why:r.why}:c?{ok:false,taken:true,mine:!!me&&me.id===c.id,why:`店里已经有一只「${c.name}」了`}:{ok:true}}return out},
  async create({name,code,look}){const r=rule(name);if(r)return{err:'name',why:r.why};if(!okCode(code)||!okLook(look))return{err:'bad'};
    const db=LS.get(DBK,{cats:{}}),k=key(name);if(db.cats[k])return{err:'taken',why:`店里已经有一只「${db.cats[k].name}」了`};
    const salt=rand(16),now=Date.now(),c={id:'c'+rand(8),name:String(name).normalize('NFKC').trim(),look,salt,hash:await hashCode(code,salt),created:now,last:now,prev:0,state:{},fails:0,lockUntil:0,tokens:[]};
    const token=rand(24);c.tokens.push(sha256(token));db.cats[k]=c;if(!LS.set(DBK,db))return{err:'store'};LS.set(SK,{id:c.id,k,token});return{cat:pub(c)}},
  async login(name,code){const db=LS.get(DBK,{cats:{}}),k=key(name),c=db.cats[k];if(!c)return{err:'none'};const now=Date.now();
    if(c.lockUntil>now)return{err:'lock',wait:Math.ceil((c.lockUntil-now)/1000)};
    if(!okCode(code)||await hashCode(code,c.salt)!==c.hash){c.fails=(c.fails||0)+1;let left=MAX_FAIL-c.fails;if(left<=0){c.fails=0;c.lockUntil=now+LOCK_MIN*60e3;LS.set(DBK,db);return{err:'lock',wait:LOCK_MIN*60}}LS.set(DBK,db);return{err:'code',left}}
    const token=rand(24);c.fails=0;c.tokens=[...(c.tokens||[]).slice(-4),sha256(token)];c.prev=c.last;c.last=now;LS.set(DBK,db);LS.set(SK,{id:c.id,k,token});return{cat:pub(c)}},
  async resume(){const s=LS.get(SK,null);if(!s)return null;const db=LS.get(DBK,{cats:{}}),c=db.cats[s.k];if(!c||c.id!==s.id||!(c.tokens||[]).includes(sha256(s.token))){LS.del(SK);return null}
    c.prev=c.last;c.last=Date.now();LS.set(DBK,db);return pub(c)},
  async save(state){const s=LS.get(SK,null);if(!s)return false;const db=LS.get(DBK,{cats:{}}),c=db.cats[s.k];if(!c||c.id!==s.id)return false;c.state={...c.state,...state};c.last=Date.now();return LS.set(DBK,db)},
  async logout(){const s=LS.get(SK,null);if(s){const db=LS.get(DBK,{cats:{}}),c=db.cats[s.k];if(c){c.tokens=(c.tokens||[]).filter(t=>t!==sha256(s.token));LS.set(DBK,db)}}LS.del(SK)}};

/* ---------- 服务端后端：接口见 docs/登录与进店.md，参考实现在 server/server.js ---------- */
const TK='cat1024.token';
async function call(method,path,body,keepalive){const t=LS.get(TK,null),h={'Content-Type':'application/json'};if(t)h.Authorization='Bearer '+t;
  const r=await fetch(API+path,{method,headers:h,body:body?JSON.stringify(body):undefined,keepalive:!!keepalive,credentials:'same-origin'});let j={};try{j=await r.json()}catch(e){}return{status:r.status,...j}}
const remote={
  async check(names){const bad={},ask=[];for(const n of names){const r=rule(n);if(r)bad[n]={ok:false,why:r.why};else ask.push(n)}
    if(!ask.length)return bad;const j=await call('POST','/names',{names:ask});return{...bad,...(j.results||{})}},
  async create(o){const j=await call('POST','/cats',o);if(j.token){LS.set(TK,j.token);return{cat:j.cat}}return{err:j.err||'net',why:j.why}},
  async login(name,code){const j=await call('POST','/login',{name,code});if(j.token){LS.set(TK,j.token);return{cat:j.cat}}return{err:j.err||'net',left:j.left,wait:j.wait}},
  async resume(){if(!LS.get(TK,null))return null;const j=await call('GET','/me');if(j.cat)return j.cat;if(j.status===401)LS.del(TK);return null},
  async save(state,keepalive){const j=await call('PUT','/me/state',{state},keepalive);return j.status===200},
  async logout(){await call('POST','/logout').catch(()=>{});LS.del(TK)},
  async prizeSeen(no){await call('POST','/me/prize-seen',{no})}};

const B=API?remote:local;
// 连不上服务端时别整页卡死：返回 {err:'net'}，界面上说"店门口网不好"
const safe=f=>async(...a)=>{try{return await f(...a)}catch(e){console.warn('[account]',e);return{err:'net'}}};
return{rule,width,ICONS,CODE_LEN,mode:API?'server':'local',
  check:async names=>{try{return await B.check(names)}catch(e){return Object.fromEntries(names.map(n=>[n,rule(n)?{ok:false,why:rule(n).why}:{ok:true,unsure:true}]))}},
  create:safe(B.create),login:safe(B.login),resume:async()=>{try{return await B.resume()}catch(e){return null}},
  save:(s,k)=>B.save(s,k).catch(()=>false),logout:()=>B.logout().catch(()=>{}),prizeSeen:no=>API?remote.prizeSeen(no).catch(()=>{}):null,
  token:()=>API?LS.get(TK,null):null,
  // 联机地址：和接口同一台服务器的 /ws（config.js 里也可以用 ws 另给）
  wsUrl:()=>{if(!API)return null;if(CFG.ws)return CFG.ws;const u=new URL(API,location.href);if(!/^https?:$/.test(u.protocol))return null;u.protocol=u.protocol==='https:'?'wss:':'ws:';u.pathname=u.pathname.replace(/\/api\/?$/,'')+'/ws';u.search='';return u.href}}})();
