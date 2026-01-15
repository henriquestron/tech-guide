import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🚀 Configurações para Vercel (API é leve, roda rápido)
export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

// --- 🔐 FUNÇÃO PARA PEGAR TOKEN DO MERCADO LIVRE ---
async function getAccessToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.ML_APP_ID);
  params.append('client_secret', process.env.ML_SECRET_KEY);

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: params
  });

  const data = await res.json();
  return data.access_token;
}

export async function POST(req) { 
  try {
    // 1. Verificações de Segurança
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini Key missing" }, { status: 500 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "Supabase URL missing" }, { status: 500 });
    if (!process.env.ML_APP_ID || !process.env.ML_SECRET_KEY) return NextResponse.json({ error: "Mercado Livre Credenciais missing" }, { status: 500 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Modelo mais rápido e barato

    // 2. Leitura do Body
    let body = {};
    try { body = await req.json(); } catch (e) {}

    // 📜 LISTA AUTOMÁTICA (MANTIDA)
    const listaAutomatica = [
      { termo: "iphone 13 128gb", categoria: "celulares", subcategoria: "iphone" },
      { termo: "iphone 15 pro max", categoria: "celulares", subcategoria: "iphone" },
      { termo: "samsung galaxy s24 ultra", categoria: "celulares", subcategoria: "android" },
      { termo: "xiaomi poco x6 pro", categoria: "celulares", subcategoria: "android" },
      { termo: "motorola edge 50", categoria: "celulares", subcategoria: "android" },
      { termo: "notebook gamer rtx 4050", categoria: "notebooks", subcategoria: "gamer" },
      { termo: "macbook air m1", categoria: "notebooks", subcategoria: "macbook" },
      { termo: "notebook dell i5 ssd", categoria: "notebooks", subcategoria: "trabalho" },
      { termo: "pc gamer i5 rtx", categoria: "computadores", subcategoria: "pc-gamer" },
      { termo: "computador all in one", categoria: "computadores", subcategoria: "all-in-one" },
      { termo: "placa de video rtx 4060", categoria: "pecas", subcategoria: "placa-video" },
      { termo: "processador ryzen 5 5600", categoria: "pecas", subcategoria: "processador" },
      { termo: "ssd nvme 1tb", categoria: "pecas", subcategoria: "ssd-hd" },
      { termo: "ps5 slim digital", categoria: "games", subcategoria: "console" },
      { termo: "nintendo switch oled", categoria: "games", subcategoria: "console" },
      { termo: "monitor gamer 144hz ips", categoria: "acessorios", subcategoria: "monitor" },
      { termo: "headset gamer sem fio", categoria: "acessorios", subcategoria: "headset" }
    ];

    // Variáveis
    let { termo, categoria, subcategoria, limit = 3 } = body;

    // Sorteio se não vier termo (CronJob)
    if (!termo) {
        const sorteado = listaAutomatica[Math.floor(Math.random() * listaAutomatica.length)];
        termo = sorteado.termo;
        categoria = sorteado.categoria;
        subcategoria = sorteado.subcategoria;
        console.log(`⏰ CronJob: Sorteado "${termo}"`);
    } else {
        console.log(`🔎 Busca Manual: "${termo}"`);
    }
    if (!categoria) categoria = 'notebooks';

    // 3. 🧠 IA OTIMIZA A BUSCA (Mantido, pois é útil)
    let termoDeBusca = termo;
    try {
        const promptSearch = `Transforme "${termo}" em um termo de busca otimizado para encontrar produtos de tecnologia no Mercado Livre. Ex: "pc gamer" -> "pc gamer completo i5". Responda APENAS o texto.`;
        const resultSearch = await model.generateContent(promptSearch);
        termoDeBusca = resultSearch.response.text().trim();
        console.log(`🧠 IA buscou por: "${termoDeBusca}"`);
    } catch (e) { console.log("Erro IA Busca, usando original."); }

    // 4. 🛒 BUSCA NA API DO MERCADO LIVRE (Adeus Puppeteer!)
    console.log("🔌 Conectando API Mercado Livre...");
    const token = await getAccessToken(); // Pega o token
    
    const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termoDeBusca)}&limit=${limit}&condition=new&sort=price_asc`; // Filtra novos e ordena (opcional)
    
    const mlResponse = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const mlData = await mlResponse.json();
    const resultados = mlData.results || [];

    console.log(`🎯 API encontrou ${resultados.length} produtos.`);

    // 5. PROCESSAMENTO + GEMINI REVIEW
    let salvos = 0;
    
    for (const item of resultados) {
      // -- Limpeza de Dados da API --
      const titulo = item.title;
      const price = item.price;
      const originalPrice = item.original_price || (price * 1.2); // Se não tiver "de", inventa um fake pra vitrine
      const link = item.permalink;
      // Tenta pegar imagem HD trocando o final do link da thumb
      const image = item.thumbnail.replace('-I.jpg', '-V.jpg').replace('-I.webp', '-V.webp'); 
      const brandAPI = item.attributes?.find(a => a.id === 'BRAND')?.value_name || "Genérico";

      // -- IA Cria o Review --
      let dadosReview = {
         brand: brandAPI,
         shortDescription: `Oferta imperdível de ${titulo}`,
         rating: 4.5,
         fullReview: { verdict: "Analisando...", pros: ["Preço Bom"], cons: [], content: "..." }
      };

      try {
        const promptReview = `
          Analise este produto Tech:
          Nome: ${titulo}
          Preço: R$ ${price}
          Marca: ${brandAPI}
          
          Gere um JSON RÍGIDO (sem markdown):
          { 
            "shortDescription": "frase curta e chamativa (max 60 chars)", 
            "rating": 4.5, 
            "fullReview": { 
                "verdict": "Veredito curto (vale a pena?)", 
                "pros": ["ponto positivo 1", "ponto positivo 2"], 
                "cons": ["ponto negativo"], 
                "content": "Resumo técnico de 2 linhas sobre o produto." 
            } 
          }
        `;
        const reviewResult = await model.generateContent(promptReview);
        const textReview = reviewResult.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonReview = JSON.parse(textReview);
        dadosReview = { ...dadosReview, ...jsonReview, brand: brandAPI }; // Garante a marca da API
      } catch (err) { console.error("Erro IA Review:", err.message); }

      // -- Salva no Banco --
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
        status: 'pending' // Sempre pendente para você aprovar
      }]);

      if (!error) salvos++;
    }

    return NextResponse.json({ success: true, message: `${salvos} produtos importados via API oficial!` });

  } catch (error) {
    console.error("🚨 Erro API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}