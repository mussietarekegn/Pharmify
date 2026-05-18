const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
"https://pharmify-jugv.onrender.com/api";

type MedicineFilters = {
  search?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
};

export async function getMedicines(filters: MedicineFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.category) params.append("category", filters.category);
  if (filters.min_price) params.append("min_price", filters.min_price);
  if (filters.max_price) params.append("max_price", filters.max_price);

  const queryString = params.toString();
  const url = queryString
    ? `${BASE_URL}/medicines/?${queryString}`
    : `${BASE_URL}/medicines/`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch medicines");
  }

  return res.json();
}