(function(){
'use strict';
/* ================= УТИЛИТЫ ================= */
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
if(window.lucide) lucide.createIcons();

/* ============================================================
   ВСТРОЕННАЯ ГРАФИКА: полигональные пейзажи генерируются
   локально (SVG → data URI). Ноль сетевых запросов.
============================================================ */
const sceneCache=new Map();
function ihash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const b64=s=>btoa(unescape(encodeURIComponent(s)));
function mix(a,b,t){
  const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);
  const r=((pa>>16)&255)+((((pb>>16)&255)-((pa>>16)&255))*t);
  const g=((pa>>8)&255)+((((pb>>8)&255)-((pa>>8)&255))*t);
  const bl=(pa&255)+(((pb&255)-(pa&255))*t);
  return 'rgb('+Math.round(r)+','+Math.round(g)+','+Math.round(bl)+')';
}
/* ярче палитры: два дневных, ночь, закатное золото */
const PAL=[
 {sky1:'#3E6D9C',sky2:'#C96A2E',sky3:'#F2A75C',sun:'#FBE0A6',ground:'#282C31',road:'#353A40',mark:'#F4EBD7',warm:'#E8571E',sil:'#181B1E'},
 {sky1:'#4C7CA8',sky2:'#82B2CB',sky3:'#F1CB8A',sun:'#FFF3CE',ground:'#2A2F34',road:'#363B41',mark:'#F5EDDB',warm:'#E8571E',sil:'#1A1D20'},
 {sky1:'#111419',sky2:'#1C222A',sky3:'#3A2A1C',sun:'#F5A340',ground:'#0D0F12',road:'#181C20',mark:'#E4DBC6',warm:'#E8571E',sil:'#06080A'},
 {sky1:'#8A5A3B',sky2:'#D97F3F',sky3:'#F6C173',sun:'#FFF0C2',ground:'#26292E',road:'#34383E',mark:'#F4EBD7',warm:'#E8571E',sil:'#16181B'}
];
function stars(p,r,W,H,hy){
  let s='';
  for(let i=0;i<46;i++){
    s+='<circle cx="'+(r()*W).toFixed(0)+'" cy="'+(r()*hy*.85).toFixed(0)+'" r="'+(r()*1.3+.5).toFixed(1)+'" fill="#EFE9DC" opacity="'+(r()*.6+.25).toFixed(2)+'"/>';
  }
  const mx=W*.78,my=hy*.3,ms=H*.045;
  s+='<circle cx="'+mx+'" cy="'+my+'" r="'+(ms*2.4).toFixed(0)+'" fill="url(#b)" opacity=".35"/>'
  +'<rect x="'+(mx-ms/2).toFixed(0)+'" y="'+(my-ms/2).toFixed(0)+'" width="'+ms.toFixed(0)+'" height="'+ms.toFixed(0)+'" transform="rotate(45 '+mx+' '+my+')" fill="#EDE7D8" opacity=".92"/>';
  return s;
}
function mountains(p,r,W,H,hy){
  let s='';
  [[.28,.40],[.52,.60],[.8,.82]].forEach(L=>{
    const lift=H*(0.04*L[0]+0.015),amp=H*(0.06+0.17*L[0]);
    const n=3+((r()*3)|0);
    let d='M-2 '+(hy+lift).toFixed(0);
    for(let i=0;i<=n;i++){
      const x=-2+(W+4)*i/n,top=hy+lift-amp*(0.45+r()*0.8);
      d+=' L'+x.toFixed(0)+' '+top.toFixed(0)+' L'+(x+(W+4)/n/2).toFixed(0)+' '+(hy+lift).toFixed(0);
    }
    d+=' L'+(W+2)+' '+H+' L-2 '+H+' Z';
    s+='<path d="'+d+'" fill="'+mix(p.sky2,p.ground,L[1])+'"/>';
  });
  return s;
}
function rays(s,p,W,H,sx,sy){
  [[.36,.07],[-.16,.05],[.1,.06]].forEach(q=>{
    s+='<path d="M'+sx+' '+sy+' L'+(sx+W*q[0]).toFixed(0)+' '+H+' L'+(sx+W*q[0]+W*.09).toFixed(0)+' '+H+' Z" fill="'+p.sun+'" opacity="'+q[1]+'"/>';
  });
  return s;
}
function cone(x,ty,s,p){
  const w=s*0.6;
  return '<path d="M'+x+' '+ty+' L'+(x+w/2)+' '+(ty+s)+' L'+(x-w/2)+' '+(ty+s)+' Z" fill="'+p.warm+'"/>'
  +'<path d="M'+(x-s*0.055)+' '+(ty+s*0.42)+' L'+(x+s*0.055)+' '+(ty+s*0.42)+' L'+(x+s*0.115)+' '+(ty+s*0.62)+' L'+(x-s*0.115)+' '+(ty+s*0.62)+' Z" fill="'+p.mark+'"/>'
  +'<rect x="'+(x-w*0.85)+'" y="'+(ty+s-s*0.09)+'" width="'+(w*1.7)+'" height="'+(s*0.09)+'" fill="'+p.sil+'"/>';
}
function person(x,y,s,c){
  return '<circle cx="'+x+'" cy="'+(y-s*0.87)+'" r="'+(s*0.085)+'" fill="'+c+'"/>'
  +'<rect x="'+(x-s*0.1)+'" y="'+(y-s*0.77)+'" width="'+(s*0.2)+'" height="'+(s*0.35)+'" rx="'+(s*0.05)+'" fill="'+c+'"/>'
  +'<rect x="'+(x-s*0.09)+'" y="'+(y-s*0.44)+'" width="'+(s*0.07)+'" height="'+(s*0.44)+'" fill="'+c+'"/>'
  +'<rect x="'+(x+s*0.02)+'" y="'+(y-s*0.44)+'" width="'+(s*0.07)+'" height="'+(s*0.42)+'" fill="'+c+'"/>';
}
function tripod(x,y,s,c){
  return '<path d="M'+x+' '+(y-s)+' L'+(x-s*0.3)+' '+y+' L'+(x-s*0.22)+' '+y+' L'+x+' '+(y-s*0.8)+' L'+(x+s*0.22)+' '+y+' L'+(x+s*0.3)+' '+y+' Z" fill="'+c+'"/>'
  +'<rect x="'+(x-s*0.11)+'" y="'+(y-s*1.08)+'" width="'+(s*0.22)+'" height="'+(s*0.11)+'" rx="'+(s*0.02)+'" fill="'+c+'"/>';
}
function rod(x,y,h,p){
  let s='<rect x="'+(x-h*0.04)+'" y="'+(y-h)+'" width="'+(h*0.08)+'" height="'+h+'" fill="'+p.mark+'"/>';
  for(let i=0;i<6;i+=2)s+='<rect x="'+(x-h*0.04)+'" y="'+(y-h+i*h/6)+'" width="'+(h*0.08)+'" height="'+(h/6)+'" fill="#D64524"/>';
  return s;
}
function excav(x,y,s,p){
  return '<rect x="'+(x-s*0.55)+'" y="'+(y-s*0.2)+'" width="'+(s*1.15)+'" height="'+(s*0.2)+'" rx="'+(s*0.1)+'" fill="'+p.sil+'"/>'
  +'<rect x="'+(x-s*0.45)+'" y="'+(y-s*0.55)+'" width="'+(s*0.65)+'" height="'+(s*0.36)+'" rx="'+(s*0.04)+'" fill="'+p.sil+'"/>'
  +'<rect x="'+(x-s*0.38)+'" y="'+(y-s*0.5)+'" width="'+(s*0.2)+'" height="'+(s*0.17)+'" fill="'+p.sun+'" opacity=".5"/>'
  +'<path d="M'+(x-s*0.12)+' '+(y-s*0.5)+' L'+(x+s*0.34)+' '+(y-s*0.98)+' L'+(x+s*0.43)+' '+(y-s*0.93)+' L'+(x+s*0)+' '+(y-s*0.42)+' Z" fill="'+p.sil+'"/>'
  +'<path d="M'+(x+s*0.37)+' '+(y-s*0.95)+' L'+(x+s*0.64)+' '+(y-s*0.44)+' L'+(x+s*0.56)+' '+(y-s*0.4)+' L'+(x+s*0.31)+' '+(y-s*0.87)+' Z" fill="'+p.sil+'"/>'
  +'<path d="M'+(x+s*0.56)+' '+(y-s*0.46)+' l'+(s*0.17)+' '+(s*0.09)+' l'+(-s*0.05)+' '+(s*0.16)+' l'+(-s*0.15)+' '+(-s*0.07)+' Z" fill="'+p.sil+'"/>';
}
function truck(x,y,s,p){
  return '<rect x="'+(x+s*0.3)+'" y="'+(y-s*0.55)+'" width="'+(s*0.55)+'" height="'+(s*0.32)+'" rx="'+(s*0.03)+'" fill="'+p.sil+'"/>'
  +'<rect x="'+(x-s*0.02)+'" y="'+(y-s*0.5)+'" width="'+(s*0.24)+'" height="'+(s*0.24)+'" rx="'+(s*0.03)+'" fill="'+p.sil+'"/>'
  +'<rect x="'+(x+s*0.03)+'" y="'+(y-s*0.46)+'" width="'+(s*0.12)+'" height="'+(s*0.1)+'" fill="'+p.sun+'" opacity=".75"/>'
  +'<rect x="'+(x-s*0.02)+'" y="'+(y-s*0.28)+'" width="'+(s*0.86)+'" height="'+(s*0.12)+'" fill="'+p.sil+'"/>'
  +'<circle cx="'+(x+s*0.1)+'" cy="'+(y-s*0.09)+'" r="'+(s*0.09)+'" fill="'+p.sil+'"/>'
  +'<circle cx="'+(x+s*0.42)+'" cy="'+(y-s*0.09)+'" r="'+(s*0.09)+'" fill="'+p.sil+'"/>'
  +'<circle cx="'+(x+s*0.64)+'" cy="'+(y-s*0.09)+'" r="'+(s*0.09)+'" fill="'+p.sil+'"/>';
}
const M=[
 (p,r,W,H)=>{ /* 0 дорога вдаль */
  const hy=H*(0.44+r()*0.08),vx=W*(0.34+r()*0.32),sx=vx+(r()-0.5)*W*0.4;
  const bw=W*(0.75+r()*0.35),hw=W*0.012;
  let s='<rect width="'+W+'" height="'+H+'" fill="url(#a)"/>'
  +'<circle cx="'+sx.toFixed(0)+'" cy="'+(hy*0.62).toFixed(0)+'" r="'+(H*0.4).toFixed(0)+'" fill="url(#b)"/>'
  +'<circle cx="'+sx.toFixed(0)+'" cy="'+(hy*0.66).toFixed(0)+'" r="'+(H*0.05).toFixed(0)+'" fill="'+p.sun+'" opacity=".92"/>'
  +rays('',p,W,H,sx,hy*0.66)+mountains(p,r,W,H,hy)
  +'<rect y="'+hy.toFixed(0)+'" width="'+W+'" height="'+(H-hy).toFixed(0)+'" fill="'+p.ground+'"/>'
  +'<path d="M'+(vx-hw).toFixed(1)+' '+hy.toFixed(1)+' L'+(vx+hw).toFixed(1)+' '+hy.toFixed(1)+' L'+(vx+bw).toFixed(1)+' '+H+' L'+(vx-bw).toFixed(1)+' '+H+' Z" fill="'+p.road+'"/>';
  [-1,1].forEach(sd=>{
    const e1=(hw+(bw-hw)*.05)*.93,e2=(hw+(bw-hw))*0.97;
    const y1=hy+(H-hy)*.05,y2=H,t1=H*0.004,t2=H*0.011,x1=vx+sd*e1,x2=vx+sd*e2;
    s+='<path d="M'+(x1-t1).toFixed(1)+' '+y1.toFixed(1)+' L'+(x1+t1).toFixed(1)+' '+y1.toFixed(1)+' L'+(x2+t2).toFixed(1)+' '+y2+' L'+(x2-t2).toFixed(1)+' '+y2+' Z" fill="'+p.mark+'" opacity=".75"/>';
  });
  for(let i=0;i<6;i++){
    const f=Math.pow((i+0.6)/6,1.7);
    const u1=Math.max(.05,f-0.035-0.1*f),u2=f+0.035+0.1*f;
    const y1=hy+(H-hy)*u1,y2=hy+(H-hy)*u2;
    const w1=H*0.004+H*0.014*u1,w2=H*0.004+H*0.014*u2;
    s+='<path d="M'+(vx-w1).toFixed(1)+' '+y1.toFixed(1)+' L'+(vx+w1).toFixed(1)+' '+y1.toFixed(1)+' L'+(vx+w2).toFixed(1)+' '+y2.toFixed(1)+' L'+(vx-w2).toFixed(1)+' '+y2.toFixed(1)+' Z" fill="'+p.mark+'" opacity=".95"/>';
  }
  [0.3,0.55,0.9].forEach(u=>{
    const px=vx+bw*0.9*u,py=hy+(H-hy)*u,hg=H*(0.14+0.34*u),pw=Math.max(2,H*0.004*(1+u*2));
    s+='<rect x="'+px.toFixed(0)+'" y="'+(py-hg).toFixed(0)+'" width="'+pw.toFixed(1)+'" height="'+hg.toFixed(0)+'" fill="'+p.sil+'"/>'
    +'<rect x="'+(px-H*0.02*(1+u*2)).toFixed(0)+'" y="'+(py-hg).toFixed(0)+'" width="'+(H*0.028*(1+u*2)).toFixed(0)+'" height="'+Math.max(2,H*0.005).toFixed(1)+'" fill="'+p.sil+'"/>';
  });
  return s;
 },
 (p,r,W,H)=>{ /* 1 укладка */
  const hy=H*0.5,gy=H*0.78,sx=W*(0.2+r()*0.6);
  let s='<rect width="'+W+'" height="'+H+'" fill="url(#a)"/>'
  +'<circle cx="'+sx.toFixed(0)+'" cy="'+(hy*0.5).toFixed(0)+'" r="'+(H*0.32).toFixed(0)+'" fill="url(#b)"/>'
  +rays('',p,W,H,sx,hy*0.5)+mountains(p,r,W,H,hy)
  +'<rect y="'+hy+'" width="'+W+'" height="'+(gy-hy).toFixed(0)+'" fill="'+p.ground+'"/>'
  +'<rect y="'+gy+'" width="'+W+'" height="'+(H-gy).toFixed(0)+'" fill="'+p.road+'"/>';
  for(let i=0;i<4;i++)s+='<ellipse cx="'+(W*(0.25+i*0.18)).toFixed(0)+'" cy="'+(gy-H*0.02-r()*H*0.03).toFixed(0)+'" rx="'+(W*0.05).toFixed(0)+'" ry="'+(H*0.02).toFixed(0)+'" fill="#fff" opacity=".1"/>';
  const sc=W*0.3,x=W*0.36,y=gy+H*0.02;
  s+='<rect x="'+x.toFixed(0)+'" y="'+(y-sc*0.13).toFixed(0)+'" width="'+(sc*1.4).toFixed(0)+'" height="'+(sc*0.13).toFixed(0)+'" rx="'+(sc*0.04).toFixed(0)+'" fill="'+p.sil+'"/>'
  +'<rect x="'+(x+sc*0.25).toFixed(0)+'" y="'+(y-sc*0.46).toFixed(0)+'" width="'+(sc*0.85).toFixed(0)+'" height="'+(sc*0.33).toFixed(0)+'" rx="'+(sc*0.04).toFixed(0)+'" fill="'+p.sil+'"/>'
  +'<rect x="'+(x+sc*0.82).toFixed(0)+'" y="'+(y-sc*0.68).toFixed(0)+'" width="'+(sc*0.4).toFixed(0)+'" height="'+(sc*0.24).toFixed(0)+'" rx="'+(sc*0.03).toFixed(0)+'" fill="'+p.sil+'"/>'
  +'<path d="M'+x.toFixed(0)+' '+(y-sc*0.3).toFixed(0)+' l'+(-sc*0.14).toFixed(0)+' '+(sc*0.06).toFixed(0)+' v'+(sc*0.22).toFixed(0)+' l'+(sc*0.2).toFixed(0)+' 0 z" fill="'+p.sil+'"/>'
  +'<circle cx="'+(x+sc*1.02).toFixed(0)+'" cy="'+(y-sc*0.72).toFixed(0)+'" r="'+(sc*0.03).toFixed(0)+'" fill="'+p.warm+'"/>'
  +person(x-sc*0.24,y,sc*0.34,p.sil)+person(x+sc*1.62,y,sc*0.3,p.sil);
  return s;
 },
 (p,r,W,H)=>{ /* 2 каток */
  const hy=H*0.52,gy=H*0.8,sx=W*0.75;
  let s='<rect width="'+W+'" height="'+H+'" fill="url(#a)"/>'
  +'<circle cx="'+sx.toFixed(0)+'" cy="'+(hy*0.55).toFixed(0)+'" r="'+(H*0.34).toFixed(0)+'" fill="url(#b)"/>'
  +rays('',p,W,H,sx,hy*0.55)+mountains(p,r,W,H,hy)
  +'<rect y="'+hy+'" width="'+W+'" height="'+(gy-hy).toFixed(0)+'" fill="'+p.ground+'"/>'
  +'<rect y="'+gy+'" width="'+W+'" height="'+(H-gy).toFixed(0)+'" fill="'+p.road+'"/>';
  for(let i=0;i<5;i++)s+='<path d="M'+(-W*0.1+i*W*0.22).toFixed(0)+' '+H+' L'+(W*0.12+i*W*0.22).toFixed(0)+' '+gy+' L'+(W*0.2+i*W*0.22).toFixed(0)+' '+gy+' L'+(-W*0.02+i*W*0.22).toFixed(0)+' '+H+' Z" fill="'+p.mark+'" opacity=".06"/>';
  const sc=W*0.26,x=W*0.42,y=gy+H*0.015;
  s+='<circle cx="'+(x+sc*0.2).toFixed(0)+'" cy="'+(y-sc*0.24).toFixed(0)+'" r="'+(sc*0.24).toFixed(0)+'" fill="'+p.sil+'"/>'
  +'<circle cx="'+(x+sc*0.2).toFixed(0)+'" cy="'+(y-sc*0.24).toFixed(0)+'" r="'+(sc*0.075).toFixed(0)+'" fill="'+p.warm+'" opacity=".85"/>'
  +'<rect x="'+(x+sc*0.4).toFixed(0)+'" y="'+(y-sc*0.55).toFixed(0)+'" width="'+(sc*0.72).toFixed(0)+'" height="'+(sc*0.34).toFixed(0)+'" rx="'+(sc*0.05).toFixed(0)+'" fill="'+p.sil+'"/>'
  +'<rect x="'+(x+sc*0.84).toFixed(0)+'" y="'+(y-sc*0.74).toFixed(0)+'" width="'+(sc*0.26).toFixed(0)+'" height="'+(sc*0.22).toFixed(0)+'" rx="'+(sc*0.03).toFixed(0)+'" fill="'+p.sil+'"/>'
  +'<circle cx="'+(x+sc*0.98).toFixed(0)+'" cy="'+(y-sc*0.23).toFixed(0)+'" r="'+(sc*0.15).toFixed(0)+'" fill="'+p.sil+'"/>'
  +'<circle cx="'+(x+sc*0.97).toFixed(0)+'" cy="'+(y-sc*0.78).toFixed(0)+'" r="'+(sc*0.028).toFixed(0)+'" fill="'+p.warm+'"/>';
  return s;
 },
 (p,r,W,H)=>{ /* 3 ночь: звёзды, луна, конусы */
  const hy=H*0.5;
  let s='<rect width="'+W+'" height="'+H+'" fill="url(#a)"/>'+stars(p,r,W,H,hy)
  +'<rect y="'+hy+'" width="'+W+'" height="'+(H-hy).toFixed(0)+'" fill="'+p.road+'"/>'
  +'<rect y="'+(hy-H*0.01).toFixed(0)+'" width="'+W+'" height="'+(H*0.01).toFixed(0)+'" fill="'+p.sil+'"/>';
  const mx=W*0.82,my=hy-H*0.02;
  s+='<rect x="'+mx.toFixed(0)+'" y="'+(my-H*0.42).toFixed(0)+'" width="'+(H*0.008).toFixed(1)+'" height="'+(H*0.42).toFixed(0)+'" fill="'+p.sil+'"/>'
  +'<rect x="'+(mx-H*0.03).toFixed(0)+'" y="'+(my-H*0.44).toFixed(0)+'" width="'+(H*0.07).toFixed(0)+'" height="'+(H*0.016).toFixed(0)+'" fill="'+p.sil+'"/>'
  +'<path d="M'+mx.toFixed(0)+' '+(my-H*0.42).toFixed(0)+' L'+(mx-W*0.22).toFixed(0)+' '+H+' L'+(mx+W*0.1).toFixed(0)+' '+H+' Z" fill="'+p.sun+'" opacity=".08"/>'
  +'<ellipse cx="'+mx.toFixed(0)+'" cy="'+(my-H*0.42).toFixed(0)+'" rx="'+(H*0.1).toFixed(0)+'" ry="'+(H*0.055).toFixed(0)+'" fill="url(#b)"/>';
  for(let i=0;i<6;i++){
    const u=Math.pow(i/5,1.55);
    const cx=W*(0.1+0.66*u)+(r()-0.5)*W*0.02,cy=H*(0.56+0.36*u),sz=H*(0.045+0.17*u);
    s+='<ellipse cx="'+cx.toFixed(0)+'" cy="'+(cy-sz*0.2).toFixed(0)+'" rx="'+(sz*1.4).toFixed(0)+'" ry="'+(sz*0.55).toFixed(0)+'" fill="url(#b)" opacity=".5"/>'
    +cone(cx,cy-sz,sz,p);
  }
  return s;
 },
 (p,r,W,H)=>{ /* 4 экскаватор */
  const hy=H*0.5,gy=H*0.82,sx=W*0.28;
  let s='<rect width="'+W+'" height="'+H+'" fill="url(#a)"/>'
  +'<circle cx="'+sx.toFixed(0)+'" cy="'+(hy*0.55).toFixed(0)+'" r="'+(H*0.32).toFixed(0)+'" fill="url(#b)"/>'
  +rays('',p,W,H,sx,hy*0.55)+mountains(p,r,W,H,hy)
  +'<rect y="'+hy+'" width="'+W+'" height="'+(gy-hy).toFixed(0)+'" fill="'+p.ground+'"/>'
  +'<rect y="'+gy+'" width="'+W+'" height="'+(H-gy).toFixed(0)+'" fill="'+p.road+'"/>'
  +'<path d="M0 '+gy+' Q'+(W*0.16).toFixed(0)+' '+(gy-H*0.1).toFixed(0)+' '+(W*0.3).toFixed(0)+' '+gy+' Z" fill="'+p.sil+'" opacity=".85"/>'
  +'<path d="M'+(W*0.55).toFixed(0)+' '+gy+' Q'+(W*0.72).toFixed(0)+' '+(gy-H*0.14).toFixed(0)+' '+W+' '+(gy-H*0.02).toFixed(0)+' L'+W+' '+gy+' Z" fill="'+p.sil+'" opacity=".7"/>';
  const sc=W*0.24,x=W*0.42,y=gy+H*0.02;
  s+=excav(x,y,sc,p)
  +'<ellipse cx="'+(x+sc*0.75).toFixed(0)+'" cy="'+(y-sc*0.25).toFixed(0)+'" rx="'+(sc*0.3).toFixed(0)+'" ry="'+(sc*0.08).toFixed(0)+'" fill="#fff" opacity=".1"/>'
  +person(x-sc*0.9,y,sc*0.3,p.sil);
  return s;
 },
 (p,r,W,H)=>{ /* 5 макро асфальта */
  let s='<rect width="'+W+'" height="'+H+'" fill="'+p.road+'"/>';
  for(let i=0;i<260;i++){
    s+='<circle cx="'+(r()*W).toFixed(1)+'" cy="'+(r()*H).toFixed(1)+'" r="'+(r()*2.2+0.6).toFixed(1)+'" fill="'+(r()>0.5?'#fff':'#000')+'" opacity="'+(r()*0.16+0.04).toFixed(2)+'"/>';
  }
  s+='<rect width="'+W+'" height="'+H+'" fill="url(#b)" opacity=".3"/>'
  +'<rect width="'+W+'" height="'+H+'" fill="url(#a)" opacity=".14"/>';
  const yA=H*(0.18+r()*0.2),yB=H*(0.75+r()*0.2);
  s+='<path d="M'+(-W*0.05).toFixed(0)+' '+yA.toFixed(0)+' L'+(W*1.05).toFixed(0)+' '+yB.toFixed(0)+' L'+(W*1.05).toFixed(0)+' '+(yB+H*0.075).toFixed(0)+' L'+(-W*0.05).toFixed(0)+' '+(yA+H*0.075).toFixed(0)+' Z" fill="'+p.mark+'" opacity=".9"/>';
  for(let i=0;i<26;i++){
    const t=r(),x=-W*0.05+W*1.1*t,y=yA+(yB-yA)*t+H*0.075*r();
    s+='<circle cx="'+x.toFixed(0)+'" cy="'+y.toFixed(0)+'" r="'+(r()*H*0.012+H*0.004).toFixed(1)+'" fill="'+p.road+'" opacity=".8"/>';
  }
  s+='<path d="M'+(W*0.6).toFixed(0)+' '+(H*0.82).toFixed(0)+' l'+(W*0.09).toFixed(0)+' '+(-H*0.02).toFixed(0)+'" stroke="'+p.warm+'" stroke-width="'+(H*0.012).toFixed(0)+'" opacity=".85"/>';
  return s;
 },
 (p,r,W,H)=>{ /* 6 геодезист */
  const hy=H*0.53,gy=H*0.8,sx=W*0.7;
  let s='<rect width="'+W+'" height="'+H+'" fill="url(#a)"/>'
  +'<circle cx="'+sx.toFixed(0)+'" cy="'+(hy*0.5).toFixed(0)+'" r="'+(H*0.3).toFixed(0)+'" fill="url(#b)"/>'
  +rays('',p,W,H,sx,hy*0.5)+mountains(p,r,W,H,hy)
  +'<rect y="'+hy+'" width="'+W+'" height="'+(gy-hy).toFixed(0)+'" fill="'+p.ground+'"/>'
  +'<rect y="'+gy+'" width="'+W+'" height="'+(H-gy).toFixed(0)+'" fill="'+p.road+'"/>';
  for(let i=0;i<5;i++)s+='<rect x="'+(W*(0.06+i*0.05)).toFixed(0)+'" y="'+(hy+H*0.04).toFixed(0)+'" width="3" height="'+(H*0.035).toFixed(0)+'" fill="'+p.sil+'"/>';
  const sc=H*0.42,x=W*0.4,y=gy+H*0.03;
  return s+tripod(x,y,sc*0.6,p.sil)+rod(x+sc*0.42,y,sc*0.85,p)+person(x-sc*0.34,y,sc*0.5,p.sil);
 },
 (p,r,W,H)=>{ /* 7 самосвал */
  const hy=H*0.4,gy=H*0.86,sx=W*0.24;
  let s='<rect width="'+W+'" height="'+H+'" fill="url(#a)"/>'
  +'<circle cx="'+sx.toFixed(0)+'" cy="'+(hy*0.5).toFixed(0)+'" r="'+(H*0.36).toFixed(0)+'" fill="url(#b)"/>'
  +rays('',p,W,H,sx,hy*0.5)+mountains(p,r,W,H,hy)
  +'<rect y="'+hy+'" width="'+W+'" height="'+(gy-hy).toFixed(0)+'" fill="'+p.ground+'"/>'
  +'<path d="M0 '+gy+' L'+W+' '+(gy-H*0.06).toFixed(0)+' L'+W+' '+H+' L0 '+H+' Z" fill="'+p.road+'"/>';
  const sc=W*0.2,x=W*0.5,y=gy-H*0.02;
  s+=truck(x,y,sc,p);
  for(let i=0;i<4;i++)s+='<ellipse cx="'+(x-sc*(0.7+i*0.22)).toFixed(0)+'" cy="'+(y-sc*(0.05+i*0.03)).toFixed(0)+'" rx="'+(sc*(0.25+i*0.1)).toFixed(0)+'" ry="'+(sc*(0.09+i*0.03)).toFixed(0)+'" fill="#fff" opacity=".08"/>';
  return s;
 }
];
function frame(inner,p,W,H){
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'
  +'<defs>'
  +'<linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+p.sky1+'"/><stop offset=".62" stop-color="'+p.sky2+'"/><stop offset="1" stop-color="'+p.sky3+'"/></linearGradient>'
  +'<radialGradient id="b"><stop offset="0" stop-color="'+p.sun+'" stop-opacity=".9"/><stop offset=".45" stop-color="'+p.sun+'" stop-opacity=".26"/><stop offset="1" stop-color="'+p.sun+'" stop-opacity="0"/></radialGradient>'
  +'<radialGradient id="v" cx=".5" cy=".45" r=".9"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>'
  +'<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .07 0"/></filter>'
  +'</defs>'+inner
  +'<rect width="'+W+'" height="'+H+'" filter="url(#n)"/>'
  +'<rect width="'+W+'" height="'+H+'" fill="url(#v)"/>'
  +'</svg>';
}
function scene(seed,W,H,force){
  const key=seed+'|'+W+'x'+H+'|'+(force?force.m+'-'+force.p:'');
  if(sceneCache.has(key))return sceneCache.get(key);
  const h=ihash(String(seed));
  const mi=force&&force.m!=null?force.m:(h>>>3)%M.length;
  const pi=force&&force.p!=null?force.p:h%PAL.length;
  const p=mi===3?PAL[2]:PAL[pi];
  const uri='data:image/svg+xml;base64,'+b64(frame(M[mi](p,rng(h^0x9E3779B9),W,H),p,W,H));
  sceneCache.set(key,uri);
  return uri;
}
const isURL=v=>/^(https?:|data:|blob:|\/)/i.test(String(v));
function photoSrc(v,W,H){
  v=String(v||'').trim();
  if(!v)return scene('ph-'+W+'x'+H,W,H);
  return isURL(v)?v:scene(v,W,H);
}
function guard(scope){
  $$('img[data-fb]',scope).forEach(img=>{
    if(img.dataset.g)return;
    img.dataset.g='1';
    img.addEventListener('error',()=>{const fb=img.dataset.fb;if(fb&&img.src!==fb)img.src=fb;});
    if(img.complete&&img.naturalWidth===0&&img.src&&!img.src.startsWith('data:'))img.src=img.dataset.fb;
  });
}

/* ============================================================
   ПАРОЛЬ: стандартный — sdi2024 (константа + base64 ниже).
   Сменить стандартный: const ADMIN_PASS='мой-пароль';
   Либо задать свой в админке («Настройки» → «Пароль панели»).
============================================================ */
const ADMIN_PASS=atob('c2RpMjAyNA=='); // sdi2024
const HASH_KEY='sdi_admin_hash';
async function sha256(t){
  try{
    const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));
    return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }catch(e){return null;}
}
async function checkPass(v){
  const h=localStorage.getItem(HASH_KEY);
  if(h){const c=await sha256(v);return c!==null&&c===h;}
  return v===ADMIN_PASS;
}

