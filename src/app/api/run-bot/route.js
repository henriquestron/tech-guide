import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; 

// Função auxiliar de espera (Delay)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 🔔 FUNÇÃO DE NOTIFICAÇÃO (LOTERIA) ---
async function tentarEnviarNotificacao(produto, precoAntigo, precoNovo, categoria, termoBusca) {
    const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const ONE_SIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY; 

    if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_API_KEY) return;

    // Se for produto NOVO (precoAntigo = 0), manda para quem tem interesse no termo
    const isNovo = precoAntigo === 0;
    
    // Se for queda de preço
    const desconto = isNovo ? 0 : 1 - (precoNovo / precoAntigo); 

    // --- REGRAS DO JOGO ---
    let target = "ninguem";
    const sorteio = Math.random(); // 0.0 a 1.0

    if (isNovo) {
        // Produto Novo: 100% de chance de avisar quem segue a categoria/termo
        target = "interesse";
    } else {
        // Queda de Preço:
        // 1. Desconto pequeno (< 10%): Ignora
        if (desconto < 0.10) return;

        // 2. Desconto Monstro (> 40%): 30% de chance de mandar pra TODOS (Oferta Relâmpago)
        if (desconto > 0.40 && sorteio > 0.70) {
            target = "todos";
        } 
        // 3. Desconto Bom (> 15%): 80% de chance de mandar pra quem tem INTERESSE
        else if (desconto > 0.15 && sorteio > 0.20) {
            target = "interesse";
        }
    }

    if (target === "ninguem") return;

    // --- TEXTOS ---
    let titulo = "";
    let mensagem = "";
    let filters = [];

    if (target === "todos") {
        titulo = "🔥 OFERTA SURPRESA!";
        mensagem = `${produto.title} despencou ${Math.round(desconto * 100)}%! De R$${precoAntigo} por R$${precoNovo}.`;
        filters = [{ field: "tag", key: "interest", relation: "exists" }];
    } else {
        // Define a Tag: Ou é o termo exato buscado (ex: "iphone") ou a categoria (ex: "celulares")
        const tagAlvo = termoBusca ? termoBusca.split(' ')[0].toLowerCase() : categoria.toLowerCase();
        
        if (isNovo) {
            titulo = `Chegou: ${produto.title.substring(0, 20)}...`;
            mensagem = "Encontramos o produto que você queria! Toque para ver.";
        } else {
            titulo = `📉 Baixou: ${produto.title.substring(0, 20)}...`;
            mensagem = `Caiu ${Math.round(desconto * 100)}%! Aproveite antes que acabe.`;
        }
        
        filters = [{ field: "tag", key: "interest", relation: "=", value: tagAlvo }];
    }

    // --- DISPARO ---
    try {
        await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${ONE_SIGNAL_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONE_SIGNAL_APP_ID,
                headings: { en: titulo },
                contents: { en: mensagem },
                filters: target === "todos" ? undefined : filters,
                included_segments: target === "todos" ? ["Total Subscriptions"] : undefined,
                chrome_web_image: produto.image,
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/produto/${produto.id}`,
                collapse_id: String(produto.id) // Evita flood (substitui notificação antiga do mesmo produto)
            })
        });
        console.log(`🔔 Push Enviado (${target}): ${titulo}`);
    } catch (e) {
        console.error("Erro Push:", e);
    }
}
// -------------------------------------------


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

    // 2. Leitura do Body
    let body = {};
    try { body = await req.json(); } catch (e) {}

    // 📜 LISTA AUTOMÁTICA
    const listaAutomatica = [
      { termo: "iphone 13 128gb", categoria: "celulares", subcategoria: "iphone" },
      { termo: "iphone 15 pro max", categoria: "celulares", subcategoria: "iphone" },
      { termo: "samsung galaxy s24 ultra", categoria: "celulares", subcategoria: "android" },
      { termo: "xiaomi poco x6 pro", categoria: "celulares", subcategoria: "android" },
      { termo: "motorola edge 50", categoria: "celulares", subcategoria: "android" },
      { termo: "notebook gamer rtx 4050", categoria: "notebooks", subcategoria: "gamer" },
      { termo: "macbook air m1", categoria: "notebooks", subcategoria: "macbook" },
      { termo: "ps5 slim digital", categoria: "games", subcategoria: "console" },
      { termo: "nintendo switch oled", categoria: "games", subcategoria: "console" }
    ];

    // Variáveis
    let { termo, categoria, subcategoria, limit = 3 } = body;

    // Lógica do CronJob
    if (!termo) {
        const sorteado = listaAutomatica[Math.floor(Math.random() * listaAutomatica.length)];
        termo = sorteado.termo;
        categoria = sorteado.categoria;
        subcategoria = sorteado.subcategoria;
        limit = 3; 
        console.log(`⏰ CronJob: Sorteado "${termo}"`);
    } else {
        console.log(`🔎 Busca Manual: "${termo}"`);
    }

    if (!categoria) categoria = 'notebooks';

    // 3. IA: OTIMIZAÇÃO DE BUSCA
    let termoDeBusca = termo;
    try {
        const promptSearch = `
        Atue como um motor de busca inteligente do Mercado Livre.
        SUA MISSÃO: Refinar levemente o termo de busca para garantir que apareçam produtos e não acessórios.
        
        O usuário digitou: "${termo}"

        REGRAS RIGÍDAS:
        1. PRESERVAÇÃO: Mantenha a marca e modelo exatos que o usuário digitou.
        2. ESPECIFICIDADE: Se for eletrônico vago (ex: "iPhone"), adicione apenas a versão mais comum (ex: "iPhone 13"). Se for peça (ex: "SSD"), adicione capacidade (ex: "SSD 1TB").
        3. PROIBIDO SINÔNIMOS: NÃO adicione palavras repetidas.
        4. PROIBIDO LISTAR COMPATIBILIDADE: NÃO adicione lista de compatibilidade.
        5. MÁXIMO 5 PALAVRAS: O termo final deve ser curto e direto.
        6. SE O TERMO JÁ FOR BOM: Responda exatamente o termo original.

        Responda APENAS o termo novo, sem explicações.
        `;
        
        const resultSearch = await model.generateContent(promptSearch);
        const sugestao = resultSearch.response.text().trim();
        
        const termoOriginalBasico = termo.split(' ')[0].toLowerCase();
        if (sugestao.toLowerCase().includes(termoOriginalBasico) && sugestao.length < (termo.length * 2)) {
            termoDeBusca = sugestao;
            console.log(`🧠 IA refinou "${termo}" para -> "${termoDeBusca}"`);
        }
    } catch (e) {
        console.log("Falha na tradução da busca, usando termo original.");
    }

    // 4. Puppeteer (Simula Navegador)
    browser = await puppeteer.launch({
      headless: "new", 
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    const url = `https://lista.mercadolivre.com.br/${termoDeBusca.replace(/ /g, "-")}_NoIndex_True`;
    
    console.log(`🌐 Acessando ML...`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }); 
    
    try { await page.waitForSelector('.ui-search-layout__item, .poly-card, .ui-search-result__wrapper', { timeout: 10000 }); } catch(e) {}
    
    // Simula comportamento humano (Scroll)
    await page.evaluate(() => window.scrollBy(0, 700));
    
    const tempoEspera = Math.floor(Math.random() * (35000 - 25000 + 1) + 25000);
    console.log(`⏳ Aguardando ${(tempoEspera/1000).toFixed(1)} segundos...`);
    await sleep(tempoEspera); 

    // 5. Scraping
    const listaProdutos = await page.evaluate((limiteMax) => { 
      const seletores = ['li.ui-search-layout__item', 'div.ui-search-result__wrapper', 'div.poly-card', 'div.andes-card'];
      let elements = [];
      for (const sel of seletores) {
        const achados = document.querySelectorAll(sel);
        if (achados.length > 0) { elements = Array.from(achados); break; }
      }

      const itensValidos = [];
      const linksVistos = new Set();
      const titulosVistos = new Set();
      
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
        
        let tituloKey = titulo.toLowerCase().substring(0, 20);
        if (titulosVistos.has(tituloKey)) continue;
        titulosVistos.add(tituloKey);

        let imagem = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || "") : "";

        if (titulo && currentPrice > 0) {
            itensValidos.push({ titulo, price: currentPrice, originalPrice, image: imagem, link: linkLimpo });
        }
      }
      return itensValidos;
    }, limit);

    console.log(`🎯 Encontrados: ${listaProdutos.length} produtos.`);
    await browser.close();

    // 6. IA: REVIEW + SALVAMENTO + NOTIFICAÇÃO 🔔
    let salvos = 0;
    let atualizados = 0;

    for (const produto of listaProdutos) {
      
      // Busca produto no banco
      const { data: existente } = await supabase.from('products').select('*').eq('original_link', produto.link).single();

      // === CENÁRIO 1: PRODUTO NOVO ===
      if (!existente) {
          // Gera Review com IA apenas para produtos novos (economia de token)
          let dadosReview = {
             brand: "Genérico",
             shortDescription: `Oferta: ${produto.titulo}`,
             rating: 4.5,
             fullReview: { verdict: "Análise pendente", pros: [], cons: [], content: "..." }
          };

          try {
            const prompt = `
             Especialista Tech. Produto: "${produto.titulo}", Preço: R$ ${produto.price}.
             Categoria: "${categoria}", Subcategoria: "${subcategoria || 'Geral'}".
             Analise o produto. JSON RÍGIDO: { 
               "brand": "Marca",
               "shortDescription": "frase curta", 
               "rating": 4.5, 
               "fullReview": { "verdict": "...", "pros": [], "cons": [], "content": "..." } 
             }
            `;
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").replace(/\*\*/g, "").trim();
            dadosReview = { ...dadosReview, ...JSON.parse(text) };
          } catch (err) { }

          const precoDe = (produto.originalPrice > produto.price) ? produto.originalPrice : (produto.price * 1.25); 

          const { data: prodInserido, error } = await supabase.from('products').insert([{
            title: produto.titulo,
            image: produto.image,
            price: produto.price,
            original_price: precoDe,
            link: produto.link,           
            original_link: produto.link,  
            category: categoria,
            subcategory: subcategoria || null,
            brand: dadosReview.brand, 
            rating: Number(dadosReview.rating),
            short_description: dadosReview.shortDescription,
            full_review: dadosReview.fullReview,
            status: 'pending'
          }]).select().single(); // Retorna o dado inserido para pegarmos o ID

          if (!error) {
              salvos++;
              // 🔔 NOTIFICAÇÃO (Produto Novo)
              if (prodInserido) {
                  await tentarEnviarNotificacao({ ...produto, id: prodInserido.id }, 0, produto.price, categoria, termo);
              }
          }
      } 
      // === CENÁRIO 2: PRODUTO JÁ EXISTE (VERIFICAR PREÇO) ===
      else {
          // Se o preço do ML for diferente do Banco
          if (produto.price !== existente.price) {
               console.log(`🔄 Preço Mudou: ${produto.titulo} (R$${existente.price} -> R$${produto.price})`);
               
               // Atualiza no banco
               await supabase.from('products').update({
                   price: produto.price,
                   original_price: produto.originalPrice > 0 ? produto.originalPrice : existente.original_price,
                   updated_at: new Date()
               }).eq('id', existente.id);
               
               atualizados++;

               // 🔔 NOTIFICAÇÃO (Queda de Preço)
               // Só avisa se o preço baixou (Novo < Velho)
               if (produto.price < existente.price) {
                   await tentarEnviarNotificacao(
                       { ...produto, id: existente.id }, // Dados
                       existente.price,                  // Preço Velho
                       produto.price,                    // Preço Novo
                       categoria,
                       termo
                   );
               }
          }
      }
    }

    return NextResponse.json({ success: true, message: `${salvos} novos, ${atualizados} atualizados.` });

  } catch (error) {
    if (browser) await browser.close();
    console.error("🚨 Erro Fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}