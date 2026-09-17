import React, { useState, useCallback } from "react";
import ProductList from "../components/ProductList";
import ReportSection from "../components/ReportSection";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("stock");

  const handleDataChanged = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>ระบบบันทึกสต็อกและยอดขาย</h1>
            <p className="subtitle">จัดการสินค้า ต้นทุน และสรุปกำไรรายเดือน</p>
          </div>
        </div>
      </header>

      <nav className="tabs-nav">
        <div className="tabs-container">
          <button className={`tab ${activeTab === "stock" ? "active" : ""}`} onClick={() => setActiveTab("stock")}>
            สินค้าในสต็อก
          </button>
          <button className={`tab ${activeTab === "report" ? "active" : ""}`} onClick={() => setActiveTab("report")}>
            รายงานยอดขาย
          </button>
        </div>
      </nav>

      <main className="app-main">
        {activeTab === "stock" && <ProductList refreshTrigger={refreshKey} onDataChanged={handleDataChanged} />}
        {activeTab === "report" && <ReportSection refreshTrigger={refreshKey} />}
      </main>

      <style jsx>{`
        .app-container { min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f4; }
        .app-header { background: white; border-bottom: 1px solid #e2e6e1; padding: 16px 24px; position: sticky; top: 0; z-index: 40; }
        .header-content { max-width: 1180px; margin: 0 auto; }
        .logo-section h1 { margin: 0; font-size: 19px; font-weight: 600; }
        .subtitle { margin: 2px 0 0; color: #5c6b64; font-size: 13px; }
        .tabs-nav { background: white; border-bottom: 1px solid #e2e6e1; position: sticky; top: 65px; z-index: 39; }
        .tabs-container { max-width: 1180px; margin: 0 auto; padding: 0 24px; display: flex; }
        .tab { background: none; border: none; padding: 14px 4px; margin-right: 22px; font-size: 15px; font-weight: 500; color: #5c6b64; cursor: pointer; border-bottom: 2.5px solid transparent; }
        .tab.active { color: #0e6e63; border-bottom-color: #0e6e63; font-weight: 600; }
        .app-main { flex: 1; max-width: 1180px; width: 100%; margin: 0 auto; padding: 24px; }
        @media (max-width: 760px) { .app-main { padding: 16px; } .tabs-container { padding: 0 16px; } }
      `}</style>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f4f6f4; color: #16241f; }
      `}</style>
    </div>
  );
}
