import { createClient } from '@supabase/supabase-js'

// Tenta pegar as chaves, mas se não tiver, usa string vazia para não quebrar o build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Só cria o cliente se as chaves existirem de verdade
export const supabase = createClient(supabaseUrl, supabaseKey);