import "dotenv/config";
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import nodemailer, { type Transporter } from "nodemailer";
import { ObjectId } from "mongodb";
import { getDb, toObjectId } from "../utils/mongo";

const router = Router();

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeOtp = (otp: string) => otp.replace(/\D/g, "").slice(0, 6);

type OtpRecord = {
  otp: string;
  expiresAt: number;
  firstName: string;
  lastName: string;
  password: string;
};

type OtpStore = Record<string, OtpRecord>;

type UserDocument = {
  _id: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "admin" | "user" | "viewer" | "editor";
  address?: string;
  createdAt?: Date | string;
  lastLogin?: Date | string;
};

const globalAuthState = globalThis as typeof globalThis & {
  __careSyncOtpStore?: OtpStore;
  __careSyncTransporter?: Transporter;
};

function getTransporter() {
  if (!globalAuthState.__careSyncTransporter) {
    const email = process.env.SMTP_EMAIL?.trim();
    const password = process.env.SMTP_APP_PASSWORD?.trim();

    if (!email || !password) {
      throw new Error("SMTP_EMAIL or SMTP_APP_PASSWORD is not configured");
    }

    globalAuthState.__careSyncTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: password,
      },
    });
  }

  return globalAuthState.__careSyncTransporter;
}

const otpStore: OtpStore = globalAuthState.__careSyncOtpStore ?? {};
globalAuthState.__careSyncOtpStore = otpStore;

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

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  address: z.string().optional(),
});

function mapUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role === "admin" ? "admin" : "user",
    address: user.address ?? "",
  };
}

async function getUsersCollection() {
  const db = await getDb();
  return db.collection<UserDocument>("users");
}

router.post("/check-email", async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body?.email ?? ""));
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email });
    return res.json({ exists: !!user });
  } catch (error) {
    console.error("CHECK EMAIL ERROR:", error);
    return res.status(500).json({ error: "Failed to check email" });
  }
});

router.post("/send-otp", async (req, res) => {
  try {
    const parsed = sendOtpSchema.parse(req.body);
    const email = normalizeEmail(parsed.email);

    const users = await getUsersCollection();
    const existing = await users.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore[email] = {
      otp,
      expiresAt,
      firstName: parsed.firstName.trim(),
      lastName: parsed.lastName.trim(),
      password: parsed.password,
    };

    await getTransporter().sendMail({
      from: `CareSync <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <p>Your verification code is:</p>
        <h2>${otp}</h2>
        <p>It expires in 5 minutes.</p>
      `,
    });

    return res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send OTP",
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const parsed = otpSchema.parse(req.body);
    const email = normalizeEmail(parsed.email);
    const otp = normalizeOtp(parsed.otp);
    const record = otpStore[email];

    if (!record) {
      return res.status(410).json({ error: "OTP expired or invalid. Restart signup." });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(410).json({ error: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const users = await getUsersCollection();
    const existing = await users.findOne({ email });
    if (existing) {
      delete otpStore[email];
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(record.password, 10);
    const createdAt = new Date();
    const insertResult = await users.insertOne({
      email,
      password: hashedPassword,
      firstName: record.firstName,
      lastName: record.lastName,
      role: "user",
      createdAt,
      lastLogin: createdAt,
      address: "",
    } as any);

    const user = await users.findOne({ _id: insertResult.insertedId });
    delete otpStore[email];

    if (!user) {
      return res.status(500).json({ error: "Failed to create account" });
    }

    return res.json({
      message: "Account created",
      user: mapUser(user),
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to verify OTP",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const email = normalizeEmail(parsed.email);
    const password = parsed.password;

    const users = await getUsersCollection();
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }

    let match = false;
    if (typeof user.password === "string" && user.password.startsWith("$2")) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = user.password === password;
      if (match) {
        const upgradedPassword = await bcrypt.hash(password, 10);
        await users.updateOne({ _id: user._id }, { $set: { password: upgradedPassword } });
        user.password = upgradedPassword;
      }
    }

    if (!match) {
      return res.status(401).json({ error: "Invalid password" });
    }

    await users.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    return res.json({
      message: "Login successful",
      user: mapUser(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Login failed",
    });
  }
});

router.get("/profile/:userId", async (req, res) => {
  try {
    const objectId = toObjectId(req.params.userId);
    if (!objectId) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ _id: objectId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: mapUser(user) });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

router.put("/profile/:userId", async (req, res) => {
  try {
    const objectId = toObjectId(req.params.userId);
    if (!objectId) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const parsed = updateProfileSchema.parse(req.body);
    const updates: Partial<UserDocument> = {};

    if (parsed.firstName !== undefined) updates.firstName = parsed.firstName.trim();
    if (parsed.lastName !== undefined) updates.lastName = parsed.lastName.trim();
    if (parsed.address !== undefined) updates.address = parsed.address.trim();

    const users = await getUsersCollection();
    await users.updateOne({ _id: objectId }, { $set: updates });
    const user = await users.findOne({ _id: objectId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: mapUser(user) });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
