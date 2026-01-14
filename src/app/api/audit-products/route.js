import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Limite de tempo

export async function POST(req) { 
  let browser = null;
  let logs = [];

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // 1. Pega 5 produtos aleatórios que JÁ ESTÃO no site (status 'approved')
    // Pegamos poucos por vez para não travar o servidor
    const { data: produtos } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'approved')
        .limit(5); 

    if (!produtos || produtos.length === 0) {
        return NextResponse.json({ message: "Nenhum produto aprovado para auditar." });
    }

    // 2. Inicia o Navegador
    browser = await puppeteer.launch({
      headless: "new", 
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    for (const produto of produtos) {
        try {
            logs.push(`🔍 Checando: ${produto.title.substring(0, 20)}...`);
            
            // Vai para o link
            const response = await page.goto(produto.link, { waitUntil: 'domcontentloaded', timeout: 20000 });
            
            // A. Verifica se a página existe (404)
            if (response.status() === 404) {
                await supabase.from('products').delete().eq('id', produto.id);
                logs.push(`❌ DELETADO (404 - Página sumiu)`);
                continue;
            }

            // B. Verifica se o Mercado Livre diz que está PAUSADO ou FINALIZADO
            const isPaused = await page.evaluate(() => {
                // Seletores comuns de anúncio pausado no ML
                const pausadoTag = document.querySelector('.ui-pdp-promotions-pill-label--paused');
                const finalizadoTag = document.querySelector('.ui-pdp-message--paused'); 
                const title = document.querySelector('h1');
                
                // Se tem aviso de pausado OU se não achou o título do produto (redirecionou pra busca)
                return !!pausadoTag || !!finalizadoTag || !title;
            });

            if (isPaused) {
                await supabase.from('products').delete().eq('id', produto.id);
                logs.push(`❌ DELETADO (Anúncio Pausado/Finalizado)`);
                continue;
            }

            // C. Atualiza o Preço (Se mudou)
            const precoAtualSite = await page.evaluate(() => {
                const priceEl = document.querySelector('.andes-money-amount__fraction');
                if (!priceEl) return null;
                return parseFloat(priceEl.innerText.replace(/\./g, '').replace(',', '.'));
            });

            if (precoAtualSite && precoAtualSite !== produto.price) {
                // Se o preço subiu muito (ex: dobrou), talvez seja melhor pausar pra vc ver
                if (precoAtualSite > produto.price * 1.5) {
                    await supabase.from('products').update({ status: 'pending', price: precoAtualSite }).eq('id', produto.id);
                    logs.push(`⚠️ PREÇO SUBIU MUITO: De R$${produto.price} para R$${precoAtualSite} (Movido para Pendentes)`);
                } else {
                    // Atualização normal
                    await supabase.from('products').update({ price: precoAtualSite }).eq('id', produto.id);
                    logs.push(`💰 Preço Atualizado: De R$${produto.price} para R$${precoAtualSite}`);
                }
            } else {
                logs.push(`✅ Tudo ok (Preço igual)`);
            }

        } catch (err) {
            logs.push(`⚠️ Erro ao acessar link: ${err.message}`);
        }
        
        // Pausa leve entre produtos
        await new Promise(r => setTimeout(r, 1000));
    }

    await browser.close();
    return NextResponse.json({ success: true, report: logs });

  } catch (error) {
    if (browser) await browser.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}