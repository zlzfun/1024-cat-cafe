/* v1 已冻结，只给 scene-v1.html 用。三、试玩：在 M1 里操控猫，把可交互元素走一遍。依赖 cat-sprites.js（v2）、scene-kit.js、scene-maps.js，TOD 取自页面。 */
(()=>{
const pc=document.getElementById('pc'),SC=3;pc.width=M1.w;pc.height=M1.h;pc.style.width=M1.w*SC+'px';pc.style.height=M1.h*SC+'px';
const play=document.querySelector('.play'),promptEl=document.getElementById('prompt'),toastEl=document.getElementById('toast');
const S=M1_STATE();S.box=0;S.guests[1].st=null;S.guests.forEach((g,i)=>g.timer=i?5:0);
// 固定位置的猫按 pool 轮换待机动作；烁烁（npc）会闲逛
S.cats=[{k:'sleep',b:1,x:280,y:151,z:162.5,name:'宪宪',pool:['sleep','knead','lie'],wait:9},{k:'lie',b:2,x:299,y:58,z:116.5,o:.4,name:'砚砚',pool:['lie','sleep','lick'],wait:11},
        {k:'lick',b:6,x:40,y:60,z:80.5,name:'金哥',pool:['lick','lie','sleep','sit'],wait:7},{k:'sit',b:3,x:200,y:160,npc:1,wait:2,name:'烁烁'}];
const me={k:'sit',b:0,x:160,y:150,me:1,hold:null,face:'R'};S.cats.push(me);window.__play={S,me};   // 便于调试

const keys={};
play.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){keys[e.key]=true;e.preventDefault()}if(e.key===' '){e.preventDefault();if(!e.repeat)act()}});
play.addEventListener('keyup',e=>keys[e.key]=false);play.addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
let toastT=0;const toast=s=>{toastEl.textContent=s;toastEl.style.opacity=1;toastT=2.6};
let timers=[],now=0;const after=(s,f)=>timers.push({s,f});
const rnd=a=>a[Math.floor(Math.random()*a.length)];
// 按性格权重挑一个待机动作（只在 allow 里挑）
function pickIdle(b,allow){const w=PERSONA[b].idle,list=allow.map(k=>[k,w[k]??1]),sum=list.reduce((s,x)=>s+x[1],0);let r=Math.random()*sum;for(const [k,v] of list){if((r-=v)<=0)return k}return list[0][0]}
function emote(c,kind,sec){c.emote=kind;c.emoteUntil=now+sec}

// 家具占地（猫的脚底不能进入）
const BLOCK=[[4,50,78,32],[112,111,32,8],[184,111,32,8],[238,146,58,18],[284,108,32,10],[18,152,30,16],[300,154,10,8],[270,50,14,10],[2,176,14,10]];
const free=(x,y)=>x>=6&&x<=314&&y>=56&&y<=188&&!BLOCK.some(([bx,by,bw,bh])=>x>bx-4&&x<bx+bw+4&&y>by&&y<by+bh);

// 动作序列：[{k:姿态, dur:秒, fn:回调}]
let seq=null;
function run(steps){seq={steps,i:-1,t:0};step()}
function step(){seq.i++;const s=seq.steps[seq.i];if(!s){seq=null;me.k=me.hold!=null?'hold':'sit';return}if(s.fn)s.fn();if(s.k)me.k=s.k;seq.t=s.dur||0;if(!s.dur)step()}
// 解球：伏低扭屁股扑过去 → 随机一种玩法 → 开心
function solve(done){me.hold=null;run([{k:'pounce',dur:DUR.pounce},{k:rnd(PLAYS),dur:3.2},{fn:()=>{S.count++;done()}},{k:'happy',dur:1.4}])}
function perch(x,y,z,k,msg){me.place={x:me.x,y:me.y};me.x=x;me.y=y;me.z=z;me.k=k;if(msg)toast(msg)}
// 让一只固定位置的猫临时做个动作，结束后回到原来的动作
function borrow(c,k,sec,then){if(c.lock)return;const prev=c.k;c.lock=true;c.k=k;after(sec,()=>{c.k=then||prev;c.lock=false})}

