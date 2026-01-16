import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Configuração de API Key ausente." }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { message } = await req.json();

    // 1. AUMENTAR O LIMITE DE BUSCA
    // Aumentamos para 200 para a IA ter peças suficientes para montar um PC inteiro.
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, price, category, subcategory, brand, short_description')
      .limit(200); 

    if (error) {
      console.error("Erro Supabase:", error);
      return NextResponse.json({ error: "Erro ao buscar produtos." }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // 2. PREPARAR O CONTEXTO
    const catalogContext = products.map((p: any) => 
      `[ID: ${p.id}] ITEM: ${p.title} | PREÇO: R$${p.price} | TIPO: ${p.subcategory || p.category} | MARCA: ${p.brand}`
    ).join("\n");

    // 3. PROMPT "PC BUILDER"
    const SYSTEM_PROMPT = `
    Você é o especialista em hardware do site "Tech Guide".
    
    ESTOQUE DISPONÍVEL (CATÁLOGO REAL):
    ---
    ${catalogContext}
    ---

    PEDIDO DO USUÁRIO: "${message}"

    SUA MISSÃO (RACIOCÍNIO):
    1. Identifique a intenção do usuário:
       - TIPO A: Busca simples (ex: "melhor mouse", "celular barato"). -> Escolha 1 a 3 melhores opções.
       - TIPO B: Montagem de PC/Setup (ex: "monte um pc gamer até 3000", "kit upgrade", "setup completo"). -> Escolha TODAS as peças necessárias disponíveis no catálogo para formar o computador funcional.

    REGRAS PARA MONTAGEM DE PC (TIPO B):
    - Tente selecionar: 1 Processador, 1 Placa-mãe, 1 Memória RAM (ou 2, se necessário), 1 Armazenamento (SSD), 1 Placa de Vídeo (se o orçamento permitir e for gamer) e 1 Fonte.
    - SOMA DOS PREÇOS: Você DEVE somar os preços mentalmente e tentar ficar DENTRO ou muito próximo do orçamento do usuário.
    - COMPATIBILIDADE: Tente combinar marcas e soquetes logicamente (Ex: Se escolheu Processador Intel, não pegue placa mãe AMD, se possível). Se não tiver a peça exata perfeita, pegue a mais próxima.
    - Se faltar alguma peça essencial no estoque (ex: não tem gabinete), ignore essa peça e monte o resto.

    REGRAS DE RESPOSTA (JSON OBRIGATÓRIO):
    Retorne APENAS um JSON puro, sem markdown, neste formato:
    {
      "recommendations": [
        { 
          "id": "string (Copie EXATAMENTE o ID do produto da lista)", 
          "name": "string (Titulo do produto)", 
          "price": number, 
          "reason": "string (Explique pq escolheu. Ex: 'Processador excelente para jogos' ou 'Placa mãe compatível')" 
        }
      ]
    }
    `;

    // 4. CHAMAR O GEMINI
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    const result = await model.generateContent(SYSTEM_PROMPT);
    const response = await result.response;
    let text = response.text();

    // Limpeza do JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        const data = JSON.parse(text);
        return NextResponse.json(data);
    } catch (parseError) {
        console.error("Erro ao fazer parse do JSON da IA:", text);
        return NextResponse.json({ recommendations: [] });
    }

  } catch (error: any) {
    console.error('❌ Erro IA:', error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}