(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[103],{6970:(e,t,n)=>{Promise.resolve().then(n.t.bind(n,3704,23))},8571:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var n in t)Object.defineProperty(e,n,{enumerable:!0,get:t[n]})}(t,{cancelIdleCallback:function(){return r},requestIdleCallback:function(){return n}});let n="undefined"!=typeof self&&self.requestIdleCallback&&self.requestIdleCallback.bind(window)||function(e){let t=Date.now();return self.setTimeout(function(){e({didTimeout:!1,timeRemaining:function(){return Math.max(0,50-(Date.now()-t))}})},1)},r="undefined"!=typeof self&&self.cancelIdleCallback&&self.cancelIdleCallback.bind(window)||function(e){return clearTimeout(e)};("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},3704:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var n in t)Object.defineProperty(e,n,{enumerable:!0,get:t[n]})}(t,{default:function(){return h},handleClientScriptLoad:function(){return _},initScriptLoader:function(){return b}});let r=n(306),l=n(9955),a=n(5155),i=r._(n(7650)),o=l._(n(2115)),u=n(1147),s=n(2815),d=n(8571),c=new Map,f=new Set,p=e=>{if(i.default.preinit){e.forEach(e=>{i.default.preinit(e,{as:"style"})});return}if("undefined"!=typeof window){let t=document.head;e.forEach(e=>{let n=document.createElement("link");n.type="text/css",n.rel="stylesheet",n.href=e,t.appendChild(n)})}},y=e=>{let{src:t,id:n,onLoad:r=()=>{},onReady:l=null,dangerouslySetInnerHTML:a,children:i="",strategy:o="afterInteractive",onError:u,stylesheets:d}=e,y=n||t;if(y&&f.has(y))return;if(c.has(t)){f.add(y),c.get(t).then(r,u);return}let _=()=>{l&&l(),f.add(y)},b=document.createElement("script"),g=new Promise((e,t)=>{b.addEventListener("load",function(t){e(),r&&r.call(this,t),_()}),b.addEventListener("error",function(e){t(e)})}).catch(function(e){u&&u(e)});a?(b.innerHTML=a.__html||"",_()):i?(b.textContent="string"==typeof i?i:Array.isArray(i)?i.join(""):"",_()):t&&(b.src=t,c.set(t,g)),(0,s.setAttributesFromProps)(b,e),"worker"===o&&b.setAttribute("type","text/partytown"),b.setAttribute("data-nscript",o),d&&p(d),document.body.appendChild(b)};function _(e){let{strategy:t="afterInteractive"}=e;"lazyOnload"===t?window.addEventListener("load",()=>{(0,d.requestIdleCallback)(()=>y(e))}):y(e)}function b(e){e.forEach(_),[...document.querySelectorAll('[data-nscript="beforeInteractive"]'),...document.querySelectorAll('[data-nscript="beforePageRender"]')].forEach(e=>{let t=e.id||e.getAttribute("src");f.add(t)})}function g(e){let{id:t,src:n="",onLoad:r=()=>{},onReady:l=null,strategy:s="afterInteractive",onError:c,stylesheets:p,..._}=e,{updateScripts:b,scripts:g,getIsSsr:h,appDir:m,nonce:v}=(0,o.useContext)(u.HeadManagerContext),O=(0,o.useRef)(!1);(0,o.useEffect)(()=>{let e=t||n;O.current||(l&&e&&f.has(e)&&l(),O.current=!0)},[l,t,n]);let I=(0,o.useRef)(!1);if((0,o.useEffect)(()=>{!I.current&&("afterInteractive"===s?y(e):"lazyOnload"===s&&("complete"===document.readyState?(0,d.requestIdleCallback)(()=>y(e)):window.addEventListener("load",()=>{(0,d.requestIdleCallback)(()=>y(e))})),I.current=!0)},[e,s]),("beforeInteractive"===s||"worker"===s)&&(b?(g[s]=(g[s]||[]).concat([{id:t,src:n,onLoad:r,onReady:l,onError:c,..._}]),b(g)):h&&h()?f.add(t||n):h&&!h()&&y(e)),m){if(p&&p.forEach(e=>{i.default.preinit(e,{as:"style"})}),"beforeInteractive"===s)return n?(i.default.preload(n,_.integrity?{as:"script",integrity:_.integrity,nonce:v,crossOrigin:_.crossOrigin}:{as:"script",nonce:v,crossOrigin:_.crossOrigin}),(0,a.jsx)("script",{nonce:v,dangerouslySetInnerHTML:{__html:"(self.__next_s=self.__next_s||[]).push("+JSON.stringify([n,{..._,id:t}])+")"}})):(_.dangerouslySetInnerHTML&&(_.children=_.dangerouslySetInnerHTML.__html,delete _.dangerouslySetInnerHTML),(0,a.jsx)("script",{nonce:v,dangerouslySetInnerHTML:{__html:"(self.__next_s=self.__next_s||[]).push("+JSON.stringify([0,{..._,id:t}])+")"}}));"afterInteractive"===s&&n&&i.default.preload(n,_.integrity?{as:"script",integrity:_.integrity,nonce:v,crossOrigin:_.crossOrigin}:{as:"script",nonce:v,crossOrigin:_.crossOrigin})}return null}Object.defineProperty(g,"__nextScript",{value:!0});let h=g;("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},2815:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"setAttributesFromProps",{enumerable:!0,get:function(){return a}});let n={acceptCharset:"accept-charset",className:"class",htmlFor:"for",httpEquiv:"http-equiv",noModule:"noModule"},r=["onLoad","onReady","dangerouslySetInnerHTML","children","onError","strategy","stylesheets"];function l(e){return["async","defer","noModule"].includes(e)}function a(e,t){for(let[a,i]of Object.entries(t)){if(!t.hasOwnProperty(a)||r.includes(a)||void 0===i)continue;let o=n[a]||a.toLowerCase();"SCRIPT"===e.tagName&&l(o)?e[o]=!!i:e.setAttribute(o,String(i)),(!1===i||"SCRIPT"===e.tagName&&l(o)&&(!i||"false"===i))&&(e.setAttribute(o,""),e.removeAttribute(o))}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)}},e=>{var t=t=>e(e.s=t);e.O(0,[441,517,358],()=>t(6970)),_N_E=e.O()}]);