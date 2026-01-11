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
    if (!process.env.GEMINI_API_KEY) {
       return NextResponse.json({ error: "Gemini API Key não configurada" }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
       return NextResponse.json({ error: "Supabase URL não configurada" }, { status: 500 });
    }

    // 2. Conexões
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const body = await req.json();
    const { termo, categoria } = body;

    console.log(`\n🤖 ROBÔ RENDER - Iniciando busca: "${termo}"`);

    // 3. Inicia o Puppeteer (Modo Servidor Docker)
    browser = await puppeteer.launch({
      headless: "new", // Modo sem interface gráfica (obrigatório em servidor)
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Importante para evitar crash de memória no Docker
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();
    // User Agent para não parecer robô
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    const url = `https://lista.mercadolivre.com.br/${termo.replace(/ /g, "-")}_NoIndex_True`;
    
    // Timeout generoso (60s)
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    
    // Scroll para carregar imagens
    await page.evaluate(() => window.scrollBy(0, 500));
    
    // Função de delay simples
    await new Promise(r => setTimeout(r, 2000));

    // --- SCRAPING (Igual ao anterior) ---
    const listaProdutos = await page.evaluate(() => {
      const seletores = ['li.ui-search-layout__item', 'div.ui-search-result__wrapper', 'div.poly-card', 'div.andes-card'];
      let elements = [];
      for (const sel of seletores) {
        const achados = document.querySelectorAll(sel);
        if (achados.length > 0) { elements = Array.from(achados); break; }
      }

      const itensValidos = [];
      const linksVistos = new Set();
      const limite = 5; // Pode aumentar no Render se quiser

      for (const item of elements) {
        if (itensValidos.length >= limite) break;
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

        if (titulo && currentPrice > 0) {
            itensValidos.push({ titulo, price: currentPrice, originalPrice, image: imagem, link: linkLimpo });
        }
      }
      return itensValidos;
    });

    console.log(`🎯 Encontrados: ${listaProdutos.length}`);
    await browser.close();

    // --- GEMINI (IA) ---
    let salvos = 0;
    for (const produto of listaProdutos) {
      let dadosReview = {
         shortDescription: `Oferta: ${produto.titulo}`,
         rating: 4.5,
         fullReview: { verdict: "Recomendado", pros: ["Preço"], cons: ["Estoque"], content: "Análise automática." }
      };

      try {
        const prompt = `
          Especialista SEO. Produto: "${produto.titulo}", Preço: R$ ${produto.price}, Cat: "${categoria}".
          REGRAS: SEM asteriscos, SEM markdown. Texto limpo.
          JSON: { "shortDescription": "...", "rating": 4.8, "fullReview": { "verdict": "...", "pros": ["..."], "cons": ["..."], "content": "..." } }
        `;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").replace(/\*\*/g, "").trim();
        dadosReview = JSON.parse(text);
      } catch (err) { console.error("Erro IA:", err.message); }

      const precoDe = (produto.originalPrice > produto.price) ? produto.originalPrice : (produto.price * 1.25); 

      const { error } = await supabase.from('products').insert([{
        title: produto.titulo,
        image: produto.image,
        price: produto.price,
        original_price: precoDe,
        link: produto.link,
        category: categoria,
        brand: "Tech",
        rating: Number(dadosReview.rating),
        short_description: dadosReview.shortDescription,
        full_review: dadosReview.fullReview
      }]);

      if (!error) salvos++;
      // Delay curto
      await new Promise(r => setTimeout(r, 500));
    }

    return NextResponse.json({ success: true, message: `${salvos} produtos processados no Render.` });

  } catch (error) {
    if (browser) await browser.close();
    console.error("🚨 Erro Fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}