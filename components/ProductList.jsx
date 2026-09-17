import React, { useState, useEffect, useCallback } from "react";
import { getProducts, deleteProduct } from "../lib/supabase";
import ProductModal from "./ProductModal";

const has = (v) => v != null && v !== "";
const isSold = (p) => has(p.sale_date);
const fmt = (n) => Number(n).toLocaleString("th-TH", { maximumFractionDigits: 2 });

const MONTHS_TH = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const MONTHS_TH_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const thMonthLabel = (ymd) => {
  const d = new Date(ymd);
  return `${d.getDate()} ${MONTHS_TH_SHORT[d.getMonth()]} ${(d.getFullYear() + 543) % 100}`;
};

const ProductList = ({ refreshTrigger, onDataChanged }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterChannel, setFilterChannel] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getProducts();
    if (result.success) setProducts(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const openCreate = () => { setEditingProduct(null); setModalOpen(true); };
  const openEdit = (product) => { setEditingProduct(product); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingProduct(null); };
  const handleSaved = () => { load(); onDataChanged?.(); };

  const askDelete = (product) => setConfirmTarget(product);
  const cancelDelete = () => setConfirmTarget(null);

  const confirmDeleteNow = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    const result = await deleteProduct(confirmTarget);
    setDeleting(false);
    setConfirmTarget(null);
    if (result.success) { load(); onDataChanged?.(); }
  };

  const channelOptions = [...new Set(products.map((p) => p.sales_channels?.name).filter(Boolean))];
  const monthOptions = [...new Set(products.filter((p) => has(p.sale_date)).map((p) => p.sale_date.slice(0, 7)))].sort().reverse();

  const filtered = products.filter((p) => {
    const mOk = !filterMonth || (filterMonth === "__none__" ? !has(p.sale_date) : has(p.sale_date) && p.sale_date.slice(0, 7) === filterMonth);
    const cOk = !filterChannel || p.sales_channels?.name === filterChannel;
    return mOk && cOk;
  });

  const totalCost = filtered.reduce((s, p) => s + (has(p.cost_price) ? Number(p.cost_price) : 0), 0);
  const totalSell = filtered.reduce((s, p) => s + (has(p.selling_price) ? Number(p.selling_price) : 0), 0);

  return (
    <div className="stock-container">
      <div className="strip">
        <div className="cell"><div className="k">จำนวนรายการ</div><div className="v">{filtered.length}</div></div>
        <div className="cell"><div className="k">รวมต้นทุน</div><div className="v small">฿{fmt(totalCost)}</div></div>
        <div className="cell"><div className="k">รวมยอดขาย</div><div className="v small">฿{fmt(totalSell)}</div></div>
        <div className="cell"><div className="k">กำไรรวม</div><div className="v small profit">฿{fmt(totalSell - totalCost)}</div></div>
      </div>

      <div className="bar">
        <h2>รายการที่บันทึก <span className="count">({filtered.length} รายการ)</span></h2>
        <div className="filters">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">ทุกเดือน</option>
            {monthOptions.map((m) => {
              const [y, mo] = m.split("-");
              return <option key={m} value={m}>{MONTHS_TH_SHORT[+mo - 1]} {(+y + 543) % 100}</option>;
            })}
            <option value="__none__">ยังไม่ระบุวันที่</option>
          </select>
          <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
            <option value="">ทุกช่องทาง</option>
            {channelOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn-add" onClick={openCreate}>+ เพิ่มสินค้า</button>
        </div>
      </div>

      {loading ? (
        <div className="empty">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p>ยังไม่มีรายการในเงื่อนไขนี้</p>
          <button className="btn-add" onClick={openCreate}>+ เพิ่มสินค้า</button>
        </div>
      ) : (
        <div className="grid">
          {filtered.map((p) => {
            const showProfit = has(p.cost_price) && has(p.selling_price);
            const profit = showProfit ? Number(p.selling_price) - Number(p.cost_price) : null;
            return (
              <div className="card" key={p.id}>
                <div className="actions">
                  <button className="act edit" onClick={() => openEdit(p)} aria-label="แก้ไข">✎</button>
                  <button className="act del" onClick={() => askDelete(p)} aria-label="ลบ">🗑</button>
                </div>
                <div className="photo">
                  {p.image_url ? <img src={p.image_url} alt="" /> : <div className="ph">📷</div>}
                  {p.sales_channels?.name ? <span className="chan">{p.sales_channels.name}</span> : <span className="chan muted">ยังไม่ระบุช่องทาง</span>}
                  {isSold(p) && <span className="sold-tag">ขายแล้ว</span>}
                </div>
                <div className="body">
                  <div className={`title ${has(p.notes) ? "" : "faint"}`}>{has(p.notes) ? p.notes : "ยังไม่ระบุรายละเอียด"}</div>
                  <div className={`date ${has(p.sale_date) ? "" : "pending"}`}>
                    {has(p.sale_date) ? `ขายเมื่อ ${thMonthLabel(p.sale_date)}` : "ยังไม่ระบุวันที่ขาย"}
                  </div>
                  <div className="price-row"><span className="lab">ต้นทุน</span><span className={`num ${has(p.cost_price) ? "cost" : "none"}`}>{has(p.cost_price) ? fmt(p.cost_price) : "—"}</span></div>
                  <div className="price-row"><span className="lab">ราคาขาย</span><span className={`num ${has(p.selling_price) ? "sell" : "none"}`}>{has(p.selling_price) ? fmt(p.selling_price) : "—"}</span></div>
                  <div className="profit-line">
                    <span className="lab">กำไร</span>
                    {showProfit ? <span className={`profit-badge ${profit < 0 ? "neg" : ""}`}>{fmt(profit)}</span> : <span className="profit-badge wait">รอปิดการขาย</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProductModal isOpen={modalOpen} onClose={closeModal} onSaved={handleSaved} editingProduct={editingProduct} />

      {confirmTarget && (
        <div className="confirm-overlay" onClick={(e) => e.target === e.currentTarget && cancelDelete()}>
          {isSold(confirmTarget) ? (
            <div className="confirm">
              <div className="confirm-icon warn">⚠</div>
              <h3>ลบรายการที่ขายแล้ว?</h3>
              <p>
                {has(confirmTarget.notes) ? `"${confirmTarget.notes}"` : "รายการนี้"} ถูกนับในรายงานยอดขายเดือน{" "}
                {MONTHS_TH[new Date(confirmTarget.sale_date).getMonth()]} {new Date(confirmTarget.sale_date).getFullYear() + 543} แล้ว
              </p>
              <div className="impact">
                การ์ดจะหายไปจากหน้าสต็อก แต่<strong>ตัวเลขในรายงานรายเดือนจะไม่เปลี่ยน</strong> — ระบบจะเก็บข้อมูลการขายนี้ไว้เพื่อความถูกต้องของบัญชี
              </div>
              <div className="confirm-foot">
                <button className="btn-cancel" onClick={cancelDelete} disabled={deleting}>ยกเลิก</button>
                <button className="btn-warn" onClick={confirmDeleteNow} disabled={deleting}>{deleting ? "กำลังลบ..." : "ลบออกจากสต็อก"}</button>
              </div>
            </div>
          ) : (
            <div className="confirm">
              <div className="confirm-icon danger">🗑</div>
              <h3>ลบรายการนี้?</h3>
              <p>{has(confirmTarget.notes) ? `"${confirmTarget.notes}"` : "รายการนี้"} จะถูกลบถาวร และไม่สามารถกู้คืนได้</p>
              <div className="confirm-foot">
                <button className="btn-cancel" onClick={cancelDelete} disabled={deleting}>ยกเลิก</button>
                <button className="btn-danger" onClick={confirmDeleteNow} disabled={deleting}>{deleting ? "กำลังลบ..." : "ลบรายการ"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .stock-container { padding: 0; }
        .strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e2e6e1; border: 1px solid #e2e6e1; border-radius: 12px; overflow: hidden; margin-bottom: 22px; }
        .cell { background: white; padding: 16px 18px; }
        .k { font-size: 12.5px; color: #5c6b64; margin-bottom: 5px; }
        .v { font-size: 22px; font-weight: 600; }
        .v.small { font-size: 19px; }
        .v.profit { color: #137a54; }
        .bar { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
        .bar h2 { font-size: 16px; font-weight: 600; margin: 0; }
        .count { color: #5c6b64; font-weight: 400; font-size: 14px; }
        .filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .filters select { border: 1px solid #e2e6e1; border-radius: 9px; padding: 9px 13px; font-size: 14px; background: white; }
        .btn-add { background: #0e6e63; color: white; border: none; border-radius: 9px; padding: 9px 16px; font-weight: 600; font-size: 14px; cursor: pointer; }
        .btn-add:hover { background: #0a534b; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
        .card { background: white; border: 1px solid #e2e6e1; border-radius: 12px; overflow: hidden; position: relative; transition: box-shadow .18s, transform .18s; }
        .card:hover { box-shadow: 0 6px 16px rgba(22,36,31,.12); transform: translateY(-2px); }
        .photo { aspect-ratio: 4/3; background: #f0f2ef; position: relative; overflow: hidden; }
        .photo img { width: 100%; height: 100%; object-fit: cover; }
        .ph { width: 100%; height: 100%; display: grid; place-items: center; font-size: 28px; color: #b6c0ba; }
        .chan { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,.94); color: #0a534b; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .chan.muted { color: #9aa8a2; font-weight: 500; }
        .sold-tag { position: absolute; bottom: 10px; left: 10px; background: rgba(19,122,84,.94); color: white; font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
        .actions { position: absolute; top: 9px; right: 9px; display: flex; gap: 6px; z-index: 2; }
        .act { width: 32px; height: 32px; border-radius: 9px; background: rgba(255,255,255,.94); border: none; display: grid; place-items: center; cursor: pointer; font-size: 14px; }
        .act.edit:hover { color: #0e6e63; }
        .act.del:hover { color: #b64438; }
        .body { padding: 14px 15px 16px; }
        .title { font-weight: 600; font-size: 14.5px; margin-bottom: 2px; }
        .title.faint { color: #9aa8a2; font-weight: 500; }
        .date { font-size: 12.5px; color: #5c6b64; margin-bottom: 12px; }
        .date.pending { color: #a76b1f; }
        .price-row { display: flex; justify-content: space-between; font-size: 13.5px; padding: 3px 0; }
        .lab { color: #5c6b64; }
        .num { font-weight: 500; }
        .num.cost { color: #b64438; }
        .num.sell { color: #16241f; }
        .num.none { color: #9aa8a2; font-weight: 400; }
        .profit-line { margin-top: 10px; padding-top: 11px; border-top: 1px dashed #e2e6e1; display: flex; justify-content: space-between; align-items: center; }
        .profit-line .lab { font-size: 13px; font-weight: 600; }
        .profit-badge { font-weight: 700; font-size: 15px; padding: 3px 10px; border-radius: 8px; background: #e2f2ea; color: #137a54; }
        .profit-badge.neg { background: #fbe9e7; color: #b64438; }
        .profit-badge.wait { background: #f0f2ef; color: #9aa8a2; font-weight: 600; font-size: 12.5px; }
        .empty { text-align: center; padding: 60px 20px; color: #5c6b64; }
        .empty p { margin-bottom: 16px; }
        .confirm-overlay { position: fixed; inset: 0; background: rgba(22,36,31,.45); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 16px; }
        .confirm { background: white; border-radius: 16px; width: 100%; max-width: 400px; padding: 26px; text-align: center; box-shadow: 0 20px 60px rgba(22,36,31,.3); }
        .confirm-icon { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; margin: 0 auto 16px; font-size: 22px; }
        .confirm-icon.danger { background: #fbe9e7; color: #b64438; }
        .confirm-icon.warn { background: #fbeee0; color: #a15b12; }
        .confirm h3 { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
        .confirm p { font-size: 14px; color: #5c6b64; margin-bottom: 8px; line-height: 1.55; }
        .impact { background: #f0f2ef; border-radius: 9px; padding: 10px 12px; font-size: 13px; color: #16241f; margin-bottom: 20px; text-align: left; }
        .confirm-foot { display: flex; gap: 10px; margin-top: 14px; }
        .btn-cancel { flex: 1; border: 1px solid #e2e6e1; background: white; border-radius: 10px; padding: 12px; font-weight: 600; font-size: 14.5px; cursor: pointer; }
        .btn-cancel:hover { background: #f0f2ef; }
        .btn-danger, .btn-warn { flex: 1.4; border: none; border-radius: 10px; padding: 12px; font-weight: 600; font-size: 14.5px; color: white; cursor: pointer; }
        .btn-danger { background: #b64438; }
        .btn-danger:hover { background: #9c3a30; }
        .btn-warn { background: #a15b12; }
        .btn-warn:hover { background: #8a4d0e; }
        @media (max-width: 760px) { .strip { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
};

export default ProductList;
