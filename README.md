# МястоЗаМясто / kg.razmeni

MVP за безплатна платформа, която помага на родители в София да намират **потенциални съвпадения** за координирано преместване между детски заведения.

Важно: приложението не е официална услуга на Столична община, ИСОДЗ или детските заведения и не гарантира прием, преместване или размяна на място.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- Vercel hosting

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment variables

Виж `.env.example`.

## Supabase

1. Създай нов Supabase project.
2. Отвори SQL Editor.
3. Пусни миграциите от `supabase/migrations` по ред.
4. Добави `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` във Vercel и `.env.local`.

## Playground simulator

Ще има dev/admin playground route `/playground`, с който можем да симулираме 4 тестови профила, заявки, match, потвърждения и чат през реалната база. Този route трябва да се пази зад env flag:

```bash
NEXT_PUBLIC_ENABLE_PLAYGROUND=true
```

Преди production launch го изключваме във Vercel.
