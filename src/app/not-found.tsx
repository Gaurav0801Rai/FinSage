import Link  from "next/link";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center
                    justify-center p-6">
      <div className="text-center">
        <p className="text-8xl font-bold font-mono text-accent-400/20 mb-4">
          404
        </p>
        <h1 className="text-2xl font-semibold mb-3">
          Page not found
        </h1>
        <p className="text-white/50 text-sm mb-8">
          The page you are looking for does not exist.
        </p>
        <Link
          href={ROUTES.dashboard}
          className="inline-flex items-center gap-2 px-6 py-3
                     btn-glow rounded-xl font-medium"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}