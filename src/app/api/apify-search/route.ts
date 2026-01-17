import { NextResponse } from "next/server";
import { ApifyClient } from 'apify-client';
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 120; 

interface RequestBody {
    termo?: string;
    categoria?: string;
    subcategoria?: string;
    isFlash?: boolean;
    limit?: number | string;
}

function parsePrice(priceStr: any) {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    try {
        return parseFloat(String(priceStr).replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    } catch (e) { return 0; }
}

async function gerarReviewIA(produto: string, preco: number, categoria: string) {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
          Especialista Tech. Produto: "${produto}", Preço: R$ ${preco}.
          Categoria: "${categoria}".
          Analise o produto. Responda APENAS com este JSON RÍGIDO (sem markdown): 
          { 
            "shortDescription": "frase curta e impactante de venda (max 20 palavras)", 
            "rating": 4.5, 
            "fullReview": { 
                "verdict": "Veredito direto em 1 frase", 
                "pros": ["Ponto positivo 1", "Ponto positivo 2", "Ponto positivo 3"], 
                "cons": ["Ponto negativo 1"], 
                "content": "Parágrafo detalhado de análise persuasiva." 
            } 
          }
        `;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Erro Gemini:", error);
        return null;
    }
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const termo = String(body.termo || "");
    const categoria = String(body.categoria || "Geral");
    const subcategoria = String(body.subcategoria || "");
    const isFlash = !!body.isFlash;
    const userLimit = Number(body.limit) || 5;

    const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

    const apifyInput: any = {
        country: "BR", 
        maxItems: userLimit, 
        proxyConfiguration: { useApifyProxy: true },
    };

    let flashKeywords: string[] = [];

    if (isFlash) {
        console.log(`⚡ Modo Flash: Buscando ofertas gerais (Limitado a ${userLimit} salvos)`);
        apifyInput.scrapeOfertas = true; 
        // No modo Flash, pegamos um pouco mais para garantir que o filtro funcione
        apifyInput.maxItems = Math.max(userLimit, 30);

        if (termo) {
            flashKeywords = termo.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t !== "");
        }
    } else {
        console.log(`🔍 Modo Normal: Buscando "${termo}" (Limitado a ${userLimit} salvos)`);
        apifyInput.keyword = termo;
    }

    const run = await client.actor("karamelo/mercadolivre-scraper-brasil-portugues").call(apifyInput);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
        return NextResponse.json({ success: false, message: "Nenhum produto encontrado." });
    }

    console.log(`📦 Apify trouxe ${items.length} itens brutos.`);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let salvos = 0;
    const expiresAt = isFlash ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    // ✂️ A TESOURA (Corta excessos na busca normal)
    let itemsParaProcessar = items;
    if (!isFlash) {
        itemsParaProcessar = items.slice(0, userLimit);
    }

    for (const item of itemsParaProcessar) {
        // Se já salvamos o limite desejado no modo Flash, paramos
        if (salvos >= userLimit) break;

        const itemLink = String(item.zProdutoLink || item.url || item.link || "");
        const itemImage = String(item.imagemLink || item.thumbnail || item.image || "");
        const itemTitle = String(item.eTituloProduto || item.title || ""); 
        const itemPrice = parsePrice(item.novoPreco || item.price);

        if (itemLink && itemTitle && itemPrice > 0) {
            
            // Filtro do Modo Flash
            if (isFlash && flashKeywords.length > 0) {
                const tituloLower = itemTitle.toLowerCase();
                const passouFiltro = flashKeywords.some((keyword: string) => tituloLower.includes(keyword));
                if (!passouFiltro) continue; 
            }

            const { data: existente } = await supabase.from('products').select('id').eq('original_link', itemLink).single();

            if (!existente) {
                const iaData = await gerarReviewIA(itemTitle, itemPrice, categoria);
                
                let finalReview = "";
                let shortDesc = "";
                
                if (iaData && iaData.fullReview) {
                    shortDesc = iaData.shortDescription;
                    finalReview = `
                        <p><strong>Veredito:</strong> ${iaData.fullReview.verdict}</p>
                        <br/>
                        <p><strong>✅ Prós:</strong></p>
                        <ul>${(iaData.fullReview.pros || []).map((p:string) => `<li>${p}</li>`).join('')}</ul>
                        <br/>
                        <p><strong>❌ Contras:</strong></p>
                        <ul>${(iaData.fullReview.cons || []).map((c:string) => `<li>${c}</li>`).join('')}</ul>
                        <br/>
                        <p>${iaData.fullReview.content}</p>
                    `;
                } else {
                    shortDesc = `Oferta incrível: ${itemTitle}`;
                    finalReview = `Aproveite esta oportunidade única. Produto com excelente custo benefício.`;
                }

                const { error } = await supabase.from('products').insert([{
                    title: itemTitle,
                    price: itemPrice,
                    original_price: itemPrice * 1.3,
                    link: itemLink, 
                    original_link: itemLink,
                    image: itemImage,
                    category: categoria,
                    subcategory: subcategoria,
                    brand: String(item.produtoMarca || "Genérico"),
                    rating: iaData?.rating || 4.8,
                    short_description: shortDesc,
                    full_review: finalReview,
                    status: 'pending', // <--- AQUI ESTÁ A CORREÇÃO! (Vai pra pendente)
                    expires_at: expiresAt 
                }]);

                if (!error) salvos++;
            }
        }
    }

    const msgSucesso = `Sucesso! Processados e salvos ${salvos} novos produtos na aba PENDENTES.`;
    return NextResponse.json({ success: true, message: msgSucesso });

  } catch (error: any) {
    console.error("❌ Erro Route:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}