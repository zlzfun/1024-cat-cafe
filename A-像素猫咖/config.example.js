/* 1024 猫咖 · 部署配置样例。复制成 config.js 再改（config.js 不进仓库：内网地址只写在那里）。
   没有 config.js 也能开：那就是本机模式，名册存在这台浏览器里。用 server/server.js 发网页时，没有 config.js 它会现给一份 {api:'/api'}。 */
window.CAT1024_CONFIG = {
  api: '/api',             // 服务端地址；空着 = 本机模式
  links: {
    inner: '',             // 内源主页（内网地址）
  },
  bots: 40,                // 补位的机器人：这个数减去在线的真人数（最少留 12 只）
  // ws: 'wss://…/ws',     // 联机地址；不写就用接口同一台服务器的 /ws
};
