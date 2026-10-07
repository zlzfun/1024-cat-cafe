/* 1024 猫咖 · 画布上的中文像素字：舞台的 Tips 大屏、地下门厅的海报、招牌、电影字幕这类画在像素图里的字。
   字体是 fonts/ 里裁剪过的缝合像素字体（12px，一个点就是画布上的 1 像素，跟着画面一起放大；见 fonts/README.md）。
   - PXT.ready：字体加载好（或者加载失败、落回系统字体）以后 resolve。页面建店之前等它一下，免得底图里的字先用系统字体画上去。
   - PXT.w(s)：这串字在 12px 下有多宽（像素）。PXT.H：一行占 16 像素高（字在第 1～13 行，基线在第 13 行）。
   - PXT.draw(s,x,y,col,{shadow,a})：画在当前画布（scene-kit 的 C）上，(x,y) 是这行字的左上角；返回宽度。
     先画到一张小画布上，把半透明的点按阈值变成实心或透明（像素画里不要灰边），按"字 + 颜色"缓存；字体没加载好之前画的不进缓存。
   - PXT.fit(s,w)：截到 w 像素宽以内（截掉的地方加"…"）。 */
const PXT=(()=>{
  const FAM='FusionPixel',SZ=12,H=16,BASE=13;let ok=false;
  const font=`${SZ}px ${FAM},"PingFang SC","Microsoft YaHei",sans-serif`;
  const ready=(()=>{try{if(typeof FontFace!=='function'||!document.fonts)return Promise.resolve();const f=new FontFace(FAM,'url(fonts/fusion-pixel-12.woff2)');document.fonts.add(f);
    return f.load().then(()=>{ok=true}).catch(()=>{})}catch(e){return Promise.resolve()}})();
  const mc=document.createElement('canvas').getContext('2d');
  function w(s){mc.font=font;return Math.ceil(mc.measureText(String(s)).width)}
  function bake(s,col){const W=Math.max(1,w(s)),cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.font=font;x.textBaseline='alphabetic';x.fillStyle=col;x.fillText(s,0,BASE);
    const d=x.getImageData(0,0,W,H),p=d.data;for(let i=3;i<p.length;i+=4)p[i]=p[i]>=110?255:0;x.putImageData(d,0,0);return cv}
  const cache=new Map();
  function get(s,col){s=String(s);const k=col+'|'+s;let c=cache.get(k);if(c)return c;c=bake(s,col);if(ok){cache.set(k,c);if(cache.size>800)cache.delete(cache.keys().next().value)}return c}
  function draw(s,x,y,col='#fff4dc',o={}){if(typeof C==='undefined'||!C)return 0;s=String(s);if(!s)return 0;const X=Math.round(x),Y=Math.round(y),a0=C.globalAlpha;if(o.a!=null)C.globalAlpha=a0*o.a;
    if(o.shadow)C.drawImage(get(s,o.shadow),X+1,Y+1);const cv=get(s,col);C.drawImage(cv,X,Y);C.globalAlpha=a0;return cv.width}
  function fit(s,mw){s=String(s);if(w(s)<=mw)return s;while(s.length&&w(s+'…')>mw)s=s.slice(0,-1);return s+'…'}
  return{ready,w,draw,get,fit,H,FAM,get ok(){return ok}}})();
