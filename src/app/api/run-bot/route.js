import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { termo, categoria, subcategoria } = await req.json();

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json({ error: "Falta o GITHUB_TOKEN no .env" }, { status: 500 });
    }

    // Configurações do seu Repositório (Preencha aqui ou no .env)
    const OWNER = "henriquestron"; // Seu usuário do GitHub
    const REPO = "tech-guide";     // Nome do repositório
    const WORKFLOW_ID = "robo.yml"; // Nome do arquivo yml

    console.log(`📡 Enviando comando para o GitHub: Buscar "${termo}"`);

    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
      {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "Authorization": `token ${process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          ref: "main", // Branch principal
          inputs: {
            termo: termo || "",
            categoria: categoria || "geral",
            subcategoria: subcategoria || ""
          }
        })
      }
    );

    if (response.status === 204) {
      return NextResponse.json({ 
        success: true, 
        message: "✅ Comando enviado! O robô começou a rodar no GitHub. Os produtos aparecerão em 1 ou 2 minutos." 
      });
    } else {
      const erro = await response.text();
      console.error("Erro GitHub:", erro);
      return NextResponse.json({ error: `Erro ao chamar GitHub: ${erro}` }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}