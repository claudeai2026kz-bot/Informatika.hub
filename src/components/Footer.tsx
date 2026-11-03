import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-sky-100 bg-white/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm muted max-w-xs">Информатика мұғалімдеріне арналған ақылды көмекші: 5–11 сыныптың дайын материалдары бір жерде.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Платформа</h3>
          <ul className="space-y-2 text-sm muted">
            <li><Link className="hover:text-sky-600" href="/materials">Материалдар</Link></li>
            <li><Link className="hover:text-sky-600" href="/assessments">БЖБ / ТЖБ</Link></li>
            <li><Link className="hover:text-sky-600" href="/games">Ойындар</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Ақпарат</h3>
          <ul className="space-y-2 text-sm muted">
            <li><Link className="hover:text-sky-600" href="/about">Жоба туралы</Link></li>
            <li><Link className="hover:text-sky-600" href="/contact">Байланыс</Link></li>
            <li><Link className="hover:text-sky-600" href="/support">Қолдау қызметі</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Құқықтық</h3>
          <ul className="space-y-2 text-sm muted">
            <li><Link className="hover:text-sky-600" href="/privacy">Құпиялық саясаты</Link></li>
            <li><Link className="hover:text-sky-600" href="/terms">Пайдалану ережелері</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sky-100 py-5 text-center text-xs muted">
        © {new Date().getFullYear()} Informatika Hub. Барлық құқықтар қорғалған. Материалдар авторларының құқығы сақталады.
      </div>
    </footer>
  );
}
