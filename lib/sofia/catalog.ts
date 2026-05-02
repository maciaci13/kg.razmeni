import catalogJson from "@/data/sofia/mzm-catalog.json";

export type SofiaSourceStatus = { id: string; label: string; url: string; status: "ok" | "error" | "fallback"; checkedAt: string; detail?: string };
export type SofiaInstitutionCategory = "ДГ" | "Детска градина с яслени групи" | "Ясла";
export type SofiaInstitution = { id: string; name: string; type: "kindergarten" | "nursery" | "unknown"; category?: SofiaInstitutionCategory; subtype?: string; district?: string; districtCode?: string; address?: string | null; website?: string | null; phone?: string | null; email?: string | null; source: string; sourceUrl: string; raw?: Record<string, unknown> };
export type SofiaCatalog = { generatedAt: string; districts: string[]; years: string[]; categories: SofiaInstitutionCategory[]; institutions: SofiaInstitution[]; groupedByDistrict: Record<string, Record<string, SofiaInstitution[]>>; sources: SofiaSourceStatus[]; stats: { institutionsTotal: number; districtsTotal: number; byCategory: Record<string, number>; byType: Record<string, number>; byDistrict: Record<string, number>; rawEntriesTotal: number }; notes: string[] };

type RawEntry = Record<string, unknown> & { id?: string; institutionId?: string; name?: string; district?: string; districtCode?: string; address?: string; contact?: string; phone?: string; email?: string; website?: string; category?: string; type?: string; subtype?: string; entryType?: string; hasNurseryGroups?: boolean; isHourlyOrganization?: boolean; source?: string; sourceUrl?: string };
type RawCatalog = { generatedAt?: string; source?: string; notes?: string[]; districts?: string[]; years?: string[]; categories?: SofiaInstitutionCategory[]; rawEntries?: RawEntry[]; raw_entries?: RawEntry[]; institutions?: RawEntry[]; stats?: Record<string, unknown> };

const catalog = catalogJson as unknown as RawCatalog;
const SOURCE_URL = "/data/sofia/mzm-catalog.json";
const CATEGORIES: SofiaInstitutionCategory[] = ["ДГ", "Детска градина с яслени групи", "Ясла"];

function str(value: unknown) { return typeof value === "string" ? value.trim() || undefined : typeof value === "number" ? String(value) : undefined; }
function bool(value: unknown) { return typeof value === "boolean" ? value : typeof value === "number" ? value === 1 : typeof value === "string" ? ["true", "1", "yes", "да"].includes(value.trim().toLowerCase()) : false; }
function norm(value: string) { return value.toLowerCase().replace(/[„“”]/g, '"').replace(/\s+/g, " ").trim(); }
function slug(value: string) { return norm(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80); }
function numberFromName(value: string) { return value.match(/(?:№|No|N|ДГ|СДЯ)\s*[- ]?\s*(\d{1,4})/i)?.[1]; }
function getRawEntries(raw: RawCatalog) {
  if (Array.isArray(raw.rawEntries) && raw.rawEntries.length > 0) return raw.rawEntries;
  if (Array.isArray(raw.raw_entries) && raw.raw_entries.length > 0) return raw.raw_entries;
  if (Array.isArray(raw.institutions) && raw.institutions.length > 0) return raw.institutions;
  return [];
}

function getCategory(entry: RawEntry): SofiaInstitutionCategory {
  const explicit = str(entry.category);
  if (explicit && CATEGORIES.includes(explicit as SofiaInstitutionCategory)) return explicit as SofiaInstitutionCategory;
  const rawType = str(entry.type);
  if (rawType && CATEGORIES.includes(rawType as SofiaInstitutionCategory)) return rawType as SofiaInstitutionCategory;
  const name = norm(str(entry.name) ?? "");
  if (name.includes("сдя") || name.includes("самостоятелна детска ясла") || name.includes("детска ясла")) return "Ясла";
  if (bool(entry.hasNurseryGroups) || name.includes("яслени групи")) return "Детска градина с яслени групи";
  return "ДГ";
}

