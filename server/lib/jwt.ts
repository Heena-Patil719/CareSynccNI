import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  role: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "userId" in decoded &&
      "role" in decoded &&
      typeof decoded.userId === "string" &&
      typeof decoded.role === "string"
    ) {
      return {
        userId: decoded.userId,
        role: decoded.role,
      };
    }

    return null;
  } catch {
    return null;
  }
}
