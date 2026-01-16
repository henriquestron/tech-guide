import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// --- PREENCHA SEUS DADOS AQUI ---
const APP_ID = "6889005657521466";
const CLIENT_SECRET = "M747EpeXnmipqLeL0KjDvu9hJSoFhsvI";
const REDIRECT_URI = "https://techguidebr.com.br"; // Exatamente como está no painel do ML

export async function GET(req) {
  // 1. Pega o código TG da URL (ex: ?code=TG-123...)
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  // Se não tiver código, mostra o link para você clicar e gerar
  if (!code) {
    const urlAutorizacao = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}`;
    
    return new NextResponse(`
      <h1>Passo 1: Gerar Código TG</h1>
      <p>Clique no link abaixo para autorizar sua conta:</p>
      <a href="${urlAutorizacao}" style="font-size: 20px; font-weight: bold; color: blue;">
        👉 CLIQUE AQUI PARA GERAR O CÓDIGO TG
      </a>
      <p>Depois de clicar, você será redirecionado para a home do seu site. 
      Copie o código "TG-..." que aparecerá na URL ou volte aqui com ele.</p>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  // 2. Se já tem o código TG (você colou na URL: /api/setup-ml?code=TG-...), troca pelo Token
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', APP_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    console.log("🔄 Trocando código:", code);

    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ erro: "O Mercado Livre recusou", detalhe: data }, { status: 400 });
    }

    // SUCESSO! Mostra os dados na tela
    return NextResponse.json({
      SUCESSO: true,
      mensagem: "Copie os dados abaixo e salve no seu Supabase IMEDIATAMENTE.",
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user_id,
      expires_in: data.expires_in
    });

  } catch (error) {
    return NextResponse.json({ erro: "Erro de conexão", msg: error.message }, { status: 500 });
  }
}