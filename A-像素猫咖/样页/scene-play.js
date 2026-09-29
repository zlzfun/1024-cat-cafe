/* 1024 猫咖 · 场景 v2 引擎。依赖 cat-sprites.js、scene-kit.js、scene-map.js。
   makeCafe(canvas, {play, ui}) → {S, me, tick(t, dt, draw), cmd}
     play=true 时玩家操控"你"：方向键 / 点地面走过去，空格 / 点东西、点猫互动；
     play=false 时全自动，"你"也交给 AI——用来展示没人在线的时候，店里照样营业。
   一颗毛线球的一生：门外塞进投递口（门铃、翻盖、掉出来滚进毛线篮）→ 猫叼走（看便签）→ 屁股扭扭扑过去、随机一种玩法解开
     → 织成一件小物件 → 跳上窗台挂进橱窗 → 过一会儿人类取走，窗外飘起一颗心。自己解不了可以传给别的猫（它会按性格回应）。
   每只猫身上有一条动作队列 q：{go 走到 / chase 追着走} {jump 跳到} {k 姿态, dur 秒} {when 等到} {fn 回调}，队列空了才轮到 AI 想下一件事。
   玩家的新指令会打断走路和 soft（收尾的小动作），但不会打断正在做的动作——那时点的地方先记下，做完再去。 */
const NOTES=['CI 又红了，帮我看看','这个 bug 只在周五下午出现','文档里的示例跑不起来','想要一个一键部署的按钮','帮我给这个函数起个名字','接口偶尔超时，就一点点',
  '新人入门指南在哪里','能帮我补几个单元测试吗','这段代码是谁写的（好像是我）','想把老项目迁到新框架','日志太多，找不到重点','帮我 review 一下这个 PR',
  '需求：做一只会写代码的猫','周报还差最后一段','测试环境又连不上了','能不能把按钮再往左挪一点'];
const rnd=a=>a[Math.floor(Math.random()*a.length)],rr=(a,b)=>a+Math.random()*(b-a);
const pickW=w=>{const e=Object.entries(w).filter(([,v])=>v>0),s=e.reduce((a,[,v])=>a+v,0);let r=Math.random()*s;for(const [k,v] of e)if((r-=v)<=0)return k;return e[0][0]};
// 按性格权重挑一个待机动作（只在 allow 里挑）
const pickIdle=(b,allow)=>pickW(Object.fromEntries(allow.map(k=>[k,PERSONA[b].idle[k]??1])));

function makeCafe(canvas,{play=false,ui={}}={}){
const M=CAFE,P=M.P,ctx=canvas.getContext('2d');canvas.width=M.w;canvas.height=M.h;
const S={tod:'day',weather:'sun',count:0,inbox:[],door:{ring:0,flap:0},arrive:null,line:[null,null,null,null,null],hearts:[],puffs:[],flying:[],
  feed:{level:3,drop:0,food:1},box:null,fishPaw:0,catnipUsed:0,plantShake:0,bird:null,brew:0,goal:0,cats:[],now:0};
let now=0,timers=[],nextArrive=2,nextBird=rr(20,40),nextFeed=40;
const after=(s,f)=>timers.push({s,f}),say=s=>ui.toast&&ui.toast(s);

/* ---------- 走路：碰撞 + A* 寻路 ---------- */
const free=(x,y,m=4)=>x>=8&&x<=M.w-8&&y>=58&&y<=M.h-3&&!M.BLOCK.some(([bx,by,bw,bh])=>x>bx-m&&x<bx+bw+m&&y>by-1&&y<by+bh+1);
const FREE={cat:(x,y)=>free(x,y),vac:(x,y)=>free(x,y,9)&&y>=62};
const G=4,GW=M.w/G,GH=M.h/G,GRID={};
for(const k in FREE){const g=new Uint8Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)g[j*GW+i]=FREE[k](i*G+2,j*G+2)?1:0;GRID[k]=g}
function nearCell(g,i,j){i=Math.max(0,Math.min(GW-1,i));j=Math.max(0,Math.min(GH-1,j));if(g[j*GW+i])return j*GW+i;
  const seen=new Set([j*GW+i]),q=[j*GW+i];while(q.length){const k=q.shift(),a=k%GW,b=(k/GW)|0;
    for(const [da,db] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=a+da,y=b+db;if(x<0||y<0||x>=GW||y>=GH)continue;const n=y*GW+x;if(seen.has(n))continue;seen.add(n);if(g[n])return n;q.push(n)}}return j*GW+i}
