// ฟังก์ชันจัดรูปแบบที่ใช้ร่วมกันทุกหน้าจอ (ใหม่ใน v1.1)

export const has = (v) => v != null && v !== "";

// "ขายแล้ว" = มีวันที่ขาย (นิยามเดียวกับ lib/supabase.js และ view monthly_summary)
export const isSold = (p) => has(p.sale_date);

export const fmt = (n) =>
  Number(n).toLocaleString("th-TH", { maximumFractionDigits: 2 });

export const baht = (n) => "฿" + fmt(n);

export const MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
export const MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

// "2026-09" -> "ก.ย. 69"
export const thMonthShort = (key) => {
  const [y, m] = key.split("-");
  return `${MONTHS_SHORT[+m - 1]} ${(+y + 543) % 100}`;
};

// "2026-09" -> "กันยายน 2569"
export const thMonthFull = (key) => {
  const [y, m] = key.split("-");
  return `${MONTHS_FULL[+m - 1]} ${+y + 543}`;
};

// "2026-09-03" -> "3 ก.ย. 69" (แยกสตริงเอง ไม่ใช้ new Date เพื่อกันวันเพี้ยนจาก timezone)
export const thDate = (ymd) => {
  const [y, m, d] = ymd.slice(0, 10).split("-");
  return `${+d} ${MONTHS_SHORT[+m - 1]} ${(+y + 543) % 100}`;
};
