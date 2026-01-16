/**
 * Egern 融合旗舰版 (逻辑重构版)
 * 1. 结构优化: 核心工具 -> 流媒体 -> AI
 * 2. 视觉优化: 增加明确的功能区块注释
 * 3. 核心逻辑: 保持 Netflix 双重检测与 ChatGPT/Claude 特殊适配
 */

const localUrl = "https://myip.ipip.net/json";
const proxyUrl = "https://my.ippure.com/v1/info";

(async () => {
  // ================= 1. 数据结构初始化 =================
  let info = {
    // 基础网络信息
    local: { ip: "获取中...", flag: "", country: "", city: "", isp: "" },
    // 节点落地信息
    ip: "获取中...", type: "IPv4", asn: "", org: "", flag: "🏳️", country: "", city: "", nativeText: "", riskText: "", riskLevel: 0,
    // 服务解锁状态
    streaming: {},
    ai: {}
  };

  // ================= 2. 并行检测队列 =================
  await Promise.all([
    // --- A. 基础网络层 ---
    // 1. 获取本地直连 IP
    getLocalIP().then(res => info.local = res),
    // 2. 获取代理落地 IP
    getLandingIP().then(res => Object.assign(info, res)),
    
    // --- B. 流媒体娱乐层 ---
    // 3. Netflix (双重检测)
    checkNetflix().then(res => info.streaming.Netflix = res),
    // 4. Disney+
    checkDisney().then(res => info.streaming.Disney = res),
    // 5. HBO Max
    checkHBO().then(res => info.streaming.HBO = res),
    // 6. TikTok
    checkTikTok().then(res => info.streaming.TikTok = res),
    // 7. YouTube
    checkYouTube().then(res => info.streaming.YouTube = res),
    
    // --- C. 人工智能层 ---
    // 8. ChatGPT (iOS 接口)
    checkChatGPT().then(res => info.ai.ChatGPT = res),
    // 9. Claude (静态资源)
    checkClaude().then(res => info.ai.Claude = res),
    // 10. Gemini
    checkGemini().then(res => info.ai.Gemini = res)
  ]);

  // ================= 3. 面板 UI 构建 =================

  // --- 头部：本地网络 ---
  let content = `🏠 本地 IP: ${info.local.ip}\n`;
  content += `📍 位置: ${info.local.flag} ${info.local.country} ${info.local.city}\n`;
  content += `🏢 运营商: ${info.local.isp}\n`;
  content += `                             \n`;

  // --- 中部：节点质量 ---
  content += `🛡️ 节点 IP 纯净度\n`;
  content += `🌐 ${info.type}: ${info.ip}\n`;
  content += `📡 ASN: AS${info.asn} ${info.org}\n`;
  content += `📍 位置: ${info.flag} ${info.country} ${info.city}\n`;
  content += `🚦 原生 IP: ${info.nativeText}\n`;
  content += `${info.riskText}`; 

  // --- 下部：流媒体 ---
  content += `\n\n🎬 【流媒体服务】\n`;
  content += `🎥 Netflix: ${info.streaming.Netflix}\n`;
  content += `🏰 Disney+: ${info.streaming.Disney}\n`;
  content += `🎞️ HBO Max: ${info.streaming.HBO}\n`;
  content += `🎵 TikTok: ${info.streaming.TikTok}\n`;
  content += `▶️ YouTube: ${info.streaming.YouTube}\n`;

  // --- 底部：AI 助手 ---
  content += `\n🤖 【AI 助手】\n`;
  content += `🤡 ChatGPT: ${info.ai.ChatGPT}\n`;
  content += `🧠 Claude: ${info.ai.Claude}\n`;
  content += `✨ Gemini: ${info.ai.Gemini}`;

  // --- 图标逻辑 ---
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

// ===========================================
//           核心工作区 (基础设施)
// ===========================================

/**
 * 获取本地直连 IP 信息
 * 策略: direct (直连)
 */
async function getLocalIP() {
  try {
    let res = await fetchWithPolicy(localUrl, "direct"); 
    let j = JSON.parse(res.data);
    if (j.ret === "ok" && j.data) {
        let loc = j.data.location || [];
        let country = loc[0] || "";
        let code = (country === "中国") ? "CN" : "UN";
        return {
            ip: j.data.ip || "查询失败",
            flag: flagEmoji(code),
            country: country,
            city: loc[2] || "",
            isp: loc[4] || "未知"
        };
    } else { throw new Error("API Error"); }
  } catch (e) { return { ip: "获取失败", flag: "❌", country: "", city: "", isp: "" }; }
}

/**
 * 获取代理落地 IP 信息
 * 策略: 默认代理
 */
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
    
    // 风险等级判定
    let riskText = "";
    if (risk >= 80) riskText = `🛑 极高风险 (${risk})`;
    else if (risk >= 70) riskText = `⚠️ 高风险 (${risk})`;
    else if (risk >= 40) riskText = `🔶 中等风险 (${risk})`;
    else riskText = `✅ 低风险 (${risk})`;

    return { ip, type, asn, org, flag, country, city, nativeText, riskText, riskLevel: risk };
  } catch (e) {
    return { ip: "网络错误", type: "IPv4", asn: "000", org: "Unknown", flag: "❌", country: "获取失败", city: "", nativeText: "❓ 未知", riskText: "❌ 检测失败" };
  }
}

