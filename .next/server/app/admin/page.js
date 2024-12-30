(()=>{var e={};e.id=698,e.ids=[698],e.modules={10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},12412:e=>{"use strict";e.exports=require("assert")},94735:e=>{"use strict";e.exports=require("events")},29021:e=>{"use strict";e.exports=require("fs")},81630:e=>{"use strict";e.exports=require("http")},55591:e=>{"use strict";e.exports=require("https")},21820:e=>{"use strict";e.exports=require("os")},33873:e=>{"use strict";e.exports=require("path")},27910:e=>{"use strict";e.exports=require("stream")},83997:e=>{"use strict";e.exports=require("tty")},79551:e=>{"use strict";e.exports=require("url")},28354:e=>{"use strict";e.exports=require("util")},74075:e=>{"use strict";e.exports=require("zlib")},18864:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>i.a,__next_app__:()=>m,pages:()=>c,routeModule:()=>x,tree:()=>l});var r=s(70260),a=s(28203),n=s(25155),i=s.n(n),o=s(67292),d={};for(let e in o)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>o[e]);s.d(t,d);let l=["",{children:["admin",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,17949)),"/home/chris-laptop/coding/bounce-v3/src/app/admin/page.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,96038)),"/home/chris-laptop/coding/bounce-v3/src/app/admin/layout.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(s.bind(s,98786)),"/home/chris-laptop/coding/bounce-v3/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,19937,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(s.t.bind(s,69116,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(s.t.bind(s,41485,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["/home/chris-laptop/coding/bounce-v3/src/app/admin/page.tsx"],m={require:s,loadChunk:()=>Promise.resolve()},x=new r.AppPageRouteModule({definition:{kind:a.RouteKind.APP_PAGE,page:"/admin/page",pathname:"/admin",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},33830:(e,t,s)=>{Promise.resolve().then(s.bind(s,96038))},3566:(e,t,s)=>{Promise.resolve().then(s.bind(s,56362))},86309:(e,t,s)=>{Promise.resolve().then(s.bind(s,17949))},99461:(e,t,s)=>{Promise.resolve().then(s.bind(s,96185))},56362:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o});var r=s(45512),a=s(79334),n=s(28531),i=s.n(n);function o({children:e}){let t=(0,a.useRouter)();return(0,r.jsxs)("div",{className:"min-h-screen bg-gray-100",children:[(0,r.jsx)("nav",{className:"bg-white shadow-sm",children:(0,r.jsx)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:(0,r.jsxs)("div",{className:"flex justify-between h-16",children:[(0,r.jsxs)("div",{className:"flex",children:[(0,r.jsx)("div",{className:"flex-shrink-0 flex items-center",children:(0,r.jsx)("h1",{className:"text-xl font-bold",children:"Admin Dashboard"})}),(0,r.jsxs)("div",{className:"hidden sm:ml-6 sm:flex sm:space-x-8",children:[(0,r.jsx)(i(),{href:"/admin",className:"border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",children:"Overview"}),(0,r.jsx)(i(),{href:"/admin/blogs",className:"border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",children:"Blogs"}),(0,r.jsx)(i(),{href:"/admin/products",className:"border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",children:"Products"}),(0,r.jsx)(i(),{href:"/admin/contacts",className:"border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",children:"Contacts"})]})]}),(0,r.jsx)("div",{className:"flex items-center",children:(0,r.jsx)("button",{onClick:()=>t.push("/"),className:"text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium",children:"Exit Admin"})})]})})}),(0,r.jsx)("main",{className:"max-w-7xl mx-auto py-6 sm:px-6 lg:px-8",children:e})]})}},96185:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o});var r=s(45512),a=s(28531),n=s.n(a),i=s(58009);function o(){let[e,t]=(0,i.useState)([{name:"Total Blogs",stat:"...",href:"/admin/blogs"},{name:"Total Products",stat:"...",href:"/admin/products"},{name:"Contact Requests",stat:"...",href:"/admin/contacts"}]);return(0,r.jsxs)("div",{children:[(0,r.jsx)("h2",{className:"text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight mb-8",children:"Dashboard Overview"}),(0,r.jsx)("div",{className:"grid grid-cols-1 gap-5 sm:grid-cols-3",children:e.map(e=>(0,r.jsxs)(n(),{href:e.href,className:"relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 hover:shadow-lg transition-shadow",children:[(0,r.jsx)("dt",{className:"truncate text-sm font-medium text-gray-500",children:e.name}),(0,r.jsx)("dd",{className:"mt-1 text-3xl font-semibold tracking-tight text-gray-900",children:e.stat})]},e.name))}),(0,r.jsxs)("div",{className:"mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3",children:[(0,r.jsxs)("div",{className:"rounded-lg bg-white shadow p-6",children:[(0,r.jsx)("h3",{className:"text-lg font-medium leading-6 text-gray-900 mb-4",children:"Quick Actions"}),(0,r.jsxs)("div",{className:"space-y-3",children:[(0,r.jsx)(n(),{href:"/admin/blogs/new",className:"inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center",children:"Create New Blog"}),(0,r.jsx)(n(),{href:"/admin/products/new",className:"inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center",children:"Add New Product"})]})]}),(0,r.jsxs)("div",{className:"rounded-lg bg-white shadow p-6",children:[(0,r.jsx)("h3",{className:"text-lg font-medium leading-6 text-gray-900 mb-4",children:"Recent Activity"}),(0,r.jsxs)("div",{className:"space-y-3",children:[(0,r.jsxs)("div",{className:"text-sm text-gray-600",children:[(0,r.jsx)("p",{children:"New contact request received"}),(0,r.jsx)("p",{className:"text-xs text-gray-400",children:"2 hours ago"})]}),(0,r.jsxs)("div",{className:"text-sm text-gray-600",children:[(0,r.jsx)("p",{children:'Product "Bounce House XL" updated'}),(0,r.jsx)("p",{className:"text-xs text-gray-400",children:"5 hours ago"})]}),(0,r.jsxs)("div",{className:"text-sm text-gray-600",children:[(0,r.jsx)("p",{children:"New blog post published"}),(0,r.jsx)("p",{className:"text-xs text-gray-400",children:"1 day ago"})]})]})]}),(0,r.jsxs)("div",{className:"rounded-lg bg-white shadow p-6",children:[(0,r.jsx)("h3",{className:"text-lg font-medium leading-6 text-gray-900 mb-4",children:"System Status"}),(0,r.jsxs)("div",{className:"space-y-3",children:[(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[(0,r.jsx)("span",{className:"text-sm text-gray-600",children:"API Status"}),(0,r.jsx)("span",{className:"inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800",children:"Operational"})]}),(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[(0,r.jsx)("span",{className:"text-sm text-gray-600",children:"Database"}),(0,r.jsx)("span",{className:"inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800",children:"Connected"})]}),(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[(0,r.jsx)("span",{className:"text-sm text-gray-600",children:"Storage"}),(0,r.jsx)("span",{className:"inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800",children:"85% Free"})]})]})]})]})]})}s(45956),s(50688)},50688:(e,t,s)=>{"use strict";s.d(t,{J:()=>r,Q:()=>a});let r="http://localhost:8080",a={PRODUCTS:"/api/v1/products",BLOGS:"/api/v1/blogs",USERS:"/api/v1/users",CONTACTS:"/api/v1/contacts"}},45956:(e,t,s)=>{"use strict";s.d(t,{Ay:()=>d,iD:()=>i});var r=s(85668),a=s(50688);let n=r.A.create({baseURL:a.J,headers:{"Content-Type":"application/json"}}),i=async e=>{let t=await n.post("/api/v1/users/login",e);return o(t.data.token),t.data};n.interceptors.request.use(e=>e,e=>Promise.reject(e)),n.interceptors.response.use(e=>e,e=>Promise.reject(Error(e.response?.data?.message||"An unexpected error occurred")));let o=e=>{},d=n},96038:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>r});let r=(0,s(46760).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/chris-laptop/coding/bounce-v3/src/app/admin/layout.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/chris-laptop/coding/bounce-v3/src/app/admin/layout.tsx","default")},17949:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>r});let r=(0,s(46760).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/chris-laptop/coding/bounce-v3/src/app/admin/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/chris-laptop/coding/bounce-v3/src/app/admin/page.tsx","default")},70440:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>a});var r=s(88077);let a=async e=>[{type:"image/x-icon",sizes:"16x16",url:(0,r.fillMetadataSegment)(".",await e.params,"favicon.ico")+""}]}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[638,434,77,668,144],()=>s(18864));module.exports=r})();