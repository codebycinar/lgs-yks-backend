-- Migration 005: Update schema for subjects and questions
-- 1. Add min_class_level and max_class_level to subjects table
-- 2. Remove question_contents table
-- 3. Create question_answers table  
-- 4. Remove correct_answers field from questions table

-- Add class level constraints to subjects
ALTER TABLE subjects 
ADD COLUMN min_class_level INTEGER DEFAULT 1,
ADD COLUMN max_class_level INTEGER DEFAULT 12;

-- Create question_answers table for storing question options
CREATE TABLE question_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    answer_image_url TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Remove correct_answers column from questions table
ALTER TABLE questions DROP COLUMN IF EXISTS correct_answers;

-- Drop question_contents table (legacy)
DROP TABLE IF EXISTS question_contents;

-- Create indexes for better performance
CREATE INDEX idx_question_answers_question_id ON question_answers(question_id);
CREATE INDEX idx_question_answers_is_correct ON question_answers(is_correct);
CREATE INDEX idx_subjects_class_levels ON subjects(min_class_level, max_class_level);

-- Create trigger for question_answers updated_at
CREATE TRIGGER update_question_answers_updated_at 
BEFORE UPDATE ON question_answers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing subjects with default class levels (can be modified later)
UPDATE subjects SET 
    min_class_level = CASE 
        WHEN name ILIKE '%fizik%' OR name ILIKE '%kimya%' OR name ILIKE '%biyoloji%' THEN 9
        WHEN name ILIKE '%geometri%' THEN 7
        ELSE 6
    END,
    max_class_level = 12
WHERE min_class_level IS NULL OR max_class_level IS NULL;