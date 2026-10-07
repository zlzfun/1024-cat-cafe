/* 1024 猫咖 · 场景 v4 任务引擎：叼起毛线球 → 对话框展开便签 → 按类型完成任务 → 织好 → 挂进橱窗 → 人类取走时回信。依赖 world4-things.js（A.dlg、A.emit）、quest-bank.js。
   只有"你"叼的球才有任务；在线的其他猫（机器人）照旧按 v3 的方式解球。把带任务的球传给机器人，任务就跟着交出去了。
   九种任务：quiz 答疑 / guard 守铁律 / tool 挑本事 / care 陪伴 / chat 闲聊（在对话框里选）· route 派单（@ 一只店猫，它自己跑过来接）· memory 查记忆（去图书馆翻书）
            · coop 几只猫一起（喊帮手，围过来一起扒拉）· flow 走流程（写测试 → 跑 CI → 请别的猫 review → 过门禁合并）。
   顺带把猫咖本身的几条规矩做进来：乒乓球熔断（同一颗球反复传给同一只猫）、虚空传球（附近没有猫还按 Q）、球权链（回信里列出这颗球经过谁的手）。 */
WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,setK,emote,speak,say,sfx,news,after,dist,T,TID}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,isBot=c=>c.kind==='bot',tick=f=>A.tickers.push(f);
const def=id=>QUEST_BANK.find(q=>q.id===id),npc=pal=>S.cats.find(c=>c.kind==='npc'&&c.pal===pal),tipOf=k=>TIPS[k]?{...TIPS[k],key:k}:null;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const chPick=()=>{const s=CHANNELS.reduce((a,[,w])=>a+w,0);let r=Math.random()*s;for(const [n,w] of CHANNELS)if((r-=w)<=0)return n;return CHANNELS[0][0]};
const Q=A.Q={seen:{},types:{},solved:0,cur:null,last:null};let qno=0;

/* ---------- 给新叼起的球挑一道题：每一颗都随机抽，没有固定的第一颗、第二颗 ----------
   先按类型抽（每类机会差不多，闲聊多给一点），同一类里再平分；见过的题记在你的猫身上（A.guide.qseen），换天再来也先出没见过的，全见过了从头轮。
   第一颗球（还没解过）不太会抽到"走流程""几只猫一起"：机会小一些，不是不出。 */
function pickQuest(){if(Q.force){const d=def(Q.force);Q.force=null;if(d)return d}   // Q.force：测试用，指定下一道题
  const seen=A.guide.qseen(),ok=q=>!Q.seen[q.id]&&(q.type!=='route'||npc(q.ans));let pool=QUEST_BANK.filter(q=>!seen[q.id]&&ok(q));
  if(!pool.length){for(const k in seen)delete seen[k];pool=QUEST_BANK.filter(ok)}   // 全见过了：从头轮
  const L=pool.length?pool:QUEST_BANK,per={},first=!A.guide.balls()&&!Q.solved;L.forEach(q=>per[q.type]=(per[q.type]||0)+1);
  return A.pickBy(L,q=>{let w=(q.type==='chat'?1.6:1)/per[q.type]/(1+(Q.types[q.type]||0)*1.2);if(first&&(q.type==='flow'||q.type==='coop'))w*=.3;
    if(q.type==='route'){const c=npc(q.ans);w*=c?(dist(c,me)<320?1.6:dist(c,me)<640?1:.5):.2}
    const here=A.roomAt(me.x,me.y).id;if(q.type==='memory')w*=here==='library'?2:A.floorOf(me.y).id==='f2'?1.3:.9;if(q.type==='flow')w*=here==='lab'?2:A.floorOf(me.y).id==='f2'?1.3:.8;   // 在图书馆、工坊附近多出查记忆、走流程的题
    if(q.type==='coop')w*=S.cats.filter(c=>isBot(c)&&near(c,me,260)).length>=2?1.4:.6;return w})}
// 联机时别的真人传过来的球带着题号（qid）和它经过谁（chain）：接着做同一道题
function assign(y){const d=(y.qid&&def(y.qid))||pickQuest();Q.seen[d.id]=1;A.guide.qseen()[d.id]=1;A.guide.save();Q.types[d.type]=(Q.types[d.type]||0)+1;
  const qs={d,y,no:++qno,ch:d.ch||chPick(),st:'pick',wrong:new Set(),chain:[...(y.chain||['门外']),'你'],flow:{test:0,ci:0,review:0},pp:{},tried:new Set()};
  if(d.opts)qs.opts=shuffle(d.opts.map((o,i)=>({t:o[0],right:!!o[1],why:o[2],pose:o[3],i})));
  if(d.type==='route')qs.cards=shuffle([d.ans,...shuffle([1,2,3,4,5,6].filter(p=>p!==d.ans)).slice(0,2)]);
  y.qs=qs;y.note=d.q;return qs}

