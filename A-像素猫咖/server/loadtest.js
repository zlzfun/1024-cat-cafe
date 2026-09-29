/* 1024 猫咖 · 联机压力测试：开 N 个假玩家连上来，在店里走来走去、停下来歇着、冒表情、说快捷短语、蹭蹭、传球、挂成品，统计收发和延迟。
   要 Node 22 以上（自带 WebSocket）。别对着正式的名册跑：它会登记 N 只叫"压测001"这样的猫。
     DATA_DIR=/tmp/cat-load PORT=1025 node server/server.js
     node server/loadtest.js http://127.0.0.1:1025 100 60          # 地址、几只猫、跑几秒
   带上 ADMIN_KEY=口令（或 DATA_DIR=同一个数据目录）就顺便读服务端自己的统计：CPU、内存、每 0.1 秒打包花了多久。
   延迟：所有假玩家在同一个进程里，谁发出一份位置、谁收到这份位置，时间差就是"一只猫动了，别人看到"的延迟（含服务端 0.1 秒的打包间隔）。
   一只停了很久的猫走进画面时补发的那份状态不算延迟，单独记成"补发"。 */
const fs=require('fs'),path=require('path');
const BASE=(process.argv[2]||'http://127.0.0.1:1025').replace(/\/$/,''),N=+process.argv[3]||100,SEC=+process.argv[4]||60;
const KEY=process.env.ADMIN_KEY||(()=>{try{return fs.readFileSync(path.join(process.env.DATA_DIR||'',"admin.key"),'utf8').trim()}catch(e){return ''}})();
if(typeof WebSocket==='undefined'){console.log('要 Node 22 以上');process.exit(1)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),rnd=a=>a[Math.floor(Math.random()*a.length)],rr=(a,b)=>a+Math.random()*(b-a);
const post=async(p,b,h={})=>{const r=await fetch(BASE+p,{method:'POST',headers:{'Content-Type':'application/json',...h},body:JSON.stringify(b)});return{status:r.status,...await r.json().catch(()=>({}))}};
// 店里几块大空地（前厅、橱窗长廊、中庭、工坊、后院、图书馆、花园小径），假玩家在这些点之间走
const SPOTS=[[150,150],[300,170],[470,150],[560,210],[760,300],[900,470],[820,500],[980,420],[1100,150],[1250,200],[1120,400],[1280,450],[1450,160],[1560,200],[1450,420],[1600,380],[200,420],[480,420]];
const KINDS=['scarf','hat','mitten','sock','sweater','flag'],POSES=['sit','lick','lie','sleep','knead','meow'];
const lat=[],cnt={in:0,bytes:0,sent:0,catch:0},sentAt=new Map(),cats=[],idOf=new Map();   // idOf：连接短编号 → 猫的 id
function bot(i,token,id){const c={i,id,ws:null,x:rr(100,1600),y:rr(100,500),tx:0,ty:0,k:'sit',f:0,hold:0,rest:rr(0,4),last:'',emoT:rr(5,40),phT:rr(10,60),passT:rr(20,90),hangT:rr(30,120),seen:new Map()};
  const tgt=()=>{const s=rnd(SPOTS);c.tx=s[0]+rr(-40,40);c.ty=Math.max(60,Math.min(520,s[1]+rr(-30,30)))};tgt();
  c.send=o=>{if(c.ws&&c.ws.readyState===1){c.ws.send(JSON.stringify(o));cnt.sent++}};
  c.open=()=>new Promise(r=>{const ws=new WebSocket(BASE.replace(/^http/,'ws')+'/ws');c.ws=ws;ws.onopen=()=>ws.send(JSON.stringify({t:'hi',token}));
    ws.onmessage=e=>{cnt.in++;cnt.bytes+=e.data.length;const m=JSON.parse(e.data);if(m.t==='welcome'){r();c.send({t:'v',v:rnd([[480,287],[480,287],[640,360],[720,430]])})}
      const add=o=>{idOf.set(o.n,o.id);c.seen.set(o.id,o.s)};if(m.t==='welcome')m.cats.forEach(add);if(m.t!=='b')return;(m.j||[]).forEach(add);
      for(const [n,s] of m.u||[]){const id=idOf.get(n),t=sentAt.get(id+':'+s[0]+','+s[1]);if(t){const d=Date.now()-t;if(d<2000)lat.push(d);else cnt.catch++}c.seen.set(id,s)}
      for(const [n,x,y] of m.p||[]){const id=idOf.get(n),o=c.seen.get(id);if(o)c.seen.set(id,[x,y,...o.slice(2)])}};ws.onclose=()=>{c.ws=null}});
  // 每 0.15 秒：走一步或者歇着；变了才发（和浏览器一样）
  c.step=dt=>{if(c.rest>0){c.rest-=dt;if(c.k.startsWith('walk'))c.k=rnd(POSES)}else{const dx=c.tx-c.x,dy=c.ty-c.y,d=Math.hypot(dx,dy),sp=40*dt;
      if(d<sp){c.x=c.tx;c.y=c.ty;c.rest=rr(2,12);tgt()}else{c.x+=dx/d*sp;c.y+=dy/d*sp;c.f=dx<0?1:0;c.k=dx<0?'walkL':'walkR'}}
    const s=[Math.round(c.x),Math.round(c.y),null,0,c.k,c.f,'',c.hold,0],j=JSON.stringify(s);if(j!==c.last){c.last=j;sentAt.set(c.id+':'+s[0]+','+s[1],Date.now());c.send({t:'s',s})}
    if((c.emoT-=dt)<=0){c.emoT=rr(15,40);c.send({t:'emo',i:Math.floor(Math.random()*6)})}
    if((c.phT-=dt)<=0){c.phT=rr(30,70);c.send({t:'ph',i:Math.floor(Math.random()*8)})}
    const near=[...c.seen].filter(([id,s])=>Math.hypot(s[0]-c.x,s[1]-c.y)<50);
    if((c.passT-=dt)<=0&&near.length){c.passT=rr(40,90);const [to]=rnd(near);if(Math.random()<.5)c.send({t:'rub',to});else c.send({t:'pass',to,p:Math.floor(Math.random()*1e6),ball:{ci:Math.floor(Math.random()*5),kind:rnd(KINDS),qid:'q-at'}})}
    if((c.hangT-=dt)<=0){c.hangT=rr(60,150);c.send({t:'hang',kind:rnd(KINDS),ci:Math.floor(Math.random()*5)})}};
  return c}
