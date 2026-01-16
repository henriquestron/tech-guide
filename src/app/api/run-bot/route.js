import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

// --- 🔄 1. GESTÃO DE TOKENS (Para manter sua conta conectada no banco) ---
async function getCredentials(supabase) {
    const { data, error } = await supabase.from('ml_tokens').select('app_id, app_secret').limit(1).single();
    if (error || !data) throw new Error("Credenciais (App ID/Secret) não encontradas no Supabase.");
    return { appId: data.app_id, appSecret: data.app_secret };
}

async function refreshToken(supabase, refreshTokenStr, creds) {
    console.log("🔄 Renovando Token expirado...");
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', creds.appId);
    params.append('client_secret', creds.appSecret);
    params.append('refresh_token', refreshTokenStr);

    const res = await fetch('https://api.mercadolibre.com/oauth/token', { 
        method: 'POST', body: params, 
        headers: { 'accept': 'application/json', 'content-type': 'application/x-www-form-urlencoded' } 
    });
    
    const data = await res.json();
    if (data.error) throw new Error(`Erro Refresh ML: ${data.message || data.error}`);

    // Salva o novo token no banco
    await supabase.from('ml_tokens').update({ 
        access_token: data.access_token, 
        refresh_token: data.refresh_token, 
        updated_at: new Date()
    }).gt('id', 0);

    return data.access_token;
}

async function ensureTokenIsActive(supabase) {
  // Essa função serve apenas para garantir que o token no banco não morra.
  // Se estiver vencido, ela renova.
  try {
      const { data } = await supabase.from('ml_tokens').select('*').limit(1).single();
      if (!data || !data.access_token) return;

      const creds = await getCredentials(supabase);

      // Testa validade
      const res = await fetch(`https://api.mercadolibre.com/users/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` }
      });

      if (res.status !== 200) {
          await refreshToken(supabase, data.refresh_token, creds);
          console.log("✅ Token renovado no banco com sucesso.");
      } else {
          console.log("✅ Token do banco ainda é válido.");
      }
  } catch (e) {
      console.log("⚠️ Aviso: Não foi possível verificar token (sem impacto na busca pública).", e.message);
  }
}

// --- 🤖 2. ROBÔ PRINCIPAL ---
export async function POST(req) { 
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let body = {};
    try { body = await req.json(); } catch (e) {}
    
    // Lista Automática (CronJob)
    const listaAutomatica = [
      { termo: "iphone 13 128gb", categoria: "celulares", subcategoria: "iphone" },
      { termo: "ps5 slim", categoria: "games", subcategoria: "console" },
      { termo: "notebook gamer rtx", categoria: "notebooks", subcategoria: "gamer" },
      { termo: "monitor 144hz", categoria: "acessorios", subcategoria: "monitor" }
    ];

    let { termo, categoria, subcategoria, limit = 3 } = body;

    // Lógica de seleção de termo
    if (!termo) {
        const sorteado = listaAutomatica[Math.floor(Math.random() * listaAutomatica.length)];
        termo = sorteado.termo; categoria = sorteado.categoria; subcategoria = sorteado.subcategoria;
        console.log(`⏰ CronJob: Buscando "${termo}"`);
    } else {
        console.log(`🔎 Busca Manual: "${termo}"`);
    }

    if (!categoria) categoria = 'notebooks';

    // 3. OTIMIZAÇÃO DE BUSCA (IA)
    let termoDeBusca = termo;
    try {
        const promptSearch = `
        Especialista SEO ML. Usuário busca: "${termo}".
        Refine o termo para achar o produto exato e evitar acessórios.
        Mantenha marca/modelo. Ex: "iphone 13" -> "iphone 13 128gb original vitrine".
        Responda APENAS o termo novo.
        `;
        const resultSearch = await model.generateContent(promptSearch);
        const sugestao = resultSearch.response.text().trim();
        // Segurança: só aceita se mantiver a palavra chave original
        if (sugestao.toLowerCase().includes(termo.split(' ')[0].toLowerCase())) {
            termoDeBusca = sugestao;
            console.log(`🧠 IA refinou: "${termo}" -> "${termoDeBusca}"`);
        }
    } catch (e) { console.log("Erro IA busca, usando original."); }

    // 4. MANUTENÇÃO DO TOKEN (Background)
    await ensureTokenIsActive(supabase);

    // 5. BUSCA NA API (PÚBLICA - Correção do Erro 403)
    console.log("🔍 Buscando na API Pública do ML...");
    const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termoDeBusca)}&limit=${limit}&condition=new&sort=price_asc`;
    
    const res = await fetch(searchUrl, { 
        headers: { 
            // Disfarça como navegador para não tomar 403
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept": "application/json"
        } 
    });

    if (!res.ok) {
        const erroMsg = await res.text();
        console.error("❌ Erro Detalhado ML:", erroMsg);
        throw new Error(`Erro API ML: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const resultados = data.results || [];
    console.log(`🎯 Encontrados: ${resultados.length} produtos.`);

    // 6. PROCESSAMENTO E SALVAMENTO
    let salvos = 0;
    for (const item of resultados) {
      const titulo = item.title;
      const price = item.price;
      const permalink = item.permalink; // Link limpo
      
      // Melhora qualidade da imagem (Thumbnail -> HD)
      const image = item.thumbnail ? item.thumbnail.replace('-I.jpg', '-V.jpg').replace('-I.webp', '-V.webp') : "";
      
      const brandAPI = item.attributes?.find(a => a.id === 'BRAND')?.value_name || "Genérico";
      const originalPrice = item.original_price || (price * 1.25); 

      // IA Review
      let dadosReview = { brand: brandAPI, shortDescription: `Oferta: ${titulo}`, rating: 4.5, fullReview: {} };
      try {
        const prompt = `Analise Tech: "${titulo}" - R$ ${price}. Categoria: ${categoria}. JSON RÍGIDO: { "shortDescription": "frase mkt curta", "rating": 4.5, "fullReview": { "verdict": "Vale a pena?", "pros": ["a","b"], "cons": ["c"], "content": "resumo tecnico" } }`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonIA = JSON.parse(text);
        dadosReview = { ...dadosReview, ...jsonIA, brand: brandAPI }; // Mantém marca da API se IA falhar
      } catch (err) {}

      // Verifica duplicidade pelo Link Original
      const { data: existente } = await supabase.from('products').select('id').eq('original_link', permalink).single();
      
      if (!existente) {
          const { error } = await supabase.from('products').insert([{
            title: titulo,
            image: image,
            price: price,
            original_price: originalPrice,
            
            // 👇 ESSENCIAL PARA O SISTEMA DE AUDITORIA
            link: permalink,           // Link temporário (vai virar afiliado)
            original_link: permalink,  // Link original (robô usa pra checar preço)
            
            category: categoria,
            subcategory: subcategoria || null,
            brand: dadosReview.brand,
            rating: Number(dadosReview.rating),
            short_description: dadosReview.shortDescription,
            full_review: dadosReview.fullReview,
            status: 'pending' // Entra como pendente para você aprovar
          }]);

          if (!error) salvos++;
      }
    }

    return NextResponse.json({ success: true, message: `${salvos} produtos novos salvos via API!` });

  } catch (error) {
    console.error("🚨 Erro Fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}