import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; html?: string };

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/** Sends mail if SMTP is configured; otherwise logs to console and reports delivered=false. */
export async function sendMail(m: Mail): Promise<{ delivered: boolean }> {
  const t = getTransporter();
  const from = process.env.MAIL_FROM || "HPM3 Hoops <no-reply@hpm3hoops.com>";
  if (!t) {
    console.log(`[mail:not-configured] to=${m.to} subject="${m.subject}"\n${m.text}`);
    return { delivered: false };
  }
  try {
    await t.sendMail({ from, to: m.to, subject: m.subject, text: m.text, html: m.html });
    return { delivered: true };
  } catch (e) {
    console.error("[mail:error]", e);
    return { delivered: false };
  }
}
