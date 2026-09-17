import React, { useState, useEffect } from "react";
import { addProduct, updateProduct, getSalesChannels } from "../lib/supabase";

const emptyForm = {
  costPrice: "",
  salesChannelId: "",
  sellingPrice: "",
  notes: "",
  saleDate: "",
};

/**
 * ใช้ทั้งสร้างสินค้าใหม่และแก้ไขสินค้าเดิม
 * props:
 *  - isOpen, onClose, onSaved
 *  - editingProduct: null = โหมดสร้างใหม่, object = โหมดแก้ไข (ค่าจาก getProducts())
 */
const ProductModal = ({ isOpen, onClose, onSaved, editingProduct }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [salesChannels, setSalesChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");

  const isEditing = Boolean(editingProduct);

  useEffect(() => {
    if (isOpen) loadSalesChannels();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingProduct) {
      setFormData({
        costPrice: editingProduct.cost_price ?? "",
        salesChannelId: editingProduct.sales_channel_id ?? "",
        sellingPrice: editingProduct.selling_price ?? "",
        notes: editingProduct.notes ?? "",
        saleDate: editingProduct.sale_date ?? "",
      });
      setImagePreview(editingProduct.image_url ?? null);
      setImageFile(null);
    } else {
      setFormData(emptyForm);
      setImagePreview(null);
      setImageFile(null);
    }
    setError("");
  }, [isOpen, editingProduct]);

  const loadSalesChannels = async () => {
    const result = await getSalesChannels();
    if (result.success) setSalesChannels(result.data);
  };

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

    setLoading(true);
    try {
      const payload = {
        image: imageFile,
        existingImageUrl: editingProduct?.image_url ?? null,
        costPrice: formData.costPrice,
        salesChannelId: formData.salesChannelId,
        sellingPrice: formData.sellingPrice,
        notes: formData.notes,
        saleDate: formData.saleDate,
      };

      const result = isEditing
        ? await updateProduct(editingProduct.id, payload)
        : await addProduct(payload);

      if (result.success) {
        onSaved?.();
        onClose();
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2>{isEditing ? "แก้ไขรายการ" : "เพิ่มสินค้า"}</h2>
            <p className="modal-sub">
              {isEditing
                ? "อัปเดตข้อมูลของรายการนี้ (แก้เฉพาะช่องที่ต้องการ)"
                : "กรอกเท่าที่มีตอนนี้ แล้วมาเติมข้อมูลภายหลังได้"}
            </p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-intro">
            ทุกช่องไม่บังคับ — ปกติเริ่มจากรูปและต้นทุนก่อน แล้วค่อยเติมช่องทาง ราคาขาย และวันที่เมื่อขายได้
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>รูปสินค้า</label>
            <div className="image-upload-container">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <label className="change-image-btn">
                    เปลี่ยนรูป
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                  </label>
                </div>
              ) : (
                <label className="upload-label">
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                  <div className="upload-placeholder">
                    <span>📷 เลือกรูปสินค้า</span>
                    <small>แตะเพื่อเลือกภาพ 1 รูปจากเครื่อง</small>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="salesChannelId">ช่องทางขาย</label>
            <select id="salesChannelId" name="salesChannelId" value={formData.salesChannelId} onChange={handleInputChange}>
              <option value="">— เลือกช่องทาง —</option>
              {salesChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>{channel.name}</option>
              ))}
            </select>
          </div>

          <div className="two-col">
            <div className="form-group">
              <label htmlFor="costPrice">ราคาต้นทุน</label>
              <input id="costPrice" type="number" name="costPrice" value={formData.costPrice} onChange={handleInputChange} placeholder="0.00" step="0.01" min="0" />
            </div>
            <div className="form-group">
              <label htmlFor="sellingPrice">ราคาขาย</label>
              <input id="sellingPrice" type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleInputChange} placeholder="0.00" step="0.01" min="0" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="saleDate">วันที่ขาย</label>
            <input id="saleDate" type="date" name="saleDate" value={formData.saleDate} onChange={handleInputChange} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="notes">หมายเหตุ</label>
            <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="เช่น ชื่อสินค้า ลูกค้า หรือรายละเอียดเพิ่มเติม" rows="3" />
          </div>

          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "บันทึก"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(22,36,31,.45); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; padding: 40px 16px; overflow-y: auto; }
        .modal-content { background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(22,36,31,.3); max-width: 480px; width: 100%; }
        .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 22px; border-bottom: 1px solid #e2e6e1; }
        .modal-header h2 { margin: 0; font-size: 18px; font-weight: 600; }
        .modal-sub { font-size: 13px; color: #5c6b64; margin: 2px 0 0 0; }
        .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #5c6b64; width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .close-btn:hover { background: #f0f2ef; }
        .product-form { padding: 22px; }
        .form-intro { background: #e3f0ed; color: #0a534b; font-size: 12.5px; padding: 10px 13px; border-radius: 9px; margin-bottom: 18px; line-height: 1.45; }
        .form-group { margin-bottom: 18px; }
        .form-group label { display: block; margin-bottom: 7px; font-weight: 600; font-size: 13.5px; color: #16241f; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 11px 13px; border: 1px solid #e2e6e1; border-radius: 10px; font-size: 15px; font-family: inherit; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #0e6e63; box-shadow: 0 0 0 3px #e3f0ed; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .upload-label { cursor: pointer; display: block; }
        .upload-placeholder { border: 1.5px dashed #e2e6e1; border-radius: 12px; padding: 26px 16px; text-align: center; color: #5c6b64; }
        .upload-placeholder span { display: block; font-size: 14px; font-weight: 500; color: #16241f; }
        .upload-placeholder small { font-size: 12px; }
        .upload-label:hover .upload-placeholder { border-color: #0e6e63; background: #e3f0ed; }
        .image-preview { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 16/10; background: #f0f2ef; }
        .image-preview img { width: 100%; height: 100%; object-fit: cover; }
        .change-image-btn { position: absolute; bottom: 10px; right: 10px; background: rgba(22,36,31,.78); color: white; font-size: 12.5px; font-weight: 500; padding: 7px 12px; border-radius: 8px; cursor: pointer; }
        .error-message { background: #fbe9e7; color: #b64438; padding: 10px 12px; border-radius: 9px; margin-bottom: 16px; font-size: 13px; }
        .modal-buttons { display: flex; gap: 10px; margin-top: 6px; padding-top: 18px; border-top: 1px solid #e2e6e1; }
        .btn { border: none; border-radius: 10px; padding: 12px; font-size: 14.5px; font-weight: 600; cursor: pointer; }
        .btn-primary { flex: 1.4; background: #0e6e63; color: white; }
        .btn-primary:hover:not(:disabled) { background: #0a534b; }
        .btn-secondary { flex: 1; background: white; border: 1px solid #e2e6e1; color: #16241f; }
        .btn-secondary:hover:not(:disabled) { background: #f0f2ef; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default ProductModal;
