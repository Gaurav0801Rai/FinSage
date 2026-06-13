import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // The canvas — deep space, not pure black (pure black is too harsh)
        canvas: {
          DEFAULT: "#090D12",
          elevated: "#121820",
          inset: "#0E131A",
        },

        // Glass surface tokens — use these for cards
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.03)",
          hover: "rgba(255, 255, 255, 0.05)",
          border: "rgba(255, 255, 255, 0.06)",
          "border-hover": "rgba(255, 255, 255, 0.12)",
        },

        // Gold accent — the signature color
        accent: {
          50: "#FFFBEB",
          100: "#FDF5D2",
          200: "#FBECA5",
          300: "#F8DF78",
          400: "#FFD700", // secondary bright gold
          500: "#FFC837", // main vibrant gold
          600: "#E5B22F",
          700: "#C1931E",
          800: "#9E7615",
          900: "#7A590D",
          glow: "rgba(255, 200, 55, 0.45)",
        },

        // Trust Blue accent
        trustBlue: {
          DEFAULT: "#1F4E79",
          secondary: "#1A365D",
          glow: "rgba(31, 78, 121, 0.3)",
        },

        // Semantic finance colors
        gain: {
          DEFAULT: "#10B981", // emerald — for positive P&L
          glow: "rgba(16, 185, 129, 0.3)",
          subtle: "rgba(16, 185, 129, 0.1)",
        },
        loss: {
          DEFAULT: "#F43F5E", // rose — for negative P&L
          glow: "rgba(244, 63, 94, 0.3)",
          subtle: "rgba(244, 63, 94, 0.1)",
        },
        neutral: {
          DEFAULT: "#94A3B8",
          subtle: "rgba(148, 163, 184, 0.1)",
        },

        // Alert severity colors
        severity: {
          high: "#F43F5E",
          medium: "#FFC837",
          low: "#3B82F6",
        },
      },

      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },

      fontSize: {
        // Tighter scale for finance UI
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.05em" }],
      },

      borderRadius: {
        // Generous but not playful
        "2xl": "1rem",
        "3xl": "1.25rem",
      },

      backdropBlur: {
        xs: "2px",
      },

      backgroundImage: {
        // The ambient glow used in root layout
        "amber-glow":
          "radial-gradient(circle at 50% 0%, rgba(226, 182, 89, 0.12), transparent 50%)",
        "amber-glow-subtle":
          "radial-gradient(circle at 50% 50%, rgba(226, 182, 89, 0.06), transparent 70%)",
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
      },

      backgroundSize: {
        grid: "60px 60px",
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-in-up": "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "ticker-scroll": "tickerScroll 60s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(226, 182, 89, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(226, 182, 89, 0.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        tickerScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;