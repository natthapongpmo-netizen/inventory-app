import React, { useState, useEffect, useCallback } from "react";
import { getMonthlySummary, getPendingCount, getArchivedSoldCount } from "../lib/supabase";
import { baht, thMonthShort, thMonthFull } from "../lib/format";

const ReportSection = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [sumRes, pendRes, archRes] = await Promise.all([
      getMonthlySummary(),
      getPendingCount(),
      getArchivedSoldCount(),
    ]);
    if (sumRes.success) setSummary(sumRes.data.sort((a, b) => b.month.localeCompare(a.month)));
    if (pendRes.success) setPendingCount(pendRes.count);
    if (archRes.success) setArchivedCount(archRes.count);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const totalQty = summary.reduce((s, r) => s + r.quantity, 0);
  const totalCost = summary.reduce((s, r) => s + r.totalCost, 0);
  const totalSales = summary.reduce((s, r) => s + r.totalSales, 0);
  const totalProfit = totalSales - totalCost;
  const margin = totalSales ? ((totalProfit / totalSales) * 100).toFixed(1) : "0.0";

  // CSV: ตัวเลขล้วน ไม่มี ฿/comma หลักพัน + BOM ให้ Excel อ่านภาษาไทยได้
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
    <div>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-k">จำนวนที่ขายได้</div>
          <div className="kpi-v">{totalQty}</div>
          <div className="kpi-meta">รายการที่ระบุวันที่ขายแล้ว</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">ต้นทุนรวม</div>
          <div className="kpi-v cost">{baht(totalCost)}</div>
          <div className="kpi-meta">เฉพาะรายการที่ขายแล้ว</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">ยอดขายรวม</div>
          <div className="kpi-v">{baht(totalSales)}</div>
          <div className="kpi-meta">รายรับก่อนหักต้นทุน</div>
        </div>
        <div className="kpi hero">
          <div className="kpi-k">กำไรสุทธิ</div>
          <div className="kpi-v">{baht(totalProfit)}</div>
          <div className="kpi-meta">อัตรากำไร {margin}%</div>
        </div>
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
          มี {archivedCount} รายการที่ถูกลบออกจากหน้าจอแล้ว แต่ยังถูกนับรวมในรายงานนี้ตามปกติ
        </div>
      )}

      <div className="table-card">
        <div className="table-head">
          <h2>สรุปยอดขายรายเดือน</h2>
          <div className="exports no-print">
            <button className="btn-ghost" onClick={exportCSV}>ดาวน์โหลด CSV</button>
            <button className="btn-ghost" onClick={() => window.print()}>พิมพ์รายงาน</button>
          </div>
        </div>

        {loading ? (
          <div className="empty">กำลังโหลด...</div>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>เดือน</th>
                  <th className="ta-c">จำนวน</th>
                  <th className="ta-r">ต้นทุน</th>
                  <th className="ta-r">ยอดขาย</th>
                  <th className="ta-r">กำไร</th>
                  <th className="ta-c">อัตรากำไร</th>
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">ยังไม่มีรายการที่ขายแล้ว</td></tr>
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
                    <td>รวมทั้งหมด</td>
                    <td className="ta-c">{totalQty}</td>
                    <td className="ta-r">{baht(totalCost)}</td>
                    <td className="ta-r">{baht(totalSales)}</td>
                    <td className="ta-r">{baht(totalProfit)}</td>
                    <td className="ta-c">{margin}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
        .kpi { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 17px; }
        .kpi.hero { background: var(--brand); border-color: var(--brand); color: #fff; }
        .kpi-k { font-size: 13px; color: var(--ink-soft); margin-bottom: 6px; }
        .kpi-meta { font-size: 12.5px; color: var(--ink-soft); margin-top: 4px; }
        .kpi.hero .kpi-k, .kpi.hero .kpi-meta { color: rgba(255, 255, 255, 0.85); }
        .kpi-v { font-size: 25px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .kpi-v.cost { color: var(--cost); }
        .note {
          background: var(--surface); border: 1px solid var(--line); border-radius: 9px; padding: 11px 14px;
          font-size: 13.5px; color: var(--ink-soft); margin-bottom: 12px; display: flex; align-items: center; gap: 9px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .note.pending { border-left: 3px solid var(--amber); }
        .note.pending .dot { background: var(--amber); }
        .note.archived { border-left: 3px solid var(--ink-faint); }
        .note.archived .dot { background: var(--ink-faint); }
        .table-card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; margin-top: 8px; }
        .table-head { padding: 15px 20px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .table-head h2 { font-size: 16px; font-weight: 600; }
        .exports { display: flex; gap: 8px; }
        .btn-ghost { border: 1px solid var(--line); background: var(--surface); border-radius: 9px; padding: 7px 13px; font-size: 13.5px; font-weight: 500; }
        .btn-ghost:hover { border-color: var(--brand-text); color: var(--brand-text); background: var(--brand-tint); }
        .scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 20px; text-align: left; font-size: 14px; white-space: nowrap; }
        th { font-size: 12.5px; font-weight: 600; color: var(--ink-soft); background: var(--surface-2); }
        td { border-top: 1px solid var(--line); font-variant-numeric: tabular-nums; }
        .ta-r { text-align: right; }
        .ta-c { text-align: center; }
        .mth { font-weight: 600; }
        tfoot td { border-top: 2px solid var(--brand-text); font-weight: 700; background: var(--brand-tint); }
        .pos { color: var(--pos); font-weight: 600; }
        .empty, .empty-row { text-align: center; color: var(--ink-soft); padding: 36px 20px; }
        @media (max-width: 899px) {
          .kpis { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 599px) {
          .kpi-v { font-size: 20px; }
          th, td { padding: 11px 14px; }
        }
      `}</style>
    </div>
  );
};

export default ReportSection;