/* ================= ХРАНИЛИЩА ================= */
const PROJ_KEY='sdi_projects_v1',CFG_KEY='sdi_cfg_v1',LEADS_KEY='sdi_leads_v1',AUTH_KEY='sdi_admin_ok';
const CFG_DEFAULT={
  phone:'+7 987 123-80-24',
  email:'sdi2482@mail.ru',
  addrFull:'428023, Чувашская Республика — Чувашия, г. о. город Чебоксары, г. Чебоксары, ул. Гражданская, д. 85А, офис 1',
  addrShort:'Чебоксары, ул. Гражданская, 85А',
  hours:'Пн–Пт 8:00–18:00 · Сб — по договорённости',
  hoursShort:'Пн–Пт 8:00–18:00',
  director:'Васильев Виталий Николаевич',
  founded:'2020',
  markers:[
    {v:'2020',l:'год регистрации компании'},
    {v:'33',l:'вида деятельности по ОКВЭД'},
    {v:'1',l:'директор и собственник — одно лицо',acc:true}
  ],
  wRoad:'3 года',wNet:'5 лет',wResp:'3 рабочих дня',
  heroImage:'',aboutImage:'',bandImage:'',
  webhook:''
};
function loadJSON(key,fallback){
  try{const raw=localStorage.getItem(key);if(raw){const v=JSON.parse(raw);if(v)return v;}}catch(e){}
  return JSON.parse(JSON.stringify(fallback));
}
let cfg=loadJSON(CFG_KEY,CFG_DEFAULT);
if(!cfg.director)cfg.director=CFG_DEFAULT.director;
if(!cfg.founded)cfg.founded=CFG_DEFAULT.founded;
if(!Array.isArray(cfg.markers)||cfg.markers.length!==3)cfg.markers=JSON.parse(JSON.stringify(CFG_DEFAULT.markers));
['heroImage','aboutImage','bandImage','webhook'].forEach(k=>{if(typeof cfg[k]!=='string')cfg[k]='';});
function saveCfg(){try{localStorage.setItem(CFG_KEY,JSON.stringify(cfg))}catch(e){}}

