/* 1024 猫咖 · 进店第四步：黑底上教两件事，然后跳进店里。
   ① 走两步：WASD / 方向键，或者点一下地面（按下的键在提示里亮起来）；聚光灯跟着猫走。
   ② 碰一碰：上面掉下来一颗毛线球。走到旁边按 E / 空格，或者直接点它；猫扑一下，球滚开。
   ③ 走进光里：右边亮起一道光，猫走进去就往上一跳——下一个画面是它从毛线巨树上掉进店里（world4-arrive.js）。
   右下角可以跳过。ET.run(look, name) → Promise（跳起来那一刻 resolve）。 */
const ET=(()=>{
const cl=k=>k<0?0:k>1?1:k,ease=k=>k<0?0:k>1?1:k<.5?2*k*k:1-(-2*k+2)**2/2;
const KEYS={w:'u',a:'l',s:'d',d:'r',arrowup:'u',arrowleft:'l',arrowdown:'d',arrowright:'r'};
function run(look,name){const S=EK.stage(),{LW,LH}=S,Y0=Math.round(LH*.5),Y1=Math.round(LH*.84),X0=16,X1=LW-16;
  const cat={x:Math.round(LW*.36),y:Math.round(LH*.68),face:'R',k:'sit',tgt:null,moved:0,t0:0};
  const st={step:0,t0:0,ball:null,door:null,keys:{},leap:null,hint:null,spot:{x:cat.x,y:cat.y}};
  let ui=null,resolve;const pressed=st.keys;
  const kbd=(k,l)=>`<kbd class="k" data-k="${k}">${l}</kbd>`;
  function caption(){if(ui)ui.remove();const S1=`<div class="cap tut"><b>走两步</b><div class="kk"><span class="pad">${kbd('u','W')}<br>${kbd('l','A')}${kbd('d','S')}${kbd('r','D')}</span><i>或</i><span class="pad">${kbd('u','↑')}<br>${kbd('l','←')}${kbd('d','↓')}${kbd('r','→')}</span><i>或</i><span class="ms">点一下地面</span></div><em class="prog"><i></i></em></div>`,
      S2=`<div class="cap tut"><b>碰一碰毛线球</b><div class="kk"><span>走到它旁边</span>${kbd('e','E')}<i>或</i>${kbd('sp','空格')}<i>或</i><span class="ms">直接点它</span></div></div>`,
      S3=`<div class="cap tut"><b>走进光里</b><div class="kk"><span>店就在那边</span></div></div>`;
    ui=EK.dom([S1,S2,S3][st.step],{top:S.cy(Y1)+18});const l=innerWidth/2-ui.getBoundingClientRect().width/2;ui.style.left=(window.PXF?PXF.snap(l):Math.round(l))+'px'}   // 居中、左边对到整像素（不用 translateX(-50%)）
  const setStep=n=>{st.step=n;st.t0=S.t;if(n<3)caption();Sound.sfx('step')};
  const skipOff=EK.skip('跳过引导',()=>{if(!st.leap)leap(true)});
  const offKey=EK.onKey(e=>{const k=e.key.toLowerCase(),m=KEYS[k];if(m){pressed[m]=e.type==='keydown';e.preventDefault();if(e.type==='keydown')cat.tgt=null;light(m,pressed[m])}
    if(e.type==='keydown'&&(k==='e'||k===' '||k==='enter')&&!e.repeat){e.preventDefault();light(k===' '?'sp':'e',true);setTimeout(()=>light(k===' '?'sp':'e',false),160);poke()}});
  const offClick=EK.onClick((x,y)=>{if(st.leap)return;if(st.ball&&Math.hypot(x-st.ball.x,y-st.ball.y+3)<9){cat.tgt={x:st.ball.x+(cat.x<st.ball.x?-11:11),y:st.ball.y,then:'poke'};return}
    cat.tgt={x:Math.max(X0,Math.min(X1,x)),y:Math.max(Y0,Math.min(Y1,y))};st.hint={x,y,t0:S.t}});
  function light(k,on){if(!ui)return;ui.querySelectorAll(`kbd[data-k="${k}"]`).forEach(b=>b.classList.toggle('on',on))}
  function poke(){if(st.step!==1||!st.ball||st.ball.hit)return;const d=Math.hypot(cat.x-st.ball.x,cat.y-st.ball.y);if(d>18){EK.flash(ui);return}
    cat.face=st.ball.x>cat.x?'R':'L';cat.k='pounce';cat.t0=S.t;st.ball.hit=S.t;st.ball.vx=(cat.face==='R'?1:-1)*70;Sound.sfx('pop');setTimeout(()=>{Sound.sfx('disc')},300)}
  function leap(skip){st.leap={t0:S.t,x:cat.x,y:cat.y,skip};cat.k='leap';Sound.sfx('whoosh');if(ui){ui.remove();ui=null}skipOff()}

  return new Promise(res=>{resolve=res;setStep(0);
    EK.loop((t,dt)=>{S.t=t;const k=t-st.t0;S.clear('#120d16');use(S.x);
      // 走
      if(!st.leap){let dx=(pressed.r?1:0)-(pressed.l?1:0),dy=(pressed.d?1:0)-(pressed.u?1:0);
        if(!dx&&!dy&&cat.tgt){const vx=cat.tgt.x-cat.x,vy=cat.tgt.y-cat.y,d=Math.hypot(vx,vy);if(d<1.5){const th=cat.tgt.then;cat.tgt=null;if(th==='poke'){cat.face=st.ball&&st.ball.x>cat.x?'R':'L';poke()}}else{dx=vx/d;dy=vy/d}}
        if(dx||dy){if(cat.k==='pounce'&&t-cat.t0<.6){}else{const l=Math.hypot(dx,dy),sp=40*dt,nx=Math.max(X0,Math.min(X1,cat.x+dx/l*sp)),ny=Math.max(Y0,Math.min(Y1,cat.y+dy/l*sp));cat.moved+=Math.hypot(nx-cat.x,ny-cat.y);cat.x=nx;cat.y=ny;if(Math.abs(dx)>.2)cat.face=dx>0?'R':'L';cat.k=cat.face==='L'?'walkL':'walkR'}}
        else if(cat.k!=='pounce'||t-cat.t0>1.2)cat.k='sit'}
      st.spot.x+=(cat.x-st.spot.x)*Math.min(1,dt*6);st.spot.y+=(cat.y-st.spot.y)*Math.min(1,dt*6);
      // 步骤
      if(st.step===0){const p=cl(cat.moved/70),bar=ui&&ui.querySelector('.prog i');if(bar)bar.style.width=p*100+'%';if(p>=1&&!st.next){st.next=t+.5}if(st.next&&t>st.next){st.next=0;setStep(1);
          const bx=cat.x<LW/2?Math.min(X1-20,cat.x+48):Math.max(X0+20,cat.x-48);st.ball={x:Math.round(bx),y:Math.round(Math.min(Y1-6,Math.max(Y0+10,cat.y))),t0:t,vx:0}}}
      if(st.step===1&&st.ball&&st.ball.hit&&t-st.ball.hit>1.3){setStep(2);st.door={x:Math.min(X1-18,Math.max(cat.x+60,LW*.72)),t0:t}}
      if(st.step===2&&!st.leap&&Math.abs(cat.x-st.door.x)<9&&t-st.door.t0>.6)leap(false);
      // 画：光柱（在后面）、聚光灯、球、猫
      if(st.door){const a=ease(cl((t-st.door.t0)/.8));EA.shaft(Math.round(st.door.x),0,Y1+6,18*a,34*a,t,a);EA.spot(Math.round(st.door.x),Y1-18,17*a+1,5*a+1,{bright:'#ffe08a',mid:'#8a6a3a',k:a})}
      EA.spot(Math.round(st.spot.x),Math.round(st.spot.y+1),42,11);
      if(st.hint&&t-st.hint.t0<.5){const q=(t-st.hint.t0)/.5;ring(Math.round(st.hint.x),Math.round(st.hint.y),2+q*5,q<.5?'#ffd84a':'#8a7a9a')}
      if(st.ball){const b=st.ball,fall=cl((t-b.t0)/.5),by=b.y-Math.round((1-bounceIn(fall))*b.y);if(b.hit){const a=t-b.hit;b.x+=b.vx*dt;b.vx*=Math.pow(.25,dt);b.x=Math.max(X0,Math.min(X1,b.x))}
        EA.spot(Math.round(b.x),b.y+1,10,3,{bright:'#2a2036',mid:'#1c1424'});yarnBall(Math.round(b.x),by-3,3,0,b.hit?Math.floor(b.x/3):0);if(b.hit&&t-b.hit<1)for(let i=0;i<4;i++)spark(Math.round(b.x+Math.cos(i*1.6+t*4)*7),by-4+Math.round(Math.sin(i*1.6+t*4)*5),t+i)}
      if(st.leap){const a=t-st.leap.t0,y=st.leap.y-Math.round(a*a*260+a*40);EA.catOl(a<.12?'pounce':'leap',look,cat.x,y,t,{face:cat.face});
        if(a>.35){S.x.fillStyle=`rgba(255,244,220,${cl((a-.35)/.35)})`;S.x.fillRect(0,0,LW,LH)}if(a>.72){finish();return true}}
      else EA.catOl(cat.k,look,Math.round(cat.x),Math.round(cat.y),cat.k==='pounce'?t-cat.t0:t,{face:cat.face})})})
  function finish(){offKey();offClick();skipOff();if(ui)ui.remove();EK.stop();resolve()}}
const bounceIn=k=>{const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+.75;if(k<2.5/d)return n*(k-=2.25/d)*k+.9375;return n*(k-=2.625/d)*k+.984375};
return{run}})();
