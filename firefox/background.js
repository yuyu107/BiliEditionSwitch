"use strict";
const busyTabs = new Set();

// Only writes the site's two public preference cookies after an explicit click.
// Run in the selected tab so Firefox Containers / private tabs keep their own cookies.
function preferenceCode(international, language) {
  return `(() => {
    const host = location.hostname;
    if (!(host === "bilibili.com" || host.endsWith(".bilibili.com"))) throw new Error("页面已离开 B站");
    const attrs = "; Domain=.bilibili.com; Path=/; Max-Age=31536000; SameSite=Lax";
    document.cookie = "user_site=${international ? "OVERSEAS" : "CN"}" + attrs;
    document.cookie = "lang=${international ? BiliSwitch.normalizeLanguage(language) : "zh-Hans"}" + attrs;
    return true;
  })()`;
}

async function showError(tabId, message) {
  console.warn("BiliSwitch:", message);
  if (!Number.isInteger(tabId)) return;
  try {
    await browser.browserAction.setBadgeText({tabId, text: "!"});
    await browser.browserAction.setBadgeBackgroundColor({tabId, color: "#b33050"});
    await browser.browserAction.setTitle({tabId, title: message});
  } catch (_) { /* tab may have closed */ }
}

async function toggle(tab) {
  if (!Number.isInteger(tab.id) || busyTabs.has(tab.id)) return;
  busyTabs.add(tab.id);
  try {
    const settings = await browser.storage.local.get(BiliSwitch.defaults);
    const next = BiliSwitch.plan(tab.url, settings.language);
    if (!next) {
      await showError(tab.id, "请先打开 B站 bilibili.com，再点击切换。右键按钮可设置语言。");
      return;
    }
    await browser.tabs.executeScript(tab.id, {
      code: preferenceCode(next.international, next.language),
      runAt: "document_start"
    });
    await browser.tabs.update(tab.id, {url: next.url});
    await browser.browserAction.setBadgeText({tabId: tab.id, text: ""});
    await browser.browserAction.setTitle({tabId: tab.id, title: next.fallback
      ? "此页面尚未适配，已切换到目标版本首页。右键可设置语言。"
      : "切换 B站国内版 / 国际版（右键可设置语言）"});
  } catch (error) {
    await showError(tab.id, "切换失败，请刷新 B站后重试：" + error.message);
  } finally {
    busyTabs.delete(tab.id);
  }
}

browser.browserAction.onClicked.addListener(toggle);
browser.menus.onClicked.addListener(info => {
  if (info.menuItemId === "settings") browser.runtime.openOptionsPage().catch(console.error);
});
browser.runtime.onInstalled.addListener(async () => {
  await browser.menus.removeAll();
  browser.menus.create({id: "settings", title: "设置国际版默认语言…", contexts: ["browser_action"]});
});