const ph5=s=>[1,2,3,4,5].map(i=>s+'-'+i);
const DEFAULTS=[
 {id:'p1',title:'Реконструкция ул. Сельхозтехники',location:'Чебоксары',scope:'3,2 км',duration:'5 мес.',year:'2023',role:'Генподряд',
  photos:ph5('sdi-obj1'),
  challenge:'Улица с интенсивным движением и ветхими сетями: реконструкция без полного перекрытия, с заменой водопровода прямо под новой дорожной одеждой.',
  solution:'Работали в две захватки с временными объездами. Сети перенесли до начала укладки, основание усилили георешёткой. Сдали за 5 месяцев вместо проектных семи.',note:''},
 {id:'p2',title:'Подъездная дорога к промпарку «Заречный»',location:'Новочебоксарск',scope:'5,8 км',duration:'9 мес.',year:'2022–23',role:'Генподряд',
  photos:ph5('sdi-obj2'),
  challenge:'Дорога была нужна резидентам к началу отопительного сезона. Грунты слабые — обычная насыпь дала бы осадку в первый же год эксплуатации.',
  solution:'Насыпь отсыпали карьерным грунтом с послойным уплотнением, коэффициент подтверждён лабораторией. График сжали, поставив два укладчика в одну смену.',note:''},
 {id:'p3',title:'Дворовые территории мкр. Волжский-3',location:'Чебоксары',scope:'42 000 м²',duration:'3 мес.',year:'2024',role:'Субподряд',
  photos:ph5('sdi-obj3'),
  challenge:'Узкие дворы, припаркованные машины и люди, которым нужно жить на работающей площадке, — классический конфликт стройки и жителя.',
  solution:'Двор делили на секторы, временные парковки и переходы согласовывали заранее, укладку вели только в дневное окно. Жалоб в администрацию не поступило.',note:''},
 {id:'p4',title:'Сети водоснабжения и водоотведения, с. Ишлеи',location:'Чебоксарский район',scope:'7,4 км',duration:'6 мес.',year:'2022',role:'Субподряд',
  photos:ph5('sdi-obj4'),
  challenge:'Стальные трубы на пределе износа, трасса идёт вдоль действующей дороги, а вскрытия в нескольких точках были невозможны.',
  solution:'Полиэтилен ПЭ100 SDR 17, проколы под проездами без вскрытия, пересечения — в защитных футлярах. Сети сданы эксплуатирующей организации с первого предъявления.',note:''},
 {id:'p5',title:'Дороги и освещение логопарка «Волга-Порт»',location:'Чебоксары',scope:'4,1 км + 96 опор',duration:'7 мес.',year:'2024',role:'Генподряд',
  photos:ph5('sdi-obj5'),
  challenge:'Нагрузка до 40 тонн на ось и требование заказчика: освещение должно работать к запуску первого терминала — раньше чистого асфальта.',
  solution:'Усиленная конструкция: 40 см щебёночного основания и 11 см асфальтобетона в два слоя. Освещение монтировали параллельно дорожным работам — терминал запустили вовремя.',
  note:'Усиленная дорожная одежда под нагрузку 40 т на ось; наружное освещение запустили раньше чистого асфальта — к открытию первого терминала.'}
];
let projects=loadJSON(PROJ_KEY,DEFAULTS);
let pmig=false;
projects=projects.map(p=>Object.assign({},p,{photos:(p.photos||[]).map(v=>{
  const m=String(v).match(/picsum\.photos\/seed\/([^/]+)/);
  if(m){pmig=true;return m[1];}
  return v;
})}));
function saveProjects(){try{localStorage.setItem(PROJ_KEY,JSON.stringify(projects))}catch(e){}}
if(pmig)saveProjects();
let leads=loadJSON(LEADS_KEY,[]);
function saveLeads(){try{localStorage.setItem(LEADS_KEY,JSON.stringify(leads))}catch(e){}}

