/**
 * Egern 融合旗舰版 (全图标增强版)
 * 1. 本地 IP: myip.ipip.net (显示位置/运营商)
 * 2. 落地 IP: my.ippure.com (红框格式 + 信息图标)
 * 3. 流媒体/AI: 去除树状符，改为专属图标
 * 4. 整体图标: 紫色波浪印章
 */

const localUrl = "https://myip.ipip.net/json";
const proxyUrl = "https://my.ippure.com/v1/info";

(async () => {
  let info = {
    // 本地信息
    local: { ip: "获取中...", flag: "", country: "", city: "", isp: "" },
    
    // 落地(代理)信息
    ip: "获取中...",
    type: "IPv4",
    asn: "",
    org: "",
    flag: "🏳️",
    country: "",
    city: "",
    nativeText: "",
    riskText: "",
    riskLevel: 0,
    
    // 流媒体
    streaming: {},
    ai: {}
  };

  // 并行执行所有检测
  await Promise.all([
    getLocalIP().then(res => info.local = res),
    getLandingIP().then(res => Object.assign(info, res)),
    checkNetflix().then(res => info.streaming.Netflix = res),
    checkDisney().then(res => info.streaming.Disney = res),
    checkHBO().then(res => info.streaming.HBO = res),
    checkTikTok().then(res => info.streaming.TikTok = res),
    checkYouTube().then(res => info.streaming.YouTube = res),
    checkChatGPT().then(res => info.ai.ChatGPT = res),
    checkClaude().then(res => info.ai.Claude = res),
    checkGemini().then(res => info.ai.Gemini = res)
  ]);

  // --- 1. 顶部：本地 IP ---
  let content = `🏠 本地 IP: ${info.local.ip}\n`;
  content += `📍 位置: ${info.local.flag} ${info.local.country} ${info.local.city}\n`;
  content += `🏢 运营商: ${info.local.isp}\n`;
  content += `                             \n`;

  // --- 2. 中部：落地 IP (全套图标) ---
  content += `🛡️ 节点 IP 纯净度\n`;
  content += `🌐 ${info.type}: ${info.ip}\n`;
  content += `📡 ASN: AS${info.asn} ${info.org}\n`;
  content += `📍 位置: ${info.flag} ${info.country} ${info.city}\n`;
  content += `🚦 原生 IP: ${info.nativeText}\n`;
  content += `${info.riskText}`; 

  // --- 3. 下部：流媒体 & AI (去除符号，改用图标) ---
  content += `\n\n🎬 【流媒体服务】\n`;
  content += `🎥 Netflix: ${info.streaming.Netflix}\n`;
  content += `🏰 Disney+: ${info.streaming.Disney}\n`;
  content += `🎞️ HBO Max: ${info.streaming.HBO}\n`;
  content += `🎵 TikTok: ${info.streaming.TikTok}\n`;
  content += `▶️ YouTube: ${info.streaming.YouTube}\n`;

  content += `\n🤖 【AI 助手】\n`;
  content += `🤡 ChatGPT: ${info.ai.ChatGPT}\n`;
  content += `🧠 Claude: ${info.ai.Claude}\n`;
  content += `✨ Gemini: ${info.ai.Gemini}`;

  // --- 🎨 主图标设置 ---
  let icon = "checkmark.seal.fill"; 
  let color = "#AF52DE"; 

  if (info.riskLevel >= 70) {
      icon = "exclamationmark.triangle.fill";
      color = "#FF9500"; 
  }

  $done({
    title: "🌏 IP 信息",
    content: content,
    icon: icon,
    "icon-color": color
  });
})();

// --- 核心逻辑 ---

