import { Product } from "@/types";

export const products: Product[] = [
  // --- CELULARES ---
  {
    id: "1",
    title: "Samsung Galaxy S24 Ultra 5G",
    category: "celulares",
    image: "https://http2.mlstatic.com/D_NQ_NP_946729-MLA74033301019_012024-O.webp",
    price: 6499.00,
    rating: 4.9,
    shortDescription: "O Android definitivo com caneta S-Pen e câmeras de nível profissional.",
    affiliateLink: "LINK_DO_SEU_AFILIADO",
    fullReview: {
      pros: ["Tela Flat super brilhante", "Câmera de 200MP", "7 anos de atualizações"],
      cons: ["Preço elevado", "Carregamento poderia ser mais rápido"],
      specs: { "Processador": "Snapdragon 8 Gen 3", "Armazenamento": "512GB", "Tela": "6.8 AMOLED" },
      content: "O Galaxy S24 Ultra é a escolha para quem não aceita menos que o máximo em produtividade...",
      verdict: "O melhor smartphone Android de 2025."
    }
  },
  {
    id: "1-b",
    title: "iPhone 15 Pro Max",
    category: "celulares",
    image: "https://http2.mlstatic.com/D_NQ_NP_661608-MLA71783300806_092023-O.webp",
    price: 8200.00,
    originalPrice: 8999.00, // <--- Adicione isso para testar o desconto
  // ... resto dos dados
    rating: 4.8,
    shortDescription: "Titânio, USB-C e o chip A17 Pro para desempenho inigualável.",
    affiliateLink: "LINK_DO_SEU_AFILIADO",
    fullReview: {
      pros: ["Construção em titânio leve", "Melhor gravação de vídeo", "Botão de Ação"],
      cons: ["Carregamento lento", "Preço premium"],
      specs: { "Chip": "A17 Pro", "Câmera": "48MP", "Material": "Titânio" },
      content: "A Apple refinou o design e finalmente trouxe o USB-C...",
      verdict: "A melhor escolha para o ecossistema Apple."
    }
  },

  // --- NOTEBOOKS ---
  {
    id: "2",
    title: "MacBook Air M2 13 Polegadas",
    category: "notebooks",
    image: "https://http2.mlstatic.com/D_NQ_NP_667258-MLA50907404285_072022-O.webp",
    price: 7200.00,
    rating: 4.8,
    shortDescription: "Leveza absurda, design premium e bateria que dura o dia todo.",
    affiliateLink: "LINK_DO_SEU_AFILIADO",
    fullReview: {
      pros: ["Bateria para 18 horas", "Tela Liquid Retina", "Totalmente silencioso"],
      cons: ["Suporta apenas 1 monitor externo", "SSD base de 256GB é mais lento"],
      specs: { "Chip": "Apple M2", "RAM": "8GB", "Peso": "1.24kg" },
      content: "O notebook perfeito para estudantes, escritores e uso geral...",
      verdict: "Líder absoluto em portabilidade."
    }
  },

  // --- PEÇAS DE PC ---
  {
    id: "3",
    title: "Placa de Vídeo RTX 4060 Ti 8GB",
    category: "pecas",
    image: "https://http2.mlstatic.com/D_NQ_NP_976865-MLA69536869818_052023-O.webp",
    price: 2600.00,
    rating: 4.5,
    shortDescription: "O melhor custo-benefício para rodar tudo em Full HD no Ultra com DLSS 3.",
    affiliateLink: "LINK_DO_SEU_AFILIADO",
    fullReview: {
      pros: ["Tecnologia DLSS 3 (Frame Gen)", "Baixo consumo de energia", "Fria e silenciosa"],
      cons: ["Apenas 8GB de VRAM", "Interface de memória limitada"],
      specs: { "VRAM": "8GB GDDR6", "Arquitetura": "Ada Lovelace", "DLSS": "3.5" },
      content: "Para quem joga em 1080p, essa placa sobra e entrega taxas de quadros altíssimas...",
      verdict: "Rainha do 1080p."
    }
  },
  

  // --- RELÓGIOS ---
  {
    id: "4",
    title: "Samsung Galaxy Watch 6 Classic",
    category: "relogios",
    image: "https://http2.mlstatic.com/D_NQ_NP_830349-MLA70908863617_082023-O.webp",
    price: 1499.00,
    rating: 4.6,
    shortDescription: "A volta da coroa giratória física e monitoramento de saúde avançado.",
    affiliateLink: "LINK_DO_SEU_AFILIADO",
    fullReview: {
      pros: ["Coroa giratória funcional", "Tela maior e mais brilhante", "Wear OS fluido"],
      cons: ["Bateria de 1 dia e meio", "Carregamento lento"],
      specs: { "Tamanho": "47mm", "Sistema": "Wear OS 4", "Sensores": "BioActive" },
      content: "O relógio inteligente mais completo para quem usa Android...",
      verdict: "O melhor smartwatch Android."
    }
  },

  // --- GAMES ---
  {
    id: "5",
    title: "PlayStation 5 Slim Edição Digital",
    category: "games",
    image: "https://http2.mlstatic.com/D_NQ_NP_832692-MLA72656910793_112023-O.webp",
    price: 3599.00,
    rating: 5.0,
    shortDescription: "A nova geração de consoles da Sony, agora em design mais compacto.",
    affiliateLink: "LINK_DO_SEU_AFILIADO",
    fullReview: {
      pros: ["Carregamento instantâneo (SSD)", "Controle DualSense imersivo", "Design reduzido"],
      cons: ["Sem leitor de disco nesta versão", "Base vertical vendida à parte"],
      specs: { "Armazenamento": "1TB SSD", "Resolução": "4K 120Hz", "GPU": "RDNA 2" },
      content: "Jogar no PS5 é uma experiência transformadora graças ao controle háptico...",
      verdict: "A porta de entrada para a nova geração."
    }
  },

  // --- ACESSÓRIOS ---
  {
    id: "6",
    title: "Fone Bluetooth QCY T13 ANC",
    category: "acessorios",
    image: "https://http2.mlstatic.com/D_NQ_NP_666797-MLA52220797300_102022-O.webp",
    price: 140.00,
    rating: 4.7,
    shortDescription: "Cancelamento de ruído ativo por um preço inacreditável.",
    affiliateLink: "LINK_DO_SEU_AFILIADO",
    fullReview: {
      pros: ["Custo-benefício imbatível", "ANC funciona bem", "Bateria duradoura"],
      cons: ["Construção simples em plástico", "Microfone mediano"],
      specs: { "Conexão": "Bluetooth 5.3", "ANC": "Sim (-28dB)", "App": "QCY App" },
      content: "Não existe nada no mercado que entregue tanto custando tão pouco...",
      verdict: "O rei dos fones baratos."
    }
  }
];