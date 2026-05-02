import { gunzipSync } from "node:zlib";
import pdfCatalogBundle from "@/data/sofia/mzm-catalog-pdf.json";

export type SofiaSourceStatus = { id: string; label: string; url: string; status: "ok" | "error" | "fallback"; checkedAt: string; detail?: string };
export type SofiaInstitutionCategory = "ДГ" | "Детска градина с яслени групи" | "Ясла";
export type SofiaInstitution = { id: string; name: string; type: "kindergarten" | "nursery" | "unknown"; category?: SofiaInstitutionCategory; subtype?: string; district?: string; districtCode?: string; address?: string | null; website?: string | null; phone?: string | null; email?: string | null; source: string; sourceUrl: string; raw?: Record<string, unknown> };
export type SofiaCatalog = { generatedAt: string; districts: string[]; years: string[]; categories: SofiaInstitutionCategory[]; institutions: SofiaInstitution[]; groupedByDistrict: Record<string, Record<string, SofiaInstitution[]>>; sources: SofiaSourceStatus[]; stats: { institutionsTotal: number; districtsTotal: number; byCategory: Record<string, number>; byType: Record<string, number>; byDistrict: Record<string, number>; rawEntriesTotal: number }; notes: string[] };

type RawEntry = Record<string, unknown> & { id?: string; institutionId?: string; name?: string; district?: string; address?: string; contact?: string; phone?: string; email?: string; website?: string; category?: string; type?: string; entryType?: string; hasNurseryGroups?: boolean; isHourlyOrganization?: boolean };
type RawCatalog = { generatedAt?: string; notes?: string[]; districts?: string[]; rawEntries?: RawEntry[]; raw_entries?: RawEntry[] };
type Bundle = RawCatalog & { encoding?: string; payload?: string };

const bundle = pdfCatalogBundle as unknown as Bundle;
const SOURCE_URL = "/data/sofia/mzm-catalog-pdf.json";
const CATEGORIES: SofiaInstitutionCategory[] = ["ДГ", "Детска градина с яслени групи", "Ясла"];
let cachedCatalog: RawCatalog | null = null;

function decodeCatalog(): RawCatalog {
  if (cachedCatalog) return cachedCatalog;
  if (bundle.encoding === "gzip+base64+json" && typeof bundle.payload === "string") {
    cachedCatalog = JSON.parse(gunzipSync(Buffer.from(bundle.payload, "base64")).toString("utf8")) as RawCatalog;
    return cachedCatalog;
  }
  cachedCatalog = bundle;
  return cachedCatalog;
}

function str(value: unknown) { return typeof value === "string" ? value.trim() || undefined : typeof value === "number" ? String(value) : undefined; }
function bool(value: unknown) { return typeof value === "boolean" ? value : typeof value === "number" ? value === 1 : typeof value === "string" ? ["true", "1", "yes", "да"].includes(value.trim().toLowerCase()) : false; }
function norm(value: string) { return value.toLowerCase().replace(/[„“”]/g, '"').replace(/\s+/g, " ").trim(); }
function slug(value: string) { return norm(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80); }
function numberFromName(value: string) { return value.match(/(?:№|No|N|ДГ|СДЯ)\s*[- ]?\s*(\d{1,4})/i)?.[1]; }
function getRawEntries(raw: RawCatalog) { return Array.isArray(raw.rawEntries) ? raw.rawEntries : Array.isArray(raw.raw_entries) ? raw.raw_entries : []; }

function getCategory(entry: RawEntry): SofiaInstitutionCategory {
  const explicit = str(entry.category) ?? str(entry.type);
  if (explicit && CATEGORIES.includes(explicit as SofiaInstitutionCategory)) return explicit as SofiaInstitutionCategory;
  const name = norm(str(entry.name) ?? "");
  if (name.includes("сдя") || name.includes("самостоятелна детска ясла") || name.includes("детска ясла")) return "Ясла";
  if (bool(entry.hasNurseryGroups) || name.includes("яслени групи")) return "Детска градина с яслени групи";
  return "ДГ";
}

function getSubtype(entry: RawEntry, category: SofiaInstitutionCategory) {
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
    address: str(entry.address) ?? null,
    phone: str(entry.contact) ?? str(entry.phone) ?? null,
    email: str(entry.email) ?? null,
    website: str(entry.website) ?? null,
    source: "mzm.pdf_catalog_2026_05_02",
    sourceUrl: SOURCE_URL,
    raw: entry
  };
}

function groupByDistrict(items: SofiaInstitution[]) { return items.reduce<Record<string, Record<string, SofiaInstitution[]>>>((acc, item) => { const district = item.district ?? "Без район"; const category = item.category ?? item.type; acc[district] ??= {}; acc[district][category] ??= []; acc[district][category].push(item); return acc; }, {}); }
function counter(items: Record<string, unknown>[], key: string) { return items.reduce<Record<string, number>>((acc, item) => { const value = str(item[key]) ?? "Без стойност"; acc[value] = (acc[value] ?? 0) + 1; return acc; }, {}); }
export function getCatalogYears(now = new Date()) { const currentYear = now.getFullYear(); return Array.from({ length: 7 }, (_, index) => String(currentYear - index)); }

export async function getSofiaCatalog(): Promise<SofiaCatalog> {
  const raw = decodeCatalog();
  const entries = getRawEntries(raw);
  const institutions = entries.map(toInstitution).filter((item): item is SofiaInstitution => Boolean(item));
  const districts = Array.isArray(raw.districts) && raw.districts.length > 0 ? raw.districts : Array.from(new Set(institutions.map((item) => item.district).filter((item): item is string => Boolean(item))));
  const generatedAt = raw.generatedAt ?? bundle.generatedAt ?? new Date().toISOString();
  return {
    generatedAt,
    districts,
    years: getCatalogYears(),
    categories: CATEGORIES.filter((category) => institutions.some((item) => item.category === category)),
    institutions,
    groupedByDistrict: groupByDistrict(institutions),
    sources: [{ id: "mzm-pdf-catalog", label: "MZM PDF catalog", url: SOURCE_URL, status: institutions.length > 0 ? "ok" : "fallback", checkedAt: generatedAt, detail: `Loaded ${institutions.length} PDF records.` }],
    stats: { institutionsTotal: institutions.length, districtsTotal: districts.length, byCategory: counter(institutions, "category"), byType: counter(institutions, "type"), byDistrict: counter(institutions, "district"), rawEntriesTotal: entries.length },
    notes: [...(Array.isArray(raw.notes) ? raw.notes : []), "Runtime catalog source: data/sofia/mzm-catalog-pdf.json", "No remote catalog fetch is used by the loader."]
  };
}
