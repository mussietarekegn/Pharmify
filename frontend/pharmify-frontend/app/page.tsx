import Link from "next/link"

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <h1 style={{ fontSize: "50px" }}>
        Pharmify
      </h1>

      <p>
        Modern Pharmacy Platform
      </p>

      <Link href="/register">
        <button
          style={{
            padding: "14px 24px",
            borderRadius: "10px",
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
          }}
        >
          Get Started
        </button>
      </Link>
    </div>
  )
}