// ARQUIVO: scripts/robo.js

// Carrega variáveis de ambiente se estiver rodando local (para testes)
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const puppeteer = require('puppeteer');

// Função principal que o GitHub vai chamar
async function run() {
  console.log("🚀 Iniciando Robô TechGuide no GitHub Runner...");

  // 1. Verificações
  if (!process.env.GEMINI_API_KEY) { console.error("❌ Erro: Gemini Key missing"); process.exit(1); }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) { console.error("❌ Erro: Supabase URL missing"); process.exit(1); }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  // 2. LISTA AUTOMÁTICA
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

  // Sorteio
  const sorteado = listaAutomatica[Math.floor(Math.random() * listaAutomatica.length)];
  const { termo, categoria, subcategoria } = sorteado;
  
  console.log(`⏰ Sorteado: "${termo}" | Categoria: ${categoria}`);

  // 3. IA: OTIMIZAÇÃO DE BUSCA
  let termoDeBusca = termo;
  try {
      const promptSearch = `
      Atue como um especialista em busca do Mercado Livre.
      O usuário digitou: "${termo}".
      Converta isso em um termo de busca OTIMIZADO e TÉCNICO.
      Exemplo: "pc que roda tudo" -> "pc gamer completo i7 rtx"
      Responda APENAS o termo novo, sem aspas.
      `;
      const resultSearch = await model.generateContent(promptSearch);
      termoDeBusca = resultSearch.response.text().trim();
      console.log(`🧠 IA traduziu "${termo}" para -> "${termoDeBusca}"`);
  } catch (e) {
      console.log("Falha na tradução da busca, usando termo original.");
  }

  // 4. Puppeteer (Rodando no Linux do GitHub)
  const browser = await puppeteer.launch({
    headless: "new", 
    // Essas flags ajudam a rodar no ambiente CI/CD do GitHub
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
  });

  const page = await browser.newPage();
  // User Agent real para evitar bloqueios
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  const url = `https://lista.mercadolivre.com.br/${termoDeBusca.replace(/ /g, "-")}_NoIndex_True`;
  console.log(`🌍 Navegando para: ${url}`);
  
  // Timeout generoso de 60s (O GitHub aguenta)
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  } catch (err) {
    console.log("Navegação demorou, mas vamos tentar ler o conteúdo...");
  }
  
  // Scroll para carregar lazy loading
  try {
    await page.evaluate(() => window.scrollBy(0, 800));
    // Pausa de 2 segundos (substituindo o setTimeout com Promise)
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {}

  // 5. Scraping
  const limit = 5; // Vamos pegar 5 produtos por vez
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
      let imagem = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || "") : "";

      if (titulo && currentPrice > 0) {
          itensValidos.push({ titulo, price: currentPrice, originalPrice, image: imagem, link: linkLimpo });
      }
    }
    return itensValidos;
  }, limit);

  console.log(`🎯 Encontrados: ${listaProdutos.length} produtos.`);
  await browser.close();

  // 6. IA Review e Salvar
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
        Analise o produto.
        JSON RÍGIDO: { 
          "brand": "Marca (ex: Samsung)",
          "shortDescription": "frase curta vendedora", 
          "rating": 4.5, 
          "fullReview": { 
              "verdict": "Veredito final curto", 
              "pros": ["Ponto positivo 1", "Ponto positivo 2", "Ponto positivo 3"], 
              "cons": ["Ponto negativo"], 
              "content": "Resumo detalhado em 1 parágrafo explicando se vale a pena." 
          } 
        }
      `;
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").replace(/\*\*/g, "").trim();
      dadosReview = { ...dadosReview, ...JSON.parse(text) };
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
      brand: dadosReview.brand, 
      rating: Number(dadosReview.rating),
      short_description: dadosReview.shortDescription,
      full_review: dadosReview.fullReview,
      status: 'pending'
    }]);

    if (!error) console.log(`✅ Salvo: ${produto.titulo.substring(0, 30)}...`);
    else console.log(`❌ Erro ao salvar: ${error.message}`);
  }

  console.log("🏁 Processo Finalizado!");
  process.exit(0);
}

// Executa a função
run();