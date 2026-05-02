# Sofia catalog — МястоЗаМясто

Runtime catalog source:

```txt
data/sofia/mzm-catalog.json
```

The app must read only this editable plain JSON file. The compressed PDF bundle is an archive/reference and must not be used by runtime code.

## Structure

The important editable section is `rawEntries`.

Each row is one selectable option in the app. Do not merge buildings, branches or hourly organizations unless the municipality explicitly removes them.

Recommended fields:

```json
{
  "id": "raw-dg-019-main",
  "institutionId": "dg-019",
  "name": "ДГ №19 Света София",
  "district": "Лозенец",
  "address": "гр. София, ул. Христо Смирненски, №36",
  "contact": "02/866 12 30",
  "entryType": "main",
  "hasNurseryGroups": false,
  "isHourlyOrganization": false,
  "source": "pdf-catalog-2026-05-02"
}
```

## How to update contacts

Change only `contact` on the relevant `rawEntries` row.

Example:

```json
"contact": "02/866 12 30; 0888 000 000"
```

## How to add a new building

Add a new row to `rawEntries` with the same `institutionId` and a unique `id`.

Example:

```json
{
  "id": "raw-dg-019-b2",
  "institutionId": "dg-019",
  "name": "ДГ №19 Света София - сграда 2",
  "district": "Лозенец",
  "address": "гр. София, ...",
  "contact": "02/...",
  "entryType": "building",
  "hasNurseryGroups": false,
  "isHourlyOrganization": false,
  "source": "manual-update-YYYY-MM-DD"
}
```

## Entry types

Use:

- `main` — main institution row
- `building` — additional building / branch
- `hourly` — hourly organization

## Categories

The loader infers the selectable category:

- name includes `СДЯ` or `детска ясла` → `Ясла`
- `hasNurseryGroups: true` or name includes `с яслени групи` → `Детска градина с яслени групи`
- otherwise → `ДГ`

## Validation before deploy

Run:

```bash
npm run validate:catalog
```

The script checks:

- `rawEntries` is not empty
- every row has `id`, `name`, `district`
- every district is included in `districts`
- duplicate ids
- missing contact/address warnings
- stats consistency

## Rule

Never add demo or placeholder institutions such as `Дъга` to this file. The app should never show records that are not present in `mzm-catalog.json`.
