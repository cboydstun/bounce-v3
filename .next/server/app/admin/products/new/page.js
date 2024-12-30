(()=>{var e={};e.id=770,e.ids=[770],e.modules={10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},12412:e=>{"use strict";e.exports=require("assert")},94735:e=>{"use strict";e.exports=require("events")},29021:e=>{"use strict";e.exports=require("fs")},81630:e=>{"use strict";e.exports=require("http")},55591:e=>{"use strict";e.exports=require("https")},21820:e=>{"use strict";e.exports=require("os")},33873:e=>{"use strict";e.exports=require("path")},27910:e=>{"use strict";e.exports=require("stream")},83997:e=>{"use strict";e.exports=require("tty")},79551:e=>{"use strict";e.exports=require("url")},28354:e=>{"use strict";e.exports=require("util")},74075:e=>{"use strict";e.exports=require("zlib")},68034:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>l,pages:()=>u,routeModule:()=>p,tree:()=>c});var s=r(70260),i=r(28203),n=r(25155),o=r.n(n),a=r(67292),d={};for(let e in a)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>a[e]);r.d(t,d);let c=["",{children:["admin",{children:["products",{children:["new",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,25205)),"/home/chris-laptop/coding/bounce-v3/src/app/admin/products/new/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,96038)),"/home/chris-laptop/coding/bounce-v3/src/app/admin/layout.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,98786)),"/home/chris-laptop/coding/bounce-v3/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,19937,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(r.t.bind(r,69116,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(r.t.bind(r,41485,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],u=["/home/chris-laptop/coding/bounce-v3/src/app/admin/products/new/page.tsx"],l={require:r,loadChunk:()=>Promise.resolve()},p=new s.AppPageRouteModule({definition:{kind:i.RouteKind.APP_PAGE,page:"/admin/products/new/page",pathname:"/admin/products/new",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},94927:(e,t,r)=>{Promise.resolve().then(r.bind(r,25205))},78055:(e,t,r)=>{Promise.resolve().then(r.bind(r,49249))},49249:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>c});var s=r(45512),i=r(58009),n=r(79334),o=r(4570),a=r(45956),d=r(50688);function c(){let e=(0,n.useRouter)(),[t,r]=(0,i.useState)(null),c=async t=>{try{if(r(null),!localStorage.getItem("auth_token")){r("Authentication required. Please log in.");return}let s={...t,price:{base:t.price.base,currency:t.price.currency||"USD"},availability:t.availability||"available",rentalDuration:t.rentalDuration||"full-day",setupRequirements:{space:t.setupRequirements.space,powerSource:t.setupRequirements.powerSource||!0,surfaceType:t.setupRequirements.surfaceType||[]},features:t.features||[],weatherRestrictions:t.weatherRestrictions||[],additionalServices:t.additionalServices||[]};await a.Ay.post(`${d.J}${d.Q.PRODUCTS}`,s),e.push("/admin/products")}catch(e){console.error("Error creating product:",e),e instanceof Error?e.message.includes("401")?r("Authentication failed. Please log in again."):r(e.message):r("Failed to create product")}};return t?(0,s.jsx)("div",{className:"rounded-md bg-red-50 p-4",children:(0,s.jsx)("div",{className:"flex",children:(0,s.jsxs)("div",{className:"ml-3",children:[(0,s.jsx)("h3",{className:"text-sm font-medium text-red-800",children:t}),t.toLowerCase().includes("log in")&&(0,s.jsx)("div",{className:"mt-2",children:(0,s.jsx)("button",{onClick:()=>e.push("/login"),className:"text-sm font-medium text-red-800 underline hover:text-red-600",children:"Go to Login"})})]})})}):(0,s.jsxs)("div",{className:"space-y-6",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h2",{className:"text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight",children:"Add New Product"}),(0,s.jsx)("p",{className:"mt-2 text-sm text-gray-500",children:"Create a new product by filling out the form below."})]}),(0,s.jsx)("div",{className:"bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2",children:(0,s.jsx)("div",{className:"px-4 py-6 sm:p-8",children:(0,s.jsx)(o.A,{onSubmit:c})})})]})}},25205:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>s});let s=(0,r(46760).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/chris-laptop/coding/bounce-v3/src/app/admin/products/new/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/chris-laptop/coding/bounce-v3/src/app/admin/products/new/page.tsx","default")}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[638,434,77,668,144,140],()=>r(68034));module.exports=s})();