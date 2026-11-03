import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#20304D", soft: "#4A5A78", mute: "#7C8AA5" },
        sky: { 50: "#F4FAFF", 100: "#EAF5FF", 200: "#CFE8FD", 400: "#67B7F7", 500: "#3C9EEB", 600: "#2484D1" },
        lilac: { 100: "#EDE8FF", 200: "#DCD2FF", 400: "#A78BFA", 500: "#8B6CF0" },
        gold: { 100: "#FFF4D6", 400: "#F5C451", 500: "#E6A817" },
      },
      fontFamily: { sans: ["'Inter Variable'", "'Noto Sans'", "system-ui", "sans-serif"] },
      borderRadius: { xl2: "1.25rem", xl3: "1.75rem" },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(32,48,77,0.18)",
        lift: "0 20px 45px -18px rgba(36,132,209,0.35)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.6), 0 12px 32px -14px rgba(32,48,77,0.2)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        blob: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(30px,-20px) scale(1.08)" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(18px)" }, to: { opacity: "1", transform: "none" } },
        blink: { "0%,92%,100%": { transform: "scaleY(1)" }, "95%": { transform: "scaleY(0.1)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        blob: "blob 14s ease-in-out infinite",
        fadeUp: "fadeUp .6s cubic-bezier(.2,.7,.2,1) both",
        blink: "blink 5s infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
