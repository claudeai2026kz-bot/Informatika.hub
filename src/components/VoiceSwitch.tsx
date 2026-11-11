"use client";
import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { setVoiceOff, speak, voiceOff, VOICE_EVENT } from "@/lib/speech";
import { setVoiceAction } from "@/app/actions/profile";

/** Баптаулардағы «Робот дауысы» қосқышы. Басқанда бірден аккаунтқа сақталады. */
export default function VoiceSwitch({ initial }: { initial: boolean }) {
  const t = useT();
  const [on, setOn] = useState(initial);

  useEffect(() => {
    const sync = () => setOn(!voiceOff());
    if (initial === voiceOff()) setVoiceOff(!initial); // аккаунттағы таңдау басым
    sync();
    window.addEventListener(VOICE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(VOICE_EVENT, sync); window.removeEventListener("storage", sync); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function change(v: boolean) {
    setOn(v);
    setVoiceOff(!v);
    void setVoiceAction(v).catch(() => {});
    if (v) speak(t("Дауыс қосылды"));
  }

  return (
    <label className="flex items-center gap-4 cursor-pointer">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-600">{on ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</span>
      <span className="flex-1">
        <span className="block font-semibold">{t("Робот дауысы")}</span>
        <span className="block text-sm muted">{t(on ? "Робот сөйлейді. Өшірсеңіз, тек жазумен жауап береді" : "Өшірулі: робот үнсіз, тек жазумен жауап береді")}</span>
      </span>
      <input type="checkbox" checked={on} onChange={(e) => change(e.target.checked)} className="peer sr-only" aria-label={t("Робот дауысы")} />
      <span className="relative h-7 w-12 rounded-full bg-sky-200 transition peer-checked:bg-sky-500 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-sky-100" />
    </label>
  );
}
