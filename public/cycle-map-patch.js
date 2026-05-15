(() => {
  const STYLE_ID = 'mzm-cycle-map-clean-style';
  const WIDGET_ID = 'mzm-cycle-map-widget';

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .mzm-cycle-hidden{display:none!important}
      .mzm-cycle-map-shell{margin:18px 0 20px;position:relative;z-index:2}
      .mzm-cycle-map-tabs{height:51px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;padding:5px;border-radius:999px;background:rgba(235,229,221,.72);box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 12px 24px rgba(80,54,35,.07);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      .mzm-cycle-map-tab{border:0;border-radius:999px;background:transparent;color:#a0948e;font:800 13px/1 Manrope,system-ui,sans-serif;letter-spacing:-.03em}
      .mzm-cycle-map-tab.is-active{background:#fff;color:#211712;box-shadow:0 8px 18px rgba(80,54,35,.09)}
      .mzm-cycle-map-stage{position:relative;height:390px;margin-top:14px;overflow:visible;background:transparent;border-radius:0}
      .mzm-cycle-map-panel{display:none;position:absolute;inset:0;overflow:visible}
      .mzm-cycle-map-panel.is-active{display:block}
      .mzm-cycle-map-svg{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:visible}
      .mzm-cycle-map-route{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:6;stroke-dasharray:2 16}
      .mzm-cycle-map-route.orange{stroke:#ff8a3d}.mzm-cycle-map-route.green{stroke:#86a95a}.mzm-cycle-map-route.purple{stroke:#8f6fd2}.mzm-cycle-map-route.blue{stroke:#78abc5}
      .mzm-cycle-map-node{position:absolute;z-index:3;width:54px;height:54px;border-radius:999px;transform:translate(-50%,-50%);display:grid;place-items:center;background:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.95);box-shadow:0 13px 28px rgba(80,54,35,.1);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}
      .mzm-cycle-map-node:before{content:'';width:18px;height:18px;border-radius:999px;background:var(--node-color);box-shadow:0 0 0 7px rgba(255,255,255,.92),0 6px 12px rgba(80,54,35,.09)}
      .mzm-cycle-map-label{position:absolute;z-index:4;transform:translate(-50%,-50%);min-width:118px;max-width:170px;padding:8px 11px;border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 12px 24px rgba(80,54,35,.1);font:800 12px/1.08 Manrope,system-ui,sans-serif;letter-spacing:-.035em;text-align:center;color:#211712}
      .two .n1{left:28%;top:26%;--node-color:#ff8a3d}.two .n2{left:72%;top:68%;--node-color:#86a95a}.two .l1{left:28%;top:10%}.two .l2{left:72%;top:84%}
      .three .n1{left:28%;top:22%;--node-color:#ff8a3d}.three .n2{left:72%;top:43%;--node-color:#86a95a}.three .n3{left:38%;top:74%;--node-color:#8f6fd2}.three .l1{left:28%;top:7%}.three .l2{left:72%;top:28%}.three .l3{left:38%;top:91%}
      .four .n1{left:25%;top:18%;--node-color:#ff8a3d}.four .n2{left:73%;top:30%;--node-color:#86a95a}.four .n3{left:69%;top:67%;--node-color:#78abc5}.four .n4{left:30%;top:73%;--node-color:#8f6fd2}.four .l1{left:28%;top:5%}.four .l2{left:70%;top:16%}.four .l3{left:76%;top:82%}.four .l4{left:24%;top:89%}
    `;
    document.head.appendChild(style);
  }

  function widgetHtml() {
    return `<div id="${WIDGET_ID}" class="mzm-cycle-map-shell">
      <div class="mzm-cycle-map-tabs"><button class="mzm-cycle-map-tab" data-cycle="two">2 страни</button><button class="mzm-cycle-map-tab is-active" data-cycle="three">3 страни</button><button class="mzm-cycle-map-tab" data-cycle="four">4 страни</button></div>
      <div class="mzm-cycle-map-stage">
        <div class="mzm-cycle-map-panel two" data-panel="two"><svg class="mzm-cycle-map-svg" viewBox="0 0 430 390"><path class="mzm-cycle-map-route orange" d="M120 104 C220 112 292 185 310 265"/><path class="mzm-cycle-map-route green" d="M310 265 C218 292 142 215 120 104"/></svg><div class="mzm-cycle-map-label l1">ДГ 25 „Слънчеви лъчи“</div><div class="mzm-cycle-map-label l2">ДГ 30 „Дъга“ — Център</div><div class="mzm-cycle-map-node n1"></div><div class="mzm-cycle-map-node n2"></div></div>
        <div class="mzm-cycle-map-panel three is-active" data-panel="three"><svg class="mzm-cycle-map-svg" viewBox="0 0 430 390"><path class="mzm-cycle-map-route orange" d="M112 92 C164 140 250 142 318 180"/><path class="mzm-cycle-map-route green" d="M318 180 C270 275 196 268 154 324"/><path class="mzm-cycle-map-route purple" d="M154 324 C82 275 66 155 112 92"/></svg><div class="mzm-cycle-map-label l1">ДГ 25 „Слънчеви лъчи“</div><div class="mzm-cycle-map-label l2">ДГ 30 „Дъга“ — филиал Изток</div><div class="mzm-cycle-map-label l3">ДГ 184 „Мечо Пух“ — ясла</div><div class="mzm-cycle-map-node n1"></div><div class="mzm-cycle-map-node n2"></div><div class="mzm-cycle-map-node n3"></div></div>
        <div class="mzm-cycle-map-panel four" data-panel="four"><svg class="mzm-cycle-map-svg" viewBox="0 0 430 390"><path class="mzm-cycle-map-route orange" d="M105 80 C174 90 248 94 318 130"/><path class="mzm-cycle-map-route green" d="M318 130 C345 210 330 260 300 312"/><path class="mzm-cycle-map-route blue" d="M300 312 C222 342 160 340 118 320"/><path class="mzm-cycle-map-route purple" d="M118 320 C74 238 72 156 105 80"/></svg><div class="mzm-cycle-map-label l1">ДГ 25 „Слънчеви лъчи“</div><div class="mzm-cycle-map-label l2">ДГ 30 „Дъга“ — Център</div><div class="mzm-cycle-map-label l3">ДГ 76 „Сърничка“ — Борово</div><div class="mzm-cycle-map-label l4">ДГ 184 „Мечо Пух“ — ясла</div><div class="mzm-cycle-map-node n1"></div><div class="mzm-cycle-map-node n2"></div><div class="mzm-cycle-map-node n3"></div><div class="mzm-cycle-map-node n4"></div></div>
      </div>
    </div>`;
  }

  function initTabs(root) {
    root.querySelectorAll('.mzm-cycle-map-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.cycle;
        root.querySelectorAll('.mzm-cycle-map-tab').forEach(t => t.classList.toggle('is-active', t === tab));
        root.querySelectorAll('.mzm-cycle-map-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
      });
    });
  }

  function textOf(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  function renameButtons() {
    Array.from(document.querySelectorAll('button')).forEach((button) => {
      if (textOf(button) === 'Не мога') button.textContent = 'Отказвам';
    });
  }

  function hideStatusParts() {
    Array.from(document.querySelectorAll('h1,h2,h3,p,span,div')).forEach((el) => {
      if (textOf(el) === 'Верига и статуси') el.classList.add('mzm-cycle-hidden');
    });

    const routeItems = Array.from(document.querySelectorAll('article, section, div')).filter((el) => {
      if (el.id === WIDGET_ID || el.closest(`#${WIDGET_ID}`)) return false;
      const text = textOf(el);
      return text.includes('Очаква потвърждение') && text.includes('ДГ №25 Изворче') && text.length < 220;
    });

    routeItems.forEach((el) => el.classList.add('mzm-cycle-hidden'));
  }

  function patch() {
    addStyles();
    renameButtons();
    hideStatusParts();

    if (document.getElementById(WIDGET_ID)) return;

    const candidates = Array.from(document.querySelectorAll('section, div')).filter((el) => {
      const text = textOf(el);
      return /pending_confirmation/i.test(text) && /цикъл намерен/i.test(text) && /Банкя/i.test(text);
    });

    if (!candidates.length) return;

    const card = candidates.sort((a, b) => textOf(a).length - textOf(b).length)[0];

    card.insertAdjacentHTML('beforebegin', widgetHtml());
    card.classList.add('mzm-cycle-hidden');

    const widget = document.getElementById(WIDGET_ID);
    if (widget) initTabs(widget);
  }

  const run = () => {
    patch();
    setTimeout(patch, 100);
    setTimeout(patch, 500);
    setTimeout(patch, 1000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
