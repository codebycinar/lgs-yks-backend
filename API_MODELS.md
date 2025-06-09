# API Veri Modelleri

## Exam (Sınav)
```typescript
interface Exam {
  id: string;                    // UUID
  name: string;                  // Sınav adı (örn: "LGS 2025")
  examDate: string;             // Sınav tarihi (YYYY-MM-DD)
  targetClassLevels: number[];   // Hedef sınıf seviyeleri (örn: [8] veya [12])
  prepClassLevels: number[];     // Hazırlık sınıf seviyeleri (örn: [6,7,8] veya [9,10,11,12])
  description: string;           // Sınav açıklaması
  isActive: boolean;            // Aktif/Pasif durumu
  createdAt: string;            // Oluşturulma tarihi
  updatedAt: string;            // Güncellenme tarihi
}
```

## Class (Sınıf)
```typescript
interface Class {
  id: string;                    // UUID
  name: string;                  // Sınıf adı (örn: "8. Sınıf")
  minClassLevel: number;         // Minimum sınıf seviyesi
  maxClassLevel: number;         // Maximum sınıf seviyesi
  examId: string;               // Bağlı olduğu sınavın ID'si
  isActive: boolean;            // Aktif/Pasif durumu
  createdAt: string;            // Oluşturulma tarihi
  updatedAt: string;            // Güncellenme tarihi
}
```

## Subject (Ders)
```typescript
interface Subject {
  id: string;                    // UUID
  name: string;                  // Ders adı (örn: "Matematik")
  description: string;           // Ders açıklaması
  orderIndex: number;            // Sıralama indeksi
  isActive: boolean;            // Aktif/Pasif durumu
  createdAt: string;            // Oluşturulma tarihi
  updatedAt: string;            // Güncellenme tarihi
}
```

## Topic (Konu)
```typescript
interface Topic {
  id: string;                    // UUID
  name: string;                  // Konu adı
  description: string;           // Konu açıklaması
  subjectId: string;            // Bağlı olduğu dersin ID'si
  classId: string;              // Bağlı olduğu sınıfın ID'si
  parentId?: string;            // Üst konunun ID'si (alt konular için)
  orderIndex: number;            // Sıralama indeksi
  isActive: boolean;            // Aktif/Pasif durumu
  createdAt: string;            // Oluşturulma tarihi
  updatedAt: string;            // Güncellenme tarihi
}
```

## Question (Soru)
```typescript
interface Question {
  id: string;                    // UUID
  topicId: string;              // Bağlı olduğu konunun ID'si
  difficultyLevel: 'easy' | 'medium' | 'hard';  // Zorluk seviyesi
  questionText?: string;         // Soru metni
  questionImageUrl?: string;     // Soru görseli URL'i
  questionPdfUrl?: string;       // Soru PDF URL'i
  solutionText?: string;         // Çözüm metni
  solutionImageUrl?: string;     // Çözüm görseli URL'i
  solutionPdfUrl?: string;       // Çözüm PDF URL'i
  correctAnswers: any[];         // Doğru cevaplar (JSON)
  explanation?: string;          // Açıklama
  keywords: string[];            // Anahtar kelimeler
  estimatedTime?: number;        // Tahmini çözüm süresi (saniye)
  isActive: boolean;            // Aktif/Pasif durumu
  createdAt: string;            // Oluşturulma tarihi
  updatedAt: string;            // Güncellenme tarihi
}
```

## User (Kullanıcı)
```typescript
interface User {
  id: string;                    // UUID
  phone: string;                 // Telefon numarası
  firstName: string;             // Ad
  lastName: string;              // Soyad
  classId?: string;             // Bağlı olduğu sınıfın ID'si
  gender: 'male' | 'female';     // Cinsiyet
  isVerified: boolean;          // Doğrulanmış mı?
  isActive: boolean;            // Aktif/Pasif durumu
  lastLogin?: string;           // Son giriş tarihi
  createdAt: string;            // Oluşturulma tarihi
  updatedAt: string;            // Güncellenme tarihi
}
```

## WeeklyProgram (Haftalık Program)
```typescript
interface WeeklyProgram {
  id: string;                    // UUID
  userId: string;               // Bağlı olduğu kullanıcının ID'si
  startDate: string;            // Başlangıç tarihi (YYYY-MM-DD)
  endDate: string;              // Bitiş tarihi (YYYY-MM-DD)
  title: string;                // Program başlığı
  description?: string;         // Program açıklaması
  isActive: boolean;            // Aktif/Pasif durumu
  createdAt: string;            // Oluşturulma tarihi
  updatedAt: string;            // Güncellenme tarihi
}
```

## ProgramTask (Program Görevi)
```typescript
interface ProgramTask {
  id: string;                    // UUID
  weeklyProgramId: string;      // Bağlı olduğu programın ID'si
  title: string;                // Görev başlığı
  description: string;          // Görev açıklaması
  taskDate: string;             // Görev tarihi (YYYY-MM-DD)
  isCompleted: boolean;         // Tamamlandı mı?
  completedAt?: string;         // Tamamlanma tarihi
  topicId?: string;            // Bağlı olduğu konunun ID'si
  createdAt: string;            // Oluşturulma tarihi
  updatedAt: string;            // Güncellenme tarihi
}
```

## Goal (Hedef)
```typescript
interface Goal {
  id: string;                    // UUID
  userId: string;               // Bağlı olduğu kullanıcının ID'si
  title: string;                // Hedef başlığı
  description: string;          // Hedef açıklaması
  targetDate?: string;          // Hedef tarihi (YYYY-MM-DD)
  isCompleted: boolean;         // Tamamlandı mı?
  completedAt?: string;         // Tamamlanma tarihi
  createdAt: string;            // Oluşturulma tarihi
  updatedAt: string;            // Güncellenme tarihi
}
```

## UserTopicProgress (Kullanıcı Konu İlerlemesi)
```typescript
interface UserTopicProgress {
  userId: string;               // Kullanıcı ID'si
  topicId: string;              // Konu ID'si
  status: 'not_started' | 'in_progress' | 'learned' | 'needs_review';  // İlerleme durumu
  updatedAt: string;            // Güncellenme tarihi
}
``` 