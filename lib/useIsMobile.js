import { useEffect, useState } from "react";

// true เมื่อหน้าจอกว้างไม่เกิน 599px (มือถือ) — tablet/desktop ใช้การ์ดแบบเดิม
export default function useIsMobile(maxWidth = 599) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [maxWidth]);

  return isMobile;
}
