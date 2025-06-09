-- Sample questions and answers for LGS and YKS

-- LGS Matematik Soruları
INSERT INTO questions (id, topic_id, question_text, solution_text, explanation, difficulty_level, estimated_time, has_multiple_correct, is_active) VALUES
-- Çarpanlar ve Katlar
('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440101',
 '24 sayısının pozitif tam sayı çarpanlarının sayısı kaçtır?',
 '24 sayısının asal çarpanlarına ayıralım: 24 = 2³ × 3¹\nPozitif tam sayı çarpanlarının sayısı = (3+1) × (1+1) = 4 × 2 = 8',
 'Bir sayının pozitif tam sayı çarpanlarının sayısını bulmak için, sayıyı asal çarpanlarına ayırıp, üslerin bir fazlasını çarparız.',
 3, 120, false, true),

-- Üslü İfadeler
('550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440102',
 '2⁵ × 2³ işleminin sonucu kaçtır?',
 '2⁵ × 2³ = 2⁵⁺³ = 2⁸ = 256',
 'Üslü sayılarda çarpma işleminde tabanlar aynı ise üsler toplanır.',
 2, 60, false, true),

-- Kareköklü İfadeler
('550e8400-e29b-41d4-a716-446655440703', '550e8400-e29b-41d4-a716-446655440103',
 '√48 + √12 işleminin sonucu kaçtır?',
 '√48 = √(16×3) = 4√3\n√12 = √(4×3) = 2√3\n4√3 + 2√3 = 6√3',
 'Kareköklü ifadelerde toplama yaparken, kök içleri aynı olan terimlerin katsayıları toplanır.',
 3, 120, false, true),

-- YKS Matematik Soruları
('550e8400-e29b-41d4-a716-446655440704', '550e8400-e29b-41d4-a716-446655440501',
 'lim(x→2) (x²-4)/(x-2) limitinin değeri kaçtır?',
 'lim(x→2) (x²-4)/(x-2) = lim(x→2) (x-2)(x+2)/(x-2) = lim(x→2) (x+2) = 4',
 'Belirsizlik durumunda pay ve paydayı çarpanlarına ayırıp sadeleştirme yapılır.',
 4, 180, false, true),

('550e8400-e29b-41d4-a716-446655440705', '550e8400-e29b-41d4-a716-446655440502',
 'f(x) = x³ + 2x² - 5x + 1 fonksiyonunun x = 1 noktasındaki türevi kaçtır?',
 'f''(x) = 3x² + 4x - 5\nf''(1) = 3(1)² + 4(1) - 5 = 3 + 4 - 5 = 2',
 'Türev alma kuralları kullanılarak fonksiyonun türevi alınır ve istenen noktadaki değeri hesaplanır.',
 4, 180, false, true);

-- Soruların yanıtları
INSERT INTO question_answers (question_id, option_letter, answer_text, is_correct, order_index) VALUES
-- 24 sayısının çarpanları sorusu
('550e8400-e29b-41d4-a716-446655440701', 'A', '6', false, 1),
('550e8400-e29b-41d4-a716-446655440701', 'B', '7', false, 2),
('550e8400-e29b-41d4-a716-446655440701', 'C', '8', true, 3),
('550e8400-e29b-41d4-a716-446655440701', 'D', '9', false, 4),

-- Üslü ifadeler sorusu
('550e8400-e29b-41d4-a716-446655440702', 'A', '128', false, 1),
('550e8400-e29b-41d4-a716-446655440702', 'B', '256', true, 2),
('550e8400-e29b-41d4-a716-446655440702', 'C', '512', false, 3),
('550e8400-e29b-41d4-a716-446655440702', 'D', '1024', false, 4),

-- Kareköklü ifadeler sorusu
('550e8400-e29b-41d4-a716-446655440703', 'A', '5√3', false, 1),
('550e8400-e29b-41d4-a716-446655440703', 'B', '6√3', true, 2),
('550e8400-e29b-41d4-a716-446655440703', 'C', '7√3', false, 3),
('550e8400-e29b-41d4-a716-446655440703', 'D', '8√3', false, 4),

-- Limit sorusu
('550e8400-e29b-41d4-a716-446655440704', 'A', '2', false, 1),
('550e8400-e29b-41d4-a716-446655440704', 'B', '3', false, 2),
('550e8400-e29b-41d4-a716-446655440704', 'C', '4', true, 3),
('550e8400-e29b-41d4-a716-446655440704', 'D', '5', false, 4),

-- Türev sorusu
('550e8400-e29b-41d4-a716-446655440705', 'A', '1', false, 1),
('550e8400-e29b-41d4-a716-446655440705', 'B', '2', true, 2),
('550e8400-e29b-41d4-a716-446655440705', 'C', '3', false, 3),
('550e8400-e29b-41d4-a716-446655440705', 'D', '4', false, 4); 