# Node.js 20 LTS kullanıyoruz - stabil ve güvenli
FROM node:20-alpine

# Çalışma dizinini ayarlıyoruz
WORKDIR /app

# Package dosyalarını kopyalıyoruz
COPY package*.json ./

# Bağımlılıkları yüklüyoruz
RUN npm ci --only=production && npm cache clean --force

# Kaynak kodunu kopyalıyoruz
COPY . .

# Port'u expose ediyoruz
EXPOSE 3000

# Uygulamayı başlatıyoruz
CMD ["npm", "start"]