"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
      <Link href="/">
        <h1 className="text-2xl font-bold text-green-600">
          Pharmify
        </h1>
      </Link>

      <div className="flex gap-6 items-center">
        <Link href="/medicines">Medicines</Link>
        <Link href="/cart">
          <ShoppingCart />
        </Link>
        <Link
          href="/login"
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Login
        </Link>
      </div>
    </nav>
  );
}