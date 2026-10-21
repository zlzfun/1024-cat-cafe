// 现场抽奖的规则测试：node --test
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('./core');
const T0=1_000_000;
// 一等奖 1%（1 份）、二等奖 5%（2 份）、三等奖 10%（不限）；剩下 84% 是谢谢惠顾
function setup(){const s=C.fresh();C.setPrize(s,{tier:1,name:'键盘',prob:1,stock:1},'p1');C.setPrize(s,{tier:2,name:'猫杯',prob:5,stock:2},'p2');
  C.setPrize(s,{tier:3,name:'贴纸',prob:10,stock:null},'p3');return s}
const draw=(s,r)=>C.draw(s,T0,()=>r);   // r 是 [0,1)：r*100 落在 0～1 一等奖，1～6 二等奖，6～16 三等奖，其余谢谢惠顾
const ok=(s,no)=>C.claim(s,no,'W'+no,true,T0);

test('按固定概率：落在哪一段就是哪一档，各档之外是谢谢惠顾并发图鉴卡',()=>{const s=setup();
  assert.equal(draw(s,.005).draw.tier,1);ok(s,1);assert.equal(draw(s,.03).draw.tier,2);ok(s,2);assert.equal(draw(s,.15).draw.tier,3);ok(s,3);
  const d=draw(s,.5).draw;assert.equal(d.tier,0);assert.equal(d.name,'谢谢惠顾');assert.equal(d.card,true);assert.equal(d.prize,null);assert.equal(C.cards(s),1)});

test('每次独立：一等奖的那一段不因为前面抽了什么而变',()=>{const s=setup();for(let i=0;i<5;i++)draw(s,.5);assert.equal(draw(s,.009).draw.tier,1)});

test('某一档发完了，落到它那一段就是谢谢惠顾，不匀给别的奖',()=>{const s=setup();draw(s,.005);ok(s,1);
  const d=draw(s,.005).draw;assert.equal(d.tier,0);assert.equal(s.prizes[0].given,1);
  assert.equal(draw(s,.03).draw.tier,2);ok(s,3);assert.equal(C.loseProb(s),85)});

test('奖品全发完了照样能抽，都是谢谢惠顾',()=>{const s=C.fresh();C.setPrize(s,{tier:1,name:'键盘',prob:100,stock:1},'p1');
  draw(s,.3);ok(s,1);for(let i=0;i<3;i++)assert.equal(draw(s,.3).draw.tier,0);assert.equal(C.loseProb(s),100)});

test('各档概率加起来不能超过 100%；改的时候不算自己原来那份',()=>{const s=setup();
  assert.equal(C.setPrize(s,{tier:3,name:'多',prob:85,stock:1},'q').err,'sum');assert.ok(C.setPrize(s,{tier:3,name:'刚好',prob:84,stock:1},'q').prize);
  assert.ok(C.setPrize(s,{id:'p3',tier:3,name:'贴纸',prob:10,stock:null}).prize);assert.equal(C.setPrize(s,{id:'p3',tier:3,name:'贴纸',prob:10.5,stock:null}).err,'sum')});

test('中了奖没登记，不能抽下一次；登记了就能抽',()=>{const s=setup();draw(s,0);
  assert.deepEqual(draw(s,.9),{err:'pending',no:1});assert.equal(s.draws.length,1);
  assert.equal(C.claim(s,1,' w 001 ',false,T0).draw.emp,'W001');assert.ok(draw(s,.9).draw)});

test('同一个工号又中了：先提醒，force 才登记',()=>{const s=setup();draw(s,0);C.claim(s,1,'W001',false,T0);draw(s,.03);
  assert.deepEqual(C.claim(s,2,'w001',false,T0),{err:'dup',prev:[{no:1,tier:1,name:'键盘'}]});assert.equal(s.draws[1].emp,null);
  assert.equal(C.claim(s,2,'w001',true,T0).draw.emp,'W001')});

test('作废：放回库存，这一档又能抽到了',()=>{const s=setup();draw(s,0);assert.equal(s.prizes[0].given,1);
  assert.equal(C.voidDraw(s,1).draw.void,true);assert.equal(s.prizes[0].given,0);assert.equal(C.winOf(s),null);assert.equal(draw(s,0).draw.tier,1);
  assert.equal(C.voidDraw(s,1).err,'bad');assert.equal(C.claim(s,1,'W1',false,T0).err,'bad')});

