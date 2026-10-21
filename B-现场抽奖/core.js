/* 1024 现场抽奖 · 规则（设计见 README.md）：每一档奖品一个固定的中奖概率，每次抽都独立；剩下的概率是谢谢惠顾。
   某一档发完了，它那份概率直接算谢谢惠顾（不匀给别的奖）。谢谢惠顾发一张猫猫图鉴卡（卡很多，不记库存，只数发了几张）。
   中奖登记工号、同工号提醒、作废放回。
   只改传进来的 state，不读写文件；时间 now、随机数 rnd（返回 [0,1)）从外面传。回了 {err} 的，state 一点没动。
   state = {open, note, prizes:[{id, tier, name, prob 百分数, stock, given}], draws:[{no, t, prize, tier, name, card, emp, et, void, req}]} */
const TIERS=[1,2,3];
const LOSE='谢谢惠顾';
const int=v=>Number.isInteger(v);
const str=(v,max)=>typeof v==='string'&&v.trim().length>=1&&v.trim().length<=max;
const num=v=>typeof v==='number'&&Number.isFinite(v);
// 工号：去掉空格、转大写；字母、数字、- _，2～32 位（和猫咖的集章登记一样）
const empKey=e=>String(e==null?'':e).normalize('NFKC').replace(/\s+/g,'').toUpperCase();
const empOk=k=>/^[A-Z0-9_-]{2,32}$/.test(k);

const fresh=()=>({open:true,note:'',prizes:[],draws:[]});
// 读库：缺的补上。旧版（按权重抽、谢谢惠顾也是一档、图鉴卡有库存）读进来：谢谢惠顾那一档去掉，没有概率的当 0（设置页里补上）
function load(j){const s={...fresh(),...(j&&typeof j==='object'&&!Array.isArray(j)?j:{})};delete s.card;
  if(!Array.isArray(s.prizes))s.prizes=[];if(!Array.isArray(s.draws))s.draws=[];
  s.prizes=s.prizes.filter(p=>p&&TIERS.includes(p.tier));for(const p of s.prizes){if(!num(p.prob)||p.prob<0)p.prob=0;delete p.weight}return s}

const rest=p=>p.stock===null?null:p.stock-p.given;
const out=p=>p.stock!==null&&p.given>=p.stock;
const sumProb=(s,skip)=>s.prizes.reduce((t,p)=>p===skip?t:t+p.prob,0);
const winOf=s=>s.draws.find(d=>d.tier>0&&!d.void&&!d.emp)||null;   // 中了奖还没登记的那一次
const cards=s=>s.draws.filter(d=>d.card&&!d.void).length;
// 此刻谢谢惠顾的概率：没分出去的，加上已经发完的那几档
const loseProb=s=>100-s.prizes.reduce((t,p)=>out(p)?t:t+p.prob,0);
// 抽的顺序：一等奖、二等奖、三等奖，同一等按加进来的先后
const order=s=>s.prizes.map((p,i)=>[p,i]).sort((a,b)=>a[0].tier-b[0].tier||a[1]-b[1]).map(x=>x[0]);

/* ---------- 奖品 ---------- */
// 概率是百分数：0～100，最多两位小数（1 就是 1%，0.5 就是 0.5%）；各档加起来不能超过 100
const prizeBad=p=>!p||!TIERS.includes(p.tier)||!str(p.name,30)||!(num(p.prob)&&p.prob>=0&&p.prob<=100&&Math.abs(p.prob*100-Math.round(p.prob*100))<1e-6)||!(p.stock===null||(int(p.stock)&&p.stock>=0&&p.stock<=1e5));
// 新加（没有 id 的）或者改；改库存不能少于已经发出去的
function setPrize(s,p,newId){const x=p&&p.id?s.prizes.find(q=>q.id===p.id):null;if(p&&p.id&&!x)return{err:'none'};
  const y={tier:p.tier,name:typeof p.name==='string'?p.name.trim():p.name,prob:p.prob,stock:p.stock===undefined?null:p.stock};if(prizeBad(y))return{err:'bad'};
  if(sumProb(s,x)+y.prob>100+1e-9)return{err:'sum'};
  if(x){if(y.stock!==null&&y.stock<x.given)return{err:'bad'};Object.assign(x,y);return{prize:x}}
  const n={id:newId,...y,given:0};s.prizes.push(n);return{prize:n}}
