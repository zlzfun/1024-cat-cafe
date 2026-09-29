/* 1024 猫咖 · 服务端参考实现：零依赖（Node 18+），一个进程同时发网页和接口。接口说明见 docs/登录与进店.md。
   node server/server.js            → http://127.0.0.1:1024
   PORT=8080 HOST=0.0.0.0 node server/server.js   → 局域网里别的电脑也能开
   - 名字：规则和前端是同一份（直接读 js/account.js 里的 Account.rule），按 NFKC + 小写判重，全店唯一。
   - 暗号：只存 scrypt 散列（每只猫一份随机盐）；比对用 timingSafeEqual。
   - 输错：同一个名字连错 5 次锁 10 分钟；同一个 IP 10 分钟内错满 30 次，先歇一会儿。
   - 令牌：32 字节随机数，库里只存它的 SHA-256；90 天没来就作废；"离店"就是删掉这一张。
   - 数据：server/data/cats.json（不进仓库），先写临时文件再改名，写坏了也不会丢整份。
   - 页面要的 config.js：目录里有就发那份；没有就现给一份 {api:'/api'}。
   - 忘了暗号：node server/server.js reset 名字（见下）。 */
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..'),DATA=path.join(__dirname,'data'),DB_FILE=path.join(DATA,'cats.json');
const PORT=+process.env.PORT||1024,HOST=process.env.HOST||'127.0.0.1',TOKEN_DAYS=90,MAX_FAIL=5,LOCK_MS=10*60e3,IP_WIN=10*60e3,IP_MAX=30,BODY_MAX=64*1024,STATE_MAX=48*1024;

// 和前端共用的名字规则
const ACC=vm.runInNewContext(fs.readFileSync(path.join(ROOT,'js/account.js'),'utf8')+';Account',{window:{},localStorage:null,crypto:globalThis.crypto,TextEncoder,console});
const key=s=>String(s||'').normalize('NFKC').trim().toLowerCase(),clean=s=>String(s||'').normalize('NFKC').trim();
const okCode=c=>Array.isArray(c)&&c.length===ACC.CODE_LEN&&c.every(i=>Number.isInteger(i)&&i>=0&&i<ACC.ICONS.length);
const okLook=l=>l&&Number.isInteger(l.coat)&&l.coat>=0&&l.coat<9&&Number.isInteger(l.collar)&&l.collar>=0&&l.collar<6&&typeof l.face==='string'&&l.face.length<16;

/* ---------- 库 ---------- */
let db={cats:{},tokens:{}};try{db=JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}catch(e){}
let saveT=null;function save(){if(saveT)return;saveT=setTimeout(()=>{saveT=null;fs.mkdirSync(DATA,{recursive:true});const tmp=DB_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db));fs.renameSync(tmp,DB_FILE)},200)}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const hashCode=(code,salt)=>crypto.scryptSync(code.join('-'),salt,32,{N:16384,r:8,p:1}).toString('hex');
const pub=c=>({id:c.id,name:c.name,look:c.look,created:c.created,last:c.last,prev:c.prev,state:c.state||{}});
function issue(c){const t=crypto.randomBytes(32).toString('base64url');db.tokens[sha(t)]={id:c.id,k:key(c.name),exp:Date.now()+TOKEN_DAYS*864e5};return t}
function who(req){const m=/^Bearer (.+)$/.exec(req.headers.authorization||'');if(!m)return null;const h=sha(m[1]),tk=db.tokens[h];if(!tk)return null;
  if(tk.exp<Date.now()){delete db.tokens[h];save();return null}const c=db.cats[tk.k];if(!c||c.id!==tk.id)return null;tk.exp=Date.now()+TOKEN_DAYS*864e5;return{c,h}}
const ipFails=new Map();const ipBad=ip=>{const a=(ipFails.get(ip)||[]).filter(t=>t>Date.now()-IP_WIN);ipFails.set(ip,a);return a.length>=IP_MAX};

/* ---------- 忘了暗号：组织者在服务器上重置 ----------
   node server/server.js reset 团子   → 给「团子」换一组随机暗号并打印出来，旧令牌全部作废（先停掉正在跑的服务） */
if(process.argv[2]==='reset'){const c=db.cats[key(process.argv[3])];if(!c){console.log('店里没有这只猫');process.exit(1)}
  const code=Array.from({length:ACC.CODE_LEN},()=>crypto.randomInt(ACC.ICONS.length));c.salt=crypto.randomBytes(16).toString('hex');c.hash=hashCode(code,c.salt);c.fails=0;c.lockUntil=0;
  for(const [h,t] of Object.entries(db.tokens))if(t.id===c.id)delete db.tokens[h];fs.mkdirSync(DATA,{recursive:true});fs.writeFileSync(DB_FILE,JSON.stringify(db));
  console.log(`「${c.name}」的新暗号：`+code.map(i=>`${i+1} ${ACC.ICONS[i]}`).join(' → '));process.exit(0)}

