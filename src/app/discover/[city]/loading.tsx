export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-pacificTeal/10 via-brand-sunsetBlush/10 to-brand-goldenHour/10">
      <div className="text-center">
        <div className="relative flex items-center justify-center mb-6">
          <span className="absolute inline-flex h-36 w-36 rounded-full bg-gradient-to-tr from-brand-sunsetBlush/30 via-brand-pacificTeal/20 to-brand-goldenHour/30 animate-pulse" />
          <svg
            className="animate-spin h-24 w-24 text-brand-pacificTeal drop-shadow-lg"
            viewBox="0 0 50 50"
            fill="none"
          >
            <circle
              className="opacity-20"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="8"
            />
            <path
              d="M45 25c0-11.046-8.954-20-20-20"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="opacity-80"
            />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-midnightCove mb-2 tracking-tight drop-shadow">
          Finding the best of the city for you...
        </h2>
        <p className="text-brand-pacificTeal/80 text-base sm:text-lg mb-1">
          Please wait while we fetch the latest listings and neighborhood insights.
        </p>
        <div className="flex justify-center mt-4">
          <span className="inline-block h-2 w-2 mx-1 rounded-full bg-brand-sunsetBlush animate-bounce [animation-delay:-0.3s]" />
          <span className="inline-block h-2 w-2 mx-1 rounded-full bg-brand-pacificTeal animate-bounce [animation-delay:-0.15s]" />
          <span className="inline-block h-2 w-2 mx-1 rounded-full bg-brand-goldenHour animate-bounce" />
        </div>
      </div>
    </div>
  )
}
