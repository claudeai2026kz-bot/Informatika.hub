import Logo from "./Logo";
import AuthGuide from "./AuthGuide";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink p-10 text-white">
        <div aria-hidden className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-sky-400/30 blur-3xl animate-blob" />
        <div aria-hidden className="absolute right-0 top-0 h-80 w-80 rounded-full bg-lilac-400/30 blur-3xl animate-blob [animation-delay:-7s]" />
        <div className="relative [&_span]:!text-white"><Logo /></div>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">Информатика мұғалімдеріне арналған <span className="text-sky-300">ақылды көмекші</span></h2>
          <p className="mt-4 text-white/70 max-w-md">Сапалы, дайын, жүйеленген материалдар уақытыңызды үнемдейді.</p>
        </div>
        <div className="relative flex justify-center"><AuthGuide /></div>
      </aside>
      <main className="flex flex-col px-4 sm:px-6 py-8">
        <div className="lg:hidden"><Logo /></div>
        <div className="flex-1 grid place-items-center py-10">
          <div className="w-full max-w-md page-enter">
            <div className="lg:hidden"><AuthGuide compact /></div>
            <h1 className="text-3xl font-extrabold">{title}</h1>
            <p className="mt-2 muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