/* ================= ТОСТЫ ================= */
const toasts=$('#toasts');
function toast(msg){
  const t=document.createElement('div');t.className='toast';
  t.innerHTML='<i data-lucide="check"></i><span>'+esc(msg)+'</span>';
  toasts.appendChild(t);lucide.createIcons();
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),380)},2800);
}

/* ================= РЕВЕЙЛ ================= */
const revealIO=new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting){
    en.target.classList.add('in');
    en.target.addEventListener('transitionend',()=>en.target.style.transitionDelay='',{once:true});
    revealIO.unobserve(en.target);
  }
}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
function stagger(scope){
  $$('[data-stagger]',scope).forEach(g=>$$('.reveal',g).forEach((el,i)=>el.style.transitionDelay=Math.min(i,7)*70+'ms'));
}
function watch(scope){
  $$('.reveal',scope).forEach(el=>{
    if(RM){el.classList.add('in');return;}
    if(!el.classList.contains('in'))revealIO.observe(el);
  });
}

/* ================= СЧЁТЧИКИ ================= */
function runCount(el){
  const target=+el.dataset.count;
  if(RM){el.textContent=target;el.dataset.done='1';return;}
  const dur=+el.dataset.dur||1200,t0=performance.now();
  (function tick(now){
    const p=Math.min(1,(now-t0)/dur);
    el.textContent=Math.round(target*p);
    if(p<1)requestAnimationFrame(tick);else el.dataset.done='1';
  })(t0);
}
const cio=new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting){runCount(en.target);cio.unobserve(en.target);}
}),{threshold:.4});
function observeCounts(scope){$$('.count',scope).forEach(el=>cio.observe(el));}