/* ---------- 接口 ---------- */
const API={
  'POST /names':({body})=>{const names=Array.isArray(body.names)?body.names.slice(0,24):[],results={};
    for(const n of names){const r=ACC.rule(n),c=db.cats[key(n)];results[n]=r?{ok:false,why:r.why}:c?{ok:false,taken:true,why:`店里已经有一只「${c.name}」了`}:{ok:true}}return[200,{results}]},
  'POST /cats':({body})=>{const {name,code,look}=body,r=ACC.rule(name);if(r)return[400,{err:'name',why:r.why}];if(!okCode(code)||!okLook(look))return[400,{err:'bad'}];
    const k=key(name);if(db.cats[k])return[409,{err:'taken',why:`店里已经有一只「${db.cats[k].name}」了`}];
    const salt=crypto.randomBytes(16).toString('hex'),now=Date.now(),c={id:'c'+crypto.randomBytes(8).toString('hex'),name:clean(name),look:{coat:look.coat,collar:look.collar,face:look.face},salt,hash:hashCode(code,salt),created:now,last:now,prev:0,state:{},fails:0,lockUntil:0};
    db.cats[k]=c;const token=issue(c);save();return[200,{cat:pub(c),token}]},
  'POST /login':({body,ip})=>{if(ipBad(ip))return[429,{err:'lock',wait:Math.ceil(IP_WIN/1000)}];const c=db.cats[key(body.name)];if(!c)return[404,{err:'none'}];const now=Date.now();
    if(c.lockUntil>now)return[429,{err:'lock',wait:Math.ceil((c.lockUntil-now)/1000)}];
    const ok=okCode(body.code)&&crypto.timingSafeEqual(Buffer.from(hashCode(body.code,c.salt),'hex'),Buffer.from(c.hash,'hex'));
    if(!ok){ipFails.get(ip).push(now);c.fails=(c.fails||0)+1;if(c.fails>=MAX_FAIL){c.fails=0;c.lockUntil=now+LOCK_MS;save();return[429,{err:'lock',wait:LOCK_MS/1000}]}save();return[401,{err:'code',left:MAX_FAIL-c.fails}]}
    c.fails=0;c.prev=c.last;c.last=now;const token=issue(c);save();return[200,{cat:pub(c),token}]},
  'GET /me':({me})=>{if(!me)return[401,{err:'auth'}];const c=me.c;c.prev=c.last;c.last=Date.now();save();return[200,{cat:pub(c)}]},
  'PUT /me/state':({me,body})=>{if(!me)return[401,{err:'auth'}];const s=body.state;if(!s||typeof s!=='object'||JSON.stringify(s).length>STATE_MAX)return[400,{err:'bad'}];
    me.c.state={...me.c.state,...s};me.c.last=Date.now();save();return[200,{ok:true}]},
  'POST /logout':({me})=>{if(me){delete db.tokens[me.h];save()}return[200,{ok:true}]}};

/* ---------- 静态文件 ---------- */
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8','.ico':'image/x-icon'};
function serveFile(req,res,p){if(p==='/')p='/index.html';const f=path.join(ROOT,decodeURIComponent(p));
  if(!f.startsWith(ROOT+path.sep)||f.startsWith(__dirname)){res.writeHead(404);return res.end()}
  if(p==='/config.js'&&!fs.existsSync(f)){res.writeHead(200,{'Content-Type':MIME['.js'],'Cache-Control':'no-cache'});return res.end("window.CAT1024_CONFIG={api:'/api'};")}
  fs.stat(f,(e,st)=>{if(e||!st.isFile()){res.writeHead(404);return res.end('not found')}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});fs.createReadStream(f).pipe(res)})}

http.createServer((req,res)=>{const u=new URL(req.url,'http://x'),ip=req.socket.remoteAddress||'';
  if(!u.pathname.startsWith('/api/'))return serveFile(req,res,u.pathname);
  const h=API[req.method+' '+u.pathname.slice(4)];if(!h){res.writeHead(404,{'Content-Type':'application/json'});return res.end('{"err":"none"}')}
  let raw='',big=false;req.on('data',d=>{raw+=d;if(raw.length>BODY_MAX){big=true;req.destroy()}});
  req.on('end',()=>{if(big)return;let body={};if(raw){try{body=JSON.parse(raw)}catch(e){res.writeHead(400);return res.end('{"err":"bad"}')}}
    let out;try{out=h({body,ip,me:who(req)})}catch(e){console.error(e);out=[500,{err:'server'}]}
    res.writeHead(out[0],{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(out[1]))})
}).listen(PORT,HOST,()=>console.log(`1024 猫咖营业中：http://${HOST==='0.0.0.0'?'localhost':HOST}:${PORT}`));
