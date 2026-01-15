export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generatePKCE } from "@/lib/ml-pkce";

export async function GET() {
  const { verifier, challenge } = generatePKCE();

  const redirectUrl =
    "https://auth.mercadolivre.com.br/authorization" +
    `?response_type=code` +
    `&client_id=${process.env.ML_APP_ID}` +
    `&redirect_uri=${encodeURIComponent("https://www.techguidebr.com.br/api/ml/callback")}` +
    `&code_challenge=${challenge}` +
    `&code_challenge_method=S256`;

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("ml_code_verifier", verifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/"
  });

  return response;
}
