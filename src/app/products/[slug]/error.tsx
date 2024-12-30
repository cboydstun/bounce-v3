'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4">
      <p className="text-red-500 font-semibold text-lg">
        {error.message || "Product not found"}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
