import nodemailer from "nodemailer";

export function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD missing in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendResetEmail({ to, resetUrl }) {
  const transporter = createTransporter();

  const from = `Saheli 2.0 <${process.env.GMAIL_USER}>`;
  const subject = "Reset your Saheli password";

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password.</p>
    <p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;background:#ef4444;color:#fff;text-decoration:none;border-radius:10px;">
        Reset Password
      </a>
    </p>
    <p>If the button doesn't work, paste this link in your browser:</p>
    <p style="word-break: break-all;">${resetUrl}</p>
    <p>This link will expire soon. If you did not request this, please ignore this email.</p>
  </div>`;

  await transporter.sendMail({ from, to, subject, html });
}