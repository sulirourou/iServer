/**
 * Egern 融合旗舰版 (全能增强版)
 * 1. 结构: 核心工具 -> 流媒体 -> AI
 * 2. YouTube: 升级为 Rabbit-Spec 逻辑 (显示地区 ✅ US)
 * 3. Disney+: 升级为 Rabbit-Spec 逻辑 (显示地区 ✅ US)
 * 4. Netflix: Rabbit-Spec 双重检测 (版权/自制)
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
    getLocalIP().then(res => info.local = res),
    getLandingIP().then(res => Object.assign(info, res)),
    
    // --- B. 流媒体娱乐层 ---
    checkNetflix().then(res => info.streaming.Netflix = res), // 双重检测
    checkDisney().then(res => info.streaming.Disney = res),   // 地区识别
    checkHBO().then(res => info.streaming.HBO = res),
    checkTikTok().then(res => info.streaming.TikTok = res),
    checkYouTube().then(res => info.streaming.YouTube = res), // 地区识别
    
    // --- C. 人工智能层 ---
    checkChatGPT().then(res => info.ai.ChatGPT = res),        // iOS 接口
    checkClaude().then(res => info.ai.Claude = res),          // Favicon
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

// 1. 获取本地直连 IP
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

// 2. 获取代理落地 IP
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

    return { ip, type, asn, org, flag, country, city, nativeText, riskText, riskLevel: risk };
  } catch (e) {
    return { ip: "网络错误", type: "IPv4", asn: "000", org: "Unknown", flag: "❌", country: "获取失败", city: "", nativeText: "❓ 未知", riskText: "❌ 检测失败" };
  }
}

// 旗帜 Emoji 转换
function flagEmoji(code) {
  if (!code) return "🏳️";
  if (code.toUpperCase() === "TW") code = "CN";
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
}

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

// 策略 fetch
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
    let res1 = await fetch("https://www.netflix.com/title/81215561"); 
    if (res1.status === 200) return "✅"; 
    let res2 = await fetch("https://www.netflix.com/title/80018499");
    if (res2.status === 200) return "⚠️ (自制)";
    return "❌"; 
  } catch { return "🚫"; } 
}

// Disney+: 升级版 (检测跳转链接中的地区代码)
async function checkDisney() { 
    try { 
        let res = await fetch("https://www.disneyplus.com/");
        if (res.status === 403) return "❌";
        
        let url = res.url || "";
        let regionMatch = url.match(/disneyplus\.com\/([a-z]{2}-[a-z]{2})\//);
        
        if (regionMatch && regionMatch[1]) {
            let region = regionMatch[1].split('-')[1].toUpperCase();
            return `✅ ${region}`;
        }
        if (res.status === 200) return "✅";
        return "❌"; 
    } catch { return "🚫"; } 
}

// YouTube: 升级版 (提取 Premium 地区)
async function checkYouTube() { 
    try { 
        let res = await fetch("https://www.youtube.com/");
        if (res.status !== 200) return "❌";

        // 尝试从网页源码中提取地区 (例如 "countryCode":"US")
        let data = res.data;
        let regionMatch = data.match(/"countryCode":"([A-Z]{2})"/);
        
        if (regionMatch && regionMatch[1]) {
             return `✅ ${regionMatch[1]}`; // 例如: ✅ US
        }
        
        return "✅"; // 无法提取地区但连接正常
    } catch { return "🚫"; } 
}

// HBO Max
async function checkHBO() { 
    try { let res = await fetch("https://www.max.com"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } 
}

// TikTok
async function checkTikTok() { 
    try { let res = await fetch("https://www.tiktok.com"); return (res.status === 200 || res.status === 302) ? "✅" : "❌"; } catch { return "🚫"; } 
}

// ===========================================
//               AI 检测功能区
// ===========================================

// ChatGPT: iOS API (规避 Cloudflare)
async function checkChatGPT() { 
    try { let res = await fetch("https://ios.chat.openai.com/public-api/mobile/server_status/v1"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } 
}

// Claude: Favicon (规避登录墙)
async function checkClaude() { 
    try { let res = await fetch("https://claude.ai/favicon.ico"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } 
}

// Gemini
async function checkGemini() { 
    try { let res = await fetch("https://gemini.google.com"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } 
}
