import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "astral-impact-hub",
    timestamp: new Date().toISOString()
  });
}