/* ---------- 对话框的内容 ---------- */
const TASK={quiz:'你替猫回答：该怎么做？',guard:'这颗球有点危险。你会怎么回？',tool:'挑一样合适的本事：',care:'人类有点累了。你想怎么陪它？',chat:'人类只是想聊两句。你替猫回一句：',
  route:'这颗球该交给谁？@ 一只最合适的猫，它会自己跑过来接球。',
  memory:'答案在二楼的图书馆里（走楼梯间的楼梯，或者爬巨树上去）。五架书：决策日志、教训沉淀、证据库、人物关系、事件记忆——翻对的那一架。不知道在哪一架？先拉开检索柜查一查。',
  coop:'这颗球太大，一只猫解不开。',flow:'按猫咖的规矩走一遍：'};
const card=pal=>{const k=CAT_CARDS[pal];return{pal,t:`${k.name} · ${k.breed}`,sub:`${k.cli} · ${k.at} · 擅长：${k.good}`}};
const flowSteps=q=>[['写测试','去二楼工坊，跳上桌踩键盘',q.flow.test],['跑 CI','按一下 CI，等它变绿',q.flow.ci],['Review','请一只别的猫看一眼（Q 传给它）',q.flow.review],['合并','去合并门禁，拉一下闸',q.st==='solving'||q.st==='done']];
const flowAt=()=>{const q=Q.cur;return q&&q.d.type==='flow'&&q.st==='flow'?(!q.flow.test?'test':!q.flow.ci?'ci':!q.flow.review?'review':'merge'):null};
function spec(q){const d=q.d,b=[],acts=[];let tip=tipOf(d.tip);const kn=A.kindOne(q.y),result=`织成了${kn}。叼去橱窗长廊，挂到夹子上。`;
  if(q.st==='pick'){
    if(d.opts){b.push({k:'task',t:TASK[d.type]},{k:'choices',items:q.opts.map((o,i)=>({t:o.t,state:q.wrong.has(i)?'wrong':'',why:q.wrong.has(i)?o.why:''}))})}
    else if(d.type==='route'){b.push({k:'task',t:TASK.route});if(q.decline){const k=CAT_CARDS[q.decline];b.push({k:'say',pal:q.decline,name:k.name,t:CAT_DECLINE[q.decline]})}
      b.push({k:'choices',items:q.cards.map((p,i)=>({...card(p),state:q.wrong.has(i)?'wrong':''}))});tip=tipOf('profile')}
    else if(d.type==='memory'){b.push({k:'task',t:TASK.memory});acts.push({id:'go',t:'去图书馆',key:'E'})}
    else if(d.type==='coop'){b.push({k:'task',t:`${TASK.coop}要 ${d.roles.length} 只猫一起：你，再加 ${d.roles.length-1} 只。喊一声，附近的猫会过来帮忙。`},{k:'steps',items:d.roles.map((r,i)=>({t:r,sub:i?'等一只猫来':'你',done:i===0}))});acts.push({id:'call',t:'喊帮手（来帮忙！）',key:'E'})}
    else if(d.type==='flow'){b.push({k:'task',t:TASK.flow},{k:'steps',items:flowSteps(q).map(([t,sub,done])=>({t,sub,done:!!done}))});acts.push({id:'go',t:'去工坊',key:'E'})}
    acts.push({id:'later',t:'先叼着',key:'Esc'})}
  else if(q.st==='npc'){const c=q.npc,k=CAT_CARDS[c.pal];
    b.push({k:'say',pal:c.pal,name:k.name,t:q.npcState==='coming'?'收到！马上过来。':q.npcState==='working'?'我看看……':d.done});
    b.push({k:'text',t:q.npcState==='coming'?`${k.name}正从${k.home}赶过来（小地图上闪的那个点）。原地等，或者迎上去都行。`:`${k.name}接住了球，正在处理。`});tip=tipOf('at');acts.push({id:'ok',t:'好的',key:'E'})}
  else if(q.st==='go'){b.push({k:'task',t:TASK.memory});if(q.hint)b.push({k:'text',t:`检索卡上写着：这件事在「${SHELF_NAMES[d.shelf]}」那一架（左数第 ${d.shelf+1} 架）。`});
    if(q.tried.size)b.push({k:'text',t:'翻过了：'+[...q.tried].map(i=>'「'+SHELF_NAMES[i]+'」').join('')+'，都没有。'});acts.push({id:'ok',t:'好的',key:'E'})}
  else if(q.st==='coop'){const C=q.coop,hs=C.helpers;b.push({k:'task',t:hs.filter(h=>h.arrived).length>=d.roles.length-1?'都到齐了，一起扒拉！（别走开）':'喊到的猫正在赶过来……'});
    b.push({k:'steps',items:d.roles.map((r,i)=>{const h=i?hs[i-1]:me;return{t:r,sub:i===0?'你':h?(h.name+(h.arrived?'':' · 赶来中')):'等一只猫来',done:i===0||!!(h&&h.arrived)}})});
    b.push({k:'progress',p:C.p});acts.push({id:'later',t:'收起',key:'Esc'})}
  else if(q.st==='flow'){b.push({k:'task',t:TASK.flow},{k:'steps',items:flowSteps(q).map(([t,sub,done],i)=>({t,sub,done:!!done,cur:flowAt()===['test','ci','review','merge'][i]}))});
    if(flowAt()==='review')acts.push({id:'review',t:'请最近的猫 review',key:'E'});acts.push({id:'ok',t:'收起',key:'Esc'})}
  else if(q.st==='solving'){if(q.reply)b.push({k:'right',t:q.reply});b.push({k:'progress',p:Math.min(1,(now()-q.s0)/q.sdur),t:'正在解开……'})}
  else if(q.st==='done'){
    if(d.type==='route'&&q.npc)b.push({k:'say',pal:q.npc.pal,name:CAT_CARDS[q.npc.pal].name,t:d.done});
    else if(d.type==='memory')b.push({k:'book',t:d.found});
    else if(d.type==='coop'&&q.coop&&q.coop.helpers[0])b.push({k:'say',pal:q.coop.helpers[0].pal,name:q.coop.helpers[0].name,t:'几只猫一起，一下就解开了！'});
    else if(d.type==='flow')b.push({k:'steps',items:flowSteps(q).map(([t,sub])=>({t,sub,done:true}))});
    else if(q.reply)b.push({k:'right',t:q.reply});
    const nm=KNIT_NAMES[q.y.kind][0],made={k:'made',kind:q.y.kind,ci:q.y.ci};
    if(q.proxy){b.push({...made,t:`${q.npc.name}替你把${nm}挂进了橱窗`});acts.push({id:'ok',t:'好的',key:'E'})}
    else{b.push({...made,t:(d.type==='route'&&q.npc?`${q.npc.name}织好了${kn}，递还给你`:`织好了${kn}！`),next:'叼去一楼的橱窗长廊挂上，挂上才算交付'});
      if(me.hold===q.y)acts.push({id:'hang',t:'去橱窗挂上',key:'E'});acts.push({id:'ok',t:'收起',key:'Esc'})}}
  else if(q.st==='fused'){b.push({k:'text',t:`这颗球在你和${q.fuseWith}之间来回太多次了。猫猫咖啡馆正在给猫定这条规矩：遇到这种情况就自动叫停，把球升级给人来拍板——免得踢皮球。`},{k:'text',t:'球还在你嘴里。换一只猫，或者自己把它解开吧。'});tip=tipOf('pingpong');acts.push({id:'ok',t:'知道了',key:'E'})}
  return{kind:'quest',head:{icon:'yarn',ci:q.y.ci,title:'毛线球 #'+q.no,chips:['来自 '+q.ch,QTYPE[d.type]]},note:d.q,noteKey:'q'+q.no,blocks:b,tip,acts,st:q.st}}
