import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { id, action, price: manualPrice } = body; 

    // --- MODO 1 e 2: AÇÕES MANUAIS (Mantém igual) ---
    if (action === 'delete') {
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: 'Ação manual' });
    }
    if (action === 'update' && manualPrice) {
        await supabase.from('products').update({ price: manualPrice, updated_at: new Date() }).eq('id', id);
        return NextResponse.json({ status: 'updated', new: manualPrice });
    }

    // --- MODO 3: AUDITORIA (API OFICIAL COM DISFARCE) ---
    console.log(`🚀 [API ML] Audit iniciado para ID: ${id}`);

    const { data: produto, error: dbError } = await supabase
        .from('products')
        .select('original_link, price')
        .eq('id', id)
        .single();

    if (dbError || !produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    const match = produto.original_link?.match(/(MLB-?\d+)/i);
    if (!match) return NextResponse.json({ status: 'skipped', reason: 'Link sem ID MLB' });
    
    const mlbID = match[1].replace('-', '');

    console.log(`🔎 Consultando: ${mlbID}`);

    // 🔥 O DISFARCE ESTÁ AQUI: HEADERS DE NAVEGADOR 🔥
    // Sem isso, o ML devolve 403. Com isso, ele acha que somos o Google Chrome.
    const response = await fetch(`https://api.mercadolibre.com/items/${mlbID}`, {
        method: 'GET',
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.mercadolivre.com.br/",
            "Origin": "https://www.mercadolivre.com.br"
        }
    });

    // 🚨 Tratamento de Erros
    if (response.status === 403) {
        // Se ainda der 403, é bloqueio de IP. Mas geralmente os headers resolvem.
        console.error("⛔ Bloqueio 403 (WAF).");
        return NextResponse.json({ status: 'error', reason: 'Bloqueio de Segurança do ML (403)' });
    }

    if (response.status === 404) {
        console.log(`💀 404: Produto não existe. Deletando...`);
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: 'Removido (404)' });
    }

    if (!response.ok) {
        return NextResponse.json({ status: 'error', reason: `Erro API: ${response.status}` });
    }

    const dataML = await response.json();

    // 🚨 Verifica Status (Pausado/Inativo)
    const statusRuins = ['paused', 'closed', 'inactive', 'under_review'];
    if (statusRuins.includes(dataML.status)) {
        console.log(`⏸️ Produto ${dataML.status}. Deletando...`);
        await supabase.from('products').delete().eq('id', id);
        return NextResponse.json({ status: 'deleted', reason: `Status ML: ${dataML.status}` });
    }

    // ✅ Verifica Preço
    const precoNovo = Number(dataML.price);
    const precoAntigo = Number(produto.price);

    if (precoNovo !== precoAntigo) {
        console.log(`💰 Atualizando: R$${precoAntigo} -> R$${precoNovo}`);
        
        const novoStatus = (precoNovo > precoAntigo * 1.5) ? 'pending' : 'approved';

        await supabase.from('products').update({ 
            price: precoNovo,
            original_price: Math.max(precoNovo * 1.25, dataML.original_price || 0),
            status: novoStatus,
            updated_at: new Date() 
        }).eq('id', id);

        return NextResponse.json({ status: novoStatus === 'pending' ? 'changed_pending' : 'updated', old: precoAntigo, new: precoNovo });
    }

    return NextResponse.json({ status: 'ok', message: 'Preço igual' });

  } catch (error: any) {
    console.error("🚨 Erro Audit:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}