(async()=>{console.log(`压力测试：${BASE}，${N} 只猫，${SEC} 秒`);
  for(let i=0;i<N;i++){const name='压测'+String(i+1).padStart(3,'0');let r=await post('/api/cats',{name,code:[0,0,0,0],look:{coat:i%9,collar:i%6,face:'normal'}});
    if(r.status===409)r=await post('/api/login',{name,code:[0,0,0,0]});if(!r.token){console.log('登记失败',name,JSON.stringify(r));process.exit(1)}cats.push(bot(i,r.token,r.cat.id))}
  console.log('登记好了，开始连');for(const c of cats){await c.open();await sleep(20)}console.log('全部连上');
  const tick=setInterval(()=>cats.forEach(c=>c.step(.15)),150);
  const t0=Date.now();let last={in:0,bytes:0,sent:0},lt=Date.now();
  while(Date.now()-t0<SEC*1000){await sleep(5000);const now=Date.now(),s=(now-lt)/1000;lt=now;
    const L=lat.splice(0).sort((a,b)=>a-b),q=p=>L.length?L[Math.min(L.length-1,Math.floor(L.length*p))]:0;
    let sv='';if(KEY){try{const j=await (await fetch(BASE+'/api/admin/stats',{headers:{'X-Admin-Key':KEY}})).json(),l=j.live;sv=` · 服务端 CPU ${l.cpu}% 内存 ${l.rssMB}MB 打包 ${l.tickMs}ms 出 ${l.kbOutPerSec}KB/s`}catch(e){}}
    console.log(`${Math.round((now-t0)/1000)}s 在线 ${cats.filter(c=>c.ws).length} · 每只猫每秒 发 ${((cnt.sent-last.sent)/s/N).toFixed(1)} 条 收 ${((cnt.in-last.in)/s/N).toFixed(1)} 条 ${((cnt.bytes-last.bytes)/s/N/1024).toFixed(1)}KB · 延迟 中位 ${q(.5)}ms 95% ${q(.95)}ms 99% ${q(.99)}ms · 补发 ${cnt.catch-last.catch} 份${sv}`);
    last={...cnt}}
  clearInterval(tick);cats.forEach(c=>c.ws&&c.ws.close());await sleep(300);process.exit(0)})();