function open(q){A.dlg.show(spec(q),{q,pick:i=>pick(q,i),act:id=>act(q,id)})}
const showing=q=>A.dlg.open&&A.dlg.spec&&A.dlg.spec.noteKey==='q'+q.no;
function refresh(q,force){if(showing(q))A.dlg.update(spec(q));else if(force&&!A.dlg.open)open(q)}
A.Q.open=()=>{if(Q.cur)open(Q.cur)};
// 联机：走流程的 Review 那一步请真人的猫看一眼（world-online.js），它看完球回来了
A.Q.flowAt=()=>flowAt();
A.Q.reviewDone=(q,name)=>{if(!q||q.d.type!=='flow')return;q.flow.review=1;q.chain.push(name,'你');say(`${name} review 过了 ✓ 最后一步：去合并门禁`);refresh(q)};

/* ---------- 在对话框里选 ---------- */
function pick(q,i){const d=q.d;if(q.st!=='pick'||q.wrong.has(i))return;
  if(d.type==='route'){const pal=q.cards[i];if(pal==null)return;
    if(pal!==d.ans){q.wrong.add(i);q.decline=pal;const c=npc(pal);if(c&&near(c,me,320)){emote(c,'q',1.4);speak(c,CAT_DECLINE[pal],2.6)}refresh(q);return}
    return callNpc(q,npc(pal))}
  const o=q.opts&&q.opts[i];if(!o)return;
  if(!o.right){q.wrong.add(i);if(d.type==='guard'){emote(me,'anger',1.4);sfx('alarm');say('铁律！'+o.why)}refresh(q);return}
  q.reply=o.why;
  if(d.type==='care'){const k=['slowBlink','knead','meow'][o.i];return solve(q,[{k,dur:k==='slowBlink'?DUR.slowBlink:1.8,ex:k==='knead'?'content':undefined}])}
  if(d.type==='chat'){const k=o.pose||rnd(['meow','happy']);if(o.pose==='alert')speak(me,'我查一下',1.6);return solve(q,[{k,dur:DUR[k]||1.6,ex:k==='knead'||k==='lie'?'content':undefined}])}
  if(d.type==='guard'){speak(me,'@owner 这件事要你拍板',2.6);return solve(q,[{k:'alert',dur:.8}])}
  solve(q)}