/* ================= КОНТАКТЫ, ЦИФРЫ, ФОТО САЙТА ================= */
function renderMarkers(){
  const g=$('#trustGrid');if(!g)return;
  g.innerHTML=cfg.markers.map(m=>
    '<div class="trust-item">'
    +'<span class="t-num'+(m.acc?' acc':'')+'"><span class="count" data-count="'+esc(m.v)+'" data-dur="1200">0</span></span>'
    +'<span class="t-label">'+esc(m.l)+'</span></div>').join('');
  observeCounts(g);
}
function setSiteImg(el,val,seed,W,H,m,p){
  if(!el)return;
  const fb=scene(seed,W,H,{m:m,p:p});
  el.dataset.fb=fb;
  el.src=val?photoSrc(val,W,H):fb;
}
function applySiteImages(){
  setSiteImg($('#heroImg'),cfg.heroImage,'sdi-hero-road',1920,1080,0,0);
  setSiteImg($('#aboutImg'),cfg.aboutImage,'sdi-about',900,1040,6,1);
  setSiteImg($('#bandImg'),cfg.bandImage,'sdi-band',1600,700,5,2);
}
function applyCfg(){
  const telHref='tel:'+String(cfg.phone).replace(/[^+\d]/g,'');
  const mailHref='mailto:'+cfg.email;
  $$('[data-cfg]').forEach(el=>{
    const k=el.dataset.cfg;let v='';
    switch(k){
      case 'phone':v=cfg.phone;break;
      case 'email':v=cfg.email;break;
      case 'addrFull':v=cfg.addrFull;break;
      case 'addrShort':v=cfg.addrShort;break;
      case 'hours':v=cfg.hours;break;
      case 'hoursShort':v=cfg.hoursShort;break;
      case 'founded':v=cfg.founded;break;
      case 'director':v=cfg.director;break;
      case 'wRoad':v=cfg.wRoad;break;
      case 'wNet':v=cfg.wNet;break;
      case 'wResp':v=cfg.wResp;break;
      case 'wBoth':v=cfg.wRoad+' / '+cfg.wNet;break;
      case 'phoneHref':el.setAttribute('href',telHref);return;
      case 'emailHref':el.setAttribute('href',mailHref);return;
    }
    el.textContent=v;
  });
  renderMarkers();
  applySiteImages();
}

/* ================= 3D-ТИЛТ КАРТОЧЕК ================= */
function attachTilt(card){
  if(!FINE||RM)return;
  const m=$('.proj-media',card);
  if(!m)return;
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    m.style.transform='perspective(900px) rotateX('+(-y*5).toFixed(2)+'deg) rotateY('+(x*7).toFixed(2)+'deg)';
    m.style.setProperty('--mx',(x*100+50).toFixed(1)+'%');
    m.style.setProperty('--my',(y*100+50).toFixed(1)+'%');
  });
  card.addEventListener('mouseleave',()=>{m.style.transform='';});
}
/* параллакс полигонов в герое и CTA */
function attachParallax(sec){
  if(!FINE||RM)return;
  const f=sec.querySelector('.poly-field');
  if(!f)return;
  const ls=$$('.pw',f);
  sec.addEventListener('mousemove',e=>{
    const cx=e.clientX/window.innerWidth-.5,cy=e.clientY/window.innerHeight-.5;
    ls.forEach(l=>{
      const d=+l.dataset.depth||1;
      l.style.transform='translate3d('+(cx*d*26).toFixed(1)+'px,'+(cy*d*18).toFixed(1)+'px,0)';
    });
  });
}

/* ================= СЕТКА ПРОЕКТОВ ================= */
const projGrid=$('#projGrid');
const SPANS=['s7','s5','s5','s7','wide'];
function spanFor(i,total){
  if(total===1)return 'wide';
  const c=SPANS[i%5];
  if(i===total-1&&c==='s5')return 's7';
  return c;
}
function firstSentence(t){
  t=(t||'').trim();if(!t)return '';
  const m=t.match(/^[^.!?]+[.!?]/);const s=m?m[0]:t;
  return s.length>150?s.slice(0,150).trim()+'…':s;
}
function renderProjects(){
  const total=projects.length;
  projGrid.innerHTML=projects.map((p,i)=>{
    const s=spanFor(i,total);
    const meta=[p.location,p.scope,p.duration,p.year].filter(Boolean).join(' · ');
    const img=photoSrc((p.photos&&p.photos[0])||('sdi-cover'+i),1100,760);
    const fb=scene('pc'+i,1100,760);
    const note=s==='wide'?(p.note||firstSentence(p.challenge)):'';
    return '<article class="proj '+s+' reveal" data-idx="'+i+'" tabindex="0" role="button" aria-label="Открыть проект: '+esc(p.title)+'">'
      +'<div class="proj-media"><img src="'+esc(img)+'" data-fb="'+fb+'" alt="'+esc(p.title)+'" loading="lazy" width="1100" height="760" decoding="async">'
      +(p.role?'<span class="proj-role">'+esc(p.role)+'</span>':'')+'</div>'
      +'<div class="proj-body"><div><h3>'+esc(p.title)+'</h3>'
      +(meta?'<p class="proj-meta">'+esc(meta)+'</p>':'')
      +(note?'<p class="proj-note">'+esc(note)+'</p>':'')+'</div>'
      +'<span class="proj-arr"><i data-lucide="arrow-up-right"></i></span></div></article>';
  }).join('');
  lucide.createIcons();
  stagger(projGrid);watch(projGrid);guard(projGrid);
  $$('.proj',projGrid).forEach(attachTilt);
}
projGrid.addEventListener('click',e=>{const c=e.target.closest('.proj');if(c)openLb(+c.dataset.idx);});
projGrid.addEventListener('keydown',e=>{
  const c=e.target.closest('.proj');
  if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openLb(+c.dataset.idx);}
});

/* ================= ЛАЙТБОКС ================= */
const lb=$('#lb'),lbImg=$('#lbImg'),lbTitle=$('#lbTitle'),lbMeta=$('#lbMeta'),
      lbFlow=$('#lbFlow'),lbThumbs=$('#lbThumbs'),lbCount=$('#lbCount'),lbIdx=$('#lbIdx');
let cur=0,curIdx=0,lastFocus=null;
lbImg.addEventListener('error',()=>{const fb=lbImg.dataset.fb;if(fb&&lbImg.src!==fb)lbImg.src=fb;});
function setPhoto(i){
  const photos=projects[cur].photos||[];
  const n=photos.length;if(!n)return;
  curIdx=(i+n)%n;
  $$('.lb-thumb',lbThumbs).forEach((t,ti)=>t.classList.toggle('act',ti===curIdx));
  lbCount.textContent=(curIdx+1)+' / '+n;
  lbImg.classList.remove('ready');
  lbImg.dataset.fb=scene('lb'+cur+'-'+curIdx,1280,860);
  lbImg.src=photoSrc(photos[curIdx],1280,860);
  lbImg.alt=(projects[cur].title||'Проект')+' — фото '+(curIdx+1);
}
function renderLb(){
  const p=projects[cur];
  lbTitle.textContent=p.title||'Без названия';
  lbMeta.textContent=[p.location,p.scope,p.duration,p.year].filter(Boolean).join(' · ')+' · '+(p.role||'');
  lbIdx.textContent='Проект '+String(cur+1).padStart(2,'0)+' / '+String(projects.length).padStart(2,'0');
  let html='';
  if(p.challenge)html+='<div class="lb-block"><span class="lb-k"><i data-lucide="crosshair"></i>Задача</span><p>'+esc(p.challenge)+'</p></div>';
  if(p.challenge&&p.solution)html+='<div class="lb-link" aria-hidden="true"><span class="lb-line"></span><i data-lucide="arrow-down"></i><span class="lb-line"></span></div>';
  if(p.solution)html+='<div class="lb-block lb-sol"><span class="lb-k"><i data-lucide="wrench"></i>Решение</span><p>'+esc(p.solution)+'</p></div>';
  lbFlow.innerHTML=html;
  const photos=p.photos||[];
  lbThumbs.innerHTML=photos.map((u,i)=>
    '<button class="lb-thumb'+(i===0?' act':'')+'" data-i="'+i+'" aria-label="Фото '+(i+1)+'">'
    +'<img src="'+esc(photoSrc(u,180,130))+'" data-fb="'+scene('lt'+cur+'-'+i,180,130)+'" alt="" loading="lazy" width="180" height="130"></button>').join('');
  guard(lbThumbs);
  if(photos.length)setPhoto(0);else{lbCount.textContent='0 / 0';lbImg.removeAttribute('src');}
  lucide.createIcons();
  lbFlow.classList.remove('in');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    $$('.lb-block,.lb-link',lbFlow).forEach((el,i)=>el.style.transitionDelay=(i*90)+'ms');
    lbFlow.classList.add('in');
  }));
}
lbImg.addEventListener('load',()=>lbImg.classList.add('ready'));
function openLb(i){
  if(!projects[i])return;
  cur=i;renderLb();
  lastFocus=document.activeElement;
  lb.classList.add('open');
  document.documentElement.classList.add('locked');
  $('.lb-close',lb).focus();
}
function closeLb(){
  lb.classList.remove('open');
  document.documentElement.classList.remove('locked');
  if(lastFocus)lastFocus.focus();
}
 $$('[data-close]',lb).forEach(el=>el.addEventListener('click',closeLb));
 $('#lbPrev').addEventListener('click',()=>setPhoto(curIdx-1));
 $('#lbNext').addEventListener('click',()=>setPhoto(curIdx+1));