// 1. 获取本地 IP (强制直连)
async function getLocalIP() {
  try {
    let res = await fetchWithPolicy(localUrl, "direct"); 
    let j = JSON.parse(res.data);
    
    if (j.ret === "ok" && j.data) {
        let loc = j.data.location || [];
        let country = loc[0] || "";
        let code = "UN";
        if (country === "中国") code = "CN";
        
        return {
            ip: j.data.ip || "查询失败",
            flag: flagEmoji(code),
            country: country,
            city: loc[2] || "",
            isp: loc[4] || "未知"
        };
    } else {
        throw new Error("API Error");
    }
  } catch (e) {
    return { ip: "获取失败", flag: "❌", country: "", city: "", isp: "" };
  }
}

// 2. 获取落地 IP (走代理)
async function getLandingIP() {
  try {
    let res = await fetch(proxyUrl);
    let j = JSON.parse(res.data);
    
    const ip = j.ip || j.query || "获取失败";
    const type = ip.includes(':') ? 'IPv6' : 'IPv4';
    const asn = j.asn || "";
    const org = j.asOrganization || "";
    const flag = flagEmoji(j.countryCode || "UN");
    const country = j.country || "";
    const city = j.city || "";
    const nativeText = j.isResidential ? "✅ 是 (原生)" : "🏢 否 (机房/商业)";
    
    const risk = j.fraudScore || 0;
    let riskText = "";
    if (risk >= 80) riskText = `🛑 极高风险 (${risk})`;
    else if (risk >= 70) riskText = `⚠️ 高风险 (${risk})`;
    else if (risk >= 40) riskText = `🔶 中等风险 (${risk})`;
    else riskText = `✅ 低风险 (${risk})`;

    return {
      ip, type, asn, org, flag, country, city, nativeText, riskText, riskLevel: risk
    };
  } catch (e) {
    return { 
      ip: "网络错误", type: "IPv4", asn: "000", org: "Unknown", 
      flag: "❌", country: "获取失败", city: "", 
      nativeText: "❓ 未知", riskText: "❌ 检测失败" 
    };
  }
}

function flagEmoji(code) {
  if (!code) return "🏳️";
  if (code.toUpperCase() === "TW") code = "CN";
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt())
  );
}

// --- 检测函数 ---
async function checkNetflix() { try { let res = await fetch("https://www.netflix.com/title/81215561"); if (res.status === 200) return "✅"; if (res.status === 403) return "⚠️"; return "❌"; } catch { return "🚫"; } }
async function checkHBO() { try { let res = await fetch("https://www.max.com"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } }
async function checkTikTok() { try { let res = await fetch("https://www.tiktok.com"); return (res.status === 200 || res.status === 302) ? "✅" : "❌"; } catch { return "🚫"; } }
async function checkDisney() { try { let res = await fetch("https://www.disneyplus.com"); return res.url.includes("preview") ? "✅" : "❌"; } catch { return "🚫"; } }
async function checkYouTube() { try { let res = await fetch("https://www.youtube.com/premium"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } }

// 修复部分：还原为 IOS 状态接口（你反馈上个版本此项正常）
async function checkChatGPT() { try { let res = await fetch("https://ios.chat.openai.com/public-api/mobile/server_status/v1"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } }

// 修复部分：保留为 Favicon 静态资源（你反馈当前版本此项正常）
async function checkClaude() { try { let res = await fetch("https://claude.ai/favicon.ico"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } }

async function checkGemini() { try { let res = await fetch("https://gemini.google.com"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } }

// 基础 fetch
function fetch(url) {
  return new Promise((resolve) => {
    let headers = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" };
    $httpClient.get({url, timeout: 5000, headers}, (err, resp, data) => {
      if (err) resolve({status: 500, url: "", data: null});
      else { resp.data = data; resolve(resp); }
    });
  });
}

// 带策略的 fetch (用于强制直连)
function fetchWithPolicy(url, policyName) {
  return new Promise((resolve) => {
    let headers = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" };
    $httpClient.get({url, timeout: 3000, headers, policy: policyName}, (err, resp, data) => {
      if (err) resolve({status: 500, url: "", data: null});
      else { resp.data = data; resolve(resp); }
    });
  });
}
