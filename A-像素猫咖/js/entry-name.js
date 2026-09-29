/* 1024 猫咖 · 进店第二步的后半：给猫取名字（或者领回来过的猫）。表单是 DOM，接在 Clowder 动画最后那一格上（位置见 CW.fieldRect）。
   - 取名：边打字边查"这个名字有没有猫用"；下面一排建议名字（只给还没被占的）；名字被占了，可以换一个，或者说"这是我的猫"去对暗号。
   - 领回：名字 + 暗号（九个图案里按顺序点四个）。暗号输错有次数限制，超了要等一会儿（服务端也按同样的规矩数）。
   EN.show(mode, {name, msg}) → Promise：{mode:'new', name} 或 {mode:'back', cat}
   EN.pad(el, {onChange, onDone}) → 暗号面板（扭蛋那一步刻项圈牌也用它）：{code, clear(), set(code), shake()} */
const EN=(()=>{
const POOL=`年糕 汤圆 芝麻 豆包 布丁 团子 麻薯 栗子 奶盖 拿铁 摩卡 可颂 曲奇 泡芙 抹茶 焦糖 桂花 薄荷 海盐 芝士 吐司 蛋挞 小笼 烧卖 馄饨 春卷 柚子 青提 蓝莓 草莓 山楂
  棉花糖 糖葫芦 小鱼干 毛线团 煤球 雪球 大橘 二花 小满 阿福 豆花 冰粉 芋圆 米粒 毛豆 锅巴 酥酥 嘟嘟 奥利奥 可乐 燕麦 南瓜 橙子 柠檬 松饼 贝果 奶茶 花卷
  单测喵 重构喵 回滚喵 断点喵 编译喵 提交喵 分支喵 灰度喵 缓存喵 日志喵 摸鱼喵 值班喵 评审喵 发布喵`.split(/\s+/);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const variants=n=>[...new Set(['小'+n,n+'二号',n.endsWith('喵')?n+n.slice(-1):n+'喵','大'+n,n+'酱'])].filter(v=>!Account.rule(v));
const iconCv=(i,k=4)=>{const c=document.createElement('canvas');c.width=c.height=9;const o=C;use(c.getContext('2d'));EA.icon(i,0,0);use(o);c.style.width=c.style.height=9*k+'px';return c};

/* ---------- 暗号面板 ---------- */
function pad(el,{onChange,onDone}={}){el.innerHTML=`<div class="cp-slots">${'<i></i>'.repeat(Account.CODE_LEN)}</div><div class="cp-grid">${Account.ICONS.map((n,i)=>`<button type="button" data-i="${i}" title="${n}"><b>${i+1}</b></button>`).join('')}</div>`;
  el.querySelectorAll('.cp-grid button').forEach((b,i)=>b.prepend(iconCv(i)));
  let code=[];const slots=[...el.querySelectorAll('.cp-slots i')];
  const draw=()=>{slots.forEach((s,i)=>{s.innerHTML='';s.classList.toggle('on',code[i]!=null);if(code[i]!=null)s.appendChild(iconCv(code[i],3))});onChange&&onChange(code.slice())};
  const add=i=>{if(code.length>=Account.CODE_LEN)return;code.push(i);Sound.sfx('engrave');draw();if(code.length===Account.CODE_LEN)onDone&&onDone(code.slice())};
  el.querySelector('.cp-grid').addEventListener('click',e=>{const b=e.target.closest('button');if(b)add(+b.dataset.i)});
  const api={get code(){return code.slice()},add,back(){code.pop();draw()},clear(){code=[];draw()},set(c){code=c.slice();draw()},
    shake(){el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')},
    key(e){if(/^[1-9]$/.test(e.key)){add(+e.key-1);return true}if(e.key==='Backspace'&&!(e.target&&e.target.tagName==='INPUT'&&e.target.value)){api.back();return true}return false}};
  draw();return api}

/* ---------- 表单 ---------- */
function show(mode='new',o={}){const ui=EK.ui,W=innerWidth,H=innerHeight,r=CW.fieldRect(W,H);
  return new Promise(res=>{let cur=mode,checkT=0,seq=0,sseq=0,state={ok:false},sug=[],pd=null,busy=false;
    const root=document.createElement('div');root.className='nm';ui.appendChild(root);
    const render=()=>{const back=cur==='back';root.className='nm '+cur;
      root.innerHTML=`<h2 class="nm-t" style="top:${r.y-50}px">${back?'领回你的猫':'给你的猫取个名字'}</h2>
        <div class="pxf" style="left:${r.x-6}px;top:${r.y-6}px;width:${r.w+12}px"><div class="o2"><input class="nm-in" maxlength="16" autocomplete="off" spellcheck="false" placeholder="${back?'它叫什么名字':''}"></div></div>
        <div class="nm-low" style="top:${r.y+r.h+16}px;left:${r.x-6}px;width:${r.w+12}px">
          <p class="nm-st"></p>
          ${back?`<div class="nm-lab">暗号<small>按顺序点四个图案，也可以按数字键</small></div><div class="cp" tabindex="0"></div>`:`<div class="nm-sug"></div>`}
          <div class="nm-acts"><button class="nm-go pbtn" disabled>${back?'领回来':'就叫它'}</button></div>
          <p class="nm-alt">${back?'<a data-go="new">我是新来的，取个新名字</a>':'<a data-go="back">来过了？领回我的猫</a>'}</p></div>`;
      const inp=root.querySelector('.nm-in');inp.value=o.name||'';o.name='';
      if(back){pd=pad(root.querySelector('.cp'),{onChange:upd,onDone:()=>{if(inp.value.trim())submit()}})}else{pd=null;fillSug()}
      root.querySelector('.nm-alt a').onclick=()=>{o.name=inp.value.trim();cur=cur==='new'?'back':'new';render()};
      root.querySelector('.nm-go').onclick=submit;
      inp.addEventListener('input',()=>{upd();if(cur==='new'){clearTimeout(checkT);checkT=setTimeout(check,220)}});
      inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();if(cur==='back'&&pd&&pd.code.length<Account.CODE_LEN&&val()){$('.cp').focus();return}submit()}});
      requestAnimationFrame(()=>inp.focus());status(o.msg||(back?'':'店里用这个名字叫它，别的猫也看得见'),o.msg?'bad':'');o.msg='';upd();if(!back&&inp.value)check()};
    const $=q=>root.querySelector(q),val=()=>$('.nm-in').value.normalize('NFKC').trim();
    function status(t,cls=''){const p=$('.nm-st');p.className='nm-st '+cls;p.innerHTML=t}
    function upd(){const go=$('.nm-go');if(cur==='back'){go.disabled=busy||!val()||!pd||pd.code.length<Account.CODE_LEN;return}
      const bad=Account.rule(val());if(bad&&val()){status(esc(bad.why),'bad');state={ok:false}}else if(!val()){status('店里用这个名字叫它，别的猫也看得见');state={ok:false}}go.disabled=busy||!state.ok||state.name!==val()}
    async function check(){const n=val();if(!n||Account.rule(n))return;const my=++seq;status('看看有没有猫叫这个……','wait');const r=(await Account.check([n]))[n]||{};if(my!==seq||n!==val())return;
      if(r.ok){state={ok:true,name:n};status(r.unsure?'连不上店里的名册，先这么定，进门时再核对':'✓ 还没有猫叫这个名字','good')}
      else{state={ok:false};if(r.taken){status(`${esc(r.why)}。换一个，或者 <a data-go="mine">这就是我的猫</a>`,'bad');const a=$('.nm-st a');if(a)a.onclick=()=>{o.name=n;cur='back';render()};fillSug(variants(n))}else status(esc(r.why),'bad')}upd()}
    async function fillSug(first=[]){const box=$('.nm-sug');if(!box)return;const my=++sseq;const cand=[...first,...shuffle(POOL)].slice(0,16),r=await Account.check(cand);if(my!==sseq)return;
      sug=cand.filter(n=>r[n]&&r[n].ok).slice(0,6);if(!box.isConnected)return;box.innerHTML=`<span>${first.length?'还空着的':'试试'}</span>`+sug.map(n=>`<button type="button">${esc(n)}</button>`).join('')+'<button type="button" class="re">换一批</button>';
      box.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.classList.contains('re')){fillSug();return}const inp=$('.nm-in');inp.value=b.textContent;state={ok:true,name:b.textContent};status('✓ 还没有猫叫这个名字','good');upd();inp.focus();Sound.sfx('tick')})}
    async function submit(){if(busy)return;const n=val();
      if(cur==='new'){if(!state.ok||state.name!==n){if(n&&!Account.rule(n))check();else $('.nm-in').focus();return}done({mode:'new',name:n});return}
      if(!n||!pd||pd.code.length<Account.CODE_LEN){(n?$('.cp'):$('.nm-in')).focus?.();return}
      busy=true;upd();status('对一下暗号……','wait');const r=await Account.login(n,pd.code);busy=false;
      if(r.cat){Sound.sfx('ok');done({mode:'back',cat:r.cat});return}
      Sound.sfx('no');pd.shake();pd.clear();
      if(r.err==='none'){status(`店里没有叫「${esc(n)}」的猫。<a data-go="new">是新来的吗？</a>`,'bad');const a=$('.nm-st a');if(a)a.onclick=()=>{o.name=n;cur='new';render()}}
      else if(r.err==='code')status(r.left>0?`暗号不对，还能再试 ${r.left} 次`:'暗号不对','bad');
      else if(r.err==='lock')status(`试错太多次了，${Math.ceil(r.wait/60)} 分钟以后再来`,'bad');
      else status('店门口网不好，等一下再试','bad');upd()}
    const onKey=e=>{if(!root.isConnected)return;if(cur==='back'&&pd&&document.activeElement!==$('.nm-in')&&pd.key(e)){e.preventDefault();upd();return}
      if(e.key==='Enter'&&cur==='back'&&document.activeElement!==$('.nm-in')){e.preventDefault();submit()}};
    addEventListener('keydown',onKey);
    function done(v){removeEventListener('keydown',onKey);root.classList.add('leave');setTimeout(()=>root.remove(),260);res(v)}
    render()})}
return{show,pad,iconCv,variants}})();
