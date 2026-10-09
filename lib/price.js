// กฎการอ่านและแสดงผลช่องราคา (ราคาต้นทุน / ราคาขาย) — ใหม่ใน v1.2
//
// รับได้:   500, 1250.50, 1,250, .5, 5.  และช่องว่างหน้า/หลัง (ตัดทิ้ง)
// ไม่รับ:   ตัวอักษร/สัญลักษณ์อื่น, ค่าติดลบ, ทศนิยมเกิน 2 ตำแหน่ง, เกินที่ฐานข้อมูลรองรับ
// ปล่อยว่าง: ได้ (ทุกช่องในฟอร์มไม่บังคับ)

// คอลัมน์ในฐานข้อมูลเป็น DECIMAL(10, 2) จึงเก็บได้สูงสุด 99,999,999.99
export const MAX_PRICE = 99999999.99;

/**
 * แปลงข้อความที่ผู้ใช้พิมพ์เป็นตัวเลข
 * คืนค่า { value: number | null, error: string }
 *   - ช่องว่าง          -> { value: null, error: "" }
 *   - ถูกต้อง           -> { value: 1250.5, error: "" }
 *   - ไม่ถูกต้อง        -> { value: null, error: "ข้อความแจ้งผู้ใช้" }
 */
export function parsePrice(input) {
  const raw = String(input ?? "").trim();
  if (raw === "") return { value: null, error: "" };

  const text = raw.replace(/,/g, "");

  if (text.startsWith("-")) {
    return { value: null, error: "ราคาต้องไม่ติดลบ" };
  }
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) {
    return { value: null, error: "กรอกได้เฉพาะตัวเลข เช่น 1250 หรือ 1,250.50" };
  }
  const decimals = text.includes(".") ? text.split(".")[1].length : 0;
  if (decimals > 2) {
    return { value: null, error: "ทศนิยมได้ไม่เกิน 2 ตำแหน่ง" };
  }

  const value = Number(text);
  if (value > MAX_PRICE) {
    return { value: null, error: "ราคาสูงเกินกว่าที่ระบบรองรับ (สูงสุด 99,999,999.99)" };
  }
  return { value, error: "" };
}

/**
 * จัดรูปแบบตัวเลขให้อ่านง่ายในช่องกรอก
 *   1250 -> "1,250"   1250.5 -> "1,250.50"   ("180.00" จากฐานข้อมูล -> "180")
 * จำนวนเต็มไม่แสดงทศนิยม ถ้ามีเศษสตางค์แสดงครบ 2 ตำแหน่งเสมอ
 */
export function formatPrice(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  const digits = Number.isInteger(n) ? 0 : 2;
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: 2 });
}