const cellPt=k=>({x:(k%GW)*G+2,y:((k/GW)|0)*G+2});
function los(fr,a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2);for(let i=1;i<=n;i++)if(!fr(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true}
function findPath(x0,y0,x1,y1,kind='cat'){const g=GRID[kind],fr=FREE[kind],s=nearCell(g,Math.floor(x0/G),Math.floor(y0/G)),goal=nearCell(g,Math.floor(x1/G),Math.floor(y1/G));
  const end=fr(x1,y1)?{x:x1,y:y1}:cellPt(goal),start={x:x0,y:y0};if(los(fr,start,end))return[end];
  const N=GW*GH,gs=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),done=new Uint8Array(N),heap=[],gi=goal%GW,gj=(goal/GW)|0;
  const push=(f,k)=>{heap.push([f,k]);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m}}return top};
  const h=k=>{const dx=Math.abs(k%GW-gi),dy=Math.abs(((k/GW)|0)-gj);return Math.max(dx,dy)+.414*Math.min(dx,dy)};
  gs[s]=0;push(h(s),s);
  while(heap.length){const [,k]=pop();if(k===goal)break;if(done[k])continue;done[k]=1;const i=k%GW,j=(k/GW)|0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const x=i+di,y=j+dj;if(x<0||y<0||x>=GW||y>=GH)continue;const n=y*GW+x;if(!g[n]||done[n])continue;
      if(di&&dj&&(!g[j*GW+x]||!g[y*GW+i]))continue;const ng=gs[k]+(di&&dj?1.414:1);if(ng<gs[n]){gs[n]=ng;from[n]=k;push(ng+h(n),n)}}}
  if(goal!==s&&from[goal]<0)return null;
  const pts=[];for(let k=goal;k!==s&&k!==-1;k=from[k])pts.push(cellPt(k));pts.reverse();if(!pts.length)return[end];pts[pts.length-1]=end;
  const out=[];let cur=start,i=0;while(i<pts.length){let j=pts.length-1;while(j>i&&!los(fr,cur,pts[j]))j--;out.push(pts[j]);cur=pts[j];i=j+1}return out}
function randFree(x0=20,y0=64,x1=300,y1=174){for(let n=0;n<40;n++){const x=rr(x0,x1),y=rr(y0,y1);if(free(x,y))return{x,y}}return{x:160,y:150}}

/* ---------- 猫 ---------- */
const HOME={sofa:{x:250,y:159,z:170.5,face:'R',floor:P.sofaFloor},treeTop:{x:P.treeTop.x,y:P.treeTop.y,z:116.5,face:'R',floor:P.treeFloor,via:{...P.treeMid,z:116.4}},
  counter:{x:P.counterTop.x,y:P.counterTop.y,z:80.5,face:'R',floor:P.counterFloor}};
const SEATS={sofa:{x:282,y:159,z:170.4,face:'L',floor:{x:290,y:176}},tree:{...P.treeMid,z:116.4,face:'R',floor:P.treeFloor},sun:{...P.sun,face:'R'}};
function mkCat(b,x,y,o){return Object.assign({b,name:BREEDS[b].name,x,y,k:'sit',face:'R',o:Math.random()*3,q:[],cur:null,wait:rr(1,4),sp:26,hold:null},o)}
const me=mkCat(0,160,150,{me:play?1:0,sp:play?46:30,role:play?'player':'auto',likes:{work:6,sun:1,eat:1,fish:1}});
const CAST=[mkCat(1,0,0,{role:'home',home:'sofa',pool:['sleep','knead','lie','belly']}),mkCat(2,0,0,{role:'home',home:'treeTop',pool:['lie','sleep','lick','sit']}),
  mkCat(6,0,0,{role:'home',home:'counter',pool:['sleep','lie','lick','sit']}),
  mkCat(3,48,130,{role:'roam',likes:{fish:3,window:2,sun:1,eat:1}}),mkCat(4,90,120,{role:'roam',likes:{vac:4,box:3,catnip:2,eat:1}}),
  mkCat(5,200,140,{role:'roam',likes:{work:6,sun:1,eat:1}})];
CAST.filter(c=>c.home).forEach(c=>{const h=HOME[c.home];Object.assign(c,{x:h.x,y:h.y,z:h.z,face:h.face,atHome:true,k:c.pool[0]})});
S.cats=[...CAST,me];const byName=n=>S.cats.find(c=>c.name===n);

function setK(c,k,ex){c.k=k;c.t0=now;c.ex=ex??c.myFace;c.mirror=false}   // myFace：玩家自己选的表情
function run(c,steps,keep){if(!keep){c.q=[];c.cur=null;c.dy=0;c.slot=null;if(S.eater===c){S.eater=null;c.z=undefined}}c.q.push(...steps)}
const idle=c=>!c.cur&&!c.q.length;
const restPose=c=>c.hold&&!c.hold.knit?'hold':'sit';
function startStep(c,s){
  if(s.fn)s.fn(c);
  if(s.go||s.chase){s.tgt=s.chase?s.chase():typeof s.go==='function'?s.go():s.go;s.path=s.direct?[s.tgt]:findPath(c.x,c.y,s.tgt.x,s.tgt.y);s.re=now+.6;c.z=s.z}
  if(s.jump){const j=typeof s.jump==='function'?s.jump():s.jump;s.j=j;s.t0=now;s.x0=c.x;s.y0=c.y;s.dur=s.dur||.42;s.h=s.h??Math.max(5,Math.abs(j.y-c.y)*.35);
    const dx=j.x-c.x;if(Math.abs(dx)>8){c.face=dx>0?'R':'L';setK(c,'leap')}else setK(c,'sit');c.z=Math.max(c.z??c.y,j.z??j.y)}
  if(s.k){setK(c,s.k,s.ex);if(s.face)c.face=s.face;if(s.yarn&&c.hold)c.yarn=c.hold.ci;c.mirror=!!s.mirror}
  if(s.dur!=null&&!s.jump)s.until=now+s.dur}
