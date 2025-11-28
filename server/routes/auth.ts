import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { supabase } from "../utils/supabaseServerClient";

const router = Router();

// ----------------------
// SMTP GMAIL SETUP
// ----------------------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) console.error("SMTP Connection Error:", error);
  else console.log("SMTP Ready");
});

// ----------------------
// TEMPORARY STORE (OTP)
// ----------------------
const otpStore: Record<
  string,
  { otp: string; expiresAt: number; firstName: string; lastName: string; password: string }
> = {};

// ----------------------
// ZOD SCHEMAS
// ----------------------
const sendOtpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ----------------------
// CHECK EMAIL
// ----------------------
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    const { data } = await supabase.from("users").select("*").eq("email", email).single();
    res.json({ exists: !!data });
  } catch {
    res.json({ exists: false });
  }
});

// ----------------------
// SEND OTP (SIGNUP)
// ----------------------
router.post("/send-otp", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = sendOtpSchema.parse(req.body);

    // Check if user exists
    const { data: existing } = await supabase.from("users").select("*").eq("email", email).single();
    if (existing) return res.status(409).json({ error: "Email already registered" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore[email] = { otp, expiresAt, firstName, lastName, password };

    // Send email
    await transporter.sendMail({
      from: `CareSync <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <p>Your verification code is:</p>
        <h2>${otp}</h2>
        <p>It expires in 5 minutes.</p>
      `,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ----------------------
// VERIFY OTP & REGISTER USER
// ----------------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = otpSchema.parse(req.body);

    const record = otpStore[email];
    if (!record)
      return res.status(410).json({ error: "OTP expired or invalid. Restart signup." });

    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(410).json({ error: "OTP expired" });
    }

    if (otp !== record.otp)
      return res.status(400).json({ error: "Invalid OTP" });

    // Hash password
    const hashedPassword = await bcrypt.hash(record.password, 10);

    // Insert user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          email,
          password: hashedPassword,
          first_name: record.firstName,
          last_name: record.lastName,
        },
      ])
      .select()
      .single();

    if (insertError) return res.status(500).json({ error: insertError.message });

    delete otpStore[email];

    return res.json({
      message: "Account created",
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
      },
    });
  } catch {
    res.status(400).json({ error: "Invalid request" });
  }
});

// ----------------------
// LOGIN (EMAIL + PASSWORD ONLY)
// ----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data: user } = await supabase.from("users").select("*").eq("email", email).single();
    if (!user) return res.status(404).json({ error: "Account not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch {
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
