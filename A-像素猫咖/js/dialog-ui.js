/* 1024 猫咖 · 场景 v4 对话框（DOM）。和页面同一套颜色、同一种像素窗框（index.html 的 .win：外深、内奶白、四角切一格、右下一格硬阴影），字是像素字（三档字号见 index.html 开头）。
   人类不出场：人类的话永远写在一张便签上（纸色、红图钉）；猫说的话带像素头像。底部左边是猫猫咖啡馆的 Tips 牌子，右边是按钮，按键写在按钮上的键帽里。
   用法：const d=makeDialog(el,{pick(i),act(id),link(key)});d.render(spec|null)；d.key(e) 在对话框开着时处理按键（返回 true 表示吃掉了）。
   spec 由 world4-things.js / world4-quest.js 生成：{kind, head:{icon,ci,title,chips}, note, noteKey, blocks:[...], tip:{t,l}, acts:[{id,t,key}]}
   blocks：text · h（小标题）· task · choices{items:[{t,sub,pal,state,why}]} · say{pal,name,t} · steps{items:[{t,sub,done,cur}]} · progress{p,t} · right{t} · result{t} · book{t} · links{items} · words{items}
   页面别处也用这里的几样：tipsHTML（Tips 牌子）、keycaps（提示里的按键换成键帽）、drawPortrait / drawKnit / drawIcon（像素头像和小图标）。
   窗框、按钮、键帽、Tips 牌子的样子写在 index.html（.win / .pbtn / .lbtn / kbd / .tipsb）；这里只放对话框自己的排版，都在 .dlg 底下（admin.html 也加载这个文件画头像，别写不带 .dlg 的规则）。 */
