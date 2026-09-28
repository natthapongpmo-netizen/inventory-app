import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "theme";
const OPTIONS = [
  { value: "light", label: "สว่าง" },
  { value: "dark", label: "มืด" },
  { value: "system", label: "ตามเครื่อง" },
];

const resolveTheme = (t) => {
  if (t === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return t;
};

const applyTheme = (t) => {
  document.documentElement.setAttribute("data-theme", resolveTheme(t));
};

export default function ThemeSettings() {
  const [open, setOpen] = useState(false);
  // null = ยังไม่ได้อ่านค่าจากเครื่อง (กันไม่ให้ทับค่าที่ _document.jsx ตั้งไว้แล้ว)
  const [theme, setTheme] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    let saved = "light";
    try {
      saved = localStorage.getItem(STORAGE_KEY) || "light";
    } catch (e) {
      /* browser ปิด storage — ใช้ค่าเริ่มต้น */
    }
    setTheme(saved);
  }, []);

  useEffect(() => {
    if (theme === null) return;
    applyTheme(theme);
    if (theme !== "system") return;
    // โหมด "ตามเครื่อง": เปลี่ยนตามทันทีเมื่อผู้ใช้สลับ dark mode ที่ตัวเครื่อง
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (value) => {
    setTheme(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      /* บันทึกไม่ได้ก็ยังเปลี่ยนธีมในหน้านี้ได้ */
    }
  };

  return (
    <div className="wrap" ref={wrapRef}>
      <button
        className="icon-btn"
        aria-label="ตั้งค่า"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="panel" role="dialog" aria-label="ตั้งค่า">
          <div className="title">ธีมสี</div>
          <div className="seg" role="radiogroup">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                role="radio"
                aria-checked={theme === o.value}
                className={theme === o.value ? "on" : ""}
                onClick={() => choose(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="hint">{"\"ตามเครื่อง\" จะเปลี่ยนตามการตั้งค่าโหมดมืดของมือถือหรือคอมพิวเตอร์อัตโนมัติ"}</p>
        </div>
      )}

      <style jsx>{`
        .wrap { position: relative; }
        .icon-btn {
          width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--line);
          display: grid; place-items: center; color: var(--ink-soft); background: var(--surface);
          transition: color 0.15s, border-color 0.15s;
        }
        .icon-btn:hover, .icon-btn[aria-expanded="true"] { color: var(--brand-text); border-color: var(--brand-text); }
        .icon-btn svg { width: 19px; height: 19px; }
        .panel {
          position: absolute; top: 48px; right: 0; width: 280px; z-index: 60;
          background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
          box-shadow: var(--shadow); padding: 16px; animation: pop 0.15s ease;
        }
        .title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
        .seg {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;
          background: var(--surface-2); padding: 4px; border-radius: 10px;
        }
        .seg button { padding: 8px 4px; border-radius: 7px; font-size: 13px; font-weight: 500; color: var(--ink-soft); }
        .seg button.on { background: var(--surface); color: var(--ink); font-weight: 600; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12); }
        .hint { font-size: 12px; color: var(--ink-soft); margin-top: 10px; line-height: 1.5; }
        @media (max-width: 599px) {
          .panel { position: fixed; top: 60px; left: 10px; right: 10px; width: auto; }
        }
      `}</style>
    </div>
  );
}
