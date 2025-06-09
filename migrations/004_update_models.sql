-- Migration 004: Update models according to requirements
-- Update subjects table, simplify questions, add question_answers table

-- 1. Update subjects table to add class level constraints
ALTER TABLE subjects ADD COLUMN min_class_level INTEGER DEFAULT 1;
ALTER TABLE subjects ADD COLUMN max_class_level INTEGER DEFAULT 12;

-- 2. Drop question_contents table (not needed)
DROP TABLE IF EXISTS question_contents CASCADE;

-- 3. Simplify questions table
-- Drop correct_answers JSONB column and add simpler fields
ALTER TABLE questions DROP COLUMN IF EXISTS correct_answers;
ALTER TABLE questions DROP COLUMN IF EXISTS keywords;
ALTER TABLE questions ADD COLUMN has_multiple_correct BOOLEAN DEFAULT false;

-- 4. Create question_answers table for A,B,C,D options
CREATE TABLE question_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_letter VARCHAR(1) NOT NULL CHECK (option_letter IN ('A', 'B', 'C', 'D', 'E')),
    answer_text TEXT,
    answer_image_url TEXT,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, option_letter)
);

-- Add indexes for question_answers
CREATE INDEX idx_question_answers_question_id ON question_answers(question_id);
CREATE INDEX idx_question_answers_is_correct ON question_answers(question_id, is_correct);

-- Add trigger for question_answers updated_at
CREATE TRIGGER update_question_answers_updated_at 
BEFORE UPDATE ON question_answers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Update some existing data
UPDATE subjects SET min_class_level = 6, max_class_level = 12 WHERE name LIKE '%Matematik%';
UPDATE subjects SET min_class_level = 6, max_class_level = 12 WHERE name LIKE '%Türkçe%';
UPDATE subjects SET min_class_level = 9, max_class_level = 12 WHERE name LIKE '%Fizik%';
UPDATE subjects SET min_class_level = 9, max_class_level = 12 WHERE name LIKE '%Kimya%';
UPDATE subjects SET min_class_level = 10, max_class_level = 12 WHERE name LIKE '%Biyoloji%';
UPDATE subjects SET min_class_level = 6, max_class_level = 8 WHERE name LIKE '%Sosyal%';
UPDATE subjects SET min_class_level = 6, max_class_level = 8 WHERE name LIKE '%Fen%';