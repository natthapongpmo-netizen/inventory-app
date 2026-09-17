/** @type {import('next').NextConfig} */
const nextConfig = {
  // ทำให้ next build ได้ไฟล์ static ล้วน (ไม่ต้องมี Node server รัน)
  // เหมาะกับ GitHub Pages ซึ่งเสิร์ฟได้แค่ไฟล์ HTML/CSS/JS
  output: 'export',
  reactStrictMode: true,

  // เว็บที่ไม่ใช่ <username>.github.io โดยตรงจะถูกเสิร์ฟที่ path ย่อย
  // เช่น username.github.io/inventory-app/ — ค่านี้ถูกกำหนดอัตโนมัติจาก
  // GitHub Actions ให้ตรงกับชื่อ repo เสมอ ไม่ต้องแก้เอง
  basePath: process.env.NEXT_BASE_PATH || '',

  images: {
    unoptimized: true, // export mode ใช้ Image Optimization API ของ Next.js ไม่ได้
  },
};

module.exports = nextConfig;
