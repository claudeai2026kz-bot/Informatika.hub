"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Undo2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/** Профиль суретін таңдау: суретті басып ауыстырады, таңдағаны бірден көрінеді, қаласа өшіреді. */
export default function AvatarPicker({ src, initials }: { src: string | null; initials: string }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const shown = remove ? null : preview ?? src;
  const pick = (f: File | undefined) => {
    setErr("");
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { setErr(t("Тек PNG, JPG немесе WEBP сурет таңдаңыз")); if (input.current) input.current.value = ""; return; }
    if (f.size > 3 * 1024 * 1024) { setErr(t("Сурет 3 МБ-тан аспауы керек")); if (input.current) input.current.value = ""; return; }
    setRemove(false);
    setPreview(URL.createObjectURL(f));
  };
  const clear = () => { if (input.current) input.current.value = ""; setPreview(null); };

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={() => input.current?.click()} className="group relative h-28 w-28 rounded-full ring-4 ring-sky-100 focus-visible:ring-sky-400" aria-label={t("Профиль суретін таңдау")}>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={t("Профиль суреті")} className="h-28 w-28 rounded-full object-cover" />
        ) : (
          <span className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-lilac-500 text-4xl font-bold text-white">{initials}</span>
        )}
        <span className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-white shadow-lg ring-4 ring-white transition group-hover:scale-110"><Camera className="h-4 w-4" /></span>
      </button>
      <input ref={input} type="file" name="avatar" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      <input type="hidden" name="removeAvatar" value={remove ? "on" : ""} />
      <p className="text-xs muted text-center">{preview ? t("Жаңа сурет таңдалды — «Сақтау» батырмасын басыңыз") : t("Суретті ауыстыру үшін оны басыңыз (PNG, JPG, WEBP, 3 МБ дейін)")}</p>
      {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
      <div className="flex gap-2">
        {preview && <button type="button" onClick={clear} className="btn-ghost btn-sm"><Undo2 className="h-4 w-4" /> {t("Болдырмау")}</button>}
        {!preview && src && !remove && <button type="button" onClick={() => setRemove(true)} className="btn-ghost btn-sm text-rose-600"><Trash2 className="h-4 w-4" /> {t("Суретті өшіру")}</button>}
        {remove && <button type="button" onClick={() => setRemove(false)} className="btn-ghost btn-sm"><Undo2 className="h-4 w-4" /> {t("Өшірмеу")}</button>}
      </div>
    </div>
  );
}
