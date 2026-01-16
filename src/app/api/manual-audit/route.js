import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import axios from "axios";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { id } = body; 

    console.log(`🚀 Audit iniciado para ID: ${id}`);

    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    // 2. BUSCA O LINK ATUAL NO BANCO
    const { data: produto, error: dbError } = await supabase
        .from('products')
        .select('original_link, price')
        .eq('id', id)
        .single();

    if (dbError || !produto) {
        console.log(`❌ Erro ao buscar produto ${id} no banco.`);
        return NextResponse.json({ error: "Produto não encontrado no banco" }, { status: 404 });
    }

    const original_link = produto.original_link;
    const currentPrice = produto.price;

    // 3. Validação do Link
    if (!original_link || original_link.length < 10 || !original_link.includes("mercadolivre")) {
        console.log(`⏭️ ID ${id} Pulado: 'original_link' inválido.`);
        return NextResponse.json({ status: 'skipped', reason: 'Link Original inválido no Banco' });
    }

    console.log(`🔗 Link Fresquinho do Banco: ${original_link}`);

    // 4. Download do HTML
    let html;
    let statusCode; // Vamos guardar o status code

    try {
        const response = await axios.get(original_link, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Cache-Control": "no-cache"
            },
            timeout: 15000,
            validateStatus: status => status < 500 // Aceita 404 sem cair no catch
        });
        html = response.data;
        statusCode = response.status;
    } catch (err) {
        console.error(`❌ Erro Conexão: ${err.message}`);
        return NextResponse.json({ status: 'error', reason: 'Falha ao baixar página' });
    }

    // 🚨 REGRA 1: Se o servidor respondeu 404 (Página não encontrada), DELETA.
    if (statusCode === 404) {
        console.log(`💀 Status 404 detectado. Produto não existe mais. Deletando...`);
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: 'Erro 404 - Página não existe' });
    }

    const $ = cheerio.load(html);
    const titulo = $('h1').text().trim();
    const bodyText = $('body').text(); // Pega todo o texto da página

    // 🚨 REGRA 2: Procura por FRASES DE MORTE do anúncio (muito mais seguro que classe CSS)
    const frasesDeMorte = [
        "Anúncio pausado",
        "Este anúncio não existe mais",
        "Finalizamos este anúncio",
        "O vendedor finalizou este anúncio",
        "Página não encontrada" // Caso o ML retorne 200 mas mostre página de erro
    ];

    const isDeadText = frasesDeMorte.some(frase => bodyText.includes(frase));
    const isDeadClass = $('.ui-pdp-promotions-pill-label--paused, .ui-pdp-message--paused, .ui-pdp-container__row--start-stopped').length > 0;

    if (isDeadText || isDeadClass) {
        console.log(`💀 Anúncio FINALIZADO/PAUSADO detectado. Deletando...`);
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: 'Pausado/Finalizado' });
    }

    // Só pula se não tiver título E não tiver detectado morte (pode ser captcha ou erro de load)
    if (!titulo) {
        console.log(`⚠️ Título não carregou, mas não parece morto. (Captcha?). Pulando.`);
        return NextResponse.json({ status: 'skipped', reason: 'Bloqueio/Captcha' });
    }

    // 5. Busca de Preço
    let precoReal = 0;

    // JSON-LD
    try {
        const scriptJson = $('script[type="application/ld+json"]').html();
        if (scriptJson) {
            const data = JSON.parse(scriptJson);
            const p = Array.isArray(data) ? data.find(i => i['@type'] === 'Product') : data;
            const offer = Array.isArray(p?.offers) ? p.offers[0] : p?.offers;
            if (offer?.price) precoReal = parseFloat(offer.price);
            else if (offer?.lowPrice) precoReal = parseFloat(offer.lowPrice);
        }
    } catch (e) {}

    // Meta Tag
    if (!precoReal) {
        const meta = $('meta[itemprop="price"]').attr('content');
        if (meta) precoReal = parseFloat(meta);
    }

    // Visual
    if (!precoReal) {
        $('.andes-money-amount__fraction').each((i, el) => {
            const container = $(el).closest('.andes-money-amount');
            if (!container.hasClass('andes-money-amount--previous')) {
               const val = parseFloat($(el).text().replace(/\./g, "").replace(",", "."));
               if (val > 50) { precoReal = val; return false; }
            }
        });
    }

    // 6. Atualização
    if (precoReal > 0) {
        const diff = Math.abs(precoReal - currentPrice);
        
        if (diff > 1 || currentPrice === 0) {
            console.log(`🔄 ATUALIZANDO: R$ ${currentPrice} -> R$ ${precoReal}`);
            
            const status = (precoReal > currentPrice * 1.4 && currentPrice > 0) ? 'pending' : 'active';

            const updates = { 
                price: precoReal, 
                original_price: precoReal * 1.25, 
                updated_at: new Date()
            };
            if (status === 'pending') updates.status = 'pending';

            const { error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id);

            if (error) {
                console.error(`❌ ERRO BANCO: ${error.message}`);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            console.log(`✅ SUCESSO! Banco atualizado.`);
            return NextResponse.json({ status: 'updated', old: currentPrice, new: precoReal });

        } else {
            console.log(`⏸️ Preço igual.`);
            return NextResponse.json({ status: 'ok', message: 'Sem alteração' });
        }
    }

    return NextResponse.json({ status: 'error', reason: 'Preço não encontrado' });

  } catch (error) {
    console.error("🚨 Crash:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}