// Files stored on the API server ("/uploads/...") must be loaded from the API origin
const API_ORIGIN = String(import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

export const assetUrl = (url) => {
  if (typeof url !== "string" || !url) return "";
  if (url.startsWith("/uploads/")) return `${API_ORIGIN}${url}`;
  return /^https?:\/\//i.test(url) ? url : "";
};
