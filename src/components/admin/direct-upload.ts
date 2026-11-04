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
      const res = await fetch(signed.url, { method: "PUT", body: value, headers: { "Content-Type": value.type || "application/octet-stream", "x-upsert": "false" } });
      if (!res.ok) return { error: "Файлды жүктеу мүмкін болмады. Интернетті тексеріп, қайталап көріңіз." };
      fd.set(key, `__uploaded:${JSON.stringify({ path: signed.path, name: value.name })}`);
    }
    return action(state, fd);
  };
}
