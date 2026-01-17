import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { items } = await req.json(); // Recebe lista: [{id: 1, link: '...'}, {id: 2, link: '...'}]

    if (!items || !Array.isArray(items)) {
        return NextResponse.json({ success: false, message: "Formato inválido." });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let atualizados = 0;
    let erros = 0;

    for (const item of items) {
        if (item.id && item.link && item.link.includes('mercadolivre')) { // Validação básica
            const { error } = await supabase
                .from('products')
                .update({ 
                    link: item.link, 
                    status: 'approved', // Já aprova automaticamente!
                    updated_at: new Date()
                })
                .eq('id', item.id);

            if (!error) atualizados++;
            else erros++;
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: `${atualizados} produtos atualizados e aprovados! (${erros} erros)` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}