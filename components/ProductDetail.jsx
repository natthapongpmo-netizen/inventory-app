import React, { useEffect } from "react";
import { has, isSold, fmt, thDate } from "../lib/format";

/**
 * แผงรายละเอียดสินค้า — เปิดเมื่อแตะ thumbnail บนมือถือ
 * บนมือถือแสดงเป็น bottom sheet เลื่อนขึ้นจากด้านล่าง
 */
export default function ProductDetail({ product, isMobile, onClose, onEdit, onDelete }) {
  useEffect(() => {
    if (!product) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  const p = product;
  const sold = isSold(p);
  const showProfit = has(p.cost_price) && has(p.selling_price);
  const profit = showProfit ? Number(p.selling_price) - Number(p.cost_price) : 0;

  return (
    <div
      className={`overlay ${isMobile ? "sheet" : ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="รายละเอียดสินค้า">
        <div className="photo">
          {p.image_url ? (
            <img src={p.image_url} alt="" />
          ) : (
            <div className="ph">ไม่มีรูปสินค้า</div>
          )}
          {isMobile && <span className="grab" />}
          <button className="close" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="content">
          <div className="tags">
            <span className={`tag ${sold ? "ok" : "wait"}`}>{sold ? "ขายแล้ว" : "รอขาย"}</span>
            {p.sales_channels?.name ? (
              <span className="tag ch">{p.sales_channels.name}</span>
            ) : (
              <span className="tag muted">ยังไม่ระบุช่องทาง</span>
            )}
          </div>
          <div className={`title ${has(p.notes) ? "" : "faint"}`}>
            {has(p.notes) ? p.notes : "ยังไม่ระบุรายละเอียด"}
          </div>
          <div className={`date ${sold ? "" : "pending"}`}>
            {sold ? `ขายเมื่อ ${thDate(p.sale_date)}` : "ยังไม่ระบุวันที่ขาย"}
          </div>

          <div className="rows">
            <div className="row">
              <span className="lab">ต้นทุน</span>
              <span className={`num ${has(p.cost_price) ? "cost" : "none"}`}>
                {has(p.cost_price) ? fmt(p.cost_price) : "—"}
              </span>
            </div>
            <div className="row">
              <span className="lab">ราคาขาย</span>
              <span className={`num ${has(p.selling_price) ? "" : "none"}`}>
                {has(p.selling_price) ? fmt(p.selling_price) : "—"}
              </span>
            </div>
            <div className="row last">
              <span className="lab">กำไร</span>
              {showProfit ? (
                <span className={`badge ${profit < 0 ? "neg" : ""}`}>{fmt(profit)}</span>
              ) : (
                <span className="badge wait">รอปิดการขาย</span>
              )}
            </div>
          </div>
        </div>

        <div className="foot">
          <button className="btn-del" onClick={() => onDelete(p)}>ลบ</button>
          <button className="btn-edit" onClick={() => onEdit(p)}>แก้ไข</button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: var(--overlay); z-index: 1000;
          display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto;
        }
        .modal {
          background: var(--surface); border-radius: 16px; width: 100%; max-width: 440px;
          overflow: hidden; box-shadow: var(--shadow); animation: pop 0.2s ease;
        }
        .overlay.sheet { align-items: flex-end; padding: 0; }
        .overlay.sheet .modal {
          max-width: none; border-radius: 18px 18px 0 0; max-height: 92vh; overflow-y: auto;
          animation: sheetUp 0.22s ease; padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .photo { position: relative; aspect-ratio: 4/3; background: var(--surface-2); }
        .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ph { width: 100%; height: 100%; display: grid; place-items: center; color: var(--ink-faint); font-size: 14px; }
        .grab {
          position: absolute; top: 7px; left: 50%; transform: translateX(-50%);
          width: 38px; height: 4px; border-radius: 4px; background: rgba(255, 255, 255, 0.85);
        }
        .close {
          position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%;
          background: rgba(0, 0, 0, 0.55); color: #fff; display: grid; place-items: center;
        }
        .close svg { width: 18px; height: 18px; }
        .content { padding: 16px 18px 6px; }
        .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .tag { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
        .tag.ok { background: var(--pos-tint); color: var(--pos); }
        .tag.wait { background: var(--amber-tint); color: var(--amber); }
        .tag.ch { background: var(--brand-tint); color: var(--brand-text); }
        .tag.muted { background: var(--surface-2); color: var(--ink-faint); }
        .title { font-size: 17px; font-weight: 600; }
        .title.faint { color: var(--ink-faint); font-weight: 500; }
        .date { font-size: 13px; color: var(--ink-soft); }
        .date.pending { color: var(--amber); }
        .rows { margin-top: 12px; border-top: 1px solid var(--line); }
        .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14.5px; }
        .row.last { border-bottom: 0; }
        .lab { color: var(--ink-soft); }
        .num { font-weight: 500; font-variant-numeric: tabular-nums; }
        .num.cost { color: var(--cost); }
        .num.none { color: var(--ink-faint); font-weight: 400; }
        .badge { font-weight: 700; font-size: 15px; padding: 3px 10px; border-radius: 8px; background: var(--pos-tint); color: var(--pos); }
        .badge.neg { background: var(--cost-tint); color: var(--cost); }
        .badge.wait { background: var(--surface-2); color: var(--ink-faint); font-weight: 600; font-size: 12.5px; }
        .foot { display: flex; gap: 10px; padding: 14px 18px 18px; border-top: 1px solid var(--line); }
        .btn-del {
          flex: 1; border: 1px solid var(--line); border-radius: 10px; padding: 12px;
          font-weight: 600; font-size: 14.5px; color: var(--cost);
        }
        .btn-del:hover { background: var(--cost-tint); }
        .btn-edit { flex: 1.4; background: var(--brand); color: #fff; border-radius: 10px; padding: 12px; font-weight: 600; font-size: 14.5px; }
        .btn-edit:hover { background: var(--brand-hover); }
      `}</style>
    </div>
  );
}
