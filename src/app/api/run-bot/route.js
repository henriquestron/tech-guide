import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

// ⚠️ COLE SEU CÓDIGO TG NOVO AQUI
const CODIGO_INICIAL_TG = "TG-6969307506aefe0001d7d147-1094234467"; 

// --- 🕵️ CAMUFLAGEM (Essencial para não ser bloqueado pela Vercel) ---
const HEADERS_NAVEGADOR = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.mercadolivre.com.br/',
    'Cache-Control': 'no-cache'
};

// --- 🔐 COFRE ---
async function getCredentials(supabase) {
    const { data, error } = await supabase.from('ml_tokens').select('app_id, app_secret').limit(1).single();
    if (error || !data || !data.app_id || !data.app_secret) {
        throw new Error("Credenciais não encontradas no Supabase.");
    }
    return { appId: data.app_id, appSecret: data.app_secret };
}

// --- 🔄 GESTÃO DE TOKENS ---
async function getValidToken(supabase) {
  const { data } = await supabase.from('ml_tokens').select('*').limit(1).single();
  const creds = await getCredentials(supabase);

  if ((!data || !data.access_token || data.access_token === 'vazio') && CODIGO_INICIAL_TG && CODIGO_INICIAL_TG.startsWith("TG-")) {
      console.log("🔄 Primeira Configuração: Trocando Código TG por Token...");
      return await exchangeCodeForToken(supabase, CODIGO_INICIAL_TG, creds);
  }

  if (data && data.access_token) {
      // Testa validade
      try {
          const res = await fetch(`https://api.mercadolibre.com/users/me`, {
              headers: { Authorization: `Bearer ${data.access_token}` }
          });
          if (res.status === 200) return data.access_token;
      } catch (e) {}
  }

  console.log("⚠️ Token expirado. Renovando...");
  return await refreshToken(supabase, data.refresh_token, creds);
}

async function exchangeCodeForToken(supabase, code, creds) {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', creds.appId);
    params.append('client_secret', creds.appSecret);
    params.append('code', code);
    params.append('redirect_uri', 'https://techguidebr.com.br'); 

    const res = await fetch('https://api.mercadolibre.com/oauth/token', { 
        method: 'POST', body: params, headers: HEADERS_NAVEGADOR 
    });
    const data = await res.json();
    if (data.error) throw new Error(`Erro Auth Inicial: ${data.message || data.error}`);
    
    await supabase.from('ml_tokens').update({ 
        access_token: data.access_token, refresh_token: data.refresh_token, updated_at: new Date()
    }).gt('id', 0);
    return data.access_token;
}

async function refreshToken(supabase, refreshTokenStr, creds) {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', creds.appId);
    params.append('client_secret', creds.appSecret);
    params.append('refresh_token', refreshTokenStr);

    const res = await fetch('https://api.mercadolibre.com/oauth/token', { 
        method: 'POST', body: params, headers: HEADERS_NAVEGADOR 
    });
    const data = await res.json();
    if (data.error) throw new Error(`Erro Refresh: ${data.message || data.error}`);

    await supabase.from('ml_tokens').update({ 
        access_token: data.access_token, refresh_token: data.refresh_token, updated_at: new Date()
    }).gt('id', 0);
    return data.access_token;
}

