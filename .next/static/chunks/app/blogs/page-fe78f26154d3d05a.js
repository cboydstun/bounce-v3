(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[156],{2249:(e,s,t)=>{Promise.resolve().then(t.bind(t,8691))},5565:(e,s,t)=>{"use strict";t.d(s,{default:()=>r.a});var a=t(4146),r=t.n(a)},4146:(e,s,t)=>{"use strict";Object.defineProperty(s,"__esModule",{value:!0}),function(e,s){for(var t in s)Object.defineProperty(e,t,{enumerable:!0,get:s[t]})}(s,{default:function(){return c},getImageProps:function(){return n}});let a=t(306),r=t(666),l=t(7970),i=a._(t(5514));function n(e){let{props:s}=(0,r.getImgProps)(e,{defaultLoader:i.default,imgConf:{deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[16,32,48,64,96,128,256,384],path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1}});for(let[e,t]of Object.entries(s))void 0===t&&delete s[e];return{props:s}}let c=l.Image},8691:(e,s,t)=>{"use strict";t.r(s),t.d(s,{default:()=>o});var a=t(5155),r=t(2115),l=t(8173),i=t.n(l),n=t(5565),c=t(3406),d=t(9395);function o(){let[e,s]=(0,r.useState)([]),[t,l]=(0,r.useState)(!0),[o,m]=(0,r.useState)(null);return((0,r.useEffect)(()=>{(async()=>{try{let e=await fetch("".concat(c.J).concat(c.Q.BLOGS));if(!e.ok)throw Error("Failed to fetch blogs");let t=await e.json();s(t)}catch(e){m(e instanceof Error?e.message:"An error occurred")}finally{l(!1)}})()},[]),t)?(0,a.jsx)("div",{className:"min-h-[400px] flex justify-center items-center",children:(0,a.jsx)(d.k,{})}):o?(0,a.jsx)("div",{className:"min-h-[400px] flex justify-center items-center",children:(0,a.jsx)("p",{className:"text-red-500 font-semibold text-lg",children:o})}):(0,a.jsx)("div",{className:"w-full bg-secondary-blue/5 py-12",children:(0,a.jsxs)("div",{className:"container mx-auto px-4",children:[(0,a.jsxs)("div",{className:"text-center mb-12",children:[(0,a.jsxs)("h1",{className:"text-4xl font-bold mb-4 text-white",children:["Our"," ",(0,a.jsx)("span",{className:"bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text",children:"Blog Posts"})]}),(0,a.jsx)("p",{className:"text-white text-lg",children:"Stay updated with our latest news and insights"})]}),(0,a.jsx)("div",{className:"grid md:grid-cols-2 lg:grid-cols-3 gap-8",children:e.map(e=>(0,a.jsxs)(i(),{href:"/blogs/".concat(e.slug),className:"bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-secondary-blue/20",children:[e.featuredImage&&(0,a.jsx)("div",{className:"aspect-video overflow-hidden",children:(0,a.jsx)(n.default,{src:e.featuredImage,alt:e.title,className:"w-full h-full object-cover transition-transform duration-300 hover:scale-110"})}),(0,a.jsxs)("div",{className:"p-6",children:[(0,a.jsx)("h2",{className:"text-xl font-bold text-primary-blue mb-3 line-clamp-2",children:e.title}),(0,a.jsx)("p",{className:"text-gray-600 mb-4 line-clamp-3",children:e.excerpt}),(0,a.jsxs)("div",{className:"space-y-4",children:[e.categories&&e.categories.length>0&&(0,a.jsx)("div",{className:"flex flex-wrap gap-2",children:e.categories.map((e,s)=>(0,a.jsx)("span",{className:"text-xs bg-secondary-blue/5 text-primary-blue px-2 py-1 rounded-full",children:e},s))}),(0,a.jsxs)("div",{className:"flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4",children:[(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,a.jsx)("span",{className:"font-medium",children:e.publishDate?new Date(e.publishDate).toLocaleDateString():"Unknown date"}),e.readTime&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("span",{children:"•"}),(0,a.jsxs)("span",{className:"font-medium bg-secondary-blue/10 text-primary-blue px-2 py-1 rounded-full",children:[e.readTime," min read"]})]})]}),e.meta&&(0,a.jsxs)("div",{className:"flex items-center space-x-3 text-xs",children:[(0,a.jsxs)("span",{title:"Views",children:[e.meta.views," views"]}),(0,a.jsxs)("span",{title:"Likes",children:[e.meta.likes," likes"]})]})]})]})]})]},e._id))})]})})}},9395:(e,s,t)=>{"use strict";t.d(s,{k:()=>r});var a=t(5155);function r(e){let{className:s="w-4 h-4"}=e;return(0,a.jsxs)("svg",{className:"animate-spin ".concat(s),xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,a.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,a.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]})}},3406:(e,s,t)=>{"use strict";t.d(s,{J:()=>a,Q:()=>r});let a="http://localhost:8080",r={PRODUCTS:"/api/v1/products",BLOGS:"/api/v1/blogs",USERS:"/api/v1/users",CONTACTS:"/api/v1/contacts"}}},e=>{var s=s=>e(e.s=s);e.O(0,[173,970,441,517,358],()=>s(2249)),_N_E=e.O()}]);