function stepCat(c,dt){
  if(!c.cur){if(!c.q.length)return;c.cur=c.q.shift();startStep(c,c.cur);if(!c.cur)return}
  const s=c.cur;let fin=false;
  if(s.go||s.chase){if(s.chase&&now>s.re){const t2=s.chase();if(Math.hypot(t2.x-s.tgt.x,t2.y-s.tgt.y)>5){s.tgt=t2;s.path=findPath(c.x,c.y,t2.x,t2.y)}s.re=now+.6}
    if(!s.path||!s.path.length)fin=true;
    else{const p=s.path[0],dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy),st=Math.min(d,(s.sp||c.sp)*dt);
      if(d>.01){c.x+=dx/d*st;c.y+=dy/d*st;if(Math.abs(dx)>.5)c.face=dx>0?'R':'L'}if(c.k!==(c.face==='L'?'walkL':'walkR'))setK(c,c.face==='L'?'walkL':'walkR');
      if(d-st<.3){s.path.shift();if(!s.path.length)fin=true}
      if(s.near&&Math.hypot(s.tgt.x-c.x,s.tgt.y-c.y)<s.near)fin=true}
    if(fin&&!s.keepPose)setK(c,restPose(c))}
  else if(s.jump){const k=Math.min(1,(now-s.t0)/s.dur);c.x=s.x0+(s.j.x-s.x0)*k;c.y=s.y0+(s.j.y-s.y0)*k;c.dy=-Math.sin(k*Math.PI)*s.h;
    if(k>=1){c.dy=0;c.z=s.j.z;if(s.j.face)c.face=s.j.face;setK(c,restPose(c));fin=true}}
  else if(s.until!=null)fin=now>=s.until;
  else if(s.when)fin=s.when(c);
  else fin=true;
  if(fin){c.cur=null;if(s.then)s.then(c)}}
// 让一只闲着的猫临时做个动作，做完回到原来的姿态
function borrow(c,k,dur,ex){if(!idle(c)||c.riding||c.hidden)return false;const pk=c.k,pe=c.ex;run(c,[{k,dur,ex},{k:pk,dur:0,ex:pe}]);return true}
function emote(c,kind,sec){c.emote=kind;c.emoteUntil=now+sec}

/* ---------- 毛线球：进门 → 篮子 → 解开 → 橱窗 → 人类取走 ---------- */
function arrive(){if(S.arrive||S.inbox.length>=6)return false;S.arrive={ci:Math.floor(Math.random()*5),note:rnd(NOTES),kind:rnd(Object.keys(KNIT)),x:P.slot.x,y:P.slot.y,t0:now,spin:0};
  S.door.ring=1.2;S.door.flap=.9;const g=byName('金哥');if(g.atHome&&borrow(g,'maneki',2.6))emote(g,'note',2.6);return true}
function tickArrive(){const a=S.arrive;if(!a)return;const k=now-a.t0,D=P.drop,B=P.basketIn;
  if(k<.3){a.y=P.slot.y+k/.3*3}                                                  // 从投递口探出来
  else if(k<.7){const u=(k-.3)/.4;a.y=P.slot.y+3+(D.y-P.slot.y-3)*u*u}          // 掉到门垫上
  else if(k<.95){const u=(k-.7)/.25;a.y=D.y-Math.sin(u*Math.PI)*4}              // 弹一下
  else if(k<2){const u=(k-.95)/1.05;a.x=D.x+(B.x-8-D.x)*u;a.y=D.y+2;a.spin=Math.floor(a.x/3)}   // 滚到篮子边
  else if(k<2.35){const u=(k-2)/.35;a.x=B.x-8+8*u;a.y=D.y+2-Math.sin(u*Math.PI)*9-u*6}          // 蹦进篮子
  else{S.inbox.push({ci:a.ci,note:a.note,kind:a.kind});S.arrive=null}}
function takeYarn(c){if(!S.inbox.length)return false;c.hold=S.inbox.pop();c.hold.knit=false;return true}
const kindName=y=>KNIT_NAMES[y.kind][0],kindOne=y=>'一'+KNIT_NAMES[y.kind][1]+KNIT_NAMES[y.kind][0];
// 解开：扑过去（在高处就不扑）→ 随机一种玩法 → 冒一团烟，织成小物件 → 开心一下
function solveSteps(c,pounce=true){return[...(pounce?[{k:'pounce',dur:DUR.pounce}]:[]),{k:rnd(PLAYS),dur:3.2,yarn:true},
  {fn:c=>{c.yarn=null;if(c.hold)c.hold.knit=true;S.puffs.push({x:c.x,y:c.y-10,t0:now});if(c.me&&c.hold)say(`解开了，织成了${kindOne(c.hold)}。叼去橱窗挂上吧`)}},{k:'happy',dur:1.1,soft:1}]}
// 交付：走到空着的夹子底下 → 跳上窗台挂好 → 跳下来
function freeSlot(){const busy=new Set(S.cats.map(c=>c.slot).filter(x=>x!=null));let i=S.line.findIndex((x,i)=>!x&&!busy.has(i));
  if(i<0){i=S.line.findIndex((x,i)=>x&&!busy.has(i));if(i<0)i=0;if(S.line[i])pickup(i)}return i}
