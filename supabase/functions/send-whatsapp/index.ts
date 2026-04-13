import { json } from "../_shared/http.ts";

Deno.serve(() => json({ ok: true, function: "send-whatsapp" }));
