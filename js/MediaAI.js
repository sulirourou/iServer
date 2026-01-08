/**
 * Egern 融合脚本：IP 纯净度 + 流媒体 & AI 检测
 * 逻辑参考：用户提供的 IPPure 脚本
 * 布局：前缀换行 + 紧凑对齐
 */

const url = "https://my.ippure.com/v1/info";

(async () => {
  let info = {
    // 基础信息
    flag: "🏳️",
    country: "获取中...",
    city: "",
    ip: "获取中...",
    type: "IPv4",
    asn: "",
    org: "",
    nativeText: "",
    riskText: "",
    riskLevel: 0, // 用于最后决定图标颜色
    
    // 解锁信息
    streaming: {},
    ai: {}
  };

  // 并行执行：IP检测 + 流媒体检测
  await Promise.all([
    getIPPureInfo().then(res => Object.assign(info, res)), // 合并 IP 结果
    checkNetflix().then(res => info.streaming.Netflix = res),
    checkDisney().then(res => info.streaming.Disney = res),
    checkHBO().then(res => info.streaming.HBO = res),
    checkTikTok().then(res => info.streaming.TikTok = res),
    checkYouTube().then(res => info.streaming.YouTube = res),
    checkChatGPT().then(res => info.ai.ChatGPT = res),
    checkClaude().then(res => info.ai.Claude = res),
    checkGemini().then(res => info.ai.Gemini = res)
  ]);

  // --- 面板内容拼接 ---

  // 1. 地区与 ASN (前缀换行)
  let content = `📍 节点信息:\n`;
  content += `${info.flag} ${info.country} ${info.city}\n`;
  content += `AS${info.asn} ${info.org}\n`;

  // 2. IP 与 纯净度 (前缀换行)
  content += `\n🌐 ${info.type} 状态:\n`;
  content += `${info.ip}\n`;
  content += `${info.nativeText}\n`;
  content += `${info.riskText}\n`;

  // 3. 流媒体 (紧凑格式)
  content += `\n🎬 【流媒体服务】\n`;
  content += ` ├ Netflix: ${info.streaming.Netflix}\n`;
  content += ` ├ Disney+: ${info.streaming.Disney}\n`;
  content += ` ├ HBO Max: ${info.streaming.HBO}\n`;
  content += ` ├ TikTok: ${info.streaming.TikTok}\n`;
  content += ` └ YouTube: ${info.streaming.YouTube}\n`;

  // 4. AI (紧凑格式)
  content += `\n🤖 【AI 助手】\n`;
  content += ` ├ ChatGPT: ${info.ai.ChatGPT}\n`;
  content += ` ├ Claude: ${info.ai.Claude}\n`;
  content += ` └ Gemini: ${info.ai.Gemini}`;

  // 动态颜色 (根据风险值)
  let titleColor = "#34C759"; // 默认绿
  if (info.riskLevel >= 80) titleColor = "#FF3B30"; // 红
  else if (info.riskLevel >= 70) titleColor = "#FF9500"; // 橙
  else if (info.riskLevel >= 40) titleColor = "#FFCC00"; // 黄

  $done({
    title: "节点深度检测",
    content: content,
    icon: info.riskLevel >= 70 ? "exclamationmark.triangle.fill" : "checkmark.seal.fill",
    "icon-color": titleColor
  });
})();

// --- 核心功能区 ---

// 移植自用户提供的 IPPure 逻辑
async function getIPPureInfo() {
  try {
    let res = await fetch(url);
    let j = JSON.parse(res.data);
    
    // 变量提取
    const ip = j.ip || j.query || "获取失败";
    const isIPv6 = ip.includes(':');
    const type = isIPv6 ? 'IPv6' : 'IPv4';
    
    // 国旗处理
    const flag = flagEmoji(j.countryCode || "UN");
    
    // 原生处理
    const nativeText = j.isResidential ? "✅ 是（原生）" : "🏢 否（机房/商业）";
    
    // 风险处理
    const risk = j.fraudScore || 0;
    let riskText = "";
    if (risk >= 80) riskText = `🛑 极高风险 (${risk})`;
    else if (risk >= 70) riskText = `⚠️ 高风险 (${risk})`;
    else if (risk >= 40) riskText = `🔶 中等风险 (${risk})`;
    else riskText = `✅ 低风险 (${risk})`;

    return {
      flag: flag,
      country: j.country || "",
      city: j.city || "",
      ip: ip,
      type: type,
      asn: j.asn || "",
      org: j.asOrganization || "",
      nativeText: nativeText,
      riskText: riskText,
      riskLevel: risk
    };
  } catch (e) {
    return { 
      flag: "❌", country: "请求失败", city: "", 
      ip: "Check Rule!", type: "Error", 
      asn: "000", org: "Unknown", 
      nativeText: "❓ 未知", riskText: "❌ 检测超时", riskLevel: 0 
    };
  }
}

// 国旗转换函数 (保留用户的 TW->CN 逻辑)
function flagEmoji(code) {
  if (!code) return "🏳️";
  if (code.toUpperCase() === "TW") code = "CN";
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt())
  );
}

// --- 流媒体 & AI 检测 ---

async function checkNetflix() {
  try {
    let res = await fetch("https://www.netflix.com/title/81215561");
    if (res.status === 200) return "✅";
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
    let headers = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" };
    $httpClient.get({url, timeout: 5000, headers}, (err, resp, data) => {
      if (err) resolve({status: 500, url: "", data: null});
      else { resp.data = data; resolve(resp); }
    });
  });
}
