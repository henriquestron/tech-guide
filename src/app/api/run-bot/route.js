import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

// ⚠️ PASSO CRUCIAL:
// Cole aqui o código que você pegou no navegador (ex: "TG-65a1b...")
// Esse código só é usado na PRIMEIRA vez para gerar o token eterno.
const CODIGO_INICIAL_TG = "TG-6969259406aefe0001d77bad-1094234467"; 

// --- 🔐 SISTEMA DE GESTÃO DE TOKENS (AUTOMÁTICO) ---
async function getValidToken(supabase) {
  // 1. Tenta pegar o token salvo no banco
  const { data } = await supabase.from('ml_tokens').select('*').limit(1).single();
  
  // 2. SE FOR A PRIMEIRA VEZ (Banco vazio ou token 'vazio')
  // Usa o código TG manual para gerar o primeiro token real
  if ((!data || data.access_token === 'vazio') && CODIGO_INICIAL_TG && CODIGO_INICIAL_TG !== "TG-6969259406aefe0001d77bad-1094234467") {
      console.log("🔄 Primeira Configuração: Trocando Código TG por Token Permanente...");
      return await exchangeCodeForToken(supabase, CODIGO_INICIAL_TG);
  }

  // 3. Se já temos token, testa se ele ainda funciona
  if (data && data.access_token) {
      const isValid = await testToken(data.access_token);
      if (isValid) return data.access_token;
  }

  // 4. Se o token venceu (invalido), usa o refresh_token para renovar
  console.log("⚠️ Token expirado. Renovando automaticamente...");
  return await refreshToken(supabase, data.refresh_token);
}

