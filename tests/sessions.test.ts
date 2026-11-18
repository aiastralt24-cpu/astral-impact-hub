import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";

test("an account permits only one active session and releases it on sign out", async () => {
  const { claimUserSession, getCurrentData, getUserBySessionToken, releaseUserSession } = await import("../lib/data/demo-store");
  const user = (await getCurrentData()).users[0];
  const future = new Date(Date.now() + 30 * 60 * 1000);

  assert.equal(await claimUserSession(user.id, "first-session", future), true);
  assert.equal(await claimUserSession(user.id, "second-session", future), false);
  assert.equal((await getUserBySessionToken("first-session", future))?.id, user.id);

  await releaseUserSession("first-session");
  assert.equal(await claimUserSession(user.id, "second-session", future), true);
  await releaseUserSession("second-session");
});
