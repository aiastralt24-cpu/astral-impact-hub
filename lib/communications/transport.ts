import { WorkflowError } from "./model";
import type { DistributionChannel, GeneratedContentRecord } from "@/types/domain";
import { connectionStatus } from "./config";

export type DeliveryReceipt = {status:"sent"|"accepted"; id:string; message:string};
async function request(url: string, init: RequestInit, uncertain = true) {
  let response: Response;
  try { response = await fetch(url, {...init, signal:AbortSignal.timeout(25000)}); }
  catch { throw new WorkflowError(uncertain ? "The provider response was lost. Delivery may have occurred. Check the destination before any further attempt; automatic retry is blocked." : "The provider could not be reached. Nothing was published. Try again later.",uncertain); }
  let body;
  try { body = await response.json(); } catch { throw new WorkflowError("The provider returned an unreadable response. Check the destination; automatic retry is blocked.",uncertain); }
  if (!response.ok || body.error || body.ok === false) {
    if (response.status >= 500) throw new WorkflowError("The provider had a server error. Delivery status is uncertain; check the destination before retrying.",uncertain);
    const code = body.error?.code || body.error_code;
    if (code === 131047) throw new WorkflowError("WhatsApp rejected this message because the customer-service window is closed. Ask the recipient to message your business first, or use an approved template outside this app.");
    if ([401,403].includes(response.status) || [190,10,200].includes(code)) throw new WorkflowError("The channel rejected its credentials or publishing permissions. Ask your administrator to reconnect the account.");
    if (response.status === 429) throw new WorkflowError("The channel rate limit was reached. Wait before retrying.");
    throw new WorkflowError(`The channel rejected the request (HTTP ${response.status}${code ? `, code ${code}` : ""}). Check account permissions, recipient eligibility and media requirements. Nothing was confirmed sent.`);
  }
  return body;
}
export function requireConnection(channel: DistributionChannel) {
  const missing = connectionStatus()[channel];
  if (missing.length) throw new WorkflowError(`${channel} is not connected. Configure ${missing.join(", ")} before sharing.`);
  if (channel !== "telegram" && !/^v\d+\.\d+$/.test(process.env.META_GRAPH_VERSION || "")) throw new WorkflowError("META_GRAPH_VERSION must be an enabled Graph API version, for example v25.0.");
}
export function deliveryDestination(channel: DistributionChannel, recipient?: string) {
  requireConnection(channel);
  if (channel === "telegram") return process.env.TELEGRAM_CHANNEL_ID!;
  if (channel === "instagram") return process.env.INSTAGRAM_ACCOUNT_ID!;
  const phone = (recipient || "").replace(/[\s+()-]/g,"");
  if (!/^[1-9]\d{7,14}$/.test(phone)) throw new WorkflowError("Enter a WhatsApp recipient with country code, such as +91 followed by the phone number.");
  return phone;
}
export async function sendToChannel(channel: DistributionChannel, content: GeneratedContentRecord, destination: string, imageUrl?: string): Promise<DeliveryReceipt> {
  requireConnection(channel);
  if (channel === "telegram") {
    const data = await request(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:destination,text:content.telegramUpdate})});
    if (!data.ok || !data.result?.message_id) throw new WorkflowError("Telegram returned no message receipt. Check the channel; automatic retry is blocked.",true);
    return {status:"sent",id:String(data.result.message_id),message:"Telegram confirmed the message was sent."};
  }
  const base = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION}`;
  const token = channel === "whatsapp" ? process.env.WHATSAPP_API_TOKEN : process.env.INSTAGRAM_ACCESS_TOKEN;
  const headers = {Authorization:`Bearer ${token}`,"Content-Type":"application/json"};
  if (channel === "whatsapp") {
    const data = await request(`${base}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {method:"POST",headers,body:JSON.stringify({messaging_product:"whatsapp",recipient_type:"individual",to:destination,type:"text",text:{preview_url:false,body:content.whatsappDigest}})});
    if (!data.messages?.[0]?.id) throw new WorkflowError("WhatsApp returned no receipt. Check the destination; automatic retry is blocked.",true);
    return {status:"accepted",id:data.messages[0].id,message:"Meta accepted the WhatsApp message. Delivery is not yet confirmed."};
  }
  if (!imageUrl?.startsWith("https://")) throw new WorkflowError("Select a JPEG image from the update and save the draft before approval. Instagram requires a reachable HTTPS image.");
  const container = await request(`${base}/${destination}/media`, {method:"POST",headers,body:JSON.stringify({image_url:imageUrl,caption:content.instagramCaptionLong})},false);
  if (!container.id) throw new WorkflowError("Instagram did not create a media container. Nothing was published.");
  let ready = false;
  for (let attempt=0;attempt<10;attempt++) {
    const state = await request(`${base}/${container.id}?fields=status_code`, {headers},false);
    if (state.status_code === "FINISHED") {ready=true;break;}
    if (["ERROR","EXPIRED"].includes(state.status_code)) throw new WorkflowError("Instagram could not process the photo. Check that it is a JPEG with a supported aspect ratio and accessible storage URL.");
    await new Promise(resolve => setTimeout(resolve,1000));
  }
  if (!ready) throw new WorkflowError("Instagram is still processing the photo. Nothing was published. Please try again later.");
  const data = await request(`${base}/${destination}/media_publish`, {method:"POST",headers,body:JSON.stringify({creation_id:container.id})});
  if (!data.id) throw new WorkflowError("Instagram returned no publication receipt. Check the account; automatic retry is blocked.",true);
  return {status:"sent",id:data.id,message:"Instagram confirmed the photo and caption were published."};
}
