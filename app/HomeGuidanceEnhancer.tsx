"use client";

import { useEffect } from "react";

type Card = {
  tag: string;
  title: string;
  body: string;
};

type Guide = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  cards: Card[];
  fullTitle: string;
  sections: { title: string; body: string }[];
  note?: string;
};

const guides: Guide[] = [
  {
    id: "system-start",
    eyebrow: "Първи стъпки",
    title: "Как работи Място За Място",
    intro: "Бърз маршрут за родителите — от заявка до започване на последващи действия.",
    cards: [
      {
        tag: "01",
        title: "Настрой заявката",
        body: "Избери район, година, тип място, сегашна и желана градина. Данните се използват само за търсене на потенциално съвпадение."
      },
      {
        tag: "02",
        title: "Чакай съвпадение",
        body: "Системата търси 2/3/4-странни маршрути между родители със съвместими заявки."
      },
      {
        tag: "03",
        title: "Потвърди или откажи",
        body: "При потенциално съвпадение всички участници получават покана и трябва да потвърдят или откажат."
      },
      {
        tag: "04",
        title: "Започни преместване",
        body: "След потвърждение чатът помага на родителите да се координират и да следят прогреса по официалния ред."
      }
    ],
    fullTitle: "Първи стъпки в Място За Място",
    sections: [
      {
        title: "1. Попълваш заявка",
        body: "Започваш с район, година/набор, тип място, сегашна детска градина и желана детска градина. Тези данни помагат на системата да търси потенциални съвпадения между родители."
      },
      {
        title: "2. Системата търси потенциален цикъл",
        body: "Една заявка сама по себе си не е размяна. Нужно е да има логически цикъл — например родител А търси мястото на родител Б, а родител Б търси мястото на родител А. При повече участници може да има 3- или 4-странен маршрут."
      },
      {
        title: "3. При съвпадение заявката се деактивира",
        body: "Когато има потенциално съвпадение, заявката се деактивира до започване на последващи действия. Докато участваш в един цикъл, заявката ти е неактивна и скрита, за да не участва едновременно в други цикли на съвпадение. Участниците получават покана за потвърждение или отказ от съвпадението."
      },
      {
        title: "4. При отказ заявките се реактивират",
        body: "Ако някой участник откаже, цикълът се прекратява и заявките трябва автоматично да се реактивират за ново търсене на съвпадение. Така родителят не трябва ръчно да връща заявката си в активен режим."
      },
      {
        title: "5. Чатът помага за координация",
        body: "Чатът помага за свързване и координация на родителите при преминаването им през административните процедури по официалния ред. В него можеш да следиш какъв е прогресът на цикъла на замяна и до къде са стигнали другите родители в процеса."
      }
    ],
    note: "Не споделяй лични данни, ЕГН или документи в чата. Споделянето на лична информация е доброволно и на лична отговорност. Системата не изисква, не използва и не съхранява такъв тип данни."
  },
  {
    id: "official-transfer",
    eyebrow: "Официален ред",
    title: "Какво да направя?",
    intro: "Кратък практически маршрут след като родителите в цикъла потвърдят интерес.",
    cards: [
      {
        tag: "01",
        title: "Свържи се",
        body: "Провери условията за преместване в конкретното учебно заведение и нужните документи."
      },
      {
        tag: "02",
        title: "Подай документи",
        body: "Подай нужните документи в конкретната администрация."
      },
      {
        tag: "03",
        title: "Отбележи резултата в системата",
        body: "Честито, вече имаш своето желано място!"
      }
    ],
    fullTitle: "Какво да направя?",
    sections: [
      {
        title: "1. Свържи се с конкретното учебно заведение",
        body: "След потвърдено съвпадение първата реална стъпка е връзка с конкретната детска градина или ясла. Провери дали има приложим ред за преместване, какви документи са нужни, към кого се подават и дали има специфични изисквания за съответния случай."
      },
      {
        title: "2. Подай нужните документи",
        body: "След като получиш указания от съответната администрация, подай нужните документи по посочения ред. Процедурата и документите могат да зависят от конкретното заведение, вида място, възрастта на детето и актуалните правила."
      },
      {
        title: "3. Координация между родителите в цикъла на преместване",
        body: "При 3- и 4-странни цикли е много важно родителите да се координират ясно: кой първи подава, къде подава, кое дете към кое място преминава и как се движат стъпките в целия цикъл. Така се избягва объркване, прекъсване на веригата или ситуация, в която един родител е предприел действие, а друг още не е готов."
      },
      {
        title: "4. Отбележи резултата в Място За Място",
        body: "Когато процесът приключи успешно или отпадне, отбележи резултата в системата. Това помага заявките и циклите да останат актуални и да не блокират други потенциални съвпадения."
      }
    ],
    note: "Преди реални действия провери актуалните официални правила в съответната администрация. Не споделяй лични данни, ЕГН или документи в чата."
  }
];