function act(q,id){
  if(id==='go'){q.st=q.d.type==='memory'?'go':'flow';A.dlg.close();const t=Q.target();if(t)A.run(me,[{go:{x:t.x,y:t.y}}]);return true}
  if(id==='call'){startCoop(q);return true}
  // 织好了：猫自己走去最近的那扇橱窗，挂上
  if(id==='hang'){A.dlg.close();if(me.hold!==q.y)return true;const w=[0,1].map(i=>A.TID('win'+i)).sort((a,b)=>dist(a.at(me),me)-dist(b.at(me),me))[0];A.run(me,[{go:w.at(me)},{fn:()=>A.act(me,w)}]);return true}
  if(id==='review'){const o=S.cats.filter(c=>!c.me&&!c.gone&&!c.hidden&&!c.leaving&&!c.riding&&!c.place&&!c.hold&&(c.z==null||c.kind==='npc'&&c.atHome)&&near(c,me,170)).sort((a,b)=>dist(a,me)-dist(b,me))[0];
    if(!o){say('附近没有猫。去找一只吧——砚砚在二楼工坊的机柜顶上');return true}A.pass(me,o);return true}
  return false}
// 自己解：扑一下 → 随机一种玩法 → 织好
function solve(q,pre=[]){const easy=q.y.easy;q.st='solving';q.s0=now();q.sdur=pre.reduce((s,x)=>s+(x.dur||0),0)+(easy?0:DUR.pounce)+(easy?1.2:1.8);
  A.run(me,[...pre,...(easy?[]:[{k:'pounce',dur:DUR.pounce}]),{k:rnd(PLAYS),dur:easy?1.2:1.8,yarn:true},{fn:()=>knitDone(q)},{k:'happy',dur:1.1,soft:1}]);refresh(q,true)}
function knitDone(q){me.yarn=null;const y=q.y;if(me.hold!==y)return;y.knit=true;S.puffs.push({x:me.x,y:me.y-10,t0:now()});showMade(y);sfx('knit');q.st='done';Q.solved++;A.emit('solve',q);refresh(q,true)}

/* ---------- 派单：@ 一只店猫，它自己跑过来 ---------- */
function callNpc(q,c){if(!c)return solve(q);q.st='npc';q.npc=c;q.npcState='coming';const h=A.HOMES[c.pal];if(c.hold&&!c.hold.qs){S.baskets[0].push(c.hold);c.hold=null}
  A.run(c,[...(c.atHome&&h?[{jump:{...h.floor}},{fn:o=>{o.atHome=false;o.z=undefined}}]:[]),{chase:()=>({x:me.x+(c.x<me.x?-16:16),y:me.z!=null?me.z+6:me.y+2}),near:22,sp:70},{fn:()=>npcArrive(q)}]);
  c.working=true;c.doing='被你 @ 过来帮忙';emote(c,'bang',1.2);speak(c,'收到！',2);news(`你 @ 了${c.name}`);sfx('toss');refresh(q)}
function npcArrive(q){const c=q.npc,y=q.y;if(me.hold!==y){c.working=false;c.doing=null;return}me.hold=null;q.npcState='working';q.chain.push(c.name);
  if(me.place)A.leavePlace(me);A.faceTo(c,me);
  A.throwTo(me,c,y,()=>{c.hold=y;A.run(c,[{k:'alert',dur:.5},{k:'sit',dur:1.2,ex:'focus',fn:c=>speak(c,rnd(['我看看','嗯……','交给我']),1.6)},{k:rnd(PLAYS),dur:2.2,yarn:true},
    {fn:c=>{c.yarn=null;y.knit=true;S.puffs.push({x:c.x,y:c.y-10,t0:now()});speak(c,q.d.done,3.6);q.npcState='done'}},{k:'happy',dur:.8},{fn:c=>npcReturn(q)}])});refresh(q)}
function npcReturn(q){const c=q.npc,y=q.y,home=c=>A.HOMES[c.pal]?A.goHome(c):[];const back=()=>{c.working=false;c.doing=null;A.run(c,[{k:'sit',dur:.8,ex:'content'},...home(c)])};
  const proxy=()=>{q.proxy=true;c.hold=y;A.run(c,[...A.deliverSteps(c),{fn:c=>{c.working=false;c.doing=null}},...home(c)]);q.st='done';Q.solved++;A.emit('solve',q);refresh(q,true)};
  if(me.hold||me.hidden||me.gone)return proxy();c.hold=null;
  A.throwTo(c,me,y,()=>{if(me.hold){c.hold=y;return proxy()}me.hold=y;showMade(y);q.chain.push('你');q.st='done';Q.solved++;A.emit('solve',q);sfx('knit');refresh(q,true)});back()}

