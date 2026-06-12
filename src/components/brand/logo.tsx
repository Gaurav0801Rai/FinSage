import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { icon: 20, text: "text-base" },
  md: { icon: 28, text: "text-lg" },
  lg: { icon: 36, text: "text-2xl" },
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Pulse waveform — symbolic of "Portfolio Pulse" */}
          <path
            d="M2 16 L8 16 L11 10 L14 22 L17 6 L20 24 L23 14 L26 16 L30 16"
            stroke="url(#logo-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient
              id="logo-gradient"
              x1="2"
              y1="16"
              x2="30"
              y2="16"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FBBF24" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
        {/* Glow */}
        <div className="absolute inset-0 blur-md opacity-50 bg-accent-glow rounded-full" />
      </div>
      {showText && (
        <span className={cn("font-semibold tracking-tight", text)}>
          Fin<span className="text-accent-400">Sage</span>
        </span>
      )}
    </div>
  );
}