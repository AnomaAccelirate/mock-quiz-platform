import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(toEmail, code) {
  await resend.emails.send({
    from: process.env.MAIL_FROM,
    to: toEmail,
    subject: "Your exam login code",
    html: `<p>Your one-time login code is:</p>
           <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
           <p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>`,
  });
}
