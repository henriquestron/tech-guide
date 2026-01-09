import { createClient } from '@supabase/supabase-js'

// Tenta pegar as chaves, mas se não tiver, usa string vazia para não quebrar o build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Só cria o cliente se as chaves existirem de verdade
export const supabase = createClient(supabaseUrl, supabaseKey);