function injectStyles() {
  if (document.getElementById("mzm-home-guidance-styles")) return;

  const style = document.createElement("style");
  style.id = "mzm-home-guidance-styles";
  style.textContent = `
    .mzm-guidance-root { display: grid; gap: 1.2rem; }
    .mzm-guide-block { overflow: hidden; }
    .mzm-guide-head { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; padding:0 .25rem .75rem; }
    .mzm-guide-head p { margin:0 0 .25rem; color: var(--study-orange); font-size:.68rem; font-weight:900; letter-spacing:.2em; text-transform:uppercase; }
    .mzm-guide-head h2 { margin:0; font-size:1.55rem; line-height:1.04; letter-spacing:-.055em; font-weight:900; color:#1c1b19; }
    .mzm-guide-head button { border:0; border-radius:999px; padding:.78rem 1rem; background:rgba(255,255,255,.9); color:#1c1b19; font-size:.78rem; font-weight:900; box-shadow:0 10px 22px rgba(40,34,20,.05); white-space:nowrap; flex:0 0 auto; }
    .mzm-guide-intro { margin:0 0 .8rem; padding:0 .25rem; color:rgba(28,27,25,.55); font-size:.86rem; line-height:1.45; font-weight:700; }
    .mzm-guide-carousel { display:flex; gap:.85rem; overflow-x:auto; scroll-snap-type:x mandatory; padding:.05rem .15rem 1rem; -webkit-overflow-scrolling:touch; }
    .mzm-guide-carousel::-webkit-scrollbar { display:none; }
    .mzm-guide-card { flex:0 0 78%; min-height:13rem; scroll-snap-align:start; border-radius:2rem; padding:1.15rem; background:#ecedc7; color:#1c1b19; box-shadow:0 16px 38px rgba(40,34,20,.055), inset 0 0 0 1px rgba(28,27,25,.025); position:relative; overflow:hidden; }
    .mzm-guide-block:nth-child(2) .mzm-guide-card { background:#d2e4e2; }
    .mzm-guide-card::after { content:""; position:absolute; right:-1rem; top:-1rem; width:6rem; height:6rem; border-radius:999px; background:rgba(255,255,255,.28); }
    .mzm-guide-tag { display:grid; place-items:center; width:3.1rem; height:3.1rem; border-radius:1.15rem; background:rgba(255,255,255,.75); font-size:1.1rem; font-weight:900; }
    .mzm-guide-card h3 { margin:2.2rem 0 0; font-size:1.4rem; line-height:1.08; letter-spacing:-.045em; font-weight:900; }
    .mzm-guide-card p { margin:.75rem 0 0; font-size:.9rem; line-height:1.5; font-weight:700; color:rgba(28,27,25,.62); }
    .mzm-guide-modal-backdrop { position:fixed; inset:0; z-index:9999; display:flex; align-items:flex-start; justify-content:center; padding:1rem; background:rgba(28,27,25,.42); backdrop-filter:blur(10px); overflow-y:auto; }
    .mzm-guide-modal { width:min(100%, 30rem); margin:1rem 0; border-radius:2rem; background:#fffcfa; color:#1c1b19; box-shadow:0 24px 80px rgba(28,27,25,.22); overflow:hidden; }
    .mzm-guide-modal-header { padding:1.25rem; background:linear-gradient(145deg, rgba(236,237,199,.95), rgba(255,255,255,.92)); }
    .mzm-guide-modal-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
    .mzm-guide-modal-eyebrow { margin:0 0 .45rem; font-size:.68rem; letter-spacing:.2em; text-transform:uppercase; font-weight:900; color:var(--study-orange); }
    .mzm-guide-modal h2 { margin:0; font-size:1.85rem; line-height:.98; letter-spacing:-.06em; font-weight:900; }
    .mzm-guide-modal-close { border:0; display:grid; place-items:center; width:2.6rem; height:2.6rem; border-radius:999px; background:rgba(255,255,255,.86); color:#1c1b19; font-size:1.3rem; font-weight:900; }
    .mzm-guide-modal-intro { margin:.8rem 0 0; color:rgba(28,27,25,.62); line-height:1.5; font-weight:700; }
    .mzm-guide-modal-body { padding:1.25rem; display:grid; gap:.85rem; }
    .mzm-guide-step { border-radius:1.45rem; background:rgba(247,245,239,.9); padding:1rem; }
    .mzm-guide-step h3 { margin:0; font-size:1.05rem; line-height:1.18; letter-spacing:-.03em; font-weight:900; }
    .mzm-guide-step p { margin:.5rem 0 0; color:rgba(28,27,25,.62); line-height:1.55; font-size:.92rem; font-weight:650; }
    .mzm-guide-note { border-radius:1.35rem; padding:1rem; background:#fff0e3; color:rgba(28,27,25,.7); line-height:1.5; font-size:.86rem; font-weight:800; }
  `;

  document.head.appendChild(style);
}

