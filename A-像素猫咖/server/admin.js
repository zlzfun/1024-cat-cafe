/* 1024 猫咖 · 组织者后台的接口：名册、换名字、封禁、抽奖登记按工号去重、抽奖（带领奖码）、导出 CSV、清空登记。设计见 docs/组织者后台.md。
   全部要带请求头 X-Admin-Key；同一个地址 10 分钟内错 10 次，先歇一会儿。 */
const crypto=require('crypto');
module.exports=(S,live)=>{
const KEY=S.adminKey(),FAIL_MAX=10,FAIL_WIN=10*60e3,fails=new Map();
const same=(a,b)=>crypto.timingSafeEqual(Buffer.from(S.sha(String(a))),Buffer.from(S.sha(String(b))));
function auth(req,ip){const a=(fails.get(ip)||[]).filter(t=>t>Date.now()-FAIL_WIN);fails.set(ip,a);if(a.length>=FAIL_MAX)return 429;
  if(same(req.headers['x-admin-key']||'',KEY))return 0;a.push(Date.now());return 401}

const stamps=c=>{const s=(c.state&&c.state.stamps)||{};return{ball:!!s.ball,inner:!!s.inner,site:!!s.site}};
// 集齐三个章、没被封禁
const eligible=c=>{const s=stamps(c);return !c.banned&&s.ball&&s.inner&&s.site};
const ek=c=>S.ACC.empKey(c.entry.emp);
const startOfDay=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime()};
const won=c=>(c.prizes||[]).map(p=>p.no);
// 存档是玩家自己交上来的：数字字段一律压成有界的非负整数再给后台看
const int=v=>{const n=Math.floor(Number(v));return Number.isFinite(n)&&n>0?Math.min(n,1e9):0};
const cats=()=>Object.values(S.db.cats);
// 每个工号登记在几只猫上（名册里标"同工号"用）
const empCount=()=>{const m=new Map();for(const c of cats())if(c.entry)m.set(ek(c),(m.get(ek(c))||0)+1);return m};
function row(c,ec=empCount()){const g=(c.state&&typeof c.state.g==='object'&&c.state.g)||{},s=stamps(c);
  return{id:c.id,name:c.name,look:c.look,created:c.created,last:c.last,visits:int(c.state&&c.state.visits),balls:int(g.balls),disc:g.disc&&typeof g.disc==='object'?Object.keys(g.disc).length:0,hangs:int(c.hangs),
    stamps:s,entry:S.pubEntry(c),dup:c.entry?ec.get(ek(c))-1:0,eligible:eligible(c),online:live.isOnline(c.id),banned:!!c.banned,flag:s.ball&&!c.hangs?'noHang':null,won:won(c)}}
/* ---------- 能抽的人：集齐三个章、登记了、没被封禁的猫，按工号合成一个人；姓名和联系方式以最早那次登记为准 ---------- */
function people(){const m=new Map();for(const c of cats()){if(!c.entry||!eligible(c))continue;const k=ek(c);let p=m.get(k);if(!p){p={k,first:c.entry,cats:[]};m.set(k,p)}p.cats.push(c);if(c.entry.t<p.first.t)p.first=c.entry}
  return[...m.values()].map(p=>({cats:p.cats,real:p.first.real,emp:p.first.emp,contact:p.first.contact,t:p.first.t}))}
const find=id=>typeof id==='string'&&S.byId(id);

/* ---------- 抽奖：从能抽的人里用加密随机数洗牌，抽中的每个人一个 6 位领奖码，他名下的猫都会在店里收到 ---------- */
const CODE_CH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const claimCode=()=>Array.from({length:6},()=>CODE_CH[crypto.randomInt(CODE_CH.length)]).join('');
function draw({n,fresh,how}){n=Math.floor(+n);if(!(n>=1&&n<=500))return[400,{err:'n'}];how=String(how||'').trim().slice(0,200);
  let pool=people();if(fresh)pool=pool.filter(p=>!p.cats.some(c=>won(c).length));if(!pool.length)return[409,{err:'empty'}];
  for(let i=pool.length-1;i>0;i--){const j=crypto.randomInt(i+1);[pool[i],pool[j]]=[pool[j],pool[i]]}
  const no=S.db.draws.length+1,t=Date.now(),winners=pool.slice(0,n).map(p=>{const code=claimCode();
    for(const c of p.cats){(c.prizes=c.prizes||[]).push({no,code,how,t,seen:false});live.prize(c.id,{no,code,how})}
    return{ids:p.cats.map(c=>c.id),names:p.cats.map(c=>c.name),real:p.real,emp:p.emp,contact:p.contact,code}});
  const d={no,t,n,pool:pool.length,fresh:!!fresh,how,winners};S.db.draws.push(d);S.save();return[200,{draw:d}]}

