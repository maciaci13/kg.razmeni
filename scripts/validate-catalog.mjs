import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "data", "sofia", "mzm-catalog.json");
const catalog = JSON.parse(fs.readFileSync(filePath, "utf8"));
const rawEntries = Array.isArray(catalog.rawEntries) ? catalog.rawEntries : [];
const districts = Array.isArray(catalog.districts) ? catalog.districts : [];
const districtSet = new Set(districts);
const ids = new Set();
const errors = [];
const warnings = [];

if (rawEntries.length === 0) errors.push("rawEntries is empty. The app would show no kindergartens.");
if (districts.length === 0) errors.push("districts is empty. The app would show no district filter.");

for (const [index, entry] of rawEntries.entries()) {
  const label = entry?.id || `row-${index}`;

  if (!entry || typeof entry !== "object") {
    errors.push(`${label}: entry is not an object`);
    continue;
  }

  if (!entry.id || typeof entry.id !== "string") errors.push(`${label}: missing string id`);
  if (entry.id && ids.has(entry.id)) errors.push(`${label}: duplicate id`);
  if (entry.id) ids.add(entry.id);

  if (!entry.name || typeof entry.name !== "string") errors.push(`${label}: missing name`);
  if (!entry.district || typeof entry.district !== "string") errors.push(`${label}: missing district`);
  if (entry.district && !districtSet.has(entry.district)) errors.push(`${label}: district '${entry.district}' is not listed in catalog.districts`);

  if (!entry.address) warnings.push(`${label}: missing address`);
  if (!entry.contact && !entry.phone) warnings.push(`${label}: missing contact/phone`);

  if (entry.name && /дъга/i.test(entry.name) && !/официал|дг №/i.test(entry.name)) {
    errors.push(`${label}: suspicious placeholder/demo institution name '${entry.name}'`);
  }
}

const byDistrict = rawEntries.reduce((acc, entry) => {
  const district = entry?.district || "Без район";
  acc[district] = (acc[district] || 0) + 1;
  return acc;
}, {});

const lozenetsCount = byDistrict["Лозенец"] || 0;
if (lozenetsCount < 10) warnings.push(`Лозенец has only ${lozenetsCount} entries. Expected the full PDF catalog to have more than 10.`);

console.log(`Catalog validation: ${rawEntries.length} raw entries, ${districts.length} districts.`);
console.log(`District sample: Лозенец=${lozenetsCount}, Младост=${byDistrict["Младост"] || 0}, Люлин=${byDistrict["Люлин"] || 0}`);

if (warnings.length > 0) {
  console.warn(`\nWarnings (${warnings.length}):`);
  for (const warning of warnings.slice(0, 30)) console.warn(`- ${warning}`);
  if (warnings.length > 30) console.warn(`...and ${warnings.length - 30} more warnings`);
}

if (errors.length > 0) {
  console.error(`\nErrors (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Catalog validation passed.");