lbThumbs.addEventListener('click',e=>{const b=e.target.closest('.lb-thumb');if(b)setPhoto(+b.dataset.i);});
document.addEventListener('keydown',e=>{
  if(!lb.classList.contains('open'))return;
  if(e.key==='Escape')closeLb();
  if(e.key==='ArrowLeft')setPhoto(curIdx-1);
  if(e.key==='ArrowRight')setPhoto(curIdx+1);
});

/* ================= ФОРМА → ЗАЯВКА ================= */
const chipsBox=$('#chips'),picked=new Set(),fSvc=$('#f-svc');
chipsBox.addEventListener('click',e=>{
  const c=e.target.closest('.chip');if(!c)return;
  const v=c.dataset.svc;
  c.classList.toggle('on');
  if(c.classList.contains('on'))picked.add(v);else picked.delete(v);
});
const form=$('#quoteForm'),nameF=$('#f-name'),phoneF=$('#f-phone');
const submitBtn=$('.btn-submit',form),submitLabel=submitBtn.innerHTML;
const setErr=(input,bad)=>input.closest('.field').classList.toggle('err',bad);
[nameF,phoneF].forEach(i=>i.addEventListener('input',()=>setErr(i,false)));
form.addEventListener('submit',e=>{
  e.preventDefault();
  const badName=!nameF.value.trim();
  const badPhone=phoneF.value.replace(/\D/g,'').length<10;
  setErr(nameF,badName);setErr(phoneF,badPhone);
  if(badName||badPhone){(badName?nameF:phoneF).focus();return;}
  const lead={
    id:uid(),ts:Date.now(),
    name:nameF.value.trim(),org:$('#f-org').value.trim(),
    phone:phoneF.value.trim(),
    services:[...picked].join(', '),task:$('#f-task').value.trim(),
    status:'new'
  };
  leads.push(lead);saveLeads();
  if(cfg.webhook){
    fetch(cfg.webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)})
      .catch(()=>{});
  }
  fSvc.value=lead.services;
  submitBtn.disabled=true;submitBtn.classList.add('busy');submitBtn.innerHTML='Отправляем…';
  setTimeout(()=>form.classList.add('sent'),900);
});
 $('#formReset').addEventListener('click',()=>{
  form.classList.remove('sent');form.reset();picked.clear();
  $$('.chip.on',chipsBox).forEach(c=>c.classList.remove('on'));
  submitBtn.disabled=false;submitBtn.classList.remove('busy');submitBtn.innerHTML=submitLabel;
  nameF.focus();
});

/* ================= АККОРДЕОНЫ (услуги + FAQ) ================= */
 $$('.svc, .faq').forEach(card=>{
  const btn=$('.svc-head,.faq-q',card);
  if(!btn)return;
  btn.addEventListener('click',()=>{
    const wasOpen=card.classList.contains('open');
    card.parentElement.querySelectorAll(':scope > .open').forEach(o=>{
      o.classList.remove('open');
      const b=$('.svc-head,.faq-q',o);if(b)b.setAttribute('aria-expanded','false');
    });
    if(!wasOpen){card.classList.add('open');btn.setAttribute('aria-expanded','true');}
  });
});

/* ================= АДМИНКА ================= */
const siteView=$('#view-site'),adminView=$('#view-admin'),gate=$('#gate');
const admList=$('#admList'),admCount=$('#admCount'),admForm=$('#admForm'),
      admPhotos=$('#admPhotos'),admFormTitle=$('#admFormTitle'),admSave=$('#admSave');
const aTitle=$('#a-title'),aLoc=$('#a-loc'),aScope=$('#a-scope'),aDur=$('#a-dur'),
      aYear=$('#a-year'),aRole=$('#a-role'),aNote=$('#a-note'),aCh=$('#a-ch'),aSol=$('#a-sol');
let editingId=null;
const randomPhoto=()=>'sdi-'+Math.random().toString(36).slice(2,8);
const PAGE_META={dash:['Обзор','Состояние сайта и быстрые действия'],projects:['Проекты','Примеры работ на сайте'],leads:['Заявки','Обращения с формы связи'],settings:['Настройки','Контакты, цифры, фото и пароль']};

function armConfirm(btn,txt){
  btn.classList.add('confirm');btn.textContent='Точно?';
  setTimeout(()=>{if(btn.isConnected){btn.classList.remove('confirm');btn.textContent=txt;}},2600);
}
function scrollForm(){
  if(window.innerWidth<=1020)$('#admFormWrap').scrollIntoView({behavior:'smooth',block:'start'});
}
/* ---- вкладки ---- */
function setPage(name){
  $$('.as-nav button').forEach(b=>b.classList.toggle('act',b.dataset.page===name));
  $$('.admin-page').forEach(p=>p.classList.toggle('act',p.id==='page-'+name));
  if(PAGE_META[name]){
    $('#admTitle').textContent=PAGE_META[name][0];
    $('#admSub').textContent=PAGE_META[name][1];
  }
  if(name==='leads')renderLeads();
  if(name==='settings')fillCfgForm();
  if(name==='dash')renderDash();
}
 $$('.as-nav button').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));

/* ---- обзор ---- */
function renderDash(){
  const n=leads.filter(l=>l.status==='new').length;
  $('#dProj').textContent=projects.length;
  $('#dLeadsNew').textContent=n;
  $('#dLeadsAll').textContent=leads.length;
  let bytes=0;
  [PROJ_KEY,CFG_KEY,LEADS_KEY].forEach(k=>{bytes+=(localStorage.getItem(k)||'').length});
  $('#dStorage').textContent=(bytes/1024).toFixed(1)+' КБ';
  const hook=$('#dHook');
  hook.textContent=cfg.webhook?'подключён':'не задан';
  hook.style.color=cfg.webhook?'#8fd49f':'var(--w-3)';
  $('#dPhotos').textContent=[cfg.heroImage,cfg.aboutImage,cfg.bandImage].filter(Boolean).length+'/3';
  $('#dPass').textContent=localStorage.getItem(HASH_KEY)?'изменённый':'стандартный';
}
 $('#qaAdd').addEventListener('click',()=>{setPage('projects');$('#admAdd').click();});
 $('#qaExport').addEventListener('click',exportJSON);

/* ---- проекты: форма ---- */
function addPhotoRow(url){
  const row=document.createElement('div');row.className='ph-row';
  row.innerHTML='<img class="ph-prev" alt="" src="'+esc(photoSrc(url||'demo',1100,760))+'">'
    +'<input class="ph-url" type="text" placeholder="https://… или код-слово" value="'+esc(url||'')+'">'
    +'<button type="button" class="ph-btn ph-dice" title="Случайная встроенная графика" aria-label="Случайное фото"><i data-lucide="dices"></i></button>'
    +'<button type="button" class="ph-btn ph-del" title="Убрать фото" aria-label="Убрать фото"><i data-lucide="x"></i></button>';
  const prev=$('.ph-prev',row);
  prev.addEventListener('error',()=>{const fb=scene('phprev',1100,760);if(prev.src!==fb)prev.src=fb;});
  admPhotos.appendChild(row);lucide.createIcons();
}
admPhotos.addEventListener('click',e=>{
  const row=e.target.closest('.ph-row');if(!row)return;
  if(e.target.closest('.ph-dice')){
    const u=randomPhoto();
    $('.ph-url',row).value=u;
    $('.ph-prev',row).src=photoSrc(u,1100,760);
  }
  if(e.target.closest('.ph-del'))row.remove();
});
admPhotos.addEventListener('input',e=>{
  if(!e.target.classList.contains('ph-url'))return;
  const row=e.target.closest('.ph-row');
  const v=e.target.value.trim();
  $('.ph-prev',row).src=photoSrc(v||'demo',1100,760);
});
 $('#admAddPhoto').addEventListener('click',()=>addPhotoRow(''));

function resetForm(){
  editingId=null;
  admForm.reset();
  admPhotos.innerHTML='';addPhotoRow('');
  admFormTitle.textContent='Новый проект';
  admSave.textContent='Добавить проект';
  $$('input,textarea,select',admForm).forEach(el=>el.classList.remove('err'));
}
function fillForm(p){
  aTitle.value=p.title||'';aLoc.value=p.location||'';aScope.value=p.scope||'';
  aDur.value=p.duration||'';aYear.value=p.year||'';aRole.value=p.role||'Генподряд';
  aNote.value=p.note||'';aCh.value=p.challenge||'';aSol.value=p.solution||'';
  admPhotos.innerHTML='';
  (p.photos&&p.photos.length?p.photos:['']).forEach(u=>addPhotoRow(u));
}
function startEdit(i){
  editingId=projects[i].id;
  fillForm(projects[i]);
  admFormTitle.textContent='Редактирование — '+(projects[i].title||'');
  admSave.textContent='Сохранить изменения';
}
function commitProjects(msg){
  saveProjects();renderAdminList();renderProjects();renderDash();if(msg)toast(msg);
}
admForm.addEventListener('submit',e=>{
  e.preventDefault();
  const title=aTitle.value.trim();
  if(!title){
    aTitle.classList.add('err');aTitle.focus();
    toast('Укажите название проекта');return;
  }
  let photos=$$('.ph-url',admPhotos).map(inp=>inp.value.trim()).filter(Boolean);
  if(!photos.length){photos=[randomPhoto(),randomPhoto(),randomPhoto()];}
  const data={
    title:title,location:aLoc.value.trim(),scope:aScope.value.trim(),
    duration:aDur.value.trim(),year:aYear.value.trim(),role:aRole.value,
    note:aNote.value.trim(),challenge:aCh.value.trim(),solution:aSol.value.trim(),photos:photos
  };
  if(editingId){
    const i=projects.findIndex(p=>p.id===editingId);
    if(i>=0)projects[i]=Object.assign({id:editingId},data);
    toast('Изменения сохранены');
  }else{
    projects.push(Object.assign({id:uid()},data));
    toast('Проект добавлен');
  }
  commitProjects();resetForm();
});
admForm.addEventListener('input',e=>{if(e.target.classList.contains('err'))e.target.classList.remove('err');});
 $('#admCancel').addEventListener('click',()=>{resetForm();toast('Форма очищена');});
 $('#admClose').addEventListener('click',()=>{admForm.style.display=admForm.style.display==='none'?'':'none';});
 $('#admAdd').addEventListener('click',()=>{
  admForm.style.display='';
  if(editingId)resetForm();
  aTitle.focus();scrollForm();
});

