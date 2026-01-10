require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Configurações
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function iniciarAtualizacao() {
  console.log("🔄 Iniciando Assistente de Atualização de Links...");

  // 1. Busca os produtos (ordenado por ID Crescente -> Do 1 ao 10)
  const { data: produtos, error } = await supabase
    .from('products')
    .select('id, title, link')
    .order('id', { ascending: true }) // <--- MUDAMOS PARA TRUE (Começa do primeiro)
    .limit(10);

  if (error) {
    console.error("❌ Erro ao buscar produtos:", error.message);
    process.exit(1);
  }

  if (!produtos || produtos.length === 0) {
    console.log("⚠️ Nenhum produto encontrado no banco.");
    process.exit(0);
  }

  console.log(`\n📋 Encontrei os últimos ${produtos.length} produtos adicionados.`);
  console.log("Vamos atualizar os links um por um. (Deixe em branco para pular)\n");

  for (const produto of produtos) {
    console.log("------------------------------------------------");
    console.log(`📦 Produto: ${produto.title}`);
    console.log(`🔗 Link Atual: ${produto.link}`);
    
    const novoLink = await fazerPergunta("💰 Cole o LINK DE AFILIADO aqui: ");

    if (novoLink.trim() !== "") {
      const { error: updateError } = await supabase
        .from('products')
        .update({ link: novoLink.trim() })
        .eq('id', produto.id);

      if (updateError) {
        console.log("❌ Erro ao atualizar:", updateError.message);
      } else {
        console.log("✅ Link atualizado com sucesso!");
      }
    } else {
      console.log("⏩ Pulando...");
    }
  }

  console.log("\n🎉 Tudo pronto! Todos os links processados.");
  rl.close();
  process.exit(0);
}

function fazerPergunta(pergunta) {
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => {
      resolve(resposta);
    });
  });
}

iniciarAtualizacao();