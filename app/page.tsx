import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper paper-texture px-5 py-8 text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-between rounded-[2.5rem] bg-milk p-7 shadow-soft">
        <div>
          <div className="mb-10 flex items-center justify-between">
            <div className="h-12 w-12 rounded-full bg-ink" />
            <span className="rounded-full bg-beige px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">MVP</span>
          </div>

          <div className="relative mb-10 h-56 overflow-hidden rounded-[2rem] bg-beige p-5">
            <div className="absolute left-8 top-10 h-4 w-4 rounded-full bg-orange" />
            <div className="absolute right-10 top-16 h-5 w-5 rounded-full bg-lime" />
            <div className="absolute bottom-12 left-1/2 h-4 w-4 rounded-full bg-lavender" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 220" fill="none" aria-hidden="true">
              <path d="M45 62 C120 28, 160 180, 275 68" stroke="#171712" strokeWidth="3" strokeDasharray="8 9" />
              <path d="M75 170 C145 108, 205 112, 255 172" stroke="#171712" strokeWidth="2" opacity="0.3" />
            </svg>
            <div className="absolute bottom-5 left-5 right-5 rounded-3xl bg-milk/90 p-4 backdrop-blur">
              <p className="text-sm font-semibold">Хора, свързани чрез места.</p>
              <p className="mt-1 text-xs text-ink/60">Всяка заявка е точка. Всяко съвпадение е маршрут.</p>
            </div>
          </div>

          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.06em]">Място<br />ЗаМясто</h1>
          <p className="mt-5 text-xl font-semibold leading-tight">По-добро място за твоето дете.</p>
          <p className="mt-5 text-sm leading-6 text-ink/65">
            Безплатна независима платформа за потенциални съвпадения между родители за координирано преместване между детски заведения.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/playground" className="block rounded-full bg-ink px-6 py-4 text-center text-base font-bold text-white">
            Отвори playground
          </Link>
          <p className="text-center text-xs leading-5 text-ink/50">
            Не е официална услуга и не гарантира прием, преместване или размяна.
          </p>
        </div>
      </section>
    </main>
  );
}
