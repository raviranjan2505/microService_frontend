import axiosInstance from "@/lib/axiosInstance";
import { API_ROUTES, API_BASE_URL } from "@/utils/api";
import type {
  ProductDetails,
  SliderProduct,
  Category,
  Banner,
  Address,
  CartResponse,
  CartItem,
  CartTotal,
  Order,
  OrderDetail,
} from "@/lib/data";

export type ProductPageData<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type OrdersPageData = {
  items: Order[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function toAddressPayload(address: Partial<Address>) {
  const fullName = (address.fullName || address.name || "").trim();
  const phone = (address.phone || address.mobile || address.alternatePhone || "").trim();
  const country = (address.country || "India").trim() || "India";
  const type = (address.type || address.addressType || "HOME") as "HOME" | "WORK" | "OTHER";

  return {
    fullName,
    phone,
    address1: (address.address1 || address.fullAddress || "").trim(),
    address2: (address.address2 || "").trim() || null,
    city: (address.city || "").trim(),
    state: (address.state || "").trim(),
    country,
    pincode: (address.pincode || "").trim(),
    type,
    isDefault: !!address.isDefault,
  };
}

export const getProductDetails = async (
  slag: string
): Promise<{ success: boolean; message: string; data: ProductDetails } | null> => {
  try {
    const res = await axiosInstance.get<{ success: boolean; message: string; data: ProductDetails }>(
      `${API_ROUTES.PRODUCTS}/${slag}`
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching product details:", error);
    return null;
  }
};

export const getProductsBySearchPage = async (
  query: string,
  page = 1,
  pageSize = 20
): Promise<ProductPageData<ProductDetails> | null> => {
  try {
    const res = await axiosInstance.get(`${API_ROUTES.PRODUCTS}/search`, {
      params: { q: query, page, pageSize },
    });

    const payload = res.data?.data ?? null;
    const items = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];

    return {
      items: Array.isArray(items) ? (items as ProductDetails[]) : [],
      pageNumber: Number(payload?.pageNumber ?? page),
      pageSize: Number(payload?.pageSize ?? pageSize),
      totalCount: Number(payload?.totalCount ?? items.length ?? 0),
      totalPages: Math.max(1, Number(payload?.totalPages ?? 1)),
    };
  } catch (err) {
    console.error("getProductsBySearchPage error:", err);
    return null;
  }
};

export const getProductsBySearch = async (query: string): Promise<ProductDetails[]> => {
  const data = await getProductsBySearchPage(query, 1, 20);
  return data?.items ?? [];
};

// ✅ Get all categories - with caching
let categoriesCache: Category[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCategories = async (): Promise<Category[]> => {
  const now = Date.now();
  
  // Return cached data if fresh
  if (categoriesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return categoriesCache;
  }

  try {
    const res = await axiosInstance.get<{ data: Category[] }>(API_ROUTES.CATEGORIES);
    categoriesCache = res.data.data;
    cacheTimestamp = now;
    return res.data.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// ✅ Get category by ID
export async function getCategoryById(id: number) {
  try {
    const res = await axiosInstance.get(`${API_ROUTES.CATEGORIES}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return null;
  }
}

// ✅ Get products by category slug
export async function getProductsBySlug(slug: string, page = 1, pageSize = 10) {
  try {
    const res = await axiosInstance.get(`${API_ROUTES.PRODUCTS}/category/${slug}`, {
      params: { page, pageSize },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching products by slug:", error);
    return [];
  }
}

export async function getProductsBySubCategoriesSlug(
  slug: string,
  subcategoryslug: string,
  page = 1,
  pageSize = 10
) {
  try {
    const res = await axiosInstance.get(`${API_ROUTES.PRODUCTS}/category/${slug}/${subcategoryslug}`, {
      params: { page, pageSize },
    });
    return res.data;
  }catch(error) {
    console.error("Error fetching products by subcategoryId:", error)
    return null;
  }
}

// ✅ Get categories for slider - with caching
let sliderCategoriesCache: { slug: string; name: string; categorySlagUrl: string; products: SliderProduct[] }[] | null = null;
let sliderCacheTimestamp: number | null = null;
const SLIDER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCategoriesForSlider = async (): Promise<
  { slug: string; name: string;  categorySlagUrl:string; products: SliderProduct[] }[]
> => {
  const now = Date.now();
  
  // Return cached data if fresh
  if (sliderCategoriesCache && sliderCacheTimestamp && (now - sliderCacheTimestamp) < SLIDER_CACHE_DURATION) {
    return sliderCategoriesCache;
  }

  try {
    const res = await axiosInstance.get(`${API_ROUTES.PRODUCTS}/category-sliders`);
    const json = res.data.data;
    console.log("Raw slider data:", json); // Debug log

    if (!Array.isArray(json)) {
      console.error("Expected array but got:", typeof json);
      return [];
    }

    // Store in cache
    const categories = json.map((cat: any) => {
      // Handle cases where products might be undefined or null
      const productsData = cat?.products || [];
      
      const products: SliderProduct[] = productsData.map((p: any) => ({
        id: p.id,
        categoryId: String(cat.id), 
        title: p.productName,
        subtitle: p.shortDescription || p.productCode || "",
        slag: p.productCode || "",
        price: p.price || p.dp || 0,
        img: p.defaultImage || p.images?.[0]?.url || cat.image || "",
        deliveryTime: "2-3 Days",
      }));

      return {
        slug: cat.slug,
        name: cat.name,
        categorySlagUrl: cat.slug,
        products,
      };
    });

    sliderCategoriesCache = categories;
    sliderCacheTimestamp = now;
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};


// ✅ Get products by category slug from slider
export const getProductsByCategory = async (
  slug: string
): Promise<SliderProduct[]> => {
  const categories = await getCategoriesForSlider();
  const category = categories.find((c) => c.slug === slug);
  return category ? category.products : [];
};


export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const res = await axiosInstance.get<{ data: Banner[] }>(
      `${API_ROUTES.BANNERS}`
    );
    return res.data.data
      .filter(b => b.isActive !== false)
      .map((b: Banner) => ({
        ...b,
        imgUrl: (b.imgUrl || b.image || "").startsWith("http")
          ? (b.imgUrl || b.image || "")
          : `${API_BASE_URL}${b.imgUrl || b.image || ""}`,
      }));
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
};

// --------------------- TYPES ---------------------
// Get all addresses
export const getAddresses = async (): Promise<Address[]> => {
  try {
    const res = await axiosInstance.get<{ data?: Address[] }>(API_ROUTES.ADDRESS);
    return res.data?.data || [];
  } catch (error) {
    console.error("Error fetching addresses:", error)
    return []
  }
}

// Add a new address
export const addAddress = async (
  address: Omit<Address, "id" | "userId">
): Promise<Address | null> => {
  try {
    const payload = toAddressPayload(address);
    const res = await axiosInstance.post<{ data?: Address }>(API_ROUTES.ADDRESS, payload);
    return res.data?.data || null;
  } catch (error: any) {
    console.error("Error adding address:", error.response?.data || error.message);
    return null;
  }
};


// Get address by ID
// Removed as not available in new API

export const updateAddress = async (
  address: Address
): Promise<boolean> => {
  try {
    if (!address.id) return false;
    const payload = toAddressPayload(address);
    await axiosInstance.put(`${API_ROUTES.ADDRESS}/${address.id}`, payload);
    return true;
  } catch (error: any) {
    console.error("Error updating address:", error.response?.data || error.message);
    return false;
  }
};



//Delete address
export const deleteAddress = async (id: number): Promise<boolean> => {
  try {
    await axiosInstance.delete(`${API_ROUTES.ADDRESS}/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting address:", error)
    return false
  }
}



// Add / remove item
export const saveOrUpdateCart = async (
  productID: string,
  quantity: number,
  type: "insert" | "remove"
): Promise<CartResponse | null> => {
  try {
    const endpoint = type === "insert" ? "/add" : "/remove";
    const payload = type === "insert" ? { productId: productID, quantity } : { productId: productID };
    const res = await axiosInstance.post(`${API_ROUTES.CARTS}${endpoint}`, payload);
    return res.data as CartResponse;
  } catch (error) {
    console.error("Error in saveOrUpdateCart:", error);
    return null;
  }
};

export const increaseCartItem = async (
  productID: string,
  amount: number = 1
): Promise<CartResponse | null> => {
  try {
    const res = await axiosInstance.post(`${API_ROUTES.CARTS}/increase`, {
      productId: productID,
      amount,
    });
    return res.data as CartResponse;
  } catch (error) {
    console.error("Error in increaseCartItem:", error);
    return null;
  }
};

export const decreaseCartItem = async (
  productID: string,
  amount: number = 1
): Promise<CartResponse | null> => {
  try {
    const res = await axiosInstance.post(`${API_ROUTES.CARTS}/decrease`, {
      productId: productID,
      amount,
    });
    return res.data as CartResponse;
  } catch (error) {
    console.error("Error in decreaseCartItem:", error);
    return null;
  }
};

// Get all cart items
export const getCartItems = async (): Promise<CartResponse | null> => {
  try {
    const res = await axiosInstance.get(`${API_ROUTES.CARTS}`);
    return res.data as CartResponse;
  } catch (error) {
    console.error("Error in getCartItems:", error);
    return null;
  }
};

// Get cart totals
export const getCartTotal = async (): Promise<CartTotal | null> => {
  try {
    const cartResponse = await getCartItems();
    if (!cartResponse || !cartResponse.data) return null;
    
    const cart = cartResponse.data;
    const items = cart.items || [];
    
    // Calculate totals from cart items
    const subTotal = items.reduce((sum: number, item: CartItem) => {
      const price = item.dp ? parseFloat(item.dp) : (item.price || 0);
      return sum + price * (item.quantity || 0);
    }, 0);
    
    return {
      subTotal,
      discount: 0, // TODO: implement discounts
      tax: 0, // TODO: implement tax
      shipping: 0, // TODO: implement shipping
      payableAmt: subTotal,
    };
  } catch (error) {
    console.error("Error in getCartTotal:", error);
    return null;
  }
};




// Checkout API
export const handleCheckoutAPI = async (
  addressId: number,
  paymentMethod: "COD" | "ONLINE",
  couponCode?: string | null
) => {
  try {
    const normalizedCoupon = typeof couponCode === "string" ? couponCode.trim().toUpperCase() : null;
    // Ensure server has latest checkout snapshot (stored in redis by userId).
    await axiosInstance.post(
      `${API_ROUTES.CHECKOUTS}/preview`,
      normalizedCoupon ? { couponCode: normalizedCoupon } : {}
    );

    const res = await axiosInstance.post(`${API_ROUTES.CHECKOUTS}/placeOrder`, { addressId, paymentMethod });
    return res.data;
  } catch (error: unknown) {
    const maybeAxios = error as { response?: { data?: any; status?: number }; message?: string };
    const message =
      maybeAxios?.response?.data?.message ||
      maybeAxios?.message ||
      "Checkout failed. Try again.";
    console.error("Checkout error:", maybeAxios?.response ?? error);
    return { success: false, message };
  }
};




export const getMyOrder = async (): Promise<Order[] | null> => {
  try {
    const res = await axiosInstance.get(`${API_ROUTES.ORDERS}`);

    // order-service `GET /v1/order` returns a paginated object: { items, page, ... }
    const data = res.data?.data;
    if (Array.isArray(data)) return data as Order[];
    if (Array.isArray(data?.items)) return data.items as Order[];
    return [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return null;
  }
};

export const getMyOrdersPage = async (
  page: number = 1,
  pageSize: number = 10
): Promise<OrdersPageData | null> => {
  try {
    const res = await axiosInstance.get(`${API_ROUTES.ORDERS}`, {
      params: { page, pageSize },
    });

    const payload = res.data?.data;
    const items = Array.isArray(payload?.items) ? (payload.items as Order[]) : [];

    return {
      items,
      page: Number(payload?.page ?? page),
      pageSize: Number(payload?.pageSize ?? pageSize),
      total: Number(payload?.total ?? 0),
      totalPages: Math.max(1, Number(payload?.totalPages ?? 1)),
    };
  } catch (error) {
    console.error("Error fetching paginated orders:", error);
    return null;
  }
};


export const getOrderDetails = async (orderNo: string): Promise<OrderDetail | null> => {
  try {
    const res = await axiosInstance.get(
      `${API_ROUTES.ORDERS}/${orderNo}`
    );
    console.log("res from order detaisl", res)
    return res.data.data;
  } catch (error) {
    console.error("Error fetching order details:", error);
    return null;
  }
};

export const cancelMyOrder = async (orderId: string | number): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await axiosInstance.post(`${API_ROUTES.ORDERS}/${orderId}/cancel`, {});
    return { success: !!res.data?.success, message: res.data?.message };
  } catch (err: any) {
    return {
      success: false,
      message: err?.response?.data?.message || err?.message || "Cancel failed",
    };
  }
};