test('谢谢惠顾不能登记、不能作废；工号格式不对不收',()=>{const s=setup();draw(s,.9);
  assert.equal(C.claim(s,1,'W1',false,T0).err,'bad');assert.equal(C.voidDraw(s,1).err,'bad');draw(s,0);
  for(const e of ['','x','中文','a b c'.repeat(20)])assert.equal(C.claim(s,2,e,false,T0).err,'bad',e);assert.equal(C.claim(s,9,'W1',false,T0).err,'none')});

test('暂停时不能抽',()=>{const s=setup();C.settings(s,{open:false});assert.deepEqual(draw(s,0),{err:'closed'});C.settings(s,{open:true});assert.ok(draw(s,0).draw)});

test('奖品：参数不对不收；改库存不能少于已发；发出去过的不能删',()=>{const s=setup();
  for(const p of [{tier:0,name:'x',prob:1,stock:1},{tier:4,name:'x',prob:1,stock:1},{tier:1,name:'',prob:1,stock:1},{tier:1,name:'x',prob:-1,stock:1},{tier:1,name:'x',prob:101,stock:1},{tier:1,name:'x',prob:.001,stock:1},{tier:1,name:'x',prob:1,stock:1.5}])
    assert.equal(C.setPrize(s,p,'q').err,'bad',JSON.stringify(p));
  draw(s,0);assert.equal(C.setPrize(s,{id:'p1',tier:1,name:'键盘',prob:1,stock:0}).err,'bad');assert.equal(C.setPrize(s,{id:'p1',tier:1,name:'大键盘',prob:.5,stock:3}).prize.name,'大键盘');
  assert.equal(C.delPrize(s,'p1').err,'bad');assert.equal(C.delPrize(s,'p2').prize.id,'p2');assert.equal(C.setPrize(s,{id:'nope',tier:1,name:'x',prob:1,stock:1}).err,'none')});

test('清空重来：记录清掉、已发归零，奖品设置留着',()=>{const s=setup();draw(s,0);C.claim(s,1,'W1',false,T0);draw(s,.9);C.reset(s);
  assert.equal(s.draws.length,0);assert.equal(s.prizes.length,3);assert.ok(s.prizes.every(p=>p.given===0));assert.equal(C.cards(s),0)});

test('读库：旧版的谢谢惠顾那一档去掉、没有概率的当 0、图鉴卡库存不要了',()=>{
  const s=C.load({card:{stock:5,given:2},prizes:[{id:'a',tier:1,name:'键盘',weight:3,stock:1,given:0},{id:'b',tier:0,name:'谢谢惠顾',weight:8,stock:null,given:4}]});
  assert.equal(s.prizes.length,1);assert.equal(s.prizes[0].prob,0);assert.equal('weight' in s.prizes[0],false);assert.equal('card' in s,false);
  assert.equal(C.draw(s,T0,()=>0).draw.tier,0);assert.deepEqual(C.load(null),C.fresh())});

test('抽很多次，各档出现的比例接近设定的概率',()=>{const s=C.fresh();C.setPrize(s,{tier:1,name:'a',prob:1,stock:null},'a');C.setPrize(s,{tier:2,name:'b',prob:9,stock:null},'b');
  const n={0:0,1:0,2:0};let x=12345;const rnd=()=>(x=(x*16807)%2147483647)/2147483647;
  for(let i=0;i<100000;i++){const d=C.draw(s,T0,rnd).draw;n[d.tier]++;if(d.tier>0)C.claim(s,d.no,'W'+i,true,T0)}
  assert.ok(Math.abs(n[1]/1e5-.01)<.002,String(n[1]));assert.ok(Math.abs(n[2]/1e5-.09)<.005,String(n[2]));assert.ok(Math.abs(n[0]/1e5-.90)<.005,String(n[0]))});

test('同一个编号再来一次：还是那一次，不多抽；中了没登记也照样还回来',()=>{const s=setup();
  const a=C.draw(s,T0,()=>0,'req0001a').draw;const b=C.draw(s,T0,()=>.9,'req0001a');assert.equal(b.again,true);assert.equal(b.draw,a);assert.equal(s.draws.length,1);assert.equal(s.prizes[0].given,1);
  assert.deepEqual(C.draw(s,T0,()=>.9,'req0002b'),{err:'pending',no:1});ok(s,1);assert.equal(C.draw(s,T0,()=>.9,'req0002b').draw.no,2);
  assert.equal(C.draw(s,T0,()=>.9,'BAD id!').draw.req,undefined)});
