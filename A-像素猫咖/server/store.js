/* 1024 猫咖 · 服务端的库：名册、令牌、店里共同的计数、抽奖记录，以及名字的规矩（和前端是同一份：js/account.js 的 Account.rule）和屏蔽词。
   数据在 server/data/（不进仓库；环境变量 DATA_DIR 可以换一个目录，压力测试时用）：
   - cats.json：{cats:{名字键:猫}, tokens:{令牌散列:{id,k,exp}}, world:{hung, days:{日期:件数}, tree:[{kind,ci}]}, draws:[...]}
   - blocked.txt：屏蔽词，一行一个（组织者在后台维护）
   - admin.key：后台口令（第一次启动时生成；也可以用环境变量 ADMIN_KEY） */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..'),DATA=process.env.DATA_DIR?path.resolve(process.env.DATA_DIR):path.join(__dirname,'data');
const DB_FILE=path.join(DATA,'cats.json'),BLOCK_FILE=path.join(DATA,'blocked.txt'),KEY_FILE=path.join(DATA,'admin.key');
const TOKEN_DAYS=90;

// 和前端共用的名字规矩
const ACC=vm.runInNewContext(fs.readFileSync(path.join(ROOT,'js/account.js'),'utf8')+';Account',{window:{},localStorage:null,crypto:globalThis.crypto,TextEncoder,console});
const key=s=>String(s||'').normalize('NFKC').trim().toLowerCase(),clean=s=>String(s||'').normalize('NFKC').trim();
const okCode=c=>Array.isArray(c)&&c.length===ACC.CODE_LEN&&c.every(i=>Number.isInteger(i)&&i>=0&&i<ACC.ICONS.length);
const okLook=l=>l&&Number.isInteger(l.coat)&&l.coat>=0&&l.coat<9&&Number.isInteger(l.collar)&&l.collar>=0&&l.collar<6&&typeof l.face==='string'&&l.face.length<16;
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const hashCode=(code,salt)=>crypto.scryptSync(code.join('-'),salt,32,{N:16384,r:8,p:1}).toString('hex');
const randCode=()=>Array.from({length:ACC.CODE_LEN},()=>crypto.randomInt(ACC.ICONS.length));

/* ---------- 库 ---------- */
const db={cats:{},tokens:{},world:{hung:0,days:{},tree:[]},draws:[]};
try{const j=JSON.parse(fs.readFileSync(DB_FILE,'utf8'));Object.assign(db,j);db.world={hung:0,days:{},tree:[],...(j.world||{})};db.draws=j.draws||[]}catch(e){}
const byIdMap=new Map();const reindex=()=>{byIdMap.clear();for(const [k,c] of Object.entries(db.cats))byIdMap.set(c.id,k)};reindex();
const byId=id=>{const k=byIdMap.get(id);return k?db.cats[k]:null};
let saveT=null;
function writeNow(){fs.mkdirSync(DATA,{recursive:true});const tmp=DB_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db));fs.renameSync(tmp,DB_FILE)}
function save(){if(saveT)return;saveT=setTimeout(()=>{saveT=null;writeNow()},200)}
function flush(){if(saveT){clearTimeout(saveT);saveT=null;writeNow()}}

/* ---------- 名字：格式规矩 + 屏蔽词 ---------- */
let blocked=[];try{blocked=fs.readFileSync(BLOCK_FILE,'utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'))}catch(e){}
const bare=s=>key(s).replace(/[\s\p{P}\p{S}]/gu,'');
function nameWhy(name){const r=ACC.rule(name);if(r)return r.why;const b=bare(name);if(blocked.some(w=>{const x=bare(w);return x&&b.includes(x)}))return '这个名字不太合适，换一个吧';return null}
function setBlocked(words){blocked=[...new Set(words.map(s=>String(s).normalize('NFKC').trim()).filter(Boolean))].slice(0,2000);fs.mkdirSync(DATA,{recursive:true});
  fs.writeFileSync(BLOCK_FILE,'# 屏蔽词：一行一个。名字去掉空格和标点以后含有其中任何一个，都不能用。\n'+blocked.join('\n')+'\n')}

/* ---------- 令牌 ---------- */
function issue(c){const t=crypto.randomBytes(32).toString('base64url');db.tokens[sha(t)]={id:c.id,k:key(c.name),exp:Date.now()+TOKEN_DAYS*864e5};return t}
function who(token){if(!token)return null;const h=sha(token),tk=db.tokens[h];if(!tk)return null;
  if(tk.exp<Date.now()){delete db.tokens[h];save();return null}const c=db.cats[tk.k];if(!c||c.id!==tk.id||c.banned)return null;tk.exp=Date.now()+TOKEN_DAYS*864e5;return{c,h}}
function revoke(id){for(const [h,t] of Object.entries(db.tokens))if(t.id===id)delete db.tokens[h];save()}
// 改名：名册按名字键存，令牌里也记着名字键
function rename(c,name){const k0=key(c.name),k1=key(name);delete db.cats[k0];c.name=clean(name);db.cats[k1]=c;for(const t of Object.values(db.tokens))if(t.id===c.id)t.k=k1;reindex();save()}

/* ---------- 给前端看的猫 ---------- */
const pub=c=>({id:c.id,name:c.name,look:c.look,created:c.created,last:c.last,prev:c.prev,state:c.state||{},prizes:(c.prizes||[]).filter(p=>!p.seen).map(({no,code,how,t})=>({no,code,how,t}))});
const today=(t=Date.now())=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

/* ---------- 后台口令 ---------- */
function adminKey(){if(process.env.ADMIN_KEY)return process.env.ADMIN_KEY;try{const k=fs.readFileSync(KEY_FILE,'utf8').trim();if(k)return k}catch(e){}
  const k=crypto.randomBytes(12).toString('base64url');fs.mkdirSync(DATA,{recursive:true});fs.writeFileSync(KEY_FILE,k+'\n',{mode:0o600});return k}

module.exports={ROOT,DATA,ACC,db,key,clean,okCode,okLook,sha,hashCode,randCode,byId,reindex,save,flush,nameWhy,setBlocked,get blocked(){return blocked},issue,who,revoke,rename,pub,today,adminKey};
