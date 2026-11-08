import InfoPage from "@/components/InfoPage";
import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("Байланыс") };
}
export default async function Contact() {
  const t = await getT();
  const email = process.env.CONTACT_EMAIL;
  return (
    <InfoPage title={t("Байланыс")}>
      <p>{t("Ұсыныс, сұрақ немесе материал жіберу үшін бізге жазыңыз.")}</p>
      {email ? <p>Email: <a className="font-semibold text-sky-600" href={`mailto:${email}`}>{email}</a></p> : <p className="text-amber-700">{t("Байланыс email-і әлі бапталмаған (CONTACT_EMAIL).")}</p>}
    </InfoPage>
  );
}