/* ---------- CSV：带 BOM，Excel 直接打开不乱码 ---------- */
const fmt=t=>{if(!t)return '';const d=new Date(t),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`};
const cell=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
const csv=rows=>'﻿'+rows.map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
const wonNos=L=>[...new Set(L.flatMap(won))].sort((a,b)=>a-b).map(n=>'第'+n+'轮').join(' ');
function exportCsv(q){const what=q.get('what')||'people';
  if(what==='draw'){const d=S.db.draws.find(d=>d.no===+q.get('no'));if(!d)return[404,{err:'none'}];
    return{csv:csv([['轮次','姓名','工号','联系方式','猫','领奖码','抽取时间','怎么领奖'],...d.winners.map(w=>[d.no,w.real||'',w.emp||'',w.contact||'',(w.names||[w.name]).join(' / '),w.code,fmt(d.t),d.how])]),name:`第${d.no}轮中奖名单.csv`}}
  if(what==='people'){const L=people().sort((a,b)=>a.t-b.t);
    return{csv:csv([['姓名','工号','联系方式','登记时间','名下的猫','中过奖'],...L.map(p=>[p.real,p.emp,p.contact,fmt(p.t),p.cats.map(c=>c.name).join(' / '),wonNos(p.cats)])]),name:'抽奖名单.csv'}}
  const ec=empCount(),L=cats().sort((a,b)=>a.created-b.created);
  return{csv:csv([['名字','登记时间','最近来过','来过几次','解开毛线球','挂进橱窗（服务端记）','解球章','内源章','官网章','集齐','姓名','工号','联系方式','同工号还有几只','封禁','中过奖'],
    ...L.map(c=>{const r=row(c,ec),e=r.entry||{};return[r.name,fmt(r.created),fmt(r.last),r.visits,r.balls,r.hangs,r.stamps.ball?'✓':'',r.stamps.inner?'✓':'',r.stamps.site?'✓':'',r.eligible?'✓':'',e.real||'',e.emp||'',e.contact||'',r.dup||'',r.banned?'✓':'',r.won.map(n=>'第'+n+'轮').join(' ')]})]),
    name:'全部猫.csv'}}

const R={
  'GET /stats':()=>{const L=cats(),t0=startOfDay(),W=S.db.world;return[200,{cats:L.length,today:L.filter(c=>c.last>=t0).length,eligible:L.filter(eligible).length,people:people().length,entries:L.filter(c=>c.entry).length,
    stamps:{ball:L.filter(c=>stamps(c).ball).length,inner:L.filter(c=>stamps(c).inner).length,site:L.filter(c=>stamps(c).site).length},banned:L.filter(c=>c.banned).length,
    hung:W.hung,hungToday:W.days[S.today()]||0,draws:S.db.draws.length,eggs:W.eggs||{},crystal:W.crystal||{n:0,gold:0},live:live.stats()}]},
  'GET /cats':()=>{const ec=empCount();return[200,{cats:cats().map(c=>row(c,ec)).sort((a,b)=>b.last-a.last)}]},
  // 换个名字：从还空着的名字里另发一个
  'POST /rename':({body})=>{const c=find(body.id);if(!c)return[404,{err:'none'}];const [name]=S.offer(1,[c.name]);if(!name)return[409,{err:'full'}];
    S.rename(c,name);live.rename(c.id,c.name);return[200,{ok:true,name:c.name}]},
  'POST /ban':({body})=>{const c=find(body.id);if(!c)return[404,{err:'none'}];c.banned=!!body.on;if(c.banned){S.revoke(c.id);live.kick(c.id,'ban')}S.save();return[200,{ok:true}]},
  'GET /draws':()=>[200,{draws:S.db.draws}],
  'POST /draw':({body})=>draw(body||{}),
  // 活动结束以后：删掉所有猫上的姓名、工号、联系方式，中奖记录里的也一起抹掉，只留猫的名字和领奖码
  'POST /entries/clear':()=>{let n=0;for(const c of cats())if(c.entry){delete c.entry;n++}for(const d of S.db.draws)for(const w of d.winners){delete w.real;delete w.emp;delete w.contact}S.save();return[200,{ok:true,n}]},
  'GET /export':({url})=>exportCsv(url.searchParams)};

function handle(method,sub,ctx){const a=auth(ctx.req,ctx.ip);if(a===429)return[429,{err:'lock'}];if(a)return[401,{err:'key'}];const h=R[method+' '+sub];return h?h(ctx):[404,{err:'none'}]}
return{KEY,handle}};