// --- 🤖 ROBÔ PRINCIPAL ---
export async function POST(req) { 
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let body = {};
    try { body = await req.json(); } catch (e) {}
    
    // Lista de fallback
    const listaAutomatica = [ { termo: "iphone 13", categoria: "celulares", subcategoria: "iphone" }, { termo: "ps5", categoria: "games", subcategoria: "console" } ];
    let { termo, categoria, subcategoria, limit = 3 } = body;
    if (!termo) {
        const sorteado = listaAutomatica[Math.floor(Math.random() * listaAutomatica.length)];
        termo = sorteado.termo; categoria = sorteado.categoria; subcategoria = sorteado.subcategoria;
    }
    if (!categoria) categoria = 'notebooks';

    // --- LÓGICA DE BUSCA BLINDADA ---
    let token = null;
    let resultados = [];
    
    // 1. Tenta pegar Token (mas não morre se falhar)
    try { token = await getValidToken(supabase); } catch (e) { console.log("⚠️ Falha Token:", e.message); }

    const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=${limit}&condition=new&sort=price_asc`;
    
    // 2. Tenta busca OFICIAL (Com Token)
    let buscaSucesso = false;
    if (token) {
        console.log("🔌 Tentando via Token...");
        const res = await fetch(searchUrl, { 
            headers: { ...HEADERS_NAVEGADOR, 'Authorization': `Bearer ${token}` } 
        });
        if (res.ok) {
            const data = await res.json();
            resultados = data.results || [];
            buscaSucesso = true;
        }
    }

    // 3. Tenta busca CAMUFLADA (Sem Token - Backup)
    if (!buscaSucesso) {
        console.log("🌍 Ativando Camuflagem (Modo Público)...");
        const res = await fetch(searchUrl, { headers: HEADERS_NAVEGADOR });
        
        if (!res.ok) {
            const erro = await res.text();
            throw new Error(`Erro ML (Blindado falhou): ${res.status} - ${erro}`);
        }
        const data = await res.json();
        resultados = data.results || [];
    }

    console.log(`🎯 Produtos encontrados: ${resultados.length}`);

    // 4. IA GEMINI (Versão Completa e Detalhada)
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
         shortDescription: `Oferta imperdível de ${titulo}`,
         rating: 4.5,
         fullReview: { 
             verdict: "Análise em andamento", 
             pros: ["Preço Competitivo"], 
             cons: [], 
             content: "Produto sendo analisado pela nossa equipe." 
         }
      };

      try {
        // PROMPT COMPLETO E DETALHADO
        const promptReview = `
          Você é um especialista sênior em Tecnologia e Hardware.
          Analise o produto: "${titulo}"
          Marca: "${brandAPI}"
          Preço Atual: R$ ${price}
          Categoria: ${categoria}
          
          Gere um JSON RÍGIDO (sem markdown, sem blocos de código) com esta estrutura exata:
          { 
            "shortDescription": "Uma frase de impacto comercial curta (max 60 caracteres)", 
            "rating": 4.5, 
            "fullReview": { 
                "verdict": "Veredito direto: Vale a pena comprar por esse preço? (Sim/Não/Talvez)", 
                "pros": ["Ponto positivo técnico 1", "Ponto positivo técnico 2", "Ponto positivo 3"], 
                "cons": ["Ponto negativo ou alerta (se houver)"], 
                "content": "Um parágrafo de 3 a 4 linhas descrevendo o desempenho, qualidade de construção e para quem esse produto é indicado." 
            } 
          }
        `;
        
        const reviewResult = await model.generateContent(promptReview);
        const textReview = reviewResult.response.text()
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
            
        const jsonReview = JSON.parse(textReview);
        dadosReview = { ...dadosReview, ...jsonReview, brand: brandAPI };
        
      } catch (err) {
          console.error("⚠️ Erro na IA (usando fallback):", err.message);
      }

      // Salva no Supabase
      const { data: existente } = await supabase.from('products').select('id').eq('link', link).single();
      if (!existente) {
          const { error } = await supabase.from('products').insert([{
            title: titulo,
            image: image,
            price: price,
            original_price: originalPrice,
            link: link,
            category: categoria,
            subcategory: subcategoria || null,
            brand: dadosReview.brand,
            rating: Number(dadosReview.rating),
            short_description: dadosReview.shortDescription,
            full_review: dadosReview.fullReview,
            status: 'pending'
          }]);

          if (!error) salvos++;
      }
    }

    return NextResponse.json({ success: true, message: `${salvos} produtos processados com IA Completa!` });

  } catch (error) {
    console.error("🚨 Erro Fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}