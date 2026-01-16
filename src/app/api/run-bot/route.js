import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

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

    // 📜 LISTA AUTOMÁTICA (Para rodar no CronJob)
    const listaAutomatica = [
      { termo: "iphone 13 128gb", categoria: "celulares", subcategoria: "iphone" },
      { termo: "iphone 15 pro max", categoria: "celulares", subcategoria: "iphone" },
      { termo: "samsung galaxy s24 ultra", categoria: "celulares", subcategoria: "android" },
      { termo: "xiaomi poco x6 pro", categoria: "celulares", subcategoria: "android" },
      { termo: "motorola edge 50", categoria: "celulares", subcategoria: "android" },
      
      { termo: "notebook gamer rtx 4050", categoria: "notebooks", subcategoria: "gamer" },
      { termo: "macbook air m1", categoria: "notebooks", subcategoria: "macbook" },
      { termo: "notebook dell i5 ssd", categoria: "notebooks", subcategoria: "trabalho" },
      
      { termo: "pc gamer i5 rtx", categoria: "computadores", subcategoria: "pc-gamer" },
      { termo: "computador all in one", categoria: "computadores", subcategoria: "all-in-one" },
      
      { termo: "placa de video rtx 4060", categoria: "pecas", subcategoria: "placa-video" },
      { termo: "processador ryzen 5 5600", categoria: "pecas", subcategoria: "processador" },
      { termo: "ssd nvme 1tb", categoria: "pecas", subcategoria: "ssd-hd" },
      
      { termo: "ps5 slim digital", categoria: "games", subcategoria: "console" },
      { termo: "nintendo switch oled", categoria: "games", subcategoria: "console" },
      
      { termo: "monitor gamer 144hz ips", categoria: "acessorios", subcategoria: "monitor" },
      { termo: "headset gamer sem fio", categoria: "acessorios", subcategoria: "headset" }
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
        Você é um especialista em SEO para Mercado Livre.
        SUA MISSÃO: Refinar o termo de busca do usuário para encontrar o PRODUTO PRINCIPAL com mais precisão, evitando acessórios ou peças (a menos que o usuário peça).

        REGRAS OBRIGATÓRIAS:
        1. MANTENHA a Marca e o Modelo exatos (Ex: Se o usuário digitou "iPhone 13", NÃO mude para "iPhone 14").
        2. MANTENHA o Tipo de dispositivo (Ex: Se é "Notebook", NÃO mude para "PC Gamer").
        3. ADICIONE especificações técnicas comuns se faltarem (Ex: "128gb", "ssd", "novo", "original").
        4. EVITE termos ambíguos que tragam "capinhas" ou "películas" se o usuário busca o celular.

        EXEMPLOS DE OTIMIZAÇÃO:
        Input: "iphone 13" -> Output: iphone 13 128gb original vitrine
        Input: "notebook dell i5" -> Output: notebook dell core i5 ssd 8gb
        Input: "ps5" -> Output: playstation 5 console original
        Input: "placa de video 3060" -> Output: placa video rtx 3060 12gb
        Input: "mouse logitech" -> Output: mouse gamer logitech g series

        O usuário digitou: "${termo}"
        Responda APENAS o termo novo, sem aspas, sem explicações.
        `;
        
        const resultSearch = await model.generateContent(promptSearch);
        const sugestao = resultSearch.response.text().trim();
        
        // Verificação de segurança simples:
        // Se a IA alucinar e mudar a marca principal (ex: trocar Apple por Samsung), ignoramos.
        const termoOriginalBasico = termo.split(' ')[0].toLowerCase();
        if (sugestao.toLowerCase().includes(termoOriginalBasico)) {
            termoDeBusca = sugestao;
            console.log(`🧠 IA refinou "${termo}" para -> "${termoDeBusca}"`);
        } else {
            console.log(`⚠️ IA tentou mudar o produto ("${sugestao}"). Mantendo original.`);
        }

    } catch (e) {
        console.log("Falha na tradução da busca, usando termo original.");
    }

    // 4. Puppeteer (Simula Navegador)
    // Nota: Se rodar na Vercel Free, o Puppeteer pode ser pesado. No Render funciona melhor.
    browser = await puppeteer.launch({
      headless: "new", 
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    const url = `https://lista.mercadolivre.com.br/${termoDeBusca.replace(/ /g, "-")}_NoIndex_True`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    
    try { await page.waitForSelector('.ui-search-layout__item, .poly-card, .ui-search-result__wrapper', { timeout: 6000 }); } catch(e) {}
    
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 1500));

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
        
        // Limpa Link
        let linkOriginal = linkEl.href;
        if (linkOriginal.includes('click1') || linkOriginal.includes('mclics')) continue;
        let linkLimpo = linkOriginal.split('?')[0]; // Remove rastreio, deixa link puro

        if (linksVistos.has(linkLimpo)) continue;
        linksVistos.add(linkLimpo);

        // Preço
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
        
        // Anti-Duplicação de Título
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

    console.log(`🎯 Encontrados: ${listaProdutos.length} produtos únicos`);
    await browser.close();

    // 6. IA: REVIEW + SALVAMENTO (Aqui está a alteração!)
    let salvos = 0;
    for (const produto of listaProdutos) {
      
      let dadosReview = {
         brand: "Genérico",
         shortDescription: `Oferta: ${produto.titulo}`,
         rating: 4.5,
         fullReview: { verdict: "Análise pendente", pros: ["Bom Custo"], cons: [], content: "..." }
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
      } catch (err) { console.error("Erro IA Review:", err.message); }

      const precoDe = (produto.originalPrice > produto.price) ? produto.originalPrice : (produto.price * 1.25); 

      // Verifica se já existe pelo link original
      const { data: existente } = await supabase.from('products').select('id').eq('original_link', produto.link).single();

      if (!existente) {
          const { error } = await supabase.from('products').insert([{
            title: produto.titulo,
            image: produto.image,
            price: produto.price,
            original_price: precoDe,
            
            // 👇 AQUI A MÁGICA: SALVA NAS DUAS COLUNAS 👇
            link: produto.link,           // Este você muda depois para afiliado
            original_link: produto.link,  // Este fica intacto para o robô checar preço
            
            category: categoria,
            subcategory: subcategoria || null,
            brand: dadosReview.brand, 
            rating: Number(dadosReview.rating),
            short_description: dadosReview.shortDescription,
            full_review: dadosReview.fullReview,
            status: 'pending'
          }]);

          if (!error) salvos++;
      }
    }

    return NextResponse.json({ success: true, message: `${salvos} processados. (Busca usada: ${termoDeBusca})` });

  } catch (error) {
    if (browser) await browser.close();
    console.error("🚨 Erro Fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}