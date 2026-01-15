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
    // Agora recebemos também o original_link
    const { id, link, original_link, price } = body;

    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    // 🧠 LÓGICA DE OURO:
    // Usa o original_link se existir (seguro). Se não, usa o link de afiliado (arriscado).
    const urlParaAnalise = original_link && original_link.length > 10 ? original_link : link;

    if (!urlParaAnalise) return NextResponse.json({ error: "Nenhum link para analisar" }, { status: 400 });

    console.log(`🔎 Analisando ID ${id} via: ${urlParaAnalise === original_link ? "Link Original (Seguro)" : "Link Afiliado (Risco)"}`);

    // 1. Tenta acessar o link
    let html;
    try {
        const response = await axios.get(urlParaAnalise, {
            headers: { 
                // User-Agent de navegador para evitar bloqueio 403
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
            },
            timeout: 10000, 
            validateStatus: status => status < 500 
        });
        html = response.data;

    } catch (err) {
        console.error(`Erro conexão ID ${id}:`, err.message);
        // Não deleta, apenas avisa erro
        return NextResponse.json({ status: 'error', reason: 'Erro de conexão/Timeout' });
    }

    const $ = cheerio.load(html);

    // 2. Checagem de Segurança (Captcha/Bloqueio)
    const isCaptcha = $('body').text().includes("human") || $('body').text().includes("verificar se você é humano");
    if (isCaptcha) {
        return NextResponse.json({ status: 'skipped', reason: 'Bloqueio de IP (Captcha) - Mantido' });
    }

    // 3. Verifica se o produto MORREU de verdade
    const avisoPausado = $('.ui-pdp-promotions-pill-label--paused, .ui-pdp-message--paused, .ui-pdp-container__row--start-stopped').length > 0;
    const textoFinalizado = html.includes("Anúncio pausado") || html.includes("Este anúncio não existe mais");
    const titulo = $('h1').text().trim();

    // Só deleta se tiver certeza absoluta que o anúncio parou
    if (avisoPausado || (textoFinalizado && !titulo)) {
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: 'Anúncio Pausado/Finalizado' });
    }

    // Se a página carregou em branco ou estranha, aborta sem deletar
    if (!titulo) {
        return NextResponse.json({ status: 'skipped', reason: 'Não foi possível ler o título - Mantido' });
    }

    // 4. Extração de Preço
    let precoReal = 0;
    
    // Tenta Meta Tag (Melhor fonte)
    const metaPrice = $('meta[itemprop="price"]').attr('content');
    if (metaPrice) {
        precoReal = parseFloat(metaPrice);
    } else {
        // Tenta Visualmente
        $('.andes-money-amount__fraction').each((i, el) => {
            const container = $(el).closest('.andes-money-amount');
            if (!container.hasClass('andes-money-amount--previous')) { // Ignora preço riscado
                const texto = $(el).text();
                precoReal = parseFloat(texto.replace(/\./g, "").replace(",", "."));
                return false; 
            }
        });
    }

    // 5. Atualização
    if (precoReal > 0) {
        // Verifica mudança de preço
        if (precoReal !== price) {
            
            // Segurança: Se o preço subiu absurdamente (ex: erro de leitura ou fim de promo maluca)
            // Marcamos como pendente para você revisar
            if (precoReal > price * 1.5) {
                await supabase.from('products').update({ price: precoReal, status: 'pending' }).eq('id', id);
                return NextResponse.json({ status: 'changed_pending', old: price, new: precoReal });
            } else {
                // Atualização normal
                let originalPrice = precoReal * 1.25; 

                // Tenta achar o preço "De" (riscado) para atualizar vitrine
                const precoRiscadoEl = $('.andes-money-amount--previous .andes-money-amount__fraction').first();
                if (precoRiscadoEl.length > 0) {
                    originalPrice = parseFloat(precoRiscadoEl.text().replace(/\./g, "").replace(",", "."));
                }

                await supabase.from('products').update({ 
                    price: precoReal, 
                    original_price: originalPrice,
                    updated_at: new Date() // Bom ter data de update
                }).eq('id', id);

                return NextResponse.json({ status: 'updated', old: price, new: precoReal });
            }
        }
    }

    return NextResponse.json({ status: 'ok', message: 'Preço atualizado e verificado' });

  } catch (error) {
    console.error("Erro Fatal Auditor:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}