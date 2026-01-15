export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  const verifier = cookies().get("ml_code_verifier")?.value;

  if (!code || !verifier) {
    return NextResponse.json(
      { error: "Code ou verifier ausente" },
      { status: 400 }
    );
  }

  // troca token aqui...
}
