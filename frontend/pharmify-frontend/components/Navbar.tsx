"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      style={{
        background: "#111827",
        padding: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2 style={{ color: "#38bdf8" }}>Pharmify</h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
        }}
      >
        <Link href="/">Home</Link>
        <Link href="/medicines">Medicines</Link>
        <Link href="/favorites">Favorites</Link>
        <Link href="/cart">Cart</Link>
        <Link href="/orders">Orders</Link>
        <Link href="/login">Login</Link>
      </div>
    </nav>
  );
}