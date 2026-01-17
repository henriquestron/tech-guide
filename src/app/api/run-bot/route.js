import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from 'cheerio'; // npm install cheerio

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * SCRAPERAPI - A SOLUÇÃO DEFINITIVA
 * 
 * 1. Cadastre em: https://www.scraperapi.com (GRÁTIS - 5.000 requisições/mês)
 * 2. Pegue sua API Key
 * 3. Adicione no .env: SCRAPER_API_KEY=sua_chave_aqui
 * 
 * VANTAGENS:
 * ✅ Passa por qualquer bloqueio
 * ✅ IP rotativo automático
 * ✅ Renderiza JavaScript
 * ✅ Headers automáticos
 * ✅ 5.000 requisições grátis/mês
 */

async function buscarMLComScraperAPI(termo, limit = 3) {
  const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
  
  if (!SCRAPER_API_KEY) {
    throw new Error('SCRAPER_API_KEY não configurada! Pegue em https://www.scraperapi.com');
  }

  const urlML = `https://lista.mercadolivre.com.br/${termo.replace(/ /g, "-")}`;
  
  // ScraperAPI faz toda a mágica
  const apiUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(urlML)}&render=true&country_code=br`;
  
  console.log(`🌐 Buscando via ScraperAPI: ${termo}`);
  
  try {
    const response = await fetch(apiUrl, { 
      method: 'GET',
      timeout: 60000 
    });
    
    if (!response.ok) {
      throw new Error(`ScraperAPI retornou ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const produtos = [];
    const linksVistos = new Set();
    
    // Extrai produtos do HTML
    $('.ui-search-layout__item').each((index, element) => {
      if (produtos.length >= limit) return false;
      
      const $item = $(element);
      
      // Link
      const linkEl = $item.find('a').first();
      const linkCompleto = linkEl.attr('href');
      if (!linkCompleto) return;
      
      const link = linkCompleto.split('?')[0]; // Remove tracking
      if (linksVistos.has(link)) return;
      linksVistos.add(link);
      
      // Título
      const titulo = $item.find('.ui-search-item__title').text().trim();
      if (!titulo) return;
      
      // Preço atual
      const priceElements = $item.find('.andes-money-amount__fraction');
      let currentPrice = 0;
      
      priceElements.each((i, el) => {
        const $el = $(el);
        // Pega o preço que NÃO está no container "previous"
        if (!$el.closest('.andes-money-amount--previous').length) {
          const priceText = $el.text().trim();
          currentPrice = parseFloat(priceText.replace(/\./g, '').replace(',', '.'));
          return false; // break
        }
      });
      
      if (currentPrice === 0) return;
      
      // Preço original (se houver)
      let originalPrice = 0;
      const previousPrice = $item.find('.andes-money-amount--previous .andes-money-amount__fraction').text().trim();
      if (previousPrice) {
        originalPrice = parseFloat(previousPrice.replace(/\./g, '').replace(',', '.'));
      }
      
      // Imagem
      const imgEl = $item.find('img').first();
      let image = imgEl.attr('data-src') || imgEl.attr('src') || '';
      
      // Melhora qualidade da imagem
      if (image.includes('I.jpg')) {
        image = image.replace('I.jpg', 'O.jpg'); // Tamanho maior
      }
      
      produtos.push({
        titulo,
        price: currentPrice,
        originalPrice: originalPrice > currentPrice ? originalPrice : currentPrice * 1.25,
        image,
        link
      });
    });
    
    console.log(`✅ ScraperAPI retornou ${produtos.length} produtos`);
    return produtos;
    
  } catch (error) {
    console.error('❌ Erro ScraperAPI:', error.message);
    throw error;
  }
}

