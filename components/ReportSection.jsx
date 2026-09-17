import React, { useState, useEffect, useCallback } from "react";
import { getMonthlySummary, getPendingCount, getArchivedSoldCount } from "../lib/supabase";

const fmt = (n) => Number(n).toLocaleString("th-TH", { maximumFractionDigits: 2 });
const baht = (n) => "฿" + fmt(n);

const MONTHS_FULL = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const thMonthShort = (key) => { const [y, mo] = key.split("-"); return `${MONTHS_SHORT[+mo - 1]} ${(+y + 543) % 100}`; };
const thMonthFull = (key) => { const [y, mo] = key.split("-"); return `${MONTHS_FULL[+mo - 1]} ${+y + 543}`; };

const ReportSection = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [sumRes, pendRes, archRes] = await Promise.all([
      getMonthlySummary(), getPendingCount(), getArchivedSoldCount(),
    ]);
    if (sumRes.success) setSummary(sumRes.data.sort((a, b) => b.month.localeCompare(a.month)));
    if (pendRes.success) setPendingCount(pendRes.count);
    if (archRes.success) setArchivedCount(archRes.count);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const totalQty = summary.reduce((s, r) => s + r.quantity, 0);
  const totalCost = summary.reduce((s, r) => s + r.totalCost, 0);
  const totalSales = summary.reduce((s, r) => s + r.totalSales, 0);
  const totalProfit = totalSales - totalCost;
  const margin = totalSales ? ((totalProfit / totalSales) * 100).toFixed(1) : "0.0";

  const exportCSV = () => {
    if (!summary.length) return;
    const lines = ["เดือน,จำนวน,ต้นทุนรวม,ยอดขายรวม,กำไร,อัตรากำไร(%)"];
    summary.forEach((r) => {
      const mg = r.totalSales ? ((r.profit / r.totalSales) * 100).toFixed(2) : "0.00";
      lines.push(`"${thMonthFull(r.month)}",${r.quantity},${r.totalCost.toFixed(2)},${r.totalSales.toFixed(2)},${r.profit.toFixed(2)},${mg}`);
    });
    const tMargin = totalSales ? ((totalProfit / totalSales) * 100).toFixed(2) : "0.00";
    lines.push(`"รวมทั้งหมด",${totalQty},${totalCost.toFixed(2)},${totalSales.toFixed(2)},${totalProfit.toFixed(2)},${tMargin}`);
    const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-container">
      <div className="kpis">
        <div className="kpi"><div className="kpi-k">จำนวนที่ขายได้</div><div className="kpi-v">{totalQty}</div><div className="kpi-meta">รายการที่ระบุวันที่ขายแล้ว</div></div>
        <div className="kpi"><div className="kpi-k cost-color">ต้นทุนรวม</div><div className="kpi-v cost-color">{baht(totalCost)}</div><div className="kpi-meta">เฉพาะรายการที่ขายแล้ว</div></div>
        <div className="kpi"><div className="kpi-k">ยอดขายรวม</div><div className="kpi-v">{baht(totalSales)}</div><div className="kpi-meta">รายรับก่อนหักต้นทุน</div></div>
        <div className="kpi hero"><div className="kpi-k">กำไรสุทธิ</div><div className="kpi-v">{baht(totalProfit)}</div><div className="kpi-meta">อัตรากำไร {margin}%</div></div>
      </div>

      {pendingCount > 0 && (
        <div className="note pending">
          <span className="dot" />
          มี {pendingCount} รายการที่ยังไม่ระบุวันที่ขาย จึงยังไม่นับรวมในสรุปรายเดือน (ถือเป็นสินค้าที่ยังอยู่ในสต็อก)
        </div>
      )}
      {archivedCount > 0 && (
        <div className="note archived">
          <span className="dot" />
          มี {archivedCount} รายการที่ถูกลบออกจากหน้าสต็อกแล้ว แต่ยังถูกนับรวมในรายงานนี้ตามปกติ
        </div>
      )}

      <div className="table-card">
        <div className="table-head">
          <h2>สรุปยอดขายรายเดือน</h2>
          <div className="exports">
            <button className="btn-ghost" onClick={exportCSV}>⬇ ดาวน์โหลด CSV</button>
            <button className="btn-ghost" onClick={() => window.print()}>🖨 พิมพ์รายงาน</button>
          </div>
        </div>

        {loading ? (
          <div className="empty">กำลังโหลด...</div>
        ) : (
          <table>
            <thead>
              <tr><th>เดือน</th><th className="ta-c">จำนวน</th><th className="ta-r">ต้นทุน</th><th className="ta-r">ยอดขาย</th><th className="ta-r">กำไร</th><th className="ta-c">อัตรากำไร</th></tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">ยังไม่มีรายการที่ปิดการขาย</td></tr>
              ) : (
                summary.map((r) => {
                  const mg = r.totalSales ? ((r.profit / r.totalSales) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={r.month}>
                      <td className="mth">{thMonthShort(r.month)}</td>
                      <td className="ta-c">{r.quantity}</td>
                      <td className="ta-r">{baht(r.totalCost)}</td>
                      <td className="ta-r">{baht(r.totalSales)}</td>
                      <td className="ta-r pos">{baht(r.profit)}</td>
                      <td className="ta-c">{mg}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {summary.length > 0 && (
              <tfoot>
                <tr>
                  <td>รวมทั้งหมด</td><td className="ta-c">{totalQty}</td><td className="ta-r">{baht(totalCost)}</td>
                  <td className="ta-r">{baht(totalSales)}</td><td className="ta-r">{baht(totalProfit)}</td><td className="ta-c">{margin}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      <style jsx>{`
        .report-container { padding: 0; }
        .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
        .kpi { background: white; border: 1px solid #e2e6e1; border-radius: 12px; padding: 18px; }
        .kpi.hero { background: #0e6e63; border-color: #0e6e63; color: white; }
        .kpi-k { font-size: 13px; color: #5c6b64; margin-bottom: 8px; }
        .kpi.hero .kpi-k { color: rgba(255,255,255,.85); }
        .cost-color { color: #b64438; }
        .kpi-v { font-size: 26px; font-weight: 700; }
        .kpi.hero .kpi-v { color: white; }
        .kpi-meta { font-size: 12.5px; color: #5c6b64; margin-top: 5px; }
        .kpi.hero .kpi-meta { color: rgba(255,255,255,.82); }
        .note { background: white; border: 1px solid #e2e6e1; border-radius: 9px; padding: 11px 14px; font-size: 13.5px; color: #5c6b64; margin-bottom: 14px; display: flex; align-items: center; gap: 9px; }
        .note .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .note.pending { border-left: 3px solid #a76b1f; }
        .note.pending .dot { background: #a76b1f; }
        .note.archived { border-left: 3px solid #9aa8a2; margin-bottom: 20px; }
        .note.archived .dot { background: #9aa8a2; }
        .table-card { background: white; border: 1px solid #e2e6e1; border-radius: 12px; overflow: hidden; }
        .table-head { padding: 16px 20px; border-bottom: 1px solid #e2e6e1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .table-head h2 { font-size: 16px; font-weight: 600; margin: 0; }
        .exports { display: flex; gap: 8px; }
        .btn-ghost { border: 1px solid #e2e6e1; background: white; border-radius: 9px; padding: 8px 14px; font-size: 13.5px; font-weight: 500; cursor: pointer; }
        .btn-ghost:hover { border-color: #0e6e63; color: #0e6e63; background: #e3f0ed; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 13px 20px; text-align: left; font-size: 14px; }
        th { font-size: 12.5px; font-weight: 600; color: #5c6b64; background: #f0f2ef; }
        td { border-top: 1px solid #e2e6e1; }
        .ta-r { text-align: right; }
        .ta-c { text-align: center; }
        .mth { font-weight: 600; }
        tfoot td { border-top: 2px solid #0e6e63; font-weight: 700; background: #e3f0ed; }
        .pos { color: #137a54; font-weight: 600; }
        .empty, .empty-row { text-align: center; color: #5c6b64; padding: 40px 20px; }
        @media (max-width: 760px) { .kpis { grid-template-columns: repeat(2, 1fr); } .table-card { overflow-x: auto; } table { min-width: 560px; } }
      `}</style>
    </div>
  );
};

export default ReportSection;
