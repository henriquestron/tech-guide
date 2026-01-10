import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuração com a versão específica que você solicitou
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req) {
  let browser = null;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Falta a GEMINI_API_KEY no .env.local" }, { status: 500 });
    }

    const body = await req.json();
    const { termo, categoria } = body;

    // --- DEFINIÇÃO DO MODELO SOLICITADO ---
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    console.log(`\n🤖 ROBÔ INICIADO - MODELO: gemini-flash-latest`);
    console.log(`🔎 Buscando no Mercado Livre: "${termo}"...`);

    // --- FASE 1: PUPPETEER (SCRAPING) ---
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ["--start-maximized", "--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    const url = `https://lista.mercadolivre.com.br/${termo.replace(/ /g, "-")}_NoIndex_True`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(1500);

    const listaProdutos = await page.evaluate(() => {
      const seletores = ['li.ui-search-layout__item', 'div.ui-search-result__wrapper', 'div.poly-card', 'div.andes-card'];
      let elements = [];
      for (const sel of seletores) {
        const achados = document.querySelectorAll(sel);
        if (achados.length > 0) { elements = Array.from(achados); break; }
      }

      const itensValidos = [];
      const linksVistos = new Set();
      const limite = 5;

      for (const item of elements) {
        if (itensValidos.length >= limite) break;

        const linkEl = item.querySelector('a');
        if (!linkEl) continue;

        let linkOriginal = linkEl.href;
        if (linkOriginal.includes('click1') || linkOriginal.includes('mclics')) continue;
        
        let linkLimpo = linkOriginal.split('?')[0];
        if (linksVistos.has(linkLimpo)) continue;
        linksVistos.add(linkLimpo);

        // --- PREÇO ATUAL E ORIGINAL ---
        let currentPrice = 0;
        let originalPrice = 0;

        // Busca preço "De" (Riscado)
        const previousContainer = item.querySelector('.andes-money-amount--previous');
        if (previousContainer) {
            const prevVal = previousContainer.querySelector('.andes-money-amount__fraction');
            if (prevVal) originalPrice = parseFloat(prevVal.innerText.replace(/\./g, '').replace(',', '.'));
        }

        // Busca preço "Por" (Atual)
        const allPrices = Array.from(item.querySelectorAll('.andes-money-amount__fraction'));
        const currentPriceEl = allPrices.find(el => !el.closest('.andes-money-amount--previous'));
        if (currentPriceEl) {
            currentPrice = parseFloat(currentPriceEl.innerText.replace(/\./g, '').replace(',', '.'));
        }

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

    console.log(`🎯 Puppeteer capturou ${listaProdutos.length} produtos.`);
    await browser.close();

    // --- FASE 2: GEMINI (REVIEW) ---
    let salvos = 0;

    for (const produto of listaProdutos) {
      console.log(`🧠 Gerando Review com gemini-flash-latest para: ${produto.titulo}...`);

      let aiData = null;

      try {
        const prompt = `
          Você é um analista Tech. Crie um review para este produto:
          - Nome: "${produto.titulo}"
          - Preço: R$ ${produto.price}
          - Categoria: "${categoria}"
          
          Responda APENAS com um JSON puro:
          {
            "shortDescription": "Frase curta de venda",
            "rating": 4.8,
            "fullReview": {
              "verdict": "Vale a pena por R$ ${produto.price}?",
              "pros": ["Pró 1", "Pró 2"],
              "cons": ["Contra 1"],
              "content": "Análise técnica de 3 linhas."
            }
          }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        aiData = JSON.parse(cleanJson);

      } catch (err) {
        console.error("Erro na IA:", err.message);
      }

      // Fallback para não deixar vazio
      const dadosReview = aiData || {
         shortDescription: `Oferta: ${produto.titulo}`,
         rating: 4.5,
         fullReview: { verdict: "Recomendado", pros: ["Preço"], cons: ["Estoque"], content: "Análise automática." }
      };

      // Cálculo da Oferta (Se não houver original, cria 25% de desconto fake)
      const precoDe = (produto.originalPrice > produto.price) 
                      ? produto.originalPrice 
                      : (produto.price * 1.25); 

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
      await delay(1500); 
    }

    return NextResponse.json({ success: true, message: `${salvos} processados com gemini-flash-latest.` });

  } catch (error) {
    if (browser) await browser.close();
    console.error("🚨 Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}