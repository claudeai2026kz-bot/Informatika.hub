export function FieldError({ msg, id }: { msg?: string; id?: string }) {
  if (!msg) return null;
  return <p id={id} role="alert" className="mt-1.5 text-sm text-rose-600">{msg}</p>;
}

export function FormAlert({ msg, tone = "error" }: { msg?: string; tone?: "error" | "ok" | "info" }) {
  if (!msg) return null;
  const c = tone === "error" ? "bg-rose-50 border-rose-200 text-rose-700" : tone === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-sky-50 border-sky-200 text-sky-700";
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{msg}</div>;
}
