import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { recordWhatsAppStatus } from "@/lib/communications/repository";
export async function GET(request:Request) {
  const url=new URL(request.url);
  if(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && url.searchParams.get("hub.mode")==="subscribe" && url.searchParams.get("hub.verify_token")===process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) return new NextResponse(url.searchParams.get("hub.challenge")||"");
  return new NextResponse("Verification failed",{status:403});
}
export async function POST(request:Request) {
  const secret=process.env.META_APP_SECRET;
  if(!secret) return new NextResponse("Webhook is not configured",{status:503});
  const raw=await request.text();
  const signature=request.headers.get("x-hub-signature-256")||"";
  const expected=`sha256=${createHmac("sha256",secret).update(raw).digest("hex")}`;
  if(signature.length!==expected.length || !timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) return new NextResponse("Invalid signature",{status:401});
  try {
    const body=JSON.parse(raw);
    for(const entry of body.entry||[]) for(const change of entry.changes||[]) {
      if(change.value?.metadata?.phone_number_id!==process.env.WHATSAPP_PHONE_NUMBER_ID) continue;
      for(const status of change.value?.statuses||[]) if(typeof status.id==="string"&&typeof status.status==="string") await recordWhatsAppStatus(status.id,status.status);
    }
    return NextResponse.json({ok:true});
  } catch {return new NextResponse("Could not process delivery status; retry later",{status:500});}
}
