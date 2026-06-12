import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { icon: 20, text: "text-[16px]" },
  md: { icon: 28, text: "text-[18px]" },
  lg: { icon: 36, text: "text-[22px]" },
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
          {/* Modern geometric F shape for FinSage */}
          <path
            d="M8 6h16v4H12v6h10v4H12v8H8V6z"
            fill="url(#logo-gradient)"
          />
          <defs>
            <linearGradient
              id="logo-gradient"
              x1="8"
              y1="6"
              x2="24"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#E2B659" />
              <stop offset="1" stopColor="#D4AF37" />
            </linearGradient>
          </defs>
        </svg>
        {/* Glow */}
        <div className="absolute inset-0 blur-md opacity-30 bg-[#E2B659]/30 rounded-full" />
      </div>
      {showText && (
        <span className={cn("font-bold uppercase tracking-[1.2px] text-[#E2B659] font-sans", text)}>
          FINSAGE
        </span>
      )}
    </div>
  );
}