"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="bg-canvas text-white min-h-screen flex items-center
                       justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold mb-3">
            Something went wrong
          </h2>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-accent-500 text-canvas
                       rounded-xl font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}