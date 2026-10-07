/* 1024 猫咖 · 水晶鱼带回地面（设计见 docs/店内设计.md 第四节"猫猫星球"里的"水晶鱼带回地面"）。
   依赖 world-acts.js（鱼缸）、world-rocket.js（捞到）、world-charms.js（bubblePx）、props-kit.js（bigFishTank 画缸里的水晶鱼）、world4-vista-art.js（特写里的鱼，VA.crystal）。
   - 在猫猫星球的水晶鱼池捞到一条、身边还没有泡泡、自己放进缸里的还不到三条：它钻进水晶泡泡，跟着你走（me.bubble：1 普通、2 金色）。
     记在彩蛋记录 planet 的 bub 上，关了页面下次进店还跟着。
   - 吧台的大鱼缸："把水晶鱼放进大鱼缸"：泡泡飘到缸口破开，鱼游进去；自己放过的记在 planet 的 tank（每条一个数，1 是金的）。
   - 缸里画几条（S.crystalTank）：联机时按全店一共放了几条（服务端记着，world-online.js 填 A.crystal.shared），本机只算你自己的；最多画六条。
   - A.onTank(gold)：放进去的那一刻（world-online.js 接上，发给服务端）。 */
WORLD_MODS.push(A=>{
const {S,P,me,run,say,sfx,news,after}=A,now=()=>A.t,tick=f=>A.tickers.push(f);
const rec=()=>{const e=A.guide.eggs();return e.planet=e.planet||{}},MAX=3,SHOW=6;
const mine=()=>rec().tank||[];
const CR=A.crystal={shared:null,
  want:()=>!me.bubble&&mine().length<MAX,full:()=>mine().length>=MAX,mine:()=>mine().length,
  pocket(gold){const r=rec();r.bub=gold?2:1;A.guide.save();me.bubble=r.bub},
  // 缸里一共几条、几条是金的
  count(){const sh=CR.shared;if(sh)return{n:sh.n,gold:sh.gold};const m=mine();return{n:m.length,gold:m.filter(Boolean).length}}};
const dress=()=>{me.bubble=rec().bub||0};dress();A.on('guideLoad',dress);
tick(()=>{const c=CR.count();S.crystalTank={n:Math.min(SHOW,c.n),gold:Math.min(SHOW,c.gold)}});
if(typeof VA!=='undefined')VA.crystal=()=>S.crystalTank;

/* ---------- 放进大鱼缸 ---------- */
const MOUTH={x:P.tank.x+29,y:P.tank.y+2};let rel=null;   // 正在放：泡泡从你身边飘到缸口
function release(){const r=rec(),gold=r.bub===2;if(!r.bub)return;r.bub=0;(r.tank=r.tank||[]).push(gold?1:0);A.guide.save();me.bubble=0;
  rel={t0:now(),x0:me.x+(me.face==='L'?13:-13),y0:me.y-20,gold};sfx('whoosh');
  after(.9,()=>{sfx('pop');S.puffs.push({x:MOUTH.x,y:MOUTH.y,t0:now()});S.fishPaw=.8;
    if(CR.shared)CR.shared={n:CR.shared.n+1,gold:CR.shared.gold+(gold?1:0)};if(A.onTank)A.onTank(gold);
    news(`${me.label||'你'}把一条${gold?'金色的':''}水晶鱼放进了吧台的大鱼缸`);
    say(mine().length>=MAX?'放进去了。大鱼缸里已经有你的三条水晶鱼了':'放进去了。它在缸里一闪一闪的，凑近看也看得到')})}
{const th=A.TID('tank');if(th){const lab0=th.label,go0=th.go;
  th.label=c=>c.me&&me.bubble?'把水晶鱼放进大鱼缸':typeof lab0==='function'?lab0(c):lab0;
  th.go=c=>{if(!(c.me&&me.bubble)){go0(c);return}run(c,[{go:P.tankView},{fn:c=>{c.face='L'}},{k:'maneki',dur:.8,fn:release},{k:'sit',dur:1.6,ex:'happy',soft:1}])}}}
A.overs.push(vis=>{if(!rel)return;const k=(now()-rel.t0)/.9;if(k>=1){rel=null;return}const e=k*k*(3-2*k),x=rel.x0+(MOUTH.x-rel.x0)*e,y=rel.y0+(MOUTH.y-6-rel.y0)*e-Math.sin(k*Math.PI)*14;
  if(vis(x-8,y-8,16,16))bubblePx(x,y,now(),rel.gold)});
// 缸里的水晶鱼在夜里亮一团淡青的光（金的再多一点金光）
tick(()=>{const c=S.crystalTank;if(!c||!c.n)return;A.lights.push({x:MOUTH.x,y:P.tank.y+14,r:20+c.n*2,col:'#7ae8ff',a:.16+.04*c.n});if(c.gold)A.lights.push({x:MOUTH.x,y:P.tank.y+14,r:14,col:'#ffd84a',a:.12+.04*c.gold});
  if(rel)A.lights.push({x:rel.x0+(MOUTH.x-rel.x0)*Math.min(1,(now()-rel.t0)/.9),y:rel.y0,r:15,col:rel.gold?'#ffd84a':'#7ae8ff',a:.8})});
});