/* ---- проекты: список ---- */
function renderAdminList(){
  admCount.textContent=projects.length;
  if(!projects.length){admList.innerHTML='<p class="adm-empty">Список пуст — добавьте первый проект.</p>';return;}
  admList.innerHTML=projects.map((p,i)=>{
    const meta=[p.location,p.scope,p.duration,p.year].filter(Boolean).join(' · ');
    return '<div class="adm-row" data-id="'+esc(p.id)+'" style="--i:'+i+'">'
      +'<span class="adm-num">'+String(i+1).padStart(2,'0')+'</span>'
      +'<img class="adm-thumb" src="'+esc(photoSrc((p.photos&&p.photos[0])||('sdi-thumb'+i),220,150))+'" data-fb="'+scene('at'+i,220,150)+'" alt="">'
      +'<div class="adm-info"><b>'+esc(p.title||'Без названия')+'</b>'
      +'<span>'+esc(meta)+(meta?' · ':'')+'фото: '+((p.photos||[]).length)+'</span></div>'
      +'<div class="adm-tools">'
      +'<button type="button" class="b-ico" data-act="up" aria-label="Выше"'+(i===0?' disabled':'')+'><i data-lucide="arrow-up"></i></button>'
      +'<button type="button" class="b-ico" data-act="down" aria-label="Ниже"'+(i===projects.length-1?' disabled':'')+'><i data-lucide="arrow-down"></i></button>'
      +'<button type="button" class="b-edit" data-act="edit">Изменить</button>'
      +'<button type="button" class="b-del" data-act="del">Удалить</button>'
      +'</div></div>';
  }).join('');
  lucide.createIcons();
  guard(admList);
}
admList.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-act]');if(!btn)return;
  const id=btn.closest('.adm-row').dataset.id;
  const i=projects.findIndex(p=>p.id===id);if(i<0)return;
  const act=btn.dataset.act;
  if(act==='up'&&i>0){[projects[i-1],projects[i]]=[projects[i],projects[i-1]];commitProjects('Порядок изменён');}
  else if(act==='down'&&i<projects.length-1){[projects[i+1],projects[i]]=[projects[i],projects[i+1]];commitProjects('Порядок изменён');}
  else if(act==='edit'){startEdit(i);scrollForm();}
  else if(act==='del'){
    if(!btn.classList.contains('confirm'))armConfirm(btn,'Удалить');
    else{
      const wasEditing=editingId===id;
      projects.splice(i,1);
      commitProjects('Проект удалён');
      if(wasEditing)resetForm();
    }
  }
});

/* ---- заявки ---- */
const leadList=$('#leadList'),leadBadge=$('#leadBadge'),leadTotal=$('#leadTotal'),leadNew=$('#leadNew');
let leadFilter='all',leadQ='';
 $('#segLead').addEventListener('click',e=>{
  const b=e.target.closest('button[data-f]');if(!b)return;
  leadFilter=b.dataset.f;
  $$('#segLead button').forEach(x=>x.classList.toggle('act',x===b));
  renderLeads();
});
 $('#leadSearch').addEventListener('input',e=>{leadQ=e.target.value.trim().toLowerCase();renderLeads();});
function renderLeads(){
  const sorted=[...leads].sort((a,b)=>b.ts-a.ts).filter(l=>{
    if(leadFilter==='new'&&l.status!=='new')return false;
    if(leadFilter==='done'&&l.status!=='done')return false;
    if(leadQ){
      const hay=(l.name+' '+l.phone+' '+(l.org||'')+' '+(l.task||'')).toLowerCase();
      if(!hay.includes(leadQ))return false;
    }
    return true;
  });
  const nNew=leads.filter(l=>l.status==='new').length;
  leadBadge.textContent=nNew;leadBadge.hidden=nNew===0;
  leadTotal.textContent=leads.length;leadNew.textContent=nNew;
  if(!sorted.length){
    leadList.innerHTML='<p class="adm-empty">'+(leads.length?'Ничего не найдено по фильтру.':'Заявок пока нет. Отправьте тестовую с формы на сайте.')+'</p>';
    return;
  }
  leadList.innerHTML=sorted.map(l=>{
    const d=new Date(l.ts).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
    const tel='tel:'+String(l.phone).replace(/[^+\d]/g,'');
    return '<div class="lead-row'+(l.status==='done'?' done':'')+'" data-id="'+esc(l.id)+'">'
      +'<div class="lead-top"><span class="lead-dot"></span>'
      +'<span class="lead-status">'+(l.status==='done'?'Обработана':'Новая')+'</span>'
      +'<span class="lead-date">'+esc(d)+'</span>'
      +'<span class="lead-name">'+esc(l.name)+'</span>'
      +'<div class="lead-actions">'
      +'<button type="button" data-act="tog">'+(l.status==='done'?'Вернуть':'Обработана')+'</button>'
      +'<button type="button" class="b-del" data-act="del">Удалить</button></div></div>'
      +'<div class="lead-grid">'
      +'<div><span class="lead-k">Телефон</span><span class="lead-v"><a href="'+esc(tel)+'">'+esc(l.phone)+'</a></span></div>'
      +(l.org?'<div><span class="lead-k">Организация</span><span class="lead-v">'+esc(l.org)+'</span></div>':'')
      +(l.services?'<div><span class="lead-k">Услуги</span><span class="lead-v">'+esc(l.services)+'</span></div>':'')
      +'</div>'
      +(l.task?'<p class="lead-task">'+esc(l.task)+'</p>':'')
      +'</div>';
  }).join('');
  lucide.createIcons();
}
leadList.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-act]');if(!btn)return;
  const id=btn.closest('.lead-row').dataset.id;
  const i=leads.findIndex(l=>l.id===id);if(i<0)return;
  if(btn.dataset.act==='tog'){
    leads[i].status=leads[i].status==='done'?'new':'done';
    saveLeads();renderLeads();renderDash();
  }else{
    if(!btn.classList.contains('confirm'))armConfirm(btn,'Удалить');
    else{leads.splice(i,1);saveLeads();renderLeads();renderDash();toast('Заявка удалена');}
  }
});
 $('#leadCsv').addEventListener('click',()=>{
  if(!leads.length){toast('Заявок пока нет');return;}
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const rows=[['Дата','Имя','Организация','Телефон','Услуги','Задача','Статус']];
  [...leads].sort((a,b)=>a.ts-b.ts).forEach(l=>rows.push([
    new Date(l.ts).toLocaleString('ru-RU'),l.name,l.org,l.phone,l.services,l.task,
    l.status==='done'?'обработана':'новая'
  ]));
  const csv='\ufeff'+rows.map(r=>r.map(q).join(';')).join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download='sdi-zayavki.csv';a.click();URL.revokeObjectURL(a.href);
  toast('CSV скачан');
});
const leadClear=$('#leadClear');let leadsArmed=false;
leadClear.addEventListener('click',()=>{
  if(!leadsArmed){leadsArmed=true;leadClear.textContent='Да, удалить все?';leadClear.classList.add('btn-primary');
    setTimeout(()=>{leadsArmed=false;leadClear.textContent='Очистить всё';leadClear.classList.remove('btn-primary');},3000);
    return;}
  leads=[];saveLeads();renderLeads();renderDash();
  leadClear.textContent='Очистить всё';leadClear.classList.remove('btn-primary');leadsArmed=false;
  toast('Все заявки удалены');
});

