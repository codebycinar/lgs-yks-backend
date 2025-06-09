-- Migration 003: Recreate questions table with proper schema
-- Drop and recreate questions table to match application requirements

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First drop the existing questions table if it exists
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;

-- Create the new questions table with proper schema
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
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

-- Add indexes
CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_difficulty_level ON questions(difficulty_level);

-- Add trigger for updated_at
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();