const DLG_CSS=`
.dlg{position:absolute;left:0;right:0;bottom:20px;margin:0 auto;width:min(calc(var(--fs-m,18px)*48),calc(100% - 32px));width:min(round(up,calc(var(--fs-m,18px)*48),8px),calc(100% - 32px));z-index:5;display:none;font-size:var(--fs-m,14px);line-height:var(--lh-m,1.6);color:#fff4dc}
.dlg.static{position:relative;left:auto;right:auto;bottom:auto;margin:0;width:100%;display:block;z-index:auto}
.dlg .in{display:flex;flex-direction:column;max-height:min(480px,64vh);padding:12px 16px}
.dlg .hd{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;white-space:nowrap;background:linear-gradient(90deg,#4a3a5c 50%,transparent 0) 0 100%/calc(var(--d2)*4) var(--d2) repeat-x}
.dlg canvas{position:static!important}
.dlg .hd canvas{flex:none;width:calc(var(--px-m)*16);height:calc(var(--px-m)*16)}
.dlg .hd b{min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:var(--fs-l);line-height:var(--lh-l);color:#ffd84a;text-shadow:var(--px-l) var(--px-l) 0 #140e1a}
.dlg .chip{--cc:#3a2c4c;flex:none;margin:var(--d2) 0;padding:0 calc(var(--px-s)*4);font-size:var(--fs-s);line-height:var(--lh-s);color:#b9a8c9;background:var(--cc);box-shadow:0 calc(var(--d2)*-2) 0 calc(var(--d2)*-1) var(--cc),0 calc(var(--d2)*2) 0 calc(var(--d2)*-1) var(--cc)}
.dlg .chip.k{--cc:#b9a8c9;color:#241a2e}
.dlg .hint{margin-left:auto;font-size:var(--fs-s);line-height:var(--lh-m);color:#8a7a9a}
.dlg .bd{flex:1;overflow:auto;padding-right:8px}
.dlg .note{position:relative;margin:0 var(--u) 12px 0;padding:8px 16px 8px 24px;color:#3a2630;background:#fff8e8;box-shadow:var(--u) var(--u) 0 #140e1a}
.dlg .note:before{content:"";position:absolute;left:8px;top:calc(8px + var(--px-m)*4);width:calc(var(--px-m)*4);height:calc(var(--px-m)*4);background:#e0533d;box-shadow:var(--px-m) var(--px-m) 0 #9e2f2a}
.dlg .note small{display:block;margin-top:4px;color:#9a8a7a}
.dlg .note .cur{display:inline-block;width:calc(var(--px-m)*6);height:calc(var(--px-m)*11);margin-left:var(--px-m);vertical-align:calc(var(--px-m)*-1);background:#3a2630;animation:dlgblink .8s steps(2) infinite}
@keyframes dlgblink{50%{opacity:0}}
.dlg .task{margin:0 0 8px;color:#fff4dc}
.dlg .task:before{content:"任务";margin-right:8px;padding:0 calc(var(--px-s)*4);font-size:var(--fs-s);line-height:var(--lh-s);color:#241a2e;background:#ffd84a}
.dlg .txt{margin:0 0 8px;color:#d8cce4;white-space:pre-line}
.dlg .h{margin:4px 0 8px;color:#ffd84a}
.dlg ol{list-style:none;margin:0 0 8px;padding:0 var(--d2);display:grid;gap:8px}
.dlg ol.c2{grid-template-columns:1fr 1fr}
.dlg ol li{position:relative;display:flex;align-items:center;gap:12px;padding:4px 12px 4px calc(var(--fs-s) + 16px);cursor:pointer;background:#261c34;box-shadow:inset 0 0 0 var(--d2) #4a3a5c}
.dlg ol li:hover{box-shadow:inset 0 0 0 var(--d2) #8a7a9a}
.dlg ol li kbd.n{flex:none;margin:0}
.dlg ol li canvas{flex:none;width:calc(var(--px-s)*44);height:calc(var(--px-s)*40);background:#3a2c4c}
.dlg ol li small{display:block;font-size:var(--fs-s);line-height:var(--lh-s);color:#b9a8c9}
.dlg ol li.on{color:#241a2e;background:#ffd84a;box-shadow:inset 0 0 0 var(--d2) #c09a26}
.dlg ol li.on small{color:#5a4320}
.dlg ol li.on kbd.n{color:#241a2e;background:#f0c63a;box-shadow:inset 0 calc(var(--d2)*-1) #b8962a}
.dlg ol li.on:before{content:"▶";position:absolute;left:8px;top:calc(50% - var(--lh-s)/2);font-size:var(--fs-s);line-height:var(--lh-s);color:#241a2e}
.dlg ol li.wrong{cursor:default;color:#8a7a9a;background:#2a2036;box-shadow:inset 0 0 0 var(--d2) #3a2c4c}
.dlg ol li.wrong b{text-decoration:line-through;text-decoration-thickness:var(--px-m)}
.dlg ol li.wrong small{color:#f7a58c}
.dlg .say{display:flex;gap:12px;align-items:flex-start;margin:0 0 8px}
.dlg .say canvas{flex:none;width:calc(var(--px-s)*44);height:calc(var(--px-s)*40);margin:var(--d2);background:#3a2c4c;box-shadow:0 0 0 var(--d2) #4a3a5c}
.dlg .say div{flex:1;padding:4px 12px;background:#3a2c4c}
.dlg .say b{margin-right:8px;color:#ffd84a}
.dlg ul.steps{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:4px}
.dlg ul.steps li{display:flex;gap:8px;align-items:baseline;color:#d8cce4}
.dlg ul.steps li:before{content:"";flex:none;width:calc(var(--px-m)*8);height:calc(var(--px-m)*8);box-shadow:inset 0 0 0 var(--d2) #b9a8c9;transform:translateY(var(--px-m))}
.dlg ul.steps li.done{color:#9ccc98}
.dlg ul.steps li.done:before{background:#7ee08a;box-shadow:inset 0 0 0 var(--d2) #7ee08a,inset 0 0 0 calc(var(--d2)*2) #2f2340}
.dlg ul.steps li.cur{color:#ffd84a}
.dlg ul.steps li.cur:before{box-shadow:inset 0 0 0 var(--d2) #ffd84a}
.dlg ul.steps small{font-size:var(--fs-s);line-height:var(--lh-s);color:#8a7a9a}
.dlg .prog{position:relative;height:calc(var(--d2)*6);margin:4px 0 8px;background:#140e1a;box-shadow:inset 0 0 0 var(--d2) #4a3a5c}
.dlg .prog i{position:absolute;left:var(--d2);top:var(--d2);bottom:var(--d2);max-width:calc(100% - var(--d2)*2);background:repeating-linear-gradient(90deg,#7ee08a 0 calc(var(--d2)*4),#5b8c5a 0 calc(var(--d2)*5))}
.dlg .progt{margin:-4px 0 8px;font-size:var(--fs-s);line-height:var(--lh-s);color:#b9a8c9}
.dlg .right{display:flex;gap:8px;align-items:baseline;margin:0 0 8px;color:#9ccc98}
.dlg .right:before{content:"";flex:none;width:calc(var(--px-m)*7);height:calc(var(--px-m)*6);background:currentColor;-webkit-mask:var(--i-ck) 0 0/100% 100%;mask:var(--i-ck) 0 0/100% 100%}
.dlg .result{margin:4px var(--u) 8px 0;padding:4px 12px;color:#241a2e;background:#ffd84a;box-shadow:var(--u) var(--u) 0 #140e1a}
.dlg .code{display:flex;align-items:center;gap:16px;margin:4px 0 12px}.dlg .code span{color:#b8aac8}
.dlg .code b{padding:4px 12px;font-size:var(--fs-l);line-height:var(--lh-l);letter-spacing:calc(var(--px-l)*2);color:#241a2e;background:#ffd84a;box-shadow:0 0 0 var(--d2) #241a2e,0 0 0 calc(var(--d2)*2) #ffd84a;user-select:all}
.dlg .made{display:flex;gap:16px;align-items:center;margin:4px var(--u) 8px 0;padding:8px 16px;color:#241a2e;background:#ffd84a;box-shadow:var(--u) var(--u) 0 #140e1a}
.dlg .made canvas{flex:none;width:calc(var(--px-s)*44);height:calc(var(--px-s)*44);background:#fff8e8;box-shadow:0 0 0 var(--d2) #241a2e}
.dlg .made b{display:block}
.dlg .made span{display:block;font-size:var(--fs-s);line-height:var(--lh-s)}.dlg .made span:before{content:"下一步 ▸ "}
.dlg .book{margin:0 var(--u) 8px 0;padding:8px 12px 8px calc(var(--u)*2 + 12px);color:#3a2630;background:#f4ecd8;box-shadow:inset calc(var(--u)*2) 0 #8a5a3a,var(--u) var(--u) 0 #140e1a}
.dlg .links{display:grid;grid-template-columns:repeat(auto-fit,minmax(208px,1fr));gap:12px;margin:4px var(--d2) 8px}
.dlg .links button{all:unset;box-sizing:border-box;cursor:pointer;padding:8px 12px;color:#fff4dc;background:#261c34;box-shadow:inset 0 0 0 var(--d2) #4a3a5c}
.dlg .links button:hover,.dlg .links button.on{background:#3a2c4c;box-shadow:inset 0 0 0 var(--d2) #ffd84a}
.dlg .links b:after{content:" ↗";color:#ffd84a}
.dlg .links small{display:block;font-size:var(--fs-s);line-height:var(--lh-s);color:#b9a8c9}
.dlg .links .got{margin-left:8px;padding:0 calc(var(--px-s)*3);font-size:var(--fs-s);line-height:var(--lh-s);color:#e0533d;box-shadow:inset 0 0 0 var(--d2) #e0533d}
.dlg dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0 0 8px}
.dlg dt{color:#ffd84a}.dlg dd{margin:0;color:#d8cce4}
.dlg .ft{display:flex;gap:16px;align-items:center;margin-top:8px;padding-top:12px;background:linear-gradient(90deg,#4a3a5c 50%,transparent 0) 0 0/calc(var(--d2)*4) var(--d2) repeat-x}
.dlg .ft .tipsb{flex:1}.dlg .ft .sp{flex:1}
.dlg .acts{display:flex;gap:8px;flex:none}`;
(()=>{if(typeof document==='undefined'||document.getElementById('dlg-css'))return;const s=document.createElement('style');s.id='dlg-css';s.textContent=DLG_CSS;document.head.appendChild(s)})();

