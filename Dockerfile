# Usa uma imagem oficial do Node.js
FROM node:18-slim

# Instala bibliotecas necessárias para o Chrome rodar (Isso é o segredo!)
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configura o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o resto do projeto
COPY . .

# Constrói o site Next.js
RUN npm run build

# Expõe a porta que o Render usa
EXPOSE 3000

# Comando para iniciar o site
CMD ["npm", "start"]