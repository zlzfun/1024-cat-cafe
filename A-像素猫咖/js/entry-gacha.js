/* 1024 猫咖 · 进店第三步：扭蛋。黑底一台猫头扭蛋机掉下来；名字变成一枚硬币投进去；转一下旋钮，滚出一颗扭蛋，蹦到跟前、晃三下、裂开——里面就是你的猫。
   毛色、项圈、平时的表情都是扭出来的；不满意可以再扭两次。定下来以后给它的项圈牌刻个暗号（换电脑时领回它用），刻好就登记进店里的名册。
   EG.run(name, {look, code, commit}) → Promise：{cat} 登记好了；{taken, why, look, code} 名字刚被别的猫用了（回去改个名字再来，外观和暗号都留着）。
   commit(look, code) → Account.create 的结果。传了 look 和 code 就跳过扭蛋和刻字，直接登记。 */
const EG=(()=>{
const ease=k=>k<0?0:k>1?1:k<.5?2*k*k:1-(-2*k+2)**2/2,cl=k=>k<0?0:k>1?1:k,lerp=(a,b,k)=>a+(b-a)*k;
const bounce=k=>{const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+.75;if(k<2.5/d)return n*(k-=2.25/d)*k+.9375;return n*(k-=2.625/d)*k+.984375};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MAX_REROLL=2;

function run(name,{look:keepLook,code:keepCode,commit}={}){const S=EK.stage(),{LW,LH}=S,FY=Math.round(LH*.66),MX=Math.round(LW/2),caps=EA.pile(20,(Date.now()%9973)+1);
  const st={ph:keepLook&&keepCode?'eng':'drop',t0:0,mx:MX,look:keepLook||null,rolls:0,cap:null,cat:null,top:null,bot:null,code:keepCode||[],tag:null,fx:[],flap:0,turn:0,jig:0,coin:null,wig:0};
  const set=(ph)=>{st.ph=ph;st.t0=S.t};let ui=null,card=null,pad=null,resolve;
  const clear=()=>{if(ui){ui.remove();ui=null}if(card){card.remove();card=null}};
  const cap=(html,y)=>{clear();ui=EK.dom(`<div class="cap">${html}</div>`,{top:S.cy(y)});};
  const catSpot=()=>({x:MX+10,y:FY+16});
  // 输入：E / 空格 / 回车，或者点一下画面
  const act=()=>{if(st.ph==='wait'){Sound.sfx('ratchet');set('turn');clear()}};
  const offKey=EK.onKey(e=>{if(e.type!=='keydown')return;if((e.key==='e'||e.key==='E'||e.key===' '||e.key==='Enter')&&!e.repeat&&st.ph==='wait'){e.preventDefault();act()}});
  const offClick=EK.onClick(()=>act());
  // 名字飞进投币口
  function flyName(slot){const r=CW.fieldRect(innerWidth,innerHeight),el=EK.dom(`<div class="fly">${esc(name)}</div>`,{left:r.x+r.w/2,top:r.y+r.h/2});el.style.transform='translate(-50%,-50%)';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.left=S.cx(slot.x)+'px';el.style.top=S.cy(slot.y)+'px';el.style.transform='translate(-50%,-50%) scale(.2)';el.style.opacity='0'}));setTimeout(()=>el.remove(),700)}
  function showCard(){const d=EA.describe(st.look),left=MAX_REROLL-st.rolls+0,sp=catSpot();
    card=EK.dom(`<div class="gc"><small>扭到了</small><b>${esc(name)}</b><p>${d.coat} · ${d.collar}<br>${esc(d.face)}</p><div class="acts"><button class="go pbtn">就是它了</button>${left>0?`<button class="re lbtn">再扭一次<small>还有 ${left} 次</small></button>`:''}</div></div>`,{left:S.cx(sp.x+26),top:S.cy(sp.y-34)});
    card.querySelector('.go').onclick=()=>{Sound.sfx('ok');card.remove();card=null;set('toEng')};const re=card.querySelector('.re');if(re)re.onclick=()=>{st.rolls++;card.remove();card=null;Sound.sfx('whoosh');set('poof')};
    setTimeout(()=>card&&card.querySelector('.go').focus(),50)}
  function showEngrave(){const sp=catSpot();card=EK.dom(`<div class="gc en"><b>给它的项圈牌刻个暗号</b><p>换电脑、换浏览器的时候，报上名字和这四个图案，就能把它领回来。记住它们。</p><div class="cp" tabindex="0"></div><div class="acts"><button class="go pbtn" disabled>刻好了</button><button class="re lbtn">重来</button></div><p class="err"></p></div>`,{left:S.cx(sp.x+34),top:S.cy(sp.y-58)});
    const go=card.querySelector('.go');pad=EN.pad(card.querySelector('.cp'),{onChange:c=>{st.code=c;go.disabled=c.length<Account.CODE_LEN},onDone:()=>setTimeout(()=>go.focus(),30)});
    card.querySelector('.re').onclick=()=>pad.clear();go.onclick=()=>sign();setTimeout(()=>card&&card.querySelector('.cp').focus(),50)}
  const offPad=EK.onKey(e=>{if(e.type==='keydown'&&pad&&card&&card.isConnected&&st.ph==='eng'){if(pad.key(e))e.preventDefault()}});
  async function sign(){if(st.ph==='signing')return;set('signing');const g=card&&card.querySelector('.go');if(g){g.disabled=true;g.textContent='登记中……'}
    const r=await commit(st.look,st.code);
    if(r&&r.cat){st.cat=r.cat;if(card){card.remove();card=null}Sound.sfx('hang');set('done');return}
    if(r&&(r.err==='taken'||r.err==='name')){finish({taken:true,why:r.why,look:st.look,code:st.code});return}
    set('eng');if(!card)showEngrave();if(pad)pad.set(st.code);const e=card.querySelector('.err');e.textContent=r&&r.err==='store'?'这台浏览器存不下东西（可能是无痕模式），换个窗口再试':'店门口网不好，等一下再点一次';const b=card.querySelector('.go');b.disabled=false;b.textContent='刻好了'}
  function finish(v){offKey();offClick();offPad();clear();EK.stop();resolve(v)}

  return new Promise(res=>{resolve=res;if(keepLook&&keepCode)setTimeout(sign,450);
    EK.loop((t,dt)=>{S.t=t;const k=t-st.t0;S.clear('#1c1424');use(S.x);
      let my=FY,m=null;
      // 机器
      if(st.ph==='drop'){my=Math.round(FY-(1-bounce(cl(k/.7)))*(FY+120));if(k>.28&&!st.landed){st.landed=1;Sound.sfx('land')}if(k>.75&&!st.flown){st.flown=1;flyName({x:st.mx+11,y:FY-32})}
        if(k>1.3&&!st.coin){st.coin={t0:t};Sound.sfx('coin')}if(k>1.75){set('wait');cap(`<b>转一下旋钮</b><span><kbd class="k">E</kbd> <kbd class="k">空格</kbd> 或者点一下</span>`,FY+22)}}
      if(st.ph==='turn'){st.turn=ease(cl(k/.9));st.jig=k<.9?Math.sin(cl(k/.9)*Math.PI)*1+.2:Math.max(0,.4-(k-.9));if(Math.floor(k*4.4)!==st.rat&&k<.9){st.rat=Math.floor(k*4.4);Sound.sfx('ratchet')}
        if(k>.9&&!st.cap){const i=caps.reduce((b,c,j)=>c.y>caps[b].y?j:b,0),c=caps.splice(i,1)[0];st.cap={c:c.c,x:st.mx,y:FY-8,r:5,a:0};Sound.sfx('toss')}
        st.flap=k<1?0:k<1.25?(k-1)/.25:k<1.6?1:Math.max(0,1-(k-1.6)/.3);
        if(st.cap&&k>1.1){const q=cl((k-1.1)/.7),bx=st.mx+2+q*30,by=q<.35?lerp(FY-8,FY+4,q/.35):FY+4-Math.abs(Math.sin((q-.35)/.65*Math.PI*2))*3*(1-q);st.cap.x=bx;st.cap.y=by;st.cap.a=q*5;if(q>.3&&!st.rolled){st.rolled=1;Sound.sfx('roll')}}
        if(k>2){st.turn=0;st.jig=0;set('hop');st.hop={x:st.cap.x,y:st.cap.y}}}
      if(st.ph==='hop'){const q=ease(cl(k/.6)),sp=catSpot();st.mx=Math.round(lerp(MX,MX-72,q));st.cap.x=lerp(st.hop.x,sp.x,q);st.cap.y=lerp(st.hop.y,sp.y-14,q)-Math.sin(cl(k/.6)*Math.PI)*26;st.cap.r=Math.round(lerp(5,14,q));st.cap.a=lerp(st.cap.a,0,q);
        if(k>.6){set('wob');Sound.sfx('land')}}
      if(st.ph==='wob'){const n=Math.floor(k/.34),q=(k%.34)/.34;st.cap.a=n<3?Math.sin(q*Math.PI*2)*(.18+n*.14):0;st.cap.hopY=n<3?-Math.round(Math.sin(q*Math.PI)*(n+1)):0;if(n!==st.wn&&n<3){st.wn=n;Sound.sfx('clack')}
        if(k>1.1){st.look=EA.roll(st.look);set('pop');Sound.sfx('crack');setTimeout(()=>Sound.sfx('reveal'),120);const c=st.cap;st.top={x:c.x,y:c.y,t0:t,vx:(Math.random()<.5?-1:1)*38,vy:-70,va:(Math.random()<.5?-1:1)*7};st.bot={x:c.x,y:c.y,t0:t};
          for(let i=0;i<18;i++){const a=Math.random()*Math.PI*2,v=20+Math.random()*50;st.fx.push({x:c.x,y:c.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,t0:t,life:.5+Math.random()*.6})}}}
      if(st.ph==='pop'&&k>1.05&&!card)showCard();
      if(st.ph==='poof'&&k>.45){st.cap=null;st.top=null;st.bot=null;const q=ease(cl((k-.45)/.4));st.mx=Math.round(lerp(MX-72,MX,q));if(k>.9){st.mx=MX;st.wn=null;st.rat=null;st.rolled=0;set('wait');cap(`<b>再转一下</b><span><kbd class="k">E</kbd> <kbd class="k">空格</kbd> 或者点一下</span>`,FY+22)}}
      if(st.ph==='toEng'){if(k>.5){set('eng');showEngrave()}}
      if(st.ph==='done'&&k>1.25){finish({cat:st.cat,look:st.look,code:st.code});return true}
      // —— 画 ——
      const sp=catSpot(),showMachine=['drop','wait','turn','hop','wob','pop','poof'].includes(st.ph)||st.ph==='toEng'&&k<.5;
      if(showMachine){const off=st.ph==='toEng'?Math.round(-ease(k/.5)*LW*.5):0;EA.spot(st.mx+off,FY+1,40,9);st.wig=st.ph==='wait'?1:0;m=EA.machine(st.mx+off,my,t,{caps,turn:st.turn,flap:st.flap,jig:st.jig,wiggle:st.wig});
        if(st.coin){const q=cl((t-st.coin.t0)/.35);if(q<1)EA.coin(m.slot.x+Math.round((1-q)*5),m.slot.y+3,q)}}
      if(st.cap&&['turn','hop','wob','pop','poof'].includes(st.ph)){if(st.ph!=='turn')EA.spot(sp.x,sp.y+1,24,6,{k:cl((st.ph==='hop'?k/.6:1))});
        if(st.ph==='pop'||st.ph==='poof'){drawReveal(t,k,sp)}else EA.capsule(st.cap.x,st.cap.y+(st.cap.hopY||0),st.cap.r,st.cap.a,st.cap.c)}
      if(['toEng','eng','signing','done'].includes(st.ph)){EA.spot(sp.x,sp.y+1,24,6);EA.cat('sit',st.look,sp.x,sp.y,t);
        const tx=sp.x,ty=sp.y-44,show=st.ph==='toEng'?ease(cl((k-.1)/.4)):1;
        if(st.ph==='done'){const q=cl((k-.35)/.5);if(q<1){if(k<.4)EA.tag(tx,ty,st.code,t,{shine:k/.4});else{const r=Math.round(lerp(15,1,ease(q)));disc(Math.round(lerp(tx,sp.x+1,ease(q))),Math.round(lerp(ty,sp.y-10,ease(q))),r,r,'#e8b83a')}}
          else for(let i=0;i<5;i++){const a=i*1.26+t*3;spark(Math.round(sp.x+1+Math.cos(a)*(6+(k-.85)*20)),Math.round(sp.y-10+Math.sin(a)*(6+(k-.85)*20)),t+i)}}
        else if(show>0){if(show<1){alpha(show,()=>EA.tag(tx,Math.round(ty+(1-show)*8),st.code,t))}else{line(tx,ty+17,sp.x+1,sp.y-12,'#c8b89a');EA.tag(tx,ty,st.code,t)}}}
      // 碎片、火星
      st.fx=st.fx.filter(f=>{const a=t-f.t0;if(a>f.life)return false;const x=Math.round(f.x+f.vx*a),y=Math.round(f.y+f.vy*a+60*a*a);P1(x,y,a<f.life*.5?'#fff4dc':'#ffd84a');return true});
    })})
  function drawReveal(t,k,sp){if(st.ph==='pop'&&k<.9)EA.rays(sp.x,sp.y-10,40+k*20,t,'#ffe08a');
    // 下半个壳：沉下去、淡掉；上半个壳：飞出去转着圈
    if(st.bot){const q=cl((t-st.bot.t0)/.5);if(q<1)alpha(1-q,()=>EA.capsule(st.bot.x,st.bot.y+q*4,14,0,st.cap.c,{part:'bot'}))}
    if(st.top){const tt=Math.min(t-st.top.t0,3);EA.capsule(st.top.x+st.top.vx*tt,st.top.y+st.top.vy*tt+70*tt*tt,14,st.top.va*tt,st.cap.c,{part:'top'})}
    if(st.ph==='poof'){const q=cl(k/.45);if(q<1)alpha(1-q,()=>EA.cat('sit',st.look,sp.x,sp.y,t));puff(sp.x,sp.y-8,q);return}
    const hop=k<.5?Math.round(-Math.sin(k/.5*Math.PI)*8):0;EA.cat(k<1.1?'happy':'sit',st.look,sp.x,sp.y+hop,t);
    if(k<2)for(let i=0;i<6;i++){const a=i*1.047+k*2,r=10+k*14;spark(Math.round(sp.x+Math.cos(a)*r),Math.round(sp.y-10+Math.sin(a)*r*.7),t+i*.3)}}
}
return{run}})();
