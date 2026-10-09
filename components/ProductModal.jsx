import React, { useState, useEffect } from "react";
import { addProduct, updateProduct, getSalesChannels } from "../lib/supabase";
import { parsePrice, formatPrice } from "../lib/price";

const PRICE_FIELDS = ["costPrice", "sellingPrice"];
const noPriceErrors = { costPrice: "", sellingPrice: "" };

const emptyForm = {
  costPrice: "",
  salesChannelId: "",
  sellingPrice: "",
  notes: "",
  saleDate: "",
};

/**
 * ฟอร์มเพิ่ม/แก้ไขสินค้า (ทุกช่อง optional)
 * props: isOpen, onClose, onSaved(savedRow), editingProduct (null = เพิ่มใหม่)
 */
const ProductModal = ({ isOpen, onClose, onSaved, editingProduct }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [salesChannels, setSalesChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [priceErrors, setPriceErrors] = useState(noPriceErrors);

  const isEditing = Boolean(editingProduct);

  useEffect(() => {
    if (!isOpen) return;
    getSalesChannels().then((r) => r.success && setSalesChannels(r.data));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingProduct) {
      setFormData({
        costPrice: formatPrice(editingProduct.cost_price),
        salesChannelId: editingProduct.sales_channel_id ?? "",
        sellingPrice: formatPrice(editingProduct.selling_price),
        notes: editingProduct.notes ?? "",
        saleDate: editingProduct.sale_date ?? "",
      });
      setImagePreview(editingProduct.image_url ?? null);
    } else {
      setFormData(emptyForm);
      setImagePreview(null);
    }
    setImageFile(null);
    setError("");
    setPriceErrors(noPriceErrors);
  }, [isOpen, editingProduct]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && !loading && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, loading, onClose]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (PRICE_FIELDS.includes(name)) setPriceErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ออกจากช่องราคา: ตรวจค่า ถ้าถูกต้องจัดรูปแบบให้อ่านง่าย (1250 -> 1,250) ถ้าผิดแสดงคำเตือนใต้ช่อง
  const handlePriceBlur = (e) => {
    const { name, value } = e.target;
    const { value: num, error: msg } = parsePrice(value);
    setPriceErrors((prev) => ({ ...prev, [name]: msg }));
    if (!msg) setFormData((prev) => ({ ...prev, [name]: formatPrice(num) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const hasAnything =
      imageFile || imagePreview || formData.costPrice || formData.salesChannelId ||
      formData.sellingPrice || formData.notes || formData.saleDate;

    if (!isEditing && !hasAnything) {
      setError("กรอกอย่างน้อยหนึ่งช่องก่อนบันทึก");
      return;
    }

    const cost = parsePrice(formData.costPrice);
    const sell = parsePrice(formData.sellingPrice);
    if (cost.error || sell.error) {
      setPriceErrors({ costPrice: cost.error, sellingPrice: sell.error });
      setError("ตรวจช่องราคาที่มีข้อความสีแดงก่อนบันทึก");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        image: imageFile,
        existingImageUrl: editingProduct?.image_url ?? null,
        costPrice: cost.value ?? "",
        salesChannelId: formData.salesChannelId,
        sellingPrice: sell.value ?? "",
        notes: formData.notes,
        saleDate: formData.saleDate,
      };

      const result = isEditing
        ? await updateProduct(editingProduct.id, payload)
        : await addProduct(payload);

      if (result.success) {
        onSaved?.(result.data?.[0] ?? null);
        onClose();
      } else {
        setError(result.error || "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    } catch (err) {
      setError("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="head">
          <div>
            <h2>{isEditing ? "แก้ไขรายการ" : "เพิ่มสินค้า"}</h2>
            <p className="sub">
              {isEditing
                ? "อัปเดตข้อมูลของรายการนี้ (แก้เฉพาะช่องที่ต้องการ)"
                : "กรอกเท่าที่มีตอนนี้ แล้วมาเติมข้อมูลภายหลังได้"}
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="intro">
            ทุกช่องไม่บังคับ — ปกติเริ่มจากรูปและต้นทุนก่อน แล้วค่อยเติมช่องทาง ราคาขาย และวันที่เมื่อขายได้
          </div>

          {error && <div className="error">{error}</div>}

          <div className="group">
            <label>รูปสินค้า</label>
            {imagePreview ? (
              <label className="preview">
                <img src={imagePreview} alt="ตัวอย่างรูปสินค้า" />
                <span className="change">เปลี่ยนรูป</span>
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              </label>
            ) : (
              <label className="drop">
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                <span className="big">เลือกรูปสินค้า</span>
                <span className="small">แตะเพื่อเลือกภาพ 1 รูปจากเครื่อง</span>
              </label>
            )}
          </div>

          <div className="group">
            <label htmlFor="salesChannelId">ช่องทางขาย</label>
            <select id="salesChannelId" name="salesChannelId" value={formData.salesChannelId} onChange={handleInputChange}>
              <option value="">— เลือกช่องทาง —</option>
              {salesChannels.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="two">
            <div className="group">
              <label htmlFor="costPrice">ราคาต้นทุน</label>
              <input
                id="costPrice"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleInputChange}
                onBlur={handlePriceBlur}
                placeholder="0.00"
                aria-invalid={priceErrors.costPrice ? "true" : "false"}
                aria-describedby={priceErrors.costPrice ? "costPrice-error" : undefined}
              />
              {priceErrors.costPrice && <p id="costPrice-error" className="field-error">{priceErrors.costPrice}</p>}
            </div>
            <div className="group">
              <label htmlFor="sellingPrice">ราคาขาย</label>
              <input
                id="sellingPrice"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleInputChange}
                onBlur={handlePriceBlur}
                placeholder="0.00"
                aria-invalid={priceErrors.sellingPrice ? "true" : "false"}
                aria-describedby={priceErrors.sellingPrice ? "sellingPrice-error" : undefined}
              />
              {priceErrors.sellingPrice && <p id="sellingPrice-error" className="field-error">{priceErrors.sellingPrice}</p>}
            </div>
          </div>

          <div className="group">
            <label htmlFor="saleDate">วันที่ขาย</label>
            <input id="saleDate" type="date" name="saleDate" value={formData.saleDate} onChange={handleInputChange} />
          </div>

          <div className="group last">
            <label htmlFor="notes">หมายเหตุ</label>
            <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="เช่น ชื่อสินค้า ลูกค้า หรือรายละเอียดเพิ่มเติม" rows="3" />
          </div>

          <div className="buttons">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>ยกเลิก</button>
            {/* onMouseDown: กันไม่ให้ช่องราคาเสียโฟกัสก่อนคลิก ไม่อย่างนั้นคำเตือนที่โผล่ใต้ช่องจะดันปุ่มเลื่อนจนคลิกหลุด */}
            <button type="submit" className="btn-primary" disabled={loading} onMouseDown={(e) => e.preventDefault()}>
              {loading ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "บันทึก"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: var(--overlay); z-index: 1050;
          display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto;
        }
        .modal { background: var(--surface); border-radius: 16px; box-shadow: var(--shadow); max-width: 480px; width: 100%; animation: pop 0.2s ease; }
        .head { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 20px; border-bottom: 1px solid var(--line); }
        .head h2 { font-size: 18px; font-weight: 600; }
        .sub { font-size: 13px; color: var(--ink-soft); margin-top: 2px; }
        .close-btn { width: 32px; height: 32px; border-radius: 9px; color: var(--ink-soft); display: grid; place-items: center; flex-shrink: 0; }
        .close-btn:hover { background: var(--surface-2); }
        .close-btn svg { width: 18px; height: 18px; }
        .form { padding: 20px; }
        .intro { background: var(--brand-tint); color: var(--brand-text); font-size: 12.5px; padding: 10px 13px; border-radius: 9px; margin-bottom: 16px; line-height: 1.45; }
        .group { margin-bottom: 16px; }
        .group.last { margin-bottom: 0; }
        .group > label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 13.5px; }
        .group input, .group select, .group textarea {
          width: 100%; padding: 11px 13px; border: 1px solid var(--line); border-radius: 10px;
          font-size: 15px; background: var(--surface); color: var(--ink);
        }
        .group input:focus, .group select:focus, .group textarea:focus { outline: none; border-color: var(--brand-text); box-shadow: 0 0 0 3px var(--brand-tint); }
        .group textarea { resize: vertical; min-height: 68px; }
        .group input[aria-invalid="true"] { border-color: var(--cost); }
        .group input[aria-invalid="true"]:focus { box-shadow: 0 0 0 3px var(--cost-tint); }
        .field-error { color: var(--cost); font-size: 12.5px; margin-top: 5px; line-height: 1.45; }
        .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
        .drop {
          display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer;
          border: 1.5px dashed var(--line); border-radius: 12px; padding: 24px 16px; color: var(--ink-soft);
        }
        .drop:hover { border-color: var(--brand-text); background: var(--brand-tint); }
        .big { font-size: 14px; font-weight: 500; color: var(--ink); }
        .small { font-size: 12px; }
        .preview { position: relative; display: block; border-radius: 12px; overflow: hidden; aspect-ratio: 16/10; background: var(--surface-2); cursor: pointer; }
        .preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .change { position: absolute; bottom: 10px; right: 10px; background: rgba(0, 0, 0, 0.7); color: #fff; font-size: 12.5px; padding: 6px 12px; border-radius: 8px; }
        .error { background: var(--cost-tint); color: var(--cost); padding: 10px 12px; border-radius: 9px; margin-bottom: 14px; font-size: 13px; }
        .buttons { display: flex; gap: 10px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }
        .btn-primary { flex: 1.4; background: var(--brand); color: #fff; border-radius: 10px; padding: 12px; font-size: 14.5px; font-weight: 600; }
        .btn-primary:hover:not(:disabled) { background: var(--brand-hover); }
        .btn-secondary { flex: 1; border: 1px solid var(--line); border-radius: 10px; padding: 12px; font-size: 14.5px; font-weight: 600; }
        .btn-secondary:hover:not(:disabled) { background: var(--surface-2); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 599px) {
          .overlay { padding: 16px 10px; }
        }
      `}</style>
    </div>
  );
};

export default ProductModal;
