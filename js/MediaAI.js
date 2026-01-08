/**
 * Egern 完美复刻版
 * 头部严格对齐红框截图格式
 */

const url = "https://my.ippure.com/v1/info";

(async () => {
  let info = {
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
    streaming: {},
    ai: {}
  };

  // 并行执行
  await Promise.all([
    getIPPureInfo().then(res => Object.assign(info, res)),
    checkNetflix().then(res => info.streaming.Netflix = res),
    checkDisney().then(res => info.streaming.Disney = res),
    checkHBO().then(res => info.streaming.HBO = res),
    checkTikTok().then(res => info.streaming.TikTok = res),
    checkYouTube().then(res => info.streaming.YouTube = res),
    checkChatGPT().then(res => info.ai.ChatGPT = res),
    checkClaude().then(res => info.ai.Claude = res),
    checkGemini().then(res => info.ai.Gemini = res)
  ]);

  // --- ❌ 不要改动这里，严格复刻红框格式 ---
  let content = `${info.type}: ${info.ip}\n`;
  content += `ASN: AS${info.asn} ${info.org}\n`;
  content += `位置: ${info.flag} ${info.country} ${info.city}\n`;
  content += `原生 IP: ${info.nativeText}\n`;
  content += `${info.riskText}`; 
  // 👆 注意：最后一行风险没有前缀，直接是图标开头，这是照抄截图的

  // --- 下方流媒体部分 (保持原有) ---
  content += `\n\n🎬 【流媒体服务】\n`;
  content += ` ├ Netflix: ${info.streaming.Netflix}\n`;
  content += ` ├ Disney+: ${info.streaming.Disney}\n`;
  content += ` ├ HBO Max: ${info.streaming.HBO}\n`;
  content += ` ├ TikTok: ${info.streaming.TikTok}\n`;
  content += ` └ YouTube: ${info.streaming.YouTube}\n`;

  content += `\n🤖 【AI 助手】\n`;
  content += ` ├ ChatGPT: ${info.ai.ChatGPT}\n`;
  content += ` ├ Claude: ${info.ai.Claude}\n`;
  content += ` └ Gemini: ${info.ai.Gemini}`;

  // 动态图标颜色
  let icon = "checkmark.shield.fill";
  let color = "#AF52DE"; // 默认紫
  if (info.riskLevel >= 70) {
      icon = "exclamationmark.triangle.fill";
      color = "#FF9500"; // 高风险变橙色
  }

  $done({
    title: "节点 IP 纯净度",
    content: content,
    icon: icon,
    "icon-color": color
  });
})();

// --- 核心逻辑 ---

async function getIPPureInfo() {
  try {
    let res = await fetch(url);
    let j = JSON.parse(res.data);
    
    // 1. IP 和 类型
    const ip = j.ip || j.query || "获取失败";
    const type = ip.includes(':') ? 'IPv6' : 'IPv4';
    
    // 2. ASN 和 组织
    const asn = j.asn || "";
    const org = j.asOrganization || "";

    // 3. 位置
    const flag = flagEmoji(j.countryCode || "UN");
    const country = j.country || "";
    const city = j.city || "";

    // 4. 原生 IP 文本 (注意空格)
    // 截图显示：🏢 否 (机房/商业)
    const nativeText = j.isResidential ? "✅ 是 (原生)" : "🏢 否 (机房/商业)";
    
    // 5. 风险值 (注意：截图这里没有"风险:"二字，直接是图标)
    // 截图显示：🔶 中等风险 (40)
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
async function checkChatGPT() { try { let res = await fetch("https://chatgpt.com"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } }
async function checkClaude() { try { let res = await fetch("https://claude.ai/login"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } }
async function checkGemini() { try { let res = await fetch("https://gemini.google.com"); return res.status === 200 ? "✅" : "❌"; } catch { return "🚫"; } }

function fetch(url) {
  return new Promise((resolve) => {
    let headers = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" };
    $httpClient.get({url, timeout: 5000, headers}, (err, resp, data) => {
      if (err) resolve({status: 500, url: "", data: null});
      else { resp.data = data; resolve(resp); }
    });
  });
}