/* ---------- 几只猫一起：喊帮手，围在你身边一起扒拉 ---------- */
const OFF=[[-18,2],[18,2],[0,12],[-14,-8]];
function startCoop(q){q.st='coop';q.coop={p:0,helpers:[],recall:now()+14};speak(me,'来帮忙！',3);sfx('meow');recruit(q);refresh(q)}
function recruit(q){const C=q.coop;C.helpers=C.helpers.filter(h=>!h.gone&&h.coopQ===q);const need=q.d.roles.length-1-C.helpers.length;if(need<=0)return;
  const free=c=>!c.me&&!c.gone&&!c.hidden&&!c.working&&!c.leaving&&!c.riding&&c.z==null&&!c.place&&!c.hold;
  let cands=S.cats.filter(c=>isBot(c)&&free(c)&&near(c,me,700)).sort((a,b)=>dist(a,me)-dist(b,me)).slice(0,need);
  if(cands.length<need)cands.push(...S.cats.filter(c=>c.kind==='npc'&&!c.atHome&&free(c)).slice(0,need-cands.length));
  cands.forEach(c=>{const slot=C.helpers.length,role=q.d.roles[slot+1];C.helpers.push(c);c.coopQ=q;
    A.run(c,[{chase:()=>({x:me.x+OFF[slot][0],y:me.y+OFF[slot][1]}),near:5,sp:62},{fn:c=>{c.arrived=true;A.faceTo(c,me);c.yarn=q.y.ci;speak(c,`我来${role}！`,2.2)}},{k:rnd(['bat','swing','kick']),dur:90}]);
    c.working=true;c.doing='来帮你解毛线球';c.onLeave=c=>{c.arrived=false;c.yarn=null;c.working=false;c.doing=null;c.coopQ=null}})}
tick(dt=>{const q=Q.cur;if(!q||q.st!=='coop')return;const C=q.coop,need=q.d.roles.length-1;C.helpers=C.helpers.filter(h=>!h.gone&&h.coopQ===q);
  const hs=C.helpers.filter(h=>h.arrived&&near(h,me,44)),ready=hs.length>=need&&me.hold===q.y&&!me.k.startsWith('walk')&&!A.busy();
  if(hs.length>=need&&me.hold===q.y&&!me.k.startsWith('walk')&&me.k!=='bat'&&!me.cur&&!me.q.length)A.run(me,[{k:'bat',dur:90,soft:1,yarn:true}]);
  if(hs.length>=need&&me.k==='bat'){C.p+=dt*.1;if(C.p>=1)coopDone(q)}
  if(now()>C.recall&&C.helpers.length<need){C.recall=now()+10;recruit(q)}});
function coopDone(q){const C=q.coop,y=q.y;C.helpers.forEach(c=>{c.onLeave=null;c.arrived=false;c.yarn=null;c.working=false;c.doing=null;c.coopQ=null;emote(c,'heart',1.6);A.run(c,[{k:'happy',dur:1.2},{k:'sit',dur:.4}]);q.chain.push(c.name)});
  A.run(me,[{fn:()=>{me.yarn=null}},{k:'happy',dur:1.1,soft:1}]);y.knit=true;S.puffs.push({x:me.x,y:me.y-10,t0:now()});showMade(y);sfx('fanfare');
  news(`你和${C.helpers.map(c=>c.name).join('、')}一起解开了一颗大毛线球`);q.st='done';Q.solved++;A.emit('solve',q);refresh(q,true)}

/* ---------- 查记忆：图书馆 ---------- */
const memQ=()=>{const q=Q.cur;return q&&q.d.type==='memory'&&(q.st==='go'||q.st==='pick')&&me.hold===q.y?q:null};
A.Q.shelfLabel=(c,i)=>c.me&&memQ()?`翻「${SHELF_NAMES[i]}」找答案`:null;
A.Q.catalogLabel=c=>c.me&&memQ()?'查检索卡（答案在哪一架）':null;
A.Q.onShelf=(c,i)=>{const q=memQ();if(!q)return false;q.st='go';
  if(i===q.d.shelf){q.chain.push('图书馆');q.reply=null;say('找到了！');solve(q);return true}
  q.tried.add(i);say(`这一架是「${SHELF_NAMES[i]}」，没有要找的那一页。${q.hint?'':'拉开检索柜查一查？'}`);return true};
A.Q.onCatalog=c=>{const q=memQ();if(!q)return false;q.st='go';q.hint=true;open(q);return true};

/* ---------- 走流程：工坊里的几个临时"按钮"，只有你在对应那一步时才出现 ---------- */
T({id:'q_test',n:'写测试',hidden:c=>!(c.me&&flowAt()==='test'),hit:()=>null,near:[P.desk.x-4,P.desk.y+26,P.desk.w+8,24],at:()=>P.kbdFloor[1],label:'写测试（跳上桌踩键盘）',
  go(c){const i=[0,1,2].sort((a,b)=>Math.abs(P.kbdFloor[a].x-c.x)-Math.abs(P.kbdFloor[b].x-c.x))[0],k=P.kbds[i],q=Q.cur;
    run(c,[{go:P.kbdFloor[i]},{jump:{x:k.x+11,y:P.desk.y+10,z:P.desk.y+32.5}},{fn:c=>{c.face='R'}},{k:'knead',dur:2.4,ex:'focus'},
      {fn:()=>{if(Q.cur!==q)return;q.flow.test=1;say('测试写好了：先红，再绿 ✓ 下一步：跑 CI');refresh(q)}},{jump:{...P.kbdFloor[i]}},{fn:c=>{c.z=undefined}}])}});
