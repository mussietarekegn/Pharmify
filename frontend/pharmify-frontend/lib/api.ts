const BASE_URL = "https://pharmify-jugv.onrender.com/api";

export async function getMedicines(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.category) params.append("category", filters.category);
  if (filters.min_price) params.append("min_price", filters.min_price);
  if (filters.max_price) params.append("max_price", filters.max_price);

  const res = await fetch(`${BASE_URL}/medicines/?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Failed to fetch medicines");
  }

  return res.json();
}