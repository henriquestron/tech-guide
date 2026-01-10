// Arquivo: teste-modelo.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listarModelos() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 
    // Apenas testando a conexão genérica
    console.log("Tentando listar modelos disponíveis para sua chave...");
    
    // Isso é um hack para forçar o erro e ver se a conexão funciona, 
    // pq a listagem de modelos exige curl geralmente.
    // Vamos tentar gerar um 'oi' com o modelo mais básico.
    
    const modelosParaTestar = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash-001", "gemini-pro", "gemini-1.0-pro"];
    
    for (const nomeModelo of modelosParaTestar) {
        try {
            console.log(`Testando: ${nomeModelo}...`);
            const modelo = genAI.getGenerativeModel({ model: nomeModelo });
            await modelo.generateContent("Oi");
            console.log(`✅ SUCESSO! O modelo '${nomeModelo}' funciona.`);
            return; // Para no primeiro que funcionar
        } catch (e) {
            console.log(`❌ ${nomeModelo} falhou.`);
        }
    }
    
  } catch (error) {
    console.error("Erro geral:", error.message);
  }
}

listarModelos();