export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-4" aria-label="Жүктеліп жатыр">
      <div className="skeleton h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-44" />)}</div>
    </div>
  );
}
