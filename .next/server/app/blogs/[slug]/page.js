(()=>{var e={};e.id=744,e.ids=[744],e.modules={10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},33873:e=>{"use strict";e.exports=require("path")},79551:e=>{"use strict";e.exports=require("url")},29070:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>u,pages:()=>c,routeModule:()=>p,tree:()=>d});var i=s(70260),r=s(28203),a=s(25155),n=s.n(a),o=s(67292),l={};for(let e in o)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>o[e]);s.d(t,l);let d=["",{children:["blogs",{children:["[slug]",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,4103)),"/home/chris-laptop/coding/bounce-v3/src/app/blogs/[slug]/page.tsx"]}]},{error:[()=>Promise.resolve().then(s.bind(s,36010)),"/home/chris-laptop/coding/bounce-v3/src/app/blogs/[slug]/error.tsx"],loading:[()=>Promise.resolve().then(s.bind(s,1684)),"/home/chris-laptop/coding/bounce-v3/src/app/blogs/[slug]/loading.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,60396)),"/home/chris-laptop/coding/bounce-v3/src/app/blogs/layout.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(s.bind(s,98786)),"/home/chris-laptop/coding/bounce-v3/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,19937,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(s.t.bind(s,69116,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(s.t.bind(s,41485,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["/home/chris-laptop/coding/bounce-v3/src/app/blogs/[slug]/page.tsx"],u={require:s,loadChunk:()=>Promise.resolve()},p=new i.AppPageRouteModule({definition:{kind:r.RouteKind.APP_PAGE,page:"/blogs/[slug]/page",pathname:"/blogs/[slug]",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},90724:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,71066,23))},4228:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,41902,23))},99462:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,16638,23))},17614:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,37882,23))},36082:(e,t,s)=>{Promise.resolve().then(s.bind(s,36010))},41818:(e,t,s)=>{Promise.resolve().then(s.bind(s,9638))},96487:()=>{},78335:()=>{},9638:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>r});var i=s(45512);function r({error:e,reset:t}){return(0,i.jsxs)("div",{className:"min-h-screen flex flex-col justify-center items-center",children:[(0,i.jsx)("p",{className:"text-red-500 font-semibold text-lg mb-4",children:e.message||"Something went wrong!"}),(0,i.jsx)("button",{onClick:t,className:"px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors",children:"Try again"})]})}},71066:(e,t,s)=>{let{createProxy:i}=s(73439);e.exports=i("/home/chris-laptop/coding/bounce-v3/node_modules/next/dist/client/image-component.js")},42326:(e,t,s)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"getImgProps",{enumerable:!0,get:function(){return o}}),s(75843);let i=s(96749),r=s(62833);function a(e){return void 0!==e.default}function n(e){return void 0===e?e:"number"==typeof e?Number.isFinite(e)?e:NaN:"string"==typeof e&&/^[0-9]+$/.test(e)?parseInt(e,10):NaN}function o(e,t){var s;let o,l,d,{src:c,sizes:u,unoptimized:p=!1,priority:m=!1,loading:g,className:h,quality:f,width:b,height:v,fill:x=!1,style:y,overrideSrc:w,onLoad:j,onLoadingComplete:N,placeholder:P="empty",blurDataURL:S,fetchPriority:_,decoding:C="async",layout:E,objectFit:O,objectPosition:A,lazyBoundary:R,lazyRoot:T,...k}=e,{imgConf:z,showAltText:B,blurComplete:M,defaultLoader:I}=t,D=z||r.imageConfigDefault;if("allSizes"in D)o=D;else{let e=[...D.deviceSizes,...D.imageSizes].sort((e,t)=>e-t),t=D.deviceSizes.sort((e,t)=>e-t);o={...D,allSizes:e,deviceSizes:t}}if(void 0===I)throw Error("images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config");let G=k.loader||I;delete k.loader,delete k.srcSet;let q="__next_img_default"in G;if(q){if("custom"===o.loader)throw Error('Image with src "'+c+'" is missing "loader" prop.\nRead more: https://nextjs.org/docs/messages/next-image-missing-loader')}else{let e=G;G=t=>{let{config:s,...i}=t;return e(i)}}if(E){"fill"===E&&(x=!0);let e={intrinsic:{maxWidth:"100%",height:"auto"},responsive:{width:"100%",height:"auto"}}[E];e&&(y={...y,...e});let t={responsive:"100vw",fill:"100vw"}[E];t&&!u&&(u=t)}let F="",L=n(b),$=n(v);if((s=c)&&"object"==typeof s&&(a(s)||void 0!==s.src)){let e=a(c)?c.default:c;if(!e.src)throw Error("An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received "+JSON.stringify(e));if(!e.height||!e.width)throw Error("An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received "+JSON.stringify(e));if(l=e.blurWidth,d=e.blurHeight,S=S||e.blurDataURL,F=e.src,!x){if(L||$){if(L&&!$){let t=L/e.width;$=Math.round(e.height*t)}else if(!L&&$){let t=$/e.height;L=Math.round(e.width*t)}}else L=e.width,$=e.height}}let U=!m&&("lazy"===g||void 0===g);(!(c="string"==typeof c?c:F)||c.startsWith("data:")||c.startsWith("blob:"))&&(p=!0,U=!1),o.unoptimized&&(p=!0),q&&!o.dangerouslyAllowSVG&&c.split("?",1)[0].endsWith(".svg")&&(p=!0);let X=n(f),H=Object.assign(x?{position:"absolute",height:"100%",width:"100%",left:0,top:0,right:0,bottom:0,objectFit:O,objectPosition:A}:{},B?{}:{color:"transparent"},y),J=M||"empty"===P?null:"blur"===P?'url("data:image/svg+xml;charset=utf-8,'+(0,i.getImageBlurSvg)({widthInt:L,heightInt:$,blurWidth:l,blurHeight:d,blurDataURL:S||"",objectFit:H.objectFit})+'")':'url("'+P+'")',W=J?{backgroundSize:H.objectFit||"cover",backgroundPosition:H.objectPosition||"50% 50%",backgroundRepeat:"no-repeat",backgroundImage:J}:{},V=function(e){let{config:t,src:s,unoptimized:i,width:r,quality:a,sizes:n,loader:o}=e;if(i)return{src:s,srcSet:void 0,sizes:void 0};let{widths:l,kind:d}=function(e,t,s){let{deviceSizes:i,allSizes:r}=e;if(s){let e=/(^|\s)(1?\d?\d)vw/g,t=[];for(let i;i=e.exec(s);i)t.push(parseInt(i[2]));if(t.length){let e=.01*Math.min(...t);return{widths:r.filter(t=>t>=i[0]*e),kind:"w"}}return{widths:r,kind:"w"}}return"number"!=typeof t?{widths:i,kind:"w"}:{widths:[...new Set([t,2*t].map(e=>r.find(t=>t>=e)||r[r.length-1]))],kind:"x"}}(t,r,n),c=l.length-1;return{sizes:n||"w"!==d?n:"100vw",srcSet:l.map((e,i)=>o({config:t,src:s,quality:a,width:e})+" "+("w"===d?e:i+1)+d).join(", "),src:o({config:t,src:s,quality:a,width:l[c]})}}({config:o,src:c,unoptimized:p,width:L,quality:X,sizes:u,loader:G});return{props:{...k,loading:U?"lazy":g,fetchPriority:_,width:L,height:$,decoding:C,className:h,style:{...H,...W},sizes:V.sizes,srcSet:V.srcSet,src:w||V.src},meta:{unoptimized:p,priority:m,placeholder:P,fill:x}}}},96749:(e,t)=>{"use strict";function s(e){let{widthInt:t,heightInt:s,blurWidth:i,blurHeight:r,blurDataURL:a,objectFit:n}=e,o=i?40*i:t,l=r?40*r:s,d=o&&l?"viewBox='0 0 "+o+" "+l+"'":"";return"%3Csvg xmlns='http://www.w3.org/2000/svg' "+d+"%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='"+(d?"none":"contain"===n?"xMidYMid":"cover"===n?"xMidYMid slice":"none")+"' style='filter: url(%23b);' href='"+a+"'/%3E%3C/svg%3E"}Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"getImageBlurSvg",{enumerable:!0,get:function(){return s}})},62833:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var s in t)Object.defineProperty(e,s,{enumerable:!0,get:t[s]})}(t,{VALID_LOADERS:function(){return s},imageConfigDefault:function(){return i}});let s=["default","imgix","cloudinary","akamai","custom"],i={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[16,32,48,64,96,128,256,384],path:"/_next/image",loader:"default",loaderFile:"",domains:[],disableStaticImages:!1,minimumCacheTTL:60,formats:["image/webp"],dangerouslyAllowSVG:!1,contentSecurityPolicy:"script-src 'none'; frame-src 'none'; sandbox;",contentDispositionType:"attachment",localPatterns:void 0,remotePatterns:[],unoptimized:!1}},38516:(e,t,s)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var s in t)Object.defineProperty(e,s,{enumerable:!0,get:t[s]})}(t,{default:function(){return l},getImageProps:function(){return o}});let i=s(73264),r=s(42326),a=s(71066),n=i._(s(56352));function o(e){let{props:t}=(0,r.getImgProps)(e,{defaultLoader:n.default,imgConf:{deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[16,32,48,64,96,128,256,384],path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1}});for(let[e,s]of Object.entries(t))void 0===s&&delete t[e];return{props:t}}let l=a.Image},56352:(e,t)=>{"use strict";function s(e){let{config:t,src:s,width:i,quality:r}=e;return t.path+"?url="+encodeURIComponent(s)+"&w="+i+"&q="+(r||75)+(s.startsWith("/_next/static/media/"),"")}Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"default",{enumerable:!0,get:function(){return i}}),s.__next_img_default=!0;let i=s},75843:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"warnOnce",{enumerable:!0,get:function(){return s}});let s=e=>{}},36010:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>i});let i=(0,s(46760).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/chris-laptop/coding/bounce-v3/src/app/blogs/[slug]/error.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/chris-laptop/coding/bounce-v3/src/app/blogs/[slug]/error.tsx","default")},1684:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>r});var i=s(62740);function r(){return(0,i.jsx)("div",{className:"w-full bg-secondary-blue/5 py-12",children:(0,i.jsx)("div",{className:"container mx-auto px-4",children:(0,i.jsxs)("article",{className:"bg-white rounded-xl shadow-lg p-8 mb-12 animate-pulse",children:[(0,i.jsx)("div",{className:"w-full h-[400px] bg-gray-200 rounded-xl mb-8"}),(0,i.jsxs)("div",{className:"space-y-4 mb-8",children:[(0,i.jsxs)("div",{className:"flex gap-2",children:[(0,i.jsx)("div",{className:"h-6 w-20 bg-gray-200 rounded-full"}),(0,i.jsx)("div",{className:"h-6 w-20 bg-gray-200 rounded-full"})]}),(0,i.jsx)("div",{className:"h-10 w-3/4 bg-gray-200 rounded-lg"}),(0,i.jsxs)("div",{className:"flex justify-between",children:[(0,i.jsxs)("div",{className:"flex gap-4",children:[(0,i.jsx)("div",{className:"h-6 w-24 bg-gray-200 rounded-full"}),(0,i.jsx)("div",{className:"h-6 w-24 bg-gray-200 rounded-full"})]}),(0,i.jsxs)("div",{className:"flex gap-4",children:[(0,i.jsx)("div",{className:"h-6 w-20 bg-gray-200 rounded-full"}),(0,i.jsx)("div",{className:"h-6 w-20 bg-gray-200 rounded-full"})]})]})]}),(0,i.jsxs)("div",{className:"space-y-8",children:[(0,i.jsx)("div",{className:"space-y-4",children:[void 0,void 0,void 0].map((e,t)=>(0,i.jsx)("div",{className:"h-4 bg-gray-200 rounded w-full"},t))}),(0,i.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[void 0,void 0,void 0,void 0].map((e,t)=>(0,i.jsx)("div",{className:"h-64 bg-gray-200 rounded-lg"},t))}),(0,i.jsx)("div",{className:"space-y-4",children:[void 0,void 0,void 0,void 0,void 0].map((e,t)=>(0,i.jsx)("div",{className:"h-4 bg-gray-200 rounded w-full"},t))}),(0,i.jsx)("div",{className:"space-y-4",children:[void 0,void 0].map((e,t)=>(0,i.jsx)("div",{className:"h-4 bg-gray-200 rounded w-full"},t))}),(0,i.jsx)("div",{className:"border-t pt-6",children:(0,i.jsx)("div",{className:"flex gap-2",children:[void 0,void 0,void 0,void 0].map((e,t)=>(0,i.jsx)("div",{className:"h-6 w-16 bg-gray-200 rounded-full"},t))})})]})]})})})}},4103:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l,generateMetadata:()=>o});var i=s(62740),r=s(40212),a=s(38516),n=s.n(a);async function o({params:e}){let t=e.slug;try{let e=await fetch(`${r.J}${r.Q.PRODUCTS}/${t}`),s=await e.json();return{title:s.seo?.metaTitle||`${s.title} | Blog`,description:s.seo?.metaDescription||s.excerpt||s.introduction.substring(0,160),openGraph:{title:s.title,description:s.excerpt||s.introduction.substring(0,160),images:s.featuredImage?[s.featuredImage]:[],type:"article",publishedTime:s.publishDate,modifiedTime:s.lastModified,tags:s.tags},keywords:s.tags.join(", ")}}catch(e){return{title:"Blog Post Not Found",description:e instanceof Error?e.message:"This blog post is not available"}}}async function l({params:e}){let t=e.slug,s=await fetch(`${r.J}${r.Q.BLOGS}/${t}`);if(!s.ok)throw Error("Blog post not found");let a=await s.json();if("published"!==a.status)throw Error("This blog post is not available");return(0,i.jsx)("div",{className:"w-full bg-secondary-blue/5 py-12",children:(0,i.jsx)("div",{className:"container mx-auto px-4",children:(0,i.jsxs)("article",{className:"bg-white rounded-xl shadow-lg p-8 mb-12",children:[a.featuredImage&&(0,i.jsx)("div",{className:"mb-8 rounded-xl overflow-hidden",children:(0,i.jsx)(n(),{src:a.featuredImage,alt:a.title,width:1200,height:630,className:"w-full h-full object-cover",priority:!0})}),(0,i.jsxs)("header",{className:"mb-8",children:[(0,i.jsx)("div",{className:"flex flex-wrap gap-2 mb-4",children:a.categories.map(e=>(0,i.jsx)("span",{className:"bg-primary-purple/10 text-primary-purple px-3 py-1 rounded-full text-sm",children:e},e))}),(0,i.jsx)("h1",{className:"text-4xl font-bold text-primary-purple mb-4",children:a.title}),(0,i.jsxs)("div",{className:"flex items-center justify-between text-sm text-gray-500",children:[(0,i.jsxs)("div",{className:"flex items-center gap-4",children:[(0,i.jsx)("span",{className:"font-medium",children:a.publishDate&&new Date(a.publishDate).toLocaleDateString()}),a.readTime&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)("span",{className:"mx-2",children:"•"}),(0,i.jsxs)("span",{className:"font-medium bg-secondary-blue/10 text-primary-blue px-2 py-1 rounded-full",children:[a.readTime," min read"]})]})]}),(0,i.jsxs)("div",{className:"flex items-center gap-4",children:[(0,i.jsxs)("span",{children:[a.meta.views," views"]}),(0,i.jsxs)("span",{children:[a.meta.likes," likes"]})]})]})]}),(0,i.jsxs)("div",{className:"prose max-w-none text-gray-600 text-lg space-y-8",children:[(0,i.jsx)("div",{className:"mb-8",children:a.introduction}),a.images.length>0&&(0,i.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 my-8",children:a.images.map((e,t)=>(0,i.jsx)("div",{className:"rounded-lg overflow-hidden",children:(0,i.jsx)(n(),{src:e.url,alt:`${a.title} image ${t+1}`,width:600,height:400,className:"w-full h-full object-cover"})},e.public_id))}),(0,i.jsx)("div",{className:"mb-8",children:a.body}),(0,i.jsx)("div",{className:"mb-8",children:a.conclusion}),a.tags.length>0&&(0,i.jsx)("div",{className:"border-t pt-6 mt-8",children:(0,i.jsx)("div",{className:"flex flex-wrap gap-2",children:a.tags.map(e=>(0,i.jsxs)("span",{className:"bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm",children:["#",e]},e))})})]})]})})})}},60396:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o,metadata:()=>n});var i=s(62740),r=s(79847);let a=()=>({"@context":"https://schema.org","@type":"Blog",name:"SATX Bounce House Rentals Blog",description:"Latest news, tips, and insights about bounce house rentals and party planning in San Antonio"}),n={title:"Blog | Party Planning Tips & News | SATX Bounce House Rentals",description:"Read our latest blog posts about party planning tips, bounce house safety, event ideas, and more. Stay updated with SATX Bounce House Rentals in San Antonio.",keywords:"party planning blog, bounce house tips, event ideas, San Antonio parties, party safety tips, event planning guide",openGraph:{title:"Blog | Party Planning Tips & News | SATX Bounce House Rentals",description:"Read our latest blog posts about party planning tips, bounce house safety, event ideas, and more. Stay updated with SATX Bounce House Rentals in San Antonio.",type:"website"},other:{"geo.region":"US-TX","geo.placename":"San Antonio","geo.position":"29.4241;-98.4936",ICBM:"29.4241, -98.4936"}};function o({children:e}){return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(r.default,{id:"blog-schema",type:"application/ld+json",children:JSON.stringify(a())}),e]})}},40212:(e,t,s)=>{"use strict";s.d(t,{J:()=>i,Q:()=>r});let i="http://localhost:8080",r={PRODUCTS:"/api/v1/products",BLOGS:"/api/v1/blogs",USERS:"/api/v1/users",CONTACTS:"/api/v1/contacts"}},70440:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>r});var i=s(88077);let r=async e=>[{type:"image/x-icon",sizes:"16x16",url:(0,i.fillMetadataSegment)(".",await e.params,"favicon.ico")+""}]}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),i=t.X(0,[638,434,77,902,144],()=>s(29070));module.exports=i})();