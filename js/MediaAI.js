/**
 * Egern 流媒体 & AI 归类检测脚本
 * 更新：
 * 1. 接口更换为 my.ippure.com
 * 2. 增加名称补齐，实现图标纵向对齐
 */

(async () => {
  let info = {
    location: "获取中...",
    ip: "获取中...",
    streaming: {},
    ai: {}
  };

  // 辅助函数：名称补齐（统一长度为 8，确保冒号对齐）
  const pad = (str) => str.padEnd(8, " ");

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
  let content = `📍 地区: ${info.location}\n`;
  content += `🌐 IP: ${info.ip}\n`;
  
  content += `\n🎬 【流媒体服务】\n`;
  content += ` ├ ${pad("Netflix")}: ${info.streaming.Netflix}\n`;
  content += ` ├ ${pad("Disney+")}: ${info.streaming.Disney}\n`;
  content += ` ├ ${pad("HBO Max")}: ${info.streaming.HBO}\n`;
  content += ` ├ ${pad("TikTok")}: ${info.streaming.TikTok}\n`;
  content += ` └ ${pad("YouTube")}: ${info.streaming.YouTube}\n`;

  content += `\n🤖 【AI 助手】\n`;
  content += ` ├ ${pad("ChatGPT")}: ${info.ai.ChatGPT}\n`;
  content += ` ├ ${pad("Claude")}: ${info.ai.Claude}\n`;
  content += ` └ ${pad("Gemini")}: ${info.ai.Gemini}`;

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
    // 请求 my.ippure.com 接口
    let res = await fetch("https://my.ippure.com/v1/info");
    let data = JSON.parse(res.data);
    
    // my.ippure.com 字段映射
    // country_code: 国家代码 (CN, US...)
    // country: 国家名 (China, United States...)
    // region: 省/州
    // city: 城市
    
    const countryCode = data.country_code || "UN"; 
    const flag = countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
    
    return {
      location: `${flag} ${data.country} ${data.region} ${data.city}`,
      ip: data.ip
    };
  } catch (e) { 
    return { location: "❌ 获取失败", ip: "❌ 获取失败" }; 
  }
}

// 检测函数
async function checkNetflix() {
  try {
    let res = await fetch("https://www.netflix.com/title/81215561");
    if (res.status === 200) return "✅ 完整"; // 如需完全对其，可改为 "✅"
    if (res.status === 403) return "⚠️ 自制";
    return "❌";
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
    $httpClient.get({url, timeout: 5000, headers: {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"}}, (err, resp, data) => {
      if (err) resolve({status: 500, url: "", data: null});
      else { resp.data = data; resolve(resp); }
    });
  });
}
