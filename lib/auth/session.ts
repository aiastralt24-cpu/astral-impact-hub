import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { claimUserSession, getUserByCredentials, getUserBySessionToken, releaseUserSession } from "@/lib/data/demo-store";
import type { AppUser } from "@/types/domain";

const SESSION_COOKIE = "astral-session-token";
const LEGACY_SESSION_COOKIE = "astral-session-user";
const SESSION_IDLE_MINUTES = 30;

function sessionExpiry() {
  return new Date(Date.now() + SESSION_IDLE_MINUTES * 60 * 1000);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return getUserBySessionToken(token, sessionExpiry());
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login?error=session_expired");
  }
  return session;
}

export async function signInWithCredentials(username: string, password: string) {
  const user = await getUserByCredentials(username, password);
  if (!user) {
    return { ok: false, reason: "invalid_credentials" } as const;
  }

  const token = crypto.randomUUID();
  if (!(await claimUserSession(user.id, token, sessionExpiry()))) {
    return { ok: false, reason: "already_active" } as const;
  }
  const cookieStore = await cookies();
  cookieStore.delete(LEGACY_SESSION_COOKIE);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return { ok: true, user } as const;
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await releaseUserSession(token);
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(LEGACY_SESSION_COOKIE);
}
