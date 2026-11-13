import "server-only";
import { after } from "next/server";
import { dispatchProjectEmails } from "./worker";

/** The database already queued the event in the mutation's transaction. */
export function scheduleProjectEmails() {
  after(async () => {
    try { await dispatchProjectEmails(); }
    catch(error) { console.error('Project email worker failed; queued notifications remain available for retry.',error); }
  });
}
