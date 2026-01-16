/**

- Egern 融合旗舰版 (加强容错版)
- 修复：增加超时保护、错误处理、降级显示
  */

const localUrl = “https://myip.ipip.net/json”;
const proxyUrl = “https://my.ippure.com/v1/info”;

// 设置总超时（10秒后必须返回结果）
const TIMEOUT = 10000;

(async () => {
let info = {
local: { ip: “获取中”, flag: “”, country: “”, city: “”, isp: “” },
ip: “获取中”, type: “IPv4”, asn: “”, org: “”,
flag: “🏳️”, country: “”, city: “”,
nativeText: “”, riskText: “”, riskLevel: 0,
streaming: {}, ai: {}
};

try {
// 使用 Promise.race 添加总超时保护
await Promise.race([
// 主逻辑
(async () => {
// 第一步：先获取 IP 信息（最重要）
try {
info.local = await getLocalIP();
} catch (e) {
console.log(“本地IP获取失败: “ + e);
}

```
    try {
      Object.assign(info, await getLandingIP());
    } catch (e) {
      console.log("落地IP获取失败: " + e);
    }

    // 第二步：并行检测服务（不阻塞主流程）
    await Promise.allSettled([
      checkNetflix().then(r => info.streaming.Netflix = r),
      checkDisney().then(r => info.streaming.Disney = r),
      checkHBO().then(r => info.streaming.HBO = r),
      checkTikTok().then(r => info.streaming.TikTok = r),
      checkYouTube().then(r => info.streaming.YouTube = r),
      checkChatGPT().then(r => info.ai.ChatGPT = r),
      checkClaude().then(r => info.ai.Claude = r),
      checkGemini().then(r => info.ai.Gemini = r)
    ]);
  })(),
  
  // 超时保护
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('总超时')), TIMEOUT)
  )
]);
```

} catch (e) {
console.log(“检测超时或异常: “ + e);
}

// 构建显示内容（无论是否完全成功都显示）
let content = buildContent(info);
let icon = “checkmark.seal.fill”;
let color = “#AF52DE”;

if (info.riskLevel >= 70) {
icon = “exclamationmark.triangle.fill”;
color = “#FF9500”;
}

$done({
title: “🌏 IP 信息”,
content: content,
icon: icon,
“icon-color”: color
});
})();

// 构建显示内容
function buildContent(info) {
let content = `🏠 本地 IP: ${info.local.ip}\n`;

if (info.local.country) {
content += `📍 位置: ${info.local.flag} ${info.local.country} ${info.local.city}\n`;
content += `🏢 运营商: ${info.local.isp}\n`;
}

content += `                             \n`;
content += `🛡️ 节点 IP 纯净度\n`;
content += `🌐 ${info.type}: ${info.ip}\n`;

if (info.asn) {
content += `📡 ASN: AS${info.asn} ${info.org}\n`;
}

if (info.country) {
content += `📍 位置: ${info.flag} ${info.country} ${info.city}\n`;
}

if (info.nativeText) {
content += `🚦 原生 IP: ${info.nativeText}\n`;
}

if (info.riskText) {
content += `${info.riskText}`;
}

// 流媒体
if (Object.keys(info.streaming).length > 0) {
content += `\n\n🎬 【流媒体服务】\n`;
if (info.streaming.Netflix) content += `🎥 Netflix: ${info.streaming.Netflix}\n`;
if (info.streaming.Disney) content += `🏰 Disney+: ${info.streaming.Disney}\n`;
if (info.streaming.HBO) content += `🎞️ HBO Max: ${info.streaming.HBO}\n`;
if (info.streaming.TikTok) content += `🎵 TikTok: ${info.streaming.TikTok}\n`;
if (info.streaming.YouTube) content += `▶️ YouTube: ${info.streaming.YouTube}`;
}

// AI
if (Object.keys(info.ai).length > 0) {
content += `\n\n🤖 【AI 助手】\n`;
if (info.ai.ChatGPT) content += `🤡 ChatGPT: ${info.ai.ChatGPT}\n`;
if (info.ai.Claude) content += `🧠 Claude: ${info.ai.Claude}\n`;
if (info.ai.Gemini) content += `✨ Gemini: ${info.ai.Gemini}`;
}

return content;
}

// 获取本地 IP
async function getLocalIP() {
try {
let res = await fetchWithTimeout(localUrl, 3000, “direct”);
let j = JSON.parse(res.data);

```
if (j.ret === "ok" && j.data) {
  let loc = j.data.location || [];
  let country = loc[0] || "";
  let code = country === "中国" ? "CN" : "UN";
  
  return {
    ip: j.data.ip || "查询失败",
    flag: flagEmoji(code),
    country: country,
    city: loc[2] || "",
    isp: loc[4] || "未知"
  };
}
```

} catch (e) {
console.log(“本地IP错误: “ + e);
}
return { ip: “获取失败”, flag: “❌”, country: “”, city: “”, isp: “” };
}

// 获取落地 IP
async function getLandingIP() {
try {
let res = await fetchWithTimeout(proxyUrl, 5000);
let j = JSON.parse(res.data);

```
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
```

} catch (e) {
console.log(“落地IP错误: “ + e);
}
return {
ip: “网络错误”, type: “IPv4”, asn: “”, org: “”,
flag: “❌”, country: “”, city: “”,
nativeText: “”, riskText: “❌ 检测失败”, riskLevel: 0
};
}

function flagEmoji(code) {
if (!code || code === “UN”) return “🏳️”;
if (code.toUpperCase() === “TW”) code = “CN”;
return String.fromCodePoint(
…code.toUpperCase().split(’’).map(c => 127397 + c.charCodeAt())
);
}

// 检测函数
async function checkNetflix() {
try {
let res = await fetchWithTimeout(“https://www.netflix.com/title/81215561”, 4000);
if (res.status >= 200 && res.status < 400) return “✅”;
if (res.status === 403) return “⚠️”;
return “❌”;
} catch { return “🚫”; }
}

async function checkHBO() {
try {
let res = await fetchWithTimeout(“https://www.max.com”, 4000);
return (res.status >= 200 && res.status < 400) ? “✅” : “❌”;
} catch { return “🚫”; }
}

async function checkTikTok() {
try {
let res = await fetchWithTimeout(“https://www.tiktok.com”, 4000);
return (res.status >= 200 && res.status < 400) ? “✅” : “❌”;
} catch { return “🚫”; }
}

async function checkDisney() {
try {
let res = await fetchWithTimeout(“https://www.disneyplus.com”, 4000);
return (res.status >= 200 && res.status < 400) ? “✅” : “❌”;
} catch { return “🚫”; }
}

async function checkYouTube() {
try {
let res = await fetchWithTimeout(“https://www.youtube.com/premium”, 4000);
return (res.status >= 200 && res.status < 400) ? “✅” : “❌”;
} catch { return “🚫”; }
}

async function checkChatGPT() {
try {
let res = await fetchWithTimeout(“https://chatgpt.com”, 4000);
return (res.status >= 200 && res.status < 400) ? “✅” : “❌”;
} catch { return “🚫”; }
}

async function checkClaude() {
try {
let res = await fetchWithTimeout(“https://claude.ai”, 4000);
return (res.status >= 200 && res.status < 400) ? “✅” : “❌”;
} catch { return “🚫”; }
}

async function checkGemini() {
try {
let res = await fetchWithTimeout(“https://gemini.google.com”, 4000);
return (res.status >= 200 && res.status < 400) ? “✅” : “❌”;
} catch { return “🚫”; }
}

// 带超时的 fetch
function fetchWithTimeout(url, timeout, policy) {
return new Promise((resolve, reject) => {
let timer = setTimeout(() => reject(new Error(‘请求超时’)), timeout);

```
let headers = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
};

let opts = { url, timeout, headers };
if (policy) opts.policy = policy;

$httpClient.get(opts, (err, resp, data) => {
  clearTimeout(timer);
  if (err) {
    reject(err);
  } else {
    resp.data = data;
    resolve(resp);
  }
});
```

});
}