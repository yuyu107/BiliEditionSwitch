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
if (typeof module !== "undefined") module.exports = BiliSwitch;
