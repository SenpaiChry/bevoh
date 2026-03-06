import { UserModel } from "@/models/auth-models";
const API_BASE = "https://bevoh.altervista.org/api"

export type MeResponse =
  | { ok: true; user: UserModel }
  | { ok: false; error: string }

export async function logout(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout.php`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  if (!text.trim()) throw new Error("Empty response");

  const json = JSON.parse(text);
  if (!res.ok || json?.ok === false) throw new Error(json?.error || "Logout failed");
}

async function fetchMeRaw(): Promise<MeResponse> {
  const res = await fetch(`${API_BASE}/auth/me.php`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  if (!text.trim()) return { ok: false, error: "Empty response" };

  try {
    const data: MeResponse = JSON.parse(text);
    if (!res.ok || !data.ok) return { ok: false, error: "Not authenticated" };
    return data;
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
}

// Usata da MenuMobile/Header con React Query — non lancia mai errore
export async function loadMeSafe(): Promise<MeResponse> {
  return fetchMeRaw();
}

// Usata da ProfilePage e altri — lancia errore se non loggato
export async function loadMe(): Promise<UserModel> {
  const data = await fetchMeRaw();
  if (!data.ok) throw new Error("error" in data ? data.error : "Not authenticated");
  return data.user;
}