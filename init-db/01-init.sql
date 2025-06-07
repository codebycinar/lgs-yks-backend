-- LGS Backend Database Schema
-- Veritabanı tabloları ve initial data

-- Sınavlar tablosu
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    exam_date DATE,
    target_class_level INTEGER,
    preparation_class_level INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sınıflar tablosu
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    exam_id INTEGER REFERENCES exams(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dersler tablosu
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Konular tablosu
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    subject_id INTEGER REFERENCES subjects(id),
    class_id INTEGER REFERENCES classes(id),
    parent_id INTEGER REFERENCES topics(id),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    class_id INTEGER REFERENCES classes(id),
    gender VARCHAR(10),
    sms_code VARCHAR(6),
    sms_code_expires_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kullanıcı ilerleme takibi
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    topic_id INTEGER REFERENCES topics(id),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id)
);

-- Hedefler tablosu
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programlar tablosu
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    week_start_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Program görevleri
CREATE TABLE IF NOT EXISTS program_tasks (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sorular tablosu
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id),
    question_text TEXT NOT NULL,
    question_image VARCHAR(255),
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    explanation TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Soru seçenekleri
CREATE TABLE IF NOT EXISTS question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id),
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    option_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_class ON topics(class_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_user ON programs(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);

-- Initial data ekleme
INSERT INTO exams (name, description, target_class_level, preparation_class_level) VALUES
('LGS', 'Liselere Geçiş Sınavı', 8, 8),
('YKS', 'Yükseköğretim Kurumları Sınavı', 12, 12)
ON CONFLICT DO NOTHING;

INSERT INTO classes (name, level, exam_id) VALUES
('5. Sınıf', 5, (SELECT id FROM exams WHERE name = 'LGS')),
('6. Sınıf', 6, (SELECT id FROM exams WHERE name = 'LGS')),
('7. Sınıf', 7, (SELECT id FROM exams WHERE name = 'LGS')),
('8. Sınıf', 8, (SELECT id FROM exams WHERE name = 'LGS'))
ON CONFLICT DO NOTHING;

INSERT INTO subjects (name, description, order_index) VALUES
('Matematik', 'Matematik dersi', 1),
('Türkçe', 'Türkçe dersi', 2),
('Fen Bilimleri', 'Fen Bilimleri dersi', 3),
('Sosyal Bilgiler', 'Sosyal Bilgiler dersi', 4),
('İngilizce', 'İngilizce dersi', 5),
('Din Kültürü ve Ahlak Bilgisi', 'DKAB dersi', 6)
ON CONFLICT DO NOTHING;

-- Matematik konuları (8. sınıf)
INSERT INTO topics (name, subject_id, class_id, order_index) VALUES
('Çarpanlar ve Katlar', 
 (SELECT id FROM subjects WHERE name = 'Matematik'), 
 (SELECT id FROM classes WHERE name = '8. Sınıf'), 1),
('Üslü İfadeler', 
 (SELECT id FROM subjects WHERE name = 'Matematik'), 
 (SELECT id FROM classes WHERE name = '8. Sınıf'), 2),
('Kareköklü İfadeler', 
 (SELECT id FROM subjects WHERE name = 'Matematik'), 
 (SELECT id FROM classes WHERE name = '8. Sınıf'), 3),
('Veri Analizi', 
 (SELECT id FROM subjects WHERE name = 'Matematik'), 
 (SELECT id FROM classes WHERE name = '8. Sınıf'), 4)
ON CONFLICT DO NOTHING;

-- Türkçe konuları (8. sınıf)
INSERT INTO topics (name, subject_id, class_id, order_index) VALUES
('Anlatım Biçimleri', 
 (SELECT id FROM subjects WHERE name = 'Türkçe'), 
 (SELECT id FROM classes WHERE name = '8. Sınıf'), 1),
('Paragraf', 
 (SELECT id FROM subjects WHERE name = 'Türkçe'), 
 (SELECT id FROM classes WHERE name = '8. Sınıf'), 2),
('Sözcükte Anlam', 
 (SELECT id FROM subjects WHERE name = 'Türkçe'), 
 (SELECT id FROM classes WHERE name = '8. Sınıf'), 3)
ON CONFLICT DO NOTHING;

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers oluştur
DROP TRIGGER IF EXISTS update_exams_updated_at ON exams;
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_program_tasks_updated_at ON program_tasks;
CREATE TRIGGER update_program_tasks_updated_at BEFORE UPDATE ON program_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();