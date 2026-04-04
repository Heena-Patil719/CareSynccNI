import { useEffect, useState } from "react";
import {
  getCurrentUser,
  removeToken,
  saveToken,
  type MongoUser,
} from "@/lib/mongoAuth";

interface AuthErrorResponse {
  error?: string;
}

interface FieldErrorResponse {
  fieldErrors?: Partial<
    Record<"email" | "password" | "firstName" | "lastName" | "phoneNumber" | "organization" | "jobTitle", string[]>
  >;
}

interface LoginResponse {
  token: string;
  user: MongoUser;
}

interface SignupResponse {
  message: string;
  user: MongoUser;
}

const API_BASE = "/api/mongo-auth";

async function parseError(response: Response): Promise<string> {
  const fallbackMessage = "Something went wrong";

  try {
    const data = (await response.json()) as AuthErrorResponse & FieldErrorResponse;

    const fieldMessage = data.fieldErrors
      ? Object.values(data.fieldErrors).find((messages) => messages && messages.length > 0)?.[0]
      : null;

    return fieldMessage ?? data.error ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function useMongoAuth() {
  const [user, setUser] = useState<MongoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (restoreError) {
        console.error("Failed to restore Mongo auth session:", restoreError);
      } finally {
        setLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<MongoUser> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as LoginResponse;
      saveToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Login failed";
      setError(message);
      throw loginError;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber?: string,
    organization?: string,
    jobTitle?: string,
  ): Promise<MongoUser> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phoneNumber,
          organization,
          jobTitle,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      await response.json() as SignupResponse;

      return await login(email, password);
    } catch (signupError) {
      const message = signupError instanceof Error ? signupError.message : "Signup failed";
      setError(message);
      throw signupError;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setError(null);
  };

  return { user, login, signup, logout, loading, error };
}