function guest(i){const g=S.guests[i];
  if(g.st==='yarn'){g.st='dots';solve(()=>{g.st='heart';g.timer=3;toast('解开了！客人很满意，今日 +1')});return}
  if(i===0){S.cup=1;run([{k:'lick',dur:.8}]);after(.8,()=>{S.cup=2;g.st='bang';g.timer=2;toast('哐当！')});after(9,()=>S.cup=0);return}
  me.hidden=true;S.laptop=1;g.st='bang';g.timer=3.2;toast('咚咚咚……屏幕上多了一行 1024');
  after(3.2,()=>{S.laptop=0;me.hidden=false;me.x=200;me.y=128})}
function pass(){me.hold=null;S.mail=2;run([{k:'happy',dur:.8}]);after(.9,()=>S.mail=1);after(5,()=>S.mail=0);
  const y=S.cats.find(c=>c.name==='砚砚');toast('已 @砚砚');y.lock=true;
  after(1.2,()=>y.k='alert');after(2.6,()=>y.k='hold');after(5.2,()=>{y.k='happy';S.count++;toast('砚砚解开了你传的毛线球，今日 +1')});after(6.8,()=>{y.k='lie';y.lock=false})}

const SPOTS=[
  {x:66,y:88,ok:()=>S.basket>0&&me.hold==null,label:'叼一颗毛线球',go(){S.basket--;me.hold=(S.basket+2)%5;run([{k:'alert',dur:.7}]);toast('叼到了！就地按空格解开，或者去门口邮筒传给砚砚');after(12,()=>{if(S.basket<3)S.basket++})}},
  {x:20,y:88,label:'按一下咖啡机',go(){S.brew=1;after(2.5,()=>S.brew=0);run([{k:'happy',dur:.8}])}},
  {x:128,y:127,ok:()=>S.guests[0].st==='yarn'||S.cup===0,label:()=>S.guests[0].st==='yarn'?'接下客人的毛线球':'推一下咖啡杯',go(){guest(0)}},
  {x:200,y:127,ok:()=>S.guests[1].st==='yarn'||!S.laptop,label:()=>S.guests[1].st==='yarn'?'接下客人的毛线球':'踩一下键盘',go(){guest(1)}},
  {x:103,y:58,label:'按门铃',go(){S.bell=1;after(1.2,()=>S.bell=0);borrow(S.cats.find(c=>c.name==='金哥'),'maneki',2.6);
    if(S.basket<4){S.basket++;toast('叮铃～新客人投递了一颗毛线球，金哥在招手')}else toast('叮铃～毛线篮已经满了')}},
  {x:131,y:58,ok:()=>me.hold!=null,label:'@砚砚：把毛线球传给它',go:pass},
  {x:277,y:62,label:'蹭蹭盆栽',go(){S.plant=1;after(1,()=>S.plant=0);run([{k:'lick',dur:1}])}},
  {x:298,y:122,label:'跳上猫爬架',go(){perch(292,84,116.4,'lie','按方向键跳下来')}},
  {x:258,y:155,label:'跳上沙发睡觉',go(){perch(254,151,162.4,'sleep','按方向键醒来')}},
  {x:33,y:160,ok:()=>!S.box,label:'钻进纸箱',go(){S.box=1;S.boxCat=0;me.hidden=true;perch(me.x,me.y,undefined,'sit','藏好了，按方向键出来')}},
  {x:66,y:186,ok:()=>S.bowl,label:'吃饭',go(){run([{k:'lie',dur:1.8},{fn:()=>{S.bowl=0;after(15,()=>S.bowl=1)}},{k:'lick',dur:DUR.lick}])}},
  {x:240,y:58,label:'看看黑板',go(){toast(`今天已经解开 ${S.count} 颗毛线球`)}},
  {x:176,y:74,label:'晒太阳',go(){perch(176,74,74,'lie','暖和……按方向键起来')}},
];
const lab=s=>typeof s.label==='function'?s.label():s.label;
function nearest(){let best=null,bd=18;SPOTS.forEach(s=>{if(s.ok&&!s.ok())return;const d=Math.hypot(s.x-me.x,s.y-me.y);if(d<bd){bd=d;best=s}});return best}
function act(){if(seq||me.place||me.hidden)return;const s=nearest();if(s)return s.go();if(me.hold!=null)solve(()=>toast('就地解开了！今日 +1'))}

