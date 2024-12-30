(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[698],{5219:(e,t,s)=>{Promise.resolve().then(s.bind(s,7929))},7929:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>c});var a=s(5155),n=s(8173),r=s.n(n),i=s(2115),l=s(8056),d=s(3406);function c(){let[e,t]=(0,i.useState)([{name:"Total Blogs",stat:"...",href:"/admin/blogs"},{name:"Total Products",stat:"...",href:"/admin/products"},{name:"Contact Requests",stat:"...",href:"/admin/contacts"}]);return(0,i.useEffect)(()=>{(async()=>{try{let[e,s,a]=await Promise.all([l.Ay.get("".concat(d.J).concat(d.Q.BLOGS)),l.Ay.get("".concat(d.J).concat(d.Q.PRODUCTS)),l.Ay.get("".concat(d.J).concat(d.Q.CONTACTS))]);t([{name:"Total Blogs",stat:String(e.data.length),href:"/admin/blogs"},{name:"Total Products",stat:String(s.data.length),href:"/admin/products"},{name:"Contact Requests",stat:String(a.data.length),href:"/admin/contacts"}])}catch(e){console.error("Failed to fetch stats:",e)}})()},[]),(0,a.jsxs)("div",{children:[(0,a.jsx)("h2",{className:"text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight mb-8",children:"Dashboard Overview"}),(0,a.jsx)("div",{className:"grid grid-cols-1 gap-5 sm:grid-cols-3",children:e.map(e=>(0,a.jsxs)(r(),{href:e.href,className:"relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 hover:shadow-lg transition-shadow",children:[(0,a.jsx)("dt",{className:"truncate text-sm font-medium text-gray-500",children:e.name}),(0,a.jsx)("dd",{className:"mt-1 text-3xl font-semibold tracking-tight text-gray-900",children:e.stat})]},e.name))}),(0,a.jsxs)("div",{className:"mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3",children:[(0,a.jsxs)("div",{className:"rounded-lg bg-white shadow p-6",children:[(0,a.jsx)("h3",{className:"text-lg font-medium leading-6 text-gray-900 mb-4",children:"Quick Actions"}),(0,a.jsxs)("div",{className:"space-y-3",children:[(0,a.jsx)(r(),{href:"/admin/blogs/new",className:"inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center",children:"Create New Blog"}),(0,a.jsx)(r(),{href:"/admin/products/new",className:"inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center",children:"Add New Product"})]})]}),(0,a.jsxs)("div",{className:"rounded-lg bg-white shadow p-6",children:[(0,a.jsx)("h3",{className:"text-lg font-medium leading-6 text-gray-900 mb-4",children:"Recent Activity"}),(0,a.jsxs)("div",{className:"space-y-3",children:[(0,a.jsxs)("div",{className:"text-sm text-gray-600",children:[(0,a.jsx)("p",{children:"New contact request received"}),(0,a.jsx)("p",{className:"text-xs text-gray-400",children:"2 hours ago"})]}),(0,a.jsxs)("div",{className:"text-sm text-gray-600",children:[(0,a.jsx)("p",{children:'Product "Bounce House XL" updated'}),(0,a.jsx)("p",{className:"text-xs text-gray-400",children:"5 hours ago"})]}),(0,a.jsxs)("div",{className:"text-sm text-gray-600",children:[(0,a.jsx)("p",{children:"New blog post published"}),(0,a.jsx)("p",{className:"text-xs text-gray-400",children:"1 day ago"})]})]})]}),(0,a.jsxs)("div",{className:"rounded-lg bg-white shadow p-6",children:[(0,a.jsx)("h3",{className:"text-lg font-medium leading-6 text-gray-900 mb-4",children:"System Status"}),(0,a.jsxs)("div",{className:"space-y-3",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[(0,a.jsx)("span",{className:"text-sm text-gray-600",children:"API Status"}),(0,a.jsx)("span",{className:"inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800",children:"Operational"})]}),(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[(0,a.jsx)("span",{className:"text-sm text-gray-600",children:"Database"}),(0,a.jsx)("span",{className:"inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800",children:"Connected"})]}),(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[(0,a.jsx)("span",{className:"text-sm text-gray-600",children:"Storage"}),(0,a.jsx)("span",{className:"inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800",children:"85% Free"})]})]})]})]})]})}},3406:(e,t,s)=>{"use strict";s.d(t,{J:()=>a,Q:()=>n});let a="http://localhost:8080",n={PRODUCTS:"/api/v1/products",BLOGS:"/api/v1/blogs",USERS:"/api/v1/users",CONTACTS:"/api/v1/contacts"}},8056:(e,t,s)=>{"use strict";s.d(t,{Ay:()=>d,iD:()=>i});var a=s(2651),n=s(3406);let r=a.A.create({baseURL:n.J,headers:{"Content-Type":"application/json"}}),i=async e=>{let t=await r.post("/api/v1/users/login",e);return l(t.data.token),t.data};r.interceptors.request.use(e=>{{let t=localStorage.getItem("auth_token");t&&(e.headers.Authorization="Bearer ".concat(t))}return e},e=>Promise.reject(e)),r.interceptors.response.use(e=>e,e=>{var t,s;return Promise.reject(Error((null===(s=e.response)||void 0===s?void 0:null===(t=s.data)||void 0===t?void 0:t.message)||"An unexpected error occurred"))});let l=e=>{e?(localStorage.setItem("auth_token",e),r.defaults.headers.common.Authorization="Bearer ".concat(e)):(localStorage.removeItem("auth_token"),delete r.defaults.headers.common.Authorization)},d=r}},e=>{var t=t=>e(e.s=t);e.O(0,[651,173,441,517,358],()=>t(5219)),_N_E=e.O()}]);