import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer";

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
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const body = await req.json();
    const { termo, categoria, subcategoria, limit = 3 } = body; 

    console.log(`\n🤖 ROBÔ - Recebido: "${termo}" | Limite: ${limit}`);

    // --- BUSCA INTELIGENTE ---
    let termoDeBusca = termo;
    try {
        const promptSearch = `
        Atue como um especialista em busca do Mercado Livre.
        O usuário digitou: "${termo}".
        Converta isso em um termo de busca OTIMIZADO e TÉCNICO.
        Responda APENAS o termo novo, sem aspas.
        `;
        const resultSearch = await model.generateContent(promptSearch);
        termoDeBusca = resultSearch.response.text().trim();
        console.log(`🧠 IA traduziu "${termo}" para -> "${termoDeBusca}"`);
    } catch (e) {
        console.log("Uso do termo original.");
    }

    // 2. Inicia o Puppeteer
    browser = await puppeteer.launch({
      headless: "new", 
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    const url = `https://lista.mercadolivre.com.br/${termoDeBusca.replace(/ /g, "-")}_NoIndex_True`;
    
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 2000));

    // --- SCRAPING ---
    const listaProdutos = await page.evaluate((limiteMax) => { 
      const seletores = ['li.ui-search-layout__item', 'div.ui-search-result__wrapper', 'div.poly-card', 'div.andes-card'];
      let elements = [];
      for (const sel of seletores) {
        const achados = document.querySelectorAll(sel);
        if (achados.length > 0) { elements = Array.from(achados); break; }
      }

      const itensValidos = [];
      const linksVistos = new Set();
      
      for (const item of elements) {
        if (itensValidos.length >= limiteMax) break;
        
        const linkEl = item.querySelector('a');
        if (!linkEl) continue;
        
        let linkOriginal = linkEl.href;
        if (linkOriginal.includes('click1') || linkOriginal.includes('mclics')) continue;
        
        let linkLimpo = linkOriginal.split('?')[0];
        if (linksVistos.has(linkLimpo)) continue;
        linksVistos.add(linkLimpo);

        let currentPrice = 0;
        let originalPrice = 0;
        
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

        // Captura de Avaliação
        let ratingScraped = 0;
        const ratingEl = item.querySelector('.ui-search-reviews__rating-number') || 
                         item.querySelector('.poly-reviews__rating') ||
                         item.querySelector('.andes-visually-hidden'); 
        
        if (ratingEl) {
            const text = ratingEl.innerText.trim();
            const match = text.match(/([0-5][.,][0-9])/);
            if (match) ratingScraped = parseFloat(match[0].replace(',', '.'));
        }

        if (titulo && currentPrice > 0) {
            itensValidos.push({ titulo, price: currentPrice, originalPrice, image: imagem, link: linkLimpo, ratingScraped });
        }
      }
      return itensValidos;
    }, limit);

    console.log(`🎯 Encontrados: ${listaProdutos.length} produtos`);
    await browser.close();

    // --- GEMINI (Gerar Reviews e Identificar Marca) ---
    let salvos = 0;
    for (const produto of listaProdutos) {
      
      const finalRating = produto.ratingScraped > 0 ? produto.ratingScraped : 4.5;

      // Objeto padrão caso a IA falhe
      let dadosReview = {
         brand: "Genérico", // Padrão
         shortDescription: `Oferta: ${produto.titulo}`,
         rating: finalRating,
         fullReview: { verdict: "Recomendado", pros: ["Custo-benefício"], cons: ["Verificar frete"], content: "Análise baseada nas especificações." }
      };

      try {
        // --- 🧠 O PULO DO GATO AQUI ---
        // Pedi para a IA extrair a marca ("brand") do título
        // ATUALIZAÇÃO AQUI: Adicionei a lista de categorias no prompt para a IA não se perder
        const prompt = `
          Analise este produto: "${produto.titulo}".
          Preço: R$ ${produto.price}. 
          Categoria Selecionada: "${categoria}" (Sub: "${subcategoria || 'Geral'}").
          
          CONTEXTO DAS CATEGORIAS DO SITE:
          - computadores (sub: pc-gamer, home-office, all-in-one)
          - celulares (sub: iphone, android)
          - notebooks (sub: gamer, trabalho, macbook)
          - pecas (sub: placa-video, processador, placa-mae, memoria-ram)
          - games (sub: console, controle, jogos)
          
          TAREFA 1: Identifique a MARCA (Ex: Apple, Samsung, Dell, Acer, Logitech, Pichau, etc). Se não tiver marca clara, use "Genérico".
          TAREFA 2: Escreva um review curto focado na categoria "${categoria}".

          JSON RÍGIDO: 
          { 
            "brand": "Nome da Marca",
            "shortDescription": "frase curta vendedora", 
            "fullReview": { 
                "verdict": "Veredito final", 
                "pros": ["item1", "item2"], 
                "cons": ["item1"], 
                "content": "Resumo detalhado." 
            } 
          }
        `;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").replace(/\*\*/g, "").trim();
        const jsonIA = JSON.parse(text);

        dadosReview = {
            ...dadosReview,
            ...jsonIA,
            rating: finalRating
        };

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
        
        // AQUI ESTÁ A CORREÇÃO:
        brand: dadosReview.brand || "Tech", // Usa a marca que a IA achou
        
        rating: Number(dadosReview.rating),
        short_description: dadosReview.shortDescription,
        full_review: dadosReview.fullReview
      }]);

      if (!error) salvos++;
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({ success: true, message: `${salvos} salvos.` });

  } catch (error) {
    if (browser) await browser.close();
    console.error("🚨 Erro Fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}