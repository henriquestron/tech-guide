import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Função auxiliar para limpar asteriscos teimosos
function limparTexto(texto) {
  if (!texto) return "";
  return texto.replace(/\*\*/g, "").replace(/\*/g, "").trim();
}

export async function POST(req) {
  let browser = null;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Falta a GEMINI_API_KEY" }, { status: 500 });
    }

    const body = await req.json();
    const { termo, categoria } = body;

    // Modelo Flash Latest (Sua preferência)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    console.log(`\n🤖 ROBÔ LIMPO (SEM ASTERISCOS)`);
    console.log(`🔎 Buscando: "${termo}"...`);

    // --- FASE 1: PUPPETEER ---
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

        // Preços
        let currentPrice = 0;
        let originalPrice = 0;

        const previousContainer = item.querySelector('.andes-money-amount--previous');
        if (previousContainer) {
            const prevVal = previousContainer.querySelector('.andes-money-amount__fraction');
            if (prevVal) originalPrice = parseFloat(prevVal.innerText.replace(/\./g, '').replace(',', '.'));
        }

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

    console.log(`🎯 Puppeteer: ${listaProdutos.length} produtos.`);
    await browser.close();

    // --- FASE 2: GEMINI (SEM FORMATAÇÃO) ---
    let salvos = 0;

    for (const produto of listaProdutos) {
      console.log(`🧠 Gemini gerando texto limpo para: ${produto.titulo}...`);

      let aiData = null;

      try {
        const prompt = `
          Você é um especialista em SEO. Analise:
          - Produto: "${produto.titulo}"
          - Preço: R$ ${produto.price}
          - Categoria: "${categoria}"

          REGRAS RÍGIDAS DE FORMATAÇÃO:
          1. NÃO USE asteriscos (**), negrito ou markdown.
          2. Escreva apenas texto plano e limpo.
          3. Use Keywords de busca para SEO no texto.

          Responda APENAS JSON:
          {
            "shortDescription": "Meta description persuasiva (sem asteriscos)",
            "rating": 4.8,
            "fullReview": {
              "verdict": "Veredito direto (sem asteriscos)",
              "pros": ["Ponto 1", "Ponto 2"],
              "cons": ["Ponto negativo"],
              "content": "Texto corrido de 3 linhas focado em conversão. Texto limpo."
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

      const dadosReview = aiData || {
         shortDescription: `Oferta imperdível: ${produto.titulo}`,
         rating: 4.5,
         fullReview: { verdict: "Recomendado", pros: ["Preço", "Qualidade"], cons: ["Estoque"], content: "Análise automática." }
      };

      // --- LIMPEZA DE SEGURANÇA FINAL ---
      // Mesmo se a IA desobedecer, nós removemos os asteriscos aqui na força bruta
      dadosReview.shortDescription = limparTexto(dadosReview.shortDescription);
      dadosReview.fullReview.verdict = limparTexto(dadosReview.fullReview.verdict);
      dadosReview.fullReview.content = limparTexto(dadosReview.fullReview.content);
      dadosReview.fullReview.pros = dadosReview.fullReview.pros.map(p => limparTexto(p));
      dadosReview.fullReview.cons = dadosReview.fullReview.cons.map(c => limparTexto(c));

      // Preço Oferta
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

    return NextResponse.json({ success: true, message: `${salvos} produtos limpos salvos.` });

  } catch (error) {
    if (browser) await browser.close();
    console.error("🚨 Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}