const npc=S.cats.find(c=>c.npc);
function walk(c,dx,dy,sp,dt){const l=Math.hypot(dx,dy);if(!l)return false;const nx=c.x+dx/l*sp*dt,ny=c.y+dy/l*sp*dt;let moved=false;
  if(free(nx,c.y)){c.x=nx;moved=true}if(free(c.x,ny)){c.y=ny;moved=true}if(Math.abs(dx)>.2)c.face=dx>0?'R':'L';c.k=c.face==='L'?'walkL':'walkR';return moved}

window.playTick=(t,dt)=>{now=t;
  timers.forEach(q=>q.s-=dt);const due=timers.filter(q=>q.s<=0);timers=timers.filter(q=>q.s>0);due.forEach(q=>q.f());
  S.guests.forEach(g=>{if(g.timer>0){g.timer-=dt;if(g.timer<=0){if(g.st==='heart'||g.st==='bang'){g.st=null;g.timer=6+Math.random()*6}else if(!g.st)g.st='yarn'}}});
  if(seq){seq.t-=dt;if(seq.t<=0)step()}
  const dx=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0),dy=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0);
  if(!seq&&(dx||dy)&&!S.laptop){if(me.place){const woke=me.k==='sleep';me.x=me.place.x;me.y=me.place.y;me.z=undefined;me.place=null;if(S.box){S.box=0;me.hidden=false}
      if(woke){if(dx)me.face=dx>0?'R':'L';run([{k:'stretch',dur:DUR.stretch}])}}      // 睡醒先伸个懒腰
    if(!seq)walk(me,dx,dy,44,dt)}
  else if(!seq&&!me.place&&!me.hidden)me.k=me.hold!=null?'hold':'sit';
  me.carry=me.k.startsWith('walk')&&me.hold!=null?me.hold:null;
  // 固定位置的猫：按性格轮换待机动作
  S.cats.forEach(c=>{if(!c.pool||c.lock)return;if((c.wait-=dt)<=0){c.wait=7+Math.random()*6;c.k=pickIdle(c.b,c.pool)}});
  // 烁烁：闲逛，或按性格做个动作
  if(!npc.lock){if(npc.tx!=null){if(!walk(npc,npc.tx-npc.x,npc.ty-npc.y,26,dt)||Math.hypot(npc.tx-npc.x,npc.ty-npc.y)<1.5){npc.tx=null;npc.k='sit'}}
    else if((npc.wait-=dt)<=0){npc.wait=2+Math.random()*3;const k=pickIdle(npc.b,['walk','meow','lick','lie']);
      if(k!=='walk')npc.k=k;else{let x,y,n=0;do{x=20+Math.random()*280;y=90+Math.random()*96}while(!free(x,y)&&++n<20);npc.tx=x;npc.ty=y}}}
  // 靠近别的猫：它会慢眨眼（猫的"我喜欢你"）；砚砚舔爪时被打扰会不爽
  S.cats.forEach(c=>{if(c.me||c.lock||me.hidden)return;const d=Math.hypot(c.x-me.x,c.y-me.y);if(d>48){c.greeted=false;return}
    if(d>26||c.greeted)return;c.greeted=true;
    if(c.name==='砚砚'&&c.k==='lick'){emote(c,'anger',1.6);return}
    if(['sit','lie','meow','lick'].includes(c.k)&&Math.random()<PERSONA[c.b].slowBlink){if(c.npc)c.tx=null;borrow(c,'slowBlink',DUR.slowBlink);emote(c,'heart',DUR.slowBlink)}});
  // 提示
  const s=!seq&&!me.place&&!me.hidden&&nearest();
  const tip=s?'空格 · '+lab(s):me.place?'方向键 · 离开':(!seq&&me.hold!=null)?'空格 · 就地解开毛线球':'';
  promptEl.textContent=tip;promptEl.style.display=tip?'block':'none';
  if(toastT>0&&(toastT-=dt)<=0)toastEl.style.opacity=0;
  const c=pc.getContext('2d');use(c);c.clearRect(0,0,M1.w,M1.h);M1.draw(t,TOD,S)};
})();
