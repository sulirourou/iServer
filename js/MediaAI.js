/**
 * Egern 融合旗舰版
 * 网络缝合版，如有侵权联系本人删除！
 * 1. 核心: IP 检测 + 落地分析
 * 2. 流媒体: 移植 QX 脚本逻辑 + 补全 TikTok/HBO
 * 3. 样式: 全线统一为 "支持 ⟦🇺🇸⟧ 🎉" 风格
 * 4. AI: ChatGPT(Trace) + Claude/Gemini (样式对齐)
 */

const localUrl = "https://myip.ipip.net/json";
const proxyUrl = "https://my.ippure.com/v1/info";

// --- 常量定义 ---
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
  // ================= 1. 数据结构初始化 =================
  let info = {
    // 基础网络信息
    local: { ip: "获取中...", flag: "", country: "", city: "", isp: "" },
    // 节点落地信息 (新增 countryCode 供后续回退使用)
    ip: "获取中...", type: "IPv4", asn: "", org: "", flag: "🏳️", country: "", city: "", countryCode: "UN", nativeText: "", riskText: "", riskLevel: 0,
    // 服务解锁状态
    streaming: {},
    ai: {}
  };

  // ================= 2. 并行检测队列 =================
  // 注意：必须先获取落地 IP (getLandingIP)，因为部分后续检测依赖 info.countryCode 生成国旗
  await getLandingIP().then(res => Object.assign(info, res));
  
  // 其余检测并行执行
  await Promise.all([
    getLocalIP().then(res => info.local = res),
    
    // --- 流媒体组 ---
    checkNetflix().then(res => info.streaming.Netflix = res),
    checkDisney().then(res => info.streaming.Disney = res),
    checkYouTube().then(res => info.streaming.YouTube = res),
    checkTikTok().then(res => info.streaming.TikTok = res),      // 补回 TikTok
    checkHBO().then(res => info.streaming.HBO = res),            // 补回 HBO Max
    checkDazn().then(res => info.streaming.Dazn = res),
    checkParamount().then(res => info.streaming.Paramount = res),
    checkDiscovery().then(res => info.streaming.Discovery = res),
    
    // --- AI 组 ---
    checkChatGPT().then(res => info.ai.ChatGPT = res),
    checkClaude().then(res => info.ai.Claude = res),
    checkGemini().then(res => info.ai.Gemini = res)
  ]);

  // ================= 3. 面板 UI 构建 =================

  // --- 头部：本地网络 ---
  let content = `🏠 本地 IP: ${info.local.ip}\n`;
  content += `📍 位置: ${info.local.flag} ${info.local.country} ${info.local.city}\n`;
  content += `🏢 运营商: ${info.local.isp}\n`;
  content += `                             \n`;

  // --- 中部：节点质量 ---
  content += `🛡️ 【节点 IP 纯净度】\n`;
  content += `🌐 ${info.type}: ${info.ip}\n`;
  content += `📡 ASN: AS${info.asn} ${info.org}\n`;
  content += `📍 位置: ${info.flag} ${info.country} ${info.city}\n`;
  content += `🚦 原生 IP: ${info.nativeText}\n`;
  content += `${info.riskText}`; 

  // --- 下部：流媒体 ---
  content += `\n\n🎬 【流媒体服务】\n`;
  content += `🎥 Netflix: ${info.streaming.Netflix}\n`;
  content += `🏰 Disney+: ${info.streaming.Disney}\n`;
  content += `▶️ YouTube: ${info.streaming.YouTube}\n`;
  content += `🎵 TikTok: ${info.streaming.TikTok}\n`;
  content += `🎞️ HBO Max: ${info.streaming.HBO}\n`;
  content += `🥊 Dazn: ${info.streaming.Dazn || "检测失败"}\n`;
  content += `🏔️ Paramount+: ${info.streaming.Paramount || "检测失败"}\n`;
  content += `🌍 Discovery+: ${info.streaming.Discovery || "检测失败"}\n`;

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

  // 2. 获取代理落地 IP (提取 countryCode)
  async function getLandingIP() {
    try {
      let res = await fetch(proxyUrl);
      let j = JSON.parse(res.data);
      const ip = j.ip || j.query || "获取失败";
      const type = ip.includes(':') ? 'IPv6' : 'IPv4';
      const asn = j.asn || "";
      const org = j.asOrganization || "";
      const countryCode = j.countryCode || "UN"; // 保存国家代码
      const flag = flagEmoji(countryCode);
      const country = j.country || "";
      const city = j.city || "";
      const nativeText = j.isResidential ? "✅ 是 (原生)" : "🏢 否 (机房/商业)";
      const risk = j.fraudScore || 0;
      
      let riskText = "";
      if (risk >= 80) riskText = `🛑 极高风险 (${risk})`;
      else if (risk >= 70) riskText = `⚠️ 高风险 (${risk})`;
      else if (risk >= 40) riskText = `🔶 中等风险 (${risk})`;
      else riskText = `✅ 低风险 (${risk})`;

      return { ip, type, asn, org, flag, country, city, countryCode, nativeText, riskText, riskLevel: risk };
    } catch (e) {
      return { ip: "网络错误", type: "IPv4", asn: "000", org: "Unknown", flag: "❌", country: "获取失败", city: "", countryCode: "UN", nativeText: "❓ 未知", riskText: "❌ 检测失败" };
    }
  }

  // 旗帜 Emoji 转换
  function flagEmoji(code) {
    if (!code) return "🏳️";
    if (code.toUpperCase() === "TW") code = "CN";
    if (code.toUpperCase() === "UK") code = "GB";
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
  }

  // 基础 fetch
  function fetch(url) {
    return new Promise((resolve) => {
      let headers = { "User-Agent": UA };
      $httpClient.get({url, timeout: 5000, headers}, (err, resp, data) => {
        if (err) resolve({status: 500, url: "", data: null});
        else { resp.data = data; resolve(resp); }
      });
    });
  }

  // 策略 fetch
  function fetchWithPolicy(url, policyName) {
    return new Promise((resolve) => {
      let headers = { "User-Agent": UA };
      $httpClient.get({url, timeout: 3000, headers}, (err, resp, data) => {
        if (err) resolve({status: 500, url: "", data: null});
        else { resp.data = data; resolve(resp); }
      });
    });
  }

  // ===========================================
  //           流媒体检测功能区 (统一格式)
  // ===========================================

  // Disney+
  function checkDisney() {
      return new Promise((resolve) => {
          let params = {
              url: DISNEY_LOCATION_BASE_URL,
              timeout: 5000,
              headers: { 'Accept-Language': 'en', "Authorization": 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84', 'Content-Type': 'application/json', 'User-Agent': UA },
              body: JSON.stringify({ query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }', variables: { input: { applicationRuntime: 'chrome', attributes: { browserName: 'chrome', browserVersion: '94.0.4606', manufacturer: 'microsoft', operatingSystem: 'windows', operatingSystemVersion: '10.0', osDeviceIds: [] }, deviceFamily: 'browser', deviceLanguage: 'en', deviceProfile: 'windows' } } }),
          }
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

  // YouTube
  function checkYouTube() {
      return new Promise((resolve) => {
          let params = { url: YTB_BASE_URL, timeout: 5000, headers: { 'User-Agent': UA } }
          $httpClient.get(params, (err, response, data) => {
              if (err || response.status !== 200) { resolve("检测失败"); return; }
              if (data.indexOf('Premium is not available in your country') !== -1) {
                  resolve("未支持 🚫");
              } else {
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

  // Netflix
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
                  } else {
                      resolve("完整支持 ⟦未知⟧ 🎉");
                  }
              } else { resolve("检测失败"); }
          })
      })
  }

  // DAZN
  function checkDazn() {
      return new Promise((resolve) => {
          let params = {
              url: Dazn_BASE_URL, timeout: 5000, headers: { 'User-Agent': UA, "Content-Type": "application/json" },
              body: JSON.stringify({ "LandingPageKey":"generic", "Platform":"web", "PlatformAttributes":{}, "Version":"2" })
          };
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

  // Paramount+ (样式修正)
  function checkParamount() {
      return new Promise((resolve) => {
          let params = { url: Param_BASE_URL, timeout: 5000, headers: { 'User-Agent': UA } }
          $httpClient.get(params, (err, response, data) => {
              if (err) { resolve("检测失败"); return; }
              if (response.status == 200) resolve(`支持 ⟦${flagEmoji(info.countryCode)}⟧ 🎉`); // 使用 IP 地区作为旗帜
              else if (response.status == 302 || response.status == 403) resolve("未支持 🚫");
              else resolve("检测失败");
          })
      })
  }

  // Discovery+ (样式修正)
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
  
  // TikTok (恢复项)
  function checkTikTok() { 
    return new Promise((resolve) => {
        let params = { url: "https://www.tiktok.com", timeout: 5000, headers: { 'User-Agent': UA } }
        $httpClient.get(params, (err, response, data) => {
            if (err) { resolve("检测失败"); return; }
            if (response.status === 200 || response.status === 302) resolve(`支持 ⟦${flagEmoji(info.countryCode)}⟧ 🎉`);
            else resolve("未支持 🚫");
        })
    })
  }

  // HBO Max (恢复项)
  function checkHBO() { 
    return new Promise((resolve) => {
        let params = { url: "https://www.max.com", timeout: 5000, headers: { 'User-Agent': UA } }
        $httpClient.get(params, (err, response, data) => {
            if (err) { resolve("检测失败"); return; }
            if (response.status === 200) resolve(`支持 ⟦${flagEmoji(info.countryCode)}⟧ 🎉`);
            else resolve("未支持 🚫");
        })
    })
  }

  // ===========================================
  //               AI 检测功能区
  // ===========================================

  // ChatGPT
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

  // Claude (样式统一)
  async function checkClaude() { 
      try { 
          // 使用 favicon 检测连通性，然后使用 IP 地区显示旗帜
          let res = await fetch("https://claude.ai/favicon.ico"); 
          return res.status === 200 ? `支持 ⟦${flagEmoji(info.countryCode)}⟧ 🎉` : "未支持 🚫"; 
      } catch { return "检测失败"; } 
  }

  // Gemini (样式统一)
  async function checkGemini() { 
      try { 
          let res = await fetch("https://gemini.google.com"); 
          return res.status === 200 ? `支持 ⟦${flagEmoji(info.countryCode)}⟧ 🎉` : "未支持 🚫"; 
      } catch { return "检测失败"; } 
  }

})();
