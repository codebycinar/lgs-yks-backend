const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload klasörlerini oluştur
const createUploadDirs = () => {
  const dirs = [
    './uploads',
    './uploads/questions',
    './uploads/solutions'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Storage konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    createUploadDirs();
    
    // Dosya türüne göre klasör belirleme
    if (file.fieldname.includes('question')) {
      cb(null, './uploads/questions');
    } else if (file.fieldname.includes('solution')) {
      cb(null, './uploads/solutions');
    } else {
      cb(null, './uploads');
    }
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluştur
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
  // İzin verilen dosya türleri
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya türü. Sadece JPG, PNG, WEBP ve PDF dosyaları yüklenebilir.'), false);
  }
};

// Multer konfigürasyonu
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max dosya boyutu
    files: 4 // Maksimum 4 dosya (soru resmi, soru PDF, çözüm resmi, çözüm PDF)
  }
});

// Çoklu dosya yükleme için middleware
const uploadQuestionFiles = upload.fields([
  { name: 'questionImage', maxCount: 1 },
  { name: 'questionPdf', maxCount: 1 },
  { name: 'solutionImage', maxCount: 1 },
  { name: 'solutionPdf', maxCount: 1 }
]);

// Tek dosya yükleme
const uploadSingle = upload.single('file');

// Dosya silme
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      resolve();
      return;
    }

    const fullPath = path.join(__dirname, '../../', filePath);
    
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Dosya URL'i oluşturma
const getFileUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

// Dosya varlığını kontrol etme
const fileExists = (filePath) => {
  if (!filePath) return false;
  const fullPath = path.join(__dirname, '../../', filePath);
  return fs.existsSync(fullPath);
};

module.exports = {
  uploadQuestionFiles,
  uploadSingle,
  deleteFile,
  getFileUrl,
  fileExists,
  createUploadDirs
};