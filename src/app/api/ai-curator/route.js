import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cache simples para não gastar sua cota da API a cada F5 (dura 1 hora)
let cacheCuradoria = null;
let lastUpdate = 0;

export async function POST(req) {
  try {
    // 1. Verifica Cache (Para ser rápido e economizar IA)
    const now = Date.now();
    if (cacheCuradoria && (now - lastUpdate < 1000 * 60 * 60)) {
        return NextResponse.json(cacheCuradoria);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 2. Busca os produtos do banco (Só ID, Titulo e Preço para economizar tokens)
    const { data: products } = await supabase
        .from('products')
        .select('id, title, price, category, brand')
        .eq('status', 'approved')
        .limit(30); // Analisa os 30 últimos produtos (ou remova o limit para ver todos)

    if (!products || products.length === 0) {
        return NextResponse.json({ collections: [] });
    }

    // 3. Transforma em texto para a IA ler
    const inventoryText = products.map(p => `ID:${p.id} | ${p.title} | R$${p.price} | ${p.category}`).join('\n');

    // 4. O Prompt Mágico
    const prompt = `
      Atue como um Curador de Loja Tech Experiente.
      Analise meu estoque abaixo e crie 3 COLEÇÕES TEMÁTICAS E CRIATIVAS para a página inicial hoje.
      Não use categorias óbvias como "Celulares". Seja específico, ex: "Para Jogar CS2 Barato", "Home Office de Luxo", "Foco em Produtividade", "Kits de Entrada".

      Estoque:
      ${inventoryText}

      Retorne APENAS um JSON com esta estrutura:
      {
        "collections": [
          {
            "title": "Nome Criativo da Coleção",
            "emoji": "🔥",
            "description": "Uma frase curta vendendo essa ideia",
            "productIds": [id1, id2, id3]
          }
        ]
      }
      Selecione de 2 a 4 produtos por coleção. Não invente IDs.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);

    // 5. Salva no Cache
    cacheCuradoria = data;
    lastUpdate = now;

    return NextResponse.json(data);

  } catch (error) {
    console.error("Erro Curador IA:", error);
    // Fallback se a IA falhar: retorna vazio pro site não quebrar
    return NextResponse.json({ collections: [] });
  }
}