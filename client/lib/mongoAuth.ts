export type MongoUserRole = "admin" | "editor" | "viewer";

export interface MongoUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  organization?: string;
  jobTitle?: string;
  role: MongoUserRole;
}

const TOKEN_KEY = "mongo_token";
const API_BASE = "/api/mongo-auth";

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

export async function getCurrentUser(): Promise<MongoUser | null> {
  const token = getToken();

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    removeToken();
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  const data = (await response.json()) as { user: MongoUser };
  return data.user;
}
