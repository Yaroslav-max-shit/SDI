(function(){
'use strict';
/* ================= УТИЛИТЫ ================= */
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const pic=(s,i)=>'https://picsum.photos/seed/'+s+'-'+i+'/1100/760.jpg';
if(window.lucide) lucide.createIcons();

/* ============================================================
   ПАРОЛЬ АДМИНКИ
   Сейчас пароль: sdi2024 (закодирован в base64 ниже).
   Чтобы сменить — впишите свой в кавычки и замените строку:
   const ADMIN_PASS='мой-новый-пароль';
   Помните: на статическом хостинге это «турникет», а не сейф.
============================================================ */
const ADMIN_PASS=atob('c2RpMjAyNA=='); // sdi2024

/* ================= ХРАНИЛИЩА ================= */
const PROJ_KEY='sdi_projects_v1', CFG_KEY='sdi_cfg_v1', LEADS_KEY='sdi_leads_v1', AUTH_KEY='sdi_admin_ok';

const CFG_DEFAULT={
  phone:'+7 987 123-80-24',
  email:'sdi2482@mail.ru',
  addrFull:'428023, Чувашская Республика — Чувашия, г. о. город Чебоксары, г. Чебоксары, ул. Гражданская, д. 85А, офис 1',
  addrShort:'Чебоксары, ул. Гражданская, 85А',
  hours:'Пн–Пт 8:00–18:00 · Сб — по договорённости',
  hoursShort:'Пн–Пт 8:00–18:00',
  founded:'2020', km:'214', contracts:'67', crew:'64',
  wRoad:'3 года', wNet:'5 лет', wResp:'3 рабочих дня', ins:'60 000 000 ₽',
  webhook:'',
  fleet:[
    {n:'2', t:'Асфальтоукладчики', d:'Vögele Super 1300-3i · ширина укладки до 5 м'},
    {n:'5', t:'Катки дорожные', d:'Bomag: вибрационные, пневмоколёсные, лёгкие'},
    {n:'6', t:'Экскаваторы гусеничные', d:'Hitachi ZX 130 / ZX 225 · ковш 0,5–1,2 м³'},
    {n:'3', t:'Погрузчики колёсные', d:'LiuGong 856 · ковш 3 м³'},
    {n:'12', t:'Самосвалы', d:'6×4 · 20 т · задняя разгрузка'},
    {n:'2', t:'Грейдеры', d:'Средний класс · профилирование основания'},
    {n:'1', t:'Дорожная фреза', d:'Wirtgen W 100 · холодное фрезерование'}
  ]
};
function loadJSON(key,fallback){
  try{const raw=localStorage.getItem(key);if(raw){const v=JSON.parse(raw);if(v)return v;}}catch(e){}
  return JSON.parse(JSON.stringify(fallback));
}
let cfg=loadJSON(CFG_KEY,CFG_DEFAULT);
function saveCfg(){try{localStorage.setItem(CFG_KEY,JSON.stringify(cfg))}catch(e){}}

const DEFAULTS=[
 {id:'p1',title:'Реконструкция ул. Сельхозтехники',location:'Чебоксары',scope:'3,2 км',duration:'5 мес.',year:'2023',role:'Генподряд',
  photos:[1,2,3,4,5].map(i=>pic('sdi-obj1',i)),
  challenge:'Улица с интенсивным движением и ветхими сетями: реконструкция без полного перекрытия, с заменой водопровода прямо под новой дорожной одеждой.',
  solution:'Работали в две захватки с временными объездами. Сети перенесли до начала укладки, основание усилили георешёткой. Сдали за 5 месяцев вместо проектных семи.',note:''},
 {id:'p2',title:'Подъездная дорога к промпарку «Заречный»',location:'Новочебоксарск',scope:'5,8 км',duration:'9 мес.',year:'2022–23',role:'Генподряд',
  photos:[1,2,3,4,5].map(i=>pic('sdi-obj2',i)),
  challenge:'Дорога была нужна резидентам к началу отопительного сезона. Грунты слабые — обычная насыпь дала бы осадку в первый же год эксплуатации.',
  solution:'Насыпь отсыпали карьерным грунтом с послойным уплотнением, коэффициент подтверждён лабораторией. График сжали, поставив два укладчика в одну смену.',note:''},
 {id:'p3',title:'Дворовые территории мкр. Волжский-3',location:'Чебоксары',scope:'42 000 м²',duration:'3 мес.',year:'2024',role:'Субподряд',
  photos:[1,2,3,4,5].map(i=>pic('sdi-obj3',i)),
  challenge:'Узкие дворы, припаркованные машины и люди, которым нужно жить на работающей площадке, — классический конфликт стройки и жителя.',
  solution:'Двор делили на секторы, временные парковки и переходы согласовывали заранее, укладку вели только в дневное окно. Жалоб в администрацию не поступило.',note:''},
 {id:'p4',title:'Сети водоснабжения и водоотведения, с. Ишлеи',location:'Чебоксарский район',scope:'7,4 км',duration:'6 мес.',year:'2022',role:'Субподряд',
  photos:[1,2,3,4,5].map(i=>pic('sdi-obj4',i)),
  challenge:'Стальные трубы на пределе износа, трасса идёт вдоль действующей дороги, а вскрытия в нескольких точках были невозможны.',
  solution:'Полиэтилен ПЭ100 SDR 17, проколы под проездами без вскрытия, пересечения — в защитных футлярах. Сети сданы эксплуатирующей организации с первого предъявления.',note:''},
 {id:'p5',title:'Дороги и освещение логопарка «Волга-Порт»',location:'Чебоксары',scope:'4,1 км + 96 опор',duration:'7 мес.',year:'2024',role:'Генподряд',
  photos:[1,2,3,4,5].map(i=>pic('sdi-obj5',i)),
  challenge:'Нагрузка до 40 тонн на ось и требование заказчика: освещение должно работать к запуску первого терминала — раньше чистого асфальта.',
  solution:'Усиленная конструкция: 40 см щебёночного основания и 11 см асфальтобетона в два слоя. Освещение монтировали параллельно дорожным работам — терминал запустили вовремя.',
  note:'Усиленная дорожная одежда под нагрузку 40 т на ось; наружное освещение запустили раньше чистого асфальта — к открытию первого терминала.'}
];
let projects=loadJSON(PROJ_KEY,DEFAULTS);
function saveProjects(){try{localStorage.setItem(PROJ_KEY,JSON.stringify(projects))}catch(e){}}
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

/* ================= КОНТАКТЫ И ЦИФРЫ ================= */
const fleetList=$('#fleetList');
function renderFleet(){
  const total=cfg.fleet.reduce((s,f)=>s+(parseInt(f.n,10)||0),0);
  fleetList.innerHTML=cfg.fleet.map(f=>
    '<li class="reveal"><span class="f-q mono count" data-count="'+esc(f.n)+'" data-dur="800">0</span>'
    +'<div class="f-t"><h4>'+esc(f.t)+'</h4><p>'+esc(f.d)+'</p></div></li>').join('')
    +'<li class="f-total reveal"><span class="f-q mono count" data-count="'+total+'" data-dur="1000">0</span>'
    +'<div class="f-t"><h4>Единица техники — в собственности</h4><p>Без аренды, субаренды и чужих графиков.</p></div></li>';
  stagger(fleetList);watch(fleetList);observeCounts(fleetList);
}
function applyCfg(){
  const telHref='tel:'+String(cfg.phone).replace(/[^+\d]/g,'');
  const mailHref='mailto:'+cfg.email;
  const yearsActive=Math.max(1,(new Date().getFullYear()-(parseInt(cfg.founded,10)||2020)));
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
      case 'km':v=cfg.km;break;
      case 'contracts':v=cfg.contracts;break;
      case 'crew':v=cfg.crew;break;
      case 'wRoad':v=cfg.wRoad;break;
      case 'wNet':v=cfg.wNet;break;
      case 'wResp':v=cfg.wResp;break;
      case 'ins':v=cfg.ins;break;
      case 'wBoth':v=cfg.wRoad+' / '+cfg.wNet;break;
      case 'yearsActive':v=yearsActive;break;
      case 'phoneHref':el.setAttribute('href',telHref);return;
      case 'emailHref':el.setAttribute('href',mailHref);return;
    }
    if(el.hasAttribute('data-count')){
      el.dataset.count=v;
      el.textContent=el.dataset.done?v:'0';
    }else{el.textContent=v;}
  });
  renderFleet();
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
    const img=(p.photos&&p.photos[0])||pic('sdi-x'+i,1);
    const note=s==='wide'?(p.note||firstSentence(p.challenge)):'';
    return '<article class="proj '+s+' reveal" data-idx="'+i+'" tabindex="0" role="button" aria-label="Открыть проект: '+esc(p.title)+'">'
      +'<div class="proj-media"><img src="'+esc(img)+'" alt="'+esc(p.title)+'" loading="lazy" width="1100" height="760" decoding="async">'
      +(p.role?'<span class="proj-role">'+esc(p.role)+'</span>':'')+'</div>'
      +'<div class="proj-body"><div><h3>'+esc(p.title)+'</h3>'
      +(meta?'<p class="proj-meta">'+esc(meta)+'</p>':'')
      +(note?'<p class="proj-note">'+esc(note)+'</p>':'')+'</div>'
      +'<span class="proj-arr"><i data-lucide="arrow-up-right"></i></span></div></article>';
  }).join('');
  lucide.createIcons();
  stagger(projGrid);watch(projGrid);
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
function setPhoto(i){
  const photos=projects[cur].photos||[];
  const n=photos.length;if(!n)return;
  curIdx=(i+n)%n;
  $$('.lb-thumb',lbThumbs).forEach((t,ti)=>t.classList.toggle('act',ti===curIdx));
  lbCount.textContent=(curIdx+1)+' / '+n;
  lbImg.classList.remove('ready');
  lbImg.src=photos[curIdx];
  lbImg.alt=(projects[cur].title||'Проект')+' — фото '+(curIdx+1);
}
function renderLb(){
  const p=projects[cur];
  lbTitle.textContent=p.title||'Без названия';
  lbMeta.textContent=[p.location,p.scope,p.duration,p.year].filter(Boolean).join(' · ')+' · '+(p.role||'');
  lbIdx.textContent='Проект '+String(cur+1).padStart(2,'0')+' / '+String(projects.length).padStart(2,'0');
  let html='';
  if(p.challenge)html+='<div class="lb-block"><span class="lb-k"><i data-lucide="crosshair"></i>Задача</span><p>'+esc(p.challenge)+'</p></div>';
  if(p.challenge&&p.solution)html+='<div class="lb-link" aria-hidden="true"><span class="lb-line"></span><i data-lucide="arrow-down"></i><span class="lb-line"></span></div>';
  if(p.solution)html+='<div class="lb-block lb-sol"><span class="lb-k"><i data-lucide="wrench"></i>Решение</span><p>'+esc(p.solution)+'</p></div>';
  lbFlow.innerHTML=html;
  const photos=p.photos||[];
  lbThumbs.innerHTML=photos.map((u,i)=>
    '<button class="lb-thumb'+(i===0?' act':'')+'" data-i="'+i+'" aria-label="Фото '+(i+1)+'">'
    +'<img src="'+esc(u)+'" alt="" loading="lazy" width="180" height="130"></button>').join('');
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

/* ================= АДМИНКА ================= */
const siteView=$('#view-site'),adminView=$('#view-admin'),gate=$('#gate');
const admList=$('#admList'),admCount=$('#admCount'),admForm=$('#admForm'),
      admPhotos=$('#admPhotos'),admFormTitle=$('#admFormTitle'),admSave=$('#admSave');
const aTitle=$('#a-title'),aLoc=$('#a-loc'),aScope=$('#a-scope'),aDur=$('#a-dur'),
      aYear=$('#a-year'),aRole=$('#a-role'),aNote=$('#a-note'),aCh=$('#a-ch'),aSol=$('#a-sol');
let editingId=null;
const randomPhoto=()=>'https://picsum.photos/seed/sdi-'+Math.random().toString(36).slice(2,8)+'/1100/760.jpg';

function armConfirm(btn,txt){
  btn.classList.add('confirm');btn.textContent='Точно?';
  setTimeout(()=>{if(btn.isConnected){btn.classList.remove('confirm');btn.textContent=txt;}},2600);
}
function scrollForm(){
  if(window.innerWidth<=1020)$('#admFormWrap').scrollIntoView({behavior:'smooth',block:'start'});
}

/* ---- проекты: форма ---- */
function addPhotoRow(url){
  const row=document.createElement('div');row.className='ph-row';
  row.innerHTML='<img class="ph-prev" alt="" src="'+esc(url||'')+'">'
    +'<input class="ph-url" type="text" placeholder="https:// — ссылка на фото" value="'+esc(url||'')+'">'
    +'<button type="button" class="ph-btn ph-dice" title="Случайное фото" aria-label="Случайное фото"><i data-lucide="dices"></i></button>'
    +'<button type="button" class="ph-btn ph-del" title="Убрать фото" aria-label="Убрать фото"><i data-lucide="x"></i></button>';
  const prev=$('.ph-prev',row);
  prev.style.visibility=url?'visible':'hidden';
  prev.onerror=()=>prev.style.visibility='hidden';
  admPhotos.appendChild(row);lucide.createIcons();
}
admPhotos.addEventListener('click',e=>{
  const row=e.target.closest('.ph-row');if(!row)return;
  if(e.target.closest('.ph-dice')){
    const u=randomPhoto();
    $('.ph-url',row).value=u;
    const prev=$('.ph-prev',row);prev.src=u;prev.style.visibility='visible';
  }
  if(e.target.closest('.ph-del'))row.remove();
});
admPhotos.addEventListener('change',e=>{
  if(!e.target.classList.contains('ph-url'))return;
  const prev=$('.ph-prev',e.target.closest('.ph-row'));
  const v=e.target.value.trim();
  prev.style.visibility=v?'visible':'hidden';
  if(v)prev.src=v;
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
  saveProjects();renderAdminList();renderProjects();toast(msg);
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
  commitProjects('');resetForm();
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
      +'<img class="adm-thumb" src="'+esc((p.photos&&p.photos[0])||'')+'" alt="">'
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
function renderLeads(){
  const sorted=[...leads].sort((a,b)=>b.ts-a.ts);
  const nNew=leads.filter(l=>l.status==='new').length;
  leadBadge.textContent=nNew;leadBadge.hidden=nNew===0;
  leadTotal.textContent=leads.length;leadNew.textContent=nNew;
  if(!sorted.length){leadList.innerHTML='<p class="adm-empty">Заявок пока нет. Отправьте тестовую с формы на сайте.</p>';return;}
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
    saveLeads();renderLeads();
  }else{
    if(!btn.classList.contains('confirm'))armConfirm(btn,'Удалить');
    else{leads.splice(i,1);saveLeads();renderLeads();toast('Заявка удалена');}
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
  leads=[];saveLeads();renderLeads();
  leadClear.textContent='Очистить всё';leadClear.classList.remove('btn-primary');leadsArmed=false;
  toast('Все заявки удалены');
});

/* ---- настройки: цифры и контакты ---- */
const cfgFleetList=$('#cfgFleetList');
function cfgFleetRow(f){
  const row=document.createElement('div');row.className='f-row';
  row.innerHTML='<input class="n mono" type="text" inputmode="numeric" value="'+esc(f.n)+'" aria-label="Количество" placeholder="2">'
    +'<input class="name" type="text" value="'+esc(f.t)+'" aria-label="Тип техники" placeholder="Тип техники">'
    +'<input class="spec" type="text" value="'+esc(f.d)+'" aria-label="Модели" placeholder="Модели / параметры">'
    +'<button type="button" class="ph-btn cf-del" aria-label="Убрать строку"><i data-lucide="x"></i></button>';
  return row;
}
function fillCfgForm(){
  $('#s-phone').value=cfg.phone;$('#s-email').value=cfg.email;
  $('#s-addrFull').value=cfg.addrFull;$('#s-addrShort').value=cfg.addrShort;
  $('#s-hours').value=cfg.hours;
  $('#s-founded').value=cfg.founded;$('#s-km').value=cfg.km;
  $('#s-contracts').value=cfg.contracts;$('#s-crew').value=cfg.crew;
  $('#s-wRoad').value=cfg.wRoad;$('#s-wNet').value=cfg.wNet;
  $('#s-wResp').value=cfg.wResp;$('#s-ins').value=cfg.ins;
  $('#s-webhook').value=cfg.webhook||'';
  cfgFleetList.innerHTML='';
  cfg.fleet.forEach(f=>cfgFleetList.appendChild(cfgFleetRow(f)));
  lucide.createIcons();
}
cfgFleetList.addEventListener('click',e=>{
  const b=e.target.closest('.cf-del');
  if(b&&cfgFleetList.children.length>1)b.closest('.f-row').remove();
});
 $('#cfgAddFleet').addEventListener('click',()=>{
  cfgFleetList.appendChild(cfgFleetRow({n:'',t:'',d:''}));lucide.createIcons();
});
 $('#cfgForm').addEventListener('submit',e=>{
  e.preventDefault();
  const phone=$('#s-phone').value.trim(),email=$('#s-email').value.trim();
  if(!phone||!email){toast('Телефон и e-mail обязательны');return;}
  cfg={
    phone:phone,email:email,
    addrFull:$('#s-addrFull').value.trim()||CFG_DEFAULT.addrFull,
    addrShort:$('#s-addrShort').value.trim()||CFG_DEFAULT.addrShort,
    hours:$('#s-hours').value.trim()||CFG_DEFAULT.hours,
    hoursShort:($('#s-hours').value.trim()||CFG_DEFAULT.hours).split('·')[0].trim(),
    founded:$('#s-founded').value.trim()||'2020',
    km:$('#s-km').value.trim()||'0',
    contracts:$('#s-contracts').value.trim()||'0',
    crew:$('#s-crew').value.trim()||'0',
    wRoad:$('#s-wRoad').value.trim()||CFG_DEFAULT.wRoad,
    wNet:$('#s-wNet').value.trim()||CFG_DEFAULT.wNet,
    wResp:$('#s-wResp').value.trim()||CFG_DEFAULT.wResp,
    ins:$('#s-ins').value.trim()||CFG_DEFAULT.ins,
    webhook:$('#s-webhook').value.trim(),
    fleet:$$('.f-row',cfgFleetList).map(r=>({
      n:$('.n',r).value.trim()||'0',
      t:$('.name',r).value.trim(),
      d:$('.spec',r).value.trim()
    })).filter(f=>f.t)
  };
  if(!cfg.fleet.length)cfg.fleet=JSON.parse(JSON.stringify(CFG_DEFAULT.fleet));
  saveCfg();applyCfg();toast('Настройки применены — цифры обновлены на сайте');
});
const cfgReset=$('#cfgReset');let cfgArmed=false;
cfgReset.addEventListener('click',()=>{
  if(!cfgArmed){cfgArmed=true;cfgReset.textContent='Да, сбросить всё?';cfgReset.classList.add('btn-primary');
    setTimeout(()=>{cfgArmed=false;cfgReset.textContent='Сбросить к исходным';cfgReset.classList.remove('btn-primary');},3000);
    return;}
  cfg=JSON.parse(JSON.stringify(CFG_DEFAULT));
  saveCfg();applyCfg();fillCfgForm();
  cfgReset.textContent='Сбросить к исходным';cfgReset.classList.remove('btn-primary');cfgArmed=false;
  toast('Цифры и контакты восстановлены');
});

/* ---- экспорт данных (для публикации) ---- */
 $('#admExport').addEventListener('click',()=>{
  const data={projects:projects,cfg:cfg};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download='sdi-data.json';a.click();URL.revokeObjectURL(a.href);
  toast('Файл скачан — вставьте данные в script.js');
});

/* ---- вкладки ---- */
 $$('.admin-tabs button').forEach(b=>b.addEventListener('click',()=>{
  $$('.admin-tabs button').forEach(x=>x.classList.toggle('act',x===b));
  $$('.admin-tab').forEach(t=>t.classList.toggle('act',t.id==='tab-'+b.dataset.tab));
  if(b.dataset.tab==='leads')renderLeads();
  if(b.dataset.tab==='settings')fillCfgForm();
}));

/* ---- вход / выход ---- */
const gateForm=$('#gateForm'),gatePw=$('#gatePw');
gateForm.addEventListener('submit',e=>{
  e.preventDefault();
  if(gatePw.value===ADMIN_PASS){
    sessionStorage.setItem(AUTH_KEY,'1');
    gatePw.value='';gate.classList.remove('bad');
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
function route(){
  const isAdmin=isAdminRoute();
  if(isAdmin){
    siteView.hidden=true;adminView.hidden=false;
    document.body.classList.add('view-admin');
    const ok=sessionStorage.getItem(AUTH_KEY)==='1';
    gate.hidden=ok;
    if(ok){renderAdminList();}
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
const progress=$('#progress'),steps=$('#steps'),bandBg=$('.band-bg');
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
if(!RM)$$('[data-mag]').forEach(btn=>{
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
applyCfg();
renderProjects();
stagger(document);watch(document);
renderLeads();
route();
headerState();timelineState();onScroll();
})();
