import { UserModel } from "@/models/auth-models";

const API_BASE = "https://bevoh.altervista.org/api"

type MeResponse =
    | { ok: true; user: UserModel }
    | { ok: false; error: string }

export async function loadMe(): Promise<UserModel> {
  const res = await fetch(`${API_BASE}/auth/me.php`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  const data: MeResponse = JSON.parse(text);
  
  if (!res.ok || !data.ok) throw new Error("error" in data ? data.error : "HTTP error");

  return data.user;
}