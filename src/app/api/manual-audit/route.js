import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import axios from "axios";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const body = await req.json();
    const { id, link, price } = body;

    if (!id || !link) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    // 1. Tenta acessar o link (Com suporte a redirect de Afiliado)
    let html;
    let finalUrl; 

    try {
        const response = await axios.get(link, {
            headers: { 
                // User-Agent de navegador real para passar pelo rastreador de afiliado
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
            },
            timeout: 15000, // Aumentei o tempo pois link de afiliado demora mais
            maxRedirects: 5, // Garante que segue os redirects do afiliado
            validateStatus: status => status < 500 // Não quebra em 404 direto, tratamos abaixo
        });
        
        html = response.data;
        finalUrl = response.request?.res?.responseUrl || link; // Tenta pegar a URL final onde aterrissou

    } catch (err) {
        console.error("Erro de conexão:", err.message);
        // ⚠️ SEGURANÇA: Se deu erro de conexão, NÃO DELETA. Retorna erro e mantém o produto.
        return NextResponse.json({ status: 'error', reason: 'Erro de conexão ou timeout' });
    }

    const $ = cheerio.load(html);

    // 2. Verifica se a página carregou errado (Captcha ou Bloqueio)
    // Se cair num captcha, o título geralmente não existe, mas não queremos deletar o produto!
    const isCaptcha = $('body').text().includes("human") || $('body').text().includes("verificar se você é humano");
    if (isCaptcha) {
        return NextResponse.json({ status: 'skipped', reason: 'Bloqueio/Captcha detectado - Produto mantido' });
    }

    // 3. Verifica se está REALMENTE PAUSADO/FINALIZADO
    // Procuramos classes específicas que indicam morte do anúncio
    const avisoPausado = $('.ui-pdp-promotions-pill-label--paused, .ui-pdp-message--paused, .ui-pdp-container__row--start-stopped').length > 0;
    const textoFinalizado = html.includes("Anúncio pausado") || html.includes("Este anúncio não existe mais");
    
    // Tenta pegar o título
    const titulo = $('h1').text().trim();

    // 🚨 MUDANÇA CRÍTICA AQUI:
    // Antes você deletava se (!titulo). Agora só deletamos se tiver CERTEZA que morreu.
    // Se não tiver título mas também não tiver aviso de pausado, pode ser só erro do robô no link de afiliado.
    if (avisoPausado || (textoFinalizado && !titulo)) {
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: 'Anúncio Pausado/Finalizado com certeza' });
    }

    // Se não achou título e nem preço, mas não está pausado, aborta (não mexe no banco)
    if (!titulo) {
        return NextResponse.json({ status: 'skipped', reason: 'Página não carregou corretamente (Link Afiliado?) - Produto mantido' });
    }

    // 4. LÓGICA DE PREÇO (MANTIDA IGUAL)
    let precoReal = 0;
    
    const metaPrice = $('meta[itemprop="price"]').attr('content');
    if (metaPrice) {
        precoReal = parseFloat(metaPrice);
    } else {
        $('.andes-money-amount__fraction').each((i, el) => {
            const container = $(el).closest('.andes-money-amount');
            if (!container.hasClass('andes-money-amount--previous')) {
                const texto = $(el).text();
                precoReal = parseFloat(texto.replace(/\./g, "").replace(",", "."));
                return false; 
            }
        });
    }

    // Se achou um preço válido
    if (precoReal > 0) {
        if (precoReal !== price) {
            
            // Regra de variação brusca (segurança)
            if (precoReal > price * 1.5) {
                await supabase.from('products').update({ price: precoReal, status: 'pending' }).eq('id', id);
                return NextResponse.json({ status: 'changed_pending', old: price, new: precoReal });
            } else {
                let originalPrice = precoReal * 1.25; 

                const precoRiscadoEl = $('.andes-money-amount--previous .andes-money-amount__fraction').first();
                if (precoRiscadoEl.length > 0) {
                    originalPrice = parseFloat(precoRiscadoEl.text().replace(/\./g, "").replace(",", "."));
                }

                await supabase.from('products').update({ 
                    price: precoReal, 
                    original_price: originalPrice 
                }).eq('id', id);

                return NextResponse.json({ status: 'updated', old: price, new: precoReal });
            }
        }
    }

    return NextResponse.json({ status: 'ok', message: 'Preço inalterado' });

  } catch (error) {
    console.error("Erro Auditor:", error);
    // Em caso de erro fatal no código, não deleta nada
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}