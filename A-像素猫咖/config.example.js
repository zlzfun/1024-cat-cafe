/* 1024 猫咖 · 部署配置样例。复制成 config.js 再改（config.js 不进仓库：内网地址只写在那里）。
   没有 config.js 也能开：直接打开 index.html 是本机模式，名册存在这台浏览器里；用 server/server.js 发网页时，没有 config.js 它会现给一份 {api:'api'}。
   deploy.sh 带 --inner、--bots 启动时会替你写好这个文件（只改这两项，文件里别的设置原样留着）。全部配置项见 docs/部署.md 的"配置项一览"。 */
window.CAT1024_CONFIG = {
  api: 'api',              // 服务端地址（相对地址：挂在网站的 /1024-cat-cafe/ 下不用改）；空着 = 本机模式
  links: {
    inner: '',             // 内源主页（内网地址）；没配的话，点了提示"地址还没配"，章照样盖
    // 下面这些默认是公开地址（js/quest-bank.js 的 LINKS），内网有镜像、上不了外网时可以换掉：
    // site 官网 · docs 文档 · github 仓库 · issues 提 issue · releases 下载安装包 · tips 使用小 Tips · concierge 猫猫球设计文档 · evidence 信源卫生设计文档
    // site: 'https://…',
  },
  bots: 40,                // 补位的机器人：这个数减去在线的真人数（最少留 12 只）；组织者后台"店里的设置"里填过的，以后台为准
  // ws: 'wss://…/ws',     // 联机地址；不写就用页面所在路径下的 ws（https://网站/1024-cat-cafe/ → wss://网站/1024-cat-cafe/ws）
};
