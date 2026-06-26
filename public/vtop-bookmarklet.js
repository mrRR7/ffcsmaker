"use strict";(()=>{var O=/^L\d+(\+L\d+)*$/;function N(){let o=window.location.hostname;return o.includes("vitap")?"ap":o.includes("vitbhopal")?"bhopal":o.startsWith("vtopcc")?"chennai":o.includes("vit.ac.in")?"vellore":"unknown"}function v(){return/vtop.*vit\.ac\.in|vtop.*vitap\.ac\.in|vtop.*vitbhopal\.ac\.in/.test(window.location.hostname)}function k(){if(!v())return!1;let o=window.location.pathname.toLowerCase();return o.includes("course")||o.includes("registration")||o.includes("allocation")?!0:document.querySelector("table")!==null}function _(o){let t=o.replace(/\s+/g,"").toUpperCase();return t?O.test(t)?"lab":t==="NIL"||/^[A-G]\d(\+T[A-G]{1,2}\d)*$/.test(t)||/^T[A-G]{1,2}\d$/.test(t)?"theory":"unknown":"unknown"}function T(o){let t=o.split("+")[0],s=/(\d)$/.exec(t);return s?s[1]==="1"?"Morning":"Afternoon":null}function y(o){if(o.toUpperCase()==="NIL")return 0;let t=0;for(let s of o.split("+")){let e=s.trim();/^[A-Za-z]\d$/.test(e)?t+=2:/^T/.test(e)&&(t+=1)}return t}function P(o){let t=/L(\d+)/.exec(o.split("+")[0]);return t?Number(t[1])>=31?"Morning":"Afternoon":null}function x(o){let t=o.split("+").filter(Boolean);return Math.floor(t.length/2)}function U(o,t,s){let e=[],r=(n,a,c)=>({professorName:o,theorySlots:n?n.split("+"):[],labSlots:a?[a]:[],credits:c,program:null,notes:""});if(t.length===0&&s.length===0)return e;if(t.length>0&&s.length>0)for(let n of t){if(n.toUpperCase()==="NIL"){e.push(r(n,null,y(n)));continue}let a=T(n),c=s.filter(i=>P(i)===a);if(c.length>0)for(let i of c)e.push(r(n,i,y(n)+x(i)));else e.push(r(n,null,y(n)))}else if(t.length>0)for(let n of t)e.push(r(n,null,y(n)));else for(let n of s)e.push(r(null,n,x(n)));return e}function L(o){let t=new Map;for(let e of o){if(!e.courseCode||e.slotKind==="unknown")continue;t.has(e.courseCode)||t.set(e.courseCode,{name:e.courseName||e.courseCode,profs:new Map});let r=t.get(e.courseCode);e.courseName&&(!r.name||r.name===e.courseCode)&&(r.name=e.courseName),r.profs.has(e.professorName)||r.profs.set(e.professorName,{theory:[],lab:[]});let n=r.profs.get(e.professorName),a=e.slot.replace(/\s+/g,"").toUpperCase();e.slotKind==="theory"&&!n.theory.includes(a)&&n.theory.push(a),e.slotKind==="lab"&&!n.lab.includes(a)&&n.lab.push(a)}let s=[];for(let[e,r]of t){let n=[];for(let[p,u]of r.profs)n.push(...U(p,u.theory,u.lab));if(n.length===0)continue;let a=new Map;for(let p of n)a.set(p.credits,(a.get(p.credits)??0)+1);let c=0,i=-1;for(let[p,u]of a)u>i&&(i=u,c=p);s.push({courseCode:e,courseName:r.name,credits:c,options:n})}return s}function M(){let o=[],t=new Map,s="";for(let e of document.querySelectorAll("select")){let r=e.querySelectorAll("option");if(!(r.length<2))for(let n of r){let c=(n.textContent?.trim()??"").match(/([A-Z]{2,6}\d{3,6}[A-Z]?)\s*[-–—]\s*(.+)/);c&&(t.set(c[1].toUpperCase(),c[2].trim()),n.selected&&(s=c[1].toUpperCase()))}}for(let e of document.querySelectorAll("table")){let r=e.querySelectorAll("tr");if(r.length<2)continue;let n=Array.from(r[0].querySelectorAll("th, td")).map(l=>l.textContent?.trim().toLowerCase()??""),a=l=>n.findIndex(d=>l.test(d)),c=a(/^slot/),i=a(/^faculty|^professor/),p=a(/course\s*code|^code$/),u=a(/course\s*name|^name$/),h=n.findIndex(l=>/code.*name|code.*course/.test(l));if(!(c===-1||i===-1))for(let l=1;l<r.length;l++){let d=r[l].querySelectorAll("td, th");if(d.length<2)continue;let m=b=>b>=0&&b<d.length?d[b]?.textContent?.trim()??"":"",f="";if(p>=0&&(f=m(p).match(/([A-Z]{2,6}\d{3,6}[A-Z]?)/)?.[1]?.toUpperCase()??""),!f&&h>=0&&(f=m(h).match(/([A-Z]{2,6}\d{3,6}[A-Z]?)/)?.[1]?.toUpperCase()??""),f||(f=s),!f)continue;let g=u>=0?m(u):"";!g&&h>=0&&(g=m(h).match(/[A-Z]{2,6}\d{3,6}[A-Z]?\s*[-–—]\s*(.+)/)?.[1]?.trim()??""),g||(g=t.get(f)??f);let C=m(i).replace(/\s+/g," ").trim(),w=m(c).replace(/\s+/g,"").toUpperCase();!C||!w||o.push({courseCode:f,courseName:g,professorName:C,slot:w,slotKind:_(w)})}}return o}function I(o,t){let s=[...o,...t],e=L(s),r=new Map;for(let n of e)for(let a of n.options)r.set(a.professorName.toLowerCase(),{name:a.professorName});return{campus:N(),semesterLabel:"",courses:e,slots:[],faculty:Array.from(r.values()),capturedAt:new Date().toISOString(),source:t.length>0&&o.length>0?"mixed":t.length>0?"network":"dom"}}function S(){let o=M();return I(o,[])}var R="vtopImport",V="https://ffcsmaker.vercel.app/planner";function B(){try{let t=new URLSearchParams(window.location.search).get("ffcsPlannerUrl");if(t)return t.replace(/\/planner\/?$/,"")}catch{}return V.replace(/\/planner\/?$/,"")}function E(o){return o.courses.reduce((t,s)=>t+s.options.length,0)}function A(){document.getElementById("ffcs-vtop-success")?.remove()}function $(o,t,s){A();let e=E(o),r=document.createElement("div");r.id="ffcs-vtop-success",r.innerHTML=`
    <style>
      #ffcs-vtop-success {
        all: initial;
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(15, 23, 42, 0.72) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }
      #ffcs-vtop-success * { box-sizing: border-box !important; }
      #ffcs-vtop-success .ffcs-card {
        width: min(420px, calc(100vw - 32px)) !important;
        border-radius: 16px !important;
        background: #0f172a !important;
        border: 1px solid #334155 !important;
        color: #f8fafc !important;
        padding: 24px !important;
        box-shadow: 0 24px 60px rgba(0,0,0,0.45) !important;
      }
      #ffcs-vtop-success .ffcs-title {
        font-size: 18px !important;
        font-weight: 700 !important;
        margin: 0 0 8px !important;
      }
      #ffcs-vtop-success .ffcs-subtitle {
        font-size: 13px !important;
        color: #94a3b8 !important;
        margin: 0 0 20px !important;
        line-height: 1.5 !important;
      }
      #ffcs-vtop-success .ffcs-stat {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        font-size: 14px !important;
        margin: 0 0 10px !important;
      }
      #ffcs-vtop-success .ffcs-check {
        color: #22c55e !important;
        font-weight: 700 !important;
      }
      #ffcs-vtop-success .ffcs-actions {
        display: flex !important;
        gap: 10px !important;
        margin-top: 22px !important;
      }
      #ffcs-vtop-success .ffcs-btn-primary {
        flex: 1 !important;
        border: none !important;
        border-radius: 10px !important;
        background: #16a34a !important;
        color: white !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        padding: 12px 16px !important;
        cursor: pointer !important;
      }
      #ffcs-vtop-success .ffcs-btn-primary:hover { background: #15803d !important; }
      #ffcs-vtop-success .ffcs-btn-secondary {
        border: 1px solid #475569 !important;
        border-radius: 10px !important;
        background: transparent !important;
        color: #cbd5e1 !important;
        font-size: 14px !important;
        padding: 12px 14px !important;
        cursor: pointer !important;
      }
    </style>
    <div class="ffcs-card" role="dialog" aria-modal="true">
      <h2 class="ffcs-title">VTOP data ready</h2>
      <p class="ffcs-subtitle">Your registration data was scraped successfully. Open Ultimate FFCS when you're ready to import.</p>
      <div class="ffcs-stat"><span class="ffcs-check">\u2713</span><span>Scraped ${o.courses.length} courses</span></div>
      <div class="ffcs-stat"><span class="ffcs-check">\u2713</span><span>${e.toLocaleString()} faculty options</span></div>
      <div class="ffcs-actions">
        <button type="button" class="ffcs-btn-primary" id="ffcs-open-planner">Open Ultimate FFCS</button>
        <button type="button" class="ffcs-btn-secondary" id="ffcs-close-success">Close</button>
      </div>
    </div>
  `,document.body.appendChild(r);let n=new URL("/planner",s);n.searchParams.set(R,t),r.querySelector("#ffcs-open-planner")?.addEventListener("click",()=>{window.location.href=n.toString()}),r.querySelector("#ffcs-close-success")?.addEventListener("click",()=>{A(),window.__ffcsVtopBookmarklet=!1})}async function j(o,t){let s=new URL("/api/vtop-import",t).toString(),e=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)});if(!e.ok){let n=await e.json().catch(()=>null);throw new Error(n?.error??"Failed to upload scraped data.")}let r=await e.json();if(!r.token)throw new Error("Import token missing from server response.");return r.token}async function q(){if(!window.__ffcsVtopBookmarklet){if(window.__ffcsVtopBookmarklet=!0,!v()){alert("This bookmark only works on the VTOP Course Registration page."),window.__ffcsVtopBookmarklet=!1;return}if(!k()){alert(`This bookmark only works on the VTOP Course Registration page.

Navigate to Course Registration, then try again.`),window.__ffcsVtopBookmarklet=!1;return}try{let o=S();if(o.courses.length===0){alert(`No registration data found.
Refresh the page after your courses have loaded.`),window.__ffcsVtopBookmarklet=!1;return}let t=B(),s=await j(o,t);$(o,s,t)}catch{alert("Unable to import scraped data."),window.__ffcsVtopBookmarklet=!1}}}typeof window<"u"&&q();})();
