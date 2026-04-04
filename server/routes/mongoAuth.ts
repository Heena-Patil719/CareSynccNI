import { Router } from "express";
import { z } from "zod";
import { connectToMongo } from "../lib/mongo";
import { generateToken } from "../lib/jwt";
import User from "../models/User";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .refine((value) => !value || value.length >= 7, "Phone number is too short");

const optionalTextSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? undefined : value))
    .refine((value) => !value || value.length >= 2, `${fieldName} is too short`);

const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phoneNumber: optionalPhoneSchema,
  organization: optionalTextSchema("Organization"),
  jobTitle: optionalTextSchema("Job title"),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required"),
});

function isDuplicateEmailError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function formatUser(user: {
  _id: { toString(): string };
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  organization?: string;
  jobTitle?: string;
  role: string;
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    organization: user.organization,
    jobTitle: user.jobTitle,
    role: user.role,
  };
}

function normalizeOptionalField(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

router.post("/signup", async (req, res) => {
  try {
    await connectToMongo();
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      organization,
      jobTitle,
    } = signupSchema.parse(req.body);

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber: normalizeOptionalField(phoneNumber),
      organization: normalizeOptionalField(organization),
      jobTitle: normalizeOptionalField(jobTitle),
    });

    return res.status(201).json({
      message: "Account created",
      user: formatUser(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        fieldErrors: error.flatten().fieldErrors,
      });
    }

    if (isDuplicateEmailError(error)) {
      return res.status(409).json({ error: "Email already exists" });
    }

    console.error("Mongo signup error:", error);
    return res.status(500).json({ error: "Failed to create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    await connectToMongo();
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id.toString(), user.role);

    return res.json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        fieldErrors: error.flatten().fieldErrors,
      });
    }

    console.error("Mongo login error:", error);
    return res.status(500).json({ error: "Failed to login" });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    await connectToMongo();
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: formatUser(user) });
  } catch (error) {
    console.error("Mongo me error:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
