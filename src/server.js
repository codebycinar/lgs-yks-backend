const app = require('./app');
const { connectDB } = require('./config/database');
const { createUploadDirs } = require('./services/fileUploadService');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Upload klasörlerini oluştur
    createUploadDirs();
    console.log('📁 Upload directories created');
    
    app.listen(PORT, () => {
      console.log(`🚀 LGS Backend server running on port ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
      console.log(`📄 File uploads: http://localhost:${PORT}/api/upload`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();