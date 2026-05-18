import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1
        style={{
          fontSize: "60px",
          marginBottom: "20px",
          color: "#38bdf8",
        }}
      >
        Pharmify
      </h1>

      <p
        style={{
          maxWidth: "700px",
          fontSize: "20px",
          lineHeight: "1.7",
          color: "#cbd5e1",
        }}
      >
        Find medicines, pharmacies, AI health guidance,
        and manage pharmacy services easily.
      </p>

      <div
        style={{
          marginTop: "30px",
          display: "flex",
          gap: "20px",
        }}
      >
        <Link href="/register">
          <button
            style={{
              background: "#38bdf8",
              border: "none",
              padding: "15px 25px",
              borderRadius: "10px",
              color: "black",
              fontWeight: "bold",
            }}
          >
            Get Started
          </button>
        </Link>

        <Link href="/medicines">
          <button
            style={{
              background: "#1e293b",
              border: "1px solid #38bdf8",
              padding: "15px 25px",
              borderRadius: "10px",
              color: "white",
            }}
          >
            Explore Medicines
          </button>
        </Link>
      </div>
    </div>
  );
}