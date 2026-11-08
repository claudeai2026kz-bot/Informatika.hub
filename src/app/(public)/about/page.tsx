import InfoPage from "@/components/InfoPage";
import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("Жоба туралы") };
}
export default async function About() {
  const t = await getT();
  return (
    <InfoPage title={t("Жоба туралы")}>
      <p>{t("Informatika Hub: 5–11 сыныптарда сабақ беретін информатика мұғалімдеріне арналған цифрлық көмекші платформа.")}</p>
      <p>{t("Мұнда презентациялар, бейнесабақтар, практикалық тапсырмалар, ҚМЖ, БЖБ мен ТЖБ және интерактивті ойындар сынып, тоқсан және тақырып бойынша жүйеленген.")}</p>
      <h2>{t("Мақсатымыз")}</h2>
      <p>{t("Мұғалімнің сабаққа дайындалу уақытын қысқартып, сапалы материалдарды бір жерге жинау.")}</p>
    </InfoPage>
  );
}
