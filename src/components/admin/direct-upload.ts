"use client";
import { signUpload } from "@/app/actions/admin";

type State = { error?: string; ok?: string } | undefined;

/**
 * Форма жіберілмес бұрын файлдарды тікелей бұлтқа (Supabase) жүктейді,
 * серверге тек файлдың жолы жіберіледі. Бұлт қосылмаған болса, файл әдеттегідей серверге кетеді.
 */
export function withDirectUploads(action: (s: State, fd: FormData) => Promise<State>) {
  return async (state: State, fd: FormData): Promise<State> => {
    for (const [key, value] of [...fd.entries()]) {
      if (!(value instanceof File) || value.size === 0) continue;
      const signed = await signUpload(value.name, value.size);
      if (!signed) continue; // жергілікті сақтау
      if ("error" in signed) return { error: signed.error };
      // Беттің ішінде іске қосылуы мүмкін түрлерді (HTML, SVG, JS) жай файл ретінде сақтаймыз.
      const type = !value.type || /html|svg|xml|javascript/i.test(value.type) ? "application/octet-stream" : value.type;
      const res = await fetch(signed.url, { method: "PUT", body: value, headers: { "Content-Type": type, "x-upsert": "false" } });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (res.status === 413 || /maximum allowed size|too large|Payload too large/i.test(body))
          return { error: `«${value.name}» (${Math.round(value.size / 1048576)} МБ) Supabase қоймасының бір файлға арналған шегінен үлкен. Supabase → Storage → Settings бөлімінде «Upload file size limit» мәнін көтеріңіз (тегін жоспарда ең көбі 50 МБ). Үлкен бейнені YouTube-қа салып, сілтемесін қосуға да болады.` };
        return { error: "Файлды жүктеу мүмкін болмады. Интернетті тексеріп, қайталап көріңіз." };
      }
      fd.set(key, `__uploaded:${JSON.stringify({ path: signed.path, name: value.name })}`);
    }
    return action(state, fd);
  };
}
