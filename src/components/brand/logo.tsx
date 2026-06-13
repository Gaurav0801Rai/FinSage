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
          {/* Modern abstract swoosh F logo matching the reference image */}
          <path
            d="M7 6C15 6 22 7 26 10C21 12 16 14 12 18C12 13 10 9 7 6Z"
            fill="url(#logo-gold-grad)"
          />
          <path
            d="M8 15C13 16 18 18 21 21C17 22 14 25 12 29C12 24 11 20 8 15Z"
            fill="url(#logo-blue-grad)"
          />
          <defs>
            <linearGradient
              id="logo-gold-grad"
              x1="7"
              y1="6"
              x2="26"
              y2="18"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFC837" />
              <stop offset="1" stopColor="#FFD700" />
            </linearGradient>
            <linearGradient
              id="logo-blue-grad"
              x1="8"
              y1="15"
              x2="21"
              y2="29"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00E5FF" />
              <stop offset="1" stopColor="#1F4E79" />
            </linearGradient>
          </defs>
        </svg>
        {/* Glow */}
        <div className="absolute inset-0 blur-md opacity-30 bg-[#FFC837]/30 rounded-full" />
      </div>
      {showText && (
        <span className={cn("font-bold uppercase tracking-[1.2px] text-[#FFC837] font-sans", text)}>
          FINSAGE
        </span>
      )}
    </div>
  );
}