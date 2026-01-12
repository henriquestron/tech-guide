import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";

// Configura o Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. BUSCAR PRODUTOS NO SUPABASE
    // CORREÇÃO: Usando 'short_description' com underline, como está no banco
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, price, category, subcategory, brand, short_description, rating')
      .limit(50);

    if (error) {
      console.error("Erro Supabase:", error);
      // Retorna o erro detalhado no console para facilitar debugging futuro
      return NextResponse.json({ error: "Erro ao buscar produtos: " + error.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // 2. PREPARAR O CONTEXTO PARA A IA
    // CORREÇÃO: Acessando p.short_description aqui também
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
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(SYSTEM_PROMPT);
    const response = await result.response;
    let text = response.text();

    // Limpeza de segurança
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(text);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro na IA:', error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}