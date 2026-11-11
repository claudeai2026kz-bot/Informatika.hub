import "server-only";
import nodemailer from "nodemailer";

/**
 * Email жіберу. Екі жол бар:
 * 1) Gmail (немесе кез келген SMTP): SMTP_USER + SMTP_PASS орнатылса.
 *    Gmail үшін SMTP_PASS — Google аккаунттағы «қолданба құпиясөзі» (16 әріп).
 *    SMTP_HOST әдепкіде smtp.gmail.com, SMTP_PORT әдепкіде 465.
 * 2) Resend: RESEND_API_KEY + MAIL_FROM орнатылса (өз домен керек).
 * Ешқайсысы орнатылмаса, хат жіберілмейді (false қайтарады) және бұл интерфейсте ашық айтылады.
 */
function smtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export function mailConfigured() {
  return smtpConfigured() || resendConfigured();
}

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function smtp() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS || "").replace(/\s+/g, "") },
    });
  }
  return transport;
}

export async function sendMail(to: string, subject: string, html: string) {
  if (smtpConfigured()) {
    try {
      await smtp().sendMail({ from: process.env.MAIL_FROM || `Informatika Hub <${process.env.SMTP_USER}>`, to, subject, html });
      return true;
    } catch (e) {
      console.error("[mail] SMTP error:", e instanceof Error ? e.message : e);
      return false;
    }
  }
  if (resendConfigured()) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, html }),
    });
    return res.ok;
  }
  if (process.env.NODE_ENV !== "production") console.info(`[mail:dev] ${to} · ${subject}\n${html}`);
  return false;
}