function slotPt(i){return lineSlot(P.line.x,P.line.y,P.line.w,i)}
function deliverSteps(c){let i=0;return[{fn:c=>{i=c.slot=freeSlot()}},{go:()=>({x:slotPt(i).x,y:P.hang.y})},{jump:()=>({x:slotPt(i).x,y:P.sill.y,z:P.sill.y})},
  {fn:c=>hang(c,i)},{k:'happy',dur:.7},{jump:()=>({x:slotPt(i).x,y:P.hang.y})}]}
function hang(c,i){if(!c.hold)return;if(S.line[i])pickup(i);S.line[i]={kind:c.hold.kind,ci:c.hold.ci,note:c.hold.note,until:now+rr(14,24),by:c};c.hold=null;c.slot=null;S.count++;
  if(S.bird&&!S.bird.fly)S.bird.fly=now;
  if(c.me)say('挂进橱窗了，等人类来取');if(c.from&&c.from.me)say(`${c.name}把你传的毛线球织成了${kindOne(S.line[i])}，挂进了橱窗`);c.from=null;
  if(S.count%10===0){S.goal=3.5;say(`今天第 ${S.count} 件！全店的猫一起开心一下`);S.cats.forEach(o=>{if(o!==c)borrow(o,'happy',1.6)})}}
function pickup(i){const it=S.line[i];if(!it)return;const p=slotPt(i);S.line[i]=null;S.hearts.push({x:p.x,y:p.y+6,t0:now});if(it.by&&it.by.me&&play)say(`人类取走了${kindName(it)}，窗外飘起一颗心`)}

/* ---------- 传球：自己解不了，就传给别的猫 ---------- */
function throwTo(from,to,y,then){S.flying.push({x0:from.x,y0:from.y-9,x1:to.x,y1:to.y-9,t0:now,dur:.55,ci:y.ci,done:then})}
function passTo(c,o){const y=c.hold;c.hold=null;run(c,[{k:'happy',dur:.6,soft:1}]);say(`传给${o.name}`);run(o,[{k:'alert',dur:.7}]);throwTo(c,o,y,()=>receive(o,y,c))}
const REPLY={1:['heart','宪宪接住了，慢慢眨了一下眼'],3:['q','烁烁歪着头看了看便签'],4:['note','小狸花一把抱住'],5:['bang','斑斑兴奋地扑了上来'],6:['q','金哥醒了，慢吞吞地接住'],0:['note','接住了']};
function receive(o,y,from){
  if(o.b===2&&Math.random()<.3){emote(o,'anger',1.6);run(o,[{k:'sit',dur:1,ex:'angry'},{k:o.atHome?o.pool[0]:'sit',dur:0}]);say('砚砚看了一眼，把球拍了回来');throwTo(o,from,y,()=>{from.hold=y;if(from.me)say('球又回到你手里了')});return}
  const [e,msg]=REPLY[o.b]||['note',`${o.name}接住了`];emote(o,e,1.8);if(from.me)say(o.b===2?'砚砚没说话，但接住了':msg);
  o.hold=y;o.from=from;const h=o.home&&o.atHome?HOME[o.home]:null;
  run(o,[{k:'alert',dur:.8},{k:'hold',dur:.6},...solveSteps(o,!h),...(h?[{jump:{...h.floor}},{fn:o=>o.atHome=false}]:[]),...deliverSteps(o),...(h?goHome(o):[])])}

/* ---------- 地方：上去、钻进去、趴下 ---------- */
function goHome(c){const h=HOME[c.home];return[{go:h.floor},...(h.via?[{jump:h.via}]:[]),{jump:h},{fn:c=>{c.atHome=true;c.face=h.face;setK(c,c.pool[0])}}]}
function leaveHome(c){const h=HOME[c.home];c.atHome=false;return[{jump:{...h.floor}}]}
// 玩家在某个地方待着（沙发、爬架、纸箱、扫地机器人、阳光）；按方向键离开
function settle(c,place,k,ex){c.place=place;setK(c,k,ex)}
function leavePlace(c){const p=c.place;c.place=null;const woke=c.k==='sleep';
  if(p==='box'){c.hidden=false;S.box=null;c.x=P.boxFront.x;c.y=P.boxFront.y;c.z=undefined;setK(c,'sit');return}
  if(p==='vac'){hopOff(c);return}
  const s=SEATS[p];if(s&&s.floor)run(c,[{jump:{...s.floor}},{fn:c=>{c.z=undefined}},...(woke?[{k:'stretch',dur:DUR.stretch}]:[])]);   // 睡醒先伸完懒腰再走
  else if(woke)run(c,[{k:'stretch',dur:DUR.stretch}]);else setK(c,'sit')}
