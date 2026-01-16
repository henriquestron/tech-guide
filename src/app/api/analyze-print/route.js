import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

    // Converte imagem para Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 👇 AQUI ESTÁ O SEGREDO: O MAPA DO SEU SITE 👇
    const prompt = `
    Analise este print de tela de um produto de e-commerce.
    Extraia os dados técnicos e classifique conforme a estrutura do meu site.
    
    --- ESTRUTURA DE CATEGORIAS (Use EXATAMENTE estes slugs) ---
    1. Categoria: 'celulares'
       Subcategorias permitidas: 'android', 'iphone'
    
    2. Categoria: 'notebooks'
       Subcategorias permitidas: 'gamer', 'trabalho' (inclui MacBook), 'acessorios'
    
    3. Categoria: 'computadores'
       Subcategorias permitidas: 'pc-gamer', 'home-office', 'all-in-one'
    
    4. Categoria: 'pecas'
       Subcategorias permitidas: 'processador', 'placa-video', 'placa-mae', 'memoria-ram', 'ssd-hd', 'fonte'
    
    5. Categoria: 'relogios'
       Subcategorias permitidas: 'smartwatch', 'esportivo', 'acessorios'
    
    6. Categoria: 'games'
       Subcategorias permitidas: 'console' (PS5, Xbox, Switch), 'controle', 'jogos', 'acessorios'
    
    7. Categoria: 'acessorios'
       Subcategorias permitidas: 'mouse', 'teclado', 'headset', 'monitor', 'microfone', 'caixa de som', 'Controle' (para PC)

    -----------------------------------------------------------

    SAÍDA ESPERADA (JSON RÍGIDO):
    {
      "title": "Nome completo e exato do produto",
      "price": 100.00 (apenas numeros, ponto para decimais),
      "brand": "Marca (Ex: Samsung, Apple, Dell, Logitech)",
      "category": "slug_da_categoria_acima",
      "subcategory": "slug_da_subcategoria_acima",
      "shortDescription": "Frase de marketing curta (max 10 palavras)",
      "rating": 4.5,
      "fullReview": {
         "verdict": "Veredito técnico direto (Vale a pena?)",
         "pros": ["ponto positivo 1", "ponto positivo 2"],
         "cons": ["ponto negativo 1"],
         "content": "Resumo técnico de 2 parágrafos focado em specs."
      }
    }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type,
        },
      },
    ]);

    const text = result.response.text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const dados = JSON.parse(text);

    return NextResponse.json({ success: true, data: dados });

  } catch (error) {
    console.error("Erro Gemini Vision:", error);
    return NextResponse.json({ error: "Erro ao analisar imagem." }, { status: 500 });
  }
}