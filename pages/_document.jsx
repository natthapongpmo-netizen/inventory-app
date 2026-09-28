import { Html, Head, Main, NextScript } from "next/document";

// ตั้งธีมก่อนหน้าเว็บแสดงผล เพื่อไม่ให้จอกะพริบเป็นสีขาวตอนเปิดในโหมดมืด
// ค่าเริ่มต้นเป็น "light" (เหมือนเวอร์ชันเดิม) จนกว่าผู้ใช้จะเปลี่ยนเองในปุ่มตั้งค่า
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="th" data-theme="light">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