function getSubtype(entry: RawEntry, category: SofiaInstitutionCategory) {
  const explicit = str(entry.subtype);
  if (explicit) return explicit;
  const entryType = str(entry.entryType);
  if (entryType === "hourly" || bool(entry.isHourlyOrganization)) return "hourly_organization";
  if (entryType === "building") return "building";
  if (category === "Ясла") return "independent_nursery";
  if (category === "Детска градина с яслени групи") return "kindergarten_with_nursery_groups";
  return "kindergarten";
}

function toInstitution(entry: RawEntry, index: number): SofiaInstitution | null {
  const name = str(entry.name);
  if (!name) return null;
  const category = getCategory(entry);
  const subtype = getSubtype(entry, category);
  return {
    id: str(entry.id) ?? `${str(entry.institutionId) ?? subtype}-${numberFromName(name) ?? slug(name)}-${index}`,
    name,
    type: category === "Ясла" ? "nursery" : "kindergarten",
    category,
    subtype,
    district: str(entry.district),
    districtCode: str(entry.districtCode),
    address: str(entry.address) ?? null,
    phone: str(entry.contact) ?? str(entry.phone) ?? null,
    email: str(entry.email) ?? null,
    website: str(entry.website) ?? null,
    source: str(entry.source) ?? "mzm.pdf_catalog_plain_json",
    sourceUrl: str(entry.sourceUrl) ?? SOURCE_URL,
    raw: entry
  };
}

function groupByDistrict(items: SofiaInstitution[]) { return items.reduce<Record<string, Record<string, SofiaInstitution[]>>>((acc, item) => { const district = item.district ?? "Без район"; const category = item.category ?? item.type; acc[district] ??= {}; acc[district][category] ??= []; acc[district][category].push(item); return acc; }, {}); }
function counter(items: Record<string, unknown>[], key: string) { return items.reduce<Record<string, number>>((acc, item) => { const value = str(item[key]) ?? "Без стойност"; acc[value] = (acc[value] ?? 0) + 1; return acc; }, {}); }
export function getCatalogYears(now = new Date()) { const currentYear = now.getFullYear(); return Array.from({ length: 7 }, (_, index) => String(currentYear - index)); }

export async function getSofiaCatalog(): Promise<SofiaCatalog> {
  const entries = getRawEntries(catalog);
  const institutions = entries.map(toInstitution).filter((item): item is SofiaInstitution => Boolean(item));
  const districts = Array.isArray(catalog.districts) && catalog.districts.length > 0 ? catalog.districts : Array.from(new Set(institutions.map((item) => item.district).filter((item): item is string => Boolean(item))));
  const generatedAt = catalog.generatedAt ?? new Date().toISOString();
  return {
    generatedAt,
    districts,
    years: catalog.years?.length ? catalog.years : getCatalogYears(),
    categories: CATEGORIES.filter((category) => institutions.some((item) => item.category === category)),
    institutions,
    groupedByDistrict: groupByDistrict(institutions),
    sources: [{ id: "mzm-catalog-json", label: "MZM plain JSON catalog", url: SOURCE_URL, status: institutions.length > 0 ? "ok" : "fallback", checkedAt: generatedAt, detail: `Loaded ${institutions.length} records from editable plain JSON catalog.` }],
    stats: { institutionsTotal: institutions.length, districtsTotal: districts.length, byCategory: counter(institutions, "category"), byType: counter(institutions, "type"), byDistrict: counter(institutions, "district"), rawEntriesTotal: entries.length },
    notes: [...(Array.isArray(catalog.notes) ? catalog.notes : []), "Runtime catalog source: data/sofia/mzm-catalog.json", "This file is plain JSON and is safe to edit when contacts, buildings or institution records change."]
  };
}