/* ---- настройки ---- */
const cfgMarkersBox=$('#cfgMarkers');
function markerRow(m){
  const row=document.createElement('div');row.className='f-row';
  row.innerHTML='<input class="n mono" type="text" value="'+esc(m.v)+'" aria-label="Цифра" placeholder="2020">'
    +'<input class="spec" type="text" value="'+esc(m.l)+'" aria-label="Подпись" placeholder="подпись к цифре">';
  return row;
}
function fillCfgForm(){
  $('#s-phone').value=cfg.phone;$('#s-email').value=cfg.email;
  $('#s-addrFull').value=cfg.addrFull;$('#s-addrShort').value=cfg.addrShort;
  $('#s-hours').value=cfg.hours;
  $('#s-director').value=cfg.director;$('#s-founded').value=cfg.founded;
  $('#s-wRoad').value=cfg.wRoad;$('#s-wNet').value=cfg.wNet;$('#s-wResp').value=cfg.wResp;
  $('#s-hero').value=cfg.heroImage||'';$('#s-about').value=cfg.aboutImage||'';$('#s-band').value=cfg.bandImage||'';
  $('#s-webhook').value=cfg.webhook||'';
  cfgMarkersBox.innerHTML='';
  cfg.markers.forEach(m=>cfgMarkersBox.appendChild(markerRow(m)));
  lucide.createIcons();
}
 $('#cfgForm').addEventListener('submit',e=>{
  e.preventDefault();
  const phone=$('#s-phone').value.trim(),email=$('#s-email').value.trim();
  if(!phone||!email){toast('Телефон и e-mail обязательны');return;}
  const hoursVal=$('#s-hours').value.trim()||CFG_DEFAULT.hours;
  const markers=$$('.f-row',cfgMarkersBox).map(r=>({
    v:$('.n',r).value.trim()||'0',
    l:$('.spec',r).value.trim()||'—'
  })).slice(0,3);
  if(markers[2])markers[2].acc=true;
  cfg={
    phone:phone,email:email,
    addrFull:$('#s-addrFull').value.trim()||CFG_DEFAULT.addrFull,
    addrShort:$('#s-addrShort').value.trim()||CFG_DEFAULT.addrShort,
    hours:hoursVal,
    hoursShort:hoursVal.split('·')[0].trim(),
    director:$('#s-director').value.trim()||CFG_DEFAULT.director,
    founded:$('#s-founded').value.trim()||'2020',
    markers:markers,
    wRoad:$('#s-wRoad').value.trim()||CFG_DEFAULT.wRoad,
    wNet:$('#s-wNet').value.trim()||CFG_DEFAULT.wNet,
    wResp:$('#s-wResp').value.trim()||CFG_DEFAULT.wResp,
    heroImage:$('#s-hero').value.trim(),
    aboutImage:$('#s-about').value.trim(),
    bandImage:$('#s-band').value.trim(),
    webhook:$('#s-webhook').value.trim()
  };
  saveCfg();applyCfg();renderDash();toast('Настройки применены — сайт обновлён');
});
const cfgReset=$('#cfgReset');let cfgArmed=false;
cfgReset.addEventListener('click',()=>{
  if(!cfgArmed){cfgArmed=true;cfgReset.textContent='Да, сбросить всё?';cfgReset.classList.add('btn-primary');
    setTimeout(()=>{cfgArmed=false;cfgReset.textContent='Сбросить к исходным';cfgReset.classList.remove('btn-primary');},3000);
    return;}
  cfg=JSON.parse(JSON.stringify(CFG_DEFAULT));
  saveCfg();applyCfg();fillCfgForm();renderDash();
  cfgReset.textContent='Сбросить к исходным';cfgReset.classList.remove('btn-primary');cfgArmed=false;
  toast('Контакты и цифры восстановлены');
});
/* смена пароля */
 $('#btnPassSave').addEventListener('click',async()=>{
  const p1=$('#s-pass1').value,p2=$('#s-pass2').value;
  if(p1.length<6){toast('Пароль — минимум 6 символов');return;}
  if(p1!==p2){toast('Пароли не совпадают');return;}
  const h=await sha256(p1);
  if(!h){toast('Не удалось: нужен https (или localhost)');return;}
  localStorage.setItem(HASH_KEY,h);
  $('#s-pass1').value='';$('#s-pass2').value='';
  renderDash();toast('Пароль панели обновлён');
});
 $('#btnPassReset').addEventListener('click',()=>{
  localStorage.removeItem(HASH_KEY);
  renderDash();toast('Возвращён стандартный пароль из script.js');
});

/* ---- экспорт ---- */
function exportJSON(){
  const data={projects:projects,cfg:cfg};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download='sdi-data.json';a.click();URL.revokeObjectURL(a.href);
  toast('Файл скачан — вставьте данные в script.js');
}
 $('#admExport').addEventListener('click',exportJSON);

/* ---- вход / выход ---- */
const gateForm=$('#gateForm'),gatePw=$('#gatePw');
 $$('.pw-eye').forEach(b=>b.addEventListener('click',()=>{
  const show=gatePw.type==='password';
  gatePw.type=show?'text':'password';
  $('.i-on',b).hidden=!show;
  $('.i-off',b).hidden=show;
  gatePw.focus();
}));
gateForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const ok=await checkPass(gatePw.value);
  if(ok){
    sessionStorage.setItem(AUTH_KEY,'1');
    gatePw.value='';gate.classList.remove('bad');
    initAdminData();
    route();toast('Добро пожаловать');
  }else{
    gate.classList.add('bad','shake');
    gatePw.select();
    setTimeout(()=>gate.classList.remove('shake'),450);
  }
});
 $('#admLogout').addEventListener('click',()=>{
  sessionStorage.removeItem(AUTH_KEY);
  if(location.hash==='#admin'){location.hash='';}
  else{history.replaceState(null,'',location.pathname);route();}
});

/* ================= МАРШРУТ ================= */
function isAdminRoute(){
  return location.hash==='#admin'
    ||new URLSearchParams(location.search).has('admin')
    ||/\/admin\/?$/.test(location.pathname);
}
function initAdminData(){
  renderAdminList();renderDash();fillCfgForm();
}
function route(){
  const isAdmin=isAdminRoute();
  if(isAdmin){
    siteView.hidden=true;adminView.hidden=false;
    document.body.classList.add('view-admin');
    const ok=sessionStorage.getItem(AUTH_KEY)==='1';
    gate.hidden=ok;
    if(ok){initAdminData();setPage('dash');}
    else{setTimeout(()=>gatePw.focus(),100);}
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo(0,0);
    requestAnimationFrame(()=>document.documentElement.style.scrollBehavior='');
  }else{
    siteView.hidden=false;adminView.hidden=true;gate.hidden=true;
    document.body.classList.remove('view-admin');
    renderProjects();
  }
}
window.addEventListener('hashchange',route);

/* ================= ШАПКА / МЕНЮ ================= */
const header=$('#header'),hero=$('#top');
function headerState(){header.classList.toggle('solid',window.scrollY>hero.offsetHeight-90);}
const burger=$('#burger'),mnav=$('#mnav');
burger.addEventListener('click',()=>{
  const open=document.body.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded',open);
  mnav.setAttribute('aria-hidden',!open);
});
 $$('#mnav a').forEach(a=>a.addEventListener('click',()=>{
  document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded','false');
}));

/* ================= СКРОЛЛ: прогресс, параллакс, таймлайн ================= */
const progress=$('#progress'),steps=$('#steps'),bandBg=$('#bandImg');
function timelineState(){
  if(!steps)return;
  const r=steps.getBoundingClientRect(),vh=window.innerHeight;
  const p=Math.min(1,Math.max(0,(vh*.82-r.top)/r.height));
  steps.style.setProperty('--p',p.toFixed(4));
  const vert=window.matchMedia('(max-width:860px)').matches;
  const edge=(vert?steps.clientHeight:steps.clientWidth)*p;
  $$('.step',steps).forEach(li=>{
    const c=vert?li.offsetTop+6:li.offsetLeft+6;
    li.classList.toggle('on',c<=edge+1);
  });
}
function parallax(){
  if(!bandBg||RM)return;
  const r=bandBg.parentElement.getBoundingClientRect();
  if(r.bottom<0||r.top>window.innerHeight)return;
  const c=r.top+r.height/2-window.innerHeight/2;
  bandBg.style.transform='translateY('+(-c*.12).toFixed(1)+'px) scale(1.05)';
}
let scheduled=false;
function onScroll(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    headerState();
    const doc=document.documentElement,max=doc.scrollHeight-window.innerHeight;
    progress.style.width=(max>0?(window.scrollY/max*100):0)+'%';
    parallax();timelineState();
  });
}
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',onScroll);

/* ================= МАГНИТНЫЕ КНОПКИ ================= */
if(FINE&&!RM)$$('[data-mag]').forEach(btn=>{
  btn.addEventListener('mousemove',e=>{
    const r=btn.getBoundingClientRect();
    const x=(e.clientX-r.left-r.width/2)*.16,y=(e.clientY-r.top-r.height/2)*.3;
    btn.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';
  });
  btn.addEventListener('mouseleave',()=>btn.style.transform='');
});

/* ================= МОБИЛЬНАЯ ПАНЕЛЬ CTA ================= */
const mbar=$('#mbar');
let heroVis=true,contactVis=false;
const mbarState=()=>mbar.classList.toggle('show',!heroVis&&!contactVis);
new IntersectionObserver(([en])=>{heroVis=en.isIntersecting;mbarState();}).observe(hero);
new IntersectionObserver(([en])=>{contactVis=en.isIntersecting;mbarState();},{threshold:.08}).observe($('#contact'));

/* ================= СКРОЛЛСПАЙ ================= */
const spyMap={};
 $$('.nav a').forEach(a=>spyMap[a.getAttribute('href').slice(1)]=a);
const spy=new IntersectionObserver(es=>es.forEach(en=>{
  const a=spyMap[en.target.id];
  if(a&&en.isIntersecting){
    $$('.nav a').forEach(x=>x.classList.remove('act'));
    a.classList.add('act');
  }
}),{rootMargin:'-40% 0px -55% 0px'});
Object.keys(spyMap).forEach(id=>{const s=document.getElementById(id);if(s)spy.observe(s);});

/* ================= ИНИЦИАЛИЗАЦИЯ ================= */
const tk=$('#tickerTrack');if(tk)tk.innerHTML+=tk.innerHTML;
['heroImg','aboutImg','bandImg'].forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('error',()=>{const fb=el.dataset.fb;if(fb&&el.src!==fb)el.src=fb;});
});
attachParallax($('#top'));
attachParallax($('.cta'));
applyCfg();
renderProjects();
stagger(document);watch(document);
guard(document);
renderLeads();
route();
headerState();timelineState();onScroll();
})();
