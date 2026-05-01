# Sofia kindergarten / school source data

Тази папка е запазена за локални/официални източници от SofiaPlan и Столична община.

Към текущия билд каталогът се зарежда server-side от публичното API на SofiaPlan, вместо от placeholder fallback данни.

## Полезни източници

- `https://api.sofiaplan.bg/datasets` — списък с публични набори.
- `https://api.sofiaplan.bg/datasets/142` — детски градини / ясли, GeoJSON.
- `https://api.sofiaplan.bg/datasets/166` — училища, GeoJSON.
- `https://api.sofiaplan.bg/datasets/628` — райони, GeoJSON.
- `https://kg.sofia.bg/#/home` — официален родителски интерфейс.

## Файлове, намерени за допълнително обогатяване

- `Регистър-ДГ-2025-2026-1.xlsx` — актуален регистър с групи, капацитет и контакти.
- `dg_reg_karti_26_sofpr_20180808.geojson.json` — регистър карти: име, район, адрес, телефон, email, сайт, директор, тип.
- `dg_reg_karti_grupi_26_sofpr_20180808.json` — групи по регистър карта: яслена, първа, втора, подготвителни и брой деца.
- `dg_sgr_26_sofpr_20180808_mv.json` — сгради/адресни записи.
- `dg_pi_26_sofpr_20180808_mv.json` — имоти/парцели.

Бележка: бинарният `.xlsx` не е подходящ за директен import в Next runtime. За приложението е по-добре да се нормализира в JSON snapshot или да се държи като source artifact извън runtime bundle.