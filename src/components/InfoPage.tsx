export default function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold">{title}</h1>
      <div className="mt-6 card p-6 sm:p-8 space-y-4 text-ink-soft leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_h2]:pt-2">{children}</div>
    </div>
  );
}
