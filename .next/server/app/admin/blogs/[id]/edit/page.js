(()=>{var e={};e.id=699,e.ids=[699],e.modules={10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},12412:e=>{"use strict";e.exports=require("assert")},94735:e=>{"use strict";e.exports=require("events")},29021:e=>{"use strict";e.exports=require("fs")},81630:e=>{"use strict";e.exports=require("http")},55591:e=>{"use strict";e.exports=require("https")},21820:e=>{"use strict";e.exports=require("os")},33873:e=>{"use strict";e.exports=require("path")},27910:e=>{"use strict";e.exports=require("stream")},83997:e=>{"use strict";e.exports=require("tty")},79551:e=>{"use strict";e.exports=require("url")},28354:e=>{"use strict";e.exports=require("util")},74075:e=>{"use strict";e.exports=require("zlib")},97260:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>a.a,__next_app__:()=>p,pages:()=>c,routeModule:()=>u,tree:()=>l});var s=r(70260),i=r(28203),o=r(25155),a=r.n(o),n=r(67292),d={};for(let e in n)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>n[e]);r.d(t,d);let l=["",{children:["admin",{children:["blogs",{children:["[id]",{children:["edit",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,12176)),"/home/chris-laptop/coding/bounce-v3/src/app/admin/blogs/[id]/edit/page.tsx"]}]},{}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,96038)),"/home/chris-laptop/coding/bounce-v3/src/app/admin/layout.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,98786)),"/home/chris-laptop/coding/bounce-v3/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,19937,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(r.t.bind(r,69116,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(r.t.bind(r,41485,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["/home/chris-laptop/coding/bounce-v3/src/app/admin/blogs/[id]/edit/page.tsx"],p={require:r,loadChunk:()=>Promise.resolve()},u=new s.AppPageRouteModule({definition:{kind:i.RouteKind.APP_PAGE,page:"/admin/blogs/[id]/edit/page",pathname:"/admin/blogs/[id]/edit",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},1452:(e,t,r)=>{Promise.resolve().then(r.bind(r,12176))},65004:(e,t,r)=>{Promise.resolve().then(r.bind(r,35636))},35636:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>p});var s=r(45512),i=r(58009),o=r.n(i),a=r(79334),n=r(80332),d=r(24715),l=r(45956),c=r(50688);function p({params:e}){let t=(0,a.useRouter)(),[r,p]=(0,i.useState)(null),[u,m]=(0,i.useState)(!0),[x,h]=(0,i.useState)(""),g=o().use(e),b=async e=>{try{let r={...e,categories:Array.isArray(e.categories)?e.categories.join(","):e.categories,tags:Array.isArray(e.tags)?e.tags.join(","):e.tags};await l.Ay.put(`${c.J}${c.Q.BLOGS}/${g.id}`,r),t.push("/admin/blogs")}catch(e){if(e instanceof Error)throw e;throw Error("Failed to update blog post")}};return u?(0,s.jsx)("div",{className:"flex justify-center items-center h-48",children:(0,s.jsx)(d.k,{className:"w-8 h-8"})}):x?(0,s.jsxs)("div",{className:"text-center text-red-600 p-4",children:[(0,s.jsxs)("p",{children:["Error: ",x]}),(0,s.jsx)("button",{onClick:()=>window.location.reload(),className:"mt-2 text-indigo-600 hover:text-indigo-900",children:"Try Again"})]}):(0,s.jsxs)("div",{className:"py-10 px-4 sm:px-6 lg:px-8",children:[(0,s.jsx)("div",{className:"sm:flex sm:items-center",children:(0,s.jsxs)("div",{className:"sm:flex-auto",children:[(0,s.jsx)("h1",{className:"text-2xl font-semibold leading-6 text-gray-900",children:"Edit Blog Post"}),(0,s.jsx)("p",{className:"mt-2 text-sm text-gray-700",children:"Make changes to the blog post below."})]})}),(0,s.jsx)("div",{className:"mt-8",children:r&&(0,s.jsx)(n.A,{initialData:r,onSubmit:b,isEdit:!0})})]})}},12176:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>s});let s=(0,r(46760).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/chris-laptop/coding/bounce-v3/src/app/admin/blogs/[id]/edit/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/chris-laptop/coding/bounce-v3/src/app/admin/blogs/[id]/edit/page.tsx","default")}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[638,434,77,668,144,389],()=>r(97260));module.exports=s})();