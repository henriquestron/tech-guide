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

    // 1. Tenta acessar o link
    let html;
    try {
        const response = await axios.get(link, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
            timeout: 10000 
        });
        html = response.data;
    } catch (err) {
        if (err.response && err.response.status === 404) {
            await supabase.from('products').delete().eq('id', id);
            return NextResponse.json({ status: 'deleted', reason: '404 - Página não existe' });
        }
        return NextResponse.json({ status: 'error', reason: 'Erro de conexão' });
    }

    const $ = cheerio.load(html);

    // 2. Verifica se está PAUSADO
    const avisoPausado = $('.ui-pdp-promotions-pill-label--paused, .ui-pdp-message--paused, .ui-pdp-container__row--start-stopped').length > 0;
    const titulo = $('h1').text();
    
    if (avisoPausado || (!titulo && html.includes("não existe"))) {
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: 'Anúncio Pausado/Finalizado' });
    }

    // 3. LÓGICA INTELIGENTE DE PREÇO (PROMOÇÃO VS NORMAL) 🧠
    let precoReal = 0;
    
    // Tentativa A: Meta Tag (O jeito mais seguro, pois o ML declara o preço oficial pro Google aqui)
    const metaPrice = $('meta[itemprop="price"]').attr('content');
    if (metaPrice) {
        precoReal = parseFloat(metaPrice);
    } else {
        // Tentativa B: Scraping Visual (Ignorando o preço riscado)
        // Pegamos todos os preços, mas filtramos fora os que estão dentro de container "previous" (riscado)
        $('.andes-money-amount__fraction').each((i, el) => {
            const container = $(el).closest('.andes-money-amount');
            
            // Se NÃO tem a classe "previous" (riscado), então é o preço atual!
            if (!container.hasClass('andes-money-amount--previous')) {
                const texto = $(el).text();
                precoReal = parseFloat(texto.replace(/\./g, "").replace(",", "."));
                return false; // Para o loop assim que achar o primeiro preço válido
            }
        });
    }

    // Se achou um preço válido
    if (precoReal > 0) {
        // Se o preço mudou
        if (precoReal !== price) {
            
            // Regra de Segurança: Se subiu MUITO (50%), avisa mas não atualiza sozinho (vai pra pendente)
            // Ex: Era 3200 (promoção), acabou a promoção e foi pra 5000. Você precisa saber.
            if (precoReal > price * 1.5) {
                await supabase.from('products').update({ price: precoReal, status: 'pending' }).eq('id', id);
                return NextResponse.json({ status: 'changed_pending', old: price, new: precoReal });
            } else {
                // Se baixou (promoção nova) ou subiu pouco, atualiza direto
                // Também tentamos pegar o preço original (riscado) para atualizar o "De: X Por: Y"
                let originalPrice = precoReal * 1.2; // Chute padrão

                // Tenta achar o preço riscado real na tela
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

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error("Erro Auditor:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}