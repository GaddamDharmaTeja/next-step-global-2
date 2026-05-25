import { Router } from "express";
import nodemailer from "nodemailer";
import { SendNotificationBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router = Router();

function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

async function sendEmail(to: string, subject: string, message: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: message,
      html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
    });
    return true;
  } catch {
    return false;
  }
}

async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      From: from,
      To: `whatsapp:${to}`,
      Body: message,
    });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: body.toString(),
    });
    return response.ok;
  } catch {
    return false;
  }
}

router.post("/send", requireAdmin, async (req, res): Promise<void> => {
  const result = SendNotificationBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.message });
    return;
  }

  const { channel, recipientEmail, recipientPhone, subject, message } = result.data;

  let emailSent = false;
  let whatsappSent = false;

  if ((channel === "email" || channel === "both") && recipientEmail) {
    emailSent = await sendEmail(recipientEmail, subject, message);
  }

  if ((channel === "whatsapp" || channel === "both") && recipientPhone) {
    whatsappSent = await sendWhatsApp(recipientPhone, `${subject}\n\n${message}`);
  }

  const success =
    (channel === "email" && emailSent) ||
    (channel === "whatsapp" && whatsappSent) ||
    (channel === "both" && (emailSent || whatsappSent));

  res.json({
    success,
    emailSent,
    whatsappSent,
    message: success
      ? "Notification sent successfully"
      : "Notification could not be sent. Please configure SMTP or Twilio credentials.",
  });
});

router.get("/templates", requireAdmin, async (_req, res): Promise<void> => {
  const { readStore } = await import("../lib/store");
  const store = await readStore();
  res.json(store.notificationTemplates);
});

export default router;
