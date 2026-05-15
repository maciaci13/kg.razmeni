(()=>{
  const STYLE_ID='mzm-guidance-patch-style';
  const norm=(el)=>(el?.textContent||'').replace(/\s+/g,' ').trim();

  const firstCards=[
    ['01','Пусни<br>заявка','Избери район, набор, тип място, сегашна и желана градина.','green'],
    ['02','Получи<br>съвпадение','Системата търси маршрути за съвместна размяна.','blue'],
    ['03','Потвърди<br>интерес','При съвпадение потвърди и се свържи с другите родители в чат.','sand'],
    ['04','Започни<br>преместване','Започни действия по официалния ред и следи прогреса.','lav']
  ];

  const firstPopup=[
    ['01','Пусни заявка','Започваш с район, година/набор, тип място, сегашна и желана детска градина. Можеш да имаш повече от една активна заявка за различни детски заведения едновременно. Тези данни помагат на системата да търси потенциални съвпадения между родители. Може лесно да следиш къде има активно търсене и да се ориентираш по-добре в избора си с нашия Радар за шанс.'],
    ['02','Системата търси потенциален цикъл','Една заявка сама по себе си не е размяна. Нужно е да има логически маршрут — например родител А търси мястото на родител Б, а родител Б търси мястото на родител А. При повече участници може да има 3- или 4-странен маршрут.'],
    ['03','Потвърди интерес','Когато има съвпадение, получаваш покана. Потвърждението показва интерес за координация, но не е официален резултат и не гарантира преместване.'],
    ['04','Говорете в чата','Чатът помага на родителите да се свържат, да уточнят готовността си и да следят кой на какъв етап е.'],
    ['05','Започнете официалните действия','Когато всички са готови, преминавате към действия по официалния ред. Системата помага да следите напредъка на всички страни, да отбелязвате своя и да останете свързани през целия процес.'],
    ['06','При отказ заявките се реактивират','Ако участник откаже, цикълът се прекратява и заявките могат да се върнат към ново търсене. Така не губиш мястото си в процеса и не започваш от нулата.']
  ];

  const officialPopup=[
    ['01','Свържи се с конкретното учебно заведение','След потвърдено съвпадение първата реална стъпка е връзка с конкретната детска градина или ясла. Провери дали има приложим ред за преместване, какви документи са нужни, към кого се подават и дали има специфични изисквания за съответния случай.'],
    ['02','Подай нужните документи','След като получиш указания от съответната администрация, подай нужните документи по посочения ред. Процедурата и документите могат да варират спрямо конкретното заведение, вида място, възрастта на детето и актуалните правила.'],
    ['03','Координация между родителите в цикъла на преместване','При 3- и 4-странни цикли е много важно родителите да се координират ясно: кой първи подава, къде подава, кое дете към кое място преминава и как се движат стъпките в целия цикъл. Така се избягва объркване, прекъсване на веригата или ситуация, в която един родител е предприел действие, а друг още не е готов.'],
    ['04','Отбележи резултата в Място За Място','Когато процесът приключи успешно или отпадне, отбележи резултата в системата. Това помага заявките и циклите да останат актуални и да не блокират други потенциални съвпадения.']
  ];

  function injectStyles(){
    let s=document.getElementById(STYLE_ID);
    if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}
    s.textContent=`
      .mzm-first-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin:0 0 24px!important}
      .mzm-first-card{min-height:168px!important;border-radius:28px!important;padding:14px!important;border:1px solid rgba(255,255,255,.9)!important;box-shadow:0 14px 34px rgba(80,54,35,.08)!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;overflow:hidden!important}
      .mzm-first-card.green{background:linear-gradient(145deg,#eff5e5,#dfe8cf)!important}.mzm-first-card.blue{background:linear-gradient(145deg,#e8f3f6,#c5dce8)!important}.mzm-first-card.sand{background:linear-gradient(145deg,#f5f0e8,#ede5d4)!important}.mzm-first-card.lav{background:linear-gradient(145deg,#eeeaf6,#d5cce8)!important}
      .mzm-first-num{width:52px!important;height:52px!important;border-radius:18px!important;display:grid!important;place-items:center!important;background:linear-gradient(145deg,#fff,#f6eee8)!important;border:1px solid #fff!important;box-shadow:0 10px 24px rgba(80,54,35,.08)!important;font-family:Manrope,sans-serif!important;font-size:24px!important;font-weight:500!important;line-height:1!important;letter-spacing:-.05em!important;color:#211712!important;margin-bottom:14px!important}
      .mzm-first-title{font-family:Manrope,sans-serif!important;font-size:17px!important;font-weight:900!important;line-height:1.08!important;letter-spacing:-.055em!important;color:#211712!important;margin:0!important}
      .mzm-first-sub{font-family:Onest,sans-serif!important;font-size:11px!important;line-height:1.28!important;color:#7b6e67!important;margin:7px 0 0!important}
      .mzm-guide-more{border:0!important;background:transparent!important;color:#8b5f47!important;font-family:Manrope,sans-serif!important;font-size:14px!important;line-height:1!important;font-weight:800!important;padding:0!important;box-shadow:none!important;letter-spacing:-.025em!important;text-transform:none!important}
      .mzm-modal{position:fixed!important;inset:0!important;z-index:99999!important;display:none!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(33,23,18,.28)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important}.mzm-modal.on{display:flex!important}
      .mzm-modal-card{width:min(100%,410px)!important;max-height:86vh!important;overflow:auto!important;border-radius:34px!important;background:linear-gradient(145deg,rgba(255,255,255,.97),rgba(250,248,242,.94))!important;border:1px solid rgba(255,255,255,.92)!important;box-shadow:0 28px 80px rgba(33,23,18,.24)!important;padding:22px!important;position:relative!important}
      .mzm-modal-close{position:absolute!important;right:18px!important;top:18px!important;width:42px!important;height:42px!important;border-radius:18px!important;border:0!important;background:#fff!important;color:#5a4039!important;font-family:Manrope,sans-serif!important;font-size:24px!important;font-weight:900!important;box-shadow:0 12px 28px rgba(80,54,35,.08)!important}
      .mzm-modal-kicker{font-family:Manrope,sans-serif!important;font-size:11px!important;font-weight:900!important;letter-spacing:.24em!important;text-transform:uppercase!important;color:#ff8a3d!important}.mzm-modal-title{margin-top:10px!important;font-family:Manrope,sans-serif!important;font-size:30px!important;line-height:.98!important;font-weight:900!important;letter-spacing:-.06em!important;color:#211712!important;max-width:280px!important}.mzm-modal-intro{margin:14px 0 0!important;font-family:Onest,sans-serif!important;font-size:15px!important;line-height:1.48!important;color:#7b6e67!important;max-width:310px!important}
      .mzm-modal-list{display:grid!important;gap:10px!important;margin-top:20px!important}.mzm-modal-item{display:grid!important;grid-template-columns:46px 1fr!important;gap:12px!important;padding:14px!important;border-radius:24px!important;background:rgba(255,255,255,.7)!important;border:1px solid rgba(255,255,255,.86)!important;box-shadow:0 12px 30px rgba(80,54,35,.07)!important}.mzm-modal-num{width:46px!important;height:46px!important;border-radius:17px!important;display:grid!important;place-items:center!important;background:linear-gradient(145deg,#fff,#f6eee8)!important;font-family:Manrope,sans-serif!important;font-size:18px!important;font-weight:800!important;color:#211712!important}.mzm-modal-item h3{font-family:Manrope,sans-serif!important;font-size:16px!important;line-height:1.12!important;font-weight:900!important;letter-spacing:-.045em!important;color:#211712!important;margin:0!important}.mzm-modal-item p{font-family:Onest,sans-serif!important;font-size:13px!important;line-height:1.46!important;color:#71645e!important;margin:6px 0 0!important}.mzm-modal-note{margin-top:14px!important;border-radius:24px!important;background:rgba(255,138,61,.10)!important;border:1px solid rgba(255,138,61,.16)!important;padding:14px!important;font-family:Onest,sans-serif!important;font-size:13px!important;line-height:1.45!important;color:#5a4039!important}.mzm-modal-note b{color:#ff8a3d!important}
      .mzm-official-row{display:flex!important;align-items:flex-start!important;gap:18px!important;padding:18px 0!important;border-top:1px solid rgba(91,73,61,.12)!important}.mzm-official-row:first-of-type{border-top:0!important;padding-top:0!important}.mzm-official-row .mini-num{width:44px!important;height:44px!important;min-width:44px!important;border-radius:16px!important;display:grid!important;place-items:center!important;background:linear-gradient(145deg,#fff,#f8f2ee)!important;border:1px solid rgba(255,255,255,.8)!important;box-shadow:0 10px 24px rgba(80,54,35,.08)!important;font-family:Manrope,sans-serif!important;font-size:15px!important;font-weight:500!important;line-height:1!important;color:#211712!important}.mzm-official-row b{display:block!important;font-family:Manrope,sans-serif!important;font-size:15.5px!important;font-weight:900!important;line-height:1.08!important;letter-spacing:-.04em!important;color:#211712!important;margin:0!important}.mzm-official-row p{font-family:Onest,sans-serif!important;font-size:12.5px!important;line-height:1.34!important;color:#766a62!important;margin:5px 0 0!important}.mzm-official-card-clean{padding:20px!important}
    `;
  }

  function sectionByTitle(text){return [...document.querySelectorAll('.section-title')].find(el=>norm(el).includes(text));}
  function makeModal(kind){
    const official=kind==='official';
    const list=official?officialPopup:firstPopup;
    return `<div class="mzm-modal" data-mzm-modal="${kind}"><div class="mzm-modal-card"><button class="mzm-modal-close">×</button><div class="mzm-modal-kicker">${official?'Официален ред':'Първи стъпки'}</div><div class="mzm-modal-title">${official?'Какво да направя?':'Как работи<br>Място За Място'}</div><p class="mzm-modal-intro">${official?'Кратък практически маршрут след като родителите в цикъла потвърдят интерес.':'Бърз маршрут за родителите — от пускане на заявка до координация и следващи официални действия.'}</p><div class="mzm-modal-list">${list.map(([n,t,b])=>`<article class="mzm-modal-item"><div class="mzm-modal-num">${n}</div><div><h3>${t}</h3><p>${b}</p></div></article>`).join('')}</div><div class="mzm-modal-note"><b>Важно:</b> ${official?'Преди реални действия провери актуалните официални правила в съответната администрация. Не споделяй лични данни, ЕГН или документи в чата.':'Място За Място не извършва официално преместване. Платформата помага да откриеш потенциална размяна и да се координираш с другите родители.'}</div></div></div>`;
  }
  function ensureModal(kind){
    document.querySelectorAll(`[data-mzm-modal="${kind}"]`).forEach(el=>el.remove());
    document.body.insertAdjacentHTML('beforeend',makeModal(kind));
    const modal=document.querySelector(`[data-mzm-modal="${kind}"]`);
    modal?.querySelector('.mzm-modal-close')?.addEventListener('click',()=>modal.classList.remove('on'));
    modal?.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('on')});
  }
  function wireMore(title,kind){
    const more=[...title.querySelectorAll('button,a,span,div')].find(el=>norm(el).includes('Виж'))||title.querySelector('.see');
    if(more){more.textContent='Виж още';more.className='see mzm-guide-more';more.onclick=e=>{e.preventDefault();document.querySelector(`[data-mzm-modal="${kind}"]`)?.classList.add('on')}}
  }
  function patchFirst(){
    const title=sectionByTitle('Първи стъпки'); if(!title) return;
    ensureModal('first'); wireMore(title,'first');
    let node=title.nextElementSibling;
    while(node){const next=node.nextElementSibling, txt=norm(node); if(node.classList?.contains('section-title')||txt.includes('Официален ред')) break; if(txt.includes('Настрой заявката')||txt.includes('Чакай системата')||txt.includes('Потвърди интерес')||txt.includes('Пусни заявка')||node.classList?.contains('mzm-first-grid')) node.remove(); node=next;}
    const grid=document.createElement('div'); grid.className='mzm-first-grid';
    grid.innerHTML=firstCards.map(([n,t,b,c])=>`<article class="mzm-first-card ${c}"><div class="mzm-first-num">${n}</div><h3 class="mzm-first-title">${t}</h3><p class="mzm-first-sub">${b}</p></article>`).join('');
    title.insertAdjacentElement('afterend',grid);
  }
  function patchOfficial(){
    const title=sectionByTitle('Официален ред'); if(!title) return;
    ensureModal('official'); wireMore(title,'official');
    let node=title.nextElementSibling, card=null;
    while(node){const next=node.nextElementSibling, txt=norm(node); if(node.classList?.contains('section-title')) break; if(txt.includes('КАКВО ДА НАПРАВЯ')||txt.includes('Свържи се')||txt.includes('Подай документи')||txt.includes('Отбележи резултата')){ if(!card) card=node; else node.remove(); } node=next;}
    if(!card) return;
    card.classList.add('mzm-official-card-clean');
    card.innerHTML=`<div class="eyebrow">КАКВО ДА НАПРАВЯ?</div><div class="mzm-official-row"><span class="mini-num">01</span><div><b>Свържи се</b><p>Провери условията за преместване в конкретното учебно заведение.</p></div></div><div class="mzm-official-row"><span class="mini-num">02</span><div><b>Подай документи</b><p>Подай необходимите документи в конкретното заведение.</p></div></div><div class="mzm-official-row"><span class="mini-num">03</span><div><b>Отбележи резултата</b><p>Честито, вече имаш своето желано място!</p></div></div>`;
  }
  function run(){injectStyles();patchFirst();patchOfficial();let i=0;const timer=setInterval(()=>{injectStyles();patchFirst();patchOfficial();if(++i>60)clearInterval(timer)},150)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();