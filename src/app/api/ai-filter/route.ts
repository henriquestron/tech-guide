import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  // --- INÍCIO DO BLOCO DE DEBUG ---
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log("--- DEBUG IA START ---");
  
  if (!apiKey) {
    console.error("❌ ERRO CRÍTICO: A variável GEMINI_API_KEY está vazia (undefined) no servidor!");
    return NextResponse.json({ error: "Configuração de API Key ausente. Verifique as variáveis de ambiente na Vercel." }, { status: 500 });
  } else {
    // Mostra os 4 primeiros caracteres para você confirmar se é a chave certa (sem vazar a senha toda)
    console.log(`✅ Variável de ambiente detectada. Inicia com: ${apiKey.substring(0, 4)}... (Total de caracteres: ${apiKey.length})`);
  }
  // --- FIM DO BLOCO DE DEBUG ---

  // Inicializa o Gemini aqui dentro para garantir que usamos a chave verificada
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { message } = await req.json();

    // 1. BUSCAR PRODUTOS NO SUPABASE
    // (Mantive short_description com underline pq é assim que está no seu banco)
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, price, category, subcategory, brand, short_description, rating')
      .limit(50);

    if (error) {
      console.error("❌ Erro Supabase:", error);
      return NextResponse.json({ error: "Erro ao buscar produtos: " + error.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
      console.warn("⚠️ A busca no Supabase retornou 0 produtos.");
      return NextResponse.json({ recommendations: [] });
    }

    console.log(`📦 Produtos recuperados do banco: ${products.length}`);

    // 2. PREPARAR O CONTEXTO PARA A IA
    const catalogContext = products.map((p: any) => 
      `ID: ${p.id} | Produto: ${p.title} | Preço: R$${p.price} | Categoria: ${p.category} > ${p.subcategory || ''} | Marca: ${p.brand || 'N/A'} | Info: ${p.short_description}`
    ).join("\n");

    const SYSTEM_PROMPT = `
    Você é um especialista em vendas do site "Tech Guide".
    Abaixo está a lista REAL de produtos disponíveis no nosso estoque:

    --- INÍCIO DO CATÁLOGO ---
    ${catalogContext}
    --- FIM DO CATÁLOGO ---

    SUA MISSÃO:
    Analise o pedido do usuário: "${message}".
    Escolha de 1 a 3 produtos dessa lista que melhor atendem ao pedido.
    
    CRITÉRIOS DE ESCOLHA:
    - Se o usuário pedir "barato", priorize preço baixo.
    - Se pedir "melhor" ou "top", priorize rating e specs na descrição.
    - Se pedir marca específica (ex: Logitech), filtre pela marca.

    REGRAS DE RESPOSTA (JSON):
    Retorne APENAS um JSON com este formato exato:
    {
      "recommendations": [
        { 
          "id": "string (copie exatamente o ID do catálogo)", 
          "name": "string (nome do produto)", 
          "price": number, 
          "reason": "string (Uma frase curta e persuasiva explicando por que você escolheu este produto)" 
        }
      ]
    }
    Se nenhum produto servir, retorne "recommendations": [].
    `;

    // 3. CHAMAR O GEMINI
    // Usando o modelo flash que é mais rápido e grátis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log("🤖 Enviando prompt para o Gemini...");
    const result = await model.generateContent(SYSTEM_PROMPT);
    const response = await result.response;
    let text = response.text();

    console.log("✅ Resposta da IA recebida!");

    // Limpeza de segurança
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(text);
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ Erro durante execução da IA:', error);
    // Retorna o erro detalhado para ajudar no debug
    return NextResponse.json({ 
      error: "Erro interno no servidor", 
      details: error.message || error 
    }, { status: 500 });
  }
}