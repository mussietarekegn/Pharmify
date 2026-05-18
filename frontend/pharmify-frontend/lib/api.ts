const BASE_URL = "https://pharmify-jugv.onrender.com/api";

export async function getMedicines() {
  const res = await fetch(`${BASE_URL}/medicines/`);

  if (!res.ok) {
    throw new Error("Failed to fetch medicines");
  }

  return res.json();
}