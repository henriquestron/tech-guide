import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  console.log("🚀 [DEBUG] Iniciando AI Curator...");

  try {
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ [DEBUG] ERRO: Sem GEMINI_API_KEY");
        return NextResponse.json({ collections: [] });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 1. BUSCA DEBUG (Pega tudo, sem filtro de status, pra testar)
    console.log("🔍 [DEBUG] Buscando produtos no Supabase...");
    
    const { data: products, error } = await supabase
        .from('products')
        .select('id, title, price, category, status, expires_at')
        .order('id', { ascending: false }) 
        .limit(20); 

    if (error) {
        console.error("❌ [DEBUG] Erro Supabase:", error.message);
        return NextResponse.json({ collections: [] });
    }

    console.log(`📦 [DEBUG] Total produtos encontrados: ${products?.length || 0}`);

    if (!products || products.length === 0) {
        console.warn("⚠️ [DEBUG] Nenhum produto no banco. Adicione produtos!");
        return NextResponse.json({ collections: [] });
    }

    // 2. FILTRO DE VALIDADE
    const validProducts = products.filter(p => {
        // Se for "pending" e NÃO tiver data de validade (upload normal não aprovado), ignora
        if (p.status === 'pending' && !p.expires_at) return false;
        
        // Se tiver data de validade, verifica se venceu
        if (p.expires_at) {
            const isValid = new Date(p.expires_at) > new Date();
            if (!isValid) console.log(`⏳ [DEBUG] Produto expirado ignorado: ${p.title}`);
            return isValid;
        }
        
        return true;
    });

    console.log(`✅ [DEBUG] Produtos Válidos para a IA: ${validProducts.length}`);

    if (validProducts.length < 2) {
        console.warn("⚠️ [DEBUG] Poucos produtos válidos para criar coleções (mínimo 2).");
        // Vou deixar passar mesmo assim pra testar, mas a IA pode reclamar
    }

    // 3. PREPARA TEXTO
    const inventoryText = validProducts.map(p => 
        `ID:${p.id} | ${p.title} | R$${p.price} | ${p.expires_at ? '[⚡OFERTA RELÂMPAGO]' : ''}`
    ).join('\n');

    // 4. CHAMA A IA
    console.log("🤖 [DEBUG] Enviando prompt para o Gemini...");
    
    const prompt = `
      Atue como um Curador Tech. Crie 3 coleções com os produtos abaixo.
      ESTOQUE:
      ${inventoryText}
      
      Retorne APENAS este JSON (sem markdown):
      {
        "collections": [
          { "title": "Titulo", "emoji": "🔥", "description": "Descricao", "productIds": [ids_aqui] }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    console.log("📥 [DEBUG] Resposta Bruta da IA:", text.substring(0, 100) + "..."); // Mostra só o começo

    // Limpeza agressiva
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let data;
    try {
        data = JSON.parse(text);
        console.log("🎉 [DEBUG] JSON Parse Sucesso! Coleções geradas:", data.collections.length);
    } catch (e) {
        console.error("❌ [DEBUG] Erro ao converter JSON da IA. Texto recebido:", text);
        return NextResponse.json({ collections: [] });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("🚨 [DEBUG] Erro Crítico:", error);
    return NextResponse.json({ collections: [] });
  }
}