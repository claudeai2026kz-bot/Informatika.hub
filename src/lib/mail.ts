import "server-only";

/**
 * Email жіберу. RESEND_API_KEY және MAIL_FROM орнатылса, Resend арқылы жібереді.
 * Орнатылмаса, хат жіберілмейді (false қайтарады) және бұл интерфейсте ашық айтылады.
 */
export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail(to: string, subject: string, html: string) {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV !== "production") console.info(`[mail:dev] ${to} · ${subject}\n${html}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, html }),
  });
  return res.ok;
}
