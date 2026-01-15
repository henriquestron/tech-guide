import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code não recebido" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    code
  });
}
