require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listarOQueEuTenho() {
  console.log("🔍 Consultando a API do Google com sua chave...");

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.log("❌ ERRO NA CONTA:");
      console.log(data.error.message);
      return;
    }

    if (!data.models) {
      console.log("⚠️ Estranho... Nenhum modelo listado.");
      return;
    }

    console.log("✅ SUCESSO! Aqui estão os modelos que você PODE usar:");
    console.log("------------------------------------------------");
    // Filtra para mostrar só os Gemini
    const modelosGemini = data.models.filter(m => m.name.includes('gemini'));
    
    modelosGemini.forEach(m => {
      console.log(`Nome para por no código: "${m.name.replace('models/', '')}"`);
    });
    console.log("------------------------------------------------");

  } catch (error) {
    console.error("Erro de conexão:", error);
  }
}

listarOQueEuTenho();