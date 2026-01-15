import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

// ⚠️ SUA PARTE: Cole o código novo TG que você pegar no navegador aqui
const CODIGO_INICIAL_TG = "TG-696928da1e32c10001c411a3-1094234467"; 

// --- 🔐 COFRE DE CREDENCIAIS ---
async function getCredentials(supabase) {
    // Busca ID e Senha do banco de dados
    const { data, error } = await supabase.from('ml_tokens').select('app_id, app_secret').limit(1).single();
    if (error || !data || !data.app_id || !data.app_secret) {
        throw new Error("Credenciais do Mercado Livre não encontradas no Supabase (Tabela ml_tokens).");
    }
    return { appId: data.app_id, appSecret: data.app_secret };
}

// --- GESTÃO DE TOKENS ---
async function getValidToken(supabase) {
  const { data } = await supabase.from('ml_tokens').select('*').limit(1).single();
  
  // Pega as credenciais do banco
  const creds = await getCredentials(supabase);

  // 1. Primeira vez (Troca Código TG por Token)
  if ((!data || !data.access_token || data.access_token === 'vazio') && CODIGO_INICIAL_TG && CODIGO_INICIAL_TG.startsWith("TG-")) {
      console.log("🔄 Primeira Configuração: Usando credenciais do banco para trocar Code...");
      return await exchangeCodeForToken(supabase, CODIGO_INICIAL_TG, creds);
  }

  // 2. Testa token atual
  if (data && data.access_token) {
      const isValid = await testToken(data.access_token);
      if (isValid) return data.access_token;
  }

  // 3. Renova (Refresh)
  console.log("⚠️ Token expirado. Renovando com credenciais do banco...");
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
    params.append('client_id', creds.appId);     // Lê do banco
    params.append('client_secret', creds.appSecret); // Lê do banco
    params.append('code', code);
    params.append('redirect_uri', 'https://techguidebr.com.br'); 

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
    params.append('client_id', creds.appId);     // Lê do banco
    params.append('client_secret', creds.appSecret); // Lê do banco
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

// --- ROBÔ PRINCIPAL ---
export async function POST(req) { 
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // --- DIAGNÓSTICO RÁPIDO ---
    // Verifica se as chaves estão no banco antes de começar
    try { await getCredentials(supabase); } 
    catch (e) { return NextResponse.json({ error: "ERRO DE CONFIGURAÇÃO", detalhes: "Rode o SQL no Supabase para salvar ID e Secret." }, { status: 500 }); }
    // ---------------------------

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

    // 1. Pega Token (Usando chaves do banco)
    const token = await getValidToken(supabase);

    // 2. Busca ML
    const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=${limit}&condition=new&sort=price_asc`;
    const mlResponse = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    const mlData = await mlResponse.json();
    const resultados = mlData.results || [];

    // 3. Gemini e Salvamento
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
         fullReview: { verdict: "Analisando...", pros: ["Bom preço"], cons: [], content: "..." }
      };

      try {
        const promptReview = `Analise tech: ${titulo}, R$ ${price}. JSON RÍGIDO: { "shortDescription": "...", "rating": 4.5, "fullReview": { "verdict": "...", "pros": [], "cons": [], "content": "..." } }`;
        const reviewResult = await model.generateContent(promptReview);
        const textReview = reviewResult.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        dadosReview = { ...dadosReview, ...JSON.parse(textReview), brand: brandAPI }; 
      } catch (err) {}

      const { data: existente } = await supabase.from('products').select('id').eq('link', link).single();
      if (!existente) {
          const { error } = await supabase.from('products').insert([{
            title: titulo, image, price, original_price: originalPrice, link, category, subcategory,
            brand: dadosReview.brand, rating: Number(dadosReview.rating), short_description: dadosReview.shortDescription, full_review: dadosReview.fullReview,
            status: 'pending'
          }]);
          if (!error) salvos++;
      }
    }

    return NextResponse.json({ success: true, message: `${salvos} produtos processados!` });

  } catch (error) {
    console.error("🚨 Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}