const CIAT={x:P.ci.x+6,y:P.kbdFloor[0].y};
T({id:'q_ci',n:'跑 CI',hidden:c=>!(c.me&&flowAt()==='ci'),hit:()=>null,near:[P.desk.x-4,P.desk.y+26,P.desk.w+8,24],at:CIAT,label:'跑 CI（按一下，等它变绿）',
  go(c){const q=Q.cur;run(c,[{go:CIAT},{fn:c=>{c.face='R'}},{k:'maneki',dur:.6,fn:()=>{S.ci.state='run';S.ci.t=2.4;S.ci.p=0}},{k:'sit',dur:2.6,ex:'lookUp'},
    {fn:()=>{if(Q.cur!==q)return;q.flow.ci=1;say('CI 绿了 ✓ 下一步：请一只别的猫 review（靠近它按 Q）');refresh(q)}}])}});
A.Q.mergeLabel=c=>{const q=Q.cur;if(!c.me||!q||q.d.type!=='flow'||q.st!=='flow')return null;return flowAt()==='merge'?'过门禁，合并':'门禁（还差：'+['测试','CI','Review'].filter((n,i)=>!q.flow[['test','ci','review'][i]]).join('、')+'）'};
A.Q.onMerge=c=>{const q=Q.cur;if(!c.me||flowAt()!=='merge')return false;
  run(c,[{go:P.mergeAt},{fn:c=>{c.face='L'}},{k:'maneki',dur:.6,fn:()=>{S.mergeT=now()+3;sfx('goal')}},{k:'sit',dur:.9,ex:'happy'},{fn:()=>{q.chain.push('门禁');q.reply='合进主干了，main 还是绿的。';solve(q)}}]);return true};
tick(()=>{const q=Q.cur,f=q&&q.d.type==='flow'&&(q.st==='flow'||q.st==='solving')?q.flow:null;S.merge.lights=f?[f.test,f.ci,f.review]:[0,0,0];const o=S.mergeT>now()?1:0;S.merge.open+=(o-S.merge.open)*.15});
// review 的猫在看球的时候算"在忙"：别的事（大毛线团、CI 红了）不会把它叫走；15 秒还没还回来就兜底还给你
function review(q,o){const y=q.y;if(o.hold||o.hidden||o.gone){say(`${o.name}现在腾不出嘴，换一只猫吧`);return}me.hold=null;q.rev={o,t0:now()};A.throwTo(me,o,y,()=>{o.hold=y;const keep=o.place||o.working;o.working=true;o.doing='在帮你 review';
  A.run(o,[{k:'alert',dur:.4},{k:'sit',dur:1.8,ex:'focus',fn:o=>speak(o,o.pal===2?'边界条件漏了一个，已经补上。LGTM':rnd(['LGTM ✓','看过了，没问题','这里还能再简洁点……好吧，LGTM']),2.8)},
    {fn:o=>{o.hold=null;o.working=false;o.doing=null;A.throwTo(o,me,y,()=>{q.rev=null;if(me.hold){S.baskets[0].push(y);return}me.hold=y;q.flow.review=1;q.chain.push(o.name,'你');say(`${o.name} review 过了 ✓ 最后一步：去合并门禁`);refresh(q)})}}],!!keep)});
  say(`请${o.name}帮你 review`)}
tick(()=>{const q=Q.cur,r=q&&q.rev;if(!r||now()-r.t0<15)return;const o=r.o,y=q.y;q.rev=null;if(me.hold===y)return;
  if(o.hold===y){o.hold=null;o.working=false;o.doing=null;run(o,[{k:'sit',dur:.5}])}if(me.hold)return;me.hold=y;q.flow.review=1;q.chain.push(o.name,'你');say(`${o.name} review 过了 ✓ 最后一步：去合并门禁`);refresh(q)});

