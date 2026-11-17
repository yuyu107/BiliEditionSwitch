"use strict";
const select = document.getElementById("language");
const save = document.getElementById("save");
const status = document.getElementById("status");
for (const [code, name] of BiliSwitch.languages) {
  const option = document.createElement("option");
  option.value = code;
  option.textContent = name;
  select.appendChild(option);
}
browser.storage.local.get(BiliSwitch.defaults).then(settings => {
  select.value = BiliSwitch.normalizeLanguage(settings.language);
  select.disabled = false;
  save.disabled = false;
}).catch(error => { status.textContent = "读取设置失败：" + error.message; });
select.addEventListener("change", () => { status.textContent = "尚未保存"; });
document.getElementById("settings").addEventListener("submit", async event => {
  event.preventDefault();
  save.disabled = true;
  try {
    await browser.storage.local.set({language: BiliSwitch.normalizeLanguage(select.value)});
    status.textContent = "已保存，下次切到国际版时生效。";
  } catch (error) {
    status.textContent = "保存失败：" + error.message;
  } finally { save.disabled = false; }
});