const htmlEsc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// 猫猫咖啡馆的 Tips 牌子（docs/店内设计.md 第十二节）：t 是一句特性，l 是 LINKS 的键——有链接才有金色的"了解更多 ↗"，点它的地方各自接 openLink（新标签页打开、盖章）
function tipsHTML(t,l,{more=true,cls=''}={}){const L=l&&typeof LINKS!=='undefined'?LINKS[l]:null;   // cls:'v' 窄的地方用：字排满整块，按钮在右下角
  return `<div class="tipsb win sm${cls?' '+cls:''}"><i class="tb"><i></i>TIPS</i><p>${htmlEsc(t)}</p>${more&&L?`<button class="more pbtn" data-link="${htmlEsc(l)}" title="${htmlEsc(L.n+(L.sub?'：'+L.sub:''))}">了解更多 ↗</button>`:''}</div>`}
// 提示里的按键换成像素键帽："E · 叼一颗" → [E] 叼一颗。认 E、Q、Esc、Shift、WASD、空格、方向键、↑↓←→（前后不挨着字母数字才算）
const KEYCAP_RE=/(^|[^A-Za-z0-9])(Esc|Shift|WASD|E|Q|空格|方向键|[←→↑↓]{1,4})(?![A-Za-z0-9])/g;
function keycaps(s){return htmlEsc(s).replace(/(^|· )(E|Q|Esc|WASD) · /g,'$1$2 ').replace(KEYCAP_RE,(m,a,k)=>a+'<kbd>'+k+'</kbd>')}

