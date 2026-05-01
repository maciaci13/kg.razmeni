import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import "./globals.css";

const sofiaSans = Sofia_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sofia-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "МястоЗаМясто",
  description: "Безплатна платформа за потенциални съвпадения между родители за детски градини."
};

const requestFormEnhancerScript = String.raw`
(() => {
  const PREF_KEY = "mzm.profile.defaults.v1";
  const COLLAPSE_KEY = "mzm.request.form.collapsed.v1";
  const GROUPS = [
    ["2023", "Яслена група / набор 2023"],
    ["2022", "Първа група / набор 2022"],
    ["2021", "Втора група / набор 2021"],
    ["2020", "Трета група / набор 2020"],
    ["2019", "Четвърта / ПГ / набор 2019"],
    ["2018", "Подготвителна / набор 2018"]
  ];
  const PLACE_TYPES = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];

  function getPrefs() {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || "null") || null; }
    catch { return null; }
  }

  function savePrefs(data) {
    localStorage.setItem(PREF_KEY, JSON.stringify(data));
  }

  function setNativeValue(element, value) {
    if (!element) return;
    const proto = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) descriptor.set.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getDistrict(option) {
    const text = (option.textContent || "").trim();
    const parts = text.split("·");
    return (parts[1] || "").trim();
  }

  function makeLabel(text) {
    const label = document.createElement("label");
    label.className = "mzm-enhanced-label";
    label.textContent = text;
    return label;
  }

  function makeSelect() {
    const wrap = document.createElement("div");
    wrap.className = "mzm-enhanced-select-wrap";
    const select = document.createElement("select");
    select.className = "mzm-enhanced-select";
    select.dataset.mzmEnhanced = "true";
    wrap.appendChild(select);
    return [wrap, select];
  }

  function makeOption(value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }

  function findOriginalFields(section) {
    const selects = Array.from(section.querySelectorAll("select:not([data-mzm-enhanced])"));
    const kgSelects = selects.filter((select) => Array.from(select.options).some((option) => (option.textContent || "").includes("·")));
    return {
      fromSelect: kgSelects[0] || null,
      wantedSelect: kgSelects[1] || null,
      ageInput: section.querySelector("input:not([data-mzm-enhanced])"),
      submitButton: Array.from(section.querySelectorAll("button")).find((button) => /Активирай заявка|Добави заявка/.test(button.textContent || "")) || null,
      demoButton: Array.from(section.querySelectorAll("button")).find((button) => /Демо/.test(button.textContent || "")) || null
    };
  }

  function hideOriginalFieldChrome(section, fields) {
    const labels = Array.from(section.querySelectorAll("label"));
    labels.forEach((label) => {
      const text = label.textContent || "";
      if (/Имаме място|Желана градина|Набор/.test(text)) {
        label.style.display = "none";
        const next = label.nextElementSibling;
        if (next && (next.matches(".relative") || next.matches("input"))) next.style.display = "none";
      }
    });
    if (fields.ageInput) fields.ageInput.style.display = "none";

    const possibleTypeBlocks = Array.from(section.querySelectorAll("div")).filter((node) => (node.textContent || "").includes("Тип място"));
    possibleTypeBlocks.forEach((node) => {
      if (node.querySelector("button")) node.style.display = "none";
    });
  }

  function enhanceSection(section) {
    if (section.dataset.mzmEnhancedRequest === "true") return;
    const text = section.textContent || "";
    if (!text.includes("Имаме място") || !text.includes("Желана градина")) return;

    const fields = findOriginalFields(section);
    if (!fields.fromSelect || !fields.wantedSelect) return;
    section.dataset.mzmEnhancedRequest = "true";

    const prefs = getPrefs();
    const kgOptions = Array.from(fields.fromSelect.options)
      .filter((option) => option.value)
      .map((option) => ({ value: option.value, label: option.textContent || "", district: getDistrict(option) }));
    const districts = Array.from(new Set(kgOptions.map((option) => option.district).filter(Boolean))).sort((a, b) => a.localeCompare(b, "bg"));

    const panel = document.createElement("div");
    panel.className = "mzm-enhanced-request-panel";

    const intro = document.createElement("div");
    intro.className = "mzm-enhanced-intro";
    intro.innerHTML = '<p>Заявка за размяна</p><strong>Първо филтрираме, после избираш градини.</strong><span>Районът и наборът ограничават списъка, за да не ровиш като археолог в 200 опции.</span>';
    panel.appendChild(intro);

    const districtLabel = makeLabel("Район");
    const [districtWrap, districtSelect] = makeSelect();
    districtSelect.appendChild(makeOption("", "Избери район"));
    districts.forEach((district) => districtSelect.appendChild(makeOption(district, district)));
    panel.appendChild(districtLabel);
    panel.appendChild(districtWrap);

    const groupLabel = makeLabel("Набор / група");
    const [groupWrap, groupSelect] = makeSelect();
    groupSelect.appendChild(makeOption("", "Избери набор"));
    GROUPS.forEach(([value, label]) => groupSelect.appendChild(makeOption(value, label)));
    panel.appendChild(groupLabel);
    panel.appendChild(groupWrap);

    const typeLabel = makeLabel("Тип място");
    const typeGrid = document.createElement("div");
    typeGrid.className = "mzm-enhanced-type-grid";
    let selectedType = prefs?.placeType || "Общ ред";
    const originalTypeButtons = Array.from(section.querySelectorAll("button")).filter((button) => PLACE_TYPES.includes((button.textContent || "").trim()));
    function syncTypeButtons() {
      Array.from(typeGrid.querySelectorAll("button")).forEach((button) => {
        const active = button.dataset.value === selectedType;
        button.classList.toggle("is-active", active);
      });
      const original = originalTypeButtons.find((button) => (button.textContent || "").trim() === selectedType);
      if (original) original.click();
    }
    PLACE_TYPES.forEach((type) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.value = type;
      button.textContent = type;
      button.addEventListener("click", () => {
        selectedType = type;
        syncTypeButtons();
        maybeSavePrefs();
      });
      typeGrid.appendChild(button);
    });
    panel.appendChild(typeLabel);
    panel.appendChild(typeGrid);

    const fromLabel = makeLabel("Сегашна детска градина");
    const [fromWrap, fromVisible] = makeSelect();
    const wantedLabel = makeLabel("Желана детска градина");
    const [wantedWrap, wantedVisible] = makeSelect();
    panel.appendChild(fromLabel);
    panel.appendChild(fromWrap);
    panel.appendChild(wantedLabel);
    panel.appendChild(wantedWrap);

    const saveRow = document.createElement("label");
    saveRow.className = "mzm-enhanced-save-row";
    const saveCheckbox = document.createElement("input");
    saveCheckbox.type = "checkbox";
    saveCheckbox.checked = !prefs;
    saveCheckbox.dataset.mzmEnhanced = "true";
    const saveText = document.createElement("span");
    saveText.textContent = prefs ? "Обнови тези данни в профила" : "Запази тези данни в профила";
    saveRow.appendChild(saveCheckbox);
    saveRow.appendChild(saveText);
    panel.appendChild(saveRow);

    section.insertBefore(panel, section.firstChild);
    hideOriginalFieldChrome(section, fields);

    function currentData() {
      return {
        district: districtSelect.value,
        ageGroup: groupSelect.value,
        placeType: selectedType
      };
    }

    function maybeSavePrefs() {
      if (!saveCheckbox.checked) return;
      const data = currentData();
      if (data.district || data.ageGroup || data.placeType) savePrefs(data);
    }

    function syncAge() {
      if (fields.ageInput && groupSelect.value) setNativeValue(fields.ageInput, groupSelect.value);
      maybeSavePrefs();
    }

    function rebuildKgSelect(visibleSelect, originalSelect, placeholder) {
      const previous = visibleSelect.value || originalSelect.value;
      visibleSelect.innerHTML = "";
      visibleSelect.appendChild(makeOption("", placeholder));
      const district = districtSelect.value;
      kgOptions
        .filter((option) => !district || option.district === district)
        .forEach((option) => visibleSelect.appendChild(makeOption(option.value, option.label)));
      if (previous && Array.from(visibleSelect.options).some((option) => option.value === previous)) visibleSelect.value = previous;
      else visibleSelect.value = "";
      setNativeValue(originalSelect, visibleSelect.value);
    }

    function rebuildAllKg() {
      rebuildKgSelect(fromVisible, fields.fromSelect, "Избери сегашна градина");
      rebuildKgSelect(wantedVisible, fields.wantedSelect, "Избери желана градина");
      maybeSavePrefs();
    }

    districtSelect.addEventListener("change", rebuildAllKg);
    groupSelect.addEventListener("change", syncAge);
    fromVisible.addEventListener("change", () => setNativeValue(fields.fromSelect, fromVisible.value));
    wantedVisible.addEventListener("change", () => setNativeValue(fields.wantedSelect, wantedVisible.value));
    saveCheckbox.addEventListener("change", maybeSavePrefs);

    if (prefs?.district && districts.includes(prefs.district)) districtSelect.value = prefs.district;
    if (prefs?.ageGroup) groupSelect.value = prefs.ageGroup;
    syncTypeButtons();
    syncAge();
    rebuildAllKg();

    if (fields.submitButton) {
      fields.submitButton.addEventListener("click", () => {
        maybeSavePrefs();
        localStorage.setItem(COLLAPSE_KEY, "true");
        setTimeout(() => collapseIfNeeded(section), 700);
      });
    }

    collapseIfNeeded(section);
  }

  function collapseIfNeeded(section) {
    const hasRequestNearby = document.body.textContent?.includes("Моите заявки") || document.body.textContent?.includes("Моите активни заявки");
    if (localStorage.getItem(COLLAPSE_KEY) !== "true" || !hasRequestNearby) return;
    if (section.dataset.mzmCollapsed === "true") return;
    section.dataset.mzmCollapsed = "true";
    const collapsed = document.createElement("button");
    collapsed.type = "button";
    collapsed.className = "mzm-collapsed-request-button";
    collapsed.innerHTML = '<span><b>Нова заявка</b><small>Формата е прибрана, за да виждаш активната заявка.</small></span><i>⌄</i>';
    section.parentNode?.insertBefore(collapsed, section);
    section.style.display = "none";
    collapsed.addEventListener("click", () => {
      section.style.display = "";
      section.dataset.mzmCollapsed = "false";
      collapsed.remove();
      localStorage.setItem(COLLAPSE_KEY, "false");
    });
  }

  function injectStyles() {
    if (document.getElementById("mzm-enhanced-request-styles")) return;
    const style = document.createElement("style");
    style.id = "mzm-enhanced-request-styles";
    style.textContent = `
      .mzm-enhanced-request-panel { display: grid; gap: .72rem; margin-bottom: 1rem; border-radius: 1.75rem; padding: 1rem; background: rgba(247,245,239,.92); box-shadow: inset 0 0 0 1px rgba(28,27,25,.025); }
      .mzm-enhanced-intro { border-radius: 1.35rem; padding: .95rem 1rem; background: rgba(255,255,255,.72); }
      .mzm-enhanced-intro p { margin: 0 0 .25rem; font-size: .62rem; font-weight: 900; text-transform: uppercase; letter-spacing: .18em; color: rgba(28,27,25,.42); }
      .mzm-enhanced-intro strong { display:block; font-size: .98rem; line-height: 1.18; }
      .mzm-enhanced-intro span { display:block; margin-top: .35rem; font-size: .76rem; line-height: 1.45; color: rgba(28,27,25,.55); font-weight: 650; }
      .mzm-enhanced-label { margin-top: .35rem; font-size: .64rem; font-weight: 900; text-transform: uppercase; letter-spacing: .18em; color: rgba(28,27,25,.42); }
      .mzm-enhanced-select-wrap { position: relative; }
      .mzm-enhanced-select { width: 100%; appearance: none; border: 0; outline: 0; border-radius: 1.35rem; background: rgba(255,255,255,.82); padding: 1rem 3rem 1rem 1rem; font-size: .88rem; font-weight: 800; color: #1c1b19; }
      .mzm-enhanced-select-wrap::after { content: ''; position: absolute; right: 1.15rem; top: 50%; width: 18px; height: 18px; transform: translateY(-50%); background: rgba(28,27,25,.58); mask: url('/icons/angle-down.svg') center / contain no-repeat; -webkit-mask: url('/icons/angle-down.svg') center / contain no-repeat; pointer-events: none; }
      .mzm-enhanced-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
      .mzm-enhanced-type-grid button { border: 0; border-radius: 1.05rem; padding: .85rem .75rem; background: rgba(255,255,255,.75); color: #1c1b19; text-align: left; font-weight: 900; font-size: .75rem; }
      .mzm-enhanced-type-grid button.is-active { background: var(--study-orange); color: white; }
      .mzm-enhanced-save-row { display:flex; gap:.6rem; align-items:center; border-radius: 1.25rem; background: rgba(255,255,255,.62); padding: .85rem .9rem; color: rgba(28,27,25,.65); font-size: .76rem; font-weight: 800; }
      .mzm-enhanced-save-row input { width: 1rem; height: 1rem; accent-color: var(--study-orange); }
      .mzm-collapsed-request-button { width:100%; border:0; display:flex; justify-content:space-between; align-items:center; gap:1rem; border-radius:1.6rem; padding:1rem 1.1rem; background:rgba(255,255,255,.9); color:#1c1b19; text-align:left; box-shadow:0 14px 36px rgba(40,34,20,.05); }
      .mzm-collapsed-request-button b { display:block; font-size:1rem; }
      .mzm-collapsed-request-button small { display:block; margin-top:.22rem; color:rgba(28,27,25,.48); font-weight:700; line-height:1.3; }
      .mzm-collapsed-request-button i { display:grid; place-items:center; width:2.2rem; height:2.2rem; border-radius:999px; background:var(--study-orange); color:white; font-style:normal; font-weight:900; }
    `;
    document.head.appendChild(style);
  }

  function runEnhancer() {
    injectStyles();
    Array.from(document.querySelectorAll("section")).forEach(enhanceSection);
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      runEnhancer();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule);
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg">
      <body className={sofiaSans.className}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: requestFormEnhancerScript }} />
      </body>
    </html>
  );
}
