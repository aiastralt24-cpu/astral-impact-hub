import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/demo-store";
import { getMediaAccessUrl } from "@/lib/media/storage";
export async function GET(_request:Request,{params}:{params:Promise<{mediaId:string}>}) {
  const user=await getSession();
  if(!user) return new NextResponse("Sign in to view media",{status:401});
  const {mediaId}=await params;
  const data=await getDashboardData(user);
  const media=data.updates.flatMap(update=>update.media).find(item=>item.id===mediaId);
  if(!media) return new NextResponse("Media not found",{status:404});
  const url=await getMediaAccessUrl(media,{actor:user});
  if(!url) return new NextResponse("Media is unavailable. Check storage or refresh.",{status:503});
  return NextResponse.redirect(url,{status:307,headers:{"Cache-Control":"private, no-store"}});
}
