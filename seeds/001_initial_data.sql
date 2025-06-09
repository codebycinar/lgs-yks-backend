-- Initial seed data for LGS Education Platform

-- Insert Exams
INSERT INTO exams (id, name, exam_date, target_class_levels, prep_class_levels, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'LGS 2025', '2025-06-15', ARRAY[8], ARRAY[6,7,8], 'Liselere Geçiş Sınavı 2025'),
('550e8400-e29b-41d4-a716-446655440002', 'YKS 2025', '2025-06-14', ARRAY[12], ARRAY[9,10,11,12], 'Yükseköğretim Kurumları Sınavı 2025');

-- Insert Classes
INSERT INTO classes (id, name, min_class_level, max_class_level, exam_id) VALUES
('550e8400-e29b-41d4-a716-446655440011', '6. Sınıf', 1, 6, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440012', '7. Sınıf', 7, 7, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440013', '8. Sınıf', 8, 8, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440014', '9. Sınıf', 9, 9, '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440015', '10. Sınıf', 10, 10, '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440016', '11. Sınıf', 11, 11, '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440017', '12. Sınıf', 12, 12, '550e8400-e29b-41d4-a716-446655440002');

-- Insert Subjects
INSERT INTO subjects (id, name, order_index, description) VALUES
('550e8400-e29b-41d4-a716-446655440021', 'Matematik', 1, 'Matematik dersi'),
('550e8400-e29b-41d4-a716-446655440022', 'Türkçe', 2, 'Türkçe dersi'),
('550e8400-e29b-41d4-a716-446655440023', 'Fen Bilimleri', 3, 'Fen Bilimleri dersi'),
('550e8400-e29b-41d4-a716-446655440024', 'Sosyal Bilgiler', 4, 'Sosyal Bilgiler dersi'),
('550e8400-e29b-41d4-a716-446655440025', 'İngilizce', 5, 'İngilizce dersi'),
('550e8400-e29b-41d4-a716-446655440026', 'Din Kültürü ve Ahlak Bilgisi', 6, 'Din Kültürü ve Ahlak Bilgisi dersi'),
('550e8400-e29b-41d4-a716-446655440027', 'Fizik', 7, 'Fizik dersi'),
('550e8400-e29b-41d4-a716-446655440028', 'Kimya', 8, 'Kimya dersi'),
('550e8400-e29b-41d4-a716-446655440029', 'Biyoloji', 9, 'Biyoloji dersi'),
('550e8400-e29b-41d4-a716-446655440030', 'Tarih', 10, 'Tarih dersi'),
('550e8400-e29b-41d4-a716-446655440031', 'Coğrafya', 11, 'Coğrafya dersi'),
('550e8400-e29b-41d4-a716-446655440032', 'Felsefe', 12, 'Felsefe dersi');

-- Insert Topics for 8. Sınıf Matematik (LGS)
INSERT INTO topics (id, name, subject_id, class_id, order_index, description) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'Çarpanlar ve Katlar', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 1, 'Çarpanlar ve Katlar konusu'),
('550e8400-e29b-41d4-a716-446655440102', 'Üslü İfadeler', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 2, 'Üslü İfadeler konusu'),
('550e8400-e29b-41d4-a716-446655440103', 'Kareköklü İfadeler', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 3, 'Kareköklü İfadeler konusu'),
('550e8400-e29b-41d4-a716-446655440104', 'Veri Analizi', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 4, 'Veri Analizi konusu'),
('550e8400-e29b-41d4-a716-446655440105', 'Basit Eşitsizlikler', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 5, 'Basit Eşitsizlikler konusu'),
('550e8400-e29b-41d4-a716-446655440106', 'Denklem Çözme', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 6, 'Denklem Çözme konusu'),
('550e8400-e29b-41d4-a716-446655440107', 'Üçgenler', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 7, 'Üçgenler konusu'),
('550e8400-e29b-41d4-a716-446655440108', 'Dönüşüm Geometrisi', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 8, 'Dönüşüm Geometrisi konusu'),
('550e8400-e29b-41d4-a716-446655440109', 'Prizmalar', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 9, 'Prizmalar konusu'),
('550e8400-e29b-41d4-a716-446655440110', 'Olasılık', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 10, 'Olasılık konusu');

-- Insert Sub-topics for Denklem Çözme
INSERT INTO topics (id, name, subject_id, class_id, parent_id, order_index, description) VALUES
('550e8400-e29b-41d4-a716-446655440201', 'Birinci Dereceden Denklemler', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440106', 1, 'Birinci Dereceden Denklemler alt konusu'),
('550e8400-e29b-41d4-a716-446655440202', 'Denklem Kurma', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440106', 2, 'Denklem Kurma alt konusu'),
('550e8400-e29b-41d4-a716-446655440203', 'Değişken İçeren Problemler', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440106', 3, 'Değişken İçeren Problemler alt konusu');

-- Insert Topics for 8. Sınıf Türkçe (LGS)
INSERT INTO topics (id, name, subject_id, class_id, order_index, description) VALUES
('550e8400-e29b-41d4-a716-446655440301', 'Cümlede Anlam', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', 1, 'Cümlede Anlam konusu'),
('550e8400-e29b-41d4-a716-446655440302', 'Paragrafta Anlam', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', 2, 'Paragrafta Anlam konusu'),
('550e8400-e29b-41d4-a716-446655440303', 'Metinde Anlam', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', 3, 'Metinde Anlam konusu'),
('550e8400-e29b-41d4-a716-446655440304', 'Sözcükte Anlam', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', 4, 'Sözcükte Anlam konusu'),
('550e8400-e29b-41d4-a716-446655440305', 'Yazım Kuralları', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', 5, 'Yazım Kuralları konusu'),
('550e8400-e29b-41d4-a716-446655440306', 'Noktalama İşaretleri', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', 6, 'Noktalama İşaretleri konusu');

-- Insert Topics for 8. Sınıf Fen Bilimleri (LGS)
INSERT INTO topics (id, name, subject_id, class_id, order_index, description) VALUES
('550e8400-e29b-41d4-a716-446655440401', 'Basınç', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 1, 'Basınç konusu'),
('550e8400-e29b-41d4-a716-446655440402', 'Mevsimler ve İklim', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 2, 'Mevsimler ve İklim konusu'),
('550e8400-e29b-41d4-a716-446655440403', 'Hücre Bölünmeleri', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 3, 'Hücre Bölünmeleri konusu'),
('550e8400-e29b-41d4-a716-446655440404', 'Kalıtım', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 4, 'Kalıtım konusu'),
('550e8400-e29b-41d4-a716-446655440405', 'Madde ve Endüstri', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 5, 'Madde ve Endüstri konusu'),
('550e8400-e29b-41d4-a716-446655440406', 'Asit ve Bazlar', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 6, 'Asit ve Bazlar konusu');

-- Insert some 12. Sınıf topics for YKS
INSERT INTO topics (id, name, subject_id, class_id, order_index, description) VALUES
('550e8400-e29b-41d4-a716-446655440501', 'Limit ve Süreklilik', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440017', 1, 'Limit ve Süreklilik konusu'),
('550e8400-e29b-41d4-a716-446655440502', 'Türev', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440017', 2, 'Türev konusu'),
('550e8400-e29b-41d4-a716-446655440503', 'İntegral', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440017', 3, 'İntegral konusu'),
('550e8400-e29b-41d4-a716-446655440504', 'Olasılık', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440017', 4, 'Olasılık konusu');