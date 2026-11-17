import{r as u,j as r,ac as m}from"./index-BVlq-9Oj.js";const p=t=>`${location.origin}${location.pathname}#${t}`;function d({text:t,path:n,label:i="Share my result",className:c="btn primary"}){const[s,o]=u.useState(""),l=async()=>{const e=`${t}

Play it yourself:
${p(n)}`;try{if(navigator.share){await navigator.share({text:e});return}}catch(a){if((a==null?void 0:a.name)==="AbortError")return}o(await m(e)?"Copied: paste it to a friend":"Could not copy"),window.setTimeout(()=>o(""),2500)};return r.jsxs("span",{className:"share-wrap",children:[r.jsx("button",{className:c,onClick:()=>void l(),children:i}),s&&r.jsxs("span",{className:"muted small",role:"status",children:[" ",s]})]})}export{d as S};