// 旗帜 Emoji 转换工具
function flagEmoji(code) {
  if (!code) return "🏳️";
  if (code.toUpperCase() === "TW") code = "CN";
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
}

// 通用网络请求 (默认超时 5s)
function fetch(url) {
  return new Promise((resolve) => {
    let headers = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" };
    $httpClient.get({url, timeout: 5000, headers}, (err, resp, data) => {
      if (err) resolve({status: 500, url: "", data: null});
      else { resp.data = data; resolve(resp); }
    });
  });
}

// 指定策略网络请求 (用于强制直连)
function fetchWithPolicy(url, policyName) {
  return new Promise((resolve) => {
    let headers = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" };
    $httpClient.get({url, timeout: 3000, headers, policy: policyName}, (err, resp, data) => {
      if (err) resolve({status: 500, url: "", data: null});
      else { resp.data = data; resolve(resp); }
    });
  });
}

// ===========================================
//             流媒体检测功能区
// ===========================================

// Netflix: 双重检测 (1.版权剧 -> 2.自制剧)
async function checkNetflix() { 
  try { 
    // 检测版权剧 (Strict)
    let res1 = await fetch("https://www.netflix.com/title/81215561"); 
    if (res1.status === 200) return "✅"; 
    
    // 检测自制剧 (Loose)
    let res2 = await fetch("https://www.netflix.com/title/80018499");
    if (res2.status === 200) return "⚠️ (自制)";
    
    return "❌"; 
  } catch { return "🚫"; } 
}

// Disney+
async function checkDisney() { 
    try { let res = await fetch("https://www.disneyplus.com"); return res.url.includes("preview") ? "✅" : "❌"; } catch { return "🚫"; } 
}

// HBO Max
async function checkHBO() { 
    try { let res = await fetch("https://www.max.com"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } 
}

// TikTok
async function checkTikTok() { 
    try { let res = await fetch("https://www.tiktok.com"); return (res.status === 200 || res.status === 302) ? "✅" : "❌"; } catch { return "🚫"; } 
}

// YouTube
async function checkYouTube() { 
    try { let res = await fetch("https://www.youtube.com/premium"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } 
}

// ===========================================
//               AI 检测功能区
// ===========================================

// ChatGPT: iOS API (规避 Cloudflare 网页盾)
async function checkChatGPT() { 
    try { let res = await fetch("https://ios.chat.openai.com/public-api/mobile/server_status/v1"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } 
}

// Claude: Favicon (静态资源规避登录跳转)
async function checkClaude() { 
    try { let res = await fetch("https://claude.ai/favicon.ico"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } 
}

// Gemini
async function checkGemini() { 
    try { let res = await fetch("https://gemini.google.com"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } 
}
