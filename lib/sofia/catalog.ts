export type SofiaSourceStatus = {
  id: string;
  label: string;
  url: string;
  status: "ok" | "error" | "fallback";
  checkedAt: string;
  detail?: string;
};

export type SofiaInstitution = {
  id: string;
  name: string;
  type: "nursery" | "kindergarten" | "school" | "unknown";
  district?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  source: string;
  sourceUrl: string;
  raw?: Record<string, unknown>;
};

export type SofiaCatalog = {
  generatedAt: string;
  districts: string[];
  years: string[];
  institutions: SofiaInstitution[];
  sources: SofiaSourceStatus[];
  notes: string[];
};

export const SOFIA_DISTRICTS = [
  "Банкя",
  "Витоша",
  "Връбница",
  "Възраждане",
  "Изгрев",
  "Илинден",
  "Искър",
  "Красна поляна",
  "Красно село",
  "Кремиковци",
  "Лозенец",
  "Люлин",
  "Младост",
  "Надежда",
  "Нови Искър",
  "Оборище",
  "Овча купел",
  "Панчарево",
  "Подуяне",
  "Сердика",
  "Слатина",
  "Средец",
  "Студентски",
  "Триадица"
];

export const OFFICIAL_SOURCE_URLS = {
  kgSpots: "https://kg.sofia.bg/#/spots",
  kgKindergartens: "https://kg.sofia.bg/#/kindergartens",
  urbanDataKindergartens: "https://urbandata.sofia.bg/api/3/action/package_show?id=kindergartens",
  urbanDataPortal: "https://urbandata.sofia.bg/gl/dataset/kindergartens",
  sofiaKindergartenRegister: "https://www.sofia.bg/kinder-garden",
  sofiaMap: "https://www.sofia.bg/location-kindergartens-schools",
  sofiaAdmissionService: "https://www.sofia.bg/web/svc/w/priem-v-detski-zavedenia"
};

const FALLBACK_INSTITUTIONS: SofiaInstitution[] = [
  {
    id: "fallback-dg-1",
    name: "Детска градина — примерен запис",
    type: "kindergarten",
    district: "Средец",
    source: "fallback",
    sourceUrl: OFFICIAL_SOURCE_URLS.urbanDataPortal
  },
  {
    id: "fallback-dg-2",
    name: "Детска градина — примерен запис",
    type: "kindergarten",
    district: "Лозенец",
    source: "fallback",
    sourceUrl: OFFICIAL_SOURCE_URLS.urbanDataPortal
  },
  {
    id: "fallback-nursery-1",
    name: "Самостоятелна детска ясла — примерен запис",
    type: "nursery",
    district: "Младост",
    source: "fallback",
    sourceUrl: OFFICIAL_SOURCE_URLS.kgKindergartens
  },
  {
    id: "fallback-school-pg-1",
    name: "Училище с подготвителна група — примерен запис",
    type: "school",
    district: "Оборище",
    source: "fallback",
    sourceUrl: OFFICIAL_SOURCE_URLS.sofiaMap
  }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function getCatalogYears(now = new Date()) {
  const currentYear = now.getFullYear();
  const preparatoryYear = currentYear - 6;
  const years: string[] = [];
  for (let year = currentYear; year >= preparatoryYear; year -= 1) {
    years.push(String(year));
  }
  return years;
}

function getString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function inferInstitutionType(record: Record<string, unknown>, name = ""): SofiaInstitution["type"] {
  const text = `${name} ${Object.values(record).filter((value) => typeof value === "string").join(" ")}`.toLowerCase();
  if (text.includes("ясла")) return "nursery";
  if (text.includes("училище") || text.includes("су") || text.includes("оу")) return "school";
  if (text.includes("детска градина") || text.includes("дг")) return "kindergarten";
  return "unknown";
}

function normalizeInstitution(record: Record<string, unknown>, source: string, sourceUrl: string, index: number): SofiaInstitution | null {
  const name = getString(record, ["name", "Name", "NAME", "Име", "име", "Наименование", "наименование", "institution", "title"]);
  if (!name) return null;

  const district = getString(record, ["district", "District", "DISTRICT", "Район", "район", "administrative_area", "adm_area"]);
  const address = getString(record, ["address", "Address", "ADDRESS", "Адрес", "адрес"]);
  const website = getString(record, ["website", "Website", "web", "url", "URL", "Сайт", "сайт"]);
  const phone = getString(record, ["phone", "Phone", "телефон", "Телефон", "tel"]);
  const email = getString(record, ["email", "Email", "e-mail", "mail"]);

  return {
    id: `${source}-${slugify(name)}-${index}`,
    name,
    type: inferInstitutionType(record, name),
    district,
    address,
    website,
    phone,
    email,
    source,
    sourceUrl,
    raw: record
  };
}

async function fetchJson(url: string, timeoutMs = 8500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json,text/plain,*/*" },
      next: { revalidate: 60 * 60 * 6 }
    });

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    if (contentType.includes("application/json") || text.trim().startsWith("{")) {
      return JSON.parse(text) as unknown;
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function extractRecordsFromUnknownPayload(payload: unknown): Record<string, unknown>[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item));

  if (typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;

  const candidates = [
    record.records,
    record.result,
    typeof record.result === "object" && record.result !== null ? (record.result as Record<string, unknown>).records : undefined,
    record.data,
    record.items,
    record.features
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => {
          if (typeof item !== "object" || item === null || Array.isArray(item)) return null;
          const itemRecord = item as Record<string, unknown>;
          if (typeof itemRecord.properties === "object" && itemRecord.properties !== null) return itemRecord.properties as Record<string, unknown>;
          return itemRecord;
        })
        .filter((item): item is Record<string, unknown> => Boolean(item));
    }
  }

  return [];
}

async function fetchUrbanDataKindergartens(checkedAt: string) {
  const source: SofiaSourceStatus = {
    id: "urbandata-kindergartens",
    label: "UrbanData Sofia — детски градини",
    url: OFFICIAL_SOURCE_URLS.urbanDataKindergartens,
    status: "error",
    checkedAt
  };

  const institutions: SofiaInstitution[] = [];

  try {
    const packagePayload = await fetchJson(OFFICIAL_SOURCE_URLS.urbanDataKindergartens);
    const packageRecord = packagePayload as Record<string, unknown>;
    const result = packageRecord.result as Record<string, unknown> | undefined;
    const resources = Array.isArray(result?.resources) ? result.resources as Record<string, unknown>[] : [];

    source.status = "ok";
    source.detail = `Открити ресурси: ${resources.length}`;

    for (const resource of resources) {
      const resourceId = getString(resource, ["id"]);
      const resourceUrl = getString(resource, ["url"]);
      const datastoreActive = resource.datastore_active === true;

      const urlsToTry = [
        datastoreActive && resourceId ? `https://urbandata.sofia.bg/api/3/action/datastore_search?resource_id=${encodeURIComponent(resourceId)}&limit=5000` : undefined,
        resourceUrl
      ].filter(Boolean) as string[];

      for (const url of urlsToTry) {
        try {
          const payload = await fetchJson(url);
          const records = extractRecordsFromUnknownPayload(payload);
          records.forEach((record, index) => {
            const normalized = normalizeInstitution(record, "urbandata", url, index);
            if (normalized) institutions.push(normalized);
          });
          if (records.length > 0) break;
        } catch {
          // Try the next resource representation.
        }
      }
    }
  } catch (error) {
    source.status = "error";
    source.detail = error instanceof Error ? error.message : "Unknown UrbanData error";
  }

  return { source, institutions };
}

async function probeSource(id: string, label: string, url: string, checkedAt: string): Promise<SofiaSourceStatus> {
  try {
    await fetch(url, {
      method: "GET",
      headers: { accept: "text/html,application/json,*/*" },
      next: { revalidate: 60 * 60 * 6 }
    });
    return { id, label, url, status: "ok", checkedAt };
  } catch (error) {
    return { id, label, url, status: "error", checkedAt, detail: error instanceof Error ? error.message : "Unknown source probe error" };
  }
}

