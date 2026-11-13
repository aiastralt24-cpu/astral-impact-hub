import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { dispatchProjectEmails } from "@/lib/notifications/worker";
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request: Request) {
  const secret=process.env.CRON_SECRET;
  const actual=Buffer.from(request.headers.get('authorization') || '');
  const expected=Buffer.from(`Bearer ${secret || ''}`);
  if(!secret || actual.length!==expected.length || !timingSafeEqual(actual,expected)) return NextResponse.json({error:'Unauthorized'},{status:401});
  try { return NextResponse.json(await dispatchProjectEmails()); }
  catch { return NextResponse.json({error:'Email queue processing failed. Check server logs and migration 0007.'},{status:503}); }
}
