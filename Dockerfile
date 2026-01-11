# Usa uma imagem oficial do Node.js
FROM node:22-slim

# --- ADICIONE ISTO ---
# Declara que vamos aceitar essas variáveis na hora do build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Passa o valor delas para o ambiente durante o build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
# ---------------------

# Instala o Chrome e dependências do Linux
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# --- LINHA NOVA IMPORTANTE ---
# Diz pro Puppeteer: "Não baixe o Chrome, eu já instalei acima via apt-get"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Instala as dependências
RUN npm install

COPY . .

# Constrói o site (Agora com regras relaxadas do next.config)
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]