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

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getMedicines();
        setMedicines(data.results || data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-xl">
        Loading medicines...
      </div>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        💊 Pharmify Medicines
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {medicines.map((med) => (
          <div
            key={med.id}
            className="border rounded-xl p-4 shadow hover:shadow-lg transition"
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
    </main>
  );
}