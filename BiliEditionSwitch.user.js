// ==UserScript==
// @name         B站国内版 / 国际版一键切换
// @namespace    bili-edition-switch
// @version      0.1.2
// @description  一键切换 bilibili.com 国内版与国际多语言版，自选国际版默认语言（13种）。
// @match        https://bilibili.com/*
// @match        https://*.bilibili.com/*
// @match        http://bilibili.com/*
// @match        http://*.bilibili.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @homepageURL  https://github.com/yuyu107/BiliEditionSwitch
// @supportURL   https://github.com/yuyu107/BiliEditionSwitch/issues
// @updateURL    https://raw.githubusercontent.com/yuyu107/BiliEditionSwitch/main/BiliEditionSwitch.meta.js
// @downloadURL  https://raw.githubusercontent.com/yuyu107/BiliEditionSwitch/main/BiliEditionSwitch.user.js
// @run-at       document-end
// @noframes
// ==/UserScript==

(function () {
  "use strict";
/* Shared pure routing code; no page or network access. */
"use strict";
var BiliSwitch = (() => {
  const languages = [
    ["en", "English（英语）"], ["zh-Hans", "简体中文"],
    ["zh-Hant", "繁體中文"], ["ja", "日本語（日语）"],
    ["th", "ไทย（泰语）"], ["vi", "Tiếng Việt（越南语）"],
    ["id", "Bahasa Indonesia（印度尼西亚语）"],
    ["ms", "Bahasa Melayu（马来语）"], ["ar", "العربية（阿拉伯语）"],
    ["pt", "Português（葡萄牙语）"], ["es", "Español（西班牙语）"],
    ["tr", "Türkçe（土耳其语）"], ["ru", "Русский（俄语）"]
  ];
  const defaults = {language: "en"};
  function normalizeLanguage(value) {
    return languages.find(([code]) => code.toLowerCase() === String(value).toLowerCase())?.[0] || "en";
  }
  function inspect(raw) {
    let url;
    try { url = new URL(raw); } catch (_) { return null; }
    if (!/^https?:$/.test(url.protocol) ||
        !(url.hostname === "bilibili.com" || url.hostname.endsWith(".bilibili.com"))) return null;
    const main = ["www.bilibili.com", "bilibili.com"].includes(url.hostname);
    const creator = url.hostname === "member.bilibili.com";
    const segments = url.pathname.split("/");
    const language = languages.find(([code]) => code.toLowerCase() === segments[1].toLowerCase())?.[0];
    const params = Array.from(url.searchParams);
    const value = name => params.find(([key]) => key.toLowerCase() === name)?.[1];
    const international = !!language || value("site")?.toUpperCase() === "OVERSEAS" ||
      languages.some(([code]) => code.toLowerCase() === value("lang")?.toLowerCase());
    const path = language ? "/" + segments.slice(2).join("/") : url.pathname;
    return {url, main, creator, language, path: path || "/", international};
  }
  function plan(raw, preferredLanguage) {
    const current = inspect(raw);
    if (!current) return null;
    const international = !current.international;
    const language = normalizeLanguage(preferredLanguage);
    const {url, main, creator, path} = current;
    // Creator Center uses the same /<language>/ prefix before /platform/ routes.
    const supported = (creator && /^\/platform(?:\/|$)/.test(path)) ||
      (main && (path === "/" || /^\/video\/(?:BV[a-zA-Z0-9]+|av\d+)\/?$/i.test(path)));
    const target = supported ? new URL(url) : new URL("https://www.bilibili.com/");
    target.protocol = "https:";
    target.hostname = supported && creator ? "member.bilibili.com" : "www.bilibili.com";
    target.port = "";
    target.username = "";
    target.password = "";
    // Remove obsolete language/site overrides without dropping p, t, or other parameters.
    for (const key of Array.from(target.searchParams.keys())) {
      if (["site", "lang"].includes(key.toLowerCase())) target.searchParams.delete(key);
    }
    target.pathname = international ? "/" + language + (supported && path !== "/" ? path : "/") : (supported ? path : "/");
    return {url: target.href, international, language, fallback: !supported};
  }
  return {languages, defaults, normalizeLanguage, inspect, plan};
})();


  if (!BiliSwitch.inspect(location.href) || document.getElementById("bili-edition-switch-userscript")) return;

  const host = document.createElement("div");
  host.id = "bili-edition-switch-userscript";
  // Keep controls isolated from Bilibili's page styles.
  host.style.cssText = "position:fixed!important;left:18px!important;bottom:24px!important;z-index:2147483646!important;display:block!important;";
  const root = host.attachShadow({mode: "closed"});
  const style = document.createElement("style");
  style.textContent = `
    :host { color-scheme: light; font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif; }
    * { box-sizing:border-box; }
    button,select { font:inherit; }
    button { cursor:pointer; border:0; }
    button:focus-visible,select:focus-visible { outline:3px solid #ee83af; outline-offset:3px; }
    .bar { display:flex; gap:1px; border-radius:12px; overflow:hidden; box-shadow:0 3px 18px #0003; }
    .bar button { color:#fff; background:#007db7; padding:10px 14px; }
    .bar button:hover { background:#00679a; }
    .bar .gear { background:#176b96; padding:10px 12px; }
    .overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; padding:20px; background:#0006; }
    [hidden] { display:none!important; }
    .panel { width:440px; max-width:100%; max-height:85vh; overflow:auto; padding:26px; background:#fff; color:#202736; border-radius:18px; box-shadow:0 16px 70px #0004; }
    h2 { font-size:21px; margin:0 0 18px; }
    label { display:block; font-weight:700; margin-bottom:8px; }
    select { width:100%; padding:10px; background:#fff; color:#202736; border:1px solid #aebbd0; border-radius:8px; }
    p { margin:14px 0; }
    .note { color:#58647a; font-size:13px; }
    .actions { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }
    .actions button { padding:9px 18px; border-radius:8px; background:#eaf0f5; color:#202736; }
    .actions .primary { background:#007db7; color:#fff; }
    .state { color:#007899; min-height:20px; margin:8px 0; }
    .notice { max-width:290px; padding:10px 14px; margin-bottom:8px; background:#fff; color:#202736; border-radius:10px; box-shadow:0 3px 18px #0003; }
    @media(max-width:480px) { .bar button { padding:8px 10px; } .panel { padding:20px; } }
  `;
  root.appendChild(style);
  function element(tag, text, cls) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }
  function button(text, cls, fn) {
    const el = element("button", text, cls);
    el.type = "button";
    el.addEventListener("click", fn);
    return el;
  }
  let noticeTimer;
  const notice = element("div", "", "notice");
  notice.hidden = true;
  notice.setAttribute("role", "status");
  root.appendChild(notice);
  function notify(message) {
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 4500);
  }
  function language() {
    return BiliSwitch.normalizeLanguage(GM_getValue("language", "en"));
  }
  let switching = false;
  function toggle() {
    if (switching) return;
    try {
      const next = BiliSwitch.plan(location.href, language());
      if (!next) return;
      const attrs = "; Domain=.bilibili.com; Path=/; Max-Age=31536000; SameSite=Lax";
      document.cookie = "user_site=" + (next.international ? "OVERSEAS" : "CN") + attrs;
      document.cookie = "lang=" + (next.international ? next.language : "zh-Hans") + attrs;
      switching = true;
      location.assign(next.url);
    } catch (error) {
      switching = false;
      notify("切换失败：" + error.message);
    }
  }
  const bar = element("div", "", "bar");
  const toggleButton = button("切到国际版", "", toggle);
  const settingsButton = button("⚙", "gear", openSettings);
  settingsButton.title = "设置国际版默认语言";
  settingsButton.setAttribute("aria-label", "设置国际版默认语言");
  bar.append(toggleButton, settingsButton);
  root.appendChild(bar);

  const overlay = element("div", "", "overlay");
  overlay.hidden = true;
  const panel = element("section", "", "panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "bes-heading");
  const heading = element("h2", "B站版本切换 · 设置");
  heading.id = "bes-heading";
  const label = element("label", "国际版默认语言");
  label.htmlFor = "bes-language";
  const select = element("select");
  select.id = "bes-language";
  for (const [code, name] of BiliSwitch.languages) {
    const option = element("option", name);
    option.value = code;
    select.appendChild(option);
  }
  const hint = element("p", "默认英语。选择简体中文也会进入国际版布局。保存后，下次切换至国际版时生效。", "note");
  const scope = element("p", "首页、普通视频页和创作中心保留原位置及网址参数；其他页面切到目标版本首页。切换会刷新页面，并更新 B站本地的版本、语言偏好。", "note");
  const privacy = element("p", "国际版指 bilibili.com/en/ 等多语言页面。设置保存在篡改猴中，不收集或上传数据。v0.1.2", "note");
  const state = element("p", "", "state");
  state.setAttribute("role", "status");
  const actions = element("div", "", "actions");
  const cancel = button("取消", "", closeSettings);
  const save = button("保存", "primary", () => {
    try {
      GM_setValue("language", BiliSwitch.normalizeLanguage(select.value));
      closeSettings();
      update();
      notify("已保存：" + select.options[select.selectedIndex].textContent);
    } catch (error) { state.textContent = "保存失败：" + error.message; }
  });
  actions.append(cancel, save);
  panel.append(heading, label, select, hint, scope, privacy, state, actions);
  overlay.appendChild(panel);
  root.appendChild(overlay);
  let previousFocus;
  function openSettings() {
    try { select.value = language(); } catch (error) { notify("读取设置失败：" + error.message); return; }
    previousFocus = root.activeElement || document.activeElement;
    state.textContent = "";
    overlay.hidden = false;
    select.focus();
  }
  function closeSettings() {
    overlay.hidden = true;
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  }
  overlay.addEventListener("click", event => { if (event.target === overlay) closeSettings(); });
  overlay.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeSettings(); }
    if (event.key === "Tab") {
      const focused = root.activeElement;
      if (event.shiftKey && focused === select) { event.preventDefault(); save.focus(); }
      else if (!event.shiftKey && focused === save) { event.preventDefault(); select.focus(); }
    }
  });
  function update() {
    const current = BiliSwitch.inspect(location.href);
    if (!current) return;
    toggleButton.textContent = current.international ? "切到国内版" : "切到国际版";
    const next = BiliSwitch.plan(location.href, language());
    toggleButton.title = next.fallback ? "当前页面暂未适配，点击切换到目标版本首页" : "保留当前页面网址参数，切换国内版 / 国际版";
  }
  function fullscreen() { host.style.setProperty("display", document.fullscreenElement ? "none" : "block", "important"); }
  document.addEventListener("fullscreenchange", fullscreen);
  (document.body || document.documentElement).appendChild(host);
  fullscreen();
  update();
  // SPA navigation may not fire popstate. Only recalculate when the URL changes.
  let lastUrl = location.href;
  setInterval(() => {
    if (lastUrl !== location.href) { lastUrl = location.href; update(); }
  }, 1000);
  GM_registerMenuCommand("切换国内版 / 国际版", toggle);
  GM_registerMenuCommand("设置国际版默认语言…", openSettings);

})();
