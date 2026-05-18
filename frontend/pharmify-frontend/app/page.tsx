"use client";

import { useEffect, useState } from "react";
import { getMedicines } from "@/lib/api";

type Medicine = {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
};

export default function Home() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  async function loadData() {
    setLoading(true);

    try {
      const data = await getMedicines({
        search,
        category,
        min_price: minPrice,
        max_price: maxPrice,
      });

      setMedicines(data.results || data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  // auto fetch when filters change
  useEffect(() => {
    loadData();
  }, [search, category, minPrice, maxPrice]);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        💊 Pharmify Medicines
      </h1>

      {/* SEARCH + FILTERS */}
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <input
          className="border p-2 rounded"
          placeholder="Search medicine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          placeholder="Min Price"
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          placeholder="Max Price"
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {medicines.map((med) => (
            <div
              key={med.id}
              className="border rounded-xl p-4 shadow"
            >
              <h2 className="text-xl font-semibold">
                {med.name}
              </h2>

              <p className="text-gray-600 mt-2">
                {med.description?.slice(0, 80)}
              </p>

              <p className="mt-3 font-bold">
                💰 ${med.price}
              </p>

              <p className="text-sm text-gray-500">
                Category: {med.category}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}