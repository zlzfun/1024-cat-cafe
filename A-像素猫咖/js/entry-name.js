/* 1024 猫咖 · 进店第二步的后半：给猫挑个名字。表单是 DOM，接在 Clowder 动画最后那一格上（位置见 CW.fieldRect）。
   名字都是店里给的（Account.NAMES：一个口味 + 一样点心），只发此刻没有猫用的，所以不用打字、不用查重。
   一排六个名字牌，第一个默认选中；点一个或 ← → 换，"换一批"再来六个；"就叫它"或回车定下来。
   EN.show({msg}) → Promise：{name}。msg 是回到这一步时要说的话（比如挑好的名字刚被别的猫占了）。 */
const EN=(()=>{
const N=6,esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const HINT='店里用这个名字叫它，别的猫也看得见';

function show(o={}){const ui=EK.ui,r=CW.fieldRect(innerWidth,innerHeight);
  return new Promise(res=>{let names=[],sel=-1,seq=0,busy=false;
    const root=document.createElement('div');root.className='nm';ui.appendChild(root);
    // 名字框和 Clowder 动画最后那一格叠在一起（里面便签纸色，框是店里的像素窗框，画在框外面）；左边对到整的屏幕像素上，像素字才不发虚
    const X=window.PXF?PXF.snap(r.x):r.x;
    root.innerHTML=`<h2 class="nm-t" style="bottom:calc(100% - ${r.y-20}px)">给你的猫挑个名字</h2>
      <div class="pxf win" style="left:${X}px;top:${r.y}px;width:${r.w}px"><div class="nm-val" aria-live="polite"></div></div>
      <div class="nm-low" style="top:${r.y+r.h+28}px;left:${X-8}px;width:${r.w+16}px">
        <p class="nm-st"></p><div class="nm-sug"></div>
        <div class="nm-acts"><button class="nm-go pbtn" disabled>就叫它</button></div></div>`;
    const $=q=>root.querySelector(q),go=$('.nm-go'),val=$('.nm-val');
    const status=(t,cls='')=>{const p=$('.nm-st');p.className='nm-st '+cls;p.innerHTML=t};
    const paint=()=>{val.textContent=sel>=0?names[sel]:'';root.querySelectorAll('.nm-sug [data-i]').forEach(b=>b.classList.toggle('on',+b.dataset.i===sel));go.disabled=busy||sel<0};
    // 要一批此刻没有猫用的名字；换一批时把这一批告诉店里，别再给
    async function fill(){const my=++seq;busy=true;paint();if(!names.length&&!o.msg)status('挑几个还空着的名字……','wait');
      const j=await Account.offer(N,names);if(my!==seq||!root.isConnected)return;busy=false;
      if(!j.names||!j.names.length){status('店门口网不好，<a>再试一次</a>','bad');$('.nm-st a').onclick=fill;paint();return}
      names=j.names;sel=0;const box=$('.nm-sug');
      box.innerHTML=names.map((n,i)=>`<button type="button" class="lbtn" data-i="${i}">${esc(n)}</button>`).join('')+'<button type="button" class="lbtn re">换一批</button>';
      box.querySelectorAll('button').forEach(b=>b.onclick=()=>{Sound.sfx('tick');if(b.classList.contains('re')){fill();return}sel=+b.dataset.i;paint();go.focus()});
      if(!o.msg)status(HINT);paint();go.focus()}
    function submit(){if(busy||sel<0)return;Sound.sfx('ok');done({name:names[sel]})}
    go.onclick=submit;
    const onKey=e=>{if(!root.isConnected||busy||!names.length)return;
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();sel=(sel+(e.key==='ArrowLeft'?-1:1)+names.length)%names.length;Sound.sfx('tick');paint();go.focus();return}
      if(e.key==='Enter'&&!(document.activeElement&&document.activeElement.tagName==='BUTTON')){e.preventDefault();submit()}};
    addEventListener('keydown',onKey);
    function done(v){removeEventListener('keydown',onKey);root.classList.add('leave');setTimeout(()=>root.remove(),260);res(v)}
    if(o.msg)status(esc(o.msg),'bad');fill()})}
return{show}})();