/* ---------- 传球：派单、Review、乒乓球熔断；附近没猫时的"虚空传球" ---------- */
const pass0=A.pass;
A.pass=(c,o)=>{const y=c.hold;if(c.me&&y&&y.qs&&!y.knit&&questPass(y.qs,o))return;pass0(c,o)};
function questPass(q,o){const d=q.d;q.pp[o.id]=(q.pp[o.id]||0)+1;
  if(q.pp[o.id]>=3){q.pp[o.id]=0;q.st2=q.st;q.st='fused';q.fuseWith=o.name;emote(o,'q',1.4);sfx('alarm');news('乒乓球熔断：同一颗球来回传太多次，自动叫停');open(q);return true}
  if(q.pp[o.id]===2)say(`这颗球第二次传给${o.name}了。再来回传，就要"乒乓球熔断"了`);
  if(d.type==='route'&&(q.st==='pick'||q.st==='npc')&&o.kind==='npc'){
    if(o.pal===d.ans){if(q.st!=='npc'){q.st='npc';q.npc=o;q.npcState='coming';o.working=true;o.doing='被你 @ 过来帮忙'}npcArrive(q);return true}
    emote(o,'q',1.4);speak(o,CAT_DECLINE[o.pal],2.6);q.decline=o.pal;say(`${o.name}摇摇头：「${CAT_DECLINE[o.pal]}」`);return true}
  if(d.type==='flow'&&flowAt()==='review'){review(q,o);return true}
  q.abandoned=true;say(`你把便签也一起交给了${o.name}`);if(Q.cur===q)Q.cur=null;return false}
// 叼着有任务的球时，直接点一只猫不再自动传球（跟着箭头点过去时很容易误点到路过的猫）：
// 派单时点对的店猫、Review 那一步点别的猫，照样传；其他情况改成蹭蹭，并提示按 Q 或右键传球
const social0=A.social;
A.social=(c,o,kind='auto')=>{const y=c.hold,q=y&&y.qs;if(c.me&&kind==='auto'&&q&&!y.knit&&!q.abandoned&&o){
    const ok=q.d.type==='route'&&o.kind==='npc'&&o.pal===q.d.ans||flowAt()==='review';
    if(!ok){social0(c,o,'rub');say(`想把这颗球传给${o.name}，按 Q 或者右键点它 → 传球`);return}}
  return social0(c,o,kind)};
A.voidPass=()=>say('虚空传球检测：附近没有能接球的猫，球还在你嘴里');
A.ballPrompt=()=>'打开便签';
const solve0=A.solveHere;
A.solveHere=c=>{if(!c.me)return solve0(c);const y=c.hold;if(!y||y.knit)return;if(!y.qs)assign(y);Q.cur=y.qs;if(Q.cur.st==='fused')Q.cur.st=Q.cur.st2||'pick';open(Q.cur)};
A.onTake=()=>{};   // 叼起来的那一刻不弹 toast，下一帧直接展开便签

/* ---------- 叼到新球就展开便签；对话框里会动的内容（帮手、进度条）定时刷新 ---------- */
let rf=0;
tick(dt=>{const y=me.hold;
  if(y&&!y.knit){if(!y.qs){assign(y);Q.cur=y.qs;A.emit('take',y.qs);after(.35,()=>{if(me.hold===y)open(y.qs)})}else if(Q.cur!==y.qs){Q.cur=y.qs;y.qs.abandoned=false}}
  if(Q.cur&&Q.cur.abandoned)Q.cur=null;
  if((rf-=dt)<=0){rf=.2;const q=Q.cur;if(q&&showing(q)&&(q.st==='coop'||q.st==='solving'||q.st==='npc'))A.dlg.update(spec(q))}});

/* ---------- 织好了却半天没去挂：附近醒着的店猫提醒一句，一件东西只说一次（附近没有店猫，一分钟后自己冒一句）---------- */
let knitT=0;
tick(dt=>{const q=Q.cur,y=me.hold;if(!q||q.st!=='done'||q.proxy||y!==q.y||!y.knit||q.nudged){knitT=0;return}if(me.place||A.dlg.open||A.vista&&A.vista.on||A.busy())return;
  const W=P.wins;if(A.floorOf(me.y)===A.floorOf(P.hangY)&&me.y<P.hangY+90&&me.x>W[0].x-60&&me.x<W[1].x+W[1].w+60){knitT=0;return}   // 已经在橱窗跟前了
  if((knitT+=dt)<30)return;const o=S.cats.filter(c=>c.kind==='npc'&&!c.hidden&&!c.working&&!c.hold&&A.idle(c)&&c.k!=='sleep'&&near(c,me,180)).sort((a,b)=>dist(a,me)-dist(b,me))[0];
  if(o){q.nudged=1;if(o.z==null)A.faceTo(o,me);emote(o,'q',1.2);speak(o,'织好的要挂进橱窗，才算交付哦',4.5)}else if(knitT>60){q.nudged=1;say(`嘴里的${KNIT_NAMES[y.kind][0]}还没交付：挂进一楼的橱窗才算`)}});

/* ---------- 挂进橱窗、人类取走 ---------- */
A.onHang=(c,item)=>{const q=item.y&&item.y.qs;if(!q||q.abandoned)return;if(!c.me&&!q.proxy)return;q.st='hung';q.hungT=now();q.chain.push('橱窗');S.stamps.ball=1;A.ui.stamps&&A.ui.stamps(S.stamps);A.emit('hang',q);if(Q.cur===q)Q.cur=null;Q.last=q;
  if(c.me)say('挂进橱窗了，交付！等人类来取，会收到回信')};
