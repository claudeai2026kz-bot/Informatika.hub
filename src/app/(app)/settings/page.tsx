import { Globe, Volume2, Bell, Shield, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import ActionForm from "@/components/ui/ActionForm";
import SubmitButton from "@/components/ui/SubmitButton";
import { updateSettings } from "@/app/actions/profile";
import { logoutAction } from "@/app/actions/auth";
import PrefsSwitcher from "@/components/PrefsSwitcher";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("Баптаулар") };
}

function Toggle({ name, label, hint, on, icon }: { name: string; label: string; hint: string; on: boolean; icon: React.ReactNode }) {
  return (
    <label className="flex items-center gap-4 py-4 cursor-pointer">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-600">{icon}</span>
      <span className="flex-1"><span className="block font-semibold">{label}</span><span className="block text-sm muted">{hint}</span></span>
      <input type="checkbox" name={name} defaultChecked={on} className="peer sr-only" />
      <span className="relative h-7 w-12 rounded-full bg-sky-200 transition peer-checked:bg-sky-500 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-sky-100" />
    </label>
  );
}

export default async function SettingsPage() {
  const t = await getT();
  const user = await requireUser("/settings");
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-3xl font-extrabold">{t("Баптаулар")}</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-600"><Globe className="h-5 w-5" /></span>
          <div className="flex-1"><div className="font-semibold">{t("Режим және тіл")}</div><div className="text-sm muted">{t("Таңдауыңыз аккаунтыңызда сақталады")}</div></div>
        </div>
        <PrefsSwitcher full />
      </div>
      <ActionForm action={updateSettings} className="card px-6 py-2 divide-y divide-sky-100">
        <Toggle name="soundOn" label={t("Робот дыбысы")} hint={t("Робот жауап бергенде қысқа дыбыстық белгі")} on={user.soundOn} icon={<Volume2 className="h-5 w-5" />} />
        <Toggle name="notifyOn" label={t("Хабарламалар")} hint={t("Жаңа материалдар туралы хабарлама алу")} on={user.notifyOn} icon={<Bell className="h-5 w-5" />} />
        <Toggle name="profilePublic" label={t("Құпиялық")} hint={t("Пікірлерде толық атымды көрсету")} on={user.profilePublic} icon={<Shield className="h-5 w-5" />} />
        <div className="py-4"><SubmitButton className="btn-primary">{t("Сақтау")}</SubmitButton></div>
      </ActionForm>
      <div className="card p-6 flex flex-wrap items-center gap-3">
        <Link href="/profile" className="btn-ghost"><KeyRound className="h-4 w-4" /> {t("Құпиясөзді ауыстыру")}</Link>
        <form action={logoutAction}><button className="btn-danger"><LogOut className="h-4 w-4" /> {t("Аккаунттан шығу")}</button></form>
      </div>
    </div>
  );
}
