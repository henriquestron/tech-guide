require('dotenv').config();
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// --- ⚙️ CAPTURA DE ARGUMENTOS DA TELA DE ADMIN ---
// process.argv[2] é o primeiro argumento enviado (Termo)
// process.argv[3] é o segundo argumento enviado (Categoria)
const TERMO_DE_BUSCA = process.argv[2] || "placa de video rtx"; 
const CATEGORIA_ESCOLHIDA = process.argv[3] || "pecas"; 
const QUANTIDADE_PARA_PEGAR = 5;

// Configuração do Supabase (lendo o .env da pasta automacao)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function rodarRobo() {
  console.log(`\n🤖 ROBO INICIADO`);
  console.log(`🔎 Buscando por: "${TERMO_DE_BUSCA}"`);
  console.log(`📂 Categoria destino: "${CATEGORIA_ESCOLHIDA}"\n`);
  
  const browser = await puppeteer.launch({ 
    headless: false, // Deixe false para você ver o robô trabalhando
    defaultViewport: null,
    args: ['--start-maximized'] 
  }); 
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    const url = `https://lista.mercadolivre.com.br/${TERMO_DE_BUSCA.replace(/ /g, '-')}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await delay(3000); 

    // --- EXTRAÇÃO DOS PRODUTOS ---
    const listaProdutos = await page.evaluate((limite) => {
      const cards = Array.from(document.querySelectorAll('li.ui-search-layout__item, .ui-search-result, .poly-card'));
      const itensValidos = [];
      const linksVistos = new Set(); 

      for (const item of cards) {
        if (itensValidos.length >= limite) break;

        const linkEl = item.querySelector('a');
        if (!linkEl) continue;
        
        const linkOriginal = linkEl.href;

        // 🛡️ Bloqueio de Anúncios Patrocinados
        if (linkOriginal.includes('click1') || linkOriginal.includes('mclics') || linkOriginal.includes('ad_id')) {
            continue; 
        }

        let linkLimpo = linkOriginal.split('?')[0].split('#')[0];
        if (linksVistos.has(linkLimpo)) continue;
        linksVistos.add(linkLimpo);

        // Título
        let titulo = null;
        const elGrid = item.querySelector('.poly-component__title a') || item.querySelector('.poly-component__title');
        const elLista = item.querySelector('.ui-search-item__title');
        if (elGrid) titulo = elGrid.innerText;
        else if (elLista) titulo = elLista.innerText;

        // Preços (Lógica De/Por)
        let price = 0;
        let originalPrice = 0;

        const elementoRiscado = item.querySelector('.andes-money-amount--previous .andes-money-amount__fraction');
        if (elementoRiscado) {
          originalPrice = parseFloat(elementoRiscado.innerText.replace(/\./g, '').replace(',', '.'));
        }

        const todosPrecos = Array.from(item.querySelectorAll('.andes-money-amount__fraction'));
        const precosValidos = todosPrecos.filter(el => !el.closest('.andes-money-amount--previous'));

        if (precosValidos.length > 0) {
           price = parseFloat(precosValidos[0].innerText.replace(/\./g, '').replace(',', '.'));
        }

        if (originalPrice === 0) originalPrice = price;

        // Imagem
        const imgEl = item.querySelector('img');
        const imagem = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src')) : "";

        itensValidos.push({
          titulo: titulo ? titulo.trim() : "Sem Título",
          price,
          originalPrice, 
          image: imagem,
          link: linkLimpo
        });
      }
      return itensValidos;
    }, QUANTIDADE_PARA_PEGAR);

    console.log(`🎯 Encontrei ${listaProdutos.length} produtos orgânicos.`);

    // --- SALVANDO NO BANCO ---
    for (const [index, produto] of listaProdutos.entries()) {
      console.log(`\n[${index + 1}] Salvando: ${produto.titulo}`);
      
      const iaReviewSimulada = {
          rating: 4.8,
          short_description: `Oferta de ${produto.titulo} selecionada pela nossa curadoria.`,
          full_review: {
              content: `O ${produto.titulo} apresenta um excelente desempenho. Atualmente saindo por R$ ${produto.price}, é uma das melhores escolhas na categoria ${CATEGORIA_ESCOLHIDA}.`,
              verdict: "Compra recomendada.",
              pros: ["Custo-benefício", "Qualidade comprovada"],
              cons: ["Estoque limitado"],
              specs: { "Categoria": CATEGORIA_ESCOLHIDA }
          }
      };

      const { error } = await supabase.from('products').insert([{
        title: produto.titulo,
        image: produto.image,
        price: produto.price,
        original_price: produto.originalPrice, 
        link: produto.link, 
        category: CATEGORIA_ESCOLHIDA, // 👈 Agora usa a categoria vinda do Admin
        brand: "Tech",
        rating: iaReviewSimulada.rating,
        short_description: iaReviewSimulada.short_description,
        full_review: iaReviewSimulada.full_review 
      }]);

      if (error) {
        console.error("❌ Erro Supabase:", error.message);
      } else {
        console.log(`✅ Salvo em "${CATEGORIA_ESCOLHIDA}" com sucesso!`);
        
        // Salva no arquivo de texto para você gerar os links de afiliado depois
        const linha = `PRODUTO: ${produto.titulo}\nLINK: ${produto.link}\n-------------------\n`;
        fs.appendFileSync('links_para_converter.txt', linha);
      }

      await delay(1000); 
    }

    console.log("\n🏁 Robô finalizou todas as tarefas!");
    await browser.close();

  } catch (erro) {
    console.error("🚨 Erro Geral no Robô:", erro.message);
    if (browser) await browser.close();
  }
}

rodarRobo();