/**
 * Egern 流媒体 & AI 归类检测脚本 (精简版)
 * 布局：独立行显示位置与IP，图标紧跟名称
 */

(async () => {
  let info = {
    flag: "🏳️",
    country: "获取中...",
    region: "",
    city: "",
    ip: "获取中...",
    streaming: {},
    ai: {}
  };

  // 并行执行所有请求
  await Promise.all([
    getIPInfo().then(res => {
      info.flag = res.flag;
      info.country = res.country;
      info.region = res.region;
      info.city = res.city;
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

  // --- 拼接面板内容 (完全按照要求排版) ---
  
  // 第一行：国旗 国家 州/省 城市 (无前缀)
  let content = `${info.flag} ${info.country} ${info.region} ${info.city}\n`;
  
  // 第二行：纯 IP (无前缀)
  content += `${info.ip}\n`;
  
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
    // 务必确保 Egern 规则中 ippure.com 走代理，否则查到的是国内IP
    let res = await fetch("https://my.ippure.com/v1/info");
    let data = JSON.parse(res.data);
    
    // 获取国家代码，优先尝试 country_code
    let code = data.country_code || "UN";
    
    // 生成国旗 Emoji
    const flag = code.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
    
    return {
      flag: flag,
      country: data.country || "",
      region: data.region || "",
      city: data.city || "",
      ip: data.ip || "获取失败"
    };
  } catch (e) { 
    return { flag: "❌", country: "获取失败", region: "", city: "", ip: "网络错误" }; 
  }
}

// 检测函数 (移除多余空格，保持紧凑)
async function checkNetflix() {
  try {
    let res = await fetch("https://www.netflix.com/title/81215561");
    if (res.status === 200) return "✅"; // 之前是"✅ 完整"，现在改短以保持紧凑
    if (res.status === 403) return "⚠️";
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
    // 增加 User-Agent 模拟浏览器行为
    let headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    };
    $httpClient.get({url, timeout: 5000, headers}, (err, resp, data) => {
      if (err) resolve({status: 500, url: "", data: null});
      else { resp.data = data; resolve(resp); }
    });
  });
}
