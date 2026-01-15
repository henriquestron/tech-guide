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

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ML_APP_ID,
      client_secret: process.env.ML_SECRET_KEY,
      code,
      redirect_uri: "https://www.techguidebr.com.br/api/ml/callback",
      code_verifier: verifier
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in
  });
}
