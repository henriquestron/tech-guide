import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

// ⚠️ SUA ÚNICA TAREFA:
// Cole aqui o código TG novo que você vai pegar no passo a passo abaixo.
const CODIGO_INICIAL_TG = "TG-69692cfa62f685000192dc30-1094234467"; 

// --- 🔐 COFRE (Lê ID e Secret do Supabase) ---
async function getCredentials(supabase) {
    const { data, error } = await supabase.from('ml_tokens').select('app_id, app_secret').limit(1).single();
    if (error || !data || !data.app_id || !data.app_secret) {
        throw new Error("Credenciais não encontradas no Supabase. Verifique a tabela ml_tokens.");
    }
    return { appId: data.app_id, appSecret: data.app_secret };
}

// --- 🔄 GESTÃO DE TOKENS (LIMPA - SEM PKCE) ---
async function getValidToken(supabase) {
  const { data } = await supabase.from('ml_tokens').select('*').limit(1).single();
  const creds = await getCredentials(supabase);

  // 1. Primeira vez (Troca Código TG por Token)
  // Como o token no banco pode ser 'vazio' ou inválido, usamos o código TG para começar
  if ((!data || !data.access_token || data.access_token === 'vazio') && CODIGO_INICIAL_TG && CODIGO_INICIAL_TG.startsWith("TG-")) {
      console.log("🔄 Primeira Configuração: Trocando Código TG por Token...");
      return await exchangeCodeForToken(supabase, CODIGO_INICIAL_TG, creds);
  }

  // 2. Testa token atual
  if (data && data.access_token) {
      const isValid = await testToken(data.access_token);
      if (isValid) return data.access_token;
  }

  // 3. Renova (Refresh)
  console.log("⚠️ Token expirado. Renovando automaticamente...");
  return await refreshToken(supabase, data.refresh_token, creds);
}

async function testToken(token) {
    try {
        const res = await fetch(`https://api.mercadolibre.com/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.status === 200;
    } catch (e) { return false; }
}

async function exchangeCodeForToken(supabase, code, creds) {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', creds.appId);
    params.append('client_secret', creds.appSecret);
    params.append('code', code);
    params.append('redirect_uri', 'https://techguidebr.com.br'); 
    
    // SEM code_verifier aqui, pois você desativou o PKCE! \o/

    const res = await fetch('https://api.mercadolibre.com/oauth/token', { method: 'POST', body: params });
    const data = await res.json();

    if (data.error) throw new Error(`Erro Auth Inicial: ${data.message || data.error}`);
    
    await supabase.from('ml_tokens').update({ 
        access_token: data.access_token, 
        refresh_token: data.refresh_token,
        updated_at: new Date()
    }).gt('id', 0);

    return data.access_token;
}

async function refreshToken(supabase, refreshTokenStr, creds) {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', creds.appId);
    params.append('client_secret', creds.appSecret);
    params.append('refresh_token', refreshTokenStr);

    const res = await fetch('https://api.mercadolibre.com/oauth/token', { method: 'POST', body: params });
    const data = await res.json();

    if (data.error) throw new Error(`Erro Refresh: ${data.message || data.error}`);

    await supabase.from('ml_tokens').update({ 
        access_token: data.access_token, 
        refresh_token: data.refresh_token,
        updated_at: new Date()
    }).gt('id', 0);

    return data.access_token;
}

// --- 🤖 ROBÔ COM IA (GEMINI) ---
export async function POST(req) { 
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let body = {};
    try { body = await req.json(); } catch (e) {}

    const listaAutomatica = [ 
        { termo: "iphone 13", categoria: "celulares", subcategoria: "iphone" }, 
        { termo: "ps5", categoria: "games", subcategoria: "console" }
    ];

    let { termo, categoria, subcategoria, limit = 3 } = body;

    if (!termo) {
        const sorteado = listaAutomatica[Math.floor(Math.random() * listaAutomatica.length)];
        termo = sorteado.termo; categoria = sorteado.categoria; subcategoria = sorteado.subcategoria;
    }
    if (!categoria) categoria = 'notebooks';

    // 1. Pega Token (Sem travas de segurança chatas)
    const token = await getValidToken(supabase);

    // 2. Busca na API
    const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=${limit}&condition=new&sort=price_asc`;
    const mlResponse = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    
    if (!mlResponse.ok) throw new Error(`Erro ML API: ${mlResponse.statusText}`);
    
    const mlData = await mlResponse.json();
    const resultados = mlData.results || [];
    console.log(`🎯 ML Retornou: ${resultados.length} produtos.`);

    // 3. IA Gera Reviews
    let salvos = 0;
    
    for (const item of resultados) {
      const titulo = item.title;
      const price = item.price;
      const link = item.permalink;
      const image = item.thumbnail.replace('-I.jpg', '-V.jpg').replace('-I.webp', '-V.webp'); 
      const brandAPI = item.attributes?.find(a => a.id === 'BRAND')?.value_name || "Genérico";
      const originalPrice = item.original_price || (price * 1.25); 

      let dadosReview = {
         brand: brandAPI,
         shortDescription: `Oferta: ${titulo}`,
         rating: 4.5,
         fullReview: { verdict: "Analisando...", pros: ["Preço Bom"], cons: [], content: "..." }
      };

      try {
        const promptReview = `
          Aja como especialista Tech. Analise: "${titulo}" - R$ ${price}.
          JSON RÍGIDO (sem markdown):
          { 
            "shortDescription": "Frase curta (max 50 chars)", 
            "rating": 4.5, 
            "fullReview": { 
                "verdict": "Veredito rápido", 
                "pros": ["Pró 1", "Pró 2"], 
                "cons": ["Contra 1"], 
                "content": "Resumo técnico curto." 
            } 
          }
        `;
        const reviewResult = await model.generateContent(promptReview);
        const textReview = reviewResult.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonReview = JSON.parse(textReview);
        dadosReview = { ...dadosReview, ...jsonReview, brand: brandAPI };
      } catch (err) { }

      const { data: existente } = await supabase.from('products').select('id').eq('link', link).single();
      if (!existente) {
          const { error } = await supabase.from('products').insert([{
            title: titulo, image, price, original_price: originalPrice, link, category, subcategory,
            brand: dadosReview.brand,
            rating: Number(dadosReview.rating),
            short_description: dadosReview.shortDescription,
            full_review: dadosReview.fullReview,
            status: 'pending'
          }]);
          if (!error) salvos++;
      }
    }

    return NextResponse.json({ success: true, message: `${salvos} produtos com IA processados!` });

  } catch (error) {
    console.error("🚨 Erro Fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}