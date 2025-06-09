# LGS/YKS Backend API

LGS ve YKS Eğitim Platformu Backend API Servisi

## 🚀 Teknoloji Stack

- **Node.js** - Server runtime
- **Express.js** - Web framework
- **PostgreSQL** - Veritabanı
- **Docker** - Containerization
- **JWT** - Authentication
- **Multer** - File upload
- **Twilio** - SMS servisi

## ✨ Özellikler

- ✅ Kullanıcı kimlik doğrulama (SMS ile)
- ✅ Sınav, sınıf, ders, konu yönetimi
- ✅ Öğrenci ilerleme takibi
- ✅ Hedef ve haftalık program sistemi
- ✅ Soru havuzu yönetimi
- ✅ Admin paneli API'ları
- ✅ Dosya yükleme sistemi
- ✅ Dashboard istatistikleri

## 🛠 Kurulum

```bash
# Dependencies install
npm install

# Docker ile veritabanı başlat
docker-compose up -d

# Veritabanı migration
npm run migrate

# Seed data yükle
npm run seed

# Server başlat
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kayıt
- `POST /api/auth/login` - Telefon ile giriş
- `POST /api/auth/verify-sms` - SMS doğrulama
- `POST /api/auth/resend-sms` - SMS tekrar gönder

### Content Management
- `GET /api/classes` - Sınıfları listele
- `GET /api/subjects` - Dersleri listele
- `GET /api/topics` - Konuları listele
- `GET /api/exams` - Sınavları listele

### Progress Tracking
- `POST /api/progress/topic` - Konu ilerlemesi işaretle
- `GET /api/users/me/progress` - Kullanıcı ilerlemesi

### Goals & Programs
- `GET /api/goals` - Hedefleri listele
- `POST /api/goals` - Yeni hedef oluştur
- `GET /api/programs` - Programları listele
- `POST /api/programs` - Yeni program oluştur

### Questions
- `GET /api/questions` - Soruları listele
- `POST /api/questions` - Yeni soru oluştur
- `POST /api/upload` - Dosya yükleme

### Admin APIs
- `POST /api/admin/login` - Admin giriş
- `GET /api/admin/dashboard` - Dashboard istatistikleri
- `GET /api/admin/users` - Kullanıcıları listele

## 🔧 Environment Variables

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lgs_yks_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@lgs.com
ADMIN_PASSWORD=admin123
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

## 📁 Proje Yapısı

```
src/
├── controllers/     # Route controller'ları
├── middleware/      # Auth ve error middleware'leri
├── routes/         # API route tanımları
├── services/       # Business logic servisleri
├── utils/          # Yardımcı fonksiyonlar
├── config/         # Veritabanı konfigürasyonu
└── app.js          # Express app konfigürasyonu
```

## 🧪 Test

```bash
# Testleri çalıştır
npm test

# Test coverage
npm run coverage
```

## 📦 Docker

```bash
# Build image
docker build -t lgs-backend .

# Run container
docker run -p 3000:3000 lgs-backend
```

## 👨‍💻 Geliştirici

- **Hüseyin Çınar** - Backend Developer
- Email: huseyin-cinar@outlook.com
- GitHub: [@codebycinar](https://github.com/codebycinar)

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.