function seat(c,name,k,ex){const s=SEATS[name];run(c,[{go:s.floor||s},...(s.floor?[{jump:s}]:[]),{fn:c=>{c.face=s.face;if(c.me)settle(c,name,k,ex);else setK(c,k,ex)}}])}
function hide(c,sec){if(S.box)return;run(c,[{go:P.boxFront},{fn:c=>{if(S.box){c.q=[];return}S.box={state:1,bi:c.b};c.hidden=true;if(c.me)c.place='box'}},...(c.me?[]:[{k:'sit',dur:sec},{fn:c=>{c.hidden=false;S.box=null;setK(c,'sit')}}])])}
function eat(c){if(S.eater)return;run(c,[{go:P.eat},{fn:c=>{if(S.eater){c.q=[];return}if(!S.feed.food){c.q=[{k:'maneki',dur:1.2,mirror:true,fn:()=>dispense()},{k:'sit',dur:1.2}];return}S.eater=c}},
  {go:P.eatIn,direct:1,lock:1,z:169.5,sp:18},{k:'lie',dur:3,ex:'lookDown',face:'R'},{fn:c=>{S.feed.food=0;nextFeed=rr(25,40)}},{go:P.eat,direct:1,lock:1,z:169.5,sp:18},{fn:c=>{S.eater=null;c.z=undefined}},{k:'lick',dur:DUR.lick,soft:1}])}
function dispense(){if(S.feed.food)return;S.feed.drop=1.3;S.feed.level=S.feed.level>1?S.feed.level-1:3;after(1.3,()=>S.feed.food=1)}
function watchFish(c,sec=6){run(c,[{go:P.tankView},{k:'sit',dur:sec*.5,ex:'lookL',soft:1},{k:'maneki',dur:1.1,mirror:true,soft:1,fn:()=>{S.fishPaw=1.4}},{k:'sit',dur:sec*.4,ex:'lookL',soft:1}])}
function birdWatch(c){if(!S.bird||S.bird.fly)return;run(c,[{go:{x:P.line.x+P.line.w*.5+rr(-14,14),y:P.hang.y+6}},{k:'sit',dur:2,ex:'lookUp'},{k:'meow',dur:2.2},{k:'sit',dur:2,ex:'lookUp'}])}
function sniff(c){run(c,[{go:P.sniff},{k:'sit',dur:1.2,ex:'curious',soft:1,fn:()=>{S.catnipUsed=4}},{k:'sit',dur:1.6,ex:'dizzy',soft:1},{k:'lie',dur:2.4,ex:'love',soft:1},{k:'sit',dur:.8,ex:'content',soft:1}])}
const sunny=()=>S.tod!=='night'&&S.weather==='sun';

/* ---------- 扫地机器人：店里唯一的"员工"，猫可以跳上去兜风 ---------- */
const V=S.vac={x:P.vacHome.x,y:P.vacHome.y,dir:-1,mode:'dock',timer:rr(4,8),a:0,moving:0,charging:1,led:'#7ee08a',path:null,rider:null,pause:0};
function vacGo(mode){if(mode==='clean'){V.mode='clean';V.timer=rr(28,42);V.a=Math.PI/2+rr(-.6,.6);V.charging=0}
  else{V.mode='home';V.path=findPath(V.x,V.y,P.vacHome.x,P.vacHome.y,'vac')||[{x:P.vacHome.x,y:P.vacHome.y}]}}
function tickVac(dt){V.moving=0;
  if(V.mode==='dock'){V.charging=1;V.led='#7ee08a';if((V.timer-=dt)<=0)vacGo('clean')}
  else if(V.mode==='clean'){V.led='#8fd8ff';if(V.pause>0)V.pause-=dt;else{const sp=14,nx=V.x+Math.cos(V.a)*sp*dt,ny=V.y+Math.sin(V.a)*sp*dt;
      const hit=S.cats.some(c=>c!==V.rider&&!c.hidden&&c.z==null&&!c.riding&&Math.hypot(c.x-nx,c.y-ny)<11&&Math.hypot(c.x-V.x,c.y-V.y)>=Math.hypot(c.x-nx,c.y-ny));
      if(FREE.vac(nx,ny)&&!hit){V.x=nx;V.y=ny;V.moving=1}else{V.a+=Math.PI*rr(.55,1.3);V.pause=rr(.2,.6)}}
    V.dir=Math.cos(V.a)>=0?1:-1;if((V.timer-=dt)<=0)vacGo('home')}
  else{V.led='#ffd84a';const p=V.path[0];if(!p){V.mode='dock';V.timer=rr(14,24);V.dir=-1;if(V.rider)hopOff(V.rider)}
    else{const dx=p.x-V.x,dy=p.y-V.y,d=Math.hypot(dx,dy),st=Math.min(d,16*dt);if(d>.01){V.x+=dx/d*st;V.y+=dy/d*st;V.moving=1;if(Math.abs(dx)>.3)V.dir=dx>0?1:-1}if(d-st<.3)V.path.shift()}}
  const r=V.rider;if(r){r.x=V.x;r.y=V.y-4;r.z=V.y+.5;r.dy=0}}
function ride(c,sec){run(c,[{chase:()=>({x:V.x+(c.x<V.x?-10:10),y:V.y+2}),near:13},{when:()=>true,fn:c=>{if(V.rider||V.mode==='dock'&&!c.me){c.q=[];return}}},
  {jump:()=>({x:V.x,y:V.y-4,z:V.y+.5})},{fn:c=>{if(V.rider){c.q=[];return}V.rider=c;c.riding=true;setK(c,'sit',c.me?'happy':'content');if(c.me)c.place='vac'}},
  ...(c.me?[]:[{k:'sit',dur:sec,ex:'content'},{fn:c=>hopOff(c)}])])}
