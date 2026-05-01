import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_DIR = new URL("../data/sofia/sources/", import.meta.url);
const OUT_FILE = new URL("../data/sofia/catalog.generated.json", import.meta.url);

const DISTRICTS = {
  "01": "Средец",
  "02": "Красно село",
  "03": "Възраждане",
  "04": "Оборище",
  "05": "Сердика",
  "06": "Подуяне",
  "07": "Слатина",
  "08": "Изгрев",
  "09": "Лозенец",
  "10": "Триадица",
  "11": "Красна поляна",
  "12": "Илинден",
  "13": "Надежда",
  "14": "Искър",
  "15": "Младост",
  "16": "Студентски",
  "17": "Витоша",
  "18": "Овча купел",
  "19": "Люлин",
  "20": "Връбница",
  "21": "Нови Искър",
  "22": "Кремиковци",
  "23": "Панчарево",
  "24": "Банкя"
};

const SOURCES = {
  kindergartens: "https://api.sofiaplan.bg/datasets/142",
  municipalKindergartens: "https://api.sofiaplan.bg/datasets/311",
  schools: "https://api.sofiaplan.bg/datasets/166",
  districts: "https://api.sofiaplan.bg/datasets/628"
};

function asString(value) {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

function code(value) {
  const raw = asString(value);
  return raw ? raw.padStart(2, "0") : undefined;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/geo+json,application/json,text/plain,*/*",
      "user-agent": "MZM Sofia catalog generator"
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

function extractFeatures(payload) {
  if (Array.isArray(payload?.features)) return payload.features;
  if (Array.isArray(payload)) return payload.map((properties) => ({ properties }));
  return [];
}

function classifyKindergarten(record) {
  const name = asString(record.object_nam) ?? asString(record.ime) ?? "";
  const typeCode = asString(record.type) ?? asString(record.tip);
  const lowerName = name.toLowerCase();

  if (typeCode === "2" || lowerName.includes("сдя") || /^д[яа]\s*№/i.test(name)) {
    return { type: "nursery", category: "Ясла", subtype: "independent_nursery" };
  }

  if (typeCode === "4") {
    return { type: "kindergarten", category: "Детска градина с яслени групи", subtype: "kindergarten_with_nursery_groups" };
  }

  return { type: "kindergarten", category: "ДГ", subtype: "kindergarten" };
}

function coordinates(feature) {
  const value = feature?.geometry?.coordinates;
  if (Array.isArray(value?.[0]) && typeof value[0][0] === "number") return value[0];
  if (Array.isArray(value) && typeof value[0] === "number") return value;
  return null;
}

function normalizeKindergarten(feature, index, sourceKey) {
  const record = feature.properties ?? feature;
  const name = asString(record.object_nam) ?? asString(record.ime);
  if (!name) return null;
  const districtCode = code(record.kod_rayon);
  const classification = classifyKindergarten(record);

  return {
    id: `${classification.subtype}-${districtCode ?? "unknown"}-${slugify(name)}-${asString(record.id) ?? index}`,
    name,
    ...classification,
    district: districtCode ? DISTRICTS[districtCode] : undefined,
    districtCode,
    number: record.object_nom ?? record.nomer ?? null,
    address: asString(record.adres) ?? null,
    phone: asString(record.telefon) ?? null,
    email: asString(record.email) ?? null,
    website: asString(record.website) ?? null,
    coordinates: coordinates(feature),
    source: `sofiaplan.${sourceKey}`,
    sourceUrl: SOURCES[sourceKey],
    raw: record
  };
}

function normalizeSchool(feature, index) {
  const record = feature.properties ?? feature;
  const name = asString(record.object_nam) ?? asString(record.ime);
  if (!name) return null;
  const sourceType = asString(record.type) ?? asString(record.tip);
  if (sourceType !== "1" && sourceType !== "2") return null;
  const districtCode = code(record.kod_rayon);

  return {
    id: `school-preparatory-${districtCode ?? "unknown"}-${slugify(name)}-${asString(record.id) ?? index}`,
    name,
    type: "school",
    category: "Училище с подготвителни групи",
    subtype: "school_with_preparatory_groups",
    district: districtCode ? DISTRICTS[districtCode] : undefined,
    districtCode,
    number: record.object_nom ?? null,
    address: asString(record.adres) ?? null,
    coordinates: coordinates(feature),
    source: "sofiaplan.schools",
    sourceUrl: SOURCES.schools,
    raw: record
  };
}

function dedupe(institutions) {
  const seen = new Map();
  for (const item of institutions) {
    const key = `${item.type}|${item.district ?? ""}|${item.name.toLowerCase()}|${item.address ?? ""}`;
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()].sort((a, b) =>
    `${a.districtCode ?? "99"}-${a.category}-${a.name}`.localeCompare(`${b.districtCode ?? "99"}-${b.category}-${b.name}`, "bg")
  );
}

function groupByDistrict(institutions) {
  return institutions.reduce((acc, item) => {
    const district = item.district ?? "Без район";
    const category = item.category ?? item.type;
    acc[district] ??= {};
    acc[district][category] ??= [];
    acc[district][category].push(item);
    return acc;
  }, {});
}

function counter(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? "Без стойност";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

async function saveRaw(name, payload) {
  await writeFile(new URL(`${name}.json`, SOURCE_DIR), JSON.stringify(payload, null, 2), "utf8");
}

await mkdir(SOURCE_DIR, { recursive: true });

const [kindergartensRaw, municipalRaw, schoolsRaw, districtsRaw] = await Promise.all([
  fetchJson(SOURCES.kindergartens),
  fetchJson(SOURCES.municipalKindergartens),
  fetchJson(SOURCES.schools),
  fetchJson(SOURCES.districts)
]);

await Promise.all([
  saveRaw("sofiaplan-dataset-142-kindergartens", kindergartensRaw),
  saveRaw("sofiaplan-dataset-311-municipal-kindergartens", municipalRaw),
  saveRaw("sofiaplan-dataset-166-schools", schoolsRaw),
  saveRaw("sofiaplan-dataset-628-districts", districtsRaw)
]);

const kindergartens = extractFeatures(kindergartensRaw)
  .map((feature, index) => normalizeKindergarten(feature, index, "kindergartens"))
  .filter(Boolean);

const schools = extractFeatures(schoolsRaw)
  .map((feature, index) => normalizeSchool(feature, index))
  .filter(Boolean);

const institutions = dedupe([...kindergartens, ...schools]);

const catalog = {
  generatedAt: new Date().toISOString(),
  districts: Object.values(DISTRICTS),
  categories: ["ДГ", "Детска градина с яслени групи", "Ясла", "Училище с подготвителни групи"],
  institutions,
  groupedByDistrict: groupByDistrict(institutions),
  sources: Object.entries(SOURCES).map(([id, url]) => ({ id, url })),
  stats: {
    institutionsTotal: institutions.length,
    kindergartensTotal: kindergartens.length,
    schoolsWithPreparatoryGroupsTotal: schools.length,
    districtsTotal: Object.keys(DISTRICTS).length,
    byCategory: counter(institutions, "category"),
    byType: counter(institutions, "type"),
    byDistrict: counter(institutions, "district")
  },
  notes: [
    "Generated from the public SofiaPlan API.",
    "Dataset 142 is used for kindergarten / nursery points.",
    "Dataset 166 is used for school points; school types 1 and 2 are normalized as schools with preparatory groups.",
    "Dataset 311 and 628 are saved as raw sources for future enrichment."
  ]
};

await writeFile(OUT_FILE, JSON.stringify(catalog, null, 2), "utf8");
console.log(`Saved ${institutions.length} institutions to ${OUT_FILE.pathname}`);
