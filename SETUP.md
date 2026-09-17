# คู่มือติดตั้ง — ระบบบันทึกสต็อกและยอดขาย

**นี่คือคู่มือฉบับเดียวที่ต้องใช้** เอกสารหรือไฟล์คำแนะนำอื่นที่เคยได้รับมาก่อนหน้านี้
ให้ยกเลิกใช้ทั้งหมด (ไม่ต้องเปิดดูอีก) ทำตามลำดับในไฟล์นี้ตั้งแต่ต้นจนจบพอ

เขียนสำหรับ: **Mac ที่ติดตั้ง Xcode/Homebrew ไม่ได้** — ทุกขั้นตอนด้านล่างไม่ต้องใช้ทั้งสองอย่าง

---

## สิ่งที่ต้องมีก่อนเริ่ม (ติดตั้งครั้งเดียว)

ติดตั้ง 2 โปรแกรมนี้แบบดับเบิลคลิกธรรมดา ไม่ต้องใช้ Terminal:

1. **Node.js** — ไปที่ [nodejs.org](https://nodejs.org) ดาวน์โหลดตัวติดตั้ง
   **macOS Installer (.pkg)** เวอร์ชัน **LTS** (เลือกแบบ Apple Silicon/arm64 สำหรับ M2)
2. **GitHub Desktop** — ไปที่ [desktop.github.com](https://desktop.github.com)
   ดาวน์โหลดและติดตั้ง แล้ว sign in ด้วยบัญชี GitHub ของคุณ

ตรวจสอบว่า Node.js ติดตั้งสำเร็จ เปิด **Terminal** (Applications → Utilities → Terminal) พิมพ์:

```bash
node -v
npm -v
```

เห็นเลขเวอร์ชันทั้งสองบรรทัด แปลว่าพร้อมแล้ว ไม่ต้องติดตั้งอะไรเพิ่มอีก
(ไม่ต้องมี Xcode, ไม่ต้องมี Homebrew, ไม่ต้องมี Docker)

---

## ขั้นตอนที่ 1 — วางไฟล์โปรเจค

แตกไฟล์ zip ที่ได้รับไปไว้ในโฟลเดอร์ที่ต้องการ เช่น `~/Documents/inventory-app`
โครงสร้างไฟล์ในนั้นควรมีหน้าตาแบบนี้:

```
inventory-app/
├── SETUP.md                  ← ไฟล์นี้
├── package.json
├── next.config.js
├── .env.example
├── .gitignore
├── pages/
│   ├── index.jsx
│   └── _app.jsx
├── components/
│   ├── ProductModal.jsx
│   ├── ProductList.jsx
│   └── ReportSection.jsx
├── lib/
│   └── supabase.js
├── styles/
│   └── globals.css
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   └── migrations/
│       └── 20240101000000_initial_schema.sql
└── .github/
    └── workflows/
        ├── deploy.yml
        └── pr-check.yml
```

ถ้าตรงกันหมด ไปขั้นต่อไปได้เลย

---

## ขั้นตอนที่ 2 — ติดตั้ง dependencies

เปิด Terminal แล้ว `cd` ไปที่โฟลเดอร์โปรเจค เช่น:

```bash
cd ~/Documents/inventory-app
npm install
```

คำสั่งนี้จะติดตั้งทั้ง Next.js, React, Supabase client library และ Supabase CLI
(อยู่ใน `package.json` แล้วทั้งหมด) รอจนเสร็จ (2-5 นาทีตามความเร็วเน็ต)

---

## ขั้นตอนที่ 3 — สร้าง Supabase Project

1. ไปที่ [supabase.com/dashboard](https://supabase.com/dashboard) → สมัคร/login
2. กด **New Project** ตั้งชื่อ เก็บรหัสผ่านฐานข้อมูลไว้ให้ดี
3. รอ 1-2 นาทีให้ project สร้างเสร็จ

### เก็บข้อมูล 2 อย่างนี้ไว้ (จะใช้ทันที)

ไปที่ **Project Settings → API**:
- **Project URL**
- **anon public key**

ไปที่ URL ของหน้า Dashboard จะเห็น project reference (ชุดตัวอักษรหลัง `/project/`)
เก็บอันนี้ไว้ด้วย เรียกว่า **project-ref**

---

## ขั้นตอนที่ 4 — เชื่อมโปรเจคกับ Supabase และ push migration

ใน Terminal (อยู่ในโฟลเดอร์โปรเจค):

```bash
npx supabase login
```

จะเปิดเบราว์เซอร์ให้ login และอนุญาตสิทธิ์ ทำตามหน้าจอ

```bash
npx supabase link --project-ref <ใส่ project-ref ของคุณ>
```

ระบบจะถามรหัสผ่านฐานข้อมูล (ที่เก็บไว้ตอนสร้าง project) ใส่แล้วกด Enter

```bash
npm run db:push
```

คำสั่งนี้จะสร้างตารางทั้งหมด (`products`, `sales_channels`), view รายงาน,
และตั้งค่าความปลอดภัยเบื้องต้นให้อัตโนมัติ

### เพิ่มข้อมูลช่องทางขายเริ่มต้น

เปิด Supabase Dashboard → **SQL Editor** → New query → คัดลอกเนื้อหาจากไฟล์
`supabase/seed.sql` ไปวาง → กด **Run**

### สร้างที่เก็บรูปภาพ

ไปที่ **Storage** ใน Dashboard → **New bucket** → ตั้งชื่อ `product-images`
→ เปิด **Public bucket** → Create

---

## ขั้นตอนที่ 5 — ตั้งค่าเชื่อมต่อในโค้ด

ในโฟลเดอร์โปรเจค สร้างไฟล์ `.env.local` (คัดลอกจาก `.env.example`):

```bash
cp .env.example .env.local
```

เปิดไฟล์ `.env.local` ด้วย text editor แล้วแก้ 2 บรรทัดให้เป็นค่าจริงที่เก็บไว้จากขั้นตอนที่ 3:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxx
```

---

## ขั้นตอนที่ 6 — รันและทดสอบ

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000**

ทดสอบให้ครบ 4 เคสนี้ก่อนใช้งานจริง:

| ทดสอบ | ผลที่ควรเห็น |
|---|---|
| กด "+ เพิ่มสินค้า" ใส่แค่รูป+ต้นทุน แล้วบันทึก | บันทึกได้ การ์ดแสดง "รอปิดการขาย" |
| กดไอคอนดินสอ แก้ไข เพิ่มราคาขาย+วันที่ | การ์ดเปลี่ยนเป็นมี tag "ขายแล้ว" และโชว์กำไร |
| ลบการ์ดที่ยังไม่ขาย | หายไปทันที กดยืนยันกล่องสีแดง |
| ลบการ์ดที่ขายแล้ว แล้วดูแท็บ "รายงานยอดขาย" | การ์ดหายจากสต็อก แต่ตัวเลขในรายงานไม่เปลี่ยน |

ถ้าทุกอย่างผ่าน กด `Ctrl+C` ใน Terminal เพื่อหยุดเซิร์ฟเวอร์ทดสอบ

---

## ขั้นตอนที่ 7 — ส่งโค้ดขึ้น GitHub ด้วย GitHub Desktop

1. เปิด **GitHub Desktop**
2. **File → Add Local Repository** → เลือกโฟลเดอร์โปรเจค
3. ถ้าโปรแกรมถามว่ายังไม่เป็น git repository ให้กด **create a repository**
4. กด **Publish repository** (ครั้งแรกเท่านั้น) เลือก Private หรือ Public ตามต้องการ
5. ครั้งต่อ ๆ ไปที่แก้ไฟล์: พิมพ์คำอธิบายสั้น ๆ ที่ช่องซ้ายล่าง → **Commit to main** → **Push origin**

---

## ขั้นตอนที่ 8 — ตั้งค่า Deploy อัตโนมัติ (ทำครั้งเดียว)

ระบบนี้มี GitHub Actions ที่จะ push migration และ deploy ให้อัตโนมัติทุกครั้งที่
มีการอัปเดตโค้ดเข้า branch `main` — งานส่วนนี้รันบนเครื่อง cloud ของ GitHub เอง
**ไม่เกี่ยวกับเครื่อง Mac ของคุณเลย**

ไปที่หน้า repository บนเว็บ GitHub → **Settings → Secrets and variables → Actions**
→ **New repository secret** เพิ่มทีละรายการ:

| ชื่อ Secret | ค่าที่ใส่ |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens → สร้างใหม่ |
| `SUPABASE_PROJECT_ID` | project-ref จากขั้นตอนที่ 3 |
| `SUPABASE_DB_PASSWORD` | รหัสผ่านฐานข้อมูลที่ตั้งตอนสร้าง project |
| `NEXT_PUBLIC_SUPABASE_URL` | ค่าเดียวกับใน `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ค่าเดียวกับใน `.env.local` |

**ถ้าต้องการ deploy ขึ้น Vercel อัตโนมัติด้วย** เพิ่ม secret เหล่านี้ต่อ (ถ้าไม่ใช้ Vercel
ข้ามได้ ลบ job `deploy-vercel` ออกจาก `.github/workflows/deploy.yml`):

| ชื่อ Secret | หาได้จาก |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project settings |

---

## หลังจากนี้ — ใช้งานประจำวัน

| ต้องการทำ | วิธี |
|---|---|
| แก้ไฟล์ /ทดสอบในเครื่อง | แก้โค้ด → `npm run dev` → เช็คที่ localhost:3000 |
| ส่งขึ้น GitHub | GitHub Desktop → Commit → Push |
| ขึ้น production จริง | push เข้า `main` → Actions จัดการที่เหลือให้เอง |
| แก้โครงสร้างฐานข้อมูล | `npm run db:new ชื่อการแก้ไข` → เขียน SQL ในไฟล์ที่ได้ → `npm run db:push` |

---

## ถ้าเจอปัญหา

**`npm install` ค้างหรือ error เกี่ยวกับ python/gyp** — ไม่ควรเกิดกับโปรเจคนี้เพราะ
ไม่มี dependency ที่ต้อง compile แต่ถ้าเจอ ลองลบโฟลเดอร์ `node_modules` และไฟล์
`package-lock.json` แล้ว `npm install` ใหม่อีกครั้ง

**`npx supabase` บอกว่าไม่รู้จักคำสั่ง** — ตรวจว่าอยู่ในโฟลเดอร์โปรเจค (มีไฟล์
`package.json`) และรัน `npm install` ไปแล้วจริง

**ลืม project-ref หรือรหัสผ่านฐานข้อมูล** — project-ref ดูได้จาก URL ของ Supabase
Dashboard เสมอ ส่วนรหัสผ่านฐานข้อมูล ถ้าลืมจริง ๆ ไปที่ **Project Settings →
Database → Reset database password** ได้ (แต่ต้องอัปเดต Secret ใน GitHub ด้วยถ้าเคยตั้งไว้แล้ว)

**อยากรัน Supabase แบบ local เต็มรูปแบบ (ไม่ผ่าน cloud)** — ต้องมี Docker Desktop
เพิ่ม (ดาวน์โหลดจาก docker.com ไม่ต้องพึ่ง Xcode เช่นกัน) แต่สำหรับตอนนี้ไม่จำเป็น
คู่มือนี้ให้ทำงานผ่าน Supabase cloud project ได้ครบทุกขั้นตอนอยู่แล้ว
