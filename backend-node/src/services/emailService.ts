import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL =
  process.env.SENDGRID_FROM_EMAIL || "noreply@newsaggregator.demo";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export const sendOTP = async (email: string, otp: string): Promise<void> => {
  if (!SENDGRID_API_KEY) {
    // Fallback for development if no key is provided
    console.warn(
      `[SendGrid Warning] No API Key found. Simulating sending OTP: ${otp} to ${email}`,
    );
    return;
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: "Your Verification Code",
    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `<strong>Your verification code is: ${otp}</strong><br>It will expire in 10 minutes.`,
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] OTP sent successfully to ${email}`);
    console.log(`[Dev] The OTP code is: ${otp}`); // For testing so you don't get stuck!
  } catch (error) {
    console.error(`[Email Error] Failed to send OTP to ${email}:`, error);
    throw new Error("Failed to send verification email.");
  }
};