function hopOff(c){if(V.rider===c)V.rider=null;c.riding=false;c.place=null;let p=null;for(const dx of [14,-14,0])for(const dy of [6,-6,10]){if(!p&&free(V.x+dx,V.y+dy))p={x:V.x+dx,y:V.y+dy}}
  p=p||randFree();run(c,[{jump:p},{fn:c=>{c.z=undefined}}])}

/* ---------- AI：队列空了想下一件事 ---------- */
const working=()=>S.cats.filter(c=>c.working).length;
function doWork(c){c.working=true;run(c,[{go:P.take},{fn:c=>{if(!takeYarn(c)){c.working=false;c.q=[];return}}},{k:'hold',dur:.6},{go:()=>{const r=P.rug;return{x:r.x+rr(-30,30),y:r.y+rr(-6,8)}}},
  ...solveSteps(c),...deliverSteps(c),{fn:c=>c.working=false}])}
function think(c){
  if(c.role==='home'){if(!c.atHome){run(c,goHome(c));return}c.wait=rr(7,13);   // 夜里更爱睡
    setK(c,pickW(Object.fromEntries(c.pool.map(k=>[k,(PERSONA[c.b].idle[k]??1)*(k==='sleep'&&S.tod==='night'?4:1)]))));return}
  const need=S.inbox.length>=(c.role==='auto'?1:2)&&working()<(c.role==='auto'?2:1);
  const k=pickW({walk:4,idle:3,...c.likes,work:need?c.likes.work||0:0,sun:sunny()?c.likes.sun||0:0,window:S.bird&&!S.bird.fly?(c.likes.window||0)*3:0,
    vac:V.mode==='clean'&&!V.rider?c.likes.vac||0:0,box:S.box?0:c.likes.box||0,eat:c.likes.eat||0});
  c.wait=rr(1,3);
  if(k==='walk'){const p=randFree();run(c,[{go:p},{k:'sit',dur:rr(1,2.5)}])}
  else if(k==='idle'){const al=Object.keys(PERSONA[c.b].idle).filter(x=>x!=='walk'&&x!=='sleep'),pk=pickIdle(c.b,al.length?al:['lick','meow','lie']);run(c,[{k:pk,dur:pk==='pounce'?DUR.pounce:pk==='lick'?DUR.lick:rr(3,5)},{k:'sit',dur:.1}])}
  else if(k==='work')doWork(c);else if(k==='fish')watchFish(c);else if(k==='window')birdWatch(c);else if(k==='sun')seatSun(c);
  else if(k==='vac')ride(c,rr(8,14));else if(k==='box')hide(c,rr(6,10));else if(k==='catnip')sniff(c);else if(k==='eat')eat(c)}
function seatSun(c){run(c,[{go:{x:P.sun.x+rr(-16,16),y:P.sun.y+rr(-8,8)}},{k:'lie',dur:rr(6,10),ex:'content'},{k:'stretch',dur:DUR.stretch}])}

/* ---------- 玩家 ---------- */
const keys={};let path=null;
const SPOTS=[
  {at:P.take,hit:[122,36,40,34],label:'叼一颗毛线球',ok:()=>!me.hold&&S.inbox.length>0,no:()=>me.hold?'嘴里已经叼着一个了':'篮子空了，等门外塞进来',go(){takeYarn(me);run(me,[{k:'hold',dur:.8,soft:1}]);say(`叼起一颗毛线球。便签上写着：「${me.hold.note}」`)}},
  {at:P.hang,hit:[158,4,84,60],label:'挂进橱窗',ok:()=>me.hold&&me.hold.knit,no:()=>me.hold?'先把毛线球解开，织好了再挂':'手里没有织好的东西',go(){run(me,deliverSteps(me))}},
  {at:P.knock,hit:[92,6,32,50],label:'扒拉一下投递口',ok:()=>!me.hold,go(){run(me,[{k:'maneki',dur:1,soft:1}]);after(.6,()=>{if(!arrive())say(S.arrive?'门外正往里塞呢':'篮子满了，先解几颗吧');else say('门外好像有人……叮铃')})}},
  {at:P.sofaFloor,hit:[232,136,66,36],label:'跳上沙发睡一觉',ok:()=>!me.hold,go(){seat(me,'sofa','sleep')}},
  {at:P.treeFloor,hit:[280,44,38,76],label:'跳上猫爬架',ok:()=>!me.hold,go(){seat(me,'tree','lie')}},
  {at:P.boxFront,hit:[46,150,30,22],label:'钻进纸箱',ok:()=>!S.box&&!me.hold,no:()=>S.box?'纸箱里已经有猫了':'叼着东西钻不进去',go(){hide(me)}},
  {at:P.eat,hit:[2,138,46,38],label:()=>S.feed.food?'吃饭':'按一下喂食器',ok:()=>!me.hold&&!S.eater,no:()=>S.eater?S.eater.name+'正在吃':'先把嘴里的东西放下',go(){eat(me)}},
  {at:P.tankView,hit:[2,90,34,36],label:'看鱼',ok:()=>!me.hold,go(){watchFish(me,5)}},
  {at:P.sun,hit:[168,52,64,48],label:'晒太阳',ok:()=>sunny()&&!me.hold,no:()=>sunny()?'叼着东西晒不了':'现在没有太阳',go(){run(me,[{go:P.sun},{fn:c=>settle(c,'sun','lie','content')}])}},
  {at:P.board,hit:[244,6,48,34],label:'看看黑板',go(){say(`今天已经交付 ${S.count} 件，篮子里还有 ${S.inbox.length} 颗`)}},
  {at:P.sniff,hit:[88,160,22,12],label:'闻闻猫薄荷',ok:()=>!me.hold,go(){sniff(me)}},
  {at:{x:88,y:62},hit:[78,30,20,28],label:'蹭蹭盆栽',go(){S.plantShake=1;run(me,[{k:'lick',dur:1,soft:1}])}},
];
const lab=s=>typeof s.label==='function'?s.label():s.label;
const nearCatOf=c=>S.cats.filter(o=>o!==c&&!o.hidden&&!o.riding&&idle(o)&&!o.hold&&Math.hypot(o.x-c.x,o.y-c.y)<26).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];
function nearest(){let best=null,bd=16;SPOTS.forEach(s=>{if(s.ok&&!s.ok())return;const d=Math.hypot(s.at.x-me.x,s.at.y-me.y);if(d<bd){bd=d;best=s}});
  if(!best&&!me.hold&&V.mode!=='dock'&&!V.rider&&Math.hypot(V.x-me.x,V.y-me.y)<18)best={label:'跳上扫地机器人',go(){ride(me)}};return best}
