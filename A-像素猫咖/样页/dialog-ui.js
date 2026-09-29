/* 1024 猫咖 · 场景 v4 对话框（DOM）。和页面同一套颜色：深紫底、奶白描边、暖黄高亮；像素 RPG 的双层窗框，角上切掉一格。
   人类不出场：人类的话永远写在一张便签上（纸色、红图钉）；猫说的话带像素头像。
   用法：const d=makeDialog(el,{pick(i),act(id),link(key)});d.render(spec|null)；d.key(e) 在对话框开着时处理按键（返回 true 表示吃掉了）。
   spec 由 world4-things.js / world4-quest.js 生成：{kind, head:{icon,ci,title,chips}, note, noteKey, blocks:[...], tip:{t,l}, acts:[{id,t,key}]}
   blocks：text · task · choices{items:[{t,sub,pal,state,why}]} · say{pal,name,t} · steps{items:[{t,sub,done,cur}]} · progress{p,t} · right{t} · result{t} · book{t} · links{items} · words{items} */
const DLG_CSS=`
.dlg{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:min(860px,calc(100% - 28px));z-index:5;display:none;font-size:14px;line-height:1.65;color:#fff4dc}
.dlg.static{position:relative;left:auto;bottom:auto;transform:none;width:100%;display:block;z-index:auto}
.dlg .o1{background:#140e1a;padding:3px;clip-path:polygon(0 6px,3px 6px,3px 3px,6px 3px,6px 0,calc(100% - 6px) 0,calc(100% - 6px) 3px,calc(100% - 3px) 3px,calc(100% - 3px) 6px,100% 6px,100% calc(100% - 6px),calc(100% - 3px) calc(100% - 6px),calc(100% - 3px) calc(100% - 3px),calc(100% - 6px) calc(100% - 3px),calc(100% - 6px) 100%,6px 100%,6px calc(100% - 3px),3px calc(100% - 3px),3px calc(100% - 6px),0 calc(100% - 6px))}
.dlg .o2{background:#fff4dc;padding:3px;clip-path:polygon(0 3px,3px 3px,3px 0,calc(100% - 3px) 0,calc(100% - 3px) 3px,100% 3px,100% calc(100% - 3px),calc(100% - 3px) calc(100% - 3px),calc(100% - 3px) 100%,3px 100%,3px calc(100% - 3px),0 calc(100% - 3px))}
.dlg .in{background:#2f2340;box-shadow:inset 0 -3px 0 #241a2e;padding:10px 16px 12px;max-height:min(460px,62vh);display:flex;flex-direction:column}
.dlg .hd{display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:1px dashed #4a3a5c;margin-bottom:10px;white-space:nowrap}
.dlg canvas{position:static!important}
.dlg .hd canvas{width:24px;height:24px;image-rendering:pixelated}
.dlg .hd b{font-size:15px;color:#ffd84a;font-weight:600}
.dlg .chip{font-size:12px;color:#b9a8c9;border:1px solid #4a3a5c;border-radius:2px;padding:0 6px}
.dlg .chip.k{color:#241a2e;background:#b9a8c9;border-color:#b9a8c9}
.dlg .hint{margin-left:auto;font-size:12px;color:#8a7a9a}
.dlg .bd{overflow:auto;padding-right:4px;flex:1}
.dlg .note{position:relative;background:#fff8e8;color:#3a2630;padding:10px 14px 8px 18px;margin:0 0 10px;box-shadow:3px 3px 0 #140e1a;font-size:16px;line-height:1.6}
.dlg .note:before{content:"";position:absolute;left:6px;top:6px;width:5px;height:5px;background:#e0533d;box-shadow:1px 1px 0 #9e2f2a}
.dlg .note small{display:block;font-size:12px;color:#9a8a7a;margin-top:2px}
.dlg .note .cur{display:inline-block;width:8px;height:14px;background:#3a2630;vertical-align:-2px;margin-left:2px;animation:dlgblink .8s steps(2) infinite}
@keyframes dlgblink{50%{opacity:0}}
.dlg .task{color:#fff4dc;margin:0 0 8px}
.dlg .task:before{content:"任务";font-size:12px;color:#241a2e;background:#ffd84a;padding:0 5px;margin-right:8px;border-radius:2px;vertical-align:1px}
.dlg .txt{color:#d8cce4;margin:0 0 8px;white-space:pre-line}
.dlg ol{list-style:none;margin:0 0 6px;padding:0;display:grid;gap:5px}
.dlg ol.c2{grid-template-columns:1fr 1fr}
.dlg ol li{display:flex;align-items:center;gap:10px;padding:5px 10px;border:1px solid #4a3a5c;cursor:pointer;background:#261c34}
.dlg ol li .n{font:12px ui-monospace,Menlo,monospace;color:#b9a8c9;border:1px solid #4a3a5c;border-bottom-width:2px;padding:0 5px;border-radius:2px;flex:none}
.dlg ol li canvas{width:44px;height:40px;image-rendering:pixelated;flex:none;background:#3a2c4c}
.dlg ol li b{font-weight:600}
.dlg ol li small{display:block;font-size:12px;color:#b9a8c9;line-height:1.5}
.dlg ol li.on{background:#ffd84a;border-color:#ffd84a;color:#241a2e}
.dlg ol li.on small,.dlg ol li.on .n{color:#4a3a2a;border-color:#8a6a2a}
.dlg ol li.on:before{content:"";border:5px solid transparent;border-left:7px solid #241a2e;margin-right:-6px}
.dlg ol li.wrong{cursor:default;background:#2a2036;border-style:dashed;color:#8a7a9a}
.dlg ol li.wrong b{text-decoration:line-through}
.dlg ol li.wrong small{color:#f7a58c}
.dlg .say{display:flex;gap:10px;align-items:flex-start;margin:0 0 8px}
.dlg .say canvas{width:44px;height:40px;image-rendering:pixelated;flex:none;background:#3a2c4c;border:1px solid #4a3a5c}
.dlg .say div{background:#3a2c4c;padding:5px 12px;position:relative;flex:1}
.dlg .say div:before{content:"";position:absolute;left:-6px;top:12px;border:6px solid transparent;border-left:0;border-right-color:#3a2c4c}
.dlg .say b{color:#ffd84a;font-weight:600;font-size:13px;margin-right:6px}
.dlg ul.steps{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:3px}
.dlg ul.steps li{display:flex;gap:8px;align-items:baseline;color:#d8cce4}
.dlg ul.steps li:before{content:"";flex:none;width:10px;height:10px;border:2px solid #b9a8c9;transform:translateY(1px)}
.dlg ul.steps li.done{color:#9ccc98}
.dlg ul.steps li.done:before{background:#7ee08a;border-color:#7ee08a;box-shadow:inset 0 0 0 2px #2f2340}
.dlg ul.steps li.cur{color:#ffd84a}
.dlg ul.steps li.cur:before{border-color:#ffd84a}
.dlg ul.steps small{font-size:12px;color:#8a7a9a}
.dlg .prog{height:12px;background:#140e1a;border:2px solid #4a3a5c;margin:4px 0 8px;position:relative}
.dlg .prog i{position:absolute;left:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,#7ee08a 0 8px,#5B8C5A 8px 10px)}
.dlg .progt{font-size:12px;color:#b9a8c9;margin-top:-4px}
.dlg .right{color:#9ccc98;margin:0 0 8px}.dlg .right:before{content:"✓ ";font-weight:700}
.dlg .result{color:#241a2e;background:#ffd84a;padding:4px 12px;margin:2px 0 6px;font-weight:600}
.dlg .made{display:flex;gap:14px;align-items:center;background:#ffd84a;color:#241a2e;padding:8px 14px;margin:2px 0 6px;box-shadow:3px 3px 0 #140e1a}
.dlg .made canvas{width:52px;height:52px;image-rendering:pixelated;background:#fff8e8;border:2px solid #241a2e;flex:none}
.dlg .made b{display:block;font-size:17px;font-weight:700;line-height:1.4}
.dlg .made span{display:block;font-size:14px;line-height:1.5}.dlg .made span:before{content:"下一步 ▸ ";font-weight:700}
.dlg .book{background:#f4ecd8;color:#3a2630;border-left:6px solid #8a5a3a;padding:8px 12px;margin:0 0 8px;font-size:15px;box-shadow:3px 3px 0 #140e1a}
.dlg .links{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px;margin:4px 0 6px}
.dlg .links button{all:unset;cursor:pointer;border:1px solid #4a3a5c;background:#261c34;padding:6px 10px;font-size:14px;color:#fff4dc}
.dlg .links button:hover,.dlg .links button.on{border-color:#ffd84a;background:#ffd84a22}
.dlg .links b{font-weight:600}.dlg .links b:after{content:" ↗";color:#ffd84a}
.dlg .links small{display:block;font-size:12px;color:#b9a8c9;line-height:1.5}
.dlg .links .got{color:#7ee08a;font-size:12px;margin-left:6px}
.dlg dl{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin:0 0 8px}
.dlg dt{color:#ffd84a;font-weight:600}.dlg dd{margin:0;color:#d8cce4}
.dlg .ft{display:flex;gap:14px;align-items:flex-end;border-top:1px dashed #4a3a5c;padding-top:8px;margin-top:6px}
.dlg .tip{flex:1;font-size:13px;color:#d8cce4;line-height:1.6}
.dlg .tip b{font-size:12px;color:#241a2e;background:#9ccc98;padding:0 5px;border-radius:2px;margin-right:6px}
.dlg .tip a{color:#ffd84a;text-decoration:none;margin-left:4px;cursor:pointer;white-space:nowrap}
.dlg .acts{display:flex;gap:6px;flex:none}
.dlg .acts button{font:inherit;font-size:13px;color:#fff4dc;background:#261c34;border:1px solid #b9a8c9;border-bottom-width:3px;border-radius:2px;padding:2px 12px;cursor:pointer}
.dlg .acts button.pri{background:#ffd84a;color:#241a2e;border-color:#8a6a2a}
.dlg .acts button kbd{font:11px ui-monospace,Menlo,monospace;opacity:.7;margin-right:5px}`;
(()=>{if(typeof document==='undefined'||document.getElementById('dlg-css'))return;const s=document.createElement('style');s.id='dlg-css';s.textContent=DLG_CSS;document.head.appendChild(s)})();