// Testa se o token atual é aceito pelo ML
async function testToken(token) {
    try {
        const res = await fetch(`https://api.mercadolibre.com/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.status === 200;
    } catch (e) { return false; }
}

// Troca o código TG inicial pelo Access Token (Só roda 1 vez na vida)
async function exchangeCodeForToken(supabase, code) {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.ML_APP_ID);
    params.append('client_secret', process.env.ML_SECRET_KEY);
    params.append('code', code);
    params.append('redirect_uri', 'https://techguidebr.com.br'); // Tem que ser IGUAL ao cadastro no ML

    const res = await fetch('https://api.mercadolibre.com/oauth/token', { method: 'POST', body: params });
    const data = await res.json();

    if (data.error) throw new Error(`Erro Auth Inicial: ${data.message || data.error} (Verifique se o Code não expirou)`);
    
    // Salva no banco
    await supabase.from('ml_tokens').update({ 
        access_token: data.access_token, 
        refresh_token: data.refresh_token,
        updated_at: new Date()
    }).gt('id', 0);

    return data.access_token;
}

// Renova o token quando ele vence (Roda a cada 6h automaticamente)
async function refreshToken(supabase, refreshTokenStr) {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', process.env.ML_APP_ID);
    params.append('client_secret', process.env.ML_SECRET_KEY);
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
// --- FIM DO SISTEMA DE TOKENS ---


// --- 🤖 O ROBÔ (LÓGICA PRINCIPAL) ---
export async function POST(req) { 
  try {
    // Inicializa Supabase e Gemini
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Lê parâmetros da requisição
    let body = {};
    try { body = await req.json(); } catch (e) {}

    // Lista de fallback (CronJob)
    const listaAutomatica = [ 
        { termo: "iphone 15 128gb", categoria: "celulares", subcategoria: "iphone" }, 
        { termo: "notebook gamer rtx 3050", categoria: "notebooks", subcategoria: "gamer" },
        { termo: "ps5 slim", categoria: "games", subcategoria: "console" },
        { termo: "monitor 144hz", categoria: "acessorios", subcategoria: "monitor" }
    ];

    let { termo, categoria, subcategoria, limit = 3 } = body;

    if (!termo) {
        const sorteado = listaAutomatica[Math.floor(Math.random() * listaAutomatica.length)];
        termo = sorteado.termo; categoria = sorteado.categoria; subcategoria = sorteado.subcategoria;
        console.log(`⏰ CronJob Automático: Buscando "${termo}"`);
    } else {
        console.log(`🔎 Busca Manual Admin: "${termo}"`);
    }
    if (!categoria) categoria = 'notebooks';

    // 1. 🔑 PEGA O TOKEN VÁLIDO (Aqui a mágica acontece)
    console.log("🔌 Verificando token do Mercado Livre...");
    const token = await getValidToken(supabase);

    // 2. 🛒 BUSCA NA API DO MERCADO LIVRE
    // Busca produtos novos, ordena por menor preço
    const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=${limit}&condition=new&sort=price_asc`;
    
    const mlResponse = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    
    if (!mlResponse.ok) throw new Error(`Erro na API do ML: ${mlResponse.statusText}`);
    
    const mlData = await mlResponse.json();
    const resultados = mlData.results || [];
    console.log(`🎯 Encontrados: ${resultados.length} produtos.`);

    // 3. 🧠 PROCESSAMENTO + IA (GEMINI)
    let salvos = 0;
    
    for (const item of resultados) {
      // Extrai dados limpos do ML
      const titulo = item.title;
      const price = item.price;
      const link = item.permalink;
      // Tenta pegar imagem HD substituindo o sufixo da thumbnail
      const image = item.thumbnail.replace('-I.jpg', '-V.jpg').replace('-I.webp', '-V.webp'); 
      const brandAPI = item.attributes?.find(a => a.id === 'BRAND')?.value_name || "Genérico";
      
      // Cria preço "De" fake se não existir (para ficar bonito na vitrine)
      const originalPrice = item.original_price || (price * 1.25); 

      // Estrutura padrão caso a IA falhe
      let dadosReview = {
         brand: brandAPI,
         shortDescription: `Oferta de ${titulo}`,
         rating: 4.5,
         fullReview: { verdict: "Análise pendente", pros: ["Preço Competitivo"], cons: [], content: "Aguardando revisão detalhada." }
      };

      // --- AQUI A GEMINI ENTRA EM AÇÃO ---
      try {
        const promptReview = `
          Aja como um especialista em Tech (Hardware/Gadgets).
          Analise: "${titulo}" da marca "${brandAPI}" por R$ ${price}.
          Categoria: ${categoria}.
          
          Gere um JSON RÍGIDO (sem markdown, sem \`\`\`json):
          { 
            "shortDescription": "Uma frase curta e vendedora (max 60 chars)", 
            "rating": 4.5, 
            "fullReview": { 
                "verdict": "Veredito direto: Vale a pena ou não?", 
                "pros": ["Ponto positivo 1", "Ponto positivo 2"], 
                "cons": ["Ponto negativo (se houver)"], 
                "content": "Um parágrafo de 3 linhas explicando tecnicamente o produto." 
            } 
          }
        `;
        
        const reviewResult = await model.generateContent(promptReview);
        const textReview = reviewResult.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonReview = JSON.parse(textReview);
        
        // Mescla o resultado da IA com a marca oficial da API
        dadosReview = { ...dadosReview, ...jsonReview, brand: brandAPI }; 
        
      } catch (err) { 
          console.error("⚠️ Erro IA Review (usando padrão):", err.message); 
      }

      // --- SALVA NO SUPABASE ---
      // Verifica se já existe esse link para não duplicar
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
            
            // Dados da IA
            brand: dadosReview.brand,
            rating: Number(dadosReview.rating),
            short_description: dadosReview.shortDescription,
            full_review: dadosReview.fullReview,
            
            status: 'pending', // Cai na aba 'Pendentes' do Admin
            created_at: new Date()
          }]);

          if (!error) salvos++;
      }
    }

    return NextResponse.json({ success: true, message: `${salvos} produtos processados e analisados pela IA!` });

  } catch (error) {
    console.error("🚨 Erro Fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}