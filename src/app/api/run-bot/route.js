import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos limite para Serverless

export async function POST(req) { 
  let browser = null;

  try {
    // 1. Verificações
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini Key missing" }, { status: 500 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "Supabase URL missing" }, { status: 500 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // --- LÓGICA DE AUTO-PILOTO ---
    let body = {};
    try { body = await req.json(); } catch (e) {}

    // 📜 SUPER LISTA DE PRODUTOS (Cobre todas as categorias da sua imagem)
    const listaAutomatica = [
      // CELULARES
      { termo: "iphone desbloqueado", categoria: "celulares", subcategoria: "iphone" },
{ termo: "iphone pro max", categoria: "celulares", subcategoria: "iphone" },
{ termo: "iphone usado bom estado", categoria: "celulares", subcategoria: "iphone" },

{ termo: "samsung galaxy s", categoria: "celulares", subcategoria: "android" },
{ termo: "samsung galaxy a", categoria: "celulares", subcategoria: "android" },
{ termo: "xiaomi poco", categoria: "celulares", subcategoria: "android" },
{ termo: "motorola edge", categoria: "celulares", subcategoria: "android" },
{ termo: "smartphone android 5g", categoria: "celulares", subcategoria: "android" },


      // NOTEBOOKS
      { termo: "notebook gamer", categoria: "notebooks", subcategoria: "gamer" },
{ termo: "notebook gamer rtx", categoria: "notebooks", subcategoria: "gamer" },

{ termo: "macbook air", categoria: "notebooks", subcategoria: "macbook" },
{ termo: "macbook pro", categoria: "notebooks", subcategoria: "macbook" },

{ termo: "notebook para trabalho", categoria: "notebooks", subcategoria: "trabalho" },
{ termo: "notebook i5 ssd", categoria: "notebooks", subcategoria: "trabalho" },


      // COMPUTADORES
      { termo: "pc gamer", categoria: "computadores", subcategoria: "pc-gamer" },
{ termo: "pc gamer rtx", categoria: "computadores", subcategoria: "pc-gamer" },
{ termo: "pc gamer ryzen", categoria: "computadores", subcategoria: "pc-gamer" },

{ termo: "computador all in one", categoria: "computadores", subcategoria: "all-in-one" },

      // PEÇAS PC
      { termo: "placa de video rtx", categoria: "pecas", subcategoria: "placa-video" },
{ termo: "placa de video amd rx", categoria: "pecas", subcategoria: "placa-video" },

{ termo: "processador ryzen", categoria: "pecas", subcategoria: "processador" },
{ termo: "processador intel core i5", categoria: "pecas", subcategoria: "processador" },

{ termo: "ssd nvme", categoria: "pecas", subcategoria: "ssd-hd" },
{ termo: "memoria ram ddr4", categoria: "pecas", subcategoria: "memoria-ram" },
{ termo: "fonte 80 plus", categoria: "pecas", subcategoria: "fonte" }
,

      // GAMES
      { termo: "console playstation 5", categoria: "games", subcategoria: "console" },
{ termo: "console xbox series", categoria: "games", subcategoria: "console" },
{ termo: "nintendo switch", categoria: "games", subcategoria: "console" },

{ termo: "controle ps5", categoria: "games", subcategoria: "controle" },
{ termo: "controle xbox", categoria: "games", subcategoria: "controle" }
,

      // ACESSÓRIOS
      { termo: "headset gamer", categoria: "acessorios", subcategoria: "headset" },
{ termo: "mouse gamer", categoria: "acessorios", subcategoria: "mouse" },
{ termo: "teclado mecanico", categoria: "acessorios", subcategoria: "teclado" },

{ termo: "monitor gamer", categoria: "acessorios", subcategoria: "monitor" },
{ termo: "monitor 144hz", categoria: "acessorios", subcategoria: "monitor" }
,

      // RELÓGIOS
      { termo: "apple watch", categoria: "relogios", subcategoria: "smartwatch" },
{ termo: "samsung galaxy watch", categoria: "relogios", subcategoria: "smartwatch" },
{ termo: "relogio esportivo garmin", categoria: "relogios", subcategoria: "esportivo" }

    ];

    let { termo, categoria, subcategoria, limit = 3 } = body;

    // Se não veio termo (chamada automática do CronJob), sorteia um!
    if (!termo) {
        const sorteado = listaAutomatica[Math.floor(Math.random() * listaAutomatica.length)];
        termo = sorteado.termo;
        categoria = sorteado.categoria;
        subcategoria = sorteado.subcategoria;
        console.log(`🎲 Sorteio Automático: "${termo}"`);
    }

    // OTIMIZAÇÃO DE BUSCA (IA)
    let termoDeBusca = termo;
    try {
        const promptSearch = `Otimize o termo "${termo}" para busca no Mercado Livre (ex: tire 'barato'). Responda SÓ o termo.`;
        const resultSearch = await model.generateContent(promptSearch);
        termoDeBusca = resultSearch.response.text().trim();
    } catch (e) {
        console.log("IA falhou na otimização, usando original.");
    }

    // PUPPETEER
    browser = await puppeteer.launch({
      headless: "new", 
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    const url = `https://lista.mercadolivre.com.br/${termoDeBusca.replace(/ /g, "-")}_NoIndex_True`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    
    await page.evaluate(() => window.scrollBy(0, 500)); 
    await new Promise(r => setTimeout(r, 1000));

    // SCRAPING
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
            
            let linkOriginal = linkEl.href.split('?')[0]; 
            if (linkOriginal.includes('click1')) continue;
            if (linksVistos.has(linkOriginal)) continue;
            linksVistos.add(linkOriginal);

            const priceEl = item.querySelector('.andes-money-amount__fraction');
            const titleEl = item.querySelector('.ui-search-item__title') || item.querySelector('.poly-component__title') || item.querySelector('h2');
            const imgEl = item.querySelector('img');

            if (titleEl && priceEl) {
                let preco = parseFloat(priceEl.innerText.replace(/\./g, '').replace(',', '.'));
                let imagem = imgEl ? (imgEl.getAttribute('data-src') || imgEl.src) : "";
                itensValidos.push({ titulo: titleEl.innerText, price: preco, originalPrice: preco * 1.2, image: imagem, link: linkOriginal });
            }
        }
        return itensValidos;
    }, limit);

    await browser.close();
    browser = null; 

    // SALVAMENTO COM REVIEW DA IA
    let salvos = 0;
    for (const produto of listaProdutos) {
        let dadosReview = { brand: "Genérico", shortDescription: `Oferta: ${produto.titulo}`, rating: 4.5, fullReview: {} };
        
        try {
            const prompt = `
            Produto: "${produto.titulo}". Preço: R$ ${produto.price}. Categoria: ${categoria}. 
            JSON: { "brand": "Marca", "shortDescription": "Frase curta", "fullReview": { "verdict": "Veredito", "pros": [], "cons": [], "content": "..." } }`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
            dadosReview = { ...dadosReview, ...JSON.parse(text) };
        } catch (err) {}

        const { error } = await supabase.from('products').insert([{
            title: produto.titulo,
            image: produto.image,
            price: produto.price,
            original_price: produto.originalPrice,
            link: produto.link,
            category: categoria,
            subcategory: subcategoria,
            brand: dadosReview.brand,
            rating: dadosReview.rating,
            short_description: dadosReview.shortDescription,
            full_review: dadosReview.fullReview,
            status: 'pending' // VAI PRA ABA PENDENTES
        }]);
        if (!error) salvos++;
    }

    return NextResponse.json({ success: true, message: `Auto-piloto: ${salvos} novos produtos de ${termo} salvos.` });

  } catch (error) {
    if (browser) await browser.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}