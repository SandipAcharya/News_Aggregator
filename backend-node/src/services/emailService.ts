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

export const sendPasswordResetOTP = async (email: string, otp: string): Promise<void> => {
  if (!SENDGRID_API_KEY) {
    console.warn(`[SendGrid Warning] No API Key found. Simulating sending Password Reset OTP: ${otp} to ${email}`);
    return;
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: "Password Reset OTP",
    text: `Your password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.`,
    html: `
      <h2>Password Reset OTP</h2>
      <p>Your password reset OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] Password Reset OTP sent successfully to ${email}`);
    console.log(`[Dev] The Password Reset OTP code is: ${otp}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send Password Reset OTP to ${email}:`, error);
    throw new Error("Failed to send password reset email.");
  }
};