// 像素头像：坐着的猫（pal 是 PAL 的下标；店猫用它自己的默认表情）
// charm：戴着的挂坠（world-charms.js），挂在项圈正中间
function drawPortrait(cv,pal,t=0,ex,charm){const c=cv.getContext('2d');cv.width=22;cv.height=20;c.clearRect(0,0,22,20);const o=C;use(c);
  const P=POSE.sit(t,0,0,ex||(pal<7?PERSONA[pal].face:'normal')),B=PAL[pal]||PAL[0];drawF(C,P.G,B,11,20,{cx:P.cx,blink:P.blink});
  if(charm&&typeof charmImg==='function'&&CHARMS[charm]){const cc=collarOf(P.G);if(cc)C.drawImage(charmImg(charm,B.outline,0),Math.round(11-P.cx+cc[0])-2,20-P.G.length+cc[1])}use(o)}
// 织好的小东西（围巾、毛线帽……），11×11 画布居中
function drawKnit(cv,kind,ci=0){const c=cv.getContext('2d');cv.width=11;cv.height=11;c.clearRect(0,0,11,11);const o=C;use(c);const h=KNIT[kind].length;knit(kind,5,Math.floor((11-h)/2),ci);use(o)}
function drawIcon(cv,kind,ci=0,t=0){const c=cv.getContext('2d');cv.width=16;cv.height=16;c.clearRect(0,0,16,16);const o=C;use(c);
  if(kind==='yarn')yarnBall(8,8,5,ci,Math.floor(t*4));else if(kind==='book'){R(2,4,12,9,OL);R(3,4,5,7,'#fff8e8');R(8,4,5,7,'#f4ecd8');R(3,11,10,1,'#8a5a3a')}
  else if(kind==='sign'){R(7,2,2,13,OL);R(1,4,11,4,OL);R(2,5,9,2,'#e8dccb');R(12,5,2,2,OL);R(4,9,10,4,OL);R(5,10,8,2,'#a8d0f0')}
  else if(kind==='star'){R(7,2,2,12,'#ffd84a');R(2,7,12,2,'#ffd84a');R(5,5,6,6,'#ffd84a');R(7,7,2,2,'#fff8e0')}
  else if(kind==='mail'){R(3,3,10,8,OL);R(4,4,8,6,'#e0533d');R(5,6,6,1,OL);R(7,11,2,4,OL)}
  else if(kind==='film'){R(2,3,12,10,OL);R(3,4,10,8,'#3a3a48');for(let i=0;i<4;i++){R(4+i*3,4,1,1,'#fff4dc');R(4+i*3,11,1,1,'#fff4dc')}R(4,6,8,4,'#8ab8ff');R(5,7,3,2,'#ffd84a')}
  else if(kind==='tool'){grid(4,3,TOOLS_PX.wrench,{o:OL,'.':'#b4bcc8'})}
  else if(kind==='bell'){grid(2,3,[".....o.....","....ooo....","...owwwo...","..owwwwso..",".owwwwwwso.",".owwwwwwso.","ooooooooooo"],{o:OL,w:'#f4f8fc',s:'#b8c4d0','.':null});R(1,10,13,2,'#c98a5a');R(1,11,13,1,'#8a5a3a')}
  else if(kind==='gate'){R(2,3,3,11,OL);R(11,6,3,8,OL);R(4,8,8,2,'#e0533d');R(3,4,1,2,'#7ee08a')}
  else if(kind==='fish'){grid(1,4,["....ooooo..oo","..oobbbbbo.obo",".obbeobbbbobbo","obbbbbbbbbbbo.",".obbbbbbbbobbo","..ooooooooo.oo"],{o:OL,b:'#5B9BD5',e:'#241a2e','.':null})}
  else if(kind==='tree'){disc(8,6,7,5,OL);disc(8,6,6,4,'#e3a92c');disc(6,5,3,2,'#f7c940');R(6,10,4,5,OL);R(7,10,2,5,'#8a5a3a');R(7,11,2,1,'#e0533d');R(7,13,2,1,'#5B9BD5');R(3,15,10,1,OL)}
  else{const P=POSE.sit(t,0,0,'content');C.save();C.scale(.8,.8);drawF(C,P.G,PAL[0],10,20,{cx:P.cx});C.restore()}use(o)}

