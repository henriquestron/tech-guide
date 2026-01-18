import { NextResponse } from "next/server";
import { ApifyClient } from 'apify-client';
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function parsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    try {
        return parseFloat(String(priceStr).replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    } catch (e) { return 0; }
}

async function gerarReviewIA(produto, preco, categoria, subcategoria) {
    if (!process.env.GEMINI_API_KEY) return null;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Definição do Schema (Agora em JS puro, sem interfaces)
        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                brand: { type: SchemaType.STRING },
                shortDescription: { type: SchemaType.STRING },
                rating: { type: SchemaType.NUMBER },
                fullReview: {
                    type: SchemaType.OBJECT,
                    properties: {
                        verdict: { type: SchemaType.STRING },
                        pros: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING }
                        },
                        cons: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING }
                        },
                        content: { type: SchemaType.STRING }
                    },
                    required: ["verdict", "pros", "cons", "content"]
                }
            },
            required: ["brand", "shortDescription", "rating", "fullReview"]
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7,
            }
        });

        const prompt = `
          Você é um Especialista Tech Sênior.
          Analise este produto com profundidade técnica e persuasão de vendas.
          
          DADOS DO PRODUTO:
          - Nome: "${produto}"
          - Preço: R$ ${preco}
          - Categoria: "${categoria}"
          - Subcategoria: "${subcategoria || 'Geral'}"

          OBJETIVO:
          Preencha o JSON exatamente conforme o schema.
          - shortDescription: Uma frase curta (max 100 chars) que desperte desejo.
          - rating: Nota justa entre 3.5 e 5.0 baseada na qualidade percebida.
          - fullReview.verdict: Veredito direto ("Vale a pena?", "É o melhor?").
          - fullReview.pros: 3 pontos fortes técnicos.
          - fullReview.cons: 1 ou 2 pontos de atenção.
          - fullReview.content: Um parágrafo de 3 a 4 linhas detalhando o uso e benefícios.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            return JSON.parse(text);
        } catch (e) {
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        }

    } catch (error) {
        console.error("❌ ERRO CRÍTICO GEMINI:", error);
        return null;
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const termo = String(body.termo || "");
        const categoria = String(body.categoria || "Geral");
        const subcategoria = String(body.subcategoria || "");
        const isFlash = !!body.isFlash;
        const userLimit = Number(body.limit) || 5;

        const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

        const apifyInput = {
            country: "BR",
            maxItems: userLimit,
            proxyConfiguration: { useApifyProxy: true },
        };

        let flashKeywords = [];

        if (isFlash) {
            console.log(`⚡ Modo Flash: Buscando ofertas gerais (Limitado a ${userLimit} salvos)`);
            apifyInput.scrapeOfertas = true;
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
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        let salvos = 0;
        const expiresAt = isFlash ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

        let itemsParaProcessar = items;
        if (!isFlash) {
            itemsParaProcessar = items.slice(0, userLimit);
        }

        for (const item of itemsParaProcessar) {
            if (salvos >= userLimit) break;

            const itemLink = String(item.zProdutoLink || item.url || item.link || "");
            const itemImage = String(item.imagemLink || item.thumbnail || item.image || "");
            const itemTitle = String(item.eTituloProduto || item.title || "");
            const itemPrice = parsePrice(item.novoPreco || item.price);

            if (itemLink && itemTitle && itemPrice > 0) {

                if (isFlash && flashKeywords.length > 0) {
                    const tituloLower = itemTitle.toLowerCase();
                    const passouFiltro = flashKeywords.some((keyword) => tituloLower.includes(keyword));
                    if (!passouFiltro) continue;
                }

                const { data: existente } = await supabase.from('products').select('id').eq('original_link', itemLink).single();

                if (!existente) {
                    const iaData = await gerarReviewIA(itemTitle, itemPrice, categoria, subcategoria);

                    let finalReview = "";
                    let shortDesc = "";
                    let marcaDetectada = String(item.produtoMarca || "Genérico");
                    let rating = 4.8;

                    if (iaData && iaData.fullReview) {
                        shortDesc = iaData.shortDescription;
                        rating = iaData.rating || 4.8;
                        if (iaData.brand && iaData.brand !== "Marca") marcaDetectada = iaData.brand;

                        finalReview = `
                        <p><strong>Veredito:</strong> ${iaData.fullReview.verdict}</p>
                        <br/>
                        <p><strong>✅ Prós:</strong></p>
                        <ul>${(iaData.fullReview.pros || []).map((p) => `<li>${p}</li>`).join('')}</ul>
                        <br/>
                        <p><strong>❌ Contras:</strong></p>
                        <ul>${(iaData.fullReview.cons || []).map((c) => `<li>${c}</li>`).join('')}</ul>
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
                        brand: marcaDetectada,
                        rating: rating,
                        short_description: shortDesc,
                        full_review: finalReview,
                        status: 'pending',
                        expires_at: expiresAt
                    }]);

                    if (!error) salvos++;
                }
            }
        }

        const msgSucesso = `Sucesso! Processados e salvos ${salvos} novos produtos na aba PENDENTES.`;
        return NextResponse.json({ success: true, message: msgSucesso });

    } catch (error) {
        console.error("❌ Erro Route:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}