// 忙 = 眼下（或紧接着）是一个不能打断的动作；排在后面的回调不算
const busy=()=>{const s=me.cur||me.q[0];return !!s&&(s.lock||!s.go&&!s.chase&&!s.soft)};let pendingTap=null;
function act(){if(busy()||me.place||me.hidden)return;
  if(me.hold&&!me.hold.knit){const o=nearCatOf(me);if(o)return passTo(me,o)}
  const s=nearest();if(s)return s.go();
  if(me.hold&&!me.hold.knit)run(me,solveSteps(me));
  else if(me.hold)say('叼着织好的东西，去橱窗挂上吧')}
function petOrPass(o){if(me.hold&&!me.hold.knit)passTo(me,o);else if(o.b===2&&o.k==='lick'){emote(o,'anger',1.6);say('砚砚在舔爪，别打扰它')}
  else if(Math.random()<Math.max(.35,PERSONA[o.b].slowBlink)&&borrow(o,'slowBlink',DUR.slowBlink))emote(o,'heart',DUR.slowBlink);else emote(o,'note',1.2)}
function tap(mx,my){if(!play)return;if(busy()&&!me.place){pendingTap=[mx,my];return}pendingTap=null;const leaving=!!me.place;if(leaving)leavePlace(me);if(me.hidden)return;const go=steps=>run(me,steps,leaving);
  const o=S.cats.find(o=>o!==me&&!o.hidden&&mx>o.x-10&&mx<o.x+10&&my>o.y-22+(o.dy||0)&&my<o.y+2);
  if(o){go([{chase:()=>({x:o.x+(me.x<o.x?-16:16),y:o.z!=null?Math.max(o.y,P.hang.y):o.y+2}),near:22},{fn:()=>{if(idle(o)&&!o.hold)petOrPass(o)}}]);return}
  if(V.mode!=='dock'&&!V.rider&&Math.hypot(mx-V.x,my-(V.y-3))<10&&!me.hold&&!leaving){ride(me);return}
  const s=SPOTS.find(s=>{const [x,y,w,h]=s.hit;return mx>=x&&mx<x+w&&my>=y&&my<y+h});
  if(s){go([{go:s.at},{fn:()=>{if(!s.ok||s.ok())s.go();else if(s.no)say(s.no())}}]);return}
  go([{go:{x:mx,y:Math.max(my,60)}}])}
if(play){const host=canvas.parentElement;
  host.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key,m={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',s:'d',a:'l',d:'r'}[k];
    if(m){keys[m]=true;e.preventDefault()}if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)act()}poke()});
  host.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key,m={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',s:'d',a:'l',d:'r'}[k];if(m)keys[m]=false});
  host.addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
  canvas.addEventListener('pointerdown',e=>{host.focus();poke();const r=canvas.getBoundingClientRect();tap((e.clientX-r.left)*M.w/r.width,(e.clientY-r.top)*M.h/r.height)})}
// 挂机：12 秒后自己舔舔爪或喵一声，35 秒后就地睡着（方向键醒来，先伸懒腰）
let afkT=0,afkDid=false;const poke=()=>{afkT=0;afkDid=false};
function afk(dt,moving){if(moving){poke();return}if(me.place||me.hidden||!idle(me))return;afkT+=dt;
  if(afkT>12&&!afkDid&&!me.hold){afkDid=true;const k=rnd(['lick','meow']);run(me,[{k,dur:k==='lick'?DUR.lick:1.6,soft:1}])}
  if(afkT>35&&!me.hold){settle(me,'nap','sleep');poke()}}