A.onTaken=it=>{const q=it.y&&it.y.qs;if(!q||q.abandoned||q.st!=='hung')return false;q.chain.push('人类');if(Q.last===q)Q.last=null;
  A.ui.reply&&A.ui.reply({no:q.no,q:q.d.q,thx:q.d.thx,chain:q.chain,item:A.kindOne(it),tip:tipOf('ball')});return true};

/* ---------- 织好的那一刻：成品在"你"头顶放大亮一下，再落回嘴里 ---------- */
let made=null;function showMade(y){made={kind:y.kind,ci:y.ci,t0:now()}}
A.overs.push(()=>{if(!made)return;const k=now()-made.t0;if(k>2||me.hidden){made=null;return}
  const up=Math.min(1,k/.25),fade=k>1.5?1-(k-1.5)/.5:1,x=Math.round(me.x),y=Math.round((me.top??me.y-22)-12-up*3),h=KNIT[made.kind].length;
  alpha(fade,()=>{C.save();C.translate(x,y);C.scale(2,2);knit(made.kind,0,-h,made.ci);C.restore();
    for(let i=0;i<4;i++){const a=now()*3+i*Math.PI/2;P1(Math.round(x+Math.cos(a)*15),Math.round(y-h+Math.sin(a)*10),'#ffd84a')}})});

/* ---------- 给页面：任务条、要去的地方 ---------- */
// stage：一颗球的一生走到哪一段（0 解开 · 1 挂进橱窗 · 2 回信）；line：这一段做什么；steps：走流程时的四小步；open：嘴里叼着没解的球（E 打开便签）
// 嘴里没有任务时，刚挂上的那颗还留在任务条上（第三段），回信来了、或者一分半还没人来取，再收起来
Q.tracker=()=>{if(Q.last&&(Q.cur||now()-Q.last.hungT>90))Q.last=null;const q=Q.cur||Q.last;if(!q)return null;const d=q.d,C=q.coop,nm=KNIT_NAMES[q.y.kind][0];let line='',steps=null,stage=0,ok=false;
  switch(q.st){case 'pick':line=d.type==='memory'?'去二楼图书馆找答案':d.type==='flow'?'按流程走一遍：先去二楼工坊':d.type==='coop'?'喊帮手来一起解':d.type==='route'?'挑一只店猫，@ 它':d.type==='chat'?'打开便签，回一句':'打开便签，选一个';break;
    case 'npc':line=q.npcState==='coming'?`${q.npc.name}正在赶过来`:`${q.npc.name}正在处理`;break;
    case 'go':line=q.hint?`去「${SHELF_NAMES[d.shelf]}」那一架`:'去图书馆：先查检索柜，或者直接翻书';break;
    case 'coop':line=`帮手 ${C.helpers.filter(h=>h.arrived).length}/${d.roles.length-1} · ${Math.round(C.p*100)}%`;break;
    case 'flow':steps=flowSteps(q).map(([t,,done],i)=>({t,done:!!done,cur:flowAt()===['test','ci','review','merge'][i]}));break;
    case 'solving':line='正在解开……';break;case 'fused':line='乒乓球熔断了，换一只猫或者自己解';break;
    case 'done':stage=1;line=q.proxy?`${q.npc.name}替你去挂了`:`叼着${nm}去一楼橱窗长廊挂上，挂上才算交付`;break;
    case 'hung':stage=2;ok=true;line='交付了，盖上「交付」章 · 人类取走时会回信';break}
  return{no:q.no,q:d.q,type:QTYPE[d.type],ci:q.y.ci,stage,line,ok,steps,open:me.hold===q.y&&!q.y.knit}};
Q.target=()=>{const q=Q.cur;if(!q)return null;const d=q.d;
  if(q.st==='npc'&&q.npc&&q.npcState==='coming')return{x:q.npc.x,y:q.npc.y,label:q.npc.name,cat:1};
  if(d.type==='memory'&&(q.st==='go'||q.st==='pick'))return q.hint?{x:P.shelves[d.shelf].x+23,y:P.shelves[0].y+76,label:SHELF_NAMES[d.shelf]}:{x:P.catalogAt.x,y:P.catalogAt.y,label:'检索柜'};
  if(q.st==='flow'){const s=flowAt();if(s==='test')return{...P.kbdFloor[1],label:'键盘'};if(s==='ci')return{...CIAT,label:'CI'};
    if(s==='review'){const c=npc(2);return c?{x:c.x,y:c.y,label:'砚砚',cat:1}:null}if(s==='merge')return{...P.mergeAt,label:'合并门禁'}}
  if(q.st==='done'&&me.hold===q.y&&q.y.knit){const W=P.wins,x=Math.max(W[0].x+10,Math.min(W[1].x+W[1].w-10,me.x));return{x,y:P.hangY,label:`把${KNIT_NAMES[q.y.kind][0]}挂进橱窗`}}
  return null};
});
