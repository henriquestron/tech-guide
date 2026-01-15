export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { generatePKCE } from "@/lib/ml-pkce";
import { cookies } from "next/headers";

export async function GET() {
  const { verifier, challenge } = generatePKCE();

  cookies().set("ml_code_verifier", verifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600
  });

  const redirectUrl =
    "https://auth.mercadolibre.com.br/authorization" +
    `?response_type=code` +
    `&client_id=${process.env.ML_APP_ID}` +
    `&redirect_uri=${encodeURIComponent("https://www.techguidebr.com.br/api/ml/callback")}` +
    `&code_challenge=${challenge}` +
    `&code_challenge_method=S256`;

  return NextResponse.redirect(redirectUrl);
}
