/* 1024 猫咖 · 上下楼：楼梯口能点、能按 E；换层时告诉页面（大字"二楼"）。依赖 world-play.js（A.PORT、A.transit）。
   楼梯口自己会上下（走进去就换层，见 world-play.js），这里只是让它像别的东西一样能被点到、悬停有名字。图鉴不收楼梯。 */
WORLD_MODS.push(A=>{
const {S,me,run,T,PORT,FLID}=A;
// 每个会自己上下的口子（楼梯）都是一样能点的东西：id 以 st: 开头，图鉴不收
PORT.filter(p=>p.auto).forEach(p=>{const z=p.zone,up=A.FL.indexOf(FLID[p.to])>A.FL.indexOf(FLID[p.from]);
  T({id:'st:'+p.id,n:p.n,hit:[z[0]-6,z[1]-6,z[2]+12,z[3]+40],at:p.at,near:[z[0]-10,z[1]-6,z[2]+20,z[3]+30],label:(up?'上楼：':'下楼：')+FLID[p.to].n,
    go(c){run(c,[{go:p.at},{portal:p}])}})});
// 换了一层：页面出一行大字（第一次上屋顶时镜头往上摇，由页面在第一次进这间房时触发 A.reveal）
A.onFloor=(f,p)=>{if(A.ui.floor)A.ui.floor(f)};
});
