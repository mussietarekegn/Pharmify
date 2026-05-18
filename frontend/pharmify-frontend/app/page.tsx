export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h1 className="text-5xl font-bold text-green-600 mb-6">
        Pharmify
      </h1>

      <p className="text-xl text-gray-600 mb-8">
        Find medicines from trusted pharmacies.
      </p>

      <button className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg">
        Explore Medicines
      </button>
    </div>
  );
}