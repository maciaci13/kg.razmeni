# Как работи системата заедно

Този документ обяснява как GitHub, Vercel, Supabase и приложението работят заедно.

## 1. GitHub

GitHub е мястото, където пазим кода и SQL миграциите.

В repo-то държим:

- Next.js app кода
- UI компоненти
- Supabase client логика
- SQL миграции в `supabase/migrations`
- документация и инструкции

GitHub не е базата данни. Той е версията на проекта и историята на промените.

## 2. Supabase

Supabase е реалната backend система:

- Postgres база данни
- Auth
- Row Level Security
- таблици
- функции
- real-time/чат по-късно

Когато потребител се регистрира или създаде заявка, данните се записват директно в Supabase чрез приложението, не в GitHub.

## 3. Vercel

Vercel хоства Next.js приложението.

При всеки push към GitHub, Vercel прави нов deploy. Приложението във Vercel използва environment variables, за да знае към кой Supabase проект да се свърже.

Основни env variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ENABLE_PLAYGROUND=true
```

По-късно, за server-only admin/playground операции:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

Този ключ не се излага във frontend.

## 4. Защо миграциите сега се пускат ръчно

В началото пускаме SQL миграциите ръчно в Supabase SQL Editor, за да създадем началната структура на базата.

Това е еднократна setup стъпка, не е начинът, по който потребителските данни ще се въвеждат.

След като таблиците съществуват, приложението автоматично ще записва и чете данни през Supabase API.

## 5. Реален flow при регистрация

1. Потребителят отваря приложението във Vercel.
2. Натиска регистрация.
3. Supabase Auth създава запис в `auth.users`.
4. Нашето приложение създава/синхронизира профил в `public.app_users`.
5. Потребителят създава заявка.
6. Заявката се записва в `public.swap_requests`.
7. Желаните градини се записват в `public.swap_request_wanted_kindergartens`.
8. Matching engine намира потенциални съвпадения.
9. Създават се записи в `matches`, `match_participants`, `chats`, `notifications`.
10. Чатът се отключва само след потвърждение от всички участници.

## 6. Playground simulator

Playground route `/playground` ще използва реалните таблици и реалната matching логика, но с тестови playground потребители.

Целта е да можем да тестваме:

- 2-way match
- 3-way cycle
- 4-way cycle
- confirmation flow
- locked/unlocked chat
- messages
- coordination statuses
- completion flow

Playground се скрива чрез:

```env
NEXT_PUBLIC_ENABLE_PLAYGROUND=false
```

преди production launch.
