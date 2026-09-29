/* 1024 猫咖 · 服务端参考实现：零依赖（Node 18+），一个进程同时发网页、接口和联机。
   node server/server.js            → http://127.0.0.1:1024
   PORT=8080 HOST=0.0.0.0 node server/server.js   → 局域网里别的电脑也能开
   DATA_DIR=/tmp/x node server/server.js          → 换一个数据目录（压力测试时别写进正式名册）
   - 账号接口（docs/登录与进店.md）：名字全店唯一（和前端同一份规矩 + 组织者的屏蔽词）；暗号只存 scrypt 散列；输错有次数限制；令牌只存散列。
   - 联机（docs/联机.md）：/ws 上的 WebSocket，见 live.js。
   - 组织者后台（docs/组织者后台.md）：/admin.html 页面 + /api/admin/* 接口，见 admin.js。口令在 server/data/admin.key，启动时打印出来。
   - 页面要的 config.js：目录里有就发那份；没有就现给一份 {api:'/api'}。
   - 忘了暗号：后台"重置暗号"，或者 node server/server.js reset 名字（见下）。 */
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const S=require('./store'),live=require('./live'),admin=require('./admin')(S,live);
const PORT=+process.env.PORT||1024,HOST=process.env.HOST||'127.0.0.1',MAX_FAIL=5,LOCK_MS=10*60e3,IP_WIN=10*60e3,IP_MAX=30,BODY_MAX=64*1024,STATE_MAX=48*1024;
const {db,key}=S;

/* ---------- 忘了暗号：组织者在服务器上重置 ----------
   node server/server.js reset 团子   → 给「团子」换一组随机暗号并打印出来，旧令牌全部作废（先停掉正在跑的服务） */
if(process.argv[2]==='reset'){const c=db.cats[key(process.argv[3])];if(!c){console.log('店里没有这只猫');process.exit(1)}
  const code=S.randCode();c.salt=crypto.randomBytes(16).toString('hex');c.hash=S.hashCode(code,c.salt);c.fails=0;c.lockUntil=0;S.revoke(c.id);S.flush();
  console.log(`「${c.name}」的新暗号：`+code.map(i=>`${i+1} ${S.ACC.ICONS[i]}`).join(' → '));process.exit(0)}

/* ---------- 账号接口 ---------- */
const ipFails=new Map();const ipBad=ip=>{const a=(ipFails.get(ip)||[]).filter(t=>t>Date.now()-IP_WIN);ipFails.set(ip,a);return a.length>=IP_MAX};
const bearer=req=>{const m=/^Bearer (.+)$/.exec(req.headers.authorization||'');return m&&S.who(m[1])};
const API={
  'POST /names':({body})=>{const names=Array.isArray(body.names)?body.names.slice(0,24):[],results={};
    for(const n of names){const why=S.nameWhy(n),c=db.cats[key(n)];results[n]=c?{ok:false,taken:true,why:`店里已经有一只「${c.name}」了`}:why?{ok:false,why}:{ok:true}}return[200,{results}]},
  'POST /cats':({body})=>{const {name,code,look}=body,why=S.nameWhy(name);if(why)return[400,{err:'name',why}];if(!S.okCode(code)||!S.okLook(look))return[400,{err:'bad'}];
    const k=key(name);if(db.cats[k])return[409,{err:'taken',why:`店里已经有一只「${db.cats[k].name}」了`}];
    const salt=crypto.randomBytes(16).toString('hex'),now=Date.now(),c={id:'c'+crypto.randomBytes(8).toString('hex'),name:S.clean(name),look:{coat:look.coat,collar:look.collar,face:look.face},salt,hash:S.hashCode(code,salt),created:now,last:now,prev:0,state:{},fails:0,lockUntil:0};
    db.cats[k]=c;S.reindex();const token=S.issue(c);S.save();return[200,{cat:S.pub(c),token}]},
  'POST /login':({body,ip})=>{if(ipBad(ip))return[429,{err:'lock',wait:Math.ceil(IP_WIN/1000)}];const c=db.cats[key(body.name)];if(!c)return[404,{err:'none'}];const now=Date.now();
    if(c.lockUntil>now)return[429,{err:'lock',wait:Math.ceil((c.lockUntil-now)/1000)}];
    const ok=S.okCode(body.code)&&crypto.timingSafeEqual(Buffer.from(S.hashCode(body.code,c.salt),'hex'),Buffer.from(c.hash,'hex'));
    if(!ok){ipFails.get(ip).push(now);c.fails=(c.fails||0)+1;if(c.fails>=MAX_FAIL){c.fails=0;c.lockUntil=now+LOCK_MS;S.save();return[429,{err:'lock',wait:LOCK_MS/1000}]}S.save();return[401,{err:'code',left:MAX_FAIL-c.fails}]}
    if(c.banned)return[403,{err:'ban'}];
    c.fails=0;c.prev=c.last;c.last=now;const token=S.issue(c);S.save();return[200,{cat:S.pub(c),token}]},
  'GET /me':({me})=>{if(!me)return[401,{err:'auth'}];const c=me.c;c.prev=c.last;c.last=Date.now();S.save();return[200,{cat:S.pub(c)}]},
  'PUT /me/state':({me,body})=>{if(!me)return[401,{err:'auth'}];const s=body.state;if(!s||typeof s!=='object'||JSON.stringify(s).length>STATE_MAX)return[400,{err:'bad'}];
    me.c.state={...me.c.state,...s};me.c.last=Date.now();S.save();return[200,{ok:true}]},
  // 看过"你被抽中了"，下次不再弹
  'POST /me/prize-seen':({me,body})=>{if(!me)return[401,{err:'auth'}];for(const p of me.c.prizes||[])if(p.no===body.no)p.seen=true;S.save();return[200,{ok:true}]},
  'POST /logout':({me})=>{if(me){delete db.tokens[me.h];S.save()}return[200,{ok:true}]}};

