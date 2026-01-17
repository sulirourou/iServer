/**
 * IP信息面板
 * 版本号: v1.0.3
 * 更新日期: 2026-01-17
 * 1. 核心: IP 检测 + 落地分析
 * 2. 排序: IP -> 流媒体 (Dazn...Paramount) -> AI (Grok...ChatGPT)
 * 3. 锁定: Grok 检测 grok.x.ai
 */

const localUrl = "https://myip.ipip.net/json";
const proxyUrl = "https://my.ippure.com/v1/info";

// ===========================================
//               常量定义区
// ===========================================
const NF_BASE_URL = "https://www.netflix.com/title/81280792";
const DISNEY_LOCATION_BASE_URL = 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql';
const YTB_BASE_URL = "https://www.youtube.com/premium";
const Dazn_BASE_URL = "https://startup.core.indazn.com/misl/v5/Startup";
const Param_BASE_URL = "https://www.paramountplus.com/";
const Discovery_token_BASE_URL = "https://us1-prod-direct.discoveryplus.com/token?deviceId=d1a4a5d25212400d1e6985984604d740&realm=go&shortlived=true";
const Discovery_BASE_URL = "https://us1-prod-direct.discoveryplus.com/users/me";
const GPT_BASE_URL = 'https://chat.openai.com/';
const GPT_RegionL_URL = 'https://chat.openai.com/cdn-cgi/trace';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36';

