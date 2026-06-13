/** @type {import('next').NextConfig} */
const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
if (key) {
  console.log("=== Vercel Build Key Diagnostic ===");
  console.log("Key Length:", key.length);
  console.log("Key starts with BEGIN:", key.startsWith("-----BEGIN PRIVATE KEY-----"));
  console.log("Key ends with END (trimmed):", key.trim().endsWith("-----END PRIVATE KEY-----"));
  console.log("Key contains literal \\n?", key.includes("\\n"));
  console.log("Key contains actual newline?", key.includes("\n"));
  console.log("Key starts with quotes?", key.startsWith('"') || key.startsWith("'"));
  console.log("First 60 chars of key:", key.substring(0, 60));
  console.log("Last 60 chars of key:", key.substring(key.length - 60));
  console.log("====================================");
} else {
  console.log("=== Vercel Build Key Diagnostic: key is missing ===");
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // for portfolio screenshot uploads
    },
  },
};

export default nextConfig;