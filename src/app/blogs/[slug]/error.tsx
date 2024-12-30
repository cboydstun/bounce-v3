'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <p className="text-red-500 font-semibold text-lg mb-4">
        {error.message || "Something went wrong!"}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
