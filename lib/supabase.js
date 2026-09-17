import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// "ขายแล้ว" นิยามจากการมี sale_date เท่านั้น
const isSold = (record) => record.sale_date != null && record.sale_date !== "";

export const addProduct = async (productData) => {
  try {
    let imageUrl = null;
    if (productData.image) {
      const ext = productData.image.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, productData.image);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const payload = {
      image_url: imageUrl,
      cost_price: productData.costPrice === "" || productData.costPrice == null ? null : parseFloat(productData.costPrice),
      sales_channel_id: productData.salesChannelId === "" || productData.salesChannelId == null ? null : parseInt(productData.salesChannelId),
      selling_price: productData.sellingPrice === "" || productData.sellingPrice == null ? null : parseFloat(productData.sellingPrice),
      notes: productData.notes || null,
      sale_date: productData.saleDate || null,
    };

    const { data, error } = await supabase.from("products").insert([payload]).select();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    let imageUrl = productData.existingImageUrl ?? null;
    if (productData.image) {
      const ext = productData.image.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, productData.image);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const payload = {
      image_url: imageUrl,
      cost_price: productData.costPrice === "" || productData.costPrice == null ? null : parseFloat(productData.costPrice),
      sales_channel_id: productData.salesChannelId === "" || productData.salesChannelId == null ? null : parseInt(productData.salesChannelId),
      selling_price: productData.sellingPrice === "" || productData.sellingPrice == null ? null : parseFloat(productData.sellingPrice),
      notes: productData.notes || null,
      sale_date: productData.saleDate || null,
    };

    const { data, error } = await supabase.from("products").update(payload).eq("id", productId).select();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`*, sales_channels ( id, name )`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSalesChannels = async () => {
  try {
    const { data, error } = await supabase
      .from("sales_channels")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMonthlySummary = async () => {
  try {
    const { data, error } = await supabase.from("monthly_summary").select("*");
    if (error) throw error;
    const mapped = data.map((row) => ({
      month: row.month,
      quantity: row.quantity,
      totalCost: parseFloat(row.total_cost),
      totalSales: parseFloat(row.total_sales),
      profit: parseFloat(row.profit),
    }));
    return { success: true, data: mapped };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPendingCount = async () => {
  try {
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .is("sale_date", null);
    if (error) throw error;
    return { success: true, count: count ?? 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getArchivedSoldCount = async () => {
  try {
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .not("deleted_at", "is", null);
    if (error) throw error;
    return { success: true, count: count ?? 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ลบสินค้า:
//  - "ยังไม่ขาย" (sale_date เป็น null) -> ลบจริง (hard delete)
//  - "ขายแล้ว"   (sale_date มีค่า)     -> soft delete (set deleted_at)
//    เพื่อให้ monthly_summary ยังนับรายการนี้ต่อไปตามปกติ
export const deleteProduct = async (product) => {
  try {
    if (isSold(product)) {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", product.id);
      if (error) throw error;
      return { success: true, mode: "soft" };
    } else {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      return { success: true, mode: "hard" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
