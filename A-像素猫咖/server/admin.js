/* 1024 猫咖 · 组织者后台的接口：名册、重置暗号、改名、封禁、抽奖（带领奖码）、导出 CSV、屏蔽词。设计见 docs/组织者后台.md。
   全部要带请求头 X-Admin-Key；同一个地址 10 分钟内错 10 次，先歇一会儿。 */
const crypto=require('crypto');
module.exports=(S,live)=>{
const KEY=S.adminKey(),FAIL_MAX=10,FAIL_WIN=10*60e3,fails=new Map();
const same=(a,b)=>crypto.timingSafeEqual(Buffer.from(S.sha(String(a))),Buffer.from(S.sha(String(b))));
function auth(req,ip){const a=(fails.get(ip)||[]).filter(t=>t>Date.now()-FAIL_WIN);fails.set(ip,a);if(a.length>=FAIL_MAX)return 429;
  if(same(req.headers['x-admin-key']||'',KEY))return 0;a.push(Date.now());return 401}

const stamps=c=>{const s=(c.state&&c.state.stamps)||{};return{ball:!!s.ball,inner:!!s.inner,site:!!s.site}};
const eligible=c=>{const s=stamps(c);return !c.banned&&s.ball&&s.inner&&s.site};
const startOfDay=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime()};
const won=c=>(c.prizes||[]).map(p=>p.no);
// 存档是玩家自己交上来的：数字字段一律压成有界的非负整数再给后台看
const int=v=>{const n=Math.floor(Number(v));return Number.isFinite(n)&&n>0?Math.min(n,1e9):0};
function row(c){const g=(c.state&&typeof c.state.g==='object'&&c.state.g)||{},s=stamps(c);
  return{id:c.id,name:c.name,look:c.look,created:c.created,last:c.last,visits:int(c.state&&c.state.visits),balls:int(g.balls),disc:g.disc&&typeof g.disc==='object'?Object.keys(g.disc).length:0,hangs:int(c.hangs),
    stamps:s,eligible:eligible(c),online:live.isOnline(c.id),banned:!!c.banned,flag:s.ball&&!c.hangs?'noHang':null,won:won(c)}}
const cats=()=>Object.values(S.db.cats);
const find=id=>typeof id==='string'&&S.byId(id);

/* ---------- 抽奖：加密随机数洗牌，抽中的每只猫一个 6 位领奖码 ---------- */
const CODE_CH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const claimCode=()=>Array.from({length:6},()=>CODE_CH[crypto.randomInt(CODE_CH.length)]).join('');
function draw({n,fresh,how}){n=Math.floor(+n);if(!(n>=1&&n<=500))return[400,{err:'n'}];how=String(how||'').trim().slice(0,200);
  let pool=cats().filter(eligible);if(fresh)pool=pool.filter(c=>!won(c).length);if(!pool.length)return[409,{err:'empty'}];
  for(let i=pool.length-1;i>0;i--){const j=crypto.randomInt(i+1);[pool[i],pool[j]]=[pool[j],pool[i]]}
  const no=S.db.draws.length+1,t=Date.now(),winners=pool.slice(0,n).map(c=>{const code=claimCode();(c.prizes=c.prizes||[]).push({no,code,how,t,seen:false});live.prize(c.id,{no,code,how});return{id:c.id,name:c.name,code}});
  const d={no,t,n,pool:pool.length,fresh:!!fresh,how,winners};S.db.draws.push(d);S.save();return[200,{draw:d}]}

/* ---------- CSV：带 BOM，Excel 直接打开不乱码 ---------- */
const fmt=t=>{if(!t)return '';const d=new Date(t),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`};
const cell=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
const csv=rows=>'﻿'+rows.map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
function exportCsv(q){const what=q.get('what')||'eligible';
  if(what==='draw'){const d=S.db.draws.find(d=>d.no===+q.get('no'));if(!d)return[404,{err:'none'}];
    return{csv:csv([['轮次','名字','领奖码','抽取时间','怎么领奖'],...d.winners.map(w=>[d.no,w.name,w.code,fmt(d.t),d.how])]),name:`第${d.no}轮中奖名单.csv`}}
  const L=cats().filter(c=>what==='all'||eligible(c)).sort((a,b)=>a.created-b.created);
  return{csv:csv([['名字','登记时间','最近来过','来过几次','解开毛线球','挂进橱窗（服务端记）','解球章','内源章','官网章','有资格','封禁','中过奖'],
    ...L.map(c=>{const r=row(c);return[r.name,fmt(r.created),fmt(r.last),r.visits,r.balls,r.hangs,r.stamps.ball?'✓':'',r.stamps.inner?'✓':'',r.stamps.site?'✓':'',r.eligible?'✓':'',r.banned?'✓':'',r.won.map(n=>'第'+n+'轮').join(' ')]})]),
    name:what==='all'?'全部猫.csv':'有抽奖资格.csv'}}

const R={
  'GET /stats':()=>{const L=cats(),t0=startOfDay(),W=S.db.world;return[200,{cats:L.length,today:L.filter(c=>c.last>=t0).length,eligible:L.filter(eligible).length,
    stamps:{ball:L.filter(c=>stamps(c).ball).length,inner:L.filter(c=>stamps(c).inner).length,site:L.filter(c=>stamps(c).site).length},banned:L.filter(c=>c.banned).length,
    hung:W.hung,hungToday:W.days[S.today()]||0,draws:S.db.draws.length,live:live.stats()}]},
  'GET /cats':()=>[200,{cats:cats().map(row).sort((a,b)=>b.last-a.last)}],
  'POST /reset':({body})=>{const c=find(body.id);if(!c)return[404,{err:'none'}];const code=S.randCode();c.salt=crypto.randomBytes(16).toString('hex');c.hash=S.hashCode(code,c.salt);c.fails=0;c.lockUntil=0;
    S.revoke(c.id);live.kick(c.id,'reset');S.save();return[200,{code,icons:code.map(i=>S.ACC.ICONS[i])}]},
  'POST /rename':({body})=>{const c=find(body.id);if(!c)return[404,{err:'none'}];const why=S.nameWhy(body.name);if(why)return[400,{err:'name',why}];
    const o=S.db.cats[S.key(body.name)];if(o&&o!==c)return[409,{err:'taken',why:`店里已经有一只「${o.name}」了`}];S.rename(c,body.name);live.rename(c.id,c.name);return[200,{ok:true,name:c.name}]},
  'POST /ban':({body})=>{const c=find(body.id);if(!c)return[404,{err:'none'}];c.banned=!!body.on;if(c.banned){S.revoke(c.id);live.kick(c.id,'ban')}S.save();return[200,{ok:true}]},
  'GET /draws':()=>[200,{draws:S.db.draws}],
  'POST /draw':({body})=>draw(body||{}),
  'GET /blocked':()=>[200,{words:S.blocked}],
  'PUT /blocked':({body})=>{if(!Array.isArray(body.words))return[400,{err:'bad'}];S.setBlocked(body.words);return[200,{ok:true,n:S.blocked.length}]},
  'GET /export':({url})=>exportCsv(url.searchParams)};

function handle(method,sub,ctx){const a=auth(ctx.req,ctx.ip);if(a===429)return[429,{err:'lock'}];if(a)return[401,{err:'key'}];const h=R[method+' '+sub];return h?h(ctx):[404,{err:'none'}]}
return{KEY,handle}};
