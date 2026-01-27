import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { term, contact } = await req.json();

    // Validação simples
    if (!contact || !term) {
      return NextResponse.json({ error: "Dados faltando" }, { status: 400 });
    }

    // Conecta no Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Salva na tabela 'price_alerts' (que criamos antes)
    const { error } = await supabase.from('price_alerts').insert({
      search_term: term,       // O que a pessoa procurou (ex: "Playstation 6")
      user_contact: contact,   // O Zap ou Email
      status: 'pending',       // Status inicial
      target_price: 0          // 0 = Aviso de disponibilidade
    });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro ao salvar alerta:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}