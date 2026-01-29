import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // 🔒 Segurança Opcional: Verifica se a chamada vem do Cron da Vercel
  // (Isso impede que qualquer um fique chamando essa rota)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Se você não configurar a variável CRON_SECRET na Vercel, pode remover esse IF
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const agora = new Date().toISOString();

    // Deleta produtos onde 'expires_at' é menor que AGORA
    // Ou seja, a data de expiração já passou.
    const { error, count } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .lt('expires_at', agora)
        .not('expires_at', 'is', null); // Garante que só apaga quem tem data definida

    if (error) throw error;

    return NextResponse.json({ 
        success: true, 
        message: `Faxina concluída. ${count} ofertas expiradas removidas.`,
        timestamp: agora
    });

  } catch (error) {
    console.error("Erro na faxina:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}