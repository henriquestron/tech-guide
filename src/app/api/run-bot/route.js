import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Importações do Puppeteer Híbrido
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer"; // Mantemos o normal para rodar no seu PC
import chromium from "@sparticuz/chromium";

// --- CONFIGURAÇÃO VERCEL (Aumenta tempo limite para 60s) ---
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req) {
  let browser = null;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Falta a GEMINI_API_KEY" }, { status: 500 });
    }

    const body = await req.json();
    const { termo, categoria } = body;
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    console.log(`\n🤖 ROBÔ VERCEL/LOCAL - Buscando: "${termo}"`);

    // --- LÓGICA HÍBRIDA DE NAVEGADOR ---
    let launchOptions;
    let puppeteerInstance;

    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      // ESTOU NA VERCEL (NUVEM)
      console.log("☁️ Rodando em modo NUVEM (Chromium Leve)");
      
      // Configura o Chromium para Vercel
      chromium.setGraphicsMode = false;
      
      puppeteerInstance = puppeteerCore;
      launchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      };
    } else {
      // ESTOU NO SEU PC (LOCAL)
      console.log("💻 Rodando em modo LOCAL (Chrome Completo)");
      puppeteerInstance = puppeteer;
      launchOptions = {
        headless: false, // Abre janela pra você ver
        args: ["--start-maximized", "--no-sandbox"],
        defaultViewport: null,
      };
    }

    // Lança o navegador com a opção escolhida
    browser = await puppeteerInstance.launch(launchOptions);
    const page = await browser.newPage();
    
    // User Agent genérico para evitar bloqueio
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    const url = `https://lista.mercadolivre.com.br/${termo.replace(/ /g, "-")}_NoIndex_True`;
    
    // Timeout maior para garantir carregamento na nuvem
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    
    // Scroll leve
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(1000);

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

    // --- GEMINI ---
    let salvos = 0;
    for (const produto of listaProdutos) {
      // Fallback básico se IA falhar
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
      // Delay menor na Vercel pra não estourar tempo
      await delay(500); 
    }

    return NextResponse.json({ success: true, message: `${salvos} salvos (Modo Nuvem).` });

  } catch (error) {
    if (browser) await browser.close();
    console.error("🚨 Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}