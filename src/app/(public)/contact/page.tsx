import InfoPage from "@/components/InfoPage";
export const metadata = { title: "Байланыс" };
export default function Contact() {
  const email = process.env.CONTACT_EMAIL;
  return (
    <InfoPage title="Байланыс">
      <p>Ұсыныс, сұрақ немесе материал жіберу үшін бізге жазыңыз.</p>
      {email ? <p>Email: <a className="font-semibold text-sky-600" href={`mailto:${email}`}>{email}</a></p> : <p className="text-amber-700">Байланыс email-і әлі бапталмаған (CONTACT_EMAIL).</p>}
    </InfoPage>
  );
}