function keyMove(dt){const dx=(keys.r?1:0)-(keys.l?1:0),dy=(keys.d?1:0)-(keys.u?1:0);if(!dx&&!dy)return false;
  if(busy())return true;if(me.place){leavePlace(me);return true}if(me.hidden)return true;if(me.q.length||me.cur)run(me,[]);
  const l=Math.hypot(dx,dy),nx=me.x+dx/l*me.sp*dt,ny=me.y+dy/l*me.sp*dt;if(free(nx,me.y))me.x=nx;if(free(me.x,ny))me.y=ny;if(dx)me.face=dx>0?'R':'L';
  const wk=me.face==='L'?'walkL':'walkR';if(me.k!==wk)setK(me,wk);return true}

/* ---------- 每帧 ---------- */
function tick(t,dt,draw=true){now=t;S.now=t;
  timers.forEach(q=>q.s-=dt);const due=timers.filter(q=>q.s<=0);timers=timers.filter(q=>q.s>0);due.forEach(q=>q.f());
  if((nextArrive-=dt)<=0){arrive();nextArrive=S.inbox.length<2?rr(5,9):rr(12,20)}tickArrive();
  S.line.forEach((it,i)=>{if(it&&now>=it.until)pickup(i)});
  S.hearts=S.hearts.filter(h=>(h.k=(now-h.t0)/1.8)<1);S.puffs=S.puffs.filter(p=>(p.k=(now-p.t0)/.6)<1);
  S.flying=S.flying.filter(f=>{const k=Math.min(1,(now-f.t0)/f.dur);f.x=f.x0+(f.x1-f.x0)*k;f.y=f.y0+(f.y1-f.y0)*k-Math.sin(k*Math.PI)*18;if(k<1)return true;f.done&&f.done();return false});
  ['ring','flap'].forEach(k=>S.door[k]=Math.max(0,S.door[k]-dt));['goal','fishPaw','catnipUsed','plantShake','brew'].forEach(k=>S[k]=Math.max(0,(S[k]||0)-dt));
  S.feed.drop=Math.max(0,S.feed.drop-dt);if(!S.feed.food&&(nextFeed-=dt)<=0)dispense();
  if((nextBird-=dt)<=0&&!S.bird){S.bird={x:P.line.x+rr(8,P.line.w-8),dir:Math.random()<.5?1:-1,until:now+rr(12,20)};nextBird=rr(40,80)}
  if(S.bird){const b=S.bird;if(!b.fly&&now>b.until)b.fly=now;if(b.fly&&now-b.fly>1.2)S.bird=null}
  tickVac(dt);
  const moving=play&&keyMove(dt);
  S.cats.forEach(c=>{if(c===me&&moving&&!busy())return;stepCat(c,dt);if(c.riding)return;
    if(idle(c)&&c!==me&&(c.wait-=dt)<=0)think(c);
    if(c===me&&idle(c)){if(!play&&(c.wait-=dt)<=0)think(c);else if(play&&!me.place&&!me.hidden&&!moving&&c.k!==restPose(c))setK(c,restPose(c))}});   // 玩家做完动作就坐好
  if(play)afk(dt,moving);
  if(pendingTap&&!busy())tap(...pendingTap);
  S.cats.forEach(c=>{c.carry=c.hold&&(c.hold.knit||c.k.startsWith('walk'))&&!PLAYS.includes(c.k)?{ci:c.hold.ci,kind:c.hold.knit?c.hold.kind:null}:null});
  // 玩家走近：别的猫可能慢眨眼（猫的"我喜欢你"）；砚砚舔爪时被打扰会不爽
  if(play&&!me.hidden)S.cats.forEach(c=>{if(c===me||c.hidden)return;const d=Math.hypot(c.x-me.x,c.y-me.y);if(d>44){c.greeted=false;return}if(d>24||c.greeted||!idle(c))return;c.greeted=true;
    if(c.b===2&&c.k==='lick'){emote(c,'anger',1.6);return}if(['sit','lie','meow','lick'].includes(c.k)&&Math.random()<PERSONA[c.b].slowBlink&&borrow(c,'slowBlink',DUR.slowBlink))emote(c,'heart',DUR.slowBlink)});
  if(play&&ui.prompt){let tip='';if(me.place)tip='方向键 · 离开';else if(!busy()&&!me.hidden){const o=me.hold&&!me.hold.knit&&nearCatOf(me),s=!o&&nearest();
      tip=o?'空格 · 传给'+o.name:s?'空格 · '+lab(s):me.hold?(me.hold.knit?'去橱窗挂上':'空格 · 就地解开，或走到别的猫旁边传给它'):''}ui.prompt(tip)}
  if(draw){use(ctx);ctx.clearRect(0,0,M.w,M.h);M.draw(t,S)}}

const cmd={arrive:()=>arrive(),vac:()=>V.mode==='dock'?vacGo('clean'):V.mode==='clean'?vacGo('home'):0,feed:()=>{S.feed.food=0;dispense()},
  bird:()=>{if(!S.bird)nextBird=0},face:()=>{const f=Object.keys(FACE_NAMES),i=f.indexOf(me.myFace||'normal');me.myFace=me.ex=f[(i+1)%f.length];return FACE_NAMES[me.myFace]}};
return{S,me,tick,cmd,findPath,free}}
