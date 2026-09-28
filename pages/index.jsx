import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { getProducts, deleteProduct } from "../lib/supabase";
import { isSold } from "../lib/format";
import useIsMobile from "../lib/useIsMobile";
import ProductList from "../components/ProductList";
import ProductModal from "../components/ProductModal";
import ProductDetail from "../components/ProductDetail";
import ConfirmDelete from "../components/ConfirmDelete";
import ReportSection from "../components/ReportSection";
import ThemeSettings from "../components/ThemeSettings";

export default function Home() {
  const isMobile = useIsMobile();

  const [tab, setTab] = useState("stock");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const r = await getProducts();
    if (r.success) {
      setProducts(r.data);
      setLoadError("");
    } else {
      setLoadError(r.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const stock = useMemo(() => products.filter((p) => !isSold(p)), [products]);
  const sold = useMemo(() => products.filter(isSold), [products]);

  const refreshAll = async () => {
    await load();
    setRefreshKey((k) => k + 1); // ให้แท็บรายงานโหลดใหม่ด้วย
  };

  const openAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };
  const openEdit = (p) => {
    setDetailProduct(null);
    setEditingProduct(p);
    setModalOpen(true);
  };
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);
  const closeDetail = useCallback(() => setDetailProduct(null), []);

  // แจ้งให้รู้ว่ารายการย้ายไปอยู่แท็บไหน จะได้ไม่งงว่าหายไปไหน
  const handleSaved = async (saved) => {
    const nowSold = saved ? isSold(saved) : null;
    if (editingProduct) {
      const wasSold = isSold(editingProduct);
      if (!wasSold && nowSold) setToast('บันทึกแล้ว — ย้ายไปแท็บ "ขายแล้ว"');
      else if (wasSold && nowSold === false) setToast('บันทึกแล้ว — ย้ายกลับไปแท็บ "สินค้าในสต็อก"');
      else setToast("บันทึกการแก้ไขแล้ว");
    } else {
      setToast(nowSold ? 'เพิ่มสินค้าแล้ว — อยู่ในแท็บ "ขายแล้ว"' : "เพิ่มสินค้าแล้ว");
    }
    await refreshAll();
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setDeleting(true);
    const r = await deleteProduct(target);
    setDeleting(false);
    setConfirmTarget(null);
    setDetailProduct(null);
    if (r.success) {
      setToast(isSold(target) ? "ลบออกจากหน้าจอแล้ว — ยอดในรายงานยังคงเดิม" : "ลบรายการแล้ว");
      await refreshAll();
    } else {
      setToast("ลบไม่สำเร็จ: " + r.error);
    }
  };

  const tabs = [
    { id: "stock", label: "สินค้าในสต็อก", count: stock.length },
    { id: "sold", label: "ขายแล้ว", count: sold.length },
    { id: "report", label: "รายงานยอดขาย" },
  ];

  const listProps = {
    loading,
    isMobile,
    onAdd: openAdd,
    onEdit: openEdit,
    onDelete: setConfirmTarget,
    onOpen: setDetailProduct,
  };

  return (
    <div className="app">
      <Head>
        <title>ระบบบันทึกสต็อกและยอดขาย</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="sticky no-print">
        <header className="topbar">
          <div className="brand">
            <div className="mark" aria-hidden="true">ก</div>
            <div className="names">
              <h1>ระบบบันทึกสต็อกและยอดขาย</h1>
              <p className="sub">จัดการสินค้า ต้นทุน และสรุปกำไรรายเดือน</p>
            </div>
          </div>
          <div className="top-actions">
            <ThemeSettings />
            <button className="btn-add" onClick={openAdd} aria-label="เพิ่มสินค้า">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="label">เพิ่มสินค้า</span>
            </button>
          </div>
        </header>

        <nav className="tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tab ${tab === t.id ? "active" : ""}`}
              onClick={() => {
                setTab(t.id);
                window.scrollTo({ top: 0 });
              }}
            >
              {t.label}
              {t.count !== undefined && <span className="n">{t.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      <main className="main">
        {loadError && (
          <div className="load-error">
            โหลดข้อมูลไม่สำเร็จ: {loadError} — ตรวจการเชื่อมต่ออินเทอร์เน็ต แล้วรีเฟรชหน้านี้
          </div>
        )}
        {tab === "stock" && <ProductList mode="stock" items={stock} {...listProps} />}
        {tab === "sold" && <ProductList mode="sold" items={sold} {...listProps} />}
        {tab === "report" && <ReportSection refreshTrigger={refreshKey} />}
      </main>

      <ProductModal isOpen={modalOpen} onClose={closeModal} onSaved={handleSaved} editingProduct={editingProduct} />
      <ProductDetail
        product={detailProduct}
        isMobile={isMobile}
        onClose={closeDetail}
        onEdit={openEdit}
        onDelete={setConfirmTarget}
      />
      <ConfirmDelete
        product={confirmTarget}
        deleting={deleting}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDelete}
      />

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>

      <style jsx>{`
        .app { min-height: 100vh; background: var(--bg); }
        .sticky {
          position: sticky; top: 0; z-index: 40; background: var(--surface);
          border-bottom: 1px solid var(--line); padding-top: env(safe-area-inset-top, 0px);
        }
        .topbar {
          max-width: 1180px; margin: 0 auto; padding: 14px 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .mark {
          width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px; background: var(--brand);
          color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 19px;
        }
        .names { min-width: 0; }
        h1 { font-size: 17px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sub { font-size: 12.5px; color: var(--ink-soft); }
        .top-actions { display: flex; align-items: center; gap: 8px; }
        .btn-add {
          height: 40px; padding: 0 16px; border-radius: 10px; background: var(--brand); color: #fff;
          font-weight: 600; font-size: 14.5px; display: inline-flex; align-items: center; gap: 7px;
        }
        .btn-add:hover { background: var(--brand-hover); }
        .btn-add svg { width: 17px; height: 17px; }

        .tabs {
          max-width: 1180px; margin: 0 auto; padding: 0 24px; display: flex; gap: 22px;
          overflow-x: auto; scrollbar-width: none;
        }
        .tabs::-webkit-scrollbar { display: none; }
        .tab {
          padding: 12px 2px; font-size: 15px; font-weight: 500; color: var(--ink-soft); white-space: nowrap;
          border-bottom: 2.5px solid transparent; display: inline-flex; align-items: center; gap: 7px;
        }
        .tab:hover { color: var(--ink); }
        .tab.active { color: var(--brand-text); border-bottom-color: var(--brand-text); font-weight: 600; }
        .n { font-size: 12px; font-weight: 600; background: var(--surface-2); color: var(--ink-soft); padding: 1px 8px; border-radius: 20px; }
        .tab.active .n { background: var(--brand-tint); color: var(--brand-text); }

        .main { max-width: 1180px; margin: 0 auto; padding: 24px; }
        .load-error {
          background: var(--cost-tint); color: var(--cost); border-radius: 10px;
          padding: 12px 14px; font-size: 14px; margin-bottom: 16px;
        }

        .toast {
          position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          transform: translateX(-50%) translateY(20px); background: var(--ink); color: var(--bg);
          padding: 11px 18px; border-radius: 11px; font-size: 14px; font-weight: 500; max-width: 90vw;
          box-shadow: var(--shadow); opacity: 0; pointer-events: none; z-index: 1200;
          transition: opacity 0.25s, transform 0.25s;
        }
        .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        @media (max-width: 599px) {
          .topbar { padding: 10px 14px; }
          .mark { width: 34px; height: 34px; font-size: 17px; }
          h1 { font-size: 15.5px; }
          .sub, .label { display: none; }
          .btn-add { padding: 0 12px; }
          .tabs { padding: 0 14px; gap: 18px; }
          .tab { font-size: 14px; }
          .main { padding: 14px; }
        }
      `}</style>
    </div>
  );
}