// 像素头像：坐着的猫（pal 是 PAL 的下标；店猫用它自己的默认表情）
function drawPortrait(cv,pal,t=0,ex){const c=cv.getContext('2d');cv.width=22;cv.height=20;c.clearRect(0,0,22,20);const o=C;use(c);
  const P=POSE.sit(t,0,0,ex||(pal<7?PERSONA[pal].face:'normal'));drawF(C,P.G,PAL[pal]||PAL[0],11,20,{cx:P.cx,blink:P.blink});use(o)}
// 织好的小东西（围巾、毛线帽……），11×11 画布居中
function drawKnit(cv,kind,ci=0){const c=cv.getContext('2d');cv.width=11;cv.height=11;c.clearRect(0,0,11,11);const o=C;use(c);const h=KNIT[kind].length;knit(kind,5,Math.floor((11-h)/2),ci);use(o)}
function drawIcon(cv,kind,ci=0,t=0){const c=cv.getContext('2d');cv.width=16;cv.height=16;c.clearRect(0,0,16,16);const o=C;use(c);
  if(kind==='yarn')yarnBall(8,8,5,ci,Math.floor(t*4));else if(kind==='book'){R(2,4,12,9,OL);R(3,4,5,7,'#fff8e8');R(8,4,5,7,'#f4ecd8');R(3,11,10,1,'#8a5a3a')}
  else if(kind==='sign'){R(7,2,2,13,OL);R(1,4,11,4,OL);R(2,5,9,2,'#e8dccb');R(12,5,2,2,OL);R(4,9,10,4,OL);R(5,10,8,2,'#a8d0f0')}
  else if(kind==='star'){R(7,2,2,12,'#ffd84a');R(2,7,12,2,'#ffd84a');R(5,5,6,6,'#ffd84a');R(7,7,2,2,'#fff8e0')}
  else if(kind==='mail'){R(3,3,10,8,OL);R(4,4,8,6,'#e0533d');R(5,6,6,1,OL);R(7,11,2,4,OL)}
  else if(kind==='tool'){grid(4,3,TOOLS_PX.wrench,{o:OL,'.':'#b4bcc8'})}
  else if(kind==='bell'){grid(2,3,[".....o.....","....ooo....","...owwwo...","..owwwwso..",".owwwwwwso.",".owwwwwwso.","ooooooooooo"],{o:OL,w:'#f4f8fc',s:'#b8c4d0','.':null});R(1,10,13,2,'#c98a5a');R(1,11,13,1,'#8a5a3a')}
  else if(kind==='gate'){R(2,3,3,11,OL);R(11,6,3,8,OL);R(4,8,8,2,'#e0533d');R(3,4,1,2,'#7ee08a')}
  else if(kind==='tree'){disc(8,6,7,5,OL);disc(8,6,6,4,'#e3a92c');disc(6,5,3,2,'#f7c940');R(6,10,4,5,OL);R(7,10,2,5,'#8a5a3a');R(7,11,2,1,'#e0533d');R(7,13,2,1,'#5B9BD5');R(3,15,10,1,OL)}
  else{const P=POSE.sit(t,0,0,'content');C.save();C.scale(.8,.8);drawF(C,P.G,PAL[0],10,20,{cx:P.cx});C.restore()}use(o)}

