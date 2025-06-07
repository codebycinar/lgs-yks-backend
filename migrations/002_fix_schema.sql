-- Migration 002: Fix schema mismatches and add questions table
-- This migration fixes the schema to match the application code

-- Add questions table if not exists
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    difficulty_level VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    question_text TEXT,
    question_image_url TEXT,
    question_pdf_url TEXT,
    solution_text TEXT,
    solution_image_url TEXT,
    solution_pdf_url TEXT,
    correct_answers JSONB NOT NULL DEFAULT '[]',
    explanation TEXT,
    keywords JSONB DEFAULT '[]',
    estimated_time INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for questions table if not exists
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty_level ON questions(difficulty_level);

-- Add trigger for questions table
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();