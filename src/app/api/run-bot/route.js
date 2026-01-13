import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer";

// Configurações para o Next.js não cachear
export const dynamic = 'force-dynamic';

export async function POST(req) { 
  let browser = null;

  try {
    // 1. Verificação de Chaves
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini Key missing" }, { status: 500 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "Supabase URL missing" }, { status: 500 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Usando a versão flash conforme solicitado
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const body = await req.json();
    // Recebe o limite do front (padrão 3 se não vier nada)
    const { termo, categoria, subcategoria, limit = 3 } = body; 

    console.log(`\n🤖 ROBÔ - Recebido: "${termo}" | Limite: ${limit}`);

    // --- NOVO: BUSCA INTELIGENTE COM IA ---
    // A IA traduz "pc que roda gta" para "pc gamer i5 16gb placa video"
    let termoDeBusca = termo;
    try {
        const promptSearch = `
        Atue como um especialista em busca do Mercado Livre.
        O usuário digitou: "${termo}".
        Converta isso em um termo de busca OTIMIZADO e TÉCNICO para encontrar os melhores produtos.
        Exemplo: "pc que roda tudo" -> "pc gamer completo i7 rtx"
        Exemplo: "mouse pra jogar cs" -> "mouse gamer logitech 12000dpi"
        Responda APENAS o termo novo, sem aspas, sem explicações.
        `;
        const resultSearch = await model.generateContent(promptSearch);
        termoDeBusca = resultSearch.response.text().trim();
        console.log(`🧠 IA traduziu "${termo}" para -> "${termoDeBusca}"`);
    } catch (e) {
        console.log("Falha na tradução da busca, usando termo original.");
    }

    // 2. Inicia o Puppeteer
    browser = await puppeteer.launch({
      headless: "new", 
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    // Usa o termo otimizado pela IA na URL
    const url = `https://lista.mercadolivre.com.br/${termoDeBusca.replace(/ /g, "-")}_NoIndex_True`;
    
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 2000));

    // --- SCRAPING ---
    const listaProdutos = await page.evaluate((limiteMax) => { // Passamos o limite pra dentro do navegador
      const seletores = ['li.ui-search-layout__item', 'div.ui-search-result__wrapper', 'div.poly-card', 'div.andes-card'];
      let elements = [];
      for (const sel of seletores) {
        const achados = document.querySelectorAll(sel);
        if (achados.length > 0) { elements = Array.from(achados); break; }
      }

      const itensValidos = [];
      const linksVistos = new Set();
      
      for (const item of elements) {
        if (itensValidos.length >= limiteMax) break; // Usa o limite dinâmico
        
        const linkEl = item.querySelector('a');
        if (!linkEl) continue;
        
        let linkOriginal = linkEl.href;
        if (linkOriginal.includes('click1') || linkOriginal.includes('mclics')) continue;
        
        let linkLimpo = linkOriginal.split('?')[0];
        if (linksVistos.has(linkLimpo)) continue;
        linksVistos.add(linkLimpo);

        let currentPrice = 0;
        let originalPrice = 0;
        
        // Lógica de preço (mantida igual)
        const previousContainer = item.querySelector('.andes-money-amount--previous');
        if (previousContainer) {
            const prevVal = previousContainer.querySelector('.andes-money-amount__fraction');
            if (prevVal) originalPrice = parseFloat(prevVal.innerText.replace(/\./g, '').replace(',', '.'));
        }
        
        const allPrices = Array.from(item.querySelectorAll('.andes-money-amount__fraction'));
        const currentPriceEl = allPrices.find(el => !el.closest('.andes-money-amount--previous'));
        if (currentPriceEl) currentPrice = parseFloat(currentPriceEl.innerText.replace(/\./g, '').replace(',', '.'));

        const titleEl = item.querySelector('.ui-search-item__title') || item.querySelector('.poly-component__title') || item.querySelector('h2');
        const imgEl = item.querySelector('img');
        let titulo = titleEl ? titleEl.innerText.trim() : "";
        let imagem = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || "") : "";

        if (titulo && currentPrice > 0) {
            itensValidos.push({ titulo, price: currentPrice, originalPrice, image: imagem, link: linkLimpo });
        }
      }
      return itensValidos;
    }, limit); // Passa o 'limit' como argumento para a função evaluate

    console.log(`🎯 Encontrados: ${listaProdutos.length} produtos (Limite pedido: ${limit})`);
    await browser.close();

    // --- GEMINI (Gerar Reviews) ---
    let salvos = 0;
    for (const produto of listaProdutos) {
      let dadosReview = {
         shortDescription: `Oferta: ${produto.titulo}`,
         rating: 4.5,
         fullReview: { verdict: "Recomendado", pros: ["Custo-benefício"], cons: ["Verificar frete"], content: "Análise baseada nas especificações." }
      };

      try {
        const prompt = `
          Especialista Tech. Produto: "${produto.titulo}", Preço: R$ ${produto.price}.
          Categoria: "${categoria}", Subcategoria: "${subcategoria || 'Geral'}".
          Analise o produto.
          JSON RÍGIDO: { "shortDescription": "frase curta vendedora", "rating": 4.5, "fullReview": { "verdict": "Veredito final", "pros": ["item1", "item2"], "cons": ["item1"], "content": "Resumo detalhado em 1 parágrafo." } }
        `;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").replace(/\*\*/g, "").trim();
        dadosReview = JSON.parse(text);
      } catch (err) { console.error("Erro IA Review:", err.message); }

      const precoDe = (produto.originalPrice > produto.price) ? produto.originalPrice : (produto.price * 1.25); 

      const { error } = await supabase.from('products').insert([{
        title: produto.titulo,
        image: produto.image,
        price: produto.price,
        original_price: precoDe,
        link: produto.link,
        category: categoria,
        subcategory: subcategoria || null,
        brand: "Tech", // Se quiser, peça pra IA extrair a marca no JSON acima
        rating: Number(dadosReview.rating),
        short_description: dadosReview.shortDescription,
        full_review: dadosReview.fullReview
      }]);

      if (!error) salvos++;
      // Pequeno delay para não sobrecarregar o banco
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({ success: true, message: `${salvos} processados. (Busca usada: ${termoDeBusca})` });

  } catch (error) {
    if (browser) await browser.close();
    console.error("🚨 Erro Fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}