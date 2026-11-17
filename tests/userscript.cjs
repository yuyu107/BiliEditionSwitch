const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'..','BiliEditionSwitch.user.js'),'utf8');
let checks=0;function eq(a,b){assert.deepEqual(a,b);checks++;}
function setup(url,lang='en') {
 const nodes=[],menus={},cookieWrites=[],intervals=[];let shadow;let stored=lang;
 class El {
  constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.style={setProperty:(k,v)=>{this.style[k]=v}};this.isConnected=true;this.hidden=false;this.textContent='';nodes.push(this);}
  append(...nodes){this.children.push(...nodes)} appendChild(n){this.append(n);return n}
  setAttribute(k,v){this[k]=v} addEventListener(k,fn){this.handlers[k]=fn}
  attachShadow(){shadow=new El('shadow');return shadow}
  focus(){shadow.activeElement=this} click(){this.handlers.click?.({target:this})}
  get options(){return this.children} get selectedIndex(){return this.children.findIndex(x=>x.value===this.value)}
 }
 const doc={body:new El('body'),documentElement:new El('html'),createElement:tag=>new El(tag),getElementById:()=>null,addEventListener:(k,f)=>{doc[k]=f}};
 Object.defineProperty(doc,'cookie',{set:v=>cookieWrites.push(v)});
 const location={href:url,assign:u=>{location.assigned=u}};
 const ctx={URL,document:doc,location,GM_getValue:()=>stored,GM_setValue:(k,v)=>{stored=v},GM_registerMenuCommand:(s,f)=>{menus[s]=f},setTimeout:()=>1,clearTimeout:()=>{},setInterval:f=>intervals.push(f)};
 vm.runInNewContext(source,ctx);
 return {nodes,menus,location,cookieWrites,doc,intervals,get stored(){return stored}};
}
for(const lang of ['en','zh-Hans','zh-Hant','ja','th','vi','id','ms','ar','pt','es','tr','ru']){
 let s=setup('https://www.bilibili.com/video/BV188WZ63Eqm?p=2&t=60#reply',lang);
 s.menus['切换国内版 / 国际版']();
 eq(s.location.assigned,`https://www.bilibili.com/${lang}/video/BV188WZ63Eqm?p=2&t=60#reply`);
 eq(s.cookieWrites[0].startsWith('user_site=OVERSEAS;'),true);
 eq(s.cookieWrites[1].startsWith('lang='+lang+';'),true);
 s=setup(`https://www.bilibili.com/${lang}/video/BV188WZ63Eqm?p=2`,lang);
 s.menus['切换国内版 / 国际版']();
 eq(s.location.assigned,'https://www.bilibili.com/video/BV188WZ63Eqm?p=2');
 eq(s.cookieWrites[0].startsWith('user_site=CN;'),true);
}
let s=setup('https://www.bilibili.com/');
const select=s.nodes.find(n=>n.tag==='select');eq(select.children.length,13);
s.menus['设置国际版默认语言…']();eq(select.value,'en');
select.value='ja';s.nodes.find(n=>n.tag==='button'&&n.textContent==='保存').click();eq(s.stored,'ja');
s.menus['切换国内版 / 国际版']();eq(s.location.assigned,'https://www.bilibili.com/ja/');
s=setup('https://space.bilibili.com/123','zh-Hans');s.menus['切换国内版 / 国际版']();eq(s.location.assigned,'https://www.bilibili.com/zh-Hans/');
s=setup('https://www.bilibili.com/');s.location.href='https://www.bilibili.com/en/';s.intervals[0]();eq(s.nodes.some(n=>n.tag==='button'&&n.textContent==='切到国内版'),true);
s.doc.fullscreenElement={};s.doc.fullscreenchange();eq(s.nodes.find(n=>n.id==='bili-edition-switch-userscript').style.display,'none');
s.doc.fullscreenElement=null;s.doc.fullscreenchange();eq(s.nodes.find(n=>n.id==='bili-edition-switch-userscript').style.display,'block');
s=setup('https://example.com');eq(Object.keys(s.menus).length,0);

for (const lang of ['en','zh-Hans','zh-Hant','ja','th','vi','id','ms','ar','pt','es','tr','ru']) {
 let c=setup('https://member.bilibili.com/platform/upload/video/frame?aid=123#edit',lang);
 c.menus['切换国内版 / 国际版']();
 eq(c.location.assigned,`https://member.bilibili.com/${lang}/platform/upload/video/frame?aid=123#edit`);
 c=setup(`https://member.bilibili.com/${lang}/platform/home?from=header`,lang);
 eq(c.nodes.some(n=>n.tag==='button'&&n.textContent==='切到国内版'),true);
 c.menus['切换国内版 / 国际版']();
 eq(c.location.assigned,'https://member.bilibili.com/platform/home?from=header');
}
console.log(`${checks} userscript checks passed (simulated DOM and GM APIs)`);