function delPrize(s,id){const i=s.prizes.findIndex(q=>q.id===id);if(i<0)return{err:'none'};if(s.prizes[i].given>0)return{err:'bad'};return{prize:s.prizes.splice(i,1)[0]}}
function restock(s,id,n){const x=s.prizes.find(q=>q.id===id);if(!x)return{err:'none'};if(!int(n)||n<1||n>1e5||x.stock===null)return{err:'bad'};x.stock+=n;return{prize:x}}
// 设置：暂停开关、抽奖页上的一句提示
function settings(s,o){const n={};if('open' in o){if(typeof o.open!=='boolean')return{err:'bad'};n.open=o.open}
  if('note' in o){if(typeof o.note!=='string'||o.note.length>60)return{err:'bad'};n.note=o.note.trim()}
  if('open' in n)s.open=n.open;if('note' in n)s.note=n.note;return{ok:true}}

/* ---------- 抽 ---------- */
// 在 0～100 上掷一个数：落进哪一档的那一段就是哪一档；那一档发完了，或者落在各档之外，都是谢谢惠顾
function pick(s,rnd){const r=rnd()*100;let c=0;for(const p of order(s)){c+=p.prob;if(r<c)return out(p)?null:p}return null}
// req：抽奖页给这一次起的编号。回复在路上丢了、抽奖页拿同一个编号再来，就把那一次原样还给它（again），不再抽一次
const reqOk=r=>typeof r==='string'&&/^[a-z0-9]{8,40}$/.test(r);
function draw(s,now,rnd,req){if(reqOk(req)){const d=s.draws.find(x=>x.req===req);if(d)return{draw:d,again:true}}
  if(!s.open)return{err:'closed'};const w=winOf(s);if(w)return{err:'pending',no:w.no};
  const p=pick(s,rnd);if(p)p.given++;
  const d={no:s.draws.length+1,t:now,prize:p?p.id:null,tier:p?p.tier:0,name:p?p.name:LOSE,card:!p,emp:null,et:null,void:false};if(reqOk(req))d.req=req;s.draws.push(d);return{draw:d}}

/* ---------- 中奖登记、作废 ---------- */
// 同一个工号之前中过（没作废的），不带 force 就回 dup 和之前那几次，让工作人员决定；登记过的再登记一次就是改
function claim(s,no,emp,force,now){const d=s.draws.find(x=>x.no===no);if(!d)return{err:'none'};if(d.tier===0||d.void)return{err:'bad'};
  const k=empKey(emp);if(!empOk(k))return{err:'bad'};
  const prev=s.draws.filter(x=>x!==d&&x.tier>0&&!x.void&&x.emp===k).map(x=>({no:x.no,tier:x.tier,name:x.name}));if(prev.length&&!force)return{err:'dup',prev};
  d.emp=k;d.et=now;return{draw:d}}
function voidDraw(s,no){const d=s.draws.find(x=>x.no===no);if(!d)return{err:'none'};if(d.tier===0||d.void)return{err:'bad'};
  const p=s.prizes.find(q=>q.id===d.prize);if(p&&p.given>0)p.given--;d.void=true;return{draw:d}}
// 清空重来（彩排完用）：记录清掉、已发归零，奖品设置留着
function reset(s){s.draws=[];for(const p of s.prizes)p.given=0;return{ok:true}}

module.exports={TIERS,LOSE,empKey,empOk,fresh,load,rest,out,winOf,cards,loseProb,setPrize,delPrize,restock,settings,pick,draw,claim,voidDraw,reset};
