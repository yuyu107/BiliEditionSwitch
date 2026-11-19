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
    // Verified pages use path prefixes. Other pages retain their origin and path
    // and request the edition through query hints, which the website may ignore.
    const pathMode = !!current.language ||
      (creator && /^\/platform(?:\/|$)/.test(path)) ||
      (main && (path === "/" || /^\/video\/(?:BV[a-zA-Z0-9]+|av\d+)\/?$/i.test(path)));
    const target = new URL(url);
    target.protocol = "https:";
    target.port = "";
    target.username = "";
    target.password = "";
    // Keep the user's subdomain; only canonicalize the bare main-site hostname.
    if (target.hostname === "bilibili.com") target.hostname = "www.bilibili.com";
    for (const key of Array.from(target.searchParams.keys())) {
      if (["site", "lang"].includes(key.toLowerCase())) target.searchParams.delete(key);
    }
    target.pathname = pathMode && international ? "/" + language + (path !== "/" ? path : "/") : path;
    if (!pathMode && international) {
      target.searchParams.set("site", "OVERSEAS");
      target.searchParams.set("lang", language);
    }
    return {url: target.href, international, language, parameterMode: !pathMode};
  }

  return {languages, defaults, normalizeLanguage, inspect, plan};
})();
if (typeof module !== "undefined") module.exports = BiliSwitch;

