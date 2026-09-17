-- ข้อมูลเริ่มต้นสำหรับ Supabase local dev หรือ staging
INSERT INTO sales_channels (name) VALUES
  ('Facebook'),
  ('Shopee'),
  ('Lazada'),
  ('TikTok Shop'),
  ('Instagram'),
  ('LINE Shopping'),
  ('หน้าร้าน'),
  ('อื่น ๆ')
ON CONFLICT DO NOTHING;
