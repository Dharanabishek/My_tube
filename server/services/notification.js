import nodemailer from "nodemailer";

export function createMailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html, text }) {
  const transporter = createMailTransporter();
  if (!transporter || !to) {
    console.log("Email not configured. Intended email:", { to, subject, text });
    return { skipped: true };
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
}

export async function sendSms({ to, message }) {
  if (!process.env.SMS_WEBHOOK_URL || !to) {
    console.log("SMS not configured. Intended SMS:", { to, message });
    return { skipped: true };
  }

  const response = await fetch(process.env.SMS_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SMS_WEBHOOK_TOKEN
        ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ to, message }),
  });

  if (!response.ok) {
    throw new Error(`SMS provider failed with ${response.status}`);
  }

  return response.json().catch(() => ({ ok: true }));
}
