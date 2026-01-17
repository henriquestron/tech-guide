import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini Key missing" }, { status: 500 });
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const body = await req.json();
    const { id, title } = body; // Recebe o ID e o Título do produto

    if (!id || !title) return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });

    // --- PERGUNTA PRA IA ---
    const prompt = `
      Analise o produto: "${title}".
      
      Regras de Categorias Possíveis:
      - celulares (sub: iphone, android)
      - notebooks (sub: gamer, trabalho, macbook)
      - computadores (sub: pc-gamer, home-office, all-in-one)  <-- ADICIONE ESSA LINHA
      - pecas (sub: placa-video, processador, placa-mae, memoria-ram, ssd-hd, fonte)
      - acessorios (sub: mouse, teclado, headset, monitor)
      - games (sub: console, controle, jogos)
      - relogios (sub: smartwatch, esportivo, acessorios )

      TAREFA: Retorne a categoria, subcategoria e marca corretas baseadas no título.
      
      JSON RÍGIDO: { "category": "...", "subcategory": "...", "brand": "..." }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").replace(/\*\*/g, "").trim();
    const dadosCorrigidos = JSON.parse(text);

    // --- ATUALIZA NO BANCO ---
    const { error } = await supabase
      .from('products')
      .update({
        category: dadosCorrigidos.category,
        subcategory: dadosCorrigidos.subcategory,
        brand: dadosCorrigidos.brand
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, updated: dadosCorrigidos });

  } catch (error) {
    console.error("Erro Fix:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}