export async function POST(req) {
  try {
    // Verificações
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini Key missing" }, { status: 500 });
    }
    if (!process.env.SCRAPER_API_KEY) {
      return NextResponse.json({ 
        error: "SCRAPER_API_KEY missing! Cadastre em https://www.scraperapi.com (grátis)" 
      }, { status: 500 });
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    // Leitura do body
    let body = {};
    try { body = await req.json(); } catch (e) {}
    
    const listaAutomatica = [
      { termo: "iphone 13 128gb", categoria: "celulares", subcategoria: "iphone" },
      { termo: "iphone 15 pro max", categoria: "celulares", subcategoria: "iphone" },
      { termo: "samsung galaxy s24 ultra", categoria: "celulares", subcategoria: "android" },
      { termo: "notebook gamer rtx 4050", categoria: "notebooks", subcategoria: "gamer" },
      { termo: "macbook air m1", categoria: "notebooks", subcategoria: "macbook" },
      { termo: "ps5 slim", categoria: "games", subcategoria: "console" },
      { termo: "monitor gamer 144hz", categoria: "acessorios", subcategoria: "monitor" },
    ];
    
    let { termo, categoria, subcategoria, limit = 3 } = body;
    
    if (!termo) {
      const sorteado = listaAutomatica[Math.floor(Math.random() * listaAutomatica.length)];
      termo = sorteado.termo;
      categoria = sorteado.categoria;
      subcategoria = sorteado.subcategoria;
      console.log(`⏰ CronJob sorteou: "${termo}"`);
    }
    
    if (!categoria) categoria = 'eletronicos';
    
    // IA: Otimização do termo
    let termoDeBusca = termo;
    try {
      const promptSearch = `Otimize este termo de busca para Mercado Livre: "${termo}". 
      Mantenha a marca/modelo. Adicione especificações relevantes. 
      Responda APENAS o termo otimizado.`;
      
      const result = await model.generateContent(promptSearch);
      const sugestao = result.response.text().trim();
      
      if (sugestao.toLowerCase().includes(termo.split(' ')[0].toLowerCase())) {
        termoDeBusca = sugestao;
        console.log(`🧠 IA otimizou: "${termoDeBusca}"`);
      }
    } catch (e) {
      console.log('⚠️ Usando termo original');
    }
    
    // 🔥 BUSCA COM SCRAPERAPI (BYPASSA O BLOQUEIO)
    const listaProdutos = await buscarMLComScraperAPI(termoDeBusca, limit);
    
    if (listaProdutos.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Nenhum produto encontrado' 
      });
    }
    
    // IA: Review + Salvamento
    let salvos = 0;
    
    for (const produto of listaProdutos) {
      let dadosReview = {
        brand: "Genérico",
        shortDescription: `Oferta: ${produto.titulo}`,
        rating: 4.5,
        fullReview: { 
          verdict: "Análise pendente", 
          pros: ["Bom custo-benefício"], 
          cons: [], 
          content: "..." 
        }
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
      } catch (err) { 
        console.error("Erro IA Review:", err.message); 
      }
      
      // Verifica duplicata
      const { data: existente } = await supabase
        .from('products')
        .select('id')
        .eq('original_link', produto.link)
        .single();
      
      if (!existente) {
        const { error } = await supabase.from('products').insert([{
          title: produto.titulo,
          image: produto.image,
          price: produto.price,
          original_price: produto.originalPrice,
          link: produto.link,
          original_link: produto.link,
          category: categoria,
          subcategory: subcategoria || null,
          brand: dadosReview.brand,
          rating: Number(dadosReview.rating),
          short_description: dadosReview.shortDescription,
          full_review: dadosReview.fullReview,
          status: 'pending'
        }]);
        
        if (!error) {
          salvos++;
          console.log(`✅ Salvo: ${produto.titulo.substring(0, 50)}...`);
        } else {
          console.error('❌ Erro ao salvar:', error.message);
        }
      } else {
        console.log(`⏭️ Já existe: ${produto.titulo.substring(0, 50)}...`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${salvos} novos produtos salvos de ${listaProdutos.length} encontrados`,
      termo: termoDeBusca,
      categoria,
      produtos: listaProdutos.length
    });
    
  } catch (error) {
    console.error('🚨 Erro Fatal:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}