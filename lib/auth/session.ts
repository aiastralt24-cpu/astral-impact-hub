import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getUserById, getUserByRole } from "@/lib/data/demo-store";
import type { AppUser } from "@/types/domain";

const SESSION_COOKIE = "astral-session-user";

export async function getSession() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionUserId) {
    return null;
  }

  return getUserById(sessionUserId);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function signInAsRole(role: AppUser["role"]) {
  const user = await getUserByRole(role);
  if (!user) {
    return null;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return user;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
