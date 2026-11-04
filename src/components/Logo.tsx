import Link from "next/link";

export default function Logo({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group" aria-label="Informatika Hub басты беті">
      <span className={`relative grid place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-lilac-500 text-white shadow-lift transition group-hover:rotate-6 ${small ? "h-8 w-8" : "h-10 w-10"}`}>
        <svg viewBox="0 0 24 24" className={small ? "h-4 w-4" : "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />
        </svg>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-white" />
      </span>
      <span className={`font-extrabold tracking-tight leading-none ${small ? "text-base" : "text-lg"}`}>
        INFORMATIKA <span className="gradient-text">HUB</span>
      </span>
    </Link>
  );
}
