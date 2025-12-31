/**
 * Egern 流媒体 & AI 归类检测脚本
 * 格式：国旗 国家 州/省 城市 (无横杠)
 */

(async () => {
  let info = {
    location: "获取中...",
    ip: "获取中...",
    streaming: {},
    ai: {}
  };

  // 并行执行所有请求
  await Promise.all([
    getIPInfo().then(res => {
      info.location = res.location;
      info.ip = res.ip;
    }),
    checkNetflix().then(res => info.streaming.Netflix = res),
    checkDisney().then(res => info.streaming.Disney = res),
    checkHBO().then(res => info.streaming.HBO = res),
    checkTikTok().then(res => info.streaming.TikTok = res),
    checkYouTube().then(res => info.streaming.YouTube = res),
    checkChatGPT().then(res => info.ai.ChatGPT = res),
    checkClaude().then(res => info.ai.Claude = res),
    checkGemini().then(res => info.ai.Gemini = res)
  ]);

  // 拼接面板内容
  let content = `📍 节点地区: ${info.location}\n`;
  content += `🌐 当前 I P : ${info.ip}\n`;
  
  content += `\n🎬 【流媒体服务】\n`;
  content += ` ├ Netflix: ${info.streaming.Netflix}\n`;
  content += ` ├ Disney+: ${info.streaming.Disney}\n`;
  content += ` ├ HBO Max: ${info.streaming.HBO}\n`;
  content += ` ├ TikTok: ${info.streaming.TikTok}\n`;
  content += ` └ YouTube: ${info.streaming.YouTube}\n`;

  content += `\n🤖 【AI 助手】\n`;
  content += ` ├ ChatGPT: ${info.ai.ChatGPT}\n`;
  content += ` ├ Claude: ${info.ai.Claude}\n`;
  content += ` └ Gemini: ${info.ai.Gemini}`;

  $done({
    title: "节点解锁检测",
    content: content,
    icon: "play.tv.fill",
    "icon-color": "#5856D6"
  });
})();

// --- 核心逻辑 ---

async function getIPInfo() {
  try {
    // 请求 IP-API 获取中文位置信息
    let res = await fetch("http://ip-api.com/json/?lang=zh-CN");
    let data = JSON.parse(res.data);
    const flag = data.countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
    // 格式：国旗 国家 州/省 城市
    return {
      location: `${flag} ${data.country} ${data.regionName} ${data.city}`,
      ip: data.query
    };
  } catch { 
    return { location: "❌ 获取失败", ip: "❌ 获取失败" }; 
  }
}

// 检测函数 (简写版)
async function checkNetflix() {
  try {
    let res = await fetch("https://www.netflix.com/title/81215561");
    if (res.status === 200) return "✅ 完整";
    if (res.status === 403) return "⚠️ 自制";
    return "❌ 失败";
  } catch { return "🚫"; }
}

async function checkHBO() {
  try {
    let res = await fetch("https://www.max.com");
    return res.status === 200 ? "✅" : "❌";
  } catch { return "🚫"; }
}

async function checkTikTok() {
  try {
    let res = await fetch("https://www.tiktok.com");
    return (res.status === 200 || res.status === 302) ? "✅" : "❌";
  } catch { return "🚫"; }
}

async function checkDisney() {
  try {
    let res = await fetch("https://www.disneyplus.com");
    return res.url.includes("preview") ? "✅" : "❌";
  } catch { return "🚫"; }
}

async function checkYouTube() {
  try {
    let res = await fetch("https://www.youtube.com/premium");
    return res.status === 200 ? "✅" : "❌";
  } catch { return "🚫"; }
}

async function checkChatGPT() {
  try {
    let res = await fetch("https://chatgpt.com");
    return res.status === 200 ? "✅" : "❌";
  } catch { return "🚫"; }
}

async function checkClaude() {
  try {
    let res = await fetch("https://claude.ai/login");
    return res.status === 200 ? "✅" : "❌";
  } catch { return "🚫"; }
}

async function checkGemini() {
  try {
    let res = await fetch("https://gemini.google.com");
    return res.status === 200 ? "✅" : "❌";
  } catch { return "🚫"; }
}

function fetch(url) {
  return new Promise((resolve) => {
    $httpClient.get({url, timeout: 5000}, (err, resp, data) => {
      if (err) resolve({status: 500, url: "", data: null});
      else { resp.data = data; resolve(resp); }
    });
  });
}