(async () => {
  // ===========================================
  //           1. 数据结构初始化
  // ===========================================
  let info = {
    // [1] IP 类信息
    local: { ip: "获取中...", flag: "", country: "", city: "", isp: "" },
    landing: { ip: "获取中...", type: "IPv4", asn: "", org: "", flag: "🏳️", country: "", city: "", countryCode: "UN", nativeText: "", riskText: "", riskLevel: 0 },
    
    // [2] 流媒体类状态
    streaming: {},
    
    // [3] AI 类状态
    ai: {}
  };

  // ===========================================
  //           2. 并行检测队列
  // ===========================================
  
  // 预加载：优先获取落地 IP (为后续检测提供 countryCode)
  await getLandingIP().then(res => Object.assign(info.landing, res));
  
  await Promise.all([
    // --- [1] IP 类检测 ---
    getLocalIP().then(res => info.local = res),
    
    // --- [2] 流媒体类检测 (严格指定顺序) ---
    checkDazn().then(res => info.streaming.Dazn = res),          // 1. Dazn
    checkTikTok().then(res => info.streaming.TikTok = res),      // 2. TikTok
    checkNetflix().then(res => info.streaming.Netflix = res),    // 3. Netflix
    checkDisney().then(res => info.streaming.Disney = res),      // 4. Disney+
    checkYouTube().then(res => info.streaming.YouTube = res),    // 5. YouTube
    checkHBO().then(res => info.streaming.HBO = res),            // 6. HBO Max
    checkDiscovery().then(res => info.streaming.Discovery = res),// 7. Discovery+
    checkParamount().then(res => info.streaming.Paramount = res),// 8. Paramount+
    
    // --- [3] AI 类检测 (长度排序) ---
    checkGrok().then(res => info.ai.Grok = res),                 // 1. Grok
    checkClaude().then(res => info.ai.Claude = res),             // 2. Claude
    checkGemini().then(res => info.ai.Gemini = res),             // 3. Gemini
    checkChatGPT().then(res => info.ai.ChatGPT = res)            // 4. ChatGPT
  ]);

  // ===========================================
  //           3. 面板 UI 构建
  // ===========================================

  // --- [1] IP 类板块 ---
  let content = `🏠 本地 IP: ${info.local.ip}\n`;
  content += `📍 位置: ${info.local.flag} ${info.local.country} ${info.local.city}\n`;
  content += `🏢 运营商: ${info.local.isp}\n`;
  content += `\n`; 
  content += `🛡️ 【节点 IP 纯净度】\n`;
  content += `🌐 ${info.landing.type}: ${info.landing.ip}\n`;
  content += `📡 ASN: AS${info.landing.asn} ${info.landing.org}\n`;
  content += `📍 位置: ${info.landing.flag} ${info.landing.country} ${info.landing.city}\n`;
  content += `🚦 原生 IP: ${info.landing.nativeText}\n`;
  content += `${info.landing.riskText}`; 

  // --- [2] 流媒体类板块 ---
  content += `\n\n🎬 【流媒体服务】\n`;
  content += `🥊 Dazn: ${info.streaming.Dazn || "检测失败"}\n`;
  content += `🎵 TikTok: ${info.streaming.TikTok}\n`;
  content += `🎥 Netflix: ${info.streaming.Netflix}\n`;
  content += `🏰 Disney+: ${info.streaming.Disney}\n`;
  content += `▶️ YouTube: ${info.streaming.YouTube}\n`;
  content += `🎞️ HBO Max: ${info.streaming.HBO}\n`;
  content += `🌍 Discovery+: ${info.streaming.Discovery || "检测失败"}\n`;
  content += `🏔️ Paramount+: ${info.streaming.Paramount || "检测失败"}\n`;

  // --- [3] AI 类板块 ---
  content += `\n🤖 【AI 助手】\n`;
  content += `✖️ Grok: ${info.ai.Grok}\n`;
  content += `🧠 Claude: ${info.ai.Claude}\n`;
  content += `✨ Gemini: ${info.ai.Gemini}\n`;
  content += `🤡 ChatGPT: ${info.ai.ChatGPT}`; 

  // --- 图标逻辑 ---
  let icon = "checkmark.seal.fill"; 
  let color = "#AF52DE"; 
  if (info.landing.riskLevel >= 70) {
      icon = "exclamationmark.triangle.fill";
      color = "#FF9500"; 
  }

  $done({
    title: "IP信息面板",
    content: content,
    icon: icon,
    "icon-color": color
  });

  // ===========================================
  //           4. 核心功能函数
  // ===========================================

  // --- [1] IP 类函数 ---

  // 获取本地直连 IP
  async function getLocalIP() {
    try {
      let res = await fetchWithPolicy(localUrl, "direct"); 
      let j = JSON.parse(res.data);
      if (j.ret === "ok" && j.data) {
          let loc = j.data.location || [];
          let country = loc[0] || "";
          let code = (country === "中国") ? "CN" : "UN";
          return { ip: j.data.ip || "查询失败", flag: flagEmoji(code), country: country, city: loc[2] || "", isp: loc[4] || "未知" };
      } else { throw new Error("API Error"); }
    } catch (e) { return { ip: "获取失败", flag: "❌", country: "", city: "", isp: "" }; }
  }

  // 获取代理落地 IP
  async function getLandingIP() {
    try {
      let res = await fetch(proxyUrl);
      let j = JSON.parse(res.data);
      const ip = j.ip || j.query || "获取失败";
      const type = ip.includes(':') ? 'IPv6' : 'IPv4';
      const asn = j.asn || "";
      const org = j.asOrganization || "";
      const countryCode = j.countryCode || "UN";
      const flag = flagEmoji(countryCode);
      const country = j.country || "";
      const city = j.city || "";
      const nativeText = j.isResidential ? "✅ 是 (原生)" : "🏢 否 (机房/商业)";
      const risk = j.fraudScore || 0;
      let riskText = risk >= 80 ? `🛑 极高风险 (${risk})` : risk >= 70 ? `⚠️ 高风险 (${risk})` : risk >= 40 ? `🔶 中等风险 (${risk})` : `✅ 低风险 (${risk})`;
      return { ip, type, asn, org, flag, country, city, countryCode, nativeText, riskText, riskLevel: risk };
    } catch (e) {
      return { ip: "网络错误", type: "IPv4", asn: "000", org: "Unknown", flag: "❌", country: "获取失败", city: "", countryCode: "UN", nativeText: "❓ 未知", riskText: "❌ 检测失败", riskLevel: 0 };
    }
  }

  // --- [2] 流媒体类函数 ---

  // 1. Dazn
  function checkDazn() {
      return new Promise((resolve) => {
          let params = { url: Dazn_BASE_URL, timeout: 5000, headers: { 'User-Agent': UA, "Content-Type": "application/json" }, body: JSON.stringify({ "LandingPageKey":"generic", "Platform":"web", "PlatformAttributes":{}, "Version":"2" }) };
          $httpClient.post(params, (err, response, data) => {
              if (err) { resolve("检测失败"); return; }
              if (response.status == 200) {
                  let re = new RegExp('"GeolocatedCountry":"(.*?)"', 'gm');
                  let ret = re.exec(data);
                  if (ret && ret.length === 2) resolve(`支持 ⟦${flagEmoji(ret[1])}⟧ 🎉`);
                  else resolve("未支持 🚫");
              } else { resolve("检测失败"); }
          })
      }) 
  }

  // 2. TikTok
  function checkTikTok() { 
    return new Promise((resolve) => {
        let params = { url: "https://www.tiktok.com", timeout: 5000, headers: { 'User-Agent': UA } }
        $httpClient.get(params, (err, response, data) => {
            if (err) { resolve("检测失败"); return; }
            if (response.status === 200 || response.status === 302) resolve(`支持 ⟦${flagEmoji(info.landing.countryCode)}⟧ 🎉`);
            else resolve("未支持 🚫");
        })
    })
  }

  // 3. Netflix
  function checkNetflix() {
      return new Promise((resolve) => {
          let params = { url: NF_BASE_URL, timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15' } }
          $httpClient.get(params, (err, response, data) => {
              if (err) { resolve("检测失败"); return; }
              if (response.status == 403) resolve("未支持 🚫");
              else if (response.status == 404) resolve("仅自制剧 ⚠️");
              else if (response.status == 200) {
                  let ourl = response.headers['X-Originating-URL'] || response.headers['x-originating-url'];
                  if (ourl) {
                      let region = ourl.split('/')[3].split('-')[0];
                      if (region == 'title') region = 'us';
                      resolve(`完整支持 ⟦${flagEmoji(region)}⟧ 🎉`);
                  } else { resolve("完整支持 ⟦未知⟧ 🎉"); }
              } else { resolve("检测失败"); }
          })
      })
  }

  // 4. Disney+
  function checkDisney() {
      return new Promise((resolve) => {
          let params = { url: DISNEY_LOCATION_BASE_URL, timeout: 5000, headers: { 'Accept-Language': 'en', "Authorization": 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84', 'Content-Type': 'application/json', 'User-Agent': UA }, body: JSON.stringify({ query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }', variables: { input: { applicationRuntime: 'chrome', attributes: { browserName: 'chrome', browserVersion: '94.0.4606', manufacturer: 'microsoft', operatingSystem: 'windows', operatingSystemVersion: '10.0', osDeviceIds: [] }, deviceFamily: 'browser', deviceLanguage: 'en', deviceProfile: 'windows' } } }) }
          $httpClient.post(params, (err, response, data) => {
              if (err) { resolve("检测失败"); return; }
              if (response.status == 200) {
                  try {
                      let resData = JSON.parse(data);
                      if (resData?.extensions?.sdk?.session) {
                          let { inSupportedLocation, location: { countryCode } } = resData.extensions.sdk.session;
                          if (inSupportedLocation == false) resolve(`即将登陆 ⟦${flagEmoji(countryCode)}⟧ ⚠️`);
                          else resolve(`支持 ⟦${flagEmoji(countryCode)}⟧ 🎉`);
                      } else { resolve("未支持 🚫"); }
                  } catch(e) { resolve("解析错误"); }
              } else { resolve("检测失败"); }
          })
      })
  }

  // 5. YouTube
  function checkYouTube() {
      return new Promise((resolve) => {
          let params = { url: YTB_BASE_URL, timeout: 5000, headers: { 'User-Agent': UA } }
          $httpClient.get(params, (err, response, data) => {
              if (err || response.status !== 200) { resolve("检测失败"); return; }
              if (data.indexOf('Premium is not available in your country') !== -1) resolve("未支持 🚫");
              else {
                  let region = '';
                  let re = new RegExp('"GL":"(.*?)"', 'gm');
                  let ret = re.exec(data);
                  if (ret && ret.length === 2) region = ret[1];
                  else if (data.indexOf('www.google.cn') !== -1) region = 'CN';
                  else region = 'US';
                  resolve(`支持 ⟦${flagEmoji(region)}⟧ 🎉`);
              }
          })
      })
  }

  // 6. HBO Max
  function checkHBO() { 
    return new Promise((resolve) => {
        let params = { url: "https://www.max.com", timeout: 5000, headers: { 'User-Agent': UA } }
        $httpClient.get(params, (err, response, data) => {
            if (err) { resolve("检测失败"); return; }
            if (response.status === 200) resolve(`支持 ⟦${flagEmoji(info.landing.countryCode)}⟧ 🎉`);
            else resolve("未支持 🚫");
        })
    })
  }

  // 7. Discovery+
  function checkDiscovery() {
      return new Promise((resolve) => {
          let params = { url: Discovery_token_BASE_URL, timeout: 5000, headers: { 'User-Agent': UA } }
          $httpClient.get(params, (err, response, data) => {
              if (err || response.status !== 200) { resolve("检测失败"); return; }
              try {
                  let d = JSON.parse(data);
                  let token = d["data"]["attributes"]["token"];
                  let p = { url: Discovery_BASE_URL, timeout: 5000, headers: { 'User-Agent': UA, "Cookie": `st=${token}` } }
                  $httpClient.get(p, (e, res, resData) => {
                      if (e || res.status !== 200) { resolve("检测失败"); return; }
                      let resD = JSON.parse(resData);
                      let loc = resD["data"]["attributes"]["currentLocationTerritory"];
                      if (loc == 'us') resolve(`支持 ⟦🇺🇸⟧ 🎉`);
                      else resolve(`未支持 (${loc}) 🚫`);
                  })
              } catch (e) { resolve("检测失败"); }
          })
      })
  }

  // 8. Paramount+
  function checkParamount() {
      return new Promise((resolve) => {
          let params = { url: Param_BASE_URL, timeout: 5000, headers: { 'User-Agent': UA } }
          $httpClient.get(params, (err, response, data) => {
              if (err) { resolve("检测失败"); return; }
              if (response.status == 200) resolve(`支持 ⟦${flagEmoji(info.landing.countryCode)}⟧ 🎉`); 
              else if (response.status == 302 || response.status == 403) resolve("未支持 🚫");
              else resolve("检测失败");
          })
      })
  }

  // --- [3] AI 类函数 ---

  // 1. Grok (锁定为 grok.x.ai)
  async function checkGrok() {
    try {
        let res = await fetch("https://grok.x.ai");
        return (res.status === 200 || res.status === 302) ? `支持 ⟦${flagEmoji(info.landing.countryCode)}⟧ 🎉` : "未支持 🚫";
    } catch { return "检测失败"; }
  }

  // 2. Claude
  async function checkClaude() { 
      try { 
          let res = await fetch("https://claude.ai/favicon.ico"); 
          return res.status === 200 ? `支持 ⟦${flagEmoji(info.landing.countryCode)}⟧ 🎉` : "未支持 🚫"; 
      } catch { return "检测失败"; } 
  }

  // 3. Gemini
  async function checkGemini() { 
      try { 
          let res = await fetch("https://gemini.google.com"); 
          return res.status === 200 ? `支持 ⟦${flagEmoji(info.landing.countryCode)}⟧ 🎉` : "未支持 🚫"; 
      } catch { return "检测失败"; } 
  }

  // 4. ChatGPT
  function checkChatGPT() {
      return new Promise((resolve) => {
          let params = { url: GPT_BASE_URL, timeout: 5000, headers: { 'User-Agent': UA }, 'auto-redirect':false }
          $httpClient.get(params, (err, response, data) => {
              if (err) { resolve("网络错误"); return; }
              if (JSON.stringify(response).indexOf("text/plain") == -1) {
                  let p = { url: GPT_RegionL_URL, timeout: 5000, headers: { 'User-Agent': UA } }
                  $httpClient.get(p, (e, res, resData) => {
                      if (e) { resolve("API 失败"); return; }
                      if (resData.indexOf("loc=") !== -1) {
                          let region = resData.split("loc=")[1].split("\n")[0];
                          if (["CN","HK","RU","IR","XX"].indexOf(region) == -1) resolve(`支持 ⟦${flagEmoji(region)}⟧ 🎉`);
                          else resolve("未支持 🚫");
                      } else { resolve("未支持 (无Trace) 🚫"); }
                  })
              } else { resolve("未支持 🚫"); }
          })
      })
  }

  // --- 辅助工具 ---
  function flagEmoji(code) {
    if (!code) return "🏳️";
    if (code.toUpperCase() === "TW") code = "CN";
    if (code.toUpperCase() === "UK") code = "GB";
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
  }

  function fetch(url) {
    return new Promise((resolve) => {
      let headers = { "User-Agent": UA };
      $httpClient.get({url, timeout: 5000, headers}, (err, resp, data) => {
        if (err) resolve({status: 500, url: "", data: null});
        else { resp.data = data; resolve(resp); }
      });
    });
  }

  function fetchWithPolicy(url, policyName) {
    return new Promise((resolve) => {
      let headers = { "User-Agent": UA };
      $httpClient.get({url, timeout: 3000, headers}, (err, resp, data) => {
        if (err) resolve({status: 500, url: "", data: null});
        else { resp.data = data; resolve(resp); }
      });
    });
  }
})();