function makeDialog(root,cb={},{isStatic=false}={}){
  root.className='dlg'+(isStatic?' static':'');root.innerHTML='<div class="o1"><div class="o2"><div class="in"><div class="hd"></div><div class="bd"></div><div class="ft"></div></div></div></div>';
  const hd=root.querySelector('.hd'),bd=root.querySelector('.bd'),ft=root.querySelector('.ft');
  let spec=null,cur=0,typed={},typing=null,chKey='';
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function render(s){spec=s;if(!s){root.style.display='none';typing=null;return}root.style.display='block';
    const h=s.head||{};hd.innerHTML=`<canvas></canvas><b>${esc(h.title)}</b>${(h.chips||[]).map((c,i)=>`<span class="chip${i===(h.chips.length-1)&&s.kind==='quest'?' k':''}">${esc(c)}</span>`).join('')}${isStatic?'':'<span class="hint">'+keyHint(s)+'</span>'}`;
    drawIcon(hd.querySelector('canvas'),h.icon,h.ci);
    let html='';if(s.note){const full=typed[s.noteKey]||isStatic;html+=`<div class="note"><span class="nt">${full?esc(s.note):''}</span>${full?'':'<i class="cur"></i>'}<small>—— 门缝里塞进来的便签${h.chips&&h.chips[0]?' · '+esc(h.chips[0]):''}</small></div>`}
    const ch=(s.blocks||[]).find(b=>b.k==='choices'),key=ch?ch.items.map(i=>i.t+i.state).join('|'):'';if(key!==chKey){chKey=key;cur=ch?Math.max(0,ch.items.findIndex(i=>i.state!=='wrong')):0}
    for(const b of s.blocks||[]){
      if(b.k==='text')html+=`<p class="txt">${esc(b.t)}</p>`;else if(b.k==='task')html+=`<p class="task">${esc(b.t)}</p>`;
      else if(b.k==='choices')html+=`<ol${b.cols===2?' class="c2"':''}>`+b.items.map((it,i)=>`<li data-i="${i}" class="${it.state==='wrong'?'wrong':(isStatic?i===s.sel:i===cur)?'on':''}"><span class="n">${i+1}</span>${it.pal!=null?`<canvas data-pal="${it.pal}"></canvas>`:''}<div><b>${esc(it.t)}</b>${it.sub||it.why?`<small>${esc(it.why||it.sub)}</small>`:''}</div></li>`).join('')+'</ol>';
      else if(b.k==='say')html+=`<div class="say"><canvas data-pal="${b.pal}"></canvas><div><b>${esc(b.name)}</b>${esc(b.t)}</div></div>`;
      else if(b.k==='steps')html+='<ul class="steps">'+b.items.map(it=>`<li class="${it.done?'done':it.cur?'cur':''}"><span>${esc(it.t)}${it.sub?` <small>${esc(it.sub)}</small>`:''}</span></li>`).join('')+'</ul>';
      else if(b.k==='progress')html+=`<div class="prog"><i style="width:${Math.round((b.p||0)*100)}%"></i></div>${b.t?`<p class="progt">${esc(b.t)}</p>`:''}`;
      else if(b.k==='right')html+=`<p class="right">${esc(b.t)}</p>`;else if(b.k==='result')html+=`<p class="result">${esc(b.t)}</p>`;else if(b.k==='made')html+=`<div class="made"><canvas data-knit="${b.kind}" data-ci="${b.ci||0}"></canvas><div><b>${esc(b.t)}</b>${b.next?`<span>${esc(b.next)}</span>`:''}</div></div>`;else if(b.k==='book')html+=`<div class="book">${esc(b.t)}</div>`;
      else if(b.k==='links')html+='<div class="links">'+b.items.map(it=>`<button data-link="${it.key}"><b>${esc(it.n)}</b>${cb.visited&&cb.visited(it.key)?'<span class="got">已盖章</span>':''}<small>${esc(it.sub)}${it.url?'':'（地址待填）'}</small></button>`).join('')+'</div>';
      else if(b.k==='words')html+='<dl>'+b.items.map(([w,d])=>`<dt>「${esc(w)}」</dt><dd>${esc(d)}</dd>`).join('')+'</dl>'}
    bd.innerHTML=html;bd.querySelectorAll('canvas[data-pal]').forEach(cv=>drawPortrait(cv,+cv.dataset.pal));bd.querySelectorAll('canvas[data-knit]').forEach(cv=>drawKnit(cv,cv.dataset.knit,+cv.dataset.ci));
    const tip=s.tip,L=tip&&tip.l&&typeof LINKS!=='undefined'?LINKS[tip.l]:null;
    ft.innerHTML=(tip?`<div class="tip"><b>Tips</b>${esc(tip.t)}${L?`<a data-link="${tip.l}">${esc(L.n)} ↗</a>`:''}</div>`:'<div class="tip"></div>')+
      `<div class="acts">${(s.acts||[]).map((a,i)=>`<button data-act="${a.id}" class="${a.key==='E'?'pri':''}">${a.key?`<kbd>${a.key}</kbd>`:''}${esc(a.t)}</button>`).join('')}</div>`;
    ft.style.display=tip||(s.acts||[]).length?'flex':'none';
    if(s.note&&!typed[s.noteKey]&&!isStatic)startType(s)}
  function keyHint(s){const ch=(s.blocks||[]).some(b=>b.k==='choices');return (ch?'↑↓ / 数字 选择 · E 确定':'E 确定')+' · Esc '+((s.acts||[]).some(a=>a.id==='later')?'收起':'关闭')}
  function startType(s){const el=bd.querySelector('.note .nt'),c=bd.querySelector('.note .cur');let i=0;const txt=s.note,key=s.noteKey;typing={key,finish(){typed[key]=1;typing=null;if(el)el.textContent=txt;if(c)c.remove()}};
    const step=()=>{if(!typing||typing.key!==key||spec!==s&&spec&&spec.noteKey!==key)return;i+=2;if(el)el.textContent=txt.slice(0,i);if(i>=txt.length){typing.finish();return}setTimeout(step,28)};setTimeout(step,60)}
  function move(d){const ch=spec&&(spec.blocks||[]).find(b=>b.k==='choices');if(!ch)return;const n=ch.items.length;for(let k=1;k<=n;k++){const j=(cur+d*k+n*k)%n;if(ch.items[j].state!=='wrong'){cur=j;break}}
    bd.querySelectorAll('ol li').forEach((li,i)=>li.classList.toggle('on',i===cur&&ch.items[i].state!=='wrong'))}
  root.addEventListener('pointerdown',e=>{if(isStatic&&!cb.live)return;e.stopPropagation();const li=e.target.closest('li[data-i]'),a=e.target.closest('[data-act]'),l=e.target.closest('[data-link]');
    if(typing&&!l)typing.finish();if(li&&!li.classList.contains('wrong'))cb.pick&&cb.pick(+li.dataset.i);else if(a)cb.act&&cb.act(a.dataset.act);else if(l)cb.link&&cb.link(l.dataset.link)});
  function key(e){if(!spec)return false;const k=e.key.length===1?e.key.toLowerCase():e.key;
    if(typing&&(k==='e'||k===' '||k==='Enter')){typing.finish();return true}
    if(k==='ArrowUp'||k==='w'){move(-1);return true}if(k==='ArrowDown'||k==='s'){move(1);return true}
    const ch=(spec.blocks||[]).find(b=>b.k==='choices');
    if(/^[1-9]$/.test(k)){const i=+k-1;if(ch&&ch.items[i]&&ch.items[i].state!=='wrong'){if(typing)typing.finish();cb.pick&&cb.pick(i)}return true}
    if(k==='e'||k===' '||k==='Enter'){if(ch&&ch.items[cur]&&ch.items[cur].state!=='wrong'&&!spec.acts.some(a=>a.key==='E')){cb.pick&&cb.pick(cur);return true}const a=(spec.acts||[]).find(a=>a.key==='E')||(spec.acts||[])[0];if(a)cb.act&&cb.act(a.id);return true}
    if(e.key==='Escape'){const a=(spec.acts||[]).find(a=>a.key==='Esc');cb.act&&cb.act(a?a.id:'close');return true}
    return ['a','d','ArrowLeft','ArrowRight','q','t','f'].includes(k)}   // 对话框开着时，别让猫走动
  return{render,key,get open(){return !!spec},get spec(){return spec}}}
