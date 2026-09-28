import React, { useMemo, useState } from "react";
import { has, isSold, fmt, baht, thMonthShort, thDate } from "../lib/format";

/**
 * แสดงรายการสินค้าของแท็บใดแท็บหนึ่ง (ไม่ได้โหลดข้อมูลเอง — รับ items มาจาก pages/index.jsx)
 * props:
 *  - mode: "stock" (ยังไม่ขาย) | "sold" (ขายแล้ว)
 *  - items, loading, isMobile
 *  - onAdd(), onEdit(product), onDelete(product), onOpen(product)
 */
// ข้อควรระวัง (styled-jsx): สไตล์ในแท็ก style jsx ด้านล่างจะใช้ได้เฉพาะกับ element
// ที่เขียนอยู่ใน JSX ก้อนเดียวกับ return นี้เท่านั้น ห้ามแยก JSX ของการ์ด/thumbnail
// ออกไปเป็นตัวแปรหรือฟังก์ชันย่อย ไม่อย่างนั้นสไตล์จะหายทั้งหมด (รูปจะใหญ่เต็มจอ)
export default function ProductList({ mode, items, loading, isMobile, onAdd, onEdit, onDelete, onOpen }) {
  const [filterMonth, setFilterMonth] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const soldMode = mode === "sold";

  const monthOptions = useMemo(
    () => (soldMode ? [...new Set(items.map((p) => p.sale_date.slice(0, 7)))].sort().reverse() : []),
    [items, soldMode]
  );
  const channelOptions = useMemo(
    () => [...new Set(items.map((p) => p.sales_channels?.name).filter(Boolean))],
    [items]
  );

  // ถ้าเดือน/ช่องทางที่เลือกไว้ไม่มีรายการเหลือแล้ว ให้กลับไปแสดงทั้งหมด
  const month = monthOptions.includes(filterMonth) ? filterMonth : "";
  const channel = channelOptions.includes(filterChannel) ? filterChannel : "";

  const filtered = soldMode
    ? items.filter(
        (p) =>
          (!month || p.sale_date.slice(0, 7) === month) &&
          (!channel || p.sales_channels?.name === channel)
      )
    : items;

  const total = (key) => filtered.reduce((s, p) => s + (has(p[key]) ? Number(p[key]) : 0), 0);
  const totalCost = total("cost_price");
  const totalSell = total("selling_price");

  const cells = soldMode
    ? [
        { k: "จำนวนที่ขาย", v: filtered.length },
        { k: "รวมต้นทุน", v: baht(totalCost) },
        { k: "รวมยอดขาย", v: baht(totalSell) },
        { k: "กำไรรวม", v: baht(totalSell - totalCost), tone: "pos" },
      ]
    : [
        { k: "จำนวนสินค้า", v: filtered.length },
        { k: "ต้นทุนรวมในสต็อก", v: baht(totalCost), tone: "cost" },
        { k: "ตั้งราคาขายแล้ว", v: `${filtered.filter((p) => has(p.selling_price)).length} รายการ` },
        { k: "มูลค่าตามราคาตั้ง", v: baht(totalSell) },
      ];

  // แถบล่างบน thumbnail (แบบ C): ขายแล้ว = กำไร, รอขาย = ต้นทุน
  const stripValue = (p) => {
    if (isSold(p)) {
      if (has(p.cost_price) && has(p.selling_price)) {
        const pf = Number(p.selling_price) - Number(p.cost_price);
        return (pf >= 0 ? "+" : "") + fmt(pf);
      }
      return has(p.selling_price) ? fmt(p.selling_price) : "";
    }
    return has(p.cost_price) ? `ทุน ${fmt(p.cost_price)}` : "";
  };

  return (
    <div>
      <div className="strip">
        {cells.map((c) => (
          <div className="cell" key={c.k}>
            <div className="k">{c.k}</div>
            <div className={`v ${c.tone || ""}`}>{c.v}</div>
          </div>
        ))}
      </div>

      <div className="bar">
        <h2>
          {soldMode ? "สินค้าที่ขายแล้ว" : "สินค้าที่ยังไม่ขาย"}{" "}
          <span className="count">({filtered.length} รายการ)</span>
        </h2>
        {soldMode && (
          <div className="filters">
            <select value={month} onChange={(e) => setFilterMonth(e.target.value)} aria-label="กรองตามเดือน">
              <option value="">ทุกเดือน</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>{thMonthShort(m)}</option>
              ))}
            </select>
            <select value={channel} onChange={(e) => setFilterChannel(e.target.value)} aria-label="กรองตามช่องทาง">
              <option value="">ทุกช่องทาง</option>
              {channelOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="empty">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p>{soldMode ? "ยังไม่มีรายการที่ขายแล้วในเงื่อนไขนี้" : "ยังไม่มีสินค้าในสต็อก"}</p>
          {!soldMode && (
            <button className="btn-add" onClick={onAdd}>เพิ่มสินค้า</button>
          )}
        </div>
      ) : isMobile ? (
        <div className="thumbs">
          {filtered.map((p) => (
            <button
              key={p.id}
              className="thumb"
              onClick={() => onOpen(p)}
              aria-label={has(p.notes) ? p.notes : "ดูรายละเอียดสินค้า"}
            >
              {p.image_url ? (
                <img src={p.image_url} alt="" loading="lazy" />
              ) : (
                <div className="ph">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
                  </svg>
                </div>
              )}
              <span className={`tstrip ${isSold(p) ? "ok" : "wait"}`}>
                <em>{isSold(p) ? "ขายแล้ว" : "รอขาย"}</em>
                <b>{stripValue(p)}</b>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid">
          {filtered.map((p) => {
            const showProfit = has(p.cost_price) && has(p.selling_price);
            const profit = showProfit ? Number(p.selling_price) - Number(p.cost_price) : 0;
            return (
              <div className="card" key={p.id}>
                <div className="actions">
                  <button className="act edit" onClick={() => onEdit(p)} aria-label="แก้ไข">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button className="act del" onClick={() => onDelete(p)} aria-label="ลบ">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                  </button>
                </div>
                <div className="photo">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" loading="lazy" />
                  ) : (
                    <div className="ph">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
                      </svg>
                    </div>
                  )}
                  {p.sales_channels?.name ? (
                    <span className="chan">{p.sales_channels.name}</span>
                  ) : (
                    <span className="chan muted">ยังไม่ระบุช่องทาง</span>
                  )}
                  {isSold(p) && <span className="sold-tag">ขายแล้ว</span>}
                </div>
                <div className="body">
                  <div className={`title ${has(p.notes) ? "" : "faint"}`}>
                    {has(p.notes) ? p.notes : "ยังไม่ระบุรายละเอียด"}
                  </div>
                  <div className={`date ${has(p.sale_date) ? "" : "pending"}`}>
                    {has(p.sale_date) ? `ขายเมื่อ ${thDate(p.sale_date)}` : "ยังไม่ระบุวันที่ขาย"}
                  </div>
                  <div className="price-row">
                    <span className="lab">ต้นทุน</span>
                    <span className={`num ${has(p.cost_price) ? "cost" : "none"}`}>
                      {has(p.cost_price) ? fmt(p.cost_price) : "—"}
                    </span>
                  </div>
                  <div className="price-row">
                    <span className="lab">ราคาขาย</span>
                    <span className={`num ${has(p.selling_price) ? "" : "none"}`}>
                      {has(p.selling_price) ? fmt(p.selling_price) : "—"}
                    </span>
                  </div>
                  <div className="profit-line">
                    <span className="lab">กำไร</span>
                    {showProfit ? (
                      <span className={`badge ${profit < 0 ? "neg" : ""}`}>{fmt(profit)}</span>
                    ) : (
                      <span className="badge wait">รอปิดการขาย</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .strip {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line);
          border: 1px solid var(--line); border-radius: 12px; overflow: hidden; margin-bottom: 20px;
        }
        .cell { background: var(--surface); padding: 15px 17px; }
        .k { font-size: 12.5px; color: var(--ink-soft); margin-bottom: 4px; }
        .v { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
        .v.pos { color: var(--pos); }
        .v.cost { color: var(--cost); }

        .bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .bar h2 { font-size: 16px; font-weight: 600; }
        .count { color: var(--ink-soft); font-weight: 400; font-size: 14px; }
        .filters { display: flex; gap: 8px; }
        .filters select {
          border: 1px solid var(--line); border-radius: 9px; padding: 8px 12px; font-size: 14px;
          background: var(--surface); color: var(--ink);
        }
        .btn-add { background: var(--brand); color: #fff; border-radius: 9px; padding: 9px 18px; font-weight: 600; font-size: 14px; }
        .btn-add:hover { background: var(--brand-hover); }

        /* desktop / tablet */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
        .card {
          background: var(--surface); border: 1px solid var(--line); border-radius: 12px;
          overflow: hidden; position: relative; transition: box-shadow 0.18s, transform 0.18s;
        }
        .card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
        .photo { aspect-ratio: 4/3; background: var(--surface-2); position: relative; overflow: hidden; }
        .photo img, .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ph { width: 100%; height: 100%; display: grid; place-items: center; color: var(--ink-faint); }
        .ph svg { width: 30px; height: 30px; }
        .chan {
          position: absolute; top: 10px; left: 10px; background: var(--chip); color: var(--brand-text);
          font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
        }
        .chan.muted { color: var(--ink-faint); font-weight: 500; }
        .sold-tag {
          position: absolute; bottom: 10px; left: 10px; background: #15805a; color: #fff;
          font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 20px;
        }
        .actions { position: absolute; top: 9px; right: 9px; display: flex; gap: 6px; z-index: 2; }
        .act {
          width: 32px; height: 32px; border-radius: 9px; background: var(--chip); color: var(--ink-soft);
          display: grid; place-items: center; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }
        .act svg { width: 16px; height: 16px; }
        .act.edit:hover { color: var(--brand-text); }
        .act.del:hover { color: var(--cost); }
        .body { padding: 14px 15px 16px; }
        .title { font-weight: 600; font-size: 14.5px; margin-bottom: 2px; }
        .title.faint { color: var(--ink-faint); font-weight: 500; }
        .date { font-size: 12.5px; color: var(--ink-soft); margin-bottom: 12px; }
        .date.pending { color: var(--amber); }
        .price-row { display: flex; justify-content: space-between; font-size: 13.5px; padding: 3px 0; }
        .lab { color: var(--ink-soft); }
        .num { font-weight: 500; font-variant-numeric: tabular-nums; }
        .num.cost { color: var(--cost); }
        .num.none { color: var(--ink-faint); font-weight: 400; }
        .profit-line {
          margin-top: 10px; padding-top: 11px; border-top: 1px dashed var(--line);
          display: flex; justify-content: space-between; align-items: center;
        }
        .profit-line .lab { font-size: 13px; font-weight: 600; color: var(--ink); }
        .badge {
          font-weight: 700; font-size: 15px; padding: 3px 10px; border-radius: 8px;
          background: var(--pos-tint); color: var(--pos); font-variant-numeric: tabular-nums;
        }
        .badge.neg { background: var(--cost-tint); color: var(--cost); }
        .badge.wait { background: var(--surface-2); color: var(--ink-faint); font-weight: 600; font-size: 12.5px; }

        /* mobile thumbnails (แบบ C: แถบล่าง + ราคา) */
        .thumbs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .thumb {
          position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; display: block;
          width: 100%; padding: 0; background: var(--surface-2); border: 1px solid var(--line);
        }
        .thumb:active { transform: scale(0.98); }
        .tstrip {
          position: absolute; left: 0; right: 0; bottom: 0; padding: 22px 8px 7px;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.66)); color: #fff;
          display: flex; justify-content: space-between; align-items: center; gap: 6px;
        }
        .tstrip em { font-style: normal; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 12px; white-space: nowrap; }
        .tstrip.ok em { background: #15805a; }
        .tstrip.wait em { background: #b0741f; }
        .tstrip b { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }

        .empty { text-align: center; padding: 60px 20px; color: var(--ink-soft); }
        .empty p { margin-bottom: 14px; }

        @media (max-width: 599px) {
          .strip { grid-template-columns: 1fr 1fr; }
          .v { font-size: 17px; }
          .bar h2 { font-size: 15px; }
          .filters { width: 100%; }
          .filters select { flex: 1; min-width: 0; }
        }
      `}</style>
    </div>
  );
}
