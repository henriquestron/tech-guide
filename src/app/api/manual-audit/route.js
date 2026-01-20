import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import axios from "axios";

export const dynamic = 'force-dynamic';

// Função de espera
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function POST(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { id } = body; 

    console.log(`🚀 Audit iniciado para ID: ${id}`);

    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    // 1. Busca o Link no Banco
    const { data: produto, error: dbError } = await supabase
        .from('products')
        .select('original_link, price')
        .eq('id', id)
        .single();

    if (dbError || !produto) {
        return NextResponse.json({ error: "Produto não encontrado no banco" }, { status: 404 });
    }

    const original_link = produto.original_link || "";
    const currentPrice = produto.price;

    // --- 🛑 FILTRO DE SEGURANÇA (NOVO) ---
    // Se o link original for um link de afiliado (/sec/), pulamos a auditoria
    if (original_link.includes('/sec/') || original_link.includes('mercadolivre.com/sec')) {
        console.log(`⏭️ SKIPPED: Link de afiliado detectado na coluna original. ID: ${id}`);
        return NextResponse.json({ status: 'skipped', reason: 'Link Afiliado na origem' });
    }
    // -------------------------------------

    // 2. O GRANDE DELAY (Segurança contra Bloqueio)
    console.log(`⏳ Aguardando 1 minuto (60s) para evitar bloqueio...`);
    await sleep(60000); 

    // 3. Download do HTML (Simulando Chrome Windows)
    console.log(`🔗 Acessando: ${original_link}`);
    let html;
    let statusCode;

    try {
        const response = await axios.get(original_link, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Referer": "https://www.google.com.br/",
                "Cache-Control": "no-cache"
            },
            timeout: 20000, 
            validateStatus: status => status < 500
        });
        html = response.data;
        statusCode = response.status;
    } catch (err) {
        console.error(`❌ Erro Conexão: ${err.message}`);
        return NextResponse.json({ status: 'error', reason: 'Falha ao baixar página' });
    }

    if (statusCode === 404) {
        console.log(`💀 404 Detectado. Removendo...`);
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: 'Erro 404' });
    }

    const $ = cheerio.load(html);
    const titulo = $('h1').text().trim();
    const bodyText = $('body').text();

    // Verificação de Anúncio Pausado
    const frasesDeMorte = [
        "Anúncio pausado",
        "Este anúncio não existe mais",
        "Finalizamos este anúncio",
        "Página não encontrada"
    ];
    const isDead = frasesDeMorte.some(frase => bodyText.includes(frase));

    if (isDead) {
        console.log(`💀 Anúncio Pausado. Removendo...`);
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: 'Pausado' });
    }

    if (!titulo) {
        console.log(`⚠️ Título não carregou (Possível Captcha).`);
        return NextResponse.json({ status: 'skipped', reason: 'Bloqueio/Captcha' });
    }

    // 4. Busca de Preço
    let precoReal = 0;

    const metaPrice = $('meta[itemprop="price"]').attr('content');
    if (metaPrice) precoReal = parseFloat(metaPrice);

    if (!precoReal) {
        $('.andes-money-amount__fraction').each((i, el) => {
            const val = parseFloat($(el).text().replace(/\./g, "").replace(",", "."));
            if (val > 50) { precoReal = val; return false; } 
        });
    }

    // 5. Atualização
    if (precoReal > 0) {
        const diff = Math.abs(precoReal - currentPrice);
        
        if (diff > 1 || currentPrice === 0) {
            console.log(`🔄 ATUALIZANDO: R$ ${currentPrice} -> R$ ${precoReal}`);
            
            await supabase.from('products').update({ 
                price: precoReal, 
                original_price: precoReal * 1.25, 
                updated_at: new Date()
            }).eq('id', id);

            return NextResponse.json({ status: 'updated', old: currentPrice, new: precoReal });
        } else {
            console.log(`✅ Preço igual.`);
            return NextResponse.json({ status: 'ok', message: 'Sem alteração' });
        }
    }

    return NextResponse.json({ status: 'error', reason: 'Preço não lido' });

  } catch (error) {
    console.error("🚨 Crash:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}