/* ---------- 静态文件 ---------- */
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8','.ico':'image/x-icon'};
function serveFile(req,res,p){if(p==='/')p='/index.html';let f;try{f=path.join(S.ROOT,decodeURIComponent(p))}catch(e){res.writeHead(400);return res.end()}
  if(!f.startsWith(S.ROOT+path.sep)||f.startsWith(__dirname)){res.writeHead(404);return res.end()}
  if(p==='/config.js'&&!fs.existsSync(f)){res.writeHead(200,{'Content-Type':MIME['.js'],'Cache-Control':'no-cache'});return res.end("window.CAT1024_CONFIG={api:'/api'};")}
  fs.stat(f,(e,st)=>{if(e||!st.isFile()){res.writeHead(404);return res.end('not found')}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});fs.createReadStream(f).pipe(res)})}

function reply(res,out){if(out&&out.csv!=null){res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(out.name),'Cache-Control':'no-store'});return res.end(out.csv)}
  res.writeHead(out[0],{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(out[1]))}
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://x'),ip=req.socket.remoteAddress||'';
  if(!u.pathname.startsWith('/api/'))return serveFile(req,res,u.pathname);
  const sub=u.pathname.slice(4),isAdmin=sub.startsWith('/admin/'),h=isAdmin?null:API[req.method+' '+sub];
  if(!isAdmin&&!h){res.writeHead(404,{'Content-Type':'application/json'});return res.end('{"err":"none"}')}
  let raw='',big=false;req.on('data',d=>{raw+=d;if(raw.length>BODY_MAX){big=true;req.destroy()}});
  req.on('end',()=>{if(big)return;let body={};if(raw){try{body=JSON.parse(raw)}catch(e){res.writeHead(400);return res.end('{"err":"bad"}')}}
    let out;try{out=isAdmin?admin.handle(req.method,sub.slice(6),{body,ip,req,url:u}):h({body,ip,me:bearer(req)})}catch(e){console.error(e);out=[500,{err:'server'}]}reply(res,out)})});
server.on('upgrade',(req,socket,head)=>{if(new URL(req.url,'http://x').pathname==='/ws')live.upgrade(req,socket,head);else socket.destroy()});
server.listen(PORT,HOST,()=>{const base=`http://${HOST==='0.0.0.0'?'localhost':HOST}:${PORT}`;console.log(`1024 猫咖营业中：${base}\n组织者后台：${base}/admin.html  口令：${admin.KEY}`)});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{S.flush();process.exit(0)});