function dedupeInstitutions(institutions: SofiaInstitution[]) {
  const seen = new Map<string, SofiaInstitution>();
  for (const institution of institutions) {
    const key = `${institution.name.toLowerCase()}|${institution.district ?? ""}`;
    if (!seen.has(key)) seen.set(key, institution);
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, "bg"));
}

export async function getSofiaCatalog(): Promise<SofiaCatalog> {
  const checkedAt = new Date().toISOString();
  const urbanData = await fetchUrbanDataKindergartens(checkedAt);

  const probes = await Promise.all([
    probeSource("kg-spots", "kg.sofia.bg — свободни места", OFFICIAL_SOURCE_URLS.kgSpots, checkedAt),
    probeSource("kg-kindergartens", "kg.sofia.bg — детски заведения", OFFICIAL_SOURCE_URLS.kgKindergartens, checkedAt),
    probeSource("sofia-register", "Столична община — регистър", OFFICIAL_SOURCE_URLS.sofiaKindergartenRegister, checkedAt),
    probeSource("sofia-map", "Столична община — карта", OFFICIAL_SOURCE_URLS.sofiaMap, checkedAt),
    probeSource("sofia-admission-service", "Столична община — прием", OFFICIAL_SOURCE_URLS.sofiaAdmissionService, checkedAt)
  ]);

  const liveInstitutions = dedupeInstitutions(urbanData.institutions);
  const hasLiveInstitutions = liveInstitutions.length > 0;

  const sources: SofiaSourceStatus[] = [urbanData.source, ...probes];
  if (!hasLiveInstitutions) {
    sources.push({
      id: "fallback-catalog",
      label: "Fallback каталог",
      url: OFFICIAL_SOURCE_URLS.urbanDataPortal,
      status: "fallback",
      checkedAt,
      detail: "Външните източници не върнаха нормализируем списък. Използван е временен fallback, докато се уточни публичният формат."
    });
  }

  return {
    generatedAt: checkedAt,
    districts: SOFIA_DISTRICTS,
    years: getCatalogYears(),
    institutions: hasLiveInstitutions ? liveInstitutions : FALLBACK_INSTITUTIONS,
    sources,
    notes: [
      "Данните се извличат server-side от публични източници и се кешират краткосрочно.",
      "kg.sofia.bg е основният родителски интерфейс; при липса на документиран API се ползват само публично достъпни справочни данни.",
      "Правилата за преместване трябва да се показват като официален ред с линк към източник и дата на последна проверка."
    ]
  };
}
