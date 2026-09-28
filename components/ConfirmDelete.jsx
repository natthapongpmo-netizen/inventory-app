import React from "react";
import { has, isSold, thMonthFull } from "../lib/format";

/**
 * กล่องยืนยันการลบ — แยกเป็น 2 แบบตามสถานะ (logic เดิม ไม่เปลี่ยน)
 *  - ยังไม่ขาย: ลบถาวร (กล่องสีแดง)
 *  - ขายแล้ว: archive (กล่องสีส้ม) ยอดในรายงานไม่เปลี่ยน
 */
export default function ConfirmDelete({ product, deleting, onCancel, onConfirm }) {
  if (!product) return null;

  const sold = isSold(product);
  const name = has(product.notes) ? `"${product.notes}"` : "รายการนี้";

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && !deleting && onCancel()}>
      <div className="box" role="alertdialog" aria-modal="true">
        {sold ? (
          <>
            <div className="icon warn">!</div>
            <h3>ลบรายการที่ขายแล้ว?</h3>
            <p>{name} ถูกนับในรายงานยอดขายเดือน {thMonthFull(product.sale_date.slice(0, 7))} แล้ว</p>
            <div className="impact">
              รายการจะหายจากหน้าจอ แต่<strong>ตัวเลขในรายงานรายเดือนจะไม่เปลี่ยน</strong> —
              ระบบเก็บข้อมูลการขายนี้ไว้เพื่อความถูกต้องของบัญชี
            </div>
          </>
        ) : (
          <>
            <div className="icon danger">×</div>
            <h3>ลบรายการนี้?</h3>
            <p>{name} จะถูกลบถาวร และไม่สามารถกู้คืนได้</p>
          </>
        )}
        <div className="foot">
          <button className="btn-cancel" onClick={onCancel} disabled={deleting}>ยกเลิก</button>
          <button className={sold ? "btn-warn" : "btn-danger"} onClick={onConfirm} disabled={deleting}>
            {deleting ? "กำลังลบ..." : sold ? "ลบออกจากหน้าจอ" : "ลบรายการ"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: var(--overlay); z-index: 1100;
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .box {
          background: var(--surface); border-radius: 16px; width: 100%; max-width: 400px;
          padding: 24px; text-align: center; box-shadow: var(--shadow); animation: pop 0.2s ease;
        }
        .icon {
          width: 50px; height: 50px; border-radius: 14px; margin: 0 auto 14px;
          display: grid; place-items: center; font-size: 24px; font-weight: 700;
        }
        .icon.danger { background: var(--cost-tint); color: var(--cost); }
        .icon.warn { background: var(--amber-tint); color: var(--amber); }
        h3 { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
        p { font-size: 14px; color: var(--ink-soft); line-height: 1.55; }
        .impact {
          background: var(--surface-2); border-radius: 9px; padding: 10px 12px;
          font-size: 13px; margin-top: 10px; text-align: left; line-height: 1.55;
        }
        .foot { display: flex; gap: 10px; margin-top: 18px; }
        .btn-cancel { flex: 1; border: 1px solid var(--line); border-radius: 10px; padding: 12px; font-weight: 600; font-size: 14.5px; }
        .btn-cancel:hover { background: var(--surface-2); }
        .btn-danger, .btn-warn { flex: 1.4; border-radius: 10px; padding: 12px; font-weight: 600; font-size: 14.5px; color: #fff; }
        .btn-danger { background: #b64438; }
        .btn-warn { background: #a15b12; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
