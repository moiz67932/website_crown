export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-xl font-semibold">You’re offline</h1>
      <p className="text-gray-600 mt-2">Some features are unavailable without internet.</p>
      <a href="/" className="mt-6 inline-block px-4 py-2 rounded bg-blue-600 text-white">Go Home</a>
    </main>
  )
}