function openModal(guide: Guide) {
  const old = document.querySelector("[data-mzm-guide-modal='true']");
  old?.remove();

  const backdrop = document.createElement("div");
  backdrop.className = "mzm-guide-modal-backdrop";
  backdrop.dataset.mzmGuideModal = "true";

  const modal = document.createElement("div");
  modal.className = "mzm-guide-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  modal.innerHTML = `
    <div class="mzm-guide-modal-header">
      <div class="mzm-guide-modal-top">
        <div>
          <p class="mzm-guide-modal-eyebrow">${guide.eyebrow}</p>
          <h2>${guide.fullTitle}</h2>
        </div>
        <button class="mzm-guide-modal-close" type="button" aria-label="Затвори">×</button>
      </div>
      <p class="mzm-guide-modal-intro">${guide.intro}</p>
    </div>
    <div class="mzm-guide-modal-body">
      ${guide.sections.map((section) => `<article class="mzm-guide-step"><h3>${section.title}</h3><p>${section.body}</p></article>`).join("")}
      ${guide.note ? `<div class="mzm-guide-note">${guide.note}</div>` : ""}
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  modal.querySelector("button")?.addEventListener("click", close);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close();
  });
}

function createGuideBlock(guide: Guide) {
  const block = document.createElement("section");
  block.className = "mzm-guide-block";
  block.innerHTML = `
    <div class="mzm-guide-head">
      <div>
        <p>${guide.eyebrow}</p>
        <h2>${guide.title}</h2>
      </div>
      <button type="button">Виж още</button>
    </div>
    <p class="mzm-guide-intro">${guide.intro}</p>
    <div class="mzm-guide-carousel">
      ${guide.cards.map((card) => `
        <article class="mzm-guide-card">
          <div class="mzm-guide-tag">${card.tag}</div>
          <h3>${card.title}</h3>
          <p>${card.body}</p>
        </article>
      `).join("")}
    </div>
  `;

  block.querySelector("button")?.addEventListener("click", () => openModal(guide));
  return block;
}

function replaceHomeInsights() {
  injectStyles();

  const sections = Array.from(document.querySelectorAll<HTMLElement>("section"));
  const target = sections.find((section) => (section.textContent || "").includes("За теб днес"));
  if (!target || target.dataset.mzmGuidanceEnhanced === "true") return;

  target.dataset.mzmGuidanceEnhanced = "true";
  target.innerHTML = "";

  const root = document.createElement("div");
  root.className = "mzm-guidance-root";
  guides.forEach((guide) => root.appendChild(createGuideBlock(guide)));
  target.appendChild(root);
}

export default function HomeGuidanceEnhancer() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        replaceHomeInsights();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