function makeDialog(root,cb={},{isStatic=false}={}){
  root.className='dlg'+(isStatic?' static':'');root.innerHTML='<div class="in win"><div class="hd"></div><div class="bd"></div><div class="ft"></div></div>';
  const hd=root.querySelector('.hd'),bd=root.querySelector('.bd'),ft=root.querySelector('.ft');
  let spec=null,cur=0,typed={},typing=null,chKey='';
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function render(s){spec=s;if(!s){root.style.display='none';typing=null;return}root.style.display='block';
    const h=s.head||{};hd.innerHTML=`<canvas></canvas><b>${esc(h.title)}</b>${(h.chips||[]).map((c,i)=>`<span class="chip${i===(h.chips.length-1)&&s.kind==='quest'?' k':''}">${esc(c)}</span>`).join('')}${isStatic?'':'<span class="hint">'+keyHint(s)+'</span>'}`;
    drawIcon(hd.querySelector('canvas'),h.icon,h.ci);
    let html='';if(s.note){const full=typed[s.noteKey]||isStatic;html+=`<div class="note"><span class="nt">${full?esc(s.note):''}</span>${full?'':'<i class="cur"></i>'}<small>—— 门缝里塞进来的便签${h.chips&&h.chips[0]?' · '+esc(h.chips[0]):''}</small></div>`}
    const ch=(s.blocks||[]).find(b=>b.k==='choices'),key=ch?ch.items.map(i=>i.t+i.state).join('|'):'';if(key!==chKey){chKey=key;cur=ch?Math.max(0,ch.items.findIndex(i=>i.state!=='wrong')):0}
    for(const b of s.blocks||[]){
      if(b.k==='text')html+=`<p class="txt">${esc(b.t)}</p>`;else if(b.k==='h')html+=`<p class="h">${esc(b.t)}</p>`;else if(b.k==='task')html+=`<p class="task">${esc(b.t)}</p>`;
      else if(b.k==='choices')html+=`<ol${b.cols===2?' class="c2"':''}>`+b.items.map((it,i)=>`<li data-i="${i}" class="${it.state==='wrong'?'wrong':(isStatic?i===s.sel:i===cur)?'on':''}"><kbd class="n">${i+1}</kbd>${it.pal!=null?`<canvas data-pal="${it.pal}"></canvas>`:''}<div><b>${esc(it.t)}</b>${it.sub||it.why?`<small>${esc(it.why||it.sub)}</small>`:''}</div></li>`).join('')+'</ol>';
      else if(b.k==='say')html+=`<div class="say"><canvas data-pal="${b.pal}"></canvas><div><b>${esc(b.name)}</b>${esc(b.t)}</div></div>`;
      else if(b.k==='steps')html+='<ul class="steps">'+b.items.map(it=>`<li class="${it.done?'done':it.cur?'cur':''}"><span>${esc(it.t)}${it.sub?` <small>${esc(it.sub)}</small>`:''}</span></li>`).join('')+'</ul>';
      else if(b.k==='progress')html+=`<div class="prog"><i style="width:${Math.round((b.p||0)*100)}%"></i></div>${b.t?`<p class="progt">${esc(b.t)}</p>`:''}`;
      else if(b.k==='code')html+=`<div class="code"><span>${esc(b.label||'')}</span><b>${esc(b.t)}</b></div>`;
      else if(b.k==='right')html+=`<p class="right">${esc(b.t)}</p>`;else if(b.k==='result')html+=`<p class="result">${esc(b.t)}</p>`;else if(b.k==='made')html+=`<div class="made"><canvas data-knit="${b.kind}" data-ci="${b.ci||0}"></canvas><div><b>${esc(b.t)}</b>${b.next?`<span>${esc(b.next)}</span>`:''}</div></div>`;else if(b.k==='book')html+=`<div class="book">${esc(b.t)}</div>`;
      else if(b.k==='links')html+='<div class="links">'+b.items.map(it=>`<button data-link="${it.key}"><b>${esc(it.n)}</b>${cb.visited&&cb.visited(it.key)?'<span class="got">已盖章</span>':''}<small>${esc(it.sub)}${it.url?'':'（地址待填）'}</small></button>`).join('')+'</div>';
      else if(b.k==='words')html+='<dl>'+b.items.map(([w,d])=>`<dt>「${esc(w)}」</dt><dd>${esc(d)}</dd>`).join('')+'</dl>'}
    bd.innerHTML=html;bd.querySelectorAll('canvas[data-pal]').forEach(cv=>drawPortrait(cv,+cv.dataset.pal));bd.querySelectorAll('canvas[data-knit]').forEach(cv=>drawKnit(cv,cv.dataset.knit,+cv.dataset.ci));
    // 底部：左边猫猫咖啡馆的 Tips 牌子，右边按钮（按键写在按钮上的键帽里；E 那个是金色的）
    const tip=s.tip;ft.innerHTML=(tip&&tip.t?tipsHTML(tip.t,tip.l):'<div class="sp"></div>')+
      `<div class="acts">${(s.acts||[]).map(a=>`<button data-act="${a.id}" class="${a.key==='E'?'pbtn':'lbtn'}">${a.key?`<kbd>${a.key}</kbd>`:''}${esc(a.t)}</button>`).join('')}</div>`;
    ft.style.display=tip||(s.acts||[]).length?'flex':'none';
    if(s.note&&!typed[s.noteKey]&&!isStatic)startType(s)}
  function keyHint(s){const ch=(s.blocks||[]).some(b=>b.k==='choices');return (ch?'<kbd>↑↓</kbd> 选择 · ':'')+'<kbd>E</kbd> 确定 · <kbd>Esc</kbd> '+((s.acts||[]).some(a=>a.id==='later')?'收起':'关闭')}
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
