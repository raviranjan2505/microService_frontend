export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
export const API_ROUTES = {
  AUTH: `${API_BASE_URL}/v1/auth`,
  CATEGORIES: `${API_BASE_URL}/v1/categories`,
  PRODUCTS:`${API_BASE_URL}/v1/products`,
  BANNERS:`${API_BASE_URL}/v1/banners`,
  ADDRESS:`${API_BASE_URL}/v1/address`,
  ORDERS:`${API_BASE_URL}/v1/order`,
  CHECKOUTS:`${API_BASE_URL}/v1/checkout`,
  CARTS:`${API_BASE_URL}/v1/cart`,
  NOTIFICATIONS: `${API_BASE_URL}/v1/notification`,
};
