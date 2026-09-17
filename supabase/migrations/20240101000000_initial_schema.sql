-- Migration 1: Initial Schema

CREATE TABLE IF NOT EXISTS sales_channels (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  image_url TEXT,
  cost_price DECIMAL(10, 2) CHECK (cost_price >= 0),
  sales_channel_id BIGINT REFERENCES sales_channels(id),
  selling_price DECIMAL(10, 2) CHECK (selling_price >= 0),
  notes TEXT,
  sale_date DATE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_sale_date ON products(sale_date);
CREATE INDEX IF NOT EXISTS idx_products_sales_channel ON products(sales_channel_id);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON products;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read products" ON products;
CREATE POLICY "Allow read products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert products" ON products;
CREATE POLICY "Allow insert products" ON products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update products" ON products;
CREATE POLICY "Allow update products" ON products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete products" ON products;
CREATE POLICY "Allow delete products" ON products FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow read channels" ON sales_channels;
CREATE POLICY "Allow read channels" ON sales_channels FOR SELECT USING (true);

-- รายงานรายเดือน: นับเฉพาะรายการที่ "ขายแล้ว" (มี sale_date)
-- ไม่กรอง deleted_at ออก เพื่อให้บัญชีย้อนหลังไม่เพี้ยนเมื่อมีการ soft delete
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  to_char(sale_date, 'YYYY-MM') AS month,
  COUNT(*) AS quantity,
  SUM(COALESCE(cost_price, 0)) AS total_cost,
  SUM(COALESCE(selling_price, 0)) AS total_sales,
  SUM(COALESCE(selling_price, 0) - COALESCE(cost_price, 0)) AS profit
FROM products
WHERE sale_date IS NOT NULL
GROUP BY to_char(sale_date, 'YYYY-MM')
ORDER BY month DESC;
