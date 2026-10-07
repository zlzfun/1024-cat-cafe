/* 1024 猫咖 · 场景 v3 的交互和 AI。依赖 world-play.js：makeWorld 会调用 WORLD_MODS 里的函数，传入接口 A。
   这里注册店里每一个能互动的东西（T({...})）、它们的状态和每帧更新，以及店猫（NPC）和在线玩家（原型里是机器人）怎么决定下一件事。
   东西的写法：{id, n 名字, hit 点它的范围, at 走到哪里, near 站在哪里按 E 有效, label, ok(c) 现在能不能用, no(c) 不能用时说什么, go(c) 用它, ai:{mood, w} 机器人多爱用}。
   机器人的心情：work 做委托 / play 玩 / rest 找地方窝着 / social 找猫玩 / afk 挂机 / explore 到处逛。有大事（大毛线团、零食机、拍照、CI 红了）时，附近的猫会被叫过去。 */
WORLD_MODS.push(A=>{
const {S,P,M,me,rnd,rr,pickW,dist,run,setK,idle,emote,speak,borrow,stay,settle,unclaim,after,say,sfx,news,T,TH,findPath,free,randFree,randIn,roomAt,inR}=A;
const now=()=>A.t,near=(c,p,d)=>Math.hypot(c.x-p.x,c.y-p.y)<d,isBot=c=>c.kind==='bot',val=(v,...a)=>typeof v==='function'?v(...a):v,TID=id=>TH.find(t=>t.id===id);
const fx=S.fx=[];   // 小粒子：音符、落叶、纸屑、彩带
const tick=f=>A.tickers.push(f),atMe=(p,d=200)=>A.play&&near(me,p,d);
function useThing(c,th){run(c,[{go:val(th.at,c)},{fn:c=>{if(!th.ok||th.ok(c))th.go(c);else emote(c,'q',1)}}])}
function pickBy(list,wf){const w=list.map(wf),s=w.reduce((a,b)=>a+b,0);if(s<=0)return null;let r=Math.random()*s;for(let i=0;i<list.length;i++)if((r-=w[i])<=0)return list[i];return list[0]}
const faceTo=(c,p)=>{c.face=p.x>=c.x?'R':'L'};
// 扑向会动的东西时，落点要落在能站的地方
const land=(x,y)=>{if(free(x,y))return{x,y};for(let r=3;r<48;r+=3)for(let a=0;a<12;a++){const q=a*Math.PI/6,px=x+Math.cos(q)*r,py=y+Math.sin(q)*r;if(free(px,py))return{x:px,y:py}}return{x,y}};

/* ================= 毛线球：投递口 → 分球机 → 三个毛线篮 → 解开 → 橱窗 → 人类取走 ================= */
const NOTES=['CI 又红了，帮我看看','这个 bug 只在周五下午出现','文档里的示例跑不起来','想要一个一键部署的按钮','帮我给这个函数起个名字','接口偶尔超时，就一点点',
  '新人入门指南在哪里','能帮我补几个单元测试吗','这段代码是谁写的（好像是我）','想把老项目迁到新框架','日志太多，找不到重点','帮我 review 一下这个 PR',
  '需求：做一只会写代码的猫','周报还差最后一段','测试环境又连不上了','能不能把按钮再往左挪一点','内网的镜像源又慢了','想给团队做个值班机器人',
  '这个依赖升级之后全红了','帮我看看这条 SQL 为什么这么慢','想要一份 1024 的活动海报','README 能不能写得像人话'];
const kindName=y=>KNIT_NAMES[y.kind][0],kindOne=y=>'一'+KNIT_NAMES[y.kind][1]+KNIT_NAMES[y.kind][0];
Object.assign(S,{sorter:{balls:[],pop:0,suck:null},baskets:[[],[],[]],lines:[Array(7).fill(null),Array(7).fill(null)],door:{ring:0,flap:0},birds:[null,null],xl:0,goal:0,party:0});
const rolling=[];let nextArrive=.3,nextPop=0;const nextWinBird=[rr(8,20),rr(25,50)];
const pendingN=()=>S.sorter.balls.length+S.baskets.reduce((s,b)=>s+b.length,0)+rolling.length+(S.sorter.suck?1:0)+S.flying.filter(f=>f.toBasket).length;
function arrive(){if(pendingN()>=22)return false;rolling.push({ci:Math.floor(Math.random()*5),note:rnd(NOTES),kind:rnd(Object.keys(KNIT)),t0:now(),x:P.slot.x,y:P.slot.y,spin:0});
  S.door.ring=1.2;S.door.flap=.9;if(atMe(P.slot,140))sfx('bell');const g=A.byName('金哥');if(g&&g.atHome&&borrow(g,'maneki',2.6))emote(g,'note',2.6);return true}
// 别处捞上来的毛线球（小船、钓鱼）：放进最空的那个毛线篮，变成新的委托；篮子都满了就不放
A.addBall=ci=>{const i=[0,1,2].sort((a,b)=>S.baskets[a].length-S.baskets[b].length)[0];if(S.baskets[i].length>=6)return false;S.baskets[i].push({ci:ci??Math.floor(Math.random()*5),note:rnd(NOTES),kind:rnd(Object.keys(KNIT)),t0:now()});return true};
const workers=()=>S.cats.filter(c=>c.working||(c.hold&&!c.hold.knit)).length;
tick(dt=>{
  if((nextArrive-=dt)<=0){const want=Math.min(20,5+workers()*1.2),n=pendingN();if(n<want)arrive();nextArrive=n<want?rr(.6,1.6):rr(5,9)}
  for(let i=rolling.length-1;i>=0;i--){const a=rolling[i],k=now()-a.t0,D=P.drop,B=P.suckIn;
    if(k<.3)a.y=P.slot.y+k/.3*3;else if(k<.7){const u=(k-.3)/.4;a.y=P.slot.y+3+(D.y-P.slot.y-3)*u*u}else if(k<.95){const u=(k-.7)/.25;a.y=D.y-Math.sin(u*Math.PI)*4}
    else if(k<1.6){const u=(k-.95)/.65;a.x=D.x+(B.x-D.x)*u;a.y=B.y;a.spin=Math.floor(a.x/3)}else if(!S.sorter.suck){S.sorter.suck={ci:a.ci,k:0,ball:a};rolling.splice(i,1)}}
  const s=S.sorter;if(s.suck){s.suck.k+=dt/.8;if(s.suck.k>=1){s.balls.push(s.suck.ball);s.suck=null}}s.pop=Math.max(0,s.pop-dt);
  if(s.balls.length&&(nextPop-=dt)<=0){nextPop=.5;const room=S.baskets.map((b,i)=>[b.length+S.flying.filter(f=>f.toBasket===i+1).length,i]).filter(([n])=>n<6).sort((a,b)=>a[0]-b[0]||Math.random()-.5);
    if(room.length){const i=room[0][1],b=P.baskets[i],ball=s.balls.shift();s.pop=.35;if(atMe(P.chute,160))sfx('pop');
      S.flying.push({x0:P.chute.x,y0:P.chute.y,x1:b.x+20,y1:b.y+8,t0:now(),dur:.5+Math.abs(b.x-P.chute.x)/400,arc:26,ci:ball.ci,toBasket:i+1,done:()=>S.baskets[i].push(ball)})}}
  S.pending=pendingN();['ring','flap'].forEach(k=>S.door[k]=Math.max(0,S.door[k]-dt));
  ['goal','party','xl','brew','plantShake','fishPaw','catnipUsed','scratch','grassChew','spawnPop','print','flash','banner'].forEach(k=>S[k]=Math.max(0,(S[k]||0)-dt));
  S.lines.forEach((L,w)=>L.forEach((it,i)=>{if(it&&now()>=it.until)pickup(w,i)}));
  S.birds.forEach((b,w)=>{if(!b&&(nextWinBird[w]-=dt)<=0){S.birds[w]={x:P.lines[w].x+rr(8,P.lines[w].w-8),dir:Math.random()<.5?1:-1,until:now()+rr(12,22)};nextWinBird[w]=rr(40,80)}
    if(b){if(!b.fly&&now()>b.until)b.fly=now();if(b.fly&&now()-b.fly>1.2)S.birds[w]=null}})});
A.drawers.push((L,vis)=>rolling.forEach(a=>{if(vis(a.x-4,a.y-4,8,8))L.push([a.y+3,()=>yarnBall(Math.round(a.x),Math.round(a.y),2,a.ci,a.spin)])}));
function takeYarn(c,i){const b=S.baskets[i];if(!b.length)return false;c.hold=b.pop();c.hold.knit=false;c.hold.easy=false;return true}
P.baskets.forEach((b,i)=>T({id:'basket'+i,n:'毛线篮',hit:[b.x-2,b.y-4,44,30],at:()=>({x:b.x+20+rr(-10,10),y:b.y+32+rr(0,4)}),near:[b.x-8,b.y+18,56,24],
  label:'叼一颗毛线球',ok:c=>!c.hold&&S.baskets[i].length>0,no:c=>c.hold?(c.hold.knit?`嘴里叼着织好的${KNIT_NAMES[c.hold.kind][0]}：先挂进一楼的橱窗，才算交付`:'嘴里已经叼着一个了'):'这个篮子空了，看看别的篮子',
  go(c){if(!takeYarn(c,i))return;run(c,[{k:'hold',dur:.8,soft:1}]);if(c.me){if(A.onTake)A.onTake(c);else say(`叼起一颗毛线球。便签上写着：「${c.hold.note}」`)}}}));
// 解开：扑过去 → 随机一种玩法 → 冒一团烟织成小物件（跟小黄鸭讲过一遍的，解得快）
function solveSteps(c,pounce=true){const easy=c.hold&&c.hold.easy;return[...(pounce&&!easy?[{k:'pounce',dur:DUR.pounce}]:[]),{k:rnd(PLAYS),dur:easy?1.2:3.2,yarn:true},
  {fn:c=>{c.yarn=null;if(!c.hold)return;c.hold.knit=true;S.puffs.push({x:c.x,y:c.y-10,t0:now()});if(c.me){sfx('knit');say(`解开了，织成了${kindOne(c.hold)}。叼去橱窗长廊挂上吧`)}}},{k:'happy',dur:1.1,soft:1}]}
A.solveHere=c=>{c.doing='在解毛线球';run(c,solveSteps(c))};
// 交付：走到离自己最近的空夹子底下 → 跳上窗台挂好 → 跳下来
const SLOTS=[];P.lines.forEach((L,w)=>{for(let i=0;i<7;i++)SLOTS.push({w,i,...lineSlot(L.x,L.y,L.w,i,7)})});
function freeSlot(c){const busy=new Set(S.cats.map(o=>o.slot).filter(x=>x!=null));let best=-1,bd=1e9;
  SLOTS.forEach((s,j)=>{if(busy.has(j)||S.lines[s.w][s.i])return;const d=Math.abs(s.x-c.x)+Math.abs(c.y-60)*.5;if(d<bd){bd=d;best=j}});
  if(best<0){SLOTS.forEach((s,j)=>{if(busy.has(j))return;const it=S.lines[s.w][s.i],d=it?it.until:0;if(best<0||d<bd){bd=d;best=j}});if(best<0)best=0;const s=SLOTS[best];pickup(s.w,s.i)}return best}
function deliverSteps(c){let j=0;return[{fn:c=>{j=c.slot=freeSlot(c);c.doing='去橱窗交付';c.onLeave=c=>{c.slot=null}}},{go:()=>({x:SLOTS[j].x,y:P.hangY})},{jump:()=>({x:SLOTS[j].x,y:P.sillY,z:P.sillY})},
  {fn:c=>hang(c,j)},{k:'happy',dur:.7},{jump:()=>({x:SLOTS[j].x,y:P.hangY+2})}]}
function hang(c,j){c.onLeave=null;if(!c.hold)return;const s=SLOTS[j];if(S.lines[s.w][s.i])pickup(s.w,s.i);const item=S.lines[s.w][s.i]={kind:c.hold.kind,ci:c.hold.ci,until:now()+rr(12,22),by:c,y:c.hold};c.hold=null;c.slot=null;c.doing=null;if(!A.shared)S.count++;if(A.onHang)A.onHang(c,item);
  const b=S.birds[s.w];if(b&&!b.fly)b.fly=now();c.delivered=(c.delivered||0)+1;
  if(c.me){sfx('hang');say('挂进橱窗了，等人类来取。可以去墙边按个爪印')}if(c.from&&c.from.me)say(`${c.name}把你传的毛线球织成了${kindOne(S.lines[s.w][s.i])}，挂进了橱窗`);c.from=null;
  if(!A.shared)cheer(c)}
// 今天第 10、50、100……件：全店一起高兴。联机时（A.shared）计数跟着服务端走，由 world-online.js 调它
function cheer(c){if(!S.count)return;
  if(S.count%50===0){S.party=5;news(`今天第 ${S.count} 件！整条街都看见了`);if(A.play)say(`今天第 ${S.count} 件！全店庆祝`);S.cats.forEach(o=>{if(o!==c)borrow(o,'happy',1.6)});for(let i=0;i<90;i++)fx.push({kind:'confetti',x:rr(0,M.w),y:rr(-60,0),vy:rr(20,50),vx:rr(-10,10),ci:i%5,t0:now(),life:6})}
  else if(S.count%10===0){S.goal=3.5;news(`今天第 ${S.count} 件`);S.cats.forEach(o=>{if(o!==c&&roomAt(o.x,o.y).id==='gallery')borrow(o,'happy',1.6)})}}
// 联机时别的真人挂的：在离它最近的空夹子上也挂一件（只是画面，不计数）
A.hangShow=(c,it)=>{const j=freeSlot(c),s=SLOTS[j];if(S.lines[s.w][s.i])pickup(s.w,s.i);S.lines[s.w][s.i]={kind:it.kind,ci:it.ci,until:now()+rr(12,22),by:c,y:null};const b=S.birds[s.w];if(b&&!b.fly)b.fly=now()};
A.cheer=c=>cheer(c);
function pickup(w,i){const it=S.lines[w][i];if(!it)return;const s=SLOTS[w*7+i];S.lines[w][i]=null;S.hearts.push({x:s.x,y:s.y+6,t0:now()});if(A.onTaken&&A.onTaken(it))return;if(it.by&&it.by.me)say(`人类取走了${kindName(it)}，窗外飘起一颗心`)}
function watchWindow(c,w){const W=P.wins[w],x=W.x+rr(14,W.w-14);run(c,[{go:{x,y:P.hangY+4}},{fn:c=>{c.face='R';stay(c,{k:'sit',ex:'lookUp',dur:rr(5,10)});if(S.birds[w]&&!S.birds[w].fly)after(1,()=>{if(c.k==='sit'){emote(c,'bang',1.4)}})}}])}
P.wins.forEach((Wn,w)=>T({id:'win'+w,n:'橱窗',hit:[Wn.x-2,Wn.y,Wn.w+4,Wn.h+30],at:c=>c.hold&&c.hold.knit?{x:c.x<Wn.x?Wn.x+10:c.x>Wn.x+Wn.w?Wn.x+Wn.w-10:c.x,y:P.hangY+2}:{x:Wn.x+Wn.w/2,y:P.hangY+6},near:[Wn.x-4,56,Wn.w+8,26],
  label:c=>c.hold&&c.hold.knit?'挂进橱窗':S.birds[w]&&!S.birds[w].fly?'看窗外的小鸟':'看看窗外',ok:c=>!(c.hold&&!c.hold.knit),no:()=>'先把毛线球解开，织好了再挂',
  go(c){if(c.hold&&c.hold.knit)run(c,deliverSteps(c));else watchWindow(c,w)},ai:{mood:'rest',w:c=>S.birds[w]&&!S.birds[w].fly?3:.5}}));
T({id:'knock',n:'门 · 投递口',hit:[P.door.x-2,P.door.y,26,42],at:P.knock,near:[P.knock.x-14,58,34,22],label:'扒拉一下投递口',ok:c=>!c.hold,no:()=>'先把嘴里的放下',
  go(c){run(c,[{k:'maneki',dur:1,soft:1}]);after(.6,()=>{if(!arrive()){if(c.me)say('篮子都满了，先解几颗吧')}else if(c.me)say('门外好像有人……叮铃')})}});
T({id:'cork',n:'委托看板',hit:[168,10,60,34],at:{x:198,y:70},label:'看看委托看板',go(){say(`看板上钉着 ${S.pending} 张便签。今天已经交付 ${S.count} 件`)}});
T({id:'board',n:'小黑板',hit:[P.board.x,P.board.y,P.board.w,P.board.h],at:{x:P.board.x+P.board.w/2,y:P.hangY+6},label:'看看小黑板',go(){say(`今天已经交付 ${S.count} 件，篮子里和路上还有 ${S.pending} 颗`)}});
A.overs.push(vis=>{for(const p of fx){if(!vis(p.x-4,p.y-40,8,48))continue;const k=(now()-p.t0)/p.life;
  if(p.kind==='confetti')R(Math.round(p.x),Math.round(p.y),2,1+(Math.floor(now()*8+p.ci)%2),YARN[p.ci][Math.floor(now()*6+p.ci)%2?0:2]);
  else if(p.kind==='note')alpha(Math.max(0,1-k),()=>drawEmote(C,Math.round(p.x+Math.sin(k*9)*2),Math.round(p.y-k*18),'note',0));
  else if(p.kind==='leaf')leaf(Math.round(p.x),Math.round(p.y-(p.h||0)),p.ci,Math.floor(now()*4+p.ci));
  else if(p.kind==='shred')P1(Math.round(p.x),Math.round(p.y-(p.h||0)),'#fff8e8')}});
tick(dt=>{for(let i=fx.length-1;i>=0;i--){const p=fx[i];if(now()-p.t0>p.life){fx.splice(i,1);continue}
  if(p.kind==='confetti'){p.y+=p.vy*dt;p.x+=Math.sin(now()*3+p.ci)*12*dt+p.vx*dt}
  else if(p.vh!=null){p.x+=p.vx*dt;p.y+=(p.vy||0)*dt;p.h+=p.vh*dt;p.vh-=90*dt;if(p.h<=0){p.h=0;p.vh=null;p.vx=0;p.vy=0}}
  else if(p.fall){p.h=Math.max(0,p.h-p.fall*dt);p.x+=Math.sin(now()*2+p.ci)*10*dt;if(!p.h)p.fall=0}}});

/* ================= 传球：自己解不了就传给别的猫（店猫、在线的猫，都行） ================= */
function throwTo(from,to,y,then){const d=dist(from,to);S.flying.push({x0:from.x,y0:from.y-9,x1:to.x,y1:to.y-9,t0:now(),dur:Math.min(1.1,.4+d/320),arc:Math.min(46,14+d/7),ci:y.ci,done:then})}
function giveBack(to,y){if(to.gone||to.hold){S.baskets[Math.floor(Math.random()*3)].push(y);return}to.hold=y}
A.pass=(c,o)=>{const y=c.hold;if(!y||o.gone)return;c.hold=null;run(c,[{k:'happy',dur:.6,soft:1}]);if(c.me)say(`传给${o.name}`);if(o.me)say(`${c.name}把一颗毛线球传给了你`);
  if(!o.me&&!o.hidden&&!o.place&&!o.working)run(o,[{k:'alert',dur:.7}]);sfx('toss');throwTo(c,o,y,()=>receive(o,y,c))};
const REPLY={1:['heart','宪宪接住了，慢慢眨了一下眼'],3:['q','烁烁歪着头看了看便签'],4:['q','小狸花把便签从头看到尾，才接了过去'],5:['bang','斑斑兴奋地扑了上来'],6:['q','金哥醒了，慢吞吞地接住']};
function receive(o,y,from){
  if(o.me){if(o.hold||o.hidden){say('你嘴里已经有东西了，球滚回去了');throwTo(o,from,y,()=>giveBack(from,y));return}o.hold=y;y.knit=false;say('接住了！');return}
  if(o.hold||o.hidden||o.gone||o.riding){throwTo(o,from,y,()=>{giveBack(from,y);if(from.me)say(`${o.name}现在腾不出嘴，球滚回来了`)});return}
  if(o.kind==='npc'){
    // 砚砚有三成会把球拍回来；和你熟了以后就不拍了（world-social.js）
    if(o.pal===2&&Math.random()<.3&&!(from.me&&A.isFriend&&A.isFriend(2))){emote(o,'anger',1.6);run(o,[{k:'sit',dur:1,ex:'angry'},{k:o.atHome?HOMES[2].pool[0]:'sit',dur:0}]);if(from.me)say('砚砚看了一眼，把球拍了回来');throwTo(o,from,y,()=>{giveBack(from,y);if(from.me)say('球又回到你手里了')});return}
    const [e,msg]=REPLY[o.pal]||['note',`${o.name}接住了`];emote(o,e,1.8);if(from.me)say(o.pal===2?'砚砚没说话，但接住了':msg)}
  else if(Math.random()<.15){speak(o,rnd(['在忙，还给你','这个我也不会……','先放你那儿']),2.2);emote(o,'q');throwTo(o,from,y,()=>{giveBack(from,y);if(from.me)say(`${o.name}把球还给了你`)});return}
  else speak(o,rnd(['收到喵','交给我','好嘞','这个我会','包在我身上']),2.2);
  o.hold=y;o.from=from;o.working=true;const h=o.kind==='npc'&&o.atHome?HOMES[o.pal]:null;
  run(o,[{k:'alert',dur:.7},{k:'hold',dur:.5},...solveSteps(o,!h),...(h?[{jump:{...h.floor}},{fn:o=>{o.atHome=false;o.z=undefined}}]:[]),...deliverSteps(o),{fn:o=>{o.working=false}},...(h?goHome(o):[])])}

/* ================= 找猫玩：蹭蹭、跟着走、喵喵合唱、快捷短语 ================= */
function petNpc(c,o){if(c.hold&&!c.hold.knit)return A.pass(c,o);if(o.pal===2&&o.k==='lick'&&!(c.me&&A.isFriend&&A.isFriend(2))){emote(o,'anger',1.6);if(c.me){say('砚砚在舔爪，别打扰它');if(A.love)A.love(o,'',-1)}return}
  if(Math.random()<Math.max(.35,PERSONA[o.pal].slowBlink)&&borrow(o,'slowBlink',DUR.slowBlink)){emote(o,'heart',DUR.slowBlink);if(c.me)say(`${o.name}对你慢慢眨了一下眼（猫的"我喜欢你"）`)}else emote(o,'note',1.2)}
// 蹭蹭：对方闲着才停下来回应（打断走到一半或正在吃饭的猫，它会停在家具边上）
function rub(c,o){faceTo(c,o);run(c,[{k:'sit',dur:1.2,ex:'content',soft:1}]);S.hearts.push({x:Math.round((c.x+o.x)/2),y:Math.round(Math.min(c.y,o.y)-14),t0:now()});
  if(!o.me&&!o.hidden&&!o.place&&!o.working&&!o.riding&&!o.leaving&&idle(o)){faceTo(o,c);run(o,[{k:'sit',dur:1.3,ex:'content'}]);if(isBot(o)&&Math.random()<.4)speak(o,rnd(['蹭蹭','喵～','嘿嘿','你好呀']),1.8)}else emote(o,'heart',1.4);
  if(c.me||o.me)sfx('purr');if(c.me)say(`和${o.name}蹭了蹭`);if(o.me)say(`${c.name}蹭了蹭你`);c.rubs=(c.rubs||0)+1;if(A.onRub)A.onRub(c,o)}
A.social=(c,o,kind='auto')=>{if(!o||o.gone)return;if(kind==='auto')kind=c.hold&&!c.hold.knit?'pass':'rub';
  if(kind==='pass'){if(c.hold&&!c.hold.knit){if(dist(c,o)>170){if(c.me)say('太远了，走近一点再传');return}A.pass(c,o)}else if(c.me)say('嘴里没有毛线球');return}
  if(kind==='follow'){c.follow=o;if(c.me)say(`跟着${o.name}走（Esc 不跟了）`);return}
  if(o.kind==='npc')return petNpc(c,o);rub(c,o)};
const meows=[];let chorusCD=0;
A.onEmote=(c,i)=>{if(i!==0)return;meows.push({c,t:now()});while(meows.length&&now()-meows[0].t>4)meows.shift();if(atMe(c,240))sfx('meow');
  if(c.me)S.cats.forEach(o=>{if(isBot(o)&&near(o,c,110)&&idle(o)&&Math.random()<.4)after(rr(.3,1.4),()=>{if(idle(o)&&!o.place&&!o.gone)A.doEmote(o,0)})});
  const who=new Set(meows.filter(m=>now()-m.t<3.5&&near(m.c,c,110)).map(m=>m.c));
  if(who.size>=3&&now()>chorusCD){chorusCD=now()+14;S.cats.forEach(o=>{if(near(o,c,110)&&!o.hidden){if(!who.has(o)&&idle(o)&&!o.place&&!o.me)run(o,[{k:'meow',dur:1.8}]);for(let k=0;k<2;k++)fx.push({kind:'note',x:o.x+rr(-6,6),y:o.y-22-k*6,t0:now()+k*.3,life:1.6})}});
    news(`${who.size} 只猫在${roomAt(c.x,c.y).n}喵喵合唱`);if(near(me,c,140))say('喵喵合唱团！')}};
// 喊一声最多来 4 只（最近的几只里挑），免得满屏都是回话
const nearest=(c,d,f)=>S.cats.filter(o=>isBot(o)&&o!==c&&near(o,c,d)&&!o.working&&!o.place&&!o.hidden&&!o.leaving&&(!f||f(o))).sort((a,b)=>dist(a,c)-dist(b,c)).slice(0,6).filter(()=>Math.random()<.7).slice(0,4);
A.onSay=(c,s)=>{if(/帮忙|来人|一起/.test(s))nearest(c,220).forEach((o,i)=>{after(i*.4,()=>speak(o,rnd(['来了！','我来','马上到']),2));run(o,[{go:{x:c.x+rr(-24,24),y:c.y+rr(-6,10)}}])});
  if(/合照|拍照/.test(s))nearest(c,260).forEach(o=>useThing(o,TID('stage')));
  if(/谢谢/.test(s))S.cats.forEach(o=>{if(isBot(o)&&near(o,c,80)&&Math.random()<.5)emote(o,'heart',1.4)})};

/* ================= 地方：沙发、爬架、懒人沙发、吊床、猫窝、大纸箱、机柜顶、壁炉前、月光 ================= */
// spots 是落脚点；up(i) 是从地面跳上去要经过的点，down(i) 是跳下来的点（不跳的地方两个都不给）
// prefer(c) 给出想坐的位置顺序（v4 的巨树：你先上树顶）；坐好以后通知 A.onSeat(id, c, i)
function seatThing(o){const occ=o.spots.map(()=>null);
  const open=(c,i)=>{const u=occ[i];return !(u&&u!==c&&!u.gone)&&!(o.reserved&&o.reserved(i))};
  const freeIdx=c=>{if(o.prefer){for(const i of o.prefer(c))if(open(c,i))return i}let best=-1,bd=1e9;occ.forEach((u,i)=>{if(!open(c,i))return;const d=dist(o.spots[i],c);if(d<bd){bd=d;best=i}});return best};
  const th=T({id:o.id,n:o.n,hit:o.hit,at:o.at,near:o.near,label:o.label,ai:o.ai,hidden:o.hide,quiet:o.quiet,
    ok:c=>!c.hold&&freeIdx(c)>=0&&(!o.ok2||o.ok2(c)),no:c=>c.hold?'叼着东西，先放下吧':o.ok2&&!o.ok2(c)?o.no2(c):'满了',
    go(c){let i=freeIdx(c);if(i<0)return;
      run(c,[{go:o.up?o.floor(i):o.spots[i]},{fn:c=>{if(occ[i]&&occ[i]!==c&&!occ[i].gone){i=freeIdx(c);if(i<0){c.q=[];emote(c,'q');if(c.me)say('满了');return}}   // 同时来了好几只：到了再挑一次
        occ[i]=c;c.doing=o.doing;c.onLeave=c=>{if(occ[i]===c)occ[i]=null;c.doing=null;if(o.out)o.out(c,i)};const s=o.spots[i],up=o.up?o.up(i):[],down=o.down?o.down(i):[];
        run(c,[...(!up.length&&dist(c,s)>2?[{go:s}]:[]),...up.map(p=>({jump:{...p}})),{fn:c=>{const k=val(o.k,c);if(o.inn)o.inn(c,i);stay(c,{k,ex:val(o.ex,c),face:s.face,dur:val(o.dur,c)||rr(8,18),
          leave:c=>[...down.map(p=>({jump:{...p}})),{fn:c=>{c.z=undefined}},...(k==='sleep'?[{k:'stretch',dur:DUR.stretch}]:[])]});if(A.onSeat)A.onSeat(o.id,c,i)}}],true)}}])}});
  th.occ=occ;return th}
const napK=()=>Math.random()<.5?'sleep':'lie';   // 店里永远是夜里：不因为是夜里就一直睡
const SOFA=P.sofaSeats,TREE=TREE_TALL.map(([a,b],i)=>({x:P.tree.x+a,y:P.tree.y+b,z:P.tree.y+124.5,face:i%2?'R':'L'}));
const SZ=P.sofa.y+30.5,SF=P.sofa.y+42;
seatThing({id:'sofa',n:'沙发',hit:[P.sofa.x,P.sofa.y,70,30],at:{x:P.sofa.x+46,y:SF-2},near:[P.sofa.x+4,P.sofa.y+28,70,20],label:'跳上沙发睡一觉',spots:SOFA.slice(1).map(s=>({...s,z:SZ,face:'L'})),
  up:i=>[{...SOFA[i+1],z:SZ}],down:i=>[{x:SOFA[i+1].x,y:SF}],floor:i=>({x:SOFA[i+1].x,y:SF}),k:napK,ex:'content',doing:'在沙发上睡觉',ai:{mood:'rest',w:2}});
// 高猫爬架：先占最顶上那层，一层层跳上去（顶上有猫了，就停在下面一层）
seatThing({id:'tree',n:'高猫爬架',hit:[P.tree.x,P.tree.y,44,124],at:{x:P.tree.x+24,y:P.tree.y+132},near:[P.tree.x-4,P.tree.y+116,52,24],label:'爬上猫爬架',spots:TREE,prefer:()=>TREE.map((s,i)=>i),
  up:i=>TREE.slice(i).reverse(),down:()=>[{x:P.tree.x+24,y:P.tree.y+134}],floor:()=>({x:P.tree.x+24,y:P.tree.y+132}),k:'lie',doing:'在爬架上',ai:{mood:'rest',w:2}});
// 午睡角的三只大懒人沙发：一只坐两只猫（图鉴里算一样：bean0～2 → bean）
P.beans.forEach((b,j)=>{const F={x:b.x+23,y:b.y+36},sp=[{x:b.x+15,y:b.y+14,z:b.y+30.5,face:'R'},{x:b.x+31,y:b.y+15,z:b.y+30.5,face:'L'}];
  seatThing({id:'bean'+j,n:'懒人沙发',hit:[b.x,b.y,46,30],at:F,near:[b.x-2,b.y+24,50,18],label:'陷进懒人沙发',spots:sp,up:i=>[{...sp[i]}],down:()=>[F],floor:()=>F,k:'lie',ex:'content',doing:'陷在懒人沙发里',ai:{mood:'rest',w:1.2}})});
const HAM={x:P.hammock.x+32,y:P.hammock.y+16,z:P.hammock.y+20};
const HF=P.hammock.y+40;
seatThing({id:'hammock',n:'吊床',hit:[P.hammock.x,P.hammock.y,64,34],at:{x:HAM.x,y:HF},near:[P.hammock.x+8,P.hammock.y+30,48,18],label:'躺进吊床',spots:[{...HAM,face:'R'}],up:()=>[HAM],down:()=>[{x:HAM.x,y:HF}],floor:()=>({x:HAM.x,y:HF}),
  k:'sleep',doing:'在吊床里睡觉',ai:{mood:'rest',w:1.5},inn:c=>{S.hamBy=c},out:()=>{S.hamBy=null}});
// 午睡角靠南墙的一排三个猫窝：从上面（北边）跳进去
P.beds.forEach((b,j)=>{const F={x:b.x+17,y:b.y-4},sp={x:b.x+13,y:b.y+8,z:b.y+7,face:j%2?'L':'R'};
  seatThing({id:'bed'+j,n:'猫窝',hit:[b.x,b.y,34,12],at:F,near:[b.x-2,b.y-12,38,16],label:'钻进猫窝',spots:[sp],up:()=>[{...sp}],down:()=>[F],floor:()=>F,k:'sleep',doing:'在猫窝里睡觉',ai:{mood:'rest',w:.8}})});
seatThing({id:'bigbox',n:'大纸箱',hit:[P.bigBox.x,P.bigBox.y,40,18],at:P.bigBoxAt,label:'挤进大纸箱',spots:[0,1,2].map(i=>({x:P.bigBox.x+9+i*11,y:P.bigBox.y+15,z:P.bigBox.y+10,face:i?'L':'R'})),
  up:i=>[{x:P.bigBox.x+9+i*11,y:P.bigBox.y+15,z:P.bigBox.y+10}],down:()=>[P.bigBoxAt],floor:()=>P.bigBoxAt,k:'sit',doing:'在纸箱里',ai:{mood:'rest',w:1.5}});
const yan=()=>A.byName('砚砚');
seatThing({id:'rack',n:'服务器机柜',hit:[P.rack.x,P.rack.y,30,64],at:P.rackFloor,label:'跳上机柜顶（暖和）',spots:[{...P.rackTop,face:'L'}],up:()=>[P.rackTop],down:()=>[P.rackFloor],floor:()=>P.rackFloor,
  ok2:()=>!(yan()&&yan().atHome),no2:()=>'那是砚砚的地盘',k:napK,doing:'在机柜顶上取暖',ai:{mood:'rest',w:.6}});
seatThing({id:'fire',n:'壁炉',hit:[P.fire.x-3,P.fire.y,64,44],at:{x:P.fire.x+29,y:P.fire.y+68},near:[P.fire.x-2,P.fire.y+48,64,26],label:'在壁炉前趴一会儿',spots:P.fireSpots.map(s=>({...s,face:'R'})),k:napK,ex:'content',doing:'在壁炉前烤火',ai:{mood:'rest',w:2}});
// 橱窗下地上的一块光斑：夜里是月光（店里永远是晴天的夜里），开发工具条切到白天是阳光。点不到（点地面永远是走路），走路经过也不算；站进最亮的那一块、停下来，才能按 E 趴下
const glow=()=>S.weather==='sun';
seatThing({id:'sunA',n:'橱窗下的月光',at:P.sunA,near:[P.sunA.x-16,P.sunA.y-8,104,22],quiet:1,label:()=>S.tod==='night'?'躺在月光里':'晒太阳',hide:()=>!glow(),spots:[-34,-17,0,17,34].map((d,i)=>({x:P.sunA.x+18+d,y:P.sunA.y+(i%2)*6,face:i%2?'L':'R'})),
  ok2:glow,no2:()=>'现在没有光',k:'lie',ex:'content',doing:'躺在月光里',ai:{mood:'rest',w:c=>glow()?2:0}});

/* ================= 暖桌：钻进去只露尾巴 ================= */
const KOT=[];S.kotatsu={tails:[],jig:0};
T({id:'kotatsu',n:'暖桌',hit:[P.kotatsu.x,P.kotatsu.y-4,72,40],at:{x:P.kotatsu.x+36,y:P.kotatsu.y+44},near:[P.kotatsu.x-6,P.kotatsu.y+30,84,22],label:'钻进暖桌',
  ok:c=>!c.hold&&KOT.length<6,no:c=>c.hold?'叼着东西钻不进去':'暖桌里已经挤满了（6 只）',ai:{mood:'rest',w:2.5},
  go(c){run(c,[{go:{x:P.kotatsu.x+36+rr(-20,20),y:P.kotatsu.y+42}},{fn:c=>{if(KOT.length>=6){c.q=[];return}KOT.push(c);c.hidden=true;c.doing='在暖桌里';S.kotatsu.jig=.35;
    c.onLeave=c=>{const i=KOT.indexOf(c);if(i>=0)KOT.splice(i,1);c.hidden=false;c.doing=null;c.x=P.kotatsu.x+10+Math.random()*52;c.y=P.kotatsu.y+42;S.kotatsu.jig=.3};
    stay(c,{k:'sleep',dur:rr(12,30),leave:()=>[{fn:unclaim},{k:'stretch',dur:DUR.stretch}]})}}])}});
tick(dt=>{S.kotatsu.tails=KOT.map(c=>({pal:PAL[c.pal]}));S.kotatsu.jig=Math.max(0,S.kotatsu.jig-dt)});

/* ================= 隧道：从一头钻进去，另一头钻出来 ================= */
let tun=null;S.tunnelBulge=-1;
T({id:'tunnel',n:'猫隧道',hit:[P.tunnel.x,P.tunnel.y,62,18],at:c=>c.x<P.tunnel.x+31?P.tunnelL:P.tunnelR,near:[P.tunnel.x-14,P.tunnel.y,90,26],label:'钻隧道',ok:c=>!c.hold&&!tun,no:c=>c.hold?'叼着东西钻不进去':'隧道里有猫',
  ai:{mood:'play',w:1.5},go(c){const L=c.x<P.tunnel.x+31,a=L?P.tunnelL:P.tunnelR,b=L?P.tunnelR:P.tunnelL;
    run(c,[{go:a},{fn:c=>{if(tun){c.q=[];return}tun={c,t0:now(),L};c.hidden=true;c.onLeave=c=>{c.hidden=false;if(tun&&tun.c===c)tun=null;c.x=b.x;c.y=b.y}}},{k:'sit',dur:1.6},{fn:unclaim},{k:'happy',dur:.6,soft:1}])}});
tick(()=>{const k=tun?Math.min(1,(now()-tun.t0)/1.6):0;S.tunnelBulge=tun?(tun.L?k:1-k):-1;if(tun&&tun.c.gone)tun=null});

/* ================= 扫地机器人 ×2：上排一台、下排一台，猫可以跳上去兜风 ================= */
const VACS=(M.vac||[]).map((v,i)=>({grid:'vac'+i,home:v.home,x:v.home.x,y:v.home.y,dir:-1,mode:'dock',timer:rr(3,10),a:0,moving:0,charging:1,led:'#7ee08a',path:null,rider:null,pause:0}));
S.vacs=VACS;S.floorToys=[];
function vacGo(V,mode){if(mode==='clean'){V.mode='clean';V.timer=rr(30,45);V.a=Math.PI/2+rr(-.6,.6);V.charging=0}else{V.mode='home';V.path=findPath(V.x,V.y,V.home.x,V.home.y,V.grid)||[{...V.home}]}}
tick(dt=>VACS.forEach(V=>{V.moving=0;const fr=A.FREE[V.grid];
  if(V.mode==='dock'){V.charging=1;V.led='#7ee08a';if((V.timer-=dt)<=0)vacGo(V,'clean')}
  else if(V.mode==='clean'){V.led='#8fd8ff';const drive=V.rider&&V.rider.me&&V.steer;if(drive){V.a=Math.atan2(V.steer.dy,V.steer.dx);V.pause=0;V.timer=Math.max(V.timer,6)}
    if(V.pause>0)V.pause-=dt;else{const sp=drive?34:15,nx=V.x+Math.cos(V.a)*sp*dt,ny=V.y+Math.sin(V.a)*sp*dt;
      const hitC=S.cats.find(c=>c!==V.rider&&!c.hidden&&c.z==null&&!c.riding&&Math.abs(c.x-nx)<11&&Math.abs(c.y-ny)<8&&Math.hypot(c.x-V.x,c.y-V.y)>=Math.hypot(c.x-nx,c.y-ny));
      // 你开着的时候撞到猫：那只猫吓一跳，跳到一边
      if(drive&&hitC&&!hitC.me&&!hitC.puppet&&!hitC.place&&!hitC.working){emote(hitC,'bang',1.2);const p=land(hitC.x+Math.cos(V.a)*16+rr(-6,6),hitC.y+Math.sin(V.a)*12+rr(-4,4));run(hitC,[{jump:p,h:10,dur:.3},{k:'sit',dur:.6,ex:'angry',soft:1}]);if(near(me,hitC,200))sfx('bump')}
      if(fr(nx,ny)&&!hitC){V.x=nx;V.y=ny;V.moving=1}else if(!drive){V.a+=Math.PI*rr(.55,1.3);V.pause=rr(.2,.6)}}V.dir=Math.cos(V.a)>=0?1:-1;if((V.timer-=dt)<=0)vacGo(V,'home')}
  else{V.led='#ffd84a';const p=V.path&&V.path[0];if(!p){V.mode='dock';V.timer=rr(14,26);V.dir=-1;if(V.rider)hopOff(V.rider)}
    else{const dx=p.x-V.x,dy=p.y-V.y,d=Math.hypot(dx,dy),st=Math.min(d,16*dt);if(d>.01){V.x+=dx/d*st;V.y+=dy/d*st;V.moving=1;if(Math.abs(dx)>.3)V.dir=dx>0?1:-1}if(d-st<.3)V.path.shift()}}
  const r=V.rider;if(r){if(r.gone)V.rider=null;else{r.x=V.x;r.y=V.y-4;r.z=V.y+.5;r.dy=0}}
  for(const p of S.papers||[])if(Math.hypot(p.x-V.x,p.y-V.y)<9&&now()-p.t0>40)p.gone=true}));
A.drawers.push((L,vis)=>VACS.forEach(V=>{if(vis(V.x-10,V.y-10,20,14))L.push([V.y,()=>vacuum(Math.round(V.x)-8,Math.round(V.y)-8,A.t,{dir:V.dir,moving:V.moving,led:V.led})])}));
A.vacAt=(x,y)=>VACS.find(V=>V.mode!=='dock'&&!V.rider&&Math.hypot(x-V.x,y-(V.y-3))<10);
A.ride=(c,V,sec)=>run(c,[{chase:()=>({x:V.x+(c.x<V.x?-10:10),y:V.y+2}),near:13},{fn:c=>{if(V.rider||V.mode==='dock'){c.q=[];if(c.me)say('它回去充电了');return}}},
  {jump:()=>({x:V.x,y:V.y-4,z:V.y+.5})},{fn:c=>{if(V.rider){c.q=[];return}V.rider=c;c.riding=true;c.doing='在扫地机器人上兜风';setK(c,'sit',c.me?'happy':'content');c.onLeave=c=>{if(V.rider===c)V.rider=null;c.riding=false;c.doing=null};
    if(c.me){settle(c,{k:'sit',ex:'happy',leave:()=>{V.steer=null;return hopSteps(V)},steer:(dx,dy)=>A.vacSteer?A.vacSteer(V,dx,dy):false,act:c=>{A.leavePlace(c);return true},
        prompt:()=>A.vacSteer?'方向键开着它走 · E 跳下来':'WASD / 方向键 · 跳下来'});if(c.me)say('骑上扫地机器人了。这回能自己开着它走')}else run(c,[{k:'sit',dur:sec||rr(8,14),ex:'content'},{fn:()=>hopOff(c)}],true)}}]);
function hopSteps(V){let p=null;for(const dx of [14,-14,0])for(const dy of [6,-6,10])if(!p&&free(V.x+dx,V.y+dy))p={x:V.x+dx,y:V.y+dy};return[{jump:p||randFree()},{fn:c=>{c.z=undefined}}]}
function hopOff(c){const V=VACS.find(v=>v.rider===c);if(c.place){A.leavePlace(c);return}if(!V){c.riding=false;return}run(c,hopSteps(V))}

/* ================= 吧台这头：喂食器 ×2、饮水机、猫草、鱼缸；楼梯间的零食机（咖啡桌、吧台在 world-cafe.js） ================= */
S.feeds=P.feeds.map(()=>({level:3,drop:0,food:1,eater:null,next:rr(20,40)}));
function dispense(i){const F=S.feeds[i];if(F.food)return;F.drop=1.3;F.level=F.level>1?F.level-1:3;after(1.3,()=>F.food=1)}
tick(dt=>S.feeds.forEach((F,i)=>{F.drop=Math.max(0,F.drop-dt);if(!F.food&&(F.next-=dt)<=0){dispense(i);F.next=rr(25,40)}}));
P.feeds.forEach((f,i)=>{const EAT={x:f.x+42,y:f.y+32},IN={x:f.x+8,y:f.y+26};
  T({id:'feed'+i,n:'自动喂食器',hit:[f.x-2,f.y,40,32],at:EAT,near:[f.x+26,f.y+22,30,20],label:()=>S.feeds[i].food?'吃饭':'按一下喂食器',ok:c=>!c.hold&&!S.feeds[i].eater,no:c=>S.feeds[i].eater?S.feeds[i].eater.name+'正在吃':'先把嘴里的东西放下',
    ai:{mood:'rest',w:c=>S.feeds[i].food?1.2:.4},
    go(c){const F=S.feeds[i];run(c,[{go:EAT},{fn:c=>{if(F.eater){c.q=[];return}if(!F.food){c.q=[{k:'maneki',dur:1.2,mirror:true,fn:()=>dispense(i)},{k:'sit',dur:1.2}];return}F.eater=c;c.onLeave=c=>{if(F.eater===c)F.eater=null;c.z=undefined}}},
      {go:IN,direct:1,lock:1,z:f.y+29.5,sp:18},{k:'lie',dur:3,ex:'lookDown',face:'R'},{fn:()=>{F.food=0;F.next=rr(25,40);if(c.me)say('吃饱了')}},{go:EAT,direct:1,lock:1,z:f.y+29.5,sp:18},{fn:unclaim},{k:'lick',dur:DUR.lick,soft:1}])}})});
T({id:'fountain',n:'流水饮水机',hit:[P.fountain.x,P.fountain.y,22,16],at:P.drinkAt,label:'喝点水',ok:c=>!c.hold,no:()=>'先把嘴里的东西放下',ai:{mood:'rest',w:.8},
  go(c){run(c,[{go:P.drinkAt},{k:'lie',dur:2.6,ex:'lookDown',face:'R'},{k:'lick',dur:DUR.lick,soft:1}])}});
// 零食机：三块爪垫同时有猫踩着才出零食
S.treat={lit:0,drop:0};S.plates=[0,0,0];S.treats=[];let treatCD=0;
const onPlate=(c,p)=>c.z==null&&!c.hidden&&c.x>=p.x-1&&c.x<=p.x+17&&c.y>=p.y-2&&c.y<=p.y+10&&!c.k.startsWith('walk');
P.plates.forEach((p,i)=>T({id:'plate'+i,n:'零食机的爪垫',hit:[p.x,p.y,16,8],at:{x:p.x+8,y:p.y+5},near:[p.x-2,p.y-4,20,16],label:()=>'踩住爪垫（'+S.plates.filter(Boolean).length+'/3）',
  ok:c=>!S.cats.some(o=>o!==c&&onPlate(o,p)),no:()=>'这块爪垫已经有猫踩着了',ai:{mood:'social',w:c=>S.plates.some(Boolean)&&treatCD<=0?4:.3},
  go(c){run(c,[{go:{x:p.x+8,y:p.y+5}},{fn:c=>{c.face='R';c.doing='踩着零食机的爪垫';stay(c,{k:'sit',ex:'focus',dur:rr(8,14)});if(c.me){const n=S.plates.filter(Boolean).length+1;say(n>=3?'三块都踩住了！':`还差 ${3-n} 只猫。可以按 T 喊一声「来帮忙！」`)}}}])}}));
tick(dt=>{S.plates=P.plates.map(p=>S.cats.some(c=>onPlate(c,p))?1:0);S.treat.lit=S.plates.filter(Boolean).length;S.treat.drop=Math.max(0,S.treat.drop-dt);treatCD-=dt;
  if(S.treat.lit===3&&treatCD<=0){treatCD=45;S.treat.drop=1.6;sfx('treat');news('零食机出零食了！（三只猫一起踩住了爪垫）');if(atMe(P.treat,220))say('零食时间！');
    for(let i=0;i<7;i++){const tx=P.treat.x+rr(-30,50),ty=P.treat.y+rr(84,110);S.flying.push({x0:P.treat.x+15,y0:P.treat.y+48,x1:tx,y1:ty,t0:now()+i*.08,dur:.6,arc:20,ci:i%5,draw:f=>treatBit(f.x,f.y,f.ci),done:()=>S.treats.push({x:tx,y:ty,ci:i%5})})}
    S.cats.forEach(c=>{if(near(c,P.plates[1],30)&&!c.me&&!c.hidden)after(.8,()=>{emote(c,'heart',1.2)})})}
  // 附近闲着的猫去吃零食
  S.treats.forEach(tr=>{if(tr.by)return;const c=S.cats.filter(c=>!c.me&&idle(c)&&!c.place&&!c.hidden&&!c.working&&near(c,tr,90)).sort((a,b)=>dist(a,tr)-dist(b,tr))[0];if(c)eatTreat(c,tr)})});
function treatBit(x,y,ci){x=Math.round(x);y=Math.round(y);R(x-2,y-1,4,2,YARN[ci][0]);P1(x+2,y-2,YARN[ci][0]);P1(x+2,y+1,YARN[ci][0]);P1(x-1,y-1,YARN[ci][2])}
function eatTreat(c,tr){tr.by=c;run(c,[{go:{x:tr.x-8,y:tr.y+1}},{fn:c=>{c.face='R'}},{k:'lie',dur:1.4,ex:'lookDown'},{fn:c=>{const i=S.treats.indexOf(tr);if(i>=0)S.treats.splice(i,1);S.hearts.push({x:Math.round(c.x),y:Math.round(c.y-14),t0:now()})}},{k:'happy',dur:.8,soft:1}]);
  c.onLeave=()=>{if(tr.by===c)tr.by=null}}
A.floors.push(vis=>{S.treats.forEach(t=>{if(vis(t.x-3,t.y-3,6,6))treatBit(t.x,t.y,t.ci)})});
T({id:'treatBit',n:'零食',hidden:()=>!S.treats.some(t=>!t.by&&near(me,t,30)),near:()=>{const t=S.treats.find(t=>!t.by&&near(me,t,30));return t?[t.x-30,t.y-20,60,40]:null},hit:()=>null,
  label:'吃零食',go(c){const t=S.treats.find(t=>!t.by&&near(c,t,30));if(t)eatTreat(c,t)}});
T({id:'treat',n:'零食机',hit:[P.treat.x,P.treat.y,36,56],at:{x:P.treat.x+18,y:P.treat.y+64},label:'看看零食机',go(){say('零食机前面有三块爪垫，三只猫同时踩住就会出零食。站上去以后可以按 T 喊人来帮忙')}});
T({id:'grass',n:'猫草',hit:[P.grass.x,P.grass.y,12,17],at:P.grassAt,label:'啃两口猫草',ok:c=>!c.hold&&!(S.grassChew>0),no:()=>'刚被啃过，等它长长',ai:{mood:'rest',w:.6},
  go(c){run(c,[{go:P.grassAt},{k:'lie',dur:2,ex:'lookDown',face:'R'},{fn:()=>{S.grassChew=25}},{k:'lick',dur:DUR.lick,soft:1}])}});
T({id:'tank',n:'鱼缸',hit:[P.tank.x,P.tank.y,28,30],at:P.tankView,label:'看鱼',ok:c=>!c.hold,ai:{mood:'play',w:c=>c.pal===3?5:1},
  go(c){run(c,[{go:P.tankView},{k:'sit',dur:3,ex:'lookL',soft:1},{k:'maneki',dur:1.1,mirror:true,soft:1,fn:()=>{S.fishPaw=1.4}},{k:'sit',dur:2.4,ex:'lookL',soft:1}])}});

/* ================= 工坊：踩键盘和 CI 灯、调试鸭、打印机和纸团 ================= */
S.ci={state:'pass',p:0,glow:0,next:rr(40,80)};S.kbd=[null,null,null];
T({id:'desk',n:'键盘',hit:[P.desk.x,P.mons[0].y,P.desk.w,52],at:c=>P.kbdFloor[Math.max(0,nearKbd(c))],near:[P.desk.x-2,P.desk.y+32,P.desk.w-18,18],label:()=>S.ci.state==='fail'?'跳上桌踩键盘（CI 红了！）':'跳上桌踩键盘',
  ok:c=>!c.hold&&nearKbd(c)>=0,no:c=>c.hold?'先把嘴里的东西放下':'三个键盘都有猫了',ai:{mood:'play',w:c=>S.ci.state==='fail'?6:1},
  go(c){let i=nearKbd(c);if(i<0)return;
    run(c,[{go:P.kbdFloor[i]},{fn:c=>{if(S.kbd[i]&&S.kbd[i]!==c&&!S.kbd[i].gone){i=nearKbd(c);if(i<0){c.q=[];emote(c,'q');return}}S.kbd[i]=c;c.doing='在踩键盘';c.onLeave=c=>{if(S.kbd[i]===c)S.kbd[i]=null;c.doing=null};
      const k=P.kbds[i];run(c,[...(dist(c,P.kbdFloor[i])>2?[{go:P.kbdFloor[i]}]:[]),{jump:{x:k.x+11,y:P.desk.y+10,z:P.desk.y+32.5}},{fn:c=>{c.face='R';if(c.me&&S.ci.state==='fail')say('CI 红了，使劲踩！');stay(c,{k:'knead',ex:'focus',dur:rr(6,12),leave:()=>[{jump:{...P.kbdFloor[i]}},{fn:c=>{c.z=undefined}}]})}}],true)}}])}});
function nearKbd(c){let b=-1,bd=1e9;S.kbd.forEach((u,i)=>{if(u&&u!==c&&!u.gone)return;const d=Math.abs(P.kbdFloor[i].x-c.x);if(d<bd){bd=d;b=i}});return b}
tick(dt=>{const ci=S.ci,n=S.kbd.filter(c=>c&&!c.gone).length;ci.glow=Math.max(0,ci.glow-dt);
  if(ci.state==='pass'&&(ci.next-=dt)<=0){ci.state='fail';ci.p=0;news('CI 红了！（二楼工坊）快去踩键盘');if(atMe(P.ci,260)){sfx('alarm');say('CI 红了！跳上桌踩键盘试试')}}
  else if(ci.state==='fail'){ci.p+=dt*n*.07;if(ci.p>=1){ci.state='run';ci.t=2.5}}
  else if(ci.state==='run'&&(ci.t-=dt)<=0){ci.state='pass';ci.glow=6;ci.next=rr(80,150);news('CI 绿了——虽然没人知道是怎么修好的');S.kbd.forEach(c=>{if(c&&!c.gone)emote(c,'heart',1.6)});if(S.kbd.includes(me))say('CI 绿了！虽然你只是在上面踩了踩')}});
A.marks.push(()=>S.ci.state==='fail'?{x:P.ci.x+8,y:P.ci.y+6,col:'#e0533d'}:null);
T({id:'duck',n:'小黄鸭',hit:[P.duck.x-2,P.duck.y-2,12,10],at:P.duckAt,near:[P.duckAt.x-14,P.duckAt.y-14,30,24],label:c=>c.hold&&!c.hold.knit?'把便签上的问题讲给小黄鸭听':'和小黄鸭聊聊',ai:{mood:'play',w:.5},
  go(c){run(c,[{go:P.duckAt},{fn:c=>{c.face='L'}},{k:'sit',dur:1.2,ex:'curious',fn:c=>emote(c,'q',1.2)},{k:'meow',dur:1.6},{fn:c=>{emote(c,'bang',1.4);speak(c,'想通了！',2);if(c.hold&&!c.hold.knit){c.hold.easy=true;if(c.me)say('小黄鸭调试法：讲一遍就想通了。这颗毛线球现在解起来会很快')}else if(c.me)say('小黄鸭一句话没说，但你好像想通了什么')}},{k:'happy',dur:1,soft:1}])}});
// 打印机 → 纸团：走过去会踢到，按 E 扑一下踢得远；踢进废纸篓算进球
S.papers=[];S.print=0;
T({id:'printer',n:'打印机',hit:[P.printer.x,P.printer.y,28,34],at:{x:P.printer.x+14,y:P.printer.y+42},label:'按一下打印机',ok:()=>!(S.print>0)&&S.papers.length<4,no:()=>S.print>0?'正在打印':'地上的纸团已经够多了',ai:{mood:'play',w:.6},
  go(c){run(c,[{go:{x:P.printer.x+14,y:P.printer.y+42}},{k:'maneki',dur:.8,soft:1,fn:()=>{S.print=1.3;sfx('print');after(1.3,()=>{S.papers.push({x:P.paperOut.x,y:P.paperOut.y,vx:rr(-30,30),vy:rr(20,40),h:10,vh:0,t0:now()});if(c.me)say(rnd(['打出来一张……是昨天的周报。团成纸团踢着玩吧','打出来一张……是没人看的会议纪要。团成纸团踢着玩吧','打出来一张……上面只有一行：TODO']))})}}])}});
function kick(p,dx,dy,f){const d=Math.hypot(dx,dy)||1;p.vx=dx/d*f;p.vy=dy/d*f;p.vh=Math.min(60,f*.4);if(atMe(p,160))sfx('kick')}
tick(dt=>{S.papers=S.papers.filter(p=>!p.gone);for(const p of S.papers){
  if(p.sink!=null){p.sink+=dt;if(p.sink>.5)p.gone=true;continue}
  const nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;if(free(nx,p.y))p.x=nx;else p.vx*=-.6;if(free(p.x,ny))p.y=ny;else p.vy*=-.6;
  p.h=Math.max(0,p.h+(p.vh||0)*dt);p.vh=(p.vh||0)-120*dt;if(p.h===0){p.vh=0;const f=Math.exp(-2.2*dt);p.vx*=f;p.vy*=f}
  for(const c of S.cats)if(c.z==null&&!c.hidden&&c.k.startsWith('walk')&&Math.hypot(c.x-p.x,c.y-p.y)<5&&Math.hypot(p.vx,p.vy)<25)kick(p,p.x-c.x,p.y-c.y,rr(40,70));
  const H=P.hoop;if(Math.abs(p.x-H.x)<8&&p.y>H.y+4&&p.y<H.y+20&&Math.hypot(p.vx,p.vy)>25){p.sink=0;S.hearts.push({x:H.x,y:H.y-4,t0:now()});news('纸团进了废纸篓！');if(atMe(H,200)){sfx('goal');say('进了！')}}}});
A.drawers.push((L,vis)=>S.papers.forEach(p=>{if(vis(p.x-4,p.y-20,8,24))L.push([p.y,()=>{if(p.sink!=null){const k=p.sink/.5;paperBall(P.hoop.x,Math.round(P.hoop.y-6+k*8-Math.sin(k*Math.PI)*12));return}alpha(.25,()=>R(Math.round(p.x)-2,Math.round(p.y),5,1,'#241a2e'));paperBall(Math.round(p.x),Math.round(p.y-2-p.h))}])}));
T({id:'paper',n:'纸团',hidden:c=>!S.papers.some(p=>p.sink==null&&near(c,p,26)),near:c=>{const p=S.papers.find(p=>p.sink==null&&near(c,p,26));return p?[p.x-26,p.y-20,52,40]:null},
  hit:()=>null,label:'扑纸团（往废纸篓那边踢）',ai:{mood:'play',w:c=>S.papers.length?(c.pal===5?4:1.5):0},at:c=>{const p=S.papers[0];return p?{x:p.x-10,y:p.y}:c},
  go(c){const p=S.papers.filter(p=>p.sink==null).sort((a,b)=>dist(a,c)-dist(b,c))[0];if(!p)return;faceTo(c,p);
    run(c,[{chase:()=>({x:p.x+(c.x<p.x?-6:6),y:p.y}),near:8,sp:c.sp*1.4},{jump:()=>land(p.x,p.y),h:6,dur:.3},{fn:c=>{const H=P.hoop,aim=Math.hypot(H.x-p.x,H.y+10-p.y)<160&&Math.random()<.7;
      kick(p,aim?H.x-p.x+rr(-6,6):p.x-c.x+(c.face==='R'?8:-8),aim?H.y+12-p.y:rr(-6,6),rr(70,110))}},{k:'happy',dur:.6,soft:1}])}});

/* ================= 橱窗长廊：爪印墙、拍照角 ================= */
S.paws=[];
const pawCol=c=>PAL[c.pal].collar;
T({id:'paw',n:'爪印墙',hit:[P.paw.x,P.paw.y,P.paw.w,P.paw.h],at:P.inkAt,near:[P.inkAt.x-22,P.inkAt.y-16,44,26],label:'按个爪印',ok:c=>!c.hold&&!(c.pawT>now()),no:c=>c.hold?'先把嘴里的东西放下':'墨还没干，一会儿再来',ai:{mood:'social',w:.8},
  go(c){const x=P.paw.x+rr(4,P.paw.w-4);run(c,[{go:P.inkAt},{k:'maneki',dur:.5,mirror:true},{jump:{x,y:P.sillY+2,z:P.sillY+2}},{k:'maneki',dur:.7,fn:c=>{
      if(S.paws.length<150)S.paws.push({x:Math.round(Math.max(1,Math.min(P.paw.w-6,x-P.paw.x+rr(-2,2)))),y:Math.round(rr(10,P.paw.h-6)),col:pawCol(c)});c.pawT=now()+60;if(c.me){sfx('stamp');say(`按了一个爪印。墙上已经有 ${S.paws.length} 个了`)}}},
    {jump:{x,y:P.hangY+4}},{k:'happy',dur:.6,soft:1}])}});
// 拍照角：站到背景板前 → 有猫按快门 → 相机背面倒数 3、2、1 → 咔嚓，照片可以下载
S.cam={count:0,flash:0};const STAGE=P.stage.map(()=>null);let camBusy=false;
const stageFree=c=>STAGE.findIndex(u=>!u||u===c||u.gone);
T({id:'stage',n:'1024 舞台',hit:[P.backdrop.x,P.backdrop.y,P.backdrop.w,P.backdrop.h+48],at:{x:810,y:166},near:[766,148,88,30],label:'站上舞台',ok:c=>stageFree(c)>=0,no:()=>'站满了',ai:{mood:'social',w:c=>camBusy?5:.8},
  go(c){let i=stageFree(c);if(i<0)return;run(c,[{go:P.stage[i]},{fn:c=>{if(STAGE[i]&&STAGE[i]!==c&&!STAGE[i].gone){i=stageFree(c);if(i<0){c.q=[];emote(c,'q');return}}STAGE[i]=c;c.doing='等着拍照';c.onLeave=c=>{if(STAGE[i]===c)STAGE[i]=null;c.doing=null};
    run(c,[...(dist(c,P.stage[i])>2?[{go:P.stage[i]}]:[]),{fn:c=>{c.face=i<2?'R':'L';stay(c,{k:'sit',ex:rnd(['happy','sparkle','wink','smug','content','love']),dur:rr(6,12)});if(c.me&&!camBusy)say('站上舞台了。去台下的相机后面按快门，或者等别的猫按')}}],true)}}])}});
T({id:'camera',n:'相机',hit:[P.cam.x,P.cam.y-4,16,34],at:P.camAt,near:[P.camAt.x-20,P.camAt.y-20,40,24],label:()=>camBusy?'倒数中……':'按快门（倒数 3 秒）',ok:()=>!camBusy,no:()=>'正在倒数',ai:{mood:'social',w:c=>STAGE.filter(Boolean).length>=2&&!camBusy?3:.2},
  go(c){run(c,[{go:P.camAt},{k:'maneki',dur:.6,soft:1,fn:()=>shoot(c)}])}});
function shoot(by){if(camBusy)return;camBusy=true;S.cam.count=3;sfx('beep');
  S.cats.forEach(o=>{if(isBot(o)&&near(o,P.stage[2],170)&&!o.working&&!o.place&&Math.random()<.55&&stageFree(o)>=0)useThing(o,TID('stage'))});
  after(1,()=>{S.cam.count=2;sfx('beep')});after(2,()=>{S.cam.count=1;sfx('beep')});
  after(3,()=>{S.cam.count=0;const R0=P.shot,snap=A.snap(R0.x,R0.y,R0.w,R0.h);S.flash=.25;S.cam.flash=.25;sfx('shutter');const who=S.cats.filter(o=>inR(o.x,o.y,[R0.x,R0.y,R0.w,R0.h])&&!o.hidden);
    S.photos=(S.photos||0)+1;news(`拍了一张合照（${who.length} 只猫）`);if(who.includes(me)||by===me)A.ui.photo&&A.ui.photo(snap,who.map(o=>o.name));
    who.forEach(o=>{if(!o.me&&!o.place)emote(o,'heart',1.2)});after(.4,()=>{S.cam.flash=0;camBusy=false})})}
A.overs.push(vis=>{if(S.flash>0&&vis(P.shot.x,P.shot.y,P.shot.w,P.shot.h))alpha(Math.min(1,S.flash*4)*.8,()=>R(P.shot.x-10,P.shot.y-10,P.shot.w+20,P.shot.h+20,'#ffffff'))});

/* ================= 大客厅：泡泡机、激光点、地板钢琴、猫薄荷 ================= */
S.bubbles=[];S.bubbleOn=0;let nextBubbles=rr(40,70),bubbleT=0;const LOUNGE=M.rooms.find(r=>r.id==='lounge').in;
T({id:'bubbler',n:'泡泡机',hit:[P.bubbler.x,P.bubbler.y,36,32],at:{x:P.bubbler.x+18,y:P.bubbler.y+40},near:[P.bubbler.x-2,P.bubbler.y+32,40,18],label:()=>S.bubbleOn>0?'泡泡机开着':'打开泡泡机',ok:()=>!(S.bubbleOn>0),no:()=>'已经开着了',ai:{mood:'play',w:.4},
  go(c){run(c,[{k:'maneki',dur:.6,soft:1,fn:()=>{S.bubbleOn=10;if(c.me)say('泡泡！扑上去戳破它')}}])}});
// 开着：十秒里一串串往外冒；关着：转轮上也隔一会儿冒一个小泡泡，路过就看得出这是泡泡机
let idleBubT=1;const BX=P.bubbler.x+20,BY=P.bubbler.y+32;
tick(dt=>{if((nextBubbles-=dt)<=0){S.bubbleOn=10;nextBubbles=rr(60,110)}if(S.bubbleOn>0){S.bubbleOn-=dt;if((bubbleT-=dt)<=0){bubbleT=.28;S.bubbles.push({x:BX,y:BY,h:22,r:Math.round(rr(2,4.4)),vx:rr(-16,12),vy:rr(-2,16),vh:rr(4,9),t0:now(),life:rr(4,7)})}}
  else if((idleBubT-=dt)<=0){idleBubT=rr(1.6,2.8);S.bubbles.push({x:BX+rr(-3,3),y:BY,h:22,r:Math.round(rr(2,3.4)),vx:rr(-5,5),vy:rr(-1,3),vh:rr(5,8),t0:now(),life:rr(2,3.2)})}
  for(let i=S.bubbles.length-1;i>=0;i--){const b=S.bubbles[i];if(b.pop!=null){b.pop+=dt;if(b.pop>.25)S.bubbles.splice(i,1);continue}b.x+=b.vx*dt+Math.sin(now()*2+i)*6*dt;b.y+=b.vy*dt;b.h=Math.min(48,b.h+b.vh*dt);
    if(now()-b.t0>b.life||!inR(b.x,b.y,LOUNGE))b.pop=0}});
A.overs.push(vis=>S.bubbles.forEach(b=>{if(vis(b.x-6,b.y-b.h-6,12,12))bubble(Math.round(b.x),Math.round(b.y-b.h),b.r,b.pop??0)}));
const reachBubble=c=>S.bubbles.filter(b=>b.pop==null&&b.h<30&&near(c,b,30)).sort((a,b)=>dist(a,c)-dist(b,c))[0];
T({id:'pop',n:'泡泡',hidden:c=>!reachBubble(c),near:c=>{const b=reachBubble(c);return b?[b.x-30,b.y-22,60,44]:null},hit:()=>null,at:c=>c,label:'扑泡泡',ai:{mood:'play',w:c=>S.bubbles.length?(c.pal===5?5:2):0},
  go(c){const b=reachBubble(c)||S.bubbles.find(b=>b.pop==null);if(!b)return;faceTo(c,b);run(c,[...(near(c,b,30)?[]:[{chase:()=>b,near:14}]),{jump:()=>land(b.x,b.y),h:14,dur:.34},
    {fn:c=>{if(b.pop==null&&near(c,b,14)&&b.h<34){b.pop=0;if(c.me||atMe(b,120))sfx('pop');c.pops=(c.pops||0)+1;if(A.onPop)A.onPop(c);if(c.me)say(`啵！扑破了 ${c.pops} 个泡泡`)}else if(c.me)say('差一点')}},{k:'sit',dur:.3,soft:1}])}});
// 激光点：书架顶上的逗猫器，隔一阵自己开 15 秒，也可以去按
S.laser={on:0,x:P.laserAt.x,y:P.laserAt.y,tx:P.laserAt.x,ty:P.laserAt.y,pause:0};let nextLaser=rr(70,120);
T({id:'laser',n:'激光逗猫器',hit:[P.laser.x,P.laser.y,22,14],at:P.laserAt,near:[P.laserAt.x-16,P.laserAt.y-12,34,24],label:()=>S.laser.on>0?'激光点在地上跑':'打开激光逗猫器',ok:()=>!(S.laser.on>0),no:()=>'已经开着了，快去追',ai:{mood:'play',w:.3},
  go(c){run(c,[{k:'maneki',dur:.6,soft:1,fn:()=>{startLaser();if(c.me)say('红点！追上去扑')}}])}});
function startLaser(){const L=S.laser;L.on=15;L.x=P.laser.x+11;L.y=P.laserAt.y;newLaserTarget();news('激光点出现在二楼大客厅')}
function newLaserTarget(){const L=S.laser,p=randFree(LOUNGE);L.tx=p.x;L.ty=p.y;L.pause=Math.random()<.3?rr(.3,1.2):0}
tick(dt=>{const L=S.laser;if((nextLaser-=dt)<=0){startLaser();nextLaser=rr(90,160)}if(!(L.on>0))return;L.on-=dt;if(L.pause>0){L.pause-=dt;return}
  const dx=L.tx-L.x,dy=L.ty-L.y,d=Math.hypot(dx,dy),st=Math.min(d,130*dt);if(d>.5){L.x+=dx/d*st;L.y+=dy/d*st}else newLaserTarget();
  for(const c of S.cats)if(c.z==null&&!c.hidden&&Math.hypot(c.x-L.x,c.y-L.y)<5&&c.k==='leap')newLaserTarget()});
A.floors.push(vis=>{const L=S.laser;if(L.on>0&&vis(L.x-3,L.y-3,6,6))laserDot(Math.round(L.x),Math.round(L.y))});
T({id:'dot',n:'激光点',hidden:c=>!(S.laser.on>0&&near(c,S.laser,34)),near:c=>S.laser.on>0&&near(c,S.laser,34)?[S.laser.x-34,S.laser.y-26,68,52]:null,hit:()=>null,at:c=>S.laser,label:'扑红点',
  ai:{mood:'play',w:c=>S.laser.on>0&&roomAt(c.x,c.y).id==='lounge'?(c.pal===5?6:3):0},go(c){chaseDot(c)}});
function chaseDot(c){const L=S.laser;run(c,[{chase:()=>({x:L.x,y:L.y}),near:14,sp:c.sp*1.5},{jump:()=>land(L.x,L.y),h:10,dur:.3},{fn:c=>{const got=L.on>0&&L.pause>0&&near(c,L,9);if(got){L.pause=0;newLaserTarget();L.pause=0}
      if(A.onDot)A.onDot(c,got);else if(c.me)say(got?'按住了！……它又从爪子底下溜走了':'差一点！')}},{k:'sit',dur:.3,soft:1},
  ...(c.me?[]:[{fn:c=>{if(S.laser.on>0&&Math.random()<.7)chaseDot(c)}}])])}
// 地板钢琴：谁踩上去就响一个音（声音默认关）；按 E 让猫在上面走一段
S.piano=Array(12).fill(0);const pianoWas=Array(12).fill(0);
tick(()=>{S.piano.fill(0);for(const c of S.cats){if(c.z!=null||c.hidden)continue;if(c.x>=P.piano.x+1&&c.x<P.piano.x+97&&c.y>=P.piano.y+2&&c.y<=P.piano.y+26){const i=Math.floor((c.x-P.piano.x-1)/8);if(i>=0&&i<12)S.piano[i]=1}}
  S.piano.forEach((v,i)=>{if(v&&!pianoWas[i]){if(atMe(P.piano,200))sfx('note',i);fx.push({kind:'note',x:P.piano.x+4+i*8,y:P.piano.y+4,t0:now(),life:1.2})}pianoWas[i]=v})});
T({id:'piano',n:'地板钢琴',hit:[P.piano.x,P.piano.y,98,24],at:{x:P.piano.x-4,y:P.piano.y+14},near:[P.piano.x-14,P.piano.y-6,120,36],label:'在钢琴上走一段',ai:{mood:'play',w:c=>c.pal===3?3:1},
  go(c){const n=rr(5,9)|0,steps=[{go:{x:P.piano.x+4,y:P.piano.y+14}}];let k=0;for(let i=0;i<n;i++){k=Math.max(0,Math.min(11,k+Math.round(rr(-3,4))));steps.push({go:{x:P.piano.x+5+k*8,y:P.piano.y+12+rr(-3,3)},direct:1,sp:34},{k:'sit',dur:rr(.15,.4),soft:1})}
    steps.push({go:{x:P.piano.x+104,y:P.piano.y+14}});run(c,steps);if(c.me)say('哆来咪——（右上角可以打开声音）')}});
T({id:'catnip',n:'猫薄荷鱼',hit:[P.catnip.x-2,P.catnip.y-2,15,9],at:P.sniff,label:'闻闻猫薄荷',ok:c=>!c.hold,ai:{mood:'play',w:c=>c.pal===4?2:.5},
  go(c){run(c,[{go:P.sniff},{fn:c=>{c.face='L'}},{k:'sit',dur:1.2,ex:'curious',soft:1,fn:()=>{S.catnipUsed=4}},{k:'sit',dur:1.6,ex:'dizzy',soft:1},{k:'lie',dur:2.4,ex:'love',soft:1},{k:'sit',dur:.8,ex:'content',soft:1}])}});

/* ================= 门厅的小东西：猫抓柱、盆栽 ================= */
T({id:'post',n:'猫抓柱',hit:[P.post.x,P.post.y,16,42],at:P.postAt,label:'磨磨爪子',ok:c=>!c.hold,ai:{mood:'play',w:.8},
  go(c){run(c,[{go:P.postAt},{fn:c=>{c.face='R';S.scratch=3.4;if(c.me)sfx('scratch')}},{k:'stretch',dur:DUR.stretch},{k:'stretch',dur:DUR.stretch},{k:'sit',dur:.5,ex:'content',soft:1}])}});
T({id:'plant',n:'盆栽',hit:[P.plantA.x,P.plantA.y,16,26],at:{x:P.plantA.x+8,y:P.plantA.y+32},near:[P.plantA.x-4,P.plantA.y+22,26,18],label:'蹭蹭盆栽',go(c){S.plantShake=1;run(c,[{k:'lick',dur:1,soft:1}])}});
// 咖啡机在吧台上，做拉花：world-cafe.js

/* ================= 后院：落叶堆、飞蛾（白天是蝴蝶）、鸟浴盆；屋顶：跑轮和串灯 ================= */
S.pile=1;let leafT=0;
tick(dt=>{if((leafT-=dt)<=0){leafT=rr(.5,1.3);const x=P.maple.x+rr(-30,30),gy=P.maple.y+rr(-6,40);fx.push({kind:'leaf',x,y:gy,h:rr(40,70),fall:rr(10,16),ci:Math.floor(Math.random()*4),t0:now(),life:18});
  if(Math.hypot(x-P.pile.x,gy-P.pile.y)<24)S.pile=Math.min(1,S.pile+.02)}S.pile=Math.min(1,S.pile+dt*.008)});
// 叶子炸开一地：跳进去、从秋千上飞进来都是这一下
A.pileBurst=c=>run(c,[{fn:c=>{c.hidden=true;S.pile=.15;sfx('rustle');
      for(let i=0;i<36;i++){const a=rr(0,Math.PI*2),s=rr(20,60);fx.push({kind:'leaf',x:P.pile.x+rr(-8,8),y:P.pile.y+rr(-3,3),h:rr(2,8),vx:Math.cos(a)*s,vy:Math.sin(a)*s*.3,vh:rr(40,90),ci:i%4,t0:now(),life:rr(6,12)})}
      c.onLeave=c=>{c.hidden=false};if(c.me)say('哗啦——')}},{k:'sit',dur:.9},{fn:unclaim},{k:'happy',dur:1,soft:1}],true);
T({id:'pile',n:'落叶堆',hit:[P.pile.x-20,P.pile.y-12,40,14],at:{x:P.pile.x-30,y:P.pile.y+2},near:[P.pile.x-44,P.pile.y-10,88,24],label:'跳进落叶堆',ok:c=>S.pile>.45&&!c.hold,no:c=>c.hold?'叼着东西呢':'叶子还没攒够，等一会儿',
  ai:{mood:'play',w:c=>S.pile>.6?2:0},
  go(c){run(c,[{go:{x:P.pile.x-30,y:P.pile.y+2}},{fn:c=>{c.face='R'}},{k:'pounce',dur:1.1},{jump:{x:P.pile.x,y:P.pile.y},h:14,dur:.45},{fn:c=>A.pileBurst(c)}])}});
const FLY=P.flyArea;   // 后院的草地：白天是蝴蝶在花坛和草地上飞；夜里（店里永远是夜里）是飞蛾绕着后院的路灯飞
const night=()=>S.tod==='night',LAMP=P.lampP[0],MOTH=['#ece4d4','#dcd0bc','#f6efe2'];
S.flies=[0,1,2].map(i=>({x:rr(FLY[0]+20,FLY[0]+FLY[2]-40),y:rr(FLY[1]+10,FLY[1]+FLY[3]-30),h:rr(12,26),tx:0,ty:0,col:['#ffd84a','#f4a6b8','#fff4dc'][i],spook:0}));
tick(dt=>S.flies.forEach(f=>{if(f.spook>0)f.spook-=dt;if(Math.hypot(f.tx-f.x,f.ty-f.y)<3||!f.tx){const p=night()?{x:LAMP.x+3+rr(-24,24),y:LAMP.y+rr(26,46)}:Math.random()<.4?{x:P.flowers.x+rr(6,P.flowers.w-6),y:P.flowers.y+14}:randFree(FLY);f.tx=p.x;f.ty=p.y}
  const dx=f.tx-f.x,dy=f.ty-f.y,d=Math.hypot(dx,dy),sp=f.spook>0?60:18;f.x+=dx/d*Math.min(d,sp*dt)+Math.sin(now()*7+f.col.length)*8*dt;f.y+=dy/d*Math.min(d,sp*dt);f.h=Math.max(6,Math.min(40,(f.spook>0?f.h+30*dt:night()?f.h+(30-f.h)*dt+Math.sin(now()*5+f.x)*14*dt:f.h+Math.sin(now()*3+f.x)*10*dt)))}));
A.overs.push(vis=>S.flies.forEach((f,i)=>{if(vis(f.x-4,f.y-f.h-4,8,8))butterfly(Math.round(f.x),Math.round(f.y-f.h),A.t,night()?MOTH[i%3]:f.col)}));
const nearFly=c=>S.flies.filter(f=>near(c,f,34)&&f.spook<=0).sort((a,b)=>dist(a,c)-dist(b,c))[0];
T({id:'fly',n:'飞蛾',hidden:c=>!nearFly(c),near:c=>{const f=nearFly(c);return f?[f.x-34,f.y-26,68,52]:null},hit:()=>null,at:c=>S.flies[0],label:()=>night()?'扑飞蛾':'扑蝴蝶',ai:{mood:'play',w:c=>roomAt(c.x,c.y).id==='yard'?(c.pal===3?4:1.5):.2},
  go(c){const f=nearFly(c)||rnd(S.flies);faceTo(c,f);run(c,[...(near(c,f,30)?[]:[{chase:()=>f,near:16}]),{k:'pounce',dur:.9},{jump:()=>land(f.x,f.y),h:12,dur:.34},{fn:c=>{f.spook=2;f.tx=0;if(c.me)say(rnd(['差一点！',night()?'飞蛾飞高了':'蝴蝶飞高了','它就是故意的']))}},{k:'sit',dur:.6,ex:'meh',soft:1}])}});
S.bathBirds=[];let nextBath=rr(8,20);
tick(dt=>{if((nextBath-=dt)<=0&&S.bathBirds.length<2){nextBath=rr(20,40);const side=S.bathBirds.length?16:5;S.bathBirds.push({x:P.bath.x+side,y:P.bath.y+2,dir:side>8?-1:1,t0:now(),until:now()+rr(18,30),fly:0,fx:0,fy:0})}
  S.bathBirds.forEach(b=>{if(!b.fly&&(now()>b.until||S.cats.some(c=>!c.stalk&&c.k.startsWith('walk')&&near(c,b,26)))){b.fly=now()}if(b.fly){const k=now()-b.fly;b.fx=k*40*b.dir;b.fy=-k*50}});
  S.bathBirds=S.bathBirds.filter(b=>!b.fly||now()-b.fly<1.6)});
A.drawers.push((L,vis)=>S.bathBirds.forEach(b=>{const x=Math.round(b.x+b.fx),y=Math.round(b.y+b.fy);if(vis(x-6,y-8,12,10))L.push([P.bath.y+22.2,()=>bird(x,y,A.t,{dir:b.dir,fly:!!b.fly})])}));
T({id:'bath',n:'鸟浴盆',hit:[P.bath.x,P.bath.y-8,22,30],at:{x:P.bath.x+50,y:P.bath.y+22},near:[P.bath.x-30,P.bath.y+6,90,34],label:()=>S.bathBirds.some(b=>!b.fly)?'悄悄靠近小鸟':'鸟浴盆（现在没有鸟）',
  ok:()=>S.bathBirds.some(b=>!b.fly),no:()=>'等小鸟来了再说',ai:{mood:'play',w:c=>S.bathBirds.some(b=>!b.fly)?(c.pal===3?4:1):0},
  go(c){const b=S.bathBirds.find(b=>!b.fly);if(!b)return;c.stalk=true;c.onLeave=c=>{c.stalk=false};faceTo(c,b);
    run(c,[{go:{x:b.x+(c.x<b.x?-16:16),y:P.bath.y+24},sp:9,keepPose:1,pose:'pounce'},{fn:c=>{if(Math.random()<.5)b.fly=now()}},{jump:()=>land(b.x+(c.x<b.x?-6:6),P.bath.y+24),h:12,dur:.35},{fn:c=>{b.fly=b.fly||now();if(c.me)say('小鸟扑棱扑棱飞走了。反正本来也没想抓')}},{fn:unclaim},{k:'sit',dur:.8,ex:'meh',soft:1}],true)}});
// 跑轮：猫在里面跑，串灯就一颗颗亮起来（天黑以后才看得出来）
S.power=0;S.wheelA=0;let wheelBy=null,lit=0;
const WHEEL={x:P.wheel.x+24,y:P.wheel.y+41,z:P.wheel.y+50.5};
T({id:'wheel',n:'猫跑轮',hit:[P.wheel.x,P.wheel.y,48,50],at:{x:WHEEL.x,y:P.wheel.y+58},near:[P.wheel.x-6,P.wheel.y+44,60,24],label:'进跑轮跑一会儿',ok:c=>!c.hold&&(!wheelBy||wheelBy===c),no:c=>c.hold?'叼着东西呢':wheelBy.name+'在里面跑',
  ai:{mood:'play',w:c=>c.pal===5?3:1},go(c){run(c,[{go:{x:WHEEL.x,y:P.wheel.y+58}},{fn:c=>{if(wheelBy){c.q=[];return}wheelBy=c;c.doing='在跑轮里跑';c.onLeave=c=>{if(wheelBy===c)wheelBy=null;c.doing=null}}},{jump:WHEEL},
    {fn:c=>{c.face='R';stay(c,{k:'walkR',dur:rr(8,14),leave:()=>[{jump:{x:WHEEL.x,y:P.wheel.y+60}},{fn:c=>{c.z=undefined}}]});if(c.me)say('跑起来！旁边的串灯会一颗颗亮起来')}}])}});
tick(dt=>{if(wheelBy&&wheelBy.gone)wheelBy=null;const run2=wheelBy&&wheelBy.k==='walkR';S.wheelA+=dt*(run2?(A.wheelSpin?A.wheelSpin(wheelBy):5):0);S.power=Math.max(0,Math.min(1,S.power+(run2?(A.wheelGain?A.wheelGain(wheelBy):.13):-.004)*dt));
  const n=Math.floor(S.power*30);if(n>lit&&n===30)news('屋顶的串灯全亮了');lit=n;
  A.lights.length=0});
tick(dt=>{S.hamSw=Math.sin(now()*1.2)*(S.hamBy?1:.4);if(S.hamBy&&!S.hamBy.gone&&S.hamBy.k!=='leap')S.hamBy.dy=Math.round(Math.sin(now()*1.2))});

/* ================= 大毛线团：疑难委托，三只猫一起扒拉才解得开 ================= */
const GIANT_PATH=[P.xlOut,...P.giantPath,{x:P.giant.x,y:P.giant.y}];
let nextGiant=rr(90,150);S.giant=null;const GSPOTS=[[-20,2,'R'],[20,2,'L'],[-12,12,'R'],[12,12,'L']];
function giantArrive(){if(S.giant)return;S.xl=2.5;S.door.ring=1.2;sfx('bell');S.giant={x:P.xlOut.x,y:P.xlOut.y,seg:0,p:0,cols:[rnd([0,2,4]),1,3],state:'roll',help:GSPOTS.map(()=>null)};
  news('门外塞进来一颗大毛线团！要三只猫一起解（橱窗长廊）');if(A.play)say('大毛线团来了！它会滚进橱窗长廊，要三只猫一起扒拉')}
tick(dt=>{if(!S.giant&&(nextGiant-=dt)<=0){giantArrive();nextGiant=rr(160,240)}const g=S.giant;if(!g)return;
  if(g.state==='roll'){const p=GIANT_PATH[g.seg+1];if(!p){g.state='wait';return}const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),st=Math.min(d,38*dt);g.x+=dx/d*st;g.y+=dy/d*st;g.spin=(g.spin||0)+st;if(d-st<.5)g.seg++}
  else if(g.state==='wait'){const n=g.help.filter(c=>c&&!c.gone&&!c.k.startsWith('walk')&&near(c,g,26)).length;g.n=n;if(n>=3){g.p+=dt*.035*n;if(g.p>=1)giantDone()}}});
function giantDone(){const g=S.giant,helpers=g.help.filter(Boolean);S.giant=null;for(let i=0;i<5;i++)S.puffs.push({x:g.x+rr(-10,10),y:g.y-12+rr(-6,6),t0:now()+i*.08});
  S.banner=60;if(!A.shared)S.count++;news(`大毛线团解开了！${helpers.length} 只猫一起织成一条横幅，挂在橱窗上`);sfx('fanfare');
  helpers.forEach(c=>{c.helpGiant=null;S.hearts.push({x:Math.round(c.x),y:Math.round(c.y-18),t0:now()});run(c,[{k:'happy',dur:1.4}]);if(c.me)say('解开了！抬头看橱窗上那条横幅')})}
A.drawers.push((L,vis)=>{const g=S.giant;if(g&&vis(g.x-40,g.y-40,80,50))L.push([g.y,()=>{giantYarn(Math.round(g.x),Math.round(g.y),A.t,g.p,g.cols);if(g.state==='wait'){pbar(Math.round(g.x)-12,Math.round(g.y)-34,24,g.p,g.n>=3?'#7ee08a':'#ffd84a');if(g.n<3)txt(g.n+'/3',Math.round(g.x)-5,Math.round(g.y)-42,'#fff4dc')}}])});
A.marks.push(()=>S.giant?{x:S.giant.x,y:S.giant.y,col:'#ffd84a'}:null);
const gFree=c=>S.giant?S.giant.help.findIndex(u=>!u||u===c||u.gone):-1;
T({id:'giant',n:'大毛线团',hidden:()=>!S.giant||S.giant.state!=='wait',hit:()=>S.giant?[S.giant.x-16,S.giant.y-28,32,30]:null,at:c=>{const g=S.giant,i=Math.max(0,gFree(c));return g?{x:g.x+GSPOTS[i][0],y:g.y+GSPOTS[i][1]}:c},
  near:()=>S.giant?[S.giant.x-34,S.giant.y-14,68,34]:null,label:()=>{const g=S.giant;return g&&g.n<3?`一起扒拉大毛线团（还差 ${3-(g.n||0)} 只）`:'一起扒拉大毛线团'},
  ok:c=>!c.hold&&gFree(c)>=0,no:c=>c.hold?'先把嘴里的毛线球放下':'围满了',ai:{mood:'work',w:c=>S.giant&&S.giant.state==='wait'?8:0},
  go(c){const g=S.giant;let i=gFree(c);if(!g||i<0)return;const at=i=>({x:g.x+GSPOTS[i][0],y:g.y+GSPOTS[i][1]});
    run(c,[{go:at(i)},{fn:c=>{if(S.giant!==g){c.q=[];return}if(g.help[i]&&g.help[i]!==c&&!g.help[i].gone){i=gFree(c);if(i<0){c.q=[];emote(c,'q');return}}   // 同时来了好几只：到了再挑一次
      g.help[i]=c;c.helpGiant=g;c.doing='在解大毛线团';c.onLeave=c=>{if(g.help[i]===c)g.help[i]=null;c.doing=null;c.yarn=null};
      run(c,[...(dist(c,at(i))>2?[{go:at(i)}]:[]),{fn:c=>{c.face=GSPOTS[i][2];c.yarn=g.cols[0];stay(c,{k:rnd(['bat','swing','kick']),dur:60});if(c.me&&(g.n||0)<2)say('再来两只猫就能解了。按 T 喊一声「来帮忙！」')}}],true)}}])}});

/* ================= 店猫（NPC）：三只守着自己的地盘，三只到处逛 ================= */
const HOMES={1:{spot:{x:P.sofaSeats[0].x,y:P.sofaSeats[0].y,z:SZ,face:'R'},floor:{x:P.sofaSeats[0].x,y:SF},pool:['sleep','knead','lie','belly']},
  2:{spot:{...P.rackTop,face:'L'},floor:P.rackFloor,pool:['lie','sleep','lick','sit']},6:{spot:{...P.counterTop,face:'R'},floor:P.counterFloor,pool:['sleep','lie','lick','sit']}};
function goHome(c){const h=HOMES[c.pal];return[{go:h.floor},{jump:h.spot},{fn:c=>{c.atHome=true;c.face=h.spot.face;setK(c,h.pool[0])}}]}
const LIKES={3:{tank:4,win0:2,win1:2,piano:3,bath:3,fly:3,walk:3},4:{vac:4,bigbox:3,tunnel:3,catnip:2,walk:3},5:{work:5,dot:4,pop:4,paper:3,wheel:3,giant:6,walk:3}};
[[1,'宪宪'],[2,'砚砚'],[6,'金哥'],[3,'烁烁'],[4,'小狸花'],[5,'斑斑']].forEach(([b,name])=>{const c=A.mkCat(b,name,{kind:'npc',def:PERSONA[b].face,sp:26});const h=HOMES[b];
  if(h)Object.assign(c,{x:h.spot.x,y:h.spot.y,z:h.spot.z,face:h.spot.face,atHome:true,k:h.pool[0]});else Object.assign(c,randIn(['cafe','library','gallery'][b-3]));S.cats.push(c)});
function npcThink(c){const h=HOMES[c.pal];
  if(h){if(!c.atHome){run(c,goHome(c));return}c.wait=rr(7,13);setK(c,pickW(Object.fromEntries(h.pool.map(k=>[k,(PERSONA[c.pal].idle[k]??1)]))));return}
  c.wait=rr(1,3);const L=LIKES[c.pal],w={walk:L.walk,idle:3};
  for(const k in L){if(k==='walk')continue;if(k==='work'){w.work=S.baskets.some(b=>b.length)&&!c.hold?L.work:0;continue}if(k==='vac'){w.vac=VACS.some(V=>V.mode==='clean'&&!V.rider)?L.vac:0;continue}
    const th=TID(k);if(th&&!(th.hidden&&th.hidden(c))&&(!th.ok||th.ok(c)))w[k]=L[k]*(th.ai?Math.min(3,val(th.ai.w,c)||0)+.3:1)}
  const k=pickW(w);
  if(k==='walk'){run(c,[{go:randFree(roomRect(c))},{k:'sit',dur:rr(1,2.5)}]);return}
  if(k==='idle'){const al=Object.keys(PERSONA[c.pal].idle).filter(x=>x!=='walk'&&x!=='sleep'),pk=al.length?pickW(Object.fromEntries(al.map(x=>[x,PERSONA[c.pal].idle[x]]))):'lick';run(c,[{k:pk,dur:pk==='pounce'?DUR.pounce:pk==='lick'?DUR.lick:rr(3,5)},{k:'sit',dur:.1}]);return}
  if(k==='work'){doWork(c);return}if(k==='vac'){const V=VACS.find(V=>V.mode==='clean'&&!V.rider);if(V)A.ride(c,V);return}
  const th=TID(k);if(th)(th.id==='dot'||th.id==='pop'||th.id==='fly'||th.id==='paper')?th.go(c):useThing(c,th)}
const roomRect=c=>roomAt(c.x,c.y).in;
function doWork(c){const opts=S.baskets.map((b,i)=>[i,b.length]).filter(([,n])=>n>0);if(!opts.length||c.hold)return false;
  const i=opts.map(([i])=>i).sort((a,b)=>dist(c,P.baskets[a])-dist(c,P.baskets[b]))[Math.random()<.7?0:Math.floor(Math.random()*opts.length)],th=TID('basket'+i);
  c.working=true;c.doing='在做委托';const rug=rnd(P.rugs);
  run(c,[{go:val(th.at,c)},{fn:c=>{if(!takeYarn(c,i)){c.working=false;c.doing=null;c.q=[];emote(c,'q',1)}}},{k:'hold',dur:.6},{go:()=>({x:rug.x+rr(-28,28),y:rug.y+rr(-5,6)})},
    ...solveSteps(c),...deliverSteps(c),{fn:c=>{c.working=false;c.doing=null;if(isBot(c)&&Math.random()<.35&&!(c.pawT>now()))useThing(c,TID('paw'))}}]);return true}

/* ================= 在线的其他猫（原型里是机器人） ================= */
const usedNames=A.usedNames=new Set();let botTarget=0,botT=0,visitT=rr(12,25);   // A.usedNames：成品里把玩家的名字也放进去，机器人就不会重名
function botName(){const f=BOT_NAMES.filter(n=>!usedNames.has(n));const n=f.length?rnd(f):rnd(BOT_NAMES)+(2+Math.floor(Math.random()*8));usedNames.add(n);return n}
const MOODW=()=>({work:rr(1,4),play:rr(1.5,4),rest:rr(1,3),social:rr(1,3),afk:rr(.3,1.5),explore:rr(.5,2)});
// 每只补位的猫有一层最喜欢的楼（一楼 40%、二楼 25%、屋顶 20%、地下 15%）：逛的时候多半在那一层，做事也更爱挑那一层的东西。屋顶是看星星的地方，地下是跳舞泡澡的地方，都要有猫
// 猫猫星球（secret）不在里面：补位的猫不去
const FAVW={f1:40,f2:25,roof:20,b1:15},roomsOf=f=>M.rooms.filter(r=>r.f===f);
const pickRoom=f=>{const L=f?roomsOf(f):M.rooms.filter(r=>FAVW[r.f]!=null);return pickW(Object.fromEntries(L.map(r=>[r.id,r.in[2]*r.in[3]])))};
function addBot(instant){const fav=pickW(FAVW),mw=MOODW();if(fav==='roof'){mw.work*=.35;mw.rest*=1.6}
  const c=A.mkCat(7+Math.floor(Math.random()*COATS.length*COLLARS.length),botName(),{kind:'bot',def:rnd(BOT_FACES),sp:rr(26,36),moods:mw,mood:null,moodUntil:0,fav});
  if(instant){Object.assign(c,randIn(pickRoom(fav)));c.wait=rr(0,4)}
  else{Object.assign(c,{x:P.spawnIn.x,y:P.spawnIn.y,hidden:true});S.spawnPop=.6;run(c,[{fn:c=>{c.hidden=false;c.z=P.spawn.y+19.5}},{jump:{...P.spawnOut},h:14},{k:'happy',dur:.8}]);if(Math.random()<.35||A.online<20)news(`${c.name} 上线了`)}
  S.cats.push(c);return c}
function dropBot(c){c.leaving=true;usedNames.delete(c.name);run(c,[{go:P.spawnOut},{jump:{x:P.spawnIn.x,y:P.spawnIn.y,z:P.spawn.y+19.5},h:14},{fn:c=>{c.gone=true;S.spawnPop=.6;if(c.hold)S.baskets[0].push(c.hold)}}])}
A.setBots=(n,instant)=>{botTarget=n;if(instant){const bots=S.cats.filter(c=>isBot(c)&&!c.leaving);for(let i=bots.length;i<n;i++)addBot(true);bots.slice(n).forEach(c=>{unclaim(c);c.gone=true;usedNames.delete(c.name);if(c.hold)S.baskets[0].push(c.hold)})}};
tick(dt=>{const bots=S.cats.filter(c=>isBot(c)&&!c.leaving);A.online=bots.length+1;if((botT-=dt)<=0){botT=.3;if(bots.length<botTarget)addBot(false);
    else if(bots.length>botTarget){const c=bots.find(c=>idle(c)&&!c.working&&!c.hold)||bots.find(c=>!c.working&&!c.hold&&!c.hidden);if(c){unclaim(c);dropBot(c)}}}
  // 时不时有猫来找你：蹭蹭、传球
  if(A.play&&(visitT-=dt)<=0){visitT=rr(18,40);const c=S.cats.filter(c=>isBot(c)&&!c.working&&!c.leaving&&idle(c)&&near(c,me,260)&&!c.hidden)[0];
    if(c&&!me.hidden)run(c,[{chase:()=>({x:me.x+(c.x<me.x?-16:16),y:me.z!=null?me.z+6:me.y+2}),near:20},{fn:c=>{if(!near(c,me,30))return;if(c.hold&&!c.hold.knit&&!me.hold&&Math.random()<.5)A.pass(c,me);else A.social(c,me,'rub')}}])}});
function urgent(c){const g=S.giant;if(g&&g.state==='wait'&&(g.n||0)<4&&near(c,g,380)&&!c.hold&&Math.random()<.45)return()=>useThing(c,TID('giant'));
  const pl=S.plates.filter(Boolean).length;if(pl>0&&pl<3&&near(c,P.plates[1],230)&&Math.random()<.4){const i=S.plates.findIndex(v=>!v);if(i>=0)return()=>{speak(c,rnd(['来了！','我来踩','等等我']),1.8);useThing(c,TID('plate'+i))}}
  if(camBusy&&near(c,P.stage[2],180)&&Math.random()<.5)return()=>useThing(c,TID('stage'));
  if(S.ci.state==='fail'&&near(c,P.ci,260)&&Math.random()<.3)return()=>useThing(c,TID('desk'));
  if(S.laser.on>0&&roomAt(c.x,c.y).id==='lounge'&&Math.random()<.45)return()=>chaseDot(c);
  if(S.bubbles.length>3&&near(c,P.bubbler,160)&&Math.random()<.35)return()=>TID('pop').go(c);
  if(S.treats.some(t=>!t.by)&&near(c,P.treat,160))return()=>{const t=S.treats.find(t=>!t.by);if(t)eatTreat(c,t)};
  return null}
function socialAct(c){const r=Math.random(),others=S.cats.filter(o=>o!==c&&!o.hidden&&!o.gone&&o.z==null&&near(o,c,140));
  if(r<.35&&others.length){const o=rnd(others);run(c,[{chase:()=>({x:o.x+(c.x<o.x?-16:16),y:o.y+1}),near:20},{fn:c=>{if(near(c,o,30))A.social(c,o,'rub')}}]);return}
  if(r<.55&&others.length){const o=rnd(others.filter(o=>o.k.startsWith('walk'))||others)||rnd(others);c.followT=o;c.followUntil=now()+rr(15,35);return}
  if(r<.75){A.doEmote(c,Math.random()<.6?0:rnd([1,3,4]));return}
  if(r<.85){speak(c,rnd(['摸鱼中','有人一起拍照吗','CI 又红了？','干饭！','今天解了好多','谁来一起解大毛线团','晚上好','喵']),2.6);return}
  useThing(c,TID('stage'))}
// 页面上的"事件"按钮
A.events={arrive:()=>{for(let i=0;i<3;i++)after(i*.5,arrive)},giant:()=>{if(S.giant)return'大毛线团已经在店里了';giantArrive()},ci:()=>{if(S.ci.state==='pass'){S.ci.next=0;return}return'CI 已经是红的了'},
  laser:()=>startLaser(),bubbles:()=>{S.bubbleOn=10},bird:()=>{nextBath=0;S.birds.forEach((b,w)=>{if(!b)nextWinBird[w]=0})},vac:()=>VACS.forEach(V=>vacGo(V,V.mode==='dock'?'clean':'home'))};
// 别的模块要用到的几样
Object.assign(A,{arrive1:arrive,HOMES,LIKES,goHome,solveSteps,deliverSteps,throwTo,giveBack,land,useThing,TID,fx,nearest,seatThing,faceTo,pickBy,chaseDot,eatTreat,VACS,kindOne,SZ,SF});
A.think=c=>{if(c.leaving)return;if(c.kind==='npc')return npcThink(c);
  c.wait=rr(.6,2.4);if(c.hold){c.working=true;c.doing='在做委托';run(c,[...(c.hold.knit?[]:solveSteps(c)),...deliverSteps(c),{fn:c=>{c.working=false;c.doing=null}}]);return}
  if(c.followT){const o=c.followT;if(o.gone||o.hidden||now()>c.followUntil)c.followT=null;else{if(dist(o,c)>26)run(c,[{chase:()=>({x:o.x+(c.x<o.x?-13:13),y:o.z!=null?o.z+6:o.y+1}),near:16}]);c.wait=.3;return}}
  if(now()>c.moodUntil){c.mood=pickW(c.moods);c.moodUntil=now()+rr(25,90)}
  const ev=urgent(c);if(ev)return ev();
  // 爱待在屋顶的猫：在屋顶上一半的时候就找个地方坐着、趴着看天，不急着下楼
  if(c.fav==='roof'&&A.floorOf(c.y).id==='roof'&&c.mood!=='work'&&Math.random()<.55){run(c,[{go:randIn('roof')},{k:rnd(['sit','lie','sleep','sit','lick']),dur:rr(8,22),ex:'lookUp'}]);return}
  const m=c.mood;
  if(m==='work'){if(!doWork(c))c.mood='play';return}
  if(m==='afk'){run(c,[{k:rnd(['sleep','sleep','lie','sit','knead']),dur:rr(15,45)}]);return}
  if(m==='explore'){run(c,[{go:randIn(pickRoom(Math.random()<.7?c.fav:null))},{k:rnd(['sit','lick','lie','meow']),dur:rr(2,6)}]);return}
  if(m==='social'&&Math.random()<.55)return socialAct(c);
  const cands=TH.filter(th=>th.ai&&th.ai.mood===m&&!(th.hidden&&th.hidden(c))&&(!th.ok||th.ok(c)));
  if(!cands.length||Math.random()<.25){run(c,[{go:randFree(roomRect(c))},{k:rnd(['sit','lick','lie','sit']),dur:rr(2,6)}]);return}
  const th=pickBy(cands,th=>{const at=val(th.at,c)||c;return(val(th.ai.w,c)||0)/(1+dist(c,at)/260)*(c.fav&&A.floorOf(at.y).id===c.fav?3:1)});if(!th)return;
  if(['dot','pop','fly','paper'].includes(th.id))th.go(c);else useThing(c,th)};
});
