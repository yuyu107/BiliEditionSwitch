"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..", "firefox");
const routing = require(path.join(root, "shared.js"));
let checks = 0;
function equal(a, b) { assert.deepEqual(a, b); checks++; }
const home = "https://www.bilibili.com/";
equal(routing.plan(home, "en").url, home + "en/");
equal(routing.plan(home + "en/", "ja").url, home);
equal(routing.plan(home + "zh-Hans/", "en").international, false);
equal(routing.plan(home + "zh-Hant", "en").url, home);
equal(routing.plan(home + "EN/video/BV188WZ63Eqm?p=2&t=120#reply", "en").url,
  home + "video/BV188WZ63Eqm?p=2&t=120#reply");
equal(routing.plan(home + "video/BV188WZ63Eqm?p=2&t=120#reply", "ja").url,
  home + "ja/video/BV188WZ63Eqm?p=2&t=120#reply");
equal(routing.plan(home + "video/av170001?site=OVERSEAS&lang=ja&p=2", "en").url,
  home + "video/av170001?p=2");
equal(routing.plan(home + "video/av170001?SITE=CN&LANG=bad&p=2", "zh-Hans").url,
  home + "zh-Hans/video/av170001?p=2");
equal(routing.plan("https://space.bilibili.com/123", "ja").url, home + "ja/");
equal(routing.plan(home + "bangumi/play/ss123", "en").fallback, true);
equal(routing.plan(home + "ja/bangumi/play/ss123", "en").url, home);
equal(routing.plan("https://bilibili.com/", "ru").url, home + "ru/");
equal(routing.plan("http://www.bilibili.com/", "en").url, home + "en/");
for (const raw of ["https://www.bilibili.tv/en", "https://bilibili.com.evil.test/", "about:debugging", "file:///tmp/bilibili.com", "garbage"]) {
  equal(routing.plan(raw, "en"), null);
}
equal(routing.normalizeLanguage('";alert(1)//'), "en");
for (const [lang] of routing.languages) {
  const to = routing.plan(home, lang);
  equal(to.url, home + lang + "/");
  equal(routing.plan(to.url, lang).url, home);
}

async function integration() {
  const calls = [];
  const listeners = {};
  const cookies = [];
  let preferences = {language: "ja"};
  const browser = {
    storage: {local: {get: async () => preferences}},
    browserAction: {
      onClicked: {addListener: fn => { listeners.toggle = fn; }},
      setBadgeText: async x => calls.push(["badge", x]),
      setBadgeBackgroundColor: async () => {}, setTitle: async () => {}
    },
    menus: {onClicked: {addListener: fn => { listeners.menu = fn; }}, removeAll: async () => {}, create: x => calls.push(["menu", x])},
    runtime: {onInstalled: {addListener: fn => { listeners.install = fn; }}, openOptionsPage: async () => calls.push(["options"])},
    tabs: {
      executeScript: async (id, details) => {
        calls.push(["execute", id]);
        const doc = {};
        Object.defineProperty(doc, "cookie", {set: v => cookies.push(v)});
        vm.runInNewContext(details.code, {location: {hostname: "www.bilibili.com"}, document: doc});
      },
      update: async (id, details) => calls.push(["update", id, details.url])
    }
  };
  const ctx = vm.createContext({browser, URL, console: {warn() {}, error() {}}});
  vm.runInContext(fs.readFileSync(path.join(root, "shared.js"), "utf8"), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "background.js"), "utf8"), ctx);
  await listeners.toggle({id: 7, url: home + "video/BV188WZ63Eqm?p=3"});
  equal(calls.find(x => x[0] === "update"), ["update", 7, home + "ja/video/BV188WZ63Eqm?p=3"]);
  equal(cookies[0].startsWith("user_site=OVERSEAS;"), true);
  equal(cookies[1].startsWith("lang=ja;"), true);
  equal(calls.findIndex(x => x[0] === "execute") < calls.findIndex(x => x[0] === "update"), true);
  calls.length = 0; cookies.length = 0;
  await listeners.toggle({id: 7, url: home + "ja/video/BV188WZ63Eqm"});
  equal(cookies[0].startsWith("user_site=CN;"), true);
  equal(cookies[1].startsWith("lang=zh-Hans;"), true);
  calls.length = 0;
  await listeners.toggle({id: 7, url: "https://example.com"});
  equal(calls.some(x => x[0] === "update" || x[0] === "execute"), false);
  equal(calls.some(x => x[0] === "badge" && x[1].text === "!"), true);
  calls.length = 0;
  browser.tabs.executeScript = async () => { throw new Error("denied"); };
  await listeners.toggle({id: 7, url: home});
  equal(calls.some(x => x[0] === "update"), false);
  equal(calls.some(x => x[0] === "badge" && x[1].text === "!"), true);
  await listeners.install();
  equal(calls.some(x => x[0] === "menu" && x[1].id === "settings"), true);
  await listeners.menu({menuItemId: "settings"});
  equal(calls.some(x => x[0] === "options"), true);
}
integration().then(() => console.log(`${checks} routing and background checks passed`)).catch(e => {console.error(e);process.exitCode = 1;});
